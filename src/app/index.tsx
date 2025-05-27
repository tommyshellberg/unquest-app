import { Redirect } from 'expo-router';
import React from 'react';

import { useAuth } from '@/lib/auth';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';

export default function RootIndex() {
  // Quest states - HIGHEST PRIORITY
  const pendingQuest = useQuestStore((s) => s.pendingQuest);
  const recentCompletedQuest = useQuestStore((s) => s.recentCompletedQuest);
  const failedQuest = useQuestStore((s) => s.failedQuest);

  // Auth and onboarding states
  const authStatus = useAuth((state) => state.status);
  const isOnboardingComplete = useOnboardingStore((s) =>
    s.isOnboardingComplete()
  );
  const currentStep = useOnboardingStore((s) => s.currentStep);

  // PRIORITY 1: Quest-related redirects (highest priority to avoid auth conflicts)
  if (pendingQuest) {
    console.log('[RootIndex] Redirecting to pending-quest', pendingQuest.id);
    return <Redirect href="/pending-quest" />;
  }

  if (failedQuest) {
    console.log('[RootIndex] Redirecting to failed quest', failedQuest.id);
    if (failedQuest.id === 'quest-1' && !isOnboardingComplete) {
      return <Redirect href="/first-quest-result?outcome=failed" />;
    }
    return <Redirect href={`/(app)/quest/${failedQuest.id}`} />;
  }

  if (recentCompletedQuest) {
    console.log(
      '[RootIndex] Redirecting to completed quest',
      recentCompletedQuest.id
    );
    if (recentCompletedQuest.id === 'quest-1') {
      console.log('[RootIndex] Redirecting to first quest result');
      return <Redirect href="/first-quest-result?outcome=completed" />;
    }
    console.log(
      '[RootIndex] Redirecting to quest details',
      recentCompletedQuest.id
    );
    return <Redirect href={`/(app)/quest/${recentCompletedQuest.id}`} />;
  }

  // PRIORITY 2: Onboarding redirects
  if (!isOnboardingComplete && currentStep !== OnboardingStep.COMPLETED) {
    console.log('[RootIndex] Redirecting to onboarding - not completed');
    return <Redirect href="/onboarding" />;
  }

  // PRIORITY 3: Auth redirects
  if (authStatus === 'signOut') {
    console.log('[RootIndex] Redirecting to login - not authenticated');
    return <Redirect href="/login" />;
  }

  // PRIORITY 4: Default to main app
  console.log('[RootIndex] Redirecting to main app');
  return <Redirect href="/(app)" />;
}
