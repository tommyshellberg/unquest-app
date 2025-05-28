import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { verifyMagicLinkAndSignIn } from '@/api/auth';
import { Text, View } from '@/components/ui';
import { signOut } from '@/lib/auth';

export default function VerifyMagicLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      console.error('No token found in params:', params);
      router.replace({
        pathname: '/login',
        params: { error: 'No token found. Please try again.' },
      });
      return;
    }

    async function verifyToken() {
      try {
        // Call the comprehensive verification function
        const navigationTarget = await verifyMagicLinkAndSignIn(token);

        // Navigate based on the returned target
        if (navigationTarget === 'app') {
          console.log('[VerifyMagicLink] Navigating to app');
          router.replace('/(app)/');
        } else {
          console.log('[VerifyMagicLink] Navigating to onboarding');
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error verifying magic link:', error);

        // Explicitly sign out to clear any stale auth state
        signOut();

        setError(
          'Magic link verification failed. The link may have expired. Please try again.'
        );

        router.replace({
          pathname: '/login',
          params: {
            error:
              'Magic link verification failed. The link may have expired. Please try again.',
          },
        });
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token, router, params]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4">Verifying your login...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-center text-red-500">{error}</Text>
        <Text className="mt-4 text-center">Redirecting to login...</Text>
      </View>
    );
  }

  return null;
}
