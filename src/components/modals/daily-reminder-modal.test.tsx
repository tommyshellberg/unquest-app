import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { useSettingsStore } from '@/store/settings-store';

import { DailyReminderModal } from './daily-reminder-modal';

// Mock dependencies
jest.mock('@/store/settings-store', () => ({
  useSettingsStore: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('posthog-react-native', () => ({
  usePostHog: () => ({
    capture: jest.fn(),
  }),
}));

describe('DailyReminderModal', () => {
  beforeEach(() => {
    // Mock settings store
    useSettingsStore.mockReturnValue({
      setDailyReminder: jest.fn(),
    });
  });

  it('renders correctly with default options', () => {
    const defaultTime = new Date();
    const onClose = jest.fn();

    const { getByText } = render(
      <DailyReminderModal defaultTime={defaultTime} onClose={onClose} />
    );

    expect(getByText('Daily Quest Reminder')).toBeTruthy();
    expect(
      getByText('Want a daily nudge to start your next quest?')
    ).toBeTruthy();
    expect(getByText('No thanks')).toBeTruthy();
  });

  it('handles "No thanks" option', () => {
    const defaultTime = new Date();
    const mockSetReminder = jest.fn();
    const onClose = jest.fn();

    useSettingsStore.mockReturnValue({
      setDailyReminder: mockSetReminder,
    });

    const { getByText } = render(
      <DailyReminderModal defaultTime={defaultTime} onClose={onClose} />
    );

    // Select "No thanks" and submit
    fireEvent.press(getByText('No thanks'));
    fireEvent.press(getByText('Confirm'));

    expect(mockSetReminder).toHaveBeenCalledWith({
      enabled: false,
      time: null,
    });
    expect(onClose).toHaveBeenCalled();
  });
});
