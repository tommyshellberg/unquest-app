import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { scheduleDailyReminderNotification } from '@/lib/services/notifications';
import { useSettingsStore } from '@/store/settings-store';

import { DailyReminderModal } from './daily-reminder-modal';

// Mock dependencies
jest.mock('@/store/settings-store', () => ({
  useSettingsStore: jest.fn(),
}));

jest.mock('@/lib/services/notifications', () => ({
  scheduleDailyReminderNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('posthog-react-native', () => ({
  usePostHog: () => ({
    capture: jest.fn(),
  }),
}));

describe('DailyReminderModal', () => {
  // Mock setDailyReminder function
  const mockSetDailyReminder = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock settings store with a proper function
    useSettingsStore.mockImplementation((selector) => {
      // This mimics zustand's behavior - it calls the selector with the store state
      const store = {
        setDailyReminder: mockSetDailyReminder,
      };
      return selector(store);
    });
  });

  it('renders correctly with default options', () => {
    const defaultTime = new Date();
    const onClose = jest.fn();

    render(<DailyReminderModal defaultTime={defaultTime} onClose={onClose} />);

    expect(screen.getByText('Daily Reminder')).toBeTruthy();
    expect(
      screen.getByText('Want a daily nudge to start your next quest?')
    ).toBeTruthy();
    expect(screen.getByText('No thanks')).toBeTruthy();
  });

  it('handles "No thanks" option', async () => {
    const defaultTime = new Date();
    const onClose = jest.fn();

    render(<DailyReminderModal defaultTime={defaultTime} onClose={onClose} />);

    // Select "No thanks" and submit
    fireEvent.press(screen.getByText('No thanks'));
    fireEvent.press(screen.getByText('Confirm'));

    // Since handleSubmit is async, we need to wait for the promise to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockSetDailyReminder).toHaveBeenCalledWith({
      enabled: false,
      time: null,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('schedules reminder when "Yes, remind me" is selected', async () => {
    const defaultTime = new Date();
    const onClose = jest.fn();

    render(<DailyReminderModal defaultTime={defaultTime} onClose={onClose} />);

    // Select "Yes, remind me" and submit
    fireEvent.press(screen.getByText('Yes, remind me'));
    fireEvent.press(screen.getByText('Confirm'));

    // Since handleSubmit is async, we need to wait for the promise to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(scheduleDailyReminderNotification).toHaveBeenCalledWith(
      defaultTime.getHours(),
      defaultTime.getMinutes()
    );
    expect(mockSetDailyReminder).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
