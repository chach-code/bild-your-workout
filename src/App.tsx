import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './hooks/useApp';
import { Dashboard } from './screens/Dashboard';
import { PlanView } from './screens/PlanView';
import { ProgressView } from './screens/ProgressView';
import { Questionnaire } from './screens/Questionnaire';
import { Welcome } from './screens/Welcome';
import { WorkoutSession } from './screens/WorkoutSession';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/onboarding" element={<Questionnaire />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/plan" element={<PlanView />} />
            <Route path="/plan/:dayIndex" element={<PlanView />} />
            <Route path="/workout" element={<WorkoutSession />} />
            <Route path="/workout/:dayIndex" element={<WorkoutSession />} />
            <Route path="/progress" element={<ProgressView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
