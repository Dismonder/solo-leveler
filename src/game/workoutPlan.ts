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

export type WorkoutPlanPreset = {
  id: string;
  name: string;
  rank: string;
  tagline: string;
  description: string;
  icon: string;
  estimatedMinutes: number;
  exercises: Array<{
    catalogExerciseId: string;
    name: string;
    category: string;
    equipment: string;
    primaryMuscles: string[];
    targetSets: number;
    targetReps: number;
    defaultWeightKg: number;
    restSeconds: number;
    goal: string;
  }>;
};

export const HUNTER_WORKOUT_PRESETS: WorkoutPlanPreset[] = [
  {
    id: "preset_e_rank_reawakening",
    name: "Przebudzenie Rangi E",
    rank: "E-RANK",
    tagline: "Fundamenty Łowcy (Kalistenika / Full Body)",
    description: "Zbalansowany zestaw bazowy na start budowy parametrów fizycznych Łowcy. Bez sprzętu.",
    icon: "⚔️",
    estimatedMinutes: 20,
    exercises: [
      {
        catalogExerciseId: "pompki-klasyczne",
        name: "Pompki klasyczne",
        category: "Klatka piersiowa",
        equipment: "masa ciala",
        primaryMuscles: ["klatka piersiowa", "triceps", "barki"],
        targetSets: 3,
        targetReps: 10,
        defaultWeightKg: 0,
        restSeconds: 60,
        goal: "Siła pchania i stabilizacja",
      },
      {
        catalogExerciseId: "przysiady-klasyczne",
        name: "Przysiady klasyczne",
        category: "Nogi",
        equipment: "masa ciala",
        primaryMuscles: ["czworoglowy", "posladki"],
        targetSets: 3,
        targetReps: 15,
        defaultWeightKg: 0,
        restSeconds: 60,
        goal: "Moc nóg i stabilność bioder",
      },
      {
        catalogExerciseId: "brzuszki-klasyczne",
        name: "Brzuszki klasyczne",
        category: "Brzuch i core",
        equipment: "masa ciala",
        primaryMuscles: ["prosty brzucha"],
        targetSets: 3,
        targetReps: 15,
        defaultWeightKg: 0,
        restSeconds: 45,
        goal: "Wzmocnienie gorsetu mięśniowego",
      },
      {
        catalogExerciseId: "deska-klasyczna",
        name: "Deska klasyczna (Plank)",
        category: "Brzuch i core",
        equipment: "masa ciala",
        primaryMuscles: ["core", "poprzeczny brzucha"],
        targetSets: 3,
        targetReps: 30,
        defaultWeightKg: 0,
        restSeconds: 45,
        goal: "Maksymalna stabilizacja antywyprostna",
      },
      {
        catalogExerciseId: "pajacyki",
        name: "Pajacyki (Jumping Jacks)",
        category: "Kondycja",
        equipment: "masa ciala",
        primaryMuscles: ["lydki", "kondycja"],
        targetSets: 3,
        targetReps: 25,
        defaultWeightKg: 0,
        restSeconds: 45,
        goal: "Podbicie wydolności tlenowej i spalanie",
      },
    ],
  },
  {
    id: "preset_shadow_monarch_chest_arms",
    name: "Siła Monarchy Cieni",
    rank: "S-RANK",
    tagline: "Klatka Piersiowa & Ramiona (Masa i Siła)",
    description: "Ukierunkowany trening hipertroficzny na rozbudowę potężnej klatki, barków i ramion.",
    icon: "👑",
    estimatedMinutes: 30,
    exercises: [
      {
        catalogExerciseId: "wyciskanie-sztangi-lezac",
        name: "Wyciskanie sztangi leżąc",
        category: "Klatka piersiowa",
        equipment: "sztanga",
        primaryMuscles: ["klatka piersiowa", "triceps"],
        targetSets: 4,
        targetReps: 8,
        defaultWeightKg: 40,
        restSeconds: 90,
        goal: "Główny bodziec siłowy klatki",
      },
      {
        catalogExerciseId: "pompki-diamentowe",
        name: "Pompki diamentowe",
        category: "Klatka piersiowa",
        equipment: "masa ciala",
        primaryMuscles: ["triceps", "klatka piersiowa"],
        targetSets: 3,
        targetReps: 10,
        defaultWeightKg: 0,
        restSeconds: 60,
        goal: "Koncentracja na głowie bocznej tricepsa",
      },
      {
        catalogExerciseId: "wznosy-hantli-bokiem",
        name: "Wznosy hantli bokiem",
        category: "Barki",
        equipment: "hantle",
        primaryMuscles: ["boczny akton barku"],
        targetSets: 4,
        targetReps: 12,
        defaultWeightKg: 6,
        restSeconds: 60,
        goal: "Szerokość sylwetki i kuliste barki",
      },
      {
        catalogExerciseId: "uginanie-przedramion-z-hantlami-z-supinacja",
        name: "Uginanie przedramion z hantlami",
        category: "Ramiona",
        equipment: "hantle",
        primaryMuscles: ["dwuglowy ramienia"],
        targetSets: 3,
        targetReps: 12,
        defaultWeightKg: 8,
        restSeconds: 60,
        goal: "Maksymalny szczyt bicepsa",
      },
    ],
  },
  {
    id: "preset_shadow_assassin_core",
    name: "Cień Zabójcy - Core & Speed",
    rank: "A-RANK",
    tagline: "Żelazny Brzuch, Zwinność & Mobilność",
    description: "Dynamiczny zestaw wzmacniający skosy, rotatory i dolną część brzucha dla zwinności Łowcy.",
    icon: "⚡",
    estimatedMinutes: 20,
    exercises: [
      {
        catalogExerciseId: "russian-twist",
        name: "Russian twist",
        category: "Brzuch i core",
        equipment: "masa ciala",
        primaryMuscles: ["skosne brzucha", "core"],
        targetSets: 3,
        targetReps: 20,
        defaultWeightKg: 0,
        restSeconds: 45,
        goal: "Dynamika rotacyjna tułowia",
      },
      {
        catalogExerciseId: "wznosy-nog-w-zwisie",
        name: "Wznosy nóg w leżeniu / zwisie",
        category: "Brzuch i core",
        equipment: "masa ciala",
        primaryMuscles: ["dolny brzuch", "biodra"],
        targetSets: 3,
        targetReps: 12,
        defaultWeightKg: 0,
        restSeconds: 60,
        goal: "Mocny dolny rejon mięśni prostych",
      },
      {
        catalogExerciseId: "mountain-climbers",
        name: "Mountain climbers",
        category: "Kondycja",
        equipment: "masa ciala",
        primaryMuscles: ["core", "kondycja"],
        targetSets: 3,
        targetReps: 25,
        defaultWeightKg: 0,
        restSeconds: 45,
        goal: "Eksplozywna stabilizacja w podporze",
      },
      {
        catalogExerciseId: "dead-bug",
        name: "Dead bug",
        category: "Brzuch i core",
        equipment: "mata",
        primaryMuscles: ["core", "koordynacja"],
        targetSets: 3,
        targetReps: 12,
        defaultWeightKg: 0,
        restSeconds: 45,
        goal: "Precyzyjna kontrola lędźwi i miednicy",
      },
    ],
  },
  {
    id: "preset_dungeon_overlord_back_legs",
    name: "Władca Podziemi - Plecy & Nogi",
    rank: "S-RANK",
    tagline: "Ciężka Siła Pleców, Martwy Ciąg & Nogi",
    description: "Najcięższe ćwiczenia wielostawowe budujące brutalną siłę i gęstość mięśniową.",
    icon: "🔥",
    estimatedMinutes: 35,
    exercises: [
      {
        catalogExerciseId: "martwy-ciag-klasyczny",
        name: "Martwy ciąg klasyczny",
        category: "Plecy",
        equipment: "sztanga",
        primaryMuscles: ["prostowniki", "posladki", "dwuglowe"],
        targetSets: 4,
        targetReps: 6,
        defaultWeightKg: 60,
        restSeconds: 120,
        goal: "Maksymalna siła łańcucha tylnego",
      },
      {
        catalogExerciseId: "podciaganie-nachwytem",
        name: "Podciąganie nachwytem",
        category: "Plecy",
        equipment: "drazek",
        primaryMuscles: ["najszerszy grzbietu", "biceps"],
        targetSets: 4,
        targetReps: 8,
        defaultWeightKg: 0,
        restSeconds: 90,
        goal: "Szerokość grzbietu i moc chwytu",
      },
      {
        catalogExerciseId: "przysiad-ze-sztanga-na-plecach",
        name: "Przysiad ze sztangą na plecach",
        category: "Nogi",
        equipment: "sztanga",
        primaryMuscles: ["czworoglowy", "posladki"],
        targetSets: 4,
        targetReps: 8,
        defaultWeightKg: 50,
        restSeconds: 120,
        goal: "Filary nośne i potężne nogi",
      },
      {
        catalogExerciseId: "wioslowanie-sztanga",
        name: "Wiosłowanie sztangą w opadzie",
        category: "Plecy",
        equipment: "sztanga",
        primaryMuscles: ["srodek plecow", "najszerszy"],
        targetSets: 3,
        targetReps: 10,
        defaultWeightKg: 40,
        restSeconds: 90,
        goal: "Grubość mięśni grzbietu i stabilność",
      },
    ],
  },
];

export function createPlanFromPreset(preset: WorkoutPlanPreset, now = new Date()): WorkoutPlanExercise[] {
  return preset.exercises.map((item, index) => ({
    id: `plan_${now.getTime()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
    catalogExerciseId: item.catalogExerciseId,
    name: item.name,
    category: item.category,
    equipment: item.equipment,
    primaryMuscles: [...item.primaryMuscles],
    goal: item.goal,
    targetArea: item.primaryMuscles.slice(0, 3).join(", ") || item.category,
    targetSets: item.targetSets,
    targetReps: item.targetReps,
    defaultWeightKg: item.defaultWeightKg,
    restSeconds: item.restSeconds,
    notes: "",
    sets: [],
    createdAt: now.toISOString(),
    lastCompletedAt: null,
  }));
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampDecimal(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Number(value.toFixed(1))));
}
