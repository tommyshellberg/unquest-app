import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * A gradient background component that applies the emberglow dark theme gradient
 * From top: lighter dark blue (#102442) to bottom: very dark blue (#0a1628)
 */
export function GradientBackground({ children, className = '' }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={['#102442', '#0e203b', '#0d1d35', '#0b1a2e', '#0a1628']}
      style={{ flex: 1 }}
      className={className}
    >
      {children}
    </LinearGradient>
  );
}

/**
 * Absolute positioned gradient background for use behind other content
 */
export function AbsoluteGradientBackground({ className = '' }: { className?: string }) {
  return (
    <View className={`absolute inset-0 ${className}`}>
      <LinearGradient
        colors={['#102442', '#0e203b', '#0d1d35', '#0b1a2e', '#0a1628']}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}