// Per-letter mastery for /alphabet — the Duolingo-kana model.
//
// Every letter carries a strength level 0–4:
//   0  not introduced yet
//   1  introduced (showcased once) / shaky
//   4  mastered
// Correct answers raise the level by 1; wrong answers lower it by 1, but a
// letter never drops below 1 once introduced (it stays "seen" and keeps
// coming back through review sessions until it reaches 4).
//
// Sessions never dump a whole group at once: a run introduces at most
// NEW_BATCH letters and pads the rest of the session with review questions
// drawn weakest-first from already-introduced letters. Repetition is the
// whole method.

import { ALPHA_GROUPS, type AlphaGroup } from '@/data/alphabet';

export const MAX_LV = 4;
const NEW_BATCH = 3;
const KEY = 'hianlao-alpha-v2';
const LEGACY_KEY = 'hianlao-alpha-v1';

export interface LetterStat { lv: number; ts: number }
export interface AlphaStore {
  letters: Record<string, LetterStat>;
  /** gid → ts, kept only so v1 progress migrates cleanly */
  done: Record<string, number>;
}

export function letterId(gid: string, n: number): string {
  return `${gid}-${n}`;
}

// 1-based position inside the group — same numbering as the audio files.
export function allLetterIds(g: AlphaGroup): string[] {
  return g.letters.map((_, i) => letterId(g.id, i + 1));
}

export function emptyStore(): AlphaStore {
  return { letters: {}, done: {} };
}

export function loadStore(): AlphaStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AlphaStore;
      if (parsed && typeof parsed === 'object' && parsed.letters) {
        return { letters: parsed.letters, done: parsed.done || {} };
      }
    }
    // migrate v1 ({ done: {gid: ts} }): keep the work, mark letters "seen"
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null') as { done?: Record<string, number> } | null;
    if (legacy?.done) {
      const letters: Record<string, LetterStat> = {};
      for (const g of ALPHA_GROUPS) {
        if (!legacy.done[g.id]) continue;
        g.letters.forEach((_, i) => {
          const id = letterId(g.id, i + 1);
          letters[id] = { lv: 1, ts: legacy.done?.[g.id] || 0 };
        });
      }
      const store: AlphaStore = { letters, done: { ...legacy.done } };
      saveStore(store);
      return store;
    }
  } catch { /* private mode / corrupt */ }
  return emptyStore();
}

export function saveStore(store: AlphaStore) {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* private mode */ }
}

/** Level of a letter: 0 when never seen. */
export function letterLevel(store: AlphaStore, gid: string, n: number): number {
  return store.letters[letterId(gid, n)]?.lv || 0;
}

/** 0–100: share of the group's total strength (each letter worth MAX_LV). */
export function groupPercent(store: AlphaStore, g: AlphaGroup): number {
  const ids = allLetterIds(g);
  const sum = ids.reduce((acc, id) => acc + Math.min(store.letters[id]?.lv || 0, MAX_LV), 0);
  return Math.round((100 * sum) / (ids.length * MAX_LV));
}

/** How many letters the learner has at least met (lv ≥ 1). */
export function knownCount(store: AlphaStore): number {
  return Object.values(store.letters).filter((s) => s.lv >= 1).length;
}

export function totalLetters(): number {
  return ALPHA_GROUPS.reduce((acc, g) => acc + g.letters.length, 0);
}

/** Raise/lower one letter and persist. */
export function bumpLetter(store: AlphaStore, gid: string, n: number, right: boolean): AlphaStore {
  const id = letterId(gid, n);
  const cur = store.letters[id]?.lv || 0;
  const lv = right ? Math.min(MAX_LV, cur + 1) : Math.max(1, cur - 1);
  const next: AlphaStore = { letters: { ...store.letters, [id]: { lv, ts: Date.now() } }, done: store.done };
  saveStore(next);
  return next;
}

export type Dir = 'char' | 'roman';
export interface RunQ { kind: 'q'; gid: string; n: number; dir: Dir; tries: number }
export interface RunShowcase { kind: 'showcase'; gid: string; n: number }
export type RunStep = RunQ | RunShowcase;
export interface Run {
  group: AlphaGroup;
  mixed: boolean;
  /** true when the run introduces new letters (worth +5 XP) */
  hasNew: boolean;
  /** false for mixed runs before any letter is known: don't create lv from nothing */
  bumpable: boolean;
  intro: RunShowcase[];
  drill: RunQ[];
}

const mkQ = (g: AlphaGroup, n: number, dir?: Dir): RunQ => ({
  kind: 'q', gid: g.id, n,
  dir: dir || (Math.random() < 0.5 ? 'char' : 'roman'),
  tries: 0,
});

/** letters of a group, weakest (lowest level, least recent) first */
export function groupWeakFirst(g: AlphaGroup, store: AlphaStore): number[] {
  return g.letters.map((_, i) => i + 1)
    .map((n) => ({ n, lv: letterLevel(store, g.id, n), ts: store.letters[letterId(g.id, n)]?.ts || 0 }))
    .sort((a, b) => (a.lv - b.lv) || (a.ts - b.ts))
    .map((s) => s.n);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * A group run, Duolingo-style:
 *  - up to NEW_BATCH unseen letters get a showcase card each;
 *  - each new letter is drilled 3× right away (shape→sound, sound→shape, mixed);
 *  - one review question from the group's weakest known letters is slotted
 *    after each new letter's batch, so old letters keep being strengthened;
 *  - with nothing new left, the run becomes a pure strengthening session
 *    (up to 10 questions on the letters below mastery).
 */
export function composeGroupRun(g: AlphaGroup, store: AlphaStore): Run {
  const intro: RunShowcase[] = [];
  const drill: RunQ[] = [];

  const levels = g.letters.map((_, i) => letterLevel(store, g.id, i + 1));
  const newIdx: number[] = [];
  for (let i = 0; i < levels.length && newIdx.length < NEW_BATCH; i++) {
    if (levels[i] === 0) newIdx.push(i + 1);
  }
  const hasNew = newIdx.length > 0;
  const weak = groupWeakFirst(g, store).filter((n) => {
    const lv = letterLevel(store, g.id, n);
    return lv >= 1 && lv < MAX_LV;
  });

  if (hasNew) {
    newIdx.forEach((n) => intro.push({ kind: 'showcase', gid: g.id, n }));
    const pool = [...weak];
    for (const n of newIdx) {
      drill.push(mkQ(g, n, 'char'), mkQ(g, n, 'roman'), mkQ(g, n));
      for (let k = 0; k < 2 && pool.length; k++) drill.push(mkQ(g, pool.shift()!));
    }
    // top up short runs (e.g. a single late letter) with more review
    while (drill.length < 9 && pool.length) drill.push(mkQ(g, pool.shift()!));
  } else {
    const batch = (weak.length ? weak : g.letters.map((_, i) => i + 1)).slice(0, 10);
    for (const n of shuffle(batch)) drill.push(mkQ(g, n));
  }

  return { group: g, mixed: false, hasNew, bumpable: true, intro, drill };
}

/** Mixed practice: weakest known letters across all groups, random direction. */
export function composeMixedRun(store: AlphaStore, size = 12): Run {
  const pool = ALPHA_GROUPS.flatMap((g) =>
    g.letters.map((_, i) => ({ g, n: i + 1, lv: letterLevel(store, g.id, i + 1), ts: store.letters[letterId(g.id, i + 1)]?.ts || 0 })),
  );
  const known = pool.filter((s) => s.lv >= 1).sort((a, b) => (a.lv - b.lv) || (a.ts - b.ts));
  const source = known.length ? known : shuffle(pool);
  const first = source.slice(0, size);
  const drill = shuffle(first.map((s) => mkQ(s.g, s.n)));
  const group = drill[0] ? (ALPHA_GROUPS.find((g) => g.id === drill[0].gid) || ALPHA_GROUPS[0]) : ALPHA_GROUPS[0];
  return { group, mixed: true, hasNew: false, bumpable: known.length > 0, intro: [], drill };
}
