import React from 'react';
import type { AccessibilityRole, AccessibilityState } from 'react-native';
import { Pressable, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Text } from './text';

type ChipProps = {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  onPress?: () => void;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
};

export function Chip({
  children,
  className = '',
  textClassName = '',
  onPress,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: ChipProps) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      className={twMerge(
        'self-start px-3 py-1 rounded-full bg-gray-200/20',
        className
      )}
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
    >
      <Text className={twMerge('text-sm', textClassName)}>{children}</Text>
    </Container>
  );
}
