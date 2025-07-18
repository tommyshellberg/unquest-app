// Legacy mapping from React Native asset IDs to quest IDs
// This is needed to convert old QuestRun audio assets to S3 paths

import { getQuestAudioPath } from './audio-utils';

// Legacy asset IDs that were generated when audio files were bundled
// These are hardcoded based on historical data from when we used require() statements
// The actual numeric values don't matter anymore since we're moving to S3
const legacyAssetIds: Record<string, number> = {
  'quest-1': 1,
  'quest-1a': 2,
  'quest-1b': 3,
  'quest-2': 4,
  'quest-2a': 5,
  'quest-2b': 6,
  'quest-3': 7,
  'quest-3a': 8,
  'quest-3b': 9,
  'quest-4': 10,
  'quest-4a': 11,
  'quest-4b': 12,
  'quest-5': 13,
  'quest-5a': 14,
  'quest-5b': 15,
  'quest-6': 16,
  'quest-6a': 17,
  'quest-6b': 18,
  'quest-7': 19,
  'quest-7a': 20,
  'quest-7b': 21,
  'quest-8': 22,
  'quest-8a': 23,
  'quest-8b': 24,
  'quest-9': 25,
  'quest-9a': 26,
  'quest-9b': 27,
  'quest-10': 28,
  'quest-10a': 29,
  'quest-10b': 30,
};

// Create a reverse mapping from asset ID to quest ID
const assetIdToQuestId: Record<number, string> = {};
Object.entries(legacyAssetIds).forEach(([questId, assetId]) => {
  assetIdToQuestId[assetId] = questId;
});

/**
 * Convert a legacy React Native asset ID to an audio path
 * @param assetId - The numeric asset ID from old QuestRun documents
 * @returns The audio path string, or null if not found
 */
export function convertLegacyAssetToPath(assetId: number): string | null {
  const questId = assetIdToQuestId[assetId];
  if (!questId) {
    console.warn(`Unknown legacy asset ID: ${assetId}`);
    return null;
  }
  
  // Return the S3 path using the standard format
  return getQuestAudioPath(questId);
}

/**
 * Check if a value is a legacy asset ID
 * @param value - The audioFile value to check
 * @returns True if it's a numeric asset ID
 */
export function isLegacyAssetId(value: any): value is number {
  return typeof value === 'number';
}