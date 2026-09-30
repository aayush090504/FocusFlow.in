import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, BookOpen, Hash, AlertCircle, CheckCircle } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { Goal } from '../../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit: Goal | null;
}

const COMMON_UNITS = [
  { value: 'hours', label: 'Hours (Study Time)' },
  { value: 'tasks', label: 'Tasks (Completed)' },
  { value: 'sessions', label: 'Focus Sessions' },
  { value: 'chapters', label: 'Chapters / Modules' },
  { value: 'problems', label: 'Problem Sets' },
  { value: 'pages', label: 'Pages Read' },
];

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, goalToEdit }) => {
  const { addGoal, updateGoal, subjects } = useStudy();
  const { showSuccess, showError } = useToast();

  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState<number | ''>(10);
  const [currentValue, setCurrentValue] = useState<number | ''>(0);
  const [unit, setUnit] = useState('hours');
  const [customUnit, setCustomUnit] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title);
      setTargetValue(goalToEdit.targetValue);
      setCurrentValue(goalToEdit.currentValue ?? 0);
      
      const foundCommon = COMMON_UNITS.find(u => u.value === goalToEdit.unit);
      if (foundCommon) {
        setUnit(goalToEdit.unit);
        setIsCustomUnit(false);
        setCustomUnit('');
      } else {
        setUnit('custom');
        setIsCustomUnit(true);
        setCustomUnit(goalToEdit.unit);
      }

      setSubjectId(goalToEdit.subjectId || '');
      setTargetDate(goalToEdit.targetDate || '');
      setNotes(goalToEdit.notes || '');
    } else {
      // Default new goal: Target date in 7 days
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const defaultDate = d.toISOString().split('T')[0];

      setTitle('');
      setTargetValue(10);
      setCurrentValue(0);
      setUnit('hours');
      setIsCustomUnit(false);
      setCustomUnit('');
      setSubjectId('');
      setTargetDate(defaultDate);
      setNotes('');
    }
    setError(null);
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a goal title');
      return;
    }

    const numTarget = Number(targetValue);
    if (isNaN(numTarget) || numTarget <= 0) {
      setError('Target value must be greater than 0');
      return;
    }

    const effectiveUnit = isCustomUnit ? (customUnit.trim() || 'units') : unit;
    const numCurrent = Number(currentValue) || 0;

    setIsSubmitting(true);
    setError(null);

    try {
      if (goalToEdit) {
        await updateGoal(goalToEdit.id, {
          title: title.trim(),
          targetValue: numTarget,
          currentValue: numCurrent,
          unit: effectiveUnit,
          subjectId: subjectId || '',
          targetDate: targetDate || '',
          notes: notes.trim(),
        });
        showSuccess(`Goal "${title.trim()}" updated.`);
      } else {
        await addGoal({
          title: title.trim(),
          targetValue: numTarget,
          currentValue: numCurrent,
          unit: effectiveUnit,
          subjectId: subjectId || '',
          targetDate: targetDate || '',
          notes: notes.trim(),
        });
        showSuccess(`Goal "${title.trim()}" created! Stay focused!`);
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save goal';
      setError(msg);
      showError(err, 'Failed to save goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        id="goal-modal"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {goalToEdit ? 'Edit Study Goal' : 'Create Study Goal'}
              </h2>
              <p className="text-xs text-slate-500">
                Set a clear, measurable academic target with progress tracking.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Goal Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Goal Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study 15 hours for Biology Midterm"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Target Value & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Quantity <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 10"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Measurement Unit
              </label>
              <select
                value={isCustomUnit ? 'custom' : unit}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomUnit(true);
                  } else {
                    setIsCustomUnit(false);
                    setUnit(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {COMMON_UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
                <option value="custom">Custom unit...</option>
              </select>
            </div>
          </div>

          {/* Custom unit input if selected */}
          {isCustomUnit && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Unit Name
              </label>
              <input
                type="text"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="e.g. practice tests, flashcard decks, essays"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          )}

          {/* Current Progress & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Current Progress
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Can also be updated anytime with + / - buttons.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Subject Link (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Associated Subject (Optional)
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="">General (All Subjects / Overall Study)</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes or Milestones (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on Chapters 4-7 problem sets and review formulas"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : goalToEdit ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
