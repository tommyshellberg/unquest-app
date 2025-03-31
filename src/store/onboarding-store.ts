import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getItem, removeItem, setItem } from '@/lib/storage';

type OnboardingState = {
  selectedCharacterId: string | null;
  currentScreenTime: number | null;
  goalScreenTime: number | null;
  // Actions
  setSelectedCharacter: (id: string) => void;
  setScreenTimes: (current: number, goal: number) => void;
  resetOnboarding: () => void;
};

// Create type-safe functions for Zustand's storage
const getItemForStorage = (name: string) => {
  const value = getItem<string>(name);
  return value ?? null;
};

const setItemForStorage = async (name: string, value: string) => {
  await setItem(name, value);
};

const removeItemForStorage = async (name: string) => {
  await removeItem(name);
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      selectedCharacterId: null,
      currentScreenTime: null,
      goalScreenTime: null,

      setSelectedCharacter: (id) => set({ selectedCharacterId: id }),

      setScreenTimes: (current, goal) =>
        set({
          currentScreenTime: current,
          goalScreenTime: goal,
        }),

      resetOnboarding: () =>
        set({
          selectedCharacterId: null,
          currentScreenTime: null,
          goalScreenTime: null,
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
