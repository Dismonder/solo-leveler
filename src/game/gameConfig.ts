export const QUEST_TARGETS = {
  pushups: 100,
  situps: 100,
  squats: 100,
  runningKm: 10,
};

export const QUEST_XP_WEIGHTS = {
  pushups: 2,
  situps: 2,
  squats: 2,
  runningKm: 25,
};

export const DAILY_COMPLETION_REWARD = {
  xp: 500,
  attributePoints: 3,
  gold: 50,
};

export const XP_REQUIRED = (level: number) => level * 100;
