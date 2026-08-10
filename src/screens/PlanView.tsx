import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';
import { Navigation } from '../components/Navigation';
import { WorkoutCard } from '../components/WorkoutCard';
import { useApp } from '../hooks/useApp';
import { getTodayDayIndex } from '../logic/generatePlan';
import { completedDayIndexesThisWeek } from '../logic/schedule';

export function PlanView() {
  const navigate = useNavigate();
  const { dayIndex } = useParams();
  const { state, planForWeek, setWeek } = useApp();
  const [detailId, setDetailId] = useState<string | null>(null);

  if (!state.plan || !planForWeek) {
    return <Navigate to="/" replace />;
  }

  const todayIdx = getTodayDayIndex();
  const doneDays = completedDayIndexesThisWeek(state.history);
  const selected =
    dayIndex !== undefined
      ? planForWeek.days.find((d) => d.dayIndex === Number(dayIndex))
      : null;

  if (selected) {
    return (
      <main className="page page-with-nav fade-in">
        <Link className="text-btn" to="/plan">
          ← Weekly plan
        </Link>
        <header className="page-header">
          <p className="eyebrow">{selected.dayName}</p>
          <h1>{selected.title}</h1>
          <p className="lede">{selected.focus}</p>
        </header>

        {selected.type === 'rest' ? (
          <p>Rest day. Light walking and mobility are fine if you feel good.</p>
        ) : (
          <>
            <section className="section">
              <h2>
                Warm-Up
                {selected.warmUp.durationMinutes ? ` · ${selected.warmUp.durationMinutes} min` : ''}
              </h2>
              {selected.warmUp.exercises.map((ex) => (
                <ExerciseCard
                  key={`w-${ex.exerciseId}`}
                  exercise={ex}
                  onHowTo={() => setDetailId(ex.exerciseId)}
                />
              ))}
            </section>
            <section className="section">
              <h2>Workout</h2>
              {selected.workout.exercises.map((ex) => (
                <ExerciseCard
                  key={`m-${ex.exerciseId}`}
                  exercise={ex}
                  onHowTo={() => setDetailId(ex.exerciseId)}
                />
              ))}
            </section>
            <section className="section">
              <h2>Cool-Down</h2>
              {selected.coolDown.exercises.map((ex) => (
                <ExerciseCard
                  key={`c-${ex.exerciseId}`}
                  exercise={ex}
                  onHowTo={() => setDetailId(ex.exerciseId)}
                />
              ))}
            </section>
            {selected.dayIndex === todayIdx ? (
              <Link to="/workout">
                <Button size="lg" fullWidth>
                  Start This Workout →
                </Button>
              </Link>
            ) : (
              <Link to={`/workout/${selected.dayIndex}`}>
                <Button size="lg" fullWidth variant="secondary">
                  Start {selected.dayName}&apos;s Workout →
                </Button>
              </Link>
            )}
          </>
        )}

        {detailId ? <ExerciseDetailModal exerciseId={detailId} onClose={() => setDetailId(null)} /> : null}
        <Navigation />
      </main>
    );
  }

  return (
    <main className="page page-with-nav fade-in">
      <header className="page-header">
        <p className="eyebrow">My Workout Plan</p>
        <h1>Weekly Schedule</h1>
        <p className="lede">{planForWeek.summary}.</p>
      </header>

      <section className="week-switcher">
        <p className="muted">Progression week</p>
        <div className="week-btns">
          {[1, 2, 3, 4].map((w) => (
            <button
              key={w}
              type="button"
              className={`week-btn ${state.currentWeek === w ? 'is-active' : ''}`}
              onClick={() => setWeek(w)}
            >
              Week {w}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Progression</h2>
        <ul className="focus-list">
          {planForWeek.progressionNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <div className="schedule-grid">
        {planForWeek.days.map((day) => (
          <WorkoutCard
            key={day.dayIndex}
            day={day}
            isToday={day.dayIndex === todayIdx}
            completed={doneDays.has(day.dayIndex)}
          />
        ))}
      </div>

      <div className="section">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            if (
              confirm(
                'Create a new plan? This replaces your current weekly schedule. Workout history stays saved.',
              )
            ) {
              navigate('/onboarding');
            }
          }}
        >
          Rebuild Plan
        </Button>
      </div>

      <Navigation />
    </main>
  );
}
