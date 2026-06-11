import test from "node:test";
import assert from "node:assert/strict";
import { createFrameTraceBuffer } from "./performanceTrace";

test("trace buffer keeps recent frame samples and reports worst frame", () => {
  const buffer = createFrameTraceBuffer(3);
  buffer.push({ timestamp: 1, fps: 120, averageFps: 120, minFps: 120, frameMs: 8.3, p95Ms: 8.3, p99Ms: 8.3, stutters25: 0, stutters33: 0, mode: "game" });
  buffer.push({ timestamp: 2, fps: 60, averageFps: 90, minFps: 60, frameMs: 16.7, p95Ms: 16.7, p99Ms: 16.7, stutters25: 0, stutters33: 0, mode: "game" });
  buffer.push({ timestamp: 3, fps: 30, averageFps: 70, minFps: 30, frameMs: 33.4, p95Ms: 33.4, p99Ms: 33.4, stutters25: 1, stutters33: 1, mode: "game" });
  buffer.push({ timestamp: 4, fps: 90, averageFps: 75, minFps: 90, frameMs: 11.1, p95Ms: 11.1, p99Ms: 11.1, stutters25: 1, stutters33: 1, mode: "game" });

  const summary = buffer.summary();
  assert.equal(buffer.all().length, 3);
  assert.equal(summary.samples, 3);
  assert.equal(summary.minFps, 30);
  assert.equal(summary.worstFrameMs, 33.4);
  assert.equal(summary.latestFps, 90);
  assert.equal(summary.stutters25, 1);
  assert.equal(summary.stutters33, 1);
});

test("trace summary keeps worst stutter counts even after recovery", () => {
  const buffer = createFrameTraceBuffer(4);
  buffer.push({ timestamp: 1, fps: 120, averageFps: 120, minFps: 120, frameMs: 8.3, p95Ms: 8.3, p99Ms: 8.3, stutters25: 0, stutters33: 0, mode: "game" });
  buffer.push({ timestamp: 2, fps: 34, averageFps: 70, minFps: 34, frameMs: 29.4, p95Ms: 29.4, p99Ms: 29.4, stutters25: 3, stutters33: 0, mode: "game" });
  buffer.push({ timestamp: 3, fps: 120, averageFps: 100, minFps: 120, frameMs: 8.3, p95Ms: 8.3, p99Ms: 8.3, stutters25: 1, stutters33: 0, mode: "game" });

  const summary = buffer.summary();
  assert.equal(summary.latestFps, 120);
  assert.equal(summary.stutters25, 3);
});

test("trace buffer ignores invalid samples and can be cleared", () => {
  const buffer = createFrameTraceBuffer(2);
  buffer.push({ timestamp: Number.NaN, fps: 60, averageFps: 60, minFps: 60, frameMs: 16, p95Ms: 16, p99Ms: 16, stutters25: 0, stutters33: 0, mode: "app" });
  assert.equal(buffer.summary().samples, 0);

  buffer.push({ timestamp: 1, fps: -10, averageFps: -5, minFps: -1, frameMs: -2, p95Ms: -3, p99Ms: -4, stutters25: -1, stutters33: -1, mode: "app" });
  assert.equal(buffer.summary().latestFps, 0);

  buffer.clear();
  assert.equal(buffer.summary().samples, 0);
});
