import { Env } from '@env';
import axios from 'axios';

import { signIn } from '@/lib/auth';
import { getUserDetails } from '@/lib/services/user';
import { getItem, removeItem } from '@/lib/storage';
import { useCharacterStore } from '@/store/character-store';
import { useUserStore } from '@/store/user-store';

import * as tokenService from './token';

// Create a separate axios instance for auth requests to avoid circular dependencies
export const authClient = axios.create({
  baseURL: Env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface RegisterResponse {
  user: User;
  tokens: tokenService.AuthTokens;
}

/**
 * Request a magic link for authentication
 */
export const requestMagicLink = async (email: string): Promise<void> => {
  try {
    const provisionalIdFromStorage = getItem('provisionalUserId');
    const provisionalToken = getItem('provisionalAccessToken');

    console.log('provisionalId from storage:', provisionalIdFromStorage);
    console.log('provisionalToken exists:', !!provisionalToken);

    const body: { email: string; provisionalId?: string } = { email };

    // Only add provisionalId if it's a non-empty string
    if (
      typeof provisionalIdFromStorage === 'string' &&
      provisionalIdFromStorage.length > 0
    ) {
      body.provisionalId = provisionalIdFromStorage;
    }

    // Prepare headers - manually add Authorization for provisional token
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };

    if (typeof provisionalToken === 'string' && provisionalToken.length > 0) {
      headers.Authorization = `Bearer ${provisionalToken}`;
      console.log(
        'Adding Bearer token for provisional user:',
        provisionalToken.substring(0, 20) + '...'
      );
    }

    // Use authClient with manual headers for provisional tokens
    const response = await authClient.post('/auth/magiclink', body, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Magic link request error:', error);
    throw error;
  }
};

/**
 * Verify a magic link token and authenticate the user
 */
export const verifyMagicLink = async (
  token: string
): Promise<tokenService.AuthTokens> => {
  try {
    // throw error if token is not a string
    if (typeof token !== 'string') {
      throw new Error('Token is not a string');
    }
    const response = await authClient.get(
      `/auth/magiclink/verify?token=${token}`
    );
    // Expect the API to return tokens in the nested format:
    // { access: { token: string, expires: string }, refresh: { token: string, expires: string } }
    tokenService.storeTokens(response.data);

    // Clear provisional user data after successful authentication
    removeItem('provisionalAccessToken');
    removeItem('provisionalUserId');
    removeItem('provisionalEmail');
    console.log('Cleared provisional user data after successful login');

    return response.data;
  } catch (error) {
    console.error('Magic link verification error:', error);
    throw error;
  }
};

/**
 * Comprehensive magic link verification that includes user fetching and auth store updates
 * Returns navigation target: 'onboarding' | 'app'
 */
export const verifyMagicLinkAndSignIn = async (
  token: string
): Promise<'onboarding' | 'app'> => {
  try {
    // Step 1: Verify the magic link and store tokens
    const tokens = await verifyMagicLink(token);

    // Step 2: Update auth store with proper signIn call
    signIn({
      token: {
        access: tokens.access.token,
        refresh: tokens.refresh.token,
      },
    });

    // Step 3: Check if user has existing character data locally
    const character = useCharacterStore.getState().character;
    const hasExistingData = !!character;

    if (hasExistingData) {
      // User already has local data, navigate to home
      console.log(
        '[Auth] User already has local character data, navigating to app'
      );
      return 'app';
    }

    // Step 4: Fetch user data from server
    try {
      const userResponse = await getUserDetails();

      // Store user data in user store (using only available properties)
      if (userResponse && userResponse.id && userResponse.email) {
        useUserStore.getState().setUser({
          id: userResponse.id,
          email: userResponse.email,
          name: userResponse.name,
        });
      }

      // For now, assume no character data comes from getUserDetails
      // If character data is available from a different endpoint, we can add that logic later
      console.log(
        '[Auth] User data fetched, no character data available, navigating to onboarding'
      );
      return 'onboarding';
    } catch (fetchError) {
      console.error(
        'Error fetching user data during verification:',
        fetchError
      );
      // If we can't fetch user data, go to onboarding
      console.log('[Auth] Failed to fetch user data, navigating to onboarding');
      return 'onboarding';
    }
  } catch (error) {
    console.error('Magic link verification failed:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = tokenService.getAccessToken();
  return !!token;
};

/**
 * Clear all authentication data
 */
export const logout = (): void => {
  try {
    tokenService.removeTokens();
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

/**
 * Refresh the access token using the refresh token
 */
export const refreshAccessToken =
  async (): Promise<tokenService.AuthTokens | null> => {
    try {
      console.log('refreshing access token');
      const refreshToken = tokenService.getRefreshToken();
      console.log('refreshToken', refreshToken);
      if (!refreshToken) {
        return null;
      }

      const response = await authClient.post('/auth/refresh-tokens', {
        refreshToken,
      });

      // The server now returns nested tokens consistently:
      // { access: { token, expires }, refresh: { token, expires } }
      const newTokens: tokenService.AuthTokens = response.data;
      console.log('newTokens', newTokens);
      tokenService.storeTokens(newTokens);
      return newTokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, clear tokens
      tokenService.removeTokens();
      return null;
    }
  };

/**
 * Remove all tokens (alias for backward compatibility)
 */
export const removeTokens = tokenService.removeTokens;

// Re-export token types for backward compatibility
export type { AuthTokens } from '@/api/token';
