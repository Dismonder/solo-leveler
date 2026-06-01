import type { NotificationSettings } from "../types";

export type NotificationChannelId =
  | "daily_training"
  | "deadline_alert"
  | "workout_session"
  | "penalties"
  | "rewards";

export type NotificationScheduleEntry = {
  id: string;
  channelId: NotificationChannelId;
  type: "daily" | "deadline" | "penalty" | "reward" | "workout";
  title: string;
  body: string;
  atMs: number;
  exact: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyReminderTimes: ["09:00", "18:00"],
  deadlineAlertEnabled: false,
  exactAlarmEnabled: false,
  quietHours: {
    enabled: true,
    from: "22:00",
    to: "07:00",
  },
  workoutOngoingEnabled: true,
  rewardNotifications: true,
  penaltyNotifications: true,
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function normalizeNotificationSettings(input: Partial<NotificationSettings> | null | undefined): NotificationSettings {
  const dailyReminderTimes = Array.isArray(input?.dailyReminderTimes)
    ? Array.from(new Set(input.dailyReminderTimes.filter(isTimeString))).slice(0, 6)
    : DEFAULT_NOTIFICATION_SETTINGS.dailyReminderTimes;

  const quietHours = {
    ...DEFAULT_NOTIFICATION_SETTINGS.quietHours,
    ...(input?.quietHours || {}),
  };

  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(input || {}),
    dailyReminderTimes: dailyReminderTimes.length ? dailyReminderTimes : DEFAULT_NOTIFICATION_SETTINGS.dailyReminderTimes,
    quietHours: {
      enabled: Boolean(quietHours.enabled),
      from: isTimeString(quietHours.from) ? quietHours.from : DEFAULT_NOTIFICATION_SETTINGS.quietHours.from,
      to: isTimeString(quietHours.to) ? quietHours.to : DEFAULT_NOTIFICATION_SETTINGS.quietHours.to,
    },
  };
}

export function isTimeString(value: unknown): value is string {
  return typeof value === "string" && TIME_RE.test(value);
}

export function isQuietTime(date: Date, quietHours: NotificationSettings["quietHours"]) {
  if (!quietHours.enabled) return false;
  const current = date.getHours() * 60 + date.getMinutes();
  const from = minutesFromTime(quietHours.from);
  const to = minutesFromTime(quietHours.to);
  if (from === to) return false;
  return from < to ? current >= from && current < to : current >= from || current < to;
}

export function buildDailyReminderSchedule(
  settingsInput: Partial<NotificationSettings> | null | undefined,
  now = new Date(),
  dailyCompleted = false
): NotificationScheduleEntry[] {
  const settings = normalizeNotificationSettings(settingsInput);
  if (!settings.enabled || dailyCompleted) return [];

  const todayKey = dateKey(now);
  const entries: NotificationScheduleEntry[] = [];
  for (const time of settings.dailyReminderTimes) {
    const at = dateAtTime(now, time);
    if (at.getTime() <= now.getTime()) continue;
    if (isQuietTime(at, settings.quietHours)) continue;
    entries.push({
      id: `daily_${todayKey}_${time.replace(":", "")}`,
      channelId: "daily_training",
      type: "daily",
      title: "Daily Quest czeka",
      body: "Zrób dzisiejszy trening zanim System naliczy karę.",
      atMs: at.getTime(),
      exact: false,
    });
  }

  if (settings.deadlineAlertEnabled) {
    const deadline = dateAtTime(now, "21:00");
    if (deadline.getTime() > now.getTime() && !isQuietTime(deadline, settings.quietHours)) {
      entries.push({
        id: `deadline_${todayKey}`,
        channelId: "deadline_alert",
        type: "deadline",
        title: "Ostatnie ostrzeżenie Systemu",
        body: "Daily Quest nie jest ukończony. Zostało mało czasu do resetu.",
        atMs: deadline.getTime(),
        exact: settings.exactAlarmEnabled,
      });
    }
  }

  return entries;
}

export function nextReminderPreview(settingsInput: Partial<NotificationSettings> | null | undefined, now = new Date()) {
  const [next] = buildDailyReminderSchedule(settingsInput, now, false).sort((a, b) => a.atMs - b.atMs);
  return next || null;
}

function minutesFromTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function dateAtTime(base: Date, time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(base);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function dateKey(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
