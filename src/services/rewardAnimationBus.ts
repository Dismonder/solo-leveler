import type { RewardAnimationEvent } from "../types";

type RewardAnimationListener = (event: RewardAnimationEvent) => void;

const listeners = new Set<RewardAnimationListener>();

export function emitRewardAnimation(
  event: Omit<RewardAnimationEvent, "id" | "createdAt">,
): RewardAnimationEvent {
  const fullEvent: RewardAnimationEvent = {
    ...event,
    id: `reward-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  listeners.forEach((listener) => listener(fullEvent));
  return fullEvent;
}

export function subscribeRewardAnimations(listener: RewardAnimationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
