import * as React from 'react';

import { Text, View } from '@/components/ui';

type TitleProps = {
  text?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'large' | 'centered';
  className?: string;
  showDivider?: boolean;
};

export const Title = ({
  text,
  children,
  variant = 'default',
  className = '',
  showDivider = false
}: TitleProps) => {
  const content = text || children;

  const sizeClasses = {
    default: 'text-3xl',
    large: 'text-4xl',
    centered: 'text-3xl',
  };

  const containerClasses = {
    default: 'flex-row items-center py-4 pb-2',
    large: 'flex-row items-center py-4 pb-2',
    centered: 'items-center justify-center pb-4',
  };

  return (
    <View className={containerClasses[variant]}>
      <Text className={`font-erstoria font-bold text-white ${sizeClasses[variant]} ${className}`}>
        {content}
      </Text>
      {showDivider && <View className="h-[2px] flex-1 ml-2" />}
    </View>
  );
};
