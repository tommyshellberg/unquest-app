import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../common';

interface ResetStorylineResponse {
  success: boolean;
  message: string;
  storylineId: string;
  progress: {
    storylineId: string;
    totalQuests: number;
    currentLevel: number;
    completedQuests: number;
    progressPercentage: number;
    lastCompletedQuestId: string | null;
    lastCompletedCustomId: string | null;
    isComplete: boolean;
  };
}

interface ResetStorylineVariables {
  storylineId: string;
}

export const useResetStoryline = () => {
  const queryClient = useQueryClient();

  return useMutation<ResetStorylineResponse, Error, ResetStorylineVariables>({
    mutationFn: async ({ storylineId }) => {
      const response = await apiClient.post(
        `/storylines/${storylineId}/reset`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries after successful reset
      queryClient.invalidateQueries({
        queryKey: ['storyline-progress', variables.storylineId],
      });
      queryClient.invalidateQueries({
        queryKey: ['next-available-quests', variables.storylineId],
      });
    },
  });
};
