import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CompassAnimation,
  LockInstructions,
  QuestCard,
} from '@/components/quest';
import { Button, ScreenContainer, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useQuestStore } from '@/store/quest-store';

export default function PendingQuestScreen() {
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const insets = useSafeAreaInsets();
  const cancelQuest = useQuestStore((state) => state.cancelQuest);

  // Header animation using react-native-reanimated
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);

  // Animations must be defined before conditionals (for React Hook Rules)
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  // Run animations when component mounts
  useEffect(() => {
    if (pendingQuest) {
      // Simple animation sequence
      headerOpacity.value = withTiming(1, { duration: 500 });
      headerScale.value = withTiming(1, { duration: 500 });
      cardOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
      cardScale.value = withDelay(500, withTiming(1, { duration: 500 }));
      buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
      buttonScale.value = withDelay(1000, withTiming(1, { duration: 500 }));
    }
  }, [
    pendingQuest,
    buttonOpacity,
    buttonScale,
    cardOpacity,
    cardScale,
    headerOpacity,
    headerScale,
  ]);

  const handleCancelQuest = () => {
    cancelQuest();
    router.back();
  };

  if (!pendingQuest) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Full-screen Background Image */}
      <Image
        source={require('@/../assets/images/background/pending-quest-bg-alt.png')}
        className="absolute inset-0 size-full"
        resizeMode="cover"
      />
      {/* BlurView for a subtle overlay effect */}
      <BlurView intensity={30} tint="regular" className="absolute inset-0" />
      <ScreenContainer
        className="px-6"
        style={{
          paddingTop: insets.top + 16, // Spacing with safe area
        }}
      >
        <Animated.View
          className="mb-8 items-center"
          style={headerAnimatedStyle}
        >
          <Text className="text-3xl font-bold" style={{ fontWeight: '700' }}>
            {pendingQuest?.mode === 'custom' ? 'Custom Quest' : 'Quest Ready'}
          </Text>
        </Animated.View>

        <Animated.View className="flex-0" style={cardAnimatedStyle}>
          <QuestCard
            title={pendingQuest.title}
            duration={pendingQuest.durationMinutes}
          >
            {/* Single Quest Compass Animation */}
            <CompassAnimation size={100} delay={300} />

            {/* Single Quest Hero Message */}
            <Animated.Text
              entering={FadeInDown.delay(600).duration(800)}
              className="mb-2 text-center text-lg font-bold"
              style={{ color: colors.primary[500], fontWeight: '700' }}
            >
              Your Journey Begins
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.delay(800).duration(800)}
              className="mb-6 text-center text-base"
              style={{ color: colors.white }}
            >
              {pendingQuest?.mode === 'custom'
                ? 'Time to focus on what matters most'
                : 'Your character is ready for their quest'}
            </Animated.Text>

            {/* Lock Instructions */}
            <LockInstructions variant="single" delay={1000} />

            {/* Motivational Quote for Single Player */}
            <Animated.Text
              entering={FadeInDown.delay(1200).duration(800)}
              className="mt-4 text-center text-sm italic"
              style={{ color: colors.white }}
            >
              "The journey of a thousand miles begins with a single step"
            </Animated.Text>
          </QuestCard>
        </Animated.View>

        <View className="flex-1" />

        <Animated.View style={buttonAnimatedStyle}>
          <Button
            onPress={handleCancelQuest}
            variant="destructive"
            className="items-center rounded-full"
          >
            <Text
              className="text-base font-semibold"
              style={{ fontWeight: '700' }}
            >
              Cancel Quest
            </Text>
          </Button>
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}
