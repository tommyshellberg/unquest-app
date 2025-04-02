import React from 'react';
import { Image } from 'react-native';

import CHARACTERS from '@/app/data/characters';
import { Card, Text } from '@/components/ui';

type ProfileCardProps = {
  character: any;
};

export function ProfileCard({ character }: ProfileCardProps) {
  const characterDetails = CHARACTERS.find((c) => c.id === character.type);

  return (
    <Card className="mx-4 mt-4 items-center p-5">
      <Image
        source={characterDetails?.profileImage || characterDetails?.image}
        className="mb-4 size-24 rounded-full"
      />
      <Text className="text-2xl font-bold">{character.name}</Text>
      <Text className="text-gray-600">
        Level {character.level} {character.type}
      </Text>
    </Card>
  );
}
