import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { AVAILABLE_QUESTS } from '@/app/data/quests';
import QuestTimer from '@/lib/services/quest-timer';
import { getItem, removeItem, setItem } from '@/lib/storage';
import { usePOIStore } from '@/store/poi-store';

import { useCharacterStore } from './character-store';
import {
  type CustomQuestTemplate,
  type Quest,
  type StoryQuestTemplate,
} from './types';

interface QuestState {
  activeQuest: Quest | null;
  pendingQuest: (CustomQuestTemplate | StoryQuestTemplate) | null;
  availableQuests: (CustomQuestTemplate | StoryQuestTemplate)[];
  failedQuest: Quest | (CustomQuestTemplate | StoryQuestTemplate) | null;
  completedQuests: Quest[];
  recentCompletedQuest: Quest | null;
  lastCompletedQuestTimestamp: number | null;
  cancelQuest: () => void;
  startQuest: (quest: Quest) => void;
  completeQuest: (ignoreDuration?: boolean) => Quest | null;
  failQuest: () => void;
  refreshAvailableQuests: () => void;
  resetFailedQuest: () => void;
  clearRecentCompletedQuest: () => void;
  reset: () => void;
  getCompletedQuests: () => Quest[];
  prepareQuest: (quest: CustomQuestTemplate | StoryQuestTemplate) => void;
}

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

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      activeQuest: null,
      pendingQuest: null,
      availableQuests: [],
      failedQuest: null,
      completedQuests: [],
      recentCompletedQuest: null,
      lastCompletedQuestTimestamp: null,
      prepareQuest: (quest: CustomQuestTemplate | StoryQuestTemplate) => {
        set({ pendingQuest: quest, availableQuests: [] });
      },

      startQuest: (quest: Quest) => {
        const startedQuest = {
          ...quest,
          startTime: Date.now(),
        };
        set({ activeQuest: startedQuest, pendingQuest: null });
      },

      completeQuest: (ignoreDuration = false) => {
        const { activeQuest, lastCompletedQuestTimestamp } = get();
        console.log('completeQuest', activeQuest);
        if (activeQuest && activeQuest.startTime) {
          const completionTime = Date.now();
          const duration = (completionTime - activeQuest.startTime) / 1000;
          // @todo: does the background task need to be passing true for ignoreDuration?
          if (ignoreDuration || duration >= activeQuest.durationMinutes * 60) {
            // Quest completed successfully
            const completedQuest = {
              ...activeQuest,
              completedAt: completionTime,
            };

            // Update the streak BEFORE updating lastCompletedQuestTimestamp
            // Use getState() instead of hooks
            const characterStore = useCharacterStore.getState();
            characterStore.updateStreak(lastCompletedQuestTimestamp);

            // Now update the store state with the new timestamp
            set((state) => ({
              activeQuest: null,
              recentCompletedQuest: completedQuest,
              lastCompletedQuestTimestamp: completionTime,
              completedQuests: [...state.completedQuests, completedQuest],
            }));

            // Reveal the associated POI
            if (activeQuest.mode === 'story') {
              const poiStore = usePOIStore.getState();
              poiStore.revealLocation(activeQuest.poiSlug);
            }

            // Add XP for completing the quest - use getState() instead of hooks
            characterStore.addXP(completedQuest.reward.xp);

            return completedQuest;
          } else {
            // Quest failed
            get().failQuest();
            return null;
          }
        }
        return null;
      },

      cancelQuest: () => {
        const { activeQuest, pendingQuest } = get();
        if (activeQuest || pendingQuest) {
          set({ activeQuest: null, pendingQuest: null });
        }
        QuestTimer.stopQuest();
      },

      failQuest: () => {
        const { activeQuest, pendingQuest } = get();
        if (activeQuest || pendingQuest) {
          set({
            failedQuest: activeQuest || pendingQuest,
            activeQuest: null,
            pendingQuest: null,
          });
        }
        QuestTimer.stopQuest();
      },

      refreshAvailableQuests: () => {
        const { activeQuest, completedQuests } = get();
        if (!activeQuest) {
          // Get the next quest in AVAILABLE_QUESTS that hasn't been completed
          const nextQuest = AVAILABLE_QUESTS.find(
            (quest) =>
              !completedQuests.some((completed) => completed.id === quest.id)
          );
          if (nextQuest) {
            set({ availableQuests: [nextQuest] });
          } else {
            // All quests completed
            set({ availableQuests: [] });
          }
        }
      },

      resetFailedQuest: () => {
        set({ failedQuest: null });
      },

      clearRecentCompletedQuest: () => {
        set({ recentCompletedQuest: null });
      },

      getCompletedQuests: () => {
        return get().completedQuests;
      },

      reset: () => {
        set({
          activeQuest: null,
          pendingQuest: null,
          availableQuests: [],
          completedQuests: [],
          failedQuest: null,
          recentCompletedQuest: null,
          lastCompletedQuestTimestamp: null,
        });

        // Reset streak when quests are reset
        useCharacterStore.getState().resetStreak();
      },
    }),
    {
      name: 'quest-storage',
      storage: createJSONStorage(() => ({
        getItem: getItemForStorage,
        setItem: setItemForStorage,
        removeItem: removeItemForStorage,
      })),
    }
  )
);
