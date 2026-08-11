import { Link, Navigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Navigation } from '../components/Navigation';
import { WorkoutCard } from '../components/WorkoutCard';
import { GOALS, getSportConfig } from '../data/sports';
import { useApp } from '../hooks/useApp';
import { useAuth } from '../hooks/useAuth';
import { getTodayDayIndex, getTodaysWorkout } from '../logic/generatePlan';
import { completedDayIndexesThisWeek } from '../logic/schedule';

export function Dashboard() {
  const { state, planForWeek, syncError } = useApp();
  const { user } = useAuth();

  if (!state.plan || !planForWeek || !state.profile) {
    return <Navigate to="/" replace />;
  }

  const today = getTodaysWorkout(planForWeek);
  const todayIdx = getTodayDayIndex();
  const doneDays = completedDayIndexesThisWeek(state.history);
  const sport = getSportConfig(state.profile.sport);
  const goalLabels = state.profile.goals
    .map((g) => GOALS.find((x) => x.id === g)?.label)
    .filter(Boolean);

  return (
    <main className="page page-with-nav fade-in">
      <header className="page-header">
        <p className="eyebrow">My Workout Plan</p>
        <h1>Ready when you are</h1>
        <p className="lede">{planForWeek.summary}.</p>
        {user ? <p className="muted">Signed in as {user.email}</p> : null}
        {syncError ? <p className="form-error">{syncError}</p> : null}
      </header>

      <section className="panel today-panel">
        <div className="today-panel__copy">
          <p className="eyebrow">Today&apos;s Workout</p>
          <h2>{today.dayName} — {today.title}</h2>
          <p>{today.focus}</p>
        </div>
        {today.type === 'rest' ? (
          <>
            <Button size="lg" variant="secondary" disabled>
              Rest day — recover well
            </Button>
            {(() => {
              const next = planForWeek.days.find(
                (d) => d.dayIndex > today.dayIndex && d.type !== 'rest',
              ) ?? planForWeek.days.find((d) => d.type !== 'rest');
              return next ? (
                <Link to={`/workout/${next.dayIndex}`}>
                  <Button size="lg" variant="ghost">
                    Preview {next.dayName}&apos;s workout →
                  </Button>
                </Link>
              ) : null;
            })()}
          </>
        ) : (
          <Link to="/workout">
            <Button size="lg">Start Today&apos;s Workout →</Button>
          </Link>
        )}
      </section>

      <section className="stats-row">
        <div className="stat-tile">
          <span className="stat-tile__value">{state.stats.totalWorkouts}</span>
          <span className="stat-tile__label">Total workouts</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{state.stats.currentStreak}</span>
          <span className="stat-tile__label">Current streak</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{state.stats.weeklyCompletions}</span>
          <span className="stat-tile__label">This week</span>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Weekly Schedule</h2>
          <span className="muted">Week {state.currentWeek} of 4</span>
        </div>
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
      </section>

      <section className="section">
        <h2>Goals</h2>
        <div className="tag-row">
          {goalLabels.map((g) => (
            <span className="tag" key={g}>
              {g}
            </span>
          ))}
        </div>
        <p className="muted" style={{ marginTop: '0.75rem' }}>
          Primary focus: {state.profile.primaryFocus}
        </p>
      </section>

      <section className="section">
        <h2>Sport focus</h2>
        <ul className="focus-list">
          {sport.focusAreas.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Progress</h2>
          <Link className="text-link" to="/progress">
            View all →
          </Link>
        </div>
        <p className="muted">
          {state.stats.lastWorkoutDate
            ? `Last completed workout: ${state.stats.lastWorkoutDate}`
            : 'Complete your first workout to start tracking.'}
        </p>
      </section>

      <p className="disclaimer compact">
        General fitness suggestions only. Stop if you experience pain or feel unwell.
      </p>

      <Navigation />
    </main>
  );
}
