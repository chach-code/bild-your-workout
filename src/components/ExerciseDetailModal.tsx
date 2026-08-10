import { useEffect } from 'react';
import { getExerciseById } from '../data/exercises';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { Button } from './Button';

interface Props {
  exerciseId: string;
  onClose: () => void;
}

export function ExerciseDetailModal({ exerciseId, onClose }: Props) {
  const ex = getExerciseById(exerciseId);
  useBodyScrollLock(!!ex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!ex) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="exercise-detail-title">{ex.name}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal__content">
          <p className="modal__muscles">
            <strong>Muscles:</strong> {ex.muscles.map((m) => m.replace('_', ' ')).join(', ')}
          </p>

          <section>
            <h3>How to do it</h3>
            <ol className="steps">
              {ex.instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section>
            <h3>Common mistakes</h3>
            <ul>
              {ex.mistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </section>

          <section className="mod-grid">
            <div>
              <h3>Easier option</h3>
              <p>{ex.beginnerMod}</p>
            </div>
            <div>
              <h3>Harder option</h3>
              <p>{ex.harderMod}</p>
            </div>
          </section>
        </div>

        <div className="modal__footer">
          <Button fullWidth onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
