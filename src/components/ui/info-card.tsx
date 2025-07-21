import { Info } from 'lucide-react-native';
import React from 'react';

import { Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';

interface InfoCardProps {
  title: string;
  description: string;
  iconSize?: number;
  variant?: 'light' | 'solid';
}

export function InfoCard({
  title,
  description,
  iconSize = 20,
  variant = 'light',
}: InfoCardProps) {
  const isLight = variant === 'light';

  return (
    <View
      className="rounded-lg p-4"
      style={{
        backgroundColor: isLight ? colors.primary[100] : colors.primary[400],
      }}
    >
      <View className="flex-row items-start">
        <Info
          size={iconSize}
          color={isLight ? colors.primary[500] : colors.white}
          style={{ marginTop: 2 }}
        />
        <View className="ml-2 flex-1">
          <Text
            className="text-base font-semibold"
            style={{
              color: isLight ? colors.primary[500] : colors.white,
              fontWeight: '700',
            }}
          >
            {title}
          </Text>
          <Text
            className="mt-1 text-sm"
            style={{
              color: isLight ? colors.primary[400] : colors.white,
            }}
          >
            {description}
          </Text>
        </View>
      </View>
    </View>
  );
}
