// react-hook form setup for testing
// @ts-ignore
global.window = {};
// @ts-ignore
global.window = global;

// Mock OneSignal for LiveActivities
(global as any).OneSignal = {
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
    useSharedValue: (val: any) => ({ value: val }),
    useAnimatedStyle: () => ({}),
    withTiming: (val: any) => val,
    withDelay: (_: any, val: any) => val,
    withSpring: (val: any) => val,
    withSequence: (...args: any[]) => args[args.length - 1],
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



jest.mock('react-native-bg-actions', () => ({
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  isRunning: jest.fn().mockReturnValue(false),
  updateNotification: jest.fn().mockResolvedValue(undefined),
}));

// Mock API URL for testing
process.env.API_URL = 'http://test-api.example.com';

// react-hook form setup
(global as any).window = { ...global };

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

jest.mock('posthog-react-native', () => ({
  usePostHog: () => ({
    capture: jest.fn(),
  }),
}));

// Mock BlurView from expo-blur
jest.mock('expo-blur', () => ({
  BlurView: function MockBlurView(props: any) {
    return props.children;
  },
}));

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react');
  const RN = jest.requireActual('react-native');
  
  return {
    BottomSheetModal: jest.fn(({ children }) => children),
    BottomSheetModalProvider: jest.fn(({ children }) => children),
    BottomSheetBackdrop: jest.fn(() => null),
    BottomSheetScrollView: jest.fn(({ children }) => children),
    BottomSheetFlatList: jest.fn((props) => 
      React.createElement(RN.FlatList, props)
    ),
    createBottomSheetScrollableComponent: jest.fn(() => 
      jest.fn(({ children }) => children)
    ),
    SCROLLABLE_TYPE: {
      FLATLIST: 'FlatList',
      SCROLLVIEW: 'ScrollView',
      SECTIONLIST: 'SectionList',
      VIRTUALIZED_LIST: 'VirtualizedList',
    },
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn(({ children }) => children),
    SafeAreaConsumer: jest.fn(({ children }) => children(inset)),
    SafeAreaView: jest.fn(({ children }) => children),
    useSafeAreaInsets: jest.fn(() => inset),
  };
});

// Mock @shopify/flash-list
jest.mock('@shopify/flash-list', () => {
  const React = jest.requireActual('react');
  const RN = jest.requireActual('react-native');
  
  return {
    FlashList: jest.fn((props) => 
      React.createElement(RN.FlatList, props)
    ),
  };
});

// Mock react-native-keyboard-controller
jest.mock('react-native-keyboard-controller', () => {
  const React = jest.requireActual('react');
  const RN = jest.requireActual('react-native');
  
  return {
    KeyboardAwareScrollView: jest.fn((props) => 
      React.createElement(RN.ScrollView, props)
    ),
    KeyboardAvoidingView: jest.fn((props) => 
      React.createElement(RN.View, props)
    ),
    KeyboardProvider: jest.fn(({ children }) => children),
    useKeyboardController: jest.fn(() => ({
      setEnabled: jest.fn(),
      setInputMode: jest.fn(),
    })),
  };
});

// Note: Removed invasive global mocks that were breaking other tests
// Test-specific mocks should be added in individual test files as needed
