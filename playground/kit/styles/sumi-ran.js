// Sumi, direction B: the orchid leaf (after Zheng Xie, Orchids and bamboo, 1742, Met 1981.285.7, CC0; research/28-sumi.md
// §4). Leaves only: each one quick stroke of a round brush that swells (the belly), pinches where it turns to show its
// back, swells a little again and is lifted to a long fine point. Two tones of one ink, as in the scroll: the pale leaves
// written first, the dark over them (measured on the scroll: dark L ~70–90, pale ~120–140, on paper ~190). No flowers: a
// small mark must be one clear thing. The rubric: the seal, once, at the end (a tall stone).
//   hand(seed)  initial(ch, H, seed, fs, hd)  paraph(fs, seed, hd)  filler(w, lh, seed, hd)  runout(w, h, seed, hd)
//   brk(rank, w, h, seed, fs, hd)  frame(kind, w, h, seed, fs, hd)      Each returns a piece (sumi-brush.js make).
import { make, rng, leaf } from './sumi-brush.js';
import { mask } from './sumi-letter.js';

export const NAME = 'B · the orchid leaf';
export const STOCK = { light: '#f2eee5', dark: '#1d1f26' };
const PALE = .36, DARK = 1;

// one hand a page: the brush, the pace, which way the leaves lean (the wind of the page), how much they arch
export function hand(seed) { const r = rng(seed * 7 + 202);
  return { k: .9 + .2 * r(), pace: .85 + .3 * r(), wet: .25 + .2 * r(), tone: .95 + .1 * r(), lean: r() < .7 ? 1 : -1, arch: .8 + .5 * r(), seal: 'D' }; }
const L = (base, a, len, w, seed, hd, o = {}) => leaf(base, a, len, w, seed, hd, { ...o, turn: (o.turn ?? 1) * hd.arch });

// the drop: the capital in sumi; behind it, three pale leaves from one root at its foot (the pale first, then the letter)
export function initial(ch, H, seed, fs = 19, hd = hand(seed)) {
  const r = rng(seed * 3 + 5), m = mask(ch, H, 'cinzel', 1), x = 0, y = -(m.base - m.capPx), lw = m.W - 12, root = [lw * (.42 + .16 * r()), H * 1.04];
  // two pale leaves from one root at its foot, rising behind it and arching opposite ways, crossing once (an eye round it)
  const leaves = [L(root, -Math.PI / 2 - .5 - .15 * r(), H * (1.05 + .15 * r()), fs * (.38 + .08 * r()), seed, hd, { tone: PALE, k1: 2.3 + .6 * r(), pinch: .6 }),
    L([root[0] + fs * .15, root[1]], -Math.PI / 2 + .42 + .15 * r(), H * (.95 + .15 * r()), fs * (.34 + .08 * r()), seed + 31, hd, { tone: PALE, k1: -(1.9 + .6 * r()), pinch: .55, wait: 60 })];
  return make([{ ink: 'pale', strokes: leaves }, { ink: 'sumi', wet: .3, glyph: { ch, cap: H, face: 'cinzel', x, y, box: { x, y, w: m.W, h: m.H }, tone: hd.tone, seed, dur: 1100 + 30 * H, wait: 160 } }]);
}
// ¶ one short leaf, rising from the baseline
export function paraph(fs, seed, hd = hand(seed)) {
  const r = rng(seed * 3 + 1); return make([{ ink: 'sumi', strokes: [L([0, 0], -.95 - .25 * r(), fs * (1.25 + .25 * r()), fs * .2, seed, hd, { tone: DARK, turn: .9, pinch: .62 })] }]);
}
// the free end of a paragraph: one long leaf lying along the line, its tip turning down at the end
export function filler(w, lh, seed, hd = hand(seed)) {
  const r = rng(seed * 3 + 7), len = w * (.9 + .06 * r());
  return make([{ ink: 'sumi', strokes: [L([0, lh * .12], -.09 - .05 * r(), len, lh * (.2 + .04 * r()), seed, hd, { tone: r() < .5 ? DARK : .62, k1: .5 + .3 * r(), pinch: .55 + .15 * r() })] }]);
}
// a heading's run-out: one long leaf from the heading to the margin
export function runout(w, h, seed, hd = hand(seed)) {
  const r = rng(seed * 3 + 11);
  return make([{ ink: 'sumi', strokes: [L([0, h * .15], -.1 - .04 * r(), w * (.92 + .05 * r()), h * (.26 + .04 * r()), seed, hd, { tone: DARK, k1: .55 + .3 * r(), pinch: .5 + .15 * r() })] }]);
}
// breaks: 1, one leaf; 2, three from one root, two crossing and the third through the eye they make (the phoenix eye);
// 3, a clump, pale behind and dark in front, and the seal beside it
export function brk(rank, w, h, seed, fs = 19, hd = hand(seed)) {
  const r = rng(seed * 5 + rank), s = hd.lean;
  if (rank === 1) return make([{ ink: 'sumi', strokes: [L([-fs * 1.1 * s, fs * .35], -.5 - .2 * r(), fs * 2.6, fs * .24, seed, hd, { tone: DARK, k1: 1.1 })] }].map(l => s < 0 ? flip(l) : l));
  if (rank === 2) { const root = [-fs * 4.2, fs * .9];
    const ks = [L(root, -.2, fs * 8.2, fs * .3, seed, hd, { tone: DARK, k1: .55, pinch: .56 }), L([root[0] + fs * .4, root[1]], -.52, fs * 5.2, fs * .28, seed + 3, hd, { tone: DARK, k1: 1.25, pinch: .6, wait: 60 }),
      L([root[0] + fs * .2, root[1]], -.36, fs * 6.6, fs * .26, seed + 7, hd, { tone: DARK, k1: .2, pinch: .5, wait: 60 })];
    return make([{ ink: 'sumi', strokes: ks }].map(l => s < 0 ? flip(l) : l)); }
  const root = [-fs * .8, fs * 2.1], pale = [], dark = [];
  for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .34 + (r() - .5) * .2, len = fs * (4.6 + 2.6 * r() - .5 * Math.abs(k - 2.5)), front = k % 2 === 0;
    (front ? dark : pale).push(L([root[0] + (k - 2.5) * fs * .12, root[1]], a, len, fs * (.24 + .06 * r()), seed + k * 13, hd, { tone: front ? DARK : PALE, k1: (a < -Math.PI / 2 ? -1 : 1) * (1.2 + 1.4 * r()), pinch: .5 + .2 * r(), wait: 70 })); }
  return make([{ ink: 'pale', strokes: pale }, { ink: 'sumi', strokes: dark }, { ink: 'seal', seal: { x: fs * 3.2, y: fs * .9, size: fs * .72, aspect: 1.3, kind: 'baiwen', text: hd.seal, seed } }]);
}
// a quotation: one leaf rising up its left margin, its tip turning over the quotation's head
export function frame(kind, w, h, seed, fs = 19, hd = hand(seed)) {
  const r = rng(seed * 9 + 2);
  return make([{ ink: 'sumi', strokes: [L([fs * .3, h + fs * .25], -Math.PI / 2 - .12, h + fs * 1.1, fs * .24, seed, hd, { tone: .8, k1: .9 + .3 * r(), pinch: .62 })] }]);
}
// mirrored (the page's leaves lean the other way)
function flip(l) { return { ...l, strokes: l.strokes.map(S => ({ ...S, pts: S.pts.map(([x, y]) => [-x, y]) })) }; }
