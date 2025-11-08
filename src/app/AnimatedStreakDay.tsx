import { Flame } from 'lucide-react-native';
import React from 'react';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { Text, View } from '@/components/ui';
import { muted, red, white } from '@/components/ui/colors';

import { COLORS, INTERPOLATION, LAYOUT } from './streak-celebration.constants';
import { type StreakDay } from './streak-visualization.util';

interface AnimatedStreakDayProps {
  day: StreakDay;
  animationValue: Animated.SharedValue<number>;
}

/**
 * Animated day component that displays a single day in the streak visualization.
 * Shows the day abbreviation and a flame icon that animates when the day is completed.
 */
export function AnimatedStreakDay({
  day,
  animationValue,
}: AnimatedStreakDayProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animationValue.value,
      [0, 0.5, 1],
      [
        INTERPOLATION.SCALE_FROM,
        INTERPOLATION.SCALE_BOUNCE,
        INTERPOLATION.SCALE_TO,
      ]
    );

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
        scale: interpolate(
          animationValue.value,
          [0, 0.5, 1],
          [
            INTERPOLATION.FLAME_SCALE_FROM,
            INTERPOLATION.FLAME_SCALE_BOUNCE,
            INTERPOLATION.FLAME_SCALE_TO,
          ]
        ),
      },
    ],
  }));

  return (
    <View className="items-center">
      <Text
        className="mb-2 text-sm font-medium"
        style={{ color: COLORS.DAY_NAME_TEXT }}
      >
        {day.name}
      </Text>
      <Animated.View
        testID="flame-container"
        className="items-center justify-center rounded-full"
        style={[
          animatedStyle,
          backgroundColorStyle,
          {
            width: LAYOUT.DAY_CIRCLE_SIZE,
            height: LAYOUT.DAY_CIRCLE_SIZE,
            borderWidth: day.isToday ? 2 : 0,
            borderColor: day.isToday ? red[300] : 'transparent',
          },
        ]}
      >
        <Animated.View style={flameAnimatedStyle}>
          <Flame size={32} color={day.isCompleted ? white : muted[400]} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
