/**
 * Audio utility functions for quest audio management
 */

/**
 * Get the S3 audio path for a quest based on its custom ID
 * @param customId - The quest custom ID (e.g., 'quest-1', 'quest-1a')
 * @param storylineId - The storyline ID (defaults to 'vaedros')
 * @returns The S3 path for the quest audio file
 */
export function getQuestAudioPath(
  customId: string,
  storylineId: string = 'vaedros'
): string {
  return `storylines/${storylineId}/${customId}.mp3`;
}

/**
 * Check if a quest should have audio
 * Story quests have audio, custom quests don't
 * @param questMode - The quest mode ('story' or 'custom')
 * @returns Whether the quest should have audio
 */
export function questHasAudio(questMode: string): boolean {
  return questMode === 'story';
}
