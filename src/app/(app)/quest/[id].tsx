import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Animated, TouchableOpacity } from 'react-native';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

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

  const headerOpacity = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

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

  // Handle navigation back to journal
  const handleBackToJournal = () => {
    router.back();
  };

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

        // Return the story with a brief intro
        return `${selectedStory.story}\n\nYou earned ${quest.reward.xp} XP for completing this quest.`;
      }
    }

    // Fallback if no matching story is found
    return (
      `Congratulations on completing your quest!\n\n` +
      `Quest: ${quest.title}\n` +
      `Duration: ${quest.durationMinutes} minutes\n` +
      `You earned ${quest.reward.xp} XP for staying focused and completing this quest.`
    );
  };

  // If quest is completed and has a stopTime
  if (quest.status === 'completed' && quest.stopTime) {
    return (
      <View className="pt-safe flex-1 bg-background">
        <FocusAwareStatusBar />

        {/* Header - styled to match profile.tsx */}
        <Animated.View style={headerStyle} className="mb-4 px-4">
          <Text className="mb-3 mt-2 text-xl font-bold">Quest Details</Text>
        </Animated.View>

        {/* Use the QuestComplete component */}
        <QuestComplete
          quest={quest}
          story={getQuestCompletionText()}
          onClaim={handleBackToJournal}
          buttonText="Back to Journal"
        />
      </View>
    );
  }

  // If it's a failed quest (doesn't have status 'completed')
  if (quest && quest.status === 'failed') {
    return (
      <View className="pt-safe flex-1 bg-background">
        <FocusAwareStatusBar />

        <FailedQuest
          quest={quest}
          onBack={handleBackToJournal}
          onRetry={() => {
            useQuestStore.getState().resetFailedQuest();
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
