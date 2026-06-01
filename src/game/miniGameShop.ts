import type { MiniGameId } from "./miniGameProgress";

export type MiniGameShopEffectId =
  | "system-aura"
  | "monarch-runes"
  | "blood-sparks"
  | "gold-trace"
  | "void-pulse";

export type MiniGameShopUpgradeId = "precision" | "stability" | "tempo" | "ward";
export type MiniGameShopBoosterId = "xp-contract" | "focus-ampoule" | "time-sigil";

export type MiniGameShopState = {
  ownedEffects: Partial<Record<MiniGameId, MiniGameShopEffectId[]>>;
  selectedEffectByGame: Partial<Record<MiniGameId, MiniGameShopEffectId>>;
  upgrades: Partial<Record<MiniGameId, Partial<Record<MiniGameShopUpgradeId, number>>>>;
  boosters: Partial<Record<MiniGameId, Partial<Record<MiniGameShopBoosterId, number>>>>;
  activeBoosterByGame: Partial<Record<MiniGameId, MiniGameShopBoosterId | null>>;
};

export type MiniGameShopBonusSummary = {
  scoreBonus: number;
  targetLifetime: number;
  hitWindow: number;
  timePenaltyResist: number;
  xpMultiplier: number;
  activeBoosterId: MiniGameShopBoosterId | null;
  activeBoosterName: string | null;
};

export type MiniGameShopEffectDefinition = {
  id: MiniGameShopEffectId;
  name: string;
  cost: number;
  description: string;
  accent: string;
};

export type MiniGameShopUpgradeDefinition = {
  id: MiniGameShopUpgradeId;
  name: string;
  maxLevel: number;
  costs: number[];
  descriptionByGame: Record<MiniGameId, string>;
  bonus: Partial<Omit<MiniGameShopBonusSummary, "xpMultiplier" | "activeBoosterId" | "activeBoosterName">>;
};

export type MiniGameShopBoosterDefinition = {
  id: MiniGameShopBoosterId;
  name: string;
  cost: number;
  description: string;
  bonus: Partial<Omit<MiniGameShopBonusSummary, "activeBoosterId" | "activeBoosterName">>;
};

export const MINI_GAME_SHOP_EFFECTS: MiniGameShopEffectDefinition[] = [
  {
    id: "system-aura",
    name: "Aura Systemu",
    cost: 0,
    description: "Czysty, lekki efekt energii wokół planszy.",
    accent: "#67e8f9",
  },
  {
    id: "monarch-runes",
    name: "Runy Monarchii",
    cost: 260,
    description: "Pionowe runy i subtelny deszcz kodu nad planszą.",
    accent: "#a78bfa",
  },
  {
    id: "blood-sparks",
    name: "Krwawe Iskry",
    cost: 340,
    description: "Czerwone rozbłyski przy akcji i ciemniejszy klimat rundy.",
    accent: "#fb7185",
  },
  {
    id: "gold-trace",
    name: "Złoty Ślad",
    cost: 520,
    description: "Złote przebłyski i efekt łupu bez zmiany balansu.",
    accent: "#facc15",
  },
  {
    id: "void-pulse",
    name: "Puls Otchłani",
    cost: 680,
    description: "Rzadki efekt ciemnej fali. Kosmetyczny, ale mocno widoczny.",
    accent: "#38bdf8",
  },
];

export const MINI_GAME_SHOP_UPGRADES: MiniGameShopUpgradeDefinition[] = [
  {
    id: "precision",
    name: "Precyzja Systemu",
    maxLevel: 4,
    costs: [110, 240, 420, 720],
    bonus: { hitWindow: 0.014 },
    descriptionByGame: {
      "gate-dodge": "Rdzenie bramy mają minimalnie większe okno kliknięcia.",
      "shadow-strike": "Perfekcyjny punkt kontrataku jest odrobinę szerszy.",
      "mana-memory": "Sekwencje many są czytelniejsze przy szybkim tempie.",
      "rune-lock": "Pieczęcie runiczne tolerują drobne opóźnienie.",
      "shadow-extraction": "Cięcie ma minimalnie szerszą tolerancję trafienia.",
    },
  },
  {
    id: "stability",
    name: "Stabilizacja Celu",
    maxLevel: 4,
    costs: [130, 280, 480, 820],
    bonus: { targetLifetime: 70 },
    descriptionByGame: {
      "gate-dodge": "Rdzeń many zostaje na planszy chwilę dłużej.",
      "shadow-strike": "Rytm ataku jest trochę łatwiejszy do odczytania.",
      "mana-memory": "Runy świecą odrobinę dłużej.",
      "rune-lock": "Kod bramy ma trochę dłuższą stabilność.",
      "shadow-extraction": "Cienie nie wygasają tak szybko.",
    },
  },
  {
    id: "tempo",
    name: "Tempo Łowcy",
    maxLevel: 3,
    costs: [180, 390, 720],
    bonus: { scoreBonus: 0.018 },
    descriptionByGame: {
      "gate-dodge": "Dobre serie dają mały bonus punktów.",
      "shadow-strike": "Kontrataki budują wynik trochę szybciej.",
      "mana-memory": "Pełne sekwencje many dają mały bonus punktów.",
      "rune-lock": "Zamknięte pieczęcie dają mały bonus punktów.",
      "shadow-extraction": "Udane ekstrakcje dają mały bonus punktów.",
    },
  },
  {
    id: "ward",
    name: "Ochrona Bramy",
    maxLevel: 3,
    costs: [210, 460, 840],
    bonus: { timePenaltyResist: 0.025 },
    descriptionByGame: {
      "gate-dodge": "Pułapki zabierają trochę mniej czasu.",
      "shadow-strike": "Spóźniony zamach jest mniej bolesny.",
      "mana-memory": "Błędna runa zabiera trochę mniej czasu.",
      "rune-lock": "Fałszywy znak mniej karze licznik.",
      "shadow-extraction": "Bomby i fałszywe cienie są mniej karzące.",
    },
  },
];

export const MINI_GAME_SHOP_BOOSTERS: MiniGameShopBoosterDefinition[] = [
  {
    id: "xp-contract",
    name: "Kontrakt XP",
    cost: 120,
    description: "Jedna runda: +25% XP po rozliczeniu wyniku.",
    bonus: { xpMultiplier: 1.25 },
  },
  {
    id: "focus-ampoule",
    name: "Ampułka Skupienia",
    cost: 150,
    description: "Jedna runda: +5% punktów i trochę większe okno trafienia.",
    bonus: { scoreBonus: 0.05, hitWindow: 0.025, xpMultiplier: 1.08 },
  },
  {
    id: "time-sigil",
    name: "Pieczęć Czasu",
    cost: 170,
    description: "Jedna runda: cele żyją dłużej, a kary czasu są mniejsze.",
    bonus: { targetLifetime: 180, timePenaltyResist: 0.06, xpMultiplier: 1.05 },
  },
];

const DEFAULT_EFFECT: MiniGameShopEffectId = "system-aura";
const EFFECT_IDS = new Set(MINI_GAME_SHOP_EFFECTS.map((effect) => effect.id));
const UPGRADE_IDS = new Set(MINI_GAME_SHOP_UPGRADES.map((upgrade) => upgrade.id));
const BOOSTER_IDS = new Set(MINI_GAME_SHOP_BOOSTERS.map((booster) => booster.id));
const MINI_GAME_IDS: MiniGameId[] = ["gate-dodge", "shadow-strike", "mana-memory", "rune-lock", "shadow-extraction"];

const SHOP_BONUS_CAPS = {
  scoreBonus: 0.08,
  targetLifetime: 320,
  hitWindow: 0.07,
  timePenaltyResist: 0.1,
  xpMultiplier: 1.45,
};

export function createDefaultMiniGameShop(): MiniGameShopState {
  return {
    ownedEffects: Object.fromEntries(MINI_GAME_IDS.map((id) => [id, [DEFAULT_EFFECT]])),
    selectedEffectByGame: Object.fromEntries(MINI_GAME_IDS.map((id) => [id, DEFAULT_EFFECT])),
    upgrades: Object.fromEntries(MINI_GAME_IDS.map((id) => [id, {}])),
    boosters: Object.fromEntries(MINI_GAME_IDS.map((id) => [id, {}])),
    activeBoosterByGame: {},
  } as MiniGameShopState;
}

export function normalizeMiniGameShop(input: unknown): MiniGameShopState {
  const source = input && typeof input === "object" ? input as Partial<MiniGameShopState> : {};
  const defaults = createDefaultMiniGameShop();
  const ownedEffects: MiniGameShopState["ownedEffects"] = {};
  const selectedEffectByGame: MiniGameShopState["selectedEffectByGame"] = {};
  const upgrades: MiniGameShopState["upgrades"] = {};
  const boosters: MiniGameShopState["boosters"] = {};
  const activeBoosterByGame: MiniGameShopState["activeBoosterByGame"] = {};

  for (const gameId of MINI_GAME_IDS) {
    const owned = Array.from(new Set([DEFAULT_EFFECT, ...((source.ownedEffects?.[gameId] || []) as unknown[])]))
      .filter(isMiniGameShopEffectId);
    ownedEffects[gameId] = owned;
    const selected = isMiniGameShopEffectId(source.selectedEffectByGame?.[gameId]) && owned.includes(source.selectedEffectByGame?.[gameId] as MiniGameShopEffectId)
      ? source.selectedEffectByGame?.[gameId] as MiniGameShopEffectId
      : DEFAULT_EFFECT;
    selectedEffectByGame[gameId] = selected;

    upgrades[gameId] = {};
    for (const definition of MINI_GAME_SHOP_UPGRADES) {
      const raw = source.upgrades?.[gameId]?.[definition.id];
      const numeric = typeof raw === "number" ? raw : Number(raw || 0);
      upgrades[gameId]![definition.id] = Math.max(0, Math.min(definition.maxLevel, Math.floor(Number.isFinite(numeric) ? numeric : 0)));
    }

    boosters[gameId] = {};
    for (const booster of MINI_GAME_SHOP_BOOSTERS) {
      const raw = source.boosters?.[gameId]?.[booster.id];
      const numeric = typeof raw === "number" ? raw : Number(raw || 0);
      boosters[gameId]![booster.id] = Math.max(0, Math.min(99, Math.floor(Number.isFinite(numeric) ? numeric : 0)));
    }

    const active = source.activeBoosterByGame?.[gameId];
    activeBoosterByGame[gameId] = isMiniGameShopBoosterId(active) && (boosters[gameId]?.[active] || 0) > 0 ? active : null;
  }

  return {
    ...defaults,
    ownedEffects,
    selectedEffectByGame,
    upgrades,
    boosters,
    activeBoosterByGame,
  };
}

export function getMiniGameShopEffect(id: MiniGameShopEffectId | string | null | undefined) {
  return MINI_GAME_SHOP_EFFECTS.find((effect) => effect.id === id) ?? MINI_GAME_SHOP_EFFECTS[0];
}

export function getSelectedMiniGameShopEffect(shop: unknown, gameId: MiniGameId) {
  const normalized = normalizeMiniGameShop(shop);
  return getMiniGameShopEffect(normalized.selectedEffectByGame[gameId]);
}

export function getMiniGameShopUpgrade(id: MiniGameShopUpgradeId) {
  return MINI_GAME_SHOP_UPGRADES.find((upgrade) => upgrade.id === id) ?? MINI_GAME_SHOP_UPGRADES[0];
}

export function getMiniGameShopBooster(id: MiniGameShopBoosterId) {
  return MINI_GAME_SHOP_BOOSTERS.find((booster) => booster.id === id) ?? MINI_GAME_SHOP_BOOSTERS[0];
}

export function getNextMiniGameUpgradeCost(shop: MiniGameShopState, gameId: MiniGameId, upgradeId: MiniGameShopUpgradeId) {
  const definition = getMiniGameShopUpgrade(upgradeId);
  const level = shop.upgrades[gameId]?.[upgradeId] || 0;
  if (level >= definition.maxLevel) return null;
  return definition.costs[level] ?? null;
}

export function getMiniGameShopBonuses(shop: unknown, gameId: MiniGameId): MiniGameShopBonusSummary {
  const normalized = normalizeMiniGameShop(shop);
  const summary: MiniGameShopBonusSummary = {
    scoreBonus: 0,
    targetLifetime: 0,
    hitWindow: 0,
    timePenaltyResist: 0,
    xpMultiplier: 1,
    activeBoosterId: null,
    activeBoosterName: null,
  };

  for (const upgrade of MINI_GAME_SHOP_UPGRADES) {
    const level = normalized.upgrades[gameId]?.[upgrade.id] || 0;
    applyShopBonus(summary, upgrade.bonus, level);
  }

  const activeBoosterId = normalized.activeBoosterByGame[gameId];
  if (activeBoosterId) {
    const booster = getMiniGameShopBooster(activeBoosterId);
    applyShopBonus(summary, booster.bonus, 1);
    summary.activeBoosterId = booster.id;
    summary.activeBoosterName = booster.name;
  }

  return capShopBonusSummary(summary);
}

export function consumeActiveMiniGameBooster(shop: unknown, gameId: MiniGameId): MiniGameShopState {
  const normalized = normalizeMiniGameShop(shop);
  const boosterId = normalized.activeBoosterByGame[gameId];
  if (!boosterId) return normalized;
  const current = normalized.boosters[gameId]?.[boosterId] || 0;
  return {
    ...normalized,
    boosters: {
      ...normalized.boosters,
      [gameId]: {
        ...(normalized.boosters[gameId] || {}),
        [boosterId]: Math.max(0, current - 1),
      },
    },
    activeBoosterByGame: {
      ...normalized.activeBoosterByGame,
      [gameId]: null,
    },
  };
}

export function isMiniGameShopEffectId(value: unknown): value is MiniGameShopEffectId {
  return typeof value === "string" && EFFECT_IDS.has(value as MiniGameShopEffectId);
}

export function isMiniGameShopUpgradeId(value: unknown): value is MiniGameShopUpgradeId {
  return typeof value === "string" && UPGRADE_IDS.has(value as MiniGameShopUpgradeId);
}

export function isMiniGameShopBoosterId(value: unknown): value is MiniGameShopBoosterId {
  return typeof value === "string" && BOOSTER_IDS.has(value as MiniGameShopBoosterId);
}

function applyShopBonus(summary: MiniGameShopBonusSummary, bonus: MiniGameShopBoosterDefinition["bonus"], level: number) {
  if (level <= 0) return;
  summary.scoreBonus += (bonus.scoreBonus || 0) * level;
  summary.targetLifetime += (bonus.targetLifetime || 0) * level;
  summary.hitWindow += (bonus.hitWindow || 0) * level;
  summary.timePenaltyResist += (bonus.timePenaltyResist || 0) * level;
  if (bonus.xpMultiplier && bonus.xpMultiplier > 1) {
    summary.xpMultiplier *= Math.pow(bonus.xpMultiplier, level);
  }
}

function capShopBonusSummary(summary: MiniGameShopBonusSummary): MiniGameShopBonusSummary {
  return {
    ...summary,
    scoreBonus: Math.min(SHOP_BONUS_CAPS.scoreBonus, summary.scoreBonus),
    targetLifetime: Math.min(SHOP_BONUS_CAPS.targetLifetime, summary.targetLifetime),
    hitWindow: Math.min(SHOP_BONUS_CAPS.hitWindow, summary.hitWindow),
    timePenaltyResist: Math.min(SHOP_BONUS_CAPS.timePenaltyResist, summary.timePenaltyResist),
    xpMultiplier: Math.min(SHOP_BONUS_CAPS.xpMultiplier, Math.max(1, summary.xpMultiplier)),
  };
}
