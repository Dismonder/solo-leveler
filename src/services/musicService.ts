import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { getThemeMusicUrlWithSelection, type ThemeMusicContext } from "./systemThemeAssets";
import {
  LOCAL_MUSIC_TRACKS,
  getLocalMusicTrack,
  type LocalMusicTrack,
  type LocalMusicTrackId,
} from "../assets/music/solo-leveling-local/manifest";
import type { MiniGameId } from "../game/miniGameProgress";
import type { MusicTrackSettings } from "../types";
import {
  addMediaActionListener,
  clearNativeMediaNotification,
  showNativeMediaNotification,
} from "./notificationService";

const MUSIC_ENABLED_KEY = "solo-leveler:background-music-enabled";
const MUSIC_VOLUME_KEY = "solo-leveler:background-music-volume";
const DEFAULT_MUSIC_VOLUME = 0.2;
const FADE_MS = 1_000;

let enabled = readBoolean(MUSIC_ENABLED_KEY, true);
let volume = readNumber(MUSIC_VOLUME_KEY, DEFAULT_MUSIC_VOLUME);
let currentAudio: HTMLAudioElement | null = null;
let nextAudio: HTMLAudioElement | null = null;
let currentTrackId: string | null = null;
let currentContext: ThemeMusicContext | null = "status";
let lastRequestedContext: ThemeMusicContext = "status";
let pendingContext: ThemeMusicContext | null = null;
let unlocked = false;
let unlockListenersInstalled = false;
let unlockHandler: (() => void) | null = null;
let lifecycleListenersInstalled = false;
let mediaSessionHandlersInstalled = false;
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
  installMediaSessionHandlers();
  if (!enabled || volume <= 0 || !isBrowserAudioAvailable()) return false;

  const url = resolveGlobalMusicUrl();
  if (!url) {
    pendingContext = null;
    if (currentAudio) stopBackgroundMusic(450);
    return false;
  }

  const track = findTrackByUrl(url) || null;

  // Immediately display native notification on Android so user sees it right away
  syncNativeNotification(track, true);

  if (!unlocked) {
    pendingContext = "status";
    installUnlockListeners();
    return false;
  }

  if (currentAudio?.dataset.url === url && !currentAudio.paused) return true;
  return crossfadeTo(url, track);
}

export function stopBackgroundMusic(fadeMs = FADE_MS) {
  const audio = currentAudio;
  currentAudio = null;
  currentTrackId = null;
  currentContext = null;
  pendingContext = null;
  if (nextAudio) {
    nextAudio.pause();
    nextAudio = null;
  }
  if (audio) fadeOutAndStop(audio, fadeMs);
  updateMediaSessionPlaybackState("none");
  void clearNativeMediaNotification();
}

export function getCurrentMusicTrack(): LocalMusicTrack | null {
  if (currentTrackId) {
    const matched = LOCAL_MUSIC_TRACKS.find((t) => t.id === currentTrackId);
    if (matched) return matched;
  }
  if (!currentAudio?.dataset.url) return null;
  return findTrackByUrl(currentAudio.dataset.url) || null;
}

export async function playTrackById(trackId: LocalMusicTrackId | string) {
  const track = LOCAL_MUSIC_TRACKS.find((t) => t.id === trackId);
  if (!track || !track.url) return null;

  if (!enabled) setBackgroundMusicEnabled(true);
  currentContext = "status";
  lastRequestedContext = "status";

  syncNativeNotification(track, true);

  if (!unlocked) {
    pendingContext = "status";
    installUnlockListeners();
    return track.id;
  }

  await crossfadeTo(track.url, track);
  return track.id;
}

export async function playNextTrack(): Promise<string | null> {
  if (LOCAL_MUSIC_TRACKS.length === 0) return null;
  const current = getCurrentMusicTrack();
  const currentIndex = current ? LOCAL_MUSIC_TRACKS.findIndex((t) => t.id === current.id) : -1;
  const nextIndex = (currentIndex + 1) % LOCAL_MUSIC_TRACKS.length;
  const nextTrack = LOCAL_MUSIC_TRACKS[nextIndex];
  if (!nextTrack) return null;

  if (!enabled) setBackgroundMusicEnabled(true);
  currentContext = "status";
  lastRequestedContext = "status";

  syncNativeNotification(nextTrack, true);

  if (!unlocked) {
    pendingContext = "status";
    installUnlockListeners();
    return nextTrack.id;
  }

  await crossfadeTo(nextTrack.url, nextTrack);
  return nextTrack.id;
}

export async function playPreviousTrack(): Promise<string | null> {
  if (LOCAL_MUSIC_TRACKS.length === 0) return null;
  if (currentAudio && currentAudio.currentTime > 3) {
    currentAudio.currentTime = 0;
    updateMediaSessionPosition(currentAudio);
    return getCurrentMusicTrack()?.id || null;
  }

  const current = getCurrentMusicTrack();
  const currentIndex = current ? LOCAL_MUSIC_TRACKS.findIndex((t) => t.id === current.id) : 0;
  const prevIndex = (currentIndex - 1 + LOCAL_MUSIC_TRACKS.length) % LOCAL_MUSIC_TRACKS.length;
  const prevTrack = LOCAL_MUSIC_TRACKS[prevIndex];
  if (!prevTrack) return null;

  if (!enabled) setBackgroundMusicEnabled(true);
  currentContext = "status";
  lastRequestedContext = "status";

  syncNativeNotification(prevTrack, true);

  if (!unlocked) {
    pendingContext = "status";
    installUnlockListeners();
    return prevTrack.id;
  }

  await crossfadeTo(prevTrack.url, prevTrack);
  return prevTrack.id;
}

export function seekTrackTo(seconds: number) {
  if (!currentAudio || !Number.isFinite(seconds)) return;
  const duration = Number.isFinite(currentAudio.duration) && currentAudio.duration > 0 ? currentAudio.duration : 9999;
  currentAudio.currentTime = Math.max(0, Math.min(duration, seconds));
  updateMediaSessionPosition(currentAudio);
}

export function seekTrackBy(deltaSeconds: number) {
  if (!currentAudio || !Number.isFinite(deltaSeconds)) return;
  seekTrackTo(currentAudio.currentTime + deltaSeconds);
}

export function togglePlayPause() {
  if (!currentAudio) {
    void playMusicContext("status");
    return;
  }
  if (currentAudio.paused) {
    void currentAudio.play().then(() => {
      updateMediaSessionPlaybackState("playing");
      syncNativeNotification(getCurrentMusicTrack(), true);
    }).catch(() => {});
  } else {
    currentAudio.pause();
    updateMediaSessionPlaybackState("paused");
    syncNativeNotification(getCurrentMusicTrack(), false);
  }
}

export async function playRandomBackgroundTrack() {
  if (LOCAL_MUSIC_TRACKS.length === 0) return null;
  const currentUrl = currentAudio?.dataset.url ?? null;
  const options = LOCAL_MUSIC_TRACKS.filter((track) => track.url && track.url !== currentUrl);
  const pool = options.length ? options : LOCAL_MUSIC_TRACKS;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  if (!picked) return null;

  currentContext = "status";
  lastRequestedContext = "status";
  if (!enabled) setBackgroundMusicEnabled(true);

  syncNativeNotification(picked, true);

  if (!unlocked) {
    pendingContext = "status";
    installUnlockListeners();
    return picked.id;
  }

  await crossfadeTo(picked.url, picked);
  return picked.id;
}

export async function testBackgroundMusic() {
  return playMusicContext("status");
}

export function initBackgroundMediaNotification() {
  installMediaSessionHandlers();
  const track = getCurrentMusicTrack() || LOCAL_MUSIC_TRACKS[0];
  if (track && enabled) {
    syncNativeNotification(track, true);
  }
}

function syncNativeNotification(track: LocalMusicTrack | null | undefined, isPlaying: boolean) {
  const current = track || LOCAL_MUSIC_TRACKS[0];
  if (current) {
    void showNativeMediaNotification({
      title: current.title,
      artist: current.artist || "Solo Leveler OST",
      backgroundName: current.backgroundName || "01-shadow-citadel-purple.jpg",
      isPlaying,
      position: currentAudio ? currentAudio.currentTime : 0,
      duration: currentAudio && Number.isFinite(currentAudio.duration) ? currentAudio.duration : 0,
    });
  }
}

function findTrackByUrl(url: string): LocalMusicTrack | undefined {
  return LOCAL_MUSIC_TRACKS.find((track) => track.url === url || url.includes(track.fileName));
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
    if (!document.hidden && currentAudio && !currentAudio.paused) {
      if (currentAudio.volume < volume) {
        currentAudio.volume = volume;
      }
      updateMediaSessionPosition(currentAudio);
      syncNativeNotification(getCurrentMusicTrack(), true);
    }
  });
}


function installMediaSessionHandlers() {
  if (mediaSessionHandlersInstalled) return;
  mediaSessionHandlersInstalled = true;

  // Native Android Media Action bridge
  addMediaActionListener((action) => {
    switch (action) {
      case "media_prev":
        void playPreviousTrack();
        break;
      case "media_toggle":
        togglePlayPause();
        break;
      case "media_next":
        void playNextTrack();
        break;
      case "media_shuffle":
        void playRandomBackgroundTrack();
        break;
      case "media_stop":
        stopBackgroundMusic();
        break;
    }
  });

  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

  const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      // Some browsers or older engines do not support all media actions.
    }
  };


  setHandler("play", () => {
    if (currentAudio && currentAudio.paused) {
      void currentAudio.play().then(() => {
        updateMediaSessionPlaybackState("playing");
        syncNativeNotification(getCurrentMusicTrack(), true);
      }).catch(() => {});
    } else if (!currentAudio) {
      void playMusicContext("status");
    }
  });

  setHandler("pause", () => {
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      updateMediaSessionPlaybackState("paused");
      syncNativeNotification(getCurrentMusicTrack(), false);
    }
  });

  setHandler("previoustrack", () => {
    void playPreviousTrack();
  });

  setHandler("nexttrack", () => {
    void playNextTrack();
  });

  setHandler("seekto", (details) => {
    if (typeof details.seekTime === "number") {
      seekTrackTo(details.seekTime);
    }
  });

  setHandler("seekforward", (details) => {
    seekTrackBy(details.seekOffset || 10);
  });

  setHandler("seekbackward", (details) => {
    seekTrackBy(-(details.seekOffset || 10));
  });

  setHandler("stop", () => {
    stopBackgroundMusic();
  });
}

function updateMediaSessionMetadata(track: LocalMusicTrack | null) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator) || typeof window === "undefined" || !window.MediaMetadata) {
    return;
  }

  if (track) {
    const bgUrl = `/backgrounds/${track.backgroundName || "01-shadow-citadel-purple.jpg"}`;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || "Solo Leveler OST",
      album: "Solo Leveler - Status Łowcy",
      artwork: [
        { src: bgUrl, sizes: "512x512", type: "image/jpeg" },
        { src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
      ],
    });
  } else {
    navigator.mediaSession.metadata = null;
  }

}

function updateMediaSessionPlaybackState(state: "playing" | "paused" | "none") {
  if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
    navigator.mediaSession.playbackState = state;
  }
}

function updateMediaSessionPosition(audio: HTMLAudioElement | null) {
  if (
    !audio ||
    typeof navigator === "undefined" ||
    !("mediaSession" in navigator) ||
    typeof navigator.mediaSession.setPositionState !== "function"
  ) {
    return;
  }

  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate || 1,
        position: Math.min(Math.max(0, audio.currentTime), audio.duration),
      });
    } catch {
      // Ignore transient position state calculation errors during audio loading.
    }
  }
}

async function crossfadeTo(url: string, explicitTrack?: LocalMusicTrack | null) {
  if (nextAudio?.dataset.url === url) return false;
  if (nextAudio) {
    nextAudio.pause();
    nextAudio.removeAttribute("src");
    nextAudio.load();
    nextAudio = null;
  }

  const track = explicitTrack ?? findTrackByUrl(url) ?? null;
  const incoming = new Audio(url);
  incoming.dataset.url = url;
  incoming.loop = false;
  incoming.preload = "metadata";
  const isBackground = typeof document !== "undefined" && document.hidden;
  if (isBackground) {
    incoming.volume = volume;
  } else {
    incoming.volume = 0;
  }
  nextAudio = incoming;

  incoming.addEventListener("play", () => {
    if (currentAudio === incoming) {
      updateMediaSessionPlaybackState("playing");
      syncNativeNotification(track, true);
    }
  });

  incoming.addEventListener("pause", () => {
    if (currentAudio === incoming && !incoming.ended) {
      updateMediaSessionPlaybackState("paused");
      syncNativeNotification(track, false);
    }
  });

  incoming.addEventListener("timeupdate", () => {
    if (currentAudio === incoming) {
      updateMediaSessionPosition(incoming);
    }
  });

  incoming.addEventListener("loadedmetadata", () => {
    if (currentAudio === incoming) {
      updateMediaSessionPosition(incoming);
    }
  });

  incoming.addEventListener("seeked", () => {
    if (currentAudio === incoming) {
      updateMediaSessionPosition(incoming);
    }
  });

  incoming.addEventListener("ended", () => {
    if (currentAudio === incoming) {
      void playNextTrack();
    }
  });

  try {
    await incoming.play();
  } catch {
    pendingContext = currentContext;
    installUnlockListeners();
    syncNativeNotification(track, true);
    return false;
  }

  const outgoing = currentAudio;
  currentAudio = incoming;
  currentTrackId = track?.id || null;
  nextAudio = null;

  installMediaSessionHandlers();
  updateMediaSessionMetadata(track);
  updateMediaSessionPlaybackState("playing");
  updateMediaSessionPosition(incoming);
  syncNativeNotification(track, true);

  if (isBackground) {
    incoming.volume = volume;
    if (outgoing) {
      try {
        outgoing.pause();
        outgoing.removeAttribute("src");
        outgoing.load();
      } catch {
        // Ignore
      }
    }
  } else {
    animateFade(incoming, 0, volume, FADE_MS);
    if (outgoing) fadeOutAndStop(outgoing, FADE_MS);
  }
  return true;
}

function fadeOutAndStop(audio: HTMLAudioElement, fadeMs: number) {
  // Clear any dataset and event callbacks to prevent interference with current track
  audio.dataset.url = "";
  audio.onplay = null;
  audio.onpause = null;
  audio.onended = null;
  audio.ontimeupdate = null;
  const from = audio.volume;
  animateFade(audio, from, 0, fadeMs, () => {
    try {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    } catch {
      // Ignore
    }
  });
}

function animateFade(audio: HTMLAudioElement, from: number, to: number, durationMs: number, onDone?: () => void) {
  if (typeof document !== "undefined" && document.hidden) {
    audio.volume = Math.max(0, Math.min(1, to));
    onDone?.();
    return;
  }

  const start = performance.now();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const step = () => {
    const now = performance.now();
    const progress = Math.min(1, (now - start) / Math.max(1, durationMs));
    audio.volume = Math.max(0, Math.min(1, from + (to - from) * progress));

    if (progress >= 1 || (typeof document !== "undefined" && document.hidden)) {
      audio.volume = Math.max(0, Math.min(1, to));
      if (intervalId !== null) clearInterval(intervalId);
      onDone?.();
    }
  };

  intervalId = setInterval(step, 40);
  step();
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
void CapacitorApp;
void Capacitor;
void getLocalMusicTrack;
