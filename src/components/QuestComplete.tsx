import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Image, Text, View } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';
import { type Quest } from '@/store/types';

import { StoryNarration } from './StoryNarration';
import { StreakCounter } from './StreakCounter';

type QuestCompleteProps = {
  quest: Quest;
  story: string;
};

export function QuestComplete({ quest, story }: QuestCompleteProps) {
  const character = useCharacterStore((state) => state.character);
  const characterName = character?.name || 'Adventurer';
  const lottieRef = useRef<LottieView>(null);
  const clearRecentCompletedQuest = useQuestStore(
    (state) => state.clearRecentCompletedQuest
  );

  const scale = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const storyOpacity = useSharedValue(0);
  const rewardOpacity = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const storyStyle = useAnimatedStyle(() => ({
    opacity: storyOpacity.value,
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

    // Play the Lottie animation once
    if (lottieRef.current) {
      lottieRef.current.play();
    }

    // Set up a timer to clear the recent completed quest flag after a reasonable
    // amount of time (15 seconds) to ensure user has had time to see it
    const clearTimer = setTimeout(() => {
      if (isMounted) {
        clearRecentCompletedQuest();
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearTimeout(clearTimer);

      // Important: Clear the flag when component unmounts
      clearRecentCompletedQuest();

      // Cancel animations
      cancelAnimation(scale);
      cancelAnimation(headerOpacity);
      cancelAnimation(storyOpacity);
      cancelAnimation(rewardOpacity);
    };
  }, [
    clearRecentCompletedQuest,
    scale,
    headerOpacity,
    storyOpacity,
    rewardOpacity,
  ]);

  // Determine if this is a story quest or custom quest - they need different card styling
  const isStoryQuest = quest.mode === 'story';

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
          className="my-4 w-full"
          // Add flex-1 only for story quests, which usually have longer content
          style={[storyStyle, isStoryQuest ? { flex: 1 } : {}]}
        >
          <Card
            // Use dynamic styling based on quest type
            className={`rounded-xl bg-neutral-100 ${
              isStoryQuest ? 'flex-1' : 'auto-h'
            }`}
          >
            <ScrollView
              className={`px-4 ${isStoryQuest ? 'flex-1' : 'py-4'}`}
              contentContainerStyle={
                !isStoryQuest ? { paddingVertical: 12 } : undefined
              }
            >
              <Text className="text-base leading-6 text-neutral-800">
                {story || 'Congratulations on completing your quest!'}
              </Text>
            </ScrollView>
          </Card>

          {/* Audio Controls - Only show if the quest has audio */}
          {isStoryQuest && quest.audioFile && (
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
        </View>
      </View>
    </View>
  );
}
