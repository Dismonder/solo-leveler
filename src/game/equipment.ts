import type { Equipment, EquipmentSlotId, EquipmentType, MiniGameRelicPerk, PlayerState } from "../types";
import { EQUIPMENT_SLOT_IDS } from "../types";
import type { MiniGameId } from "./miniGameProgress";

export type EquipmentSlotDefinition = {
  id: EquipmentSlotId;
  label: string;
  shortLabel: string;
  accepts: EquipmentType[];
  hint: string;
};

export const EQUIPMENT_SLOT_DEFINITIONS: EquipmentSlotDefinition[] = [
  { id: "weapon", label: "Broń", shortLabel: "Broń", accepts: ["weapon"], hint: "Atak, siła i precyzja." },
  { id: "helmet", label: "Hełm", shortLabel: "Hełm", accepts: ["helmet"], hint: "Sense i odporność." },
  { id: "armor", label: "Pancerz", shortLabel: "Pancerz", accepts: ["armor"], hint: "HP i vitality." },
  { id: "gloves", label: "Rękawice", shortLabel: "Ręce", accepts: ["gloves"], hint: "Siła chwytu i atak." },
  { id: "boots", label: "Buty", shortLabel: "Buty", accepts: ["boots"], hint: "Agility i ruch." },
  { id: "ring1", label: "Pierścień I", shortLabel: "Ring I", accepts: ["ring1", "ring2", "accessory"], hint: "Dowolny pierścień." },
  { id: "ring2", label: "Pierścień II", shortLabel: "Ring II", accepts: ["ring1", "ring2", "accessory"], hint: "Drugi pierścień." },
  { id: "necklace", label: "Naszyjnik", shortLabel: "Szyja", accepts: ["necklace", "accessory"], hint: "Mana i zmysły." },
  { id: "artifact", label: "Artefakt", shortLabel: "Artefakt", accepts: ["artifact", "accessory"], hint: "Relikty i rdzenie." },
];

const SLOT_SET = new Set<EquipmentSlotId>(EQUIPMENT_SLOT_IDS);
const MINI_GAME_PERK_CAPS = {
  scoreBonus: 0.1,
  targetLifetime: 250,
  hitWindow: 0.08,
  timePenaltyResist: 0.12,
} satisfies Record<MiniGameRelicPerk["kind"], number>;

export type MiniGameRelicBonusSummary = Record<MiniGameRelicPerk["kind"], number>;

export function createDefaultEquipmentLoadout(): Record<EquipmentSlotId, Equipment | null> {
  return EQUIPMENT_SLOT_IDS.reduce((acc, slot) => {
    acc[slot] = null;
    return acc;
  }, {} as Record<EquipmentSlotId, Equipment | null>);
}

export function normalizeEquipmentType(type: EquipmentType | string | null | undefined): EquipmentSlotId {
  if (type === "accessory") return "artifact";
  if (typeof type === "string" && SLOT_SET.has(type as EquipmentSlotId)) return type as EquipmentSlotId;
  return "artifact";
}

export function inferEquipmentTypeFromName(item: Pick<Equipment, "name" | "type">): EquipmentSlotId {
  const normalizedType = normalizeEquipmentType(item.type);
  const name = item.name.toLowerCase();

  if (/\b(he[lł]m|maska|korona|kaptur|helmet)\b/i.test(name)) return "helmet";
  if (/\b(r[eę]kawic|karwasz|r[eę]ce|gloves?)\b/i.test(name)) return "gloves";
  if (/\b(but|nagolennik|krok|boots?)\b/i.test(name)) return "boots";
  if (/\b(pancerz|zbroja|kirys|armor|kamizelka)\b/i.test(name)) return "armor";
  if (/\b(pier[śs]cie[ńn]|obr[aą]czk|ring)\b/i.test(name)) return normalizedType === "ring2" ? "ring2" : "ring1";
  if (/\b(naszyjnik|amulet|necklace)\b/i.test(name)) return "necklace";
  if (/\b(ostrze|miecz|katana|sztylet|[łl]uk|bro[ńn]|weapon)\b/i.test(name)) return "weapon";
  if (/\b(relikt|rdze[ńn]|oko|artefakt|kryszta[lł]|core)\b/i.test(name)) return "artifact";

  return normalizedType;
}

function normalizeMiniGamePerk(perk: unknown): MiniGameRelicPerk | undefined {
  if (!perk || typeof perk !== "object") return undefined;
  const candidate = perk as Partial<MiniGameRelicPerk>;
  if (!candidate.kind || !(candidate.kind in MINI_GAME_PERK_CAPS)) return undefined;
  if (candidate.gameId !== "all" && typeof candidate.gameId !== "string") return undefined;
  const rawValue = Number(candidate.value);
  if (!Number.isFinite(rawValue) || rawValue <= 0) return undefined;
  return {
    gameId: candidate.gameId || "all",
    kind: candidate.kind,
    value: Math.min(rawValue, MINI_GAME_PERK_CAPS[candidate.kind]),
  };
}

function createLegacyRelicPerk(item: Equipment, inferredType: EquipmentSlotId): MiniGameRelicPerk | undefined {
  if (inferredType !== "artifact") return undefined;
  const rarity = item.rarity || "common";
  if (rarity === "common") return undefined;

  const lowerName = item.name.toLowerCase();
  const gameId: MiniGameRelicPerk["gameId"] =
    /bram/.test(lowerName) ? "gate-dodge" :
    /cie[ńn]|shadow/.test(lowerName) ? "shadow-extraction" :
    /run/.test(lowerName) ? "rune-lock" :
    /mana/.test(lowerName) ? "mana-memory" :
    "all";
  const kind: MiniGameRelicPerk["kind"] =
    item.bonusType === "SENSE" ? "targetLifetime" :
    item.bonusType === "AGILITY" ? "hitWindow" :
    item.bonusType === "VITALITY" ? "timePenaltyResist" :
    "scoreBonus";
  const ratioValue = { rare: 0.035, epic: 0.065, legendary: 0.1, common: 0 }[rarity];
  const value = kind === "targetLifetime"
    ? { rare: 100, epic: 175, legendary: 250, common: 0 }[rarity]
    : kind === "timePenaltyResist"
      ? { rare: 0.04, epic: 0.08, legendary: 0.12, common: 0 }[rarity]
      : ratioValue;

  return normalizeMiniGamePerk({ gameId, kind, value });
}

export function normalizeEquipmentItem(item: Equipment): Equipment {
  const explicitType = item.classificationSource === "explicit";
  const normalizedType = normalizeEquipmentType(item.type);
  const inferredType = explicitType ? normalizedType : inferEquipmentTypeFromName(item);
  const legacyType = normalizedType !== inferredType ? item.type : item.legacyType;
  return {
    ...item,
    type: inferredType,
    classificationSource: explicitType ? "explicit" : item.classificationSource,
    legacyType,
    equippedSlot: item.equippedSlot && SLOT_SET.has(item.equippedSlot) ? item.equippedSlot : undefined,
    miniGamePerk: normalizeMiniGamePerk(item.miniGamePerk) ?? createLegacyRelicPerk(item, inferredType),
    durability: Number.isFinite(item.durability) ? item.durability : 100,
    maxDurability: Number.isFinite(item.maxDurability) ? item.maxDurability : 100,
  };
}

export function normalizeEquipmentInventory(items: unknown): Equipment[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is Equipment => Boolean(item && typeof item === "object" && "id" in item && "bonusType" in item))
    .map(normalizeEquipmentItem);
}

export function normalizeEquipmentLoadout(input: unknown): Record<EquipmentSlotId, Equipment | null> {
  const next = createDefaultEquipmentLoadout();
  const source = (input && typeof input === "object" ? input : {}) as Partial<Record<EquipmentSlotId | "accessory", Equipment | null>>;

  for (const slot of EQUIPMENT_SLOT_IDS) {
    const item = source[slot];
    if (!item) continue;
    const normalized = normalizeEquipmentItem({ ...item, type: item.type || slot, equippedSlot: slot });
    const targetSlot = canEquipItemInSlot(normalized, slot) ? slot : getPrimarySlotForItem(normalized);
    if (!next[targetSlot]) {
      next[targetSlot] = { ...normalized, equippedSlot: targetSlot };
    }
  }

  if (!next.artifact && source.accessory) {
    next.artifact = normalizeEquipmentItem({ ...source.accessory, type: "artifact", equippedSlot: "artifact" });
  }

  return next;
}

export function getEquipmentSlotDefinition(slot: EquipmentSlotId): EquipmentSlotDefinition {
  return EQUIPMENT_SLOT_DEFINITIONS.find((definition) => definition.id === slot) ?? EQUIPMENT_SLOT_DEFINITIONS[0];
}

export function getCompatibleSlots(item: Equipment): EquipmentSlotId[] {
  const itemType = normalizeEquipmentType(item.type);
  const direct = EQUIPMENT_SLOT_DEFINITIONS.filter((slot) => slot.accepts.includes(itemType));
  return direct.length ? direct.map((slot) => slot.id) : [itemType];
}

export function canEquipItemInSlot(item: Equipment, slot: EquipmentSlotId): boolean {
  return getEquipmentSlotDefinition(slot).accepts.includes(normalizeEquipmentType(item.type));
}

export function getPrimarySlotForItem(item: Equipment): EquipmentSlotId {
  return getCompatibleSlots(item)[0] ?? "artifact";
}

export function equipItem(player: PlayerState, item: Equipment, preferredSlot?: EquipmentSlotId): PlayerState {
  const normalizedItem = normalizeEquipmentItem(item);
  const slot = preferredSlot && canEquipItemInSlot(normalizedItem, preferredSlot)
    ? preferredSlot
    : getPrimarySlotForItem(normalizedItem);
  const currentEquipment = normalizeEquipmentLoadout(player.equipment);
  const currentItem = currentEquipment[slot];
  const inventory = player.inventory.filter((candidate) => candidate.id !== item.id).map(normalizeEquipmentItem);
  const nextInventory = currentItem ? [...inventory, currentItem] : inventory;

  return {
    ...player,
    inventory: nextInventory,
    equipment: {
      ...currentEquipment,
      [slot]: { ...normalizedItem, equippedSlot: slot },
    },
  };
}

export function unequipSlot(player: PlayerState, slot: EquipmentSlotId): PlayerState {
  const currentEquipment = normalizeEquipmentLoadout(player.equipment);
  const item = currentEquipment[slot];
  if (!item) return player;

  return {
    ...player,
    inventory: [...player.inventory.map(normalizeEquipmentItem), item],
    equipment: {
      ...currentEquipment,
      [slot]: null,
    },
  };
}

export function getEquippedItems(player: Pick<PlayerState, "equipment">): Equipment[] {
  return Object.values(normalizeEquipmentLoadout(player.equipment)).filter(Boolean) as Equipment[];
}

export function getEquippedMiniGameBonuses(player: Pick<PlayerState, "equipment">, gameId: MiniGameId): MiniGameRelicBonusSummary {
  const summary: MiniGameRelicBonusSummary = {
    scoreBonus: 0,
    targetLifetime: 0,
    hitWindow: 0,
    timePenaltyResist: 0,
  };

  for (const item of getEquippedItems(player)) {
    const perk = item.miniGamePerk;
    if (!perk || item.durability <= 0) continue;
    if (perk.gameId !== "all" && perk.gameId !== gameId) continue;
    summary[perk.kind] = Math.min(MINI_GAME_PERK_CAPS[perk.kind], summary[perk.kind] + perk.value);
  }

  return summary;
}

export function getItemSellPrice(item: Equipment): number {
  const rarityMultiplier = {
    common: 1,
    rare: 3,
    epic: 6,
    legendary: 12,
  }[item.rarity || "common"];
  return Math.floor(item.bonusValue * rarityMultiplier * 2) + 10;
}

export function normalizePlayerEquipment(player: PlayerState): PlayerState {
  const inventory = normalizeEquipmentInventory(player.inventory);
  const inventoryIds = new Set(inventory.map((item) => item.id));
  const equipment = createDefaultEquipmentLoadout();
  const overflow: Equipment[] = [];
  const source = (player.equipment && typeof player.equipment === "object"
    ? player.equipment
    : {}) as Partial<Record<EquipmentSlotId | "accessory", Equipment | null>>;
  const entries: Array<{ sourceSlot: EquipmentSlotId | "accessory"; normalized: Equipment; direct: boolean }> = [];

  const prepareItem = (rawItem: Equipment, sourceSlot: EquipmentSlotId | "accessory") => {
    const normalized = normalizeEquipmentItem({
      ...rawItem,
      type: rawItem.type || (sourceSlot === "accessory" ? "artifact" : sourceSlot),
      equippedSlot: sourceSlot === "accessory" ? "artifact" : sourceSlot,
    });
    entries.push({
      sourceSlot,
      normalized,
      direct: sourceSlot !== "accessory" && canEquipItemInSlot(normalized, sourceSlot),
    });
  };

  const placeItem = ({ sourceSlot, normalized }: (typeof entries)[number]) => {
    const preferredSlot = sourceSlot !== "accessory" && canEquipItemInSlot(normalized, sourceSlot)
      ? sourceSlot
      : getPrimarySlotForItem(normalized);

    if (!equipment[preferredSlot]) {
      equipment[preferredSlot] = { ...normalized, equippedSlot: preferredSlot };
      return;
    }

    if (!inventoryIds.has(normalized.id)) {
      overflow.push({ ...normalized, equippedSlot: undefined });
      inventoryIds.add(normalized.id);
    }
  };

  for (const slot of EQUIPMENT_SLOT_IDS) {
    const item = source[slot];
    if (item) prepareItem(item, slot);
  }

  if (source.accessory) prepareItem(source.accessory, "accessory");

  entries.filter((entry) => entry.direct).forEach(placeItem);
  entries.filter((entry) => !entry.direct).forEach(placeItem);

  return {
    ...player,
    inventory: [...inventory, ...overflow],
    equipment,
    miniGameBackgrounds: player.miniGameBackgrounds || {
      ownedIds: ["system-grid"],
      selectedByGame: {},
      galleryBackgrounds: [],
    },
  };
}
