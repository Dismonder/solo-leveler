import test from "node:test";
import assert from "node:assert/strict";
import {
  addCatalogExerciseToPlan,
  addSetToPlanExercise,
  getPlanCompletionForDate,
  getPlanSetsForDate,
  removePlanExercise,
  removePlanSet,
  updatePlanExercise,
} from "./workoutPlan";

const catalogExercise = {
  id: "pompki-klasyczne",
  name: "Pompki klasyczne",
  category: "Klatka piersiowa",
  equipment: "masa ciala",
  primaryMuscles: ["klatka piersiowa", "triceps"],
};

test("workout plan adds a catalog exercise only once", () => {
  const now = new Date("2026-05-24T10:00:00.000Z");
  const first = addCatalogExerciseToPlan([], catalogExercise, now);
  const second = addCatalogExerciseToPlan(first, catalogExercise, now);

  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.equal(first[0].catalogExerciseId, "pompki-klasyczne");
  assert.equal(first[0].targetSets, 3);
});

test("workout plan clamps editable training targets", () => {
  const plan = addCatalogExerciseToPlan([], catalogExercise, new Date("2026-05-24T10:00:00.000Z"));
  const updated = updatePlanExercise(plan, plan[0].id, {
    targetSets: 0,
    targetReps: 999,
    defaultWeightKg: -20,
    restSeconds: 999,
    notes: "tempo 3-1-1",
  });

  assert.equal(updated[0].targetSets, 1);
  assert.equal(updated[0].targetReps, 200);
  assert.equal(updated[0].defaultWeightKg, 0);
  assert.equal(updated[0].restSeconds, 600);
  assert.equal(updated[0].notes, "tempo 3-1-1");
});

test("workout plan stores daily sets and completion progress", () => {
  const dateKey = "2026-05-24";
  const plan = addCatalogExerciseToPlan([], catalogExercise, new Date("2026-05-24T10:00:00.000Z"));
  const withSet = addSetToPlanExercise(
    plan,
    plan[0].id,
    { reps: 12, weightKg: 20.25, dateKey },
    new Date("2026-05-24T10:05:00.000Z")
  );

  const todaySets = getPlanSetsForDate(withSet[0], dateKey);
  const completion = getPlanCompletionForDate(withSet, dateKey);

  assert.equal(todaySets.length, 1);
  assert.equal(todaySets[0].reps, 12);
  assert.equal(todaySets[0].weightKg, 20.3);
  assert.equal(completion.completedSets, 1);
  assert.equal(completion.targetSets, 3);
});

test("workout plan removes sets and exercises", () => {
  const dateKey = "2026-05-24";
  const plan = addCatalogExerciseToPlan([], catalogExercise, new Date("2026-05-24T10:00:00.000Z"));
  const withSet = addSetToPlanExercise(plan, plan[0].id, { reps: 10, weightKg: 0, dateKey });
  const setId = withSet[0].sets[0].id;

  const withoutSet = removePlanSet(withSet, withSet[0].id, setId);
  const withoutExercise = removePlanExercise(withoutSet, withSet[0].id);

  assert.equal(withoutSet[0].sets.length, 0);
  assert.equal(withoutExercise.length, 0);
});
