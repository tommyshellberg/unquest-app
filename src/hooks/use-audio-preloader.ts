import { useEffect } from 'react';
import { useNextAvailableQuests } from '@/api/quest/use-next-available-quests';
import { audioCacheService } from '@/lib/services/audio-cache.service';
import type { StoryQuestTemplate } from '@/store/types';

interface UseAudioPreloaderOptions {
  storylineId?: string;
  enabled?: boolean;
}

export const useAudioPreloader = ({
  storylineId = 'vaedros',
  enabled = true,
}: UseAudioPreloaderOptions = {}) => {
  const { data: questsData, isSuccess } = useNextAvailableQuests({
    storylineId,
    includeOptions: true,
    enabled,
  });

  useEffect(() => {
    if (!isSuccess || !questsData || !enabled) {
      return;
    }

    const preloadAudio = async () => {
      try {
        // Collect audio files from available quests
        const audioFiles: string[] = [];
        
        // Add main quest audio files
        if (questsData.quests) {
          for (const quest of questsData.quests) {
            if (quest.audioFile) {
              audioFiles.push(quest.audioFile);
            }
          }
        }
        
        // Add option quest audio files
        if (questsData.options) {
          for (const option of questsData.options) {
            if (option.nextQuest?.audioFile) {
              audioFiles.push(option.nextQuest.audioFile);
            }
          }
        }

        // Filter out duplicates
        const uniqueAudioFiles = [...new Set(audioFiles)];
        
        if (uniqueAudioFiles.length > 0) {
          console.log(`Preloading ${uniqueAudioFiles.length} audio files for ${storylineId}`);
          await audioCacheService.preloadAudio(uniqueAudioFiles);
        }
      } catch (error) {
        console.warn('Failed to preload audio files:', error);
      }
    };

    preloadAudio();
  }, [isSuccess, questsData, storylineId, enabled]);

  return {
    cacheStats: audioCacheService.getCacheStats(),
    clearCache: audioCacheService.clearCache.bind(audioCacheService),
  };
};