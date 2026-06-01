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
    { enabled: true, dailyReminderTimes: ["09:00"], quietHours: { enabled: false, from: "22:00", to: "07:00" } },
    new Date("2026-05-25T07:00:00"),
    true
  );

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
