import type { DailyPenalty, PenaltyIntensity, PenaltySettings } from "../types";

export const PENALTY_EXERCISES = [
  {
    id: "burpees",
    name: "Burpees",
    targetByIntensity: { light: 12, normal: 20, hard: 32 },
    description: "Pełne zejście do podporu, wyskok, spokojny oddech i równe tempo.",
  },
  {
    id: "plank",
    name: "Plank",
    targetByIntensity: { light: 45, normal: 75, hard: 120 },
    description: "Napięty brzuch i pośladki, łokcie pod barkami. Liczone w sekundach.",
  },
  {
    id: "mountain-climbers",
    name: "Mountain climbers",
    targetByIntensity: { light: 40, normal: 70, hard: 110 },
    description: "Kolana dynamicznie do klatki, biodra nisko, bez zapadania pleców.",
  },
  {
    id: "wall-sit",
    name: "Wall sit",
    targetByIntensity: { light: 45, normal: 75, hard: 120 },
    description: "Plecy przy ścianie, kolana blisko 90 stopni. Liczone w sekundach.",
  },
  {
    id: "lunges",
    name: "Wykroki",
    targetByIntensity: { light: 24, normal: 40, hard: 64 },
    description: "Naprzemienne nogi, kolano prowadzące stabilne, tułów wyprostowany.",
  },
  {
    id: "jumping-jacks",
    name: "Pajacyki",
    targetByIntensity: { light: 50, normal: 90, hard: 140 },
    description: "Równy rytm, miękkie lądowanie, ramiona pracują pełnym zakresem.",
  },
] as const;

export type PenaltyExerciseTemplate = (typeof PENALTY_EXERCISES)[number];

export const DEFAULT_PENALTY_SETTINGS: PenaltySettings = {
  penaltyExercisesEnabled: false,
  funnyPenaltiesEnabled: false,
  phonePranksEnabled: false,
  wallpaperPenaltyEnabled: false,
  fontPenaltyEnabled: false,
  penaltyIntensity: "normal",
  penaltyConsentSeen: false,
};

const PHONE_PENALTY_TYPES: Array<DailyPenalty["type"]> = ["wallpaper", "font"];

export function normalizePenaltySettings(settings?: Partial<PenaltySettings> | null): PenaltySettings {
  const intensity = settings?.penaltyIntensity;
  const phonePranksExplicitlyConfigured = Boolean(settings?.penaltyConsentSeen);
  const normalized = {
    ...DEFAULT_PENALTY_SETTINGS,
    ...(settings || {}),
    penaltyExercisesEnabled: Boolean(settings?.penaltyExercisesEnabled),
    penaltyIntensity: isPenaltyIntensity(intensity) ? intensity : DEFAULT_PENALTY_SETTINGS.penaltyIntensity,
  };

  if (!phonePranksExplicitlyConfigured) {
    normalized.funnyPenaltiesEnabled = false;
    normalized.phonePranksEnabled = false;
    normalized.wallpaperPenaltyEnabled = false;
    normalized.fontPenaltyEnabled = false;
  }

  return normalized;
}

export function normalizePenalties(penalties?: DailyPenalty[] | null): DailyPenalty[] {
  if (!Array.isArray(penalties)) return [];

  return penalties
    .filter((penalty): penalty is DailyPenalty => Boolean(penalty?.id && penalty.missedDateKey && penalty.exerciseId))
    .map((penalty) => {
      const activePhonePenalty = penalty.status !== "completed" && (penalty.type === "wallpaper" || penalty.type === "font");
      return {
        ...penalty,
        type: activePhonePenalty ? "appExercise" : penalty.type,
        status: penalty.status || "active",
        requiredAmount: Math.max(1, Number(penalty.requiredAmount || 1)),
        appliedWallpaper: activePhonePenalty ? false : Boolean(penalty.appliedWallpaper),
        appliedFont: activePhonePenalty ? false : Boolean(penalty.appliedFont),
        phoneAttempted: activePhonePenalty ? false : Boolean(penalty.phoneAttempted),
      };
    });
}


export function getActivePenalty(penalties?: DailyPenalty[] | null) {
  return normalizePenalties(penalties).find((penalty) => penalty.status === "active") || null;
}

export function getPenaltyRewardMultiplier(penalties?: DailyPenalty[] | null) {
  return getActivePenalty(penalties) ? 0.55 : 1;
}

export function ensureDailyPenalty(
  penalties: DailyPenalty[] | undefined,
  missedDateKey: string,
  settingsInput: PenaltySettings,
  nowIso = new Date().toISOString()
) {
  const settings = normalizePenaltySettings(settingsInput);
  const normalized = normalizePenalties(penalties);
  const existing = normalized.find((penalty) => penalty.missedDateKey === missedDateKey);
  if (existing) {
    return normalized;
  }

  if (!settings.penaltyExercisesEnabled && !settings.phonePranksEnabled) {
    return normalized;
  }

  return [...normalized, createDailyPenalty(missedDateKey, settings, nowIso)];
}


export function createDailyPenalty(
  missedDateKey: string,
  settingsInput: PenaltySettings,
  nowIso = new Date().toISOString()
): DailyPenalty {
  const settings = normalizePenaltySettings(settingsInput);
  const intensity = settings.penaltyIntensity;
  const exercise = pickPenaltyExercise(missedDateKey);
  const type = pickPenaltyType(missedDateKey, settings);

  return {
    id: `penalty_${missedDateKey}_${hashString(missedDateKey).toString(36)}`,
    missedDateKey,
    createdAt: nowIso,
    completedAt: null,
    type,
    status: "active",
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    exerciseDescription: exercise.description,
    requiredAmount: exercise.targetByIntensity[intensity],
    intensity,
    appliedWallpaper: false,
    appliedFont: false,
    phoneAttempted: false,
  };
}

export function completePenalty(penalties: DailyPenalty[], penaltyId: string, nowIso = new Date().toISOString()) {
  return normalizePenalties(penalties).map((penalty) =>
    penalty.id === penaltyId
      ? {
          ...penalty,
          status: "completed" as const,
          completedAt: nowIso,
        }
      : penalty
  );
}

export function markPenaltyPhoneAttempt(
  penalties: DailyPenalty[],
  penaltyId: string,
  patch: Pick<Partial<DailyPenalty>, "appliedWallpaper" | "appliedFont" | "phoneAttempted">
) {
  return normalizePenalties(penalties).map((penalty) =>
    penalty.id === penaltyId
      ? {
          ...penalty,
          ...patch,
          phoneAttempted: true,
        }
      : penalty
  );
}

function pickPenaltyExercise(seed: string): PenaltyExerciseTemplate {
  return PENALTY_EXERCISES[hashString(seed) % PENALTY_EXERCISES.length];
}

function pickPenaltyType(seed: string, settings: PenaltySettings): DailyPenalty["type"] {
  if (!settings.funnyPenaltiesEnabled || !settings.phonePranksEnabled) return "appExercise";

  const candidates = PHONE_PENALTY_TYPES.filter((type) =>
    type === "wallpaper" ? settings.wallpaperPenaltyEnabled : settings.fontPenaltyEnabled
  );

  if (candidates.length === 0) return "appExercise";
  return candidates[hashString(`${seed}:phone`) % candidates.length];
}

function isPenaltyIntensity(value: unknown): value is PenaltyIntensity {
  return value === "light" || value === "normal" || value === "hard";
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}
