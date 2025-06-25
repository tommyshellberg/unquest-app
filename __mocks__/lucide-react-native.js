const React = require('react');
const { Text } = require('react-native');

const createIconComponent = (name) => {
  const Icon = React.forwardRef(({ children, ...props }, ref) => 
    React.createElement(Text, { ...props, ref }, children || name)
  );
  Icon.displayName = name;
  return Icon;
};

// Export commonly used icons as components
const icons = [
  'Shield', 'TrendingUp', 'Users', 'AlertCircle', 'CheckCircle', 
  'Info', 'X', 'ChevronDown', 'ChevronUp', 'Search', 'Plus',
  'Minus', 'Check', 'Circle', 'Square', 'Clock', 'Trophy',
  'Crown', 'Flame', 'Target', 'Star', 'Heart', 'Home',
  'Map', 'Book', 'Settings', 'User', 'Bell', 'Menu',
  'ArrowLeft', 'ArrowRight', 'Download', 'Upload', 'Mail'
];

const exports = {};
icons.forEach(icon => {
  exports[icon] = createIconComponent(icon);
});

module.exports = exports;