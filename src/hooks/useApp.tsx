import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { generateWorkoutPlan, applyWeekProgression } from '../logic/generatePlan';
import {
  clearState,
  defaultState,
  loadState,
  persistNewPlan,
  persistSession,
  persistWeek,
  saveState,
} from '../storage/persistence';
import type { AppState, UserProfile, WorkoutPlan, WorkoutSessionLog } from '../types';

interface AppContextValue {
  state: AppState;
  planForWeek: WorkoutPlan | null;
  createPlan: (profile: UserProfile) => WorkoutPlan;
  saveWorkoutLog: (log: WorkoutSessionLog) => void;
  setWeek: (week: number) => void;
  resetAll: () => void;
  refresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const planForWeek = useMemo(() => {
    if (!state.plan) return null;
    return applyWeekProgression(state.plan, state.currentWeek);
  }, [state.plan, state.currentWeek]);

  const createPlan = useCallback((profile: UserProfile) => {
    const plan = generateWorkoutPlan(profile);
    const next = persistNewPlan(profile, plan);
    setState(next);
    return plan;
  }, []);

  const saveWorkoutLog = useCallback((log: WorkoutSessionLog) => {
    const next = persistSession(log);
    setState(next);
  }, []);

  const setWeek = useCallback((week: number) => {
    const next = persistWeek(week);
    setState(next);
  }, []);

  const resetAll = useCallback(() => {
    clearState();
    setState(defaultState());
  }, []);

  const refresh = useCallback(() => {
    setState(loadState());
  }, []);

  const value = useMemo(
    () => ({ state, planForWeek, createPlan, saveWorkoutLog, setWeek, resetAll, refresh }),
    [state, planForWeek, createPlan, saveWorkoutLog, setWeek, resetAll, refresh],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
