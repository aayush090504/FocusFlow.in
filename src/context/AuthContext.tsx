import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  limit,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, ThemeMode, NotificationSettings, PomodoroSettings, DEFAULT_POMODORO_SETTINGS } from '../types';
import { formatLocalDateKey, getLocalDaysDiff } from '../utils/dateUtils';
import {
  AuthProviderKind,
  DeleteAccountOptions,
  getLinkedAuthProviders,
  executeAccountDeletionWorkflow,
  AccountDeletionError,
} from '../services/accountDeletionService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  linkedProviders: AuthProviderKind[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  sendResetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (options?: DeleteAccountOptions) => Promise<void>;
  updateDailyGoal: (minutes: number) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updateAvatar: (avatarIdOrUrl: string) => Promise<void>;
  updateTheme: (theme: ThemeMode) => Promise<void>;
  updateNotifications: (settings: NotificationSettings) => Promise<void>;
  updatePomodoroSettings: (settings: PomodoroSettings) => Promise<void>;
  changePassword: (newPass: string, currentPass?: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  markDefaultSubjectsSeeded: () => Promise<void>;
  applyStreakUpdate: (lastActiveDate: string, streakCount: number) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_HINT_KEY = 'focusflow_session_hint';

const LOCAL_STORAGE_PREF_KEYS = [
  'focusflow_theme',
  'focusflow_sound_settings',
  'focusflow_pomodoro_settings',
  SESSION_HINT_KEY,
] as const;

function setSessionHint(signedIn: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (signedIn) {
      window.localStorage.setItem(SESSION_HINT_KEY, '1');
    } else {
      window.localStorage.removeItem(SESSION_HINT_KEY);
    }
  } catch {
    // Ignore storage unavailability
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const linkedProviders = useMemo(
    () => getLinkedAuthProviders(user?.providerData),
    [user]
  );

  // Helper to format auth errors cleanly without exposing raw internals
  const parseAuthError = (err: unknown): string => {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code: unknown }).code)
        : '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please log in instead.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Google verification was cancelled before completion.';
      case 'auth/popup-blocked':
        return 'Pop-up was blocked by your browser. Please allow popups for this site and try again.';
      case 'auth/user-mismatch':
        return 'The selected Google account does not match your signed-in account.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful attempts. Please wait a moment before trying again.';
      case 'auth/requires-recent-login':
        return 'For security purposes, please re-verify your credentials before performing this sensitive action.';
      default:
        if (err instanceof AccountDeletionError) {
          return err.message;
        }
        return 'An unexpected authentication error occurred. Please try again.';
    }
  };

  // Sync or create user profile document in Firestore
  const syncUserProfile = async (firebaseUser: User, customName?: string) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const path = `users/${firebaseUser.uid}`;

    try {
      const snap = await getDoc(userDocRef);
      const today = formatLocalDateKey();

      const defaultNotifications: NotificationSettings = {
        timerSound: true,
        breakSound: true,
        dailyReminder: true,
        reminderTime: '18:00',
        streakAlerts: true,
      };

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Check and update study streak based on local calendar days
        let streak = data.streakCount || 0;
        const lastDate = data.lastActiveDate;

        if (lastDate) {
          const diffDays = getLocalDaysDiff(lastDate, today);

          if (diffDays <= 0) {
            // Active today (or ahead from prior UTC timestamp): maintain streak safely
          } else if (diffDays === 1) {
            // Active yesterday locally: streak continues when studying today
          } else {
            // Missed a full local day: reset current streak while preserving longestStreak
            streak = 0;
          }
        } else {
          streak = 1;
        }

        const updatedProfile: UserProfile = {
          ...data,
          id: firebaseUser.uid,
          email: firebaseUser.email || data.email || '',
          displayName: customName || firebaseUser.displayName || data.displayName || 'Student',
          photoURL: firebaseUser.photoURL || data.photoURL || '',
          avatar: data.avatar || 'avatar-1',
          theme: data.theme || 'light',
          dailyGoalMinutes: data.dailyGoalMinutes || 120,
          streakCount: streak,
          pomodoroSettings: data.pomodoroSettings || DEFAULT_POMODORO_SETTINGS,
          notificationSettings: data.notificationSettings || defaultNotifications,
          lastActiveDate: data.lastActiveDate || today,
          hasCompletedOnboarding: data.hasCompletedOnboarding !== undefined ? data.hasCompletedOnboarding : true,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (data.soundSettings !== undefined) {
          updatedProfile.soundSettings = data.soundSettings;
        }
        if (data.gamification !== undefined) {
          const existingLongest = Math.max(
            data.gamification.longestStreak || 0,
            streak,
            ...(data.gamification.awardedStreakMilestones || []),
            0
          );
          updatedProfile.gamification = {
            ...data.gamification,
            longestStreak: existingLongest,
          };
        }
        if (data.onboardingCompletedAt !== undefined) {
          updatedProfile.onboardingCompletedAt = data.onboardingCompletedAt;
        }
        if (data.hasSeededDefaultSubjects !== undefined) {
          updatedProfile.hasSeededDefaultSubjects = data.hasSeededDefaultSubjects;
        }

        // Clean any undefined keys before passing to Firestore setDoc
        const payloadToSave: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(updatedProfile)) {
          if (val !== undefined) {
            payloadToSave[key] = val;
          }
        }

        await setDoc(userDocRef, payloadToSave, { merge: true });
        setUserProfile(updatedProfile);
      } else {
        // Create initial default profile for new user
        const initialProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: customName || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Student'),
          photoURL: firebaseUser.photoURL || '',
          avatar: 'avatar-1',
          theme: 'light',
          dailyGoalMinutes: 120,
          streakCount: 1,
          pomodoroSettings: DEFAULT_POMODORO_SETTINGS,
          notificationSettings: defaultNotifications,
          lastActiveDate: today,
          hasCompletedOnboarding: false,
          hasSeededDefaultSubjects: false,
          gamification: {
            totalXp: 0,
            level: 1,
            unlockedBadges: {},
            notifiedBadgeIds: [],
            awardedSessionIds: [],
            awardedTaskIds: [],
            awardedGoalIds: [],
            awardedStreakMilestones: [],
            notifiedStreakMilestones: [],
            dailyBonusAwardedDates: [],
            streakBonusAwardedDates: [],
            longestStreak: 1,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const initialPayload: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(initialProfile)) {
          if (val !== undefined) {
            initialPayload[key] = val;
          }
        }

        await setDoc(userDocRef, initialPayload);
        setUserProfile(initialProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setError(null);
      if (currentUser) {
        setSessionHint(true);
        setUser(currentUser);
        try {
          await syncUserProfile(currentUser);
        } catch {
          console.error('Failed to sync profile.');
        }
      } else {
        setSessionHint(false);
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const reauthenticateCurrentUser = async (
    currentUser: User,
    provider: AuthProviderKind,
    password?: string
  ): Promise<void> => {
    if (provider === 'password') {
      if (!currentUser.email || !password) {
        throw new Error('Please enter your current password to verify your identity.');
      }
      try {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      } catch (err) {
        throw new Error(parseAuthError(err));
      }
      return;
    }

    // Google re-authentication via popup
    try {
      const reauthProvider = new GoogleAuthProvider();
      if (currentUser.email) {
        reauthProvider.setCustomParameters({
          login_hint: currentUser.email,
          prompt: 'select_account',
        });
      } else {
        reauthProvider.setCustomParameters({ prompt: 'select_account' });
      }
      const result = await reauthenticateWithPopup(currentUser, reauthProvider);
      if (result.user.uid !== currentUser.uid) {
        throw new Error('The selected Google account does not match your signed-in account.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('does not match')) {
        throw err;
      }
      throw new Error(parseAuthError(err));
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(res.user);
    } catch (err: unknown) {
      setError(parseAuthError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await syncUserProfile(res.user);
    } catch (err: unknown) {
      const msg = parseAuthError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (name.trim()) {
        await updateProfile(res.user, { displayName: name.trim() });
      }
      await syncUserProfile(res.user, name.trim());
    } catch (err: unknown) {
      const msg = parseAuthError(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const sendResetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const msg = parseAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setSessionHint(false);
      setUser(null);
      setUserProfile(null);
    } catch (err: unknown) {
      const msg = parseAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const deleteAccount = async (options: DeleteAccountOptions = {}) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No active user session found.');
    }

    setError(null);
    const uid = currentUser.uid;
    const providers = getLinkedAuthProviders(currentUser.providerData);

    try {
      await executeAccountDeletionWorkflow(
        {
          uid,
          linkedProviders: providers,
          reauthenticate: async (provider, password) => {
            await reauthenticateCurrentUser(currentUser, provider, password);
          },
          fetchSubcollectionBatchIds: async (subcollection, batchSize) => {
            const colRef = collection(db, 'users', uid, subcollection);
            const snap = await getDocs(query(colRef, limit(batchSize)));
            return snap.docs.map((d) => d.id);
          },
          deleteSubcollectionBatch: async (subcollection, docIds) => {
            const batch = writeBatch(db);
            for (const docId of docIds) {
              batch.delete(doc(db, 'users', uid, subcollection, docId));
            }
            await batch.commit();
          },
          deleteUserProfileDoc: async () => {
            await deleteDoc(doc(db, 'users', uid));
          },
          deleteAuthUser: async () => {
            await deleteUser(currentUser);
          },
          clearLocalData: () => {
            try {
              for (const key of LOCAL_STORAGE_PREF_KEYS) {
                localStorage.removeItem(key);
              }
            } catch {
              // Ignore storage quota/availability restrictions
            }
          },
        },
        options
      );

      setUser(null);
      setUserProfile(null);
    } catch (err: unknown) {
      const msg = parseAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const updateDailyGoal = async (minutes: number) => {
    if (!user || !userProfile) return;
    const userDocRef = doc(db, 'users', user.uid);
    const path = `users/${user.uid}`;
    try {
      await updateDoc(userDocRef, {
        dailyGoalMinutes: minutes,
        updatedAt: new Date().toISOString()
      });
      setUserProfile(prev => prev ? { ...prev, dailyGoalMinutes: minutes } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateDisplayName = async (name: string) => {
    if (!user || !userProfile) return;
    try {
      await updateProfile(user, { displayName: name });
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: name,
        updatedAt: new Date().toISOString()
      });
      setUserProfile(prev => prev ? { ...prev, displayName: name } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateAvatar = async (avatarIdOrUrl: string) => {
    if (!user || !userProfile) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        avatar: avatarIdOrUrl,
        photoURL: avatarIdOrUrl.startsWith('http') ? avatarIdOrUrl : '',
        updatedAt: new Date().toISOString()
      });
      setUserProfile(prev => prev ? { ...prev, avatar: avatarIdOrUrl, photoURL: avatarIdOrUrl.startsWith('http') ? avatarIdOrUrl : prev.photoURL } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateTheme = async (newTheme: ThemeMode) => {
    if (!user || !userProfile) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        theme: newTheme,
        updatedAt: new Date().toISOString()
      });
      setUserProfile(prev => prev ? { ...prev, theme: newTheme } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateNotifications = async (settings: NotificationSettings) => {
    if (!user || !userProfile) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        notificationSettings: settings,
        updatedAt: new Date().toISOString()
      });
      setUserProfile(prev => prev ? { ...prev, notificationSettings: settings } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updatePomodoroSettings = async (settings: PomodoroSettings) => {
    if (!user || !userProfile) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        pomodoroSettings: settings,
        updatedAt: new Date().toISOString()
      });
      setUserProfile(prev => prev ? { ...prev, pomodoroSettings: settings } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const changePassword = async (newPass: string, currentPass?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      if (currentPass && getLinkedAuthProviders(currentUser.providerData).includes('password')) {
        await reauthenticateCurrentUser(currentUser, 'password', currentPass);
      }
      await updatePassword(currentUser, newPass);
    } catch (err: unknown) {
      const msg = parseAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const now = new Date().toISOString();
      await updateDoc(userDocRef, {
        hasCompletedOnboarding: true,
        onboardingCompletedAt: now,
        updatedAt: now
      });
      setUserProfile(prev => prev ? {
        ...prev,
        hasCompletedOnboarding: true,
        onboardingCompletedAt: now,
        updatedAt: now
      } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const markDefaultSubjectsSeeded = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const now = new Date().toISOString();
      await updateDoc(userDocRef, {
        hasSeededDefaultSubjects: true,
        updatedAt: now
      });
      setUserProfile(prev => prev ? {
        ...prev,
        hasSeededDefaultSubjects: true,
        updatedAt: now
      } : null);
    } catch {
      console.warn('Could not persist default subject initialization flag.');
    }
  };

  const applyStreakUpdate = (lastActiveDate: string, streakCount: number) => {
    setUserProfile(prev => {
      if (!prev) return null;
      const currentLongest = Math.max(
        prev.gamification?.longestStreak || 0,
        streakCount,
        ...(prev.gamification?.awardedStreakMilestones || []),
        0
      );
      return {
        ...prev,
        lastActiveDate,
        streakCount,
        gamification: prev.gamification
          ? { ...prev.gamification, longestStreak: currentLongest }
          : prev.gamification,
      };
    });
  };

  const refreshProfile = async () => {
    if (user) {
      await syncUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        linkedProviders,
        loading,
        error,
        clearError,
        signInWithGoogle,
        loginWithEmail,
        signupWithEmail,
        sendResetPassword,
        logout,
        deleteAccount,
        updateDailyGoal,
        updateDisplayName,
        updateAvatar,
        updateTheme,
        updateNotifications,
        updatePomodoroSettings,
        changePassword,
        completeOnboarding,
        markDefaultSubjectsSeeded,
        applyStreakUpdate,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
