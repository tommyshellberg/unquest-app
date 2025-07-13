import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';

interface LockInstructionsProps {
  variant: 'single' | 'cooperative';
  delay?: number;
}

export function LockInstructions({ variant, delay = 1000 }: LockInstructionsProps) {
  const isSingle = variant === 'single';
  
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(800)}
      className="rounded-lg p-4"
      style={{ backgroundColor: colors.primary[100] }}
    >
      <Text
        className="text-center text-base font-semibold"
        style={{ color: colors.primary[500], fontWeight: '700' }}
      >
        🔒 {isSingle ? 'Lock your phone to begin' : 'Lock phones to begin'}
      </Text>
      <Text
        className="mt-2 text-center text-sm"
        style={{ color: colors.primary[400] }}
      >
        {isSingle 
          ? 'Stay focused • Complete your quest • Earn rewards'
          : 'All companions must lock together'
        }
      </Text>
    </Animated.View>
  );
}