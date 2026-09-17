import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ArrowRight, 
  Check, 
  BookOpen, 
  Brain, 
  Layers, 
  Clock, 
  Award, 
  Flame, 
  ChevronRight,
  ShieldCheck,
  Music,
  FileText
} from 'lucide-react';
import { SEOHead } from '../seo/SEOHead';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface StudyTimerPageProps {
  onNavigate: (path: string) => void;
  onGetStarted: () => void;
  onLogin: () => void;
}

export const StudyTimerPage: React.FC<StudyTimerPageProps> = ({
  onNavigate,
  onGetStarted,
  onLogin
}) => {
  // Timer state
  const [sessionMinutes, setSessionMinutes] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(0);
  const [soundscape, setSoundscape] = useState<'none' | 'whitenoise' | 'rain' | 'binaural'>('none');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Audio Context for built-in soundscapes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
      setCompletedSessionsCount(prev => prev + 1);
      playCompletionChime();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  // Handle ambient sound generator
  useEffect(() => {
    if (!isRunning || isMuted || soundscape === 'none') {
      stopSoundscape();
      return;
    }
    startSoundscape(soundscape);
    return () => {
      stopSoundscape();
    };
  }, [isRunning, isMuted, soundscape]);

  const startSoundscape = (type: string) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      stopSoundscape();

      if (type === 'whitenoise') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        const gain = ctx.createGain();
        gain.gain.value = 0.05;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
        noiseNodeRef.current = noise;
      } else if (type === 'rain') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = 0.08;
        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
        noiseNodeRef.current = noise;
      } else if (type === 'binaural') {
        // 40Hz Gamma / 10Hz Alpha binaural beat
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        oscLeft.type = 'sine';
        oscRight.type = 'sine';
        oscLeft.frequency.value = 200; // Left ear
        oscRight.frequency.value = 210; // Right ear (10Hz Alpha difference)
        const gain = ctx.createGain();
        gain.gain.value = 0.04;
        oscLeft.connect(gain);
        oscRight.connect(gain);
        gain.connect(ctx.destination);
        oscLeft.start();
        oscRight.start();
        noiseNodeRef.current = oscLeft;
      }
    } catch (e) {
      console.warn('AudioContext soundscape error:', e);
    }
  };

  const stopSoundscape = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).stop?.();
        noiseNodeRef.current.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
  };

  const playCompletionChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } catch (e) {}
  };

  const setPresetDuration = (mins: number) => {
    setIsRunning(false);
    setSessionMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(sessionMinutes * 60);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Schema.org Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://focusflow.in/study-timer#webapp",
        "name": "Free Online Study Timer with Soundscapes — Focus Flow",
        "url": "https://focusflow.in/study-timer",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All",
        "description": "Free, interactive online study timer with ambient soundscapes (rain, white noise, alpha waves), session notes, and interval pacing for high-performance students.",
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
            "name": "Online Study Timer",
            "item": "https://focusflow.in/study-timer"
          }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is the best study timer interval for deep learning?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The classic 25-minute Pomodoro is ideal for high-intensity problem solving and review. For long research, reading, or coding marathons, 50-minute blocks with 10-minute breaks align with natural ultradian focus cycles."
            }
          },
          {
            "@type": "Question",
            "name": "How do ambient soundscapes help improve focus during study sessions?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Consistent background soundscapes like pink/white noise, rainfall, and alpha binaural beats mask unpredictable environmental distractions, stabilizing working memory and lowering cortisol spikes."
            }
          },
          {
            "@type": "Question",
            "name": "How does Focus Flow track study hours automatically?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "When you use Focus Flow with a free cloud account, every completed study timer session is automatically attributed to your chosen course, logging your weekly hourly budgets and updating your study streak."
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans antialiased">
      <SEOHead
        title="Free Online Study Timer with Soundscapes | Focus Flow"
        description="Free customizable online study timer for students. Features ambient soundscapes (rain, white noise, alpha beats), session note taking, and interval pacing to maximize retention."
        canonicalUrl="https://focusflow.in/study-timer"
        schemaJson={jsonLd}
        keywords={[
          'online study timer',
          'study timer with sounds',
          'free student study timer',
          'focus timer online',
          'binaural beats study timer',
          'active recall study timer'
        ]}
      />

      <PublicHeader
        currentPath="/study-timer"
        onNavigate={onNavigate}
        onGetStarted={onGetStarted}
        onLogin={onLogin}
      />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs text-slate-400">
            <li>
              <button onClick={() => onNavigate('/')} className="hover:text-indigo-400 transition-colors">
                Home
              </button>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-slate-200 font-medium" aria-current="page">
              Online Study Timer
            </li>
          </ol>
        </nav>

        {/* Hero & Intro Header */}
        <header className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-semibold text-indigo-300 mb-4">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Academic Performance Timer</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Free Online Study Timer with Ambient Soundscapes
          </h1>
          <p className="text-base text-slate-400 leading-relaxed">
            Eliminate cognitive fatigue and protect your attention span with scientifically calibrated study intervals, calming ambient sound generators, and quick session logs.
          </p>
        </header>

        {/* Interactive Tool Widget */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl mb-16 relative overflow-hidden" aria-label="Interactive Study Timer Tool">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
            <button
              onClick={() => setPresetDuration(25)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                sessionMinutes === 25 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              25m Standard Block
            </button>
            <button
              onClick={() => setPresetDuration(50)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                sessionMinutes === 50 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              50m Deep Work
            </button>
            <button
              onClick={() => setPresetDuration(90)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                sessionMinutes === 90 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              90m Ultradian Marathon
            </button>
          </div>

          {/* Circular Countdown & Action Controls */}
          <div className="flex flex-col items-center justify-center text-center my-6">
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
                  strokeDashoffset={276 * (1 - secondsLeft / (sessionMinutes * 60))}
                  strokeLinecap="round" 
                  className="text-indigo-500 fill-none transition-all duration-500" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight">
                  {formatTime(secondsLeft)}
                </span>
                <span className="text-xs text-indigo-300 font-semibold mt-1">
                  {selectedSubject} Session
                </span>
              </div>
            </div>

            {/* Main Timer Action Buttons */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Pause Interval' : 'Start Studying'}</span>
              </button>
              <button
                onClick={resetTimer}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Soundscapes & Subject Configurator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800">
            {/* Soundscape selector */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ambient Study Soundscape</span>
                </span>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{isMuted ? 'Muted' : 'Sound On'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'none', label: 'Off (Silent)' },
                  { id: 'rain', label: 'Gentle Rain' },
                  { id: 'whitenoise', label: 'White Noise' },
                  { id: 'binaural', label: 'Alpha Wave' },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSoundscape(s.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                      soundscape === s.id 
                        ? 'bg-indigo-900/50 border-indigo-600 text-indigo-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Session Notepad */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
              <label htmlFor="session-note" className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Session Target / Notes</span>
              </label>
              <input
                id="session-note"
                type="text"
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder="e.g. Read Chapter 5 & solve problems 1-10..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span>Completed today: {completedSessionsCount} sessions</span>
                <span>{completedSessionsCount * sessionMinutes} mins logged</span>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Educational Guide & Scientific Framework */}
        <article className="prose prose-invert max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-4">
              The Science of Timed Study Intervals
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Human working memory is not designed for continuous, uninterrupted four-hour study marathons. Research in cognitive psychology and neuroscience demonstrates that attentional vigilance begins degrading significantly after 45 to 60 minutes of uninterrupted mental effort—a phenomenon known as the <em>vigilance decrement</em>.
            </p>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed mt-3">
              By structuring your study routine with timed interval anchors, you create clear psychological boundaries. When the timer is active, your prefrontal cortex operates in high-intensity single-tasking mode; during scheduled recovery intervals, neural pathways consolidate recently encoded memories into long-term storage.
            </p>
          </section>

          {/* 3 Core Academic Methodologies */}
          <section>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-6">
              3 Evidence-Based Study Frameworks to Combine with Timers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">1. Active Recall</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instead of passively re-reading textbooks, spend your 25-minute interval quizzing yourself from memory. The cognitive strain of retrieving information physically strengthens synaptic connections.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">2. Spaced Repetition</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Distribute your study timer sessions across multiple days rather than cramming the night before. This counters the Ebbinghaus Forgetting Curve and locks information into semantic memory.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">3. Feynman Technique</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use your study timer interval to explain a complex topic in plain, child-level vocabulary on a blank notepad. Whenever you get stuck, identify the knowledge gap and consult your source notes.
                </p>
              </div>
            </div>
          </section>

          {/* Internal Linking Hub */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-white mb-4">Explore More Academic Productivity Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => onNavigate('/pomodoro-timer')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-indigo-400 flex items-center justify-between">
                  <span>Pomodoro Timer (25/5)</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Structured 25-minute cycles with auto-break pacing.</p>
              </button>

              <button 
                onClick={() => onNavigate('/study-planner')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-indigo-400 flex items-center justify-between">
                  <span>Study Planner Tool</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Calculate course credit hours and weekly budgets.</p>
              </button>

              <button 
                onClick={() => onNavigate('/focus-timer')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition-all group"
              >
                <div className="text-sm font-bold text-white group-hover:text-indigo-400 flex items-center justify-between">
                  <span>Deep Work Shield</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Eliminate digital interruptions and context switching.</p>
              </button>
            </div>
          </section>

          {/* Upgrade CTA */}
          <section className="rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-800/60 text-center relative overflow-hidden">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              Want Your Study Sessions Automatically Cloud-Synced?
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
              Create a free Focus Flow account to link your timers directly to course subjects, maintain permanent study streak analytics, and organize upcoming homework assignments.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <span>Create Free Student Account</span>
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
