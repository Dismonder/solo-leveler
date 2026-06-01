import type { MiniGameCompletionInput, MiniGameId } from "../game/miniGameProgress";

export type GameRuntimeState = "booting" | "ready" | "running" | "paused" | "finished" | "destroyed";

export type GameRuntimeCommand =
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "stop" }
  | { type: "destroy" };

export type GameRuntimeSnapshot = {
  state: GameRuntimeState;
  score: number;
  combo: number;
  remainingMs: number;
  hpRestored: number;
  hpLoss: number;
};

export type GameRuntimeEvent =
  | { type: "snapshot"; snapshot: GameRuntimeSnapshot }
  | { type: "complete"; result: MiniGameCompletionInput }
  | { type: "pause-requested" }
  | { type: "error"; message: string; cause?: unknown };

export type GameRuntimeMountOptions = {
  target: HTMLElement;
  emit: (event: GameRuntimeEvent) => void;
};

export type GameEngineRuntimeAdapter = {
  id: MiniGameId;
  mount(options: GameRuntimeMountOptions): void;
  dispatch(command: GameRuntimeCommand): void;
  destroy(): void;
};

export function isTerminalGameRuntimeState(state: GameRuntimeState) {
  return state === "finished" || state === "destroyed";
}

export function normalizeGameRuntimeSnapshot(snapshot: Partial<GameRuntimeSnapshot>): GameRuntimeSnapshot {
  return {
    state: snapshot.state ?? "booting",
    score: Math.max(0, Math.floor(snapshot.score ?? 0)),
    combo: Math.max(0, Math.floor(snapshot.combo ?? 0)),
    remainingMs: Math.max(0, Math.floor(snapshot.remainingMs ?? 0)),
    hpRestored: Math.max(0, Math.floor(snapshot.hpRestored ?? 0)),
    hpLoss: Math.max(0, Math.floor(snapshot.hpLoss ?? 0)),
  };
}

