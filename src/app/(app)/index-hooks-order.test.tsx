/**
 * Test to verify React Hooks are declared in the correct order
 * This test will fail/hang if hooks are declared after they're used in useEffect
 */
import React from 'react';
import { render } from '@/lib/test-utils';

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
  prepareQuest: jest.fn(),
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

// Mock quest store
const mockQuestStoreState: any = {
  activeQuest: null,
  pendingQuest: null,
  availableQuests: [],
  completedQuests: [],
  getCompletedQuests: () => [],
  prepareQuest: jest.fn(),
  refreshAvailableQuests: jest.fn(),
};

jest.mock('@/store/quest-store', () => ({
  useQuestStore: Object.assign(
    jest.fn((selector) => selector(mockQuestStoreState)),
    {
      getState: jest.fn(() => mockQuestStoreState),
    }
  ),
}));

// Mock AVAILABLE_QUESTS
jest.mock('@/app/data/quests', () => ({
  AVAILABLE_QUESTS: [],
}));

// Import Home component
const Home = require('./index').default;

describe('Home Component - Hooks Ordering', () => {
  // Set a reasonable timeout for this test
  jest.setTimeout(5000);

  it('should render without hanging due to hooks ordering issues', () => {
    // This test will hang/timeout if activeIndex is used before it's declared
    const { container } = render(<Home />);
    expect(container).toBeTruthy();
  });
});
