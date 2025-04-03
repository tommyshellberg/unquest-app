import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable } from 'react-native';

import { getCharacterAvatar } from '@/app/utils/character-utils';
import { Card, Text, View } from '@/components/ui';

type FriendItemProps = {
  friend: any;
  onDelete: (friend: any) => void;
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
        <Text className="font-bold">{friend.character?.name || 'Unknown'}</Text>
        <Text className="text-gray-600">
          {friend.character?.type || 'Character'}
        </Text>
      </View>

      <View className="flex-row items-center space-x-2">
        <View className="rounded-full bg-teal-700 px-2 py-1">
          <Text className="text-xs font-bold text-white">
            Lvl {friend.character?.level || 1}
          </Text>
        </View>

        <Pressable
          className="size-8 items-center justify-center rounded-full bg-red-500"
          onPress={() => onDelete(friend)}
        >
          <Feather name="x" size={16} color="white" />
        </Pressable>
      </View>
    </Card>
  );
}
