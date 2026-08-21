import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_PLAYER, type PlayerState, type WorkoutPlanSessionSummary } from "../../types";
import {
  CAMPAIGN_STAGE_COUNT,
  REALMS,
  createFitnessSnapshot,
  getCampaignStages,
  getStageDefinition,
} from "./index";

function session(id: string, completedAt: string, overrides: Partial<WorkoutPlanSessionSummary> = {}): WorkoutPlanSessionSummary {
  return {
    id,
    planSignature: "plan",
    dateKey: completedAt.slice(0, 10),
    startedAt: completedAt,
    completedAt,
    activeSeconds: 3_600,
    estimatedSeconds: 3_600,
    totalPausedSeconds: 0,
    completedSets: 10,
    totalSets: 10,
    skippedSets: 0,
    totalReps: 100,
    volumeKg: 2_000,
    completionRatio: 1,
    pacePercent: 100,
    paceGrade: "onPace",
    newRecord: false,
    xpReward: 0,
    goldReward: 0,
    exercises: [],
    results: [],
    ...overrides,
  };
}

test("campaign content contains four complete realms and exactly 48 stable nodes", () => {
  const stages = getCampaignStages();
  assert.equal(REALMS.length, 4);
  assert.equal(stages.length, CAMPAIGN_STAGE_COUNT);
  assert.deepEqual(stages.map((entry) => entry.stage), Array.from({ length: 48 }, (_, index) => index + 1));
  for (let realm = 0; realm < 4; realm += 1) {
    const realmStages = stages.slice(realm * 12, realm * 12 + 12);
    assert.equal(realmStages.length, 12);
    assert.equal(realmStages[5].kind, "elite");
    assert.equal(realmStages[11].kind, "boss");
    assert.equal(realmStages.filter((entry) => entry.hasChest).length, 2);
  }
  assert.equal(getStageDefinition(1).enemyName, "Skorupnik Żużlowy");
  assert.equal(getStageDefinition(48).enemyName, "Aevor, Ostatnia Korona");
});

test("fitness bridge uses active Daily Quest and deduplicated seven-day workout sessions only", () => {
  const now = Date.parse("2026-08-21T12:00:00.000Z");
  const profile = structuredClone(INITIAL_PLAYER) as PlayerState;
  profile.stats = { STR: 80, VITALITY: 50, AGILITY: 60, INTELLIGENCE: 70, SENSE: 40 };
  profile.dailyQuest.progressByItemId = { pushups: 100, situps: 50, squats: 0, runningKm: 10 };
  profile.dailyQuest.items[2].enabled = false;
  profile.dailyQuest.streak = 7;
  profile.workoutSessions = [
    session("same-id", "2026-08-20T10:00:00.000Z", { activeSeconds: 1_800, completedSets: 5, volumeKg: 1_000 }),
    session("same-id", "2026-08-20T11:00:00.000Z", { activeSeconds: 3_600, completedSets: 10, volumeKg: 2_000 }),
    session("second", "2026-08-18T10:00:00.000Z", { activeSeconds: 3_600, completedSets: 10, volumeKg: 3_000 }),
    session("too-old", "2026-08-01T10:00:00.000Z", { activeSeconds: 99_999, completedSets: 999, volumeKg: 999_999 }),
  ];
  profile.workoutHistory = [{ id: "ignored", exercise: "ignored", value: 999_999, source: "wearable", timestamp: "2026-08-21T11:00:00.000Z" }];
  profile.wearableSamples = [{ id: "ignored", source: "healthConnect", timestamp: "2026-08-21T11:00:00.000Z", dateKey: "2026-08-21", exerciseMinutes: 99_999 }];

  const snapshot = createFitnessSnapshot(profile, now);
  assert.equal(snapshot.weeklyMinutes, 120);
  assert.equal(snapshot.weeklySets, 20);
  assert.equal(snapshot.weeklyVolumeKg, 5_000);
  assert.equal(snapshot.dailyRatio, (1 + 0.5 + 1) / 3);
  assert.equal(snapshot.effectiveStats.STR, 80);
  assert.ok(snapshot.momentum > 0 && snapshot.momentum <= 1);
  assert.equal(snapshot.attackPct, 0.48);
});
