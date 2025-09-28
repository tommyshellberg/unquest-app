import * as React from 'react';

import { Text, View } from '@/components/ui';

type Props = {
  text: string;
};
export const Title = ({ text }: Props) => {
  return (
    <View className="flex-row items-center justify-center  py-4 pb-2">
      <Text className="font-erstoria pr-2 text-3xl text-white">{text}</Text>
      <View className="h-[2px] flex-1" />
    </View>
  );
};
