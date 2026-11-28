import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Lao lesson — exercises with audio, hearts and XP',
  description:
    'Practice Lao with interactive exercises: multiple choice, typing, matching, listening with native-audio, word tiles and speaking practice. Free Duolingo-style Lao lessons.',
  alternates: { canonical: '/lesson' },
};

export default function LessonLayout({ children }: { children: ReactNode }) {
  return children;
}
