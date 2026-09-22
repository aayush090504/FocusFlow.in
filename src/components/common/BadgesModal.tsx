import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Award, 
  Sparkles, 
  Zap, 
  Lock, 
  CheckCircle2, 
  TrendingUp, 
  Flame, 
  Target, 
  CheckSquare,
  Search,
  Filter
} from 'lucide-react';
import { useGamification, DisplayBadge } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { BadgeCategory } from '../../types/gamification';
import { STREAK_BONUSES } from '../../utils/gamification';
import { BadgeIcon } from './BadgeIcon';

type StatusFilter = 'all' | 'unlocked' | 'locked';

export const BadgesModal: React.FC = () => {
  const { userProfile } = useAuth();
  const { 
    isBadgesModalOpen, 
    setIsBadgesModalOpen, 
    allBadges, 
    levelInfo, 
    gamification,
    unlockedBadgesCount, 
    totalBadgesCount 
  } = useGamification();

  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const userStreak = userProfile?.streakCount || 1;
  const awardedStreakMilestones = gamification.awardedStreakMilestones || [];

  const categories: { id: BadgeCategory | 'all'; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: 'All Categories', icon: Trophy },
    { id: 'focus', label: 'Focus & Study', icon: Flame },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'streak', label: 'Streaks & Bonuses', icon: Zap },
    { id: 'levels', label: 'Scholar Levels', icon: TrendingUp },
    { id: 'goals', label: 'Goals', icon: Target },
  ];

  const filteredBadges = useMemo(() => {
    return allBadges.filter(b => {
      // Category filter
      if (selectedCategory !== 'all' && b.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'unlocked' && !b.isUnlocked) {
        return false;
      }
      if (statusFilter === 'locked' && b.isUnlocked) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(query);
        const matchDesc = b.description.toLowerCase().includes(query);
        const matchCategory = b.category.toLowerCase().includes(query);
        return matchTitle || matchDesc || matchCategory;
      }
      return true;
    });
  }, [allBadges, selectedCategory, statusFilter, searchQuery]);

  // Prevent dashboard background scrolling while the modal is open
  useEffect(() => {
    if (!isBadgesModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isBadgesModalOpen]);

  if (!isBadgesModalOpen) return null;

  const getRarityBadgeStyle = (rarity: string = 'common') => {
    switch (rarity) {
      case 'legendary':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'epic':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'rare':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="relative w-full max-w-7xl max-h-[96vh] h-[94vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border-default)',
          color: 'var(--color-text-primary)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="badges-modal-title"
      >
        {/* Modal Header */}
        <div 
          className="p-3.5 sm:p-4 lg:p-5 border-b relative overflow-hidden shrink-0 space-y-2.5 sm:space-y-3"
          style={{
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-subtle)'
          }}
        >
          {/* Top Row: Title, Close button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent-primary)',
                  color: 'var(--color-accent-fg)'
                }}
              >
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="badges-modal-title" className="text-base sm:text-xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                    Achievements & Scholar Progress
                  </h2>
                  <span 
                    className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: 'var(--color-accent-subtle)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-accent-subtle-text)'
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    1 XP / min Focus
                  </span>
                </div>
                <p className="hidden sm:block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Complete focus sessions, conquer tasks, build streaks, and unlock prestigious scholar milestones.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsBadgesModalOpen(false)}
              className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all hover:opacity-80 touch-target shrink-0"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)'
              }}
              aria-label="Close Achievements Modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Level Progress & Metrics Row */}
          <div 
            className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            {/* Level & Rank Badge */}
            <div className="md:col-span-4 flex items-center gap-2.5 sm:gap-3">
              <div 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm border shadow-xs shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-accent-subtle-text)'
                }}
              >
                L{levelInfo.level}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {levelInfo.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded-md border" style={{ backgroundColor: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-default)', color: 'var(--color-accent-primary)' }}>
                    {levelInfo.totalXp} Total XP
                  </span>
                  <span className="text-[10px] sm:text-[11px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    Streak: <strong className="text-amber-500 font-bold">{userStreak}d</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="md:col-span-5 space-y-1 border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-3" style={{ borderColor: 'var(--color-border-default)' }}>
              <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                <span>Progress to L{levelInfo.nextLevel} ({levelInfo.nextTitle})</span>
                <span className="font-mono font-bold" style={{ color: 'var(--color-accent-primary)' }}>
                  {levelInfo.progressPercent}% ({levelInfo.xpInCurrentLevel}/{levelInfo.xpRequiredForCurrentLevel} XP)
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border-default)' }}>
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${levelInfo.progressPercent}%`,
                    backgroundColor: 'var(--color-accent-primary)'
                  }}
                />
              </div>
            </div>

            {/* Unlocked badges metric count */}
            <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-3" style={{ borderColor: 'var(--color-border-default)' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-black block" style={{ color: 'var(--color-text-primary)' }}>
                    {unlockedBadgesCount} / {totalBadgesCount}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>Badges Unlocked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search, Status & Category Filters Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 pt-0.5">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
              {categories.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-target shrink-0"
                    style={{
                      backgroundColor: isSelected ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
                      color: isSelected ? 'var(--color-accent-fg)' : 'var(--color-text-secondary)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--color-accent-primary)' : 'var(--color-border-default)'
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Controls: Search and Status toggle */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search Input */}
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border text-xs"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-default)'
                }}
              >
                <Search className="w-3.5 h-3.5 opacity-50" />
                <input
                  type="text"
                  placeholder="Search badges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-hidden text-xs w-28 sm:w-36"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="opacity-50 hover:opacity-100 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div 
                className="flex items-center rounded-lg sm:rounded-xl border p-0.5 text-xs font-bold"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-default)'
                }}
              >
                {(['all', 'unlocked', 'locked'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg capitalize transition-all"
                    style={{
                      backgroundColor: statusFilter === status ? 'var(--color-accent-subtle)' : 'transparent',
                      color: statusFilter === status ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content View - Flexible full-height scrollable gallery */}
        <div className="flex-1 min-h-0 p-3.5 sm:p-5 lg:p-6 overflow-y-auto space-y-4 sm:space-y-6 overscroll-contain">
          {/* Streak Bonuses Showcase (shown on All or Streaks category) */}
          {(selectedCategory === 'all' || selectedCategory === 'streak') && !searchQuery && (
            <div 
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border-default)'
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      Milestone Streak Bonuses (One-Time Rewards)
                    </h3>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Current active streak: <strong className="text-amber-500 font-bold">{userStreak} {userStreak === 1 ? 'day' : 'days'}</strong>. Unlock massive XP boosts as you maintain consistency!
                    </p>
                  </div>
                </div>
              </div>

              {/* Streak Milestone Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {STREAK_BONUSES.map((bonus) => {
                  const isClaimed = awardedStreakMilestones.includes(bonus.streakDays) || userStreak >= bonus.streakDays;
                  return (
                    <div
                      key={bonus.streakDays}
                      className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                        isClaimed
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'opacity-70'
                      }`}
                      style={{
                        backgroundColor: isClaimed ? undefined : 'var(--color-bg-surface)',
                        borderColor: isClaimed ? undefined : 'var(--color-border-default)'
                      }}
                    >
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <Flame className={`w-3.5 h-3.5 ${isClaimed ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                        <span style={{ color: isClaimed ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                          {bonus.streakDays} {bonus.streakDays === 1 ? 'Day' : 'Days'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mt-1">
                        +{bonus.xpReward} XP
                      </span>
                      <span className="text-[10px] mt-1 font-medium line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {isClaimed ? '✓ Awarded' : 'Locked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Badges Count Header */}
          <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
            <span>Showing {filteredBadges.length} {filteredBadges.length === 1 ? 'badge' : 'badges'}</span>
            <span>{unlockedBadgesCount} / {totalBadgesCount} unlocked</span>
          </div>

          {/* Badges Grid View - 3 to 4 columns on large screens for maximum visibility with minimal scrolling */}
          {filteredBadges.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Filter className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                No badges found matching your search or filters.
              </p>
              <button
                onClick={() => { setSelectedCategory('all'); setStatusFilter('all'); setSearchQuery(''); }}
                className="text-xs font-bold text-[var(--color-accent-primary)] hover:underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredBadges.map(badge => {
                const isUnlocked = badge.isUnlocked;
                return (
                  <div 
                    key={badge.id}
                    className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isUnlocked 
                        ? 'shadow-xs hover:border-[var(--color-accent-primary)]' 
                        : 'opacity-75'
                    }`}
                    style={{
                      backgroundColor: isUnlocked ? 'var(--color-bg-surface)' : 'var(--color-bg-subtle)',
                      borderColor: isUnlocked ? 'var(--color-border-default)' : 'var(--color-border-default)'
                    }}
                  >
                    {/* Top Row: Icon, Rarity, and XP reward */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div 
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs shrink-0 transition-transform ${
                            isUnlocked ? 'scale-100' : 'grayscale opacity-75'
                          }`}
                          style={{
                            backgroundColor: isUnlocked ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                            borderColor: isUnlocked ? 'var(--color-border-default)' : 'var(--color-border-default)',
                            color: isUnlocked ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
                          }}
                        >
                          {isUnlocked ? (
                            <BadgeIcon iconName={badge.iconName} className="w-5 h-5" />
                          ) : (
                            <Lock className="w-4 h-4 opacity-60" />
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span 
                            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0"
                            style={{
                              backgroundColor: 'var(--color-bg-subtle)',
                              borderColor: 'var(--color-border-default)',
                              color: 'var(--color-accent-primary)'
                            }}
                          >
                            +{badge.xpReward} XP
                          </span>
                          <span 
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border capitalize ${getRarityBadgeStyle(badge.rarity)}`}
                          >
                            {badge.rarity || 'common'}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-sm font-bold line-clamp-1" style={{ color: isUnlocked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                        {badge.title}
                      </h3>
                      <p className="text-xs mt-1 leading-relaxed line-clamp-2 min-h-[2.5rem]" style={{ color: 'var(--color-text-secondary)' }}>
                        {badge.description}
                      </p>
                    </div>

                    {/* Progress & Unlock Status Footer */}
                    <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--color-border-default)' }}>
                      {/* Live progress bar for locked badges */}
                      {!isUnlocked ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            <span>Progress</span>
                            <span className="font-mono">{badge.currentProgress} / {badge.targetValue} {badge.unit} ({badge.progressPercent}%)</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border-default)' }}>
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${badge.progressPercent}%`,
                                backgroundColor: 'var(--color-accent-primary)'
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Unlocked</span>
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                            {badge.targetValue} {badge.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div 
          className="p-3 sm:p-3.5 px-4 sm:px-5 border-t flex items-center justify-between text-xs shrink-0"
          style={{
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-subtle)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="hidden sm:inline text-xs">1 XP awarded per minute of focus. All badges and XP are saved permanently.</span>
            <span className="sm:hidden text-xs">1 XP per min focus</span>
          </div>
          <button
            onClick={() => setIsBadgesModalOpen(false)}
            className="px-4 py-2 sm:px-5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xs touch-target"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-accent-fg)'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
