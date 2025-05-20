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
import { FailedQuest } from '@/components/failed-quest/index';
import { QuestComplete } from '@/components/QuestComplete';
import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useQuestStore } from '@/store/quest-store';

export default function QuestDetailsScreen() {
  // Get the quest ID from the route params
  const { id, timestamp } = useLocalSearchParams<{
    id: string;
    timestamp: string;
  }>();

  // Get all quests from store
  const completedQuests = useQuestStore((state) => state.completedQuests);
  const failedQuest = useQuestStore((state) => state.failedQuest);
  const resetFailedQuest = useQuestStore((state) => state.resetFailedQuest);

  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    console.log('[id] screen is mounting');
  }, []);

  // Initialize animation
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
  }, [headerOpacity]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  // Handle navigation back to journal
  const handleBackToJournal = () => {
    // Clear failed quest state when navigating away
    if (failedQuest) {
      resetFailedQuest();
    }
    router.back();
  };

  // Set up cleanup effect for unmount
  useEffect(() => {
    return () => {
      // Clear failed quest when component unmounts
      if (failedQuest) {
        resetFailedQuest();
      }
    };
  }, [failedQuest, resetFailedQuest]);

  // Find the specific quest by ID and timestamp (if available)
  const quest = useMemo(() => {
    // First check completed quests (with timestamp if provided)
    if (timestamp) {
      const completedMatch = completedQuests.find(
        (q) =>
          q.id === id &&
          q.stopTime?.toString() === timestamp &&
          q.status === 'completed'
      );
      if (completedMatch) return completedMatch;
    }

    // Check completed quests without timestamp
    const completedMatch = completedQuests.find(
      (q) => q.id === id && q.status === 'completed'
    );
    if (completedMatch) return completedMatch;

    // Check current failed quest
    console.log('failedQuest', failedQuest);
    if (
      failedQuest &&
      failedQuest.id === id &&
      'status' in failedQuest &&
      failedQuest.status === 'failed'
    ) {
      return failedQuest;
    }

    // Check failed quests history
    const failedQuests = useQuestStore.getState().failedQuests;
    const failedMatch = failedQuests.find(
      (q) => q.id === id && q.status === 'failed'
    );
    if (failedMatch) return failedMatch;

    return null;
  }, [id, timestamp, completedQuests, failedQuest]);

  // If the quest is not found, show an error
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
          onPress={handleBackToJournal}
        >
          <Text className="font-medium text-white">Back to Journal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Generate completion text for completed quests
  const getQuestCompletionText = () => {
    // For story quests, use the built-in story
    if (quest.mode === 'story' && 'story' in quest) {
      return quest.story;
    }

    // For custom quests, find a matching story from our collection
    if (quest.mode === 'custom' && 'category' in quest) {
      // Filter stories that match the quest category
      const matchingStories = AVAILABLE_CUSTOM_QUEST_STORIES.filter(
        (storyItem) =>
          storyItem.category.toLowerCase() === quest.category.toLowerCase()
      );

      // If we have matching stories, pick a random one (but consistently based on quest ID)
      if (matchingStories.length > 0) {
        // Use quest ID's hash to get a consistent index
        const questIdHash = quest.id
          .split('')
          .reduce((a, b) => a + b.charCodeAt(0), 0);
        const index = questIdHash % matchingStories.length;
        const selectedStory = matchingStories[index];

        // Return just the story without the XP message (since it's shown separately)
        return selectedStory.story;
      }
    }

    // Fallback if no matching story is found
    return 'Congratulations on completing your quest!';
  };

  // If quest is completed and has a stopTime
  if (quest.status === 'completed' && quest.stopTime) {
    return (
      <View className="flex-1 bg-background">
        <FocusAwareStatusBar />

        {/* Header with back arrow */}
        <Animated.View style={headerStyle} className="mb-4 px-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleBackToJournal}
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

        <QuestComplete quest={quest} story={getQuestCompletionText()} />
      </View>
    );
  }

  // If it's a failed quest (doesn't have status 'completed')
  if (quest && quest.status === 'failed') {
    return (
      <View className="flex-1 bg-background">
        <FocusAwareStatusBar />

        {/* Header with back arrow */}
        <Animated.View style={headerStyle} className="mb-4 px-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleBackToJournal}
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
            resetFailedQuest();
            router.replace('/');
          }}
        />
      </View>
    );
  }

  // Fallback case (should not reach here in normal flow)
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <FocusAwareStatusBar />
      <ActivityIndicator color={colors.primary[400]} size="large" />
      <Text className="mt-4">Loading quest details...</Text>
    </View>
  );
}
