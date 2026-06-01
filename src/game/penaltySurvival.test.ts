import test from "node:test";
import assert from "node:assert/strict";
import { getPenaltyEnemyCap, shouldBanishPenaltyEnemy } from "./penaltySurvival";

test("penalty zone caps active enemies by wave", () => {
  assert.equal(getPenaltyEnemyCap(1), 9);
  assert.equal(getPenaltyEnemyCap(4), 15);
  assert.equal(getPenaltyEnemyCap(20), 18);
});

test("barrier banishes enemies instead of letting them stack on the hunter", () => {
  const hunter = { x: 50, y: 50, dashTimer: 0, shieldTimer: 420 };
  const safeZone = { x: 50, y: 50, radius: 9 };

  assert.equal(
    shouldBanishPenaltyEnemy({
      enemy: { x: 52, y: 50, size: 5 },
      hunter,
      safeZone,
    }),
    true
  );

  assert.equal(
    shouldBanishPenaltyEnemy({
      enemy: { x: 52, y: 50, size: 5 },
      hunter: { ...hunter, shieldTimer: 0 },
      safeZone,
    }),
    false
  );
});
