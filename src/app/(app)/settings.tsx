import { Env } from '@env';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { Flame } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { FocusAwareStatusBar, ScrollView, Text, View, ScreenContainer, ScreenHeader } from '@/components/ui';
import { useAuth } from '@/lib';
import {
  areNotificationsEnabled,
  cancelDailyReminderNotification,
  cancelStreakWarningNotification,
  requestNotificationPermissions,
  scheduleDailyReminderNotification,
  scheduleStreakWarningNotification,
} from '@/lib/services/notifications';
import { deleteUserAccount, getUserDetails } from '@/lib/services/user';
import { getItem, setItem } from '@/lib/storage';
import { useSettingsStore } from '@/store/settings-store';
import { useUserStore } from '@/store/user-store';

// Constants
const APP_VERSION = Env.VERSION || '1.0.0';
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const user = useUserStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const { dailyReminder, setDailyReminder, streakWarning, setStreakWarning } =
    useSettingsStore();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStreakTimePicker, setShowStreakTimePicker] = useState(false);
  const [updateId, setUpdateId] = useState<string | null>(null);

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

  // Get EAS Update ID
  useEffect(() => {
    if (!__DEV__ && Updates.updateId) {
      setUpdateId(Updates.updateId);
    }
  }, []);

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
        setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
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
          onPress: async () => {
            try {
              // Show loading indicator
              setIsLoading(true);

              // Call API to delete the account
              await deleteUserAccount();

              // On success, show confirmation and logout
              Alert.alert(
                'Account Scheduled for Deletion',
                'Your account has been scheduled for deletion. You will now be logged out.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      // Log the user out and redirect to login screen
                      await signOut();
                      router.replace('/login');
                    },
                  },
                ]
              );
            } catch (error) {
              // On error, show error message
              setIsLoading(false);

              let errorMessage = 'An unexpected error occurred.';
              if (error instanceof Error) {
                errorMessage = error.message;
              }

              Alert.alert(
                'Account Deletion Failed',
                `We couldn't process your deletion request automatically. Please contact hello@unquestapp.com or visit unquestapp.com/contact for assistance with manual account deletion.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Email Support',
                    onPress: () =>
                      Linking.openURL(
                        'mailto:hello@unquestapp.com?subject=Account%20Deletion%20Request'
                      ),
                  },
                  {
                    text: 'Visit Website',
                    onPress: () =>
                      Linking.openURL('https://unquestapp.com/contact'),
                  },
                ]
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleToggleStreakWarning = async (value: boolean) => {
    // Default time if none set
    const hour = streakWarning.time?.hour || 18;
    const minute = streakWarning.time?.minute || 0;

    // Simply update the settings store with the new value
    setStreakWarning({
      enabled: value,
      time: { hour, minute },
    });

    // If disabling, cancel any scheduled streak warning
    if (!value) {
      await cancelStreakWarningNotification();
    } else {
      // If enabling, schedule the notification after a short delay
      // This gives time for the settings store to update
      setTimeout(() => {
        scheduleStreakWarningNotification();
      }, 500);
    }
  };

  const handleStreakTimeChange = async (event: any, selectedDate?: Date) => {
    setShowStreakTimePicker(false);
    if (selectedDate) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();

      // Cancel previous warning
      await cancelStreakWarningNotification();

      // Update state first so the notification uses the new time
      setStreakWarning({
        enabled: true, // Keep enabled state
        time: { hour, minute },
      });

      // Schedule with a short delay to ensure settings are updated
      setTimeout(() => {
        scheduleStreakWarningNotification();
      }, 500);
    }
  };

  // Get formatted streak reminder time
  const getStreakTimeDisplay = () => {
    if (!streakWarning.time) return '--:--';

    const date = new Date();
    date.setHours(streakWarning.time.hour);
    date.setMinutes(streakWarning.time.minute);

    return format(date, 'h:mm a');
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

      <ScreenContainer>
        {/* Header */}
        <ScreenHeader
          title="Settings"
          subtitle="Manage your account, preferences, and app settings."
        />

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

          {/* Only show notification sub-settings when notifications are enabled */}
          {notificationsEnabled && (
            <>
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
                        minuteInterval={5}
                      />
                    )}
                  </View>
                </View>
              )}

              {/* Streak Warning */}
              <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View
                    className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
                  >
                    <Flame size={24} color={iconColor} />
                  </View>
                  <View>
                    <Text className="text-xl font-medium">Streak Warning</Text>
                    <Text className="text-neutral-600">
                      {streakWarning.enabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={streakWarning.enabled}
                  onValueChange={handleToggleStreakWarning}
                  trackColor={{ false: '#D1D1D6', true: '#5E8977' }}
                />
              </View>

              {/* Show time selector when streak warning is enabled */}
              {streakWarning.enabled && (
                <View className="mb-6 ml-16">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-neutral-600">Reminder Time</Text>

                    {!showStreakTimePicker && (
                      <Pressable
                        onPress={() => setShowStreakTimePicker(true)}
                        className="rounded-lg bg-neutral-200 px-4 py-2"
                      >
                        <Text className="text-center font-medium">
                          {getStreakTimeDisplay()}
                        </Text>
                      </Pressable>
                    )}

                    {showStreakTimePicker && (
                      <DateTimePicker
                        value={
                          new Date(
                            new Date().setHours(
                              streakWarning.time?.hour || 0,
                              streakWarning.time?.minute || 0
                            )
                          )
                        }
                        mode="time"
                        display="compact"
                        onChange={handleStreakTimeChange}
                        minuteInterval={5}
                      />
                    )}
                  </View>
                </View>
              )}
            </>
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
          <Pressable
            className="mb-8 flex-row items-center justify-between"
            onPress={() => Linking.openURL('https://unquestapp.com/terms')}
          >
            <View className="flex-row items-center">
              <View
                className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
              >
                <Feather name="shield" size={24} color={iconColor} />
              </View>
              <View>
                <Text className="text-xl font-medium">
                  Terms of Use & Privacy Policy
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#888" />
          </Pressable>

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

          {/* Debug Section - Only in dev mode */}
          {__DEV__ && (
            <>
              <View className="mb-4">
                <Text className="mb-2 text-base uppercase text-neutral-500">
                  DEBUG
                </Text>
              </View>

              <Pressable
                className="mb-4 flex-row items-center justify-between"
                onPress={async () => {
                  try {
                    const onesignalId = await OneSignal.User.getOnesignalId();
                    const externalId = await OneSignal.User.getExternalId();
                    const mongodbUserId = user?.id || 'Not logged in';

                    Alert.alert(
                      'OneSignal Debug Info',
                      `OneSignal ID: ${onesignalId || 'Not set'}\n\n` +
                        `External ID: ${externalId || 'Not set'}\n\n` +
                        `MongoDB User ID: ${mongodbUserId}\n\n` +
                        `Match: ${externalId === mongodbUserId ? '✅ Yes' : '❌ No'}`,
                      [{ text: 'OK' }]
                    );
                  } catch (error) {
                    Alert.alert(
                      'Error',
                      'Failed to get OneSignal info: ' + error.message
                    );
                  }
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
                  >
                    <Feather name="code" size={24} color={iconColor} />
                  </View>
                  <View>
                    <Text className="text-xl font-medium">
                      Check OneSignal ID
                    </Text>
                    <Text className="text-neutral-600">
                      Verify user ID mapping
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#888" />
              </Pressable>

              <Pressable
                className="mb-4 flex-row items-center justify-between"
                onPress={async () => {
                  try {
                    // Get all notification status info
                    const permissionStatus =
                      await OneSignal.Notifications.getPermissionAsync();
                    const pushSubscription = OneSignal.User.pushSubscription;
                    const isOptedIn = await pushSubscription.getOptedInAsync();
                    const subscriptionId = await pushSubscription.getIdAsync();
                    const token = await pushSubscription.getTokenAsync();

                    // Get notification settings
                    const userPreference = getItem(NOTIFICATIONS_ENABLED_KEY);

                    Alert.alert(
                      'OneSignal Notification Status',
                      `System Permission: ${permissionStatus ? '✅ Granted' : '❌ Denied'}\n\n` +
                        `Push Subscription:\n` +
                        `  - Opted In: ${isOptedIn ? '✅ Yes' : '❌ No'}\n` +
                        `  - Subscription ID: ${subscriptionId ? '✅ ' + subscriptionId.substring(0, 20) + '...' : '❌ Not set'}\n` +
                        `  - Push Token: ${token ? '✅ ' + token.substring(0, 20) + '...' : '❌ Not set'}\n\n` +
                        `User Preference: ${userPreference === 'true' ? '✅ Enabled' : userPreference === 'false' ? '❌ Disabled' : '⚠️ Not set'}`,
                      [{ text: 'OK' }]
                    );
                  } catch (error) {
                    Alert.alert(
                      'Error',
                      'Failed to get notification status: ' + error.message
                    );
                  }
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
                  >
                    <Feather name="bell" size={24} color={iconColor} />
                  </View>
                  <View>
                    <Text className="text-xl font-medium">
                      Check Notification Status
                    </Text>
                    <Text className="text-neutral-600">
                      Debug push subscription
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#888" />
              </Pressable>
            </>
          )}

          {/* Version Info */}
          <View className="mb-6 mt-8">
            <Text className="text-center text-neutral-500">
              Version {APP_VERSION}
            </Text>
            {updateId && (
              <Text className="mt-1 text-center text-xs text-neutral-400">
                Update: {updateId.slice(0, 7)}
              </Text>
            )}
          </View>
        </View>
        </ScrollView>
      </ScreenContainer>
    </View>
  );
}
