'use client';

// Review: spaced-repetition queue. Ported from legacy review.js.
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { getDueReviews, getUpcomingReviews, type ReviewEntry } from '@/lib/store';
import { LESSON_BY_ID } from '@/data/units.ts';

export default function ReviewPage() {
  const { t, pf } = useT();
  const due = getDueReviews();
  const upcoming = getUpcomingReviews();

  return (
    <>
      <div className="page-head">
        <h1>🔁 {t('review_title')}</h1>
        <p className="section-sub">{t('review_sub')}</p>
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
