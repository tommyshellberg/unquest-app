import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollView } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AVAILABLE_CUSTOM_QUEST_STORIES } from '@/app/data/quests';
import { Image, ScreenContainer, Text, View } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';
import { type Quest, type StoryQuestTemplate } from '@/store/types';

import { StoryNarration } from './StoryNarration';

type QuestCompleteProps = {
  quest: Quest & {
    heroName?: string;
    mode?: 'story' | 'custom' | 'cooperative';
  };
  story: string;
  onContinue?: () => void;
  continueText?: string;
  showActionButton?: boolean;
  disableEnteringAnimations?: boolean;
};

// All POI images mapped statically (React Native doesn't support dynamic requires)
const POI_IMAGES = {
  1: require('@/../assets/images/fog-pois/vaedros-poi-img-1.png'),
  2: require('@/../assets/images/fog-pois/vaedros-poi-img-2.png'),
  3: require('@/../assets/images/fog-pois/vaedros-poi-img-3.png'),
  4: require('@/../assets/images/fog-pois/vaedros-poi-img-4.png'),
  5: require('@/../assets/images/fog-pois/vaedros-poi-img-5.png'),
  6: require('@/../assets/images/fog-pois/vaedros-poi-img-6.png'),
  7: require('@/../assets/images/fog-pois/vaedros-poi-img-7.png'),
  8: require('@/../assets/images/fog-pois/vaedros-poi-img-8.png'),
  9: require('@/../assets/images/fog-pois/vaedros-poi-img-9.png'),
  10: require('@/../assets/images/fog-pois/vaedros-poi-img-10.png'),
  11: require('@/../assets/images/fog-pois/vaedros-poi-img-11.png'),
  12: require('@/../assets/images/fog-pois/vaedros-poi-img-12.png'),
  13: require('@/../assets/images/fog-pois/vaedros-poi-img-13.png'),
  14: require('@/../assets/images/fog-pois/vaedros-poi-img-14.png'),
  15: require('@/../assets/images/fog-pois/vaedros-poi-img-15.png'),
  16: require('@/../assets/images/fog-pois/vaedros-poi-img-16.png'),
  17: require('@/../assets/images/fog-pois/vaedros-poi-img-17.png'),
  18: require('@/../assets/images/fog-pois/vaedros-poi-img-18.png'),
  19: require('@/../assets/images/fog-pois/vaedros-poi-img-19.png'),
  20: require('@/../assets/images/fog-pois/vaedros-poi-img-20.png'),
  21: require('@/../assets/images/fog-pois/vaedros-poi-img-21.png'),
  22: require('@/../assets/images/fog-pois/vaedros-poi-img-22.png'),
  23: require('@/../assets/images/fog-pois/vaedros-poi-img-23.png'),
  24: require('@/../assets/images/fog-pois/vaedros-poi-img-24.png'),
  25: require('@/../assets/images/fog-pois/vaedros-poi-img-25.png'),
  26: require('@/../assets/images/fog-pois/vaedros-poi-img-26.png'),
  27: require('@/../assets/images/fog-pois/vaedros-poi-img-27.png'),
  28: require('@/../assets/images/fog-pois/vaedros-poi-img-28.png'),
  29: require('@/../assets/images/fog-pois/vaedros-poi-img-29.png'),
  30: require('@/../assets/images/fog-pois/vaedros-poi-img-30.png'),
  31: require('@/../assets/images/fog-pois/vaedros-poi-img-31.png'),
} as const;

// Helper function to get the appropriate quest image
function getQuestImage(quest: QuestCompleteProps['quest']) {
  // For story quests, extract the base quest number from the ID (e.g., "quest-1a" -> "1")
  if (quest.mode === 'story') {
    // Use customId if available (this is the template ID like 'quest-1'), otherwise use id
    const questIdToMatch = (quest as any).customId || quest.id;
    const match = questIdToMatch.match(/quest-(\d+)[a-z]?/);
    if (match) {
      const questNumber = parseInt(match[1], 10);
      // Use the specific image for this quest number if available
      if (questNumber >= 1 && questNumber <= 31) {
        return POI_IMAGES[questNumber as keyof typeof POI_IMAGES];
      }
    }
  }

  // For custom/cooperative quests or as fallback, use a hash of the quest ID to pick an image
  // This ensures the same quest always gets the same image
  const hash = quest.id.split('').reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);

  // We have 31 images available (1-31)
  const imageNumber = ((Math.abs(hash) % 31) + 1) as keyof typeof POI_IMAGES;
  return POI_IMAGES[imageNumber];
}

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
  console.log('[QuestComplete] Quest ID:', quest.id);
  console.log('[QuestComplete] Quest customId:', (quest as any).customId);
  console.log('[QuestComplete] isStoryQuest:', isStoryQuest);
  if (quest.mode === 'story') {
    console.log('[QuestComplete] Quest audioFile:', (quest as any).audioFile);
  }

  const handleContinue = () => {
    // Clear the quest state - this will trigger navigation
    clearRecentCompletedQuest();

    // If there's a custom onContinue handler, use it
    if (onContinue) {
      onContinue();
    } else {
      // Default navigation is handled by NavigationGate based on state
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
      <ScreenContainer className="items-center justify-between px-4">
        <Animated.View className="mb-3 mt-4 w-full" style={headerStyle}>
          <Text className="text-cream mb-2 text-center text-2xl font-bold drop-shadow-md">
            Quest Complete!
          </Text>

          {quest.title && (
            <Text className="text-cream mb-4 text-center text-lg font-medium italic drop-shadow-md">
              {quest.title}
            </Text>
          )}

          {/* Quest card with background image */}
          <View className="relative mx-auto h-[160px] w-[160px] overflow-hidden rounded-xl shadow-lg">
            {/* Background image */}
            {quest.id && (
              <Image
                source={getQuestImage(quest)}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                }}
                resizeMode="cover"
              />
            )}

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
            <View className="absolute bottom-2 left-0 right-0 items-center">
              <View className="rounded-full bg-white/90 px-3 py-1 shadow-md">
                <Text className="text-sm font-bold text-neutral-800">
                  +{quest.reward.xp} XP
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={
            disableEnteringAnimations
              ? undefined
              : FadeInDown.delay(200).duration(600)
          }
          className="my-2 w-full flex-1"
          style={storyStyle}
        >
          <Card className="flex-1 rounded-xl bg-white/90">
            <ScrollView
              className="px-4"
              contentContainerStyle={{ paddingVertical: 16 }}
              showsVerticalScrollIndicator={true}
            >
              <Text className="text-sm leading-6 text-neutral-800">
                {displayStory || 'Congratulations on completing your quest!'}
              </Text>
            </ScrollView>
          </Card>

          {/* Audio Controls - Only show for story quests */}
          {isStoryQuest && quest.mode === 'story' && (
            <StoryNarration quest={quest as StoryQuestTemplate} />
          )}
        </Animated.View>

        <Animated.View
          entering={
            disableEnteringAnimations
              ? undefined
              : FadeInDown.delay(400).duration(600)
          }
          className="mb-4"
        >
          {showActionButton && (
            <>
              <Button
                label={continueText}
                onPress={handleContinue}
                accessibilityLabel={continueText}
              />
              {quest.questRunId && quest.id !== 'quest-1' && (
                <Button
                  label="Add Reflection"
                  variant="secondary"
                  onPress={() => {
                    router.push({
                      pathname: '/(app)/quest/reflection',
                      params: {
                        questId: quest.id,
                        questRunId: quest.questRunId,
                        duration: quest.durationMinutes,
                      },
                    });
                  }}
                  className="mt-3"
                  accessibilityLabel="Reflect on quest"
                />
              )}
            </>
          )}
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}
