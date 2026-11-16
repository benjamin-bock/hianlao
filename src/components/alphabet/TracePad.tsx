'use client';

// TracePad — the Duolingo-style manuscript exercise: the glyph is drawn as a
// pale ghost outline on a canvas and the learner traces over it with finger
// or mouse. The strokes are rasterized on an offscreen brush canvas and
// scored against the glyph's ink mask:
//   coverage = share of the glyph's ink the learner actually touched
//   spill    = share of the learner's ink that landed away from the glyph
// Passing needs high coverage and low spill, so scribbling over the whole
// pad fails as cleanly as tracing nothing. No stroke-order data exists for
// Lao, so the exercise is "trace the shape" rather than stroke-by-stroke.

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import type { AlphaLetter } from '@/data/alphabet';

const CANVAS = 280;                       // logical size (CSS px)
const BRUSH = 13;                         // brush diameter — tracing tolerance
const GHOST = 'rgba(28, 176, 246, .16)';  // pale blue glyph outline
const LAO_FONT = '"Noto Sans Lao", "Lao MN", "Leelawadee UI", "DokChampa", sans-serif';
const COV_MIN = 0.72;    // ≥72% of the glyph's ink touched
const SPILL_MAX = 0.35;  // ≤35% of the learner's ink away from the glyph

export default function TracePad({ letter, onPass }: { letter: AlphaLetter; onPass: () => void }) {
  const { t } = useT();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokes = useRef<Array<Array<{ x: number; y: number }>>>([]);
  const drawing = useRef(false);
  const [dpr, setDpr] = useState(0);
  const [verdict, setVerdict] = useState<'none' | 'pass' | 'fail'>('none');

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, 2.5));
  }, []);

  useEffect(() => {
    if (!dpr) return;
    const el = canvasRef.current;
    if (!el) return;
    el.width = CANVAS * dpr;
    el.height = CANVAS * dpr;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpr]);

  useEffect(() => {
    strokes.current = [];
    setVerdict('none');
    if (dpr) draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.lao]);

  function pos(e: React.PointerEvent): { x: number; y: number } {
    const el = canvasRef.current!;
    const r = el.getBoundingClientRect();
    const scale = CANVAS / r.width;
    return {
      x: Math.max(0, Math.min(CANVAS, (e.clientX - r.left) * scale)),
      y: Math.max(0, Math.min(CANVAS, (e.clientY - r.top) * scale)),
    };
  }

  function draw() {
    const el = canvasRef.current;
    if (!el || !dpr) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS, CANVAS);
    // ghost glyph
    ctx.fillStyle = GHOST;
    ctx.font = `${CANVAS * 0.55}px ${LAO_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter.lao, CANVAS / 2, CANVAS / 2 + CANVAS * 0.02);
    // learner strokes
    ctx.strokeStyle = '#1cb0f6';
    ctx.fillStyle = '#1cb0f6';
    ctx.lineWidth = BRUSH * 0.55;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokes.current) {
      if (s.length === 1) {
        ctx.beginPath();
        ctx.arc(s[0].x, s[0].y, BRUSH * 0.28, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (const p of s.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* synthetic/odd pointer ids */ }
    drawing.current = true;
    strokes.current.push([pos(e)]);
    setVerdict('none');
    draw();
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const s = strokes.current[strokes.current.length - 1];
    const p = pos(e);
    const last = s[s.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 3) return; // thin the stream
    s.push(p);
    draw();
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    drawing.current = false;
    evaluate();
  }

  function rasterizeStrokes(): Uint8ClampedArray {
    const user = document.createElement('canvas');
    user.width = CANVAS;
    user.height = CANVAS;
    const uctx = user.getContext('2d')!;
    uctx.strokeStyle = '#000';
    uctx.fillStyle = '#000';
    uctx.lineWidth = BRUSH;
    uctx.lineCap = 'round';
    uctx.lineJoin = 'round';
    for (const s of strokes.current) {
      if (s.length === 1) {
        uctx.beginPath();
        uctx.arc(s[0].x, s[0].y, BRUSH / 2, 0, Math.PI * 2);
        uctx.fill();
        continue;
      }
      uctx.beginPath();
      uctx.moveTo(s[0].x, s[0].y);
      for (const p of s.slice(1)) uctx.lineTo(p.x, p.y);
      uctx.stroke();
    }
    return uctx.getImageData(0, 0, CANVAS, CANVAS).data;
  }

  function evaluate() {
    if (!strokes.current.length) return;
    // glyph ink mask + dilated tolerance mask, from the same rendering the
    // learner sees (same font, same centering)
    const off = document.createElement('canvas');
    off.width = CANVAS;
    off.height = CANVAS;
    const octx = off.getContext('2d')!;
    octx.fillStyle = '#000';
    octx.font = `${CANVAS * 0.55}px ${LAO_FONT}`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(letter.lao, CANVAS / 2, CANVAS / 2 + CANVAS * 0.02);
    const gdata = octx.getImageData(0, 0, CANVAS, CANVAS).data;
    const mask = new Uint8Array(CANVAS * CANVAS);
    for (let i = 0; i < CANVAS * CANVAS; i++) {
      if (gdata[i * 4 + 3] > 40) mask[i] = 1;
    }
    const dilated = new Uint8Array(mask);
    const r = Math.round(BRUSH * 0.9);
    const disk: Array<[number, number]> = [];
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) disk.push([dx, dy]);
      }
    }
    for (let y = 0; y < CANVAS; y++) {
      for (let x = 0; x < CANVAS; x++) {
        if (!mask[y * CANVAS + x]) continue;
        for (const [dx, dy] of disk) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < CANVAS && ny >= 0 && ny < CANVAS) dilated[ny * CANVAS + nx] = 1;
        }
      }
    }

    const udata = rasterizeStrokes();
    let glyphInk = 0;  // glyph pixels…
    let touched = 0;   // …of which the learner touched…
    let ink = 0;       // learner ink total…
    let spill = 0;     // …of which away from the glyph
    for (let y = 0; y < CANVAS; y++) {
      for (let x = 0; x < CANVAS; x++) {
        const i = y * CANVAS + x;
        const u = udata[i * 4 + 3] > 40;
        if (mask[i]) glyphInk++;
        if (u) {
          ink++;
          if (dilated[i]) {
            if (mask[i]) touched++;
          } else {
            spill++;
          }
        }
      }
    }
    const cov = glyphInk ? touched / glyphInk : 0;  // completeness
    const spillPct = ink ? spill / ink : 1;         // precision
    const passed = cov >= COV_MIN && spillPct <= SPILL_MAX;
    setVerdict(passed ? 'pass' : 'fail');
    if (passed) window.setTimeout(onPass, 750);
  }

  function clear() {
    strokes.current = [];
    setVerdict('none');
    draw();
  }

  return (
    <div className="trace-wrap">
      <p className="drill-prompt">{t('alpha_trace').replace('{c}', letter.lao)}</p>
      <div className={`card trace-card${verdict === 'pass' ? ' ok' : ''}${verdict === 'fail' ? ' miss' : ''}`}>
        <canvas
          ref={canvasRef}
          style={{ width: CANVAS, height: CANVAS, touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {verdict === 'fail' ? <p className="trace-miss">{t('alpha_trace_try')}</p> : null}
        {verdict === 'pass' ? <p className="trace-hit">{t('alpha_trace_ok')}</p> : null}
      </div>
      <div className="trace-actions">
        <button className="btn btn-ghost" onClick={clear}>{t('alpha_trace_clear')}</button>
      </div>
    </div>
  );
}
