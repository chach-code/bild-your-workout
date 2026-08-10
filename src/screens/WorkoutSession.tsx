import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';
import { ExerciseTimer } from '../components/ExerciseTimer';
import { useApp } from '../hooks/useApp';
import { getTodaysWorkout } from '../logic/generatePlan';
import type { CompletedExerciseLog, PlannedExercise, WorkoutDay } from '../types';

export function WorkoutSession() {
  const navigate = useNavigate();
  const { dayIndex: dayParam } = useParams();
  const { state, planForWeek, saveWorkoutLog } = useApp();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [timerTarget, setTimerTarget] = useState<{
    key: string;
    exercise: PlannedExercise;
  } | null>(null);
  const [done, setDone] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const sessionDay: WorkoutDay | null = useMemo(() => {
    if (!planForWeek) return null;
    if (dayParam !== undefined) {
      return planForWeek.days.find((d) => d.dayIndex === Number(dayParam)) ?? null;
    }
    return getTodaysWorkout(planForWeek);
  }, [planForWeek, dayParam]);

  const allExercises = useMemo(() => {
    if (!sessionDay || sessionDay.type === 'rest') return [];
    return [
      ...sessionDay.warmUp.exercises.map((e) => ({ ...e, block: 'Warm-Up' })),
      ...sessionDay.workout.exercises.map((e) => ({ ...e, block: 'Workout' })),
      ...sessionDay.coolDown.exercises.map((e) => ({ ...e, block: 'Cool-Down' })),
    ];
  }, [sessionDay]);

  if (!state.plan || !planForWeek || !sessionDay) {
    return <Navigate to="/" replace />;
  }

  if (sessionDay.type === 'rest') {
    const next =
      planForWeek.days.find((d) => d.dayIndex > sessionDay.dayIndex && d.type !== 'rest') ??
      planForWeek.days.find((d) => d.type !== 'rest');

    return (
      <main className="page fade-in">
        <h1>Rest Day</h1>
        <p>Recovery is part of getting better. Walk, stretch lightly, and sleep well.</p>
        <div className="welcome__actions">
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
          {next ? (
            <Link to={`/workout/${next.dayIndex}`}>
              <Button variant="secondary">Do {next.dayName}&apos;s workout</Button>
            </Link>
          ) : null}
        </div>
      </main>
    );
  }

  const completedCount = allExercises.filter((e, i) => checked[`${e.exerciseId}-${i}`]).length;
  const pct = allExercises.length ? Math.round((completedCount / allExercises.length) * 100) : 0;
  const allDone = completedCount === allExercises.length && allExercises.length > 0;

  const toggle = (key: string) => {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  };

  const markComplete = (key: string) => {
    setChecked((c) => ({ ...c, [key]: true }));
  };

  const finish = () => {
    const exercises: CompletedExerciseLog[] = allExercises.map((e, i) => ({
      exerciseId: e.exerciseId,
      name: e.name,
      completed: !!checked[`${e.exerciseId}-${i}`],
    }));

    saveWorkoutLog({
      id: `session_${Date.now()}`,
      date: new Date().toISOString(),
      dayIndex: sessionDay.dayIndex,
      dayTitle: sessionDay.title,
      completed: true,
      exercises,
    });
    setDone(true);
  };

  if (done) {
    return (
      <main className="page complete-screen fade-in">
        <div className="complete-burst" aria-hidden="true" />
        <h1>Workout Complete! 🎉</h1>
        <p>Nice work. Consistency is how athletes get better.</p>
        <div className="stats-row">
          <div className="stat-tile">
            <span className="stat-tile__value">{state.stats.totalWorkouts}</span>
            <span className="stat-tile__label">Total workouts</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{state.stats.currentStreak}</span>
            <span className="stat-tile__label">Current streak</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">
              {completedCount}/{allExercises.length}
            </span>
            <span className="stat-tile__label">Exercises done</span>
          </div>
        </div>
        <Button size="lg" fullWidth onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </main>
    );
  }

  let lastBlock = '';

  return (
    <main className="page page-session fade-in">
      <header className="session-header">
        <button type="button" className="text-btn" onClick={() => navigate('/dashboard')}>
          ← Exit
        </button>
        <div>
          <p className="eyebrow">{sessionDay.dayName}</p>
          <h1>{sessionDay.title}</h1>
          <p className="muted">{sessionDay.focus}</p>
        </div>
        <div className="progress-bar" aria-hidden="true">
          <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted">
          {completedCount} of {allExercises.length} complete
        </p>
      </header>

      <div className="session-list">
        {allExercises.map((ex, i) => {
          const key = `${ex.exerciseId}-${i}`;
          const showHeading = ex.block !== lastBlock;
          lastBlock = ex.block;
          return (
            <div key={key}>
              {showHeading ? <h2 className="block-heading">{ex.block}</h2> : null}
              <ExerciseCard
                exercise={ex}
                showCheckbox
                checked={!!checked[key]}
                onToggle={() => toggle(key)}
                onHowTo={() => setDetailId(ex.exerciseId)}
                onStartTimer={() => setTimerTarget({ key, exercise: ex })}
              />
            </div>
          );
        })}
      </div>

      <div className="session-footer">
        <Button size="lg" fullWidth onClick={finish} disabled={completedCount === 0}>
          {allDone ? 'Finish Workout →' : 'Complete Workout →'}
        </Button>
        <p className="disclaimer compact">Stop if you feel pain or unwell.</p>
      </div>

      {detailId ? (
        <ExerciseDetailModal exerciseId={detailId} onClose={() => setDetailId(null)} />
      ) : null}

      {timerTarget ? (
        <ExerciseTimer
          exercise={timerTarget.exercise}
          onClose={() => setTimerTarget(null)}
          onComplete={() => markComplete(timerTarget.key)}
        />
      ) : null}
    </main>
  );
}
