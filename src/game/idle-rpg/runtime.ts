import type { PlayerState } from "../../types";
import { SKILLS, SUMMONS } from "./content";
import {
  startAbyssEncounter,
  startCampaignEncounter,
  stepCombat,
  useCombatSkill,
} from "./combatMachine";
import {
  equipItem,
  experienceToNextLevel,
  getHeroCombatStats,
  getSkillUpgradeCost,
  sellItem,
  setActiveSummons,
  upgradeAbyssNode,
  upgradeItem,
  upgradeSkill,
  upgradeSummon,
} from "./economy";
import { createFitnessSnapshot } from "./fitnessBridge";
import { claimOfflineGrant, markIdleRpgExit, prepareOfflineGrant } from "./offline";
import { createIdleRpgSaveRepository } from "./saveRepository";
import {
  IDLE_RPG_FIXED_STEP_MS,
  type CommandResult,
  type CreateIdleRpgRuntimeOptions,
  type IdleRpgCommand,
  type IdleRpgEvent,
  type IdleRpgRuntime,
  type IdleRpgSaveState,
  type IdleRpgSnapshot,
  type RuntimeScheduler,
} from "./types";

const UI_PUBLISH_INTERVAL_MS = 100;
const SAVE_INTERVAL_MS = 1_000;
const MAX_FRAME_DELTA_MS = 250;

export function createIdleRpgSnapshot(state: IdleRpgSaveState, revision: number, nowMs: number): IdleRpgSnapshot {
  const heroStats = getHeroCombatStats(state);
  return {
    revision,
    nowMs,
    phase: state.combat.phase,
    location: { ...state.combat.location } as IdleRpgSnapshot["location"],
    encounter: {
      serial: state.combat.encounterSerial,
      enemy: { ...state.combat.enemy },
      phaseRemainingMs: state.combat.phaseRemainingMs,
    },
    hero: {
      ...state.hero,
      ...heroStats,
      experienceToNextLevel: experienceToNextLevel(state.hero.level),
    },
    campaign: { ...state.campaign },
    abyss: { ...state.abyss, tree: { ...state.abyss.tree } },
    wallet: { ...state.wallet },
    skills: SKILLS.map((skill) => {
      const level = state.skills[skill.id].level;
      const levelMultiplier = 1 + (level - 1) * 0.12;
      return {
        ...skill,
        level,
        unlocked: state.skills[skill.id].unlocked,
        cooldownRemainingMs: state.combat.skillCooldowns[skill.id],
        upgradeCost: getSkillUpgradeCost(skill.id, level),
        effectiveMultiplier: Number((skill.multiplier * levelMultiplier).toFixed(2)),
      };
    }),
    summons: SUMMONS.map((summon) => ({
      ...summon,
      level: state.summons.levels[summon.id],
      unlocked: state.summons.unlockedIds.includes(summon.id),
      active: state.summons.activeIds.includes(summon.id),
    })),
    inventory: state.inventoryOrder.map((id) => state.items[id]).filter(Boolean).map((item) => ({ ...item })),
    equipped: { ...state.equipped },
    settings: { ...state.settings },
    fitness: { ...state.fitness, effectiveStats: { ...state.fitness.effectiveStats } },
    offline: {
      ...state.offline,
      powerSnapshot: { ...state.offline.powerSnapshot, location: { ...state.offline.powerSnapshot.location } as typeof state.offline.powerSnapshot.location },
      pendingGrant: state.offline.pendingGrant ? { ...state.offline.pendingGrant } : null,
    },
  };
}

/** Advances only whole deterministic 50 ms steps and returns the unused remainder. */
export function advanceIdleRpgState(
  initial: IdleRpgSaveState,
  elapsedMs: number,
): { state: IdleRpgSaveState; events: IdleRpgEvent[]; remainderMs: number } {
  const safeElapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const steps = Math.floor(safeElapsed / IDLE_RPG_FIXED_STEP_MS);
  let state = initial;
  const events: IdleRpgEvent[] = [];
  for (let index = 0; index < steps; index += 1) {
    const result = stepCombat(state);
    state = result.state;
    events.push(...result.events);
  }
  return { state, events, remainderMs: safeElapsed - steps * IDLE_RPG_FIXED_STEP_MS };
}

function defaultScheduler(): RuntimeScheduler {
  if (typeof requestAnimationFrame === "function" && typeof cancelAnimationFrame === "function") {
    return {
      request: (callback) => requestAnimationFrame(() => callback(Date.now())),
      cancel: (handle) => cancelAnimationFrame(handle as number),
    };
  }
  return {
    request: (callback) => setTimeout(() => callback(Date.now()), 16),
    cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
}

export function createIdleRpgRuntime(options: CreateIdleRpgRuntimeOptions): IdleRpgRuntime {
  const now = options.now ?? Date.now;
  const getProfile = options.getProfile ?? (() => options.profile);
  const repository = options.repository ?? createIdleRpgSaveRepository();
  const scheduler = options.scheduler ?? defaultScheduler();
  const listeners = new Set<() => void>();
  const eventListeners = new Set<(event: IdleRpgEvent) => void>();
  let revision = 0;
  let disposed = false;
  let running = false;
  let frameHandle: unknown;
  let lastFrameAt = now();
  let accumulatorMs = 0;
  let lastPublishedAt = lastFrameAt;
  let lastSavedAt = lastFrameAt;

  const currentFitness = createFitnessSnapshot(getProfile(), lastFrameAt);
  const loaded = repository.load(lastFrameAt, currentFitness, options.seed);
  let state = loaded.save;
  const offline = prepareOfflineGrant(state, lastFrameAt);
  state = { ...offline.state, fitness: currentFitness };
  if (state.combat.phase === "paused") {
    state = {
      ...state,
      combat: {
        ...state.combat,
        phase: state.combat.phaseBeforePause ?? "enemy-entering",
        phaseBeforePause: null,
      },
    };
  }
  const initialStats = getHeroCombatStats(state);
  state.hero = { ...state.hero, hp: Math.min(state.hero.hp, initialStats.maxHp), mp: Math.min(state.hero.mp, initialStats.maxMp) };
  let cachedSnapshot = createIdleRpgSnapshot(state, revision, lastFrameAt);

  function emit(events: readonly IdleRpgEvent[]): void {
    for (const event of events) for (const listener of eventListeners) listener(event);
  }

  function publish(force = false): void {
    const timestamp = now();
    if (!force && timestamp - lastPublishedAt < UI_PUBLISH_INTERVAL_MS) return;
    lastPublishedAt = timestamp;
    revision += 1;
    cachedSnapshot = createIdleRpgSnapshot(state, revision, timestamp);
    for (const listener of listeners) listener();
  }

  function persist(): void {
    const timestamp = now();
    // Persist an active-session heartbeat so a force-stop cannot later turn
    // already simulated play time into offline rewards.
    if (running && state.combat.phase !== "paused") {
      state = { ...state, fitness: createFitnessSnapshot(getProfile(), timestamp) };
      state = markIdleRpgExit(state, timestamp);
    } else {
      state = { ...state, updatedAt: timestamp };
    }
    const result = repository.save(state);
    lastSavedAt = timestamp;
    if ("error" in result) emit([{ type: "save-error", operation: "save", message: result.error }]);
  }

  function scheduleNext(): void {
    if (!running || disposed) return;
    frameHandle = scheduler.request(frame);
  }

  function frame(frameNow: number): void {
    if (!running || disposed) return;
    const elapsed = Math.max(0, Math.min(MAX_FRAME_DELTA_MS, frameNow - lastFrameAt));
    lastFrameAt = frameNow;
    accumulatorMs += elapsed;
    if (accumulatorMs >= IDLE_RPG_FIXED_STEP_MS) {
      const advanced = advanceIdleRpgState(state, accumulatorMs);
      state = advanced.state;
      accumulatorMs = advanced.remainderMs;
      emit(advanced.events);
      publish();
      if (advanced.events.some((event) => event.type === "encounter-settled")) persist();
    }
    if (frameNow - lastSavedAt >= SAVE_INTERVAL_MS) persist();
    scheduleNext();
  }

  function start(): void {
    if (running || disposed || state.combat.phase === "paused") return;
    running = true;
    lastFrameAt = now();
    scheduleNext();
  }

  function stop(): void {
    if (!running) return;
    running = false;
    if (frameHandle !== undefined) scheduler.cancel(frameHandle);
    frameHandle = undefined;
  }

  function applyCommand(command: IdleRpgCommand): { result: CommandResult; events: IdleRpgEvent[] } {
    if (state.combat.phase === "paused" && command.type !== "claim-offline") {
      return { result: { ok: false, reason: "runtime-paused" }, events: [] };
    }
    switch (command.type) {
      case "use-skill": {
        const action = useCombatSkill(state, command.skillId);
        if ("reason" in action) return { result: { ok: false, reason: action.reason }, events: [] };
        state = action.state;
        return { result: { ok: true }, events: action.events };
      }
      case "toggle-auto":
        state = { ...state, settings: { ...state.settings, autoBattle: !state.settings.autoBattle } };
        return { result: { ok: true }, events: [] };
      case "toggle-farm": {
        const nextFarming = state.campaign.farmingStage === null ? state.campaign.currentStage : null;
        state = { ...state, campaign: { ...state.campaign, farmingStage: nextFarming } };
        return { result: { ok: true }, events: [] };
      }
      case "set-speed":
        state = { ...state, settings: { ...state.settings, battleSpeed: command.speed } };
        return { result: { ok: true }, events: [] };
      case "select-stage": {
        const action = startCampaignEncounter(state, command.stage, command.mode ?? "advance");
        if ("reason" in action) return { result: { ok: false, reason: action.reason }, events: [] };
        state = action.state;
        return { result: { ok: true }, events: action.events };
      }
      case "enter-abyss": {
        const action = startAbyssEncounter(state);
        if ("reason" in action) return { result: { ok: false, reason: action.reason }, events: [] };
        state = action.state;
        return { result: { ok: true }, events: action.events };
      }
      case "set-abyss-mode": {
        if (!state.abyss.unlocked) return { result: { ok: false, reason: "abyss-locked" }, events: [] };
        if (command.mode === "harvest" && state.abyss.highestCompletedDepth < 1) {
          return { result: { ok: false, reason: "no-completed-abyss-depth" }, events: [] };
        }
        state = { ...state, abyss: { ...state.abyss, mode: command.mode } };
        return { result: { ok: true }, events: [] };
      }
      case "equip-item": {
        const action = equipItem(state, command.itemId);
        if ("reason" in action) return { result: { ok: false, reason: action.reason }, events: [] };
        state = action.state;
        return { result: { ok: true }, events: [] };
      }
      case "sell-item": {
        const action = sellItem(state, command.itemId);
        if ("reason" in action) return { result: { ok: false, reason: action.reason }, events: [] };
        state = action.state;
        return { result: { ok: true }, events: [] };
      }
      case "upgrade-item": {
        const action = upgradeItem(state, command.itemId);
        if ("reason" in action) return { result: { ok: false, reason: action.reason }, events: [] };
        state = action.state;
        return { result: { ok: true }, events: [] };
      }
      case "upgrade-skill": {
        const action = upgradeSkill(state, command.skillId);
        if ("reason" in action) return { result: { ok: false, reason: action.reason }, events: [] };
        state = action.state;
        return { result: { ok: true }, events: [] };
      }
      case "upgrade-summon": {
        const action = upgradeSummon(state, command.summonId);
        if ("reason" in action) return { result: { ok: false, reason: action.reason }, events: [] };
        state = action.state;
        return { result: { ok: true }, events: [] };
      }
      case "set-active-summons": {
        const action = setActiveSummons(state, command.summonIds);
        if ("reason" in action) return { result: { ok: false, reason: action.reason }, events: [] };
        state = action.state;
        return { result: { ok: true }, events: [] };
      }
      case "upgrade-abyss": {
        const action = upgradeAbyssNode(state, command.node);
        if ("reason" in action) return { result: { ok: false, reason: action.reason }, events: [] };
        state = action.state;
        return { result: { ok: true }, events: [] };
      }
      case "claim-offline": {
        const action = claimOfflineGrant(state, command.grantId);
        if ("reason" in action) return { result: { ok: false, reason: action.reason }, events: [] };
        state = action.state;
        return { result: { ok: true }, events: [{ type: "offline-claimed", grant: action.grant }] };
      }
    }
  }

  if (loaded.warning) queueMicrotask(() => emit([{ type: "save-error", operation: "load", message: loaded.warning! }]));
  if (offline.grant) queueMicrotask(() => emit([{ type: "offline-prepared", grant: offline.grant! }]));
  if (options.autoStart !== false) start();

  return {
    // useSyncExternalStore requires referential stability until the next publish.
    getSnapshot: () => cachedSnapshot,
    dispatch(command) {
      if (disposed) return { ok: false, reason: "runtime-disposed" };
      const action = applyCommand(command);
      if (!action.result.ok) return action.result;
      emit(action.events);
      persist();
      publish(true);
      return action.result;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeEvents(listener) {
      eventListeners.add(listener);
      return () => eventListeners.delete(listener);
    },
    pause(_reason) {
      if (disposed || state.combat.phase === "paused") return;
      stop();
      const before = state.combat.phase;
      state = {
        ...state,
        fitness: createFitnessSnapshot(getProfile(), now()),
        combat: { ...state.combat, phase: "paused", phaseBeforePause: before },
      };
      state = markIdleRpgExit(state, now());
      persist();
      publish(true);
    },
    resume(nowMs) {
      if (disposed || state.combat.phase !== "paused") return;
      const prepared = prepareOfflineGrant(state, nowMs);
      state = {
        ...prepared.state,
        fitness: createFitnessSnapshot(getProfile(), nowMs),
        combat: {
          ...prepared.state.combat,
          phase: prepared.state.combat.phaseBeforePause ?? "enemy-entering",
          phaseBeforePause: null,
        },
      };
      lastFrameAt = nowMs;
      accumulatorMs = 0;
      if (prepared.grant) emit([{ type: "offline-prepared", grant: prepared.grant }]);
      persist();
      publish(true);
      start();
    },
    dispose() {
      if (disposed) return;
      stop();
      if (state.combat.phase !== "paused") {
        const before = state.combat.phase;
        state = { ...state, combat: { ...state.combat, phase: "paused", phaseBeforePause: before } };
        state = markIdleRpgExit(state, now());
      }
      persist();
      listeners.clear();
      eventListeners.clear();
      disposed = true;
    },
  };
}

export type { PlayerState };
