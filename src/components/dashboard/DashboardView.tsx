import React, { useEffect } from 'react';
import { 
  Play, 
  Plus, 
  Flame, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  ArrowRight, 
  BookOpen, 
  TrendingUp, 
  Sparkles,
  Award,
  ChevronRight,
  Check,
  Tag,
  AlertCircle,
  Target,
  Zap,
  Trophy,
  ShieldCheck,
  MessageSquare,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { useGamification } from '../../context/GamificationContext';
import { BadgeIcon } from '../common/BadgeIcon';
import { ActiveTab, Priority } from '../../types';
import { MiniCalendar } from '../common/MiniCalendar';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSettings?: (tab?: 'profile' | 'themes' | 'goals' | 'notifications' | 'pomodoro' | 'account' | 'feedback') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, onOpenSettings }) => {
  const { userProfile } = useAuth();
  const { 
    subjects, 
    tasks, 
    todayStudyMinutes, 
    totalStudyMinutes,
    focusSessionsCompletedCount,
    completedTasksTodayCount,
    totalCompletedTasksCount,
    todayTasks, 
    upcomingTasks, 
    recentSessions,
    activeGoals,
    completedGoals,
    setIsGoalModalOpen,
    toggleTaskCompletion,
    startTimer,
    setIsTaskModalOpen,
    setSelectedTaskForEdit,
    setIsSubjectModalOpen,
    setSelectedSubjectForEdit,
    activeTimer,
    setIsTimerModalOpen
  } = useStudy();
  const {
    levelInfo,
    allBadges,
    unlockedBadgesCount,
    totalBadgesCount,
    setIsBadgesModalOpen,
    awardTaskCompletionXp,
    checkAllMilestones,
    checkAndAwardDailyBonus
  } = useGamification();

  const studentName = userProfile?.displayName || 'Student';
  const streakCount = userProfile?.streakCount || 1;
  const goalMinutes = userProfile?.dailyGoalMinutes || 120;
  const progressPercent = Math.min(100, Math.round((todayStudyMinutes / goalMinutes) * 100));

  // Automated milestone, streak bonus, and badge checking
  useEffect(() => {
    checkAllMilestones({
      totalSessions: focusSessionsCompletedCount,
      totalTasks: totalCompletedTasksCount,
      totalMinutes: totalStudyMinutes,
      streakCount: userProfile?.streakCount || 1,
      subjectCount: subjects.length,
      completedGoalsCount: completedGoals.length,
    });
  }, [
    checkAllMilestones,
    focusSessionsCompletedCount,
    totalCompletedTasksCount,
    totalStudyMinutes,
    userProfile?.streakCount,
    subjects.length,
    completedGoals.length
  ]);

  // Automated daily goal bonus check
  useEffect(() => {
    if (todayStudyMinutes > 0 && goalMinutes > 0) {
      checkAndAwardDailyBonus(todayStudyMinutes, goalMinutes);
    }
  }, [checkAndAwardDailyBonus, todayStudyMinutes, goalMinutes]);

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Handler to toggle task completion and award XP
  const handleToggleTask = (task: (typeof tasks)[0]) => {
    const isNowCompleting = task.status !== 'completed';
    toggleTaskCompletion(task.id);
    if (isNowCompleting) {
      awardTaskCompletionXp(task.id, task.priority);
    }
  };

  // Current formatted date
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  // Priority color styling helper
  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'low':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  // Find subject details by id
  const getSubjectById = (id?: string) => {
    return subjects.find(s => s.id === id);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in">
      {/* Top Banner / Hero Greeting */}
      <div 
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 sm:p-8 rounded-2xl border shadow-xs"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border-default)'
        }}
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold mb-1" style={{ color: 'var(--color-accent-primary)' }}>
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            {getGreeting()}, {studentName}! 👋
          </h1>
          <p className="text-sm mt-1 max-w-xl" style={{ color: 'var(--color-text-secondary)' }}>
            {progressPercent >= 100 
              ? '🎉 Outstanding! You reached your daily study goal. Keep pushing your limits or take a well-deserved break.'
              : `You're ${progressPercent}% toward today's study target. Ready to focus?`}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setSelectedTaskForEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs active:scale-95 touch-target hover:opacity-90"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
            aria-label="Quick Add Study Task"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Add Task</span>
          </button>

          <button
            onClick={() => {
              if (activeTimer.isRunning) {
                setIsTimerModalOpen(true);
              } else {
                startTimer('pomodoro', 25);
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 touch-target hover:opacity-90"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-accent-fg)'
            }}
            aria-label="Quick Start Focus Session"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Quick Start Focus</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Study Time */}
        <div 
          className="p-5 rounded-2xl border shadow-xs"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Today's Study Time</span>
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent-primary)'
              }}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
              {todayStudyMinutes}m
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              / {goalMinutes}m goal
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                backgroundColor: 'var(--color-accent-primary)',
                width: `${progressPercent}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{progressPercent}% accomplished</span>
            <span>{Math.max(0, goalMinutes - todayStudyMinutes)}m left</span>
          </div>
        </div>

        {/* Card 2: Current Streak */}
        <div 
          className="p-5 rounded-2xl border shadow-xs"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Current Study Streak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
              {streakCount} {streakCount === 1 ? 'Day' : 'Days'}
            </span>
          </div>
          <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            🔥 Daily habit on track! Complete a session today to keep it flaming.
          </p>
        </div>

        {/* Card 3: Today's Tasks */}
        <div 
          className="p-5 rounded-2xl border shadow-xs"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Today's Tasks Done</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
              {completedTasksTodayCount}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              / {todayTasks.length + completedTasksTodayCount} total today
            </span>
          </div>
          <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {todayTasks.length === 0 && completedTasksTodayCount > 0
              ? '✨ All planned tasks for today finished!'
              : `${todayTasks.length} pending tasks remaining today.`}
          </p>
        </div>

        {/* Card 4: Total Study Progress Overview */}
        <div 
          className="p-5 rounded-2xl border shadow-xs"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>All-Time Completed</span>
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent-primary)'
              }}
            >
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
              {totalCompletedTasksCount}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              tasks across {subjects.length} subjects
            </span>
          </div>
          <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {recentSessions.length} focus sessions logged overall.
          </p>
        </div>
      </div>

      {/* Gamification Scholar Level & Achievements Banner */}
      <div 
        className="p-5 sm:p-6 rounded-2xl border shadow-xs transition-all relative overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border-default)'
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Level Info & XP Bar */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                  style={{
                    backgroundColor: 'var(--color-accent-subtle)',
                    color: 'var(--color-accent-primary)'
                  }}
                >
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                      Level {levelInfo.level} • {levelInfo.title}
                    </h2>
                    <span 
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: 'var(--color-accent-subtle)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-accent-subtle-text)'
                      }}
                    >
                      {levelInfo.totalXp} XP Total
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {levelInfo.level >= 15
                      ? 'Maximum rank achieved! True Grandmaster Scholar.'
                      : `${levelInfo.xpRequiredForCurrentLevel - levelInfo.xpInCurrentLevel} XP needed to reach Level ${levelInfo.nextLevel} (${levelInfo.nextTitle})`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBadgesModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold hover:opacity-80 transition-all touch-target shrink-0"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>All Badges ({unlockedBadgesCount}/{totalBadgesCount})</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                <span>Level Progress</span>
                <span className="font-mono">{levelInfo.progressPercent}% ({levelInfo.xpInCurrentLevel} / {levelInfo.xpRequiredForCurrentLevel} XP)</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border-default)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-500 shadow-2xs"
                  style={{
                    width: `${levelInfo.progressPercent}%`,
                    backgroundColor: 'var(--color-accent-primary)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick Badges Showcase */}
          <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l md:pl-6 shrink-0 justify-between md:justify-start" style={{ borderColor: 'var(--color-border-default)' }}>
            <div className="flex items-center gap-2">
              {allBadges.slice(0, 6).map((badge) => (
                <div
                  key={badge.id}
                  onClick={() => setIsBadgesModalOpen(true)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 border ${
                    badge.isUnlocked
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600 opacity-60'
                  }`}
                  title={`${badge.title}: ${badge.description} (${badge.isUnlocked ? 'Unlocked' : `${badge.currentProgress}/${badge.targetValue}`})`}
                >
                  <BadgeIcon iconName={badge.iconName} className="w-5 h-5" />
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsBadgesModalOpen(true)}
              className="sm:hidden flex items-center gap-1 text-xs font-semibold text-[var(--color-accent-primary)]"
            >
              <span>View Badges</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Tasks Section (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Tasks */}
          <div 
            className="rounded-2xl border shadow-xs overflow-hidden"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <div 
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border-default)'
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Today's Priority Tasks</h3>
                <span 
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={{
                    backgroundColor: 'var(--color-accent-subtle)',
                    color: 'var(--color-accent-subtle-text)'
                  }}
                >
                  {todayTasks.length}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-80 touch-target"
                style={{ color: 'var(--color-accent-primary)' }}
                aria-label="View all study tasks"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 divide-y" style={{ borderColor: 'var(--color-border-default)' }}>
              {todayTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Clear for Today!</h4>
                  <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                    You have no outstanding tasks due today. Plan ahead or start a focus session.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedTaskForEdit(null);
                      setIsTaskModalOpen(true);
                    }}
                    className="mt-3 text-xs font-semibold hover:underline touch-target"
                    style={{ color: 'var(--color-accent-primary)' }}
                  >
                    + Add a new task
                  </button>
                </div>
              ) : (
                todayTasks.map((task) => {
                  const subject = getSubjectById(task.subjectId);
                  return (
                    <div
                      key={task.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="mt-0.5 transition-colors shrink-0 touch-target flex items-center justify-center"
                          style={{ color: 'var(--color-text-muted)' }}
                          aria-label={`Mark task ${task.title} complete`}
                        >
                          <Circle className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                          <button 
                            type="button"
                            onClick={() => {
                              setSelectedTaskForEdit(task);
                              setIsTaskModalOpen(true);
                            }}
                            className="text-xs sm:text-sm font-semibold text-left cursor-pointer transition-colors truncate block focus-visible:underline"
                            style={{ color: 'var(--color-text-primary)' }}
                            aria-label={`Edit task ${task.title}`}
                          >
                            {task.title}
                          </button>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {subject && (
                              <span 
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                                style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                                {subject.name}
                              </span>
                            )}
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.estimatedMinutes && (
                              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                                <Clock className="w-3 h-3" />
                                {task.estimatedMinutes}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick focus on this task */}
                      <button
                        onClick={() => startTimer('pomodoro', task.estimatedMinutes || 25, task.subjectId, task.id)}
                        title="Focus on this task"
                        className="p-2 rounded-xl transition-all shrink-0 touch-target flex items-center justify-center hover:opacity-80"
                        style={{
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent-primary)'
                        }}
                        aria-label={`Focus on task ${task.title}`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div 
            className="rounded-2xl border shadow-xs overflow-hidden"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <div 
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border-default)'
              }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Upcoming Tasks</h3>
                <span 
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  {upcomingTasks.length}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6 divide-y" style={{ borderColor: 'var(--color-border-default)' }}>
              {upcomingTasks.length === 0 ? (
                <p className="text-xs py-3 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  No upcoming scheduled tasks.
                </p>
              ) : (
                upcomingTasks.slice(0, 4).map((task) => {
                  const subject = getSubjectById(task.subjectId);
                  return (
                    <div key={task.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedTaskForEdit(task);
                            setIsTaskModalOpen(true);
                          }}
                          className="text-xs font-semibold text-left cursor-pointer truncate block focus-visible:underline"
                          style={{ color: 'var(--color-text-primary)' }}
                          aria-label={`Edit upcoming task ${task.title}`}
                        >
                          {task.title}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          {subject && (
                            <span 
                              className="text-[10px] font-medium"
                              style={{ color: subject.color }}
                            >
                              {subject.name}
                            </span>
                          )}
                          <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                            Due: {task.dueDate}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Focus & Progress (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Focus Card Banner */}
          <div 
            className="rounded-2xl p-6 shadow-md relative overflow-hidden border"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-accent-fg)',
              borderColor: 'var(--color-accent-primary)'
            }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 opacity-90">
                <Sparkles className="w-4 h-4" />
                <span>Deep Focus Session</span>
              </div>
              <h3 className="text-lg font-bold mb-1">
                Enter Flow State
              </h3>
              <p className="text-xs mb-4 opacity-90 leading-relaxed">
                Use the science-backed 25-minute Pomodoro method to eliminate distractions.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => startTimer('pomodoro', 25)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 touch-target bg-white text-slate-900 hover:bg-slate-100"
                  aria-label="Start 25 minute Pomodoro timer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>25m Pomodoro</span>
                </button>
                <button
                  onClick={() => startTimer('custom', 50)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all touch-target bg-black/20 hover:bg-black/30 text-white border-white/20"
                  aria-label="Start 50 minute deep focus timer"
                >
                  <span>50m Deep</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mini Calendar Schedule */}
          <MiniCalendar
            compact={true}
            showTaskDetails={true}
            className="shadow-xs"
          />

          {/* Recent Focus Sessions */}
          <div 
            className="rounded-2xl border shadow-xs overflow-hidden"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <div 
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border-default)'
              }}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Recent Focus Sessions</h3>
              </div>
              <button
                onClick={() => setActiveTab('focus')}
                className="text-xs font-semibold flex items-center gap-1 hover:opacity-80 touch-target"
                style={{ color: 'var(--color-accent-primary)' }}
                aria-label="View focus timer screen"
              >
                <span>Timer</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 divide-y" style={{ borderColor: 'var(--color-border-default)' }}>
              {recentSessions.length === 0 ? (
                <div className="text-center py-6 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  No focus sessions recorded yet today. Start your first session!
                </div>
              ) : (
                recentSessions.map((session) => {
                  const subject = getSubjectById(session.subjectId);
                  const timeStr = session.completedAt 
                    ? new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                  return (
                    <div key={session.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: subject?.color || 'var(--color-accent-primary)' }}
                        />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {subject ? subject.name : 'General Focus'}
                          </p>
                          <p className="text-[10px] capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                            {session.mode.replace('_', ' ')} • {timeStr}
                          </p>
                        </div>
                      </div>

                      <span 
                        className="text-xs font-bold font-mono px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent-primary)'
                        }}
                      >
                        +{session.durationMinutes} min
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Goals Section */}
          <div 
            className="rounded-2xl border shadow-xs p-6"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Study Goals</h3>
              </div>
              <button
                onClick={() => setActiveTab('goals')}
                className="text-xs font-semibold flex items-center gap-1 hover:opacity-80 touch-target"
                style={{ color: 'var(--color-accent-primary)' }}
                aria-label="View all goals"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeGoals.length === 0 ? (
              <div 
                className="text-center py-4 rounded-xl border border-dashed"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)'
                }}
              >
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>No active goals set.</p>
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="mt-1 text-xs font-bold hover:underline touch-target"
                  style={{ color: 'var(--color-accent-primary)' }}
                  aria-label="Create your first study goal"
                >
                  + Create your first goal
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGoals.slice(0, 3).map((goal) => {
                  const current = goal.currentValue || 0;
                  const target = goal.targetValue;
                  const percent = Math.min(100, Math.round((current / target) * 100));

                  return (
                    <div 
                      key={goal.id} 
                      className="p-3 rounded-xl border"
                      style={{
                        backgroundColor: 'var(--color-bg-subtle)',
                        borderColor: 'var(--color-border-default)'
                      }}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold truncate pr-2" style={{ color: 'var(--color-text-primary)' }}>
                          {goal.title}
                        </span>
                        <span className="font-mono font-bold text-[11px] shrink-0" style={{ color: 'var(--color-accent-primary)' }}>
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden mb-1" style={{ backgroundColor: 'var(--color-border-default)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            backgroundColor: 'var(--color-accent-primary)',
                            width: `${percent}%`
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                        <span>{current} / {target} {goal.unit}</span>
                        {goal.targetDate && <span>Due: {goal.targetDate}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subjects Progress Overview */}
          <div 
            className="rounded-2xl border shadow-xs p-6"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Subject Overview</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedSubjectForEdit(null);
                  setIsSubjectModalOpen(true);
                }}
                className="text-xs font-semibold hover:underline touch-target"
                style={{ color: 'var(--color-accent-primary)' }}
                aria-label="Add new subject"
              >
                + New Subject
              </button>
            </div>

            <div className="space-y-3">
              {subjects.map((sub) => {
                const subTasks = tasks.filter(t => t.subjectId === sub.id);
                const subDone = subTasks.filter(t => t.status === 'completed').length;
                return (
                  <div 
                    key={sub.id} 
                    className="p-3 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--color-bg-subtle)',
                      borderColor: 'var(--color-border-default)'
                    }}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                        {sub.name}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {subDone}/{subTasks.length} tasks done
                      </span>
                    </div>
                    {/* Tiny bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border-default)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: sub.color,
                          width: `${subTasks.length ? Math.round((subDone / subTasks.length) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Suggestion Box Banner on Dashboard */}
      <div 
        className="mt-6 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
            style={{
              backgroundColor: 'var(--color-accent-subtle)',
              color: 'var(--color-accent-subtle-text)'
            }}
          >
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Got an idea, feedback, or found a bug?
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Help us shape Focus Flow into the best study app. Drop your thoughts into our suggestion box anytime!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenSettings?.('feedback')}
          className="flex items-center justify-center gap-2 px-4 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs hover:opacity-90 active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
          style={{
            backgroundColor: 'var(--color-accent-primary)',
            color: 'var(--color-accent-fg)',
          }}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Open Suggestion Box</span>
        </button>
      </div>
    </div>
  );
};
