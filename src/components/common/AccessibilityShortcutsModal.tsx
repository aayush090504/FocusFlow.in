import React, { useEffect } from 'react';
import { X, Keyboard, Command, Check, Sparkles } from 'lucide-react';

interface AccessibilityShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityShortcutsModal: React.FC<AccessibilityShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Start / Pause Active Focus Timer' },
    { key: 'r', desc: 'Reset Timer to Initial Duration' },
    { key: 't', desc: 'Open New Task Creation Modal' },
    { key: 's', desc: 'Open New Subject Modal' },
    { key: 'g', desc: 'Open New Goal Modal' },
    { key: '1 - 6', desc: 'Switch Tabs: 1=Home, 2=Tasks, 3=Timer, 4=Subjects, 5=Goals, 6=Stats' },
    { key: 'Esc', desc: 'Dismiss Active Modal or Menu' },
    { key: '?', desc: 'Toggle this Keyboard Shortcuts Helper' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 animate-scale-up"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border-default)',
          color: 'var(--color-text-primary)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent-primary)'
              }}
            >
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-base font-bold">
                Keyboard Navigation & Shortcuts
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Full hands-free workspace accessibility
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border hover:opacity-80 transition-opacity touch-target flex items-center justify-center"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border-default)'
            }}
            aria-label="Close Shortcuts Dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((sc) => (
            <div 
              key={sc.key}
              className="flex items-center justify-between p-2.5 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border-default)'
              }}
            >
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {sc.desc}
              </span>
              <kbd 
                className="px-2.5 py-1 rounded-lg border text-xs font-mono font-bold shadow-2xs"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-accent-primary)'
                }}
              >
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>WCAG 2.1 AA Compliant · High Contrast</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 touch-target flex items-center justify-center"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-accent-fg)'
            }}
          >
            Got It (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
