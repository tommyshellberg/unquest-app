import React from 'react';
import { View, type ViewProps } from 'react-native';
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
  className = '',
  ...props
}: ScreenContainerProps & { className?: string }) {
  const insets = useSafeAreaInsets();

  // Standard horizontal padding unless explicitly disabled
  const horizontalPadding = noHorizontalPadding ? '' : 'px-4';

  return (
    <View
      style={[
        {
          flex: 1,
          paddingBottom: noPadding ? 0 : insets.bottom + bottomPadding,
        },
        style,
      ]}
      className={`${horizontalPadding} ${className}`.trim()}
      {...props}
    >
      {children}
    </View>
  );
}
