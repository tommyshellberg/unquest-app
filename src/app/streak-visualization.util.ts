import { DAY_NAMES, STREAK } from './streak-celebration.constants';

export interface StreakDay {
  name: string;
  isCompleted: boolean;
  isToday: boolean;
}

/**
 * Generates a 5-day streak visualization array based on the current streak count.
 *
 * Rules:
 * - 0 streak: Shows today and 4 empty days after
 * - 1-4 streak: Shows streak days from left, then empty days
 * - 5+ streak: Shows 5 completed days ending with today
 *
 * @param dailyQuestStreak - Current streak count
 * @returns Array of 5 StreakDay objects representing the visualization
 */
export function generateStreakVisualization(
  dailyQuestStreak: number
): StreakDay[] {
  const today = new Date().getDay();
  const streakDays: StreakDay[] = [];

  if (dailyQuestStreak === 0) {
    // No streak, show today and 4 empty days after
    for (let i = 0; i < STREAK.DAYS_TO_SHOW; i++) {
      const dayIndex = (today + i) % DAY_NAMES.length;
      streakDays.push({
        name: DAY_NAMES[dayIndex],
        isCompleted: false,
        isToday: i === 0,
      });
    }
  } else if (dailyQuestStreak >= STREAK.MIN_STREAK_FOR_FULL_VIEW) {
    // 5+ day streak, show 5 completed days ending with today
    for (let i = STREAK.DAYS_TO_SHOW - 1; i >= 0; i--) {
      const dayIndex = (today - i + DAY_NAMES.length) % DAY_NAMES.length;
      streakDays.push({
        name: DAY_NAMES[dayIndex],
        isCompleted: true,
        isToday: i === 0,
      });
    }
  } else {
    // 1-4 day streak, show streak days starting from left, then empty days
    const streakStartDay =
      (today - dailyQuestStreak + 1 + DAY_NAMES.length) % DAY_NAMES.length;

    for (let i = 0; i < STREAK.DAYS_TO_SHOW; i++) {
      const dayIndex = (streakStartDay + i) % DAY_NAMES.length;
      const isCompleted = i < dailyQuestStreak;
      const isToday = dayIndex === today;

      streakDays.push({
        name: DAY_NAMES[dayIndex],
        isCompleted,
        isToday,
      });
    }
  }

  return streakDays;
}

/**
 * Calculates if a streak is still active based on last completion timestamp.
 *
 * @param lastCompletedQuestTimestamp - Timestamp of last completed quest
 * @returns true if streak is still active (within 24 hours), false otherwise
 */
export function isStreakActive(
  lastCompletedQuestTimestamp: number | null
): boolean {
  if (!lastCompletedQuestTimestamp) {
    return false;
  }

  return Date.now() - lastCompletedQuestTimestamp < STREAK.MILLISECONDS_IN_DAY;
}
