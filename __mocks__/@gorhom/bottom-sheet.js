/* eslint-env jest */
const React = require('react');
const { View } = require('react-native');

// Mock BottomSheet component
const BottomSheet = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

const BottomSheetModal = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

const BottomSheetModalProvider = ({ children }) => children;
const BottomSheetView = View;
const BottomSheetTextInput = View;
const BottomSheetScrollView = View;
const BottomSheetSectionList = View;
const BottomSheetFlatList = View;
const BottomSheetVirtualizedList = View;
const BottomSheetBackdrop = View;
const BottomSheetFooter = View;
const BottomSheetFooterContainer = View;
const BottomSheetHandle = View;

// Add missing SCROLLABLE_TYPE enum
const SCROLLABLE_TYPE = {
  SCROLLVIEW: 'ScrollView',
  FLATLIST: 'FlatList',
  SECTIONLIST: 'SectionList',
  VIRTUALIZEDLIST: 'VirtualizedList',
};

// Mock createBottomSheetScrollableComponent
const createBottomSheetScrollableComponent = jest.fn((type, component) => {
  return component;
});

// Mock hooks
const useBottomSheet = () => ({
  close: jest.fn(),
  collapse: jest.fn(),
  expand: jest.fn(),
  forceClose: jest.fn(),
  snapToIndex: jest.fn(),
  snapToPosition: jest.fn(),
});

const useBottomSheetModal = () => ({
  dismiss: jest.fn(),
  dismissAll: jest.fn(),
  present: jest.fn(),
});

const useBottomSheetSpringConfigs = () => ({
  damping: 500,
  stiffness: 1000,
  mass: 3,
  overshootClamping: true,
  restDisplacementThreshold: 10,
  restSpeedThreshold: 10,
});

const useBottomSheetTimingConfigs = () => ({
  duration: 250,
  easing: jest.fn(),
});

const useBottomSheetDynamicSnapPoints = () => ({
  animatedHandleHeight: { value: 0 },
  animatedSnapPoints: { value: [] },
  animatedContentHeight: { value: 0 },
  handleContentLayout: jest.fn(),
});

const useBottomSheetInternal = () => ({
  shouldHandleKeyboardEvents: { value: false },
});

module.exports = {
  default: BottomSheet,
  BottomSheet,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  BottomSheetTextInput,
  BottomSheetScrollView,
  BottomSheetSectionList,
  BottomSheetFlatList,
  BottomSheetVirtualizedList,
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetFooterContainer,
  BottomSheetHandle,
  SCROLLABLE_TYPE,
  createBottomSheetScrollableComponent,
  useBottomSheet,
  useBottomSheetModal,
  useBottomSheetSpringConfigs,
  useBottomSheetTimingConfigs,
  useBottomSheetDynamicSnapPoints,
  useBottomSheetInternal,
};
