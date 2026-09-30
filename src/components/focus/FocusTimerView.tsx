import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Clock, 
  BookOpen, 
  Flame, 
  CheckSquare, 
  History,
  Coffee,
  Maximize2,
  Shield,
  FastForward,
  Timer,
  Settings2
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { useSound } from '../../context/SoundContext';
import { useGamification } from '../../context/GamificationContext';
import { FocusMode } from '../../types';
import { AmbientSoundControl } from './AmbientSoundControl';

export const FocusTimerView: React.FC = () => {
  const { 
    activeTimer, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    skipBreak,
    finishCurrentTimerSession,
    setIsZenModeActive,
    pomodoroSettings,
    updatePomodoroSettings,
    subjects,
    tasks,
    focusSessions,
    todayStudyMinutes
  } = useStudy();
  
  const { showSuccess, showError, showInfo } = useToast();
  const { awardFocusSessionXp } = useGamification();
  const { 
    soundSettings, 
    toggleMasterSound, 
    playCue, 
    isAmbientPlaying, 
    startAmbient, 
    stopAmbient,
    isLocalMusicPlaying,
    pauseLocalMusic,
  } = useSound();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeTimer.subjectId || '');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTimer.taskId || '');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Sync selected task & subject if activeTimer changes
  useEffect(() => {
    if (activeTimer.subjectId) setSelectedSubjectId(activeTimer.subjectId);
    if (activeTimer.taskId) setSelectedTaskId(activeTimer.taskId);
  }, [activeTimer.subjectId, activeTimer.taskId]);

  const isStopwatch = activeTimer.mode === 'stopwatch';
  const isBreak = activeTimer.mode === 'short_break' || activeTimer.mode === 'long_break';

  // Time calculations
  let timeFormatted = '00:00';
  let progressRatio = 0;
  const radius = 120;
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
    // Rotating second pulse
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

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const currentTask = tasks.find(t => t.id === selectedTaskId);

  const handleSelectPreset = (mode: FocusMode, mins?: number) => {
    if (mode === 'short_break' || mode === 'long_break') {
      playCue('break_start');
    } else {
      playCue('session_start');
      if (soundSettings.ambientType !== 'none' && soundSettings.ambientAutoPlayOnFocus && !isAmbientPlaying) {
        startAmbient();
      }
    }
    startTimer(mode, mins, selectedSubjectId, selectedTaskId);
  };

  const handleStartOrResume = () => {
    if (isBreak) {
      playCue('break_start');
    } else {
      playCue('session_start');
      if (soundSettings.ambientType !== 'none' && soundSettings.ambientAutoPlayOnFocus && !isAmbientPlaying) {
        startAmbient();
      }
    }
    
    if (!isStopwatch && activeTimer.secondsRemaining === activeTimer.initialDurationSeconds) {
      startTimer(activeTimer.mode, Math.max(1, Math.round(activeTimer.initialDurationSeconds / 60)), selectedSubjectId, selectedTaskId);
    } else {
      resumeTimer();
    }
  };

  const handlePause = () => {
    pauseTimer();
    if (isAmbientPlaying) {
      stopAmbient();
    }
  };

  const handleReset = () => {
    resetTimer();
    if (isAmbientPlaying) {
      stopAmbient();
    }
  };

  const handleFinish = async () => {
    try {
      const result = await finishCurrentTimerSession(sessionNotes);
      if (result.sessionId && result.durationMinutes >= 1) {
        showSuccess(`Logged ${result.durationMinutes} focus minutes (+${result.durationMinutes} XP)! 🎉`, 'Session Saved');
      } else if (result.durationMinutes < 1 && !isBreak) {
        showInfo('Focus session ended under 1 full minute. 1 XP is earned per completed minute.', 'Session Finished');
      }
      setSessionNotes('');
      if (isAmbientPlaying) {
        stopAmbient();
      }
      playCue('session_complete');
    } catch (err) {
      showError(err, 'Failed to log focus session.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--color-text-primary)' }}>
            <span>Focus Mode</span>
            <span 
              className="text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{
                backgroundColor: isBreak ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-accent-subtle)',
                borderColor: 'var(--color-border-default)',
                color: isBreak ? '#10b981' : 'var(--color-accent-subtle-text)'
              }}
            >
              {isBreak ? 'Break Phase (Resting)' : isStopwatch ? 'Stopwatch Mode' : 'Flow State'}
            </span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Eliminate distractions with structured study blocks, soothing soundscapes, and scientific intervals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zen Fullscreen Button */}
          <button
            onClick={() => {
              setIsZenModeActive(true);
              if (document.documentElement && document.documentElement.requestFullscreen && !document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:scale-105 active:scale-95 touch-target cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            }}
            title="Launch distraction-free Zen Focus Mode"
          >
            <Shield className="w-4 h-4" />
            <span>Zen Fullscreen</span>
          </button>

          {/* Quick Settings Toggle */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors touch-target cursor-pointer"
            style={{
              backgroundColor: showSettingsDrawer ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: showSettingsDrawer ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
            }}
            title="Configure Pomodoro Durations"
          >
            <Settings2 className="w-4 h-4" />
            <span>Intervals</span>
          </button>

          {/* Master Sound Button */}
          <button
            onClick={toggleMasterSound}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors touch-target cursor-pointer"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: soundSettings.masterEnabled ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
            }}
            aria-label={soundSettings.masterEnabled ? "Mute all audio" : "Enable audio"}
          >
            {soundSettings.masterEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundSettings.masterEnabled ? `Sound (${soundSettings.volume}%)` : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Interval Customizer Drawer */}
      {showSettingsDrawer && (
        <div 
          className="p-5 rounded-2xl border shadow-sm space-y-4 animate-scale-up"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border-default)' }}>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold">Customize Pomodoro Intervals</span>
            </div>
            <span className="text-xs text-slate-500">Auto-saved to your study profile</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-500">Focus Duration</label>
              <select
                value={pomodoroSettings.focusDurationMinutes}
                onChange={(e) => updatePomodoroSettings({ focusDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-default)' }}
              >
                {[15, 20, 25, 30, 45, 50, 60].map(m => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-500">Short Break</label>
              <select
                value={pomodoroSettings.shortBreakDurationMinutes}
                onChange={(e) => updatePomodoroSettings({ shortBreakDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-default)' }}
              >
                {[3, 5, 8, 10, 15].map(m => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-500">Long Break</label>
              <select
                value={pomodoroSettings.longBreakDurationMinutes}
                onChange={(e) => updatePomodoroSettings({ longBreakDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-default)' }}
              >
                {[10, 15, 20, 25, 30].map(m => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-500">Long Break Interval</label>
              <select
                value={pomodoroSettings.longBreakInterval}
                onChange={(e) => updatePomodoroSettings({ longBreakInterval: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-default)' }}
              >
                {[2, 3, 4, 5, 6].map(i => (
                  <option key={i} value={i}>Every {i} pomodoros</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pomodoroSettings.autoStartBreaks}
                onChange={(e) => updatePomodoroSettings({ autoStartBreaks: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Auto-start Breaks when Focus completes</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pomodoroSettings.autoStartPomodoros}
                onChange={(e) => updatePomodoroSettings({ autoStartPomodoros: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Auto-start next Focus when Break completes</span>
            </label>
          </div>
        </div>
      )}

      {/* Break Mode Notice Banner */}
      {isBreak && (
        <div 
          className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderColor: 'rgba(16, 185, 129, 0.25)',
            color: 'var(--color-text-primary)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                {activeTimer.mode === 'long_break' ? '🌴 Long Refresh Break in Progress' : '☕ Short Rest Break in Progress'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Rest and recharge your mind. Breaks award 0 XP and do not contribute to study time.
              </div>
            </div>
          </div>

          <button
            onClick={skipBreak}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs touch-target cursor-pointer shrink-0"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip Break & Focus</span>
          </button>
        </div>
      )}

      {/* Main Timer Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Timer Console (8 cols) */}
        <div 
          className="lg:col-span-8 rounded-3xl border shadow-sm p-3.5 xs:p-5 sm:p-10 flex flex-col items-center"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-default)',
            color: 'var(--color-text-primary)'
          }}
        >
          {/* Preset Mode Tabs */}
          <div 
            className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1.5 rounded-2xl mb-6 sm:mb-8 w-full max-w-xl border overflow-x-auto"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border-default)'
            }}
            role="tablist"
            aria-label="Timer presets"
          >
            <button
              role="tab"
              aria-selected={activeTimer.mode === 'pomodoro'}
              onClick={() => handleSelectPreset('pomodoro', pomodoroSettings.focusDurationMinutes)}
              className="py-2.5 px-2 text-xs font-bold rounded-xl transition-all touch-target text-center cursor-pointer"
              style={{
                backgroundColor: activeTimer.mode === 'pomodoro' ? 'var(--color-bg-surface)' : 'transparent',
                color: activeTimer.mode === 'pomodoro' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                boxShadow: activeTimer.mode === 'pomodoro' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              🍅 Pomodoro ({pomodoroSettings.focusDurationMinutes}m)
            </button>
            <button
              role="tab"
              aria-selected={activeTimer.mode === 'short_break'}
              onClick={() => handleSelectPreset('short_break', pomodoroSettings.shortBreakDurationMinutes)}
              className="py-2.5 px-2 text-xs font-bold rounded-xl transition-all touch-target text-center cursor-pointer"
              style={{
                backgroundColor: activeTimer.mode === 'short_break' ? 'var(--color-bg-surface)' : 'transparent',
                color: activeTimer.mode === 'short_break' ? '#059669' : 'var(--color-text-secondary)',
                boxShadow: activeTimer.mode === 'short_break' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              ☕ Break ({pomodoroSettings.shortBreakDurationMinutes}m)
            </button>
            <button
              role="tab"
              aria-selected={activeTimer.mode === 'long_break'}
              onClick={() => handleSelectPreset('long_break', pomodoroSettings.longBreakDurationMinutes)}
              className="py-2.5 px-2 text-xs font-bold rounded-xl transition-all touch-target text-center cursor-pointer"
              style={{
                backgroundColor: activeTimer.mode === 'long_break' ? 'var(--color-bg-surface)' : 'transparent',
                color: activeTimer.mode === 'long_break' ? '#0891b2' : 'var(--color-text-secondary)',
                boxShadow: activeTimer.mode === 'long_break' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              🌴 Long ({pomodoroSettings.longBreakDurationMinutes}m)
            </button>
            <button
              role="tab"
              aria-selected={activeTimer.mode === 'stopwatch'}
              onClick={() => handleSelectPreset('stopwatch', 0)}
              className="py-2.5 px-2 text-xs font-bold rounded-xl transition-all touch-target text-center cursor-pointer"
              style={{
                backgroundColor: activeTimer.mode === 'stopwatch' ? 'var(--color-bg-surface)' : 'transparent',
                color: activeTimer.mode === 'stopwatch' ? '#6366f1' : 'var(--color-text-secondary)',
                boxShadow: activeTimer.mode === 'stopwatch' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              ⏱️ Stopwatch
            </button>
            <button
              role="tab"
              aria-selected={activeTimer.mode === 'custom'}
              onClick={() => handleSelectPreset('custom', customMinutes)}
              className="py-2.5 px-2 text-xs font-bold rounded-xl transition-all touch-target text-center cursor-pointer col-span-3 sm:col-span-1"
              style={{
                backgroundColor: activeTimer.mode === 'custom' ? 'var(--color-bg-surface)' : 'transparent',
                color: activeTimer.mode === 'custom' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                boxShadow: activeTimer.mode === 'custom' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              ⚡ Custom ({customMinutes}m)
            </button>
          </div>

          {/* Pre-Session Custom Duration Picker (Configurable before starting) */}
          {activeTimer.mode === 'custom' && !activeTimer.isRunning && activeTimer.secondsRemaining === activeTimer.initialDurationSeconds && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5 animate-fade-in">
              <span className="text-xs font-semibold mr-1" style={{ color: 'var(--color-text-secondary)' }}>
                Set Duration:
              </span>
              {[10, 15, 20, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setCustomMinutes(mins);
                    startTimer('custom', mins, selectedSubjectId, selectedTaskId);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    customMinutes === mins
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}

          {/* Pomodoro Cycle Indicator */}
          {activeTimer.mode === 'pomodoro' && (
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                🍅 Cycle: <strong>{(activeTimer.pomodoroCycleCount % pomodoroSettings.longBreakInterval) + 1}</strong> of <strong>{pomodoroSettings.longBreakInterval}</strong>
              </span>
              <span>•</span>
              <span>
                Next: {((activeTimer.pomodoroCycleCount + 1) % pomodoroSettings.longBreakInterval === 0) ? `Long Break (${pomodoroSettings.longBreakDurationMinutes}m)` : `Short Break (${pomodoroSettings.shortBreakDurationMinutes}m)`}
              </span>
            </div>
          )}

          {/* Big Circular Timer Display */}
          <div 
            className="relative w-56 h-56 xs:w-64 xs:h-64 sm:w-80 sm:h-80 aspect-square max-w-full flex items-center justify-center mb-5 sm:mb-8 shrink-0"
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`${timeFormatted} elapsed or remaining`}
          >
            <svg 
              viewBox="0 0 300 300" 
              className="w-full h-full aspect-square -rotate-90 origin-center select-none pointer-events-none"
            >
              <circle
                cx="150"
                cy="150"
                r={radius}
                className="fill-none transition-colors"
                style={{ stroke: 'var(--color-timer-track)' }}
                strokeWidth="14"
              />
              <circle
                cx="150"
                cy="150"
                r={radius}
                className="fill-none transition-all duration-300 ease-linear"
                style={{
                  stroke: isBreak ? '#10b981' : isStopwatch ? '#6366f1' : 'var(--color-accent-primary)',
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
                strokeWidth="14"
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-between text-center p-4 xs:p-6 sm:p-8 pointer-events-none">
              {/* Top slot: Mode indicator */}
              <div className="flex-1 flex items-end justify-center pb-1">
                <span 
                  className="text-[10px] xs:text-[11px] sm:text-xs font-bold uppercase tracking-widest px-2 xs:px-2.5 py-0.5 rounded-full border"
                  style={{ 
                    backgroundColor: isBreak ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-accent-subtle)',
                    borderColor: 'var(--color-border-default)',
                    color: isBreak ? '#10b981' : 'var(--color-accent-subtle-text)'
                  }}
                >
                  {isStopwatch ? 'Stopwatch' : activeTimer.mode.replace('_', ' ')}
                </span>
              </div>

              {/* Center Anchor: Timer Digits */}
              <div className="shrink-0 flex flex-col items-center justify-center my-auto">
                <span 
                  className="text-3xl xs:text-4xl sm:text-6xl font-extrabold tracking-tight font-mono leading-none tabular-nums select-text pointer-events-auto" 
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {timeFormatted}
                </span>

                {/* XP Reward Preview */}
                <div className="text-[11px] font-semibold mt-2 font-mono">
                  {isBreak ? (
                    <span className="text-slate-400">0 XP (Break Mode)</span>
                  ) : isStopwatch ? (
                    <span className="text-indigo-600 dark:text-indigo-400">
                      +{Math.floor((activeTimer.stopwatchElapsedSeconds || 0) / 60)} XP Earned (1 XP/min)
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      +{Math.floor((activeTimer.accumulatedFocusedSeconds + (activeTimer.isRunning && activeTimer.phase === 'focus' && activeTimer.focusSegmentStartTime ? Math.max(0, Math.floor((Date.now() - activeTimer.focusSegmentStartTime) / 1000)) : 0)) / 60)} XP Earned (1 XP/min)
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom slot: Subject / Task Indicators */}
              <div className="flex-1 flex flex-col items-center justify-start pt-1.5 space-y-1">
                {currentSubject && (
                  <span 
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold max-w-[180px] sm:max-w-[220px] truncate"
                    style={{ backgroundColor: `${currentSubject.color}20`, color: currentSubject.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: currentSubject.color }} />
                    <span className="truncate">{currentSubject.name}</span>
                  </span>
                )}

                {currentTask && (
                  <span className="text-[11px] sm:text-xs font-medium max-w-[160px] sm:max-w-[200px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    🎯 {currentTask.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button Controls */}
          <div className="flex items-center gap-3 sm:gap-4 w-full max-w-sm justify-center mb-6">
            <button
              onClick={handleReset}
              className="p-3.5 rounded-2xl border transition-all touch-target flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)'
              }}
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {activeTimer.isRunning ? (
              <button
                onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-amber-500/20 transition-all active:scale-95 touch-target cursor-pointer"
                aria-label="Pause Timer"
              >
                <Pause className="w-5 h-5 fill-white" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleStartOrResume}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl font-bold text-sm sm:text-base shadow-lg transition-all active:scale-95 touch-target cursor-pointer"
                style={{
                  backgroundColor: isBreak ? '#10b981' : isStopwatch ? '#6366f1' : 'var(--color-accent-primary)',
                  color: '#ffffff'
                }}
                aria-label="Start or Resume Timer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {isStopwatch 
                    ? (activeTimer.stopwatchElapsedSeconds ? 'Resume Stopwatch' : 'Start Stopwatch')
                    : activeTimer.secondsRemaining === activeTimer.initialDurationSeconds 
                      ? (isBreak ? 'Start Break' : 'Begin Focus') 
                      : 'Resume'}
                </span>
              </button>
            )}

            <button
              onClick={handleFinish}
              className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all touch-target flex items-center justify-center cursor-pointer"
              title="Finish & Save Session"
              aria-label="Finish and Save Session"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>

          {/* Session Details / Subject & Task Picker */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
            <div>
              <label htmlFor="focus-subject-select" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Assign Subject
              </label>
              <select
                id="focus-subject-select"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="">No subject assigned</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="focus-task-select" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Focus on Task
              </label>
              <select
                id="focus-task-select"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="">No specific task</option>
                {tasks.filter(t => t.status === 'pending').map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="focus-notes" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Session Notes (Optional)
              </label>
              <input
                id="focus-notes"
                type="text"
                placeholder="What did you accomplish in this study session?"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Ambient Soundscape & Recent Focus (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Ambient Sound Control Card */}
          <AmbientSoundControl />

          {/* Today Study Stat Card */}
          <div 
            className="p-5 rounded-2xl border shadow-sm space-y-3"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Today's Focus Time</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                +{todayStudyMinutes} XP Earned
              </span>
            </div>
            <div className="text-2xl font-black font-mono">
              {Math.floor(todayStudyMinutes / 60)}h {todayStudyMinutes % 60}m
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Every completed focus minute awards 1 XP toward your level and mastery rank.
            </p>
          </div>

          {/* Recent Completed Sessions */}
          <div 
            className="p-5 rounded-2xl border shadow-sm space-y-3"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Recent Study Sessions</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">{focusSessions.length} total</span>
            </div>

            {focusSessions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No focus sessions logged yet today. Hit Begin Focus to start!
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {focusSessions.slice(0, 4).map((s) => {
                  const sub = subjects.find(sub => sub.id === s.subjectId);
                  const timeAgo = s.completedAt ? new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div 
                      key={s.id}
                      className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                      style={{
                        backgroundColor: 'var(--color-bg-subtle)',
                        borderColor: 'var(--color-border-default)'
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: sub?.color || '#10b981' }} 
                        />
                        <span className="font-semibold truncate max-w-[120px]">
                          {sub?.name || 'General Focus'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{s.durationMinutes}m ({s.durationMinutes} XP)
                        </span>
                        <span className="text-[10px] text-slate-400">{timeAgo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
