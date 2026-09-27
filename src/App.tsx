import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';
import { StudyProvider, useStudy } from './context/StudyContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { GamificationProvider, useGamification } from './context/GamificationContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AriaLiveProvider, useAriaAnnounce } from './components/common/AriaLiveAnnouncer';
import { AccessibilityShortcutsModal } from './components/common/AccessibilityShortcutsModal';
import { BadgesModal } from './components/common/BadgesModal';
import { LandingPage } from './components/landing/LandingPage';
import { AuthView } from './components/auth/AuthView';
import { StudyTimerPage } from './components/public/StudyTimerPage';
import { PomodoroTimerPage } from './components/public/PomodoroTimerPage';
import { StudyPlannerPage } from './components/public/StudyPlannerPage';
import { FocusTimerPage } from './components/public/FocusTimerPage';
import { PrivacyPolicyPage } from './components/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/legal/TermsOfServicePage';
import { ContactSupportPage } from './components/legal/ContactSupportPage';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { FocusTimerView } from './components/focus/FocusTimerView';
import { FocusTimerModal } from './components/focus/FocusTimerModal';
import { ZenModePromptModal } from './components/focus/ZenModePromptModal';
import { ZenFocusOverlay } from './components/focus/ZenFocusOverlay';
import { SubjectsView } from './components/subjects/SubjectsView';
import { GoalsView } from './components/goals/GoalsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { TaskModal } from './components/tasks/TaskModal';
import { SubjectModal } from './components/subjects/SubjectModal';
import { GoalModal } from './components/goals/GoalModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { ActiveTab } from './types';
import { TimerLogoSvg } from './components/common/BrandLogo';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | 'themes' | 'goals' | 'notifications' | 'pomodoro' | 'account' | 'feedback'>('profile');
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  const handleOpenSettings = (tab: 'profile' | 'themes' | 'goals' | 'notifications' | 'pomodoro' | 'account' | 'feedback' = 'profile') => {
    setSettingsInitialTab(tab);
    setIsSettingsModalOpen(true);
  };
  const [unauthView, setUnauthView] = useState<'landing' | 'auth'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Real browser URL pathname state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      return p && p !== '' ? p : '/';
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname || '/';
      setCurrentPath(p);
      if (p === '/login') {
        setAuthMode('login');
        setUnauthView('auth');
      } else if (p === '/signup') {
        setAuthMode('signup');
        setUnauthView('auth');
      } else if (p === '/') {
        setUnauthView('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-bounce mb-4">
          <TimerLogoSvg className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-base font-bold text-white tracking-tight">Focus Flow</h2>
        <p className="text-xs text-slate-400 mt-1">Preparing your student workspace...</p>
      </div>
    );
  }

  // Public Tool Pages Routing (Accessible to all users)
  if (currentPath === '/study-timer') {
    return (
      <StudyTimerPage
        onNavigate={handleNavigate}
        onGetStarted={() => {
          setAuthMode('signup');
          setUnauthView('auth');
          handleNavigate('/signup');
        }}
        onLogin={() => {
          setAuthMode('login');
          setUnauthView('auth');
          handleNavigate('/login');
        }}
      />
    );
  }

  if (currentPath === '/pomodoro-timer') {
    return (
      <PomodoroTimerPage
        onNavigate={handleNavigate}
        onGetStarted={() => {
          setAuthMode('signup');
          setUnauthView('auth');
          handleNavigate('/signup');
        }}
        onLogin={() => {
          setAuthMode('login');
          setUnauthView('auth');
          handleNavigate('/login');
        }}
      />
    );
  }

  if (currentPath === '/study-planner') {
    return (
      <StudyPlannerPage
        onNavigate={handleNavigate}
        onGetStarted={() => {
          setAuthMode('signup');
          setUnauthView('auth');
          handleNavigate('/signup');
        }}
        onLogin={() => {
          setAuthMode('login');
          setUnauthView('auth');
          handleNavigate('/login');
        }}
      />
    );
  }

  if (currentPath === '/focus-timer') {
    return (
      <FocusTimerPage
        onNavigate={handleNavigate}
        onGetStarted={() => {
          setAuthMode('signup');
          setUnauthView('auth');
          handleNavigate('/signup');
        }}
        onLogin={() => {
          setAuthMode('login');
          setUnauthView('auth');
          handleNavigate('/login');
        }}
      />
    );
  }

  if (currentPath === '/privacy') {
    return (
      <PrivacyPolicyPage
        onNavigate={handleNavigate}
        onGetStarted={() => {
          setAuthMode('signup');
          setUnauthView('auth');
          handleNavigate('/signup');
        }}
      />
    );
  }

  if (currentPath === '/terms') {
    return (
      <TermsOfServicePage
        onNavigate={handleNavigate}
        onGetStarted={() => {
          setAuthMode('signup');
          setUnauthView('auth');
          handleNavigate('/signup');
        }}
      />
    );
  }

  if (currentPath === '/contact' || currentPath === '/support') {
    return (
      <ContactSupportPage
        onNavigate={handleNavigate}
        onGetStarted={() => {
          setAuthMode('signup');
          setUnauthView('auth');
          handleNavigate('/signup');
        }}
      />
    );
  }

  if (!user) {
    if (unauthView === 'auth' || currentPath === '/login' || currentPath === '/signup') {
      return (
        <AuthView 
          initialMode={currentPath === '/signup' ? 'signup' : authMode}
          onBackToLanding={() => {
            setUnauthView('landing');
            handleNavigate('/');
          }}
        />
      );
    }

    return (
      <LandingPage
        onNavigate={handleNavigate}
        onGetStarted={() => {
          setAuthMode('signup');
          setUnauthView('auth');
          handleNavigate('/signup');
        }}
        onLogin={() => {
          setAuthMode('login');
          setUnauthView('auth');
          handleNavigate('/login');
        }}
      />
    );
  }

  return (
    <StudyProvider>
      <AuthenticatedWorkspace
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSettingsModalOpen={isSettingsModalOpen}
        onOpenSettings={handleOpenSettings}
        onCloseSettings={() => setIsSettingsModalOpen(false)}
        settingsInitialTab={settingsInitialTab}
        isShortcutsModalOpen={isShortcutsModalOpen}
        setIsShortcutsModalOpen={setIsShortcutsModalOpen}
      />
    </StudyProvider>
  );
};

interface AuthenticatedWorkspaceProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isSettingsModalOpen: boolean;
  onOpenSettings: (tab?: 'profile' | 'themes' | 'goals' | 'notifications' | 'pomodoro' | 'account' | 'feedback') => void;
  onCloseSettings: () => void;
  settingsInitialTab: 'profile' | 'themes' | 'goals' | 'notifications' | 'pomodoro' | 'account' | 'feedback';
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
}

const AuthenticatedWorkspace: React.FC<AuthenticatedWorkspaceProps> = ({
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
    focusSessions,
    tasks,
    goals,
    subjects,
    totalStudyMinutes,
    todayStudyMinutes
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

  const handleCloseOnboarding = async (completed: boolean) => {
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
    isBadgesModalOpen, 
    setIsBadgesModalOpen, 
    checkAllMilestones, 
    checkAndAwardDailyBonus 
  } = useGamification();
  const { announce } = useAriaAnnounce();

  // Keep milestones and achievements automatically checked and synchronized
  useEffect(() => {
    if (!userProfile) return;
    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
    const completedGoalsCount = goals.filter(g => g.status === 'completed').length;
    const streakCount = userProfile.streakCount || 1;
    const subjectCount = subjects.length;

    checkAllMilestones({
      totalSessions: focusSessions.length,
      totalTasks: completedTasksCount,
      totalMinutes: totalStudyMinutes,
      streakCount,
      subjectCount,
      completedGoalsCount,
    });

    if (userProfile.dailyGoalMinutes && todayStudyMinutes >= userProfile.dailyGoalMinutes) {
      checkAndAwardDailyBonus(todayStudyMinutes, userProfile.dailyGoalMinutes);
    }
  }, [
    focusSessions.length,
    tasks,
    goals,
    subjects.length,
    totalStudyMinutes,
    todayStudyMinutes,
    userProfile,
    checkAllMilestones,
    checkAndAwardDailyBonus
  ]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing shortcuts when user is typing into inputs or editable controls
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

      // Check key
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
        // Space or K toggles play/pause
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
    announce
  ]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 pb-20 md:pb-8" style={{ backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-primary)' }}>
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
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 focus:outline-none"
      >
        {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} onOpenSettings={onOpenSettings} />}
        {activeTab === 'tasks' && <TasksView />}
        {activeTab === 'focus' && <FocusTimerView />}
        {activeTab === 'subjects' && <SubjectsView />}
        {activeTab === 'goals' && <GoalsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      {/* Modals */}
      <ZenModePromptModal />
      <ZenFocusOverlay />

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

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={onCloseSettings}
        initialTab={settingsInitialTab}
        onReplayOnboarding={handleReplayOnboarding}
      />

      <AccessibilityShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <BadgesModal />

      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={handleCloseOnboarding}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isReplay={isOnboardingReplay}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <SoundProvider>
              <GamificationProvider>
                <AriaLiveProvider>
                  <MainAppContent />
                </AriaLiveProvider>
              </GamificationProvider>
            </SoundProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

