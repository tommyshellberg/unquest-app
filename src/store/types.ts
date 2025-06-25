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
  inviteeIds?: string[]; // User IDs to invite for cooperative quest
}

export type QuestStatus = 'active' | 'completed' | 'failed' | 'cancelled';

export type Quest = (StoryQuestTemplate | CustomQuestTemplate) & {
  startTime: number;
  stopTime?: number; // When the quest ended, for any reason
  status: QuestStatus;
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

// Cooperative Quest Types
export interface QuestParticipant {
  userId: string;
  ready: boolean;
  readyAt?: number;
  status: 'pending' | 'ready' | 'active' | 'completed' | 'failed';
  userName?: string;
  userAvatar?: string;
}

export interface QuestInvitation {
  id: string;
  questRunId: string;
  inviter: {
    id: string;
    name: string;
    email: string;
  };
  invitees: string[];
  status: 'pending' | 'partial' | 'complete' | 'expired';
  responses: {
    userId: string;
    action: 'accepted' | 'declined';
    respondedAt: number;
  }[];
  createdAt: number;
  expiresAt: number;
}

export interface CooperativeQuestRun {
  id: string;
  status: QuestStatus;
  participants: QuestParticipant[];
  invitationId?: string;
  actualStartTime?: number;
  scheduledEndTime?: number;
  failedBy?: string;
}
