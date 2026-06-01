import assert from "node:assert/strict";
import test from "node:test";
import { getTrackedCommitValue, shouldConfirmTrackerClose } from "./motionTrackerClose";

test("tracker close asks for confirmation only when there is a value to save", () => {
  assert.equal(shouldConfirmTrackerClose("pushups", 0.9), false);
  assert.equal(shouldConfirmTrackerClose("pushups", 1), true);
  assert.equal(shouldConfirmTrackerClose("runningKm", 0.004), false);
  assert.equal(shouldConfirmTrackerClose("runningKm", 0.01), true);
});

test("tracker close commit value floors reps but keeps running decimals", () => {
  assert.equal(getTrackedCommitValue("situps", 12.9), 12);
  assert.equal(getTrackedCommitValue("squats", 7.1), 7);
  assert.equal(getTrackedCommitValue("runningKm", 1.234), 1.23);
});
