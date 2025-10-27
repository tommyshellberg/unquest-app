/**
 * EmptyStates Component
 *
 * Displays appropriate empty state based on scope, type, and friend status.
 * Handles: no friends, sign in required, no data, invite friends prompts.
 */

import { Trophy, Users } from 'lucide-react-native';
import React from 'react';

import { Button, Card, Text, View } from '@/components/ui';

import { A11Y, COLORS, STRINGS, UI_CONFIG } from '../constants';
import type { EmptyStateProps } from '../types';

export function EmptyStates({
  scope,
  type,
  hasFriends,
  hasLeaderboardData,
  onInviteFriends,
}: EmptyStateProps) {
  // Friends scope - user needs to sign in
  if (scope === 'friends' && !hasLeaderboardData) {
    return (
      <Card className="mt-8 p-6">
        <View className="items-center">
          <Users
            size={UI_CONFIG.iconSizeEmpty}
            color={COLORS.iconEmpty}
            className="mb-3"
          />
          <Text
            className="mb-2 text-lg font-bold"
            style={{ color: COLORS.textPrimary }}
          >
            {STRINGS.emptySignInFriends}
          </Text>
          <Text className="text-center" style={{ color: COLORS.textSecondary }}>
            {STRINGS.emptySignInMessage}
          </Text>
        </View>
      </Card>
    );
  }

  // No data yet (either scope)
  if (!hasLeaderboardData) {
    return (
      <Card className="mt-8 p-6">
        <View className="items-center">
          <Trophy
            size={UI_CONFIG.iconSizeEmpty}
            color={COLORS.iconEmpty}
            className="mb-3"
          />
          <Text
            className="mb-2 text-lg font-bold"
            style={{ color: COLORS.textPrimary }}
          >
            {STRINGS.emptyNoData}
          </Text>
          <Text className="text-center" style={{ color: COLORS.textSecondary }}>
            {scope === 'friends'
              ? STRINGS.emptyNoFriendsStarted
              : STRINGS.emptyCompleteQuests}
          </Text>
        </View>
      </Card>
    );
  }

  // Friends scope - no friends yet, invite them
  if (scope === 'friends' && !hasFriends) {
    return (
      <Card className="mb-4 p-6">
        <View className="items-center">
          <Users
            size={UI_CONFIG.iconSizeEmpty}
            color={COLORS.iconEmpty}
            className="mb-3"
          />
          <Text
            className="mb-2 text-lg font-bold"
            style={{ color: COLORS.textPrimary }}
          >
            {STRINGS.emptyInviteFriendsTitle}
          </Text>
          <Text className="text-center" style={{ color: COLORS.textSecondary }}>
            {STRINGS.emptyInviteFriendsMessage}
          </Text>
        </View>
      </Card>
    );
  }

  // Friends scope - has friends but no data for this metric
  if (scope === 'friends' && hasFriends && !hasLeaderboardData) {
    let message = '';
    switch (type) {
      case 'quests':
        message = STRINGS.emptyFriendsQuests;
        break;
      case 'minutes':
        message = STRINGS.emptyFriendsMinutes;
        break;
      case 'streak':
        message = STRINGS.emptyFriendsStreak;
        break;
    }

    return (
      <Card className="mb-4 p-6">
        <View className="items-center">
          <Text className="text-center" style={{ color: COLORS.textSecondary }}>
            {message}
          </Text>
        </View>
      </Card>
    );
  }

  // Default: show invite friends button
  return (
    <View className="mb-6 mt-4">
      <Button
        label={
          hasFriends
            ? STRINGS.inviteButtonHasFriends
            : STRINGS.inviteButtonNoFriends
        }
        variant="default"
        onPress={onInviteFriends}
        accessibilityLabel={A11Y.labelInviteFriends}
        accessibilityHint={A11Y.hintInvite}
      />
    </View>
  );
}
