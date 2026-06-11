import { DAILY_COMPLETION_REWARD, QUEST_TARGETS, QUEST_XP_WEIGHTS } from "./gameConfig";
import type {
  DailyQuestItem,
  DailyQuestProgress,
  DailyQuestState,
  DailyQuestStat,
  DailyQuestTrackableId,
} from "../types";

type CatalogExerciseLike = {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string[];
};

type DailyQuestDerivationSource = Partial<DailyQuestItem> & {
  name?: string;
  category?: string;
  primaryMuscles?: string[];
};

export const DEFAULT_DAILY_QUEST_ITEMS: DailyQuestItem[] = [
  {
    id: "pushups",
    label: "Pompki",
    unit: "powt.",
    target: QUEST_TARGETS.pushups,
    manualSmall: 1,
    manualLarge: 10,
    stat: "STR",
    trackableExerciseId: "pushups",
    catalogExerciseId: "pompki-klasyczne",
    enabled: true,
  },
  {
    id: "situps",
    label: "Brzuszki",
    unit: "powt.",
    target: QUEST_TARGETS.situps,
    manualSmall: 1,
    manualLarge: 10,
    stat: "VITALITY",
    trackableExerciseId: "situps",
    enabled: true,
  },
  {
    id: "squats",
    label: "Przysiady",
    unit: "powt.",
    target: QUEST_TARGETS.squats,
    manualSmall: 1,
    manualLarge: 10,
    stat: "AGILITY",
    trackableExerciseId: "squats",
    catalogExerciseId: "przysiad-klasyczny",
    enabled: true,
  },
  {
    id: "runningKm",
    label: "Bieganie",
    unit: "km",
    target: QUEST_TARGETS.runningKm,
    manualSmall: 0.1,
    manualLarge: 1,
    stat: "SENSE",
    trackableExerciseId: "runningKm",
    enabled: true,
  },
];

export function normalizeDailyQuest(raw: Partial<DailyQuestState> | undefined | null): DailyQuestState {
  const source = raw || {};
  const sourceItems = Array.isArray(source.items) && source.items.length > 0
    ? source.items
    : DEFAULT_DAILY_QUEST_ITEMS;
  const items = sourceItems
    .map((item) => normalizeDailyQuestItem(item))
    .filter((item): item is DailyQuestItem => Boolean(item));

  const safeItems = items.length > 0 ? items : DEFAULT_DAILY_QUEST_ITEMS.map((item) => ({ ...item }));
  const progressByItemId: DailyQuestProgress = {};
  for (const item of safeItems) {
    const explicit = Number(source.progressByItemId?.[item.id]);
    const legacy = item.trackableExerciseId ? Number(source[item.trackableExerciseId] || 0) : 0;
    const value = Number.isFinite(explicit) ? explicit : legacy;
    progressByItemId[item.id] = clampNumber(value, 0, item.target);
  }

  return syncLegacyDailyQuestFields({
    pushups: Number(source.pushups || 0),
    situps: Number(source.situps || 0),
    squats: Number(source.squats || 0),
    runningKm: Number(source.runningKm || 0),
    items: safeItems,
    progressByItemId,
    completedAt: typeof source.completedAt === "string" ? source.completedAt : null,
    penaltyGiven: Boolean(source.penaltyGiven),
    miniGamesPlayed: Number.isFinite(Number(source.miniGamesPlayed)) ? Math.max(0, Math.floor(Number(source.miniGamesPlayed))) : 0,
    streak: Number.isFinite(Number(source.streak)) ? Math.max(0, Math.floor(Number(source.streak))) : 0,
  });
}

export function resetDailyQuestProgress(dailyQuest: DailyQuestState, streak: number) {
  const normalized = normalizeDailyQuest(dailyQuest);
  const progressByItemId = Object.fromEntries(
    normalized.items.map((item) => [item.id, 0])
  ) as DailyQuestProgress;

  return syncLegacyDailyQuestFields({
    ...normalized,
    progressByItemId,
    completedAt: null,
    penaltyGiven: false,
    miniGamesPlayed: 0,
    streak,
  });
}

export function completeDailyQuestProgress(dailyQuest: DailyQuestState) {
  const normalized = normalizeDailyQuest(dailyQuest);
  const progressByItemId = Object.fromEntries(
    normalized.items.map((item) => [item.id, item.target])
  ) as DailyQuestProgress;

  return syncLegacyDailyQuestFields({
    ...normalized,
    progressByItemId,
    completedAt: normalized.completedAt || new Date().toISOString(),
  });
}

export function syncLegacyDailyQuestFields(dailyQuest: DailyQuestState): DailyQuestState {
  const next = {
    ...dailyQuest,
    items: dailyQuest.items.map((item) => ({ ...item })),
    progressByItemId: { ...dailyQuest.progressByItemId },
  };

  next.pushups = getTrackableProgress(next, "pushups");
  next.situps = getTrackableProgress(next, "situps");
  next.squats = getTrackableProgress(next, "squats");
  next.runningKm = getTrackableProgress(next, "runningKm");
  return next;
}

export function getEnabledDailyQuestItems(dailyQuest: DailyQuestState) {
  return normalizeDailyQuest(dailyQuest).items.filter((item) => item.enabled);
}

export function getDailyQuestItemProgress(dailyQuest: DailyQuestState, itemId: string) {
  const normalized = normalizeDailyQuest(dailyQuest);
  const item = normalized.items.find((entry) => entry.id === itemId);
  if (!item) return 0;
  return clampNumber(Number(normalized.progressByItemId[itemId] || 0), 0, item.target);
}

export function updateDailyQuestItemProgress(dailyQuest: DailyQuestState, itemId: string, amount: number) {
  const normalized = normalizeDailyQuest(dailyQuest);
  const item = normalized.items.find((entry) => entry.id === itemId && entry.enabled);
  if (!item) return { dailyQuest: normalized, item: null, previous: 0, next: 0, delta: 0 };

  const previous = getDailyQuestItemProgress(normalized, item.id);
  const next = clampNumber(previous + amount, 0, item.target);
  const delta = Number((next - previous).toFixed(2));

  return {
    dailyQuest: syncLegacyDailyQuestFields({
      ...normalized,
      progressByItemId: {
        ...normalized.progressByItemId,
        [item.id]: next,
      },
    }),
    item,
    previous,
    next,
    delta,
  };
}

export function getDailyQuestProgress(dailyQuest: DailyQuestState) {
  const items = getEnabledDailyQuestItems(dailyQuest);
  if (items.length === 0) {
    return { percent: 0, completedCount: 0, totalCount: 0 };
  }

  const parts = items.map((item) => Math.min(1, getDailyQuestItemProgress(dailyQuest, item.id) / item.target));
  return {
    percent: (parts.reduce((sum, part) => sum + part, 0) / parts.length) * 100,
    completedCount: parts.filter((part) => part >= 1).length,
    totalCount: items.length,
  };
}

export function isDailyQuestComplete(dailyQuest: DailyQuestState) {
  const progress = getDailyQuestProgress(dailyQuest);
  return progress.totalCount > 0 && progress.completedCount >= progress.totalCount;
}

export function getIncompleteDailyQuestItems(dailyQuest: DailyQuestState) {
  return getEnabledDailyQuestItems(dailyQuest).filter((item) => getDailyQuestItemProgress(dailyQuest, item.id) < item.target);
}

export function findDailyQuestItemByTrackable(dailyQuest: DailyQuestState, trackableExerciseId: DailyQuestTrackableId) {
  return getEnabledDailyQuestItems(dailyQuest).find((item) => item.trackableExerciseId === trackableExerciseId) || null;
}

export function getDailyQuestXpForDelta(item: DailyQuestItem, delta: number) {
  if (delta <= 0) return 0;
  if (item.trackableExerciseId) {
    return delta * QUEST_XP_WEIGHTS[item.trackableExerciseId];
  }

  const unit = item.unit.toLowerCase();
  if (unit.includes("km")) return delta * QUEST_XP_WEIGHTS.runningKm;
  if (unit.includes("min")) return delta * 8;
  if (unit.includes("sek") || unit.includes("s")) return delta * 0.6;
  return delta * 2;
}

export function getDailyQuestCompletionReward() {
  return DAILY_COMPLETION_REWARD;
}

export function createDailyQuestItemFromCatalog(
  exercise: CatalogExerciseLike,
  existingItems: DailyQuestItem[],
  now = new Date()
): DailyQuestItem {
  const baseId = `daily_${exercise.id}`;
  const existingIds = new Set(existingItems.map((item) => item.id));
  const id = existingIds.has(baseId)
    ? `${baseId}_${now.getTime().toString(36)}`
    : baseId;

  const derived = deriveDailyQuestItemFields(exercise);

  return {
    id,
    label: exercise.name,
    unit: derived.unit,
    target: getDefaultTargetForCatalogExercise(exercise),
    manualSmall: derived.manualSmall,
    manualLarge: derived.manualLarge,
    stat: derived.stat,
    catalogExerciseId: exercise.id,
    trackableExerciseId: derived.trackableExerciseId,
    enabled: true,
  };
}

export function updateDailyQuestItems(dailyQuest: DailyQuestState, items: DailyQuestItem[]) {
  const normalized = normalizeDailyQuest(dailyQuest);
  const nextItems = items
    .map((item) => normalizeDailyQuestItem(item))
    .filter((item): item is DailyQuestItem => Boolean(item));
  const safeItems = nextItems.length > 0 ? nextItems : normalized.items;
  const progressByItemId: DailyQuestProgress = {};

  for (const item of safeItems) {
    progressByItemId[item.id] = clampNumber(Number(normalized.progressByItemId[item.id] || 0), 0, item.target);
  }

  return syncLegacyDailyQuestFields({
    ...normalized,
    items: safeItems,
    progressByItemId,
    completedAt: null,
  });
}

function normalizeDailyQuestItem(item: Partial<DailyQuestItem> | null | undefined): DailyQuestItem | null {
  if (!item || typeof item.id !== "string" || !item.id.trim()) return null;
  const target = clampNumber(Number(item.target), 1, 10000);
  const derived = deriveDailyQuestItemFields(item);
  const manualSmall = clampNumber(derived.manualSmall, 0.1, target);
  const manualLarge = clampNumber(derived.manualLarge, manualSmall, target);

  return {
    id: item.id.trim(),
    label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : "Ćwiczenie",
    unit: derived.unit,
    target,
    manualSmall,
    manualLarge,
    stat: derived.stat,
    catalogExerciseId: typeof item.catalogExerciseId === "string" ? item.catalogExerciseId : undefined,
    trackableExerciseId: derived.trackableExerciseId,
    enabled: item.enabled !== false,
  };
}

function getTrackableProgress(dailyQuest: DailyQuestState, trackableExerciseId: DailyQuestTrackableId) {
  return dailyQuest.items
    .filter((item) => item.trackableExerciseId === trackableExerciseId)
    .reduce((sum, item) => sum + Number(dailyQuest.progressByItemId[item.id] || 0), 0);
}

function normalizeTrackableId(value: unknown): DailyQuestTrackableId | undefined {
  return value === "pushups" || value === "situps" || value === "squats" || value === "runningKm"
    ? value
    : undefined;
}

function normalizeDailyQuestStat(value: unknown): DailyQuestStat {
  return value === "STR" || value === "VITALITY" || value === "AGILITY" || value === "INTELLIGENCE" || value === "SENSE"
    ? value
    : "STR";
}

export function deriveDailyQuestItemFields(source: DailyQuestDerivationSource): Pick<DailyQuestItem, "unit" | "manualSmall" | "manualLarge" | "stat"> & {
  trackableExerciseId?: DailyQuestTrackableId;
} {
  const existingTrackable = normalizeTrackableId(source.trackableExerciseId);
  const running = existingTrackable === "runningKm" || isRunningCatalogExercise(source);
  const trackableExerciseId = running ? "runningKm" : existingTrackable;
  const unit = running ? "km" : "powt.";

  return {
    unit,
    manualSmall: running ? 0.1 : 1,
    manualLarge: running ? 1 : 10,
    stat: inferDailyQuestStat(source, running),
    trackableExerciseId,
  };
}

export function isRunningCatalogExercise(source: DailyQuestDerivationSource): boolean {
  const haystack = normalizeText([
    source.id,
    source.catalogExerciseId,
    source.label,
    source.name,
    source.category,
    ...(source.primaryMuscles || []),
  ].filter(Boolean).join(" "));

  return ["bieg", "biegan", "running", "jogging", "marsz", "interwal", "shuttle"].some((token) => haystack.includes(token));
}

function inferDailyQuestStat(source: DailyQuestDerivationSource, running = isRunningCatalogExercise(source)): DailyQuestStat {
  if (running) return "SENSE";
  const explicit = normalizeDailyQuestStat(source.stat);
  const haystack = normalizeText(`${source.category || ""} ${(source.primaryMuscles || []).join(" ")} ${source.label || ""} ${source.name || ""}`);
  if (haystack.includes("brzuch") || haystack.includes("core") || haystack.includes("plank")) return "VITALITY";
  if (haystack.includes("nogi") || haystack.includes("lyd") || haystack.includes("poslad") || haystack.includes("przysiad")) return "AGILITY";
  if (haystack.includes("kondyc")) return "SENSE";
  if (haystack.includes("barki") || haystack.includes("plecy")) return "SENSE";
  return explicit;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getDefaultTargetForCatalogExercise(exercise: CatalogExerciseLike) {
  if (isRunningCatalogExercise(exercise)) return 10;
  return 30;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Number(Math.min(max, Math.max(min, value)).toFixed(2));
}
