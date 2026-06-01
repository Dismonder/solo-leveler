import assert from "node:assert/strict";
import test from "node:test";
import {
  applyCappedTimeBonus,
  circlesOverlap,
  randomPointAwayFrom,
  segmentIntersectsCircle,
  slicePathIntersectsTarget,
  spawnNonOverlappingObjects,
  type SpawnCircle,
} from "./miniGameGeometry";

test("randomPointAwayFrom avoids existing circles", () => {
  const existing: SpawnCircle[] = [{ x: 50, y: 50, radius: 12 }];
  let index = 0;
  const values = [0.5, 0.5, 0.1, 0.1];
  const point = randomPointAwayFrom({
    existing,
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    radius: 10,
    minGap: 4,
    random: () => values[index++ % values.length],
  });

  assert.ok(point);
  assert.equal(circlesOverlap(existing[0], point, 4), false);
});

test("segmentIntersectsCircle detects a slice through target", () => {
  assert.equal(
    segmentIntersectsCircle({ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 50, y: 50, radius: 8 }),
    true
  );
  assert.equal(
    segmentIntersectsCircle({ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 50, y: 50, radius: 8 }),
    false
  );
});

test("spawnNonOverlappingObjects avoids all previous circles", () => {
  const values = [0.5, 0.5, 0.2, 0.2, 0.8, 0.8, 0.2, 0.8, 0.8, 0.2];
  let index = 0;
  const objects = spawnNonOverlappingObjects({
    count: 3,
    existing: [{ x: 50, y: 50, radius: 14 }],
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    radius: 8,
    minGap: 2,
    attemptsPerObject: 20,
    random: () => values[index++ % values.length],
  });

  assert.ok(objects.length >= 2);
  for (let outer = 0; outer < objects.length; outer += 1) {
    for (let inner = outer + 1; inner < objects.length; inner += 1) {
      assert.equal(circlesOverlap(objects[outer], objects[inner], 2), false);
    }
  }
});

test("applyCappedTimeBonus limits remaining time and supports diminishing gains", () => {
  const now = 1_000;

  assert.equal(
    applyCappedTimeBonus({ deadline: 41_000, now, bonusMs: 10_000, capMs: 42_000 }),
    43_000
  );
  assert.equal(
    applyCappedTimeBonus({ deadline: 11_000, now, bonusMs: 4_000, capMs: 42_000, diminishingFactor: 0.5 }),
    13_000
  );
});

test("slicePathIntersectsTarget catches a fast swipe through a target", () => {
  assert.equal(
    slicePathIntersectsTarget(
      [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      { x: 50, y: 50, radius: 6 },
      { bladeWidth: 22, maxSegmentLength: 8 }
    ),
    true
  );
});

test("slicePathIntersectsTarget ignores a forgiving swipe that is still clearly outside", () => {
  assert.equal(
    slicePathIntersectsTarget(
      [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      { x: 50, y: 82, radius: 6 },
      { bladeWidth: 22, maxSegmentLength: 8 }
    ),
    false
  );
});

test("slicePathIntersectsTarget supports a short touch inside the visual hit area", () => {
  assert.equal(
    slicePathIntersectsTarget(
      [{ x: 12, y: 12 }],
      { x: 18, y: 12, radius: 3 },
      { bladeWidth: 8 }
    ),
    true
  );
});
