import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'The Lao alphabet (ອັກສອນລາວ) — learn every letter',
  description:
    'Learn the Lao script letter by letter: 27 consonants and all vowels in small groups, with shape ↔ sound drills, handwriting practice and spaced repetition. Free and open-source.',
  alternates: { canonical: '/alphabet' },
};

export default function AlphabetLayout({ children }: { children: ReactNode }) {
  return children;
}
