import assert from "node:assert/strict";
import test from "node:test";
import {
  getRankForLevel,
  getRankProgressForLevel,
  getErykAvatarAssetKey,
  isErykLikeName,
  awakenPlayerLocally,
} from "./systemLogic";

test("maps player levels to all hunter ranks including A", () => {
  assert.equal(getRankForLevel(1), "E");
  assert.equal(getRankForLevel(5), "D");
  assert.equal(getRankForLevel(10), "C");
  assert.equal(getRankForLevel(20), "B");
  assert.equal(getRankForLevel(35), "A");
  assert.equal(getRankForLevel(50), "S");
  assert.equal(getRankForLevel(70), "SS");
});

test("rank progress follows hunter rank instead of combat power thresholds", () => {
  const levelNine = getRankProgressForLevel(9);
  assert.equal(levelNine.rank, "D");
  assert.equal(levelNine.nextLevel, 10);
  assert.equal(levelNine.progress, 80);

  const levelTen = getRankProgressForLevel(10);
  assert.equal(levelTen.rank, "C");
  assert.equal(levelTen.progress, 0);
});

test("detects Eryk-like names and returns the rank avatar key", () => {
  assert.equal(isErykLikeName("Erykson"), true);
  assert.equal(isErykLikeName("Eris"), true);
  assert.equal(isErykLikeName("Marek"), false);
  assert.equal(getErykAvatarAssetKey("Eryk", 42), "Ranga_A_Eryk.png");
  assert.equal(getErykAvatarAssetKey("Marek", 42), null);
});

test("awakens a player locally without network or api keys", () => {
  const result = awakenPlayerLocally("Eris", "Mag", {
    STR: 0,
    VITALITY: 0,
    AGILITY: 0,
    INTELLIGENCE: 30,
    SENSE: 20,
  });

  assert.equal(result.assessment.rank, "E-Rank");
  assert.match(result.assessment.jobClass, /Arkanista|Mag/);
  assert.match(result.assessment.systemMessage, /Przebudzenie/);
  assert.equal(result.avatarKey, "Ranga_E_Eryk.png");
});
