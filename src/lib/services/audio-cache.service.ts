import * as FileSystem from 'expo-file-system';

import { apiClient } from '@/api/common/client';
import { convertLegacyAssetToPath, isLegacyAssetId } from '@/utils/legacyAudioMapping';

interface CachedAudio {
  path: string;
  localUri: string;
  expiresAt: number;
}

interface AudioCacheEntry {
  audioPath: string;
  localUri?: string;
  expiresAt: number;
}

class AudioCacheService {
  private cache: Map<string, AudioCacheEntry> = new Map();
  private cacheDir: string;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 50; // Maximum number of cached files

  constructor() {
    this.cacheDir = `${FileSystem.cacheDirectory}audio/`;
    this.initializeCache();
  }

  private async initializeCache() {
    try {
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, {
          intermediates: true,
        });
      }

      // Clean up expired files on startup
      await this.cleanupExpiredFiles();
    } catch (error) {
      console.warn('Failed to initialize audio cache:', error);
    }
  }

  private async cleanupExpiredFiles() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.cacheDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = `${this.cacheDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists && fileInfo.modificationTime) {
          const fileAge = now - fileInfo.modificationTime * 1000;
          if (fileAge > this.CACHE_DURATION) {
            await FileSystem.deleteAsync(filePath);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup expired audio files:', error);
    }
  }

  private getCacheKey(audioPath: string): string {
    return audioPath.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private async downloadAudioFile(audioPath: string): Promise<string | null> {
    try {
      // Get signed URL from server
      const response = await apiClient.get('audio/file', {
        params: { path: audioPath },
      });

      if (!response.data.audioUrl) {
        throw new Error('No audio URL received from server');
      }

      const { audioUrl } = response.data;
      const fileName = this.getCacheKey(audioPath) + '.mp3';
      const localUri = `${this.cacheDir}${fileName}`;

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(audioUrl, localUri);

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      return localUri;
    } catch (error) {
      console.warn(`Failed to download audio file ${audioPath}:`, error);
      return null;
    }
  }

  private async downloadToMemory(audioPath: string): Promise<string | null> {
    try {
      // Get signed URL from server
      const response = await apiClient.get('/audio/file', {
        params: { path: audioPath },
      });

      if (!response.data.audioUrl) {
        throw new Error('No audio URL received from server');
      }

      // Return the signed URL directly for in-memory playback
      return response.data.audioUrl;
    } catch (error) {
      console.warn(`Failed to get audio URL for ${audioPath}:`, error);
      return null;
    }
  }

  async getAudioSource(audioPath: string | number): Promise<{ uri: string } | null> {
    if (!audioPath) {
      return null;
    }

    // Convert legacy React Native asset IDs to audio paths
    let actualPath: string;
    if (isLegacyAssetId(audioPath)) {
      const convertedPath = convertLegacyAssetToPath(audioPath);
      if (!convertedPath) {
        console.warn(`Could not convert legacy asset ID: ${audioPath}`);
        return null;
      }
      console.log(`Converted legacy asset ID ${audioPath} to path: ${convertedPath}`);
      actualPath = convertedPath;
    } else {
      actualPath = audioPath;
    }

    const cacheKey = actualPath;
    const now = Date.now();

    // Check if we have a cached entry
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && cachedEntry.expiresAt > now) {
      // If we have a local file, verify it still exists
      if (cachedEntry.localUri) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(cachedEntry.localUri);
          if (fileInfo.exists) {
            return { uri: cachedEntry.localUri };
          }
        } catch (error) {
          console.warn(`Cached file no longer exists: ${cachedEntry.localUri}`);
        }
      }
    }

    // Try to download and cache the file
    const localUri = await this.downloadAudioFile(actualPath);

    if (localUri) {
      // Successfully downloaded and cached
      const expiresAt = now + this.CACHE_DURATION;
      this.cache.set(cacheKey, {
        audioPath: actualPath,
        localUri,
        expiresAt,
      });

      // Manage cache size
      await this.manageCacheSize();

      return { uri: localUri };
    }

    // Fallback: try to get URL for in-memory playback
    console.log(`Falling back to in-memory playback for ${actualPath}`);
    const memoryUri = await this.downloadToMemory(actualPath);

    if (memoryUri) {
      // Cache the URL (without local file) for short-term reuse
      const expiresAt = now + 60 * 60 * 1000; // 1 hour for signed URLs
      this.cache.set(cacheKey, {
        audioPath: actualPath,
        expiresAt,
      });

      return { uri: memoryUri };
    }

    return null;
  }

  private async manageCacheSize() {
    if (this.cache.size <= this.MAX_CACHE_SIZE) {
      return;
    }

    // Convert to array and sort by expiration time
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);

    // Remove oldest entries
    const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);

    for (const [key, entry] of toRemove) {
      if (entry.localUri) {
        try {
          await FileSystem.deleteAsync(entry.localUri);
        } catch (error) {
          console.warn(
            `Failed to delete cached file: ${entry.localUri}`,
            error
          );
        }
      }
      this.cache.delete(key);
    }
  }

  async preloadAudio(audioPaths: (string | number)[]): Promise<void> {
    // Preload next 3 quests' audio files in the background
    const preloadPromises = audioPaths
      .filter(path => typeof path === 'string') // Skip legacy asset IDs
      .slice(0, 3)
      .map(async (audioPath) => {
        try {
          await this.getAudioSource(audioPath);
        } catch (error) {
          console.warn(`Failed to preload audio: ${audioPath}`, error);
        }
      });

    await Promise.all(preloadPromises);
  }

  async clearCache(): Promise<void> {
    try {
      // Clear in-memory cache
      this.cache.clear();

      // Remove all cached files
      const files = await FileSystem.readDirectoryAsync(this.cacheDir);
      const deletePromises = files.map((file) =>
        FileSystem.deleteAsync(`${this.cacheDir}${file}`)
      );

      await Promise.all(deletePromises);

      console.log('Audio cache cleared successfully');
    } catch (error) {
      console.warn('Failed to clear audio cache:', error);
    }
  }

  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }
}

export const audioCacheService = new AudioCacheService();
