// Map of audio file paths to required assets
// This is needed because the server sends audio paths as strings,
// but expo-av expects required assets

const audioAssetMap: Record<string, any> = {
  'audio/quest-1.mp3': require('@/../assets/audio/quest-1.mp3'),
  'audio/quest-1a.mp3': require('@/../assets/audio/quest-1a.mp3'),
  'audio/quest-1b.mp3': require('@/../assets/audio/quest-1b.mp3'),
  'audio/quest-2.mp3': require('@/../assets/audio/quest-2.mp3'),
  'audio/quest-2a.mp3': require('@/../assets/audio/quest-2a.mp3'),
  'audio/quest-2b.mp3': require('@/../assets/audio/quest-2b.mp3'),
  'audio/quest-3.mp3': require('@/../assets/audio/quest-3.mp3'),
  'audio/quest-3a.mp3': require('@/../assets/audio/quest-3a.mp3'),
  'audio/quest-3b.mp3': require('@/../assets/audio/quest-3b.mp3'),
  'audio/quest-4.mp3': require('@/../assets/audio/quest-4.mp3'),
  'audio/quest-4a.mp3': require('@/../assets/audio/quest-4a.mp3'),
  'audio/quest-4b.mp3': require('@/../assets/audio/quest-4b.mp3'),
  'audio/quest-5.mp3': require('@/../assets/audio/quest-5.mp3'),
  'audio/quest-5a.mp3': require('@/../assets/audio/quest-5a.mp3'),
  'audio/quest-5b.mp3': require('@/../assets/audio/quest-5b.mp3'),
  'audio/quest-6.mp3': require('@/../assets/audio/quest-6.mp3'),
  'audio/quest-6a.mp3': require('@/../assets/audio/quest-6a.mp3'),
  'audio/quest-6b.mp3': require('@/../assets/audio/quest-6b.mp3'),
  'audio/quest-7.mp3': require('@/../assets/audio/quest-7.mp3'),
  'audio/quest-7a.mp3': require('@/../assets/audio/quest-7a.mp3'),
  'audio/quest-7b.mp3': require('@/../assets/audio/quest-7b.mp3'),
  'audio/quest-8.mp3': require('@/../assets/audio/quest-8.mp3'),
  'audio/quest-8a.mp3': require('@/../assets/audio/quest-8a.mp3'),
  'audio/quest-8b.mp3': require('@/../assets/audio/quest-8b.mp3'),
  'audio/quest-9.mp3': require('@/../assets/audio/quest-9.mp3'),
  'audio/quest-9a.mp3': require('@/../assets/audio/quest-9a.mp3'),
  'audio/quest-9b.mp3': require('@/../assets/audio/quest-9b.mp3'),
  'audio/quest-10.mp3': require('@/../assets/audio/quest-10.mp3'),
  'audio/quest-10a.mp3': require('@/../assets/audio/quest-10a.mp3'),
  'audio/quest-10b.mp3': require('@/../assets/audio/quest-10b.mp3'),
};

export function getAudioAsset(audioPath: string | any): any {
  // If it's already a required asset (from local quest data), return as-is
  if (typeof audioPath !== 'string') {
    return audioPath;
  }

  // Otherwise, map the string path to the required asset
  const asset = audioAssetMap[audioPath];
  if (!asset) {
    console.warn(`Audio asset not found for path: ${audioPath}`);
    return null;
  }

  return asset;
}
