export type SpriteActorAnimation = "idle" | "run" | "dash" | "attack_1" | "attack_2" | "guard" | "cast" | "hurt" | "death";
export type SpriteActorSlot = "gameplay" | "combat" | "card" | "background";
export type SpriteActorSize = "sm" | "md" | "lg" | "xl";
export type SpriteActorKind =
  | "hunter"
  | "goblin"
  | "wolf"
  | "mage"
  | "boss"
  | "shadow"
  | "assassin"
  | "golem"
  | "wraith"
  | "knight"
  | "spider"
  | "worm"
  | "goblin_archer"
  | "goblin_assassin"
  | "young_spider"
  | "young_wolf"
  | "slime_cursed"
  | "skeleton_shield";

export type SpritePlaybackMode = "loop" | "once";
export type SpriteMotionProfile = "idle" | "locomotion" | "dash" | "attack" | "cast" | "guard" | "hurt" | "death";
export type SpriteAnchor = { x: number; y: number };

export type SpriteAnimationDefinition = {
  animation: SpriteActorAnimation;
  frames: number;
  durationMs: number;
  mode: SpritePlaybackMode;
  loop: boolean;
  holdLastFrame: boolean;
  sourceFrameSize: number;
  hitFrame: number | null;
  anchor: SpriteAnchor;
  scale: number;
  motionProfile: SpriteMotionProfile;
  frameWeights: number[];
  source: string;
  sheet: string;
};

export const SPRITE_SOURCE_FRAME_SIZE = 384;

export const MODEL_FRAME_SIZES: Record<SpriteActorSlot, Record<SpriteActorSize, number>> = {
  gameplay: { sm: 54, md: 78, lg: 98, xl: 116 },
  combat: { sm: 76, md: 110, lg: 140, xl: 168 },
  card: { sm: 52, md: 70, lg: 88, xl: 104 },
  background: { sm: 82, md: 118, lg: 164, xl: 214 },
};

const SPRITE_ANIMATIONS: SpriteActorAnimation[] = ["idle", "run", "dash", "attack_1", "attack_2", "guard", "cast", "hurt", "death"];

const LOOPING_ANIMATIONS = new Set<SpriteActorAnimation>(["idle", "run"]);

const BASE_DURATION: Record<SpriteActorAnimation, number> = {
  idle: 1080,
  run: 760,
  dash: 480,
  attack_1: 660,
  attack_2: 700,
  guard: 500,
  cast: 780,
  hurt: 430,
  death: 980,
};

const BASE_FRAMES: Record<SpriteActorAnimation, number> = {
  idle: 6,
  run: 7,
  dash: 7,
  attack_1: 7,
  attack_2: 7,
  guard: 6,
  cast: 7,
  hurt: 6,
  death: 7,
};

const HIT_FRAME: Record<SpriteActorAnimation, number | null> = {
  idle: null,
  run: null,
  dash: 3,
  attack_1: 4,
  attack_2: 4,
  guard: 2,
  cast: 5,
  hurt: 2,
  death: null,
};

const MOTION_PROFILE: Record<SpriteActorAnimation, SpriteMotionProfile> = {
  idle: "idle",
  run: "locomotion",
  dash: "dash",
  attack_1: "attack",
  attack_2: "attack",
  guard: "guard",
  cast: "cast",
  hurt: "hurt",
  death: "death",
};

export const MODEL_SHEET_KIND: Record<SpriteActorKind, string> = {
  hunter: "hunter",
  goblin: "goblin-archer",
  goblin_archer: "goblin-archer",
  goblin_assassin: "goblin-assassin",
  shadow: "assassin",
  assassin: "assassin",
  wolf: "wolf",
  young_wolf: "wolf",
  mage: "wraith",
  wraith: "wraith",
  boss: "golem",
  golem: "golem",
  knight: "knight",
  spider: "spider",
  young_spider: "spider",
  worm: "worm",
  slime_cursed: "slime-cursed",
  skeleton_shield: "skeleton-shield",
};

const MODEL_SOURCES: Record<string, string> = {
  hunter: "modele/modele_bohaterow/modele_bohater_3-6.png",
  assassin: "modele/model_monster/model_animacja_goblin_zab*.png",
  "goblin-archer": "modele/model_monster/model_animacja_goblin_lucznik.png",
  "goblin-assassin": "modele/model_monster/model_animacja_goblin_zab*.png",
  wolf: "modele/model_monster/model_animacja_mlody_wilk.png",
  spider: "modele/model_monster/model_animacja_mlody_spider.png",
  "slime-cursed": "modele/model_monster/model_animacja_slime_cursed.png",
  "skeleton-shield": "modele/model_monster/model_animacja_szkilet_ztarcza.png",
  wraith: "modele/model_monster/model_animacja_slime_cursed.png",
  knight: "modele/model_monster/model_animacja_szkilet_ztarcza.png",
  golem: "modele/model_monster/model_animacja_szkilet_ztarcza.png",
  worm: "modele/model_monster/model_animacja_mlody_spider.png",
};

const SHEET_SCALE: Record<string, number> = {
  hunter: 1,
  assassin: 1,
  "goblin-archer": 1,
  "goblin-assassin": 1,
  wolf: 0.94,
  spider: 0.9,
  "slime-cursed": 0.9,
  "skeleton-shield": 1,
  wraith: 0.98,
  knight: 0.98,
  golem: 0.96,
  worm: 0.82,
};

const FRAME_OVERRIDES: Record<string, Partial<Record<SpriteActorAnimation, number>>> = {
  hunter: {
    idle: 6,
    run: 24,
    dash: 24,
    attack_1: 12,
    attack_2: 9,
    guard: 4,
    cast: 12,
    hurt: 11,
    death: 24,
  },
  assassin: {
    idle: 6,
    run: 7,
    dash: 7,
    attack_1: 7,
    attack_2: 7,
    guard: 6,
    cast: 7,
    hurt: 6,
    death: 7,
  },
  "goblin-archer": {
    idle: 6,
    run: 7,
    dash: 7,
    attack_1: 7,
    attack_2: 7,
    guard: 6,
    cast: 7,
    hurt: 6,
    death: 7,
  },
  "goblin-assassin": {
    idle: 6,
    run: 7,
    dash: 7,
    attack_1: 7,
    attack_2: 7,
    guard: 6,
    cast: 7,
    hurt: 6,
    death: 7,
  },
  "skeleton-shield": {
    idle: 6,
    run: 7,
    dash: 7,
    attack_1: 7,
    attack_2: 7,
    guard: 6,
    cast: 7,
    hurt: 6,
    death: 7,
  },
  wolf: {
    idle: 7,
    run: 7,
    dash: 7,
    attack_1: 7,
    attack_2: 7,
    guard: 7,
    cast: 7,
    hurt: 7,
    death: 7,
  },
  spider: {
    idle: 7,
    run: 7,
    dash: 7,
    attack_1: 7,
    attack_2: 7,
    guard: 7,
    cast: 7,
    hurt: 7,
    death: 7,
  },
  "slime-cursed": {
    idle: 7,
    run: 7,
    dash: 7,
    attack_1: 7,
    attack_2: 7,
    guard: 7,
    cast: 7,
    hurt: 7,
    death: 7,
  },
  wraith: {
    idle: 6,
    run: 7,
    dash: 7,
    attack_1: 7,
    attack_2: 7,
    guard: 6,
    cast: 7,
    hurt: 6,
    death: 7,
  },
  knight: {
    idle: 6,
    run: 7,
    dash: 7,
    attack_1: 7,
    attack_2: 7,
    guard: 6,
    cast: 7,
    hurt: 6,
    death: 7,
  },
  golem: {
    idle: 6,
    run: 7,
    dash: 7,
    attack_1: 7,
    attack_2: 7,
    guard: 6,
    cast: 7,
    hurt: 6,
    death: 7,
  },
  worm: {
    idle: 8,
    run: 10,
    dash: 5,
    attack_1: 6,
    attack_2: 10,
    guard: 8,
    cast: 6,
    hurt: 6,
    death: 7,
  },
};

const HIT_FRAME_OVERRIDES: Record<string, Partial<Record<SpriteActorAnimation, number | null>>> = {
  hunter: {
    dash: 12,
    attack_1: 8,
    attack_2: 5,
    cast: 8,
    hurt: 3,
  },
  wolf: {
    dash: 4,
    attack_1: 4,
    attack_2: 4,
    hurt: 2,
  },
  worm: {
    dash: 3,
    attack_1: 4,
    attack_2: 6,
    hurt: 2,
  },
};

const DURATION_OVERRIDES: Record<string, Partial<Record<SpriteActorAnimation, number>>> = {
  hunter: {
    idle: 1120,
    run: 1120,
    dash: 700,
    attack_1: 760,
    attack_2: 660,
    cast: 820,
    hurt: 520,
    death: 1160,
  },
  assassin: {
    run: 760,
    dash: 520,
    attack_1: 640,
    attack_2: 680,
    cast: 760,
    death: 900,
  },
  "goblin-archer": {
    run: 780,
    dash: 520,
    attack_1: 660,
    attack_2: 700,
    cast: 780,
    death: 900,
  },
  "goblin-assassin": {
    run: 700,
    dash: 480,
    attack_1: 600,
    attack_2: 640,
    cast: 720,
    death: 860,
  },
  "skeleton-shield": {
    run: 820,
    dash: 560,
    attack_1: 700,
    attack_2: 760,
    cast: 800,
    death: 920,
  },
  wolf: {
    idle: 1040,
    run: 900,
    dash: 560,
    attack_1: 660,
    attack_2: 700,
    hurt: 430,
    death: 880,
  },
  spider: {
    idle: 920,
    run: 660,
    dash: 460,
    attack_1: 580,
    attack_2: 620,
    death: 780,
  },
  "slime-cursed": {
    idle: 1220,
    run: 820,
    dash: 560,
    attack_1: 740,
    attack_2: 780,
    cast: 820,
    death: 980,
  },
  wraith: {
    idle: 1040,
    run: 760,
    attack_1: 680,
    attack_2: 700,
    cast: 820,
    death: 980,
  },
  knight: {
    idle: 1040,
    run: 780,
    attack_1: 700,
    attack_2: 740,
    cast: 800,
    death: 980,
  },
  worm: {
    idle: 980,
    run: 820,
    dash: 460,
    attack_1: 560,
    attack_2: 740,
    hurt: 420,
    death: 820,
  },
  golem: {
    run: 760,
    attack_1: 620,
    attack_2: 680,
    cast: 720,
    death: 900,
  },
};

const FRAME_WEIGHT_OVERRIDES: Record<string, Partial<Record<SpriteActorAnimation, number[]>>> = {
  hunter: {
    run: [
      1.2, 1, 0.9, 0.9, 1, 1.15, 1.25, 1.05, 0.9, 0.9, 1, 1.15,
      1.25, 1.05, 0.9, 0.9, 1, 1.15, 1.25, 1.05, 0.9, 0.9, 1, 1.35,
    ],
    dash: [
      1.3, 1.15, 1, 0.86, 0.78, 0.72, 0.68, 0.66, 0.66, 0.68, 0.72, 0.9,
      1.35, 1.45, 1.35, 1.1, 0.96, 0.9, 0.88, 0.94, 1.05, 1.2, 1.35, 1.5,
    ],
    attack_1: [1.2, 1.05, 0.95, 0.9, 0.9, 1.05, 1.25, 1.9, 1.65, 1.2, 1.05, 1.25],
    attack_2: [1.15, 1, 0.9, 1.15, 1.85, 1.65, 1.2, 1.05, 1.25],
    cast: [1.1, 1, 0.95, 0.95, 1.05, 1.2, 1.35, 1.75, 1.45, 1.2, 1.05, 1.15],
    hurt: [0.95, 1.4, 1.9, 1.55, 1.2, 1, 0.9, 0.9, 0.95, 1.05, 1.2],
    death: [
      0.9, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.22, 1.3, 1.38, 1.45, 1.52,
      1.58, 1.62, 1.65, 1.65, 1.62, 1.58, 1.5, 1.42, 1.34, 1.25, 1.18, 1.1,
    ],
  },
};

function defaultFrameWeights(animation: SpriteActorAnimation, frames: number, hitFrame: number | null = null) {
  if (frames <= 0) return [];
  if (animation === "idle") {
    return Array.from({ length: frames }, (_, index) => (index === 0 || index === frames - 1 ? 1.25 : 1));
  }
  if (animation === "run") {
    return Array.from({ length: frames }, (_, index) => (index % 2 === 0 ? 1.12 : 0.92));
  }
  if (animation === "dash") {
    return Array.from({ length: frames }, (_, index) => {
      const t = frames === 1 ? 0 : index / (frames - 1);
      return t < 0.25 || t > 0.74 ? 1.25 : 0.78;
    });
  }
  if (animation === "attack_1" || animation === "attack_2") {
    const hit = hitFrame ?? HIT_FRAME[animation] ?? Math.floor(frames * 0.58);
    return Array.from({ length: frames }, (_, index) => {
      const distance = Math.abs(index - hit);
      if (distance === 0) return 1.9;
      if (distance === 1) return 1.35;
      return index < hit ? 0.95 : 1.1;
    });
  }
  if (animation === "hurt") {
    return Array.from({ length: frames }, (_, index) => (index <= 2 ? 1.55 - index * 0.12 : 0.95));
  }
  if (animation === "death") {
    return Array.from({ length: frames }, (_, index) => 0.9 + (index / Math.max(1, frames - 1)) * 0.7);
  }
  return Array.from({ length: frames }, () => 1);
}

function fitFrameWeights(weights: number[], frames: number) {
  if (weights.length === frames) return weights;
  if (weights.length === 0) return Array.from({ length: frames }, () => 1);
  return Array.from({ length: frames }, (_, index) => weights[Math.min(weights.length - 1, Math.round((index * (weights.length - 1)) / Math.max(1, frames - 1)))]);
}

function getFrameWeights(sheetKind: string | null, animation: SpriteActorAnimation, frames: number, hitFrame: number | null) {
  const customWeights = sheetKind ? FRAME_WEIGHT_OVERRIDES[sheetKind]?.[animation] : undefined;
  return fitFrameWeights(customWeights ?? defaultFrameWeights(animation, frames, hitFrame), frames);
}

export function getModelFrameSize(size: SpriteActorSize, slot: SpriteActorSlot) {
  return MODEL_FRAME_SIZES[slot][size];
}

export function getActorSheetKind(kind: SpriteActorKind) {
  return MODEL_SHEET_KIND[kind] ?? null;
}

export function getSpriteSheetFilename(kind: SpriteActorKind, animation: SpriteActorAnimation) {
  const sheetKind = getActorSheetKind(kind);
  return sheetKind ? `${sheetKind}-${animation}` : null;
}

export function getSpriteAnimationDefinition(kind: SpriteActorKind, animation: SpriteActorAnimation): SpriteAnimationDefinition {
  const sheetKind = getActorSheetKind(kind);
  const frames = sheetKind ? FRAME_OVERRIDES[sheetKind]?.[animation] ?? BASE_FRAMES[animation] : BASE_FRAMES[animation];
  const durationMs = sheetKind ? DURATION_OVERRIDES[sheetKind]?.[animation] ?? BASE_DURATION[animation] : BASE_DURATION[animation];
  const hitFrame = sheetKind ? HIT_FRAME_OVERRIDES[sheetKind]?.[animation] ?? HIT_FRAME[animation] : HIT_FRAME[animation];
  const loop = LOOPING_ANIMATIONS.has(animation);

  return {
    animation,
    frames,
    durationMs,
    mode: loop ? "loop" : "once",
    loop,
    holdLastFrame: !loop,
    sourceFrameSize: SPRITE_SOURCE_FRAME_SIZE,
    hitFrame,
    anchor: { x: 0.5, y: 1 },
    scale: sheetKind ? SHEET_SCALE[sheetKind] ?? 1 : 1,
    motionProfile: MOTION_PROFILE[animation],
    frameWeights: getFrameWeights(sheetKind, animation, frames, hitFrame),
    source: sheetKind ? MODEL_SOURCES[sheetKind] ?? "unknown" : "unknown",
    sheet: sheetKind ? `${sheetKind}-${animation}.png` : "",
  };
}

export function hasSpriteAnimationDefinition(kind: SpriteActorKind, animation: SpriteActorAnimation) {
  return Boolean(getSpriteSheetFilename(kind, animation));
}

export function getFallbackAnimation(animation: SpriteActorAnimation) {
  if (animation === "attack_1" || animation === "attack_2") return "attack";
  if (animation === "dash") return "dash";
  if (animation === "guard") return "guard";
  if (animation === "hurt" || animation === "death") return "hurt";
  if (animation === "run") return "run";
  return "idle";
}

export function getAllSpriteAnimationDefinitions(kind: SpriteActorKind) {
  return SPRITE_ANIMATIONS.map((animation) => getSpriteAnimationDefinition(kind, animation));
}
