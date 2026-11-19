'use client';

// Exercise renderers (React port of legacy lesson.js): multiple choice,
// listen, match, word banks (type-as-tiles + sentence building) and speaking.
// Everything is tap-to-validate; word banks auto-submit once every required
// tile is placed (with a 260ms beat). Each exercise reports exactly once
// through onResolve(ok, correctText) — the parent engine owns feedback,
// scoring and juice.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { SpeakButton } from '@/components/SpeakButton';
import { VOCAB_BY_ID as V } from '@/data/vocab.ts';
import { sfx, buzz, shake, pop, burstAt } from '@/lib/fx';
import { shuffle } from '@/lib/shuffle';
import {
  speakItem, canRecognize, recognize, speechMatches,
  hasLaoVoice, hasNativeAudio,
} from '@/lib/speech';
import type { Exercise, VocabEntry } from '@/data/types';

export interface ExerciseProps {
  ex: Exercise;
  answered: boolean;
  onResolve: (ok: boolean, correctText: string) => void;
}

export function ExerciseView({ ex, answered, onResolve }: ExerciseProps) {
  switch (ex.type) {
    case 'mc': return <McView ex={ex} answered={answered} onResolve={onResolve} />;
    case 'listen': return <ListenView ex={ex} answered={answered} onResolve={onResolve} />;
    case 'match': return <MatchView ex={ex} answered={answered} onResolve={onResolve} />;
    case 'type': return <TypeView ex={ex} answered={answered} onResolve={onResolve} />;
    case 'tiles': return <TilesView ex={ex} answered={answered} onResolve={onResolve} />;
    case 'speak': return <SpeakView ex={ex} answered={answered} onResolve={onResolve} />;
    default: return null;
  }
}

const stripPunct = (s: string) => s.replace(/[.,!?;:"«»“”()]/g, '');
const despaced = (s: string) => s.replace(/\s+/g, '');

// ---------- multiple choice ----------

function McView({ ex, answered, onResolve }: ExerciseProps) {
  const { def } = useT();
  const item = V[ex.answer!] as VocabEntry;
  const lao2en = ex.dir !== 'en2lao';
  const [sel, setSel] = useState(false);
  const order = useMemo(() => shuffle(ex.ids ?? []), [ex]);
  const cls = (id: string) =>
    `option-card${answered && id === ex.answer ? ' correct' : ''}${answered && sel && id !== ex.answer ? ' wrong' : ''}`;
  return (
    <div>
      {lao2en ? (
        <div className="big-word card">
          <div className="word-lao lao">{item.lao}</div>
          {item.romanization ? <div className="word-romanization">{item.romanization}</div> : null}
          <SpeakButton item={item} />
        </div>
      ) : (
        <div className="big-word card"><div className="word-en-lg">{def(item)}</div></div>
      )}
      <div className="options">
        {order.map((id, i) => {
          const w = V[id] as VocabEntry | undefined;
          if (!w) return null;
          return (
            <button
              key={id}
              type="button"
              className={cls(id)}
              disabled={answered}
              onClick={(e) => {
                if (answered) return;
                setSel(true);
                if (id === ex.answer) {
                  pop(e.currentTarget);
                  const r = e.currentTarget.getBoundingClientRect();
                  burstAt(r.left + r.width / 2, r.top + r.height / 2, 14);
                }
                onResolve(id === ex.answer, `${item.lao} — ${item.romanization} — ${def(item)}`);
              }}
            >
              {lao2en ? (
                <span>{def(w)}</span>
              ) : (
                <div className="opt-col">
                  <span className="lao">{w.lao}</span>
                  {w.romanization ? <span className="opt-sub">{w.romanization}</span> : null}
                </div>
              )}
              <span className="kbd" aria-hidden="true">{i + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- listening ----------

function ListenView({ ex, answered, onResolve }: ExerciseProps) {
  const { t, def } = useT();
  const answer = V[ex.answer!] as VocabEntry;
  const [picked, setPicked] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const order = useMemo(() => shuffle(ex.ids ?? []), [ex]);
  const voiceless = !hasNativeAudio(answer) && !hasLaoVoice();

  useEffect(() => {
    const id = window.setTimeout(() => { void speakItem(answer); }, 400);
    return () => window.clearTimeout(id);
  }, [answer]);

  const play = () => {
    void speakItem(answer);
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), 1200);
  };

  const cls = (id: string) =>
    `option-card${answered && id === ex.answer ? ' correct' : ''}${answered && picked === id && id !== ex.answer ? ' wrong' : ''}`;

  return (
    <div>
      <div className="big-word card listen-card">
        <button
          type="button"
          className={`play-btn${playing ? ' playing' : ''}`}
          aria-label={t('title_play_audio')}
          onClick={play}
        >
          🔊
        </button>
        <p className="muted">
          {voiceless
            ? t('listen_novoice', { x: answer.romanization })
            : t('listen_play')}
        </p>
      </div>
      <div className="options">
        {order.map((id, i) => {
          const w = V[id] as VocabEntry | undefined;
          if (!w) return null;
          return (
            <button
              key={id}
              type="button"
              className={cls(id)}
              disabled={answered}
              onClick={(e) => {
                if (answered) return;
                setPicked(id);
                if (id === ex.answer) {
                  pop(e.currentTarget);
                  const r = e.currentTarget.getBoundingClientRect();
                  burstAt(r.left + r.width / 2, r.top + r.height / 2, 14);
                }
                onResolve(id === ex.answer, `${answer.lao} — ${answer.romanization} — ${def(answer)}`);
              }}
            >
              <span>{def(w)}</span>
              <span className="kbd" aria-hidden="true">{i + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- matching pairs ----------

function MatchView({ ex, answered, onResolve }: ExerciseProps) {
  const { t, def } = useT();
  const items = useMemo(
    () => (ex.ids ?? []).map((id) => V[id]).filter(Boolean) as VocabEntry[],
    [ex],
  );
  const left = useMemo(() => shuffle(items), [items]);
  const right = useMemo(() => shuffle(items), [items]);
  const [matched, setMatched] = useState<string[]>([]);
  const [selL, setSelL] = useState<string | null>(null);
  const [selR, setSelR] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState(false);

  // wrong pair: flash for 350ms then clear both selections
  useEffect(() => {
    if (!wrongFlash) return;
    const id = window.setTimeout(() => { setWrongFlash(false); setSelL(null); setSelR(null); }, 350);
    return () => window.clearTimeout(id);
  }, [wrongFlash]);

  // both sides selected → compare
  useEffect(() => {
    if (answered || !selL || !selR) return;
    if (selL === selR) {
      setMatched((m) => [...m, selL]);
      setSelL(null);
      setSelR(null);
      sfx('match');
      buzz([10, 24, 10]);
      document.querySelectorAll('.match-grid .option-card.selected').forEach((el) => pop(el as HTMLElement));
    } else {
      sfx('wrong');
      buzz(40);
      document.querySelectorAll('.match-grid .option-card.selected').forEach((el) => shake(el as HTMLElement));
      setWrongFlash(true);
    }
  }, [selL, selR, answered]);

  // all pairs matched → resolve
  useEffect(() => {
    if (answered || !items.length) return;
    if (matched.length === items.length) onResolve(true, 'All pairs matched');
  }, [matched, items.length, answered, onResolve]);

  const card = (v: VocabEntry, side: 'lao' | 'en') => {
    const isMatched = matched.includes(v.id);
    const isSel = side === 'lao' ? selL === v.id : selR === v.id;
    const isWrong = wrongFlash && ((side === 'lao' && selL === v.id) || (side === 'en' && selR === v.id));
    return (
      <button
        key={`${side}-${v.id}`}
        type="button"
        className={`option-card match-card${isMatched ? ' matched' : ''}${isSel ? ' selected' : ''}${isWrong ? ' wrong' : ''}`}
        disabled={answered || isMatched}
        onClick={() => {
          if (answered || isMatched || wrongFlash) return;
          if (side === 'lao') setSelL(selL === v.id ? null : v.id);
          else setSelR(selR === v.id ? null : v.id);
        }}
      >
        {side === 'lao' ? (
          <div className="opt-col">
            <span className="lao">{v.lao}</span>
            {v.romanization ? <span className="opt-sub">{v.romanization}</span> : null}
          </div>
        ) : (
          <span>{def(v)}</span>
        )}
      </button>
    );
  };

  return (
    <div>
      <div className="match-grid">
        <div className="match-col">{left.map((v) => card(v, 'lao'))}</div>
        <div className="match-col">{right.map((v) => card(v, 'en'))}</div>
      </div>
      <p className="action-hint match-hint">{t('hint_match', { x: matched.length, y: items.length })}</p>
    </div>
  );
}

// ---------- word banks (type-as-tiles + sentence building) ----------

interface BankToken { uid: string; lao?: string; roman?: string; text?: string }

function Bank({
  tokens, required, answered, onResolve, evaluate,
}: {
  tokens: BankToken[];
  required: number;
  answered: boolean;
  onResolve: (ok: boolean, correctText: string) => void;
  evaluate: (chosen: BankToken[]) => { ok: boolean; correctText: string };
}) {
  const { t } = useT();
  const bank = useMemo(() => shuffle(tokens), [tokens]);
  const byUid = useMemo(() => new Map(bank.map((tok) => [tok.uid, tok])), [bank]);
  const [chosen, setChosen] = useState<string[]>([]);
  const answerRef = useRef<HTMLDivElement>(null);

  const evaluateRef = useRef(evaluate);
  evaluateRef.current = evaluate;
  const resolveRef = useRef(onResolve);
  resolveRef.current = onResolve;
  const answeredRef = useRef(answered);
  answeredRef.current = answered;

  // auto-submit once every required tile is placed (one short beat)
  useEffect(() => {
    if (answered || chosen.length !== required) return;
    const id = window.setTimeout(() => {
      const picked = chosen.map((u) => byUid.get(u)).filter(Boolean) as BankToken[];
      const res = evaluateRef.current(picked);
      if (!res.ok) shake(answerRef.current);
      if (!answeredRef.current) resolveRef.current(res.ok, res.correctText);
    }, 260);
    return () => window.clearTimeout(id);
  }, [chosen, required, answered, byUid]);

  const tile = (tok: BankToken, isChosen: boolean) => {
    // tiles play their own pick/unpick sounds, so opt out of the global tick
    const pos = bank.indexOf(tok);
    return (
      <button
        key={tok.uid}
        type="button"
        data-sfx-off
        className={`tile${isChosen ? ' chosen' : ''}`}
        disabled={answered}
        onClick={(e) => {
          if (answered) return;
          if (isChosen) {
            setChosen((c) => c.filter((u) => u !== tok.uid));
            sfx('deselect');
          } else if (!chosen.includes(tok.uid)) {
            setChosen((c) => [...c, tok.uid]);
            sfx('select');
            pop(e.currentTarget);
          }
        }}
      >
        {tok.lao != null ? (
          <>
            <span className="lao">{tok.lao.trim()}</span>
            {tok.roman ? <span className="opt-sub">{tok.roman}</span> : null}
          </>
        ) : (
          <span>{tok.text}</span>
        )}
        {!isChosen && pos >= 0 && pos < 9 ? <span className="kbd" aria-hidden="true">{pos + 1}</span> : null}
      </button>
    );
  };

  return (
    <div className="tiles-wrap">
      <div className="tile-answer" ref={answerRef}>
        {chosen.length
          ? chosen.map((u) => (byUid.get(u) ? tile(byUid.get(u)!, true) : null))
          : <span className="muted">{t('ph_tiles')}</span>}
      </div>
      <div className="tile-bank">
        {bank.filter((tok) => !chosen.includes(tok.uid)).map((tok) => tile(tok, false))}
      </div>
    </div>
  );
}

// type-as-tiles: assemble the Lao word (romanized distractors) or the English
// meaning from a word bank — no keyboard needed.
function TypeView({ ex, answered, onResolve }: ExerciseProps) {
  const { def, lang } = useT();
  const item = V[ex.id!] as VocabEntry;
  const en2lao = ex.dir === 'en2lao';
  // meaning in the current UI language — FR learners tap FR word tiles
  const meaningOf = (w: VocabEntry) => def(w) ?? w.en;
  // number/measure entries are glossed like "7 (sept)" — the gloss is a hint,
  // not part of the answer, so strip it before turning the meaning into tiles.
  const cleanAnswer = (s: string) => s.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

  const { tokens, required } = useMemo(() => {
    if (en2lao) {
      const target: BankToken = { uid: 'a', lao: item.lao, roman: item.romanization };
      const others = shuffle(Object.values(V).filter((w) => w.id !== item.id));
      const pool = [...others.filter((w) => w.cat === item.cat), ...others];
      const seen = new Set([item.lao.trim()]);
      const distractors: BankToken[] = [];
      for (const w of pool) {
        if (distractors.length >= 4) break;
        if (seen.has(w.lao.trim())) continue;
        seen.add(w.lao.trim());
        distractors.push({ uid: `d${distractors.length}`, lao: w.lao, roman: w.romanization });
      }
      return { tokens: [target, ...distractors], required: 1 };
    }
    let words = stripPunct(cleanAnswer(meaningOf(item))).trim().split(/\s+/).filter(Boolean);
    if (!words.length) words = [meaningOf(item).trim()];
    const seen = new Set(words.map((w) => w.toLowerCase()));
    const others = shuffle(Object.values(V).filter((w) => w.id !== item.id));
    const pool = [...others.filter((w) => w.cat === item.cat), ...others];
    const distractors: BankToken[] = [];
    for (const w of pool) {
      if (distractors.length >= 4) break;
      const first = stripPunct(cleanAnswer(meaningOf(w))).trim().split(/\s+/)[0];
      if (!first || seen.has(first.toLowerCase())) continue;
      seen.add(first.toLowerCase());
      distractors.push({ uid: `x${distractors.length}`, text: first });
    }
    return { tokens: [...words.map((w, i) => ({ uid: `t${i}`, text: w })), ...distractors], required: words.length };
  }, [en2lao, item, lang]);

  return (
    <div>
      {en2lao ? (
        <div className="big-word card"><div className="word-en-lg">{def(item)}</div></div>
      ) : (
        <div className="big-word card">
          <div className="word-lao lao">{item.lao}</div>
          {item.romanization ? <div className="word-romanization">{item.romanization}</div> : null}
          <SpeakButton item={item} />
        </div>
      )}
      <Bank
        tokens={tokens}
        required={required}
        answered={answered}
        onResolve={onResolve}
        evaluate={(chosenToks) => {
          const got = chosenToks.map((x) => (x.lao != null ? x.lao : (x.text || '').toLowerCase())).join('');
          const want = en2lao
            ? item.lao
            : stripPunct(cleanAnswer(meaningOf(item))).trim().split(/\s+/).map((w) => w.toLowerCase()).join('');
          return { ok: despaced(got) === despaced(want), correctText: `${item.lao} — ${item.romanization} — ${def(item)}` };
        }}
      />
    </div>
  );
}

// sentence building: assemble the Lao sentence from tap-tokens
function TilesView({ ex, answered, onResolve }: ExerciseProps) {
  const { pf } = useT();
  const tokens = useMemo<BankToken[]>(
    () => (ex.words ?? []).map((w, i) => ({ uid: `t${i}`, lao: w, roman: ex.wordRoman?.[i] || '' })),
    [ex],
  );
  return (
    <div>
      <div className="big-word card"><div className="word-en-lg">{pf(ex, 'en')}</div></div>
      <Bank
        tokens={tokens}
        required={(ex.words ?? []).length}
        answered={answered}
        onResolve={onResolve}
        evaluate={(chosenToks) => {
          const got = chosenToks.map((x) => x.lao ?? '').join('');
          return {
            ok: despaced(got) === despaced(ex.lao ?? ''),
            correctText: `${ex.lao} — ${ex.romanization ?? ''}`,
          };
        }}
      />
    </div>
  );
}

// ---------- speaking ----------

function SpeakView({ ex, answered, onResolve }: ExerciseProps) {
  const { t, def } = useT();
  const item = V[ex.id!] as VocabEntry;
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const mic = canRecognize();

  const ask = async () => {
    if (answered || busy) return;
    setBusy(true);
    setStatus(t('speak_listening'));
    const transcript = await recognize({ lang: 'lo-LA' });
    setBusy(false);
    if (answered) return;
    if (transcript === null) { setStatus(t('speak_missed')); return; }
    setStatus(t('speak_heard', { x: transcript }));
    onResolve(speechMatches(transcript, item), `${item.lao} — ${item.romanization}`);
  };

  const saidIt = () => {
    if (answered) return;
    setStatus(t('speak_listening'));
    onResolve(true, `${item.lao} — ${item.romanization}`);
  };

  return (
    <div className="speak-wrap">
      <div className="big-word card">
        <div className="word-lao lao">{item.lao}</div>
        {item.romanization ? <div className="word-romanization">{item.romanization}</div> : null}
        <div className="word-en">{def(item)}</div>
        <SpeakButton item={item} />
      </div>
      {mic ? (
        <>
          <button type="button" className="btn btn-mic btn-lg" disabled={busy || answered} onClick={ask}>
            🎤 {t('speak_tap')}
          </button>
          <p className="muted speak-status">{status}</p>
          <button type="button" className="btn btn-ghost" disabled={answered} onClick={saidIt}>
            {t('speak_said')}
          </button>
        </>
      ) : (
        <>
          <p className="muted">{t('speak_nomic')}</p>
          <p className="muted speak-status">{status}</p>
          <button type="button" className="btn btn-primary btn-lg" disabled={answered} onClick={saidIt}>
            {t('speak_said_loud')}
          </button>
        </>
      )}
    </div>
  );
}
