import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { ScrollView, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Button, Image, View } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { useCharacterStore } from '@/store/character-store';
import { type Quest } from '@/store/types';

import { StoryNarration } from './StoryNarration';
import { StreakCounter } from './StreakCounter';

type Props = {
  quest: Quest;
  story: string;
  onClaim: () => void;
};

export function QuestComplete({ quest, story, onClaim }: Props) {
  const character = useCharacterStore((state) => state.character);
  const characterName = character?.name || 'Adventurer';
  const lottieRef = useRef<LottieView>(null);

  const scale = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const storyOpacity = useSharedValue(0);
  const rewardOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const storyStyle = useAnimatedStyle(() => ({
    opacity: storyOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const rewardStyle = useAnimatedStyle(() => ({
    opacity: rewardOpacity.value,
  }));

  useEffect(() => {
    let isMounted = true;

    // Initial celebration animations
    scale.value = withSequence(withSpring(1.2), withSpring(1));

    headerOpacity.value = withDelay(450, withTiming(1, { duration: 1000 }));
    storyOpacity.value = withDelay(1000, withTiming(1, { duration: 1000 }));
    rewardOpacity.value = withDelay(3000, withTiming(1, { duration: 1000 }));
    buttonOpacity.value = withDelay(3500, withTiming(1, { duration: 625 }));
    buttonTranslateY.value = withDelay(3500, withSpring(0));

    // Play the Lottie animation once
    if (lottieRef.current) {
      lottieRef.current.play();
    }

    return () => {
      isMounted = false;

      // Cancel animations
      cancelAnimation(scale);
      cancelAnimation(headerOpacity);
      cancelAnimation(storyOpacity);
      cancelAnimation(rewardOpacity);
      cancelAnimation(buttonOpacity);
      cancelAnimation(buttonTranslateY);
    };
  }, []);

  return (
    <View className="relative flex-1">
      {/* Background Image */}
      <Image
        source={require('@/../assets/images/background/active-quest.jpg')}
        className="absolute inset-0 size-full"
        resizeMode="cover"
      />

      {/* Semi-transparent overlay */}
      <View className="bg-background-light/80 absolute inset-0" />

      {/* Content */}
      <View className="flex-1 items-center justify-between p-6">
        <Animated.View className="mb-4 mt-6 items-center" style={headerStyle}>
          <Text className="text-cream text-center text-2xl font-bold drop-shadow-md">
            Well done, {characterName}!
          </Text>
          <Text className="text-cream text-lg drop-shadow-md">
            You've completed the quest!
          </Text>
        </Animated.View>

        {/* Lottie animation positioned behind the streak counter */}
        <View className="relative h-[150px] w-full items-center justify-center">
          <LottieView
            ref={lottieRef}
            source={require('@/../assets/animations/congrats.json')}
            style={{
              position: 'absolute',
              width: '150%',
              height: '150%',
              opacity: 0.8,
            }}
            loop={false}
            autoPlay={false}
            resizeMode="cover"
          />
          <StreakCounter animate={true} size="large" />
        </View>

        <Animated.View
          className="my-4 min-h-[200px] w-full flex-1"
          style={storyStyle}
        >
          <Card className="flex-1 rounded-xl bg-white">
            <ScrollView className="flex-1 p-4">
              <Text className="text-base leading-6 text-neutral-800">
                {story || 'Congratulations on completing your quest!'}
              </Text>
            </ScrollView>
          </Card>

          {/* Audio Controls - Only show if the quest has audio */}
          {quest.mode === 'story' && quest.audioFile && (
            <View className="mt-4 w-full">
              <StoryNarration questId={quest.id} audioFile={quest.audioFile} />
            </View>
          )}
        </Animated.View>

        <View className="mt-4 w-full items-center gap-4">
          <Animated.View style={rewardStyle}>
            <Text className="text-cream text-center text-lg font-bold drop-shadow-md">
              Reward: {quest.reward.xp} XP
            </Text>
          </Animated.View>

          <Animated.View style={buttonStyle}>
            <Button
              label="Continue Journey"
              onPress={onClaim}
              className="min-w-[200px] rounded-xl bg-primary-400"
              textClassName="text-white font-semibold"
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
