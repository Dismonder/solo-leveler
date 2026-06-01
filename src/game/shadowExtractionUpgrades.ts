export type ShadowExtractionEffectId = "system-blue" | "violet-rune" | "blood-red" | "monarch-gold";
export type ShadowExtractionUpgradeId = "focus" | "flow" | "ward";

export type ShadowExtractionUpgrades = {
  ownedEffects: ShadowExtractionEffectId[];
  selectedEffect: ShadowExtractionEffectId;
  upgrades: Record<ShadowExtractionUpgradeId, number>;
};

export type ShadowExtractionEffectDefinition = {
  id: ShadowExtractionEffectId;
  name: string;
  cost: number;
  trailClass: string;
  glowClass: string;
};

export type ShadowExtractionUpgradeDefinition = {
  id: ShadowExtractionUpgradeId;
  name: string;
  maxLevel: number;
  costs: number[];
  description: string;
};

export const SHADOW_EXTRACTION_EFFECTS: ShadowExtractionEffectDefinition[] = [
  {
    id: "system-blue",
    name: "System Blue",
    cost: 0,
    trailClass: "from-cyan-100 via-cyan-300 to-sky-500",
    glowClass: "shadow-cyan-400/70",
  },
  {
    id: "violet-rune",
    name: "Violet Rune",
    cost: 140,
    trailClass: "from-fuchsia-100 via-violet-400 to-purple-700",
    glowClass: "shadow-violet-500/70",
  },
  {
    id: "blood-red",
    name: "Blood Edge",
    cost: 260,
    trailClass: "from-red-100 via-rose-400 to-red-700",
    glowClass: "shadow-red-500/70",
  },
  {
    id: "monarch-gold",
    name: "Monarch Gold",
    cost: 420,
    trailClass: "from-amber-100 via-yellow-300 to-orange-500",
    glowClass: "shadow-amber-400/70",
  },
];

export const SHADOW_EXTRACTION_UPGRADES: ShadowExtractionUpgradeDefinition[] = [
  {
    id: "focus",
    name: "Oko Systemu",
    maxLevel: 3,
    costs: [120, 240, 420],
    description: "Prawdziwe cienie są większe i łatwiejsze do przecięcia.",
  },
  {
    id: "flow",
    name: "Przepływ Many",
    maxLevel: 3,
    costs: [150, 300, 520],
    description: "Udane cięcia dodają trochę więcej czasu.",
  },
  {
    id: "ward",
    name: "Pieczęć Ochronna",
    maxLevel: 3,
    costs: [180, 360, 620],
    description: "Przeklęte rdzenie zabierają mniej czasu.",
  },
];

export function createDefaultShadowExtractionUpgrades(): ShadowExtractionUpgrades {
  return {
    ownedEffects: ["system-blue"],
    selectedEffect: "system-blue",
    upgrades: {
      focus: 0,
      flow: 0,
      ward: 0,
    },
  };
}

export function normalizeShadowExtractionUpgrades(
  upgrades?: Partial<ShadowExtractionUpgrades>
): ShadowExtractionUpgrades {
  const defaults = createDefaultShadowExtractionUpgrades();
  const ownedEffects = Array.from(
    new Set([...(upgrades?.ownedEffects || []), "system-blue"])
  ).filter(isShadowExtractionEffectId);
  const selectedEffect = isShadowExtractionEffectId(upgrades?.selectedEffect)
    && ownedEffects.includes(upgrades.selectedEffect)
    ? upgrades.selectedEffect
    : defaults.selectedEffect;

  return {
    ownedEffects,
    selectedEffect,
    upgrades: {
      focus: clampUpgradeLevel("focus", upgrades?.upgrades?.focus),
      flow: clampUpgradeLevel("flow", upgrades?.upgrades?.flow),
      ward: clampUpgradeLevel("ward", upgrades?.upgrades?.ward),
    },
  };
}

export function getShadowExtractionEffect(id: ShadowExtractionEffectId) {
  return SHADOW_EXTRACTION_EFFECTS.find((effect) => effect.id === id) ?? SHADOW_EXTRACTION_EFFECTS[0];
}

export function getShadowExtractionUpgrade(id: ShadowExtractionUpgradeId) {
  return SHADOW_EXTRACTION_UPGRADES.find((upgrade) => upgrade.id === id) ?? SHADOW_EXTRACTION_UPGRADES[0];
}

export function getNextShadowExtractionUpgradeCost(
  upgrades: ShadowExtractionUpgrades,
  id: ShadowExtractionUpgradeId
) {
  const definition = getShadowExtractionUpgrade(id);
  const level = upgrades.upgrades[id] || 0;
  if (level >= definition.maxLevel) return null;
  return definition.costs[level] ?? null;
}

export function canBuyShadowExtractionEffect(
  upgrades: ShadowExtractionUpgrades,
  effectId: ShadowExtractionEffectId,
  gold: number
) {
  const effect = getShadowExtractionEffect(effectId);
  return upgrades.ownedEffects.includes(effectId) || gold >= effect.cost;
}

export function canBuyShadowExtractionUpgrade(
  upgrades: ShadowExtractionUpgrades,
  upgradeId: ShadowExtractionUpgradeId,
  gold: number
) {
  const cost = getNextShadowExtractionUpgradeCost(upgrades, upgradeId);
  return cost !== null && gold >= cost;
}

function isShadowExtractionEffectId(value: unknown): value is ShadowExtractionEffectId {
  return typeof value === "string" && SHADOW_EXTRACTION_EFFECTS.some((effect) => effect.id === value);
}

function clampUpgradeLevel(id: ShadowExtractionUpgradeId, value: unknown) {
  const definition = getShadowExtractionUpgrade(id);
  const numeric = typeof value === "number" ? value : 0;
  return Math.max(0, Math.min(definition.maxLevel, Math.floor(numeric)));
}
