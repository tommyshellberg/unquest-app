// src/app/index.tsx
import { useRouter } from 'expo-router';
import React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  Image,
  Text,
  View,
} from '@/components/ui';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setCurrentStep } = useOnboardingStore();

  const handleGetStarted = () => {
    setCurrentStep(OnboardingStep.INTRO_COMPLETED);
    // Navigate to onboarding since they haven't completed it yet.
    router.replace('/onboarding');
  };

  return (
    <View className="flex h-full">
      <FocusAwareStatusBar />

      {/* Full‑screen background */}
      <View className="absolute inset-0">
        <Image
          source={require('@/../assets/images/background/onboarding.jpg')}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      {/* Content */}
      <View className="flex-1 px-6 py-4">
        <View className="mt-8 items-center">
          <Image
            source={require('@/../assets/images/unquestlogo-downscaled.png')}
            style={{ width: 120, height: 120 }}
          />
          <Text className="mt-2 text-3xl font-bold">unQuest</Text>
          <Text className="text-lg font-semibold">Level Up By Logging Off</Text>
        </View>

        {/* Middle description section */}
        <View className="my-20 flex-1">
          <Text className="text-center text-xl">
            The only game that rewards you{'\n'}for not playing it.
          </Text>
        </View>

        <View className="mb-10">
          <Button
            testID="get-started-button"
            label="Begin Your Journey"
            onPress={handleGetStarted}
          />
        </View>
      </View>
    </View>
  );
}
