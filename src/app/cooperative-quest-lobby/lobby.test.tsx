import React from 'react';
import { fireEvent, render, screen, waitFor } from '@/lib/test-utils';
import { useCooperativeLobbyStore } from '@/store/cooperative-lobby-store';
import { useUserStore } from '@/store/user-store';
import { invitationApi } from '@/api/invitation';

// Mock the router
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: mockReplace,
    back: mockBack,
  },
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({
    lobbyId: 'test-lobby-123',
  }),
}));

// Mock the WebSocket
const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();

jest.mock('@/components/providers/websocket-provider', () => ({
  useWebSocket: () => ({
    emit: mockEmit,
    on: mockOn,
    off: mockOff,
    joinQuestRoom: jest.fn(),
    leaveQuestRoom: jest.fn(),
  }),
}));

// Mock the invitation API
jest.mock('@/api/invitation', () => ({
  invitationApi: {
    respondToInvitation: jest.fn(),
  },
}));

// Import the component
import CooperativeQuestLobby from './[lobbyId]';

describe('CooperativeQuestLobby', () => {
  const mockLobby = {
    lobbyId: 'test-lobby-123',
    questTitle: 'Test Quest',
    questDuration: 30,
    creatorId: 'creator-123',
    participants: [
      {
        id: 'creator-123',
        username: 'Creator',
        invitationStatus: 'accepted',
        isReady: false,
        isCreator: true,
        joinedAt: new Date(),
      },
      {
        id: 'invitee-123',
        username: 'Invitee',
        invitationStatus: 'pending',
        isReady: false,
        isCreator: false,
      },
    ],
    status: 'waiting',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  const mockUser = {
    id: 'creator-123',
    email: 'creator@test.com',
    character: {
      name: 'Creator',
      type: 'knight',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up store mocks
    useCooperativeLobbyStore.setState({
      currentLobby: mockLobby,
      isInLobby: true,
      countdownSeconds: null,
    });

    useUserStore.setState({
      user: mockUser,
    });
  });

  it('should render the lobby with all participants', () => {
    render(<CooperativeQuestLobby />);

    // Check quest info
    expect(screen.getByText('Test Quest')).toBeTruthy();
    expect(screen.getByText('30 minutes')).toBeTruthy();

    // Check participants
    expect(screen.getByText('Creator (You) 👑')).toBeTruthy();
    expect(screen.getByText('Invitee')).toBeTruthy();
    expect(screen.getByText('Waiting for response...')).toBeTruthy();
  });

  it('should join the WebSocket room on mount', () => {
    render(<CooperativeQuestLobby />);

    expect(mockEmit).toHaveBeenCalledWith('lobby:join', {
      lobbyId: 'test-lobby-123',
    });
  });

  it('should show Start Now button for creator when there are accepted participants', () => {
    render(<CooperativeQuestLobby />);

    const startNowButton = screen.getByText(
      'Start Now (Skip waiting for remaining invites)'
    );
    expect(startNowButton).toBeTruthy();
  });

  it('should handle invitation acceptance WebSocket event', async () => {
    render(<CooperativeQuestLobby />);

    // Get the invitation response handler
    const invitationResponseHandler = mockOn.mock.calls.find(
      (call) => call[0] === 'invitation:response'
    )?.[1];

    expect(invitationResponseHandler).toBeDefined();

    // Simulate invitation acceptance
    invitationResponseHandler({
      userId: 'invitee-123',
      action: 'accepted',
      characterName: 'Invitee Character',
      username: 'invitee@test.com',
    });

    // Check that the store was updated
    await waitFor(() => {
      const state = useCooperativeLobbyStore.getState();
      const invitee = state.currentLobby?.participants.find(
        (p) => p.id === 'invitee-123'
      );
      expect(invitee?.invitationStatus).toBe('accepted');
    });
  });

  it('should auto-transition to ready screen when all respond', async () => {
    // Update lobby to have all participants accepted
    const allAcceptedLobby = {
      ...mockLobby,
      participants: mockLobby.participants.map((p) => ({
        ...p,
        invitationStatus: 'accepted',
      })),
    };

    useCooperativeLobbyStore.setState({
      currentLobby: allAcceptedLobby,
    });

    render(<CooperativeQuestLobby />);

    // Should show the "all responded" message
    expect(
      screen.getByText(
        'All players have responded! Preparing to start quest...'
      )
    ).toBeTruthy();

    // Should transition after delay
    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalledWith('/cooperative-quest-ready');
      },
      { timeout: 3000 }
    );
  });

  it('should handle Start Now button click', () => {
    render(<CooperativeQuestLobby />);

    const startNowButton = screen.getByText(
      'Start Now (Skip waiting for remaining invites)'
    );
    fireEvent.press(startNowButton);

    expect(mockReplace).toHaveBeenCalledWith('/cooperative-quest-ready');
  });

  it('should show accept/decline buttons for invitee', () => {
    // Set current user as invitee
    useUserStore.setState({
      user: {
        id: 'invitee-123',
        email: 'invitee@test.com',
        character: {
          name: 'Invitee',
          type: 'druid',
        },
      },
    });

    // Mock the invitationId
    useCooperativeLobbyStore.setState({
      currentLobby: {
        ...mockLobby,
        participants: mockLobby.participants.map((p) =>
          p.id === 'invitee-123' ? { ...p, invitationStatus: 'pending' } : p
        ),
      },
    });

    render(<CooperativeQuestLobby />);

    // Should show accept/decline buttons
    const acceptButton = screen.getByText('Accept');
    const declineButton = screen.getByText('Decline');

    expect(acceptButton).toBeTruthy();
    expect(declineButton).toBeTruthy();
  });

  it('should leave WebSocket room on unmount', () => {
    const { unmount } = render(<CooperativeQuestLobby />);

    unmount();

    expect(mockEmit).toHaveBeenCalledWith('lobby:leave', {
      lobbyId: 'test-lobby-123',
    });
  });
});
