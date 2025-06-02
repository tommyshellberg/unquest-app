// Import  global CSS file
import '../../global.css';

import { Env } from '@env';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { PostHogProvider } from 'posthog-react-native';
import React, { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { LogLevel, OneSignal } from 'react-native-onesignal';

import { APIProvider } from '@/api';
import { ReminderPromptController } from '@/components/ReminderPromptController';
import { SafeAreaView } from '@/components/ui';
import { hydrateAuth, loadSelectedTheme, useAuth } from '@/lib';
import useLockStateDetection from '@/lib/hooks/useLockStateDetection';
import { scheduleStreakWarningNotification } from '@/lib/services/notifications';
import { useThemeConfig } from '@/lib/use-theme-config';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';

import NavigationGate from './navigation-gate';

export { ErrorBoundary } from 'expo-router';

const integrations =
  Env.APP_ENV === 'production'
    ? [
        Sentry.mobileReplayIntegration({
          enableExperimentalViewRenderer: true,
          maskAllText: false,
          maskAllImages: false,
          maskAllVectors: false,
        }),
      ]
    : [];

Sentry.init({
  dsn: 'https://6d85dbe3783d343a049b93fa8afaf144@o4508966745997312.ingest.us.sentry.io/4508966747570176',
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  integrations: integrations,
});

// Keep the splash screen visible until we explicitly hide it
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

// Perform the hydration here so it happens as early as possible
const hydrationPromise = Promise.all([hydrateAuth(), loadSelectedTheme()]);

function RootLayout() {
  // Get auth status
  const authStatus = useAuth((state) => state.status);
  const [hydrationFinished, setHydrationFinished] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await hydrationPromise;
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        // Indicate that the initial async operations are done
        setHydrationFinished(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (Env.ONESIGNAL_APP_ID) {
      // Enable verbose logging for debugging (can be removed for production)
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);

      // Initialize OneSignal
      OneSignal.initialize(Env.ONESIGNAL_APP_ID);
      if (Platform.OS === 'ios') {
        OneSignal.LiveActivities.setupDefault();
      }
    }
  }, []);

  useEffect(() => {
    const checkAndScheduleStreakWarning = async () => {
      const lastCompletedQuestTimestamp =
        useQuestStore.getState().lastCompletedQuestTimestamp;
      const dailyQuestStreak = useCharacterStore.getState().dailyQuestStreak;

      if (dailyQuestStreak > 0) {
        // Check if user has completed a quest today
        const now = new Date();
        const lastCompletionDate = lastCompletedQuestTimestamp
          ? new Date(lastCompletedQuestTimestamp)
          : null;

        // If no quest completed today and there's an active streak, schedule warning
        if (
          !lastCompletionDate ||
          lastCompletionDate.getDate() !== now.getDate() ||
          lastCompletionDate.getMonth() !== now.getMonth() ||
          lastCompletionDate.getFullYear() !== now.getFullYear()
        ) {
          await scheduleStreakWarningNotification();
        }
      }
    };

    checkAndScheduleStreakWarning();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    // Check both flags: hydration promise resolved AND auth status is final
    if (hydrationFinished && authStatus !== 'hydrating') {
      await SplashScreen.hideAsync();
    }
  }, [hydrationFinished, authStatus]);

  // Activate lock detection for the whole main app.
  useLockStateDetection();

  // Return null until hydration promise is done AND auth status is final
  if (!hydrationFinished || authStatus === 'hydrating') {
    return null;
  }

  // Always render the Stack - let child layouts handle redirects
  return (
    <Providers onLayout={onLayoutRootView}>
      <NavigationGate />
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="pending-quest" options={{ headerShown: false }} />
        <Stack.Screen
          name="first-quest-result"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="quest-completed-signup"
          options={{ headerShown: false }}
        />
      </Stack>
    </Providers>
  );
}

function Providers({
  children,
  onLayout,
}: {
  children: React.ReactNode;
  onLayout?: () => void;
}) {
  const theme = useThemeConfig();
  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background">
      <GestureHandlerRootView
        className={theme.dark ? `dark flex-1` : undefined}
        onLayout={onLayout}
      >
        <KeyboardProvider>
          <ThemeProvider value={theme}>
            <PostHogProvider
              apiKey={Env.POSTHOG_API_KEY}
              options={{
                host: 'https://us.i.posthog.com',
              }}
            >
              <APIProvider>
                <BottomSheetModalProvider>
                  <ReminderPromptController />
                  {children}
                  <FlashMessage position="top" />
                </BottomSheetModalProvider>
              </APIProvider>
            </PostHogProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}
export default Sentry.wrap(RootLayout);
