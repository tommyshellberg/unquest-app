// react-hook form setup for testing
// @ts-ignore
global.window = {};
// @ts-ignore
global.window = global;

// Mock OneSignal for LiveActivities
global.OneSignal = {
  LiveActivities: {
    startDefault: jest.fn(),
    exit: jest.fn(),
    setupDefault: jest.fn(),
    updateDefault: jest.fn(),
  },
};

// Mock React Native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.StatusBar = {
    setBarStyle: jest.fn(),
    setBackgroundColor: jest.fn(),
    setTranslucent: jest.fn(),
    setHidden: jest.fn(),
  };
  return RN;
});

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  // Return all animations immediately
  Reanimated.default.reduceMotion = true;
  return {
    ...Reanimated,
    default: {
      ...Reanimated.default,
      call: jest.fn(),
    },
    useSharedValue: (val) => ({ value: val }),
    useAnimatedStyle: () => ({}),
    withTiming: (val) => val,
    withDelay: (_, val) => val,
    withSpring: (val) => val,
    withSequence: (...args) => args[args.length - 1],
  };
});

// Mock expo-notifications to avoid warnings and errors
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  dismissAllNotificationsAsync: jest.fn(),
  getBadgeCountAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  LiveActivities: {
    setupDefault: jest.fn(),
    endDefault: jest.fn(),
    startDefault: jest.fn(),
    updateDefault: jest.fn(),
  },
}));

jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  FocusAwareStatusBar: function MockStatusBar() {
    return null;
  },
}));

// Mock API URL for testing
process.env.API_URL = 'http://test-api.example.com';

// react-hook form setup
global.window = { ...global };

// Mock OneSignal
jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    initialize: jest.fn(),
    Debug: {
      setLogLevel: jest.fn(),
    },
    LiveActivities: {
      setupDefault: jest.fn(),
      startDefault: jest.fn(),
      updateDefault: jest.fn(),
      endDefault: jest.fn(),
      exit: jest.fn(),
    },
  },
  LogLevel: {
    Verbose: 'VERBOSE',
  },
}));

// Mock @dev-plugins/react-query
jest.mock('@dev-plugins/react-query', () => ({
  useReactQueryDevTools: jest.fn(),
}));
