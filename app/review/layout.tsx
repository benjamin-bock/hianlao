import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Review Lao — spaced repetition & word drills',
  description:
    'Review your Lao vocabulary and lessons with spaced repetition: due lessons, tricky-word drills and mixed listen/read exercises. Free, works offline.',
  alternates: { canonical: '/review' },
};

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return children;
}
