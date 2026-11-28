import type { ReactNode } from 'react';

// Renders schema.org JSON-LD in a <script> tag. Use from server layouts only.
export function JsonLd({ data }: { data: object | object[] }) {
  const payload: ReactNode = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: payload }} />;
}
