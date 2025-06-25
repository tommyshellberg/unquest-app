import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useCooperativeQuest,
  useInvitationPolling,
  useParticipantReady,
} from '../use-cooperative-quest';
import { useQuestStore } from '@/store/quest-store';
import {
  getInvitationStatus,
  getQuestRunStatus,
  updateQuestRunStatus,
} from '@/lib/services/quest-run-service';
import { scheduleAllParticipantsReadyNotification } from '@/lib/services/notifications';
import { router } from 'expo-router';

jest.mock('@/store/quest-store');
jest.mock('@/lib/services/quest-run-service');
jest.mock('@/lib/services/notifications');
jest.mock('expo-router');

const mockUseQuestStore = useQuestStore as unknown as jest.MockedFunction<
  () => any
>;
const mockGetInvitationStatus = getInvitationStatus as jest.MockedFunction<
  typeof getInvitationStatus
>;
const mockGetQuestRunStatus = getQuestRunStatus as jest.MockedFunction<
  typeof getQuestRunStatus
>;
const mockUpdateQuestRunStatus = updateQuestRunStatus as jest.MockedFunction<
  typeof updateQuestRunStatus
>;
const mockScheduleNotification =
  scheduleAllParticipantsReadyNotification as jest.MockedFunction<
    typeof scheduleAllParticipantsReadyNotification
  >;
const mockRouter = router as jest.Mocked<typeof router>;

describe('useCooperativeQuest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false when no invitation or quest run', () => {
    mockUseQuestStore.mockReturnValue({
      currentInvitation: null,
      cooperativeQuestRun: null,
    });

    const { result } = renderHook(() => useCooperativeQuest());

    expect(result.current.isCooperativeQuest).toBe(false);
    expect(result.current.currentInvitation).toBeNull();
    expect(result.current.cooperativeQuestRun).toBeNull();
  });

  it('should return true when invitation exists', () => {
    const mockInvitation = { id: 'inv-123' };
    mockUseQuestStore.mockReturnValue({
      currentInvitation: mockInvitation,
      cooperativeQuestRun: null,
    });

    const { result } = renderHook(() => useCooperativeQuest());

    expect(result.current.isCooperativeQuest).toBe(true);
    expect(result.current.currentInvitation).toBe(mockInvitation);
  });

  it('should return true when cooperative quest run exists', () => {
    const mockQuestRun = { id: 'run-456', participants: [] };
    mockUseQuestStore.mockReturnValue({
      currentInvitation: null,
      cooperativeQuestRun: mockQuestRun,
    });

    const { result } = renderHook(() => useCooperativeQuest());

    expect(result.current.isCooperativeQuest).toBe(true);
    expect(result.current.cooperativeQuestRun).toBe(mockQuestRun);
  });
});

describe('useInvitationPolling', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should poll invitation status', async () => {
    const mockInvitation = { id: 'inv-123' };
    const mockQuestRun = { id: 'run-456' };
    const mockSetInvitation = jest.fn();
    const mockSetQuestRun = jest.fn();
    const mockPrepareQuest = jest.fn();

    mockUseQuestStore.mockReturnValue({
      currentInvitation: mockInvitation,
      setCurrentInvitation: mockSetInvitation,
      setCooperativeQuestRun: mockSetQuestRun,
      prepareQuest: mockPrepareQuest,
    });

    mockGetInvitationStatus.mockResolvedValue({
      invitation: {
        ...mockInvitation,
        status: 'complete',
        responses: [{ userId: 'user-2', action: 'accepted' }],
      },
      questRun: mockQuestRun,
    });

    const { result, waitFor } = renderHook(
      () => useInvitationPolling('inv-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.invitationStatus).toBeDefined();
    });

    expect(mockGetInvitationStatus).toHaveBeenCalledWith('inv-123');
    expect(mockSetInvitation).toHaveBeenCalledWith({
      ...mockInvitation,
      status: 'complete',
      responses: [{ userId: 'user-2', action: 'accepted' }],
    });
    expect(mockSetQuestRun).toHaveBeenCalledWith(mockQuestRun);
  });

  it('should navigate to home when invitation expires', async () => {
    mockUseQuestStore.mockReturnValue({
      currentInvitation: { id: 'inv-123' },
      setCurrentInvitation: jest.fn(),
      setCooperativeQuestRun: jest.fn(),
    });

    mockGetInvitationStatus.mockResolvedValue({
      invitation: {
        id: 'inv-123',
        status: 'expired',
      },
      questRun: null,
    });

    const { waitFor } = renderHook(() => useInvitationPolling('inv-123'), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/(app)');
    });
  });
});

describe('useParticipantReady', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should return participant ready states', async () => {
    const mockQuestRun = {
      id: 'run-456',
      participants: [
        { userId: 'user-1', ready: true, status: 'ready' },
        { userId: 'user-2', ready: false, status: 'pending' },
      ],
    };

    mockGetQuestRunStatus.mockResolvedValue(mockQuestRun);

    const { result, waitFor } = renderHook(
      () => useParticipantReady('run-456'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.participants).toHaveLength(2);
    });

    expect(result.current.participants).toEqual(mockQuestRun.participants);
    expect(result.current.isUserReady).toBe(false); // No current user ID set
    expect(result.current.allParticipantsReady).toBe(false);
  });

  it('should update ready state', async () => {
    const mockQuestRun = {
      id: 'run-456',
      participants: [{ userId: 'user-1', ready: false, status: 'pending' }],
    };

    mockGetQuestRunStatus.mockResolvedValue(mockQuestRun);
    mockUpdateQuestRunStatus.mockResolvedValue({
      ...mockQuestRun,
      participants: [{ userId: 'user-1', ready: true, status: 'ready' }],
    });

    const { result, waitFor } = renderHook(
      () => useParticipantReady('run-456'),
      { wrapper }
    );

    await act(async () => {
      await result.current.setReady(true);
    });

    expect(mockUpdateQuestRunStatus).toHaveBeenCalledWith(
      'run-456',
      'pending',
      null,
      true
    );
  });

  it('should detect when all participants are ready', async () => {
    const mockQuestRun = {
      id: 'run-456',
      participants: [
        { userId: 'user-1', ready: true, status: 'ready' },
        { userId: 'user-2', ready: true, status: 'ready' },
      ],
      questTemplate: { title: 'Test Quest' },
    };

    const mockUpdateParticipantReady = jest.fn();
    const mockStartQuest = jest.fn();

    mockUseQuestStore.mockReturnValue({
      updateParticipantReady: mockUpdateParticipantReady,
      startQuest: mockStartQuest,
    });

    mockGetQuestRunStatus.mockResolvedValue(mockQuestRun);

    const { waitFor } = renderHook(() => useParticipantReady('run-456'), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockScheduleNotification).toHaveBeenCalledWith('Test Quest');
    });

    // Should update all participants
    expect(mockUpdateParticipantReady).toHaveBeenCalledWith('user-1', true);
    expect(mockUpdateParticipantReady).toHaveBeenCalledWith('user-2', true);
  });

  it('should handle polling errors gracefully', async () => {
    mockGetQuestRunStatus.mockRejectedValue(new Error('Network error'));

    const { result, waitFor } = renderHook(
      () => useParticipantReady('run-456'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isPolling).toBe(false);
    });

    expect(result.current.participants).toEqual([]);
    expect(result.current.error).toBeDefined();
  });
});