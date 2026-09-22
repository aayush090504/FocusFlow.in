import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  X, 
  Volume2, 
  VolumeX, 
  Clock, 
  Shield,
  FastForward,
  Coffee,
  Sparkles
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { useSound } from '../../context/SoundContext';
import { useGamification } from '../../context/GamificationContext';
import { FocusMode } from '../../types';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({ isOpen, onClose }) => {
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
    subjects,
    tasks 
  } = useStudy();

  const { showSuccess, showError, showInfo } = useToast();
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

  // Sync selected task & subject if activeTimer changes
  useEffect(() => {
    if (activeTimer.subjectId) setSelectedSubjectId(activeTimer.subjectId);
    if (activeTimer.taskId) setSelectedTaskId(activeTimer.taskId);
  }, [activeTimer.subjectId, activeTimer.taskId]);

  if (!isOpen) return null;

  const isStopwatch = activeTimer.mode === 'stopwatch';
  const isBreak = activeTimer.mode === 'short_break' || activeTimer.mode === 'long_break';

  let timeFormatted = '00:00';
  let progressRatio = 0;
  const radius = 110;
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

  const handleSelectMode = (mode: FocusMode, mins?: number) => {
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

  const handleFinishAndSave = async () => {
    try {
      const result = await finishCurrentTimerSession(sessionNotes);
      if (result.sessionId && result.durationMinutes >= 1) {
        showSuccess(`Saved ${result.durationMinutes} focus minutes (+${result.durationMinutes} XP)! 🎉`, 'Session Saved');
      } else if (result.durationMinutes < 1 && !isBreak) {
        showInfo('Focus session ended under 1 full minute. 1 XP is earned per completed minute.', 'Focus Session Ended');
      }
      setSessionNotes('');
      if (isAmbientPlaying) {
        stopAmbient();
      }
      playCue('session_complete');
      onClose();
    } catch (err) {
      showError(err, 'Failed to save focus session.');
    }
  };

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Focus Timer</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsZenModeActive(true);
                if (document.documentElement && document.documentElement.requestFullscreen && !document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
              title="Enter Zen Fullscreen Focus Mode"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zen Mode</span>
            </button>
            <button
              type="button"
              onClick={toggleMasterSound}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
              title={soundSettings.masterEnabled ? `Sound Enabled (${soundSettings.volume}%)` : 'Sound Muted'}
              aria-label={soundSettings.masterEnabled ? 'Mute audio' : 'Unmute audio'}
            >
              {soundSettings.masterEnabled ? <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
              aria-label="Close Focus Timer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col items-center overflow-y-auto">
          {/* Preset Mode Buttons */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 w-full max-w-md border border-slate-200/60 dark:border-slate-700 overflow-x-auto">
            <button
              onClick={() => handleSelectMode('pomodoro', pomodoroSettings.focusDurationMinutes)}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTimer.mode === 'pomodoro'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🍅 Pomodoro ({pomodoroSettings.focusDurationMinutes}m)
            </button>
            <button
              onClick={() => handleSelectMode('short_break', pomodoroSettings.shortBreakDurationMinutes)}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTimer.mode === 'short_break'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ☕ Break ({pomodoroSettings.shortBreakDurationMinutes}m)
            </button>
            <button
              onClick={() => handleSelectMode('long_break', pomodoroSettings.longBreakDurationMinutes)}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTimer.mode === 'long_break'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🌴 Long ({pomodoroSettings.longBreakDurationMinutes}m)
            </button>
            <button
              onClick={() => handleSelectMode('stopwatch', 0)}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTimer.mode === 'stopwatch'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ⏱️ Stopwatch
            </button>
          </div>

          {/* Break Mode notice if active */}
          {isBreak && (
            <div className="w-full mb-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
              <div className="flex items-center gap-1.5">
                <Coffee className="w-4 h-4" />
                <span>Break Time (0 XP)</span>
              </div>
              <button
                onClick={skipBreak}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[11px] cursor-pointer"
              >
                <FastForward className="w-3 h-3" />
                <span>Skip Break</span>
              </button>
            </div>
          )}

          {/* Circular SVG Timer */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 aspect-square flex items-center justify-center mb-6 shrink-0">
            <svg 
              viewBox="0 0 256 256" 
              className="w-full h-full aspect-square -rotate-90 origin-center select-none pointer-events-none"
            >
              <circle
                cx="128"
                cy="128"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                strokeWidth="12"
              />
              <circle
                cx="128"
                cy="128"
                r={radius}
                className={`fill-none transition-all duration-300 ease-linear ${
                  isBreak 
                    ? 'stroke-emerald-500' 
                    : isStopwatch 
                    ? 'stroke-indigo-500' 
                    : 'stroke-indigo-600 dark:stroke-indigo-500'
                }`}
                strokeWidth="12"
                strokeLinecap="round"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-between text-center p-4 sm:p-5 pointer-events-none">
              <div className="flex-1 flex items-end justify-center pb-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 capitalize">
                  {isStopwatch ? 'Stopwatch' : activeTimer.mode.replace('_', ' ')}
                </span>
              </div>

              <div className="shrink-0 flex flex-col items-center justify-center my-auto">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono leading-none tabular-nums select-text pointer-events-auto">
                  {timeFormatted}
                </span>
                <span className="text-[10px] font-mono mt-1 font-semibold text-slate-400">
                  {isBreak 
                    ? '0 XP (Break)' 
                    : isStopwatch 
                    ? `+${Math.floor((activeTimer.stopwatchElapsedSeconds || 0) / 60)} XP (1 XP/min)` 
                    : `+${Math.floor((activeTimer.accumulatedFocusedSeconds + (activeTimer.isRunning && activeTimer.phase === 'focus' && activeTimer.focusSegmentStartTime ? Math.max(0, Math.floor((Date.now() - activeTimer.focusSegmentStartTime) / 1000)) : 0)) / 60)} XP`}
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-start pt-1">
                {currentSubject && (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: currentSubject.color }} />
                    <span className="truncate">{currentSubject.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="flex items-center gap-3 w-full max-w-xs justify-center mb-6">
            <button
              onClick={handleReset}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {activeTimer.isRunning ? (
              <button
                onClick={handlePause}
                className="flex-1 py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Pause className="w-5 h-5 fill-white" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleStartOrResume}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isBreak 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                }`}
              >
                <Play className="w-5 h-5 fill-white" />
                <span>
                  {isStopwatch 
                    ? (activeTimer.stopwatchElapsedSeconds ? 'Resume Stopwatch' : 'Start Stopwatch')
                    : activeTimer.secondsRemaining === activeTimer.initialDurationSeconds 
                      ? (isBreak ? 'Start Break' : 'Start Focus') 
                      : 'Resume'}
                </span>
              </button>
            )}

            <button
              onClick={handleFinishAndSave}
              className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
              title="Finish and Save Session"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>

          {/* Subject & Task Selection */}
          <div className="w-full space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium cursor-pointer"
              >
                <option value="">No subject assigned</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Linked Task (Optional)
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium cursor-pointer"
              >
                <option value="">No specific task</option>
                {tasks.filter(t => t.status === 'pending').map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Session Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="What did you focus on?"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
