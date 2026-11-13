// Local progress store (localStorage). No accounts, no servers — your progress stays on your device.
const KEY = 'hianlao-v1';

const defaults = () => ({ xp: 0, done: {}, streak: 0, lastVisit: null });

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
  } catch {
    return defaults();
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode etc. */ }
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function getState() { return load(); }

export function addXp(n) {
  const s = load();
  s.xp += n;
  save(s);
  return s.xp;
}

export function markDone(lessonId) {
  const s = load();
  s.done[lessonId] = Date.now();
  save(s);
}

export function isDone(lessonId) { return !!load().done[lessonId]; }

export function totalDone() { return Object.keys(load().done).length; }

// Call once per page visit: updates the daily streak.
export function touchStreak() {
  const s = load();
  const today = todayStr();
  if (s.lastVisit !== today) {
    const y = new Date(Date.now() - 86400000);
    const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    s.streak = s.lastVisit === yStr ? s.streak + 1 : 1;
    s.lastVisit = today;
    save(s);
  }
  return s;
}

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
