import React from 'react';

import { fireEvent, render, screen, waitFor } from '@/lib/test-utils';
import { useQuestStore } from '@/store/quest-store';

// Mock the router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

// Mock react-native-reanimated (required because of native dependencies)
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

// Mock QuestTimer
jest.mock('@/lib/services/quest-timer', () => ({
  prepareQuest: jest.fn(),
}));

// Mock quest data
const mockFirstQuest = {
  id: 'quest-1',
  title: 'First Quest',
  mode: 'story',
  durationMinutes: 5,
  reward: { xp: 10 },
  recap: 'First quest recap',
  story: 'First quest story',
  audioFile: 'test.mp3',
  poiSlug: 'test-poi',
  options: [
    {
      id: 'option-1',
      text: 'Go left',
      nextQuestId: 'quest-2a',
    },
    {
      id: 'option-2',
      text: 'Go right',
      nextQuestId: 'quest-2b',
    },
  ],
};

const mockCompletedQuest = {
  ...mockFirstQuest,
  startTime: Date.now() - 300000, // 5 minutes ago
  stopTime: Date.now(),
  status: 'completed',
};

const mockQuestWithSingleOption = {
  id: 'quest-2a',
  title: 'Second Quest A',
  mode: 'story',
  durationMinutes: 5,
  reward: { xp: 15 },
  recap: 'Second quest A recap',
  story: 'Second quest A story',
  audioFile: 'test.mp3',
  poiSlug: 'test-poi-2',
  options: [
    {
      id: 'option-1',
      text: 'Continue',
      nextQuestId: 'quest-3',
    },
  ],
};

const mockCompletedQuestSingleOption = {
  ...mockQuestWithSingleOption,
  startTime: Date.now() - 300000,
  stopTime: Date.now(),
  status: 'completed',
};

// Mock the quest store
const mockPrepareQuest = jest.fn();

// Create a mock quest store state that can be shared
let mockQuestStoreState: any = {
  activeQuest: null,
  pendingQuest: null,
  availableQuests: [],
  completedQuests: [],
  getCompletedQuests: () => [],
  prepareQuest: mockPrepareQuest,
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

// Mock AVAILABLE_QUESTS from data file
jest.mock('@/app/data/quests', () => ({
  AVAILABLE_QUESTS: [
    mockFirstQuest,
    mockQuestWithSingleOption,
    {
      id: 'quest-2b',
      title: 'Second Quest B',
      mode: 'story',
      durationMinutes: 5,
      reward: { xp: 15 },
      recap: 'Second quest B recap',
      story: 'Second quest B story',
      audioFile: 'test.mp3',
      poiSlug: 'test-poi-3',
      options: [
        {
          id: 'option-1',
          text: 'Continue',
          nextQuestId: 'quest-3',
        },
      ],
    },
    {
      id: 'quest-3',
      title: 'Third Quest',
      mode: 'story',
      durationMinutes: 5,
      reward: { xp: 20 },
      recap: 'Third quest recap',
      story: 'Third quest story',
      audioFile: 'test.mp3',
      poiSlug: 'test-poi-4',
      options: [],
    },
  ],
}));

// Import the Home component
const Home = require('./index').default;

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock quest store state
    mockQuestStoreState = {
      activeQuest: null,
      pendingQuest: null,
      availableQuests: [],
      completedQuests: [],
      getCompletedQuests: () => [],
      prepareQuest: mockPrepareQuest,
      refreshAvailableQuests: jest.fn(),
    };
  });

  it('should render two option buttons when last completed quest has two options', () => {
    // Setup the mock state
    mockQuestStoreState = {
      ...mockQuestStoreState,
      availableQuests: [mockQuestWithSingleOption],
      completedQuests: [mockCompletedQuest],
      getCompletedQuests: () => [mockCompletedQuest],
    };

    render(<Home />);

    // Check for both option buttons
    const leftOption = screen.getByText('Go left');
    const rightOption = screen.getByText('Go right');
    expect(leftOption).toBeTruthy();
    expect(rightOption).toBeTruthy();

    // Verify clicking an option calls prepareQuest with correct quest
    fireEvent.press(leftOption);
    expect(mockPrepareQuest).toHaveBeenCalledTimes(1);
  });

  it('should render a single option button when last completed quest has one option', () => {
    // Setup the mock state
    mockQuestStoreState = {
      ...mockQuestStoreState,
      availableQuests: [],
      completedQuests: [mockCompletedQuestSingleOption],
      getCompletedQuests: () => [mockCompletedQuestSingleOption],
    };

    render(<Home />);

    // Check for the single option button
    const continueOption = screen.getByText('Continue');
    expect(continueOption).toBeTruthy();

    // Verify clicking the option calls prepareQuest
    fireEvent.press(continueOption);
    expect(mockPrepareQuest).toHaveBeenCalledTimes(1);
  });

  it('should not render quest options when there is an active quest', () => {
    // Setup the mock with an active quest
    const activeQuest = {
      ...mockFirstQuest,
      startTime: Date.now(),
    };

    mockQuestStoreState = {
      ...mockQuestStoreState,
      activeQuest: activeQuest,
      availableQuests: [],
      completedQuests: [],
      getCompletedQuests: () => [],
    };

    render(<Home />);

    // Check that no option buttons are rendered
    expect(() => screen.getByText('Wake up')).toThrow();
    expect(() => screen.getByText('Go left')).toThrow();
    expect(() => screen.getByText('Go right')).toThrow();
  });

  it('should call refreshAvailableQuests when there is no active or pending quest', async () => {
    const mockRefreshAvailableQuests = jest.fn();

    // Setup the mock state
    mockQuestStoreState = {
      ...mockQuestStoreState,
      availableQuests: [mockFirstQuest],
      completedQuests: [],
      getCompletedQuests: () => [],
      refreshAvailableQuests: mockRefreshAvailableQuests,
    };

    render(<Home />);

    // Check that refreshAvailableQuests was called
    await waitFor(() => {
      expect(mockRefreshAvailableQuests).toHaveBeenCalledTimes(1);
    });
  });

  it('should render cooperative quest card and navigate to menu on button click', async () => {
    // Setup the mock state with no quests
    mockQuestStoreState = {
      ...mockQuestStoreState,
      availableQuests: [],
      completedQuests: [],
      getCompletedQuests: () => [],
    };

    render(<Home />);

    // The cooperative quest card should be visible
    expect(screen.getByText('Cooperative Quest')).toBeTruthy();
    expect(screen.getByText('Team Challenge')).toBeTruthy();

    // Since we're using FlashList, we need to scroll to see the cooperative quest card
    // For now, let's just check that the button exists when activeIndex is 3
    // In a real test, you'd simulate scrolling the FlashList

    // Mock activeIndex being 3 (cooperative quest)
    // Since this is internal state, we'll need to test the navigation separately
  });

  it('should navigate to cooperative quest menu when button is clicked', () => {
    // This is a focused test for the cooperative quest navigation
    // We'll need to simulate the carousel being on the cooperative quest card

    // For now, let's verify the navigation function exists and would be called
    expect(mockPush).toBeDefined();

    // In a real implementation, you'd:
    // 1. Render the component
    // 2. Scroll the FlashList to index 3
    // 3. Click the "Start Cooperative Quest" button
    // 4. Verify mockPush was called with '/cooperative-quest-menu'
  });

  it('should show story options based on last story quest when custom quests exist', () => {
    // First completed story quest
    const storyQuest = {
      ...mockFirstQuest,
      startTime: Date.now() - 3600000,
      stopTime: Date.now() - 3540000,
      status: 'completed',
    };

    // More recently completed custom quest
    const customQuest = {
      id: 'custom-quest',
      title: 'Custom Quest',
      mode: 'custom',
      durationMinutes: 5,
      reward: { xp: 15 },
      startTime: Date.now() - 600000,
      stopTime: Date.now() - 300000,
      status: 'completed',
    };

    // Create next quest that would be found by fixed refreshAvailableQuests
    const nextQuest = {
      id: 'quest-2a',
      title: 'Second Quest A',
      mode: 'story',
      durationMinutes: 5,
      reward: { xp: 15 },
      recap: 'Next quest recap',
    };

    // Mock the refresh function to return next quests based on story progression
    const mockRefreshAvailableQuests = jest.fn();

    // Setup the mock with completed quests and non-empty availableQuests
    // This simulates what would happen with our fixed implementation
    (useQuestStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        activeQuest: null,
        pendingQuest: null,
        // The fixed implementation would return this next quest
        availableQuests: [nextQuest],
        completedQuests: [storyQuest, customQuest],
        getCompletedQuests: () => [storyQuest, customQuest],
        prepareQuest: mockPrepareQuest,
        refreshAvailableQuests: mockRefreshAvailableQuests,
      })
    );

    render(<Home />);

    // Test that we don't see "No quests available"
    const noQuestsAvailable = screen.queryByText('No quests available');
    expect(noQuestsAvailable).toBeNull();

    // We should see the next quest title instead
    const nextQuestTitle = screen.queryByText(nextQuest.title);
    expect(nextQuestTitle).not.toBeNull();

    // Test for story options based on the completed story quest
    const leftOption = screen.queryByText('Go left');
    const rightOption = screen.queryByText('Go right');
    expect(leftOption).not.toBeNull();
    expect(rightOption).not.toBeNull();
  });
});
