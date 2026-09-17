import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  Volume1,
  Play, 
  Pause, 
  Headphones, 
  CloudRain, 
  Waves, 
  Activity, 
  Sparkles, 
  Coffee, 
  Trees, 
  Sliders
} from 'lucide-react';
import { useSound, AMBIENT_SOUND_OPTIONS, AmbientSoundOption } from '../../context/SoundContext';
import { AmbientSoundType } from '../../types';

interface AmbientSoundControlProps {
  compact?: boolean;
}

const getAmbientIcon = (id: AmbientSoundType) => {
  switch (id) {
    case 'rain': return <CloudRain className="w-4 h-4 text-sky-500" />;
    case 'brown_noise': return <Waves className="w-4 h-4 text-amber-600" />;
    case 'pink_noise': return <Activity className="w-4 h-4 text-rose-500" />;
    case 'white_noise': return <Sparkles className="w-4 h-4 text-indigo-400" />;
    case 'cafe': return <Coffee className="w-4 h-4 text-amber-500" />;
    case 'binaural_alpha': return <Headphones className="w-4 h-4 text-purple-500" />;
    case 'forest_stream': return <Trees className="w-4 h-4 text-emerald-500" />;
    default: return <VolumeX className="w-4 h-4 text-slate-400" />;
  }
};

export const AmbientSoundControl: React.FC<AmbientSoundControlProps> = ({ compact = false }) => {
  const {
    soundSettings,
    updateSoundSettings,
    toggleMasterSound,
    setMasterVolume,
    setAmbientVolume,
    setAmbientType,
    isAmbientPlaying,
    toggleAmbientPlayback,
    playCue,
  } = useSound();

  const handleSelectAmbient = (type: AmbientSoundType) => {
    setAmbientType(type);
    if (type !== 'none' && !isAmbientPlaying) {
      toggleAmbientPlayback();
    }
  };

  const currentOption = AMBIENT_SOUND_OPTIONS.find(o => o.id === soundSettings.ambientType) || AMBIENT_SOUND_OPTIONS[0];

  if (compact) {
    return (
      <div 
        className="p-3.5 rounded-2xl border flex flex-col gap-3 w-full"
        style={{
          backgroundColor: 'var(--color-bg-subtle)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMasterSound}
              className="p-1.5 rounded-lg border text-xs font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border-default)',
                color: soundSettings.masterEnabled ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'
              }}
              title={soundSettings.masterEnabled ? 'Mute all audio' : 'Enable audio'}
              aria-label={soundSettings.masterEnabled ? 'Mute audio' : 'Unmute audio'}
            >
              {soundSettings.masterEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Sound & Ambience
            </span>
          </div>

          {soundSettings.ambientType !== 'none' && soundSettings.masterEnabled && (
            <button
              type="button"
              onClick={toggleAmbientPlayback}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                isAmbientPlaying
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
              aria-label={isAmbientPlaying ? 'Pause ambient sound' : 'Play ambient sound'}
            >
              {isAmbientPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isAmbientPlaying ? 'Playing' : 'Play'}</span>
            </button>
          )}
        </div>

        {/* Ambient Track Selector */}
        <div className="flex items-center gap-2">
          <select
            id="ambient-track-compact-select"
            value={soundSettings.ambientType}
            onChange={(e) => handleSelectAmbient(e.target.value as AmbientSoundType)}
            disabled={!soundSettings.masterEnabled}
            className="flex-1 px-3 py-1.5 border rounded-xl text-xs font-medium focus:outline-none disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
            aria-label="Ambient background track"
          >
            {AMBIENT_SOUND_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sliders in compact view if active */}
        {soundSettings.masterEnabled && soundSettings.ambientType !== 'none' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-12">Vol {soundSettings.ambientVolume}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={soundSettings.ambientVolume}
              onChange={(e) => setAmbientVolume(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-lg cursor-pointer"
              style={{ accentColor: 'var(--color-accent-primary)' }}
              aria-label="Ambient sound volume"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="rounded-3xl border shadow-xs p-6 space-y-5"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-default)',
        color: 'var(--color-text-primary)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: 'var(--color-accent-subtle)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-accent-primary)'
            }}
          >
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Ambient Focus Sounds</h3>
            <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              Acoustic masking & flow state audio
            </p>
          </div>
        </div>

        {/* Master Mute Toggle */}
        <button
          type="button"
          onClick={toggleMasterSound}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors touch-target"
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            borderColor: 'var(--color-border-default)',
            color: soundSettings.masterEnabled ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
          }}
          title={soundSettings.masterEnabled ? 'Mute all sounds' : 'Enable sounds'}
          aria-label={soundSettings.masterEnabled ? 'Mute all sounds' : 'Enable sounds'}
        >
          {soundSettings.masterEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Audio On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              <span>Muted</span>
            </>
          )}
        </button>
      </div>

      {/* Track Selection Grid */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          Soundscape
        </label>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Ambient sound options">
          {AMBIENT_SOUND_OPTIONS.map((opt) => {
            const isSelected = soundSettings.ambientType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectAmbient(opt.id)}
                disabled={!soundSettings.masterEnabled}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 touch-target ${
                  isSelected 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs' 
                    : 'hover:border-slate-300 dark:hover:border-slate-700'
                } disabled:opacity-40`}
                style={{
                  backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-bg-subtle)',
                  borderColor: isSelected ? 'var(--color-accent-primary)' : 'var(--color-border-default)',
                }}
              >
                <div className="mt-0.5">{getAmbientIcon(opt.id)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate" style={{ color: isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-primary)' }}>
                    {opt.label}
                  </div>
                  <div className="text-[10px] leading-tight line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {opt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Track Control Bar */}
      {soundSettings.ambientType !== 'none' && (
        <div 
          className="p-4 rounded-2xl border space-y-3.5"
          style={{
            backgroundColor: 'var(--color-bg-subtle)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {getAmbientIcon(soundSettings.ambientType)}
              </div>
              <div>
                <span className="text-xs font-bold block" style={{ color: 'var(--color-text-primary)' }}>
                  {currentOption.label}
                </span>
                {isAmbientPlaying && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Playing procedural audio</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={toggleAmbientPlayback}
              disabled={!soundSettings.masterEnabled}
              className={`p-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center touch-target ${
                isAmbientPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              } disabled:opacity-40`}
              aria-label={isAmbientPlaying ? 'Pause ambient audio' : 'Play ambient audio'}
            >
              {isAmbientPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
          </div>

          {/* Ambient Volume Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Ambient Volume</span>
              <span className="font-mono font-bold" style={{ color: 'var(--color-accent-primary)' }}>{soundSettings.ambientVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={soundSettings.ambientVolume}
              onChange={(e) => setAmbientVolume(Number(e.target.value))}
              disabled={!soundSettings.masterEnabled}
              className="w-full h-1.5 rounded-lg cursor-pointer touch-target disabled:opacity-40"
              style={{ accentColor: 'var(--color-accent-primary)' }}
              aria-label="Ambient volume slider"
            />
          </div>
        </div>
      )}

      {/* Master Volume Slider */}
      <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--color-border-default)' }}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            <Volume1 className="w-3.5 h-3.5" />
            <span>Master Volume</span>
          </span>
          <span className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {soundSettings.masterEnabled ? `${soundSettings.volume}%` : 'Muted'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={soundSettings.volume}
          onChange={(e) => setMasterVolume(Number(e.target.value))}
          disabled={!soundSettings.masterEnabled}
          className="w-full h-1.5 rounded-lg cursor-pointer touch-target disabled:opacity-40"
          style={{ accentColor: 'var(--color-accent-primary)' }}
          aria-label="Master volume slider"
        />
      </div>

      {/* Cues Preview Buttons */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
        <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Audio Cues & Chimes
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => playCue('session_start')}
            disabled={!soundSettings.masterEnabled}
            className="py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-colors text-center disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
          >
            Start Cue
          </button>
          <button
            type="button"
            onClick={() => playCue('break_start')}
            disabled={!soundSettings.masterEnabled}
            className="py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-colors text-center disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
          >
            Break Cue
          </button>
          <button
            type="button"
            onClick={() => playCue('session_complete')}
            disabled={!soundSettings.masterEnabled}
            className="py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-colors text-center disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)'
            }}
          >
            Done Cue
          </button>
        </div>
      </div>
    </div>
  );
};
