import test from "node:test";
import assert from "node:assert/strict";
import { searchExercises, normalizeSearchText } from "./exerciseSearch";
import type { ExerciseCatalogEntry } from "../data/exerciseCatalog";

function exercise(overrides: Partial<ExerciseCatalogEntry>): ExerciseCatalogEntry {
  return {
    id: overrides.id || "exercise",
    name: overrides.name || "Ćwiczenie",
    category: overrides.category || "Klatka piersiowa",
    primaryMuscles: overrides.primaryMuscles || ["klatka piersiowa"],
    equipment: overrides.equipment || "masa ciala",
    difficulty: overrides.difficulty || "latwe",
    steps: [],
    techniqueCues: [],
    commonMistakes: [],
    safetyNotes: [],
    media: [],
    sourceUrls: [],
  };
}

const catalog = [
  exercise({ id: "pushup", name: "Pompki klasyczne", category: "Klatka piersiowa", primaryMuscles: ["klatka piersiowa", "triceps"], equipment: "masa ciala" }),
  exercise({ id: "plank", name: "Plank", category: "Brzuch i core", primaryMuscles: ["core"], equipment: "masa ciala" }),
  exercise({ id: "row", name: "Wiosłowanie hantlami", category: "Plecy", primaryMuscles: ["plecy"], equipment: "hantle" }),
];

test("exercise search normalizes polish characters and punctuation", () => {
  assert.equal(normalizeSearchText("Bez sprzętu: klatka"), "bez sprzetu klatka");
});

test("exercise search finds aliases and body-part shortcuts", () => {
  const chest = searchExercises(catalog, "klata", { limit: 1 });
  const bodyweight = searchExercises(catalog, "bez sprzetu", { limit: 2 });
  const core = searchExercises(catalog, "brzuch", { limit: 1 });

  assert.equal(chest[0].exercise.id, "pushup");
  assert.equal(bodyweight.some((result) => result.exercise.id === "pushup"), true);
  assert.equal(bodyweight.some((result) => result.exercise.id === "plank"), true);
  assert.equal(core[0].exercise.id, "plank");
});

test("exercise search tolerates short typos without moving bad matches first", () => {
  const results = searchExercises(catalog, "pomki", { limit: 2 });

  assert.equal(results[0].exercise.id, "pushup");
  assert.equal(results[0].score > 0, true);
  if (results[1]) {
    assert.equal(results[0].score > results[1].score, true);
  }
});
