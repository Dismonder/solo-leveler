import assert from "node:assert/strict";
import test from "node:test";
import { createShadowStrikeConfig, createShadowStrikeRuntime } from "../game/shadowStrikeEngine";
import { createShadowStrikeLayout, createShadowStrikeRenderer } from "./shadowStrikeRenderer";

test("renderer layout keeps the target centered", () => {
  const layout = createShadowStrikeLayout(600, 84, createShadowStrikeConfig(12, 0, 0, 0));
  assert.equal(layout.targetCenterX, 300);
  assert.ok(layout.hitLeft < 300 && layout.hitRight > 300);
  assert.ok(layout.perfectLeft > layout.hitLeft);
  assert.ok(layout.perfectRight < layout.hitRight);
});

test("renderer layout stays inside small canvases", () => {
  const layout = createShadowStrikeLayout(240, 56, createShadowStrikeConfig(99, 0, 0, 0));
  assert.ok(layout.trackLeft >= 0);
  assert.ok(layout.trackRight <= 240);
  assert.ok(layout.trackTop >= 0);
  assert.ok(layout.trackBottom <= 56);
});

test("renderer resizes only on resize and becomes inert after destroy", () => {
  const staticLayer = createFakeCanvas();
  const dynamicLayer = createFakeCanvas();
  const renderer = createShadowStrikeRenderer(staticLayer.canvas, dynamicLayer.canvas);
  const config = createShadowStrikeConfig(1, 0, 0, 0);
  const runtime = createShadowStrikeRuntime(0, config);

  renderer.resize(120, 60, 3);
  assert.equal(staticLayer.canvas.width, 240);
  assert.equal(staticLayer.canvas.height, 120);
  assert.equal(dynamicLayer.canvas.width, 240);
  assert.equal(dynamicLayer.canvas.height, 120);

  const staticWidthWrites = staticLayer.backingStoreWrites;
  const dynamicWidthWrites = dynamicLayer.backingStoreWrites;
  renderer.render(runtime, 16);
  renderer.render(runtime, 24);
  assert.equal(staticLayer.backingStoreWrites, staticWidthWrites);
  assert.equal(dynamicLayer.backingStoreWrites, dynamicWidthWrites);

  renderer.destroy();
  const dynamicOperationsAfterDestroy = dynamicLayer.context.operations;
  renderer.render(runtime, 32);
  assert.equal(dynamicLayer.context.operations, dynamicOperationsAfterDestroy);
});

test("renderer dynamically redraws static target zone when difficulty scales", () => {
  const staticLayer = createFakeCanvas();
  const dynamicLayer = createFakeCanvas();
  const renderer = createShadowStrikeRenderer(staticLayer.canvas, dynamicLayer.canvas);
  const config = createShadowStrikeConfig(1, 0, 0, 0);
  const runtime = createShadowStrikeRuntime(0, config);

  renderer.resize(600, 84, 1);
  renderer.drawStatic(config);

  const initialStaticOps = staticLayer.context.operations;
  renderer.render(runtime, 16);

  // When score rises significantly, target zone dynamically tightens
  runtime.score = 800;
  runtime.combo = 10;
  renderer.render(runtime, 32);

  assert.ok(staticLayer.context.operations > initialStaticOps);
});


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
  operations = 0;
  fillStyle = "";
  strokeStyle = "";
  lineWidth = 1;
  font = "";
  textAlign: CanvasTextAlign = "start";
  textBaseline: CanvasTextBaseline = "alphabetic";

  clearRect(): void {
    this.operations += 1;
  }

  fillRect(): void {
    this.operations += 1;
  }

  setTransform(): void {
    this.operations += 1;
  }

  beginPath(): void {
    this.operations += 1;
  }

  moveTo(): void {
    this.operations += 1;
  }

  lineTo(): void {
    this.operations += 1;
  }

  stroke(): void {
    this.operations += 1;
  }

  fillText(): void {
    this.operations += 1;
  }
}
