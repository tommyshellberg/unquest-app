import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { QuestRunsResponse } from '@/api/quest/types';

import {
  CONTENT_ANIMATION_DURATION,
  CONTENT_TRANSLATE_Y_OFFSET,
  HEADER_ANIMATION_DURATION,
} from '@/features/journal/constants/journal-constants';
import type {
  FilterType,
  StatusFilter,
  TransformedQuest,
} from '@/features/journal/types/journal-types';
import { transformQuestRun } from '@/features/journal/utils/journal-utils';

/**
 * Hook to manage filter state and reset pagination when filters change
 */
export function useJournalFilters() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const handleFilterChange = useCallback(
    (newFilter: FilterType, onPageReset: () => void) => {
      setFilter(newFilter);
      onPageReset();
    },
    []
  );

  const handleStatusFilterChange = useCallback(
    (newStatusFilter: StatusFilter, onPageReset: () => void) => {
      setStatusFilter(newStatusFilter);
      onPageReset();
    },
    []
  );

  return {
    filter,
    statusFilter,
    setFilter: handleFilterChange,
    setStatusFilter: handleStatusFilterChange,
  };
}

/**
 * Hook to manage pagination state
 */
export function useJournalPagination() {
  const [page, setPage] = useState(1);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const incrementPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  return {
    page,
    resetPage,
    incrementPage,
  };
}

/**
 * Hook to manage journal screen animations
 */
export function useJournalAnimations() {
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate header first
    headerOpacity.value = withTiming(
      1,
      { duration: HEADER_ANIMATION_DURATION },
      (finished) => {
        if (finished) {
          // Then animate content
          contentOpacity.value = withTiming(1, {
            duration: CONTENT_ANIMATION_DURATION,
          });
        }
      }
    );
  }, [headerOpacity, contentOpacity]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [
      {
        translateY: withTiming(
          contentOpacity.value * 0 +
            (1 - contentOpacity.value) * CONTENT_TRANSLATE_Y_OFFSET
        ),
      },
    ],
  }));

  return {
    headerStyle,
    contentStyle,
  };
}

/**
 * Hook to transform and filter quest runs from API data
 */
export function useTransformedQuestRuns(
  data: QuestRunsResponse | undefined,
  filter: FilterType,
  statusFilter: StatusFilter
) {
  // Convert server quest runs to client quest format
  const serverQuests = useMemo(() => {
    if (!data?.results) return [];

    return data.results
      .map(transformQuestRun)
      .filter((quest): quest is TransformedQuest => quest !== null);
  }, [data]);

  // Filter quests based on mode and status filters
  const filteredQuests = useMemo(() => {
    let filtered = serverQuests;

    // Apply mode filter
    if (filter !== 'all') {
      filtered = filtered.filter((quest) => quest.mode === filter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((quest) => quest.status === statusFilter);
    }

    return filtered;
  }, [serverQuests, filter, statusFilter]);

  // Sort quests to show newest first
  const sortedQuests = useMemo(() => {
    return [...filteredQuests].sort((a, b) => {
      return (b.stopTime || 0) - (a.stopTime || 0);
    });
  }, [filteredQuests]);

  return sortedQuests;
}
