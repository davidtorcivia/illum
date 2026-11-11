// Sumi's pieces (research/28-sumi.md): the approved direction's marks, each a piece of kit/styles/sumi-brush.js (make),
// drawn in anchor coordinates. The hand is A's, the written stroke (sumi-kaisho.js: the vermilion point, the point and the
// sweep as breaks, the vertical beside a quotation); the fillers and run-outs are B's orchid leaf (sumi-ran.js), laid low
// in the line's band; the end mark is A's ensō, B's orchid clump or C's broad dry circle (sumi-hihaku.js), each with a seal;
// the drop is a large seal, the capital (Cinzel, OFL) cut white into its red field. Every seal from one carver.
//   hand(seed, rich)  initial(ch, H, seed, fs, hd, o)  paraph(fs, seed, hd)  filler(w, lh, seed, hd, o)  runout(w, h, seed,
//   hd, o)  brk(rank, w, h, seed, fs, hd, o)  frame(kind, w, h, seed, fs, hd)     (rank 3: the page's end mark)
//   ENDS: every end mark by name; RICHES: the richnesses the bench shows.
// rich (0..1) leans the end mark toward the fuller ones; the style (kit/styles/sumi.js) passes o for the richer pieces:
// a second leaf in a filler or a run-out, the drop's seal a size larger, a seal on the major break.
import { make, rng, leaf, sweep, heng } from './sumi-brush.js';
import * as A from './sumi-kaisho.js';
import * as B from './sumi-ran.js';
import * as C from './sumi-hihaku.js';

export const NAME = 'Sumi · the written stroke, the orchid leaf, the seal';
export const RICHES = [0, .5, 1];
export const STOCK = A.STOCK;
export const FONT = '700 {s}px "illum-sumi-cinzel"';   // (the shipped Cinzel subset: fonts/sumi/)

// one hand a page (A's: the brush's size, pace, wetness and tone, the slope of its horizontals, the ensō's way round), the
// leaves' belly and lean, and the page's end mark (a plain page the quiet circle; richer, the seed chooses, leaning toward
// the ensō and the clump: at 1 the circle is never chosen)
export function hand(seed, rich = .5) {
  const hd = A.hand(seed), r = rng(seed * 13 + 404), e = r(), wE = .3 + .25 * rich, wB = .3 + .15 * rich;
  return { ...hd, end: rich < .25 ? 'circle' : e < wE ? 'enso' : e < wE + wB ? 'clump' : 'circle', belly: .74 + .16 * r(), arch: .7 + .6 * r(), leafTone: r() < .7 ? 1 : .62, rich };
}

// the drop: a large seal, the capital cut white into a red field, printed once in cinnabar; it stands the drop's height
// (cap to the last line's baseline). o.hang: a size larger, the extra hung up and out into the margin.
export function initial(ch, H, seed, fs = 19, hd = hand(seed), { hang = 0 } = {}) {
  const S = H * (1 + hang), e = S - H;
  return make([{ ink: 'seal', seal: { x: -e, y: -e, size: S, kind: 'baiwen', text: ch, aspect: 1, seed, wait: 0, dur: 460, fill: .8, worn: 1, font: FONT } }], 4);
}
export const DROPS = { seal: initial };
// a line's initial: the same stone, small, the capital cut white into it
export const lineSeal = (ch, H, seed) => make([{ ink: 'seal', seal: { x: 0, y: 0, size: H, kind: 'baiwen', text: ch, aspect: 1, seed, wait: 0, dur: 300, fill: .8, worn: .8, font: FONT } }], 3);

export const paraph = (fs, seed, hd = hand(seed)) => A.paraph(fs, seed, hd);
export const frame = (kind, w, h, seed, fs = 19, hd = hand(seed)) => A.frame(kind, w, h, seed, fs, hd);
// the free end of a paragraph: an orchid leaf laid low along the line, within its band (its rise held to half the
// x-height; anchor: the middle of the x-height); o.two: a second, smaller leaf from the same root, under it
export function filler(w, lh, seed, hd = hand(seed), { two = false } = {}) {
  const r = rng(seed * 3 + 7), xh = lh * .27, L = [leaf([0, xh * .3], -.03 - .03 * r(), w * (.88 + .08 * r()), lh * (.17 + .02 * r()), seed, hd, { tone: hd.leafTone ?? 1, k1: (.35 + .3 * r()) * (hd.arch ?? 1), pinch: .55 + .15 * r(), swell: hd.belly ?? .82, flatY: xh * .55 })];
  if (two) L.unshift(leaf([0, xh * .35], .01 + .02 * r(), w * (.42 + .12 * r()), lh * .12, seed + 17, hd, { tone: .5, k1: .25 + .2 * r(), pinch: .6, swell: hd.belly ?? .82, flatY: xh * .35 }));
  return make([{ ink: 'sumi', strokes: L }]);
}
// a heading's run-out: the same leaf, a little fuller, held within the heading's x-height; o.two: a second, paler leaf
export function runout(w, h, seed, hd = hand(seed), { two = false } = {}) {
  const r = rng(seed * 3 + 11), xh = h * .45, L = [leaf([0, xh * .25], -.04 - .03 * r(), w * (.9 + .06 * r()), h * (.19 + .03 * r()), seed, hd, { k1: (.4 + .3 * r()) * (hd.arch ?? 1), pinch: .5 + .15 * r(), swell: hd.belly ?? .82, flatY: xh * .5 })];
  if (two) L.unshift(leaf([0, xh * .3], -.01, w * (.55 + .15 * r()), h * .13, seed + 23, hd, { tone: .45, k1: .2 + .2 * r(), pinch: .6, swell: hd.belly ?? .82, flatY: xh * .4 }));
  return make([{ ink: 'sumi', strokes: L }]);
}
// breaks: 1, A's point; 2, A's sweep (o.seal: a small seal at its foot); 3, the page's end mark
// (every end mark's seal from the drop's carver: the same cinnabar, the Cinzel cut, the same kind of edge)
const carver = pc => { for (const L of pc.layers) if (L.seal) { if (L.ink === 'gold') L.ink = 'seal'; Object.assign(L.seal, { kind: 'baiwen', font: FONT, worn: 1, fill: .8 }); } return pc; };
export const ENDS = { enso: (w, h, seed, fs) => carver(A.brk(3, w, h, seed, fs, A.hand(seed))), clump: (w, h, seed, fs) => carver(B.brk(3, w, h, seed, fs, B.hand(seed))), circle: (w, h, seed, fs) => carver(C.brk(3, w, h, seed, fs, C.hand(seed))) };
export function brk(rank, w, h, seed, fs = 19, hd = hand(seed), { seal = false } = {}) {
  if (rank === 3) return ENDS[hd.end](w, h, seed, fs);
  if (rank === 2 && seal) { const r = rng(seed * 5 + 2), L = Math.min(w * .34, fs * 13), x0 = -L * (.62 + .1 * r()), y0 = -fs * .4, b = [x0 + L, y0 + fs * .55];
    return make([{ ink: 'sumi', strokes: [sweep([x0, y0 - fs * .1], b, fs * .62, seed, hd, { tail: .45, dryAt: .8 })] }, { ink: 'seal', seal: { x: b[0] + fs * .5, y: b[1] - fs * .55, size: fs * .78, kind: 'baiwen', text: hd.seal, aspect: 1, seed, font: FONT, worn: 1, fill: .8 } }]); }
  return A.brk(rank, w, h, seed, fs, hd);
}
// the frames' marks, all A's strokes: a vertical beside a block (quotation, aside, code), a horizontal over or under one
// (pull quote, figure), a point before an entry (contents)
export const vertical = (len, fs, seed, hd) => make([{ ink: 'sumi', strokes: [A.frame('quote', 1, len - fs * 1.2, seed, fs, hd).layers[0].strokes[0]] }]);
export const horizontal = (w, fs, seed, hd) => { const r = rng(seed * 7 + 3); return make([{ ink: 'sumi', strokes: [heng(0, 0, w, fs * .26, seed, hd, { dryAt: .6 + .2 * r(), tail: .8, pace: .05 })] }]); };
export const point = (fs, seed, hd) => A.brk(1, 1, 1, seed, fs * .7, hd);
