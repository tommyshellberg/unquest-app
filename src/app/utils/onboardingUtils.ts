import { useCharacterStore } from "@/store/character-store";
import { useAccountStore } from "@/store/account-store";
import * as Notifications from "expo-notifications";

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
    const account = useAccountStore.getState().account;

    // Check notification permissions
    const { status } = await Notifications.getPermissionsAsync();

    return {
      hasCharacter: !!character,
      hasScreenTimeGoal: !!(
        account?.averageScreenTimeMinutes && account?.screenTimeGoalMinutes
      ),
      hasNotificationPermission: status === "granted",
    };
  } catch (error) {
    console.error("Error checking onboarding state:", error);
    return {
      hasCharacter: false,
      hasScreenTimeGoal: false,
      hasNotificationPermission: false,
    };
  }
}
