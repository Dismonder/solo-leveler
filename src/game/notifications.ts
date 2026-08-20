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
  type: "daily" | "deadline" | "penalty" | "reward" | "workout" | "hydration" | "minigame" | "exercise_tip";
  title: string;
  body: string;
  atMs: number;
  exact: boolean;
  action?: string;
};

export type HunterNotificationContext = {
  name?: string;
  rank?: string;
  level?: number;
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
  hydrationReminders: true,
  miniGameReminders: true,
  exerciseTipReminders: true,
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const FEATURED_BODYWEIGHT_EXERCISES = [
  {
    id: "pompki-diamentowe",
    name: "Pompki diamentowe",
    target: "triceps i klatkę piersiową",
    tip: "Złącz dłonie w trójkąt/diament pod klatką piersiową dla maksymalnego zaangażowania tricepsów.",
  },
  {
    id: "pompki-archer",
    name: "Pompki Archer",
    target: "siłę jednostronną klatki i barków",
    tip: "Przenoś ciężar ciała płynnie na jedno ramię, prostując drugie w bok jak łucznik.",
  },
  {
    id: "pompki-hindu",
    name: "Pompki Hindu",
    target: "barki, klatkę i mobilność kręgosłupa",
    tip: "Płynny ruch nurkowania z pozycji psa z głową w dół do pozycji kobry wzmacnia całe ciało.",
  },
  {
    id: "przysiad-bulgarski",
    name: "Przysiad bułgarski",
    target: "czworogłowe uda i pośladki",
    tip: "Oprzyj jedną stopę z tyłu na krześle lub kanapie – fantastyczny test równowagi i siły nóg.",
  },
  {
    id: "hollow-body-hold",
    name: "Hollow Body Hold",
    target: "głębokie mięśnie brzucha (core)",
    tip: "Dociśnij odcinek lędźwiowy do maty, unieś lekko łopatki i wyprostowane nogi. Wytrzymaj 30 sekund!",
  },
  {
    id: "plank",
    name: "Plank klasyczny",
    target: "stabilizację korpusu i mięśnie głębokie",
    tip: "Napnij mocno pośladki i brzuch, łokcie prostopadle pod barkami. Równomierny oddech to klucz.",
  },
  {
    id: "mountain-climbers",
    name: "Mountain Climbers",
    target: "kondycję, brzuch i dynamikę",
    tip: "Dynamicznie przyciągaj kolana do klatki w podporze przodem, trzymając biodra stabilnie.",
  },
  {
    id: "glute-bridge",
    name: "Glute Bridge (Mostek biodrowy)",
    target: "pośladki i tył uda",
    tip: "Unoś biodra do pełnego wyprostu, zatrzymując napięcie na 2 sekundy na górze.",
  },
] as const;

export const FEATURED_MINI_GAMES = [
  {
    id: "shadow-extraction",
    name: "Ekstrakcja Cieni",
    desc: "Wyciągnij cienie poległych potworów i wzmocnij swoją armię monarchy!",
  },
  {
    id: "shadow-strike",
    name: "Cięcie Cieni",
    desc: "Przetestuj szybkość reakcji i tnij nadlatujące cele z precyzją łowcy!",
  },
  {
    id: "gate-dodge",
    name: "Uniki w Bramie",
    desc: "Omijaj zabójcze przeszkody w niestabilnej szczelinie wymiarowej!",
  },
  {
    id: "mana-memory",
    name: "Pamięć Run",
    desc: "Odtwórz sekwencje starożytnych run i zregeneruj zasoby mentalne!",
  },
] as const;

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
    hydrationReminders: input?.hydrationReminders ?? DEFAULT_NOTIFICATION_SETTINGS.hydrationReminders,
    miniGameReminders: input?.miniGameReminders ?? DEFAULT_NOTIFICATION_SETTINGS.miniGameReminders,
    exerciseTipReminders: input?.exerciseTipReminders ?? DEFAULT_NOTIFICATION_SETTINGS.exerciseTipReminders,
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
  dailyCompleted = false,
  context: HunterNotificationContext = {}
): NotificationScheduleEntry[] {
  const settings = normalizeNotificationSettings(settingsInput);
  if (!settings.enabled) return [];

  const todayKey = dateKey(now);
  const entries: NotificationScheduleEntry[] = [];
  const hunterName = context.name || "Sung";
  const hunterRank = context.rank || "E";

  // 1. Daily quest reminders (if not yet completed)
  if (!dailyCompleted) {
    for (const time of settings.dailyReminderTimes) {
      const at = dateAtTime(now, time);
      if (at.getTime() <= now.getTime()) continue;
      if (isQuietTime(at, settings.quietHours)) continue;
      entries.push({
        id: `daily_${todayKey}_${time.replace(":", "")}`,
        channelId: "daily_training",
        type: "daily",
        title: `👑 Daily Quest czeka · Ranga ${hunterRank}`,
        body: `Łowco ${hunterName}, wykonaj dzisiejszy trening, by zdobyć punkty statystyk i urosnąć w siłę!`,
        atMs: at.getTime(),
        exact: false,
        action: "open_training",
      });
    }
  }

  // 2. Hydration Reminders (Mana Elixir)
  if (settings.hydrationReminders) {
    const hydrationTimes = ["11:30", "15:30"];
    for (const time of hydrationTimes) {
      const at = dateAtTime(now, time);
      if (at.getTime() <= now.getTime()) continue;
      if (isQuietTime(at, settings.quietHours)) continue;
      entries.push({
        id: `hydration_${todayKey}_${time.replace(":", "")}`,
        channelId: "daily_training",
        type: "hydration",
        title: "💧 Regeneracja Many i Nawodnienie",
        body: `Łowco ${hunterName}, czas na Eliksir Many! Wypij szklankę wody, by utrzymać 100% regeneracji i skupienia.`,
        atMs: at.getTime(),
        exact: false,
        action: "open_hydration",
      });
    }
  }

  // 3. Mini-Game Challenge (Szczelina Treningowa)
  if (settings.miniGameReminders) {
    const gameTime = "14:00";
    const at = dateAtTime(now, gameTime);
    if (at.getTime() > now.getTime() && !isQuietTime(at, settings.quietHours)) {
      const gameIndex = hashString(`${todayKey}:game`) % FEATURED_MINI_GAMES.length;
      const game = FEATURED_MINI_GAMES[gameIndex];
      entries.push({
        id: `minigame_${todayKey}`,
        channelId: "rewards",
        type: "minigame",
        title: `🎮 Brama Treningowa: ${game.name}`,
        body: `Szczelina lochu otwarta! Przetestuj swój refleks w "${game.name}" i zgarnij darmowe punkty XP oraz złoto!`,
        atMs: at.getTime(),
        exact: false,
        action: `open_minigame:${game.id}`,
      });
    }
  }

  // 4. Calisthenics / Bodyweight Exercise Spotlight
  if (settings.exerciseTipReminders) {
    const tipTime = "12:30";
    const at = dateAtTime(now, tipTime);
    if (at.getTime() > now.getTime() && !isQuietTime(at, settings.quietHours)) {
      const exerciseIndex = hashString(`${todayKey}:exercise`) % FEATURED_BODYWEIGHT_EXERCISES.length;
      const exercise = FEATURED_BODYWEIGHT_EXERCISES[exerciseIndex];
      entries.push({
        id: `exercise_${todayKey}`,
        channelId: "daily_training",
        type: "exercise_tip",
        title: `⚔️ Ćwiczenie Łowcy: ${exercise.name}`,
        body: `Chcesz wzmocnić ${exercise.target} bez sprzętu? Kliknij, aby zobaczyć technikę "${exercise.name}".`,
        atMs: at.getTime(),
        exact: false,
        action: `open_exercise:${exercise.id}`,
      });
    }
  }

  // 5. Final Deadline Alert (if quest not completed)
  if (!dailyCompleted && settings.deadlineAlertEnabled) {
    const deadline = dateAtTime(now, "21:00");
    if (deadline.getTime() > now.getTime() && !isQuietTime(deadline, settings.quietHours)) {
      entries.push({
        id: `deadline_${todayKey}`,
        channelId: "deadline_alert",
        type: "deadline",
        title: "⚠️ Ostatnie ostrzeżenie Systemu",
        body: `Łowco ${hunterName}, Twój Daily Quest nie jest ukończony. Zostało mało czasu do resetu dnia!`,
        atMs: deadline.getTime(),
        exact: settings.exactAlarmEnabled,
        action: "open_training",
      });
    }
  }

  return entries.sort((a, b) => a.atMs - b.atMs);
}

export function nextReminderPreview(
  settingsInput: Partial<NotificationSettings> | null | undefined,
  now = new Date(),
  context: HunterNotificationContext = {}
) {
  const [next] = buildDailyReminderSchedule(settingsInput, now, false, context);
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

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

