import * as Notifications from 'expo-notifications';

import { getItem } from '@/lib/storage';
import { useCharacterStore } from '@/store/character-store';
import { useOnboardingStore } from '@/store/onboarding-store';

export interface OnboardingState {
  hasCharacter: boolean;
  hasNotificationPermission: boolean;
  hasCompletedFirstQuest: boolean;
  hasSeenSignupPrompt: boolean;
  hasProvisionalAccount: boolean;
}

export async function checkOnboardingState(): Promise<OnboardingState> {
  try {
    // Check for character data
    const character = useCharacterStore.getState().character;

    // Check notification permissions
    const { status } = await Notifications.getPermissionsAsync();

    // Check onboarding progress
    const onboardingStore = useOnboardingStore.getState();

    // Check for provisional account
    const provisionalUserId = getItem('provisionalUserId');

    return {
      hasCharacter: !!character,
      hasNotificationPermission: status === 'granted',
      hasCompletedFirstQuest: onboardingStore.hasCompletedFirstQuest(),
      hasSeenSignupPrompt: onboardingStore.hasSeenSignupPrompt(),
      hasProvisionalAccount: !!provisionalUserId,
    };
  } catch (error) {
    console.error('Error checking onboarding state:', error);
    return {
      hasCharacter: false,
      hasNotificationPermission: false,
      hasCompletedFirstQuest: false,
      hasSeenSignupPrompt: false,
      hasProvisionalAccount: false,
    };
  }
}
