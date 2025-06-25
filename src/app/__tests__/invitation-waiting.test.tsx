import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import InvitationWaitingScreen from '../invitation-waiting';
import { useInvitationPolling } from '@/lib/hooks/use-cooperative-quest';
import { useQuestStore } from '@/store/quest-store';
import { router } from 'expo-router';

jest.mock('@/lib/hooks/use-cooperative-quest');
jest.mock('@/store/quest-store');
jest.mock('expo-router');

const mockUseInvitationPolling = useInvitationPolling as jest.MockedFunction<
  typeof useInvitationPolling
>;
const mockUseQuestStore = useQuestStore as unknown as jest.MockedFunction<
  () => any
>;
const mockRouter = router as jest.Mocked<typeof router>;

// Mock the countdown timer
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: (effect: () => void, deps?: any[]) => {
    const React = jest.requireActual('react');
    // Only run timer effects once in tests
    React.useEffect(() => {
      const cleanup = effect();
      return cleanup;
    }, deps);
  },
}));

describe('InvitationWaitingScreen', () => {
  const mockInvitation = {
    id: 'inv-123',
    questRunId: 'run-456',
    inviter: { id: 'user-1', name: 'John', email: 'john@example.com' },
    invitees: ['user-2', 'user-3'],
    status: 'pending' as const,
    responses: [],
    createdAt: Date.now(),
    expiresAt: Date.now() + 300000, // 5 minutes from now
  };

  const mockPendingQuest = {
    id: 'quest-1',
    title: 'Morning Meditation',
    durationMinutes: 30,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render invitation waiting screen', () => {
    mockUseQuestStore.mockReturnValue({
      currentInvitation: mockInvitation,
      pendingQuest: mockPendingQuest,
    });

    mockUseInvitationPolling.mockReturnValue({
      invitationStatus: {
        invitation: mockInvitation,
        questRun: null,
      },
      isPolling: true,
      error: null,
    });

    render(<InvitationWaitingScreen />);

    expect(screen.getByText('Waiting for Friends')).toBeTruthy();
    expect(screen.getByText('Morning Meditation')).toBeTruthy();
    expect(screen.getByText('30 minutes')).toBeTruthy();
  });

  it('should show accepted friends', () => {
    const invitationWithResponses = {
      ...mockInvitation,
      status: 'partial' as const,
      responses: [
        {
          userId: 'user-2',
          action: 'accepted' as const,
          respondedAt: Date.now(),
        },
      ],
    };

    mockUseQuestStore.mockReturnValue({
      currentInvitation: invitationWithResponses,
      pendingQuest: mockPendingQuest,
    });

    mockUseInvitationPolling.mockReturnValue({
      invitationStatus: {
        invitation: invitationWithResponses,
        questRun: null,
      },
      isPolling: true,
      error: null,
    });

    render(<InvitationWaitingScreen />);

    expect(screen.getByText('✓ Accepted')).toBeTruthy();
    expect(screen.getByText('Waiting...')).toBeTruthy();
  });

  it('should show declined friends', () => {
    const invitationWithDecline = {
      ...mockInvitation,
      status: 'partial' as const,
      responses: [
        {
          userId: 'user-2',
          action: 'declined' as const,
          respondedAt: Date.now(),
        },
      ],
    };

    mockUseQuestStore.mockReturnValue({
      currentInvitation: invitationWithDecline,
      pendingQuest: mockPendingQuest,
    });

    mockUseInvitationPolling.mockReturnValue({
      invitationStatus: {
        invitation: invitationWithDecline,
        questRun: null,
      },
      isPolling: true,
      error: null,
    });

    render(<InvitationWaitingScreen />);

    expect(screen.getByText('✗ Declined')).toBeTruthy();
  });

  it('should show countdown timer', () => {
    mockUseQuestStore.mockReturnValue({
      currentInvitation: mockInvitation,
      pendingQuest: mockPendingQuest,
    });

    mockUseInvitationPolling.mockReturnValue({
      invitationStatus: {
        invitation: mockInvitation,
        questRun: null,
      },
      isPolling: true,
      error: null,
    });

    render(<InvitationWaitingScreen />);

    expect(screen.getByText(/Expires in:/)).toBeTruthy();
    expect(screen.getByText(/5:00/)).toBeTruthy();
  });

  it('should navigate to pending quest when all accepted', () => {
    const completeInvitation = {
      ...mockInvitation,
      status: 'complete' as const,
      responses: [
        {
          userId: 'user-2',
          action: 'accepted' as const,
          respondedAt: Date.now(),
        },
        {
          userId: 'user-3',
          action: 'accepted' as const,
          respondedAt: Date.now(),
        },
      ],
    };

    mockUseQuestStore.mockReturnValue({
      currentInvitation: completeInvitation,
      pendingQuest: mockPendingQuest,
    });

    mockUseInvitationPolling.mockReturnValue({
      invitationStatus: {
        invitation: completeInvitation,
        questRun: { id: 'run-456' },
      },
      isPolling: false,
      error: null,
    });

    render(<InvitationWaitingScreen />);

    // Should navigate immediately
    expect(mockRouter.replace).toHaveBeenCalledWith('/pending-quest');
  });

  it('should handle start anyway button press', () => {
    const partialInvitation = {
      ...mockInvitation,
      status: 'partial' as const,
      responses: [
        {
          userId: 'user-2',
          action: 'accepted' as const,
          respondedAt: Date.now(),
        },
      ],
    };

    mockUseQuestStore.mockReturnValue({
      currentInvitation: partialInvitation,
      pendingQuest: mockPendingQuest,
    });

    mockUseInvitationPolling.mockReturnValue({
      invitationStatus: {
        invitation: partialInvitation,
        questRun: { id: 'run-456' },
      },
      isPolling: true,
      error: null,
    });

    render(<InvitationWaitingScreen />);

    const startButton = screen.getByText('Start Anyway');
    expect(startButton).toBeTruthy();

    // Should navigate when quest run exists
    expect(mockRouter.replace).toHaveBeenCalledWith('/pending-quest');
  });

  it('should handle cancel button press', () => {
    const mockCancelQuest = jest.fn();

    mockUseQuestStore.mockReturnValue({
      currentInvitation: mockInvitation,
      pendingQuest: mockPendingQuest,
      cancelQuest: mockCancelQuest,
    });

    mockUseInvitationPolling.mockReturnValue({
      invitationStatus: {
        invitation: mockInvitation,
        questRun: null,
      },
      isPolling: true,
      error: null,
    });

    const { getByText } = render(<InvitationWaitingScreen />);

    const cancelButton = getByText('Cancel Invitation');
    act(() => {
      cancelButton.props.onPress();
    });

    expect(mockCancelQuest).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/(app)');
  });

  it('should handle no invitation state', () => {
    mockUseQuestStore.mockReturnValue({
      currentInvitation: null,
      pendingQuest: mockPendingQuest,
    });

    mockUseInvitationPolling.mockReturnValue({
      invitationStatus: null,
      isPolling: false,
      error: null,
    });

    render(<InvitationWaitingScreen />);

    expect(screen.getByText('No active invitation')).toBeTruthy();
  });

  it('should handle polling error', () => {
    mockUseQuestStore.mockReturnValue({
      currentInvitation: mockInvitation,
      pendingQuest: mockPendingQuest,
    });

    mockUseInvitationPolling.mockReturnValue({
      invitationStatus: null,
      isPolling: false,
      error: new Error('Network error'),
    });

    render(<InvitationWaitingScreen />);

    expect(screen.getByText(/Error loading invitation/)).toBeTruthy();
  });
});