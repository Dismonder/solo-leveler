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

export function getMemoryStepMs(score: number, level: number) {
  return Math.max(360, 680 - getMiniGameDifficulty(score, level, 150, 5, 10) * 32);
}

export function getRuneLockWindowMs(score: number, level: number) {
  return Math.max(3200, 7600 - getMiniGameDifficulty(score, level, 130, 5, 12) * 340);
}

export function getExtractionSignalWindowMs(score: number, level: number) {
  return Math.max(2200, 6000 - getMiniGameDifficulty(score, level, 120, 4, 12) * 300);
}
