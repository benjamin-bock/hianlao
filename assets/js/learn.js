import { el, renderShell } from './main.js';
import { UNITS } from './data/units.js';
import { isDone, totalDone } from './store.js';

renderShell('learn');

// Flatten lessons in order to compute locks.
const allLessons = UNITS.flatMap(u => u.lessons.map(l => ({ ...l, unit: u })));
const firstUndone = allLessons.findIndex(l => !isDone(l.id));

function isUnlocked(index) {
  if (index === 0) return true;
  return isDone(allLessons[index - 1].id);
}

const app = document.getElementById('app');

app.append(
  el('div', { class: 'page-head' },
    el('h1', {}, 'Learn Lao'),
    el('p', { class: 'section-sub' }, `${totalDone()}/${allLessons.length} lessons completed · progress is saved on this device`),
  ),
);

UNITS.forEach((unit, ui) => {
  const section = el('section', { class: 'unit-section' },
    el('div', { class: 'unit-header', style: `--unit-color:${unit.color}` },
      el('div', { class: 'unit-badge', style: `--unit-color:${unit.color}` }, unit.icon),
      el('div', {},
        el('h2', {}, `Unit ${unit.num} — ${unit.title}`),
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
            el('span', {}, `${l.exercises.length} exercises`)),
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
    el('a', { class: 'btn btn-primary btn-lg', href: `lesson.html?id=${next.id}` }, `▶ Continue: ${next.title}`)));
}
