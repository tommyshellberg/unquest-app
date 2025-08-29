import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { getItem } from '@/lib/storage';
import { useCharacterStore } from '@/store/character-store';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';

export type NavigationTarget =
  | { type: 'pending-quest'; questId: string }
  | { type: 'quest-result'; questId: string; outcome: 'completed' | 'failed' }
  | { type: 'first-quest-result'; outcome: 'completed' | 'failed' }
  | { type: 'quest-completed-signup' }
  | { type: 'streak-celebration' }
  | { type: 'onboarding' }
  | { type: 'login' }
  | { type: 'app' }
  | { type: 'loading' };

export function useNavigationTarget(): NavigationTarget {
  // Get auth, onboarding, and character state
  const authStatus = useAuth((state) => state.status);
  const isOnboardingComplete = useOnboardingStore((s) =>
    s.isOnboardingComplete()
  );
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const setCurrentStep = useOnboardingStore((s) => s.setCurrentStep);
  const character = useCharacterStore((s) => s.character);

  // Use direct subscription for quest state including completed quests
  const [questState, setQuestState] = useState(() => {
    const state = useQuestStore.getState();
    return {
      pendingQuest: state.pendingQuest,
      recentCompletedQuest: state.recentCompletedQuest,
      failedQuest: state.failedQuest,
      completedQuests: state.completedQuests,
      shouldShowStreakCelebration: state.shouldShowStreakCelebration,
    };
  });

  // Subscribe to quest store changes directly
  useEffect(() => {
    console.log(
      '🧭 Setting up quest store subscription at',
      new Date().toISOString()
    );

    const unsubscribe = useQuestStore.subscribe((state) => {
      console.log('🧭 Quest store changed at', new Date().toISOString(), {
        pendingQuest: state.pendingQuest?.id || null,
        recentCompletedQuest: state.recentCompletedQuest?.id || null,
        failedQuest: state.failedQuest?.id || null,
        completedQuestsCount: state.completedQuests.length,
        shouldShowStreakCelebration: state.shouldShowStreakCelebration,
      });
      setQuestState({
        pendingQuest: state.pendingQuest,
        recentCompletedQuest: state.recentCompletedQuest,
        failedQuest: state.failedQuest,
        completedQuests: state.completedQuests,
        shouldShowStreakCelebration: state.shouldShowStreakCelebration,
      });
    });

    return () => {
      console.log('🧭 Cleaning up quest store subscription');
      unsubscribe();
    };
  }, []);

  const {
    pendingQuest,
    recentCompletedQuest,
    failedQuest,
    completedQuests,
    shouldShowStreakCelebration,
  } = questState;

  // Synchronize onboarding state when user is signed in but onboarding appears incomplete
  useEffect(() => {
    if (authStatus === 'signIn' && !isOnboardingComplete) {
      // Check if user has provisional data (indicating they're a new user going through onboarding)
      const hasProvisionalData = !!(
        getItem('provisionalUserId') ||
        getItem('provisionalAccessToken') ||
        getItem('provisionalEmail')
      );

      if (!hasProvisionalData) {
        // User is signed in with no provisional data and no local data
        // This indicates they're a verified user logging in on a fresh install
        console.log(
          '🧭 Detected verified user with no local data - marking onboarding as complete'
        );
        console.log(
          '🧭 Synchronizing onboarding state to COMPLETED for verified user'
        );

        // Mark onboarding as complete for verified users
        setCurrentStep(OnboardingStep.COMPLETED);

        console.log(
          '🧭 Onboarding state synchronized successfully for verified user'
        );
      }
    }
  }, [
    authStatus,
    isOnboardingComplete,
    character,
    completedQuests,
    setCurrentStep,
  ]);

  // Debug current state
  useEffect(() => {
    console.log('🧭 Navigation target evaluation:', {
      authStatus,
      isOnboardingComplete,
      currentStep,
      completedQuestsCount: completedQuests?.length || 0,
      pendingQuest: pendingQuest?.id || null,
      recentCompletedQuest: recentCompletedQuest?.id || null,
      failedQuest: failedQuest?.id || null,
      shouldShowStreakCelebration,
    });
  }, [
    authStatus,
    isOnboardingComplete,
    character,
    currentStep,
    completedQuests,
    pendingQuest,
    recentCompletedQuest,
    failedQuest,
    shouldShowStreakCelebration,
  ]);

  // Still hydrating? Don't make routing decisions yet
  if (authStatus === 'hydrating') {
    console.log('🧭 Auth still hydrating');
    return { type: 'loading' };
  }

  // Priority 1: Streak celebration (highest priority to show before quest complete)
  if (shouldShowStreakCelebration) {
    console.log('🧭 Should show streak celebration');
    return { type: 'streak-celebration' };
  }

  // Priority 2: Active quest states
  if (pendingQuest) {
    console.log(
      '🧭 Found pending quest, should redirect to pending-quest:',
      pendingQuest.id
    );
    return { type: 'pending-quest', questId: pendingQuest.id };
  }

  if (failedQuest) {
    console.log('🧭 Found failed quest:', failedQuest.id);
    // Don't navigate to quest details if the quest ID is undefined
    if (!failedQuest.id || failedQuest.id === 'undefined') {
      console.log('🧭 Failed quest has undefined ID, skipping navigation');
      // Clear the failed quest to prevent this from happening again
      useQuestStore.getState().resetFailedQuest();
      return { type: 'app' };
    }

    // During onboarding (not authenticated), any failed quest should go to first-quest-result
    if (!isOnboardingComplete && authStatus === 'signOut') {
      console.log(
        '🧭 Quest failed during onboarding, showing first-quest-result'
      );
      return { type: 'first-quest-result', outcome: 'failed' };
    }

    return { type: 'quest-result', questId: failedQuest.id, outcome: 'failed' };
  }

  if (recentCompletedQuest) {
    console.log('🧭 Found completed quest:', recentCompletedQuest.id);
    // Don't navigate to quest details if the quest ID is undefined
    if (!recentCompletedQuest.id || recentCompletedQuest.id === 'undefined') {
      console.log('🧭 Completed quest has undefined ID, skipping navigation');
      // Clear the completed quest to prevent this from happening again
      useQuestStore.getState().clearRecentCompletedQuest();
      return { type: 'app' };
    }

    // During onboarding (not authenticated), any completed quest should go to first-quest-result
    if (!isOnboardingComplete && authStatus === 'signOut') {
      console.log(
        '🧭 Quest completed during onboarding, showing first-quest-result'
      );
      return { type: 'first-quest-result', outcome: 'completed' };
    }

    return {
      type: 'quest-result',
      questId: recentCompletedQuest.id,
      outcome: 'completed',
    };
  }

  // Priority 3: Onboarding
  if (!isOnboardingComplete) {
    console.log(
      '🧭 [NavigationStateResolver] Current onboarding step:',
      currentStep
    );
    console.log(
      '🧭 Onboarding not complete (or no character data for legacy users)'
    );

    // Special case: If we're at VIEWING_SIGNUP_PROMPT, it means the user completed quest-1
    // but hasn't signed up yet. They should see the signup prompt, not go back to onboarding.
    if (currentStep === OnboardingStep.VIEWING_SIGNUP_PROMPT) {
      console.log(
        '🧭 User completed first quest but not signed up, showing quest-completed-signup'
      );
      // Navigate directly to the signup prompt screen
      return { type: 'quest-completed-signup' };
    }

    return { type: 'onboarding' };
  }

  // Priority 4: Authentication
  if (authStatus === 'signOut') {
    console.log('🧭 User signed out');
    return { type: 'login' };
  }

  // Priority 5: Default to app
  console.log('🧭 Default to app');
  return { type: 'app' };
}
