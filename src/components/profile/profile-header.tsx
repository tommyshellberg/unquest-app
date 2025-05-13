import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/ui';

type ProfileHeaderProps = {
  onSettingsPress: () => void;
};

export function ProfileHeader({ onSettingsPress }: ProfileHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5">
      <Text className="text-3xl font-semibold text-teal-800">Profile</Text>
      <Pressable
        className="rounded-full bg-neutral-300/50 p-2"
        onPress={onSettingsPress}
      >
        <Feather name="settings" size={24} color="#334738" />
      </Pressable>
    </View>
  );
}
