import { el, renderShell, speakBtn } from './main.js';
import { t } from './ui.js';
import { getState, totalDone } from './store.js';
import { VOCAB_BY_ID } from './data/vocab.js';
import { VOCAB } from './data/vocab.js';
import { UNITS, LESSON_BY_ID } from './data/units.js';
import { GRAMMAR } from './data/grammar.js';
import { CULTURE } from './data/culture.js';

renderShell('home');

const state = getState();
const lessonsTotal = Object.keys(LESSON_BY_ID).length;

const hero = el('section', { class: 'hero' },
  el('div', { class: 'hero-text' },
    el('p', { class: 'hero-kicker' }, t('hero_kicker')),
    el('h1', { html: t('home_hero_title') }),
    el('p', { class: 'hero-sub', html: t('hero_sub') }),
    el('div', { class: 'hero-ctas' },
      el('a', { class: 'btn btn-primary btn-lg', href: state.xp > 0 || totalDone() > 0 ? 'learn.html' : 'lesson.html?id=u1l1' },
        totalDone() > 0 ? t('cta_continue') : t('cta_start')),
      el('a', { class: 'btn btn-ghost btn-lg', href: 'culture.html' }, t('cta_culture')),
    ),
    el('div', { class: 'hero-stats' },
      el('div', { class: 'stat' }, el('strong', {}, `${VOCAB.length}+`), el('span', {}, t('stat_words'))),
      el('div', { class: 'stat' }, el('strong', {}, `${lessonsTotal}`), el('span', {}, t('stat_lessons'))),
      el('div', { class: 'stat' }, el('strong', {}, `${GRAMMAR.length}`), el('span', {}, t('stat_grammar'))),
      el('div', { class: 'stat' }, el('strong', {}, `${CULTURE.length}`), el('span', {}, t('stat_culture'))),
    ),
  ),
  el('div', { class: 'hero-art' },
    el('img', { src: 'assets/img/stupa.svg', alt: 'That Luang stupa illustration' }),
    el('div', { class: 'hero-word-card card' },
      el('div', { class: 'word-lao lao' }, 'ສະບາຍດີ'),
      el('div', { class: 'word-tr' }, 'sa-bai-dii'),
      el('div', { class: 'word-en' }, 'Hello'),
      speakBtn({ ...VOCAB_BY_ID.hello }),
    ),
  ),
);

const features = el('section', { class: 'features' },
  el('h2', {}, t('features_title')),
  el('div', { class: 'feature-grid' },
    feature('🎯', t('feat_lessons'), t('feat_lessons_desc')),
    feature('🔊', t('feat_audio'), t('feat_audio_desc')),
    feature('📖', t('feat_grammar'), t('feat_grammar_desc')),
    feature('🧺', t('feat_words'), t('feat_words_desc')),
    feature('🇱🇦', t('feat_culture'), t('feat_culture_desc')),
    feature('👤', t('feat_account'), t('feat_account_desc')),
    feature('💚', t('feat_free'), t('feat_free_desc')),
  ),
);

function feature(icon, title, text) {
  return el('div', { class: 'feature-card card' },
    el('div', { class: 'feature-icon' }, icon),
    el('h3', {}, title),
    el('p', {}, text));
}

const pathPreview = el('section', { class: 'path-preview' },
  el('h2', {}, t('path_title')),
  el('p', { class: 'section-sub', html: t('path_preview_sub').replace('{x}', UNITS.length) }),
  el('div', { class: 'units-preview' },
    UNITS.map(u => el('a', {
      class: 'unit-chip',
      href: 'learn.html',
      style: `--unit-color:${u.color}`,
    }, el('span', { class: 'unit-icon' }, u.icon), el('span', { class: 'unit-title' }, `${u.num}. ${u.title}`)))
  ),
  el('a', { class: 'btn btn-primary', href: 'learn.html' }, t('open_path')),
);

const cta = el('section', { class: 'cta card' },
  el('h2', { html: t('cta_title') }),
  el('p', {}, t('cta_sub')),
  el('a', { class: 'btn btn-primary btn-lg', href: 'lesson.html?id=u1l1' }, t('cta_now')),
);

document.getElementById('app').append(hero, features, pathPreview, cta);
