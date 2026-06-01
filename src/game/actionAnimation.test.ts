import test from "node:test";
import assert from "node:assert/strict";
import { animationEventToSpriteAnimation, spriteEventDuration, spriteEventLock } from "./actionAnimation";

test("combat animation mapping keeps impact events as hurt frames", () => {
  assert.equal(animationEventToSpriteAnimation({ type: "crit", payload: { damage: 42 } }), "hurt");
  assert.equal(animationEventToSpriteAnimation({ type: "crit", payload: { action: "shadow" } }), "attack_2");
  assert.equal(animationEventToSpriteAnimation({ type: "attack", payload: { sprite: "attack_2" } }), "attack_2");
  assert.equal(animationEventToSpriteAnimation({ type: "dash" }), "dash");
});

test("sprite timings use manifest durations instead of short css defaults", () => {
  const attackDuration = spriteEventDuration("hunter", "attack_1");
  assert.ok(attackDuration >= 700);
  assert.ok(spriteEventLock("hunter", "attack_1", "attack") >= 220);
});
