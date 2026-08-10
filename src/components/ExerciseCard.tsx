import { getExerciseById } from '../data/exercises';
import type { PlannedExercise } from '../types';
import { Button } from './Button';

interface Props {
  exercise: PlannedExercise;
  checked?: boolean;
  onToggle?: () => void;
  onHowTo?: () => void;
  showCheckbox?: boolean;
}

export function ExerciseCard({
  exercise,
  checked = false,
  onToggle,
  onHowTo,
  showCheckbox = false,
}: Props) {
  const details = getExerciseById(exercise.exerciseId);
  const muscles = details?.muscles.map((m) => m.replace('_', ' ')).join(', ');

  return (
    <article
      className={`exercise-card ${checked ? 'is-done' : ''} ${showCheckbox ? 'is-interactive' : ''}`}
      onClick={showCheckbox && onToggle ? onToggle : undefined}
      onKeyDown={
        showCheckbox && onToggle
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle();
              }
            }
          : undefined
      }
      role={showCheckbox ? 'checkbox' : undefined}
      aria-checked={showCheckbox ? checked : undefined}
      tabIndex={showCheckbox ? 0 : undefined}
    >
      <div className="exercise-card__main">
        {showCheckbox ? (
          <div className="exercise-card__check" aria-hidden="true">
            <span className={`check-box ${checked ? 'is-on' : ''}`}>{checked ? '✓' : ''}</span>
          </div>
        ) : null}
        <div className="exercise-card__body">
          <h3 className="exercise-card__name">{exercise.name}</h3>
          <p className="exercise-card__prescription">
            {exercise.sets} sets × {exercise.reps}
            {exercise.restSeconds > 0 ? ` · Rest ${exercise.restSeconds}s` : ''}
          </p>
          {muscles ? <p className="exercise-card__muscles">Works: {muscles}</p> : null}
          {exercise.notes ? <p className="exercise-card__notes">{exercise.notes}</p> : null}
        </div>
      </div>
      {onHowTo ? (
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onHowTo();
          }}
        >
          How to do it
        </Button>
      ) : null}
    </article>
  );
}
