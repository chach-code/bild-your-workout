import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { useApp } from '../hooks/useApp';
import { useAuth } from '../hooks/useAuth';

export function Welcome() {
  const { state, syncing } = useApp();
  const { user, signOut } = useAuth();
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
          {user ? (
            <>
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
              <Button size="lg" variant="ghost" onClick={() => void signOut()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button size="lg">Sign In / Sign Up →</Button>
              </Link>
            </>
          )}
        </div>
        {user ? (
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Signed in as {user.email}
            {syncing ? ' · Loading your plan…' : hasPlan ? ' · Your plan is saved to your account.' : ''}
          </p>
        ) : (
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Sign in so your answers, plan, and progress stay with your account.
          </p>
        )}
        <p className="disclaimer">
          Workouts are general fitness suggestions. Stop if you feel pain or unwell. This app does
          not provide medical treatment or injury rehab advice.
        </p>
      </div>
    </main>
  );
}
