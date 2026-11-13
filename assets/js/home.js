import { el, renderShell, speakBtn } from './main.js';
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
    el('p', { class: 'hero-kicker' }, 'Free · Open-source · For the Lao diaspora 🌏'),
    el('h1', { html: 'Learn Lao, the language<br>of <span class="lao accent">ລ້ານຊ້າງ</span> (a million elephants)' }),
    el('p', { class: 'hero-sub' }, 'HianLao (<span class="lao">ເຣີຢນລາວ</span> — "learn Lao") is a Duolingo-style learning site that is 100% free and open-source. Lessons, grammar bible, vocabulary with audio, and Lao culture — no subscription, ever.'),
    el('div', { class: 'hero-ctas' },
      el('a', { class: 'btn btn-primary btn-lg', href: state.xp > 0 || totalDone() > 0 ? 'learn.html' : 'lesson.html?id=u1l1' },
        totalDone() > 0 ? 'Continue learning →' : 'Start lesson 1 — it\'s free →'),
      el('a', { class: 'btn btn-ghost btn-lg', href: 'culture.html' }, 'Explore Lao culture'),
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
  el('h2', {}, 'What you get'),
  el('div', { class: 'feature-grid' },
    feature('🎯', 'Duolingo-style lessons', '24 bite-size lessons in 8 units: multiple choice, typing, matching, listening, word tiles and speaking practice. XP, hearts and streaks keep you motivated.'),
    feature('🔊', 'Audio & voice', 'Press 🔊 on any word to hear it (Lao voice when your device has one), and try the microphone exercises to practice speaking.'),
    feature('📖', 'Grammar bible', 'From the Lao script and its 6 tones to sentence structure, particles, classifiers and questions — explained simply, with Lao examples.'),
    feature('🧺', 'Words & phrases', 'A searchable dictionary of 200+ words and real-life phrases, sorted by theme: greetings, food, family, travel…'),
    feature('🇱🇦', 'Culture', 'Festivals (Pi Mai!), food, etiquette, the Mekong, and why the diaspora keeps the language alive.'),
    feature('💚', 'Free & open-source', 'No accounts, no paywall, no ads. The code is on GitHub under MIT — contribute a lesson or a word!'),
  ),
);

function feature(icon, title, text) {
  return el('div', { class: 'feature-card card' },
    el('div', { class: 'feature-icon' }, icon),
    el('h3', {}, title),
    el('p', {}, text));
}

const pathPreview = el('section', { class: 'path-preview' },
  el('h2', {}, 'The learning path'),
  el('p', { class: 'section-sub' }, '8 units, from "ສະບາດີ" to full sentences.'),
  el('div', { class: 'units-preview' },
    UNITS.map(u => el('a', {
      class: 'unit-chip',
      href: 'learn.html',
      style: `--unit-color:${u.color}`,
    }, el('span', { class: 'unit-icon' }, u.icon), el('span', { class: 'unit-title' }, `${u.num}. ${u.title}`)))
  ),
  el('a', { class: 'btn btn-primary', href: 'learn.html' }, 'Open the path →'),
);

const cta = el('section', { class: 'cta card' },
  el('h2', { html: 'Ready to say <span class="lao">ສະບາດີ</span>?' }),
  el('p', {}, 'Your first lesson takes 3 minutes. No sign-up. Just learning.'),
  el('a', { class: 'btn btn-primary btn-lg', href: 'lesson.html?id=u1l1' }, 'Start now — it\'s free ⚡'),
);

document.getElementById('app').append(hero, features, pathPreview, cta);
