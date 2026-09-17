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
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
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
    adjustTimerTime, 
    finishCurrentTimerSession,
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
    stopAmbient 
  } = useSound();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeTimer.subjectId || '');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTimer.taskId || '');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [customSliderMinutes, setCustomSliderMinutes] = useState<number>(30);
  const [hasTriggeredComplete, setHasTriggeredComplete] = useState<boolean>(false);

  useEffect(() => {
    if (activeTimer.subjectId) setSelectedSubjectId(activeTimer.subjectId);
    if (activeTimer.taskId) setSelectedTaskId(activeTimer.taskId);
  }, [activeTimer.subjectId, activeTimer.taskId]);

  // Handle timer completion
  useEffect(() => {
    if (activeTimer.secondsRemaining === 0 && !hasTriggeredComplete && activeTimer.initialDurationSeconds > 0) {
      setHasTriggeredComplete(true);
      playCue('session_complete');
      if (isAmbientPlaying) {
        stopAmbient();
      }
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showSuccess('Timer complete! Outstanding focus! 🎉');
    } else if (activeTimer.secondsRemaining > 0) {
      setHasTriggeredComplete(false);
    }
  }, [activeTimer.secondsRemaining, hasTriggeredComplete, activeTimer.initialDurationSeconds, showSuccess, playCue, isAmbientPlaying, stopAmbient]);

  const totalSeconds = activeTimer.initialDurationSeconds || 25 * 60;
  const remainingSeconds = activeTimer.secondsRemaining;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  const progressRatio = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const currentTask = tasks.find(t => t.id === selectedTaskId);

  const handleSelectPreset = (mode: FocusMode, mins: number) => {
    if (mode === 'short_break' || mode === 'long_break') {
      playCue('break_start');
    } else {
      playCue('session_start');
      if (soundSettings.ambientType !== 'none' && soundSettings.ambientAutoPlayOnFocus) {
        startAmbient();
      }
    }
    startTimer(mode, mins, selectedSubjectId, selectedTaskId);
  };

  const handleStartOrResume = () => {
    if (activeTimer.mode === 'short_break' || activeTimer.mode === 'long_break') {
      playCue('break_start');
    } else {
      playCue('session_start');
      if (soundSettings.ambientType !== 'none' && soundSettings.ambientAutoPlayOnFocus && !isAmbientPlaying) {
        startAmbient();
      }
    }
    if (activeTimer.secondsRemaining === totalSeconds) {
      startTimer(activeTimer.mode, Math.max(1, Math.round(totalSeconds / 60)), selectedSubjectId, selectedTaskId);
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
        await awardFocusSessionXp(result.sessionId, result.durationMinutes);
      } else if (result.durationMinutes < 1) {
        showInfo('Focus session ended before 1 full minute. 1 XP is awarded per completed minute.', 'Focus Session Ended');
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
                backgroundColor: 'var(--color-accent-subtle)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-accent-subtle-text)'
              }}
            >
              Flow State
            </span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Eliminate distractions with structured study blocks, soothing soundscapes, and scientific intervals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMasterSound}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors touch-target"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: soundSettings.masterEnabled ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
            }}
            aria-label={soundSettings.masterEnabled ? "Mute all audio" : "Enable audio"}
          >
            {soundSettings.masterEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundSettings.masterEnabled ? `Sound On (${soundSettings.volume}%)` : 'Sound Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Timer Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Timer Console (8 cols) */}
        <div 
          className="lg:col-span-8 rounded-3xl border shadow-sm p-5 sm:p-10 flex flex-col items-center"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border-default)',
            color: 'var(--color-text-primary)'
          }}
        >
          {/* Preset Mode Tabs - Touch Scrollable on Mobile */}
          <div 
            className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl mb-6 sm:mb-8 w-full max-w-lg border"
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
              onClick={() => handleSelectPreset('pomodoro', 25)}
              className="py-2.5 px-2 text-xs font-bold rounded-xl transition-all touch-target text-center"
              style={{
                backgroundColor: activeTimer.mode === 'pomodoro' ? 'var(--color-bg-surface)' : 'transparent',
                color: activeTimer.mode === 'pomodoro' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                boxShadow: activeTimer.mode === 'pomodoro' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Pomodoro (25m)
            </button>
            <button
              role="tab"
              aria-selected={activeTimer.mode === 'short_break'}
              onClick={() => handleSelectPreset('short_break', 5)}
              className="py-2.5 px-2 text-xs font-bold rounded-xl transition-all touch-target text-center"
              style={{
                backgroundColor: activeTimer.mode === 'short_break' ? 'var(--color-bg-surface)' : 'transparent',
                color: activeTimer.mode === 'short_break' ? '#059669' : 'var(--color-text-secondary)',
                boxShadow: activeTimer.mode === 'short_break' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Break (5m)
            </button>
            <button
              role="tab"
              aria-selected={activeTimer.mode === 'long_break'}
              onClick={() => handleSelectPreset('long_break', 15)}
              className="py-2.5 px-2 text-xs font-bold rounded-xl transition-all touch-target text-center"
              style={{
                backgroundColor: activeTimer.mode === 'long_break' ? 'var(--color-bg-surface)' : 'transparent',
                color: activeTimer.mode === 'long_break' ? '#0891b2' : 'var(--color-text-secondary)',
                boxShadow: activeTimer.mode === 'long_break' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Long Break (15m)
            </button>
            <button
              role="tab"
              aria-selected={activeTimer.mode === 'custom'}
              onClick={() => handleSelectPreset('custom', 50)}
              className="py-2.5 px-2 text-xs font-bold rounded-xl transition-all touch-target text-center"
              style={{
                backgroundColor: activeTimer.mode === 'custom' ? 'var(--color-bg-surface)' : 'transparent',
                color: activeTimer.mode === 'custom' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                boxShadow: activeTimer.mode === 'custom' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Deep (50m)
            </button>
          </div>

          {/* Big Circular Timer Display (Responsive SVG viewport) */}
          <div 
            className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mb-6 sm:mb-8"
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
          >
            <svg viewBox="0 0 300 300" className="w-full h-full -rotate-90">
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
                  stroke: 'var(--color-accent-primary)',
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
                strokeWidth="14"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <span className="text-4xl sm:text-6xl font-extrabold tracking-tight font-mono" style={{ color: 'var(--color-text-primary)' }}>
                {timeFormatted}
              </span>
              <span 
                className="text-xs font-bold uppercase tracking-wider mt-1 sm:mt-2"
                style={{ color: 'var(--color-accent-primary)' }}
              >
                {activeTimer.mode.replace('_', ' ')}
              </span>

              {currentSubject && (
                <span 
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: `${currentSubject.color}20`, color: currentSubject.color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentSubject.color }} />
                  {currentSubject.name}
                </span>
              )}

              {currentTask && (
                <span className="mt-1 text-xs font-medium max-w-[180px] sm:max-w-[220px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                  🎯 {currentTask.title}
                </span>
              )}
            </div>
          </div>

          {/* Fine adjustment controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8" aria-label="Quick minute adjustments">
            {[-300, -60, 60, 300].map((adj) => (
              <button
                key={adj}
                onClick={() => adjustTimerTime(adj)}
                className="px-3.5 py-2 rounded-xl border text-xs font-bold transition-all touch-target"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
                aria-label={adj > 0 ? `Add ${adj / 60} minutes` : `Subtract ${Math.abs(adj / 60)} minutes`}
              >
                {adj > 0 ? `+${adj / 60}m` : `${adj / 60}m`}
              </button>
            ))}
          </div>

          {/* Action Button Controls */}
          <div className="flex items-center gap-3 sm:gap-4 w-full max-w-sm justify-center mb-6">
            <button
              onClick={handleReset}
              className="p-3.5 rounded-2xl border transition-all touch-target flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)'
              }}
              title="Reset Timer (r)"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {activeTimer.isRunning ? (
              <button
                onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-amber-500/20 transition-all active:scale-95 touch-target"
                aria-label="Pause Timer (Space)"
              >
                <Pause className="w-5 h-5 fill-white" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleStartOrResume}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl font-bold text-sm sm:text-base shadow-lg transition-all active:scale-95 touch-target"
                style={{
                  backgroundColor: 'var(--color-accent-primary)',
                  color: 'var(--color-accent-fg)'
                }}
                aria-label="Start or Resume Timer (Space)"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{activeTimer.secondsRemaining === totalSeconds ? 'Begin Focus' : 'Resume'}</span>
              </button>
            )}

            <button
              onClick={handleFinish}
              className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all touch-target flex items-center justify-center"
              title="Finish & Log Early"
              aria-label="Finish and Log Session Early"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>

          {/* Session details logger */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
            <div>
              <label htmlFor="focus-subject-select" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Assign Subject
              </label>
              <select
                id="focus-subject-select"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs touch-target focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="">No Subject (General)</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="focus-task-select" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Link Task
              </label>
              <select
                id="focus-task-select"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs touch-target focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="">No linked task</option>
                {tasks.filter(t => t.status !== 'completed').map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="focus-notes-input" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Session Reflection / Notes
              </label>
              <input
                id="focus-notes-input"
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="E.g. Completed Chapter 4 exercises, reviewed formulas"
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs touch-target focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Info Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Ambient Focus Sounds Card */}
          <AmbientSoundControl />

          {/* Custom Duration Slider */}
          <div 
            className="rounded-3xl border shadow-xs p-6"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="custom-duration-slider" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Custom Duration
              </label>
              <span className="text-xs font-bold" style={{ color: 'var(--color-accent-primary)' }}>{customSliderMinutes} minutes</span>
            </div>
            <input
              id="custom-duration-slider"
              type="range"
              min="5"
              max="120"
              step="5"
              value={customSliderMinutes}
              onChange={(e) => setCustomSliderMinutes(Number(e.target.value))}
              className="w-full cursor-pointer mb-4 touch-target"
              style={{ accentColor: 'var(--color-accent-primary)' }}
              aria-label="Custom Duration in Minutes"
            />
            <button
              onClick={() => handleSelectPreset('custom', customSliderMinutes)}
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-opacity touch-target hover:opacity-90"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
                borderWidth: '1px'
              }}
            >
              Apply {customSliderMinutes}m Timer
            </button>
          </div>

          {/* Today's Focus Stats */}
          <div 
            className="rounded-3xl border shadow-xs p-6"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
              <h3 className="text-sm font-bold">Today's Focus Log</h3>
            </div>

            <div 
              className="flex items-center justify-between p-3.5 rounded-2xl border mb-4"
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                borderColor: 'var(--color-border-default)'
              }}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Total Minutes</span>
              <span className="text-lg font-bold font-mono" style={{ color: 'var(--color-accent-primary)' }}>{todayStudyMinutes}m</span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {focusSessions.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
                  No completed sessions logged yet.
                </p>
              ) : (
                focusSessions.slice(0, 5).map((session) => {
                  const sub = subjects.find(s => s.id === session.subjectId);
                  return (
                    <div 
                      key={session.id} 
                      className="p-3 rounded-xl border flex items-center justify-between text-xs"
                      style={{
                        backgroundColor: 'var(--color-bg-subtle)',
                        borderColor: 'var(--color-border-default)'
                      }}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub?.color || '#6366f1' }} />
                          <span>{sub?.name || 'General'}</span>
                        </div>
                        {session.notes && (
                          <p className="text-[10px] truncate max-w-[150px]" style={{ color: 'var(--color-text-secondary)' }}>{session.notes}</p>
                        )}
                      </div>
                      <span className="font-bold font-mono" style={{ color: 'var(--color-accent-primary)' }}>+{session.durationMinutes}m</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

