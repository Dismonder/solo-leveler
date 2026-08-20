import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDailyReminderSchedule,
  DEFAULT_NOTIFICATION_SETTINGS,
  isQuietTime,
  normalizeNotificationSettings,
} from "./notifications";

test("notification settings migrate old saves with defaults", () => {
  const settings = normalizeNotificationSettings({ enabled: true, dailyReminderTimes: ["7:00", "08:30", "08:30"] as string[] });

  assert.equal(settings.enabled, true);
  assert.deepEqual(settings.dailyReminderTimes, ["08:30"]);
  assert.equal(settings.quietHours.from, DEFAULT_NOTIFICATION_SETTINGS.quietHours.from);
  assert.equal(settings.workoutOngoingEnabled, true);
});

test("daily reminders are skipped after completion", () => {
  const schedule = buildDailyReminderSchedule(
    {
      enabled: true,
      dailyReminderTimes: ["09:00"],
      hydrationReminders: false,
      miniGameReminders: false,
      exerciseTipReminders: false,
      deadlineAlertEnabled: true,
      quietHours: { enabled: false, from: "22:00", to: "07:00" },
    },
    new Date("2026-05-25T07:00:00"),
    true
  );

  assert.equal(schedule.some((entry) => entry.type === "daily" || entry.type === "deadline"), false);
  assert.equal(schedule.length, 0);
});


test("quiet hours handle overnight range", () => {
  const quietHours = { enabled: true, from: "22:00", to: "07:00" };

  assert.equal(isQuietTime(new Date("2026-05-25T23:30:00"), quietHours), true);
  assert.equal(isQuietTime(new Date("2026-05-25T06:30:00"), quietHours), true);
  assert.equal(isQuietTime(new Date("2026-05-25T12:00:00"), quietHours), false);
});

test("deadline reminder becomes exact only when enabled", () => {
  const schedule = buildDailyReminderSchedule(
    {
      enabled: true,
      dailyReminderTimes: [],
      deadlineAlertEnabled: true,
      exactAlarmEnabled: true,
      quietHours: { enabled: false, from: "22:00", to: "07:00" },
    },
    new Date("2026-05-25T10:00:00"),
    false
  );

  assert.equal(schedule.some((entry) => entry.channelId === "deadline_alert" && entry.exact), true);
});

test("personalized schedule generates hydration, minigame and exercise tip reminders with actions", () => {
  const schedule = buildDailyReminderSchedule(
    {
      enabled: true,
      dailyReminderTimes: ["09:00"],
      hydrationReminders: true,
      miniGameReminders: true,
      exerciseTipReminders: true,
      quietHours: { enabled: false, from: "22:00", to: "07:00" },
    },
    new Date("2026-05-25T08:00:00"),
    false,
    { name: "Damian", rank: "S" }
  );

  const hydration = schedule.find((e) => e.type === "hydration");
  assert.ok(hydration, "Hydration reminder should exist");
  assert.equal(hydration?.action, "open_hydration");
  assert.ok(hydration?.body.includes("Damian"));

  const minigame = schedule.find((e) => e.type === "minigame");
  assert.ok(minigame, "Minigame reminder should exist");
  assert.ok(minigame?.action?.startsWith("open_minigame:"));

  const exercise = schedule.find((e) => e.type === "exercise_tip");
  assert.ok(exercise, "Exercise tip reminder should exist");
  assert.ok(exercise?.action?.startsWith("open_exercise:"));

  const daily = schedule.find((e) => e.type === "daily");
  assert.ok(daily, "Daily reminder should exist");
  assert.ok(daily?.title.includes("Ranga S"));
});

