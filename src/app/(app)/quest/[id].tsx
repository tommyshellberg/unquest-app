import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp, Notebook } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useQuestReflection } from '@/api/quest-reflection';
import { AVAILABLE_CUSTOM_QUEST_STORIES } from '@/app/data/quests';
import { FailedQuest } from '@/components/failed-quest';
import { QuestComplete } from '@/components/QuestComplete';
import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import { Button } from '@/components/ui/button';
import colors from '@/components/ui/colors';
import { useQuestStore } from '@/store/quest-store';

export default function AppQuestDetailsScreen() {
  const { id, timestamp, from, questData } = useLocalSearchParams<{
    id: string;
    timestamp?: string;
    from?: string;
    questData?: string;
  }>();

  console.log('[QuestDetails] Received params:', {
    id,
    timestamp,
    from,
    hasQuestData: !!questData,
    questDataLength: questData?.length,
  });

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
  const [isReflectionExpanded, setIsReflectionExpanded] = useState(false);

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
    // If quest ID is undefined, clear all quest states to prevent this from happening again
    if (!id || id === 'undefined') {
      console.log(
        '[QuestDetails] Quest ID is undefined, clearing all quest states'
      );
      clearRecentCompletedQuest();
      resetFailedQuest();
    } else {
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
    }

    console.log('[QuestDetails] Navigating to app home');
    router.replace('/(app)'); // Fallback to app home
  };

  const quest = useMemo(() => {
    // Priority 1: Use quest data passed from journal (includes story field)
    if (questData) {
      try {
        const parsedQuest = JSON.parse(questData);
        console.log('[QuestDetails] Using quest data from params');
        return parsedQuest;
      } catch (e) {
        console.error('[QuestDetails] Failed to parse quest data:', e);
      }
    }

    // Priority 2: Check recent completed quest (for post-completion flow)
    if (recentCompletedQuest && recentCompletedQuest.id === id) {
      console.log('[QuestDetails] Using recent completed quest');
      return recentCompletedQuest;
    }

    // Priority 3: Check current failed quest (for failure flow)
    if (
      failedQuest &&
      failedQuest.id === id &&
      failedQuest.status === 'failed'
    ) {
      console.log('[QuestDetails] Using current failed quest');
      return failedQuest;
    }

    // Priority 4: Search in completed quests (fallback)
    if (timestamp) {
      const completedMatch = completedQuests.find(
        (q) =>
          q.id === id &&
          q.stopTime?.toString() === timestamp &&
          q.status === 'completed'
      );
      if (completedMatch) {
        console.log(
          '[QuestDetails] Found quest in completed quests with timestamp'
        );
        return completedMatch;
      }
    }

    // Priority 5: Search without timestamp
    const completedMatchNoTimestamp = completedQuests.find(
      (q) => q.id === id && q.status === 'completed'
    );
    if (completedMatchNoTimestamp) {
      console.log(
        '[QuestDetails] Found quest in completed quests without timestamp'
      );
      return completedMatchNoTimestamp;
    }

    // Priority 6: Check failed quests history
    const failedQuestsHistory = useQuestStore.getState().failedQuests;
    if (failedQuestsHistory) {
      const failedMatchInHistory = failedQuestsHistory.find(
        (q) => q.id === id && q.status === 'failed'
      );
      if (failedMatchInHistory) {
        console.log('[QuestDetails] Found quest in failed quests history');
        return failedMatchInHistory;
      }
    }

    console.log('[QuestDetails] Quest not found');
    return null;
  }, [
    id,
    timestamp,
    completedQuests,
    failedQuest,
    questData,
    recentCompletedQuest,
  ]);

  // Fetch reflection from server if questRunId is available
  const questRunId = quest?.questRunId;
  const { data: serverReflection } = useQuestReflection(questRunId);

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
    // Check if quest has a reflection (either from server or local)
    const hasReflection = serverReflection || quest.reflection;

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

        {/* Show reflection section - only for completed quests */}
        {from === 'journal' && quest.status === 'completed' && (
          <View className="mx-4 mb-4">
            {serverReflection || quest.reflection ? (
              <>
                {/* Collapsible reflection header */}
                <TouchableOpacity
                  onPress={() => setIsReflectionExpanded(!isReflectionExpanded)}
                  className="flex-row items-center justify-between rounded-lg border border-neutral-200 bg-transparent p-3"
                >
                  <View className="flex-row items-center">
                    <Notebook size={20} color={colors.neutral[600]} />
                    <Text className="ml-2 text-base font-semibold text-neutral-700">
                      Reflection
                    </Text>
                    <View className="ml-2 rounded-full bg-primary-100 px-2 py-0.5">
                      <Text className="text-xs text-primary-600">Added</Text>
                    </View>
                  </View>
                  {isReflectionExpanded ? (
                    <ChevronUp size={20} color={colors.neutral[600]} />
                  ) : (
                    <ChevronDown size={20} color={colors.neutral[600]} />
                  )}
                </TouchableOpacity>

                {/* Expandable reflection content */}
                {isReflectionExpanded && (
                  <View className="mt-2 rounded-lg border border-neutral-200 p-4">
                    {/* Mood display */}
                    {(serverReflection?.mood || quest.reflection?.mood) && (
                      <View className="mb-2 flex-row items-center">
                        <Text className="text-lg">
                          {(serverReflection?.mood ||
                            quest.reflection?.mood) === 1 && '😡'}
                          {(serverReflection?.mood ||
                            quest.reflection?.mood) === 2 && '😕'}
                          {(serverReflection?.mood ||
                            quest.reflection?.mood) === 3 && '😐'}
                          {(serverReflection?.mood ||
                            quest.reflection?.mood) === 4 && '😊'}
                          {(serverReflection?.mood ||
                            quest.reflection?.mood) === 5 && '😄'}
                        </Text>
                        <Text className="ml-2 text-sm text-neutral-600">
                          Mood:{' '}
                          {serverReflection?.mood || quest.reflection?.mood}/5
                        </Text>
                      </View>
                    )}

                    {/* Activities */}
                    {serverReflection?.activities?.length ||
                    quest.reflection?.activities?.length ? (
                      <View className="mb-2">
                        <Text className="mb-1 text-sm font-medium text-neutral-600">
                          Activities:
                        </Text>
                        <View className="flex-row flex-wrap">
                          {(
                            serverReflection?.activities ||
                            quest.reflection?.activities ||
                            []
                          ).map((activity: string) => (
                            <View
                              key={activity}
                              className="mb-1 mr-1 rounded-full bg-primary-100 px-2 py-1"
                            >
                              <Text className="text-xs capitalize text-primary-600">
                                {activity.replace('-', ' ')}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}

                    {/* Reflection text */}
                    {(serverReflection?.text || quest.reflection?.text) && (
                      <Text className="text-sm italic text-neutral-600">
                        "{serverReflection?.text || quest.reflection?.text}"
                      </Text>
                    )}
                  </View>
                )}
              </>
            ) : (
              // Show "Add Reflection" button if no reflection exists
              quest.questRunId && (
                <TouchableOpacity
                  onPress={() => {
                    router.push({
                      pathname: '/(app)/quest/reflection',
                      params: {
                        questId: quest.id,
                        questRunId: quest.questRunId,
                        duration: quest.durationMinutes,
                        from: 'quest-detail',
                      },
                    });
                  }}
                  className="flex-row items-center justify-center rounded-lg bg-primary-500 px-4 py-3"
                >
                  <Notebook size={20} color={colors.white} />
                  <Text className="ml-2 font-semibold text-white">
                    Add Reflection
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}

        {from === 'journal' ? (
          <QuestComplete
            quest={quest}
            story={getQuestCompletionText()}
            showActionButton={false}
            disableEnteringAnimations={true}
          />
        ) : (
          <QuestComplete
            quest={quest}
            story={getQuestCompletionText()}
            showActionButton={true}
            disableEnteringAnimations={false}
          />
        )}
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
            <Text className="mt-6 text-xl font-bold">Quest Details</Text>
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
