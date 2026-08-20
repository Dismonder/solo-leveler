export type ShadowStrikeTier = "perfect" | "great" | "good" | "miss";

export type ShadowStrikeConfig = {
  durationMs: number;
  maxRemainingMs: number;
  inputCooldownMs: number;
  targetCenter: number;
  hitWindowWidth: number;
  perfectWindowWidth: number;
  oneWayMs: number;
  scoreMultiplier: number;
  penaltyResist: number;
  missPenaltyMs: number;
};

export type ShadowStrikeRuntime = {
  config: ShadowStrikeConfig;
  cursorPosition: number;
  direction: 1 | -1;
  remainingMs: number;
  score: number;
  combo: number;
  acceptedInputs: number;
  activeElapsedMs: number;
  lastAdvancedAtMs: number;
  lastInputAtMs: number;
  paused: boolean;
  finished: boolean;
};

export type ShadowStrikeOutcome = {
  tier: ShadowStrikeTier;
  gain: number;
  timeDeltaMs: number;
  cursorPosition: number;
  score: number;
  combo: number;
};

export type ShadowStrikeInputDescriptor = {
  eventType: string;
  isPrimary: boolean;
  pointerType: string;
  button: number;
};

export type ShadowStrikeInputDispatch = {
  consume: boolean;
  outcome: ShadowStrikeOutcome | null;
};

export type ShadowStrikeInteractionController = {
  activate(runtime: ShadowStrikeRuntime): void;
  handleInput(
    runtime: ShadowStrikeRuntime,
    input: ShadowStrikeInputDescriptor,
    nowMs: number,
  ): ShadowStrikeInputDispatch;
  claimCompletion(runtime: ShadowStrikeRuntime): boolean;
};

export type ShadowStrikeSnapshot = {
  score: number;
  combo: number;
  remainingMs: number;
  remainingSeconds: number;
  cursorPosition: number;
  acceptedInputs: number;
  paused: boolean;
  finished: boolean;
};

const ROUND_DURATION_MS = 30_000;
const MAX_REMAINING_MS = 42_000;
const INPUT_COOLDOWN_MS = 100;
const TARGET_CENTER = 50;
const MISS_PENALTY_MS = 1_000;
const MAX_HIT_WINDOW_BONUS = 0.12;
const MAX_SCORE_BONUS = 0.15;
const MAX_PENALTY_RESIST = 0.18;

export function createShadowStrikeConfig(
  level: number,
  hitWindowBonus: number,
  scoreBonus: number,
  timePenaltyResist: number
): ShadowStrikeConfig {
  const difficulty = Math.min(8, Math.floor(Math.max(1, level) / 4));
  const clampedHitWindowBonus = clampBonus(hitWindowBonus, MAX_HIT_WINDOW_BONUS);
  const clampedScoreBonus = clampBonus(scoreBonus, MAX_SCORE_BONUS);
  const penaltyResist = clampBonus(timePenaltyResist, MAX_PENALTY_RESIST);
  const hitWindowWidth = Math.max(16, (28 - difficulty * 1.25) * (1 + clampedHitWindowBonus));

  return {
    durationMs: ROUND_DURATION_MS,
    maxRemainingMs: MAX_REMAINING_MS,
    inputCooldownMs: INPUT_COOLDOWN_MS,
    targetCenter: TARGET_CENTER,
    hitWindowWidth,
    perfectWindowWidth: Math.max(5, hitWindowWidth * 0.34),
    oneWayMs: Math.max(850, 1450 - difficulty * 55),
    scoreMultiplier: 1 + clampedScoreBonus,
    penaltyResist,
    missPenaltyMs: MISS_PENALTY_MS,
  };
}

export function createShadowStrikeRuntime(startAtMs: number, config: ShadowStrikeConfig): ShadowStrikeRuntime {
  return {
    config,
    cursorPosition: 0,
    direction: 1,
    remainingMs: config.durationMs,
    score: 0,
    combo: 0,
    acceptedInputs: 0,
    activeElapsedMs: 0,
    lastAdvancedAtMs: startAtMs,
    lastInputAtMs: Number.NEGATIVE_INFINITY,
    paused: false,
    finished: false,
  };
}

export function advanceShadowStrike(runtime: ShadowStrikeRuntime, nowMs: number): void {
  if (runtime.paused || runtime.finished) return;

  const elapsedMs = nowMs - runtime.lastAdvancedAtMs;
  if (!(elapsedMs > 0)) return;

  runtime.lastAdvancedAtMs = nowMs;
  runtime.activeElapsedMs += elapsedMs;
  runtime.remainingMs = Math.max(0, runtime.remainingMs - elapsedMs);
  setCursorFromActiveElapsed(runtime);

  if (runtime.remainingMs === 0) runtime.finished = true;
}

export function tryShadowStrike(runtime: ShadowStrikeRuntime, nowMs: number): ShadowStrikeOutcome | null {
  advanceShadowStrike(runtime, nowMs);
  if (runtime.paused || runtime.finished || nowMs - runtime.lastInputAtMs < runtime.config.inputCooldownMs) {
    return null;
  }

  runtime.lastInputAtMs = nowMs;
  runtime.acceptedInputs += 1;

  const tier = classifyStrike(runtime);
  let gain = 0;
  let timeDeltaMs: number;

  if (tier === "miss") {
    runtime.combo = 0;
    timeDeltaMs = -Math.round(runtime.config.missPenaltyMs * (1 - runtime.config.penaltyResist));
  } else {
    const nextCombo = runtime.combo + 1;
    runtime.combo = nextCombo;
    if (tier === "perfect") {
      gain = Math.round((75 + Math.min(90, nextCombo * 8)) * runtime.config.scoreMultiplier);
      timeDeltaMs = 1400 + nextCombo * 70;
    } else if (tier === "great") {
      gain = Math.round((52 + Math.min(65, nextCombo * 6)) * runtime.config.scoreMultiplier);
      timeDeltaMs = 850;
    } else {
      gain = Math.round((34 + Math.min(50, nextCombo * 5)) * runtime.config.scoreMultiplier);
      timeDeltaMs = 550;
    }
    runtime.score += gain;
  }

  runtime.remainingMs = Math.min(
    runtime.config.maxRemainingMs,
    Math.max(0, runtime.remainingMs + timeDeltaMs)
  );
  if (runtime.remainingMs === 0) runtime.finished = true;

  return {
    tier,
    gain,
    timeDeltaMs,
    cursorPosition: runtime.cursorPosition,
    score: runtime.score,
    combo: runtime.combo,
  };
}

export function createShadowStrikeInteractionController(): ShadowStrikeInteractionController {
  let activeRuntime: ShadowStrikeRuntime | null = null;
  let completionClaimed = false;

  return {
    activate(runtime) {
      activeRuntime = runtime;
      completionClaimed = false;
    },
    handleInput(runtime, input, nowMs) {
      const isPrimaryPointerDown = input.eventType === "pointerdown"
        && input.isPrimary
        && (input.pointerType !== "mouse" || input.button === 0);
      if (activeRuntime !== runtime || !isPrimaryPointerDown) {
        return { consume: false, outcome: null };
      }
      return { consume: true, outcome: tryShadowStrike(runtime, nowMs) };
    },
    claimCompletion(runtime) {
      if (activeRuntime !== runtime || completionClaimed) return false;
      completionClaimed = true;
      return true;
    },
  };
}

export function pauseShadowStrike(runtime: ShadowStrikeRuntime, nowMs: number): void {
  advanceShadowStrike(runtime, nowMs);
  if (!runtime.finished) runtime.paused = true;
}

export function resumeShadowStrike(runtime: ShadowStrikeRuntime, nowMs: number): void {
  if (runtime.finished || !runtime.paused) return;
  runtime.paused = false;
  runtime.lastAdvancedAtMs = nowMs;
}

export function getShadowStrikeSnapshot(runtime: ShadowStrikeRuntime): ShadowStrikeSnapshot {
  return {
    score: runtime.score,
    combo: runtime.combo,
    remainingMs: runtime.remainingMs,
    remainingSeconds: Math.ceil(runtime.remainingMs / 1_000),
    cursorPosition: runtime.cursorPosition,
    acceptedInputs: runtime.acceptedInputs,
    paused: runtime.paused,
    finished: runtime.finished,
  };
}

function clampBonus(value: number, maximum: number): number {
  return Math.max(0, Math.min(maximum, Number.isFinite(value) ? value : 0));
}

function setCursorFromActiveElapsed(runtime: ShadowStrikeRuntime): void {
  const oneWayMs = runtime.config.oneWayMs;
  const cycleMs = oneWayMs * 2;
  const phaseMs = runtime.activeElapsedMs % cycleMs;

  if (phaseMs < oneWayMs) {
    runtime.cursorPosition = (phaseMs / oneWayMs) * 100;
    runtime.direction = 1;
  } else {
    runtime.cursorPosition = 100 - ((phaseMs - oneWayMs) / oneWayMs) * 100;
    runtime.direction = -1;
  }
}

function classifyStrike(runtime: ShadowStrikeRuntime): ShadowStrikeTier {
  const distance = Math.abs(runtime.cursorPosition - runtime.config.targetCenter);
  const hitHalfWidth = runtime.config.hitWindowWidth / 2;

  if (distance <= runtime.config.perfectWindowWidth / 2) return "perfect";
  if (distance <= hitHalfWidth * 0.65) return "great";
  if (distance <= hitHalfWidth) return "good";
  return "miss";
}
