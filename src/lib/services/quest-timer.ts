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

  // Helper methods to persist quest data
  private static async saveQuestData() {
    if (this.questTemplate) {
      try {
        await setItem(
          'QUEST_TIMER_TEMPLATE',
          JSON.stringify(this.questTemplate)
        );

        if (this.questStartTime) {
          await setItem(
            'QUEST_TIMER_START_TIME',
            this.questStartTime.toString()
          );
        }

        // Save the OneSignal Activity ID if it exists
        if (this.oneSignalActivityId) {
          await setItem('ONESIGNAL_ACTIVITY_ID', this.oneSignalActivityId);
        } else {
          // Ensure old ID is removed if activity ends
          await removeItem('ONESIGNAL_ACTIVITY_ID');
        }
      } catch (error) {
        console.error('Error saving quest data:', error);
      }
    }
  }

  // @TODO: why are we calling this in the backgroundTask method? It should only be called once, right?
  private static async loadQuestData() {
    try {
      // Use the safe parsing helper
      const templateJson = await getItem<string>('QUEST_TIMER_TEMPLATE');
      if (templateJson) {
        this.questTemplate = parseJson<
          CustomQuestTemplate | StoryQuestTemplate
        >(templateJson);
      }

      // Use the safe parsing helper
      const startTimeStr = await getItem<string>('QUEST_TIMER_START_TIME');
      this.questStartTime = parseIntSafe(startTimeStr);

      // Load the OneSignal Activity ID
      this.oneSignalActivityId = await getItem<string>('ONESIGNAL_ACTIVITY_ID');

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
      await removeItem('QUEST_TIMER_TEMPLATE');
      await removeItem('QUEST_TIMER_START_TIME');
      await removeItem('ONESIGNAL_ACTIVITY_ID'); // Clear OneSignal ID
      console.log('Quest data cleared from storage');
    } catch (error) {
      console.error('Error clearing quest data:', error);
    }
  }

  // Single entry point - prepare the quest and wait for phone lock
  static async prepareQuest(
    questTemplate: CustomQuestTemplate | StoryQuestTemplate
  ) {
    console.log('Preparing quest (Default Attributes):', questTemplate.title);

    const notificationsEnabled = await areNotificationsEnabled();
    if (notificationsEnabled) {
      await clearAllNotifications();
    }

    this.questTemplate = questTemplate;
    this.questStartTime = null;

    const pendingQuestTitle = 'Quest Ready';
    const pendingTaskDesc = 'Lock your phone to begin your quest';
    // For pending live activity, clear any previous activity ID
    // (We now always want to create a pending live activity when a quest is prepared.)

    if (Platform.OS === 'ios') {
      try {
        if (!this.oneSignalActivityId) {
          this.oneSignalActivityId = uuidv4();
        }
        // Construct attributes and content for pending live activity.
        // Use Date.now() as startTime so that pending progress remains 0%.
        const attributes = {
          title: pendingQuestTitle,
          description: pendingTaskDesc,
        };
        const pendingContent = {
          durationMinutes: questTemplate.durationMinutes,
          pending: true,
        };
        console.log(
          'Starting pending Live Activity with attributes:',
          JSON.stringify(attributes)
        );
        console.log('Pending content:', JSON.stringify(pendingContent));
        OneSignal.LiveActivities.startDefault(
          this.oneSignalActivityId,
          attributes,
          pendingContent
        );
        const store = useQuestStore.getState();
        if (typeof store.setLiveActivityId === 'function') {
          store.setLiveActivityId(this.oneSignalActivityId);
          console.log(
            'Live Activity ID set in store (pending):',
            this.oneSignalActivityId
          );
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
      console.log('Background service started for quest:', questTemplate.id);
    } catch (error) {
      console.error('Failed to start background service:', error);
    }
  }

  // Called from the lock state listener when phone is locked
  static async onPhoneLocked() {
    console.log('Phone locked');
    this.isPhoneLocked = true;

    await this.loadQuestData(); // Load data in case app was closed

    if (this.questTemplate && !this.questStartTime) {
      this.questStartTime = Date.now();
      console.log('Quest started at', new Date(this.questStartTime));

      if (Platform.OS === 'ios') {
        // Use the existing live activity ID if present.
        const activityId = this.oneSignalActivityId || uuidv4();
        // Construct updated attributes and content using the new start time.
        const attributes = {
          title: this.questTemplate.title,
          description:
            'description' in this.questTemplate
              ? this.questTemplate.description
              : 'Focus on your quest',
        };
        const updatedContent = {
          durationMinutes: this.questTemplate.durationMinutes,
          pending: false,
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

      await this.saveQuestData();

      const questStoreState = useQuestStore.getState();
      questStoreState.startQuest({
        ...this.questTemplate,
        startTime: this.questStartTime,
      });
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

        // --- End OneSignal Live Activity (Failure) ---
        if (Platform.OS === 'ios' && this.oneSignalActivityId) {
          try {
            console.log(
              `Ending OneSignal Live Activity ${this.oneSignalActivityId} (Failure)`
            );
            OneSignal.LiveActivities.exit(this.oneSignalActivityId);
            this.oneSignalActivityId = null;
            const store = useQuestStore.getState();
            if (typeof store.setLiveActivityId === 'function') {
              store.setLiveActivityId(null);
            }
          } catch (error) {
            console.error(
              'Error ending OneSignal Live Activity (Failure):',
              error
            );
          }
        }
        // --- End OneSignal Live Activity (Failure) ---

        const questStoreState = useQuestStore.getState();
        questStoreState.failQuest();
        await this.stopQuest(); // stopQuest also calls clearQuestData
      } else {
        // Quest completed successfully before unlock or exactly at unlock
        console.log(
          'Phone unlocked, but quest duration met or exceeded. Quest considered complete.'
        );
        // Note: Live activity completion is handled by the background task now

        // Ensure completion state is set if somehow missed by background task
        const questStoreState = useQuestStore.getState();
        if (questStoreState.activeQuest) {
          questStoreState.completeQuest(true); // Force completion if needed
          // Live Activity should have been ended by background task, but end here just in case
          // @todo: update the live activity with a success message.
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
    // Include quest ID for Live Activity updates
    questId: string;
    questDescription: string;
  }) => {
    console.log('Background task started', taskData);
    if (!taskData) return;

    // Load quest data initially
    await this.loadQuestData();

    // Use questId from taskData for Live Activity ID consistency
    const currentActivityId = this.oneSignalActivityId || taskData.questId;
    const { questDuration } = taskData;

    while (BackgroundService.isRunning()) {
      // Reload quest data periodically
      // @TODO: why are we calling this in the backgroundTask method? It should only be called once, right?
      // await this.loadQuestData();

      if (this.isPhoneLocked && this.questStartTime && this.questTemplate) {
        console.log('Background task is running');

        const elapsedTime = Date.now() - this.questStartTime;
        const progress = Math.min(
          Math.round((elapsedTime / questDuration) * 100),
          100
        );
        console.log('progress', progress);
        console.log('elapsedTime', elapsedTime);
        console.log('questDuration', questDuration);

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

          // --- Update OneSignal Live Activity (Quest Complete) ---
          if (Platform.OS === 'ios' && currentActivityId) {
            const completionAttributes = {
              title: 'Quest Complete',
              description: 'Congratulations on finishing your quest!',
            };
            const completionContent = {
              durationMinutes: this.questTemplate.durationMinutes,
              pending: false,
              completed: true,
            };
            console.log(
              `Updating Live Activity ${currentActivityId} with Quest Complete message.`
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
        // await this.stopQuest(); // Consider adding this if needed
        // break; // Exit loop
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

  // Helper function to end Live Activity cleanly
  static async endLiveActivity(activityId?: string) {
    const idToEnd = activityId || this.oneSignalActivityId;
    if (Platform.OS === 'ios' && idToEnd) {
      // Removed template/startTime check as exit only needs ID
      try {
        console.log(`Ending OneSignal Live Activity ${idToEnd}`);
        OneSignal.LiveActivities.exit(idToEnd);

        if (idToEnd === this.oneSignalActivityId) {
          this.oneSignalActivityId = null;
          const store = useQuestStore.getState();
          if (typeof store.setLiveActivityId === 'function') {
            store.setLiveActivityId(null);
          }
        }
        await this.saveQuestData();
      } catch (error) {
        console.error(
          `Error ending OneSignal Live Activity (${idToEnd}):`,
          error
        );
      }
    }
  }

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
