import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';

import {
  requestNotificationPermissions,
  setupNotifications,
} from '@/lib/services/notifications';
import { useCharacterStore } from '@/store/character-store';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { useUserStore } from '@/store/user-store';

import AppIntroductionScreen from './app-introduction';

// Mock API URL for testing
process.env.API_URL = 'http://test-api.example.com';

// Mock notification service
jest.mock('@/lib/services/notifications', () => ({
  setupNotifications: jest.fn(),
  requestNotificationPermissions: jest.fn().mockResolvedValue(true),
}));

// Mock Expo Notifications to resolve immediately during tests
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

// Mock expo-router
jest.mock('expo-router');

// Mock character store
jest.mock('@/store/character-store');

// Mock user store
jest.mock('@/store/user-store');

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
    // Stub the store setter:
    useOnboardingStore.getState().setCurrentStep = jest.fn();
  });

  it('starts at welcome step', async () => {
    const { getByText } = render(<AppIntroductionScreen />);

    // Use waitFor to handle the async permission check
    await waitFor(() => {
      expect(getByText('Welcome to unQuest')).toBeTruthy();
      expect(
        getByText('Discover quests and embrace your journey.')
      ).toBeTruthy();
      expect(getByText('Got it')).toBeTruthy();
    });
  });

  it("moves to notifications step after pressing 'Got it'", async () => {
    const { getByText } = render(<AppIntroductionScreen />);

    // Wait for initial render to complete
    await waitFor(() => {
      expect(getByText('Got it')).toBeTruthy();
    });

    // Press "Got it" button
    fireEvent.press(getByText('Got it'));

    // Check that we've moved to the notifications step
    await waitFor(() => {
      expect(getByText('Notifications')).toBeTruthy();
      expect(getByText('Enable notifications')).toBeTruthy();
    });
  });

  it("requests notification permissions when 'Enable notifications' is pressed", async () => {
    const { getByText } = render(<AppIntroductionScreen />);

    // Wait for initial render to complete
    await waitFor(() => {
      expect(getByText('Got it')).toBeTruthy();
    });

    // Navigate to notifications step
    fireEvent.press(getByText('Got it'));

    // Wait for the next step to appear
    await waitFor(() => {
      expect(getByText('Enable notifications')).toBeTruthy();
    });

    // Press "Enable notifications" button
    fireEvent.press(getByText('Enable notifications'));

    // Check that permissions were requested
    await waitFor(() => {
      expect(requestNotificationPermissions).toHaveBeenCalled();
      expect(setupNotifications).toHaveBeenCalled();
    });
  });

  it('moves to next steps after requesting permissions', async () => {
    const { getByText } = render(<AppIntroductionScreen />);

    // Wait for initial render to complete
    await waitFor(() => {
      expect(getByText('Got it')).toBeTruthy();
    });

    // Navigate to notifications step
    fireEvent.press(getByText('Got it'));

    await waitFor(() => {
      expect(getByText('Enable notifications')).toBeTruthy();
    });

    // Press "Enable notifications" button
    fireEvent.press(getByText('Enable notifications'));

    // Check that we've moved to the next steps
    await waitFor(() => {
      expect(getByText('Your Character')).toBeTruthy();
      expect(getByText('Create character')).toBeTruthy();
    });
  });

  it("navigates to choose-character when 'Create character' is pressed", async () => {
    const { getByText } = render(<AppIntroductionScreen />);

    // Wait for initial render to complete
    await waitFor(() => {
      expect(getByText('Got it')).toBeTruthy();
    });

    // Navigate through the steps
    fireEvent.press(getByText('Got it'));

    await waitFor(() => {
      expect(getByText('Enable notifications')).toBeTruthy();
    });

    fireEvent.press(getByText('Enable notifications'));

    await waitFor(() => {
      expect(getByText('Create character')).toBeTruthy();
    });

    // Press "Create character" button
    fireEvent.press(getByText('Create character'));

    // Check that it navigates to choose-character
    expect(useOnboardingStore.getState().setCurrentStep).toHaveBeenCalledWith(
      OnboardingStep.NOTIFICATIONS_COMPLETED
    );
  });

  it('handles notification permission errors gracefully', async () => {
    // Mock a permission request error
    (requestNotificationPermissions as jest.Mock).mockRejectedValueOnce(
      new Error('Permission request failed')
    );

    const { getByText } = render(<AppIntroductionScreen />);

    // Wait for initial render to complete
    await waitFor(() => {
      expect(getByText('Got it')).toBeTruthy();
    });

    // Navigate to notifications step
    fireEvent.press(getByText('Got it'));

    await waitFor(() => {
      expect(getByText('Enable notifications')).toBeTruthy();
    });

    // Press "Enable notifications" button
    fireEvent.press(getByText('Enable notifications'));

    // Even with an error, the flow should continue to next steps
    await waitFor(() => {
      expect(setupNotifications).toHaveBeenCalled();
      expect(getByText('Your Character')).toBeTruthy();
    });
  });

  it('detects existing character data', async () => {
    // Mock existing character data
    (useCharacterStore as jest.Mock).mockImplementation((selector) =>
      selector({ character: { name: 'TestChar', type: 'wizard' } })
    );

    const { getByText } = render(<AppIntroductionScreen />);

    await waitFor(() => {
      expect(getByText('Welcome to unQuest')).toBeTruthy();
    });
  });

  it('detects existing user data', async () => {
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

    await waitFor(() => {
      expect(getByText('Welcome to unQuest')).toBeTruthy();
    });
  });
});
