// Juice engine: WebAudio bleeps, haptics and DOM animations. No audio assets needed.
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

export type SfxName = 'correct' | 'wrong' | 'click' | 'match' | 'fanfare' | 'combo';

export function sfx(name: SfxName) {
  try {
    switch (name) {
      case 'correct': tone(660, 0, 0.12); tone(880, 0.08, 0.22); break;
      case 'wrong': tone(180, 0, 0.22, 'sawtooth', 0.09); tone(135, 0.1, 0.3, 'sawtooth', 0.09); break;
      case 'click': tone(520, 0, 0.06, 'triangle', 0.05); break;
      case 'match': tone(990, 0, 0.09, 'triangle', 0.09); break;
      case 'fanfare': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.24)); break;
      case 'combo': tone(740, 0, 0.08, 'triangle', 0.12); tone(988, 0.07, 0.1, 'triangle', 0.12); tone(1319, 0.15, 0.18, 'triangle', 0.12); break;
    }
  } catch { /* audio unavailable or blocked — fine */ }
}

export function buzz(pattern: number | number[]) {
  try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern); } catch { /* ignore */ }
}

function restart(node: HTMLElement | null | undefined, cls: string) {
  if (!node) return;
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

export function shake(node: HTMLElement | null) { restart(node, 'shake'); }
export function pop(node: HTMLElement | null) { restart(node, 'pop'); }
export function pulse(node: HTMLElement | null) { restart(node, 'pulse'); }

export function xpFly(text: string, x: number, y: number) {
  const s = document.createElement('span');
  s.className = 'xp-fly';
  s.textContent = text;
  s.style.left = `${Math.round(x)}px`;
  s.style.top = `${Math.round(y)}px`;
  document.body.append(s);
  s.addEventListener('animationend', () => s.remove());
}

const CONFETTI_COLORS = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce1126', '#8b5cf6'];

export function confettiBurst(n = 90) {
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
