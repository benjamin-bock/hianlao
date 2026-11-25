// Pure geometry & Duolingo-style directional stroke scoring for TracePad.
// Kept DOM-free so Node tests can verify every stroke model and scoring case.

export const CANVAS = 280;
const PAD = 16;
export const MODEL_SCALE = (CANVAS - PAD * 2) / 100; // 2.48
export const MODEL_OFFSET = PAD;                       // 16

export interface Pt { x: number; y: number }

export const START_R = 40;         // max px from stroke start (covers the ~34px head circle)
export const CORRIDOR_R = 32;      // max px from forward curve point to advance progress
export const OFF_PATH_R = 36;      // max px from any point on curve before counting as spill
export const MAX_ADVANCE_PX = 38;  // max arc-length jump per step (~15 model units)
export const MIN_COV = 0.84;       // ≥84% of curve reached in forward order
export const MAX_OFF_PATH = 0.30;  // ≤30% of user ink outside corridor

export function toCanvasPt(p: Pt): Pt {
  return { x: p.x * MODEL_SCALE + MODEL_OFFSET, y: p.y * MODEL_SCALE + MODEL_OFFSET };
}

/** Sample an SVG path 'd' string (M L Q A) into a dense polyline. */
export function samplePath(d: string): Pt[] {
  const pts: Pt[] = [];
  let cur: Pt = { x: 0, y: 0 };
  const re = /([MLQA])([^MLQA]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const n = m[2].trim().split(/[\s,]+/).map(Number);
    if (m[1] === 'M') {
      cur = { x: n[0], y: n[1] };
      pts.push({ ...cur });
    } else if (m[1] === 'L') {
      const nx = n[0], ny = n[1];
      const dist = Math.hypot(nx - cur.x, ny - cur.y);
      const steps = Math.max(1, Math.ceil(dist / 2));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        pts.push({ x: cur.x + (nx - cur.x) * t, y: cur.y + (ny - cur.y) * t });
      }
      cur = { x: nx, y: ny };
    } else if (m[1] === 'Q') {
      const c = { x: n[0], y: n[1] }, end = { x: n[2], y: n[3] };
      for (let i = 1; i <= 24; i++) {
        const t = i / 24, u = 1 - t;
        pts.push({
          x: u * u * cur.x + 2 * u * t * c.x + t * t * end.x,
          y: u * u * cur.y + 2 * u * t * c.y + t * t * end.y,
        });
      }
      cur = { ...end };
    } else if (m[1] === 'A') {
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
        pts.push({
          x: cx + rxs * Math.cos(t) * cos - rys * Math.sin(t) * sin,
          y: cy + rxs * Math.cos(t) * sin + rys * Math.sin(t) * cos,
        });
      }
      cur = { x: x2, y: y2 };
    }
  }
  return pts;
}

/** Resample a polyline to roughly uniform spacing (stepPx). */
export function resamplePolyline(pts: Pt[], stepPx = 3): Pt[] {
  if (pts.length <= 1) return pts;
  const out: Pt[] = [pts[0]];
  let carry = 0;
  let prev = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const cur = pts[i];
    const segLen = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    if (segLen < 1e-4) continue;
    let d = stepPx - carry;
    while (d <= segLen) {
      const t = d / segLen;
      out.push({ x: prev.x + (cur.x - prev.x) * t, y: prev.y + (cur.y - prev.y) * t });
      d += stepPx;
    }
    carry = segLen - (d - stepPx);
    prev = cur;
  }
  const last = pts[pts.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last.x - tail.x, last.y - tail.y) > 0.5) out.push(last);
  return out;
}

export function polylineMeta(pts: Pt[]): { d: string; len: number; cum: number[] } {
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

/** Advance monotonic progress index along guidePts for a pointer move step. */
export function advanceStrokeProgress(
  pt: Pt,
  prevPt: Pt | null,
  guidePts: Pt[],
  cum: number[],
  curIdx: number,
): number {
  if (!guidePts.length) return 0;
  const steps = prevPt ? Math.max(1, Math.ceil(Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y) / 4)) : 1;
  let idx = Math.max(0, Math.min(curIdx, guidePts.length - 1));
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const px = prevPt ? prevPt.x + (pt.x - prevPt.x) * t : pt.x;
    const py = prevPt ? prevPt.y + (pt.y - prevPt.y) * t : pt.y;
    const maxCum = cum[idx] + MAX_ADVANCE_PX;
    let best = idx;
    let bestD = Infinity;
    for (let j = idx; j < guidePts.length && cum[j] <= maxCum; j++) {
      const d = Math.hypot(px - guidePts[j].x, py - guidePts[j].y);
      if (d < bestD) { bestD = d; best = j; }
    }
    if (bestD <= CORRIDOR_R && best > idx) idx = best;
  }
  return idx;
}

export type StrokeFailReason = 'ok' | 'start' | 'offpath' | 'incomplete';

export interface DirectionalScore {
  ok: boolean;
  reason: StrokeFailReason;
  coverage: number;
  startDist: number;
  offTrackRatio: number;
}

/** Score a traced stroke in canvas coordinates against the ordered guide curve. */
export function scoreDirectionalStroke(
  userPolys: Pt[][],
  guidePts: Pt[],
  cum: number[],
  len: number,
): DirectionalScore {
  const flat: Pt[] = [];
  for (const poly of userPolys) {
    const resampled = resamplePolyline(poly, 4);
    for (const p of resampled) flat.push(p);
  }
  if (!flat.length || !guidePts.length || !len) {
    return { ok: false, reason: 'incomplete', coverage: 0, startDist: Infinity, offTrackRatio: 1 };
  }

  const startDist = Math.hypot(flat[0].x - guidePts[0].x, flat[0].y - guidePts[0].y);
  const startedAtStart = startDist <= START_R;

  let idx = 0;
  let offTrack = 0;
  for (let i = 0; i < flat.length; i++) {
    const p = flat[i];
    idx = advanceStrokeProgress(p, i ? flat[i - 1] : null, guidePts, cum, idx);
    let minD = Infinity;
    for (let j = 0; j < guidePts.length; j++) {
      const d = Math.hypot(p.x - guidePts[j].x, p.y - guidePts[j].y);
      if (d < minD) minD = d;
    }
    if (minD > OFF_PATH_R) offTrack++;
  }

  const coverage = cum[idx] / len;
  const offTrackRatio = offTrack / flat.length;

  let reason: StrokeFailReason = 'ok';
  if (!startedAtStart) reason = 'start';
  else if (offTrackRatio > MAX_OFF_PATH) reason = 'offpath';
  else if (coverage < MIN_COV) reason = 'incomplete';

  return { ok: reason === 'ok', reason, coverage, startDist, offTrackRatio };
}
