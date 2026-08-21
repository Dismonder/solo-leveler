const UINT32_RANGE = 0x1_0000_0000;

export function normalizeSeed(seed: number): number {
  const normalized = Number.isFinite(seed) ? seed >>> 0 : 0;
  return normalized === 0 ? 0x6d2b79f5 : normalized;
}

export function nextRandom(state: number): { state: number; value: number } {
  let next = normalizeSeed(state);
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  next >>>= 0;
  return { state: normalizeSeed(next), value: next / UINT32_RANGE };
}

export function randomInt(state: number, min: number, max: number): { state: number; value: number } {
  const low = Math.ceil(Math.min(min, max));
  const high = Math.floor(Math.max(min, max));
  const next = nextRandom(state);
  return { state: next.state, value: low + Math.floor(next.value * (high - low + 1)) };
}
