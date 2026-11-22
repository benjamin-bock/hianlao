'use client';

// Home: hero, features, path preview, CTA. Ported from legacy home.js.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';
import { getState, totalDone } from '@/lib/store';
import { SpeakButton } from '@/components/SpeakButton';
import { H } from '@/components/H';
import { UnitIcon } from '@/components/Icons';
import { BookOpen, CaseSensitive, Gift, GraduationCap, Landmark, Target, UserRound, Volume2, type LucideIcon } from 'lucide-react';
import { VOCAB, VOCAB_BY_ID } from '@/data/vocab.ts';
import { UNITS, LESSON_BY_ID } from '@/data/units.ts';
import { GRAMMAR } from '@/data/grammar.ts';
import { CULTURE } from '@/data/culture.ts';

export default function Home() {
  const { t } = useT();
  // Client-only bits (localStorage progress) render values after hydration.
  const [started, setStarted] = useState(false);
  useEffect(() => setStarted(getState().xp > 0 || totalDone() > 0), []);
  const lessonsTotal = Object.keys(LESSON_BY_ID).length;
  const heroHref = started ? '/learn' : '/lesson?id=u1l1';
  const ctaHref = started ? '/learn' : '/lesson?id=u1l1';

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <p className="hero-kicker">{t('hero_kicker')}</p>
          <H as="h1" html={t('home_hero_title')} />
          <H as="p" className="hero-sub" html={t('hero_sub')} />
          <div className="hero-ctas">
            <Link className="btn btn-primary btn-lg" href={heroHref}>
              {started ? t('cta_continue') : t('cta_start')}
            </Link>
            <Link className="btn btn-ghost btn-lg" href="/culture">{t('cta_culture')}</Link>
          </div>
          <div className="hero-stats">
            <div className="stat"><strong>{VOCAB.length}+</strong><span>{t('stat_words')}</span></div>
            <div className="stat"><strong>{lessonsTotal}</strong><span>{t('stat_lessons')}</span></div>
            <div className="stat"><strong>{GRAMMAR.length}</strong><span>{t('stat_grammar')}</span></div>
            <div className="stat"><strong>{CULTURE.length}</strong><span>{t('stat_culture')}</span></div>
          </div>
        </div>
        <div className="hero-art">
          <div className="illu-frame">
            <img src="/img/illu/online-learning.svg" alt="Illustration of learning Lao online" />
          </div>
          <div className="hero-word-card card">
            <div className="word-lao lao">ສະບາຍດີ</div>
            <div className="word-tr">sa-bai-dii</div>
            <div className="word-en">Hello</div>
            {VOCAB_BY_ID.hello ? <SpeakButton item={VOCAB_BY_ID.hello} /> : null}
          </div>
        </div>
      </section>

      <section className="features">
        <h2>{t('features_title')}</h2>
        <div className="feature-grid">
          {/* feature cards rendered from the list below */}
          {[
            { icon: Target, color: '#58cc02', title: t('feat_lessons'), text: t('feat_lessons_desc') },
            { icon: CaseSensitive, color: '#1cb0f6', title: t('feat_alphabet'), text: t('feat_alphabet_desc') },
            { icon: Volume2, color: '#8b5cf6', title: t('feat_audio'), text: t('feat_audio_desc') },
            { icon: BookOpen, color: '#ff9600', title: t('feat_grammar'), text: t('feat_grammar_desc') },
            { icon: GraduationCap, color: '#0ea5e9', title: t('feat_words'), text: t('feat_words_desc') },
            { icon: Landmark, color: '#d946ef', title: t('feat_culture'), text: t('feat_culture_desc') },
            { icon: UserRound, color: '#14b8a6', title: t('feat_account'), text: t('feat_account_desc') },
            { icon: Gift, color: '#ce1126', title: t('feat_free'), text: t('feat_free_desc') }
          ].map((f) => feature(f))}
        </div>
      </section>

      <section className="path-preview">
        <h2>{t('path_title')}</h2>
        <H as="p" className="section-sub" html={t('path_preview_sub').replace('{x}', String(UNITS.length))} />
        <div className="units-preview">
          {UNITS.map((u) => (
            <Link key={u.id} className="unit-chip" href="/learn" style={{ ['--unit-color' as string]: u.color }}>
              <span className="unit-icon"><UnitIcon id={u.id} /></span>
              <span className="unit-title">{u.num}. {u.title}</span>
            </Link>
          ))}
        </div>
        <Link className="btn btn-primary" href="/learn">{t('open_path')}</Link>
      </section>

      <section className="cta card">
        <img src="/img/illu/graduation.svg" alt="" className="cta-illu" aria-hidden="true" />
        <H as="h2" html={t('cta_title')} />
        <p>{t('cta_sub')}</p>
        <Link className="btn btn-primary btn-lg" href={ctaHref}>{t('cta_now')}</Link>
      </section>
    </>
  );
}

function feature(f: { icon: LucideIcon; color: string; title: string; text: string }) {
  const Icon = f.icon;
  return (
    <div key={f.title} className="feature-card card">
      <div className="feature-icon" style={{ ['--fc' as string]: f.color }}><Icon /></div>
      <h3>{f.title}</h3>
      <p>{f.text}</p>
    </div>
  );
}
