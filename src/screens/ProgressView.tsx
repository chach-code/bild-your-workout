import { Navigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Navigation } from '../components/Navigation';
import { useApp } from '../hooks/useApp';

export function ProgressView() {
  const { state, resetAll } = useApp();

  if (!state.plan) {
    return <Navigate to="/" replace />;
  }

  const history = state.history.filter((h) => h.completed);

  return (
    <main className="page page-with-nav fade-in">
      <header className="page-header">
        <p className="eyebrow">Progress</p>
        <h1>Your training log</h1>
      </header>

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
        <div className="stat-tile">
          <span className="stat-tile__value">{state.stats.longestStreak}</span>
          <span className="stat-tile__label">Best streak</span>
        </div>
      </section>

      <section className="section">
        <h2>Weekly progress</h2>
        <div className="progress-bar large">
          <div
            className="progress-bar__fill"
            style={{
              width: `${Math.min(100, (state.stats.weeklyCompletions / Math.max(1, state.profile?.daysPerWeek ?? 3)) * 100)}%`,
            }}
          />
        </div>
        <p className="muted">
          {state.stats.weeklyCompletions} of {state.profile?.daysPerWeek ?? 0} planned sessions done
          this week
        </p>
      </section>

      <section className="section">
        <h2>Workout History</h2>
        {history.length === 0 ? (
          <p className="muted">No completed workouts yet. Start today&apos;s session to begin.</p>
        ) : (
          <ul className="history-list">
            {history.map((h) => {
              const done = h.exercises.filter((e) => e.completed).length;
              return (
                <li key={h.id} className="history-item">
                  <div>
                    <strong>{h.dayTitle}</strong>
                    <p className="muted">{new Date(h.date).toLocaleString()}</p>
                    <p className="muted">
                      {h.exercises
                        .filter((e) => e.completed)
                        .map((e) => e.name)
                        .slice(0, 4)
                        .join(', ')}
                      {done > 4 ? '…' : ''}
                    </p>
                  </div>
                  <span className="pill">
                    {done}/{h.exercises.length}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="section">
        <Button
          variant="danger"
          fullWidth
          onClick={() => {
            if (confirm('Reset your plan and progress? This cannot be undone.')) {
              resetAll();
            }
          }}
        >
          Reset App Data
        </Button>
      </section>

      <Navigation />
    </main>
  );
}
