import test from "node:test";
import assert from "node:assert/strict";
import { createCombatEncounter, createCombatMonster, resolveCombatAction } from "./combatSystem";

const stats = {
  STR: 30,
  AGILITY: 15,
  SENSE: 12,
  VITALITY: 20,
  INTELLIGENCE: 14,
};

test("combat system blocks actions when focus is too low", () => {
  const monster = createCombatMonster("m", "Cien", "Test", 100, 12, 4, 10, 3, "goblin");
  const encounter = { ...createCombatEncounter(monster, 100), focus: 0 };
  const result = resolveCombatAction({ state: encounter, action: "shadow", stats, weaponBonus: 0, now: 0 });

  assert.equal(result.state, encounter);
  assert.equal(result.events.length, 0);
  assert.match(result.logs[0], /Za malo focusu/);
});

test("combat system resolves player action, enemy intent and animation events", () => {
  const monster = createCombatMonster("m", "Cien", "Test", 180, 18, 8, 10, 3, "goblin");
  const encounter = createCombatEncounter(monster, 100);
  const result = resolveCombatAction({
    state: encounter,
    action: "basic",
    stats,
    weaponBonus: 0,
    now: 100,
    random: () => 0.99,
  });

  assert.equal(result.victory, false);
  assert.equal(result.defeat, false);
  assert.equal(result.state.turn, 2);
  assert.ok(result.state.monster.hp < monster.maxHp);
  assert.ok(result.state.playerHp < 100);
  assert.ok(result.events.some((event) => event.type === "attack"));
  assert.ok(result.events.some((event) => event.actor === "enemy"));
});

test("combat system blocks active skill actions that are not unlocked", () => {
  const monster = createCombatMonster("m", "Cien", "Test", 160, 14, 5, 10, 3, "goblin");
  const encounter = { ...createCombatEncounter(monster, 100), focus: 80 };
  const result = resolveCombatAction({
    state: encounter,
    action: "shadow",
    stats,
    weaponBonus: 0,
    now: 0,
    unlockedSkills: [],
  });

  assert.equal(result.state, encounter);
  assert.equal(result.events.length, 0);
  assert.match(result.logs[0], /nie odblokowano/i);
});

test("combat system allows unlocked active skills and charge increases basic damage", () => {
  const monster = createCombatMonster("m", "Cien", "Test", 240, 12, 8, 10, 3, "goblin");
  const encounter = { ...createCombatEncounter(monster, 100), focus: 90 };
  const uncharged = resolveCombatAction({
    state: encounter,
    action: "basic",
    stats,
    weaponBonus: 0,
    now: 0,
    random: () => 0.99,
    chargePercent: 0,
  });
  const charged = resolveCombatAction({
    state: encounter,
    action: "basic",
    stats,
    weaponBonus: 0,
    now: 0,
    random: () => 0.99,
    chargePercent: 100,
  });
  const skill = resolveCombatAction({
    state: encounter,
    action: "shadow",
    stats,
    weaponBonus: 0,
    now: 0,
    random: () => 0.99,
    unlockedSkills: ["shadow_strike"],
  });

  assert.ok(charged.state.monster.hp < uncharged.state.monster.hp);
  assert.ok(skill.state.monster.hp < encounter.monster.hp);
});

test("combat system applies first turn stealth dodge when unlocked", () => {
  const monster = createCombatMonster("m", "Cien", "Test", 220, 30, 8, 10, 3, "wolf");
  const encounter = createCombatEncounter(monster, 100);
  const result = resolveCombatAction({
    state: encounter,
    action: "guard",
    stats,
    weaponBonus: 0,
    now: 0,
    random: () => 0.99,
    unlockedSkills: ["stealth"],
  });

  assert.equal(result.state.playerHp, 100);
  assert.ok(result.logs.some((line) => /unik/i.test(line)));
  assert.ok(result.events.some((event) => event.type === "dash" && event.actor === "hunter"));
});
