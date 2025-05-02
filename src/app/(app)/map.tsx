import MaskedView from '@react-native-masked-view/masked-view';
import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { MAP_IMAGES, type MapId } from '@/app/data/maps';
import {
  getFogMaskForQuest,
  getMapForQuest,
  getMapNameForQuest,
} from '@/app/utils/map-utils';
import { Image, Text, View } from '@/components/ui';
import { FocusAwareStatusBar } from '@/components/ui';
import { useQuestStore } from '@/store/quest-store';

// Original map dimensions
const IMAGE_WIDTH = 1434;
const IMAGE_HEIGHT = 1434;
// Get device screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MapScreen() {
  // Position at bottom right corner
  const translateX = useSharedValue(-(IMAGE_WIDTH - screenWidth)); // All the way right
  const translateY = useSharedValue(-(IMAGE_HEIGHT - screenHeight)); // All the way down

  // Calculate pan boundaries
  const maxTranslateX = 0;
  const minTranslateX = -(IMAGE_WIDTH - screenWidth);
  const maxTranslateY = 0;
  const minTranslateY = -(IMAGE_HEIGHT - screenHeight);

  // Get the last completed quest
  const completedQuests = useQuestStore((state) => state.getCompletedQuests());
  const lastCompletedQuest = completedQuests[completedQuests.length - 1];

  // Determine the map to display
  const mapId = useMemo<MapId>(
    () => getMapForQuest(lastCompletedQuest?.id || ''),
    [lastCompletedQuest]
  );
  const mapImage = MAP_IMAGES[mapId];

  console.log('lastCompletedQuest', lastCompletedQuest);

  // Get the appropriate fog mask based on quest progression
  const currentMask = getFogMaskForQuest(lastCompletedQuest?.id);

  // Pan gesture handler
  const panGestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      // Calculate new translate values
      const newTranslateX = ctx.startX + event.translationX;
      const newTranslateY = ctx.startY + event.translationY;

      // Apply constraints to keep the map within bounds
      translateX.value = Math.min(
        Math.max(newTranslateX, minTranslateX),
        maxTranslateX
      );
      translateY.value = Math.min(
        Math.max(newTranslateY, minTranslateY),
        maxTranslateY
      );
    },
  });

  // Animated style for map panning
  const animatedMapStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-[rgba(61,73,78,0.92)]">
        <FocusAwareStatusBar />

        {/* Map Title */}
        <View className="absolute left-4 top-10 z-10 rounded-lg bg-white/10 px-3 py-1 backdrop-blur-sm">
          <Text className="text-xl font-bold text-primary-400">
            {getMapNameForQuest(lastCompletedQuest?.id || '')}
          </Text>
        </View>

        {/* Map with mask and pan gesture */}
        <PanGestureHandler onGestureEvent={panGestureHandler}>
          <Animated.View style={{ flex: 1, overflow: 'hidden' }}>
            <MaskedView
              style={{ flex: 1 }}
              androidRenderingMode="software"
              maskElement={
                <Animated.View
                  style={[{ backgroundColor: 'transparent' }, animatedMapStyle]}
                >
                  <Image
                    source={currentMask}
                    style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
                    contentFit="cover"
                  />
                </Animated.View>
              }
            >
              <Animated.View style={[animatedMapStyle]}>
                <Image
                  source={mapImage}
                  style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
                  contentFit="cover"
                />
              </Animated.View>
            </MaskedView>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </GestureHandlerRootView>
  );
}
