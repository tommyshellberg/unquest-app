import React from 'react';

import { fireEvent, render, screen, waitFor } from '@/lib/test-utils';
import { useQuestStore } from '@/store/quest-store';

// Mock the router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
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

jest.mock('@/store/quest-store', () => ({
  useQuestStore: jest.fn(),
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
  });

  it('should render "Wake up" button when no story quests are completed', () => {
    // Setup the mock to return no completed quests
    (useQuestStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        activeQuest: null,
        pendingQuest: null,
        availableQuests: [mockFirstQuest],
        completedQuests: [],
        getCompletedQuests: () => [],
        prepareQuest: mockPrepareQuest,
        refreshAvailableQuests: jest.fn(),
      })
    );

    render(<Home />);

    // Check for "Wake up" button
    const wakeUpButton = screen.getByText('Wake up');
    expect(wakeUpButton).toBeTruthy();

    // Verify clicking the button calls prepareQuest
    fireEvent.press(wakeUpButton);
    expect(mockPrepareQuest).toHaveBeenCalledWith(mockFirstQuest);
  });

  it('should render two option buttons when last completed quest has two options', () => {
    // Setup the mock with a completed quest that has two options
    (useQuestStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        activeQuest: null,
        pendingQuest: null,
        availableQuests: [mockQuestWithSingleOption], // Next available quest
        completedQuests: [mockCompletedQuest],
        getCompletedQuests: () => [mockCompletedQuest],
        prepareQuest: mockPrepareQuest,
        refreshAvailableQuests: jest.fn(),
      })
    );

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
    // Setup the mock with a completed quest that has one option
    (useQuestStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        activeQuest: null,
        pendingQuest: null,
        availableQuests: [], // Just for this test
        completedQuests: [mockCompletedQuestSingleOption],
        getCompletedQuests: () => [mockCompletedQuestSingleOption],
        prepareQuest: mockPrepareQuest,
        refreshAvailableQuests: jest.fn(),
      })
    );

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

    (useQuestStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        activeQuest: activeQuest,
        pendingQuest: null,
        availableQuests: [],
        completedQuests: [],
        getCompletedQuests: () => [],
        prepareQuest: mockPrepareQuest,
        refreshAvailableQuests: jest.fn(),
      })
    );

    render(<Home />);

    // Check that no option buttons are rendered
    expect(() => screen.getByText('Wake up')).toThrow();
    expect(() => screen.getByText('Go left')).toThrow();
    expect(() => screen.getByText('Go right')).toThrow();
  });

  it('should show story options even when there is a pending quest', () => {
    // Setup the mock with a pending quest
    (useQuestStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        activeQuest: null,
        pendingQuest: mockFirstQuest,
        availableQuests: [],
        completedQuests: [],
        getCompletedQuests: () => [],
        prepareQuest: mockPrepareQuest,
        refreshAvailableQuests: jest.fn(),
      })
    );

    render(<Home />);

    // Based on the component implementation, options are still rendered when pendingQuest is set
    // The component only checks !activeQuest in the JSX rendering logic
    const wakeUpButton = screen.getByText('Wake up');
    expect(wakeUpButton).toBeTruthy();

    // Should still be able to click the button
    fireEvent.press(wakeUpButton);
    expect(mockPrepareQuest).toHaveBeenCalledWith(mockFirstQuest);
  });

  it('should call refreshAvailableQuests when there is no active or pending quest', async () => {
    const mockRefreshAvailableQuests = jest.fn();

    // Setup the mock with no active or pending quest
    (useQuestStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        activeQuest: null,
        pendingQuest: null,
        availableQuests: [mockFirstQuest],
        completedQuests: [],
        getCompletedQuests: () => [],
        prepareQuest: mockPrepareQuest,
        refreshAvailableQuests: mockRefreshAvailableQuests,
      })
    );

    render(<Home />);

    // Check that refreshAvailableQuests was called
    await waitFor(() => {
      expect(mockRefreshAvailableQuests).toHaveBeenCalledTimes(1);
    });
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
