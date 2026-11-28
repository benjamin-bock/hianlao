// Server-side SEO constants and JSON-LD structured data. Pure data — safe to
// import from server components and layouts. Helps search engines and AI
// assistants understand and cite HianLao.

import { FAQ } from '@/data/faq.ts';
import { UNITS } from '@/data/units.ts';

export const SITE = {
  url: 'https://hianlao.vercel.app',
  name: 'HianLao',
  tagline: 'Learn Lao free & open-source',
  description:
    'HianLao (ຮຽນລາວ, "hian lao" — learn Lao) is a free, open-source, Duolingo-style website to learn the Lao language: 39 lessons in 13 units, the Lao alphabet, a grammar bible, 200+ words with audio and Lao culture. Made for the Lao diaspora worldwide.',
  twitter: undefined as string | undefined,
} as const;

export const KEYWORDS = [
  'learn Lao', 'learn Lao free', 'Lao language', 'Lao lessons', 'Lao alphabet',
  'Lao grammar', 'Lao vocabulary', 'Lao phrases', 'Lao course online',
  'Duolingo Lao', 'Duolingo for Lao', 'study Lao', 'Lao for beginners',
  'ຮຽນລາວ', 'apprendre le lao', 'cours de lao', 'langue lao',
  'Lao diaspora', 'HianLao',
];

export const jsonLd = {
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    alternateName: ['ຮຽນລາວ', 'hian lao'],
    url: SITE.url,
    description: SITE.description,
    inLanguage: ['en', 'fr', 'lo'],
  },
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/img/logo.svg`,
    sameAs: ['https://github.com/benjamin-bock/hianlao'],
  },
  app: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE.name,
    url: SITE.url,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    description: SITE.description,
    inLanguage: ['en', 'fr', 'lo'],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
  faq: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
  courseList: {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'HianLao learning path — 13 units of Lao lessons',
    itemListElement: UNITS.map((u, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Course',
        name: `Unit ${u.num}: ${u.title} — Lao lessons`,
        description: u.desc,
        url: `${SITE.url}/learn`,
        provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
        isAccessibleForFree: true,
        inLanguage: 'en',
      },
    })),
  },
};
