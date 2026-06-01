import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { getThemeMusicUrlWithSelection, type ThemeMusicContext } from "./systemThemeAssets";
import { LOCAL_MUSIC_TRACKS } from "../assets/music/solo-leveling-local/manifest";
import type { MiniGameId } from "../game/miniGameProgress";
import type { MusicTrackSettings } from "../types";

const MUSIC_ENABLED_KEY = "solo-leveler:background-music-enabled";
const MUSIC_VOLUME_KEY = "solo-leveler:background-music-volume";
const DEFAULT_MUSIC_VOLUME = 0.2;
const FADE_MS = 1_000;

let enabled = readBoolean(MUSIC_ENABLED_KEY, true);
let volume = readNumber(MUSIC_VOLUME_KEY, DEFAULT_MUSIC_VOLUME);
let currentAudio: HTMLAudioElement | null = null;
let nextAudio: HTMLAudioElement | null = null;
let currentContext: ThemeMusicContext | null = "status";
let lastRequestedContext: ThemeMusicContext = "status";
let pendingContext: ThemeMusicContext | null = null;
let unlocked = false;
let pausedByVisibility = false;
let unlockListenersInstalled = false;
let unlockHandler: (() => void) | null = null;
let lifecycleListenersInstalled = false;
let appPauseListener: PluginListenerHandle | null = null;
let appResumeListener: PluginListenerHandle | null = null;
let trackPreferences: MusicTrackSettings = {
  appTrackId: "auto",
  workoutTrackId: "auto",
  miniGameTrackIds: {},
};

export function getBackgroundMusicEnabled() {
  return enabled;
}

export function setBackgroundMusicEnabled(value: boolean) {
  enabled = value;
  writeStorage(MUSIC_ENABLED_KEY, value ? "1" : "0");
  if (!enabled) {
    stopBackgroundMusic(450);
    return;
  }
  void playMusicContext("status");
}

export function getGlobalMusicVolume() {
  return volume;
}

export function setGlobalMusicVolume(value: number) {
  volume = Math.max(0, Math.min(1, value));
  writeStorage(MUSIC_VOLUME_KEY, String(volume));
  if (currentAudio) currentAudio.volume = volume;
  if (nextAudio) nextAudio.volume = 0;
}

export function setMusicTrackPreferences(settings?: Partial<MusicTrackSettings>) {
  trackPreferences = {
    appTrackId: normalizeTrackSelection(settings?.appTrackId),
    workoutTrackId: normalizeTrackSelection(settings?.workoutTrackId),
    miniGameTrackIds: Object.fromEntries(
      Object.entries(settings?.miniGameTrackIds || {}).map(([gameId, trackId]) => [
        gameId,
        normalizeTrackSelection(trackId),
      ])
    ) as Partial<Record<MiniGameId, "auto" | string>>,
  };
}

export function pushMusicContext(context: ThemeMusicContext) {
  lastRequestedContext = context;
  void playMusicContext("status");
  return () => {
    void playMusicContext("status");
  };
}

export async function playMusicContext(context: ThemeMusicContext) {
  lastRequestedContext = context;
  currentContext = "status";
  installLifecycleListeners();
  if (!enabled || volume <= 0 || !isBrowserAudioAvailable()) return false;

  const url = resolveGlobalMusicUrl();
  if (!url) {
    pendingContext = null;
    if (currentAudio) stopBackgroundMusic(450);
    return false;
  }

  if (!unlocked) {
    pendingContext = "status";
    installUnlockListeners();
    return false;
  }

  if (currentAudio?.dataset.url === url && !currentAudio.paused) return true;
  return crossfadeTo(url);
}

export function stopBackgroundMusic(fadeMs = FADE_MS) {
  const audio = currentAudio;
  currentAudio = null;
  currentContext = null;
  pendingContext = null;
  if (nextAudio) {
    nextAudio.pause();
    nextAudio = null;
  }
  if (audio) fadeOutAndStop(audio, fadeMs);
}

export async function playRandomBackgroundTrack() {
  if (!isBrowserAudioAvailable() || LOCAL_MUSIC_TRACKS.length === 0) return null;
  const currentUrl = currentAudio?.dataset.url ?? null;
  const options = LOCAL_MUSIC_TRACKS.filter((track) => track.url && track.url !== currentUrl);
  const pool = options.length ? options : LOCAL_MUSIC_TRACKS;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  if (!picked) return null;

  currentContext = "status";
  lastRequestedContext = "status";
  if (!enabled) setBackgroundMusicEnabled(true);

  if (!unlocked) {
    pendingContext = "status";
    installUnlockListeners();
    return picked.id;
  }

  await crossfadeTo(picked.url);
  return picked.id;
}

export async function testBackgroundMusic() {
  return playMusicContext("status");
}

function isBrowserAudioAvailable() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function installUnlockListeners() {
  if (unlockListenersInstalled || typeof window === "undefined") return;
  unlockListenersInstalled = true;
  unlockHandler = () => {
    unlocked = true;
    removeUnlockListeners();
    if (pendingContext) void playMusicContext(pendingContext);
  };
  window.addEventListener("pointerdown", unlockHandler, { once: true, passive: true });
  window.addEventListener("touchstart", unlockHandler, { once: true, passive: true });
  window.addEventListener("keydown", unlockHandler, { once: true });
}

function removeUnlockListeners() {
  if (unlockHandler && typeof window !== "undefined") {
    window.removeEventListener("pointerdown", unlockHandler);
    window.removeEventListener("touchstart", unlockHandler);
    window.removeEventListener("keydown", unlockHandler);
  }
  unlockHandler = null;
  unlockListenersInstalled = false;
}

function installLifecycleListeners() {
  if (lifecycleListenersInstalled || typeof document === "undefined") return;
  lifecycleListenersInstalled = true;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pausedByVisibility = Boolean(currentAudio && !currentAudio.paused);
      currentAudio?.pause();
      return;
    }
    if (pausedByVisibility && currentContext && enabled) {
      pausedByVisibility = false;
      void playMusicContext("status");
    }
  });

  if (Capacitor.getPlatform() === "android" && Capacitor.isPluginAvailable("App")) {
    void CapacitorApp.addListener("pause", () => {
      pausedByVisibility = Boolean(currentAudio && !currentAudio.paused);
      currentAudio?.pause();
    }).then((listener) => { appPauseListener = listener; });
    void CapacitorApp.addListener("resume", () => {
      if (pausedByVisibility && currentContext && enabled) {
        pausedByVisibility = false;
        void playMusicContext("status");
      }
    }).then((listener) => { appResumeListener = listener; });
  }
}

async function crossfadeTo(url: string) {
  if (nextAudio?.dataset.url === url) return false;
  if (nextAudio) {
    nextAudio.pause();
    nextAudio.removeAttribute("src");
    nextAudio.load();
    nextAudio = null;
  }

  const incoming = new Audio(url);
  incoming.dataset.url = url;
  incoming.loop = true;
  incoming.preload = "metadata";
  incoming.volume = 0;
  nextAudio = incoming;

  try {
    await incoming.play();
  } catch {
    pendingContext = currentContext;
    installUnlockListeners();
    return false;
  }

  const outgoing = currentAudio;
  currentAudio = incoming;
  nextAudio = null;
  animateFade(incoming, 0, volume, FADE_MS);
  if (outgoing) fadeOutAndStop(outgoing, FADE_MS);
  return true;
}

function fadeOutAndStop(audio: HTMLAudioElement, fadeMs: number) {
  const from = audio.volume;
  animateFade(audio, from, 0, fadeMs, () => {
    audio.pause();
    audio.currentTime = 0;
  });
}

function animateFade(audio: HTMLAudioElement, from: number, to: number, durationMs: number, onDone?: () => void) {
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / Math.max(1, durationMs));
    audio.volume = from + (to - from) * progress;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      audio.volume = to;
      onDone?.();
    }
  };
  window.requestAnimationFrame(step);
}

function readBoolean(key: string, fallback: boolean) {
  try {
    const value = localStorage.getItem(key);
    if (value === "0") return false;
    if (value === "1") return true;
  } catch {
    // Local storage may be unavailable in restricted WebViews.
  }
  return fallback;
}

function readNumber(key: string, fallback: number) {
  try {
    const value = Number(localStorage.getItem(key));
    if (Number.isFinite(value)) return Math.max(0, Math.min(1, value));
  } catch {
    // Local storage may be unavailable in restricted WebViews.
  }
  return fallback;
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Music preferences are optional; failures must not block gameplay.
  }
}

function resolveGlobalMusicUrl() {
  return getThemeMusicUrlWithSelection("status", false, trackPreferences.appTrackId);
}

function normalizeTrackSelection(value: unknown): "auto" | string {
  return typeof value === "string" && value.length > 0 ? value : "auto";
}

void appPauseListener;
void appResumeListener;
