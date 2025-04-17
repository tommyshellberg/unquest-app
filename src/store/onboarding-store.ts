import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getItem, removeItem, setItem } from '@/lib/storage';

export enum OnboardingStep {
  NOT_STARTED = 'not_started',
  INTRO_COMPLETED = 'intro_completed',
  NOTIFICATIONS_COMPLETED = 'notifications_completed',
  CHARACTER_SELECTED = 'character_selected',
  GOALS_SET = 'goals_set',
  COMPLETED = 'completed',
}

type OnboardingState = {
  // Step tracking
  currentStep: OnboardingStep;

  // Actions
  setCurrentStep: (step: OnboardingStep) => void;
  isOnboardingComplete: () => boolean;
  resetOnboarding: () => void;
};

// Create type-safe functions for Zustand's storage
const getItemForStorage = (name: string) => {
  const value = getItem<string>(name);
  return value ?? null;
};

const setItemForStorage = async (name: string, value: string) => {
  setItem(name, value);
};

const removeItemForStorage = async (name: string) => {
  removeItem(name);
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial step state
      currentStep: OnboardingStep.NOT_STARTED,

      // Step management
      setCurrentStep: (step) => set({ currentStep: step }),
      isOnboardingComplete: () =>
        get().currentStep === OnboardingStep.COMPLETED,

      resetOnboarding: () =>
        set({
          currentStep: OnboardingStep.NOT_STARTED,
        }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => ({
        getItem: getItemForStorage,
        setItem: setItemForStorage,
        removeItem: removeItemForStorage,
      })),
    }
  )
);
