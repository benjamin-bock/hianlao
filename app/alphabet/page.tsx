'use client';

// /alphabet — learn the Lao script the way Duolingo teaches kana: glyphs are
// introduced in small groups, then drilled shape→sound and sound→shape, with
// wrong answers re-queued (repetition is the whole method).
//
// Modes:
//   home    — group cards (stars when done) + a full reference grid
//   intro   — one "meet the letter" card per glyph (skipped on re-runs)
//   drill   — 4-option multiple choice; right auto-advances, wrong re-queues
//   summary — mistakes, XP, replay
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useT, pickVariant } from '@/lib/i18n';
import { addXp } from '@/lib/store';
import { useShell } from '@/components/SiteShell';
import { speak } from '@/lib/speech';
import { H } from '@/components/H';
import { esc } from '@/components/lesson/Screens';
import { ALPHA_GROUPS, CONSONANT_GROUPS, VOWEL_GROUPS, ALL_LETTERS, groupById, type AlphaGroup, type AlphaLetter } from '@/data/alphabet';
import { shuffle } from '@/lib/shuffle';

const ALPHA_KEY = 'hianlao-alpha-v1';
const MIXED_SIZE = 12;

type Q = { letter: AlphaLetter; dir: 'char' | 'roman'; tries: number };

function loadDone(): Record<string, number> {
  try {
    const raw = JSON.parse(localStorage.getItem(ALPHA_KEY) || '{}') as { done?: Record<string, number> };
    return raw.done || {};
  } catch { return {}; }
}
function markGroup(gid: string) {
  const done = loadDone();
  done[gid] = Date.now();
  try { localStorage.setItem(ALPHA_KEY, JSON.stringify({ done })); } catch { /* private mode */ }
}

const isConsonantGroup = (g: AlphaGroup) => g.kind === 'consonants';

// 4-option MC: the answer + 3 distractors (same group first, then anywhere).
// Distractors sharing the answer's roman (ຂ/ຄ both "kh"), sharing another
// option's roman, or repeating the answer's glyph are excluded, so every
// question shows four visually distinct options and exactly one right answer.
function optionsFor(q: Q, group: AlphaGroup): AlphaLetter[] {
  const chosen: AlphaLetter[] = [q.letter];
  const seenLao = new Set([q.letter.lao]);
  const seenRoman = new Set([q.letter.roman]);
  const candidates = [...shuffle(group.letters), ...shuffle(ALL_LETTERS)];
  for (const l of candidates) {
    if (chosen.length >= 4) break;
    if (seenLao.has(l.lao) || seenRoman.has(l.roman)) continue;
    seenLao.add(l.lao);
    seenRoman.add(l.roman);
    chosen.push(l);
  }
  // keep same-group letters adjacent to the answer when possible: rebuild with
  // group-first ordering without breaking the uniqueness rules above.
  const gFirst = chosen.filter((l) => group.letters.includes(l) || l === q.letter);
  const gRest = chosen.filter((l) => !group.letters.includes(l) && l !== q.letter);
  return shuffle([...gFirst, ...gRest]);
}

// Each letter of a group is drilled in both directions. Mixed practice draws
// one random direction per letter from the completed groups (or from
// everything when nothing is done yet).
function buildQueue(group: AlphaGroup, mixed: boolean, done: Record<string, number>): Q[] {
  if (mixed) {
    const doneGroups = ALPHA_GROUPS.filter((g) => done[g.id]);
    const source = doneGroups.length ? doneGroups.flatMap((g) => g.letters) : ALL_LETTERS;
    return shuffle(source).slice(0, MIXED_SIZE).map((letter) => {
      const dir: 'char' | 'roman' = Math.random() < 0.5 ? 'char' : 'roman';
      return { letter, dir, tries: 0 };
    });
  }
  return shuffle(group.letters.flatMap((letter): Q[] => [
    { letter, dir: 'char', tries: 0 },
    { letter, dir: 'roman', tries: 0 },
  ]));
}

export default function AlphabetPage() {
  const { t, lang } = useT();
  const { pingStats } = useShell();

  const [mode, setMode] = useState<'home' | 'intro' | 'drill' | 'summary'>('home');
  const [group, setGroup] = useState<AlphaGroup>(ALPHA_GROUPS[0]);
  const [mixed, setMixed] = useState(false);
  const [done, setDone] = useState<Record<string, number>>({});
  const [introIdx, setIntroIdx] = useState(0);
  const [totalQ, setTotalQ] = useState(0);
  const [queue, setQueue] = useState<Q[]>([]);
  const [current, setCurrent] = useState<Q | null>(null);
  const [picked, setPicked] = useState<AlphaLetter | null>(null);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => setDone(loadDone()), []);

  const doneCount = Object.keys(done).length;

  function startGroup(id: string, mixedRun = false) {
    const g = mixedRun ? ALPHA_GROUPS[0] : groupById(id) || ALPHA_GROUPS[0];
    const q = buildQueue(g, mixedRun, done);
    setGroup(g);
    setMixed(mixedRun);
    setMistakes(0);
    setIntroIdx(0);
    setTotalQ(q.length);
    setQueue(q.slice(1));
    setCurrent(q[0] || null);
    setPicked(null);
    setMode(mixedRun || done[g.id] ? 'drill' : 'intro');
  }

  function nextQuestion(rest: Q[]) {
    if (!rest.length) {
      const xp = mixed ? 2 : 5;
      setPicked(null);
      setCurrent(null);
      setMode('summary');
      addXp(xp).then(() => pingStats()).catch(() => pingStats());
      if (!mixed) { markGroup(group.id); setDone(loadDone()); }
      return;
    }
    setCurrent(rest[0]);
    setQueue(rest.slice(1));
    setPicked(null);
  }

  function answer(choice: AlphaLetter) {
    if (!current || picked) return;
    setPicked(choice);
    if (choice.lao !== current.letter.lao) {
      setMistakes((m) => m + 1);
      if (current.tries < 1) setQueue((prev) => [...prev, { ...current, tries: current.tries + 1 }]);
      return; // wrong: the learner reads the correction, then taps CONTINUE
    }
    window.setTimeout(() => nextQuestion(queue), 620);
  }

  // ---------- home ----------
  if (mode === 'home') {
    return (
      <>
        <div className="page-head">
          <h1>{t('alpha_title')}</h1>
          <H as="p" className="section-sub" html={t('alpha_sub')} />
          <p className="alpha-progress">{t('alpha_progress').replace('{x}', String(doneCount)).replace('{y}', String(ALPHA_GROUPS.length))}</p>
        </div>

        <div className="alpha-groups">
          {ALPHA_GROUPS.map((g) => {
            const isDone = !!done[g.id];
            return (
              <button key={g.id} className={`group-card card${isDone ? ' done' : ''}`} onClick={() => startGroup(g.id)}>
                <span className="group-star" aria-hidden="true">{isDone ? '⭐' : ''}</span>
                <span className="group-glyphs lao">{g.letters.map((l) => l.lao).join('')}</span>
                <span className="group-name">{t('alpha_g_' + g.id)}</span>
                <span className="group-cta">{isDone ? t('alpha_again') : t('alpha_start')}</span>
              </button>
            );
          })}
        </div>

        <button className="btn btn-ghost practice-mixed" onClick={() => startGroup('', true)}>
          🔁 {t('alpha_practice_all')}
        </button>

        <section className="unit-section">
          <h2>{t('alpha_consonants')}</h2>
          <div className="alpha-grid">
            {CONSONANT_GROUPS.flatMap((g) => g.letters).map((l) => (
              <RefCard key={'c' + l.lao} letter={l} lang={lang} />
            ))}
          </div>
        </section>
        <section className="unit-section">
          <h2>{t('alpha_vowels')}</h2>
          <p className="section-sub">{t('alpha_vowels_sub')}</p>
          <div className="alpha-grid">
            {VOWEL_GROUPS.flatMap((g) => g.letters).map((l) => (
              <RefCard key={'v' + l.lao} letter={l} lang={lang} />
            ))}
          </div>
        </section>
        <p className="section-sub alpha-foot">{t('alpha_tones_sub')}</p>
      </>
    );
  }

  // ---------- intro ----------
  if (mode === 'intro') {
    const letter = group.letters[introIdx];
    const last = introIdx >= group.letters.length - 1;
    const note = lang === 'fr' ? letter.noteFr : letter.note;
    return (
      <>
        <div className="page-head alpha-drill-head">
          <Link className="btn btn-ghost" href="/alphabet" onClick={(e) => { e.preventDefault(); setMode('home'); }}>
            ← {t('alpha_back')}
          </Link>
          <span className="group-name">{t('alpha_g_' + group.id)}</span>
        </div>
        <div className="intro-steps">
          {group.letters.map((l, i) => (
            <span key={l.lao} className={`dot${i === introIdx ? ' on' : ''}${i < introIdx ? ' past' : ''}`} />
          ))}
        </div>
        <div className="big-word card intro-card">
          <div className="alpha-glyph-lg lao">{letter.lao}</div>
          <div className="word-romanization">{letter.roman}</div>
          {note ? <p className="alpha-note">{note}</p> : null}
          <button
            className="icon-btn speak-btn intro-speak"
            title="Listen" aria-label="Listen"
            onClick={() => speak(letter.roman, { lang: 'en-US', rate: 0.8 })}
          >🔊</button>
        </div>
        <button className="btn btn-continue btn-lg" onClick={() => (last ? setMode('drill') : setIntroIdx((i) => i + 1))}>
          {last ? t('cont') : t('alpha_next')}
        </button>
      </>
    );
  }

  // ---------- summary ----------
  if (mode === 'summary') {
    return (
      <>
        <div className="big-word card summary-card">
          <div className="summary-star">⭐</div>
          <h2>{mixed ? t('alpha_mixed_done_title') : t('alpha_done_title')}</h2>
          {!mixed ? <div className="group-glyphs summary-glyphs lao">{group.letters.map((l) => l.lao).join('')}</div> : null}
          <p className="alpha-note">
            {t('alpha_mistakes').replace('{x}', String(mistakes))} · <strong>{t('alpha_xp_earned').replace('{x}', mixed ? '2' : '5')}</strong>
          </p>
        </div>
        <div className="summary-actions">
          <button className="btn btn-primary btn-lg" onClick={() => startGroup(group.id, mixed)}>🔁 {t('alpha_again')}</button>
          <button className="btn btn-ghost btn-lg" onClick={() => setMode('home')}>{t('alpha_back')}</button>
        </div>
      </>
    );
  }

  // ---------- drill ----------
  return (
    <Drill
      group={group}
      mixed={mixed}
      current={current}
      queue={queue}
      totalQ={totalQ}
      picked={picked}
      onAnswer={answer}
      onNext={() => nextQuestion(queue)}
    />
  );
}

function Drill({ group, mixed, current, queue, totalQ, picked, onAnswer, onNext }: {
  group: AlphaGroup;
  mixed: boolean;
  current: Q | null;
  queue: Q[];
  totalQ: number;
  picked: AlphaLetter | null;
  onAnswer: (choice: AlphaLetter) => void;
  onNext: () => void;
}) {
  const { t, tRaw } = useT();
  const opts = useMemo(() => (current ? optionsFor(current, group) : []), [current, group]);

  if (!current) return null;

  const consonants = isConsonantGroup(group);
  const remaining = queue.length + 1;
  const answered = Math.max(0, totalQ - remaining);
  const isRight = !!picked && picked.lao === current.letter.lao;
  const wasWrong = !!picked && !isRight;

  const prompt = current.dir === 'char'
    ? consonants
      ? t('alpha_q_char_sound').replace('{c}', current.letter.lao)
      : t('alpha_q_syl_roman').replace('{c}', current.letter.lao)
    : consonants
      ? t('alpha_q_sound_char').replace('{s}', current.letter.roman)
      : t('alpha_q_roman_syl').replace('{s}', current.letter.roman);

  return (
    <>
      <div className="page-head alpha-drill-head">
        <Link className="btn btn-ghost" href="/alphabet">
          ← {t('alpha_back')}
        </Link>
        <span className="alpha-progress">{t('alpha_count').replace('{x}', String(answered)).replace('{y}', String(totalQ))}</span>
      </div>

      {current.dir === 'char' ? (
        <div className="big-word card drill-card">
          <div className="alpha-glyph-lg lao">{current.letter.lao}</div>
          <button
            className="icon-btn speak-btn"
            title="Listen" aria-label="Listen"
            onClick={() => speak(current.letter.roman, { lang: 'en-US', rate: 0.8 })}
          >🔊</button>
        </div>
      ) : null}

      <p className="drill-prompt">{prompt}</p>

      <div className="options">
        {opts.map((o) => {
          const cls = [
            'option-card',
            current.dir === 'roman' ? 'glyph-option' : '',
            picked && o.lao === current.letter.lao ? 'correct' : '',
            picked && o.lao === picked.lao && !isRight ? 'wrong' : '',
          ].filter(Boolean).join(' ');
          return (
            <button key={o.lao} className={cls} disabled={!!picked} onClick={() => onAnswer(o)}>
              {current.dir === 'roman'
                ? <span className="lao glyph-only">{o.lao}</span>
                : <span className="roman-only">{o.roman}</span>}
            </button>
          );
        })}
      </div>

      {picked ? (
        <div className={`feedback ${isRight ? 'ok' : 'bad'}`}>
          {isRight ? (
            <H as="p" html={`${esc(pickVariant(tRaw('fb_ok_variants')))} ${esc(pickVariant(tRaw('fb_praise')))} · ${esc(current.letter.lao)} — ${esc(current.letter.roman)}`} />
          ) : (
            <H as="p" html={`${esc(t('fb_bad'))} ${t('fb_correct_answer').replace('{x}', esc(`${current.letter.lao} — ${current.letter.roman}`))}`} />
          )}
        </div>
      ) : null}

      {wasWrong ? (
        <button className="btn btn-continue btn-lg" onClick={onNext}>{t('cont')}</button>
      ) : null}
      <span className="muted mixed-flag">{mixed ? t('alpha_practice_all') : t('alpha_g_' + group.id)}</span>
    </>
  );
}

// Reference-grid card: glyph + karaoke romanization + optional hint.
function RefCard({ letter, lang }: { letter: AlphaLetter; lang: string }) {
  const note = lang === 'fr' ? letter.noteFr : letter.note;
  return (
    <div className="alpha-tile card">
      <div className="alpha-glyph lao">{letter.lao}</div>
      <div className="word-romanization">{letter.roman}</div>
      {note ? <div className="alpha-note">{note}</div> : null}
    </div>
  );
}
