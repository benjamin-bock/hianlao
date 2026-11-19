'use client';

// TracePad — the Duolingo-style manuscript exercise. The glyph is drawn as a
// pale ghost outline on a canvas and the learner traces over it.
//
// Consonants have stroke models (src/data/alpha-strokes.ts): the exercise
// becomes stroke-by-stroke. Each stroke gets an animated guide overlay with a
// start dot and directional arrowheads; the learner traces only the current
// stroke, which is scored on its own line mask:
//   coverage = share of the guide line's ink the learner actually touched
//   spill    = share of the learner's ink that landed outside the glyph's
//              strokes (any of them, so starting the next stroke early is ok)
// Passing a stroke repaints it as a solid green line (the "written" ink) and
// unlocks the next guide; the last one fires onPass like before. Letters
// without a model keep the original whole-glyph trace.
//
// Model coordinates live on a shared 100×100 grid (y 5 ascender · 30 head ·
// 54 bowl · 78 baseline · 100 descender). To align guide and glyph, the
// model's ink box is fitted (contain) onto the ghost glyph's measured ink box.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { sfx, buzz, pop, shake } from '@/lib/fx';
import type { AlphaLetter } from '@/data/alphabet';
import { ALPHA_STROKES } from '@/data/alpha-strokes';

const CANVAS = 280;                       // logical size (CSS px)
const BRUSH = 13;                         // brush diameter — tracing tolerance
const GHOST = 'rgba(28, 176, 246, .16)';  // pale blue glyph outline
const LAO_FONT = '"Noto Sans Lao", "Lao MN", "Leelawadee UI", "DokChampa", sans-serif';
const COV_MIN = 0.72;    // whole-glyph mode: ≥72% of the glyph's ink touched
const SPILL_MAX = 0.35;  // whole-glyph mode: ≤35% of learner ink off the glyph
const S_COV = 0.64;      // per-stroke mode: ≥64% of the guide line traced
const S_SPILL = 0.34;    // per-stroke mode: ≤34% of learner ink off the glyph

interface Pt { x: number; y: number }
interface Guide { pts: Pt[]; len: number }

// ——— path sampling: SVG 'd' (M L Q A) → polyline ———————————————————————

export function samplePath(d: string): Pt[] {
  const pts: Pt[] = [];
  let cur: Pt = { x: 0, y: 0 };
  const re = /([MLQA])([^MLQA]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const n = m[2].trim().split(/[\s,]+/).map(Number);
    if (m[1] === 'M') { cur = { x: n[0], y: n[1] }; pts.push({ ...cur }); }
    else if (m[1] === 'L') { cur = { x: n[0], y: n[1] }; pts.push({ ...cur }); }
    else if (m[1] === 'Q') {
      const c = { x: n[0], y: n[1] }, end = { x: n[2], y: n[3] };
      for (let i = 1; i <= 24; i++) {
        const t = i / 24, u = 1 - t;
        pts.push({ x: u * u * cur.x + 2 * u * t * c.x + t * t * end.x, y: u * u * cur.y + 2 * u * t * c.y + t * t * end.y });
      }
      cur = { ...end };
    } else if (m[1] === 'A') {
      // W3C endpoint → center conversion, then sample the arc
      const [rx, ry, xrot, laf, sf, x2, y2] = n;
      const x1 = cur.x, y1 = cur.y;
      let rxs = Math.abs(rx), rys = Math.abs(ry);
      if (!rxs || !rys) { cur = { x: x2, y: y2 }; pts.push({ ...cur }); continue; }
      const rad = (xrot * Math.PI) / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
      const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
      const lam = (x1p * x1p) / (rxs * rxs) + (y1p * y1p) / (rys * rys);
      if (lam > 1) { const sq = Math.sqrt(lam); rxs *= sq; rys *= sq; }
      const num = rxs * rxs * rys * rys - rxs * rxs * y1p * y1p - rys * rys * x1p * x1p;
      const den = rxs * rxs * y1p * y1p + rys * rys * x1p * x1p;
      const co = Math.sqrt(Math.max(0, num / (den || 1)));
      let cxp = (co * rxs * y1p) / rys, cyp = (-co * rys * x1p) / rxs;
      if (laf === sf) { cxp = -cxp; cyp = -cyp; }
      const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
      const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
      const ang = (ux: number, uy: number, vx: number, vy: number) => {
        const dot = ux * vx + uy * vy, l = Math.hypot(ux, uy) * Math.hypot(vx, vy);
        let a = Math.acos(Math.max(-1, Math.min(1, dot / (l || 1))));
        if (ux * vy - uy * vx < 0) a = -a;
        return a;
      };
      const t1 = ang(1, 0, (x1p - cxp) / rxs, (y1p - cyp) / rys);
      let dt = ang((x1p - cxp) / rxs, (y1p - cyp) / rys, (-x1p - cxp) / rxs, (-y1p - cyp) / rys);
      if (!sf && dt > 0) dt -= 2 * Math.PI;
      if (sf && dt < 0) dt += 2 * Math.PI;
      for (let i = 1; i <= 48; i++) {
        const t = t1 + (dt * i) / 48;
        const px = cx + rxs * Math.cos(t) * cos - rys * Math.sin(t) * sin;
        const py = cy + rxs * Math.cos(t) * sin + rys * Math.sin(t) * cos;
        pts.push({ x: px, y: py });
      }
      cur = { x: x2, y: y2 };
    }
  }
  return pts;
}

function poly(pts: Pt[]): { d: string; len: number; cum: number[] } {
  let d = '';
  const cum: number[] = [];
  let len = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    cum.push(len);
    d += `${i ? 'L' : 'M'} ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return { d, len, cum };
}

// ——— helpers shared by both modes ———————————————————————————————————————

function strokePolylines(user: Array<Array<Pt>>): Array<Array<Pt>> {
  const out: Array<Array<Pt>> = [];
  for (const s of user) {
    if (s.length === 1) out.push([{ x: s[0].x, y: s[0].y }, { x: s[0].x + 0.01, y: s[0].y }]);
    else out.push(s);
  }
  return out;
}

function rasterize(polys: Array<Array<Pt>>, width: number): Uint8ClampedArray {
  const c = document.createElement('canvas');
  c.width = CANVAS;
  c.height = CANVAS;
  const g = c.getContext('2d')!;
  g.strokeStyle = '#000';
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const p of polys) {
    g.beginPath();
    g.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length; i++) g.lineTo(p[i].x, p[i].y);
    g.stroke();
  }
  return c.getContext('2d')!.getImageData(0, 0, CANVAS, CANVAS).data;
}

// RGBA raster → 1-byte-per-pixel alpha mask (dilate and lookups index pixels)
function alphaMask(rgba: Uint8ClampedArray): Uint8Array {
  const m = new Uint8Array(CANVAS * CANVAS);
  for (let i = 0; i < CANVAS * CANVAS; i++) m[i] = rgba[i * 4 + 3] > 40 ? 1 : 0;
  return m;
}

function dilate(src: Uint8ClampedArray | Uint8Array, r: number): Uint8Array {
  const out = new Uint8Array(src);
  const disk: Array<[number, number]> = [];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) disk.push([dx, dy]);
    }
  }
  for (let y = 0; y < CANVAS; y++) {
    for (let x = 0; x < CANVAS; x++) {
      if (!src[y * CANVAS + x]) continue;
      for (const [dx, dy] of disk) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < CANVAS && ny >= 0 && ny < CANVAS) out[ny * CANVAS + nx] = 1;
      }
    }
  }
  return out;
}

// score learner ink against a guide-line mask, with spill measured outside a
// looser mask covering every stroke of the glyph (early strokes of the next
// line are not punished)
function scoreStroke(userInk: Array<Array<Pt>>, linePts: Pt[], allPts: Array<Array<Pt>>) {
  const line = alphaMask(rasterize(strokePolylines([linePts]), BRUSH * 0.78));
  const allowed = dilate(alphaMask(rasterize(strokePolylines(allPts), BRUSH * 2)), Math.round(BRUSH * 1.15));
  const user = alphaMask(rasterize(strokePolylines(userInk), BRUSH));
  let lineInk = 0, touched = 0, ink = 0, spill = 0;
  for (let y = 0; y < CANVAS; y++) {
    for (let x = 0; x < CANVAS; x++) {
      const i = y * CANVAS + x;
      const u = user[i] === 1;
      if (line[i]) { lineInk++; if (u) touched++; }
      if (u) { ink++; if (!allowed[i]) spill++; }
    }
  }
  const cov = lineInk ? touched / lineInk : 0;
  const sp = ink ? spill / ink : 1;
  return { cov, sp, ok: cov >= S_COV && sp <= S_SPILL };
}

// ——— TracePad ————————————————————————————————————————————————————————

export default function TracePad({ letter, onPass }: { letter: AlphaLetter; onPass: () => void }) {
  const { t } = useT();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokes = useRef<Array<Array<{ x: number; y: number }>>>([]);
  const drawing = useRef(false);
  const [dpr, setDpr] = useState(0);
  const [verdict, setVerdict] = useState<'none' | 'pass' | 'fail'>('none');
  const [step, setStep] = useState(0);       // index of the stroke being traced
  const [fontTick, setFontTick] = useState(0); // re-measure once webfonts land
  const cardRef = useRef<HTMLDivElement | null>(null);

  const model = ALPHA_STROKES[letter.lao];
  const modelPts = useMemo(
    () => (model ? model.map((st) => samplePath(st.d)) : null),
    [model],
  );

  // ghost-glyph ink box (measured) and the model→canvas transform (fit)
  const [fit, setFit] = useState<{ sc: number; ox: number; oy: number } | null>(null);
  useEffect(() => {
    if (!modelPts) { setFit(null); return; }
    const c = document.createElement('canvas');
    c.width = CANVAS;
    c.height = CANVAS;
    const g = c.getContext('2d');
    if (!g) { setFit(null); return; }
    g.fillStyle = '#000';
    g.font = `${CANVAS * 0.55}px ${LAO_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(letter.lao, CANVAS / 2, CANVAS / 2 + CANVAS * 0.02);
    const data = g.getImageData(0, 0, CANVAS, CANVAS).data;
    let x0 = CANVAS, y0 = CANVAS, x1 = 0, y1 = 0, any = false;
    for (let y = 0; y < CANVAS; y++) {
      for (let x = 0; x < CANVAS; x++) {
        if (data[(y * CANVAS + x) * 4 + 3] > 40) {
          any = true;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (!any) { setFit(null); return; }
    let mx0 = 100, my0 = 100, mx1 = 0, my1 = 0;
    for (const mp of modelPts) {
      for (const p of mp) {
        if (p.x < mx0) mx0 = p.x;
        if (p.x > mx1) mx1 = p.x;
        if (p.y < my0) my0 = p.y;
        if (p.y > my1) my1 = p.y;
      }
    }
    const mw = mx1 - mx0 || 1, mh = my1 - my0 || 1;
    const gw = x1 - x0 + 1, gh = y1 - y0 + 1;
    const sc = Math.min(gw / mw, gh / mh);
    setFit({
      sc,
      ox: x0 + gw / 2 - (mx0 + mw / 2) * sc,
      oy: y0 + gh / 2 - (my0 + mh / 2) * sc,
    });
  }, [modelPts, letter.lao, fontTick]);

  const toCanvas = (p: Pt): Pt => (fit ? { x: p.x * fit.sc + fit.ox, y: p.y * fit.sc + fit.oy } : p);

  const guides = useMemo(() => {
    if (!modelPts || !fit) return null;
    return modelPts.map((pts) => {
      const cp = pts.map(toCanvas);
      const p = poly(cp);
      return { pts: cp, d: p.d, len: p.len, cum: p.cum };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelPts, fit]);

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, 2.5));
  }, []);

  useEffect(() => {
    let alive = true;
    const ready = (document as Document & { fonts?: FontFaceSet }).fonts;
    ready?.ready.then(() => { if (alive) setFontTick((n) => n + 1); }).catch(() => {});
    return () => { alive = false; };
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
    setStep(0);
    if (dpr) draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.lao]);

  // redraw whenever progress or verdict changes (draw closes over fresh state)
  useEffect(() => {
    if (!dpr) return;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpr, step, verdict, fontTick]);

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
    if (guides) {
      // strokes already written: solid green
      ctx.strokeStyle = 'rgba(109, 199, 64, 0.9)';
      ctx.lineWidth = BRUSH * 0.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 0; i < step && guides[i]; i++) {
        ctx.beginPath();
        ctx.moveTo(guides[i].pts[0].x, guides[i].pts[0].y);
        for (const p of guides[i].pts.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
    // learner ink
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

  function evaluate() {
    if (!strokes.current.length) return;
    if (guides && step < guides.length) evaluateStroke();
    else evaluateWhole();
  }

  // stroke-by-stroke: score only the current guide line
  function evaluateStroke() {
    if (!guides) return;
    const cur = guides[step];
    const { ok } = scoreStroke(strokes.current, cur.pts, modelPts!.map((mp) => mp.map(toCanvas)));
    if (ok) {
      strokes.current = [];
      const next = step + 1;
      setStep(next);
      sfx('correct');
      buzz([12, 30, 12]);
      pop(cardRef.current);
      if (next >= guides.length) {
        setVerdict('pass');
        window.setTimeout(onPass, 700);
      } else {
        setVerdict('pass');
        window.setTimeout(() => setVerdict('none'), 620);
      }
    } else {
      sfx('wrong');
      buzz(50);
      shake(cardRef.current);
      setVerdict('fail');
      window.setTimeout(() => {
        strokes.current = [];
        setVerdict('none');
      }, 520);
    }
  }

  // whole glyph (no model): the original behaviour
  function evaluateWhole() {
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
    const dilated = dilate(mask, Math.round(BRUSH * 0.9));

    const udata = rasterize(strokes.current, BRUSH);
    let glyphInk = 0, touched = 0, ink = 0, spill = 0;
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
    const cov = glyphInk ? touched / glyphInk : 0;
    const spillPct = ink ? spill / ink : 1;
    const passed = cov >= COV_MIN && spillPct <= SPILL_MAX;
    setVerdict(passed ? 'pass' : 'fail');
    if (passed) {
      sfx('correct');
      buzz([12, 30, 12]);
      pop(cardRef.current);
      window.setTimeout(onPass, 750);
    } else {
      sfx('wrong');
      buzz(50);
      shake(cardRef.current);
    }
  }

  function clear() {
    strokes.current = [];
    setVerdict('none');
    if (guides) setStep(0);
    draw();
  }

  // ——— overlay: animated guide for the current stroke ———————————————————
  const guide = guides && step < guides.length ? guides[step] : null;
  const arrows = useMemo(() => {
    if (!guide) return [];
    const { pts, cum, len } = guide;
    const stops = len > 260 ? [0.28, 0.55, 0.82] : [0.55];
    return stops
      .map((f) => {
        const target = cum.length ? f * len : 0;
        let i = 1;
        while (i < cum.length - 1 && cum[i] < target) i++;
        const p = pts[i];
        const q = pts[Math.min(pts.length - 1, i + 2)];
        const deg = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
        if (!p || !q) return null;
        return { x: p.x, y: p.y, deg };
      })
      .filter((a): a is { x: number; y: number; deg: number } => a !== null);
  }, [guide]);

  const endArrow = useMemo(() => {
    if (!guide || guide.pts.length < 3) return null;
    const p = guide.pts[guide.pts.length - 3];
    const q = guide.pts[guide.pts.length - 1];
    // rings end on the start dot — no arrow there
    if (Math.hypot(q.x - guide.pts[0].x, q.y - guide.pts[0].y) < 16) return null;
    return { x: q.x, y: q.y, deg: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI };
  }, [guide]);

  return (
    <div className="trace-wrap">
      <p className="drill-prompt">{t('alpha_trace').replace('{c}', letter.lao)}</p>
      {guides ? (
        <div className="trace-meta">
          <span className="trace-steps">
            {guides.map((_, i) => (
              <span
                key={i}
                className={`trace-dot${i < step ? ' done' : ''}${i === step ? ' cur' : ''}`}
              >
                {i < step ? '✓' : i + 1}
              </span>
            ))}
          </span>
          <span className="trace-stroke-count">
            {t('alpha_trace_step').replace('{a}', String(Math.min(step + 1, guides.length))).replace('{b}', String(guides.length))}
          </span>
        </div>
      ) : null}
      <div ref={cardRef} className={`card trace-card${verdict === 'pass' ? ' ok' : ''}${verdict === 'fail' ? ' miss' : ''}`}>
        <div className="trace-stage">
          <canvas
            ref={canvasRef}
            style={{ width: CANVAS, height: CANVAS, touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          {guides && verdict === 'none' ? (
            <svg className="trace-guide" viewBox={`0 0 ${CANVAS} ${CANVAS}`} style={{ pointerEvents: 'none' }}>
              {guide ? (
                <g>
                  <path className="trace-guide-line" d={guide.d} key={`${letter.lao}-${step}`} />
                  <circle className="trace-guide-start" cx={guide.pts[0].x} cy={guide.pts[0].y} r="6" />
                  {arrows.map((a, i) => (
                    <polygon
                      key={i}
                      className="trace-guide-arrow"
                      points="0,-9 12,0 0,9"
                      transform={`translate(${a.x} ${a.y}) rotate(${a.deg})`}
                    />
                  ))}
                  {endArrow ? (
                    <polygon
                      className="trace-guide-arrow end"
                      points="0,-9 12,0 0,9"
                      transform={`translate(${endArrow.x} ${endArrow.y}) rotate(${endArrow.deg})`}
                    />
                  ) : null}
                </g>
              ) : null}
            </svg>
          ) : null}
        </div>
        {verdict === 'fail' ? <p className="trace-miss">{t('alpha_trace_try')}</p> : null}
        {verdict === 'pass' ? <p className="trace-hit">{t('alpha_trace_ok')}</p> : null}
      </div>
      <div className="trace-actions">
        <button className="btn btn-ghost" onClick={clear}>{t('alpha_trace_clear')}</button>
      </div>
    </div>
  );
}
