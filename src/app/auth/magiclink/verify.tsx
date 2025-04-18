import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { verifyMagicLink } from '@/api/auth';
import { apiClient } from '@/api/common/client';
import { Text, View } from '@/components/ui';
import { useCharacterStore } from '@/store/character-store';
import { useUserStore } from '@/store/user-store';

export default function MagicLinkVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);

  const character = useCharacterStore((state) => state.character);
  const createCharacter = useCharacterStore((state) => state.createCharacter);

  // Replace account-store with user-store
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!token) {
      console.error('No token found in params:', params);
      router.replace(
        '/onboarding?error=' +
          encodeURIComponent('No token found. Please try again.')
      );
      return;
    }

    async function verifyToken() {
      try {
        // Call the auth service function to verify and store tokens
        const responseData = await verifyMagicLink(token);
        console.log('Token verification successful');

        // Check if user has character data locally
        const hasExistingData = !!character;

        // If no local data, try to fetch user data from server
        if (!hasExistingData) {
          console.log('No existing data, fetching user data');
          try {
            // Make sure this endpoint matches what your server expects
            const userResponse = await apiClient.get('/users/me');
            console.log('User data response:', userResponse.data);

            // Store user data in user store
            if (
              userResponse.data &&
              userResponse.data.id &&
              userResponse.data.email
            ) {
              setUser({
                id: userResponse.data.id,
                email: userResponse.data.email,
                name: userResponse.data.name,
                avatar: userResponse.data.avatar,
                createdAt: userResponse.data.createdAt,
              });
            }

            // Check if the response has character data with required fields
            if (
              userResponse.data &&
              userResponse.data.character &&
              userResponse.data.character.type &&
              userResponse.data.character.name
            ) {
              console.log(
                'User has character data on server:',
                userResponse.data.character
              );
              // Create character from server data
              const serverCharacter = userResponse.data.character;
              createCharacter(serverCharacter.type, serverCharacter.name);

              // User has complete character data on server, navigate to home
              console.log('Navigating to home with server character data');
              router.replace('/(app)/');
            } else {
              // No complete character data on server, navigate to app-introduction
              console.log(
                'No complete character data, navigating to app-introduction'
              );
              router.replace('/onboarding');
            }
          } catch (fetchError) {
            console.error('Error fetching user data:', fetchError);
            // If we can't fetch user data, go to app-introduction
            console.log(
              'Error fetching user data, navigating to app-introduction'
            );
            router.replace('/onboarding');
          }
        } else {
          // User already has local data, navigate to home
          console.log(
            'User already has local character data, navigating to home'
          );
          router.replace('/(app)/');
        }
      } catch (error) {
        console.error('Error verifying magic link:', error);
        router.replace(
          '/onboarding?error=' +
            encodeURIComponent(
              'Magic link verification failed. The link may have expired. Please try again.'
            )
        );
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token, router, params, character, user, createCharacter, setUser]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4">Verifying your login...</Text>
      </View>
    );
  }

  return null;
}
