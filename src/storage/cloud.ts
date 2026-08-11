import { supabase } from '../lib/supabase';
import type { AppState, UserProfile, WorkoutPlan, WorkoutSessionLog } from '../types';
import { defaultState, recomputeStats } from './persistence';

function isProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') return false;
  const v = value as UserProfile;
  return typeof v.age === 'number' && Array.isArray(v.goals);
}

export async function loadCloudState(): Promise<AppState> {
  const state = defaultState();

  const [{ data: profileRow, error: profileError }, { data: planRow, error: planError }, { data: sessions, error: sessionError }] =
    await Promise.all([
      supabase.from('profiles').select('*').maybeSingle(),
      supabase.from('workout_plans').select('*').maybeSingle(),
      supabase.from('workout_sessions').select('*').order('performed_at', { ascending: false }),
    ]);

  if (profileError) throw profileError;
  if (planError) throw planError;
  if (sessionError) throw sessionError;

  if (profileRow) {
    if (isProfile(profileRow.questionnaire)) {
      state.profile = profileRow.questionnaire;
    }
    state.currentWeek = profileRow.current_week ?? 1;
  }

  if (planRow?.plan) {
    state.plan = planRow.plan as WorkoutPlan;
  }

  state.history = (sessions ?? []).map((row) => ({
    id: row.id,
    date: row.performed_at,
    dayIndex: row.day_index,
    dayTitle: row.day_title,
    completed: row.completed,
    exercises: row.exercises ?? [],
    durationMinutes: row.duration_minutes ?? undefined,
  }));
  state.stats = recomputeStats(state.history);
  return state;
}

export async function saveCloudProfile(profile: UserProfile, currentWeek: number): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error('You need to be signed in to save.');

  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    questionnaire: profile,
    current_week: currentWeek,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function saveCloudPlan(plan: WorkoutPlan): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error('You need to be signed in to save.');

  const { error } = await supabase.from('workout_plans').upsert({
    user_id: userId,
    plan,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

function asUuid(id: string): string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : crypto.randomUUID();
}

export async function saveCloudSession(log: WorkoutSessionLog): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error('You need to be signed in to save.');

  const { error } = await supabase.from('workout_sessions').upsert({
    id: asUuid(log.id),
    user_id: userId,
    performed_at: log.date,
    day_index: log.dayIndex,
    day_title: log.dayTitle,
    completed: log.completed,
    exercises: log.exercises,
    duration_minutes: log.durationMinutes ?? null,
  });
  if (error) throw error;
}

export async function saveCloudWeek(currentWeek: number): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error('You need to be signed in to save.');

  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    current_week: currentWeek,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function clearCloudData(): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error('You need to be signed in to reset.');

  const sessions = await supabase.from('workout_sessions').delete().eq('user_id', userId);
  if (sessions.error) throw sessions.error;
  const plans = await supabase.from('workout_plans').delete().eq('user_id', userId);
  if (plans.error) throw plans.error;
  const profiles = await supabase.from('profiles').delete().eq('user_id', userId);
  if (profiles.error) throw profiles.error;
}
