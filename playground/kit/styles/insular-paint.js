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
// the parchment as one flat colour (the page-size path: no skin fields)
export const flatParchment = G => { const Rp = new Float32Array(G.n * 3), b = lin(VELLUM); for (let q = 0; q < G.n; q++) { Rp[q * 3] = b[0]; Rp[q * 3 + 1] = b[1]; Rp[q * 3 + 2] = b[2]; } return { Rp, zp: new Float32Array(G.n), dz: new Float32Array(G.n), flat: true }; };
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

// the nearest point of a polyline (mm) for every pixel within reach: signed distance D (mm, + on the left of travel) and
// arc length S (mm). Several polylines may share D/S (the nearest wins).
// capless: an open line claims nothing beyond its two ends (pieces of one long band, laid end to end)
export function nearestLine(G, pts, closed, reach, D = new Float32Array(G.n).fill(Infinity), S = new Float32Array(G.n), s0 = 0, capless = false) {
  const { w, h, x0, y0, pxmm } = G, n = pts.length, m = closed ? n : n - 1, r2 = reach * reach;
  for (let k = 0; k < m; k++) {
    const a = pts[k], b = pts[(k + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L2 = ex * ex + ey * ey; if (L2 < 1e-12) continue; const L = Math.sqrt(L2);
    const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - reach - x0) * pxmm)), i1 = Math.min(w - 1, Math.ceil((Math.max(a[0], b[0]) + reach - x0) * pxmm));
    const j0 = Math.max(0, Math.floor((Math.min(a[1], b[1]) - reach - y0) * pxmm)), j1 = Math.min(h - 1, Math.ceil((Math.max(a[1], b[1]) + reach - y0) * pxmm));
    for (let j = j0; j <= j1; j++) { const dy = y0 + (j + .5) / pxmm - a[1];
      for (let i = i0, q = j * w + i0; i <= i1; i++, q++) { const dx = x0 + (i + .5) / pxmm - a[0]; let t = (dx * ex + dy * ey) / L2;
        if (capless && ((k === 0 && t < 0) || (k === m - 1 && t > 1))) continue; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = dx - t * ex, qy = dy - t * ey, d2 = qx * qx + qy * qy; if (d2 < r2 && d2 < D[q] * D[q]) { D[q] = (ex * dy - ey * dx >= 0 ? 1 : -1) * Math.sqrt(d2); S[q] = s0 + t * L; } } }
    s0 += L;
  }
  return { D, S, L: s0 };
}
export const polyLength = (pts, closed) => { let L = 0; const n = pts.length; for (let i = 1; i < n + (closed ? 1 : 0); i++) { const a = pts[i - 1], b = pts[i % n]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); } return L; };
// curvature (1/mm) at evenly spaced samples of a polyline, smoothed over ~win mm
function curvature(pts, closed, ds, N) {
  const n = pts.length, L = polyLength(pts, closed), K = new Float32Array(N), at = s => pointAt(pts, closed, L, s);
  for (let k = 0; k < N; k++) { const s = k * ds, a = at(s - .25), b = at(s), c = at(s + .25), h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let dh = h2 - h1; dh -= Math.round(dh / (2 * Math.PI)) * 2 * Math.PI; K[k] = Math.abs(dh) / .25; }
  return K;
}
const cumCache = new WeakMap();
function pointAt(pts, closed, L, s) {
  let C = cumCache.get(pts); const n = pts.length;
  if (!C) { C = new Float32Array(n + 1); for (let i = 1; i <= n; i++) { const a = pts[i - 1], b = pts[i % n]; C[i] = C[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]); } cumCache.set(pts, C); }
  if (closed) s = ((s % L) + L) % L; else s = Math.max(0, Math.min(C[n - 1], s));
  let lo = 0, hi = closed ? n : n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (C[m] <= s) lo = m; else hi = m; }
  const a = pts[lo], b = pts[(lo + 1) % n], f = (s - C[lo]) / ((C[lo + 1] - C[lo]) || 1); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

// ---- the parchment ------------------------------------------------------------------------------------------------------------
// Rp: reflectance (linear, 3 bands); zp: height (µm); dz: how far each point lies below the skin's mean level over ~0.6 mm
// (µm, + in hollows: where a levelled film lies thicker and soil gathers). follicle: the pits' strength (0 off).
export function parchment(G, { seed = 3, colour = VELLUM, follicle = 1 } = {}) {
  const { w, h, n } = G, zp = new Float32Array(n), Rp = new Float32Array(n * 3), base = lin(colour);
  const ck = noise2(seed), ck2 = noise2(seed + 1), sc = noise2(seed + 2), mt = noise2(seed + 3), cell = 1.4;
  for (let j = 0; j < h; j++) { const y = G.y(j); for (let i = 0; i < w; i++) { const q = j * w + i, x = G.x(i);
    let z = 18 * (ck(x / 30, y / 30) - .5) + 6 * (ck2(x / 9, y / 9) - .5) + 3 * (sc(x / 26 + y / 90, y / 2.6 - x / 40) - .5);
    let pit = 0;
    if (follicle) { const ci = Math.floor(x / cell), cj = Math.floor(y / cell);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = ci + di, b = cj + dj, k = Math.floor(hash2(a, b, seed) * 5) - 1;
        for (let t = 0; t < k; t++) { const px = (a + .2 + .6 * hash2(a, b, seed + 10 + t)) * cell, py = (b + .2 + .6 * hash2(a, b, seed + 20 + t)) * cell, r = .045 + .03 * hash2(a, b, seed + 30 + t), d = Math.hypot(x - px, y - py);
          if (d < r * 2) pit = Math.max(pit, Math.exp(-((d / r) ** 2))); } }
      pit *= follicle; }
    zp[q] = z - 6 * pit;
    const m = 1 + .02 * (mt(x / 7, y / 7) - .5) * 2;
    Rp[q * 3] = base[0] * m * (1 - .02 * pit); Rp[q * 3 + 1] = base[1] * m * (1 - .03 * pit); Rp[q * 3 + 2] = base[2] * m * (1 - .05 * pit); } }
  const zb = blur(zp, w, h, .6 * G.pxmm), dz = new Float32Array(n); for (let q = 0; q < n; q++) dz[q] = zb[q] - zp[q];
  return { zp, Rp, dz };
}
// the film levels before it sets: its top flat over the skin's fine relief, so thicker in hollows (H: a median film, µm)
export function level(tau, P, H = 22) { for (let q = 0; q < tau.length; q++) if (tau[q] > 0) tau[q] = Math.max(0, tau[q] + Math.min(1, tau[q]) * P.dz[q] / H); return tau; }

// ---- a knot's strands, as one field --------------------------------------------------------------------------------------------
// cords: [{ pts (mm, closed), f (breadth per point), g (line weight per point), ev, sFrac (event arc length / length) }]
// W: the strand's full width (mm). Returns per pixel the winning cord (over beats plain beats under at a crossing), its signed
// distance d (mm) and arc length s (mm), and the strand's half breadth there hw.
export function knotFields(G, cords, W) {
  const { n, w, pxmm } = G, id = new Int16Array(n).fill(-1), D = new Float32Array(n), S = new Float32Array(n), Z = new Int8Array(n), HW = new Float32Array(n);
  const reach = W * .75;
  cords.forEach((c, t) => {
    c.L = polyLength(c.pts, true); c.under = []; c.over = []; const xs = [];
    c.ev.forEach((e, i) => { if (e.cross) { const s = c.sFrac[i] * c.L; (e.over ? c.over : c.under).push(s); xs.push([s, e.over]); } });
    xs.sort((a, b) => a[0] - b[0]);
    // A cord crosses itself, so it is laid piece by piece, each piece holding one crossing: the pass over and the pass under
    // the same point are different pieces, and the z-buffer tells them apart.
    const np = c.pts.length;
    xs.forEach(([sx, over], k) => {
      const prev = k ? xs[k - 1][0] : xs[xs.length - 1][0] - c.L, next = k + 1 < xs.length ? xs[k + 1][0] : xs[0][0] + c.L, a = (prev + sx) / 2, b = (sx + next) / 2;
      const pts = []; for (let s = a - .08; s < b + .12; s += .04) pts.push(pointAt(c.pts, true, c.L, Math.min(s, b + .08)));
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
      const L = new Grid([x0 - reach, y0 - reach, x1 + reach, y1 + reach], pxmm); L.x0 = G.x0 + Math.floor((x0 - reach - G.x0) * pxmm) / pxmm; L.y0 = G.y0 + Math.floor((y0 - reach - G.y0) * pxmm) / pxmm;
      const oi = Math.round((L.x0 - G.x0) * pxmm), oj = Math.round((L.y0 - G.y0) * pxmm), { D: d, S: s } = nearestLine(L, pts, false, reach, undefined, undefined, a - .08, true);
      for (let j = 0; j < L.h; j++) { const gj = j + oj; if (gj < 0 || gj >= G.h) continue;
        for (let i = 0; i < L.w; i++) { const gi = i + oi; if (gi < 0 || gi >= w) continue; const lq = j * L.w + i, dd = d[lq]; if (dd === Infinity || s[lq] < a - .03 || s[lq] > b + .03) continue;
          const sv = ((s[lq] % c.L) + c.L) % c.L, kk = Math.min(np - 1, Math.floor(sv / c.L * np)), hw = W / 2 * (c.f ? c.f[kk] : 1); if (Math.abs(dd) > hw + 1.5 / pxmm) continue;
          const z = Math.abs(s[lq] - sx) < W * .6 ? (over ? 2 : 0) : 1, q = gj * w + gi;
          if (id[q] < 0 || z > Z[q] || (z === Z[q] && Math.abs(dd) - hw < Math.abs(D[q]) - HW[q])) { id[q] = t; D[q] = dd; S[q] = sv; Z[q] = z; HW[q] = hw; } } }
    });
  });
  return { id, d: D, s: S, z: Z, hw: HW };
}

// ---- the pen ------------------------------------------------------------------------------------------------------------------
// One pen stroke over [s0, s1] of a path: ink per unit length ∝ 1/speed, the speed a minimum-jerk bell (floored where the pen
// sets down and lifts) slowed in tight turns (v ∝ R^1/3). Returns dens(s) (1 mid-stroke) sampled every ds mm.
export function penStroke(K, ds, s0, s1, { floor = .16, R0 = 2.2, dwell = 1.25 } = {}) {
  const N = Math.max(2, Math.round((s1 - s0) / ds)), out = new Float32Array(N + 1);
  for (let k = 0; k <= N; k++) { const sg = k / N, bell = Math.max(floor, 16 * sg * sg * (1 - sg) * (1 - sg)), kap = K ? K(s0 + k * ds) : 0, R = kap > 1e-3 ? 1 / kap : 1e3;
    const v = bell * Math.min(1, (R / R0) ** (1 / 3)); out[k] = (1 / v) ** .35 * (sg < .03 ? dwell : 1); }
  const mid = out[Math.round(N / 2)]; for (let k = 0; k <= N; k++) out[k] /= mid;
  return out;
}
// Lines of ink along each side of every strand: strokes between the crossings where the strand goes under (the pen stops at
// the other strand's line, pooling a little there), the line's weight from the nib (c.g) and the pooling, its centre a hair
// off the strand's edge, the ink running down between dips. Returns tau (ink, 1 = a solid stroke's density).
export function knotLines(G, F, cords, W, { lw = .085, seed = 1, od = .8, wander = .22 } = {}) {
  const ds = .02, lines = cords.map((c, t) => [-1, 1].map(side => {
    const N = Math.ceil(c.L / ds), dens = new Float32Array(N + 1), K = curvature(c.pts, true, ds, N + 1), Kf = s => K[Math.min(N, Math.max(0, Math.round(((s % c.L) + c.L) % c.L / ds)))];
    const us = c.under.slice().sort((a, b) => a - b), cuts = us.length ? us : [0], e = W * .5;
    cuts.forEach((u, k) => { const a = u + e * .85, b = (k + 1 < cuts.length ? cuts[k + 1] : cuts[0] + c.L) - e * .85; if (b <= a) return;
      const p = penStroke(Kf, ds, a, b), dip = 1 - .22 * (((k + t * 3 + (side > 0 ? 2 : 0)) % 5) / 4);
      for (let i = 0; i < p.length; i++) { const sIdx = Math.round((((a + i * ds) % c.L) + c.L) % c.L / ds); dens[Math.min(N, sIdx)] = p[i] * dip; } });
    return { dens, drift: n1(seed * 97 + t * 7 + (side > 0 ? 3 : 0), 2.5), weight: n1(seed * 89 + t * 5 + (side > 0 ? 7 : 0), .42) };
  }));
  const tau = new Float32Array(G.n), e = Math.max(.6 / G.pxmm, .012);
  for (let q = 0; q < G.n; q++) { const t = F.id[q]; if (t < 0) continue; const c = cords[t], side = F.d[q] >= 0 ? 1 : 0, L = lines[t][side], s = F.s[q];
    const k = Math.min(c.pts.length - 1, Math.floor(s / c.L * c.pts.length)), dn = L.dens[Math.min(L.dens.length - 1, Math.round(s / ds))];
    if (!dn) continue;
    const w = lw * (c.g ? c.g[k] : 1) * (.7 + .3 * Math.min(2, dn)) * (1 + wander * L.weight(s)), ctr = F.hw[q] - w / 2 + .012 * L.drift(s), a = Math.abs(F.d[q]);
    const cov = clamp01((w / 2 - Math.abs(a - ctr)) / e + .5); if (cov > 0) tau[q] = cov * od * Math.min(1.5, .8 + .2 * dn); }
  return tau;
}
// a ruled pen line (a frame's rule): one stroke per side of a polygon, the pen pooling at each corner where it stopped
export function ruled(G, pts, { lw = .07, od = .9, seed = 1, tau = new Float32Array(G.n) } = {}) {
  for (let k = 0; k < pts.length; k++) penLine(G, [pts[k], pts[(k + 1) % pts.length]], { lw, od, seed: seed * 31 + k, tau, floor: .25 });
  return tau;
}
// one pen stroke along a polyline (a curve or a rule): ink pooled where it set down, turned and lifted; the hand wavering
// slowly off the drawn path (wob mm over ~6 mm)
// The hand, measured on f. 139r's keys and rules (paintv2/measure.py): the line's weight varies by cv ≈ .27 over ~.9 mm
// (pressure and the nib's angle as the hand moves; pooling at turns and set-downs on top), its centre wanders ~.026 mm sd
// over ~.9 mm (wob); slower bows belong to the construction, not the pen.
export function penLine(G, pts, { lw = .07, od = .9, seed = 1, tau = new Float32Array(G.n), floor = .16, wob = .03, wander = .25, soft = .012 } = {}) {
  const e = Math.max(.6 / G.pxmm, soft), { D, S, L } = nearestLine(G, pts, false, lw * 3), ds = .02, N = Math.ceil(L / ds);
  const K = pts.length > 2 ? curvature(pts, false, ds, N + 1) : null, p = penStroke(K ? s => K[Math.min(N, Math.max(0, Math.round(s / ds)))] : null, ds, 0, L, { floor }), wv = n1(seed, .45), ww = n1(seed + 77, .42);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const i0 = Math.max(0, Math.floor((x0 - lw * 3 - G.x0) * G.pxmm)), i1 = Math.min(G.w - 1, Math.ceil((x1 + lw * 3 - G.x0) * G.pxmm)), j0 = Math.max(0, Math.floor((y0 - lw * 3 - G.y0) * G.pxmm)), j1 = Math.min(G.h - 1, Math.ceil((y1 + lw * 3 - G.y0) * G.pxmm));
  for (let j = j0; j <= j1; j++) for (let q = j * G.w + i0, qe = j * G.w + i1; q <= qe; q++) { if (D[q] === Infinity) continue; const dn = p[Math.min(p.length - 1, Math.round(S[q] / ds))], w = lw * (.75 + .25 * dn) * (1 + wander * ww(S[q])), c = wob * wv(S[q]);
    const cov = clamp01((w / 2 - Math.abs(D[q] - c)) / e + .5); if (cov > 0) tau[q] = Math.max(tau[q], cov * od * Math.min(1.4, .85 + .15 * dn)); }
  return tau;
}
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
// a region's coverage (0..1, anti-aliased) from a Path2D in mm
export function mask(G, path, rule = 'nonzero') {
  const c = new OffscreenCanvas(G.w, G.h), g = c.getContext('2d', { willReadFrequently: true }); g.setTransform(G.pxmm, 0, 0, G.pxmm, -G.x0 * G.pxmm, -G.y0 * G.pxmm); g.fill(path, rule);
  const d = g.getImageData(0, 0, G.w, G.h).data, M = new Float32Array(G.n); for (let q = 0; q < G.n; q++) M[q] = d[q * 4 + 3] / 255; return M;
}
// Dots, each one touch of a loaded brush: a small dome of paint (thick: t0), a little long in the direction the hand moved;
// fuller just after the brush was charged, leaner as it empties (a reload every `load` touches). D: [[x, y, r, angle]] mm.
export function dots(G, D, { t0 = 1.6, load = 11, seed = 1, tau = new Float32Array(G.n) } = {}) {
  const { w, h, pxmm } = G, e = Math.max(.6 / pxmm, .02);
  D.forEach(([cx, cy, r0, ang = 0], k) => { ang += (hash2(k, seed, 13) - .5) * 1.2;
    const ld = 1 - ((k % load) / load), r = r0 * (.82 + .26 * ld) * (.92 + .16 * hash2(k, seed, 4)), el = 1.06 + .1 * hash2(k, seed, 6), ca = Math.cos(ang), sa = Math.sin(ang), t = t0 * (.75 + .35 * ld) * (.9 + .2 * hash2(k, seed, 3));
    cx += .07 * (hash2(k, seed, 11) - .5) * 2; cy += .07 * (hash2(k, seed, 12) - .5) * 2;   // the hand's aim, per touch
    const i0 = Math.max(0, Math.floor((cx - r * 1.6 - G.x0) * pxmm)), i1 = Math.min(w - 1, Math.ceil((cx + r * 1.6 - G.x0) * pxmm)), j0 = Math.max(0, Math.floor((cy - r * 1.6 - G.y0) * pxmm)), j1 = Math.min(h - 1, Math.ceil((cy + r * 1.6 - G.y0) * pxmm));
    const lobe = hash2(k, seed, 7) * 6.283, lk = .06 * hash2(k, seed, 9);   // where the brush lifted: a slight lobe
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = G.x(i) - cx, dy = G.y(j) - cy, u = (dx * ca + dy * sa) / el, v = -dx * sa + dy * ca, a = Math.atan2(v, u);
      const rr = Math.hypot(u, v) / (r * (1 + lk * Math.cos(a - lobe))), cov = clamp01((1 - rr) * r / e + .5), q = j * w + i;
      // the drop's water carried the finest pigment a little past the body of the dot: a thin pale fringe, not a rim
      if (rr < 1.4) tau[q] += .06 * t * smooth(1.4, 1, rr) * (1 - cov);
      if (cov > 0) tau[q] += cov * t * Math.max(.35, 1 - rr * rr) ** .4; } });
  return tau;
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
// the tint of a knot: inside each strand, short of its pen line; one stroke per stretch between under-crossings (the ends hidden
// under the crossing strands), two overlapping loads on a long stretch; the brush's edge wandering along each side
// reserve: { m, line } — the measured hand: the band of vellum between the pen line (line mm wide) and the tint is
//   r(s) = max(0, m (.6 + 1.4 u(s))) along each side (f. 139r keys: .3 mm where present, absent ~27 % of the way);
// scuff: { amp, centre, R } — the strand's raised middle rubbed thin, broken along its length, more where the strand rides
//   over a crossing (raised) and on the outer loops (handled, rubbed against the facing page): the cause is rubbing.
export function knotTint(G, F, cords, W, { frac = .5, seed = 1, soft = .05, reserve = null, scuff = null } = {}) {
  const tau = new Float32Array(G.n), mix = new Float32Array(G.n), plans = cords.map((c, t) => {
    const us = c.under.slice().sort((a, b) => a - b), cuts = us.length ? us : [0], loads = [];
    cuts.forEach((u, k) => { const a = u, b = k + 1 < cuts.length ? cuts[k + 1] : cuts[0] + c.L, len = b - a, m = len > 5.5 ? 2 : 1;
      for (let j = 0; j < m; j++) { const ov = m > 1 ? .14 * len : 0, l0 = a + j * len / m - (j ? ov : 0), l1 = a + (j + 1) * len / m + (j < m - 1 ? ov : 0);
        loads.push({ a: l0, b: l1, ...makeLoad(seed + t * 101, k * 3 + j) }); } });
    const e1 = [n1(seed * 7 + t, 1.2), n1(seed * 7 + t + 50, 1.2)], e2 = [n1(seed * 11 + t, .4), n1(seed * 11 + t + 50, .4)];
    return { loads, edge: [s => .8 * e1[0](s) + .3 * e2[0](s), s => .8 * e1[1](s) + .3 * e2[1](s)], res: [n1(seed * 13 + t, .6), n1(seed * 13 + t + 50, .6)], gone: [n1(seed * 23 + t, 1.8), n1(seed * 23 + t + 50, 1.8)], sc: n1(seed * 17 + t, 1.1), sc2: n1(seed * 19 + t, 3) };
  });
  for (let q = 0; q < G.n; q++) { const t = F.id[q]; if (t < 0) continue; const c = cords[t], P = plans[t], s = F.s[q], v = F.d[q], side = v >= 0 ? 1 : 0;
    const hwt = reserve ? Math.max(0, F.hw[q] - reserve.line - reserve.m * (1 + .45 * P.res[side](s)) * smooth(-.75, -.45, P.gone[side](s))) : F.hw[q] * (frac + (1 - frac) * .38 * P.edge[side](s)), a = Math.abs(v); if (a > hwt + soft) continue;
    const cov = smooth(-soft, soft * .5, hwt - a); let sum = 0, mx = 0, wt = 0;
    for (const L of P.loads) { let x = s; if (x < L.a) x += c.L; if (x > L.b) continue; const sg = (x - L.a) / (L.b - L.a);
      const ends = smooth(0, .12, x - L.a) * smooth(0, .12, L.b - x); sum += ends * loadTau(sg, x, v, hwt, L); mx += ends * L.mix; wt += ends; }
    if (scuff) { const x = G.x(q % G.w) - scuff.centre[0], y = G.y(Math.floor(q / G.w)) - scuff.centre[1], out = smooth(.35, 1, Math.hypot(x / scuff.R[0], y / scuff.R[1]));
      const along = smooth(.05, .45, .55 * P.sc(s) + .45 * P.sc2(s)), raised = F.z[q] === 2 ? 1 : .45;
      sum *= 1 - scuff.amp * along * raised * (.35 + .65 * out) * Math.exp(-((a / (.3 * F.hw[q])) ** 2)); }
    tau[q] = cov * sum; mix[q] = wt ? mx / wt : 0; }
  tau.mix = mix; return tau;
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
export function compose(G, P, layers) {
  const { n } = G, out = new Float32Array(n * 3), pre = layers.map(({ pig }) => pig.OD ? { od: pig.OD } : { ab: pig.KS.map(ks => { const a = 1 + ks; return [a, Math.sqrt(a * a - 1)]; }), X: pig.X });
  for (let q = 0; q < n; q++) for (let k = 0; k < 3; k++) {
    let R = inside(P.Rp[q * 3 + k]);
    for (let l = 0; l < layers.length; l++) { const t = layers[l].tau[q]; if (!(t > 0)) continue; const p = pre[l];
      if (p.od) { R *= Math.exp(-2 * p.od[k] * t); continue; }
      const [a, b] = p.ab[k], x = b * p.X * t, e = Math.exp(x), ei = 1 / e, sh = (e - ei) / 2, ch = (e + ei) / 2, c = a * sh + b * ch, Rl = sh / c, Tl = b / c;
      R = Rl + Tl * Tl * R / (1 - Rl * R); }
    out[q * 3 + k] = surface(R); }
  return out;
}
export function toImage(G, out) { const im = new ImageData(G.w, G.h), d = im.data; for (let q = 0; q < G.n; q++) { d[q * 4] = srgb(out[q * 3]); d[q * 4 + 1] = srgb(out[q * 3 + 1]); d[q * 4 + 2] = srgb(out[q * 3 + 2]); d[q * 4 + 3] = 255; } return im; }
