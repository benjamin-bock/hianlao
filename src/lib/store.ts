// HianLao progress store (client).
// Source of truth: the server (/api/progress) when signed in and the API is
// available; otherwise localStorage. The site always works without a backend.
// Storage key inherited from the legacy site so existing users keep progress.
'use client';

const KEY = 'hianlao-v1';

export interface ReviewEntry { due: number; iv: number }
export interface WeakEntry { n: number; at: number }

export interface Progress {
  xp: number;
  done: Record<string, number>;
  streak: number;
  lastVisit: string | null;
  goal: number;
  xpToday: number;
  today: string | null;
  reviews: Record<string, ReviewEntry>;
  weakWords?: Record<string, WeakEntry>;
}

export interface ApiUser {
  id: number;
  username: string;
  displayName?: string | null;
}

const defaults = (): Progress => ({
  xp: 0, done: {}, streak: 0, lastVisit: null, goal: 20, xpToday: 0, today: null, reviews: {},
});

export function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults(), ...(JSON.parse(raw) as Progress) } : defaults();
  } catch {
    return defaults();
  }
}

export function save(state: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode etc. */ }
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function getState(): Progress { return load(); }

export function mergeProgress(a: Progress, b: Progress): Progress {
  const reviews: Record<string, ReviewEntry> = { ...(a.reviews || {}) };
  for (const [k, v] of Object.entries(b.reviews || {})) {
    if (!reviews[k] || reviews[k].due < v.due) reviews[k] = v;
  }
  return {
    xp: Math.max(a.xp || 0, b.xp || 0),
    done: { ...(a.done || {}), ...(b.done || {}) },
    streak: Math.max(a.streak || 0, b.streak || 0),
    lastVisit: [a.lastVisit, b.lastVisit].filter(Boolean).sort().pop() || null,
    goal: (b.goal >= 10 && b.goal <= 500) ? b.goal : (a.goal || 20),
    xpToday: Math.max(a.xpToday || 0, b.xpToday || 0),
    today: a.today || b.today || null,
    reviews,
  };
}

let currentUser: ApiUser | null = null;
let putTimer: ReturnType<typeof setTimeout> | null = null;

// Push local state to the server right away (used for tab-close flushes,
// reconnects, and healing previously failed syncs).
export async function pushNow(): Promise<boolean> {
  if (!currentUser || !api.available) return false;
  if (putTimer) { clearTimeout(putTimer); putTimer = null; }
  try {
    return await api.putProgress(load());
  } catch {
    return false; // offline: stays in localStorage, retried on the next change or reconnect
  }
}

async function putSoon() {
  if (!currentUser || !api.available) return;
  if (putTimer) clearTimeout(putTimer);
  putTimer = setTimeout(() => {
    putTimer = null;
    void pushNow();
  }, 600);
}

if (typeof window !== 'undefined') {
  // Closing or backgrounding the tab right after a lesson must not lose the
  // pending save, and coming back online should push what failed while offline.
  window.addEventListener('pagehide', () => { void pushNow(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void pushNow();
  });
  window.addEventListener('online', () => { void pushNow(); });
}

export async function addXp(n: number): Promise<number> {
  const s = load();
  s.xp += n;
  const today = todayStr();
  if (s.today !== today) { s.today = today; s.xpToday = 0; }
  s.xpToday = (s.xpToday || 0) + n;
  save(s);
  await putSoon();
  return s.xp;
}

export async function markDone(lessonId: string) {
  const s = load();
  s.done[lessonId] = Date.now();
  save(s);
  await putSoon();
}

export function isDone(lessonId: string): boolean { return !!load().done[lessonId]; }

export function totalDone(): number { return Object.keys(load().done).length; }

// Call once per page visit: updates the daily streak.
export function touchStreak(): Progress {
  const s = load();
  const today = todayStr();
  if (s.today !== today) { s.today = today; s.xpToday = 0; }
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

// ---- daily goal ----
export function setGoal(g: number): number {
  const s = load();
  s.goal = Math.min(500, Math.max(10, Math.round(g) || 20));
  save(s);
  putSoon();
  return s.goal;
}

// ---- spaced-repetition review queue (per lesson) ----
export function scheduleReview(lessonId: string) {
  const s = load();
  const prev = s.reviews?.[lessonId];
  const iv = Math.min(30, (prev?.iv || 1) * 2); // 1d -> 2d -> 4d ... capped at 30d
  s.reviews = { ...(s.reviews || {}), [lessonId]: { due: Date.now() + iv * 86400000, iv } };
  save(s);
  putSoon();
}

// Lesson had mistakes: reset it to due tomorrow (repetition beats pride).
export function scheduleWeakReview(lessonId: string) {
  const s = load();
  s.reviews = { ...(s.reviews || {}), [lessonId]: { due: Date.now() + 86400000, iv: 1 } };
  save(s);
  putSoon();
}

// ---- word-level mistake notebook (feeds the tricky-words drill) ----
export function addWeakWord(id: string) {
  if (!id) return;
  const s = load();
  s.weakWords = { ...(s.weakWords || {}) };
  const prev = s.weakWords[id];
  s.weakWords[id] = { n: (prev?.n || 0) + 1, at: Date.now() };
  save(s);
  putSoon();
}

// Answered right in a drill or practice: loosen the grip, drop at zero.
export function relieveWeakWord(id: string) {
  if (!id) return;
  const s = load();
  const w = s.weakWords?.[id];
  if (!w) return;
  if (w.n <= 1) {
    const { [id]: _drop, ...rest } = s.weakWords!;
    s.weakWords = rest;
  } else {
    s.weakWords = { ...s.weakWords, [id]: { ...w, n: w.n - 1 } };
  }
  save(s);
  putSoon();
}

export function getWeakWords(): Array<{ id: string } & WeakEntry> {
  const s = load();
  return Object.entries(s.weakWords || {})
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.n - a.n || b.at - a.at);
}

export function getDueReviews(): Array<{ id: string } & ReviewEntry> {
  const s = load();
  const now = Date.now();
  return Object.entries(s.reviews || {})
    .filter(([, v]) => v.due <= now)
    .map(([id, v]) => ({ id, ...v }));
}

export function getUpcomingReviews(): Array<{ id: string } & ReviewEntry> {
  const s = load();
  const now = Date.now();
  return Object.entries(s.reviews || {})
    .filter(([, v]) => v.due > now)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => a.due - b.due);
}

export function getUser(): ApiUser | null { return currentUser; }

// ---- API layer (same origin /api; degrades to localStorage) ----
export const api = {
  available: false,
  async check(): Promise<boolean> {
    try {
      const r = await fetch('/api/health', { cache: 'no-store' });
      if (!r.ok) throw new Error('no api');
      const j = await r.json();
      this.available = !!j.ok;
    } catch {
      this.available = false;
    }
    return this.available;
  },
  async _post(path: string, payload: unknown): Promise<{ status: number; ok?: boolean; user?: ApiUser; progress?: Progress; error?: string }> {
    const r = await fetch(`/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: r.status, ...j } as { status: number } & Record<string, never>;
  },
  async register(username: string, password: string, displayName: string) {
    const r = await this._post('auth/register', { username, password, displayName, localProgress: load() });
    if (r.ok && r.user) { currentUser = r.user; if (r.progress) save(r.progress); }
    return r;
  },
  async login(username: string, password: string) {
    const r = await this._post('auth/login', { username, password, localProgress: load() });
    if (r.ok && r.user) { currentUser = r.user; if (r.progress) save(r.progress); }
    return r;
  },
  async logout() {
    await this._post('auth/logout', {});
    currentUser = null;
  },
  async me(): Promise<ApiUser | null> {
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' });
      const j = await r.json();
      if (j.ok && j.user) {
        currentUser = j.user;
        if (j.progress) { save(mergeProgress(load(), j.progress)); }
        return j.user;
      }
    } catch { /* offline */ }
    return null;
  },
  async getProgress(): Promise<Progress | null> {
    try {
      const r = await fetch('/api/progress', { cache: 'no-store' });
      if (r.status === 401) return null;
      const j = await r.json();
      return j.progress || null;
    } catch { return null; }
  },
  async putProgress(progress: Progress): Promise<boolean> {
    const r = await fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
      keepalive: true,
    });
    return r.ok;
  },
  async leaderboard(limit = 10, period = 'all'): Promise<Array<{ username: string; displayName?: string; xp: number }>> {
    try {
      const r = await fetch(`/api/leaderboard?limit=${limit}&period=${period}`, { cache: 'no-store' });
      const j = await r.json();
      return j.entries || [];
    } catch { return []; }
  },
};

// Call once at page start: detects the API, restores the session, and merges
// server progress into local storage.
export async function initAuth(): Promise<ApiUser | null> {
  await api.check();
  if (api.available) {
    const user = await api.me();
    if (user) {
      const remote = await api.getProgress();
      if (remote) save(mergeProgress(load(), remote));
      // Heal syncs that failed earlier (offline save, tab closed mid-push).
      void pushNow();
    }
    return user;
  }
  return null;
}
