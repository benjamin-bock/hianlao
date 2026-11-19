// Shared site shell: sticky header (brand, nav, XP/streak pills, auth chip,
// theme + language switches), footer and the mobile bottom navigation.
// Mirrors legacy main.js renderShell(). Pages change body classes as needed.
'use client';

import Link from 'next/link';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { t, useI18n, setLang, LANGS, type Lang } from '@/lib/i18n';
import { applyTheme, getTheme, toggleTheme } from '@/lib/theme';
import { getState, touchStreak, getUser, initAuth, type ApiUser } from '@/lib/store';
import { VOCAB } from '@/data/vocab.ts';
import { UNITS, LESSON_BY_ID } from '@/data/units.ts';
import { GRAMMAR } from '@/data/grammar.ts';

const NAV = [
  { page: 'home', href: '/', key: 'nav_home', icon: '🏠' },
  { page: 'learn', href: '/learn', key: 'nav_learn', icon: '🧠' },
  { page: 'alphabet', href: '/alphabet', key: 'nav_alphabet', icon: '🔤' },
  { page: 'review', href: '/review', key: 'nav_review', icon: '🔁' },
  { page: 'words', href: '/words', key: 'nav_words', icon: '💬' },
  { page: 'grammar', href: '/grammar', key: 'nav_grammar', icon: '📖' },
  { page: 'culture', href: '/culture', key: 'nav_culture', icon: '🇱🇦' },
];

interface ShellCtx {
  user: ApiUser | null;
  setUser: (u: ApiUser | null) => void;
  /** bump the XP/streak pills (call after addXp etc.) */
  pingStats: () => void;
}
export const ShellContext = createContext<ShellCtx>({ user: null, setUser: () => { /* noop */ }, pingStats: () => { /* noop */ } });
export const useShell = () => useContext(ShellContext);

function activeFromPath(path: string): string {
  const base = path.split('?')[0].split('/')[1] || 'home';
  if (base === 'lesson' || base === 'account') return base === 'lesson' ? 'learn' : 'home';
  return base;
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [themeIcon, setThemeIcon] = useState('🌙');
  const [stats, setStats] = useState({ xp: 0, streak: 0 });
  const [user, setUserState] = useState<ApiUser | null>(null);

  useEffect(() => {
    applyTheme();
    setThemeIcon(getTheme() === 'dark' ? '☀️' : '🌙');
    setStats(getState());
    // PWA: register the service worker (only over http(s), not file://).
    if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* offline dev: fine */ });
    }
    initAuth().then((u) => { setUserState(u); }).catch(() => { /* guest mode */ });
  }, []);

  useEffect(() => {
    // touchStreak once per page visit (mount of the shell).
    setStats(touchStreak());
  }, []);

  const setUser = (u: ApiUser | null) => setUserState(u);
  const pingStats = () => setStats(getState());
  const langNow = useI18n(); // subscribing makes the whole shell follow language switches
  const active = activeFromPath(usePathname() || '/');

  return (
    <ShellContext.Provider value={{ user, setUser, pingStats }}>
      <header id="header">
        <div className="header-inner">
          <Link className="brand" href="/">
            <img src="/img/logo.svg" alt="HianLao" className="brand-logo" />
            <span className="brand-name">HianLao</span>
            <span className="brand-lao lao">ຮຽນລາວ</span>
            <span className="brand-lao-sub">hian lao</span>
          </Link>
          <nav className="nav">
            {NAV.map((n) => (
              <Link key={n.page} href={n.href} className={`nav-link${n.page === active ? ' active' : ''}`}>
                {t(n.key)}
              </Link>
            ))}
          </nav>
          <div className="header-stats">
            <span className="pill xp-pill" title="XP earned">⚡ {stats.xp}</span>
            <span className="pill streak-pill" title="Daily streak">🔥 {stats.streak}</span>
            <Link id="auth-chip" className={`pill auth-chip${user ? ' signed-in' : ''}`} href="/account" title="Account & progress sync">
              👤 <span className="auth-label">{user ? (user.displayName || user.username) : t('sign_in')}</span>
            </Link>
            <button
              id="theme-toggle"
              className="icon-btn"
              title="Toggle dark theme"
              aria-label="Toggle dark theme"
              onClick={() => setThemeIcon(toggleTheme() === 'dark' ? '☀️' : '🌙')}
            >
              {themeIcon}
            </button>
            <div className="lang-switch" role="group" aria-label="Language">
              {(Object.entries(LANGS) as Array<[Lang, string]>).map(([code, label]) => (
                <button key={code} className={`lang-btn${langNow === code ? ' active' : ''}`} data-lang={code} onClick={() => setLang(code)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main id="app">{children}</main>

      <footer id="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/img/logo.svg" alt="" className="brand-logo small" />
            <div>
              <strong>HianLao</strong>
              <p>
                Free &amp; open-source Lao learning for the diaspora, everywhere.{' '}
                <span className="lao">ຮຽນພາສາລາວ ຟຣີ</span>
                <span className="lao-roman"> hian pha-sa Lao</span> — for everyone.
              </p>
            </div>
          </div>
          <div className="footer-links">
            {NAV.map((n) => <Link key={n.page} href={n.href}>{t(n.key)}</Link>)}
            <a href="https://github.com/benjamin-bock/hianlao" target="_blank" rel="noopener">GitHub ↗</a>
          </div>
          <p className="footer-note">
            MIT licensed · {VOCAB.length}+ words · {Object.keys(LESSON_BY_ID).length} lessons · {GRAMMAR.length} grammar guides · made with ❤️ for{' '}
            <span className="lao">ຄົນລາວ</span> <span className="lao-roman">khon Lao</span> worldwide
          </p>
        </div>
      </footer>

      {/* Mobile bottom navigation (shown by CSS below 980px, hidden during lessons). */}
      <nav className="bottom-nav" aria-label="Main menu">
        {NAV.map((n) => (
          <Link
            key={n.page}
            href={n.href}
            className={`bn-item${n.page === active ? ' active' : ''}`}
            aria-current={n.page === active ? 'page' : undefined}
          >
            <span className="bn-icon" aria-hidden="true">{n.icon}</span>
            <span className="bn-label">{t(n.key)}</span>
          </Link>
        ))}
      </nav>
    </ShellContext.Provider>
  );
}
