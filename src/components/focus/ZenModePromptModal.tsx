import React, { useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  Maximize2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  BookOpen, 
  CheckSquare, 
  X, 
  Volume2, 
  ArrowRight,
  EyeOff,
  Flame
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useSound } from '../../context/SoundContext';
import { FocusMode } from '../../types';

export const ZenModePromptModal: React.FC = () => {
  const { 
    isZenPromptOpen, 
    setIsZenPromptOpen, 
    pendingTimerConfig, 
    setPendingTimerConfig,
    confirmStartZenFocus, 
    confirmStartStandardFocus,
    subjects,
    tasks,
    activeTimer
  } = useStudy();

  const { playCue, soundSettings, startAmbient, isAmbientPlaying } = useSound();

  const [checklist, setChecklist] = useState<{ id: string; label: string; checked: boolean }[]>([
    { id: 'dnd', label: 'Phone placed on Do Not Disturb / Out of sight', checked: true },
    { id: 'tabs', label: 'Closed irrelevant browser tabs & notifications', checked: true },
    { id: 'water', label: 'Hydration & quiet study space ready', checked: true },
  ]);

  if (!isZenPromptOpen) return null;

  const mode = pendingTimerConfig?.mode || activeTimer.mode || 'pomodoro';
  const durationMinutes = pendingTimerConfig?.durationMinutes || Math.round((activeTimer.initialDurationSeconds || 1500) / 60);
  const subjectId = pendingTimerConfig?.subjectId || activeTimer.subjectId;
  const taskId = pendingTimerConfig?.taskId || activeTimer.taskId;

  const subject = subjects.find(s => s.id === subjectId);
  const task = tasks.find(t => t.id === taskId);

  const getModeLabel = (m: FocusMode) => {
    switch (m) {
      case 'pomodoro': return 'Pomodoro Session';
      case 'short_break': return 'Short Rest Break';
      case 'long_break': return 'Long Refresh Break';
      case 'custom': return 'Custom Deep Work';
      case 'stopwatch': return 'Open Stopwatch';
      default: return 'Focus Session';
    }
  };

  const handleStartZen = () => {
    playCue('session_start');
    if (soundSettings.ambientType !== 'none' && soundSettings.ambientAutoPlayOnFocus && !isAmbientPlaying) {
      startAmbient();
    }
    confirmStartZenFocus();
  };

  const handleStartStandard = () => {
    playCue('session_start');
    if (soundSettings.ambientType !== 'none' && soundSettings.ambientAutoPlayOnFocus && !isAmbientPlaying) {
      startAmbient();
    }
    confirmStartStandardFocus();
  };

  const handleCancel = () => {
    setIsZenPromptOpen(false);
    setPendingTimerConfig(null);
  };

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      style={{ backgroundColor: 'rgba(5, 8, 22, 0.75)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="zen-prompt-title"
    >
      <div 
        className="relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all animate-scale-up"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border-default)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* Top Header Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity z-10 touch-target"
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            color: 'var(--color-text-secondary)',
            borderColor: 'var(--color-border-default)'
          }}
          aria-label="Cancel and close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm mb-1"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981'
              }}
            >
              <Shield className="w-6 h-6" />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pre-Flight Focus Shield</span>
            </div>

            <h2 id="zen-prompt-title" className="text-xl sm:text-2xl font-black tracking-tight">
              Enter Zen Mode for this Session?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Blocks all screen distractions, sidebars, theme switchers, and menus into a full-screen, ultra-clean study clock.
            </p>
          </div>

          {/* Session Summary Card */}
          <div 
            className="p-4 rounded-xl border space-y-3"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border-default)'
            }}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Target Session:</span>
              <span className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--color-accent-primary)' }}>
                <Clock className="w-3.5 h-3.5" />
                {mode === 'stopwatch' ? 'Open Stopwatch (1 XP / min)' : `${durationMinutes} Minutes (${getModeLabel(mode)})`}
              </span>
            </div>

            {(subject || task) && (
              <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--color-border-default)' }}>
                {subject && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Subject:</span>
                    <span className="font-bold truncate">{subject.name}</span>
                  </div>
                )}
                {task && (
                  <div className="flex items-center gap-2 text-xs">
                    <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Task:</span>
                    <span className="font-bold truncate">{task.title}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Pre-Flight Checklist */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Distraction Shield Checklist</span>
              <span className="text-[11px] font-normal lowercase opacity-75">click to toggle</span>
            </label>
            <div className="space-y-1.5">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-medium transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: item.checked ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-bg-subtle)',
                    color: item.checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                  }}
                >
                  {item.checked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className={item.checked ? 'line-through opacity-75' : ''}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              onClick={handleStartZen}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] touch-target cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #0d9488 100%)',
              }}
            >
              <Maximize2 className="w-4 h-4" />
              <span>Enter Zen Fullscreen Focus</span>
              <Sparkles className="w-3.5 h-3.5 opacity-80" />
            </button>

            <button
              onClick={handleStartStandard}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all hover:opacity-80 active:scale-[0.99] touch-target cursor-pointer"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)'
              }}
            >
              <span>Continue in Standard Focus Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
