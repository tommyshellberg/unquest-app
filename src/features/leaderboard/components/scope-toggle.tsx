/**
 * ScopeToggle Component
 *
 * Toggle between Friends and Global leaderboards.
 * Fully accessible with proper roles, labels, and states.
 */

import React from 'react';

import { Pressable, Text, View } from '@/components/ui';

import { A11Y, COLORS, STRINGS } from '@/features/leaderboard/constants/leaderboard-constants';
import type { ScopeToggleProps } from '@/features/leaderboard/types/leaderboard-types';

export function ScopeToggle({ scope, onScopeChange }: ScopeToggleProps) {
  return (
    <View className="mb-4 flex-row rounded-full bg-gray-100 p-1">
      {/* Friends Toggle */}
      <Pressable
        onPress={() => onScopeChange('friends')}
        className="flex-1 rounded-full py-2"
        style={
          scope === 'friends' ? { backgroundColor: COLORS.selectedToggle } : {}
        }
        accessible
        accessibilityRole={A11Y.roleButton}
        accessibilityLabel={A11Y.labelScopeToggleFriends}
        accessibilityHint={A11Y.hintScopeToggle}
        accessibilityState={{ selected: scope === 'friends' }}
      >
        <Text
          className="text-center font-semibold"
          style={{
            color:
              scope === 'friends' ? COLORS.textPrimary : COLORS.textSecondary,
          }}
        >
          {STRINGS.scopeFriends}
        </Text>
      </Pressable>

      {/* Global Toggle */}
      <Pressable
        onPress={() => onScopeChange('global')}
        className="flex-1 rounded-full py-2"
        style={
          scope === 'global' ? { backgroundColor: COLORS.selectedToggle } : {}
        }
        accessible
        accessibilityRole={A11Y.roleButton}
        accessibilityLabel={A11Y.labelScopeToggleGlobal}
        accessibilityHint={A11Y.hintScopeToggle}
        accessibilityState={{ selected: scope === 'global' }}
      >
        <Text
          className="text-center font-semibold"
          style={{
            color:
              scope === 'global' ? COLORS.textPrimary : COLORS.textSecondary,
          }}
        >
          {STRINGS.scopeGlobal}
        </Text>
      </Pressable>
    </View>
  );
}
