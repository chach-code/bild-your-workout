import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { AppProvider } from './hooks/useApp';
import { AuthProvider } from './hooks/useAuth';
import { AuthScreen } from './screens/Auth';
import { Dashboard } from './screens/Dashboard';
import { PlanView } from './screens/PlanView';
import { ProgressView } from './screens/ProgressView';
import { Questionnaire } from './screens/Questionnaire';
import { Welcome } from './screens/Welcome';
import { WorkoutSession } from './screens/WorkoutSession';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <div className="app-shell">
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/auth" element={<AuthScreen />} />
              <Route
                path="/onboarding"
                element={
                  <RequireAuth>
                    <Questionnaire />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/plan"
                element={
                  <RequireAuth>
                    <PlanView />
                  </RequireAuth>
                }
              />
              <Route
                path="/plan/:dayIndex"
                element={
                  <RequireAuth>
                    <PlanView />
                  </RequireAuth>
                }
              />
              <Route
                path="/workout"
                element={
                  <RequireAuth>
                    <WorkoutSession />
                  </RequireAuth>
                }
              />
              <Route
                path="/workout/:dayIndex"
                element={
                  <RequireAuth>
                    <WorkoutSession />
                  </RequireAuth>
                }
              />
              <Route
                path="/progress"
                element={
                  <RequireAuth>
                    <ProgressView />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  );
}
