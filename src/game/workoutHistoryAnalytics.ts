import type { WorkoutPlanSessionSummary } from "../types";
import type { ExerciseCatalogEntry } from "../data/exerciseCatalog";
import type { UnifiedDayRecord, UnifiedHistoryEvent } from "../data/unifiedHistory";

export type VolumeMetricType = "volumeKg" | "minutes" | "sets" | "xp";

export type VolumeDataPoint = {
  date: string;
  label: string;
  volumeKg: number;
  minutes: number;
  sets: number;
  xp: number;
};

export type MuscleDistributionItem = {
  muscle: string;
  category: string;
  sets: number;
  volumeKg: number;
  percentage: number;
};

export type HunterPersonalRecord = {
  id: string;
  category: "volume" | "speed" | "streak" | "sets" | "endurance";
  title: string;
  value: string;
  subtitle: string;
  badge: string;
};

export type DetailedSessionItem = {
  id: string;
  title: string;
  date: string;
  timeAgo: string;
  durationSeconds: number;
  durationFormatted: string;
  totalSets: number;
  totalVolumeKg: number;
  xpEarned: number;
  goldEarned: number;
  paceGrade: "BŁYSKAWICZNE" | "WZOROWE" | "SPOKOJNE";
  exercises: Array<{
    name: string;
    targetSets: number;
    completedSets: number;
    reps: number;
    weightKg: number;
    volumeKg: number;
  }>;
};

const MUSCLE_CATEGORY_MAP: Record<string, string> = {
  klatka: "Klatka piersiowa",
  "gorna klatka": "Klatka piersiowa",
  "dolna klatka": "Klatka piersiowa",
  plecy: "Plecy",
  "najszerszy grzbietu": "Plecy",
  najszerszy: "Plecy",
  "srodek plecow": "Plecy",
  czworoboczny: "Plecy",
  lopatki: "Plecy",
  prostowniki: "Plecy",
  nogi: "Nogi",
  czworoglowe: "Nogi",
  "dwuglowe uda": "Nogi",
  dwuglowe: "Nogi",
  posladki: "Nogi",
  przywodziciele: "Nogi",
  lydki: "Nogi",
  barki: "Barki",
  "przedni akton": "Barki",
  "boczny akton": "Barki",
  "tyl barku": "Barki",
  rotatory: "Barki",
  ramiona: "Ramiona",
  biceps: "Ramiona",
  triceps: "Ramiona",
  przedramiona: "Ramiona",
  brzuch: "Brzuch i core",
  core: "Brzuch i core",
  "prosty brzucha": "Brzuch i core",
  "skosne brzucha": "Brzuch i core",
  "dolny brzuch": "Brzuch i core",
};

export function computeVolumeHistory(
  days: readonly UnifiedDayRecord[],
  sessions: readonly WorkoutPlanSessionSummary[]
): VolumeDataPoint[] {
  if (days.length === 0 && sessions.length === 0) {
    return [];
  }

  // Group sessions by date string (YYYY-MM-DD)
  const sessionMap = new Map<string, { volumeKg: number; seconds: number; sets: number; xp: number }>();

  for (const session of sessions) {
    const dateStr = (session.startedAt || session.dateKey || "").slice(0, 10);
    const existing = sessionMap.get(dateStr) ?? { volumeKg: 0, seconds: 0, sets: 0, xp: 0 };

    existing.volumeKg += session.volumeKg || 0;
    existing.seconds += session.activeSeconds || 0;
    existing.sets += session.completedSets || 0;
    existing.xp += session.xpReward || 0;
    sessionMap.set(dateStr, existing);
  }

  // Map each day in unified record
  return days.map((day) => {
    const sessionData = sessionMap.get(day.date);
    const label = day.date.slice(5).replace("-", ".");
    const daySeconds = day.planDurationSeconds + (sessionData?.seconds || 0);
    const dayVolume = day.planVolumeKg || sessionData?.volumeKg || 0;
    const daySets = day.planSetsCompleted || sessionData?.sets || 0;
    const dayXp = day.xpEarned + (sessionData?.xp || 0);

    return {
      date: day.date,
      label,
      volumeKg: dayVolume,
      minutes: Math.round(daySeconds / 60),
      sets: daySets,
      xp: dayXp,
    };
  });
}

export function computeMuscleGroupDistribution(
  sessions: readonly WorkoutPlanSessionSummary[],
  catalog: readonly ExerciseCatalogEntry[]
): MuscleDistributionItem[] {
  const catalogMap = new Map<string, ExerciseCatalogEntry>();
  for (const entry of catalog) {
    catalogMap.set(entry.id, entry);
    catalogMap.set(entry.name.toLowerCase(), entry);
  }

  const categorySets = new Map<string, { sets: number; volumeKg: number }>();
  const defaultCategories = ["Klatka piersiowa", "Plecy", "Nogi", "Barki", "Ramiona", "Brzuch i core"];
  for (const cat of defaultCategories) {
    categorySets.set(cat, { sets: 0, volumeKg: 0 });
  }

  let totalSets = 0;

  for (const session of sessions) {
    for (const ex of session.exercises || []) {
      const catalogEntry = catalogMap.get(ex.catalogExerciseId) ?? catalogMap.get(ex.name.toLowerCase());
      let category = catalogEntry?.category || ex.category;

      if (!category && (catalogEntry?.primaryMuscles?.length || ex.primaryMuscles?.length)) {
        const firstMuscle = (catalogEntry?.primaryMuscles?.[0] || ex.primaryMuscles?.[0] || "").toLowerCase();
        category = MUSCLE_CATEGORY_MAP[firstMuscle] ?? "Inne";
      }

      if (!category) {
        // Fallback guess from name
        const lowerName = ex.name.toLowerCase();
        if (lowerName.includes("pompk") || lowerName.includes("klat")) category = "Klatka piersiowa";
        else if (lowerName.includes("podciag") || lowerName.includes("plec") || lowerName.includes("wiosl")) category = "Plecy";
        else if (lowerName.includes("przysiad") || lowerName.includes("wykrok") || lowerName.includes("nog")) category = "Nogi";
        else if (lowerName.includes("bark") || lowerName.includes("zolnierskie")) category = "Barki";
        else if (lowerName.includes("biceps") || lowerName.includes("triceps") || lowerName.includes("ramion")) category = "Ramiona";
        else if (lowerName.includes("brzuch") || lowerName.includes("plank")) category = "Brzuch i core";
        else category = "Inne";
      }

      // Calculate sets for this exercise from session.results or targetSets
      const matchingResults = (session.results || []).filter(
        (r) => r.exerciseSnapshotId === ex.id && !r.skipped
      );
      const sets = matchingResults.length > 0 ? matchingResults.length : (ex.targetSets || 3);
      const vol = matchingResults.reduce((acc, r) => acc + (r.reps || 0) * (r.weightKg || 0), 0);
      totalSets += sets;

      const current = categorySets.get(category) ?? { sets: 0, volumeKg: 0 };
      current.sets += sets;
      current.volumeKg += vol;
      categorySets.set(category, current);
    }
  }

  const results: MuscleDistributionItem[] = [];
  for (const [category, data] of categorySets.entries()) {
    if (data.sets > 0 || defaultCategories.includes(category)) {
      results.push({
        muscle: category,
        category,
        sets: data.sets,
        volumeKg: data.volumeKg,
        percentage: totalSets > 0 ? Math.round((data.sets / totalSets) * 100) : 0,
      });
    }
  }

  return results.sort((a, b) => b.sets - a.sets);
}

export function computeHunterPersonalRecords(
  sessions: readonly WorkoutPlanSessionSummary[],
  days: readonly UnifiedDayRecord[],
  historyEvents: readonly UnifiedHistoryEvent[]
): HunterPersonalRecord[] {
  const records: HunterPersonalRecord[] = [];

  // 1. Max Volume in a single session
  let maxVolume = 0;
  let maxVolumeSession: WorkoutPlanSessionSummary | null = null;

  for (const session of sessions) {
    if ((session.volumeKg || 0) > maxVolume) {
      maxVolume = session.volumeKg || 0;
      maxVolumeSession = session;
    }
  }

  if (maxVolume > 0 && maxVolumeSession) {
    records.push({
      id: "max-volume",
      category: "volume",
      title: "Rekord Tonażu Sesji",
      value: `${maxVolume.toLocaleString("pl-PL")} kg`,
      subtitle: `Sesja: ${maxVolumeSession.startedAt?.slice(0, 10) || maxVolumeSession.dateKey}`,
      badge: "S-RANK TONNAGE",
    });
  }

  // 2. Max sets in a single session
  let maxSets = 0;
  let maxSetsSession: WorkoutPlanSessionSummary | null = null;
  for (const session of sessions) {
    const totalSets = session.completedSets || 0;
    if (totalSets > maxSets) {
      maxSets = totalSets;
      maxSetsSession = session;
    }
  }

  if (maxSets > 0 && maxSetsSession) {
    records.push({
      id: "max-sets",
      category: "sets",
      title: "Maksymalna Liczba Serii",
      value: `${maxSets} serii`,
      subtitle: `Czas: ${Math.round(maxSetsSession.activeSeconds / 60)} min`,
      badge: "ŻELAZNY ŁOWCA",
    });
  }

  // 3. Fast completion pace (Fastest session over 4 sets)
  let bestPaceSession: WorkoutPlanSessionSummary | null = null;
  let fastestPacePerSet = Infinity;
  for (const session of sessions) {
    const sets = session.completedSets || 0;
    if (sets >= 4 && session.activeSeconds > 60) {
      const pace = session.activeSeconds / sets;
      if (pace < fastestPacePerSet) {
        fastestPacePerSet = pace;
        bestPaceSession = session;
      }
    }
  }

  if (bestPaceSession) {
    records.push({
      id: "best-pace",
      category: "speed",
      title: "Mistrzostwo Tempa",
      value: `${Math.round(fastestPacePerSet)}s / serię`,
      subtitle: `Pace: ${bestPaceSession.pacePercent > 0 ? "+" : ""}${bestPaceSession.pacePercent}% (${Math.round(bestPaceSession.activeSeconds / 60)}m)`,
      badge: "CIEŃ PRĘDKOŚCI",
    });
  }

  // 4. Longest Active Streak
  let streak = 0;
  let maxStreak = 0;
  let prevDate: Date | null = null;

  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of sortedDays) {
    if (day.planSessions > 0 || day.dailyCompleted > 0 || day.wearableSamples > 0) {
      const currentDate = new Date(day.date);
      if (prevDate) {
        const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          streak += 1;
        } else {
          streak = 1;
        }
      } else {
        streak = 1;
      }
      prevDate = currentDate;
      if (streak > maxStreak) maxStreak = streak;
    }
  }

  if (maxStreak > 0) {
    records.push({
      id: "max-streak",
      category: "streak",
      title: "Najdłuższa Seria Dni",
      value: `${maxStreak} ${maxStreak === 1 ? "dzień" : maxStreak < 5 ? "dni" : "dni"} z rzędu`,
      subtitle: "Nieprzerwana determinacja Monarchy",
      badge: "DYSCYPLINA S-RANK",
    });
  }

  return records;
}

export function formatDetailedSessions(
  sessions: readonly WorkoutPlanSessionSummary[]
): DetailedSessionItem[] {
  return sessions.map((session) => {
    const exercises = (session.exercises || []).map((ex) => {
      const results = (session.results || []).filter((r) => r.exerciseSnapshotId === ex.id);
      const completedSets = results.filter((r) => !r.skipped).length;
      const vol = results.reduce((sum, r) => sum + (r.reps || 0) * (r.weightKg || 0), 0);
      const avgReps = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.reps, 0) / results.length) : ex.targetReps;
      const lastWeight = results.length > 0 ? results[results.length - 1].weightKg : ex.weightKg;

      return {
        name: ex.name,
        targetSets: ex.targetSets || 3,
        completedSets: completedSets || ex.targetSets || 3,
        reps: avgReps,
        weightKg: lastWeight,
        volumeKg: vol,
      };
    });

    const mins = Math.max(1, Math.round((session.activeSeconds || 60) / 60));
    const totalSets = session.completedSets || exercises.reduce((acc, e) => acc + e.completedSets, 0);

    let paceGrade: "BŁYSKAWICZNE" | "WZOROWE" | "SPOKOJNE" = "WZOROWE";
    if (session.paceGrade === "faster" || (session.pacePercent || 0) > 15) {
      paceGrade = "BŁYSKAWICZNE";
    } else if (session.paceGrade === "slower" || (session.pacePercent || 0) < -15) {
      paceGrade = "SPOKOJNE";
    }

    return {
      id: session.id,
      title: session.planSignature ? `Plan: ${session.planSignature.slice(0, 16)}` : "Sesja Treningowa Łowcy",
      date: (session.startedAt || session.dateKey || "").slice(0, 10),
      timeAgo: formatTimeAgo(session.startedAt || session.dateKey),
      durationSeconds: session.activeSeconds || 0,
      durationFormatted: `${mins} min`,
      totalSets,
      totalVolumeKg: session.volumeKg || 0,
      xpEarned: session.xpReward || 0,
      goldEarned: session.goldReward || 0,
      paceGrade,
      exercises,
    };
  });
}

function formatTimeAgo(dateIso?: string): string {
  if (!dateIso) return "Dzisiaj";
  try {
    const diffMs = Date.now() - new Date(dateIso).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Przed chwilą";
    if (diffHours < 24) return `${diffHours} godz. temu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Wczoraj";
    return `${diffDays} dni temu`;
  } catch {
    return dateIso.slice(0, 10);
  }
}
