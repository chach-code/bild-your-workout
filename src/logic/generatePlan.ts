import { EXERCISES, getExerciseById } from '../data/exercises';
import { DAY_NAMES, getSportConfig } from '../data/sports';
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

const WARMUP_POOL = ['jumping_jacks', 'high_knees', 'arm_circles', 'hip_openers', 'bodyweight_squat', 'cat_cow'];
const COOLDOWN_POOL = ['child_pose', 'quad_stretch', 'hamstring_stretch', 'cat_cow', 'arm_circles'];

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

function isYouth(age: number): boolean {
  return age > 0 && age < 18;
}

function hasEquipment(owned: Equipment[], required: Equipment[]): boolean {
  // If an exercise lists "none", it can be done with bodyweight / no gear.
  if (required.includes('none')) return true;
  const needs = required.filter((r) => r !== 'other');
  if (needs.length === 0) return true;
  return needs.every((n) => owned.includes(n));
}

function exerciseAvailable(ex: Exercise, profile: UserProfile): boolean {
  if (isYouth(profile.age) && !ex.youthSafe) return false;
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

function adjustPrescription(ex: Exercise, profile: UserProfile): PlannedExercise {
  let sets = ex.defaultSets;
  let reps = ex.defaultReps;
  let rest = ex.defaultRest;

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

  if (isYouth(profile.age)) {
    sets = Math.min(sets, 3);
    rest = Math.max(rest, 45);
  }

  // Weight progression note for loaded moves
  let notes: string | undefined;
  if (ex.equipment.some((e) => ['dumbbells', 'barbell', 'bands'].includes(e))) {
    notes = 'When you can complete all sets with good form, increase the weight slightly next week.';
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

function buildBlockFromIds(ids: string[], profile: UserProfile): PlannedExercise[] {
  return ids
    .map((id) => getExerciseById(id))
    .filter((ex): ex is Exercise => !!ex && exerciseAvailable(ex, profile))
    .map((ex) => {
      const planned = adjustPrescription(ex, profile);
      // warm-up / cool-down: single short set
      return {
        ...planned,
        sets: 1,
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

  let pattern: SessionFocus[] = [];

  if (sport === 'basketball' || goals.has('jump')) {
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

function placeWorkoutDays(daysPerWeek: number): { dayIndex: number; isWorkout: boolean; isActiveRecovery: boolean }[] {
  // Distribute workout days across the week with rest spacing
  const slots = Array.from({ length: 7 }, (_, dayIndex) => ({
    dayIndex,
    isWorkout: false,
    isActiveRecovery: false,
  }));

  if (daysPerWeek >= 7) {
    // 6 hard + 1 active recovery
    for (let i = 0; i < 7; i++) slots[i].isWorkout = true;
    slots[6].isActiveRecovery = true;
    return slots;
  }

  const patterns: Record<number, number[]> = {
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 5],
    5: [0, 1, 3, 4, 6],
    6: [0, 1, 2, 4, 5, 6],
  };

  const workoutIndexes = patterns[daysPerWeek] ?? patterns[3];
  for (const i of workoutIndexes) slots[i].isWorkout = true;

  // If 5–6 days, mark one non-primary as optional active recovery feel on a rest day when only 2 rest
  if (daysPerWeek === 6) {
    const rest = slots.find((s) => !s.isWorkout);
    if (rest) {
      rest.isActiveRecovery = true;
      rest.isWorkout = true;
    }
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
  const focuses = chooseFocusPattern(profile);
  const layout = placeWorkoutDays(profile.daysPerWeek);
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

    const warmIds = WARMUP_POOL.filter((id) => {
      const ex = getExerciseById(id);
      return ex && exerciseAvailable(ex, profile);
    }).slice(0, profile.duration <= 15 ? 3 : 4);

    const coolIds = COOLDOWN_POOL.slice(0, 3);

    return {
      dayIndex: slot.dayIndex,
      dayName,
      type: slot.isActiveRecovery ? 'active_recovery' : 'workout',
      title: meta.title,
      focus: meta.focus,
      warmUp: {
        title: 'Warm-Up',
        durationMinutes: profile.duration <= 15 ? 3 : 5,
        exercises: buildBlockFromIds(warmIds, profile),
      },
      workout: {
        title: 'Workout',
        exercises: main.map((ex) => adjustPrescription(ex, profile)),
      },
      coolDown: {
        title: 'Cool-Down',
        durationMinutes: 5,
        exercises: buildBlockFromIds(coolIds, profile),
      },
    };
  });

  const summaryParts = [
    `A ${profile.daysPerWeek}-day ${profile.fitnessLevel} plan`,
    profile.sport === 'none' ? 'for general fitness' : `built around ${sport.label.toLowerCase()}`,
    `with ${profile.duration}-minute sessions`,
  ];

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
