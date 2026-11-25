// Syllable assembly — the bridge from single letters to real reading.
//
// Vowels are stored on the ກ carrier (ກາ = "kaa"), so once a learner knows a
// consonant and a vowel syllable, the same vowel sign can be transplanted
// onto that consonant: ຈ (ch) + ກາ (kaa) → ຈາ (chaa). Every combination is
// derived from the existing, hand-checked letter data — nothing is hardcoded —
// and combinations that the karaoke romanization can't express safely
// (the ອ carrier) are skipped.

import { type AlphaLetter } from './alphabet.ts';

const CARRIER = 'ກ';

export interface MixSyllable {
  /** the assembled glyph string, e.g. ຈາ */
  lao: string;
  /** its karaoke sound, e.g. chaa */
  roman: string;
}

/** Assemble consonant + carrier-vowel into a syllable; null when unsafe. */
export function combineMix(c: AlphaLetter, v: AlphaLetter): MixSyllable | null {
  if (c.lao === 'ອ') return null; // silent carrier: ອາ is "aa", not "oa"
  if (!v.roman.startsWith('k')) return null;
  let carriers = 0;
  for (const ch of v.lao) if (ch === CARRIER) carriers += 1;
  if (carriers !== 1) return null;
  return {
    lao: v.lao.replace(CARRIER, c.lao),
    roman: c.roman + v.roman.slice(1),
  };
}

export interface MixOption extends MixSyllable {
  /** the letters the option came from (for styling); null = generated decoy */
  parts?: { c: AlphaLetter; v: AlphaLetter } | null;
}

/**
 * Four distinct options for a mix question: the answer plus three plausible
 * decoys — two other known vowels on the same consonant (so the reader must
 * really look at the vowel sign, not guess the consonant) and one other known
 * consonant carrying the same vowel. Decoys that collide with the answer (or
 * each other) in both directions are filtered out.
 */
export function mixOptions(
  c: AlphaLetter,
  v: AlphaLetter,
  knownConsonants: AlphaLetter[],
  knownVowels: AlphaLetter[],
): MixOption[] {
  const answer = combineMix(c, v);
  if (!answer) return [];
  const out: MixOption[] = [{ ...answer, parts: { c, v } }];
  const seen = new Set([answer.lao]);
  const seenRoman = new Set([answer.roman]);

  const push = (nc: AlphaLetter, nv: AlphaLetter): boolean => {
    if (out.length >= 4) return false;
    const m = combineMix(nc, nv);
    if (!m || seen.has(m.lao) || seenRoman.has(m.roman)) return true;
    seen.add(m.lao);
    seenRoman.add(m.roman);
    out.push({ ...m, parts: { c: nc, v: nv } });
    return true;
  };

  // first: other known vowels on the same consonant, then other consonants
  const otherVowels = knownVowels.filter((x) => x.lao !== v.lao);
  let vi = 0;
  while (out.length < 3 && vi < otherVowels.length) {
    const nv = otherVowels[vi++];
    if (!push(c, nv)) return out;
  }
  const otherConsonants = knownConsonants.filter((x) => x.lao !== c.lao);
  let ci = 0;
  while (out.length < 4 && ci < otherConsonants.length) {
    const nc = otherConsonants[ci++];
    if (!push(nc, v)) return out;
  }
  // top up with whatever else combines (cross-pairs, then stop)
  for (const nc of otherConsonants) {
    if (out.length >= 4) break;
    for (const nv of otherVowels) {
      push(nc, nv);
      if (out.length >= 4) break;
    }
  }
  return out;
}
