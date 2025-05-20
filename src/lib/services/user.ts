import { v4 as uuidv4 } from 'uuid';

import { logout } from '@/api/auth';
import { apiClient } from '@/api/common/client';
import { setItem } from '@/lib/storage';
import type { Character } from '@/store/types';

export interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  // Add other user fields as needed
}

export interface FriendCharacter {
  _id: string;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  type: string;
  name: string;
}

export interface FriendDetails {
  _id: string;
  email: string;
  isEmailVerified: boolean;
  friends: string[];
  pendingFriends: string[];
  character: FriendCharacter;
  dailyQuestStreak: number;
}

export interface FriendsResponse {
  count: number;
  friends: FriendDetails[];
}

export interface InvitationUser {
  character: {
    level: number;
    currentXP: number;
    _id: string;
    xpToNextLevel?: number;
    type: string;
    name: string;
  } | null;
  email: string;
  id: string;
}

export interface Invitation {
  recipientUser: InvitationUser | null;
  status: string;
  resendAttempts: number;
  sender: InvitationUser;
  recipient: string;
  id: string;
}

export interface InvitationsResponse {
  results: Invitation[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

// @TODO: check if we need this, particularly the automatic logout.
export const getUserDetails = async (): Promise<UserDetails> => {
  try {
    const response = await apiClient.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);

    // If the error is authentication-related and token refresh failed,
    // we should log the user out
    if (error instanceof Error && error.message === 'Token refresh failed') {
      await logout();
      // You might want to navigate to the login screen here
      // or emit an event that the app can listen to
    }

    throw error;
  }
};

/**
 * Update the current user's character on the server.
 * This sends a PATCH request to '/me/' with the updated character data.
 */
export async function updateUserCharacter(character: Character): Promise<any> {
  const response = await apiClient.patch('users/me/', { character });
  return response.data;
}

/**
 * Get the user's friends list with pagination
 * @param page Page number (starts at 1)
 * @param pageSize Number of friends per page
 * @returns List of friends with count
 */
export async function getUserFriends(
  page: number = 1,
  pageSize: number = 10
): Promise<FriendsResponse> {
  try {
    const response = await apiClient.get('/users/friends', {
      params: {
        page,
        page_size: pageSize,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user friends:', error);
    throw error;
  }
}

/**
 * Send a friend invitation to a user by email address
 * @param email Email address of the user to invite
 * @returns Response with invitation details
 */
export async function sendFriendInvite(email: string): Promise<{
  message: string;
  invitation: {
    sender: string;
    recipient: string;
    recipientUser: string | null;
    status: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
  };
}> {
  try {
    const response = await apiClient.post('/users/invites', { email });
    return response.data;
  } catch (error) {
    console.error('Error sending friend invitation:', error);
    throw error;
  }
}

/**
 * Get friend invitations (both sent and received)
 * @param status Filter invitations by status (e.g., 'pending', 'accepted', 'rejected')
 * @param page Page number for pagination
 * @param limit Number of results per page
 * @returns List of invitations matching the criteria
 */
export async function getUserInvitations(
  status?: string,
  page?: number,
  limit?: number
): Promise<InvitationsResponse> {
  try {
    const params: Record<string, any> = {};

    if (status) {
      params.status = status;
    }

    if (page) {
      params.page = page;
    }

    if (limit) {
      params.limit = limit;
    }

    const response = await apiClient.get('/users/invites', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching user invitations:', error);
    throw error;
  }
}

/**
 * Accept a friend invitation
 * @param invitationId ID of the invitation to accept
 * @returns Response with updated invitation details
 */
export async function acceptFriendInvitation(invitationId: string): Promise<{
  message: string;
  invitation: {
    recipientUser: string;
    status: string;
    sender: string;
    recipient: string;
    id: string;
  };
}> {
  try {
    const response = await apiClient.patch(
      `/users/invites/${invitationId}/accept`
    );
    return response.data;
  } catch (error) {
    console.error('Error accepting friend invitation:', error);
    throw error;
  }
}

/**
 * Reject a friend invitation
 * @param invitationId ID of the invitation to reject
 * @returns Response with updated invitation details
 */
export async function rejectFriendInvitation(invitationId: string): Promise<{
  message: string;
  invitation: {
    recipientUser: string;
    status: string;
    resendAttempts: number;
    sender: string;
    recipient: string;
    id: string;
  };
}> {
  try {
    const response = await apiClient.patch(
      `/users/invites/${invitationId}/reject`
    );
    return response.data;
  } catch (error) {
    console.error('Error rejecting friend invitation:', error);
    throw error;
  }
}

/**
 * Remove a friend from the user's friends list
 * @param friendId ID of the friend to remove
 * @returns Response with success message
 */
export async function removeFriend(friendId: string): Promise<{
  message: string;
  success: boolean;
}> {
  try {
    const response = await apiClient.delete(`/users/friends/${friendId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
}

/**
 * Rescind (cancel) a friend invitation that the current user has sent
 * @param inviteId ID of the invitation to rescind
 * @returns Response with success message
 */
export async function rescindInvitation(inviteId: string): Promise<{
  message: string;
  success: boolean;
}> {
  try {
    const response = await apiClient.delete(
      `/users/invites/${inviteId}/rescind`
    );
    return response.data;
  } catch (error) {
    console.error('Error rescinding invitation:', error);
    throw error;
  }
}

/**
 * Delete the current user's account
 * @returns Response with success message
 */
export async function deleteUserAccount(): Promise<{
  message: string;
  success: boolean;
}> {
  try {
    const response = await apiClient.delete('/users/me');
    return response.data;
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}

/**
 * Create a provisional user account with the selected character
 * @param character Character details to associate with the provisional user
 * @returns The created provisional user data
 */
export async function createProvisionalUser(
  character: Character
): Promise<any> {
  try {
    // Generate a provisional email using UUID
    const provisionalEmail = `${uuidv4()}@unquestapp.com`;

    // Store the email in local storage
    setItem('provisionalEmail', provisionalEmail);

    const response = await apiClient.post('/users/provisional', {
      character,
      email: provisionalEmail,
    });

    console.log('response data', response.data);

    // Store the user ID and tokens
    console.log('setting provisional user id', response.data.user.id);
    setItem('provisionalUserId', response.data.user.id);

    // Store the access token separately from regular auth tokens
    if (response.data.tokens?.access?.token) {
      console.log(
        'setting provisional access token',
        response.data.tokens.access.token
      );
      setItem('provisionalAccessToken', response.data.tokens.access.token);
    }

    return response.data.user;
  } catch (error) {
    // If email is taken, we can indicate it for special handling
    if (error.response?.data?.message === 'Email already taken') {
      throw new Error('PROVISIONAL_EMAIL_TAKEN');
    }
    throw error;
  }
}
