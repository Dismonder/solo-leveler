import { useEffect, useMemo, useState } from "react";
import type { SpriteAnimationDefinition } from "../game/spriteAnimation";

function getReducedMotionPreference() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getWeightedAnimationFrame(playbackTime: number, definition: SpriteAnimationDefinition) {
  if (definition.frames <= 1) return 0;

  const weights =
    definition.frameWeights.length === definition.frames
      ? definition.frameWeights.map((weight) => (Number.isFinite(weight) && weight > 0 ? weight : 1))
      : Array.from({ length: definition.frames }, () => 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const clampedTime = Math.max(0, Math.min(definition.durationMs - 1, playbackTime));
  const targetWeight = (clampedTime / definition.durationMs) * totalWeight;
  let acc = 0;

  for (let frame = 0; frame < weights.length; frame++) {
    acc += weights[frame];
    if (targetWeight < acc) return frame;
  }

  return definition.frames - 1;
}

export function useFrameAnimation(animationKey: string, definition: SpriteAnimationDefinition) {
  const [frame, setFrame] = useState(0);
  const reducedMotion = useMemo(getReducedMotionPreference, []);
  const frameWeightsKey = definition.frameWeights.join(",");

  useEffect(() => {
    if (definition.frames <= 1 || reducedMotion) {
      setFrame(0);
      return;
    }

    let raf = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const playbackTime = definition.mode === "loop" ? elapsed % definition.durationMs : Math.min(elapsed, definition.durationMs - 1);
      const nextFrame = getWeightedAnimationFrame(playbackTime, definition);
      setFrame((current) => (current === nextFrame ? current : nextFrame));

      if (definition.mode === "loop" || elapsed < definition.durationMs) {
        raf = requestAnimationFrame(tick);
      } else if (definition.holdLastFrame) {
        setFrame(definition.frames - 1);
      } else {
        setFrame(0);
      }
    };

    setFrame(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    animationKey,
    definition.durationMs,
    definition.frames,
    frameWeightsKey,
    definition.holdLastFrame,
    definition.mode,
    reducedMotion,
  ]);

  return reducedMotion ? 0 : frame;
}
