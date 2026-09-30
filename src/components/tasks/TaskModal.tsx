import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Clock, AlertCircle, Tag, BookOpen, Trash2 } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { Priority, TaskStatus } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose }) => {
  const { 
    addTask, 
    updateTask, 
    deleteTask, 
    selectedTaskForEdit, 
    setSelectedTaskForEdit, 
    subjects 
  } = useStudy();
  const { showSuccess, showError } = useToast();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTaskForEdit) {
      setTitle(selectedTaskForEdit.title);
      setSubjectId(selectedTaskForEdit.subjectId || '');
      setDescription(selectedTaskForEdit.description || '');
      setDueDate(selectedTaskForEdit.dueDate || new Date().toISOString().split('T')[0]);
      setPriority(selectedTaskForEdit.priority);
      setEstimatedMinutes(selectedTaskForEdit.estimatedMinutes || 30);
    } else {
      setTitle('');
      setSubjectId(subjects[0]?.id || '');
      setDescription('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setPriority('medium');
      setEstimatedMinutes(30);
    }
    setFormError(null);
  }, [selectedTaskForEdit, subjects, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (selectedTaskForEdit) {
        await updateTask(selectedTaskForEdit.id, {
          title: title.trim(),
          subjectId: subjectId || '',
          description: description.trim(),
          dueDate,
          priority,
          estimatedMinutes,
        });
        showSuccess(`Task "${title.trim()}" updated successfully.`);
      } else {
        await addTask({
          title: title.trim(),
          subjectId: subjectId || '',
          description: description.trim(),
          dueDate,
          priority,
          estimatedMinutes,
        });
        showSuccess(`Task "${title.trim()}" created successfully.`);
      }
      setSelectedTaskForEdit(null);
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to save task.';
      setFormError(msg);
      showError(err, 'Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTaskForEdit) return;
    if (!window.confirm(`Are you sure you want to delete "${selectedTaskForEdit.title}"?`)) return;

    setIsSubmitting(true);
    try {
      await deleteTask(selectedTaskForEdit.id);
      showSuccess(`Task "${selectedTaskForEdit.title}" deleted.`);
      setSelectedTaskForEdit(null);
      onClose();
    } catch (err) {
      showError(err, 'Failed to delete task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {selectedTaskForEdit ? 'Edit Task' : 'Create New Study Task'}
            </h2>
            <p className="text-xs text-slate-500">Plan assignments, reviews, and study milestones</p>
          </div>
          <button
            onClick={() => {
              setSelectedTaskForEdit(null);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 overscroll-contain flex-1">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Complete Calculus Problem Set 3"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Subject (General)</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 text-xs font-bold rounded-lg border capitalize transition-all ${
                      priority === p
                        ? p === 'high' 
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : p === 'medium'
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-slate-400 bg-slate-100 text-slate-700'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Estimated Focus Time
              </label>
              <select
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={15}>15 mins (Quick task)</option>
                <option value={25}>25 mins (1 Pomodoro)</option>
                <option value={50}>50 mins (2 Pomodoros)</option>
                <option value={75}>75 mins (Deep session)</option>
                <option value={120}>120 mins (Major assignment)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Notes / Sub-topics (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline steps, textbook pages, reference links or notes..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {selectedTaskForEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskForEdit(null);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{selectedTaskForEdit ? 'Save Changes' : 'Create Task'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
