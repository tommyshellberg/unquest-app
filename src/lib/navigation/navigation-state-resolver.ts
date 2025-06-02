import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useCharacterStore } from '@/store/character-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useQuestStore } from '@/store/quest-store';

export type NavigationTarget =
  | { type: 'pending-quest'; questId: string }
  | { type: 'quest-result'; questId: string; outcome: 'completed' | 'failed' }
  | { type: 'first-quest-result'; outcome: 'completed' | 'failed' }
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
  const character = useCharacterStore((s) => s.character);

  // Use direct subscription for quest state
  const [questState, setQuestState] = useState(() => {
    const state = useQuestStore.getState();
    return {
      pendingQuest: state.pendingQuest,
      recentCompletedQuest: state.recentCompletedQuest,
      failedQuest: state.failedQuest,
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
      });
      setQuestState({
        pendingQuest: state.pendingQuest,
        recentCompletedQuest: state.recentCompletedQuest,
        failedQuest: state.failedQuest,
      });
    });

    return () => {
      console.log('🧭 Cleaning up quest store subscription');
      unsubscribe();
    };
  }, []);

  const { pendingQuest, recentCompletedQuest, failedQuest } = questState;

  // Debug current state
  useEffect(() => {
    console.log('🧭 Navigation target evaluation:', {
      authStatus,
      isOnboardingComplete,
      currentStep,
      pendingQuest: pendingQuest?.id || null,
      recentCompletedQuest: recentCompletedQuest?.id || null,
      failedQuest: failedQuest?.id || null,
    });
  }, [
    authStatus,
    isOnboardingComplete,
    character,
    currentStep,
    pendingQuest,
    recentCompletedQuest,
    failedQuest,
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
    if (recentCompletedQuest.id === 'quest-1') {
      return { type: 'first-quest-result', outcome: 'completed' };
    }
    return {
      type: 'quest-result',
      questId: recentCompletedQuest.id,
      outcome: 'completed',
    };
  }

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

  // Priority 3: Authentication
  if (authStatus === 'signOut') {
    console.log('🧭 User signed out');
    return { type: 'login' };
  }

  // Priority 4: Default to app
  console.log('🧭 Default to app');
  return { type: 'app' };
}
