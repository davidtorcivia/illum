// Art Deco's media, printed through the ink engine (kit/inkletter.js inkLetter). Measured on the masters (research/22-deco.md):
//   gouache  pochoir colour, dabbed through a stencil: a flat opaque coat (Séguy, Prismes 1930: slow sd under 1 % of its
//            lightness, flatter than the paper), its edge the knife's straight cut; laid over an earlier colour it leaves a
//            thin darker seam where the two films overlap (Prismes 27: ~18 L darker, ~.2 mm)
//   stipple  the stencil brush (tampon) worked in from the cut and lifted toward the open side: solid near the cut, then
//            dissolving into the brush's flecks (Prismes 1)
//   metal    gold or silver ink (Schmied, Les Climats 1924; Séguy's powder bands): a coat with a slow mottle of ~10-13 % of its
//            density and a fine tooth, no gradient, no sheen painted on
//   press    letterpress: the forme's black, its edge pushed in and out a fraction of a px by the paper's grain (as Kelmscott)
// A Sheet collects layers in their laying order; each layer is one ink drawn by a function into a mask (Path2D fills,
// strokes or a typeface glyph). render() makes each layer's mask, slips the non-key inks a fraction of a px off register,
// traps them (so a slip never opens a paper gap) and pours each through its medium.
//   const S = new Sheet(); S.ink('red', g => g.fill(path), { medium: 'gouache' }); render(S, bake, { dpr, pal, seed, box })
import { inkLetter, boxBlur as blur } from '../inkletter.js';
import { noise2, stream, fnv } from '../marks.js';

export class Sheet {
  constructor() { this.layers = []; }
  // col: a palette key; draw(g): paints the shape in any colour into g (piece px); o.medium: gouache | stipple | metal | press;
  // o.fade: { from: [x, y], to: [x, y], solid: .5 } for stipple; o.key: printed in register (no slip, no trap)
  ink(col, draw, o = {}) { this.layers.push({ col, draw, medium: o.medium ?? 'gouache', fade: o.fade, key: !!o.key, trap: o.trap, seam: o.seam ?? true, despeck: o.despeck ?? 0 }); return this; }
}
const rgbOf = s => Array.isArray(s) ? s : s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;

// a layer's coverage on a grid of res cells a px over box, slipped by sl, grown by trap px
function mask(L, box, res, sl, trap) {
  const [x0, y0, x1, y1] = box, w = Math.ceil((x1 - x0) * res), h = Math.ceil((y1 - y0) * res);
  const g = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
  g.setTransform(res, 0, 0, res, (sl[0] - x0) * res, (sl[1] - y0) * res); g.fillStyle = g.strokeStyle = '#000'; g.lineJoin = 'miter';
  L.draw(g, trap);
  const d = g.getImageData(0, 0, w, h).data, M = new Float32Array(w * h);
  for (let q = 0; q < w * h; q++) M[q] = d[q * 4 + 3] / 255;
  if (L.despeck) despeck(M, w, h, L.despeck * res * res);
  // the trap: the coat grown by trap px (a slipped stencil still overlaps its neighbour rather than leaving paper)
  if (trap > 0) { const r = Math.max(1, Math.round(trap * res)), B = blur(M, w, h, r);
    for (let q = 0; q < w * h; q++) if (B[q] > 0) M[q] = Math.max(M[q], clamp(B[q] * 2.2)); }
  return { M, w, h, x0, y0, res };
}

// a fleck of a shape cut off from the rest (a ruling's end clipped to a sliver) is not printed: every mark is meant
function despeck(M, w, h, minArea) {
  const lab = new Int32Array(w * h), st = []; let n = 0;
  for (let q0 = 0; q0 < w * h; q0++) { if (M[q0] <= .05 || lab[q0]) continue; n++; const cells = []; st.push(q0); lab[q0] = n;
    while (st.length) { const q = st.pop(); cells.push(q); const i = q % w;
      for (const o of [i > 0 ? q - 1 : -1, i < w - 1 ? q + 1 : -1, q - w, q + w]) if (o >= 0 && o < w * h && !lab[o] && M[o] > .05) { lab[o] = n; st.push(o); } }
    if (cells.length < minArea) for (const q of cells) M[q] = 0; }
}

// ---- the media: each turns a coverage into what the engine pours (density in the coverage) -------------------------------
function gouache(L, seed) {
  // flat: the engine lays a full coat above ~.55 of coverage, so the coat sits at .9 with a slow brush field of +-1.5 %
  const { M, w, h, x0, y0, res } = L, slow = noise2(seed ^ 0x61), O = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, m = M[q]; if (m <= 0) continue;
    O[q] = m * (.9 + .03 * (slow((x0 + i / res) / 14, (y0 + j / res) / 14) - .5)); }
  return { ...L, M: O };
}
function stipple(L, seed, fade) {
  // the tampon's flecks: a field of round dabs (two scales of a value field, thresholded hard), against how far the brush
  // was from the cut (u, 0 at the cut to 1 at the open side): solid to fade.solid, then thinning out to nothing at u = 1
  const { M, w, h, x0, y0, res } = L, a = noise2(seed ^ 0x2b), b = noise2(seed ^ 0x5c), O = new Float32Array(w * h);
  const [fx, fy] = fade.from, [tx, ty] = fade.to, dx = tx - fx, dy = ty - fy, d2 = dx * dx + dy * dy, s0 = fade.solid ?? .5, fl = fade.fleck ?? 1.1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, m = M[q]; if (m <= 0) continue;
    const x = x0 + i / res, y = y0 + j / res, u = clamp(((x - fx) * dx + (y - fy) * dy) / d2), t = clamp((u - s0) / (1 - s0));
    const v = .62 * a(x / fl, y / fl) + .38 * b(x / (fl * .42), y / (fl * .42));   // the dab field
    const k = clamp((v - (t * 1.15 - .08)) * 7 + .5);                                  // flecks, hard-edged
    O[q] = m * .9 * k; }
  return { ...L, M: O };
}
function metal(L, seed, size) {
  // gold ink: a slow mottle at about a third of the shape's size (sd ~12 % of the density) and a fine tooth (~3 %)
  const { M, w, h, x0, y0, res } = L, slow = noise2(seed ^ 0x17), tooth = noise2(seed ^ 0x39), O = new Float32Array(w * h), S = Math.max(4, size / 3);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, m = M[q]; if (m <= 0) continue; const x = x0 + i / res, y = y0 + j / res;
    O[q] = m * (.76 + .26 * (slow(x / S, y / S) - .5) + .06 * (tooth(x / .45, y / .45) - .5)); }
  return { ...L, M: O };
}
function press(L, seed) {
  // the forme's edge as the paper takes it: the antialiased rim pushed in or out by a slow grain (a fraction of a px; a
  // rule's edge stays true to ~.1 px at page size, as a cast rule prints)
  const { M, w, h, res } = L, gr = noise2(seed ^ 0x45), O = Float32Array.from(M), amt = .35 * Math.min(1, 2 / res);
  for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) { const q = j * w + i, m = M[q];
    if (m > .02 && m < .98) O[q] = clamp(m + (gr(i / res / 1.6, j / res / 1.6) - .5) * amt); }
  return { ...L, M: O };
}

// bake: a 2D context in page px × dpr (no transform of its own); box: the piece's box in its own px; pal: { col: rgb }
export function render(S, bake, { dpr = 2, pal, seed = 1, box, slip = .4, trap = .35, res = Math.max(2, dpr) } = {}) {
  const r = stream(seed, 'register'), size = Math.min(box[2] - box[0], box[3] - box[1]);
  const laid = [];   // the coverage laid so far (unslipped cells), for the seams
  for (let k = 0; k < S.layers.length; k++) {
    const L = S.layers[k], key = L.key || L.medium === 'press', a = r() * Math.PI * 2, sl = key ? [0, 0] : [Math.cos(a) * slip, Math.sin(a) * slip];
    const t = key ? 0 : (L.trap ?? trap), m = mask(L, box, res, sl, t), sd = seed + fnv(L.col + ':' + k) % 9973, rgb = rgbOf(pal[L.col]);
    const coat = L.medium === 'stipple' ? stipple(m, sd, L.fade) : L.medium === 'metal' ? metal(m, sd, size) : L.medium === 'press' ? press(m, sd) : gouache(m, sd);
    inkLetter(bake, { ...coat, wet: key ? .05 : .08, dry: key ? .16 : .08 }, rgb, { dpr });
    // the seam: where this coat's rim lies over an earlier colour, the two films overlap and read darker (a thin line, there only)
    if (L.seam && !key && L.medium !== 'stipple' && laid.length) {
      const R = Math.max(1, Math.round(.7 * res)), B = blur(m.M, m.w, m.h, R), Sm = new Float32Array(m.w * m.h); let any = false;
      for (let q = 0; q < Sm.length; q++) { const rim = m.M[q] > .05 ? clamp((1 - B[q]) * 2.2) * m.M[q] : 0; if (rim <= 0) continue;
        let under = 0; for (const U of laid) under = Math.max(under, U[q]); if (under > .3) { Sm[q] = rim * under * .55; any = true; } }
      if (any) inkLetter(bake, { ...m, M: Sm, wet: .04, dry: .05 }, rgb.map(v => Math.round(v * .7)), { dpr });
    }
    if (L.medium !== 'press') laid.push(m.M);
  }
}

// ---- the hand in the geometry ------------------------------------------------------------------------------------------
// A stencil cutter's straight cut is true along its length (wander ~.04 mm) but each cut is laid at its own small angle:
// on Prismes 27 the "horizontal" steps of the clouds lean 0.3-2.2 deg, median ~0.8. cut() takes a polygon's corners and moves
// each a little so every side leans by about that much, the shape still closed.
export function cut(pts, rnd, deg = .8) {
  const n = pts.length, out = pts.map(p => p.slice());
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 1e-6) continue;
    const nx = -(q[1] - p[1]) / L, ny = (q[0] - p[0]) / L, s = Math.tan(gauss(rnd) * deg * Math.PI / 180) * L / 2;
    out[i][0] -= nx * s / 2; out[i][1] -= ny * s / 2; out[(i + 1) % n][0] += nx * s / 2; out[(i + 1) % n][1] += ny * s / 2; }
  return out;
}
export const gauss = rnd => { let s = 0; for (let i = 0; i < 4; i++) s += rnd(); return (s - 2) * 1.732; };
// an arc cut by hand round a compass mark: points from a0 to a1 (radians), its radius breathing by amp of itself, slowly
export function arc(c, r, a0, a1, rnd, amp = .0025, n = 0) {
  n ||= Math.max(8, Math.ceil(Math.abs(a1 - a0) * r / 2)); const ph = rnd() * 6.28, ph2 = rnd() * 6.28, out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, rr = r * (1 + amp * (Math.sin(a * 2.3 + ph) + .5 * Math.sin(a * 5.1 + ph2)));
    out.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]); }
  return out;
}
export function poly(P, pts, close = true) { P.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) P.lineTo(pts[i][0], pts[i][1]); if (close) P.closePath(); return P; }
// a band between two concentric hand-cut arcs (a fan's band, a rainbow's)
export function band(c, r0, r1, a0, a1, rnd, P = new Path2D()) { const o = arc(c, r1, a0, a1, rnd), i = arc(c, r0, a1, a0, rnd); return poly(P, o.concat(i)); }
