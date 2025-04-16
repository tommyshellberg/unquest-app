import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import {
  requestNotificationPermissions,
  setupNotifications,
} from '@/lib/services/notifications';
import { useCharacterStore } from '@/store/character-store';
import { useUserStore } from '@/store/user-store';

enum OnboardingStep {
  WELCOME,
  NOTIFICATIONS,
  CHOOSE_CHARACTER,
}

export default function AppIntroductionScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    OnboardingStep.WELCOME
  );
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const character = useCharacterStore((state) => state.character);
  const user = useUserStore((state) => state.user);

  const hasExistingData = !!character || !!user;

  // Animation values for a smooth fade/scale-in effect.
  const contentOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    console.log('character', character);
    return () => {
      console.log('app introduction screen unmounted');
    };
  }, [character]);

  // Reset and play animations when step changes
  useEffect(() => {
    // Reset animations
    contentOpacity.value = 0;
    contentScale.value = 0.9;
    buttonOpacity.value = 0;

    // Start new animations
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    contentScale.value = withDelay(
      300,
      withSequence(withSpring(1.05), withSpring(1))
    );
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
  }, [currentStep]);

  // Check if permissions are already granted
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionsGranted(status === 'granted');
    };

    checkPermissions();
  }, []);

  // Request notification permissions
  const requestPermissions = async () => {
    try {
      // Initialize notifications
      setupNotifications();

      // Use our unified permission request that handles both OneSignal and Expo notifications
      const granted = await requestNotificationPermissions();
      setPermissionsGranted(granted);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      // Even if there's an error, we'll continue the flow
      setPermissionsGranted(false);
    }

    // Move to the next step
    setCurrentStep(OnboardingStep.CHOOSE_CHARACTER);
  };

  // Handle button press based on current step
  const handleButtonPress = () => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        setCurrentStep(OnboardingStep.NOTIFICATIONS);
        break;
      case OnboardingStep.NOTIFICATIONS:
        requestPermissions();
        break;
      case OnboardingStep.CHOOSE_CHARACTER:
        // Navigate to character creation
        router.push('/onboarding/choose-character');
        break;
    }
  };

  // Create animated styles based on shared values
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  // Render content based on current step
  const renderContent = () => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        return (
          <>
            <Text className="text-xl font-bold">Welcome to unQuest</Text>
            <Text className="mb-6 text-lg font-semibold text-white">
              Discover quests and embrace your journey.
            </Text>
            <Text className="mb-4">
              In unQuest, you'll embark on a mindful adventure by periodically
              stepping away from the digital world and reconnecting with the
              real world.
            </Text>
            <Text className="mb-4">
              Each quest is a unique challenge that rewards you for taking a
              break from screen time.
            </Text>
          </>
        );

      case OnboardingStep.NOTIFICATIONS:
        return (
          <>
            <Text className="text-xl font-bold">Notifications</Text>
            <Text className="mb-6 text-lg font-semibold text-white">
              Stay updated on your quests
            </Text>
            <Text className="mb-4">
              unQuest works best with lock screen notifications enabled. This
              allows you to:
            </Text>
            <Text className="mb-2 ml-4">
              • See your quest progress while your phone is locked
            </Text>
            <Text className="mb-4 ml-4">
              • Receive notifications when your quest is complete
            </Text>
            <Text className="mb-4 font-semibold">
              For the best experience, please set your lock screen notification
              settings to "Show conversations and notifications"
            </Text>
          </>
        );

      case OnboardingStep.CHOOSE_CHARACTER:
        return (
          <>
            <Text className="mb-6 text-xl font-bold">
              Create Your Character
            </Text>
            <Text className="mb-6">
              Now it's time to create your character and begin your journey.
            </Text>
          </>
        );

      default:
        return null;
    }
  };

  // Get button text based on current step
  const getButtonText = () => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        return 'Got it';
      case OnboardingStep.NOTIFICATIONS:
        return 'Enable notifications';
      case OnboardingStep.CHOOSE_CHARACTER:
        return 'Create character';
    }
  };

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

      <View className="flex-1 justify-between p-4">
        <Animated.View style={contentStyle} className="mt-6">
          {renderContent()}
        </Animated.View>

        <Animated.View style={buttonStyle} className="mb-6">
          <Button
            label={getButtonText()}
            onPress={handleButtonPress}
            accessibilityLabel={getButtonText()}
          />
        </Animated.View>
      </View>
    </View>
  );
}
