// Import  global CSS file
import '../../global.css';

import { Env } from '@env';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { router, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect } from 'react';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { LogLevel, OneSignal } from 'react-native-onesignal';

import { APIProvider } from '@/api';
import { SafeAreaView } from '@/components/ui';
import { hydrateAuth, loadSelectedTheme, useAuth } from '@/lib';
import { useThemeConfig } from '@/lib/use-theme-config';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';

export { ErrorBoundary } from 'expo-router';

// @todo: I don't think we use this at all.
export const unstable_settings = {
  initialRouteName: '(app)',
};

Sentry.init({
  dsn: 'https://6d85dbe3783d343a049b93fa8afaf144@o4508966745997312.ingest.us.sentry.io/4508966747570176',
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.mobileReplayIntegration({
      enableExperimentalViewRenderer: true,
      maskAllText: false,
      maskAllImages: false,
      maskAllVectors: false,
    }),
  ],
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
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const pathname = usePathname();

  // Add both quest states
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const failedQuest = useQuestStore((state) => state.failedQuest);

  useEffect(() => {
    async function prepare() {
      try {
        await hydrationPromise;
        console.log('Hydration promise resolved');
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
      if (__DEV__) {
        OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      }

      // Initialize OneSignal
      OneSignal.initialize(Env.ONESIGNAL_APP_ID);
      OneSignal.LiveActivities.setupDefault();
    }
  }, []);

  useEffect(() => {
    if (!hydrationFinished || authStatus === 'hydrating') return;
    if (
      currentStep === OnboardingStep.NOT_STARTED &&
      !pathname.includes('welcome')
    ) {
      console.log('redirecting to welcome');
      router.replace('./welcome');
    }
  }, [currentStep, pathname, hydrationFinished, authStatus]);

  useEffect(() => {
    // Skip until hydration is complete
    if (!hydrationFinished || authStatus === 'hydrating') return;

    if (pendingQuest) {
      // Check if we're already on the pending-quest screen
      if (pathname.includes('pending-quest')) {
        console.log('Already on pending-quest screen, skipping redirect');
        return;
      }

      console.log(
        'Detected pendingQuest at root layout, redirecting to pending-quest screen'
      );
      router.replace('/(app)/pending-quest');
    }
  }, [pendingQuest, hydrationFinished, authStatus, pathname]);

  // Add this effect to handle redirects to the failed-quest screen
  useEffect(() => {
    // Skip until hydration is complete
    if (!hydrationFinished || authStatus === 'hydrating') return;

    // Skip if we're already on the failed-quest screen
    if (pathname.includes('failed-quest')) {
      console.log('Already on failed-quest screen, skipping redirect');
      return;
    }

    if (failedQuest) {
      console.log(
        'Detected failedQuest at root layout, redirecting to failed-quest screen'
      );
      requestAnimationFrame(() => {
        try {
          router.replace('/failed-quest');
        } catch (error) {
          console.error('Failed quest navigation failed, will retry', error);
          setTimeout(() => {
            if (hydrationFinished && authStatus !== 'idle') {
              router.replace('/failed-quest');
            }
          }, 500);
        }
      });
    }
  }, [failedQuest, hydrationFinished, authStatus, pathname]);

  const onLayoutRootView = useCallback(async () => {
    // Check both flags: hydration promise resolved AND auth status is final
    if (hydrationFinished && authStatus !== 'hydrating') {
      await SplashScreen.hideAsync();
      console.log('Splash screen hidden (Layout Ready & Auth Status Final)');
    }
  }, [hydrationFinished, authStatus]);

  // Return null until hydration promise is done AND auth status is final
  if (!hydrationFinished || authStatus === 'hydrating') {
    return null;
  }

  console.log('RootLayout rendering, Final Auth Status:', authStatus);
  console.log('RootLayout rendering, Current Step:', currentStep);

  return (
    <Providers onLayout={onLayoutRootView}>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
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
            <APIProvider>
              <BottomSheetModalProvider>
                {children}
                <FlashMessage position="top" />
              </BottomSheetModalProvider>
            </APIProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

export default Sentry.wrap(RootLayout);
