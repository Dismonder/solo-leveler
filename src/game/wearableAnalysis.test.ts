import test from "node:test";
import assert from "node:assert/strict";
import {
  appendWearableSample,
  createWearableSampleFromHealthSummary,
  createWearableSampleFromXiaomiSnapshot,
  getWearableDailyAnalysis,
} from "./wearableAnalysis";
import type { HealthConnectSummary } from "../services/healthConnectService";
import type { XiaomiBandSnapshot } from "../services/xiaomiBandService";

test("zapisuje i analizuje próbkę bezpośredniego BLE z Mi Band", () => {
  const snapshot: XiaomiBandSnapshot = {
    id: "band-8",
    name: "Xiaomi Smart Band 8",
    connected: true,
    message: "Połączono.",
    manufacturer: "Xiaomi",
    batteryLevel: 77,
    heartRate: 91,
    rssi: -55,
    connectionMode: "native-scan",
    capabilities: {
      battery: true,
      deviceInfo: true,
      heartRate: true,
      xiaomiPrivate: true,
      services: ["0000180d-0000-1000-8000-00805f9b34fb"],
      characteristicsCount: 12,
      rawServices: [],
    },
  };

  const sample = createWearableSampleFromXiaomiSnapshot(snapshot);
  assert.ok(sample);

  const analysis = getWearableDailyAnalysis([sample], sample.dateKey);
  assert.equal(analysis.directBleCount, 1);
  assert.equal(analysis.latestBattery, 77);
  assert.equal(analysis.avgHeartRate, 91);
  assert.equal(analysis.latestDeviceName, "Xiaomi Smart Band 8");
});

test("zapisuje metryki Health Connect jako próbkę analityczną", () => {
  const summary: HealthConnectSummary = {
    available: true,
    permissionsGranted: true,
    message: "OK",
    endTime: "2026-05-27T10:00:00.000Z",
    steps: 8400,
    distanceKm: 6.4,
    activeCaloriesKcal: 360,
    exerciseMinutes: 42,
    heartRateAvg: 118,
    heartRateMin: 72,
    heartRateMax: 166,
    heartRateSamples: 90,
    dataOrigins: ["com.xiaomi.hm.health"],
  };

  const sample = createWearableSampleFromHealthSummary(summary);
  assert.ok(sample);

  const analysis = getWearableDailyAnalysis([sample], sample.dateKey);
  assert.equal(analysis.healthConnectCount, 1);
  assert.equal(analysis.steps, 8400);
  assert.equal(analysis.distanceKm, 6.4);
  assert.equal(analysis.avgHeartRate, 118);
  assert.deepEqual(analysis.dataOrigins, ["com.xiaomi.hm.health"]);
});

test("appendWearableSample deduplikuje próbki po id", () => {
  const sample = createWearableSampleFromXiaomiSnapshot({
    id: "band-8",
    name: "Xiaomi Smart Band 8",
    connected: true,
    message: "Połączono.",
    batteryLevel: 60,
    capabilities: {
      battery: true,
      deviceInfo: false,
      heartRate: false,
      xiaomiPrivate: false,
      services: ["0000180f-0000-1000-8000-00805f9b34fb"],
      characteristicsCount: 2,
      rawServices: [],
    },
  });
  assert.ok(sample);

  const once = appendWearableSample([], sample);
  const twice = appendWearableSample(once, sample);
  assert.equal(once.length, 1);
  assert.equal(twice.length, 1);
});
