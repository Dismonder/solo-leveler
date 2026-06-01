export type SpawnCircle = {
  x: number;
  y: number;
  radius: number;
};

export type SpawnBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type SegmentPoint = {
  x: number;
  y: number;
};

export function circlesOverlap(a: SpawnCircle, b: SpawnCircle, minGap = 0) {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius + minGap;
}

export function randomPointAwayFrom({
  existing,
  bounds,
  radius,
  minGap = 0,
  attempts = 40,
  random = Math.random,
}: {
  existing: SpawnCircle[];
  bounds: SpawnBounds;
  radius: number;
  minGap?: number;
  attempts?: number;
  random?: () => number;
}): SpawnCircle | null {
  const minX = bounds.minX + radius;
  const maxX = bounds.maxX - radius;
  const minY = bounds.minY + radius;
  const maxY = bounds.maxY - radius;

  if (minX >= maxX || minY >= maxY) return null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = {
      x: minX + random() * (maxX - minX),
      y: minY + random() * (maxY - minY),
      radius,
    };

    if (!existing.some((item) => circlesOverlap(item, candidate, minGap))) {
      return candidate;
    }
  }

  return null;
}

export function spawnNonOverlappingObjects({
  count,
  existing = [],
  bounds,
  radius,
  minGap = 0,
  attemptsPerObject = 40,
  random = Math.random,
}: {
  count: number;
  existing?: SpawnCircle[];
  bounds: SpawnBounds;
  radius: number | ((index: number) => number);
  minGap?: number;
  attemptsPerObject?: number;
  random?: () => number;
}) {
  const objects: SpawnCircle[] = [];
  const occupied = [...existing];

  for (let index = 0; index < count; index += 1) {
    const itemRadius = typeof radius === "function" ? radius(index) : radius;
    const point = randomPointAwayFrom({
      existing: occupied,
      bounds,
      radius: itemRadius,
      minGap,
      attempts: attemptsPerObject,
      random,
    });

    if (!point) break;
    occupied.push(point);
    objects.push(point);
  }

  return objects;
}

export function applyCappedTimeBonus({
  deadline,
  now,
  bonusMs,
  capMs,
  diminishingFactor = 1,
}: {
  deadline: number;
  now: number;
  bonusMs: number;
  capMs: number;
  diminishingFactor?: number;
}) {
  const currentRemaining = Math.max(0, deadline - now);
  const room = Math.max(0, capMs - currentRemaining);
  const adjustedBonus = Math.max(0, bonusMs * Math.max(0, Math.min(1, diminishingFactor)));
  return deadline + Math.min(room, adjustedBonus);
}

export function segmentIntersectsCircle(
  start: SegmentPoint,
  end: SegmentPoint,
  circle: SpawnCircle
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(circle.x - start.x, circle.y - start.y) <= circle.radius;
  }

  const t = Math.max(
    0,
    Math.min(1, ((circle.x - start.x) * dx + (circle.y - start.y) * dy) / lengthSquared)
  );
  const closest = {
    x: start.x + dx * t,
    y: start.y + dy * t,
  };

  return Math.hypot(circle.x - closest.x, circle.y - closest.y) <= circle.radius;
}

export function slicePathIntersectsTarget(
  path: SegmentPoint[],
  target: SpawnCircle,
  options: {
    bladeWidth?: number;
    maxSegmentLength?: number;
  } = {}
) {
  if (path.length === 0) return false;

  const bladeRadius = Math.max(0, (options.bladeWidth ?? 0) / 2);
  const hitTarget = {
    ...target,
    radius: target.radius + bladeRadius,
  };

  if (path.length === 1) {
    return Math.hypot(path[0].x - hitTarget.x, path[0].y - hitTarget.y) <= hitTarget.radius;
  }

  const maxSegmentLength = Math.max(1, options.maxSegmentLength ?? 10);
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const steps = Math.max(1, Math.ceil(distance / maxSegmentLength));
    let previous = start;

    for (let step = 1; step <= steps; step += 1) {
      const current = {
        x: start.x + ((end.x - start.x) * step) / steps,
        y: start.y + ((end.y - start.y) * step) / steps,
      };

      if (segmentIntersectsCircle(previous, current, hitTarget)) {
        return true;
      }
      previous = current;
    }
  }

  return false;
}
