import test from "node:test";
import assert from "node:assert/strict";
import {
  completeDailyQuestProgress,
  createDailyQuestItemFromCatalog,
  deriveDailyQuestItemFields,
  findDailyQuestItemByTrackable,
  getDailyQuestItemProgress,
  getDailyQuestProgress,
  normalizeDailyQuest,
  resetDailyQuestProgress,
  updateDailyQuestItemProgress,
  updateDailyQuestItems,
} from "./dailyQuest";

test("daily quest migration keeps legacy progress in editable items", () => {
  const dailyQuest = normalizeDailyQuest({
    pushups: 15,
    situps: 20,
    squats: 25,
    runningKm: 3.5,
    completedAt: null,
    penaltyGiven: false,
    miniGamesPlayed: 0,
    streak: 2,
  });

  assert.equal(getDailyQuestItemProgress(dailyQuest, "pushups"), 15);
  assert.equal(getDailyQuestItemProgress(dailyQuest, "situps"), 20);
  assert.equal(getDailyQuestItemProgress(dailyQuest, "squats"), 25);
  assert.equal(getDailyQuestItemProgress(dailyQuest, "runningKm"), 3.5);
  assert.equal(dailyQuest.pushups, 15);
  assert.equal(dailyQuest.runningKm, 3.5);
});

test("custom daily completion, reset and progress use enabled items", () => {
  const base = normalizeDailyQuest(undefined);
  const customItem = createDailyQuestItemFromCatalog({
    id: "plank",
    name: "Plank",
    category: "Brzuch i core",
    primaryMuscles: ["core"],
  }, base.items, new Date("2026-06-01T10:00:00.000Z"));
  const customDaily = updateDailyQuestItems(base, [
    { ...base.items[0], target: 10 },
    { ...customItem, target: 30, unit: "sek." },
  ]);

  const afterPushups = updateDailyQuestItemProgress(customDaily, "pushups", 10).dailyQuest;
  const afterPlank = updateDailyQuestItemProgress(afterPushups, customItem.id, 30).dailyQuest;
  const progress = getDailyQuestProgress(afterPlank);
  const completed = completeDailyQuestProgress(afterPlank);
  const reset = resetDailyQuestProgress(completed, 4);

  assert.equal(progress.completedCount, 2);
  assert.equal(progress.totalCount, 2);
  assert.equal(completed.completedAt !== null, true);
  assert.equal(getDailyQuestItemProgress(reset, "pushups"), 0);
  assert.equal(getDailyQuestItemProgress(reset, customItem.id), 0);
  assert.equal(reset.streak, 4);
});

test("trackable daily item is explicit and ignores manual-only items", () => {
  const dailyQuest = normalizeDailyQuest(undefined);
  const runningItem = findDailyQuestItemByTrackable(dailyQuest, "runningKm");
  const manualItem = createDailyQuestItemFromCatalog({
    id: "uginanie",
    name: "Uginanie ramion",
    category: "Ramiona",
    primaryMuscles: ["biceps"],
  }, dailyQuest.items, new Date("2026-06-01T10:00:00.000Z"));
  const updated = updateDailyQuestItems(dailyQuest, [...dailyQuest.items, manualItem]);

  assert.equal(runningItem?.id, "runningKm");
  assert.equal(findDailyQuestItemByTrackable(updated, "runningKm")?.id, "runningKm");
  assert.equal(updated.items.find((item) => item.id === manualItem.id)?.trackableExerciseId, undefined);
});

test("catalog daily items get automatic repetitions and stat assignment", () => {
  const dailyQuest = normalizeDailyQuest(undefined);
  const squatVariant = createDailyQuestItemFromCatalog({
    id: "przysiad-bulgarski",
    name: "Przysiad bułgarski",
    category: "Nogi",
    primaryMuscles: ["uda", "pośladki"],
  }, dailyQuest.items, new Date("2026-06-01T10:00:00.000Z"));

  assert.equal(squatVariant.unit, "powt.");
  assert.equal(squatVariant.manualSmall, 1);
  assert.equal(squatVariant.manualLarge, 10);
  assert.equal(squatVariant.stat, "AGILITY");
  assert.equal(squatVariant.trackableExerciseId, undefined);
});

test("running-related catalog daily items use kilometers automatically", () => {
  const dailyQuest = normalizeDailyQuest(undefined);
  const running = createDailyQuestItemFromCatalog({
    id: "interwaly-biegowe",
    name: "Interwały biegowe",
    category: "Kondycja",
    primaryMuscles: ["nogi", "serce"],
  }, dailyQuest.items, new Date("2026-06-01T10:00:00.000Z"));
  const staleCustom = updateDailyQuestItems(dailyQuest, [{
    ...running,
    unit: "sek.",
    manualSmall: 5,
    manualLarge: 25,
    stat: "STR",
  }]);
  const normalizedRunning = staleCustom.items.find((item) => item.id === running.id);

  assert.equal(running.unit, "km");
  assert.equal(running.manualSmall, 0.1);
  assert.equal(running.manualLarge, 1);
  assert.equal(running.stat, "SENSE");
  assert.equal(running.trackableExerciseId, "runningKm");
  assert.equal(normalizedRunning?.unit, "km");
  assert.equal(normalizedRunning?.manualSmall, 0.1);
  assert.equal(normalizedRunning?.manualLarge, 1);
  assert.equal(deriveDailyQuestItemFields(running).unit, "km");
});
