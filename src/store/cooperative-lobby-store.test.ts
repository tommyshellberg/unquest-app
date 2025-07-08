import { act, renderHook } from '@testing-library/react-native';
import { useCooperativeLobbyStore } from './cooperative-lobby-store';

describe('CooperativeLobbyStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCooperativeLobbyStore.setState({
      currentLobby: null,
      isInLobby: false,
      countdownSeconds: null,
    });
  });

  describe('createLobby', () => {
    it('should create a new lobby and set isInLobby to true', () => {
      const { result } = renderHook(() => useCooperativeLobbyStore());

      const mockLobby = {
        lobbyId: 'test-lobby-123',
        questTitle: 'Test Quest',
        questDuration: 30,
        creatorId: 'user-123',
        participants: [
          {
            id: 'user-123',
            username: 'creator',
            invitationStatus: 'accepted' as const,
            isReady: false,
            isCreator: true,
            joinedAt: new Date(),
          },
        ],
        status: 'waiting' as const,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      };

      act(() => {
        result.current.createLobby(mockLobby);
      });

      expect(result.current.currentLobby).toEqual(mockLobby);
      expect(result.current.isInLobby).toBe(true);
      expect(result.current.countdownSeconds).toBe(null);
    });
  });

  describe('joinLobby', () => {
    it('should join an existing lobby', () => {
      const { result } = renderHook(() => useCooperativeLobbyStore());

      const mockLobby = {
        lobbyId: 'existing-lobby',
        questTitle: 'Join Test',
        questDuration: 20,
        creatorId: 'other-user',
        participants: [],
        status: 'waiting' as const,
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      act(() => {
        result.current.joinLobby(mockLobby);
      });

      expect(result.current.currentLobby).toEqual(mockLobby);
      expect(result.current.isInLobby).toBe(true);
    });
  });

  describe('leaveLobby', () => {
    it('should clear lobby state when leaving', () => {
      const { result } = renderHook(() => useCooperativeLobbyStore());

      // First create a lobby
      act(() => {
        result.current.createLobby({
          lobbyId: 'test-lobby',
          questTitle: 'Test',
          questDuration: 30,
          creatorId: 'user-123',
          participants: [],
          status: 'waiting' as const,
          createdAt: new Date(),
          expiresAt: new Date(),
        });
      });

      // Then leave it
      act(() => {
        result.current.leaveLobby();
      });

      expect(result.current.currentLobby).toBe(null);
      expect(result.current.isInLobby).toBe(false);
      expect(result.current.countdownSeconds).toBe(null);
    });
  });

  describe('markUserReady', () => {
    it('should mark a user as ready and update lobby status when all ready', () => {
      const { result } = renderHook(() => useCooperativeLobbyStore());

      const mockLobby = {
        lobbyId: 'test-lobby',
        questTitle: 'Test',
        questDuration: 30,
        creatorId: 'user-123',
        participants: [
          {
            id: 'user-123',
            username: 'user1',
            invitationStatus: 'accepted' as const,
            isReady: false,
            isCreator: true,
          },
          {
            id: 'user-456',
            username: 'user2',
            invitationStatus: 'accepted' as const,
            isReady: false,
            isCreator: false,
          },
        ],
        status: 'waiting' as const,
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      act(() => {
        result.current.createLobby(mockLobby);
      });

      // Mark first user as ready
      act(() => {
        result.current.markUserReady('user-123', true);
      });

      expect(result.current.currentLobby?.participants[0].isReady).toBe(true);
      expect(result.current.currentLobby?.status).toBe('waiting');

      // Mark second user as ready
      act(() => {
        result.current.markUserReady('user-456', true);
      });

      expect(result.current.currentLobby?.participants[1].isReady).toBe(true);
      expect(result.current.currentLobby?.status).toBe('ready');
    });

    it('should handle marking user as not ready', () => {
      const { result } = renderHook(() => useCooperativeLobbyStore());

      const mockLobby = {
        lobbyId: 'test-lobby',
        questTitle: 'Test',
        questDuration: 30,
        creatorId: 'user-123',
        participants: [
          {
            id: 'user-123',
            username: 'user1',
            invitationStatus: 'accepted' as const,
            isReady: true,
            isCreator: true,
            readyAt: new Date(),
          },
        ],
        status: 'ready' as const,
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      act(() => {
        result.current.createLobby(mockLobby);
      });

      act(() => {
        result.current.markUserReady('user-123', false);
      });

      expect(result.current.currentLobby?.participants[0].isReady).toBe(false);
      expect(
        result.current.currentLobby?.participants[0].readyAt
      ).toBeUndefined();
    });
  });

  describe('updateInvitationResponse', () => {
    it('should update invitation response and check if all responded', () => {
      const { result } = renderHook(() => useCooperativeLobbyStore());

      const mockLobby = {
        lobbyId: 'test-lobby',
        questTitle: 'Test',
        questDuration: 30,
        creatorId: 'user-123',
        participants: [
          {
            id: 'user-123',
            username: 'creator',
            invitationStatus: 'accepted' as const,
            isReady: false,
            isCreator: true,
          },
          {
            id: 'user-456',
            username: 'invitee1',
            invitationStatus: 'pending' as const,
            isReady: false,
            isCreator: false,
          },
          {
            id: 'user-789',
            username: 'invitee2',
            invitationStatus: 'pending' as const,
            isReady: false,
            isCreator: false,
          },
        ],
        status: 'waiting' as const,
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      act(() => {
        result.current.createLobby(mockLobby);
      });

      // Accept first invitation
      act(() => {
        result.current.updateInvitationResponse('user-456', 'accepted');
      });

      expect(
        result.current.currentLobby?.participants[1].invitationStatus
      ).toBe('accepted');
      expect(
        result.current.currentLobby?.participants[1].joinedAt
      ).toBeDefined();

      // Decline second invitation
      act(() => {
        result.current.updateInvitationResponse('user-789', 'declined');
      });

      expect(
        result.current.currentLobby?.participants[2].invitationStatus
      ).toBe('declined');
      expect(
        result.current.currentLobby?.participants[2].joinedAt
      ).toBeUndefined();
      // All responded, so status should remain 'waiting'
      expect(result.current.currentLobby?.status).toBe('waiting');
    });
  });

  describe('setCountdown', () => {
    it('should set countdown seconds', () => {
      const { result } = renderHook(() => useCooperativeLobbyStore());

      act(() => {
        result.current.setCountdown(5);
      });

      expect(result.current.countdownSeconds).toBe(5);

      act(() => {
        result.current.setCountdown(null);
      });

      expect(result.current.countdownSeconds).toBe(null);
    });
  });

  describe('updateLobbyStatus', () => {
    it('should update lobby status', () => {
      const { result } = renderHook(() => useCooperativeLobbyStore());

      const mockLobby = {
        lobbyId: 'test-lobby',
        questTitle: 'Test',
        questDuration: 30,
        creatorId: 'user-123',
        participants: [],
        status: 'waiting' as const,
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      act(() => {
        result.current.createLobby(mockLobby);
      });

      act(() => {
        result.current.updateLobbyStatus('starting');
      });

      expect(result.current.currentLobby?.status).toBe('starting');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useCooperativeLobbyStore());

      // Set some state
      act(() => {
        result.current.createLobby({
          lobbyId: 'test-lobby',
          questTitle: 'Test',
          questDuration: 30,
          creatorId: 'user-123',
          participants: [],
          status: 'waiting' as const,
          createdAt: new Date(),
          expiresAt: new Date(),
        });
        result.current.setCountdown(5);
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.currentLobby).toBe(null);
      expect(result.current.isInLobby).toBe(false);
      expect(result.current.countdownSeconds).toBe(null);
    });
  });
});
