import React, { useEffect, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text, View } from '@/components/ui';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';

type Props = {
  animate?: boolean;
  size?: 'small' | 'large';
};

export function StreakCounter({ animate = false, size = 'large' }: Props) {
  const dailyQuestStreak = useCharacterStore((state) => state.dailyQuestStreak);
  const lastCompletedQuestTimestamp = useQuestStore(
    (state) => state.lastCompletedQuestTimestamp
  );
  const [isStreakActive, setIsStreakActive] = useState(true);

  // Animation value
  const scale = useSharedValue(animate ? 0.5 : 1);

  // Calculate if streak is still active (within 24 hours of last completion)
  useEffect(() => {
    if (lastCompletedQuestTimestamp) {
      const now = Date.now();
      const timeSinceLastCompletion = now - lastCompletedQuestTimestamp;
      const oneDayInMs = 24 * 60 * 60 * 1000;

      setIsStreakActive(timeSinceLastCompletion < oneDayInMs);
    } else {
      setIsStreakActive(false);
    }
  }, [lastCompletedQuestTimestamp]);

  // Trigger animation if animate prop is true
  useEffect(() => {
    if (animate) {
      scale.value = withSpring(1.2, { damping: 12 });
    }
  }, [animate, scale]);

  const streakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View className="items-center justify-center" style={streakStyle}>
      <View
        className={`
          items-center 
          justify-center 
          bg-secondary-100
          shadow-lg
          ${size === 'large' ? 'size-[90px] rounded-[45px]' : 'size-[40px] rounded-[20px]'}
          ${!isStreakActive ? 'bg-muted-400' : ''}
        `}
      >
        <Text
          className={`
            text-forest 
            font-bold
            ${size === 'large' ? 'text-[32px]' : 'text-2xl'}
          `}
        >
          {dailyQuestStreak}
        </Text>
        <Text
          className={`
            text-text-light 
            -mt-1.5
            ${size === 'large' ? 'text-sm' : 'text-xs'}
          `}
        >
          day streak
        </Text>
      </View>
    </Animated.View>
  );
}
