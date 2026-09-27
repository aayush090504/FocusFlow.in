import React, { useState, useEffect } from 'react';
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
  Palette,
  Bell,
  Lock,
  Mail,
  Sparkles,
  Volume2,
  Clock,
  Shield,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  MessageSquare,
  Compass,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useStudy } from '../../context/StudyContext';
import { useToast } from '../../context/ToastContext';
import { useSound, AMBIENT_SOUND_OPTIONS } from '../../context/SoundContext';
import { ThemeMode, NotificationSettings, AmbientSoundType } from '../../types';
import { FeedbackSection } from './FeedbackSection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'themes' | 'goals' | 'notifications' | 'pomodoro' | 'account' | 'feedback';
  onReplayOnboarding?: () => void;
}

const AVATAR_OPTIONS = [
  { id: 'avatar-1', label: 'Scholar', bg: 'bg-indigo-600', emoji: '🎓' },
  { id: 'avatar-2', label: 'Researcher', bg: 'bg-emerald-600', emoji: '🔬' },
  { id: 'avatar-3', label: 'Creative', bg: 'bg-rose-500', emoji: '🎨' },
  { id: 'avatar-4', label: 'Tech / Coder', bg: 'bg-cyan-600', emoji: '💻' },
  { id: 'avatar-5', label: 'Bookworm', bg: 'bg-amber-600', emoji: '📚' },
  { id: 'avatar-6', label: 'Astronomer', bg: 'bg-violet-600', emoji: '🔭' },
  { id: 'avatar-7', label: 'Athlete / Focus', bg: 'bg-orange-600', emoji: '⚡' },
  { id: 'avatar-8', label: 'Zen Master', bg: 'bg-teal-600', emoji: '🧘' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose,
  initialTab = 'profile',
  onReplayOnboarding
}) => {
  const { 
    user, 
    userProfile, 
    updateDailyGoal, 
    updateDisplayName, 
    updateAvatar, 
    updateNotifications,
    changePassword,
    sendResetPassword,
    deleteAccount, 
    logout 
  } = useAuth();

  const { theme, setTheme, themesList } = useTheme();
  const { subjects, tasks, focusSessions, goals, pomodoroSettings, updatePomodoroSettings } = useStudy();
  const { showSuccess, showError, showInfo } = useToast();
  const { 
    soundSettings, 
    updateSoundSettings, 
    toggleMasterSound, 
    setMasterVolume, 
    setAmbientVolume, 
    setAmbientType, 
    playCue, 
    isAmbientPlaying, 
    toggleAmbientPlayback 
  } = useSound();

  const [activeTab, setActiveTab] = useState<'profile' | 'themes' | 'goals' | 'notifications' | 'pomodoro' | 'account' | 'feedback'>(initialTab);

  // Profile Form States
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatar || 'avatar-1');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Goal State
  const [goal, setGoal] = useState<number>(userProfile?.dailyGoalMinutes || 120);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [goalSuccess, setGoalSuccess] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationSettings>({
    timerSound: userProfile?.notificationSettings?.timerSound ?? true,
    breakSound: userProfile?.notificationSettings?.breakSound ?? true,
    dailyReminder: userProfile?.notificationSettings?.dailyReminder ?? true,
    reminderTime: userProfile?.notificationSettings?.reminderTime ?? '18:00',
    streakAlerts: userProfile?.notificationSettings?.streakAlerts ?? true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  // Security States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Danger Zone States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setSelectedAvatar(userProfile.avatar || 'avatar-1');
      setGoal(userProfile.dailyGoalMinutes || 120);
      if (userProfile.notificationSettings) {
        setNotifications(userProfile.notificationSettings);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);
    try {
      if (displayName.trim() && displayName !== userProfile?.displayName) {
        await updateDisplayName(displayName.trim());
      }
      if (selectedAvatar !== userProfile?.avatar) {
        await updateAvatar(selectedAvatar);
      }
      setProfileSuccess(true);
      showSuccess('Profile updated successfully.');
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err) {
      showError(err, 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGoal(true);
    setGoalSuccess(false);
    try {
      await updateDailyGoal(goal);
      setGoalSuccess(true);
      showSuccess(`Daily goal set to ${goal} minutes.`);
      setTimeout(() => setGoalSuccess(false), 2500);
    } catch (err) {
      showError(err, 'Failed to update daily goal.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotifications(true);
    setNotificationSuccess(false);
    try {
      await updateNotifications(notifications);
      setNotificationSuccess(true);
      showSuccess('Notification preferences saved.');
      setTimeout(() => setNotificationSuccess(false), 2500);
    } catch (err) {
      showError(err, 'Failed to update notifications.');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match.');
      return;
    }
    setPassError(null);
    setIsChangingPass(true);
    try {
      await changePassword(newPassword);
      setPassSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Password changed successfully.');
      setTimeout(() => setPassSuccess(false), 3000);
    } catch (err: any) {
      const msg = err?.message || 'Failed to update password. Please check your credentials.';
      setPassError(msg);
      showError(err, 'Failed to update password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSendReset = async () => {
    if (!userProfile?.email) return;
    try {
      await sendResetPassword(userProfile.email);
      setResetEmailSent(true);
      showSuccess(`Password reset email sent to ${userProfile.email}`);
      setTimeout(() => setResetEmailSent(false), 4000);
    } catch (err) {
      showError(err, 'Failed to send reset email.');
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        profile: userProfile,
        subjects,
        tasks,
        focusSessions,
        goals,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusflow-study-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Study data exported successfully.');
    } catch (err) {
      showError(err, 'Failed to export study data.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInputText !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      showInfo('Your account has been deleted.');
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to delete account. You may need to log out and log in again before deleting.';
      setDeleteError(msg);
      showError(err, 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  const currentAvatarObj = AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border-default)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* Top Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{ 
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-subtle)'
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: 'var(--color-accent-subtle)',
                color: 'var(--color-accent-subtle-text)'
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Settings & Personalization</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Customize your study environment, themes, targets, and account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:opacity-80"
            style={{ 
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-bg-surface)'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div 
          className="flex border-b px-4 sm:px-6 gap-1 sm:gap-2 overflow-x-auto no-scrollbar"
          style={{ 
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-surface)'
          }}
        >
          {[
            { id: 'profile' as const, label: 'Profile', icon: User },
            { id: 'themes' as const, label: 'Themes', icon: Palette },
            { id: 'pomodoro' as const, label: 'Pomodoro & Timer', icon: Clock },
            { id: 'goals' as const, label: 'Daily Targets', icon: Target },
            { id: 'notifications' as const, label: 'Sound & Alerts', icon: Bell },
            { id: 'feedback' as const, label: 'Feedback & Suggestions', icon: MessageSquare },
            { id: 'account' as const, label: 'Account & Security', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-[var(--color-accent-primary)] text-[var(--color-accent-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Card Header */}
              <div 
                className="p-4 rounded-xl border flex items-center gap-4"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)'
                }}
              >
                <div className={`w-14 h-14 rounded-2xl ${currentAvatarObj.bg} text-white flex items-center justify-center text-2xl shadow-md shrink-0`}>
                  {currentAvatarObj.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate">
                    {displayName || 'Student'}
                  </h3>
                  <p className="text-xs truncate font-mono mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {userProfile?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-accent-subtle)',
                        color: 'var(--color-accent-subtle-text)'
                      }}
                    >
                      Focus Flow Member
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                      🔥 {userProfile?.streakCount || 1} day streak
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Choose Avatar Persona
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {AVATAR_OPTIONS.map((av) => {
                    const isSelected = selectedAvatar === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatar(av.id)}
                        className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-[var(--color-accent-primary)] shadow-sm'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                          borderColor: isSelected ? 'var(--color-accent-primary)' : 'var(--color-border-default)'
                        }}
                      >
                        <div className={`w-8 h-8 rounded-lg ${av.bg} text-white flex items-center justify-center text-base mb-1 shadow-xs`}>
                          {av.emoji}
                        </div>
                        <span className="text-[10px] font-bold truncate max-w-full" style={{ color: 'var(--color-text-primary)' }}>
                          {av.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your student name"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* Email (Read-Only) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={userProfile?.email || ''}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs font-mono opacity-80 cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--color-bg-subtle)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-secondary)'
                    }}
                  />
                </div>
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Authenticated via Focus Flow Secure Cloud
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-accent-primary)',
                    color: 'var(--color-accent-fg)'
                  }}
                >
                  {isSavingProfile ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : profileSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Profile Updated!</span>
                    </>
                  ) : (
                    <span>Save Profile</span>
                  )}
                </button>
              </div>

              {/* Feedback & Suggestions shortcut within Profile */}
              <div 
                className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'var(--color-accent-subtle)',
                      color: 'var(--color-accent-subtle-text)'
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      Have feedback or ideas for Focus Flow?
                    </h4>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Report bugs, suggest tools, or submit problems directly to our team.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('feedback')}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold hover:opacity-85 transition-opacity shrink-0 self-start sm:self-auto cursor-pointer"
                  style={{
                    borderColor: 'var(--color-border-default)',
                    backgroundColor: 'var(--color-bg-surface)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  Give Feedback
                </button>
              </div>

              {/* Onboarding Guide Walkthrough Replay Card */}
              {onReplayOnboarding && (
                <div 
                  className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3"
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-default)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: 'var(--color-accent-subtle)',
                        color: 'var(--color-accent-subtle-text)'
                      }}
                    >
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        First-Time Onboarding Tour
                      </h4>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                        Revisit the 6-step walkthrough of subjects, tasks, planner, focus timer, and progress anytime.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReplayOnboarding();
                    }}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold hover:opacity-85 transition-opacity shrink-0 self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
                    style={{
                      borderColor: 'var(--color-border-default)',
                      backgroundColor: 'var(--color-bg-surface)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Replay Tour</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: THEMES / PERSONALIZATION */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold">Workspace Appearance</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Themes change your complete visual workspace including cards, timer, charts, navigation, and accents.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themesList.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`group relative text-left p-4 rounded-2xl border transition-all overflow-hidden ${
                        isSelected
                          ? 'ring-2 ring-[var(--color-accent-primary)] shadow-md'
                          : 'hover:scale-[1.01] hover:shadow-xs'
                      }`}
                      style={{
                        backgroundColor: t.colors.surface,
                        borderColor: isSelected ? t.colors.primary : t.colors.border,
                        color: t.colors.text
                      }}
                    >
                      {/* Theme preview ribbon */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border shadow-2xs"
                            style={{ backgroundColor: t.colors.primary, borderColor: t.colors.border }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border shadow-2xs"
                            style={{ backgroundColor: t.colors.accent, borderColor: t.colors.border }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border shadow-2xs"
                            style={{ backgroundColor: t.colors.bg, borderColor: t.colors.border }}
                          />
                        </div>

                        {isSelected ? (
                          <div 
                            className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: t.colors.primary, color: '#ffffff' }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded border"
                            style={{ borderColor: t.colors.border, color: t.colors.text }}
                          >
                            {t.isDark ? 'Dark Mode' : 'Light Mode'}
                          </span>
                        )}
                      </div>

                      <div className="mb-2">
                        <h4 className="text-sm font-bold" style={{ color: t.colors.text }}>
                          {t.name}
                        </h4>
                        <p className="text-[11px] font-semibold" style={{ color: t.colors.primary }}>
                          {t.tagline}
                        </p>
                      </div>

                      <p className="text-xs line-clamp-2 leading-relaxed opacity-85" style={{ color: t.colors.text }}>
                        {t.description}
                      </p>

                      {/* Mini visual mockup bar */}
                      <div 
                        className="mt-3.5 p-2 rounded-lg border flex items-center gap-2 text-[10px]"
                        style={{ backgroundColor: t.colors.bg, borderColor: t.colors.border }}
                      >
                        <div 
                          className="px-2 py-0.5 rounded font-bold"
                          style={{ backgroundColor: t.colors.primary, color: '#ffffff' }}
                        >
                          Button
                        </div>
                        <div 
                          className="flex-1 h-2 rounded-full"
                          style={{ backgroundColor: t.colors.border }}
                        >
                          <div className="h-full rounded-full w-2/3" style={{ backgroundColor: t.colors.accent }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: POMODORO & TIMER SETTINGS */}
          {activeTab === 'pomodoro' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold">Pomodoro & Timer Configuration</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Configure your default focus durations, rest break lengths, cycle intervals, and transition automations.
                </p>
              </div>

              {/* XP Rule info callout */}
              <div 
                className="p-4 rounded-xl border flex items-start gap-3"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderColor: 'rgba(16, 185, 129, 0.25)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">XP & Gamification Precision Rule</div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    You earn exactly <strong>1 XP per completed minute</strong> of genuine focus study. Break periods (short and long) are strictly for rest and earn <strong>0 XP</strong>.
                  </p>
                </div>
              </div>

              {/* Durations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Focus Duration */}
                <div 
                  className="p-4 rounded-xl border space-y-2"
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-default)'
                  }}
                >
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    Focus Time (min)
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min={1}
                      max={180}
                      value={pomodoroSettings.focusDurationMinutes}
                      onChange={(e) => updatePomodoroSettings({ focusDurationMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-3 py-2 border rounded-xl text-base font-bold font-mono focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap pt-1">
                    {[15, 25, 45, 50, 60].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => updatePomodoroSettings({ focusDurationMinutes: mins })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          pomodoroSettings.focusDurationMinutes === mins 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                            : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Short Break */}
                <div 
                  className="p-4 rounded-xl border space-y-2"
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-default)'
                  }}
                >
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    Short Break (min)
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min={1}
                      max={60}
                      value={pomodoroSettings.shortBreakDurationMinutes}
                      onChange={(e) => updatePomodoroSettings({ shortBreakDurationMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-3 py-2 border rounded-xl text-base font-bold font-mono focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap pt-1">
                    {[3, 5, 8, 10].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => updatePomodoroSettings({ shortBreakDurationMinutes: mins })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          pomodoroSettings.shortBreakDurationMinutes === mins 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                            : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Long Break */}
                <div 
                  className="p-4 rounded-xl border space-y-2"
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-default)'
                  }}
                >
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    Long Break (min)
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      min={1}
                      max={120}
                      value={pomodoroSettings.longBreakDurationMinutes}
                      onChange={(e) => updatePomodoroSettings({ longBreakDurationMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-3 py-2 border rounded-xl text-base font-bold font-mono focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap pt-1">
                    {[10, 15, 20, 30].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => updatePomodoroSettings({ longBreakDurationMinutes: mins })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          pomodoroSettings.longBreakDurationMinutes === mins 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                            : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cycle & Automation Preferences */}
              <div 
                className="p-4 rounded-xl border space-y-4"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)'
                }}
              >
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Cycle Automation & Intervals
                </div>

                {/* Long break interval */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">Long Break Interval</div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Trigger a longer rest after completing this many focus sessions
                    </div>
                  </div>
                  <select
                    value={pomodoroSettings.longBreakInterval}
                    onChange={(e) => updatePomodoroSettings({ longBreakInterval: parseInt(e.target.value) || 4 })}
                    className="px-3 py-1.5 border rounded-xl text-xs font-bold focus:outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    {[2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>Every {num} Pomodoros</option>
                    ))}
                  </select>
                </div>

                {/* Auto Start Breaks */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
                  <div>
                    <div className="text-xs font-bold">Auto-Start Breaks</div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Automatically start break countdown when a focus session finishes
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pomodoroSettings.autoStartBreaks}
                    onChange={(e) => updatePomodoroSettings({ autoStartBreaks: e.target.checked })}
                    className="w-4 h-4 accent-[var(--color-accent-primary)] rounded cursor-pointer"
                  />
                </div>

                {/* Auto Start Pomodoros */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
                  <div>
                    <div className="text-xs font-bold">Auto-Start Next Focus Session</div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Automatically resume focus timer when a break countdown concludes
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pomodoroSettings.autoStartPomodoros}
                    onChange={(e) => updatePomodoroSettings({ autoStartPomodoros: e.target.checked })}
                    className="w-4 h-4 accent-[var(--color-accent-primary)] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STUDY TARGETS & GOALS */}
          {activeTab === 'goals' && (
            <form onSubmit={handleSaveGoal} className="space-y-6">
              <div>
                <h3 className="text-sm font-bold">Daily Study Goal</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Set your target daily study commitment. This powers your dashboard progress bar and streak validations.
                </p>
              </div>

              {/* Goal Presets */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>Preset Targets</span>
                  <span className="font-bold text-[var(--color-accent-primary)]">
                    {goal} minutes ({Math.floor(goal / 60)}h {goal % 60 > 0 ? `${goal % 60}m` : ''})
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                  {[60, 90, 120, 180, 240, 300].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGoal(preset)}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                        goal === preset
                          ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-subtle)] text-[var(--color-accent-subtle-text)] shadow-xs'
                          : 'hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: goal === preset ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                        borderColor: goal === preset ? 'var(--color-accent-primary)' : 'var(--color-border-default)',
                        color: goal === preset ? 'var(--color-accent-subtle-text)' : 'var(--color-text-primary)'
                      }}
                    >
                      {preset / 60} {preset / 60 === 1 ? 'Hour' : 'Hours'} ({preset}m)
                    </button>
                  ))}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="15"
                  max="480"
                  step="15"
                  value={goal}
                  onChange={(e) => setGoal(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent-primary)] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  <span>15 mins (Light)</span>
                  <span>4 hours (Standard)</span>
                  <span>8 hours (Intense)</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingGoal}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-accent-primary)',
                    color: 'var(--color-accent-fg)'
                  }}
                >
                  {isSavingGoal ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : goalSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Target Saved!</span>
                    </>
                  ) : (
                    <span>Save Daily Target</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: NOTIFICATIONS & SOUND */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold">Audio & Sound System</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Manage synthesized procedural audio, focus chimes, and ambient noise generators.
                </p>
              </div>

              {/* Master Audio Section */}
              <div 
                className="p-4 rounded-2xl border space-y-4"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-xl border"
                      style={{ 
                        backgroundColor: 'var(--color-bg-surface)', 
                        borderColor: 'var(--color-border-default)',
                        color: soundSettings.masterEnabled ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)' 
                      }}
                    >
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Master Sound System</div>
                      <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                        Enable or mute all procedural audio, chimes, and ambient generators
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundSettings.masterEnabled}
                    onChange={toggleMasterSound}
                    className="w-4 h-4 accent-[var(--color-accent-primary)] rounded cursor-pointer"
                    aria-label="Master audio toggle"
                  />
                </div>

                {soundSettings.masterEnabled && (
                  <div className="pt-3 border-t space-y-1.5" style={{ borderColor: 'var(--color-border-default)' }}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Master Volume</span>
                      <span className="font-mono font-bold" style={{ color: 'var(--color-accent-primary)' }}>{soundSettings.volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={soundSettings.volume}
                      onChange={(e) => setMasterVolume(Number(e.target.value))}
                      className="w-full h-1.5 rounded-lg cursor-pointer"
                      style={{ accentColor: 'var(--color-accent-primary)' }}
                      aria-label="Master volume slider"
                    />
                  </div>
                )}
              </div>

              {/* Audio Cues & Chimes Section */}
              <div 
                className="p-4 rounded-2xl border space-y-4"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)'
                }}
              >
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Interactive Study Chimes & Cues
                </div>

                {/* Session Start Cue */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">Focus Session Start Chime</div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Ascending harmonic chime when beginning a study block
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => playCue('session_start')}
                      disabled={!soundSettings.masterEnabled}
                      className="px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all disabled:opacity-40"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      Preview
                    </button>
                    <input
                      type="checkbox"
                      checked={soundSettings.sessionStartSound}
                      onChange={(e) => updateSoundSettings({ sessionStartSound: e.target.checked })}
                      disabled={!soundSettings.masterEnabled}
                      className="w-4 h-4 accent-[var(--color-accent-primary)] rounded cursor-pointer disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Break Start Cue */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
                  <div>
                    <div className="text-xs font-bold">Break Start Chime</div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Calming dual-tone chime when starting a rest interval
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => playCue('break_start')}
                      disabled={!soundSettings.masterEnabled}
                      className="px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all disabled:opacity-40"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      Preview
                    </button>
                    <input
                      type="checkbox"
                      checked={soundSettings.breakStartSound}
                      onChange={(e) => updateSoundSettings({ breakStartSound: e.target.checked })}
                      disabled={!soundSettings.masterEnabled}
                      className="w-4 h-4 accent-[var(--color-accent-primary)] rounded cursor-pointer disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Session Complete Cue */}
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
                  <div>
                    <div className="text-xs font-bold">Focus Completion Major Chime</div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Celebratory resonant major chord upon finishing a timer
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => playCue('session_complete')}
                      disabled={!soundSettings.masterEnabled}
                      className="px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all disabled:opacity-40"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      Preview
                    </button>
                    <input
                      type="checkbox"
                      checked={soundSettings.completionSound}
                      onChange={(e) => updateSoundSettings({ completionSound: e.target.checked })}
                      disabled={!soundSettings.masterEnabled}
                      className="w-4 h-4 accent-[var(--color-accent-primary)] rounded cursor-pointer disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              {/* Ambient Soundscape Preferences */}
              <div 
                className="p-4 rounded-2xl border space-y-4"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)'
                }}
              >
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Ambient Focus Background Soundscape
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Default Ambient Sound Track
                    </label>
                    <select
                      value={soundSettings.ambientType}
                      onChange={(e) => setAmbientType(e.target.value as AmbientSoundType)}
                      disabled={!soundSettings.masterEnabled}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none disabled:opacity-40"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border-default)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      {AMBIENT_SOUND_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label} — {opt.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {soundSettings.ambientType !== 'none' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Default Ambient Volume</span>
                        <span className="font-mono font-bold" style={{ color: 'var(--color-accent-primary)' }}>{soundSettings.ambientVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={soundSettings.ambientVolume}
                        onChange={(e) => setAmbientVolume(Number(e.target.value))}
                        disabled={!soundSettings.masterEnabled}
                        className="w-full h-1.5 rounded-lg cursor-pointer disabled:opacity-40"
                        style={{ accentColor: 'var(--color-accent-primary)' }}
                        aria-label="Ambient volume slider"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Auto-play ambient audio when starting focus timer
                    </div>
                    <input
                      type="checkbox"
                      checked={soundSettings.ambientAutoPlayOnFocus}
                      onChange={(e) => updateSoundSettings({ ambientAutoPlayOnFocus: e.target.checked })}
                      disabled={!soundSettings.masterEnabled}
                      className="w-4 h-4 accent-[var(--color-accent-primary)] rounded cursor-pointer disabled:opacity-40"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Loop local music tracks by default
                    </div>
                    <input
                      type="checkbox"
                      checked={soundSettings.localMusicLoop ?? true}
                      onChange={(e) => updateSoundSettings({ localMusicLoop: e.target.checked })}
                      disabled={!soundSettings.masterEnabled}
                      className="w-4 h-4 accent-[var(--color-accent-primary)] rounded cursor-pointer disabled:opacity-40"
                    />
                  </div>

                  {soundSettings.ambientType !== 'none' && soundSettings.masterEnabled && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={toggleAmbientPlayback}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        style={{
                          backgroundColor: isAmbientPlaying ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                          borderColor: 'var(--color-border-default)',
                          borderWidth: '1px',
                          color: isAmbientPlaying ? 'var(--color-accent-primary)' : 'var(--color-text-primary)'
                        }}
                      >
                        <span>{isAmbientPlaying ? 'Pause Ambient Test' : 'Test Ambient Soundscape'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Reminders Form */}
              <form onSubmit={handleSaveNotifications} className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Study Reminders & Streaks
                </div>

                <div 
                  className="p-4 rounded-2xl border space-y-4"
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-default)'
                  }}
                >
                  {/* Daily Study Reminder */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-accent-primary)' }}
                      >
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Daily Study Reminder</div>
                        <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                          Remind me to start my study routine every day
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.dailyReminder}
                      onChange={(e) => setNotifications(prev => ({ ...prev, dailyReminder: e.target.checked }))}
                      className="w-4 h-4 accent-[var(--color-accent-primary)] rounded cursor-pointer"
                    />
                  </div>

                  {/* Reminder Time Selector if enabled */}
                  {notifications.dailyReminder && (
                    <div className="pl-11 pt-1 flex items-center gap-3">
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        Preferred reminder time:
                      </span>
                      <input
                        type="time"
                        value={notifications.reminderTime}
                        onChange={(e) => setNotifications(prev => ({ ...prev, reminderTime: e.target.value }))}
                        className="px-2.5 py-1 rounded-lg border text-xs font-bold"
                        style={{
                          backgroundColor: 'var(--color-bg-surface)',
                          borderColor: 'var(--color-border-default)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                    </div>
                  )}

                  {/* Streak Alerts */}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-accent-primary)' }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Streak Protection Alerts</div>
                        <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                          Get warned before losing your active study streak
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.streakAlerts}
                      onChange={(e) => setNotifications(prev => ({ ...prev, streakAlerts: e.target.checked }))}
                      className="w-4 h-4 accent-[var(--color-accent-primary)] rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingNotifications}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--color-accent-primary)',
                      color: 'var(--color-accent-fg)'
                    }}
                  >
                    {isSavingNotifications ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : notificationSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Preferences Saved!</span>
                      </>
                    ) : (
                      <span>Save Reminder Settings</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              
              {/* Security / Password Change */}
              <div 
                className="p-4 rounded-xl border space-y-4"
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border-default)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[var(--color-accent-primary)]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Account Password & Access</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendReset}
                    className="text-xs font-bold hover:underline"
                    style={{ color: 'var(--color-accent-primary)' }}
                  >
                    {resetEmailSent ? 'Reset Email Sent!' : 'Send Reset Link to Email'}
                  </button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-2 pr-8 rounded-lg border text-xs"
                          style={{
                            backgroundColor: 'var(--color-bg-surface)',
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-primary)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 rounded-lg border text-xs"
                        style={{
                          backgroundColor: 'var(--color-bg-surface)',
                          borderColor: 'var(--color-border-default)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                    </div>
                  </div>

                  {passError && (
                    <p className="text-xs text-rose-600 font-medium">{passError}</p>
                  )}
                  {passSuccess && (
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Password updated successfully!
                    </p>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isChangingPass || !newPassword}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                      style={{
                        backgroundColor: 'var(--color-accent-primary)',
                        color: 'var(--color-accent-fg)'
                      }}
                    >
                      {isChangingPass ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Data & Backup */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Data & Backup
                </h4>
                <div 
                  className="flex items-center justify-between p-4 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-default)'
                  }}
                >
                  <div>
                    <div className="text-xs font-bold">Export Study Data</div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Download complete backup of your tasks, subjects, goals, and focus history in JSON format.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs hover:opacity-80 shrink-0"
                    style={{
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border-default)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* Help & Onboarding Guide */}
              {onReplayOnboarding && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Help & Guidance
                  </h4>
                  <div 
                    className="flex items-center justify-between p-4 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--color-bg-subtle)',
                      borderColor: 'var(--color-border-default)'
                    }}
                  >
                    <div>
                      <div className="text-xs font-bold">Replay Onboarding Guide</div>
                      <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                        Walk through the core features of Focus Flow. Does not affect your saved study data or progress.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onReplayOnboarding();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer hover:opacity-90 shrink-0 shadow-2xs"
                      style={{
                        borderColor: 'var(--color-border-default)',
                        backgroundColor: 'var(--color-bg-surface)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Compass className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
                      <span>Replay Tour</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sign Out Button */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Session Management
                </h4>
                <div 
                  className="flex items-center justify-between p-4 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-default)'
                  }}
                >
                  <div>
                    <div className="text-xs font-bold">Sign Out of Focus Flow</div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      Safely log out of this browser session.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors shadow-2xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone: Account Deletion */}
              <div>
                <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Danger Zone</span>
                </h4>

                {!showDeleteConfirm ? (
                  <div className="flex items-center justify-between p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-rose-900 dark:text-rose-200">Permanently Delete Account</div>
                      <div className="text-[11px] text-rose-700 dark:text-rose-300">
                        Irreversibly delete your profile, tasks, goals, subjects, and study history.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      Delete Account
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl space-y-3">
                    <div className="flex items-start gap-2.5 text-rose-900 dark:text-rose-200">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-bold">Are you absolutely sure?</p>
                        <p className="text-rose-700 dark:text-rose-300 mt-0.5">
                          This action will permanently purge all your study data. Type <span className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-rose-300">DELETE</span> to confirm.
                        </p>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={deleteInputText}
                      onChange={(e) => setDeleteInputText(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />

                    {deleteError && (
                      <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        {deleteError}
                      </div>
                    )}

                    <div className="flex items-center gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteInputText('');
                          setDeleteError(null);
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deleteInputText !== 'DELETE' || isDeleting}
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting Data...' : 'Permanently Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 7: FEEDBACK & SUGGESTIONS */}
          {activeTab === 'feedback' && (
            <FeedbackSection onSuccessClose={onClose} />
          )}

        </div>
      </div>
    </div>
  );
};
