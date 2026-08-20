import React, { useDeferredValue, useMemo, useState } from "react";
import { BookOpen, ExternalLink, Plus, Search } from "lucide-react";
import {
  EXERCISE_CATALOG,
  EXERCISE_CATEGORIES,
  EXERCISE_DIFFICULTIES,
  type ExerciseCatalogEntry,
  type ExerciseDifficulty,
} from "../data/exerciseCatalog";
import { createExerciseVideoPoster } from "../utils/videoPoster";
import { searchExercises } from "../game/exerciseSearch";

type ExerciseCatalogPanelProps = {
  plannedExerciseIds?: string[];
  onAddToPlan?: (exercise: ExerciseCatalogEntry) => void;
  highlightExerciseId?: string | null;
};

export function ExerciseCatalogPanel({
  plannedExerciseIds = [],
  onAddToPlan,
  highlightExerciseId = null,
}: ExerciseCatalogPanelProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(highlightExerciseId || null);

  React.useEffect(() => {
    if (highlightExerciseId) {
      setSelectedId(highlightExerciseId);
      setCategory("all");
      setDifficulty("all");
      setQuery("");
    }
  }, [highlightExerciseId]);

  const plannedIds = useMemo(() => new Set(plannedExerciseIds), [plannedExerciseIds]);

  const filteredExercises = useMemo(() => {
    const scopedCatalog = EXERCISE_CATALOG.filter((exercise) => {
      const matchesCategory = category === "all" || exercise.category === category;
      const matchesDifficulty = difficulty === "all" || exercise.difficulty === difficulty;
      return matchesCategory && matchesDifficulty;
    });
    return searchExercises(scopedCatalog, deferredQuery, {
      limit: deferredQuery.trim() ? 80 : scopedCatalog.length,
      includeZeroScore: !deferredQuery.trim(),
    }).map((result) => result.exercise);
  }, [category, deferredQuery, difficulty]);

  return (
    <div className="space-y-3">
      <div className="sl-card rounded-[22px] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em]">Baza techniki</p>
            <h3 className="mt-1 text-lg font-black uppercase tracking-[0.06em] text-[var(--theme-text-strong)]">{EXERCISE_CATALOG.length} cwiczen wideo</h3>
          </div>
          <BookOpen className="h-6 w-6 text-[var(--theme-icon)]" />
        </div>

        <label className="sl-input mt-4 flex min-h-12 items-center gap-2 rounded-2xl px-3">
          <Search className="h-4 w-4 text-[var(--theme-muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj cwiczenia, miesnia albo sprzetu"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-muted)]"
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="sl-input min-h-11 rounded-xl px-3 text-xs font-black uppercase tracking-widest outline-none"
          >
            <option value="all">Wszystkie partie</option>
            {EXERCISE_CATEGORIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as ExerciseDifficulty | "all")}
            className="sl-input min-h-11 rounded-xl px-3 text-xs font-black uppercase tracking-widest outline-none"
          >
            <option value="all">Kazdy poziom</option>
            {EXERCISE_DIFFICULTIES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>

        <p className="sl-muted mt-3 text-xs leading-relaxed">
          Filmy sa odtwarzane jako zewnetrzne linki z atlasu. Aplikacja nie kopiuje cudzych plikow do repo.
        </p>
      </div>

      <div className="sl-muted flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-widest">
        <span>Wyniki</span>
        <span>{filteredExercises.length}</span>
      </div>

      {filteredExercises.map((exercise) => (
        <React.Fragment key={exercise.id}>
          <CatalogExerciseCard
            exercise={exercise}
            expanded={selectedId === exercise.id}
            onToggle={() => setSelectedId((current) => current === exercise.id ? null : exercise.id)}
            planned={plannedIds.has(exercise.id)}
            onAddToPlan={onAddToPlan ? () => onAddToPlan(exercise) : undefined}
          />
        </React.Fragment>
      ))}

      {filteredExercises.length === 0 && (
        <div className="sl-empty-state rounded-[22px] p-5 text-center text-sm">
          Brak cwiczen dla tych filtrow.
        </div>
      )}
    </div>
  );
}

function CatalogExerciseCard({
  exercise,
  expanded,
  onToggle,
  planned,
  onAddToPlan,
}: {
  exercise: ExerciseCatalogEntry;
  expanded: boolean;
  onToggle: () => void;
  planned: boolean;
  onAddToPlan?: () => void;
}) {
  return (
    <article className="sl-card rounded-[22px] p-4">
      <button type="button" onClick={onToggle} className="w-full text-left active:scale-[0.99]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em]">{exercise.category}</p>
            <h3 className="mt-1 text-lg font-black uppercase tracking-[0.04em] text-[var(--theme-text-strong)]">{exercise.name}</h3>
          </div>
          <span className="sl-chip-active rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            {getDifficultyLabel(exercise.difficulty)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
          {exercise.primaryMuscles.slice(0, 3).map((muscle) => (
            <span key={muscle} className="sl-chip rounded-full px-2.5 py-1">{muscle}</span>
          ))}
          <span className="sl-chip-active rounded-full px-2.5 py-1">{exercise.equipment}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-[var(--theme-border)] pt-4">
          {onAddToPlan && (
            <button
              type="button"
              onClick={onAddToPlan}
              disabled={planned}
              className="sl-button-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black uppercase tracking-widest active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              {planned ? "Już w planie" : "Dodaj do planu"}
            </button>
          )}
          <CatalogInfoBlock title="Wykonanie" items={exercise.steps} />
          <ExerciseMiniPlayer exercise={exercise} />
          <CatalogInfoBlock title="Technika" items={exercise.techniqueCues} />
          <CatalogInfoBlock title="Najczestsze bledy" items={exercise.commonMistakes} muted />
          <CatalogInfoBlock title="Bezpieczenstwo" items={exercise.safetyNotes} muted />

          <div className="grid gap-2">
            {exercise.media.filter((media) => media.type !== "video").map((media) => (
              <a
                key={`${exercise.id}-${media.sourceName}`}
                href={media.url}
                target="_blank"
                rel="noreferrer"
                className="sl-button-secondary flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest active:scale-[0.98]"
              >
                <span className="min-w-0 truncate">{media.label}</span>
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function ExerciseMiniPlayer({ exercise }: { exercise: ExerciseCatalogEntry }) {
  const video = exercise.media.find((media) => media.type === "video");

  if (!video) {
    return (
      <div className="sl-input rounded-2xl p-3">
        <p className="sl-muted text-[10px] font-black uppercase tracking-[0.24em]">Wideo</p>
        <p className="sl-muted mt-2 text-sm leading-relaxed">
          Dla tego wpisu nie ma jeszcze bezposredniego filmu. Uzyj linku do atlasu zrodlowego ponizej.
        </p>
      </div>
    );
  }

  return (
    <div className="sl-input overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--theme-border)] px-3 py-2">
        <span className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em]">Mini odtwarzacz</span>
        <span className="sl-muted text-[9px] font-black uppercase tracking-widest">{video.sourceName}</span>
      </div>
      <video
        className="aspect-video w-full bg-[var(--theme-progress-track)] object-contain"
        src={video.url}
        controls
        playsInline
        poster={createExerciseVideoPoster(exercise.name, video.sourceName)}
        preload="metadata"
      />
      {video.sourcePageUrl && (
        <a
          href={video.sourcePageUrl}
          target="_blank"
          rel="noreferrer"
          className="sl-link flex min-h-10 items-center justify-between gap-3 border-t border-[var(--theme-border)] px-3 py-2 text-[10px] font-black uppercase tracking-widest active:scale-[0.99]"
        >
          <span>Otworz strone zrodlowa</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

function CatalogInfoBlock({ title, items, muted = false }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <div>
      <h4 className={`text-[10px] font-black uppercase tracking-[0.24em] ${muted ? "sl-muted" : "sl-kicker"}`}>{title}</h4>
      <ul className="sl-muted mt-2 space-y-1.5 text-sm leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--theme-accent)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getDifficultyLabel(difficulty: ExerciseDifficulty) {
  if (difficulty === "latwe") return "Latwe";
  if (difficulty === "srednie") return "Srednie";
  return "Trudne";
}
