import { CAMPAIGN_STAGE_COUNT, SKILLS, SUMMONS } from "./content";
import {
  ENEMY_DEATH_MS,
  ENEMY_ENTER_MS,
  HERO_DEATH_MS,
  MARCH_MS,
  RESPAWN_MS,
  createEnemyForLocation,
  createInitialCombatCheckpoint,
  createSkillCooldowns,
} from "./combatMachine";
import { getHeroCombatStats } from "./economy";
import { MAX_OFFLINE_SECONDS, MIN_OFFLINE_SECONDS, createOfflinePowerSnapshot } from "./offline";
import { normalizeSeed } from "./rng";
import {
  IDLE_RPG_BACKUP_KEY,
  IDLE_RPG_LEGACY_KEY,
  IDLE_RPG_SAVE_KEY,
  IDLE_RPG_SCHEMA_VERSION,
  type CombatPhase,
  type EncounterLocation,
  type FitnessSnapshot,
  type IdleRpgEquipmentSlot,
  type IdleRpgItem,
  type IdleRpgRarity,
  type IdleRpgSaveRepository,
  type IdleRpgSaveState,
  type IdleRpgSkillId,
  type IdleRpgSummonId,
  type OfflineGrant,
  type OfflinePowerSnapshot,
  type StorageLike,
} from "./types";

const SLOTS: readonly IdleRpgEquipmentSlot[] = ["weapon", "armor", "gloves", "boots", "relic"];
const RARITIES: readonly IdleRpgRarity[] = ["common", "rare", "epic", "legendary"];
const PHASES: readonly CombatPhase[] = [
  "loading", "enemy-entering", "fighting", "enemy-dying", "marching", "realm-clear",
  "hero-dying", "respawning", "campaign-complete", "abyss-depth-clear", "paused",
];
const MAX_NORMALIZED_ENCOUNTER_SERIAL = Math.floor(Number.MAX_SAFE_INTEGER / 2);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function finite(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function integer(value: unknown, fallback: number, min: number, max = Number.MAX_SAFE_INTEGER): number {
  return Math.max(min, Math.min(max, Math.floor(finite(value, fallback))));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function normalizeLocation(value: unknown, fallback: EncounterLocation): EncounterLocation {
  const source = record(value);
  if (source.kind === "abyss") {
    return {
      kind: "abyss",
      depth: integer(source.depth, fallback.kind === "abyss" ? fallback.depth : 1, 1, 1_000_000),
      wave: integer(source.wave, fallback.kind === "abyss" ? fallback.wave : 1, 1, 10) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
    };
  }
  return {
    kind: "campaign",
    stage: integer(source.stage, fallback.kind === "campaign" ? fallback.stage : 1, 1, CAMPAIGN_STAGE_COUNT),
  };
}

function isStructurallyValidLocation(value: unknown): boolean {
  const source = record(value);
  if (source.kind === "campaign") {
    return typeof source.stage === "number"
      && Number.isInteger(source.stage)
      && source.stage >= 1
      && source.stage <= CAMPAIGN_STAGE_COUNT;
  }
  if (source.kind === "abyss") {
    return typeof source.depth === "number"
      && Number.isInteger(source.depth)
      && source.depth >= 1
      && source.depth <= 1_000_000
      && typeof source.wave === "number"
      && Number.isInteger(source.wave)
      && source.wave >= 1
      && source.wave <= 10;
  }
  return false;
}

function locationsEqual(left: EncounterLocation, right: EncounterLocation): boolean {
  if (left.kind !== right.kind) return false;
  return left.kind === "campaign"
    ? left.stage === (right as Extract<EncounterLocation, { kind: "campaign" }>).stage
    : left.depth === (right as Extract<EncounterLocation, { kind: "abyss" }>).depth
      && left.wave === (right as Extract<EncounterLocation, { kind: "abyss" }>).wave;
}

function hasExpectedSettledDestination(save: IdleRpgSaveState): boolean {
  const { location, pendingLocation } = save.combat;
  if (location.kind === "campaign") {
    if (!pendingLocation) {
      return save.campaign.completed && location.stage === CAMPAIGN_STAGE_COUNT;
    }
    if (pendingLocation.kind !== "campaign") return false;
    if (pendingLocation.stage === location.stage) return true;
    return !save.campaign.completed
      && location.stage < CAMPAIGN_STAGE_COUNT
      && pendingLocation.stage === location.stage + 1
      && save.campaign.highestUnlockedStage >= pendingLocation.stage
      && save.campaign.currentStage === pendingLocation.stage;
  }

  if (!pendingLocation || pendingLocation.kind !== "abyss") return false;
  if (location.wave < 10) {
    return pendingLocation.depth === location.depth && pendingLocation.wave === location.wave + 1;
  }
  return pendingLocation.wave === 1 && pendingLocation.depth === save.abyss.currentDepth;
}

function hasExpectedRespawnDestination(save: IdleRpgSaveState): boolean {
  const { location, pendingLocation } = save.combat;
  if (!pendingLocation) return false;
  if (location.kind === "campaign") return locationsEqual(location, pendingLocation);
  if (locationsEqual(location, pendingLocation)) return true;
  if (save.abyss.highestCompletedDepth > 0) {
    return pendingLocation.kind === "abyss"
      && pendingLocation.depth === save.abyss.highestCompletedDepth
      && pendingLocation.wave === 1;
  }
  return save.campaign.completed
    && pendingLocation.kind === "campaign"
    && pendingLocation.stage === CAMPAIGN_STAGE_COUNT;
}

function isCoherentCombatCheckpoint(save: IdleRpgSaveState): boolean {
  const checkpoint = save.combat;
  if (checkpoint.phase === "paused" && !checkpoint.phaseBeforePause) return false;
  const phase = checkpoint.phase === "paused" ? checkpoint.phaseBeforePause : checkpoint.phase;
  if (!phase || phase === "loading") return false;

  const encounterIsSettled = checkpoint.lastSettledEncounterSerial === checkpoint.encounterSerial;
  const encounterIsActive = checkpoint.lastSettledEncounterSerial < checkpoint.encounterSerial;
  if (phase === "enemy-entering" || phase === "fighting") {
    return encounterIsActive && checkpoint.enemy.hp > 0;
  }
  if (phase === "enemy-dying") {
    return encounterIsSettled && checkpoint.enemy.hp === 0 && hasExpectedSettledDestination(save);
  }
  if (phase === "marching" || phase === "realm-clear" || phase === "abyss-depth-clear") {
    if (!encounterIsSettled || checkpoint.enemy.hp !== 0 || !checkpoint.pendingLocation || !hasExpectedSettledDestination(save)) return false;
    if (phase === "realm-clear") return checkpoint.location.kind === "campaign" && checkpoint.location.stage % 12 === 0;
    if (phase === "abyss-depth-clear") return checkpoint.location.kind === "abyss" && checkpoint.location.wave === 10;
    return checkpoint.location.kind === "campaign"
      ? checkpoint.location.stage % 12 !== 0
      : checkpoint.location.wave !== 10;
  }
  if (phase === "hero-dying" || phase === "respawning") {
    return encounterIsActive && hasExpectedRespawnDestination(save);
  }
  if (phase === "campaign-complete") {
    return save.campaign.completed
      && checkpoint.location.kind === "campaign"
      && checkpoint.location.stage === CAMPAIGN_STAGE_COUNT
      && encounterIsSettled
      && checkpoint.enemy.hp === 0
      && checkpoint.pendingLocation === null;
  }
  return false;
}

function maxPhaseRemainingMs(phase: CombatPhase, phaseBeforePause: Exclude<CombatPhase, "paused"> | null): number {
  const effectivePhase = phase === "paused" ? phaseBeforePause ?? "enemy-entering" : phase;
  if (effectivePhase === "enemy-entering") return ENEMY_ENTER_MS;
  if (effectivePhase === "enemy-dying") return ENEMY_DEATH_MS;
  if (effectivePhase === "marching" || effectivePhase === "realm-clear" || effectivePhase === "abyss-depth-clear") return MARCH_MS;
  if (effectivePhase === "hero-dying") return HERO_DEATH_MS;
  if (effectivePhase === "respawning") return RESPAWN_MS;
  return 0;
}

function recoverCombatCheckpoint(save: IdleRpgSaveState): IdleRpgSaveState {
  const wasPaused = save.combat.phase === "paused";
  const lastSettledEncounterSerial = save.combat.lastSettledEncounterSerial;
  const encounterSerial = Math.max(save.combat.encounterSerial, lastSettledEncounterSerial) + 1;
  const fresh = createInitialCombatCheckpoint(save.combat.location);
  fresh.encounterSerial = encounterSerial;
  fresh.lastSettledEncounterSerial = lastSettledEncounterSerial;
  fresh.skillCooldowns = { ...save.combat.skillCooldowns };
  fresh.summonCooldowns = Object.fromEntries(save.summons.activeIds.map((id) => [id, 450]));
  if (wasPaused) {
    fresh.phase = "paused";
    fresh.phaseBeforePause = "enemy-entering";
  }
  return { ...save, combat: fresh };
}

function normalizePendingGrant(
  value: unknown,
  lastClaimedGrantId: string | null,
  lastActiveAt: number,
  nowMs: number,
  power: OfflinePowerSnapshot,
): OfflineGrant | null {
  const source = record(value);
  const rawId = typeof source.id === "string" && source.id.length > 0 ? source.id : null;
  if (!rawId || rawId === lastClaimedGrantId) return null;

  const rawFromMs = Number(source.fromMs);
  const rawToMs = Number(source.toMs);
  if (!Number.isFinite(rawFromMs) || !Number.isFinite(rawToMs)) return null;
  const fromMs = Math.floor(rawFromMs);
  const toMs = Math.floor(rawToMs);
  if (fromMs < 0 || toMs < fromMs || toMs > nowMs || fromMs !== lastActiveAt) return null;

  const elapsedSeconds = Math.floor((toMs - fromMs) / 1_000);
  if (elapsedSeconds < MIN_OFFLINE_SECONDS) return null;
  const cappedSeconds = Math.min(MAX_OFFLINE_SECONDS, elapsedSeconds);
  const id = `afk-${fromMs}-${toMs}`;
  if (id === lastClaimedGrantId) return null;
  const safeReward = (value: number) => Number.isFinite(value)
    ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value)))
    : 0;
  return {
    id,
    fromMs,
    toMs,
    elapsedSeconds,
    cappedSeconds,
    gold: safeReward(cappedSeconds / 60 * power.goldPerMinute),
    experience: safeReward(cappedSeconds / 60 * power.experiencePerMinute),
    materials: safeReward(cappedSeconds / 3_600 * power.materialsPerHour),
  };
}

function claimedPendingEnd(
  value: unknown,
  lastClaimedGrantId: string | null,
  nowMs: number,
): number | null {
  if (!lastClaimedGrantId) return null;
  const source = record(value);
  const rawId = typeof source.id === "string" && source.id.length > 0 ? source.id : null;
  const rawFromMs = Number(source.fromMs);
  const rawToMs = Number(source.toMs);
  if (!rawId || !Number.isFinite(rawFromMs) || !Number.isFinite(rawToMs)) return null;
  const fromMs = Math.floor(rawFromMs);
  const toMs = Math.floor(rawToMs);
  if (fromMs < 0 || toMs < fromMs || toMs > nowMs) return null;
  const canonicalId = `afk-${fromMs}-${toMs}`;
  return rawId === lastClaimedGrantId || canonicalId === lastClaimedGrantId ? toMs : null;
}

function normalizeFitness(value: unknown, fallback: FitnessSnapshot): FitnessSnapshot {
  const source = record(value);
  const stats = record(source.effectiveStats);
  const clamp = (candidate: unknown, base: number, max = Number.MAX_SAFE_INTEGER) => Math.max(0, Math.min(max, finite(candidate, base)));
  return {
    capturedAt: integer(source.capturedAt, fallback.capturedAt, 0),
    effectiveStats: {
      STR: clamp(stats.STR, fallback.effectiveStats.STR),
      VITALITY: clamp(stats.VITALITY, fallback.effectiveStats.VITALITY),
      AGILITY: clamp(stats.AGILITY, fallback.effectiveStats.AGILITY),
      INTELLIGENCE: clamp(stats.INTELLIGENCE, fallback.effectiveStats.INTELLIGENCE),
      SENSE: clamp(stats.SENSE, fallback.effectiveStats.SENSE),
    },
    dailyRatio: clamp(source.dailyRatio, fallback.dailyRatio, 1),
    weeklyLoad: clamp(source.weeklyLoad, fallback.weeklyLoad, 1),
    momentum: clamp(source.momentum, fallback.momentum, 1),
    weeklyMinutes: clamp(source.weeklyMinutes, fallback.weeklyMinutes),
    weeklySets: clamp(source.weeklySets, fallback.weeklySets),
    weeklyVolumeKg: clamp(source.weeklyVolumeKg, fallback.weeklyVolumeKg),
    attackPct: clamp(source.attackPct, fallback.attackPct, 1.5),
    maxHpPct: clamp(source.maxHpPct, fallback.maxHpPct, 2),
    regenPct: clamp(source.regenPct, fallback.regenPct, 1),
    hastePct: clamp(source.hastePct, fallback.hastePct, 0.55),
    critChance: clamp(source.critChance, fallback.critChance, 0.35),
    skillDamagePct: clamp(source.skillDamagePct, fallback.skillDamagePct, 1.75),
    lootPct: clamp(source.lootPct, fallback.lootPct, 0.75),
    offlineEfficiencyPct: clamp(source.offlineEfficiencyPct, fallback.offlineEfficiencyPct, 1),
  };
}

export function createDefaultIdleRpgSave(nowMs: number, fitness: FitnessSnapshot, seed = 0x6d2b79f5): IdleRpgSaveState {
  const combat = createInitialCombatCheckpoint({ kind: "campaign", stage: 1 });
  const skills = Object.fromEntries(SKILLS.map((skill) => [skill.id, { level: 1, unlocked: skill.unlockStage <= 1 }])) as IdleRpgSaveState["skills"];
  const summonLevels = Object.fromEntries(SUMMONS.map((summon) => [summon.id, 1])) as IdleRpgSaveState["summons"]["levels"];
  let save: IdleRpgSaveState = {
    schemaVersion: IDLE_RPG_SCHEMA_VERSION,
    createdAt: nowMs,
    updatedAt: nowMs,
    rngState: normalizeSeed(seed),
    campaign: { currentStage: 1, highestUnlockedStage: 1, completed: false, farmingStage: null },
    abyss: {
      unlocked: false,
      mode: "push",
      currentDepth: 1,
      highestCompletedDepth: 0,
      tree: { power: 0, protection: 0, tempo: 0, abundance: 0 },
    },
    wallet: { gold: 0, experience: 0, materials: 0, abyssShards: 0 },
    hero: { level: 1, experience: 0, hp: 1, mp: 1 },
    skills,
    summons: { levels: summonLevels, unlockedIds: ["meridian-fang"], activeIds: ["meridian-fang"] },
    items: {},
    inventoryOrder: [],
    equipped: { weapon: null, armor: null, gloves: null, boots: null, relic: null },
    settings: { autoBattle: true, battleSpeed: 1 },
    combat,
    fitness: normalizeFitness(fitness, fitness),
    offline: {
      lastActiveAt: nowMs,
      powerSnapshot: {
        capturedAt: nowMs,
        location: { kind: "campaign", stage: 1 },
        goldPerMinute: 1,
        experiencePerMinute: 1,
        materialsPerHour: 1,
        efficiency: 1,
      },
      pendingGrant: null,
      lastClaimedGrantId: null,
    },
    stats: { monstersDefeated: 0, elitesDefeated: 0, bossesDefeated: 0, totalGoldEarned: 0, totalDamageDealt: 0 },
  };
  const hero = getHeroCombatStats(save);
  save = { ...save, hero: { ...save.hero, hp: hero.maxHp, mp: hero.maxMp } };
  save.offline.powerSnapshot = createOfflinePowerSnapshot(save, nowMs);
  return save;
}

function normalizeItem(value: unknown, id: string): IdleRpgItem | null {
  const source = record(value);
  const slot = SLOTS.includes(source.slot as IdleRpgEquipmentSlot) ? source.slot as IdleRpgEquipmentSlot : null;
  const rarity = RARITIES.includes(source.rarity as IdleRpgRarity) ? source.rarity as IdleRpgRarity : null;
  if (!slot || !rarity) return null;
  return {
    id,
    name: stringValue(source.name, "Nieznany przedmiot"),
    slot,
    rarity,
    upgradeLevel: integer(source.upgradeLevel, 0, 0, 10),
    attack: integer(source.attack, 0, 0, 1_000_000_000),
    defense: integer(source.defense, 0, 0, 1_000_000_000),
    hp: integer(source.hp, 0, 0, 1_000_000_000),
    critChance: Math.max(0, Math.min(0.25, finite(source.critChance, 0))),
  };
}

export function normalizeIdleRpgSave(raw: unknown, nowMs: number, fallbackFitness: FitnessSnapshot, seed?: number): IdleRpgSaveState | null {
  const source = record(raw);
  if (source.schemaVersion !== IDLE_RPG_SCHEMA_VERSION) return null;
  const defaults = createDefaultIdleRpgSave(nowMs, fallbackFitness, seed);
  const campaign = record(source.campaign);
  const abyss = record(source.abyss);
  const tree = record(abyss.tree);
  const wallet = record(source.wallet);
  const hero = record(source.hero);
  const skillsSource = record(source.skills);
  const summonsSource = record(source.summons);
  const levelsSource = record(summonsSource.levels);
  const settings = record(source.settings);
  const stats = record(source.stats);
  const highestStage = integer(campaign.highestUnlockedStage, 1, 1, CAMPAIGN_STAGE_COUNT);
  const completed = bool(campaign.completed, false) && highestStage >= CAMPAIGN_STAGE_COUNT;
  const clearedStage = completed ? CAMPAIGN_STAGE_COUNT : Math.max(1, highestStage - 1);
  const currentStage = integer(campaign.currentStage, 1, 1, highestStage);
  const highestCompletedDepth = integer(abyss.highestCompletedDepth, 0, 0, 999_999);
  const abyssMode = abyss.mode === "harvest" && highestCompletedDepth > 0 ? "harvest" : "push";
  const sanitizeLocation = (value: unknown, fallback: EncounterLocation): EncounterLocation => {
    const candidate = normalizeLocation(value, fallback);
    if (candidate.kind === "campaign") {
      return { kind: "campaign", stage: Math.min(candidate.stage, highestStage) };
    }
    if (!completed) return { kind: "campaign", stage: currentStage };
    const maxDepth = abyssMode === "push" ? highestCompletedDepth + 1 : Math.max(1, highestCompletedDepth);
    return { ...candidate, depth: Math.min(candidate.depth, Math.max(1, maxDepth)) };
  };
  const fitness = normalizeFitness(source.fitness, fallbackFitness);

  const itemsSource = record(source.items);
  const allItems: Record<string, IdleRpgItem> = {};
  for (const [id, candidate] of Object.entries(itemsSource)) {
    const normalized = normalizeItem(candidate, id);
    if (normalized) allItems[id] = normalized;
  }
  const inventoryOrder = [...new Set(Array.isArray(source.inventoryOrder) ? source.inventoryOrder.filter((id): id is string => typeof id === "string") : [])]
    .filter((id) => Boolean(allItems[id]))
    .slice(0, 100);
  const items = Object.fromEntries(inventoryOrder.map((id) => [id, allItems[id]]));
  const equippedSource = record(source.equipped);
  const equipped = Object.fromEntries(SLOTS.map((slot) => {
    const itemId = typeof equippedSource[slot] === "string" ? equippedSource[slot] as string : null;
    return [slot, itemId && items[itemId]?.slot === slot ? itemId : null];
  })) as IdleRpgSaveState["equipped"];

  const unlockedIds = SUMMONS
    .filter((summon) => summon.unlockStage <= clearedStage)
    .map((summon) => summon.id);
  const activeIds = [...new Set(Array.isArray(summonsSource.activeIds) ? summonsSource.activeIds : [])]
    .filter((id): id is IdleRpgSummonId => unlockedIds.includes(id as IdleRpgSummonId))
    .slice(0, 3);
  if (activeIds.length === 0) activeIds.push("meridian-fang");

  const combatSource = record(source.combat);
  const location = sanitizeLocation(combatSource.location, { kind: "campaign", stage: currentStage });
  const generatedEnemy = createEnemyForLocation(location);
  const enemySource = record(combatSource.enemy);
  const phase = PHASES.includes(combatSource.phase as CombatPhase) ? combatSource.phase as CombatPhase : "enemy-entering";
  const beforePause = PHASES.includes(combatSource.phaseBeforePause as CombatPhase) && combatSource.phaseBeforePause !== "paused"
    ? combatSource.phaseBeforePause as Exclude<CombatPhase, "paused">
    : null;
  const pendingLocationSource = record(combatSource.pendingLocation);
  const pendingLocation = isStructurallyValidLocation(combatSource.pendingLocation)
    && !(pendingLocationSource.kind === "abyss" && !completed)
    ? sanitizeLocation(combatSource.pendingLocation, location)
    : null;
  const skillCooldownSource = record(combatSource.skillCooldowns);
  const cooldowns = createSkillCooldowns();
  for (const skill of SKILLS) cooldowns[skill.id] = Math.max(0, finite(skillCooldownSource[skill.id], 0));
  const summonCooldownSource = record(combatSource.summonCooldowns);

  const offlineSource = record(source.offline);
  const powerSource = record(offlineSource.powerSnapshot);
  const pendingSource = record(offlineSource.pendingGrant);
  let lastActiveAt = integer(offlineSource.lastActiveAt, nowMs, 0);
  const powerCapturedAt = integer(powerSource.capturedAt, Math.min(lastActiveAt, nowMs), 0, Math.max(0, nowMs));
  const lastClaimedGrantId = typeof offlineSource.lastClaimedGrantId === "string" && offlineSource.lastClaimedGrantId.length > 0
    ? offlineSource.lastClaimedGrantId
    : null;
  const claimedThrough = claimedPendingEnd(pendingSource, lastClaimedGrantId, nowMs);
  if (claimedThrough != null) lastActiveAt = Math.max(lastActiveAt, claimedThrough);
  let save: IdleRpgSaveState = {
    schemaVersion: IDLE_RPG_SCHEMA_VERSION,
    createdAt: integer(source.createdAt, nowMs, 0),
    updatedAt: integer(source.updatedAt, nowMs, 0),
    rngState: normalizeSeed(finite(source.rngState, seed ?? defaults.rngState)),
    campaign: {
      currentStage,
      highestUnlockedStage: highestStage,
      completed,
      farmingStage: campaign.farmingStage == null ? null : integer(campaign.farmingStage, 1, 1, Math.max(1, highestStage - (completed ? 0 : 1))),
    },
    abyss: {
      unlocked: completed,
      mode: abyssMode,
      currentDepth: Math.min(integer(abyss.currentDepth, 1, 1, 1_000_000), Math.max(1, highestCompletedDepth + 1)),
      highestCompletedDepth,
      tree: {
        power: integer(tree.power, 0, 0, 10_000),
        protection: integer(tree.protection, 0, 0, 10_000),
        tempo: integer(tree.tempo, 0, 0, 10_000),
        abundance: integer(tree.abundance, 0, 0, 10_000),
      },
    },
    wallet: {
      gold: integer(wallet.gold, 0, 0),
      experience: integer(wallet.experience, 0, 0),
      materials: integer(wallet.materials, 0, 0),
      abyssShards: integer(wallet.abyssShards, 0, 0),
    },
    hero: {
      level: integer(hero.level, 1, 1, 1_000_000),
      experience: integer(hero.experience, 0, 0),
      hp: Math.max(0, finite(hero.hp, 1)),
      mp: Math.max(0, finite(hero.mp, 1)),
    },
    skills: Object.fromEntries(SKILLS.map((skill) => {
      const entry = record(skillsSource[skill.id]);
      return [skill.id, { level: integer(entry.level, 1, 1, 100), unlocked: skill.unlockStage <= clearedStage }];
    })) as Record<IdleRpgSkillId, { level: number; unlocked: boolean }>,
    summons: {
      levels: Object.fromEntries(SUMMONS.map((summon) => [summon.id, integer(levelsSource[summon.id], 1, 1, 10_000)])) as Record<IdleRpgSummonId, number>,
      unlockedIds,
      activeIds,
    },
    items,
    inventoryOrder,
    equipped,
    settings: { autoBattle: bool(settings.autoBattle, true), battleSpeed: settings.battleSpeed === 2 ? 2 : 1 },
    combat: {
      phase,
      phaseBeforePause: phase === "paused" ? beforePause : null,
      phaseRemainingMs: Math.max(0, Math.min(
        maxPhaseRemainingMs(phase, phase === "paused" ? beforePause : null),
        finite(combatSource.phaseRemainingMs, maxPhaseRemainingMs(phase, phase === "paused" ? beforePause : null)),
      )),
      location,
      pendingLocation,
      encounterSerial: integer(combatSource.encounterSerial, 1, 1, MAX_NORMALIZED_ENCOUNTER_SERIAL),
      lastSettledEncounterSerial: integer(combatSource.lastSettledEncounterSerial, 0, 0, MAX_NORMALIZED_ENCOUNTER_SERIAL),
      enemy: {
        ...generatedEnemy,
        hp: Math.max(0, Math.min(generatedEnemy.maxHp, finite(enemySource.hp, generatedEnemy.hp))),
      },
      heroAttackCooldownMs: finite(combatSource.heroAttackCooldownMs, 350),
      enemyAttackCooldownMs: finite(combatSource.enemyAttackCooldownMs, 900),
      summonCooldowns: Object.fromEntries(activeIds.map((id) => [id, finite(summonCooldownSource[id], 0)])),
      skillCooldowns: cooldowns,
      dodgeRemainingMs: Math.max(0, finite(combatSource.dodgeRemainingMs, 0)),
      enemyStaggerRemainingMs: Math.max(0, finite(combatSource.enemyStaggerRemainingMs, 0)),
    },
    fitness,
    offline: {
      lastActiveAt,
      powerSnapshot: {
        capturedAt: powerCapturedAt,
        location: sanitizeLocation(powerSource.location, location),
        goldPerMinute: integer(powerSource.goldPerMinute, 1, 0),
        experiencePerMinute: integer(powerSource.experiencePerMinute, 1, 0),
        materialsPerHour: integer(powerSource.materialsPerHour, 1, 0),
        efficiency: Math.max(0, Math.min(2, finite(powerSource.efficiency, 1))),
      },
      pendingGrant: null,
      lastClaimedGrantId,
    },
    stats: {
      monstersDefeated: integer(stats.monstersDefeated, 0, 0),
      elitesDefeated: integer(stats.elitesDefeated, 0, 0),
      bossesDefeated: integer(stats.bossesDefeated, 0, 0),
      totalGoldEarned: integer(stats.totalGoldEarned, 0, 0),
      totalDamageDealt: integer(stats.totalDamageDealt, 0, 0),
    },
  };
  const heroStats = getHeroCombatStats(save);
  save.hero.hp = Math.min(save.hero.hp, heroStats.maxHp);
  save.hero.mp = Math.min(save.hero.mp, heroStats.maxMp);
  const checkpointWasRecovered = !isCoherentCombatCheckpoint(save);
  if (checkpointWasRecovered) {
    save = recoverCombatCheckpoint(save);
    if (save.hero.hp <= 0) save.hero.hp = Math.max(1, Math.round(heroStats.maxHp * 0.65));
  }
  save.offline.powerSnapshot = createOfflinePowerSnapshot(save, powerCapturedAt);
  save.offline.pendingGrant = normalizePendingGrant(
    pendingSource,
    lastClaimedGrantId,
    lastActiveAt,
    nowMs,
    save.offline.powerSnapshot,
  );
  return save;
}

export function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

export function getBrowserStorage(): StorageLike | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function createIdleRpgSaveRepository(storage: StorageLike = getBrowserStorage() ?? createMemoryStorage()): IdleRpgSaveRepository {
  return {
    load(nowMs, fitness, seed) {
      let warning: string | undefined;
      try {
        storage.removeItem(IDLE_RPG_LEGACY_KEY);
      } catch (error) {
        warning = `legacy-reset-failed: ${error instanceof Error ? error.message : String(error)}`;
      }
      for (const [key, source] of [[IDLE_RPG_SAVE_KEY, "primary"], [IDLE_RPG_BACKUP_KEY, "backup"]] as const) {
        try {
          const raw = storage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw) as unknown;
          const normalized = normalizeIdleRpgSave(parsed, nowMs, fitness, seed);
          if (normalized) return { save: normalized, source, warning };
          warning = `${source}-save-has-unsupported-schema`;
        } catch (error) {
          warning = `${source}-save-invalid: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
      return { save: createDefaultIdleRpgSave(nowMs, fitness, seed), source: "default", warning };
    },
    save(state) {
      try {
        const previous = storage.getItem(IDLE_RPG_SAVE_KEY);
        if (previous) {
          try {
            const parsed = JSON.parse(previous) as unknown;
            if (record(parsed).schemaVersion === IDLE_RPG_SCHEMA_VERSION) storage.setItem(IDLE_RPG_BACKUP_KEY, previous);
          } catch {
            // A corrupt primary must never replace a valid backup.
          }
        }
        storage.setItem(IDLE_RPG_SAVE_KEY, JSON.stringify(state));
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
  };
}

export function loadIdleRpgCardSummary(
  storage: StorageLike = getBrowserStorage() ?? createMemoryStorage(),
): { heroLevel: number; currentStage: number; highestStage: number; abyssUnlocked: boolean } {
  for (const key of [IDLE_RPG_SAVE_KEY, IDLE_RPG_BACKUP_KEY]) {
    try {
      const source = record(JSON.parse(storage.getItem(key) ?? "null"));
      if (source.schemaVersion !== IDLE_RPG_SCHEMA_VERSION) continue;
      const campaign = record(source.campaign);
      const abyss = record(source.abyss);
      const hero = record(source.hero);
      const highestStage = integer(campaign.highestUnlockedStage, 1, 1, CAMPAIGN_STAGE_COUNT);
      return {
        heroLevel: integer(hero.level, 1, 1),
        currentStage: integer(campaign.currentStage, 1, 1, highestStage),
        highestStage,
        abyssUnlocked: bool(abyss.unlocked, false),
      };
    } catch {
      // Try the other slot before returning the safe card defaults.
    }
  }
  return { heroLevel: 1, currentStage: 1, highestStage: 1, abyssUnlocked: false };
}
