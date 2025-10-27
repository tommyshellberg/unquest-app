import * as Linking from 'expo-linking';
import { Settings } from 'lucide-react-native';
import React from 'react';
import { Platform, View } from 'react-native';

import { Button, Text } from '@/components/ui';

interface PermissionDeniedViewProps {
  onEnablePermissions: () => void;
  onManualAdd: () => void;
}

export const PermissionDeniedView: React.FC<PermissionDeniedViewProps> = ({
  onEnablePermissions,
  onManualAdd,
}) => {
  const handleEnablePermissions = async () => {
    if (Platform.OS === 'ios') {
      // On iOS, open settings
      await Linking.openSettings();
    } else {
      // On Android, we can re-prompt
      onEnablePermissions();
    }
  };

  return (
    <View className="flex-1 bg-background p-6">
      <View className="flex-1 items-center justify-center">
        {/* Icon */}
        <View className="mb-6 size-20 items-center justify-center rounded-full bg-orange-100">
          <Settings size={40} color="#EA580C" />
        </View>

        <Text className="mb-3 text-center text-lg font-semibold text-white">
          Contact Access Required
        </Text>

        <Text className="mb-8 px-4 text-center text-base text-neutral-200">
          To import contacts and invite friends easily, please enable contact
          access in your device settings.
        </Text>

        <View className="w-full">
          <Button
            label="Enable Permissions"
            onPress={handleEnablePermissions}
            className="mb-3 w-full"
          />

          <View className="my-4 flex-row items-center justify-center">
            <View className="h-px flex-1 bg-neutral-200" />
            <Text className="mx-4 text-sm text-neutral-200">or</Text>
            <View className="h-px flex-1 bg-neutral-200" />
          </View>

          <Button
            label="Add Contact Manually"
            onPress={onManualAdd}
            variant="outline"
            className="w-full"
          />
        </View>
      </View>
    </View>
  );
};
