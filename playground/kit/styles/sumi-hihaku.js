// Sumi, direction C: flying white (hihaku, feibai; research/28-sumi.md §2.5). Written with a flat brush (as flying white
// was: a broad brush, its hairs split by speed and a light load) held at one angle, so a stroke is broad one way and narrow
// the other; the load is light and the hand quick, so the paper shows through each stroke as streaks along it, each
// ending once. Few marks, broad, with the white between them designed (Kline's "I paint the white as well as the black").
// The drop: the capital kept as paper in a block of broad strokes (the seal's baiwen, written with the brush). The rubric:
// the seal, once, at the end; on the dark ground in gold, at a seal's size only.
//   hand(seed)  initial(ch, H, seed, fs, hd)  paraph(fs, seed, hd)  filler(w, lh, seed, hd)  runout(w, h, seed, hd)
//   brk(rank, w, h, seed, fs, hd)  frame(kind, w, h, seed, fs, hd)      Each returns a piece (sumi-brush.js make).
import { make, rng, heng, shu, sweep } from './sumi-brush.js';
import { mask } from './sumi-letter.js';

export const NAME = 'C · flying white';
export const STOCK = { light: '#f1ede4', dark: '#191b21' };

// one hand a page: the flat brush's angle, its size, the pace (quick), how dry the load
export function hand(seed) { const r = rng(seed * 7 + 303);
  return { k: .95 + .15 * r(), pace: 1.1 + .3 * r(), wet: .12 + .1 * r(), tone: .9 + .1 * r(), lean: .015 + .025 * r(), flat: 1.25 + .2 * r(), dry: .5 + .15 * r(), seal: 'D' }; }
const flat = (S, hd, a = hd.flat) => ({ ...S, flat: a, trackPx: 2.2, split: 1.2 });

// the drop: three broad strokes laid one under another from the left, quick and drying to the right, the capital kept
// as paper among them
export function initial(ch, H, seed, fs = 19, hd = hand(seed)) {
  const r = rng(seed * 3 + 5), m = mask(ch, H, 'cinzel', 1), lw = m.W - 12, pad = H * .13, bw = lw + pad * 2.6, bh = H + pad * 1.2, y0 = -pad * .6;
  const n = 3, th = bh / n * 1.38, strokes = [];
  for (let k = 0; k < n; k++) { const cy = y0 + bh * (k + .5) / n + (r() - .5) * th * .06, len = bw * (.9 + .12 * r()) - (k === 1 ? 0 : pad * .3 * r());
    strokes.push(flat(heng(-pad * .2 * r(), cy, len, th, seed + k * 19, hd, { entry: 'square', dryAt: .7 + .2 * r(), tail: .35, pace: .05, press: u => .94 + .06 * Math.sin(Math.PI * u), fan: .05 }), hd, Math.PI / 2 - .12 + .24 * r())); }
  const x = pad * .9, y = -(m.base - m.capPx);
  return make([{ ink: 'sumi', wet: .15, strokes, reserve: { ch, cap: H, face: 'cinzel', x: x - 6, y, box: { x: x - 6, y, w: m.W, h: m.H } } }]);
}
// ¶ a short broad stroke, down to the right, drying as it goes
export function paraph(fs, seed, hd = hand(seed)) {
  const r = rng(seed * 3 + 1), L = fs * (1 + .2 * r());
  return make([{ ink: 'shu', strokes: [flat(heng(0, -fs * .32, L, fs * .42, seed, hd, { entry: 'square', dryAt: .6 + .15 * r(), tail: .4, pace: .05 }), hd)] }]);
}
// the free end of a paragraph: one flat stroke into the gap, drying from early on
export function filler(w, lh, seed, hd = hand(seed)) {
  const r = rng(seed * 3 + 7), th = lh * (.36 + .06 * r());
  return make([{ ink: 'sumi', strokes: [flat(heng(0, th * .3, w * (.86 + .1 * r()), th, seed, hd, { dryAt: hd.dry * (.8 + .3 * r()), tail: .5, pace: .06 }), hd)] }]);
}
// a heading's run-out: a broader flat stroke, quick, its white opening along it
export function runout(w, h, seed, hd = hand(seed)) {
  const r = rng(seed * 3 + 11), th = h * (.42 + .06 * r());
  return make([{ ink: 'sumi', strokes: [flat(heng(0, th * .25, w * (.9 + .08 * r()), th, seed, hd, { dryAt: hd.dry * (.75 + .25 * r()), tail: .5, pace: .07 }), hd)] }]);
}
// breaks: 1, a short broad stroke; 2, one long diagonal gesture, off the axis; 3, one broad circle, and the seal
export function brk(rank, w, h, seed, fs = 19, hd = hand(seed)) {
  const r = rng(seed * 5 + rank);
  if (rank === 1) { const L = fs * (2.2 + .4 * r()); return make([{ ink: 'sumi', strokes: [flat(heng(-L / 2, fs * .1, L, fs * .55, seed, hd, { dryAt: .6, tail: .4, pace: .06 }), hd)] }]); }
  if (rank === 2) { const L = Math.min(w * .42, fs * 15), x0 = -L * (.55 + .1 * r()); return make([{ ink: 'sumi', strokes: [flat(sweep([x0, -fs * .7], [x0 + L, fs * .55], fs * .95, seed, hd, { dryAt: .5 + .1 * r(), tail: .5, bow: .035, pace: .07, press: u => .75 + .25 * Math.min(1, u * 2) }), hd, 1.0)] }]); }
  // a circle (as Yoshihara's were, a broad brush round once): the flat brush, dry, its white opening as it goes round
  const R = fs * 2.5, a0 = Math.PI * (.6 + .3 * r()), sw = 2 * Math.PI * (.9 + .12 * r()), ax = .95 + .06 * r(), pts = [];
  for (let k = 0; k <= 120; k++) { const u = k / 120, a = a0 + sw * u, rr = R * (1 + .04 * Math.sin(a * 2 + seed) - .04 * u); pts.push([-fs * .3 + Math.cos(a) * rr, Math.sin(a) * rr * ax]); }
  return make([{ ink: 'sumi', strokes: [{ pts, w: R * .27 * hd.k, flat: hd.flat, trackPx: 2.2, split: 1.2, press: u => .8 + .2 * Math.sin(Math.PI * u), entry: 'square', exit: 'lift', dryAt: .68 + .1 * r(), tail: .5, wet: hd.wet, tone: hd.tone, pace: .05 * hd.pace, seed: seed * 7 + 1, fan: .1 }] },
    { ink: 'gold', seal: { x: R * 1.05, y: R * .6, size: fs * .78, kind: 'baiwen', text: hd.seal, aspect: 1, seed } }]);
}
// a quotation: one broad vertical down its left margin, dry
export function frame(kind, w, h, seed, fs = 19, hd = hand(seed)) {
  const r = rng(seed * 9 + 2), len = h + fs * (1 + .3 * r());
  return make([{ ink: 'sumi', strokes: [flat(shu(fs * .4, -fs * .9, len + fs * .8, fs * .3, seed, hd, { exit: 'lift', dryAt: hd.dry + .15, tail: .8, pace: .055 }), hd, .05)] }]);
}
