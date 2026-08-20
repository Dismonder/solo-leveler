import {
  getShadowStrikeHitWindows,
  getShadowStrikeSnapshot,
  type ShadowStrikeConfig,
  type ShadowStrikeOutcome,
  type ShadowStrikeRuntime,
  type ShadowStrikeTier,
} from "../game/shadowStrikeEngine";

export type ShadowStrikeLayout = {
  width: number;
  height: number;
  trackLeft: number;
  trackRight: number;
  trackTop: number;
  trackBottom: number;
  targetCenterX: number;
  hitLeft: number;
  hitRight: number;
  perfectLeft: number;
  perfectRight: number;
};

export type ShadowStrikeRenderer = {
  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number): void;
  drawStatic(config: ShadowStrikeConfig): void;
  render(runtime: ShadowStrikeRuntime, nowMs: number): void;
  flash(outcome: ShadowStrikeOutcome, nowMs: number): void;
  destroy(): void;
};

const HORIZONTAL_PADDING = 12;
const TRACK_HEIGHT = 22;
const FLASH_DURATION_MS = 360;

export function createShadowStrikeLayout(
  width: number,
  height: number,
  config: ShadowStrikeConfig
): ShadowStrikeLayout {
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);
  const trackLeft = Math.min(HORIZONTAL_PADDING, safeWidth / 2);
  const trackRight = Math.max(trackLeft, safeWidth - HORIZONTAL_PADDING);
  const trackHeight = Math.min(TRACK_HEIGHT, safeHeight);
  const trackTop = (safeHeight - trackHeight) / 2;
  const trackBottom = trackTop + trackHeight;
  const trackWidth = trackRight - trackLeft;
  const targetCenterX = safeWidth / 2;
  const hitHalfWidth = (trackWidth * config.hitWindowWidth) / 200;
  const perfectHalfWidth = (trackWidth * config.perfectWindowWidth) / 200;
  const hitLeft = clamp(targetCenterX - hitHalfWidth, trackLeft, trackRight);
  const hitRight = clamp(targetCenterX + hitHalfWidth, trackLeft, trackRight);
  const perfectLeft = clamp(targetCenterX - perfectHalfWidth, hitLeft, hitRight);
  const perfectRight = clamp(targetCenterX + perfectHalfWidth, hitLeft, hitRight);

  return {
    width: safeWidth,
    height: safeHeight,
    trackLeft,
    trackRight,
    trackTop,
    trackBottom,
    targetCenterX,
    hitLeft,
    hitRight,
    perfectLeft,
    perfectRight,
  };
}

export function createShadowStrikeRenderer(
  staticCanvas: HTMLCanvasElement,
  dynamicCanvas: HTMLCanvasElement
): ShadowStrikeRenderer {
  const staticContext = staticCanvas.getContext("2d");
  const dynamicContext = dynamicCanvas.getContext("2d");
  if (staticContext === null || dynamicContext === null) {
    throw new Error("Shadow Strike requires Canvas 2D contexts.");
  }

  let active = true;
  let cssWidth = 0;
  let cssHeight = 0;
  let layout = createShadowStrikeLayout(0, 0, emptyConfig);
  let cachedScore = Number.NaN;
  let cachedCombo = Number.NaN;
  let cachedRemainingSeconds = Number.NaN;
  let cachedSpeedMultiplier = Number.NaN;
  let cachedDifficultyTier = Number.NaN;
  let lastDrawnHitWidth = Number.NaN;
  let lastDrawnPerfectWidth = Number.NaN;
  let scoreText = "";
  let comboText = "";
  let remainingText = "";
  let tempoText = "";
  let flashTier: ShadowStrikeTier = "miss";
  let flashGain = 0;
  let flashUntilMs = Number.NEGATIVE_INFINITY;
  let flashText = "";

  function resize(nextWidth: number, nextHeight: number, devicePixelRatio: number): void {
    if (!active) return;

    cssWidth = Math.max(0, nextWidth);
    cssHeight = Math.max(0, nextHeight);
    const pixelRatio = Math.max(1, Math.min(2, devicePixelRatio));
    const backingWidth = Math.round(cssWidth * pixelRatio);
    const backingHeight = Math.round(cssHeight * pixelRatio);

    staticCanvas.width = backingWidth;
    staticCanvas.height = backingHeight;
    dynamicCanvas.width = backingWidth;
    dynamicCanvas.height = backingHeight;
    staticContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    dynamicContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawStatic(config: ShadowStrikeConfig): void {
    if (!active) return;

    lastDrawnHitWidth = config.hitWindowWidth;
    lastDrawnPerfectWidth = config.perfectWindowWidth;
    layout = createShadowStrikeLayout(cssWidth, cssHeight, config);
    staticContext.clearRect(0, 0, cssWidth, cssHeight);
    staticContext.fillStyle = "#101827";
    staticContext.fillRect(layout.trackLeft, layout.trackTop, layout.trackRight - layout.trackLeft, layout.trackBottom - layout.trackTop);
    staticContext.fillStyle = "#19d3da";
    staticContext.fillRect(layout.hitLeft, layout.trackTop, layout.hitRight - layout.hitLeft, layout.trackBottom - layout.trackTop);
    staticContext.fillStyle = "#f4c95d";
    staticContext.fillRect(
      layout.perfectLeft,
      layout.trackTop,
      layout.perfectRight - layout.perfectLeft,
      layout.trackBottom - layout.trackTop
    );
  }

  function render(runtime: ShadowStrikeRuntime, nowMs: number): void {
    if (!active) return;

    const { hitWindowWidth, perfectWindowWidth } = getShadowStrikeHitWindows(
      runtime.score,
      runtime.combo,
      runtime.config.level ?? 1,
      runtime.config.hitWindowBonus ?? 0,
      runtime.perfectStreak ?? 0
    );

    if (hitWindowWidth !== lastDrawnHitWidth || perfectWindowWidth !== lastDrawnPerfectWidth) {
      drawStatic({
        ...runtime.config,
        hitWindowWidth,
        perfectWindowWidth,
      });
    }

    dynamicContext.clearRect(0, 0, cssWidth, cssHeight);
    const cursorX = layout.trackLeft + ((layout.trackRight - layout.trackLeft) * runtime.cursorPosition) / 100;
    const cursorTop = layout.trackTop - 7;
    const cursorBottom = layout.trackBottom + 7;
    dynamicContext.strokeStyle = "#0b1020";
    dynamicContext.lineWidth = 6;
    drawVerticalStroke(dynamicContext, cursorX, cursorTop, cursorBottom);
    dynamicContext.strokeStyle = "#47f8ff";
    dynamicContext.lineWidth = 3;
    drawVerticalStroke(dynamicContext, cursorX - 2, cursorTop, cursorBottom);
    dynamicContext.strokeStyle = "#ffffff";
    dynamicContext.lineWidth = 1;
    drawVerticalStroke(dynamicContext, cursorX + 2, cursorTop, cursorBottom);

    if (runtime.score !== cachedScore) {
      cachedScore = runtime.score;
      scoreText = "Score: " + runtime.score;
    }
    if (runtime.combo !== cachedCombo) {
      cachedCombo = runtime.combo;
      comboText = "Combo: " + runtime.combo;
    }
    const remainingSeconds = Math.ceil(runtime.remainingMs / 1000);
    if (remainingSeconds !== cachedRemainingSeconds) {
      cachedRemainingSeconds = remainingSeconds;
      remainingText = "Time: " + remainingSeconds + "s";
    }

    const snapshot = getShadowStrikeSnapshot(runtime);
    if (snapshot.speedMultiplier !== cachedSpeedMultiplier || snapshot.difficultyTier !== cachedDifficultyTier) {
      cachedSpeedMultiplier = snapshot.speedMultiplier;
      cachedDifficultyTier = snapshot.difficultyTier;
      tempoText = `Tempo: ${snapshot.speedMultiplier.toFixed(1)}x · Lv.${snapshot.difficultyTier}`;
    }

    dynamicContext.fillStyle = "#f8fafc";
    dynamicContext.font = "600 14px system-ui";
    dynamicContext.textBaseline = "top";
    dynamicContext.textAlign = "left";
    dynamicContext.fillText(scoreText, layout.trackLeft, 4);
    dynamicContext.fillText(comboText, layout.trackLeft, 22);

    dynamicContext.textAlign = "right";
    dynamicContext.fillText(remainingText, layout.trackRight, 4);

    dynamicContext.fillStyle = snapshot.speedMultiplier >= 1.4 ? "#facc15" : "#38bdf8";
    dynamicContext.font = "600 11px system-ui";
    dynamicContext.fillText(tempoText, layout.trackRight, 22);

    if (nowMs < flashUntilMs) {
      dynamicContext.fillStyle = flashColor(flashTier);
      dynamicContext.textAlign = "center";
      dynamicContext.font = "700 16px system-ui";
      dynamicContext.fillText(flashText, layout.targetCenterX, layout.trackBottom + 12);
    }
  }

  function flash(outcome: ShadowStrikeOutcome, nowMs: number): void {
    if (!active) return;

    flashTier = outcome.tier;
    flashGain = outcome.gain;
    flashUntilMs = nowMs + FLASH_DURATION_MS;
    switch (flashTier) {
      case "perfect":
        flashText = (outcome.perfectStreak && outcome.perfectStreak >= 2)
          ? `PERFECT x${outcome.perfectStreak} (+${outcome.gain})`
          : "PERFECT +" + flashGain;
        break;
      case "great":
        flashText = "GREAT +" + flashGain;
        break;
      case "good":
        flashText = "GOOD +" + flashGain;
        break;
      case "miss":
        flashText = "MISS";
        break;
    }
  }

  function destroy(): void {
    if (!active) return;

    active = false;
    staticContext.clearRect(0, 0, cssWidth, cssHeight);
    dynamicContext.clearRect(0, 0, cssWidth, cssHeight);
  }

  return { resize, drawStatic, render, flash, destroy };
}

const emptyConfig: ShadowStrikeConfig = {
  durationMs: 0,
  maxRemainingMs: 0,
  inputCooldownMs: 0,
  targetCenter: 50,
  hitWindowWidth: 0,
  perfectWindowWidth: 0,
  oneWayMs: 0,
  scoreMultiplier: 0,
  penaltyResist: 0,
  missPenaltyMs: 0,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function drawVerticalStroke(context: CanvasRenderingContext2D, x: number, top: number, bottom: number): void {
  context.beginPath();
  context.moveTo(x, top);
  context.lineTo(x, bottom);
  context.stroke();
}

function flashColor(tier: ShadowStrikeTier): string {
  switch (tier) {
    case "perfect":
      return "#f4c95d";
    case "great":
      return "#47f8ff";
    case "good":
      return "#a7f3d0";
    case "miss":
      return "#fb7185";
  }
}

