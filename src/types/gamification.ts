export type BadgeCategory = 'focus' | 'tasks' | 'streak' | 'levels' | 'goals';

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  iconName: string;
  xpReward: number;
  targetValue: number;
  unit: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UnlockedBadge {
  badgeId: string;
  unlockedAt: string;
}

export interface StreakMilestoneReward {
  streakDays: number;
  xpReward: number;
  title: string;
}

export interface GamificationProfile {
  totalXp: number;
  level: number;
  unlockedBadges: Record<string, string>; // badgeId -> unlockedAt ISO string
  awardedSessionIds?: string[]; // IDs of focus sessions that already granted XP
  awardedTaskIds?: string[]; // IDs of tasks that already granted XP
  awardedGoalIds?: string[]; // IDs of goals that already granted XP
  awardedStreakMilestones?: number[]; // Streak day counts that already granted milestone bonuses (1, 3, 7, 14, 30, 60, 100)
  dailyBonusAwardedDates?: string[]; // YYYY-MM-DD dates where daily target bonus was granted
  streakBonusAwardedDates?: string[]; // YYYY-MM-DD dates where streak bonus was granted
  lastMilestoneCheck?: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  nextLevel: number;
  nextTitle: string;
  currentLevelMinXp: number;
  nextLevelXp: number;
  xpInCurrentLevel: number;
  xpRequiredForCurrentLevel: number;
  progressPercent: number;
  totalXp: number;
}

export interface RecentAwardEvent {
  id: string;
  type: 'xp' | 'level_up' | 'badge';
  title: string;
  amount?: number;
  badge?: BadgeDefinition;
  level?: number;
  timestamp: string;
}
