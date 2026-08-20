type RefreshRateStatus = {
  currentRefreshRate?: number;
  refreshRate?: number;
};

export function selectActiveRefreshRate({ currentRefreshRate, refreshRate }: RefreshRateStatus) {
  if (Number.isFinite(currentRefreshRate) && currentRefreshRate > 0) return currentRefreshRate;
  if (Number.isFinite(refreshRate) && refreshRate > 0) return refreshRate;
  return 0;
}
