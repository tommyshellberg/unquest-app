/**
 * Leaderboard Types
 *
 * TypeScript type definitions for the Leaderboard screen.
 */

import type { LeaderboardType, ScopeType } from '@/features/leaderboard/constants/leaderboard-constants';

/**
 * Character types available in the game
 */
export type CharacterType =
  | 'alchemist'
  | 'druid'
  | 'scout'
  | 'wizard'
  | 'knight'
  | 'bard';

/**
 * Leaderboard entry for display in the UI
 */
export interface LeaderboardEntry {
  rank?: number;
  userId: string;
  username: string;
  characterType: CharacterType;
  metric: number;
  isCurrentUser?: boolean;
  isFriend?: boolean;
  isSeparated?: boolean; // Used to show separator (e.g., "• • •")
}

/**
 * Tab configuration for leaderboard type selection
 */
export interface LeaderboardTab {
  type: LeaderboardType;
  label: string;
  icon: React.ReactNode;
}

/**
 * Props for LeaderboardItem component
 */
export interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  type: LeaderboardType;
}

/**
 * Props for LeaderboardHeader component (top user card)
 */
export interface LeaderboardHeaderProps {
  topUser: LeaderboardEntry;
  type: LeaderboardType;
}

/**
 * Props for ScopeToggle component
 */
export interface ScopeToggleProps {
  scope: ScopeType;
  onScopeChange: (scope: ScopeType) => void;
}

/**
 * Props for LeaderboardTabs component
 */
export interface LeaderboardTabsProps {
  selectedType: LeaderboardType;
  onTypeChange: (type: LeaderboardType) => void;
}

/**
 * Props for EmptyState component
 */
export interface EmptyStateProps {
  scope: ScopeType;
  type: LeaderboardType;
  hasFriends: boolean;
  hasLeaderboardData: boolean;
  onInviteFriends: () => void;
}

/**
 * Return type for useLeaderboardData hook
 */
export interface UseLeaderboardDataReturn {
  leaderboardData: LeaderboardEntry[];
  topUser: LeaderboardEntry | undefined;
  restOfUsers: LeaderboardEntry[];
  currentUserPosition: number | null;
}
