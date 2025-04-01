import * as Notifications from 'expo-notifications';

import { useCharacterStore } from '@/store/character-store';
import { useUserStore } from '@/store/user-store';

export interface OnboardingState {
  hasCharacter: boolean;
  hasScreenTimeGoal: boolean;
  hasNotificationPermission: boolean;
}

export async function checkOnboardingState(): Promise<OnboardingState> {
  try {
    // Check for character data
    const character = useCharacterStore.getState().character;

    // Check for screen time goals
    const user = useUserStore.getState().user;

    // Check notification permissions
    const { status } = await Notifications.getPermissionsAsync();

    return {
      hasCharacter: !!character,
      hasScreenTimeGoal: !!(
        user?.screenTimeGoals?.currentTime && user?.screenTimeGoals?.targetTime
      ),
      hasNotificationPermission: status === 'granted',
    };
  } catch (error) {
    console.error('Error checking onboarding state:', error);
    return {
      hasCharacter: false,
      hasScreenTimeGoal: false,
      hasNotificationPermission: false,
    };
  }
}
