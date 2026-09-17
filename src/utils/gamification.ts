import { BadgeDefinition, LevelInfo, StreakMilestoneReward } from '../types/gamification';

/**
 * Streak milestone bonuses as specified:
 * - 1 day: +10 XP
 * - 3 days: +25 XP
 * - 7 days: +50 XP
 * - 14 days: +100 XP
 * - 30 days: +250 XP
 * - 60 days: +500 XP
 * - 100 days: +1,000 XP
 */
export const STREAK_BONUSES: StreakMilestoneReward[] = [
  { streakDays: 1, xpReward: 10, title: '1-Day Study Spark' },
  { streakDays: 3, xpReward: 25, title: '3-Day Consistency Bonus' },
  { streakDays: 7, xpReward: 50, title: '7-Day Momentum Bonus' },
  { streakDays: 14, xpReward: 100, title: '14-Day Focus Fortnight' },
  { streakDays: 30, xpReward: 250, title: '30-Day Habit of Excellence' },
  { streakDays: 60, xpReward: 500, title: '60-Day Unstoppable Power' },
  { streakDays: 100, xpReward: 1000, title: '100-Day Centurion Mastery' },
];

/**
 * Comprehensive milestone badges across Focus, Tasks, Streaks, Levels, Goals, and Subjects.
 */
export const ALL_BADGES: BadgeDefinition[] = [
  // Focus Sessions Count
  {
    id: 'first_session',
    title: 'First Focus',
    description: 'Complete your very first Focus study session.',
    category: 'focus',
    iconName: 'Play',
    xpReward: 50,
    targetValue: 1,
    unit: 'session',
    rarity: 'common',
  },
  {
    id: 'sessions_5',
    title: 'Focus Practitioner',
    description: 'Complete 5 structured focus sessions.',
    category: 'focus',
    iconName: 'Clock',
    xpReward: 100,
    targetValue: 5,
    unit: 'sessions',
    rarity: 'common',
  },
  {
    id: 'sessions_25',
    title: 'Deep Work Specialist',
    description: 'Complete 25 focus sessions with high concentration.',
    category: 'focus',
    iconName: 'Flame',
    xpReward: 250,
    targetValue: 25,
    unit: 'sessions',
    rarity: 'rare',
  },
  {
    id: 'sessions_50',
    title: 'Flow Champion',
    description: 'Complete 50 deep focus study sessions.',
    category: 'focus',
    iconName: 'Shield',
    xpReward: 500,
    targetValue: 50,
    unit: 'sessions',
    rarity: 'epic',
  },
  {
    id: 'sessions_100',
    title: 'Centurion of Focus',
    description: 'Complete 100 structured focus sessions.',
    category: 'focus',
    iconName: 'Crown',
    xpReward: 1000,
    targetValue: 100,
    unit: 'sessions',
    rarity: 'legendary',
  },

  // Focus Minutes
  {
    id: 'minutes_60',
    title: 'Hour of Power',
    description: 'Accumulate 60 total minutes of logged study time.',
    category: 'focus',
    iconName: 'Hourglass',
    xpReward: 50,
    targetValue: 60,
    unit: 'minutes',
    rarity: 'common',
  },
  {
    id: 'minutes_100',
    title: 'Century Club',
    description: 'Accumulate 100 total minutes of logged study time.',
    category: 'focus',
    iconName: 'Sparkles',
    xpReward: 100,
    targetValue: 100,
    unit: 'minutes',
    rarity: 'common',
  },
  {
    id: 'minutes_300',
    title: '5-Hour Milestone',
    description: 'Accumulate 300 total minutes (5 hours) of deep study time.',
    category: 'focus',
    iconName: 'Timer',
    xpReward: 200,
    targetValue: 300,
    unit: 'minutes',
    rarity: 'rare',
  },
  {
    id: 'minutes_500',
    title: 'Study Marathoner',
    description: 'Accumulate 500 total minutes of deep study time.',
    category: 'focus',
    iconName: 'Trophy',
    xpReward: 300,
    targetValue: 500,
    unit: 'minutes',
    rarity: 'rare',
  },
  {
    id: 'minutes_1000',
    title: 'Master of Time',
    description: 'Log 1,000 minutes of productive study sessions.',
    category: 'focus',
    iconName: 'Medal',
    xpReward: 600,
    targetValue: 1000,
    unit: 'minutes',
    rarity: 'epic',
  },
  {
    id: 'minutes_2500',
    title: 'Academic Endurance',
    description: 'Log 2,500 total minutes of dedicated study time.',
    category: 'focus',
    iconName: 'Zap',
    xpReward: 1200,
    targetValue: 2500,
    unit: 'minutes',
    rarity: 'epic',
  },
  {
    id: 'minutes_5000',
    title: 'Grand Diligence',
    description: 'Log 5,000 total minutes of scholarly study.',
    category: 'focus',
    iconName: 'Crown',
    xpReward: 2500,
    targetValue: 5000,
    unit: 'minutes',
    rarity: 'legendary',
  },

  // Task Completion
  {
    id: 'first_task',
    title: 'Action Taker',
    description: 'Complete your first study task.',
    category: 'tasks',
    iconName: 'Check',
    xpReward: 25,
    targetValue: 1,
    unit: 'task',
    rarity: 'common',
  },
  {
    id: 'tasks_10',
    title: 'Task Crusher',
    description: 'Complete 10 study tasks across your courses.',
    category: 'tasks',
    iconName: 'CheckSquare',
    xpReward: 100,
    targetValue: 10,
    unit: 'tasks',
    rarity: 'common',
  },
  {
    id: 'tasks_25',
    title: 'Momentum Builder',
    description: 'Complete 25 study tasks with consistent execution.',
    category: 'tasks',
    iconName: 'CheckCheck',
    xpReward: 200,
    targetValue: 25,
    unit: 'tasks',
    rarity: 'rare',
  },
  {
    id: 'tasks_50',
    title: 'Execution Master',
    description: 'Complete 50 study tasks with consistent execution.',
    category: 'tasks',
    iconName: 'Award',
    xpReward: 350,
    targetValue: 50,
    unit: 'tasks',
    rarity: 'epic',
  },
  {
    id: 'tasks_100',
    title: 'Productivity Titan',
    description: 'Complete 100 study tasks across all subjects.',
    category: 'tasks',
    iconName: 'Trophy',
    xpReward: 750,
    targetValue: 100,
    unit: 'tasks',
    rarity: 'legendary',
  },

  // Streaks
  {
    id: 'streak_1',
    title: 'Day One Spark',
    description: 'Complete study on your first active day.',
    category: 'streak',
    iconName: 'Flame',
    xpReward: 25,
    targetValue: 1,
    unit: 'day',
    rarity: 'common',
  },
  {
    id: 'streak_3',
    title: 'Consistent Mind',
    description: 'Maintain a 3-day continuous study streak.',
    category: 'streak',
    iconName: 'Zap',
    xpReward: 50,
    targetValue: 3,
    unit: 'days',
    rarity: 'common',
  },
  {
    id: 'streak_7',
    title: '7-Day Momentum',
    description: 'Maintain a continuous 7-day study streak.',
    category: 'streak',
    iconName: 'ShieldCheck',
    xpReward: 200,
    targetValue: 7,
    unit: 'days',
    rarity: 'rare',
  },
  {
    id: 'streak_14',
    title: 'Fortnight of Focus',
    description: 'Maintain a continuous 14-day study streak.',
    category: 'streak',
    iconName: 'Award',
    xpReward: 350,
    targetValue: 14,
    unit: 'days',
    rarity: 'rare',
  },
  {
    id: 'streak_30',
    title: 'Habit of Excellence',
    description: 'Maintain an elite 30-day continuous study streak.',
    category: 'streak',
    iconName: 'Trophy',
    xpReward: 500,
    targetValue: 30,
    unit: 'days',
    rarity: 'epic',
  },
  {
    id: 'streak_60',
    title: 'Unstoppable Force',
    description: 'Maintain an unbroken 60-day study streak.',
    category: 'streak',
    iconName: 'Crown',
    xpReward: 1000,
    targetValue: 60,
    unit: 'days',
    rarity: 'legendary',
  },
  {
    id: 'streak_100',
    title: 'Century Streak',
    description: 'Maintain a legendary 100-day continuous study streak.',
    category: 'streak',
    iconName: 'Star',
    xpReward: 2500,
    targetValue: 100,
    unit: 'days',
    rarity: 'legendary',
  },

  // Level Milestones
  {
    id: 'level_2',
    title: 'Rising Scholar',
    description: 'Gain enough XP to advance to Level 2.',
    category: 'levels',
    iconName: 'TrendingUp',
    xpReward: 75,
    targetValue: 2,
    unit: 'level',
    rarity: 'common',
  },
  {
    id: 'level_5',
    title: 'Academic Strategist',
    description: 'Demonstrate sustained discipline to reach Level 5.',
    category: 'levels',
    iconName: 'Star',
    xpReward: 250,
    targetValue: 5,
    unit: 'level',
    rarity: 'rare',
  },
  {
    id: 'level_10',
    title: 'Master Polymath',
    description: 'Reach Level 10 through comprehensive mastery.',
    category: 'levels',
    iconName: 'Award',
    xpReward: 500,
    targetValue: 10,
    unit: 'level',
    rarity: 'epic',
  },
  {
    id: 'level_20',
    title: 'Focus Sovereign',
    description: 'Reach Level 20 through exceptional scholarly dedication.',
    category: 'levels',
    iconName: 'Crown',
    xpReward: 1000,
    targetValue: 20,
    unit: 'level',
    rarity: 'legendary',
  },

  // Goals & Subject Explorer
  {
    id: 'first_goal',
    title: 'Milestone Achiever',
    description: 'Complete your first dedicated study goal target.',
    category: 'goals',
    iconName: 'Target',
    xpReward: 100,
    targetValue: 1,
    unit: 'goal',
    rarity: 'common',
  },
  {
    id: 'goals_5',
    title: 'Goal Demolisher',
    description: 'Complete 5 comprehensive study goals.',
    category: 'goals',
    iconName: 'Trophy',
    xpReward: 300,
    targetValue: 5,
    unit: 'goals',
    rarity: 'rare',
  },
  {
    id: 'subjects_3',
    title: 'Course Explorer',
    description: 'Log study sessions across at least 3 distinct subjects.',
    category: 'focus',
    iconName: 'BookOpen',
    xpReward: 100,
    targetValue: 3,
    unit: 'subjects',
    rarity: 'common',
  },
  {
    id: 'subjects_6',
    title: 'Renaissance Mind',
    description: 'Log study sessions across at least 6 distinct subjects.',
    category: 'focus',
    iconName: 'Sparkles',
    xpReward: 250,
    targetValue: 6,
    unit: 'subjects',
    rarity: 'epic',
  }
];

/**
 * Returns the exact total XP required to reach Level N:
 * Level 1 = 0 XP
 * Level N = 100 * (1 + 2 + ... + N-1) = 50 * N * (N - 1)
 */
export function getLevelRequiredTotalXp(level: number): number {
  if (level <= 1) return 0;
  return 50 * level * (level - 1);
}

/**
 * Returns prestigious scholar title for a given level.
 */
export function getScholarTitle(level: number): string {
  if (level <= 1) return 'Novice Scholar';
  if (level === 2) return 'Apprentice Mind';
  if (level === 3) return 'Dedicated Learner';
  if (level === 4) return 'Focus Practitioner';
  if (level === 5) return 'Academic Strategist';
  if (level === 6) return 'Knowledge Seeker';
  if (level === 7) return 'Deep Thinker';
  if (level === 8) return 'Flow Virtuoso';
  if (level === 9) return 'Grand Scholar';
  if (level === 10) return 'Master Polymath';
  if (level <= 14) return 'Erudite Adept';
  if (level <= 19) return 'Distinguished Fellow';
  if (level <= 29) return 'Focus Sovereign';
  if (level <= 49) return 'Grandmaster of Insight';
  return 'Legendary Luminary';
}

/**
 * Calculates current level, next level, XP progress, and percentages
 * based on exact formula: XP to reach Level N = 100 * (1 + 2 + ... + N-1)
 */
export function calculateLevelInfo(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, Math.round(totalXp || 0));

  // Inverse quadratic root: 50 * N * (N - 1) <= safeXp => N = floor((1 + sqrt(1 + 0.08 * safeXp)) / 2)
  const currentLevel = Math.max(1, Math.floor((1 + Math.sqrt(1 + 0.08 * safeXp)) / 2));
  const currentLevelMinXp = getLevelRequiredTotalXp(currentLevel);
  const nextLevel = currentLevel + 1;
  const nextLevelXp = getLevelRequiredTotalXp(nextLevel);
  const span = Math.max(1, nextLevelXp - currentLevelMinXp); // exactly 100 * currentLevel
  const earnedInLevel = safeXp - currentLevelMinXp;
  const progressPercent = Math.min(100, Math.max(0, Math.floor((earnedInLevel / span) * 100)));

  return {
    level: currentLevel,
    title: getScholarTitle(currentLevel),
    nextLevel,
    nextTitle: getScholarTitle(nextLevel),
    currentLevelMinXp,
    nextLevelXp,
    xpInCurrentLevel: earnedInLevel,
    xpRequiredForCurrentLevel: span,
    progressPercent,
    totalXp: safeXp,
  };
}

/**
 * XP SYSTEM:
 * - Award exactly 1 XP for every 1 minute of genuinely completed Focus time.
 * - Only award XP for completed/verified study time (minutes >= 1).
 */
export function calculateFocusSessionXp(durationMinutes: number): number {
  const baseMinutes = Math.max(0, Math.floor(durationMinutes || 0));
  return baseMinutes; // Exactly 1 XP per minute
}

/**
 * XP for task completion based on priority.
 */
export function calculateTaskXp(priority: string = 'medium'): number {
  switch (priority) {
    case 'high':
      return 50;
    case 'low':
      return 20;
    case 'medium':
    default:
      return 35;
  }
}

export const XP_REWARDS = {
  DAILY_TARGET_REACHED: 50,
  GOAL_COMPLETED: 75,
};
