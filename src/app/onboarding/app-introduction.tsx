import * as Notifications from 'expo-notifications';
import { usePostHog } from 'posthog-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import { Image } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
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
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('onboarding_open_app_introduction_screen');
  }, [posthog]);

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
      setupNotifications();
      const granted = await requestNotificationPermissions();
      setPermissionsGranted(granted);
      if (granted) {
        posthog.capture('onboarding_request_notification_permissions_success');
      } else {
        posthog.capture('onboarding_request_notification_permissions_denied');
      }
    } catch (error) {
      posthog.capture('onboarding_request_notification_permissions_error');
      console.error('Error requesting permissions:', error);
      setPermissionsGranted(false);
    }

    setIntroStep(IntroStep.READY_FOR_CHARACTER);
    posthog.capture('onboarding_request_notification_permissions_completed');
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
        setCurrentStep(OnboardingStep.NOTIFICATIONS_COMPLETED);
        break;
    }
  };

  // Skip notifications and continue
  const handleSkipNotifications = () => {
    setIntroStep(IntroStep.READY_FOR_CHARACTER);
  };

  // Get screen width to set full-width image
  const screenWidth = Dimensions.get('window').width;

  // Render content based on current step
  const renderContent = () => {
    switch (introStep) {
      case IntroStep.WELCOME:
        return (
          <View key="welcome">
            <Animated.View entering={FadeInLeft.delay(100)}>
              <Text className="text-xl font-bold">Welcome to unQuest</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(600)}>
              <Text className="mb-6 text-lg font-semibold text-white">
                Discover quests and embrace your journey.
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(1100)}>
              <Text className="mb-4">
                In unQuest, you'll embark on a mindful adventure by periodically
                stepping away from the digital world and reconnecting with the
                real world.
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(1600)}>
              <Text className="mb-4">
                Each quest is a unique challenge that rewards you for taking a
                break from screen time.
              </Text>
            </Animated.View>
          </View>
        );

      case IntroStep.NOTIFICATIONS:
        const isIOS = Platform.OS === 'ios';
        const notificationImage = isIOS
          ? require('@/../assets/images/ios-notification.jpg')
          : require('@/../assets/images/android-notification.jpg');

        return (
          <View key="notifications">
            <Animated.View entering={FadeInLeft.delay(100)}>
              <Text className="text-xl font-bold">Notifications</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(600)}>
              <Text className="mb-6 text-lg font-semibold text-white">
                The key to successful quests
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(1100)}>
              <Text className="mb-4">
                unQuest's unique feature is the ability to track your progress
                without unlocking your phone:
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(1600)}>
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

            <Animated.View entering={FadeInDown.delay(2100)}>
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
              entering={FadeInDown.delay(2600)}
              className="items-center"
            >
              <Text className="mb-2 font-medium">Here's what you'll see:</Text>
              <Image
                source={notificationImage}
                style={{ width: screenWidth, height: 150 }}
                className="rounded-lg"
              />
            </Animated.View>
          </View>
        );

      case IntroStep.READY_FOR_CHARACTER:
        return (
          <View key="character">
            <Animated.View entering={FadeInDown.delay(100)}>
              <Text className="mb-4 text-xl font-bold">Your Character</Text>
              <Text className="mb-6 text-lg font-semibold text-white">
                Your companion on this journey
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600)}>
              <Text className="mb-4">
                Choose a character that reflects your personality. Each
                character offers a different approach to mindfulness and
                balance.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(1100)}>
              <Text className="mb-4">
                In future updates, characters will gain unique abilities to help
                complete quests and earn rewards.
              </Text>
            </Animated.View>
          </View>
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

        <Animated.View
          entering={FadeIn.delay(
            introStep === IntroStep.READY_FOR_CHARACTER ? 1600 : 2800
          )}
          className="mb-6"
          key={`button-${introStep}`}
        >
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
