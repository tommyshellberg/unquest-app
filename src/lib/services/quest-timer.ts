import 'react-native-get-random-values'; // Import for crypto.randomUUID

import { Platform } from 'react-native';
import BackgroundService from 'react-native-bg-actions';
import { OneSignal } from 'react-native-onesignal';
import { v4 as uuidv4 } from 'uuid'; // Use uuid for unique IDs

import {
  areNotificationsEnabled,
  clearAllNotifications,
  scheduleQuestCompletionNotification,
} from '@/lib/services/notifications';
import {
  createQuestRun,
  updateQuestRunStatus,
} from '@/lib/services/quest-run-service';
import { getItem, removeItem, setItem } from '@/lib/storage';
import { useQuestStore } from '@/store/quest-store';
import {
  type CustomQuestTemplate,
  type StoryQuestTemplate,
} from '@/store/types';

// --- Linter Fix for Type Errors ---
// Helper function to safely parse JSON from storage
function parseJson<T>(jsonString: string | null | undefined): T | null {
  if (jsonString && typeof jsonString === 'string') {
    try {
      return JSON.parse(jsonString) as T;
    } catch (e) {
      console.error('Failed to parse JSON from storage:', e);
      return null;
    }
  }
  return null;
}

// Helper function to safely parse Int from storage
function parseIntSafe(value: string | null | undefined): number | null {
  if (value && typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return !isNaN(parsed) ? parsed : null;
  }
  return null;
}
// --- End Linter Fix ---

// REVERT: No longer need custom activity type string
// const QUEST_ACTIVITY_TYPE = 'QuestActivityAttributes';

export default class QuestTimer {
  private static isPhoneLocked: boolean = false;
  private static questStartTime: number | null = null;
  private static questTemplate:
    | (CustomQuestTemplate | StoryQuestTemplate)
    | null = null;
  // Store the OneSignal activity ID (this replaces the old liveActivityId)
  private static oneSignalActivityId: string | null = null;
  // Add quest run ID to track the server-side quest run
  private static questRunId: string | null = null;

  // Helper methods to persist quest data
  private static async saveQuestData() {
    if (this.questTemplate) {
      try {
        setItem('QUEST_TIMER_TEMPLATE', JSON.stringify(this.questTemplate));

        if (this.questStartTime) {
          setItem('QUEST_TIMER_START_TIME', this.questStartTime.toString());
        }

        // Save the OneSignal Activity ID if it exists
        if (this.oneSignalActivityId) {
          setItem('ONESIGNAL_ACTIVITY_ID', this.oneSignalActivityId);
        } else {
          // Ensure old ID is removed if activity ends
          removeItem('ONESIGNAL_ACTIVITY_ID');
        }

        // Save quest run ID
        if (this.questRunId) {
          setItem('QUEST_RUN_ID', this.questRunId);
        } else {
          removeItem('QUEST_RUN_ID');
        }
      } catch (error) {
        console.error('Error saving quest data:', error);
      }
    }
  }

  // @TODO: why are we calling this in the backgroundTask method? It should only be called once, right?
  private static loadQuestData() {
    try {
      // Use the safe parsing helper
      const templateJson = getItem<string>('QUEST_TIMER_TEMPLATE');
      if (templateJson) {
        this.questTemplate = parseJson<
          CustomQuestTemplate | StoryQuestTemplate
        >(templateJson);
      }

      // Use the safe parsing helper
      const startTimeStr = getItem<string>('QUEST_TIMER_START_TIME');
      this.questStartTime = parseIntSafe(startTimeStr);

      // Load the OneSignal Activity ID
      this.oneSignalActivityId = getItem<string>('ONESIGNAL_ACTIVITY_ID');

      // Load quest run ID
      this.questRunId = getItem<string>('QUEST_RUN_ID');

      // Update the store with the live activity ID if it exists
      if (this.oneSignalActivityId) {
        const store = useQuestStore.getState();
        if (typeof store.setLiveActivityId === 'function') {
          store.setLiveActivityId(this.oneSignalActivityId);
        } else {
          console.warn(
            'setLiveActivityId function not found in quest store state.'
          );
        }
      }
    } catch (error) {
      console.error('Error loading quest data:', error);
    }
  }

  private static async clearQuestData() {
    try {
      removeItem('QUEST_TIMER_TEMPLATE');
      removeItem('QUEST_TIMER_START_TIME');
      removeItem('ONESIGNAL_ACTIVITY_ID'); // Clear OneSignal ID
      removeItem('QUEST_RUN_ID'); // Clear quest run ID
    } catch (error) {
      console.error('Error clearing quest data:', error);
    }
  }

  // Single entry point - prepare the quest and wait for phone lock
  static async prepareQuest(
    questTemplate: CustomQuestTemplate | StoryQuestTemplate
  ) {
    const notificationsEnabled = await areNotificationsEnabled();
    if (notificationsEnabled) {
      await clearAllNotifications();
    }

    this.questTemplate = questTemplate;
    this.questStartTime = null;

    // Create a quest run on the server
    try {
      const questRun = await createQuestRun(questTemplate);
      this.questRunId = questRun.id;
    } catch (error) {
      console.error('Failed to create quest run:', error);
      // Continue anyway as the quest can still work locally
    }

    const pendingQuestTitle = 'Quest Ready';
    const pendingTaskDesc = 'Lock your phone to begin your quest';

    if (Platform.OS === 'ios') {
      try {
        if (!this.oneSignalActivityId) {
          this.oneSignalActivityId = uuidv4();
        }
        // Construct attributes and content with status='pending'
        const attributes = {
          title: pendingQuestTitle,
          description: pendingTaskDesc,
        };
        const pendingContent = {
          durationMinutes: questTemplate.durationMinutes,
          status: 'pending', // Using status instead of pending boolean
        };
        OneSignal.LiveActivities.startDefault(
          this.oneSignalActivityId,
          attributes,
          pendingContent
        );
        const store = useQuestStore.getState();
        if (typeof store.setLiveActivityId === 'function') {
          store.setLiveActivityId(this.oneSignalActivityId);
        }
      } catch (error) {
        console.error(
          'Error starting pending OneSignal Live Activity (Default):',
          error
        );
        this.oneSignalActivityId = null;
      }
    }

    await this.saveQuestData();

    // Android Background Service Setup (remains the same)
    const options = {
      taskName: 'QuestTimer',
      taskTitle: pendingQuestTitle,
      taskDesc: pendingTaskDesc,
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
      color: '#77c5bf',
      progressBar: {
        max: 100,
        value: 0,
        indeterminate: true,
      },
      parameters: {
        questDuration: questTemplate.durationMinutes * 60 * 1000,
        questTitle: questTemplate.title,
        questDescription:
          ('recap' in questTemplate
            ? questTemplate.recap
            : questTemplate.title) || 'Focus on your quest',
        questId: questTemplate.id,
      },
    };

    try {
      await BackgroundService.start(this.backgroundTask, options);
    } catch (error) {
      console.error('Failed to start background service:', error);
    }
  }

  // Called from the lock state listener when phone is locked
  static async onPhoneLocked() {
    console.log('Phone locked');

    // Early return if we're already in the locked state
    if (this.isPhoneLocked) {
      console.log('Phone already marked as locked, ignoring duplicate call');
      return;
    }

    this.isPhoneLocked = true;
    this.loadQuestData();

    if (this.questTemplate && !this.questStartTime) {
      this.questStartTime = Date.now();
      console.log('Quest started at', new Date(this.questStartTime));

      if (Platform.OS === 'ios') {
        // Use the existing live activity ID if present.
        const activityId = this.oneSignalActivityId || uuidv4();
        // Construct updated attributes and content with status='active'
        const attributes = {
          title: this.questTemplate.title,
          description:
            'description' in this.questTemplate
              ? this.questTemplate.description
              : 'Focus on your quest',
        };
        const updatedContent = {
          durationMinutes: this.questTemplate.durationMinutes,
          status: 'active', // Using status='active' instead of pending=false
        };
        console.log(
          'Updating Live Activity for quest start with attributes:',
          JSON.stringify(attributes)
        );
        console.log('Updated content:', JSON.stringify(updatedContent));
        OneSignal.LiveActivities.startDefault(
          activityId,
          attributes,
          updatedContent
        );
        this.oneSignalActivityId = activityId;
        console.log('Live Activity updated with id:', activityId);
      }

      // Update quest run status to active
      if (this.questRunId) {
        try {
          await updateQuestRunStatus(
            this.questRunId,
            'active',
            this.oneSignalActivityId
          );
          console.log('Updated quest run status to active');
        } catch (error) {
          console.error('Failed to update quest run status to active:', error);
          // Continue anyway as the quest can still work locally
        }
      }

      await this.saveQuestData();

      // IMPORTANT CHANGE: Use setTimeout to delay store update when in background
      setTimeout(() => {
        // Only update store if phone is still locked
        if (this.isPhoneLocked) {
          const questStore = useQuestStore.getState();
          // Check if there's already an active quest to prevent double-starting
          if (!questStore.activeQuest && this.questTemplate) {
            const startTime = this.questStartTime || Date.now(); // Ensure startTime is never null
            questStore.startQuest({
              ...this.questTemplate,
              startTime,
            });
          }
        }
      }, 500);

      console.log('Updating Android notification...');
      await BackgroundService.updateNotification({
        taskTitle: `Quest in progress: ${this.questTemplate.title}`,
        taskDesc: `Keep your phone locked for ${this.questTemplate.durationMinutes} minutes to complete the quest`,
        progressBar: {
          max: 100,
          value: 0,
          indeterminate: false,
        },
      });
    } else {
      console.log('Quest already started or template missing on phone lock.');
    }
  }

  // Modified onPhoneUnlocked to fail immediately only when quest is still in progress
  static async onPhoneUnlocked() {
    console.log('Phone unlocked');
    this.isPhoneLocked = false;

    await this.loadQuestData();

    if (this.questStartTime && this.questTemplate) {
      const elapsedTime = Date.now() - this.questStartTime;
      const questDurationMs = this.questTemplate.durationMinutes * 60 * 1000;

      if (elapsedTime < questDurationMs) {
        console.log(
          'Immediately failing quest due to phone unlock during progress.'
        );

        // Use status='failed' when ending OneSignal Live Activity
        if (Platform.OS === 'ios' && this.oneSignalActivityId) {
          try {
            console.log(
              `Updating OneSignal Live Activity ${this.oneSignalActivityId} with failed status`
            );
            const failedAttributes = {
              title: 'Quest Failed',
              description: 'Try again next time',
            };
            const failedContent = {
              durationMinutes: this.questTemplate.durationMinutes,
              status: 'failed', // Set status to failed instead of ending activity
            };
            OneSignal.LiveActivities.startDefault(
              this.oneSignalActivityId,
              failedAttributes,
              failedContent
            );
          } catch (error) {
            console.error(
              'Error ending OneSignal Live Activity (Failure):',
              error
            );
          }
        }

        // Update quest run status to failed
        if (this.questRunId) {
          try {
            await updateQuestRunStatus(this.questRunId, 'failed');
            console.log('Updated quest run status to failed');
          } catch (error) {
            console.error(
              'Failed to update quest run status to failed:',
              error
            );
          }
        }

        const questStoreState = useQuestStore.getState();
        questStoreState.failQuest();
        await this.stopQuest(); // stopQuest also calls clearQuestData
      } else {
        // Quest completed successfully before unlock or exactly at unlock
        // Note: Server will automatically mark the quest as successful, so no need to call updateQuestRunStatus here
        console.log(
          'Phone unlocked, but quest duration met or exceeded. Quest considered complete.'
        );

        // Ensure completion state is set if somehow missed by background task
        const questStoreState = useQuestStore.getState();
        if (questStoreState.activeQuest) {
          questStoreState.completeQuest(true); // Force completion if needed
        }
      }
    } else {
      console.log('No active quest found on unlock.');
    }
  }

  // Background task now also updates OneSignal Live Activity progress
  private static backgroundTask = async (taskData?: {
    questDuration: number;
    questTitle: string;
    questId: string;
    questDescription: string;
  }) => {
    console.log('Background task started', taskData);
    if (!taskData) return;

    // Load quest data initially - only once
    await this.loadQuestData();

    // Use questId from taskData for Live Activity ID consistency
    const currentActivityId = this.oneSignalActivityId;
    const { questDuration } = taskData;

    while (BackgroundService.isRunning()) {
      if (this.isPhoneLocked && this.questStartTime && this.questTemplate) {
        const elapsedTime = Date.now() - this.questStartTime;
        const progress = Math.min(
          Math.round((elapsedTime / questDuration) * 100),
          100
        );

        // Update Android notification
        await BackgroundService.updateNotification({
          progressBar: {
            max: 100,
            value: progress,
            indeterminate: false,
          },
        });

        // Check if quest is complete
        if (elapsedTime >= questDuration) {
          console.log(
            'Quest completed in background task:',
            this.questTemplate.id
          );

          // Update OneSignal Live Activity with status='completed'
          if (Platform.OS === 'ios' && currentActivityId) {
            const completionAttributes = {
              title: 'Quest Complete',
              description: 'Congratulations on finishing your quest!',
            };
            const completionContent = {
              durationMinutes: this.questTemplate.durationMinutes,
              status: 'completed', // Use status instead of boolean flags
            };
            console.log(
              `Updating Live Activity ${currentActivityId} with completed status`
            );
            OneSignal.LiveActivities.startDefault(
              currentActivityId,
              completionAttributes,
              completionContent
            );
          }
          // --- End Live Activity Update ---

          const questStoreState = useQuestStore.getState();
          if (questStoreState.activeQuest?.id === this.questTemplate.id) {
            questStoreState.completeQuest(true); // Mark quest as complete in the store
          }
          // for now only schedule for Android
          if (Platform.OS === 'android') {
            await scheduleQuestCompletionNotification(); // Schedule completion notification
          }
          await this.stopQuest(); // Stop background service and clear data
          break; // Exit loop
        }
      } else if (!this.isPhoneLocked && this.questStartTime) {
        // Phone was unlocked while quest was running - failQuest handled by onPhoneUnlocked
        // We might need to stop the background task here if onPhoneUnlocked doesn't trigger stopQuest reliably
        console.log('Background task detected unlock, stopping.');
        await this.stopQuest(); // Consider adding this if needed
        break; // Exit loop
      }

      // Adjust update interval based on duration to save battery
      const updateInterval = Math.min(
        Math.max(questDuration / 100, 1000),
        15000
      ); // Update at least every second, max 15s
      await new Promise((resolve) => setTimeout(resolve, updateInterval));
    }
    console.log('Background task finished for quest:', taskData.questId);
  };

  static async stopQuest() {
    console.log('Stopping quest timer and background service.');
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }

    this.questTemplate = null;
    this.questStartTime = null;

    // Clear quest data from storage
    await this.clearQuestData();
  }

  static isRunning(): boolean {
    return BackgroundService.isRunning();
  }
}
