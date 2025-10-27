import { router } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import React, { useCallback } from 'react';
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
  Title,
  View,
} from '@/components/ui';

export default function QuestCompletedSignupScreen() {
  const posthog = usePostHog();

  const handleCreateAccount = useCallback(() => {
    posthog.capture('onboarding_trigger_try_create_account');

    // Navigate to login - the login flow will handle setting onboarding to COMPLETED
    // after successful authentication
    router.replace('/login');
  }, [posthog]);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      <View className="absolute inset-0">
        <Image
          source={require('@/../assets/images/background/onboarding-bg.png')}
          className="size-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-white/10" />
      </View>

      <ScreenContainer fullScreen className="justify-between">
        <View className="mt-6">
          <Animated.View entering={FadeInLeft.delay(100)}>
            <Title text="Claim Your Legend" />
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
