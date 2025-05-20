import * as Notifications from 'expo-notifications';

import { useCharacterStore } from '@/store/character-store';

export interface OnboardingState {
  hasCharacter: boolean;
  hasNotificationPermission: boolean;
}

export async function checkOnboardingState(): Promise<OnboardingState> {
  try {
    // Check for character data
    const character = useCharacterStore.getState().character;

    // Check notification permissions
    const { status } = await Notifications.getPermissionsAsync();

    return {
      hasCharacter: !!character,
      hasNotificationPermission: status === 'granted',
    };
  } catch (error) {
    console.error('Error checking onboarding state:', error);
    return {
      hasCharacter: false,
      hasNotificationPermission: false,
    };
  }
}
