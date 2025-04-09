import { Feather } from '@expo/vector-icons';
import React from 'react';

import { View } from '@/components/ui';

export const PaperPlanes = () => {
  return (
    <View className="relative h-[60px] items-center justify-center">
      <Feather
        name="bell-off"
        size={30}
        color="#555"
        style={{ transform: [{ rotate: '30deg' }] }}
      />
      <Feather
        name="phone-off"
        size={16}
        color="#777"
        style={{
          position: 'absolute',
          transform: [{ rotate: '30deg' }],
          top: 10,
          right: 60,
        }}
      />
      <Feather
        name="cloud-off"
        size={12}
        color="#999"
        style={{
          position: 'absolute',
          transform: [{ rotate: '30deg' }],
          top: 20,
          left: 60,
        }}
      />
    </View>
  );
};
