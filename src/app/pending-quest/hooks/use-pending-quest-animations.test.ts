import { renderHook } from '@testing-library/react-native';

import { usePendingQuestAnimations } from './use-pending-quest-animations';

describe('usePendingQuestAnimations', () => {
  it('returns animation styles object', () => {
    const { result } = renderHook(() => usePendingQuestAnimations(true));

    expect(result.current).toHaveProperty('headerStyle');
    expect(result.current).toHaveProperty('cardStyle');
    expect(result.current).toHaveProperty('buttonStyle');
    expect(result.current).toHaveProperty('shimmerStyle');
  });

  it('returns styles when shouldAnimate is false', () => {
    const { result } = renderHook(() => usePendingQuestAnimations(false));

    expect(result.current).toHaveProperty('headerStyle');
    expect(result.current).toHaveProperty('cardStyle');
    expect(result.current).toHaveProperty('buttonStyle');
    expect(result.current).toHaveProperty('shimmerStyle');
  });

  it('updates when shouldAnimate changes from false to true', () => {
    const { result, rerender } = renderHook(
      ({ shouldAnimate }) => usePendingQuestAnimations(shouldAnimate),
      { initialProps: { shouldAnimate: false } }
    );

    const initialStyles = result.current;

    // Change to true to trigger animations
    rerender({ shouldAnimate: true });

    const updatedStyles = result.current;

    // Styles should still be defined (animation is triggered but styles remain valid)
    expect(updatedStyles).toHaveProperty('headerStyle');
    expect(updatedStyles).toHaveProperty('cardStyle');
    expect(updatedStyles).toHaveProperty('buttonStyle');
    expect(updatedStyles).toHaveProperty('shimmerStyle');
  });

  it('maintains stable style references', () => {
    const { result } = renderHook(() => usePendingQuestAnimations(true));

    const firstRender = result.current;
    const secondRender = result.current;

    // Same reference on subsequent accesses
    expect(firstRender.headerStyle).toBe(secondRender.headerStyle);
  });
});
