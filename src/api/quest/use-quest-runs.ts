import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../common';
import type { QuestRunsResponse } from './types';

interface UseQuestRunsOptions {
  page?: number;
  limit?: number;
  status?: string;
  mode?: 'story' | 'custom' | 'cooperative';
  sortBy?: string;
  enabled?: boolean;
}

export const useQuestRuns = ({
  page = 1,
  limit = 20,
  status,
  mode,
  sortBy = 'createdAt:desc',
  enabled = true,
}: UseQuestRunsOptions = {}) => {
  return useQuery<QuestRunsResponse>({
    queryKey: ['quest-runs', { page, limit, status, mode, sortBy }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
      });

      if (status) {
        params.append('status', status);
      }

      if (mode) {
        params.append('mode', mode);
      }

      const response = await apiClient.get(`/quest-runs?${params.toString()}`);
      return response.data;
    },
    enabled,
    staleTime: 1 * 60 * 1000, // Consider data stale after 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
};
