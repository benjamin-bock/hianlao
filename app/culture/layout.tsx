import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Lao culture — festivals, food, etiquette & the diaspora',
  description:
    'Discover Lao culture: Pi Mai (Lao New Year), Boun That Luang, the rocket festival, larb and sticky rice, the nop and etiquette, and the story of the Lao diaspora keeping the language alive.',
  alternates: { canonical: '/culture' },
};

export default function CultureLayout({ children }: { children: ReactNode }) {
  return children;
}
