import React from 'react';
import { View, Platform } from 'react-native';
import * as Linking from 'expo-linking';
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
    <View className="flex-1 items-center justify-center p-6 bg-background">
      <Text className="text-lg font-semibold text-black mb-4 text-center">
        Contact import disabled
      </Text>

      <Text className="text-base text-neutral-500 mb-8 text-center">
        To import contacts, you need to grant permission to access your
        contacts in your device settings.
      </Text>

      <Button
        label="ENABLE PERMISSIONS"
        onPress={handleEnablePermissions}
        className="w-full mb-4"
      />

      <Button
        label="ADD MANUAL CONTACT"
        onPress={onManualAdd}
        variant="ghost"
        className="w-full"
      />
    </View>
  );
};
