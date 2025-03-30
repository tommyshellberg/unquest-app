import { getToken, removeToken, setToken } from '@/lib/auth/utils';
import { getItem, removeItem, setItem } from '@/lib/storage';

// Keys for secure storage
export const ACCESS_TOKEN_KEY = 'auth_access_token';
export const REFRESH_TOKEN_KEY = 'auth_refresh_token';
export const ACCESS_TOKEN_EXPIRY_KEY = 'auth_access_token_expiry';
export const REFRESH_TOKEN_EXPIRY_KEY = 'auth_refresh_token_expiry';

// Types: now tokens are nested as returned by the server.
export interface AuthTokens {
  access: {
    token: string;
    expires: string;
  };
  refresh: {
    token: string;
    expires: string;
  };
}

/**
 * Store authentication tokens securely
 */
export const storeTokens = async (tokens: AuthTokens): Promise<void> => {
  console.log('Storing tokens:', tokens);
  try {
    // Convert the structure to match what our utils expect
    await setToken({
      access: tokens.access.token,
      refresh: tokens.refresh.token,
    });

    // Store token expiry in the same format (using the same MMKV storage)
    await setItem('access_token_expiry', tokens.access.expires);
    await setItem('refresh_token_expiry', tokens.refresh.expires);
  } catch (error) {
    console.error('Error storing tokens:', error);
    throw error;
  }
};

/**
 * Get the stored access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const tokens = getToken();
    return tokens?.access ?? null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Get the stored refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const tokens = getToken();
    return tokens?.refresh ?? null;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Check if the access token is expired
 */
export const isTokenExpired = async (): Promise<boolean> => {
  try {
    const expiryString = getItem<string>('access_token_expiry');
    if (!expiryString) return true;

    const expiryDate = new Date(expiryString);
    // Add a small buffer (e.g., 10 seconds) to account for network latency
    const now = new Date(Date.now() + 10000);
    return now >= expiryDate;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true; // Assume expired on error
  }
};

/**
 * Remove all tokens from secure storage
 */
export const removeTokens = async (): Promise<boolean> => {
  try {
    await removeToken();
    await removeItem('access_token_expiry');
    await removeItem('refresh_token_expiry');
    return true;
  } catch (error) {
    console.error('Error removing tokens:', error);
    return false;
  }
};
