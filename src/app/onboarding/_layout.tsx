import { Redirect, Slot, usePathname } from 'expo-router';
import React from 'react';

import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';
export default function OnboardingLayout() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const isComplete = useOnboardingStore((s) => s.isOnboardingComplete());
  const path = usePathname();
  const completedQuests = useQuestStore((s) => s.completedQuests);
  // Map each step to the matching route
  const stepToRoute: Record<OnboardingStep, string> = {
    [OnboardingStep.NOT_STARTED]: '/onboarding',
    [OnboardingStep.INTRO_COMPLETED]: '/onboarding/app-introduction',
    [OnboardingStep.NOTIFICATIONS_COMPLETED]: '/onboarding/choose-character',
    [OnboardingStep.CHARACTER_SELECTED]: '/onboarding/screen-time-goal',
    [OnboardingStep.GOALS_SET]: '/onboarding/first-quest',
    [OnboardingStep.COMPLETED]: '/(app)',
  };

  console.log('completedQuests', completedQuests);
  console.log('currentStep', currentStep);
  console.log('path', path);

  // Backward compatibility: if they've completed a quest already before introducing onboarding steps, redirect to the app
  if (
    currentStep === OnboardingStep.GOALS_SET &&
    completedQuests.length > 0 &&
    !path.startsWith('/(app)')
  ) {
    return <Redirect href="/(app)" />;
  }

  // 1) If they've finished onboarding, immediately redirect to the app root
  if (isComplete && !path.startsWith('/(app)')) {
    return <Redirect href="/(app)" />;
  }

  // 2) Otherwise if they're on the "wrong" onboarding page for their step, redirect them
  const target = stepToRoute[currentStep];
  if (
    path !== target &&
    !(currentStep === OnboardingStep.NOT_STARTED && path === '/onboarding')
  ) {
    return <Redirect href={target as any} />;
  }

  // 3) Otherwise render the current onboarding screen:
  return <Slot />;
}
