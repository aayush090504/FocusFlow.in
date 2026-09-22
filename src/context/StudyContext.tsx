import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import { useSound } from './SoundContext';
import { useToast } from './ToastContext';
import { 
  Subject, 
  Task, 
  FocusSession, 
  FocusMode, 
  Goal, 
  GoalStatus, 
  PomodoroSettings, 
  DEFAULT_POMODORO_SETTINGS 
} from '../types';

export interface DailyStudyMetric {
  day: string;
  date: string;
  minutes: number;
  tasksCompleted: number;
  isToday: boolean;
}

export interface ActiveTimerState {
  isRunning: boolean;
  mode: FocusMode;
  phase: 'focus' | 'break';
  secondsRemaining: number;
  initialDurationSeconds: number;
  stopwatchElapsedSeconds: number;
  accumulatedFocusedSeconds: number;
  focusSegmentStartTime?: number | null;
  pomodoroCycleCount: number;
  subjectId?: string;
  taskId?: string;
  notes?: string;
  targetEndTime?: number | null;
  stopwatchStartTime?: number | null;
}

interface StudyContextType {
  subjects: Subject[];
  tasks: Task[];
  focusSessions: FocusSession[];
  goals: Goal[];
  loadingData: boolean;
  
  // Subject Actions
  addSubject: (data: { name: string; color: string; icon?: string; description?: string; targetHoursPerWeek?: number }) => Promise<string>;
  updateSubject: (id: string, data: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  // Task Actions
  addTask: (data: { title: string; subjectId?: string; description?: string; dueDate?: string; priority: 'low' | 'medium' | 'high'; estimatedMinutes?: number }) => Promise<string>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;

  // Focus Session Actions
  logFocusSession: (data: { durationMinutes: number; mode: FocusMode; subjectId?: string; taskId?: string; notes?: string }) => Promise<string>;

  // Goal Actions
  addGoal: (data: { title: string; targetValue: number; unit: string; targetDate?: string; subjectId?: string; currentValue?: number; notes?: string }) => Promise<string>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  toggleGoalCompletion: (goalId: string) => Promise<void>;
  incrementGoalProgress: (goalId: string, amount?: number) => Promise<void>;
  
  // Computed Dashboard & Analytics Metrics
  totalStudyMinutes: number;
  todayStudyMinutes: number;
  weeklyStudyMinutes: number;
  monthlyStudyMinutes: number;
  focusSessionsCompletedCount: number;
  completedTasksTodayCount: number;
  totalCompletedTasksCount: number;
  pendingTasksCount: number;
  todayTasks: Task[];
  upcomingTasks: Task[];
  recentSessions: FocusSession[];
  subjectStats: { 
    subject: Subject; 
    minutesStudied: number; 
    sessionCount: number;
    taskCount: number;
    percentage: number;
  }[];
  weeklyDaysData: DailyStudyMetric[];
  activeGoals: Goal[];
  completedGoals: Goal[];

  // Pomodoro & Timer Settings
  pomodoroSettings: PomodoroSettings;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => Promise<void>;

  // Global Active Timer state
  activeTimer: ActiveTimerState;
  startTimer: (
    mode: FocusMode, 
    durationMinutes?: number, 
    subjectId?: string, 
    taskId?: string, 
    options?: { skipZenPrompt?: boolean; forceZen?: boolean }
  ) => void;
  confirmStartZenFocus: (customConfig?: { mode: FocusMode; durationMinutes: number; subjectId?: string; taskId?: string }) => void;
  confirmStartStandardFocus: (customConfig?: { mode: FocusMode; durationMinutes: number; subjectId?: string; taskId?: string }) => void;
  exitZenMode: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  adjustTimerTime: (deltaSeconds: number) => void;
  skipBreak: () => void;
  finishCurrentTimerSession: (notes?: string) => Promise<{ sessionId?: string; durationMinutes: number }>;
  
  // UI & Modal States
  isZenModeActive: boolean;
  setIsZenModeActive: (active: boolean) => void;
  isZenPromptOpen: boolean;
  setIsZenPromptOpen: (open: boolean) => void;
  pendingTimerConfig: { mode: FocusMode; durationMinutes: number; subjectId?: string; taskId?: string } | null;
  setPendingTimerConfig: (config: { mode: FocusMode; durationMinutes: number; subjectId?: string; taskId?: string } | null) => void;
  isTimerModalOpen: boolean;
  setIsTimerModalOpen: (open: boolean) => void;
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  selectedTaskForEdit: Task | null;
  setSelectedTaskForEdit: (task: Task | null) => void;
  isSubjectModalOpen: boolean;
  setIsSubjectModalOpen: (open: boolean) => void;
  selectedSubjectForEdit: Subject | null;
  setSelectedSubjectForEdit: (subject: Subject | null) => void;
  isGoalModalOpen: boolean;
  setIsGoalModalOpen: (open: boolean) => void;
  selectedGoalForEdit: Goal | null;
  setSelectedGoalForEdit: (goal: Goal | null) => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const DEFAULT_SUBJECTS = [
  { name: 'Mathematics', color: '#6366f1', icon: 'Calculator', description: 'Calculus, Algebra & Problem Solving', targetHoursPerWeek: 6 },
  { name: 'Computer Science', color: '#0ea5e9', icon: 'Code', description: 'Algorithms, Data Structures & Coding', targetHoursPerWeek: 8 },
  { name: 'Physics & Science', color: '#10b981', icon: 'Atom', description: 'Mechanics, Optics & Lab Research', targetHoursPerWeek: 5 },
  { name: 'Literature & Languages', color: '#f59e0b', icon: 'BookOpen', description: 'Essays, Vocabulary & Grammar', targetHoursPerWeek: 4 },
];

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, updatePomodoroSettings: authUpdatePomodoroSettings } = useAuth();
  const { awardFocusSessionXp } = useGamification();
  const { 
    soundSettings, 
    playCue, 
    isAmbientPlaying, 
    startAmbient, 
    stopAmbient,
    isLocalMusicPlaying,
    pauseLocalMusic
  } = useSound();
  const { showSuccess, showInfo, showError } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Modals & Active UI state
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isZenModeActive, setIsZenModeActive] = useState(false);
  const [isZenPromptOpen, setIsZenPromptOpen] = useState(false);
  const [pendingTimerConfig, setPendingTimerConfig] = useState<{
    mode: FocusMode;
    durationMinutes: number;
    subjectId?: string;
    taskId?: string;
  } | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalForEdit, setSelectedGoalForEdit] = useState<Goal | null>(null);

  // Pomodoro Settings State
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(() => {
    if (userProfile?.pomodoroSettings) {
      return { ...DEFAULT_POMODORO_SETTINGS, ...userProfile.pomodoroSettings };
    }
    const saved = localStorage.getItem('focusflow_pomodoro_settings');
    if (saved) {
      try {
        return { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_POMODORO_SETTINGS;
      }
    }
    return DEFAULT_POMODORO_SETTINGS;
  });

  // Active Timer state
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState>(() => {
    let initialMins = DEFAULT_POMODORO_SETTINGS.focusDurationMinutes;
    if (userProfile?.pomodoroSettings?.focusDurationMinutes) {
      initialMins = userProfile.pomodoroSettings.focusDurationMinutes;
    } else {
      const saved = localStorage.getItem('focusflow_pomodoro_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.focusDurationMinutes) initialMins = parsed.focusDurationMinutes;
        } catch {}
      }
    }
    const initialSecs = initialMins * 60;
    return {
      isRunning: false,
      mode: 'pomodoro',
      phase: 'focus',
      secondsRemaining: initialSecs,
      initialDurationSeconds: initialSecs,
      stopwatchElapsedSeconds: 0,
      accumulatedFocusedSeconds: 0,
      focusSegmentStartTime: null,
      pomodoroCycleCount: 0,
      targetEndTime: null,
      stopwatchStartTime: null,
    };
  });

  // Keep pomodoro settings in sync when userProfile updates
  useEffect(() => {
    if (userProfile?.pomodoroSettings) {
      const cloudSettings = userProfile.pomodoroSettings;
      setPomodoroSettings(prev => ({
        ...prev,
        ...cloudSettings
      }));

      // If active timer is unstarted or idle, immediately sync to the user's saved pomodoro duration
      setActiveTimer(prev => {
        if (!prev.isRunning && prev.accumulatedFocusedSeconds === 0) {
          if (prev.mode === 'pomodoro' && cloudSettings.focusDurationMinutes) {
            const secs = cloudSettings.focusDurationMinutes * 60;
            return { ...prev, secondsRemaining: secs, initialDurationSeconds: secs };
          } else if (prev.mode === 'short_break' && cloudSettings.shortBreakDurationMinutes) {
            const secs = cloudSettings.shortBreakDurationMinutes * 60;
            return { ...prev, secondsRemaining: secs, initialDurationSeconds: secs };
          } else if (prev.mode === 'long_break' && cloudSettings.longBreakDurationMinutes) {
            const secs = cloudSettings.longBreakDurationMinutes * 60;
            return { ...prev, secondsRemaining: secs, initialDurationSeconds: secs };
          }
        }
        return prev;
      });
    }
  }, [userProfile?.pomodoroSettings]);

  const updatePomodoroSettings = async (settings: Partial<PomodoroSettings>) => {
    const updated: PomodoroSettings = { ...pomodoroSettings, ...settings };
    setPomodoroSettings(updated);
    localStorage.setItem('focusflow_pomodoro_settings', JSON.stringify(updated));

    // Immediately reflect the updated duration in activeTimer if the current mode matches the edited setting
    setActiveTimer(prev => {
      let targetDurationMinutes: number | undefined;

      if (prev.mode === 'pomodoro' && settings.focusDurationMinutes !== undefined) {
        targetDurationMinutes = settings.focusDurationMinutes;
      } else if (prev.mode === 'short_break' && settings.shortBreakDurationMinutes !== undefined) {
        targetDurationMinutes = settings.shortBreakDurationMinutes;
      } else if (prev.mode === 'long_break' && settings.longBreakDurationMinutes !== undefined) {
        targetDurationMinutes = settings.longBreakDurationMinutes;
      }

      if (targetDurationMinutes === undefined) {
        return prev;
      }

      const newDurationSecs = Math.max(60, targetDurationMinutes * 60);

      if (!prev.isRunning) {
        // If not running and unstarted, immediately set both remaining and initial seconds
        const isPristine = prev.accumulatedFocusedSeconds === 0;
        if (isPristine) {
          return {
            ...prev,
            secondsRemaining: newDurationSecs,
            initialDurationSeconds: newDurationSecs,
            accumulatedFocusedSeconds: 0,
            focusSegmentStartTime: null,
            targetEndTime: null,
          };
        } else {
          // Paused session: adjust remaining relative to elapsed time
          const elapsed = prev.accumulatedFocusedSeconds;
          const remaining = Math.max(0, newDurationSecs - elapsed);
          return {
            ...prev,
            secondsRemaining: remaining,
            initialDurationSeconds: newDurationSecs,
          };
        }
      } else {
        // Currently running: recalculate remaining and targetEndTime based on elapsed time
        const now = Date.now();
        const currentSegment = (prev.phase === 'focus' && prev.focusSegmentStartTime)
          ? Math.max(0, Math.floor((now - prev.focusSegmentStartTime) / 1000))
          : Math.max(0, prev.initialDurationSeconds - prev.secondsRemaining);
        const totalElapsed = prev.phase === 'focus'
          ? (prev.accumulatedFocusedSeconds + currentSegment)
          : Math.max(0, prev.initialDurationSeconds - prev.secondsRemaining);

        const newRemaining = Math.max(0, newDurationSecs - totalElapsed);
        return {
          ...prev,
          secondsRemaining: newRemaining,
          initialDurationSeconds: newDurationSecs,
          targetEndTime: now + newRemaining * 1000,
        };
      }
    });

    // Also update any pending timer pre-flight dialog configuration
    setPendingTimerConfig(prev => {
      if (!prev) return null;
      if (prev.mode === 'pomodoro' && settings.focusDurationMinutes !== undefined) {
        return { ...prev, durationMinutes: settings.focusDurationMinutes };
      }
      if (prev.mode === 'short_break' && settings.shortBreakDurationMinutes !== undefined) {
        return { ...prev, durationMinutes: settings.shortBreakDurationMinutes };
      }
      if (prev.mode === 'long_break' && settings.longBreakDurationMinutes !== undefined) {
        return { ...prev, durationMinutes: settings.longBreakDurationMinutes };
      }
      return prev;
    });

    if (user && userProfile && authUpdatePomodoroSettings) {
      try {
        await authUpdatePomodoroSettings(updated);
      } catch (err) {
        console.warn('Could not sync pomodoro settings to cloud:', err);
      }
    }
  };

  // Guard against multiple simultaneous completion executions
  const isCompletingRef = useRef(false);

  // Real-time Firestore Listeners for isolated user data
  useEffect(() => {
    if (!user) {
      setSubjects([]);
      setTasks([]);
      setFocusSessions([]);
      setGoals([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const userId = user.uid;

    // 1. Subjects Listener
    const subjectsPath = `users/${userId}/subjects`;
    const subjectsRef = collection(db, 'users', userId, 'subjects');
    const unsubSubjects = onSnapshot(subjectsRef, async (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
      if (items.length === 0 && snapshot.empty) {
        try {
          for (const def of DEFAULT_SUBJECTS) {
            const newId = `subj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const subjectDoc = doc(db, 'users', userId, 'subjects', newId);
            await setDoc(subjectDoc, {
              id: newId,
              userId,
              name: def.name,
              color: def.color,
              icon: def.icon,
              description: def.description,
              targetHoursPerWeek: def.targetHoursPerWeek,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, subjectsPath);
        }
      } else {
        setSubjects(items);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, subjectsPath);
    });

    // 2. Tasks Listener
    const tasksPath = `users/${userId}/tasks`;
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const tasksQuery = query(tasksRef, orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, tasksPath);
    });

    // 3. Focus Sessions Listener
    const sessionsPath = `users/${userId}/focusSessions`;
    const sessionsRef = collection(db, 'users', userId, 'focusSessions');
    const sessionsQuery = query(sessionsRef, orderBy('completedAt', 'desc'));
    const unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
      setFocusSessions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FocusSession)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, sessionsPath);
    });

    // 4. Goals Listener
    const goalsPath = `users/${userId}/goals`;
    const goalsRef = collection(db, 'users', userId, 'goals');
    const unsubGoals = onSnapshot(goalsRef, (snapshot) => {
      setGoals(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));
      setLoadingData(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, goalsPath);
      setLoadingData(false);
    });

    return () => {
      unsubSubjects();
      unsubTasks();
      unsubSessions();
      unsubGoals();
    };
  }, [user]);

  // Log Focus Session to Firestore
  const logFocusSession = async (data: { durationMinutes: number; mode: FocusMode; subjectId?: string; taskId?: string; notes?: string }): Promise<string> => {
    // Only focus modes can be logged as study sessions
    if (data.mode === 'short_break' || data.mode === 'long_break') {
      return '';
    }

    if (!user) throw new Error('Must be authenticated');
    const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${user.uid}/focusSessions/${sessionId}`;
    try {
      const sessionDoc = doc(db, 'users', user.uid, 'focusSessions', sessionId);
      const newSession: FocusSession = {
        id: sessionId,
        userId: user.uid,
        durationMinutes: data.durationMinutes,
        mode: data.mode,
        subjectId: data.subjectId || '',
        taskId: data.taskId || '',
        notes: data.notes?.trim() || '',
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      await setDoc(sessionDoc, newSession);

      // Also update user's lastActiveDate and streak
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = userProfile?.streakCount || 1;
      const lastDate = userProfile?.lastActiveDate;

      if (lastDate) {
        if (lastDate === today) {
          // Already active today
        } else if (lastDate === yesterdayStr) {
          // Active yesterday, streak continues
          newStreak = (userProfile?.streakCount || 0) + 1;
        } else {
          // Missed days, reset streak
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        lastActiveDate: today,
        streakCount: newStreak,
        updatedAt: new Date().toISOString()
      }).catch(() => {});

      return sessionId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return '';
    }
  };

  // Central Timer Phase Completion & Transition Handler
  const handleTimerCompletion = useCallback(async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    try {
      const currentMode = activeTimer.mode;
      const isFocusPhase = currentMode === 'pomodoro' || currentMode === 'custom';

      if (isFocusPhase) {
        // --- 1. FOCUS SESSION COMPLETED ---
        const durationMinutes = Math.max(1, Math.round(activeTimer.initialDurationSeconds / 60));
        
        // Stop audio cues
        if (isAmbientPlaying) stopAmbient();
        if (isLocalMusicPlaying) pauseLocalMusic();

        // Trigger celebratory sound & confetti
        playCue('session_complete');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        // Persist session & award exact XP (1 XP per minute)
        let loggedSessionId = '';
        try {
          loggedSessionId = await logFocusSession({
            durationMinutes,
            mode: currentMode,
            subjectId: activeTimer.subjectId,
            taskId: activeTimer.taskId,
            notes: activeTimer.notes,
          });

          if (loggedSessionId) {
            await awardFocusSessionXp(loggedSessionId, durationMinutes);
          }
        } catch (e) {
          console.error('Failed to log or award XP for completed focus session:', e);
        }

        if (currentMode === 'pomodoro') {
          // Automatic Transition to Short or Long Break!
          const nextCycle = activeTimer.pomodoroCycleCount + 1;
          const isLongBreak = nextCycle % pomodoroSettings.longBreakInterval === 0;
          const nextMode: FocusMode = isLongBreak ? 'long_break' : 'short_break';
          const breakMins = isLongBreak 
            ? pomodoroSettings.longBreakDurationMinutes 
            : pomodoroSettings.shortBreakDurationMinutes;
          const breakSecs = breakMins * 60;
          const shouldAutoStart = pomodoroSettings.autoStartBreaks;

          if (shouldAutoStart) {
            playCue('break_start');
            showSuccess(
              isLongBreak 
                ? `🎉 4 Pomodoros complete! Enjoy your ${breakMins}m Long Break!` 
                : `✨ Focus complete (+${durationMinutes} XP)! Starting ${breakMins}m Short Break...`,
              'Break Time'
            );
          } else {
            showSuccess(
              `✨ Focus session complete (+${durationMinutes} XP)! Next up: ${breakMins}m ${isLongBreak ? 'Long Break' : 'Short Break'}.`,
              'Session Finished'
            );
          }

          setActiveTimer(prev => ({
            ...prev,
            isRunning: shouldAutoStart,
            mode: nextMode,
            phase: 'break',
            secondsRemaining: breakSecs,
            initialDurationSeconds: breakSecs,
            stopwatchElapsedSeconds: 0,
            pomodoroCycleCount: nextCycle,
            targetEndTime: shouldAutoStart ? Date.now() + breakSecs * 1000 : null,
            stopwatchStartTime: null,
          }));
        } else {
          // Custom timer completed
          showSuccess(`✨ Custom focus session complete (+${durationMinutes} XP)!`, 'Session Finished');
          setActiveTimer(prev => ({
            ...prev,
            isRunning: false,
            phase: 'focus',
            secondsRemaining: prev.initialDurationSeconds,
            targetEndTime: null,
          }));
        }
      } else {
        // --- 2. BREAK TIME COMPLETED ---
        // Short/Long breaks award ZERO XP and log ZERO study time
        playCue('session_start');
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

        const nextDurationMins = pomodoroSettings.focusDurationMinutes;
        const nextDurationSecs = nextDurationMins * 60;
        const shouldAutoStart = pomodoroSettings.autoStartPomodoros;

        if (shouldAutoStart) {
          if (soundSettings.ambientType !== 'none' && soundSettings.ambientAutoPlayOnFocus && !isAmbientPlaying) {
            startAmbient();
          }
          showSuccess(`🔔 Break finished! Starting your ${nextDurationMins}m focus session... Let's flow!`, 'Focus Mode');
        } else {
          showInfo(`🔔 Break finished! Click start when you are ready to begin your next ${nextDurationMins}m focus session.`, 'Ready to Focus');
        }

        setActiveTimer(prev => ({
          ...prev,
          isRunning: shouldAutoStart,
          mode: 'pomodoro',
          phase: 'focus',
          secondsRemaining: nextDurationSecs,
          initialDurationSeconds: nextDurationSecs,
          stopwatchElapsedSeconds: 0,
          targetEndTime: shouldAutoStart ? Date.now() + nextDurationSecs * 1000 : null,
          stopwatchStartTime: null,
        }));
      }
    } finally {
      setTimeout(() => {
        isCompletingRef.current = false;
      }, 500);
    }
  }, [
    activeTimer, 
    pomodoroSettings, 
    awardFocusSessionXp, 
    playCue, 
    showSuccess, 
    showInfo, 
    isAmbientPlaying, 
    stopAmbient, 
    isLocalMusicPlaying, 
    pauseLocalMusic, 
    startAmbient, 
    soundSettings
  ]);

  // Main Timer Interval Effect with Background Drift Protection
  useEffect(() => {
    if (!activeTimer.isRunning) return;

    const interval = setInterval(() => {
      const now = Date.now();

      if (activeTimer.mode === 'stopwatch') {
        // Stopwatch Mode: Count UP
        const startTime = activeTimer.stopwatchStartTime || now;
        const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));
        setActiveTimer(prev => {
          if (!prev.isRunning) return prev;
          return {
            ...prev,
            stopwatchElapsedSeconds: elapsed,
          };
        });
      } else {
        // Countdown Modes (Pomodoro, Breaks, Custom): Count DOWN
        const targetEnd = activeTimer.targetEndTime;
        if (targetEnd) {
          const remaining = Math.max(0, Math.ceil((targetEnd - now) / 1000));
          if (remaining <= 0) {
            setActiveTimer(prev => ({ ...prev, secondsRemaining: 0, isRunning: false, targetEndTime: null }));
            handleTimerCompletion();
          } else {
            setActiveTimer(prev => {
              if (!prev.isRunning) return prev;
              return { ...prev, secondsRemaining: remaining };
            });
          }
        } else {
          setActiveTimer(prev => {
            if (prev.secondsRemaining <= 1) {
              handleTimerCompletion();
              return { ...prev, secondsRemaining: 0, isRunning: false };
            }
            return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer.isRunning, activeTimer.mode, activeTimer.targetEndTime, activeTimer.stopwatchStartTime, handleTimerCompletion]);

  // Visibility and Focus Handler to synchronize timer on tab revisit
  useEffect(() => {
    const handleSyncOnVisible = () => {
      if (document.visibilityState === 'visible' && activeTimer.isRunning) {
        const now = Date.now();
        if (activeTimer.mode === 'stopwatch' && activeTimer.stopwatchStartTime) {
          const elapsed = Math.max(0, Math.floor((now - activeTimer.stopwatchStartTime) / 1000));
          setActiveTimer(prev => ({ ...prev, stopwatchElapsedSeconds: elapsed }));
        } else if (activeTimer.targetEndTime) {
          const remaining = Math.max(0, Math.ceil((activeTimer.targetEndTime - now) / 1000));
          if (remaining <= 0) {
            setActiveTimer(prev => ({ ...prev, secondsRemaining: 0, isRunning: false, targetEndTime: null }));
            handleTimerCompletion();
          } else {
            setActiveTimer(prev => ({ ...prev, secondsRemaining: remaining }));
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleSyncOnVisible);
    window.addEventListener('focus', handleSyncOnVisible);
    return () => {
      document.removeEventListener('visibilitychange', handleSyncOnVisible);
      window.removeEventListener('focus', handleSyncOnVisible);
    };
  }, [activeTimer.isRunning, activeTimer.mode, activeTimer.targetEndTime, activeTimer.stopwatchStartTime, handleTimerCompletion]);

  // Timer Control Methods
  const startTimer = (
    mode: FocusMode, 
    durationMinutes?: number, 
    subjectId?: string, 
    taskId?: string, 
    options?: { skipZenPrompt?: boolean; forceZen?: boolean }
  ) => {
    // Resolve duration based on mode if not explicitly provided
    let duration = durationMinutes;
    if (!duration) {
      if (mode === 'pomodoro') duration = pomodoroSettings.focusDurationMinutes;
      else if (mode === 'short_break') duration = pomodoroSettings.shortBreakDurationMinutes;
      else if (mode === 'long_break') duration = pomodoroSettings.longBreakDurationMinutes;
      else if (mode === 'stopwatch') duration = 0;
      else duration = 25;
    }

    const isBreak = mode === 'short_break' || mode === 'long_break';
    const isStopwatch = mode === 'stopwatch';

    if (options?.forceZen) {
      const durationSecs = duration * 60;
      setActiveTimer({
        isRunning: true,
        mode,
        phase: isBreak ? 'break' : 'focus',
        secondsRemaining: durationSecs,
        initialDurationSeconds: durationSecs,
        stopwatchElapsedSeconds: 0,
        accumulatedFocusedSeconds: 0,
        focusSegmentStartTime: isBreak ? null : Date.now(),
        pomodoroCycleCount: activeTimer.pomodoroCycleCount,
        subjectId,
        taskId,
        targetEndTime: isStopwatch ? null : Date.now() + durationSecs * 1000,
        stopwatchStartTime: isStopwatch ? Date.now() : null,
      });
      setIsTimerModalOpen(false);
      setIsZenPromptOpen(false);
      setIsZenModeActive(true);
      if (document.documentElement && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      return;
    }

    // Breaks don't need Zen pre-flight modal
    if (options?.skipZenPrompt || isBreak) {
      const durationSecs = duration * 60;
      setActiveTimer({
        isRunning: true,
        mode,
        phase: isBreak ? 'break' : 'focus',
        secondsRemaining: durationSecs,
        initialDurationSeconds: durationSecs,
        stopwatchElapsedSeconds: 0,
        accumulatedFocusedSeconds: 0,
        focusSegmentStartTime: isBreak ? null : Date.now(),
        pomodoroCycleCount: activeTimer.pomodoroCycleCount,
        subjectId,
        taskId,
        targetEndTime: isStopwatch ? null : Date.now() + durationSecs * 1000,
        stopwatchStartTime: isStopwatch ? Date.now() : null,
      });
      setIsZenPromptOpen(false);
      setIsTimerModalOpen(true);
      return;
    }

    // Default flow: Always present the Zen Mode pre-flight prompt before starting a focus session
    setPendingTimerConfig({
      mode,
      durationMinutes: duration,
      subjectId,
      taskId,
    });
    setIsZenPromptOpen(true);
  };

  const confirmStartZenFocus = (customConfig?: { mode: FocusMode; durationMinutes: number; subjectId?: string; taskId?: string }) => {
    const config = customConfig || pendingTimerConfig || {
      mode: 'pomodoro' as FocusMode,
      durationMinutes: pomodoroSettings.focusDurationMinutes,
      subjectId: activeTimer.subjectId,
      taskId: activeTimer.taskId,
    };

    const isBreak = config.mode === 'short_break' || config.mode === 'long_break';
    const isStopwatch = config.mode === 'stopwatch';
    const durationSecs = config.durationMinutes * 60;

    setActiveTimer({
      isRunning: true,
      mode: config.mode,
      phase: isBreak ? 'break' : 'focus',
      secondsRemaining: durationSecs,
      initialDurationSeconds: durationSecs,
      stopwatchElapsedSeconds: 0,
      accumulatedFocusedSeconds: 0,
      focusSegmentStartTime: isBreak ? null : Date.now(),
      pomodoroCycleCount: activeTimer.pomodoroCycleCount,
      subjectId: config.subjectId,
      taskId: config.taskId,
      targetEndTime: isStopwatch ? null : Date.now() + durationSecs * 1000,
      stopwatchStartTime: isStopwatch ? Date.now() : null,
    });

    setIsZenPromptOpen(false);
    setIsTimerModalOpen(false);
    setIsZenModeActive(true);
    setPendingTimerConfig(null);

    // Request browser native fullscreen for distraction-free focus
    if (document.documentElement && document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const confirmStartStandardFocus = (customConfig?: { mode: FocusMode; durationMinutes: number; subjectId?: string; taskId?: string }) => {
    const config = customConfig || pendingTimerConfig || {
      mode: 'pomodoro' as FocusMode,
      durationMinutes: pomodoroSettings.focusDurationMinutes,
      subjectId: activeTimer.subjectId,
      taskId: activeTimer.taskId,
    };

    const isBreak = config.mode === 'short_break' || config.mode === 'long_break';
    const isStopwatch = config.mode === 'stopwatch';
    const durationSecs = config.durationMinutes * 60;

    setActiveTimer({
      isRunning: true,
      mode: config.mode,
      phase: isBreak ? 'break' : 'focus',
      secondsRemaining: durationSecs,
      initialDurationSeconds: durationSecs,
      stopwatchElapsedSeconds: 0,
      accumulatedFocusedSeconds: 0,
      focusSegmentStartTime: isBreak ? null : Date.now(),
      pomodoroCycleCount: activeTimer.pomodoroCycleCount,
      subjectId: config.subjectId,
      taskId: config.taskId,
      targetEndTime: isStopwatch ? null : Date.now() + durationSecs * 1000,
      stopwatchStartTime: isStopwatch ? Date.now() : null,
    });

    setIsZenPromptOpen(false);
    setIsZenModeActive(false);
    setIsTimerModalOpen(true);
    setPendingTimerConfig(null);
  };

  const exitZenMode = () => {
    setIsZenModeActive(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const pauseTimer = () => {
    const now = Date.now();
    setActiveTimer(prev => {
      const isFocus = prev.phase === 'focus';
      const segmentElapsed = (isFocus && prev.focusSegmentStartTime)
        ? Math.max(0, Math.floor((now - prev.focusSegmentStartTime) / 1000))
        : 0;
      return {
        ...prev,
        isRunning: false,
        targetEndTime: null,
        stopwatchStartTime: null,
        focusSegmentStartTime: null,
        accumulatedFocusedSeconds: prev.accumulatedFocusedSeconds + segmentElapsed,
      };
    });
  };

  const resumeTimer = () => {
    const now = Date.now();
    setActiveTimer(prev => {
      const isFocus = prev.phase === 'focus';
      if (prev.mode === 'stopwatch') {
        return {
          ...prev,
          isRunning: true,
          stopwatchStartTime: now - prev.stopwatchElapsedSeconds * 1000,
          focusSegmentStartTime: now,
        };
      }
      return {
        ...prev,
        isRunning: true,
        targetEndTime: now + prev.secondsRemaining * 1000,
        focusSegmentStartTime: isFocus ? now : null,
      };
    });
  };

  const resetTimer = () => {
    setActiveTimer(prev => {
      let resetDuration = prev.initialDurationSeconds;
      if (prev.mode === 'pomodoro') {
        resetDuration = pomodoroSettings.focusDurationMinutes * 60;
      } else if (prev.mode === 'short_break') {
        resetDuration = pomodoroSettings.shortBreakDurationMinutes * 60;
      } else if (prev.mode === 'long_break') {
        resetDuration = pomodoroSettings.longBreakDurationMinutes * 60;
      }

      return {
        ...prev,
        isRunning: false,
        initialDurationSeconds: resetDuration,
        secondsRemaining: resetDuration,
        stopwatchElapsedSeconds: 0,
        accumulatedFocusedSeconds: 0,
        focusSegmentStartTime: null,
        targetEndTime: null,
        stopwatchStartTime: null,
      };
    });
  };

  const adjustTimerTime = (deltaSeconds: number) => {
    setActiveTimer(prev => {
      if (prev.mode === 'stopwatch') return prev;
      const newTime = Math.max(0, prev.secondsRemaining + deltaSeconds);
      const newInitial = Math.max(prev.initialDurationSeconds, newTime);
      const targetEnd = prev.isRunning ? Date.now() + newTime * 1000 : null;
      return {
        ...prev,
        secondsRemaining: newTime,
        initialDurationSeconds: newInitial,
        targetEndTime: targetEnd,
      };
    });
  };

  // Skip the rest of a break phase and immediately start next Pomodoro
  const skipBreak = () => {
    const focusSecs = pomodoroSettings.focusDurationMinutes * 60;
    playCue('session_start');
    if (soundSettings.ambientType !== 'none' && soundSettings.ambientAutoPlayOnFocus && !isAmbientPlaying) {
      startAmbient();
    }
    showInfo('Skipped break. Starting focus session! 🎯', 'Focus Mode');
    setActiveTimer(prev => ({
      ...prev,
      isRunning: true,
      mode: 'pomodoro',
      phase: 'focus',
      secondsRemaining: focusSecs,
      initialDurationSeconds: focusSecs,
      stopwatchElapsedSeconds: 0,
      accumulatedFocusedSeconds: 0,
      focusSegmentStartTime: Date.now(),
      targetEndTime: Date.now() + focusSecs * 1000,
      stopwatchStartTime: null,
    }));
  };

  const finishCurrentTimerSession = async (notes?: string): Promise<{ sessionId?: string; durationMinutes: number }> => {
    // If currently in break mode, ending it earns 0 XP
    if (activeTimer.mode === 'short_break' || activeTimer.mode === 'long_break' || activeTimer.phase === 'break') {
      const focusSecs = pomodoroSettings.focusDurationMinutes * 60;
      setActiveTimer(prev => ({
        ...prev,
        isRunning: false,
        mode: 'pomodoro',
        phase: 'focus',
        secondsRemaining: focusSecs,
        initialDurationSeconds: focusSecs,
        stopwatchElapsedSeconds: 0,
        accumulatedFocusedSeconds: 0,
        focusSegmentStartTime: null,
        targetEndTime: null,
        stopwatchStartTime: null,
      }));
      return { sessionId: undefined, durationMinutes: 0 };
    }

    const now = Date.now();
    const currentSegmentDuration = (activeTimer.isRunning && activeTimer.phase === 'focus' && activeTimer.focusSegmentStartTime)
      ? Math.max(0, Math.floor((now - activeTimer.focusSegmentStartTime) / 1000))
      : 0;
    const totalActualFocusedSeconds = activeTimer.accumulatedFocusedSeconds + currentSegmentDuration;

    let minutes = 0;
    if (activeTimer.mode === 'stopwatch') {
      minutes = Math.floor(activeTimer.stopwatchElapsedSeconds / 60);
    } else {
      // Calculate strictly based on actual focused time spent
      minutes = Math.floor(totalActualFocusedSeconds / 60);
    }
    
    let loggedId: string | undefined = undefined;
    // Strictly award 1 XP per minute of completed focus/study time
    if (minutes >= 1 && (activeTimer.mode === 'pomodoro' || activeTimer.mode === 'custom' || activeTimer.mode === 'stopwatch')) {
      loggedId = await logFocusSession({
        durationMinutes: minutes,
        mode: activeTimer.mode,
        subjectId: activeTimer.subjectId,
        taskId: activeTimer.taskId,
        notes: notes || activeTimer.notes,
      });

      if (loggedId) {
        await awardFocusSessionXp(loggedId, minutes);
      }
    }

    // Reset active timer to stopped state
    if (activeTimer.mode === 'stopwatch') {
      setActiveTimer(prev => ({
        ...prev,
        isRunning: false,
        stopwatchElapsedSeconds: 0,
        accumulatedFocusedSeconds: 0,
        focusSegmentStartTime: null,
        stopwatchStartTime: null,
      }));
    } else {
      setActiveTimer(prev => ({
        ...prev,
        isRunning: false,
        secondsRemaining: prev.initialDurationSeconds,
        accumulatedFocusedSeconds: 0,
        focusSegmentStartTime: null,
        targetEndTime: null,
      }));
    }

    return { sessionId: loggedId, durationMinutes: minutes };
  };

  // Subject Actions
  const addSubject = async (data: { name: string; color: string; icon?: string; description?: string; targetHoursPerWeek?: number }): Promise<string> => {
    if (!user) throw new Error('Must be authenticated');
    const id = `subj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${user.uid}/subjects/${id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'subjects', id);
      const newSubject: Subject = {
        id,
        userId: user.uid,
        name: data.name.trim(),
        color: data.color || '#6366f1',
        icon: data.icon || 'BookOpen',
        description: data.description?.trim() || '',
        targetHoursPerWeek: data.targetHoursPerWeek || 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, newSubject);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return '';
    }
  };

  const updateSubject = async (id: string, data: Partial<Subject>) => {
    if (!user) return;
    const path = `users/${user.uid}/subjects/${id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'subjects', id);
      await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/subjects/${id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'subjects', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Task Actions
  const addTask = async (data: { title: string; subjectId?: string; description?: string; dueDate?: string; priority: 'low' | 'medium' | 'high'; estimatedMinutes?: number }): Promise<string> => {
    if (!user) throw new Error('Must be authenticated');
    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${user.uid}/tasks/${id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'tasks', id);
      const newTask: Task = {
        id,
        userId: user.uid,
        title: data.title.trim(),
        subjectId: data.subjectId || '',
        description: data.description?.trim() || '',
        dueDate: data.dueDate || '',
        priority: data.priority || 'medium',
        estimatedMinutes: data.estimatedMinutes || 25,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, newTask);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return '';
    }
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'tasks', id);
      await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'tasks', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !user) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : '';
    await updateTask(taskId, { status: newStatus, completedAt });
  };

  // Goal Actions
  const addGoal = async (data: { title: string; targetValue: number; unit: string; targetDate?: string; subjectId?: string; currentValue?: number; notes?: string }): Promise<string> => {
    if (!user) throw new Error('Must be authenticated');
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${user.uid}/goals/${id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'goals', id);
      const newGoal: Goal = {
        id,
        userId: user.uid,
        title: data.title.trim(),
        targetValue: data.targetValue,
        currentValue: data.currentValue || 0,
        unit: data.unit.trim(),
        targetDate: data.targetDate || '',
        subjectId: data.subjectId || '',
        status: 'in_progress',
        notes: data.notes?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, newGoal);
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return '';
    }
  };

  const updateGoal = async (id: string, data: Partial<Goal>) => {
    if (!user) return;
    const path = `users/${user.uid}/goals/${id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'goals', id);
      await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/goals/${id}`;
    try {
      const docRef = doc(db, 'users', user.uid, 'goals', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const toggleGoalCompletion = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user) return;
    const newStatus: GoalStatus = goal.status === 'completed' ? 'in_progress' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : '';
    await updateGoal(goalId, { status: newStatus, completedAt });
  };

  const incrementGoalProgress = async (goalId: string, amount: number = 1) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user) return;
    const newVal = Math.min(goal.targetValue, (goal.currentValue || 0) + amount);
    const newStatus: GoalStatus = newVal >= goal.targetValue ? 'completed' : goal.status;
    const completedAt = newStatus === 'completed' ? (goal.completedAt || new Date().toISOString()) : '';
    await updateGoal(goalId, { currentValue: newVal, status: newStatus, completedAt });
  };

  // Calculated Dates & Ranges
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Start of current week (Monday)
  const mondayStr = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day + 6) % 7; // days since Monday
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }, []);

  // Start of current month (1st)
  const monthStartStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);

  // Total Study Time (all-time focus minutes: strictly pomodoro, custom, stopwatch)
  const totalStudyMinutes = useMemo(() => {
    return focusSessions
      .filter(s => s.mode === 'pomodoro' || s.mode === 'custom' || s.mode === 'stopwatch')
      .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [focusSessions]);

  // Today Study Time
  const todayStudyMinutes = useMemo(() => {
    return focusSessions
      .filter(s => {
        const date = s.completedAt ? s.completedAt.split('T')[0] : (s.createdAt ? s.createdAt.split('T')[0] : '');
        return date === todayStr && (s.mode === 'pomodoro' || s.mode === 'custom' || s.mode === 'stopwatch');
      })
      .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [focusSessions, todayStr]);

  // Weekly Study Time (from Monday through today)
  const weeklyStudyMinutes = useMemo(() => {
    return focusSessions
      .filter(s => {
        const date = s.completedAt ? s.completedAt.split('T')[0] : (s.createdAt ? s.createdAt.split('T')[0] : '');
        return date >= mondayStr && (s.mode === 'pomodoro' || s.mode === 'custom' || s.mode === 'stopwatch');
      })
      .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [focusSessions, mondayStr]);

  // Monthly Study Time (from 1st of month through today)
  const monthlyStudyMinutes = useMemo(() => {
    return focusSessions
      .filter(s => {
        const date = s.completedAt ? s.completedAt.split('T')[0] : (s.createdAt ? s.createdAt.split('T')[0] : '');
        return date >= monthStartStr && (s.mode === 'pomodoro' || s.mode === 'custom' || s.mode === 'stopwatch');
      })
      .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [focusSessions, monthStartStr]);

  // Focus sessions completed count
  const focusSessionsCompletedCount = useMemo(() => {
    return focusSessions.filter(s => s.mode === 'pomodoro' || s.mode === 'custom' || s.mode === 'stopwatch').length;
  }, [focusSessions]);

  // 7-day Weekly distribution data
  const weeklyDaysData = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const d = new Date();
    const day = d.getDay();
    const diff = (day + 6) % 7;
    const baseMonday = new Date(d);
    baseMonday.setDate(d.getDate() - diff);
    baseMonday.setHours(0, 0, 0, 0);

    return labels.map((label, idx) => {
      const cur = new Date(baseMonday);
      cur.setDate(baseMonday.getDate() + idx);
      const curStr = cur.toISOString().split('T')[0];

      const mins = focusSessions
        .filter(s => {
          const sDate = s.completedAt ? s.completedAt.split('T')[0] : (s.createdAt ? s.createdAt.split('T')[0] : '');
          return sDate === curStr && (s.mode === 'pomodoro' || s.mode === 'custom' || s.mode === 'stopwatch');
        })
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      const tasksCompleted = tasks.filter(t => {
        const tDate = t.completedAt ? t.completedAt.split('T')[0] : '';
        return tDate === curStr && t.status === 'completed';
      }).length;

      return {
        day: label,
        date: curStr,
        minutes: mins,
        tasksCompleted,
        isToday: curStr === todayStr,
      };
    });
  }, [focusSessions, tasks, todayStr]);

  // Tasks Computations
  const completedTasksTodayCount = useMemo(() => {
    return tasks.filter(t => {
      const date = t.completedAt ? t.completedAt.split('T')[0] : '';
      return t.status === 'completed' && date === todayStr;
    }).length;
  }, [tasks, todayStr]);

  const totalCompletedTasksCount = useMemo(() => {
    return tasks.filter(t => t.status === 'completed').length;
  }, [tasks]);

  const pendingTasksCount = useMemo(() => {
    return tasks.filter(t => t.status === 'pending').length;
  }, [tasks]);

  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate === todayStr && t.status === 'pending');
  }, [tasks, todayStr]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'pending' && t.dueDate && t.dueDate > todayStr)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [tasks, todayStr]);

  const recentSessions = useMemo(() => {
    return focusSessions.slice(0, 5);
  }, [focusSessions]);

  // Subject Analytics & Time Distribution
  const subjectStats = useMemo(() => {
    const totalMinutes = totalStudyMinutes || 1; // avoid division by zero
    return subjects.map(subject => {
      const subSessions = focusSessions.filter(s => 
        s.subjectId === subject.id && 
        (s.mode === 'pomodoro' || s.mode === 'custom' || s.mode === 'stopwatch')
      );
      const minutesStudied = subSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const sessionCount = subSessions.length;
      const subTasks = tasks.filter(t => t.subjectId === subject.id);
      const percentage = Math.round((minutesStudied / totalMinutes) * 100);

      return {
        subject,
        minutesStudied,
        sessionCount,
        taskCount: subTasks.length,
        percentage,
      };
    }).sort((a, b) => b.minutesStudied - a.minutesStudied);
  }, [subjects, focusSessions, tasks, totalStudyMinutes]);

  // Goals separation
  const activeGoals = useMemo(() => {
    return goals.filter(g => g.status !== 'completed' && g.status !== 'archived');
  }, [goals]);

  const completedGoals = useMemo(() => {
    return goals.filter(g => g.status === 'completed');
  }, [goals]);

  return (
    <StudyContext.Provider
      value={{
        subjects,
        tasks,
        focusSessions,
        goals,
        loadingData,
        addSubject,
        updateSubject,
        deleteSubject,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        logFocusSession,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleGoalCompletion,
        incrementGoalProgress,
        totalStudyMinutes,
        todayStudyMinutes,
        weeklyStudyMinutes,
        monthlyStudyMinutes,
        focusSessionsCompletedCount,
        completedTasksTodayCount,
        totalCompletedTasksCount,
        pendingTasksCount,
        todayTasks,
        upcomingTasks,
        recentSessions,
        subjectStats,
        weeklyDaysData,
        activeGoals,
        completedGoals,
        pomodoroSettings,
        updatePomodoroSettings,
        activeTimer,
        startTimer,
        confirmStartZenFocus,
        confirmStartStandardFocus,
        exitZenMode,
        pauseTimer,
        resumeTimer,
        resetTimer,
        adjustTimerTime,
        skipBreak,
        finishCurrentTimerSession,
        isZenModeActive,
        setIsZenModeActive,
        isZenPromptOpen,
        setIsZenPromptOpen,
        pendingTimerConfig,
        setPendingTimerConfig,
        isTimerModalOpen,
        setIsTimerModalOpen,
        isTaskModalOpen,
        setIsTaskModalOpen,
        selectedTaskForEdit,
        setSelectedTaskForEdit,
        isSubjectModalOpen,
        setIsSubjectModalOpen,
        selectedSubjectForEdit,
        setSelectedSubjectForEdit,
        isGoalModalOpen,
        setIsGoalModalOpen,
        selectedGoalForEdit,
        setSelectedGoalForEdit,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
