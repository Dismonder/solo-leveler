export type ShadowExtractionImpactTier = "perfect" | "great" | "good";

export type ShadowExtractionImpactRenderer = {
  resize(cssWidth: number, cssHeight: number, dpr: number): void;
  emit(
    xPercent: number,
    yPercent: number,
    sizePx: number,
    rotationDeg: number,
    color: string,
    label: string,
    tier: ShadowExtractionImpactTier,
    nowMs: number,
  ): void;
  render(nowMs: number): void;
  clear(): void;
  activeCount(nowMs: number): number;
  destroy(): void;
};

type ImpactSlot = {
  active: boolean;
  xPercent: number;
  yPercent: number;
  sizePx: number;
  rotationDeg: number;
  color: string;
  label: string;
  tier: ShadowExtractionImpactTier;
  startedAtMs: number;
  lifetimeMs: number;
};

const GOOD_LIFETIME_MS = 280;
const GREAT_LIFETIME_MS = 320;
const PERFECT_LIFETIME_MS = 360;
const TWO_PI = Math.PI * 2;

export function createShadowExtractionImpactRenderer(
  canvas: HTMLCanvasElement,
): ShadowExtractionImpactRenderer {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Shadow Extraction impacts require a Canvas 2D context.");
  }

  const slots: [ImpactSlot, ImpactSlot, ImpactSlot, ImpactSlot] = [
    createEmptySlot(),
    createEmptySlot(),
    createEmptySlot(),
    createEmptySlot(),
  ];
  let live = true;
  let width = 0;
  let height = 0;
  let hasRenderedContent = false;

  function resize(cssWidth: number, cssHeight: number, dpr: number): void {
    if (!live) return;

    width = Math.max(0, finiteOrZero(cssWidth));
    height = Math.max(0, finiteOrZero(cssHeight));
    const pixelRatio = Math.max(1, Math.min(2, finiteOrOne(dpr)));
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    hasRenderedContent = false;
  }

  function emit(
    xPercent: number,
    yPercent: number,
    sizePx: number,
    rotationDeg: number,
    color: string,
    label: string,
    tier: ShadowExtractionImpactTier,
    nowMs: number,
  ): void {
    if (!live) return;

    expireSlots(nowMs);
    let slotIndex = -1;
    for (let index = 0; index < slots.length; index += 1) {
      if (!slots[index].active) {
        slotIndex = index;
        break;
      }
    }
    if (slotIndex === -1) {
      slotIndex = 0;
      for (let index = 1; index < slots.length; index += 1) {
        if (slots[index].startedAtMs < slots[slotIndex].startedAtMs) {
          slotIndex = index;
        }
      }
    }

    const slot = slots[slotIndex];
    slot.active = true;
    slot.xPercent = finiteOrZero(xPercent);
    slot.yPercent = finiteOrZero(yPercent);
    slot.sizePx = Math.max(0, finiteOrZero(sizePx));
    slot.rotationDeg = finiteOrZero(rotationDeg);
    slot.color = color;
    slot.label = label;
    slot.tier = tier;
    slot.startedAtMs = finiteOrZero(nowMs);
    slot.lifetimeMs = lifetimeForTier(tier);
  }

  function render(nowMs: number): void {
    if (!live) return;

    expireSlots(nowMs);
    let activeSlots = 0;
    for (let index = 0; index < slots.length; index += 1) {
      if (slots[index].active) activeSlots += 1;
    }
    if (activeSlots === 0) {
      if (hasRenderedContent) {
        context.clearRect(0, 0, width, height);
        hasRenderedContent = false;
      }
      return;
    }

    context.clearRect(0, 0, width, height);
    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      if (!slot.active) continue;

      const elapsedMs = nowMs - slot.startedAtMs;
      const progress = Math.max(0, elapsedMs / slot.lifetimeMs);
      drawSlot(context, slot, index, width, height, progress);
    }
    context.globalAlpha = 1;
    hasRenderedContent = true;
  }

  function clear(): void {
    if (!live) return;

    deactivateSlots();
    context.clearRect(0, 0, width, height);
    hasRenderedContent = false;
  }

  function activeCount(nowMs: number): number {
    if (!live) return 0;

    expireSlots(nowMs);
    let count = 0;
    for (let index = 0; index < slots.length; index += 1) {
      if (slots[index].active) count += 1;
    }
    return count;
  }

  function destroy(): void {
    if (!live) return;

    deactivateSlots();
    context.clearRect(0, 0, width, height);
    hasRenderedContent = false;
    live = false;
  }

  function expireSlots(nowMs: number): void {
    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      if (slot.active && nowMs - slot.startedAtMs >= slot.lifetimeMs) {
        slot.active = false;
      }
    }
  }

  function deactivateSlots(): void {
    for (let index = 0; index < slots.length; index += 1) {
      slots[index].active = false;
    }
  }

  return { resize, emit, render, clear, activeCount, destroy };
}

function createEmptySlot(): ImpactSlot {
  return {
    active: false,
    xPercent: 0,
    yPercent: 0,
    sizePx: 0,
    rotationDeg: 0,
    color: "",
    label: "",
    tier: "good",
    startedAtMs: 0,
    lifetimeMs: GOOD_LIFETIME_MS,
  };
}

function drawSlot(
  context: CanvasRenderingContext2D,
  slot: ImpactSlot,
  slotIndex: number,
  width: number,
  height: number,
  progress: number,
): void {
  const x = (slot.xPercent / 100) * width;
  const y = (slot.yPercent / 100) * height;
  const angle = (slot.rotationDeg * Math.PI) / 180;
  const eased = 1 - Math.pow(1 - progress, 3);
  const opacity = 1 - progress;
  const tierScale = slot.tier === "perfect" ? 1.35 : slot.tier === "great" ? 1.18 : 1;
  const slashHalfLength = slot.sizePx * tierScale * (0.55 + eased * 0.32);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  context.globalAlpha = opacity;
  context.strokeStyle = slot.color;
  context.lineWidth = slot.tier === "perfect" ? 4 : slot.tier === "great" ? 3 : 2;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(x - cos * slashHalfLength, y - sin * slashHalfLength);
  context.lineTo(x + cos * slashHalfLength, y + sin * slashHalfLength);
  context.stroke();

  context.lineWidth = slot.tier === "perfect" ? 3 : 2;
  context.beginPath();
  context.arc(x, y, Math.max(0, slot.sizePx * (0.18 + eased * 0.72)), 0, TWO_PI);
  context.stroke();

  const sparkCount = slot.tier === "perfect" ? 6 : slot.tier === "great" ? 5 : 4;
  context.fillStyle = slot.color;
  for (let sparkIndex = 0; sparkIndex < sparkCount; sparkIndex += 1) {
    const sparkAngle = angle + (sparkIndex * TWO_PI) / sparkCount + slotIndex * 0.19;
    const distance = slot.sizePx * eased * (0.55 + (sparkIndex % 3) * 0.12);
    const sparkX = x + Math.cos(sparkAngle) * distance;
    const sparkY = y + Math.sin(sparkAngle) * distance;
    const sparkRadius = Math.max(0.6, (slot.tier === "perfect" ? 2.8 : 2.2) * opacity);
    context.beginPath();
    context.arc(sparkX, sparkY, sparkRadius, 0, TWO_PI);
    context.fill();
  }

  const horizontalMargin = Math.min(56, width / 2);
  const verticalMargin = Math.min(16, height / 2);
  const labelX = clamp(x, horizontalMargin, width - horizontalMargin);
  const labelY = clamp(y - slot.sizePx * 0.55 - eased * 28, verticalMargin, height - verticalMargin);
  context.globalAlpha = Math.min(1, opacity * 1.8);
  context.fillStyle = slot.color;
  context.font = slot.tier === "perfect" ? "800 14px system-ui" : "700 12px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(slot.label, labelX, labelY);
}

function lifetimeForTier(tier: ShadowExtractionImpactTier): number {
  switch (tier) {
    case "perfect":
      return PERFECT_LIFETIME_MS;
    case "great":
      return GREAT_LIFETIME_MS;
    case "good":
      return GOOD_LIFETIME_MS;
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function finiteOrOne(value: number): number {
  return Number.isFinite(value) ? value : 1;
}
