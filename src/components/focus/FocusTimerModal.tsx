import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  X, 
  Plus, 
  Minus, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Clock, 
  BookOpen, 
  CheckCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { useSound } from '../../context/SoundContext';
import { useGamification } from '../../context/GamificationContext';
import { FocusMode } from '../../types';
import { AmbientSoundControl } from './AmbientSoundControl';

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
    adjustTimerTime, 
    finishCurrentTimerSession,
    subjects,
    tasks
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
  const [hasTriggeredComplete, setHasTriggeredComplete] = useState<boolean>(false);

  // Sync selected task & subject if activeTimer changes
  useEffect(() => {
    if (activeTimer.subjectId) setSelectedSubjectId(activeTimer.subjectId);
    if (activeTimer.taskId) setSelectedTaskId(activeTimer.taskId);
  }, [activeTimer.subjectId, activeTimer.taskId]);

  // Handle timer reaching 0
  useEffect(() => {
    if (activeTimer.secondsRemaining === 0 && !hasTriggeredComplete && activeTimer.initialDurationSeconds > 0) {
      setHasTriggeredComplete(true);
      playCue('session_complete');
      if (isAmbientPlaying) {
        stopAmbient();
      }
      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      showSuccess('Timer complete! Awesome work! 🎉');
    } else if (activeTimer.secondsRemaining > 0) {
      setHasTriggeredComplete(false);
    }
  }, [activeTimer.secondsRemaining, hasTriggeredComplete, activeTimer.initialDurationSeconds, showSuccess, playCue, isAmbientPlaying, stopAmbient]);

  if (!isOpen) return null;

  const totalSeconds = activeTimer.initialDurationSeconds || 25 * 60;
  const remainingSeconds = activeTimer.secondsRemaining;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // Progress calculations for circular progress bar
  const progressRatio = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const handleSelectMode = (mode: FocusMode, mins: number) => {
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

  const handleFinishAndSave = async () => {
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
              onClick={toggleMasterSound}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              title={soundSettings.masterEnabled ? `Sound Enabled (${soundSettings.volume}%)` : 'Sound Muted'}
              aria-label={soundSettings.masterEnabled ? 'Mute audio' : 'Unmute audio'}
            >
              {soundSettings.masterEnabled ? <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              aria-label="Close Focus Timer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col items-center overflow-y-auto">
          {/* Preset Mode Buttons */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 w-full max-w-md border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => handleSelectMode('pomodoro', 25)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTimer.mode === 'pomodoro'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => handleSelectMode('short_break', 5)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTimer.mode === 'short_break'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Short (5m)
            </button>
            <button
              onClick={() => handleSelectMode('long_break', 15)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTimer.mode === 'long_break'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Long (15m)
            </button>
            <button
              onClick={() => handleSelectMode('custom', 50)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTimer.mode === 'custom' && totalSeconds === 50 * 60
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Deep (50m)
            </button>
          </div>

          {/* Circular SVG Timer */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center mb-6">
            <svg className="w-full h-full -rotate-90">
              {/* Background Ring */}
              <circle
                cx="128"
                cy="128"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                strokeWidth="12"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="128"
                cy="128"
                r={radius}
                className={`fill-none transition-all duration-300 ease-linear ${
                  activeTimer.mode === 'short_break' 
                    ? 'stroke-emerald-500' 
                    : activeTimer.mode === 'long_break' 
                    ? 'stroke-teal-500' 
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

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                {timeFormatted}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mt-1 capitalize">
                {activeTimer.mode.replace('_', ' ')}
              </span>
              {currentSubject && (
                <div className="mt-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentSubject.color }} />
                  <span>{currentSubject.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Time Adjustment Controls (+/- 1m) */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => adjustTimerTime(-60)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
              title="Subtract 1 minute"
            >
              -1m
            </button>
            <button
              onClick={() => adjustTimerTime(-300)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
              title="Subtract 5 minutes"
            >
              -5m
            </button>
            <button
              onClick={() => adjustTimerTime(300)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
              title="Add 5 minutes"
            >
              +5m
            </button>
            <button
              onClick={() => adjustTimerTime(60)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
              title="Add 1 minute"
            >
              +1m
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-4 w-full max-w-xs justify-center mb-5">
            <button
              onClick={handleReset}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs"
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {activeTimer.isRunning ? (
              <button
                onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95"
                aria-label="Pause Timer"
              >
                <Pause className="w-5 h-5 fill-white" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleStartOrResume}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                aria-label="Start or Resume Timer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{activeTimer.secondsRemaining === totalSeconds ? 'Start Flow' : 'Resume'}</span>
              </button>
            )}

            <button
              onClick={handleFinishAndSave}
              className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all shadow-2xs"
              title="Complete & Log Session"
              aria-label="Finish and Log Session"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>

          {/* Ambient Sound Compact Control */}
          <div className="w-full mb-4">
            <AmbientSoundControl compact={true} />
          </div>

          {/* Subject & Task Tagging Selectors */}
          <div className="w-full space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Tag Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No Subject (General)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Link Task (Optional)
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No linked task</option>
                  {tasks.filter(t => t.status !== 'completed').map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Session Reflection / Notes
              </label>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What did you accomplish in this session?"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
