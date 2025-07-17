export interface QuestTemplate {
  _id: string;
  customId: string;
  title: string;
  durationMinutes: number;
  reward: {
    xp: number;
  };
  mode: 'story' | 'custom';
  storylineId?: string;
  storylineOrder?: number;
  isPremium?: boolean;
  requiresPremium?: boolean;
  poiSlug?: string;
  audioFile?: string;
  story?: string;
  recap?: string;
  options?: QuestOption[];
  category?: string;
}

export interface QuestOption {
  id: string;
  text: string;
  nextQuestId: string | null;
  nextQuest?: {
    id: string;
    customId: string;
    title: string;
    durationMinutes: number;
    reward: {
      xp: number;
    };
    isPremium: boolean;
  };
}

export interface NextAvailableQuestsResponse {
  quests: QuestTemplate[];
  hasMoreQuests: boolean;
  storylineComplete: boolean;
  options?: QuestOption[];
  storylineProgress?: {
    storylineId: string;
    totalQuests: number;
    completedQuests: number;
    progressPercentage: number;
    lastCompletedQuestId: string | null;
    isComplete: boolean;
  };
}

export interface QuestRun {
  _id: string;
  id: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  expiresAt?: string;
  completedAt?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  scheduledEndTime?: string;
  quest: {
    id: string;
    title: string;
    durationMinutes: number;
    reward: {
      xp: number;
    };
    mode: 'story' | 'custom' | 'cooperative';
    poiSlug?: string;
    audioFile?: string;
    story?: string;
    recap?: string;
    options?: QuestOption[];
    category?: string;
  };
  participants: Array<{
    userId: string;
    ready: boolean;
    phoneLocked: boolean;
    status: 'active' | 'failed' | 'completed';
  }>;
  failureReason?: string;
  failedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestRunsResponse {
  results: QuestRun[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface StorylineProgress {
  storylineId: string;
  totalQuests: number;
  completedQuests: number;
  progressPercentage: number;
  lastCompletedQuestId: string | null;
  isComplete: boolean;
}