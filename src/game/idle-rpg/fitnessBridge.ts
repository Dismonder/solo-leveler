import { getEffectiveStats } from "../playerMath";
import type { PlayerState, WorkoutPlanSessionSummary } from "../../types";
import type { FitnessSnapshot } from "./types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1_000;

function clamp(value: number, min = 0, max = 1): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function finite(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getDailyRatio(profile: Readonly<PlayerState>): number {
  const items = Array.isArray(profile.dailyQuest?.items)
    ? profile.dailyQuest.items.filter((item) => item.enabled && finite(item.target) > 0)
    : [];
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => {
    const explicit = profile.dailyQuest.progressByItemId?.[item.id];
    const legacy = item.trackableExerciseId ? profile.dailyQuest[item.trackableExerciseId] : 0;
    return sum + clamp(finite(explicit, finite(legacy)) / finite(item.target, 1));
  }, 0);
  return clamp(total / items.length);
}

function deduplicateRecentSessions(
  sessions: readonly WorkoutPlanSessionSummary[],
  nowMs: number,
): WorkoutPlanSessionSummary[] {
  const cutoff = nowMs - WEEK_MS;
  const byId = new Map<string, WorkoutPlanSessionSummary>();
  for (const session of sessions) {
    const completedAt = Date.parse(session.completedAt);
    if (!Number.isFinite(completedAt) || completedAt < cutoff || completedAt > nowMs + 60_000) continue;
    const previous = byId.get(session.id);
    if (!previous || Date.parse(previous.completedAt) < completedAt) byId.set(session.id, session);
  }
  return [...byId.values()];
}

/**
 * Creates the only fitness representation visible to Idle RPG. The source profile
 * is never retained and raw wearable/workoutHistory records are deliberately ignored.
 */
export function createFitnessSnapshot(profile: Readonly<PlayerState>, nowMs = Date.now()): FitnessSnapshot {
  const effective = getEffectiveStats(profile as PlayerState);
  const sessions = deduplicateRecentSessions(profile.workoutSessions ?? [], nowMs);
  const weeklyMinutes = sessions.reduce((sum, session) => sum + Math.max(0, finite(session.activeSeconds)) / 60, 0);
  const weeklySets = sessions.reduce((sum, session) => sum + Math.max(0, finite(session.completedSets)), 0);
  const weeklyVolumeKg = sessions.reduce((sum, session) => sum + Math.max(0, finite(session.volumeKg)), 0);
  const dailyRatio = getDailyRatio(profile);
  const weeklyLoad = clamp(
    0.55 * Math.min(weeklyMinutes / 180, 1)
      + 0.25 * Math.min(weeklySets / 30, 1)
      + 0.20 * Math.min(weeklyVolumeKg / 10_000, 1),
  );
  const streak = Math.max(0, finite(profile.dailyQuest?.streak));
  const momentum = clamp(0.50 * dailyRatio + 0.35 * weeklyLoad + 0.15 * Math.min(streak / 14, 1));

  const STR = Math.max(0, finite(effective.STR));
  const VITALITY = Math.max(0, finite(effective.VITALITY));
  const AGILITY = Math.max(0, finite(effective.AGILITY));
  const INTELLIGENCE = Math.max(0, finite(effective.INTELLIGENCE));
  const SENSE = Math.max(0, finite(effective.SENSE));

  return {
    capturedAt: nowMs,
    effectiveStats: { STR, VITALITY, AGILITY, INTELLIGENCE, SENSE },
    dailyRatio,
    weeklyLoad,
    momentum,
    weeklyMinutes,
    weeklySets,
    weeklyVolumeKg,
    attackPct: clamp(STR * 0.006, 0, 1.5),
    maxHpPct: clamp(VITALITY * 0.008, 0, 2),
    regenPct: clamp(VITALITY * 0.004, 0, 1),
    hastePct: clamp(AGILITY * 0.0035, 0, 0.55),
    critChance: clamp(AGILITY * 0.0015, 0, 0.35),
    skillDamagePct: clamp(INTELLIGENCE * 0.007, 0, 1.75),
    lootPct: clamp(SENSE * 0.003, 0, 0.75),
    offlineEfficiencyPct: clamp(SENSE * 0.004, 0, 1),
  };
}
