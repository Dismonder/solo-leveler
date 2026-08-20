export type ShadowStrikeTier = "perfect" | "great" | "good" | "miss";

export type ShadowStrikeConfig = {
  durationMs: number;
  maxRemainingMs: number;
  inputCooldownMs: number;
  targetCenter: number;
  hitWindowWidth: number;
  perfectWindowWidth: number;
  oneWayMs: number;
  baseOneWayMs?: number;
  baseHitWindowWidth?: number;
  hitWindowBonus?: number;
  level?: number;
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
  perfectStreak?: number;
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
  perfectStreak?: number;
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
  perfectStreak: number;
  remainingMs: number;
  remainingSeconds: number;
  cursorPosition: number;
  acceptedInputs: number;
  speedMultiplier: number;
  currentOneWayMs: number;
  difficultyTier: number;
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

export function getShadowStrikeDifficulty(score: number, level: number): number {
  return Math.max(0, Math.min(14, Math.floor(Math.max(0, score) / 130) + Math.floor(Math.max(1, level) / 4)));
}

export function getShadowStrikeOneWayMs(score: number, combo: number, level: number, baseOneWayMs?: number): number {
  const base = baseOneWayMs ?? Math.max(850, 1450 - Math.min(8, Math.floor(Math.max(1, level) / 4)) * 55);
  const diff = getShadowStrikeDifficulty(score, level);
  const comboBonus = Math.min(260, Math.max(0, combo) * 16);
  const scoreBonus = diff * 52;
  return Math.max(450, base - scoreBonus - comboBonus);
}

export function getShadowStrikeHitWindows(
  score: number,
  combo: number,
  level: number,
  hitWindowBonus = 0,
  perfectStreak = 0
): { hitWindowWidth: number; perfectWindowWidth: number } {
  const clampedBonus = clampBonus(hitWindowBonus, MAX_HIT_WINDOW_BONUS);
  const diff = getShadowStrikeDifficulty(score, level);
  const comboTighten = Math.max(0.78, 1 - Math.min(0.22, Math.max(0, combo) * 0.009));
  const perfectShrink = Math.max(0.4, Math.pow(0.9, Math.max(0, perfectStreak)));
  const hitWindowWidth = Math.max(10, (28 - diff * 0.82) * (1 + clampedBonus) * comboTighten * perfectShrink);
  const perfectWindowWidth = Math.max(3.0, hitWindowWidth * Math.max(0.2, 0.34 - diff * 0.006) * perfectShrink);
  return { hitWindowWidth, perfectWindowWidth };
}

export function createShadowStrikeConfig(
  level: number,
  hitWindowBonus: number,
  scoreBonus: number,
  timePenaltyResist: number
): ShadowStrikeConfig {
  const baseDifficulty = Math.min(8, Math.floor(Math.max(1, level) / 4));
  const clampedHitWindowBonus = clampBonus(hitWindowBonus, MAX_HIT_WINDOW_BONUS);
  const clampedScoreBonus = clampBonus(scoreBonus, MAX_SCORE_BONUS);
  const penaltyResist = clampBonus(timePenaltyResist, MAX_PENALTY_RESIST);
  const hitWindowWidth = Math.max(16, (28 - baseDifficulty * 1.25) * (1 + clampedHitWindowBonus));
  const baseOneWayMs = Math.max(850, 1450 - baseDifficulty * 55);

  return {
    durationMs: ROUND_DURATION_MS,
    maxRemainingMs: MAX_REMAINING_MS,
    inputCooldownMs: INPUT_COOLDOWN_MS,
    targetCenter: TARGET_CENTER,
    hitWindowWidth,
    perfectWindowWidth: Math.max(5, hitWindowWidth * 0.34),
    oneWayMs: baseOneWayMs,
    baseOneWayMs,
    baseHitWindowWidth: hitWindowWidth,
    hitWindowBonus: clampedHitWindowBonus,
    level,
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
    perfectStreak: 0,
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

  const currentOneWayMs = getShadowStrikeOneWayMs(
    runtime.score,
    runtime.combo,
    runtime.config.level ?? 1,
    runtime.config.baseOneWayMs ?? runtime.config.oneWayMs
  );

  const deltaPercent = (elapsedMs * 100) / currentOneWayMs;
  const { nextPosition, nextDirection } = moveCursor(runtime.cursorPosition, runtime.direction, deltaPercent);
  runtime.cursorPosition = nextPosition;
  runtime.direction = nextDirection;

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
    runtime.perfectStreak = 0;
    timeDeltaMs = -Math.round(runtime.config.missPenaltyMs * (1 - runtime.config.penaltyResist));
  } else {
    const nextCombo = runtime.combo + 1;
    runtime.combo = nextCombo;
    if (tier === "perfect") {
      runtime.perfectStreak = (runtime.perfectStreak ?? 0) + 1;
    } else {
      runtime.perfectStreak = Math.max(0, (runtime.perfectStreak ?? 0) - 1);
    }
    const currentStreak = runtime.perfectStreak ?? 0;
    const diff = getShadowStrikeDifficulty(runtime.score, runtime.config.level ?? 1);
    const difficultyBonusMultiplier = 1 + diff * 0.04;
    const precisionBonus = tier === "perfect" && currentStreak > 1 ? 1 + (currentStreak - 1) * 0.22 : 1;

    if (tier === "perfect") {
      gain = Math.round((75 + Math.min(90, nextCombo * 8)) * runtime.config.scoreMultiplier * difficultyBonusMultiplier * precisionBonus);
      timeDeltaMs = 1400 + nextCombo * 70;
    } else if (tier === "great") {
      gain = Math.round((52 + Math.min(65, nextCombo * 6)) * runtime.config.scoreMultiplier * difficultyBonusMultiplier);
      timeDeltaMs = 850;
    } else {
      gain = Math.round((34 + Math.min(50, nextCombo * 5)) * runtime.config.scoreMultiplier * difficultyBonusMultiplier);
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
    perfectStreak: runtime.perfectStreak ?? 0,
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
  const currentOneWayMs = getShadowStrikeOneWayMs(
    runtime.score,
    runtime.combo,
    runtime.config.level ?? 1,
    runtime.config.baseOneWayMs ?? runtime.config.oneWayMs
  );
  const base = runtime.config.baseOneWayMs ?? runtime.config.oneWayMs;
  const speedMultiplier = Number((base / currentOneWayMs).toFixed(2));
  const difficultyTier = getShadowStrikeDifficulty(runtime.score, runtime.config.level ?? 1) + 1;

  return {
    score: runtime.score,
    combo: runtime.combo,
    perfectStreak: runtime.perfectStreak ?? 0,
    remainingMs: runtime.remainingMs,
    remainingSeconds: Math.ceil(runtime.remainingMs / 1_000),
    cursorPosition: runtime.cursorPosition,
    acceptedInputs: runtime.acceptedInputs,
    speedMultiplier,
    currentOneWayMs,
    difficultyTier,
    paused: runtime.paused,
    finished: runtime.finished,
  };
}

function clampBonus(value: number, maximum: number): number {
  return Math.max(0, Math.min(maximum, Number.isFinite(value) ? value : 0));
}

function moveCursor(
  position: number,
  direction: 1 | -1,
  deltaPercent: number
): { nextPosition: number; nextDirection: 1 | -1 } {
  let p = position + direction * deltaPercent;
  let d = direction;

  while (p > 100 || p < 0) {
    if (p > 100) {
      p = 200 - p;
      d = -1;
    }
    if (p < 0) {
      p = -p;
      d = 1;
    }
  }

  p = Math.max(0, Math.min(100, p));
  return { nextPosition: p, nextDirection: d };
}

function classifyStrike(runtime: ShadowStrikeRuntime): ShadowStrikeTier {
  const distance = Math.abs(runtime.cursorPosition - runtime.config.targetCenter);
  const { hitWindowWidth, perfectWindowWidth } = getShadowStrikeHitWindows(
    runtime.score,
    runtime.combo,
    runtime.config.level ?? 1,
    runtime.config.hitWindowBonus ?? 0,
    runtime.perfectStreak ?? 0
  );
  const hitHalfWidth = hitWindowWidth / 2;

  if (distance <= perfectWindowWidth / 2) return "perfect";
  if (distance <= hitHalfWidth * 0.65) return "great";
  if (distance <= hitHalfWidth) return "good";
  return "miss";
}


