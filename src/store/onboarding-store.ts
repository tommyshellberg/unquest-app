import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getItem, removeItem, setItem } from '@/lib/storage';

export enum OnboardingStep {
  NOT_STARTED = 'not_started',
  SELECTING_CHARACTER = 'selecting_character',
  VIEWING_INTRO = 'viewing_intro',
  REQUESTING_NOTIFICATIONS = 'requesting_notifications',
  STARTING_FIRST_QUEST = 'starting_first_quest',
  VIEWING_SIGNUP_PROMPT = 'viewing_signup_prompt',
  COMPLETED = 'completed',
}

// Define step order for comparison
const stepOrder: Record<OnboardingStep, number> = {
  [OnboardingStep.NOT_STARTED]: 0,
  [OnboardingStep.SELECTING_CHARACTER]: 1,
  [OnboardingStep.VIEWING_INTRO]: 2,
  [OnboardingStep.REQUESTING_NOTIFICATIONS]: 3,
  [OnboardingStep.STARTING_FIRST_QUEST]: 4,
  [OnboardingStep.VIEWING_SIGNUP_PROMPT]: 5,
  [OnboardingStep.COMPLETED]: 6,
};

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

      // Step management with forward-only protection
      setCurrentStep: (step) => {
        const currentStep = get().currentStep;
        const currentOrder = stepOrder[currentStep];
        const newOrder = stepOrder[step];

        // Only allow forward movement or staying at the same step
        if (newOrder >= currentOrder) {
          console.log(`[Onboarding] Moving from ${currentStep} to ${step}`);
          set({ currentStep: step });
        } else {
          console.warn(
            `[Onboarding] Attempted backward movement from ${currentStep} to ${step} - blocked`
          );
        }
      },

      isOnboardingComplete: () => {
        // Only consider onboarding complete when COMPLETED step is reached
        return get().currentStep === OnboardingStep.COMPLETED;
      },

      hasCompletedFirstQuest: () => {
        const step = get().currentStep;
        const stepIndex = stepOrder[step];
        // First quest is completed from VIEWING_SIGNUP_PROMPT onwards (after completing the first quest)
        return stepIndex >= stepOrder[OnboardingStep.VIEWING_SIGNUP_PROMPT];
      },

      hasSeenSignupPrompt: () => {
        const step = get().currentStep;
        return (
          step === OnboardingStep.VIEWING_SIGNUP_PROMPT ||
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
