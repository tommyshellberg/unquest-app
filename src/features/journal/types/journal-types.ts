// Journal screen types

export type FilterType = 'all' | 'story' | 'custom' | 'cooperative';
export type StatusFilter = 'all' | 'completed' | 'failed';

export interface TransformedQuest {
  id: string;
  questRunId: string;
  customId?: string;
  title: string;
  mode: 'story' | 'custom' | 'cooperative';
  durationMinutes: number;
  reward: {
    xp: number;
  };
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  startTime?: number;
  stopTime?: number;
  failureReason?: string;
  story?: string;
  category?: string;
  recap?: string;
}
