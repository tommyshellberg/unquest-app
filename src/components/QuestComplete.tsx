import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Image, Text, View } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';
import { type Quest } from '@/store/types';

import { StoryNarration } from './StoryNarration';

type QuestCompleteProps = {
  quest: Quest & { heroName?: string };
  story: string;
  onContinue?: () => void;
  continueText?: string;
  showActionButton?: boolean;
  showStreakCelebration?: boolean;
};

export function QuestComplete({
  quest,
  story,
  onContinue,
  continueText = 'Continue',
  showActionButton = true,
  showStreakCelebration = true,
}: QuestCompleteProps) {
  const character = useCharacterStore((state) => state.character);
  const characterName = character?.name || 'Adventurer';
  const shouldShowStreakCelebration = useCharacterStore(
    (state) => state.shouldShowStreakCelebration
  );
  const clearRecentCompletedQuest = useQuestStore(
    (state) => state.clearRecentCompletedQuest
  );
  const setShouldShowStreak = useQuestStore(
    (state) => state.setShouldShowStreak
  );

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
  }, [headerOpacity, storyOpacity, rewardOpacity]);

  // Determine if this is a story quest or custom quest - they need different card styling
  const isStoryQuest = quest.mode === 'story';

  const handleContinue = () => {
    // Set flag to show streak celebration first (before clearing quest)
    // This prevents intermediate navigation states
    if (showStreakCelebration && shouldShowStreakCelebration()) {
      setShouldShowStreak(true);
    }

    // Then clear the quest state - this will trigger navigation
    // Since quest results have higher priority than streak, no navigation
    // happens until we clear the quest
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
      <View className="flex-1 items-center justify-between p-6">
        <Animated.View className="mb-4 mt-6 items-center" style={headerStyle}>
          <Text className="text-cream text-center text-2xl font-bold drop-shadow-md">
            Well done, {characterName}!
          </Text>
          <Text className="text-cream text-lg drop-shadow-md">
            You've completed the quest!
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
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
                {story || 'Congratulations on completing your quest!'}
              </Text>
            </ScrollView>
          </Card>

          {/* Audio Controls - Only show if the quest has audio */}
          {isStoryQuest && quest.audioFile && (
            <View className="mt-4 w-full">
              <StoryNarration quest={quest} />
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
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
      </View>
    </View>
  );
}
