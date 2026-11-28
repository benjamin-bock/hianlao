import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { JsonLd } from '@/components/JsonLd';
import { jsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Learn Lao — the full lesson path (13 units, 39 lessons)',
  description:
    'The complete HianLao learning path: 13 units and 39 bite-size Lao lessons with XP, hearts and daily streaks — from first words to proverbs and everyday dialogues. Free, no subscription.',
  alternates: { canonical: '/learn' },
};

export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd.courseList} />
      {children}
    </>
  );
}
