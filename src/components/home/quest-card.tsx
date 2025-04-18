import React, { useEffect, useRef } from 'react';
import { ImageBackground, View } from 'react-native';

import { ProgressBar, Text } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import type { ProgressBarRef } from '@/components/ui/progress-bar';

interface QuestCardProps {
  mode: 'story' | 'custom';
  title: string;
  subtitle: string;
  duration: number;
  xp: number;
  description: string;
  progress: number;
  showProgress?: boolean;
}

const imageMap = {
  story: require('@/../assets/images/characters/knight-full.jpg'),
  custom: require('@/../assets/images/characters/druid-full.jpg'),
};

export default function QuestCard({
  mode,
  title,
  subtitle,
  duration,
  xp,
  description,
  progress = 0,
  showProgress = false,
}: QuestCardProps) {
  // Create a reference to control the progress bar
  const progressBarRef = useRef<ProgressBarRef>(null);

  // Update the progress bar when the progress prop changes
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.setProgress(progress * 100);
    }
  }, [progress]);

  return (
    <Card className="elevation-0 mr-4 aspect-[0.75] h-[400px]">
      <ImageBackground
        source={imageMap[mode]}
        className="size-full"
        resizeMode="cover"
      >
        <View
          className={`absolute inset-0 opacity-90 ${
            mode === 'custom'
              ? 'bg-[rgba(47,129,142,0.9)]'
              : 'bg-[rgba(151,158,121,0.9)]'
          }`}
        />
        <View className="justify-start p-4">
          {/* Mode Pill */}
          <Chip className="mb-4 bg-white/20" textClassName="text-amber-100">
            {subtitle}
          </Chip>

          {/* Quest Title */}
          <Text className="max-w-[90%] text-xl font-bold text-amber-100">
            {title}
          </Text>

          {/* Quest Info */}
          <View className="mb-4 mt-2">
            <Text className="text-base font-bold text-amber-100 opacity-90">
              {duration} mins • {xp} XP
            </Text>
          </View>

          {description !== '' && (
            <Text className="text-base text-amber-100 opacity-90">
              {description}
            </Text>
          )}
        </View>

        {/* Add progress bar at the bottom */}
        {showProgress && (
          <View className="absolute inset-x-4 bottom-4">
            <View className="mb-1 flex-row items-center">
              <Text className="mr-auto text-xs text-amber-100">
                Story Progress
              </Text>
              <Text className="text-xs text-amber-100">
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <ProgressBar
              ref={progressBarRef}
              initialProgress={progress * 100}
              className="h-2 rounded-full bg-white/20"
            />
          </View>
        )}
      </ImageBackground>
    </Card>
  );
}
