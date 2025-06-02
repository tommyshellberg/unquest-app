import { Redirect } from 'expo-router';
import React from 'react';

import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';

export default function OnboardingIndex() {
  const currentStep = useOnboardingStore((s) => s.currentStep);

  // Map each step to the matching route
  const stepToRoute: Record<OnboardingStep, string> = {
    [OnboardingStep.NOT_STARTED]: '/onboarding/welcome',
    [OnboardingStep.INTRO_COMPLETED]: '/onboarding/app-introduction',
    [OnboardingStep.NOTIFICATIONS_COMPLETED]: '/onboarding/choose-character',
    [OnboardingStep.CHARACTER_SELECTED]: '/onboarding/first-quest',
    [OnboardingStep.FIRST_QUEST_COMPLETED]: '/onboarding/signup-prompt',
    [OnboardingStep.SIGNUP_PROMPT_SHOWN]: '/login',
    [OnboardingStep.COMPLETED]: '/(app)',
  };

  // Determine the correct path based on the current step
  const targetPath = stepToRoute[currentStep];

  // Redirect to the appropriate step - cast as any to handle type issues with Expo Router types
  return <Redirect href={targetPath as any} />;
}
