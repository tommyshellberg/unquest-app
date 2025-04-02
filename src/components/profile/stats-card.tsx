import React from 'react';

import { Card, Text, View } from '@/components/ui';

type StatsCardProps = {
  questCount: number;
  minutesSaved: number;
  friendsCount: number;
};

export function StatsCard({
  questCount,
  minutesSaved,
  friendsCount,
}: StatsCardProps) {
  return (
    <Card className="mx-4 mt-4 p-5">
      <View className="flex-row justify-around">
        <View className="items-center">
          <Text className="text-2xl font-bold text-teal-700">{questCount}</Text>
          <Text className="text-gray-600">Quests</Text>
        </View>

        <View className="h-4/5 w-px bg-gray-300" />

        <View className="items-center">
          <Text className="text-2xl font-bold text-teal-700">
            {minutesSaved}
          </Text>
          <Text className="text-gray-600">Minutes Saved</Text>
        </View>

        <View className="h-4/5 w-px bg-gray-300" />

        <View className="items-center">
          <Text className="text-2xl font-bold text-teal-700">
            {friendsCount}
          </Text>
          <Text className="text-gray-600">Friends</Text>
        </View>
      </View>
    </Card>
  );
}
