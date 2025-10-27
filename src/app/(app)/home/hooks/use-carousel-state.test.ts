import { act, renderHook } from '@testing-library/react-native';

import { SNAP_INTERVAL } from '../constants';
import { useCarouselState } from './use-carousel-state';

// Mock react-native-reanimated
const mockSharedValues = new Map<any, { value: number }>();

jest.mock('react-native-reanimated', () => {
  const actualReanimated = jest.requireActual('react-native-reanimated/mock');
  return {
    ...actualReanimated,
    useSharedValue: (initial: number) => {
      const sharedValue = { value: initial };
      mockSharedValues.set(sharedValue, sharedValue);
      return sharedValue;
    },
    withTiming: (value: number) => value,
  };
});

describe('useCarouselState', () => {
  describe('Initialization', () => {
    it('should initialize with activeIndex 0', () => {
      const { result } = renderHook(() => useCarouselState());

      expect(result.current.activeIndex).toBe(0);
    });

    it('should initialize progress shared value to 0', () => {
      const { result } = renderHook(() => useCarouselState());

      expect(result.current.progress.value).toBe(0);
    });
  });

  describe('Carousel Navigation', () => {
    it('should update activeIndex when scrolling to next item', () => {
      const { result } = renderHook(() => useCarouselState());

      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: SNAP_INTERVAL },
        },
      };

      act(() => {
        result.current.handleMomentumScrollEnd(scrollEvent);
      });

      expect(result.current.activeIndex).toBe(1);
    });

    it('should update activeIndex when scrolling to third item', () => {
      const { result } = renderHook(() => useCarouselState());

      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: SNAP_INTERVAL * 2 },
        },
      };

      act(() => {
        result.current.handleMomentumScrollEnd(scrollEvent);
      });

      expect(result.current.activeIndex).toBe(2);
    });

    it('should update progress shared value when scrolling', () => {
      const { result } = renderHook(() => useCarouselState());

      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: SNAP_INTERVAL },
        },
      };

      // Store initial progress object reference
      const progressRef = result.current.progress;

      act(() => {
        result.current.handleMomentumScrollEnd(scrollEvent);
      });

      // Progress shared value should be updated (checking via assignment in implementation)
      // Note: In tests, we can't verify animation internals, but we verify the value is set
      expect(progressRef.value).toBe(1);
    });

    it('should round to nearest index when scroll offset is between items', () => {
      const { result } = renderHook(() => useCarouselState());

      // Scroll to halfway between item 1 and 2
      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: SNAP_INTERVAL * 1.4 },
        },
      };

      act(() => {
        result.current.handleMomentumScrollEnd(scrollEvent);
      });

      expect(result.current.activeIndex).toBe(1);
    });
  });

  describe('Paywall Reset', () => {
    it('should call onPaywallReset when activeIndex changes', () => {
      const onPaywallReset = jest.fn();
      const { result } = renderHook(() => useCarouselState({ onPaywallReset }));

      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: SNAP_INTERVAL },
        },
      };

      act(() => {
        result.current.handleMomentumScrollEnd(scrollEvent);
      });

      expect(onPaywallReset).toHaveBeenCalledTimes(1);
    });

    it('should not call onPaywallReset if callback not provided', () => {
      const { result } = renderHook(() => useCarouselState());

      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: SNAP_INTERVAL },
        },
      };

      // Should not throw error
      expect(() => {
        act(() => {
          result.current.handleMomentumScrollEnd(scrollEvent);
        });
      }).not.toThrow();
    });
  });

  describe('Manual Index Setting', () => {
    it('should allow manually setting activeIndex', () => {
      const { result } = renderHook(() => useCarouselState());

      act(() => {
        result.current.setActiveIndex(2);
      });

      expect(result.current.activeIndex).toBe(2);
    });

    it('should call onPaywallReset when manually setting index', () => {
      const onPaywallReset = jest.fn();
      const { result } = renderHook(() => useCarouselState({ onPaywallReset }));

      act(() => {
        result.current.setActiveIndex(1);
      });

      expect(onPaywallReset).toHaveBeenCalledTimes(1);
    });
  });
});
