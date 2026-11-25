import React, { Suspense, lazy, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';
import { ToastProvider } from './context/ToastContext';
import { GamificationProvider } from './context/GamificationContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AriaLiveProvider } from './components/common/AriaLiveAnnouncer';
import { LandingPage } from './components/landing/LandingPage';
import { ActiveTab } from './types';
import { TimerLogoSvg } from './components/common/BrandLogo';

// Route-level code splitting so public visitors only download what they visit
const AuthView = lazy(() =>
  import('./components/auth/AuthView').then((m) => ({ default: m.AuthView }))
);
const StudyTimerPage = lazy(() =>
  import('./components/public/StudyTimerPage').then((m) => ({ default: m.StudyTimerPage }))
);
const PomodoroTimerPage = lazy(() =>
  import('./components/public/PomodoroTimerPage').then((m) => ({ default: m.PomodoroTimerPage }))
);
const StudyPlannerPage = lazy(() =>
  import('./components/public/StudyPlannerPage').then((m) => ({ default: m.StudyPlannerPage }))
);
const FocusTimerPage = lazy(() =>
  import('./components/public/FocusTimerPage').then((m) => ({ default: m.FocusTimerPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import('./components/legal/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const TermsOfServicePage = lazy(() =>
  import('./components/legal/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage }))
);
const ContactSupportPage = lazy(() =>
  import('./components/legal/ContactSupportPage').then((m) => ({ default: m.ContactSupportPage }))
);
const NotFoundPage = lazy(() =>
  import('./components/public/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
const AuthenticatedWorkspace = lazy(() =>
  import('./components/layout/AuthenticatedWorkspace').then((m) => ({
    default: m.AuthenticatedWorkspace,
  }))
);

function normalizePathname(raw: string): string {
  if (!raw || raw === '/') return '/';
  const cleaned = raw.replace(/\/+$/, '');
  if (cleaned === '/support') return '/contact';
  return cleaned || '/';
}

function readSessionHint(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem('focusflow_session_hint') === '1';
  } catch {
    return false;
  }
}

const WorkspaceFallback: React.FC<{ message?: string }> = ({
  message = 'Preparing your student workspace...',
}) => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-bounce mb-4">
      <TimerLogoSvg className="w-6 h-6 text-white" />
    </div>
    <p className="text-base font-bold text-white tracking-tight">Focus Flow</p>
    <p className="text-xs text-slate-400 mt-1">{message}</p>
  </div>
);

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'profile' | 'themes' | 'goals' | 'notifications' | 'pomodoro' | 'account' | 'feedback'
  >('profile');
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [hasSessionHint] = useState<boolean>(readSessionHint);

  const handleOpenSettings = (
    tab: 'profile' | 'themes' | 'goals' | 'notifications' | 'pomodoro' | 'account' | 'feedback' = 'profile'
  ) => {
    setSettingsInitialTab(tab);
    setIsSettingsModalOpen(true);
  };
  const [unauthView, setUnauthView] = useState<'landing' | 'auth'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Real browser URL pathname state (normalized without trailing slash except root)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return normalizePathname(window.location.pathname);
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = normalizePathname(window.location.pathname || '/');
      setCurrentPath(p);
      if (p === '/login') {
        setAuthMode('login');
        setUnauthView('auth');
      } else if (p === '/signup') {
        setAuthMode('signup');
        setUnauthView('auth');
      } else if (p === '/reset-password') {
        setAuthMode('forgot');
        setUnauthView('auth');
      } else if (p === '/') {
        setUnauthView('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    const [rawPath, hashPart] = path.split('#');
    const normalized = normalizePathname(rawPath || '/');
    setCurrentPath(normalized);
    if (normalized === '/login') {
      setAuthMode('login');
      setUnauthView('auth');
    } else if (normalized === '/signup') {
      setAuthMode('signup');
      setUnauthView('auth');
    } else if (normalized === '/reset-password') {
      setAuthMode('forgot');
      setUnauthView('auth');
    } else if (normalized === '/') {
      setUnauthView('landing');
    }

    if (typeof window !== 'undefined') {
      const nextUrl = hashPart ? `${normalized}#${hashPart}` : normalized;
      window.history.pushState({}, '', nextUrl);
      if (hashPart) {
        requestAnimationFrame(() => {
          const el = document.getElementById(hashPart);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleGetStarted = () => {
    setAuthMode('signup');
    setUnauthView('auth');
    handleNavigate('/signup');
  };

  const handleLogin = () => {
    setAuthMode('login');
    setUnauthView('auth');
    handleNavigate('/login');
  };

  // Public Tool & Legal Pages Routing (Render immediately without blocking on Firebase Auth)
  if (currentPath === '/study-timer') {
    return (
      <Suspense fallback={<WorkspaceFallback message="Loading study timer..." />}>
        <StudyTimerPage
          onNavigate={handleNavigate}
          onGetStarted={handleGetStarted}
          onLogin={handleLogin}
        />
      </Suspense>
    );
  }

  if (currentPath === '/pomodoro-timer') {
    return (
      <Suspense fallback={<WorkspaceFallback message="Loading Pomodoro timer..." />}>
        <PomodoroTimerPage
          onNavigate={handleNavigate}
          onGetStarted={handleGetStarted}
          onLogin={handleLogin}
        />
      </Suspense>
    );
  }

  if (currentPath === '/study-planner') {
    return (
      <Suspense fallback={<WorkspaceFallback message="Loading study planner..." />}>
        <StudyPlannerPage
          onNavigate={handleNavigate}
          onGetStarted={handleGetStarted}
          onLogin={handleLogin}
        />
      </Suspense>
    );
  }

  if (currentPath === '/focus-timer') {
    return (
      <Suspense fallback={<WorkspaceFallback message="Loading focus timer..." />}>
        <FocusTimerPage
          onNavigate={handleNavigate}
          onGetStarted={handleGetStarted}
          onLogin={handleLogin}
        />
      </Suspense>
    );
  }

  if (currentPath === '/privacy') {
    return (
      <Suspense fallback={<WorkspaceFallback message="Loading privacy policy..." />}>
        <PrivacyPolicyPage
          onNavigate={handleNavigate}
          onGetStarted={handleGetStarted}
        />
      </Suspense>
    );
  }

  if (currentPath === '/terms') {
    return (
      <Suspense fallback={<WorkspaceFallback message="Loading terms of service..." />}>
        <TermsOfServicePage
          onNavigate={handleNavigate}
          onGetStarted={handleGetStarted}
        />
      </Suspense>
    );
  }

  if (currentPath === '/contact') {
    return (
      <Suspense fallback={<WorkspaceFallback message="Loading support..." />}>
        <ContactSupportPage
          onNavigate={handleNavigate}
          onGetStarted={handleGetStarted}
        />
      </Suspense>
    );
  }

  // Show loading spinner ONLY when a returning authenticated session is expected
  if (loading && hasSessionHint) {
    return <WorkspaceFallback />;
  }

  if (!user) {
    if (
      unauthView === 'auth' ||
      currentPath === '/login' ||
      currentPath === '/signup' ||
      currentPath === '/reset-password'
    ) {
      const modeForPath =
        currentPath === '/signup'
          ? 'signup'
          : currentPath === '/reset-password'
          ? 'forgot'
          : authMode;
      return (
        <Suspense fallback={<WorkspaceFallback message="Loading sign in..." />}>
          <AuthView
            initialMode={modeForPath}
            onBackToLanding={() => {
              setUnauthView('landing');
              handleNavigate('/');
            }}
          />
        </Suspense>
      );
    }

    if (currentPath === '/') {
      return (
        <LandingPage
          onNavigate={handleNavigate}
          onGetStarted={handleGetStarted}
          onLogin={handleLogin}
        />
      );
    }

    // Any unknown route when unauthenticated renders a clean noindex 404 view
    return (
      <Suspense fallback={<WorkspaceFallback message="Loading..." />}>
        <NotFoundPage
          onNavigate={handleNavigate}
          onGetStarted={handleGetStarted}
          onLogin={handleLogin}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<WorkspaceFallback />}>
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
    </Suspense>
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
