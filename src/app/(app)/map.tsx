import MaskedView from '@react-native-masked-view/masked-view';
import { Asset } from 'expo-asset';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Dimensions, Pressable } from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { MAP_IMAGES, type MapId } from '@/app/data/maps';
import { getMapForQuest, getMapNameForQuest } from '@/app/utils/map-utils';
import { Image, Text, View } from '@/components/ui';
import { FocusAwareStatusBar } from '@/components/ui';
import { muted } from '@/components/ui/colors';
import { white } from '@/components/ui/colors';
import { usePOIStore } from '@/store/poi-store';
import { useQuestStore } from '@/store/quest-store';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 834;
const maskWidth = 500;
const maskHeight = 500;

// Debug the image source immediately
const MASK_IMAGE = require('@/../assets/images/fog-mask-2.png');

export default function MapScreen() {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Shared value for new mask animations
  const newMaskScale = useSharedValue(0.1);

  // Calculate boundaries
  const maxTranslateX = 1;
  const minTranslateX = screenWidth - IMAGE_WIDTH;
  const maxTranslateY = 1;
  const minTranslateY = -20; // Adjust based on your UI needs

  const pois = usePOIStore((state) => state.pois);
  const lastRevealedPOISlug = usePOIStore((state) => state.lastRevealedPOISlug);
  const resetLastRevealedPOI = usePOIStore(
    (state) => state.resetLastRevealedPOI
  );

  const poiScale = useSharedValue(1);

  // Add a ref to track if we're currently animating
  const isAnimating = useRef(false);

  // Get the last completed quest
  const completedQuests = useQuestStore((state) => state.getCompletedQuests());
  const lastCompletedQuest = completedQuests[completedQuests.length - 1];

  // Determine the map to display
  const mapId = useMemo<MapId>(
    () => getMapForQuest(lastCompletedQuest?.id || ''),
    [lastCompletedQuest]
  );

  // Memoize filtered POIs
  const revealedPOIS = useMemo(
    () =>
      pois.filter((poi) => poi.isRevealed).filter((poi) => poi.mapId === mapId),
    [pois, mapId]
  );

  // Get the map image
  const mapImage = MAP_IMAGES[mapId];

  useEffect(() => {
    console.log('ismaploaded', isMapLoaded);
  }, [isMapLoaded]);

  useEffect(() => {
    console.log('map screen mounting');
  }, []);

  // Preload the map image when the mapImage changes.
  useEffect(() => {
    if (mapImage) {
      Asset.fromModule(mapImage)
        .downloadAsync()
        .catch((error) => console.error('Error preloading map image', error));
    }
  }, [mapImage]);

  const handleLoad = useCallback(() => {
    setIsMapLoaded(true);
  }, []);

  const handleError = useCallback((error: any) => {
    setLoadError(error.nativeEvent.error);
  }, []);

  // Add cleanup for animations
  useEffect(() => {
    return () => {
      // Reset shared values on unmount
      if (translateX) translateX.value = 0;
      if (translateY) translateY.value = 0;
      if (poiScale) poiScale.value = 1;
      if (newMaskScale) newMaskScale.value = 0.1;
    };
  }, [translateX, translateY, poiScale, newMaskScale]);

  // This effect positions the map based on the state of `lastRevealedPOISlug`
  useEffect(() => {
    let isActive = true;

    if (lastRevealedPOISlug && !isAnimating.current) {
      const poi = pois.find((p) => p.slug === lastRevealedPOISlug);
      if (poi && isActive) {
        isAnimating.current = true;
        // Calculate center if a POI has been revealed:
        const centerX = -(poi.x - screenWidth / 2);
        const centerY = -(poi.y - screenHeight / 2);

        // Bound the translation so that it doesn't move off the map
        translateX.value = Math.max(
          Math.min(centerX, maxTranslateX),
          minTranslateX
        );
        translateY.value = Math.max(
          Math.min(centerY, maxTranslateY),
          minTranslateY
        );

        // Initialize animations
        poiScale.value = 0.1;
        newMaskScale.value = 0.1;
        try {
          poiScale.value = withTiming(1, { duration: 1500 });
          newMaskScale.value = withSpring(1, {
            damping: 12,
            stiffness: 90,
          });
          withTiming(1, { duration: 2500 }, (finished) => {
            if (finished && isActive) {
              runOnJS(() => {
                isAnimating.current = false;
                if (isActive) {
                  resetLastRevealedPOI();
                }
              })();
            }
          });
        } catch (error) {
          console.error('Animation error:', error);
          isAnimating.current = false;
        }
      }
    } else {
      // No quest revealed or no lastRevealedPOISlug, so position the map at (0,0)
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
    }

    return () => {
      isActive = false;
      isAnimating.current = false;
    };
  }, [lastRevealedPOISlug]);

  const panGesture = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      const newTranslateX = ctx.startX + event.translationX;
      const newTranslateY = ctx.startY + event.translationY;

      // Apply constraints to prevent scrolling beyond map boundaries
      translateX.value = Math.max(
        Math.min(newTranslateX, maxTranslateX),
        minTranslateX
      );
      translateY.value = Math.max(
        Math.min(newTranslateY, maxTranslateY),
        minTranslateY
      );
    },
  });

  const imageStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
        ],
      };
    } catch (error) {
      console.error('Image style error:', error);
      return {};
    }
  });

  const handlePOIPress = useCallback((slug: string) => {
    console.log('POI pressed:', slug);
  }, []);

  const poiAnimatedStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [{ scale: poiScale.value }],
      };
    } catch (error) {
      console.error('POI style error:', error);
      return {};
    }
  });

  // Animated style for new mask reveals
  const maskAnimatedStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [{ scale: newMaskScale.value }],
      };
    } catch (error) {
      console.error('Mask style error:', error);
      return {};
    }
  });

  if (loadError) {
    return (
      <View className="flex-1 items-center justify-center bg-[rgba(61,73,78,0.92)]">
        <Text className="p-5 text-center text-base text-red-400">
          Error loading map: {loadError}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <FocusAwareStatusBar />

      {/* Show a loading overlay until the map image loads */}
      {!isMapLoaded && (
        <View className="absolute inset-0 z-10 items-center justify-center bg-black/50">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      {/* Map title */}
      <View className="absolute left-4 top-10 z-10 overflow-hidden rounded-lg bg-white/10 px-3 py-1 backdrop-blur-sm">
        <Text className="text-xl font-bold text-primary-400 drop-shadow-md">
          {getMapNameForQuest(lastCompletedQuest?.id || '')}
        </Text>
      </View>

      <PanGestureHandler onGestureEvent={panGesture}>
        <Animated.View
          className="flex-1"
          style={[
            { backgroundColor: 'rgba(61, 73, 78, 0.92)' }, // This specific background color was crucial in the original
          ]}
        >
          <MaskedView
            style={{ flex: 1 }} // Direct style needed for MaskedView
            androidRenderingMode="software"
            maskElement={
              <Animated.View
                style={[
                  {
                    width: IMAGE_WIDTH,
                    height: IMAGE_HEIGHT,
                    backgroundColor: 'transparent',
                  },
                  imageStyle,
                ]}
              >
                {revealedPOIS.map((poi, index) => {
                  const isLastRevealed = poi.slug === lastRevealedPOISlug;
                  return (
                    <Animated.View
                      key={index}
                      style={[
                        {
                          position: 'absolute',
                          left: poi.x - maskWidth / 2,
                          top: poi.y - maskHeight / 2,
                        },
                        isLastRevealed ? maskAnimatedStyle : undefined,
                      ]}
                    >
                      <Image
                        source={MASK_IMAGE}
                        style={{
                          width: maskWidth,
                          height: maskHeight,
                        }}
                        contentFit="cover"
                      />
                    </Animated.View>
                  );
                })}
              </Animated.View>
            }
          >
            <Animated.View
              style={[
                {
                  width: IMAGE_WIDTH,
                  height: IMAGE_HEIGHT,
                  backgroundColor: 'transparent',
                },
                imageStyle,
              ]}
            >
              <Image
                source={mapImage}
                style={{
                  width: IMAGE_WIDTH,
                  height: IMAGE_HEIGHT,
                }}
                onLoad={handleLoad}
                onError={handleError}
                contentFit="cover"
              />

              {revealedPOIS.map((poi) => {
                const isLastRevealed = poi.slug === lastRevealedPOISlug;
                return (
                  <Animated.View
                    key={poi.slug}
                    style={[
                      {
                        position: 'absolute',
                        left: poi.x,
                        top: poi.y,
                        padding: 4,
                        borderRadius: 4,
                        backgroundColor: poi.isRevealed ? white : muted[400],
                        opacity: poi.isRevealed ? 1 : 0.5,
                      },
                      isLastRevealed ? poiAnimatedStyle : undefined,
                    ]}
                  >
                    <Pressable
                      onPress={() => handlePOIPress(poi.slug)}
                      disabled={!poi.isRevealed}
                    >
                      <Text className="text-xs text-black">{poi.name}</Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </Animated.View>
          </MaskedView>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}
