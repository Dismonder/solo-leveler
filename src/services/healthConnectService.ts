import { Capacitor, registerPlugin } from "@capacitor/core";

export type HealthConnectStatus = {
  available: boolean;
  installed?: boolean;
  needsUpdate?: boolean;
  permissionsGranted?: boolean;
  grantedCount?: number;
  permissionCount?: number;
  providerPackage?: string;
  message: string;
};

export type HealthConnectSummary = HealthConnectStatus & {
  startTime?: string;
  endTime?: string;
  steps?: number;
  distanceMeters?: number;
  distanceKm?: number;
  activeCaloriesKcal?: number;
  exerciseMinutes?: number;
  heartRateSamples?: number;
  heartRateAvg?: number;
  heartRateMin?: number;
  heartRateMax?: number;
  dataOrigins?: string[];
};

type HealthConnectPlugin = {
  getStatus(): Promise<HealthConnectStatus>;
  requestHealthPermissions(): Promise<HealthConnectStatus>;
  readTodaySummary(): Promise<HealthConnectSummary>;
  openSettings(): Promise<{ opened: boolean; message: string }>;
};

const HunterHealthConnect = registerPlugin<HealthConnectPlugin>("HunterHealthConnect");

const LAST_IMPORT_KEY = "solo-leveler:health-connect-import";
const STEP_TO_KM_ESTIMATE = 0.00075;

export function isNativeHealthConnectAvailable() {
  return Capacitor.getPlatform() === "android";
}

export async function getHealthConnectStatus(): Promise<HealthConnectStatus> {
  if (!isNativeHealthConnectAvailable()) {
    return {
      available: false,
      installed: false,
      permissionsGranted: false,
      message: "Health Connect: tylko Android.",
    };
  }

  return HunterHealthConnect.getStatus();
}

export async function requestHealthConnectPermissions() {
  if (!isNativeHealthConnectAvailable()) {
    return getHealthConnectStatus();
  }

  return HunterHealthConnect.requestHealthPermissions();
}

export async function readTodayHealthSummary() {
  if (!isNativeHealthConnectAvailable()) {
    return getHealthConnectStatus() as Promise<HealthConnectSummary>;
  }

  return HunterHealthConnect.readTodaySummary();
}

export async function openHealthConnectSettings() {
  if (!isNativeHealthConnectAvailable()) {
    return { opened: false, message: "Ustawienia Health Connect są dostępne tylko w aplikacji Android." };
  }

  return HunterHealthConnect.openSettings();
}

export function getHealthConnectQuestDistanceKm(summary: HealthConnectSummary) {
  const directDistance = Number(summary.distanceKm || 0);
  if (directDistance > 0) {
    return {
      km: Number(directDistance.toFixed(2)),
      estimated: false,
    };
  }

  const steps = Number(summary.steps || 0);
  return {
    km: Number((steps * STEP_TO_KM_ESTIMATE).toFixed(2)),
    estimated: true,
  };
}

export function getLastHealthConnectImport(dateKey: string) {
  if (typeof localStorage === "undefined") return 0;

  try {
    const raw = localStorage.getItem(LAST_IMPORT_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, number> : {};
    return Number(parsed[dateKey] || 0);
  } catch {
    return 0;
  }
}

export function saveLastHealthConnectImport(dateKey: string, distanceKm: number) {
  if (typeof localStorage === "undefined") return;

  try {
    const raw = localStorage.getItem(LAST_IMPORT_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, number> : {};
    parsed[dateKey] = Number(distanceKm.toFixed(2));
    localStorage.setItem(LAST_IMPORT_KEY, JSON.stringify(parsed));
  } catch {
    // Import zdrowia jest dodatkiem; brak localStorage nie może blokować treningu.
  }
}
