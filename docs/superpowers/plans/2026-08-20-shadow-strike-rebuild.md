# Cięcie Cienia Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zastąpić obecną mini-grę „Cięcie Cienia” deterministycznym silnikiem i lekkim rendererem Canvas, usunąć lawinę efektów DOM po trafieniu w „Ekstrakcji Cienia”, a następnie potwierdzić płynność oraz prawdziwe 120 Hz na LDPlayerze.

**Architecture:** Zasady rundy i monotoniczny zegar Cięcia Cienia trafią do niezależnego, mutowalnego runtime bez DOM i Reacta. Dwie małe warstwy Canvas rozdzielą statyczny tor od dynamicznego wskaźnika. W Ekstrakcji Cienia osobny Canvas z czterema stałymi slotami zastąpi React/Motion, timery i montowanie wielu węzłów po każdym trafieniu. React pozostanie warstwą cyklu życia i końcowego wyniku.

**Tech Stack:** TypeScript 5.8, React 19, Canvas 2D, Node test runner przez `tsx --test`, Capacitor 8, Android/Java, ADB, Chrome DevTools Protocol, LDPlayer 14.

**Spec:** `docs/superpowers/specs/2026-08-20-shadow-strike-rebuild-design.md`

## Global Constraints

- Nie publikować GitHub Release i nie podbijać wersji aplikacji w ramach tego planu.
- Jedno fizyczne dotknięcie może zaakceptować najwyżej jedno cięcie; cooldown wejścia wynosi dokładnie 100 ms.
- Aktywna runda nie może wykonywać aktualizacji Reacta z ruchu lub trafień; pętla RAF nie może aktualizować DOM ani tworzyć tablic/obiektów na każdą klatkę.
- Cel pozostaje nieruchomy na środku; porusza się tylko jeden wskaźnik odbijający się na krawędziach.
- Strefa trafienia ma minimum 16% toru; jednokierunkowy przejazd trwa minimum 850 ms.
- Kara za pudło wynosi najwyżej 1000 ms przed zastosowaniem odporności.
- Maksymalny pozostały czas rundy wynosi 42 000 ms.
- Używać wyłącznie monotonicznego czasu przekazywanego jako `nowMs`; silnik nie wywołuje `Date.now()` ani `performance.now()` samodzielnie.
- Efekty trafienia Ekstrakcji Cienia mają stałą pulę najwyżej 4 wpisów, nie tworzą React state ani timerów i są rysowane z istniejącej pętli RAF gry.
- Nie zmieniać punktacji, fizyki, ekonomii, dźwięku ani zasad Ekstrakcji Cienia; zakres obejmuje wyłącznie kosztowną warstwę wizualnego potwierdzenia cięcia.
- Nie zmieniać konfiguracji LDPlayera ani nie restartować emulatora, dopóki pomiar po instalacji nie wykaże regresji; stan wejściowy 120 Hz jest już potwierdzony.

---

### Task 1: Deterministyczny silnik rundy

**Files:**
- Create: `src/game/shadowStrikeEngine.ts`
- Create: `src/game/shadowStrikeEngine.test.ts`

**Interfaces:**
- Consumes: poziom mini-gry i bonusy `hitWindow`, `scoreBonus`, `timePenaltyResist` przekazywane jako liczby.
- Produces: `ShadowStrikeConfig`, `ShadowStrikeRuntime`, `ShadowStrikeOutcome`, `createShadowStrikeConfig()`, `createShadowStrikeRuntime()`, `advanceShadowStrike()`, `tryShadowStrike()`, `pauseShadowStrike()`, `resumeShadowStrike()`, `getShadowStrikeSnapshot()`.

- [ ] **Step 1: Write failing balance and motion tests**

Create `src/game/shadowStrikeEngine.test.ts` with tests that assert the public contract:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceShadowStrike,
  createShadowStrikeConfig,
  createShadowStrikeRuntime,
  getShadowStrikeSnapshot,
  pauseShadowStrike,
  resumeShadowStrike,
  tryShadowStrike,
} from "./shadowStrikeEngine";

test("shadow strike config keeps readable hard limits", () => {
  const config = createShadowStrikeConfig(99, 0, 0, 0);
  assert.ok(config.hitWindowWidth >= 16);
  assert.ok(config.oneWayMs >= 850);
  assert.equal(config.inputCooldownMs, 100);
  assert.equal(config.missPenaltyMs, 1000);
});

test("cursor reflects at both edges without teleporting", () => {
  const runtime = createShadowStrikeRuntime(0, createShadowStrikeConfig(1, 0, 0, 0));
  let previous = runtime.cursorPosition;
  for (let now = 8; now <= 6000; now += 8) {
    advanceShadowStrike(runtime, now);
    assert.ok(runtime.cursorPosition >= 0 && runtime.cursorPosition <= 100);
    assert.ok(Math.abs(runtime.cursorPosition - previous) < 2);
    previous = runtime.cursorPosition;
  }
});

test("one physical contact cannot score twice", () => {
  const runtime = createShadowStrikeRuntime(0, createShadowStrikeConfig(1, 0, 0, 0));
  runtime.lastAdvancedAtMs = 500;
  runtime.cursorPosition = 50;
  const first = tryShadowStrike(runtime, 500);
  const duplicate = tryShadowStrike(runtime, 540);
  assert.equal(first?.tier, "perfect");
  assert.equal(duplicate, null);
  assert.equal(runtime.acceptedInputs, 1);
});

test("fixed target classifies perfect, great, good and miss", () => {
  const config = createShadowStrikeConfig(1, 0, 0, 0);
  const positions = [50, 55, 60, 90] as const;
  const expected = ["perfect", "great", "good", "miss"] as const;
  positions.forEach((position, index) => {
    const runtime = createShadowStrikeRuntime(0, config);
    runtime.lastAdvancedAtMs = 500;
    runtime.cursorPosition = position;
    assert.equal(tryShadowStrike(runtime, 500)?.tier, expected[index]);
  });
});

test("cursor position depends on active time rather than frame schedule", () => {
  const config = createShadowStrikeConfig(8, 0, 0, 0);
  const sixty = createShadowStrikeRuntime(0, config);
  const oneTwenty = createShadowStrikeRuntime(0, config);
  for (let now = 1000 / 60; now < 1000; now += 1000 / 60) advanceShadowStrike(sixty, now);
  for (let now = 1000 / 120; now < 1000; now += 1000 / 120) advanceShadowStrike(oneTwenty, now);
  advanceShadowStrike(sixty, 1000);
  advanceShadowStrike(oneTwenty, 1000);
  assert.ok(Math.abs(sixty.cursorPosition - oneTwenty.cursorPosition) < 0.0001);
});

test("time bonus is capped and miss costs at most one second", () => {
  const config = createShadowStrikeConfig(1, 0, 0, 0);
  const runtime = createShadowStrikeRuntime(0, config);
  runtime.remainingMs = 41_900;
  runtime.lastAdvancedAtMs = 500;
  runtime.cursorPosition = 50;
  tryShadowStrike(runtime, 500);
  assert.equal(runtime.remainingMs, 42_000);
  runtime.cursorPosition = 0;
  runtime.lastAdvancedAtMs = 700;
  const beforeMiss = runtime.remainingMs;
  tryShadowStrike(runtime, 700);
  assert.ok(beforeMiss - runtime.remainingMs <= 1000);
});

test("pause freezes both cursor and remaining time", () => {
  const runtime = createShadowStrikeRuntime(0, createShadowStrikeConfig(1, 0, 0, 0));
  advanceShadowStrike(runtime, 300);
  pauseShadowStrike(runtime, 300);
  const frozen = getShadowStrikeSnapshot(runtime);
  advanceShadowStrike(runtime, 5300);
  assert.deepEqual(getShadowStrikeSnapshot(runtime), frozen);
  resumeShadowStrike(runtime, 5300);
  advanceShadowStrike(runtime, 5400);
  assert.ok(runtime.remainingMs < frozen.remainingMs);
});

test("finished round remains terminal", () => {
  const runtime = createShadowStrikeRuntime(0, createShadowStrikeConfig(1, 0, 0, 0));
  runtime.remainingMs = 10;
  advanceShadowStrike(runtime, 20);
  assert.equal(runtime.finished, true);
  const snapshot = getShadowStrikeSnapshot(runtime);
  advanceShadowStrike(runtime, 2000);
  assert.deepEqual(getShadowStrikeSnapshot(runtime), snapshot);
  assert.equal(tryShadowStrike(runtime, 2100), null);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
npx tsx --test src/game/shadowStrikeEngine.test.ts
```

Expected: FAIL because `src/game/shadowStrikeEngine.ts` does not exist.

- [ ] **Step 3: Implement the engine contract**

Create `src/game/shadowStrikeEngine.ts`. Use these exact public types and constants:

```ts
export type ShadowStrikeTier = "perfect" | "great" | "good" | "miss";

export type ShadowStrikeConfig = {
  durationMs: number;
  maxRemainingMs: number;
  inputCooldownMs: number;
  targetCenter: number;
  hitWindowWidth: number;
  perfectWindowWidth: number;
  oneWayMs: number;
  scoreMultiplier: number;
  penaltyResist: number;
  missPenaltyMs: number;
};

export type ShadowStrikeRuntime = {
  config: ShadowStrikeConfig;
  cursorPosition: number;
  direction: 1 | -1;
  remainingMs: number;
  score: number;
  combo: number;
  acceptedInputs: number;
  activeElapsedMs: number;
  lastAdvancedAtMs: number;
  lastInputAtMs: number;
  paused: boolean;
  finished: boolean;
};

export type ShadowStrikeOutcome = {
  tier: ShadowStrikeTier;
  gain: number;
  timeDeltaMs: number;
  cursorPosition: number;
  score: number;
  combo: number;
};

export type ShadowStrikeSnapshot = {
  score: number;
  combo: number;
  remainingMs: number;
  remainingSeconds: number;
  cursorPosition: number;
  acceptedInputs: number;
  paused: boolean;
  finished: boolean;
};
```

Implement the balance with `difficulty = Math.min(8, Math.floor(Math.max(1, level) / 4))`, `hitWindowWidth = Math.max(16, (28 - difficulty * 1.25) * (1 + clampedHitWindowBonus))`, `perfectWindowWidth = Math.max(5, hitWindowWidth * 0.34)`, and `oneWayMs = Math.max(850, 1450 - difficulty * 55)`. Clamp bonuses to the existing shop/relic limits before applying them.

Use the combined runtime caps `hitWindowBonus <= 0.12`, `scoreBonus <= 0.15`, and `penaltyResist <= 0.18`. Preserve scoring with `perfect = 75 + min(90, nextCombo * 8)`, `great = 52 + min(65, nextCombo * 6)`, and `good = 34 + min(50, nextCombo * 5)`, multiplied by `scoreMultiplier` and rounded. Time deltas are `perfect = 1400 + nextCombo * 70`, `great = 850`, `good = 550`, and `miss = -round(1000 * (1 - penaltyResist))`, subject to the 42 000 ms cap. Classify inclusive distance bands as perfect half-width, 65% of the hit half-width for great, the full hit half-width for good, and miss outside.

`advanceShadowStrike()` must subtract the full elapsed delta from `remainingMs`, add it to `activeElapsedMs`, derive the cursor analytically as a triangle wave over `oneWayMs`, and set `finished` permanently at zero remaining time. Do not integrate position from the number of frames. `tryShadowStrike()` first calls `advanceShadowStrike(runtime, nowMs)`, rejects attempts within 100 ms of the previous accepted input, classifies distance from center, updates score/combo/time, and returns one outcome object. Allocation is allowed on accepted input, not inside `advanceShadowStrike()`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
npx tsx --test src/game/shadowStrikeEngine.test.ts
```

Expected: 8 passing tests.

- [ ] **Step 5: Run the entire test suite**

Run:

```powershell
npm test
```

Expected: existing 147 tests plus the new engine tests all pass.

- [ ] **Step 6: Commit the engine**

```powershell
git add src/game/shadowStrikeEngine.ts src/game/shadowStrikeEngine.test.ts
git commit -m "feat: add deterministic shadow strike engine"
```

---

### Task 2: Warstwowy renderer Canvas bez pracy DOM na klatkę

**Files:**
- Create: `src/gameRuntime/shadowStrikeRenderer.ts`
- Create: `src/gameRuntime/shadowStrikeRenderer.test.ts`

**Interfaces:**
- Consumes: `ShadowStrikeConfig`, `ShadowStrikeRuntime`, `ShadowStrikeOutcome` from Task 1 and two `HTMLCanvasElement` instances.
- Produces: `ShadowStrikeLayout`, `createShadowStrikeLayout()`, `ShadowStrikeRenderer`, `createShadowStrikeRenderer()`.

- [ ] **Step 1: Write failing pure layout tests**

Create `src/gameRuntime/shadowStrikeRenderer.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { createShadowStrikeConfig } from "../game/shadowStrikeEngine";
import { createShadowStrikeLayout } from "./shadowStrikeRenderer";

test("renderer layout keeps the target centered", () => {
  const layout = createShadowStrikeLayout(600, 84, createShadowStrikeConfig(12, 0, 0, 0));
  assert.equal(layout.targetCenterX, 300);
  assert.ok(layout.hitLeft < 300 && layout.hitRight > 300);
  assert.ok(layout.perfectLeft > layout.hitLeft);
  assert.ok(layout.perfectRight < layout.hitRight);
});

test("renderer layout stays inside small canvases", () => {
  const layout = createShadowStrikeLayout(240, 56, createShadowStrikeConfig(99, 0, 0, 0));
  assert.ok(layout.trackLeft >= 0);
  assert.ok(layout.trackRight <= 240);
  assert.ok(layout.trackTop >= 0);
  assert.ok(layout.trackBottom <= 56);
});
```

Also add a focused renderer lifecycle test with two minimal fake canvases/contexts. It must prove that `resize()` changes both backing stores using capped DPR, repeated `render()` calls do not resize them, and `destroy()` makes later rendering inert. The fake records only the concrete Canvas operations used by the renderer; it must not mirror renderer calculations.

- [ ] **Step 2: Run the renderer test and verify RED**

Run:

```powershell
npx tsx --test src/gameRuntime/shadowStrikeRenderer.test.ts
```

Expected: FAIL because the renderer module does not exist.

- [ ] **Step 3: Implement the renderer**

Create `src/gameRuntime/shadowStrikeRenderer.ts` with this interface:

```ts
import type {
  ShadowStrikeConfig,
  ShadowStrikeOutcome,
  ShadowStrikeRuntime,
  ShadowStrikeTier,
} from "../game/shadowStrikeEngine";

export type ShadowStrikeLayout = {
  width: number;
  height: number;
  trackLeft: number;
  trackRight: number;
  trackTop: number;
  trackBottom: number;
  targetCenterX: number;
  hitLeft: number;
  hitRight: number;
  perfectLeft: number;
  perfectRight: number;
};

export type ShadowStrikeRenderer = {
  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number): void;
  drawStatic(config: ShadowStrikeConfig): void;
  render(runtime: ShadowStrikeRuntime, nowMs: number): void;
  flash(outcome: ShadowStrikeOutcome, nowMs: number): void;
  destroy(): void;
};
```

`createShadowStrikeLayout()` must use 12 px horizontal padding, center the target at exactly half the canvas width, and convert percentage windows into clamped pixel bounds. `createShadowStrikeRenderer()` must:

- cap DPR at 2;
- set both backing stores only in `resize()`;
- draw track, cyan hit window and gold perfect window only on the static context;
- clear only the dynamic context in `render()`;
- draw the moving cursor with three simple vertical strokes instead of `shadowBlur`;
- draw score, combo and remaining seconds on the dynamic Canvas, caching their strings until the underlying primitive changes;
- keep flash data in primitive closure fields (`flashTier`, `flashGain`, `flashUntilMs`) and avoid arrays/objects inside `render()`;
- use fixed label strings selected by `switch (tier)`;
- make `destroy()` clear contexts and mark the renderer inactive.

- [ ] **Step 4: Run renderer and engine tests**

Run:

```powershell
npx tsx --test src/game/shadowStrikeEngine.test.ts src/gameRuntime/shadowStrikeRenderer.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 5: Type-check the new module**

Run:

```powershell
npm run lint
```

Expected: TypeScript completes without errors.

Staged-baseline exception: before Task 3, the old integration has the known `BonusMiniGames.tsx` `React.SyntheticEvent` namespace error. Task 2 passes this step when the command reports only that exact pre-existing error and no renderer/engine error; Task 3 must remove it and restore a completely green lint run.

- [ ] **Step 6: Commit the renderer**

```powershell
git add src/gameRuntime/shadowStrikeRenderer.ts src/gameRuntime/shadowStrikeRenderer.test.ts
git commit -m "feat: add low-jitter shadow strike canvas renderer"
```

---

### Task 3: Lekka integracja React i rozgrzanie audio

**Files:**
- Modify: `src/components/BonusMiniGames.tsx:1-85,1214-1581`
- Modify: `src/utils/audio.ts:20-55,121-145`
- Modify: `src/game/miniGameCatalog.ts:60-91`
- Create: `src/utils/audioPreparation.test.ts`

**Interfaces:**
- Consumes: engine and renderer from Tasks 1–2; existing `MiniGameFrame`, `StartOverlay`, reward callback and relic bonuses.
- Produces: rebuilt `ShadowStrikeGame` with one pointer input path and `prepareMiniGameAudio()`.

- [ ] **Step 1: Add a failing audio preparation test seam**

Add an exported pure guard to `src/utils/audio.ts` and cover it in a new test file `src/utils/audioPreparation.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { shouldPrepareMiniGameAudio } from "./audio";

test("mini-game audio warmup follows enabled state and volume", () => {
  assert.equal(shouldPrepareMiniGameAudio(true, 1), true);
  assert.equal(shouldPrepareMiniGameAudio(false, 1), false);
  assert.equal(shouldPrepareMiniGameAudio(true, 0), false);
});
```

Run `npx tsx --test src/utils/audioPreparation.test.ts` and verify it fails because the export is absent.

- [ ] **Step 2: Implement audio warmup**

In `src/utils/audio.ts`, add:

```ts
export function shouldPrepareMiniGameAudio(enabled: boolean, volume: number) {
  return enabled && volume > 0;
}

export function prepareMiniGameAudio() {
  if (!shouldPrepareMiniGameAudio(systemAudioEnabled, globalVolume)) return;
  try {
    const context = initAudio();
    if (context.state === "suspended") void context.resume().catch(() => undefined);
  } catch {
    // Audio is optional and must never block game start.
  }
}
```

Run the focused audio test and expect PASS.

- [ ] **Step 3: Replace the old ShadowStrike imports and component**

In `src/components/BonusMiniGames.tsx`:

- remove `advanceShadowStrikeMotion`, `getStrikeWindow`, and `getStrikeZoneWidth` from imports used by the active component;
- import the Task 1 engine, Task 2 renderer, and `prepareMiniGameAudio`;
- remove `ShadowStrikeVisualEffect` and the full current `ShadowStrikeGame` implementation;
- create two canvas refs, one runtime ref, one renderer ref, one RAF ref, one `ResizeObserver` ref, and one deferred-feedback timer set;
- mount the renderer once after both canvases exist; `ResizeObserver` calls `resize()` and then `drawStatic(config)` outside RAF whenever a runtime config exists;
- start with `prepareMiniGameAudio()`, then construct config/runtime and draw the static layer;
- use exactly one `button type="button"` input surface with `onPointerDown={handleStrike}`, `aria-label="Wykonaj Cięcie Cienia"`, `data-shadow-strike-input-surface="true"`, and no `onClick`/`onTouchStart`;
- ignore non-primary contacts and non-primary mouse buttons before evaluating a strike;
- call `event.preventDefault()` and `tryShadowStrike(runtime, performance.now())` once;
- call `renderer.flash(outcome, now)` synchronously, then schedule sound and a maximum 10 ms vibration with `window.setTimeout(..., 0)` tracked for cleanup;
- do not call a React setter in `handleStrike`;
- in RAF, only advance and render; do not call a React setter during the active round;
- finish through the existing `onComplete` callback once when `runtime.finished` becomes true;
- pause/resume the runtime from the existing `paused` prop;
- set `MiniGameFrame.showHud={false}` for this game; add an optional `staticStageEffect` prop (default `false`) that replaces `MiniGameStageEffectLayer` with a nonanimated gradient while this round is active;
- show two stacked canvases inside one accessible button-like input surface and the noninteractive text `DOTKNIJ GDZIEKOLWIEK · CEL JEST NIERUCHOMY`;
- remove the clickable „Cięcie” button entirely.

During the active round, React state is limited to phase/final-result/error transitions: no score, combo, remaining-time, feedback or popup setter may run from RAF or `handleStrike`. Add `data-shadow-strike-state` to the stage for CDP. Keep the diagnostic runtime available after finish so the test can read `acceptedInputs`; identity-guarded cleanup occurs on replacement or unmount.

The runtime field must be exposed only for diagnostics as:

```ts
(globalThis as typeof globalThis & {
  __soloShadowStrikeRuntime?: ShadowStrikeRuntime;
}).__soloShadowStrikeRuntime = runtime;
```

Clear that global only if it still points at the same runtime during cleanup.

- [ ] **Step 4: Update player-facing instructions**

In the `shadow-strike` entry of `src/game/miniGameCatalog.ts`, use these strings:

```ts
summary: "Dotknij, gdy biały wskaźnik przechodzi przez nieruchomy słaby punkt.",
shortGoal: "Jeden wskaźnik, jeden cel, jedno dotknięcie.",
readyTips: [
  "Cel pozostaje na środku. Obserwuj tylko biały wskaźnik.",
  "Dotknij dowolnego miejsca dokładnie w chwili przecięcia złotej strefy.",
  "Nie spamuj — pewne trafienia budują combo i dodają czas.",
],
pauseTips: [
  "Po wznowieniu wskaźnik ruszy z tego samego miejsca.",
  "Turkusowa strefa daje punkty, złoty środek daje wynik perfect.",
  "Pudło zabiera najwyżej jedną sekundę.",
],
mechanic: "Czysty timing jednego dotknięcia",
```

- [ ] **Step 5: Run all automated checks**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all tests pass, TypeScript has no errors, and Vite produces `dist` successfully.

- [ ] **Step 6: Commit the integration**

```powershell
git add src/components/BonusMiniGames.tsx src/game/miniGameCatalog.ts src/utils/audio.ts src/utils/audioPreparation.test.ts
git commit -m "feat: rebuild shadow strike around a single input loop"
```

---

### Task 4: Stałokosztowe efekty Canvas w Ekstrakcji Cienia

**Files:**
- Create: `src/gameRuntime/shadowExtractionImpactRenderer.ts`
- Create: `src/gameRuntime/shadowExtractionImpactRenderer.test.ts`
- Modify: `src/components/BonusMiniGames.tsx`
- Modify: `src/gameRuntime/miniGamePerformance.ts`
- Modify: `src/gameRuntime/miniGamePerformance.test.ts`

**Interfaces:**
- Consumes: jeden Canvas na całą scenę, istniejące dane trafienia i istniejący `nowMs` z pętli RAF Ekstrakcji Cienia.
- Produces: `createShadowExtractionImpactRenderer(canvas)` z metodami `resize()`, `emit()`, `render()`, `clear()`, `activeCount()` i `destroy()`.

- [ ] **Step 1: Write failing fixed-pool renderer tests**

Create `src/gameRuntime/shadowExtractionImpactRenderer.test.ts` with a minimal fake Canvas 2D context and tests for the public behavior:

1. po 100 wywołaniach `emit()` liczba aktywnych efektów nigdy nie przekracza 4;
2. piąty efekt nadpisuje najstarszy, co potwierdzają etykiety narysowane przy tym samym `nowMs`;
3. efekt jest widoczny tuż przed granicą czasu życia i nieaktywny dokładnie na granicy, bez `setTimeout`;
4. harmonogramy próbkowania 60 i 120 Hz dają ten sam obraz dla tych samych końcowych timestampów;
5. `resize()` ogranicza DPR do 2, a `emit()` i `render()` nigdy nie zapisują ponownie `canvas.width` ani `canvas.height`;
6. cztery równoczesne efekty `perfect` mieszczą się w stałym limicie operacji Canvas wyliczonym z jednej smugi, jednego pierścienia, najwyżej sześciu iskier i jednej etykiety na slot;
7. po `destroy()` wywołania są obojętne.

Run:

```powershell
npx tsx --test src/gameRuntime/shadowExtractionImpactRenderer.test.ts
```

Expected: RED because the module does not exist.

- [ ] **Step 2: Implement the renderer with a fixed four-slot pool**

Implement `src/gameRuntime/shadowExtractionImpactRenderer.ts` without React, Motion, DOM nodes, timers, images, gradients or `shadowBlur`:

```ts
export type ShadowExtractionImpactTier = "perfect" | "great" | "good";

export type ShadowExtractionImpactRenderer = {
  resize(cssWidth: number, cssHeight: number, dpr: number): void;
  emit(
    xPercent: number,
    yPercent: number,
    sizePx: number,
    rotationDeg: number,
    color: string,
    label: string,
    tier: ShadowExtractionImpactTier,
    nowMs: number,
  ): void;
  render(nowMs: number): void;
  clear(): void;
  activeCount(nowMs: number): number;
  destroy(): void;
};

export function createShadowExtractionImpactRenderer(
  canvas: HTMLCanvasElement,
): ShadowExtractionImpactRenderer;
```

Use exactly four preallocated mutable slots. Overwrite the oldest active slot when full. Draw one slash, one expanding ring, at most six sparks and one clamped score/tier label. Lifetime must stay within 280–360 ms. All animation is an analytic function of `nowMs`; `render()` must not create arrays/objects or resize the backing store.

Run the focused test until GREEN.

- [ ] **Step 3: Integrate into the active extraction runtime**

In the active local `ShadowExtractionGame` inside `src/components/BonusMiniGames.tsx`:

- remove `impactEffects`, `impactTimersRef`, `SliceImpactLayer`, `SliceImpactBurst` and `SlicedHalf`;
- add one impact canvas ref and one renderer ref at the existing effect-layer position;
- create the renderer once and destroy it on unmount;
- call `resize()` only from the existing `ResizeObserver`, with DPR capped by the renderer;
- call `renderer.render(nowMs)` from the already existing game RAF; do not start a second RAF;
- make `emitSliceImpact()` pass only primitive values to `renderer.emit(...)`; it must not call a React setter or create a timer;
- clear the renderer on start/restart, pause, finish, unmount and stage resize;
- keep scoring, target removal, physics, audio, HUD, aggregated score popup and textual feedback unchanged;
- preserve the current visual hierarchy by placing the noninteractive Canvas above targets and below controls, with `pointer-events: none` and an accessible DOM feedback path.

Delete obsolete DOM-impact budget/lifetime helpers from `src/gameRuntime/miniGamePerformance.ts` if no active caller remains, and update its tests to assert the remaining object/frame budgets exactly. Do not leave a dormant high-impact DOM path.

- [ ] **Step 4: Run source and regression checks**

Run:

```powershell
npx tsx --test src/gameRuntime/shadowExtractionImpactRenderer.test.ts src/gameRuntime/miniGamePerformance.test.ts
npm test
npm run lint
npm run build
```

Expected: all tests pass, TypeScript is clean, and the build succeeds.

- [ ] **Step 5: Commit the extraction optimization**

```powershell
git add src/gameRuntime/shadowExtractionImpactRenderer.ts src/gameRuntime/shadowExtractionImpactRenderer.test.ts src/gameRuntime/miniGamePerformance.ts src/gameRuntime/miniGamePerformance.test.ts src/components/BonusMiniGames.tsx
git commit -m "perf: bound shadow extraction impact effects"
```

---

### Task 5: Pokazywać rzeczywiście aktywne 120 Hz

**Files:**
- Create: `src/services/refreshRateStatus.ts`
- Create: `src/services/refreshRateStatus.test.ts`
- Modify: `src/services/performanceService.ts`
- Modify: `src/components/FpsOverlay.tsx`
- Modify: `src/screens/Dashboard.tsx`

**Interfaces:**
- Consumes: natywny status zawierający najlepsze obsługiwane `refreshRate` oraz rzeczywiste `currentRefreshRate`.
- Produces: jedna funkcja wyboru aktywnego Hz używana przez hinty CSS, nakładkę FPS i ekran ustawień.

- [ ] **Step 1: Write a failing active-rate test**

Create `src/services/refreshRateStatus.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { selectActiveRefreshRate } from "./refreshRateStatus";

test("active refresh rate wins over a higher supported mode", () => {
  assert.equal(selectActiveRefreshRate({ currentRefreshRate: 60, refreshRate: 120 }), 60);
  assert.equal(selectActiveRefreshRate({ currentRefreshRate: 120, refreshRate: 60 }), 120);
  assert.equal(selectActiveRefreshRate({ currentRefreshRate: 0, refreshRate: 90 }), 90);
  assert.equal(selectActiveRefreshRate({ currentRefreshRate: Number.NaN, refreshRate: -1 }), 0);
});
```

Run `npx tsx --test src/services/refreshRateStatus.test.ts` and verify RED because the module does not exist.

- [ ] **Step 2: Implement and use the single source of truth**

Implement `selectActiveRefreshRate()` as a pure function: choose a finite positive `currentRefreshRate`, otherwise a finite positive `refreshRate`, otherwise `0`. Use it in `enableHighPerformanceMode()`, `getPerformanceStatus()`, both reads in `FpsOverlay`, and the Dashboard tile labelled „Aktywne”. Do not change the target value or the working Android window request.

- [ ] **Step 3: Verify code and current environment**

Run:

```powershell
npx tsx --test src/services/refreshRateStatus.test.ts
npm test
npm run lint
adb -s emulator-5554 shell dumpsys display | rg -n "supportedModes|renderFrameRate|mActiveRenderFrameRate|fps=120|refreshRate=120"
adb -s emulator-5554 shell dumpsys window | rg -n "com.damia.sololeveler|preferredRefreshRate|preferredDisplayMode"
```

Pass: tests are green, Android and the app window remain at 118–122 Hz. Do not modify LDPlayer configuration or `HunterPerformancePlugin` while those measurements pass.

- [ ] **Step 4: Commit the status correction**

```powershell
git add src/services/refreshRateStatus.ts src/services/refreshRateStatus.test.ts src/services/performanceService.ts src/components/FpsOverlay.tsx src/screens/Dashboard.tsx
git commit -m "fix: report the active display refresh rate"
```

---

### Task 6: Build APK, preserve signing/data, and run the LDPlayer playtest

**Files:**
- Generated: `android/app/build/outputs/apk/debug/app-debug.apk`
- Diagnostic artifacts outside Git: `%LOCALAPPDATA%\Temp\solo-leveler-debug\shadow-strike-after.png`, `shadow-extraction-after.png` and JSON metric output.

**Interfaces:**
- Consumes: completed source tasks, running LDPlayer, installed signed app.
- Produces: locally installed rebuilt APK plus automated test and runtime performance evidence.

- [ ] **Step 1: Run the full source verification pipeline**

Run:

```powershell
npm test
npm run lint
npm run build
npx cap sync android
Push-Location android
try { .\gradlew.bat assembleDebug } finally { Pop-Location }
```

Expected: every command exits 0 and `android/app/build/outputs/apk/debug/app-debug.apk` exists.

- [ ] **Step 2: Back up app data and the currently installed APK**

Resolve `S:\LDPlayer\LDPlayer14` and create a timestamped directory below `S:\LDPlayer\Backups`. Use `ldconsole.exe backupapp` for `com.damia.sololeveler`, pull the path returned by `adb shell pm path`, and verify that both backup files have nonzero length. Record the package version, certificate digest and `firstInstallTime` before installation. Do not stop or reconfigure LDPlayer.

- [ ] **Step 3: Verify update signing compatibility before installation**

Find the newest Android SDK `apksigner.bat`, then compare SHA-256 certificate digests:

```powershell
$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk\build-tools'
$apksigner = Get-ChildItem -LiteralPath $sdkRoot -Filter apksigner.bat -Recurse | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
& $apksigner verify --print-certs 'android\app\build\outputs\apk\debug\app-debug.apk'
& $apksigner verify --print-certs "$backupDir\solo-leveler-installed.apk"
```

Expected: both signer certificate SHA-256 digests are identical. If not identical, do not install.

- [ ] **Step 4: Install as an update and verify data preservation**

Capture `firstInstallTime` and a stable player-state file/listing before install, run:

```powershell
adb -s emulator-5554 install -r 'android\app\build\outputs\apk\debug\app-debug.apk'
adb -s emulator-5554 shell dumpsys package com.damia.sololeveler | rg "versionCode=|versionName=|firstInstallTime=|lastUpdateTime="
adb -s emulator-5554 shell monkey -p com.damia.sololeveler -c android.intent.category.LAUNCHER 1
```

Expected: install reports `Success`, `firstInstallTime` is unchanged, the app launches, and existing mini-game levels/records remain visible.

- [ ] **Step 5: Connect CDP and clear the frame trace after warmup**

Forward the current WebView socket:

```powershell
$pid = (adb -s emulator-5554 shell pidof com.damia.sololeveler).Trim()
adb -s emulator-5554 forward tcp:9222 "localabstract:webview_devtools_remote_$pid"
Invoke-RestMethod -Uri 'http://127.0.0.1:9222/json'
```

Use `Runtime.evaluate` to call `globalThis.__soloFrameTrace?.clear()` and install a raw `requestAnimationFrame` delta collector immediately before the measured round. Read the raw deltas, `globalThis.__soloFrameTrace.summary()` and `globalThis.__soloShadowStrikeRuntime.acceptedInputs` afterward; the rolling overlay alone is not the acceptance source.

- [ ] **Step 6: Execute the 30-second Shadow Strike ADB input run**

Start „Cięcie Cienia”, then send controlled taps at the playfield center no faster than one every 450 ms. Count physical taps in PowerShell. Do not take screenshots during the measured interval because `screencap` itself creates a frame stall.

After the round, assert:

- `acceptedInputs <= physicalTapCount` and no single contact increments it twice;
- at 120 Hz: average >= 115 FPS, median 7.8–9.0 ms, p95 <= 10.5 ms and p99 <= 16.7 ms;
- frames above 25 ms are <= 0.1% and there is no consecutive series of 25+ ms frames;
- the post-install idle baseline still reports 118–122 Hz through Android, the app window and WebView.

- [ ] **Step 7: Stress-test Shadow Extraction hit effects**

Start „Ekstrakcja Cienia”, warm up for 5 seconds, clear the frame collectors and execute normal cuts plus repeated multi-target swipes. Sample the impact renderer's active count and DOM node count before, during and after hits. Pass only if:

- average FPS is at least 115, median is 7.8–9.0 ms, p95 <= 10.5 ms, p99 <= 16.7 ms and worst frame <= 25 ms;
- there are no frames above 33.33 ms in hit windows;
- feedback starts by the next paint and remains readable for 250–400 ms;
- active impacts never exceed 4;
- firing impacts does not increase the DOM node count;
- repeated impacts and expiry do not grow backing storage or retained heap monotonically.

If this impact-only boundary fails while impact counts and DOM remain bounded, collect a new trace before considering the larger target/trail Canvas migration.

- [ ] **Step 8: Capture post-test visual evidence**

After measurement finishes:

```powershell
$artifactDir = Join-Path ([System.IO.Path]::GetTempPath()) 'solo-leveler-debug'
New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null
adb -s emulator-5554 shell screencap -p /sdcard/shadow-strike-after.png
adb -s emulator-5554 pull /sdcard/shadow-strike-after.png (Join-Path $artifactDir 'shadow-strike-after.png')
```

Inspect the image for a centered fixed target, one visible cursor, unobstructed playfield, readable hint, and no old „Cięcie” button.

Capture and inspect a separate post-measurement `shadow-extraction-after.png` for a visible but bounded slash/ring/label effect and unobstructed targets. Never run `screencap` during either measured interval.

- [ ] **Step 9: Commit only source-controlled final adjustments**

If runtime verification required source adjustments, rerun Steps 1–6, then commit only repository files:

```powershell
git add src docs
git commit -m "perf: eliminate shadow strike input and frame stalls"
```

Do not stage APKs, LDPlayer configuration, backups, temporary screenshots, `dist`, or Android build outputs.

---

### Task 7: Final regression and handoff

**Files:**
- Verify only; no required source change.

**Interfaces:**
- Consumes: clean commits from Tasks 1–6.
- Produces: evidence-backed handoff for the user’s manual check before any release.

- [ ] **Step 1: Run final clean verification**

Run:

```powershell
npm test
npm run lint
npm run build
git diff --check
git status --short
```

Expected: all checks pass; status contains no uncommitted source changes unless explicitly documented.

- [ ] **Step 2: Verify the installed app one last time**

Run:

```powershell
adb -s emulator-5554 shell dumpsys package com.damia.sololeveler | rg "versionCode=|versionName=|firstInstallTime=|lastUpdateTime="
adb -s emulator-5554 shell dumpsys display | rg -n "renderFrameRate|mActiveRenderFrameRate|supportedModes"
adb -s emulator-5554 shell dumpsys window | rg -n "com.damia.sololeveler|preferredRefreshRate|preferredDisplayMode"
```

- [ ] **Step 3: Prepare the user handoff**

Report:

- exact engine/renderer/input changes in Cięciu Cienia and the bounded Canvas impact path in Ekstrakcji Cienia;
- automated test counts and build result;
- measured Hz, median, p95, p99, worst frame, physical taps, accepted inputs;
- installed APK path and LDPlayer package version;
- backup locations and recovery commands;
- confirmation that GitHub was not modified.

- [ ] **Step 4: Do not publish**

Stop with the rebuilt APK installed on LDPlayer. Wait for the user’s manual approval before version bump, push to `main`, tag, or GitHub Release.
