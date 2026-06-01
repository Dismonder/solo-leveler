import type { WorkoutPlanExercise, WorkoutPlanSet } from "../types";

export type WorkoutPlanCatalogExercise = {
  id: string;
  name: string;
  category: string;
  equipment: string;
  primaryMuscles: string[];
};

export type WorkoutPlanExerciseUpdate = Partial<
  Pick<WorkoutPlanExercise, "targetSets" | "targetReps" | "defaultWeightKg" | "restSeconds" | "goal" | "targetArea" | "notes">
>;

export function normalizeWorkoutPlan(plan: WorkoutPlanExercise[] | undefined) {
  return (plan || []).map((exercise) => ({
    ...exercise,
    primaryMuscles: exercise.primaryMuscles || [],
    goal: exercise.goal || "Technika i progres",
    targetArea: exercise.targetArea || (exercise.primaryMuscles || []).slice(0, 3).join(", ") || exercise.category,
    targetSets: clampInteger(exercise.targetSets, 1, 20),
    targetReps: clampInteger(exercise.targetReps, 1, 200),
    defaultWeightKg: clampDecimal(exercise.defaultWeightKg, 0, 500),
    restSeconds: clampInteger(exercise.restSeconds, 0, 600),
    notes: exercise.notes || "",
    sets: exercise.sets || [],
    lastCompletedAt: exercise.lastCompletedAt || null,
  }));
}

export function addCatalogExerciseToPlan(
  plan: WorkoutPlanExercise[],
  exercise: WorkoutPlanCatalogExercise,
  now = new Date()
) {
  if (plan.some((item) => item.catalogExerciseId === exercise.id)) {
    return plan;
  }

  const nextExercise: WorkoutPlanExercise = {
    id: `plan_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    catalogExerciseId: exercise.id,
    name: exercise.name,
    category: exercise.category,
    equipment: exercise.equipment,
    primaryMuscles: [...exercise.primaryMuscles],
    goal: "Technika i progres",
    targetArea: exercise.primaryMuscles.slice(0, 3).join(", ") || exercise.category,
    targetSets: 3,
    targetReps: 10,
    defaultWeightKg: 0,
    restSeconds: 90,
    notes: "",
    sets: [],
    createdAt: now.toISOString(),
    lastCompletedAt: null,
  };

  return [...plan, nextExercise];
}

export function updatePlanExercise(
  plan: WorkoutPlanExercise[],
  planExerciseId: string,
  update: WorkoutPlanExerciseUpdate
) {
  return plan.map((exercise) => {
    if (exercise.id !== planExerciseId) return exercise;
    return {
      ...exercise,
      targetSets: clampInteger(update.targetSets ?? exercise.targetSets, 1, 20),
      targetReps: clampInteger(update.targetReps ?? exercise.targetReps, 1, 200),
      defaultWeightKg: clampDecimal(update.defaultWeightKg ?? exercise.defaultWeightKg, 0, 500),
      restSeconds: clampInteger(update.restSeconds ?? exercise.restSeconds, 0, 600),
      goal: update.goal ?? exercise.goal,
      targetArea: update.targetArea ?? exercise.targetArea,
      notes: update.notes ?? exercise.notes,
    };
  });
}

export function movePlanExercise(plan: WorkoutPlanExercise[], planExerciseId: string, direction: -1 | 1) {
  const index = plan.findIndex((exercise) => exercise.id === planExerciseId);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= plan.length) {
    return plan;
  }

  const next = [...plan];
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next;
}

export function removePlanExercise(plan: WorkoutPlanExercise[], planExerciseId: string) {
  return plan.filter((exercise) => exercise.id !== planExerciseId);
}

export function addSetToPlanExercise(
  plan: WorkoutPlanExercise[],
  planExerciseId: string,
  input: { reps: number; weightKg: number; dateKey: string },
  now = new Date()
) {
  return plan.map((exercise) => {
    if (exercise.id !== planExerciseId) return exercise;

    const nextSet: WorkoutPlanSet = {
      id: `set_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
      dateKey: input.dateKey,
      reps: clampInteger(input.reps, 1, 300),
      weightKg: clampDecimal(input.weightKg, 0, 500),
      completed: true,
      timestamp: now.toISOString(),
    };

    return {
      ...exercise,
      sets: [...exercise.sets.slice(-79), nextSet],
      lastCompletedAt: now.toISOString(),
    };
  });
}

export function removePlanSet(plan: WorkoutPlanExercise[], planExerciseId: string, setId: string) {
  return plan.map((exercise) => {
    if (exercise.id !== planExerciseId) return exercise;
    return {
      ...exercise,
      sets: exercise.sets.filter((set) => set.id !== setId),
    };
  });
}

export function getPlanSetsForDate(exercise: WorkoutPlanExercise, dateKey: string) {
  return exercise.sets.filter((set) => set.dateKey === dateKey);
}

export function getPlanCompletionForDate(plan: WorkoutPlanExercise[], dateKey: string) {
  const targetSets = plan.reduce((sum, exercise) => sum + exercise.targetSets, 0);
  const completedSets = plan.reduce((sum, exercise) => sum + getPlanSetsForDate(exercise, dateKey).length, 0);
  return {
    targetSets,
    completedSets,
    percent: targetSets > 0 ? Math.min(100, (completedSets / targetSets) * 100) : 0,
  };
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampDecimal(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Number(value.toFixed(1))));
}
