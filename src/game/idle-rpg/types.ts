import type { PlayerState } from "../../types";

export const IDLE_RPG_SCHEMA_VERSION = 1 as const;
export const IDLE_RPG_FIXED_STEP_MS = 50 as const;
export const IDLE_RPG_SAVE_KEY = "solo-leveler:idle-rpg-v2:save" as const;
export const IDLE_RPG_BACKUP_KEY = "solo-leveler:idle-rpg-v2:backup" as const;
export const IDLE_RPG_LEGACY_KEY = "solo-leveler:idle-rpg-save" as const;

export type EncounterLocation =
  | { kind: "campaign"; stage: number }
  | { kind: "abyss"; depth: number; wave: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 };

export type CombatPhase =
  | "loading"
  | "enemy-entering"
  | "fighting"
  | "enemy-dying"
  | "marching"
  | "realm-clear"
  | "hero-dying"
  | "respawning"
  | "campaign-complete"
  | "abyss-depth-clear"
  | "paused";

export type EnemyKind = "normal" | "elite" | "boss";
export type IdleRpgRarity = "common" | "rare" | "epic" | "legendary";
export type IdleRpgEquipmentSlot = "weapon" | "armor" | "gloves" | "boots" | "relic";
export type IdleRpgSkillId =
  | "meridian-rend"
  | "seam-step"
  | "shard-rain"
  | "echo-call"
  | "last-meridian";
export type IdleRpgSummonId =
  | "meridian-fang"
  | "ember-bastion"
  | "ink-mora"
  | "storm-spire"
  | "dusk-aureole";
export type AbyssTreeNode = "power" | "protection" | "tempo" | "abundance";

export interface RealmDefinition {
  id: string;
  index: 0 | 1 | 2 | 3;
  name: string;
  stageFrom: number;
  stageTo: number;
  palette: readonly string[];
  normalEnemies: readonly [string, string, string];
  elite: string;
  boss: string;
}

export interface StageDefinition {
  stage: number;
  realmIndex: 0 | 1 | 2 | 3;
  realmStage: number;
  enemyId: string;
  enemyName: string;
  kind: EnemyKind;
  hasChest: boolean;
}

export interface SkillDefinition {
  id: IdleRpgSkillId;
  name: string;
  description: string;
  unlockStage: number;
  manaCost: number;
  cooldownMs: number;
  multiplier: number;
  isUltimate?: boolean;
}

export interface SummonDefinition {
  id: IdleRpgSummonId;
  name: string;
  unlockStage: number;
  baseAttack: number;
  attackIntervalMs: number;
}

export interface FitnessSnapshot {
  capturedAt: number;
  effectiveStats: {
    STR: number;
    VITALITY: number;
    AGILITY: number;
    INTELLIGENCE: number;
    SENSE: number;
  };
  dailyRatio: number;
  weeklyLoad: number;
  momentum: number;
  weeklyMinutes: number;
  weeklySets: number;
  weeklyVolumeKg: number;
  attackPct: number;
  maxHpPct: number;
  regenPct: number;
  hastePct: number;
  critChance: number;
  skillDamagePct: number;
  lootPct: number;
  offlineEfficiencyPct: number;
}

export interface OfflinePowerSnapshot {
  capturedAt: number;
  location: EncounterLocation;
  goldPerMinute: number;
  experiencePerMinute: number;
  materialsPerHour: number;
  efficiency: number;
}

export interface OfflineGrant {
  id: string;
  fromMs: number;
  toMs: number;
  elapsedSeconds: number;
  cappedSeconds: number;
  gold: number;
  experience: number;
  materials: number;
}

export interface IdleRpgItem {
  id: string;
  name: string;
  slot: IdleRpgEquipmentSlot;
  rarity: IdleRpgRarity;
  upgradeLevel: number;
  attack: number;
  defense: number;
  hp: number;
  critChance: number;
}

export interface EnemyCombatState {
  contentId: string;
  name: string;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  goldReward: number;
  experienceReward: number;
  materialReward: number;
}

export interface CombatCheckpoint {
  phase: CombatPhase;
  phaseBeforePause: Exclude<CombatPhase, "paused"> | null;
  phaseRemainingMs: number;
  location: EncounterLocation;
  pendingLocation: EncounterLocation | null;
  encounterSerial: number;
  lastSettledEncounterSerial: number;
  enemy: EnemyCombatState;
  heroAttackCooldownMs: number;
  enemyAttackCooldownMs: number;
  summonCooldowns: Partial<Record<IdleRpgSummonId, number>>;
  skillCooldowns: Record<IdleRpgSkillId, number>;
  dodgeRemainingMs: number;
  enemyStaggerRemainingMs: number;
}

export interface IdleRpgSaveState {
  schemaVersion: typeof IDLE_RPG_SCHEMA_VERSION;
  createdAt: number;
  updatedAt: number;
  rngState: number;
  campaign: {
    currentStage: number;
    highestUnlockedStage: number;
    completed: boolean;
    farmingStage: number | null;
  };
  abyss: {
    unlocked: boolean;
    mode: "push" | "harvest";
    currentDepth: number;
    highestCompletedDepth: number;
    tree: Record<AbyssTreeNode, number>;
  };
  wallet: {
    gold: number;
    experience: number;
    materials: number;
    abyssShards: number;
  };
  hero: {
    level: number;
    experience: number;
    hp: number;
    mp: number;
  };
  skills: Record<IdleRpgSkillId, { level: number; unlocked: boolean }>;
  summons: {
    levels: Record<IdleRpgSummonId, number>;
    unlockedIds: IdleRpgSummonId[];
    activeIds: IdleRpgSummonId[];
  };
  items: Record<string, IdleRpgItem>;
  inventoryOrder: string[];
  equipped: Record<IdleRpgEquipmentSlot, string | null>;
  settings: {
    autoBattle: boolean;
    battleSpeed: 1 | 2;
  };
  combat: CombatCheckpoint;
  fitness: FitnessSnapshot;
  offline: {
    lastActiveAt: number;
    powerSnapshot: OfflinePowerSnapshot;
    pendingGrant: OfflineGrant | null;
    lastClaimedGrantId: string | null;
  };
  stats: {
    monstersDefeated: number;
    elitesDefeated: number;
    bossesDefeated: number;
    totalGoldEarned: number;
    totalDamageDealt: number;
  };
}

export interface HeroCombatStats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  hpRegenPerSecond: number;
  mpRegenPerSecond: number;
  attackIntervalMs: number;
  critChance: number;
  critMultiplier: number;
  skillDamageMultiplier: number;
  lootMultiplier: number;
}

export interface IdleRpgSnapshot {
  revision: number;
  nowMs: number;
  phase: CombatPhase;
  location: EncounterLocation;
  encounter: {
    serial: number;
    enemy: Readonly<EnemyCombatState>;
    phaseRemainingMs: number;
  };
  hero: Readonly<IdleRpgSaveState["hero"]> & Readonly<HeroCombatStats> & { experienceToNextLevel: number };
  campaign: Readonly<IdleRpgSaveState["campaign"]>;
  abyss: Readonly<IdleRpgSaveState["abyss"]>;
  wallet: Readonly<IdleRpgSaveState["wallet"]>;
  skills: ReadonlyArray<SkillDefinition & { level: number; unlocked: boolean; cooldownRemainingMs: number; upgradeCost: { gold: number; materials: number }; effectiveMultiplier: number }>;
  summons: ReadonlyArray<SummonDefinition & { level: number; unlocked: boolean; active: boolean }>;
  inventory: ReadonlyArray<Readonly<IdleRpgItem>>;
  equipped: Readonly<Record<IdleRpgEquipmentSlot, string | null>>;
  settings: Readonly<IdleRpgSaveState["settings"]>;
  fitness: Readonly<FitnessSnapshot>;
  offline: Readonly<IdleRpgSaveState["offline"]>;
}

export type IdleRpgCommand =
  | { type: "use-skill"; skillId: IdleRpgSkillId }
  | { type: "upgrade-skill"; skillId: IdleRpgSkillId }
  | { type: "toggle-auto" }
  | { type: "toggle-farm" }
  | { type: "set-speed"; speed: 1 | 2 }
  | { type: "select-stage"; stage: number; mode?: "advance" | "farm" }
  | { type: "enter-abyss" }
  | { type: "set-abyss-mode"; mode: "push" | "harvest" }
  | { type: "equip-item"; itemId: string }
  | { type: "sell-item"; itemId: string }
  | { type: "upgrade-item"; itemId: string }
  | { type: "upgrade-summon"; summonId: IdleRpgSummonId }
  | { type: "set-active-summons"; summonIds: IdleRpgSummonId[] }
  | { type: "upgrade-abyss"; node: AbyssTreeNode }
  | { type: "claim-offline"; grantId?: string };

export type CommandResult =
  | { ok: true }
  | { ok: false; reason: string };

export type IdleRpgEvent =
  | { type: "animation-start"; actor: "hero" | "enemy" | IdleRpgSummonId; animation: string }
  | { type: "hit"; source: "hero" | "enemy" | IdleRpgSummonId; target: "hero" | "enemy"; damage: number; critical: boolean; skillId?: IdleRpgSkillId }
  | { type: "death"; actor: "hero" | "enemy" }
  | { type: "encounter-settled"; serial: number; location: EncounterLocation; gold: number; experience: number; materials: number }
  | { type: "loot"; item: IdleRpgItem | null; salvagedMaterials: number }
  | { type: "march"; from: EncounterLocation; to: EncounterLocation }
  | { type: "spawn"; serial: number; location: EncounterLocation; enemy: EnemyCombatState }
  | { type: "level-up"; level: number }
  | { type: "realm-unlocked"; realmIndex: 1 | 2 | 3 }
  | { type: "abyss-unlocked" }
  | { type: "offline-prepared"; grant: OfflineGrant }
  | { type: "offline-claimed"; grant: OfflineGrant }
  | { type: "save-error"; operation: "load" | "save"; message: string }
  | { type: "asset-error"; assetId: string; message: string };

export interface IdleRpgScreenProps {
  profile: Readonly<PlayerState>;
  onClose(): void;
}

export interface IdleRpgRuntime {
  getSnapshot(): IdleRpgSnapshot;
  dispatch(command: IdleRpgCommand): CommandResult;
  subscribe(listener: () => void): () => void;
  subscribeEvents(listener: (event: IdleRpgEvent) => void): () => void;
  pause(reason: string): void;
  resume(nowMs: number): void;
  dispose(): void;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface IdleRpgSaveRepository {
  load(nowMs: number, fitness: FitnessSnapshot, seed?: number): { save: IdleRpgSaveState; source: "primary" | "backup" | "default"; warning?: string };
  save(state: IdleRpgSaveState): { ok: true } | { ok: false; error: string };
}

export interface RuntimeScheduler {
  request(callback: (nowMs: number) => void): unknown;
  cancel(handle: unknown): void;
}

export interface CreateIdleRpgRuntimeOptions {
  profile: Readonly<PlayerState>;
  getProfile?: () => Readonly<PlayerState>;
  repository?: IdleRpgSaveRepository;
  now?: () => number;
  seed?: number;
  scheduler?: RuntimeScheduler;
  autoStart?: boolean;
}
