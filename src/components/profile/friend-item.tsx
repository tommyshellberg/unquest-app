import React from 'react';
import { Image, Pressable } from 'react-native';

import { getCharacterAvatar } from '@/app/utils/character-utils';
import { Card, Text, View } from '@/components/ui';

type Friend = {
  _id: string;
  email: string;
  character: {
    name: string;
    type: string;
    level: number;
  } | null;
};

type FriendItemProps = {
  friend: Friend;
  onDelete: (friend: Friend) => void;
};

export function FriendItem({ friend, onDelete }: FriendItemProps) {
  return (
    <Card className="mb-2 flex-row items-center p-3">
      <View className="relative">
        <Image
          source={getCharacterAvatar(friend.character?.type)}
          className="size-10 rounded-full"
        />
        <View className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 py-0.5">
          <Text className="text-xs font-bold text-white">New</Text>
        </View>
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-base font-bold text-white">
          {friend.character?.name || 'Unknown'}
        </Text>
        <Text className="text-sm text-neutral-200">
          {friend.character?.type || 'Character'}
        </Text>
      </View>

      <View className="flex-row items-center space-x-2">
        <Pressable
          className="items-center justify-center rounded-full"
          onPress={() => onDelete(friend)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${friend.character?.name || 'friend'}`}
          accessibilityHint="Tap to remove this friend from your list"
        >
          <Text className="text-base text-red-500">Remove</Text>
        </Pressable>
      </View>
    </Card>
  );
}
