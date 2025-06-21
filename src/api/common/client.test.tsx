import { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { signOut } from '@/lib/auth';
import { getToken } from '@/lib/auth/utils';

import { refreshAccessToken } from '../auth';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/auth/utils');
jest.mock('../auth');

// We'll capture the interceptors when the module loads
let requestInterceptor: {
  onFulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  onRejected: (error: any) => Promise<any>;
};
let responseInterceptor: {
  onFulfilled: (response: any) => any;
  onRejected: (error: AxiosError) => Promise<any>;
};

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => {
    const instance = {
      interceptors: {
        request: {
          use: jest.fn((onFulfilled, onRejected) => {
            requestInterceptor = { onFulfilled, onRejected };
            return 1;
          }),
        },
        response: {
          use: jest.fn((onFulfilled, onRejected) => {
            responseInterceptor = { onFulfilled, onRejected };
            return 1;
          }),
        },
      },
      defaults: {
        baseURL: 'https://api.test.com',
        headers: { 'Content-Type': 'application/json' },
      },
    };
    
    // Make instance callable for retry logic
    return Object.assign(
      jest.fn().mockImplementation((config) => Promise.resolve({ data: 'retry success', config })),
      instance
    );
  }),
}));

// Import after mocks are set up
import { apiClient } from './client';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('request interceptor', () => {
    it('should add authorization header when token exists', () => {
      const mockToken = { access: 'test-access-token', refresh: 'test-refresh-token' };
      (getToken as jest.Mock).mockReturnValue(mockToken);

      const config: InternalAxiosRequestConfig = {
        headers: {} as any,
        method: 'get',
        url: '/test',
      };

      const result = requestInterceptor.onFulfilled(config);

      expect(result.headers.Authorization).toBe('Bearer test-access-token');
    });

    it('should not add authorization header when no token exists', () => {
      (getToken as jest.Mock).mockReturnValue(null);

      const config: InternalAxiosRequestConfig = {
        headers: {} as any,
        method: 'get',
        url: '/test',
      };

      const result = requestInterceptor.onFulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should handle request errors', async () => {
      const error = new Error('Request error');
      await expect(requestInterceptor.onRejected(error)).rejects.toThrow('Request error');
    });
  });

  describe('response interceptor', () => {
    it('should pass through successful responses', () => {
      const response = { data: 'success', status: 200 };
      const result = responseInterceptor.onFulfilled(response);
      expect(result).toEqual(response);
    });

    it('should handle errors without response', async () => {
      const error = new Error('Network error') as AxiosError;
      await expect(responseInterceptor.onRejected(error)).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith(
        'Axios error without response or config:',
        error
      );
    });

    it('should handle errors without config', async () => {
      const error = {
        response: { status: 500, data: 'Server error' },
      } as AxiosError;
      await expect(responseInterceptor.onRejected(error)).rejects.toEqual(error);
    });

    it('should pass through non-401 errors', async () => {
      const error = {
        response: { status: 400, data: 'Bad request' },
        config: { url: '/test' },
      } as AxiosError;
      await expect(responseInterceptor.onRejected(error)).rejects.toEqual(error);
    });

    describe('401 error handling', () => {
      it('should refresh token and retry request on first 401', async () => {
        const mockNewTokens = {
          access: { token: 'new-access-token', expires: '2025-01-01' },
          refresh: { token: 'new-refresh-token', expires: '2025-02-01' },
        };
        (refreshAccessToken as jest.Mock).mockResolvedValue(mockNewTokens);

        const originalConfig = {
          url: '/test',
          headers: { Authorization: 'Bearer old-token' },
        } as any;

        const error = {
          response: { status: 401 },
          config: originalConfig,
        } as AxiosError;

        const result = await responseInterceptor.onRejected(error);

        expect(refreshAccessToken).toHaveBeenCalled();
        expect(originalConfig.headers.Authorization).toBe('Bearer new-access-token');
        expect(originalConfig._retry).toBe(true);
        expect(result).toEqual({ data: 'retry success', config: originalConfig });
      });

      it('should not retry if request already has _retry flag', async () => {
        const originalConfig = {
          url: '/test',
          headers: { Authorization: 'Bearer old-token' },
          _retry: true,
        } as any;

        const error = {
          response: { status: 401 },
          config: originalConfig,
        } as AxiosError;

        await expect(responseInterceptor.onRejected(error)).rejects.toEqual(error);
        expect(refreshAccessToken).not.toHaveBeenCalled();
      });

      it('should sign out when refresh fails', async () => {
        (refreshAccessToken as jest.Mock).mockRejectedValue(new Error('Refresh failed'));

        const originalConfig = {
          url: '/test',
          headers: { Authorization: 'Bearer old-token' },
        } as any;

        const error = {
          response: { status: 401 },
          config: originalConfig,
        } as AxiosError;

        await expect(responseInterceptor.onRejected(error)).rejects.toThrow('Refresh failed');
        expect(signOut).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
          'Token refresh failed catastrophically:',
          expect.any(Error)
        );
      });

      it('should sign out when refresh returns no token', async () => {
        (refreshAccessToken as jest.Mock).mockResolvedValue(null);

        const originalConfig = {
          url: '/test',
          headers: { Authorization: 'Bearer old-token' },
        } as any;

        const error = {
          response: { status: 401 },
          config: originalConfig,
        } as AxiosError;

        await expect(responseInterceptor.onRejected(error)).rejects.toThrow(
          'Token refresh failed: No new access token string received.'
        );
        expect(signOut).toHaveBeenCalled();
      });

      it('should sign out when refresh returns invalid token structure', async () => {
        (refreshAccessToken as jest.Mock).mockResolvedValue({
          access: {}, // Missing token property
          refresh: { token: 'refresh-token' },
        });

        const originalConfig = {
          url: '/test',
          headers: { Authorization: 'Bearer old-token' },
        } as any;

        const error = {
          response: { status: 401 },
          config: originalConfig,
        } as AxiosError;

        await expect(responseInterceptor.onRejected(error)).rejects.toThrow(
          'Token refresh failed: No new access token string received.'
        );
        expect(signOut).toHaveBeenCalled();
      });

      it('should process queue correctly', async () => {
        // Test the queue behavior by calling the interceptor twice rapidly
        const mockNewTokens = {
          access: { token: 'new-access-token', expires: '2025-01-01' },
          refresh: { token: 'new-refresh-token', expires: '2025-02-01' },
        };

        let refreshResolve: (value: any) => void;
        const refreshPromise = new Promise((resolve) => {
          refreshResolve = resolve;
        });
        (refreshAccessToken as jest.Mock).mockReturnValue(refreshPromise);

        const config1 = {
          url: '/test1',
          headers: { Authorization: 'Bearer old-token' },
        } as any;

        const config2 = {
          url: '/test2',
          headers: { Authorization: 'Bearer old-token' },
        } as any;

        const error1 = {
          response: { status: 401 },
          config: config1,
        } as AxiosError;

        const error2 = {
          response: { status: 401 },
          config: config2,
        } as AxiosError;

        // Start both requests
        const promise1 = responseInterceptor.onRejected(error1);
        const promise2 = responseInterceptor.onRejected(error2);

        // Only one refresh should be triggered
        expect(refreshAccessToken).toHaveBeenCalledTimes(1);

        // Resolve the refresh
        refreshResolve!(mockNewTokens);

        // Both should succeed
        const [result1, result2] = await Promise.all([promise1, promise2]);
        
        expect(config1.headers.Authorization).toBe('Bearer new-access-token');
        expect(config2.headers.Authorization).toBe('Bearer new-access-token');
        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
      });

      it('should handle queue rejection', async () => {
        let refreshReject: (reason: any) => void;
        const refreshPromise = new Promise((_, reject) => {
          refreshReject = reject;
        });
        (refreshAccessToken as jest.Mock).mockReturnValue(refreshPromise);

        const config1 = {
          url: '/test1',
          headers: { Authorization: 'Bearer old-token' },
        } as any;

        const error1 = {
          response: { status: 401 },
          config: config1,
        } as AxiosError;

        const promise1 = responseInterceptor.onRejected(error1);

        // Reject the refresh
        const refreshError = new Error('Refresh failed');
        refreshReject!(refreshError);

        await expect(promise1).rejects.toThrow('Refresh failed');
        expect(signOut).toHaveBeenCalled();
      });
    });
  });

  describe('exported apiClient', () => {
    it('should export the configured axios instance', () => {
      expect(apiClient).toBeDefined();
      expect(apiClient.interceptors).toBeDefined();
      expect(apiClient.defaults.baseURL).toBe('https://api.test.com');
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });
});