// Sumi, direction A: the written stroke (kaisho, the regular hand; research/28-sumi.md §4). Every mark is one stroke of a
// round brush in sumi, written as the regular hand writes it: separate strokes, hidden-tip starts, each with its end (a
// lift to a point, a return). The rubric is the teacher's vermilion (shu, the red ink a calligraphy teacher corrects in),
// for the paraphs only; the cinnabar seal is pressed once, under the ensō at the end. The drop: a Roman inscriptional
// capital (Cinzel, OFL) poured as one deposit of sumi and written along its skeleton.
//   hand(seed)  initial(ch, H, seed, fs, hd)  paraph(fs, seed, hd)  filler(w, lh, seed, hd)  runout(w, h, seed, hd)
//   brk(rank, w, h, seed, fs, hd)  frame(kind, w, h, seed, fs, hd)      Each returns a piece (sumi-brush.js make).
import { make, rng, dian, heng, shu, sweep, ensoStroke } from './sumi-brush.js';
import { mask } from './sumi-letter.js';

export const NAME = 'A · the written stroke';
export const STOCK = { light: '#f3efe6', dark: '#1b1d24' };   // raw xuan; the inkstone

// one hand a page: the brush's size, the pace, how wet, how dark, how the horizontals rise, the ensō's way round
export function hand(seed) { const r = rng(seed * 7 + 101);
  return { k: .92 + .16 * r(), pace: .85 + .3 * r(), wet: .3 + .25 * r(), tone: .95 + .1 * r(), lean: .02 + .03 * r(), cw: r() < .8 ? 1 : -1, start: Math.PI * (.55 + .35 * r()), seal: 'D' }; }

// the drop: the capital poured as one deposit, cap height H (from the first line's cap to the last line's baseline)
export function initial(ch, H, seed, fs = 19, hd = hand(seed)) {
  const m = mask(ch, H, 'cinzel', 1), x = -m.W * .02, y = -(m.base - m.capPx) - .02 * H;
  return make([{ ink: 'sumi', wet: .3, glyph: { ch, cap: H, face: 'cinzel', x, y, box: { x, y, w: m.W, h: m.H }, tone: hd.tone, seed, dur: 1100 + 30 * H } }]);
}
// ¶ a point in vermilion, its foot on the baseline
export function paraph(fs, seed, hd = hand(seed)) {
  const s = fs * .62; return make([{ ink: 'shu', strokes: [dian(-s * .45, -s * 1.05, s, seed, hd)] }]);
}
// the free end of a paragraph: one horizontal written into the gap, its charge spent just where the gap ends
export function filler(w, lh, seed, hd = hand(seed)) {
  const r = rng(seed * 3 + 7), len = w * (.86 + .1 * r()), th = lh * (.3 + .06 * r());
  return make([{ ink: 'sumi', strokes: [heng(0, th * .5, len, th, seed, hd, { dryAt: .62 + .12 * r(), tail: .7, pace: .045 })] }]);
}
// a heading's run-out: a long horizontal, heavier, carried out to the margin and running dry
export function runout(w, h, seed, hd = hand(seed)) {
  const r = rng(seed * 3 + 11), th = h * (.26 + .05 * r());
  return make([{ ink: 'sumi', strokes: [heng(0, th * .4, w * (.9 + .08 * r()), th, seed, hd, { dryAt: .55 + .1 * r(), tail: .9, pace: .05 })] }]);
}
// breaks: 1, a point; 2, one long sweep across a third of the measure, off the axis; 3, the ensō, and the seal beneath it
export function brk(rank, w, h, seed, fs = 19, hd = hand(seed)) {
  const r = rng(seed * 5 + rank);
  if (rank === 1) { const s = fs * .8; return make([{ ink: 'sumi', strokes: [dian(-s * .3, -s * .45, s, seed, hd, { angle: .9 })] }]); }
  if (rank === 2) { const L = Math.min(w * .34, fs * 13), x0 = -L * (.62 + .1 * r()), y0 = -fs * .4; return make([{ ink: 'sumi', strokes: [sweep([x0, y0 - fs * .1], [x0 + L, y0 + fs * .55], fs * .62, seed, hd, { tail: .45, dryAt: .8 })] }]); }
  const R = fs * 2.6, sz = fs * .78;
  return make([{ ink: 'sumi', strokes: [ensoStroke(-fs * .3, 0, R, seed, { cw: hd.cw, start: hd.start + (r() - .5) * .5, wet: hd.wet, tone: hd.tone })] },
    { ink: 'seal', seal: { x: R * 1.02, y: R * .62, size: sz, kind: 'baiwen', text: hd.seal, aspect: 1, seed } }]);
}
// a quotation: one vertical down its left margin, a hanging needle at its foot
export function frame(kind, w, h, seed, fs = 19, hd = hand(seed)) {
  const r = rng(seed * 9 + 2), len = h + fs * (1.1 + .3 * r()); return make([{ ink: 'sumi', strokes: [shu(fs * .45, -fs * .55, len, fs * .19, seed, hd, { exit: 'lift', dryAt: .72 + .15 * r(), tail: 2.2 })] }]);
}
