import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';

export function AuthScreen() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  const submit = async () => {
    setError('');
    setMessage('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    const result =
      mode === 'signin' ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setError(result.message ?? 'Something went wrong.');
      return;
    }
    if (result.message) setMessage(result.message);
  };

  return (
    <main className="page fade-in auth-page">
      <p className="eyebrow">{mode === 'signin' ? 'Welcome back' : 'Create account'}</p>
      <h1>{mode === 'signin' ? 'Sign in' : 'Sign up'}</h1>
      <p className="lede">
        Your questionnaire, workout plan, and progress stay saved to your account.
      </p>

      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="timer-setting">
          Email
          <input
            className="text-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="timer-setting">
          Password
          <input
            className="text-input"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="auth-message">{message}</p> : null}

        <Button size="lg" fullWidth type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
        </Button>
      </form>

      <button
        type="button"
        className="text-btn"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError('');
          setMessage('');
        }}
      >
        {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
      </button>
    </main>
  );
}
