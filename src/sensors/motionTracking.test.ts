import assert from "node:assert/strict";
import test from "node:test";
import {
  createMotionTrackerState,
  getBaseline,
  getBaselineVector,
  MOTION_TRACKER_PROFILES,
  processMotionSample,
} from "./motionTracking";

function tiltedSample(degrees: number, timestamp: number, linearMagnitude = 0.35) {
  const radians = degrees * (Math.PI / 180);
  return {
    x: 9.81 * Math.sin(radians),
    y: 0,
    z: 9.81 * Math.cos(radians),
    timestamp,
    linearMagnitude,
  };
}

test("rep tracker counts one full movement cycle, not both acceleration spikes", () => {
  const profile = MOTION_TRACKER_PROFILES.pushups;
  let state = createMotionTrackerState(9.81, 0);

  let result = processMotionSample(state, profile, { x: 0, y: 0, z: 9.81, timestamp: 1400, linearMagnitude: 3.1 });
  assert.equal(result.delta, 0);
  state = result.state;

  result = processMotionSample(state, profile, { x: 0, y: 0, z: 9.81, timestamp: 1560, linearMagnitude: 0.2 });
  assert.equal(result.delta, 0);
  state = result.state;

  result = processMotionSample(state, profile, { x: 0, y: 0, z: 9.81, timestamp: 1780, linearMagnitude: 3.4 });
  assert.equal(result.delta, 0);
  state = result.state;

  result = processMotionSample(state, profile, { x: 0, y: 0, z: 9.81, timestamp: 2060, linearMagnitude: 0.2 });
  assert.equal(result.delta, 1);
});

test("rep tracker ignores a single bump that returns to rest", () => {
  const profile = MOTION_TRACKER_PROFILES.pushups;
  let state = createMotionTrackerState(9.81, 0);

  let result = processMotionSample(state, profile, { x: 0, y: 0, z: 9.81, timestamp: 1400, linearMagnitude: 3.3 });
  assert.equal(result.delta, 0);
  state = result.state;

  result = processMotionSample(state, profile, { x: 0, y: 0, z: 9.81, timestamp: 1800, linearMagnitude: 0.15 });
  assert.equal(result.delta, 0);
});

test("rep tracker cooldown blocks double counts from one phone lift and drop", () => {
  const profile = MOTION_TRACKER_PROFILES.pushups;
  let state = createMotionTrackerState(9.81, 0);
  let total = 0;

  for (const sample of [
    { timestamp: 1400, linearMagnitude: 3.2 },
    { timestamp: 1560, linearMagnitude: 0.2 },
    { timestamp: 1780, linearMagnitude: 3.1 },
    { timestamp: 2060, linearMagnitude: 0.2 },
    { timestamp: 2260, linearMagnitude: 3.4 },
    { timestamp: 2440, linearMagnitude: 0.2 },
  ]) {
    const result = processMotionSample(state, profile, { x: 0, y: 0, z: 9.81, ...sample });
    total += result.delta;
    state = result.state;
  }

  assert.equal(total, 1);
});

test("running profile converts steps to kilometers", () => {
  const profile = MOTION_TRACKER_PROFILES.runningKm;
  let state = createMotionTrackerState(9.81);
  let total = 0;

  for (let i = 1; i <= 4; i += 1) {
    const peak = processMotionSample(state, profile, { x: 0, y: 0, z: 12, timestamp: i * 300 });
    total += peak.delta;
    state = peak.state;
    state = processMotionSample(state, profile, { x: 0, y: 0, z: 9.9, timestamp: i * 300 + 120 }).state;
  }

  assert.equal(total, 0.003);
});

test("situp tracker counts a full torso flexion and return", () => {
  const profile = MOTION_TRACKER_PROFILES.situps;
  let state = createMotionTrackerState(9.81, 0, { x: 0, y: 0, z: 9.81 });

  let result = processMotionSample(state, profile, tiltedSample(33, 1300));
  assert.equal(result.delta, 0);
  state = result.state;

  result = processMotionSample(state, profile, tiltedSample(41, 1650));
  assert.equal(result.delta, 0);
  state = result.state;

  result = processMotionSample(state, profile, tiltedSample(5, 2200));
  assert.equal(result.delta, 1);
});

test("squat tracker counts one controlled down-up cycle", () => {
  const profile = MOTION_TRACKER_PROFILES.squats;
  let state = createMotionTrackerState(9.81, 0, { x: 0, y: 0, z: 9.81 });

  let result = processMotionSample(state, profile, tiltedSample(18, 1300, 0.6));
  assert.equal(result.delta, 0);
  state = result.state;

  result = processMotionSample(state, profile, tiltedSample(23, 1800, 0.5));
  assert.equal(result.delta, 0);
  state = result.state;

  result = processMotionSample(state, profile, tiltedSample(4, 2300, 0.25));
  assert.equal(result.delta, 1);
});

test("body-angle trackers reject a quick phone shake without a body angle cycle", () => {
  for (const profile of [MOTION_TRACKER_PROFILES.situps, MOTION_TRACKER_PROFILES.squats]) {
    let state = createMotionTrackerState(9.81, 0, { x: 0, y: 0, z: 9.81 });

    let result = processMotionSample(state, profile, { x: 0, y: 0, z: 9.81, timestamp: 1400, linearMagnitude: 6.5 });
    assert.equal(result.delta, 0);
    state = result.state;

    result = processMotionSample(state, profile, { x: 0, y: 0, z: 9.81, timestamp: 1800, linearMagnitude: 0.1 });
    assert.equal(result.delta, 0);
  }
});

test("baseline averages stationary sensor magnitudes", () => {
  const baseline = getBaseline([
    { x: 0, y: 0, z: 9.7 },
    { x: 0, y: 0, z: 9.9 },
    { x: 0, y: 0, z: 9.8 },
  ]);

  assert.equal(Number(baseline.toFixed(2)), 9.8);
});

test("baseline vector averages stationary sensor axes", () => {
  const baseline = getBaselineVector([
    { x: 0.1, y: 0.2, z: 9.7 },
    { x: -0.1, y: 0, z: 9.9 },
    { x: 0, y: -0.2, z: 9.8 },
  ]);

  assert.equal(Number(baseline.x.toFixed(2)), 0);
  assert.equal(Number(baseline.y.toFixed(2)), 0);
  assert.equal(Number(baseline.z.toFixed(2)), 9.8);
});
