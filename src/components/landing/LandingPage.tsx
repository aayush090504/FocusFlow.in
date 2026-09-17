import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckSquare, 
  Clock, 
  BookOpen, 
  BarChart3, 
  Target, 
  Palette, 
  Flame, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Calendar, 
  Award, 
  Lock, 
  Users, 
  Star,
  ExternalLink,
  Laptop,
  Smartphone,
  Compass,
  ArrowUpRight,
  Shield
} from 'lucide-react';
import { ThemeMode } from '../../types';
import { THEMES } from '../../context/ThemeContext';
import { SEOHead } from '../seo/SEOHead';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onNavigate?: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onNavigate }) => {
  // Theme showcase active tab
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeMode>('calm');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [demoTimerSeconds, setDemoTimerSeconds] = useState(1500); // 25:00
  const [isDemoTimerRunning, setIsDemoTimerRunning] = useState(false);
  const [demoTasks, setDemoTasks] = useState([
    { id: '1', title: 'Complete Differential Equations Problem Set 4', subject: 'Calculus III', done: true, priority: 'high' },
    { id: '2', title: 'Review Chapter 8: Organic Synthesis Reactions', subject: 'Organic Chemistry', done: false, priority: 'high' },
    { id: '3', title: 'Draft Literature Review for Senior Thesis', subject: 'Academic Research', done: false, priority: 'medium' },
  ]);

  const toggleDemoTask = (id: string) => {
    setDemoTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeTheme = THEMES.find(t => t.id === selectedThemeId) || THEMES[0];

  const faqs = [
    {
      question: 'What makes Focus Flow different from a regular to-do list?',
      answer: 'Focus Flow is an integrated Study Operating System built specifically for academic rhythms. Rather than just listing tasks, it binds assignments directly to course subject budgets, tracks deep focus intervals with Pomodoro and stopwatch modes, generates momentum analytics, and protects your focus with distraction shields.'
    },
    {
      question: 'Is my study data secure and private?',
      answer: 'Yes, completely. Focus Flow runs on enterprise-grade Google Cloud Firestore security rules with zero-trust authorization. Only your authenticated account has cryptographic permission to read or write your personal study logs, subjects, and task records.'
    },
    {
      question: 'Can I customize study timer intervals and notification sounds?',
      answer: 'Absolutely. You can choose between classic 25/5 Pomodoro intervals, custom session lengths, long breaks, or open-ended stopwatch logging with ambient study sounds and configurable completion chimes.'
    },
    {
      question: 'How do subject study budgets work?',
      answer: 'You assign target weekly hours to each subject (e.g. 8 hours for Computer Science, 5 hours for Physics). As you complete focus sessions, Focus Flow tracks your progress against each budget, helping you prevent unbalanced study cramming.'
    },
    {
      question: 'Does Focus Flow work across desktop, tablet, and mobile?',
      answer: 'Yes. Focus Flow is fully responsive with adaptive layouts for desktop monitors, laptops, iPad/tablets, and mobile phones, featuring persistent cloud synchronization across all your active devices.'
    },
    {
      question: 'Can I export my study history?',
      answer: 'Yes. You have complete data ownership. At any time in Account Settings, you can download a full JSON backup of all your subjects, tasks, goals, and focus session histories.'
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://focusflow.in/#app",
        "name": "Focus Flow — Personalized Study Workspace & Focus OS",
        "url": "https://focusflow.in/",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": "All-in-one personalized study workspace for students with task management, focus timer, subject hourly budgets, streak tracking, and customizable study soundscapes."
      },
      {
        "@type": "WebSite",
        "@id": "https://focusflow.in/#website",
        "url": "https://focusflow.in/",
        "name": "Focus Flow",
        "publisher": {
          "@type": "Organization",
          "name": "Focus Flow Inc.",
          "url": "https://focusflow.in/"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        }))
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white antialiased font-sans">
      <SEOHead
        title="Focus Flow — Personalized Study Workspace for Students"
        description="All-in-one personalized study workspace for students. Organize courses, master 25/5 Pomodoros, track study hours against subject budgets, and maintain continuous study streaks."
        canonicalUrl="https://focusflow.in/"
        schemaJson={jsonLd}
      />

      {/* Top Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-900/20 via-violet-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">Focus Flow</span>
              <span className="hidden sm:inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                focusflow.in
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#tools" className="hover:text-white transition-colors">Free Tools</a>
            <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
            <a href="#themes" className="hover:text-white transition-colors">Themes</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            {onNavigate && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <button 
                  onClick={() => onNavigate('/study-timer')}
                  className="hover:text-indigo-400 transition-colors flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>Timer</span>
                </button>
                <button 
                  onClick={() => onNavigate('/pomodoro-timer')}
                  className="hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  <Flame className="w-3 h-3" />
                  <span>Pomodoro</span>
                </button>
                <button 
                  onClick={() => onNavigate('/study-planner')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Planner</span>
                </button>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <button
              id="landing-login-btn"
              onClick={onLogin}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
            >
              Log In
            </button>
            <button
              id="landing-get-started-nav-btn"
              onClick={onGetStarted}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-indigo-300 mb-6 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>The Intelligent Focus & Study OS for Ambitious Students</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
              Study smarter, stay focused, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-300">master every subject</span>.
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-8 font-normal">
              Focus Flow replaces scattered notes, stopwatch timers, and lost deadlines with a cohesive workspace designed for academic peak performance.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <button
                id="hero-cta-btn"
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Launch Your Workspace</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                id="hero-preview-btn"
                onClick={onLogin}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-base border border-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In with Account</span>
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Free & Cloud-Synced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Zero Ads or Distractions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>7 Personalized Themes</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Hero Showcase */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500/30 via-violet-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-70 pointer-events-none" />
            
            <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
              {/* Window Bar */}
              <div className="h-10 bg-slate-950 border-b border-slate-800/80 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] font-mono text-slate-400 ml-2">focusflow.in — workspace</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Cloud Sync Active
                  </span>
                </div>
              </div>

              {/* Mock Dashboard Grid */}
              <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900">
                {/* Left Column: Focus Dial + Quick Action */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center justify-between w-full mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Deep Focus Interval
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-700/40">
                        Pomodoro
                      </span>
                    </div>

                    <div className="relative w-36 h-36 flex items-center justify-center my-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" className="text-slate-800 fill-none" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="42" 
                          stroke="currentColor" 
                          strokeWidth="6" 
                          strokeDasharray={264} 
                          strokeDashoffset={264 * (1 - demoTimerSeconds / 1500)}
                          strokeLinecap="round" 
                          className="text-indigo-500 fill-none transition-all duration-500" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-mono font-black text-white tracking-tight">
                          {formatTimer(demoTimerSeconds)}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Calculus III</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 w-full">
                      <button
                        onClick={() => setIsDemoTimerRunning(!isDemoTimerRunning)}
                        className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                      >
                        {isDemoTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isDemoTimerRunning ? 'Pause' : 'Start Focus'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsDemoTimerRunning(false);
                          setDemoTimerSeconds(1500);
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Reset Demo Timer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Streak Card */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">7-Day Study Streak</div>
                        <div className="text-xs text-slate-400">Daily goal: 120 / 120 mins reached</div>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-amber-400 px-2 py-1 bg-amber-500/10 rounded-md">
                      +15% Velocity
                    </span>
                  </div>
                </div>

                {/* Right Column: Interactive Tasks & Subject Progress */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  {/* Task List Preview */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-bold text-white">Today's Priority Queue</h3>
                      </div>
                      <span className="text-[11px] text-slate-400">Interactive Preview</span>
                    </div>

                    <div className="space-y-2.5">
                      {demoTasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => toggleDemoTask(task.id)}
                          className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all ${
                            task.done 
                              ? 'bg-slate-900/40 border-slate-800/60 opacity-60' 
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            task.done ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600 bg-slate-800'
                          }`}>
                            {task.done && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${task.done ? 'line-through text-slate-400' : 'text-white'}`}>
                              {task.title}
                            </p>
                            <span className="text-[10px] text-slate-400">{task.subject}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            task.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Course Weekly Budgets Preview */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                    <div className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
                      <span>Subject Weekly Hourly Budgets</span>
                      <span className="text-[10px] text-indigo-400 font-mono">14.5 / 20.0 hrs</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Calculus III</span>
                          <span className="text-indigo-300 font-mono">6.5 / 8 hrs (81%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full w-[81%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Organic Chemistry</span>
                          <span className="text-emerald-300 font-mono">5.0 / 6 hrs (83%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-[83%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-900/50 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Core Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2 mb-4">
              Engineered for Deep Academic Work
            </h2>
            <p className="text-base text-slate-400">
              Everything you need to plan assignments, eliminate cognitive friction, and track your true academic trajectory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Task Management */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Smart Task Management</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Prioritize assignments with intelligent high/medium/low severity queues, minute estimates, due dates, and seamless one-click subject linking.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Kanban & List views</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Estimated vs. Actual study time</span>
                </li>
              </ul>
            </div>

            {/* 2. Focus Mode */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:bg-violet-600 group-hover:text-white transition-all">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Distraction-Free Focus Mode</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Classic Pomodoro, long breaks, and open stopwatch tracking with fullscreen distraction shields, ambient study audio, and automatic session logging.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>Full-screen study shield</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-violet-400" />
                  <span>Built-in session notes & task linking</span>
                </li>
              </ul>
            </div>

            {/* 3. Study Planning */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Course & Subject Planning</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Set weekly hourly target budgets for each course. Maintain balanced preparation across STEM, humanities, and research without last-minute cramming.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Weekly target budget meters</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Custom subject color badges & icons</span>
                </li>
              </ul>
            </div>

            {/* 4. Progress Tracking & Analytics */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Progress Analytics & Streaks</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Visualize daily momentum, subject distribution pie charts, 7-day velocity heatmaps, and streak tracking that celebrates consistent daily effort.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hourly distribution graphs</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Daily streak verification</span>
                </li>
              </ul>
            </div>

            {/* 5. Exam & Semester Goals */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 group-hover:bg-rose-600 group-hover:text-white transition-all">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Milestone & Goal Tracking</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Break large academic objectives (e.g. "Complete 150 Practice Problems", "Log 40 Study Hours") into trackable milestones with target dates.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-400" />
                  <span>Unit flexibility (Hours, Problems, Chapters)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-400" />
                  <span>Visual progress percentages</span>
                </li>
              </ul>
            </div>

            {/* 6. Personalized Themes & Aesthetics */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">7 Personalized Themes</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Designed for long study marathons. Switch seamlessly between dark twilight, calm slate, ocean indigo, sakura blossom, cyber neon, and classic light.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Zero eye strain palette ratios</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Student avatar persona selector</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Free Public Academic Tools Section */}
      <section id="tools" className="py-20 border-t border-slate-800/80 bg-slate-950/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Free Academic Web Utilities</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2 mb-4">
              Instant Online Tools for High-Performance Students
            </h2>
            <p className="text-base text-slate-400">
              Access our suite of standalone web utilities with zero signup required. Use them directly in your browser or connect your account for persistent cloud tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tool 1: Study Timer */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/60 transition-all group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Online Study Timer</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Customizable study/rest blocks with calming soundscapes (rain, white noise, alpha waves) and session notes.
                </p>
              </div>
              {onNavigate ? (
                <button
                  onClick={() => onNavigate('/study-timer')}
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group-hover:text-indigo-400"
                >
                  <span>Launch Study Timer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <a
                  href="/study-timer"
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group-hover:text-indigo-400"
                >
                  <span>Launch Study Timer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Tool 2: Pomodoro Timer */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-rose-500/60 transition-all group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 group-hover:bg-rose-600 group-hover:text-white transition-all">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Scientific Pomodoro (25/5)</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Classic 25-minute sprints with 5-minute short breaks, long breaks, and completed cycle counters.
                </p>
              </div>
              {onNavigate ? (
                <button
                  onClick={() => onNavigate('/pomodoro-timer')}
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group-hover:text-rose-400"
                >
                  <span>Launch Pomodoro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <a
                  href="/pomodoro-timer"
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group-hover:text-rose-400"
                >
                  <span>Launch Pomodoro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Tool 3: Study Planner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/60 transition-all group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Academic Study Planner</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Calculate weekly course credit hours, balance daily study budgets, and export weekly schedules.
                </p>
              </div>
              {onNavigate ? (
                <button
                  onClick={() => onNavigate('/study-planner')}
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group-hover:text-emerald-400"
                >
                  <span>Launch Planner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <a
                  href="/study-planner"
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group-hover:text-emerald-400"
                >
                  <span>Launch Planner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Tool 4: Deep Focus */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-violet-500/60 transition-all group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:bg-violet-600 group-hover:text-white transition-all">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Deep Focus Shield</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Pre-flight environmental checklists, distraction-shielded full-screen mode, and single-task anchors.
                </p>
              </div>
              {onNavigate ? (
                <button
                  onClick={() => onNavigate('/focus-timer')}
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group-hover:text-violet-400"
                >
                  <span>Launch Deep Focus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <a
                  href="/focus-timer"
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 group-hover:text-violet-400"
                >
                  <span>Launch Deep Focus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Theme Showcase Section */}
      <section id="themes" className="py-20 border-t border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Aesthetic Ergonomics</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2 mb-4">
              Personalized Themes for Any Study Atmosphere
            </h2>
            <p className="text-base text-slate-400">
              Click any theme below to preview how Focus Flow dynamically adapts its layout, contrast ratios, and color accents.
            </p>
          </div>

          {/* Theme Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto mb-10">
            {THEMES.map(theme => {
              const isSelected = selectedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                    isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 scale-105' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span 
                    className="w-3 h-3 rounded-full border border-white/20" 
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <span>{theme.name}</span>
                </button>
              );
            })}
          </div>

          {/* Live Theme Preview Box */}
          <div className="max-w-4xl mx-auto">
            <div 
              className="rounded-2xl p-6 sm:p-8 border shadow-2xl transition-all duration-300"
              style={{ 
                backgroundColor: activeTheme.colors.bg, 
                borderColor: activeTheme.colors.border,
                color: activeTheme.colors.text 
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: activeTheme.colors.border }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold">{activeTheme.name} Theme</span>
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ 
                        backgroundColor: activeTheme.colors.surface,
                        color: activeTheme.colors.primary,
                        border: `1px solid ${activeTheme.colors.border}`
                      }}
                    >
                      {activeTheme.isDark ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-80" style={{ color: activeTheme.colors.text }}>
                    {activeTheme.description}
                  </p>
                </div>

                <button
                  onClick={onGetStarted}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-auto shadow-md text-white"
                  style={{
                    backgroundColor: activeTheme.colors.primary
                  }}
                >
                  Use this Theme
                </button>
              </div>

              {/* Sample Mini Cards inside Selected Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div 
                  className="p-4 rounded-xl border"
                  style={{ 
                    backgroundColor: activeTheme.colors.surface, 
                    borderColor: activeTheme.colors.border 
                  }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-70" style={{ color: activeTheme.colors.text }}>
                    Today's Target
                  </div>
                  <div className="text-2xl font-black mt-1" style={{ color: activeTheme.colors.text }}>
                    145 / 180 min
                  </div>
                  <div className="w-full bg-slate-700/20 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: '80%', backgroundColor: activeTheme.colors.primary }}
                    />
                  </div>
                </div>

                <div 
                  className="p-4 rounded-xl border"
                  style={{ 
                    backgroundColor: activeTheme.colors.surface, 
                    borderColor: activeTheme.colors.border 
                  }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-70" style={{ color: activeTheme.colors.text }}>
                    Current Course
                  </div>
                  <div className="text-base font-bold mt-1" style={{ color: activeTheme.colors.text }}>
                    Organic Chemistry
                  </div>
                  <div className="flex items-center gap-1 text-xs mt-2 font-medium" style={{ color: activeTheme.colors.primary }}>
                    <Flame className="w-3.5 h-3.5" />
                    <span>8 Focus Sessions logged</span>
                  </div>
                </div>

                <div 
                  className="p-4 rounded-xl border"
                  style={{ 
                    backgroundColor: activeTheme.colors.surface, 
                    borderColor: activeTheme.colors.border 
                  }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-70" style={{ color: activeTheme.colors.text }}>
                    Upcoming Deadline
                  </div>
                  <div className="text-base font-bold mt-1" style={{ color: activeTheme.colors.text }}>
                    Midterm Exam 2
                  </div>
                  <div className="text-xs mt-2 opacity-80" style={{ color: activeTheme.colors.text }}>
                    In 3 days • 92% planned
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works (Workflow: Plan → Focus → Track → Improve) */}
      <section id="workflow" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">The Study Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2 mb-4">
              How Focus Flow Accelerates Learning
            </h2>
            <p className="text-base text-slate-400">
              A scientific 4-step cadence designed to transform chaotic study routines into sustainable high achievement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1: Plan */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 relative">
              <div className="text-3xl font-mono font-black text-indigo-500/30 mb-2">01</div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Plan</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add your academic subjects, set weekly study hour targets, and break down upcoming assignments into prioritized actionable tasks.
              </p>
            </div>

            {/* Step 2: Focus */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 relative">
              <div className="text-3xl font-mono font-black text-violet-500/30 mb-2">02</div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" />
                <span>Focus</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Launch deep focus sessions. Enter the distraction shield, select calming soundscapes, and immerse in single-task execution without notifications.
              </p>
            </div>

            {/* Step 3: Track */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 relative">
              <div className="text-3xl font-mono font-black text-emerald-500/30 mb-2">03</div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                <span>Track</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every study minute and completed assignment is automatically recorded into your secure cloud profile, building your daily study streak.
              </p>
            </div>

            {/* Step 4: Improve */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 relative">
              <div className="text-3xl font-mono font-black text-amber-500/30 mb-2">04</div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Improve</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Analyze weekly study velocity charts, rebalance subject preparation before exams, and systematically elevate your GPA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Common Inquiries</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-400">
              Everything you need to know about getting started with Focus Flow.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-white">{faq.question}</span>
                    <span className="text-indigo-400 flex-shrink-0">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 relative overflow-hidden border-t border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-6 shadow-xl">
            <Sparkles className="w-7 h-7 text-indigo-400" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Ready to Take Control of Your Study Habits?
          </h2>

          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-8">
            Join thousands of ambitious students turning chaotic study sessions into focused, measurable academic mastery.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              id="final-cta-get-started-btn"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="final-cta-login-btn"
              onClick={onLogin}
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-base border border-slate-800 transition-all"
            >
              <span>Sign In</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-6">
            Instant setup • No credit card required • Secure cloud persistence
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="space-y-3 sm:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-base font-bold text-white">Focus Flow</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                The all-in-one study operating system designed for disciplined, high-performing students worldwide.
              </p>
              <div className="text-[11px] font-mono text-indigo-400">
                domain: focusflow.in
              </div>
            </div>

            {/* Free Web Tools */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Free Tools</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => onNavigate ? onNavigate('/study-timer') : window.location.href = '/study-timer'} 
                    className="hover:text-white transition-colors text-left"
                  >
                    Online Study Timer
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate ? onNavigate('/pomodoro-timer') : window.location.href = '/pomodoro-timer'} 
                    className="hover:text-white transition-colors text-left"
                  >
                    Pomodoro Timer (25/5)
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate ? onNavigate('/study-planner') : window.location.href = '/study-planner'} 
                    className="hover:text-white transition-colors text-left"
                  >
                    Study Planner & Matrix
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onNavigate ? onNavigate('/focus-timer') : window.location.href = '/focus-timer'} 
                    className="hover:text-white transition-colors text-left"
                  >
                    Deep Focus Shield
                  </button>
                </li>
              </ul>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Workspace</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Task Management</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Subject Budgets</a></li>
                <li><a href="#themes" className="hover:text-white transition-colors">7 Themes</a></li>
                <li><a href="#workflow" className="hover:text-white transition-colors">Workflow</a></li>
              </ul>
            </div>

            {/* Account & Trust */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Account</h4>
              <ul className="space-y-2">
                <li><button onClick={onLogin} className="hover:text-white transition-colors text-left">Sign In</button></li>
                <li><button onClick={onGetStarted} className="hover:text-white transition-colors text-left">Create Free Account</button></li>
                <li className="pt-2">
                  <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cloud Firestore Secured</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
            <div>
              © {new Date().getFullYear()} Focus Flow (focusflow.in). All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <button 
                type="button" 
                onClick={() => onNavigate ? onNavigate('/privacy') : window.location.href = '/privacy'} 
                className="hover:text-slate-200 transition-colors"
              >
                Privacy Policy
              </button>
              <button 
                type="button" 
                onClick={() => onNavigate ? onNavigate('/terms') : window.location.href = '/terms'} 
                className="hover:text-slate-200 transition-colors"
              >
                Terms of Service
              </button>
              <button 
                type="button" 
                onClick={() => onNavigate ? onNavigate('/contact') : window.location.href = '/contact'} 
                className="hover:text-slate-200 transition-colors"
              >
                Contact & Support
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
