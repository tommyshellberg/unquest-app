import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../common';

interface HighestCompletedQuestResponse {
  highestCompletedQuest: {
    customId: string;
    completedAt: string;
  } | null;
}

interface UseHighestCompletedQuestOptions {
  storylineId: string;
  userId?: string;
  enabled?: boolean;
}

export const useHighestCompletedQuest = ({
  storylineId,
  userId,
  enabled = true,
}: UseHighestCompletedQuestOptions) => {
  return useQuery<HighestCompletedQuestResponse>({
    queryKey: ['highest-completed-quest', storylineId, userId],
    queryFn: async () => {
      const params = new URLSearchParams({
        storylineId,
      });

      if (userId) {
        params.append('userId', userId);
      }

      const response = await apiClient.get(
        `/quest-runs/highest-completed-quest?${params.toString()}`
      );
      return response.data;
    },
    enabled: enabled && !!storylineId,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};
