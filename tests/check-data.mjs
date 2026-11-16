// Sanity checks for HianLao content & assets (Next.js layout).
// Run: node tests/check-data.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { VOCAB, VOCAB_BY_ID, CATEGORIES } from '../src/data/vocab.ts';
import { UNITS, LESSON_BY_ID, validateUnits } from '../src/data/units.ts';
import { GRAMMAR } from '../src/data/grammar.ts';
import { CULTURE } from '../src/data/culture.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ✔ ${msg}`);
  else { failures++; console.error(`  ✘ ${msg}`); }
};

console.log('Vocabulary:');
ok(VOCAB.length >= 150, `${VOCAB.length} entries (>=150)`);
const ids = VOCAB.map(v => v.id);
ok(new Set(ids).size === ids.length, 'ids are unique');
ok(VOCAB.every(v => v.id && v.lao && v.romanization && v.en && CATEGORIES[v.cat]), 'every entry has id, lao, romanization, en, valid cat');
const hasLao = s => [...String(s)].some(ch => { const c = ch.codePointAt(0); return c >= 0x0E80 && c <= 0x0EFF; });
ok(VOCAB.every(v => hasLao(v.lao)), 'every lao field contains Lao script');
ok(VOCAB.every(v => /[a-z-]/.test(v.romanization)), 'every entry has a karaoke romanization');
ok(Object.keys(VOCAB_BY_ID).length === VOCAB.length, 'VOCAB_BY_ID consistent');

console.log('Alphabet:');
const { ALPHA_GROUPS, ALL_LETTERS } = await import('../src/data/alphabet.ts');
const laos = ALL_LETTERS.map(l => l.lao);
ok(ALPHA_GROUPS.length === 9, `${ALPHA_GROUPS.length} groups (6 consonant + 3 vowel)`);
ok(new Set(laos).size === laos.length, 'letters are unique across groups');
ok(ALL_LETTERS.every(l => hasLao(l.lao)), 'every letter glyph is Lao script');
ok(ALL_LETTERS.filter(l => /^[ກ-ຮ]/.test(l.lao) && l.lao.length === 1).length === 27, '27 single-char consonants present');
ok(ALL_LETTERS.every(l => /^[a-z-]+$/.test(l.roman)), 'every letter has a lowercase karaoke romanization');
ok(ALL_LETTERS.every(l => (l.noteFr ?? '') !== '' ? !!l.note : true), 'a letter with a French note also has an English one');

console.log('Units & lessons:');
ok(UNITS.length === 13, `${UNITS.length} units`);
const lessonCount = Object.keys(LESSON_BY_ID).length;
ok(lessonCount === 39, `${lessonCount} lessons`);
const unitErrors = validateUnits();
ok(unitErrors.length === 0, `validateUnits() clean${unitErrors.length ? ': ' + unitErrors.join('; ') : ''}`);
ok(UNITS.every(u => u.lessons.every(l => l.exercises.length >= 4)), 'every lesson has >=4 exercises');
const types = new Set(UNITS.flatMap(u => u.lessons.flatMap(l => l.exercises.map(e => e.type))));
ok(['mc', 'type', 'match', 'listen', 'tiles', 'speak'].every(t => types.has(t)), `all 6 exercise types used (${[...types].join(', ')})`);
ok(UNITS.every(u => u.titleFr && u.descFr && u.lessons.every(l => l.titleFr && l.blurbFr)), 'every unit & lesson has French fields');
ok(UNITS.flatMap(u => u.lessons.flatMap(l => l.exercises))
  .every(e => e.type !== 'tiles' || (e.enFr && (e.wordRoman?.length ?? 0) === (e.words?.length ?? 0))), 'every tiles exercise has enFr + per-token romanization');

console.log('Grammar & culture:');
ok(GRAMMAR.length >= 14, `${GRAMMAR.length} grammar sections`);
ok(new Set(GRAMMAR.map(g => g.id)).size === GRAMMAR.length, 'grammar ids unique');
ok(GRAMMAR.every(g => g.titleFr && g.blocks.every(b => 'htmlFr' in b || 'enFr' in b || 'headFr' in b || 'itemsFr' in b)), 'every grammar block has French variants');
ok(CULTURE.length >= 7, `${CULTURE.length} culture sections`);
CULTURE.forEach(c => ok(!c.img || existsSync(join(root, 'public/img', c.img)), `culture img exists: ${c.img || '(none)'}`));

console.log('Audio (public/audio + manifest):');
const { AUDIO_FILES } = await import('../src/data/audio-manifest.ts');
const idSet = new Set(ids);
for (const id of AUDIO_FILES) {
  ok(idSet.has(id), `manifest id "${id}" is a vocab id`);
  const f = join(root, 'public/audio', `${id}.mp3`);
  ok(existsSync(f), `audio file exists: public/audio/${id}.mp3`);
}

console.log('PWA & SEO:');
ok(existsSync(join(root, 'public/sw.js')), 'public/sw.js exists');
ok(existsSync(join(root, 'public/manifest.webmanifest')), 'public/manifest.webmanifest exists');
ok(existsSync(join(root, 'public/robots.txt')), 'public/robots.txt exists');
ok(existsSync(join(root, 'public/sitemap.xml')), 'public/sitemap.xml exists');
ok(existsSync(join(root, 'public/img/icon-512.png')), 'app icon exists');
ok(existsSync(join(root, 'app/globals.css')), 'globals.css (design system) exists');
ok(VOCAB.length >= 200, `${VOCAB.length} dictionary entries (>=200)`);

if (failures) {
  console.error(`\n${failures} CHECK(S) FAILED ✘`);
  process.exit(1);
}
console.log('\nDATA CHECKS PASSED ✔');
