import { renderHook } from '@testing-library/react-hooks';

import { useNavigationTarget } from '@/lib/navigation/navigation-state-resolver';
import { OnboardingStep } from '@/store/onboarding-store';

// Mock storage for provisional data checks
const mockGetItem = jest.fn();
jest.mock('@/lib/storage', () => ({
  getItem: jest.fn((key: string) => mockGetItem(key)),
}));

// Mock the stores before importing anything else
const mockAuthState = {
  status: 'idle' as 'idle' | 'signOut' | 'signIn' | 'hydrating',
};

const mockOnboardingState = {
  isOnboardingComplete: () => false,
  currentStep: OnboardingStep.NOT_STARTED,
  setCurrentStep: jest.fn(),
};

const mockCharacterState = {
  character: null as any,
};

const mockQuestState = {
  pendingQuest: null as any,
  recentCompletedQuest: null as any,
  failedQuest: null as any,
  completedQuests: [] as any[],
};

// Mock auth store
jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn((selector) => selector(mockAuthState)),
}));

// Mock onboarding store
jest.mock('@/store/onboarding-store', () => ({
  useOnboardingStore: jest.fn((selector) => selector(mockOnboardingState)),
  OnboardingStep: {
    NOT_STARTED: 'NOT_STARTED',
    SELECTING_CHARACTER: 'SELECTING_CHARACTER',
    VIEWING_INTRO: 'VIEWING_INTRO',
    REQUESTING_NOTIFICATIONS: 'REQUESTING_NOTIFICATIONS',
    STARTING_FIRST_QUEST: 'STARTING_FIRST_QUEST',
    VIEWING_SIGNUP_PROMPT: 'VIEWING_SIGNUP_PROMPT',
    COMPLETED: 'COMPLETED',
  },
}));

// Mock character store
jest.mock('@/store/character-store', () => ({
  useCharacterStore: jest.fn((selector) => selector(mockCharacterState)),
}));

// Mock quest store with proper Zustand interface
jest.mock('@/store/quest-store', () => ({
  useQuestStore: Object.assign(
    jest.fn((selector) => selector(mockQuestState)),
    {
      getState: jest.fn(() => mockQuestState),
      subscribe: jest.fn((_listener) => {
        // Return an unsubscribe function
        return jest.fn();
      }),
    }
  ),
}));

// Helper functions to update mock state
const setAuthState = (state: Partial<typeof mockAuthState>) => {
  Object.assign(mockAuthState, state);
};

const setOnboardingState = (state: Partial<typeof mockOnboardingState>) => {
  Object.assign(mockOnboardingState, state);
};

const setCharacterState = (state: Partial<typeof mockCharacterState>) => {
  Object.assign(mockCharacterState, state);
};

const setQuestState = (state: Partial<typeof mockQuestState>) => {
  Object.assign(mockQuestState, state);
};

// Reset state before each test
beforeEach(() => {
  setAuthState({ status: 'idle' });
  setOnboardingState({
    isOnboardingComplete: () => false,
    currentStep: OnboardingStep.NOT_STARTED,
    setCurrentStep: jest.fn(),
  });
  setCharacterState({ character: null });
  setQuestState({
    pendingQuest: null,
    recentCompletedQuest: null,
    failedQuest: null,
    completedQuests: [],
  });

  // Reset storage mock - return null by default (no provisional data)
  mockGetItem.mockReturnValue(null);
});

describe('Navigation State Resolver', () => {
  it('returns loading when auth is hydrating', () => {
    setAuthState({ status: 'hydrating' });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({ type: 'loading' });
  });

  it('prioritizes pending quest over everything', () => {
    setAuthState({ status: 'signOut' }); // Even if signed out
    setQuestState({ pendingQuest: { id: 'quest-1' } });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({
      type: 'pending-quest',
      questId: 'quest-1',
    });
  });

  it('redirects to first-quest-result for failed quest-1 during onboarding', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({ isOnboardingComplete: () => false });
    setCharacterState({ character: null });
    setQuestState({
      failedQuest: { id: 'quest-1' },
      completedQuests: [],
    });

    // Mock provisional data to prevent auto-sync
    mockGetItem.mockImplementation((key) => {
      if (key === 'provisionalUserId') return 'test-provisional-id';
      return null;
    });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({
      type: 'first-quest-result',
      outcome: 'failed',
    });
  });

  it('redirects to quest-result for regular failed quest', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({ isOnboardingComplete: () => true });
    setQuestState({ failedQuest: { id: 'quest-2' } });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({
      type: 'quest-result',
      questId: 'quest-2',
      outcome: 'failed',
    });
  });

  it('redirects to first-quest-result for completed quest-1 during onboarding', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({ isOnboardingComplete: () => false });
    setQuestState({
      recentCompletedQuest: { id: 'quest-1' },
      completedQuests: [],
    });

    // Mock provisional data to prevent auto-sync
    mockGetItem.mockImplementation((key) => {
      if (key === 'provisionalUserId') return 'test-provisional-id';
      return null;
    });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({
      type: 'first-quest-result',
      outcome: 'completed',
    });
  });

  it('redirects to quest-result for regular completed quest', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({ isOnboardingComplete: () => true });
    setQuestState({ recentCompletedQuest: { id: 'quest-2' } });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({
      type: 'quest-result',
      questId: 'quest-2',
      outcome: 'completed',
    });
  });

  it('redirects to onboarding when not complete and user has provisional data', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => false,
      currentStep: OnboardingStep.NOT_STARTED,
    });
    setCharacterState({ character: null });
    setQuestState({ completedQuests: [] });

    // Mock provisional data to indicate genuine new user
    mockGetItem.mockImplementation((key) => {
      if (key === 'provisionalUserId') return 'test-provisional-id';
      return null;
    });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({ type: 'onboarding' });
  });

  it('redirects to app for legacy users with character data but incomplete onboarding', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => true, // Will be set by synchronization
      currentStep: OnboardingStep.COMPLETED,
    });
    setCharacterState({
      character: {
        name: 'LegacyChar',
        type: 'warrior',
        level: 5,
        currentXP: 200,
        xpToNextLevel: 300,
      },
    });
    setQuestState({ completedQuests: [] });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({ type: 'app' });
  });

  it('handles failed quest-1 correctly for legacy users with character data', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({ isOnboardingComplete: () => true }); // Will be set by sync
    setCharacterState({
      character: {
        name: 'LegacyChar',
        type: 'druid',
        level: 1,
        currentXP: 0,
        xpToNextLevel: 100,
      },
    });
    setQuestState({ failedQuest: { id: 'quest-1' } });

    const { result } = renderHook(() => useNavigationTarget());

    // Should redirect to regular quest-result since character data indicates effective completion
    expect(result.current).toEqual({
      type: 'quest-result',
      questId: 'quest-1',
      outcome: 'failed',
    });
  });

  it('redirects to login when signed out', () => {
    setAuthState({ status: 'signOut' });
    setOnboardingState({ isOnboardingComplete: () => true });
    setQuestState({ completedQuests: [] });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({ type: 'login' });
  });

  it('redirects to app by default', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({ isOnboardingComplete: () => true });
    setQuestState({ completedQuests: [] });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({ type: 'app' });
  });

  it('updates navigation target when auth status changes from signOut to signIn', () => {
    // Start with signed out state
    setAuthState({ status: 'signOut' });
    setOnboardingState({ isOnboardingComplete: () => true });
    setQuestState({ completedQuests: [] });

    const { result, rerender } = renderHook(() => useNavigationTarget());

    // Should initially redirect to login
    expect(result.current).toEqual({ type: 'login' });

    // Simulate auth status change (magic link verification)
    setAuthState({ status: 'signIn' });
    rerender();

    // Should now redirect to app
    expect(result.current).toEqual({ type: 'app' });
  });

  it('prioritizes quest states in correct order', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({ isOnboardingComplete: () => true });

    // Test priority: pending > failed > completed
    setQuestState({
      pendingQuest: { id: 'quest-1' },
      failedQuest: { id: 'quest-2' },
      recentCompletedQuest: { id: 'quest-3' },
    });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({
      type: 'pending-quest',
      questId: 'quest-1',
    });
  });

  it('handles failed quest priority over completed quest', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({ isOnboardingComplete: () => true });
    setQuestState({
      failedQuest: { id: 'quest-2' },
      recentCompletedQuest: { id: 'quest-3' },
    });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({
      type: 'quest-result',
      questId: 'quest-2',
      outcome: 'failed',
    });
  });

  it('redirects to app when user has completed quests but onboarding state is reset', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => true, // Will be set by synchronization
      currentStep: OnboardingStep.COMPLETED,
    });
    setCharacterState({ character: null });
    setQuestState({
      completedQuests: [{ id: 'quest-1a', status: 'completed' }],
    });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({ type: 'app' });
  });

  it('redirects to app when user has character data even with reset onboarding state', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => true, // Will be set by synchronization
      currentStep: OnboardingStep.COMPLETED,
    });
    setCharacterState({
      character: {
        name: 'TestChar',
        type: 'warrior',
        level: 2,
        currentXP: 150,
        xpToNextLevel: 250,
      },
    });
    setQuestState({ completedQuests: [] });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({ type: 'app' });
  });

  it('still redirects to onboarding for truly new users with no quest history', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => false,
      currentStep: OnboardingStep.NOT_STARTED,
    });
    setCharacterState({ character: null });
    setQuestState({
      completedQuests: [], // No completed quests - truly new user
    });

    // Mock provisional data to indicate this is a genuine new user
    mockGetItem.mockImplementation((key) => {
      if (key === 'provisionalUserId') return 'test-provisional-id';
      return null;
    });

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({ type: 'onboarding' });
  });

  it('automatically synchronizes onboarding state for users with character data', () => {
    const mockSetCurrentStep = jest.fn();
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => false,
      currentStep: OnboardingStep.NOT_STARTED,
      setCurrentStep: mockSetCurrentStep,
    });
    setCharacterState({
      character: {
        name: 'LegacyChar',
        type: 'warrior',
        level: 5,
        currentXP: 200,
        xpToNextLevel: 300,
      },
    });
    setQuestState({ completedQuests: [] });

    renderHook(() => useNavigationTarget());

    // Should have called setCurrentStep to mark onboarding as complete
    expect(mockSetCurrentStep).toHaveBeenCalledWith(OnboardingStep.COMPLETED);
  });

  it('automatically synchronizes onboarding state for users with completed quests', () => {
    const mockSetCurrentStep = jest.fn();
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => false,
      currentStep: OnboardingStep.NOT_STARTED,
      setCurrentStep: mockSetCurrentStep,
    });
    setCharacterState({ character: null });
    setQuestState({
      completedQuests: [{ id: 'quest-1a', status: 'completed' }],
    });

    renderHook(() => useNavigationTarget());

    // Should have called setCurrentStep to mark onboarding as complete
    expect(mockSetCurrentStep).toHaveBeenCalledWith(OnboardingStep.COMPLETED);
  });

  it('does not synchronize onboarding state for truly new users', () => {
    const mockSetCurrentStep = jest.fn();
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => false,
      currentStep: OnboardingStep.NOT_STARTED,
      setCurrentStep: mockSetCurrentStep,
    });
    setCharacterState({ character: null });
    setQuestState({ completedQuests: [] }); // No completed quests

    // Mock provisional data to indicate this is a genuinely new user
    mockGetItem.mockImplementation((key) => {
      if (key === 'provisionalUserId') return 'test-provisional-id';
      return null;
    });

    renderHook(() => useNavigationTarget());

    // Should NOT have called setCurrentStep since this is a genuinely new user
    expect(mockSetCurrentStep).not.toHaveBeenCalled();
  });

  it('automatically synchronizes onboarding state for verified users with no provisional data', () => {
    const mockSetCurrentStep = jest.fn();
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => false,
      currentStep: OnboardingStep.NOT_STARTED,
      setCurrentStep: mockSetCurrentStep,
    });
    setCharacterState({ character: null });
    setQuestState({ completedQuests: [] });

    // Mock getItem to return null (no provisional data)
    mockGetItem.mockReturnValue(null);

    renderHook(() => useNavigationTarget());

    // Should have called setCurrentStep to mark onboarding as complete for verified user
    expect(mockSetCurrentStep).toHaveBeenCalledWith(OnboardingStep.COMPLETED);
  });

  it('does not synchronize onboarding state for users with provisional data', () => {
    const mockSetCurrentStep = jest.fn();
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => false,
      currentStep: OnboardingStep.NOT_STARTED,
      setCurrentStep: mockSetCurrentStep,
    });
    setCharacterState({ character: null });
    setQuestState({ completedQuests: [] });

    // Mock getItem to return provisional data (indicating new user in onboarding)
    mockGetItem.mockImplementation((key) => {
      if (key === 'provisionalUserId') return 'test-provisional-id';
      return null;
    });

    renderHook(() => useNavigationTarget());

    // Should NOT have called setCurrentStep since user has provisional data (genuine new user)
    expect(mockSetCurrentStep).not.toHaveBeenCalled();
  });

  it('redirects verified users without local data to app after synchronization', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => true, // Will be set to true by synchronization
      currentStep: OnboardingStep.COMPLETED,
    });
    setCharacterState({ character: null });
    setQuestState({ completedQuests: [] });

    // Mock getItem to return null (no provisional data)
    mockGetItem.mockReturnValue(null);

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({ type: 'app' });
  });
});
