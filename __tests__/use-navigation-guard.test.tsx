import React from 'react';
import { render } from '@testing-library/react-native';

// Get the actual OnboardingStep enum
import { OnboardingStep } from '@/store/onboarding-store';

// Mock minimal native modules - these need to be mocked before imports
jest.mock('react-native-bg-actions', () => ({}));
jest.mock('react-native-onesignal', () => ({ OneSignal: {} }));

// Setup router mocks
jest.mock('expo-router', () => {
  return {
    router: {
      replace: jest.fn(),
    },
    usePathname: jest.fn().mockReturnValue('/'),
  };
});

// Import and setup the router mock reference for later use
import { router } from 'expo-router';
// Get typed access to the mocked function
const mockedReplace = router.replace as jest.Mock;

// Prepare store state blueprints
const mockOnboardingState = {
  currentStep: OnboardingStep.NOT_STARTED,
  isOnboardingComplete: jest.fn().mockReturnValue(false),
  hasSeenSignupPrompt: jest.fn().mockReturnValue(false),
};

interface Quest {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Add other properties as needed
}

const mockQuestState = {
  pendingQuest: null as Quest | null,
  failedQuest: null as Quest | null,
  completedQuests: [] as Quest[],
  recentCompletedQuest: null as Quest | null,
};

// Mutable state for the useAuth mock
const mockAuthState = { status: 'signOut' };

jest.mock('@/lib', () => ({
  // Keep other potential exports from @/lib if any, or mock them as needed
  ...jest.requireActual('@/lib'), // If there are other real exports you need
  useAuth: jest.fn((selector) => selector(mockAuthState)), // Mimic Zustand selector
}));

// Mock stores (useOnboardingStore, useQuestStore)
jest.mock('@/store/onboarding-store', () => {
  const actual = jest.requireActual('@/store/onboarding-store');
  return {
    ...actual, // Keep the actual OnboardingStep enum
    useOnboardingStore: {
      getState: jest.fn(),
    },
  };
});

jest.mock('@/store/quest-store', () => ({
  useQuestStore: {
    getState: jest.fn(),
  },
}));

// Import the mocked stores to configure their getState methods
import { useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';

// Now import the component under test
import { useNavigationGuard } from '@/lib/navigation/use-navigation-guard';

// Component used for testing
function TestComponent() {
  useNavigationGuard(true);
  return null;
}

describe('useNavigationGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth state for useAuth mock
    mockAuthState.status = 'signOut';

    // Configure the getState mocks for stores
    (useOnboardingStore.getState as jest.Mock).mockReturnValue(
      mockOnboardingState
    );
    (useQuestStore.getState as jest.Mock).mockReturnValue(mockQuestState);

    // Reset mock state values for each test
    mockOnboardingState.currentStep = OnboardingStep.NOT_STARTED;
    mockOnboardingState.isOnboardingComplete.mockReturnValue(false);
    mockOnboardingState.hasSeenSignupPrompt.mockReturnValue(false);

    mockQuestState.pendingQuest = null;
    mockQuestState.failedQuest = null;
    mockQuestState.completedQuests = [];
    mockQuestState.recentCompletedQuest = null;

    mockedReplace.mockClear(); // Clear router mock

    // Default path
    jest.requireMock('expo-router').usePathname.mockReturnValue('/');
  });

  it('redirects brand-new user to /welcome', () => {
    render(<TestComponent />);
    expect(mockedReplace).toHaveBeenCalledWith('/welcome');
  });

  it('redirects to pending-quest if one exists', () => {
    // Ensure the user is past the initial welcome screen
    mockOnboardingState.currentStep = OnboardingStep.INTRO_COMPLETED;
    mockQuestState.pendingQuest = { id: 'q1' };
    jest.requireMock('expo-router').usePathname.mockReturnValue('/journal');
    render(<TestComponent />);
    expect(mockedReplace).toHaveBeenCalledWith('/pending-quest');
  });

  it('redirects to /first-quest-result if first quest was recently completed during early onboarding', () => {
    mockQuestState.recentCompletedQuest = {
      id: 'quest-1',
      stopTime: Date.now(), // stopTime is not strictly used by this rule but good for consistency
    };
    // User is in an onboarding step *before* FIRST_QUEST_COMPLETED
    mockOnboardingState.currentStep = OnboardingStep.CHARACTER_SELECTED;
    // User lands on a generic page like root, or reopens app
    jest.requireMock('expo-router').usePathname.mockReturnValue('/');
    render(<TestComponent />);
    expect(mockedReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/first-quest-result',
        params: { outcome: 'completed' },
      })
    );
  });

  it('redirects to signup prompt when step is SIGNUP_PROMPT_SHOWN and not on signup screen', () => {
    mockOnboardingState.currentStep = OnboardingStep.SIGNUP_PROMPT_SHOWN;
    mockQuestState.recentCompletedQuest = null;
    mockOnboardingState.hasSeenSignupPrompt.mockReturnValue(true);
    mockAuthState.status = 'signOut';
    jest.requireMock('expo-router').usePathname.mockReturnValue('/journal');
    render(<TestComponent />);
    expect(mockedReplace).toHaveBeenCalledWith('/quest-completed-signup');
  });

  it('redirects to /onboarding if onboarding is incomplete and user is on an (app) route', () => {
    mockOnboardingState.currentStep = OnboardingStep.INTRO_COMPLETED;
    mockAuthState.status = 'signOut';
    mockQuestState.pendingQuest = null;
    mockQuestState.failedQuest = null;
    mockQuestState.recentCompletedQuest = null;
    jest.requireMock('expo-router').usePathname.mockReturnValue('/(app)/index');
    render(<TestComponent />);
    expect(mockedReplace).toHaveBeenCalledWith('/onboarding');
  });

  it('guards /(app) routes by redirecting to /login if signed out and onboarding is COMPLETED', () => {
    jest.requireMock('expo-router').usePathname.mockReturnValue('/(app)/index');
    mockOnboardingState.currentStep = OnboardingStep.COMPLETED;
    mockAuthState.status = 'signOut';
    mockQuestState.pendingQuest = null;
    mockQuestState.failedQuest = null;
    mockQuestState.recentCompletedQuest = null;
    render(<TestComponent />);
    expect(mockedReplace).toHaveBeenCalledWith('/login');
  });

  it('does not redirect if user is signed in, onboarding is complete, and on an (app) route', () => {
    mockOnboardingState.currentStep = OnboardingStep.COMPLETED;
    mockAuthState.status = 'signIn'; // Directly set auth state for this test
    mockQuestState.pendingQuest = null;
    mockQuestState.failedQuest = null;
    mockQuestState.recentCompletedQuest = null;
    jest.requireMock('expo-router').usePathname.mockReturnValue('/(app)/index');
    render(<TestComponent />);
    expect(mockedReplace).not.toHaveBeenCalled();
  });

  it('redirects to /(app) if user is on /quest-completed-signup but onboarding is already COMPLETED', () => {
    mockOnboardingState.currentStep = OnboardingStep.COMPLETED;
    mockAuthState.status = 'signIn'; // User has likely just signed up or logged in
    mockQuestState.pendingQuest = null;
    mockQuestState.failedQuest = null;
    mockQuestState.recentCompletedQuest = null;
    jest
      .requireMock('expo-router')
      .usePathname.mockReturnValue('/quest-completed-signup');
    render(<TestComponent />);
    expect(mockedReplace).toHaveBeenCalledWith('/(app)');
  });

  it('does not redirect from /welcome to /login if onboarding is NOT_STARTED', () => {
    mockOnboardingState.currentStep = OnboardingStep.NOT_STARTED;
    jest.requireMock('expo-router').usePathname.mockReturnValue('/login'); // User is navigating to login
    render(<TestComponent />);
    expect(mockedReplace).not.toHaveBeenCalled();
  });

  // Tests for the new rule: Redirect to App if Signed In and Onboarding Complete
  describe('when signed in and onboarding is complete', () => {
    beforeEach(() => {
      mockAuthState.status = 'signIn';
      mockOnboardingState.currentStep = OnboardingStep.COMPLETED;
      mockQuestState.pendingQuest = null;
      mockQuestState.failedQuest = null;
      mockQuestState.recentCompletedQuest = null;
    });

    it('redirects from / to /(app)', () => {
      jest.requireMock('expo-router').usePathname.mockReturnValue('/');
      render(<TestComponent />);
      expect(mockedReplace).toHaveBeenCalledWith('/(app)');
    });

    it('redirects from /welcome to /(app)', () => {
      jest.requireMock('expo-router').usePathname.mockReturnValue('/welcome');
      render(<TestComponent />);
      expect(mockedReplace).toHaveBeenCalledWith('/(app)');
    });

    it('redirects from /login to /(app)', () => {
      jest.requireMock('expo-router').usePathname.mockReturnValue('/login');
      render(<TestComponent />);
      expect(mockedReplace).toHaveBeenCalledWith('/(app)');
    });

    it('redirects from /onboarding to /(app)', () => {
      jest
        .requireMock('expo-router')
        .usePathname.mockReturnValue('/onboarding');
      render(<TestComponent />);
      expect(mockedReplace).toHaveBeenCalledWith('/(app)');
    });

    it('redirects from /first-quest-result to /(app)', () => {
      jest
        .requireMock('expo-router')
        .usePathname.mockReturnValue('/first-quest-result');
      render(<TestComponent />);
      expect(mockedReplace).toHaveBeenCalledWith('/(app)');
    });

    // This existing test case also fits here and is covered by the new rule.
    // It can be kept for explicitness or if specific setup for this route is ever needed.
    it('redirects from /quest-completed-signup to /(app)', () => {
      jest
        .requireMock('expo-router')
        .usePathname.mockReturnValue('/quest-completed-signup');
      render(<TestComponent />);
      expect(mockedReplace).toHaveBeenCalledWith('/(app)');
    });

    it('does NOT redirect if already on an /app route', () => {
      jest
        .requireMock('expo-router')
        .usePathname.mockReturnValue('/(app)/some-page');
      render(<TestComponent />);
      expect(mockedReplace).not.toHaveBeenCalled();
    });
  });
});
