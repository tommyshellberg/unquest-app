import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
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
import { OnboardingStep, useOnboardingStore } from '@/store/onboarding-store';

// Local steps just for this screen's flow
enum IntroStep {
  WELCOME = 'welcome',
  NOTIFICATIONS = 'notifications',
  READY_FOR_CHARACTER = 'ready_for_character',
}

export default function AppIntroductionScreen() {
  // Use local state for UI steps within this screen
  const [introStep, setIntroStep] = useState<IntroStep>(IntroStep.WELCOME);

  // Use global state for tracking overall onboarding progress
  const setCurrentStep = useOnboardingStore((state) => state.setCurrentStep);

  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const currentStep = useOnboardingStore((state) => state.currentStep);

  // Animation values for a smooth fade/scale-in effect
  const contentOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);
  const buttonOpacity = useSharedValue(0);

  // Additional animation values for the notification step
  const platformInfoOpacity = useSharedValue(0);
  const notificationImageOpacity = useSharedValue(0);

  useEffect(() => {
    console.log('app introduction screen mounting');
    console.log('APP INTRODUCTION MOUNTING WITH STEP:', currentStep);
    return () => {
      console.log('app introduction screen unmounted');
    };
  }, [currentStep]);

  // Reset and play animations when step changes
  useEffect(() => {
    // Reset animations
    contentOpacity.value = 0;
    contentScale.value = 0.9;
    buttonOpacity.value = 0;
    platformInfoOpacity.value = 0;
    notificationImageOpacity.value = 0;

    // Set up sequenced animations
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 700 }));
    contentScale.value = withDelay(
      300,
      withSequence(withSpring(1.05), withSpring(1))
    );

    if (introStep === IntroStep.NOTIFICATIONS) {
      // Add additional staggered animations for notification step
      platformInfoOpacity.value = withDelay(
        1000,
        withTiming(1, { duration: 500 })
      );
      notificationImageOpacity.value = withDelay(
        1500,
        withTiming(1, { duration: 500 })
      );
      buttonOpacity.value = withDelay(1800, withTiming(1, { duration: 500 }));
    } else {
      // Standard button animation for other steps
      buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
    }
  }, [
    buttonOpacity,
    contentOpacity,
    contentScale,
    introStep,
    platformInfoOpacity,
    notificationImageOpacity,
  ]);

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
    setIntroStep(IntroStep.READY_FOR_CHARACTER);
  };

  // Handle button press based on current step
  const handleButtonPress = () => {
    switch (introStep) {
      case IntroStep.WELCOME:
        setIntroStep(IntroStep.NOTIFICATIONS);
        break;
      case IntroStep.NOTIFICATIONS:
        requestPermissions();
        break;
      case IntroStep.READY_FOR_CHARACTER:
        // Update global onboarding state when we're done with intro
        setCurrentStep(OnboardingStep.NOTIFICATIONS_COMPLETED);
        break;
    }
  };

  // Skip notifications and continue
  const handleSkipNotifications = () => {
    // Skip the system permission prompt and move to the next step
    setIntroStep(IntroStep.READY_FOR_CHARACTER);
  };

  // Create animated styles based on shared values
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const platformInfoStyle = useAnimatedStyle(() => ({
    opacity: platformInfoOpacity.value,
  }));

  const notificationImageStyle = useAnimatedStyle(() => ({
    opacity: notificationImageOpacity.value,
  }));

  // Get screen width to set full-width image
  const screenWidth = Dimensions.get('window').width;

  // Render content based on current step
  const renderContent = () => {
    switch (introStep) {
      case IntroStep.WELCOME:
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

      case IntroStep.NOTIFICATIONS:
        const isIOS = Platform.OS === 'ios';
        const notificationImage = isIOS
          ? require('@/../assets/images/ios-notification.jpg')
          : require('@/../assets/images/android-notification.jpg');

        return (
          <>
            <Animated.View style={contentStyle}>
              <Text className="text-xl font-bold">Notifications</Text>
              <Text className="mb-6 text-lg font-semibold text-white">
                The key to successful quests
              </Text>
              <Text className="mb-4">
                unQuest's unique feature is the ability to track your progress
                without unlocking your phone:
              </Text>
              <Text className="mb-2 ml-4">
                • See real-time quest progress on your lock screen
              </Text>
              <Text className="mb-2 ml-4">
                • Never risk failing quests by checking your phone
              </Text>
              <Text className="mb-4 ml-4">
                • Get notified immediately when quests complete
              </Text>
            </Animated.View>

            <Animated.View style={platformInfoStyle}>
              {isIOS ? (
                <Text className="mb-4 font-medium text-white">
                  iOS uses Live Activities to update your quest progress in
                  real-time on your lock screen.
                </Text>
              ) : (
                <Text className="mb-4 font-medium text-white">
                  For the best experience, set your lock screen notification
                  settings to "Show conversations and notifications"
                </Text>
              )}
            </Animated.View>

            <Animated.View
              style={notificationImageStyle}
              className="items-center"
            >
              <Text className="mb-2 font-medium">Here's what you'll see:</Text>
              <Image
                source={notificationImage}
                style={{ width: screenWidth, height: 150 }}
                className="rounded-lg"
              />
            </Animated.View>
          </>
        );

      case IntroStep.READY_FOR_CHARACTER:
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
    switch (introStep) {
      case IntroStep.WELCOME:
        return 'Got it';
      case IntroStep.NOTIFICATIONS:
        return 'Enable notifications';
      case IntroStep.READY_FOR_CHARACTER:
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

      <View className="flex-1 justify-between p-6">
        <View className="mt-6">{renderContent()}</View>

        <Animated.View style={buttonStyle} className="mb-6">
          {introStep === IntroStep.NOTIFICATIONS ? (
            <View className="space-y-2">
              <Button
                label={getButtonText()}
                onPress={handleButtonPress}
                accessibilityLabel={getButtonText()}
              />
              <Button
                label="Not now"
                variant="ghost"
                onPress={handleSkipNotifications}
                accessibilityLabel="Skip enabling notifications"
              />
            </View>
          ) : (
            <Button
              label={getButtonText()}
              onPress={handleButtonPress}
              accessibilityLabel={getButtonText()}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
}
