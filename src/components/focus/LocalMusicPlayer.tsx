import React, { useRef, useState } from 'react';
import { 
  Music, 
  UploadCloud, 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Trash2, 
  FileAudio, 
  AlertCircle, 
  Sparkles,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { useSound } from '../../context/SoundContext';

interface LocalMusicPlayerProps {
  compact?: boolean;
}

export const LocalMusicPlayer: React.FC<LocalMusicPlayerProps> = ({ compact = false }) => {
  const {
    soundSettings,
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
  } = useSound();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0 || !isFinite(sec)) return '00:00';
    const mins = Math.floor(sec / 60);
    const remainingSecs = Math.floor(sec % 60);
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'AUDIO';
    return ext.length > 4 ? 'AUDIO' : ext;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsLoadingFile(true);
    try {
      const success = await loadLocalTrack(file);
      if (success && soundSettings.masterEnabled) {
        // Auto start if audio is unmuted and user initiated action
        await playLocalMusic();
      }
    } finally {
      setIsLoadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileSelect(e.dataTransfer.files);
    }
  };

  // Compact Variant (e.g. for Quick Focus modal or sidebar)
  if (compact) {
    return (
      <div 
        className="p-3.5 rounded-2xl border flex flex-col gap-3 w-full"
        style={{
          backgroundColor: 'var(--color-bg-subtle)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.ogg,.mp4,.aac"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-accent-primary)',
              }}
            >
              <Music className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold truncate block" style={{ color: 'var(--color-text-primary)' }}>
                {localTrack ? localTrack.name : 'Local Music'}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                {localTrack ? `${formatSeconds(localMusicProgress)} / ${formatSeconds(localMusicDuration)}` : 'MP3, M4A, WAV, OGG'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {localTrack ? (
              <>
                <button
                  type="button"
                  onClick={toggleLocalMusic}
                  disabled={!soundSettings.masterEnabled}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    isLocalMusicPlaying
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  } disabled:opacity-40`}
                  title={isLocalMusicPlaying ? 'Pause' : 'Play'}
                  aria-label={isLocalMusicPlaying ? 'Pause music' : 'Play music'}
                >
                  {isLocalMusicPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>
                <button
                  type="button"
                  onClick={removeLocalTrack}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  title="Remove track"
                  aria-label="Remove local music track"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoadingFile}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-accent-primary)',
                }}
              >
                <FolderOpen className="w-3 h-3" />
                <span>Choose</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact Seek bar if track is loaded */}
        {localTrack && (
          <div className="space-y-1 pt-1">
            <input
              type="range"
              min="0"
              max={localMusicDuration || 100}
              step="0.5"
              value={localMusicProgress}
              onChange={(e) => seekLocalMusic(Number(e.target.value))}
              disabled={!soundSettings.masterEnabled}
              className="w-full h-1.5 rounded-lg cursor-pointer disabled:opacity-40"
              style={{ accentColor: 'var(--color-accent-primary)' }}
              aria-label="Track progress slider"
            />
          </div>
        )}
      </div>
    );
  }

  // Full Rich Variant
  return (
    <div 
      className="rounded-3xl border shadow-xs p-5 sm:p-6 space-y-5"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-default)',
        color: 'var(--color-text-primary)'
      }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.mp4,.aac,.flac"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: 'var(--color-accent-subtle)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-accent-primary)'
            }}
          >
            <Music className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">Local Music Player</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                100% Private (No Uploads)
              </span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              Play your study playlist, lofi beats, or audiobooks directly from your device
            </p>
          </div>
        </div>

        {localTrack && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors touch-target"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
            title="Change current audio track"
            aria-label="Change current track"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Change Track</span>
          </button>
        )}
      </div>

      {/* Error Message banner */}
      {localMusicError && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{localMusicError}</span>
        </div>
      )}

      {/* No Track State - Drag & Drop Zone */}
      {!localTrack ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-500/10 ring-4 ring-indigo-500/20' 
              : 'hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50/50 dark:hover:bg-slate-900/40'
          }`}
          style={{
            borderColor: isDragging ? 'var(--color-accent-primary)' : 'var(--color-border-default)',
            backgroundColor: isDragging ? 'var(--color-accent-subtle)' : 'var(--color-bg-subtle)',
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload audio file. Drag and drop or click to browse"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
        >
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-accent-primary)'
            }}
          >
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {isLoadingFile ? 'Loading audio file...' : 'Drop your audio file here, or browse device'}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              Supports MP3, M4A, WAV, OGG, and MP4 audio tracks
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {['MP3', 'M4A', 'WAV', 'OGG', 'MP4 Audio'].map((format) => (
              <span 
                key={format}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* Loaded Track Player Interface */
        <div 
          className="p-4 sm:p-5 rounded-2xl border space-y-4"
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          {/* Track Header Details */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Animated Waveform Icon Container */}
              <div 
                className="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 relative overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-accent-subtle)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-accent-primary)',
                }}
              >
                {isLocalMusicPlaying && soundSettings.masterEnabled ? (
                  <div className="flex items-end gap-0.5 h-5 px-1">
                    <span className="w-1 bg-indigo-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] motion-reduce:animate-none h-3" />
                    <span className="w-1 bg-indigo-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.15s] motion-reduce:animate-none h-5" />
                    <span className="w-1 bg-indigo-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.3s] motion-reduce:animate-none h-4" />
                    <span className="w-1 bg-indigo-500 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.2s] motion-reduce:animate-none h-2" />
                  </div>
                ) : (
                  <FileAudio className="w-5 h-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold truncate" title={localTrack.name} style={{ color: 'var(--color-text-primary)' }}>
                    {localTrack.name}
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase shrink-0">
                    {getFileExtension(localTrack.name)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>{formatFileSize(localTrack.size)}</span>
                  <span>•</span>
                  <span>{isLocalMusicPlaying ? 'Playing' : 'Paused'}</span>
                  {!soundSettings.masterEnabled && (
                    <>
                      <span>•</span>
                      <span className="text-amber-500 font-semibold">(Master audio muted)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Remove / Clear Track Button */}
            <button
              type="button"
              onClick={removeLocalTrack}
              className="p-2 rounded-xl border hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-colors touch-target shrink-0"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)',
              }}
              title="Remove local music track"
              aria-label="Remove local music track"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Progress Bar & Timers */}
          <div className="space-y-1.5">
            <input
              type="range"
              min="0"
              max={localMusicDuration || 100}
              step="0.5"
              value={localMusicProgress}
              onChange={(e) => seekLocalMusic(Number(e.target.value))}
              disabled={!soundSettings.masterEnabled}
              className="w-full h-2 rounded-lg cursor-pointer touch-target disabled:opacity-40"
              style={{ accentColor: 'var(--color-accent-primary)' }}
              aria-label="Track progress"
            />
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              <span>{formatSeconds(localMusicProgress)}</span>
              <span>{formatSeconds(localMusicDuration)}</span>
            </div>
          </div>

          {/* Player Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={toggleLocalMusic}
                disabled={!soundSettings.masterEnabled}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs touch-target ${
                  isLocalMusicPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                } disabled:opacity-40`}
                aria-label={isLocalMusicPlaying ? 'Pause local music' : 'Play local music'}
              >
                {isLocalMusicPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Play</span>
                  </>
                )}
              </button>

              {/* Loop Mode Toggle */}
              <button
                type="button"
                onClick={toggleLocalMusicLoop}
                className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 touch-target ${
                  isLocalMusicLooping
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                style={{
                  backgroundColor: isLocalMusicLooping ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                  borderColor: isLocalMusicLooping ? 'var(--color-accent-primary)' : 'var(--color-border-default)',
                  color: isLocalMusicLooping ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                }}
                title={isLocalMusicLooping ? 'Looping enabled' : 'Looping disabled'}
                aria-label={isLocalMusicLooping ? 'Disable track repeat' : 'Enable track repeat'}
              >
                {isLocalMusicLooping ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                <span className="text-[11px] font-bold hidden sm:inline">
                  {isLocalMusicLooping ? 'Looping On' : 'Loop Off'}
                </span>
              </button>
            </div>

            {/* Local Track Volume Control */}
            <div className="flex items-center gap-2 min-w-[150px] sm:min-w-[180px]">
              <span className="text-slate-500">
                {localMusicVolume === 0 || !soundSettings.masterEnabled ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : localMusicVolume < 50 ? (
                  <Volume1 className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={localMusicVolume}
                onChange={(e) => setLocalMusicVolume(Number(e.target.value))}
                disabled={!soundSettings.masterEnabled}
                className="w-24 sm:w-28 h-1.5 rounded-lg cursor-pointer touch-target disabled:opacity-40"
                style={{ accentColor: 'var(--color-accent-primary)' }}
                aria-label="Local music volume"
              />
              <span className="text-xs font-mono font-bold w-9 text-right" style={{ color: 'var(--color-text-primary)' }}>
                {localMusicVolume}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
