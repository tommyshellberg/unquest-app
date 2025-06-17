import React from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { twMerge } from 'tailwind-merge';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, className = '', style }: CardProps) {
  return (
    <View
      style={style}
      className={twMerge(
        'rounded-lg overflow-hidden bg-cardBackground shadow-sm elevation-1',
        className
      )}
    >
      {children}
    </View>
  );
}
