import { renderHook, waitFor } from '@testing-library/react-native';
import { useQuery } from '@tanstack/react-query';

import { useQuestRunStatus, useCooperativeQuest } from './use-cooperative-quest';
import { getQuestRunStatus } from '@/lib/services/quest-run-service';
import { useQuestStore } from '@/store/quest-store';

// Mock dependencies
jest.mock('@tanstack/react-query');
jest.mock('@/lib/services/quest-run-service');
jest.mock('@/store/quest-store');
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

describe('use-cooperative-quest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useQuestRunStatus', () => {
    it('should poll quest status every 30 seconds when enabled', () => {
      // Arrange
      const mockQueryFn = jest.fn();
      (useQuery as jest.Mock).mockImplementation(({ queryFn, ...options }) => {
        mockQueryFn.mockImplementation(queryFn);
        return {
          data: null,
          isLoading: false,
          error: null,
        };
      });

      // Act
      renderHook(() => useQuestRunStatus('quest-123', true));

      // Assert
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['questRun', 'quest-123'],
          enabled: true,
          refetchInterval: 30000, // 30 seconds
          refetchIntervalInBackground: true,
          staleTime: 1000,
        })
      );
    });

    it('should not poll when disabled', () => {
      // Arrange
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      // Act
      renderHook(() => useQuestRunStatus('quest-123', false));

      // Assert
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
          refetchInterval: false,
        })
      );
    });

    it('should fetch quest run status when questRunId is provided', () => {
      // Arrange
      const mockQuestRun = {
        id: 'quest-123',
        status: 'active',
        quest: { id: 'quest-1', title: 'Test Quest' },
      };
      
      (getQuestRunStatus as jest.Mock).mockResolvedValue(mockQuestRun);
      (useQuery as jest.Mock).mockImplementation(({ queryFn }) => {
        const result = queryFn();
        return {
          data: mockQuestRun,
          isLoading: false,
          error: null,
        };
      });

      // Act
      const { result } = renderHook(() => useQuestRunStatus('quest-123', true));

      // Assert
      expect(getQuestRunStatus).toHaveBeenCalledWith('quest-123');
    });
  });

  describe('useCooperativeQuest', () => {
    it('should handle quest failure detection', async () => {
      // Arrange
      const mockRouter = require('expo-router').router;
      const mockQuestStore = {
        cooperativeQuestRun: {
          id: 'quest-123',
          status: 'active',
        },
        failQuest: jest.fn(),
        setCooperativeQuestRun: jest.fn(),
      };

      (useQuestStore as jest.Mock).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector(mockQuestStore);
        }
        return mockQuestStore;
      });

      // Mock useQuestStore.getState()
      (useQuestStore as any).getState = jest.fn().mockReturnValue(mockQuestStore);

      // Mock the query to return failed status
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          id: 'quest-123',
          status: 'failed',
          participants: [],
        },
        isLoading: false,
        error: null,
      });

      // Act
      renderHook(() => useCooperativeQuest());

      // Assert - should detect failure and update state
      await waitFor(() => {
        expect(mockQuestStore.failQuest).toHaveBeenCalled();
        expect(mockRouter.replace).toHaveBeenCalledWith('/quest-failed');
      });
    });

    it('should not fail quest if status has not changed', () => {
      // Arrange
      const mockQuestStore = {
        cooperativeQuestRun: {
          id: 'quest-123',
          status: 'active',
        },
        failQuest: jest.fn(),
        setCooperativeQuestRun: jest.fn(),
      };

      (useQuestStore as jest.Mock).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector(mockQuestStore);
        }
        return mockQuestStore;
      });

      // Mock the query to return active status (no change)
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          id: 'quest-123',
          status: 'active',
          participants: [],
        },
        isLoading: false,
        error: null,
      });

      // Act
      renderHook(() => useCooperativeQuest());

      // Assert - should not fail quest
      expect(mockQuestStore.failQuest).not.toHaveBeenCalled();
    });

    it('should only poll when cooperative quest is pending', () => {
      // Arrange
      const mockQuestStore = {
        cooperativeQuestRun: {
          id: 'quest-123',
          status: 'pending',
        },
        pendingQuest: { id: 'quest-1' },
      };

      (useQuestStore as jest.Mock).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector(mockQuestStore);
        }
        return mockQuestStore;
      });

      let queryOptions: any;
      (useQuery as jest.Mock).mockImplementation((options) => {
        queryOptions = options;
        return { data: null, isLoading: false, error: null };
      });

      // Act
      renderHook(() => useCooperativeQuest());

      // Find the call to useQuery for quest run status
      const questRunStatusCall = (useQuery as jest.Mock).mock.calls.find(
        call => call[0].queryKey?.[0] === 'questRun'
      );

      // Assert - should enable polling for pending quest
      expect(questRunStatusCall).toBeDefined();
      expect(questRunStatusCall[0].enabled).toBe(true);
    });

    it('should not poll when cooperative quest is active', () => {
      // Arrange
      const mockQuestStore = {
        cooperativeQuestRun: {
          id: 'quest-123',
          status: 'active',
        },
        pendingQuest: null,
      };

      (useQuestStore as jest.Mock).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector(mockQuestStore);
        }
        return mockQuestStore;
      });

      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      // Act
      renderHook(() => useCooperativeQuest());

      // Find the call to useQuery for quest run status
      const questRunStatusCall = (useQuery as jest.Mock).mock.calls.find(
        call => call[0]?.queryKey?.[0] === 'questRun'
      );

      // Assert - should disable polling for active quest (polling only for 'pending' status)
      expect(questRunStatusCall).toBeDefined();
      expect(questRunStatusCall[0].enabled).toBe(false);
    });
  });
});