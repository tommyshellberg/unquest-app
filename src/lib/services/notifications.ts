import { Env } from '@env';
import * as ExpoNotifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';

import { primary } from '@/components/ui/colors';
import { getItem, setItem } from '@/lib/storage';

// Channel IDs
const QUEST_CHANNEL_ID = 'quest-notifications';
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

// If the SchedulableTriggerInputTypes enum isn't directly available, define it
enum SchedulableTriggerInputTypes {
  TIME_INTERVAL = 'timeInterval',
  CALENDAR = 'calendar',
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
      // Handle notification clicks here - go to home screen, will get redirected to quest-complete
      router.navigate('/(app)/[id]');
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
