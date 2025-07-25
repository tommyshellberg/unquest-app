import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';

import { Card, Text, View } from '@/components/ui';

type StatsCardProps = {
  questCount: number;
  minutesSaved: number;
  streakCount: number;
};

// Custom component for animated number
function AnimatedNumber({
  value,
  duration = 1500,
  delay = 0,
  style,
  className,
}: {
  value: number;
  duration?: number;
  delay?: number;
  style?: any;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      animatedValue.value = withTiming(value, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, duration, delay, animatedValue]);

  useAnimatedReaction(
    () => animatedValue.value,
    (currentValue) => {
      runOnJS(setDisplayValue)(Math.round(currentValue));
    }
  );

  return (
    <Text className={className} style={style}>
      {displayValue}
    </Text>
  );
}

export function StatsCard({
  questCount,
  minutesSaved,
  streakCount,
}: StatsCardProps) {
  return (
    <Card className="mx-4 mt-4 p-5">
      <View className="flex-row justify-around">
        <View className="items-center">
          <AnimatedNumber
            value={questCount}
            duration={1200}
            delay={100}
            className="text-2xl font-bold text-teal-700"
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#2E948D',
              textAlign: 'center',
            }}
          />
          <Text className="text-gray-600">Quests</Text>
        </View>

        <View className="h-4/5 w-px bg-gray-300" />

        <View className="items-center">
          <AnimatedNumber
            value={minutesSaved}
            duration={1500}
            delay={300}
            className="text-2xl font-bold text-teal-700"
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#2E948D',
              textAlign: 'center',
            }}
          />
          <Text className="text-gray-600">Minutes Saved</Text>
        </View>

        <View className="h-4/5 w-px bg-gray-300" />

        <Pressable
          className="items-center"
          onPress={() => router.push('/streak-celebration')}
        >
          <View className="flex-row items-center">
            <AnimatedNumber
              value={streakCount}
              duration={1000}
              delay={500}
              className="text-2xl font-bold text-teal-700"
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#2E948D',
                textAlign: 'center',
              }}
            />
          </View>
          <Text className="text-gray-600">Day Streak</Text>
        </Pressable>
      </View>
    </Card>
  );
}
