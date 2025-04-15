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
          // If no quests completed, start with quest-1
          if (completedQuests.length === 0) {
            const firstQuest = AVAILABLE_QUESTS.find((q) => q.id === 'quest-1');
            if (firstQuest) {
              set({ availableQuests: [firstQuest] });
              return;
            }
          }

          // Find the last completed quest
          const sortedCompletedQuests = [...completedQuests].sort(
            (a, b) => (b.completedAt || 0) - (a.completedAt || 0)
          );

          const lastCompleted = sortedCompletedQuests[0];
          if (!lastCompleted) {
            set({ availableQuests: [] });
            return;
          }

          // Find the quest template that matches the lastCompleted.id
          const lastCompletedTemplate = AVAILABLE_QUESTS.find(
            (q) => q.id === lastCompleted.id
          );

          if (lastCompletedTemplate && 'options' in lastCompletedTemplate) {
            // For quests with options, find the next quest IDs
            const nextQuestIds = lastCompletedTemplate.options.map(
              (opt) => opt.nextQuestId
            );

            // Find those quests from available quests
            const nextQuests = AVAILABLE_QUESTS.filter(
              (q) =>
                nextQuestIds.includes(q.id) &&
                !completedQuests.some((completed) => completed.id === q.id)
            );

            if (nextQuests.length > 0) {
              set({ availableQuests: nextQuests });
              return;
            }
          } else {
            // For quests without options or if we can't find the template,
            // try to infer the next level based on quest ID patterns

            // Extract quest level number (e.g., "1" from "quest-1" or "quest-1a")
            const idMatch = lastCompleted.id.match(/quest-(\d+)/);
            if (idMatch) {
              const currentLevel = parseInt(idMatch[1]);
              const nextLevel = currentLevel + 1;

              // Look for quests at the next level
              const nextLevelQuests = AVAILABLE_QUESTS.filter(
                (q) =>
                  q.id.startsWith(`quest-${nextLevel}`) &&
                  !q.id.includes('a') &&
                  !q.id.includes('b') &&
                  !completedQuests.some((completed) => completed.id === q.id)
              );

              if (nextLevelQuests.length > 0) {
                set({ availableQuests: [nextLevelQuests[0]] });
                return;
              }
            }
          }

          set({ availableQuests: [] });
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
