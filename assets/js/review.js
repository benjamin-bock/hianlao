import { el, renderShell } from './main.js';
import { t, pf } from './ui.js';
import { getDueReviews, getUpcomingReviews } from './store.js';
import { LESSON_BY_ID } from './data/units.js';

renderShell('review');

const app = document.getElementById('app');
const due = getDueReviews();
const upcoming = getUpcomingReviews();

app.append(el('div', { class: 'page-head' },
  el('h1', {}, `🔁 ${t('review_title')}`),
  el('p', { class: 'section-sub' }, t('review_sub')),
));

function lessonRow(l, dueNow) {
  const meta = LESSON_BY_ID[l.id];
  return el('a', {
    class: `lesson-node${dueNow ? '' : ' locked'}`,
    href: `lesson.html?id=${l.id}`,
  },
    el('div', { class: 'lesson-circle', style: '--unit-color:#8b5cf6' }, dueNow ? '🔁' : '⏳'),
    el('div', { class: 'lesson-meta' },
      el('strong', {}, meta ? pf(meta, 'title') : l.id),
      el('span', {}, dueNow ? t('review_start') : new Date(l.due).toLocaleString())));
}

if (!due.length && !upcoming.length) {
  app.append(el('div', { class: 'card', style: 'text-align:center;max-width:560px;margin:1rem auto' },
    el('p', { style: 'font-size:1.1rem' }, t('review_none')),
    el('a', { class: 'btn btn-primary', href: 'learn.html', style: 'margin-top:1rem' }, t('nav_learn') + ' →')));
} else {
  if (due.length) {
    app.append(el('section', { class: 'unit-section' },
      el('h2', {}, `🔥 ${t('review_due')} (${due.length})`),
      el('div', { class: 'lessons-path', style: 'margin-left:0' }, due.map(l => lessonRow(l, true)))));
  }
  if (upcoming.length) {
    app.append(el('section', { class: 'unit-section' },
      el('h2', {}, `⏳ ${t('review_upcoming')} (${upcoming.length})`),
      el('div', { class: 'lessons-path', style: 'margin-left:0' }, upcoming.slice(0, 10).map(l => lessonRow(l, false)))));
  }
}
