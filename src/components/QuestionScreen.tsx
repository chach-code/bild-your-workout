import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  footer?: ReactNode;
}

export function QuestionScreen({ title, subtitle, children, onBack, footer }: Props) {
  return (
    <section className="question-screen fade-in">
      <div className="question-screen__header">
        {onBack ? (
          <button type="button" className="text-btn" onClick={onBack}>
            ← Back
          </button>
        ) : (
          <span />
        )}
      </div>
      <h1 className="question-screen__title">{title}</h1>
      {subtitle ? <p className="question-screen__subtitle">{subtitle}</p> : null}
      <div className="question-screen__body">{children}</div>
      {footer ? <div className="question-screen__footer">{footer}</div> : null}
    </section>
  );
}
