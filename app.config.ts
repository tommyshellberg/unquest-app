/* eslint-disable max-lines-per-function */
import 'dotenv/config';

import type { ConfigContext, ExpoConfig } from '@expo/config';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';

import { ClientEnv, Env } from './env';

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: Env.APP_ENV !== 'production',
  badges: [
    {
      text: Env.APP_ENV,
      type: 'banner',
      color: 'white',
    },
    {
      text: Env.VERSION.toString(),
      type: 'ribbon',
      color: 'white',
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: Env.NAME,
  description: `${Env.NAME} Mobile App`,
  owner: Env.EXPO_ACCOUNT_OWNER,
  scheme: Env.SCHEME,
  slug: 'unquest-app',
  version: Env.VERSION.toString(),
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  runtimeVersion: Env.VERSION.toString(),
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/30766cfb-793b-416b-ac27-d37f2e0dff9a',
    checkAutomatically: 'ON_LOAD',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: Env.BUNDLE_ID,
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      BGTaskSchedulerPermittedIdentifiers: ['$(PRODUCT_BUNDLE_IDENTIFIER)'],
    },
    buildNumber: Env.VERSION.split('.').pop() || '0',
  },
  experiments: {
    typedRoutes: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#051c25',
    },
    package: Env.PACKAGE,
    permissions: [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
      'android.permission.WAKE_LOCK',
    ],
    // use the last digit of semver
    versionCode: parseInt(Env.VERSION.split('.').pop() || '0'),
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#051c25',
        autoHide: false,
      },
    ],
    ['expo-secure-store'],
    [
      'expo-font',
      {
        fonts: ['./assets/fonts/Inter.ttf'],
      },
    ],
    [
      'expo-notifications',
      {
        color: '#051c25',
        enableBackgroundRemoteNotifications: true,
      },
    ],
    'expo-localization',
    'expo-router',
    ['app-icon-badge', appIconBadgeConfig],
    ['react-native-edge-to-edge'],
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        project: 'react-native',
        organization: 'vaedros-software-llc',
      },
    ],
  ],
  extra: {
    ...ClientEnv,
    eas: {
      projectId: Env.EAS_PROJECT_ID,
    },
    maestroAccessToken: process.env.MAESTRO_ACCESS_TOKEN,
    maestroRefreshToken: process.env.MAESTRO_REFRESH_TOKEN,
  },
});
