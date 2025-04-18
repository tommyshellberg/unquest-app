import { BlurView } from 'expo-blur';
import React from 'react';
import { ImageBackground } from 'react-native';

import CHARACTERS from '@/app/data/characters';
import { Card, Text, View } from '@/components/ui';

type ProfileCardProps = {
  character: any;
};

export function ProfileCard({ character }: ProfileCardProps) {
  const characterDetails = CHARACTERS.find((c) => c.id === character.type);
  console.log('character type', character.type);

  return (
    <Card className="mx-4 mt-4 overflow-hidden">
      <ImageBackground
        source={characterDetails?.profileImage || characterDetails?.image}
        className="aspect-[1.5] w-full"
        resizeMode="cover"
      >
        <View className="flex h-full flex-col justify-between">
          {/* Top area - empty but keeps the layout vertical */}
          <View />

          {/* Bottom section with player info and blur */}
          <BlurView intensity={80} tint="light" className="overflow-hidden p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold">{character.name}</Text>
              <Text className="text-right">
                Level {character.level} {characterDetails?.type}
              </Text>
            </View>
          </BlurView>
        </View>
      </ImageBackground>
    </Card>
  );
}
