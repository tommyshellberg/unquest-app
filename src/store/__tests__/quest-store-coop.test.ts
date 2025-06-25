import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-hooks';

import { useQuestStore } from '../quest-store';
import QuestTimer from '@/lib/services/quest-timer';
import { type QuestInvitation, type CooperativeQuestRun } from '../types';

jest.mock('@/lib/services/quest-timer');

describe('Quest Store - Cooperative Quest Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useQuestStore.setState({
      currentInvitation: null,
      cooperativeQuestRun: null,
      activeQuest: null,
      pendingQuest: null,
      completedQuests: [],
      failedQuests: [],
    });
  });

  describe('setCurrentInvitation', () => {
    it('should set current invitation', () => {
      const { result } = renderHook(() => useQuestStore());
      const mockInvitation: QuestInvitation = {
        id: 'inv-123',
        questRunId: 'run-456',
        inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
        invitees: ['user-2', 'user-3'],
        status: 'pending',
        responses: [],
        createdAt: Date.now(),
        expiresAt: Date.now() + 300000,
      };

      act(() => {
        result.current.setCurrentInvitation(mockInvitation);
      });

      expect(result.current.currentInvitation).toEqual(mockInvitation);
    });

    it('should clear current invitation when null', () => {
      const { result } = renderHook(() => useQuestStore());

      // Set an invitation first
      act(() => {
        result.current.setCurrentInvitation({
          id: 'inv-123',
        } as QuestInvitation);
      });

      // Clear it
      act(() => {
        result.current.setCurrentInvitation(null);
      });

      expect(result.current.currentInvitation).toBeNull();
    });
  });

  describe('setCooperativeQuestRun', () => {
    it('should set cooperative quest run', () => {
      const { result } = renderHook(() => useQuestStore());
      const mockQuestRun: CooperativeQuestRun = {
        id: 'run-456',
        questId: 'quest-1',
        userId: 'user-1',
        status: 'pending',
        participants: [
          {
            userId: 'user-1',
            ready: false,
            status: 'pending',
          },
          {
            userId: 'user-2',
            ready: false,
            status: 'pending',
          },
        ],
        questTemplate: {
          id: 'quest-1',
          mode: 'custom',
          title: 'Team Quest',
          durationMinutes: 30,
          reward: { xp: 90 },
        },
      };

      act(() => {
        result.current.setCooperativeQuestRun(mockQuestRun);
      });

      expect(result.current.cooperativeQuestRun).toEqual(mockQuestRun);
    });
  });

  describe('updateParticipantReady', () => {
    it('should update participant ready state', () => {
      const { result } = renderHook(() => useQuestStore());
      const mockQuestRun: CooperativeQuestRun = {
        id: 'run-456',
        questId: 'quest-1',
        userId: 'user-1',
        status: 'pending',
        participants: [
          {
            userId: 'user-1',
            ready: false,
            status: 'pending',
          },
          {
            userId: 'user-2',
            ready: false,
            status: 'pending',
          },
        ],
      };

      act(() => {
        result.current.setCooperativeQuestRun(mockQuestRun);
        result.current.updateParticipantReady('user-1', true);
      });

      expect(result.current.cooperativeQuestRun?.participants[0].ready).toBe(
        true
      );
      expect(result.current.cooperativeQuestRun?.participants[1].ready).toBe(
        false
      );
    });

    it('should update correct participant by userId', () => {
      const { result } = renderHook(() => useQuestStore());
      const mockQuestRun: CooperativeQuestRun = {
        id: 'run-456',
        questId: 'quest-1',
        userId: 'user-1',
        status: 'pending',
        participants: [
          {
            userId: 'user-1',
            ready: false,
            status: 'pending',
          },
          {
            userId: 'user-2',
            ready: false,
            status: 'pending',
          },
          {
            userId: 'user-3',
            ready: true,
            status: 'ready',
          },
        ],
      };

      act(() => {
        result.current.setCooperativeQuestRun(mockQuestRun);
        result.current.updateParticipantReady('user-2', true);
      });

      expect(result.current.cooperativeQuestRun?.participants[0].ready).toBe(
        false
      );
      expect(result.current.cooperativeQuestRun?.participants[1].ready).toBe(
        true
      );
      expect(result.current.cooperativeQuestRun?.participants[2].ready).toBe(
        true
      );
    });

    it('should handle missing cooperative quest run', () => {
      const { result } = renderHook(() => useQuestStore());

      act(() => {
        result.current.updateParticipantReady('user-1', true);
      });

      // Should not crash
      expect(result.current.cooperativeQuestRun).toBeNull();
    });
  });

  describe('cooperative quest state clearing', () => {
    const setupCooperativeState = () => {
      const mockInvitation: QuestInvitation = {
        id: 'inv-123',
        questRunId: 'run-456',
        inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
        invitees: ['user-2'],
        status: 'pending',
        responses: [],
        createdAt: Date.now(),
        expiresAt: Date.now() + 300000,
      };

      const mockQuestRun: CooperativeQuestRun = {
        id: 'run-456',
        questId: 'quest-1',
        userId: 'user-1',
        status: 'active',
        participants: [],
      };

      useQuestStore.setState({
        currentInvitation: mockInvitation,
        cooperativeQuestRun: mockQuestRun,
      });
    };

    it('should clear cooperative state on quest completion', () => {
      const { result } = renderHook(() => useQuestStore());
      setupCooperativeState();

      // Set active quest
      act(() => {
        useQuestStore.setState({
          activeQuest: {
            id: 'quest-1',
            mode: 'custom',
            title: 'Test Quest',
            durationMinutes: 30,
            reward: { xp: 90 },
            startTime: Date.now() - 31 * 60 * 1000, // 31 minutes ago
            status: 'active',
          },
        });
      });

      // Complete quest
      act(() => {
        result.current.completeQuest();
      });

      expect(result.current.currentInvitation).toBeNull();
      expect(result.current.cooperativeQuestRun).toBeNull();
    });

    it('should clear cooperative state on quest failure', () => {
      const { result } = renderHook(() => useQuestStore());
      setupCooperativeState();

      // Set active quest
      act(() => {
        useQuestStore.setState({
          activeQuest: {
            id: 'quest-1',
            mode: 'custom',
            title: 'Test Quest',
            durationMinutes: 30,
            reward: { xp: 90 },
            startTime: Date.now(),
            status: 'active',
          },
        });
      });

      // Fail quest
      act(() => {
        result.current.failQuest();
      });

      expect(result.current.currentInvitation).toBeNull();
      expect(result.current.cooperativeQuestRun).toBeNull();
      expect(QuestTimer.stopQuest).toHaveBeenCalled();
    });

    it('should clear cooperative state on quest cancellation', () => {
      const { result } = renderHook(() => useQuestStore());
      setupCooperativeState();

      // Set pending quest
      act(() => {
        useQuestStore.setState({
          pendingQuest: {
            id: 'quest-1',
            mode: 'custom',
            title: 'Test Quest',
            durationMinutes: 30,
            reward: { xp: 90 },
          },
        });
      });

      // Cancel quest
      act(() => {
        result.current.cancelQuest();
      });

      expect(result.current.currentInvitation).toBeNull();
      expect(result.current.cooperativeQuestRun).toBeNull();
      expect(QuestTimer.stopQuest).toHaveBeenCalled();
    });
  });

  describe('prepareQuest with invitees', () => {
    it('should prepare cooperative quest with invitees', () => {
      const { result } = renderHook(() => useQuestStore());
      const mockQuest = {
        id: 'quest-1',
        mode: 'custom' as const,
        title: 'Team Quest',
        durationMinutes: 30,
        reward: { xp: 90 },
        inviteeIds: ['user-2', 'user-3'],
      };

      act(() => {
        result.current.prepareQuest(mockQuest);
      });

      expect(result.current.pendingQuest).toEqual(mockQuest);
    });
  });
});