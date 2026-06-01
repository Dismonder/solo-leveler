import { normalizeGameRuntimeSnapshot, type GameRuntimeEvent, type GameRuntimeSnapshot } from "./types";

export type GameRuntimeEventBridge = {
  emit(event: GameRuntimeEvent): void;
  emitSnapshot(snapshot: Partial<GameRuntimeSnapshot>): void;
  destroy(): void;
  isDestroyed(): boolean;
};

export function createGameRuntimeEventBridge(emit: (event: GameRuntimeEvent) => void): GameRuntimeEventBridge {
  let destroyed = false;

  return {
    emit(event) {
      if (destroyed) return;
      emit(event);
    },
    emitSnapshot(snapshot) {
      if (destroyed) return;
      emit({ type: "snapshot", snapshot: normalizeGameRuntimeSnapshot(snapshot) });
    },
    destroy() {
      destroyed = true;
    },
    isDestroyed() {
      return destroyed;
    },
  };
}

