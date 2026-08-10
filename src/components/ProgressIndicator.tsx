interface Props {
  step: number;
  total: number;
  label?: string;
}

export function ProgressIndicator({ step, total, label }: Props) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="progress-indicator" aria-label={`Step ${step} of ${total}`}>
      <div className="progress-indicator__meta">
        <span className="progress-indicator__step">
          Step {step} of {total}
        </span>
        {label ? <span className="progress-indicator__label">{label}</span> : null}
      </div>
      <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
