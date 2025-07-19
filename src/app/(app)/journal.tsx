import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { Notebook } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useQuestRuns } from '@/api/quest';
import type { QuestRun } from '@/api/quest/types';
import { StreakCounter } from '@/components/StreakCounter';
import {
  ActivityIndicator,
  FocusAwareStatusBar,
  ScreenContainer,
  ScreenHeader,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import { Chip } from '@/components/ui/chip';
import colors from '@/components/ui/colors';
import { useQuestStore } from '@/store/quest-store';

type FilterType = 'all' | 'story' | 'custom' | 'cooperative';
type StatusFilter = 'all' | 'completed' | 'failed';

export default function JournalScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filter, statusFilter]);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  // Get quest runs from server - don't filter on API level to allow client-side filtering
  const { data, isLoading, error } = useQuestRuns({
    page,
    limit: 20,
  });

  // Initialize animations with sequence
  React.useEffect(() => {
    // Animate header first
    headerOpacity.value = withTiming(1, { duration: 800 }, (finished) => {
      if (finished) {
        // Then animate content
        contentOpacity.value = withTiming(1, { duration: 600 });
      }
    });
  }, [headerOpacity, contentOpacity]);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [
      {
        translateY: withTiming(
          contentOpacity.value * 0 + (1 - contentOpacity.value) * 20
        ),
      },
    ],
  }));

  // Convert server quest runs to client quest format
  const serverQuests = useMemo(() => {
    if (!data?.results) return [];

    const transformed = data.results
      .map((run: QuestRun) => {
        // Calculate stop time from available fields
        let stopTime: number | undefined;

        if (run.status === 'completed' || run.status === 'failed') {
          // Try different date fields in order of preference
          if (run.completedAt) {
            stopTime = new Date(run.completedAt).getTime();
          } else if (run.actualEndTime) {
            stopTime = new Date(run.actualEndTime).getTime();
          } else if (run.scheduledEndTime) {
            // Use scheduled end time as it's close to actual completion for short quests
            stopTime = new Date(run.scheduledEndTime).getTime();
          } else if (run.updatedAt) {
            // Only use updatedAt as last resort, and only if it's reasonable
            const updatedTime = new Date(run.updatedAt).getTime();
            const startTime = run.startedAt
              ? new Date(run.startedAt).getTime()
              : 0;
            const timeDiff = updatedTime - startTime;

            // If updatedAt is more than 24 hours after start, use scheduled end time calculation
            if (
              timeDiff > 24 * 60 * 60 * 1000 &&
              run.startedAt &&
              run.quest.durationMinutes
            ) {
              stopTime = startTime + run.quest.durationMinutes * 60 * 1000;
            } else {
              stopTime = updatedTime;
            }
          }
        }

        return {
          id: run.quest.id,
          customId: run.quest.customId, // Preserve the original quest template ID
          title: run.quest.title,
          mode: run.quest.mode,
          durationMinutes: run.quest.durationMinutes,
          reward: run.quest.reward,
          status: run.status,
          startTime: run.startedAt
            ? new Date(run.startedAt).getTime()
            : undefined,
          stopTime,
          failureReason: run.failureReason,
          story: run.quest.story, // Add the story field
          category: run.quest.category, // Add category for custom quests
          recap: run.quest.recap, // Add recap for display
        };
      })
      // Filter out quests without proper dates
      .filter((quest) => quest.stopTime && !isNaN(quest.stopTime));

    return transformed;
  }, [data]);

  // Just use server quests directly, no merging needed
  const allQuests = serverQuests;

  // Filter quests based on mode and status filters
  const filteredQuests = useMemo(() => {
    let filtered = allQuests;

    // Apply mode filter
    if (filter !== 'all') {
      filtered = filtered.filter((quest) => quest.mode === filter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((quest) => quest.status === statusFilter);
    }

    return filtered;
  }, [allQuests, filter, statusFilter]);

  // Sort quests to show newest first
  const sortedQuests = useMemo(() => {
    const sorted = [...filteredQuests].sort((a, b) => {
      return (b.stopTime || 0) - (a.stopTime || 0);
    });

    return sorted;
  }, [filteredQuests]);

  // Formats quest duration into readable format
  const formatDuration = (quest: any) => {
    if (!quest.startTime || !quest.stopTime) return 'Unknown';

    // Calculate duration
    const durationMs = quest.stopTime - quest.startTime;
    const durationMinutes = Math.round(durationMs / 60000);

    // Sanity check: if duration is way longer than expected (e.g., more than 24 hours),
    // use the quest's defined duration instead
    if (durationMinutes > 1440 && quest.durationMinutes) {
      return `~${quest.durationMinutes} minutes`;
    }

    return `${durationMinutes} minutes`;
  };

  // Load more function for pagination
  const loadMore = useCallback(() => {
    if (data && page < data.totalPages) {
      setPage((prev) => prev + 1);
    }
  }, [data, page]);

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <StreakCounter size="small" position="topRight" />

      <ScreenContainer>
        {/* Header */}
        <ScreenHeader
          title="Journal"
          subtitle="Your quest history and achievements"
        />

        {/* Filter Pills */}
        <Animated.View style={contentStyle} className="flex-1">
          {/* Mode Filters */}
          <View className="flex-row px-4 pb-2">
            <Chip
              className={`mr-2 ${filter === 'all' ? 'bg-primary-300' : 'bg-neutral-100'}`}
              textClassName={filter === 'all' ? 'font-medium' : ''}
              onPress={() => {
                setFilter('all');
                setPage(1);
              }}
            >
              All
            </Chip>
            <Chip
              className={`mr-2 ${filter === 'story' ? 'bg-primary-300' : 'bg-neutral-100'}`}
              textClassName={filter === 'story' ? 'font-medium' : ''}
              onPress={() => {
                setFilter('story');
                setPage(1);
              }}
            >
              Story
            </Chip>
            <Chip
              className={`mr-2 ${filter === 'custom' ? 'bg-primary-300' : 'bg-neutral-100'}`}
              textClassName={filter === 'custom' ? 'font-medium' : ''}
              onPress={() => {
                setFilter('custom');
                setPage(1);
              }}
            >
              Custom
            </Chip>
            <Chip
              className={`mr-2 ${filter === 'cooperative' ? 'bg-primary-300' : 'bg-neutral-100'}`}
              textClassName={filter === 'cooperative' ? 'font-medium' : ''}
              onPress={() => {
                setFilter('cooperative');
                setPage(1);
              }}
            >
              Co-op
            </Chip>
          </View>

          {/* Status Filters */}
          <View className="flex-row px-4 pb-4">
            <Chip
              className={`mr-2 ${statusFilter === 'all' ? 'bg-secondary-300' : 'bg-neutral-100'}`}
              textClassName={statusFilter === 'all' ? 'font-medium' : ''}
              onPress={() => {
                setStatusFilter('all');
                setPage(1);
              }}
            >
              All Status
            </Chip>
            <Chip
              className={`mr-2 ${statusFilter === 'completed' ? 'bg-secondary-300' : 'bg-neutral-100'}`}
              textClassName={statusFilter === 'completed' ? 'font-medium' : ''}
              onPress={() => {
                setStatusFilter('completed');
                setPage(1);
              }}
            >
              Completed
            </Chip>
            <Chip
              className={`mr-2 ${statusFilter === 'failed' ? 'bg-secondary-300' : 'bg-neutral-100'}`}
              textClassName={statusFilter === 'failed' ? 'font-medium' : ''}
              onPress={() => {
                setStatusFilter('failed');
                setPage(1);
              }}
            >
              Failed
            </Chip>
          </View>

          {/* Quest List */}
          <ScrollView
            className="flex-1 px-4 pt-2"
            showsVerticalScrollIndicator={false}
            onScrollEndDrag={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } =
                nativeEvent;
              const isEndReached =
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - 20;
              if (isEndReached && !isLoading) {
                loadMore();
              }
            }}
          >
            {isLoading && sortedQuests.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color={colors.primary[300]} />
                <Text className="mt-4 text-center text-neutral-600">
                  Loading your quest history...
                </Text>
              </View>
            ) : sortedQuests.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Notebook size={48} color={colors.neutral[500]} />
                <Text className="mt-4 text-center text-neutral-600">
                  No quests found in this category.
                </Text>
              </View>
            ) : (
              sortedQuests.map((quest) => {
                // Only allow tapping on completed quests
                const isCompleted = quest.status === 'completed';
                const QuestWrapper = isCompleted ? TouchableOpacity : View;

                return (
                  <QuestWrapper
                    key={`${quest.id}-${quest.stopTime}`}
                    onPress={
                      isCompleted
                        ? () => {
                            // Store the quest data temporarily for the detail view
                            router.push({
                              pathname: '/(app)/quest/[id]',
                              params: {
                                id: quest.id,
                                timestamp: quest.stopTime?.toString(),
                                from: 'journal',
                                questData: JSON.stringify(quest), // Pass the full quest data
                              },
                            });
                          }
                        : undefined
                    }
                    className="mb-4"
                  >
                    <View
                      className={`rounded-lg border-l-4 bg-cardBackground p-4 shadow-sm
                    ${
                      quest.status === 'failed'
                        ? 'border-l-red-400'
                        : quest.mode === 'story'
                          ? 'border-l-primary-200'
                          : 'border-l-muted-200'
                    }`}
                    >
                      {/* Quest Content */}
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between">
                          {/* Title with limited width to prevent overflow */}
                          <Text
                            className="flex-1 pr-2 text-lg font-medium"
                            numberOfLines={2}
                          >
                            {quest.title}
                          </Text>
                          <View className="flex-row gap-2">
                            {/* Status indicator for failed quests */}
                            {quest.status === 'failed' && (
                              <Chip
                                className="bg-red-200"
                                textClassName="text-red-500 font-medium"
                              >
                                Failed
                              </Chip>
                            )}
                            {/* Mode Pill */}
                            <Chip
                              className={`${
                                quest.mode === 'story'
                                  ? 'bg-primary-200'
                                  : quest.mode === 'cooperative'
                                    ? 'bg-blue-100'
                                    : 'bg-muted-200'
                              }`}
                              textClassName={
                                quest.mode === 'story'
                                  ? 'text-primary-500'
                                  : quest.mode === 'cooperative'
                                    ? 'text-blue-500'
                                    : 'text-secondary-500'
                              }
                            >
                              {quest.mode === 'story'
                                ? 'Story'
                                : quest.mode === 'cooperative'
                                  ? 'Co-op'
                                  : 'Custom'}
                            </Chip>
                          </View>
                        </View>

                        {/* Stats row */}
                        <View className="mt-2 flex-row items-center">
                          {/* XP - only show for completed quests */}
                          {quest.status === 'completed' && (
                            <View className="mr-3 flex-row items-center">
                              <Feather
                                name="award"
                                size={14}
                                color={colors.neutral[500]}
                              />
                              <Text className="ml-1 text-sm text-neutral-500">
                                {quest.reward.xp} XP
                              </Text>
                            </View>
                          )}

                          {/* Date */}
                          <View className="mr-3 flex-row items-center">
                            <Feather
                              name="calendar"
                              size={14}
                              color={colors.neutral[500]}
                            />
                            <Text className="ml-1 text-sm text-neutral-500">
                              {quest.stopTime
                                ? format(quest.stopTime, 'MMM d, yyyy')
                                : 'Unknown'}
                            </Text>
                          </View>

                          {/* Duration */}
                          <View className="flex-row items-center">
                            <Feather
                              name="clock"
                              size={14}
                              color={colors.neutral[500]}
                            />
                            <Text className="ml-1 text-sm text-neutral-500">
                              {formatDuration(quest)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </QuestWrapper>
                );
              })
            )}

            {/* Loading indicator for pagination */}
            {isLoading && sortedQuests.length > 0 && (
              <View className="py-4">
                <ActivityIndicator size="small" color={colors.primary[300]} />
              </View>
            )}

            {/* Extra space at bottom for better scrolling */}
            <View className="h-20" />
          </ScrollView>
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}
