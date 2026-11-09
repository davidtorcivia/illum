// PIE · A, the potter (research/24-pie.md): cord and comb pressed into clay, after the Corded Ware beaker (Prague City
// Museum P0000486) and the British Beaker sherds (PAS). The page is the slip; every ornament is a run of impressions.
// Measured on the beaker (scratchpad pie/py/cord*.py), all in units of the bead pitch p:
//   a two-ply twisted cord: two rows of beads ~.85 p apart, each bead an ellipse .62 p long, aspect 2.8, its long axis
//   26 degrees off the row; pitch spread ~8 % (autocorrelation 2nd peak); the row wanders ~.05 p bead to bead; the
//   impressions are grouped into bands of 2-4 cords with smooth clay between. Bead depth varies with the potter's
//   pressure (a slow swell along the cord, by eye ~.25) and a little bead to bead (~.1).
// The comb: a row of 4-7 square-ended teeth pressed at once, hatching triangles and zigzags (Yamnaya, Bell Beaker).
import { rng, gauss, letterMask, blurMask, at, fitGlyph } from './pie-relief.js';
import { glyph } from './copperplate-print.js';

export const FACE = '"Illum PIE Archivo"';
const P = fs => Math.max(3.6, fs * .26);          // the bead pitch at a body size (≥ 3.4 CSS px: a bead must keep 2 device px)

// one cord laid from x0 to x1 along y (two plies), its beads in the order the thumb pressed them. skip(x, y): a bead
// that would land there is not pressed (a letter reserved). t0..t1: when in the piece's making this cord was laid.
export function cord(x0, x1, y, p, r, { skip = null, t0 = 0, t1 = 1, d = .5, dir = 1, slant = 26, plies = 2 } = {}) {
  const out = [], a = dir * slant * Math.PI / 180, ph = r() * 6.28, lam = 6 + r() * 4, wob = [r() * 6.28, r() * 6.28];
  let x = x0 + r() * .5 * p, k = 0, yy = 0; const n = Math.max(1, (x1 - x0) / p);
  while (x < x1) {
    yy = .7 * yy + .05 * p * gauss(r);                                    // the thumb's wander, bead to bead
    const press = d * p * (1 + .22 * Math.sin(ph + k * 6.28 / lam) + .1 * gauss(r)) * (x1 - x < 1.2 * p ? .6 : 1);
    for (let j = 0; j < plies; j++) {
      const bx = x + j * .42 * p, by = y + yy + (j - (plies - 1) / 2) * .72 * p + .03 * p * Math.sin(wob[j] + k * .9);
      if (skip && skip(bx, by)) continue;
      out.push({ k: 'bead', x: bx, y: by, a: a + .06 * gauss(r), len: .72 * p * (1 + .06 * gauss(r)), wid: .72 * p / 2.8, d: Math.max(.05, press), lip: .3, t: t0 + (t1 - t0) * Math.min(1, k / n) });
    }
    x += p * (1 + .08 * gauss(r)); k++;
  }
  return out;
}
// a comb's stamp: n teeth in a row across direction a, centred at (x, y)
export function comb(x, y, a, n, p, r, t = 0, d = .45) { const out = [], c = Math.cos(a), s = Math.sin(a);
  for (let j = 0; j < n; j++) { const o = (j - (n - 1) / 2) * .55 * p; out.push({ k: 'bead', x: x - s * o, y: y + c * o, a, len: .36 * p, wid: .3 * p, d: d * p * (1 + .12 * gauss(r)), lip: .2, t }); }
  return out; }
// a straight groove drawn with a blunt stick, its hand wandering ~.04 p
export function stick(pts, p, r, t = 0, w = .3, d = .6) { const q = [], n = pts.length; for (let i = 0; i < n; i++) q.push([pts[i][0] + .04 * p * gauss(r), pts[i][1] + .04 * p * gauss(r)]);
  return { k: 'groove', p: q, w: w * p, d: d * p, t }; }
const segs = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);

// ---- the drop: the Beaker potter's zoned style. The letter is a zone drawn with a stick and filled with cord, rows
// across it; above and below, a band of cord between guide lines, as round a beaker's neck. The ground stays smooth.
export function initial(ch, H, seed, fs = 20, face = FACE) {
  const r = rng(seed * 7 + ch.charCodeAt(0)), p = P(fs) * .85, W = Math.round(H * .98);
  const top = 2.6 * p, bot = H - 2.6 * p, draw = fitGlyph(glyph, ch, face, (bot - top) * .86, W * .86, W / 2, (top + bot) / 2);
  return { W, H, u: p, marks(F) {
    const M = letterMask(F, draw), Mb = blurMask(F, M, .32 * p), out = [];
    // the stick: the guide lines, then round the letter, down it
    const g = (y, t) => out.push(stick(segs([.1 * p + .2 * p * r(), y + .1 * p * gauss(r)], [W - .1 * p - .2 * p * r(), y + .1 * p * gauss(r)], 10), p, r, t));
    g(.35 * p, 0); g(top - .55 * p, .01); g(bot + .55 * p, .02); g(H - .35 * p, .03);
    for (let s = 0; s < 6; s++) out.push({ k: 'edge', Mb, d: .55 * p, band: .2, y0: s * H / 6, y1: (s + 1) * H / 6, t: .04 + s * .02 });
    // the bands: one cord between each pair of guide lines
    out.push(...cord(.2 * p, W - .2 * p, (.35 * p + top - .55 * p) / 2, p, r, { t0: .16, t1: .26 }));
    out.push(...cord(.2 * p, W - .2 * p, (bot + .55 * p + H - .35 * p) / 2, p, r, { t0: .26, t1: .36, dir: -1 }));
    // the zone: cord rows across the letter, kept a little inside its line
    const keep = (x, y) => at(F, Mb, x, y) < .9, [, y0, , y1] = draw.box, rows = [];
    for (let y = y0 + .9 * p; y < y1 - .4 * p; y += 1.6 * p) rows.push(y);
    rows.forEach((y, j) => out.push(...cord(draw.box[0], draw.box[2], y, p, r, { skip: keep, t0: .38 + .62 * j / rows.length, t1: .38 + .62 * (j + 1) / rows.length, dir: j % 2 ? -1 : 1 })));
    return out; } };
}

// ---- the other pieces ---------------------------------------------------------------------------------------------------
// a cord along any straight segment a -> b (the beads laid as along a row, then turned onto it)
export function cordSeg(a, b, p, r, o = {}) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), th = Math.atan2(b[1] - a[1], b[0] - a[0]), c = Math.cos(th), s = Math.sin(th);
  return cord(0, L, 0, p, r, o).map(m => ({ ...m, x: a[0] + c * m.x - s * m.y, y: a[1] + s * m.x + c * m.y, a: m.a + th })); }
// a hanging triangle, the Beaker fringe: drawn with the stick, then hatched with the comb parallel to its left side
export function hanging(x, y, w, h, p, r, t0 = 0, t1 = 1, up = false) {
  const A = [x, y], B = [x + w, y], C = [x + w / 2, y + (up ? -h : h)], out = [stick([A, C, B], p, r, t0, .26, .5)];
  const n = Math.max(2, Math.floor(w / (.85 * p))), lines = [];
  for (let j = 1; j < n; j++) { const f = j / n, s0 = [A[0] + (B[0] - A[0]) * f, A[1]], s1 = [s0[0] + (C[0] - A[0]) * (1 - f), s0[1] + (C[1] - A[1]) * (1 - f)];
    const L = Math.hypot(s1[0] - s0[0], s1[1] - s0[1]), k = Math.max(1, Math.round(L / (.62 * p))), a = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]);
    for (let i = 0; i < k; i++) lines.push({ x: s0[0] + (s1[0] - s0[0]) * (i + .5) / k, y: s0[1] + (s1[1] - s0[1]) * (i + .5) / k, a }); }
  lines.forEach((q, i) => out.push({ k: 'bead', x: q.x, y: q.y, a: q.a + Math.PI / 2, len: .6 * p, wid: .3 * p, d: .55 * p * (1 + .12 * gauss(r)), lip: .2, t: t0 + (t1 - t0) * (.15 + .85 * i / lines.length) }));
  return out; }
const guide = (x0, x1, y, p, r, t) => stick(segs([x0 + .2 * p * r(), y + .08 * p * gauss(r)], [x1 - .2 * p * r(), y + .08 * p * gauss(r)], Math.max(2, Math.round((x1 - x0) / (6 * p)))), p, r, t);
const piece = (W, H, p, f, dur) => ({ W, H, u: p, dur, marks: f });

// the line initial: the zoned letter alone, two lines high
export function lineInitial(ch, fs, seed) { const r = rng(seed * 3 + ch.charCodeAt(0)), p = P(fs) * .7, H = Math.round(fs * 1.9);
  const draw = glyph(ch, FACE, H * .92, H * .6, H / 2), W = Math.ceil(draw.box[2] + .4 * p);
  return piece(W, H, p, F => { const M = letterMask(F, draw), Mb = blurMask(F, M, .3 * p), out = [];
    for (let s = 0; s < 4; s++) out.push({ k: 'edge', Mb, d: .55 * p, band: .2, y0: s * H / 4, y1: (s + 1) * H / 4, t: s * .05 });
    const rows = []; for (let y = draw.box[1] + .8 * p; y < draw.box[3] - .3 * p; y += 1.55 * p) rows.push(y);
    rows.forEach((y, j) => out.push(...cord(draw.box[0], draw.box[2], y, p, r, { skip: (x, yy) => at(F, Mb, x, yy) < .9, t0: .2 + .8 * j / rows.length, t1: .2 + .8 * (j + 1) / rows.length, dir: j % 2 ? -1 : 1 })));
    return out; }); }
// the paraph: one hanging triangle, the comb's hatching in it
export function paraph(fs, seed) { const r = rng(seed * 5 + 1), p = P(fs) * .8, W = fs * .85, H = fs * .8;
  return piece(W, H, p, () => hanging(.05 * W, .12 * H, .9 * W, .78 * H, p, r), 700); }
// the line filler: one cord, pressed lighter where the potter's thumb set it down and lifted it
export function filler(w, lh, seed) { const r = rng(seed * 11 + Math.round(w)), p = P(lh / 1.58), H = Math.round(lh * .7);
  return piece(w, H, p, () => cord(.2 * p, w - .3 * p, H / 2, p, r, { d: .45 }), 900); }
// the breaks. 1: a short cord between two strokes of the stick; 2: two cords between guide lines with the comb's
// zigzag between them; 3: the beaker's neck: guide lines, two cords, and a fringe of hanging triangles
export function brk(rank, w, h, seed) { const r = rng(seed * 17 + rank), p = P(h / 2.2) * .9;
  if (rank === 1) { const W = Math.min(w, 9 * p * 2.2), H = 2.4 * p;
    return piece(W, H, p, () => [guide(0, W, .3 * p, p, r, 0), ...cord(.6 * p, W - .6 * p, H / 2, p, r, { t0: .1 }), guide(0, W, H - .3 * p, p, r, .05)], 900); }
  if (rank === 2) { const W = Math.min(w, 34 * p), H = 6.4 * p;
    return piece(W, H, p, () => { const out = [guide(0, W, .35 * p, p, r, 0), guide(0, W, H - .35 * p, p, r, .03)];
      out.push(...cord(.3 * p, W - .3 * p, 1.5 * p, p, r, { t0: .06, t1: .4 }), ...cord(.3 * p, W - .3 * p, H - 1.5 * p, p, r, { t0: .4, t1: .74, dir: -1 }));
      const z = [], n = Math.round(W / (2.4 * p)); for (let i = 0; i <= n; i++) z.push([W * i / n, i % 2 ? 2.6 * p : H - 2.6 * p]);
      out.push(stick(z, p, r, .76, .26, .5)); return out; }, 1600); }
  const W = Math.min(w, 44 * p), H = 9.5 * p;
  return piece(W, H, p, () => { const out = [guide(0, W, .35 * p, p, r, 0), guide(0, W, 3.9 * p, p, r, .03)];
    out.push(...cord(.3 * p, W - .3 * p, 1.4 * p, p, r, { t0: .06, t1: .3 }), ...cord(.3 * p, W - .3 * p, 2.9 * p, p, r, { t0: .3, t1: .54, dir: -1 }));
    const n = Math.max(3, Math.round(W / (4.4 * p))), tw = W / n;
    for (let i = 0; i < n; i++) out.push(...hanging(i * tw + .12 * tw, 4.35 * p, .76 * tw, H - 4.8 * p, p, r, .56 + .44 * i / n, .56 + .44 * (i + 1) / n));
    return out; }, 2200); }
// the heading's run-out: two cords from the heading's end to the measure's, the lower one lifted off sooner
export function runout(w, h, seed) { const r = rng(seed * 19), p = P(h * .5), H = 3.4 * p;
  return piece(w, H, p, () => [...cord(.2 * p, w - .2 * p, 1.1 * p, p, r, { t1: .6 }), ...cord(.2 * p, w * (.62 + .1 * r()), 2.5 * p, p, r, { t0: .4, dir: -1 })], 1400); }
// the frames: ornament on a w x h box's edges, its middle left for the text
export function frame(kind, w, h, seed, fs = 20) { const r = rng(seed * 23 + kind.length), p = P(fs) * .85;
  if (kind === 'quote') return piece(3.2 * p, h, p, () => [stick(segs([.4 * p, 0], [.5 * p, h], 8), p, r, 0), ...cordSeg([1.9 * p, .3 * p], [1.9 * p, h - .3 * p], p, r, { t0: .1 })], 1400);
  if (kind === 'pull') return piece(w, h, p, () => { const out = [guide(0, w, .3 * p, p, r, 0), ...cord(.3 * p, w - .3 * p, 1.3 * p, p, r, { t0: .05, t1: .3 }), guide(0, w, 2.3 * p, p, r, .3),
      guide(0, w, h - .3 * p, p, r, .5), ...cord(.3 * p, w - .3 * p, h - 1.3 * p, p, r, { t0: .55, t1: .8, dir: -1 }), guide(0, w, h - 2.3 * p, p, r, .8)];
    const n = Math.max(3, Math.round(w / (5 * p))), tw = w / n; for (let i = 0; i < n; i++) out.push(...hanging(i * tw + .15 * tw, 2.7 * p, .7 * tw, 2.6 * p, p, r, .3 + .2 * i / n, .3 + .2 * (i + 1) / n));
    return out; }, 2000);
  if (kind === 'aside') return piece(w, h, p, () => { const out = [stick([[.4 * p, .4 * p], [w - .4 * p, .4 * p], [w - .4 * p, h - .4 * p], [.4 * p, h - .4 * p], [.4 * p, .4 * p]].flatMap((q, i, A) => i ? segs(A[i - 1], q, 6).slice(1) : [q]), p, r, 0)];
    for (const [x, y, s] of [[.4 * p, .4 * p, 1], [w - .4 * p, .4 * p, -1], [.4 * p, h - .4 * p, -1], [w - .4 * p, h - .4 * p, 1]]) for (let k = 1; k <= 3; k++) out.push(...comb(x + Math.sign(w / 2 - x) * (k + .4) * p, y + Math.sign(h / 2 - y) * (k + .4) * p, s * Math.PI / 4, 4 - k, p, r, .4 + k * .1));
    return out; }, 1200);
  if (kind === 'figure') return piece(w, h, p, () => [guide(0, w, .3 * p, p, r, 0), ...cord(.3 * p, w - .3 * p, 1.3 * p, p, r, { t0: .05, t1: .45 }), guide(0, w, h - .3 * p, p, r, .5), ...cord(.3 * p, w - .3 * p, h - 1.3 * p, p, r, { t0: .55, t1: .95, dir: -1 })], 1600);
  if (kind === 'code') return piece(w, h, p, () => { const out = []; const n = Math.round(w / (2.2 * p)); for (let i = 0; i < n; i++) out.push(...comb((i + .5) * w / n, .9 * p, 0, 3, p, r, .6 * i / n), ...comb((i + .5) * w / n, h - .9 * p, 0, 3, p, r, .4 + .6 * i / n)); return out; }, 1400);
  // contents: a herringbone of comb stamps down the left
  return piece(3.4 * p, h, p, () => { const out = []; const n = Math.floor(h / (1.3 * p)); for (let i = 0; i < n; i++) { const y = (i + .6) * 1.3 * p;
    out.push(...comb(1 * p, y, Math.PI / 4, 3, p, r, i / n), ...comb(2.4 * p, y, -Math.PI / 4, 3, p, r, i / n)); } return out; }, 1400);
}
