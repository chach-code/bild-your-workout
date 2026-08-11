import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="page fade-in">
        <p className="eyebrow">Account</p>
        <h1>Loading…</h1>
        <p className="muted">Checking your sign-in.</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
