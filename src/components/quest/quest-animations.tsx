import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

interface CompassAnimationProps {
  size?: number;
  delay?: number;
}

export function CompassAnimation({
  size = 100,
  delay = 300,
}: CompassAnimationProps) {
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
      />
    </Animated.View>
  );
}
