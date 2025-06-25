import { Env } from '@env';
import * as ExpoNotifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';

import { primary } from '@/components/ui/colors';
import { getItem, setItem } from '@/lib/storage';
import { useCharacterStore } from '@/store/character-store';
import { useSettingsStore } from '@/store/settings-store';

// Channel IDs
const QUEST_CHANNEL_ID = 'quest-notifications';
const INVITATION_CHANNEL_ID = 'invitation-notifications';
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';
const STREAK_WARNING_ID = 'streak-warning';

// If the SchedulableTriggerInputTypes enum isn't directly available, define it
enum SchedulableTriggerInputTypes {
  TIME_INTERVAL = 'timeInterval',
  DAILY = 'daily',
}

// Create notification channels (Android only)
export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    await ExpoNotifications.setNotificationChannelAsync(QUEST_CHANNEL_ID, {
      name: 'Quest Notifications',
      description: 'Notifications for quest completion and updates',
      importance: ExpoNotifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: primary[300],
      lockscreenVisibility:
        ExpoNotifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
    });

    await ExpoNotifications.setNotificationChannelAsync(INVITATION_CHANNEL_ID, {
      name: 'Quest Invitations',
      description: 'Notifications for cooperative quest invitations',
      importance: ExpoNotifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: primary[300],
      lockscreenVisibility:
        ExpoNotifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
    });
  }
}

// Check if notifications are enabled (both permission and user preference)
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    // Check user preference
    const userPreference = getItem<string>(NOTIFICATIONS_ENABLED_KEY);
    if (userPreference === 'false') return false;

    // Check system permission - using OneSignal to check
    const permissionStatus = await OneSignal.Notifications.getPermissionAsync();
    return permissionStatus;
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
};

// Clear all notifications from our app
export const clearAllNotifications = async () => {
  try {
    // This will clear all notifications from our app
    await ExpoNotifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

export const scheduleQuestCompletionNotification = async () => {
  // Check if notifications are enabled before scheduling
  const enabled = await areNotificationsEnabled();
  if (!enabled) {
    return;
  }

  try {
    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: 'Quest Completed!',
        body: 'Your quest has been completed successfully. Claim your reward!',
        data: { screen: 'quest-complete' },
        // These properties are valid in the content object
        priority: ExpoNotifications.AndroidNotificationPriority.MAX,
        sound: true,
        vibrate: [0, 250, 250, 250],
        color: primary[400],
      },
      trigger:
        Platform.OS === 'android'
          ? {
              channelId: QUEST_CHANNEL_ID,
              seconds: 1, // Minimum delay required when specifying channelId
            }
          : null, // Show immediately on iOS
    });
  } catch (error) {
    console.error('Failed to schedule notification:', error);
  }
};

// Initialize OneSignal and setup notification handlers
export function setupNotifications() {
  // Initialize OneSignal first
  if (Env.ONESIGNAL_APP_ID) {
    // Setup notification handling
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('OneSignal notification clicked:', event);
      // Handle notification clicks based on data
      const data = event.notification.additionalData;
      if (data?.screen === 'invitations') {
        router.navigate('/invitations');
      } else if (data?.screen === 'pending-quest') {
        router.navigate('/pending-quest');
      } else {
        // Default: go to home screen, will get redirected to quest-complete
        router.navigate('/[id]');
      }
    });
  }

  // Configure Expo notifications for local notifications

  ExpoNotifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Set up notification channels
  setupNotificationChannels();
}

// Request notification permissions - use OneSignal for iOS to enable Live Activities
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    // Use OneSignal to request permissions
    const granted = await OneSignal.Notifications.requestPermission(true);

    // Store the setting in our local storage
    setItem(NOTIFICATIONS_ENABLED_KEY, granted ? 'true' : 'false');

    return granted;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Schedule a daily reminder notification
export const scheduleDailyReminderNotification = async (
  hour: number,
  minute: number
): Promise<boolean> => {
  try {
    // Cancel any existing reminders first
    await ExpoNotifications.cancelScheduledNotificationAsync('daily-reminder');

    // Schedule the new reminder
    await ExpoNotifications.scheduleNotificationAsync({
      identifier: 'daily-reminder',
      content: {
        title: 'Time for a mindful break',
        body: 'Start a new quest in unQuest to take a break from your phone',
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    console.log(`Daily reminder scheduled for ${hour}:${minute}`);
    return true;
  } catch (error) {
    console.error('Failed to schedule daily reminder:', error);
    return false;
  }
};

// Cancel daily reminder
export const cancelDailyReminderNotification = async (): Promise<boolean> => {
  try {
    await ExpoNotifications.cancelScheduledNotificationAsync('daily-reminder');
    console.log('Daily reminder canceled');
    return true;
  } catch (error) {
    console.error('Failed to cancel daily reminder:', error);
    return false;
  }
};

// Create a centralized function for scheduling streak warnings
export const scheduleStreakWarningNotification = async (
  forTomorrow = false
): Promise<boolean> => {
  // Check if notifications are enabled
  const enabled = await areNotificationsEnabled();
  if (!enabled) {
    console.log('Notifications not enabled, skipping streak warning');
    return false;
  }

  // Check if streak warning is enabled in settings
  const streakWarning = useSettingsStore.getState().streakWarning;
  if (!streakWarning.enabled) {
    console.log('Streak warnings disabled in settings');
    return false;
  }

  // Get current streak count from character store
  const dailyQuestStreak = useCharacterStore.getState().dailyQuestStreak;
  if (dailyQuestStreak === 0) {
    console.log('No active streak, skipping warning');
    return false;
  }

  try {
    // Cancel any existing streak warnings first
    await ExpoNotifications.cancelScheduledNotificationAsync(STREAK_WARNING_ID);

    // Target date: today or tomorrow
    const targetDate = new Date();
    if (forTomorrow) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    // Set time to user's preferred time
    const hour = streakWarning.time?.hour || 18; // Default 6 PM
    const minute = streakWarning.time?.minute || 0;

    targetDate.setHours(hour, minute, 0, 0);

    // Check if we need to schedule for tomorrow instead (if today's time has passed)
    const now = new Date();
    if (!forTomorrow && now > targetDate) {
      console.log('Time already passed today, scheduling for tomorrow instead');
      return scheduleStreakWarningNotification(true);
    }

    // Content is the same regardless of timing
    const content = {
      title: `Don't break your ${dailyQuestStreak} day streak! 🔥`,
      body: 'Complete a quest today to keep your streak going',
      data: { screen: '/(app)' },
      sound: true,
    };

    // Use different trigger strategies based on whether it's for today or tomorrow
    let trigger;
    if (forTomorrow || targetDate.getDate() !== now.getDate()) {
      // For tomorrow, use DAILY trigger type which works on both platforms
      trigger = {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === 'android' ? QUEST_CHANNEL_ID : undefined,
      };
      console.log(
        `Scheduling streak warning for tomorrow at ${hour}:${minute}`
      );
    } else {
      // For today, calculate seconds until the target time
      const secondsUntilWarning = Math.floor(
        (targetDate.getTime() - now.getTime()) / 1000
      );
      trigger = {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilWarning,
        channelId: Platform.OS === 'android' ? QUEST_CHANNEL_ID : undefined,
      };
      console.log(
        `Scheduling streak warning for today in ${secondsUntilWarning} seconds`
      );
    }

    // Schedule the notification
    await ExpoNotifications.scheduleNotificationAsync({
      identifier: STREAK_WARNING_ID,
      content,
      trigger,
    });

    return true;
  } catch (error) {
    console.error('Failed to schedule streak warning:', error);
    return false;
  }
};

// Add this function to cancel streak warning
export const cancelStreakWarningNotification = async (): Promise<boolean> => {
  try {
    await ExpoNotifications.cancelScheduledNotificationAsync(STREAK_WARNING_ID);
    console.log('Streak warning canceled');
    return true;
  } catch (error) {
    console.error('Failed to cancel streak warning:', error);
    return false;
  }
};

// Schedule a notification for quest invitation
export const scheduleQuestInvitationNotification = async (
  inviterName: string,
  questTitle: string
) => {
  // Check if notifications are enabled before scheduling
  const enabled = await areNotificationsEnabled();
  if (!enabled) {
    return;
  }

  try {
    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: '🎮 New Quest Invitation!',
        body: `${inviterName} invited you to join "${questTitle}"`,
        data: { screen: 'invitations' },
        priority: ExpoNotifications.AndroidNotificationPriority.MAX,
        sound: true,
        vibrate: [0, 250, 250, 250],
        color: primary[400],
      },
      trigger:
        Platform.OS === 'android'
          ? {
              channelId: INVITATION_CHANNEL_ID,
              seconds: 1, // Minimum delay required when specifying channelId
            }
          : null, // Show immediately on iOS
    });
  } catch (error) {
    console.error('Failed to schedule invitation notification:', error);
  }
};

// Schedule a notification when all participants are ready
export const scheduleAllParticipantsReadyNotification = async (
  questTitle: string
) => {
  const enabled = await areNotificationsEnabled();
  if (!enabled) {
    return;
  }

  try {
    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: '🚀 Quest Starting!',
        body: `All participants are ready for "${questTitle}". Lock your phone to begin!`,
        data: { screen: 'pending-quest' },
        priority: ExpoNotifications.AndroidNotificationPriority.MAX,
        sound: true,
        vibrate: [0, 250, 250, 250],
        color: primary[400],
      },
      trigger:
        Platform.OS === 'android'
          ? {
              channelId: QUEST_CHANNEL_ID,
              seconds: 1,
            }
          : null,
    });
  } catch (error) {
    console.error('Failed to schedule ready notification:', error);
  }
};

// Schedule notification when cooperative quest completes
export const scheduleCooperativeQuestCompleteNotification = async (
  questTitle: string,
  participantCount: number
) => {
  const enabled = await areNotificationsEnabled();
  if (!enabled) {
    return;
  }

  try {
    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Team Quest Completed!',
        body: `You and ${participantCount - 1} friend${participantCount > 2 ? 's' : ''} completed "${questTitle}" together!`,
        data: { screen: 'quest-complete' },
        priority: ExpoNotifications.AndroidNotificationPriority.MAX,
        sound: true,
        vibrate: [0, 250, 250, 250],
        color: primary[400],
      },
      trigger:
        Platform.OS === 'android'
          ? {
              channelId: QUEST_CHANNEL_ID,
              seconds: 1,
            }
          : null,
    });
  } catch (error) {
    console.error(
      'Failed to schedule cooperative complete notification:',
      error
    );
  }
};
