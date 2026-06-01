import type { AnimationEventType, QueuedAnimationEvent } from "./animationSystem";
import type { SpriteActorAnimation, SpriteActorKind } from "./spriteAnimation";
import { getSpriteAnimationDefinition } from "./spriteAnimation";

export type ActionActorId = "hunter" | "enemy";

export function animationEventToSpriteAnimation(event: Pick<QueuedAnimationEvent, "type" | "payload"> | null | undefined): SpriteActorAnimation {
  if (!event) return "idle";
  const sprite = event.payload?.sprite;
  if (isSpriteAnimation(sprite)) return sprite;
  if (event.type === "hit") return "hurt";
  if (event.type === "death") return "death";
  if (event.type === "guard") return "guard";
  if (event.type === "dash") return "dash";
  if (event.type === "cast") return "cast";
  if (event.type === "crit") return typeof event.payload?.damage === "number" ? "hurt" : "attack_2";
  if (event.type === "attack") return event.payload?.action === "shadow" ? "attack_2" : "attack_1";
  if (event.type === "windup") return "idle";
  return "idle";
}

function isSpriteAnimation(value: unknown): value is SpriteActorAnimation {
  return (
    value === "idle" ||
    value === "run" ||
    value === "dash" ||
    value === "attack_1" ||
    value === "attack_2" ||
    value === "guard" ||
    value === "cast" ||
    value === "hurt" ||
    value === "death"
  );
}

export function spriteEventDuration(kind: SpriteActorKind, animation: SpriteActorAnimation) {
  return getSpriteAnimationDefinition(kind, animation).durationMs;
}

export function spriteEventLock(kind: SpriteActorKind, animation: SpriteActorAnimation, type: AnimationEventType) {
  const duration = spriteEventDuration(kind, animation);
  if (type === "hit" || type === "dash") return Math.min(duration, 220);
  if (type === "death") return duration;
  return Math.max(220, Math.floor(duration * 0.58));
}

export function spriteHitDelay(kind: SpriteActorKind, animation: SpriteActorAnimation) {
  const definition = getSpriteAnimationDefinition(kind, animation);
  if (definition.hitFrame === null) return Math.floor(definition.durationMs * 0.5);
  return Math.floor((definition.hitFrame / Math.max(1, definition.frames)) * definition.durationMs);
}
