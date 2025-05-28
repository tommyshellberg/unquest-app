import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AVAILABLE_CUSTOM_QUEST_STORIES } from '@/app/data/quests';
import { FailedQuest } from '@/components/failed-quest';
import { QuestComplete } from '@/components/QuestComplete';
import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useQuestStore } from '@/store/quest-store';

export default function AppQuestDetailsScreen() {
  const { id, timestamp } = useLocalSearchParams<{
    id: string;
    timestamp?: string;
  }>();

  const completedQuests = useQuestStore((state) => state.completedQuests);
  const failedQuest = useQuestStore((state) => state.failedQuest); // Global failed quest state
  const resetFailedQuest = useQuestStore((state) => state.resetFailedQuest);
  const recentCompletedQuest = useQuestStore(
    (state) => state.recentCompletedQuest
  );
  const clearRecentCompletedQuest = useQuestStore(
    (state) => state.clearRecentCompletedQuest
  );

  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
  }, [headerOpacity]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  useEffect(() => {
    console.log('[QuestDetails] Quest ID:', id);
  }, [id]);

  const handleBackNavigation = () => {
    // Clear the recent completed quest if it matches this quest
    if (recentCompletedQuest && recentCompletedQuest.id === id) {
      console.log(
        '[QuestDetails] Clearing recent completed quest on navigation:',
        id
      );
      clearRecentCompletedQuest();
    }

    // If we are viewing the globally stored failedQuest, clear it before navigating.
    if (failedQuest && failedQuest.id === id) {
      resetFailedQuest();
    }
    console.log('[QuestDetails] Navigating to app home');
    router.replace('/(app)'); // Fallback to app home
  };

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

    // Check if the current global failedQuest is the one for this screen
    if (
      failedQuest &&
      failedQuest.id === id &&
      failedQuest.status === 'failed'
    ) {
      return failedQuest;
    }

    // Check in failedQuests history from the store if you have one
    const failedQuestsHistory = useQuestStore.getState().failedQuests;
    if (failedQuestsHistory) {
      const failedMatchInHistory = failedQuestsHistory.find(
        (q) => q.id === id && q.status === 'failed'
      );
      if (failedMatchInHistory) return failedMatchInHistory;
    }

    return null;
  }, [id, timestamp, completedQuests, failedQuest]);

  if (!quest) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <FocusAwareStatusBar />
        <Feather name="alert-circle" size={48} color={colors.neutral[500]} />
        <Text className="mt-4 text-center text-neutral-600">
          Quest not found.
        </Text>
        <TouchableOpacity
          className="mt-6 rounded-lg bg-primary-300 px-6 py-3"
          onPress={handleBackNavigation} // Changed text to be more generic
        >
          <Text className="font-medium text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getQuestCompletionText = () => {
    if (quest.mode === 'story' && 'story' in quest && quest.story) {
      return quest.story;
    }
    if (quest.mode === 'custom' && 'category' in quest && quest.category) {
      const matchingStories = AVAILABLE_CUSTOM_QUEST_STORIES.filter(
        (storyItem) =>
          storyItem.category.toLowerCase() === quest.category?.toLowerCase()
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

  if (quest.status === 'completed' && quest.stopTime) {
    return (
      <View className="flex-1 bg-background">
        <FocusAwareStatusBar />
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
        <QuestComplete
          quest={quest}
          story={getQuestCompletionText()}
          showActionButton={false} // Always false in this context
        />
      </View>
    );
  }

  if (quest.status === 'failed') {
    return (
      <View className="flex-1 bg-background">
        <FocusAwareStatusBar />
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
        <FailedQuest
          quest={quest}
          onRetry={() => {
            handleBackNavigation();
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
