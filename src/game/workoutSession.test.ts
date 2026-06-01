import test from "node:test";
import assert from "node:assert/strict";
import type { WorkoutPlanExercise, WorkoutPlanSessionSummary } from "../types";
import {
  advanceSessionAfterRest,
  completeCurrentSessionSet,
  pauseWorkoutSession,
  resumeWorkoutSession,
  savePartialWorkoutSessionWithoutReward,
  skipCurrentSessionSet,
  startWorkoutPlanSession,
  summarizeWorkoutSession,
} from "./workoutSession";

function plan(): WorkoutPlanExercise[] {
  return [
    {
      id: "plan_push",
      catalogExerciseId: "pushups",
      name: "Pompki",
      category: "Klatka piersiowa",
      equipment: "masa ciala",
      primaryMuscles: ["klatka piersiowa"],
      goal: "Siła",
      targetArea: "klatka",
      targetSets: 2,
      targetReps: 10,
      defaultWeightKg: 0,
      restSeconds: 30,
      notes: "",
      sets: [],
      createdAt: "2026-05-24T10:00:00.000Z",
      lastCompletedAt: null,
    },
    {
      id: "plan_squat",
      catalogExerciseId: "squats",
      name: "Przysiady",
      category: "Nogi",
      equipment: "masa ciala",
      primaryMuscles: ["nogi"],
      goal: "Kondycja",
      targetArea: "nogi",
      targetSets: 1,
      targetReps: 12,
      defaultWeightKg: 0,
      restSeconds: 0,
      notes: "",
      sets: [],
      createdAt: "2026-05-24T10:00:00.000Z",
      lastCompletedAt: null,
    },
  ];
}

test("workout session cannot start from an empty plan", () => {
  assert.equal(startWorkoutPlanSession([]), null);
});

test("workout session walks sets and exercises in order", () => {
  const session = startWorkoutPlanSession(plan(), new Date("2026-05-24T10:00:00.000Z"));
  assert.ok(session);

  const afterFirst = completeCurrentSessionSet(session, [], new Date("2026-05-24T10:00:30.000Z"));
  assert.equal(afterFirst.status, "resting");
  assert.equal(afterFirst.exerciseIndex, 0);
  assert.equal(afterFirst.setIndex, 1);

  const afterRest = advanceSessionAfterRest(afterFirst, new Date("2026-05-24T10:01:00.000Z"));
  const afterSecond = completeCurrentSessionSet(afterRest, [], new Date("2026-05-24T10:01:30.000Z"));
  assert.equal(afterSecond.status, "resting");
  assert.equal(afterSecond.exerciseIndex, 1);
  assert.equal(afterSecond.setIndex, 0);

  const lastStep = advanceSessionAfterRest(afterSecond, new Date("2026-05-24T10:02:00.000Z"));
  const completed = completeCurrentSessionSet(lastStep, [], new Date("2026-05-24T10:02:35.000Z"));

  assert.equal(completed.status, "completed");
  assert.equal(completed.results.length, 3);
  assert.equal(completed.reward?.completedSets, 3);
  assert.equal(completed.reward?.totalSets, 3);
});

test("workout session pause does not increase active duration", () => {
  const session = startWorkoutPlanSession(plan().slice(0, 1), new Date("2026-05-24T10:00:00.000Z"));
  assert.ok(session);

  const paused = pauseWorkoutSession(session, new Date("2026-05-24T10:00:10.000Z"));
  const resumed = resumeWorkoutSession(paused, new Date("2026-05-24T10:05:10.000Z"));
  const completed = completeCurrentSessionSet(resumed, [], new Date("2026-05-24T10:05:40.000Z"));
  const summary = summarizeWorkoutSession(savePartialWorkoutSessionWithoutReward(completed, new Date("2026-05-24T10:05:40.000Z")));

  assert.equal(resumed.totalPausedSeconds, 300);
  assert.ok(summary.activeSeconds < 80);
});

test("skipped set lowers completion and reward", () => {
  const session = startWorkoutPlanSession(plan().slice(0, 1), new Date("2026-05-24T10:00:00.000Z"));
  assert.ok(session);

  const skipped = skipCurrentSessionSet(session, [], new Date("2026-05-24T10:00:20.000Z"));
  const next = advanceSessionAfterRest(skipped, new Date("2026-05-24T10:00:50.000Z"));
  const completed = completeCurrentSessionSet(next, [], new Date("2026-05-24T10:01:20.000Z"));

  assert.equal(completed.status, "completed");
  assert.equal(completed.reward?.completedSets, 1);
  assert.equal(completed.reward?.totalSets, 2);
  assert.equal(completed.reward?.completionRatio, 0.5);
});

test("record is scoped by plan signature", () => {
  const session = startWorkoutPlanSession(plan().slice(0, 1), new Date("2026-05-24T10:00:00.000Z"));
  assert.ok(session);

  const previous: WorkoutPlanSessionSummary[] = [{
    id: "old",
    planSignature: session.planSignature,
    dateKey: "2026-05-23",
    startedAt: "2026-05-23T10:00:00.000Z",
    completedAt: "2026-05-23T10:02:00.000Z",
    activeSeconds: 120,
    estimatedSeconds: session.estimatedSeconds,
    totalPausedSeconds: 0,
    completedSets: 2,
    totalSets: 2,
    skippedSets: 0,
    totalReps: 20,
    volumeKg: 0,
    completionRatio: 1,
    pacePercent: 0,
    paceGrade: "onPace",
    newRecord: true,
    xpReward: 30,
    goldReward: 10,
    exercises: session.exercises,
    results: [],
  }];

  const afterFirst = completeCurrentSessionSet(session, previous, new Date("2026-05-24T10:00:30.000Z"));
  const next = advanceSessionAfterRest(afterFirst, new Date("2026-05-24T10:01:00.000Z"));
  const completed = completeCurrentSessionSet(next, previous, new Date("2026-05-24T10:01:40.000Z"));

  assert.equal(completed.reward?.newRecord, true);
});

test("pace bonus is blocked for absurdly fast sessions", () => {
  const session = startWorkoutPlanSession(plan().slice(0, 1), new Date("2026-05-24T10:00:00.000Z"));
  assert.ok(session);

  const afterFirst = completeCurrentSessionSet(session, [], new Date("2026-05-24T10:00:01.000Z"));
  const next = advanceSessionAfterRest(afterFirst, new Date("2026-05-24T10:00:02.000Z"));
  const completed = completeCurrentSessionSet(next, [], new Date("2026-05-24T10:00:03.000Z"));

  assert.equal(completed.reward?.paceGrade, "tooFast");
  assert.equal(completed.reward?.eligibleForPaceBonus, false);
});
