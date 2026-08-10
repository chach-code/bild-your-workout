import { getExerciseById } from '../data/exercises';
import type { PlannedExercise } from '../types';

export type TimerPhaseKind = 'leadin' | 'work' | 'rest';

export interface TimerPhase {
  kind: TimerPhaseKind;
  seconds: number;
  label: string;
  /** 1-based round index when repeating intervals/sets */
  round?: number;
  totalRounds?: number;
}

export interface TimerPlan {
  exerciseName: string;
  prescription: string;
  phases: TimerPhase[]; /** excludes lead-in; lead-in added at runtime */
  summary: string;
}

const TIME_HINT =
  /\d+\s*(?:–|-)\s*\d+\s*min|\d+\s*(?:sec|secs|second|seconds|min|mins|minute|minutes)/i;

function toSeconds(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith('min')) return value * 60;
  return value;
}

function titleCaseLabel(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'Work';
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseDurationToken(token: string): number | null {
  const range = token.match(/(\d+)\s*(?:–|-)\s*(\d+)\s*(sec|secs|second|seconds|min|mins|minute|minutes)/i);
  if (range) {
    // Use the lower bound for ranges like "10–20 min"
    return toSeconds(Number(range[1]), range[3]);
  }
  const single = token.match(/(\d+)\s*(sec|secs|second|seconds|min|mins|minute|minutes)/i);
  if (single) {
    return toSeconds(Number(single[1]), single[2]);
  }
  return null;
}

/** Detect side-alternating prescriptions ("each", "each side", "each way", "each leg"). */
function isEachSide(reps: string): boolean {
  return /\beach(?:\s+(?:side|way|leg|arm))?\b/i.test(reps);
}

/**
 * Build a timer plan from an exercise prescription.
 * Returns null when the exercise is reps-based (no duration to time).
 */
export function buildTimerPlan(exercise: PlannedExercise): TimerPlan | null {
  const catalog = getExerciseById(exercise.exerciseId);
  const reps = exercise.reps.trim();
  const timed = catalog?.isTimed || TIME_HINT.test(reps);
  if (!timed) return null;

  const sets = Math.max(1, exercise.sets || 1);
  const betweenSetRest = exercise.restSeconds > 0 ? exercise.restSeconds : 0;
  const phases: TimerPhase[] = [];

  // Interval style: "15 sec sprint / 45 sec walk" or "30 sec hard / 60 sec easy"
  const interval = reps.match(
    /(\d+)\s*(sec|secs|second|seconds|min|mins|minute|minutes)\s+([^/]+?)\s*\/\s*(\d+)\s*(sec|secs|second|seconds|min|mins|minute|minutes)\s*(.*)?$/i,
  );

  if (interval) {
    const workSec = toSeconds(Number(interval[1]), interval[2]);
    const workLabel = titleCaseLabel(interval[3] || 'Work');
    const restSec = toSeconds(Number(interval[4]), interval[5]);
    const restLabel = titleCaseLabel(interval[6] || 'Rest') || 'Rest';
    const rounds = sets;

    for (let r = 1; r <= rounds; r++) {
      phases.push({
        kind: 'work',
        seconds: workSec,
        label: workLabel,
        round: r,
        totalRounds: rounds,
      });
      // Rest after every round except the last
      if (r < rounds) {
        phases.push({
          kind: 'rest',
          seconds: restSec,
          label: restLabel,
          round: r,
          totalRounds: rounds,
        });
      }
    }

    return {
      exerciseName: exercise.name,
      prescription: `${sets} × ${reps}`,
      phases,
      summary: `${rounds} rounds · ${workSec}s ${workLabel} / ${restSec}s ${restLabel}`,
    };
  }

  const duration = parseDurationToken(reps);
  if (duration == null || duration <= 0) return null;

  if (isEachSide(reps)) {
    for (let s = 1; s <= sets; s++) {
      phases.push({
        kind: 'work',
        seconds: duration,
        label: 'Side A',
        round: s,
        totalRounds: sets,
      });
      phases.push({
        kind: 'work',
        seconds: duration,
        label: 'Side B',
        round: s,
        totalRounds: sets,
      });
      if (s < sets && betweenSetRest > 0) {
        phases.push({
          kind: 'rest',
          seconds: betweenSetRest,
          label: 'Rest',
          round: s,
          totalRounds: sets,
        });
      }
    }

    return {
      exerciseName: exercise.name,
      prescription: `${sets} × ${reps}`,
      phases,
      summary: `${sets} set${sets > 1 ? 's' : ''} · ${duration}s each side`,
    };
  }

  // Simple timed hold / continuous effort, possibly multiple sets
  for (let s = 1; s <= sets; s++) {
    phases.push({
      kind: 'work',
      seconds: duration,
      label: sets > 1 ? `Set ${s}` : 'Go',
      round: s,
      totalRounds: sets,
    });
    if (s < sets && betweenSetRest > 0) {
      phases.push({
        kind: 'rest',
        seconds: betweenSetRest,
        label: 'Rest',
        round: s,
        totalRounds: sets,
      });
    }
  }

  const mins = duration >= 60 ? `${Math.round(duration / 60)} min` : `${duration}s`;
  return {
    exerciseName: exercise.name,
    prescription: `${sets} × ${reps}`,
    phases,
    summary: sets > 1 ? `${sets} sets · ${mins} each` : mins,
  };
}

export function isTimedExercise(exercise: PlannedExercise): boolean {
  return buildTimerPlan(exercise) != null;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m <= 0) return String(rem);
  return `${m}:${rem.toString().padStart(2, '0')}`;
}
