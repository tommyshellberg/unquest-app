import { apiClient } from '@/api/common';

export interface InitializeCooperativeQuestRequest {
  title: string;
  duration: number;
  inviteeIds: string[]; // Changed from 'invitees' to match server
  questData?: {
    category?: string;
    description?: string;
    // Note: reward is not allowed here - server calculates it
  };
}

export interface InitializeCooperativeQuestResponse {
  invitationId: string;
  lobbyId: string;
  validInvitees: number; // Number of valid invitees the server processed
}

export interface CreateCooperativeQuestRequest {
  lobbyId: string;
}

export interface CreateCooperativeQuestResponse {
  questRunId: string;
  questData: any;
}

export const cooperativeQuestApi = {
  // Initialize a cooperative quest (creates invitations and lobby)
  initializeCooperativeQuest: async (
    data: InitializeCooperativeQuestRequest
  ): Promise<InitializeCooperativeQuestResponse> => {
    const response = await apiClient.post(
      '/quest-runs/cooperative/initialize',
      data
    );
    return response.data;
  },

  // Create the actual quest run when all participants are ready
  createCooperativeQuest: async (
    lobbyId: string
  ): Promise<CreateCooperativeQuestResponse> => {
    const response = await apiClient.post(
      `/quest-runs/cooperative/create/${lobbyId}`
    );
    return response.data;
  },

  // Get user's pending cooperative quest invitations
  getPendingCooperativeInvitations: async (): Promise<any[]> => {
    const response = await apiClient.get('/quest-runs/cooperative/invitations');
    return response.data;
  },
};
