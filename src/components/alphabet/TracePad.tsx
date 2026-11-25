'use client';

// TracePad — Duolingo-style Lao handwriting pad.
//
// Consonants have exact Noto Sans Lao Looped vector silhouettes (ALPHA_GLYPHS)
// and stroke-order centerlines (ALPHA_STROKES) in the same 100×100 grid, so
// the guide fits the ghost glyph identically across every device and browser.
// Each consonant starts on its head circle (ຫົວ) and flows in a continuous
// curve; the pad enforces starting at the circle and following the path in
// order, while giving generous finger tolerance.
//
// Vowel syllables (no stroke model) use whole-glyph multi-stroke tracing so
// learners can lift their finger between the carrier and vowel signs.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import { sfx, buzz, pop, shake } from '@/lib/fx';
import type { AlphaLetter } from '@/data/alphabet';
import { ALPHA_GLYPHS, ALPHA_STROKES } from '@/data/alpha-strokes';
import {
  CANVAS,
  GUIDE_MIN_COV,
  MODEL_OFFSET,
  MODEL_SCALE,
  SNAP_FACTOR,
  START_R,
  advanceStrokeProgress,
  polylineMeta,
  resamplePolyline,
  samplePath,
  scoreDirectionalStroke,
  snapPoint,
  toCanvasPt,
  type AssistMode,
  type Pt,
  type StrokeFailReason,
} from '@/lib/trace-score';

export { samplePath };

const BRUSH = 14;
const GHOST = 'rgba(28, 176, 246, .20)';
const LAO_FONT = '"Noto Sans Lao Looped", "Noto Sans Lao", "Lao MN", "Leelawadee UI", "DokChampa", sans-serif';
const COV_MIN = 0.68;    // whole-glyph mode: ≥68% of syllable ink covered
const SPILL_MAX = 0.36;  // whole-glyph mode: ≤36% of ink off-glyph

// Notebook line positions in 100×100 model space (cap-line & baseline)
const GUIDE_LINES_Y = [25, 75];

function strokePolylines(user: Pt[][]): Pt[][] {
  return user.map((s) => (s.length === 1 ? [s[0], { x: s[0].x + 0.01, y: s[0].y }] : s));
}

function rasterize(polys: Pt[][], width: number): Uint8ClampedArray {
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
  return g.getImageData(0, 0, CANVAS, CANVAS).data;
}

function dilate(src: Uint8Array, r: number): Uint8Array {
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

// Which guide-overlay bits each assist level shows on screen.
const OVERLAY: Record<AssistMode, { line: boolean; arrows: boolean; tracer: boolean; rings: boolean }> = {
  guided:   { line: true, arrows: true, tracer: true, rings: true },
  snapped:  { line: true, arrows: true, tracer: true, rings: true },
  assisted: { line: true, arrows: true, tracer: false, rings: true },
  faint:    { line: true, arrows: false, tracer: false, rings: false },
  bare:     { line: false, arrows: false, tracer: false, rings: false },
};

export default function TracePad({ letter, assist = 'snapped', onPass }: { letter: AlphaLetter; assist?: AssistMode; onPass: () => void }) {
  const { t } = useT();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const strokes = useRef<Pt[][]>([]);
  const drawing = useRef(false);
  const liveProgress = useRef(0);
  const startedOk = useRef(false);
  const timerRef = useRef<number | null>(null);

  const [dpr, setDpr] = useState(0);
  const [verdict, setVerdict] = useState<'none' | 'pass' | 'fail'>('none');
  const [failReason, setFailReason] = useState<StrokeFailReason>('offpath');
  const [step, setStep] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [fontTick, setFontTick] = useState(0);

  const model = ALPHA_STROKES[letter.lao];
  const glyphOutline = ALPHA_GLYPHS[letter.lao];
  const overlay = OVERLAY[assist];
  const snapFactor = assist === 'snapped' || assist === 'assisted' ? SNAP_FACTOR[assist] : 0;

  function guidedCoverage(): number {
    const cur = guides && step < guides.length ? guides[step] : null;
    if (!cur || !cur.len) return 0;
    return cur.cum[liveProgress.current] / cur.len;
  }

  const guides = useMemo(() => {
    if (!model) return null;
    return model.map((st) => {
      const cp = resamplePolyline(samplePath(st.d).map(toCanvasPt), 3);
      const p = polylineMeta(cp);
      return { pts: cp, d: p.d, len: p.len, cum: p.cum };
    });
  }, [model]);

  /** guided mode: the ink is the model path itself, filled up to liveProgress. */
  const guided = !!guides && assist === 'guided';

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, 2.5));
    let alive = true;
    const ready = (document as Document & { fonts?: FontFaceSet }).fonts;
    ready?.ready.then(() => { if (alive) setFontTick((n) => n + 1); }).catch(() => {});
    return () => { alive = false; clearTimer(); };
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
    clearTimer();
    strokes.current = [];
    liveProgress.current = 0;
    startedOk.current = false;
    setVerdict('none');
    setFailReason('offpath');
    setStep(0);
    setHasInk(false);
    setIsDrawing(false);
    if (dpr) draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.lao]);

  useEffect(() => {
    if (!dpr) return;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpr, step, verdict, fontTick, assist]);

  function pos(e: React.PointerEvent): Pt {
    const el = canvasRef.current!;
    const r = el.getBoundingClientRect();
    const scale = CANVAS / r.width;
    return {
      x: Math.max(0, Math.min(CANVAS, (e.clientX - r.left) * scale)),
      y: Math.max(0, Math.min(CANVAS, (e.clientY - r.top) * scale)),
    };
  }

  function drawGhost(ctx: CanvasRenderingContext2D) {
    // subtle notebook lines (cap-line & baseline)
    ctx.save();
    ctx.strokeStyle = 'rgba(150, 145, 132, 0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    for (const gy of GUIDE_LINES_Y) {
      const y = gy * MODEL_SCALE + MODEL_OFFSET;
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(CANVAS - 14, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = GHOST;
    if (glyphOutline && typeof Path2D !== 'undefined') {
      ctx.save();
      ctx.translate(MODEL_OFFSET, MODEL_OFFSET);
      ctx.scale(MODEL_SCALE, MODEL_SCALE);
      ctx.fill(new Path2D(glyphOutline), 'evenodd');
      ctx.restore();
    } else {
      ctx.font = `${CANVAS * 0.50}px ${LAO_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter.lao, CANVAS / 2, CANVAS / 2 + CANVAS * 0.02);
    }
  }

  function draw() {
    const el = canvasRef.current;
    if (!el || !dpr) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS, CANVAS);

    drawGhost(ctx);

    if (guides) {
      // Completed strokes: clean Duolingo green
      ctx.strokeStyle = 'rgba(88, 204, 2, 0.92)';
      ctx.lineWidth = BRUSH * 0.65;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 0; i < step && guides[i]; i++) {
        const pts = guides[i].pts;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.stroke();
      }

      // Live traced progress highlight along the current stroke
      const cur = guides[step];
      if (!guided && cur && liveProgress.current > 0 && startedOk.current && verdict !== 'fail') {
        ctx.strokeStyle = verdict === 'pass' ? 'rgba(88, 204, 2, 0.85)' : 'rgba(28, 176, 246, 0.35)';
        ctx.lineWidth = BRUSH * 0.85;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cur.pts[0].x, cur.pts[0].y);
        for (let k = 1; k <= liveProgress.current && k < cur.pts.length; k++) {
          ctx.lineTo(cur.pts[k].x, cur.pts[k].y);
        }
        ctx.stroke();
      }
    }

    // Guided mode: the model path itself is the ink — it hugs the letter
    // shape perfectly and fills as the learner drags along it.
    if (guided && guides) {
      const cur = guides[step];
      if (cur && liveProgress.current > 0 && startedOk.current) {
        const done = verdict === 'pass' || guidedCoverage() >= GUIDE_MIN_COV;
        ctx.strokeStyle = done ? '#58cc02' : '#1cb0f6';
        ctx.lineWidth = BRUSH * 0.62;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cur.pts[0].x, cur.pts[0].y);
        for (let k = 1; k <= liveProgress.current && k < cur.pts.length; k++) {
          ctx.lineTo(cur.pts[k].x, cur.pts[k].y);
        }
        ctx.stroke();
      }
      return;
    }

    // Learner's freehand ink
    const inkColor = verdict === 'pass' ? '#58cc02' : verdict === 'fail' ? '#ff4b4b' : '#1cb0f6';
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineWidth = BRUSH * 0.62;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokes.current) {
      if (s.length === 1) {
        ctx.beginPath();
        ctx.arc(s[0].x, s[0].y, BRUSH * 0.31, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
      ctx.stroke();
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    clearTimer();
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* synthetic/odd pointer ids */ }

    const p = pos(e);
    if (guides) {
      if (verdict === 'fail' || strokes.current.length > 0) {
        strokes.current = [];
      }
      const cur = guides[step];
      if (cur) {
        startedOk.current = Math.hypot(p.x - cur.pts[0].x, p.y - cur.pts[0].y) <= START_R;
        liveProgress.current = startedOk.current
          ? advanceStrokeProgress(p, null, cur.pts, cur.cum, 0)
          : 0;
      }
    }

    drawing.current = true;
    setIsDrawing(true);
    strokes.current.push([p]);
    setHasInk(true);
    setVerdict('none');
    draw();
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const s = strokes.current[strokes.current.length - 1];
    const raw = pos(e);
    const last = s[s.length - 1];
    if (Math.hypot(raw.x - last.x, raw.y - last.y) < 3) return;

    if (guides && step < guides.length && startedOk.current) {
      const cur = guides[step];
      if (guided) {
        // the pad leads: progress only advances while the pointer stays in the
        // corridor, so the learner physically walks along the perfect trace
        liveProgress.current = advanceStrokeProgress(raw, last, cur.pts, cur.cum, liveProgress.current);
      } else {
        const p = snapFactor
          ? snapPoint(raw, cur.pts, liveProgress.current, snapFactor)
          : raw;
        s.push(p);
        liveProgress.current = advanceStrokeProgress(p, last, cur.pts, cur.cum, liveProgress.current);
      }
    } else {
      s.push(raw);
    }
    draw();
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    drawing.current = false;
    setIsDrawing(false);
    evaluate();
  }

  function evaluate() {
    if (!strokes.current.length && !guided) return;
    if (guides && step < guides.length) {
      if (guided) evaluateGuided();
      else evaluateStroke();
    } else evaluateWhole(false);
  }

  // Guided mode: the shape is the model path — pass when the learner's drag
  // carried the trace (nearly) to the end; too short = keep following.
  function evaluateGuided() {
    if (!guides) return;
    const cur = guides[step];
    const cov = guidedCoverage();
    if (startedOk.current && cov >= GUIDE_MIN_COV && cur) {
      liveProgress.current = cur.pts.length - 1;
      const next = step + 1;
      setVerdict('pass');
      sfx('correct');
      buzz([12, 30, 12]);
      pop(cardRef.current);
      draw();
      timerRef.current = window.setTimeout(() => {
        strokes.current = [];
        setStep(next);
        onPass();
      }, 680);
    } else {
      sfx('wrong');
      buzz(50);
      shake(cardRef.current);
      setFailReason(startedOk.current ? 'incomplete' : 'start');
      setVerdict('fail');
      draw();
      timerRef.current = window.setTimeout(() => {
        strokes.current = [];
        liveProgress.current = 0;
        startedOk.current = false;
        setHasInk(false);
        setVerdict('none');
      }, 950);
    }
  }

  function evaluateStroke() {
    if (!guides) return;
    const cur = guides[step];
    const res = scoreDirectionalStroke(strokes.current, cur.pts, cur.cum, cur.len);
    if (res.ok) {
      const next = step + 1;
      setVerdict('pass');
      sfx('correct');
      buzz([12, 30, 12]);
      pop(cardRef.current);
      if (next >= guides.length) {
        liveProgress.current = cur.pts.length - 1;
        draw();
        timerRef.current = window.setTimeout(() => {
          strokes.current = [];
          setStep(next);
          onPass();
        }, 680);
      } else {
        timerRef.current = window.setTimeout(() => {
          strokes.current = [];
          liveProgress.current = 0;
          startedOk.current = false;
          setHasInk(false);
          setStep(next);
          setVerdict('none');
        }, 550);
      }
    } else {
      sfx('wrong');
      buzz(50);
      shake(cardRef.current);
      setFailReason(res.reason);
      setVerdict('fail');
      draw();
      timerRef.current = window.setTimeout(() => {
        strokes.current = [];
        liveProgress.current = 0;
        startedOk.current = false;
        setHasInk(false);
        setVerdict('none');
      }, 950);
    }
  }

  function measureWhole() {
    const off = document.createElement('canvas');
    off.width = CANVAS;
    off.height = CANVAS;
    const octx = off.getContext('2d')!;
    octx.fillStyle = '#000';
    octx.font = `${CANVAS * 0.50}px ${LAO_FONT}`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(letter.lao, CANVAS / 2, CANVAS / 2 + CANVAS * 0.02);
    const gdata = octx.getImageData(0, 0, CANVAS, CANVAS).data;
    const mask = new Uint8Array(CANVAS * CANVAS);
    for (let i = 0; i < CANVAS * CANVAS; i++) {
      if (gdata[i * 4 + 3] > 40) mask[i] = 1;
    }
    const dilated = dilate(mask, Math.round(BRUSH * 0.95));

    const udata = rasterize(strokePolylines(strokes.current), BRUSH);
    let glyphInk = 0, touched = 0, ink = 0, spill = 0;
    for (let i = 0; i < CANVAS * CANVAS; i++) {
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
    return {
      cov: glyphInk ? touched / glyphInk : 0,
      spillPct: ink ? spill / ink : 1,
    };
  }

  // Whole-glyph mode (multi-part vowel syllables): allow multiple strokes before passing
  function evaluateWhole(explicitCheck: boolean) {
    const { cov, spillPct } = measureWhole();
    const passed = cov >= COV_MIN && spillPct <= SPILL_MAX;
    if (passed) {
      setVerdict('pass');
      sfx('correct');
      buzz([12, 30, 12]);
      pop(cardRef.current);
      draw();
      timerRef.current = window.setTimeout(onPass, 720);
      return;
    }
    if (explicitCheck || spillPct > SPILL_MAX) {
      sfx('wrong');
      buzz(50);
      shake(cardRef.current);
      setFailReason('offpath');
      setVerdict('fail');
      draw();
      timerRef.current = window.setTimeout(() => {
        strokes.current = [];
        setHasInk(false);
        setVerdict('none');
      }, 850);
    }
  }

  function clear() {
    clearTimer();
    strokes.current = [];
    liveProgress.current = 0;
    startedOk.current = false;
    setHasInk(false);
    setVerdict('none');
    if (guides) setStep(0);
    setReplayKey((k) => k + 1);
    draw();
  }

  function replay() {
    setReplayKey((k) => k + 1);
  }

  // ——— overlay: animated guide for the current stroke ———————————————————
  const guide = guides && step < guides.length ? guides[step] : null;
  const arrows = useMemo(() => {
    if (!guide) return [];
    const { pts, cum, len } = guide;
    const stops = len > 420 ? [0.11, 0.38, 0.65, 0.90] : [0.12, 0.48, 0.86];
    return stops
      .map((f) => {
        const target = cum.length ? f * len : 0;
        let i = 1;
        while (i < cum.length - 1 && cum[i] < target) i++;
        const p = pts[i];
        const q = pts[Math.min(pts.length - 1, i + 2)];
        if (!p || !q || (p.x === q.x && p.y === q.y)) return null;
        const deg = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
        return { x: p.x, y: p.y, deg };
      })
      .filter((a): a is { x: number; y: number; deg: number } => a !== null);
  }, [guide]);

  const failMessage =
    failReason === 'start'
      ? t('alpha_trace_start')
      : failReason === 'incomplete'
        ? t('alpha_trace_finish')
        : t('alpha_trace_try');

  return (
    <div className="trace-wrap">
      <p className="drill-prompt">{t('alpha_trace').replace('{c}', letter.lao)}</p>
      {guides ? (
        <div className="trace-meta">
          {guides.length > 1 ? (
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
          ) : null}
          <span className="trace-stroke-count">
            {guides.length > 1
              ? t('alpha_trace_step').replace('{a}', String(Math.min(step + 1, guides.length))).replace('{b}', String(guides.length))
              : assist === 'bare'
                ? t('alpha_trace_free')
                : assist === 'faint'
                  ? t('alpha_trace_free_hint')
                  : t('alpha_trace_arrows')}
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
          {guides && guide && overlay.line && verdict !== 'pass' ? (
            <svg className={`trace-guide${assist === 'faint' ? ' trace-guide-faint' : ''}`} viewBox={`0 0 ${CANVAS} ${CANVAS}`} style={{ pointerEvents: 'none' }}>
              <g key={`${letter.lao}-${step}-${replayKey}`}>
                <path className="trace-guide-line" d={guide.d} />
                {overlay.arrows ? arrows.map((a, i) => (
                  <path
                    key={i}
                    className="trace-guide-arrow"
                    d="M -4,-5 L 4,0 L -4,5"
                    transform={`translate(${a.x} ${a.y}) rotate(${a.deg})`}
                  />
                )) : null}
                {overlay.rings ? (
                  <circle className="trace-guide-start-ring" cx={guide.pts[0].x} cy={guide.pts[0].y} r="10" />
                ) : null}
                <circle className="trace-guide-start" cx={guide.pts[0].x} cy={guide.pts[0].y} r="5.5" />
                {overlay.tracer && !isDrawing && verdict === 'none' ? (
                  <circle className="trace-guide-tracer" r="5">
                    <animateMotion path={guide.d} dur="2.6s" repeatCount="indefinite" />
                  </circle>
                ) : null}
              </g>
            </svg>
          ) : null}
        </div>
        {verdict === 'fail' ? <p className="trace-miss">{failMessage}</p> : null}
        {verdict === 'pass' ? <p className="trace-hit">{t('alpha_trace_ok')}</p> : null}
      </div>
      <div className="trace-actions">
        {guides ? (
          <button type="button" className="btn btn-ghost" onClick={replay}>↻ {t('alpha_trace_replay')}</button>
        ) : hasInk && verdict === 'none' ? (
          <button type="button" className="btn btn-primary" onClick={() => evaluateWhole(true)}>{t('alpha_trace_check')}</button>
        ) : null}
        <button type="button" className="btn btn-ghost" onClick={clear}>{t('alpha_trace_clear')}</button>
      </div>
    </div>
  );
}
