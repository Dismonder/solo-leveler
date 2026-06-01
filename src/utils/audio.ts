import { getThemeAudioUrl, type ThemeSoundId } from "../services/systemThemeAssets";

let audioCtx: AudioContext | null = null;
let globalVolume = 1.0;
let systemAudioEnabled = readAudioEnabled();
const audioElementCache = new Map<ThemeSoundId, HTMLAudioElement>();
const lastSoundAt = new Map<string, number>();
const AUDIO_ENABLED_KEY = "solo-leveler:system-audio-enabled";
const SOUND_THROTTLE_MS: Partial<Record<ThemeSoundId, number>> = {
  "system-click": 45,
  "system-key": 35,
  "system-alert": 420,
  "reward-open": 700,
  "gate-open": 900,
  "training-start": 900,
  "game-fail": 650,
};

export const setGlobalVolume = (volume: number) => {
  globalVolume = volume;
};

export const getGlobalVolume = () => {
  return globalVolume;
};

export const setSystemAudioEnabled = (enabled: boolean) => {
  systemAudioEnabled = enabled;
  try {
    localStorage.setItem(AUDIO_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // Audio settings are optional; localStorage failures must not block the app.
  }
};

export const getSystemAudioEnabled = () => {
  return systemAudioEnabled;
};

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new window.AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playTone = (type: OscillatorType, from: number, to: number, duration: number, volume: number) => {
  if (globalVolume <= 0 || !systemAudioEnabled) return;
  try {
    const ctx = initAudio();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration);

    gainNode.gain.setValueAtTime(volume * globalVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Browsers may block audio until user activation; failed UI sounds are non-critical.
  }
};

const playThemeSound = (soundId: ThemeSoundId, fallback: () => void) => {
  if (globalVolume <= 0 || !systemAudioEnabled) return;
  if (isThrottled(soundId, SOUND_THROTTLE_MS[soundId] ?? 0)) return;

  const url = getThemeAudioUrl(soundId);
  if (!url) {
    fallback();
    return;
  }

  try {
    let audio = audioElementCache.get(soundId);
    if (!audio) {
      audio = new Audio(url);
      audio.preload = "metadata";
      audioElementCache.set(soundId, audio);
    }
    audio.pause();
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, globalVolume));
    void audio.play().catch(fallback);
  } catch {
    fallback();
  }
};

export const playClickSound = () => {
  playThemeSound("system-click", () => playTone("sine", 800, 300, 0.05, 0.1));
};

export const playKeyboardSound = () => {
  playThemeSound("system-key", () => playTone("triangle", 400, 200, 0.03, 0.05));
};

export const playRewardSound = () => {
  playThemeSound("reward-open", () => playTone("sawtooth", 320, 880, 0.14, 0.08));
};

export const playAlertSound = () => {
  playThemeSound("system-alert", () => playTone("square", 180, 90, 0.16, 0.08));
};

export const playGameFailSound = () => {
  playThemeSound("game-fail", () => playTone("square", 220, 80, 0.14, 0.08));
};

export const playGateSound = () => {
  playThemeSound("gate-open", () => playTone("triangle", 140, 520, 0.2, 0.07));
};

export const playTrainingStartSound = () => {
  playThemeSound("training-start", () => playTone("sine", 240, 640, 0.12, 0.07));
};

export const playMiniGameHitSound = () => {
  if (isThrottled("mini-hit", 80)) return;
  playTone("triangle", 520, 900, 0.045, 0.035);
};

export const playMiniGameComboSound = () => {
  if (isThrottled("mini-combo", 280)) return;
  playTone("sine", 640, 1180, 0.075, 0.045);
};

export const playMiniGamePenaltySound = () => {
  if (isThrottled("mini-penalty", 220)) return;
  playTone("square", 190, 84, 0.07, 0.04);
};

function isThrottled(key: string, minIntervalMs: number) {
  if (minIntervalMs <= 0) return false;
  const now = performance.now();
  const last = lastSoundAt.get(key) ?? 0;
  if (now - last < minIntervalMs) return true;
  lastSoundAt.set(key, now);
  return false;
}

function readAudioEnabled() {
  try {
    return localStorage.getItem(AUDIO_ENABLED_KEY) !== "0";
  } catch {
    return true;
  }
}
