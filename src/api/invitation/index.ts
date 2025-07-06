import { apiClient } from '@/api/common';

export interface InvitationResponse {
  id: string;
  inviter: {
    id: string;
    username: string;
    characterName?: string;
  };
  quest?: {
    title?: string;
    duration?: number;
    category?: string;
  };
  questRunId?: string;
  inviteeCount: number;
  acceptedCount: number;
  expiresAt: string;
  createdAt: string;
  metadata?: {
    lobbyId?: string;
    questTitle?: string;
    questDuration?: number;
  };
  questData?: {
    title?: string;
    duration?: number;
    category?: string;
  };
}

export const invitationApi = {
  // Respond to a quest invitation
  respondToInvitation: async (
    invitationId: string,
    status: 'accepted' | 'declined'
  ): Promise<any> => {
    const response = await apiClient.patch(
      `/invitations/${invitationId}`,
      {
        action: status === 'accepted' ? 'accept' : 'decline',
      }
    );
    return response.data;
  },

  // Get user's pending invitations
  getPendingInvitations: async (): Promise<InvitationResponse[]> => {
    const response = await apiClient.get('/invitations');
    return response.data;
  },
};
