import type { Equipment, EquipmentSlotId } from "../types";
import { getEquipmentSlotDefinition, normalizeEquipmentType } from "./equipment";

export const EQUIPMENT_RARITY_LABELS = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
} as const;

export const EQUIPMENT_RARITY_CLASSES = {
  common: "border-[var(--theme-border)] bg-[var(--theme-input)] text-[var(--theme-text)]",
  rare: "border-[color-mix(in_srgb,var(--theme-accent)_48%,transparent)] bg-[var(--theme-accent-soft)] text-[var(--theme-accent-text)]",
  epic: "border-[color-mix(in_srgb,var(--theme-focus)_50%,transparent)] bg-[color-mix(in_srgb,var(--theme-focus)_14%,var(--theme-card))] text-[var(--theme-text)]",
  legendary: "border-[color-mix(in_srgb,var(--theme-warning)_54%,transparent)] bg-[color-mix(in_srgb,var(--theme-warning)_16%,var(--theme-card))] text-[var(--theme-text)]",
} as const;

type ModelEntry = { path: string; src: string };

function sortedModelEntries(modules: Record<string, string>): ModelEntry[] {
  return Object.entries(modules)
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
    .map(([path, src]) => ({ path: path.replaceAll("\\", "/"), src }));
}

const WEAPON_MODEL_ENTRIES = sortedModelEntries(import.meta.glob<string>('../assets/models/equipment/weapons/*.png', { eager: true, query: '?url', import: 'default' }));
const ARMOR_MODEL_ENTRIES = sortedModelEntries(import.meta.glob<string>('../assets/models/equipment/armors/*.png', { eager: true, query: '?url', import: 'default' }));
const RELIC_MODEL_ENTRIES = sortedModelEntries(import.meta.glob<string>('../assets/models/equipment/relics/*.png', { eager: true, query: '?url', import: 'default' }));

function allModelSources(entries: ModelEntry[]) {
  return entries.map((entry) => entry.src);
}

function pickModelSources(entries: ModelEntry[], fileNames: string[]) {
  const wanted = new Set(fileNames.map((name) => name.toLowerCase()));
  return entries
    .filter((entry) => wanted.has((entry.path.split("/").pop() ?? "").toLowerCase()))
    .map((entry) => entry.src);
}

const WEAPON_MODELS = allModelSources(WEAPON_MODEL_ENTRIES);
const HELMET_MODELS = pickModelSources([...ARMOR_MODEL_ENTRIES, ...RELIC_MODEL_ENTRIES], ["armor-00.png", "relic-00.png"]);
const ARMOR_MODELS = pickModelSources(ARMOR_MODEL_ENTRIES, ["armor-01.png", "armor-03.png"]);
const GLOVE_MODELS = pickModelSources(ARMOR_MODEL_ENTRIES, ["armor-02.png", "armor-04.png"]);
const BOOT_MODELS = pickModelSources(ARMOR_MODEL_ENTRIES, ["armor-05.png"]);
const RING_MODELS = pickModelSources(RELIC_MODEL_ENTRIES, ["relic-05.png"]);
const NECKLACE_MODELS = pickModelSources(RELIC_MODEL_ENTRIES, ["relic-02.png", "relic-07.png"]);
const ARTIFACT_MODELS = pickModelSources(RELIC_MODEL_ENTRIES, [
  "relic-01.png",
  "relic-03.png",
  "relic-04.png",
  "relic-06.png",
  "relic-08.png",
  "relic-09.png",
]);

const EQUIPMENT_MODEL_POOLS: Record<EquipmentSlotId, string[]> = {
  weapon: WEAPON_MODELS,
  helmet: HELMET_MODELS,
  armor: ARMOR_MODELS,
  gloves: GLOVE_MODELS,
  boots: BOOT_MODELS,
  ring1: RING_MODELS,
  ring2: RING_MODELS,
  necklace: NECKLACE_MODELS,
  artifact: ARTIFACT_MODELS,
};

function pickFromModelPool(pool: string[], hashKey: string, fallbackPool = ARTIFACT_MODELS) {
  const safePool = pool.length ? pool : fallbackPool.length ? fallbackPool : WEAPON_MODELS;
  return safePool[hashString(hashKey) % safePool.length] ?? "";
}

export function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return hash;
}

export function getEquipmentSlotLabel(slot: EquipmentSlotId) {
  return getEquipmentSlotDefinition(slot).label;
}

export function getEquipmentTypeLabel(item: Equipment) {
  return getEquipmentSlotDefinition(normalizeEquipmentType(item.type)).label;
}

export function getEquipmentPerkLabel(item: Equipment) {
  const perk = item.miniGamePerk;
  if (!perk) return null;
  const scope = perk.gameId === "all" ? "wszystkie gry" : perk.gameId.replaceAll("-", " ");
  const value = perk.kind === "targetLifetime"
    ? `+${Math.round(perk.value)} ms`
    : `+${Math.round(perk.value * 100)}%`;
  const label = {
    scoreBonus: "score",
    targetLifetime: "czas celu",
    hitWindow: "okno trafienia",
    timePenaltyResist: "odporność kary",
  }[perk.kind];
  return `${value} ${label} · ${scope}`;
}

export function getItemModelSrc(item: Equipment) {
  const name = item.name.toLowerCase();
  const hashKey = `${item.id}_${item.name}_${item.rarity}`;
  const itemType = normalizeEquipmentType(item.type);

  if (itemType === "weapon") {
    if (name.includes("łuk") || name.includes("luk")) return WEAPON_MODELS[13] ?? WEAPON_MODELS[0];
    if (name.includes("katana") || name.includes("sztylet") || name.includes("ostrze")) return WEAPON_MODELS[1] ?? WEAPON_MODELS[0];
    if (item.rarity === "legendary") return WEAPON_MODELS[16] ?? WEAPON_MODELS[0];
    if (item.rarity === "epic") return WEAPON_MODELS[10] ?? WEAPON_MODELS[0];
    return pickFromModelPool(WEAPON_MODELS, hashKey, WEAPON_MODELS);
  }

  if (itemType === "artifact") {
    if (item.rarity === "legendary") return ARTIFACT_MODELS[4] ?? pickFromModelPool(ARTIFACT_MODELS, hashKey);
    if (item.rarity === "epic") return ARTIFACT_MODELS[2] ?? pickFromModelPool(ARTIFACT_MODELS, hashKey);
  }

  return pickFromModelPool(EQUIPMENT_MODEL_POOLS[itemType], hashKey);
}
