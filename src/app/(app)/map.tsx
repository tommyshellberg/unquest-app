import MaskedView from '@react-native-masked-view/masked-view';
import React, { useMemo, useRef, useState, useEffect } from 'react';
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
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isMaskLoaded, setIsMaskLoaded] = useState(false);

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

  // Android-specific: Force reload images
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Reset load states to force re-render
      setIsImageLoaded(false);
      setIsMaskLoaded(false);
      
      // Small delay to ensure proper loading
      const timer = setTimeout(() => {
        setIsImageLoaded(true);
        setIsMaskLoaded(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setIsImageLoaded(true);
      setIsMaskLoaded(true);
    }
  }, [mapImage, currentMask]);

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
            {Platform.OS === 'android' ? (
              // Android: Use inverted mask approach for better compatibility
              <View style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}>
                {/* Fog/unexplored area as base layer */}
                <View
                  style={{
                    position: 'absolute',
                    width: IMAGE_WIDTH,
                    height: IMAGE_HEIGHT,
                    backgroundColor: '#1a1a1a', // Dark fog color
                    top: 0,
                    left: 0,
                  }}
                />
                {/* Map visible through mask areas */}
                <MaskedView
                  style={{ 
                    position: 'absolute',
                    width: IMAGE_WIDTH, 
                    height: IMAGE_HEIGHT,
                    top: 0,
                    left: 0,
                  }}
                  maskElement={
                    <View
                      style={{
                        backgroundColor: 'transparent',
                        width: IMAGE_WIDTH,
                        height: IMAGE_HEIGHT,
                      }}
                    >
                      <Image
                        source={currentMask}
                        style={{ 
                          width: IMAGE_WIDTH, 
                          height: IMAGE_HEIGHT,
                          tintColor: 'white', // Ensure mask is treated as alpha channel
                        }}
                        contentFit="cover"
                        onLoad={() => setIsMaskLoaded(true)}
                        cachePolicy="memory-disk"
                      />
                    </View>
                  }
                >
                  <Image
                    source={mapImage}
                    style={{ 
                      width: IMAGE_WIDTH, 
                      height: IMAGE_HEIGHT,
                    }}
                    contentFit="cover"
                    onLoad={() => setIsImageLoaded(true)}
                    cachePolicy="memory-disk"
                  />
                </MaskedView>
              </View>
            ) : (
              // iOS: Use MaskedView for better fog effect
              <MaskedView
                style={{ flex: 1, width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
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
            )}
          </View>
        </ReactNativeZoomableView>
      </View>
    </View>
  );
}
