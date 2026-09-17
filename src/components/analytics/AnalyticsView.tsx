import React, { useState } from 'react';
import { 
  BarChart3, 
  Clock, 
  Flame, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Award, 
  BookOpen, 
  PieChart, 
  Target, 
  ArrowUpRight, 
  Sparkles, 
  Info, 
  Timer, 
  ChevronDown,
  Zap,
  Trophy,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { useGamification } from '../../context/GamificationContext';
import { BadgeIcon } from '../common/BadgeIcon';

export const AnalyticsView: React.FC = () => {
  const { userProfile } = useAuth();
  const { 
    subjects, 
    tasks, 
    focusSessions, 
    goals, 
    totalStudyMinutes, 
    todayStudyMinutes, 
    weeklyStudyMinutes, 
    monthlyStudyMinutes, 
    focusSessionsCompletedCount, 
    totalCompletedTasksCount, 
    subjectStats, 
    weeklyDaysData, 
    activeGoals, 
    setIsGoalModalOpen, 
    startTimer 
  } = useStudy();

  const {
    levelInfo,
    allBadges,
    unlockedBadgesCount,
    totalBadgesCount,
    setIsBadgesModalOpen
  } = useGamification();

  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'weekly' | 'monthly' | 'today'>('all');
  const [selectedSubjectLogFilter, setSelectedSubjectLogFilter] = useState<string>('all');

  // Helper formatting for hours & minutes
  const formatTime = (minutes: number) => {
    if (!minutes || minutes <= 0) return { hours: 0, mins: 0, text: '0m' };
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return { hours: 0, mins: m, text: `${m}m` };
    if (m === 0) return { hours: h, mins: 0, text: `${h}h` };
    return { hours: h, mins: m, text: `${h}h ${m}m` };
  };

  const totalTimeFormatted = formatTime(totalStudyMinutes);
  const todayTimeFormatted = formatTime(todayStudyMinutes);
  const weeklyTimeFormatted = formatTime(weeklyStudyMinutes);
  const monthlyTimeFormatted = formatTime(monthlyStudyMinutes);

  // Daily goal calculation
  const dailyTargetMinutes = userProfile?.dailyGoalMinutes || 120;
  const dailyProgressPercent = Math.min(100, Math.round((todayStudyMinutes / dailyTargetMinutes) * 100));
  const dailyMinutesRemaining = Math.max(0, dailyTargetMinutes - todayStudyMinutes);

  // Task Completion Rate
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((totalCompletedTasksCount / totalTasks) * 100) : 0;

  // Streak
  const streakCount = userProfile?.streakCount || 1;

  // Weekly max for chart scale
  const maxWeeklyMinutes = Math.max(60, ...weeklyDaysData.map(d => d.minutes));

  // Focus Modes Breakdown
  const pomodoroSessions = focusSessions.filter(s => s.mode === 'pomodoro').length;
  const customSessions = focusSessions.filter(s => s.mode === 'custom').length;
  const stopwatchSessions = focusSessions.filter(s => s.mode === 'stopwatch').length;

  // Filtered session history
  const filteredHistory = focusSessions.filter(s => {
    if (selectedSubjectLogFilter !== 'all' && s.subjectId !== selectedSubjectLogFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Study Progress & Statistics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time analytics on your study time, weekly consistency, course distribution, and goals.
          </p>
        </div>

        {/* Quick Study Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => startTimer('pomodoro', 25)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Log Focus Session</span>
          </button>
        </div>
      </div>

      {/* 9 Core Required Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Study Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Study Time</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {(totalStudyMinutes / 60).toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-semibold">hours</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {totalStudyMinutes > 0 ? `${totalStudyMinutes} total minutes all-time` : 'No study logged yet'}
          </p>
        </div>

        {/* 2. Today's Study Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Study Time</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {todayTimeFormatted.text}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Target: {dailyTargetMinutes}m ({dailyProgressPercent}% met)
          </p>
        </div>

        {/* 3. Weekly Study Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Study Time</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {weeklyTimeFormatted.text}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Current week (Mon - Today)
          </p>
        </div>

        {/* 4. Monthly Study Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Study Time</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {monthlyTimeFormatted.text}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            This month's total focus time
          </p>
        </div>
      </div>

      {/* Secondary Metrics Row: Streak, Daily Goal, Focus Sessions, Tasks Completed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 5. Current Streak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Streak</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-amber-600 font-mono">{streakCount}</span>
              <span className="text-xs text-slate-500 font-semibold">{streakCount === 1 ? 'day' : 'days'}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {streakCount > 0 ? 'Study every day to maintain momentum' : 'Start a session to ignite your streak'}
          </p>
        </div>

        {/* 6. Daily Goal Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Goal Progress</span>
              <span className="text-xs font-mono font-bold text-indigo-600">{dailyProgressPercent}%</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">{todayStudyMinutes}</span>
              <span className="text-xs text-slate-500">/ {dailyTargetMinutes} mins</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dailyProgressPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${dailyProgressPercent}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {dailyMinutesRemaining === 0 ? 'Daily target completed!' : `${dailyMinutesRemaining} mins remaining today`}
          </p>
        </div>

        {/* 7. Focus Sessions Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Focus Sessions</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">{focusSessionsCompletedCount}</span>
              <span className="text-xs text-slate-500 font-semibold">completed</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {pomodoroSessions} Pomodoros, {customSessions + stopwatchSessions} custom/stopwatch
          </p>
        </div>

        {/* 8. Tasks Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks Completed</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">{totalCompletedTasksCount}</span>
              <span className="text-xs text-slate-500 font-semibold">/ {totalTasks} total</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {taskCompletionRate}% task completion rate
          </p>
        </div>
      </div>

      {/* Visual Chart: Weekly Study Activity Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Weekly Daily Focus Distribution</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Minutes studied each day of the current week (Monday through Sunday).
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" /> Study Minutes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-200" /> Today
            </span>
          </div>
        </div>

        {/* Weekly Chart Bars */}
        {weeklyStudyMinutes === 0 && (
          <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              No focus sessions recorded yet for this week. Start a focus session today to see your bar chart populate!
            </span>
          </div>
        )}

        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-52 pt-6 pb-2 border-b border-slate-100">
          {weeklyDaysData.map((dayData) => {
            const heightPercent = maxWeeklyMinutes > 0 
              ? Math.max(dayData.minutes > 0 ? 8 : 2, Math.round((dayData.minutes / maxWeeklyMinutes) * 100))
              : 2;

            return (
              <div key={dayData.date} className="flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[11px] py-1 px-2 rounded-lg whitespace-nowrap z-10 shadow-md">
                  <p className="font-bold">{dayData.day} ({dayData.date})</p>
                  <p className="text-indigo-300 font-mono">{dayData.minutes} mins studied</p>
                  {dayData.tasksCompleted > 0 && (
                    <p className="text-emerald-300">{dayData.tasksCompleted} tasks done</p>
                  )}
                </div>

                {/* Minute label on top of bar */}
                {dayData.minutes > 0 && (
                  <span className="text-[10px] font-mono font-bold text-slate-600 mb-1">
                    {dayData.minutes}m
                  </span>
                )}

                {/* Bar */}
                <div 
                  className={`w-full max-w-[48px] rounded-t-xl transition-all duration-500 ${
                    dayData.isToday 
                      ? 'bg-gradient-to-t from-indigo-600 to-violet-500 shadow-sm shadow-indigo-500/20' 
                      : dayData.minutes > 0 
                        ? 'bg-indigo-400/80 hover:bg-indigo-500' 
                        : 'bg-slate-100'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Day label */}
                <div className="mt-2 text-center">
                  <span className={`text-xs font-bold block ${dayData.isToday ? 'text-indigo-600' : 'text-slate-600'}`}>
                    {dayData.day}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {dayData.date.slice(8)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Study-Time Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Subject Study-Time Breakdown
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold font-mono">
            {totalStudyMinutes} Total Focus Minutes Recorded
          </span>
        </div>

        {totalStudyMinutes === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium">No study sessions logged for subjects yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Use the Focus Timer and tag your course to see automatic time breakdown charts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subjectStats.map(({ subject, minutesStudied, sessionCount, taskCount, percentage }) => {
              const hours = (minutesStudied / 60).toFixed(1);

              return (
                <div key={subject.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                      <span>{subject.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <span className="font-mono text-slate-500">
                        {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
                      </span>
                      <span className="font-mono font-semibold text-slate-800">
                        {hours} hrs ({minutesStudied}m)
                      </span>
                      <span className="font-bold text-slate-900 min-w-[35px] text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        backgroundColor: subject.color,
                        width: `${percentage}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Study Goals Section in Analytics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Study Goals Progress</h2>
          </div>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
          >
            <span>+ Add Goal</span>
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
            <p className="text-xs text-slate-500">No active study goals created yet.</p>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
            >
              Create First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.slice(0, 4).map((g) => {
              const current = g.currentValue || 0;
              const target = g.targetValue;
              const percent = Math.min(100, Math.round((current / target) * 100));
              const isCompleted = g.status === 'completed';

              return (
                <div key={g.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {g.title}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{current} / {target} {g.unit}</span>
                    {g.targetDate && <span>Target: {g.targetDate}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gamification Mastery & Badges Hub */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Scholar Mastery & Achievements</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                  Level {levelInfo.level} ({levelInfo.title})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Earn experience points (XP) and unlock milestone badges by completing focus sessions, finishing tasks, and keeping study streaks.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsBadgesModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-xs self-start sm:self-auto touch-target"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Open Badges Gallery ({unlockedBadgesCount}/{totalBadgesCount})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* XP Progress & Level Meter */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Level Progression</span>
            <span className="font-mono text-slate-500">{levelInfo.progressPercent}% ({levelInfo.xpInCurrentLevel} / {levelInfo.xpRequiredForCurrentLevel} XP)</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Total XP: {levelInfo.totalXp} XP</span>
            <span>Next Rank: Level {levelInfo.nextLevel} ({levelInfo.nextTitle})</span>
          </div>
        </div>

        {/* Badges Grid Showcase */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Milestone Badges ({unlockedBadgesCount} of {totalBadgesCount} unlocked)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allBadges.map((badge) => (
              <div
                key={badge.id}
                onClick={() => setIsBadgesModalOpen(true)}
                className={`p-3.5 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all hover:scale-102 ${
                  badge.isUnlocked
                    ? 'bg-amber-50/40 border-amber-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200/80 opacity-60'
                }`}
              >
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-xs ${
                    badge.isUnlocked
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <BadgeIcon iconName={badge.iconName} className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-900 line-clamp-1">{badge.title}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{badge.category}</span>
                <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${badge.isUnlocked ? 'bg-amber-500' : 'bg-slate-400'}`}
                    style={{ width: `${Math.min(100, Math.round((badge.currentProgress / badge.targetValue) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Focus Sessions Detailed Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Recorded Focus Session Log</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Filter Subject:</span>
            <select
              value={selectedSubjectLogFilter}
              onChange={(e) => setSelectedSubjectLogFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Focus Mode</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Completed Date</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No focus sessions found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredHistory.slice(0, 15).map((session) => {
                  const sub = subjects.find(s => s.id === session.subjectId);
                  const dateFormatted = session.completedAt 
                    ? new Date(session.completedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                    : '-';

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-semibold">
                        {sub ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                            <span>{sub.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">General Focus</span>
                        )}
                      </td>
                      <td className="px-6 py-3 capitalize text-slate-600">
                        {session.mode.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-3 font-mono font-bold text-slate-900">
                        {session.durationMinutes} mins
                      </td>
                      <td className="px-6 py-3 text-slate-500 font-mono">
                        {dateFormatted}
                      </td>
                      <td className="px-6 py-3 text-slate-500 max-w-xs truncate">
                        {session.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
