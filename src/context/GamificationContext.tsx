import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
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
import { formatLocalDateKey } from '../utils/dateUtils';

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
  checkStreakBonuses: (streakCount: number, options?: { silent?: boolean }) => Promise<void>;
  checkAllMilestones: (stats: {
    totalSessions: number;
    totalTasks: number;
    totalMinutes: number;
    streakCount: number;
    subjectCount: number;
    completedGoalsCount: number;
  }, options?: { silent?: boolean }) => Promise<void>;
}

const DEFAULT_GAMIFICATION: GamificationProfile = {
  totalXp: 0,
  level: 1,
  unlockedBadges: {},
  notifiedBadgeIds: [],
  awardedSessionIds: [],
  awardedTaskIds: [],
  awardedGoalIds: [],
  awardedStreakMilestones: [],
  notifiedStreakMilestones: [],
  dailyBonusAwardedDates: [],
  streakBonusAwardedDates: [],
  longestStreak: 0,
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const { playCue } = useSound();
  const { showSuccess, showInfo } = useToast();

  const [gamification, setGamification] = useState<GamificationProfile>(() => {
    return userProfile?.gamification || DEFAULT_GAMIFICATION;
  });

  const gamificationRef = useRef<GamificationProfile>(gamification);
  gamificationRef.current = gamification;

  // Serialize all gamification state mutations & Firestore updates to prevent lost XP/badges
  const mutationQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const firestoreWriteQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Track initialization state & hydrated UID to prevent stale clobbering across auth/profile updates
  const isInitializedRef = useRef<boolean>(false);
  const hydratedUidRef = useRef<string | null>(null);

  // In-memory sets to guarantee notification deduplication across session
  const notifiedBadgesRef = useRef<Set<string>>(new Set());
  const notifiedStreakMilestonesRef = useRef<Set<number>>(new Set());

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
    streakCount: userProfile?.streakCount ?? 0,
    subjectCount: 0,
    completedGoalsCount: 0,
  });

  // Sync with userProfile when auth loads a user and populate notification suppression sets
  useEffect(() => {
    if (!userProfile) {
      if (!user) {
        hydratedUidRef.current = null;
        isInitializedRef.current = false;
        notifiedBadgesRef.current.clear();
        notifiedStreakMilestonesRef.current.clear();
        setGamification(DEFAULT_GAMIFICATION);
        gamificationRef.current = DEFAULT_GAMIFICATION;
      }
      return;
    }

    const isNewUserHydration = hydratedUidRef.current !== userProfile.id;

    if (userProfile.gamification) {
      const profileBadges = userProfile.gamification.unlockedBadges || {};
      const storedNotified = userProfile.gamification.notifiedBadgeIds || [];
      const storedMilestones = userProfile.gamification.awardedStreakMilestones || [];
      const storedNotifiedMilestones = userProfile.gamification.notifiedStreakMilestones || [];

      const mergedNotifiedBadges = Array.from(new Set([...storedNotified, ...Object.keys(profileBadges)]));
      const mergedNotifiedMilestones = Array.from(new Set([...storedNotifiedMilestones, ...storedMilestones]));

      // Populate suppression sets immediately so already-earned achievements NEVER pop up
      mergedNotifiedBadges.forEach(id => notifiedBadgesRef.current.add(id));
      mergedNotifiedMilestones.forEach(ms => notifiedStreakMilestonesRef.current.add(ms));

      const bestLongest = Math.max(
        userProfile.gamification.longestStreak || 0,
        userProfile.streakCount ?? 0,
        ...storedMilestones,
        isNewUserHydration ? 0 : (gamificationRef.current.longestStreak || 0),
        0
      );

      if (isNewUserHydration) {
        const merged: GamificationProfile = {
          ...DEFAULT_GAMIFICATION,
          ...userProfile.gamification,
          unlockedBadges: profileBadges,
          notifiedBadgeIds: mergedNotifiedBadges,
          awardedStreakMilestones: storedMilestones,
          notifiedStreakMilestones: mergedNotifiedMilestones,
          longestStreak: bestLongest,
        };

        setGamification(merged);
        gamificationRef.current = merged;
        hydratedUidRef.current = userProfile.id;
        isInitializedRef.current = true;
      } else if (bestLongest > (gamificationRef.current.longestStreak || 0)) {
        const updated = { ...gamificationRef.current, longestStreak: bestLongest };
        setGamification(updated);
        gamificationRef.current = updated;
      }
    } else if (isNewUserHydration) {
      const initialLongest = Math.max(0, userProfile.streakCount ?? 0);
      const initial = { ...DEFAULT_GAMIFICATION, longestStreak: initialLongest };
      setGamification(initial);
      gamificationRef.current = initial;
      hydratedUidRef.current = userProfile.id;
      isInitializedRef.current = true;
    }

    if (userProfile.streakCount !== undefined) {
      setCachedStats(prev => ({ ...prev, streakCount: userProfile.streakCount }));
    }
  }, [user, userProfile]);

  const levelInfo = useMemo(() => {
    return calculateLevelInfo(gamification.totalXp);
  }, [gamification.totalXp]);

  // Queue granular dotted-path updates to Firestore so concurrent writes never clobber sibling fields
  const enqueueFirestorePatch = useCallback((patch: Record<string, any>) => {
    if (!user || Object.keys(patch).length === 0) return;

    const uid = user.uid;
    const userRef = doc(db, 'users', uid);
    const payload = {
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    firestoreWriteQueueRef.current = firestoreWriteQueueRef.current
      .then(() => updateDoc(userRef, payload))
      .catch((err) => {
        console.error('Failed to save gamification patch to Firestore:', err);
      });
  }, [user]);

  // Serialize synchronous state computation + Firestore patch emission across all callers
  const runSerializedGamificationTask = useCallback(<T,>(task: () => T): Promise<T> => {
    const run = mutationQueueRef.current.then(() => task());
    mutationQueueRef.current = run.catch(() => {});
    return run;
  }, []);

  // Shared level-up notification helper for ALL XP award pathways
  const notifyLevelUp = useCallback((oldLevel: number, newLevelInfo: LevelInfo, options?: { silent?: boolean }) => {
    if (newLevelInfo.level <= oldLevel) return;

    if (!options?.silent) {
      playCue('session_complete');
      showSuccess(
        `Congratulations! You unlocked the rank "${newLevelInfo.title}"! 🌟`,
        `Level Up! Reached Level ${newLevelInfo.level}`
      );
    }

    setRecentAwards(prev => [
      {
        id: `lvl_${newLevelInfo.level}_${Date.now()}`,
        type: 'level_up',
        title: `Level ${newLevelInfo.level}: ${newLevelInfo.title}`,
        level: newLevelInfo.level,
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 9),
    ]);
  }, [playCue, showSuccess]);

  // Helper to add XP and check level ups
  const addXp = useCallback(async (amount: number, _reason: string): Promise<number> => {
    if (amount <= 0) return 0;

    return runSerializedGamificationTask(() => {
      const currentGamification = gamificationRef.current;
      const oldXp = currentGamification.totalXp || 0;
      const newXp = oldXp + amount;
      const oldLevel = calculateLevelInfo(oldXp).level;
      const newLevelInfo = calculateLevelInfo(newXp);

      const updatedProfile: GamificationProfile = {
        ...currentGamification,
        totalXp: newXp,
        level: newLevelInfo.level,
      };

      setGamification(updatedProfile);
      gamificationRef.current = updatedProfile;

      enqueueFirestorePatch({
        'gamification.totalXp': increment(amount),
        'gamification.level': newLevelInfo.level,
      });

      notifyLevelUp(oldLevel, newLevelInfo);
      return amount;
    });
  }, [runSerializedGamificationTask, enqueueFirestorePatch, notifyLevelUp]);

  // Award Focus Session XP: Exactly 1 XP for every 1 minute of completed focus time
  // Deduplicated via session ID to prevent duplicate awards
  const awardFocusSessionXp = useCallback(async (sessionId: string, durationMinutes: number): Promise<number> => {
    if (!sessionId || durationMinutes < 1) {
      return 0;
    }

    const xpEarned = calculateFocusSessionXp(durationMinutes);
    if (xpEarned <= 0) return 0;

    return runSerializedGamificationTask(() => {
      const currentGamification = gamificationRef.current;
      const awardedSessions = currentGamification.awardedSessionIds || [];
      if (awardedSessions.includes(sessionId)) {
        return 0;
      }

      const oldXp = currentGamification.totalXp || 0;
      const newXp = oldXp + xpEarned;
      const oldLevel = calculateLevelInfo(oldXp).level;
      const newLevelInfo = calculateLevelInfo(newXp);

      const updatedProfile: GamificationProfile = {
        ...currentGamification,
        awardedSessionIds: [...awardedSessions, sessionId],
        totalXp: newXp,
        level: newLevelInfo.level,
      };

      setGamification(updatedProfile);
      gamificationRef.current = updatedProfile;

      enqueueFirestorePatch({
        'gamification.awardedSessionIds': arrayUnion(sessionId),
        'gamification.totalXp': increment(xpEarned),
        'gamification.level': newLevelInfo.level,
      });

      if (newLevelInfo.level > oldLevel) {
        notifyLevelUp(oldLevel, newLevelInfo);
        showInfo(
          `Logged ${durationMinutes} minutes of focused study.`,
          `+${xpEarned} XP Earned!`
        );
      } else {
        showInfo(
          `Logged ${durationMinutes} minutes of focused study.`,
          `+${xpEarned} XP Earned! (1 XP / min)`
        );
      }

      return xpEarned;
    });
  }, [runSerializedGamificationTask, enqueueFirestorePatch, showInfo, notifyLevelUp]);

  // Award Task Completion XP (with deduplication)
  const awardTaskCompletionXp = useCallback(async (taskId: string, priority: string = 'medium'): Promise<number> => {
    if (!taskId) return 0;

    return runSerializedGamificationTask(() => {
      const currentGamification = gamificationRef.current;
      const awarded = currentGamification.awardedTaskIds || [];
      if (awarded.includes(taskId)) {
        return 0;
      }

      const xpEarned = calculateTaskXp(priority);
      const oldXp = currentGamification.totalXp || 0;
      const newXp = oldXp + xpEarned;
      const oldLevel = calculateLevelInfo(oldXp).level;
      const newLevelInfo = calculateLevelInfo(newXp);

      const updatedProfile: GamificationProfile = {
        ...currentGamification,
        awardedTaskIds: [...awarded, taskId],
        totalXp: newXp,
        level: newLevelInfo.level,
      };

      setGamification(updatedProfile);
      gamificationRef.current = updatedProfile;

      enqueueFirestorePatch({
        'gamification.awardedTaskIds': arrayUnion(taskId),
        'gamification.totalXp': increment(xpEarned),
        'gamification.level': newLevelInfo.level,
      });

      showInfo(`Task completed!`, `+${xpEarned} XP Earned!`);
      notifyLevelUp(oldLevel, newLevelInfo);

      return xpEarned;
    });
  }, [runSerializedGamificationTask, enqueueFirestorePatch, showInfo, notifyLevelUp]);

  // Award Goal Completion XP (with deduplication)
  const awardGoalCompletionXp = useCallback(async (goalId: string): Promise<number> => {
    if (!goalId) return 0;

    return runSerializedGamificationTask(() => {
      const currentGamification = gamificationRef.current;
      const awarded = currentGamification.awardedGoalIds || [];
      if (awarded.includes(goalId)) {
        return 0;
      }

      const xpEarned = XP_REWARDS.GOAL_COMPLETED;
      const oldXp = currentGamification.totalXp || 0;
      const newXp = oldXp + xpEarned;
      const oldLevel = calculateLevelInfo(oldXp).level;
      const newLevelInfo = calculateLevelInfo(newXp);

      const updatedProfile: GamificationProfile = {
        ...currentGamification,
        awardedGoalIds: [...awarded, goalId],
        totalXp: newXp,
        level: newLevelInfo.level,
      };

      setGamification(updatedProfile);
      gamificationRef.current = updatedProfile;

      enqueueFirestorePatch({
        'gamification.awardedGoalIds': arrayUnion(goalId),
        'gamification.totalXp': increment(xpEarned),
        'gamification.level': newLevelInfo.level,
      });

      playCue('session_complete');
      showSuccess(
        `You reached your study target goal! 🎉`,
        `+${xpEarned} XP • Goal Milestone Complete!`
      );
      notifyLevelUp(oldLevel, newLevelInfo);

      return xpEarned;
    });
  }, [runSerializedGamificationTask, enqueueFirestorePatch, playCue, showSuccess, notifyLevelUp]);

  // Daily target bonus (awarded once per local calendar day)
  const checkAndAwardDailyBonus = useCallback(async (todayStudyMinutes: number, dailyGoalMinutes: number) => {
    if (dailyGoalMinutes <= 0 || todayStudyMinutes < dailyGoalMinutes || !isInitializedRef.current) return;

    await runSerializedGamificationTask(() => {
      if (!isInitializedRef.current) return;

      const todayStr = formatLocalDateKey();
      const currentGamification = gamificationRef.current;
      const claimedDates = currentGamification.dailyBonusAwardedDates || [];
      if (claimedDates.includes(todayStr)) return;

      const bonusXp = XP_REWARDS.DAILY_TARGET_REACHED;
      const oldXp = currentGamification.totalXp || 0;
      const newXp = oldXp + bonusXp;
      const oldLevel = calculateLevelInfo(oldXp).level;
      const newLevelInfo = calculateLevelInfo(newXp);

      const updatedProfile: GamificationProfile = {
        ...currentGamification,
        dailyBonusAwardedDates: [...claimedDates, todayStr],
        totalXp: newXp,
        level: newLevelInfo.level,
      };

      setGamification(updatedProfile);
      gamificationRef.current = updatedProfile;

      enqueueFirestorePatch({
        'gamification.dailyBonusAwardedDates': arrayUnion(todayStr),
        'gamification.totalXp': increment(bonusXp),
        'gamification.level': newLevelInfo.level,
      });

      playCue('session_complete');
      showSuccess(
        `You hit your ${dailyGoalMinutes} minute study target today! Outstanding work! 🔥`,
        `Daily Goal Achieved! +${bonusXp} XP Bonus`
      );
      notifyLevelUp(oldLevel, newLevelInfo);
    });
  }, [runSerializedGamificationTask, enqueueFirestorePatch, playCue, showSuccess, notifyLevelUp]);

  // Synchronous helper that evaluates streak bonuses against currentGamification without awaiting
  const applyStreakBonusEvaluation = useCallback((
    streakCount: number,
    options?: { silent?: boolean }
  ) => {
    if (streakCount <= 0 || !isInitializedRef.current) return;

    const currentGamification = gamificationRef.current;
    const awardedMilestones = currentGamification.awardedStreakMilestones || [];
    let bonusXpTotal = 0;
    const newlyClaimed: number[] = [];
    const bonusMessages: { title: string; xp: number; days: number }[] = [];

    STREAK_BONUSES.forEach((bonus) => {
      if (streakCount >= bonus.streakDays && !awardedMilestones.includes(bonus.streakDays)) {
        bonusXpTotal += bonus.xpReward;
        newlyClaimed.push(bonus.streakDays);

        const alreadyNotified = notifiedStreakMilestonesRef.current.has(bonus.streakDays);
        if (!alreadyNotified && !options?.silent) {
          bonusMessages.push({ title: bonus.title, xp: bonus.xpReward, days: bonus.streakDays });
        }
        notifiedStreakMilestonesRef.current.add(bonus.streakDays);
      }
    });

    if (newlyClaimed.length > 0) {
      const oldXp = currentGamification.totalXp || 0;
      const newXp = oldXp + bonusXpTotal;
      const oldLevel = calculateLevelInfo(oldXp).level;
      const newLevelInfo = calculateLevelInfo(newXp);
      const nextLongest = Math.max(currentGamification.longestStreak || 0, streakCount);

      const updatedProfile: GamificationProfile = {
        ...currentGamification,
        awardedStreakMilestones: [...awardedMilestones, ...newlyClaimed],
        notifiedStreakMilestones: Array.from(notifiedStreakMilestonesRef.current),
        longestStreak: nextLongest,
        totalXp: newXp,
        level: newLevelInfo.level,
      };

      setGamification(updatedProfile);
      gamificationRef.current = updatedProfile;

      enqueueFirestorePatch({
        'gamification.awardedStreakMilestones': arrayUnion(...newlyClaimed),
        'gamification.notifiedStreakMilestones': arrayUnion(...newlyClaimed),
        'gamification.longestStreak': nextLongest,
        'gamification.totalXp': increment(bonusXpTotal),
        'gamification.level': newLevelInfo.level,
      });

      if (bonusMessages.length > 0) {
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

      notifyLevelUp(oldLevel, newLevelInfo, options);
    }
  }, [enqueueFirestorePatch, playCue, showSuccess, notifyLevelUp]);

  // STREAK BONUSES
  // 1 day: +10 XP, 3 days: +25 XP, 7 days: +50 XP, 14 days: +100 XP,
  // 30 days: +250 XP, 60 days: +500 XP, 100 days: +1,000 XP
  const checkStreakBonuses = useCallback(async (streakCount: number, options?: { silent?: boolean }) => {
    if (streakCount <= 0 || !isInitializedRef.current) return;
    await runSerializedGamificationTask(() => {
      applyStreakBonusEvaluation(streakCount, options);
    });
  }, [runSerializedGamificationTask, applyStreakBonusEvaluation]);

  // Check all badges/milestones & streak bonuses atomically inside serialized queue
  const checkAllMilestones = useCallback(async (
    stats: {
      totalSessions: number;
      totalTasks: number;
      totalMinutes: number;
      streakCount: number;
      subjectCount: number;
      completedGoalsCount: number;
    },
    options?: { silent?: boolean }
  ) => {
    setCachedStats(stats);

    if (!isInitializedRef.current) {
      return;
    }

    await runSerializedGamificationTask(() => {
      if (!isInitializedRef.current) return;

      const effectiveBestStreak = Math.max(
        stats.streakCount,
        gamificationRef.current.longestStreak || 0,
        ...(gamificationRef.current.awardedStreakMilestones || []),
        0
      );

      // Evaluate streak bonuses synchronously within the same serialized critical section
      applyStreakBonusEvaluation(effectiveBestStreak, options);

      const currentGamification = gamificationRef.current;
      const currentUnlocked = { ...(currentGamification.unlockedBadges || {}) };
      const currentLevel = calculateLevelInfo(currentGamification.totalXp || 0).level;
      let extraXp = 0;
      const newlyUnlockedBadges: BadgeDefinition[] = [];
      const badgesToNotify: BadgeDefinition[] = [];
      const badgeUnlockTimestamps: Record<string, string> = {};

      ALL_BADGES.forEach((badge) => {
        if (currentUnlocked[badge.id]) {
          notifiedBadgesRef.current.add(badge.id);
          return;
        }

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

          // Streak (evaluated against highest continuous streak reached)
          case 'streak_1':
            isConditionMet = effectiveBestStreak >= 1;
            break;
          case 'streak_3':
            isConditionMet = effectiveBestStreak >= 3;
            break;
          case 'streak_7':
            isConditionMet = effectiveBestStreak >= 7;
            break;
          case 'streak_14':
            isConditionMet = effectiveBestStreak >= 14;
            break;
          case 'streak_30':
            isConditionMet = effectiveBestStreak >= 30;
            break;
          case 'streak_60':
            isConditionMet = effectiveBestStreak >= 60;
            break;
          case 'streak_100':
            isConditionMet = effectiveBestStreak >= 100;
            break;

          // Levels
          case 'level_2':
            isConditionMet = currentLevel >= 2;
            break;
          case 'level_5':
            isConditionMet = currentLevel >= 5;
            break;
          case 'level_10':
            isConditionMet = currentLevel >= 10;
            break;
          case 'level_20':
            isConditionMet = currentLevel >= 20;
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
          const unlockedIso = new Date().toISOString();
          currentUnlocked[badge.id] = unlockedIso;
          badgeUnlockTimestamps[badge.id] = unlockedIso;
          extraXp += badge.xpReward;
          newlyUnlockedBadges.push(badge);

          const alreadyNotified = notifiedBadgesRef.current.has(badge.id);
          if (!alreadyNotified && !options?.silent) {
            badgesToNotify.push(badge);
          }
          notifiedBadgesRef.current.add(badge.id);
        }
      });

      const shouldPersistLongest = effectiveBestStreak > (currentGamification.longestStreak || 0);

      if (newlyUnlockedBadges.length > 0) {
        const oldXp = currentGamification.totalXp || 0;
        const oldLevel = calculateLevelInfo(oldXp).level;
        const newTotalXp = oldXp + extraXp;
        const newLevelInfo = calculateLevelInfo(newTotalXp);
        const nextLongest = Math.max(currentGamification.longestStreak || 0, effectiveBestStreak);
        const checkedAt = new Date().toISOString();

        const updatedProfile: GamificationProfile = {
          ...currentGamification,
          unlockedBadges: currentUnlocked,
          notifiedBadgeIds: Array.from(notifiedBadgesRef.current),
          longestStreak: nextLongest,
          totalXp: newTotalXp,
          level: newLevelInfo.level,
          lastMilestoneCheck: checkedAt,
        };

        setGamification(updatedProfile);
        gamificationRef.current = updatedProfile;

        const patch: Record<string, any> = {
          'gamification.notifiedBadgeIds': arrayUnion(...newlyUnlockedBadges.map(b => b.id)),
          'gamification.level': newLevelInfo.level,
          'gamification.lastMilestoneCheck': checkedAt,
        };
        if (extraXp > 0) {
          patch['gamification.totalXp'] = increment(extraXp);
        }
        if (shouldPersistLongest) {
          patch['gamification.longestStreak'] = nextLongest;
        }
        Object.entries(badgeUnlockTimestamps).forEach(([badgeId, unlockedIso]) => {
          patch[`gamification.unlockedBadges.${badgeId}`] = unlockedIso;
        });

        enqueueFirestorePatch(patch);

        if (badgesToNotify.length > 0) {
          playCue('session_complete');

          badgesToNotify.forEach((b) => {
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

        notifyLevelUp(oldLevel, newLevelInfo, options);
      } else if (shouldPersistLongest) {
        const updatedProfile: GamificationProfile = {
          ...currentGamification,
          longestStreak: effectiveBestStreak,
        };
        setGamification(updatedProfile);
        gamificationRef.current = updatedProfile;

        enqueueFirestorePatch({
          'gamification.longestStreak': effectiveBestStreak,
        });
      }
    });
  }, [runSerializedGamificationTask, applyStreakBonusEvaluation, enqueueFirestorePatch, playCue, showSuccess, notifyLevelUp]);

  // Compute full display badges with accurate real-time progress
  const allBadges: DisplayBadge[] = useMemo(() => {
    const unlockedMap = gamification.unlockedBadges || {};
    const bestStreak = Math.max(cachedStats.streakCount, gamification.longestStreak || 0);

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
            liveProgress = Math.min(b.targetValue, bestStreak);
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
  }, [gamification.unlockedBadges, gamification.longestStreak, cachedStats, levelInfo.level]);

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
