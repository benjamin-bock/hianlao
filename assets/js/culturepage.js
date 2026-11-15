import { el, renderShell } from './main.js';
import { t, pf } from './ui.js';
import { CULTURE } from './data/culture.js';

renderShell('culture');

const app = document.getElementById('app');

function renderBlock(b) {
  switch (b.t) {
    case 'p': return el('p', { html: pf(b, 'html') });
    case 'ex': return el('div', { class: 'ex-row' },
      el('span', { class: 'lao ex-lao' }, b.lao),
      el('span', { class: 'ex-romanization' }, b.romanization),
      el('span', { class: 'ex-en' }, pf(b, 'en')));
    case 'list': return el('ul', { class: 'doc-list' }, pf(b, 'items').map(i => el('li', { html: i })));
    case 'note': return el('div', { class: 'note-box', html: pf(b, 'html') });
    default: return null;
  }
}

app.append(el('div', { class: 'page-head' },
  el('h1', {}, t('culture_title')),
  el('p', { class: 'section-sub', html: t('culture_sub') }),
));

CULTURE.forEach(c => {
  const ctitle = pf(c, 'title');
  app.append(el('section', { class: 'doc-section card culture-section', id: `c-${c.id}` },
    c.img ? el('img', { class: 'culture-img', src: `assets/img/${c.img}`, alt: ctitle, loading: 'lazy' }) : null,
    el('h2', {}, `${c.icon} ${ctitle}`),
    c.blocks.map(renderBlock),
  ));
});
