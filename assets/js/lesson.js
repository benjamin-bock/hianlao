// HianLao lesson engine: renders one exercise at a time, hearts, XP, feedback,
// and a summary screen. Exercises come from data/units.js.
import { el, renderShell, shuffle, laoSpan, speakBtn } from './main.js';
import { t } from './ui.js';
import { VOCAB_BY_ID as V } from './data/vocab.js';
import { LESSON_BY_ID, UNITS } from './data/units.js';
import { addXp, markDone, isDone, getState, scheduleReview } from './store.js';
import { unlockedAchievements } from './achievements.js';
import { speakItem, speak, canRecognize, recognize, normalize, speechMatches, hasLaoVoice } from './speech.js';
import { sfx, buzz, shake, pop, pulse, xpFly, confettiBurst } from './fx.js';

const params = new URLSearchParams(location.search);
const lessonId = params.get('id') || 'u1l1';
const lesson = LESSON_BY_ID[lessonId];

renderShell('learn');
document.body.classList.add('in-lesson');

const app = document.getElementById('app');

if (!lesson) {
  app.append(el('div', { class: 'card error-card' },
    el('h1', {}, 'Lesson not found'),
    el('p', {}, `No lesson with id "${lessonId}".`),
    el('a', { class: 'btn btn-primary', href: 'learn.html' }, 'Back to the path')));
  throw new Error(`unknown lesson ${lessonId}`);
}

const XP_PER_CORRECT = 10;
const state = {
  index: 0,
  hearts: 5,
  correct: 0,
  xpEarned: 0,
  answered: false,
  failed: false,
  combo: 0,
};

// ---------- top bar ----------
const progressFill = el('div', { class: 'progress-fill' });
const comboEl = el('span', { class: 'combo', style: 'display:none' }, '');
const heartsEl = el('span', { class: 'hearts', title: 'Hearts' }, '❤️'.repeat(state.hearts) + '🖤'.repeat(5 - state.hearts));
const topbar = el('div', { class: 'lesson-topbar' },
  el('a', { class: 'icon-btn', href: 'learn.html', title: 'Exit lesson', 'aria-label': 'Exit lesson' }, '✕'),
  el('div', { class: 'progress' }, progressFill),
  comboEl,
  heartsEl,
);

const stage = el('div', { class: 'lesson-stage' });
const actionInner = el('div', { class: 'actionbar-inner' });
const actionBar = el('div', { class: 'lesson-actionbar' }, actionInner);
app.append(topbar, stage, actionBar);

function updateTopbar() {
  progressFill.style.width = `${(state.index / lesson.exercises.length) * 100}%`;
  heartsEl.textContent = '❤️'.repeat(Math.max(state.hearts, 0)) + '🖤'.repeat(Math.max(5 - state.hearts, 0));
  const showCombo = state.combo >= 2;
  comboEl.style.display = showCombo ? '' : 'none';
  if (showCombo) {
    comboEl.textContent = `🔥 ×${state.combo}`;
    pop(comboEl);
  }
}

function setActionBar(...nodes) {
  actionInner.innerHTML = '';
  actionInner.append(...nodes);
}

const checkBtn = () => el('button', { class: 'btn btn-primary btn-lg' }, t('check'));
const tapHint = () => el('span', { class: 'action-hint' }, t('tap_answer'));

function feedbackBanner(ok, correctText) {
  return el('div', { class: `feedback ${ok ? 'ok' : 'bad'}` },
    el('div', { class: 'feedback-icon' }, ok ? '🎉' : '💡'),
    el('div', {},
      el('strong', {}, ok ? pick(['Awesome!', 'Correct!', '\u0ec1\u0eaa\u0ec8\u0e9a! (Delicious = great!)', 'Well done!']) : 'Not quite'),
      !ok ? el('p', { html: `Correct answer: <b>${correctText}</b>` }) : el('p', {}, pick(['+10 XP', 'Keep it up!', 'You\'re on fire 🔥'])),
    ),
    el('button', { class: 'btn btn-continue btn-lg', onclick: () => next() }, t('cont')));
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function next() {
  if (state.hearts <= 0) return failScreen();
  state.index++;
  if (state.index >= lesson.exercises.length) return summaryScreen();
  state.answered = false;
  renderExercise();
}

// ---------- exercise renderers ----------
function renderExercise() {
  updateTopbar();
  stage.innerHTML = '';
  setActionBar();
  window.scrollTo(0, 0);
  const ex = lesson.exercises[state.index];
  const head = el('div', { class: 'exercise-head' },
    el('h2', {}, exTitle(ex)),
    exPrompt(ex) ? el('p', { class: 'exercise-prompt', html: exPrompt(ex) }) : null,
  );
  if (state.index === 0 && lesson.blurb) {
    stage.append(el('div', { class: 'card context-card' },
      el('p', { class: 'context-blurb' }, lesson.blurb)));
  }
  stage.append(head, exBody(ex));
}

function exTitle(ex) {
  switch (ex.type) {
    case 'mc': return ex.dir === 'lao2en' ? 'What does this mean?' : 'Which one is…?';
    case 'type': return ex.dir === 'lao2en' ? 'Translate to English' : 'Write in Lao';
    case 'match': return 'Match the pairs';
    case 'listen': return '🔊 Listen and choose';
    case 'tiles': return 'Build the sentence';
    case 'speak': return '🎤 Say it out loud';
    default: return 'Exercise';
  }
}

function exPrompt(ex) {
  if (ex.type === 'mc' && ex.dir === 'en2lao') return `Select the Lao for: <b>${V[ex.answer].en}</b>`;
  if (ex.type === 'type' && ex.dir === 'lao2en') return null;
  if (ex.type === 'type' && ex.dir === 'en2lao') return `Type the Lao for: <b>${V[ex.id].en}</b> (Lao script or transliteration accepted)`;
  if (ex.type === 'listen') return 'Press play, then choose what you heard.';
  if (ex.type === 'tiles') return `Translate: <b>${ex.en}</b>`;
  if (ex.type === 'speak') return null;
  return null;
}

function exBody(ex) {
  switch (ex.type) {
    case 'mc': return renderMc(ex);
    case 'type': return renderType(ex);
    case 'match': return renderMatch(ex);
    case 'listen': return renderListen(ex);
    case 'tiles': return renderTiles(ex);
    case 'speak': return renderSpeak(ex);
    default: return el('p', {}, 'Unknown exercise type.');
  }
}

// Tap an option = instant check (no separate "accept" step).
function renderMc(ex) {
  const body = el('div', {});
  if (ex.dir === 'lao2en') {
    body.append(
      el('div', { class: 'big-word card' },
        el('div', { class: 'word-lao lao' }, V[ex.answer].lao),
        el('div', { class: 'word-tr' }, V[ex.answer].tr),
        speakBtn(V[ex.answer])),
    );
  } else {
    body.append(
      el('div', { class: 'big-word card' }, el('div', { class: 'word-en-lg' }, V[ex.answer].en)),
    );
  }
  const order = shuffle(ex.ids);
  const opts = el('div', { class: 'options' }, order.map(id => {
    const c = el('button', { class: 'option-card' },
      ex.dir === 'lao2en' ? el('span', {}, V[id].en) : el('span', { class: 'lao' }, V[id].lao));
    c.dataset.id = id;
    c.addEventListener('click', () => {
      if (state.answered) return;
      state.answered = true;
      const a = V[ex.answer];
      opts.querySelectorAll('.option-card').forEach(x => {
        x.classList.remove('selected');
        if (x.dataset.id === ex.answer) x.classList.add('correct');
        else if (x === c) x.classList.add('wrong');
      });
      sfx('click');
      resolveAnswer(id === ex.answer, `${a.lao} — ${a.tr} — ${a.en}`);
    });
    return c;
  }));
  body.append(opts);
  setActionBar(tapHint());
  return body;
}

function renderType(ex) {
  const item = V[ex.id];
  const body = el('div', { class: 'type-wrap' });
  if (ex.dir === 'lao2en') {
    body.append(el('div', { class: 'big-word card' },
      el('div', { class: 'word-lao lao' }, item.lao),
      el('div', { class: 'word-tr' }, item.tr),
      speakBtn(item)));
  } else {
    body.append(el('div', { class: 'big-word card' }, el('div', { class: 'word-en-lg' }, item.en)));
  }
  const input = el('input', { class: 'type-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: ex.dir === 'lao2en' ? 'Type the English…' : 'Type in Lao or transliteration…' });
  body.append(el('div', { class: 'type-row' }, input));
  const btn = checkBtn();
  btn.disabled = true;
  input.addEventListener('input', () => { btn.disabled = !input.value.trim(); });
  const submit = () => {
    if (state.answered) return;
    const val = normalize(input.value);
    if (!val) return;
    let ok;
    if (ex.dir === 'lao2en') ok = val === normalize(item.en) || normalize(item.en).includes(val) && val.length >= 3;
    else ok = val === normalize(item.lao) || val === normalize(item.tr);
    state.answered = true;
    if (!ok) shake(input);
    resolveAnswer(ok, ex.dir === 'lao2en' ? item.en : `${item.lao} (${item.tr})`);
  };
  btn.addEventListener('click', submit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  setActionBar(el('span', { class: 'action-spacer' }), btn);
  setTimeout(() => input.focus(), 50);
  return body;
}

function renderMatch(ex) {
  const items = shuffle(ex.ids).map(id => V[id]);
  const left = shuffle(items);
  const right = shuffle(items);
  let selLeft = null, selRight = null, matched = new Set();
  const hint = el('p', { class: 'action-hint' }, '');
  const updateHint = () => { hint.textContent = `${matched.size}/${items.length} matched — match every Lao word with its English meaning.`; };
  updateHint();
  const body = el('div', { class: 'match-grid' },
    el('div', { class: 'match-col' }, left.map(v => matchBtn(v, 'lao'))),
    el('div', { class: 'match-col' }, right.map(v => matchBtn(v, 'en'))),
  );
  function matchBtn(v, side) {
    const b = el('button', { class: 'option-card match-card' },
      side === 'lao' ? el('span', { class: 'lao' }, v.lao) : el('span', {}, v.en));
    b.addEventListener('click', () => {
      if (state.answered || matched.has(v.id)) return;
      if (side === 'lao') { selLeft = selLeft === b ? null : b; }
      else { selRight = selRight === b ? null : b; }
      body.querySelectorAll('.match-card').forEach(c => c.classList.remove('selected'));
      if (selLeft) selLeft.classList.add('selected');
      if (selRight) selRight.classList.add('selected');
      if (selLeft && selRight) {
        const l = left.find(x => x.lao === selLeft.textContent);
        const r = right.find(x => x.en === selRight.textContent);
        if (l && r && l.id === r.id) {
          matched.add(l.id);
          selLeft.classList.add('matched'); selRight.classList.add('matched');
          selLeft = selRight = null;
          sfx('match');
          updateHint();
          if (matched.size === items.length) {
            state.answered = true;
            resolveAnswer(true, 'All pairs matched');
          }
        } else {
          sfx('wrong');
          buzz(40);
          shake(body);
          selLeft.classList.add('wrong'); selRight.classList.add('wrong');
          setTimeout(() => { selLeft?.classList.remove('wrong', 'selected'); selRight?.classList.remove('wrong', 'selected'); selLeft = selRight = null; }, 350);
        }
      }
    });
    return b;
  }
  setActionBar(hint);
  return body;
}

function renderListen(ex) {
  const answer = V[ex.answer];
  const body = el('div', {});
  const play = el('button', { class: 'play-btn', title: 'Play audio', 'aria-label': 'Play audio' }, '🔊');
  play.addEventListener('click', () => { speakItem(answer); play.classList.add('playing'); setTimeout(() => play.classList.remove('playing'), 1200); });
  body.append(
    el('div', { class: 'big-word card listen-card' },
      play,
      hasLaoVoice()
        ? el('p', { class: 'muted' }, '▶ Press play and listen')
        : el('p', { class: 'muted' }, '▶ Your browser has no Lao voice — we will say the transliteration: ' + answer.tr)),
  );
  const cards = shuffle(ex.ids);
  const opts = el('div', { class: 'options' }, cards.map(id => {
    const c = el('button', { class: 'option-card' }, el('span', {}, V[id].en));
    c.dataset.id = id;
    c.addEventListener('click', () => {
      if (state.answered) return;
      state.answered = true;
      opts.querySelectorAll('.option-card').forEach(x => {
        x.classList.remove('selected');
        if (x.dataset.id === ex.answer) x.classList.add('correct');
        else if (x === c) x.classList.add('wrong');
      });
      sfx('click');
      resolveAnswer(id === ex.answer, `${answer.lao} — ${answer.tr} — ${answer.en}`);
    });
    return c;
  }));
  body.append(opts);
  setActionBar(tapHint());
  setTimeout(() => speakItem(answer), 400);
  return body;
}

function renderTiles(ex) {
  const bank = el('div', { class: 'tile-bank' });
  const answerArea = el('div', { class: 'tile-answer' }, el('span', { class: 'muted' }, 'Tap the words in order…'));
  const chosen = [];
  const btn = checkBtn();
  btn.disabled = true;
  const submit = () => {
    if (state.answered || !chosen.length) return;
    state.answered = true;
    const ok = chosen.join('') === ex.lao;
    if (!ok) shake(answerArea);
    resolveAnswer(ok, `${ex.lao} — ${ex.tr}`);
  };
  function renderBank() {
    bank.innerHTML = '';
    shuffle(ex.words.filter(w => !chosen.includes(w) || ex.words.filter(x => x === w).length > chosen.filter(x => x === w).length))
      .forEach(w => {
        const t = el('button', { class: 'tile' }, w);
        t.addEventListener('click', () => {
          if (state.answered) return;
          chosen.push(w);
          sfx('click');
          renderAll();
        });
        bank.append(t);
      });
  }
  function renderAnswer() {
    answerArea.innerHTML = '';
    if (!chosen.length) answerArea.append(el('span', { class: 'muted' }, 'Tap the words in order…'));
    chosen.forEach((w, i) => {
      const t = el('button', { class: 'tile chosen' }, w);
      t.addEventListener('click', () => {
        if (state.answered) return;
        chosen.splice(i, 1);
        renderAll();
      });
      answerArea.append(t);
    });
  }
  function renderAll() { renderBank(); renderAnswer(); btn.disabled = state.answered || chosen.length === 0; }
  renderAll();
  const body = el('div', { class: 'tiles-wrap' },
    el('div', { class: 'big-word card' },
      el('div', { class: 'word-en-lg' }, ex.en),
      el('div', { class: 'word-tr' }, ex.tr)),
    answerArea, bank);
  btn.addEventListener('click', submit);
  setActionBar(el('span', { class: 'action-spacer' }), btn);
  return body;
}

function renderSpeak(ex) {
  const item = V[ex.id];
  const body = el('div', { class: 'speak-wrap' },
    el('div', { class: 'big-word card' },
      el('div', { class: 'word-lao lao' }, item.lao),
      el('div', { class: 'word-tr' }, item.tr),
      el('div', { class: 'word-en' }, item.en),
      speakBtn(item)),
  );
  const status = el('p', { class: 'muted speak-status' }, '');
  if (canRecognize()) {
    const mic = el('button', { class: 'btn btn-mic btn-lg' }, '🎤 Tap and speak');
    mic.addEventListener('click', async () => {
      mic.disabled = true;
      status.textContent = 'Listening… say it now 🎤';
      const transcript = await recognize({ lang: 'lo-LA' });
      mic.disabled = false;
      if (state.answered) return;
      if (transcript === null) {
        status.textContent = 'Did not catch that — try again, or press "I said it".';
        return;
      }
      status.textContent = `Heard: "${transcript}"`;
      state.answered = true;
      resolveAnswer(speechMatches(transcript, item), `${item.lao} — ${item.tr}`);
    });
    body.append(mic, status);
    const skip = el('button', { class: 'btn btn-ghost' }, "No mic? I said it ✔");
    skip.addEventListener('click', () => {
      if (state.answered) return;
      state.answered = true;
      status.textContent = 'Great — keep speaking out loud! 🗣️';
      resolveAnswer(true, `${item.lao} — ${item.tr}`);
    });
    body.append(skip);
  } else {
    body.append(
      el('p', { class: 'muted' }, 'This browser cannot use the microphone. Listen with 🔊, repeat out loud, then tap below.'),
      status,
    );
    const said = el('button', { class: 'btn btn-primary btn-lg' }, 'I said it out loud ✔');
    said.addEventListener('click', () => {
      if (state.answered) return;
      state.answered = true;
      resolveAnswer(true, `${item.lao} — ${item.tr}`);
    });
    body.append(said);
  }
  setActionBar(el('span', { class: 'action-spacer' }), el('span', { class: 'action-hint' }, 'Speaking practice'));
  return body;
}

// ---------- answer resolution ----------
// Feedback (and the CONTINUE button) live in the fixed bottom action bar, so
// they are always visible — and the stage controls are locked before the
// banner exists, so CONTINUE can never end up disabled.
function resolveAnswer(ok, correctText) {
  if (ok) {
    state.correct++;
    state.xpEarned += XP_PER_CORRECT;
    state.combo++;
  } else {
    state.hearts = Math.max(0, state.hearts - 1);
    state.combo = 0;
  }
  updateTopbar();
  stage.querySelectorAll('.option-card, .tile, input, button').forEach(n => { n.disabled = true; });
  const banner = feedbackBanner(ok, correctText);
  setActionBar(banner);
  if (ok) {
    sfx('correct');
    buzz([12, 30, 12]);
    pop(stage.querySelector('.option-card.correct') || stage);
    const r = heartsEl.getBoundingClientRect();
    xpFly(`+${XP_PER_CORRECT} XP`, r.left + r.width / 2, r.top);
    pulse(document.querySelector('.xp-pill'));
  } else {
    sfx('wrong');
    buzz(70);
    shake(stage);
    shake(heartsEl);
  }
  if (state.hearts <= 0) {
    banner.querySelector('.btn-continue').textContent = 'SEE RESULT';
  }
}

// ---------- summary / fail ----------
function nextLessonId() {
  const all = UNITS.flatMap(u => u.lessons.map(l => l.id));
  const i = all.indexOf(lesson.id);
  return i >= 0 && i < all.length - 1 ? all[i + 1] : null;
}

function summaryScreen() {
  const total = lesson.exercises.length;
  const acc = Math.round((state.correct / total) * 100);
  addXp(state.xpEarned);
  markDone(lesson.id);
  scheduleReview(lesson.id);
  progressFill.style.width = '100%';
  stage.innerHTML = '';
  setActionBar();
  sfx('fanfare');
  confettiBurst();
  const nextId = nextLessonId();
  const icon = el('div', { class: 'summary-icon' }, '🏆');
  pop(icon);
  stage.append(el('div', { class: 'summary card' },
    icon,
    el('h1', {}, t('done_title')),
    el('p', { class: 'lao summary-lao' }, '\u0e97\u0eb3\u0ec4\u0e94\u0ec9\u0e94\u0eb5\u0ea1\u0eb2\u0e81!'),
    el('p', {}, `${lesson.title} — ${state.correct}/${total} correct (${acc}%)`),
    el('div', { class: 'summary-stats' },
      el('div', { class: 'stat' }, el('strong', {}, `+${state.xpEarned}`), el('span', {}, '⚡ XP earned')),
      el('div', { class: 'stat' }, el('strong', {}, `${acc}%`), el('span', {}, 'accuracy')),
      el('div', { class: 'stat' }, el('strong', {}, `⚡ ${getState().xp}`), el('span', {}, 'total XP')),
    ),
    el('div', { class: 'summary-actions' },
      nextId ? el('a', { class: 'btn btn-primary btn-lg', href: `lesson.html?id=${nextId}` }, t('next_lesson')) : null,
      el('a', { class: 'btn btn-ghost btn-lg', href: 'learn.html' }, t('back_path')),
      el('a', { class: 'btn btn-ghost', href: `lesson.html?id=${lesson.id}` }, t('replay')),
    ),
    (() => {
      const badges = unlockedAchievements();
      if (!badges.length) return null;
      return el('div', { class: 'summary-badges' },
        el('h3', {}, '🏅 Achievements'),
        el('div', { class: 'badge-grid' }, badges.slice(-6).map(a =>
          el('div', { class: 'badge-card' }, el('span', { class: 'badge-icon' }, a.icon), el('div', {}, el('strong', {}, a.name), el('p', {}, a.desc))))));
    })()
  ));
}

function failScreen() {
  stage.innerHTML = '';
  setActionBar();
  sfx('wrong');
  stage.append(el('div', { class: 'summary card fail' },
    el('div', { class: 'summary-icon' }, '💔'),
    el('h1', {}, t('fail_title')),
    el('p', {}, `You got ${state.correct}/${lesson.exercises.length} correct. In Lao we say: <span class="lao">\u0ec4\u0ea1\u0ec8\u0ec0\u0e9b\u0eb1\u0e99\u0ec4\u0ea3</span> <i>(mai pen rai)</i> — "no worries". Try again!`),
    el('div', { class: 'summary-actions' },
      el('a', { class: 'btn btn-primary btn-lg', href: `lesson.html?id=${lesson.id}` }, t('try_again')),
      el('a', { class: 'btn btn-ghost', href: 'learn.html' }, 'Back to path'))));
  shake(stage);
}

renderExercise();
