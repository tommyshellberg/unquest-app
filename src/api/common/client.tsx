import { Env } from '@env';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { refreshAccessToken } from '../auth';
import { getAccessToken, getRefreshToken, isTokenExpired } from '../token';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: Env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing the token
let isRefreshing = false;
// Store pending requests
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

// Extend the AxiosRequestConfig type to include our custom properties
interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Process the failed queue
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Updated request interceptor: now checks token expiry before refreshing
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Retrieve the stored access token and check if it's expired
      const accessToken = await getAccessToken();
      const tokenExpired = !accessToken || (await isTokenExpired());
      let token = accessToken;

      // Only refresh token if missing or expired
      if (tokenExpired) {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          const tokens = await refreshAccessToken();
          token = tokens?.access.token ?? null;
        }
      }

      // If we have a valid token now, set it on the headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('No authentication available, continuing without token');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomInternalAxiosRequestConfig;
    if (!originalRequest) {
      return Promise.reject(error);
    }
    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newTokens = await refreshAccessToken();
        if (newTokens?.access.token) {
          // Update the request with the new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.access.token}`;

          // Process any queued requests
          processQueue(null, newTokens.access.token);

          // Retry the original request
          return apiClient(originalRequest);
        } else {
          processQueue(new Error('Token refresh failed'));
          return Promise.reject(new Error('Token refresh failed'));
        }
      } catch (refreshError) {
        processQueue(refreshError as Error);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
