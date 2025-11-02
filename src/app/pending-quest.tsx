import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompassAnimation } from '@/components/quest';
import { Button, Text, Title, View } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useCharacterStore } from '@/store/character-store';
import { useQuestStore } from '@/store/quest-store';

import { QuestInfoCard } from './pending-quest/components/quest-info-card';
import {
  ANIMATION_CONFIG,
  STRINGS,
  TEST_IDS,
  UI_CONFIG,
} from './pending-quest/constants';
import { usePendingQuestAnimations } from './pending-quest/hooks/use-pending-quest-animations';

export default function PendingQuestScreen() {
  const pendingQuest = useQuestStore((state) => state.pendingQuest);
  const character = useCharacterStore((state) => state.character);
  const cancelQuest = useQuestStore((state) => state.cancelQuest);
  const insets = useSafeAreaInsets();

  // Use animation hook for all screen animations
  const { headerStyle, cardStyle, buttonStyle, shimmerStyle } =
    usePendingQuestAnimations(!!pendingQuest);

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
        testID={TEST_IDS.BACKGROUND_IMAGE}
        source={require('@/../assets/images/background/pending-quest-bg-alt.jpg')}
        className="absolute inset-0 size-full"
        resizeMode="cover"
        accessibilityLabel="Quest background"
      />
      {/* BlurView for a subtle overlay effect */}
      <BlurView
        intensity={UI_CONFIG.BLUR_INTENSITY}
        tint="regular"
        className="absolute inset-0"
      />

      <View
        className="flex-1 justify-between"
        style={{
          paddingTop: insets.top,
          paddingHorizontal: UI_CONFIG.HORIZONTAL_PADDING,
        }}
      >
        {/* Title */}
        <Animated.View style={headerStyle}>
          <Title variant="centered" className="text-4xl">
            {STRINGS.TITLE}
          </Title>
        </Animated.View>

        {/* Compass Animation */}
        <Animated.View
          entering={FadeInDown.delay(
            ANIMATION_CONFIG.COMPASS_FADE_DELAY
          ).duration(ANIMATION_CONFIG.COMPASS_FADE_DURATION)}
          className="mb-8 items-center"
        >
          <CompassAnimation
            size={UI_CONFIG.COMPASS_SIZE}
            delay={ANIMATION_CONFIG.COMPASS_ANIMATION_DELAY}
            color={colors.secondary[300]}
          />
        </Animated.View>

        {/* Card with Quest Info */}
        <View className="flex-1 justify-center">
          <Animated.View style={cardStyle}>
            <QuestInfoCard quest={pendingQuest} character={character} />
          </Animated.View>
        </View>

        {/* Lock Instructions - Outside Card with Shimmer */}
        <Animated.View
          testID={TEST_IDS.LOCK_INSTRUCTIONS}
          entering={FadeInDown.delay(
            ANIMATION_CONFIG.LOCK_INSTRUCTIONS_DELAY
          ).duration(ANIMATION_CONFIG.QUEST_INFO_FADE_DURATION)}
          style={shimmerStyle}
          className="mb-6 flex-row items-center justify-center"
        >
          <Lock
            size={UI_CONFIG.LOCK_ICON_SIZE}
            color={colors.white}
            accessibilityHidden
          />
          <Text
            className="ml-2 text-base font-semibold text-white"
            accessibilityLabel={STRINGS.LOCK_INSTRUCTIONS}
          >
            {STRINGS.LOCK_INSTRUCTIONS}
          </Text>
        </Animated.View>

        {/* Cancel Button */}
        <Animated.View
          style={[buttonStyle, { marginBottom: UI_CONFIG.BOTTOM_PADDING }]}
        >
          <Button
            onPress={handleCancelQuest}
            variant="destructive"
            className="items-center rounded-full"
            accessibilityRole="button"
            accessibilityLabel={STRINGS.CANCEL_BUTTON}
            accessibilityHint="Cancels the quest and returns to the previous screen"
          >
            <Text
              className="text-base font-semibold"
              style={{ fontWeight: '700' }}
            >
              {STRINGS.CANCEL_BUTTON}
            </Text>
          </Button>
        </Animated.View>
      </View>
    </View>
  );
}
