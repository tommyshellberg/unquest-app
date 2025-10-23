import { router } from 'expo-router';
import React, { useEffect } from 'react';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { View } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { useQuestStore } from '@/store/quest-store';
import type { QuestCompleteActionsProps } from './types';
import { ANIMATION_TIMING, ONBOARDING_QUEST_ID } from './constants';

export function QuestCompleteActions({
  quest,
  onContinue,
  continueText,
  disableAnimations = false,
}: QuestCompleteActionsProps) {
  const clearRecentCompletedQuest = useQuestStore(
    (state) => state.clearRecentCompletedQuest
  );

  const actionsOpacity = useSharedValue(0);

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
  }));

  useEffect(() => {
    if (!disableAnimations) {
      actionsOpacity.value = withDelay(
        ANIMATION_TIMING.ACTIONS_DELAY,
        withTiming(1, { duration: ANIMATION_TIMING.ACTIONS_DURATION })
      );
    } else {
      actionsOpacity.value = 1;
    }
  }, [actionsOpacity, disableAnimations]);

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

  const handleAddReflection = () => {
    const questRunId = (quest as any).questRunId;
    router.push({
      pathname: '/(app)/quest/reflection',
      params: {
        questId: quest.id,
        questRunId,
        duration: quest.durationMinutes,
      },
    });
  };

  // Show reflection button if:
  // 1. Quest has a questRunId (server-tracked quest)
  // 2. Quest is not the onboarding quest (quest-1)
  const showReflectionButton =
    (quest as any).questRunId && quest.id !== ONBOARDING_QUEST_ID;

  return (
    <Animated.View
      entering={
        disableAnimations
          ? undefined
          : FadeInDown.delay(ANIMATION_TIMING.ENTERING_DELAY_2).duration(600)
      }
      className="mb-4 w-full"
      style={actionsStyle}
      testID="quest-actions-container"
    >
      <View className="w-full flex-row justify-center gap-4 px-4">
        <Button
          label={continueText}
          onPress={handleContinue}
          accessibilityLabel={continueText}
          className="flex-1 bg-secondary-400"
        />
        {showReflectionButton && (
          <Button
            className="flex-1 bg-primary-400"
            label="Add Reflection"
            onPress={handleAddReflection}
            accessibilityLabel="Reflect on quest"
          />
        )}
      </View>
    </Animated.View>
  );
}
