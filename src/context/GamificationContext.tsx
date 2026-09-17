import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useSound } from './SoundContext';
import { useToast } from './ToastContext';
import { 
  BadgeDefinition, 
  GamificationProfile, 
  LevelInfo, 
  RecentAwardEvent 
} from '../types/gamification';
import { 
  ALL_BADGES, 
  STREAK_BONUSES,
  calculateLevelInfo, 
  calculateFocusSessionXp, 
  calculateTaskXp, 
  XP_REWARDS 
} from '../utils/gamification';

export interface DisplayBadge extends BadgeDefinition {
  isUnlocked: boolean;
  unlockedAt?: string;
  currentProgress: number;
  progressPercent: number;
}

interface GamificationContextType {
  gamification: GamificationProfile;
  levelInfo: LevelInfo;
  allBadges: DisplayBadge[];
  unlockedBadgesCount: number;
  totalBadgesCount: number;
  recentAwards: RecentAwardEvent[];
  isBadgesModalOpen: boolean;
  setIsBadgesModalOpen: (open: boolean) => void;
  awardFocusSessionXp: (sessionId: string, durationMinutes: number) => Promise<number>;
  awardTaskCompletionXp: (taskId: string, priority?: string) => Promise<number>;
  awardGoalCompletionXp: (goalId: string) => Promise<number>;
  checkAndAwardDailyBonus: (todayStudyMinutes: number, dailyGoalMinutes: number) => Promise<void>;
  checkStreakBonuses: (streakCount: number) => Promise<void>;
  checkAllMilestones: (stats: {
    totalSessions: number;
    totalTasks: number;
    totalMinutes: number;
    streakCount: number;
    subjectCount: number;
    completedGoalsCount: number;
  }) => Promise<void>;
}

const DEFAULT_GAMIFICATION: GamificationProfile = {
  totalXp: 0,
  level: 1,
  unlockedBadges: {},
  awardedSessionIds: [],
  awardedTaskIds: [],
  awardedGoalIds: [],
  awardedStreakMilestones: [],
  dailyBonusAwardedDates: [],
  streakBonusAwardedDates: [],
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const { playCue } = useSound();
  const { showSuccess, showInfo } = useToast();

  const [gamification, setGamification] = useState<GamificationProfile>(() => {
    return userProfile?.gamification || DEFAULT_GAMIFICATION;
  });

  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [recentAwards, setRecentAwards] = useState<RecentAwardEvent[]>([]);

  // Current stats cache for badge progress calculation
  const [cachedStats, setCachedStats] = useState<{
    totalSessions: number;
    totalTasks: number;
    totalMinutes: number;
    streakCount: number;
    subjectCount: number;
    completedGoalsCount: number;
  }>({
    totalSessions: 0,
    totalTasks: 0,
    totalMinutes: 0,
    streakCount: userProfile?.streakCount || 0,
    subjectCount: 0,
    completedGoalsCount: 0,
  });

  // Sync with userProfile when auth updates
  useEffect(() => {
    if (userProfile?.gamification) {
      setGamification(prev => ({
        ...DEFAULT_GAMIFICATION,
        ...prev,
        ...userProfile.gamification,
      }));
    } else if (userProfile && !userProfile.gamification) {
      setGamification(DEFAULT_GAMIFICATION);
    }
    if (userProfile?.streakCount !== undefined) {
      setCachedStats(prev => ({ ...prev, streakCount: userProfile.streakCount }));
    }
  }, [userProfile]);

  const levelInfo = useMemo(() => {
    return calculateLevelInfo(gamification.totalXp);
  }, [gamification.totalXp]);

  // Persist gamification state to Firestore
  const saveGamification = useCallback(async (updated: GamificationProfile) => {
    setGamification(updated);
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        gamification: updated,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to save gamification profile to Firestore:', err);
    }
  }, [user]);

  // Helper to add XP and check level ups
  const addXp = useCallback(async (amount: number, reason: string): Promise<number> => {
    if (amount <= 0) return 0;

    const oldXp = gamification.totalXp || 0;
    const newXp = oldXp + amount;
    const oldLevel = calculateLevelInfo(oldXp).level;
    const newLevelInfo = calculateLevelInfo(newXp);

    const updatedProfile: GamificationProfile = {
      ...gamification,
      totalXp: newXp,
      level: newLevelInfo.level,
    };

    // Check for Level Up
    if (newLevelInfo.level > oldLevel) {
      playCue('session_complete');
      showSuccess(
        `Congratulations! You unlocked the rank "${newLevelInfo.title}"! 🌟`,
        `Level Up! Reached Level ${newLevelInfo.level}`
      );

      setRecentAwards(prev => [
        {
          id: `lvl_${Date.now()}`,
          type: 'level_up',
          title: `Level ${newLevelInfo.level}: ${newLevelInfo.title}`,
          level: newLevelInfo.level,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 9)
      ]);
    }

    await saveGamification(updatedProfile);
    return amount;
  }, [gamification, playCue, showSuccess, saveGamification]);

  // Award Focus Session XP: Exactly 1 XP for every 1 minute of completed focus time
  // Deduplicated via session ID to prevent duplicate awards
  const awardFocusSessionXp = useCallback(async (sessionId: string, durationMinutes: number): Promise<number> => {
    if (!sessionId || durationMinutes < 1) {
      return 0;
    }

    const awardedSessions = gamification.awardedSessionIds || [];
    if (awardedSessions.includes(sessionId)) {
      // Already rewarded, ignore duplicate call
      return 0;
    }

    const xpEarned = calculateFocusSessionXp(durationMinutes);
    if (xpEarned <= 0) return 0;

    const oldXp = gamification.totalXp || 0;
    const newXp = oldXp + xpEarned;
    const oldLevel = calculateLevelInfo(oldXp).level;
    const newLevelInfo = calculateLevelInfo(newXp);

    const updatedProfile: GamificationProfile = {
      ...gamification,
      awardedSessionIds: [...awardedSessions, sessionId],
      totalXp: newXp,
      level: newLevelInfo.level,
    };

    await saveGamification(updatedProfile);

    // If level up occurred
    if (newLevelInfo.level > oldLevel) {
      playCue('session_complete');
      showSuccess(
        `Congratulations! You advanced to Level ${newLevelInfo.level} (${newLevelInfo.title})! 🌟`,
        `Level Up! +${xpEarned} XP Earned`
      );
    } else {
      showInfo(
        `Logged ${durationMinutes} minutes of focused study.`,
        `+${xpEarned} XP Earned! (1 XP / min)`
      );
    }

    return xpEarned;
  }, [gamification, playCue, saveGamification, showInfo, showSuccess]);

  // Award Task Completion XP (with deduplication)
  const awardTaskCompletionXp = useCallback(async (taskId: string, priority: string = 'medium'): Promise<number> => {
    if (!taskId) return 0;
    const awarded = gamification.awardedTaskIds || [];
    if (awarded.includes(taskId)) {
      // Already rewarded
      return 0;
    }

    const xpEarned = calculateTaskXp(priority);
    const oldXp = gamification.totalXp || 0;
    const newXp = oldXp + xpEarned;
    const newLevelInfo = calculateLevelInfo(newXp);

    const updatedProfile: GamificationProfile = {
      ...gamification,
      awardedTaskIds: [...awarded, taskId],
      totalXp: newXp,
      level: newLevelInfo.level,
    };

    await saveGamification(updatedProfile);
    showInfo(`Task completed!`, `+${xpEarned} XP Earned!`);

    return xpEarned;
  }, [gamification, saveGamification, showInfo]);

  // Award Goal Completion XP (with deduplication)
  const awardGoalCompletionXp = useCallback(async (goalId: string): Promise<number> => {
    if (!goalId) return 0;
    const awarded = gamification.awardedGoalIds || [];
    if (awarded.includes(goalId)) {
      return 0;
    }

    const xpEarned = XP_REWARDS.GOAL_COMPLETED;
    const oldXp = gamification.totalXp || 0;
    const newXp = oldXp + xpEarned;
    const newLevelInfo = calculateLevelInfo(newXp);

    const updatedProfile: GamificationProfile = {
      ...gamification,
      awardedGoalIds: [...awarded, goalId],
      totalXp: newXp,
      level: newLevelInfo.level,
    };

    await saveGamification(updatedProfile);

    playCue('session_complete');
    showSuccess(
      `You reached your study target goal! 🎉`,
      `+${xpEarned} XP • Goal Milestone Complete!`
    );

    return xpEarned;
  }, [gamification, saveGamification, playCue, showSuccess]);

  // Daily target bonus (awarded once per day)
  const checkAndAwardDailyBonus = useCallback(async (todayStudyMinutes: number, dailyGoalMinutes: number) => {
    if (dailyGoalMinutes <= 0 || todayStudyMinutes < dailyGoalMinutes) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const claimedDates = gamification.dailyBonusAwardedDates || [];
    if (claimedDates.includes(todayStr)) return; // Already claimed today

    const bonusXp = XP_REWARDS.DAILY_TARGET_REACHED;
    const oldXp = gamification.totalXp || 0;
    const newXp = oldXp + bonusXp;
    const newLevelInfo = calculateLevelInfo(newXp);

    const updatedProfile: GamificationProfile = {
      ...gamification,
      dailyBonusAwardedDates: [...claimedDates, todayStr],
      totalXp: newXp,
      level: newLevelInfo.level,
    };

    await saveGamification(updatedProfile);

    playCue('session_complete');
    showSuccess(
      `You hit your ${dailyGoalMinutes} minute study target today! Outstanding work! 🔥`,
      `Daily Goal Achieved! +${bonusXp} XP Bonus`
    );
  }, [gamification, saveGamification, playCue, showSuccess]);

  // STREAK BONUSES
  // 1 day: +10 XP
  // 3 days: +25 XP
  // 7 days: +50 XP
  // 14 days: +100 XP
  // 30 days: +250 XP
  // 60 days: +500 XP
  // 100 days: +1,000 XP
  // Award each milestone bonus only once.
  const checkStreakBonuses = useCallback(async (streakCount: number) => {
    if (streakCount <= 0) return;

    const awardedMilestones = gamification.awardedStreakMilestones || [];
    let bonusXpTotal = 0;
    const newlyClaimed: number[] = [];
    const bonusMessages: { title: string; xp: number; days: number }[] = [];

    STREAK_BONUSES.forEach((bonus) => {
      if (streakCount >= bonus.streakDays && !awardedMilestones.includes(bonus.streakDays)) {
        bonusXpTotal += bonus.xpReward;
        newlyClaimed.push(bonus.streakDays);
        bonusMessages.push({ title: bonus.title, xp: bonus.xpReward, days: bonus.streakDays });
      }
    });

    if (bonusXpTotal > 0 && newlyClaimed.length > 0) {
      const oldXp = gamification.totalXp || 0;
      const newXp = oldXp + bonusXpTotal;
      const newLevelInfo = calculateLevelInfo(newXp);

      const updatedProfile: GamificationProfile = {
        ...gamification,
        awardedStreakMilestones: [...awardedMilestones, ...newlyClaimed],
        totalXp: newXp,
        level: newLevelInfo.level,
      };

      await saveGamification(updatedProfile);

      playCue('session_complete');
      bonusMessages.forEach((msg) => {
        showSuccess(
          `Awesome dedication! Reached ${msg.days}-day streak milestone: ${msg.title}`,
          `🔥 Streak Bonus: +${msg.xp} XP!`
        );

        setRecentAwards(prev => [
          {
            id: `streak_${msg.days}_${Date.now()}`,
            type: 'xp',
            title: `${msg.days}-Day Streak Bonus`,
            amount: msg.xp,
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ]);
      });
    }
  }, [gamification, saveGamification, playCue, showSuccess]);

  // Check all badges/milestones & streak bonuses
  const checkAllMilestones = useCallback(async (stats: {
    totalSessions: number;
    totalTasks: number;
    totalMinutes: number;
    streakCount: number;
    subjectCount: number;
    completedGoalsCount: number;
  }) => {
    setCachedStats(stats);

    // Also check streak bonuses first
    await checkStreakBonuses(stats.streakCount);

    const currentUnlocked = { ...(gamification.unlockedBadges || {}) };
    let extraXp = 0;
    const newlyUnlockedBadges: BadgeDefinition[] = [];

    ALL_BADGES.forEach((badge) => {
      if (currentUnlocked[badge.id]) return; // already unlocked

      let isConditionMet = false;

      switch (badge.id) {
        // Sessions
        case 'first_session':
          isConditionMet = stats.totalSessions >= 1;
          break;
        case 'sessions_5':
          isConditionMet = stats.totalSessions >= 5;
          break;
        case 'sessions_25':
          isConditionMet = stats.totalSessions >= 25;
          break;
        case 'sessions_50':
          isConditionMet = stats.totalSessions >= 50;
          break;
        case 'sessions_100':
          isConditionMet = stats.totalSessions >= 100;
          break;

        // Minutes
        case 'minutes_60':
          isConditionMet = stats.totalMinutes >= 60;
          break;
        case 'minutes_100':
          isConditionMet = stats.totalMinutes >= 100;
          break;
        case 'minutes_300':
          isConditionMet = stats.totalMinutes >= 300;
          break;
        case 'minutes_500':
          isConditionMet = stats.totalMinutes >= 500;
          break;
        case 'minutes_1000':
          isConditionMet = stats.totalMinutes >= 1000;
          break;
        case 'minutes_2500':
          isConditionMet = stats.totalMinutes >= 2500;
          break;
        case 'minutes_5000':
          isConditionMet = stats.totalMinutes >= 5000;
          break;

        // Tasks
        case 'first_task':
          isConditionMet = stats.totalTasks >= 1;
          break;
        case 'tasks_10':
          isConditionMet = stats.totalTasks >= 10;
          break;
        case 'tasks_25':
          isConditionMet = stats.totalTasks >= 25;
          break;
        case 'tasks_50':
          isConditionMet = stats.totalTasks >= 50;
          break;
        case 'tasks_100':
          isConditionMet = stats.totalTasks >= 100;
          break;

        // Streak
        case 'streak_1':
          isConditionMet = stats.streakCount >= 1;
          break;
        case 'streak_3':
          isConditionMet = stats.streakCount >= 3;
          break;
        case 'streak_7':
          isConditionMet = stats.streakCount >= 7;
          break;
        case 'streak_14':
          isConditionMet = stats.streakCount >= 14;
          break;
        case 'streak_30':
          isConditionMet = stats.streakCount >= 30;
          break;
        case 'streak_60':
          isConditionMet = stats.streakCount >= 60;
          break;
        case 'streak_100':
          isConditionMet = stats.streakCount >= 100;
          break;

        // Levels
        case 'level_2':
          isConditionMet = levelInfo.level >= 2;
          break;
        case 'level_5':
          isConditionMet = levelInfo.level >= 5;
          break;
        case 'level_10':
          isConditionMet = levelInfo.level >= 10;
          break;
        case 'level_20':
          isConditionMet = levelInfo.level >= 20;
          break;

        // Goals & Subjects
        case 'first_goal':
          isConditionMet = stats.completedGoalsCount >= 1;
          break;
        case 'goals_5':
          isConditionMet = stats.completedGoalsCount >= 5;
          break;
        case 'subjects_3':
          isConditionMet = stats.subjectCount >= 3;
          break;
        case 'subjects_6':
          isConditionMet = stats.subjectCount >= 6;
          break;
      }

      if (isConditionMet) {
        currentUnlocked[badge.id] = new Date().toISOString();
        extraXp += badge.xpReward;
        newlyUnlockedBadges.push(badge);
      }
    });

    if (newlyUnlockedBadges.length > 0) {
      const newTotalXp = (gamification.totalXp || 0) + extraXp;
      const updatedProfile: GamificationProfile = {
        ...gamification,
        unlockedBadges: currentUnlocked,
        totalXp: newTotalXp,
        level: calculateLevelInfo(newTotalXp).level,
        lastMilestoneCheck: new Date().toISOString(),
      };

      await saveGamification(updatedProfile);

      // Play sound and trigger toasts
      playCue('session_complete');
      newlyUnlockedBadges.forEach((b) => {
        showSuccess(
          `${b.description} (+${b.xpReward} XP)`,
          `🏆 Badge Unlocked: ${b.title}`
        );

        setRecentAwards(prev => [
          {
            id: `badge_${b.id}_${Date.now()}`,
            type: 'badge',
            title: b.title,
            badge: b,
            amount: b.xpReward,
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ]);
      });
    }
  }, [gamification, levelInfo.level, checkStreakBonuses, saveGamification, playCue, showSuccess]);

  // Compute full display badges with accurate real-time progress
  const allBadges: DisplayBadge[] = useMemo(() => {
    const unlockedMap = gamification.unlockedBadges || {};

    return ALL_BADGES.map((b) => {
      const isUnlocked = Boolean(unlockedMap[b.id]);
      const unlockedAt = unlockedMap[b.id];

      let liveProgress = 0;
      if (isUnlocked) {
        liveProgress = b.targetValue;
      } else {
        switch (b.id) {
          case 'first_session':
          case 'sessions_5':
          case 'sessions_25':
          case 'sessions_50':
          case 'sessions_100':
            liveProgress = Math.min(b.targetValue, cachedStats.totalSessions);
            break;

          case 'minutes_60':
          case 'minutes_100':
          case 'minutes_300':
          case 'minutes_500':
          case 'minutes_1000':
          case 'minutes_2500':
          case 'minutes_5000':
            liveProgress = Math.min(b.targetValue, cachedStats.totalMinutes);
            break;

          case 'first_task':
          case 'tasks_10':
          case 'tasks_25':
          case 'tasks_50':
          case 'tasks_100':
            liveProgress = Math.min(b.targetValue, cachedStats.totalTasks);
            break;

          case 'streak_1':
          case 'streak_3':
          case 'streak_7':
          case 'streak_14':
          case 'streak_30':
          case 'streak_60':
          case 'streak_100':
            liveProgress = Math.min(b.targetValue, cachedStats.streakCount);
            break;

          case 'level_2':
          case 'level_5':
          case 'level_10':
          case 'level_20':
            liveProgress = Math.min(b.targetValue, levelInfo.level);
            break;

          case 'first_goal':
          case 'goals_5':
            liveProgress = Math.min(b.targetValue, cachedStats.completedGoalsCount);
            break;

          case 'subjects_3':
          case 'subjects_6':
            liveProgress = Math.min(b.targetValue, cachedStats.subjectCount);
            break;

          default:
            liveProgress = 0;
        }
      }

      const progressPercent = Math.min(
        100,
        Math.max(0, Math.round((liveProgress / Math.max(1, b.targetValue)) * 100))
      );

      return {
        ...b,
        isUnlocked,
        unlockedAt,
        currentProgress: liveProgress,
        progressPercent,
      };
    });
  }, [gamification.unlockedBadges, cachedStats, levelInfo.level]);

  const unlockedBadgesCount = useMemo(() => {
    return Object.keys(gamification.unlockedBadges || {}).length;
  }, [gamification.unlockedBadges]);

  const totalBadgesCount = ALL_BADGES.length;

  return (
    <GamificationContext.Provider
      value={{
        gamification,
        levelInfo,
        allBadges,
        unlockedBadgesCount,
        totalBadgesCount,
        recentAwards,
        isBadgesModalOpen,
        setIsBadgesModalOpen,
        awardFocusSessionXp,
        awardTaskCompletionXp,
        awardGoalCompletionXp,
        checkAndAwardDailyBonus,
        checkStreakBonuses,
        checkAllMilestones,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
