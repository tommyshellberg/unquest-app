import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../common';
import type { StorylineProgress } from './types';

interface UseStorylineProgressOptions {
  storylineId?: string;
  enabled?: boolean;
}

export const useStorylineProgress = ({
  storylineId = 'vaedros',
  enabled = true,
}: UseStorylineProgressOptions = {}) => {
  return useQuery<StorylineProgress>({
    queryKey: ['storyline-progress', storylineId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/storylines/${storylineId}/progress`
      );
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};
