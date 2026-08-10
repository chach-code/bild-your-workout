import type { AppState, ProgressStats, WorkoutPlan, WorkoutSessionLog, UserProfile } from '../types';

const STORAGE_KEY = 'build_your_workout_v1';

export function defaultStats(): ProgressStats {
  return {
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyCompletions: 0,
    lastWorkoutDate: null,
    personalRecords: [],
  };
}

export function defaultState(): AppState {
  return {
    profile: null,
    plan: null,
    history: [],
    stats: defaultStats(),
    currentWeek: 1,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...defaultState(),
      ...parsed,
      stats: { ...defaultStats(), ...parsed.stats },
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dayKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function recomputeStats(history: WorkoutSessionLog[]): ProgressStats {
  const completed = history.filter((h) => h.completed);
  const totalWorkouts = completed.length;

  const dates = [...new Set(completed.map((h) => dayKey(h.date)))].sort();
  let currentStreak = 0;
  let longestStreak = 0;

  if (dates.length) {
    // streak counting by consecutive calendar days with a completed workout
    const dateSet = new Set(dates);
    const cursor = new Date();
    // allow streak to count if worked out today or yesterday
    const today = dayKey(cursor);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = dayKey(yesterdayDate);

    let start = dateSet.has(today) ? today : dateSet.has(yesterday) ? yesterday : null;
    if (start) {
      const d = new Date(start);
      while (dateSet.has(dayKey(d))) {
        currentStreak += 1;
        d.setDate(d.getDate() - 1);
      }
    }

    let run = 0;
    let prev: string | null = null;
    for (const dk of dates) {
      if (!prev) {
        run = 1;
      } else {
        const prevDate = new Date(prev);
        prevDate.setDate(prevDate.getDate() + 1);
        run = dayKey(prevDate) === dk ? run + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prev = dk;
    }
  }

  const weekStart = startOfWeek(new Date());
  const weeklyCompletions = completed.filter((h) => new Date(h.date) >= weekStart).length;

  return {
    totalWorkouts,
    currentStreak,
    longestStreak,
    weeklyCompletions,
    lastWorkoutDate: dates.length ? dates[dates.length - 1] : null,
    personalRecords: [],
  };
}

export function persistNewPlan(profile: UserProfile, plan: WorkoutPlan): AppState {
  const state: AppState = {
    ...loadState(),
    profile,
    plan,
    currentWeek: 1,
  };
  saveState(state);
  return state;
}

export function persistSession(log: WorkoutSessionLog): AppState {
  const state = loadState();
  const history = [log, ...state.history.filter((h) => h.id !== log.id)];
  const stats = recomputeStats(history);
  const next = { ...state, history, stats };
  saveState(next);
  return next;
}

export function persistWeek(week: number): AppState {
  const state = loadState();
  const next = { ...state, currentWeek: week };
  saveState(next);
  return next;
}
