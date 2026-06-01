export type PenaltyEnemyLike = {
  x: number;
  y: number;
  size: number;
};

export type PenaltyHunterLike = {
  x: number;
  y: number;
  dashTimer: number;
  shieldTimer: number;
};

export type PenaltySafeZoneLike = {
  x: number;
  y: number;
  radius: number;
};

export function getPenaltyEnemyCap(wave: number) {
  return Math.min(18, 7 + wave * 2);
}

export function shouldBanishPenaltyEnemy({
  enemy,
  hunter,
  safeZone,
}: {
  enemy: PenaltyEnemyLike;
  hunter: PenaltyHunterLike;
  safeZone: PenaltySafeZoneLike;
}) {
  const invulnerable = hunter.dashTimer > 0 || hunter.shieldTimer > 0;
  if (!invulnerable) return false;

  const hunterDistance = Math.hypot(hunter.x - enemy.x, hunter.y - enemy.y);
  const safeZoneDistance = Math.hypot(safeZone.x - enemy.x, safeZone.y - enemy.y);

  return hunterDistance < enemy.size + 4.2 || safeZoneDistance < safeZone.radius + enemy.size;
}
