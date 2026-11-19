// Render an i18n/l10n string that contains safe, first-party HTML
// (<b>, <i>, <span class="lao">…). Never pass user input here.
'use client';

export function H({ html, as: Tag = 'span', className }: { html: string; as?: 'span' | 'p' | 'h1' | 'h2'; className?: string }) {
  const props = { className, dangerouslySetInnerHTML: { __html: html } };
  switch (Tag) {
    case 'p': return <p {...props} />;
    case 'h1': return <h1 {...props} />;
    case 'h2': return <h2 {...props} />;
    default: return <span {...props} />;
  }
}
