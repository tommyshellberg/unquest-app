import { Redirect, Slot, usePathname } from 'expo-router';
import React from 'react';

import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';

export default function OnboardingLayout() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const isComplete = useOnboardingStore((s) => s.isOnboardingComplete());
  const path = usePathname();

  // If onboarding is complete, redirect to root for re-evaluation
  if (isComplete) {
    return <Redirect href="/" />;
  }

  // Handle onboarding step navigation only
  const stepToRoute: Record<OnboardingStep, string> = {
    [OnboardingStep.NOT_STARTED]: '/onboarding/welcome',
    [OnboardingStep.INTRO_COMPLETED]: '/onboarding/app-introduction',
    [OnboardingStep.NOTIFICATIONS_COMPLETED]: '/onboarding/choose-character',
    [OnboardingStep.CHARACTER_SELECTED]: '/onboarding/first-quest',
    [OnboardingStep.FIRST_QUEST_COMPLETED]: '/', // Let root handle
    [OnboardingStep.SIGNUP_PROMPT_SHOWN]: '/quest-completed-signup',
    [OnboardingStep.COMPLETED]: '/',
  };

  const target = stepToRoute[currentStep];
  if (path !== target && currentStep !== OnboardingStep.NOT_STARTED) {
    return <Redirect href={target} />;
  }

  return <Slot />;
}
