// Theme: light/dark via [data-theme] on <html>, persisted in localStorage.
'use client';

export type Theme = 'light' | 'dark';

export function getTheme(): Theme {
  try { return (localStorage.getItem('hianlao-theme') as Theme) || 'light'; } catch { return 'light'; }
}

export function applyTheme() {
  // avoid a layout warning during SSR: only touch the DOM on the client
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = getTheme();
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('hianlao-theme', next); } catch { /* ignore */ }
  document.documentElement.dataset.theme = next;
  return next;
}
