import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Personal page: keep it out of search indexes.
export const metadata: Metadata = {
  title: 'Account',
  description: 'Your HianLao account: free sync of XP, streaks and progress across devices.',
  robots: { index: false, follow: true },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
