import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Lock, 
  Clock, 
  ChevronRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Zap,
  Target
} from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface FocusTimerPageProps {
  onNavigate: (path: string) => void;
  onGetStarted: () => void;
  onLogin: () => void;
}

export const FocusTimerPage: React.FC<FocusTimerPageProps> = ({
  onNavigate,
  onGetStarted,
  onLogin
}) => {
  const [sessionSeconds, setSessionSeconds] = useState<number>(45 * 60);
  const [secondsLeft, setSecondsLeft] = useState<number>(45 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [targetTask, setTargetTask] = useState<string>('Write first draft of Biology lab report methodology');
  const [checklist, setChecklist] = useState([
    { id: '1', text: 'Phone placed in Do Not Disturb / Out of sight', done: false },
    { id: '2', text: 'Closed social media & messaging browser tabs', done: false },
    { id: '3', text: 'Fresh glass of water / coffee at desk', done: true },
    { id: '4', text: 'Single concrete target output defined below', done: true }
  ]);
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const toggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  const setDurationMinutes = (mins: number) => {
    setIsRunning(false);
    setSessionSeconds(mins * 60);
    setSecondsLeft(mins * 60);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(sessionSeconds);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const allChecklistCompleted = checklist.every(c => c.done);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://focusflow.in/focus-timer#webapp",
        "name": "Distraction-Free Deep Work Focus Timer — Focus Flow",
        "url": "https://focusflow.in/focus-timer",
        "applicationCategory": "ProductivityApplication",
        "operatingSystem": "All",
        "description": "Free deep work focus timer with pre-flight distraction shield checklist, full-screen focus shield, single-task commitments, and attentional focus optimization.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://focusflow.in/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Focus Timer",
            "item": "https://focusflow.in/focus-timer"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-violet-500 selection:text-white font-sans antialiased">
      <SEOHead
        title="Distraction-Free Deep Work Focus Timer | Focus Flow"
        description="Free online deep work focus timer for students. Eliminate digital distractions with pre-flight focus checklists, full-screen focus shields, and single-task anchors."
        canonicalUrl="https://focusflow.in/focus-timer"
        schemaJson={jsonLd}
        keywords={[
          'deep work focus timer',
          'distraction free timer',
          'student focus shield',
          'attention residue focus timer',
          'full screen study timer',
          'focus flow deep work'
        ]}
      />

      <PublicHeader
        currentPath="/focus-timer"
        onNavigate={onNavigate}
        onGetStarted={onGetStarted}
        onLogin={onLogin}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs text-slate-400">
            <li>
              <button onClick={() => onNavigate('/')} className="hover:text-violet-400 transition-colors">
                Home
              </button>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-slate-200 font-medium" aria-current="page">
              Deep Work Focus Timer
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-800/60 text-xs font-semibold text-violet-300 mb-4">
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span>Distraction Shield & Deep Work Engine</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Distraction-Free Deep Work Focus Timer
          </h1>
          <p className="text-base text-slate-400 leading-relaxed">
            Protect your cognitive bandwidth from attention residue. Complete your pre-flight environment checklist and enter uninterrupted academic focus.
          </p>
        </header>

        {/* Interactive Tool Widget */}
        <section 
          className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl mb-16 relative overflow-hidden transition-all ${
            isShieldActive ? 'ring-2 ring-violet-500/50 bg-slate-950' : ''
          }`} 
          aria-label="Interactive Focus Timer Tool"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Preset Buttons & Fullscreen Shield Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {[30, 45, 60, 90].map(mins => (
                <button
                  key={mins}
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    sessionSeconds === mins * 60 
                      ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/30' 
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsShieldActive(!isShieldActive)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                isShieldActive 
                  ? 'bg-violet-900/60 border-violet-500 text-violet-300 shadow-md' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isShieldActive ? <Minimize2 className="w-3.5 h-3.5 text-violet-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isShieldActive ? 'Shield Active' : 'Enable Focus Shield'}</span>
            </button>
          </div>

          {/* Central Timer Dial */}
          <div className="flex flex-col items-center justify-center text-center my-4">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="5" className="text-slate-800 fill-none" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="44" 
                  stroke="currentColor" 
                  strokeWidth="5" 
                  strokeDasharray={276} 
                  strokeDashoffset={276 * (1 - secondsLeft / sessionSeconds)}
                  strokeLinecap="round" 
                  className="text-violet-500 fill-none transition-all duration-500" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight">
                  {formatTime(secondsLeft)}
                </span>
                <span className="text-xs text-violet-300 font-semibold mt-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Deep Work Shield</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="px-8 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-sm shadow-xl shadow-violet-600/30 transition-all flex items-center gap-2"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Pause Focus Session' : 'Enter Deep Work'}</span>
              </button>
              <button
                onClick={resetTimer}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Reset Session"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pre-flight Checklist & Single-task anchor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-800">
            {/* Checklist */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                  <span>Pre-Flight Distraction Checklist</span>
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  allChecklistCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {allChecklistCompleted ? 'Ready to Focus' : `${checklist.filter(c => c.done).length}/${checklist.length} Complete`}
                </span>
              </div>

              <div className="space-y-2">
                {checklist.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      item.done ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-600 bg-slate-800'
                    }`}>
                      {item.done && <Check className="w-3 h-3" />}
                    </div>
                    <span className={`text-xs ${item.done ? 'text-slate-300 font-medium' : 'text-slate-400'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Single Task Commitment */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <label htmlFor="target-task-input" className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                  <Target className="w-3.5 h-3.5 text-violet-400" />
                  <span>Single-Task Anchor</span>
                </label>
                <textarea
                  id="target-task-input"
                  value={targetTask}
                  onChange={e => setTargetTask(e.target.value)}
                  placeholder="Define the exact output you will produce before the timer expires..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
                />
              </div>

              <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-violet-400" />
                <span>Single-tasking prevents cognitive switching penalties.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Educational Content & Cognitive Neuroscience */}
        <article className="prose prose-invert max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-4">
              Attention Residue & The True Cost of "Quick Checks"
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              In landmark research by Dr. Gloria Mark at the University of California, Irvine, researchers discovered that it takes an average of <strong>23 minutes and 15 seconds</strong> to regain deep cognitive immersion after a single minor digital interruption (such as checking a text notification, glancing at email, or opening a social media feed).
            </p>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed mt-3">
              Professor Cal Newport coined this phenomenon <em>attention residue</em>. When you switch from writing an academic thesis to checking a phone notification, a portion of your executive brain power remains stuck processing the previous stimulus. By establishing a physical pre-flight routine and committing to a distraction-shielded timer, you protect high-order problem solving and analytical synthesis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-6">
              3 Triggers to Induce Academic Flow State
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">1. Visual Field Narrowing</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dimming background lighting and maximizing a single full-screen window creates physical tunnel vision, naturally signaling to your autonomic nervous system that only one stimulus matters.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">2. Clear Victory Conditions</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Never start a focus session with ambiguous goals like "study biology." Instead, define precise tangible outputs: "Outline sections 4.1 to 4.3 and summarize key cellular organelles."
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">3. Challenge-Skill Balance</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Set tasks that stretch your existing capabilities by roughly 4%. If an assignment is overwhelmingly hard, break it into 15-minute sub-problems to maintain continuous momentum.
                </p>
              </div>
            </div>
          </section>

          {/* Internal Linking Hub */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-white mb-4">Complementary Academic Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => onNavigate('/study-timer')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-violet-400 flex items-center justify-between">
                  <span>Online Study Timer</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Study intervals with calming rain and alpha wave audio.</p>
              </button>

              <button 
                onClick={() => onNavigate('/pomodoro-timer')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-violet-400 flex items-center justify-between">
                  <span>Pomodoro Timer (25/5)</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Classic 25-minute sprints and restorative short breaks.</p>
              </button>

              <button 
                onClick={() => onNavigate('/study-planner')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-violet-400 flex items-center justify-between">
                  <span>Semester Study Planner</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Calculate optimal credit loads and daily study hours.</p>
              </button>
            </div>
          </section>

          {/* Account Upgrade CTA */}
          <section className="rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-violet-950/80 via-slate-900 to-slate-950 border border-violet-800/50 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              Master Your Focus with Focus Flow
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
              Create a free account to track your focus history in cloud storage, sync across desktop and mobile, and build unshakeable daily study streaks.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onLogin}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-800 transition-all"
              >
                <span>Log In</span>
              </button>
            </div>
          </section>
        </article>
      </main>

      <PublicFooter
        onNavigate={onNavigate}
        onGetStarted={onGetStarted}
        onLogin={onLogin}
      />
    </div>
  );
};
