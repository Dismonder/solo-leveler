import assert from "node:assert/strict";
import test from "node:test";
import { shouldPrepareMiniGameAudio } from "./audio";

test("mini-game audio warmup follows enabled state and volume", () => {
  assert.equal(shouldPrepareMiniGameAudio(true, 1), true);
  assert.equal(shouldPrepareMiniGameAudio(false, 1), false);
  assert.equal(shouldPrepareMiniGameAudio(true, 0), false);
});
