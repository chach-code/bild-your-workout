import { useEffect, useMemo, useRef, useState } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import {
  buildTimerPlan,
  formatClock,
  type TimerPhase,
  type TimerPlan,
} from '../logic/parseTimer';
import {
  LEADIN_OPTIONS,
  loadBeepEnabled,
  loadLeadInSeconds,
  playBeep,
  saveBeepEnabled,
  saveLeadInSeconds,
  type LeadInSeconds,
} from '../logic/timerPrefs';
import type { PlannedExercise } from '../types';
import { Button } from './Button';

interface Props {
  exercise: PlannedExercise;
  onClose: () => void;
  /** Called once when the full timer finishes successfully. */
  onComplete: () => void;
}

type Mode = 'setup' | 'running' | 'finished';

function phaseClass(kind: TimerPhase['kind']): string {
  if (kind === 'leadin') return 'is-leadin';
  if (kind === 'rest') return 'is-rest';
  return 'is-work';
}

function phaseTitle(phase: TimerPhase): string {
  if (phase.kind === 'leadin') return 'Get ready';
  if (phase.kind === 'rest') return phase.label || 'Rest';
  return phase.label || 'Work';
}

function buildQueue(plan: TimerPlan, lead: LeadInSeconds): TimerPhase[] {
  const queue: TimerPhase[] = [];
  if (lead > 0) {
    queue.push({ kind: 'leadin', seconds: lead, label: 'Get ready' });
  }
  queue.push(...plan.phases);
  return queue;
}

export function ExerciseTimer({ exercise, onClose, onComplete }: Props) {
  const plan = useMemo(() => buildTimerPlan(exercise), [exercise]);
  const [mode, setMode] = useState<Mode>('setup');
  const [leadIn, setLeadIn] = useState<LeadInSeconds>(() => loadLeadInSeconds());
  const [beep, setBeep] = useState(() => loadBeepEnabled());
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);

  const queueRef = useRef<TimerPhase[]>([]);
  const phaseIndexRef = useRef(0);
  const remainingRef = useRef(0);
  const runningRef = useRef(false);
  const beepRef = useRef(beep);
  const completedRef = useRef(false);

  useBodyScrollLock(true);

  useEffect(() => {
    beepRef.current = beep;
  }, [beep]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const finishAll = () => {
    runningRef.current = false;
    setRunning(false);
    remainingRef.current = 0;
    setRemaining(0);
    setMode('finished');
    if (beepRef.current) playBeep('done');
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  const goToPhase = (index: number) => {
    const queue = queueRef.current;
    if (index >= queue.length) {
      finishAll();
      return;
    }
    if (beepRef.current) playBeep('phase');
    phaseIndexRef.current = index;
    setPhaseIndex(index);
    remainingRef.current = queue[index].seconds;
    setRemaining(queue[index].seconds);
    runningRef.current = true;
    setRunning(true);
  };

  const advanceRef = useRef(() => {
    goToPhase(phaseIndexRef.current + 1);
  });
  advanceRef.current = () => goToPhase(phaseIndexRef.current + 1);

  // Countdown loop while running
  useEffect(() => {
    if (mode !== 'running') return;

    let frame = 0;
    let last = performance.now();
    let lastCeil = Math.ceil(remainingRef.current);

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!runningRef.current) {
        last = now;
        return;
      }

      const dt = (now - last) / 1000;
      last = now;
      const next = remainingRef.current - dt;
      remainingRef.current = next;
      setRemaining(next);

      const ceil = Math.ceil(Math.max(next, 0));
      if (beepRef.current && ceil > 0 && ceil <= 3 && ceil < lastCeil) {
        playBeep('tick');
      }
      lastCeil = ceil;

      if (next <= 0) {
        advanceRef.current();
        lastCeil = Math.ceil(remainingRef.current);
        last = performance.now();
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mode, phaseIndex]);

  if (!plan) return null;

  const start = () => {
    saveLeadInSeconds(leadIn);
    saveBeepEnabled(beep);
    completedRef.current = false;
    const queue = buildQueue(plan, leadIn);
    queueRef.current = queue;
    phaseIndexRef.current = 0;
    setPhaseIndex(0);
    remainingRef.current = queue[0]?.seconds ?? 0;
    setRemaining(remainingRef.current);
    runningRef.current = true;
    setRunning(true);
    setMode('running');
    if (beep) playBeep('phase');
  };

  const current = queueRef.current[phaseIndex];
  const displaySeconds = Math.max(0, Math.ceil(remaining));
  const progress =
    current && current.seconds > 0 ? 1 - Math.max(0, remaining) / current.seconds : 0;

  return (
    <div
      className={`timer-overlay ${mode === 'running' && current ? phaseClass(current.kind) : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Exercise timer"
    >
      <div className="timer-overlay__inner">
        <button type="button" className="timer-close text-btn" onClick={onClose}>
          ✕ Close
        </button>

        {mode === 'setup' && (
          <div className="timer-setup fade-in">
            <p className="eyebrow">Timer</p>
            <h2>{plan.exerciseName}</h2>
            <p className="muted">{plan.prescription}</p>
            <p className="timer-summary">{plan.summary}</p>

            <div className="timer-settings">
              <label className="timer-setting">
                <span>Get-ready countdown</span>
                <select
                  value={leadIn}
                  onChange={(e) => setLeadIn(Number(e.target.value) as LeadInSeconds)}
                >
                  {LEADIN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 0 ? 'None' : `${opt} seconds`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="timer-setting timer-setting--row">
                <span>Beep at phase changes & end</span>
                <input
                  type="checkbox"
                  checked={beep}
                  onChange={(e) => setBeep(e.target.checked)}
                />
              </label>
            </div>

            <div className="timer-actions">
              <Button size="lg" fullWidth onClick={start}>
                Start Timer →
              </Button>
              <Button size="lg" fullWidth variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {mode === 'running' && current && (
          <div className={`timer-running fade-in ${phaseClass(current.kind)}`}>
            <p className="timer-exercise">{plan.exerciseName}</p>
            <p className="timer-phase-label">{phaseTitle(current)}</p>
            {current.round && current.totalRounds ? (
              <p className="timer-round">
                Round {current.round} of {current.totalRounds}
              </p>
            ) : null}
            <p className="timer-clock" aria-live="polite">
              {formatClock(displaySeconds)}
            </p>
            <div className="timer-progress" aria-hidden="true">
              <div
                className="timer-progress__fill"
                style={{ width: `${Math.min(100, progress * 100)}%` }}
              />
            </div>
            <p className="muted">
              Step {phaseIndex + 1} of {queueRef.current.length}
            </p>
            <div className="timer-actions timer-actions--row">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  runningRef.current = !runningRef.current;
                  setRunning(runningRef.current);
                }}
              >
                {running ? 'Pause' : 'Resume'}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => advanceRef.current()}>
                Skip →
              </Button>
            </div>
          </div>
        )}

        {mode === 'finished' && (
          <div className="timer-finished fade-in">
            <p className="eyebrow">Nice work</p>
            <h2>Done!</h2>
            <p className="muted">{plan.exerciseName} is checked off.</p>
            <Button size="lg" fullWidth onClick={onClose}>
              Back to workout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
