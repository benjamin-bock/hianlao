import { el, renderShell } from './main.js';
import { t, pf } from './ui.js';
import { GRAMMAR } from './data/grammar.js';

renderShell('grammar');

const app = document.getElementById('app');

const toc = el('nav', { class: 'toc' });
const content = el('div', { class: 'doc-content' });

function wrapLao(text) {
  let out = '', buf = '', inLao = null;
  for (const ch of String(text)) {
    const c = ch.codePointAt(0);
    const lao = c >= 0x0E80 && c <= 0x0EFF;
    if (inLao !== null && lao !== inLao) { out += inLao ? `<span class="lao">${buf}</span>` : buf; buf = ''; }
    inLao = lao; buf += ch;
  }
  if (buf) out += inLao ? `<span class="lao">${buf}</span>` : buf;
  return out;
}

function renderBlock(b) {
  switch (b.t) {
    case 'p': return el('p', { html: pf(b, 'html') });
    case 'ex': return el('div', { class: 'ex-row' },
      el('span', { class: 'lao ex-lao' }, b.lao),
      el('span', { class: 'ex-romanization' }, b.romanization),
      el('span', { class: 'ex-en' }, pf(b, 'en')));
    case 'table': return el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, pf(b, 'head').map(h => el('th', {}, h)))),
      el('tbody', {}, pf(b, 'rows').map(r => el('tr', {}, r.map(c => el('td', { html: wrapLao(c) }))))),
    ));
    case 'list': return el('ul', { class: 'doc-list' }, pf(b, 'items').map(i => el('li', { html: i })));
    case 'note': return el('div', { class: 'note-box', html: pf(b, 'html') });
    default: return null;
  }
}

GRAMMAR.forEach((g, i) => {
  const gtitle = pf(g, 'title');
  const link = el('a', { href: `#g-${g.id}`, class: 'toc-link' }, `${g.icon} ${gtitle}`);
  toc.append(link);
  const section = el('section', { class: 'doc-section card', id: `g-${g.id}` },
    el('h2', {}, `${g.icon} ${gtitle}`),
    g.blocks.map(renderBlock),
  );
  content.append(section);
  void i;
});

app.append(
  el('div', { class: 'page-head' },
    el('h1', {}, t('grammar_title')),
    el('p', { class: 'section-sub' }, t('grammar_sub'))),
  el('div', { class: 'doc-layout' }, el('aside', { class: 'doc-aside' }, el('div', { class: 'toc-sticky' }, el('strong', {}, t('grammar_toc')), toc)), content),
);
