/**
 * Custom Quest Utilities
 *
 * Pure utility functions for custom quest creation.
 */

import { XP_PER_MINUTE_MULTIPLIER } from './constants';

/**
 * Calculate XP reward for a custom quest based on duration
 *
 * Formula: durationMinutes * XP_PER_MINUTE_MULTIPLIER
 *
 * @param durationMinutes - Quest duration in minutes
 * @returns XP reward amount
 *
 * @example
 * calculateQuestXP(30) // Returns 90 (30 * 3)
 * calculateQuestXP(60) // Returns 180 (60 * 3)
 * calculateQuestXP(240) // Returns 720 (240 * 3)
 */
export function calculateQuestXP(durationMinutes: number): number {
  return Math.round(durationMinutes * XP_PER_MINUTE_MULTIPLIER);
}
