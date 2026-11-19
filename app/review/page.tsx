'use client';

// Review: spaced repetition, two layers.
//   list    — lessons due for review (per-lesson SRS queue) + a "word drill"
//             card fed by the tricky-words notebook, the vocab of due lessons,
//             and a pinch of old vocabulary for flavor.
//   drill   — word items in mixed exercise types (listen → meaning,
//             Lao → meaning, meaning → Lao), multiple choice only, karaoke
//             romanization shown beside every Lao string. Wrong answers
//             requeue once and land in the notebook; right ones relieve it.
//   summary — accuracy, XP, the words practiced, replay / back to queue.
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import {
  getDueReviews, getUpcomingReviews, getWeakWords, addWeakWord, relieveWeakWord,
  getState, addXp, type ReviewEntry,
} from '@/lib/store';
import { LESSON_BY_ID } from '@/data/units.ts';
import { VOCAB, VOCAB_BY_ID } from '@/data/vocab.ts';
import type { VocabEntry } from '@/data/types.ts';
import { speakItem } from '@/lib/speech';
import { sfx, buzz, pop, shake, burstAt, confettiBurst } from '@/lib/fx';
import { H } from '@/components/H';
import { esc } from '@/components/lesson/Screens';
import { shuffle } from '@/lib/shuffle';
import { useShell } from '@/components/SiteShell';

const PRACTICE_SIZE = 12;

type Kind = 'listen' | 'meaning' | 'recall';
type Item = { w: VocabEntry; kind: Kind; tries: number };
type Opt = { label: string; sub?: string; correct: boolean };

// Vocab ids featured by a lesson (through its exercises: option ids, answer
// ids, typed-word ids).
function lessonVocabIds(lessonId: string): string[] {
  const l = LESSON_BY_ID[lessonId];
  if (!l) return [];
  const ids: string[] = [];
  for (const ex of l.exercises) {
    if (ex.ids) ids.push(...ex.ids);
    if (ex.id) ids.push(ex.id);
  }
  return ids;
}

function buildPractice(): Item[] {
  const s = getState();
  const now = Date.now();
  // 1. tricky words first (the notebook), each once — mixed kinds
  const weak = getWeakWords()
    .filter((w) => VOCAB_BY_ID[w.id])
    .map((w) => VOCAB_BY_ID[w.id]);
  // 2. vocabulary of lessons due (or overdue) for review
  const dueLessonIds = Object.entries(s.reviews || {})
    .filter(([, v]) => v.due <= now)
    .map(([id]) => id);
  const dueVocab = [...new Set(dueLessonIds.flatMap(lessonVocabIds))]
    .map((wid) => VOCAB_BY_ID[wid])
    .filter((w): w is VocabEntry => !!w);
  // 3. flavor: words from completed lessons, else the whole dictionary
  const doneIds = Object.keys(s.done || {});
  const doneVocab = [...new Set(doneIds.flatMap(lessonVocabIds))]
    .map((wid) => VOCAB_BY_ID[wid])
    .filter((w): w is VocabEntry => !!w);
  const weakSet = new Set(weak);
  const dueSet = new Set(dueVocab);
  const flavorPool = doneVocab.length ? doneVocab : VOCAB;
  const flavor = flavorPool.filter((w) => !weakSet.has(w) && !dueSet.has(w));

  const kinds: Kind[] = ['listen', 'meaning', 'recall'];
  const picks: Item[] = [
    ...weak.map((w) => ({ w, kind: kinds[Math.floor(Math.random() * 3)], tries: 0 })),
    ...shuffle(dueVocab).slice(0, 8).map((w) => ({ w, kind: kinds[Math.floor(Math.random() * 3)], tries: 0 })),
  ];
  // fill towards the target size from the flavor pool
  const fill = Math.max(4, PRACTICE_SIZE - picks.length);
  picks.push(...shuffle(flavor).slice(0, fill).map((w) => ({ w, kind: kinds[Math.floor(Math.random() * 3)], tries: 0 })));
  const seen = new Set<string>();
  return shuffle(
    picks.filter((it) => {
      const key = `${it.w.id}:${it.kind}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  ).slice(0, PRACTICE_SIZE);
}

// Four options in the exercise language; for recall they are Lao glyphs with
// their karaoke reading as a subtitle (reading practice, not the answer key).
function makeOpts(it: Item, def: (w: { en: string; fr?: string } | null | undefined) => string | undefined): Opt[] {
  if (it.kind === 'recall') {
    const pool = VOCAB.filter((v) => v.id !== it.w.id && v.lao !== it.w.lao && v.romanization !== it.w.romanization);
    const ds = shuffle(pool).slice(0, 3);
    return shuffle([it.w, ...ds]).map((w) => ({
      label: w.lao, sub: w.romanization, correct: w.id === it.w.id,
    }));
  }
  const mean = def(it.w) || it.w.en;
  const seen = new Set([mean]);
  const ds: string[] = [];
  for (const v of shuffle(VOCAB)) {
    if (ds.length >= 3) break;
    const d = def(v) || v.en;
    if (!d || seen.has(d)) continue;
    seen.add(d);
    ds.push(d);
  }
  return shuffle([mean, ...ds]).map((d) => ({ label: d, correct: d === mean }));
}

export default function ReviewPage() {
  const { t, tRaw, pickVariant, def, pf, lang } = useT();
  const { pingStats } = useShell();
  const [mode, setMode] = useState<'list' | 'drill' | 'summary'>('list');
  const [due, setDue] = useState<Array<{ id: string } & ReviewEntry>>([]);
  const [upcoming, setUpcoming] = useState<Array<{ id: string } & ReviewEntry>>([]);
  const [weakCount, setWeakCount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [opts, setOpts] = useState<Opt[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Opt | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [practiced, setPracticed] = useState<VocabEntry[]>([]);
  // one advance per question — the auto-advance timer and the CONTINUE
  // button share it so neither can skip two questions
  const advancedFor = useRef(-1);

  useEffect(() => {
    setDue(getDueReviews());
    setUpcoming(getUpcomingReviews());
    setWeakCount(getWeakWords().filter((w) => VOCAB_BY_ID[w.id]).length);
  }, [mode]);

  const totalQ = items.length;
  const current: Item | null = items[idx] ?? null;

  // Auto-play the audio for listening questions (small delay so the
  // transition settles).
  useEffect(() => {
    if (mode !== 'drill') return;
    const it = items[idx];
    if (!it || it.kind !== 'listen') return;
    const id = window.setTimeout(() => { void speakItem(it.w); }, 420);
    return () => window.clearTimeout(id);
  }, [mode, idx, items]);

  // Re-ask the current question when the language changes mid-drill —
  // options are language-dependent state.
  useEffect(() => {
    const it = items[idx];
    if (it && mode === 'drill' && !picked) setOpts(makeOpts(it, def));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function refreshList() {
    setDue(getDueReviews());
    setUpcoming(getUpcomingReviews());
    setWeakCount(getWeakWords().filter((w) => VOCAB_BY_ID[w.id]).length);
  }

  function startPractice() {
    const q = buildPractice();
    if (!q.length) return;
    setItems(q);
    setIdx(0);
    setOpts(makeOpts(q[0], def));
    setPicked(null);
    setMistakes(0);
    setAnswered(0);
    setXpEarned(0);
    setPracticed([]);
    advancedFor.current = -1;
    setMode('drill');
  }

  function finish() {
    setPicked(null);
    setMode('summary');
    void addXp(2).then(() => pingStats()).catch(() => pingStats());
    sfx('fanfare');
    confettiBurst(70);
  }

  function answer(o: Opt, e?: React.MouseEvent<HTMLButtonElement>) {
    if (!current || picked) return;
    setPicked(o);
    setAnswered((n) => n + 1);
    if (o.correct) {
      if (e) {
        pop(e.currentTarget);
        const r = e.currentTarget.getBoundingClientRect();
        burstAt(r.left + r.width / 2, r.top + r.height / 2, 14);
      }
      sfx('correct');
      buzz([12, 30, 12]);
      relieveWeakWord(current.w.id);
      setXpEarned((n) => n + 1);
      setPracticed((ps) => (ps.some((p) => p.id === current.w.id) ? ps : [...ps, current.w]));
      window.setTimeout(() => next(), 950);
    } else {
      if (e) shake(e.currentTarget);
      sfx('wrong');
      buzz(70);
      setMistakes((m) => m + 1);
      addWeakWord(current.w.id);
      if (current.tries < 1) {
        const again: Item = { ...current, tries: current.tries + 1 };
        setItems((prev) => {
          const merged = [...prev, again];
          return merged;
        });
      }
    }
  }

  function next() {
    if (advancedFor.current === idx) return;
    advancedFor.current = idx;
    const n = idx + 1;
    if (n >= items.length) { finish(); return; }
    setIdx(n);
    setPicked(null);
    setOpts(makeOpts(items[n], def));
  }

  // ---------- list ----------
  if (mode === 'list') {
    return (
      <>
        <div className="page-head">
          <h1>🔁 {t('review_title')}</h1>
          <p className="section-sub">{t('review_sub')}</p>
        </div>

        <div className="card practice-card">
          <div className="practice-head">
            <span className="practice-ico" aria-hidden="true">🏋️</span>
            <div>
              <strong>{t('rev_practice_title')}</strong>
              <p className="section-sub">
                {weakCount === 1
                  ? t('rev_practice_sub_one', { x: weakCount })
                  : weakCount > 1
                    ? t('rev_practice_sub', { x: weakCount })
                    : t('rev_practice_sub_any')}
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={startPractice}>{t('rev_practice_start')} →</button>
        </div>

        {!due.length && !upcoming.length ? (
          <div className="card" style={{ textAlign: 'center', maxWidth: 560, margin: '1rem auto' }}>
            <p style={{ fontSize: '1.1rem' }}>{t('review_none')}</p>
            <Link className="btn btn-primary" href="/learn" style={{ marginTop: '1rem' }}>{t('nav_learn')} →</Link>
          </div>
        ) : (
          <>
            {due.length ? (
              <section className="unit-section">
                <h2>🔥 {t('review_due')} ({due.length})</h2>
                <div className="lessons-path" style={{ marginLeft: 0 }}>
                  {due.map((l) => <LessonRow key={l.id} l={l} dueNow />)}
                </div>
              </section>
            ) : null}
            {upcoming.length ? (
              <section className="unit-section">
                <h2>⏳ {t('review_upcoming')} ({upcoming.length})</h2>
                <div className="lessons-path" style={{ marginLeft: 0 }}>
                  {upcoming.slice(0, 10).map((l) => <LessonRow key={l.id} l={l} dueNow={false} />)}
                </div>
              </section>
            ) : null}
          </>
        )}
      </>
    );
  }

  // ---------- summary ----------
  if (mode === 'summary') {
    return (
      <div className="fx-stage">
        <div className="summary-card card">
          <div className="summary-star">{mistakes ? '💪' : '⭐'}</div>
          <h2>{t('rev_done_title')}</h2>
          <div className="summary-letters">
            {practiced.map((w) => (
              <span key={w.id} className="gl">
                <span className="lao">{w.lao}</span>
                <span className="word-romanization">{w.romanization}</span>
              </span>
            ))}
          </div>
          <p className="alpha-note">
            {t('alpha_mistakes', { x: mistakes })} · <strong>{t('alpha_xp_earned', { x: xpEarned + 2 })}</strong>
          </p>
        </div>
        <div className="summary-actions">
          <button className="btn btn-primary btn-lg" onClick={startPractice}>🔁 {t('rev_practice_start')}</button>
          <button className="btn btn-ghost btn-lg" onClick={() => { setMode('list'); refreshList(); }}>{t('alpha_back')}</button>
        </div>
      </div>
    );
  }

  // ---------- drill ----------
  if (!current) return null;
  const meaning = def(current.w) || current.w.en;
  const prompt = current.kind === 'listen'
    ? t('rev_q_listen')
    : current.kind === 'meaning'
      ? t('rev_q_meaning')
      : t('rev_q_recall');

  return (
    <div className="fx-stage" key={`${current.w.id}-${current.kind}-${current.tries}-${idx}`}>
      <div className="page-head alpha-drill-head">
        <button className="btn btn-ghost" onClick={() => { setMode('list'); refreshList(); }}>← {t('alpha_back')}</button>
        <span className="alpha-progress">{t('alpha_count', { x: Math.min(answered + 1, totalQ || 1), y: totalQ })}</span>
      </div>
      <div className="session-bar" aria-hidden="true"><div style={{ width: `${Math.round((100 * answered) / Math.max(1, totalQ))}%` }} /></div>

      {current.kind === 'listen' ? (
        <div className="big-word card drill-card rev-listen-card">
          <button className="icon-btn listen-play" title={t('rev_q_listen')} aria-label={t('rev_q_listen')} onClick={() => { void speakItem(current.w); }}>🔊</button>
        </div>
      ) : current.kind === 'meaning' ? (
        <div className="big-word card drill-card">
          <div className="alpha-glyph-lg lao">{current.w.lao}</div>
          <div className="word-romanization">{current.w.romanization}</div>
          <button className="icon-btn speak-btn" title="🔊" aria-label="🔊" onClick={() => { void speakItem(current.w); }}>🔊</button>
        </div>
      ) : (
        <div className="big-word card drill-card">
          <div className="rev-meaning-lg">{meaning}</div>
          <div className="word-romanization">{t('rev_in_lao')}</div>
        </div>
      )}

      <p className="drill-prompt">{prompt}</p>

      <div className="options">
        {opts.map((o, i) => {
          const cls = [
            'option-card',
            current.kind === 'recall' ? 'glyph-option' : '',
            picked && o.correct ? 'correct' : '',
            picked === o && !o.correct ? 'wrong' : '',
          ].filter(Boolean).join(' ');
          return (
            <button key={`${o.label}:${i}`} className={cls} disabled={!!picked} onClick={(e) => answer(o, e)}>
              {current.kind === 'recall'
                ? (
                  <>
                    <span className="lao glyph-only" aria-hidden="true">{o.label}</span>
                    <span className="word-romanization">{o.sub}</span>
                  </>
                )
                : <span className="rev-meaning">{o.label}</span>}
              <span className="kbd" aria-hidden="true">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {picked ? (
        <div className={`feedback ${picked.correct ? 'ok' : 'bad'}`}>
          <img src="/img/elephant.svg" alt="" className={`feedback-mascot${picked.correct ? '' : ' somber'}`} aria-hidden="true" />
          <div className="feedback-icon" aria-hidden="true">{picked.correct ? '🎉' : '💡'}</div>
          <div>
            {picked.correct ? (
              <H
                as="p"
                html={`${esc(pickVariant(tRaw('fb_ok_variants')))} · +1 XP<br/><span class="lao">${esc(current.w.lao)}</span> <span class="word-romanization">${esc(current.w.romanization)}</span> — ${esc(meaning)}`}
              />
            ) : (
              <H
                as="p"
                html={`${esc(tRaw('fb_bad'))}<br/>${tRaw('fb_correct_answer').replace('{x}', `<span class="lao">${esc(current.w.lao)}</span> <span class="word-romanization">(${esc(current.w.romanization)})</span> — ${esc(meaning)}`)}`}
              />
            )}
          </div>
          {!picked.correct ? (
            <button className="btn btn-continue btn-lg" onClick={next}>{t('cont')}</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function LessonRow({ l, dueNow }: { l: { id: string } & ReviewEntry; dueNow: boolean }) {
  const { t, pf } = useT();
  const meta = LESSON_BY_ID[l.id];
  return (
    <Link className={`lesson-node${dueNow ? '' : ' locked'}`} href={`/lesson?id=${l.id}`}>
      <div className="lesson-circle" style={{ ['--unit-color' as string]: '#8b5cf6' }}>{dueNow ? '🔁' : '⏳'}</div>
      <div className="lesson-meta">
        <strong>{meta ? pf(meta, 'title') ?? meta.id : l.id}</strong>
        <span>{dueNow ? t('review_start') : new Date(l.due).toLocaleString()}</span>
      </div>
    </Link>
  );
}
