import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Subject, Task, FocusSession, FocusMode, Goal, GoalStatus } from '../types';

export interface DailyStudyMetric {
  day: string;
  date: string;
  minutes: number;
  tasksCompleted: number;
  isToday: boolean;
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

  // Global Active Timer state for seamless cross-component focus
  activeTimer: {
    isRunning: boolean;
    mode: FocusMode;
    secondsRemaining: number;
    initialDurationSeconds: number;
    subjectId?: string;
    taskId?: string;
    notes?: string;
  };
  startTimer: (mode: FocusMode, durationMinutes: number, subjectId?: string, taskId?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  adjustTimerTime: (deltaSeconds: number) => void;
  finishCurrentTimerSession: (notes?: string) => Promise<{ sessionId?: string; durationMinutes: number }>;
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
  const { user, userProfile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Modals & Active UI state
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoalForEdit, setSelectedGoalForEdit] = useState<Goal | null>(null);

  // Active Timer state
  const [activeTimer, setActiveTimer] = useState<{
    isRunning: boolean;
    mode: FocusMode;
    secondsRemaining: number;
    initialDurationSeconds: number;
    subjectId?: string;
    taskId?: string;
    notes?: string;
  }>({
    isRunning: false,
    mode: 'pomodoro',
    secondsRemaining: 25 * 60,
    initialDurationSeconds: 25 * 60,
  });

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimer.isRunning && activeTimer.secondsRemaining > 0) {
      interval = setInterval(() => {
        setActiveTimer(prev => {
          if (prev.secondsRemaining <= 1) {
            return { ...prev, isRunning: false, secondsRemaining: 0 };
          }
          return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer.isRunning, activeTimer.secondsRemaining]);

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
      // Auto-populate starter subjects for first-time students if empty
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
        } catch (e) {
          console.error('Failed to seed default subjects:', e);
        }
      } else {
        setSubjects(items);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, subjectsPath);
    });

    // 2. Tasks Listener
    const tasksPath = `users/${userId}/tasks`;
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
      setTasks(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, tasksPath);
    });

    // 3. Focus Sessions Listener
    const sessionsPath = `users/${userId}/focusSessions`;
    const sessionsRef = collection(db, 'users', userId, 'focusSessions');
    const unsubSessions = onSnapshot(sessionsRef, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FocusSession));
      // Sort desc by completedAt or createdAt
      items.sort((a, b) => new Date(b.completedAt || b.createdAt || 0).getTime() - new Date(a.completedAt || a.createdAt || 0).getTime());
      setFocusSessions(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, sessionsPath);
    });

    // 4. Goals Listener
    const goalsPath = `users/${userId}/goals`;
    const goalsRef = collection(db, 'users', userId, 'goals');
    const unsubGoals = onSnapshot(goalsRef, async (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Goal));
      items.sort((a, b) => (a.targetDate || '9999').localeCompare(b.targetDate || '9999'));

      // Starter goals if none exist
      if (items.length === 0 && snapshot.empty) {
        try {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          const nextWeekStr = nextWeek.toISOString().split('T')[0];

          const goal1Id = `goal_${Date.now()}_1`;
          await setDoc(doc(db, 'users', userId, 'goals', goal1Id), {
            id: goal1Id,
            userId,
            title: 'Study 10 hours this week',
            targetValue: 10,
            currentValue: 0,
            unit: 'hours',
            status: 'active',
            targetDate: nextWeekStr,
            notes: 'Consistent focus blocks across all courses',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.error('Failed to seed default goal:', e);
        }
      } else {
        setGoals(items);
      }
      setLoadingData(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, goalsPath);
    });

    return () => {
      unsubSubjects();
      unsubTasks();
      unsubSessions();
      unsubGoals();
    };
  }, [user]);

  // Subject Handlers
  const addSubject = async (data: { name: string; color: string; icon?: string; description?: string; targetHoursPerWeek?: number }) => {
    if (!user) throw new Error('Must be authenticated');
    const subjectId = `subj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${user.uid}/subjects/${subjectId}`;
    try {
      const subjectDoc = doc(db, 'users', user.uid, 'subjects', subjectId);
      const newSubject: Subject = {
        id: subjectId,
        userId: user.uid,
        name: data.name.trim(),
        color: data.color || '#6366f1',
        icon: data.icon || 'BookOpen',
        description: data.description?.trim() || '',
        targetHoursPerWeek: data.targetHoursPerWeek || 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(subjectDoc, newSubject);
      return subjectId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateSubject = async (id: string, data: Partial<Subject>) => {
    if (!user) throw new Error('Must be authenticated');
    const path = `users/${user.uid}/subjects/${id}`;
    try {
      const subjectDoc = doc(db, 'users', user.uid, 'subjects', id);
      await updateDoc(subjectDoc, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!user) throw new Error('Must be authenticated');
    const path = `users/${user.uid}/subjects/${id}`;
    try {
      const subjectDoc = doc(db, 'users', user.uid, 'subjects', id);
      await deleteDoc(subjectDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Task Handlers
  const addTask = async (data: { title: string; subjectId?: string; description?: string; dueDate?: string; priority: 'low' | 'medium' | 'high'; estimatedMinutes?: number }) => {
    if (!user) throw new Error('Must be authenticated');
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      const taskDoc = doc(db, 'users', user.uid, 'tasks', taskId);
      const newTask: Task = {
        id: taskId,
        userId: user.uid,
        title: data.title.trim(),
        subjectId: data.subjectId || '',
        description: data.description?.trim() || '',
        dueDate: data.dueDate || new Date().toISOString().split('T')[0],
        priority: data.priority || 'medium',
        status: 'todo',
        estimatedMinutes: data.estimatedMinutes || 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(taskDoc, newTask);
      return taskId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    if (!user) throw new Error('Must be authenticated');
    const path = `users/${user.uid}/tasks/${id}`;
    try {
      const taskDoc = doc(db, 'users', user.uid, 'tasks', id);
      await updateDoc(taskDoc, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) throw new Error('Must be authenticated');
    const path = `users/${user.uid}/tasks/${id}`;
    try {
      const taskDoc = doc(db, 'users', user.uid, 'tasks', id);
      await deleteDoc(taskDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    const completedAt = nextStatus === 'completed' ? new Date().toISOString() : '';
    await updateTask(taskId, {
      status: nextStatus,
      completedAt,
    });
  };

  // Goal Handlers
  const addGoal = async (data: { title: string; targetValue: number; unit: string; targetDate?: string; subjectId?: string; currentValue?: number; notes?: string }) => {
    if (!user) throw new Error('Must be authenticated');
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${user.uid}/goals/${goalId}`;
    try {
      const goalDoc = doc(db, 'users', user.uid, 'goals', goalId);
      const newGoal: Goal = {
        id: goalId,
        userId: user.uid,
        title: data.title.trim(),
        targetValue: Number(data.targetValue) || 1,
        currentValue: Number(data.currentValue) || 0,
        unit: data.unit.trim() || 'tasks',
        status: 'active',
        subjectId: data.subjectId || '',
        targetDate: data.targetDate || '',
        notes: data.notes?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(goalDoc, newGoal);
      return goalId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateGoal = async (id: string, data: Partial<Goal>) => {
    if (!user) throw new Error('Must be authenticated');
    const path = `users/${user.uid}/goals/${id}`;
    try {
      const goalDoc = doc(db, 'users', user.uid, 'goals', id);
      await updateDoc(goalDoc, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) throw new Error('Must be authenticated');
    const path = `users/${user.uid}/goals/${id}`;
    try {
      const goalDoc = doc(db, 'users', user.uid, 'goals', id);
      await deleteDoc(goalDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const toggleGoalCompletion = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const isCompleted = goal.status === 'completed';
    const nextStatus: GoalStatus = isCompleted ? 'active' : 'completed';
    const nextCurrent = isCompleted ? Math.max(0, goal.currentValue - 1) : Math.max(goal.currentValue, goal.targetValue);
    await updateGoal(goalId, {
      status: nextStatus,
      currentValue: nextCurrent,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : '',
    });
  };

  const incrementGoalProgress = async (goalId: string, amount: number = 1) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const newCurrent = Math.max(0, (goal.currentValue || 0) + amount);
    const shouldComplete = newCurrent >= goal.targetValue;
    await updateGoal(goalId, {
      currentValue: newCurrent,
      status: shouldComplete ? 'completed' : 'active',
      completedAt: shouldComplete ? new Date().toISOString() : '',
    });
  };

  // Focus Session Handlers
  const logFocusSession = async (data: { durationMinutes: number; mode: FocusMode; subjectId?: string; taskId?: string; notes?: string }) => {
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

      // Also update user's lastActiveDate and streak if needed
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = userProfile?.streakCount || 1;
      const lastDate = userProfile?.lastActiveDate;

      if (lastDate) {
        if (lastDate === today) {
          // Already active today, maintain streak
        } else if (lastDate === yesterdayStr) {
          // Active yesterday, streak continues!
          newStreak = (userProfile?.streakCount || 0) + 1;
        } else {
          // Missed days, reset streak to 1
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
    }
  };

  // Timer Controls
  const startTimer = (mode: FocusMode, durationMinutes: number, subjectId?: string, taskId?: string) => {
    setActiveTimer({
      isRunning: true,
      mode,
      secondsRemaining: durationMinutes * 60,
      initialDurationSeconds: durationMinutes * 60,
      subjectId,
      taskId,
    });
    setIsTimerModalOpen(true);
  };

  const pauseTimer = () => {
    setActiveTimer(prev => ({ ...prev, isRunning: false }));
  };

  const resumeTimer = () => {
    setActiveTimer(prev => ({ ...prev, isRunning: true }));
  };

  const resetTimer = () => {
    setActiveTimer(prev => ({
      ...prev,
      isRunning: false,
      secondsRemaining: prev.initialDurationSeconds,
    }));
  };

  const adjustTimerTime = (deltaSeconds: number) => {
    setActiveTimer(prev => {
      const newTime = Math.max(0, prev.secondsRemaining + deltaSeconds);
      return {
        ...prev,
        secondsRemaining: newTime,
        initialDurationSeconds: Math.max(prev.initialDurationSeconds, newTime),
      };
    });
  };

  const finishCurrentTimerSession = async (notes?: string): Promise<{ sessionId?: string; durationMinutes: number }> => {
    const elapsedSeconds = Math.max(0, activeTimer.initialDurationSeconds - activeTimer.secondsRemaining);
    const minutes = Math.floor(elapsedSeconds / 60);
    
    let loggedId: string | undefined = undefined;
    // Only log if at least 1 minute was genuinely studied
    if (minutes >= 1 && (activeTimer.mode === 'pomodoro' || activeTimer.mode === 'custom' || activeTimer.mode === 'stopwatch')) {
      loggedId = await logFocusSession({
        durationMinutes: minutes,
        mode: activeTimer.mode,
        subjectId: activeTimer.subjectId,
        taskId: activeTimer.taskId,
        notes: notes || activeTimer.notes,
      });
    }

    setActiveTimer(prev => ({
      ...prev,
      isRunning: false,
      secondsRemaining: prev.initialDurationSeconds,
    }));

    return { sessionId: loggedId, durationMinutes: minutes };
  };

  // Calculated Dates & Ranges
  const now = new Date();
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

  // Total Study Time (all-time focus minutes)
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

  const completedTasksTodayCount = useMemo(() => {
    return tasks.filter(t => {
      if (t.status !== 'completed') return false;
      const compDate = t.completedAt ? t.completedAt.split('T')[0] : (t.updatedAt ? t.updatedAt.split('T')[0] : '');
      return compDate === todayStr;
    }).length;
  }, [tasks, todayStr]);

  const totalCompletedTasksCount = useMemo(() => {
    return tasks.filter(t => t.status === 'completed').length;
  }, [tasks]);

  const pendingTasksCount = useMemo(() => {
    return tasks.filter(t => t.status !== 'completed').length;
  }, [tasks]);

  const todayTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.dueDate) return true;
      return t.dueDate <= todayStr && t.status !== 'completed';
    }).sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    });
  }, [tasks, todayStr]);

  const upcomingTasks = useMemo(() => {
    return tasks.filter(t => {
      return t.dueDate && t.dueDate > todayStr && t.status !== 'completed';
    }).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [tasks, todayStr]);

  const recentSessions = useMemo(() => {
    return focusSessions.slice(0, 6);
  }, [focusSessions]);

  // Subject Study Time Breakdown with percentages
  const subjectStats = useMemo(() => {
    const totalMins = focusSessions
      .filter(s => s.mode === 'pomodoro' || s.mode === 'custom' || s.mode === 'stopwatch')
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    return subjects.map(subject => {
      const subjectSessions = focusSessions.filter(s => s.subjectId === subject.id);
      const minutes = subjectSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const count = tasks.filter(t => t.subjectId === subject.id).length;
      const percentage = totalMins > 0 ? Math.round((minutes / totalMins) * 100) : 0;

      return {
        subject,
        minutesStudied: minutes,
        sessionCount: subjectSessions.length,
        taskCount: count,
        percentage,
      };
    }).sort((a, b) => b.minutesStudied - a.minutesStudied);
  }, [subjects, focusSessions, tasks]);

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
        activeTimer,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        adjustTimerTime,
        finishCurrentTimerSession,
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

