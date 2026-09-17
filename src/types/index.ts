export type ThemeMode = 'light' | 'dark' | 'calm' | 'ocean' | 'sakura' | 'cyber' | 'classic';

export type AmbientSoundType = 
  | 'none' 
  | 'rain' 
  | 'brown_noise' 
  | 'pink_noise' 
  | 'white_noise' 
  | 'cafe' 
  | 'binaural_alpha' 
  | 'forest_stream';

export interface SoundSettings {
  masterEnabled: boolean;
  volume: number; // 0 to 100
  sessionStartSound: boolean;
  breakStartSound: boolean;
  completionSound: boolean;
  ambientType: AmbientSoundType;
  ambientVolume: number; // 0 to 100
  ambientAutoPlayOnFocus: boolean;
}

export interface NotificationSettings {
  timerSound: boolean;
  breakSound: boolean;
  dailyReminder: boolean;
  reminderTime: string; // e.g. "18:00"
  streakAlerts: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  avatar?: string;
  theme?: ThemeMode;
  dailyGoalMinutes: number; // e.g. 120 (2 hours)
  streakCount: number;
  notificationSettings?: NotificationSettings;
  soundSettings?: SoundSettings;
  gamification?: import('./gamification').GamificationProfile;
  lastActiveDate?: string; // YYYY-MM-DD
  createdAt?: string;
  updatedAt?: string;
}

export * from './gamification';

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes?: number;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string; // Hex or Tailwind color token
  icon?: string;
  description?: string;
  targetHoursPerWeek?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type FocusMode = 'pomodoro' | 'short_break' | 'long_break' | 'stopwatch' | 'custom';

export interface FocusSession {
  id: string;
  userId: string;
  subjectId?: string;
  taskId?: string;
  durationMinutes: number;
  mode: FocusMode;
  notes?: string;
  completedAt?: string;
  createdAt?: string;
}

export type GoalStatus = 'active' | 'completed' | 'archived';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  subjectId?: string;
  targetDate?: string; // YYYY-MM-DD
  targetValue: number; // e.g. 20
  currentValue: number; // e.g. 5
  unit: string; // e.g. "hours", "tasks", "sessions", "chapters", "problems"
  status: GoalStatus;
  notes?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ActiveTab = 'dashboard' | 'tasks' | 'focus' | 'subjects' | 'analytics' | 'goals';
