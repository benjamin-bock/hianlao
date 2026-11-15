// Shared shell: header, footer, nav, XP/streak pills. Imported by every page.
import { getState, touchStreak, getUser, initAuth } from './store.js';
import { t, LANGS, getLang, setLang, applyTheme, toggleTheme } from './ui.js';
import { VOCAB } from './data/vocab.js';
import { UNITS, LESSON_BY_ID } from './data/units.js';
import { GRAMMAR } from './data/grammar.js';

export const NAV = [
  { page: 'home',    href: 'index.html',   key: 'nav_home',    icon: '🏠' },
  { page: 'learn',   href: 'learn.html',   key: 'nav_learn',   icon: '🧠' },
  { page: 'review',  href: 'review.html',  key: 'nav_review',  icon: '🔁' },
  { page: 'words',   href: 'words.html',   key: 'nav_words',   icon: '💬' },
  { page: 'grammar', href: 'grammar.html', key: 'nav_grammar', icon: '📖' },
  { page: 'culture', href: 'culture.html', key: 'nav_culture', icon: '🇱🇦' },
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

export function getThemeIcon() {
  return document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙';
}

export function renderShell(activePage) {
  applyTheme();
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
        }, t(n.key)))
      ),
      el('div', { class: 'header-stats' },
        el('span', { class: 'pill xp-pill', title: 'XP earned' }, `⚡ ${state.xp}`),
        el('span', { class: 'pill streak-pill', title: 'Daily streak' }, `🔥 ${state.streak}`),
        el('a', { id: 'auth-chip', class: 'pill auth-chip', href: 'account.html', title: 'Account & progress sync' },
          '👤 ', el('span', { class: 'auth-label' }, getUser() ? (getUser().displayName || getUser().username) : t('sign_in'))),
        el('button', { id: 'theme-toggle', class: 'icon-btn', title: 'Toggle dark theme', 'aria-label': 'Toggle dark theme' }, getThemeIcon()),
        el('div', { class: 'lang-switch', role: 'group', 'aria-label': 'Language' },
          Object.entries(LANGS).map(([code, label]) => {
            const b = el('button', { class: `lang-btn${getLang() === code ? ' active' : ''}`, 'data-lang': code }, label);
            b.addEventListener('click', () => setLang(code));
            return b;
          })),
      ),
    );
    header.append(bar);
    // Detect backend + restore session (updates the chip when done).
    initAuth().then(refreshAuthChip).catch(() => {});
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
        NAV.map(n => el('a', { href: n.href }, t(n.key))),
        el('a', { href: 'https://github.com/benjamin-bock/hianlao', target: '_blank', rel: 'noopener' }, 'GitHub ↗')),
      el('p', { class: 'footer-note' }, `MIT licensed · ${VOCAB.length}+ words · ${Object.keys(LESSON_BY_ID).length} lessons · ${GRAMMAR.length} grammar guides · made with ❤️ for `,
        el('span', { class: 'lao' }, 'ຄົນລາວ'), ' worldwide'),
    ));
  }
  // Mobile bottom navigation (shown by CSS below 860px, hidden during lessons).
  const bnav = el('nav', { class: 'bottom-nav', 'aria-label': 'Main menu' },
    NAV.map(n => el('a', {
      href: n.href,
      class: `bn-item${n.page === activePage ? ' active' : ''}`,
      'aria-current': n.page === activePage ? 'page' : null,
    },
      el('span', { class: 'bn-icon', 'aria-hidden': 'true' }, n.icon),
      el('span', { class: 'bn-label' }, t(n.key)))));
  document.body.append(bnav);

  document.body.classList.add(`page-${activePage}`);
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', () => { themeBtn.textContent = getThemeIcon(); toggleTheme(); });
}

// PWA: register the service worker (only over http(s), not file://).
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline dev: fine */ });
}

export function refreshAuthChip() {
  const chip = document.getElementById('auth-chip');
  if (!chip) return;
  const u = getUser();
  chip.innerHTML = '';
  chip.append('👤 ', el('span', { class: 'auth-label' }, u ? (u.displayName || u.username) : t('sign_in')));
  chip.classList.toggle('signed-in', !!u);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
