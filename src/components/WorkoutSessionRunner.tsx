import React, { useEffect, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FastForward,
  Minus,
  Pause,
  Play,
  Plus,
  Smartphone,
  Timer,
  Trophy,
  X,
} from "lucide-react";
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
import {
  lockAppLandscape,
  lockAppPortrait,
  unlockAppOrientation,
} from "../services/orientationService";
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
  const [orientationMode, setOrientationMode] = useState<"auto" | "landscape" | "portrait">("auto");
  const requestCloseRef = useRef(() => setCloseConfirm(true));
  const exercise = getCurrentSessionExercise(session);
  const totalSets = getSessionTotalSets(session);
  const completedSets = getSessionCompletedSets(session);
  const progress = totalSets > 0 ? Math.min(100, (session.results.length / totalSets) * 100) : 0;
  const activeSeconds = calculateVisibleSeconds(session, now);
  const restSecondsLeft = session.restEndsAt
    ? Math.max(0, Math.ceil((new Date(session.restEndsAt).getTime() - now.getTime()) / 1000))
    : 0;
  const isFinished = session.status === "completed" || session.status === "cancelled";
  const summary = isFinished ? summarizeWorkoutSession(session) : null;

  const [customReps, setCustomReps] = useState<number>(10);
  const [customWeight, setCustomWeight] = useState<number>(0);

  useEffect(() => {
    if (exercise) {
      setCustomReps(exercise.targetReps);
      setCustomWeight(exercise.weightKg);
    }
  }, [exercise?.catalogExerciseId, session.setIndex]);

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
    if (orientationMode === "auto") {
      void unlockAppOrientation();
    } else if (orientationMode === "landscape") {
      void lockAppLandscape();
    } else {
      void lockAppPortrait();
    }
    return () => {
      void lockAppPortrait();
    };
  }, [orientationMode]);

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
    const customResult = {
      reps: customReps,
      weightKg: customWeight,
    };
    const next = completeCurrentSessionSet(session, previousSummaries, customResult);
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

  const toggleOrientation = () => {
    setOrientationMode((prev) => {
      if (prev === "auto") return "landscape";
      if (prev === "landscape") return "portrait";
      return "auto";
    });
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
      className="workout-session-runner fixed inset-0 z-50 overflow-hidden bg-[var(--theme-game-bg)] text-[var(--theme-text)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--theme-accent)_18%,transparent),transparent_42%),var(--theme-game-bg)]" />

      <div className="workout-session-shell relative z-10 mx-auto flex h-full w-full max-w-[min(100vw,1200px)] flex-col px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-[max(env(safe-area-inset-top),0.5rem)] sm:px-5">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--theme-border)]/40 pb-2">
          <div className="flex items-center gap-3">
            <div>
              <p className="sl-kicker text-[9px] font-black uppercase tracking-[0.28em] text-[var(--theme-accent)]">
                Aktywna sesja
              </p>
              <h2 className="workout-session-header-title font-black uppercase leading-tight tracking-[0.06em] text-[var(--theme-text-strong)] text-base sm:text-lg">
                Plan Treningowy Łowcy
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)]/70 px-3 py-1.5 font-mono text-xs font-bold text-[var(--theme-text)] sm:flex">
              <Timer className="h-3.5 w-3.5 text-[var(--theme-icon)]" />
              <span>{formatDuration(activeSeconds)}</span>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)]/70 px-3 py-1.5 font-mono text-xs font-bold text-[var(--theme-text)] sm:flex">
              <span className="text-[var(--theme-accent)] font-black">Serie:</span>
              <span>
                {completedSets}/{totalSets}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleOrientation}
              className="sl-icon-button flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[10px] font-black uppercase tracking-wider text-[var(--theme-muted)] hover:text-[var(--theme-text)] active:scale-[0.96]"
              title="Przełącz orientację (Auto / Poziomo / Pionowo)"
            >
              <Smartphone className="h-4 w-4 text-[var(--theme-icon)]" />
              <span className="hidden sm:inline">
                {orientationMode === "auto" ? "Auto" : orientationMode === "landscape" ? "Poziom" : "Pion"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => requestCloseRef.current()}
              className="workout-session-close sl-icon-button flex h-9 w-9 items-center justify-center rounded-xl active:scale-[0.96]"
              aria-label="Zamknij sesję"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="workout-session-progress sl-progress-track my-2 h-1.5 overflow-hidden rounded-full shrink-0">
          <div
            className="sl-progress-fill h-full rounded-full shadow-[0_0_15px_color-mix(in_srgb,var(--theme-accent)_60%,transparent)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <main className="workout-session-main relative flex min-h-0 flex-1 overflow-hidden">
          {summary ? (
            <div className="sl-card flex min-h-full flex-1 items-center justify-center rounded-[24px] p-6 text-center shadow-2xl">
              <div>
                <Trophy className="mx-auto h-12 w-12 text-[var(--theme-icon)]" />
                <p className="sl-kicker mt-3 text-[10px] font-black uppercase tracking-[0.28em]">
                  Raport gotowy
                </p>
                <p className="sl-muted mt-2 text-sm">Wynik sesji zapisany w historii.</p>
              </div>
            </div>
          ) : exercise ? (
            <div className="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-y-auto landscape:grid-cols-[1.1fr_0.9fr] landscape:gap-4 landscape:overflow-hidden sm:gap-4">
              <div className="flex h-full min-h-0 min-w-0 flex-col overflow-y-auto rounded-[24px] border border-[var(--theme-border)] bg-[var(--theme-card)]/85 p-3.5 shadow-xl sm:p-4 custom-scrollbar">
                <div className="flex items-start justify-between gap-3 pb-2">
                  <div className="min-w-0">
                    <span className="sl-chip rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[var(--theme-accent)]">
                      {exercise.category}
                    </span>
                    <h1 className="workout-session-title mt-1.5 line-clamp-2 break-words text-lg font-black uppercase tracking-[0.03em] text-[var(--theme-text-strong)] sm:text-xl">
                      {exercise.name}
                    </h1>
                    <p className="sl-muted mt-0.5 line-clamp-1 text-xs font-bold">
                      {exercise.goal} · {exercise.targetArea}
                    </p>
                  </div>
                  <div className="workout-session-set-badge sl-chip-active shrink-0 rounded-2xl px-3 py-1.5 text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest">Seria</p>
                    <p className="font-mono text-base font-black text-[var(--theme-text-strong)]">
                      {session.setIndex + 1}/{exercise.targetSets}
                    </p>
                  </div>
                </div>

                <div className="mt-2 min-h-0 flex-1">
                  <SessionTechniqueGuide
                    catalogExerciseId={exercise.catalogExerciseId}
                    exerciseName={exercise.name}
                  />
                </div>

                {exercise.notes && (
                  <div className="sl-input mt-3 shrink-0 rounded-xl p-2.5">
                    <p className="sl-muted text-[9px] font-black uppercase tracking-[0.24em]">
                      Notatka
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text)]">
                      {exercise.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex h-full min-h-0 min-w-0 flex-col justify-between rounded-[24px] border border-[var(--theme-border)] bg-[var(--theme-card)]/90 p-3.5 shadow-xl sm:p-4">
                {session.status === "resting" ? (
                  <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-amber-400/50 bg-amber-950/40 shadow-[0_0_30px_rgba(245,158,11,0.25)] sm:h-36 sm:w-36">
                      <Timer className="absolute -top-3 h-6 w-6 text-amber-400" />
                      <span className="font-mono text-4xl font-black text-amber-300 sm:text-5xl">
                        {restSecondsLeft}s
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.24em] text-amber-400">
                      Czas Przerwy
                    </p>
                    <p className="sl-muted mt-1 text-xs">
                      Zregeneruj siły przed serią {session.setIndex + 1}/{exercise.targetSets}
                    </p>

                    <button
                      type="button"
                      onClick={() => onSave(advanceSessionAfterRest(session))}
                      className="sl-button-primary mt-5 flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black uppercase tracking-widest active:scale-[0.98]"
                    >
                      <span>Przejdź do serii</span>
                      <FastForward className="h-4 w-4" />
                    </button>
                  </div>
                ) : session.status === "paused" ? (
                  <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-icon)]">
                      <Pause className="h-8 w-8" />
                    </div>
                    <h3 className="mt-3 text-base font-black uppercase tracking-wider text-[var(--theme-text-strong)]">
                      Sesja Wstrzymana
                    </h3>
                    <p className="sl-muted mt-1 text-xs">Czas aktywny nie rośnie.</p>

                    <button
                      type="button"
                      onClick={togglePause}
                      className="sl-button-primary mt-5 flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black uppercase tracking-widest active:scale-[0.98]"
                    >
                      <Play className="h-4 w-4" />
                      <span>Wznów trening</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex h-full min-h-0 flex-col justify-between gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <SessionStat label="Czas" value={formatDuration(activeSeconds)} />
                      <SessionStat
                        label="Seria"
                        value={`${session.setIndex + 1}/${exercise.targetSets}`}
                      />
                      <SessionStat
                        label="Tempo"
                        value={formatPace(session.estimatedSeconds, activeSeconds)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 my-auto">
                      <div className="sl-stat-tile flex flex-col justify-between rounded-2xl p-3">
                        <span className="sl-kicker text-[9px] font-black uppercase tracking-[0.24em]">
                          Powtórzenia
                        </span>
                        <div className="my-1.5 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setCustomReps((r) => Math.max(1, r - 1))}
                            className="sl-button-secondary flex h-8 w-8 items-center justify-center rounded-xl active:scale-[0.92]"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="font-mono text-2xl font-black text-[var(--theme-text-strong)] sm:text-3xl">
                            {customReps}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomReps((r) => r + 1)}
                            className="sl-button-secondary flex h-8 w-8 items-center justify-center rounded-xl active:scale-[0.92]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="sl-muted text-center text-[9px] font-bold">
                          Cel: {exercise.targetReps} powt.
                        </span>
                      </div>

                      <div className="sl-stat-tile flex flex-col justify-between rounded-2xl p-3">
                        <span className="sl-kicker text-[9px] font-black uppercase tracking-[0.24em]">
                          Ciężar
                        </span>
                        <div className="my-1.5 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setCustomWeight((w) => Math.max(0, w - (w > 10 ? 2.5 : 1)))}
                            className="sl-button-secondary flex h-8 w-8 items-center justify-center rounded-xl active:scale-[0.92]"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="font-mono text-xl font-black text-[var(--theme-text-strong)] sm:text-2xl">
                            {customWeight > 0 ? `${customWeight} kg` : "masa"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomWeight((w) => w + (w >= 10 ? 2.5 : 1))}
                            className="sl-button-secondary flex h-8 w-8 items-center justify-center rounded-xl active:scale-[0.92]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="sl-muted text-center text-[9px] font-bold">
                          {exercise.weightKg > 0 ? `Domyślnie: ${exercise.weightKg}kg` : "Masa ciała"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={completeSet}
                        disabled={session.status !== "active"}
                        className="sl-button-primary flex min-h-14 sm:min-h-16 w-full items-center justify-center gap-3 rounded-2xl px-4 text-base sm:text-lg font-black uppercase tracking-widest shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all active:scale-[0.97]"
                      >
                        <CheckCircle2 className="h-6 w-6 text-cyan-300" />
                        <span>SERIA ZROBIONA</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={togglePause}
                          className="sl-button-secondary flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider active:scale-[0.98]"
                        >
                          <Pause className="h-3.5 w-3.5" />
                          <span>Pauza</span>
                        </button>
                        <button
                          type="button"
                          onClick={skipSet}
                          disabled={session.status !== "active"}
                          className="sl-alert-warning flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider text-[var(--theme-warning-text)] disabled:opacity-100 active:scale-[0.98]"
                        >
                          <FastForward className="h-3.5 w-3.5" />
                          <span>Pomiń serię</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>

      <AnimatePresence>
        {summary && (
          <motion.div
            className="sl-modal-backdrop absolute inset-0 z-20 flex items-center justify-center p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="workout-summary-modal sl-modal w-full max-w-[min(92vw,520px)] rounded-[26px] border shadow-2xl p-4 sm:p-5"
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
            >
              <SessionSummary summary={summary} onClose={onCloseSummary} />
            </motion.div>
          </motion.div>
        )}
        {closeConfirm && (
          <motion.div
            className="sl-modal-backdrop absolute inset-0 z-20 flex items-center justify-center p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="sl-modal w-full max-w-sm rounded-[26px] border p-5 shadow-2xl"
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
            >
              <h3 className="text-xl font-black uppercase tracking-[0.08em] text-[var(--theme-text-strong)]">
                Zakończyć sesję?
              </h3>
              <p className="sl-muted mt-2 text-sm leading-relaxed">
                Możesz wrócić do ćwiczeń, zapisać częściowy wynik bez nagrody albo anulować sesję.
              </p>
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={() => setCloseConfirm(false)}
                  className="sl-button-primary min-h-12 rounded-2xl text-sm font-black uppercase tracking-widest active:scale-[0.98]"
                >
                  Wróć do sesji
                </button>
                <button
                  type="button"
                  onClick={savePartial}
                  className="sl-button-secondary min-h-12 rounded-2xl text-sm font-black uppercase tracking-widest active:scale-[0.98]"
                >
                  Zapisz bez nagrody
                </button>
                <button
                  type="button"
                  onClick={discard}
                  className="min-h-12 rounded-2xl border border-[color-mix(in_srgb,var(--theme-danger)_38%,transparent)] bg-[var(--theme-danger-soft)] text-sm font-black uppercase tracking-widest text-[var(--theme-danger-text)] active:scale-[0.98]"
                >
                  Anuluj wynik
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SessionSummary({
  summary,
  onClose,
}: {
  summary: WorkoutPlanSessionSummary;
  onClose: () => void;
}) {
  return (
    <div className="workout-summary-content flex flex-col text-center">
      <div className="flex items-start justify-between gap-3 text-left">
        <div>
          <p className="sl-kicker text-[10px] font-black uppercase tracking-[0.28em]">
            Raport systemu
          </p>
          <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.06em] text-[var(--theme-text-strong)]">
            Plan zapisany
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="sl-icon-button grid h-10 w-10 shrink-0 place-items-center rounded-2xl active:scale-[0.98]"
          aria-label="Zamknij raport"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mx-auto rounded-full border border-[var(--theme-border)] bg-[var(--theme-accent-soft)] p-5 mt-3">
        <Trophy className="h-10 w-10 text-[var(--theme-icon)]" />
      </div>
      <p className="sl-muted mt-3 text-sm leading-relaxed">{getPaceText(summary)}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-left">
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
      <button
        type="button"
        onClick={onClose}
        className="sl-button-primary mt-4 min-h-12 rounded-2xl px-4 text-sm font-black uppercase tracking-widest active:scale-[0.98]"
      >
        Zamknij raport
      </button>
    </div>
  );
}

function SessionStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="sl-stat-tile rounded-2xl p-2 sm:p-2.5">
      <p className="sl-muted text-[8px] sm:text-[9px] font-black uppercase tracking-widest">{label}</p>
      <p className="workout-session-stat-value mt-0.5 font-mono text-xs sm:text-sm font-black text-[var(--theme-text-strong)] truncate">
        {value}
      </p>
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
  const [catalogExercise, setCatalogExercise] = useState<SessionCatalogExercise | null | undefined>(
    undefined
  );
  const [showTips, setShowTips] = useState(false);
  const video = catalogExercise?.media.find((media) => media.type === "video") ?? null;

  useEffect(() => {
    let cancelled = false;
    setCatalogExercise(undefined);

    void import("../data/exerciseCatalog")
      .then(({ EXERCISE_CATALOG }) => {
        if (cancelled) return;
        const exercise = EXERCISE_CATALOG.find((item) => item.id === catalogExerciseId);
        setCatalogExercise(
          exercise
            ? {
                steps: exercise.steps,
                techniqueCues: exercise.techniqueCues,
                commonMistakes: exercise.commonMistakes,
                safetyNotes: exercise.safetyNotes,
                media: exercise.media,
              }
            : null
        );
      })
      .catch(() => {
        if (!cancelled) setCatalogExercise(null);
      });

    return () => {
      cancelled = true;
    };
  }, [catalogExerciseId]);

  useEffect(() => {
    if (!videoRef.current || !video) return;
    videoRef.current.currentTime = 0;
    void videoRef.current.play().catch(() => {});
  }, [video]);

  if (catalogExercise === undefined) {
    return (
      <div className="sl-input mt-2 overflow-hidden rounded-[20px] p-4">
        <div className="h-36 animate-pulse rounded-xl bg-[var(--theme-accent-soft)]" />
      </div>
    );
  }

  if (!catalogExercise) {
    return (
      <div className="sl-input mt-2 rounded-[20px] p-3 text-center">
        <p className="sl-muted text-xs leading-relaxed">
          Dla ćwiczenia „{exerciseName}” podgląd wideo jest obecnie niedostępny.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {video ? (
        <div className="sl-input overflow-hidden rounded-[20px] border border-[var(--theme-border)] shadow-[0_0_20px_color-mix(in_srgb,var(--theme-accent)_10%,transparent)]">
          <video
            key={video.url}
            ref={videoRef}
            className="aspect-video w-full max-h-[min(38vh,280px)] bg-black/40 object-contain"
            src={video.url}
            autoPlay
            muted
            loop
            playsInline
            poster={createExerciseVideoPoster(exerciseName, video.sourceName)}
            preload="metadata"
            aria-label={`Automatyczny podgląd techniki: ${exerciseName}`}
          />
          <div className="flex items-center justify-between border-t border-[var(--theme-border)]/50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--theme-muted)]">
            <span>{video.sourceName}</span>
            <span>Auto loop · Wyciszone</span>
          </div>
        </div>
      ) : (
        <div className="sl-input rounded-[20px] p-3 text-center">
          <p className="sl-muted text-xs">Brak bezpośredniego filmu dla tego ćwiczenia.</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowTips(!showTips)}
        className="sl-input flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-[10px] font-black uppercase tracking-widest text-[var(--theme-text)] active:scale-[0.99]"
      >
        <span className="sl-kicker text-[9px] font-black uppercase tracking-wider">
          {showTips ? "Ukryj wskazówki techniki" : "Pokaż wskazówki techniki i błędy"}
        </span>
        {showTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showTips && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2 pt-1"
        >
          <div className="sl-input rounded-xl p-3">
            <p className="sl-kicker text-[9px] font-black uppercase tracking-[0.24em]">
              Instrukcja wykonania
            </p>
            <ol className="mt-2 space-y-1.5">
              {catalogExercise.steps.slice(0, 3).map((step, index) => (
                <li
                  key={step}
                  className="grid grid-cols-[1.2rem_1fr] gap-2 text-xs leading-relaxed text-[var(--theme-text)]"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--theme-accent)] text-[9px] font-black text-[var(--theme-text-inverse)]">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <SessionTechniqueList
              title="Wskazówki"
              items={catalogExercise.techniqueCues}
              accent="cyan"
            />
            <SessionTechniqueList
              title="Czego unikać"
              items={catalogExercise.commonMistakes}
              accent="amber"
            />
          </div>

          {catalogExercise.safetyNotes.length > 0 && (
            <div className="sl-alert-danger rounded-xl p-2.5">
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[var(--theme-danger-text)]">
                Bezpieczeństwo
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--theme-danger-text)]">
                {catalogExercise.safetyNotes[0]}
              </p>
            </div>
          )}
        </motion.div>
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
    <div className="sl-input rounded-xl p-2.5">
      <p className={`text-[9px] font-black uppercase tracking-[0.24em] ${titleClass}`}>{title}</p>
      <ul className="mt-1.5 space-y-1">
        {items.slice(0, 3).map((item) => (
          <li key={item} className="sl-muted flex gap-2 text-xs leading-relaxed">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function calculateVisibleSeconds(session: WorkoutPlanSession, now: Date) {
  const end = session.completedAt ? new Date(session.completedAt) : now;
  const rawSeconds = Math.max(
    0,
    Math.round((end.getTime() - new Date(session.startedAt).getTime()) / 1000)
  );
  const currentPause = session.pausedAt
    ? Math.max(0, Math.round((end.getTime() - new Date(session.pausedAt).getTime()) / 1000))
    : 0;
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
  const pace = Math.max(
    -99,
    Math.min(99, Math.round(((estimatedSeconds - activeSeconds) / estimatedSeconds) * 100))
  );
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
