import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AnimationActor,
  AnimationEvent,
  AnimationEventType,
  createAnimationEvent,
  getActiveAnimationEventForActor,
  getActiveAnimationEvents,
  enqueueAnimationEvents,
  getActiveAnimationEvent,
  isAnimationLocked,
  pruneAnimationQueue,
} from "../game/animationSystem";

export function useAnimationQueue() {
  const [queue, setQueue] = useState<ReturnType<typeof enqueueAnimationEvents>>([]);
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (queue.length === 0) return;
    let frame = 0;
    const tick = () => {
      const current = performance.now();
      setNow(current);
      setQueue((items) => pruneAnimationQueue(items, current));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [queue.length]);

  const enqueue = useCallback((events: AnimationEvent[]) => {
    const current = performance.now();
    setNow(current);
    setQueue((items) => enqueueAnimationEvents(items, events, current));
  }, []);

  const play = useCallback(
    (type: AnimationEventType, actor: AnimationActor, overrides: Parameters<typeof createAnimationEvent>[3] = {}) => {
      const current = performance.now();
      enqueue([createAnimationEvent(type, actor, current, overrides)]);
    },
    [enqueue]
  );

  const activeEvent = useMemo(() => getActiveAnimationEvent(queue, now), [queue, now]);
  const activeEvents = useMemo(() => getActiveAnimationEvents(queue, now), [queue, now]);
  const getActiveEvent = useCallback((actor: AnimationActor) => getActiveAnimationEventForActor(queue, now, actor), [queue, now]);
  const locked = useMemo(() => isAnimationLocked(queue, now), [queue, now]);

  return {
    activeEvent,
    activeEvents,
    enqueue,
    getActiveEvent,
    locked,
    play,
    queue,
  };
}
