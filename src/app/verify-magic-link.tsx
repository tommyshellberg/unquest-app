import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { verifyMagicLink } from '@/api/auth';
import { Text, View } from '@/components/ui';
import { signIn } from '@/lib/auth';

export default function VerifyMagicLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      console.error('No token found in params:', params);
      router.replace(
        '/login?error=' +
          encodeURIComponent('No token found. Please try again.')
      );
      return;
    }

    async function verifyToken() {
      try {
        // Call the auth service function to verify and get tokens
        const tokens = await verifyMagicLink(token);
        console.log('Token verification successful');

        // Call signIn with the received tokens
        signIn({
          token: {
            access: tokens.access.token,
            refresh: tokens.refresh.token,
          },
        });

        // Navigate to the main app screen or appropriate next screen
        router.replace('/');
      } catch (error) {
        console.error('Error verifying magic link:', error);
        setError(
          'Magic link verification failed. The link may have expired. Please try again.'
        );

        // @todo: check this behavior in a test somehow.
        router.replace(
          '/login?error=' +
            encodeURIComponent(
              'Magic link verification failed. The link may have expired. Please try again.'
            )
        );
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
