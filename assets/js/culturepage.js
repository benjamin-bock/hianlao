import { el, renderShell } from './main.js';
import { CULTURE } from './data/culture.js';

renderShell('culture');

const app = document.getElementById('app');

function renderBlock(b) {
  switch (b.t) {
    case 'p': return el('p', { html: b.html });
    case 'ex': return el('div', { class: 'ex-row' },
      el('span', { class: 'lao ex-lao' }, b.lao),
      el('span', { class: 'ex-tr' }, b.tr),
      el('span', { class: 'ex-en' }, b.en));
    case 'list': return el('ul', { class: 'doc-list' }, b.items.map(i => el('li', { html: i })));
    case 'note': return el('div', { class: 'note-box', html: b.html });
    default: return null;
  }
}

app.append(el('div', { class: 'page-head' },
  el('h1', {}, 'Lao culture 🇱🇦'),
  el('p', { class: 'section-sub' }, 'The stories behind the language: the land, the festivals, the food, the etiquette — and why the diaspora keeps Lao alive. <span class="lao">ວັດນຘຣຣມລາວ</span>.'),
));

CULTURE.forEach(c => {
  app.append(el('section', { class: 'doc-section card culture-section', id: `c-${c.id}` },
    c.img ? el('img', { class: 'culture-img', src: `assets/img/${c.img}`, alt: c.title, loading: 'lazy' }) : null,
    el('h2', {}, `${c.icon} ${c.title}`),
    c.blocks.map(renderBlock),
  ));
});
