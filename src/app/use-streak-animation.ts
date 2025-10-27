import type LottieView from 'lottie-react-native';
import { useCallback, useRef } from 'react';
import {
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  ANIMATION_TIMING,
  SPRING_CONFIG,
} from './streak-celebration.constants';
import { type StreakDay } from './streak-visualization.util';

interface UseStreakAnimationReturn {
  weekViewOpacity: any;
  dayAnimations: any[];
  lottieRef: React.RefObject<LottieView>;
  playAnimations: () => void;
}

/**
 * Custom hook to manage all animations for the streak celebration screen.
 *
 * @param streakDays - Array of streak days to animate
 * @returns Animation values, ref, and play function
 */
export function useStreakAnimation(
  streakDays: StreakDay[]
): UseStreakAnimationReturn {
  const lottieRef = useRef<LottieView>(null);
  const weekViewOpacity = useSharedValue(0);
  const dayAnimations = streakDays.map(() => useSharedValue(0));

  const playAnimations = useCallback(() => {
    // Reset all animation values first
    weekViewOpacity.value = 0;
    dayAnimations.forEach((anim) => {
      anim.value = 0;
    });

    // Animate the week view entrance
    weekViewOpacity.value = withDelay(
      ANIMATION_TIMING.WEEK_VIEW_DELAY,
      withTiming(1, { duration: ANIMATION_TIMING.WEEK_VIEW_DURATION })
    );

    // Play the confetti animation with a slight delay to ensure mounting
    if (lottieRef.current) {
      setTimeout(() => {
        lottieRef.current?.play();
      }, ANIMATION_TIMING.CONFETTI_DELAY);
    }

    // Animate each completed day one by one
    streakDays.forEach((day, index) => {
      if (day.isCompleted) {
        dayAnimations[index].value = withDelay(
          ANIMATION_TIMING.DAY_ANIMATION_START_DELAY +
            index * ANIMATION_TIMING.DAY_ANIMATION_STAGGER,
          withSpring(1, {
            damping: SPRING_CONFIG.DAMPING,
            stiffness: SPRING_CONFIG.STIFFNESS,
          })
        );
      }
    });
  }, [weekViewOpacity, dayAnimations, streakDays]);

  return {
    weekViewOpacity,
    dayAnimations,
    lottieRef,
    playAnimations,
  };
}
