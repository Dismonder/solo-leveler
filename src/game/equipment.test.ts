import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_PLAYER, type Equipment } from "../types";
import {
  equipItem,
  getEquippedMiniGameBonuses,
  normalizeEquipmentInventory,
  normalizeEquipmentLoadout,
  normalizePlayerEquipment,
  unequipSlot,
} from "./equipment";
import { getEffectiveStats } from "./playerMath";

const sword: Equipment = {
  id: "test-sword",
  name: "Ostrze testowe",
  type: "weapon",
  rarity: "rare",
  bonusType: "STR",
  bonusValue: 7,
  durability: 100,
  maxDurability: 100,
};

test("equipment migration maps legacy accessory to artifact slot", () => {
  const loadout = normalizeEquipmentLoadout({
    weapon: sword,
    accessory: {
      ...sword,
      id: "legacy-relic",
      name: "Stary relikt",
      type: "accessory",
      bonusType: "SENSE",
      bonusValue: 3,
    },
  });

  assert.equal(loadout.weapon?.id, "test-sword");
  assert.equal(loadout.artifact?.id, "legacy-relic");
  assert.equal(loadout.artifact?.type, "artifact");
  assert.equal(loadout.ring1, null);
});

test("equipping item moves previous slot item back to backpack and updates stats", () => {
  const player = {
    ...INITIAL_PLAYER,
    inventory: [sword],
  };

  const equipped = equipItem(player, sword);
  assert.equal(equipped.equipment.weapon?.id, "test-sword");
  assert.equal(equipped.inventory.length, 0);
  assert.equal(getEffectiveStats(equipped).STR, INITIAL_PLAYER.stats.STR + 7);

  const unequipped = unequipSlot(equipped, "weapon");
  assert.equal(unequipped.equipment.weapon, null);
  assert.equal(unequipped.inventory[0]?.id, "test-sword");
});

test("legacy relic named as relic is migrated away from armor into artifact", () => {
  const [legacyRelic] = normalizeEquipmentInventory([
    {
      ...sword,
      id: "legacy-relic-armor",
      name: "Relikt poziomu 21",
      type: "armor",
      bonusType: "SENSE",
      bonusValue: 12,
    },
  ]);

  assert.equal(legacyRelic.type, "artifact");
  assert.equal(legacyRelic.legacyType, "armor");
  assert.equal(legacyRelic.miniGamePerk?.gameId, "all");
  assert.equal(legacyRelic.miniGamePerk?.kind, "targetLifetime");

  const loadout = normalizeEquipmentLoadout({
    armor: legacyRelic,
  });

  assert.equal(loadout.armor, null);
  assert.equal(loadout.artifact?.id, "legacy-relic-armor");
});

test("player equipment migration keeps displaced legacy items in backpack", () => {
  const normalized = normalizePlayerEquipment({
    ...INITIAL_PLAYER,
    equipment: {
      ...INITIAL_PLAYER.equipment,
      artifact: {
        ...sword,
        id: "equipped-artifact",
        name: "Rdzeń Bramy",
        type: "artifact",
        bonusType: "SENSE",
      },
      armor: {
        ...sword,
        id: "legacy-relic-overflow",
        name: "Relikt poziomu 19",
        type: "armor",
        bonusType: "SENSE",
      },
    },
  });

  assert.equal(normalized.equipment.artifact?.id, "equipped-artifact");
  assert.equal(normalized.equipment.armor, null);
  assert.equal(normalized.inventory.some((item) => item.id === "legacy-relic-overflow" && item.type === "artifact"), true);
});

test("equipping compatible item preserves item category and records equipped slot", () => {
  const gloves: Equipment = {
    ...sword,
    id: "test-gloves",
    name: "Rękawice Cienia",
    type: "gloves",
    bonusType: "STR",
  };
  const player = { ...INITIAL_PLAYER, inventory: [gloves] };
  const equipped = equipItem(player, gloves);

  assert.equal(equipped.equipment.gloves?.id, "test-gloves");
  assert.equal(equipped.equipment.gloves?.type, "gloves");
  assert.equal(equipped.equipment.gloves?.equippedSlot, "gloves");
});

test("equipped rare relic exposes capped mini-game bonuses", () => {
  const relic: Equipment = {
    ...sword,
    id: "test-relic",
    name: "Rdzeń Bramy S",
    type: "artifact",
    rarity: "legendary",
    miniGamePerk: {
      gameId: "gate-dodge",
      kind: "targetLifetime",
      value: 999,
    },
  };
  const player = {
    ...INITIAL_PLAYER,
    equipment: {
      ...INITIAL_PLAYER.equipment,
      artifact: relic,
    },
  };

  const bonuses = getEquippedMiniGameBonuses(player, "gate-dodge");
  assert.equal(bonuses.targetLifetime, 250);
  assert.equal(getEquippedMiniGameBonuses(player, "shadow-extraction").targetLifetime, 0);
});
