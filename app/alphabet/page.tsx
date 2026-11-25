'use client';
import { BicepsFlexed, Check, CircleCheck, CircleX, Lock, PartyPopper, RotateCcw, Star, Volume2 } from 'lucide-react';

// /alphabet — learn the Lao script the way Duolingo teaches kana.
//
// A run never dumps a whole group: it introduces up to 3 NEW letters with
// showcase cards ("New letter" + audio), then drills them while interleaving
// review questions from the weakest already-known letters. Every letter has
// its own strength level 0–4 (the ࠁ lv bars), raised by correct answers and
// gently lowered by mistakes; groups complete letter by letter and old
// letters keep coming back until each bar is full.
//
// Modes:
//   home    — group cards with per-letter completion bars + a full reference
//   intro   — one "meet the letter" showcase card per NEW letter of the run,
//             followed by its first, fully-guided handwriting trace
//   drill   — interleaved 4-option quizzes + handwriting steps; the guide
//             fades out as the letter levels up (guided → snapped → assisted
//             → faint → freehand), right auto-advances, wrong re-queues
//   summary — the run's letters with their post-run bars, mistakes, XP
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useT, pickVariant } from '@/lib/i18n';
import { addXp } from '@/lib/store';
import { useShell } from '@/components/SiteShell';
import { speakItem } from '@/lib/speech';
import { sfx, buzz, pop, shake, burstAt, confettiBurst } from '@/lib/fx';
import { H } from '@/components/H';
import { esc } from '@/components/lesson/Screens';
import TracePad from '@/components/alphabet/TracePad';
import { ALPHA_GROUPS, CONSONANT_GROUPS, VOWEL_GROUPS, ALL_LETTERS, type AlphaGroup, type AlphaLetter } from '@/data/alphabet';
import {
  MAX_LV, letterLevel, groupPercent, knownCount, bumpLetter,
  composeGroupRun, composeMixedRun, loadStore, groupUnlocked, nextGuidedIndex,
  type AlphaStore, type Run, type RunStep, type RunQ,
} from '@/lib/alpha-progress';
import { shuffle } from '@/lib/shuffle';
import { traceAssistForLevel } from '@/lib/trace-score';

// letter defs with their group id + 1-based position (matches audio ids)
const LETTER_DEFS = ALPHA_GROUPS.flatMap((g) => g.letters.map((letter, i) => ({ gid: g.id, group: g, letter, n: i + 1 })));
const LET = new Map(LETTER_DEFS.map((d) => [`${d.gid}-${d.n}`, d]));

// Stable audio id per letter (group id + position) — the generated files are
// public/audio/alpha-<group>-<n>.mp3, listed in audio-manifest.ts.
const LETTER_AUDIO_ID = new Map(LETTER_DEFS.map((d) => [`${d.gid}-${d.n}`, `alpha-${d.gid}-${d.n}`]));

// One color per path node (guided path circles / borders).
const GROUP_COLORS = ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#8b5cf6', '#ff9600', '#00b8b8', '#e0559d', '#8a6d3b'];

function speakAlpha(gid: string, n: number, letter: AlphaLetter, rate = 0.8) {
  return speakItem({ id: LETTER_AUDIO_ID.get(`${gid}-${n}`), lao: letter.lao, romanization: letter.roman }, rate);
}

type Q = RunQ;
type Step = RunStep;

// 4-option MC: the answer + 3 distractors (same group first, then anywhere).
// Distractors sharing the answer's roman (ຂ/ຄ both "kh"), sharing another
// option's roman, or repeating the answer's glyph are excluded, so every
// question shows four visually distinct options and exactly one right answer.
function optionsFor(answer: AlphaLetter, answerGroup: AlphaGroup): AlphaLetter[] {
  const chosen: AlphaLetter[] = [answer];
  const seenLao = new Set([answer.lao]);
  const seenRoman = new Set([answer.roman]);
  const candidates = [...shuffle(answerGroup.letters), ...shuffle(ALL_LETTERS)];
  for (const l of candidates) {
    if (chosen.length >= 4) break;
    if (seenLao.has(l.lao) || seenRoman.has(l.roman)) continue;
    seenLao.add(l.lao);
    seenRoman.add(l.roman);
    chosen.push(l);
  }
  // keep same-group letters adjacent to the answer when possible
  const gFirst = chosen.filter((l) => answerGroup.letters.includes(l) || l === answer);
  const gRest = chosen.filter((l) => !answerGroup.letters.includes(l) && l !== answer);
  return shuffle([...gFirst, ...gRest]);
}

// Per-letter completion bar: MAX_LV segments, filled = current strength level.
function LvBar({ lv }: { lv: number }) {
  const { t } = useT();
  return (
    <span
      className={`lvbar${lv >= MAX_LV ? ' max' : ''}`}
      role="img"
      aria-label={t('alpha_lv_aria').replace('{x}', String(lv)).replace('{y}', String(MAX_LV))}
      title={t('alpha_lv_aria').replace('{x}', String(lv)).replace('{y}', String(MAX_LV))}
    >
      {Array.from({ length: MAX_LV }, (_, i) => <i key={i} className={i < lv ? 'f' : ''} />)}
    </span>
  );
}

export default function AlphabetPage() {
  const { t, lang } = useT();
  const { pingStats } = useShell();

  const [mode, setMode] = useState<'home' | 'intro' | 'write' | 'drill' | 'summary'>('home');
  const [store, setStore] = useState<AlphaStore>({ letters: {}, done: {} });
  const [run, setRun] = useState<Run | null>(null);
  const [introIdx, setIntroIdx] = useState(0);
  const [totalQ, setTotalQ] = useState(0);
  const [queue, setQueue] = useState<Step[]>([]);
  const [current, setCurrent] = useState<Step | null>(null);
  const [picked, setPicked] = useState<AlphaLetter | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [writeStep, setWriteStep] = useState<{ gid: string; n: number; letter: AlphaLetter } | null>(null);
  // levels snapshot at run start (decides who gets a writing step) + letters already traced this run
  const startLevels = useRef<AlphaStore>({ letters: {}, done: {} });
  const written = useRef<Set<string>>(new Set());

  useEffect(() => setStore(loadStore()), []);

  const known = knownCount(store);

  function startRun(r: Run) {
    setRun(r);
    startLevels.current = store;
    written.current = new Set();
    setMistakes(0);
    setIntroIdx(0);
    setTotalQ(r.drill.length);
    setQueue(r.drill.slice(1));
    setCurrent(r.drill[0] || null);
    setPicked(null);
    setMode(r.intro.length ? 'intro' : 'drill');
  }

  function startGroup(id: string, mixedRun = false) {
    startRun(mixedRun ? composeMixedRun(store) : composeGroupRun(ALPHA_GROUPS.find((g) => g.id === id) || ALPHA_GROUPS[0], store));
  }

  function nextQuestion(rest: Step[]) {
    if (!rest.length) {
      const xp = run?.hasNew ? 5 : 2;
      setPicked(null);
      setCurrent(null);
      setMode('summary');
      addXp(xp).then(() => pingStats()).catch(() => pingStats());
      sfx('fanfare');
      confettiBurst(70);
      return;
    }
    setCurrent(rest[0]);
    setQueue(rest.slice(1));
    setPicked(null);
  }

  function answer(choice: AlphaLetter) {
    if (!current || current.kind !== 'q' || picked) return;
    const right = choice.lao === currentLetter(current)?.lao;
    setPicked(choice);
    if (run?.bumpable) setStore(bumpLetter(store, current.gid, current.n, right));
    if (!right) {
      setMistakes((m) => m + 1);
      if (current.tries < 1) setQueue((prev) => [...prev, { ...current, tries: current.tries + 1 }]);
      return; // wrong: the learner reads the correction, then taps CONTINUE
    }
    window.setTimeout(() => nextQuestion(queue), 620);
  }

  function currentLetter(q: Q): AlphaLetter | undefined {
    return LET.get(`${q.gid}-${q.n}`)?.letter;
  }

  // ---------- home ----------
  if (mode === 'home') {
    const guidedIdx = nextGuidedIndex(store);
    const guided = guidedIdx >= 0 ? ALPHA_GROUPS[guidedIdx] : null;
    return (
      <>
        <div className="page-head">
          <h1>{t('alpha_title')}</h1>
          <H as="p" className="section-sub" html={t('alpha_sub')} />
          <p className="alpha-progress">{t('alpha_known').replace('{x}', String(known)).replace('{y}', String(LETTER_DEFS.length))}</p>
        </div>

        {/* Guided path: one big CTA always starts the right next run
            (first unlocked, not-yet-mastered group), then the linear path of
            group nodes — each unlocks only when the previous is mastered. */}
        {guided ? (
          <button className="btn btn-primary btn-lg alpha-guided-cta" onClick={() => startGroup(guided.id)}>
            ▶ {known > 0 ? t('alpha_continue') : t('alpha_start')} · {t('alpha_g_' + guided.id)}
          </button>
        ) : (
          <div className="card alpha-all-done"><PartyPopper style={{ verticalAlign: '-.15em', marginRight: '.3em' }} /> {t('alpha_all_mastered')}</div>
        )}

        <div className="lessons-path alpha-path">
          {ALPHA_GROUPS.map((g, i) => {
            const pct = groupPercent(store, g);
            const done = pct >= 100;
            const unlocked = groupUnlocked(store, i);
            const hasNew = g.letters.some((_, j) => letterLevel(store, g.id, j + 1) === 0);
            const cta = done ? '✓' : unlocked ? (hasNew ? t('alpha_start') : t('alpha_continue')) : t('alpha_locked');
            return (
              <button
                key={g.id}
                type="button"
                className={`lesson-node alpha-node${done ? ' done' : ''}${unlocked ? '' : ' locked'}`}
                style={{ ['--unit-color' as string]: GROUP_COLORS[i % GROUP_COLORS.length] }}
                aria-disabled={unlocked ? 'false' : 'true'}
                title={unlocked ? undefined : t('alpha_locked')}
                onClick={(e) => {
                  if (!unlocked) { sfx('wrong'); buzz(40); shake(e.currentTarget); return; }
                  startGroup(g.id);
                }}
              >
                <div className="lesson-circle">{done ? <Check strokeWidth={3.2} /> : unlocked ? String(i + 1) : <Lock />}</div>
                <div className="lesson-meta">
                  <strong>{t('alpha_g_' + g.id)}</strong>
                  <span>{pct}% · {cta}</span>
                  <span className="group-letters">
                    {g.letters.map((l, j) => (
                      <span key={l.lao} className="gl">
                        <span className="lao">{l.lao}</span>
                        <LvBar lv={letterLevel(store, g.id, j + 1)} />
                      </span>
                    ))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {known > 0 ? (
          <button className="btn btn-ghost practice-mixed" onClick={() => startGroup('', true)}>
            <RotateCcw /> {t('alpha_practice_all')}
          </button>
        ) : null}

        <section className="unit-section">
          <h2>{t('alpha_consonants')}</h2>
          <div className="alpha-grid">
            {LETTER_DEFS.filter((d) => d.gid.startsWith('c')).map((d) => (
              <RefCard key={'c' + d.gid + d.n} gid={d.gid} n={d.n} letter={d.letter} lang={lang} lv={letterLevel(store, d.gid, d.n)} />
            ))}
          </div>
        </section>
        <section className="unit-section">
          <h2>{t('alpha_vowels')}</h2>
          <p className="section-sub">{t('alpha_vowels_sub')}</p>
          <div className="alpha-grid">
            {LETTER_DEFS.filter((d) => d.gid.startsWith('v')).map((d) => (
              <RefCard key={'v' + d.gid + d.n} gid={d.gid} n={d.n} letter={d.letter} lang={lang} lv={letterLevel(store, d.gid, d.n)} />
            ))}
          </div>
        </section>
        <p className="section-sub alpha-foot">{t('alpha_tones_sub')}</p>
      </>
    );
  }

  // ---------- intro (showcase of the run's NEW letters) ----------
  if (mode === 'intro' && run && introIdx < run.intro.length) {
    const step = run.intro[introIdx];
    const letter = LET.get(`${step.gid}-${step.n}`)!.letter;
    const last = introIdx >= run.intro.length - 1;
    const note = lang === 'fr' ? letter.noteFr : letter.note;
    return (
      <div className="fx-stage" key={`intro-${step.gid}-${step.n}`}>
        <div className="page-head alpha-drill-head">
          <Link className="btn btn-ghost" href="/alphabet" onClick={(e) => { e.preventDefault(); setMode('home'); }}>
            ← {t('alpha_back')}
          </Link>
          <span className="group-name">{t('alpha_g_' + run.group.id)}</span>
        </div>
        <div className="session-bar" aria-hidden="true"><div style={{ width: `${Math.round((100 * (introIdx + 1)) / (run.intro.length + run.drill.length))}%` }} /></div>
        <div className="intro-steps">
          {run.intro.map((s, i) => (
            <span key={`${s.gid}-${s.n}`} className={`dot${i === introIdx ? ' on' : ''}${i < introIdx ? ' past' : ''}`} />
          ))}
        </div>
        <ShowcaseCard gid={step.gid} n={step.n} letter={letter} note={note} />
        <button
          className="btn btn-continue btn-lg"
          onClick={() => {
            const key = `${step.gid}-${step.n}`;
            if (run?.bumpable && letterLevel(startLevels.current, step.gid, step.n) === 0 && !written.current.has(key)) {
              // first time meeting this letter: straight to the writing step
              written.current.add(key);
              setWriteStep({ gid: step.gid, n: step.n, letter });
              setMode('write');
              return;
            }
            if (last) setMode('drill');
            else setIntroIdx((i) => i + 1);
          }}
        >
          {last ? t('cont') : t('alpha_next')}
        </button>
      </div>
    );
  }

  // ---------- write (trace the new letter) ----------
  if (mode === 'write' && writeStep) {
    const moreIntro = introIdx < (run?.intro.length || 0) - 1;
    return (
      <TracePad
        letter={writeStep.letter}
        assist={traceAssistForLevel(0)}
        onPass={() => {
          setStore(bumpLetter(store, writeStep.gid, writeStep.n, true));
          if (moreIntro) {
            setIntroIdx((i) => i + 1);
            setMode('intro');
          } else {
            setMode('drill');
          }
        }}
      />
    );
  }

  // ---------- summary ----------
  if (mode === 'summary' && run) {
    const drillIds = Array.from(new Set(run.drill.map((q) => `${q.gid}-${q.n}`)));
    const pct = run.mixed ? null : groupPercent(store, run.group);
    const doneTitle = pct !== null && pct >= 100;
    // group mastered → the next path node unlocks: offer it as the primary action
    const gi = ALPHA_GROUPS.findIndex((g) => g.id === run.group.id);
    const nextG = !run.mixed && doneTitle && gi >= 0 && gi < ALPHA_GROUPS.length - 1 ? ALPHA_GROUPS[gi + 1] : null;
    return (
      <div className="fx-stage">
        <div className="big-word card summary-card">
          <div className="summary-star">{doneTitle || run.mixed ? <Star /> : <BicepsFlexed />}</div>
          <h2>{run.mixed ? t('alpha_mixed_done_title') : doneTitle ? t('alpha_done_title') : t('alpha_run_done')}</h2>
          <div className="summary-letters">
            {drillIds.map((id) => {
              const d = LET.get(id)!;
              return (
                <span key={id} className="gl">
                  <span className="lao">{d.letter.lao}</span>
                  <LvBar lv={letterLevel(store, d.gid, d.n)} />
                </span>
              );
            })}
          </div>
          <p className="alpha-note">
            {t('alpha_mistakes').replace('{x}', String(mistakes))} · <strong>{t('alpha_xp_earned').replace('{x}', run.hasNew ? '5' : '2')}</strong>
          </p>
        </div>
        <div className="summary-actions">
          {nextG ? (
            <button className="btn btn-primary btn-lg" onClick={() => startGroup(nextG.id)}>
              ▶ {t('alpha_next_group', { x: t('alpha_g_' + nextG.id) })}
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={() => (run.mixed ? startGroup('', true) : startGroup(run.group.id))}><RotateCcw /> {t('alpha_again')}</button>
          )}
          <button className="btn btn-ghost btn-lg" onClick={() => setMode('home')}>{t('alpha_back')}</button>
        </div>
      </div>
    );
  }

  // ---------- drill: interleaved quiz & handwriting steps ----------
  if (current && current.kind === 'write') {
    const def = LET.get(`${current.gid}-${current.n}`)!;
    const remaining = queue.length + 1;
    const answered = Math.max(0, totalQ - remaining);
    return (
      <div className="fx-stage" key={`w-${current.gid}-${current.n}`}>
        <div className="page-head alpha-drill-head">
          <Link className="btn btn-ghost" href="/alphabet">
            ← {t('alpha_back')}
          </Link>
          <span className="alpha-progress">{t('alpha_count').replace('{x}', String(answered)).replace('{y}', String(totalQ))}</span>
        </div>
        <div className="session-bar" aria-hidden="true"><div style={{ width: `${Math.round((100 * answered) / Math.max(1, totalQ))}%` }} /></div>
        <TracePad
          letter={def.letter}
          assist={traceAssistForLevel(letterLevel(store, current.gid, current.n))}
          onPass={() => {
            if (run?.bumpable) setStore(bumpLetter(store, current.gid, current.n, true));
            nextQuestion(queue);
          }}
        />
        <span className="muted mixed-flag">{t('alpha_g_' + def.gid)}</span>
      </div>
    );
  }

  return (
    <Drill
      current={current as Q | null}
      queue={queue as Q[]}
      totalQ={totalQ}
      picked={picked}
      mixed={!!run?.mixed}
      label={run?.mixed ? t('alpha_practice_all') : run ? t('alpha_g_' + run.group.id) : ''}
      onAnswer={answer}
      onNext={() => nextQuestion(queue)}
    />
  );
}

// "Meet the letter" card — auto-plays the letter's audio once, Duolingo-style.
function ShowcaseCard({ gid, n, letter, note }: { gid: string; n: number; letter: AlphaLetter; note?: string }) {
  const { t } = useT();
  const glyphRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = window.setTimeout(() => { speakAlpha(gid, n, letter); }, 350);
    pop(glyphRef.current);
    return () => window.clearTimeout(id);
  }, [gid, n, letter]);
  return (
    <div className="big-word card intro-card">
      <span className="alpha-new-chip">{t('alpha_new_letter')}</span>
      <div className="alpha-glyph-lg lao" ref={glyphRef}>{letter.lao}</div>
      <div className="word-romanization">{letter.roman}</div>
      {note ? <p className="alpha-note">{note}</p> : null}
      <button
        className="icon-btn speak-btn intro-speak"
        title="Listen" aria-label="Listen"
        onClick={() => speakAlpha(gid, n, letter)}
      ><Volume2 /></button>
    </div>
  );
}

function Drill({ current, queue, totalQ, picked, mixed, label, onAnswer, onNext }: {
  current: Q | null;
  queue: Q[];
  totalQ: number;
  picked: AlphaLetter | null;
  mixed: boolean;
  label: string;
  onAnswer: (choice: AlphaLetter) => void;
  onNext: () => void;
}) {
  const { t, tRaw } = useT();
  const def = current ? LET.get(`${current.gid}-${current.n}`) : undefined;
  const letter = def?.letter;
  const group = def?.group || ALPHA_GROUPS[0];
  const opts = useMemo(() => (letter ? optionsFor(letter, group) : []), [letter, group]);

  if (!current || !letter || !def) return null;

  const consonants = def.gid.startsWith('c');
  const remaining = queue.length + 1;
  const answered = Math.max(0, totalQ - remaining);
  const isRight = !!picked && picked.lao === letter.lao;
  const wasWrong = !!picked && !isRight;

  const prompt = current.dir === 'char'
    ? consonants
      ? t('alpha_q_char_sound').replace('{c}', letter.lao)
      : t('alpha_q_syl_roman').replace('{c}', letter.lao)
    : consonants
      ? t('alpha_q_sound_char').replace('{s}', letter.roman)
      : t('alpha_q_roman_syl').replace('{s}', letter.roman);

  return (
    <div className="fx-stage" key={`${current.gid}-${current.n}-${current.tries}-${answered}`}>
      <div className="page-head alpha-drill-head">
        <Link className="btn btn-ghost" href="/alphabet">
          ← {t('alpha_back')}
        </Link>
        <span className="alpha-progress">{t('alpha_count').replace('{x}', String(answered)).replace('{y}', String(totalQ))}</span>
      </div>
      <div className="session-bar" aria-hidden="true"><div style={{ width: `${Math.round((100 * answered) / Math.max(1, totalQ))}%` }} /></div>

      {current.dir === 'char' ? (
        <div className="big-word card drill-card">
          <div className="alpha-glyph-lg lao">{letter.lao}</div>
          <button
            className="icon-btn speak-btn"
            title="Listen" aria-label="Listen"
            onClick={() => speakAlpha(def.gid, def.n, letter)}
          ><Volume2 /></button>
        </div>
      ) : null}

      <p className="drill-prompt">{prompt}</p>

      <div className="options">
        {opts.map((o, i) => {
          const cls = [
            'option-card',
            current.dir === 'roman' ? 'glyph-option' : '',
            picked && o.lao === letter.lao ? 'correct' : '',
            picked && o.lao === picked.lao && !isRight ? 'wrong' : '',
          ].filter(Boolean).join(' ');
          return (
            <button
              key={o.lao}
              className={cls}
              disabled={!!picked}
              onClick={(e) => {
                const right = o.lao === letter.lao;
                if (right) {
                  pop(e.currentTarget);
                  const r = e.currentTarget.getBoundingClientRect();
                  burstAt(r.left + r.width / 2, r.top + r.height / 2, 14);
                  sfx('correct');
                  buzz([12, 30, 12]);
                } else {
                  shake(e.currentTarget);
                  sfx('wrong');
                  buzz(70);
                }
                onAnswer(o);
              }}
            >
              {current.dir === 'roman'
                ? <span className="lao glyph-only">{o.lao}</span>
                : <span className="roman-only">{o.roman}</span>}
              <span className="kbd" aria-hidden="true">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {picked ? (
        <div className={`feedback ${isRight ? 'ok' : 'bad'}`}>
          <div className="feedback-icon" aria-hidden="true">{isRight ? <CircleCheck /> : <CircleX />}</div>
          {isRight ? (
            <H as="p" html={`${esc(pickVariant(tRaw('fb_ok_variants')))} ${esc(pickVariant(tRaw('fb_praise')))} · ${esc(letter.lao)} — ${esc(letter.roman)}`} />
          ) : (
            <H as="p" html={`${esc(t('fb_bad'))} ${t('fb_correct_answer').replace('{x}', esc(`${letter.lao} — ${letter.roman}`))}`} />
          )}
        </div>
      ) : null}

      {wasWrong ? (
        <button className="btn btn-continue btn-lg" onClick={onNext}>{t('cont')}</button>
      ) : null}
      <span className="muted mixed-flag">{label}</span>
    </div>
  );
}

// Reference-grid card: glyph + karaoke romanization + optional hint + its bar.
function RefCard({ gid, n, letter, lang, lv }: { gid: string; n: number; letter: AlphaLetter; lang: string; lv: number }) {
  const note = lang === 'fr' ? letter.noteFr : letter.note;
  return (
    <div className="alpha-tile card">
      <div className="alpha-glyph lao">{letter.lao}</div>
      <div className="word-romanization">{letter.roman}</div>
      <LvBar lv={lv} />
      {note ? <div className="alpha-note">{note}</div> : null}
    </div>
  );
}
