// HianLao progress store.
// Source of truth: the server (/api/progress) when signed in and the API is
// available; otherwise localStorage. The site always works without a backend.
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

export function mergeProgress(a, b) {
  return {
    xp: Math.max(a.xp || 0, b.xp || 0),
    done: { ...(a.done || {}), ...(b.done || {}) },
    streak: Math.max(a.streak || 0, b.streak || 0),
    lastVisit: [a.lastVisit, b.lastVisit].filter(Boolean).sort().pop() || null,
  };
}

let currentUser = null;
let putTimer = null;

async function putSoon() {
  if (!currentUser || !api.available) return;
  clearTimeout(putTimer);
  putTimer = setTimeout(async () => {
    try { await api.putProgress(load()); } catch { /* offline: stays in localStorage */ }
  }, 600);
}

export async function addXp(n) {
  const s = load();
  s.xp += n;
  save(s);
  await putSoon();
  return s.xp;
}

export async function markDone(lessonId) {
  const s = load();
  s.done[lessonId] = Date.now();
  save(s);
  await putSoon();
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
    putSoon();
  }
  return s;
}

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function getUser() { return currentUser; }

// ---- API layer (same origin /api; degrades to localStorage) ----
export const api = {
  available: false,
  async check() {
    try {
      const r = await fetch('api/health', { cache: 'no-store' });
      if (!r.ok) throw new Error('no api');
      const j = await r.json();
      this.available = !!j.ok;
    } catch {
      this.available = false;
    }
    return this.available;
  },
  async _post(path, payload) {
    const r = await fetch(`api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    const j = await r.json().catch(() => ({}));
    return { status: r.status, ...j };
  },
  async register(username, password, displayName) {
    const r = await this._post('auth/register', { username, password, displayName, localProgress: load() });
    if (r.ok && r.user) { currentUser = r.user; if (r.progress) save(r.progress); }
    return r;
  },
  async login(username, password) {
    const r = await this._post('auth/login', { username, password, localProgress: load() });
    if (r.ok && r.user) { currentUser = r.user; if (r.progress) save(r.progress); }
    return r;
  },
  async logout() {
    await this._post('auth/logout', {});
    currentUser = null;
  },
  async me() {
    try {
      const r = await fetch('api/auth/me', { cache: 'no-store' });
      const j = await r.json();
      if (j.ok && j.user) {
        currentUser = j.user;
        if (j.progress) { save(mergeProgress(load(), j.progress)); }
        return j.user;
      }
    } catch { /* offline */ }
    return null;
  },
  async getProgress() {
    try {
      const r = await fetch('api/progress', { cache: 'no-store' });
      if (r.status === 401) return null;
      const j = await r.json();
      return j.progress || null;
    } catch { return null; }
  },
  async putProgress(progress) {
    const r = await fetch('api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
    return r.ok;
  },
  async leaderboard(limit = 10) {
    try {
      const r = await fetch(`api/leaderboard?limit=${limit}`, { cache: 'no-store' });
      const j = await r.json();
      return j.entries || [];
    } catch { return []; }
  },
};

// Call once at page start: detects the API, restores the session, and merges
// server progress into local storage.
export async function initAuth() {
  await api.check();
  if (api.available) {
    const user = await api.me();
    if (user) {
      const remote = await api.getProgress();
      if (remote) save(mergeProgress(load(), remote));
    }
    return user;
  }
  return null;
}
