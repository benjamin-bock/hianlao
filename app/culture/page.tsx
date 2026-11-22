'use client';

// Culture: illustrated stories. Ported from legacy culturepage.js.
import { useT } from '@/lib/i18n';
import { CULTURE } from '@/data/culture.ts';
import { CultureIcon } from '@/components/Icons';
import type { CultureBlock } from '@/data/types';

export default function CulturePage() {
  const { t, lang } = useT();
  const fr = lang === 'fr';

  return (
    <>
      <div className="page-head">
        <h1>{t('culture_title')}</h1>
        <div className="section-sub"><span dangerouslySetInnerHTML={{ __html: t('culture_sub') }} /></div>
      </div>

      {CULTURE.map((c) => (
        <section key={c.id} className="doc-section card culture-section" id={`c-${c.id}`}>
          {c.img ? <img className="culture-img" src={`/img/${c.img}`} alt={c.title} loading="lazy" /> : null}
          <h2><CultureIcon id={c.id} style={{ verticalAlign: '-.15em', marginRight: '.35em', color: 'var(--brand)' }} /> {fr ? c.titleFr : c.title}</h2>
          {c.blocks.map((b, i) => <CultureBlockView key={i} b={b} fr={fr} />)}
        </section>
      ))}
    </>
  );
}

function CultureBlockView({ b, fr }: { b: CultureBlock; fr: boolean }) {
  switch (b.t) {
    case 'p': return <p dangerouslySetInnerHTML={{ __html: fr ? b.htmlFr : b.html }} />;
    case 'ex': return (
      <div className="ex-row">
        <span className="lao ex-lao">{b.lao}</span>
        <span className="ex-romanization">{b.romanization}</span>
        <span className="ex-en">{fr ? b.enFr : b.en}</span>
      </div>
    );
    case 'list': return (
      <ul className="doc-list">
        {(fr ? b.itemsFr : b.items).map((i, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: i }} />)}
      </ul>
    );
    case 'note': return <div className="note-box" dangerouslySetInnerHTML={{ __html: fr ? b.htmlFr : b.html }} />;
    default: return null;
  }
}
