import assert from "node:assert/strict";
import test from "node:test";
import {
  formatResetCountdown,
  getIncompleteDailyQuestItems,
  getMsUntilNextLocalDay,
} from "./dailyQuestUi";

test("daily quest UI hides completed items", () => {
  const items = [
    { id: "pushups", target: 10 },
    { id: "situps", target: 10 },
    { id: "squats", target: 10 },
  ];

  const visible = getIncompleteDailyQuestItems(items, {
    pushups: 10,
    situps: 4,
    squats: 12,
  });

  assert.deepEqual(visible.map((item) => item.id), ["situps"]);
});

test("daily reset countdown uses next local midnight", () => {
  const ms = getMsUntilNextLocalDay(new Date("2026-05-25T23:59:50"));
  assert.equal(formatResetCountdown(ms), "00:00:10");
});
