export function getMiniGameDifficulty(score: number, level: number, scoreStep = 160, levelStep = 5, cap = 12) {
  return Math.max(0, Math.min(cap, Math.floor(Math.max(0, score) / scoreStep) + Math.floor(Math.max(1, level) / levelStep)));
}

export function getStrikeZoneWidth(score: number, level: number) {
  return Math.max(8, 26 - getMiniGameDifficulty(score, level, 120, 4, 14) * 1.25);
}

export function getStrikeWindow(centerPercent: number, widthPercent: number) {
  const width = Math.max(6, Math.min(42, widthPercent));
  const left = Math.max(2, Math.min(98 - width, centerPercent - width / 2));
  const right = left + width;
  const center = left + width / 2;
  const perfectHalf = Math.max(1.4, width * 0.18);

  return {
    left,
    right,
    width,
    perfectLeft: center - perfectHalf,
    perfectRight: center + perfectHalf,
  };
}

export function advanceShadowStrikeMotion({
  cursorPosition,
  driftAngle,
  deltaSeconds,
  cycleMs,
  driftMs,
  difficulty,
}: {
  cursorPosition: number;
  driftAngle: number;
  deltaSeconds: number;
  cycleMs: number;
  driftMs: number;
  difficulty: number;
}) {
  const safeCycleMs = Math.max(1, cycleMs);
  const safeDriftMs = Math.max(1, driftMs);
  const safeDeltaSeconds = Math.max(0, deltaSeconds);

  const cursorStep = ((safeDeltaSeconds * 1000) / safeCycleMs) * 100;
  const nextCursor = (cursorPosition + cursorStep) % 100;

  const angleStep = ((safeDeltaSeconds * 1000) / safeDriftMs) * (2 * Math.PI);
  const nextAngle = (driftAngle + angleStep) % (2 * Math.PI);
  const amplitude = Math.min(26, 9 + difficulty * 1.4);
  const nextZone = 50 + Math.sin(nextAngle) * amplitude;

  return {
    nextCursor,
    nextAngle,
    nextZone,
  };
}

export function getMemoryStepMs(score: number, level: number) {
  return Math.max(360, 680 - getMiniGameDifficulty(score, level, 150, 5, 10) * 32);
}

export function getRuneLockWindowMs(score: number, level: number) {
  return Math.max(3200, 7600 - getMiniGameDifficulty(score, level, 130, 5, 12) * 340);
}

export function getExtractionSignalWindowMs(score: number, level: number) {
  return Math.max(2200, 6000 - getMiniGameDifficulty(score, level, 120, 4, 12) * 300);
}
