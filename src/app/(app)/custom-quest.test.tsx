/* eslint-disable max-lines-per-function */
import { fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';

import QuestTimer from '@/lib/services/quest-timer';
import {
  cleanup,
  render,
  screen,
  setup,
  waitFor,
  within,
} from '@/lib/test-utils';
import { useQuestStore } from '@/store/quest-store';

import CustomQuestScreen from './custom-quest';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/services/quest-timer', () => ({
  prepareQuest: jest.fn().mockResolvedValue(undefined),
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

// Mock zustand store
jest.mock('@/store/quest-store', () => ({
  useQuestStore: jest.fn(() => ({
    getState: jest.fn().mockReturnValue({
      prepareQuest: jest.fn(),
    }),
  })),
}));

describe('CustomQuestScreen', () => {
  // Properly type the mocked objects
  let mockedRouter: { back: jest.Mock; push: jest.Mock };
  let mockedPrepareQuest: jest.Mock;

  beforeEach(() => {
    mockedRouter = {
      back: jest.fn(),
      push: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockedRouter);

    // Reset the mocked function before each test
    mockedPrepareQuest = jest.fn();
    useQuestStore.getState = jest.fn().mockReturnValue({
      prepareQuest: mockedPrepareQuest,
    });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the custom quest screen correctly', () => {
    render(<CustomQuestScreen />);

    // Verify main components are rendered
    expect(screen.getByText('Custom Quest')).toBeOnTheScreen();
    expect(screen.getByText('I want to')).toBeOnTheScreen();
    expect(screen.getByText(/for \d+ minutes/)).toBeOnTheScreen();
  });

  it('Start Quest button is disabled when quest name is empty', async () => {
    render(<CustomQuestScreen />);

    // Use testID to find the button and check disabled state
    const startButton = screen.getByText('Start Quest');
    expect(startButton).toBeOnTheScreen();
    expect(startButton).toBeDisabled();
  });

  it('enables Start Quest button when quest name is entered', async () => {
    const { user } = setup(<CustomQuestScreen />);

    // Find the input field and enter text
    const input = screen.getByPlaceholderText('go for a run');
    await user.type(input, 'My test quest');

    // Button should be enabled
    const startButton = screen.getByText('Start Quest');
    expect(startButton).not.toBeDisabled();
  });

  it('updates duration display when slider value changes', async () => {
    render(<CustomQuestScreen />);

    // Get the slider
    const slider = screen.getByTestId('duration-slider');

    // Initial duration should be visible
    expect(screen.getByText(/for \d+ minutes/)).toBeOnTheScreen();

    // Change slider value - no need for act wrapper with fireEvent
    fireEvent(slider, 'valueChange', 60);
    fireEvent(slider, 'slidingComplete', 60);

    // Updated duration should be visible
    expect(screen.getByText('for 60 minutes')).toBeOnTheScreen();
  });

  it('updates end time when duration changes', async () => {
    render(<CustomQuestScreen />);

    // Get the slider
    const slider = screen.getByTestId('duration-slider');

    // Get initial end time label
    const initialTimeElement = screen.getByTestId('end-time');
    const initialText =
      within(initialTimeElement).getByText(/.*/).props.children;

    // Change slider value
    fireEvent(slider, 'valueChange', 60);
    fireEvent(slider, 'slidingComplete', 60);

    // Wait for the updated time element to be available
    await waitFor(() => {
      screen.getByTestId('end-time');
    });

    // After waiting, perform assertions outside waitFor
    const updatedTimeElement = screen.getByTestId('end-time');
    expect(updatedTimeElement).toBeOnTheScreen();

    const updatedText =
      within(updatedTimeElement).getByText(/.*/).props.children;
    expect(updatedText).not.toBe(initialText);
  });

  // Skip category test for now since it requires complex modal mocking
  it('can select different quest categories', async () => {
    const { user } = setup(<CustomQuestScreen />);

    // Find and press the category selector
    const categorySelector = screen.getByTestId('category-selector');
    await user.press(categorySelector);

    // Select a different category
    const socialCategory = screen.getByText('Social');
    await user.press(socialCategory);

    // Category should be updated
    expect(screen.getAllByText('Social').length).toBeGreaterThan(0);
  });

  it('calls prepareQuest when form is submitted with valid data', async () => {
    const { user } = setup(<CustomQuestScreen />);

    // Fill out the form
    const nameInput = screen.getByPlaceholderText('go for a run');
    await user.type(nameInput, 'Test Quest');

    // Set duration
    const slider = screen.getByTestId('duration-slider');
    fireEvent(slider, 'valueChange', 45);
    fireEvent(slider, 'slidingComplete', 45);

    // Submit the form
    const startButton = screen.getByText('Start Quest');
    await user.press(startButton);

    // Verify prepareQuest was called
    await waitFor(() => {
      expect(mockedPrepareQuest).toHaveBeenCalledTimes(1);
    });

    // Separately check the arguments
    expect(mockedPrepareQuest).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Quest',
        durationMinutes: 45,
        category: expect.any(String),
      })
    );

    // Verify QuestTimer.prepareQuest was called
    expect(QuestTimer.prepareQuest).toHaveBeenCalledTimes(1);
  });
});
