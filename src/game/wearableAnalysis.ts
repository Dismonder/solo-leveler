import type { HealthConnectSummary } from "../services/healthConnectService";
import type { XiaomiBandSnapshot } from "../services/xiaomiBandService";
import type { WearableSample } from "../types";
import { getLocalDateKey } from "./playerMath";

const MAX_WEARABLE_SAMPLES = 1200;

export type WearableDailyAnalysis = {
  dateKey: string;
  sampleCount: number;
  directBleCount: number;
  healthConnectCount: number;
  avgHeartRate: number | null;
  minHeartRate: number | null;
  maxHeartRate: number | null;
  latestBattery: number | null;
  latestDeviceName: string | null;
  latestRssi: number | null;
  steps: number;
  distanceKm: number;
  activeCaloriesKcal: number;
  exerciseMinutes: number;
  dataOrigins: string[];
  coverageLabel: string;
  limitations: string[];
};

export function normalizeWearableSamples(samples: unknown): WearableSample[] {
  if (!Array.isArray(samples)) return [];

  return samples
    .map((sample) => sanitizeWearableSample(sample))
    .filter((sample): sample is WearableSample => Boolean(sample))
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    .slice(-MAX_WEARABLE_SAMPLES);
}

export function appendWearableSample(existing: WearableSample[], sample: WearableSample) {
  const normalizedExisting = normalizeWearableSamples(existing);
  const normalizedSample = sanitizeWearableSample(sample);
  if (!normalizedSample || !hasMeaningfulWearableData(normalizedSample)) return normalizedExisting;

  const withoutDuplicate = normalizedExisting.filter((item) => item.id !== normalizedSample.id);
  return [...withoutDuplicate, normalizedSample]
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    .slice(-MAX_WEARABLE_SAMPLES);
}

export function createWearableSampleFromXiaomiSnapshot(snapshot: XiaomiBandSnapshot): WearableSample | null {
  const now = new Date();
  const timestamp = now.toISOString();
  const services = snapshot.capabilities?.services || [];

  const sample: WearableSample = {
    id: `ble_${snapshot.id || snapshot.name}_${Math.floor(now.getTime() / 15000)}`,
    source: "directBle",
    timestamp,
    dateKey: getLocalDateKey(now),
    deviceId: snapshot.id,
    deviceName: snapshot.name,
    provider: snapshot.manufacturer || "Xiaomi / Mi Band",
    connectionMode: snapshot.connectionMode,
    batteryLevel: clampNumber(snapshot.batteryLevel, 0, 100),
    heartRate: clampNumber(snapshot.heartRate, 25, 240),
    rssi: clampNumber(snapshot.rssi, -130, 20),
    services,
    characteristicsCount: snapshot.capabilities?.characteristicsCount,
    diagnostics: snapshot.diagnostics,
  };

  return hasMeaningfulWearableData(sample) ? sample : null;
}

export function createWearableSampleFromHealthSummary(summary: HealthConnectSummary): WearableSample | null {
  if (!summary.permissionsGranted) return null;

  const timestamp = summary.endTime || new Date().toISOString();
  const dateKey = getLocalDateKey(new Date(timestamp));
  const sample: WearableSample = {
    id: `hc_${dateKey}_${Math.floor(Date.parse(timestamp) / 300000)}`,
    source: "healthConnect",
    timestamp,
    dateKey,
    provider: "Health Connect",
    steps: clampNumber(summary.steps, 0, 200000),
    distanceKm: clampNumber(summary.distanceKm, 0, 500),
    activeCaloriesKcal: clampNumber(summary.activeCaloriesKcal, 0, 20000),
    exerciseMinutes: clampNumber(summary.exerciseMinutes, 0, 1440),
    heartRateAvg: clampNumber(summary.heartRateAvg, 25, 240),
    heartRateMin: clampNumber(summary.heartRateMin, 25, 240),
    heartRateMax: clampNumber(summary.heartRateMax, 25, 240),
    heartRateSamples: clampNumber(summary.heartRateSamples, 0, 100000),
    dataOrigins: summary.dataOrigins,
    diagnostics: summary.message ? [summary.message] : [],
  };

  return hasMeaningfulWearableData(sample) ? sample : null;
}

export function getWearableDailyAnalysis(samples: WearableSample[], dateKey = getLocalDateKey()): WearableDailyAnalysis {
  const todaySamples = normalizeWearableSamples(samples).filter((sample) => sample.dateKey === dateKey);
  const directBleSamples = todaySamples.filter((sample) => sample.source === "directBle");
  const healthSamples = todaySamples.filter((sample) => sample.source === "healthConnect");
  const heartRates = collectHeartRates(todaySamples);
  const latestDirect = [...directBleSamples].reverse().find((sample) => sample.batteryLevel !== undefined || sample.deviceName);
  const latestRssi = [...directBleSamples].reverse().find((sample) => sample.rssi !== undefined)?.rssi ?? null;

  const steps = maxMetric(healthSamples, "steps");
  const distanceKm = maxMetric(healthSamples, "distanceKm");
  const activeCaloriesKcal = maxMetric(healthSamples, "activeCaloriesKcal");
  const exerciseMinutes = maxMetric(healthSamples, "exerciseMinutes");
  const dataOrigins = unique(healthSamples.flatMap((sample) => sample.dataOrigins || []));

  const limitations = [
    "Direct BLE zapisuje stabilne dane standardowe: bateria, tętno, RSSI, urządzenie i diagnostyka GATT.",
    "Historia snu, stresu, treningów i kroków z Mi Band zwykle wymaga Health Connect/Mi Fitness albo prywatnej autoryzacji Xiaomi.",
  ];

  return {
    dateKey,
    sampleCount: todaySamples.length,
    directBleCount: directBleSamples.length,
    healthConnectCount: healthSamples.length,
    avgHeartRate: heartRates.length ? Math.round(heartRates.reduce((sum, value) => sum + value, 0) / heartRates.length) : null,
    minHeartRate: heartRates.length ? Math.min(...heartRates) : null,
    maxHeartRate: heartRates.length ? Math.max(...heartRates) : null,
    latestBattery: latestDirect?.batteryLevel ?? null,
    latestDeviceName: latestDirect?.deviceName || null,
    latestRssi,
    steps,
    distanceKm,
    activeCaloriesKcal,
    exerciseMinutes,
    dataOrigins,
    coverageLabel: buildCoverageLabel(directBleSamples.length, healthSamples.length),
    limitations,
  };
}

function sanitizeWearableSample(sample: unknown): WearableSample | null {
  if (!sample || typeof sample !== "object") return null;
  const candidate = sample as Partial<WearableSample>;
  if (candidate.source !== "directBle" && candidate.source !== "healthConnect") return null;

  const timestamp = validTimestamp(candidate.timestamp) ? candidate.timestamp! : new Date().toISOString();
  const dateKey = typeof candidate.dateKey === "string" && candidate.dateKey.length >= 8
    ? candidate.dateKey
    : getLocalDateKey(new Date(timestamp));

  return {
    id: typeof candidate.id === "string" && candidate.id ? candidate.id : `${candidate.source}_${Date.parse(timestamp)}`,
    source: candidate.source,
    timestamp,
    dateKey,
    deviceId: stringOrUndefined(candidate.deviceId),
    deviceName: stringOrUndefined(candidate.deviceName),
    provider: stringOrUndefined(candidate.provider),
    connectionMode: stringOrUndefined(candidate.connectionMode),
    batteryLevel: clampNumber(candidate.batteryLevel, 0, 100),
    heartRate: clampNumber(candidate.heartRate, 25, 240),
    heartRateMin: clampNumber(candidate.heartRateMin, 25, 240),
    heartRateMax: clampNumber(candidate.heartRateMax, 25, 240),
    heartRateAvg: clampNumber(candidate.heartRateAvg, 25, 240),
    heartRateSamples: clampNumber(candidate.heartRateSamples, 0, 100000),
    rssi: clampNumber(candidate.rssi, -130, 20),
    steps: clampNumber(candidate.steps, 0, 200000),
    distanceKm: clampNumber(candidate.distanceKm, 0, 500),
    activeCaloriesKcal: clampNumber(candidate.activeCaloriesKcal, 0, 20000),
    exerciseMinutes: clampNumber(candidate.exerciseMinutes, 0, 1440),
    dataOrigins: unique((candidate.dataOrigins || []).filter((value): value is string => typeof value === "string")),
    services: unique((candidate.services || []).filter((value): value is string => typeof value === "string")),
    characteristicsCount: clampNumber(candidate.characteristicsCount, 0, 5000),
    diagnostics: unique((candidate.diagnostics || []).filter((value): value is string => typeof value === "string")),
  };
}

function hasMeaningfulWearableData(sample: WearableSample) {
  return [
    sample.batteryLevel,
    sample.heartRate,
    sample.heartRateAvg,
    sample.steps,
    sample.distanceKm,
    sample.activeCaloriesKcal,
    sample.exerciseMinutes,
    sample.rssi,
    sample.characteristicsCount,
  ].some((value) => typeof value === "number" && Number.isFinite(value) && value > 0)
    || Boolean(sample.services?.length)
    || Boolean(sample.dataOrigins?.length);
}

function collectHeartRates(samples: WearableSample[]) {
  const values: number[] = [];
  for (const sample of samples) {
    if (sample.heartRate) values.push(sample.heartRate);
    if (sample.heartRateAvg) values.push(sample.heartRateAvg);
  }
  return values;
}

function maxMetric(samples: WearableSample[], key: keyof Pick<WearableSample, "steps" | "distanceKm" | "activeCaloriesKcal" | "exerciseMinutes">) {
  return samples.reduce((max, sample) => Math.max(max, Number(sample[key] || 0)), 0);
}

function buildCoverageLabel(directBleCount: number, healthConnectCount: number) {
  if (directBleCount > 0 && healthConnectCount > 0) return "BLE + Health Connect";
  if (directBleCount > 0) return "Direct BLE";
  if (healthConnectCount > 0) return "Health Connect";
  return "Brak próbek";
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function clampNumber(value: unknown, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return Math.max(min, Math.min(max, numeric));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
