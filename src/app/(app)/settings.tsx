import { Env } from '@env';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { Item } from '@/components/settings/item';
import { ItemsContainer } from '@/components/settings/items-container';
import {
  colors,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { translate, useAuth } from '@/lib';
import {
  areNotificationsEnabled,
  requestNotificationPermissions,
} from '@/lib/services/notifications';
import { setItem } from '@/lib/storage';

// Constants
const APP_VERSION = Env.VERSION || '1.0.0';
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';

export default function Settings() {
  const signOut = useAuth.use.signOut();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load notification settings on mount
  useEffect(() => {
    const checkNotifications = async () => {
      const enabled = await areNotificationsEnabled();
      setNotificationsEnabled(enabled);
    };

    checkNotifications();
  }, []);

  // Handle notification toggle
  const handleNotificationsToggle = async () => {
    try {
      if (!notificationsEnabled) {
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

        Alert.alert(
          'Notifications Disabled',
          "You won't receive quest updates. You can re-enable notifications anytime."
        );
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
      // Clear storage
      // Note: You'll need to implement a proper reset for your stores
      // This is just a placeholder - replace with your actual store reset logic
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

  const handleEmail = () => {
    Linking.openURL('mailto:hello@unquestapp.com');
  };

  // Define icon color for consistency
  const iconColor = colors.neutral[500];

  return (
    <>
      <FocusAwareStatusBar />

      <ScrollView>
        <View className="flex-1 px-4 pt-16">
          <Text className="text-xl font-bold">
            {translate('settings.title')}
          </Text>

          {/* Account Section */}
          <ItemsContainer title="Account">
            <Item
              text="Your Account"
              value="email@example.com"
              icon={<Feather name="user" size={24} color={iconColor} />}
            />
            <Item text="Logout" onPress={handleLogout} />
          </ItemsContainer>

          {/* Preferences Section */}
          <ItemsContainer title="Preferences">
            <Item
              text="Notifications"
              icon={<Feather name="bell" size={24} color={iconColor} />}
              value={notificationsEnabled ? 'Enabled' : 'Disabled'}
              rightElement={
                <View className="flex-row items-center">
                  <View
                    className={`h-6 w-10 rounded-full ${notificationsEnabled ? 'bg-primary' : 'bg-gray-300'} flex items-center justify-center`}
                    onTouchEnd={handleNotificationsToggle}
                  >
                    <View
                      className={`absolute size-4 rounded-full bg-white ${notificationsEnabled ? 'right-1' : 'left-1'}`}
                    />
                  </View>
                </View>
              }
            />
            <Item
              text="Reminders"
              value="Coming Soon"
              icon={<Feather name="clock" size={24} color={iconColor} />}
            />
          </ItemsContainer>

          {/* Support Section */}
          <ItemsContainer title="Support">
            <Item
              text="Contact Us"
              value="hello@unquestapp.com"
              icon={<Feather name="mail" size={24} color={iconColor} />}
              onPress={handleEmail}
            />
            <Item
              text="Request a Feature"
              value="hello@unquestapp.com"
              icon={<Feather name="lightbulb" size={24} color={iconColor} />}
              onPress={handleEmail}
            />
          </ItemsContainer>

          {/* Legal Section */}
          <ItemsContainer title="Legal">
            <Item
              text="Privacy Policy"
              value="Coming Soon"
              icon={<Feather name="shield" size={24} color={iconColor} />}
              onPress={() => {}}
            />
            <Item
              text="Terms of Service"
              icon={<Feather name="file-text" size={24} color={iconColor} />}
              onPress={() => {}}
            />
          </ItemsContainer>

          {/* Danger Zone */}
          <ItemsContainer title="Danger Zone">
            <View className="p-4">
              <Text className="mb-4 text-center text-gray-600">
                This will delete all your progress.
              </Text>
              <View
                className="rounded-md bg-red-500 px-4 py-2"
                onTouchEnd={resetAppData}
              >
                <Text className="text-center font-medium text-white">
                  Reset App Data
                </Text>
              </View>
            </View>
          </ItemsContainer>

          {/* About and Version */}
          <ItemsContainer title="About">
            <Item text="App Name" value={Env.NAME} />
            <Item text="Version" value={APP_VERSION} />
          </ItemsContainer>

          {/* Social and Links */}
          <ItemsContainer title="Connect">
            <Item
              text="Share"
              icon={<Feather name="share-2" size={24} color={iconColor} />}
              onPress={() => {}}
            />
            <Item
              text="Rate"
              icon={<Feather name="star" size={24} color={iconColor} />}
              onPress={() => {}}
            />
            <Item
              text="Website"
              icon={<Feather name="globe" size={24} color={iconColor} />}
              onPress={() => {}}
            />
            <Item
              text="GitHub"
              icon={<Feather name="github" size={24} color={iconColor} />}
              onPress={() => {}}
            />
          </ItemsContainer>
        </View>
      </ScrollView>
    </>
  );
}
