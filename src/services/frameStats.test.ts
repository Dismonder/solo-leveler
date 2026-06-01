import assert from "node:assert/strict";
import test from "node:test";
import { summarizeFrameDeltas } from "./frameStats";

test("frame stats summarize 120 hz budget misses and worst fps", () => {
  const stats = summarizeFrameDeltas([8.1, 8.2, 8.4, 12, 18, 25, 33.4], 120);

  assert.equal(stats.samples, 7);
  assert.equal(Math.round(stats.budgetMs * 100) / 100, 8.33);
  assert.equal(stats.budgetMisses, 4);
  assert.equal(stats.stutters16, 3);
  assert.equal(stats.stutters25, 1);
  assert.equal(stats.stutters33, 1);
  assert.equal(Math.round(stats.minFps), 30);
});

test("frame stats ignore invalid samples and handle empty input", () => {
  const empty = summarizeFrameDeltas([0, -1, Number.NaN, 1200], 120);

  assert.equal(empty.samples, 0);
  assert.equal(empty.fps, 0);
  assert.equal(empty.budgetMisses, 0);
});
