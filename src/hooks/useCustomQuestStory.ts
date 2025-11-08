import { useMemo } from 'react';

import { AVAILABLE_CUSTOM_QUEST_STORIES } from '@/app/data/quests';
import type { QuestWithMode } from '@/components/quest-complete/types';

/**
 * Custom hook to get a story for custom quests
 *
 * Logic:
 * 1. Returns null for non-custom quests (story, cooperative)
 * 2. Tries to find stories matching the quest's category
 * 3. If no matching stories, picks from a random category based on quest ID
 * 4. Uses quest ID hash to ensure same quest always gets same story
 *
 * @param quest - The quest object
 * @returns The story text or null if not a custom quest
 */
export function useCustomQuestStory(quest: QuestWithMode): string | null {
  return useMemo(() => {
    // Only return stories for custom quests
    if (quest.mode !== 'custom') {
      return null;
    }

    let matchingStories: typeof AVAILABLE_CUSTOM_QUEST_STORIES = [];

    // First, try to find stories matching the quest category
    if ('category' in quest && quest.category) {
      matchingStories = AVAILABLE_CUSTOM_QUEST_STORIES.filter(
        (storyItem) =>
          storyItem.category.toLowerCase() === quest.category?.toLowerCase()
      );
    }

    // If no matching stories found (e.g., 'social' category or unknown category),
    // pick from a random category based on quest ID
    if (matchingStories.length === 0) {
      // Get all unique categories
      const allCategories = [
        ...new Set(AVAILABLE_CUSTOM_QUEST_STORIES.map((s) => s.category)),
      ];

      // Pick a random category using quest ID as seed for consistency
      const categoryIndex =
        quest.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) %
        allCategories.length;
      const randomCategory = allCategories[categoryIndex];

      matchingStories = AVAILABLE_CUSTOM_QUEST_STORIES.filter(
        (storyItem) => storyItem.category === randomCategory
      );
    }

    // If we have stories, pick one using quest ID for consistency
    if (matchingStories.length > 0) {
      // Use quest ID to generate a consistent random index
      const questIdHash =
        quest.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) %
        matchingStories.length;
      return matchingStories[questIdHash].story;
    }

    return null;
  }, [quest]);
}
