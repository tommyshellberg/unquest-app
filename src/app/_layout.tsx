// Import  global CSS file
import '../../global.css';

import { Env } from '@env';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { router, Stack, usePathname } from 'expo-router';
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
import { scheduleStreakWarningNotification } from '@/lib/services/notifications';
import { getItem } from '@/lib/storage';
import { useThemeConfig } from '@/lib/use-theme-config';
import { useCharacterStore } from '@/store/character-store';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';

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
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const pathname = usePathname();

  // Add both quest states
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const failedQuest = useQuestStore((state) => state.failedQuest);

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
    if (!hydrationFinished || authStatus === 'hydrating') return;

    // First, explicitly check onboarding completion
    const isOnboardingComplete = useOnboardingStore
      .getState()
      .isOnboardingComplete();
    const isOnboardingPath =
      pathname.includes('onboarding') || pathname.includes('welcome');

    // If onboarding isn't complete, always redirect to the correct onboarding step
    // regardless of auth status
    if (!isOnboardingComplete) {
      if (!isOnboardingPath && !pathname.includes('pending-quest')) {
        // Get the target step from the onboarding store
        console.log('Redirecting to onboarding - current step:', currentStep);
        router.replace('/onboarding');
        return;
      }
    }

    // Only after the onboarding check, look at auth and public paths
    const isPublicPath =
      pathname.includes('onboarding') ||
      pathname.includes('welcome') ||
      pathname.includes('pending-quest') ||
      pathname.includes('login');

    // If we're at the beginning of onboarding, direct to welcome screen
    if (
      currentStep === OnboardingStep.NOT_STARTED &&
      !pathname.includes('welcome')
    ) {
      router.replace('./welcome');
      return;
    }

    // Don't check auth for public paths
    if (isPublicPath) {
      return;
    }

    // Only check auth for app routes after confirming we need to be there
    if (authStatus !== 'signIn' && pathname.startsWith('/(app)')) {
      console.log('Auth check failed, redirecting to login');
      router.replace('/login');
    }
  }, [currentStep, pathname, hydrationFinished, authStatus]);

  useEffect(() => {
    // Skip until hydration is complete
    if (!hydrationFinished || authStatus === 'hydrating') return;

    if (pendingQuest) {
      // Check if we're already on the pending-quest screen
      if (pathname.includes('pending-quest')) {
        return;
      }

      // Redirect to the root pending-quest screen, not the protected one
      router.replace('/pending-quest');
    }
  }, [pendingQuest, hydrationFinished, authStatus, pathname]);

  // Add this effect to handle redirects to the individual quest screen for failed quests
  useEffect(() => {
    // Skip until hydration is complete
    if (!hydrationFinished || authStatus === 'hydrating') return;

    if (failedQuest) {
      // Don't redirect if we're already on a quest screen
      if (pathname.includes('/quest/')) {
        return;
      }

      requestAnimationFrame(() => {
        try {
          // Route to the quest details page with the ID of the failed quest
          router.replace({
            pathname: '/quest/[id]',
            params: { id: failedQuest.id },
          });
        } catch (error) {
          console.error('Failed quest navigation failed, will retry', error);
          setTimeout(() => {
            if (hydrationFinished && authStatus !== 'idle') {
              router.replace({
                pathname: '/quest/[id]',
                params: { id: failedQuest.id },
              });
            }
          }, 500);
        }
      });
    }
  }, [failedQuest, hydrationFinished, authStatus, pathname]);

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

  // Add this effect to handle the post-quest signup flow
  useEffect(() => {
    if (!hydrationFinished || authStatus === 'hydrating') return;

    console.log('provisional access token', getItem('provisionalAccessToken'));
    console.log('provisional user id', getItem('provisionalUserId'));

    // Get the data we need to make decisions
    const hasProvisionalToken = !!getItem('provisionalAccessToken');
    const hasProvisionalUserId = !!getItem('provisionalUserId');
    const completedQuests = useQuestStore.getState().completedQuests;
    const hasCompletedQuests = completedQuests.length > 0;
    const isOnboardingComplete = useOnboardingStore
      .getState()
      .isOnboardingComplete();

    console.log('checking for signup redirect');
    console.log('hasProvisionalToken', hasProvisionalToken);
    console.log('hasProvisionalUserId', hasProvisionalUserId);
    console.log('hasCompletedQuests', hasCompletedQuests);
    console.log('authStatus', authStatus);
    console.log('isOnboardingComplete', isOnboardingComplete);
    console.log('pathname', pathname);

    // If user:
    // 1. Has a provisional account (token or ID exists)
    // 2. Has completed at least one quest
    // 3. Is not authenticated with a full account
    // 4. Has completed onboarding
    // 5. Is not already on the signup screen
    if (
      (hasProvisionalToken || hasProvisionalUserId) &&
      hasCompletedQuests &&
      authStatus !== 'signIn' &&
      isOnboardingComplete &&
      !pathname.includes('quest-completed-signup') &&
      !pathname.includes('login')
    ) {
      console.log('Redirecting to quest completed signup screen');
      router.replace('/quest-completed-signup');
      return;
    }
  }, [hydrationFinished, authStatus, pathname]);

  const onLayoutRootView = useCallback(async () => {
    // Check both flags: hydration promise resolved AND auth status is final
    if (hydrationFinished && authStatus !== 'hydrating') {
      await SplashScreen.hideAsync();
    }
  }, [hydrationFinished, authStatus]);

  // Return null until hydration promise is done AND auth status is final
  if (!hydrationFinished || authStatus === 'hydrating') {
    return null;
  }

  return (
    <Providers onLayout={onLayoutRootView}>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="pending-quest" options={{ headerShown: false }} />
        <Stack.Screen name="quest/[id]" options={{ headerShown: false }} />
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
