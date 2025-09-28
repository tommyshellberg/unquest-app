import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  bottomPadding?: number;
  noPadding?: boolean;
  noHorizontalPadding?: boolean;
}

/**
 * A container component that adds consistent padding for screens
 * Since the root SafeAreaView doesn't include bottom edge, this ensures
 * content doesn't go too close to the bottom of the screen
 *
 * Standard padding:
 * - Bottom: 8px above safe area (accounts for tab bar)
 * - Horizontal: 16px (4 in Tailwind = 16px)
 */
export function ScreenContainer({
  children,
  bottomPadding = 8, // Default 8px padding above safe area
  noPadding = false,
  noHorizontalPadding = false,
  style,
  ...props
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#102442', '#0e203b', '#0d1d35', '#0b1a2e', '#0a1628']}
      style={[
        {
          flex: 1,
          paddingBottom: noPadding ? 0 : insets.bottom + bottomPadding,
          paddingHorizontal: noHorizontalPadding ? 0 : 16,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}
