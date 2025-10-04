import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

interface CompassAnimationProps {
  size?: number;
  delay?: number;
  color?: string;
}

export function CompassAnimation({
  size = 100,
  delay = 300,
  color,
}: CompassAnimationProps) {
  // If color is provided, create color filters for the Lottie animation
  const colorFilters = color
    ? [
        {
          keypath: '**', // Apply to all layers
          color: color,
        },
      ]
    : undefined;

  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(800)}
      className="items-center"
    >
      <LottieView
        source={require('@/../assets/animations/compass.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
        colorFilters={colorFilters}
      />
    </Animated.View>
  );
}
