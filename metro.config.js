const { withNativeWind } = require('nativewind/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

// Add test file patterns to exclude from the bundle
config.resolver.blacklistRE = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
  /.*\.test\.tsx?$/,
  /.*\.test\.jsx?$/,
  /.*\/__tests__\/.*/,
  /.*\/node_modules\/@testing-library\/.*/,
];

// Add .lottie file support for compressed Lottie animations
config.resolver.assetExts = [...config.resolver.assetExts, 'lottie'];

module.exports = withNativeWind(config, { input: './global.css' });
