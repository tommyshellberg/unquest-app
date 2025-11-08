/**
 * LeaderboardItem Component
 *
 * Displays a single leaderboard entry with rank, avatar, username, and metric.
 * Fully accessible with proper labels and roles.
 */

import { Trophy } from 'lucide-react-native';
import React from 'react';
import { Image } from 'react-native';

import CHARACTERS from '@/app/data/characters';
import { Text, View } from '@/components/ui';

import { COLORS, STRINGS, UI_CONFIG } from '@/features/leaderboard/constants/leaderboard-constants';
import type { LeaderboardItemProps } from '@/features/leaderboard/types/leaderboard-types';
import { getMetricLabel } from '@/features/leaderboard/utils/leaderboard-utils';

export function LeaderboardItem({ entry, type }: LeaderboardItemProps) {
  const character = CHARACTERS.find((c) => c.id === entry.characterType);
  const metricLabel = getMetricLabel(type, entry.metric);

  const isTopThree = entry.rank && entry.rank <= 3;

  return (
    <View
      className="flex-row items-center px-4 py-3"
      style={
        entry.isCurrentUser
          ? { backgroundColor: COLORS.currentUserHighlight }
          : {}
      }
      accessible
      accessibilityLabel={`${entry.rank ? `Rank ${entry.rank}` : 'Your position'}, ${entry.username}${entry.isCurrentUser ? ', you' : ''}${entry.isFriend ? ', friend' : ''}, ${metricLabel}`}
    >
      {/* Rank Number */}
      <Text
        className={`${UI_CONFIG.rankWidth} text-lg font-bold`}
        style={{ color: isTopThree ? COLORS.gold : COLORS.textSecondary }}
      >
        {entry.rank || ''}
      </Text>

      {/* Character Avatar */}
      <Image
        source={character?.profileImage}
        className="ml-3 size-10 rounded-full bg-gray-300"
        accessibilityLabel={`${entry.username}'s character avatar`}
      />

      {/* Username and Friend Badge */}
      <View className="ml-3 flex-1">
        <Text
          className="font-semibold"
          style={{
            color: COLORS.textPrimary,
          }}
        >
          {entry.username}
          {entry.isCurrentUser && (
            <Text className="text-sm" style={{ color: COLORS.textSecondary }}>
              {STRINGS.currentUserSuffix}
            </Text>
          )}
        </Text>
        {entry.isFriend && !entry.isCurrentUser && (
          <Text className="text-xs" style={{ color: COLORS.textSecondary }}>
            {STRINGS.friendLabel}
          </Text>
        )}
      </View>

      {/* Metric Value */}
      <Text
        className="text-lg font-bold"
        style={{ color: COLORS.secondaryAccent }}
      >
        {metricLabel}
      </Text>

      {/* Trophy Icon for First Place */}
      {entry.rank === 1 && (
        <Trophy
          size={UI_CONFIG.iconSizeSmall}
          color={COLORS.gold}
          className="ml-2"
          accessibilityLabel="First place trophy"
        />
      )}
    </View>
  );
}
