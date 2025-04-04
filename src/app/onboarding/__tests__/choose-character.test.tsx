import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import ChooseCharacterScreen from "../choose-character";
import { updateUserCharacter } from '@/lib/services/user';
import { Dimensions } from 'react-native';

// Mock updateUserCharacter so we can simulate both success and failure.
jest.mock('@/lib/services/user', () => ({
  updateUserCharacter: jest.fn(),
}));

// Create a mock for useRouter so we can verify navigation.
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Provide a mock for useNavigation to avoid missing navigation object errors.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    setOptions: jest.fn(),
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

// Mock Animated components from react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const mockAnimated = {
    View: function MockAnimatedView(props) {
      return props.children;
    },
    createAnimatedComponent: (component) => component,
    useSharedValue: (initialValue) => ({ value: initialValue }),
    useAnimatedStyle: () => ({}),
    withTiming: (toValue) => toValue,
    withDelay: (delay, animation) => animation,
  };

  return {
    ...jest.requireActual('react-native-reanimated/mock'),
    ...mockAnimated,
    default: {
      ...jest.requireActual('react-native-reanimated/mock').default,
      ...mockAnimated,
    },
  };
});

// Add any other components that need to be mocked
jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  FocusAwareStatusBar: function MockStatusBar() {
    return null;
  },
}));

// Create a fake implementation for the character store.
// We now call the selector on our fake state so that useCharacterStore(selector)
// returns the value the component expects.
const mockCreateCharacter = jest.fn();
jest.mock('@/store/character-store', () => ({
  useCharacterStore: jest.fn((selector) =>
    selector({ createCharacter: mockCreateCharacter })
  ),
}));

// Get screen dimensions and define card dimensions
const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth * 0.75; // each card takes 75% of screen width
const snapInterval = cardWidth;

describe('ChooseCharacterScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
    mockCreateCharacter.mockClear();
    (updateUserCharacter as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should send a patch request with the correct data and navigate on a successful update', async () => {
    (updateUserCharacter as jest.Mock).mockResolvedValue({ success: true });

    const { getByPlaceholderText, getByText, UNSAFE_getAllByType } = render(
      <ChooseCharacterScreen />
    );

    // Simulate typing in the name input.
    const input = getByPlaceholderText('Enter character name');
    fireEvent.changeText(input, 'Arthur');

    // Flush debounce by advancing timers.
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Get the FlatList component and simulate swipe to knight (second character)
    const flatList = UNSAFE_getAllByType('RCTScrollView')[0];
    fireEvent(flatList, 'onMomentumScrollEnd', {
      nativeEvent: {
        contentOffset: {
          x: cardWidth, // This is the second card position (index 1)
        },
        contentSize: {
          width: cardWidth * 2,
          height: 400,
        },
        layoutMeasurement: {
          width: screenWidth,
          height: 400,
        },
      },
    });

    // Tap the Continue button.
    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      // Ensure updateUserCharacter was called with the expected character object.
      expect(updateUserCharacter).toHaveBeenCalledWith({
        level: 1,
        currentXP: 0,
        xpToNextLevel: 100,
        type: 'knight',
        name: 'Arthur',
      });
      // Verify the navigation call.
      expect(mockPush).toHaveBeenCalledWith('/onboarding/screen-time-goal');
      // Verify the local store was updated.
      expect(mockCreateCharacter).toHaveBeenCalledWith('knight', 'Arthur');
    });
  });

  it('should gracefully handle a failed API request and still navigate', async () => {
    (updateUserCharacter as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    const { getByPlaceholderText, getByText } = render(
      <ChooseCharacterScreen />
    );

    const input = getByPlaceholderText('Enter character name');
    fireEvent.changeText(input, 'Merlin');

    // Flush debounce.
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(updateUserCharacter).toHaveBeenCalledWith({
        level: 1,
        currentXP: 0,
        xpToNextLevel: 100,
        type: 'alchemist', // The default selected character, per the mock, is the first one.
        name: 'Merlin',
      });
      // Even on API error, we navigate to the next screen.
      expect(mockPush).toHaveBeenCalledWith('/onboarding/screen-time-goal');
      expect(mockCreateCharacter).toHaveBeenCalledWith('alchemist', 'Merlin');
    });
  });
});
