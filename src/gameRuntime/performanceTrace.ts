export type FrameTraceSample = {
  timestamp: number;
  fps: number;
  averageFps: number;
  minFps: number;
  frameMs: number;
  p95Ms: number;
  p99Ms: number;
  stutters25: number;
  stutters33: number;
  mode: "app" | "game";
};

export type FrameTraceSummary = {
  samples: number;
  latestFps: number;
  averageFps: number;
  minFps: number;
  worstFrameMs: number;
  p95FrameMs: number;
  p99FrameMs: number;
  stutters25: number;
  stutters33: number;
};

export type FrameTraceBuffer = {
  push(sample: FrameTraceSample): void;
  all(): FrameTraceSample[];
  summary(): FrameTraceSummary;
  clear(): void;
};

const DEFAULT_TRACE_CAPACITY = 720;

type GlobalWithFrameTrace = typeof globalThis & {
  __soloFrameTrace?: FrameTraceBuffer;
};

export function createFrameTraceBuffer(capacity = DEFAULT_TRACE_CAPACITY): FrameTraceBuffer {
  const samples: FrameTraceSample[] = [];
  const safeCapacity = Math.max(1, Math.floor(capacity));

  return {
    push(sample) {
      if (!Number.isFinite(sample.timestamp) || !Number.isFinite(sample.frameMs)) return;
      samples.push({
        ...sample,
        fps: Math.max(0, sample.fps),
        averageFps: Math.max(0, sample.averageFps),
        minFps: Math.max(0, sample.minFps),
        frameMs: Math.max(0, sample.frameMs),
        p95Ms: Math.max(0, sample.p95Ms),
        p99Ms: Math.max(0, sample.p99Ms),
        stutters25: Math.max(0, Math.floor(sample.stutters25)),
        stutters33: Math.max(0, Math.floor(sample.stutters33)),
      });

      if (samples.length > safeCapacity) {
        samples.splice(0, samples.length - safeCapacity);
      }
    },
    all() {
      return [...samples];
    },
    summary() {
      if (samples.length === 0) {
        return {
          samples: 0,
          latestFps: 0,
          averageFps: 0,
          minFps: 0,
          worstFrameMs: 0,
          p95FrameMs: 0,
          p99FrameMs: 0,
          stutters25: 0,
          stutters33: 0,
        };
      }

      const totalFps = samples.reduce((sum, sample) => sum + sample.fps, 0);
      return {
        samples: samples.length,
        latestFps: samples[samples.length - 1].fps,
        averageFps: totalFps / samples.length,
        minFps: Math.min(...samples.map((sample) => sample.minFps || sample.fps)),
        worstFrameMs: Math.max(...samples.map((sample) => sample.frameMs)),
        p95FrameMs: Math.max(...samples.map((sample) => sample.p95Ms)),
        p99FrameMs: Math.max(...samples.map((sample) => sample.p99Ms)),
        stutters25: Math.max(...samples.map((sample) => sample.stutters25)),
        stutters33: Math.max(...samples.map((sample) => sample.stutters33)),
      };
    },
    clear() {
      samples.length = 0;
    },
  };
}

export function getGlobalFrameTraceBuffer() {
  const globalWithTrace = globalThis as GlobalWithFrameTrace;
  if (!globalWithTrace.__soloFrameTrace) {
    globalWithTrace.__soloFrameTrace = createFrameTraceBuffer();
  }
  return globalWithTrace.__soloFrameTrace;
}
