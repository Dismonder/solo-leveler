import type {
  WorkoutPlanExercise,
  WorkoutPlanSession,
  WorkoutPlanSessionExerciseSnapshot,
  WorkoutPlanSessionReward,
  WorkoutPlanSessionSetResult,
  WorkoutPlanSessionSummary,
  WorkoutSessionPaceGrade,
} from "../types";
import { getLocalDateKey } from "./playerMath";

const TRANSITION_SECONDS = 25;
const MIN_WORK_SECONDS_PER_SET = 20;
const SECONDS_PER_REP = 3;

export function startWorkoutPlanSession(plan: WorkoutPlanExercise[], now = new Date()): WorkoutPlanSession | null {
  const exercises = plan.filter((exercise) => exercise.targetSets > 0 && exercise.targetReps > 0);
  if (exercises.length === 0) return null;

  const snapshots = exercises.map((exercise, index): WorkoutPlanSessionExerciseSnapshot => ({
    id: `snapshot_${index}_${exercise.id}`,
    planExerciseId: exercise.id,
    catalogExerciseId: exercise.catalogExerciseId,
    name: exercise.name,
    category: exercise.category,
    equipment: exercise.equipment,
    primaryMuscles: [...exercise.primaryMuscles],
    goal: exercise.goal,
    targetArea: exercise.targetArea,
    notes: exercise.notes,
    order: index,
    targetSets: exercise.targetSets,
    targetReps: exercise.targetReps,
    weightKg: exercise.defaultWeightKg,
    restSeconds: exercise.restSeconds,
  }));

  const timestamp = now.toISOString();
  return {
    id: `session_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    planSignature: createPlanSignature(snapshots),
    status: "active",
    exercises: snapshots,
    exerciseIndex: 0,
    setIndex: 0,
    results: [],
    startedAt: timestamp,
    updatedAt: timestamp,
    currentStepStartedAt: timestamp,
    pausedAt: null,
    totalPausedSeconds: 0,
    restStartedAt: null,
    restEndsAt: null,
    estimatedSeconds: estimateWorkoutPlanSeconds(snapshots),
    completedAt: null,
    reward: null,
  };
}

export function completeCurrentSessionSet(
  session: WorkoutPlanSession,
  previousSummaries: WorkoutPlanSessionSummary[],
  now = new Date()
) {
  if (session.status !== "active") return session;
  return recordCurrentSet(session, previousSummaries, false, now);
}

export function skipCurrentSessionSet(
  session: WorkoutPlanSession,
  previousSummaries: WorkoutPlanSessionSummary[],
  now = new Date()
) {
  if (session.status !== "active") return session;
  return recordCurrentSet(session, previousSummaries, true, now);
}

export function advanceSessionAfterRest(session: WorkoutPlanSession, now = new Date()) {
  if (session.status !== "resting") return session;
  const timestamp = now.toISOString();
  return {
    ...session,
    status: "active" as const,
    updatedAt: timestamp,
    currentStepStartedAt: timestamp,
    restStartedAt: null,
    restEndsAt: null,
  };
}

export function pauseWorkoutSession(session: WorkoutPlanSession, now = new Date()) {
  if (session.status !== "active" && session.status !== "resting") return session;
  const timestamp = now.toISOString();
  return {
    ...session,
    status: "paused" as const,
    pausedAt: timestamp,
    updatedAt: timestamp,
  };
}

export function resumeWorkoutSession(session: WorkoutPlanSession, now = new Date()) {
  if (session.status !== "paused" || !session.pausedAt) return session;

  const pauseSeconds = secondsBetween(session.pausedAt, now.toISOString());
  const timestamp = now.toISOString();
  const restEndsAt = session.restEndsAt ? addSeconds(session.restEndsAt, pauseSeconds).toISOString() : null;
  const nextStatus: WorkoutPlanSession["status"] = restEndsAt ? "resting" : "active";

  return {
    ...session,
    status: nextStatus,
    pausedAt: null,
    totalPausedSeconds: session.totalPausedSeconds + pauseSeconds,
    currentStepStartedAt: addSeconds(session.currentStepStartedAt, pauseSeconds).toISOString(),
    restEndsAt,
    updatedAt: timestamp,
  };
}

export function cancelWorkoutSession(session: WorkoutPlanSession, now = new Date()) {
  const timestamp = now.toISOString();
  return {
    ...session,
    status: "cancelled" as const,
    updatedAt: timestamp,
    completedAt: timestamp,
    reward: zeroReward(session),
  };
}

export function savePartialWorkoutSessionWithoutReward(session: WorkoutPlanSession, now = new Date()) {
  const timestamp = now.toISOString();
  return {
    ...session,
    status: "completed" as const,
    updatedAt: timestamp,
    completedAt: timestamp,
    reward: zeroReward(session),
  };
}

export function summarizeWorkoutSession(session: WorkoutPlanSession): WorkoutPlanSessionSummary {
  const completedAt = session.completedAt ?? session.updatedAt;
  const reward = session.reward ?? zeroReward(session);
  const activeSeconds = calculateSessionActiveSeconds(session, completedAt);
  const completedResults = session.results.filter((result) => !result.skipped);

  return {
    id: session.id,
    planSignature: session.planSignature,
    dateKey: getLocalDateKey(new Date(completedAt)),
    startedAt: session.startedAt,
    completedAt,
    activeSeconds,
    estimatedSeconds: session.estimatedSeconds,
    totalPausedSeconds: session.totalPausedSeconds,
    completedSets: completedResults.length,
    totalSets: getSessionTotalSets(session),
    skippedSets: session.results.filter((result) => result.skipped).length,
    totalReps: completedResults.reduce((sum, result) => sum + result.reps, 0),
    volumeKg: Number(completedResults.reduce((sum, result) => sum + result.reps * result.weightKg, 0).toFixed(1)),
    completionRatio: reward.completionRatio,
    pacePercent: reward.pacePercent,
    paceGrade: reward.paceGrade,
    newRecord: reward.newRecord,
    xpReward: reward.xp,
    goldReward: reward.gold,
    exercises: session.exercises.map((exercise) => ({ ...exercise, primaryMuscles: [...exercise.primaryMuscles] })),
    results: session.results.map((result) => ({ ...result })),
  };
}

export function getCurrentSessionExercise(session: WorkoutPlanSession) {
  return session.exercises[session.exerciseIndex] ?? null;
}

export function getSessionTotalSets(session: Pick<WorkoutPlanSession, "exercises">) {
  return session.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0);
}

export function getSessionCompletedSets(session: Pick<WorkoutPlanSession, "results">) {
  return session.results.filter((result) => !result.skipped).length;
}

export function createPlanSignature(exercises: WorkoutPlanSessionExerciseSnapshot[]) {
  return exercises
    .map((exercise) => [
      exercise.catalogExerciseId,
      exercise.targetSets,
      exercise.targetReps,
      exercise.weightKg,
      exercise.restSeconds,
    ].join(":"))
    .join("|");
}

export function estimateWorkoutPlanSeconds(exercises: WorkoutPlanSessionExerciseSnapshot[]) {
  return exercises.reduce((sum, exercise, exerciseIndex) => {
    const work = exercise.targetSets * Math.max(MIN_WORK_SECONDS_PER_SET, exercise.targetReps * SECONDS_PER_REP);
    const rest = Math.max(0, exercise.targetSets - 1) * exercise.restSeconds;
    const transition = exerciseIndex < exercises.length - 1 ? TRANSITION_SECONDS : 0;
    return sum + work + rest + transition;
  }, 0);
}

function recordCurrentSet(
  session: WorkoutPlanSession,
  previousSummaries: WorkoutPlanSessionSummary[],
  skipped: boolean,
  now: Date
): WorkoutPlanSession {
  const exercise = getCurrentSessionExercise(session);
  if (!exercise) return session;

  const timestamp = now.toISOString();
  const result: WorkoutPlanSessionSetResult = {
    id: `session_set_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    exerciseSnapshotId: exercise.id,
    exerciseIndex: session.exerciseIndex,
    setIndex: session.setIndex,
    reps: skipped ? 0 : exercise.targetReps,
    weightKg: skipped ? 0 : exercise.weightKg,
    skipped,
    startedAt: session.currentStepStartedAt,
    completedAt: timestamp,
    durationSeconds: Math.max(1, secondsBetween(session.currentStepStartedAt, timestamp)),
  };

  const withResult = {
    ...session,
    results: [...session.results, result],
    updatedAt: timestamp,
  };

  const nextPosition = getNextSessionPosition(withResult);
  if (!nextPosition) {
    const reward = calculateWorkoutSessionReward(withResult, previousSummaries, timestamp);
    return {
      ...withResult,
      status: "completed" as const,
      completedAt: timestamp,
      reward,
    };
  }

  const restSeconds = Math.max(0, exercise.restSeconds);
  if (restSeconds > 0) {
    return {
      ...withResult,
      status: "resting" as const,
      exerciseIndex: nextPosition.exerciseIndex,
      setIndex: nextPosition.setIndex,
      restStartedAt: timestamp,
      restEndsAt: addSeconds(timestamp, restSeconds).toISOString(),
    };
  }

  return {
    ...withResult,
    status: "active" as const,
    exerciseIndex: nextPosition.exerciseIndex,
    setIndex: nextPosition.setIndex,
    currentStepStartedAt: timestamp,
    restStartedAt: null,
    restEndsAt: null,
  };
}

function getNextSessionPosition(session: WorkoutPlanSession) {
  const exercise = getCurrentSessionExercise(session);
  if (!exercise) return null;

  const nextSetIndex = session.setIndex + 1;
  if (nextSetIndex < exercise.targetSets) {
    return {
      exerciseIndex: session.exerciseIndex,
      setIndex: nextSetIndex,
    };
  }

  const nextExerciseIndex = session.exerciseIndex + 1;
  if (nextExerciseIndex < session.exercises.length) {
    return {
      exerciseIndex: nextExerciseIndex,
      setIndex: 0,
    };
  }

  return null;
}

function calculateWorkoutSessionReward(
  session: WorkoutPlanSession,
  previousSummaries: WorkoutPlanSessionSummary[],
  completedAt: string
): WorkoutPlanSessionReward {
  const totalSets = getSessionTotalSets(session);
  const completedSets = getSessionCompletedSets(session);
  const skippedSets = session.results.filter((result) => result.skipped).length;
  const completionRatio = totalSets > 0 ? completedSets / totalSets : 0;
  const activeSeconds = calculateSessionActiveSeconds(session, completedAt);
  const pacePercent = session.estimatedSeconds > 0
    ? Math.round(((session.estimatedSeconds - activeSeconds) / session.estimatedSeconds) * 100)
    : 0;
  const paceGrade = getPaceGrade(activeSeconds, session.estimatedSeconds);
  const eligibleForPaceBonus = paceGrade !== "tooFast" && completionRatio >= 1 && skippedSets === 0;
  const newRecord = isNewRecord(session.planSignature, activeSeconds, previousSummaries);
  const totalReps = session.results.filter((result) => !result.skipped).reduce((sum, result) => sum + result.reps, 0);
  const volume = session.results.filter((result) => !result.skipped).reduce((sum, result) => sum + result.reps * result.weightKg, 0);

  let xp = Math.round((totalSets * 8 + totalReps * 0.5 + volume * 0.02) * completionRatio);
  let gold = Math.round(totalSets * 4 * completionRatio);

  if (eligibleForPaceBonus && pacePercent > 0) {
    const speedBonus = Math.min(0.25, pacePercent / 100);
    xp += Math.round(xp * speedBonus);
    gold += Math.round(gold * speedBonus);
  }

  if (newRecord && completionRatio >= 1 && paceGrade !== "tooFast") {
    xp += 20;
    gold += 10;
  }

  if (completionRatio >= 1) {
    xp = Math.max(25, xp);
    gold = Math.max(10, gold);
  }

  return {
    xp,
    gold,
    completionRatio: Number(completionRatio.toFixed(3)),
    completedSets,
    totalSets,
    skippedSets,
    pacePercent,
    paceGrade,
    newRecord,
    eligibleForPaceBonus,
  };
}

function zeroReward(session: WorkoutPlanSession): WorkoutPlanSessionReward {
  const totalSets = getSessionTotalSets(session);
  const completedSets = getSessionCompletedSets(session);
  const completionRatio = totalSets > 0 ? completedSets / totalSets : 0;
  return {
    xp: 0,
    gold: 0,
    completionRatio: Number(completionRatio.toFixed(3)),
    completedSets,
    totalSets,
    skippedSets: session.results.filter((result) => result.skipped).length,
    pacePercent: 0,
    paceGrade: "onPace",
    newRecord: false,
    eligibleForPaceBonus: false,
  };
}

function getPaceGrade(activeSeconds: number, estimatedSeconds: number): WorkoutSessionPaceGrade {
  if (estimatedSeconds <= 0) return "onPace";
  const ratio = activeSeconds / estimatedSeconds;
  if (ratio < 0.5) return "tooFast";
  if (ratio <= 0.9) return "faster";
  if (ratio <= 1.15) return "onPace";
  return "slower";
}

function isNewRecord(planSignature: string, activeSeconds: number, previousSummaries: WorkoutPlanSessionSummary[]) {
  const completedPrevious = previousSummaries.filter((summary) =>
    summary.planSignature === planSignature &&
    summary.completionRatio >= 1 &&
    summary.activeSeconds > 0
  );

  if (completedPrevious.length === 0) return true;
  return activeSeconds < Math.min(...completedPrevious.map((summary) => summary.activeSeconds));
}

function calculateSessionActiveSeconds(session: WorkoutPlanSession, endTimestamp: string) {
  const rawSeconds = secondsBetween(session.startedAt, endTimestamp);
  const currentPauseSeconds = session.pausedAt ? secondsBetween(session.pausedAt, endTimestamp) : 0;
  return Math.max(1, rawSeconds - session.totalPausedSeconds - currentPauseSeconds);
}

function secondsBetween(startIso: string, endIso: string) {
  return Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000));
}

function addSeconds(timestamp: string, seconds: number) {
  return new Date(new Date(timestamp).getTime() + seconds * 1000);
}
