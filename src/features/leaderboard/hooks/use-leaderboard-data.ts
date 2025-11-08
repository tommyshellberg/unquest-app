/**
 * useLeaderboardData Hook
 *
 * Transforms API leaderboard data into UI-ready format.
 * Handles friends vs global scope, different metric types, and current user positioning.
 */

import { useMemo } from 'react';

import type { LeaderboardEntry as ApiLeaderboardEntry } from '@/api/stats';

import { type LeaderboardType, type ScopeType, UI_CONFIG } from '@/features/leaderboard/constants/leaderboard-constants';
import type {
  CharacterType,
  LeaderboardEntry,
  UseLeaderboardDataReturn,
} from '@/features/leaderboard/types/leaderboard-types';

// Import Quest type from store
interface Quest {
  id: string;
  status: string;
  startTime?: number;
  stopTime?: number;
  [key: string]: any;
}

// Import LeaderboardStats type
interface LeaderboardStats {
  global: {
    questsCompleted?: ApiLeaderboardEntry[];
    questMinutes?: ApiLeaderboardEntry[];
    longestStreak?: ApiLeaderboardEntry[];
  };
  friends?: {
    questsCompleted?: ApiLeaderboardEntry[];
    questMinutes?: ApiLeaderboardEntry[];
    longestStreak?: ApiLeaderboardEntry[];
  };
}

export interface UseLeaderboardDataParams {
  leaderboardStats: LeaderboardStats | undefined;
  selectedType: LeaderboardType;
  scope: ScopeType;
  currentUserId: string | undefined;
  friendsData: { friends: { _id: string }[] } | undefined;
  character: { name: string; type: CharacterType; level: number } | undefined;
  completedQuests: Quest[];
  totalMinutes: number;
  dailyQuestStreak: number;
}

/**
 * Transform and filter leaderboard data based on scope and type
 */
export function useLeaderboardData({
  leaderboardStats,
  selectedType,
  scope,
  currentUserId,
  friendsData,
  character,
  completedQuests,
  totalMinutes,
  dailyQuestStreak,
}: UseLeaderboardDataParams): UseLeaderboardDataReturn {
  // Transform API data to UI format
  const leaderboardData = useMemo((): LeaderboardEntry[] => {
    if (!leaderboardStats) return [];

    let apiData: ApiLeaderboardEntry[] = [];

    // Get the appropriate data based on scope and type
    if (scope === 'friends' && leaderboardStats.friends) {
      switch (selectedType) {
        case 'quests':
          apiData = leaderboardStats.friends.questsCompleted || [];
          break;
        case 'minutes':
          apiData = leaderboardStats.friends.questMinutes || [];
          break;
        case 'streak':
          apiData = leaderboardStats.friends.longestStreak || [];
          break;
      }
    } else {
      switch (selectedType) {
        case 'quests':
          apiData = leaderboardStats.global.questsCompleted || [];
          break;
        case 'minutes':
          apiData = leaderboardStats.global.questMinutes || [];
          break;
        case 'streak':
          apiData = leaderboardStats.global.longestStreak || [];
          break;
      }
    }

    // Transform API data to UI format for top 10
    const top10 = apiData
      .slice(0, UI_CONFIG.topUsersLimit)
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        username: entry.characterName,
        characterType: entry.characterType as CharacterType,
        metric: entry.value,
        isCurrentUser: entry.userId === currentUserId,
        isFriend:
          scope === 'friends' ||
          friendsData?.friends?.some((friend) => friend._id === entry.userId) ||
          false,
      }));

    // Check if current user is in top 10
    const userInTop10 = top10.some((entry) => entry.isCurrentUser);

    // If user not in top 10, add them from local data
    if (!userInTop10 && currentUserId && character) {
      // Get user's metric based on selected type
      let userMetric = 0;
      switch (selectedType) {
        case 'quests':
          userMetric = completedQuests.length;
          break;
        case 'minutes':
          userMetric = totalMinutes;
          break;
        case 'streak':
          userMetric = dailyQuestStreak;
          break;
      }

      // Only add user if they have data for this metric
      if (userMetric > 0) {
        const userLeaderboardEntry: LeaderboardEntry = {
          userId: currentUserId,
          username: character.name,
          characterType: character.type,
          metric: userMetric,
          isCurrentUser: true,
          isFriend: scope === 'friends',
          isSeparated: true,
        };

        // Add user entry without rank number
        if (top10.length > 0) {
          return [...top10, userLeaderboardEntry];
        }
        return [userLeaderboardEntry];
      }
    }

    return top10;
  }, [
    leaderboardStats,
    selectedType,
    scope,
    currentUserId,
    friendsData,
    character,
    completedQuests.length,
    totalMinutes,
    dailyQuestStreak,
  ]);

  // Find current user's position in global leaderboard
  const currentUserPosition = useMemo(() => {
    if (!leaderboardStats || scope === 'friends') return null;

    let apiData: ApiLeaderboardEntry[] = [];
    switch (selectedType) {
      case 'quests':
        apiData = leaderboardStats.global.questsCompleted || [];
        break;
      case 'minutes':
        apiData = leaderboardStats.global.questMinutes || [];
        break;
      case 'streak':
        apiData = leaderboardStats.global.longestStreak || [];
        break;
    }

    const userIndex = apiData.findIndex(
      (entry) => entry.userId === currentUserId
    );
    return userIndex >= 0 ? userIndex + 1 : null;
  }, [leaderboardStats, selectedType, scope, currentUserId]);

  const topUser = leaderboardData[0];
  const restOfUsers = leaderboardData.slice(1);

  return {
    leaderboardData,
    topUser,
    restOfUsers,
    currentUserPosition,
  };
}
