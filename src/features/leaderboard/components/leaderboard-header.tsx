/**
 * LeaderboardHeader Component
 *
 * Displays the top-ranked user in a featured card with trophy background.
 * Fully accessible with proper labels.
 */

import { Crown, Trophy } from 'lucide-react-native';
import React from 'react';
import { Image } from 'react-native';

import CHARACTERS from '@/app/data/characters';
import { Card, Text, View } from '@/components/ui';

import { COLORS, UI_CONFIG } from '@/features/leaderboard/constants/leaderboard-constants';
import type { LeaderboardHeaderProps } from '@/features/leaderboard/types/leaderboard-types';
import { getMetricLabelFull } from '@/features/leaderboard/utils/leaderboard-utils';

export function LeaderboardHeader({ topUser, type }: LeaderboardHeaderProps) {
  const character = CHARACTERS.find((c) => c.id === topUser.characterType);
  const metricLabel = getMetricLabelFull(type);

  return (
    <Card className="relative mb-4 overflow-hidden">
      {/* Background Trophy */}
      <View
        className="absolute opacity-10"
        style={{
          right: UI_CONFIG.trophyBackgroundOffset,
          top: UI_CONFIG.trophyBackgroundOffset,
        }}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Trophy
          size={UI_CONFIG.iconSizeTrophy}
          color={COLORS.secondaryAccent}
          style={{
            transform: [{ rotate: UI_CONFIG.trophyBackgroundRotation }],
          }}
        />
      </View>

      <View className="items-center p-6">
        {/* Crown icon above avatar */}
        <Crown
          size={UI_CONFIG.iconSizeLarge}
          color={COLORS.gold}
          className="mb-2"
          accessibilityLabel="First place crown"
        />

        {/* Character Avatar */}
        <Image
          source={character?.profileImage}
          className="size-20 rounded-full bg-gray-300"
          accessibilityLabel={`${topUser.username}'s character avatar`}
        />

        {/* Username */}
        <Text
          className="mt-3 text-xl font-bold"
          style={{ color: COLORS.textPrimary }}
        >
          {topUser.username}
        </Text>

        {/* Metric Value */}
        <Text
          className="mt-1 text-3xl font-bold"
          style={{ color: COLORS.secondaryAccent }}
        >
          {topUser.metric}
        </Text>

        {/* Metric Label */}
        <Text className="text-sm" style={{ color: COLORS.textSecondary }}>
          {metricLabel}
        </Text>
      </View>
    </Card>
  );
}
