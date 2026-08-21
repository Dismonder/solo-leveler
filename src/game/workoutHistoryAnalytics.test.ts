import test from "node:test";
import assert from "node:assert/strict";
import {
  computeVolumeHistory,
  computeMuscleGroupDistribution,
  computeHunterPersonalRecords,
  formatDetailedSessions,
} from "./workoutHistoryAnalytics";
import type { WorkoutPlanSessionSummary } from "../types";
import type { UnifiedDayRecord } from "../data/unifiedHistory";

test("computeVolumeHistory handles empty and populated history", () => {
  const empty = computeVolumeHistory([], []);
  assert.deepEqual(empty, []);

  const days: UnifiedDayRecord[] = [
    {
      date: "2026-08-20",
      planDurationSeconds: 1200,
      planVolumeKg: 2400,
      planSetsCompleted: 10,
      xpEarned: 150,
      goldEarned: 40,
      dailyCompleted: 1,
      dailyProgressPercent: 100,
      wearableSamples: 0,
      planSessions: 1,
    },
  ];

  const sessions: WorkoutPlanSessionSummary[] = [
    {
      id: "s1",
      planSignature: "pompki-3x15",
      dateKey: "2026-08-20",
      startedAt: "2026-08-20T10:00:00Z",
      completedAt: "2026-08-20T10:20:00Z",
      activeSeconds: 1200,
      estimatedSeconds: 1200,
      totalPausedSeconds: 0,
      completedSets: 3,
      totalSets: 3,
      skippedSets: 0,
      totalReps: 45,
      volumeKg: 0,
      completionRatio: 1,
      pacePercent: 0,
      paceGrade: "onPace",
      newRecord: false,
      xpReward: 150,
      goldReward: 40,
      exercises: [
        {
          id: "ex1",
          planExerciseId: "pe1",
          catalogExerciseId: "pompki-klasyczne",
          name: "Pompki klasyczne",
          category: "Klatka piersiowa",
          equipment: "masa ciala",
          primaryMuscles: ["klatka piersiowa"],
          goal: "Technika",
          targetArea: "Klatka",
          notes: "",
          order: 0,
          targetSets: 3,
          targetReps: 15,
          weightKg: 0,
          restSeconds: 60,
        },
      ],
      results: [],
    },
  ];

  const result = computeVolumeHistory(days, sessions);
  assert.equal(result.length, 1);
  assert.equal(result[0].date, "2026-08-20");
  assert.equal(result[0].label, "08.20");
  assert.equal(result[0].sets, 10);
});

test("computeMuscleGroupDistribution correctly groups sets by category", () => {
  const sessions: WorkoutPlanSessionSummary[] = [
    {
      id: "s1",
      planSignature: "test-plan",
      dateKey: "2026-08-20",
      startedAt: "2026-08-20T10:00:00Z",
      completedAt: "2026-08-20T10:20:00Z",
      activeSeconds: 1200,
      estimatedSeconds: 1200,
      totalPausedSeconds: 0,
      completedSets: 7,
      totalSets: 7,
      skippedSets: 0,
      totalReps: 96,
      volumeKg: 1800,
      completionRatio: 1,
      pacePercent: 0,
      paceGrade: "onPace",
      newRecord: false,
      xpReward: 150,
      goldReward: 40,
      exercises: [
        {
          id: "ex1",
          planExerciseId: "pe1",
          catalogExerciseId: "pompki-klasyczne",
          name: "Pompki klasyczne",
          category: "Klatka piersiowa",
          equipment: "masa ciala",
          primaryMuscles: ["klatka piersiowa"],
          goal: "Technika",
          targetArea: "Klatka",
          notes: "",
          order: 0,
          targetSets: 4,
          targetReps: 15,
          weightKg: 0,
          restSeconds: 60,
        },
        {
          id: "ex2",
          planExerciseId: "pe2",
          catalogExerciseId: "przysiad-klasyczny",
          name: "Przysiad klasyczny",
          category: "Nogi",
          equipment: "sztanga",
          primaryMuscles: ["nogi"],
          goal: "Technika",
          targetArea: "Nogi",
          notes: "",
          order: 1,
          targetSets: 3,
          targetReps: 12,
          weightKg: 50,
          restSeconds: 90,
        },
      ],
      results: [],
    },
  ];

  const distribution = computeMuscleGroupDistribution(sessions, []);
  const klatka = distribution.find((d) => d.category === "Klatka piersiowa");
  const nogi = distribution.find((d) => d.category === "Nogi");

  assert.ok(klatka && klatka.sets === 4);
  assert.ok(nogi && nogi.sets === 3);
  assert.ok(klatka.percentage > 0);
});

test("computeHunterPersonalRecords finds max volume, pace and streak", () => {
  const sessions: WorkoutPlanSessionSummary[] = [
    {
      id: "s1",
      planSignature: "heavy-bench",
      dateKey: "2026-08-19",
      startedAt: "2026-08-19T10:00:00Z",
      completedAt: "2026-08-19T10:20:00Z",
      activeSeconds: 600,
      estimatedSeconds: 900,
      totalPausedSeconds: 0,
      completedSets: 5,
      totalSets: 5,
      skippedSets: 0,
      totalReps: 50,
      volumeKg: 5000,
      completionRatio: 1,
      pacePercent: 33,
      paceGrade: "faster",
      newRecord: true,
      xpReward: 250,
      goldReward: 100,
      exercises: [],
      results: [],
    },
  ];

  const days: UnifiedDayRecord[] = [
    {
      date: "2026-08-18",
      planDurationSeconds: 600,
      planVolumeKg: 1000,
      planSetsCompleted: 5,
      xpEarned: 100,
      goldEarned: 20,
      dailyCompleted: 1,
      dailyProgressPercent: 100,
      wearableSamples: 0,
      planSessions: 1,
    },
    {
      date: "2026-08-19",
      planDurationSeconds: 600,
      planVolumeKg: 5000,
      planSetsCompleted: 5,
      xpEarned: 250,
      goldEarned: 100,
      dailyCompleted: 1,
      dailyProgressPercent: 100,
      wearableSamples: 0,
      planSessions: 1,
    },
  ];

  const prs = computeHunterPersonalRecords(sessions, days, []);
  assert.ok(prs.some((p) => p.id === "max-volume"));
  assert.ok(prs.some((p) => p.id === "max-streak"));
  assert.ok(prs.some((p) => p.id === "best-pace"));
});
