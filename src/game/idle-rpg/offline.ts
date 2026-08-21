import { applyIdleExperience, getHeroCombatStats } from "./economy";
import type { IdleRpgSaveState, OfflineGrant, OfflinePowerSnapshot } from "./types";

export const MIN_OFFLINE_SECONDS = 60 as const;
export const MAX_OFFLINE_SECONDS = 12 * 60 * 60;

export function createOfflinePowerSnapshot(save: IdleRpgSaveState, nowMs: number): OfflinePowerSnapshot {
  const stats = getHeroCombatStats(save);
  const location = save.combat.location.kind === "abyss"
    ? save.abyss.highestCompletedDepth > 0
      ? { kind: "abyss" as const, depth: save.abyss.highestCompletedDepth, wave: 1 as const }
      : { kind: "campaign" as const, stage: 48 }
    : {
      kind: "campaign" as const,
      stage: save.campaign.farmingStage
        ?? (save.campaign.completed ? 48 : Math.max(1, save.campaign.highestUnlockedStage - 1)),
    };
  const locationPower = location.kind === "campaign" ? location.stage : 48 + location.depth * 2;
  const efficiency = Math.min(2, 0.55 + save.fitness.momentum * 0.2 + save.fitness.offlineEfficiencyPct);
  return {
    capturedAt: nowMs,
    location,
    goldPerMinute: Math.max(1, Math.floor((9 + locationPower * 2.25 + stats.attack * 0.06) * efficiency)),
    experiencePerMinute: Math.max(1, Math.floor((7 + locationPower * 1.55 + stats.attack * 0.04) * efficiency)),
    materialsPerHour: Math.max(1, Math.floor((2 + locationPower * 0.18) * efficiency)),
    efficiency,
  };
}

export function markIdleRpgExit(save: IdleRpgSaveState, nowMs: number): IdleRpgSaveState {
  if (save.offline.pendingGrant) return save;
  return {
    ...save,
    updatedAt: nowMs,
    offline: {
      ...save.offline,
      lastActiveAt: nowMs,
      powerSnapshot: createOfflinePowerSnapshot(save, nowMs),
    },
  };
}

export function prepareOfflineGrant(save: IdleRpgSaveState, nowMs: number): { state: IdleRpgSaveState; grant: OfflineGrant | null } {
  if (save.offline.pendingGrant) return { state: save, grant: save.offline.pendingGrant };
  const fromMs = Math.max(0, save.offline.lastActiveAt);
  const elapsedSeconds = Math.floor(Math.max(0, nowMs - fromMs) / 1_000);
  if (elapsedSeconds < MIN_OFFLINE_SECONDS) return { state: save, grant: null };
  const cappedSeconds = Math.min(MAX_OFFLINE_SECONDS, elapsedSeconds);
  const minutes = cappedSeconds / 60;
  const power = save.offline.powerSnapshot;
  const grant: OfflineGrant = {
    id: `afk-${fromMs}-${nowMs}`,
    fromMs,
    toMs: nowMs,
    elapsedSeconds,
    cappedSeconds,
    gold: Math.floor(minutes * Math.max(0, power.goldPerMinute)),
    experience: Math.floor(minutes * Math.max(0, power.experiencePerMinute)),
    materials: Math.floor((cappedSeconds / 3_600) * Math.max(0, power.materialsPerHour)),
  };
  return {
    state: { ...save, offline: { ...save.offline, pendingGrant: grant } },
    grant,
  };
}

export function claimOfflineGrant(
  save: IdleRpgSaveState,
  grantId?: string,
): { ok: true; state: IdleRpgSaveState; grant: OfflineGrant } | { ok: false; reason: string; state: IdleRpgSaveState } {
  const pending = save.offline.pendingGrant;
  if (!pending) {
    return {
      ok: false,
      reason: grantId && grantId === save.offline.lastClaimedGrantId ? "grant-already-claimed" : "no-pending-grant",
      state: save,
    };
  }
  if (grantId && pending.id !== grantId) return { ok: false, reason: "grant-id-mismatch", state: save };
  if (save.offline.lastClaimedGrantId === pending.id) return { ok: false, reason: "grant-already-claimed", state: save };
  let state: IdleRpgSaveState = {
    ...save,
    wallet: {
      ...save.wallet,
      gold: save.wallet.gold + pending.gold,
      materials: save.wallet.materials + pending.materials,
    },
    offline: {
      ...save.offline,
      lastActiveAt: pending.toMs,
      pendingGrant: null,
      lastClaimedGrantId: pending.id,
    },
  };
  state = applyIdleExperience(state, pending.experience).state;
  return {
    ok: true,
    grant: pending,
    state,
  };
}
