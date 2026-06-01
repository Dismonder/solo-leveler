import { Capacitor, registerPlugin } from "@capacitor/core";
import type { PerformanceMode } from "../types";

export type HunterPerformanceStatus = {
  applied: boolean;
  targetRefreshRate: number;
  refreshRate: number;
  displayModeId: number;
  supports120Hz: boolean;
  currentRefreshRate: number;
  gameMode?: string;
  gameModeCode?: number;
  thermalStatus?: string;
};

type HunterPerformancePlugin = {
  enableHighPerformanceMode: (options?: { mode?: PerformanceMode }) => Promise<HunterPerformanceStatus>;
  getStatus: () => Promise<HunterPerformanceStatus>;
  setGameState: (options: { state: "app" | "loading" | "miniGame" | "gameplay" | "paused" }) => Promise<{ applied: boolean; state: string }>;
};

const HunterPerformance = registerPlugin<HunterPerformancePlugin>("HunterPerformance");
const DEFAULT_REFRESH_RATE = 60;
const HIGH_REFRESH_RATE = 100;

let lastKnownRefreshRate = DEFAULT_REFRESH_RATE;

const WEB_STATUS: HunterPerformanceStatus = {
  applied: false,
  targetRefreshRate: 120,
  refreshRate: 0,
  displayModeId: 0,
  supports120Hz: false,
  currentRefreshRate: 0,
};

export function isNativePerformanceAvailable() {
  return Capacitor.getPlatform() === "android";
}

export async function enableHighPerformanceMode(mode: PerformanceMode = "always120"): Promise<HunterPerformanceStatus> {
  enableWebGpuHints();

  if (!isNativePerformanceAvailable()) {
    applyRefreshRateHint(DEFAULT_REFRESH_RATE);
    return WEB_STATUS;
  }

  try {
    const status = await HunterPerformance.enableHighPerformanceMode({ mode });
    applyRefreshRateHint(status.refreshRate);
    return status;
  } catch {
    return WEB_STATUS;
  }
}

export async function getPerformanceStatus(): Promise<HunterPerformanceStatus> {
  if (!isNativePerformanceAvailable()) {
    applyRefreshRateHint(DEFAULT_REFRESH_RATE);
    return WEB_STATUS;
  }

  try {
    const status = await HunterPerformance.getStatus();
    applyRefreshRateHint(status.refreshRate || status.currentRefreshRate);
    return status;
  } catch {
    return WEB_STATUS;
  }
}

export async function setNativeGameState(state: "app" | "loading" | "miniGame" | "gameplay" | "paused") {
  if (!isNativePerformanceAvailable()) return { applied: false, state };

  try {
    return await HunterPerformance.setGameState({ state });
  } catch {
    return { applied: false, state };
  }
}

function enableWebGpuHints() {
  document.documentElement.classList.add("sl-high-performance", "sl-motion-smooth");
  if (!document.documentElement.style.getPropertyValue("--sl-frame-ms")) {
    applyRefreshRateHint(DEFAULT_REFRESH_RATE);
  }
}

function applyRefreshRateHint(refreshRate: number) {
  if (!Number.isFinite(refreshRate) || refreshRate <= 0) return;

  const roundedRefreshRate = Math.round(refreshRate);
  const isHighRefresh = roundedRefreshRate >= HIGH_REFRESH_RATE;
  const frameMs = 1000 / refreshRate;
  const root = document.documentElement;

  lastKnownRefreshRate = roundedRefreshRate;
  root.classList.toggle("sl-refresh-120", isHighRefresh);
  root.style.setProperty("--sl-refresh-rate", String(roundedRefreshRate));
  root.style.setProperty("--sl-frame-ms", frameMs.toFixed(3));
  root.style.setProperty("--sl-motion-duration-fast", isHighRefresh ? "90ms" : "120ms");
  root.style.setProperty("--sl-motion-duration-normal", isHighRefresh ? "150ms" : "180ms");
  root.style.setProperty("--sl-motion-duration-slow", isHighRefresh ? "220ms" : "280ms");
}

export function getLastKnownRefreshRate() {
  return lastKnownRefreshRate;
}

export function getSmoothUiIntervalMs() {
  return lastKnownRefreshRate >= HIGH_REFRESH_RATE ? 50 : 66;
}
