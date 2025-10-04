import React from 'react';
import { Clock } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';

import { Card, View } from '@/components/ui';
import colors from '@/components/ui/colors';

interface QuestCardProps {
  title: string;
  duration: number;
  children: React.ReactNode;
}

export function QuestCard({ title, duration, children }: QuestCardProps) {
  return (
    <Card
      className="rounded-xl p-6"
      style={{ backgroundColor: colors.cardBackground }}
    >
      {/* Quest Header - Horizontal Layout */}
      <View className="mb-6">
        {/* Title - Left Aligned */}
        <Animated.Text
          entering={FadeInLeft.delay(300).duration(800)}
          className="mb-3 text-2xl font-bold text-white"
          style={{ fontWeight: '700' }}
        >
          {title}
        </Animated.Text>

        {/* Duration Badge - Horizontal with Icon */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800)}
          className="flex-row items-center"
        >
          <View className="mr-2 rounded-full bg-secondary-400 p-2">
            <Clock size={16} color={colors.white} />
          </View>
          <View>
            <Animated.Text
              className="text-xs uppercase tracking-wide text-neutral-300"
              style={{ fontWeight: '600' }}
            >
              Duration
            </Animated.Text>
            <Animated.Text
              className="text-lg font-bold text-white"
              style={{ fontWeight: '700' }}
            >
              {duration} minutes
            </Animated.Text>
          </View>
        </Animated.View>
      </View>

      {/* Divider */}
      <View className="mb-6 h-px bg-neutral-400" />

      {children}
    </Card>
  );
}
