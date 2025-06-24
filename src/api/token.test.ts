import { getToken, removeToken, setToken } from '@/lib/auth/utils';
import { getItem, removeItem, setItem } from '@/lib/storage';

import {
  ACCESS_TOKEN_EXPIRY_KEY,
  ACCESS_TOKEN_KEY,
  AuthTokens,
  REFRESH_TOKEN_EXPIRY_KEY,
  REFRESH_TOKEN_KEY,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  removeTokens,
  storeTokens,
} from './token';

// Mock dependencies
jest.mock('@/lib/auth/utils');
jest.mock('@/lib/storage');

// Mock console methods
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('token.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constants', () => {
    it('should export correct storage keys', () => {
      expect(ACCESS_TOKEN_KEY).toBe('auth_access_token');
      expect(REFRESH_TOKEN_KEY).toBe('auth_refresh_token');
      expect(ACCESS_TOKEN_EXPIRY_KEY).toBe('auth_access_token_expiry');
      expect(REFRESH_TOKEN_EXPIRY_KEY).toBe('auth_refresh_token_expiry');
    });
  });

  describe('storeTokens', () => {
    it('should store tokens and expiry dates successfully', () => {
      const tokens: AuthTokens = {
        access: {
          token: 'access-token-123',
          expires: '2025-01-01T00:00:00Z',
        },
        refresh: {
          token: 'refresh-token-456',
          expires: '2025-02-01T00:00:00Z',
        },
      };

      storeTokens(tokens);

      expect(setToken).toHaveBeenCalledWith({
        access: 'access-token-123',
        refresh: 'refresh-token-456',
      });
      expect(setItem).toHaveBeenCalledWith(
        'access_token_expiry',
        '2025-01-01T00:00:00Z'
      );
      expect(setItem).toHaveBeenCalledWith(
        'refresh_token_expiry',
        '2025-02-01T00:00:00Z'
      );
    });

    it('should handle errors when storing tokens', () => {
      const error = new Error('Storage error');
      (setToken as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const tokens: AuthTokens = {
        access: {
          token: 'access-token',
          expires: '2025-01-01',
        },
        refresh: {
          token: 'refresh-token',
          expires: '2025-02-01',
        },
      };

      expect(() => storeTokens(tokens)).toThrow('Storage error');
      expect(console.error).toHaveBeenCalledWith(
        'Error storing tokens:',
        error
      );
    });

    it('should handle errors when storing expiry dates', () => {
      const error = new Error('Storage error');
      (setItem as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const tokens: AuthTokens = {
        access: {
          token: 'access-token',
          expires: '2025-01-01',
        },
        refresh: {
          token: 'refresh-token',
          expires: '2025-02-01',
        },
      };

      expect(() => storeTokens(tokens)).toThrow('Storage error');
      expect(console.error).toHaveBeenCalledWith(
        'Error storing tokens:',
        error
      );
    });
  });

  describe('getAccessToken', () => {
    it('should return access token when tokens exist', () => {
      (getToken as jest.Mock).mockReturnValue({
        access: 'access-token-123',
        refresh: 'refresh-token-456',
      });

      const result = getAccessToken();

      expect(getToken).toHaveBeenCalled();
      expect(result).toBe('access-token-123');
    });

    it('should return null when no tokens exist', () => {
      (getToken as jest.Mock).mockReturnValue(null);

      const result = getAccessToken();

      expect(result).toBeNull();
    });

    it('should return null when tokens exist but no access token', () => {
      (getToken as jest.Mock).mockReturnValue({
        refresh: 'refresh-token-456',
      });

      const result = getAccessToken();

      expect(result).toBeNull();
    });

    it('should return null and log error when getToken throws', () => {
      const error = new Error('Storage error');
      (getToken as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const result = getAccessToken();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error getting access token:',
        error
      );
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token when tokens exist', () => {
      (getToken as jest.Mock).mockReturnValue({
        access: 'access-token-123',
        refresh: 'refresh-token-456',
      });

      const result = getRefreshToken();

      expect(getToken).toHaveBeenCalled();
      expect(result).toBe('refresh-token-456');
    });

    it('should return null when no tokens exist', () => {
      (getToken as jest.Mock).mockReturnValue(null);

      const result = getRefreshToken();

      expect(result).toBeNull();
    });

    it('should return null when tokens exist but no refresh token', () => {
      (getToken as jest.Mock).mockReturnValue({
        access: 'access-token-123',
      });

      const result = getRefreshToken();

      expect(result).toBeNull();
    });

    it('should return null and log error when getToken throws', () => {
      const error = new Error('Storage error');
      (getToken as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const result = getRefreshToken();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error getting refresh token:',
        error
      );
    });
  });

  describe('isTokenExpired', () => {
    beforeEach(() => {
      // Mock Date.now() to a fixed timestamp
      jest
        .spyOn(Date, 'now')
        .mockReturnValue(new Date('2024-12-01T00:00:00Z').getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return true when no expiry date is stored', () => {
      (getItem as jest.Mock).mockReturnValue(null);

      const result = isTokenExpired();

      expect(getItem).toHaveBeenCalledWith('access_token_expiry');
      expect(result).toBe(true);
    });

    it('should return false when token is not expired', () => {
      // Token expires in the future
      (getItem as jest.Mock).mockReturnValue('2024-12-02T00:00:00Z');

      const result = isTokenExpired();

      expect(result).toBe(false);
    });

    it('should return true when token is expired', () => {
      // Token expired in the past
      (getItem as jest.Mock).mockReturnValue('2024-11-30T00:00:00Z');

      const result = isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return true when token expires within 10 second buffer', () => {
      // Token expires in 5 seconds (within 10 second buffer)
      (getItem as jest.Mock).mockReturnValue('2024-12-01T00:00:05Z');

      const result = isTokenExpired();

      expect(result).toBe(true);
    });

    it('should return false when token expires after 10 second buffer', () => {
      // Token expires in 15 seconds (outside 10 second buffer)
      (getItem as jest.Mock).mockReturnValue('2024-12-01T00:00:15Z');

      const result = isTokenExpired();

      expect(result).toBe(false);
    });

    it('should return false when expiry date is invalid (edge case)', () => {
      // This is an edge case - invalid dates result in NaN comparisons which are always false
      (getItem as jest.Mock).mockReturnValue('invalid-date');

      const result = isTokenExpired();

      expect(result).toBe(false);
    });

    it('should return true and log error when getItem throws', () => {
      const error = new Error('Storage error');
      (getItem as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const result = isTokenExpired();

      expect(result).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        'Error checking token expiry:',
        error
      );
    });
  });

  describe('removeTokens', () => {
    it('should remove all tokens and return true', () => {
      const result = removeTokens();

      expect(removeToken).toHaveBeenCalled();
      expect(removeItem).toHaveBeenCalledWith('access_token_expiry');
      expect(removeItem).toHaveBeenCalledWith('refresh_token_expiry');
      expect(result).toBe(true);
    });

    it('should return false and log error when removeToken throws', () => {
      const error = new Error('Storage error');
      (removeToken as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const result = removeTokens();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error removing tokens:',
        error
      );
    });

    it('should return false and log error when removeItem throws', () => {
      const error = new Error('Storage error');
      (removeItem as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const result = removeTokens();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error removing tokens:',
        error
      );
    });
  });
});
