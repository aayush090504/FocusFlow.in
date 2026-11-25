import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudyProvider, useStudy } from '../../context/StudyContext';
import { useGamification } from '../../context/GamificationContext';
import { useAriaAnnounce } from '../common/AriaLiveAnnouncer';
import { SEOHead } from '../seo/SEOHead';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';
import { DashboardView } from '../dashboard/DashboardView';
import { TasksView } from '../tasks/TasksView';
import { FocusTimerView } from '../focus/FocusTimerView';
import { SubjectsView } from '../subjects/SubjectsView';
import { GoalsView } from '../goals/GoalsView';
import { FocusTimerModal } from '../focus/FocusTimerModal';
import { ZenModePromptModal } from '../focus/ZenModePromptModal';
import { TaskModal } from '../tasks/TaskModal';
import { SubjectModal } from '../subjects/SubjectModal';
import { GoalModal } from '../goals/GoalModal';
import { ActiveTab } from '../../types';

const AnalyticsView = lazy(() =>
  import('../analytics/AnalyticsView').then((m) => ({ default: m.AnalyticsView }))
);
const ZenFocusOverlay = lazy(() =>
  import('../focus/ZenFocusOverlay').then((m) => ({ default: m.ZenFocusOverlay }))
);
const SettingsModal = lazy(() =>
  import('../settings/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);
const AccessibilityShortcutsModal = lazy(() =>
  import('../common/AccessibilityShortcutsModal').then((m) => ({
    default: m.AccessibilityShortcutsModal,
  }))
);
const BadgesModal = lazy(() =>
  import('../common/BadgesModal').then((m) => ({ default: m.BadgesModal }))
);
const OnboardingModal = lazy(() =>
  import('../onboarding/OnboardingModal').then((m) => ({ default: m.OnboardingModal }))
);

const TAB_TITLES: Record<ActiveTab, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  focus: 'Focus Timer',
  subjects: 'Subjects',
  goals: 'Goals',
  analytics: 'Analytics & Progress',
};

export interface AuthenticatedWorkspaceProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isSettingsModalOpen: boolean;
  onOpenSettings: (
    tab?: 'profile' | 'themes' | 'goals' | 'notifications' | 'pomodoro' | 'account' | 'feedback'
  ) => void;
  onCloseSettings: () => void;
  settingsInitialTab:
    | 'profile'
    | 'themes'
    | 'goals'
    | 'notifications'
    | 'pomodoro'
    | 'account'
    | 'feedback';
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
}

const AuthenticatedWorkspaceInner: React.FC<AuthenticatedWorkspaceProps> = ({
  activeTab,
  setActiveTab,
  isSettingsModalOpen,
  onOpenSettings,
  onCloseSettings,
  settingsInitialTab,
  isShortcutsModalOpen,
  setIsShortcutsModalOpen,
}) => {
  const {
    isTimerModalOpen,
    setIsTimerModalOpen,
    isTaskModalOpen,
    setIsTaskModalOpen,
    isSubjectModalOpen,
    setIsSubjectModalOpen,
    isGoalModalOpen,
    setIsGoalModalOpen,
    selectedGoalForEdit,
    activeTimer,
    pauseTimer,
    resumeTimer,
    startTimer,
    resetTimer,
    focusSessionsCompletedCount,
    totalCompletedTasksCount,
    goals,
    studiedSubjectCount,
    totalStudyMinutes,
    todayStudyMinutes,
  } = useStudy();

  const { userProfile, completeOnboarding } = useAuth();
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isOnboardingReplay, setIsOnboardingReplay] = useState(false);
  const [hasDismissedOnboardingLocally, setHasDismissedOnboardingLocally] = useState(false);

  // Automatically trigger first-time onboarding for newly created accounts (hasCompletedOnboarding === false)
  useEffect(() => {
    if (userProfile && userProfile.hasCompletedOnboarding === false && !hasDismissedOnboardingLocally) {
      setIsOnboardingReplay(false);
      setIsOnboardingModalOpen(true);
    }
  }, [userProfile, hasDismissedOnboardingLocally]);

  const handleCloseOnboarding = async (_completed: boolean) => {
    setIsOnboardingModalOpen(false);
    setHasDismissedOnboardingLocally(true);
    if (!isOnboardingReplay) {
      await completeOnboarding();
    }
  };

  const handleReplayOnboarding = () => {
    setIsOnboardingReplay(true);
    setIsOnboardingModalOpen(true);
  };

  const {
    setIsBadgesModalOpen: _setIsBadgesModalOpen,
    checkAllMilestones,
    checkAndAwardDailyBonus,
  } = useGamification();
  const { announce } = useAriaAnnounce();

  // Keep milestones and achievements automatically checked and synchronized
  useEffect(() => {
    if (!userProfile) return;
    let cancelled = false;
    const completedGoalsCount = goals.filter((g) => g.status === 'completed').length;
    const streakCount = userProfile.streakCount ?? 0;

    const syncMilestones = async () => {
      await checkAllMilestones({
        totalSessions: focusSessionsCompletedCount,
        totalTasks: totalCompletedTasksCount,
        totalMinutes: totalStudyMinutes,
        streakCount,
        subjectCount: studiedSubjectCount,
        completedGoalsCount,
      });

      if (!cancelled && userProfile.dailyGoalMinutes && todayStudyMinutes >= userProfile.dailyGoalMinutes) {
        await checkAndAwardDailyBonus(todayStudyMinutes, userProfile.dailyGoalMinutes);
      }
    };

    void syncMilestones();
    return () => {
      cancelled = true;
    };
  }, [
    focusSessionsCompletedCount,
    totalCompletedTasksCount,
    goals,
    studiedSubjectCount,
    totalStudyMinutes,
    todayStudyMinutes,
    userProfile,
    checkAllMilestones,
    checkAndAwardDailyBonus,
  ]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsTaskModalOpen(true);
        announce('Opened task creator');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setIsSubjectModalOpen(true);
        announce('Opened subject creator');
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setIsGoalModalOpen(true);
        announce('Opened goal creator');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetTimer();
        announce('Timer reset');
      } else if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (activeTimer.isRunning) {
          pauseTimer();
          announce('Focus timer paused');
        } else {
          if (activeTimer.secondsRemaining > 0) {
            resumeTimer();
            announce('Focus timer resumed');
          } else {
            startTimer('pomodoro', 25);
            announce('Started 25 minute pomodoro');
          }
        }
      } else if (e.key === '1') {
        setActiveTab('dashboard');
        announce('Switched to Dashboard');
      } else if (e.key === '2') {
        setActiveTab('tasks');
        announce('Switched to Tasks');
      } else if (e.key === '3') {
        setActiveTab('focus');
        announce('Switched to Focus Timer');
      } else if (e.key === '4') {
        setActiveTab('subjects');
        announce('Switched to Subjects');
      } else if (e.key === '5') {
        setActiveTab('goals');
        announce('Switched to Goals');
      } else if (e.key === '6') {
        setActiveTab('analytics');
        announce('Switched to Analytics and Progress');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTimer,
    pauseTimer,
    resumeTimer,
    startTimer,
    resetTimer,
    setActiveTab,
    setIsTaskModalOpen,
    setIsSubjectModalOpen,
    setIsGoalModalOpen,
    setIsShortcutsModalOpen,
    announce,
  ]);

  // Lock background body scroll when any modal is open
  const isAnyModalActive =
    isTimerModalOpen ||
    isTaskModalOpen ||
    isSubjectModalOpen ||
    isGoalModalOpen ||
    isSettingsModalOpen ||
    isShortcutsModalOpen ||
    isOnboardingModalOpen;

  useEffect(() => {
    if (isAnyModalActive) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAnyModalActive]);

  const tabTitle = TAB_TITLES[activeTab] || 'Workspace';

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8"
      style={{ backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-primary)' }}
    >
      <SEOHead
        title={`${tabTitle} — Focus Flow Workspace`}
        description="Your private Focus Flow student study workspace."
        robots="noindex, nofollow"
        canonicalUrl="https://focusflow.in/"
      />

      {/* Skip to Main Content Link for Keyboard and Screen Reader Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={onOpenSettings}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onReplayOnboarding={handleReplayOnboarding}
      />

      {/* Main Container */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-2.5 xs:px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 focus:outline-none"
      >
        {activeTab === 'dashboard' && (
          <DashboardView setActiveTab={setActiveTab} onOpenSettings={onOpenSettings} />
        )}
        {activeTab === 'tasks' && <TasksView />}
        {activeTab === 'focus' && <FocusTimerView />}
        {activeTab === 'subjects' && <SubjectsView />}
        {activeTab === 'goals' && <GoalsView />}
        {activeTab === 'analytics' && (
          <Suspense
            fallback={
              <div className="py-16 text-center text-sm text-slate-400">
                Loading analytics...
              </div>
            }
          >
            <AnalyticsView />
          </Suspense>
        )}
      </main>

      {/* Modals & Overlays */}
      <ZenModePromptModal />
      <Suspense fallback={null}>
        <ZenFocusOverlay />
      </Suspense>

      <FocusTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goalToEdit={selectedGoalForEdit}
      />

      {isSettingsModalOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={onCloseSettings}
            initialTab={settingsInitialTab}
            onReplayOnboarding={handleReplayOnboarding}
          />
        </Suspense>
      )}

      {isShortcutsModalOpen && (
        <Suspense fallback={null}>
          <AccessibilityShortcutsModal
            isOpen={isShortcutsModalOpen}
            onClose={() => setIsShortcutsModalOpen(false)}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <BadgesModal />
      </Suspense>

      {isOnboardingModalOpen && (
        <Suspense fallback={null}>
          <OnboardingModal
            isOpen={isOnboardingModalOpen}
            onClose={handleCloseOnboarding}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isReplay={isOnboardingReplay}
          />
        </Suspense>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
};

export const AuthenticatedWorkspace: React.FC<AuthenticatedWorkspaceProps> = (props) => {
  return (
    <StudyProvider>
      <AuthenticatedWorkspaceInner {...props} />
    </StudyProvider>
  );
};
