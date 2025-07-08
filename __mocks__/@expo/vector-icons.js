const React = require('react');
const { Text } = require('react-native');

// Mock icon component
const createMockIcon = (name) => {
  const Icon = React.forwardRef((props, ref) => {
    return React.createElement(
      Text,
      {
        ...props,
        ref,
        testID: `${name}-icon`,
      },
      props.name || ''
    );
  });
  Icon.displayName = name;
  return Icon;
};

// Export all icon sets
module.exports = {
  MaterialCommunityIcons: createMockIcon('MaterialCommunityIcons'),
  MaterialIcons: createMockIcon('MaterialIcons'),
  Ionicons: createMockIcon('Ionicons'),
  FontAwesome: createMockIcon('FontAwesome'),
  FontAwesome5: createMockIcon('FontAwesome5'),
  Feather: createMockIcon('Feather'),
  AntDesign: createMockIcon('AntDesign'),
  Entypo: createMockIcon('Entypo'),
  EvilIcons: createMockIcon('EvilIcons'),
  Foundation: createMockIcon('Foundation'),
  Octicons: createMockIcon('Octicons'),
  SimpleLineIcons: createMockIcon('SimpleLineIcons'),
  Zocial: createMockIcon('Zocial'),
  // Add the glyphMap for tests that might access it
  glyphMap: {},
};
