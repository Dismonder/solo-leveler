export type TrackableExerciseId = "pushups" | "situps" | "squats" | "runningKm";

export type MotionTrackerProfile = {
  id: TrackableExerciseId;
  label: string;
  unit: string;
  mode: "cycle" | "peak";
  movementPattern: "burstCycle" | "bodyAngleCycle" | "stepPeak";
  placementHint: string;
  activationDelta: number;
  releaseDelta: number;
  activationRange?: number;
  releaseRange?: number;
  minIntervalMs: number;
  minCycleMs?: number;
  maxCycleMs?: number;
  minBurstsPerCycle?: number;
  rejectShake?: boolean;
  valuePerPeak: number;
};

export type MotionTrackerState = {
  baseline: number | null;
  baselineVector: MotionVector | null;
  armed: boolean;
  lastPeakAt: number;
  phase: "idle" | "moving";
  motionStartedAt: number;
  lastCountAt: number;
  peakIntensity: number;
  peakAngle: number;
  burstCount: number;
  aboveActivation: boolean;
  lastIntensity: number;
  lastAngle: number;
};

export type MotionSample = {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  linearMagnitude?: number;
};

export type MotionVector = {
  x: number;
  y: number;
  z: number;
};

export const MOTION_TRACKER_PROFILES: Record<TrackableExerciseId, MotionTrackerProfile> = {
  pushups: {
    id: "pushups",
    label: "Pompki",
    unit: "powt.",
    mode: "cycle",
    movementPattern: "burstCycle",
    placementHint: "Telefon przy ciele lub na stabilnej opasce. Kalibracja w pozycji startowej, bez trzymania telefonu w dłoni.",
    activationDelta: 2.6,
    releaseDelta: 0.75,
    minIntervalMs: 1350,
    minCycleMs: 450,
    maxCycleMs: 5000,
    minBurstsPerCycle: 2,
    valuePerPeak: 1,
  },
  situps: {
    id: "situps",
    label: "Brzuszki",
    unit: "powt.",
    mode: "cycle",
    movementPattern: "bodyAngleCycle",
    placementHint: "Telefon przypnij do klatki, górnego brzucha albo pasa. Kalibruj leżąc w pozycji dolnej brzuszka.",
    activationDelta: 1.15,
    releaseDelta: 0.55,
    activationRange: 27,
    releaseRange: 11,
    minIntervalMs: 1150,
    minCycleMs: 700,
    maxCycleMs: 7000,
    minBurstsPerCycle: 1,
    rejectShake: true,
    valuePerPeak: 1,
  },
  squats: {
    id: "squats",
    label: "Przysiady",
    unit: "powt.",
    mode: "cycle",
    movementPattern: "bodyAngleCycle",
    placementHint: "Telefon trzymaj w przedniej kieszeni albo przy pasie. Kalibruj stojąc prosto przed pierwszym zejściem.",
    activationDelta: 0.95,
    releaseDelta: 0.5,
    activationRange: 16,
    releaseRange: 7,
    minIntervalMs: 1200,
    minCycleMs: 850,
    maxCycleMs: 8000,
    minBurstsPerCycle: 1,
    rejectShake: true,
    valuePerPeak: 1,
  },
  runningKm: {
    id: "runningKm",
    label: "Bieganie",
    unit: "km",
    mode: "peak",
    movementPattern: "stepPeak",
    placementHint: "Telefon w kieszeni lub opasce. System szacuje dystans z rytmu kroków, a dokładniejsze dane importuj z Health Connect.",
    activationDelta: 1.75,
    releaseDelta: 0.75,
    minIntervalMs: 260,
    valuePerPeak: 0.00075,
  },
};

export function createMotionTrackerState(
  baseline: number | null = null,
  startAt: number = 0,
  baselineVector: MotionVector | null = null
): MotionTrackerState {
  return {
    baseline,
    baselineVector,
    armed: true,
    lastPeakAt: startAt,
    phase: "idle",
    motionStartedAt: 0,
    lastCountAt: startAt,
    peakIntensity: 0,
    peakAngle: 0,
    burstCount: 0,
    aboveActivation: false,
    lastIntensity: 0,
    lastAngle: 0,
  };
}

export function getMotionMagnitude(sample: Pick<MotionSample, "x" | "y" | "z">) {
  return Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z);
}

export function getBaseline(samples: Array<Pick<MotionSample, "x" | "y" | "z">>) {
  if (samples.length === 0) return 9.81;
  const total = samples.reduce((sum, sample) => sum + getMotionMagnitude(sample), 0);
  return total / samples.length;
}

export function getBaselineVector(samples: Array<Pick<MotionSample, "x" | "y" | "z">>): MotionVector {
  if (samples.length === 0) return { x: 0, y: 0, z: 9.81 };
  const total = samples.reduce(
    (sum, sample) => ({
      x: sum.x + sample.x,
      y: sum.y + sample.y,
      z: sum.z + sample.z,
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: total.x / samples.length,
    y: total.y / samples.length,
    z: total.z / samples.length,
  };
}

function getVectorAngleDegrees(sample: MotionVector, baselineVector: MotionVector | null) {
  if (!baselineVector) return 0;

  const sampleMagnitude = getMotionMagnitude(sample);
  const baselineMagnitude = getMotionMagnitude(baselineVector);
  if (sampleMagnitude <= 0.001 || baselineMagnitude <= 0.001) return 0;

  const dot = sample.x * baselineVector.x + sample.y * baselineVector.y + sample.z * baselineVector.z;
  const normalized = Math.max(-1, Math.min(1, dot / (sampleMagnitude * baselineMagnitude)));
  return Math.acos(normalized) * (180 / Math.PI);
}

export function processMotionSample(
  state: MotionTrackerState,
  profile: MotionTrackerProfile,
  sample: MotionSample
) {
  const baseline = state.baseline ?? 9.81;
  const magnitude = getMotionMagnitude(sample);
  const gravityIntensity = Math.abs(magnitude - baseline);
  const linearIntensity = typeof sample.linearMagnitude === "number" && Number.isFinite(sample.linearMagnitude)
    ? Math.abs(sample.linearMagnitude)
    : null;
  const intensity = linearIntensity ?? gravityIntensity;
  const angle = getVectorAngleDegrees(sample, state.baselineVector);
  const enoughTimePassed = sample.timestamp - state.lastPeakAt >= profile.minIntervalMs;
  let nextState = state;
  let delta = 0;

  if (profile.mode === "peak") {
    if (state.armed && enoughTimePassed && intensity >= profile.activationDelta) {
      delta = profile.valuePerPeak;
      nextState = {
        ...state,
        armed: false,
        lastPeakAt: sample.timestamp,
        lastCountAt: sample.timestamp,
        lastIntensity: intensity,
      };
    } else if (!state.armed && intensity <= profile.releaseDelta) {
      nextState = {
        ...state,
        armed: true,
        lastIntensity: intensity,
      };
    } else {
      nextState = {
        ...state,
        lastIntensity: intensity,
      };
    }
  } else if (profile.movementPattern === "bodyAngleCycle") {
    const minCycleMs = profile.minCycleMs ?? 700;
    const maxCycleMs = profile.maxCycleMs ?? 7000;
    const activationAngle = profile.activationRange ?? 20;
    const releaseAngle = profile.releaseRange ?? 8;
    const canStartCycle = sample.timestamp - state.lastCountAt >= profile.minIntervalMs;
    const activeBodyAngle = angle >= activationAngle;
    const returnedToStart = angle <= releaseAngle;
    const shakeLike = profile.rejectShake && linearIntensity !== null && linearIntensity >= profile.activationDelta * 4 && angle < activationAngle;

    if (state.phase === "idle") {
      if (canStartCycle && activeBodyAngle && !shakeLike) {
        nextState = {
          ...state,
          armed: false,
          phase: "moving",
          motionStartedAt: sample.timestamp,
          peakIntensity: intensity,
          peakAngle: angle,
          burstCount: intensity >= profile.activationDelta ? 1 : 0,
          aboveActivation: intensity >= profile.activationDelta,
          lastIntensity: intensity,
          lastAngle: angle,
        };
      } else {
        nextState = {
          ...state,
          armed: canStartCycle,
          lastIntensity: intensity,
          lastAngle: angle,
        };
      }
    } else {
      const cycleAge = sample.timestamp - state.motionStartedAt;
      let burstCount = state.burstCount;
      let aboveActivation = state.aboveActivation;
      const activeBurst = intensity >= profile.activationDelta;
      const released = intensity <= profile.releaseDelta;

      if (released) aboveActivation = false;
      if (activeBurst && !aboveActivation) {
        burstCount += 1;
        aboveActivation = true;
      }

      const peakAngle = Math.max(state.peakAngle, angle);
      const completeCycle = returnedToStart && cycleAge >= minCycleMs && peakAngle >= activationAngle;
      const expiredCycle = cycleAge > maxCycleMs;

      if (completeCycle) {
        delta = profile.valuePerPeak;
        nextState = {
          ...state,
          armed: false,
          phase: "idle",
          lastPeakAt: sample.timestamp,
          lastCountAt: sample.timestamp,
          motionStartedAt: 0,
          peakIntensity: 0,
          peakAngle: 0,
          burstCount: 0,
          aboveActivation: false,
          lastIntensity: intensity,
          lastAngle: angle,
        };
      } else if (expiredCycle) {
        nextState = {
          ...state,
          armed: true,
          phase: "idle",
          motionStartedAt: 0,
          peakIntensity: 0,
          peakAngle: 0,
          burstCount: 0,
          aboveActivation: false,
          lastIntensity: intensity,
          lastAngle: angle,
        };
      } else {
        nextState = {
          ...state,
          armed: false,
          phase: "moving",
          peakIntensity: Math.max(state.peakIntensity, intensity),
          peakAngle,
          burstCount,
          aboveActivation,
          lastIntensity: intensity,
          lastAngle: angle,
        };
      }
    }
  } else {
    const minCycleMs = profile.minCycleMs ?? 450;
    const maxCycleMs = profile.maxCycleMs ?? 6000;
    const minBursts = profile.minBurstsPerCycle ?? 2;
    const canStartCycle = sample.timestamp - state.lastCountAt >= profile.minIntervalMs;
    const activeBurst = intensity >= profile.activationDelta;
    const released = intensity <= profile.releaseDelta;

    if (state.phase === "idle") {
      if (canStartCycle && activeBurst) {
        nextState = {
          ...state,
          armed: false,
          phase: "moving",
          motionStartedAt: sample.timestamp,
          peakIntensity: intensity,
          peakAngle: angle,
          burstCount: 1,
          aboveActivation: true,
          lastIntensity: intensity,
          lastAngle: angle,
        };
      } else {
        nextState = {
          ...state,
          armed: canStartCycle,
          lastIntensity: intensity,
          lastAngle: angle,
        };
      }
    } else {
      const cycleAge = sample.timestamp - state.motionStartedAt;
      let burstCount = state.burstCount;
      let aboveActivation = state.aboveActivation;

      if (released) aboveActivation = false;
      if (activeBurst && !aboveActivation) {
        burstCount += 1;
        aboveActivation = true;
      }

      const completeCycle = released && cycleAge >= minCycleMs && burstCount >= minBursts;
      const expiredCycle = cycleAge > maxCycleMs;

      if (completeCycle) {
        delta = profile.valuePerPeak;
        nextState = {
          ...state,
          armed: false,
          phase: "idle",
          lastPeakAt: sample.timestamp,
          lastCountAt: sample.timestamp,
          motionStartedAt: 0,
          peakIntensity: 0,
          peakAngle: 0,
          burstCount: 0,
          aboveActivation: false,
          lastIntensity: intensity,
          lastAngle: angle,
        };
      } else if (expiredCycle) {
        nextState = {
          ...state,
          armed: true,
          phase: "idle",
          motionStartedAt: 0,
          peakIntensity: 0,
          peakAngle: 0,
          burstCount: 0,
          aboveActivation: false,
          lastIntensity: intensity,
          lastAngle: angle,
        };
      } else {
        nextState = {
          ...state,
          armed: false,
          phase: "moving",
          peakIntensity: Math.max(state.peakIntensity, intensity),
          peakAngle: Math.max(state.peakAngle, angle),
          burstCount,
          aboveActivation,
          lastIntensity: intensity,
          lastAngle: angle,
        };
      }
    }
  }

  return {
    state: nextState,
    delta,
    magnitude,
    intensity,
    gravityIntensity,
    linearIntensity,
    angle,
  };
}

export function formatTrackedValue(value: number, profile: MotionTrackerProfile) {
  return profile.id === "runningKm" ? value.toFixed(2) : String(Math.floor(value));
}
