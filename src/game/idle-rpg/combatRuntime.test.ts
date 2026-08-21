import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_PLAYER } from "../../types";
import {
  ENEMY_DEATH_MS,
  IDLE_RPG_SAVE_KEY,
  IDLE_RPG_FIXED_STEP_MS,
  MARCH_MS,
  SHARD_RAIN_HIT_COUNT,
  advanceIdleRpgState,
  createDefaultIdleRpgSave,
  createEnemyForLocation,
  createFitnessSnapshot,
  createIdleRpgRuntime,
  createMemoryStorage,
  createIdleRpgSaveRepository,
  prepareOfflineGrant,
  startAbyssEncounter,
  startCampaignEncounter,
  stepCombat,
  useCombatSkill,
  type IdleRpgSaveState,
  type RuntimeScheduler,
} from "./index";

const NOW = Date.parse("2026-08-21T12:00:00.000Z");
const fitness = createFitnessSnapshot(INITIAL_PLAYER, NOW);

function fightingSave(seed = 123): IdleRpgSaveState {
  const save = createDefaultIdleRpgSave(NOW, fitness, seed);
  save.settings.autoBattle = false;
  save.combat.phase = "fighting";
  save.combat.phaseRemainingMs = 0;
  return save;
}

test("same seed and commands produce byte-identical deterministic combat", () => {
  const left = advanceIdleRpgState(fightingSave(42), 20_000);
  const right = advanceIdleRpgState(fightingSave(42), 20_000);
  assert.deepEqual(left, right);
  assert.equal(left.remainderMs, 0);

  const partial = advanceIdleRpgState(fightingSave(42), IDLE_RPG_FIXED_STEP_MS * 2 + 17);
  assert.equal(partial.remainderMs, 17);
});

test("Shard Rain resolves deterministic separate hits and settles a kill only once", () => {
  const durableTarget = fightingSave(430);
  durableTarget.skills["shard-rain"].unlocked = true;
  durableTarget.hero.mp = 1_000;
  durableTarget.combat.enemy.hp = 1_000_000;
  durableTarget.combat.enemy.maxHp = 1_000_000;
  const hpBefore = durableTarget.combat.enemy.hp;

  const volley = useCombatSkill(durableTarget, "shard-rain");
  assert.equal(volley.ok, true);
  const hits = volley.events.filter((event) => event.type === "hit" && event.skillId === "shard-rain");
  assert.equal(hits.length, SHARD_RAIN_HIT_COUNT);
  const totalHitDamage = volley.events.reduce(
    (total, event) => total + (event.type === "hit" && event.skillId === "shard-rain" ? event.damage : 0),
    0,
  );
  assert.equal(totalHitDamage, hpBefore - volley.state.combat.enemy.hp);

  const lethalTarget = fightingSave(431);
  lethalTarget.skills["shard-rain"].unlocked = true;
  lethalTarget.hero.mp = 1_000;
  lethalTarget.combat.enemy.hp = 1;
  const lethal = useCombatSkill(lethalTarget, "shard-rain");
  assert.equal(lethal.ok, true);
  assert.equal(lethal.events.filter((event) => event.type === "encounter-settled").length, 1);
  assert.equal(lethal.events.filter((event) => event.type === "hit").length, 1);
  assert.equal(lethal.state.combat.lastSettledEncounterSerial, lethalTarget.combat.encounterSerial);
});

test("x2 accelerates fighting cooldowns but never transition choreography", () => {
  const speedOne = fightingSave(4);
  speedOne.combat.heroAttackCooldownMs = 1_000;
  speedOne.combat.enemyAttackCooldownMs = 99_999;
  speedOne.hero.mp = 0;
  const speedTwo = structuredClone(speedOne);
  speedTwo.settings.battleSpeed = 2;
  const once = stepCombat(speedOne).state;
  const twice = stepCombat(speedTwo).state;
  assert.equal(once.combat.heroAttackCooldownMs, 950);
  assert.equal(twice.combat.heroAttackCooldownMs, 900);

  speedOne.combat.phase = "enemy-dying";
  speedOne.combat.phaseRemainingMs = ENEMY_DEATH_MS;
  speedTwo.combat.phase = "enemy-dying";
  speedTwo.combat.phaseRemainingMs = ENEMY_DEATH_MS;
  assert.equal(stepCombat(speedOne).state.combat.phaseRemainingMs, ENEMY_DEATH_MS - 50);
  assert.equal(stepCombat(speedTwo).state.combat.phaseRemainingMs, ENEMY_DEATH_MS - 50);
});

test("enemy settlement is atomic and death/march/spawn timings are stable", () => {
  let save = fightingSave(10);
  save.combat.enemy.hp = 1;
  save.combat.heroAttackCooldownMs = 0;
  save.combat.enemyAttackCooldownMs = 99_999;
  const killed = stepCombat(save);
  assert.equal(killed.state.combat.phase, "enemy-dying");
  assert.equal(killed.state.combat.lastSettledEncounterSerial, killed.state.combat.encounterSerial);
  assert.equal(killed.events.filter((event) => event.type === "encounter-settled").length, 1);
  const gold = killed.state.wallet.gold;

  const deathFinished = advanceIdleRpgState(killed.state, ENEMY_DEATH_MS);
  assert.equal(deathFinished.state.combat.phase, "marching");
  assert.equal(deathFinished.events.filter((event) => event.type === "encounter-settled").length, 0);
  const marched = advanceIdleRpgState(deathFinished.state, MARCH_MS);
  assert.equal(marched.state.combat.phase, "enemy-entering");
  assert.equal(marched.state.wallet.gold, gold);
  assert.equal(marched.state.combat.encounterSerial, killed.state.combat.encounterSerial + 1);
});

test("frontier stage 12 unlocks the next realm and Ember Bastion", () => {
  let save = fightingSave(11);
  save.campaign.highestUnlockedStage = 12;
  save.campaign.currentStage = 12;
  const selected = startCampaignEncounter(save, 12);
  assert.equal(selected.ok, true);
  if (!selected.ok) return;
  save = selected.state;
  save.combat.phase = "fighting";
  save.combat.enemy.hp = 1;
  save.combat.heroAttackCooldownMs = 0;
  save.combat.enemyAttackCooldownMs = 99_999;
  const killed = stepCombat(save);
  assert.equal(killed.state.campaign.highestUnlockedStage, 13);
  assert.equal(killed.state.campaign.currentStage, 13);
  assert.ok(killed.state.summons.unlockedIds.includes("ember-bastion"));
  assert.ok(killed.events.some((event) => event.type === "realm-unlocked" && event.realmIndex === 1));
});

test("map rejects locked nodes and abandoning a fight never grants rewards", () => {
  const save = fightingSave(15);
  const locked = startCampaignEncounter(save, 2);
  assert.deepEqual(locked, { ok: false, reason: "stage-locked" });
  const goldBefore = save.wallet.gold;
  save.campaign.highestUnlockedStage = 4;
  const selectedAdvance = startCampaignEncounter(save, 1, "advance");
  assert.equal(selectedAdvance.ok, true);
  if (!selectedAdvance.ok) return;
  assert.equal(selectedAdvance.state.wallet.gold, goldBefore);
  assert.equal(selectedAdvance.state.campaign.farmingStage, null);
  assert.equal(selectedAdvance.events.some((event) => event.type === "encounter-settled"), false);

  const selectedFarm = startCampaignEncounter(save, 1, "farm");
  assert.equal(selectedFarm.ok, true);
  if (!selectedFarm.ok) return;
  assert.equal(selectedFarm.state.campaign.farmingStage, 1);
});

test("defeating an earlier stage in advance mode progresses to next stage", () => {
  let save = fightingSave(16);
  save.campaign.highestUnlockedStage = 5;
  save.campaign.currentStage = 2;
  const selected = startCampaignEncounter(save, 2, "advance");
  assert.equal(selected.ok, true);
  if (!selected.ok) return;
  save = selected.state;
  save.combat.phase = "fighting";
  save.combat.enemy.hp = 1;
  save.combat.heroAttackCooldownMs = 0;
  save.combat.enemyAttackCooldownMs = 99_999;
  const killed = stepCombat(save);
  assert.equal(killed.state.campaign.currentStage, 3);
  assert.equal(killed.state.campaign.farmingStage, null);
  assert.equal(killed.state.campaign.highestUnlockedStage, 5);
});

test("stage 48 completes campaign and unlocks Abyss without creating stage 49", () => {
  let save = fightingSave(12);
  save.campaign.highestUnlockedStage = 48;
  save.campaign.currentStage = 48;
  const selected = startCampaignEncounter(save, 48);
  assert.equal(selected.ok, true);
  if (!selected.ok) return;
  save = selected.state;
  save.combat.phase = "fighting";
  save.combat.enemy.hp = 1;
  save.combat.heroAttackCooldownMs = 0;
  save.combat.enemyAttackCooldownMs = 99_999;
  const killed = stepCombat(save);
  assert.equal(killed.state.campaign.completed, true);
  assert.equal(killed.state.campaign.currentStage, 48);
  assert.equal(killed.state.campaign.highestUnlockedStage, 48);
  assert.equal(killed.state.abyss.unlocked, true);
  assert.equal(killed.state.combat.pendingLocation, null);
});

test("completed campaign can farm stage 48 without re-entering campaign-complete", () => {
  let save = fightingSave(120);
  save.campaign.highestUnlockedStage = 48;
  save.campaign.currentStage = 48;
  save.campaign.completed = true;
  save.abyss.unlocked = true;
  const selected = startCampaignEncounter(save, 48);
  assert.equal(selected.ok, true);
  if (!selected.ok) return;
  save = selected.state;
  assert.equal(save.campaign.farmingStage, 48);
  save.combat.phase = "fighting";
  save.combat.enemy.hp = 1;
  save.combat.heroAttackCooldownMs = 0;
  save.combat.enemyAttackCooldownMs = 99_999;
  const killed = stepCombat(save);
  assert.deepEqual(killed.state.combat.pendingLocation, { kind: "campaign", stage: 48 });
  const next = advanceIdleRpgState(killed.state, ENEMY_DEATH_MS + MARCH_MS);
  assert.equal(next.state.combat.phase, "enemy-entering");
  assert.deepEqual(next.state.combat.location, { kind: "campaign", stage: 48 });
});

test("Abyss has ten-wave depths, rewards push completion, and defeat switches to harvest", () => {
  let save = fightingSave(13);
  save.abyss.unlocked = true;
  assert.deepEqual(startAbyssEncounter(save, "harvest"), { ok: false, reason: "no-completed-abyss-depth" });
  const entered = startAbyssEncounter(save, "push");
  assert.equal(entered.ok, true);
  if (!entered.ok) return;
  save = entered.state;
  save.combat.location = { kind: "abyss", depth: 1, wave: 10 };
  save.combat.enemy = createEnemyForLocation(save.combat.location);
  save.combat.phase = "fighting";
  save.combat.enemy.hp = 1;
  save.combat.heroAttackCooldownMs = 0;
  save.combat.enemyAttackCooldownMs = 99_999;
  const completed = stepCombat(save);
  assert.equal(completed.state.abyss.highestCompletedDepth, 1);
  assert.ok(completed.state.wallet.abyssShards > 0);
  assert.deepEqual(completed.state.combat.pendingLocation, { kind: "abyss", depth: 2, wave: 1 });

  let doomed = fightingSave(14);
  doomed.abyss.unlocked = true;
  doomed.abyss.mode = "push";
  doomed.abyss.highestCompletedDepth = 3;
  doomed.combat.location = { kind: "abyss", depth: 4, wave: 2 };
  doomed.combat.enemy = { ...createEnemyForLocation(doomed.combat.location), attack: 1_000_000 };
  doomed.hero.hp = 1;
  doomed.combat.heroAttackCooldownMs = 99_999;
  doomed.combat.enemyAttackCooldownMs = 0;
  const defeated = stepCombat(doomed);
  assert.equal(defeated.state.combat.phase, "hero-dying");
  assert.equal(defeated.state.abyss.mode, "harvest");
  assert.deepEqual(defeated.state.combat.pendingLocation, { kind: "abyss", depth: 3, wave: 1 });
});

test("changing Abyss mode never abandons or restarts the current encounter", () => {
  const storage = createMemoryStorage();
  const repository = createIdleRpgSaveRepository(storage);
  const seeded = createDefaultIdleRpgSave(NOW, fitness, 131);
  seeded.campaign.completed = true;
  seeded.campaign.highestUnlockedStage = 48;
  seeded.abyss.unlocked = true;
  seeded.abyss.highestCompletedDepth = 3;
  repository.save(seeded);
  const runtime = createIdleRpgRuntime({ profile: INITIAL_PLAYER, repository, now: () => NOW, autoStart: false });
  const before = runtime.getSnapshot();
  assert.deepEqual(runtime.dispatch({ type: "set-abyss-mode", mode: "harvest" }), { ok: true });
  const after = runtime.getSnapshot();
  assert.equal(after.abyss.mode, "harvest");
  assert.deepEqual(after.location, before.location);
  assert.equal(after.encounter.serial, before.encounter.serial);
  runtime.dispose();
});

test("switching harvest to push cannot repay shards for a completed depth", () => {
  let save = fightingSave(132);
  save.campaign.completed = true;
  save.campaign.highestUnlockedStage = 48;
  save.abyss.unlocked = true;
  save.abyss.highestCompletedDepth = 3;
  save.abyss.currentDepth = 3;
  save.abyss.mode = "push";
  save.combat.location = { kind: "abyss", depth: 3, wave: 10 };
  save.combat.enemy = createEnemyForLocation(save.combat.location);
  save.combat.enemy.hp = 1;
  save.combat.heroAttackCooldownMs = 0;
  save.combat.enemyAttackCooldownMs = 99_999;
  const shardsBefore = save.wallet.abyssShards;
  const cleared = stepCombat(save);
  assert.equal(cleared.state.wallet.abyssShards, shardsBefore);
  assert.equal(cleared.state.abyss.highestCompletedDepth, 3);
  assert.deepEqual(cleared.state.combat.pendingLocation, { kind: "abyss", depth: 4, wave: 1 });
});

test("very deep Abyss encounters remain finite", () => {
  const enemy = createEnemyForLocation({ kind: "abyss", depth: 1_000_000, wave: 10 });
  for (const value of [enemy.hp, enemy.maxHp, enemy.attack, enemy.defense, enemy.goldReward, enemy.experienceReward]) {
    assert.equal(Number.isFinite(value), true);
    assert.ok(value <= Number.MAX_SAFE_INTEGER);
  }
});

test("runtime never mutates PlayerState and pause/resume creates one claimable AFK grant", () => {
  let clock = NOW;
  const profile = structuredClone(INITIAL_PLAYER);
  const before = JSON.stringify(profile);
  const callbacks: Array<(nowMs: number) => void> = [];
  const scheduler: RuntimeScheduler = {
    request(callback) { callbacks.push(callback); return callback; },
    cancel(handle) {
      const index = callbacks.indexOf(handle as (nowMs: number) => void);
      if (index >= 0) callbacks.splice(index, 1);
    },
  };
  const repository = createIdleRpgSaveRepository(createMemoryStorage());
  const runtime = createIdleRpgRuntime({ profile, repository, now: () => clock, scheduler, autoStart: false, seed: 99 });
  assert.equal(runtime.getSnapshot(), runtime.getSnapshot(), "snapshot must stay referentially stable for useSyncExternalStore");
  const beforeCommandSnapshot = runtime.getSnapshot();
  assert.deepEqual(runtime.dispatch({ type: "set-speed", speed: 2 }), { ok: true });
  assert.notEqual(runtime.getSnapshot(), beforeCommandSnapshot);
  runtime.pause("test");
  clock += 2 * 60 * 60 * 1_000;
  runtime.resume(clock);
  const pending = runtime.getSnapshot().offline.pendingGrant;
  assert.ok(pending);
  assert.deepEqual(runtime.dispatch({ type: "claim-offline", grantId: pending?.id }), { ok: true });
  const gold = runtime.getSnapshot().wallet.gold;
  assert.deepEqual(runtime.dispatch({ type: "claim-offline", grantId: pending?.id }), { ok: false, reason: "grant-already-claimed" });
  assert.equal(runtime.getSnapshot().wallet.gold, gold);
  runtime.dispose();
  assert.equal(JSON.stringify(profile), before);
});

test("active runtime persistence heartbeats prevent online time becoming AFK after force-stop", () => {
  let clock = NOW;
  const callbacks: Array<(nowMs: number) => void> = [];
  const scheduler: RuntimeScheduler = {
    request(callback) { callbacks.push(callback); return callback; },
    cancel(handle) {
      const index = callbacks.indexOf(handle as (nowMs: number) => void);
      if (index >= 0) callbacks.splice(index, 1);
    },
  };
  const storage = createMemoryStorage();
  const runtime = createIdleRpgRuntime({
    profile: structuredClone(INITIAL_PLAYER),
    repository: createIdleRpgSaveRepository(storage),
    now: () => clock,
    scheduler,
    seed: 121,
  });
  clock += 60_000;
  callbacks.shift()?.(clock);
  const persisted = JSON.parse(storage.getItem(IDLE_RPG_SAVE_KEY) ?? "null") as IdleRpgSaveState;
  assert.equal(persisted.offline.lastActiveAt, clock);
  const afterForceStop = prepareOfflineGrant(persisted, clock + 60_000);
  assert.equal(afterForceStop.grant?.elapsedSeconds, 60);
  runtime.dispose();
});

test("exit power snapshot refreshes from the latest read-only fitness profile", () => {
  let latestProfile = structuredClone(INITIAL_PLAYER);
  const runtime = createIdleRpgRuntime({
    profile: latestProfile,
    getProfile: () => latestProfile,
    now: () => NOW,
    autoStart: false,
  });
  const attackBefore = runtime.getSnapshot().fitness.attackPct;
  latestProfile = structuredClone(latestProfile);
  latestProfile.stats.STR += 100;
  runtime.pause("latest-profile-test");
  const paused = runtime.getSnapshot();
  assert.ok(paused.fitness.attackPct > attackBefore);
  assert.equal(paused.offline.powerSnapshot.capturedAt, NOW);
  runtime.dispose();
});
