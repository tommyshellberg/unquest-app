import { act, renderHook } from '@testing-library/react-hooks';

import { useCharacterStore } from './character-store';

// Mock storage
jest.mock('@/lib/storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Character Store - Streak Management', () => {
  beforeEach(() => {
    // Reset the store before each test
    useCharacterStore.setState({
      selectedCharacter: null,
      dailyQuestStreak: 0,
      lastStreakCelebrationShown: null,
    });
    jest.clearAllMocks();
  });

  describe('setStreak', () => {
    test('should update dailyQuestStreak value', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.setStreak(10);
      });

      expect(result.current.dailyQuestStreak).toBe(10);
    });

    test('should handle zero value', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Set initial streak
      act(() => {
        result.current.setStreak(5);
      });

      // Reset to zero
      act(() => {
        result.current.setStreak(0);
      });

      expect(result.current.dailyQuestStreak).toBe(0);
    });

    test('should handle large streak values', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.setStreak(365); // One year streak
      });

      expect(result.current.dailyQuestStreak).toBe(365);
    });

    test('should update multiple times correctly', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.setStreak(1);
      });
      expect(result.current.dailyQuestStreak).toBe(1);

      act(() => {
        result.current.setStreak(5);
      });
      expect(result.current.dailyQuestStreak).toBe(5);

      act(() => {
        result.current.setStreak(3);
      });
      expect(result.current.dailyQuestStreak).toBe(3);
    });

    test('should not affect other character store properties', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Set some initial state
      act(() => {
        useCharacterStore.setState({
          selectedCharacter: {
            id: 'knight',
            name: 'Knight',
            title: 'The Brave',
            backstory: 'A brave warrior',
            xp: 100,
            level: 2,
            description: 'A knight',
            profileImage: 'knight-profile.jpg',
            fullImage: 'knight-full.jpg',
          },
          dailyQuestStreak: 5,
        });
      });

      // Update streak
      act(() => {
        result.current.setStreak(10);
      });

      // Verify only streak changed
      expect(result.current.dailyQuestStreak).toBe(10);
      expect(result.current.selectedCharacter?.xp).toBe(100);
      expect(result.current.selectedCharacter?.level).toBe(2);
    });
  });

  describe('updateStreak', () => {
    test('should increment streak when completing quest on consecutive day', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Set up dates for consecutive days
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0); // Noon yesterday

      act(() => {
        useCharacterStore.setState({ dailyQuestStreak: 5 });
      });

      act(() => {
        result.current.updateStreak(yesterday.getTime());
      });

      expect(result.current.dailyQuestStreak).toBe(6);
    });

    test('should reset streak to 1 when more than one calendar day has passed', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Set up dates with 2+ day gap
      const now = new Date();
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(12, 0, 0, 0); // Noon two days ago

      act(() => {
        useCharacterStore.setState({ dailyQuestStreak: 10 });
      });

      act(() => {
        result.current.updateStreak(twoDaysAgo.getTime());
      });

      expect(result.current.dailyQuestStreak).toBe(1);
    });

    test('should start streak at 1 when no previous completion', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        result.current.updateStreak(null);
      });

      expect(result.current.dailyQuestStreak).toBe(1);
    });

    test('should handle edge case of completions near midnight', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Complete quest at 11:59 PM yesterday
      const now = new Date();
      const yesterday1159PM = new Date(now);
      yesterday1159PM.setDate(yesterday1159PM.getDate() - 1);
      yesterday1159PM.setHours(23, 59, 0, 0);

      act(() => {
        useCharacterStore.setState({ dailyQuestStreak: 5 });
      });

      // Complete quest today (even if just 2 minutes later in real time)
      act(() => {
        result.current.updateStreak(yesterday1159PM.getTime());
      });

      expect(result.current.dailyQuestStreak).toBe(6);
    });

    test('should reset streak when skipping a calendar day', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Complete quest at 12:01 AM two days ago
      const now = new Date();
      const twoDaysAgo1201AM = new Date(now);
      twoDaysAgo1201AM.setDate(twoDaysAgo1201AM.getDate() - 2);
      twoDaysAgo1201AM.setHours(0, 1, 0, 0);

      act(() => {
        useCharacterStore.setState({ dailyQuestStreak: 10 });
      });

      // Even though it might be less than 48 hours, it's still 2 calendar days
      act(() => {
        result.current.updateStreak(twoDaysAgo1201AM.getTime());
      });

      expect(result.current.dailyQuestStreak).toBe(1);
    });

    test('should maintain streak when completing multiple times in same calendar day', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Previous completion was 1 hour ago (same day)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;

      act(() => {
        useCharacterStore.setState({ dailyQuestStreak: 5 });
      });

      act(() => {
        result.current.updateStreak(oneHourAgo);
      });

      expect(result.current.dailyQuestStreak).toBe(5);
    });

    test('should set streak to 1 when current streak is 0 and completing on same day', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Previous completion was 1 hour ago (same day)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;

      act(() => {
        useCharacterStore.setState({ dailyQuestStreak: 0 });
      });

      act(() => {
        result.current.updateStreak(oneHourAgo);
      });

      expect(result.current.dailyQuestStreak).toBe(1);
    });
  });

  describe('resetStreak', () => {
    test('should reset streak to 0', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        useCharacterStore.setState({ dailyQuestStreak: 10 });
      });

      act(() => {
        result.current.resetStreak();
      });

      expect(result.current.dailyQuestStreak).toBe(0);
    });

    test('should reset streak but preserve lastStreakCelebrationShown', () => {
      const { result } = renderHook(() => useCharacterStore());

      act(() => {
        useCharacterStore.setState({
          dailyQuestStreak: 10,
          lastStreakCelebrationShown: 5,
        });
      });

      act(() => {
        result.current.resetStreak();
      });

      expect(result.current.dailyQuestStreak).toBe(0);
      // Note: resetStreak only resets the streak counter, not the celebration timestamp
      expect(result.current.lastStreakCelebrationShown).toBe(5);
    });
  });

  describe('Streak sync scenarios', () => {
    test('server streak should overwrite local optimistic update', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Local optimistic update (e.g., after quest completion)
      act(() => {
        result.current.updateStreak(Date.now() - 25 * 60 * 60 * 1000);
      });
      expect(result.current.dailyQuestStreak).toBe(1);

      // Server sync returns different value
      act(() => {
        result.current.setStreak(5);
      });

      expect(result.current.dailyQuestStreak).toBe(5);
    });

    test('should handle server returning lower streak than local', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Set high local streak
      act(() => {
        useCharacterStore.setState({ dailyQuestStreak: 10 });
      });

      // Server returns lower value (e.g., missed day was detected)
      act(() => {
        result.current.setStreak(1);
      });

      expect(result.current.dailyQuestStreak).toBe(1);
    });
  });
});
