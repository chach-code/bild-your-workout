import { Link } from 'react-router-dom';
import type { WorkoutDay } from '../types';

interface Props {
  day: WorkoutDay;
  isToday?: boolean;
  completed?: boolean;
}

export function WorkoutCard({ day, isToday, completed }: Props) {
  const exerciseCount =
    day.warmUp.exercises.length + day.workout.exercises.length + day.coolDown.exercises.length;

  return (
    <article
      className={`workout-card ${day.type} ${isToday ? 'is-today' : ''} ${completed ? 'is-completed' : ''}`}
    >
      <div className="workout-card__top">
        <span className="workout-card__day">{day.dayName}</span>
        <div className="workout-card__badges">
          {completed ? <span className="pill pill-done">Done</span> : null}
          {isToday ? <span className="pill">Today</span> : null}
        </div>
      </div>
      <h3 className="workout-card__title">{day.title}</h3>
      <p className="workout-card__focus">{day.focus}</p>
      {day.type === 'rest' ? (
        <p className="workout-card__meta">Recovery day</p>
      ) : (
        <p className="workout-card__meta">
          {exerciseCount} movements · {day.type === 'active_recovery' ? 'Easy pace' : 'Training day'}
        </p>
      )}
      {day.type !== 'rest' ? (
        <Link className="text-link" to={`/plan/${day.dayIndex}`}>
          View details →
        </Link>
      ) : null}
    </article>
  );
}
