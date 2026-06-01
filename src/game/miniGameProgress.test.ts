import assert from "node:assert/strict";
import test from "node:test";
import {
  applyMiniGameDecay,
  calculateMiniGameCompletion,
  createDefaultMiniGameProgress,
} from "./miniGameProgress";

test("winning a mini-game raises its level and scales rewards", () => {
  const progress = createDefaultMiniGameProgress("gate-dodge");
  const result = calculateMiniGameCompletion({
    progress,
    result: { gameId: "gate-dodge", score: 500, won: true, statHint: "AGILITY" },
    today: "2026-05-07",
  });

  assert.equal(result.progress.level, 2);
  assert.equal(result.progress.wins, 1);
  assert.equal(result.progress.winStreak, 1);
  assert.equal(result.progress.bestScore, 500);
  assert.ok(result.xpReward > 0);
  assert.ok(result.goldReward > 0);
});

test("losing keeps the mini-game level and resets streak", () => {
  const progress = {
    ...createDefaultMiniGameProgress("shadow-strike"),
    level: 8,
    winStreak: 3,
  };
  const result = calculateMiniGameCompletion({
    progress,
    result: { gameId: "shadow-strike", score: 120, won: false, statHint: "STR" },
    today: "2026-05-07",
  });

  assert.equal(result.progress.level, 8);
  assert.equal(result.progress.losses, 1);
  assert.equal(result.progress.winStreak, 0);
  assert.ok(result.xpReward > 0);
  assert.ok(result.goldReward >= 0);
});

test("inactivity lowers level and reward multiplier after two days", () => {
  const progress = {
    ...createDefaultMiniGameProgress("mana-memory"),
    level: 9,
    winStreak: 5,
    lastPlayedDate: "2026-05-01",
  };

  const decayed = applyMiniGameDecay(progress, "2026-05-07");

  assert.equal(decayed.level, 6);
  assert.equal(decayed.winStreak, 0);
  assert.ok(decayed.rewardMultiplier < 1.96);
});

test("completion reports decayed level as the round difficulty", () => {
  const progress = {
    ...createDefaultMiniGameProgress("rune-lock"),
    level: 7,
    winStreak: 4,
    lastPlayedDate: "2026-05-01",
  };

  const result = calculateMiniGameCompletion({
    progress,
    result: { gameId: "rune-lock", score: 80, won: false, statHint: "INTELLIGENCE" },
    today: "2026-05-07",
  });

  assert.equal(result.difficultyLevel, 4);
  assert.equal(result.progress.level, 4);
  assert.equal(result.progress.losses, 1);
});

test("rare artifact loot can include a mini-game perk", () => {
  const previousRandom = Math.random;
  Math.random = () => 0;
  try {
    const progress = {
      ...createDefaultMiniGameProgress("shadow-extraction"),
      level: 34,
    };
    const result = calculateMiniGameCompletion({
      progress,
      result: { gameId: "shadow-extraction", score: 1200, won: true, statHint: "SENSE" },
      today: "2026-05-07",
    });

    assert.equal(result.progress.level, 35);
    assert.equal(result.loot?.type, "artifact");
    assert.equal(result.loot?.rarity, "epic");
    assert.match(result.loot?.name || "", / A$/);
    assert.equal(result.loot?.miniGamePerk?.gameId, "shadow-extraction");
    assert.equal(result.loot?.miniGamePerk?.kind, "targetLifetime");
  } finally {
    Math.random = previousRandom;
  }
});

test("mini-game loot rank and rarity use post-win mini-game level thresholds", () => {
  const previousRandom = Math.random;
  Math.random = () => 0;
  try {
    const thresholds = [
      { before: 4, rank: "D", rarity: "common" },
      { before: 14, rank: "C", rarity: "rare" },
      { before: 34, rank: "A", rarity: "epic" },
      { before: 49, rank: "S", rarity: "legendary" },
    ] as const;

    for (const threshold of thresholds) {
      const result = calculateMiniGameCompletion({
        progress: {
          ...createDefaultMiniGameProgress("shadow-extraction"),
          level: threshold.before,
        },
        result: { gameId: "shadow-extraction", score: 2400, won: true, statHint: "SENSE" },
        today: "2026-05-07",
      });

      assert.equal(result.progress.level, threshold.before + 1);
      assert.equal(result.loot?.rarity, threshold.rarity);
      assert.match(result.loot?.name || "", new RegExp(` ${threshold.rank}$`));
      assert.ok((result.loot?.bonusValue || 0) >= Math.floor((threshold.before + 1) / 8) + 1);
    }
  } finally {
    Math.random = previousRandom;
  }
});
