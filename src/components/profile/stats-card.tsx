import React from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';

import { Card, Text, View } from '@/components/ui';

type StatsCardProps = {
  questCount: number;
  minutesSaved: number;
  streakCount: number;
};

export function StatsCard({
  questCount,
  minutesSaved,
  streakCount,
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

        <Pressable
          className="items-center"
          onPress={() => router.push('/streak-celebration')}
        >
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-teal-700">
              {streakCount}
            </Text>
          </View>
          <Text className="text-gray-600">Day Streak</Text>
        </Pressable>
      </View>
    </Card>
  );
}
