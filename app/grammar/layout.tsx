import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Lao grammar bible — script, tones, sentence structure & more',
  description:
    'The complete Lao grammar guide: the Lao script, the 6 tones, sentence structure, verb particles, negation, questions, classifiers, politeness, telling time and more — explained simply with Lao script and romanization.',
  alternates: { canonical: '/grammar' },
};

export default function GrammarLayout({ children }: { children: ReactNode }) {
  return children;
}
