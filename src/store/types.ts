// Shared types
export type XP = number;
export type Minutes = number;
export type Timestamp = number;

export interface Reward {
  xp: XP;
  // Future: items, achievements, etc.
}

export interface BaseQuestTemplate {
  id: string;
  title: string;
  durationMinutes: number;
  reward: Reward;
}

// Define the options structure separately for reuse
export interface QuestOption {
  id: string;
  text: string;
  nextQuestId: string | null;
}

export interface StoryQuestTemplate extends BaseQuestTemplate {
  poiSlug: string;
  mode: 'story';
  story: string;
  audioFile: string;
  recap: string;
  options: QuestOption[];
}

export interface CustomQuestTemplate extends BaseQuestTemplate {
  mode: 'custom';
  category: string;
}

export type Quest = (StoryQuestTemplate | CustomQuestTemplate) & {
  startTime: number;
  completedAt?: number;
};

export interface Character {
  type: CharacterType;
  name: string;
  level: number;
  currentXP: XP;
  xpToNextLevel: XP;
}

export type CharacterType =
  | 'alchemist'
  | 'bard'
  | 'druid'
  | 'knight'
  | 'scholar'
  | 'wizard';

export interface Account {
  id: string;
  averageScreenTimeMinutes: Minutes;
  screenTimeGoalMinutes: Minutes;
  created: Timestamp;
  lastActive: Timestamp;
}

export type POI = {
  slug: string;
  name: string;
  x: number;
  y: number;
  isRevealed: boolean;
  mapId: string;
};
