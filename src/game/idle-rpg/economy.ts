import { SKILLS, SUMMONS } from "./content";
import { nextRandom, randomInt } from "./rng";
import type {
  AbyssTreeNode,
  EnemyKind,
  EncounterLocation,
  HeroCombatStats,
  IdleRpgEquipmentSlot,
  IdleRpgItem,
  IdleRpgRarity,
  IdleRpgSaveState,
  IdleRpgSkillId,
  IdleRpgSummonId,
} from "./types";

export const INVENTORY_CAPACITY = 100 as const;
export const MAX_ITEM_UPGRADE_LEVEL = 10 as const;

const RARITY_POWER: Record<IdleRpgRarity, number> = {
  common: 1,
  rare: 1.55,
  epic: 2.4,
  legendary: 3.8,
};

const RARITY_SELL: Record<IdleRpgRarity, number> = {
  common: 45,
  rare: 130,
  epic: 390,
  legendary: 1_150,
};

const SLOT_NAMES: Record<IdleRpgEquipmentSlot, readonly string[]> = {
  weapon: ["Ostrze Rozszczepu", "Tasak Południka", "Runiczny Rapier"],
  armor: ["Płaszcz Popiołu", "Kirys Głębin", "Pancerz Bezświtu"],
  gloves: ["Rękawice Szwu", "Karwasze Odłamków", "Chwyt Burzy"],
  boots: ["Buty Wędrowca", "Nagolenniki Marszu", "Kroki Pustki"],
  relic: ["Kompas Pęknięcia", "Pieczęć Echa", "Odłamek Korony"],
};

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function boundedPow(base: number, exponent: number, cap: number): number {
  return Math.exp(Math.min(Math.log(cap), Math.max(0, exponent) * Math.log(base)));
}

function boundedInteger(value: number, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isFinite(value)) return max;
  return Math.max(0, Math.min(max, Math.round(value)));
}

function cloneForItems(save: IdleRpgSaveState): IdleRpgSaveState {
  return {
    ...save,
    wallet: { ...save.wallet },
    items: { ...save.items },
    inventoryOrder: [...save.inventoryOrder],
    equipped: { ...save.equipped },
  };
}

export function experienceToNextLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.floor(80 + safeLevel * 28 + safeLevel * safeLevel * 4.5);
}

export function applyIdleExperience(save: IdleRpgSaveState, amount: number): { state: IdleRpgSaveState; levelsGained: number } {
  const state = { ...save, hero: { ...save.hero }, wallet: { ...save.wallet } };
  const gain = Math.max(0, Math.floor(amount));
  state.wallet.experience += gain;
  state.hero.experience += gain;
  let levelsGained = 0;
  while (state.hero.experience >= experienceToNextLevel(state.hero.level)) {
    state.hero.experience -= experienceToNextLevel(state.hero.level);
    state.hero.level += 1;
    levelsGained += 1;
  }
  return { state, levelsGained };
}

export function getHeroCombatStats(save: IdleRpgSaveState): HeroCombatStats {
  const equipped = Object.values(save.equipped)
    .map((itemId) => itemId ? save.items[itemId] : null)
    .filter((item): item is IdleRpgItem => Boolean(item));
  const itemAttack = equipped.reduce((sum, item) => sum + item.attack * (1 + item.upgradeLevel * 0.12), 0);
  const itemDefense = equipped.reduce((sum, item) => sum + item.defense * (1 + item.upgradeLevel * 0.12), 0);
  const itemHp = equipped.reduce((sum, item) => sum + item.hp * (1 + item.upgradeLevel * 0.12), 0);
  const itemCrit = equipped.reduce((sum, item) => sum + item.critChance, 0);
  const level = Math.max(1, save.hero.level);
  const fitness = save.fitness;
  const tree = save.abyss.tree;
  const momentumPower = 1 + fitness.momentum * 0.15;
  const attack = (18 + level * 4.2 + itemAttack) * (1 + fitness.attackPct + tree.power * 0.025) * momentumPower;
  const maxHp = (170 + level * 34 + itemHp) * (1 + fitness.maxHpPct + tree.protection * 0.03) * (1 + fitness.momentum * 0.1);
  return {
    maxHp: Math.max(1, Math.round(maxHp)),
    maxMp: Math.max(50, Math.round(80 + level * 3 + fitness.effectiveStats.INTELLIGENCE * 1.5)),
    attack: Math.max(1, attack),
    defense: Math.max(0, 6 + level * 1.8 + itemDefense + tree.protection * 3),
    hpRegenPerSecond: Math.max(0.2, maxHp * (0.004 + fitness.regenPct * 0.01)),
    mpRegenPerSecond: Math.max(1, 3 + fitness.effectiveStats.INTELLIGENCE * 0.035),
    attackIntervalMs: Math.max(350, 1_250 * (1 - fitness.hastePct) * Math.pow(0.985, tree.tempo)),
    critChance: clampFinite(0.05 + fitness.critChance + itemCrit, 0, 0.75),
    critMultiplier: 1.75,
    skillDamageMultiplier: 1 + fitness.skillDamagePct,
    lootMultiplier: 1 + fitness.lootPct + tree.abundance * 0.025,
  };
}

export function getItemUpgradeCost(item: IdleRpgItem): { gold: number; materials: number } {
  const level = clampFinite(Math.floor(item.upgradeLevel), 0, MAX_ITEM_UPGRADE_LEVEL);
  const rarity = RARITY_POWER[item.rarity] ?? 1;
  return {
    gold: Math.floor(90 * rarity * Math.pow(1.55, level)),
    materials: Math.max(1, Math.floor(2 * rarity * Math.pow(1.35, level))),
  };
}

export function getItemSellPrice(item: IdleRpgItem): number {
  return Math.floor((RARITY_SELL[item.rarity] ?? RARITY_SELL.common) * (1 + item.upgradeLevel * 0.35));
}

export function equipItem(save: IdleRpgSaveState, itemId: string): { ok: true; state: IdleRpgSaveState } | { ok: false; reason: string } {
  const item = save.items[itemId];
  if (!item || !save.inventoryOrder.includes(itemId)) return { ok: false, reason: "item-not-found" };
  const state = cloneForItems(save);
  state.equipped[item.slot] = item.id;
  return { ok: true, state };
}

export function sellItem(save: IdleRpgSaveState, itemId: string): { ok: true; state: IdleRpgSaveState; gold: number } | { ok: false; reason: string } {
  const item = save.items[itemId];
  if (!item || !save.inventoryOrder.includes(itemId)) return { ok: false, reason: "item-not-found" };
  if (Object.values(save.equipped).includes(itemId)) return { ok: false, reason: "item-equipped" };
  const state = cloneForItems(save);
  const gold = getItemSellPrice(item);
  delete state.items[itemId];
  state.inventoryOrder = state.inventoryOrder.filter((id) => id !== itemId);
  state.wallet.gold += gold;
  return { ok: true, state, gold };
}

export function upgradeItem(save: IdleRpgSaveState, itemId: string): { ok: true; state: IdleRpgSaveState } | { ok: false; reason: string } {
  const item = save.items[itemId];
  if (!item || !save.inventoryOrder.includes(itemId)) return { ok: false, reason: "item-not-found" };
  if (item.upgradeLevel >= MAX_ITEM_UPGRADE_LEVEL) return { ok: false, reason: "item-max-level" };
  const cost = getItemUpgradeCost(item);
  if (save.wallet.gold < cost.gold || save.wallet.materials < cost.materials) return { ok: false, reason: "insufficient-currency" };
  const state = cloneForItems(save);
  state.wallet.gold -= cost.gold;
  state.wallet.materials -= cost.materials;
  state.items[itemId] = { ...item, upgradeLevel: item.upgradeLevel + 1 };
  return { ok: true, state };
}

export function addItemToInventory(save: IdleRpgSaveState, item: IdleRpgItem): { state: IdleRpgSaveState; added: boolean; salvagedMaterials: number } {
  const state = cloneForItems(save);
  if (state.inventoryOrder.length >= INVENTORY_CAPACITY) {
    const salvagedMaterials = Math.max(1, Math.round(2 * RARITY_POWER[item.rarity]));
    state.wallet.materials += salvagedMaterials;
    return { state, added: false, salvagedMaterials };
  }
  if (state.items[item.id]) return { state, added: false, salvagedMaterials: 0 };
  state.items[item.id] = { ...item };
  state.inventoryOrder.push(item.id);
  return { state, added: true, salvagedMaterials: 0 };
}

function getStagePower(location: EncounterLocation): number {
  return location.kind === "campaign" ? location.stage : 48 + location.depth * 2 + location.wave * 0.25;
}

export function rollEquipmentDrop(
  rngState: number,
  location: EncounterLocation,
  kind: EnemyKind,
  encounterSerial: number,
  lootMultiplier: number,
): { rngState: number; item: IdleRpgItem | null } {
  let random = nextRandom(rngState);
  const baseChance = kind === "boss" ? 1 : kind === "elite" ? 0.55 : 0.16;
  if (random.value >= Math.min(1, baseChance * clampFinite(lootMultiplier, 1, 3))) {
    return { rngState: random.state, item: null };
  }
  const rarityRoll = nextRandom(random.state);
  random = rarityRoll;
  const bossBonus = kind === "boss" ? 0.15 : kind === "elite" ? 0.06 : 0;
  const adjusted = Math.max(0, rarityRoll.value - bossBonus);
  const rarity: IdleRpgRarity = adjusted < 0.025
    ? "legendary"
    : adjusted < 0.14
      ? "epic"
      : adjusted < 0.44
        ? "rare"
        : "common";
  const slots: IdleRpgEquipmentSlot[] = ["weapon", "armor", "gloves", "boots", "relic"];
  const slotRoll = randomInt(random.state, 0, slots.length - 1);
  const slot = slots[slotRoll.value];
  const nameRoll = randomInt(slotRoll.state, 0, SLOT_NAMES[slot].length - 1);
  const varianceRoll = nextRandom(nameRoll.state);
  const power = boundedPow(1.045, getStagePower(location) - 1, 50_000_000) * RARITY_POWER[rarity] * (0.9 + varianceRoll.value * 0.2);
  const item: IdleRpgItem = {
    id: `loot-${encounterSerial}-${varianceRoll.state.toString(16).padStart(8, "0")}`,
    name: SLOT_NAMES[slot][nameRoll.value],
    slot,
    rarity,
    upgradeLevel: 0,
    attack: boundedInteger((slot === "weapon" ? 16 : slot === "gloves" || slot === "relic" ? 7 : 2) * power, 1_000_000_000),
    defense: boundedInteger((slot === "armor" ? 11 : slot === "boots" ? 7 : slot === "relic" ? 4 : 1) * power, 1_000_000_000),
    hp: boundedInteger((slot === "armor" ? 55 : slot === "boots" ? 28 : slot === "relic" ? 20 : 5) * power, 1_000_000_000),
    critChance: Number(((slot === "gloves" ? 0.018 : slot === "weapon" || slot === "relic" ? 0.01 : 0.002) * RARITY_POWER[rarity]).toFixed(4)),
  };
  return { rngState: varianceRoll.state, item };
}

export function getSummonUpgradeCost(summonId: IdleRpgSummonId, level: number): { gold: number; materials: number } {
  const index = Math.max(0, SUMMONS.findIndex((summon) => summon.id === summonId));
  const safeLevel = Math.max(1, Math.floor(level));
  return {
    gold: boundedInteger((120 + index * 180) * boundedPow(1.3, safeLevel - 1, Number.MAX_SAFE_INTEGER)),
    materials: Math.max(1, boundedInteger((2 + index) * boundedPow(1.18, safeLevel - 1, Number.MAX_SAFE_INTEGER))),
  };
}

export function upgradeSummon(save: IdleRpgSaveState, summonId: IdleRpgSummonId): { ok: true; state: IdleRpgSaveState } | { ok: false; reason: string } {
  if (!save.summons.unlockedIds.includes(summonId)) return { ok: false, reason: "summon-locked" };
  const level = save.summons.levels[summonId];
  const cost = getSummonUpgradeCost(summonId, level);
  if (save.wallet.gold < cost.gold || save.wallet.materials < cost.materials) return { ok: false, reason: "insufficient-currency" };
  return {
    ok: true,
    state: {
      ...save,
      wallet: { ...save.wallet, gold: save.wallet.gold - cost.gold, materials: save.wallet.materials - cost.materials },
      summons: { ...save.summons, levels: { ...save.summons.levels, [summonId]: level + 1 } },
    },
  };
}

export function setActiveSummons(save: IdleRpgSaveState, summonIds: IdleRpgSummonId[]): { ok: true; state: IdleRpgSaveState } | { ok: false; reason: string } {
  const unique = [...new Set(summonIds)];
  if (unique.length > 3) return { ok: false, reason: "too-many-summons" };
  if (unique.some((id) => !save.summons.unlockedIds.includes(id))) return { ok: false, reason: "summon-locked" };
  return { ok: true, state: { ...save, summons: { ...save.summons, activeIds: unique } } };
}

export function getAbyssUpgradeCost(level: number): number {
  return Math.max(1, boundedInteger(3 * boundedPow(1.42, Math.max(0, Math.floor(level)), Number.MAX_SAFE_INTEGER)));
}

export function upgradeAbyssNode(save: IdleRpgSaveState, node: AbyssTreeNode): { ok: true; state: IdleRpgSaveState } | { ok: false; reason: string } {
  if (!save.abyss.unlocked) return { ok: false, reason: "abyss-locked" };
  const cost = getAbyssUpgradeCost(save.abyss.tree[node]);
  if (save.wallet.abyssShards < cost) return { ok: false, reason: "insufficient-abyss-shards" };
  return {
    ok: true,
    state: {
      ...save,
      wallet: { ...save.wallet, abyssShards: save.wallet.abyssShards - cost },
      abyss: { ...save.abyss, tree: { ...save.abyss.tree, [node]: save.abyss.tree[node] + 1 } },
    },
  };
}

export function getSkillUpgradeCost(skillId: IdleRpgSkillId, level: number): { gold: number; materials: number } {
  const index = Math.max(0, SKILLS.findIndex((skill) => skill.id === skillId));
  const safeLevel = Math.max(1, Math.floor(level));
  const isUltimate = skillId === "last-meridian";
  const baseGold = isUltimate ? 350 : 100 + index * 90;
  const baseMaterials = isUltimate ? 8 : 2 + index * 2;
  return {
    gold: boundedInteger(baseGold * boundedPow(1.35, safeLevel - 1, Number.MAX_SAFE_INTEGER)),
    materials: Math.max(1, boundedInteger(baseMaterials * boundedPow(1.22, safeLevel - 1, Number.MAX_SAFE_INTEGER))),
  };
}

export function upgradeSkill(save: IdleRpgSaveState, skillId: IdleRpgSkillId): { ok: true; state: IdleRpgSaveState } | { ok: false; reason: string } {
  const skill = save.skills[skillId];
  if (!skill || !skill.unlocked) return { ok: false, reason: "skill-locked" };
  const cost = getSkillUpgradeCost(skillId, skill.level);
  if (save.wallet.gold < cost.gold || save.wallet.materials < cost.materials) return { ok: false, reason: "insufficient-currency" };
  return {
    ok: true,
    state: {
      ...save,
      wallet: {
        ...save.wallet,
        gold: save.wallet.gold - cost.gold,
        materials: save.wallet.materials - cost.materials,
      },
      skills: {
        ...save.skills,
        [skillId]: {
          ...skill,
          level: skill.level + 1,
        },
      },
    },
  };
}
