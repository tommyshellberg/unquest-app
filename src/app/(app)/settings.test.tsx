import { render, waitFor } from '@testing-library/react-native';

import Settings from './settings';

// Mock the navigation dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
  Link: 'Link',
}));

// Mock the animation hooks
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    useSharedValue: jest.fn(() => ({ value: 0 })),
    withTiming: jest.fn(() => 1),
    useAnimatedStyle: jest.fn(() => ({})),
  };
});

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock the auth hook
jest.mock('@/lib', () => ({
  useAuth: () => ({
    signOut: jest.fn(),
  }),
}));

// Mock all notification services to return simple promises
jest.mock('@/lib/services/notifications', () => ({
  areNotificationsEnabled: jest.fn().mockResolvedValue(true),
  cancelDailyReminderNotification: jest.fn().mockResolvedValue(true),
  cancelStreakWarningNotification: jest.fn().mockResolvedValue(true),
  requestNotificationPermissions: jest.fn().mockResolvedValue(true),
  scheduleDailyReminderNotification: jest.fn().mockResolvedValue(true),
  scheduleStreakWarningNotification: jest.fn().mockResolvedValue(true),
}));

// Mock user service
jest.mock('@/lib/services/user', () => ({
  getUserDetails: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
  deleteUserAccount: jest.fn(),
}));

// Mock the stores used in Settings
jest.mock('@/store/settings-store', () => ({
  useSettingsStore: jest.fn(() => ({
    dailyReminder: { enabled: false, time: null },
    streakWarning: { enabled: false, time: null },
    setDailyReminder: jest.fn(),
    setStreakWarning: jest.fn(),
  })),
}));

jest.mock('@/store/user-store', () => ({
  useUserStore: jest.fn(() => ({
    user: { email: 'test@example.com' },
    setUser: jest.fn(),
  })),
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Flame: 'Flame',
}));

// Mock the UI components
jest.mock('@/components/ui', () => ({
  FocusAwareStatusBar: 'FocusAwareStatusBar',
  ScrollView: 'ScrollView',
  Text: 'Text',
  View: 'View',
}));

// Mock expo-updates
let mockUpdateId = 'abc123def456789';
jest.mock('expo-updates', () => ({
  get updateId() {
    return mockUpdateId;
  },
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
  useUpdates: jest.fn(() => ({
    isUpdateAvailable: false,
    isUpdatePending: false,
  })),
}));

// Test that the component renders without errors
describe('Settings Screen', () => {
  beforeEach(() => {
    // Reset __DEV__ for each test
    global.__DEV__ = false;
    // Reset mockUpdateId to default value
    mockUpdateId = 'abc123def456789';
  });

  afterEach(() => {
    // Restore __DEV__
    global.__DEV__ = true;
  });

  it('renders without crashing', async () => {
    const { getByText } = render(<Settings />);
    await waitFor(() => {
      expect(getByText('Settings')).toBeTruthy();
    });
  });

  it('displays EAS Update version when available in production', async () => {
    const { getByText } = render(<Settings />);

    await waitFor(() => {
      // Should display the shortened update ID
      expect(getByText('Update: abc123d')).toBeTruthy();
    });
  });

  it('does not display EAS Update version in development', async () => {
    // Set __DEV__ to true for this test
    global.__DEV__ = true;

    const { queryByText } = render(<Settings />);

    await waitFor(() => {
      // Should not display update ID in dev mode
      expect(queryByText(/Update:/)).toBeNull();
    });
  });

  it('does not display EAS Update version when updateId is null', async () => {
    // Set updateId to null for this test
    mockUpdateId = null;

    const { queryByText } = render(<Settings />);

    await waitFor(() => {
      // Should not display update section when updateId is null
      expect(queryByText(/Update:/)).toBeNull();
    });
  });
});
