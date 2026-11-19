'use client';

// Lesson screens: feedback banner (fixed bottom action bar), fail screen and
// the victory / practice summaries with the achievements grid. Mirrors legacy
// lesson.js markup and class names.
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useT } from '@/lib/i18n';
import { pop, shake } from '@/lib/fx';

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Fixed action-bar feedback shown after every answer. CONTINUE is always
// enabled; when hearts run out it relabels to "See results".
export function Feedback({ ok, correctText, explain, practice, hearts, onContinue }: {
  ok: boolean;
  correctText: string;
  explain?: string;
  practice: boolean;
  hearts: number;
  onContinue: () => void;
}) {
  const { t, pickVariant } = useT();
  const xp = practice ? 5 : 10;
  return (
    <div className={`feedback ${ok ? 'ok' : 'bad'}`}>
      <img src="/img/elephant.svg" alt="" className={`feedback-mascot${ok ? '' : ' somber'}`} aria-hidden="true" />
      <div className="feedback-icon" aria-hidden="true">{ok ? '🎉' : '💡'}</div>
      <div>
        <strong>{ok ? pickVariant(t('fb_ok_variants')) : t('fb_bad')}</strong>
        {ok
          ? <p>+{xp} XP · {pickVariant(t('fb_praise'))}</p>
          : (
            <p
              dangerouslySetInnerHTML={{
                // fb_correct_answer contains intentional <b> markup — escape
                // only the interpolated correct answer text
                __html: t('fb_correct_answer').replace('{x}', esc(correctText)),
              }}
            />
          )}
        {!ok && explain ? <p className="feedback-note">{explain}</p> : null}
      </div>
      <button type="button" className="btn btn-continue btn-lg" onClick={onContinue}>
        {hearts <= 0 && !practice ? t('see_result') : t('cont')}
      </button>
    </div>
  );
}

export function FailScreen({ correct, total, lessonHref }: { correct: number; total: number; lessonHref: string }) {
  const { t } = useT();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { shake(ref.current); }, []);
  return (
    <div className="lesson-stage fx-stage" ref={ref}>
      <div className="summary card fail">
        <img src="/img/elephant.svg" alt="" className="fail-mascot" aria-hidden="true" />
        <div className="summary-icon">💔</div>
        <h1>{t('fail_title')}</h1>
        <p
          dangerouslySetInnerHTML={{
            // fail_sub may contain intentional markup — escape nothing in the template
            __html: t('fail_sub').replace('{x}', String(correct)).replace('{y}', String(total)),
          }}
        />
        <div className="summary-actions">
          <Link className="btn btn-primary btn-lg" href={lessonHref}>{t('try_again')}</Link>
          <Link className="btn btn-ghost" href="/learn">{t('back_path')}</Link>
        </div>
      </div>
    </div>
  );
}

interface Stat { strong: string; span: string }
export interface Badge { id: string; icon: string; name: string; desc: string }

export function SummaryScreen({ icon, laoHtml, body, stats, nextId, missedCount, lessonHref, showReplay, badges, onStartPractice }: {
  icon: string;
  laoHtml?: string;
  body: string;
  stats: Stat[];
  nextId: string | null;
  missedCount: number;
  lessonHref: string;
  showReplay: boolean;
  badges: Badge[];
  onStartPractice: () => void;
}) {
  const { t } = useT();
  const iconRef = useRef<HTMLDivElement>(null);
  useEffect(() => { pop(iconRef.current); }, []);
  return (
    <div className="lesson-stage fx-stage">
      <div className="summary card">
        <div className="summary-icon" ref={iconRef}>{icon}</div>
        <h1>{t('done_title')}</h1>
        {laoHtml ? <p className="summary-lao" dangerouslySetInnerHTML={{ __html: laoHtml }} /> : null}
        <p>{body}</p>
        <div className="summary-stats">
          {stats.map((s) => (
            <div className="stat" key={s.span}><strong>{s.strong}</strong><span>{s.span}</span></div>
          ))}
        </div>
        <div className="summary-actions">
          {nextId
            ? <Link className="btn btn-primary btn-lg" href={`/lesson?id=${nextId}`}>{t('next_lesson')}</Link>
            : null}
          {missedCount > 0
            ? <button type="button" className="btn btn-ghost btn-lg" onClick={onStartPractice}>{t('practice_mistakes')} ({missedCount})</button>
            : null}
          <Link className="btn btn-ghost btn-lg" href="/learn">{t('back_path')}</Link>
          {showReplay ? <Link className="btn btn-ghost" href={lessonHref}>{t('replay')}</Link> : null}
        </div>
        {badges.length ? (
          <div className="summary-badges">
            <h3>{t('summary_achievements')}</h3>
            <div className="badge-grid">
              {badges.slice(-6).map((a) => (
                <div className="badge-card" key={a.id}>
                  <span className="badge-icon">{a.icon}</span>
                  <div><strong>{a.name}</strong><p>{a.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
