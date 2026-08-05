export function getTotalListeners(
  listeners: number[],
): number {
  return listeners.reduce(
    (total, value) => total + value,
    0,
  );
}

export function getActiveStreams(
  online: boolean[],
): number {
  return online.filter(Boolean).length;
}

export function getAudienceRanking<
  T extends {
    listeners?: number | null;
  },

>(stations: T[]): T[] {
  return [...stations].sort(
    (first, second) =>
      (second.listeners ?? 0) - (first.listeners ?? 0),
  );
}
export function getLeaderStation<T>(
  ranking: T[],
): T | undefined {
  return ranking[0];
}