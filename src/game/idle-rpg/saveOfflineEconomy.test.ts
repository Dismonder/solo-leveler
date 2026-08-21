import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_PLAYER } from "../../types";
import {
  IDLE_RPG_BACKUP_KEY,
  IDLE_RPG_LEGACY_KEY,
  IDLE_RPG_SAVE_KEY,
  INVENTORY_CAPACITY,
  MARCH_MS,
  addItemToInventory,
  claimOfflineGrant,
  createDefaultIdleRpgSave,
  createFitnessSnapshot,
  createIdleRpgSaveRepository,
  createMemoryStorage,
  equipItem,
  getSkillUpgradeCost,
  loadIdleRpgCardSummary,
  markIdleRpgExit,
  normalizeIdleRpgSave,
  prepareOfflineGrant,
  rollEquipmentDrop,
  sellItem,
  setActiveSummons,
  upgradeItem,
  upgradeSkill,
  type IdleRpgItem,
  type StorageLike,
} from "./index";

const NOW = Date.parse("2026-08-21T12:00:00.000Z");
const fitness = createFitnessSnapshot(INITIAL_PLAYER, NOW);

function item(id: string, slot: IdleRpgItem["slot"] = "weapon"): IdleRpgItem {
  return { id, name: `Item ${id}`, slot, rarity: "rare", upgradeLevel: 0, attack: 10, defense: 2, hp: 5, critChance: 0.01 };
}

test("repository removes only legacy Idle save and preserves unrelated profile keys", () => {
  const storage = createMemoryStorage({
    [IDLE_RPG_LEGACY_KEY]: "legacy",
    sololeveler_player_data: "profile-byte-for-byte",
    sololeveler_history_data: "history-byte-for-byte",
  });
  const loaded = createIdleRpgSaveRepository(storage).load(NOW, fitness, 123);
  assert.equal(loaded.source, "default");
  assert.equal(storage.getItem(IDLE_RPG_LEGACY_KEY), null);
  assert.equal(storage.getItem("sololeveler_player_data"), "profile-byte-for-byte");
  assert.equal(storage.getItem("sololeveler_history_data"), "history-byte-for-byte");
});

test("repository preserves numeric zero, writes backup, and falls back from a corrupt primary", () => {
  const storage = createMemoryStorage();
  const repository = createIdleRpgSaveRepository(storage);
  const first = createDefaultIdleRpgSave(NOW, fitness, 123);
  first.wallet.gold = 7;
  assert.deepEqual(repository.save(first), { ok: true });
  const second = { ...first, wallet: { ...first.wallet, gold: 0, materials: 0 }, updatedAt: NOW + 1 };
  assert.deepEqual(repository.save(second), { ok: true });
  assert.ok(storage.getItem(IDLE_RPG_BACKUP_KEY));
  const loadedZero = repository.load(NOW + 2, fitness);
  assert.equal(loadedZero.save.wallet.gold, 0);
  assert.equal(loadedZero.save.wallet.materials, 0);

  storage.setItem(IDLE_RPG_SAVE_KEY, "{broken");
  const fallback = repository.load(NOW + 3, fitness);
  assert.equal(fallback.source, "backup");
  assert.equal(fallback.save.wallet.gold, 7);
});

test("future-schema save is ignored without damaging a valid backup", () => {
  const backup = createDefaultIdleRpgSave(NOW, fitness, 9);
  backup.hero.level = 8;
  const storage = createMemoryStorage({
    [IDLE_RPG_SAVE_KEY]: JSON.stringify({ schemaVersion: 99, hero: { level: 999 } }),
    [IDLE_RPG_BACKUP_KEY]: JSON.stringify(backup),
  });
  const loaded = createIdleRpgSaveRepository(storage).load(NOW, fitness);
  assert.equal(loaded.source, "backup");
  assert.equal(loaded.save.hero.level, 8);
});

test("normalization derives unlocks and locations from cleared campaign progress", () => {
  const corrupt = createDefaultIdleRpgSave(NOW, fitness, 91);
  corrupt.campaign.currentStage = 1;
  corrupt.campaign.highestUnlockedStage = 1;
  corrupt.campaign.completed = false;
  corrupt.abyss.unlocked = true;
  corrupt.abyss.mode = "harvest";
  corrupt.abyss.currentDepth = 999;
  corrupt.abyss.highestCompletedDepth = 0;
  corrupt.skills["last-meridian"].unlocked = true;
  corrupt.summons.unlockedIds = ["meridian-fang", "dusk-aureole"];
  corrupt.summons.activeIds = ["dusk-aureole"];
  corrupt.combat.location = { kind: "abyss", depth: 999, wave: 10 };
  corrupt.combat.pendingLocation = { kind: "campaign", stage: 48 };
  corrupt.offline.powerSnapshot.location = { kind: "abyss", depth: 999, wave: 10 };

  const normalized = normalizeIdleRpgSave(corrupt, NOW, fitness);
  assert.ok(normalized);
  assert.equal(normalized?.abyss.unlocked, false);
  assert.equal(normalized?.abyss.mode, "push");
  assert.equal(normalized?.skills["last-meridian"].unlocked, false);
  assert.deepEqual(normalized?.summons.unlockedIds, ["meridian-fang"]);
  assert.deepEqual(normalized?.summons.activeIds, ["meridian-fang"]);
  assert.deepEqual(normalized?.combat.location, { kind: "campaign", stage: 1 });
  assert.deepEqual(normalized?.combat.pendingLocation, { kind: "campaign", stage: 1 });
  assert.deepEqual(normalized?.offline.powerSnapshot.location, { kind: "campaign", stage: 1 });
});

test("normalization replaces unrecoverable combat checkpoints without settling them again", () => {
  const cases: Array<{
    name: string;
    configure(save: ReturnType<typeof createDefaultIdleRpgSave>): void;
  }> = [
    {
      name: "active encounter already settled",
      configure(save) {
        save.combat.phase = "fighting";
        save.combat.encounterSerial = 7;
        save.combat.lastSettledEncounterSerial = 7;
      },
    },
    {
      name: "loading checkpoint",
      configure(save) {
        save.combat.phase = "loading";
        save.combat.encounterSerial = 4;
        save.combat.lastSettledEncounterSerial = 3;
      },
    },
    {
      name: "transition without destination",
      configure(save) {
        save.combat.phase = "marching";
        save.combat.encounterSerial = 8;
        save.combat.lastSettledEncounterSerial = 8;
        save.combat.enemy.hp = 0;
        save.combat.pendingLocation = null;
      },
    },
    {
      name: "premature campaign completion",
      configure(save) {
        save.combat.phase = "campaign-complete";
        save.combat.encounterSerial = 9;
        save.combat.lastSettledEncounterSerial = 9;
        save.combat.enemy.hp = 0;
      },
    },
  ];

  for (const scenario of cases) {
    const corrupt = createDefaultIdleRpgSave(NOW, fitness, 222);
    corrupt.wallet.gold = 91;
    corrupt.stats.monstersDefeated = 6;
    scenario.configure(corrupt);
    const previousSerial = Math.max(corrupt.combat.encounterSerial, corrupt.combat.lastSettledEncounterSerial);
    const previousSettled = corrupt.combat.lastSettledEncounterSerial;

    const normalized = normalizeIdleRpgSave(corrupt, NOW, fitness);
    assert.ok(normalized, scenario.name);
    assert.equal(normalized?.combat.phase, "enemy-entering", scenario.name);
    assert.equal(normalized?.combat.encounterSerial, previousSerial + 1, scenario.name);
    assert.equal(normalized?.combat.lastSettledEncounterSerial, previousSettled, scenario.name);
    assert.ok((normalized?.combat.encounterSerial ?? 0) > (normalized?.combat.lastSettledEncounterSerial ?? 0), scenario.name);
    assert.equal(normalized?.combat.enemy.hp, normalized?.combat.enemy.maxHp, scenario.name);
    assert.deepEqual(normalized?.combat.location, { kind: "campaign", stage: 1 }, scenario.name);
    assert.equal(normalized?.wallet.gold, 91, `${scenario.name}: normalization must not grant gold`);
    assert.equal(normalized?.stats.monstersDefeated, 6, `${scenario.name}: normalization must not settle an encounter`);
  }
});

test("normalization preserves coherent combat checkpoints and caps choreography timers", () => {
  const fighting = createDefaultIdleRpgSave(NOW, fitness, 223);
  fighting.combat.phase = "fighting";
  fighting.combat.phaseRemainingMs = 0;
  fighting.combat.encounterSerial = 5;
  fighting.combat.lastSettledEncounterSerial = 4;
  fighting.combat.enemy.hp = Math.floor(fighting.combat.enemy.maxHp / 2);
  const normalizedFighting = normalizeIdleRpgSave(fighting, NOW, fitness);
  assert.equal(normalizedFighting?.combat.phase, "fighting");
  assert.equal(normalizedFighting?.combat.encounterSerial, 5);
  assert.equal(normalizedFighting?.combat.lastSettledEncounterSerial, 4);
  assert.equal(normalizedFighting?.combat.enemy.hp, fighting.combat.enemy.hp);

  const marching = createDefaultIdleRpgSave(NOW, fitness, 224);
  marching.campaign.currentStage = 2;
  marching.campaign.highestUnlockedStage = 2;
  marching.combat.phase = "marching";
  marching.combat.phaseRemainingMs = 1e300;
  marching.combat.location = { kind: "campaign", stage: 1 };
  marching.combat.pendingLocation = { kind: "campaign", stage: 2 };
  marching.combat.encounterSerial = 6;
  marching.combat.lastSettledEncounterSerial = 6;
  marching.combat.enemy.hp = 0;
  const normalizedMarching = normalizeIdleRpgSave(marching, NOW, fitness);
  assert.equal(normalizedMarching?.combat.phase, "marching");
  assert.equal(normalizedMarching?.combat.encounterSerial, 6);
  assert.deepEqual(normalizedMarching?.combat.pendingLocation, { kind: "campaign", stage: 2 });
  assert.equal(normalizedMarching?.combat.phaseRemainingMs, MARCH_MS);

  const completed = createDefaultIdleRpgSave(NOW, fitness, 225);
  completed.campaign.currentStage = 48;
  completed.campaign.highestUnlockedStage = 48;
  completed.campaign.completed = true;
  completed.combat.phase = "campaign-complete";
  completed.combat.location = { kind: "campaign", stage: 48 };
  completed.combat.pendingLocation = null;
  completed.combat.encounterSerial = 48;
  completed.combat.lastSettledEncounterSerial = 48;
  completed.combat.enemy.hp = 0;
  const normalizedCompleted = normalizeIdleRpgSave(completed, NOW, fitness);
  assert.equal(normalizedCompleted?.combat.phase, "campaign-complete");
  assert.equal(normalizedCompleted?.combat.encounterSerial, 48);
});

test("normalization drops claimed AFK grants and rederives pending rewards from safe timing and power", () => {
  const claimed = createDefaultIdleRpgSave(NOW, fitness, 226);
  const claimedFrom = NOW - 3_600_000;
  const claimedId = `afk-${claimedFrom}-${NOW}`;
  claimed.offline.lastActiveAt = claimedFrom;
  claimed.offline.lastClaimedGrantId = claimedId;
  claimed.offline.pendingGrant = {
    id: claimedId,
    fromMs: claimedFrom,
    toMs: NOW,
    elapsedSeconds: 3_600,
    cappedSeconds: 3_600,
    gold: 999_999_999,
    experience: 999_999_999,
    materials: 999_999_999,
  };
  const normalizedClaimed = normalizeIdleRpgSave(claimed, NOW, fitness);
  assert.equal(normalizedClaimed?.offline.pendingGrant, null);
  assert.equal(normalizedClaimed?.offline.lastActiveAt, NOW);
  assert.equal(prepareOfflineGrant(normalizedClaimed!, NOW).grant, null);

  const forged = createDefaultIdleRpgSave(NOW, fitness, 227);
  const forgedFrom = NOW - 30 * 60 * 60 * 1_000;
  forged.offline.lastActiveAt = forgedFrom;
  forged.offline.pendingGrant = {
    id: "attacker-controlled-id",
    fromMs: forgedFrom,
    toMs: NOW,
    elapsedSeconds: 1,
    cappedSeconds: 1,
    gold: Number.MAX_SAFE_INTEGER,
    experience: Number.MAX_SAFE_INTEGER,
    materials: Number.MAX_SAFE_INTEGER,
  };
  const normalized = normalizeIdleRpgSave(forged, NOW, fitness);
  assert.ok(normalized?.offline.pendingGrant);
  const grant = normalized!.offline.pendingGrant!;
  assert.equal(grant.id, `afk-${forgedFrom}-${NOW}`);
  assert.equal(grant.elapsedSeconds, 30 * 60 * 60);
  assert.equal(grant.cappedSeconds, 12 * 60 * 60);
  assert.equal(grant.gold, Math.floor(12 * 60 * normalized!.offline.powerSnapshot.goldPerMinute));
  assert.equal(grant.experience, Math.floor(12 * 60 * normalized!.offline.powerSnapshot.experiencePerMinute));
  assert.equal(grant.materials, Math.floor(12 * normalized!.offline.powerSnapshot.materialsPerHour));
  assert.ok(grant.gold < Number.MAX_SAFE_INTEGER);

  const inconsistent = createDefaultIdleRpgSave(NOW, fitness, 228);
  inconsistent.offline.lastActiveAt = NOW - 120_000;
  inconsistent.offline.pendingGrant = {
    id: "invalid-window",
    fromMs: NOW - 60_000,
    toMs: NOW + 60_000,
    elapsedSeconds: 999,
    cappedSeconds: 999,
    gold: 999,
    experience: 999,
    materials: 999,
  };
  assert.equal(normalizeIdleRpgSave(inconsistent, NOW, fitness)?.offline.pendingGrant, null);
});

test("offline grant has a 60 second minimum, 12 hour cap, and can be claimed exactly once", () => {
  let save = createDefaultIdleRpgSave(NOW, fitness, 123);
  save = markIdleRpgExit(save, NOW);
  assert.equal(prepareOfflineGrant(save, NOW + 59_999).grant, null);
  const prepared = prepareOfflineGrant(save, NOW + 30 * 60 * 60 * 1_000);
  assert.ok(prepared.grant);
  assert.equal(prepared.grant?.cappedSeconds, 12 * 60 * 60);
  assert.equal(prepared.grant?.elapsedSeconds, 30 * 60 * 60);
  assert.ok((prepared.grant?.gold ?? 0) > 0);
  assert.equal(prepared.grant?.materials, Math.floor(12 * save.offline.powerSnapshot.materialsPerHour));

  const claimed = claimOfflineGrant(prepared.state, prepared.grant?.id);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) return;
  const goldAfter = claimed.state.wallet.gold;
  const second = claimOfflineGrant(claimed.state, prepared.grant?.id);
  assert.equal(second.ok, false);
  assert.equal(second.state.wallet.gold, goldAfter);
  assert.equal("reason" in second ? second.reason : "", "grant-already-claimed");
  assert.equal(prepareOfflineGrant(save, NOW - 60_000).grant, null, "clock rollback must never mint currency");
});

test("offline snapshot never farms an uncompleted Abyss depth", () => {
  let save = createDefaultIdleRpgSave(NOW, fitness, 123);
  save.campaign.completed = true;
  save.campaign.highestUnlockedStage = 48;
  save.abyss.unlocked = true;
  save.abyss.mode = "push";
  save.abyss.highestCompletedDepth = 2;
  save.combat.location = { kind: "abyss", depth: 3, wave: 8 };
  const exited = markIdleRpgExit(save, NOW + 1_000);
  assert.deepEqual(exited.offline.powerSnapshot.location, { kind: "abyss", depth: 2, wave: 1 });
  save.abyss.highestCompletedDepth = 0;
  const noDepthExited = markIdleRpgExit(save, NOW + 2_000);
  assert.deepEqual(noDepthExited.offline.powerSnapshot.location, { kind: "campaign", stage: 48 });
});

test("canonical inventory rejects repeated sale of equipped or missing items", () => {
  let save = createDefaultIdleRpgSave(NOW, fitness, 123);
  save = addItemToInventory(save, item("blade")).state;
  const equipped = equipItem(save, "blade");
  assert.equal(equipped.ok, true);
  if (!equipped.ok) return;
  assert.deepEqual(sellItem(equipped.state, "blade"), { ok: false, reason: "item-equipped" });
  const unequipped = { ...equipped.state, equipped: { ...equipped.state.equipped, weapon: null } };
  const sold = sellItem(unequipped, "blade");
  assert.equal(sold.ok, true);
  if (!sold.ok) return;
  assert.deepEqual(sellItem(sold.state, "blade"), { ok: false, reason: "item-not-found" });
});

test("full inventory salvages overflow instead of deleting an older item", () => {
  let save = createDefaultIdleRpgSave(NOW, fitness, 123);
  for (let index = 0; index < INVENTORY_CAPACITY; index += 1) save = addItemToInventory(save, item(`item-${index}`)).state;
  const firstId = save.inventoryOrder[0];
  const overflow = addItemToInventory(save, { ...item("overflow"), rarity: "legendary" });
  assert.equal(overflow.added, false);
  assert.ok(overflow.salvagedMaterials > 0);
  assert.equal(overflow.state.inventoryOrder.length, INVENTORY_CAPACITY);
  assert.equal(overflow.state.inventoryOrder[0], firstId);
  assert.ok(overflow.state.items[firstId]);
});

test("equipment and summon operations are atomic when validation fails", () => {
  let save = createDefaultIdleRpgSave(NOW, fitness, 123);
  save = addItemToInventory(save, item("blade")).state;
  const before = JSON.stringify(save);
  assert.deepEqual(upgradeItem(save, "blade"), { ok: false, reason: "insufficient-currency" });
  assert.equal(JSON.stringify(save), before);
  assert.deepEqual(setActiveSummons(save, ["meridian-fang", "ember-bastion"]), { ok: false, reason: "summon-locked" });
  assert.deepEqual(
    setActiveSummons({ ...save, summons: { ...save.summons, unlockedIds: ["meridian-fang", "ember-bastion", "ink-mora", "storm-spire"] } }, ["meridian-fang", "ember-bastion", "ink-mora", "storm-spire"]),
    { ok: false, reason: "too-many-summons" },
  );
});

test("drop generation and card summary are deterministic/read-only", () => {
  const first = rollEquipmentDrop(123, { kind: "campaign", stage: 12 }, "boss", 44, 1);
  const second = rollEquipmentDrop(123, { kind: "campaign", stage: 12 }, "boss", 44, 1);
  assert.deepEqual(first, second);
  assert.ok(first.item);

  const save = createDefaultIdleRpgSave(NOW, fitness, 123);
  save.hero.level = 9;
  save.campaign.currentStage = 7;
  save.campaign.highestUnlockedStage = 8;
  const storage: StorageLike = createMemoryStorage({ [IDLE_RPG_SAVE_KEY]: JSON.stringify(save) });
  assert.deepEqual(loadIdleRpgCardSummary(storage), { heroLevel: 9, currentStage: 7, highestStage: 8, abyssUnlocked: false });
  storage.setItem(IDLE_RPG_BACKUP_KEY, storage.getItem(IDLE_RPG_SAVE_KEY)!);
  storage.setItem(IDLE_RPG_SAVE_KEY, "corrupt");
  assert.deepEqual(loadIdleRpgCardSummary(storage), { heroLevel: 9, currentStage: 7, highestStage: 8, abyssUnlocked: false });
});

test("skills can be upgraded with gold and materials, scaling damage cleanly", () => {
  let save = createDefaultIdleRpgSave(NOW, fitness, 123);
  save.skills["meridian-rend"].unlocked = true;
  save.skills["meridian-rend"].level = 1;
  const cost = getSkillUpgradeCost("meridian-rend", 1);
  assert.ok(cost.gold > 0);
  assert.ok(cost.materials > 0);

  // Insufficient currency fails
  save.wallet.gold = 0;
  save.wallet.materials = 0;
  assert.deepEqual(upgradeSkill(save, "meridian-rend"), { ok: false, reason: "insufficient-currency" });

  // Locked skill fails
  save.skills["last-meridian"].unlocked = false;
  save.wallet.gold = 99_999;
  save.wallet.materials = 99_999;
  assert.deepEqual(upgradeSkill(save, "last-meridian"), { ok: false, reason: "skill-locked" });

  // Successful upgrade deducts cost and increments level
  const upgraded = upgradeSkill(save, "meridian-rend");
  assert.equal(upgraded.ok, true);
  if (!upgraded.ok) return;
  assert.equal(upgraded.state.skills["meridian-rend"].level, 2);
  assert.equal(upgraded.state.wallet.gold, 99_999 - cost.gold);
  assert.equal(upgraded.state.wallet.materials, 99_999 - cost.materials);
});
