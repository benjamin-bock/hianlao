// Sanity checks for HianLao content & assets. Run: node tests/check-data.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { VOCAB, VOCAB_BY_ID, CATEGORIES } from '../assets/js/data/vocab.js';
import { UNITS, LESSON_BY_ID, validateUnits } from '../assets/js/data/units.js';
import { GRAMMAR } from '../assets/js/data/grammar.js';
import { CULTURE } from '../assets/js/data/culture.js';

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
ok(VOCAB.every(v => v.id && v.lao && v.tr && v.en && CATEGORIES[v.cat]), 'every entry has id, lao, tr, en, valid cat');
const hasLao = s => [...String(s)].some(ch => { const c = ch.codePointAt(0); return c >= 0x0E80 && c <= 0x0EFF; });
ok(VOCAB.every(v => hasLao(v.lao)), 'every lao field contains Lao script');
ok(Object.keys(VOCAB_BY_ID).length === VOCAB.length, 'VOCAB_BY_ID consistent');

console.log('Units & lessons:');
ok(UNITS.length === 10, `${UNITS.length} units`);
const lessonCount = Object.keys(LESSON_BY_ID).length;
ok(lessonCount === 30, `${lessonCount} lessons`);
const unitErrors = validateUnits();
ok(unitErrors.length === 0, `validateUnits() clean${unitErrors.length ? ': ' + unitErrors.join('; ') : ''}`);
ok(UNITS.every(u => u.lessons.every(l => l.exercises.length >= 4)), 'every lesson has >=4 exercises');
const types = new Set(UNITS.flatMap(u => u.lessons.flatMap(l => l.exercises.map(e => e.type))));
ok(['mc', 'type', 'match', 'listen', 'tiles', 'speak'].every(t => types.has(t)), `all 6 exercise types used (${[...types].join(', ')})`);

console.log('Grammar & culture:');
ok(GRAMMAR.length >= 14, `${GRAMMAR.length} grammar sections`);
ok(new Set(GRAMMAR.map(g => g.id)).size === GRAMMAR.length, 'grammar ids unique');
ok(CULTURE.length >= 7, `${CULTURE.length} culture sections`);
CULTURE.forEach(c => ok(!c.img || existsSync(join(root, 'assets/img', c.img)), `culture img exists: ${c.img || '(none)'}`));

console.log('Pages & assets:');
const pages = ['index.html', 'learn.html', 'lesson.html', 'words.html', 'grammar.html', 'culture.html', 'account.html'];
for (const p of pages) {
  ok(existsSync(join(root, p)), `${p} exists`);
  const html = readFileSync(join(root, p), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="(assets\/[^"]+|lesson\.html\?id=([^"]+))"/g)];
  for (const m of refs) {
    if (m[2]) { ok(!!LESSON_BY_ID[m[2]], `${p} links to existing lesson id "${m[2]}"`); continue; }
    ok(existsSync(join(root, m[1])), `${p} references existing ${m[1]}`);
  }
}
// every script module referenced by pages parses & its local imports exist
for (const js of ['main.js', 'home.js', 'learn.js', 'lesson.js', 'words.js', 'grammarpage.js', 'culturepage.js', 'store.js', 'speech.js']) {
  const f = join(root, 'assets/js', js);
  ok(existsSync(f), `assets/js/${js} exists`);
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/from '(\.[^']+)'/g)) {
    ok(existsSync(join(root, 'assets/js', m[1])), `${js} imports existing ${m[1]}`);
  }
}

console.log(failures === 0 ? '\nALL CHECKS PASSED ✔' : `\n${failures} CHECK(S) FAILED ✘`);
process.exit(failures === 0 ? 0 : 1);
