import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ChooseCharacterScreen from '../choose-character';
import { createProvisionalUser } from '@/lib/services/user';
import { Dimensions } from 'react-native';
import { useOnboardingStore, OnboardingStep } from '@/store/onboarding-store';
import { useCharacterStore } from '@/store/character-store';

// Mock createProvisionalUser so we can simulate both success and failure.
jest.mock('@/lib/services/user', () => ({
  createProvisionalUser: jest.fn(),
}));

// Mock posthog
jest.mock('posthog-react-native', () => ({
  usePostHog: () => ({
    capture: jest.fn(),
  }),
}));

// Mock the characters data
jest.mock('@/app/data/characters', () => ({
  __esModule: true,
  default: [
    {
      id: 'alchemist',
      type: 'Alchemist',
      title: 'Master of Transformation',
      description:
        'Transforms idle time into powerful elixirs and mystical concoctions.',
      image: 'mock-image-path',
      profileImage: 'mock-profile-path',
    },
    {
      id: 'knight',
      type: 'Knight',
      title: 'Paragon of Discipline',
      description:
        'Builds strength and honor through dedication and restraint.',
      image: 'mock-image-path',
      profileImage: 'mock-profile-path',
    },
  ],
}));

// Mock character store
const mockCharacterStore = {
  character: null,
  createCharacter: jest.fn(),
  resetCharacter: jest.fn(),
};

jest.mock('@/store/character-store', () => ({
  useCharacterStore: jest.fn((selector) =>
    selector ? selector(mockCharacterStore) : mockCharacterStore
  ),
}));

// Add getState method to the mock for direct access
(useCharacterStore as any).getState = () => mockCharacterStore;

// Get screen dimensions and define card dimensions
const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth * 0.65; // 65% of screen width
const cardSpacing = 16;
const snapInterval = cardWidth + cardSpacing;

describe('ChooseCharacterScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Stub the store setter:
    useOnboardingStore.getState().setCurrentStep = jest.fn();
    (createProvisionalUser as jest.Mock).mockClear();
    mockCharacterStore.createCharacter.mockClear();
    mockCharacterStore.resetCharacter.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create provisional user with correct data and navigate on success', async () => {
    // Set up the mock to resolve successfully
    (createProvisionalUser as jest.Mock).mockResolvedValue({ success: true });

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <ChooseCharacterScreen />
    );

    // Step 1: Should start on intro and name input screen
    expect(getByText('Your Character')).toBeTruthy();
    expect(getByText('Your companion on this journey')).toBeTruthy();
    expect(getByText('Character Name')).toBeTruthy();

    // Enter character name
    const input = getByPlaceholderText('Enter character name');
    fireEvent.changeText(input, 'Arthur');

    // Flush debounce by advancing timers.
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Click Continue to go to character selection step
    fireEvent.press(getByText('Continue'));

    // Step 2: Should now be on character selection step
    expect(getByText("Choose Arthur's Character Type")).toBeTruthy();
    expect(getByText('Select the character that speaks to you')).toBeTruthy();

    // Get the FlatList component and simulate swipe to knight (second character)
    const flatList = getByTestId('character-carousel');
    fireEvent(flatList, 'onMomentumScrollEnd', {
      nativeEvent: {
        contentOffset: {
          x: snapInterval, // This is the second card position (index 1)
        },
      },
    });

    // Tap the Create Character button.
    const createButton = getByText('Create Character');

    // We need to handle promise resolution manually in tests
    await act(async () => {
      fireEvent.press(createButton);
      // Flush promises
      await Promise.resolve();
      // Advance any timers that may be used internally
      jest.runAllTimers();
    });

    // Now verify the expectations
    expect(createProvisionalUser).toHaveBeenCalledWith({
      type: 'knight',
      name: 'Arthur',
    });

    expect(mockCharacterStore.createCharacter).toHaveBeenCalledWith(
      'knight',
      'Arthur'
    );
    expect(useOnboardingStore.getState().setCurrentStep).toHaveBeenCalledWith(
      OnboardingStep.VIEWING_INTRO
    );
  });

  it('should handle PROVISIONAL_EMAIL_TAKEN error and still navigate', async () => {
    // Set up the mock to reject with the specific recoverable error
    (createProvisionalUser as jest.Mock).mockRejectedValue(
      new Error('PROVISIONAL_EMAIL_TAKEN')
    );

    const { getByPlaceholderText, getByText } = render(
      <ChooseCharacterScreen />
    );

    // Step 1: Enter name on intro screen
    const input = getByPlaceholderText('Enter character name');
    fireEvent.changeText(input, 'Merlin');

    // Flush debounce.
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Click Continue to go to character selection
    fireEvent.press(getByText('Continue'));

    // Step 2: Character selection (default is alchemist)
    const createButton = getByText('Create Character');

    // We need to handle promise rejection manually in tests
    await act(async () => {
      fireEvent.press(createButton);
      // Flush promises
      await Promise.resolve();
      // Advance any timers that may be used internally
      jest.runAllTimers();
    });

    // Verify the API was called
    expect(createProvisionalUser).toHaveBeenCalledWith({
      type: 'alchemist', // The default selected character
      name: 'Merlin',
    });

    // Should still create character locally and proceed
    expect(mockCharacterStore.createCharacter).toHaveBeenCalledWith(
      'alchemist',
      'Merlin'
    );
    expect(useOnboardingStore.getState().setCurrentStep).toHaveBeenCalledWith(
      OnboardingStep.VIEWING_INTRO
    );

    // Should not reset character store for this recoverable error
    expect(mockCharacterStore.resetCharacter).not.toHaveBeenCalled();
  });

  it('should handle general API failure and not navigate', async () => {
    // Set up the mock to reject with a general error
    (createProvisionalUser as jest.Mock).mockRejectedValue(
      new Error('network error')
    );

    const { getByPlaceholderText, getByText, queryByText } = render(
      <ChooseCharacterScreen />
    );

    // Step 1: Enter name
    const input = getByPlaceholderText('Enter character name');
    fireEvent.changeText(input, 'Gandalf');

    // Flush debounce.
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Click Continue to go to character selection
    fireEvent.press(getByText('Continue'));

    // Step 2: Try to create character
    const createButton = getByText('Create Character');

    // We need to handle promise rejection manually in tests
    await act(async () => {
      fireEvent.press(createButton);
      // Flush promises
      await Promise.resolve();
      // Advance any timers that may be used internally
      jest.runAllTimers();
    });

    // Verify the API was called
    expect(createProvisionalUser).toHaveBeenCalledWith({
      type: 'alchemist',
      name: 'Gandalf',
    });

    // Should create character locally first
    expect(mockCharacterStore.createCharacter).toHaveBeenCalledWith(
      'alchemist',
      'Gandalf'
    );

    // Should reset character store due to failure
    expect(mockCharacterStore.resetCharacter).toHaveBeenCalled();

    // Should NOT proceed to next step
    expect(useOnboardingStore.getState().setCurrentStep).not.toHaveBeenCalled();

    // Should show error message
    await waitFor(() => {
      expect(
        queryByText(
          /Network error. Please check your connection and try again./
        )
      ).toBeTruthy();
    });
  });

  it('should show loading state during creation', async () => {
    // Set up a promise that we can control
    let resolvePromise: ((value: any) => void) | undefined;
    const controlledPromise = new Promise<any>((resolve) => {
      resolvePromise = resolve;
    });
    (createProvisionalUser as jest.Mock).mockReturnValue(controlledPromise);

    const { getByPlaceholderText, getByText, queryByText } = render(
      <ChooseCharacterScreen />
    );

    // Step 1: Enter name
    const input = getByPlaceholderText('Enter character name');
    fireEvent.changeText(input, 'TestUser');

    // Flush debounce.
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Click Continue to go to character selection
    fireEvent.press(getByText('Continue'));

    // Step 2: Try to create character
    const createButton = getByText('Create Character');

    // Press the button but don't resolve the promise yet
    act(() => {
      fireEvent.press(createButton);
    });

    // Should show loading state with different button text
    expect(queryByText('Creating...')).toBeTruthy();
    expect(queryByText('Create Character')).toBeFalsy();

    // Resolve the promise
    await act(async () => {
      resolvePromise!({ success: true });
      await Promise.resolve();
    });

    // Should return to normal state (but actually it will navigate away after success)
    // The component should have processed the success and updated the onboarding state
    expect(useOnboardingStore.getState().setCurrentStep).toHaveBeenCalledWith(
      OnboardingStep.VIEWING_INTRO
    );
  });

  it('should not allow continuing without entering a name', () => {
    const { getByText, getByPlaceholderText } = render(
      <ChooseCharacterScreen />
    );

    // Step 1: Should start with Continue button disabled
    const continueButton = getByText('Continue');

    // Try to press without entering name - nothing should happen
    fireEvent.press(continueButton);

    // Should still be on the same screen
    expect(getByText('Your Character')).toBeTruthy();
    expect(getByText('Character Name')).toBeTruthy();

    // Now enter a name
    const input = getByPlaceholderText('Enter character name');
    fireEvent.changeText(input, 'A');

    // Flush debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now should be able to continue
    fireEvent.press(continueButton);

    // Should be on character selection screen
    expect(getByText("Choose A's Character Type")).toBeTruthy();
  });

  it('should filter out special characters from name input', () => {
    const { getByPlaceholderText } = render(<ChooseCharacterScreen />);

    const input = getByPlaceholderText('Enter character name');

    // Try to enter special characters
    fireEvent.changeText(input, 'Test@Name#123!');

    // Should only keep alphanumeric and spaces
    expect(input.props.value).toBe('TestName123');
  });
});
