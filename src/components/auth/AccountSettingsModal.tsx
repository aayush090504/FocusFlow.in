import React, { useState } from 'react';
import { 
  X, 
  User, 
  Target, 
  Trash2, 
  ShieldAlert, 
  Download, 
  Check, 
  AlertTriangle, 
  LogOut,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { formatLocalDateKey } from '../../utils/dateUtils';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, linkedProviders, updateDailyGoal, updateDisplayName, deleteAccount } = useAuth();
  const { subjects, tasks, focusSessions } = useStudy();

  const [name, setName] = useState(userProfile?.displayName || '');
  const [goal, setGoal] = useState<number>(userProfile?.dailyGoalMinutes || 120);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [deleteCurrentPassword, setDeleteCurrentPassword] = useState('');
  const [deleteAuthMethod, setDeleteAuthMethod] = useState<'password' | 'google.com'>(
    linkedProviders.includes('password') ? 'password' : 'google.com'
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  React.useEffect(() => {
    if (linkedProviders.length > 0 && !linkedProviders.includes(deleteAuthMethod)) {
      setDeleteAuthMethod(linkedProviders[0]);
    }
  }, [linkedProviders, deleteAuthMethod]);

  if (!isOpen) return null;

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      if (name.trim() && name !== userProfile?.displayName) {
        await updateDisplayName(name.trim());
      }
      if (goal !== userProfile?.dailyGoalMinutes) {
        await updateDailyGoal(goal);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const data = {
      profile: userProfile,
      subjects,
      tasks,
      focusSessions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-study-data-${formatLocalDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const requiresPasswordForDelete =
    deleteAuthMethod === 'password' && linkedProviders.includes('password');
  const canConfirmDelete =
    deleteInputText === 'DELETE' &&
    (!requiresPasswordForDelete || deleteCurrentPassword.length > 0) &&
    !isDeleting;

  const handleDeleteAccount = async () => {
    if (!canConfirmDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount({
        password: requiresPasswordForDelete ? deleteCurrentPassword : undefined,
        preferredProvider: deleteAuthMethod,
      });
      setDeleteCurrentPassword('');
      setDeleteInputText('');
      onClose();
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error && err.message
          ? err.message
          : 'Failed to delete account. Please verify your credentials and retry.'
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Student Profile & Settings</h2>
            <p className="text-xs text-slate-500">Manage your study targets, data, and security</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* General settings form */}
          <form onSubmit={handleSavePreferences} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Account Email
              </label>
              <input
                type="text"
                disabled
                value={userProfile?.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Student Name / Nickname
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Daily Study Goal</span>
                <span className="text-indigo-600 font-semibold">{goal} minutes ({Math.floor(goal / 60)}h {goal % 60 > 0 ? `${goal % 60}m` : ''})</span>
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[60, 90, 120, 180].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setGoal(preset)}
                    className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                      goal === preset
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {preset / 60} hrs
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="15"
                max="360"
                step="15"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>15 mins</span>
                <span>6 hours</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <span>Save Preferences</span>
                )}
              </button>
            </div>
          </form>

          {/* Export study data */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Data & Backup
            </h4>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <div className="text-xs font-semibold text-slate-800">Export Study Workspace</div>
                <div className="text-[11px] text-slate-500">Download all your tasks, subjects, and timer logs</div>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Danger Zone</span>
            </h4>

            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between p-3.5 bg-rose-50/50 border border-rose-200/70 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-rose-900">Delete Account & Data</div>
                  <div className="text-[11px] text-rose-600/90">Permanently delete your profile, tasks, and focus history</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-2xs"
                >
                  Delete Account
                </button>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">Verify your identity to permanently delete your account</p>
                    <p className="text-rose-700">
                      Your profile, tasks, subjects, goals, and focus history will be deleted. Previously submitted support feedback tickets remain immutable in support records.
                    </p>
                    <p className="text-rose-700">
                      Type <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-rose-300">DELETE</span> to confirm.
                    </p>
                  </div>
                </div>

                {linkedProviders.includes('password') && linkedProviders.includes('google.com') && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteAuthMethod('password');
                        setDeleteError(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                        deleteAuthMethod === 'password'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-rose-300'
                      }`}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteAuthMethod('google.com');
                        setDeleteCurrentPassword('');
                        setDeleteError(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                        deleteAuthMethod === 'google.com'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-rose-300'
                      }`}
                    >
                      Google Account
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  value={deleteInputText}
                  onChange={(e) => setDeleteInputText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />

                {requiresPasswordForDelete ? (
                  <input
                    type="password"
                    value={deleteCurrentPassword}
                    onChange={(e) => setDeleteCurrentPassword(e.target.value)}
                    placeholder="Enter your current password to verify"
                    autoComplete="current-password"
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                ) : (
                  <p className="text-[11px] text-rose-700">
                    A Google verification popup will open before any data is deleted.
                  </p>
                )}

                {deleteError && (
                  <div className="text-xs text-rose-700 font-medium bg-white/80 p-2 rounded border border-rose-300">
                    {deleteError}
                  </div>
                )}

                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteInputText('');
                      setDeleteCurrentPassword('');
                      setDeleteError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canConfirmDelete}
                    onClick={handleDeleteAccount}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                  >
                    {isDeleting ? 'Verifying & Deleting...' : deleteError ? 'Retry Deletion' : 'Permanently Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
