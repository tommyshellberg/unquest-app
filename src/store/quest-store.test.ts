import { useQuestStore } from '@/store/quest-store';
import { type Quest } from '@/store/types';

// Mock the dependencies
jest.mock('@/lib/services/quest-timer', () => ({
  stopQuest: jest.fn(),
}));

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

// Mock the character store
jest.mock('@/store/character-store', () => ({
  useCharacterStore: {
    getState: () => ({
      updateStreak: jest.fn(),
      addXP: jest.fn(),
      resetStreak: jest.fn(),
    }),
  },
}));

// Mock the POI store
jest.mock('@/store/poi-store', () => ({
  usePOIStore: {
    getState: () => ({
      revealLocation: jest.fn(),
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
      shouldShowStreak: false,
    });
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
});

describe('QuestStore - shouldShowStreak functionality', () => {
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
      shouldShowStreak: false,
    });
  });

  test('should initialize shouldShowStreak as false', () => {
    const state = useQuestStore.getState();
    expect(state.shouldShowStreak).toBe(false);
  });

  test('should set shouldShowStreak to true', () => {
    // Act
    useQuestStore.getState().setShouldShowStreak(true);

    // Assert
    const state = useQuestStore.getState();
    expect(state.shouldShowStreak).toBe(true);
  });

  test('should set shouldShowStreak to false', () => {
    // Arrange - first set it to true
    useQuestStore.setState({ shouldShowStreak: true });

    // Act
    useQuestStore.getState().setShouldShowStreak(false);

    // Assert
    const state = useQuestStore.getState();
    expect(state.shouldShowStreak).toBe(false);
  });

  test('should reset shouldShowStreak to false when store is reset', () => {
    // Arrange - set shouldShowStreak to true
    useQuestStore.setState({ shouldShowStreak: true });

    // Act
    useQuestStore.getState().reset();

    // Assert
    const state = useQuestStore.getState();
    expect(state.shouldShowStreak).toBe(false);
  });
});
