import * as Updates from 'expo-updates';
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { View } from 'react-native';
import Restart from 'react-native-restart';

import { Button } from './button';
import { Text } from './text';

export function UpdateNotificationBar() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Use the Updates hook
  const updates = Updates.useUpdates();

  useEffect(() => {
    // Only check for updates in production or staging environments
    if (__DEV__) return;

    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setUpdateAvailable(true);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Check for updates on app start
    checkForUpdates();
  }, []);

  useEffect(() => {
    // Listen for update events
    if (updates.isUpdateAvailable) {
      setUpdateAvailable(true);
    }
  }, [updates.isUpdateAvailable]);

  const handleUpdatePress = async () => {
    try {
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'Update Downloaded',
        'The app needs to restart to apply the update.',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Restart Now',
            onPress: () => {
              if (Platform.OS === 'ios') {
                // For iOS, we need to use Updates.reloadAsync()
                Updates.reloadAsync();
              } else {
                // For Android, we can use react-native-restart
                Restart.restart();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error fetching update:', error);
      Alert.alert(
        'Update Error',
        'Failed to download the update. Please try again later.'
      );
    }
  };

  if (!updateAvailable || isDismissed) {
    return null;
  }

  return (
    <View className="flex-row items-center justify-between bg-[#5E8977] px-4 py-3">
      <Text className="flex-1 text-sm text-white">
        An update is available. Restart to apply it.
      </Text>
      <View className="flex-row items-center gap-2">
        <Button
          label="Update"
          onPress={handleUpdatePress}
          variant="secondary"
          size="sm"
          className="bg-white/20"
          textClassName="text-white text-sm"
        />
        <Button
          onPress={() => setIsDismissed(true)}
          variant="ghost"
          size="sm"
          className="p-1"
        >
          <X size={18} color="white" />
        </Button>
      </View>
    </View>
  );
}
