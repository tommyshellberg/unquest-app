const mockBottomSheet = require('@gorhom/bottom-sheet/mock');

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

module.exports = {
  ...mockBottomSheet,
  SCROLLABLE_TYPE,
  createBottomSheetScrollableComponent,
};
