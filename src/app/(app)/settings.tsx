import { Env } from '@env';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as Linking from 'expo-linking';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { FocusAwareStatusBar, ScrollView, Text, View } from '@/components/ui';
import { useAuth } from '@/lib';
import {
  areNotificationsEnabled,
  cancelDailyReminderNotification,
  requestNotificationPermissions,
  scheduleDailyReminderNotification,
} from '@/lib/services/notifications';
import { getUserDetails } from '@/lib/services/user';
import { setItem } from '@/lib/storage';
import { useCharacterStore } from '@/store/character-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';
import { useSettingsStore } from '@/store/settings-store';
import { useUserStore } from '@/store/user-store';

// Constants
const APP_VERSION = Env.VERSION || '1.0.0';
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuth();
  const resetQuestStore = useQuestStore((state) => state.reset);
  const resetCharacter = useCharacterStore((state) => state.resetCharacter);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const user = useUserStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const { dailyReminder, setDailyReminder } = useSettingsStore();
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Animation value for header
  const headerOpacity = useSharedValue(0);

  // Initialize animation
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 1000 });
  }, [headerOpacity]);

  // Animated style
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  // Load notification settings on mount
  useEffect(() => {
    const checkNotifications = async () => {
      const enabled = await areNotificationsEnabled();
      setNotificationsEnabled(enabled);
    };

    checkNotifications();
  }, []);

  // Fetch user data if needed
  useEffect(() => {
    const fetchUserIfNeeded = async () => {
      try {
        setIsLoading(true);
        if (!user) {
          const userData = await getUserDetails();
          useUserStore.getState().setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user data in Settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserIfNeeded();
  }, [user]);

  // Handle notification toggle
  const handleNotificationsToggle = async (value: boolean) => {
    try {
      if (value) {
        // Requesting permissions
        const granted = await requestNotificationPermissions();

        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive quest updates.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }

        setNotificationsEnabled(granted);
      } else {
        // Disabling notifications
        await setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  // Handle app data reset
  const handleReset = async () => {
    try {
      // Reset all stores
      resetQuestStore();
      resetCharacter();
      resetOnboarding();
      Alert.alert('App Data Reset', 'The app data has been reset.');
    } catch (error) {
      console.error('Failed to reset app data:', error);
      Alert.alert('Error', 'Failed to reset app data. Please try again.');
    }
  };

  const resetAppData = () => {
    Alert.alert(
      'Reset App Data',
      'Are you sure you want to reset the app data? This will delete all your progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: handleReset },
      ]
    );
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  // Define icon colors and backgrounds for consistency with the design
  const iconBgColor = 'bg-[#E7DBC9]/50';
  const iconColor = '#3B7A57';
  const contactEmail = 'hello@unquestapp.com';

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      // If enabling and no time is set, set a default time (5:00 PM)
      const hour = dailyReminder.time?.hour || 17;
      const minute = dailyReminder.time?.minute || 0;

      // Schedule the notification
      const success = await scheduleDailyReminderNotification(hour, minute);

      // Update state
      setDailyReminder({
        enabled: success,
        time: { hour, minute },
      });
    } else {
      // Cancel the notification if disabling
      await cancelDailyReminderNotification();

      // Update state but preserve the time
      setDailyReminder({
        ...dailyReminder,
        enabled: false,
      });
    }
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();

      // Schedule with new time
      const success = await scheduleDailyReminderNotification(hour, minute);

      // Update state
      setDailyReminder({
        enabled: success,
        time: { hour, minute },
      });
    }
  };

  // Get formatted reminder time
  const getReminderTimeDisplay = () => {
    if (!dailyReminder.time) return '--:--';

    const date = new Date();
    date.setHours(dailyReminder.time.hour);
    date.setMinutes(dailyReminder.time.minute);

    return format(date, 'h:mm a');
  };

  // Add this handler function
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? Your account will be made inactive and your personal data will be anonymized. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Terms',
          onPress: () => Linking.openURL('https://unquestapp.com/terms'),
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Just alert for now - we'll add real deletion logic later
            Alert.alert(
              'Account Scheduled for Deletion',
              'Your account has been scheduled for deletion. You will now be logged out.'
            );
          },
        },
      ],
      { cancelable: true }
    );
  };

  // In your render method, handle loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <FocusAwareStatusBar />
        <ActivityIndicator size="large" color="#5E8977" />
        <Text className="mt-4">Loading settings...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 flex-col bg-background">
      <FocusAwareStatusBar />

      {/* Header */}
      <Animated.View style={headerStyle} className="mb-4 px-4">
        <Text className="mb-3 mt-2 text-xl font-bold">Settings</Text>
        <Text>Manage your account, preferences, and app settings.</Text>
      </Animated.View>

      <ScrollView className="flex-1">
        <View className="px-4">
          {/* Account Section */}
          <View className="mb-8">
            <View className="flex-row items-center">
              <View
                className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
              >
                <Feather name="user" size={24} color={iconColor} />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-medium">Account</Text>
                <Text className="text-neutral-600">
                  {user?.email || 'Not signed in'}
                </Text>
              </View>
            </View>

            {user && (
              <View
                className="mx-auto mt-4 rounded-xl bg-red-300 p-2"
                style={{ width: '50%' }}
                onTouchEnd={handleLogout}
              >
                <Text className="text-center font-medium text-white">
                  Logout
                </Text>
              </View>
            )}
          </View>

          {/* Preferences Section */}
          <View className="mb-4">
            <Text className="mb-2 text-base uppercase text-neutral-500">
              PREFERENCES
            </Text>
          </View>

          {/* Notifications */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
              >
                <Feather name="bell" size={24} color={iconColor} />
              </View>
              <View>
                <Text className="text-xl font-medium">Notifications</Text>
                <Text className="text-neutral-600">
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#D1D1D6', true: '#5E8977' }}
            />
          </View>

          {/* Reminders - Updated to match other sections */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
              >
                <Feather name="clock" size={24} color={iconColor} />
              </View>
              <View>
                <Text className="text-xl font-medium">Daily Reminder</Text>
                <Text className="text-neutral-600">
                  {dailyReminder.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={dailyReminder.enabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: '#D1D1D6', true: '#5E8977' }}
            />
          </View>

          {/* Show time selector when reminder is enabled */}
          {dailyReminder.enabled && (
            <View className="mb-6 ml-16">
              <View className="flex-row items-center justify-between">
                <Text className="text-neutral-600">Reminder Time</Text>

                {!showTimePicker && (
                  <Pressable
                    onPress={() => setShowTimePicker(true)}
                    className="rounded-lg bg-neutral-200 px-4 py-2"
                  >
                    <Text className="text-center font-medium">
                      {getReminderTimeDisplay()}
                    </Text>
                  </Pressable>
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={
                      new Date(
                        new Date().setHours(
                          dailyReminder.time?.hour || 0,
                          dailyReminder.time?.minute || 0
                        )
                      )
                    }
                    mode="time"
                    display="compact"
                    onChange={handleTimeChange}
                    minuteInterval={15}
                  />
                )}
              </View>
            </View>
          )}

          {/* Support Section */}
          <View className="mb-4">
            <Text className="mb-2 text-base uppercase text-neutral-500">
              SUPPORT
            </Text>
          </View>

          {/* Contact Us */}
          <View
            className="mb-4 flex-row items-center justify-between"
            onTouchEnd={() => handleEmail(contactEmail)}
          >
            <View className="flex-row items-center">
              <View
                className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
              >
                <Feather name="mail" size={24} color={iconColor} />
              </View>
              <View>
                <Text className="text-xl font-medium">Contact Us</Text>
                <Text className="text-neutral-600">{contactEmail}</Text>
              </View>
            </View>
          </View>

          {/* Request a Feature */}
          <View
            className="mb-8 flex-row items-center justify-between"
            onTouchEnd={() => handleEmail(contactEmail)}
          >
            <View className="flex-row items-center">
              <View
                className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
              >
                <Feather name="help-circle" size={24} color={iconColor} />
              </View>
              <View>
                <Text className="text-xl font-medium">Request a Feature</Text>
                <Text className="text-neutral-600">{contactEmail}</Text>
              </View>
            </View>
          </View>

          {/* Legal Section */}
          <View className="mb-4">
            <Text className="mb-2 text-base uppercase text-neutral-500">
              LEGAL
            </Text>
          </View>

          {/* Terms/Privacy Policy */}
          <View className="mb-8 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
              >
                <Feather name="shield" size={24} color={iconColor} />
              </View>
              <View>
                <Link
                  href="https://unquestapp.com/terms"
                  className="text-xl font-medium"
                >
                  Terms of Use & Privacy Policy
                </Link>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#888" />
          </View>

          {/* Danger Zone */}
          <View className="mb-4">
            <Text className="mb-2 text-base uppercase text-neutral-500">
              DANGER ZONE
            </Text>
          </View>

          <View className="mb-8 px-4">
            <Text className="mb-4 text-center text-neutral-600">
              Deleting your account will remove all your personal data.
            </Text>
            <View
              className="mx-auto rounded-full bg-red-400 p-2"
              style={{ width: '50%' }}
              onTouchEnd={handleDeleteAccount}
            >
              <Text className="text-center font-medium text-white">
                Delete Account
              </Text>
            </View>
          </View>

          {/* Version Info */}
          <Text className="mb-6 mt-8 text-center text-neutral-500">
            Version {APP_VERSION}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
