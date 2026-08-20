export type MiniGameGraphicsQuality = "performance" | "balanced" | "cinematic";

const OBJECT_BUDGET: Record<MiniGameGraphicsQuality, number> = {
  performance: 7,
  balanced: 9,
  cinematic: 10,
};

const IMPACT_BUDGET: Record<MiniGameGraphicsQuality, number> = {
  performance: 8,
  balanced: 12,
  cinematic: 16,
};

const IMPACT_LIFETIME_MS: Record<MiniGameGraphicsQuality, number> = {
  performance: 850,
  balanced: 1000,
  cinematic: 1200,
};

export function getShadowExtractionObjectBudget(
  quality: MiniGameGraphicsQuality,
  underFramePressure: boolean
) {
  const base = OBJECT_BUDGET[quality] ?? OBJECT_BUDGET.balanced;
  return underFramePressure ? Math.max(5, base - 3) : base;
}

export function getShadowExtractionImpactBudget(
  quality: MiniGameGraphicsQuality,
  underFramePressure: boolean
) {
  const base = IMPACT_BUDGET[quality] ?? IMPACT_BUDGET.balanced;
  return underFramePressure ? Math.max(1, base - 2) : base;
}

export function getShadowExtractionImpactLifetimeMs(
  quality: MiniGameGraphicsQuality,
  underFramePressure: boolean
) {
  const base = IMPACT_LIFETIME_MS[quality] ?? IMPACT_LIFETIME_MS.balanced;
  return underFramePressure ? Math.max(340, Math.round(base * 0.72)) : base;
}
