import { el, renderShell, speakBtn } from './main.js';
import { t } from './ui.js';
import { VOCAB, VOCAB_BY_ID, CATEGORIES } from './data/vocab.js';
import { getWeakWords } from './store.js';

renderShell('words');

const app = document.getElementById('app');
const search = el('input', { class: 'search-input', type: 'search', placeholder: t('words_search'), autocomplete: 'off' });

const chips = el('div', { class: 'chips' });
const grid = el('div', { class: 'word-grid' });
const count = el('p', { class: 'muted count-line' });

let activeCat = 'all';
let query = '';

function chip(label, key) {
  const c = el('button', { class: `chip${activeCat === key ? ' active' : ''}` }, label);
  c.addEventListener('click', () => {
    activeCat = key;
    chips.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    render();
  });
  return c;
}

chips.append(
  chip(t('words_all').replace('{x}', VOCAB.length), 'all'),
  ...Object.entries(CATEGORIES).map(([k, label]) => chip(label, k)),
);

search.addEventListener('input', () => { query = search.value; render(); });

function matches(v) {
  if (activeCat !== 'all' && v.cat !== activeCat) return false;
  if (!query) return true;
  const q = query.toLowerCase().trim();
  return v.lao.includes(query.trim()) || v.romanization.toLowerCase().includes(q) || v.en.toLowerCase().includes(q);
}

function render() {
  const list = VOCAB.filter(matches);
  const base = list.length === 1 ? t('words_count_one') : t('words_count_many');
  let line = base.replace('{x}', list.length);
  if (activeCat !== 'all') line += t('words_in').replace('{y}', CATEGORIES[activeCat]);
  if (query) line += t('words_matching').replace('{y}', query);
  count.textContent = line;
  grid.innerHTML = '';
  if (!list.length) {
    grid.append(el('div', { class: 'empty card' }, t('words_empty')));
    return;
  }
  grid.append(...list.map(v => el('div', { class: 'word-card card' },
    el('div', { class: 'word-card-top' },
      el('div', {},
        el('div', { class: 'word-lao lao' }, v.lao),
        el('div', { class: 'word-romanization' }, v.romanization),
        el('div', { class: 'word-en' }, v.en)),
      speakBtn(v)),
    v.note ? el('div', { class: 'word-note' }, v.note) : null,
    el('div', { class: 'word-cat' }, CATEGORIES[v.cat] || v.cat),
  )));
}

app.append(
  el('div', { class: 'page-head' },
    el('h1', {}, t('words_title')),
    el('p', { class: 'section-sub' }, t('words_sub'))),
  weakSection(),
  search, chips, count, grid,
);

// Words you missed in lessons — the mistake notebook feeds the drill.
function weakSection() {
  const weak = getWeakWords().filter(w => VOCAB_BY_ID[w.id]).slice(0, 12);
  if (!weak.length) return null;
  return el('section', { class: 'unit-section' },
    el('h2', {}, `🎯 ${t('weak_title')} (${weak.length})`),
    el('p', { class: 'section-sub' }, t('weak_sub')),
    el('div', { class: 'word-grid' }, weak.map(w => {
      const v = VOCAB_BY_ID[w.id];
      return el('div', { class: 'word-card card weak-word-card' },
        el('div', { class: 'word-card-top' },
          el('div', {},
            el('div', { class: 'word-lao lao' }, v.lao),
            el('div', { class: 'word-romanization' }, v.romanization),
            el('div', { class: 'word-en' }, v.en)),
          speakBtn(v)),
        el('div', { class: 'weak-count' }, `🔥 ×${w.n}`),
        v.note ? el('div', { class: 'word-note' }, v.note) : null);
    })),
    el('a', { class: 'btn btn-primary weak-drill', href: 'lesson.html?id=__weak' }, `⚡ ${t('weak_practice')}`),
  );
}

render();
