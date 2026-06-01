export type FrameStatsSummary = {
  samples: number;
  budgetMs: number;
  latestMs: number;
  averageMs: number;
  p95Ms: number;
  p99Ms: number;
  worstMs: number;
  fps: number;
  averageFps: number;
  minFps: number;
  budgetMisses: number;
  stutters16: number;
  stutters25: number;
  stutters33: number;
};

const DEFAULT_REFRESH_RATE = 120;
const FRAME_BUDGET_TOLERANCE_MS = 0.35;

function percentile(sortedValues: number[], percentileValue: number) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sortedValues.length) - 1)
  );
  return sortedValues[index];
}

function toFps(frameMs: number) {
  return frameMs > 0 ? 1000 / frameMs : 0;
}

export function summarizeFrameDeltas(
  frameDeltasMs: number[],
  refreshRate = DEFAULT_REFRESH_RATE
): FrameStatsSummary {
  const cleanSamples = frameDeltasMs.filter((value) => Number.isFinite(value) && value > 0 && value < 1000);
  const budgetMs = 1000 / (refreshRate > 0 ? refreshRate : DEFAULT_REFRESH_RATE);

  if (cleanSamples.length === 0) {
    return {
      samples: 0,
      budgetMs,
      latestMs: 0,
      averageMs: 0,
      p95Ms: 0,
      p99Ms: 0,
      worstMs: 0,
      fps: 0,
      averageFps: 0,
      minFps: 0,
      budgetMisses: 0,
      stutters16: 0,
      stutters25: 0,
      stutters33: 0,
    };
  }

  const sorted = [...cleanSamples].sort((a, b) => a - b);
  const latestMs = cleanSamples[cleanSamples.length - 1];
  const averageMs = cleanSamples.reduce((sum, value) => sum + value, 0) / cleanSamples.length;
  const worstMs = sorted[sorted.length - 1];
  const budgetLimit = budgetMs + FRAME_BUDGET_TOLERANCE_MS;

  return {
    samples: cleanSamples.length,
    budgetMs,
    latestMs,
    averageMs,
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
    worstMs,
    fps: toFps(latestMs),
    averageFps: toFps(averageMs),
    minFps: toFps(worstMs),
    budgetMisses: cleanSamples.filter((value) => value > budgetLimit).length,
    stutters16: cleanSamples.filter((value) => value > 16.67).length,
    stutters25: cleanSamples.filter((value) => value > 25).length,
    stutters33: cleanSamples.filter((value) => value > 33.33).length,
  };
}
