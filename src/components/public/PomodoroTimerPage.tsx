import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Flame, 
  Clock, 
  Coffee, 
  ChevronRight,
  Target,
  Brain,
  Zap,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface PomodoroTimerPageProps {
  onNavigate: (path: string) => void;
  onGetStarted: () => void;
  onLogin: () => void;
}

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

export const PomodoroTimerPage: React.FC<PomodoroTimerPageProps> = ({
  onNavigate,
  onGetStarted,
  onLogin
}) => {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(0);
  const [currentTask, setCurrentTask] = useState<string>('Review lecture slides & formulate flashcards');
  const [tasks, setTasks] = useState([
    { id: '1', text: 'Outline essay thesis statement', done: true },
    { id: '2', text: 'Solve 10 Calculus homework exercises', done: false },
    { id: '3', text: 'Memorize 20 vocabulary terms', done: false }
  ]);

  const durations: Record<PomodoroMode, number> = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
      if (mode === 'work') {
        const nextCount = completedPomodoros + 1;
        setCompletedPomodoros(nextCount);
        playChime();
        if (nextCount % 4 === 0) {
          setMode('longBreak');
          setSecondsLeft(durations.longBreak);
        } else {
          setMode('shortBreak');
          setSecondsLeft(durations.shortBreak);
        }
      } else {
        playChime();
        setMode('work');
        setSecondsLeft(durations.work);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, mode, completedPomodoros]);

  const switchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setSecondsLeft(durations[newMode]);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(durations[mode]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.95);
    } catch (e) {}
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://focusflow.in/pomodoro-timer#webapp",
        "name": "Scientific 25/5 Pomodoro Timer Online — Focus Flow",
        "url": "https://focusflow.in/pomodoro-timer",
        "applicationCategory": "ProductivityApplication",
        "operatingSystem": "All",
        "description": "Free online Pomodoro timer with 25-minute study intervals, 5-minute short breaks, 15-minute long breaks, and integrated task tracking for students.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "HowTo",
        "name": "How to Use the Pomodoro Technique for Studying",
        "description": "Step-by-step guide to mastering academic assignments using 25-minute Pomodoro intervals.",
        "step": [
          {
            "@type": "HowToStep",
            "name": "Choose a Single Concrete Task",
            "text": "Select one assignment or chapter to focus on without dividing attention."
          },
          {
            "@type": "HowToStep",
            "name": "Set the Pomodoro Timer for 25 Minutes",
            "text": "Start the timer and commit to single-task focus until the chime rings."
          },
          {
            "@type": "HowToStep",
            "name": "Take a 5-Minute Brain Break",
            "text": "Step away from the screen, stretch, or grab water to allow memory consolidation."
          },
          {
            "@type": "HowToStep",
            "name": "Repeat 4 Cycles and Take a 15-30 Minute Long Break",
            "text": "After 4 consecutive Pomodoro intervals, take a restorative long break to prevent mental fatigue."
          }
        ]
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
            "name": "Pomodoro Timer",
            "item": "https://focusflow.in/pomodoro-timer"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white font-sans antialiased">
      <SEOHead
        title="Scientific Pomodoro Timer (25/5) Online | Focus Flow"
        description="Free, distraction-free online Pomodoro timer for students. Built-in 25-minute focus intervals, 5-minute short breaks, 4-cycle long breaks, and integrated task checklists."
        canonicalUrl="https://focusflow.in/pomodoro-timer"
        schemaJson={jsonLd}
        keywords={[
          'pomodoro timer',
          '25 5 timer',
          'pomodoro technique online',
          'study pomodoro',
          'pomodoro cycle tracker',
          'francesco cirillo timer'
        ]}
      />

      <PublicHeader
        currentPath="/pomodoro-timer"
        onNavigate={onNavigate}
        onGetStarted={onGetStarted}
        onLogin={onLogin}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs text-slate-400">
            <li>
              <button onClick={() => onNavigate('/')} className="hover:text-rose-400 transition-colors">
                Home
              </button>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-slate-200 font-medium" aria-current="page">
              Scientific Pomodoro Timer
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/60 text-xs font-semibold text-rose-300 mb-4">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Classic 25/5 Pomodoro Cadence</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Scientific Pomodoro Timer & Interval Tracker
          </h1>
          <p className="text-base text-slate-400 leading-relaxed">
            Break through academic procrastination and sustain intense mental stamina with 25-minute high-focus sprints and structured recovery breaks.
          </p>
        </header>

        {/* Interactive Pomodoro Widget */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl mb-16 relative overflow-hidden" aria-label="Interactive Pomodoro Timer">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-950 rounded-2xl max-w-md mx-auto mb-8 border border-slate-800">
            <button
              onClick={() => switchMode('work')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'work' 
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Pomodoro (25m)</span>
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'shortBreak' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Short Break (5m)</span>
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'longBreak' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Long Break (15m)</span>
            </button>
          </div>

          {/* Dial and Counter */}
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
                  strokeDashoffset={276 * (1 - secondsLeft / durations[mode])}
                  strokeLinecap="round" 
                  className={`fill-none transition-all duration-500 ${
                    mode === 'work' ? 'text-rose-500' : mode === 'shortBreak' ? 'text-emerald-500' : 'text-indigo-500'
                  }`} 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight">
                  {formatTime(secondsLeft)}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider mt-1 text-slate-400">
                  {mode === 'work' ? 'Study Sprint' : 'Rest Interval'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-8 py-3.5 rounded-2xl font-bold text-sm text-white shadow-xl transition-all flex items-center gap-2 ${
                  mode === 'work' 
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30' 
                    : mode === 'shortBreak' 
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' 
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Pause Interval' : 'Start Pomodoro'}</span>
              </button>
              <button
                onClick={resetTimer}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Reset Interval"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Cycle Visualizer */}
            <div className="flex items-center gap-2 mt-6">
              <span className="text-xs text-slate-400 font-semibold mr-2">Completed Cycles:</span>
              {[1, 2, 3, 4].map(c => {
                const filled = completedPomodoros % 4 >= c || (completedPomodoros > 0 && completedPomodoros % 4 === 0);
                return (
                  <div
                    key={c}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                      filled ? 'bg-rose-500 border-rose-400 text-white scale-110' : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    {c}
                  </div>
                );
              })}
              <span className="text-xs font-mono text-rose-400 ml-2">
                Total: {completedPomodoros} 🍅
              </span>
            </div>
          </div>

          {/* Quick Task Tracker */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-rose-400" />
                <span>Active Pomodoro Task Queue</span>
              </span>
              <span className="text-[11px] text-slate-400">Click to complete</span>
            </div>
            <div className="space-y-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    task.done ? 'bg-slate-950/40 border-slate-800/60 opacity-60' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    task.done ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-600 bg-slate-800'
                  }`}>
                    {task.done && <Check className="w-3 h-3" />}
                  </div>
                  <span className={`text-xs font-medium ${task.done ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Educational Content & Scientific Breakdown */}
        <article className="prose prose-invert max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-4">
              What is the Pomodoro Technique?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Developed in the late 1980s by university student Francesco Cirillo, the <strong>Pomodoro Technique</strong> is a time-management methodology that uses a timer to break work into 25-minute intervals, separated by short breaks. Each interval is known as a <em>pomodoro</em> (the Italian word for tomato, named after the tomato-shaped kitchen timer Cirillo used in college).
            </p>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed mt-3">
              The fundamental insight behind the technique is that human willpower and intense concentration are finite biological resources. When tasks seem open-ended and daunting, the brain's amygdala triggers procrastination. By shrinking your commitment to just <em>25 minutes of single-tasking</em>, cognitive resistance evaporates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-6">
              Why 25-Minute Intervals Work for College & High School Students
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Parkinson's Law Inversion</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Work expands to fill the time allotted for its completion. By giving yourself strict 25-minute deadlines, you finish essays, math sets, and reading passages in half the time.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Memory Consolidation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  During the 5-minute break, your hippocampus replays recent neural activity up to 20 times faster than awake real-time, transferring short-term memory into permanent storage.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Elimination of Burnout</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enforcing rest before exhaustion prevents the dreaded mid-afternoon study crash, allowing you to sustain steady productivity across entire exam weeks.
                </p>
              </div>
            </div>
          </section>

          {/* Internal Linking Hub */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-white mb-4">Related Study Tools on Focus Flow</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => onNavigate('/study-timer')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-rose-400 flex items-center justify-between">
                  <span>Study Timer with Sounds</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Study with rain, white noise, and binaural alpha soundscapes.</p>
              </button>

              <button 
                onClick={() => onNavigate('/study-planner')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-rose-400 flex items-center justify-between">
                  <span>Academic Study Planner</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Plan weekly course budgets and exam countdown milestones.</p>
              </button>

              <button 
                onClick={() => onNavigate('/focus-timer')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-rose-400 flex items-center justify-between">
                  <span>Deep Work Shield</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Eliminate digital tabs and switch into intense focus mode.</p>
              </button>
            </div>
          </section>

          {/* Account Upgrade CTA */}
          <section className="rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border border-rose-800/50 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              Track Your Pomodoros Across All Your Classes
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
              Create a free account to categorize every Pomodoro by course, view daily study heatmaps, and build continuous study streaks on Focus Flow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                <span>Get Started Free</span>
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
