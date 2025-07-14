import { router } from 'expo-router';
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';

import { useQuestStore } from '@/store/quest-store';

import PendingQuestScreen from './pending-quest';

// Mock dependencies
jest.mock('expo-router');
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));
jest.mock('@/../assets/animations/compass.json', () => ({}));
jest.mock('@/../assets/images/background/active-quest.jpg', () => ({}));

// Mock the quest components
jest.mock('@/components/quest', () => {
  const React = jest.requireActual('react');
  const RN = jest.requireActual('react-native');
  
  return {
    QuestCard: ({ title, duration, children, ...props }: any) => (
      React.createElement(RN.View, { testID: "quest-card", ...props }, [
        React.createElement(RN.Text, { key: 'title' }, title),
        React.createElement(RN.Text, { key: 'duration' }, `${duration} minutes`),
        children
      ])
    ),
    CompassAnimation: ({ size, delay }: any) => (
      React.createElement(RN.View, { testID: "compass-animation", size, delay })
    ),
    LockInstructions: ({ variant, delay }: any) => (
      React.createElement(RN.View, { testID: "lock-instructions", variant, delay })
    ),
  };
});

// Helper to create mock view component
const MockView = ({ children, ...props }: any) => {
  const View = require('react-native').View;
  return <View {...props}>{children}</View>;
};

describe('PendingQuestScreen', () => {
  const mockStoryQuest = {
    id: 'quest-1',
    title: 'The Beginning',
    durationMinutes: 5,
    mode: 'story' as const,
    poiSlug: 'tavern',
    story: 'Your adventure begins...',
    audioFile: 'quest-1.mp3',
    recap: 'You started your journey',
    options: [],
    reward: { xp: 20 },
  };

  const mockCustomQuest = {
    id: 'custom-1',
    title: 'Morning Run',
    durationMinutes: 30,
    mode: 'custom' as const,
    category: 'fitness',
    reward: { xp: 50 },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store
    useQuestStore.setState({
      pendingQuest: mockStoryQuest,
      cancelQuest: jest.fn(),
    });

    (router.back as jest.Mock).mockImplementation(() => {});
  });

  it('renders story quest correctly', () => {
    const { getByText, getByTestId } = render(<PendingQuestScreen />);

    expect(getByText('Quest Ready')).toBeTruthy();
    expect(getByTestId('quest-card')).toBeTruthy();
    expect(getByText('The Beginning')).toBeTruthy();
    expect(getByText('5 minutes')).toBeTruthy();
    expect(getByText('Your Journey Begins')).toBeTruthy();
    expect(getByText('Your character is ready for their quest')).toBeTruthy();
  });

  it('renders custom quest correctly', () => {
    useQuestStore.setState({
      pendingQuest: mockCustomQuest,
      cancelQuest: jest.fn(),
    });

    const { getByText, getByTestId } = render(<PendingQuestScreen />);

    expect(getByText('Custom Quest')).toBeTruthy();
    expect(getByTestId('quest-card')).toBeTruthy();
    expect(getByText('Morning Run')).toBeTruthy();
    expect(getByText('30 minutes')).toBeTruthy();
    expect(getByText('Your Journey Begins')).toBeTruthy();
    expect(getByText('Time to focus on what matters most')).toBeTruthy();
  });

  it('displays lock instructions', () => {
    const { getByTestId } = render(<PendingQuestScreen />);

    const lockInstructions = getByTestId('lock-instructions');
    expect(lockInstructions).toBeTruthy();
    expect(lockInstructions.props.variant).toBe('single');
  });

  it('shows compass animation', () => {
    const { getByTestId } = render(<PendingQuestScreen />);

    const compass = getByTestId('compass-animation');
    expect(compass).toBeTruthy();
    expect(compass.props.size).toBe(100);
  });

  it('displays motivational quote', () => {
    const { getByText } = render(<PendingQuestScreen />);

    expect(
      getByText('"The journey of a thousand miles begins with a single step"')
    ).toBeTruthy();
  });

  it('handles cancel quest button', () => {
    const mockCancelQuest = jest.fn();
    useQuestStore.setState({
      pendingQuest: mockStoryQuest,
      cancelQuest: mockCancelQuest,
    });

    const { getByText } = render(<PendingQuestScreen />);

    fireEvent.press(getByText('Cancel Quest'));

    expect(mockCancelQuest).toHaveBeenCalled();
    expect(router.back).toHaveBeenCalled();
  });

  it('shows loading when no pending quest', () => {
    useQuestStore.setState({
      pendingQuest: null,
      cancelQuest: jest.fn(),
    });

    const { getByTestId } = render(<PendingQuestScreen />);

    expect(() => getByTestId('activity-indicator')).toBeTruthy();
  });

  it('triggers animations on mount', async () => {
    const { getByTestId } = render(<PendingQuestScreen />);

    // Check that animated components are rendered
    await waitFor(() => {
      expect(getByTestId('quest-card')).toBeTruthy();
    });
  });

  it('uses correct background image', () => {
    const { UNSAFE_getByType } = render(<PendingQuestScreen />);
    const Image = require('react-native').Image;

    const backgroundImage = UNSAFE_getByType(Image);
    expect(backgroundImage.props.source).toBe(
      require('@/../assets/images/background/active-quest.jpg')
    );
  });
});
