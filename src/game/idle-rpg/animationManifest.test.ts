import test from "node:test";
import assert from "node:assert/strict";
import {
  IDLE_RPG_ANIMATION_CATEGORIES,
  IDLE_RPG_ANIMATION_MANIFEST,
  SUMMONS,
  getActorAnimationMarkerDelayMs,
  getActorAnimationPhaseTimeScale,
  getAnimationCategoryFrameTotal,
  getCampaignStages,
  resolveActorAnimation,
  type IdleRpgAnimationCategory,
  type IdleRpgAnimationState,
} from "./index";

const EXPECTED_FRAME_BUDGETS: Readonly<Record<IdleRpgAnimationCategory, number>> = {
  hero: 138,
  normalEnemy: 40,
  elite: 80,
  boss: 134,
  summon: 72,
};

test("authored keyframe timelines exactly satisfy every production frame budget", () => {
  for (const category of IDLE_RPG_ANIMATION_CATEGORIES) {
    assert.equal(getAnimationCategoryFrameTotal(category), EXPECTED_FRAME_BUDGETS[category]);
    assert.equal(IDLE_RPG_ANIMATION_MANIFEST.categories[category].frameBudget, EXPECTED_FRAME_BUDGETS[category]);
  }
});

test("every actor/state resolves holds to valid absolute atlas cells and markers", () => {
  const sourceFrames = IDLE_RPG_ANIMATION_MANIFEST.atlasGeometry.sourceFrames;
  const columns = IDLE_RPG_ANIMATION_MANIFEST.atlasGeometry.columns;

  for (const category of IDLE_RPG_ANIMATION_CATEGORIES) {
    const contract = IDLE_RPG_ANIMATION_MANIFEST.categories[category];
    for (const source of contract.sources) {
      for (const state of Object.keys(contract.states) as IdleRpgAnimationState[]) {
        const resolved = resolveActorAnimation(source.actorId, state);
        assert.ok(resolved, `${source.actorId}.${state} did not resolve`);
        assert.ok(resolved.frames.length > 0);
        assert.ok(resolved.frames.every((frame) => Number.isInteger(frame) && frame >= 0 && frame < sourceFrames));
        assert.ok(resolved.frames.every((frame) => frame >= source.rowOffset && frame < source.rowOffset + source.rowCount * columns));
        assert.ok(resolved.markers.every((marker) => marker.frame >= 0 && marker.frame < resolved.frames.length));
        assert.equal(resolved.durationMs, (resolved.frames.length / resolved.fps) * 1_000);
      }
    }
  }
});

test("animation sources cover campaign actors and all five summons", () => {
  const expectedCampaignActors = new Set(getCampaignStages().map((stage) => stage.enemyId));
  const normalSources = IDLE_RPG_ANIMATION_MANIFEST.categories.normalEnemy.sources.map((source) => source.actorId);
  const eliteSources = IDLE_RPG_ANIMATION_MANIFEST.categories.elite.sources.map((source) => source.actorId);
  const bossSources = IDLE_RPG_ANIMATION_MANIFEST.categories.boss.sources.map((source) => source.actorId);

  assert.deepEqual(new Set([...normalSources, ...eliteSources, ...bossSources]), expectedCampaignActors);
  assert.deepEqual(
    new Set(IDLE_RPG_ANIMATION_MANIFEST.categories.summon.sources.map((source) => source.actorId)),
    new Set(SUMMONS.map((summon) => summon.id)),
  );
});

test("all damaging authored states expose an in-range impact marker", () => {
  const damagingStates: Readonly<Partial<Record<IdleRpgAnimationCategory, readonly IdleRpgAnimationState[]>>> = {
    hero: ["attack", "skill", "ultimate"],
    normalEnemy: ["attack"],
    elite: ["attack", "skill"],
    boss: ["attack", "skill"],
    summon: ["attack", "skill"],
  };

  for (const category of IDLE_RPG_ANIMATION_CATEGORIES) {
    const source = IDLE_RPG_ANIMATION_MANIFEST.categories[category].sources[0];
    for (const state of damagingStates[category] ?? []) {
      const resolved = resolveActorAnimation(source.actorId, state);
      assert.ok(resolved);
      assert.ok(resolved.markers.some((marker) => marker.name === "impact"));
    }
  }
});

test("render timing helpers preserve authored impact markers and fit long phase clips", () => {
  assert.equal(getActorAnimationMarkerDelayMs("meridian-wanderer", "skill", "impact"), 600);
  assert.equal(getActorAnimationMarkerDelayMs("meridian-wanderer", "idle", "impact"), undefined);

  assert.equal(getActorAnimationPhaseTimeScale("ashen-bulwark-normal-0", "enter", 500), 1);
  assert.ok(getActorAnimationPhaseTimeScale("ashen-bulwark-boss-12", "intro", 500) > 2.9);
  assert.ok(getActorAnimationPhaseTimeScale("ashen-bulwark-boss-12", "death", 650) > 3);
  assert.equal(getActorAnimationPhaseTimeScale("meridian-wanderer", "idle", 500), 1);
});
