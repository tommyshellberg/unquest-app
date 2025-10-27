/**
 * Profile Screen Custom Hooks
 *
 * Extracted from profile.tsx to separate concerns and improve testability.
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { getItem } from '@/lib/storage';
import { useCharacterStore } from '@/store/character-store';
import type { CharacterType } from '@/store/types';

import { CHARACTER_SYNC } from './profile-constants';
import type { UserWithLegacyCharacter } from './profile-types';

/**
 * Custom hook to sync character data from server when user has no local character
 *
 * This handles the case where verified users return to the app and need to restore
 * their character data from the server, or provisional users need to be redirected
 * to onboarding.
 *
 * @returns isRedirecting - True if user is being redirected to onboarding
 */
export function useCharacterSync() {
  const router = useRouter();
  const character = useCharacterStore((state) => state.character);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!character && !isRedirecting) {
      const syncCharacterFromUser = async () => {
        try {
          const { getUserDetails } = await import('@/lib/services/user');
          const user: UserWithLegacyCharacter = await getUserDetails();

          // Check if user has character data at the top level (legacy format)
          const hasLegacyCharacterData =
            user?.type && user?.name && user?.level !== undefined;

          if (hasLegacyCharacterData) {
            // Create character from user data
            const characterStore = useCharacterStore.getState();
            characterStore.createCharacter(
              user.type as CharacterType,
              user.name!
            );

            // Update with level and XP data
            const level = user.level || 1;

            characterStore.updateCharacter({
              type: user.type!,
              name: user.name!,
              level,
              currentXP: user.xp || 0,
            });

            // Update streak if available
            if (user.dailyQuestStreak !== undefined) {
              characterStore.setStreak(user.dailyQuestStreak);
            }
          } else {
            // Only redirect to onboarding if this is truly a new user
            // Check for provisional data to determine if they're in onboarding
            const hasProvisionalData = !!(
              getItem('provisionalUserId') ||
              getItem('provisionalAccessToken') ||
              getItem('provisionalEmail')
            );

            if (hasProvisionalData) {
              // User is in onboarding flow, redirect to choose character
              setIsRedirecting(true);
              setTimeout(() => {
                router.replace('/onboarding/choose-character');
              }, CHARACTER_SYNC.redirectDelay);
            }
            // For verified users without character data, we'll show a message
            // rather than redirecting to onboarding
          }
        } catch (error) {
          // TODO: Replace console.error with logger service
          console.error('Error syncing character data:', error);
        }
      };

      syncCharacterFromUser();
    }
  }, [character, router, isRedirecting]);

  return { isRedirecting };
}
