import assert from "node:assert/strict";
import test from "node:test";
import {
  canBuyShadowExtractionEffect,
  canBuyShadowExtractionUpgrade,
  createDefaultShadowExtractionUpgrades,
  getNextShadowExtractionUpgradeCost,
  normalizeShadowExtractionUpgrades,
} from "./shadowExtractionUpgrades";

test("shadow extraction upgrades normalize old saves", () => {
  const upgrades = normalizeShadowExtractionUpgrades({
    selectedEffect: "blood-red",
    ownedEffects: ["blood-red"],
    upgrades: { focus: 9, flow: -2, ward: 1 },
  });

  assert.deepEqual(upgrades.ownedEffects.sort(), ["blood-red", "system-blue"].sort());
  assert.equal(upgrades.selectedEffect, "blood-red");
  assert.equal(upgrades.upgrades.focus, 3);
  assert.equal(upgrades.upgrades.flow, 0);
  assert.equal(upgrades.upgrades.ward, 1);
});

test("shadow extraction shop blocks unavailable purchases", () => {
  const upgrades = createDefaultShadowExtractionUpgrades();

  assert.equal(canBuyShadowExtractionEffect(upgrades, "violet-rune", 20), false);
  assert.equal(canBuyShadowExtractionEffect(upgrades, "violet-rune", 140), true);
  assert.equal(getNextShadowExtractionUpgradeCost(upgrades, "focus"), 120);
  assert.equal(canBuyShadowExtractionUpgrade(upgrades, "focus", 119), false);
  assert.equal(canBuyShadowExtractionUpgrade(upgrades, "focus", 120), true);
});
