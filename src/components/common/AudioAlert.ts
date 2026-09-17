// Web Audio API chime generator for distraction-free study timer completion
import { soundEngine } from '../../utils/soundEngine';

export function playCompletionChime() {
  soundEngine.playSessionComplete();
}

export function playSessionStartChime() {
  soundEngine.playSessionStart();
}

export function playBreakStartChime() {
  soundEngine.playBreakStart();
}

export function playTickSound() {
  soundEngine.playButtonTick();
}

