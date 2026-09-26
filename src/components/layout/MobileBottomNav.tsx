import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  BarChart3, 
  Target, 
  Plus, 
  Play, 
  X,
  Flame,
  Settings,
  MessageSquare
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useStudy } from '../../context/StudyContext';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSettings: (tab?: 'profile' | 'themes' | 'goals' | 'notifications' | 'pomodoro' | 'account' | 'feedback') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings
}) => {
  const { 
    activeTimer, 
    setIsTimerModalOpen, 
    startTimer,
    setIsTaskModalOpen,
    setSelectedTaskForEdit,
    setIsSubjectModalOpen,
    setSelectedSubjectForEdit,
    setIsGoalModalOpen,
    setSelectedGoalForEdit,
    tasks
  } = useStudy();

  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;
  const isTimerRunning = activeTimer.isRunning;

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsQuickActionOpen(false);
  };

  return (
    <>
      {/* Quick Action Drawer / Sheet Overlay on Mobile */}
      {isQuickActionOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={() => setIsQuickActionOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Quick Action Menu"
        >
          <div 
            className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-4 border shadow-2xl space-y-2 animate-slide-up"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Quick Actions</span>
              <button 
                onClick={() => setIsQuickActionOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target flex items-center justify-center"
                aria-label="Close Quick Actions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedTaskForEdit(null);
                  setIsTaskModalOpen(true);
                  setIsQuickActionOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">New Task</div>
                  <div className="text-[10px] text-slate-400 font-normal">Assignment / Exam</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (activeTimer.isRunning) {
                    setIsTimerModalOpen(true);
                  } else {
                    startTimer('pomodoro', 25);
                  }
                  setIsQuickActionOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <div className="font-bold">Pomodoro</div>
                  <div className="text-[10px] text-slate-400 font-normal">25m Study Sprint</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedSubjectForEdit(null);
                  setIsSubjectModalOpen(true);
                  setIsQuickActionOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">New Course</div>
                  <div className="text-[10px] text-slate-400 font-normal">Subject & Budget</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedGoalForEdit(null);
                  setIsGoalModalOpen(true);
                  setIsQuickActionOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold">Set Goal</div>
                  <div className="text-[10px] text-slate-400 font-normal">Target & Milestone</div>
                </div>
              </button>
            </div>

            {/* Quick Action Suggestion Box Button */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
              <button
                type="button"
                onClick={() => {
                  setIsQuickActionOpen(false);
                  onOpenSettings('feedback');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-accent-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-accent-subtle-text)'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" 
                    style={{ 
                      backgroundColor: 'var(--color-accent-primary)', 
                      color: 'var(--color-accent-fg)' 
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Suggestion Box & Feedback</div>
                    <div className="text-[10px] opacity-75 font-normal">Report bugs or suggest features</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold underline">Open</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar on Mobile */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t backdrop-blur-md transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border-default)',
          color: 'var(--color-text-primary)'
        }}
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
          {/* 1. Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-all ${
              activeTab === 'dashboard' ? 'font-bold' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'dashboard' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
            }}
            aria-label="Dashboard"
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Home</span>
          </button>

          {/* 2. Tasks */}
          <button
            onClick={() => handleNavClick('tasks')}
            className={`flex flex-col items-center justify-center flex-1 h-full touch-target relative transition-all ${
              activeTab === 'tasks' ? 'font-bold' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'tasks' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
            }}
            aria-label={`Tasks (${pendingTasksCount} pending)`}
            aria-current={activeTab === 'tasks' ? 'page' : undefined}
          >
            <div className="relative">
              <CheckSquare className="w-5 h-5 mb-0.5" />
              {pendingTasksCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingTasksCount > 9 ? '9+' : pendingTasksCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight">Tasks</span>
          </button>

          {/* 3. Central Quick Action Trigger (+) */}
          <div className="flex-1 flex justify-center items-center">
            <button
              onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
              className="w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-white transition-transform active:scale-90"
              style={{
                backgroundColor: 'var(--color-accent-primary)'
              }}
              aria-label="Quick Action Menu"
              aria-expanded={isQuickActionOpen}
            >
              <Plus className={`w-6 h-6 transition-transform duration-200 ${isQuickActionOpen ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {/* 4. Focus Timer */}
          <button
            onClick={() => handleNavClick('focus')}
            className={`flex flex-col items-center justify-center flex-1 h-full touch-target relative transition-all ${
              activeTab === 'focus' ? 'font-bold' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'focus' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
            }}
            aria-label="Focus Timer"
            aria-current={activeTab === 'focus' ? 'page' : undefined}
          >
            <div className="relative">
              <Clock className="w-5 h-5 mb-0.5" />
              {isTimerRunning && (
                <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
            <span className="text-[10px] leading-tight">
              {isTimerRunning ? 'Active' : 'Focus'}
            </span>
          </button>

          {/* 5. Subjects */}
          <button
            onClick={() => handleNavClick('subjects')}
            className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-all ${
              activeTab === 'subjects' ? 'font-bold' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'subjects' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
            }}
            aria-label="Subjects and Courses"
            aria-current={activeTab === 'subjects' ? 'page' : undefined}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Subjects</span>
          </button>

          {/* 6. Goals & Progress */}
          <button
            onClick={() => handleNavClick('analytics')}
            className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-all ${
              activeTab === 'analytics' || activeTab === 'goals' ? 'font-bold' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              color: (activeTab === 'analytics' || activeTab === 'goals') ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
            }}
            aria-label="Analytics and Goals"
            aria-current={activeTab === 'analytics' ? 'page' : undefined}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Stats</span>
          </button>
        </div>
      </nav>
    </>
  );
};
