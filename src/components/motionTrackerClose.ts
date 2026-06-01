import type { TrackableExerciseId } from "../sensors/motionTracking";

export function getTrackedCommitValue(exerciseId: TrackableExerciseId, rawValue: number) {
  return exerciseId === "runningKm" ? Number(rawValue.toFixed(2)) : Math.floor(rawValue);
}

export function shouldConfirmTrackerClose(exerciseId: TrackableExerciseId, rawValue: number) {
  return getTrackedCommitValue(exerciseId, rawValue) > 0;
}
