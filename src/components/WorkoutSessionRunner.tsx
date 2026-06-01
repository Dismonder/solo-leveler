import React, { useEffect, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, FastForward, Pause, Play, RotateCcw, Timer, Trophy, X } from "lucide-react";
import type { WorkoutPlanSession, WorkoutPlanSessionSummary } from "../types";
import {
  advanceSessionAfterRest,
  cancelWorkoutSession,
  completeCurrentSessionSet,
  getCurrentSessionExercise,
  getSessionCompletedSets,
  getSessionTotalSets,
  pauseWorkoutSession,
  resumeWorkoutSession,
  savePartialWorkoutSessionWithoutReward,
  skipCurrentSessionSet,
  summarizeWorkoutSession,
} from "../game/workoutSession";
import { lockAppLandscape, lockAppPortrait } from "../services/orientationService";
import { createExerciseVideoPoster } from "../utils/videoPoster";

type WorkoutSessionRunnerProps = {
  session: WorkoutPlanSession;
  previousSummaries: WorkoutPlanSessionSummary[];
  onSave: (session: WorkoutPlanSession) => void;
  onComplete: (session: WorkoutPlanSession) => void;
  onDiscard: () => void;
  onCloseSummary: () => void;
};

export function WorkoutSessionRunner({
  session,
  previousSummaries,
  onSave,
  onComplete,
  onDiscard,
  onCloseSummary,
}: WorkoutSessionRunnerProps) {
  const [now, setNow] = useState(() => new Date());
  const [closeConfirm, setCloseConfirm] = useState(false);
  const requestCloseRef = useRef(() => setCloseConfirm(true));
  const exercise = getCurrentSessionExercise(session);
  const totalSets = getSessionTotalSets(session);
  const completedSets = getSessionCompletedSets(session);
  const progress = totalSets > 0 ? Math.min(100, (session.results.length / totalSets) * 100) : 0;
  const activeSeconds = calculateVisibleSeconds(session, now);
  const restSecondsLeft = session.restEndsAt ? Math.max(0, Math.ceil((new Date(session.restEndsAt).getTime() - now.getTime()) / 1000)) : 0;
  const isFinished = session.status === "completed" || session.status === "cancelled";
  const summary = isFinished ? summarizeWorkoutSession(session) : null;

  requestCloseRef.current = () => {
    if (isFinished) {
      onCloseSummary();
      return;
    }
    setCloseConfirm(true);
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void lockAppLandscape();
    return () => {
      void lockAppPortrait();
    };
  }, []);

  useEffect(() => {
    if (session.status === "resting" && session.restEndsAt && new Date(session.restEndsAt).getTime() <= now.getTime()) {
      onSave(advanceSessionAfterRest(session, now));
    }
  }, [now, onSave, session]);

  useEffect(() => {
    let cancelled = false;
    let nativeBackListener: PluginListenerHandle | null = null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestCloseRef.current();
      }
    };

    if (Capacitor.getPlatform() === "android" && Capacitor.isPluginAvailable("App")) {
      void CapacitorApp.addListener("backButton", () => requestCloseRef.current()).then((listener) => {
        if (cancelled) {
          void listener.remove();
          return;
        }
        nativeBackListener = listener;
      });
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", handleKeyDown);
      void nativeBackListener?.remove();
    };
  }, []);

  const completeSet = () => {
    const next = completeCurrentSessionSet(session, previousSummaries);
    if (next.status === "completed") {
      onComplete(next);
    } else {
      onSave(next);
    }
  };

  const skipSet = () => {
    const next = skipCurrentSessionSet(session, previousSummaries);
    if (next.status === "completed") {
      onComplete(next);
    } else {
      onSave(next);
    }
  };

  const togglePause = () => {
    if (session.status === "paused") {
      onSave(resumeWorkoutSession(session));
      return;
    }
    onSave(pauseWorkoutSession(session));
  };

  const savePartial = () => {
    onComplete(savePartialWorkoutSessionWithoutReward(session));
    setCloseConfirm(false);
  };

  const discard = () => {
    onSave(cancelWorkoutSession(session));
    onDiscard();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[var(--theme-game-bg)] text-[var(--theme-text)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--theme-accent)_18%,transparent),transparent_42%),var(--theme-game-bg)]" />
      <div className="absolute inset-0 bg-[linear-gradient(color-mix(in_srgb,var(--theme-accent)_7%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--theme-accent)_6%,transparent)_1px,transparent_1px)] bg-[size:28px_28px]" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[min(100vw,980px)] flex-col px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-[max(env(safe-area-inset-top),0.75rem)]">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.28em]">Aktywna sesja</p>
            <h2 className="text-xl font-black uppercase tracking-[0.08em] text-[var(--theme-text-strong)]">Plan treningowy</h2>
          </div>
          <button
            type="button"
            onClick={() => requestCloseRef.current()}
            className="sl-icon-button flex h-11 w-11 items-center justify-center rounded-2xl active:scale-[0.96]"
            aria-label="Zamknij sesję"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SessionStat label="Czas" value={formatDuration(activeSeconds)} />
          <SessionStat label="Serie" value={`${completedSets}/${totalSets}`} />
          <SessionStat label="Tempo" value={formatPace(session.estimatedSeconds, activeSeconds)} />
        </div>

        <div className="sl-progress-track mt-4 h-2 overflow-hidden rounded-full">
          <div className="sl-progress-fill h-full rounded-full shadow-[0_0_20px_color-mix(in_srgb,var(--theme-accent)_55%,transparent)]" style={{ width: `${progress}%` }} />
        </div>

        <main className="sl-card mt-4 flex-1 overflow-y-auto rounded-[28px] p-4 custom-scrollbar landscape:overflow-hidden">
          {summary ? (
            <SessionSummary summary={summary} />
          ) : exercise ? (
            <div className="flex min-h-full flex-col landscape:grid landscape:grid-cols-[1.05fr_0.95fr] landscape:gap-5">
              <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.26em]">{exercise.category}</p>
                  <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.04em] text-[var(--theme-text-strong)]">{exercise.name}</h1>
                  <p className="sl-muted mt-2 text-sm leading-relaxed">{exercise.goal} · {exercise.targetArea}</p>
                </div>
                <div className="sl-chip-active rounded-2xl px-3 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest">Seria</p>
                  <p className="font-mono text-lg font-black text-[var(--theme-text-strong)]">{session.setIndex + 1}/{exercise.targetSets}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <BigMetric label="Powtórzenia" value={exercise.targetReps} />
                <BigMetric label="Ciężar" value={exercise.weightKg > 0 ? `${exercise.weightKg} kg` : "masa"} />
              </div>

              <SessionTechniqueGuide catalogExerciseId={exercise.catalogExerciseId} exerciseName={exercise.name} />

              {exercise.notes && (
                <div className="sl-input mt-4 rounded-2xl p-3">
                  <p className="sl-muted text-[10px] font-black uppercase tracking-[0.24em]">Notatka</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--theme-text)]">{exercise.notes}</p>
                </div>
              )}
              </div>

              <div className="flex min-h-0 flex-col">
              {session.status === "resting" && (
                <div className="sl-alert-warning mt-5 rounded-[24px] p-4 text-center">
                  <Timer className="sl-alert-icon mx-auto h-8 w-8" />
                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-warning-text)]">Przerwa</p>
                  <p className="mt-1 font-mono text-5xl font-black text-[var(--theme-text-strong)]">{restSecondsLeft}s</p>
                  <button
                    type="button"
                    onClick={() => onSave(advanceSessionAfterRest(session))}
                    className="sl-button-primary mt-4 min-h-12 w-full rounded-2xl px-4 text-sm font-black uppercase tracking-widest active:scale-[0.98]"
                  >
                    Przejdź dalej
                  </button>
                </div>
              )}

              {session.status === "paused" && (
                <div className="sl-input mt-5 rounded-[24px] p-4 text-center">
                  <Pause className="mx-auto h-8 w-8 text-[var(--theme-icon)]" />
                  <p className="mt-3 text-sm font-bold text-[var(--theme-text)]">Sesja jest zapauzowana. Czas aktywny nie rośnie.</p>
                </div>
              )}

              <div className="mt-auto pt-6">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="sl-button-secondary flex min-h-12 items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-[0.98]"
                  >
                    {session.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {session.status === "paused" ? "Wznów" : "Pauza"}
                  </button>
                  <button
                    type="button"
                    onClick={skipSet}
                    disabled={session.status !== "active"}
                    className="sl-alert-warning flex min-h-12 items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-widest text-[var(--theme-warning-text)] disabled:opacity-100 active:scale-[0.98]"
                  >
                    <FastForward className="h-4 w-4" />
                    Pomiń
                  </button>
                </div>
                <button
                  type="button"
                  onClick={completeSet}
                  disabled={session.status !== "active"}
                  className="sl-button-primary mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black uppercase tracking-widest disabled:opacity-100 active:scale-[0.98]"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Seria zrobiona
                </button>
              </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      <AnimatePresence>
        {closeConfirm && (
          <motion.div className="sl-modal-backdrop absolute inset-0 z-20 flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="sl-modal w-full max-w-sm rounded-[26px] border p-5 shadow-2xl" initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}>
              <h3 className="text-xl font-black uppercase tracking-[0.08em] text-[var(--theme-text-strong)]">Zakończyć sesję?</h3>
              <p className="sl-muted mt-2 text-sm leading-relaxed">
                Możesz wrócić do ćwiczeń, zapisać częściowy wynik bez nagrody albo anulować sesję.
              </p>
              <div className="mt-5 grid gap-2">
                <button type="button" onClick={() => setCloseConfirm(false)} className="sl-button-primary min-h-12 rounded-2xl text-sm font-black uppercase tracking-widest active:scale-[0.98]">Wróć do sesji</button>
                <button type="button" onClick={savePartial} className="sl-button-secondary min-h-12 rounded-2xl text-sm font-black uppercase tracking-widest active:scale-[0.98]">Zapisz bez nagrody</button>
                <button type="button" onClick={discard} className="min-h-12 rounded-2xl border border-[color-mix(in_srgb,var(--theme-danger)_38%,transparent)] bg-[var(--theme-danger-soft)] text-sm font-black uppercase tracking-widest text-[var(--theme-danger-text)] active:scale-[0.98]">Anuluj wynik</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SessionSummary({ summary }: { summary: WorkoutPlanSessionSummary }) {
  return (
    <div className="flex min-h-full flex-col justify-center text-center">
      <div className="mx-auto rounded-full border border-[var(--theme-border)] bg-[var(--theme-accent-soft)] p-5">
        <Trophy className="h-10 w-10 text-[var(--theme-icon)]" />
      </div>
      <p className="sl-kicker mt-5 text-[10px] font-black uppercase tracking-[0.28em]">Raport systemu</p>
      <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.06em] text-[var(--theme-text-strong)]">Plan zapisany</h2>
      <p className="sl-muted mt-3 text-sm leading-relaxed">{getPaceText(summary)}</p>
      <div className="mt-6 grid grid-cols-2 gap-2 text-left">
        <SessionStat label="Czas" value={formatDuration(summary.activeSeconds)} />
        <SessionStat label="Serie" value={`${summary.completedSets}/${summary.totalSets}`} />
        <SessionStat label="XP" value={`+${summary.xpReward}`} />
        <SessionStat label="Gold" value={`+${summary.goldReward}`} />
      </div>
      {summary.newRecord && (
        <div className="sl-alert-warning mt-4 rounded-2xl p-3 text-sm font-black uppercase tracking-widest text-[var(--theme-warning-text)]">
          Nowy rekord planu
        </div>
      )}
    </div>
  );
}

function SessionStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="sl-stat-tile rounded-2xl p-3">
      <p className="sl-muted text-[9px] font-black uppercase tracking-widest">{label}</p>
      <p className="mt-1 font-mono text-lg font-black text-[var(--theme-text-strong)]">{value}</p>
    </div>
  );
}

function BigMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="sl-stat-tile rounded-[22px] p-4">
      <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[var(--theme-text-strong)]">{value}</p>
    </div>
  );
}

type SessionVideoMedia = {
  type: string;
  url: string;
  sourceName: string;
  label: string;
  sourcePageUrl?: string;
};

type SessionCatalogExercise = {
  steps: string[];
  techniqueCues: string[];
  commonMistakes: string[];
  safetyNotes: string[];
  media: SessionVideoMedia[];
};

function SessionTechniqueGuide({
  catalogExerciseId,
  exerciseName,
}: {
  catalogExerciseId: string;
  exerciseName: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [catalogExercise, setCatalogExercise] = useState<SessionCatalogExercise | null | undefined>(undefined);
  const [videoFailed, setVideoFailed] = useState(false);
  const video = catalogExercise?.media.find((media) => media.type === "video") ?? null;

  useEffect(() => {
    let cancelled = false;
    setCatalogExercise(undefined);

    void import("../data/exerciseCatalog").then(({ EXERCISE_CATALOG }) => {
      if (cancelled) return;
      const exercise = EXERCISE_CATALOG.find((item) => item.id === catalogExerciseId);
      setCatalogExercise(exercise ? {
        steps: exercise.steps,
        techniqueCues: exercise.techniqueCues,
        commonMistakes: exercise.commonMistakes,
        safetyNotes: exercise.safetyNotes,
        media: exercise.media,
      } : null);
    }).catch(() => {
      if (!cancelled) setCatalogExercise(null);
    });

    return () => {
      cancelled = true;
    };
  }, [catalogExerciseId]);

  useEffect(() => {
    setVideoFailed(false);
  }, [video?.url]);

  useEffect(() => {
    if (!videoRef.current || !video || videoFailed) return;
    videoRef.current.currentTime = 0;
    void videoRef.current.play().catch(() => {
      // Muted autoplay can still be blocked on some WebView settings; the video remains visible.
    });
  }, [video, videoFailed]);

  if (catalogExercise === undefined) {
    return (
      <div className="sl-input mt-4 overflow-hidden rounded-[24px] p-4">
        <div className="h-44 animate-pulse rounded-2xl bg-[var(--theme-accent-soft)]" />
      </div>
    );
  }

  if (!catalogExercise) {
    return (
      <div className="sl-input mt-4 rounded-[24px] p-4">
        <p className="sl-muted text-[10px] font-black uppercase tracking-[0.24em]">Technika</p>
        <p className="sl-muted mt-2 text-sm leading-relaxed">
          Dla ćwiczenia „{exerciseName}” nie ma jeszcze szczegółowego wpisu w katalogu.
        </p>
      </div>
    );
  }

  const poster = video ? createExerciseVideoPoster(exerciseName, video.sourceName) : "";

  return (
    <div className="mt-4 space-y-3">
      {video ? (
        <div className="sl-input overflow-hidden rounded-[24px] shadow-[0_0_34px_color-mix(in_srgb,var(--theme-accent)_10%,transparent)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--theme-border)] px-3 py-2">
            <span className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em]">Podgląd techniki</span>
            <span className="sl-muted text-[9px] font-black uppercase tracking-widest">{video.sourceName}</span>
          </div>
          {videoFailed ? (
            <img
              className="aspect-video w-full max-h-[min(34vh,260px)] bg-[var(--theme-progress-track)] object-cover"
              src={poster}
              alt={`Miniatura filmu: ${exerciseName}`}
            />
          ) : (
            <video
              key={video.url}
              ref={videoRef}
              className="aspect-video w-full max-h-[min(34vh,260px)] bg-[var(--theme-progress-track)] object-contain"
              src={video.url}
              autoPlay
              muted
              loop
              playsInline
              poster={poster}
              preload="metadata"
              aria-label={`Automatyczny podgląd techniki: ${exerciseName}`}
              onError={() => setVideoFailed(true)}
            />
          )}
          <div className="flex items-center justify-between gap-3 border-t border-[var(--theme-border)] px-3 py-2">
            <span className="sl-muted text-[9px] font-black uppercase tracking-widest">Auto loop · wyciszone</span>
            {video.sourcePageUrl && (
              <a
                href={video.sourcePageUrl}
                target="_blank"
                rel="noreferrer"
                className="sl-link text-[9px] font-black uppercase tracking-widest active:scale-[0.98]"
              >
                Źródło
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="sl-input rounded-[24px] p-4">
          <p className="sl-muted text-[10px] font-black uppercase tracking-[0.24em]">Podgląd techniki</p>
          <p className="sl-muted mt-2 text-sm leading-relaxed">Brak bezpośredniego filmu dla tego ćwiczenia.</p>
        </div>
      )}

      <div className="sl-input rounded-[24px] p-4">
        <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.24em]">Instrukcja wykonania</p>
        <ol className="mt-3 space-y-2">
          {catalogExercise.steps.slice(0, 3).map((step, index) => (
            <li key={step} className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm leading-relaxed text-[var(--theme-text)]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--theme-accent)] text-[10px] font-black text-[var(--theme-text-inverse)]">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SessionTechniqueList title="Technika" items={catalogExercise.techniqueCues} accent="cyan" />
        <SessionTechniqueList title="Unikaj" items={catalogExercise.commonMistakes} accent="amber" />
      </div>

      {catalogExercise.safetyNotes.length > 0 && (
        <div className="sl-alert-danger rounded-2xl p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--theme-danger-text)]">Bezpieczeństwo</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--theme-danger-text)]">{catalogExercise.safetyNotes[0]}</p>
        </div>
      )}
    </div>
  );
}

function SessionTechniqueList({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "cyan" | "amber";
}) {
  const titleClass = accent === "cyan" ? "sl-kicker" : "text-[var(--theme-warning-text)]";
  const dotClass = accent === "cyan" ? "bg-[var(--theme-accent)]" : "bg-[var(--theme-warning)]";

  return (
    <div className="sl-input rounded-2xl p-3">
      <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${titleClass}`}>{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.slice(0, 4).map((item) => (
          <li key={item} className="sl-muted flex gap-2 text-sm leading-relaxed">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function calculateVisibleSeconds(session: WorkoutPlanSession, now: Date) {
  const end = session.completedAt ? new Date(session.completedAt) : now;
  const rawSeconds = Math.max(0, Math.round((end.getTime() - new Date(session.startedAt).getTime()) / 1000));
  const currentPause = session.pausedAt ? Math.max(0, Math.round((end.getTime() - new Date(session.pausedAt).getTime()) / 1000)) : 0;
  return Math.max(0, rawSeconds - session.totalPausedSeconds - currentPause);
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function formatPace(estimatedSeconds: number, activeSeconds: number) {
  if (estimatedSeconds <= 0 || activeSeconds <= 0) return "0%";
  const pace = Math.round(((estimatedSeconds - activeSeconds) / estimatedSeconds) * 100);
  return `${pace > 0 ? "+" : ""}${pace}%`;
}

function getPaceText(summary: WorkoutPlanSessionSummary) {
  if (summary.paceGrade === "tooFast") {
    return "Czas był zbyt krótki względem szacunku. Wynik zapisany, ale bez bonusu za tempo.";
  }
  if (summary.pacePercent > 0) {
    return `Zrobione szybciej niż szacowany czas o ${summary.pacePercent}%.`;
  }
  if (summary.pacePercent < 0) {
    return `Zrobione wolniej niż szacowany czas o ${Math.abs(summary.pacePercent)}%.`;
  }
  return "Tempo zgodne z szacowanym czasem planu.";
}
