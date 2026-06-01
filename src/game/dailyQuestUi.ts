export type DailyQuestListItem = {
  id: string;
  target: number;
};

export function getIncompleteDailyQuestItems<T extends DailyQuestListItem>(
  items: T[],
  values: Partial<Record<T["id"], number | null | undefined>>
) {
  return items.filter((item) => !isDailyQuestItemComplete(Number(values[item.id] || 0), item.target));
}

export function isDailyQuestItemComplete(current: number, target: number) {
  return current >= target;
}

export function getMsUntilNextLocalDay(now = new Date()) {
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 0, 0);
  return Math.max(0, nextDay.getTime() - now.getTime());
}

export function formatResetCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
