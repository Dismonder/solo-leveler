import { Equipment, type EquipmentSlotId } from '../types';

export function generateLevelUpReward(level: number): Equipment {
  const types: EquipmentSlotId[] = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'ring1', 'ring2', 'necklace', 'artifact'];
  const stats: Array<string> = ['STR', 'VITALITY', 'AGILITY', 'INTELLIGENCE', 'SENSE'];

  const type = types[Math.floor(Math.random() * types.length)];
  const stat = stats[Math.floor(Math.random() * stats.length)] as any;

  return {
    id: `reward_lvl_${level}_${Date.now()}_${Math.random()}`,
    name: getRewardName(type, level),
    type,
    bonusType: stat,
    bonusValue: Math.max(1, Math.floor(level / 2) + Math.floor(Math.random() * 3)),
    durability: 100,
    maxDurability: 100,
  };
}

function getRewardName(type: EquipmentSlotId, level: number) {
  const names: Record<EquipmentSlotId, string> = {
    weapon: "Ostrze Awansu",
    helmet: "Hełm Cienia",
    armor: "Pancerz Awansu",
    gloves: "Rękawice Łowcy",
    boots: "Buty Bramy",
    ring1: "Pierścień Siły",
    ring2: "Pierścień Many",
    necklace: "Naszyjnik Systemu",
    artifact: "Relikt Poziomu",
  };
  return `${names[type]} ${level}`;
}
