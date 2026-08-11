import type { Sport } from '../types';

export interface SportConfig {
  id: Sport;
  label: string;
  focusAreas: string[];
  positions: string[];
  preferredCategories: string[];
}

export const SPORTS: SportConfig[] = [
  {
    id: 'baseball',
    label: 'Baseball',
    focusAreas: [
      'Rotational power',
      'Throwing-related strength',
      'Sprinting',
      'Lower-body strength',
      'Core stability',
      'Agility',
    ],
    positions: [
      'Pitcher',
      'Catcher',
      'Infielder',
      'Outfielder',
      'Utility',
      'Not sure',
    ],
    preferredCategories: ['power', 'strength', 'core', 'agility', 'plyometric'],
  },
  {
    id: 'basketball',
    label: 'Basketball',
    focusAreas: [
      'Vertical jump',
      'Speed',
      'Agility',
      'Lower-body strength',
      'Conditioning',
      'Core',
    ],
    positions: [
      'Point Guard',
      'Shooting Guard',
      'Small Forward',
      'Power Forward',
      'Center',
      'Not sure',
    ],
    preferredCategories: ['plyometric', 'strength', 'agility', 'cardio', 'core'],
  },
  {
    id: 'football',
    label: 'Football',
    focusAreas: [
      'Explosiveness',
      'Strength',
      'Sprinting',
      'Agility',
      'Conditioning',
    ],
    positions: [
      'QB',
      'RB / FB',
      'WR',
      'TE',
      'OL',
      'DL',
      'LB',
      'DB',
      'Special Teams',
      'Not sure',
    ],
    preferredCategories: ['power', 'strength', 'plyometric', 'agility', 'cardio'],
  },
  {
    id: 'soccer',
    label: 'Soccer',
    focusAreas: [
      'Endurance',
      'Speed',
      'Agility',
      'Lower-body strength',
      'Core',
    ],
    positions: [
      'Goalkeeper',
      'Defender',
      'Midfielder',
      'Forward',
      'Not sure',
    ],
    preferredCategories: ['cardio', 'agility', 'strength', 'core', 'plyometric'],
  },
  {
    id: 'hockey',
    label: 'Hockey',
    focusAreas: [
      'Skating power',
      'Core rotation',
      'Lower-body strength',
      'Explosiveness',
      'Conditioning',
    ],
    positions: [
      'Forward',
      'Defense',
      'Goalie',
      'Not sure',
    ],
    preferredCategories: ['strength', 'power', 'core', 'cardio', 'agility'],
  },
  {
    id: 'tennis',
    label: 'Tennis',
    focusAreas: [
      'Lateral agility',
      'Rotational power',
      'Shoulder stability',
      'Endurance',
      'Lower-body strength',
    ],
    positions: [],
    preferredCategories: ['agility', 'core', 'strength', 'cardio', 'mobility'],
  },
  {
    id: 'volleyball',
    label: 'Volleyball',
    focusAreas: [
      'Vertical jump',
      'Shoulder strength',
      'Core',
      'Agility',
      'Explosiveness',
    ],
    positions: [
      'Setter',
      'Outside Hitter',
      'Middle Blocker',
      'Libero',
      'Opposite',
      'Not sure',
    ],
    preferredCategories: ['plyometric', 'strength', 'core', 'agility', 'power'],
  },
  {
    id: 'track',
    label: 'Track',
    focusAreas: [
      'Sprint mechanics',
      'Power',
      'Speed endurance',
      'Lower-body strength',
      'Mobility',
    ],
    positions: [
      'Sprinter',
      'Distance',
      'Hurdles',
      'Jumps',
      'Throws',
      'Multi',
      'Not sure',
    ],
    preferredCategories: ['plyometric', 'power', 'strength', 'cardio', 'mobility'],
  },
  {
    id: 'other',
    label: 'Other',
    focusAreas: [
      'Overall athleticism',
      'Strength',
      'Conditioning',
      'Mobility',
      'Core',
    ],
    positions: [],
    preferredCategories: ['strength', 'cardio', 'core', 'mobility', 'agility'],
  },
  {
    id: 'none',
    label: "I don't play a sport",
    focusAreas: [
      'Overall fitness',
      'Strength',
      'Endurance',
      'Mobility',
      'Consistency',
    ],
    positions: [],
    preferredCategories: ['strength', 'cardio', 'core', 'mobility'],
  },
];

export function getSportConfig(sport: Sport): SportConfig {
  return SPORTS.find((s) => s.id === sport) ?? SPORTS[SPORTS.length - 1];
}

export const FITNESS_LEVELS = [
  { id: 'beginner' as const, label: 'Beginner', description: 'New to training or coming back after a break' },
  { id: 'intermediate' as const, label: 'Intermediate', description: 'Comfortable with basic exercises and form' },
  { id: 'advanced' as const, label: 'Advanced', description: 'Train regularly and handle harder progressions' },
];

export const GOALS = [
  { id: 'stronger' as const, label: 'Get stronger' },
  { id: 'muscle' as const, label: 'Build muscle' },
  { id: 'faster' as const, label: 'Get faster' },
  { id: 'jump' as const, label: 'Jump higher' },
  { id: 'endurance' as const, label: 'Improve endurance' },
  { id: 'agility' as const, label: 'Improve agility' },
  { id: 'explosiveness' as const, label: 'Improve explosiveness' },
  { id: 'fat_loss' as const, label: 'Lose body fat' },
  { id: 'overall' as const, label: 'Improve overall fitness' },
  { id: 'sport' as const, label: 'Get better at my sport' },
];

export const EQUIPMENT_OPTIONS = [
  { id: 'none' as const, label: 'No equipment' },
  { id: 'dumbbells' as const, label: 'Dumbbells' },
  { id: 'barbell' as const, label: 'Barbell' },
  { id: 'bench' as const, label: 'Bench' },
  { id: 'bands' as const, label: 'Resistance bands' },
  { id: 'pullup' as const, label: 'Pull-up bar' },
  { id: 'treadmill' as const, label: 'Treadmill' },
  { id: 'bike' as const, label: 'Exercise bike' },
  { id: 'other' as const, label: 'Other' },
];

export const DAY_OPTIONS = [2, 3, 4, 5, 6, 7];

export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const WEEKDAY_OPTIONS = DAY_NAMES.map((label, id) => ({ id, label }));

const DEFAULT_WORKOUT_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 3, 4, 6],
  6: [0, 1, 2, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export function defaultWorkoutDays(daysPerWeek: number): number[] {
  return [...(DEFAULT_WORKOUT_DAYS[daysPerWeek] ?? DEFAULT_WORKOUT_DAYS[3])];
}

export function formatWorkoutDays(indexes: number[]): string {
  const names = [...new Set(indexes)]
    .filter((i) => i >= 0 && i <= 6)
    .sort((a, b) => a - b)
    .map((i) => DAY_NAMES[i]);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export const DURATION_OPTIONS = [
  { id: 15 as const, label: '15 minutes' },
  { id: 30 as const, label: '30 minutes' },
  { id: 45 as const, label: '45 minutes' },
  { id: 60 as const, label: '60 minutes' },
  { id: 90 as const, label: '90+ minutes' },
];

export const GENDER_OPTIONS = [
  { id: 'male' as const, label: 'Male' },
  { id: 'female' as const, label: 'Female' },
  { id: 'nonbinary' as const, label: 'Non-binary' },
  { id: 'prefer_not' as const, label: 'Prefer not to say' },
];
