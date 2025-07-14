import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../common';
import type { NextAvailableQuestsResponse } from './types';

interface UseNextAvailableQuestsOptions {
  storylineId?: string;
  includeOptions?: boolean;
  enabled?: boolean;
}

export const useNextAvailableQuests = ({
  storylineId = 'vaedros',
  includeOptions = true,
  enabled = true,
}: UseNextAvailableQuestsOptions = {}) => {
  return useQuery<NextAvailableQuestsResponse>({
    queryKey: ['next-available-quests', storylineId, includeOptions],
    queryFn: async () => {
      const params = new URLSearchParams({
        storylineId,
        includeOptions: includeOptions.toString(),
      });
      
      const response = await apiClient.get(
        `/quest-templates/next-available?${params.toString()}`
      );
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};