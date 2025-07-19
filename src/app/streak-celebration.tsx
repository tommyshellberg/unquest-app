import { useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Flame, Share } from 'lucide-react-native';
import React, { useCallback, useRef } from 'react';
import { Alert, Image, Share as RNShare } from 'react-native';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { StreakCounter } from '@/components/StreakCounter';
import { ScreenContainer, Text, View } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { muted, primary, red, white } from '@/components/ui/colors';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';

// Animated Day Component
const AnimatedDay = ({
  day,
  animationValue,
}: {
  day: { name: string; isCompleted: boolean; isToday: boolean };
  index: number;
  animationValue: Animated.SharedValue<number>;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(animationValue.value, [0, 0.5, 1], [1, 1.2, 1]);

    return {
      transform: [{ scale }],
    };
  });

  const backgroundColorStyle = useAnimatedStyle(() => {
    if (!day.isCompleted) {
      return {
        backgroundColor: muted[100],
      };
    }

    // Interpolate RGB values from muted[100] (#D3DEDA) to red[300] (#FD7859)
    const r = interpolate(animationValue.value, [0, 1], [211, 253]);
    const g = interpolate(animationValue.value, [0, 1], [222, 120]);
    const b = interpolate(animationValue.value, [0, 1], [218, 89]);

    return {
      backgroundColor: `rgb(${r}, ${g}, ${b})`,
    };
  });

  const flameAnimatedStyle = useAnimatedStyle(() => ({
    opacity: day.isCompleted ? animationValue.value : 1,
    transform: [
      {
        scale: interpolate(animationValue.value, [0, 0.5, 1], [0.5, 1.3, 1]),
      },
    ],
  }));

  return (
    <View className="items-center">
      <Text className="mb-2 text-sm font-medium" style={{ color: muted[500] }}>
        {day.name}
      </Text>
      <Animated.View
        testID="flame-container"
        className="size-12 items-center justify-center rounded-full"
        style={[
          animatedStyle,
          backgroundColorStyle,
          {
            borderWidth: day.isToday ? 2 : 0,
            borderColor: day.isToday ? red[300] : 'transparent',
          },
        ]}
      >
        <Animated.View style={flameAnimatedStyle}>
          <Flame size={20} color={day.isCompleted ? white : muted[400]} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default function StreakCelebrationScreen() {
  const dailyQuestStreak = useCharacterStore((state) => state.dailyQuestStreak);
  const markStreakCelebrationShown = useCharacterStore(
    (state) => state.markStreakCelebrationShown
  );
  const setShouldShowStreakCelebration = useQuestStore(
    (state) => state.setShouldShowStreakCelebration
  );
  const lastCompletedQuestTimestamp = useQuestStore(
    (state) => state.lastCompletedQuestTimestamp
  );
  const lottieRef = useRef<LottieView>(null);

  const weekViewOpacity = useSharedValue(0);

  const weekViewStyle = useAnimatedStyle(() => ({
    opacity: weekViewOpacity.value,
  }));

  // Calculate if streak is still active (within 24 hours of last completion)
  const isStreakActive = lastCompletedQuestTimestamp
    ? Date.now() - lastCompletedQuestTimestamp < 24 * 60 * 60 * 1000
    : false;

  // Generate 5-day streak visualization
  const generateStreakVisualization = () => {
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

    const streakDays = [];

    if (dailyQuestStreak === 0) {
      // No streak, show today and 4 empty days after
      for (let i = 0; i < 5; i++) {
        const dayIndex = (today + i) % 7;
        streakDays.push({
          name: dayNames[dayIndex],
          isCompleted: false,
          isToday: i === 0,
        });
      }
    } else if (dailyQuestStreak >= 5) {
      // 5+ day streak, show 5 completed days ending with today
      for (let i = 4; i >= 0; i--) {
        const dayIndex = (today - i + 7) % 7;
        streakDays.push({
          name: dayNames[dayIndex],
          isCompleted: true,
          isToday: i === 0,
        });
      }
    } else {
      // 1-4 day streak, show streak days starting from left, then empty days
      const streakStartDay = (today - dailyQuestStreak + 1 + 7) % 7;

      for (let i = 0; i < 5; i++) {
        const dayIndex = (streakStartDay + i) % 7;
        const isCompleted = i < dailyQuestStreak;
        const isToday = dayIndex === today;

        streakDays.push({
          name: dayNames[dayIndex],
          isCompleted,
          isToday,
        });
      }
    }

    return streakDays;
  };

  const streakDays = generateStreakVisualization();

  // Animation values for each day
  const dayAnimations = streakDays.map(() => useSharedValue(0));

  // Function to trigger animations
  const playAnimations = useCallback(() => {
    // Reset all animation values first
    weekViewOpacity.value = 0;
    dayAnimations.forEach((anim) => {
      anim.value = 0;
    });

    // Animate the week view entrance
    weekViewOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));

    // Play the confetti animation
    if (lottieRef.current) {
      setTimeout(() => {
        lottieRef.current?.play();
      }, 100);
    }

    // Animate each completed day one by one
    streakDays.forEach((day, index) => {
      if (day.isCompleted) {
        dayAnimations[index].value = withDelay(
          1200 + index * 200, // Start after week view appears, stagger by 200ms
          withSpring(1, {
            damping: 12,
            stiffness: 150,
          })
        );
      }
    });
  }, [weekViewOpacity, dayAnimations, streakDays]);

  // Play animations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Mark that the streak celebration was shown when accessing this screen
      markStreakCelebrationShown();
      playAnimations();
    }, [playAnimations, markStreakCelebrationShown])
  );

  const handleShare = async () => {
    try {
      const shareMessage = `I'm on a ${dailyQuestStreak} day quest streak in unQuest! 🔥 Join me on this epic adventure!\n\nhttps://unquestapp.com`;

      const result = await RNShare.share({
        message: shareMessage,
        title: 'My unQuest Streak',
      });

      if (result.action === RNShare.sharedAction) {
        console.log('Streak shared successfully');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share streak');
    }
  };

  const handleContinue = () => {
    // Clear the flag when user clicks continue
    setShouldShowStreakCelebration(false);
    // Navigation will happen automatically when the flag is cleared
  };

  return (
    <View className="flex-1">
      {/* Background */}
      <View className="absolute inset-0">
        <Image
          source={require('@/../assets/images/background/active-quest.jpg')}
          className="size-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0" />
      </View>

      <ScreenContainer className="items-center justify-center">
        {/* Streak Counter with Confetti Animation */}
        <View className="relative mb-8 h-[150px] w-full items-center justify-center">
          <LottieView
            ref={lottieRef}
            source={require('@/../assets/animations/congrats.json')}
            style={{
              position: 'absolute',
              width: '150%',
              height: '150%',
              opacity: 0.8,
            }}
            loop={false}
            autoPlay={false}
            resizeMode="cover"
          />
          <StreakCounter animate={true} size="large" disablePress={true} />
        </View>

        {/* Streak Text */}
        <Text className="mb-8 text-3xl font-bold" style={{ color: red[300] }}>
          day streak!
        </Text>

        {/* 5-Day Streak Visualization */}
        <Animated.View
          className="mb-8 w-full max-w-sm rounded-2xl p-6"
          style={[weekViewStyle, { backgroundColor: white }]}
          entering={FadeInDown.delay(800).duration(600)}
        >
          <View className="flex-row justify-between">
            {streakDays.map((day, index) => (
              <AnimatedDay
                key={index}
                day={day}
                index={index}
                animationValue={dayAnimations[index]}
              />
            ))}
          </View>

          <Text className="mt-4 text-center" style={{ color: muted[500] }}>
            Complete a quest each day so your streak won't reset!
          </Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          className="w-full max-w-sm space-y-4"
          entering={FadeInDown.delay(1000).duration(600)}
        >
          {/* Share Button */}
          <Button
            variant="outline"
            onPress={handleShare}
            className="mb-4 flex-row items-center justify-center"
            style={{ borderColor: red[300] }}
          >
            <Share size={20} color={red[300]} className="mr-2" />
            <Text className="font-semibold" style={{ color: red[300] }}>
              Share
            </Text>
          </Button>

          {/* Continue Button */}
          <Button
            onPress={handleContinue}
            style={{ backgroundColor: primary[300] }}
          >
            <Text className="font-semibold text-white">CONTINUE</Text>
          </Button>
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}
