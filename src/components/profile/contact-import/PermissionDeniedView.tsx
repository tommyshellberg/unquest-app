import React from 'react';
import { View, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { Settings } from 'lucide-react-native';
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
    <View className="flex-1 p-6 bg-background">
      <View className="flex-1 items-center justify-center">
        {/* Icon */}
        <View className="w-20 h-20 bg-orange-100 rounded-full items-center justify-center mb-6">
          <Settings size={40} color="#EA580C" />
        </View>

        <Text className="text-lg font-semibold text-neutral-800 mb-3 text-center">
          Contact Access Required
        </Text>

        <Text className="text-base text-neutral-500 mb-8 text-center px-4">
          To import contacts and invite friends easily, please enable contact
          access in your device settings.
        </Text>

        <View className="w-full">
          <Button
            label="Enable Permissions"
            onPress={handleEnablePermissions}
            className="w-full mb-3"
          />

          <View className="flex-row items-center justify-center my-4">
            <View className="flex-1 h-px bg-neutral-200" />
            <Text className="mx-4 text-sm text-neutral-400">or</Text>
            <View className="flex-1 h-px bg-neutral-200" />
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
