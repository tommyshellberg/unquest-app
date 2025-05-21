import { router } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import React, { useCallback, useEffect } from 'react';
import { Image } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
} from 'react-native-reanimated';

import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { useOnboardingStore } from '@/store/onboarding-store';
import { OnboardingStep } from '@/store/onboarding-store';

export default function QuestCompletedSignupScreen() {
  const posthog = usePostHog();
  const setOnboardingStep = useOnboardingStore((state) => state.setCurrentStep);
  const currentStep = useOnboardingStore((state) => state.currentStep);

  useEffect(() => {
    console.log(
      'QuestCompletedSignupScreen mounted, current step:',
      currentStep
    );
    posthog.capture('first_quest_completed_signup_screen_viewed');
  }, [posthog, currentStep]);

  const handleCreateAccount = useCallback(() => {
    console.log('Create account button pressed, setting step to COMPLETED');
    posthog.capture('first_quest_completed_signup_cta_clicked');

    // Important: Update the onboarding step to COMPLETED when navigating to login
    // This prevents further redirects back to the signup screen
    setOnboardingStep(OnboardingStep.COMPLETED);

    // Use replace instead of push to avoid navigation stack issues
    // Small delay to ensure the state is updated before navigation
    setTimeout(() => {
      router.replace('/login');
    }, 100);
  }, [posthog, setOnboardingStep]);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      <View className="absolute inset-0">
        <Image
          source={require('@/../assets/images/background/onboarding.jpg')}
          className="size-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-white/10" />
      </View>

      <View className="flex-1 justify-between p-6">
        <View className="mt-2">
          <Animated.View entering={FadeInLeft.delay(100)}>
            <Text className="text-xl font-bold">Claim Your Legend</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)}>
            <Text className="mb-2 font-semibold text-white">
              You've completed your first quest—Vaedros already feels safer!
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1100)}>
            <Text className="mb-4">
              Create a free account to keep your hero's story alive and unlock
              the realm's social magic.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1600)}>
            <Text className="mb-4 text-lg font-semibold">
              Create an account to:
            </Text>
            <Text className="mb-2 ml-4">
              • Save your progress and continue your story
            </Text>
            <Text className="mb-2 ml-4">
              • Unlock the ability to add friends
            </Text>
            <Text className="mb-2 ml-4">
              • Join guilds and participate in cooperative quests(coming soon)
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(2100)}>
            <Text className="my-4">
              Your hero is currently stored on this device only. Secure the
              journey now and pick up right where you left off—anywhere,
              anytime.
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(2600)} className="mb-6">
          <Button
            label="Create Account"
            onPress={handleCreateAccount}
            accessibilityLabel="Create Account"
            className="bg-primary-500"
            textClassName="text-white font-bold"
          />
        </Animated.View>
      </View>
    </View>
  );
}
