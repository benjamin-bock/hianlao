import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteShell } from '@/components/SiteShell';

export const metadata: Metadata = {
  metadataBase: new URL('https://hianlao.vercel.app'),
  verification: {
    google: [
      '_UeWK7NZ4jqLNPqb2PmH-04r3nuoTpkbIl5swUI5ATs',
      'Nah_1Nt9ZzsbM43MEwTzAE8J_RjbzqFOvDbl_ZJCC-w',
    ],
  },
  title: 'HianLao — Learn Lao free & open-source',
  description: 'HianLao (ຮຽນລາວ) is a free, open-source, Duolingo-style website to learn the Lao language: lessons, grammar bible, vocabulary with audio and Lao culture. Made for the Lao diaspora worldwide.',
  icons: { icon: [{ url: '/img/logo.svg', type: 'image/svg+xml' }], apple: '/img/icon-192.png' },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HianLao',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: 'HianLao — Learn Lao free & open-source',
    description: 'Lessons, grammar, words with audio and Lao culture. No subscription — free and open-source for the Lao diaspora.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // safe-area insets for notched phones / future Capacitor app
  themeColor: '#002868',
};

// Apply the saved theme before first paint (same trick as the legacy site).
const themeInit = `(function(){try{document.documentElement.dataset.theme=localStorage.getItem('hianlao-theme')||'light'}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
