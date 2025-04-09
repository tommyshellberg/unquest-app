import { router } from 'expo-router';
import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import {
  Button,
  FocusAwareStatusBar,
  Image,
  Text,
  View,
} from '@/components/ui';
import { useQuestStore } from '@/store/quest-store';

export default function QuestFailed() {
  // Get the clear failed quest function from the store
  const resetFailedQuest = useQuestStore((state) => state.resetFailedQuest);

  // Create animated values for header, message, and button animations
  const headerAnim = useSharedValue(0);
  const messageAnim = useSharedValue(0);
  const buttonAnim = useSharedValue(0);

  // Trigger animations in sequence on mount
  useEffect(() => {
    headerAnim.value = withTiming(1, { duration: 500 });
    messageAnim.value = withDelay(600, withTiming(1, { duration: 500 }));
    buttonAnim.value = withDelay(1200, withTiming(1, { duration: 500 }));
  }, [headerAnim, messageAnim, buttonAnim]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.value,
    transform: [{ translateY: 20 * (1 - headerAnim.value) }],
  }));

  const messageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: messageAnim.value,
    transform: [{ translateY: 20 * (1 - messageAnim.value) }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonAnim.value,
    transform: [{ translateY: 20 * (1 - buttonAnim.value) }],
  }));

  // Reset the failed quest when unmounting to avoid showing it multiple times if they don't click the button.
  useEffect(() => {
    return () => {
      resetFailedQuest();
    };
  }, [resetFailedQuest]);

  const onAcknowledge = () => {
    resetFailedQuest();
    setTimeout(() => {
      router.replace('/');
    }, 100);
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      {/* Background image */}
      <View className="absolute inset-0">
        <Image
          source={require('@/../assets/images/background/onboarding.jpg')}
          className="size-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/20" />
      </View>

      <View className="flex-1 px-6 py-8">
        {/* Title Section */}
        <Animated.View
          style={headerAnimatedStyle}
          className="mt-12 items-center"
        >
          <Text className="text-3xl font-bold">Quest Failed</Text>
        </Animated.View>

        {/* Message Section */}
        <Animated.View
          style={messageAnimatedStyle}
          className="flex-1 items-center justify-center px-6"
        >
          <Text className="mb-4 text-center text-lg font-semibold">
            It's okay to fail – every setback teaches you a lesson.
          </Text>
          <Text className="mb-4 text-center text-base">
            Resist unlocking out of boredom.
          </Text>
          <Text className="text-center text-base">
            Using your phone less helps build focus and mindfulness.
          </Text>
        </Animated.View>

        {/* Button Section */}
        <Animated.View
          style={buttonAnimatedStyle}
          className="mb-8 items-center"
        >
          <Button
            label="Keep Going!"
            onPressOut={onAcknowledge}
            className="rounded-full bg-primary-400"
            textClassName="text-white font-semibold"
          />
        </Animated.View>
      </View>
    </View>
  );
}
