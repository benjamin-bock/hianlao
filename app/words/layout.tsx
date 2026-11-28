import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Lao words & phrases — searchable dictionary with audio',
  description:
    'A searchable Lao dictionary of 200+ words and real-life phrases: greetings, food, family, numbers, travel, colors… Every word comes with romanization and native-audio playback.',
  alternates: { canonical: '/words' },
};

export default function WordsLayout({ children }: { children: ReactNode }) {
  return children;
}
