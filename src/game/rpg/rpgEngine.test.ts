import test from "node:test";
import assert from "node:assert/strict";
import {
  createRpgWorldState,
  getRpgNode,
  resolveRpgInteraction,
  updateRpgWorld,
} from "./rpgEngine";

test("rpg engine moves the hunter and clamps world bounds", () => {
  const state = createRpgWorldState();
  const moved = updateRpgWorld(state, { up: false, down: false, left: false, right: true, dash: false }, 1000, {
    agility: 20,
    level: 1,
  });

  assert.ok(moved.player.x > state.player.x);
  assert.equal(moved.player.facing, "right");

  const clamped = updateRpgWorld({ ...moved, player: { ...moved.player, x: 91 } }, { up: false, down: false, left: false, right: true, dash: true }, 1000, {
    agility: 80,
    level: 1,
  });
  assert.equal(clamped.player.x, 92);
});

test("rpg engine exposes nearby node interactions", () => {
  const base = createRpgWorldState();
  const state = { ...base, player: { ...base.player, x: 33.2, y: 24.1 } };

  assert.equal(resolveRpgInteraction(state, 1), "skills");
  assert.equal(getRpgNode(state.activeNodeId), null);
});

test("rpg engine gates locked nodes by level", () => {
  const base = createRpgWorldState();
  const nearVault = { ...base, player: { ...base.player, x: 77.8, y: 66.4 } };

  assert.equal(resolveRpgInteraction(nearVault, 1), null);
  assert.equal(resolveRpgInteraction(nearVault, 3), "history");
});
