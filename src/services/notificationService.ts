import { Capacitor, registerPlugin } from "@capacitor/core";
import type { HunterNotificationContext, NotificationScheduleEntry } from "../game/notifications";
import { buildDailyReminderSchedule } from "../game/notifications";
import type { DailyPenalty, NotificationSettings } from "../types";


export type HunterNotificationStatus = {
  android: boolean;
  permissionGranted: boolean;
  exactAlarmAvailable: boolean;
  exactAlarmGranted: boolean;
  channelsReady: boolean;
  scheduledCount: number;
  message: string;
};

export type NativeScheduledNotification = {
  id: string;
  channelId: string;
  title: string;
  body: string;
  atMs: number;
  exact: boolean;
  action?: string;
};


type HunterNotificationsPlugin = {
  getStatus(): Promise<HunterNotificationStatus>;
  requestPermission(): Promise<HunterNotificationStatus>;
  configureChannels(): Promise<HunterNotificationStatus>;
  openExactAlarmSettings(): Promise<{ opened: boolean; message: string }>;
  testNotification(options?: { channelId?: string; title?: string; body?: string }): Promise<{ shown: boolean; message: string }>;
  scheduleNotifications(options: { notifications: NativeScheduledNotification[] }): Promise<{ scheduledCount: number; message: string }>;
  cancelNotifications(options?: { ids?: string[]; channelId?: string }): Promise<{ cancelled: number; message: string }>;
  getScheduledNotifications(): Promise<{ notifications: NativeScheduledNotification[] }>;
  showRewardNotification(options: { title: string; body: string }): Promise<{ shown: boolean; message: string }>;
  showPenaltyNotification(options: { penaltyId: string; title: string; body: string }): Promise<{ shown: boolean; message: string }>;
  showWorkoutOngoing(options: { title: string; body: string; paused?: boolean }): Promise<{ shown: boolean; message: string }>;
  clearWorkoutOngoing(): Promise<{ cleared: boolean; message: string }>;
  showMediaPlaybackNotification(options: {
    title: string;
    artist: string;
    backgroundName?: string;
    isPlaying: boolean;
    position?: number;
    duration?: number;
  }): Promise<{ shown: boolean; message: string }>;
  clearMediaPlaybackNotification(): Promise<{ cleared: boolean; message: string }>;
  getLaunchAction(): Promise<{ action: string | null }>;
  clearLaunchAction(): Promise<{ cleared: boolean }>;
};


const HunterNotifications = registerPlugin<HunterNotificationsPlugin>("HunterNotifications");


const WEB_STATUS: HunterNotificationStatus = {
  android: false,
  permissionGranted: false,
  exactAlarmAvailable: false,
  exactAlarmGranted: false,
  channelsReady: false,
  scheduledCount: 0,
  message: "Powiadomienia: tylko Android.",
};

export async function getNotificationStatus(): Promise<HunterNotificationStatus> {
  if (!Capacitor.isNativePlatform()) return WEB_STATUS;
  try {
    return await HunterNotifications.getStatus();
  } catch (error) {
    return { ...WEB_STATUS, android: true, message: errorMessage(error, "Nie udało się sprawdzić powiadomień.") };
  }
}

export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return WEB_STATUS;
  try {
    return await HunterNotifications.requestPermission();
  } catch (error) {
    return { ...WEB_STATUS, android: true, message: errorMessage(error, "Android odrzucił prośbę o powiadomienia.") };
  }
}

export async function configureNotificationChannels() {
  if (!Capacitor.isNativePlatform()) return WEB_STATUS;
  try {
    return await HunterNotifications.configureChannels();
  } catch (error) {
    return { ...WEB_STATUS, android: true, message: errorMessage(error, "Nie udało się skonfigurować kanałów.") };
  }
}

export async function openExactAlarmSettings() {
  if (!Capacitor.isNativePlatform()) {
    return { opened: false, message: "Dokładne alarmy są dostępne tylko w aplikacji Android." };
  }
  return HunterNotifications.openExactAlarmSettings();
}

export async function testLocalNotification(channelId = "daily_training") {
  if (!Capacitor.isNativePlatform()) return { shown: false, message: WEB_STATUS.message };
  return HunterNotifications.testNotification({
    channelId,
    title: "System Łowcy",
    body: "Test lokalnego powiadomienia działa offline.",
  });
}

export async function scheduleDailyTrainingNotifications(
  settings: NotificationSettings,
  dailyCompleted: boolean,
  context?: HunterNotificationContext
) {
  if (!Capacitor.isNativePlatform()) {
    return { scheduledCount: 0, message: WEB_STATUS.message };
  }
  const notifications = buildDailyReminderSchedule(settings, new Date(), dailyCompleted, context).map(toNativeNotification);
  await HunterNotifications.cancelNotifications({ channelId: "daily_training" });
  await HunterNotifications.cancelNotifications({ channelId: "deadline_alert" });
  await HunterNotifications.cancelNotifications({ channelId: "rewards" });
  if (!notifications.length) return { scheduledCount: 0, message: "Brak alertów do zaplanowania." };
  return HunterNotifications.scheduleNotifications({ notifications });
}

export async function cancelDailyTrainingNotifications() {
  if (!Capacitor.isNativePlatform()) return { cancelled: 0, message: WEB_STATUS.message };
  const daily = await HunterNotifications.cancelNotifications({ channelId: "daily_training" });
  const deadline = await HunterNotifications.cancelNotifications({ channelId: "deadline_alert" });
  const rewards = await HunterNotifications.cancelNotifications({ channelId: "rewards" });
  return { cancelled: daily.cancelled + deadline.cancelled + rewards.cancelled, message: "Dzisiejsze przypomnienia treningowe anulowane." };
}

export async function getScheduledNotifications(): Promise<NativeScheduledNotification[]> {
  if (!Capacitor.isNativePlatform()) return [];
  const result = await HunterNotifications.getScheduledNotifications();
  return result.notifications || [];
}

export async function notifyDailyReward(settings: NotificationSettings, title: string, body: string) {
  if (!settings.enabled || !settings.rewardNotifications || !Capacitor.isNativePlatform()) return;
  await HunterNotifications.showRewardNotification({ title, body });
}

export async function notifyPenaltyCreated(settings: NotificationSettings, penalty: DailyPenalty) {
  if (!settings.enabled || !settings.penaltyNotifications || !Capacitor.isNativePlatform()) return;
  await HunterNotifications.showPenaltyNotification({
    penaltyId: penalty.id,
    title: "System naliczył karę",
    body: `${penalty.exerciseName}: ${penalty.requiredAmount} ${penalty.exerciseId === "plank" || penalty.exerciseId === "wall-sit" ? "s" : "powt."}`,
  });
}

export async function showWorkoutOngoingNotification(settings: NotificationSettings, body: string, paused = false) {
  if (!settings.enabled || !settings.workoutOngoingEnabled || !Capacitor.isNativePlatform()) return;
  await HunterNotifications.showWorkoutOngoing({ title: "Aktywny plan treningowy", body, paused });
}

export async function clearWorkoutOngoingNotification() {
  if (!Capacitor.isNativePlatform()) return;
  await HunterNotifications.clearWorkoutOngoing();
}

export type NativeMediaNotificationOptions = {
  title: string;
  artist: string;
  backgroundName?: string;
  isPlaying: boolean;
  position?: number;
  duration?: number;
};

export async function showNativeMediaNotification(options: NativeMediaNotificationOptions) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await HunterNotifications.showMediaPlaybackNotification(options);
  } catch {
    // Ignore if notifications are blocked or unavailable
  }
}


export async function clearNativeMediaNotification() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await HunterNotifications.clearMediaPlaybackNotification();
  } catch {
    // Ignore
  }
}

export function addMediaActionListener(callback: (action: string) => void) {
  if (!Capacitor.isNativePlatform()) return () => {};
  try {
    const handlePromise = (HunterNotifications as unknown as { addListener: (event: string, cb: (data: { action: string }) => void) => Promise<{ remove: () => void }> })
      .addListener("mediaAction", (data) => {
        if (data?.action) callback(data.action);
      });
    return () => {
      void handlePromise.then((h) => h?.remove?.()).catch(() => {});
    };
  } catch {
    return () => {};
  }
}

export function addHunterActionListener(callback: (action: string) => void) {
  if (!Capacitor.isNativePlatform()) return () => {};
  try {
    const handlePromise = (HunterNotifications as unknown as { addListener: (event: string, cb: (data: { action: string }) => void) => Promise<{ remove: () => void }> })
      .addListener("hunterAction", (data) => {
        if (data?.action) callback(data.action);
      });
    return () => {
      void handlePromise.then((h) => h?.remove?.()).catch(() => {});
    };
  } catch {
    return () => {};
  }
}

export async function consumeNotificationLaunchAction(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const result = await HunterNotifications.getLaunchAction();
    if (result.action) await HunterNotifications.clearLaunchAction();
    return result.action || null;
  } catch {
    return null;
  }
}

function toNativeNotification(entry: NotificationScheduleEntry): NativeScheduledNotification {
  return {
    id: entry.id,
    channelId: entry.channelId,
    title: entry.title,
    body: entry.body,
    atMs: entry.atMs,
    exact: entry.exact,
    action: entry.action,
  };
}

export async function notifyAppUpdateAvailable(updateInfo: { latestVersion: string; changelog?: string[] }) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const title = `⚡ Nowa wersja Solo Leveler v${updateInfo.latestVersion}!`;
    const body = updateInfo.changelog?.length
      ? `Nowości: ${updateInfo.changelog.slice(0, 2).join(" · ")}. Kliknij, aby pobrać aktualizację.`
      : `Aktualizacja v${updateInfo.latestVersion} jest gotowa do pobrania. Sprawdź nowe funkcje!`;
    await HunterNotifications.showRewardNotification({ title, body });
  } catch {
    // Ignore notification errors
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

