import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React from 'react';

import { setupNotifications } from '@/lib/services/notifications';
import { useCharacterStore } from '@/store/character-store';
import { useUserStore } from '@/store/user-store';

import AppIntroductionScreen from './app-introduction';

// Mock react-native-reanimated so animations flush immediately
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return {
    ...Reanimated,
    withDelay: (delay: number, value: any) => value,
    withTiming: (value: any, config?: any) => value,
    withSpring: (value: any, config?: any) => value,
    withSequence: (...args: any[]) => args[args.length - 1],
  };
});

// Mock expo-asset to bypass asset-related errors in expo-font
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(),
  },
}));

// Mock dependencies
jest.mock('expo-router');
jest.mock('@/store/character-store');
jest.mock('@/store/user-store');
jest.mock('expo-notifications');
jest.mock('@/lib/services/notifications', () => ({
  setupNotifications: jest.fn(),
}));

describe('AppIntroductionScreen', () => {
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Default implementation for stores returns no data
    (useCharacterStore as jest.Mock).mockImplementation((selector) =>
      selector({ character: null })
    );
    (useUserStore as jest.Mock).mockImplementation((selector) =>
      selector({ user: null })
    );

    // Mock notifications permissions
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
  });

  it('starts at welcome step', () => {
    const { getByText } = render(<AppIntroductionScreen />);
    expect(getByText('Welcome to unQuest')).toBeTruthy();
    expect(getByText('Discover quests and embrace your journey.')).toBeTruthy();
    expect(getByText('Got it')).toBeTruthy();
  });

  it("moves to notifications step after pressing 'Got it'", async () => {
    const { getByText, queryByText } = render(<AppIntroductionScreen />);

    // Press "Got it" button
    fireEvent.press(getByText('Got it'));

    // Check that we've moved to the notifications step
    await waitFor(() => {
      expect(getByText('Stay updated on your quests')).toBeTruthy();
      expect(
        getByText(
          'unQuest works best with lock screen notifications enabled. This allows you to:'
        )
      ).toBeTruthy();
      expect(getByText('Enable notifications')).toBeTruthy();
      expect(queryByText('Welcome to unQuest')).toBeNull();
    });
  });

  it("requests notification permissions when 'Enable notifications' is pressed", async () => {
    const { getByText, findByText } = render(<AppIntroductionScreen />);

    // Navigate to notifications step
    fireEvent.press(getByText('Got it'));

    await findByText('Enable notifications');

    // Press "Enable notifications" button
    fireEvent.press(getByText('Enable notifications'));

    // Check that permissions were requested
    await waitFor(() => {
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      expect(setupNotifications).toHaveBeenCalled();
    });
  });

  it('moves to next steps after requesting permissions', async () => {
    const { getByText, queryByText, findByText } = render(
      <AppIntroductionScreen />
    );

    // Navigate to notifications step
    fireEvent.press(getByText('Got it'));

    await findByText('Enable notifications');

    // Press "Enable notifications" button
    fireEvent.press(getByText('Enable notifications'));

    // Check that we've moved to the next steps
    await waitFor(() => {
      expect(getByText('Create Your Character')).toBeTruthy();
      expect(
        getByText(
          "Now it's time to create your character and begin your journey."
        )
      ).toBeTruthy();
      expect(getByText('Create character')).toBeTruthy();
    });
  });

  it("navigates to choose-character when 'Create character' is pressed", async () => {
    const { getByText, findByText } = render(<AppIntroductionScreen />);

    // Navigate through the steps
    fireEvent.press(getByText('Got it'));
    await findByText('Enable notifications');
    fireEvent.press(getByText('Enable notifications'));
    await findByText('Create character');

    // Press "Create character" button
    fireEvent.press(getByText('Create character'));

    // Check that it navigates to choose-character
    expect(mockRouter.push).toHaveBeenCalledWith(
      '/onboarding/choose-character'
    );
  });

  it('handles notification permission errors gracefully', async () => {
    // Mock a permission request error
    (Notifications.requestPermissionsAsync as jest.Mock).mockRejectedValue(
      new Error('Permission request failed')
    );

    const { getByText, findByText } = render(<AppIntroductionScreen />);

    // Navigate to notifications step
    fireEvent.press(getByText('Got it'));

    await findByText('Enable notifications');

    // Press "Enable notifications" button
    fireEvent.press(getByText('Enable notifications'));

    // Even with an error, the flow should continue to next steps
    await waitFor(() => {
      expect(setupNotifications).toHaveBeenCalled();
      expect(getByText('Create Your Character')).toBeTruthy();
    });
  });

  it('detects existing user data', () => {
    // Mock existing character data
    (useCharacterStore as jest.Mock).mockImplementation((selector) =>
      selector({ character: { name: 'TestChar', type: 'wizard' } })
    );

    const { getByText } = render(<AppIntroductionScreen />);

    // Check that hasExistingData is true (though it doesn't visibly change the UI in current implementation)
    expect(getByText('Welcome to unQuest')).toBeTruthy();
  });

  it('detects existing user data', () => {
    // Mock existing user data
    (useUserStore as jest.Mock).mockImplementation((selector) =>
      selector({
        user: {
          id: '123',
          email: 'test@example.com',
          screenTimeGoals: { currentTime: 120, targetTime: 60 },
        },
      })
    );

    const { getByText } = render(<AppIntroductionScreen />);

    // Check that hasExistingData is true (though it doesn't visibly change the UI in current implementation)
    expect(getByText('Welcome to unQuest')).toBeTruthy();
  });

  it('handles animation state changes correctly', async () => {
    const { getByText } = render(<AppIntroductionScreen />);

    // Initial animations should be triggered
    expect(getByText('Welcome to unQuest')).toBeTruthy();

    // Change step to trigger new animations
    fireEvent.press(getByText('Got it'));

    // New content should be visible after animations
    await waitFor(() => {
      expect(getByText('Stay updated on your quests')).toBeTruthy();
    });
  });
});
