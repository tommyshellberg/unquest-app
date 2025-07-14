// Legacy mapping from React Native asset IDs to quest IDs
// This is needed to convert old QuestRun audio assets to S3 paths

// First, we need to capture the asset IDs from the old quest data
const legacyAssetIds: Record<string, number> = {
  'quest-1': require('@/../assets/audio/quest-1.mp3'),
  'quest-1a': require('@/../assets/audio/quest-1a.mp3'),
  'quest-1b': require('@/../assets/audio/quest-1b.mp3'),
  'quest-2': require('@/../assets/audio/quest-2.mp3'),
  'quest-2a': require('@/../assets/audio/quest-2a.mp3'),
  'quest-2b': require('@/../assets/audio/quest-2b.mp3'),
  'quest-3': require('@/../assets/audio/quest-3.mp3'),
  'quest-3a': require('@/../assets/audio/quest-3a.mp3'),
  'quest-3b': require('@/../assets/audio/quest-3b.mp3'),
  'quest-4': require('@/../assets/audio/quest-4.mp3'),
  'quest-4a': require('@/../assets/audio/quest-4a.mp3'),
  'quest-4b': require('@/../assets/audio/quest-4b.mp3'),
  'quest-5': require('@/../assets/audio/quest-5.mp3'),
  'quest-5a': require('@/../assets/audio/quest-5a.mp3'),
  'quest-5b': require('@/../assets/audio/quest-5b.mp3'),
  'quest-6': require('@/../assets/audio/quest-6.mp3'),
  'quest-6a': require('@/../assets/audio/quest-6a.mp3'),
  'quest-6b': require('@/../assets/audio/quest-6b.mp3'),
  'quest-7': require('@/../assets/audio/quest-7.mp3'),
  'quest-7a': require('@/../assets/audio/quest-7a.mp3'),
  'quest-7b': require('@/../assets/audio/quest-7b.mp3'),
  'quest-8': require('@/../assets/audio/quest-8.mp3'),
  'quest-8a': require('@/../assets/audio/quest-8a.mp3'),
  'quest-8b': require('@/../assets/audio/quest-8b.mp3'),
  'quest-9': require('@/../assets/audio/quest-9.mp3'),
  'quest-9a': require('@/../assets/audio/quest-9a.mp3'),
  'quest-9b': require('@/../assets/audio/quest-9b.mp3'),
  'quest-10': require('@/../assets/audio/quest-10.mp3'),
  'quest-10a': require('@/../assets/audio/quest-10a.mp3'),
  'quest-10b': require('@/../assets/audio/quest-10b.mp3'),
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
  
  // Return the path format expected by the server
  return `audio/${questId}.mp3`;
}

/**
 * Check if a value is a legacy asset ID
 * @param value - The audioFile value to check
 * @returns True if it's a numeric asset ID
 */
export function isLegacyAssetId(value: any): value is number {
  return typeof value === 'number';
}