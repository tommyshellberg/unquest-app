import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';

import { signOut } from '@/lib/auth';

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

        Alert.alert(
          'Session Expired',
          'Your session has expired. Please sign in again to continue.',
          [
            {
              text: 'Sign In',
              onPress: () => {
                alertShownRef.current = false;
                signOut();
                router.replace('/login');
              },
            },
          ],
          { cancelable: false }
        );
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
