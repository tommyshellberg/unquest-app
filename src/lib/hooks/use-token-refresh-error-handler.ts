import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import * as Updates from 'expo-updates';

import { signOut } from '@/lib/auth';
import { getItem } from '@/lib/storage';

// Store the error handler globally so it can be called from anywhere
let globalErrorHandler: ((error: any) => void) | null = null;

export function handleTokenRefreshExhaustion(error: any) {
  if (globalErrorHandler) {
    globalErrorHandler(error);
  }
}

export function useTokenRefreshErrorHandler() {
  const router = useRouter();
  const alertShownRef = useRef(false);

  useEffect(() => {
    // Set up the error handler
    globalErrorHandler = (error: any) => {
      if (error?.code === 'TOKEN_REFRESH_EXHAUSTED' && !alertShownRef.current) {
        console.log('[TokenRefreshErrorHandler] Token refresh exhausted');
        alertShownRef.current = true;

        const isProvisionalUser = !!getItem('provisionalAccessToken');

        if (isProvisionalUser) {
          // For provisional users, show a friendly message and offer to retry
          Alert.alert(
            'Connection Issue',
            "We're having trouble connecting to the server. This might be a temporary network issue.",
            [
              {
                text: 'Try Again',
                onPress: async () => {
                  alertShownRef.current = false;
                  // In React Native, we can reload the app using expo-updates
                  if (Updates.isAvailable) {
                    await Updates.reloadAsync();
                  }
                },
              },
              {
                text: 'Start Over',
                onPress: async () => {
                  alertShownRef.current = false;
                  await signOut();
                  router.replace('/login');
                },
                style: 'destructive',
              },
            ],
            { cancelable: false }
          );
        } else {
          // For regular users, offer to sign in again
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please sign in again to continue.',
            [
              {
                text: 'Sign In',
                onPress: async () => {
                  alertShownRef.current = false;
                  await signOut();
                  router.replace('/login');
                },
              },
            ],
            { cancelable: false }
          );
        }
      }
    };

    // Reset alert flag when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        alertShownRef.current = false;
      }
    });

    return () => {
      globalErrorHandler = null;
      subscription.remove();
    };
  }, [router]);
}
