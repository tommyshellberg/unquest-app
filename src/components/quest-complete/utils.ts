import { TOTAL_POI_IMAGES } from './constants';
import { POI_IMAGES, type QuestWithMode } from './types';

/**
 * Hash a string to a positive integer
 * Used for deterministic but seemingly random selection
 */
export function hashString(str: string): number {
  return Math.abs(
    str.split('').reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0)
  );
}

/**
 * Get the appropriate POI image for a quest
 *
 * Story quests: Use the quest number from the ID (e.g., "quest-5" -> image 5)
 * Custom/Cooperative quests: Use hash of quest ID for consistent selection
 *
 * @param quest - The quest object
 * @returns The image source for the quest
 */
export function getQuestImage(quest: QuestWithMode) {
  // For story quests, extract the base quest number from the ID
  if (quest.mode === 'story') {
    // Use customId if available (this is the template ID like 'quest-1'), otherwise use id
    const questIdToMatch = (quest as any).customId || quest.id;
    const match = questIdToMatch.match(/quest-(\d+)[a-z]?/);

    if (match) {
      const questNumber = parseInt(match[1], 10);

      // Wrap around if number exceeds available images
      if (questNumber >= 1 && questNumber <= TOTAL_POI_IMAGES) {
        return POI_IMAGES[questNumber as keyof typeof POI_IMAGES];
      } else if (questNumber > TOTAL_POI_IMAGES) {
        // For numbers beyond 31, wrap around (e.g., 35 -> 5)
        const wrappedNumber = ((questNumber - 1) % TOTAL_POI_IMAGES) + 1;
        return POI_IMAGES[wrappedNumber as keyof typeof POI_IMAGES];
      }
    }
  }

  // For custom/cooperative quests or as fallback, use a hash of the quest ID
  // This ensures the same quest always gets the same image
  const hash = hashString(quest.id);
  const imageNumber = ((hash % TOTAL_POI_IMAGES) +
    1) as keyof typeof POI_IMAGES;

  return POI_IMAGES[imageNumber];
}
