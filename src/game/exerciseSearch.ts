import type { ExerciseCatalogEntry } from "../data/exerciseCatalog";

export type ExerciseSearchResult<T extends ExerciseSearchEntry = ExerciseSearchEntry> = {
  exercise: T;
  score: number;
  matchedTokens: string[];
};

export type ExerciseSearchEntry = Pick<
  ExerciseCatalogEntry,
  "id" | "name" | "category" | "equipment" | "primaryMuscles" | "difficulty"
>;

const SEARCH_ALIASES: Record<string, string[]> = {
  brzuch: ["core", "brzuszki", "abs", "stabilizacja"],
  core: ["brzuch", "brzuszki", "stabilizacja"],
  klata: ["klatka", "piersiowe", "chest"],
  klatka: ["klata", "piersiowe", "chest"],
  plecy: ["grzbiet", "back", "podciaganie", "podciag"],
  podciaganie: ["podciag", "plecy", "grzbiet"],
  nogi: ["uda", "posladki", "przysiady", "leg"],
  posladki: ["glute", "nogi", "hip"],
  barki: ["ramiona", "shoulder"],
  ramiona: ["barki", "triceps", "biceps"],
  bez: ["masa", "cialo", "bodyweight"],
  sprzetu: ["masa", "cialo", "bodyweight"],
  "bez-sprzetu": ["masa", "cialo", "bodyweight"],
  masa: ["bez", "sprzetu", "cialo", "bodyweight"],
  hantel: ["hantle", "dumbbell"],
  hantle: ["hantel", "dumbbell"],
  gumy: ["guma", "band"],
  latwe: ["poczatkujacy", "easy"],
  srednie: ["medium"],
  trudne: ["hard", "zaawansowane"],
  cardio: ["kondycja", "bieganie"],
  bieg: ["bieganie", "cardio", "kondycja"],
};

export function searchExercises<T extends ExerciseSearchEntry>(
  exercises: readonly T[],
  query: string,
  options: { limit?: number; includeZeroScore?: boolean } = {}
): ExerciseSearchResult<T>[] {
  const tokens = expandQueryTokens(tokenizeSearchText(query));
  const limit = options.limit ?? 30;

  if (tokens.length === 0) {
    return exercises.slice(0, limit).map((exercise) => ({ exercise, score: 1, matchedTokens: [] }));
  }

  return exercises
    .map((exercise) => scoreExercise(exercise, tokens))
    .filter((result) => options.includeZeroScore || result.score > 0)
    .sort((left, right) => right.score - left.score || left.exercise.name.localeCompare(right.exercise.name, "pl"))
    .slice(0, limit);
}

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenizeSearchText(value: string) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter(Boolean);
}

function expandQueryTokens(tokens: string[]) {
  const expanded = new Set<string>();
  for (const token of tokens) {
    expanded.add(token);
    for (const alias of SEARCH_ALIASES[token] || []) {
      for (const aliasToken of tokenizeSearchText(alias)) {
        expanded.add(aliasToken);
      }
    }
  }

  if (tokens.includes("bez") && tokens.includes("sprzetu")) {
    for (const token of SEARCH_ALIASES["bez-sprzetu"]) expanded.add(token);
  }

  return Array.from(expanded);
}

function scoreExercise<T extends ExerciseSearchEntry>(exercise: T, tokens: string[]): ExerciseSearchResult<T> {
  const name = normalizeSearchText(exercise.name);
  const category = normalizeSearchText(exercise.category);
  const equipment = normalizeSearchText(exercise.equipment);
  const muscles = exercise.primaryMuscles.map(normalizeSearchText);
  const difficulty = normalizeSearchText(exercise.difficulty || "");
  const haystack = [name, category, equipment, difficulty, ...muscles].join(" ");
  const matchedTokens: string[] = [];
  let score = 0;

  for (const token of tokens) {
    if (!token) continue;
    if (name === token) score += 120;
    else if (name.startsWith(token)) score += 70;
    else if (name.includes(token)) score += 45;

    if (category.includes(token)) score += 28;
    if (muscles.some((muscle) => muscle.includes(token))) score += 24;
    if (equipment.includes(token)) score += 18;
    if (difficulty.includes(token)) score += 10;

    if (haystack.includes(token)) {
      matchedTokens.push(token);
    } else {
      const fuzzy = getFuzzyTokenScore(token, haystack);
      if (fuzzy > 0) {
        score += fuzzy;
        matchedTokens.push(token);
      }
    }
  }

  const directQuery = tokens.join(" ");
  if (directQuery && name.includes(directQuery)) score += 65;
  if (matchedTokens.length >= Math.min(2, tokens.length)) score += matchedTokens.length * 6;

  return { exercise, score, matchedTokens: Array.from(new Set(matchedTokens)) };
}

function getFuzzyTokenScore(token: string, haystack: string) {
  if (token.length < 4) return 0;
  const words = haystack.split(/\s+/);
  if (words.some((word) => word.startsWith(token.slice(0, Math.max(3, token.length - 1))))) return 10;
  if (words.some((word) => levenshteinDistance(token, word) <= 1)) return 12;
  return 0;
}

function levenshteinDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1);

  for (let i = 0; i < left.length; i += 1) {
    current[0] = i + 1;
    for (let j = 0; j < right.length; j += 1) {
      const cost = left[i] === right[j] ? 0 : 1;
      current[j + 1] = Math.min(
        current[j] + 1,
        previous[j + 1] + 1,
        previous[j] + cost
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}
