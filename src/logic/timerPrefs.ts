const LEADIN_KEY = 'byw_timer_leadin';
const BEEP_KEY = 'byw_timer_beep';

export const LEADIN_OPTIONS = [0, 5, 10, 15] as const;
export type LeadInSeconds = (typeof LEADIN_OPTIONS)[number];

export function loadLeadInSeconds(): LeadInSeconds {
  const raw = localStorage.getItem(LEADIN_KEY);
  const n = Number(raw);
  return (LEADIN_OPTIONS as readonly number[]).includes(n) ? (n as LeadInSeconds) : 10;
}

export function saveLeadInSeconds(value: LeadInSeconds): void {
  localStorage.setItem(LEADIN_KEY, String(value));
}

export function loadBeepEnabled(): boolean {
  const raw = localStorage.getItem(BEEP_KEY);
  if (raw == null) return true;
  return raw === '1' || raw === 'true';
}

export function saveBeepEnabled(value: boolean): void {
  localStorage.setItem(BEEP_KEY, value ? '1' : '0');
}

/** Short UI beep via Web Audio (no asset files). */
export function playBeep(kind: 'tick' | 'phase' | 'done' = 'phase'): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const tone = (freq: number, start: number, dur: number, gain = 0.08) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    if (kind === 'tick') {
      tone(880, now, 0.06, 0.05);
    } else if (kind === 'phase') {
      tone(660, now, 0.12, 0.09);
      tone(880, now + 0.12, 0.12, 0.09);
    } else {
      tone(523, now, 0.14, 0.1);
      tone(659, now + 0.14, 0.14, 0.1);
      tone(784, now + 0.28, 0.22, 0.1);
    }

    window.setTimeout(() => {
      void ctx.close();
    }, 800);
  } catch {
    // Audio may be blocked; ignore.
  }
}
