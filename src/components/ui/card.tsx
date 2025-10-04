import React from 'react';
import { Image, type StyleProp, View, type ViewStyle } from 'react-native';
import { twMerge } from 'tailwind-merge';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  headerImage?: any; // Image source (require or uri)
  headerImageStyle?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  className = '',
  style,
  headerImage,
  headerImageStyle
}: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(44, 69, 107, 0.92)', // cardBackground with 92% opacity
        },
        style,
      ]}
      className={twMerge(
        'rounded-lg overflow-hidden shadow-sm elevation-1',
        className
      )}
    >
      {headerImage && (
        <Image
          source={headerImage}
          style={[{ height: 120, width: '100%' }, headerImageStyle]}
          resizeMode="cover"
        />
      )}
      {children}
    </View>
  );
}
