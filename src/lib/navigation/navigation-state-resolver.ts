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
      shouldShowStreak: state.shouldShowStreak,
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
        shouldShowStreak: state.shouldShowStreak,
      });
      setQuestState({
        pendingQuest: state.pendingQuest,
        recentCompletedQuest: state.recentCompletedQuest,
        failedQuest: state.failedQuest,
        completedQuests: state.completedQuests,
        shouldShowStreak: state.shouldShowStreak,
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
    shouldShowStreak,
  } = questState;

  // Synchronize onboarding state when user is signed in but onboarding appears incomplete
  useEffect(() => {
    if (authStatus === 'signIn' && !isOnboardingComplete) {
      const hasCharacter = !!character;
      const hasCompletedQuests = completedQuests && completedQuests.length > 0;

      // Check if user has provisional data (indicating they're a new user going through onboarding)
      const hasProvisionalData = !!(
        getItem('provisionalUserId') ||
        getItem('provisionalAccessToken') ||
        getItem('provisionalEmail')
      );

      if (hasCharacter || hasCompletedQuests) {
        console.log(
          '🧭 Detected inconsistent onboarding state - user has completed onboarding but store shows incomplete'
        );
        console.log('🧭 Synchronizing onboarding state to COMPLETED');

        // Mark onboarding as complete
        setCurrentStep(OnboardingStep.COMPLETED);

        console.log('🧭 Onboarding state synchronized successfully');
      } else if (!hasProvisionalData) {
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
      shouldShowStreak,
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
    shouldShowStreak,
  ]);

  // Still hydrating? Don't make routing decisions yet
  if (authStatus === 'hydrating') {
    console.log('🧭 Auth still hydrating');
    return { type: 'loading' };
  }

  // Priority 1: Active quest states (highest priority)
  if (pendingQuest) {
    console.log(
      '🧭 Found pending quest, should redirect to pending-quest:',
      pendingQuest.id
    );
    return { type: 'pending-quest', questId: pendingQuest.id };
  }

  if (failedQuest) {
    console.log('🧭 Found failed quest:', failedQuest.id);
    if (failedQuest.id === 'quest-1' && !isOnboardingComplete) {
      return { type: 'first-quest-result', outcome: 'failed' };
    }
    return { type: 'quest-result', questId: failedQuest.id, outcome: 'failed' };
  }

  if (recentCompletedQuest) {
    console.log('🧭 Found completed quest:', recentCompletedQuest.id);
    if (recentCompletedQuest.id === 'quest-1' && !isOnboardingComplete) {
      return { type: 'first-quest-result', outcome: 'completed' };
    }
    return {
      type: 'quest-result',
      questId: recentCompletedQuest.id,
      outcome: 'completed',
    };
  }

  // Priority 2: Streak celebration
  if (shouldShowStreak) {
    console.log('🧭 Should show streak celebration');
    return { type: 'streak-celebration' };
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
