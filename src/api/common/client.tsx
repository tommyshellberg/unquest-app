import { Env } from '@env';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { signOut } from '@/lib/auth';
import { getToken } from '@/lib/auth/utils';

import { refreshAccessToken } from '../auth';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: Env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing the token
let isRefreshing = false;
// Store pending requests using Promises for better handling
let failedQueue: {
  resolve: (token: string) => void;
  reject: (reason?: any) => void;
}[] = [];

// Extend the AxiosRequestConfig type to include our custom properties
interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Process the failed queue
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error || new Error('Token refresh failed'));
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// SIMPLIFIED Request Interceptor: Only attach the token
apiClient.interceptors.request.use(
  (config) => {
    const tokenData = getToken();
    console.log('tokenData', tokenData);
    const accessToken = tokenData?.access;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handles 401 and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomInternalAxiosRequestConfig;

    if (!error.response || !originalRequest) {
      console.error('Axios error without response or config:', error);
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            console.error('Refresh failed while request was queued:', err);
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Refreshing token');
        const newTokens = await refreshAccessToken();

        if (newTokens?.access?.token) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.access.token}`;

          processQueue(null, newTokens.access.token);

          return apiClient(originalRequest);
        } else {
          console.error(
            'Token refresh failed: No new access token string received.'
          );
          const refreshError = new Error(
            'Token refresh failed: No new access token string received.'
          );
          processQueue(refreshError);
          signOut();
          return Promise.reject(refreshError);
        }
      } catch (refreshError) {
        console.error('Token refresh failed catastrophically:', refreshError);
        processQueue(refreshError as Error);
        signOut();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
