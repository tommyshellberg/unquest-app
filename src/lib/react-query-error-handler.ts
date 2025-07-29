import { Alert } from 'react-native';

import { getItem } from '@/lib/storage';

export function handleQueryError(error: unknown) {
  console.error('[React Query Error]:', error);

  // Check if this is a token refresh exhaustion error
  if (
    error &&
    typeof error === 'object' &&
    (error as any).code === 'TOKEN_REFRESH_EXHAUSTED'
  ) {
    // Import and call the handler dynamically to avoid circular dependencies
    import('@/lib/hooks/use-token-refresh-error-handler').then(({ handleTokenRefreshExhaustion }) => {
      handleTokenRefreshExhaustion(error);
    }).catch(console.error);
    
    // Don't show additional alerts
    return;
  }

  // Handle other API errors
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;

    // Don't show alerts for 401s - they should trigger token refresh
    if (axiosError.response?.status === 401) {
      return;
    }

    // Show user-friendly error messages for other errors
    if (axiosError.response?.status >= 500) {
      Alert.alert(
        'Server Error',
        'Something went wrong on our end. Please try again later.',
        [{ text: 'OK' }]
      );
    } else if (!axiosError.response) {
      // Network error
      Alert.alert(
        'Connection Error',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  }
}

// Configuration for React Query
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      retry: (failureCount: number, error: any) => {
        // Don't retry on token refresh exhaustion
        if (error?.code === 'TOKEN_REFRESH_EXHAUSTED') {
          return false;
        }

        // Don't retry on 4xx errors (except 401 which is handled by interceptor)
        if (
          error?.response?.status &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          return false;
        }

        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      onError: handleQueryError,
    },
  },
};
