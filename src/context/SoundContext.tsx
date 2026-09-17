import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { SoundSettings, AmbientSoundType } from '../types';
import { soundEngine } from '../utils/soundEngine';

export interface AmbientSoundOption {
  id: AmbientSoundType;
  label: string;
  category: 'noise' | 'nature' | 'ambiance' | 'focus';
  description: string;
}

export const AMBIENT_SOUND_OPTIONS: AmbientSoundOption[] = [
  { id: 'none', label: 'None (Silent)', category: 'ambiance', description: 'Distraction-free silence' },
  { id: 'rain', label: 'Gentle Rain', category: 'nature', description: 'Soft soothing rainfall and subtle droplet textures' },
  { id: 'brown_noise', label: 'Brown Noise', category: 'noise', description: 'Warm, deep low-frequency rumble for ADHD & deep focus' },
  { id: 'pink_noise', label: 'Pink Noise', category: 'noise', description: 'Balanced 1/f masking frequency for studying' },
  { id: 'white_noise', label: 'White Noise', category: 'noise', description: 'Crisp broadband sound for blocking sudden background noises' },
  { id: 'cafe', label: 'Cozy Cafe', category: 'ambiance', description: 'Warm, cozy coffee shop acoustic atmosphere' },
  { id: 'binaural_alpha', label: 'Binaural Alpha (10Hz)', category: 'focus', description: 'Alpha wave binaural beats for effortless flow state' },
  { id: 'forest_stream', label: 'Forest Stream', category: 'nature', description: 'Rushing stream waters and natural outdoor flow' },
];

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  masterEnabled: true,
  volume: 75,
  sessionStartSound: true,
  breakStartSound: true,
  completionSound: true,
  ambientType: 'none',
  ambientVolume: 50,
  ambientAutoPlayOnFocus: true,
};

const STORAGE_KEY = 'focusflow_sound_settings';

interface SoundContextType {
  soundSettings: SoundSettings;
  updateSoundSettings: (partial: Partial<SoundSettings>) => Promise<void>;
  toggleMasterSound: () => void;
  setMasterVolume: (volume: number) => void;
  setAmbientVolume: (volume: number) => void;
  setAmbientType: (type: AmbientSoundType) => void;
  isAmbientPlaying: boolean;
  startAmbient: (overrideType?: AmbientSoundType) => void;
  stopAmbient: () => void;
  toggleAmbientPlayback: () => void;
  playCue: (cue: 'session_start' | 'break_start' | 'session_complete' | 'tick') => void;
  unlockAudio: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();

  // 1. Initial State from localStorage or userProfile
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SOUND_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {}
    return userProfile?.soundSettings || DEFAULT_SOUND_SETTINGS;
  });

  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);
  const settingsRef = useRef(soundSettings);
  settingsRef.current = soundSettings;

  // Sync profile settings when user logs in or profile loads
  useEffect(() => {
    if (userProfile?.soundSettings) {
      setSoundSettings(prev => ({
        ...prev,
        ...userProfile.soundSettings,
      }));
    }
  }, [userProfile?.soundSettings]);

  // Keep sound engine in sync with volume & mute states
  useEffect(() => {
    soundEngine.updateVolumeSettings(
      soundSettings.volume,
      !soundSettings.masterEnabled,
      soundSettings.ambientVolume
    );
  }, [soundSettings.volume, soundSettings.masterEnabled, soundSettings.ambientVolume]);

  // Persist settings changes
  const updateSoundSettings = useCallback(async (partial: Partial<SoundSettings>) => {
    setSoundSettings(prev => {
      const updated: SoundSettings = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}

      // Update sound engine
      soundEngine.updateVolumeSettings(
        updated.volume,
        !updated.masterEnabled,
        updated.ambientVolume
      );

      // Handle ambient track changes if playing
      if (partial.ambientType !== undefined) {
        if (partial.ambientType === 'none') {
          soundEngine.stopAmbient();
          setIsAmbientPlaying(false);
        } else if (isAmbientPlaying) {
          soundEngine.startAmbient(partial.ambientType);
        }
      }

      return updated;
    });

    // Sync to Firestore user profile if authenticated
    if (user?.uid) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          soundSettings: { ...settingsRef.current, ...partial },
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to sync sound settings to Firestore:', err);
      }
    }
  }, [user?.uid, isAmbientPlaying]);

  const toggleMasterSound = useCallback(() => {
    updateSoundSettings({ masterEnabled: !settingsRef.current.masterEnabled });
  }, [updateSoundSettings]);

  const setMasterVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    updateSoundSettings({ volume: clamped });
  }, [updateSoundSettings]);

  const setAmbientVolume = useCallback((ambientVolume: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(ambientVolume)));
    updateSoundSettings({ ambientVolume: clamped });
  }, [updateSoundSettings]);

  const setAmbientType = useCallback((type: AmbientSoundType) => {
    updateSoundSettings({ ambientType: type });
  }, [updateSoundSettings]);

  const startAmbient = useCallback((overrideType?: AmbientSoundType) => {
    soundEngine.unlockAudio();
    const typeToPlay = overrideType || settingsRef.current.ambientType;
    if (typeToPlay === 'none') {
      soundEngine.stopAmbient();
      setIsAmbientPlaying(false);
      return;
    }
    soundEngine.startAmbient(typeToPlay);
    setIsAmbientPlaying(true);
  }, []);

  const stopAmbient = useCallback(() => {
    soundEngine.stopAmbient();
    setIsAmbientPlaying(false);
  }, []);

  const toggleAmbientPlayback = useCallback(() => {
    if (isAmbientPlaying) {
      stopAmbient();
    } else {
      if (settingsRef.current.ambientType === 'none') {
        // Default to brown noise or rain if none currently selected
        updateSoundSettings({ ambientType: 'brown_noise' });
        startAmbient('brown_noise');
      } else {
        startAmbient();
      }
    }
  }, [isAmbientPlaying, startAmbient, stopAmbient, updateSoundSettings]);

  const playCue = useCallback((cue: 'session_start' | 'break_start' | 'session_complete' | 'tick') => {
    if (!settingsRef.current.masterEnabled) return;
    soundEngine.unlockAudio();

    switch (cue) {
      case 'session_start':
        if (settingsRef.current.sessionStartSound) {
          soundEngine.playSessionStart();
        }
        break;
      case 'break_start':
        if (settingsRef.current.breakStartSound) {
          soundEngine.playBreakStart();
        }
        break;
      case 'session_complete':
        if (settingsRef.current.completionSound) {
          soundEngine.playSessionComplete();
        }
        break;
      case 'tick':
        soundEngine.playButtonTick();
        break;
    }
  }, []);

  const unlockAudio = useCallback(() => {
    soundEngine.unlockAudio();
  }, []);

  return (
    <SoundContext.Provider
      value={{
        soundSettings,
        updateSoundSettings,
        toggleMasterSound,
        setMasterVolume,
        setAmbientVolume,
        setAmbientType,
        isAmbientPlaying,
        startAmbient,
        stopAmbient,
        toggleAmbientPlayback,
        playCue,
        unlockAudio,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
