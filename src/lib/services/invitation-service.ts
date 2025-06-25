import { apiClient } from '@/api';
import { provisionalApiClient } from '@/api/common/provisional-client';
import { getItem } from '@/lib/storage';
import { type QuestInvitation } from '@/store/types';

export interface CreateInvitationRequest {
  questRunId: string;
  inviteeIds: string[];
}

export interface InvitationStatusResponse {
  invitation: QuestInvitation;
  acceptedUsers: string[];
  declinedUsers: string[];
  pendingUsers: string[];
}

export interface AcceptInvitationRequest {
  invitationId: string;
}

export interface DeclineInvitationRequest {
  invitationId: string;
}

/**
 * Create a new quest invitation
 */
export async function createInvitation(
  request: CreateInvitationRequest
): Promise<QuestInvitation> {
  try {
    const hasProvisionalToken = !!getItem('provisionalAccessToken');
    const client = hasProvisionalToken ? provisionalApiClient : apiClient;

    const response = await client.post<QuestInvitation>(
      '/invitations',
      request
    );
    return response.data;
  } catch (error) {
    console.error('Failed to create invitation:', error);
    throw error;
  }
}

/**
 * Get invitation status and participant responses
 */
export async function getInvitationStatus(
  invitationId: string
): Promise<InvitationStatusResponse> {
  try {
    const hasProvisionalToken = !!getItem('provisionalAccessToken');
    const client = hasProvisionalToken ? provisionalApiClient : apiClient;

    const response = await client.get<InvitationStatusResponse>(
      `/invitations/${invitationId}/status`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get invitation status:', error);
    throw error;
  }
}

/**
 * Accept a quest invitation
 */
export async function acceptInvitation(
  invitationId: string
): Promise<QuestInvitation> {
  try {
    const hasProvisionalToken = !!getItem('provisionalAccessToken');
    const client = hasProvisionalToken ? provisionalApiClient : apiClient;

    const response = await client.patch<QuestInvitation>(
      `/invitations/${invitationId}`,
      { action: 'accept' }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to accept invitation:', error);
    throw error;
  }
}

/**
 * Decline a quest invitation
 */
export async function declineInvitation(
  invitationId: string
): Promise<QuestInvitation> {
  try {
    const hasProvisionalToken = !!getItem('provisionalAccessToken');
    const client = hasProvisionalToken ? provisionalApiClient : apiClient;

    const response = await client.patch<QuestInvitation>(
      `/invitations/${invitationId}`,
      { action: 'decline' }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to decline invitation:', error);
    throw error;
  }
}

/**
 * Get user's pending invitations
 */
export async function getPendingInvitations(): Promise<QuestInvitation[]> {
  try {
    const hasProvisionalToken = !!getItem('provisionalAccessToken');
    const client = hasProvisionalToken ? provisionalApiClient : apiClient;

    const response = await client.get<{ invitations: QuestInvitation[] }>(
      '/invitations/pending'
    );
    return response.data.invitations;
  } catch (error) {
    console.error('Failed to get pending invitations:', error);
    throw error;
  }
}

/**
 * Check if an invitation has expired
 */
export function isInvitationExpired(invitation: QuestInvitation): boolean {
  return Date.now() > invitation.expiresAt;
}

/**
 * Calculate time remaining for invitation (in seconds)
 */
export function getInvitationTimeRemaining(
  invitation: QuestInvitation
): number {
  const remaining = invitation.expiresAt - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

/**
 * Get active invitations for the current user
 */
export async function getActiveInvitations(): Promise<QuestInvitation[]> {
  try {
    const hasProvisionalToken = !!getItem('provisionalAccessToken');
    const client = hasProvisionalToken ? provisionalApiClient : apiClient;

    const response = await client.get<QuestInvitation[]>('/invitations/active');
    return response.data;
  } catch (error) {
    console.error('Failed to get active invitations:', error);
    throw error;
  }
}
