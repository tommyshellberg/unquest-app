// src/app/index.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

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

  const handleLogin = () => {
    // Navigate to the login screen
    router.replace('/login');
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
            label="Begin New Journey"
            onPress={handleGetStarted}
          />
          <TouchableOpacity
            onPress={handleLogin}
            className="mt-4 items-center"
            accessibilityRole="button"
            accessibilityLabel="Log in to existing account"
          >
            <Text className="text-base text-white underline shadow-md">
              Have an account? Log In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
