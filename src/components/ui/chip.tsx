import React from 'react';
import { Pressable, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Text } from './text';

type ChipProps = {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  onPress?: () => void;
};

export function Chip({
  children,
  className = '',
  textClassName = '',
  onPress,
}: ChipProps) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      className={twMerge(
        'self-start px-3 py-1 rounded-full bg-gray-200/20',
        className
      )}
      onPress={onPress}
    >
      <Text className={twMerge('text-sm', textClassName)}>{children}</Text>
    </Container>
  );
}
