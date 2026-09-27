import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  CheckSquare, 
  Calendar, 
  Clock, 
  BarChart3, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  Check, 
  Flame, 
  Volume2, 
  Compass,
  Play
} from 'lucide-react';
import { TimerLogoSvg } from '../common/BrandLogo';
import { ActiveTab } from '../../types';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: (completed: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isReplay?: boolean;
}

interface StepData {
  stepNumber: number;
  title: string;
  badge: string;
  targetTab: ActiveTab;
  tabLabel: string;
  description: string;
  keyPoints: string[];
  visualType: 'welcome' | 'subjects' | 'tasks' | 'plan' | 'focus' | 'track';
}

const STEPS: StepData[] = [
  {
    stepNumber: 1,
    title: 'Welcome to Focus Flow 👋',
    badge: 'Introduction',
    targetTab: 'dashboard',
    tabLabel: 'Dashboard',
    description:
      'Focus Flow is a personalized study workspace designed to help users plan, focus, and track their progress in one distraction-free environment.',
    keyPoints: [
      'Organize courses, deadlines, and daily targets together',
      'Boost retention with scientifically backed Pomodoro sessions',
      'Earn study streaks, experience points (XP), and achievement badges'
    ],
    visualType: 'welcome'
  },
  {
    stepNumber: 2,
    title: 'Start with your subjects 📚',
    badge: 'Workspace Foundation',
    targetTab: 'subjects',
    tabLabel: 'Subjects',
    description:
      'Create subjects and organize your study work around them. Color-code your courses, set weekly target hours, and categorize all assignments.',
    keyPoints: [
      'Define each course with custom colors and weekly study goals',
      'Categorize tasks and focus sessions under specific subjects',
      'Inspect subject-by-subject analytics to balance your workload'
    ],
    visualType: 'subjects'
  },
  {
    stepNumber: 3,
    title: 'Add your tasks ✅',
    badge: 'Task Management',
    targetTab: 'tasks',
    tabLabel: 'Tasks',
    description:
      'Create tasks, set priorities/deadlines, and keep track of what needs to be done. Break large projects into manageable steps.',
    keyPoints: [
      'Assign Low, Medium, or High priorities with due dates',
      'Filter by status (To Do, In Progress, Completed)',
      'Earn XP bonuses immediately upon completing tasks'
    ],
    visualType: 'tasks'
  },
  {
    stepNumber: 4,
    title: 'Plan your study time 🗓️',
    badge: 'Schedule & Calendar',
    targetTab: 'dashboard',
    tabLabel: 'Planner & Calendar',
    description:
      'Schedule tasks and organize your day using the planner/calendar. Maintain clarity on what to tackle morning, afternoon, and evening.',
    keyPoints: [
      'Interactive Mini-Calendar with visual task indicators',
      'Daily study hour targets that adapt to your schedule',
      'Keep overdue and upcoming deadlines organized at a glance'
    ],
    visualType: 'plan'
  },
  {
    stepNumber: 5,
    title: 'Time to focus 🎯',
    badge: 'Focus Mode',
    targetTab: 'focus',
    tabLabel: 'Focus Timer',
    description:
      'Focus Mode lets users start a focused study session, with Pomodoro/custom durations and optional sounds to eliminate distractions.',
    keyPoints: [
      'Standard 25/5m Pomodoro cycles, Short/Long breaks, or Stopwatch',
      'Built-in ambient soundscapes (Rain, Cafe, Binaural Alpha Beats)',
      'Distraction-free Fullscreen Zen Mode with ambient controls'
    ],
    visualType: 'focus'
  },
  {
    stepNumber: 6,
    title: 'Track your progress 📈',
    badge: 'Analytics & Rewards',
    targetTab: 'analytics',
    tabLabel: 'Progress & Stats',
    description:
      'Completed focus sessions, study time, streaks, XP, levels, and achievements help users see their progress over days and weeks.',
    keyPoints: [
      'Build your daily study streak by hitting your study goals',
      'Gain XP levels and unlock 15+ student achievement badges',
      'Detailed study charts broken down by subject and date range'
    ],
    visualType: 'track'
  }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  isReplay = false,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const totalSteps = STEPS.length;
  const currentStep = STEPS[currentStepIndex];

  // Reset to first step whenever opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setShowCompletionScreen(false);
    }
  }, [isOpen]);

  // Synchronize background tab preview when step changes so the user gets context
  useEffect(() => {
    if (isOpen && currentStep && !showCompletionScreen) {
      setActiveTab(currentStep.targetTab);
    }
  }, [isOpen, currentStepIndex, showCompletionScreen, setActiveTab]);

  // Keyboard navigation & accessibility handlers
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(false);
      } else if (e.key === 'ArrowRight') {
        if (!showCompletionScreen) {
          if (currentStepIndex < totalSteps - 1) {
            setCurrentStepIndex((prev) => prev + 1);
          } else {
            setShowCompletionScreen(true);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (showCompletionScreen) {
          setShowCompletionScreen(false);
        } else if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    },
    [isOpen, currentStepIndex, totalSteps, showCompletionScreen, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Set initial focus for accessibility
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen, currentStepIndex, showCompletionScreen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setShowCompletionScreen(true);
    }
  };

  const handleBack = () => {
    if (showCompletionScreen) {
      setShowCompletionScreen(false);
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose(false);
  };

  const handleCompleteAndStart = () => {
    setActiveTab('dashboard');
    onClose(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-all my-auto"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border-default)',
          color: 'var(--color-text-primary)',
        }}
      >
        {/* Top Header Bar */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-4 border-b shrink-0"
          style={{
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-surface-elevated, var(--color-bg-surface))',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color: 'var(--color-accent-fg)',
              }}
            >
              <TimerLogoSvg className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-primary)]">
                {isReplay ? 'Workspace Guide' : 'Quick Start Tour'}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] font-medium">
                {showCompletionScreen ? 'Ready to begin' : `Step ${currentStep.stepNumber} of ${totalSteps}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showCompletionScreen && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{
                  color: 'var(--color-text-muted)',
                }}
                aria-label="Skip onboarding tutorial"
              >
                Skip tutorial
              </button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleSkip}
              className="p-1.5 rounded-lg transition-colors hover:opacity-80 focus-visible:ring-2"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-subtle, transparent)',
              }}
              aria-label="Close tutorial dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Indicator Progress Bar */}
        <div
          className="w-full h-1 relative overflow-hidden"
          style={{ backgroundColor: 'var(--color-bg-subtle, rgba(148, 163, 184, 0.2))' }}
        >
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              width: showCompletionScreen
                ? '100%'
                : `${((currentStepIndex + 1) / totalSteps) * 100}%`,
            }}
          />
        </div>

        {/* Main Content Body */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
          {showCompletionScreen ? (
            /* FINAL STEP SCREEN: "You're ready to focus. 🚀" */
            <div className="text-center py-6 sm:py-8 space-y-5">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: 'var(--color-accent-primary)',
                  color: 'var(--color-accent-fg)',
                }}
              >
                <TimerLogoSvg className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h2
                  id="onboarding-title"
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  You&apos;re ready to focus. 🚀
                </h2>
                <p
                  id="onboarding-desc"
                  className="text-sm sm:text-base leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Your personalized workspace is primed for productive study. Plan your sessions, organize tasks, and track your daily streak.
                </p>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-lg mx-auto text-left">
                <div
                  className="p-3.5 rounded-xl border flex items-start gap-2.5"
                  style={{
                    backgroundColor: 'var(--color-bg-surface-elevated, var(--color-bg-surface))',
                    borderColor: 'var(--color-border-default)',
                  }}
                >
                  <BookOpen className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold">1. Courses</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">Organize your subjects</div>
                  </div>
                </div>

                <div
                  className="p-3.5 rounded-xl border flex items-start gap-2.5"
                  style={{
                    backgroundColor: 'var(--color-bg-surface-elevated, var(--color-bg-surface))',
                    borderColor: 'var(--color-border-default)',
                  }}
                >
                  <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold">2. Focus</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">25m Pomodoro sessions</div>
                  </div>
                </div>

                <div
                  className="p-3.5 rounded-xl border flex items-start gap-2.5"
                  style={{
                    backgroundColor: 'var(--color-bg-surface-elevated, var(--color-bg-surface))',
                    borderColor: 'var(--color-border-default)',
                  }}
                >
                  <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold">3. Streaks</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">Daily goals & badges</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors hover:opacity-80"
                  style={{
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'transparent',
                  }}
                  aria-label="Back to step 6"
                >
                  <ChevronLeft className="w-4 h-4 inline mr-1" />
                  Review Steps
                </button>
                <button
                  type="button"
                  onClick={handleCompleteAndStart}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl text-sm font-bold shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-accent-primary)',
                    color: 'var(--color-accent-fg)',
                  }}
                  aria-label="Get Started and enter Focus Flow workspace"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* STEP WALKTHROUGH */
            <div className="space-y-6">
              {/* Step Navigation Pill Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {STEPS.map((step, idx) => (
                    <button
                      key={step.stepNumber}
                      type="button"
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentStepIndex
                          ? 'w-7 bg-[var(--color-accent-primary)]'
                          : idx < currentStepIndex
                          ? 'w-2 bg-[var(--color-accent-primary)] opacity-50'
                          : 'w-2 bg-slate-300 dark:bg-slate-700'
                      }`}
                      aria-label={`Jump to step ${idx + 1}: ${step.title}`}
                    />
                  ))}
                </div>

                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                  style={{
                    backgroundColor: 'var(--color-accent-subtle, rgba(99, 102, 241, 0.1))',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-accent-primary)',
                  }}
                >
                  <Compass className="w-3 h-3" />
                  <span>Section: {currentStep.tabLabel}</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2
                  id="onboarding-title"
                  className="text-xl sm:text-2xl font-bold tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {currentStep.title}
                </h2>
                <p
                  id="onboarding-desc"
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {currentStep.description}
                </p>
              </div>

              {/* Visual Interactive Preview Card matching Focus Flow design system */}
              <div
                className="p-4 sm:p-5 rounded-xl border relative overflow-hidden transition-all shadow-2xs"
                style={{
                  backgroundColor: 'var(--color-bg-surface-elevated, var(--color-bg-surface))',
                  borderColor: 'var(--color-border-default)',
                }}
              >
                {/* Step 1 Visual: Unified Workspace Preview */}
                {currentStep.visualType === 'welcome' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-[var(--color-accent-primary)]">
                        <Sparkles className="w-3.5 h-3.5" />
                        Today&apos;s Focus Workspace
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                        Ready
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                        <div className="text-[10px] text-[var(--color-text-secondary)] font-medium">Daily Goal</div>
                        <div className="text-sm font-bold mt-0.5 text-indigo-600">120 mins</div>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                        <div className="text-[10px] text-[var(--color-text-secondary)] font-medium">Streak</div>
                        <div className="text-sm font-bold mt-0.5 text-amber-500">🔥 1 Day</div>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                        <div className="text-[10px] text-[var(--color-text-secondary)] font-medium">Pomodoro</div>
                        <div className="text-sm font-bold mt-0.5 text-emerald-600">25 min work</div>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                        <div className="text-[10px] text-[var(--color-text-secondary)] font-medium">Level</div>
                        <div className="text-sm font-bold mt-0.5 text-violet-600">Lvl 1 Novice</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 Visual: Subjects Preview */}
                {currentStep.visualType === 'subjects' && (
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-indigo-500">
                        <BookOpen className="w-3.5 h-3.5" /> Sample Course Catalog
                      </span>
                      <span className="text-[11px] text-[var(--color-text-secondary)]">Color-coded</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          <span className="text-xs font-bold">Mathematics</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] mt-1">Target: 6 hrs/week</div>
                      </div>
                      <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                          <span className="text-xs font-bold">Computer Science</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] mt-1">Target: 8 hrs/week</div>
                      </div>
                      <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                          <span className="text-xs font-bold">Literature & Arts</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] mt-1">Target: 4 hrs/week</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3 Visual: Tasks Preview */}
                {currentStep.visualType === 'tasks' && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <CheckSquare className="w-3.5 h-3.5" /> Organized Task Queue
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                        +25 XP per task
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border border-slate-400 flex items-center justify-center text-emerald-600">
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="font-semibold">Review Chapter 4 Calculus exercises</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold">
                          High
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border border-slate-400" />
                          <span className="font-semibold">Implement Sorting Algorithms in Python</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold">
                          Medium
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4 Visual: Planner & Calendar Preview */}
                {currentStep.visualType === 'plan' && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-blue-500">
                        <Calendar className="w-3.5 h-3.5" /> Daily Study Planner
                      </span>
                      <span className="text-[11px] text-[var(--color-text-secondary)]">Calendar Synced</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-slate-500">MORNING</div>
                        <div className="text-xs font-semibold mt-1">2 Focus Sessions</div>
                      </div>
                      <div className="p-2 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20">
                        <div className="text-[10px] font-bold text-indigo-600">AFTERNOON</div>
                        <div className="text-xs font-semibold mt-1">Project Milestone</div>
                      </div>
                      <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-slate-500">EVENING</div>
                        <div className="text-xs font-semibold mt-1">Review & Recap</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5 Visual: Focus Mode & Timer Preview */}
                {currentStep.visualType === 'focus' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold pb-1 border-b border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-rose-500">
                        <Clock className="w-3.5 h-3.5" /> Deep Study Timer
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-indigo-500">
                        <Volume2 className="w-3 h-3" /> Ambient Rain Sound
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-4 py-1">
                      <div className="text-center">
                        <div className="text-3xl font-extrabold tracking-tight font-mono text-[var(--color-accent-primary)]">
                          25:00
                        </div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">
                          Pomodoro Interval
                        </div>
                      </div>
                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          tabIndex={-1}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                          style={{
                            backgroundColor: 'var(--color-accent-primary)',
                            color: 'var(--color-accent-fg)',
                          }}
                        >
                          <Play className="w-3 h-3" /> Start Focus
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6 Visual: Progress & Gamification Preview */}
                {currentStep.visualType === 'track' && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <BarChart3 className="w-3.5 h-3.5" /> Streaks & Achievements
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                        Rank Up: Scholar
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-amber-500 text-sm font-bold">🔥 1 Day</div>
                        <div className="text-[10px] text-[var(--color-text-secondary)]">Daily Streak</div>
                      </div>
                      <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-indigo-600 text-sm font-bold">⚡ 150 XP</div>
                        <div className="text-[10px] text-[var(--color-text-secondary)]">Level 1</div>
                      </div>
                      <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-emerald-600 text-sm font-bold">🏆 3 / 16</div>
                        <div className="text-[10px] text-[var(--color-text-secondary)]">Badges Unlocked</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bullet Key Points */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Key Capabilities
                </div>
                <div className="space-y-1.5">
                  {currentStep.keyPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: 'var(--color-accent-subtle, rgba(99, 102, 241, 0.15))',
                          color: 'var(--color-accent-primary)',
                        }}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-4 border-t shrink-0"
          style={{
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-surface-elevated, var(--color-bg-surface))',
          }}
        >
          {showCompletionScreen ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                Tutorial complete
              </span>
              <button
                type="button"
                onClick={handleCompleteAndStart}
                className="px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] flex items-center gap-1.5"
                style={{
                  backgroundColor: 'var(--color-accent-primary)',
                  color: 'var(--color-accent-fg)',
                }}
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="px-4 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'transparent',
                }}
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Back
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] hidden sm:inline">
                  {currentStepIndex + 1} of {totalSteps}
                </span>

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-accent-primary)',
                    color: 'var(--color-accent-fg)',
                  }}
                  aria-label={currentStepIndex === totalSteps - 1 ? 'Finish tutorial' : 'Next step'}
                >
                  <span>{currentStepIndex === totalSteps - 1 ? 'Finish & Ready' : 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
