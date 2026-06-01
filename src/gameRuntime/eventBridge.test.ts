import test from "node:test";
import assert from "node:assert/strict";
import { createGameRuntimeEventBridge } from "./eventBridge";
import type { GameRuntimeEvent } from "./types";

test("runtime event bridge normalizes snapshots", () => {
  const events: GameRuntimeEvent[] = [];
  const bridge = createGameRuntimeEventBridge((event) => events.push(event));

  bridge.emitSnapshot({ state: "running", score: 42.8, combo: 2.5, remainingMs: 900.9 });

  assert.deepEqual(events, [
    {
      type: "snapshot",
      snapshot: {
        state: "running",
        score: 42,
        combo: 2,
        remainingMs: 900,
        hpRestored: 0,
        hpLoss: 0,
      },
    },
  ]);
});

test("runtime event bridge ignores events after destroy", () => {
  const events: GameRuntimeEvent[] = [];
  const bridge = createGameRuntimeEventBridge((event) => events.push(event));

  bridge.destroy();
  bridge.emitSnapshot({ state: "running", score: 100 });
  bridge.emit({ type: "pause-requested" });

  assert.equal(bridge.isDestroyed(), true);
  assert.equal(events.length, 0);
});

