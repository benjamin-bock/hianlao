'use client';

// Grammar bible: TOC + sections. Ported from legacy grammarpage.js.
import { useT } from '@/lib/i18n';
import { GRAMMAR } from '@/data/grammar.ts';
import type { GrammarBlock } from '@/data/types';

// Wrap runs of Lao characters in <span class="lao"> so plain table cells get
// the Lao font (same approach as the legacy page).
function wrapLao(text: string): string {
  let out = '', buf = '', inLao: boolean | null = null;
  for (const ch of String(text)) {
    const code = ch.codePointAt(0) ?? 0;
    const lao = code >= 0x0E80 && code <= 0x0EFF;
    if (inLao !== null && lao !== inLao) { out += inLao ? `<span class="lao">${buf}</span>` : buf; buf = ''; }
    inLao = lao; buf += ch;
  }
  if (buf) out += inLao ? `<span class="lao">${buf}</span>` : buf;
  return out;
}

export default function GrammarPage() {
  const { t, lang } = useT();

  return (
    <>
      <div className="page-head">
        <h1>{t('grammar_title')}</h1>
        <p className="section-sub">{t('grammar_sub')}</p>
      </div>
      <div className="doc-layout">
        <aside className="doc-aside">
          <div className="toc-sticky">
            <strong>{t('grammar_toc')}</strong>
            <nav className="toc">
              {GRAMMAR.map((g) => (
                <a key={g.id} href={`#g-${g.id}`} className="toc-link">{g.icon} {lang === 'fr' ? g.titleFr : g.title}</a>
              ))}
            </nav>
          </div>
        </aside>
        <div className="doc-content">
          {GRAMMAR.map((g) => (
            <section key={g.id} className="doc-section card" id={`g-${g.id}`}>
              <h2>{g.icon} {lang === 'fr' ? g.titleFr : g.title}</h2>
              {g.blocks.map((b, i) => <GrammarBlockView key={i} b={b} fr={lang === 'fr'} />)}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

function GrammarBlockView({ b, fr }: { b: GrammarBlock; fr: boolean }) {
  switch (b.t) {
    case 'p': return <p dangerouslySetInnerHTML={{ __html: fr ? b.htmlFr : b.html }} />;
    case 'ex': return (
      <div className="ex-row">
        <span className="lao ex-lao">{b.lao}</span>
        <span className="ex-romanization">{b.romanization}</span>
        <span className="ex-en">{fr ? b.enFr : b.en}</span>
      </div>
    );
    case 'table': {
      const head = fr ? b.headFr : b.head;
      const rows = fr ? (b.rowsFr ?? b.rows) : b.rows;
      return (
        <div className="table-wrap">
          <table>
            <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} dangerouslySetInnerHTML={{ __html: wrapLao(c) }} />)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'list': return (
      <ul className="doc-list">
        {(fr ? b.itemsFr : b.items).map((i, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: i }} />)}
      </ul>
    );
    case 'note': return <div className="note-box" dangerouslySetInnerHTML={{ __html: fr ? b.htmlFr : b.html }} />;
    default: return null;
  }
}
