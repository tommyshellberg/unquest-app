// src/app/index.tsx
import { ResizeMode, Video } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { TouchableOpacity } from 'react-native';

import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setCurrentStep } = useOnboardingStore();
  const videoRef = useRef<Video>(null);

  const handleGetStarted = () => {
    // Update the onboarding step to SELECTING_CHARACTER which will trigger navigation
    setCurrentStep(OnboardingStep.SELECTING_CHARACTER);
  };

  const handleLogin = () => {
    // Navigate to the login screen
    router.replace('/login');
  };

  return (
    <View className="flex h-full">
      <FocusAwareStatusBar />

      {/* Full‑screen background video */}
      <View className="absolute inset-0">
        <Video
          ref={videoRef}
          source={require('@/../assets/animations/onboarding-bg.mp4')}
          style={{ width: '100%', height: '100%' }}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
        />
      </View>

      {/* Content */}
      <View className="flex-1 px-6 py-4">
        <View className="mt-8 items-center">
          <Text className="mt-2 text-5xl font-bold">emberglow</Text>
          <Text className="text-md font-semibold">Level Up By Logging Off</Text>
        </View>

        {/* Middle description section */}
        <View className="my-20 flex-1">
          <Text className="text-center text-lg">
            Turn phone breaks into epic adventures
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
