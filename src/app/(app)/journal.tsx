import React, { useCallback } from 'react';
import Animated from 'react-native-reanimated';

import { useQuestRuns } from '@/api/quest';
import { StreakCounter } from '@/components/StreakCounter';
import {
  ActivityIndicator,
  FocusAwareStatusBar,
  ScreenContainer,
  ScreenHeader,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import colors from '@/components/ui/colors';

import { EmptyState, FilterChips, QuestListItem } from '@/features/journal/components/journal-components';
import { QUESTS_PER_PAGE, SCROLL_END_THRESHOLD } from '@/features/journal/constants/journal-constants';
import {
  useJournalAnimations,
  useJournalFilters,
  useJournalPagination,
  useTransformedQuestRuns,
} from '@/features/journal/hooks/journal-hooks';

export default function JournalScreen() {
  const { page, resetPage, incrementPage } = useJournalPagination();
  const { filter, statusFilter, setFilter, setStatusFilter } =
    useJournalFilters();
  const { contentStyle } = useJournalAnimations();

  // Get quest runs from server
  const { data, isLoading } = useQuestRuns({
    page,
    limit: QUESTS_PER_PAGE,
  });

  // Transform and filter quests
  const sortedQuests = useTransformedQuestRuns(data, filter, statusFilter);

  // Load more function for pagination
  const loadMore = useCallback(() => {
    if (data && page < data.totalPages) {
      incrementPage();
    }
  }, [data, page, incrementPage]);

  const handleFilterChange = useCallback(
    (newFilter: typeof filter) => {
      setFilter(newFilter, resetPage);
    },
    [setFilter, resetPage]
  );

  const handleStatusFilterChange = useCallback(
    (newStatusFilter: typeof statusFilter) => {
      setStatusFilter(newStatusFilter, resetPage);
    },
    [setStatusFilter, resetPage]
  );

  return (
    <View className="flex-1">
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
          <FilterChips
            filter={filter}
            statusFilter={statusFilter}
            onFilterChange={handleFilterChange}
            onStatusFilterChange={handleStatusFilterChange}
          />

          {/* Quest List */}
          <ScrollView
            className="flex-1 px-4 pt-2"
            showsVerticalScrollIndicator={false}
            onScrollEndDrag={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } =
                nativeEvent;
              const isEndReached =
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - SCROLL_END_THRESHOLD;
              if (isEndReached && !isLoading) {
                loadMore();
              }
            }}
          >
            {isLoading && sortedQuests.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color={colors.primary[300]} />
                <Text className="mt-4 text-center text-neutral-200">
                  Loading your quest history...
                </Text>
              </View>
            ) : sortedQuests.length === 0 ? (
              <EmptyState />
            ) : (
              sortedQuests.map((quest) => (
                <QuestListItem
                  key={`${quest.id}-${quest.stopTime}`}
                  quest={quest}
                />
              ))
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
