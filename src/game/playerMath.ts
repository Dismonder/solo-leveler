import { PlayerState } from '../types';
import { XP_REQUIRED } from './gameConfig';
import { generateLevelUpReward } from './rewards';

export function getEffectiveStats(player: PlayerState) {
  const stats = { ...player.stats };

  Object.values(player.equipment || {}).forEach((item) => {
    if (item && item.durability > 0) {
      stats[item.bonusType as keyof typeof stats] += item.bonusValue;
    }
  });

  return stats;
}

export function recalculateMaxStats(player: PlayerState) {
  const effStats = getEffectiveStats(player);
  const maxHp = 100 + player.level * 40 + (effStats.VITALITY * 25);
  const maxMp = 50 + player.level * 8 + (effStats.INTELLIGENCE * 10);
  return { maxHp, maxMp };
}

export function applyXpGain(player: PlayerState, gainedXp: number): PlayerState {
  let xp = player.xp + gainedXp;
  let level = player.level;
  let availablePoints = Math.max(0, player.availablePoints);
  let skillPoints = player.skillPoints;
  const inventory = [...player.inventory];

  let leveledUp = false;
  while (xp >= XP_REQUIRED(level)) {
    xp -= XP_REQUIRED(level);
    level += 1;
    availablePoints += 5;
    skillPoints += 1;
    inventory.push(generateLevelUpReward(level));
    leveledUp = true;
  }

  const { maxHp, maxMp } = recalculateMaxStats({ ...player, level });
  
  let hp = player.hp;
  let mp = player.mp;
  
  if (leveledUp) {
    hp = maxHp;
    mp = maxMp;
  } else {
    hp = Math.min(hp, maxHp);
    mp = Math.min(mp, maxMp);
  }

  return {
    ...player,
    xp,
    level,
    availablePoints,
    skillPoints,
    hp,
    mp,
    maxHp,
    maxMp,
    inventory,
  };
}

export function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
