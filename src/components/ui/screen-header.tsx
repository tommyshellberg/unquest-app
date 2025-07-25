import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text, View } from './index';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  animate?: boolean;
}

/**
 * Standard header component for screens with consistent spacing
 * - Top margin: mt-6 (24px) for consistent spacing from safe area
 * - Bottom margin: mb-4 (16px) for spacing to content
 */
export function ScreenHeader({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  animate = true,
}: ScreenHeaderProps) {
  const router = useRouter();
  const headerOpacity = useSharedValue(animate ? 0 : 1);

  React.useEffect(() => {
    if (animate) {
      headerOpacity.value = withTiming(1, { duration: 800 });
    }
  }, [animate, headerOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const HeaderWrapper = animate ? Animated.View : View;

  return (
    <HeaderWrapper style={animate ? animatedStyle : undefined} className="mb-4">
      <View className="mb-2 mt-4 flex-row items-center">
        {showBackButton && (
          <TouchableOpacity onPress={handleBackPress} className="mr-3 p-1">
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text className="flex-1 text-3xl font-bold">{title}</Text>
      </View>
      {subtitle && <Text className="text-sm text-neutral-600">{subtitle}</Text>}
    </HeaderWrapper>
  );
}
