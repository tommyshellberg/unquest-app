import LottieView from 'lottie-react-native';
import React, { useRef, useEffect } from 'react';
import { Image, Text, View } from '@/components/ui';
import { getQuestImage } from './utils';
import type { QuestImageProps } from './types';
import { ANIMATION_TIMING } from './constants';

export function QuestImage({ quest, disableAnimations = false }: QuestImageProps) {
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (!disableAnimations && lottieRef.current) {
      setTimeout(() => {
        lottieRef.current?.play();
      }, ANIMATION_TIMING.LOTTIE_DELAY);
    }
  }, [disableAnimations]);

  return (
    <View
      className="relative mx-auto size-[160px] overflow-hidden rounded-xl shadow-lg"
      accessibilityLabel="Quest completion image"
      testID="quest-image-container"
    >
      {/* Background image */}
      <Image
        source={getQuestImage(quest)}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
        resizeMode="cover"
        testID="quest-image"
        accessibilityLabel="Quest completion image"
      />

      {/* Lottie animation overlay */}
      <LottieView
        ref={lottieRef}
        source={require('@/../assets/animations/congrats.json')}
        autoPlay={false}
        loop={false}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.3,
        }}
      />

      {/* XP badge positioned at bottom center */}
      <View className="absolute inset-x-0 bottom-2 items-center">
        <View
          className="rounded-full bg-white/90 px-3 py-1 shadow-md"
          accessibilityLabel={`Experience points reward: ${quest.reward.xp} XP`}
          accessibilityRole="text"
        >
          <Text className="text-sm font-bold text-neutral-800">
            +{quest.reward.xp} XP
          </Text>
        </View>
      </View>
    </View>
  );
}
