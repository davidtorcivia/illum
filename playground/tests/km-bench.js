// The paint bench's subjects (tests/insular-paint.html): geometry in mm, and each one's paint layers through kit/styles/insular-paint.js.
// hand: the scribe's hand in the GEOMETRY, measured on f. 139r at the scan's sampling (scratchpad paintv2/measure.py):
//   pen line ink-mass width .15–.18 mm, cv .25–.27 over ~.9 mm; centre wander .026 mm sd over ~.9 mm; ruled lines off
//   their axis by 4–7° sd; the reserved vellum beside a line .30 mm (keys) / .50 mm (rules) where present, cv ~.3, absent
//   27 % (keys) / 65 % (rules) of the way. hand = 0 gives the earlier, exact geometry (the "before").
// cheap: the page-size path — flat vellum, no levelling, no weathering (losses placed by hand where a stroke ended or an
//   edge was handled); the same loads, pen and KM compose.
import { plait, cords, measure } from '../kit/styles/insular-knot.js';
import { noise1, noise2, hash2 } from '../kit/marks.js';
import * as KM from '../kit/styles/insular-paint.js';

export const MM = .15;   // mm per css px at the page's size
export const rect = ([x0, y0, x1, y1]) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
// a fill as two pigments by its loads' mix (each load a little more of one than the other): the same pot, unevenly stirred
const split = (tau, mix, a, b, k, kind) => { const A = new Float32Array(tau.length), B = new Float32Array(tau.length); for (let q = 0; q < tau.length; q++) { const m = k * mix[q]; A[q] = tau[q] * (1 - m); B[q] = tau[q] * m; } return [{ pig: a, tau: A, kind }, { pig: b, tau: B, kind: kind + '2' }]; };
const n1 = (seed, scale) => { const f = noise1(seed); return x => (f(x / scale) - .5) * 2; };
const parch = (G, cheap, seed) => cheap ? KM.flatParchment(G) : KM.parchment(G, { seed });
const lev = (tau, P, cheap) => cheap ? tau : KM.level(tau, P);
const poly = pts => { const P = new Path2D(); P.moveTo(...pts[0]); for (const q of pts.slice(1)) P.lineTo(...q); P.closePath(); return P; };
// the reserve's cut: a region's paint stops short of its edge by line/2 + r(x, y), r = max(lo, m (a + b u)) (u -1..1, slow)
// The reserve beside a line: m where present (cv sd), and stretches where the brush ran up onto the line (absent, a share
// `gone` of the way, on a longer scale); lo < 0 lets the brush overrun the rule a little there.
function reserveCut(G, M, { m, cv = .27, gone = .27, lo = 0, line = .08, seed = 1, scale = .8, gscale = 3.5 }) {
  const D = KM.insideDist(G, M), u = noise2(seed * 53 + 7), g = noise2(seed * 53 + 11), e = 1 / G.pxmm, gt = 2 * gone - 1;
  for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) { const q = j * G.w + i; if (M[q] <= 0) continue; const x = G.x(i), y = G.y(j);
    const gate = KM.smooth(gt - .6, gt + .6, (g(x / gscale, y / gscale) - .5) * 2 * 1.6), r = lo + (m * (1 + cv * 1.7 * (u(x / scale, y / scale) - .5) * 2) - lo) * gate, cut = line / 2 + r;
    M[q] *= Math.max(0, Math.min(1, (D[q] - cut) / e + .5)); }
  return M;
}

// ---- the knot ---------------------------------------------------------------------------------------------------------------------
export function knotGeometry(seed = 1, hand = 1) {
  const A = 6, B = 3, u = 9, ox = 10, oy = 10, PW = ox * 2 + 2 * A * u, PH = oy * 2 + 2 * B * u;
  // hand: a free knot, not a lattice — breaks open the centre and part the rows (walls on interior edges), the outer turns
  // set wider and rounder, the whole eased outward so the outer loops are bigger than the inner
  const walls = hand ? new Set(['6,1', '6,5', '3,2', '9,4']) : new Set(), K = plait(A, B, () => true, (x, y) => walls.has(x + ',' + y));
  const C = measure(cords(K, { ox, oy, u, inset: hand ? .36 : .32, round: 1.05, edgeInset: hand ? .5 : null, edgeRound: hand ? 1.45 : null }), u), W = u * 1.02;
  if (hand) { const cx0 = PW / 2, cy0 = PH / 2; for (const c of C) c.pts = c.pts.map(([x, y]) => { const dx = (x - cx0) / (PW / 2), dy = (y - cy0) / (PH / 2), k = 1 + .045 * Math.hypot(dx, dy) - .03; return [cx0 + (x - cx0) * k, cy0 + (y - cy0) * k]; }); }
  const nx = noise2(11 * seed), ny = noise2(29 * seed), wx = noise2(41 * seed), wy = noise2(57 * seed), lam = u * 3.2, amp = u * .06, aw = W * .1;
  const out = C.map((c, t) => { const fb = noise2(100 + t + seed * 7), gb = noise2(200 + t + seed * 7), cw = hand ? 1 + .09 * (hash2(t, seed, 5) - .5) * 2 : 1;   // each cord its own pass of the pen: a little wider or narrower
    const pts = c.pts.map(([x, y]) => [(x + amp * (nx(x / lam, y / lam) - .5) * 2 + aw * (wx(x / u, y / u) - .5) * 2) * MM, (y + amp * (ny(x / lam, y / lam) - .5) * 2 + aw * (wy(x / u, y / u) - .5) * 2) * MM]);
    const n = pts.length, f = new Float32Array(n), g = new Float32Array(n);
    for (let k = 0; k < n; k++) { const s = k / n * c.L, a = pts[(k - 3 + n) % n], b = pts[k], d = pts[(k + 3) % n], h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(d[1] - b[1], d[0] - b[0]);
      let dh = h2 - h1; dh -= Math.round(dh / (2 * Math.PI)) * 2 * Math.PI; const turn = Math.min(1, Math.abs(dh) / (Math.hypot(d[0] - a[0], d[1] - a[1]) || 1) * u * MM * .9);
      f[k] = cw * (1 + .2 * (fb(s / (u * 1.3), t * 3.1) - .5) * 2); g[k] = .7 + .9 * turn + .35 * (gb(s / (u * .8), t) - .5); }
    return { pts, f, g, ev: c.ev, sFrac: c.s.map(v => v / c.L) }; });
  // the fine red pen-knotwork the ground was laid round (a plait at a third of the scale)
  const fine = hand ? cords(plait(10, 5), { ox: 5, oy: 6, u: 5.9, inset: .3, round: 1.05 }).map(c => c.pts.map(([x, y]) => [x * MM, y * MM])) : [];
  return { cords: out, W: W * MM, box: [0, 0, PW * MM, PH * MM], frame: [3.4 * MM, 3.4 * MM, (PW - 3.4) * MM, (PH - 3.4) * MM], fine, hand };
}
// layers, bottom first: the pen (drawn first), the ground, the red knotwork where the ground left it, the blue-grey tint
export function knotLayers(G, geo, { seed = 1, cheap = false, tint = .66 } = {}) {
  const hand = geo.hand, P = parch(G, cheap, 3), F = KM.knotFields(G, geo.cords, geo.W);
  const ink = KM.knotLines(G, F, geo.cords, geo.W, { seed, wander: hand ? .22 : 0, lw: hand ? .1 : .085 }); KM.ruled(G, rect(geo.frame), { tau: ink, seed, wob: hand ? .012 : 0, wander: hand ? .25 : 0 });
  const [fx0, fy0, fx1, fy1] = geo.frame, M = new Float32Array(G.n);
  for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) { const q = j * G.w + i, x = G.x(i), y = G.y(j); if (x < fx0 + .03 || x > fx1 - .03 || y < fy0 + .03 || y > fy1 - .03) continue;
    M[q] = F.id[q] < 0 ? 1 : Math.max(0, Math.min(1, (Math.abs(F.d[q]) - F.hw[q]) * G.pxmm + .5)); }
  const ground = lev(KM.fillLoads(G, M, { seed: seed + 4, swath: 1.4, axis: 0, dragP: 0, scale: hand ? 1 : 2.2 }).tau, P, cheap);
  const cx = (geo.box[0] + geo.box[2]) / 2, cy = (geo.box[1] + geo.box[3]) / 2;
  const tn = lev(KM.knotTint(G, F, geo.cords, geo.W, { seed: seed + 9, frac: tint, ...(hand ? { reserve: { m: .17, line: .11 }, scuff: { amp: .55, centre: [cx, cy], R: [cx * .85, cy * .8] } } : {}) }), P, cheap);
  const layers = [{ pig: hand ? KM.PIG.pen : KM.PIG.ink, tau: ink, kind: 'ink' }, { pig: hand ? KM.PIG.groundRB : KM.PIG.dark, tau: ground, kind: 'dark' }];
  if (hand && geo.fine.length) {   // the red knotwork the ground was laid round, as on f. 139r: bold red-lead strands in the dark, stopping at the knot's pen line
    const red = new Float32Array(G.n); geo.fine.forEach((pts, k) => KM.penLine(G, [...pts, pts[0]], { lw: .24, od: 1, seed: seed * 7 + k, tau: red, floor: .5, wob: .015 }));
    for (let q = 0; q < G.n; q++) { red[q] = Math.min(1.3, red[q] * 1.3) * M[q]; ground[q] *= 1 - Math.min(1, red[q] * 1.2); }   // the ground laid round them
    layers.push({ pig: KM.PIG.redlead, tau: red, kind: 'redline' }); }
  // the blue from strand to strand, load to load: the same pot, more or less of its indigo stirred up
  if (hand) layers.push(...split(tn, tn.mix, KM.PIG.knot, KM.PIG.blue, .55, 'knot')); else layers.push({ pig: KM.PIG.knot, tau: tn, kind: 'knot' });
  // hand-placed losses for the page-size path: at a stroke's end beside a crossing, on the outer loops
  const losses = [];
  geo.cords.forEach((c, t) => c.under && c.under.slice(1, 3).forEach((uu, k) => { if ((t + k) % 2) return; const p = c.pts[Math.floor(((uu + geo.W * .8) % c.L) / c.L * c.pts.length)]; losses.push([p[0], p[1], .07]); }));
  return { P, layers, losses };
}

// ---- dots: unchanged (the user: "the dots look good") ------------------------------------------------------------------------
export function dotsGeometry(seed = 1) {
  const box = [0, 0, 30, 20], cols = [[2.2, 13.6], [16.4, 27.8]], D = [], rules = [], drift = noise2(seed * 3 + 1);
  cols.forEach(([x0, x1], c) => { rules.push([[x0 - .55, 1], [x0 - .5 + .15 * c, 19]], [[x1 + .55, 1], [x1 + .6 - .1 * c, 19]]);
    const py = 1.08 * Math.sqrt(3) / 2, px = 1.08; let row = 0;
    for (let y = 1.6; y < 18.6; y += py, row++) { const off = row % 2 ? px / 2 : 0;
      for (let x = x0 + .45 + off; x < x1 - .4; x += px) { const dx = .12 * (drift(x / 4, y / 4) - .5) * 2, dy = .1 * (drift(x / 4 + 9, y / 4) - .5) * 2; D.push([x + dx, y + dy, .3, 0]); } } });
  return { box, D, rules, hand: 1 };
}
export function dotsLayers(G, geo, { seed = 1, cheap = false } = {}) {
  const P = parch(G, cheap, 4), ink = new Float32Array(G.n); geo.rules.forEach((r, k) => KM.penLine(G, r, { lw: .09, od: .75, seed: seed + k, tau: ink, floor: .3 }));
  const red = lev(KM.dots(G, geo.D, { t0: 1.5, seed }), P, cheap);
  return { P, layers: [{ pig: KM.PIG.ink, tau: ink, kind: 'ink' }, { pig: KM.PIG.redlead, tau: red, kind: 'redlead' }], losses: [] };
}

// ---- the orpiment ("gold") band: a ring like the O's, between a heavy ink ring and a pen rule ------------------------------
// hand: each rule laid as its own pen path, bowing slowly off the true circle (so the band's width varies), the brush's edge
// over-running a rule here, falling short there (reserve .5 mm where present, absent ~60 %); the fill a few long loads with
// tone changes between them and darker pooling where a load stopped or overlapped.
export function bandGeometry(seed = 1, hand = 1) {
  const cx = 15, cy = 34, R0 = 22, box = [0, 0, 30, 20], r = [R0, R0 + 3.6, R0 + 4.5];
  const bows = r.map((_, i) => hand ? n1(seed * 23 + i * 7, 5.5) : () => 0);
  const arc = (i, dr = 0) => { const o = []; for (let a = Math.PI * 1.08; a <= Math.PI * 1.92; a += .004) { const rr = r[i] + dr + .17 * bows[i](a * R0); o.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); } return o; };
  return { box, cx, cy, R0, r, arc, hand };
}
const ringPoly = (A, B) => poly([...A, ...B.slice().reverse()]);
export function bandLayers(G, geo, { seed = 1, cheap = false } = {}) {
  const P = parch(G, cheap, 5), { cx, cy, R0, hand } = geo, wob = hand ? .012 : 0, wander = hand ? .25 : 0;
  const ink = KM.mask(G, ringPoly(geo.arc(1, .02), geo.arc(2))), pen = new Float32Array(G.n); for (let q = 0; q < G.n; q++) ink[q] *= 1.1;
  [0, 1, 2].forEach(i => KM.penLine(G, geo.arc(i, i === 0 ? -.05 : 0), { lw: hand ? .13 : i ? .1 : .09, od: hand ? 1 : i ? .9 : .8, seed: seed + 3 + 2 * i, tau: hand ? pen : ink, wob, wander, soft: hand ? .025 : .012 }));
  let M = KM.mask(G, ringPoly(geo.arc(0), geo.arc(1)));
  M = hand ? reserveCut(G, M, { m: .3, gone: .5, lo: -.03, line: .17, seed: seed + 2 }) : (() => { const N = KM.mask(G, ringPoly(geo.arc(0, .08), geo.arc(1, -.02))); return N; })();
  const uv = (x, y) => { const a = Math.atan2(y - cy, x - cx), rr = Math.hypot(x - cx, y - cy); return [a * R0, rr - (geo.r[0] + geo.r[1]) / 2]; };
  const F = KM.fillLoads(G, M, { seed: seed + 11, swath: hand ? 1.8 : 1.3, uv, scale: 1.25, seg: hand ? 8 : 0, pool: .35, dragP: hand ? .7 : null }), orp = lev(F.tau, P, cheap);
  const a = Math.PI * 1.33, losses = [[cx + (geo.r[1] - .35) * Math.cos(a), cy + (geo.r[1] - .35) * Math.sin(a), .16], [cx + (geo.r[0] + .3) * Math.cos(a + .35), cy + (geo.r[0] + .3) * Math.sin(a + .35), .1]];
  // olive-gold where a load was richer, paler gold where it was scrubbed thin
  const fill = hand ? split(orp, F.mix, KM.PIG.orpOlive, KM.PIG.orpGold, .8, 'orpiment') : [{ pig: KM.PIG.orpiment, tau: orp, kind: 'orpiment' }];
  return { P, layers: [{ pig: KM.PIG.ink, tau: ink, kind: 'ink' }, ...(hand ? [{ pig: KM.PIG.pen, tau: pen, kind: 'ink' }] : []), ...fill], losses };
}

// ---- the step grid (keys): drawn, not constructed --------------------------------------------------------------------------
// hand: every construction point off by the hand's aim (.09 mm: ~4–5° on a 1.7 mm step, as measured), the ruling drifting as
// a whole (rows bow .25 mm over ~9 mm), each step's size its own (±6 %); every line a pen path over those points with its
// corners turned, not polygon edges; the frame four strokes pooling where the pen lifted; the paint short of each line by
// the measured reserve.
export function keysGeometry(seed = 1, hand = 1) {
  const box = [0, 0, 24, 18], fr0 = [2, 2, 22, 16], sx = 1.9, sy = 1.5, p = 2.6, H = hand ? 1 : 0;
  const bx = noise2(seed * 61 + 1), by = noise2(seed * 61 + 2), bow = ([x, y]) => [x + H * .25 * (bx(x / 9, y / 9) - .5) * 2, y + H * .25 * (by(x / 9, y / 9) - .5) * 2];
  const aim = (k, m, i) => H * .08 * (hash2(k * 131 + m, seed, i) - .5) * 2 * 1.7;   // ±.1 mm uniform ≈ .06 sd: ~3–4° on a step
  const stairs = [];
  for (let k = -8; k <= 8; k++) { const o = []; let x = fr0[0] + k * p - 2, y = fr0[3] + 1.5, m = 0; o.push([x, y]);
    while (y > fr0[1] - 2) { y -= sy * (1 + H * .06 * (hash2(k, m, seed + 3) - .5) * 2); o.push([x, y]); x += sx * (1 + H * .06 * (hash2(k, m, seed + 4) - .5) * 2); o.push([x, y]); m++; }
    stairs.push(o.map((q, i) => bow([q[0] + aim(k, i, 1), q[1] + aim(k, i, 2)]))); }
  const corners = rect(fr0).map((q, i) => bow([q[0] + aim(99, i, 1) * 1.5, q[1] + aim(99, i, 2) * 1.5]));
  return { box, fr: fr0, frame: corners, stairs, hand };
}
// a pen's corner: the hand turns it in a short curve (Chaikin, one pass, a quarter cut)
const turn = pts => { const o = [pts[0]]; for (let i = 1; i < pts.length - 1; i++) { const a = pts[i - 1], b = pts[i], c = pts[i + 1], k = .18; o.push([b[0] + (a[0] - b[0]) * k, b[1] + (a[1] - b[1]) * k], [b[0] + (c[0] - b[0]) * k, b[1] + (c[1] - b[1]) * k]); } o.push(pts.at(-1)); return o; };
function keysMasks(G, geo) {
  const frame = KM.mask(G, poly(geo.frame)), PB = new Path2D(), PR = new Path2D();
  for (let k = 0; k + 1 < geo.stairs.length; k++) (k % 2 ? PB : PR).addPath(poly([...geo.stairs[k], ...geo.stairs[k + 1].slice().reverse()]));
  const B = KM.mask(G, PB), R = KM.mask(G, PR); for (let q = 0; q < G.n; q++) { B[q] *= frame[q]; R[q] *= frame[q]; }
  return { frame, B, R };
}
function keysInk(G, geo, seed, frameM) {
  const H = geo.hand, o = { wob: H ? .02 : 0, wander: H ? .32 : 0 }, ink = new Float32Array(G.n), t = new Float32Array(G.n), f = geo.frame;
  for (let k = 0; k < 4; k++) { const a = f[k], b = f[(k + 1) % 4], mid = [(a[0] + b[0]) / 2 + (H ? .12 * (hash2(k, seed, 9) - .5) : 0), (a[1] + b[1]) / 2 + (H ? .12 * (hash2(k, seed, 10) - .5) : 0)];
    KM.penLine(G, H ? [a, mid, b] : [a, b], { lw: H ? .14 : .1, od: H ? 1 : .85, soft: H ? .025 : .012, seed: seed + 50 + k, tau: ink, floor: .25, ...o }); }
  geo.stairs.forEach((st, k) => KM.penLine(G, st, { lw: H ? .12 : .085, od: H ? 1 : .85, soft: H ? .025 : .012, seed: seed + 3 + k, tau: t, floor: .22, ...o }));
  for (let q = 0; q < G.n; q++) ink[q] = Math.max(ink[q], t[q] * frameM[q]); return ink;
}
const RED2 = KM.fromColour([168, 86, 60]);   // red lead ground a little coarser in one load than the next: deeper
const shrink = (G, M, d) => { const b = KM.blur(M, G.w, G.h, d * G.pxmm * .8); for (let q = 0; q < G.n; q++) M[q] = Math.max(0, Math.min(1, (b[q] - .89) * d * G.pxmm * 2.5 + .5)) * M[q]; return M; };
export function keysLayers(G, geo, { seed = 1, cheap = false } = {}) {
  const P = parch(G, cheap, 6), { frame, B, R } = keysMasks(G, geo), ink = keysInk(G, geo, seed, frame);
  const cut = (M, s) => geo.hand ? reserveCut(G, M, { m: .25, gone: .08, line: .12, seed: s }) : shrink(G, M, .14);
  const FB = KM.fillLoads(G, cut(B, seed + 1), { seed: seed + 3, swath: 1.6, dragP: geo.hand ? .35 : 0 }), FR = KM.fillLoads(G, cut(R, seed + 2), { seed: seed + 5, swath: 1.6, scale: 1.1, dragP: geo.hand ? .35 : 0 });
  const blue = lev(FB.tau, P, cheap), red = lev(FR.tau, P, cheap);
  const st = geo.stairs[9], losses = [[st[6][0] + .25, st[6][1] + .3, .12], [geo.frame[2][0] - .45, geo.frame[2][1] - .4, .1]];
  const fills = geo.hand ? [...split(blue, FB.mix, KM.PIG.blue, KM.PIG.knot, .5, 'blue'), ...split(red, FR.mix, KM.PIG.redlead, RED2, .5, 'redlead')] : [{ pig: KM.PIG.blue, tau: blue, kind: 'blue' }, { pig: KM.PIG.redlead, tau: red, kind: 'redlead' }];
  return { P, layers: [{ pig: geo.hand ? KM.PIG.pen : KM.PIG.ink, tau: ink, kind: 'ink' }, ...fills], losses };
}
