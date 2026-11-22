'use client';

// Learn: the unit path with locks, daily goal, repetition nudges (due reviews
// + tricky words) and the leaderboard. Ported from legacy learn.js.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';
import { isDone, totalDone, api, getUser, getState, setGoal, getDueReviews, getWeakWords } from '@/lib/store';
import { useShell } from '@/components/SiteShell';
import { UnitIcon } from '@/components/Icons';
import { Check, Lock, Play, RotateCcw, Target, Zap } from 'lucide-react';
import { UNITS } from '@/data/units.ts';
import { VOCAB_BY_ID } from '@/data/vocab.ts';

const allLessons = UNITS.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u })));

function isUnlocked(index: number, done: Record<string, number>): boolean {
  if (index === 0) return true;
  return !!done[allLessons[index - 1].id];
}

export default function LearnPage() {
  const { t, pf } = useT();
  const { user } = useShell();
  const [, bump] = useState(0);
  const [goal, setGoalState] = useState(20);
  const [xpToday, setXpToday] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [doneMap, setDoneMap] = useState<Record<string, number>>({});
  const [nudges, setNudges] = useState({ due: 0, weak: 0 });
  const [firstDone, setFirstDone] = useState(false);

  useEffect(() => {
    const s = getState();
    setGoalState(s.goal || 20);
    setXpToday(s.xpToday || 0);
    setDoneMap(s.done);
    setDoneCount(totalDone());
    setNudges({ due: getDueReviews().length, weak: getWeakWords().filter((w) => VOCAB_BY_ID[w.id]).length });
    setFirstDone(totalDone() > 0);
    bump((n) => n + 1);
  }, []);

  const goalPct = Math.min(100, Math.round(((xpToday || 0) / (goal || 20)) * 100));
  const firstUndone = allLessons.findIndex((l) => !doneMap[l.id]);
  const next = firstUndone >= 0 ? allLessons[firstUndone] : null;

  return (
    <>
      <div className="page-head">
        <h1>{t('learn_title')}</h1>
        <p className="section-sub">{doneCount}/{allLessons.length} {t('learn_sub')}</p>
      </div>

      <div className="card goal-card">
        <div className="goal-row">
          <strong>{t('goal_title')}</strong>
          <select
            aria-label={t('goal_select')}
            value={String(goal)}
            onChange={(e) => { const g = setGoal(Number(e.target.value)); setGoalState(g); setXpToday(getState().xpToday || 0); }}
          >
            {[10, 20, 50, 100].map((g) => <option key={g} value={String(g)}>{g} XP</option>)}
          </select>
          <div className="goal-bar"><div className="goal-fill" style={{ width: `${goalPct}%` }} /></div>
          <span className="muted">{t('goal_today')}: <Zap size={13} style={{ verticalAlign: '-.1em' }} /> {xpToday || 0} / {goal || 20} XP ({goalPct}%)</span>
        </div>
      </div>

      {/* Repetition nudges: due reviews and tricky words come first — repetition is key. */}
      {(nudges.due || nudges.weak) ? (
        <div className="nudges">
          {nudges.due ? (
            <Link className="card nudge-card nudge-review" href="/review">
              <span className="nudge-icon"><RotateCcw /></span>
              <div className="nudge-text">
                <strong>{nudges.due} {t('learn_due_card')}</strong>
                <span className="muted">{t('learn_due_sub')}</span>
              </div>
              <span className="nudge-go">{t('review_now')} →</span>
            </Link>
          ) : null}
          {nudges.weak ? (
            <Link className="card nudge-card nudge-weak" href="/lesson?id=__weak">
              <span className="nudge-icon"><Target /></span>
              <div className="nudge-text">
                <strong>{nudges.weak} {t('learn_weak_card')}</strong>
                <span className="muted">{t('learn_weak_sub')}</span>
              </div>
              <span className="nudge-go">{t('drill_now')} →</span>
            </Link>
          ) : null}
        </div>
      ) : null}

      {UNITS.map((unit) => (
        <section key={unit.id} className="unit-section">
          <div className="unit-header" style={{ ['--unit-color' as string]: unit.color }}>
            <div className="unit-badge" style={{ ['--unit-color' as string]: unit.color }}><UnitIcon id={unit.id} /></div>
            <div>
              <h2>{t('unit_n').replace('{x}', String(unit.num)).replace('{y}', pf(unit, 'title') ?? '')}</h2>
              <p className="unit-desc">{pf(unit, 'desc') ?? ''}</p>
            </div>
          </div>
          <div className="lessons-path">
            {unit.lessons.map((l) => {
              const globalIndex = allLessons.findIndex((x) => x.id === l.id);
              const done = !!doneMap[l.id];
              const unlocked = isUnlocked(globalIndex, doneMap);
              return (
                <Link
                  key={l.id}
                  className={`lesson-node${done ? ' done' : ''}${unlocked ? '' : ' locked'}`}
                  href={unlocked ? `/lesson?id=${l.id}` : '#'}
                  style={{ ['--unit-color' as string]: unit.color }}
                  aria-disabled={unlocked ? 'false' : 'true'}
                  onClick={(e) => { if (!unlocked) e.preventDefault(); }}
                >
                  <div className="lesson-circle">{done ? <Check strokeWidth={3.2} /> : unlocked ? <Play /> : <Lock />}</div>
                  <div className="lesson-meta">
                    <strong>{pf(l, 'title') ?? ''}</strong>
                    <span>{t('n_exercises').replace('{x}', String(l.exercises.length))}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {next ? (
        <div className="sticky-cta">
          <Link className="btn btn-primary btn-lg" href={`/lesson?id=${next.id}`}><Play /> {t('next_cta')}: {pf(next, 'title') ?? ''}</Link>
        </div>
      ) : null}

      <LeaderboardCard user={user} />
    </>
  );
}

function LeaderboardCard({ user }: { user: { id: number; username: string; displayName?: string | null } | null }) {
  const { t } = useT();
  const [period, setPeriod] = useState<'all' | 'week'>('all');
  const [available, setAvailable] = useState<boolean | null>(null); // null = checking
  const [entries, setEntries] = useState<Array<{ username: string; displayName?: string; xp: number }>>([]);

  useEffect(() => {
    api.check().then(setAvailable);
  }, []);

  useEffect(() => {
    if (available && user) {
      api.leaderboard(10, period).then(setEntries);
    }
  }, [available, period, user]);

  return (
    <section className="card leaderboard-card">
      <h2>{t('lb_title')}</h2>
      <p className="muted">{t('lb_sub')}</p>
      <div className="mode-tabs">
        {([['all', t('lb_all')], ['week', t('lb_week')]] as const).map(([p, label]) => (
          <button key={p} className={`chip${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>{label}</button>
        ))}
      </div>
      <ol className="leaderboard-list">
        {available === false ? <li className="muted">{t('lb_offline')}</li> : null}
        {available && !user ? (
          <li className="muted"><Link href="/account">{t('lb_signin')}</Link> {t('lb_join')}</li>
        ) : null}
        {available && user ? (
          entries.length ? (
            entries.map((e, i) => {
              const me = user && e.username === user.username.toLowerCase();
              return (
                <li key={e.username} className={me ? 'me' : ''}>
                  <span className="lb-rank">{String(i + 1)}</span>
                  <span className="lb-name">{e.displayName || e.username}</span>
                  <span className="lb-xp"><Zap size={13} style={{ verticalAlign: '-.1em' }} /> {e.xp}</span>
                </li>
              );
            })
          ) : (
            <li className="muted">{t('lb_empty')}</li>
          )
        ) : null}
      </ol>
    </section>
  );
}
