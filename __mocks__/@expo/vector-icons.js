const React = require('react');
const { Text } = require('react-native');

const createIconComponent = (name) => {
  const Icon = ({ children, ...props }) => React.createElement(Text, props, children || name);
  Icon.displayName = name;
  return Icon;
};

module.exports = {
  Ionicons: createIconComponent('Ionicons'),
  Feather: createIconComponent('Feather'),
  MaterialIcons: createIconComponent('MaterialIcons'),
  MaterialCommunityIcons: createIconComponent('MaterialCommunityIcons'),
  FontAwesome: createIconComponent('FontAwesome'),
  FontAwesome5: createIconComponent('FontAwesome5'),
  Entypo: createIconComponent('Entypo'),
  EvilIcons: createIconComponent('EvilIcons'),
  Foundation: createIconComponent('Foundation'),
  Octicons: createIconComponent('Octicons'),
  SimpleLineIcons: createIconComponent('SimpleLineIcons'),
  Zocial: createIconComponent('Zocial'),
  createIconSet: jest.fn(() => createIconComponent('Icon')),
};