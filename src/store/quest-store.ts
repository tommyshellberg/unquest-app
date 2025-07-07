import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { queryClient } from '@/api/common';
import { AVAILABLE_QUESTS } from '@/app/data/quests';
import {
  cancelStreakWarningNotification,
  scheduleStreakWarningNotification,
} from '@/lib/services/notifications';
import QuestTimer from '@/lib/services/quest-timer';
import { getItem, removeItem, setItem } from '@/lib/storage';
import { usePOIStore } from '@/store/poi-store';

import { useCharacterStore } from './character-store';
import {
  type CooperativeQuestRun,
  type CustomQuestTemplate,
  type Quest,
  type QuestInvitation,
  type StoryQuestTemplate,
} from './types';

interface QuestState {
  activeQuest: Quest | null;
  pendingQuest: (CustomQuestTemplate | StoryQuestTemplate) | null;
  availableQuests: (CustomQuestTemplate | StoryQuestTemplate)[];
  failedQuest: Quest | null;
  completedQuests: Quest[];
  recentCompletedQuest: Quest | null;
  lastCompletedQuestTimestamp: number | null;
  currentLiveActivityId: string | null;
  failedQuests: Quest[];
  // Cooperative quest fields
  currentInvitation: QuestInvitation | null;
  cooperativeQuestRun: CooperativeQuestRun | null;
  pendingInvitations: QuestInvitation[];
  // Actions
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
  // Cooperative quest actions
  setCurrentInvitation: (invitation: QuestInvitation | null) => void;
  setCooperativeQuestRun: (run: CooperativeQuestRun | null) => void;
  setPendingInvitations: (invitations: QuestInvitation[]) => void;
  updateParticipantReady: (userId: string, ready: boolean) => void;
}

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
      failedQuests: [],
      // Cooperative quest fields
      currentInvitation: null,
      cooperativeQuestRun: null,
      pendingInvitations: [],
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
        if (activeQuest && activeQuest.startTime) {
          const completionTime = Date.now();
          const duration = (completionTime - activeQuest.startTime) / 1000;

          if (ignoreDuration || duration >= activeQuest.durationMinutes * 60) {
            // Quest completed successfully
            const completedQuest: Quest = {
              ...activeQuest,
              stopTime: completionTime,
              status: 'completed' as const,
            };

            // Check if this is the first quest completed today
            const isFirstQuestOfTheDay = (() => {
              if (!lastCompletedQuestTimestamp) return true;

              const lastDate = new Date(lastCompletedQuestTimestamp);
              const now = new Date(completionTime);

              return (
                lastDate.getDate() !== now.getDate() ||
                lastDate.getMonth() !== now.getMonth() ||
                lastDate.getFullYear() !== now.getFullYear()
              );
            })();

            const characterStore = useCharacterStore.getState();
            characterStore.updateStreak(lastCompletedQuestTimestamp);

            set((state) => ({
              activeQuest: null, // Quest is no longer active
              pendingQuest: null, // Clear any lingering pending quest
              recentCompletedQuest: completedQuest,
              lastCompletedQuestTimestamp: completionTime,
              completedQuests: [...state.completedQuests, completedQuest],
              // TODO: does this interfere with updating the live activity?
              currentLiveActivityId: null, // Clear activity ID on completion
              cooperativeQuestRun: null, // Clear cooperative quest run on completion
            }));

            if (activeQuest.mode === 'story' && activeQuest.poiSlug) {
              const poiStore = usePOIStore.getState();
              poiStore.revealLocation(activeQuest.poiSlug);
            }

            characterStore.addXP(completedQuest.reward.xp);

            // Invalidate user details cache to force fresh data from server
            // This ensures local XP/level syncs with server-calculated values
            queryClient.invalidateQueries({
              queryKey: ['user', 'details'] as const,
            });

            // If this is the first quest completed today, cancel today's warning
            // and schedule tomorrow's warning
            if (isFirstQuestOfTheDay) {
              cancelStreakWarningNotification()
                .then(() => scheduleStreakWarningNotification(true))
                .catch((err) =>
                  console.error('Error scheduling streak notifications:', err)
                );
            }

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
          QuestTimer.stopQuest();

          // Ensure all required fields for Quest are present
          const now = Date.now();
          const cooperativeQuestRun = get().cooperativeQuestRun;
          const questId =
            failedQuestDetails.id ||
            cooperativeQuestRun?.questId ||
            `failed-${now}`;

          const failedQuestWithTime: Quest = {
            ...failedQuestDetails,
            startTime: activeQuest?.startTime || now,
            stopTime: now,
            status: 'failed' as const,
            reward: failedQuestDetails.reward ?? { xp: 0 },
            durationMinutes: failedQuestDetails.durationMinutes ?? 0,
            title: failedQuestDetails.title ?? 'Unknown Quest',
            id: questId,
            // Add any other required fields here
          };

          set({
            failedQuest: failedQuestWithTime,
            failedQuests: [...get().failedQuests, failedQuestWithTime],
            activeQuest: null,
            pendingQuest: null,
            currentLiveActivityId: null,
            cooperativeQuestRun: null, // Clear cooperative quest run on failure
          });
        }
      },

      refreshAvailableQuests: () => {
        const { activeQuest, completedQuests } = get();

        if (activeQuest) {
          // If there is an active quest, don't refresh available quests
          return;
        }

        // If no quests completed, start with quest-1 (this is the only valid case for showing quest-1)
        if (completedQuests.length === 0) {
          const firstQuest = AVAILABLE_QUESTS.find((q) => q.id === 'quest-1');
          if (firstQuest) {
            set({ availableQuests: [firstQuest] });
            return;
          }
          set({ availableQuests: [] });
          return;
        }

        // Filter for only story quests
        const storyQuests = completedQuests.filter(
          (q) => q.mode === 'story' && q.status === 'completed'
        );

        // If no story quests at all, show no quests
        // (don't fallback to first quest - that would hide a potential issue)
        if (storyQuests.length === 0) {
          set({ availableQuests: [] });
          return;
        }

        // Sort story quests by completion time (newest first)
        const sortedStoryQuests = [...storyQuests].sort(
          (a, b) => (b.stopTime || 0) - (a.stopTime || 0)
        );

        // Use the most recent STORY quest to determine what comes next
        const lastCompletedStory = sortedStoryQuests[0];

        // Find the quest template for the last completed story quest
        const lastCompletedTemplate = AVAILABLE_QUESTS.find(
          (q) => q.id === lastCompletedStory.id
        );

        if (lastCompletedTemplate && 'options' in lastCompletedTemplate) {
          // For quests with options, find the next quest IDs
          const nextQuestIds = lastCompletedTemplate.options.map(
            (opt) => opt.nextQuestId
          );

          // Filter out null nextQuestIds (end of storyline)
          const validNextQuestIds = nextQuestIds.filter((id) => id !== null);

          // Find those quests from available quests
          const nextQuests = AVAILABLE_QUESTS.filter(
            (q) =>
              validNextQuestIds.includes(q.id) &&
              !completedQuests.some((completed) => completed.id === q.id)
          );

          if (nextQuests.length > 0) {
            set({ availableQuests: nextQuests });
            return;
          }
        }

        // For quests without options or if we can't find the template,
        // try to infer the next level based on quest ID patterns
        const idMatch = lastCompletedStory.id.match(/quest-(\d+)/);
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

        // If we can't find next quests, return an empty array
        // This is expected if all quests are completed or there's no clear next step
        set({ availableQuests: [] });
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
        set({ currentLiveActivityId: id });
      },

      // Cooperative quest actions
      setCurrentInvitation: (invitation: QuestInvitation | null) => {
        set({ currentInvitation: invitation });
      },

      setCooperativeQuestRun: (run: CooperativeQuestRun | null) => {
        set({ cooperativeQuestRun: run });
      },

      setPendingInvitations: (invitations: QuestInvitation[]) => {
        set({ pendingInvitations: invitations });
      },

      updateParticipantReady: (userId: string, ready: boolean) => {
        const { cooperativeQuestRun } = get();
        if (!cooperativeQuestRun) return;

        const updatedParticipants = cooperativeQuestRun.participants.map((p) =>
          p.userId === userId ? { ...p, ready } : p
        );

        set({
          cooperativeQuestRun: {
            ...cooperativeQuestRun,
            participants: updatedParticipants,
          },
        });
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
          currentLiveActivityId: null, // Reset activity ID
          failedQuests: [],
          // Reset cooperative quest fields
          currentInvitation: null,
          cooperativeQuestRun: null,
          pendingInvitations: [],
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
      onRehydrateStorage: (_initialState) => {
        return (state, error) => {
          if (error) {
            console.error(
              'An error occurred during quest store hydration:',
              error
            );
          } else if (state) {
            // Check for data consistency issues that might occur after app reinstall
            const hasCompletedQuests =
              state.completedQuests && state.completedQuests.length > 0;
            const hasActiveQuest = state.activeQuest !== null;

            // If there's an active quest but no completed quests, this is likely stale data
            // from a previous install (since you must complete quest-1 before getting quest-1a)
            if (hasActiveQuest && !hasCompletedQuests) {
              console.log(
                '🧹 Detected inconsistent state - clearing stale quest data'
              );
              state.activeQuest = null;
              state.pendingQuest = null;
              state.currentLiveActivityId = null;
              state.availableQuests = [];
              return;
            }

            // Check if pending quest is a completed cooperative quest
            if (state.pendingQuest && state.completedQuests) {
              const pendingQuestId = state.pendingQuest.id;
              const isCompleted = state.completedQuests.some(
                (q) => q.id === pendingQuestId
              );

              if (isCompleted) {
                console.log(
                  '🧹 Detected completed quest still in pending state:',
                  pendingQuestId
                );
                state.pendingQuest = null;
                state.cooperativeQuestRun = null;
              }
            }

            // Check if there's a cooperative quest run that shows as completed
            if (state.cooperativeQuestRun && state.pendingQuest) {
              const cooperativeRun = state.cooperativeQuestRun;

              // If the cooperative quest run shows as completed but quest is still pending
              if (
                (cooperativeRun.status as any) === 'success' ||
                cooperativeRun.status === 'completed' ||
                (cooperativeRun.scheduledEndTime &&
                  Date.now() > cooperativeRun.scheduledEndTime)
              ) {
                console.log(
                  '🧹 Found cooperative quest that completed but was not recorded:',
                  state.pendingQuest.id
                );

                // Add it to completed quests
                const completedQuest = {
                  ...state.pendingQuest,
                  startTime:
                    cooperativeRun.actualStartTime ||
                    Date.now() - state.pendingQuest.durationMinutes * 60 * 1000,
                  stopTime: cooperativeRun.scheduledEndTime || Date.now(),
                  status: 'completed' as const,
                };

                // Make sure it's not already in completed quests
                const alreadyCompleted = state.completedQuests.some(
                  (q) => q.id === completedQuest.id
                );
                if (!alreadyCompleted) {
                  state.completedQuests.push(completedQuest);
                }

                state.pendingQuest = null;
                state.cooperativeQuestRun = null;
              }
            }

            // Check if there's an active quest that should have completed/failed
            if (state.activeQuest && state.activeQuest.startTime) {
              const now = Date.now();
              const questDuration =
                state.activeQuest.durationMinutes * 60 * 1000;
              const questEndTime = state.activeQuest.startTime + questDuration;

              // If the quest should have ended by now
              if (now > questEndTime) {
                console.log(
                  '🧹 Cleaning up stale active quest:',
                  state.activeQuest.id
                );
                // Just clear the active quest without marking as failed
                // This handles cases where the app was reinstalled or data is from a previous user
                state.activeQuest = null;
                state.currentLiveActivityId = null;

                // Also clear any pending quest that might be stale
                if (state.pendingQuest) {
                  console.log('🧹 Also clearing stale pending quest');
                  state.pendingQuest = null;
                }
              }
            }
          }
        };
      },
    }
  )
);
