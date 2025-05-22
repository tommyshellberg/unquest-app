import { Env } from '@env';
import axios from 'axios';

import { getItem, removeItem } from '@/lib/storage';

import { apiClient } from './common';
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
    console.log('provisionalId from storage:', provisionalIdFromStorage);
    const body: { email: string; provisionalId?: string } = { email };

    // Only add provisionalId if it's a non-empty string
    if (
      typeof provisionalIdFromStorage === 'string' &&
      provisionalIdFromStorage.length > 0
    ) {
      body.provisionalId = provisionalIdFromStorage;
    }

    const response = await authClient.post('/auth/magiclink', body);
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
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await tokenService.getAccessToken();
  return !!token;
};

/**
 * Clear all authentication data
 */
export const logout = async (): Promise<void> => {
  try {
    await tokenService.removeTokens();
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
      const refreshToken = tokenService.getRefreshToken();
      if (!refreshToken) {
        return null;
      }

      const response = await apiClient.post('/auth/refresh-tokens', {
        refreshToken,
      });

      // The server now returns nested tokens consistently:
      // { access: { token, expires }, refresh: { token, expires } }
      const newTokens: tokenService.AuthTokens = response.data;
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
