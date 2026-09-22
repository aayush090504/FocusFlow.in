import React, { useState } from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  BarChart3, 
  Flame, 
  Settings, 
  LogOut, 
  Play, 
  Plus, 
  Menu, 
  X,
  Target,
  Palette,
  Keyboard,
  Trophy,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useStudy } from '../../context/StudyContext';
import { useGamification } from '../../context/GamificationContext';
import { ActiveTab } from '../../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  onOpenShortcuts?: () => void;
}

const AVATAR_MAP: Record<string, { emoji: string; bg: string }> = {
  'avatar-1': { emoji: '🎓', bg: 'bg-indigo-600' },
  'avatar-2': { emoji: '🔬', bg: 'bg-emerald-600' },
  'avatar-3': { emoji: '🎨', bg: 'bg-rose-500' },
  'avatar-4': { emoji: '💻', bg: 'bg-cyan-600' },
  'avatar-5': { emoji: '📚', bg: 'bg-amber-600' },
  'avatar-6': { emoji: '🔭', bg: 'bg-violet-600' },
  'avatar-7': { emoji: '⚡', bg: 'bg-orange-600' },
  'avatar-8': { emoji: '🧘', bg: 'bg-teal-600' },
};

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenSettings, onOpenShortcuts }) => {
  const { userProfile, logout } = useAuth();
  const { theme, themeInfo } = useTheme();
  const { 
    todayStudyMinutes, 
    startTimer, 
    setIsTaskModalOpen,
    activeTimer,
    setIsTimerModalOpen
  } = useStudy();
  const {
    levelInfo,
    setIsBadgesModalOpen,
    unlockedBadgesCount,
    totalBadgesCount
  } = useGamification();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const goalMinutes = userProfile?.dailyGoalMinutes || 120;
  const goalPercentage = Math.min(100, Math.round((todayStudyMinutes / goalMinutes) * 100));
  const streakCount = userProfile?.streakCount || 1;
  const avatarKey = userProfile?.avatar || 'avatar-1';
  const avatarInfo = AVATAR_MAP[avatarKey] || AVATAR_MAP['avatar-1'];

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
    { id: 'tasks' as ActiveTab, label: 'Tasks', shortLabel: 'Tasks', icon: CheckSquare },
    { id: 'focus' as ActiveTab, label: 'Focus Timer', shortLabel: 'Focus', icon: Clock },
    { id: 'subjects' as ActiveTab, label: 'Subjects', shortLabel: 'Subjects', icon: BookOpen },
    { id: 'goals' as ActiveTab, label: 'Goals', shortLabel: 'Goals', icon: Target },
    { id: 'analytics' as ActiveTab, label: 'Progress', shortLabel: 'Stats', icon: BarChart3 },
  ];

  return (
    <header 
      role="banner"
      className="sticky top-0 z-40 backdrop-blur-md border-b transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-default)',
        color: 'var(--color-text-primary)'
      }}
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Left: Brand & Responsive Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 sm:gap-2.5 group text-left cursor-pointer focus-visible:ring-2 rounded-xl p-0.5 sm:p-1 shrink-0"
              aria-label="Focus Flow - Return to Dashboard"
            >
              <div 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent-primary)',
                  color: 'var(--color-accent-fg)'
                }}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-sm sm:text-base leading-none whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                    Focus Flow
                  </span>
                  <span 
                    className="hidden xl:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none"
                    style={{
                      backgroundColor: 'var(--color-accent-subtle)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-accent-subtle-text)'
                    }}
                  >
                    focusflow.in
                  </span>
                </div>
                <span className="hidden sm:block text-[10px] font-medium leading-none mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Student Study Workspace
                </span>
              </div>
            </button>

            {/* Desktop / Laptop Navigation Links */}
            <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 p-2 lg:px-2.5 lg:py-1.5 xl:px-3 xl:py-2 rounded-lg text-xs transition-all touch-target shrink-0 ${
                      isActive ? 'font-bold shadow-2xs' : 'font-semibold hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                      color: isActive ? 'var(--color-accent-subtle-text)' : 'var(--color-text-secondary)'
                    }}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? 'var(--color-accent-primary)' : 'inherit' }} />
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="hidden lg:inline xl:hidden">{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Quick actions, Streak, and User menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0 ml-auto">
            {/* Gamification Level & XP Chip (Hidden on mobile to avoid header crowding, visible on laptop/tablet/desktop) */}
            <button
              onClick={() => setIsBadgesModalOpen(true)}
              className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold transition-all hover:scale-105 active:scale-95 touch-target shrink-0"
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-accent-subtle-text)'
              }}
              title={`Level ${levelInfo.level}: ${levelInfo.title} (${levelInfo.totalXp} XP) - Click to view achievements`}
              aria-label={`Scholar Level ${levelInfo.level}, ${levelInfo.totalXp} total XP, ${levelInfo.progressPercent}% to next level. Open Achievements.`}
            >
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" style={{ color: 'var(--color-accent-primary)' }} />
              <span>Lvl {levelInfo.level}</span>
              <span className="hidden xl:inline opacity-75 font-mono text-[11px]">• {levelInfo.totalXp} XP</span>
            </button>

            {/* Streak Badge */}
            <div 
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold cursor-default shrink-0"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                color: '#f59e0b'
              }}
              title={`${streakCount} day study streak!`}
              aria-label={`${streakCount} day continuous study streak`}
            >
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 shrink-0" />
              <span>{streakCount}</span>
              <span className="hidden sm:inline">{streakCount === 1 ? ' day' : ' days'}</span>
              <span className="sm:hidden">d</span>
            </div>

            {/* Keyboard Shortcuts Trigger Button */}
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="hidden xl:flex items-center gap-1 p-2 rounded-xl border transition-all hover:opacity-90 touch-target"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)'
                }}
                title="Keyboard Shortcuts (?)"
                aria-label="View Keyboard Shortcuts"
              >
                <Keyboard className="w-4 h-4" />
                <kbd className="text-[10px] font-mono px-1 rounded bg-black/10 dark:bg-white/10">?</kbd>
              </button>
            )}

            {/* Quick Action Button: Focus Now */}
            <button
              onClick={() => {
                if (activeTimer.isRunning) {
                  setIsTimerModalOpen(true);
                } else {
                  startTimer('pomodoro', 25);
                }
              }}
              className="hidden xl:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 touch-target"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color: 'var(--color-accent-fg)'
              }}
              aria-label="Start Pomodoro Study Session"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Focus</span>
            </button>

            {/* User Profile Menu */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl border transition-all hover:opacity-90 touch-target"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)'
                }}
                aria-label="User Account Menu"
                aria-haspopup="true"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${avatarInfo.bg} text-white flex items-center justify-center text-xs sm:text-sm shadow-2xs shrink-0`}>
                  {avatarInfo.emoji}
                </div>
                <span className="inline-block text-xs font-bold max-w-[65px] xs:max-w-[85px] sm:max-w-[110px] truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {userProfile?.displayName?.split(' ')[0] || userProfile?.displayName || 'Student'}
                </span>
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileDropdownOpen(false)} 
                  />
                  <div 
                    className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border shadow-xl py-2 z-50 animate-fade-in"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)'
                    }}
                    role="menu"
                    aria-label="User profile options"
                  >
                    <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${avatarInfo.bg} text-white flex items-center justify-center text-base shrink-0 shadow-xs`}>
                          {avatarInfo.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">
                            {userProfile?.displayName || 'Student'}
                          </p>
                          <p className="text-[11px] truncate font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                            {userProfile?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Daily goal mini progress in menu */}
                    <div className="px-4 py-2.5 border-b" style={{ backgroundColor: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-default)' }}>
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
                          <span>Today's Target</span>
                        </span>
                        <span className="text-[var(--color-accent-primary)] font-bold">{todayStudyMinutes} / {goalMinutes}m</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border-default)' }}>
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${goalPercentage}%`,
                            backgroundColor: 'var(--color-accent-primary)' 
                          }}
                        />
                      </div>
                    </div>

                    {/* Gamification Level mini card in menu */}
                    <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                        <span className="flex items-center gap-1 font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Level {levelInfo.level} • {levelInfo.title}</span>
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                          {levelInfo.totalXp} XP
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border-default)' }}>
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${levelInfo.progressPercent}%`,
                            backgroundColor: '#f59e0b' 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        <span>{levelInfo.xpInCurrentLevel} / {levelInfo.xpRequiredForCurrentLevel} XP</span>
                        <span>{unlockedBadgesCount}/{totalBadgesCount} Badges</span>
                      </div>
                    </div>

                    {/* Active Theme Display */}
                    <div className="px-4 py-2 border-b flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--color-border-default)' }}>
                      <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                        <Palette className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
                        <span>Theme</span>
                      </span>
                      <span className="font-bold text-[var(--color-accent-primary)]">{themeInfo.name}</span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setIsBadgesModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold hover:opacity-80 transition-opacity text-left touch-target"
                        role="menuitem"
                      >
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>Achievements & Badges</span>
                      </button>

                      {onOpenShortcuts && (
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            onOpenShortcuts();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold hover:opacity-80 transition-opacity text-left touch-target"
                          role="menuitem"
                        >
                          <Keyboard className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                          <span>Keyboard Shortcuts</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onOpenSettings();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold hover:opacity-80 transition-opacity text-left touch-target"
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                        <span>Settings & Themes</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors text-left touch-target"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl transition-colors touch-target flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-text-primary)'
              }}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden border-t px-4 pt-3 pb-5 space-y-2"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-colors touch-target"
                style={{
                  backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                  color: isActive ? 'var(--color-accent-subtle-text)' : 'var(--color-text-secondary)'
                }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--color-accent-primary)' : 'inherit' }} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 border-t flex gap-2" style={{ borderColor: 'var(--color-border-default)' }}>
            <button
              onClick={() => {
                setIsTaskModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-bold touch-target"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)'
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
            <button
              onClick={() => {
                startTimer('pomodoro', 25);
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold shadow-xs touch-target"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color: 'var(--color-accent-fg)'
              }}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Focus</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
