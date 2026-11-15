// HianLao lesson engine: renders one exercise at a time, hearts, XP, feedback,
// and a summary screen. Exercises come from data/units.js.
import { el, renderShell, shuffle, laoSpan, speakBtn } from './main.js';
import { t } from './ui.js';
import { VOCAB_BY_ID as V } from './data/vocab.js';
import { LESSON_BY_ID, UNITS } from './data/units.js';
import { addXp, markDone, isDone, getState, scheduleReview, scheduleWeakReview, getWeakWords, addWeakWord, relieveWeakWord } from './store.js';
import { unlockedAchievements } from './achievements.js';
import { speakItem, speak, canRecognize, recognize, normalize, speechMatches, hasLaoVoice, hasNativeAudio } from './speech.js';
import { sfx, buzz, shake, pop, pulse, xpFly, confettiBurst } from './fx.js';

const params = new URLSearchParams(location.search);
const lessonId = params.get('id') || 'u1l1';

// 'Tricky words' drill: a synthetic lesson built from words you missed before.
function buildWeakLesson() {
  const ids = getWeakWords().map(w => w.id).filter(id => V[id]);
  const lessonShell = { id: '__weak', title: t('drill_title'), blurb: t('drill_blurb'), __weak: true };
  if (!ids.length) return { ...lessonShell, exercises: [] };
  const all = Object.values(V);
  const pool = shuffle(ids).slice(0, 8);
  const exercises = pool.flatMap(id => {
    const others = shuffle(all.filter(x => x.cat === V[id].cat && x.id !== id)).slice(0, 3).map(x => x.id);
    return shuffle([
      { type: 'mc', dir: 'lao2en', ids: [id, ...others], answer: id },
      { type: 'listen', ids: [id, ...others], answer: id },
      { type: 'type', dir: 'en2lao', id },
    ]);
  });
  return { ...lessonShell, exercises };
}

const lesson = lessonId === '__weak' ? buildWeakLesson() : LESSON_BY_ID[lessonId];

renderShell('learn');
document.body.classList.add('in-lesson');

const app = document.getElementById('app');

if (!lesson) {
  app.append(el('div', { class: 'card error-card' },
    el('h1', {}, t('lesson_not_found')),
    el('p', {}, t('lesson_not_found_sub').replace('{x}', lessonId)),
    el('a', { class: 'btn btn-primary', href: 'learn.html' }, t('back_path'))));
  throw new Error(`unknown lesson ${lessonId}`);
}

document.title = `${lesson.title} — HianLao`;

const XP_PER_CORRECT = 10;
const PRACTICE_XP = 5;
const state = {
  hearts: 5,
  correct: 0,
  xpEarned: 0,
  answered: false,
  failed: false,
  combo: 0,
  solved: 0,            // exercises finished (retries included)
  requeued: 0,          // retries pushed back for spacing
  missed: new Set(),    // original indexes missed on the first pass
  practiceMode: false,
  practiceTotal: 0,
  practiceXp: 0,
  blurbShown: false,
};
let queue = lesson.exercises.map((ex, i) => ({ ex, origin: i, isRetry: false }));
let current = null;

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
  const total = lesson.exercises.length + state.requeued;
  const done = state.practiceMode ? state.practiceTotal - queue.length : state.solved;
  progressFill.style.width = `${((state.practiceMode ? state.practiceTotal : total) > 0 ? done / (state.practiceMode ? state.practiceTotal : total) : 1) * 100}%`;
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

function feedbackBanner(ok, correctText, explain) {
  const xp = state.practiceMode ? PRACTICE_XP : XP_PER_CORRECT;
  return el('div', { class: `feedback ${ok ? 'ok' : 'bad'}` },
    el('div', { class: 'feedback-icon' }, ok ? '🎉' : '💡'),
    el('div', {},
      el('strong', {}, ok ? pick(t('fb_ok_variants').split('|')) : t('fb_bad')),
      !ok ? el('p', { html: t('fb_correct_answer').replace('{x}', correctText) }) : el('p', {}, `+${xp} XP · ${pick(t('fb_praise').split('|'))}`),
      (!ok && explain) ? el('p', { class: 'feedback-note' }, explain) : null,
    ),
    el('button', { class: 'btn btn-continue btn-lg', onclick: () => next() }, t('cont')));
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function currentNote() {
  const ex = current && current.ex;
  if (!ex) return null;
  if (ex.type === 'mc' || ex.type === 'listen') return V[ex.answer]?.note || null;
  if (ex.type === 'type' || ex.type === 'speak') return V[ex.id]?.note || null;
  return null;
}

function comboToast(n) {
  sfx('combo');
  buzz([12, 40, 12]);
  xpFly(`🔥 ×${n} ${t('combo_word')}`, innerWidth / 2, Math.max(innerHeight * 0.2, 90));
}

function next() {
  if (!state.practiceMode && state.hearts <= 0) return failScreen();
  if (!queue.length) return state.practiceMode ? practiceDoneScreen() : summaryScreen();
  current = queue.shift();
  state.answered = false;
  renderExercise();
}

// ---------- exercise renderers ----------
function renderExercise() {
  updateTopbar();
  stage.innerHTML = '';
  setActionBar();
  window.scrollTo(0, 0);
  const ex = current.ex;
  const head = el('div', { class: 'exercise-head' },
    el('h2', {}, exTitle(ex)),
    exPrompt(ex) ? el('p', { class: 'exercise-prompt', html: exPrompt(ex) }) : null,
  );
  if (!state.practiceMode && !state.blurbShown && lesson.blurb) {
    state.blurbShown = true;
    stage.append(el('div', { class: 'card context-card' },
      el('p', { class: 'context-blurb' }, lesson.blurb)));
  }
  if (state.practiceMode) {
    stage.append(el('div', { class: 'retry-note' }, '🛠️ ' + t('practice_mode')));
  } else if (current.isRetry) {
    stage.append(el('div', { class: 'retry-note' }, '🔁 ' + t('again_note')));
  }
  stage.append(head, exBody(ex));
}

function exTitle(ex) {
  switch (ex.type) {
    case 'mc': return ex.dir === 'lao2en' ? t('ex_mc_lao2en') : t('ex_mc_en2lao');
    case 'type': return ex.dir === 'lao2en' ? t('ex_type_lao2en') : t('ex_type_en2lao');
    case 'match': return t('ex_match');
    case 'listen': return t('ex_listen');
    case 'tiles': return t('ex_tiles');
    case 'speak': return t('ex_speak');
    default: return t('ex_generic');
  }
}

function exPrompt(ex) {
  if (ex.type === 'mc' && ex.dir === 'en2lao') return t('prompt_mc_en2lao').replace('{x}', V[ex.answer].en);
  if (ex.type === 'type' && ex.dir === 'lao2en') return null;
  if (ex.type === 'type' && ex.dir === 'en2lao') return t('prompt_type_en2lao').replace('{x}', V[ex.id].en);
  if (ex.type === 'listen') return t('prompt_listen');
  if (ex.type === 'tiles') return t('prompt_tiles').replace('{x}', ex.en);
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
        el('div', { class: 'word-romanization' }, V[ex.answer].romanization),
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
      resolveAnswer(id === ex.answer, `${a.lao} — ${a.romanization} — ${a.en}`);
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
      el('div', { class: 'word-romanization' }, item.romanization),
      speakBtn(item)));
  } else {
    body.append(el('div', { class: 'big-word card' }, el('div', { class: 'word-en-lg' }, item.en)));
  }
  const input = el('input', { class: 'type-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: ex.dir === 'lao2en' ? t('ph_type_en') : t('ph_type_lao') });
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
    else ok = val === normalize(item.lao) || val === normalize(item.romanization);
    state.answered = true;
    if (!ok) shake(input);
    resolveAnswer(ok, ex.dir === 'lao2en' ? item.en : `${item.lao} (${item.romanization})`);
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
  const updateHint = () => { hint.textContent = t('hint_match').replace('{x}', matched.size).replace('{y}', items.length); };
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
  const play = el('button', { class: 'play-btn', title: t('title_play_audio'), 'aria-label': t('title_play_audio') }, '🔊');
  play.addEventListener('click', () => { speakItem(answer); play.classList.add('playing'); setTimeout(() => play.classList.remove('playing'), 1200); });
  body.append(
    el('div', { class: 'big-word card listen-card' },
      play,
      (hasNativeAudio(answer) || hasLaoVoice())
        ? el('p', { class: 'muted' }, t('listen_play'))
        : el('p', { class: 'muted', html: t('listen_novoice').replace('{x}', answer.romanization) })),
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
      resolveAnswer(id === ex.answer, `${answer.lao} — ${answer.romanization} — ${answer.en}`);
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
  const answerArea = el('div', { class: 'tile-answer' }, el('span', { class: 'muted' }, t('ph_tiles')));
  const chosen = [];
  const btn = checkBtn();
  btn.disabled = true;
  const submit = () => {
    if (state.answered || !chosen.length) return;
    state.answered = true;
    const ok = chosen.join('') === ex.lao;
    if (!ok) shake(answerArea);
    resolveAnswer(ok, `${ex.lao} — ${ex.romanization}`);
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
    if (!chosen.length) answerArea.append(el('span', { class: 'muted' }, t('ph_tiles')));
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
      el('div', { class: 'word-romanization' }, ex.romanization)),
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
      el('div', { class: 'word-romanization' }, item.romanization),
      el('div', { class: 'word-en' }, item.en),
      speakBtn(item)),
  );
  const status = el('p', { class: 'muted speak-status' }, '');
  if (canRecognize()) {
    const mic = el('button', { class: 'btn btn-mic btn-lg' }, t('speak_tap'));
    mic.addEventListener('click', async () => {
      mic.disabled = true;
      status.textContent = t('speak_listening');
      const transcript = await recognize({ lang: 'lo-LA' });
      mic.disabled = false;
      if (state.answered) return;
      if (transcript === null) {
        status.textContent = t('speak_missed');
        return;
      }
      status.textContent = t('speak_heard').replace('{x}', transcript);
      state.answered = true;
      resolveAnswer(speechMatches(transcript, item), `${item.lao} — ${item.romanization}`);
    });
    body.append(mic, status);
    const skip = el('button', { class: 'btn btn-ghost' }, t('speak_said'));
    skip.addEventListener('click', () => {
      if (state.answered) return;
      state.answered = true;
      status.textContent = t('speak_listening');
      resolveAnswer(true, `${item.lao} — ${item.romanization}`);
    });
    body.append(skip);
  } else {
    body.append(
      el('p', { class: 'muted' }, t('speak_nomic')),
      status,
    );
    const said = el('button', { class: 'btn btn-primary btn-lg' }, t('speak_said_loud'));
    said.addEventListener('click', () => {
      if (state.answered) return;
      state.answered = true;
      resolveAnswer(true, `${item.lao} — ${item.romanization}`);
    });
    body.append(said);
  }
  setActionBar(el('span', { class: 'action-spacer' }), el('span', { class: 'action-hint' }, t('speak_hint')));
  return body;
}

// ---------- answer resolution ----------
// Feedback (and the CONTINUE button) live in the fixed bottom action bar, so
// they are always visible — and the stage controls are locked before the
// banner exists, so CONTINUE can never end up disabled.
function resolveAnswer(ok, correctText) {
  if (ok) {
    state.solved++;
    state.combo++;
    if (state.practiceMode) {
      state.practiceXp += PRACTICE_XP;
    } else {
      state.correct++;
      state.xpEarned += XP_PER_CORRECT;
    }
    const wid = current.ex.answer || current.ex.id;
    if (wid && (lesson.__weak || state.practiceMode)) relieveWeakWord(wid);
  } else {
    state.combo = 0;
    if (state.practiceMode) {
      // Practice: mistakes simply come back until they are fixed.
      queue.push({ ...current, isRetry: true });
    } else {
      state.hearts = Math.max(0, state.hearts - 1);
      if (current.origin != null) state.missed.add(current.origin);
      state.requeued++;
      addWeakWord(current.ex.answer || current.ex.id);
      queue.push({ ...current, isRetry: true });
    }
  }
  if (ok && (state.combo === 3 || state.combo === 5 || state.combo === 8 || state.combo === 12 || state.combo === 16)) {
    comboToast(state.combo);
  }
  updateTopbar();
  stage.querySelectorAll('.option-card, .tile, input, button').forEach(n => { n.disabled = true; });
  const banner = feedbackBanner(ok, correctText, currentNote());
  setActionBar(banner);
  if (ok) {
    sfx('correct');
    buzz([12, 30, 12]);
    pop(stage.querySelector('.option-card.correct') || stage);
    const r = heartsEl.getBoundingClientRect();
    xpFly(`+${state.practiceMode ? PRACTICE_XP : XP_PER_CORRECT} XP`, r.left + r.width / 2, r.top);
    pulse(document.querySelector('.xp-pill'));
  } else {
    sfx('wrong');
    buzz(70);
    shake(stage);
    shake(heartsEl);
  }
  if (state.hearts <= 0) {
    banner.querySelector('.btn-continue').textContent = t('see_result');
  }
}

// ---------- summary / fail ----------
function nextLessonId() {
  const all = UNITS.flatMap(u => u.lessons.map(l => l.id));
  const i = all.indexOf(lesson.id);
  return i >= 0 && i < all.length - 1 ? all[i + 1] : null;
}

function summaryScreen() {
  const total = state.solved; // includes retries — accuracy reflects real effort
  const acc = total ? Math.round((state.correct / total) * 100) : 0;
  addXp(state.xpEarned);
  if (!lesson.__weak) {
    markDone(lesson.id);
    scheduleReview(lesson.id);
    if (state.missed.size) scheduleWeakReview(lesson.id);
  }
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
    el('p', { class: 'summary-lao', html: t('summary_lao') }),
    el('p', {}, t('summary_line').replace('{title}', lesson.title).replace('{x}', state.correct).replace('{y}', total).replace('{z}', acc)),
    el('div', { class: 'summary-stats' },
      el('div', { class: 'stat' }, el('strong', {}, `+${state.xpEarned}`), el('span', {}, t('stat_xp'))),
      el('div', { class: 'stat' }, el('strong', {}, `${acc}%`), el('span', {}, t('stat_acc'))),
      el('div', { class: 'stat' }, el('strong', {}, `⚡ ${getState().xp}`), el('span', {}, t('stat_total_xp'))),
    ),
    el('div', { class: 'summary-actions' },
      nextId ? el('a', { class: 'btn btn-primary btn-lg', href: `lesson.html?id=${nextId}` }, t('next_lesson')) : null,
      (state.missed.size) ? el('button', { class: 'btn btn-ghost btn-lg', onclick: startPractice }, `${t('practice_mistakes')} (${state.missed.size})`) : null,
      el('a', { class: 'btn btn-ghost btn-lg', href: 'learn.html' }, t('back_path')),
      el('a', { class: 'btn btn-ghost', href: `lesson.html?id=${lesson.id}` }, t('replay')),
    ),
    (() => {
      const badges = unlockedAchievements();
      if (!badges.length) return null;
      return el('div', { class: 'summary-badges' },
        el('h3', {}, t('summary_achievements')),
        el('div', { class: 'badge-grid' }, badges.slice(-6).map(a =>
          el('div', { class: 'badge-card' }, el('span', { class: 'badge-icon' }, a.icon), el('div', {}, el('strong', {}, a.name), el('p', {}, a.desc))))));
    })()
  ));
}

// ---------- practice-mistakes loop ----------
// Duolingo-style: after a lesson, redo until every miss is fixed.
// No heart loss, small XP per correct answer.
function startPractice() {
  state.practiceMode = true;
  state.practiceTotal = state.missed.size;
  state.practiceXp = 0;
  queue = [...state.missed].map(i => ({ ex: lesson.exercises[i], origin: i, isRetry: false }));
  current = null;
  stage.innerHTML = '';
  setActionBar();
  sfx('click');
  next();
}

function practiceDoneScreen() {
  addXp(state.practiceXp);
  progressFill.style.width = '100%';
  stage.innerHTML = '';
  setActionBar();
  sfx('fanfare');
  confettiBurst();
  const nextId = nextLessonId();
  const icon = el('div', { class: 'summary-icon' }, '🛠️');
  pop(icon);
  stage.append(el('div', { class: 'summary card' },
    icon,
    el('h1', {}, t('practice_done_title')),
    el('p', {}, t('practice_done_sub')),
    el('div', { class: 'summary-stats' },
      el('div', { class: 'stat' }, el('strong', {}, `+${state.practiceXp}`), el('span', {}, '⚡ XP earned')),
      el('div', { class: 'stat' }, el('strong', {}, `⚡ ${getState().xp}`), el('span', {}, t('stat_total_xp'))),
    ),
    el('div', { class: 'summary-actions' },
      nextId ? el('a', { class: 'btn btn-primary btn-lg', href: `lesson.html?id=${nextId}` }, t('next_lesson')) : null,
      el('a', { class: 'btn btn-ghost btn-lg', href: 'learn.html' }, t('back_path')),
    ),
  ));
}

function failScreen() {
  stage.innerHTML = '';
  setActionBar();
  sfx('wrong');
  stage.append(el('div', { class: 'summary card fail' },
    el('div', { class: 'summary-icon' }, '💔'),
    el('h1', {}, t('fail_title')),
    el('p', { html: t('fail_sub').replace('{x}', state.correct).replace('{y}', lesson.exercises.length) }),
    el('div', { class: 'summary-actions' },
      el('a', { class: 'btn btn-primary btn-lg', href: `lesson.html?id=${lesson.id}` }, t('try_again')),
      el('a', { class: 'btn btn-ghost', href: 'learn.html' }, t('back_path')))));
  shake(stage);
}

// Keyboard comfort (desktop): 1-9 pick an option/tile, Enter continues.
// Tap-to-validate means one keystroke answers — same as a tap.
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.key === 'Enter') {
    const cont = document.querySelector('.lesson-actionbar .btn-continue');
    const primary = document.querySelector('.summary-actions .btn-primary');
    if (cont) cont.click();
    else if (primary) primary.click();
    return;
  }
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 9) {
    const tiles = [...document.querySelectorAll('.lesson-stage .tile-bank .tile:not(.chosen):not([disabled])')];
    const opts = [...document.querySelectorAll('.lesson-stage .option-card:not([disabled])')];
    const list = tiles.length ? tiles : opts;
    if (list[n - 1]) list[n - 1].click();
  }
});

if (lesson.exercises.length) next(); // kicks off the queue
else app.append(el('div', { class: 'card error-card' },
  el('h1', {}, t('weak_empty_title')),
  el('p', {}, t('weak_empty')),
  el('a', { class: 'btn btn-primary', href: 'words.html' }, t('nav_words') + ' →')));
