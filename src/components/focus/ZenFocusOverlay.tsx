import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Check, 
  X, 
  Flame, 
  Zap, 
  ShieldCheck,
  Music,
  FastForward,
  Coffee
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { useSound } from '../../context/SoundContext';
import { useToast } from '../../context/ToastContext';
import { AmbientSoundType } from '../../types';

const ZEN_AFFIRMATIONS = [
  "One task. One breath. Complete presence.",
  "Deep work is the superpower of the 21st century.",
  "Distraction is the enemy of mastery. Stay in flow.",
  "Focus on the process, and the results will take care of themselves.",
  "Small daily focus compounding produces extraordinary achievement.",
  "You are sharpening your intellect with every minute.",
  "Embrace the quiet discipline of dedicated study.",
];

export const ZenFocusOverlay: React.FC = () => {
  const { userProfile } = useAuth();
  const { 
    isZenModeActive, 
    exitZenMode, 
    activeTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    skipBreak,
    finishCurrentTimerSession,
    pomodoroSettings,
    subjects,
    tasks,
    todayStudyMinutes
  } = useStudy();

  const { 
    soundSettings, 
    toggleMasterSound, 
    setAmbientType, 
    setAmbientVolume, 
    isAmbientPlaying, 
    startAmbient, 
    stopAmbient,
    playCue 
  } = useSound();

  const { showSuccess, showInfo, showError } = useToast();

  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Rotate affirmation quote every 90 seconds
  useEffect(() => {
    if (!isZenModeActive) return;
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % ZEN_AFFIRMATIONS.length);
    }, 90000);
    return () => clearInterval(interval);
  }, [isZenModeActive]);

  // Monitor browser fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcut support in Zen Mode: Space = Play/Pause
  useEffect(() => {
    if (!isZenModeActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        if (activeTimer.isRunning) {
          pauseTimer();
          if (isAmbientPlaying) stopAmbient();
        } else {
          playCue('session_start');
          resumeTimer();
          if (soundSettings.ambientType !== 'none' && soundSettings.ambientAutoPlayOnFocus && !isAmbientPlaying) {
            startAmbient();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenModeActive, activeTimer.isRunning, pauseTimer, resumeTimer, isAmbientPlaying, stopAmbient, startAmbient, soundSettings, playCue]);

  if (!isZenModeActive) return null;

  const isStopwatch = activeTimer.mode === 'stopwatch';
  const isBreak = activeTimer.mode === 'short_break' || activeTimer.mode === 'long_break';

  let timeFormatted = '00:00';
  let progressRatio = 0;
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  let strokeDashoffset = circumference;

  if (isStopwatch) {
    const elapsed = activeTimer.stopwatchElapsedSeconds || 0;
    const hours = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;
    if (hours > 0) {
      timeFormatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
      timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    progressRatio = (elapsed % 60) / 60;
    strokeDashoffset = circumference - progressRatio * circumference;
  } else {
    const totalSeconds = activeTimer.initialDurationSeconds || 25 * 60;
    const remainingSeconds = activeTimer.secondsRemaining;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    progressRatio = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
    strokeDashoffset = circumference - progressRatio * circumference;
  }

  const subject = subjects.find(s => s.id === activeTimer.subjectId);
  const task = tasks.find(t => t.id === activeTimer.taskId);

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleTimer = () => {
    if (activeTimer.isRunning) {
      pauseTimer();
      if (isAmbientPlaying) stopAmbient();
    } else {
      if (isBreak) {
        playCue('break_start');
      } else {
        playCue('session_start');
        if (soundSettings.ambientType !== 'none' && soundSettings.ambientAutoPlayOnFocus && !isAmbientPlaying) {
          startAmbient();
        }
      }
      resumeTimer();
    }
  };

  const handleFinishEarly = async () => {
    try {
      const result = await finishCurrentTimerSession();
      if (result.sessionId && result.durationMinutes >= 1) {
        showSuccess(`Zen session saved (+${result.durationMinutes} XP)! 🎉`, 'Session Saved');
      } else if (result.durationMinutes < 1 && !isBreak) {
        showInfo('Zen session ended under 1 full minute. 1 XP is earned per completed minute.', 'Session Logged');
      }
      playCue('session_complete');
      if (isAmbientPlaying) stopAmbient();
      exitZenMode();
    } catch (err) {
      showError(err, 'Failed to complete focus session');
    }
  };

  const ambientOptions: { type: AmbientSoundType; label: string; icon: string }[] = [
    { type: 'none', label: 'Off', icon: '🔇' },
    { type: 'rain', label: 'Gentle Rain', icon: '🌧️' },
    { type: 'forest_stream', label: 'Forest Stream', icon: '🌲' },
    { type: 'cafe', label: 'Cozy Cafe', icon: '☕' },
    { type: 'white_noise', label: 'White Noise', icon: '📻' },
    { type: 'pink_noise', label: 'Pink Noise', icon: '🌊' },
    { type: 'brown_noise', label: 'Deep Brown Noise', icon: '⚡' },
    { type: 'binaural_alpha', label: 'Alpha Waves', icon: '🧠' },
  ];

  return (
    <div 
      className="fixed inset-0 z-[99999] flex flex-col justify-between select-none overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: '#050814',
        color: '#f8fafc',
        backgroundImage: 'radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.04) 40%, rgba(5, 8, 20, 1) 100%)'
      }}
      role="region"
      aria-label="Zen Mode Distraction-Free Focus Environment"
    >
      {/* Subtle Focus Flow Ambient Ring Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full pointer-events-none blur-3xl opacity-20 transition-all duration-1000"
        style={{
          backgroundColor: isBreak ? '#10b981' : isStopwatch ? '#6366f1' : activeTimer.isRunning ? '#10b981' : '#6366f1'
        }}
      />

      {/* TOP BAR */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {/* Left: Zen Status indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-bold text-emerald-400 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">Zen Mode • Distractions Blocked</span>
            <span className="xs:hidden">Zen Mode</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Streak: {userProfile?.streakCount || 1}d</span>
          </div>
        </div>

        {/* Right: Sound Controls, Fullscreen & Exit */}
        <div className="flex items-center gap-2 relative">
          {/* Ambient Sound Menu */}
          <div className="relative">
            <button
              onClick={() => setShowAudioMenu(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-all touch-target cursor-pointer"
              title="Ambient soundscapes"
            >
              <Music className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {soundSettings.ambientType === 'none' ? 'Sound' : soundSettings.ambientType.replace('_', ' ')}
              </span>
            </button>

            {showAudioMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 p-3 shadow-2xl z-20 space-y-2 animate-scale-up"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Ambient Audio</span>
                  <button 
                    onClick={toggleMasterSound}
                    className="hover:text-white cursor-pointer"
                  >
                    {soundSettings.masterEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {ambientOptions.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => {
                        setAmbientType(opt.type);
                        if (opt.type !== 'none' && !isAmbientPlaying) {
                          startAmbient(opt.type);
                        } else if (opt.type === 'none') {
                          stopAmbient();
                        }
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        soundSettings.ambientType === opt.type 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </span>
                      {soundSettings.ambientType === opt.type && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>

                {soundSettings.ambientType !== 'none' && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Volume</span>
                      <span>{Math.round(soundSettings.ambientVolume)}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={soundSettings.ambientVolume}
                      onChange={(e) => setAmbientVolume(Number(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Browser Fullscreen Toggle */}
          <button
            onClick={toggleNativeFullscreen}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all touch-target cursor-pointer"
            title={isFullscreen ? 'Exit native full screen' : 'Expand full screen'}
            aria-label="Toggle native fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Zen Mode Button */}
          <button
            onClick={() => {
              if (activeTimer.isRunning) {
                setShowExitConfirm(true);
              } else {
                exitZenMode();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-red-500/20 hover:text-red-300 border border-slate-800 text-xs font-semibold text-slate-300 transition-all touch-target cursor-pointer"
            title="Leave Zen mode and return to dashboard"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit Zen</span>
          </button>
        </div>
      </header>

      {/* CENTER: IMMERSIVE TIMER & TASK FOCUS */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto text-center space-y-6 sm:space-y-8 flex-1">
        {/* Subject & Task Indicator */}
        <div className="space-y-2 max-w-lg">
          {subject && (
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: subject.color || '#10b981',
                color: '#f8fafc'
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color || '#10b981' }} />
              <span>{subject.name}</span>
            </div>
          )}

          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-100 max-w-xl truncate px-2">
            {isBreak 
              ? (activeTimer.mode === 'long_break' ? '🌴 Long Refresh Break' : '☕ Short Rest Break')
              : task 
              ? task.title 
              : 'Deep Focus Session'}
          </h1>
        </div>

        {/* Circular Timer Display */}
        <div className="relative flex items-center justify-center my-2 max-w-full">
          <svg className="w-60 h-60 xs:w-72 xs:h-72 sm:w-88 sm:h-88 transform -rotate-90 max-w-full">
            {/* Track Background */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-slate-800/60"
            />
            {/* Progress Stroke */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="url(#zenGradient)"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="zenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Digital Clock */}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 sm:space-y-2">
            <span className="text-4xl xs:text-5xl sm:text-7xl font-mono font-black tracking-tight text-white drop-shadow-md">
              {timeFormatted}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-widest">
              {isBreak 
                ? 'Break Time (Resting)' 
                : activeTimer.isRunning 
                ? (isStopwatch ? 'Stopwatch Elapsed' : 'Flowing in Focus') 
                : 'Session Paused'}
            </span>
            <span className="text-[11px] font-mono text-emerald-400/90 font-medium">
              {isBreak ? (
                <span className="text-slate-500">0 XP (Break Time)</span>
              ) : isStopwatch ? (
                `+${Math.floor((activeTimer.stopwatchElapsedSeconds || 0) / 60)} XP Earned`
              ) : (
                `+${Math.floor((activeTimer.accumulatedFocusedSeconds + (activeTimer.isRunning && activeTimer.phase === 'focus' && activeTimer.focusSegmentStartTime ? Math.max(0, Math.floor((Date.now() - activeTimer.focusSegmentStartTime) / 1000)) : 0)) / 60)} XP Earned`
              )}
            </span>
          </div>
        </div>

        {/* Affirmation / Mindful Quote or Break Prompt */}
        {isBreak ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs sm:text-sm text-emerald-300 italic max-w-md mx-auto leading-relaxed px-4">
              Rest your eyes, hydrate, and stretch. Breaks prepare your brain for optimal learning.
            </p>
            <button
              onClick={skipBreak}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Skip Break & Start Focus</span>
            </button>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-400 italic max-w-md mx-auto leading-relaxed px-4 animate-fade-in key={quoteIndex}">
            "{ZEN_AFFIRMATIONS[quoteIndex]}"
          </p>
        )}

        {/* Main Controls */}
        <div className="flex items-center gap-3 sm:gap-4 pt-2">
          {/* Primary Play / Pause Button */}
          <button
            onClick={handleToggleTimer}
            className={`flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-bold shadow-xl transition-all hover:scale-105 active:scale-95 touch-target cursor-pointer ${
              activeTimer.isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {activeTimer.isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Resume</span>
              </>
            )}
          </button>

          {/* Complete & Log Session */}
          <button
            onClick={handleFinishEarly}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 text-xs font-semibold text-emerald-300 transition-all hover:scale-105 active:scale-95 touch-target cursor-pointer"
            title="Finish and log studied minutes to your streak"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Finish</span>
          </button>
        </div>
      </main>

      {/* BOTTOM FOOTER */}
      <footer className="relative z-10 flex items-center justify-between p-4 sm:p-8 max-w-7xl w-full mx-auto text-xs text-slate-500 border-t border-slate-900/60">
        <div className="flex items-center gap-2 font-mono">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Total Today: {todayStudyMinutes} min focus</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300">Space</kbd>
          <span>to Pause / Resume</span>
        </div>
      </footer>

      {/* Confirmation Dialog on Early Exit during running timer */}
      {showExitConfirm && (
        <div 
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 animate-fade-in"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-slate-100 animate-scale-up">
            <h3 className="text-base font-bold">Exit Zen Focus Mode?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your focus session is currently running. You can keep the timer running in the background on your dashboard, or log your completed minutes now.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  exitZenMode();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Keep Timer in Background & Return to Dashboard
              </button>

              <button
                onClick={async () => {
                  setShowExitConfirm(false);
                  await handleFinishEarly();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                Log Session & Exit
              </button>

              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Continue Zen Focus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
