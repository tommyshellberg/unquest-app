import { renderHook } from '@testing-library/react-hooks';

import { useNavigationTarget } from '@/lib/navigation/navigation-state-resolver';
import { OnboardingStep } from '@/store/onboarding-store';

// Mock the stores before importing anything else
const mockAuthState = {
  status: 'idle' as 'idle' | 'signOut' | 'signIn' | 'hydrating',
};

const mockOnboardingState = {
  isOnboardingComplete: () => false,
  currentStep: OnboardingStep.NOT_STARTED,
};

const mockQuestState = {
  pendingQuest: null as any,
  recentCompletedQuest: null as any,
  failedQuest: null as any,
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
    INTRO_COMPLETED: 'INTRO_COMPLETED',
    NOTIFICATIONS_COMPLETED: 'NOTIFICATIONS_COMPLETED',
    CHARACTER_SELECTED: 'CHARACTER_SELECTED',
    FIRST_QUEST_COMPLETED: 'FIRST_QUEST_COMPLETED',
    SIGNUP_PROMPT_SHOWN: 'SIGNUP_PROMPT_SHOWN',
    COMPLETED: 'COMPLETED',
  },
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

const setQuestState = (state: Partial<typeof mockQuestState>) => {
  Object.assign(mockQuestState, state);
};

// Reset state before each test
beforeEach(() => {
  setAuthState({ status: 'idle' });
  setOnboardingState({
    isOnboardingComplete: () => false,
    currentStep: OnboardingStep.NOT_STARTED,
  });
  setQuestState({
    pendingQuest: null,
    recentCompletedQuest: null,
    failedQuest: null,
  });
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
    setQuestState({ failedQuest: { id: 'quest-1' } });

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

  it('redirects to first-quest-result for completed quest-1', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({ isOnboardingComplete: () => false });
    setQuestState({ recentCompletedQuest: { id: 'quest-1' } });

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

  it('redirects to onboarding when not complete', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({
      isOnboardingComplete: () => false,
      currentStep: OnboardingStep.NOT_STARTED,
    });
    setQuestState({});

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({ type: 'onboarding' });
  });

  it('redirects to login when signed out', () => {
    setAuthState({ status: 'signOut' });
    setOnboardingState({ isOnboardingComplete: () => true });
    setQuestState({});

    const { result } = renderHook(() => useNavigationTarget());

    expect(result.current).toEqual({ type: 'login' });
  });

  it('redirects to app by default', () => {
    setAuthState({ status: 'signIn' });
    setOnboardingState({ isOnboardingComplete: () => true });
    setQuestState({});

    const { result } = renderHook(() => useNavigationTarget());

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
});
