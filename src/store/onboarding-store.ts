import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getItem, removeItem, setItem } from '@/lib/storage';

export enum OnboardingStep {
  NOT_STARTED = 'not_started',
  INTRO_COMPLETED = 'intro_completed',
  NOTIFICATIONS_COMPLETED = 'notifications_completed',
  CHARACTER_SELECTED = 'character_selected',
  FIRST_QUEST_COMPLETED = 'first_quest_completed',
  SIGNUP_PROMPT_SHOWN = 'signup_prompt_shown',
  COMPLETED = 'completed',
}

type OnboardingState = {
  // Step tracking
  currentStep: OnboardingStep;

  // Actions
  setCurrentStep: (step: OnboardingStep) => void;
  isOnboardingComplete: () => boolean;
  hasCompletedFirstQuest: () => boolean;
  hasSeenSignupPrompt: () => boolean;
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
      isOnboardingComplete: () => {
        // Only consider onboarding complete when COMPLETED step is reached
        return get().currentStep === OnboardingStep.COMPLETED;
      },

      hasCompletedFirstQuest: () => {
        const step = get().currentStep;
        return (
          step === OnboardingStep.FIRST_QUEST_COMPLETED ||
          step === OnboardingStep.SIGNUP_PROMPT_SHOWN ||
          step === OnboardingStep.COMPLETED
        );
      },

      hasSeenSignupPrompt: () => {
        const step = get().currentStep;
        return (
          step === OnboardingStep.SIGNUP_PROMPT_SHOWN ||
          step === OnboardingStep.COMPLETED
        );
      },

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
