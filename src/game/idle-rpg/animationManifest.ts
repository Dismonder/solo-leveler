import animationManifestJson from "../../assets/idle-rpg/animation-manifest.json";

export const IDLE_RPG_ANIMATION_CATEGORIES = ["hero", "normalEnemy", "elite", "boss", "summon"] as const;
export type IdleRpgAnimationCategory = (typeof IDLE_RPG_ANIMATION_CATEGORIES)[number];

export const IDLE_RPG_ANIMATION_STATES = [
  "idle",
  "march",
  "enter",
  "intro",
  "attack",
  "skill",
  "hit",
  "death",
  "ultimate",
] as const;
export type IdleRpgAnimationState = (typeof IDLE_RPG_ANIMATION_STATES)[number];

export type IdleRpgAnimationMarkerName = "impact" | "recoil" | "roar" | "settled" | "vanish";

export interface IdleRpgAnimationKeyframeHold {
  /** Zero-based cell within this actor source's one- or two-row region. */
  sourceFrame: number;
  /** Authored number of display frames for which the source drawing is held. */
  hold: number;
}

export interface IdleRpgAnimationMarker {
  name: IdleRpgAnimationMarkerName;
  /** Zero-based frame in the expanded authored timeline, not an atlas cell. */
  frame: number;
}

export interface IdleRpgAnimationClip {
  fps: number;
  loop: boolean;
  keyframes: readonly IdleRpgAnimationKeyframeHold[];
  markers: readonly IdleRpgAnimationMarker[];
}

export interface IdleRpgAnimationSource {
  actorId: string;
  atlasId: string;
  /** Absolute first atlas cell assigned to the actor. */
  rowOffset: number;
  rowCount: number;
  facing: "left" | "right";
  paletteId: string;
  pivot: Readonly<{ x: number; y: number }>;
  /** Null for airborne actors whose pivot, rather than a ground line, is stable. */
  baselinePx: number | null;
}

export interface IdleRpgAnimationCategoryContract {
  frameBudget: number;
  sources: readonly IdleRpgAnimationSource[];
  states: Readonly<Partial<Record<IdleRpgAnimationState, IdleRpgAnimationClip>>>;
}

export interface IdleRpgAnimationManifest {
  schemaVersion: 1;
  timelineModel: "authored-keyframe-holds-v1";
  description: string;
  atlasGeometry: Readonly<{
    columns: number;
    rows: number;
    frameWidth: number;
    frameHeight: number;
    sourceFrames: number;
    safeInsetPx: number;
    extrudePx: number;
  }>;
  palettes: Readonly<Record<string, readonly string[]>>;
  atlases: Readonly<Record<string, Readonly<{ assetPath: string }>>>;
  categories: Readonly<Record<IdleRpgAnimationCategory, IdleRpgAnimationCategoryContract>>;
}

export interface ResolvedIdleRpgAnimation {
  category: IdleRpgAnimationCategory;
  state: IdleRpgAnimationState;
  actor: IdleRpgAnimationSource;
  assetPath: string;
  fps: number;
  loop: boolean;
  /** Absolute Phaser frame numbers, expanded from authored keyframe holds. */
  frames: readonly number[];
  markers: readonly IdleRpgAnimationMarker[];
  durationMs: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAnimationManifest(value: unknown): IdleRpgAnimationManifest {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.timelineModel !== "authored-keyframe-holds-v1") {
    throw new Error("Nieobsługiwany manifest animacji Idle RPG");
  }
  if (!isRecord(value.atlasGeometry) || !isRecord(value.categories)) {
    throw new Error("Manifest animacji Idle RPG nie zawiera geometrii lub kategorii");
  }

  const sourceFrames = value.atlasGeometry.sourceFrames;
  const columns = value.atlasGeometry.columns;
  if (!Number.isInteger(sourceFrames) || !Number.isInteger(columns) || Number(sourceFrames) <= 0 || Number(columns) <= 0) {
    throw new Error("Manifest animacji Idle RPG ma nieprawidłową geometrię atlasu");
  }

  for (const categoryName of IDLE_RPG_ANIMATION_CATEGORIES) {
    const category = value.categories[categoryName];
    if (!isRecord(category) || !Array.isArray(category.sources) || !isRecord(category.states)) {
      throw new Error(`Brak kontraktu animacji: ${categoryName}`);
    }
  }

  return value as unknown as IdleRpgAnimationManifest;
}

/**
 * This object is the runtime view of the same JSON validated by
 * `npm run validate:idle-rpg-assets`. Timelines are authored display frames
 * assembled from a deliberately small set of atlas key drawings.
 */
export const IDLE_RPG_ANIMATION_MANIFEST = parseAnimationManifest(animationManifestJson);

export function getAnimationCategoryFrameTotal(category: IdleRpgAnimationCategory): number {
  return Object.values(IDLE_RPG_ANIMATION_MANIFEST.categories[category].states).reduce(
    (categoryTotal, clip) => categoryTotal + (clip?.keyframes.reduce((clipTotal, keyframe) => clipTotal + keyframe.hold, 0) ?? 0),
    0,
  );
}

export function getActorAnimationSource(
  actorId: string,
): { category: IdleRpgAnimationCategory; source: IdleRpgAnimationSource } | undefined {
  for (const category of IDLE_RPG_ANIMATION_CATEGORIES) {
    const source = IDLE_RPG_ANIMATION_MANIFEST.categories[category].sources.find((candidate) => candidate.actorId === actorId);
    if (source) return { category, source };
  }
  return undefined;
}

export function expandAnimationClip(clip: IdleRpgAnimationClip): readonly number[] {
  return clip.keyframes.flatMap(({ sourceFrame, hold }) => Array.from({ length: hold }, () => sourceFrame));
}

export function resolveActorAnimation(
  actorId: string,
  state: IdleRpgAnimationState,
): ResolvedIdleRpgAnimation | undefined {
  const actor = getActorAnimationSource(actorId);
  if (!actor) return undefined;
  const clip = IDLE_RPG_ANIMATION_MANIFEST.categories[actor.category].states[state];
  if (!clip) return undefined;
  const frames = expandAnimationClip(clip).map((localFrame) => actor.source.rowOffset + localFrame);
  const assetPath = IDLE_RPG_ANIMATION_MANIFEST.atlases[actor.source.atlasId]?.assetPath;
  if (!assetPath) return undefined;
  return {
    category: actor.category,
    state,
    actor: actor.source,
    assetPath,
    fps: clip.fps,
    loop: clip.loop,
    frames,
    markers: clip.markers,
    durationMs: (frames.length / clip.fps) * 1_000,
  };
}

/**
 * Returns the wall-clock offset of an authored animation marker. Phaser is a
 * render-only consumer, so combat results can be applied immediately while
 * their visual reaction waits for the matching keyframe.
 */
export function getActorAnimationMarkerDelayMs(
  actorId: string,
  state: IdleRpgAnimationState,
  markerName: IdleRpgAnimationMarkerName,
): number | undefined {
  const resolved = resolveActorAnimation(actorId, state);
  const marker = resolved?.markers.find((candidate) => candidate.name === markerName);
  if (!resolved || !marker) return undefined;
  return marker.frame / resolved.fps * 1_000;
}

/**
 * Phaser AnimationState timeScale required to fit a non-looping clip inside a
 * domain phase. Clips shorter than the phase retain their authored cadence.
 */
export function getActorAnimationPhaseTimeScale(
  actorId: string,
  state: IdleRpgAnimationState,
  phaseDurationMs: number,
): number {
  const resolved = resolveActorAnimation(actorId, state);
  if (!resolved || resolved.loop || !Number.isFinite(phaseDurationMs) || phaseDurationMs <= 0) return 1;
  return Math.max(1, resolved.durationMs / phaseDurationMs);
}
