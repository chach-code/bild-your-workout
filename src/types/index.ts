export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type Sport =
  | 'baseball'
  | 'basketball'
  | 'football'
  | 'soccer'
  | 'hockey'
  | 'tennis'
  | 'volleyball'
  | 'track'
  | 'other'
  | 'none';

export type Goal =
  | 'stronger'
  | 'muscle'
  | 'faster'
  | 'jump'
  | 'endurance'
  | 'agility'
  | 'explosiveness'
  | 'fat_loss'
  | 'overall'
  | 'sport';

export type Equipment =
  | 'none'
  | 'dumbbells'
  | 'barbell'
  | 'bench'
  | 'bands'
  | 'pullup'
  | 'treadmill'
  | 'bike'
  | 'other';

export type Duration = 15 | 30 | 45 | 60 | 90;

export type Gender = 'male' | 'female' | 'nonbinary' | 'prefer_not' | '';

export interface UserProfile {
  age: number;
  gender: Gender;
  fitnessLevel: FitnessLevel;
  sport: Sport;
  position: string;
  goals: Goal[];
  primaryFocus: string;
  equipment: Equipment[];
  daysPerWeek: number;
  /** Monday=0 … Sunday=6. Older saved profiles may omit this. */
  workoutDays?: number[];
  duration: Duration;
  notes: string;
  createdAt: string;
}

export type ExerciseCategory =
  | 'strength'
  | 'power'
  | 'cardio'
  | 'core'
  | 'mobility'
  | 'agility'
  | 'plyometric'
  | 'sport';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'full_body'
  | 'hips'
  | 'rotational';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscles: MuscleGroup[];
  equipment: Equipment[];
  sports: Sport[] | 'all';
  level: FitnessLevel[];
  instructions: string[];
  mistakes: string[];
  beginnerMod: string;
  harderMod: string;
  defaultSets: number;
  defaultReps: string;
  defaultRest: number;
  isTimed?: boolean;
  youthSafe: boolean;
}

export interface PlannedExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
  weekProgression?: { week: number; sets: number; reps: string }[];
}

export interface WorkoutBlock {
  title: string;
  durationMinutes?: number;
  exercises: PlannedExercise[];
}

export type DayType = 'workout' | 'rest' | 'active_recovery';

export interface WorkoutDay {
  dayIndex: number;
  dayName: string;
  type: DayType;
  title: string;
  focus: string;
  warmUp: WorkoutBlock;
  workout: WorkoutBlock;
  coolDown: WorkoutBlock;
}

export interface WorkoutPlan {
  id: string;
  createdAt: string;
  profile: UserProfile;
  summary: string;
  focusAreas: string[];
  weeks: number;
  progressionNotes: string[];
  days: WorkoutDay[];
}

export interface CompletedExerciseLog {
  exerciseId: string;
  name: string;
  completed: boolean;
  setsCompleted?: number;
}

export interface WorkoutSessionLog {
  id: string;
  date: string;
  dayIndex: number;
  dayTitle: string;
  completed: boolean;
  exercises: CompletedExerciseLog[];
  durationMinutes?: number;
}

export interface ProgressStats {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  weeklyCompletions: number;
  lastWorkoutDate: string | null;
  personalRecords: { exerciseName: string; value: string; date: string }[];
}

export interface AppState {
  profile: UserProfile | null;
  plan: WorkoutPlan | null;
  history: WorkoutSessionLog[];
  stats: ProgressStats;
  currentWeek: number;
}
