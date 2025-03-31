import BackgroundService from 'react-native-bg-actions';

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

export default class QuestTimer {
  private static isPhoneLocked: boolean = false;
  private static questStartTime: number | null = null;
  private static questTemplate:
    | (CustomQuestTemplate | StoryQuestTemplate)
    | null = null;

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
      } catch (error) {
        console.error('Error saving quest data:', error);
      }
    }
  }

  private static async loadQuestData() {
    try {
      const templateJson = await getItem('QUEST_TIMER_TEMPLATE');
      if (templateJson) {
        this.questTemplate = JSON.parse(templateJson);
      }

      const startTimeStr = await getItem('QUEST_TIMER_START_TIME');
      if (startTimeStr) {
        this.questStartTime = parseInt(startTimeStr, 10);
      }
    } catch (error) {
      console.error('Error loading quest data:', error);
    }
  }

  private static async clearQuestData() {
    try {
      await removeItem('QUEST_TIMER_TEMPLATE');
      await removeItem('QUEST_TIMER_START_TIME');
      console.log('Quest data cleared from storage');
    } catch (error) {
      console.error('Error clearing quest data:', error);
    }
  }

  // Single entry point - prepare the quest and wait for phone lock
  static async prepareQuest(
    questTemplate: CustomQuestTemplate | StoryQuestTemplate
  ) {
    console.log('preparing quest', questTemplate);

    // Clear any existing notifications before starting a new quest
    const notificationsEnabled = await areNotificationsEnabled();
    if (notificationsEnabled) {
      await clearAllNotifications();
    }

    this.questTemplate = questTemplate;
    this.questStartTime = null;

    // Save quest template to persistent storage
    await this.saveQuestData();

    const options = {
      taskName: 'QuestTimer',
      taskTitle: 'Quest Ready',
      taskDesc: 'Lock your phone to begin your quest',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
      color: '#228B22', // forest green
      progressBar: {
        max: 100,
        value: 0,
        indeterminate: true,
      },
      parameters: {
        questDuration: questTemplate.durationMinutes * 60 * 1000,
        questTitle: questTemplate.title,
      },
    };

    await BackgroundService.start(this.backgroundTask, options);
  }

  // Called from the lock state listener when phone is locked
  static async onPhoneLocked() {
    console.log('Phone locked');
    this.isPhoneLocked = true;

    // Load quest data from storage in case it was lost
    await this.loadQuestData();

    console.log('Quest template after load', this.questTemplate);
    console.log('Quest start time after load', this.questStartTime);

    if (this.questTemplate && !this.questStartTime) {
      this.questStartTime = Date.now();
      console.log('Quest started at', new Date(this.questStartTime));

      // Save the start time to persistent storage
      await this.saveQuestData();

      const questStoreState = useQuestStore.getState();
      questStoreState.startQuest({
        ...this.questTemplate,
        startTime: this.questStartTime,
      });

      console.log('Updating notification to show quest is in progress');
      await BackgroundService.updateNotification({
        taskTitle: `Quest in progress: ${this.questTemplate.title}`,
        taskDesc: `Keep your phone locked for ${this.questTemplate.durationMinutes} minutes to complete the quest`,
        progressBar: {
          max: 100,
          value: 0,
          indeterminate: false,
        },
      });
    }
  }

  // Modified onPhoneUnlocked to fail immediately only when quest is still in progress
  static async onPhoneUnlocked() {
    console.log('Phone unlocked');
    this.isPhoneLocked = false;

    // Load quest data from storage in case it was lost
    await this.loadQuestData();

    if (this.questStartTime && this.questTemplate) {
      const elapsedTime = Date.now() - this.questStartTime;
      const questDurationMs = this.questTemplate.durationMinutes * 60 * 1000;
      console.log('elapsedTime', elapsedTime);
      console.log('questDurationMs', questDurationMs);
      if (elapsedTime < questDurationMs) {
        console.log('Immediately failing quest due to phone unlock');
        const questStoreState = useQuestStore.getState();
        questStoreState.failQuest();
        await this.stopQuest();
      } else {
        const questStoreState = useQuestStore.getState();
        questStoreState.completeQuest(true);
        console.log(
          'Quest duration met (or exceeded); quest should be complete, no failure triggered.'
        );
      }
    }
  }

  // Background task now only updates progress if the phone is locked
  private static backgroundTask = async (taskData?: {
    questDuration: number;
    questTitle: string;
  }) => {
    console.log('Background task started', taskData);
    if (!taskData) return;

    // Load quest data from storage when background task starts
    await this.loadQuestData();

    const { questDuration } = taskData;

    while (BackgroundService.isRunning()) {
      // Reload quest data periodically in case it was lost
      await this.loadQuestData();

      if (this.isPhoneLocked && this.questStartTime) {
        console.log('Phone locked and quest started');
        const elapsedTime = Date.now() - this.questStartTime;
        const progress = Math.min((elapsedTime / questDuration) * 100, 100);

        await BackgroundService.updateNotification({
          progressBar: {
            max: 100,
            value: progress,
            indeterminate: false,
          },
        });

        // Check if quest is complete
        if (elapsedTime >= questDuration) {
          console.log('Quest completed in background');
          const questStoreState = useQuestStore.getState();
          questStoreState.completeQuest(true);
          await this.stopQuest();
          await scheduleQuestCompletionNotification();
          break;
        }
      }

      // Use a longer update interval to save battery
      const updateInterval = Math.max(questDuration / 100, 1000);
      await new Promise((resolve) => setTimeout(resolve, updateInterval));
    }
  };

  static async stopQuest() {
    console.log('Stopping quest');
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
