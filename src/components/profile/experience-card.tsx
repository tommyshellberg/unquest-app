import React from 'react';

import { Card, Text, View } from '@/components/ui';

type ExperienceCardProps = {
  character: any;
};

export function ExperienceCard({ character }: ExperienceCardProps) {
  const progress = character.currentXP / character.xpToNextLevel;

  return (
    <Card className="mx-4 mt-4 p-5">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold">Experience</Text>
        <Text>
          {character.currentXP}/{character.xpToNextLevel} XP
        </Text>
      </View>

      <View className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <View
          className="h-full bg-teal-700"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <View className="mt-1 flex-row justify-between">
        <Text>Level {character.level}</Text>
        <Text>Level {character.level + 1}</Text>
      </View>
    </Card>
  );
}
