export type LeaderboardEntry = {
  _id: string;
  userId: string;
  characterName: string;
  characterType: string;
  value: number;
};

export type LeaderboardData = {
  questsCompleted: LeaderboardEntry[];
  questMinutes: LeaderboardEntry[];
  longestStreak: LeaderboardEntry[];
};

export type LeaderboardResponse = {
  global: LeaderboardData;
  friends: LeaderboardData | null;
};

export type LeaderboardType = 'quests' | 'minutes' | 'streak';
