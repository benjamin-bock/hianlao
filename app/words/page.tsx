'use client';

// Words: searchable Lao dictionary with category chips and the tricky-words
// notebook section. Ported from legacy words.js.
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useT, def, noteOf } from '@/lib/i18n';
import { getWeakWords } from '@/lib/store';
import { SpeakButton } from '@/components/SpeakButton';
import { VOCAB, VOCAB_BY_ID, CATEGORIES, CATEGORIES_FR } from '@/data/vocab.ts';
import type { VocabEntry } from '@/data/types';

export default function WordsPage() {
  const { t, lang } = useT();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [weak, setWeak] = useState<Array<{ id: string; n: number; at: number }>>([]);

  useEffect(() => {
    setWeak(getWeakWords().filter((w) => VOCAB_BY_ID[w.id]).slice(0, 12));
  }, []);

  const list = useMemo(() => VOCAB.filter((v) => matches(v, activeCat, query)), [activeCat, query]);
  const base = list.length === 1 ? t('words_count_one') : t('words_count_many');
  let countLine = base.replace('{x}', String(list.length));
  if (activeCat !== 'all') countLine += t('words_in').replace('{y}', CATEGORIES[activeCat] || activeCat);
  if (query) countLine += t('words_matching').replace('{y}', query);

  return (
    <>
      <div className="page-head">
        <h1>{t('words_title')}</h1>
        <p className="section-sub">{t('words_sub')}</p>
      </div>

      {weak.length ? (
        <section className="unit-section">
          <h2>🎯 {t('weak_title')} ({weak.length})</h2>
          <p className="section-sub">{t('weak_sub')}</p>
          <div className="word-grid">
            {weak.map((w) => {
              const v = VOCAB_BY_ID[w.id];
              if (!v) return null;
              return (
                <div key={w.id} className="word-card card weak-word-card">
                  <div className="word-card-top">
                    <div>
                      <div className="word-lao lao">{v.lao}</div>
                      <div className="word-romanization">{v.romanization}</div>
                      <div className="word-en">{def(v)}</div>
                    </div>
                    <SpeakButton item={v} />
                  </div>
                  <div className="weak-count">🔥 ×{w.n}</div>
                  {v.note ? <div className="word-note">{noteOf(v)}</div> : null}
                </div>
              );
            })}
          </div>
          <Link className="btn btn-primary weak-drill" href="/lesson?id=__weak">⚡ {t('weak_practice')}</Link>
        </section>
      ) : null}

      <input
        className="search-input"
        type="search"
        placeholder={t('words_search')}
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="chips">
        <Chip label={t('words_all').replace('{x}', String(VOCAB.length))} active={activeCat === 'all'} onClick={() => setActiveCat('all')} />
        {Object.entries(CATEGORIES).map(([k, label]) => (
          <Chip
            key={k}
            label={lang === 'fr' ? (CATEGORIES_FR[k] || label) : label}
            active={activeCat === k}
            onClick={() => setActiveCat(k)}
          />
        ))}
      </div>
      <p className="muted count-line">{countLine}</p>
      <div className="word-grid">
        {list.length ? list.map((v) => <WordCard key={v.id} v={v} lang={lang} />) : (
          <div className="empty card">{t('words_empty')}</div>
        )}
      </div>
    </>
  );
}

function matches(v: VocabEntry, activeCat: string, query: string): boolean {
  if (activeCat !== 'all' && v.cat !== activeCat) return false;
  if (!query) return true;
  const q = query.toLowerCase().trim();
  return v.lao.includes(query.trim()) || v.romanization.toLowerCase().includes(q) || v.en.toLowerCase().includes(q) || (v.fr || '').toLowerCase().includes(q);
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button className={`chip${active ? ' active' : ''}`} onClick={onClick}>{label}</button>;
}

function WordCard({ v, lang }: { v: VocabEntry; lang: string }) {
  return (
    <div className="word-card card">
      <div className="word-card-top">
        <div>
          <div className="word-lao lao">{v.lao}</div>
          <div className="word-romanization">{v.romanization}</div>
          <div className="word-en">{def(v)}</div>
        </div>
        <SpeakButton item={v} />
      </div>
      {v.note ? <div className="word-note">{noteOf(v)}</div> : null}
      <div className="word-cat">{lang === 'fr' ? (CATEGORIES_FR[v.cat] || v.cat) : (CATEGORIES[v.cat] || v.cat)}</div>
    </div>
  );
}
