// Per-letter mastery for /alphabet — the Duolingo-kana model.
//
// Every letter carries a strength level 0–4:
//   0  not introduced yet
//   1  introduced / shaky
//   4  mastered
// Mastery is earned, not given: each letter has a charge counter and needs
// LV_NEED[lv] separate correct answers to reach the next level (2 to be
// introduced, 2 more to solidify, then 3 and 3 — ten correct answers spread
// over several sessions before a bar turns gold). A mistake resets the
// charge and drops one level (never below 1 once introduced).
//
// Strength also decays with neglect (checked when the store loads): 3 days
// without practice caps a letter at level 3, two weeks at level 2 — so
// mastered letters keep coming back through review sessions.
//
// Sessions never dump a whole group at once: a run introduces at most
// NEW_BATCH letters and pads the rest of the session with review questions
// drawn weakest-first from already-introduced letters. Repetition is the
// whole method.

import { ALPHA_GROUPS, type AlphaGroup } from '../data/alphabet.ts';

export const MAX_LV = 4;
/** correct answers needed to go from lv n to n+1 */
export const LV_NEED = [2, 2, 3, 3];
const NEW_BATCH = 3;
const KEY = 'hianlao-alpha-v2';
const LEGACY_KEY = 'hianlao-alpha-v1';
const DAY = 86_400_000;

export interface LetterStat { lv: number; ts: number; ch?: number }
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
        const store: AlphaStore = { letters: parsed.letters, done: parsed.done || {} };
        return decayStore(store);
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

/** Neglect decay: 3 days idle caps at 3, two weeks caps at 2. */
function decayStore(store: AlphaStore): AlphaStore {
  const now = Date.now();
  let changed = false;
  const letters: Record<string, LetterStat> = {};
  for (const [id, s] of Object.entries(store.letters)) {
    const idle = now - (s.ts || 0);
    let lv = s.lv;
    if (idle >= 14 * DAY) lv = Math.min(lv, 2);
    else if (idle >= 3 * DAY) lv = Math.min(lv, 3);
    letters[id] = lv === s.lv ? s : { ...s, lv };
    if (lv !== s.lv) changed = true;
  }
  const next = { letters, done: store.done };
  if (changed) saveStore(next);
  return next;
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

// ---- guided linear path (Duolingo-kana style) ----
// The 9 groups in ALPHA_GROUPS order form the path. A group unlocks only when
// the previous group is fully mastered (every letter at MAX_LV) — or was
// completed under the legacy v1 store — so new letters are always introduced
// in small batches on top of solid ground, never all mixed at once.

export function groupUnlocked(store: AlphaStore, index: number): boolean {
  if (index <= 0) return true;
  const prev = ALPHA_GROUPS[index - 1];
  return groupPercent(store, prev) >= 100 || !!store.done[prev.id];
}

/** First path group that is unlocked but not yet mastered; -1 when the whole path is done. */
export function nextGuidedIndex(store: AlphaStore): number {
  for (let i = 0; i < ALPHA_GROUPS.length; i++) {
    if (!groupUnlocked(store, i)) break; // linear: stop at the first locked node
    if (groupPercent(store, ALPHA_GROUPS[i]) < 100) return i;
  }
  return -1;
}

/** All known-but-not-mastered letters across every group, weakest first. */
function globalWeakPool(store: AlphaStore): Array<{ g: AlphaGroup; n: number; lv: number }> {
  return ALPHA_GROUPS.flatMap((g) =>
    g.letters.map((_, i) => ({
      g,
      n: i + 1,
      lv: letterLevel(store, g.id, i + 1),
      ts: store.letters[letterId(g.id, i + 1)]?.ts || 0,
    })),
  )
    .filter((s) => s.lv >= 1 && s.lv < MAX_LV)
    .sort((a, b) => (a.lv - b.lv) || (a.ts - b.ts));
}

export function totalLetters(): number {
  return ALPHA_GROUPS.reduce((acc, g) => acc + g.letters.length, 0);
}

/** Charge one answer: correct fills the level's gauge, wrong resets + drops. */
export function bumpLetter(store: AlphaStore, gid: string, n: number, right: boolean): AlphaStore {
  const id = letterId(gid, n);
  const cur = store.letters[id] || { lv: 0, ts: 0 };
  let lv = cur.lv;
  let ch = cur.ch || 0;
  if (right) {
    ch += 1;
    if (lv < MAX_LV && ch >= LV_NEED[lv]) {
      lv += 1;
      ch = 0;
    }
    if (lv >= MAX_LV) ch = 0;
  } else {
    lv = Math.max(1, lv - 1);
    ch = 0;
  }
  const next: AlphaStore = { letters: { ...store.letters, [id]: { lv, ts: Date.now(), ch } }, done: store.done };
  saveStore(next);
  return next;
}

export type Dir = 'char' | 'roman';
export interface RunQ { kind: 'q'; gid: string; n: number; dir: Dir; tries: number }
export interface RunWrite { kind: 'write'; gid: string; n: number }
/** assemble two known letters into one syllable (consonant + vowel sign) */
export interface RunMix { kind: 'mix'; cGid: string; cN: number; vGid: string; vN: number; dir: 'mix-read' | 'mix-build'; tries: number }
export interface RunShowcase { kind: 'showcase'; gid: string; n: number }
export type RunStep = RunQ | RunWrite | RunMix | RunShowcase;
export interface Run {
  group: AlphaGroup;
  mixed: boolean;
  /** true when the run introduces new letters (worth +5 XP) */
  hasNew: boolean;
  /** false for mixed runs before any letter is known: don't create lv from nothing */
  bumpable: boolean;
  intro: RunShowcase[];
  /** mixed quiz + handwriting steps, already interleaved by the composer */
  drill: RunStep[];
}

const mkQ = (g: AlphaGroup, n: number, dir?: Dir): RunQ => ({
  kind: 'q', gid: g.id, n,
  dir: dir || (Math.random() < 0.5 ? 'char' : 'roman'),
  tries: 0,
});
const mkW = (g: AlphaGroup, n: number): RunWrite => ({ kind: 'write', gid: g.id, n });
const mkMix = (c: { g: AlphaGroup; n: number }, v: { g: AlphaGroup; n: number }): RunMix => ({
  kind: 'mix', cGid: c.g.id, cN: c.n, vGid: v.g.id, vN: v.n,
  dir: Math.random() < 0.5 ? 'mix-read' : 'mix-build',
  tries: 0,
});

/**
 * Known consonant × known vowel pairs eligible for syllable assembly,
 * weakest letters first — assembly is exactly where revision meets challenge:
 * old letters come back, but now they must work *together*.
 */
export function mixPool(store: AlphaStore): Array<{ c: { g: AlphaGroup; n: number }; v: { g: AlphaGroup; n: number } }> {
  const weak = (kind: 'consonants' | 'vowels') =>
    ALPHA_GROUPS.filter((g) => g.kind === kind)
      .flatMap((g) => g.letters.map((_, i) => ({ g, n: i + 1, lv: letterLevel(store, g.id, i + 1), ts: store.letters[letterId(g.id, i + 1)]?.ts || 0 })))
      .filter((s) => s.lv >= 1)
      .sort((a, b) => (a.lv - b.lv) || (a.ts - b.ts));
  const cons = weak('consonants');
  const vows = weak('vowels');
  const pairs: Array<{ c: { g: AlphaGroup; n: number }; v: { g: AlphaGroup; n: number } }> = [];
  for (const c of cons) for (const v of vows) pairs.push({ c: { g: c.g, n: c.n }, v: { g: v.g, n: v.n } });
  return pairs;
}

/**
 * Turn some review slots of an existing drill into assembly steps, in place.
 * Only letters the learner already knows are converted (never the run's own
 * new letters), and every other eligible slot stays a quiz/write so the
 * classical drilling survives alongside the new mechanic. */
function weaveMixSteps(
  drill: RunStep[],
  pairs: Array<{ c: { g: AlphaGroup; n: number }; v: { g: AlphaGroup; n: number } }>,
  maxSteps = 3,
  keep: Set<string> = new Set(),
): void {
  if (!pairs.length) return;
  let p = 0;
  let used = 0;
  const max = Math.min(pairs.length, maxSteps);
  for (let i = 0; i < drill.length && used < max; i++) {
    const step = drill[i];
    if (step.kind === 'q' || step.kind === 'write') {
      if (keep.has(`${step.gid}-${step.n}`)) continue;
      const pair = pairs[p++ % pairs.length];
      drill[i] = mkMix(pair.c, pair.v);
      used += 1;
      i += 1; // leave the next slot alone: reviews stay quizzes/writes too
    }
  }
}

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
 * A group run, Duolingo-style, on the guided path:
 *  - up to NEW_BATCH unseen letters *of this group* get a showcase card each
 *    (new letters only ever come from the current path node);
 *  - new letters are drilled in INTERLEAVED rounds — qA qB qC wA qA wB qC …
 *    (never AAA BBB CCC) with one extra writing step per letter, so a letter
 *    whose gauge fills faster never blocks the others: every letter is
 *    revisited round by round, earlier ones keep coming back in parallel,
 *    and the next run introduces further letters while these level up;
 *  - review steps are slotted between the rounds, weakest-first from ALL
 *    letters already introduced (any earlier group); weak letters (lv<3)
 *    get a handwriting step instead of a quiz, so writing stays part of
 *    practice at every strength level — progressively less guided (TracePad
 *    derives the assist mode from the live level);
 *  - with nothing new left, the run becomes a pure strengthening session
 *    (up to 10 steps on letters below mastery, quizzes mixed with writes).
 */
export function composeGroupRun(g: AlphaGroup, store: AlphaStore): Run {
  const intro: RunShowcase[] = [];
  const drill: RunStep[] = [];

  const levels = g.letters.map((_, i) => letterLevel(store, g.id, i + 1));
  const newIdx: number[] = [];
  for (let i = 0; i < levels.length && newIdx.length < NEW_BATCH; i++) {
    if (levels[i] === 0) newIdx.push(i + 1);
  }
  const hasNew = newIdx.length > 0;
  const pool = globalWeakPool(store);

  if (hasNew) {
    newIdx.forEach((n) => intro.push({ kind: 'showcase', gid: g.id, n }));
    const review = [...pool];
    let slot = 0;
    // weakest letters get a handwriting step most of the time (never lv≥MAX),
    // quizzes keep the sound/shape side of review alive
    const pushReview = () => {
      const s = review.shift();
      if (!s) return false;
      drill.push(s.lv < 3 || slot % 2 === 1 ? mkW(s.g, s.n) : mkQ(s.g, s.n));
      slot += 1;
      return true;
    };
    const rounds: Array<Dir | undefined> = ['char', 'roman', undefined];
    for (let r = 0; r < rounds.length; r++) {
      for (const n of newIdx) {
        drill.push(mkQ(g, n, rounds[r]));
        if (r === 1) drill.push(mkW(g, n));  // one less-guided write per new letter
      }
      // reviews flow between the rounds, in parallel with the new letters
      pushReview();
      pushReview();
    }
    // top up short runs (e.g. a single late letter) with more review
    while (drill.length < 9 && pushReview()) { /* filled by pushReview */ }
    // syllable assembly: pair the run's NEW letters with already-known letters
    // of the other kind, plus weakest review pairs — new glyphs merge with the
    // learned stock instead of staying isolated single letters
    const pairs = mixPool(store);
    const complement = g.kind === 'consonants'
      ? ALPHA_GROUPS.filter((x) => x.kind === 'vowels').flatMap((x) => groupWeakFirst(x, store).map((n) => ({ g: x, n })).filter((s) => letterLevel(store, s.g.id, s.n) >= 1)).slice(0, 2)
      : ALPHA_GROUPS.filter((x) => x.kind === 'consonants').flatMap((x) => groupWeakFirst(x, store).map((n) => ({ g: x, n })).filter((s) => letterLevel(store, s.g.id, s.n) >= 1)).slice(0, 2);
    const newPairs = complement.flatMap((o) => {
      const cSide = g.kind === 'consonants';
      return newIdx.map((n) => (cSide
        ? { c: { g, n }, v: { g: o.g, n: o.n } }
        : { c: { g: o.g, n: o.n }, v: { g, n } }));
    });
    weaveMixSteps(drill, [...newPairs, ...pairs], 3, new Set(newIdx.map((n) => `${g.id}-${n}`)));
  } else {
    const batch = (pool.length ? pool : g.letters.map((_, i) => ({ g, n: i + 1, lv: 0 }))).slice(0, 10);
    // strengthening session: below-mastery letters alternate writes and quizzes
    shuffle(batch).forEach((s, i) => drill.push(s.lv > 0 && s.lv < MAX_LV && i % 2 === 0 ? mkW(s.g, s.n) : mkQ(s.g, s.n)));
    weaveMixSteps(drill, mixPool(store), 3);
  }

  return { group: g, mixed: false, hasNew, bumpable: true, intro, drill };
}

/**
 * Mixed practice: weakest KNOWN letters across all groups, random direction.
 * Never introduces unknown letters — with an empty store the run is empty
 * (the guided path is the right first step, not a random mix of the script).
 */
export function composeMixedRun(store: AlphaStore, size = 12): Run {
  const known = ALPHA_GROUPS.flatMap((g) =>
    g.letters.map((_, i) => ({ g, n: i + 1, lv: letterLevel(store, g.id, i + 1), ts: store.letters[letterId(g.id, i + 1)]?.ts || 0 })),
  )
    .filter((s) => s.lv >= 1)
    .sort((a, b) => (a.lv - b.lv) || (a.ts - b.ts));
  // every 3rd weakest letter gets a handwriting step instead of a quiz,
  // so mixed practice also revisits the motor memory, at the right assist level
  const drill = shuffle(known.slice(0, size).map((s, i) => (s.lv < 3 && i % 3 === 2 ? mkW(s.g, s.n) : mkQ(s.g, s.n))));
  weaveMixSteps(drill as RunStep[], mixPool(store), 3);
  const group = drill[0] ? (ALPHA_GROUPS.find((g) => g.id === drill[0].gid) || ALPHA_GROUPS[0]) : ALPHA_GROUPS[0];
  return { group, mixed: true, hasNew: false, bumpable: drill.length > 0, intro: [], drill };
}
