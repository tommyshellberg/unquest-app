import { Env } from '@env';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import { Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusAwareStatusBar, ScrollView, Text, View } from '@/components/ui';
import { useAuth } from '@/lib';
import {
  areNotificationsEnabled,
  requestNotificationPermissions,
} from '@/lib/services/notifications';
import { setItem } from '@/lib/storage';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';
import { useUserStore } from '@/store/user-store';

// Constants
const APP_VERSION = Env.VERSION || '1.0.0';
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const resetQuestStore = useQuestStore((state) => state.reset);
  const resetCharacter = useCharacterStore((state) => state.resetCharacter);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const user = useUserStore((state) => state.user);

  // Load notification settings on mount
  useEffect(() => {
    const checkNotifications = async () => {
      const enabled = await areNotificationsEnabled();
      setNotificationsEnabled(enabled);
    };

    checkNotifications();
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
        onPress: signOut,
      },
    ]);
  };

  // Handle app data reset
  const handleReset = async () => {
    try {
      // Reset all stores
      resetQuestStore();
      resetCharacter();
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

  console.log('user', user);

  return (
    <View className="bg-background flex-1">
      <FocusAwareStatusBar />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <View className="px-4 pt-10">
          <Text className="mb-6 text-4xl font-semibold text-[#3B7A57]">
            Settings
          </Text>

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

            <View
              className="mx-auto mt-4 rounded-xl bg-red-300 p-2"
              style={{ width: '50%' }}
              onTouchEnd={handleLogout}
            >
              <Text className="text-center font-medium text-white">Logout</Text>
            </View>
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

          {/* Reminders */}
          <View className="mb-8 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
              >
                <Feather name="clock" size={24} color={iconColor} />
              </View>
              <View>
                <Text className="text-xl font-medium">Reminders</Text>
                <Text className="text-neutral-600">Coming Soon</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#888" />
          </View>

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
                <Feather name="lightbulb" size={24} color={iconColor} />
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

          {/* Privacy Policy */}
          <View className="mb-8 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className={`mr-4 size-14 ${iconBgColor} items-center justify-center rounded-full`}
              >
                <Feather name="shield" size={24} color={iconColor} />
              </View>
              <View>
                <Text className="text-xl font-medium">Privacy Policy</Text>
                <Text className="text-neutral-600">Coming Soon</Text>
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
              This will delete all your progress.
            </Text>
            <View
              className="mx-auto rounded-full bg-red-300 p-2"
              style={{ width: '50%' }}
              onTouchEnd={resetAppData}
            >
              <Text className="text-center font-medium text-white">
                Reset App Data
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
