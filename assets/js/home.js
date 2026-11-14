import { el, renderShell, speakBtn } from './main.js';
import { t } from './ui.js';
import { getState, totalDone } from './store.js';
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
    el('h1', { html: 'Learn Lao, the language<br>of <span class="lao accent">ລ້ານຊ້າງ</span> (a million elephants)' }),
    el('p', { class: 'hero-sub' }, 'HianLao (<span class="lao">ເຣີຢນລາວ</span> — "learn Lao") is a Duolingo-style learning site that is 100% free and open-source. Lessons, grammar bible, vocabulary with audio, and Lao culture — no subscription, ever.'),
    el('div', { class: 'hero-ctas' },
      el('a', { class: 'btn btn-primary btn-lg', href: state.xp > 0 || totalDone() > 0 ? 'learn.html' : 'lesson.html?id=u1l1' },
        totalDone() > 0 ? t('cta_continue') : t('cta_start')),
      el('a', { class: 'btn btn-ghost btn-lg', href: 'culture.html' }, t('cta_culture')),
    ),
    el('div', { class: 'hero-stats' },
      el('div', { class: 'stat' }, el('strong', {}, `${VOCAB.length}+`), el('span', {}, 'words & phrases')),
      el('div', { class: 'stat' }, el('strong', {}, `${lessonsTotal}`), el('span', {}, 'bite-size lessons')),
      el('div', { class: 'stat' }, el('strong', {}, `${GRAMMAR.length}`), el('span', {}, 'grammar guides')),
      el('div', { class: 'stat' }, el('strong', {}, `${CULTURE.length}`), el('span', {}, 'culture stories')),
    ),
  ),
  el('div', { class: 'hero-art' },
    el('img', { src: 'assets/img/stupa.svg', alt: 'That Luang stupa illustration' }),
    el('div', { class: 'hero-word-card card' },
      el('div', { class: 'word-lao lao' }, 'ສະບາດີ'),
      el('div', { class: 'word-tr' }, 'sa-ba-dii'),
      el('div', { class: 'word-en' }, 'Hello'),
      speakBtn({ lao: 'ສະບາດີ', tr: 'sa-ba-dii', en: 'Hello' }),
    ),
  ),
);

const features = el('section', { class: 'features' },
  el('h2', {}, t('features_title')),
  el('div', { class: 'feature-grid' },
    feature('🎯', t('feat_lessons'), '39 bite-size lessons in 13 units: multiple choice, typing, matching, listening, word tiles and speaking practice. XP, hearts and streaks keep you motivated.'),
    feature('🔊', t('feat_audio'), 'Press 🔊 on any word to hear it (Lao voice when your device has one), and try the microphone exercises to practice speaking.'),
    feature('📖', t('feat_grammar'), 'From the Lao script and its 6 tones to sentence structure, particles, classifiers and questions — explained simply, with Lao examples.'),
    feature('🧺', t('feat_words'), 'A searchable dictionary of 200+ words and real-life phrases, sorted by theme: greetings, food, family, travel…'),
    feature('🇱🇦', t('feat_culture'), 'Festivals (Pi Mai!), food, etiquette, the Mekong, and why the diaspora keeps the language alive.'),
    feature('👤', t('feat_account'), 'Create a free account to sync XP, streaks and completed lessons across all your devices, and climb the 🏆 leaderboard. No account? No problem — progress stays on your device.'),
    feature('💚', t('feat_free'), 'No paywall, no ads. The code is on GitHub under MIT — contribute a lesson or a word!'),
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
  el('p', { class: 'section-sub' }, `${UNITS.length} units, from "ສະບາດີ" to full sentences — and proverbs.`),
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
  el('h2', { html: 'Ready to say <span class="lao">ສະບາດີ</span>?' }),
  el('p', {}, 'Your first lesson takes 3 minutes. No sign-up. Just learning.'),
  el('a', { class: 'btn btn-primary btn-lg', href: 'lesson.html?id=u1l1' }, 'Start now — it\'s free ⚡'),
);

document.getElementById('app').append(hero, features, pathPreview, cta);
