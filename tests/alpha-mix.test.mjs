// Unit tests for syllable assembly (src/data/alpha-mix.ts) and its weave
// into the alphabet runs (src/lib/alpha-progress.ts) — the kana-style
// "old letters team up with new ones" mechanic.
import { ALPHA_GROUPS, CONSONANT_GROUPS, VOWEL_GROUPS } from '../src/data/alphabet.ts';
import { combineMix, mixOptions } from '../src/data/alpha-mix.ts';
import {
  MAX_LV, allLetterIds, letterLevel, bumpLetter, composeGroupRun, composeMixedRun,
} from '../src/lib/alpha-progress.ts';

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ✔ ${msg}`);
  else { failures++; console.error(`  ✘ ${msg}`); }
};

const byLao = (lao) => {
  for (const g of ALPHA_GROUPS) for (const l of g.letters) if (l.lao === lao) return l;
  return undefined;
};
const ch = byLao('ຈ');      // ch
const ng = byLao('ງ');      // ng
const kaa = byLao('ກາ');    // kaa
const kor = byLao('ກອ');    // kor

console.log('Syllable assembly (consonant + carrier vowel):');
ok(!!ch && !!ng && !!kaa && !!kor, 'test letters exist in the data');
const kam = combineMix(byLao('ມ'), byLao('ກາມ'));
ok(kam && kam.lao === 'ມາມ' && kam.roman === 'mam', `ມ + ກາມ (kam) → ມາມ "mam" (got ${kam ? `${kam.lao} "${kam.roman}"` : 'null'})`);
const chaa = combineMix(ch, kaa);
ok(chaa && chaa.lao === 'ຈາ' && chaa.roman === 'chaa', `ຈ (ch) + ກາ (kaa) → ຈາ "chaa" (got ${chaa ? `${chaa.lao} "${chaa.roman}"` : 'null'})`);
const ngor = combineMix(ng, kor);
ok(ngor && ngor.lao === 'ງອ' && ngor.roman === 'ngor', `ງ (ng) + ກອ (kor) → ງອ "ngor"`);
ok(combineMix(byLao('ອ'), kaa) === null, 'ອ (silent carrier) never combines');
const kee = combineMix(byLao('ກ'), byLao('ເກ'));
ok(kee && kee.lao === 'ເກ' && kee.roman === 'ke', `preposed vowel sign: ກ + ເກ → ເກ "ke"`);

console.log('Mix options — plausible, unique, solvable:');
const cons = CONSONANT_GROUPS.flatMap((g) => g.letters);
const vows = VOWEL_GROUPS.flatMap((g) => g.letters);
const opts = mixOptions(byLao('ນ'), byLao('ກາ'), cons, vows);
ok(opts.length === 4, `exactly 4 options (got ${opts.length})`);
ok(opts.some((o) => o.lao === 'ນາ'), 'the answer (ນາ) is among the options');
ok(new Set(opts.map((o) => o.lao)).size === opts.length, 'all glyph options are distinct');
ok(new Set(opts.map((o) => o.roman)).size === opts.length, 'all sound options are distinct');
ok(opts.filter((o) => o.roman.startsWith('n')).length >= 2, 'decoys reuse the same consonant (the vowel sign must be read)');

console.log('Runs weave assembly steps in once both sides are known:');
// c1 consonants known (weak) + v1 vowels known (weak)
let store = { letters: {}, done: {} };
for (const g of [CONSONANT_GROUPS[0], VOWEL_GROUPS[0]]) {
  for (const id of allLetterIds(g)) {
    const n = Number(id.split('-')[1]);
    // two correct answers: lv 0 → 1 (the "introduced" threshold)
    store = bumpLetter(store, g.id, n, true);
    store = bumpLetter(store, g.id, n, true);
  }
}
const knownLV = (g, i) => letterLevel(store, g.id, i + 1);
const runV2 = composeGroupRun(VOWEL_GROUPS[1], store);
const mixes = runV2.drill.filter((s) => s.kind === 'mix');
ok(mixes.length > 0, 'a run with known consonants includes assembly steps (new vowels stay quiz-drilled)');
const NEW_V = new Set(runV2.intro.map((s) => `${s.gid}-${s.n}`));
ok(mixes.every((m) => letterLevel(store, m.cGid, m.cN) >= 1
  && (letterLevel(store, m.vGid, m.vN) >= 1 || NEW_V.has(`${m.vGid}-${m.vN}`))),
  'assembly pairs a known consonant with a known or just-introduced vowel');
const newVowels = runV2.drill.filter((s) => s.kind === 'q' && s.gid === VOWEL_GROUPS[1].id);
ok(newVowels.length >= 3, 'the run\'s own new letters keep their full quiz drill (assembly replaces only review slots)');

const mixed = composeMixedRun(store);
const mixedMix = mixed.drill.filter((s) => s.kind === 'mix');
ok(mixedMix.length >= 1, 'mixed practice also assembles syllables once vowels are known');
const everyKnown = mixed.drill.every((s) => {
  if (s.kind === 'mix') return letterLevel(store, s.cGid, s.cN) >= 1 && letterLevel(store, s.vGid, s.vN) >= 1;
  return letterLevel(store, s.gid, s.n) >= 1;
});
ok(everyKnown, 'every step of mixed practice references known letters only');

const fresh = composeGroupRun(CONSONANT_GROUPS[0], { letters: {}, done: {} });
ok(fresh.drill.every((s) => s.kind !== 'mix'), 'a fresh learner never gets assembly steps (nothing to assemble yet)');

if (failures) {
  console.error(`\n${failures} CHECK(S) FAILED ✘`);
  process.exit(1);
}
console.log('\nALPHA MIX TESTS PASSED ✔');
