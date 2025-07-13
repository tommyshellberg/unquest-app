import { router } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { Image } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
} from 'react-native-reanimated';

import {
  Button,
  FocusAwareStatusBar,
  ScreenContainer,
  Text,
  View,
} from '@/components/ui';
import { useOnboardingStore } from '@/store/onboarding-store';
import { OnboardingStep } from '@/store/onboarding-store';

export default function QuestCompletedSignupScreen() {
  const setOnboardingStep = useOnboardingStore((state) => state.setCurrentStep);
  const currentStep = useOnboardingStore((state) => state.currentStep);

  useEffect(() => {
    // set the current step to VIEWING_SIGNUP_PROMPT if it's not already VIEWING_SIGNUP_PROMPT or COMPLETED
    if (
      currentStep !== OnboardingStep.VIEWING_SIGNUP_PROMPT &&
      currentStep !== OnboardingStep.COMPLETED
    ) {
      setOnboardingStep(OnboardingStep.VIEWING_SIGNUP_PROMPT);
    }
  }, [currentStep, setOnboardingStep]);

  const handleCreateAccount = useCallback(() => {
    console.log('Create account button pressed, setting step to COMPLETED');

    // Important: Update the onboarding step to COMPLETED when navigating to login
    // This prevents further redirects back to the signup screen
    setOnboardingStep(OnboardingStep.COMPLETED);

    // Use replace instead of push to avoid navigation stack issues
    // Small delay to ensure the state is updated before navigation
    setTimeout(() => {
      router.replace('/login');
    }, 100);
  }, [setOnboardingStep]);

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

      <ScreenContainer className="justify-between">
        <View className="mt-6">
          <Animated.View entering={FadeInLeft.delay(100)}>
            <Text className="text-3xl font-bold">Claim Your Legend</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)}>
            <Text className="mt-2 text-lg font-bold leading-relaxed">
              You've completed your first quest—Vaedros already feels safer!
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1100)}>
            <Text className="mt-4 text-base leading-relaxed">
              Create a free account to keep your hero's story alive and unlock
              the realm's magic.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(1600)}>
            <Text className="mb-4 mt-6 text-lg font-semibold">
              Create an account to:
            </Text>
            <Text className="mb-3 ml-4 text-base leading-relaxed">
              • Save your progress and continue your story
            </Text>
            <Text className="mb-3 ml-4 text-base leading-relaxed">
              • Unlock the ability to add friends
            </Text>
            <Text className="mb-3 ml-4 text-base leading-relaxed">
              • Participate in cooperative quests (coming soon)
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(2100)}>
            <Text className="my-6 text-base leading-relaxed">
              Your hero is currently stored on this device only. Secure the
              journey now and pick up right where you left off—anywhere,
              anytime.
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(2600)}>
          <Button
            label="Create Account"
            onPress={handleCreateAccount}
            accessibilityLabel="Create Account"
            className="bg-primary-500"
            textClassName="text-white font-bold"
          />
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}
