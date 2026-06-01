import React, { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  Play,
  Plus,
  Search,
  Timer,
  Trash2,
  Trophy,
  Weight,
} from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EXERCISE_CATALOG, type ExerciseCatalogEntry } from "../data/exerciseCatalog";
import {
  addCatalogExerciseToPlan,
  addSetToPlanExercise,
  getPlanCompletionForDate,
  getPlanSetsForDate,
  movePlanExercise,
  removePlanExercise,
  removePlanSet,
  updatePlanExercise,
} from "../game/workoutPlan";
import { getLocalDateKey } from "../game/playerMath";
import type { WorkoutPlanExercise, WorkoutPlanSession, WorkoutPlanSessionSummary } from "../types";

type HistoryRange = "7d" | "30d" | "all";
type PlanPanelMode = "plan" | "history";

type WorkoutPlanPanelProps = {
  plan: WorkoutPlanExercise[];
  sessions: WorkoutPlanSessionSummary[];
  activeSession: WorkoutPlanSession | null;
  onChange: (plan: WorkoutPlanExercise[]) => void;
  onStartSession: () => void;
};

export function WorkoutPlanPanel({
  plan,
  sessions,
  activeSession,
  onChange,
  onStartSession,
}: WorkoutPlanPanelProps) {
  const [query, setQuery] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [historyRange, setHistoryRange] = useState<HistoryRange>("7d");
  const [mode, setMode] = useState<PlanPanelMode>("plan");
  const todayKey = getLocalDateKey();

  const filteredCatalog = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return EXERCISE_CATALOG.filter((exercise) => {
      if (!normalizedQuery) return true;
      return normalizeText([
        exercise.name,
        exercise.category,
        exercise.equipment,
        ...exercise.primaryMuscles,
      ].join(" ")).includes(normalizedQuery);
    });
  }, [query]);

  const selectedExercise = EXERCISE_CATALOG.find((exercise) => exercise.id === selectedExerciseId) ?? filteredCatalog[0];
  const completion = getPlanCompletionForDate(plan, todayKey);
  const plannedIds = new Set(plan.map((exercise) => exercise.catalogExerciseId));

  const addSelectedExercise = () => {
    if (!selectedExercise) return;
    onChange(addCatalogExerciseToPlan(plan, selectedExercise));
    setSelectedExerciseId("");
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
          range={historyRange}
          onRangeChange={setHistoryRange}
        />
      ) : (
        <>
      <div className="sl-card rounded-[22px] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-accent)]">Plan łowcy</p>
            <h3 className="mt-1 text-lg font-black uppercase tracking-[0.06em] text-[var(--theme-text)]">Twoje ćwiczenia</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--theme-muted)]">
              Ułóż kolejność, serie i przerwy. Po starcie plan działa jako snapshot, więc edycja nie popsuje aktywnej sesji.
            </p>
          </div>
          <Dumbbell className="h-6 w-6 text-[var(--theme-icon)]" />
        </div>

        <button
          type="button"
          onClick={onStartSession}
          disabled={plan.length === 0 && !activeSession}
          className="sl-button-primary mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black uppercase tracking-widest active:scale-[0.98]"
        >
          <Play className="h-4 w-4" />
          {activeSession ? "Wznów plan" : "Uruchom plan"}
        </button>

        <div className="mt-4 grid gap-2">
          <label className="sl-input flex min-h-12 items-center gap-2 rounded-2xl px-3">
            <Search className="h-4 w-4 text-[var(--theme-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj ćwiczenia do planu"
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-muted)]"
            />
          </label>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <select
              value={selectedExerciseId}
              onChange={(event) => setSelectedExerciseId(event.target.value)}
              className="sl-input min-h-12 min-w-0 rounded-2xl px-3 text-xs font-black uppercase tracking-widest outline-none"
            >
              <option value="">{filteredCatalog[0] ? "Wybierz z listy" : "Brak wyników"}</option>
              {filteredCatalog.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addSelectedExercise}
              disabled={!selectedExercise || plannedIds.has(selectedExercise.id)}
              className="sl-button-primary flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black uppercase tracking-widest active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Dodaj
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <PlanStat label="Ćwiczenia" value={plan.length} />
          <PlanStat label="Serie dziś" value={`${completion.completedSets}/${completion.targetSets}`} />
          <PlanStat label="Postęp" value={`${Math.floor(completion.percent)}%`} />
        </div>
      </div>

      {plan.length === 0 ? (
        <div className="sl-input rounded-[22px] p-5 text-center">
          <p className="text-sm font-bold text-[var(--theme-text)]">Plan jest pusty.</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--theme-muted)]">
            Dodaj pierwsze ćwiczenie z listy albo z karty w katalogu.
          </p>
        </div>
      ) : (
        plan.map((exercise, index) => (
          <PlanExerciseCard
            key={exercise.id}
            exercise={exercise}
            index={index}
            canMoveUp={index > 0}
            canMoveDown={index < plan.length - 1}
            todayKey={todayKey}
            onMoveUp={() => onChange(movePlanExercise(plan, exercise.id, -1))}
            onMoveDown={() => onChange(movePlanExercise(plan, exercise.id, 1))}
            onUpdate={(update) => onChange(updatePlanExercise(plan, exercise.id, update))}
            onAddSet={() =>
              onChange(addSetToPlanExercise(plan, exercise.id, {
                reps: exercise.targetReps,
                weightKg: exercise.defaultWeightKg,
                dateKey: todayKey,
              }))
            }
            onRemoveSet={(setId) => onChange(removePlanSet(plan, exercise.id, setId))}
            onRemove={() => onChange(removePlanExercise(plan, exercise.id))}
          />
        ))
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
    <article className="sl-card rounded-[22px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-accent)]">
            {index + 1}. {exercise.category}
          </p>
          <h3 className="mt-1 text-lg font-black uppercase tracking-[0.04em] text-[var(--theme-text)]">{exercise.name}</h3>
          <p className="mt-1 truncate text-xs font-bold text-[var(--theme-muted)]">{exercise.equipment}</p>
        </div>
        <div className="grid grid-cols-3 gap-1">
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
  range,
  onRangeChange,
}: {
  plan: WorkoutPlanExercise[];
  sessions: WorkoutPlanSessionSummary[];
  range: HistoryRange;
  onRangeChange: (range: HistoryRange) => void;
}) {
  const filteredSessions = useMemo(() => filterSessionsByRange(sessions, range), [sessions, range]);
  const chartData = useMemo(() => buildHistoryChart(filteredSessions), [filteredSessions]);
  const totals = useMemo(() => getHistoryTotals(filteredSessions), [filteredSessions]);
  const currentPlanSignature = useMemo(() => createPlanSignatureFromPlan(plan), [plan]);
  const bestTimeForPlan = useMemo(() => getBestTimeForPlan(sessions, currentPlanSignature), [sessions, currentPlanSignature]);

  return (
    <section className="sl-card rounded-[22px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-accent)]">Historia</p>
          <h3 className="mt-1 text-lg font-black uppercase tracking-[0.06em] text-[var(--theme-text)]">Raport planów</h3>
        </div>
        <BarChart3 className="h-6 w-6 text-[var(--theme-icon)]" />
      </div>

      <div className="sl-input mt-4 grid grid-cols-3 gap-2 rounded-2xl p-1.5">
        <RangeButton active={range === "7d"} onClick={() => onRangeChange("7d")} label="7 dni" />
        <RangeButton active={range === "30d"} onClick={() => onRangeChange("30d")} label="30 dni" />
        <RangeButton active={range === "all"} onClick={() => onRangeChange("all")} label="Całość" />
      </div>

      {filteredSessions.length === 0 ? (
        <div className="sl-input mt-4 rounded-2xl p-4 text-center">
          <p className="text-sm font-bold text-[var(--theme-text)]">Brak zapisanych sesji w tym zakresie.</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--theme-muted)]">Uruchom plan i zakończ go, żeby pojawiły się wykresy.</p>
        </div>
      ) : (
        <>
          <div className="sl-input mt-4 h-52 rounded-2xl p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 8, left: -28, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "rgba(34,211,238,0.08)" }}
                  contentStyle={{ background: "var(--theme-modal)", border: "1px solid var(--theme-border)", borderRadius: 14, color: "var(--theme-text)" }}
                  labelStyle={{ color: "#e0f2fe", fontWeight: 900 }}
                />
                <Bar dataKey="minutes" name="Minuty" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                <Bar dataKey="sets" name="Serie" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="volume" name="Objętość kg" fill="#a855f7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="xp" name="XP" fill="#facc15" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <PlanStat label="Sesje" value={filteredSessions.length} />
            <PlanStat label="Czas" value={formatDuration(totals.seconds)} />
            <PlanStat label="Serie" value={totals.sets} />
            <PlanStat label="Objętość" value={`${totals.volumeKg} kg`} />
            <PlanStat label="XP / Gold" value={`${totals.xp} / ${totals.gold}`} />
            <PlanStat label="Rekord" value={bestTimeForPlan ? formatDuration(bestTimeForPlan) : "--"} />
          </div>

          <div className="mt-3 space-y-2">
            {filteredSessions.slice(-3).reverse().map((session) => (
              <div key={session.id} className="sl-input rounded-2xl p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-widest text-[var(--theme-text)]">{formatDate(session.completedAt)}</p>
                  <span className="font-mono text-xs font-black text-[var(--theme-icon)]">{formatDuration(session.activeSeconds)}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--theme-muted)]">
                  {session.completedSets}/{session.totalSets} serii · {session.totalReps} powt. · {session.volumeKg} kg · +{session.xpReward} XP
                </p>
                {session.newRecord && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--theme-warning-text)]">
                    <Trophy className="h-3.5 w-3.5" />
                    Rekord układu planu
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
