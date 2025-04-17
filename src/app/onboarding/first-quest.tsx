import { usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AVAILABLE_QUESTS } from '@/app/data/quests';
import { Button, Card, FocusAwareStatusBar, Text, View } from '@/components/ui';
import QuestTimer from '@/lib/services/quest-timer';
import { useQuestStore } from '@/store/quest-store';

export default function FirstQuestScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const prepareQuest = useQuestStore((state) => state.prepareQuest);

  // Animation values for a smooth sequential fade-in effect
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(-15);

  const hintOpacity = useSharedValue(0);
  const hintTranslateY = useSharedValue(-10);

  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(-5);

  // Start animations sequentially when component mounts
  useEffect(() => {
    // Header animation (first)
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withTiming(0, { duration: 600 });

    // Card animation (second)
    cardOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    cardTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));

    // Hint text animation (third)
    hintOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    hintTranslateY.value = withDelay(800, withTiming(0, { duration: 600 }));

    // Button animation (last)
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));
    buttonTranslateY.value = withDelay(1200, withSpring(0));
  }, [
    buttonOpacity,
    buttonTranslateY,
    cardOpacity,
    cardTranslateY,
    headerOpacity,
    headerTranslateY,
    hintOpacity,
    hintTranslateY,
  ]);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
    transform: [{ translateY: hintTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  // Handle starting the first quest
  const handleStartQuest = async () => {
    try {
      // Find the first story quest
      const firstStoryQuest = AVAILABLE_QUESTS.find(
        (quest) => quest.mode === 'story'
      );

      if (firstStoryQuest) {
        // Prepare the quest in the store
        prepareQuest(firstStoryQuest);

        // Prepare the quest timer - wrap in try/catch to prevent errors
        try {
          await QuestTimer.prepareQuest(firstStoryQuest);
        } catch (error) {
          console.error('Error preparing quest timer:', error);
          // Continue with navigation even if timer setup fails
        }
      }
    } catch (error) {
      console.error('Error starting quest:', error);
    }
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      <View className="absolute inset-0">
        <Image
          source={require('@/../assets/images/background/active-quest.jpg')}
          className="size-full"
          resizeMode="cover"
        />
      </View>

      <View className="flex-1 justify-between p-6">
        <Animated.View style={headerStyle} className="mt-10">
          <Text className="text-2xl font-bold">Your Journey Begins</Text>
        </Animated.View>

        <View className="flex-1 justify-center">
          <Animated.View style={cardStyle}>
            <Card className="p-6">
              <Text className="mb-4 text-lg font-semibold text-black">
                The Kingdom of Vaedros is in peril.
              </Text>
              <Text className="mb-4 text-black">
                The balance is broken. The light is trapped. The darkness is
                growing.
              </Text>
              <Text className="mb-4 text-black">
                You awaken lying on your back, the earth cold and damp beneath
                you. The trees stretch high, their gnarled limbs tangled
                overhead, blotting out the sky.
              </Text>
            </Card>
          </Animated.View>

          <Animated.View style={hintStyle}>
            <Text className="mt-10 text-center text-black">
              Click 'Wake up' to begin your journey.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={buttonStyle} className="mb-8 items-center">
          <Button
            label="Wake up"
            onPress={handleStartQuest}
            className="rounded-xl bg-primary-400 px-10"
            textClassName="text-white font-bold"
          />
        </Animated.View>
      </View>
    </View>
  );
}
