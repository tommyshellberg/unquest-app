import LottieView from 'lottie-react-native';
import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { View } from '@/components/ui';

export const PaperPlanes = () => {
  return (
    <Animated.View 
      entering={FadeIn.duration(800)}
      className="h-[100px] items-center justify-center"
    >
      <LottieView
        source={require('@/../assets/animations/edit.json')}
        autoPlay
        loop
        style={{ width: 100, height: 100 }}
      />
    </Animated.View>
  );
};
