import LottieView from 'lottie-react-native';
import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

export const PaperPlanes = () => {
  return (
    <Animated.View
      entering={FadeIn.duration(800)}
      className="items-center justify-center"
    >
      <LottieView
        source={require('@/../assets/animations/edit.json')}
        autoPlay
        loop
        style={{ width: 60, height: 60 }}
      />
    </Animated.View>
  );
};
