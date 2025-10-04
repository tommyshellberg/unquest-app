import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Clock, Lock } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCharacterAvatar } from '@/app/utils/character-utils';
import { CompassAnimation } from '@/components/quest';
import { Button, Card, Text, Title, View } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';

export default function PendingQuestScreen() {
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const character = useCharacterStore((state) => state.character);
  const insets = useSafeAreaInsets();
  const cancelQuest = useQuestStore((state) => state.cancelQuest);

  // Header animation using react-native-reanimated
  const headerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);
  const shimmerOpacity = useSharedValue(1);

  // Animations must be defined before conditionals (for React Hook Rules)
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  // Run animations when component mounts
  useEffect(() => {
    if (pendingQuest) {
      // Simple animation sequence
      headerOpacity.value = withTiming(1, { duration: 500 });
      headerScale.value = withTiming(1, { duration: 500 });
      cardOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
      cardScale.value = withDelay(500, withTiming(1, { duration: 500 }));
      buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
      buttonScale.value = withDelay(1000, withTiming(1, { duration: 500 }));

      // Shimmer effect
      shimmerOpacity.value = withDelay(
        1200,
        withRepeat(
          withSequence(
            withTiming(0.5, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          true
        )
      );
    }
  }, [
    pendingQuest,
    buttonOpacity,
    buttonScale,
    cardOpacity,
    cardScale,
    headerOpacity,
    headerScale,
    shimmerOpacity,
  ]);

  const handleCancelQuest = () => {
    cancelQuest();
    router.back();
  };

  if (!pendingQuest) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Full-screen Background Image */}
      <Image
        source={require('@/../assets/images/background/pending-quest-bg-alt.png')}
        className="absolute inset-0 size-full"
        resizeMode="cover"
      />
      {/* BlurView for a subtle overlay effect */}
      <BlurView intensity={30} tint="regular" className="absolute inset-0" />

      <View
        className="flex-1 justify-between px-6"
        style={{ paddingTop: insets.top + 32 }}
      >
        {/* Title */}
        <Animated.View style={headerAnimatedStyle}>
          <Title variant="centered" className="text-4xl">
            Start Quest
          </Title>
        </Animated.View>

        {/* Compass Animation */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          className="mb-8 items-center"
        >
          <CompassAnimation
            size={60}
            delay={400}
            color={colors.secondary[300]}
          />
        </Animated.View>

        {/* Card with Quest Info */}
        <View className="flex-1 justify-center">
          <Animated.View style={cardAnimatedStyle}>
            <Card
              headerImage={getCharacterAvatar(character?.type)}
              headerImageStyle={{ height: 240 }}
            >
              <View className="p-6">
                {/* Quest Title and Duration - Same Row */}
                <Animated.View
                  entering={FadeInDown.delay(500).duration(800)}
                  className="mb-1 flex-row items-baseline justify-between"
                >
                  <Text
                    className="flex-1 text-2xl font-bold text-white"
                    style={{ fontWeight: '700' }}
                  >
                    {pendingQuest.title}
                  </Text>
                  <View className="ml-3 flex-row items-center">
                    <Clock size={14} color={colors.secondary[300]} />
                    <Text className="ml-1 text-sm text-neutral-200">
                      {pendingQuest.durationMinutes} min
                    </Text>
                  </View>
                </Animated.View>

                {/* Subtitle */}
                <Animated.Text
                  entering={FadeInDown.delay(600).duration(800)}
                  className="text-sm leading-relaxed text-neutral-200"
                >
                  {pendingQuest?.mode === 'custom'
                    ? 'Time to focus on what matters most'
                    : 'Your character is ready for their quest'}
                </Animated.Text>
              </View>
            </Card>
          </Animated.View>
        </View>

        {/* Lock Instructions - Outside Card with Shimmer */}
        <Animated.View
          entering={FadeInDown.delay(800).duration(800)}
          style={shimmerAnimatedStyle}
          className="mb-6 flex-row items-center justify-center"
        >
          <Lock size={18} color={colors.white} />
          <Text className="ml-2 text-base font-semibold text-white">
            Lock your phone to begin
          </Text>
        </Animated.View>

        {/* Cancel Button */}
        <Animated.View style={buttonAnimatedStyle} className="mb-6">
          <Button
            onPress={handleCancelQuest}
            variant="destructive"
            className="items-center rounded-full"
          >
            <Text
              className="text-base font-semibold"
              style={{ fontWeight: '700' }}
            >
              Cancel Quest
            </Text>
          </Button>
        </Animated.View>
      </View>
    </View>
  );
}
