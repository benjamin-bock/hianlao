// FxLayer — global interaction juice, mounted once in SiteShell.
// Every press on an interactive element gets the same Duolingo-style feel:
// a soft WebAudio tick, a native-style haptic on touch devices (navigator
// .vibrate on web, Capacitor Haptics in the future mobile app) and a ripple
// emanating from the pointer. Components that play their own richer sound
// mark themselves with data-sfx-off so nothing double-fires.
'use client';

import { useEffect } from 'react';
import { sfx, buzz, ripple } from '@/lib/fx';

// Elements that get a ripple (need position:relative + overflow:hidden in CSS).
const RIPPLEABLE =
  'button:not([disabled]), .option-card, .tile, .chip, .bn-item, .nav-link, .lang-btn, .lesson-node, .unit-chip, .group-card, .nudge-card, a.btn, .play-btn';
// Everything that gets a tick (links included — page taps feel alive too).
const INTERACTIVE =
  'button:not([disabled]), a, .option-card, .tile, .chip, .bn-item, .lesson-node, .unit-chip, .group-card, .nudge-card, .lang-btn, [role="button"]';

export function FxLayer() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.closest !== 'function') return;
      if (target.closest('[data-sfx-off]')) return;
      const el = target.closest(INTERACTIVE) as HTMLElement | null;
      if (!el) return;
      // typing fields stay silent — the keyboard has its own feedback
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      sfx('tick');
      if (e.pointerType === 'touch') buzz(8);
      if (el.matches(RIPPLEABLE)) ripple(el, e.clientX, e.clientY);
    };
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  // Desktop keyboard comfort: keys 1-9 tap the nth option/tile of the current
  // drill (shown as .kbd badges), Enter presses CONTINUE / the primary action.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Enter') {
        const el = document.querySelector(
          '.lesson-actionbar .btn-continue, .summary-actions .btn-primary, .fx-stage .btn-continue',
        ) as HTMLElement | null;
        if (el) el.click();
        return;
      }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        const tiles = [...document.querySelectorAll('.fx-stage .tile-bank .tile:not(.chosen)')] as HTMLElement[];
        const opts = [...document.querySelectorAll('.fx-stage .option-card:not([disabled]):not(.matched)')] as HTMLElement[];
        const list = tiles.length ? tiles : opts;
        if (list[n - 1]) list[n - 1].click();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
  return null;
}
