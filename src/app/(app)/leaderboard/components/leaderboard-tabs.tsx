/**
 * LeaderboardTabs Component
 *
 * Tab navigation for switching between Quests, Minutes, and Streaks leaderboards.
 * Fully accessible with proper roles, labels, and states.
 */

import { CheckCircle, Clock, TrendingUp } from 'lucide-react-native';
import React from 'react';

import { Pressable, Text, View } from '@/components/ui';

import { A11Y, COLORS, STRINGS, UI_CONFIG } from '../constants';
import type { LeaderboardTab, LeaderboardTabsProps } from '../types';

export function LeaderboardTabs({
  selectedType,
  onTypeChange,
}: LeaderboardTabsProps) {
  const tabs: LeaderboardTab[] = [
    {
      type: 'quests',
      label: STRINGS.tabQuests,
      icon: (
        <CheckCircle
          size={UI_CONFIG.iconSizeMedium}
          color={COLORS.iconDefault}
        />
      ),
    },
    {
      type: 'minutes',
      label: STRINGS.tabMinutes,
      icon: (
        <Clock size={UI_CONFIG.iconSizeMedium} color={COLORS.iconDefault} />
      ),
    },
    {
      type: 'streak',
      label: STRINGS.tabStreaks,
      icon: (
        <TrendingUp
          size={UI_CONFIG.iconSizeMedium}
          color={COLORS.iconDefault}
        />
      ),
    },
  ];

  return (
    <View className="mb-4 flex-row justify-around">
      {tabs.map((tab) => {
        const isSelected = selectedType === tab.type;

        // Get accessibility label based on tab type
        const accessibilityLabel =
          tab.type === 'quests'
            ? A11Y.labelTabQuests
            : tab.type === 'minutes'
              ? A11Y.labelTabMinutes
              : A11Y.labelTabStreaks;

        return (
          <Pressable
            key={tab.type}
            onPress={() => onTypeChange(tab.type)}
            className="flex-1 items-center rounded-lg p-3"
            style={isSelected ? { backgroundColor: COLORS.selectedTab } : {}}
            accessible
            accessibilityRole={A11Y.roleTab}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={A11Y.hintTabSwitch}
            accessibilityState={{ selected: isSelected }}
          >
            {/* Clone icon with correct color */}
            {React.cloneElement(tab.icon as React.ReactElement, {
              color: isSelected ? COLORS.iconSelected : COLORS.iconDefault,
            })}

            {/* Tab Label */}
            <Text
              className={`mt-1 text-sm ${isSelected ? 'font-bold' : ''}`}
              style={{
                color: isSelected
                  ? COLORS.secondaryAccent
                  : COLORS.textSecondary,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
