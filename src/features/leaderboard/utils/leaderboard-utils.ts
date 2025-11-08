/**
 * Leaderboard Utilities
 *
 * Pure functions for metric label formatting.
 */

import type { LeaderboardType } from '@/features/leaderboard/constants/leaderboard-constants';
import { STRINGS } from '@/features/leaderboard/constants/leaderboard-constants';

/**
 * Get the metric label for a leaderboard entry (short form)
 *
 * @param type - The leaderboard type
 * @param value - The metric value
 * @returns Formatted metric label (e.g., "150 quests", "45 days")
 *
 * @example
 * getMetricLabel('quests', 150) // "150 quests"
 * getMetricLabel('minutes', 3200) // "3200 mins"
 * getMetricLabel('streak', 45) // "45 days"
 */
export function getMetricLabel(type: LeaderboardType, value: number): string {
  switch (type) {
    case 'quests':
      return STRINGS.metricQuests(value);
    case 'minutes':
      return STRINGS.metricMinutes(value);
    case 'streak':
      return STRINGS.metricStreak(value);
  }
}

/**
 * Get the full metric label for display in top user card
 *
 * @param type - The leaderboard type
 * @returns Full metric label (e.g., "Quests Completed", "Day Streak")
 *
 * @example
 * getMetricLabelFull('quests') // "Quests Completed"
 * getMetricLabelFull('minutes') // "Minutes Off Phone"
 * getMetricLabelFull('streak') // "Day Streak"
 */
export function getMetricLabelFull(type: LeaderboardType): string {
  switch (type) {
    case 'quests':
      return STRINGS.metricQuestsCompleted;
    case 'minutes':
      return STRINGS.metricMinutesOffPhone;
    case 'streak':
      return STRINGS.metricDayStreak;
  }
}
