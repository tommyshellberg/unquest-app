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
  inviteeIds?: string[]; // For cooperative quests
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
  status:
    | 'pending'
    | 'accepted'
    | 'declined'
    | 'active'
    | 'completed'
    | 'failed';
  userName?: string;
  characterType?: CharacterType;
  phoneLocked?: boolean;
  characterName?: string;
}

export interface CooperativeQuestRun {
  id: string;
  questId: string;
  hostId: string;
  participants: QuestParticipant[];
  status: 'pending' | 'active' | 'completed' | 'failed';
  invitationId?: string;
  actualStartTime?: number;
  scheduledEndTime?: number;
  createdAt: number;
  updatedAt: number;
}

export interface QuestInvitation {
  id: string;
  questRunId: string;
  questTitle: string;
  questDuration: number;
  hostId: string;
  hostName: string;
  inviteeId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
}
