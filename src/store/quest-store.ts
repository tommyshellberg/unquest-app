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
  currentLiveActivityId: string | null;
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
  setLiveActivityId: (id: string | null) => void;
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
      currentLiveActivityId: null,
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
        console.log('completeQuest called for quest:', activeQuest?.id);
        if (activeQuest && activeQuest.startTime) {
          const completionTime = Date.now();
          const duration = (completionTime - activeQuest.startTime) / 1000;

          if (ignoreDuration || duration >= activeQuest.durationMinutes * 60) {
            // Quest completed successfully
            const completedQuest = {
              ...activeQuest,
              completedAt: completionTime,
            };

            const characterStore = useCharacterStore.getState();
            characterStore.updateStreak(lastCompletedQuestTimestamp);

            set((state) => ({
              activeQuest: null, // Quest is no longer active
              recentCompletedQuest: completedQuest,
              lastCompletedQuestTimestamp: completionTime,
              completedQuests: [...state.completedQuests, completedQuest],
              currentLiveActivityId: null, // Clear activity ID on completion
            }));

            if (activeQuest.mode === 'story' && activeQuest.poiSlug) {
              const poiStore = usePOIStore.getState();
              poiStore.revealLocation(activeQuest.poiSlug);
            }

            characterStore.addXP(completedQuest.reward.xp);
            console.log('Quest completed successfully:', completedQuest.id);
            return completedQuest;
          } else {
            // Duration not met
            console.warn(
              'CompleteQuest called but duration not met for quest:',
              activeQuest.id
            );
            get().failQuest(); // Fail the quest if duration condition isn't met
            return null;
          }
        }
        console.warn(
          'CompleteQuest called but no active quest found or quest has no start time.'
        );
        return null;
      },

      cancelQuest: () => {
        const { activeQuest, pendingQuest } = get();
        if (activeQuest || pendingQuest) {
          console.log('Cancelling quest:', activeQuest?.id || pendingQuest?.id);
          // End any active live activity when quest is canceled
          QuestTimer.stopQuest();
          set({
            activeQuest: null,
            pendingQuest: null,
            currentLiveActivityId: null,
          });
        }
      },

      failQuest: () => {
        const { activeQuest, pendingQuest } = get();
        const failedQuestDetails = activeQuest || pendingQuest;
        if (failedQuestDetails) {
          console.log('Failing quest:', failedQuestDetails.id);
          // End any active live activity when quest fails
          QuestTimer.stopQuest();
          set({
            failedQuest: failedQuestDetails,
            activeQuest: null,
            pendingQuest: null,
            currentLiveActivityId: null,
          });
        }
      },

      refreshAvailableQuests: () => {
        const { activeQuest, completedQuests } = get();
        if (!activeQuest) {
          const nextQuest = AVAILABLE_QUESTS.find(
            (quest) =>
              !completedQuests.some((completed) => completed.id === quest.id)
          );
          if (nextQuest) {
            set({ availableQuests: [nextQuest] });
          } else {
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

      setLiveActivityId: (id: string | null) => {
        console.log('Setting Live Activity ID in store:', id);
        set({ currentLiveActivityId: id });
      },

      reset: () => {
        console.log('Resetting quest store');
        set({
          activeQuest: null,
          pendingQuest: null,
          availableQuests: [],
          completedQuests: [],
          failedQuest: null,
          recentCompletedQuest: null,
          lastCompletedQuestTimestamp: null,
          currentLiveActivityId: null, // Reset activity ID
        });
        useCharacterStore.getState().resetStreak();
        // Need a way to signal QuestTimer to stop without direct import
      },
    }),
    {
      name: 'quest-storage',
      storage: createJSONStorage(() => ({
        getItem: getItemForStorage,
        setItem: setItemForStorage,
        removeItem: removeItemForStorage,
      })),
      onRehydrateStorage: (state) => {
        console.log('Quest store hydration starts');
        return (state, error) => {
          if (error) {
            console.error(
              'An error occurred during quest store hydration:',
              error
            );
          } else {
            console.log('Quest store hydration finished.');
          }
        };
      },
    }
  )
);
