export type AnimationEventType =
  | "windup"
  | "dash"
  | "attack"
  | "hit"
  | "crit"
  | "guard"
  | "cast"
  | "death"
  | "reward"
  | "phaseChange";

export type AnimationActor = "hunter" | "enemy" | "system";

export type AnimationEvent = {
  id: string;
  type: AnimationEventType;
  actor: AnimationActor;
  startedAt: number;
  durationMs: number;
  lockMs: number;
  payload?: Record<string, string | number | boolean>;
};

export type QueuedAnimationEvent = AnimationEvent & {
  endsAt: number;
  unlocksAt: number;
};

export const ANIMATION_EVENT_DEFAULTS: Record<AnimationEventType, { durationMs: number; lockMs: number }> = {
  windup: { durationMs: 260, lockMs: 220 },
  dash: { durationMs: 220, lockMs: 140 },
  attack: { durationMs: 420, lockMs: 360 },
  hit: { durationMs: 260, lockMs: 150 },
  crit: { durationMs: 520, lockMs: 420 },
  guard: { durationMs: 360, lockMs: 260 },
  cast: { durationMs: 540, lockMs: 440 },
  death: { durationMs: 760, lockMs: 760 },
  reward: { durationMs: 620, lockMs: 260 },
  phaseChange: { durationMs: 420, lockMs: 260 },
};

export function createAnimationEvent(
  type: AnimationEventType,
  actor: AnimationActor,
  startedAt: number,
  overrides: Partial<Pick<AnimationEvent, "durationMs" | "lockMs" | "payload">> = {}
): AnimationEvent {
  const defaults = ANIMATION_EVENT_DEFAULTS[type];
  return {
    id: `${type}_${actor}_${startedAt}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    actor,
    startedAt,
    durationMs: overrides.durationMs ?? defaults.durationMs,
    lockMs: overrides.lockMs ?? defaults.lockMs,
    payload: overrides.payload,
  };
}

export function enqueueAnimationEvents(
  queue: QueuedAnimationEvent[],
  events: AnimationEvent[],
  now: number
): QueuedAnimationEvent[] {
  const pruned = pruneAnimationQueue(queue, now);
  const cursors = new Map<AnimationActor, number>();
  for (const actor of ["hunter", "enemy", "system"] as AnimationActor[]) {
    const actorEvents = pruned.filter((event) => event.actor === actor);
    cursors.set(actor, actorEvents.length > 0 ? Math.max(...actorEvents.map((event) => event.endsAt)) : now);
  }

  const queued = events.map((event) => {
    const cursor = cursors.get(event.actor) ?? now;
    const startedAt = Math.max(cursor, event.startedAt);
    cursors.set(event.actor, startedAt + event.durationMs);
    return {
      ...event,
      startedAt,
      endsAt: startedAt + event.durationMs,
      unlocksAt: startedAt + event.lockMs,
    };
  });

  return [...pruned, ...queued].sort((a, b) => a.startedAt - b.startedAt || a.endsAt - b.endsAt);
}

export function pruneAnimationQueue(queue: QueuedAnimationEvent[], now: number) {
  return queue.filter((event) => event.endsAt > now);
}

export function getActiveAnimationEvent(queue: QueuedAnimationEvent[], now: number) {
  return queue.find((event) => event.startedAt <= now && event.endsAt > now) ?? null;
}

export function getActiveAnimationEventForActor(queue: QueuedAnimationEvent[], now: number, actor: AnimationActor) {
  return queue.find((event) => event.actor === actor && event.startedAt <= now && event.endsAt > now) ?? null;
}

export function getActiveAnimationEvents(queue: QueuedAnimationEvent[], now: number) {
  return {
    hunter: getActiveAnimationEventForActor(queue, now, "hunter"),
    enemy: getActiveAnimationEventForActor(queue, now, "enemy"),
    system: getActiveAnimationEventForActor(queue, now, "system"),
  };
}

export function isAnimationLocked(queue: QueuedAnimationEvent[], now: number) {
  return queue.some((event) => event.unlocksAt > now);
}
