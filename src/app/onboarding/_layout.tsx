import { Redirect, Slot, usePathname } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import React from 'react';

import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';

export default function OnboardingLayout() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const isComplete = useOnboardingStore((s) => s.isOnboardingComplete());
  const path = usePathname();
  const completedQuests = useQuestStore((s) => s.completedQuests);
  const posthog = usePostHog();

  // Get quest states for onboarding-level redirects
  const failedQuest = useQuestStore((s) => s.failedQuest);
  const recentCompletedQuest = useQuestStore((s) => s.recentCompletedQuest);

  // Map each step to the matching route
  const stepToRoute: Record<OnboardingStep, string> = {
    [OnboardingStep.NOT_STARTED]: '/onboarding/welcome',
    [OnboardingStep.INTRO_COMPLETED]: '/onboarding/app-introduction',
    [OnboardingStep.NOTIFICATIONS_COMPLETED]: '/onboarding/choose-character',
    [OnboardingStep.CHARACTER_SELECTED]: '/onboarding/first-quest',
    [OnboardingStep.FIRST_QUEST_COMPLETED]: '/quest/quest-1',
    [OnboardingStep.SIGNUP_PROMPT_SHOWN]: '/quest-completed-signup',
    [OnboardingStep.COMPLETED]: '/(app)',
  };

  console.log('ONBOARDING LAYOUT - current step:', currentStep, 'path:', path);

  // Onboarding-level quest redirects (during onboarding flow)

  // Redirect to failed quest result if one exists and we're not already at first-quest-result
  if (failedQuest && !path.startsWith('/first-quest-result')) {
    console.log(
      '[OnboardingLayout] Redirecting to failed quest result',
      failedQuest.id
    );
    return <Redirect href="/first-quest-result?outcome=failed" />;
  }

  // Redirect to completed quest result if one exists and we're not already at first-quest-result
  if (recentCompletedQuest && !path.startsWith('/first-quest-result')) {
    console.log(
      '[OnboardingLayout] Redirecting to completed quest result',
      recentCompletedQuest.id
    );
    return <Redirect href="/first-quest-result?outcome=completed" />;
  }

  // If we're on the signup screen and that's the current step, don't redirect
  if (
    path === '/quest-completed-signup' &&
    currentStep === OnboardingStep.SIGNUP_PROMPT_SHOWN
  ) {
    return <Slot />;
  }

  // Backward compatibility: if they've completed a quest already before introducing onboarding steps, redirect to the app
  if (
    currentStep === OnboardingStep.CHARACTER_SELECTED &&
    completedQuests.length > 0 &&
    !path.startsWith('/(app)')
  ) {
    console.log(
      'REDIRECTING TO APP, ONBOARDING SKIPPED BECAUSE WE COMPLETED A QUEST '
    );
    posthog.capture('onboarding_skipped_redirect_to_app');
    return <Redirect href="/(app)" />;
  }

  // 1) If they've finished onboarding, immediately redirect to the app root
  if (isComplete && !path.startsWith('/(app)')) {
    console.log('REDIRECTING TO APP, ONBOARDING COMPLETED');
    posthog.capture('onboarding_finished_redirect_to_app');
    return <Redirect href="/(app)" />;
  }

  // 2) Otherwise if they're on the "wrong" onboarding page for their step, redirect them
  const target = stepToRoute[currentStep];
  if (
    path !== target &&
    // Special case: if NOT_STARTED and on base /onboarding, that's ok
    !(currentStep === OnboardingStep.NOT_STARTED && path === '/onboarding')
  ) {
    posthog.capture('onboarding_redirect_to_correct_target');
    return <Redirect href={target as any} />;
  }

  // 3) Otherwise render the current onboarding screen:
  return <Slot />;
}
