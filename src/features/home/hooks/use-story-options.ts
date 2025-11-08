import { useMemo } from 'react';

import { type QuestOption } from '@/api/quest/types';
import { AVAILABLE_QUESTS } from '@/app/data/quests';

interface ServerQuest {
  customId: string;
  decisionText?: string;
  title?: string;
  [key: string]: any;
}

interface CompletedQuest {
  id: string;
  mode: string;
  status?: string;
  [key: string]: any;
}

interface UseStoryOptionsProps {
  completedQuests: CompletedQuest[];
  activeQuest: any;
  pendingQuest: any;
  serverOptions: QuestOption[];
  serverQuests: ServerQuest[];
}

export function useStoryOptions({
  completedQuests,
  activeQuest,
  pendingQuest,
  serverOptions,
  serverQuests,
}: UseStoryOptionsProps) {
  const storyOptions = useMemo<QuestOption[]>(() => {
    // Don't show options if there's an active or pending quest
    if (activeQuest || pendingQuest) {
      return [];
    }

    // If we have multiple server quests, create options from their decisionText
    // This represents branching paths where each quest has its own decision text
    if (serverQuests.length > 1) {
      return serverQuests.map((quest, index) => ({
        id: `option-${index}`,
        text: quest.decisionText || 'Continue', // Use each quest's decisionText
        nextQuestId: quest.customId,
        nextQuest: quest,
      }));
    }

    // If we have a single server quest with decisionText, create a single option
    if (serverQuests.length === 1 && serverQuests[0].decisionText) {
      return [
        {
          id: 'option-0',
          text: serverQuests[0].decisionText,
          nextQuestId: serverQuests[0].customId,
          nextQuest: serverQuests[0],
        },
      ];
    }

    // Only use serverOptions as a fallback if no quests with decisionText
    if (serverOptions.length > 0) {
      return serverOptions;
    }

    // Fallback to local logic if server data not available
    const storyQuests = completedQuests.filter(
      (quest) => quest.mode === 'story'
    );

    if (storyQuests.length === 0) {
      // No completed story quests - show first quest
      const firstQuest = AVAILABLE_QUESTS.find(
        (quest) => quest.mode === 'story'
      );
      if (firstQuest && firstQuest.mode === 'story' && firstQuest.options) {
        return firstQuest.options;
      }
      return [];
    }

    // Get the last completed story quest
    const lastCompletedQuest = storyQuests[storyQuests.length - 1];

    // Find this quest in the AVAILABLE_QUESTS array to get its options
    const questData = AVAILABLE_QUESTS.find(
      (q) => q.id === lastCompletedQuest.id
    );

    if (
      questData &&
      questData.mode === 'story' &&
      questData.options &&
      questData.options.length > 0
    ) {
      return questData.options;
    }

    return [];
  }, [completedQuests, activeQuest, pendingQuest, serverOptions, serverQuests]);

  return { storyOptions };
}
