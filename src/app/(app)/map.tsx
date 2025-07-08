import MaskedView from '@react-native-masked-view/masked-view';
import React, { useMemo, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import type { ReactNativeZoomableViewProps } from '@openspacelabs/react-native-zoomable-view';

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
  const zoomableViewRef = useRef<any>(null);

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

  // Calculate initial zoom to ensure the map covers the screen
  const initialZoom = Math.max(
    screenWidth / IMAGE_WIDTH,
    screenHeight / IMAGE_HEIGHT
  );

  // Calculate initial offset to show bottom-right corner
  const initialOffsetX = 0;
  const initialOffsetY = 0;

  return (
    <View className="flex-1 bg-[rgba(61,73,78,0.92)]">
      <FocusAwareStatusBar />

      {/* Map Title */}
      <View className="absolute left-4 top-10 z-10 rounded-lg bg-white/10 px-3 py-1 backdrop-blur-sm">
        <Text className="text-xl font-bold text-primary-400">
          {getMapNameForQuest(lastCompletedQuest?.id || '')}
        </Text>
      </View>

      {/* Zoomable Map with mask */}
      <View style={{ flex: 1 }}>
        <ReactNativeZoomableView
          ref={zoomableViewRef}
          maxZoom={2}
          minZoom={initialZoom}
          initialZoom={initialZoom}
          initialOffsetX={initialOffsetX}
          initialOffsetY={initialOffsetY}
          bindToBorders={true}
          contentWidth={IMAGE_WIDTH}
          contentHeight={IMAGE_HEIGHT}
          panBoundaryPadding={0}
          style={{ flex: 1 }}
          doubleTapDelay={300}
          movementSensibility={3}
          longPressDuration={700}
        >
          <View style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}>
            <MaskedView
              style={{ flex: 1, width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
              androidRenderingMode={
                Platform.OS === 'android' ? 'software' : undefined
              }
              maskElement={
                <View
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    width: IMAGE_WIDTH,
                    height: IMAGE_HEIGHT,
                  }}
                >
                  <Image
                    source={currentMask}
                    style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
                    contentFit="cover"
                  />
                </View>
              }
            >
              <Image
                source={mapImage}
                style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
                contentFit="cover"
              />
            </MaskedView>
          </View>
        </ReactNativeZoomableView>
      </View>
    </View>
  );
}
