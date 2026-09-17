// Web Audio API Procedural Sound Engine for Focus Flow
// Provides pristine, zero-dependency, low-latency audio for study timers and ambient focus tracks.
import { AmbientSoundType } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private chimesGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  
  private currentAmbientType: AmbientSoundType = 'none';
  private ambientNodes: {
    sources: (AudioNode | AudioBufferSourceNode | OscillatorNode)[];
    intervalIds?: number[];
    stopFn?: () => void;
  } | null = null;

  private isMuted: boolean = false;
  private masterVol: number = 0.8; // 0 to 1
  private ambientVol: number = 0.5; // 0 to 1

  // Initialize or return AudioContext safely (handles Safari / Chrome audio unlock)
  private getContext(): AudioContext | null {
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return null;
        this.ctx = new AudioContextClass();

        // Create routing graph
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.chimesGain = this.ctx.createGain();
        this.chimesGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.chimesGain.connect(this.masterGain);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(this.ambientVol, this.ctx.currentTime);
        this.ambientGain.connect(this.masterGain);
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      return this.ctx;
    } catch (e) {
      console.warn('Focus Flow AudioContext initialization error:', e);
      return null;
    }
  }

  // Public method to unlock audio on first user gesture (touch / click)
  public unlockAudio() {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  // Update volume & mute states
  public updateVolumeSettings(masterVolume: number, isMuted: boolean, ambientVolume: number) {
    this.masterVol = Math.max(0, Math.min(1, masterVolume / 100));
    this.isMuted = isMuted;
    this.ambientVol = Math.max(0, Math.min(1, ambientVolume / 100));

    const ctx = this.getContext();
    if (!ctx) return;

    const targetMaster = this.isMuted ? 0 : this.masterVol;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetMaster, ctx.currentTime + 0.05);
    }

    if (this.ambientGain) {
      this.ambientGain.gain.cancelScheduledValues(ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(this.ambientVol, ctx.currentTime + 0.05);
    }
  }

  // --------------------------------------------------------------------------
  // Cues & Chimes (Session Start, Break Start, Session Complete)
  // --------------------------------------------------------------------------

  public playSessionStart() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.chimesGain) return;

    const t = ctx.currentTime;
    // Elegant rising 3-bell sequence: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
    const notes = [
      { freq: 523.25, time: 0, duration: 0.8 },
      { freq: 659.25, time: 0.1, duration: 0.9 },
      { freq: 783.99, time: 0.22, duration: 1.2 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, t + time);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + time);

      gain.gain.setValueAtTime(0, t + time);
      gain.gain.linearRampToValueAtTime(0.22, t + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.chimesGain!);

      osc.start(t + time);
      osc.stop(t + time + duration + 0.05);
    });
  }

  public playBreakStart() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.chimesGain) return;

    const t = ctx.currentTime;
    // Calming, mellow descending sequence: A5 (880Hz) -> E5 (659Hz) -> C#5 (554.37Hz)
    const notes = [
      { freq: 880.00, time: 0, duration: 0.9 },
      { freq: 659.25, time: 0.14, duration: 1.1 },
      { freq: 554.37, time: 0.3, duration: 1.5 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t + time);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + time);

      gain.gain.setValueAtTime(0, t + time);
      gain.gain.linearRampToValueAtTime(0.18, t + time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.chimesGain!);

      osc.start(t + time);
      osc.stop(t + time + duration + 0.05);
    });
  }

  public playSessionComplete() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.chimesGain) return;

    const t = ctx.currentTime;
    // Harmonic accomplishment chord: C5 -> E5 -> G5 -> C6 with warm resonance
    const notes = [
      { freq: 523.25, time: 0, duration: 1.2, gain: 0.22 },
      { freq: 659.25, time: 0.12, duration: 1.4, gain: 0.2 },
      { freq: 783.99, time: 0.24, duration: 1.6, gain: 0.2 },
      { freq: 1046.50, time: 0.36, duration: 2.0, gain: 0.25 },
    ];

    notes.forEach(({ freq, time, duration, gain: peakGain }) => {
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4000, t + time);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + time);

      // Subtle second harmonic for rich acoustic bell timbre
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2, t + time);

      noteGain.gain.setValueAtTime(0, t + time);
      noteGain.gain.linearRampToValueAtTime(peakGain, t + time + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, t + time + duration);

      osc.connect(filter);
      overtone.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.chimesGain!);

      osc.start(t + time);
      overtone.start(t + time);
      osc.stop(t + time + duration + 0.05);
      overtone.stop(t + time + duration + 0.05);
    });
  }

  public playButtonTick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.chimesGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.chimesGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  // --------------------------------------------------------------------------
  // Ambient Sound Synthesis
  // --------------------------------------------------------------------------

  public startAmbient(type: AmbientSoundType) {
    if (type === 'none') {
      this.stopAmbient();
      return;
    }

    if (this.currentAmbientType === type && this.ambientNodes) {
      return; // Already playing
    }

    this.stopAmbient();
    this.currentAmbientType = type;

    const ctx = this.getContext();
    if (!ctx || !this.ambientGain) return;

    try {
      switch (type) {
        case 'brown_noise':
          this.ambientNodes = this.createBrownNoise(ctx);
          break;
        case 'pink_noise':
          this.ambientNodes = this.createPinkNoise(ctx);
          break;
        case 'white_noise':
          this.ambientNodes = this.createWhiteNoise(ctx);
          break;
        case 'rain':
          this.ambientNodes = this.createRainSound(ctx);
          break;
        case 'cafe':
          this.ambientNodes = this.createCafeSound(ctx);
          break;
        case 'binaural_alpha':
          this.ambientNodes = this.createBinauralAlpha(ctx);
          break;
        case 'forest_stream':
          this.ambientNodes = this.createForestStream(ctx);
          break;
      }
    } catch (err) {
      console.warn('Error starting ambient sound:', err);
    }
  }

  public stopAmbient() {
    this.currentAmbientType = 'none';
    if (!this.ambientNodes) return;

    if (this.ambientNodes.stopFn) {
      try {
        this.ambientNodes.stopFn();
      } catch (e) {}
    }

    if (this.ambientNodes.intervalIds) {
      this.ambientNodes.intervalIds.forEach(id => clearInterval(id));
    }

    if (this.ambientNodes.sources) {
      this.ambientNodes.sources.forEach(node => {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          node.disconnect();
        } catch (e) {}
      });
    }

    this.ambientNodes = null;
  }

  public getCurrentAmbientType(): AmbientSoundType {
    return this.currentAmbientType;
  }

  // Helper to create procedural audio buffer
  private createNoiseBuffer(ctx: AudioContext, seconds = 5): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // 1. Brown Noise Generator (Deep concentration rumble)
  private createBrownNoise(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5; // Gain compensation
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain!);

    source.start();
    return { sources: [source, filter, gain] };
  }

  // 2. Pink Noise Generator (1/f spectral masking)
  private createPinkNoise(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain!);

    source.start();
    return { sources: [source, filter, gain] };
  }

  // 3. White Noise Generator (Crisp masking)
  private createWhiteNoise(ctx: AudioContext) {
    const buffer = this.createNoiseBuffer(ctx, 4);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.Q.setValueAtTime(0.8, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain!);

    source.start();
    return { sources: [source, filter, gain] };
  }

  // 4. Gentle Rain Generator (Modulated resonant pink noise + micro droplet pings)
  private createRainSound(ctx: AudioContext) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 5);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    // Resonant lowpass for steady rain bed
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(750, ctx.currentTime);
    rainFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    // Subtle LFO modulation to simulate wind/gust variances in rainfall
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(150, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(rainFilter.frequency);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.65, ctx.currentTime);

    source.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.ambientGain!);

    source.start();
    lfo.start();

    // Random droplet pings
    const intervalId = window.setInterval(() => {
      if (!this.ambientNodes || this.currentAmbientType !== 'rain') return;
      if (Math.random() < 0.35) {
        try {
          const t = ctx.currentTime;
          const dropOsc = ctx.createOscillator();
          const dropGain = ctx.createGain();
          const dropFreq = 1200 + Math.random() * 800;
          dropOsc.type = 'sine';
          dropOsc.frequency.setValueAtTime(dropFreq, t);
          dropGain.gain.setValueAtTime(0.015, t);
          dropGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
          dropOsc.connect(dropGain);
          dropGain.connect(this.ambientGain!);
          dropOsc.start(t);
          dropOsc.stop(t + 0.045);
        } catch (e) {}
      }
    }, 180);

    return {
      sources: [source, rainFilter, rainGain, lfo, lfoGain],
      intervalIds: [intervalId],
    };
  }

  // 5. Cozy Cafe Ambiance (Warm resonant murmurs and soft acoustic warmth)
  private createCafeSound(ctx: AudioContext) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 6);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(450, ctx.currentTime);
    filter1.Q.setValueAtTime(2.0, ctx.currentTime);

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(800, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55, ctx.currentTime);

    // Warm undertone generator
    const warmTone = ctx.createOscillator();
    warmTone.type = 'sine';
    warmTone.frequency.setValueAtTime(110, ctx.currentTime);
    const warmGain = ctx.createGain();
    warmGain.gain.setValueAtTime(0.04, ctx.currentTime);
    warmTone.connect(warmGain);
    warmGain.connect(this.ambientGain!);

    source.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(this.ambientGain!);

    source.start();
    warmTone.start();

    return { sources: [source, filter1, filter2, gain, warmTone, warmGain] };
  }

  // 6. Binaural Alpha Beats (10Hz difference for deep flow state)
  private createBinauralAlpha(ctx: AudioContext) {
    const carrierFreq = 216; // Harmonic base
    const beatFreq = 10; // 10Hz Alpha flow state

    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(carrierFreq - beatFreq / 2, ctx.currentTime);

    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(carrierFreq + beatFreq / 2, ctx.currentTime);

    // Channel merger for binaural stereo field
    const merger = ctx.createChannelMerger(2);
    const gainLeft = ctx.createGain();
    const gainRight = ctx.createGain();

    gainLeft.gain.setValueAtTime(0.18, ctx.currentTime);
    gainRight.gain.setValueAtTime(0.18, ctx.currentTime);

    oscLeft.connect(gainLeft);
    gainLeft.connect(merger, 0, 0); // Left ear

    oscRight.connect(gainRight);
    gainRight.connect(merger, 0, 1); // Right ear

    merger.connect(this.ambientGain!);

    oscLeft.start();
    oscRight.start();

    return { sources: [oscLeft, oscRight, gainLeft, gainRight, merger] };
  }

  // 7. Forest Stream / Nature (Flowing water with harmonic wind rustle)
  private createForestStream(ctx: AudioContext) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 6);
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const streamFilter = ctx.createBiquadFilter();
    streamFilter.type = 'bandpass';
    streamFilter.frequency.setValueAtTime(600, ctx.currentTime);
    streamFilter.Q.setValueAtTime(1.2, ctx.currentTime);

    // Stream ripple LFO
    const rippleLfo = ctx.createOscillator();
    rippleLfo.frequency.setValueAtTime(0.4, ctx.currentTime);
    const rippleGain = ctx.createGain();
    rippleGain.gain.setValueAtTime(180, ctx.currentTime);
    rippleLfo.connect(rippleGain);
    rippleGain.connect(streamFilter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);

    source.connect(streamFilter);
    streamFilter.connect(gain);
    gain.connect(this.ambientGain!);

    source.start();
    rippleLfo.start();

    return { sources: [source, streamFilter, rippleLfo, rippleGain, gain] };
  }
}

export const soundEngine = new SoundEngine();
