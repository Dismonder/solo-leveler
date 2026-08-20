import assert from "node:assert/strict";
import test from "node:test";
import {
  createShadowExtractionImpactRenderer,
  type ShadowExtractionImpactRenderer,
  type ShadowExtractionImpactTier,
} from "./shadowExtractionImpactRenderer";

test("one hundred emissions never activate more than four impact slots", () => {
  const layer = createFakeCanvas();
  const renderer = createShadowExtractionImpactRenderer(layer.canvas);

  for (let index = 0; index < 100; index += 1) {
    emit(renderer, `impact-${index}`, "good", index);
    assert.ok(renderer.activeCount(index) <= 4);
  }
});

test("the fifth impact overwrites the oldest active slot", () => {
  const layer = createFakeCanvas();
  const renderer = createShadowExtractionImpactRenderer(layer.canvas);
  renderer.resize(320, 180, 1);
  emit(renderer, "oldest", "perfect", 0);
  emit(renderer, "second", "perfect", 10);
  emit(renderer, "third", "perfect", 20);
  emit(renderer, "fourth", "perfect", 30);
  emit(renderer, "newest", "perfect", 40);

  renderer.render(100);

  assert.deepEqual(layer.context.labels(), ["newest", "second", "third", "fourth"]);
});

test("each tier remains visible before its lifetime boundary and expires exactly at it", () => {
  const lifetimes: ReadonlyArray<readonly [ShadowExtractionImpactTier, number]> = [
    ["good", 280],
    ["great", 320],
    ["perfect", 360],
  ];

  for (const [tier, lifetimeMs] of lifetimes) {
    const layer = createFakeCanvas();
    const renderer = createShadowExtractionImpactRenderer(layer.canvas);
    renderer.resize(320, 180, 1);
    emit(renderer, tier, tier, 1_000);

    renderer.render(1_000 + lifetimeMs - 0.01);
    assert.deepEqual(layer.context.labels(), [tier]);
    assert.equal(renderer.activeCount(1_000 + lifetimeMs - 0.01), 1);

    renderer.render(1_000 + lifetimeMs);
    assert.deepEqual(layer.context.labels(), []);
    assert.equal(renderer.activeCount(1_000 + lifetimeMs), 0);
  }
});

test("60 Hz and 120 Hz sampling produce the same frame at the same final timestamp", () => {
  const sixtyHz = renderSchedule(1_000 / 60);
  const oneTwentyHz = renderSchedule(1_000 / 120);

  assert.deepEqual(sixtyHz, oneTwentyHz);
});

test("resize caps DPR at two and emit or render never resize the backing store", () => {
  const layer = createFakeCanvas();
  const renderer = createShadowExtractionImpactRenderer(layer.canvas);
  renderer.resize(120, 60, 3);

  assert.equal(layer.canvas.width, 240);
  assert.equal(layer.canvas.height, 120);
  const writesAfterResize = layer.backingStoreWrites;

  emit(renderer, "impact", "perfect", 0);
  renderer.render(100);
  renderer.render(200);

  assert.equal(layer.backingStoreWrites, writesAfterResize);
});

test("clean idle renders perform zero canvas operations", () => {
  const layer = createFakeCanvas();
  const renderer = createShadowExtractionImpactRenderer(layer.canvas);
  renderer.resize(320, 180, 1);
  layer.context.resetHistory();

  renderer.render(0);
  renderer.render(1_000);

  assert.equal(layer.context.callCount, 0);
  assert.equal(layer.context.operationCount("clearRect"), 0);
});

test("an active impact renders and its final expiry clears the canvas exactly once", () => {
  const layer = createFakeCanvas();
  const renderer = createShadowExtractionImpactRenderer(layer.canvas);
  renderer.resize(320, 180, 1);
  emit(renderer, "impact", "good", 0);
  layer.context.resetHistory();

  renderer.render(100);

  assert.equal(layer.context.operationCount("clearRect"), 1);
  assert.equal(layer.context.operationCount("stroke"), 2);
  assert.equal(layer.context.operationCount("fillText"), 1);

  layer.context.resetHistory();
  renderer.render(280);
  assert.equal(layer.context.callCount, 1);
  assert.equal(layer.context.operationCount("clearRect"), 1);

  renderer.render(281);
  renderer.render(10_000);
  assert.equal(layer.context.callCount, 1);
  assert.equal(layer.context.operationCount("clearRect"), 1);
});

test("four perfect impacts stay within the fixed canvas operation budget", () => {
  const layer = createFakeCanvas();
  const renderer = createShadowExtractionImpactRenderer(layer.canvas);
  renderer.resize(320, 180, 1);
  for (let index = 0; index < 4; index += 1) {
    renderer.emit(20 + index * 20, 50, 60, index * 20, "#facc15", `perfect-${index}`, "perfect", 0);
  }
  layer.context.resetHistory();

  renderer.render(100);

  const slashCalls = 4;
  const ringCalls = 3;
  const sparkCalls = 3;
  const labelCalls = 1;
  const maxCallsPerSlot = slashCalls + ringCalls + 6 * sparkCalls + labelCalls;
  assert.ok(layer.context.callCount <= 1 + 4 * maxCallsPerSlot);
  assert.equal(layer.context.operationCount("stroke"), 8);
  assert.ok(layer.context.operationCount("fill") <= 24);
  assert.equal(layer.context.operationCount("fillText"), 4);
});

test("destroy makes every renderer method inert", () => {
  const layer = createFakeCanvas();
  const renderer = createShadowExtractionImpactRenderer(layer.canvas);
  renderer.resize(320, 180, 1);
  emit(renderer, "impact", "perfect", 0);
  renderer.destroy();
  const callsAfterDestroy = layer.context.callCount;
  const writesAfterDestroy = layer.backingStoreWrites;

  renderer.resize(640, 360, 2);
  emit(renderer, "ignored", "perfect", 10);
  renderer.render(20);
  renderer.clear();
  renderer.destroy();

  assert.equal(renderer.activeCount(20), 0);
  assert.equal(layer.context.callCount, callsAfterDestroy);
  assert.equal(layer.backingStoreWrites, writesAfterDestroy);
});

function emit(
  renderer: ShadowExtractionImpactRenderer,
  label: string,
  tier: ShadowExtractionImpactTier,
  nowMs: number,
): void {
  renderer.emit(50, 50, 60, 30, "#67e8f9", label, tier, nowMs);
}

function renderSchedule(stepMs: number): readonly unknown[] {
  const layer = createFakeCanvas();
  const renderer = createShadowExtractionImpactRenderer(layer.canvas);
  renderer.resize(320, 180, 1);
  renderer.emit(42, 61, 72, 33, "#67e8f9", "same-frame", "perfect", 1_000);
  const finalTimestamp = 1_240;
  for (let nowMs = 1_000; nowMs < finalTimestamp; nowMs += stepMs) {
    renderer.render(nowMs);
  }
  renderer.render(finalTimestamp);
  return layer.context.frame;
}

function createFakeCanvas(): {
  canvas: HTMLCanvasElement;
  context: FakeCanvasContext;
  backingStoreWrites: number;
} {
  const context = new FakeCanvasContext();
  let width = 0;
  let height = 0;
  let backingStoreWrites = 0;

  const canvas = {
    get width() {
      return width;
    },
    set width(value: number) {
      backingStoreWrites += 1;
      width = value;
    },
    get height() {
      return height;
    },
    set height(value: number) {
      backingStoreWrites += 1;
      height = value;
    },
    getContext(kind: string) {
      return kind === "2d" ? context : null;
    },
  } as unknown as HTMLCanvasElement;

  return {
    canvas,
    context,
    get backingStoreWrites() {
      return backingStoreWrites;
    },
  };
}

class FakeCanvasContext {
  callCount = 0;
  frame: unknown[] = [];
  fillStyle: string | CanvasGradient | CanvasPattern = "";
  strokeStyle: string | CanvasGradient | CanvasPattern = "";
  lineWidth = 1;
  lineCap: CanvasLineCap = "butt";
  font = "";
  textAlign: CanvasTextAlign = "start";
  textBaseline: CanvasTextBaseline = "alphabetic";
  globalAlpha = 1;
  private path: number[] = [];

  resetHistory(): void {
    this.callCount = 0;
    this.frame = [];
    this.path = [];
  }

  labels(): string[] {
    return this.frame
      .filter((operation): operation is ["fillText", string, ...unknown[]] => Array.isArray(operation) && operation[0] === "fillText")
      .map((operation) => operation[1]);
  }

  operationCount(name: string): number {
    return this.frame.filter((operation) => Array.isArray(operation) && operation[0] === name).length;
  }

  clearRect(x: number, y: number, width: number, height: number): void {
    this.callCount += 1;
    this.frame = [["clearRect", x, y, width, height]];
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.callCount += 1;
    this.frame.push(["setTransform", a, b, c, d, e, f]);
  }

  beginPath(): void {
    this.callCount += 1;
    this.path = [];
  }

  moveTo(x: number, y: number): void {
    this.callCount += 1;
    this.path.push(x, y);
  }

  lineTo(x: number, y: number): void {
    this.callCount += 1;
    this.path.push(x, y);
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void {
    this.callCount += 1;
    this.path.push(x, y, radius, startAngle, endAngle);
  }

  stroke(): void {
    this.callCount += 1;
    this.frame.push(["stroke", this.strokeStyle, this.lineWidth, this.globalAlpha, ...this.path]);
  }

  fill(): void {
    this.callCount += 1;
    this.frame.push(["fill", this.fillStyle, this.globalAlpha, ...this.path]);
  }

  fillText(text: string, x: number, y: number): void {
    this.callCount += 1;
    this.frame.push([
      "fillText",
      text,
      x,
      y,
      this.fillStyle,
      this.font,
      this.textAlign,
      this.textBaseline,
      this.globalAlpha,
    ]);
  }
}
