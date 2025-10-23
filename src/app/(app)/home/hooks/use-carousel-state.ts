import { useState, useEffect } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { SNAP_INTERVAL, ANIMATION_TIMINGS } from '../constants';

interface UseCarouselStateOptions {
  onPaywallReset?: () => void;
}

export function useCarouselState(options?: UseCarouselStateOptions) {
  const { onPaywallReset } = options || {};
  const [activeIndex, setActiveIndex] = useState(0);
  const progress = useSharedValue(0);

  // Reset paywall modal when carousel index changes
  useEffect(() => {
    if (onPaywallReset && activeIndex > 0) {
      onPaywallReset();
    }
  }, [activeIndex, onPaywallReset]);

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SNAP_INTERVAL);
    setActiveIndex(newIndex);
    progress.value = withTiming(newIndex, {
      duration: ANIMATION_TIMINGS.CAROUSEL_TRANSITION,
    });
  };

  return {
    activeIndex,
    setActiveIndex,
    progress,
    handleMomentumScrollEnd,
  };
}
