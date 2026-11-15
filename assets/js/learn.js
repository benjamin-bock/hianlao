import { el, renderShell } from './main.js';
import { t } from './ui.js';
import { UNITS } from './data/units.js';
import { VOCAB_BY_ID } from './data/vocab.js';
import { isDone, totalDone, api, getUser, getState, setGoal, getDueReviews, getWeakWords } from './store.js';

renderShell('learn');

// Flatten lessons in order to compute locks.
const allLessons = UNITS.flatMap(u => u.lessons.map(l => ({ ...l, unit: u })));
const firstUndone = allLessons.findIndex(l => !isDone(l.id));

function isUnlocked(index) {
  if (index === 0) return true;
  return isDone(allLessons[index - 1].id);
}

let lbPeriod = 'all';
const app = document.getElementById('app');

app.append(
  el('div', { class: 'page-head' },
    el('h1', {}, t('learn_title')),
    el('p', { class: 'section-sub' }, `${totalDone()}/${allLessons.length} ${t('learn_sub')}`),
  ),
);

const goalState0 = getState();
const goalFill = el('div', { class: 'goal-fill' });
const goalLabel = el('span', { class: 'muted' }, '');
const goalSel = el('select', { 'aria-label': t('goal_select') },
  [10, 20, 50, 100].map(g => el('option', { value: String(g) }, `⚡ ${g} XP`)));
goalSel.value = String(goalState0.goal || 20);
function renderGoal() {
  const s = getState();
  const pct = Math.min(100, Math.round(((s.xpToday || 0) / (s.goal || 20)) * 100));
  goalFill.style.width = pct + '%';
  goalLabel.textContent = `${t('goal_today')}: ⚡ ${s.xpToday || 0} / ${s.goal || 20} XP (${pct}%)`;
}
goalSel.addEventListener('change', () => { setGoal(Number(goalSel.value)); renderGoal(); });
renderGoal();
app.append(el('div', { class: 'card goal-card' },
  el('div', { class: 'goal-row' },
    el('strong', {}, t('goal_title')),
    goalSel,
    el('div', { class: 'goal-bar' }, goalFill),
    goalLabel)));

// Repetition nudges: due reviews and tricky words come first — repetition is key.
function nudgeCard(cls, icon, count, keyCard, keySub, href, goKey) {
  return el('a', { class: `card nudge-card ${cls}`, href },
    el('span', { class: 'nudge-icon' }, icon),
    el('div', { class: 'nudge-text' },
      el('strong', {}, `${count} ${t(keyCard)}`),
      el('span', { class: 'muted' }, t(keySub))),
    el('span', { class: 'nudge-go' }, `${t(goKey)} →`));
}
const dueReviews = getDueReviews().length;
const weakCount = getWeakWords().filter(w => VOCAB_BY_ID[w.id]).length;
if (dueReviews || weakCount) {
  const nudges = el('div', { class: 'nudges' });
  if (dueReviews) nudges.append(nudgeCard('nudge-review', '🔁', dueReviews, 'learn_due_card', 'learn_due_sub', 'review.html', 'review_now'));
  if (weakCount) nudges.append(nudgeCard('nudge-weak', '🎯', weakCount, 'learn_weak_card', 'learn_weak_sub', 'lesson.html?id=__weak', 'drill_now'));
  app.append(nudges);
}

UNITS.forEach((unit, ui) => {
  const section = el('section', { class: 'unit-section' },
    el('div', { class: 'unit-header', style: `--unit-color:${unit.color}` },
      el('div', { class: 'unit-badge', style: `--unit-color:${unit.color}` }, unit.icon),
      el('div', {},
        el('h2', {}, t('unit_n').replace('{x}', unit.num).replace('{y}', unit.title)),
        el('p', { class: 'unit-desc' }, unit.desc)),
    ),
    el('div', { class: 'lessons-path' },
      unit.lessons.map(l => {
        const globalIndex = allLessons.findIndex(x => x.id === l.id);
        const done = isDone(l.id);
        const unlocked = isUnlocked(globalIndex);
        const node = el('a', {
          class: `lesson-node${done ? ' done' : ''}${unlocked ? '' : ' locked'}`,
          href: unlocked ? `lesson.html?id=${l.id}` : '#',
          style: `--unit-color:${unit.color}`,
          'aria-disabled': unlocked ? 'false' : 'true',
        },
          el('div', { class: 'lesson-circle' }, done ? '✓' : unlocked ? '▶' : '🔒'),
          el('div', { class: 'lesson-meta' },
            el('strong', {}, l.title),
            el('span', {}, t('n_exercises').replace('{x}', l.exercises.length))),
        );
        if (!unlocked) node.addEventListener('click', e => e.preventDefault());
        return node;
      })
    ),
  );
  app.append(section);
});

if (firstUndone >= 0) {
  const next = allLessons[firstUndone];
  app.append(el('div', { class: 'sticky-cta' },
    el('a', { class: 'btn btn-primary btn-lg', href: `lesson.html?id=${next.id}` }, `▶ ${t('next_cta')}: ${next.title}`)));
}

// Leaderboard (only when the backend is available and the user is signed in).
async function leaderboardCard() {
  const card = el('section', { class: 'card leaderboard-card' },
    el('h2', {}, t('lb_title')),
    el('p', { class: 'muted' }, t('lb_sub')),
  );
  const list = el('ol', { class: 'leaderboard-list' });
  const tabs = el('div', { class: 'mode-tabs' });
  for (const [key, p] of [[t('lb_all'), 'all'], [t('lb_week'), 'week']]) {
    const b = el('button', { class: `chip${lbPeriod === p ? ' active' : ''}` }, key);
    b.addEventListener('click', () => { lbPeriod = p; loadLb(); tabs.querySelectorAll('.chip').forEach(x => x.classList.remove('active')); b.classList.add('active'); });
    tabs.append(b);
  }
  card.append(tabs, list);
  app.append(card);
  if (!api.available) {
    list.append(el('li', { class: 'muted' }, t('lb_offline')));
    return;
  }
  if (!getUser()) {
    list.append(el('li', { class: 'muted' }, el('a', { href: 'account.html' }, t('lb_signin')), ' ' + t('lb_join')));
    return;
  }
  await loadLb();
}
async function loadLb() {
  const list = document.querySelector('.leaderboard-list');
  const entries = await api.leaderboard(10, lbPeriod);
  list.innerHTML = '';
  if (!entries.length) { list.append(el('li', { class: 'muted' }, t('lb_empty'))); return; }
  entries.forEach((e2, i) => {
    const me = getUser() && e2.username === getUser().username.toLowerCase();
    list.append(el('li', { class: me ? 'me' : '' },
      el('span', { class: 'lb-rank' }, `${i + 1}`),
      el('span', { class: 'lb-name' }, e2.displayName || e2.username),
      el('span', { class: 'lb-xp' }, `⚡ ${e2.xp}`)));
  });
}
leaderboardCard();
