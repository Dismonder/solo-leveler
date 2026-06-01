# Finalna Przebudowa Fitness RPG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zrobić z aplikacji docelowy produkt Android 14+ z osobnym, wydajnym runtime mini-gier i stabilnym shellem fitness/RPG.

**Architecture:** React/Capacitor zostaje jako shell aplikacji: status, trening, profil, ekwipunek, sklep, Health Connect i ustawienia. Mini-gry dostają osobny kontrakt `GameEngineRuntimeAdapter`, najpierw przez Phaser/WebGL w obecnym projekcie, a następnie możliwy most do natywnego silnika Android/libGDX bez zmiany ekonomii i profilu.

**Tech Stack:** React 19, TypeScript, Capacitor 8, Android 14+ (`minSdk 34`), Phaser/WebGL jako pierwszy runtime, adb/gfxinfo/FPS overlay do pomiarów.

---

## File Structure

- `src/gameRuntime/types.ts`: wspólny kontrakt runtime gier, snapshotów, komend i eventów.
- `src/gameRuntime/settlement.ts`: helpery bez Reacta dla rozliczenia rundy i testów before/after.
- `src/gameRuntime/performanceTrace.ts`: lekki bufor metryk FPS/jank możliwy do zrzutu w dev panelu.
- `src/gameRuntime/shadowExtractionAdapter.ts`: adapter `Ekstrakcji Cienia`; najpierw wrapper istniejącego flow, potem Phaser/WebGL.
- `src/components/BonusMiniGames.tsx`: używa adaptera, result screen, ready `X`, running `STOP`, brak popupów nagród w mini-grach.
- `src/components/FpsOverlay.tsx`: pokazuje realtime/avg/min/p95/p99 oraz zapisuje próbki do bufora.
- `android/app/src/main/java/com/damia/sololeveler/HunterPerformancePlugin.java`: Game Mode/Game State/refresh diagnostics.
- `src/gameRuntime/*.test.ts`: testy kontraktu, settlementu i trace buffer.

---

### Task 1: Runtime Contract

**Files:**
- Create: `src/gameRuntime/types.ts`
- Create: `src/gameRuntime/types.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { isTerminalGameRuntimeState, normalizeGameRuntimeSnapshot } from "./types";

test("runtime states expose terminal states", () => {
  assert.equal(isTerminalGameRuntimeState("finished"), true);
  assert.equal(isTerminalGameRuntimeState("destroyed"), true);
  assert.equal(isTerminalGameRuntimeState("running"), false);
});

test("snapshot normalization clamps negative values", () => {
  const snapshot = normalizeGameRuntimeSnapshot({
    state: "running",
    score: -20,
    combo: -5,
    remainingMs: -100,
  });

  assert.equal(snapshot.score, 0);
  assert.equal(snapshot.combo, 0);
  assert.equal(snapshot.remainingMs, 0);
});
```

- [ ] **Step 2: Implement contract**

```ts
import type { MiniGameCompletionInput, MiniGameId } from "../game/miniGameProgress";

export type GameRuntimeState = "booting" | "ready" | "running" | "paused" | "finished" | "destroyed";
export type GameRuntimeCommand = "start" | "pause" | "resume" | "stop" | "destroy";

export type GameRuntimeSnapshot = {
  state: GameRuntimeState;
  score: number;
  combo: number;
  remainingMs: number;
  hpRestored?: number;
  hpLoss?: number;
};

export type GameRuntimeEvent =
  | { type: "snapshot"; snapshot: GameRuntimeSnapshot }
  | { type: "complete"; result: MiniGameCompletionInput }
  | { type: "pause-requested" }
  | { type: "error"; message: string; cause?: unknown };

export type GameEngineRuntimeAdapter = {
  id: MiniGameId;
  mount(target: HTMLElement, emit: (event: GameRuntimeEvent) => void): void;
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
```

- [ ] **Step 3: Run tests**

Run: `npm test -- --run`

Expected: new runtime tests pass with the current suite.

---

### Task 2: FPS Trace Buffer

**Files:**
- Create: `src/gameRuntime/performanceTrace.ts`
- Create: `src/gameRuntime/performanceTrace.test.ts`
- Modify: `src/components/FpsOverlay.tsx`

- [ ] **Step 1: Add trace buffer tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createFrameTraceBuffer } from "./performanceTrace";

test("trace buffer keeps recent frame samples and reports worst frame", () => {
  const buffer = createFrameTraceBuffer(3);
  buffer.push({ timestamp: 1, fps: 120, frameMs: 8.3 });
  buffer.push({ timestamp: 2, fps: 60, frameMs: 16.7 });
  buffer.push({ timestamp: 3, fps: 30, frameMs: 33.4 });
  buffer.push({ timestamp: 4, fps: 90, frameMs: 11.1 });

  const summary = buffer.summary();
  assert.equal(summary.samples, 3);
  assert.equal(summary.minFps, 30);
  assert.equal(summary.worstFrameMs, 33.4);
});
```

- [ ] **Step 2: Implement buffer**

Use an in-memory ring buffer with `push`, `all`, `summary`, and `clear`. Do not touch React state from RAF.

- [ ] **Step 3: Wire `FpsOverlay`**

Every 250 ms, after `summarizeFrameDeltas`, push one sample into `window.__soloFrameTrace`.

---

### Task 3: Mini-Game Result Boundary

**Files:**
- Modify: `src/context/PlayerContext.tsx`
- Modify: `src/components/BonusMiniGames.tsx`
- Test: `src/game/miniGameProgress.test.ts`

- [ ] **Step 1: Keep mini-game rewards out of global reward layer**

Ensure `completeMiniGame` returns `MiniGameSettlement` and does not call `animateReward` or regular gold/XP toasts.

- [ ] **Step 2: Ready/running/finished controls**

Ready screen: only `X` exit plus shop/audio icons. Running screen: `STOP`. Finished screen: no `STOP`, only result actions.

- [ ] **Step 3: Result screen scales to device**

Use `clamp()` and `dvh`; no internal scrolling for normal phone landscape/portrait result screens. XP bar animation duration: 4-6 s.

---

### Task 4: Shadow Extraction Runtime Adapter

**Files:**
- Create: `src/gameRuntime/shadowExtractionAdapter.ts`
- Modify: `src/components/BonusMiniGames.tsx`
- Test: `src/gameRuntime/shadowExtractionAdapter.test.ts`

- [ ] **Step 1: Adapter facade**

Expose `mount/start/pause/resume/destroy`, even if the first implementation delegates to current logic.

- [ ] **Step 2: Move game-field side effects behind adapter**

Targets, bombs, hearts, gold, time bubbles, slice trail and score snapshots emit events instead of updating shell directly.

- [ ] **Step 3: Phaser/WebGL implementation**

Replace DOM target rendering with pooled Phaser objects. React keeps HUD, pause, shop, and result screen.

---

### Task 5: Android Phone-First Verification

**Files:**
- Modify: `android/app/src/main/java/com/damia/sololeveler/HunterPerformancePlugin.java`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Add artifacts under: `artifacts/perf/YYYY-MM-DD-*`

- [ ] **Step 1: Build/install**

Run:

```powershell
npm run lint
npm test -- --run
npm run build
npm run android:build
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

- [ ] **Step 2: Capture frame evidence**

Run focused 60 s `Ekstrakcja Cienia` test:

```powershell
adb shell dumpsys gfxinfo com.damia.sololeveler reset
# play 60 s on phone
adb shell dumpsys gfxinfo com.damia.sololeveler > artifacts\perf\gfxinfo.txt
adb shell dumpsys gfxinfo com.damia.sololeveler framestats > artifacts\perf\gfxinfo-framestats.txt
```

- [ ] **Step 3: Decide next engine**

If WebGL Phaser still drops below 90 FPS regularly on Xiaomi, create a native Android game module with libGDX/Godot bridge. Do not keep tuning DOM animations after that point.

---

## Acceptance

- Mini-gry mają oddzielny runtime contract.
- `Ekstrakcja Cienia` nie tworzy dużych ilości DOM podczas aktywnej rundy po migracji adaptera.
- Wynik mini-gry jest rozliczany na ekranie wyniku, bez popupów nad nawigacją.
- FPS overlay i `gfxinfo` dają porównywalne dane przed/po.
- Android zostaje targetem głównym: `minSdk 34`, game category, high refresh hints.
