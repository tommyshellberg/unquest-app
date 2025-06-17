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
    test('should increment streak when completing quest on new day', () => {
      const { result } = renderHook(() => useCharacterStore());

      // Mock date to be a new day but within 24 hours
      const yesterday = Date.now() - 23 * 60 * 60 * 1000; // 23 hours ago (within 24 hour window)

      act(() => {
        useCharacterStore.setState({ dailyQuestStreak: 5 });
      });

      act(() => {
        result.current.updateStreak(yesterday);
      });

      expect(result.current.dailyQuestStreak).toBe(6);
    });

    test('should maintain streak when completing multiple quests same day', () => {
      const { result } = renderHook(() => useCharacterStore());

      const oneHourAgo = Date.now() - 60 * 60 * 1000;

      act(() => {
        useCharacterStore.setState({ dailyQuestStreak: 5 });
      });

      act(() => {
        result.current.updateStreak(oneHourAgo);
      });

      expect(result.current.dailyQuestStreak).toBe(5);
    });

    test('should reset streak to 1 when more than 24 hours have passed', () => {
      const { result } = renderHook(() => useCharacterStore());

      const twoDaysAgo = Date.now() - 49 * 60 * 60 * 1000; // 49 hours ago

      act(() => {
        useCharacterStore.setState({ dailyQuestStreak: 10 });
      });

      act(() => {
        result.current.updateStreak(twoDaysAgo);
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