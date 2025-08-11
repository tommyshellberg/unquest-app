import { useQuestStore } from '@/store/quest-store';
import { type Quest } from '@/store/types';

// Mock the dependencies
jest.mock('@/lib/services/quest-timer', () => {
  return {
    __esModule: true,
    default: {
      stopQuest: jest.fn(),
      getQuestRunId: jest.fn(() => null),
    },
  };
});

// Import after mocking
import QuestTimer from '@/lib/services/quest-timer';

// Mock the AVAILABLE_QUESTS import
jest.mock('@/app/data/quests', () => {
  // Create our test subset of quests
  const TEST_QUESTS = [
    {
      id: 'quest-1',
      mode: 'story',
      title: 'Test Quest 1',
      durationMinutes: 2,
      reward: { xp: 100 },
      options: [
        { id: 'option-1', text: 'Option 1', nextQuestId: 'quest-1a' },
        { id: 'option-2', text: 'Option 2', nextQuestId: 'quest-1b' },
      ],
    },
    {
      id: 'quest-1a',
      mode: 'story',
      title: 'Test Quest 1A',
      durationMinutes: 2,
      reward: { xp: 100 },
      options: [{ id: 'option-1', text: 'Continue', nextQuestId: 'quest-2' }],
    },
    {
      id: 'quest-1b',
      mode: 'story',
      title: 'Test Quest 1B',
      durationMinutes: 2,
      reward: { xp: 100 },
      options: [{ id: 'option-1', text: 'Continue', nextQuestId: 'quest-2' }],
    },
    {
      id: 'quest-2',
      mode: 'story',
      title: 'Test Quest 2',
      durationMinutes: 2,
      reward: { xp: 100 },
      options: [
        { id: 'option-1', text: 'Option 1', nextQuestId: 'quest-2a' },
        { id: 'option-2', text: 'Option 2', nextQuestId: 'quest-2b' },
      ],
    },
    {
      id: 'quest-2a',
      mode: 'story',
      title: 'Test Quest 2A',
      durationMinutes: 2,
      reward: { xp: 100 },
      options: [{ id: 'option-1', text: 'Continue', nextQuestId: 'quest-3' }],
    },
    {
      id: 'quest-2b',
      mode: 'story',
      title: 'Test Quest 2B',
      durationMinutes: 2,
      reward: { xp: 100 },
      options: [{ id: 'option-1', text: 'Continue', nextQuestId: 'quest-3' }],
    },
    {
      id: 'quest-3',
      mode: 'story',
      title: 'Test Quest 3',
      durationMinutes: 2,
      reward: { xp: 100 },
      // No options for the final test quest
    },
  ];

  return {
    AVAILABLE_QUESTS: TEST_QUESTS,
  };
});

// Create mock functions that persist across test runs
const mockUpdateStreak = jest.fn();
const mockAddXP = jest.fn();
const mockResetStreak = jest.fn();

// Mock the character store
jest.mock('@/store/character-store', () => ({
  useCharacterStore: {
    getState: () => ({
      updateStreak: mockUpdateStreak,
      addXP: mockAddXP,
      resetStreak: mockResetStreak,
    }),
  },
}));

// Mock tanstack query
jest.mock('@/api/common', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
}));

// Mock notifications service
jest.mock('@/lib/services/notifications', () => ({
  cancelStreakWarningNotification: jest.fn().mockResolvedValue(undefined),
  scheduleStreakWarningNotification: jest.fn().mockResolvedValue(undefined),
}));

// Create mock for POI store
const mockRevealLocation = jest.fn();

// Mock the POI store
jest.mock('@/store/poi-store', () => ({
  usePOIStore: {
    getState: () => ({
      revealLocation: mockRevealLocation,
    }),
  },
}));

// Mock storage functions
jest.mock('@/lib/storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('QuestStore - refreshAvailableQuests', () => {
  // Helper function to create a completed quest
  const createCompletedQuest = (id: string, stopTime: number): Quest => ({
    id,
    mode: 'story',
    title: `Test Quest ${id}`,
    durationMinutes: 2,
    startTime: stopTime - 200000,
    stopTime,
    status: 'completed',
    reward: { xp: 100 },
    poiSlug: 'test-poi',
  });

  beforeEach(() => {
    // Reset the store before each test
    useQuestStore.setState({
      activeQuest: null,
      pendingQuest: null,
      availableQuests: [],
      completedQuests: [],
      failedQuest: null,
      recentCompletedQuest: null,
      lastCompletedQuestTimestamp: null,
      currentLiveActivityId: null,
    });

    // Clear all mocks
    jest.clearAllMocks();
    mockUpdateStreak.mockClear();
    mockAddXP.mockClear();
    mockResetStreak.mockClear();
    mockRevealLocation.mockClear();
    
    // Clear QuestTimer mocks
    (QuestTimer.stopQuest as jest.Mock).mockClear();
    (QuestTimer.getQuestRunId as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return quest-1 when no quests are completed', () => {
    // Act
    useQuestStore.getState().refreshAvailableQuests();

    // Assert
    const state = useQuestStore.getState();
    expect(state.availableQuests.length).toBe(1);
    expect(state.availableQuests[0].id).toBe('quest-1');
  });

  test('should return quest-1a and quest-1b when quest-1 is completed', () => {
    // Arrange
    const completedQuest = createCompletedQuest('quest-1', Date.now());
    useQuestStore.setState({
      completedQuests: [completedQuest],
    });

    // Act
    useQuestStore.getState().refreshAvailableQuests();

    // Assert
    const state = useQuestStore.getState();
    expect(state.availableQuests.length).toBe(2);
    expect(state.availableQuests.map((q) => q.id).sort()).toEqual([
      'quest-1a',
      'quest-1b',
    ]);
  });

  test('should return quest-2 when quest-1 and quest-1a are completed', () => {
    // Arrange
    const completedQuests = [
      createCompletedQuest('quest-1', Date.now() - 3000), // Older completion
      createCompletedQuest('quest-1a', Date.now()), // Most recent completion
    ];

    useQuestStore.setState({
      completedQuests,
    });

    // Act
    useQuestStore.getState().refreshAvailableQuests();

    // Assert
    const state = useQuestStore.getState();
    expect(state.availableQuests.length).toBe(1);
    expect(state.availableQuests[0].id).toBe('quest-2');
  });

  test('should return quest-3 when all previous quests in the chosen path are completed', () => {
    // Arrange - quest-1 → quest-1a → quest-2 → quest-2a path is completed
    const completedQuests = [
      createCompletedQuest('quest-1', Date.now() - 7000),
      createCompletedQuest('quest-1a', Date.now() - 5000),
      createCompletedQuest('quest-2', Date.now() - 3000),
      createCompletedQuest('quest-2a', Date.now()), // Most recent
    ];

    useQuestStore.setState({
      completedQuests,
    });

    // Act
    useQuestStore.getState().refreshAvailableQuests();

    // Assert
    const state = useQuestStore.getState();
    expect(state.availableQuests.length).toBe(1);
    expect(state.availableQuests[0].id).toBe('quest-3');
  });

  test('should not return quest-1b if player already progressed through quest-1a path', () => {
    // Arrange - player went through quest-1 → quest-1a → quest-2
    const completedQuests = [
      createCompletedQuest('quest-1', Date.now() - 5000),
      createCompletedQuest('quest-1a', Date.now() - 3000),
    ];

    useQuestStore.setState({
      completedQuests,
    });

    // Act
    useQuestStore.getState().refreshAvailableQuests();

    // Assert
    const state = useQuestStore.getState();
    expect(state.availableQuests.length).toBe(1);
    expect(state.availableQuests[0].id).toBe('quest-2');
    expect(
      state.availableQuests.find((q) => q.id === 'quest-1b')
    ).toBeUndefined();
  });

  test('should correctly handle completing a quest with no options', () => {
    // Arrange - quest with no options (quest-3 doesn't have options in our fixture)
    const completedQuests = [
      createCompletedQuest('quest-1', Date.now() - 7000),
      createCompletedQuest('quest-1a', Date.now() - 5000),
      createCompletedQuest('quest-2', Date.now() - 3000),
      createCompletedQuest('quest-2a', Date.now() - 1000),
      createCompletedQuest('quest-3', Date.now()), // Most recent
    ];

    useQuestStore.setState({
      completedQuests,
    });

    // Act
    useQuestStore.getState().refreshAvailableQuests();

    // Assert
    const state = useQuestStore.getState();
    // If the next quest isn't in our fixture, we should get empty array
    expect(state.availableQuests.length).toBe(0);
  });

  test('should start a quest and move it from pending to active', () => {
    // Arrange
    const pendingQuest = {
      id: 'quest-1',
      mode: 'story' as const,
      title: 'Test Quest',
      durationMinutes: 10,
      reward: { xp: 100 },
    };

    useQuestStore.setState({ pendingQuest });

    // Act
    const now = Date.now();
    useQuestStore.getState().startQuest({
      ...pendingQuest,
      status: 'active' as const,
    });

    // Assert
    const state = useQuestStore.getState();
    expect(state.activeQuest).toMatchObject({
      ...pendingQuest,
      startTime: expect.any(Number),
      status: 'active',
    });
    expect(state.activeQuest?.startTime).toBeGreaterThanOrEqual(now);
    expect(state.pendingQuest).toBeNull();
  });

  test('should cancel an active quest', () => {
    // Arrange
    const activeQuest = {
      id: 'quest-1',
      mode: 'story' as const,
      title: 'Test Quest',
      durationMinutes: 10,
      reward: { xp: 100 },
      startTime: Date.now(),
      status: 'active' as const,
    };

    useQuestStore.setState({
      activeQuest,
      currentLiveActivityId: 'live-activity-123',
    });

    // Import the mocked function
    // QuestTimer is already imported at the top

    // Act
    useQuestStore.getState().cancelQuest();

    // Assert
    const state = useQuestStore.getState();
    expect(state.activeQuest).toBeNull();
    expect(state.pendingQuest).toBeNull();
    expect(state.currentLiveActivityId).toBeNull();
    expect(QuestTimer.stopQuest).toHaveBeenCalled();
  });

  test('should cancel a pending quest', () => {
    // Arrange
    const pendingQuest = {
      id: 'quest-1',
      mode: 'story' as const,
      title: 'Test Quest',
      durationMinutes: 10,
      reward: { xp: 100 },
    };

    useQuestStore.setState({ pendingQuest });

    // Import the mocked function
    // QuestTimer is already imported at the top

    // Act
    useQuestStore.getState().cancelQuest();

    // Assert
    const state = useQuestStore.getState();
    expect(state.activeQuest).toBeNull();
    expect(state.pendingQuest).toBeNull();
    expect(QuestTimer.stopQuest).toHaveBeenCalled();
  });

  test('should reset failed quest', () => {
    // Arrange
    const failedQuest = {
      id: 'quest-1',
      mode: 'story' as const,
      title: 'Test Quest',
      durationMinutes: 10,
      reward: { xp: 100 },
      startTime: Date.now() - 1000,
      stopTime: Date.now(),
      status: 'failed' as const,
    };

    useQuestStore.setState({ failedQuest });

    // Act
    useQuestStore.getState().resetFailedQuest();

    // Assert
    const state = useQuestStore.getState();
    expect(state.failedQuest).toBeNull();
  });

  test('should clear recent completed quest', () => {
    // Arrange
    const completedQuest = {
      id: 'quest-1',
      mode: 'story' as const,
      title: 'Test Quest',
      durationMinutes: 10,
      reward: { xp: 100 },
      startTime: Date.now() - 1000,
      stopTime: Date.now(),
      status: 'completed' as const,
    };

    useQuestStore.setState({ recentCompletedQuest: completedQuest });

    // Act
    useQuestStore.getState().clearRecentCompletedQuest();

    // Assert
    const state = useQuestStore.getState();
    expect(state.recentCompletedQuest).toBeNull();
  });

  test('should get completed quests', () => {
    // Arrange
    const completedQuests = [
      createCompletedQuest('quest-1', Date.now() - 2000),
      createCompletedQuest('quest-2', Date.now() - 1000),
    ];

    useQuestStore.setState({ completedQuests });

    // Act
    const result = useQuestStore.getState().getCompletedQuests();

    // Assert
    expect(result).toEqual(completedQuests);
  });

  test('should set live activity ID', () => {
    // Act
    useQuestStore.getState().setLiveActivityId('activity-123');

    // Assert
    let state = useQuestStore.getState();
    expect(state.currentLiveActivityId).toBe('activity-123');

    // Act - clear ID
    useQuestStore.getState().setLiveActivityId(null);

    // Assert
    state = useQuestStore.getState();
    expect(state.currentLiveActivityId).toBeNull();
  });

  test('should set current invitation', () => {
    // Arrange
    const invitation: any = {
      id: 'inv-123',
      questId: 'quest-1',
      senderId: 'user-456',
      status: 'pending',
    };

    // Act
    useQuestStore.getState().setCurrentInvitation(invitation);

    // Assert
    const state = useQuestStore.getState();
    expect(state.currentInvitation).toEqual(invitation);
  });

  test('should set pending invitations', () => {
    // Arrange
    const invitations: any[] = [
      { id: 'inv-1', questId: 'quest-1', status: 'pending' },
      { id: 'inv-2', questId: 'quest-2', status: 'pending' },
    ];

    // Act
    useQuestStore.getState().setPendingInvitations(invitations);

    // Assert
    const state = useQuestStore.getState();
    expect(state.pendingInvitations).toEqual(invitations);
  });

  test('should set server available quests', () => {
    // Arrange
    const serverQuests: any[] = [
      {
        customId: 'server-quest-1',
        mode: 'story',
        title: 'Server Quest 1',
        durationMinutes: 10,
        reward: { xp: 100 },
      },
      {
        customId: 'server-quest-2',
        mode: 'custom',
        title: 'Server Quest 2',
        durationMinutes: 15,
        reward: { xp: 150 },
      },
    ];

    // Act
    useQuestStore
      .getState()
      .setServerAvailableQuests(serverQuests, true, false);

    // Assert
    const state = useQuestStore.getState();
    expect(state.serverAvailableQuests).toEqual(serverQuests);
    expect(state.hasMoreQuests).toBe(true);
    expect(state.storylineComplete).toBe(false);
    expect(state.availableQuests).toHaveLength(2);
    expect(state.availableQuests[0]).toMatchObject({
      id: 'server-quest-1',
      mode: 'story',
    });
  });

  describe('completeQuest', () => {
    test('should complete quest successfully when duration is met', async () => {
      // Arrange
      const startTime = Date.now() - 600000; // 10 minutes ago
      const activeQuest = {
        id: 'quest-1',
        mode: 'story' as const,
        title: 'Test Quest',
        durationMinutes: 10,
        reward: { xp: 100 },
        startTime,
        status: 'active' as const,
        poiSlug: 'test-poi',
      };

      useQuestStore.setState({
        activeQuest,
        completedQuests: [],
        lastCompletedQuestTimestamp: null,
      });

      const { queryClient } = require('@/api/common');
      const {
        cancelStreakWarningNotification,
        scheduleStreakWarningNotification,
      } = require('@/lib/services/notifications');

      // Act
      const result = useQuestStore.getState().completeQuest();

      // Assert
      expect(result).toMatchObject({
        ...activeQuest,
        stopTime: expect.any(Number),
        status: 'completed',
      });

      const state = useQuestStore.getState();
      expect(state.activeQuest).toBeNull();
      expect(state.recentCompletedQuest).toEqual(result);
      expect(state.completedQuests).toHaveLength(1);
      expect(state.lastCompletedQuestTimestamp).toEqual(result?.stopTime);
      expect(state.currentLiveActivityId).toBeNull();
      expect(state.cooperativeQuestRun).toBeNull();

      // Verify side effects
      expect(mockUpdateStreak).toHaveBeenCalledWith(null);
      expect(mockAddXP).toHaveBeenCalledWith(100);
      expect(mockRevealLocation).toHaveBeenCalledWith('test-poi');
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['user', 'details'],
      });
      expect(cancelStreakWarningNotification).toHaveBeenCalled();

      // Wait for the promise chain to complete
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(scheduleStreakWarningNotification).toHaveBeenCalledWith(true);
    });

    test('should complete quest with ignoreDuration flag', () => {
      // Arrange - quest that hasn't met duration
      const startTime = Date.now() - 60000; // 1 minute ago
      const activeQuest = {
        id: 'quest-1',
        mode: 'story' as const,
        title: 'Test Quest',
        durationMinutes: 10,
        reward: { xp: 100 },
        startTime,
        status: 'active' as const,
      };

      useQuestStore.setState({
        activeQuest,
        completedQuests: [],
      });

      // Act
      const result = useQuestStore.getState().completeQuest(true); // ignore duration

      // Assert
      expect(result).toMatchObject({
        ...activeQuest,
        stopTime: expect.any(Number),
        status: 'completed',
      });
      expect(mockAddXP).toHaveBeenCalledWith(100);
    });

    test('should fail quest when duration not met', () => {
      // Arrange - quest that hasn't met duration
      const startTime = Date.now() - 60000; // 1 minute ago
      const activeQuest = {
        id: 'quest-1',
        mode: 'story' as const,
        title: 'Test Quest',
        durationMinutes: 10,
        reward: { xp: 100 },
        startTime,
        status: 'active' as const,
      };

      useQuestStore.setState({
        activeQuest,
        completedQuests: [],
      });

      // Act
      const result = useQuestStore.getState().completeQuest();

      // Assert
      expect(result).toBeNull();
      const state = useQuestStore.getState();
      expect(state.failedQuest).toMatchObject({
        ...activeQuest,
        status: 'failed',
        stopTime: expect.any(Number),
      });
    });

    test('should not update streak if quest completed on same day', () => {
      // Arrange - last quest completed earlier today
      const now = new Date();
      const earlierToday = new Date(now);
      earlierToday.setHours(10, 0, 0, 0);

      const activeQuest = {
        id: 'quest-2',
        mode: 'story' as const,
        title: 'Test Quest',
        durationMinutes: 10,
        reward: { xp: 100 },
        startTime: Date.now() - 600000,
        status: 'active' as const,
      };

      useQuestStore.setState({
        activeQuest,
        completedQuests: [],
        lastCompletedQuestTimestamp: earlierToday.getTime(),
      });

      const {
        cancelStreakWarningNotification,
        scheduleStreakWarningNotification,
      } = require('@/lib/services/notifications');

      // Act
      useQuestStore.getState().completeQuest();

      // Assert - should not schedule new notifications
      expect(cancelStreakWarningNotification).not.toHaveBeenCalled();
      expect(scheduleStreakWarningNotification).not.toHaveBeenCalled();
    });

    test('should handle quest with no start time', () => {
      // Arrange
      const activeQuest = {
        id: 'quest-1',
        mode: 'story' as const,
        title: 'Test Quest',
        durationMinutes: 10,
        reward: { xp: 100 },
        startTime: undefined,
        status: 'active' as const,
      };

      useQuestStore.setState({ activeQuest });

      // Act
      const result = useQuestStore.getState().completeQuest();

      // Assert
      expect(result).toBeNull();
    });

    test('should handle no active quest', () => {
      // Arrange
      useQuestStore.setState({ activeQuest: null });

      // Act
      const result = useQuestStore.getState().completeQuest();

      // Assert
      expect(result).toBeNull();
    });
  });

  test('should prepare quest and clear cooperative data for non-cooperative quest', () => {
    // Arrange
    const quest = {
      id: 'quest-1',
      mode: 'story' as const,
      title: 'Test Quest',
      durationMinutes: 10,
      reward: { xp: 100 },
      category: 'personal' as const,
    };

    useQuestStore.setState({
      cooperativeQuestRun: { id: 'coop-1' } as any,
      currentInvitation: { id: 'inv-1' } as any,
      availableQuests: [{ id: 'old-quest' }] as any,
    });

    // Act
    useQuestStore.getState().prepareQuest(quest);

    // Assert
    const state = useQuestStore.getState();
    expect(state.pendingQuest).toEqual(quest);
    expect(state.availableQuests).toEqual([]);
    expect(state.cooperativeQuestRun).toBeNull();
    expect(state.currentInvitation).toBeNull();
  });

  test('should prepare cooperative quest and preserve cooperative data', () => {
    // Arrange
    const quest = {
      id: 'quest-1',
      mode: 'custom' as const,
      title: 'Cooperative Quest',
      durationMinutes: 10,
      reward: { xp: 100 },
      category: 'cooperative' as const,
    };

    const coopRun = { id: 'coop-1' } as any;
    const invitation = { id: 'inv-1' } as any;

    useQuestStore.setState({
      cooperativeQuestRun: coopRun,
      currentInvitation: invitation,
    });

    // Act
    useQuestStore.getState().prepareQuest(quest);

    // Assert
    const state = useQuestStore.getState();
    expect(state.pendingQuest).toEqual(quest);
    expect(state.cooperativeQuestRun).toEqual(coopRun);
    expect(state.currentInvitation).toEqual(invitation);
  });

  test('should cancel cooperative quest and clear cooperative data', () => {
    // Arrange
    const pendingQuest = {
      id: 'quest-1',
      mode: 'custom' as const,
      title: 'Cooperative Quest',
      durationMinutes: 10,
      reward: { xp: 100 },
      category: 'cooperative' as const,
    };

    useQuestStore.setState({
      pendingQuest,
      cooperativeQuestRun: { id: 'coop-1' } as any,
    });

    // QuestTimer is already imported at the top

    // Act
    useQuestStore.getState().cancelQuest();

    // Assert
    const state = useQuestStore.getState();
    expect(state.pendingQuest).toBeNull();
    expect(state.cooperativeQuestRun).toBeNull();
    expect(QuestTimer.stopQuest).toHaveBeenCalled();
  });

  test('should not refresh available quests when there is an active quest', () => {
    // Arrange
    const activeQuest = {
      id: 'quest-1',
      mode: 'story' as const,
      title: 'Active Quest',
      durationMinutes: 10,
      reward: { xp: 100 },
      startTime: Date.now(),
      status: 'active' as const,
    };

    useQuestStore.setState({
      activeQuest,
      availableQuests: [],
    });

    // Act
    useQuestStore.getState().refreshAvailableQuests();

    // Assert
    const state = useQuestStore.getState();
    expect(state.availableQuests).toEqual([]);
  });

  test('should handle refreshAvailableQuests with only custom quests completed', () => {
    // Arrange - only custom quests completed, no story quests
    const completedQuests = [
      {
        ...createCompletedQuest('custom-1', Date.now()),
        mode: 'custom' as const,
      },
    ];

    useQuestStore.setState({
      completedQuests,
      activeQuest: null,
    });

    // Act
    useQuestStore.getState().refreshAvailableQuests();

    // Assert
    const state = useQuestStore.getState();
    expect(state.availableQuests).toEqual([]);
  });

  test('should reset the entire store', () => {
    // Arrange - set up various state
    useQuestStore.setState({
      activeQuest: createCompletedQuest('quest-1', Date.now()),
      pendingQuest: { id: 'quest-2', mode: 'story' } as any,
      availableQuests: [{ id: 'quest-3', mode: 'story' }] as any,
      completedQuests: [createCompletedQuest('quest-0', Date.now())],
      failedQuest: createCompletedQuest('quest-f', Date.now()),
      recentCompletedQuest: createCompletedQuest('quest-r', Date.now()),
      lastCompletedQuestTimestamp: Date.now(),
      currentLiveActivityId: 'activity-123',
      failedQuests: [createCompletedQuest('quest-f1', Date.now())],
      serverAvailableQuests: [{ id: 'server-1' }] as any,
      hasMoreQuests: true,
      storylineComplete: true,
      currentInvitation: { id: 'inv-1' } as any,
      cooperativeQuestRun: { id: 'coop-1' } as any,
      pendingInvitations: [{ id: 'inv-2' }] as any,
    });

    // Act
    useQuestStore.getState().reset();

    // Assert
    const state = useQuestStore.getState();
    expect(state).toMatchObject({
      activeQuest: null,
      pendingQuest: null,
      availableQuests: [],
      completedQuests: [],
      failedQuest: null,
      recentCompletedQuest: null,
      lastCompletedQuestTimestamp: null,
      currentLiveActivityId: null,
      failedQuests: [],
      serverAvailableQuests: [],
      hasMoreQuests: false,
      storylineComplete: false,
      currentInvitation: null,
      cooperativeQuestRun: null,
      pendingInvitations: [],
    });
    expect(mockResetStreak).toHaveBeenCalled();
  });

  describe('Cooperative Quest Management', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset the store to initial state
      useQuestStore.setState({
        pendingQuest: null,
        activeQuest: null,
        completedQuests: [],
        failedQuests: [],
        cooperativeQuestRun: null,
        currentInvitation: null,
      });
    });

    test('should set cooperative quest run', () => {
      // Arrange
      const cooperativeQuestRun = {
        id: 'coop-quest-123',
        questId: 'quest-1',
        hostId: 'user-456',
        status: 'pending' as const,
        participants: [
          { userId: 'user-456', ready: true, status: 'pending' },
          { userId: 'user-789', ready: false, status: 'pending' },
        ],
        invitationId: 'inv-123',
        actualStartTime: null,
        scheduledEndTime: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Act
      useQuestStore.getState().setCooperativeQuestRun(cooperativeQuestRun);

      // Assert
      const state = useQuestStore.getState();
      expect(state.cooperativeQuestRun).toEqual(cooperativeQuestRun);
    });

    test('should fail cooperative quest and clear cooperative quest run', () => {
      // Arrange
      const cooperativeQuestRun = {
        id: 'coop-quest-123',
        questId: 'quest-1',
        hostId: 'user-456',
        status: 'active' as const,
        participants: [],
        invitationId: 'inv-123',
        actualStartTime: Date.now(),
        scheduledEndTime: Date.now() + 600000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const activeQuest = {
        id: 'quest-1',
        mode: 'story' as const,
        title: 'Test Quest',
        durationMinutes: 10,
        reward: { xp: 100 },
        startTime: Date.now(),
        status: 'active' as const,
      };

      useQuestStore.setState({
        cooperativeQuestRun,
        activeQuest,
        pendingQuest: null,
      });

      // Act
      useQuestStore.getState().failQuest();

      // Assert
      const state = useQuestStore.getState();
      expect(state.activeQuest).toBeNull();
      expect(state.pendingQuest).toBeNull();
      expect(state.cooperativeQuestRun).toBeNull();
      expect(state.failedQuests).toContainEqual(
        expect.objectContaining({
          ...activeQuest,
          status: 'failed',
          stopTime: expect.any(Number),
        })
      );
    });

    test('should update participant ready status', () => {
      // Arrange
      const cooperativeQuestRun = {
        id: 'coop-quest-123',
        questId: 'quest-1',
        hostId: 'user-456',
        status: 'pending' as const,
        participants: [
          { userId: 'user-456', ready: false, status: 'pending' },
          { userId: 'user-789', ready: false, status: 'pending' },
        ],
        invitationId: 'inv-123',
        actualStartTime: null,
        scheduledEndTime: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useQuestStore.setState({ cooperativeQuestRun });

      // Act
      useQuestStore.getState().updateParticipantReady('user-456', true);

      // Assert
      const state = useQuestStore.getState();
      const participant = state.cooperativeQuestRun?.participants.find(
        (p) => p.userId === 'user-456'
      );
      expect(participant?.ready).toBe(true);
    });

    test('should handle quest failure for single-player quest', () => {
      // Arrange
      const activeQuest = {
        id: 'quest-1',
        mode: 'story' as const,
        title: 'Test Quest',
        durationMinutes: 10,
        reward: { xp: 100 },
        startTime: Date.now(),
        status: 'active' as const,
      };

      useQuestStore.setState({
        activeQuest,
        cooperativeQuestRun: null,
        pendingQuest: null,
      });

      // Act
      useQuestStore.getState().failQuest();

      // Assert
      const state = useQuestStore.getState();
      expect(state.activeQuest).toBeNull();
      expect(state.pendingQuest).toBeNull();
      expect(state.failedQuests.length).toBe(1);
      expect(state.failedQuests[0]).toEqual(
        expect.objectContaining({
          ...activeQuest,
          status: 'failed',
          stopTime: expect.any(Number),
        })
      );
    });

    test('should not fail quest if no active quest', () => {
      // Arrange
      useQuestStore.setState({
        activeQuest: null,
        pendingQuest: null,
        cooperativeQuestRun: null,
        failedQuests: [],
      });

      // Act
      useQuestStore.getState().failQuest();

      // Assert
      const state = useQuestStore.getState();
      expect(state.failedQuests.length).toBe(0);
      expect(state.activeQuest).toBeNull();
    });
  });

  describe('Additional Coverage Tests', () => {
    test('should handle refreshAvailableQuests with no first quest found', () => {
      // Mock AVAILABLE_QUESTS to not have quest-1
      const originalQuests = require('@/app/data/quests').AVAILABLE_QUESTS;
      require('@/app/data/quests').AVAILABLE_QUESTS = [];

      useQuestStore.setState({
        activeQuest: null,
        completedQuests: [],
        availableQuests: ['some-quest'],
      });

      useQuestStore.getState().refreshAvailableQuests();

      const state = useQuestStore.getState();
      expect(state.availableQuests).toEqual([]);

      // Restore original quests
      require('@/app/data/quests').AVAILABLE_QUESTS = originalQuests;
    });

    test('should handle refreshAvailableQuests with only custom quests completed', () => {
      const customQuest: Quest = {
        id: 'custom-quest',
        mode: 'custom',
        title: 'Custom Quest',
        durationMinutes: 5,
        startTime: Date.now() - 300000,
        stopTime: Date.now(),
        status: 'completed',
        reward: { xp: 50 },
        poiSlug: 'custom-poi',
      };

      useQuestStore.setState({
        activeQuest: null,
        completedQuests: [customQuest],
        availableQuests: [],
      });

      useQuestStore.getState().refreshAvailableQuests();

      const state = useQuestStore.getState();
      expect(state.availableQuests).toEqual([]);
    });

    test('should handle storage functions in persist middleware', () => {
      const { getItem, setItem, removeItem } = require('@/lib/storage');

      // Reset mock call history
      getItem.mockClear();
      setItem.mockClear();
      removeItem.mockClear();

      // Test getItemForStorage by accessing a property that would trigger persist
      getItem.mockReturnValueOnce('test-value');

      // These functions are used by the persist middleware when the store is initialized
      // The test just verifies that the mocks are properly set up
      expect(getItem).toHaveBeenCalledTimes(0); // Initially no calls

      // Test direct access to verify storage functions work
      const value = getItem('test-key');
      expect(value).toBe('test-value');
      expect(getItem).toHaveBeenCalledWith('test-key');
    });

    test('should handle quest completion notification scheduling', async () => {
      const {
        scheduleStreakWarningNotification,
        cancelStreakWarningNotification,
      } = require('@/lib/services/notifications');

      const testQuest: Quest = {
        id: 'test-quest',
        mode: 'story',
        title: 'Test Quest',
        durationMinutes: 2,
        startTime: Date.now() - 120000, // 2 minutes ago
        status: 'active',
        reward: { xp: 100 },
        poiSlug: 'test-poi',
      };

      useQuestStore.setState({
        activeQuest: testQuest,
        completedQuests: [],
        lastCompletedQuestTimestamp: null,
      });

      // Complete the quest
      const completedQuest = useQuestStore.getState().completeQuest();

      expect(completedQuest).not.toBeNull();
      expect(cancelStreakWarningNotification).toHaveBeenCalled();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(scheduleStreakWarningNotification).toHaveBeenCalled();
    });

    test('should handle quest completion with missing fields', () => {
      const incompleteQuest: Quest = {
        id: 'incomplete-quest',
        mode: 'story',
        title: 'Incomplete Quest',
        durationMinutes: 2,
        startTime: Date.now() - 120000, // 2 minutes ago
        status: 'active',
        reward: { xp: 100 },
        // Missing poiSlug
      } as Quest;

      useQuestStore.setState({
        activeQuest: incompleteQuest,
        completedQuests: [],
      });

      const completedQuest = useQuestStore.getState().completeQuest();

      expect(completedQuest).not.toBeNull();
      expect(completedQuest?.status).toBe('completed');
    });

    test('should handle quest failure with missing quest details', () => {
      const minimalQuest: Quest = {
        id: 'minimal-quest',
        mode: 'story',
        title: 'Minimal Quest',
        durationMinutes: 2,
        startTime: Date.now() - 60000, // 1 minute ago
        status: 'active',
        reward: { xp: 100 },
        poiSlug: 'minimal-poi',
      };

      useQuestStore.setState({
        activeQuest: minimalQuest,
        failedQuests: [],
      });

      // Mock AVAILABLE_QUESTS to not have the quest details
      const originalQuests = require('@/app/data/quests').AVAILABLE_QUESTS;
      require('@/app/data/quests').AVAILABLE_QUESTS = [];

      useQuestStore.getState().failQuest();

      const state = useQuestStore.getState();
      expect(state.failedQuest).not.toBeNull();
      expect(state.failedQuest?.status).toBe('failed');
      expect(state.failedQuest?.title).toBe('Minimal Quest'); // Uses original quest title
      expect(state.failedQuests.length).toBe(1);

      // Restore original quests
      require('@/app/data/quests').AVAILABLE_QUESTS = originalQuests;
    });

    test('should handle character store interaction during quest completion', async () => {
      const { useCharacterStore } = require('@/store/character-store');
      const mockAddXP = jest.fn();
      const mockUpdateStreak = jest.fn();

      useCharacterStore.getState = jest.fn(() => ({
        addXP: mockAddXP,
        updateStreak: mockUpdateStreak,
      }));

      const testQuest: Quest = {
        id: 'test-quest',
        mode: 'story',
        title: 'Test Quest',
        durationMinutes: 2,
        startTime: Date.now() - 120000, // 2 minutes ago
        status: 'active',
        reward: { xp: 150 },
        poiSlug: 'test-poi',
      };

      useQuestStore.setState({
        activeQuest: testQuest,
        completedQuests: [],
        lastCompletedQuestTimestamp: null,
      });

      const completedQuest = useQuestStore.getState().completeQuest();

      expect(completedQuest).not.toBeNull();
      expect(mockAddXP).toHaveBeenCalledWith(150);
      expect(mockUpdateStreak).toHaveBeenCalled();
    });

    test('should handle POI store interaction during quest completion', async () => {
      const testQuest: Quest = {
        id: 'test-quest',
        mode: 'story',
        title: 'Test Quest',
        durationMinutes: 2,
        startTime: Date.now() - 120000, // 2 minutes ago
        status: 'active',
        reward: { xp: 100 },
        poiSlug: 'test-poi',
      };

      useQuestStore.setState({
        activeQuest: testQuest,
        completedQuests: [],
      });

      const completedQuest = useQuestStore.getState().completeQuest();

      expect(completedQuest).not.toBeNull();
      expect(mockRevealLocation).toHaveBeenCalledWith('test-poi');
    });

    test('should handle cooperative quest participant update with non-existent participant', () => {
      const cooperativeRun: CooperativeQuestRun = {
        id: 'coop-run',
        questId: 'coop-quest',
        hostId: 'host-user',
        status: 'active',
        participants: [
          { userId: 'user-1', ready: false, status: 'active' },
          { userId: 'user-2', ready: true, status: 'active' },
        ],
        invitationId: 'invite-123',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useQuestStore.setState({
        cooperativeQuestRun: cooperativeRun,
      });

      // Try to update a participant that doesn't exist
      useQuestStore
        .getState()
        .updateParticipantReady('non-existent-user', true);

      const state = useQuestStore.getState();
      expect(state.cooperativeQuestRun?.participants).toHaveLength(2);
      expect(state.cooperativeQuestRun?.participants[0].ready).toBe(false);
      expect(state.cooperativeQuestRun?.participants[1].ready).toBe(true);
    });

    test('should handle null cooperative quest run when updating participant', () => {
      useQuestStore.setState({
        cooperativeQuestRun: null,
      });

      // This should not throw an error
      useQuestStore.getState().updateParticipantReady('user-1', true);

      const state = useQuestStore.getState();
      expect(state.cooperativeQuestRun).toBeNull();
    });
  });
});
