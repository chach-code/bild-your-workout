import { EXERCISES, getExerciseById } from '../data/exercises';
import { DAY_NAMES, defaultWorkoutDays, formatWorkoutDays, getSportConfig } from '../data/sports';
import type {
  Equipment,
  Exercise,
  FitnessLevel,
  Goal,
  PlannedExercise,
  UserProfile,
  WorkoutDay,
  WorkoutPlan,
} from '../types';

const WARMUP_CARDIO = ['jumping_jacks', 'high_knees', 'butt_kicks', 'seal_jacks', 'march_in_place'];
const WARMUP_UPPER = ['arm_circles', 'scarecrows', 'cross_body_swings', 'scap_squeezes'];
const WARMUP_LOWER = ['bodyweight_squat', 'leg_swings', 'hip_circles', 'bodyweight_good_morning'];
const WARMUP_MOBILITY = ['hip_openers', 'cat_cow', 'inchworms', 'torso_twists'];

const WARMUP_POOL = [...WARMUP_CARDIO, ...WARMUP_UPPER, ...WARMUP_LOWER, ...WARMUP_MOBILITY];

const SENIOR_WARMUP_CARDIO = ['march_in_place', 'arm_circles'];
const SENIOR_WARMUP_UPPER = ['scarecrows', 'scap_squeezes', 'cross_body_swings', 'arm_circles'];
const SENIOR_WARMUP_LOWER = ['bodyweight_squat', 'hip_circles', 'glute_bridge', 'bodyweight_good_morning'];
const SENIOR_WARMUP_MOBILITY = ['cat_cow', 'torso_twists', 'hip_openers', 'bird_dog'];

const SENIOR_WARMUP_POOL = [
  ...SENIOR_WARMUP_CARDIO,
  ...SENIOR_WARMUP_UPPER,
  ...SENIOR_WARMUP_LOWER,
  ...SENIOR_WARMUP_MOBILITY,
];

const COOLDOWN_POOL = [
  'child_pose',
  'quad_stretch',
  'hamstring_stretch',
  'cat_cow',
  'arm_circles',
  'scap_squeezes',
  'hip_circles',
];

/** Higher-impact moves to avoid for older adults. */
const HIGH_IMPACT_IDS = new Set([
  'box_jump',
  'squat_jump',
  'broad_jump',
  'burpee',
  'lateral_bound',
  'skater_hops',
  'sprint_intervals',
  'wall_balls_or_jump_reach',
  'shuttle_runs',
  'mountain_climbers',
]);

type AgeBand = 'youth' | 'adult' | 'mature' | 'senior' | 'elder';

function ageBand(age: number): AgeBand {
  if (age > 0 && age < 18) return 'youth';
  if (age >= 80) return 'elder';
  if (age >= 65) return 'senior';
  if (age >= 50) return 'mature';
  return 'adult';
}

function isYouth(age: number): boolean {
  return ageBand(age) === 'youth';
}

function isOlderAdult(age: number): boolean {
  const band = ageBand(age);
  return band === 'mature' || band === 'senior' || band === 'elder';
}

type SessionFocus =
  | 'lower_power'
  | 'upper_strength'
  | 'full_athletic'
  | 'speed_agility'
  | 'conditioning'
  | 'core_mobility'
  | 'sport_skill'
  | 'lower_strength'
  | 'active_recovery';

function hasEquipment(owned: Equipment[], required: Equipment[]): boolean {
  // If an exercise lists "none", it can be done with bodyweight / no gear.
  if (required.includes('none')) return true;
  const needs = required.filter((r) => r !== 'other');
  if (needs.length === 0) return true;
  return needs.every((n) => owned.includes(n));
}

function exerciseAvailable(ex: Exercise, profile: UserProfile): boolean {
  if (isYouth(profile.age) && !ex.youthSafe) return false;

  const band = ageBand(profile.age);
  if ((band === 'senior' || band === 'elder') && HIGH_IMPACT_IDS.has(ex.id)) return false;
  if (band === 'elder' && (ex.category === 'plyometric' || ex.category === 'power')) return false;
  if (band === 'mature' && ['burpee', 'box_jump', 'sprint_intervals'].includes(ex.id)) return false;

  if (!ex.level.includes(profile.fitnessLevel)) {
    // beginners can use beginner; intermediate can use beginner+intermediate; advanced all matched already
    if (profile.fitnessLevel === 'beginner' && !ex.level.includes('beginner')) return false;
    if (profile.fitnessLevel === 'intermediate' && ex.level.includes('advanced') && !ex.level.includes('intermediate') && !ex.level.includes('beginner')) {
      return false;
    }
  }
  if (ex.sports !== 'all' && !ex.sports.includes(profile.sport) && profile.sport !== 'other' && profile.sport !== 'none') {
    // still allow general athletic moves tagged for other sports if category fits later
    if (!['strength', 'core', 'mobility', 'cardio'].includes(ex.category)) return false;
  }
  return hasEquipment(profile.equipment, ex.equipment);
}

function scoreExercise(ex: Exercise, profile: UserProfile, focus: SessionFocus): number {
  let score = 0;
  const sport = getSportConfig(profile.sport);
  if (ex.sports === 'all') score += 1;
  else if (ex.sports.includes(profile.sport)) score += 5;

  if (sport.preferredCategories.includes(ex.category)) score += 3;

  const goalBoost: Record<Goal, string[]> = {
    stronger: ['strength'],
    muscle: ['strength'],
    faster: ['cardio', 'agility', 'plyometric'],
    jump: ['plyometric', 'strength'],
    endurance: ['cardio'],
    agility: ['agility', 'plyometric'],
    explosiveness: ['plyometric', 'power'],
    fat_loss: ['cardio', 'strength'],
    overall: ['strength', 'cardio', 'core'],
    sport: ['sport', 'agility', 'power'],
  };

  for (const g of profile.goals) {
    if (goalBoost[g]?.includes(ex.category)) score += 2;
  }

  const focusMap: Record<SessionFocus, string[]> = {
    lower_power: ['plyometric', 'power', 'strength'],
    upper_strength: ['strength'],
    full_athletic: ['strength', 'plyometric', 'core'],
    speed_agility: ['agility', 'cardio', 'plyometric'],
    conditioning: ['cardio', 'agility'],
    core_mobility: ['core', 'mobility'],
    sport_skill: ['sport', 'agility', 'power', 'core'],
    lower_strength: ['strength'],
    active_recovery: ['mobility', 'core'],
  };

  if (focusMap[focus].includes(ex.category)) score += 4;

  if (focus.includes('lower') && ex.muscles.some((m) => ['quads', 'glutes', 'hamstrings', 'calves'].includes(m))) {
    score += 3;
  }
  if (
    focus === 'upper_strength' &&
    ex.muscles.some((m) => ['chest', 'shoulders', 'arms'].includes(m) || (m === 'back' && ex.category === 'strength'))
  ) {
    if (['quads', 'glutes', 'hamstrings'].includes(ex.muscles[0])) score -= 4;
    else score += 3;
  }
  if (focus === 'core_mobility' && ex.muscles.some((m) => ['core', 'hips', 'rotational'].includes(m))) {
    score += 3;
  }

  const focusText = `${profile.primaryFocus} ${profile.notes}`.toLowerCase();
  if (focusText.includes('jump') && (ex.id.includes('jump') || ex.category === 'plyometric')) score += 3;
  if (focusText.includes('core') && ex.category === 'core') score += 2;
  if (focusText.includes('speed') && (ex.category === 'agility' || ex.id.includes('sprint'))) score += 2;
  if (focusText.includes('arm') || focusText.includes('shoulder') || focusText.includes('throw')) {
    if (ex.id.includes('band') || ex.muscles.includes('shoulders') || ex.muscles.includes('rotational')) score += 2;
  }

  // Prefer joint-friendlier choices for older adults
  if (isOlderAdult(profile.age)) {
    if (['strength', 'core', 'mobility'].includes(ex.category)) score += 2;
    if (HIGH_IMPACT_IDS.has(ex.id) || ex.category === 'plyometric') score -= 6;
    if (ex.id.includes('sprint')) score -= 4;
  }

  return score;
}

function pickExercises(
  profile: UserProfile,
  focus: SessionFocus,
  count: number,
  exclude: Set<string> = new Set(),
): Exercise[] {
  const candidates = EXERCISES
    .filter((ex) => exerciseAvailable(ex, profile))
    .filter((ex) => !exclude.has(ex.id))
    .filter((ex) => {
      const isWarm = WARMUP_POOL.includes(ex.id);
      const isCool = COOLDOWN_POOL.includes(ex.id);
      if (focus === 'active_recovery' || focus === 'core_mobility') {
        // Keep out high-energy warm-up cardio from mobility days
        if (isWarm && ['jumping_jacks', 'high_knees', 'bodyweight_squat'].includes(ex.id)) return false;
        return true;
      }
      return !isWarm && !isCool;
    })
    .filter((ex) => {
      if (focus === 'upper_strength') {
        const lowerPrimary = ['quads', 'glutes', 'hamstrings', 'calves'].includes(ex.muscles[0]);
        return !lowerPrimary;
      }
      if (focus === 'core_mobility') {
        return ['core', 'mobility'].includes(ex.category) || ex.muscles.includes('rotational') || ex.muscles.includes('hips');
      }
      if (focus === 'active_recovery') {
        return ['mobility', 'core'].includes(ex.category) || ex.id === 'glute_bridge' || ex.id === 'bird_dog' || ex.id === 'dead_bug';
      }
      return true;
    })
    .map((ex) => ({ ex, score: scoreExercise(ex, profile, focus) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked: Exercise[] = [];
  const usedCategories = new Set<string>();
  const usedMuscles = new Set<string>();

  const tryAdd = (ex: Exercise) => {
    if (picked.find((p) => p.id === ex.id)) return false;
    picked.push(ex);
    usedCategories.add(ex.category);
    usedMuscles.add(ex.muscles[0]);
    exclude.add(ex.id);
    return true;
  };

  // Seed required movement patterns for certain focuses
  const seeds: { match: (ex: Exercise) => boolean }[] = [];
  if (focus === 'lower_power' || focus === 'lower_strength') {
    seeds.push({
      match: (ex) =>
        ex.category === 'strength' &&
        ex.muscles.some((m) => ['quads', 'glutes', 'hamstrings'].includes(m)),
    });
  }
  if (focus === 'lower_power' || profile.goals.includes('jump') || profile.goals.includes('explosiveness')) {
    seeds.push({
      match: (ex) => ex.category === 'plyometric' || ex.category === 'power',
    });
  }
  if (focus === 'upper_strength') {
    seeds.push({ match: (ex) => ex.muscles.includes('chest') || ex.id.includes('push') });
    seeds.push({ match: (ex) => ex.muscles.includes('back') || ex.id.includes('row') || ex.id.includes('pull') });
  }
  if (focus === 'sport_skill') {
    seeds.push({ match: (ex) => ex.category === 'sport' || ex.category === 'agility' });
  }
  if (focus === 'core_mobility' || focus === 'active_recovery') {
    seeds.push({ match: (ex) => ex.category === 'core' });
    seeds.push({ match: (ex) => ex.category === 'mobility' });
  }
  if (focus === 'conditioning') {
    seeds.push({ match: (ex) => ex.category === 'cardio' });
  }

  for (const seed of seeds) {
    if (picked.length >= count) break;
    const found = candidates.find(({ ex }) => seed.match(ex));
    if (found) tryAdd(found.ex);
  }

  for (const { ex } of candidates) {
    if (picked.length >= count) break;
    const primary = ex.muscles[0];
    if (
      picked.length > 1 &&
      usedMuscles.has(primary) &&
      usedCategories.has(ex.category) &&
      candidates.length > count * 2
    ) {
      continue;
    }
    tryAdd(ex);
  }

  for (const { ex } of candidates) {
    if (picked.length >= count) break;
    tryAdd(ex);
  }

  return picked;
}

function progressionFor(
  baseSets: number,
  baseReps: string,
  level: FitnessLevel,
  isYouthAthlete: boolean,
): { week: number; sets: number; reps: string }[] {
  const parseNum = (r: string): number | null => {
    const m = r.match(/(\d+)/);
    return m ? Number(m[1]) : null;
  };

  const num = parseNum(baseReps);
  const weeks = [1, 2, 3, 4];

  if (num == null || baseReps.includes('/') || baseReps.includes('min')) {
    return weeks.map((week) => ({
      week,
      sets: baseSets,
      reps: baseReps,
    }));
  }

  const isTimed = /sec/i.test(baseReps);
  const capSets = isYouthAthlete ? Math.min(baseSets + 1, 4) : baseSets + 1;

  return weeks.map((week) => {
    if (isTimed) {
      const secs = num + (week - 1) * (level === 'beginner' ? 5 : 10);
      return { week, sets: baseSets, reps: `${secs} sec` };
    }
    if (week === 1) return { week, sets: baseSets, reps: String(num) };
    if (week === 2) return { week, sets: baseSets, reps: String(num + (level === 'advanced' ? 2 : 2)) };
    if (week === 3) return { week, sets: baseSets, reps: String(num + (level === 'advanced' ? 4 : 4)) };
    return {
      week,
      sets: Math.min(capSets, baseSets + 1),
      reps: String(Math.max(num, num + 2)),
    };
  });
}

function scaleTimedReps(reps: string, factor: number): string {
  return reps.replace(/(\d+)\s*(sec|secs|second|seconds|min|mins|minute|minutes)/gi, (_, n, unit) => {
    const raw = Number(n);
    const scaled = unit.toLowerCase().startsWith('min')
      ? Math.max(5, Math.round(raw * factor))
      : Math.max(10, Math.round(raw * factor));
    return `${scaled} ${unit}`;
  });
}

function forceStrengthReps(ex: Exercise, sets: number, reps: string, band: AgeBand): { sets: number; reps: string } {
  // Strength / most plyometrics should be sets × reps, never long timed sets
  const wantsReps =
    ['strength', 'plyometric', 'power'].includes(ex.category) ||
    ['push_up', 'sit_up', 'bodyweight_squat', 'walking_lunge', 'inverted_row'].includes(ex.id);

  if (!wantsReps) return { sets, reps };
  if (!ex.isTimed && !/sec|min/i.test(reps)) return { sets, reps };

  // Convert accidental timed strength work into clear rep schemes
  let repCount = 10;
  const m = reps.match(/(\d+)/);
  if (m) repCount = Number(m[1]);
  if (ex.defaultReps && !/sec|min/i.test(ex.defaultReps)) {
    const d = ex.defaultReps.match(/(\d+)/);
    if (d) repCount = Number(d[1]);
  }

  if (band === 'elder') {
    return { sets: Math.min(sets, 2), reps: String(Math.max(5, Math.min(repCount, 8))) };
  }
  if (band === 'senior') {
    return { sets: Math.min(sets, 3), reps: String(Math.max(6, Math.min(repCount, 10))) };
  }
  if (band === 'mature') {
    return { sets, reps: String(Math.max(6, Math.min(repCount, 12))) };
  }
  return { sets, reps: String(repCount) };
}

function adjustPrescription(ex: Exercise, profile: UserProfile): PlannedExercise {
  let sets = ex.defaultSets;
  let reps = ex.defaultReps;
  let rest = ex.defaultRest;
  const band = ageBand(profile.age);

  if (profile.fitnessLevel === 'beginner') {
    sets = Math.max(2, sets - 1);
    rest = Math.min(rest + 15, 120);
  } else if (profile.fitnessLevel === 'advanced') {
    sets = Math.min(sets + 1, 5);
  }

  if (profile.duration <= 30) {
    sets = Math.max(2, sets - 1);
  } else if (profile.duration >= 90) {
    sets = Math.min(sets + 1, 5);
  }

  if (band === 'youth') {
    sets = Math.min(sets, 3);
    rest = Math.max(rest, 45);
  } else if (band === 'mature') {
    sets = Math.max(2, sets - 1);
    rest = Math.min(rest + 15, 135);
  } else if (band === 'senior') {
    sets = Math.max(2, Math.min(sets - 1, 3));
    rest = Math.min(rest + 25, 150);
    if (ex.isTimed || /sec|min/i.test(reps)) {
      reps = scaleTimedReps(reps, 0.75);
    } else {
      const n = reps.match(/(\d+)/);
      if (n) reps = reps.replace(n[1], String(Math.max(6, Number(n[1]) - 2)));
    }
  } else if (band === 'elder') {
    sets = Math.min(2, sets);
    rest = Math.min(rest + 35, 180);
    if (ex.isTimed || /sec|min/i.test(reps)) {
      reps = scaleTimedReps(reps, 0.6);
    } else {
      const n = reps.match(/(\d+)/);
      if (n) reps = reps.replace(n[1], String(Math.max(5, Number(n[1]) - 4)));
    }
  }

  // Keep strength-style work as sets × reps (e.g. 3 × 10), not timed minutes
  const forced = forceStrengthReps(ex, sets, reps, band);
  sets = forced.sets;
  reps = forced.reps;

  // Weight progression note for loaded moves
  let notes: string | undefined;
  if (ex.equipment.some((e) => ['dumbbells', 'barbell', 'bands'].includes(e))) {
    notes =
      band === 'elder' || band === 'senior'
        ? 'Use a light, comfortable weight and prioritize smooth form over load.'
        : 'When you can complete all sets with good form, increase the weight slightly next week.';
  }

  const weekProgression = progressionFor(sets, reps, profile.fitnessLevel, isYouth(profile.age));
  const week1 = weekProgression[0];

  return {
    exerciseId: ex.id,
    name: ex.name,
    sets: week1.sets,
    reps: week1.reps,
    restSeconds: rest,
    notes,
    weekProgression,
  };
}

/** Warm-ups are always timed so the Start timer button appears. */
function warmUpTiming(id: string, band: AgeBand): string {
  const short = band === 'elder' || band === 'senior';
  const map: Record<string, string> = {
    jumping_jacks: short ? '20 sec' : '30 sec',
    high_knees: short ? '20 sec' : '30 sec',
    butt_kicks: short ? '20 sec' : '30 sec',
    seal_jacks: short ? '20 sec' : '30 sec',
    march_in_place: short ? '25 sec' : '30 sec',
    arm_circles: short ? '15 sec each way' : '20 sec each way',
    scarecrows: short ? '20 sec' : '30 sec',
    cross_body_swings: short ? '20 sec' : '30 sec',
    scap_squeezes: short ? '20 sec' : '30 sec',
    hip_openers: short ? '30 sec' : '40 sec',
    bodyweight_squat: short ? '20 sec' : '30 sec',
    cat_cow: short ? '30 sec' : '40 sec',
    glute_bridge: short ? '20 sec' : '30 sec',
    bird_dog: short ? '20 sec each side' : '25 sec each side',
    leg_swings: short ? '15 sec each leg' : '20 sec each leg',
    hip_circles: short ? '15 sec each leg' : '20 sec each leg',
    torso_twists: short ? '20 sec' : '30 sec',
    inchworms: short ? '20 sec' : '30 sec',
    bodyweight_good_morning: short ? '20 sec' : '30 sec',
  };
  return map[id] ?? (short ? '20 sec' : '30 sec');
}

/** Stable shuffle so the same profile+day gets a consistent but varied warm-up. */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickFromGroup(group: string[], profile: UserProfile, seed: number, used: Set<string>): string | null {
  const options = seededShuffle(
    group.filter((id) => {
      if (used.has(id)) return false;
      const ex = getExerciseById(id);
      return !!ex && exerciseAvailable(ex, profile);
    }),
    seed,
  );
  return options[0] ?? null;
}

function buildWarmUpBlock(profile: UserProfile, dayIndex: number, focus: SessionFocus): PlannedExercise[] {
  const band = ageBand(profile.age);
  const senior = band === 'senior' || band === 'elder';
  const count = profile.duration <= 15 ? 3 : 4;

  const cardio = senior ? SENIOR_WARMUP_CARDIO : WARMUP_CARDIO;
  const upper = senior ? SENIOR_WARMUP_UPPER : WARMUP_UPPER;
  const lower = senior ? SENIOR_WARMUP_LOWER : WARMUP_LOWER;
  const mobility = senior ? SENIOR_WARMUP_MOBILITY : WARMUP_MOBILITY;

  // Bias groups by session focus so warm-ups feel purposeful
  let order = [cardio, upper, lower, mobility];
  if (focus === 'upper_strength') order = [upper, cardio, mobility, lower];
  if (focus === 'lower_strength' || focus === 'lower_power') order = [lower, cardio, mobility, upper];
  if (focus === 'core_mobility' || focus === 'active_recovery') order = [mobility, upper, lower, cardio];
  if (focus === 'speed_agility' || focus === 'conditioning') order = [cardio, lower, upper, mobility];
  if (focus === 'sport_skill') order = [cardio, mobility, upper, lower];

  const sportSeed = profile.sport.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const seedBase = dayIndex * 97 + sportSeed * 13 + profile.age + count * 3;
  const used = new Set<string>();
  const picked: string[] = [];

  for (let i = 0; i < order.length && picked.length < count; i++) {
    const id = pickFromGroup(order[i], profile, seedBase + i * 17, used);
    if (id) {
      picked.push(id);
      used.add(id);
    }
  }

  // Fill from the full pool if a group was empty
  const fallback = senior ? SENIOR_WARMUP_POOL : WARMUP_POOL;
  const extras = seededShuffle(
    fallback.filter((id) => {
      if (used.has(id)) return false;
      const ex = getExerciseById(id);
      return !!ex && exerciseAvailable(ex, profile);
    }),
    seedBase + 99,
  );
  for (const id of extras) {
    if (picked.length >= count) break;
    picked.push(id);
    used.add(id);
  }

  return picked
    .map((id) => getExerciseById(id))
    .filter((ex): ex is Exercise => !!ex)
    .map((ex) => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: 1,
      reps: warmUpTiming(ex.id, band),
      restSeconds: 0,
    }));
}

function buildCoolDownBlock(profile: UserProfile, dayIndex: number): PlannedExercise[] {
  const band = ageBand(profile.age);
  const factor = band === 'elder' ? 0.75 : band === 'senior' ? 0.85 : 1;
  const seed = dayIndex * 31 + profile.age * 7;
  const picks = seededShuffle(
    COOLDOWN_POOL.filter((id) => {
      const ex = getExerciseById(id);
      return !!ex;
    }),
    seed,
  ).slice(0, 3);

  return picks
    .map((id) => getExerciseById(id))
    .filter((ex): ex is Exercise => !!ex)
    .map((ex) => {
      const planned = adjustPrescription(ex, profile);
      return {
        ...planned,
        sets: 1,
        reps: scaleTimedReps(ex.isTimed || /sec|min/i.test(ex.defaultReps) ? ex.defaultReps : '30 sec', factor),
        restSeconds: 0,
        weekProgression: undefined,
      };
    });
}

function sessionTitle(focus: SessionFocus, sportLabel: string): { title: string; focus: string } {
  const map: Record<SessionFocus, { title: string; focus: string }> = {
    lower_power: { title: 'Lower Body + Explosiveness', focus: 'Leg strength, jumps, and power' },
    upper_strength: { title: 'Upper Body Strength', focus: 'Push, pull, and shoulder stability' },
    full_athletic: { title: 'Full-Body Athleticism', focus: 'Strength, power, and control' },
    speed_agility: { title: 'Speed & Agility', focus: 'Quickness, change of direction, and footwork' },
    conditioning: { title: 'Conditioning Engine', focus: 'Work capacity and endurance' },
    core_mobility: { title: 'Core & Mobility', focus: 'Stability, rotation, and recovery' },
    sport_skill: { title: `${sportLabel} Performance`, focus: `Sport-specific qualities for ${sportLabel.toLowerCase()}` },
    lower_strength: { title: 'Lower Body Strength', focus: 'Squats, hinges, and single-leg strength' },
    active_recovery: { title: 'Active Recovery', focus: 'Light movement, mobility, and reset' },
  };
  return map[focus];
}

function chooseFocusPattern(profile: UserProfile): SessionFocus[] {
  const sport = profile.sport;
  const goals = new Set(profile.goals);
  const days = profile.daysPerWeek;
  const band = ageBand(profile.age);

  let pattern: SessionFocus[] = [];

  if (band === 'senior' || band === 'elder') {
    pattern = ['lower_strength', 'upper_strength', 'core_mobility', 'full_athletic', 'conditioning', 'active_recovery', 'core_mobility'];
  } else if (sport === 'basketball' || goals.has('jump')) {
    pattern = ['lower_power', 'upper_strength', 'speed_agility', 'sport_skill', 'conditioning', 'lower_strength', 'core_mobility'];
  } else if (sport === 'baseball') {
    pattern = ['lower_strength', 'sport_skill', 'upper_strength', 'speed_agility', 'core_mobility', 'full_athletic', 'conditioning'];
  } else if (sport === 'football') {
    pattern = ['full_athletic', 'speed_agility', 'upper_strength', 'lower_power', 'conditioning', 'sport_skill', 'lower_strength'];
  } else if (sport === 'soccer') {
    pattern = ['conditioning', 'lower_strength', 'speed_agility', 'core_mobility', 'sport_skill', 'lower_power', 'full_athletic'];
  } else if (sport === 'hockey') {
    pattern = ['lower_power', 'core_mobility', 'upper_strength', 'conditioning', 'sport_skill', 'speed_agility', 'lower_strength'];
  } else if (sport === 'tennis') {
    pattern = ['speed_agility', 'upper_strength', 'core_mobility', 'conditioning', 'sport_skill', 'lower_strength', 'full_athletic'];
  } else if (sport === 'volleyball') {
    pattern = ['lower_power', 'upper_strength', 'sport_skill', 'core_mobility', 'speed_agility', 'lower_strength', 'conditioning'];
  } else if (sport === 'track') {
    pattern = ['speed_agility', 'lower_power', 'full_athletic', 'conditioning', 'core_mobility', 'lower_strength', 'sport_skill'];
  } else if (goals.has('stronger') || goals.has('muscle')) {
    pattern = ['lower_strength', 'upper_strength', 'full_athletic', 'core_mobility', 'lower_power', 'upper_strength', 'conditioning'];
  } else if (goals.has('endurance') || goals.has('fat_loss')) {
    pattern = ['conditioning', 'full_athletic', 'speed_agility', 'lower_strength', 'core_mobility', 'conditioning', 'upper_strength'];
  } else {
    pattern = ['full_athletic', 'conditioning', 'lower_strength', 'upper_strength', 'speed_agility', 'core_mobility', 'sport_skill'];
  }

  return pattern.slice(0, days);
}

function workoutExerciseCount(duration: number): number {
  if (duration <= 15) return 3;
  if (duration <= 30) return 4;
  if (duration <= 45) return 5;
  if (duration <= 60) return 6;
  return 7;
}

function resolveWorkoutDays(profile: UserProfile): number[] {
  if (profile.daysPerWeek >= 7) return defaultWorkoutDays(7);
  const picked = [...new Set(profile.workoutDays ?? [])]
    .filter((day) => day >= 0 && day <= 6)
    .sort((a, b) => a - b);
  if (picked.length === profile.daysPerWeek) return picked;
  return defaultWorkoutDays(profile.daysPerWeek);
}

function placeWorkoutDays(
  profile: UserProfile,
): { dayIndex: number; isWorkout: boolean; isActiveRecovery: boolean }[] {
  const workoutIndexes = new Set(resolveWorkoutDays(profile));
  const slots = Array.from({ length: 7 }, (_, dayIndex) => ({
    dayIndex,
    isWorkout: workoutIndexes.has(dayIndex),
    isActiveRecovery: false,
  }));

  if (profile.daysPerWeek >= 7) {
    for (const slot of slots) slot.isWorkout = true;
    slots[6].isActiveRecovery = true;
  }

  return slots;
}

export function applyWeekProgression(plan: WorkoutPlan, week: number): WorkoutPlan {
  const w = Math.min(Math.max(week, 1), 4);
  return {
    ...plan,
    days: plan.days.map((day) => {
      if (day.type === 'rest') return day;
      const mapEx = (ex: PlannedExercise): PlannedExercise => {
        const prog = ex.weekProgression?.find((p) => p.week === w);
        if (!prog) return ex;
        return { ...ex, sets: prog.sets, reps: prog.reps };
      };
      return {
        ...day,
        workout: {
          ...day.workout,
          exercises: day.workout.exercises.map(mapEx),
        },
      };
    }),
  };
}

export function generateWorkoutPlan(profile: UserProfile): WorkoutPlan {
  const sport = getSportConfig(profile.sport);
  const band = ageBand(profile.age);
  const focuses = chooseFocusPattern(profile);
  const workoutDays = resolveWorkoutDays(profile);
  const layout = placeWorkoutDays(profile);
  const count = workoutExerciseCount(profile.duration);

  let focusIdx = 0;
  const recentIds: string[] = [];
  const days: WorkoutDay[] = layout.map((slot) => {
    const dayName = DAY_NAMES[slot.dayIndex];

    if (!slot.isWorkout) {
      return {
        dayIndex: slot.dayIndex,
        dayName,
        type: 'rest',
        title: 'Rest & Recovery',
        focus: 'Sleep, hydrate, and light walking if you feel good',
        warmUp: { title: 'Warm-Up', exercises: [] },
        workout: { title: 'Rest', exercises: [] },
        coolDown: { title: 'Cool-Down', exercises: [] },
      };
    }

    const focus = slot.isActiveRecovery ? 'active_recovery' : focuses[focusIdx % focuses.length];
    if (!slot.isActiveRecovery) focusIdx += 1;

    const meta = sessionTitle(focus, sport.label);
    const dayExclude = new Set<string>(recentIds.slice(-8));
    const main = pickExercises(profile, focus, slot.isActiveRecovery ? 4 : count, dayExclude);

    // Ensure core almost always present on hard days if missing
    if (!slot.isActiveRecovery && !main.some((e) => e.category === 'core')) {
      const core = pickExercises(profile, 'core_mobility', 1, dayExclude);
      if (core[0]) main.push(core[0]);
    }

    for (const ex of main) {
      recentIds.push(ex.id);
    }

    return {
      dayIndex: slot.dayIndex,
      dayName,
      type: slot.isActiveRecovery ? 'active_recovery' : 'workout',
      title: meta.title,
      focus: meta.focus,
      warmUp: {
        title: 'Warm-Up',
        durationMinutes: profile.duration <= 15 ? 3 : band === 'elder' ? 4 : 5,
        exercises: buildWarmUpBlock(profile, slot.dayIndex, focus),
      },
      workout: {
        title: 'Workout',
        exercises: main.map((ex) => adjustPrescription(ex, profile)),
      },
      coolDown: {
        title: 'Cool-Down',
        durationMinutes: 5,
        exercises: buildCoolDownBlock(profile, slot.dayIndex),
      },
    };
  });

  const summaryParts = [
    `A ${profile.daysPerWeek}-day ${profile.fitnessLevel} plan`,
    profile.sport === 'none' ? 'for general fitness' : `built around ${sport.label.toLowerCase()}`,
    `on ${formatWorkoutDays(workoutDays)}`,
    `with ${profile.duration}-minute sessions`,
    band === 'elder' || band === 'senior'
      ? 'scaled for joint-friendly training'
      : band === 'mature'
        ? 'with recovery-friendly pacing'
        : null,
  ].filter(Boolean);

  const progressionNotes = [
    'Weeks 1–4 gradually increase reps or sets on key exercises.',
    'For dumbbell or barbell moves, increase weight when you can finish every rep with good form.',
    'If a session feels too hard, reduce sets by one or use the beginner modification.',
    'Never push through sharp pain — stop and rest if something feels wrong.',
  ];

  if (isYouth(profile.age)) {
    progressionNotes.unshift(
      'This plan stays age-appropriate: focus on form, athleticism, and recovery — not extreme training or dieting.',
    );
  } else if (band === 'elder') {
    progressionNotes.unshift(
      'Scaled for age 80+: shorter efforts, more rest, and low-impact choices. Comfort and balance come first.',
    );
  } else if (band === 'senior') {
    progressionNotes.unshift(
      'Scaled for age 65+: lower impact options, moderated volume, and extra recovery between sets.',
    );
  } else if (band === 'mature') {
    progressionNotes.unshift(
      'Pacing accounts for age 50+: solid strength work with a bit more recovery built in.',
    );
  }

  return {
    id: `plan_${Date.now()}`,
    createdAt: new Date().toISOString(),
    profile,
    summary: summaryParts.join(' '),
    focusAreas: sport.focusAreas,
    weeks: 4,
    progressionNotes,
    days,
  };
}

export function getTodayDayIndex(date = new Date()): number {
  // JS: 0=Sun ... convert to Mon=0
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

export function getTodaysWorkout(plan: WorkoutPlan, date = new Date()): WorkoutDay {
  const idx = getTodayDayIndex(date);
  return plan.days.find((d) => d.dayIndex === idx) ?? plan.days[0];
}
