// Shared shell: header, footer, nav, XP/streak pills. Imported by every page.
import { getState, touchStreak } from './store.js';
import { VOCAB } from './data/vocab.js';
import { UNITS, LESSON_BY_ID } from './data/units.js';
import { GRAMMAR } from './data/grammar.js';

export const NAV = [
  { page: 'home',    href: 'index.html',   label: 'Home' },
  { page: 'learn',   href: 'learn.html',   label: 'Learn' },
  { page: 'words',   href: 'words.html',   label: 'Words' },
  { page: 'grammar', href: 'grammar.html', label: 'Grammar' },
  { page: 'culture', href: 'culture.html', label: 'Culture' },
];

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

export function laoSpan(text, cls = 'lao') {
  return el('span', { class: cls }, text);
}

export function speakBtn(item, { size = '' } = {}) {
  // Lazy import to avoid a cycle at module load.
  const btn = el('button', { class: `icon-btn speak-btn ${size}`, title: 'Listen', 'aria-label': 'Listen' }, '🔊');
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const { speakItem } = await import('./speech.js');
    btn.classList.add('playing');
    await speakItem(item);
    btn.classList.remove('playing');
  });
  return btn;
}

export function renderShell(activePage) {
  const state = touchStreak();
  const header = document.getElementById('header');
  const footer = document.getElementById('footer');
  if (header) {
    header.innerHTML = '';
    const bar = el('div', { class: 'header-inner' },
      el('a', { class: 'brand', href: 'index.html' },
        el('img', { src: 'assets/img/logo.svg', alt: 'HianLao', class: 'brand-logo' }),
        el('span', { class: 'brand-name' }, 'HianLao'),
        el('span', { class: 'brand-lao lao' }, 'ເຣີຢນລາວ'),
      ),
      el('nav', { class: 'nav' },
        NAV.map(n => el('a', {
          href: n.href,
          class: `nav-link${n.page === activePage ? ' active' : ''}`,
        }, n.label))
      ),
      el('div', { class: 'header-stats' },
        el('span', { class: 'pill xp-pill', title: 'XP earned' }, `⚡ ${state.xp}`),
        el('span', { class: 'pill streak-pill', title: 'Daily streak' }, `🔥 ${state.streak}`),
      ),
    );
    header.append(bar);
  }
  if (footer) {
    footer.innerHTML = '';
    footer.append(el('div', { class: 'footer-inner' },
      el('div', { class: 'footer-brand' },
        el('img', { src: 'assets/img/logo.svg', alt: '', class: 'brand-logo small' }),
        el('div', {},
          el('strong', {}, 'HianLao'),
          el('p', {}, 'Free & open-source Lao learning for the diaspora, everywhere. ',
            el('span', { class: 'lao' }, 'ເຣີຢນພາສາລາວ ຟຣີ — for everyone.')))),
      el('div', { class: 'footer-links' },
        NAV.map(n => el('a', { href: n.href }, n.label)),
        el('a', { href: 'https://github.com/benjamin-bock/hianlao', target: '_blank', rel: 'noopener' }, 'GitHub ↗')),
      el('p', { class: 'footer-note' }, `MIT licensed · ${VOCAB.length}+ words · ${Object.keys(LESSON_BY_ID).length} lessons · ${GRAMMAR.length} grammar guides · made with ❤️ for <span class="lao">ຄນລາວ</span> worldwide`),
    ));
  }
  document.body.classList.add(`page-${activePage}`);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
