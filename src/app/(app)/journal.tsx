import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { StreakCounter } from '@/components/StreakCounter';
import { Text, View } from '@/components/ui';
import { FocusAwareStatusBar } from '@/components/ui';
import { Chip } from '@/components/ui/chip';
import colors from '@/components/ui/colors';
import { useQuestStore } from '@/store/quest-store';
import type { Quest } from '@/store/types';

type FilterType = 'all' | 'story' | 'custom';

export default function JournalScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  // Get completed quests from the store
  const completedQuests = useQuestStore((state) => state.completedQuests);

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

  // Filter quests based on the selected filter
  const filteredQuests = useMemo(() => {
    if (filter === 'all')
      return completedQuests.filter((q) => q.status === 'completed');
    return completedQuests.filter(
      (quest) => quest.mode === filter && quest.status === 'completed'
    );
  }, [completedQuests, filter]);

  // Reverse quests to show newest first
  const sortedQuests = useMemo(() => {
    return [...filteredQuests].sort((a, b) => {
      return (b.stopTime || 0) - (a.stopTime || 0);
    });
  }, [filteredQuests]);

  // Formats quest duration into readable format
  const formatDuration = (quest: Quest) => {
    if (!quest.startTime || !quest.stopTime) return 'Unknown';
    const durationMinutes = Math.round(
      (quest.stopTime - quest.startTime) / 60000
    );
    return `${durationMinutes} minutes`;
  };

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <StreakCounter size="small" position="topRight" />
      {/* Header - with animation */}
      <Animated.View style={headerStyle} className="mb-4 px-4">
        <Text className="mb-3 mt-2 text-xl font-bold">Journal</Text>
        <Text>Your quest history and achievements</Text>
      </Animated.View>

      {/* Filter Pills */}
      <Animated.View style={contentStyle} className="flex-1">
        <View className="flex-row px-4 pb-2">
          <Chip
            className={`mr-2 ${filter === 'all' ? 'bg-primary-300' : 'bg-neutral-100'}`}
            textClassName={filter === 'all' ? 'font-medium' : ''}
            onPress={() => setFilter('all')}
          >
            All
          </Chip>
          <Chip
            className={`mr-2 ${filter === 'story' ? 'bg-primary-300' : 'bg-neutral-100'}`}
            textClassName={filter === 'story' ? 'font-medium' : ''}
            onPress={() => setFilter('story')}
          >
            Story
          </Chip>
          <Chip
            className={`mr-2 ${filter === 'custom' ? 'bg-primary-300' : 'bg-neutral-100'}`}
            textClassName={filter === 'custom' ? 'font-medium' : ''}
            onPress={() => setFilter('custom')}
          >
            Custom
          </Chip>
        </View>

        {/* Quest List */}
        <ScrollView
          className="flex-1 px-4 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {sortedQuests.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Feather name="book" size={48} color={colors.neutral[500]} />
              <Text className="mt-4 text-center text-neutral-600">
                No quests found in this category.
              </Text>
            </View>
          ) : (
            sortedQuests.map((quest) => (
              <TouchableOpacity
                key={`${quest.id}-${quest.stopTime}`}
                onPress={() => {
                  router.push({
                    pathname: '/(app)/quest/[id]',
                    params: {
                      id: quest.id,
                      timestamp: quest.stopTime?.toString(),
                      from: 'journal',
                    },
                  });
                }}
                className="mb-4"
              >
                <View
                  className={`rounded-lg border-l-4 bg-cardBackground p-4 shadow-sm
                    ${quest.mode === 'story' ? 'border-l-primary-200' : 'border-l-muted-200'}`}
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
                      {/* Pill moved outside text flex for better positioning */}
                      <Chip
                        className={`${quest.mode === 'story' ? 'bg-primary-200' : 'bg-muted-200'}`}
                        textClassName={
                          quest.mode === 'story'
                            ? 'text-primary-500'
                            : 'text-secondary-500'
                        }
                      >
                        {quest.mode === 'story' ? 'Story' : 'Custom'}
                      </Chip>
                    </View>

                    {/* Stats row */}
                    <View className="mt-2 flex-row items-center">
                      {/* XP */}
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
              </TouchableOpacity>
            ))
          )}

          {/* Extra space at bottom for better scrolling */}
          <View className="h-20" />
        </ScrollView>
      </Animated.View>
    </View>
  );
}
