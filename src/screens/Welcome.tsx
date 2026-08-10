import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { useApp } from '../hooks/useApp';

export function Welcome() {
  const { state } = useApp();
  const hasPlan = !!state.plan;

  return (
    <main className="welcome">
      <div className="welcome__atmosphere" aria-hidden="true" />
      <div className="welcome__content">
        <p className="eyebrow">Personalized training</p>
        <h1 className="welcome__brand">Build Your Workout</h1>
        <p className="welcome__subtitle">
          Tell us about yourself and we&apos;ll create a workout plan built around your goals.
        </p>
        <div className="welcome__actions">
          <Link to="/onboarding">
            <Button size="lg">{hasPlan ? 'Create a New Plan →' : 'Create My Plan →'}</Button>
          </Link>
          {hasPlan ? (
            <Link to="/dashboard">
              <Button size="lg" variant="secondary">
                Open My Dashboard
              </Button>
            </Link>
          ) : null}
        </div>
        {hasPlan ? (
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Your current plan is saved on this device. Creating a new one replaces it.
          </p>
        ) : null}
        <p className="disclaimer">
          Workouts are general fitness suggestions. Stop if you feel pain or unwell. This app does
          not provide medical treatment or injury rehab advice.
        </p>
      </div>
    </main>
  );
}
