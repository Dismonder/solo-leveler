export type MiniGameGraphicsQuality = "performance" | "balanced" | "cinematic";

const OBJECT_BUDGET: Record<MiniGameGraphicsQuality, number> = {
  performance: 7,
  balanced: 9,
  cinematic: 10,
};

export function getShadowExtractionObjectBudget(
  quality: MiniGameGraphicsQuality,
  underFramePressure: boolean
) {
  const base = OBJECT_BUDGET[quality] ?? OBJECT_BUDGET.balanced;
  return underFramePressure ? Math.max(5, base - 3) : base;
}
