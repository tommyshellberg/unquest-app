import { router } from 'expo-router';
import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Button, Image, Text, View, ScreenContainer } from '@/components/ui';
import type {
  CustomQuestTemplate,
  Quest,
  StoryQuestTemplate,
} from '@/store/types';

type FailedQuestProps = {
  quest: Quest | StoryQuestTemplate | CustomQuestTemplate;
  onRetry: () => void;
};

export function FailedQuest({ quest, onRetry }: FailedQuestProps) {
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

  return (
    <View className="flex-1">
      {/* Background image */}
      <View className="absolute inset-0">
        <Image
          source={require('@/../assets/images/background/onboarding.jpg')}
          className="size-full"
          resizeMode="cover"
        />
      </View>

      <ScreenContainer className="py-8">
        {/* Title Section */}
        <Animated.View
          style={headerAnimatedStyle}
          className="mt-12 items-center"
        >
          <Text className="text-3xl font-bold">Quest Failed</Text>
          <Text className="mt-2 text-center text-lg font-medium">
            {quest.title}
          </Text>
        </Animated.View>

        {/* Message Section */}
        <Animated.View
          style={messageAnimatedStyle}
          className="my-6 flex-1 items-center px-6"
        >
          <Text className="mb-4">
            It's okay to fail – every setback teaches you a lesson.
          </Text>
          <Text className="mb-4 text-base">
            Resist unlocking out of boredom.
          </Text>
          <Text className="text-base">
            Using your phone less helps build focus and mindfulness.
          </Text>
        </Animated.View>

        {/* Button Section */}
        <Animated.View style={buttonAnimatedStyle} className="items-center">
          <Button
            label="Try Again"
            onPressOut={onRetry}
            className="mb-4 rounded-full bg-primary-400"
            textClassName="text-white font-semibold"
          />
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}
