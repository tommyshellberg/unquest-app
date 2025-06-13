import { Flame } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';

import { Text, View } from '@/components/ui';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';

import { red } from './ui/colors';

type Props = {
  animate?: boolean;
  size?: 'small' | 'large';
  position?: 'topRight' | 'default';
  showCountdown?: boolean;
  onPress?: () => void;
  disablePress?: boolean;
};

export function StreakCounter({
  animate = false,
  size = 'large',
  position = 'default',
  onPress,
  disablePress = false,
}: Props) {
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

  // If streak is 0 and small size, don't render anything
  if (dailyQuestStreak === 0 && size === 'small') {
    return null;
  }

  // Wrapper with position styling
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (position === 'topRight') {
      return <View className="absolute right-4 top-2 z-10">{children}</View>;
    }
    return <>{children}</>;
  };

  const handlePress = () => {
    if (disablePress) return;
    if (onPress) {
      onPress();
    } else {
      router.push('/streak-celebration');
    }
  };

  if (size === 'small') {
    return (
      <Wrapper>
        <Animated.View style={streakStyle}>
          <Pressable
            onPress={handlePress}
            disabled={disablePress}
            className={`
              flex-row items-center rounded-full px-2 py-[2px]
              ${isStreakActive ? 'bg-transparent' : 'bg-neutral-400/50'}
            `}
          >
            <Flame size={20} color={red[300]} />
            <Text className="font-semibold text-primary-500">
              {dailyQuestStreak}
            </Text>
          </Pressable>
        </Animated.View>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Animated.View
        className="items-center justify-center"
        style={streakStyle}
      >
        <Pressable
          onPress={handlePress}
          disabled={disablePress}
          className={`
            size-[90px] 
            items-center 
            justify-center
            rounded-[45px]
            bg-secondary-100 shadow-lg
            ${!isStreakActive ? 'bg-muted-400' : ''}
          `}
        >
          <Text
            className={`
              text-forest 
              text-[32px]
              font-bold
            `}
          >
            {dailyQuestStreak}
          </Text>
        </Pressable>
      </Animated.View>
    </Wrapper>
  );
}
