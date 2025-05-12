import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getItem, removeItem, setItem } from '@/lib/storage';

import { type Character, type CharacterType, type XP } from './types';

interface CharacterState {
  character: Character | null;
  dailyQuestStreak: number;
  createCharacter: (type: CharacterType, name: string) => void;
  updateCharacter: (updatedCharacter: Partial<Character>) => void;
  addXP: (amount: XP) => void;
  updateStreak: (previousCompletionTimestamp: number | null) => void;
  resetStreak: () => void;
  resetCharacter: () => void;
}

const INITIAL_CHARACTER: Omit<Character, 'type' | 'name'> = {
  level: 1,
  currentXP: 0,
  xpToNextLevel: 100,
};

const calculateXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
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

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      character: null,
      dailyQuestStreak: 0,
      createCharacter: (type, name) =>
        set({
          character: {
            ...INITIAL_CHARACTER,
            type,
            name,
          },
        }),

      updateCharacter: (updatedCharacter) => {
        const currentCharacter = get().character;
        if (!currentCharacter) return;

        set({
          character: {
            ...currentCharacter,
            ...updatedCharacter,
          } as Character,
        });
      },

      addXP: (amount) => {
        const { character } = get();
        if (!character) return;

        let newXP = character.currentXP + amount;
        let newLevel = character.level;
        let xpToNext = character.xpToNextLevel;

        // Level up logic
        while (newXP >= xpToNext) {
          newXP -= xpToNext;
          newLevel++;
          xpToNext = calculateXPForLevel(newLevel);
        }

        set({
          character: {
            ...character,
            level: newLevel,
            currentXP: newXP,
            xpToNextLevel: xpToNext,
          },
        });
      },

      resetCharacter: () => {
        set((state) => ({
          ...state,
          character: null,
          dailyQuestStreak: 0,
        }));
      },

      // Updated method to update streak based on previous completion timestamp
      updateStreak: (previousCompletionTimestamp) => {
        const currentStreak = get().dailyQuestStreak;
        const now = new Date();

        if (!previousCompletionTimestamp) {
          // First quest completion ever
          set({ dailyQuestStreak: 1 });
          return;
        }

        const previousDate = new Date(previousCompletionTimestamp);

        // Check if the last completion was on a different day
        const isNewDay =
          previousDate.getDate() !== now.getDate() ||
          previousDate.getMonth() !== now.getMonth() ||
          previousDate.getFullYear() !== now.getFullYear();

        // Check if streak is broken (more than 24 hours since last completion)
        const isStreakBroken =
          now.getTime() - previousCompletionTimestamp > 24 * 60 * 60 * 1000;

        if (isNewDay && !isStreakBroken) {
          // Increment streak for a new day within the 24-hour window
          set({ dailyQuestStreak: currentStreak + 1 });
        } else if (isStreakBroken) {
          // Reset streak if it's broken
          set({ dailyQuestStreak: 1 });
        } else {
          // Same day, maintain current streak
          // If streak is 0, set it to 1 (this handles edge cases)
          if (currentStreak === 0) {
            set({ dailyQuestStreak: 1 });
          }
        }
      },

      // Method to reset streak
      resetStreak: () => {
        set({ dailyQuestStreak: 0 });
      },
    }),
    {
      name: 'character-storage',
      storage: createJSONStorage(() => ({
        getItem: getItemForStorage,
        setItem: setItemForStorage,
        removeItem: removeItemForStorage,
      })),
    }
  )
);
