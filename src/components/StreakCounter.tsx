import { router } from 'expo-router';
import { Flame } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text, View } from '@/components/ui';
import { useCharacterStore } from '@/store/character-store';

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

  // Animation value
  const scale = useSharedValue(animate ? 0.5 : 1);

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
              flex-row items-center rounded-full bg-transparent px-2
              py-[2px]
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
