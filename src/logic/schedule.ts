/** Helpers for schedule / history UI. */

export function startOfWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function completedDayIndexesThisWeek(
  history: { completed: boolean; date: string; dayIndex: number }[],
  now = new Date(),
): Set<number> {
  const weekStart = startOfWeek(now);
  const set = new Set<number>();
  for (const h of history) {
    if (!h.completed) continue;
    if (new Date(h.date) >= weekStart) set.add(h.dayIndex);
  }
  return set;
}
