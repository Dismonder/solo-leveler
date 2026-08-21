import {
  ABYSS_WAVES_PER_DEPTH,
  CAMPAIGN_STAGE_COUNT,
  SKILLS,
  STAGES_PER_REALM,
  SUMMONS,
  getAbyssEnemy,
  getStageDefinition,
} from "./content";
import {
  addItemToInventory,
  applyIdleExperience,
  getHeroCombatStats,
  rollEquipmentDrop,
} from "./economy";
import { nextRandom } from "./rng";
import {
  IDLE_RPG_FIXED_STEP_MS,
  type CombatCheckpoint,
  type EncounterLocation,
  type EnemyCombatState,
  type IdleRpgEvent,
  type IdleRpgSaveState,
  type IdleRpgSkillId,
  type IdleRpgSummonId,
} from "./types";

export const ENEMY_DEATH_MS = 650 as const;
export const MARCH_MS = 1_200 as const;
export const ENEMY_ENTER_MS = 500 as const;
export const HERO_DEATH_MS = 650 as const;
export const RESPAWN_MS = 1_200 as const;
export const SHARD_RAIN_HIT_COUNT = 5 as const;

const SKILL_IDS = SKILLS.map((skill) => skill.id);
const MAX_COMBAT_NUMBER = Number.MAX_SAFE_INTEGER;

function boundedPow(base: number, exponent: number, cap: number): number {
  return Math.exp(Math.min(Math.log(cap), Math.max(0, exponent) * Math.log(base)));
}

function boundedRound(value: number, min = 0, max = MAX_COMBAT_NUMBER): number {
  if (!Number.isFinite(value)) return max;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function cloneLocation(location: EncounterLocation): EncounterLocation {
  return { ...location } as EncounterLocation;
}

function copyState(save: IdleRpgSaveState): IdleRpgSaveState {
  return {
    ...save,
    campaign: { ...save.campaign },
    abyss: { ...save.abyss, tree: { ...save.abyss.tree } },
    wallet: { ...save.wallet },
    hero: { ...save.hero },
    skills: Object.fromEntries(Object.entries(save.skills).map(([id, value]) => [id, { ...value }])) as IdleRpgSaveState["skills"],
    summons: {
      levels: { ...save.summons.levels },
      unlockedIds: [...save.summons.unlockedIds],
      activeIds: [...save.summons.activeIds],
    },
    items: { ...save.items },
    inventoryOrder: [...save.inventoryOrder],
    equipped: { ...save.equipped },
    settings: { ...save.settings },
    combat: {
      ...save.combat,
      location: cloneLocation(save.combat.location),
      pendingLocation: save.combat.pendingLocation ? cloneLocation(save.combat.pendingLocation) : null,
      enemy: { ...save.combat.enemy },
      summonCooldowns: { ...save.combat.summonCooldowns },
      skillCooldowns: { ...save.combat.skillCooldowns },
    },
    fitness: { ...save.fitness, effectiveStats: { ...save.fitness.effectiveStats } },
    offline: {
      ...save.offline,
      powerSnapshot: { ...save.offline.powerSnapshot, location: cloneLocation(save.offline.powerSnapshot.location) },
      pendingGrant: save.offline.pendingGrant ? { ...save.offline.pendingGrant } : null,
    },
    stats: { ...save.stats },
  };
}

export function createSkillCooldowns(): CombatCheckpoint["skillCooldowns"] {
  return {
    "meridian-rend": 0,
    "seam-step": 0,
    "shard-rain": 0,
    "echo-call": 0,
    "last-meridian": 0,
  };
}

export function createEnemyForLocation(location: EncounterLocation): EnemyCombatState {
  const stagePower = location.kind === "campaign"
    ? Math.max(1, location.stage)
    : CAMPAIGN_STAGE_COUNT + Math.max(1, location.depth) * 2.2 + location.wave * 0.25;
  const descriptor = location.kind === "campaign"
    ? (() => {
      const stage = getStageDefinition(location.stage);
      return { id: stage.enemyId, name: stage.enemyName, kind: stage.kind };
    })()
    : getAbyssEnemy(location.depth, location.wave);
  const kindMultiplier = descriptor.kind === "boss" ? 5.4 : descriptor.kind === "elite" ? 2.35 : 1;
  const growth = boundedPow(1.075, stagePower - 1, 1_000_000_000);
  const maxHp = boundedRound((74 + stagePower * 12) * growth * kindMultiplier, 20);
  const abyssAttackGrowth = location.kind === "abyss" ? boundedPow(1.035, location.depth - 1, 1_000_000) : 1;
  return {
    contentId: descriptor.id,
    name: descriptor.name,
    kind: descriptor.kind,
    hp: maxHp,
    maxHp,
    attack: boundedRound((7 + stagePower * 1.45) * boundedPow(1.045, stagePower - 1, 100_000_000) * Math.sqrt(kindMultiplier) * abyssAttackGrowth, 2),
    defense: boundedRound((1 + stagePower * 0.48) * boundedPow(1.025, stagePower - 1, 100_000_000) * Math.sqrt(kindMultiplier)),
    goldReward: boundedRound((14 + stagePower * 4.4) * kindMultiplier, 1),
    experienceReward: boundedRound((12 + stagePower * 3.2) * kindMultiplier, 1),
    materialReward: descriptor.kind === "boss" ? 7 + Math.floor(stagePower / 8) : descriptor.kind === "elite" ? 3 + Math.floor(stagePower / 12) : Math.floor(stagePower / 16),
  };
}

export function createInitialCombatCheckpoint(location: EncounterLocation = { kind: "campaign", stage: 1 }): CombatCheckpoint {
  return {
    phase: "enemy-entering",
    phaseBeforePause: null,
    phaseRemainingMs: ENEMY_ENTER_MS,
    location: cloneLocation(location),
    pendingLocation: null,
    encounterSerial: 1,
    lastSettledEncounterSerial: 0,
    enemy: createEnemyForLocation(location),
    heroAttackCooldownMs: 350,
    enemyAttackCooldownMs: 900,
    summonCooldowns: {},
    skillCooldowns: createSkillCooldowns(),
    dodgeRemainingMs: 0,
    enemyStaggerRemainingMs: 0,
  };
}

function spawnEncounter(save: IdleRpgSaveState, location: EncounterLocation): { state: IdleRpgSaveState; event: IdleRpgEvent } {
  const state = copyState(save);
  const serial = Math.max(state.combat.encounterSerial, state.combat.lastSettledEncounterSerial) + 1;
  const enemy = createEnemyForLocation(location);
  state.combat = {
    ...state.combat,
    phase: "enemy-entering",
    phaseBeforePause: null,
    phaseRemainingMs: ENEMY_ENTER_MS,
    location: cloneLocation(location),
    pendingLocation: null,
    encounterSerial: serial,
    enemy,
    heroAttackCooldownMs: 300,
    enemyAttackCooldownMs: 900,
    summonCooldowns: Object.fromEntries(state.summons.activeIds.map((id) => [id, 450])),
    dodgeRemainingMs: 0,
    enemyStaggerRemainingMs: 0,
  };
  return { state, event: { type: "spawn", serial, location: cloneLocation(location), enemy: { ...enemy } } };
}

function rollDamage(
  save: IdleRpgSaveState,
  rawAttack: number,
  defense: number,
  critChance: number,
  critMultiplier: number,
): { state: IdleRpgSaveState; damage: number; critical: boolean } {
  const variance = nextRandom(save.rngState);
  const crit = nextRandom(variance.state);
  const critical = crit.value < critChance;
  const damage = Math.max(1, Math.round(Math.max(1, rawAttack - defense * 0.55) * (0.9 + variance.value * 0.2) * (critical ? critMultiplier : 1)));
  return { state: { ...save, rngState: crit.state }, damage, critical };
}

function unlockProgression(save: IdleRpgSaveState, clearedStage: number): IdleRpgSaveState {
  const state = copyState(save);
  for (const skill of SKILLS) {
    if (skill.unlockStage <= clearedStage) state.skills[skill.id].unlocked = true;
  }
  for (const summon of SUMMONS) {
    if (summon.unlockStage <= clearedStage && !state.summons.unlockedIds.includes(summon.id)) {
      state.summons.unlockedIds.push(summon.id);
      if (state.summons.activeIds.length < 3) state.summons.activeIds.push(summon.id);
    }
  }
  return state;
}

function settleEnemy(save: IdleRpgSaveState): { state: IdleRpgSaveState; events: IdleRpgEvent[] } {
  if (save.combat.lastSettledEncounterSerial >= save.combat.encounterSerial) return { state: save, events: [] };
  let state = copyState(save);
  const events: IdleRpgEvent[] = [];
  const enemy = state.combat.enemy;
  const serial = state.combat.encounterSerial;
  const location = cloneLocation(state.combat.location);
  const stats = getHeroCombatStats(state);
  const abundance = 1 + state.abyss.tree.abundance * 0.02 + state.fitness.lootPct;
  const gold = Math.max(0, Math.floor(enemy.goldReward * abundance));
  const experience = Math.max(0, enemy.experienceReward);
  const materials = Math.max(0, Math.floor(enemy.materialReward * Math.min(2, stats.lootMultiplier)));

  state.wallet.gold += gold;
  state.wallet.materials += materials;
  const beforeLevel = state.hero.level;
  const xpResult = applyIdleExperience(state, experience);
  state = xpResult.state;
  state.stats.monstersDefeated += 1;
  if (enemy.kind === "elite") state.stats.elitesDefeated += 1;
  if (enemy.kind === "boss") state.stats.bossesDefeated += 1;
  state.stats.totalGoldEarned += gold;
  state.combat.lastSettledEncounterSerial = serial;

  const drop = rollEquipmentDrop(state.rngState, location, enemy.kind, serial, stats.lootMultiplier);
  state.rngState = drop.rngState;
  let salvagedMaterials = 0;
  if (drop.item) {
    const added = addItemToInventory(state, drop.item);
    state = added.state;
    salvagedMaterials = added.salvagedMaterials;
  }

  let pendingLocation: EncounterLocation | null = null;
  if (location.kind === "campaign") {
    const stage = location.stage;
    state = unlockProgression(state, stage);
    const isFarming = state.campaign.farmingStage === stage;
    if (!isFarming && stage < CAMPAIGN_STAGE_COUNT) {
      const nextStage = stage + 1;
      state.campaign.currentStage = nextStage;
      if (nextStage > state.campaign.highestUnlockedStage) {
        state.campaign.highestUnlockedStage = nextStage;
      }
      state.campaign.farmingStage = null;
      pendingLocation = { kind: "campaign", stage: nextStage };
      if (stage % STAGES_PER_REALM === 0) {
        events.push({ type: "realm-unlocked", realmIndex: (stage / STAGES_PER_REALM) as 1 | 2 | 3 });
      }
    } else if (stage >= CAMPAIGN_STAGE_COUNT && !isFarming) {
      state.campaign.completed = true;
      state.campaign.currentStage = CAMPAIGN_STAGE_COUNT;
      state.abyss.unlocked = true;
      state.abyss.currentDepth = Math.max(1, state.abyss.currentDepth);
      events.push({ type: "abyss-unlocked" });
      pendingLocation = null;
    } else {
      state.campaign.currentStage = stage;
      state.campaign.farmingStage = stage;
      pendingLocation = { kind: "campaign", stage };
    }
  } else if (location.wave < ABYSS_WAVES_PER_DEPTH) {
    pendingLocation = {
      kind: "abyss",
      depth: location.depth,
      wave: (location.wave + 1) as 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
    };
  } else if (state.abyss.mode === "push") {
    const frontierDepth = state.abyss.highestCompletedDepth + 1;
    if (location.depth === frontierDepth) {
      state.abyss.highestCompletedDepth = location.depth;
      state.abyss.currentDepth = location.depth + 1;
      const shardReward = Math.max(1, 2 + Math.floor(location.depth * 0.75));
      state.wallet.abyssShards += shardReward;
      pendingLocation = { kind: "abyss", depth: location.depth + 1, wave: 1 };
    } else {
      // Switching harvest -> push mid-depth may route to the frontier, but it
      // must never repay shards for an already completed depth.
      state.abyss.currentDepth = frontierDepth;
      pendingLocation = { kind: "abyss", depth: frontierDepth, wave: 1 };
    }
  } else {
    const harvestDepth = Math.max(1, state.abyss.highestCompletedDepth);
    state.abyss.currentDepth = harvestDepth;
    pendingLocation = { kind: "abyss", depth: harvestDepth, wave: 1 };
  }

  state.combat.phase = "enemy-dying";
  state.combat.phaseRemainingMs = ENEMY_DEATH_MS;
  state.combat.pendingLocation = pendingLocation;
  state.combat.enemy.hp = 0;
  if (state.hero.level > beforeLevel) {
    state.hero.hp = getHeroCombatStats(state).maxHp;
    for (let level = beforeLevel + 1; level <= state.hero.level; level += 1) events.push({ type: "level-up", level });
  }
  events.unshift(
    { type: "death", actor: "enemy" },
    { type: "encounter-settled", serial, location, gold, experience, materials },
    { type: "loot", item: drop.item, salvagedMaterials },
  );
  return { state, events };
}

function damageEnemy(
  save: IdleRpgSaveState,
  source: "hero" | IdleRpgSummonId,
  rawAttack: number,
  critChance: number,
  critMultiplier: number,
  skillId?: IdleRpgSkillId,
): { state: IdleRpgSaveState; events: IdleRpgEvent[] } {
  const rolled = rollDamage(save, rawAttack, save.combat.enemy.defense, critChance, critMultiplier);
  let state = copyState(rolled.state);
  state.combat.enemy.hp = Math.max(0, state.combat.enemy.hp - rolled.damage);
  state.stats.totalDamageDealt += rolled.damage;
  const events: IdleRpgEvent[] = [{ type: "hit", source, target: "enemy", damage: rolled.damage, critical: rolled.critical, skillId }];
  if (state.combat.enemy.hp <= 0) {
    const settled = settleEnemy(state);
    state = settled.state;
    events.push(...settled.events);
  }
  return { state, events };
}

function getSummonAttack(save: IdleRpgSaveState, summonId: IdleRpgSummonId): number {
  const definition = SUMMONS.find((summon) => summon.id === summonId);
  const level = Math.max(1, save.summons.levels[summonId]);
  return (definition?.baseAttack ?? 1) * (1 + (level - 1) * 0.18) * (1 + save.hero.level * 0.055) * (1 + save.fitness.momentum * 0.15);
}

export function useCombatSkill(save: IdleRpgSaveState, skillId: IdleRpgSkillId): { state: IdleRpgSaveState; events: IdleRpgEvent[]; ok: true } | { state: IdleRpgSaveState; events: []; ok: false; reason: string } {
  const skill = SKILLS.find((entry) => entry.id === skillId);
  if (!skill) return { state: save, events: [], ok: false, reason: "skill-not-found" };
  if (save.combat.phase !== "fighting") return { state: save, events: [], ok: false, reason: "not-fighting" };
  if (!save.skills[skillId].unlocked) return { state: save, events: [], ok: false, reason: "skill-locked" };
  if (save.combat.skillCooldowns[skillId] > 0) return { state: save, events: [], ok: false, reason: "skill-on-cooldown" };
  if (save.hero.mp < skill.manaCost) return { state: save, events: [], ok: false, reason: "insufficient-mana" };

  let state = copyState(save);
  const events: IdleRpgEvent[] = [{ type: "animation-start", actor: "hero", animation: skill.id }];
  state.hero.mp -= skill.manaCost;
  state.combat.skillCooldowns[skillId] = skill.cooldownMs;
  const heroStats = getHeroCombatStats(state);
  const levelMultiplier = 1 + (state.skills[skillId].level - 1) * 0.12;

  if (skillId === "echo-call") {
    for (const summonId of state.summons.activeIds) {
      if (state.combat.phase !== "fighting") break;
      const attack = damageEnemy(state, summonId, getSummonAttack(state, summonId) * 1.8, 0.05, 1.5, skillId);
      state = attack.state;
      events.push({ type: "animation-start", actor: summonId, animation: "skill" }, ...attack.events);
    }
  } else {
    const hitCount = skillId === "shard-rain" ? SHARD_RAIN_HIT_COUNT : 1;
    const rawSkillAttack = heroStats.attack * skill.multiplier * levelMultiplier * heroStats.skillDamageMultiplier;
    for (let hitIndex = 0; hitIndex < hitCount && state.combat.phase === "fighting"; hitIndex += 1) {
      const attack = damageEnemy(
        state,
        "hero",
        rawSkillAttack / hitCount,
        heroStats.critChance,
        heroStats.critMultiplier,
        skillId,
      );
      state = attack.state;
      events.push(...attack.events);
    }
    if (skillId === "seam-step") state.combat.dodgeRemainingMs = Math.max(state.combat.dodgeRemainingMs, 1_200);
    if (skillId === "last-meridian" && state.combat.phase === "fighting") state.combat.enemyStaggerRemainingMs = Math.max(state.combat.enemyStaggerRemainingMs, 2_000);
  }
  return { state, events, ok: true };
}

function chooseAutoSkill(save: IdleRpgSaveState): IdleRpgSkillId | null {
  const heroStats = getHeroCombatStats(save);
  const ready = SKILLS.filter((skill) => save.skills[skill.id].unlocked
    && save.combat.skillCooldowns[skill.id] <= 0
    && save.hero.mp >= skill.manaCost);
  if (ready.length === 0) return null;
  if (save.combat.enemy.kind === "boss") {
    return (ready.find((skill) => skill.isUltimate) ?? [...ready].sort((a, b) => b.multiplier - a.multiplier)[0]).id;
  }
  if (save.hero.mp / Math.max(1, heroStats.maxMp) < 0.3) {
    return ready.find((skill) => !skill.isUltimate && skill.manaCost <= 16)?.id ?? null;
  }
  return ready.find((skill) => skill.id === "echo-call" && save.summons.activeIds.length > 0)?.id
    ?? ready.find((skill) => !skill.isUltimate)?.id
    ?? null;
}

function beginHeroDeath(save: IdleRpgSaveState): { state: IdleRpgSaveState; events: IdleRpgEvent[] } {
  const state = copyState(save);
  state.hero.hp = 0;
  state.combat.phase = "hero-dying";
  state.combat.phaseRemainingMs = HERO_DEATH_MS;
  if (state.combat.location.kind === "abyss" && state.abyss.mode === "push") {
    state.abyss.mode = "harvest";
    if (state.abyss.highestCompletedDepth > 0) {
      const depth = state.abyss.highestCompletedDepth;
      state.abyss.currentDepth = depth;
      state.combat.pendingLocation = { kind: "abyss", depth, wave: 1 };
    } else {
      state.combat.pendingLocation = { kind: "campaign", stage: CAMPAIGN_STAGE_COUNT };
    }
  } else {
    state.combat.pendingLocation = cloneLocation(state.combat.location);
  }
  return { state, events: [{ type: "death", actor: "hero" }] };
}

function stepTransition(save: IdleRpgSaveState): { state: IdleRpgSaveState; events: IdleRpgEvent[] } {
  let state = copyState(save);
  state.combat.phaseRemainingMs = Math.max(0, state.combat.phaseRemainingMs - IDLE_RPG_FIXED_STEP_MS);
  if (state.combat.phaseRemainingMs > 0) return { state, events: [] };

  if (state.combat.phase === "enemy-entering") {
    state.combat.phase = "fighting";
    return { state, events: [{ type: "animation-start", actor: "enemy", animation: "idle" }] };
  }
  if (state.combat.phase === "enemy-dying") {
    const next = state.combat.pendingLocation;
    if (!next) {
      state.combat.phase = "campaign-complete";
      return { state, events: [] };
    }
    const from = cloneLocation(state.combat.location);
    const wasRealmBoss = from.kind === "campaign" && from.stage % STAGES_PER_REALM === 0;
    const wasAbyssBoss = from.kind === "abyss" && from.wave === ABYSS_WAVES_PER_DEPTH;
    state.combat.phase = wasRealmBoss ? "realm-clear" : wasAbyssBoss ? "abyss-depth-clear" : "marching";
    state.combat.phaseRemainingMs = MARCH_MS;
    return { state, events: [{ type: "march", from, to: cloneLocation(next) }] };
  }
  if (state.combat.phase === "marching" || state.combat.phase === "realm-clear" || state.combat.phase === "abyss-depth-clear") {
    const next = state.combat.pendingLocation;
    if (!next) return { state, events: [] };
    const spawned = spawnEncounter(state, next);
    return { state: spawned.state, events: [spawned.event] };
  }
  if (state.combat.phase === "hero-dying") {
    state.combat.phase = "respawning";
    state.combat.phaseRemainingMs = RESPAWN_MS;
    return { state, events: [] };
  }
  if (state.combat.phase === "respawning") {
    const stats = getHeroCombatStats(state);
    state.hero.hp = Math.max(1, Math.round(stats.maxHp * 0.65));
    state.hero.mp = Math.max(0, Math.round(stats.maxMp * 0.5));
    const spawned = spawnEncounter(state, state.combat.pendingLocation ?? state.combat.location);
    return { state: spawned.state, events: [spawned.event] };
  }
  return { state, events: [] };
}

export function stepCombat(save: IdleRpgSaveState): { state: IdleRpgSaveState; events: IdleRpgEvent[] } {
  if (save.combat.phase === "paused" || save.combat.phase === "loading" || save.combat.phase === "campaign-complete") {
    return { state: save, events: [] };
  }
  if (save.combat.phase !== "fighting") return stepTransition(save);

  let state = copyState(save);
  const events: IdleRpgEvent[] = [];
  const combatMs = IDLE_RPG_FIXED_STEP_MS * state.settings.battleSpeed;
  const stats = getHeroCombatStats(state);
  state.combat.heroAttackCooldownMs -= combatMs;
  state.combat.enemyAttackCooldownMs -= combatMs;
  state.combat.dodgeRemainingMs = Math.max(0, state.combat.dodgeRemainingMs - combatMs);
  state.combat.enemyStaggerRemainingMs = Math.max(0, state.combat.enemyStaggerRemainingMs - combatMs);
  for (const skillId of SKILL_IDS) state.combat.skillCooldowns[skillId] = Math.max(0, state.combat.skillCooldowns[skillId] - combatMs);
  for (const summonId of state.summons.activeIds) {
    state.combat.summonCooldowns[summonId] = (state.combat.summonCooldowns[summonId] ?? 0) - combatMs;
  }
  state.hero.hp = Math.min(stats.maxHp, state.hero.hp + stats.hpRegenPerSecond * combatMs / 1_000);
  state.hero.mp = Math.min(stats.maxMp, state.hero.mp + stats.mpRegenPerSecond * combatMs / 1_000);

  if (state.settings.autoBattle) {
    const skillId = chooseAutoSkill(state);
    if (skillId) {
      const skill = useCombatSkill(state, skillId);
      state = skill.state;
      events.push(...skill.events);
    }
  }

  if (state.combat.phase === "fighting" && state.combat.heroAttackCooldownMs <= 0) {
    const attack = damageEnemy(state, "hero", stats.attack, stats.critChance, stats.critMultiplier);
    state = attack.state;
    state.combat.heroAttackCooldownMs += stats.attackIntervalMs;
    events.push({ type: "animation-start", actor: "hero", animation: "attack" }, ...attack.events);
  }

  for (const summonId of state.summons.activeIds) {
    if (state.combat.phase !== "fighting") break;
    if ((state.combat.summonCooldowns[summonId] ?? 0) > 0) continue;
    const definition = SUMMONS.find((summon) => summon.id === summonId);
    const attack = damageEnemy(state, summonId, getSummonAttack(state, summonId), 0.05, 1.5);
    state = attack.state;
    state.combat.summonCooldowns[summonId] = definition?.attackIntervalMs ?? 1_500;
    events.push({ type: "animation-start", actor: summonId, animation: "attack" }, ...attack.events);
  }

  if (state.combat.phase === "fighting" && state.combat.enemyAttackCooldownMs <= 0) {
    state.combat.enemyAttackCooldownMs += Math.max(600, 1_650 - Math.min(500, state.combat.enemy.attack * 1.2));
    if (state.combat.enemyStaggerRemainingMs <= 0 && state.combat.dodgeRemainingMs <= 0) {
      const rolled = rollDamage(state, state.combat.enemy.attack, stats.defense, 0.04, 1.5);
      state = copyState(rolled.state);
      state.hero.hp = Math.max(0, state.hero.hp - rolled.damage);
      events.push(
        { type: "animation-start", actor: "enemy", animation: "attack" },
        { type: "hit", source: "enemy", target: "hero", damage: rolled.damage, critical: rolled.critical },
      );
      if (state.hero.hp <= 0) {
        const death = beginHeroDeath(state);
        state = death.state;
        events.push(...death.events);
      }
    }
  }
  return { state, events };
}

export function startCampaignEncounter(
  save: IdleRpgSaveState,
  stage: number,
  mode?: "advance" | "farm",
): { ok: true; state: IdleRpgSaveState; events: IdleRpgEvent[] } | { ok: false; reason: string } {
  const selected = Math.floor(stage);
  if (!Number.isFinite(selected) || selected < 1 || selected > save.campaign.highestUnlockedStage || selected > CAMPAIGN_STAGE_COUNT) {
    return { ok: false, reason: "stage-locked" };
  }
  const state = copyState(save);
  state.campaign.currentStage = selected;
  const isFarm = mode === "farm" || (mode === undefined && save.campaign.completed);
  state.campaign.farmingStage = isFarm ? selected : null;
  const spawned = spawnEncounter(state, { kind: "campaign", stage: selected });
  return { ok: true, state: spawned.state, events: [spawned.event] };
}

export function startAbyssEncounter(save: IdleRpgSaveState, mode = save.abyss.mode): { ok: true; state: IdleRpgSaveState; events: IdleRpgEvent[] } | { ok: false; reason: string } {
  if (!save.abyss.unlocked) return { ok: false, reason: "abyss-locked" };
  if (mode === "harvest" && save.abyss.highestCompletedDepth < 1) return { ok: false, reason: "no-completed-abyss-depth" };
  const state = copyState(save);
  state.abyss.mode = mode;
  const depth = mode === "push"
    ? Math.max(1, state.abyss.highestCompletedDepth + 1)
    : Math.max(1, state.abyss.highestCompletedDepth);
  state.abyss.currentDepth = depth;
  const spawned = spawnEncounter(state, { kind: "abyss", depth, wave: 1 });
  return { ok: true, state: spawned.state, events: [spawned.event] };
}
