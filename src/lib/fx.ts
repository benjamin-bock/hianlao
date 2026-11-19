// Juice engine: WebAudio bleeps, haptics, ripples and DOM animations. No audio assets needed.
//
// Everything is gated on a persisted master switch (localStorage 'hianlao-fx',
// toggled from the header 🔊 button) so learners can silence sound+haptics in
// one tap. Haptics use navigator.vibrate on the web and — when the app later
// ships through Capacitor — the native Haptics plugin, duck-typed so no extra
// dependency is needed. All visual effects respect prefers-reduced-motion.
'use client';

let actx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!actx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  } catch { return null; }
}

// ---- master on/off switch (sound + haptics), persisted ----
const FX_KEY = 'hianlao-fx';

export function fxEnabled(): boolean {
  try { return localStorage.getItem(FX_KEY) !== 'off'; } catch { return true; }
}

export function setFxEnabled(on: boolean) {
  try { localStorage.setItem(FX_KEY, on ? 'on' : 'off'); } catch { /* ignore */ }
}

export function toggleFx(): boolean {
  const next = !fxEnabled();
  setFxEnabled(next);
  return next;
}

export function reducedMotion(): boolean {
  try { return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

function tone(freq: number, delay: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export type SfxName =
  | 'correct' | 'wrong' | 'click' | 'tick' | 'select' | 'deselect'
  | 'match' | 'fanfare' | 'combo' | 'levelup' | 'heart';

export function sfx(name: SfxName) {
  if (!fxEnabled()) return;
  try {
    switch (name) {
      case 'correct': tone(660, 0, 0.12); tone(880, 0.08, 0.22); break;
      case 'wrong': tone(180, 0, 0.22, 'sawtooth', 0.09); tone(135, 0.1, 0.3, 'sawtooth', 0.09); break;
      case 'click': tone(520, 0, 0.06, 'triangle', 0.05); break;
      // soft UI tick for global press feedback — quiet so it never gets annoying
      case 'tick': tone(620, 0, 0.045, 'triangle', 0.028); break;
      case 'select': tone(740, 0, 0.05, 'triangle', 0.06); break;
      case 'deselect': tone(430, 0, 0.05, 'triangle', 0.05); break;
      case 'match': tone(990, 0, 0.09, 'triangle', 0.09); break;
      case 'fanfare': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.24)); break;
      case 'combo': tone(740, 0, 0.08, 'triangle', 0.12); tone(988, 0.07, 0.1, 'triangle', 0.12); tone(1319, 0.15, 0.18, 'triangle', 0.12); break;
      case 'levelup': [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.16, 'triangle', 0.11)); break;
      case 'heart': tone(392, 0, 0.1, 'sine', 0.12); tone(311, 0.09, 0.16, 'sine', 0.1); break;
    }
  } catch { /* audio unavailable or blocked — fine */ }
}

// ---- haptics: Capacitor native plugin when present (future mobile app),
// navigator.vibrate on the web. Patterns are ms; named kinds map to native
// impact/notification styles when the plugin exists. ----
interface CapacitorHaptics {
  impact(args: { style: 'HEAVY' | 'MEDIUM' | 'LIGHT' }): Promise<void>;
  notification(args: { type: 'SUCCESS' | 'WARNING' | 'ERROR' }): Promise<void>;
  vibrate(args?: { duration?: number }): Promise<void>;
}

function capacitorHaptics(): CapacitorHaptics | null {
  try {
    const cap = (window as unknown as { Capacitor?: { Plugins?: { Haptics?: CapacitorHaptics } } }).Capacitor;
    return cap?.Plugins?.Haptics ?? null;
  } catch { return null; }
}

export function buzz(pattern: number | number[]) {
  if (!fxEnabled()) return;
  try {
    const h = capacitorHaptics();
    if (h) {
      if (typeof pattern === 'number') {
        if (pattern >= 60) void h.notification({ type: 'ERROR' }).catch(() => undefined);
        else void h.impact({ style: 'LIGHT' }).catch(() => undefined);
      } else {
        void h.notification({ type: 'SUCCESS' }).catch(() => undefined);
      }
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  } catch { /* ignore */ }
}

function restart(node: HTMLElement | null | undefined, cls: string) {
  if (!node) return;
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

export function shake(node: HTMLElement | null) { if (!reducedMotion()) restart(node, 'shake'); }
export function pop(node: HTMLElement | null) { if (!reducedMotion()) restart(node, 'pop'); }
export function pulse(node: HTMLElement | null) { if (!reducedMotion()) restart(node, 'pulse'); }

export function xpFly(text: string, x: number, y: number) {
  if (reducedMotion()) return;
  const s = document.createElement('span');
  s.className = 'xp-fly';
  s.textContent = text;
  s.style.left = `${Math.round(x)}px`;
  s.style.top = `${Math.round(y)}px`;
  document.body.append(s);
  s.addEventListener('animationend', () => s.remove());
}

// Small celebratory burst anchored at a point (e.g. the option that was just
// tapped correct) — Duolingo's little green pop.
export function burstAt(x: number, y: number, n = 14) {
  if (reducedMotion()) return;
  const wrap = document.createElement('div');
  wrap.className = 'burst-wrap';
  for (let i = 0; i < n; i++) {
    const c = document.createElement('span');
    c.className = 'burst';
    const ang = (i / n) * Math.PI * 2 + Math.random() * 0.6;
    const dist = 34 + Math.random() * 42;
    c.style.left = `${Math.round(x)}px`;
    c.style.top = `${Math.round(y)}px`;
    c.style.background = BURST_COLORS[i % BURST_COLORS.length];
    c.style.setProperty('--dx', `${Math.round(Math.cos(ang) * dist)}px`);
    c.style.setProperty('--dy', `${Math.round(Math.sin(ang) * dist - 18)}px`);
    c.style.animationDelay = `${(Math.random() * 0.05).toFixed(2)}s`;
    wrap.append(c);
  }
  document.body.append(wrap);
  setTimeout(() => wrap.remove(), 900);
}

// Tap ripple at the pointer position inside a button/card.
export function ripple(node: HTMLElement, clientX: number, clientY: number) {
  if (reducedMotion()) return;
  const rect = node.getBoundingClientRect();
  const d = Math.max(rect.width, rect.height) * 2.2;
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.width = r.style.height = `${Math.round(d)}px`;
  r.style.left = `${clientX - rect.left - d / 2}px`;
  r.style.top = `${clientY - rect.top - d / 2}px`;
  node.append(r);
  setTimeout(() => r.remove(), 480);
}

const BURST_COLORS = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#8b5cf6'];
const CONFETTI_COLORS = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce1126', '#8b5cf6'];

export function confettiBurst(n = 90) {
  if (reducedMotion()) return;
  const wrap = document.createElement('div');
  wrap.className = 'confetti-wrap';
  for (let i = 0; i < n; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    c.style.animationDelay = `${(Math.random() * 0.6).toFixed(2)}s`;
    c.style.animationDuration = `${(2.2 + Math.random() * 1.6).toFixed(2)}s`;
    c.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
    wrap.append(c);
  }
  document.body.append(wrap);
  setTimeout(() => wrap.remove(), 4600);
}
