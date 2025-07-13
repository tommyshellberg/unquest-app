import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useMemo } from 'react';
import { ScrollView } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AVAILABLE_CUSTOM_QUEST_STORIES } from '@/app/data/quests';
import { Image, Text, View, ScreenContainer } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';
import { type Quest, type StoryQuestTemplate } from '@/store/types';
import { StreakCounter } from '@/components/StreakCounter';

import { StoryNarration } from './StoryNarration';

type QuestCompleteProps = {
  quest: Quest & { heroName?: string };
  story: string;
  onContinue?: () => void;
  continueText?: string;
  showActionButton?: boolean;
  disableEnteringAnimations?: boolean;
};

export function QuestComplete({
  quest,
  story,
  onContinue,
  continueText = 'Continue',
  showActionButton = true,
  disableEnteringAnimations = false,
}: QuestCompleteProps) {
  const character = useCharacterStore((state) => state.character);
  const characterName = character?.name || 'Adventurer';
  const clearRecentCompletedQuest = useQuestStore(
    (state) => state.clearRecentCompletedQuest
  );
  const lottieRef = useRef<LottieView>(null);

  const headerOpacity = useSharedValue(0);
  const storyOpacity = useSharedValue(0);
  const rewardOpacity = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const storyStyle = useAnimatedStyle(() => ({
    opacity: storyOpacity.value,
  }));

  const _rewardStyle = useAnimatedStyle(() => ({
    opacity: rewardOpacity.value,
  }));

  useEffect(() => {
    // Initial celebration animations
    headerOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    storyOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    rewardOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));

    // Play Lottie animation
    if (lottieRef.current) {
      setTimeout(() => {
        lottieRef.current?.play();
      }, 300);
    }
  }, [headerOpacity, storyOpacity, rewardOpacity]);

  // Determine if this is a story quest or custom quest - they need different card styling
  const isStoryQuest = quest.mode === 'story';

  // Get random custom quest story if it's a custom quest
  const customQuestStory = useMemo(() => {
    if (quest.mode === 'custom') {
      let matchingStories: typeof AVAILABLE_CUSTOM_QUEST_STORIES = [];

      // First, try to find stories matching the quest category
      if ('category' in quest && quest.category) {
        matchingStories = AVAILABLE_CUSTOM_QUEST_STORIES.filter(
          (storyItem) =>
            storyItem.category.toLowerCase() === quest.category?.toLowerCase()
        );
      }

      // If no matching stories found (e.g., 'social' category), pick from a random category
      if (matchingStories.length === 0) {
        // Get all unique categories
        const allCategories = [
          ...new Set(AVAILABLE_CUSTOM_QUEST_STORIES.map((s) => s.category)),
        ];
        // Pick a random category using quest ID as seed
        const categoryIndex =
          quest.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) %
          allCategories.length;
        const randomCategory = allCategories[categoryIndex];

        matchingStories = AVAILABLE_CUSTOM_QUEST_STORIES.filter(
          (storyItem) => storyItem.category === randomCategory
        );
      }

      // If we have stories, pick one
      if (matchingStories.length > 0) {
        // Use quest ID to generate a consistent random index
        const questIdHash =
          quest.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) %
          matchingStories.length;
        return matchingStories[questIdHash].story;
      }
    }
    return null;
  }, [quest]);

  // Use custom story if available, otherwise use provided story
  const displayStory = customQuestStory || story;

  // Debug logging
  console.log('[QuestComplete] Quest mode:', quest.mode);
  console.log('[QuestComplete] isStoryQuest:', isStoryQuest);
  if (quest.mode === 'story') {
    console.log('[QuestComplete] Quest audioFile:', (quest as any).audioFile);
  }

  const handleContinue = () => {
    // Clear the quest state - this will trigger navigation
    clearRecentCompletedQuest();

    // Navigate to continue or home
    if (onContinue) {
      onContinue();
    } else {
      router.push('/(app)');
    }
  };

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
      <ScreenContainer className="items-center justify-between px-6">
        <Animated.View className="mb-4 mt-6 items-center" style={headerStyle}>
          <Text className="text-cream text-center text-2xl font-bold drop-shadow-md">
            Well done, {characterName}!
          </Text>
          <Text className="text-cream text-lg drop-shadow-md">
            You've completed the quest!
          </Text>

          {/* Streak Counter with Lottie Animation */}
          <View className="relative mt-6 h-[120px] w-full items-center justify-center">
            <LottieView
              ref={lottieRef}
              source={require('@/../assets/animations/congrats.json')}
              autoPlay={false}
              loop={false}
              style={{
                position: 'absolute',
                width: '150%',
                height: '150%',
                opacity: 0.8,
              }}
            />
            <StreakCounter animate={true} size="large" disablePress={true} />
          </View>
        </Animated.View>

        <Animated.View
          entering={disableEnteringAnimations ? undefined : FadeInDown.delay(200).duration(600)}
          className="my-4 w-full"
          style={[storyStyle, isStoryQuest ? { flex: 1 } : {}]}
        >
          <Card
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
                {displayStory || 'Congratulations on completing your quest!'}
              </Text>
            </ScrollView>
          </Card>

          {/* Audio Controls - Only show if the quest has audio */}
          {isStoryQuest && quest.mode === 'story' && quest.audioFile && (
            <StoryNarration quest={quest as StoryQuestTemplate} />
          )}
        </Animated.View>

        <Animated.View entering={disableEnteringAnimations ? undefined : FadeInDown.delay(400).duration(600)}>
          <View className="mb-6 items-center">
            <Text className="text-lg font-bold">
              Reward: {quest.reward.xp} XP
            </Text>
          </View>

          {showActionButton && (
            <Button
              label={continueText}
              onPress={handleContinue}
              accessibilityLabel={continueText}
            />
          )}
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}
