import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getItem, removeItem, setItem } from '@/lib/storage';

type ReminderTime = {
  hour: number;
  minute: number;
} | null;

type DailyReminder = {
  enabled: boolean;
  time: ReminderTime;
};

type SettingsState = {
  dailyReminder: DailyReminder;
  setDailyReminder: (reminder: DailyReminder) => void;
  hasCompletedFirstQuest: boolean;
  setHasCompletedFirstQuest: (value: boolean) => void;
  hasBeenPromptedForReminder: boolean;
  setHasBeenPromptedForReminder: (value: boolean) => void;
};

const getItemForStorage = (name: string) => {
  const value = getItem<string>(name);
  return value ?? null;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dailyReminder: {
        enabled: false,
        time: null,
      },
      setDailyReminder: (reminder) => set({ dailyReminder: reminder }),
      hasCompletedFirstQuest: false,
      setHasCompletedFirstQuest: (value) =>
        set({ hasCompletedFirstQuest: value }),
      hasBeenPromptedForReminder: false,
      setHasBeenPromptedForReminder: (value) =>
        set({ hasBeenPromptedForReminder: value }),
    }),
    {
      name: 'unquest-settings',
      storage: createJSONStorage(() => ({
        getItem: getItemForStorage,
        setItem: setItem,
        removeItem: removeItem,
      })),
      onRehydrateStorage: (_initialState) => {
        return (state, error) => {
          if (error) {
            console.error(
              'An error occurred during settings store hydration:',
              error
            );
          }
        };
      },
    }
  )
);
