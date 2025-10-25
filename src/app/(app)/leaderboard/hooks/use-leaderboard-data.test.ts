import { renderHook } from '@testing-library/react-native';

import type { LeaderboardEntry as ApiLeaderboardEntry } from '@/api/stats';

import type { CharacterType } from '../types';
import { useLeaderboardData } from './use-leaderboard-data';

// Define LeaderboardStats locally to match hook
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

describe('useLeaderboardData', () => {
  const mockCharacter = {
    name: 'TestUser',
    type: 'bard' as CharacterType,
    level: 5,
  };

  const mockCompletedQuests = [
    {
      id: '1',
      status: 'completed' as const,
      startTime: 1000000,
      stopTime: 1060000, // 1 minute
    },
    {
      id: '2',
      status: 'completed' as const,
      startTime: 2000000,
      stopTime: 2120000, // 2 minutes
    },
  ];

  const mockLeaderboardStats: LeaderboardStats = {
    global: {
      questsCompleted: [
        {
          _id: '1',
          userId: '1',
          characterName: 'Dragon Slayer',
          characterType: 'knight',
          value: 150,
        },
        {
          _id: '2',
          userId: '2',
          characterName: 'Mystic Wanderer',
          characterType: 'wizard',
          value: 135,
        },
        {
          _id: '3',
          userId: '3',
          characterName: 'Quest Master',
          characterType: 'scout',
          value: 120,
        },
      ],
      questMinutes: [
        {
          _id: '1',
          userId: '1',
          characterName: 'Dragon Slayer',
          characterType: 'knight',
          value: 3200,
        },
        {
          _id: '2',
          userId: '2',
          characterName: 'Mystic Wanderer',
          characterType: 'wizard',
          value: 2800,
        },
      ],
      longestStreak: [
        {
          _id: '1',
          userId: '1',
          characterName: 'Dragon Slayer',
          characterType: 'knight',
          value: 45,
        },
        {
          _id: '2',
          userId: '2',
          characterName: 'Mystic Wanderer',
          characterType: 'wizard',
          value: 38,
        },
      ],
    },
    friends: {
      questsCompleted: [
        {
          _id: 'current-user',
          userId: 'current-user',
          characterName: 'TestUser',
          characterType: 'bard',
          value: 2,
        },
        {
          _id: '3',
          userId: '3',
          characterName: 'Quest Master',
          characterType: 'scout',
          value: 120,
        },
      ],
      questMinutes: [],
      longestStreak: [],
    },
  };

  const mockFriendsData = {
    friends: [{ _id: '3' }],
  };

  describe('Global Scope - Quests', () => {
    it('should return top 10 users for global quests plus current user', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'quests',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      // 3 top users + current user = 4
      expect(result.current.leaderboardData).toHaveLength(4);
      expect(result.current.topUser).toEqual({
        rank: 1,
        userId: '1',
        username: 'Dragon Slayer',
        characterType: 'knight',
        metric: 150,
        isCurrentUser: false,
        isFriend: false,
      });
    });

    it('should mark friends in global leaderboard', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'quests',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      const friendEntry = result.current.leaderboardData.find(
        (e) => e.userId === '3'
      );
      expect(friendEntry?.isFriend).toBe(true);
    });

    it('should mark current user when in top 10', () => {
      const statsWithCurrentUser: LeaderboardStats = {
        ...mockLeaderboardStats,
        global: {
          ...mockLeaderboardStats.global,
          questsCompleted: [
            ...mockLeaderboardStats.global.questsCompleted,
            {
              _id: 'current-user',
              userId: 'current-user',
              characterName: 'TestUser',
              characterType: 'bard',
              value: 100,
            },
          ],
        },
      };

      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: statsWithCurrentUser,
          selectedType: 'quests',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      const currentUserEntry = result.current.leaderboardData.find(
        (e) => e.userId === 'current-user'
      );
      expect(currentUserEntry?.isCurrentUser).toBe(true);
    });

    it('should add current user if not in top 10', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'quests',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      // Should have 3 top users + current user = 4
      expect(result.current.leaderboardData).toHaveLength(4);

      const currentUserEntry = result.current.leaderboardData.find(
        (e) => e.userId === 'current-user'
      );
      expect(currentUserEntry).toBeDefined();
      expect(currentUserEntry?.isCurrentUser).toBe(true);
      expect(currentUserEntry?.isSeparated).toBe(true);
      expect(currentUserEntry?.metric).toBe(2); // completed quests length
      expect(currentUserEntry?.rank).toBeUndefined(); // no rank shown
    });

    it('should not add current user if they have no data for metric', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'quests',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: [], // No completed quests
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      // Should only have 3 top users
      expect(result.current.leaderboardData).toHaveLength(3);

      const currentUserEntry = result.current.leaderboardData.find(
        (e) => e.userId === 'current-user'
      );
      expect(currentUserEntry).toBeUndefined();
    });

    it('should calculate current user position in global leaderboard', () => {
      const statsWithCurrentUser: LeaderboardStats = {
        ...mockLeaderboardStats,
        global: {
          ...mockLeaderboardStats.global,
          questsCompleted: [
            ...mockLeaderboardStats.global.questsCompleted,
            {
              _id: 'current-user',
              userId: 'current-user',
              characterName: 'TestUser',
              characterType: 'bard',
              value: 100,
            },
          ],
        },
      };

      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: statsWithCurrentUser,
          selectedType: 'quests',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      // Current user should be at position 4 (0-indexed array position 3, +1)
      expect(result.current.currentUserPosition).toBe(4);
    });

    it('should return null for current user position if not found', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'quests',
          scope: 'global',
          currentUserId: 'non-existent',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      expect(result.current.currentUserPosition).toBeNull();
    });
  });

  describe('Global Scope - Minutes', () => {
    it('should return correct data for minutes leaderboard', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'minutes',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      // 2 top users + current user = 3
      expect(result.current.leaderboardData).toHaveLength(3);
      expect(result.current.topUser?.metric).toBe(3200);
    });

    it('should add current user with totalMinutes for minutes leaderboard', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'minutes',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 100,
          dailyQuestStreak: 5,
        })
      );

      const currentUserEntry = result.current.leaderboardData.find(
        (e) => e.userId === 'current-user'
      );
      expect(currentUserEntry?.metric).toBe(100);
    });
  });

  describe('Global Scope - Streak', () => {
    it('should return correct data for streak leaderboard', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'streak',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      // 2 top users + current user = 3
      expect(result.current.leaderboardData).toHaveLength(3);
      expect(result.current.topUser?.metric).toBe(45);
    });

    it('should add current user with dailyQuestStreak for streak leaderboard', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'streak',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 10,
        })
      );

      const currentUserEntry = result.current.leaderboardData.find(
        (e) => e.userId === 'current-user'
      );
      expect(currentUserEntry?.metric).toBe(10);
    });
  });

  describe('Friends Scope', () => {
    it('should return friends leaderboard data', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'quests',
          scope: 'friends',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      expect(result.current.leaderboardData).toHaveLength(2);
      expect(result.current.topUser?.username).toBe('TestUser');
    });

    it('should mark all entries as friends in friends scope', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'quests',
          scope: 'friends',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      result.current.leaderboardData.forEach((entry) => {
        expect(entry.isFriend).toBe(true);
      });
    });

    it('should return null for currentUserPosition in friends scope', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'quests',
          scope: 'friends',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      expect(result.current.currentUserPosition).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty leaderboard stats', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: undefined,
          selectedType: 'quests',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      expect(result.current.leaderboardData).toEqual([]);
      expect(result.current.topUser).toBeUndefined();
      expect(result.current.restOfUsers).toEqual([]);
    });

    it('should handle missing character data', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'quests',
          scope: 'global',
          currentUserId: 'current-user',
          friendsData: mockFriendsData,
          character: undefined,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      // Should not add current user if no character data
      const currentUserEntry = result.current.leaderboardData.find(
        (e) => e.userId === 'current-user'
      );
      expect(currentUserEntry).toBeUndefined();
    });

    it('should handle missing userId', () => {
      const { result } = renderHook(() =>
        useLeaderboardData({
          leaderboardStats: mockLeaderboardStats,
          selectedType: 'quests',
          scope: 'global',
          currentUserId: undefined,
          friendsData: mockFriendsData,
          character: mockCharacter,
          completedQuests: mockCompletedQuests,
          totalMinutes: 3,
          dailyQuestStreak: 5,
        })
      );

      // Should still return leaderboard data
      expect(result.current.leaderboardData).toHaveLength(3);
      // But no current user entry
      const currentUserEntry = result.current.leaderboardData.find(
        (e) => e.isCurrentUser
      );
      expect(currentUserEntry).toBeUndefined();
    });
  });
});
