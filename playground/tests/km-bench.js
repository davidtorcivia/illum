// The paint bench's subjects (tests/insular-paint.html): geometry in mm, and each one's paint layers through km-paint.js.
// Measured hand from f. 139r's blue knots (W the strand's width): pen line ~.06 W; a band of vellum; tint ~.5–.6 W; breadth
// ±20 % along a cord; the centre wandering ~.1 W per cell; the line heavier in turns.
import { plait, cords, measure } from '../kit/styles/insular-knot.js';
import { noise2 } from '../kit/marks.js';
import * as KM from './km-paint.js';
import * as SM from './km-smoke.js';

export const MM = .15;   // mm per css px at the page's size
export const rect = ([x0, y0, x1, y1]) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

export function knotGeometry(seed = 1) {
  const A = 6, B = 3, u = 9, ox = 10, oy = 10, PW = ox * 2 + 2 * A * u, PH = oy * 2 + 2 * B * u;
  const K = plait(A, B, () => true, (x, y) => y === 3 && (x === 3 || x === 9));
  const C = measure(cords(K, { ox, oy, u, inset: .32, round: 1.05 }), u), W = u * 1.02;
  const nx = noise2(11 * seed), ny = noise2(29 * seed), wx = noise2(41 * seed), wy = noise2(57 * seed), lam = u * 3.2, amp = u * .06, aw = W * .1;
  const out = C.map((c, t) => { const fb = noise2(100 + t + seed * 7), gb = noise2(200 + t + seed * 7);
    const pts = c.pts.map(([x, y]) => [(x + amp * (nx(x / lam, y / lam) - .5) * 2 + aw * (wx(x / u, y / u) - .5) * 2) * MM, (y + amp * (ny(x / lam, y / lam) - .5) * 2 + aw * (wy(x / u, y / u) - .5) * 2) * MM]);
    const n = pts.length, f = new Float32Array(n), g = new Float32Array(n);
    for (let k = 0; k < n; k++) { const s = k / n * c.L, a = pts[(k - 3 + n) % n], b = pts[k], d = pts[(k + 3) % n], h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(d[1] - b[1], d[0] - b[0]);
      let dh = h2 - h1; dh -= Math.round(dh / (2 * Math.PI)) * 2 * Math.PI; const turn = Math.min(1, Math.abs(dh) / (Math.hypot(d[0] - a[0], d[1] - a[1]) || 1) * u * MM * .9);
      f[k] = 1 + .2 * (fb(s / (u * 1.3), t * 3.1) - .5) * 2; g[k] = .7 + .9 * turn + .35 * (gb(s / (u * .8), t) - .5); }
    return { pts, f, g, ev: c.ev, sFrac: c.s.map(v => v / c.L) }; });
  return { cords: out, W: W * MM, box: [0, 0, PW * MM, PH * MM], frame: [3.4 * MM, 3.4 * MM, (PW - 3.4) * MM, (PH - 3.4) * MM] };
}

// the knot's layers, bottom first: the pen (drawn first), the dark ground, the blue-grey tint
export function knotLayers(G, geo, { seed = 1, tint = .66 } = {}) {
  const P = KM.parchment(G, { seed: 3 }), F = KM.knotFields(G, geo.cords, geo.W);
  const ink = KM.knotLines(G, F, geo.cords, geo.W, { seed }); KM.ruled(G, rect(geo.frame), { tau: ink, seed });
  const [fx0, fy0, fx1, fy1] = geo.frame, M = new Float32Array(G.n);
  for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) { const q = j * G.w + i, x = G.x(i), y = G.y(j); if (x < fx0 + .03 || x > fx1 - .03 || y < fy0 + .03 || y > fy1 - .03) continue;
    M[q] = F.id[q] < 0 ? 1 : Math.max(0, Math.min(1, (Math.abs(F.d[q]) - F.hw[q]) * G.pxmm + .5)); }
  const ground = KM.level(KM.fillLoads(G, M, { seed: seed + 4, swath: 1.4, axis: 0, dragP: 0, scale: 2.2 }).tau, P);
  const tn = KM.level(KM.knotTint(G, F, geo.cords, geo.W, { seed: seed + 9, frac: tint }), P);
  return { P, F, layers: [{ pig: KM.PIG.ink, tau: ink, kind: 'ink' }, { pig: KM.PIG.dark, tau: ground, kind: 'dark' }, { pig: KM.PIG.knot, tau: tn, kind: 'knot' }] };
}

// the control on the same knot: flat palette colours over the same fields, a strand's slow swell, the tint off register,
// losses where a stroke ended at a strand's edge
export function knotSmoke(G, geo, { seed = 1, tint = .66 } = {}) {
  const F = KM.knotFields(G, geo.cords, geo.W), { n } = G, line = new Float32Array(n), band = new Float32Array(n), tn = new Float32Array(n), gr = new Float32Array(n);
  const sw = geo.cords.map((_, t) => SM.swell1(seed * 5 + t)), ed = geo.cords.map((_, t) => [SM.swell1(seed * 9 + t, 1.2), SM.swell1(seed * 9 + t + 40, 1.2)]), lw = .085, e = 1 / G.pxmm;
  const [fx0, fy0, fx1, fy1] = geo.frame, sx = new Float32Array(n);
  for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) { const q = j * G.w + i, x = G.x(i), y = G.y(j), inF = x > fx0 && x < fx1 && y > fy0 && y < fy1;
    const fr = Math.min(Math.abs(x - fx0), Math.abs(x - fx1), Math.abs(y - fy0), Math.abs(y - fy1)); line[q] = Math.max(0, Math.min(1, (lw * .45 - fr) / e + .5));
    if (F.id[q] < 0) { if (inF) gr[q] = 1; continue; }
    const a = Math.abs(F.d[q]), hw = F.hw[q], t = F.id[q], cov = Math.max(0, Math.min(1, (hw - a) / e + .5)); gr[q] = inF ? 1 - cov : 0;
    band[q] = cov; line[q] = Math.max(line[q], cov * Math.max(0, Math.min(1, (lw - (hw - a)) / e + .5)));
    const ht = hw * (tint + (1 - tint) * .3 * ed[t][F.d[q] >= 0 ? 1 : 0](F.s[q])); tn[q] = Math.max(0, Math.min(1, (ht - a) / e + .5)); sx[q] = sw[t](F.s[q]); }
  const losses = []; geo.cords.forEach((c, t) => c.under.slice(0, 2).forEach((u, k) => { const p = c.pts[Math.floor(((u + geo.W * .75) % c.L) / c.L * c.pts.length)]; if ((t + k) % 2 === 0) losses.push([p[0], p[1] - geo.W * .2, .09]); }));
  const swell = (x, y) => sx[Math.min(n - 1, Math.floor((y - G.y0) * G.pxmm) * G.w + Math.floor((x - G.x0) * G.pxmm))];
  return SM.flat(G, [{ cov: gr, col: SM.FLAT.dark, hole: false }, { cov: band, col: SM.FLAT.reserve, hole: false }, { cov: tn, col: SM.FLAT.knot, swell, shift: [.03, .02] }, { cov: line, col: SM.FLAT.ink, hole: false }], { losses, seed });
}

// ---- dots: two columns of a dot field between ruled lines (f. 139r: dot .7 mm, nearest pitch 1.3 mm, a lozenge lattice),
// placed row by row by a hand that drifts along each row; red lead, thick (the BL saw crackle on them) -----------------------
export function dotsGeometry(seed = 1) {
  const box = [0, 0, 30, 20], cols = [[2.2, 13.6], [16.4, 27.8]], D = [], rules = [], drift = noise2(seed * 3 + 1);
  cols.forEach(([x0, x1], c) => { rules.push([[x0 - .55, 1], [x0 - .5 + .15 * c, 19]], [[x1 + .55, 1], [x1 + .6 - .1 * c, 19]]);
    const py = 1.08 * Math.sqrt(3) / 2, px = 1.08; let row = 0;
    for (let y = 1.6; y < 18.6; y += py, row++) { const off = row % 2 ? px / 2 : 0;
      for (let x = x0 + .45 + off; x < x1 - .4; x += px) { const dx = .12 * (drift(x / 4, y / 4) - .5) * 2, dy = .1 * (drift(x / 4 + 9, y / 4) - .5) * 2; D.push([x + dx, y + dy, .36, 0]); } } });
  return { box, D, rules };
}
export function dotsLayers(G, geo, { seed = 1 } = {}) {
  const P = KM.parchment(G, { seed: 4 }), ink = new Float32Array(G.n); geo.rules.forEach((r, k) => KM.penLine(G, r, { lw: .09, od: .75, seed: seed + k, tau: ink, floor: .3 }));
  const red = KM.level(KM.dots(G, geo.D, { t0: 1.5, seed }), P);
  return { P, layers: [{ pig: KM.PIG.ink, tau: ink, kind: 'ink' }, { pig: KM.PIG.redlead, tau: red, kind: 'redlead' }] };
}
export function dotsSmoke(G, geo, { seed = 1 } = {}) {
  const dots = new Float32Array(G.n), line = new Float32Array(G.n), e = 1 / G.pxmm;
  for (const [cx, cy, r] of geo.D) for (let j = Math.max(0, Math.floor((cy - r - .1 - G.y0) * G.pxmm)); j < Math.min(G.h, (cy + r + .1 - G.y0) * G.pxmm); j++) for (let i = Math.max(0, Math.floor((cx - r - .1 - G.x0) * G.pxmm)); i < Math.min(G.w, (cx + r + .1 - G.x0) * G.pxmm); i++) {
    const d = Math.hypot(G.x(i) - cx, G.y(j) - cy); dots[j * G.w + i] = Math.max(dots[j * G.w + i], Math.max(0, Math.min(1, (r - d) / e + .5))); }
  geo.rules.forEach(r => { const t = KM.penLine(G, r, { lw: .09, od: 1, wob: 0, floor: 1 }); for (let q = 0; q < G.n; q++) line[q] = Math.max(line[q], Math.min(1, t[q])); });
  const sw = noise2(seed * 7), D = geo.D, losses = [[D[40][0] + .1, D[40][1], .12], [D.at(-30)[0] - .1, D.at(-30)[1] + .05, .1]];
  return SM.flat(G, [{ cov: line, col: SM.FLAT.ink, hole: false }, { cov: dots, col: [176, 108, 74], swell: (x, y) => (sw(x / 6, y / 6) - .5) * 2, shift: [.02, -.02] }], { losses, seed });
}

// ---- an orpiment band: a ring like the O's, between a heavy ink ring (painted in ink) and a pen rule ---------------------------
export function bandGeometry() {
  const cx = 15, cy = 34, R0 = 22, box = [0, 0, 30, 20];   // a stretch of a large ring: the band from R0 to R0 + 2.6 mm, the ink ring outside it
  return { box, cx, cy, r: [R0, R0 + 3.6, R0 + 4.5] };
}
const ringPath = (cx, cy, a, b) => { const P = new Path2D(); P.arc(cx, cy, b, 0, Math.PI * 2); P.arc(cx, cy, a, 0, Math.PI * 2, true); return P; };
const arcPts = (cx, cy, r, a0 = Math.PI * 1.1, a1 = Math.PI * 1.9) => { const o = []; for (let a = a0; a <= a1; a += .004) o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); return o; };
export function bandLayers(G, geo, { seed = 1 } = {}) {
  const P = KM.parchment(G, { seed: 5 }), [r0, r1, r2] = geo.r, { cx, cy } = geo;
  const ink = KM.mask(G, ringPath(cx, cy, r1 + .02, r2)); for (let q = 0; q < G.n; q++) ink[q] *= 1.1;
  KM.penLine(G, arcPts(cx, cy, r0 - .05), { lw: .09, od: .8, seed: seed + 3, tau: ink }); KM.penLine(G, arcPts(cx, cy, r1 + .02), { lw: .1, od: .9, seed: seed + 5, tau: ink }); KM.penLine(G, arcPts(cx, cy, r2), { lw: .1, od: .9, seed: seed + 7, tau: ink });
  const M = KM.mask(G, ringPath(cx, cy, r0 + .08, r1 - .02)), uv = (x, y) => { const a = Math.atan2(y - cy, x - cx), r = Math.hypot(x - cx, y - cy); return [a * r0, r - (r0 + r1) / 2]; };
  const orp = KM.level(KM.fillLoads(G, M, { seed: seed + 11, swath: 1.3, uv, scale: 1.25 }).tau, P);
  return { P, layers: [{ pig: KM.PIG.ink, tau: ink, kind: 'ink' }, { pig: KM.PIG.orpiment, tau: orp, kind: 'orpiment' }] };
}
export function bandSmoke(G, geo, { seed = 1 } = {}) {
  const [r0, r1, r2] = geo.r, { cx, cy } = geo, ring = KM.mask(G, ringPath(cx, cy, r1, r2)), rule = KM.mask(G, ringPath(cx, cy, r0 - .1, r0)), orp = KM.mask(G, ringPath(cx, cy, r0 + .08, r1 - .02));
  const sw = noise2(seed * 3); const a = Math.PI * 1.35;
  return SM.flat(G, [{ cov: ring, col: SM.FLAT.dark, hole: false }, { cov: rule, col: SM.FLAT.ink, hole: false }, { cov: orp, col: SM.FLAT.orpiment, swell: (x, y) => (sw(x / 7, y / 7) - .5) * 2, shift: [.02, .03] }],
    { losses: [[cx + (r1 - .3) * Math.cos(a), cy + (r1 - .3) * Math.sin(a), .22], [cx + (r0 + .4) * Math.cos(a + .3), cy + (r0 + .4) * Math.sin(a + .3), .15]], seed });
}

// ---- red-lead keys: stepped bands (the O's key pattern, f. 139r), red lead and indigo-with-chalk in turn between pen lines,
// each band laid short of its lines (a hair of vellum), one or two loads to a band ------------------------------------------
export function keysGeometry() {
  const box = [0, 0, 24, 18], fr = [2, 2, 22, 16], sx = 1.9, sy = 1.5, p = 2.6, stairs = [];
  for (let k = -8; k <= 8; k++) { const o = []; let x = fr[0] + k * p - 2, y = fr[3] + 1.5; o.push([x, y]); while (y > fr[1] - 2) { y -= sy; o.push([x, y]); x += sx; o.push([x, y]); } stairs.push(o); }
  return { box, fr, stairs };
}
const poly = pts => { const P = new Path2D(); P.moveTo(...pts[0]); for (const q of pts.slice(1)) P.lineTo(...q); P.closePath(); return P; };
function keysMasks(G, geo) {
  const [x0, y0, x1, y1] = geo.fr, frame = KM.mask(G, poly(rect(geo.fr))), B = new Float32Array(G.n), R = new Float32Array(G.n);
  for (let k = 0; k + 1 < geo.stairs.length; k++) { const M = KM.mask(G, poly([...geo.stairs[k], ...geo.stairs[k + 1].slice().reverse()])), T = k % 2 ? B : R;
    for (let q = 0; q < G.n; q++) T[q] = Math.max(T[q], M[q] * frame[q]); }
  return { frame, B, R };
}
const shrink = (G, M, d) => { const b = KM.blur(M, G.w, G.h, d * G.pxmm * .8); for (let q = 0; q < G.n; q++) M[q] = Math.max(0, Math.min(1, (b[q] - .5) * 3 + .5)) * M[q]; return M; };
function keysInk(G, geo, seed, frameM, opt = {}) {
  const ink = KM.ruled(G, rect(geo.fr), { lw: .1, od: .85, seed, ...opt }), t = new Float32Array(G.n);
  geo.stairs.forEach((st, k) => KM.penLine(G, st, { lw: .085, od: .85, seed: seed + 3 + k, tau: t, floor: .22, ...opt }));
  for (let q = 0; q < G.n; q++) ink[q] = Math.max(ink[q], t[q] * frameM[q]); return ink;
}
export function keysLayers(G, geo, { seed = 1 } = {}) {
  const P = KM.parchment(G, { seed: 6 }), { frame, B, R } = keysMasks(G, geo), ink = keysInk(G, geo, seed, frame);
  const blue = KM.level(KM.fillLoads(G, shrink(G, B, .2), { seed: seed + 3, swath: 1.6 }).tau, P), red = KM.level(KM.fillLoads(G, shrink(G, R, .2), { seed: seed + 5, swath: 1.6, scale: 1.1 }).tau, P);
  return { P, layers: [{ pig: KM.PIG.ink, tau: ink, kind: 'ink' }, { pig: KM.PIG.blue, tau: blue, kind: 'blue' }, { pig: KM.PIG.redlead, tau: red, kind: 'redlead' }] };
}
export function keysSmoke(G, geo, { seed = 1 } = {}) {
  const { frame, B, R } = keysMasks(G, geo), line = keysInk(G, geo, seed, frame, { wob: 0, floor: 1, od: 1 }); for (let q = 0; q < G.n; q++) line[q] = Math.min(1, line[q]);
  const sw = noise2(seed * 11), st = geo.stairs[9];
  return SM.flat(G, [{ cov: shrink(G, B, .2), col: SM.FLAT.blue, swell: (x, y) => (sw(x / 7, y / 7) - .5) * 2 }, { cov: shrink(G, R, .2), col: SM.FLAT.redlead, swell: (x, y) => (sw(x / 7 + 5, y / 7) - .5) * 2, shift: [.03, .02] }, { cov: line, col: SM.FLAT.ink, hole: false }],
    { losses: [[st[4][0] + .3, st[4][1] + .25, .14], [geo.fr[2] - .4, geo.fr[3] - .4, .12]], seed });
}
