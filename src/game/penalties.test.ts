import test from "node:test";
import assert from "node:assert/strict";
import {
  completePenalty,
  createDailyPenalty,
  DEFAULT_PENALTY_SETTINGS,
  ensureDailyPenalty,
  getActivePenalty,
  getPenaltyRewardMultiplier,
  markPenaltyPhoneAttempt,
  normalizePenalties,
  normalizePenaltySettings,
} from "./penalties";

test("penalty settings migrate old saves with defaults", () => {
  const settings = normalizePenaltySettings({ penaltyIntensity: "hard", phonePranksEnabled: false });

  assert.equal(settings.penaltyIntensity, "hard");
  assert.equal(settings.phonePranksEnabled, false);
  assert.equal(settings.wallpaperPenaltyEnabled, false);
  assert.equal(settings.fontPenaltyEnabled, false);
});

test("phone prank settings stay enabled only after explicit consent", () => {
  const settings = normalizePenaltySettings({
    penaltyConsentSeen: true,
    funnyPenaltiesEnabled: true,
    phonePranksEnabled: true,
    wallpaperPenaltyEnabled: true,
    fontPenaltyEnabled: true,
  });

  assert.equal(settings.funnyPenaltiesEnabled, true);
  assert.equal(settings.phonePranksEnabled, true);
  assert.equal(settings.wallpaperPenaltyEnabled, true);
  assert.equal(settings.fontPenaltyEnabled, true);
});

test("daily penalty is not created when penalty exercises are disabled by default", () => {
  const result = ensureDailyPenalty([], "2026-05-24", DEFAULT_PENALTY_SETTINGS, "2026-05-25T02:00:00.000Z");
  assert.equal(result.length, 0);
});

test("daily penalty is created once per missed day when enabled", () => {
  const settings = { ...DEFAULT_PENALTY_SETTINGS, penaltyExercisesEnabled: true };
  const first = ensureDailyPenalty([], "2026-05-24", settings, "2026-05-25T02:00:00.000Z");
  const second = ensureDailyPenalty(first, "2026-05-24", settings, "2026-05-25T03:00:00.000Z");

  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.equal(second[0].missedDateKey, "2026-05-24");
});


test("phone penalties fall back to app exercise when disabled", () => {
  const penalty = createDailyPenalty("2026-05-24", {
    ...DEFAULT_PENALTY_SETTINGS,
    funnyPenaltiesEnabled: false,
    phonePranksEnabled: false,
  });

  assert.equal(penalty.type, "appExercise");
  assert.ok(penalty.requiredAmount > 0);
});

test("active phone penalties migrate to app exercise", () => {
  const penalty = {
    ...createDailyPenalty("2026-05-24", {
      ...DEFAULT_PENALTY_SETTINGS,
      penaltyConsentSeen: true,
      funnyPenaltiesEnabled: true,
      phonePranksEnabled: true,
      wallpaperPenaltyEnabled: true,
    }),
    type: "wallpaper" as const,
    appliedWallpaper: true,
    phoneAttempted: true,
  };

  const [migrated] = normalizePenalties([penalty]);

  assert.equal(migrated.type, "appExercise");
  assert.equal(migrated.appliedWallpaper, false);
  assert.equal(migrated.phoneAttempted, false);
});

test("completed penalty is no longer active", () => {
  const settings = { ...DEFAULT_PENALTY_SETTINGS, penaltyExercisesEnabled: true };
  const [penalty] = ensureDailyPenalty([], "2026-05-24", settings);
  const completed = completePenalty([penalty], penalty.id, "2026-05-25T02:00:00.000Z");

  assert.equal(completed[0].status, "completed");
  assert.equal(getActivePenalty(completed), null);
});

test("phone attempt marks concrete native prank result", () => {
  const settings = { ...DEFAULT_PENALTY_SETTINGS, penaltyExercisesEnabled: true };
  const [penalty] = ensureDailyPenalty([], "2026-05-24", settings);
  const updated = markPenaltyPhoneAttempt([penalty], penalty.id, { appliedWallpaper: true });

  assert.equal(updated[0].phoneAttempted, true);
  assert.equal(updated[0].appliedWallpaper, true);
});

test("active penalty lowers optional game rewards", () => {
  const settings = { ...DEFAULT_PENALTY_SETTINGS, penaltyExercisesEnabled: true };
  const [penalty] = ensureDailyPenalty([], "2026-05-24", settings);

  assert.equal(getPenaltyRewardMultiplier([penalty]), 0.55);
  assert.equal(getPenaltyRewardMultiplier(completePenalty([penalty], penalty.id)), 1);
});

