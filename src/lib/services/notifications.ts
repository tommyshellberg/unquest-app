import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getItem, setItem } from '@/lib/storage';

// Channel IDs
const QUEST_CHANNEL_ID = 'quest-notifications';
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

// Create notification channels (Android only)
export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(QUEST_CHANNEL_ID, {
      name: 'Quest Notifications',
      description: 'Notifications for quest completion and updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9500', // Use your app's primary color
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
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

    // Check system permission
    const { granted } = await Notifications.getPermissionsAsync();
    return granted;
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
};

// Clear all notifications from our app
export const clearAllNotifications = async () => {
  try {
    // This will clear all notifications from our app
    await Notifications.dismissAllNotificationsAsync();
    console.log('All notifications cleared');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

export const scheduleQuestCompletionNotification = async () => {
  // Check if notifications are enabled before scheduling
  const enabled = await areNotificationsEnabled();
  if (!enabled) {
    console.log('Notifications are disabled, skipping completion notification');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Quest Completed!',
        body: 'Your quest has been completed successfully. Claim your reward!',
        data: { screen: 'quest-complete' },
        // These properties are valid in the content object
        priority: Notifications.AndroidNotificationPriority.MAX,
        sound: true,
        vibrate: [0, 250, 250, 250],
        color: '#FF9500', // Use your app's primary color
      },
      trigger:
        Platform.OS === 'android'
          ? {
              channelId: QUEST_CHANNEL_ID,
              seconds: 1, // Minimum delay required when specifying channelId
            }
          : null, // Show immediately on iOS
    });
    console.log('Quest completion notification scheduled');
  } catch (error) {
    console.error('Failed to schedule notification:', error);
  }
};

export function setupNotifications() {
  // Configure how notifications appear when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Set up notification channels
  setupNotificationChannels();
}

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { granted } = await Notifications.requestPermissionsAsync();
    if (granted) {
      await setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
    } else {
      await setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
    }
    return granted;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};
