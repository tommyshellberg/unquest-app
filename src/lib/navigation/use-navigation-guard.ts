import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/lib';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';

/**
 * Centralised navigation guard.
 * Every layout that needs routing protection should simply call this hook.
 *
 * The priority order is:
 * 1. Welcome / onboarding flow (NOT_STARTED → INTRO → …)
 * 2. Pending quest, failed quest, recent completed quest flows
 * 3. Signup prompt after first-quest completion
 * 4. Auth-gated /(app) group
 */
export function useNavigationGuard(enabled: boolean = true) {
  const pathname = usePathname();

  // Auth state
  const authStatus = useAuth((s) => s.status);

  // Onboarding
  const onboarding = useOnboardingStore.getState();

  // Quest state (use getState to avoid extra renders)
  const questState = useQuestStore.getState();

  // Recent completed quest handling
  const recentCompletedQuest = questState.recentCompletedQuest;
  const isFirstQuestRecentlyCompleted = recentCompletedQuest?.id === 'quest-1';
  const isEarlyOnboardingForFirstQuest =
    onboarding.currentStep < OnboardingStep.FIRST_QUEST_COMPLETED;

  useEffect(() => {
    if (!enabled || authStatus === 'hydrating') return;

    const log = (...args: any[]) => console.log('[NavigationGuard]', ...args);
    log(
      'Path:',
      pathname,
      'Step:',
      onboarding.currentStep,
      'Auth:',
      authStatus,
      'RecentQ:',
      recentCompletedQuest?.id,
      'FailedQ:',
      questState.failedQuest?.id
    );

    // ===== 0. Welcome for brand-new installs =====
    if (
      onboarding.currentStep === OnboardingStep.NOT_STARTED &&
      !pathname.startsWith('/welcome') &&
      !pathname.startsWith('/login') // Allow navigating to login from welcome
    ) {
      log('Redirecting to /welcome');
      router.replace('/welcome');
      return;
    }

    // ===== Priority Redirects for Quest States (especially first quest during onboarding) =====

    // Handle recently completed first quest during early onboarding
    if (
      isFirstQuestRecentlyCompleted &&
      isEarlyOnboardingForFirstQuest && // Only if onboarding isn't past this stage
      !pathname.startsWith('/first-quest-result') &&
      !pathname.startsWith('/quest-completed-signup') // Avoid loop if already there
    ) {
      log('Redirecting to /first-quest-result (completed)');
      router.replace({
        pathname: '/first-quest-result',
        params: { outcome: 'completed' },
      });
      return;
    }

    // Handle failed first quest during early onboarding
    if (
      questState.failedQuest?.id === 'quest-1' &&
      isEarlyOnboardingForFirstQuest &&
      !pathname.startsWith('/first-quest-result')
    ) {
      log('Redirecting to /first-quest-result (failed)');
      router.replace({
        pathname: '/first-quest-result',
        params: { outcome: 'failed' },
      });
      return;
    }

    // ===== 1. Pending quest always wins (unless first quest outcome is pending) =====
    if (questState.pendingQuest && !pathname.startsWith('/pending-quest')) {
      // Check if we are already heading to first-quest-result, if so, let that resolve.
      if (pathname.startsWith('/first-quest-result')) return;
      log('Redirecting to /pending-quest');
      router.replace('/pending-quest');
      return;
    }

    // ===== 2. General Failed quest (not first quest during early onboarding) =====
    if (
      questState.failedQuest &&
      !(
        questState.failedQuest.id === 'quest-1' &&
        isEarlyOnboardingForFirstQuest
      ) && // Exclude already handled case
      !pathname.startsWith('/(app)/quest/') && // Check new path
      !pathname.startsWith('/first-quest-result') // Avoid conflict if somehow failedQuest is set while navigating here
    ) {
      log('Redirecting to /(app)/quest/[id] for failed quest');
      router.replace({
        pathname: '/(app)/quest/[id]',
        params: { id: questState.failedQuest.id },
      });
      return;
    }

    // ===== 3. Onboarding Step specific redirects =====
    // If FIRST_QUEST_COMPLETED step is reached, user should be on first-quest-result or quest-completed-signup.
    // The /first-quest-result screen itself handles setting this step.
    // This rule might be simplified or removed if first-quest-result handles the full transition.
    if (
      onboarding.currentStep === OnboardingStep.FIRST_QUEST_COMPLETED &&
      !pathname.startsWith('/first-quest-result') &&
      !pathname.startsWith('/quest-completed-signup')
    ) {
      log(
        'State is FIRST_QUEST_COMPLETED, ensuring user is on signup prompt or first-quest-result. Redirecting to /quest-completed-signup as next logical step.'
      );
      // It's more likely they should proceed to signup prompt if this step is set.
      router.replace('/quest-completed-signup');
      return;
    }

    if (
      onboarding.currentStep === OnboardingStep.SIGNUP_PROMPT_SHOWN &&
      !pathname.startsWith('/quest-completed-signup') &&
      !pathname.startsWith('/login') // Allow navigation to login from signup prompt
    ) {
      log(
        'Redirecting to /quest-completed-signup (step is SIGNUP_PROMPT_SHOWN)'
      );
      router.replace('/quest-completed-signup');
      return;
    }

    // ===== NEW RULE: Redirect to App if Signed In and Onboarding Complete =====
    const nonAppRoutes = [
      '/', // Root often redirects to welcome or onboarding initially
      '/welcome',
      '/login',
      '/onboarding',
      '/first-quest-result',
      '/quest-completed-signup',
    ];
    if (
      authStatus === 'signIn' &&
      onboarding.currentStep === OnboardingStep.COMPLETED &&
      nonAppRoutes.some((route) => pathname.startsWith(route)) && // Check if current path is one of the non-app routes
      !pathname.startsWith('/(app)') // And not already in /app
    ) {
      log(
        'User is signed in and onboarding is complete. Redirecting from non-app route to /(app).'
      );
      router.replace('/(app)');
      return;
    }

    // ===== 4. Main onboarding flow (pre-COMPLETED) =====
    // If onboarding is not COMPLETED and user tries to access (app) routes, send to /onboarding screen.
    // This rule should come after specific step checks like FIRST_QUEST_COMPLETED or SIGNUP_PROMPT_SHOWN
    // to allow those screens to be shown without being part of (app) group yet.
    if (
      onboarding.currentStep !== OnboardingStep.COMPLETED &&
      onboarding.currentStep !== OnboardingStep.FIRST_QUEST_COMPLETED &&
      onboarding.currentStep !== OnboardingStep.SIGNUP_PROMPT_SHOWN &&
      pathname.startsWith('/(app)')
    ) {
      log(
        'Redirecting to /onboarding from (app) route due to incomplete onboarding'
      );
      router.replace('/onboarding'); // General onboarding screen
      return;
    }

    // ===== 5. Auth-gated /(app) group =====
    if (pathname.startsWith('/(app)') && authStatus !== 'signIn') {
      log('Auth check failed for (app) route, redirecting to /login');
      router.replace('/login');
      return;
    }

    // ===== 6. Signup redirect once provisional acc removed / onboarding COMPLETED =====
    if (
      pathname.startsWith('/quest-completed-signup') &&
      onboarding.currentStep === OnboardingStep.COMPLETED
    ) {
      log(
        'Signup completed (onboarding is COMPLETED), redirecting from /quest-completed-signup to /(app)'
      );
      router.replace('/(app)');
    }
  }, [
    enabled,
    authStatus,
    onboarding.currentStep,
    pathname,
    questState.failedQuest,
    questState.pendingQuest,
    recentCompletedQuest,
    isFirstQuestRecentlyCompleted,
    isEarlyOnboardingForFirstQuest,
  ]);
}
