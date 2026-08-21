import React, { useDeferredValue, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crown,
  Dumbbell,
  Filter,
  Flame,
  Layers,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  Weight,
  X,
  Zap,
} from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EXERCISE_CATALOG, type ExerciseCatalogEntry } from "../data/exerciseCatalog";
import {
  HUNTER_WORKOUT_PRESETS,
  addCatalogExerciseToPlan,
  addSetToPlanExercise,
  createPlanFromPreset,
  getPlanCompletionForDate,
  getPlanSetsForDate,
  movePlanExercise,
  removePlanExercise,
  removePlanSet,
  updatePlanExercise,
  type WorkoutPlanPreset,
} from "../game/workoutPlan";
import {
  computeVolumeHistory,
  computeMuscleGroupDistribution,
  computeHunterPersonalRecords,
  formatDetailedSessions,
  type VolumeMetricType,
} from "../game/workoutHistoryAnalytics";
import { getLocalDateKey } from "../game/playerMath";
import { searchExercises } from "../game/exerciseSearch";
import type { WorkoutEntry, WorkoutPlanExercise, WorkoutPlanSession, WorkoutPlanSessionSummary } from "../types";

type HistoryRange = "7d" | "30d" | "all";
type PlanPanelMode = "plan" | "history";

const CATEGORY_FILTERS = [
  "Wszystkie",
  "Klatka piersiowa",
  "Plecy",
  "Nogi",
  "Barki",
  "Ramiona",
  "Brzuch i core",
  "Kondycja",
  "Funkcjonalne",
] as const;

type WorkoutPlanPanelProps = {
  plan: WorkoutPlanExercise[];
  sessions: WorkoutPlanSessionSummary[];
  workoutHistory: WorkoutEntry[];
  activeSession: WorkoutPlanSession | null;
  onChange: (plan: WorkoutPlanExercise[]) => void;
  onStartSession: () => void;
};

export function WorkoutPlanPanel({
  plan,
  sessions,
  workoutHistory,
  activeSession,
  onChange,
  onStartSession,
}: WorkoutPlanPanelProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedCategory, setSelectedCategory] = useState<string>("Wszystkie");
  const [showPresets, setShowPresets] = useState(false);
  const [historyRange, setHistoryRange] = useState<HistoryRange>("7d");
  const [mode, setMode] = useState<PlanPanelMode>("plan");
  const [startError, setStartError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const todayKey = getLocalDateKey();

  const completion = getPlanCompletionForDate(plan, todayKey);
  const plannedIds = new Set(plan.map((exercise) => exercise.catalogExerciseId));

  const filteredCatalog = useMemo(() => {
    if (selectedCategory === "Wszystkie") return EXERCISE_CATALOG;
    return EXERCISE_CATALOG.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const searchResults = useMemo(
    () => searchExercises(filteredCatalog, deferredQuery, { limit: deferredQuery.trim() ? 10 : 6 }),
    [filteredCatalog, deferredQuery]
  );

  const estimatedMinutes = useMemo(() => {
    if (plan.length === 0) return 0;
    const totalSeconds = plan.reduce(
      (sum, ex) => sum + ex.targetSets * (ex.targetReps * 3 + ex.restSeconds),
      0
    );
    return Math.max(1, Math.round(totalSeconds / 60));
  }, [plan]);

  const targetedMuscles = useMemo(() => {
    const muscles = new Set<string>();
    plan.forEach((ex) => (ex.primaryMuscles || []).forEach((m) => muscles.add(m)));
    return Array.from(muscles).slice(0, 6);
  }, [plan]);

  const addExercise = (exercise: ExerciseCatalogEntry) => {
    onChange(addCatalogExerciseToPlan(plan, exercise));
    setStartError(null);
  };

  const handleApplyPreset = (preset: WorkoutPlanPreset) => {
    onChange(createPlanFromPreset(preset));
    setShowPresets(false);
    setStartError(null);
  };

  const handleStartSession = () => {
    if (plan.length === 0 && !activeSession) {
      setStartError("Dodaj pierwsze ćwiczenie lub wybierz gotowy plan Łowcy, aby uruchomić trening.");
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onStartSession();
  };

  return (
    <div className="space-y-3">
      <div className="sl-input grid grid-cols-2 gap-2 rounded-[20px] p-1.5">
        {([
          ["plan", "Plan"],
          ["history", "Historia"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={[
              "min-h-11 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-[0.98]",
              mode === id
                ? "sl-chip-active shadow-[0_0_20px_color-mix(in_srgb,var(--theme-accent)_16%,transparent)]"
                : "sl-chip",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "history" ? (
        <WorkoutHistoryPanel
          plan={plan}
          sessions={sessions}
          workoutHistory={workoutHistory}
          range={historyRange}
          onRangeChange={setHistoryRange}
        />
      ) : (
        <>
          <div className="sl-card rounded-[24px] p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-accent)]">
                  System Treningowy
                </p>
                <h3 className="mt-1 text-lg font-black uppercase tracking-[0.06em] text-[var(--theme-text)]">
                  Plan Łowcy
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--theme-muted)]">
                  Ułóż kolejność, serie i przerwy lub wczytaj gotowy szablon treningowy.
                </p>
              </div>
              <Dumbbell className="h-6 w-6 text-[var(--theme-icon)]" />
            </div>

            {/* Main Action Bar */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
              <button
                type="button"
                onClick={handleStartSession}
                className="sl-button-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black uppercase tracking-widest active:scale-[0.98]"
              >
                <Play className="h-4 w-4" />
                {activeSession ? "Wznów aktywny plan" : "Uruchom plan treningu"}
              </button>

              <button
                type="button"
                onClick={() => setShowPresets(true)}
                className="sl-button-secondary flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black uppercase tracking-wider active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Gotowe Plany ({HUNTER_WORKOUT_PRESETS.length})</span>
              </button>
            </div>

            {/* Muscle Category Filters */}
            <div className="mt-4">
              <p className="sl-kicker text-[9px] font-black uppercase tracking-widest text-[var(--theme-muted)] mb-2">
                Filtruj wg Partii Mięśniowej:
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {CATEGORY_FILTERS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={[
                      "shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all",
                      selectedCategory === cat
                        ? "sl-chip-active shadow-[0_0_12px_color-mix(in_srgb,var(--theme-accent)_25%,transparent)]"
                        : "sl-chip text-[var(--theme-muted)] hover:text-[var(--theme-text)]",
                    ].join(" ")}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="mt-3 grid gap-2">
              <label className="sl-input flex min-h-12 items-center gap-2 rounded-2xl px-3">
                <Search className="h-4 w-4 text-[var(--theme-muted)]" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Szukaj: wyciskanie, pompki, brzuch, hantle..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-muted)]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="p-1 text-[var(--theme-muted)] hover:text-[var(--theme-text)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>

              {startError && (
                <div className="sl-alert-warning rounded-2xl px-3 py-2 text-xs font-bold text-[var(--theme-warning-text)]">
                  {startError}
                </div>
              )}

              {/* Quick Results Grid */}
              <div className="grid max-w-full gap-1.5 overflow-hidden">
                {searchResults.map(({ exercise }) => {
                  const planned = plannedIds.has(exercise.id);
                  return (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => !planned && addExercise(exercise)}
                      disabled={planned}
                      className="sl-input grid min-h-12 w-full max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-left active:scale-[0.99] disabled:opacity-75"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-black text-[var(--theme-text-strong)]">
                          {exercise.name}
                        </span>
                        <span className="sl-muted mt-0.5 block truncate text-[9px] font-black uppercase tracking-widest">
                          {exercise.category} · {exercise.equipment}
                        </span>
                      </span>
                      <span
                        className={
                          planned
                            ? "sl-chip rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest"
                            : "sl-button-primary shrink-0 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest"
                        }
                      >
                        {planned ? "W planie" : "+ Dodaj"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan Metrics Overview */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <PlanStat label="Ćwiczenia" value={plan.length} />
              <PlanStat label="Czas sesji" value={`~${estimatedMinutes}m`} />
              <PlanStat
                label="Serie dziś"
                value={`${completion.completedSets}/${completion.targetSets}`}
              />
              <PlanStat label="Postęp" value={`${Math.floor(completion.percent)}%`} />
            </div>

            {targetedMuscles.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--theme-border)]/40">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-muted)] mr-1">
                  Partie:
                </span>
                {targetedMuscles.map((m) => (
                  <span
                    key={m}
                    className="rounded-lg bg-[var(--theme-accent-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[var(--theme-accent)]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Presets Modal */}
          <AnimatePresence>
            {showPresets && (
              <motion.div
                className="sl-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="sl-modal w-full max-w-md max-h-[85vh] overflow-y-auto rounded-[26px] border p-4 sm:p-5 shadow-2xl custom-scrollbar"
                  initial={{ scale: 0.94, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.94, y: 15 }}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-3">
                    <div>
                      <span className="sl-kicker text-[9px] font-black uppercase tracking-widest text-amber-400">
                        Gotowe Szablony
                      </span>
                      <h3 className="text-lg font-black uppercase tracking-wide text-[var(--theme-text-strong)]">
                        Wybierz Plan Łowcy
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPresets(false)}
                      className="sl-icon-button flex h-9 w-9 items-center justify-center rounded-xl"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {HUNTER_WORKOUT_PRESETS.map((preset) => (
                      <motion.div
                        key={preset.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="sl-input flex flex-col justify-between rounded-2xl p-3.5 transition-all hover:border-[var(--theme-accent)]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{preset.icon}</span>
                              <span className="font-black text-sm text-[var(--theme-text-strong)] uppercase">
                                {preset.name}
                              </span>
                              <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-black text-amber-400">
                                {preset.rank}
                              </span>
                            </div>
                            <p className="sl-kicker mt-1 text-[9px] font-bold text-[var(--theme-accent)]">
                              {preset.tagline}
                            </p>
                            <p className="sl-muted mt-1 text-xs leading-relaxed">
                              {preset.description}
                            </p>
                            <p className="sl-muted mt-1 text-[10px] font-bold">
                              ⏱️ ~{preset.estimatedMinutes} min · {preset.exercises.length} ćwiczenia
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="sl-button-primary mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider active:scale-[0.98]"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Załaduj ten plan</span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Exercise List */}
          {plan.length === 0 ? (
            <div className="sl-input rounded-[22px] p-6 text-center shadow-lg">
              <Dumbbell className="mx-auto h-8 w-8 text-[var(--theme-icon)] mb-2" />
              <p className="text-sm font-bold text-[var(--theme-text)]">Twój plan jest pusty.</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--theme-muted)]">
                Wybierz gotowy szablon Łowcy powyżej lub dodaj ćwiczenia z wyszukiwarki.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-muted)]">
                  Ćwiczenia w planie ({plan.length})
                </span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-danger-text)] hover:underline"
                >
                  Wyczyść plan
                </button>
              </div>

              <AnimatePresence mode="popLayout">
                {plan.map((exercise, index) => (
                  <motion.div
                    key={exercise.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PlanExerciseCard
                      exercise={exercise}
                      index={index}
                      canMoveUp={index > 0}
                      canMoveDown={index < plan.length - 1}
                      todayKey={todayKey}
                      onMoveUp={() => onChange(movePlanExercise(plan, exercise.id, -1))}
                      onMoveDown={() => onChange(movePlanExercise(plan, exercise.id, 1))}
                      onUpdate={(update) =>
                        onChange(updatePlanExercise(plan, exercise.id, update))
                      }
                      onAddSet={() =>
                        onChange(
                          addSetToPlanExercise(plan, exercise.id, {
                            reps: exercise.targetReps,
                            weightKg: exercise.defaultWeightKg,
                            dateKey: todayKey,
                          })
                        )
                      }
                      onRemoveSet={(setId) =>
                        onChange(removePlanSet(plan, exercise.id, setId))
                      }
                      onRemove={() => onChange(removePlanExercise(plan, exercise.id))}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function addExerciseEntryToPlan(plan: WorkoutPlanExercise[], exercise: ExerciseCatalogEntry) {
  return addCatalogExerciseToPlan(plan, exercise);
}

type PlanExerciseCardProps = {
  exercise: WorkoutPlanExercise;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  todayKey: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (update: Parameters<typeof updatePlanExercise>[2]) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onRemove: () => void;
};

const PlanExerciseCard: React.FC<PlanExerciseCardProps> = ({
  exercise,
  index,
  canMoveUp,
  canMoveDown,
  todayKey,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onAddSet,
  onRemoveSet,
  onRemove,
}) => {
  const todaySets = getPlanSetsForDate(exercise, todayKey);
  const progress = exercise.targetSets > 0 ? Math.min(100, (todaySets.length / exercise.targetSets) * 100) : 0;

  return (
    <article className="sl-card w-full max-w-full overflow-hidden rounded-[22px] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-accent)]">
            {index + 1}. {exercise.category}
          </p>
          <h3 className="mt-1 line-clamp-2 break-words text-lg font-black uppercase tracking-[0.04em] text-[var(--theme-text)]">{exercise.name}</h3>
          <p className="mt-1 truncate text-xs font-bold text-[var(--theme-muted)]">{exercise.equipment}</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 self-stretch sm:self-start">
          <IconButton onClick={onMoveUp} disabled={!canMoveUp} label="Przesuń wyżej">
            <ArrowUp className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={onMoveDown} disabled={!canMoveDown} label="Przesuń niżej">
            <ArrowDown className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={onRemove} danger label="Usuń ćwiczenie z planu">
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
        {exercise.primaryMuscles.slice(0, 3).map((muscle) => (
          <span key={muscle} className="sl-chip rounded-full px-2.5 py-1">
            {muscle}
          </span>
        ))}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: "var(--theme-progress-track)" }}>
        <div className="h-full rounded-full bg-[var(--theme-progress-fill)] shadow-[0_0_18px_color-mix(in_srgb,var(--theme-accent)_45%,transparent)]" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <NumberField label="Serie" value={exercise.targetSets} min={1} max={20} onChange={(value) => onUpdate({ targetSets: value })} />
        <NumberField label="Powt." value={exercise.targetReps} min={1} max={200} onChange={(value) => onUpdate({ targetReps: value })} />
        <NumberField label="Kg" value={exercise.defaultWeightKg} min={0} max={500} step={0.5} icon={<Weight className="h-3.5 w-3.5" />} onChange={(value) => onUpdate({ defaultWeightKg: value })} />
        <NumberField label="Przerwa s" value={exercise.restSeconds} min={0} max={600} step={15} icon={<Timer className="h-3.5 w-3.5" />} onChange={(value) => onUpdate({ restSeconds: value })} />
      </div>

      <div className="mt-3 grid gap-2">
        <TextField
          label="Cel ćwiczenia"
          value={exercise.goal}
          placeholder="Siła, technika, hipertrofia..."
          onChange={(value) => onUpdate({ goal: value })}
        />
        <TextField
          label="Na co działa"
          value={exercise.targetArea}
          placeholder="Klatka, triceps, stabilizacja..."
          onChange={(value) => onUpdate({ targetArea: value })}
        />
      </div>

      <label className="sl-input mt-3 block rounded-2xl p-3">
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-muted)]">Notatka</span>
        <textarea
          value={exercise.notes}
          onChange={(event) => onUpdate({ notes: event.target.value })}
          placeholder="Tempo, wariant, wskazówka techniczna..."
          className="mt-2 min-h-16 w-full resize-none bg-transparent text-sm text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-muted)]"
        />
      </label>

      <button
        type="button"
        onClick={onAddSet}
        className="sl-button-primary mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black uppercase tracking-widest active:scale-[0.98]"
      >
        <CheckCircle2 className="h-4 w-4" />
        Dodaj serię {exercise.targetReps} powt.
      </button>

      {todaySets.length > 0 && (
        <div className="mt-3 space-y-2">
          {todaySets.map((set, setIndex) => (
            <div key={set.id} className="sl-input flex min-h-11 items-center justify-between gap-2 rounded-xl px-3">
              <span className="text-xs font-black uppercase tracking-widest text-[var(--theme-text)]">
                Seria {setIndex + 1}: {set.reps} powt. {set.weightKg > 0 ? `· ${set.weightKg} kg` : ""}
              </span>
              <button
                type="button"
                onClick={() => onRemoveSet(set.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--theme-muted)] active:scale-[0.96]"
                aria-label="Usuń serię"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

function WorkoutHistoryPanel({
  plan,
  sessions,
  workoutHistory,
  range,
  onRangeChange,
}: {
  plan: WorkoutPlanExercise[];
  sessions: WorkoutPlanSessionSummary[];
  workoutHistory: WorkoutEntry[];
  range: HistoryRange;
  onRangeChange: (range: HistoryRange) => void;
}) {
  const [activeMetric, setActiveMetric] = useState<"volume" | "time" | "sets" | "xp">("volume");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const historyModel = useMemo(
    () => buildUnifiedTrainingHistory(sessions, workoutHistory, readTrainingHistoryArchive()),
    [sessions, workoutHistory]
  );
  const filteredDays = useMemo(
    () => filterHistoryDaysByRange(historyModel.days, range),
    [historyModel.days, range]
  );
  const filteredEvents = useMemo(
    () => filterHistoryEventsByRange(historyModel.events, range),
    [historyModel.events, range]
  );
  const chartData = useMemo(() => buildUnifiedHistoryChart(filteredDays), [filteredDays]);
  const totals = useMemo(() => getUnifiedHistoryTotals(filteredDays), [filteredDays]);
  const currentPlanSignature = useMemo(() => createPlanSignatureFromPlan(plan), [plan]);
  const bestTimeForPlan = useMemo(
    () => getBestTimeForPlan(sessions, currentPlanSignature),
    [sessions, currentPlanSignature]
  );

  const hunterRecords = useMemo(
    () => computeHunterPersonalRecords(sessions, historyModel.days, historyModel.events),
    [sessions, historyModel.days, historyModel.events]
  );

  const muscleDistribution = useMemo(
    () => computeMuscleGroupDistribution(sessions, EXERCISE_CATALOG),
    [sessions]
  );

  const detailedSessions = useMemo(
    () => formatDetailedSessions(sessions),
    [sessions]
  );

  const hasHistory = filteredDays.length > 0 || filteredEvents.length > 0 || detailedSessions.length > 0;

  return (
    <section className="sl-card space-y-5 rounded-[24px] p-4 sm:p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-accent)]">
              Analityka Monarchy
            </span>
            <span className="rounded-md bg-[var(--theme-accent-soft)] px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-[var(--theme-accent)]">
              PRO
            </span>
          </div>
          <h3 className="mt-1 text-xl font-black uppercase tracking-[0.06em] text-[var(--theme-text-strong)]">
            Statystyki & Historia Treningu
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--theme-muted)]">
            Tonaż, tempo, rozkład partii mięśniowych, rekordy PR i pełny dziennik sesji.
          </p>
        </div>
        <BarChart3 className="h-7 w-7 shrink-0 text-[var(--theme-accent)]" />
      </div>

      {/* Range Selector */}
      <div className="sl-input grid grid-cols-3 gap-2 rounded-2xl p-1.5">
        <RangeButton active={range === "7d"} onClick={() => onRangeChange("7d")} label="7 dni" />
        <RangeButton active={range === "30d"} onClick={() => onRangeChange("30d")} label="30 dni" />
        <RangeButton active={range === "all"} onClick={() => onRangeChange("all")} label="Całość" />
      </div>

      {!hasHistory ? (
        <div className="sl-input rounded-2xl p-6 text-center">
          <Trophy className="mx-auto h-8 w-8 text-[var(--theme-icon)] mb-2" />
          <p className="text-sm font-bold text-[var(--theme-text)]">Brak zarejestrowanych sesji.</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--theme-muted)]">
            Uruchom plan treningu lub wykonaj zadanie dzienne, aby odblokować zaawansowane statystyki i rekordy Łowcy.
          </p>
        </div>
      ) : (
        <>
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <PlanStat label="Dni aktywne" value={filteredDays.length} />
            <PlanStat label="Sesje planu" value={`${totals.planSessions} sesji`} />
            <PlanStat label="Czas aktywny" value={formatDuration(totals.seconds)} />
            <PlanStat label="Tonaż łączny" value={`${totals.volumeKg.toLocaleString("pl-PL")} kg`} />
            <PlanStat label="Serie ukończone" value={totals.sets} />
            <PlanStat label="Daily misje" value={`${totals.dailyCompleted}/${filteredDays.length}`} />
            <PlanStat label="Zdobyte XP" value={`+${totals.xp}`} />
            <PlanStat label="Rekord planu" value={bestTimeForPlan ? formatDuration(bestTimeForPlan) : "--"} />
          </div>

          {/* Hunter Personal Records (PRs) */}
          {hunterRecords.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em] text-amber-400 flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5" />
                  Osobiste Rekordy Łowcy (PR)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {hunterRecords.map((pr) => (
                  <motion.div
                    key={pr.id}
                    whileHover={{ scale: 1.01 }}
                    className="sl-input relative overflow-hidden rounded-2xl border border-[var(--theme-border)]/70 p-3 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--theme-accent)]">
                          {pr.title}
                        </span>
                        <p className="mt-0.5 text-lg font-black text-[var(--theme-text-strong)] font-mono">
                          {pr.value}
                        </p>
                        <p className="mt-0.5 text-[10px] font-medium text-[var(--theme-muted)]">
                          {pr.subtitle}
                        </p>
                      </div>
                      <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-amber-400">
                        {pr.badge}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Muscle Group Distribution */}
          {muscleDistribution.length > 0 && (
            <div className="sl-input space-y-3 rounded-2xl p-3.5 border border-[var(--theme-border)]/60">
              <div className="flex items-center justify-between">
                <span className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-accent)] flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Balans Partii Mięśniowych
                </span>
                <span className="text-[10px] font-bold text-[var(--theme-muted)]">
                  Łącznie: {muscleDistribution.reduce((acc, m) => acc + m.sets, 0)} serii
                </span>
              </div>

              {/* Segmented Multi-Color Progress Bar */}
              <div className="h-3.5 flex w-full overflow-hidden rounded-full bg-[var(--theme-game-bg)] p-0.5 gap-0.5">
                {muscleDistribution.map((item, idx) => {
                  const colors = [
                    "bg-cyan-500",
                    "bg-blue-500",
                    "bg-indigo-500",
                    "bg-violet-500",
                    "bg-purple-500",
                    "bg-emerald-500",
                  ];
                  const color = colors[idx % colors.length];
                  if (item.percentage <= 0) return null;
                  return (
                    <div
                      key={item.category}
                      style={{ width: `${item.percentage}%` }}
                      className={`h-full rounded-sm ${color} transition-all`}
                      title={`${item.category}: ${item.sets} serii (${item.percentage}%)`}
                    />
                  );
                })}
              </div>

              {/* Muscle Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {muscleDistribution.map((item, idx) => {
                  const dotColors = [
                    "bg-cyan-400",
                    "bg-blue-400",
                    "bg-indigo-400",
                    "bg-violet-400",
                    "bg-purple-400",
                    "bg-emerald-400",
                  ];
                  const dotColor = dotColors[idx % dotColors.length];
                  return (
                    <div
                      key={item.category}
                      className="flex items-center justify-between rounded-xl bg-black/20 px-2.5 py-1.5 text-xs"
                    >
                      <span className="flex items-center gap-1.5 truncate text-[11px] font-bold text-[var(--theme-text)]">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                        <span className="truncate">{item.category}</span>
                      </span>
                      <span className="ml-2 shrink-0 font-mono text-[10px] font-black text-[var(--theme-accent)]">
                        {item.sets}s ({item.percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Chart with Metric Switcher */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-accent)] flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Wykres Progresu
              </span>

              {/* Metric Buttons */}
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setActiveMetric("volume")}
                  className={`rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeMetric === "volume"
                      ? "sl-chip-active shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "sl-chip text-[var(--theme-muted)]"
                  }`}
                >
                  🏋️ Tonaż (kg)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric("time")}
                  className={`rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeMetric === "time"
                      ? "sl-chip-active shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "sl-chip text-[var(--theme-muted)]"
                  }`}
                >
                  ⏱️ Czas (min)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric("sets")}
                  className={`rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeMetric === "sets"
                      ? "sl-chip-active shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "sl-chip text-[var(--theme-muted)]"
                  }`}
                >
                  🔢 Serie
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric("xp")}
                  className={`rounded-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeMetric === "xp"
                      ? "sl-chip-active shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "sl-chip text-[var(--theme-muted)]"
                  }`}
                >
                  ⚡ XP
                </button>
              </div>
            </div>

            <div className="sl-input h-60 rounded-2xl p-2 border border-[var(--theme-border)]/60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 8, left: -28, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--theme-muted)", fontSize: 10, fontWeight: 800 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "color-mix(in srgb, var(--theme-accent) 10%, transparent)" }}
                    contentStyle={{
                      background: "var(--theme-modal)",
                      border: "1px solid var(--theme-border)",
                      borderRadius: 14,
                      color: "var(--theme-text)",
                    }}
                    labelStyle={{ color: "var(--theme-text-strong)", fontWeight: 900 }}
                  />
                  {activeMetric === "volume" && (
                    <Bar dataKey="dailyPercent" name="Daily %" fill="var(--theme-accent)" radius={[6, 6, 0, 0]} />
                  )}
                  {activeMetric === "time" && (
                    <Bar dataKey="minutes" name="Minuty" fill="var(--theme-progress-fill)" radius={[6, 6, 0, 0]} />
                  )}
                  {activeMetric === "sets" && (
                    <Bar dataKey="sets" name="Serie" fill="var(--theme-success)" radius={[6, 6, 0, 0]} />
                  )}
                  {activeMetric === "xp" && (
                    <Bar dataKey="xp" name="XP" fill="var(--theme-warning)" radius={[6, 6, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Workout Sessions List */}
          {detailedSessions.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-accent)] flex items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Dziennik Sesji Treningowych ({detailedSessions.length})
                </span>
              </div>

              <div className="space-y-2.5">
                {detailedSessions.slice(0, 10).map((session) => {
                  const isExpanded = expandedSessionId === session.id;
                  return (
                    <motion.div
                      key={session.id}
                      className="sl-input overflow-hidden rounded-2xl border border-[var(--theme-border)]/80 transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                        className="flex w-full items-center justify-between p-3.5 text-left active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] font-black">
                            <Dumbbell className="h-5 w-5" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-[var(--theme-text-strong)]">
                                {session.title}
                              </h4>
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                                  session.paceGrade === "BŁYSKAWICZNE"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : session.paceGrade === "SPOKOJNE"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-emerald-500/20 text-emerald-400"
                                }`}
                              >
                                {session.paceGrade}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[10px] font-medium text-[var(--theme-muted)]">
                              {session.date} ({session.timeAgo}) · ⏱️ {session.durationFormatted} · {session.totalSets} serii
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <span className="block font-mono text-xs font-black text-[var(--theme-text-strong)]">
                              {session.totalVolumeKg > 0 ? `${session.totalVolumeKg} kg` : "Masa ciała"}
                            </span>
                            <span className="block text-[9px] font-bold text-amber-400">
                              +{session.xpEarned} XP
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-[var(--theme-muted)]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[var(--theme-muted)]" />
                          )}
                        </div>
                      </button>

                      {/* Expandable Exercise Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-[var(--theme-border)]/50 bg-black/20 p-3.5 space-y-2"
                          >
                            <span className="sl-kicker text-[9px] font-black uppercase tracking-widest text-[var(--theme-muted)]">
                              Ćwiczenia i obciążenia:
                            </span>
                            <div className="space-y-1.5">
                              {session.exercises.map((ex, i) => (
                                <div
                                  key={`${ex.name}-${i}`}
                                  className="flex items-center justify-between rounded-xl bg-[var(--theme-card)]/50 px-3 py-2 text-xs"
                                >
                                  <span className="font-bold text-[var(--theme-text)] truncate">
                                    {ex.name}
                                  </span>
                                  <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                                    <span className="text-[var(--theme-muted)]">
                                      {ex.completedSets} serii × {ex.reps} powt.
                                    </span>
                                    <span className="font-black text-[var(--theme-accent)]">
                                      {ex.weightKg > 0 ? `${ex.weightKg} kg` : "masa"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between pt-1 text-[10px] font-black uppercase tracking-widest text-[var(--theme-muted)]">
                              <span>Nagrody sesji</span>
                              <span className="text-amber-400 font-bold">
                                +{session.xpEarned} XP · +{session.goldEarned} Gold
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unified Activity Events */}
          <div className="space-y-2 pt-2">
            <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em]">
              Oś Aktywności Dnia
            </p>
            {filteredEvents.slice(0, 15).map((event) => (
              <div key={event.id}>
                <HistoryEventCard event={event} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function HistoryEventCard({ event }: { event: UnifiedHistoryEvent }) {
  const Icon = event.kind === "plan"
    ? Dumbbell
    : event.kind === "dailyComplete"
      ? Trophy
      : event.kind === "archive"
        ? BarChart3
        : CheckCircle2;

  return (
    <article className="sl-input rounded-2xl p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${event.highlight ? "sl-chip-active" : "sl-chip"}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[var(--theme-text)]">{event.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--theme-muted)]">
              {formatDate(event.timestamp)} · {event.subtitle}
            </p>
            {event.metaLabel && (
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--theme-accent)]">{event.metaLabel}</p>
            )}
          </div>
        </div>
        {event.amountLabel && (
          <span className="sl-chip-active shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
            {event.amountLabel}
          </span>
        )}
      </div>
    </article>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border active:scale-[0.96] disabled:opacity-35 ${
        danger
          ? "border-[color-mix(in_srgb,var(--theme-danger)_34%,transparent)] bg-[var(--theme-danger-soft)] text-[var(--theme-danger)]"
          : "sl-button-secondary"
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  icon,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  icon?: React.ReactNode;
  onChange: (value: number) => void;
}) {
  return (
    <label className="sl-input rounded-2xl p-3">
      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-muted)]">
        {icon}
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full bg-transparent text-lg font-black text-[var(--theme-text)] outline-none"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="sl-input rounded-2xl p-3">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-muted)]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full bg-transparent text-sm font-bold text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-muted)]"
      />
    </label>
  );
}

function RangeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] ${
        active ? "sl-chip-active" : "sl-chip"
      }`}
    >
      {label}
    </button>
  );
}

function PlanStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="sl-input rounded-2xl p-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-muted)]">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-[var(--theme-text)]">{value}</p>
    </div>
  );
}

type HistoryArchiveDailyItem = {
  id?: string;
  label?: string;
  unit?: string;
  target?: number;
  value?: number;
  source?: string;
};

type TrainingHistoryArchiveEntry = {
  date: string;
  dailyItems?: HistoryArchiveDailyItem[];
  pushups?: number;
  situps?: number;
  squats?: number;
  runningKm?: number;
  xpGained?: number;
  workoutPlanSessions?: number;
  workoutPlanMinutes?: number;
  workoutPlanSets?: number;
  workoutPlanVolume?: number;
  workoutPlanGold?: number;
  completed?: boolean;
  updatedAt?: string;
};

type UnifiedHistoryEventKind = "daily" | "sensor" | "health" | "plan" | "dailyComplete" | "archive";

type UnifiedHistoryEvent = {
  id: string;
  kind: UnifiedHistoryEventKind;
  dateKey: string;
  timestamp: string;
  sortMs: number;
  title: string;
  subtitle: string;
  amountLabel?: string;
  metaLabel?: string;
  xp: number;
  gold: number;
  minutes: number;
  sets: number;
  volumeKg: number;
  highlight?: boolean;
};

type UnifiedHistoryDay = {
  dateKey: string;
  label: string;
  sortMs: number;
  dailyValue: number;
  dailyTarget: number;
  dailyCompleted: boolean;
  dailyEntries: number;
  planSessions: number;
  seconds: number;
  sets: number;
  volumeKg: number;
  xp: number;
  gold: number;
};

function readTrainingHistoryArchive(): TrainingHistoryArchiveEntry[] {
  if (typeof localStorage === "undefined") return [];

  try {
    const historyStr = localStorage.getItem("sololeveler_history_data") || "{}";
    const historyData = JSON.parse(historyStr) as Record<string, TrainingHistoryArchiveEntry>;
    return Object.values(historyData).filter((entry) => entry && typeof entry.date === "string");
  } catch {
    return [];
  }
}

function buildUnifiedTrainingHistory(
  sessions: WorkoutPlanSessionSummary[],
  workoutHistory: WorkoutEntry[],
  archiveEntries: TrainingHistoryArchiveEntry[],
) {
  const days = new Map<string, UnifiedHistoryDay>();
  const events: UnifiedHistoryEvent[] = [];

  for (const entry of workoutHistory) {
    const dateKey = getDateKeyFromTimestamp(entry.timestamp);
    const day = ensureHistoryDay(days, dateKey);
    const amount = Number(entry.value || 0);
    const amountLabel = formatWorkoutEntryAmount(entry);
    day.dailyEntries += 1;
    day.dailyValue += Math.max(0, amount);

    const kind = getWorkoutEntryEventKind(entry.source);
    events.push({
      id: entry.id,
      kind,
      dateKey,
      timestamp: entry.timestamp,
      sortMs: new Date(entry.timestamp).getTime(),
      title: entry.exerciseLabel || prettifyHistoryExercise(entry.exercise),
      subtitle: getWorkoutEntrySourceLabel(entry.source),
      amountLabel,
      xp: 0,
      gold: 0,
      minutes: 0,
      sets: 0,
      volumeKg: 0,
    });
  }

  for (const session of sessions) {
    const dateKey = session.dateKey || getDateKeyFromTimestamp(session.completedAt);
    const day = ensureHistoryDay(days, dateKey);
    day.planSessions += 1;
    day.seconds += session.activeSeconds;
    day.sets += session.completedSets;
    day.volumeKg = Number((day.volumeKg + session.volumeKg).toFixed(1));
    day.xp += session.xpReward;
    day.gold += session.goldReward;

    const exerciseNames = session.exercises.map((exercise) => exercise.name).slice(0, 3).join(", ");
    events.push({
      id: session.id,
      kind: "plan",
      dateKey,
      timestamp: session.completedAt,
      sortMs: new Date(session.completedAt).getTime(),
      title: "Sesja planu",
      subtitle: exerciseNames ? `${exerciseNames}${session.exercises.length > 3 ? "..." : ""}` : "Plan treningowy",
      amountLabel: formatDuration(session.activeSeconds),
      metaLabel: `+${session.xpReward} XP · +${session.goldReward} gold · ${session.completedSets}/${session.totalSets} serii`,
      xp: session.xpReward,
      gold: session.goldReward,
      minutes: Math.round(session.activeSeconds / 60),
      sets: session.completedSets,
      volumeKg: session.volumeKg,
      highlight: session.newRecord,
    });
  }

  for (const entry of archiveEntries) {
    const dateKey = entry.date;
    const day = ensureHistoryDay(days, dateKey);
    const dailyItems = getArchiveDailyItems(entry);
    const dailyValue = dailyItems.reduce((sum, item) => sum + Math.max(0, Number(item.value || 0)), 0);
    const dailyTarget = dailyItems.reduce((sum, item) => sum + Math.max(0, Number(item.target || 0)), 0);
    const xpGained = Math.max(0, Math.round(Number(entry.xpGained || 0)));
    const planSeconds = Math.max(0, Math.round(Number(entry.workoutPlanMinutes || 0) * 60));
    const planSets = Math.max(0, Math.round(Number(entry.workoutPlanSets || 0)));
    const planVolume = Math.max(0, Number(Number(entry.workoutPlanVolume || 0).toFixed(1)));
    const planGold = Math.max(0, Math.round(Number(entry.workoutPlanGold || 0)));

    day.dailyTarget = Math.max(day.dailyTarget, dailyTarget);
    day.dailyValue = Math.max(day.dailyValue, dailyValue);
    day.dailyCompleted = day.dailyCompleted || Boolean(entry.completed);
    day.planSessions = Math.max(day.planSessions, Math.round(Number(entry.workoutPlanSessions || 0)));
    day.seconds = Math.max(day.seconds, planSeconds);
    day.sets = Math.max(day.sets, planSets);
    day.volumeKg = Math.max(day.volumeKg, planVolume);
    day.xp = Math.max(day.xp, xpGained);
    day.gold = Math.max(day.gold, planGold);

    if (entry.completed) {
      events.push({
        id: `${dateKey}-daily-complete`,
        kind: "dailyComplete",
        dateKey,
        timestamp: entry.updatedAt || `${dateKey}T20:00:00`,
        sortMs: getDateSortMs(dateKey) + 20 * 60 * 60 * 1000,
        title: "Daily ukończone",
        subtitle: formatArchiveDailySummary(dailyItems),
        amountLabel: "100%",
        xp: xpGained,
        gold: 0,
        minutes: 0,
        sets: 0,
        volumeKg: 0,
        highlight: true,
      });
    }

    const hasArchiveOnlyProgress = xpGained > 0 || planGold > 0;
    if (hasArchiveOnlyProgress) {
      events.push({
        id: `${dateKey}-archive`,
        kind: "archive",
        dateKey,
        timestamp: entry.updatedAt || `${dateKey}T21:00:00`,
        sortMs: getDateSortMs(dateKey) + 21 * 60 * 60 * 1000,
        title: "Podsumowanie dnia",
        subtitle: "Daily, mini-gry, plan i nagrody systemu",
        amountLabel: xpGained > 0 ? `+${xpGained} XP` : undefined,
        metaLabel: planGold > 0 ? `+${planGold} gold` : undefined,
        xp: xpGained,
        gold: planGold,
        minutes: Math.round(planSeconds / 60),
        sets: planSets,
        volumeKg: planVolume,
      });
    }
  }

  return {
    days: Array.from(days.values()).sort((a, b) => b.sortMs - a.sortMs),
    events: events.sort((a, b) => b.sortMs - a.sortMs),
  };
}

function ensureHistoryDay(days: Map<string, UnifiedHistoryDay>, dateKey: string) {
  const existing = days.get(dateKey);
  if (existing) return existing;

  const created: UnifiedHistoryDay = {
    dateKey,
    label: formatDateShort(dateKey),
    sortMs: getDateSortMs(dateKey),
    dailyValue: 0,
    dailyTarget: 0,
    dailyCompleted: false,
    dailyEntries: 0,
    planSessions: 0,
    seconds: 0,
    sets: 0,
    volumeKg: 0,
    xp: 0,
    gold: 0,
  };
  days.set(dateKey, created);
  return created;
}

function filterHistoryDaysByRange(days: UnifiedHistoryDay[], range: HistoryRange) {
  if (range === "all") return days;
  return days.filter((day) => isDateKeyInRange(day.dateKey, range));
}

function filterHistoryEventsByRange(events: UnifiedHistoryEvent[], range: HistoryRange) {
  if (range === "all") return events;
  return events.filter((event) => isDateKeyInRange(event.dateKey, range));
}

function buildUnifiedHistoryChart(days: UnifiedHistoryDay[]) {
  return [...days]
    .sort((a, b) => a.sortMs - b.sortMs)
    .map((day) => ({
      label: day.label,
      dailyPercent: getDailyPercentForHistoryDay(day),
      minutes: Math.round(day.seconds / 60),
      sets: day.sets,
      xp: day.xp,
    }))
    .slice(-14);
}

function getUnifiedHistoryTotals(days: UnifiedHistoryDay[]) {
  return days.reduce((totals, day) => ({
    dailyCompleted: totals.dailyCompleted + (day.dailyCompleted ? 1 : 0),
    planSessions: totals.planSessions + day.planSessions,
    seconds: totals.seconds + day.seconds,
    sets: totals.sets + day.sets,
    volumeKg: Number((totals.volumeKg + day.volumeKg).toFixed(1)),
    xp: totals.xp + day.xp,
    gold: totals.gold + day.gold,
  }), {
    dailyCompleted: 0,
    planSessions: 0,
    seconds: 0,
    sets: 0,
    volumeKg: 0,
    xp: 0,
    gold: 0,
  });
}

function getDailyPercentForHistoryDay(day: UnifiedHistoryDay) {
  if (day.dailyCompleted) return 100;
  if (day.dailyTarget <= 0) return day.dailyEntries > 0 ? 1 : 0;
  return Math.min(100, Math.round((day.dailyValue / day.dailyTarget) * 100));
}

function isDateKeyInRange(dateKey: string, range: Exclude<HistoryRange, "all">) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (range === "7d" ? 6 : 29));
  return getDateSortMs(dateKey) >= cutoff.getTime();
}

function getDateKeyFromTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return getLocalDateKey();
  return getLocalDateKey(date);
}

function getDateSortMs(dateKey: string) {
  const timestamp = new Date(`${dateKey}T12:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getArchiveDailyItems(entry: TrainingHistoryArchiveEntry): HistoryArchiveDailyItem[] {
  if (Array.isArray(entry.dailyItems) && entry.dailyItems.length > 0) {
    return entry.dailyItems.filter((item) => Number(item.target || 0) > 0 || Number(item.value || 0) > 0);
  }

  return [
    { id: "pushups", label: "Pompki", unit: "powt.", target: 100, value: entry.pushups || 0, source: "trackable" },
    { id: "situps", label: "Brzuszki", unit: "powt.", target: 100, value: entry.situps || 0, source: "trackable" },
    { id: "squats", label: "Przysiady", unit: "powt.", target: 100, value: entry.squats || 0, source: "trackable" },
    { id: "runningKm", label: "Bieganie", unit: "km", target: 10, value: entry.runningKm || 0, source: "trackable" },
  ].filter((item) => Number(item.value || 0) > 0);
}

function formatArchiveDailySummary(items: HistoryArchiveDailyItem[]) {
  if (items.length === 0) return "Cel dzienny zamknięty";
  return items
    .slice(0, 3)
    .map((item) => `${item.label || "Ćwiczenie"} ${formatCompactNumber(Number(item.value || 0))}/${formatCompactNumber(Number(item.target || 0))} ${item.unit || ""}`.trim())
    .join(" · ");
}

function getWorkoutEntryEventKind(source: WorkoutEntry["source"]): UnifiedHistoryEventKind {
  if (source === "healthConnect") return "health";
  if (source === "phoneSensor" || source === "wearable") return "sensor";
  return "daily";
}

function getWorkoutEntrySourceLabel(source: WorkoutEntry["source"]) {
  if (source === "healthConnect") return "Health Connect";
  if (source === "phoneSensor") return "Sensor telefonu";
  if (source === "wearable") return "Opaska";
  return "Wpis manualny daily";
}

function formatWorkoutEntryAmount(entry: WorkoutEntry) {
  const amount = Number(entry.value || 0);
  const unit = entry.trackableExerciseId === "runningKm" ? "km" : "powt.";
  return `+${formatCompactNumber(amount)} ${unit}`;
}

function prettifyHistoryExercise(exercise: string) {
  return exercise
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value % 1) > 0) return value.toFixed(1);
  return String(Math.round(value));
}

function filterSessionsByRange(sessions: WorkoutPlanSessionSummary[], range: HistoryRange) {
  const sorted = [...sessions].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  if (range === "all") return sorted;

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (range === "7d" ? 6 : 29));
  return sorted.filter((session) => new Date(session.completedAt).getTime() >= cutoff.getTime());
}

function buildHistoryChart(sessions: WorkoutPlanSessionSummary[]) {
  const buckets = new Map<string, { label: string; minutes: number; sets: number; volume: number; xp: number }>();

  for (const session of sessions) {
    const current = buckets.get(session.dateKey) ?? {
      label: formatDateShort(session.dateKey),
      minutes: 0,
      sets: 0,
      volume: 0,
      xp: 0,
    };
    current.minutes += Math.round(session.activeSeconds / 60);
    current.sets += session.completedSets;
    current.volume += Math.round(session.volumeKg);
    current.xp += session.xpReward;
    buckets.set(session.dateKey, current);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value)
    .slice(-14);
}

function getHistoryTotals(sessions: WorkoutPlanSessionSummary[]) {
  return sessions.reduce((totals, session) => ({
    seconds: totals.seconds + session.activeSeconds,
    sets: totals.sets + session.completedSets,
    volumeKg: Number((totals.volumeKg + session.volumeKg).toFixed(1)),
    xp: totals.xp + session.xpReward,
    gold: totals.gold + session.goldReward,
  }), {
    seconds: 0,
    sets: 0,
    volumeKg: 0,
    xp: 0,
    gold: 0,
  });
}

function createPlanSignatureFromPlan(plan: WorkoutPlanExercise[]) {
  return plan
    .filter((exercise) => exercise.targetSets > 0 && exercise.targetReps > 0)
    .map((exercise) => [
      exercise.catalogExerciseId,
      exercise.targetSets,
      exercise.targetReps,
      exercise.defaultWeightKg,
      exercise.restSeconds,
    ].join(":"))
    .join("|");
}

function getBestTimeForPlan(sessions: WorkoutPlanSessionSummary[], planSignature: string) {
  if (!planSignature) return null;
  const matches = sessions.filter((session) =>
    session.planSignature === planSignature &&
    session.completionRatio >= 1 &&
    session.activeSeconds > 0
  );

  if (matches.length === 0) return null;
  return Math.min(...matches.map((session) => session.activeSeconds));
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    .format(new Date(timestamp));
}

function formatDateShort(value: string) {
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit" }).format(date);
}
