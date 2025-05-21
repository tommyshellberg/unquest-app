import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useMemo, useCallback } from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AVAILABLE_CUSTOM_QUEST_STORIES } from '@/app/data/quests';
import { FailedQuest } from '@/components/failed-quest/index';
import { QuestComplete } from '@/components/QuestComplete';
import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';

export default function QuestDetailsScreen() {
  const { id, timestamp, fromJournal } = useLocalSearchParams<{
    id: string;
    timestamp?: string;
    fromJournal?: string;
  }>();

  const navigation = useNavigation();
  const isFromJournal = fromJournal === 'true';

  const completedQuests = useQuestStore((state) => state.completedQuests);
  const failedQuest = useQuestStore((state) => state.failedQuest);
  const resetFailedQuest = useQuestStore((state) => state.resetFailedQuest);
  const setOnboardingStep = useOnboardingStore((state) => state.setCurrentStep);
  const hasCompletedFirstQuestStore = useOnboardingStore(
    (state) => state.hasCompletedFirstQuest
  );

  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    console.log('[id] screen is mounting, fromJournal:', isFromJournal);

    if (id === 'quest-1' && !isFromJournal && !hasCompletedFirstQuestStore()) {
      setOnboardingStep(OnboardingStep.FIRST_QUEST_COMPLETED);
    }
  }, [id, isFromJournal, hasCompletedFirstQuestStore, setOnboardingStep]);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
  }, [headerOpacity]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const handleBackNavigation = () => {
    if (failedQuest) {
      resetFailedQuest();
    }
    if (isFromJournal || router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)');
    }
  };

  const handleContinue = () => {
    if (isFromJournal) {
      handleBackNavigation();
    } else if (id === 'quest-1') {
      console.log('Setting onboarding step to SIGNUP_PROMPT_SHOWN');
      setOnboardingStep(OnboardingStep.SIGNUP_PROMPT_SHOWN);
      router.push('/quest-completed-signup');
    } else {
      handleBackNavigation();
    }
  };

  useEffect(() => {
    return () => {
      if (failedQuest) {
        resetFailedQuest();
      }
    };
  }, [failedQuest, resetFailedQuest]);

  const quest = useMemo(() => {
    if (timestamp) {
      const completedMatch = completedQuests.find(
        (q) =>
          q.id === id &&
          q.stopTime?.toString() === timestamp &&
          q.status === 'completed'
      );
      if (completedMatch) return completedMatch;
    }
    const completedMatchNoTimestamp = completedQuests.find(
      (q) => q.id === id && q.status === 'completed'
    );
    if (completedMatchNoTimestamp) return completedMatchNoTimestamp;

    if (
      failedQuest &&
      failedQuest.id === id &&
      failedQuest.status === 'failed'
    ) {
      return failedQuest;
    }

    const failedQuestsHistory = useQuestStore.getState().failedQuests;
    const failedMatch = failedQuestsHistory.find(
      (q) => q.id === id && q.status === 'failed'
    );
    if (failedMatch) return failedMatch;

    return null;
  }, [id, timestamp, completedQuests, failedQuest]);

  if (!quest) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <FocusAwareStatusBar />
        <Feather name="alert-circle" size={48} color={colors.neutral[500]} />
        <Text className="mt-4 text-center text-neutral-600">
          Quest not found
        </Text>
        <TouchableOpacity
          className="mt-6 rounded-lg bg-primary-300 px-6 py-3"
          onPress={handleBackNavigation}
        >
          <Text className="font-medium text-white">Back to Journal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getQuestCompletionText = () => {
    if (quest.mode === 'story' && 'story' in quest) {
      return quest.story;
    }
    if (quest.mode === 'custom' && 'category' in quest) {
      const matchingStories = AVAILABLE_CUSTOM_QUEST_STORIES.filter(
        (storyItem) =>
          storyItem.category.toLowerCase() === quest.category.toLowerCase()
      );
      if (matchingStories.length > 0) {
        const questIdHash =
          quest.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) %
          matchingStories.length;
        return matchingStories[questIdHash].story;
      }
    }
    return 'Congratulations on completing your quest!';
  };

  let continueButtonText = 'Continue';
  if (isFromJournal) {
    continueButtonText = 'Back to Journal';
  } else if (id === 'quest-1') {
    continueButtonText = 'Continue Your Journey';
  }

  if (quest.status === 'completed' && quest.stopTime) {
    return (
      <View className="flex-1 bg-background">
        <FocusAwareStatusBar />
        {isFromJournal && (
          <Animated.View style={headerStyle} className="mb-4 px-4">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={handleBackNavigation}
                className="mr-3 p-1"
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Feather
                  name="arrow-left"
                  size={24}
                  color={colors.neutral[500]}
                />
              </TouchableOpacity>
              <Text className="text-xl font-bold">Quest Details</Text>
            </View>
          </Animated.View>
        )}
        <QuestComplete
          quest={quest}
          story={getQuestCompletionText()}
          onContinue={isFromJournal ? undefined : handleContinue}
          continueText={isFromJournal ? undefined : continueButtonText}
          showActionButton={!isFromJournal}
        />
      </View>
    );
  }

  if (quest && quest.status === 'failed') {
    return (
      <View className="flex-1 bg-background">
        <FocusAwareStatusBar />
        {isFromJournal && (
          <Animated.View style={headerStyle} className="mb-4 px-4">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={handleBackNavigation}
                className="mr-3 p-1"
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Feather
                  name="arrow-left"
                  size={24}
                  color={colors.neutral[500]}
                />
              </TouchableOpacity>
              <Text className="text-xl font-bold">Quest Details</Text>
            </View>
          </Animated.View>
        )}
        <FailedQuest
          quest={quest}
          onRetry={() => {
            resetFailedQuest();
            if (isFromJournal) {
              router.back();
            } else {
              router.replace('/(app)');
            }
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <FocusAwareStatusBar />
      <ActivityIndicator color={colors.primary[400]} size="large" />
      <Text className="mt-4">Loading quest details...</Text>
    </View>
  );
}
