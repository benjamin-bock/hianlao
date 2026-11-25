// Unit tests for Lao consonant stroke models and directional tracing scorer.
import { CONSONANT_GROUPS } from '../src/data/alphabet.ts';
import { ALPHA_GLYPHS, ALPHA_STROKES } from '../src/data/alpha-strokes.ts';
import {
  CANVAS,
  polylineMeta,
  resamplePolyline,
  samplePath,
  scoreDirectionalStroke,
  toCanvasPt,
} from '../src/lib/trace-score.ts';

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ✔ ${msg}`);
  else { failures++; console.error(`  ✘ ${msg}`); }
};

const consonants = CONSONANT_GROUPS.flatMap((g) => g.letters.map((l) => l.lao));

console.log('Stroke & glyph model coverage:');
ok(consonants.length === 27, `27 consonants defined (got ${consonants.length})`);
for (const ch of consonants) {
  const strokes = ALPHA_STROKES[ch];
  const glyph = ALPHA_GLYPHS[ch];
  ok(Array.isArray(strokes) && strokes.length >= 1, `${ch}: has stroke model`);
  ok(typeof glyph === 'string' && glyph.startsWith('M '), `${ch}: has vector glyph outline`);

  const pts = samplePath(strokes[0].d);
  const finite = pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100);
  ok(pts.length >= 25 && finite, `${ch}: stroke samples cleanly inside 100×100 (${pts.length} pts)`);
}

console.log('Directional scoring (Duolingo-style circle-first + curve check):');
for (const ch of consonants) {
  const cp = resamplePolyline(samplePath(ALPHA_STROKES[ch][0].d).map(toCanvasPt), 3);
  const { len, cum } = polylineMeta(cp);

  // 1) Exact trace passes
  const exact = scoreDirectionalStroke([cp], cp, cum, len);
  ok(exact.ok && exact.coverage >= 0.99, `${ch}: exact trace passes (cov=${exact.coverage.toFixed(2)})`);

  // 2) Wobbly human finger trace (±7px) passes
  const wobbly = cp.map((p, i) => ({
    x: p.x + Math.sin(i * 0.45) * 6.5,
    y: p.y + Math.cos(i * 0.35) * 6.5,
  }));
  const wobbleRes = scoreDirectionalStroke([wobbly], cp, cum, len);
  ok(wobbleRes.ok, `${ch}: realistic wobbly finger trace passes (cov=${wobbleRes.coverage.toFixed(2)}, off=${wobbleRes.offTrackRatio.toFixed(2)})`);

  // 3) Backwards trace (end -> start) rejected with 'start'
  const reversed = [...cp].reverse();
  const revRes = scoreDirectionalStroke([reversed], cp, cum, len);
  ok(!revRes.ok && revRes.reason === 'start', `${ch}: backwards trace rejected (reason=${revRes.reason})`);

  // 4) Skipping the starting circle (starting 30% in) rejected
  const skipCircle = cp.slice(Math.floor(cp.length * 0.3));
  const skipRes = scoreDirectionalStroke([skipCircle], cp, cum, len);
  ok(!skipRes.ok, `${ch}: skipping starting circle rejected (reason=${skipRes.reason})`);

  // 5) Stopping halfway rejected as incomplete
  const half = cp.slice(0, Math.floor(cp.length * 0.5));
  const halfRes = scoreDirectionalStroke([half], cp, cum, len);
  ok(!halfRes.ok && halfRes.reason === 'incomplete', `${ch}: half-drawn stroke rejected (reason=${halfRes.reason})`);
}

// 6) Wild scribble outside the glyph rejected
{
  const cp = resamplePolyline(samplePath(ALPHA_STROKES['ກ'][0].d).map(toCanvasPt), 3);
  const { len, cum } = polylineMeta(cp);
  const scribble = [
    { x: cp[0].x, y: cp[0].y },
    { x: CANVAS - 10, y: 10 },
    { x: 10, y: CANVAS - 10 },
    { x: CANVAS - 10, y: CANVAS - 10 },
  ];
  const res = scoreDirectionalStroke([scribble], cp, cum, len);
  ok(!res.ok, `wild scribble rejected (reason=${res.reason})`);
}

if (failures) {
  console.error(`\n${failures} CHECK(S) FAILED ✘`);
  process.exit(1);
}
console.log('\nALPHA STROKES TESTS PASSED ✔');
