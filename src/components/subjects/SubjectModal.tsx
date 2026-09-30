import React, { useState, useEffect } from 'react';
import { X, Check, BookOpen, AlertCircle, Trash2, Palette, Clock } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PALETTE = [
  '#6366f1', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#d97706', // Orange
  '#64748b', // Slate
];

export const SubjectModal: React.FC<SubjectModalProps> = ({ isOpen, onClose }) => {
  const { 
    addSubject, 
    updateSubject, 
    deleteSubject, 
    selectedSubjectForEdit, 
    setSelectedSubjectForEdit 
  } = useStudy();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [description, setDescription] = useState('');
  const [targetHoursPerWeek, setTargetHoursPerWeek] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSubjectForEdit) {
      setName(selectedSubjectForEdit.name);
      setColor(selectedSubjectForEdit.color || '#6366f1');
      setDescription(selectedSubjectForEdit.description || '');
      setTargetHoursPerWeek(selectedSubjectForEdit.targetHoursPerWeek || 5);
    } else {
      setName('');
      setColor('#6366f1');
      setDescription('');
      setTargetHoursPerWeek(5);
    }
    setError(null);
  }, [selectedSubjectForEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Subject name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (selectedSubjectForEdit) {
        await updateSubject(selectedSubjectForEdit.id, {
          name: name.trim(),
          color,
          description: description.trim(),
          targetHoursPerWeek,
        });
        showSuccess(`Subject "${name.trim()}" updated.`);
      } else {
        await addSubject({
          name: name.trim(),
          color,
          description: description.trim(),
          targetHoursPerWeek,
        });
        showSuccess(`Subject "${name.trim()}" added to your curriculum.`);
      }
      setSelectedSubjectForEdit(null);
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to save subject.';
      setError(msg);
      showError(err, 'Failed to save subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubjectForEdit) return;
    if (!window.confirm(`Are you sure you want to delete subject "${selectedSubjectForEdit.name}"? Tasks associated with it will remain.`)) return;

    setIsSubmitting(true);
    try {
      await deleteSubject(selectedSubjectForEdit.id);
      showSuccess(`Subject "${selectedSubjectForEdit.name}" deleted.`);
      setSelectedSubjectForEdit(null);
      onClose();
    } catch (err) {
      showError(err, 'Failed to delete subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {selectedSubjectForEdit ? 'Edit Subject' : 'Add New Subject'}
            </h2>
            <p className="text-xs text-slate-500">Organize your academic courses & study modules</p>
          </div>
          <button
            onClick={() => {
              setSelectedSubjectForEdit(null);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Computer Science, Organic Chemistry"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Theme Color
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Weekly Target Goal (Hours)
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={targetHoursPerWeek}
              onChange={(e) => setTargetHoursPerWeek(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Course Code (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Professor, room number, or syllabus summary..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {selectedSubjectForEdit ? (
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
                  setSelectedSubjectForEdit(null);
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
                    <span>{selectedSubjectForEdit ? 'Save Subject' : 'Add Subject'}</span>
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
