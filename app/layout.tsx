import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Noto_Sans_Lao } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { SiteShell } from '@/components/SiteShell';
import { JsonLd } from '@/components/JsonLd';
import { KEYWORDS, SITE, jsonLd } from '@/lib/seo';

const sans = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap' });
const lao = Noto_Sans_Lao({ subsets: ['lao'], variable: '--font-lao', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  verification: {
    google: 'Nah_1Nt9ZzsbM43MEwTzAE8J_RjbzqFOvDbl_ZJCC-w',
  },
  title: {
    default: 'HianLao — Learn Lao free & open-source',
    template: '%s · HianLao — Learn Lao free',
  },
  description: SITE.description,
  keywords: [...KEYWORDS],
  applicationName: 'HianLao',
  category: 'education',
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
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
    url: SITE.url,
    siteName: 'HianLao',
    locale: 'en',
    alternateLocale: ['fr', 'lo'],
    images: [{ url: '/img/icon-512.png', width: 512, height: 512, alt: 'HianLao — Learn Lao free' }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'HianLao — Learn Lao free & open-source',
    description: 'Duolingo-style Lao lessons, grammar, vocabulary with audio and culture. Free, no subscription, open-source.',
    images: ['/img/icon-512.png'],
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
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${lao.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <JsonLd data={[jsonLd.website, jsonLd.organization, jsonLd.app, jsonLd.faq]} />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
