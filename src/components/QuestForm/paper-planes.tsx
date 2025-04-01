import { Feather } from '@expo/vector-icons';
import React from 'react';

import { View } from '@/components/ui';

export const PaperPlanes = () => {
  return (
    <View className="relative h-[120px] items-center justify-center">
      <Feather
        name="bell-off"
        size={45}
        color="#555"
        style={{ transform: [{ rotate: '30deg' }] }}
      />
      <Feather
        name="phone-off"
        size={24}
        color="#777"
        style={{
          position: 'absolute',
          transform: [{ rotate: '30deg' }],
          top: 20,
          right: 60,
        }}
      />
      <Feather
        name="cloud-off"
        size={18}
        color="#999"
        style={{
          position: 'absolute',
          transform: [{ rotate: '30deg' }],
          top: 40,
          left: 60,
        }}
      />
    </View>
  );
};
