/**
 * Integration tests for Home component
 *
 * Following React Testing Library principles:
 * "The more your tests resemble the way your software is used,
 *  the more confidence they can give you."
 *
 * These tests focus on:
 * - What users SEE (UI elements, loading states, button text)
 * - What users DO (click buttons, navigate)
 * - How experience differs (premium vs non-premium)
 *
 * Business logic is tested in individual hook tests:
 * - useCarouselState.test.ts (10 tests)
 * - useHomeData.test.ts (16 tests)
 * - useStoryOptions.test.ts
 * - useQuestSelection.ts
 */
import React from 'react';
import { render, screen, fireEvent } from '@/lib/test-utils';

// Mock the router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

// Mock QuestTimer
jest.mock('@/lib/services/quest-timer', () => ({
  __esModule: true,
  default: {
    prepareQuest: jest.fn(),
    isRunning: jest.fn(() => false),
  },
}));

// Mock posthog
jest.mock('posthog-react-native', () => ({
  usePostHog: () => ({
    capture: jest.fn(),
  }),
}));

// Mock audio preloader
jest.mock('@/hooks/use-audio-preloader', () => ({
  useAudioPreloader: jest.fn(),
}));

// Mock premium access
jest.mock('@/lib/hooks/use-premium-access', () => ({
  usePremiumAccess: jest.fn(() => ({
    hasPremiumAccess: false,
    checkPremiumAccess: jest.fn(),
    refreshPremiumStatus: jest.fn(),
    handlePaywallSuccess: jest.fn(),
  })),
}));

// Mock settings store
jest.mock('@/store/settings-store', () => ({
  useSettingsStore: jest.fn((selector) =>
    selector
      ? selector({
          hasSeenBranchingAnnouncement: true, // Don't show modal in tests
          hasCompletedFirstQuest: false,
        })
      : {
          hasSeenBranchingAnnouncement: true,
          hasCompletedFirstQuest: false,
        }
  ),
}));

// Mock user store
jest.mock('@/store/user-store', () => ({
  useUserStore: jest.fn((selector) =>
    selector ? selector({ user: { id: 'test-user' } }) : { user: { id: 'test-user' } }
  ),
}));

// Mock useServerQuests hook
const mockUseServerQuests = {
  isLoading: false,
  error: null,
  serverQuests: [],
  hasMoreQuests: false,
  storylineComplete: false,
  storylineProgress: undefined,
  options: [],
};

jest.mock('@/hooks/use-server-quests', () => ({
  useServerQuests: jest.fn(() => mockUseServerQuests),
}));

// Mock quest store with minimal state
const mockQuestStoreState: any = {
  activeQuest: null,
  pendingQuest: null,
  availableQuests: [],
  completedQuests: [],
  prepareQuest: jest.fn(),
  refreshAvailableQuests: jest.fn(),
  failQuest: jest.fn(),
};

jest.mock('@/store/quest-store', () => ({
  useQuestStore: Object.assign(
    jest.fn((selector) => selector(mockQuestStoreState)),
    {
      getState: jest.fn(() => mockQuestStoreState),
    }
  ),
}));

// Mock AVAILABLE_QUESTS with minimal data
jest.mock('@/app/data/quests', () => ({
  AVAILABLE_QUESTS: [],
}));

// Mock user services
jest.mock('@/lib/services/user', () => ({
  refreshPremiumStatus: jest.fn().mockResolvedValue({}),
}));

// Import the Home component
const Home = require('./index').default;

describe('Home Component - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset mocks
    mockQuestStoreState.activeQuest = null;
    mockQuestStoreState.pendingQuest = null;
    mockQuestStoreState.availableQuests = [];
    mockQuestStoreState.completedQuests = [];
    mockQuestStoreState.failQuest = jest.fn();

    mockUseServerQuests.isLoading = false;
    mockUseServerQuests.serverQuests = [];
    mockUseServerQuests.options = [];
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('What user SEES', () => {
    it('shows the home screen with quest selection', () => {
      const { unmount } = render(<Home />);

      // User sees the main header
      expect(screen.getByText('Choose Your Adventure')).toBeTruthy();

      // User sees description
      expect(
        screen.getByText(/Continue your epic story, create a quest/)
      ).toBeTruthy();

      unmount();
    });

    it('shows loading message while quests are loading', () => {
      mockUseServerQuests.isLoading = true;

      const { unmount } = render(<Home />);

      // User sees loading feedback
      expect(screen.getByText('Loading quests...')).toBeTruthy();

      unmount();
    });

    it('hides action buttons when user has an active quest', () => {
      mockQuestStoreState.activeQuest = {
        id: 'quest-1',
        title: 'Active Quest',
        startTime: Date.now(),
      };

      const { unmount } = render(<Home />);

      // User cannot see any quest start buttons
      // (They would normally appear after scrolling the carousel)
      expect(screen.queryByText('Start Quest')).toBeNull();
      expect(screen.queryByText('Create Custom Quest')).toBeNull();
      expect(screen.queryByText('Cooperative Quests')).toBeNull();
      expect(screen.queryByText('Unlock Cooperative Mode')).toBeNull();

      unmount();
    });
  });

  describe('Integration with server quests', () => {
    it('displays single server quest with start button', () => {
      mockUseServerQuests.serverQuests = [
        {
          customId: 'quest-5',
          title: 'The Lake Discovery',
          durationMinutes: 15,
          reward: { xp: 45 },
          requiresPremium: false,
          isPremium: false,
        },
      ];

      const { unmount } = render(<Home />);

      // User sees the quest title and a start button
      expect(screen.getByText('The Lake Discovery')).toBeTruthy();
      expect(screen.getByText('Start Quest')).toBeTruthy();

      unmount();
    });

    it('displays multiple server quest options when available', () => {
      mockUseServerQuests.serverQuests = [
        {
          customId: 'quest-4a',
          title: 'Unraveling the Inscription',
          durationMinutes: 12,
          reward: { xp: 36 },
          decisionText: 'Stay and investigate the ruins',
          requiresPremium: false,
        },
        {
          customId: 'quest-4b',
          title: 'Moving Forward Before Nightfall',
          durationMinutes: 12,
          reward: { xp: 36 },
          decisionText: 'Continue on before nightfall',
          requiresPremium: false,
        },
      ];

      const { unmount } = render(<Home />);

      // User sees both decision options
      expect(screen.getByText('Stay and investigate the ruins')).toBeTruthy();
      expect(screen.getByText('Continue on before nightfall')).toBeTruthy();

      unmount();
    });

    it('shows premium unlock for premium quests', () => {
      mockUseServerQuests.serverQuests = [
        {
          customId: 'quest-11',
          title: 'The Escape',
          durationMinutes: 12,
          reward: { xp: 36 },
          requiresPremium: true,
          isPremium: true,
        },
      ];

      const { unmount } = render(<Home />);

      // User sees they need premium to continue
      expect(screen.getByText('Unlock full Vaedros storyline')).toBeTruthy();

      unmount();
    });
  });
});
