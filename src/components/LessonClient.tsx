'use client';

// Lesson engine (React port of legacy lesson.js): one exercise at a time,
// hearts, XP, combo, feedback in a fixed bottom action bar, retry queue,
// practice-mistakes loop and summary screens. Tap-to-validate everywhere:
// exact-match word banks auto-submit themselves, MC/listen submit on tap,
// match resolves when every pair is linked.
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useT } from '@/lib/i18n';
import {
  addXp, markDone, getState, scheduleReview, scheduleWeakReview,
  getWeakWords, addWeakWord, relieveWeakWord,
} from '@/lib/store';
import { unlockedAchievements } from '@/lib/achievements';
import { sfx, buzz, shake, pop, pulse, xpFly, confettiBurst } from '@/lib/fx';
import { shuffle } from '@/lib/shuffle';
import { VOCAB_BY_ID as V } from '@/data/vocab.ts';
import { LESSON_BY_ID, UNITS } from '@/data/units.ts';
import type { Exercise, Lesson, VocabEntry } from '@/data/types';
import { ExerciseView } from '@/components/lesson/ExerciseView';
import { Feedback, FailScreen, SummaryScreen, esc } from '@/components/lesson/Screens';

const XP_PER_CORRECT = 10;
const PRACTICE_XP = 5;

interface QueueItem { ex: Exercise; origin: number | null; isRetry: boolean }
interface Banner { ok: boolean; correctText: string }
type Phase = 'lesson' | 'summary' | 'practice-done' | 'fail' | 'empty';

interface EngineState {
  hearts: number;
  correct: number;
  xpEarned: number;
  combo: number;
  solved: number;             // exercises finished (retries included)
  requeued: number;           // retries pushed back for spacing
  answered: boolean;
  missed: number[];           // original indexes missed on the first pass
  practiceMode: boolean;
  practiceTotal: number;
  practiceXp: number;
  blurbShown: boolean;
  queue: QueueItem[];
  cur: QueueItem | null;
  phase: Phase;
  exKey: number;              // remount key per exercise step
  banner: Banner | null;
}

function initState(lesson: Lesson | null): EngineState {
  const queue: QueueItem[] = (lesson?.exercises ?? []).map((ex, i) => ({ ex, origin: i, isRetry: false }));
  return {
    hearts: 5, correct: 0, xpEarned: 0, combo: 0,
    solved: 0, requeued: 0, answered: false, missed: [],
    practiceMode: false, practiceTotal: 0, practiceXp: 0, blurbShown: false,
    queue: queue.slice(1),
    cur: queue[0] ?? null,
    phase: (lesson?.exercises.length ?? 0) ? 'lesson' : 'empty',
    exKey: 0,
    banner: null,
  };
}

export default function LessonClient() {
  const { t, pf, def, noteOf, pickVariant } = useT();
  void pickVariant;
  const params = useSearchParams();
  const lessonId = params.get('id') || 'u1l1';

  // Build the lesson once per URL (the tricky-words drill is randomized per visit).
  const lesson = useMemo<Lesson | null>(() => {
    if (lessonId === '__weak') {
      return { id: '__weak', title: t('drill_title'), titleFr: t('drill_title'), blurb: t('drill_blurb'), blurbFr: t('drill_blurb'), exercises: [] };
    }
    return LESSON_BY_ID[lessonId] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // The tricky-words drill needs exercises built after mount (localStorage reads).
  const [weakLesson, setWeakLesson] = useState<Lesson | null>(lessonId === '__weak'
    ? { id: '__weak', title: t('drill_title'), titleFr: t('drill_title'), blurb: t('drill_blurb'), blurbFr: t('drill_blurb'), exercises: [] }
    : null);
  const [state, setState] = useState<EngineState>(() => initState(lesson));
  const st = useRef(state);
  st.current = state;
  const isWeak = lessonId === '__weak';
  const activeLesson = isWeak ? weakLesson : lesson;

  useEffect(() => {
    if (lessonId !== '__weak') return;
    setWeakLesson(buildWeakLesson(t('drill_title'), t('drill_blurb')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // once the drill is built, (re)start the engine on it
  useEffect(() => {
    if (lessonId === '__weak' && weakLesson && weakLesson.exercises.length) {
      setState(initState(weakLesson));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, weakLesson]);

  useEffect(() => {
    if (!activeLesson) return;
    document.title = `${pf(activeLesson, 'title')} — HianLao`;
  }, [activeLesson, pf]);

  // In-lesson chrome: legacy CSS hides the site header/footer via body class.
  useEffect(() => {
    document.body.classList.add('in-lesson');
    return () => { document.body.classList.remove('in-lesson'); };
  }, []);

  // Persisted effects when a terminal phase is reached (once per entry).
  const phaseSeen = useRef<Phase>('lesson');
  useEffect(() => {
    if (state.phase === phaseSeen.current) return;
    phaseSeen.current = state.phase;
    if (state.phase === 'summary' && activeLesson) {
      addXp(state.xpEarned);
      if (!isWeak) {
        markDone(activeLesson.id);
        scheduleReview(activeLesson.id);
        if (state.missed.length) scheduleWeakReview(activeLesson.id);
      }
      sfx('fanfare');
      confettiBurst();
    } else if (state.phase === 'practice-done') {
      addXp(state.practiceXp);
      sfx('fanfare');
      confettiBurst();
    } else if (state.phase === 'fail') {
      sfx('wrong');
    }
  }, [state.phase, state.xpEarned, state.practiceXp, state.missed, activeLesson, isWeak]);

  // ---- engine actions ----
  const comboRef = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (state.combo >= 2) pop(comboRef.current); }, [state.combo]);

  const resolveAnswer = useCallback((ok: boolean, correctText: string) => {
    const s = st.current;
    if (s.answered || !s.cur) return;
    const wid = s.cur.ex.answer || s.cur.ex.id;

    if (ok) {
      if (wid && (isWeak || s.practiceMode)) relieveWeakWord(wid);
      const nc = s.combo + 1;
      if (nc === 3 || nc === 5 || nc === 8 || nc === 12 || nc === 16) {
        sfx('combo');
        buzz([12, 40, 12]);
        xpFly(`🔥 ×${nc} ${t('combo_word')}`, window.innerWidth / 2, Math.max(window.innerHeight * 0.2, 90));
      }
    } else if (wid && !s.practiceMode) {
      addWeakWord(wid);
    }

    setState((prev) => {
      if (prev.answered || !prev.cur) return prev;
      if (ok) {
        return {
          ...prev,
          answered: true,
          solved: prev.solved + 1,
          combo: prev.combo + 1,
          correct: prev.practiceMode ? prev.correct : prev.correct + 1,
          xpEarned: prev.practiceMode ? prev.xpEarned : prev.xpEarned + XP_PER_CORRECT,
          practiceXp: prev.practiceMode ? prev.practiceXp + PRACTICE_XP : prev.practiceXp,
          blurbShown: true,
          banner: { ok, correctText },
        };
      }
      if (prev.practiceMode) {
        return { ...prev, answered: true, combo: 0, banner: { ok, correctText }, queue: [...prev.queue, { ...prev.cur!, isRetry: true }] };
      }
      return {
        ...prev,
        answered: true,
        combo: 0,
        hearts: Math.max(0, prev.hearts - 1),
        missed: prev.cur!.origin != null && !prev.missed.includes(prev.cur!.origin) ? [...prev.missed, prev.cur!.origin] : prev.missed,
        requeued: prev.requeued + 1,
        queue: [...prev.queue, { ...prev.cur!, isRetry: true }],
        banner: { ok, correctText },
      };
    });

    if (ok) {
      sfx('correct');
      buzz([12, 30, 12]);
      const r = document.querySelector('.hearts')?.getBoundingClientRect();
      xpFly(`+${s.practiceMode ? PRACTICE_XP : XP_PER_CORRECT} XP`, r ? r.left + r.width / 2 : window.innerWidth / 2, r ? r.top : 40);
      pulse(document.querySelector('.xp-pill'));
    } else {
      sfx('wrong');
      sfx('heart');
      buzz(70);
      shake(document.querySelector('.lesson-stage'));
      shake(document.querySelector('.hearts'));
    }
  }, [isWeak, t]);

  const onContinue = useCallback(() => {
    const s = st.current;
    if (s.phase !== 'lesson' || !s.answered) return;
    if (!s.practiceMode && s.hearts <= 0) { setState((p) => ({ ...p, phase: 'fail' })); return; }
    if (!s.queue.length) { setState((p) => ({ ...p, phase: s.practiceMode ? 'practice-done' : 'summary' })); return; }
    setState((p) => {
      const [next, ...rest] = p.queue;
      return { ...p, queue: rest, cur: next ?? null, answered: false, banner: null, exKey: p.exKey + 1 };
    });
    window.scrollTo(0, 0);
  }, []);

  const startPractice = useCallback(() => {
    const s = st.current;
    const lessonExercises = activeLesson?.exercises ?? [];
    setState(() => ({
      ...s,
      practiceMode: true,
      practiceTotal: s.missed.length,
      practiceXp: 0,
      queue: s.missed.map((i) => ({ ex: lessonExercises[i], origin: i, isRetry: false })).filter((q) => q.ex),
      cur: null,
      banner: null,
      answered: false,
      combo: 0,
      phase: 'lesson',
      exKey: s.exKey + 1,
    }));
  }, [activeLesson]);

  // practice mode: kick the queue like a fresh lesson starts
  useEffect(() => {
    if (state.practiceMode && !state.cur && state.queue.length && !state.answered && state.phase === 'lesson') {
      setState((p) => {
        const [next, ...rest] = p.queue;
        return next ? { ...p, queue: rest, cur: next, answered: false, banner: null, exKey: p.exKey + 1 } : p;
      });
    }
  }, [state.practiceMode, state.cur, state.queue.length, state.answered, state.phase]);

  // ---- keyboard comfort (1-9 pick a tile/option, Enter continues) lives in
  // ---- FxLayer so it also works in the alphabet & review drills.

  if (lessonId !== '__weak' && !lesson) {
    return (
      <div className="card error-card">
        <h1>{t('lesson_not_found')}</h1>
        <p>{t('lesson_not_found_sub', { x: lessonId })}</p>
        <Link className="btn btn-primary" href="/learn">{t('back_path')}</Link>
      </div>
    );
  }
  if (lessonId === '__weak' && !weakLesson) return <div className="lesson-stage" />;
  if (!activeLesson) return null;

  if (state.phase === 'empty') {
    return (
      <div className="card error-card">
        <h1>{t('weak_empty_title')}</h1>
        <p>{t('weak_empty')}</p>
        <Link className="btn btn-primary" href="/words">{t('nav_words')} →</Link>
      </div>
    );
  }

  if (state.phase === 'fail') {
    return <FailScreen correct={state.correct} total={activeLesson.exercises.length} lessonHref={`/lesson?id=${activeLesson.id}`} />;
  }

  if (state.phase === 'summary' || state.phase === 'practice-done') {
    const totalSolved = Math.max(state.solved, 1);
    const isSummary = state.phase === 'summary';
    const acc = Math.round((state.correct / totalSolved) * 100);
    const totalXp = getState().xp + (isSummary ? state.xpEarned : state.practiceXp) - (isSummary ? 0 : 0);
    return (
      <SummaryScreen
        icon={isSummary ? '🏆' : '🛠️'}
        laoHtml={isSummary ? t('summary_lao') : undefined}
        body={isSummary
          ? t('summary_line', { title: pf(activeLesson, 'title') ?? '', x: state.correct, y: totalSolved, z: acc })
          : t('practice_done_sub')}
        stats={isSummary
          ? [
            { strong: `+${state.xpEarned}`, span: t('stat_xp') },
            { strong: `${acc}%`, span: t('stat_acc') },
            { strong: `⚡ ${totalXp}`, span: t('stat_total_xp') },
          ]
          : [
            { strong: `+${state.practiceXp}`, span: '⚡ XP earned' },
            { strong: `⚡ ${totalXp}`, span: t('stat_total_xp') },
          ]}
        nextId={nextLessonId(activeLesson, isWeak)}
        missedCount={isSummary ? state.missed.length : 0}
        lessonHref={`/lesson?id=${activeLesson.id}`}
        showReplay={isSummary}
        badges={isSummary ? (unlockedAchievements() as Array<{ id: string; icon: string; name: string; desc: string }>) : []}
        onStartPractice={startPractice}
      />
    );
  }

  // ---- lesson phase ----
  const cur = state.cur;
  if (!cur) return null;
  const progressTotal = state.practiceMode ? state.practiceTotal : activeLesson.exercises.length + state.requeued;
  const doneCount = state.practiceMode ? state.practiceTotal - state.queue.length : state.solved;
  const progressPct = (progressTotal > 0 ? doneCount / progressTotal : 1) * 100;
  const blurb = pf(activeLesson, 'blurb');

  const prompt = exPrompt(cur.ex, t, def, pf);
  return (
    <>
      <div className="lesson-topbar">
        <Link className="icon-btn" href="/learn" aria-label="Exit lesson">✕</Link>
        <div className="progress"><div className={`progress-fill${progressPct >= 100 ? ' done' : ''}`} style={{ width: `${progressPct}%` }} /></div>
        <span className="combo" ref={comboRef} style={{ display: state.combo >= 2 ? '' : 'none' }}>🔥 ×{state.combo}</span>
        <span className="hearts" aria-label="Hearts">
          {'❤️'.repeat(Math.max(state.hearts, 0))}{'🖤'.repeat(Math.max(5 - state.hearts, 0))}
        </span>
      </div>

      <div className="lesson-stage fx-stage" key={state.exKey}>
        {state.practiceMode ? (
          <div className="retry-note">🛠️ {t('practice_mode')}</div>
        ) : cur.isRetry ? (
          <div className="retry-note">🔁 {t('again_note')}</div>
        ) : null}

        <div className="exercise-head">
          <h2>{exTitle(cur.ex, t)}</h2>
          {prompt ? <p className="exercise-prompt" dangerouslySetInnerHTML={{ __html: prompt }} /> : null}
        </div>

        {!state.practiceMode && !state.blurbShown && blurb ? (
          <div className="card context-card" style={{ marginBottom: '1.25rem' }}><p className="context-blurb">{blurb}</p></div>
        ) : null}

        <ExerciseView
          key={`${state.exKey}-${cur.origin ?? cur.ex.type}`}
          ex={cur.ex}
          answered={state.answered}
          onResolve={resolveAnswer}
        />
      </div>

      <div className="lesson-actionbar">
        <div className="actionbar-inner">
          {state.banner ? (
            <Feedback
              ok={state.banner.ok}
              correctText={state.banner.correctText}
              explain={feedbackNote(cur.ex, noteOf)}
              practice={state.practiceMode}
              hearts={state.hearts}
              onContinue={onContinue}
            />
          ) : (
            <span className="action-hint">{t('tap_answer')}</span>
          )}
        </div>
      </div>
    </>
  );
}

// ---------- helpers ----------

function nextLessonId(lesson: Lesson, isWeak: boolean): string | null {
  if (isWeak) return null;
  const all = UNITS.flatMap((u) => u.lessons.map((l) => l.id));
  const i = all.indexOf(lesson.id);
  return i >= 0 && i < all.length - 1 ? all[i + 1] : null;
}

function feedbackNote(ex: Exercise, noteOf: (w: { note?: string; noteFr?: string } | null | undefined) => string | undefined): string | undefined {
  const wid = (ex.type === 'mc' || ex.type === 'listen') ? ex.answer : (ex.type === 'type' || ex.type === 'speak') ? ex.id : undefined;
  return wid && V[wid] ? noteOf(V[wid]) : undefined;
}

function exTitle(ex: Exercise, t: (k: string) => string): string {
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

function exPrompt(
  ex: Exercise,
  t: (k: string, vars?: Record<string, string | number>) => string,
  def: (w: { en: string; fr?: string } | null | undefined) => string | undefined,
  pf: (obj: unknown, field: string) => string | undefined,
): string | null {
  if (ex.type === 'mc' && ex.dir === 'en2lao' && ex.answer) return t('prompt_mc_en2lao', { x: esc(def(V[ex.answer] as { en: string; fr?: string }) ?? '') });
  if (ex.type === 'type' && ex.dir === 'en2lao' && ex.id) return t('prompt_type_en2lao', { x: esc(def(V[ex.id] as { en: string; fr?: string }) ?? '') });
  if (ex.type === 'listen') return t('prompt_listen');
  if (ex.type === 'tiles') return t('prompt_tiles', { x: esc(pf(ex, 'en') ?? '') });
  return null;
}

// 'Tricky words' drill: a synthetic lesson built from words you missed before.
function buildWeakLesson(drillTitle: string, drillBlurb: string): Lesson {
  const ids = getWeakWords().map((w) => w.id).filter((id) => !!V[id]);
  if (!ids.length) {
    return { id: '__weak', title: drillTitle, titleFr: drillTitle, blurb: drillBlurb, blurbFr: drillBlurb, exercises: [] };
  }
  const all = Object.values(V) as VocabEntry[];
  const pool = shuffle(ids).slice(0, 8);
  const exercises = pool.flatMap<Exercise>((id) => {
    const others = shuffle(all.filter((x) => x.cat === (V[id] as VocabEntry).cat && x.id !== id)).slice(0, 3).map((x) => x.id);
    return shuffle<Exercise>([
      { type: 'mc', dir: 'lao2en', ids: [id, ...others], answer: id },
      { type: 'listen', ids: [id, ...others], answer: id },
      { type: 'type', dir: 'en2lao', id },
    ]);
  });
  return { id: '__weak', title: drillTitle, titleFr: drillTitle, blurb: drillBlurb, blurbFr: drillBlurb, exercises };
}
