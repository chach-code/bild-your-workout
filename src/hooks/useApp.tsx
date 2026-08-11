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
import {
  clearCloudData,
  loadCloudState,
  saveCloudPlan,
  saveCloudProfile,
  saveCloudSession,
  saveCloudWeek,
} from '../storage/cloud';
import type { AppState, UserProfile, WorkoutPlan, WorkoutSessionLog } from '../types';
import { useAuth } from './useAuth';

interface AppContextValue {
  state: AppState;
  planForWeek: WorkoutPlan | null;
  syncing: boolean;
  syncError: string;
  createPlan: (profile: UserProfile) => Promise<WorkoutPlan>;
  saveWorkoutLog: (log: WorkoutSessionLog) => Promise<void>;
  setWeek: (week: number) => Promise<void>;
  resetAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AppState>(() => loadState());
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [readyUserId, setReadyUserId] = useState<string | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState(defaultState());
      setReadyUserId(null);
      setSyncError('');
      return;
    }

    let cancelled = false;
    setSyncing(true);
    setSyncError('');

    loadCloudState()
      .then(async (cloud) => {
        if (cancelled) return;
        const local = loadState();
        const hasCloudData = !!(cloud.plan || cloud.profile || cloud.history.length);
        const hasLocalData = !!(local.plan || local.profile || local.history.length);

        if (!hasCloudData && hasLocalData) {
          if (local.profile) await saveCloudProfile(local.profile, local.currentWeek);
          if (local.plan) await saveCloudPlan(local.plan);
          for (const log of local.history) {
            await saveCloudSession(log);
          }
          if (!cancelled) setState(local);
        } else {
          setState(cloud);
        }
        setReadyUserId(user.id);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Could not load your saved workouts.';
        setSyncError(message);
        setReadyUserId(user.id);
      })
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const planForWeek = useMemo(() => {
    if (!state.plan) return null;
    return applyWeekProgression(state.plan, state.currentWeek);
  }, [state.plan, state.currentWeek]);

  const createPlan = useCallback(
    async (profile: UserProfile) => {
      const plan = generateWorkoutPlan(profile);
      const next = persistNewPlan(profile, plan);
      setState(next);
      if (user) {
        try {
          await saveCloudProfile(profile, 1);
          await saveCloudPlan(plan);
          setSyncError('');
        } catch (err) {
          setSyncError(err instanceof Error ? err.message : 'Could not save your plan.');
        }
      }
      return plan;
    },
    [user],
  );

  const saveWorkoutLog = useCallback(
    async (log: WorkoutSessionLog) => {
      const next = persistSession(log);
      setState(next);
      if (user) {
        try {
          await saveCloudSession(log);
          setSyncError('');
        } catch (err) {
          setSyncError(err instanceof Error ? err.message : 'Could not save this workout.');
        }
      }
    },
    [user],
  );

  const setWeek = useCallback(
    async (week: number) => {
      const next = persistWeek(week);
      setState(next);
      if (user && next.profile) {
        try {
          await saveCloudWeek(week);
          setSyncError('');
        } catch (err) {
          setSyncError(err instanceof Error ? err.message : 'Could not save your week.');
        }
      }
    },
    [user],
  );

  const resetAll = useCallback(async () => {
    if (user) {
      try {
        await clearCloudData();
        setSyncError('');
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Could not reset cloud data.');
        return;
      }
    }
    clearState();
    setState(defaultState());
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) {
      setState(loadState());
      return;
    }
    setSyncing(true);
    try {
      const cloud = await loadCloudState();
      setState(cloud);
      setSyncError('');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Could not refresh your data.');
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const value = useMemo(
    () => ({
      state,
      planForWeek,
      syncing: syncing || authLoading || (!!user && readyUserId !== user.id),
      syncError,
      createPlan,
      saveWorkoutLog,
      setWeek,
      resetAll,
      refresh,
    }),
    [
      state,
      planForWeek,
      syncing,
      authLoading,
      user,
      readyUserId,
      syncError,
      createPlan,
      saveWorkoutLog,
      setWeek,
      resetAll,
      refresh,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
