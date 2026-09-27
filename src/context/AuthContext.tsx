import React, { createContext, useContext, useEffect, useState } from 'react';
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
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, ThemeMode, NotificationSettings, PomodoroSettings, DEFAULT_POMODORO_SETTINGS } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  sendResetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateDailyGoal: (minutes: number) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updateAvatar: (avatarIdOrUrl: string) => Promise<void>;
  updateTheme: (theme: ThemeMode) => Promise<void>;
  updateNotifications: (settings: NotificationSettings) => Promise<void>;
  updatePomodoroSettings: (settings: PomodoroSettings) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Helper to format auth errors cleanly
  const parseAuthError = (err: any): string => {
    const code = err?.code || '';
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
        return 'Google Sign-in was cancelled before completion.';
      case 'auth/popup-blocked':
        return 'Pop-up was blocked by your browser. Please allow popups for this site.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful attempts. Please wait a moment or reset your password.';
      case 'auth/requires-recent-login':
        return 'For security purposes, please log out and log back in before modifying sensitive credentials.';
      default:
        return err?.message || 'An unexpected authentication error occurred. Please try again.';
    }
  };

  // Sync or create user profile document in Firestore
  const syncUserProfile = async (firebaseUser: User, customName?: string) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const path = `users/${firebaseUser.uid}`;

    try {
      const snap = await getDoc(userDocRef);
      const today = new Date().toISOString().split('T')[0];

      const defaultNotifications: NotificationSettings = {
        timerSound: true,
        breakSound: true,
        dailyReminder: true,
        reminderTime: '18:00',
        streakAlerts: true,
      };

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Check and update study streak based on last active date
        let streak = data.streakCount || 0;
        const lastDate = data.lastActiveDate;

        if (lastDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastDate === today) {
            // Already active today, maintain streak
          } else if (lastDate === yesterdayStr) {
            // Active yesterday, streak continues when studying today
          } else {
            // Missed a day, reset streak to 0 if gap is > 1 day
            const diffDays = Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24));
            if (diffDays > 1) {
              streak = 0;
            }
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
          updatedProfile.gamification = data.gamification;
        }
        if (data.onboardingCompletedAt !== undefined) {
          updatedProfile.onboardingCompletedAt = data.onboardingCompletedAt;
        }

        // Clean any undefined keys before passing to Firestore setDoc
        const payloadToSave: Record<string, any> = {};
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
          dailyGoalMinutes: 120, // default 2 hours daily study goal
          streakCount: 1,
          pomodoroSettings: DEFAULT_POMODORO_SETTINGS,
          notificationSettings: defaultNotifications,
          lastActiveDate: today,
          hasCompletedOnboarding: false,
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
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const initialPayload: Record<string, any> = {};
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
        setUser(currentUser);
        try {
          await syncUserProfile(currentUser);
        } catch (e) {
          console.error('Failed to sync profile', e);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(res.user);
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      const msg = parseAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      const msg = parseAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    setError(null);
    try {
      const uid = auth.currentUser.uid;
      // Mark user profile doc deleted
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, { deleted: true }, { merge: true }).catch(() => {});
      
      // Delete from Firebase Auth
      await deleteUser(auth.currentUser);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
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
      const path = `users/${user.uid}`;
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

  const changePassword = async (newPass: string) => {
    if (!auth.currentUser) return;
    try {
      await updatePassword(auth.currentUser, newPass);
    } catch (err: any) {
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

