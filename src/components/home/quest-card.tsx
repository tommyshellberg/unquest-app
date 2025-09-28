import React, { useEffect, useRef } from 'react';
import { ImageBackground, View } from 'react-native';

import { ProgressBar, Text } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import type { ProgressBarRef } from '@/components/ui/progress-bar';

interface QuestCardProps {
  mode: 'story' | 'custom' | 'cooperative';
  title: string;
  subtitle: string;
  duration: number;
  xp: number;
  description: string;
  progress: number;
  showProgress?: boolean;
  requiresPremium?: boolean;
  isCompleted?: boolean;
}

const imageMap = {
  story: require('@/../assets/images/background/card-background-alt.png'),
  custom: require('@/../assets/images/background/custom-quest-background-alt.png'),
  cooperative: require('@/../assets/images/background/coop-quest-background-alt.png'),
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
  requiresPremium = false,
  isCompleted = false,
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
    <Card className="elevation-0 aspect-[3/4] w-full">
      <ImageBackground
        source={imageMap[mode]}
        className="size-full"
        resizeMode="cover"
      >
        <View
          className={`absolute inset-0 opacity-90 ${
            mode === 'custom'
              ? 'bg-[rgba(47,129,142,0.2)]'
              : mode === 'cooperative'
                ? 'bg-[rgba(46,148,141,0.2)]'
                : 'bg-[rgba(151,158,121,0.2)]'
          }`}
        />
        <View className="flex-1 p-4">
          <View>
            {/* Mode Pill */}
            <Chip className="mb-4 bg-white/20" textClassName="text-white">
              {subtitle}
            </Chip>

            {/* Quest Title */}
            <Text className="max-w-[90%] text-xl font-bold text-white">
              {isCompleted ? 'Quest Complete!' : title}
            </Text>

            {/* Premium Badge */}
            {requiresPremium && (
              <View className="mt-2">
                <Chip
                  className="bg-white/20"
                  textClassName="text-white font-semibold"
                >
                  ⭐ Premium
                </Chip>
              </View>
            )}

            {/* Quest Info */}
            <View className="mb-4 mt-2">
              <Text className="text-base font-bold text-white opacity-90">
                {duration} mins • {xp} XP
              </Text>
            </View>

            {isCompleted ? (
              <Text className="text-base text-white opacity-90">
                Congratulations! You've completed the entire Vaedros storyline.
                Your quest history is preserved - start a new adventure to
                experience different story branches!
              </Text>
            ) : (
              description !== '' && (
                <Text className="text-base text-white opacity-90">
                  {description}
                </Text>
              )
            )}
          </View>
        </View>

        {/* Add progress bar at the bottom */}
        {showProgress && (
          <View className="absolute inset-x-4 bottom-4">
            <View className="mb-2 flex-row items-center">
              <Text
                className="mr-auto text-sm font-semibold text-white"
                style={{ fontWeight: '600' }}
              >
                Story Progress
              </Text>
              <Text
                className="text-sm font-semibold text-white"
                style={{ fontWeight: '600' }}
              >
                {Math.min(100, Math.round(progress * 100))}%
              </Text>
            </View>
            <ProgressBar
              ref={progressBarRef}
              initialProgress={progress * 100}
              className="h-3 rounded-full bg-white/20"
            />
          </View>
        )}
      </ImageBackground>
    </Card>
  );
}
