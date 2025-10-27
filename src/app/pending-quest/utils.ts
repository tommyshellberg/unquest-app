import { STRINGS } from './constants';
import { type QuestMode } from './types';

/**
 * Get the appropriate subtitle text based on quest mode
 *
 * @param mode - The quest mode (story or custom)
 * @returns The subtitle string to display
 */
export function getQuestSubtitle(mode?: QuestMode): string {
  return mode === 'custom'
    ? STRINGS.CUSTOM_QUEST_SUBTITLE
    : STRINGS.STORY_QUEST_SUBTITLE;
}
