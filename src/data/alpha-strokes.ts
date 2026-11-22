// Stroke-order models for the alphabet manuscript exercise.
//
// Each consonant glyph is decomposed into the strokes a writer draws, in
// order — the way Lao penmanship books teach it: bodies and loops first,
// ascenders and attached heads after, top to bottom, left to right.
// Each stroke is an SVG path in a shared 100×100 grid tied to the Lao line
// system (≈ y 5 ascender · y 30 head · y 54 bowl middle · y 78 baseline ·
// y 100 descender), so relative proportions (ascenders taller than bowls,
// tails longer) match between letters.
//
// Used by TracePad to guide stroke by stroke with directional arrows.
// Glyphs without an entry keep the whole-glyph trace (vowel syllables are
// composites built from these parts and are deliberately not modelled).

export interface AlphaStroke {
  /** compact 'd' attribute — Path2D() consumes it directly */
  d: string;
}

/** full circle as a single stroke, starting at (cx, cy - r), drawn counter-clockwise */
export function ring(cx: number, cy: number, r: number): string {
  return `M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} A ${r} ${r} 0 1 0 ${cx} ${cy - r}`;
}

const s = (d: string): AlphaStroke => ({ d });

export const ALPHA_STROKES: Record<string, AlphaStroke[]> = {
  // ກ — ring body, then the right stem dropping below the line
  'ກ': [
    s(ring(46, 54, 24)),
    s('M 70 34 L 70 96'),
  ],
  // ຂ — small loop low-left, then the rising body ending in the right hook
  'ຂ': [
    s(ring(34, 58, 15)),
    s('M 48 52 Q 58 46 64 36 Q 70 24 80 20 Q 90 17 89 28 Q 88 36 82 42'),
  ],
  // ຄ — two legs joined by a top shoulder: left stem, then shoulder + right leg
  'ຄ': [
    s('M 26 34 L 26 96'),
    s('M 26 50 Q 30 32 46 32 Q 62 32 66 46 L 66 96'),
  ],
  // ງ — one continuous stroke: head hook over the top, down the right side, curling left along the foot
  'ງ': [
    s('M 34 20 Q 40 11 50 12 Q 60 13 61 24 L 60 80 Q 60 92 46 96 Q 30 99 24 91'),
  ],
  // ຈ — loop left, then the roof arc ending in the inner hook
  'ຈ': [
    s(ring(34, 58, 19)),
    s('M 43 45 Q 53 32 67 32 Q 81 32 81 45 Q 81 56 71 60'),
  ],
  // ສ — loop body + roof, tighter than ຈ
  'ສ': [
    s(ring(35, 58, 18)),
    s('M 44 45 Q 55 33 68 35 L 81 39 Q 88 42 87 49 Q 86 56 77 58'),
  ],
  // ຊ — small head ring top-left, tall body with the inner curl
  'ຊ': [
    s(ring(45, 17, 11)),
    s('M 37 27 Q 26 35 26 50 Q 26 70 44 71 Q 59 72 59 57 Q 59 45 46 46'),
  ],
  // ຍ — body loop, then the tall arch + long descender at the right
  'ຍ': [
    s(ring(33, 44, 16)),
    s('M 49 44 Q 50 26 64 26 Q 75 27 75 42 L 75 100'),
  ],
  // ດ — bowl, then the stem dropping below the line at the right
  'ດ': [
    s(ring(38, 56, 20)),
    s('M 58 44 L 58 96'),
  ],
  // ຕ — bowl, stem down, small head curl at the stem top
  'ຕ': [
    s(ring(38, 58, 19)),
    s('M 57 46 L 57 96'),
    s('M 57 46 Q 57 32 46 34'),
  ],
  // ຖ — bowl, stem down, roof arc sweeping right + short hook
  'ຖ': [
    s(ring(38, 58, 19)),
    s('M 57 46 L 57 96'),
    s('M 57 44 Q 60 32 73 30 L 85 30 Q 91 31 89 38'),
  ],
  // ທ — bowl, long stem below the line, head curl at the top
  'ທ': [
    s(ring(38, 56, 20)),
    s('M 58 44 L 58 100'),
    s('M 58 44 Q 57 30 46 32'),
  ],
  // ນ — bowl + right stem rising to the head with the top curl right
  'ນ': [
    s(ring(38, 58, 20)),
    s('M 58 46 Q 58 34 68 33 Q 78 33 77 44'),
  ],
  // ບ — bowl right of an ascender stem on the left
  'ບ': [
    s(ring(52, 58, 20)),
    s('M 32 42 L 32 12'),
  ],
  // ປ — ring head, body sweeping down-left ending in the up hook
  'ປ': [
    s(ring(64, 20, 12)),
    s('M 55 33 Q 40 36 36 52 Q 32 69 45 74 Q 57 78 60 66'),
  ],
  // ຜ — bowl + crossing stem far right (ascender to baseline)
  'ຜ': [
    s(ring(38, 58, 20)),
    s('M 76 12 L 76 78'),
  ],
  // ຝ — stem (with top curl) + bowl hung on its right
  'ຝ': [
    s('M 44 12 Q 42 6 37 9 L 36 10 L 36 78'),
    s(ring(56, 58, 18)),
  ],
  // ພ — bowl + the rising body with the right hook
  'ພ': [
    s(ring(40, 58, 20)),
    s('M 60 54 Q 62 34 73 26 Q 84 19 87 29 Q 88 37 83 40'),
  ],
  // ຟ — stem with top curl + bowl hung on the right
  'ຟ': [
    s('M 44 12 Q 42 6 37 9 L 36 10 L 36 78'),
    s(ring(58, 58, 18)),
  ],
  // ມ — bowl + right stem rising with the top hook
  'ມ': [
    s(ring(38, 58, 20)),
    s('M 58 46 Q 58 32 70 32 Q 79 33 77 44'),
  ],
  // ຢ — body loop + right stem from the ascender down to the bowl
  'ຢ': [
    s(ring(36, 58, 18)),
    s('M 62 12 Q 74 14 73 26 L 70 52'),
  ],
  // ຣ — bowl, head swoop + descender, then the tail hooking back up-left
  'ຣ': [
    s(ring(37, 54, 19)),
    s('M 45 40 Q 52 25 64 26 Q 76 28 72 40 Q 68 48 61 52 Q 59 58 59 66 L 59 84'),
    s('M 59 86 Q 58 98 46 96 Q 34 94 36 80 Q 37 72 43 66'),
  ],
  // ລ — tall ascender curving into a loop at the foot
  'ລ': [
    s('M 62 8 L 62 40'),
    s('M 62 40 Q 62 30 49 30 Q 35 31 35 54 Q 35 76 50 76 Q 63 76 63 60'),
  ],
  // ຫ — small head loop top-left, left stem with the foot hook, bowl + right stem
  'ຫ': [
    s(ring(44, 41, 9)),
    s('M 44 49 Q 38 54 36 62 L 35 70 Q 35 78 28 77'),
    s('M 29 78 Q 46 82 58 70 Q 62 65 62 55 L 62 38'),
  ],
  // ອ — one full ring
  'ອ': [
    s(ring(50, 54, 27)),
  ],
  // ຮ — small bowl on top, bigger bowl below
  'ຮ': [
    s(ring(50, 30, 14)),
    s(ring(50, 66, 21)),
  ],
  // ວ — two valleys in one sweep
  'ວ': [
    s('M 16 34 Q 15 55 26 68 Q 35 77 41 67 Q 47 57 55 62 Q 67 69 70 50 Q 72 37 83 33'),
  ],
};
