import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { twMerge } from 'tailwind-merge';

import { primary, white } from './colors';

type Props = {
  initialProgress?: number;
  className?: string;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
};

export type ProgressBarRef = {
  setProgress: (value: number) => void;
};

export const ProgressBar = forwardRef<ProgressBarRef, Props>(
  (
    {
      initialProgress = 0,
      className = '',
      height = 8,
      backgroundColor = white,
      progressColor = primary[400],
    },
    ref
  ) => {
    const progress = useSharedValue<number>(initialProgress ?? 0);

    useImperativeHandle(ref, () => {
      return {
        setProgress: (value: number) => {
          progress.value = withTiming(value, {
            duration: 250,
            easing: Easing.inOut(Easing.quad),
          });
        },
      };
    }, [progress]);

    const style = useAnimatedStyle(() => {
      return {
        width: `${Math.max(0, Math.min(100, progress.value))}%`,
        backgroundColor: progressColor,
        height: height,
        borderRadius: height / 2,
      };
    });

    return (
      <View
        className={twMerge('overflow-hidden', className)}
        style={{
          backgroundColor,
          height: height,
          borderRadius: height / 2,
        }}
      >
        <Animated.View style={style} />
      </View>
    );
  }
);
