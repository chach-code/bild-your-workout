import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { QuestionScreen } from '../components/QuestionScreen';
import {
  DAY_OPTIONS,
  DURATION_OPTIONS,
  EQUIPMENT_OPTIONS,
  FITNESS_LEVELS,
  GENDER_OPTIONS,
  GOALS,
  SPORTS,
  getSportConfig,
} from '../data/sports';
import { useApp } from '../hooks/useApp';
import type { Duration, Equipment, FitnessLevel, Gender, Goal, Sport, UserProfile } from '../types';

interface Draft {
  age: string;
  gender: Gender;
  fitnessLevel: FitnessLevel | '';
  sport: Sport | '';
  position: string;
  goals: Goal[];
  primaryFocus: string;
  equipment: Equipment[];
  daysPerWeek: number | null;
  duration: Duration | null;
  notes: string;
}

const INITIAL: Draft = {
  age: '',
  gender: '',
  fitnessLevel: '',
  sport: '',
  position: '',
  goals: [],
  primaryFocus: '',
  equipment: [],
  daysPerWeek: null,
  duration: null,
  notes: '',
};

function OptionGrid<T extends string | number>({
  options,
  value,
  multi,
  onSelect,
}: {
  options: { id: T; label: string; description?: string }[];
  value: T | T[] | null | '';
  multi?: boolean;
  onSelect: (id: T) => void;
}) {
  const selected = Array.isArray(value) ? value : value !== null && value !== '' ? [value] : [];
  return (
    <div className="option-grid">
      {options.map((opt) => {
        const isOn = selected.includes(opt.id);
        return (
          <button
            key={String(opt.id)}
            type="button"
            className={`option-chip ${isOn ? 'is-selected' : ''}`}
            onClick={() => onSelect(opt.id)}
            aria-pressed={isOn}
          >
            <span className="option-chip__label">{opt.label}</span>
            {opt.description ? <span className="option-chip__desc">{opt.description}</span> : null}
            {multi ? <span className="option-chip__mark">{isOn ? '✓' : ''}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function Questionnaire() {
  const navigate = useNavigate();
  const { createPlan } = useApp();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(INITIAL);
  const [error, setError] = useState('');
  const [building, setBuilding] = useState(false);

  const sportConfig = draft.sport ? getSportConfig(draft.sport) : null;
  const needsPosition = !!(sportConfig && sportConfig.positions.length > 0);

  const steps = useMemo(() => {
    const base = [
      'age',
      'gender',
      'fitness',
      'sport',
      ...(needsPosition ? ['position'] : []),
      'goals',
      'primary',
      'equipment',
      'days',
      'duration',
      'notes',
    ] as const;
    return base;
  }, [needsPosition]);

  const total = steps.length;
  const current = steps[step];

  const toggleGoal = (id: Goal) => {
    setDraft((d) => ({
      ...d,
      goals: d.goals.includes(id) ? d.goals.filter((g) => g !== id) : [...d.goals, id],
    }));
  };

  const toggleEquipment = (id: Equipment) => {
    setDraft((d) => {
      let next = d.equipment.includes(id)
        ? d.equipment.filter((e) => e !== id)
        : [...d.equipment, id];
      if (id === 'none' && !d.equipment.includes('none')) {
        next = ['none'];
      } else if (id !== 'none') {
        next = next.filter((e) => e !== 'none');
      }
      return { ...d, equipment: next };
    });
  };

  const validate = (): boolean => {
    setError('');
    switch (current) {
      case 'age': {
        const age = Number(draft.age);
        if (!draft.age || Number.isNaN(age) || age < 8 || age > 100) {
          setError('Enter an age between 8 and 100.');
          return false;
        }
        return true;
      }
      case 'gender':
        return true;
      case 'fitness':
        if (!draft.fitnessLevel) {
          setError('Choose your fitness level.');
          return false;
        }
        return true;
      case 'sport':
        if (!draft.sport) {
          setError('Select a sport option.');
          return false;
        }
        return true;
      case 'position':
        if (!draft.position) {
          setError('Select your position (or Not sure).');
          return false;
        }
        return true;
      case 'goals':
        if (draft.goals.length === 0) {
          setError('Pick at least one goal.');
          return false;
        }
        return true;
      case 'primary':
        if (!draft.primaryFocus.trim()) {
          setError('Tell us what you want to improve most.');
          return false;
        }
        return true;
      case 'equipment':
        if (draft.equipment.length === 0) {
          setError('Select the equipment you have (or No equipment).');
          return false;
        }
        return true;
      case 'days':
        if (!draft.daysPerWeek) {
          setError('Choose how many days you can train.');
          return false;
        }
        return true;
      case 'duration':
        if (!draft.duration) {
          setError('Choose a session length.');
          return false;
        }
        return true;
      case 'notes':
        return true;
      default:
        return true;
    }
  };

  const finish = () => {
    setBuilding(true);
    const profile: UserProfile = {
      age: Number(draft.age),
      gender: draft.gender || 'prefer_not',
      fitnessLevel: draft.fitnessLevel as FitnessLevel,
      sport: draft.sport as Sport,
      position: draft.position,
      goals: draft.goals,
      primaryFocus: draft.primaryFocus.trim(),
      equipment: draft.equipment,
      daysPerWeek: draft.daysPerWeek as number,
      duration: draft.duration as Duration,
      notes: draft.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    // Brief pause so the "building" state is noticeable
    window.setTimeout(() => {
      void createPlan(profile).then(() => navigate('/dashboard'));
    }, 450);
  };

  const next = () => {
    if (!validate()) return;
    if (step >= total - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  const back = () => {
    setError('');
    if (step === 0) {
      navigate('/');
      return;
    }
    setStep((s) => s - 1);
  };

  const labels: Record<string, string> = {
    age: 'About you',
    gender: 'About you',
    fitness: 'About you',
    sport: 'Sport',
    position: 'Sport',
    goals: 'Goals',
    primary: 'Goals',
    equipment: 'Equipment',
    days: 'Schedule',
    duration: 'Schedule',
    notes: 'Anything else',
  };

  return (
    <main className="onboarding">
      <ProgressIndicator step={step + 1} total={total} label={labels[current]} />

      {current === 'age' && (
        <QuestionScreen
          title="What is your age?"
          subtitle="We use this to keep recommendations age-appropriate."
          onBack={back}
          footer={
            <Button size="lg" fullWidth onClick={next}>
              Continue
            </Button>
          }
        >
          <input
            className="text-input"
            type="number"
            inputMode="numeric"
            min={8}
            max={100}
            placeholder="e.g. 16"
            value={draft.age}
            autoFocus
            onChange={(e) => setDraft({ ...draft, age: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') next();
            }}
          />
        </QuestionScreen>
      )}

      {current === 'gender' && (
        <QuestionScreen
          title="What is your gender?"
          subtitle="Optional — skip if you prefer."
          onBack={back}
          footer={
            <div className="footer-row">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  setDraft({ ...draft, gender: '' });
                  setStep((s) => s + 1);
                }}
              >
                Skip
              </Button>
              <Button size="lg" onClick={next}>
                Continue
              </Button>
            </div>
          }
        >
          <OptionGrid
            options={GENDER_OPTIONS}
            value={draft.gender}
            onSelect={(id) => setDraft({ ...draft, gender: id })}
          />
        </QuestionScreen>
      )}

      {current === 'fitness' && (
        <QuestionScreen
          title="What is your current fitness level?"
          subtitle="Be honest — the plan gets better when this matches reality."
          onBack={back}
          footer={
            <Button size="lg" fullWidth onClick={next}>
              Continue
            </Button>
          }
        >
          <OptionGrid
            options={FITNESS_LEVELS}
            value={draft.fitnessLevel}
            onSelect={(id) => setDraft({ ...draft, fitnessLevel: id })}
          />
        </QuestionScreen>
      )}

      {current === 'sport' && (
        <QuestionScreen
          title="What sport do you play?"
          subtitle="We'll tailor training to your sport's demands."
          onBack={back}
          footer={
            <Button size="lg" fullWidth onClick={next}>
              Continue
            </Button>
          }
        >
          <OptionGrid
            options={SPORTS.map((s) => ({ id: s.id, label: s.label }))}
            value={draft.sport}
            onSelect={(id) =>
              setDraft({
                ...draft,
                sport: id,
                position: '',
              })
            }
          />
        </QuestionScreen>
      )}

      {current === 'position' && sportConfig && (
        <QuestionScreen
          title="What position do you play?"
          subtitle="Optional detail that can shape emphasis in your plan."
          onBack={back}
          footer={
            <Button size="lg" fullWidth onClick={next}>
              Continue
            </Button>
          }
        >
          <OptionGrid
            options={sportConfig.positions.map((p) => ({ id: p, label: p }))}
            value={draft.position}
            onSelect={(id) => setDraft({ ...draft, position: id })}
          />
        </QuestionScreen>
      )}

      {current === 'goals' && (
        <QuestionScreen
          title="What are your main goals?"
          subtitle="Select as many as you like."
          onBack={back}
          footer={
            <Button size="lg" fullWidth onClick={next}>
              Continue
            </Button>
          }
        >
          <OptionGrid options={GOALS} value={draft.goals} multi onSelect={toggleGoal} />
        </QuestionScreen>
      )}

      {current === 'primary' && (
        <QuestionScreen
          title="What do you want to improve the most?"
          subtitle="One sentence is perfect. Example: vertical jump for basketball."
          onBack={back}
          footer={
            <Button size="lg" fullWidth onClick={next}>
              Continue
            </Button>
          }
        >
          <textarea
            className="text-area"
            rows={4}
            placeholder="I most want to..."
            value={draft.primaryFocus}
            autoFocus
            onChange={(e) => setDraft({ ...draft, primaryFocus: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) next();
            }}
          />
        </QuestionScreen>
      )}

      {current === 'equipment' && (
        <QuestionScreen
          title="What equipment do you have?"
          subtitle="We'll only prescribe moves you can actually do."
          onBack={back}
          footer={
            <Button size="lg" fullWidth onClick={next}>
              Continue
            </Button>
          }
        >
          <OptionGrid
            options={EQUIPMENT_OPTIONS}
            value={draft.equipment}
            multi
            onSelect={toggleEquipment}
          />
        </QuestionScreen>
      )}

      {current === 'days' && (
        <QuestionScreen
          title="How many days per week can you work out?"
          subtitle="Consistency beats perfection."
          onBack={back}
          footer={
            <Button size="lg" fullWidth onClick={next}>
              Continue
            </Button>
          }
        >
          <OptionGrid
            options={DAY_OPTIONS.map((d) => ({ id: d, label: `${d} days` }))}
            value={draft.daysPerWeek}
            onSelect={(id) => setDraft({ ...draft, daysPerWeek: id })}
          />
        </QuestionScreen>
      )}

      {current === 'duration' && (
        <QuestionScreen
          title="How long do you want each workout to be?"
          subtitle="We'll size the session to fit your schedule."
          onBack={back}
          footer={
            <Button size="lg" fullWidth onClick={next}>
              Continue
            </Button>
          }
        >
          <OptionGrid
            options={DURATION_OPTIONS}
            value={draft.duration}
            onSelect={(id) => setDraft({ ...draft, duration: id })}
          />
        </QuestionScreen>
      )}

      {current === 'notes' && (
        <QuestionScreen
          title="Anything else we should know?"
          subtitle="Injuries to avoid stressing, preferences, or schedule quirks. Optional."
          onBack={back}
          footer={
            <Button size="lg" fullWidth onClick={next} disabled={building}>
              {building ? 'Building your plan…' : 'Build My Plan →'}
            </Button>
          }
        >
          <textarea
            className="text-area"
            rows={5}
            placeholder="Optional notes..."
            value={draft.notes}
            autoFocus
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) next();
            }}
          />
        </QuestionScreen>
      )}

      {error ? <p className="form-error">{error}</p> : null}
    </main>
  );
}
