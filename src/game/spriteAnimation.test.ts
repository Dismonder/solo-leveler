import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getActorSheetKind,
  getAllSpriteAnimationDefinitions,
  getModelFrameSize,
  getSpriteAnimationDefinition,
  getSpriteSheetFilename,
} from "./spriteAnimation";
import { getWeightedAnimationFrame } from "../hooks/useFrameAnimation";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const actorsDir = resolve(repoRoot, "src/assets/models/actors");
const frameDir = resolve(repoRoot, "art-src/sprite-frames");
const qaReportPath = resolve(repoRoot, "art-src/sprite-previews/_qa-report.json");
const previewIndexPath = resolve(repoRoot, "art-src/sprite-previews/index.html");

function readPngSize(path: string) {
  const buffer = readFileSync(path);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test("sprite animation manifest maps actors to file-backed frame sheets", () => {
  assert.equal(getActorSheetKind("hunter"), "hunter");
  assert.equal(getActorSheetKind("goblin"), "goblin-archer");
  assert.equal(getActorSheetKind("goblin_assassin"), "goblin-assassin");
  assert.equal(getActorSheetKind("mage"), "wraith");
  assert.equal(getActorSheetKind("worm"), "worm");
  assert.equal(getSpriteSheetFilename("slime_cursed", "attack_1"), "slime-cursed-attack_1");
});

test("frame definitions expose manifest metadata for runtime timing", () => {
  const hunterDash = getSpriteAnimationDefinition("hunter", "dash");
  const wolfRun = getSpriteAnimationDefinition("wolf", "run");
  const wormRun = getSpriteAnimationDefinition("worm", "run");
  const golemDeath = getSpriteAnimationDefinition("golem", "death");

  assert.equal(hunterDash.frames, 24);
  assert.equal(hunterDash.mode, "once");
  assert.equal(hunterDash.hitFrame, 12);
  assert.equal(hunterDash.sourceFrameSize, 384);
  assert.equal(hunterDash.motionProfile, "dash");
  assert.equal(hunterDash.frameWeights.length, hunterDash.frames);
  assert.equal(wolfRun.frames, 7);
  assert.equal(wolfRun.loop, true);
  assert.equal(wolfRun.frameWeights.length, wolfRun.frames);
  assert.equal(wormRun.frames, 10);
  assert.equal(wormRun.durationMs, 820);
  assert.equal(golemDeath.frames, 7);
});

test("weighted frame timing holds readable impact poses", () => {
  const hunterAttack = getSpriteAnimationDefinition("hunter", "attack_1");
  const hitFrame = hunterAttack.hitFrame ?? 0;

  assert.ok(hunterAttack.frameWeights[hitFrame] > hunterAttack.frameWeights[0]);
  assert.equal(getWeightedAnimationFrame(0, hunterAttack), 0);
  assert.ok(getWeightedAnimationFrame(hunterAttack.durationMs * 0.72, hunterAttack) >= hitFrame);
  assert.equal(getWeightedAnimationFrame(hunterAttack.durationMs - 1, hunterAttack), hunterAttack.frames - 1);
});

test("main character uses extended source strips for smooth movement", () => {
  const hunterRun = getSpriteAnimationDefinition("hunter", "run");
  const hunterAttack = getSpriteAnimationDefinition("hunter", "attack_1");
  const hunterDeath = getSpriteAnimationDefinition("hunter", "death");

  assert.equal(hunterRun.frames, 24);
  assert.equal(hunterAttack.frames, 12);
  assert.equal(hunterDeath.frames, 24);
  assert.ok(hunterRun.durationMs > hunterAttack.durationMs);
});

test("runtime sheets exist and match manifest frame counts", () => {
  for (const kind of ["hunter", "goblin", "goblin_assassin", "wolf", "spider", "slime_cursed", "skeleton_shield", "wraith", "knight", "golem", "worm"] as const) {
    for (const definition of getAllSpriteAnimationDefinitions(kind)) {
      const sheetPath = resolve(actorsDir, definition.sheet);
      assert.equal(existsSync(sheetPath), true, `${definition.sheet} is missing`);
      const size = readPngSize(sheetPath);
      assert.equal(size.width, definition.frames * definition.sourceFrameSize, `${definition.sheet} width mismatch`);
      assert.equal(size.height, definition.sourceFrameSize, `${definition.sheet} height mismatch`);
    }
  }
});

test("sprite extraction QA does not publish missing or failed animations", () => {
  assert.equal(existsSync(qaReportPath), true, "sprite QA report is missing; run scripts/extract-model-animations.ps1");
  const report = JSON.parse(readFileSync(qaReportPath, "utf8")) as {
    sources: Array<{
      actor: string;
      animations: Array<{ animation: string; status: string }>;
    }>;
  };

  for (const source of report.sources) {
    for (const animation of source.animations) {
      assert.notEqual(animation.status, "missingSource", `${source.actor}/${animation.animation} source is missing`);
      assert.notEqual(animation.status, "failed", `${source.actor}/${animation.animation} failed extraction QA`);
    }
  }
});

test("sprite extraction writes inspectable frame folders before runtime strips", () => {
  for (const [kind, animation] of [
    ["hunter", "run"],
    ["hunter", "attack_1"],
    ["wolf", "run"],
    ["worm", "run"],
  ] as const) {
    const definition = getSpriteAnimationDefinition(kind, animation);
    const animationFrameDir = resolve(frameDir, definition.sheet.replace(/\.png$/, "").replace(`-${animation}`, ""), animation);
    const frameFiles = readdirSync(animationFrameDir).filter((file) => file.endsWith(".png"));
    assert.equal(frameFiles.length, definition.frames, `${kind}/${animation} frame folder count mismatch`);

    const frameSize = readPngSize(resolve(animationFrameDir, frameFiles[0]));
    assert.equal(frameSize.width, definition.sourceFrameSize);
    assert.equal(frameSize.height, definition.sourceFrameSize);

    const metadata = JSON.parse(readFileSync(resolve(animationFrameDir, "_metadata.json"), "utf8")) as {
      frameSize: number;
      quality: { maxCenterShift: number; maxHeightShift: number; warnings: string[] };
      frames: unknown[];
    };
    assert.equal(metadata.frameSize, definition.sourceFrameSize);
    assert.ok(Number.isFinite(metadata.quality.maxCenterShift));
    assert.ok(Number.isFinite(metadata.quality.maxHeightShift));
    assert.ok(Array.isArray(metadata.quality.warnings));
    assert.equal(metadata.frames.length, definition.frames);
  }
});

test("sprite preview player is generated for visual QA", () => {
  assert.equal(existsSync(previewIndexPath), true, "sprite preview player is missing");
  const html = readFileSync(previewIndexPath, "utf8");
  assert.match(html, /Sprite QA Player/);
  assert.match(html, /const animations = /);
  assert.match(html, /sprite-frames\/hunter\/run/);
});

test("SpriteActor separates motion transforms from sprite strip frame transforms", () => {
  const componentSource = readFileSync(resolve(repoRoot, "src/components/SpriteActor.tsx"), "utf8");
  const cssSource = readFileSync(resolve(repoRoot, "src/index.css"), "utf8");

  assert.match(componentSource, /sl-model-motion/);
  assert.match(componentSource, /sl-model-frame-window/);
  assert.match(cssSource, /\.sl-model-anim-run \.sl-model-motion/);
  assert.match(cssSource, /\.sl-model-anim-run \.sl-model-motion\s*\{[^}]*var\(--sprite-duration/s);
  assert.doesNotMatch(cssSource, /\.sl-model-anim-run \.sl-model-img\s*\{/);
});

test("slot frame sizes keep gameplay, cards and combat visually separate", () => {
  assert.ok(getModelFrameSize("md", "gameplay") < getModelFrameSize("xl", "combat"));
  assert.ok(getModelFrameSize("lg", "card") < getModelFrameSize("xl", "background"));
});
