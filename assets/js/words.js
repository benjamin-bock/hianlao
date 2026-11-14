import { el, renderShell, speakBtn } from './main.js';
import { t } from './ui.js';
import { VOCAB, CATEGORIES } from './data/vocab.js';

renderShell('words');

const app = document.getElementById('app');
const search = el('input', { class: 'search-input', type: 'search', placeholder: 'Search Lao, transliteration or English… (e.g. "rice", "khao", ຂ້າວ)', autocomplete: 'off' });

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
  chip(`All (${VOCAB.length})`, 'all'),
  ...Object.entries(CATEGORIES).map(([k, label]) => chip(label, k)),
);

search.addEventListener('input', () => { query = search.value; render(); });

function matches(v) {
  if (activeCat !== 'all' && v.cat !== activeCat) return false;
  if (!query) return true;
  const q = query.toLowerCase().trim();
  return v.lao.includes(query.trim()) || v.tr.toLowerCase().includes(q) || v.en.toLowerCase().includes(q);
}

function render() {
  const list = VOCAB.filter(matches);
  count.textContent = `${list.length} word${list.length === 1 ? '' : 's'}${activeCat !== 'all' ? ` in “${CATEGORIES[activeCat]}”` : ''}${query ? ` matching “${query}”` : ''}`;
  grid.innerHTML = '';
  if (!list.length) {
    grid.append(el('div', { class: 'empty card' }, 'No words found. Try another search — or add this word on GitHub! ✏️'));
    return;
  }
  grid.append(...list.map(v => el('div', { class: 'word-card card' },
    el('div', { class: 'word-card-top' },
      el('div', {},
        el('div', { class: 'word-lao lao' }, v.lao),
        el('div', { class: 'word-tr' }, v.tr),
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
  search, chips, count, grid,
);

render();
