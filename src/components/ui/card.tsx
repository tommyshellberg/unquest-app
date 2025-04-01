import React from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  return (
    <View
      className={twMerge(
        'rounded-lg overflow-hidden bg-white shadow-sm elevation-1',
        className
      )}
    >
      {children}
    </View>
  );
}
