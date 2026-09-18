import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { SoundSettings, AmbientSoundType, LocalMusicTrack } from '../types';
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
  localMusicVolume: 80,
  localMusicLoop: true,
  localMusicAutoPlayOnFocus: false,
};

const STORAGE_KEY = 'focusflow_sound_settings';

interface SoundContextType {
  // Master & Ambient Settings
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

  // Local Music Player State & Controls
  localTrack: LocalMusicTrack | null;
  isLocalMusicPlaying: boolean;
  localMusicProgress: number; // in seconds
  localMusicDuration: number; // in seconds
  localMusicVolume: number; // 0 to 100
  isLocalMusicLooping: boolean;
  localMusicError: string | null;
  loadLocalTrack: (file: File) => Promise<boolean>;
  playLocalMusic: () => Promise<void>;
  pauseLocalMusic: () => void;
  toggleLocalMusic: () => void;
  seekLocalMusic: (timeInSeconds: number) => void;
  setLocalMusicVolume: (volume: number) => void;
  toggleLocalMusicLoop: () => void;
  removeLocalTrack: () => void;
  stopAllAudio: () => void;
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

  // 2. Local Music State (strictly in-memory, never uploaded)
  const [localTrack, setLocalTrack] = useState<LocalMusicTrack | null>(null);
  const [isLocalMusicPlaying, setIsLocalMusicPlaying] = useState<boolean>(false);
  const [localMusicProgress, setLocalMusicProgress] = useState<number>(0);
  const [localMusicDuration, setLocalMusicDuration] = useState<number>(0);
  const [localMusicVolume, setLocalMusicVolumeState] = useState<number>(() => soundSettings.localMusicVolume ?? 80);
  const [isLocalMusicLooping, setIsLocalMusicLooping] = useState<boolean>(() => soundSettings.localMusicLoop ?? true);
  const [localMusicError, setLocalMusicError] = useState<string | null>(null);

  // Audio element reference for local music
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);

  // Sync profile settings when user logs in or profile loads
  useEffect(() => {
    if (userProfile?.soundSettings) {
      setSoundSettings(prev => ({
        ...prev,
        ...userProfile.soundSettings,
      }));
      if (userProfile.soundSettings.localMusicVolume !== undefined) {
        setLocalMusicVolumeState(userProfile.soundSettings.localMusicVolume);
      }
      if (userProfile.soundSettings.localMusicLoop !== undefined) {
        setIsLocalMusicLooping(userProfile.soundSettings.localMusicLoop);
      }
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

  // Update local audio element volume whenever master volume, master mute, or local music volume changes
  useEffect(() => {
    if (localAudioRef.current) {
      const effectiveVol = soundSettings.masterEnabled 
        ? (localMusicVolume / 100) * (soundSettings.volume / 100)
        : 0;
      localAudioRef.current.volume = Math.max(0, Math.min(1, effectiveVol));
    }
  }, [soundSettings.masterEnabled, soundSettings.volume, localMusicVolume]);

  // Clean up object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }
      if (localAudioRef.current) {
        localAudioRef.current.pause();
        localAudioRef.current.src = '';
      }
    };
  }, []);

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

  // --------------------------------------------------------------------------
  // Local Music Player Methods
  // --------------------------------------------------------------------------

  // Clean up any existing audio element and object URL
  const cleanupExistingAudio = useCallback(() => {
    if (localAudioRef.current) {
      localAudioRef.current.pause();
      localAudioRef.current.onplay = null;
      localAudioRef.current.onpause = null;
      localAudioRef.current.ontimeupdate = null;
      localAudioRef.current.onloadedmetadata = null;
      localAudioRef.current.onended = null;
      localAudioRef.current.onerror = null;
      localAudioRef.current.src = '';
      localAudioRef.current = null;
    }

    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
  }, []);

  // Load a local music file
  const loadLocalTrack = useCallback(async (file: File): Promise<boolean> => {
    if (!file) return false;

    // Supported formats validation
    const supportedExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.mp4', '.aac', '.weba', '.flac'];
    const fileNameLower = file.name.toLowerCase();
    const isSupportedExtension = supportedExtensions.some(ext => fileNameLower.endsWith(ext));
    const isSupportedMime = file.type.startsWith('audio/') || file.type === 'video/mp4' || file.type === 'audio/mp4';

    if (!isSupportedExtension && !isSupportedMime) {
      setLocalMusicError('Unsupported file type. Please choose an MP3, M4A, WAV, OGG, or MP4 audio file.');
      return false;
    }

    // Size limit check (e.g. 200MB safe browser ceiling)
    if (file.size > 200 * 1024 * 1024) {
      setLocalMusicError('File size is too large (>200MB). Please select a smaller audio track.');
      return false;
    }

    try {
      cleanupExistingAudio();
      setLocalMusicError(null);

      // Create browser-local Blob URL (never uploaded to servers)
      const objectUrl = URL.createObjectURL(file);
      activeObjectUrlRef.current = objectUrl;

      const audio = new Audio();
      audio.preload = 'metadata';
      audio.loop = isLocalMusicLooping;

      const effectiveVol = settingsRef.current.masterEnabled 
        ? (localMusicVolume / 100) * (settingsRef.current.volume / 100)
        : 0;
      audio.volume = Math.max(0, Math.min(1, effectiveVol));

      // Set up event listeners
      audio.onplay = () => setIsLocalMusicPlaying(true);
      audio.onpause = () => setIsLocalMusicPlaying(false);
      audio.ontimeupdate = () => {
        setLocalMusicProgress(audio.currentTime);
      };
      audio.onloadedmetadata = () => {
        setLocalMusicDuration(audio.duration || 0);
      };
      audio.onended = () => {
        if (!audio.loop) {
          setIsLocalMusicPlaying(false);
          setLocalMusicProgress(0);
        }
      };
      audio.onerror = () => {
        setLocalMusicError('Could not decode or play this audio track. The file may be corrupted.');
        setIsLocalMusicPlaying(false);
      };

      audio.src = objectUrl;
      localAudioRef.current = audio;

      const trackInfo: LocalMusicTrack = {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'audio/mpeg',
        duration: 0,
        objectUrl: objectUrl,
        file: file,
      };

      setLocalTrack(trackInfo);
      setLocalMusicProgress(0);
      setLocalMusicDuration(0);

      return true;
    } catch (err: any) {
      console.error('Failed to load local track:', err);
      setLocalMusicError('Failed to load local music file.');
      return false;
    }
  }, [cleanupExistingAudio, isLocalMusicLooping, localMusicVolume]);

  // Play local music
  const playLocalMusic = useCallback(async () => {
    if (!localAudioRef.current || !localTrack) return;
    try {
      soundEngine.unlockAudio();
      setLocalMusicError(null);
      const playPromise = localAudioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      setIsLocalMusicPlaying(true);
    } catch (err: any) {
      console.warn('Audio playback was interrupted or prevented:', err);
      if (err.name === 'NotAllowedError') {
        setLocalMusicError('Playback blocked by browser autoplay policy. Click Play to listen.');
      } else {
        setLocalMusicError('Unable to play audio. Check device sound output.');
      }
      setIsLocalMusicPlaying(false);
    }
  }, [localTrack]);

  // Pause local music
  const pauseLocalMusic = useCallback(() => {
    if (localAudioRef.current) {
      localAudioRef.current.pause();
      setIsLocalMusicPlaying(false);
    }
  }, []);

  // Toggle local music
  const toggleLocalMusic = useCallback(() => {
    if (isLocalMusicPlaying) {
      pauseLocalMusic();
    } else {
      playLocalMusic();
    }
  }, [isLocalMusicPlaying, pauseLocalMusic, playLocalMusic]);

  // Seek to a specific timestamp
  const seekLocalMusic = useCallback((timeInSeconds: number) => {
    if (localAudioRef.current) {
      const clamped = Math.max(0, Math.min(localAudioRef.current.duration || 0, timeInSeconds));
      localAudioRef.current.currentTime = clamped;
      setLocalMusicProgress(clamped);
    }
  }, []);

  // Set local music volume
  const setLocalMusicVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    setLocalMusicVolumeState(clamped);
    updateSoundSettings({ localMusicVolume: clamped });

    if (localAudioRef.current) {
      const effectiveVol = settingsRef.current.masterEnabled 
        ? (clamped / 100) * (settingsRef.current.volume / 100)
        : 0;
      localAudioRef.current.volume = Math.max(0, Math.min(1, effectiveVol));
    }
  }, [updateSoundSettings]);

  // Toggle loop mode
  const toggleLocalMusicLoop = useCallback(() => {
    setIsLocalMusicLooping(prev => {
      const nextVal = !prev;
      if (localAudioRef.current) {
        localAudioRef.current.loop = nextVal;
      }
      updateSoundSettings({ localMusicLoop: nextVal });
      return nextVal;
    });
  }, [updateSoundSettings]);

  // Remove current track and free memory
  const removeLocalTrack = useCallback(() => {
    cleanupExistingAudio();
    setLocalTrack(null);
    setIsLocalMusicPlaying(false);
    setLocalMusicProgress(0);
    setLocalMusicDuration(0);
    setLocalMusicError(null);
  }, [cleanupExistingAudio]);

  // Stop both ambient procedural sounds and local music
  const stopAllAudio = useCallback(() => {
    stopAmbient();
    pauseLocalMusic();
  }, [stopAmbient, pauseLocalMusic]);

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

        localTrack,
        isLocalMusicPlaying,
        localMusicProgress,
        localMusicDuration,
        localMusicVolume,
        isLocalMusicLooping,
        localMusicError,
        loadLocalTrack,
        playLocalMusic,
        pauseLocalMusic,
        toggleLocalMusic,
        seekLocalMusic,
        setLocalMusicVolume,
        toggleLocalMusicLoop,
        removeLocalTrack,
        stopAllAudio,
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
