/**
 * Profile Screen Sub-Components
 *
 * Extracted from profile.tsx to improve component composition and reusability.
 */

import { Award, TrendingUp } from 'lucide-react-native';
import React from 'react';

import { Card, Pressable, Text, View } from '@/components/ui';

import { PROFILE_COLORS } from './profile-constants';
import type { ActionCardProps } from './profile-types';

/**
 * ActionCard - Reusable card component for navigation actions
 */
export function ActionCard({ icon: Icon, title, description, onPress }: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1"
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
    >
      <Card className="items-center justify-center py-6">
        <Icon size={32} color={PROFILE_COLORS.actionCardIcon} />
        <Text className="mt-2 text-base font-semibold text-white">
          {title}
        </Text>
        <Text className="mt-1 text-center text-sm text-neutral-200">
          {description}
        </Text>
      </Card>
    </Pressable>
  );
}

/**
 * ActionCards - Container for leaderboard and achievements navigation cards
 */
export function ActionCards({ onLeaderboardPress, onAchievementsPress }: {
  onLeaderboardPress: () => void;
  onAchievementsPress: () => void;
}) {
  return (
    <View className="mx-4 mt-4 flex-row gap-3">
      <ActionCard
        icon={TrendingUp}
        title="View Leaderboard"
        description="See how others are doing"
        onPress={onLeaderboardPress}
      />
      <ActionCard
        icon={Award}
        title="My Achievements"
        description="Track your progress"
        onPress={onAchievementsPress}
      />
    </View>
  );
}
