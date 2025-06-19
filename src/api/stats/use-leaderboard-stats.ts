import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../common/client';
import type { LeaderboardResponse } from './types';

export const useLeaderboardStats = () => {
  return useQuery<LeaderboardResponse>({
    queryKey: ['stats', 'leaderboard'],
    queryFn: async () => {
      const response =
        await apiClient.get<LeaderboardResponse>('/stats/leaderboard');
      return response.data;
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
};
