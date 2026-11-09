// Paint as a physical film, for the paint bench (tests/insular-paint.html); research/21-paint.md.
//
// Everything is a field in millimetres on one grid (Grid: a box in mm, px per mm), and every variation has a cause:
//   parchment(): the skin's reflectance and relief (cockle, the scraper's streaks, follicle pits in small groups);
//   knotFields(): each cord's footprint, z-buffered at its crossings (over wins), as a signed distance and arc length,
//     so the strand's pen lines, reserved vellum and tint are bands of one continuous field (no segment seams);
//   penLines(): the pen drawn over time: a minimum-jerk speed along each stroke, slower in tight turns (the 2/3 power
//     law), ink laid per unit time, so it pools where the pen set down, turned and lifted; the ink running down between
//     dips;
//   loads: a fill is a few brush loads following the stroke (or a compartment's axis), each depleting as it goes, the
//     overlaps adding (seams), a pale drag now and then; thickness is relative to the master's median film (tau = 1);
//   level(): the wet film levels before it sets, so it lies thicker in the skin's hollows and thinner on its crests;
//   compose(): two-constant Kubelka–Munk per band, bottom up over the parchment; inks and the carbon ground as absorbing
//     layers (S = 0); the surface by Saunderson.
// Pigment constants fitted on f. 139r (scratchpad paintv2/fit.py): per band K/S, and X = S·d of the median film.
import { noise1, noise2, hash2 } from '../marks.js';

export const VELLUM = [241, 232, 213];
// Fitted on Lindisfarne f. 139r (BL photograph, 12.25 px/mm), white-balanced on the vellum beside the dots (201 189 152 ->
// 241 232 213). KS: K/S per band (R, G, B); X: S·d of the median film. The fit's error is flat up to X ≈ 0.3–0.6 and doubles
// by X = 2: the master's films are translucent, the vellum showing through everywhere. OD: absorbing layers, per band.
export const PIG = {
  knot:     { KS: [2.29, 2.16, 1.49], X: .3 },   // the knots' blue-grey (indigo with much chalk), f. 139r bowl
  blue:     { KS: [4.04, 3.04, 1.57], X: .3 },   // indigo with a little chalk (the O's keys)
  indigo:   { KS: [7.91, 8.0, 4.19], X: .3 },    // the roundels' deep indigo
  redlead:  { KS: [.5, 1.42, 2.52], X: .6 },     // the O's keys
  orpiment: { KS: [.29, .63, 1.68], X: .6 },     // the O's ring
  vergaut:  { KS: [.43, .25, .44], X: .6 },      // the Q's counter
  ink:      { OD: [1.74, 2.57, 2.39] },          // carbon ink, solid letter stroke
  dark:     { OD: [2.63, 4.1, 4.09] },           // the black ring
  grime:    { OD: [.6, .75, 1] },                // soil: warm grey-brown
};

export const lin = c => c.map(v => (v / 255) ** 2.2);
// an absorbing layer that shows colour c (as seen) over our vellum at tau = 1
export const absorbing = c => ({ OD: lin(c).map((v, k) => -Math.log(inside(v) / inside(lin(VELLUM)[k])) / 2) });
// a translucent pigment that shows colour c (as seen) over our vellum at tau = 1 with S·d = X: K/S per band by bisection
export function fromColour(c, X = .6) {
  const t = lin(c), Rg = lin(VELLUM).map(inside);
  const KS = t.map((v, k) => { let lo = 1e-4, hi = 400;
    for (let i = 0; i < 60; i++) { const m = Math.sqrt(lo * hi), a = 1 + m, b = Math.sqrt(a * a - 1), x = b * X, sh = Math.sinh(x), ch = Math.cosh(x), cc = a * sh + b * ch, Rl = sh / cc, Tl = b / cc;
      const R = surface(Rl + Tl * Tl * Rg[k] / (1 - Rl * Rg[k])); if (R > v) lo = m; else hi = m; } return Math.sqrt(lo * hi); });
  return { KS, X };
}
const srgb = v => Math.round(255 * Math.max(0, Math.min(1, v)) ** (1 / 2.2));
const K1 = .04, K2 = .5;
const inside = R => R / ((1 - K1) * (1 - K2) + K2 * R), surface = R => (1 - K1) * (1 - K2) * R / (1 - K2 * R);
PIG.groundRB = absorbing([80, 38, 21]);   // the knot band's ground on f. 139r: dark red-brown (median of its pixels)
PIG.pen = absorbing([74, 48, 34]);        // the pen line: brown, as the master's fine lines read (not the solid letter's black)
PIG.orpOlive = fromColour([196, 170, 96]); // orpiment as the O's ring reads in places: olive-gold
PIG.orpGold = fromColour([210, 174, 122]); // and where it lies thin and scrubbed
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const n1 = (seed, scale) => { const f = noise1(seed); return x => (f(x / scale) - .5) * 2; };   // -1..1, one scale

export class Grid {
  constructor([x0, y0, x1, y1], pxmm) { Object.assign(this, { x0, y0, pxmm, w: Math.ceil((x1 - x0) * pxmm), h: Math.ceil((y1 - y0) * pxmm) }); this.n = this.w * this.h; }
  x(i) { return this.x0 + (i + .5) / this.pxmm; } y(j) { return this.y0 + (j + .5) / this.pxmm; }
}

// ---- small field tools ------------------------------------------------------------------------------------------------------
function box(A, w, h, r) {
  const T = new Float32Array(w * h), O = new Float32Array(w * h), k = 2 * r + 1;
  for (let y = 0; y < h; y++) { const o = y * w; let s = 0; for (let x = -r; x <= r; x++) s += A[o + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { T[o + x] = s / k; s += A[o + Math.min(w - 1, x + r + 1)] - A[o + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += T[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { O[y * w + x] = s / k; s += T[Math.min(h - 1, y + r + 1) * w + x] - T[Math.max(0, y - r) * w + x]; } }
  return O;
}
export const blur = (A, w, h, sigmaPx) => { const r = Math.round(sigmaPx * .9); return r < 1 ? A.slice() : box(box(box(A, w, h, r), w, h, r), w, h, r); };

// distance (mm) from each inside pixel to the region's edge (M < .5 outside): a two-pass chamfer transform
export function insideDist(G, M) {
  const { w, h, n } = G, D = new Float32Array(n), a = 1, b = Math.SQRT2, BIG = 1e6;
  for (let q = 0; q < n; q++) D[q] = M[q] >= .5 ? BIG : 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i; if (!D[q]) continue; let v = D[q];
    if (i > 0) v = Math.min(v, D[q - 1] + a); else v = Math.min(v, a); if (j > 0) { v = Math.min(v, D[q - w] + a); if (i > 0) v = Math.min(v, D[q - w - 1] + b); if (i < w - 1) v = Math.min(v, D[q - w + 1] + b); } else v = Math.min(v, a); D[q] = v; }
  for (let j = h - 1; j >= 0; j--) for (let i = w - 1; i >= 0; i--) { const q = j * w + i; if (!D[q]) continue; let v = D[q];
    if (i < w - 1) v = Math.min(v, D[q + 1] + a); if (j < h - 1) { v = Math.min(v, D[q + w] + a); if (i < w - 1) v = Math.min(v, D[q + w + 1] + b); if (i > 0) v = Math.min(v, D[q + w - 1] + b); } D[q] = v; }
  for (let q = 0; q < n; q++) D[q] = D[q] ? (D[q] - .5) / G.pxmm : 0;
  return D;
}
// ---- brush loads --------------------------------------------------------------------------------------------------------------
// A load along a stroke: sigma 0..1 along it; t0 its charge, depleting as it goes; the pressure varying slowly along it;
// optionally a pale drag (the brush laying less in a line) in its second half.
export function loadTau(sigma, s, v, hwv, L) {   // L: { t0, dep, pres(s), drag: { at, w, k } | null }
  sigma = clamp01(sigma);
  // the hairs: groups of bristles carrying more or less across the stroke, a streak that runs the load's length (constant
  // along it, fading as the brush empties)
  let t = L.t0 * (1 - L.dep * sigma ** 1.5) * (1 + .08 * L.pres(s)) * (1 + (L.hairs ? L.hairsAmp * (1 - .5 * sigma) * L.hairs(v) : 0)) * (1 + .06 * (1 - Math.min(1, (v / hwv) ** 2)));
  if (L.drag) t *= 1 - L.drag.k * smooth(.3, .6, sigma) * Math.exp(-(((v - L.drag.at * hwv - .25 * hwv * L.drag.wander(s)) / L.drag.w) ** 2));
  return t;
}
export function makeLoad(seed, k, { dragP = .15 } = {}) {
  const r = (i) => hash2(seed, k, i * 977 + 13);
  return { t0: .92 + .2 * r(1), dep: .1 + .14 * r(2), pres: n1(seed * 13 + k, 1.6), mix: r(8), hairs: n1(seed * 29 + k, .09), hairsAmp: .05 + .05 * r(9),
    drag: r(3) < dragP ? { at: (r(4) < .5 ? -1 : 1) * (.25 + .35 * r(7)), w: .08 + .08 * r(5), k: .1 + .12 * r(6), wander: n1(seed * 17 + k, 2) } : null };
}
// Fill a region (mask 0..1) by loads: each connected pocket a touch of the brush (charged where it was set down, running
// thinner as it was drawn across); a wide pocket in overlapping swaths along its long axis (seams where they overlap).
// uv(x, y) -> [u, v] mm: the stroke's own frame (along a curved band), in place of the pocket's straight axis
// seg: split each swath into loads ~seg mm long (15 % overlap); where a load stopped, it pooled (pool: extra thickness over .5 mm)
export function fillLoads(G, M, { seed = 1, swath = 1.3, thr = .5, axis = null, dragP = null, scale = 1, uv = null, seg = 0, pool = .3 } = {}) {
  const { w, h, n, pxmm } = G, lab = new Int32Array(n).fill(-1), tau = new Float32Array(n), mix = new Float32Array(n), stack = []; let L = 0;
  for (let q0 = 0; q0 < n; q0++) { if (M[q0] < thr || lab[q0] >= 0) continue; const px = []; stack.push(q0); lab[q0] = L;
    while (stack.length) { const q = stack.pop(); px.push(q); const i = q % w, j = (q - i) / w;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= w || jj >= h) continue; const r = jj * w + ii; if (lab[r] < 0 && M[r] >= thr) { lab[r] = L; stack.push(r); } } }
    // the pocket's axis (moments), extents along and across it
    let mx = 0, my = 0; for (const q of px) { mx += q % w; my += Math.floor(q / w); } mx /= px.length; my /= px.length;
    let a = 0, b = 0, c = 0; for (const q of px) { const dx = q % w - mx, dy = Math.floor(q / w) - my; a += dx * dx; b += dx * dy; c += dy * dy; }
    const th = axis ?? .5 * Math.atan2(2 * b, a - c), ux = Math.cos(th), uy = Math.sin(th);
    const UV = q => { if (uv) return uv(G.x(q % w), G.y(Math.floor(q / w))); const dx = (q % w - mx) / pxmm, dy = (Math.floor(q / w) - my) / pxmm; return [dx * ux + dy * uy, -dx * uy + dy * ux]; };
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const q of px) { const [u, v] = UV(q); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const across = v1 - v0, ns = Math.max(1, Math.round(across / swath)), sw = across / ns, flip = hash2(L, seed, 5) < .5;
    const loads = Array.from({ length: ns }, (_, k) => ({ ...makeLoad(seed * 31 + L, k, { dragP: dragP ?? (ns > 1 ? .3 : .1) }), c: v0 + (k + .5) * sw, flip: (k % 2 === 0) === flip, path: n1(seed * 41 + L * 7 + k, 3.5), bow: [] }));
    for (const q of px) { const [u, v] = UV(q); let sum = 0, wt = 0, mx = 0;
      for (const ld of loads) { const hv = Math.max(.01, sw * .5 * (ns > 1 ? 1.6 : 3)), dv = v - ld.c - (ns > 1 ? .15 * sw * ld.path(u) : 0); if (Math.abs(dv) > hv) continue;
        const edge = ns > 1 ? smooth(hv, hv * .55, Math.abs(dv)) : 1;
        if (!seg) { const sg = ld.flip ? (u1 - u) / ((u1 - u0) || 1) : (u - u0) / ((u1 - u0) || 1); sum += edge * loadTau(sg, u, dv, hv, ld); wt += edge; mx += edge * ld.mix; continue; }
        const nseg = Math.max(1, Math.round((u1 - u0) / seg)), Ls = (u1 - u0) / nseg, ov = .15 * Ls;
        const bowU = j => (ld.flip ? -1 : 1) * (.45 * (dv / hv) ** 2 + .3 * (ld.bow[j] ??= n1(seed * 3 + L * 7 + j, .5))(dv));   // the stop: bowed back toward where the brush came from
        for (let j = 0; j < nseg; j++) { const a = u0 + j * Ls - (j ? ov : 0) + (j ? bowU(j - 1) : 0), b = u0 + (j + 1) * Ls + (j < nseg - 1 ? ov + bowU(j) : 0); if (u < a || u > b) continue;
          const sl = { ...ld, t0: ld.t0 * (.9 + .2 * hash2(L * 31 + j, seed, 21 + ld.c * 7 | 0)) }, sg = ld.flip ? (b - u) / (b - a) : (u - a) / (b - a), stop = ld.flip ? u - a : b - u;
          const ends = smooth(0, .25, u - a) * smooth(0, .25, b - u), wgt = edge * (j && u < a + 2 * ov ? smooth(a, a + 2 * ov, u) : 1);
          sum += wgt * loadTau(sg, u, dv, hv, sl) * (1 + pool * smooth(.6, .1, stop)) * Math.max(.4, ends); wt += wgt; mx += wgt * hash2(L * 31 + j, seed, 77); } }
      // where two loads overlap the later lies over the earlier: a seam a little heavier, not a doubled coat
      mix[q] = wt > 0 ? mx / wt : 0;
      tau[q] = wt > 0 ? scale * sum / wt * Math.min(1, wt) * (1 + .2 * Math.min(1, Math.max(0, wt - 1))) * M[q] : 0; }
    L++; }
  return { tau, mix, labels: lab, count: L };
}

// ---- optics -------------------------------------------------------------------------------------------------------------------
// layers bottom first: [{ pig: PIG.x, tau: Float32Array }]; returns linear reflectance (3 per pixel) as seen
// active (optional): a coverage — the pixels where it is 0 are not composed (a frame's empty middle)
export function compose(G, P, layers, active = null) {
  const { n } = G, out = new Float32Array(n * 3), L = layers.length, pre = layers.map(({ pig }) => pig.OD ? { od: pig.OD, one: pig.OD.map(o => Math.exp(-2 * o)) } : { ab: pig.KS.map(ks => { const a = 1 + ks; return [a, Math.sqrt(a * a - 1)]; }), X: pig.X });
  const on = new Int32Array(L);
  for (let q = 0; q < n; q++) { if (active && !(active[q] > 0)) continue;
    let m = 0; for (let l = 0; l < L; l++) if (layers[l].tau[q] > 0) on[m++] = l;
    for (let k = 0; k < 3; k++) {
      let R = inside(P.Rp[q * 3 + k]);
      for (let z = 0; z < m; z++) { const l = on[z], t = layers[l].tau[q], p = pre[l];
        if (p.od) { R *= t === 1 ? p.one[k] : Math.exp(-2 * p.od[k] * t); continue; }
        const [a, b] = p.ab[k], x = b * p.X * t, e = Math.exp(x), ei = 1 / e, sh = (e - ei) / 2, ch = (e + ei) / 2, c = a * sh + b * ch, Rl = sh / c, Tl = b / c;
        R = Rl + Tl * Tl * R / (1 - Rl * R); }
      out[q * 3 + k] = surface(R); } }
  return out;
}