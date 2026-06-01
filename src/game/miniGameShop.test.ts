import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeActiveMiniGameBooster,
  createDefaultMiniGameShop,
  getMiniGameShopBonuses,
  getNextMiniGameUpgradeCost,
  normalizeMiniGameShop,
} from "./miniGameShop";

test("mini-game shop gives every game a free default effect", () => {
  const shop = normalizeMiniGameShop(undefined);

  assert.equal(shop.selectedEffectByGame["gate-dodge"], "system-aura");
  assert.deepEqual(shop.ownedEffects["shadow-extraction"], ["system-aura"]);
});

test("mini-game upgrades are capped and expose the next cost", () => {
  const shop = normalizeMiniGameShop({
    upgrades: {
      "shadow-extraction": {
        precision: 99,
        tempo: 2,
      },
    },
  });

  assert.equal(shop.upgrades["shadow-extraction"]?.precision, 4);
  assert.equal(getNextMiniGameUpgradeCost(shop, "shadow-extraction", "precision"), null);
  assert.equal(getNextMiniGameUpgradeCost(shop, "shadow-extraction", "tempo"), 720);
});

test("shop bonuses stay balanced and include one-round xp boosters", () => {
  const shop = normalizeMiniGameShop({
    upgrades: {
      "gate-dodge": {
        precision: 4,
        stability: 4,
        tempo: 3,
        ward: 3,
      },
    },
    boosters: {
      "gate-dodge": {
        "xp-contract": 1,
      },
    },
    activeBoosterByGame: {
      "gate-dodge": "xp-contract",
    },
  });

  const bonuses = getMiniGameShopBonuses(shop, "gate-dodge");

  assert.equal(bonuses.activeBoosterId, "xp-contract");
  assert.equal(bonuses.xpMultiplier, 1.25);
  assert.ok(bonuses.scoreBonus <= 0.08);
  assert.ok(bonuses.hitWindow <= 0.07);
  assert.ok(bonuses.targetLifetime <= 320);
});

test("active booster is consumed once the round starts", () => {
  const shop = {
    ...createDefaultMiniGameShop(),
    boosters: {
      ...createDefaultMiniGameShop().boosters,
      "mana-memory": {
        "focus-ampoule": 2,
      },
    },
    activeBoosterByGame: {
      "mana-memory": "focus-ampoule" as const,
    },
  };

  const consumed = consumeActiveMiniGameBooster(shop, "mana-memory");

  assert.equal(consumed.boosters["mana-memory"]?.["focus-ampoule"], 1);
  assert.equal(consumed.activeBoosterByGame["mana-memory"], null);
});
