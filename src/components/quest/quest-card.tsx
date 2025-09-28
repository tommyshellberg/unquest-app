import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
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
      <Animated.Text
        entering={FadeInDown.delay(300).duration(800)}
        className="mb-2 text-center text-xl font-semibold text-white"
        style={{ fontWeight: '700' }}
      >
        {title}
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.delay(400).duration(800)}
        className="mb-4 text-center text-base"
        style={{ color: colors.white }}
      >
        {`${duration} minutes`}
      </Animated.Text>
      {children}
    </Card>
  );
}
