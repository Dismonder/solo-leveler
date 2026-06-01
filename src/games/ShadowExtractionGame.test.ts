import assert from "node:assert/strict";
import test from "node:test";
import { getShadowExtractionArenaPoint } from "../game/shadowExtraction";

test("shadow extraction reticle maps pointer position to arena percentages", () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 };

  assert.deepEqual(getShadowExtractionArenaPoint(300, 150, rect), { x: 50, y: 50 });
  assert.deepEqual(getShadowExtractionArenaPoint(100, 50, rect), { x: 0, y: 0 });
  assert.deepEqual(getShadowExtractionArenaPoint(500, 250, rect), { x: 100, y: 100 });
});

test("shadow extraction reticle clamps clicks outside the arena", () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 };

  assert.deepEqual(getShadowExtractionArenaPoint(40, 20, rect), { x: 0, y: 0 });
  assert.deepEqual(getShadowExtractionArenaPoint(560, 280, rect), { x: 100, y: 100 });
});
