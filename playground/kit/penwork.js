// Penwork: the hairline flourishing round a painted initial, grown from the letter's own shape.
// Pure geometry on grids (no canvas), so it can move to a worker. Page px throughout; grids carry their own resolution.
//
// After the pen-flourished Lombardic initials of Italian choir books, 15th c. (Met 466773, measured at full size), with
// the staff of the French books (Met 466179, 467422). The flourisher's vocabulary is small and every mark is a
// decision: first the eyes (a ring with a dot, small lobes round it) set in the widest places; then hairlines ruled
// straight down, close and even, filling the counters and the field beside the letter and stopping short of it; a
// frame line round the field that runs on down the margin as the staff; scallops strung along its outer side; hooks
// with a bead at the ends. Regular in rhythm, irregular in execution.
import { tendril, resample, stream, noise1, noise2, PIGMENTS } from './marks.js';

// the letters' paints, flat and dense, pooling a little at the edge (as 466773's blue and vermilion); lapis in marks.js
// granulates too much for a letter body
PIGMENTS.azurite ??= { rgb: [38, 70, 160], gran: .03, rim: .42 };
PIGMENTS.minium ??= { rgb: [212, 76, 42], gran: .03, rim: .36 };

// ---- distance -----------------------------------------------------------------------------------------------------------
// Exact Euclidean distance transform (Felzenszwalb & Huttenlocher 2012): distance in cells from every cell to the
// nearest cell where feat is set.
export function edt(feat, w, h) {
  const INF = 1e20, n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  const D = new Float64Array(w * h); for (let i = 0; i < w * h; i++) D[i] = feat[i] ? 0 : INF;
  const pass = (len) => { let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < len; q++) { let s; while ((s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])) <= z[k]) k--; k++; v[k] = q; z[k] = s; z[k + 1] = INF; }
    k = 0; for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) ** 2 + f[v[k]]; } };
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = D[y * w + x]; pass(h); for (let y = 0; y < h; y++) D[y * w + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = D[y * w + x]; pass(w); for (let x = 0; x < w; x++) D[y * w + x] = d[x]; }
  const out = new Float32Array(w * h); for (let i = 0; i < w * h; i++) out[i] = Math.sqrt(D[i]); return out;
}

// ---- the letter ------------------------------------------------------------------------------------------------------------
// A typeset glyph made to read as drawn: its edge moved in and out slowly (≈1 px at a 25 px wavelength), so the
// strokes swell and thin a little as a brush filling a drawn outline would, and a finer waver on top.
export function drawn({ M, w, h, x0, y0, res }, seed = 1, amp = .8) {
  const ink = new Uint8Array(w * h), paper = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { ink[i] = M[i] > .5; paper[i] = !ink[i]; }
  const Do = edt(ink, w, h), Di = edt(paper, w, h), slow = noise2(seed ^ 0x5d), fine = noise2(seed ^ 0x19), out = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = j * w + i, px = x0 + i / res, py = y0 + j / res;
    const sd = (Do[k] - Di[k]) / res, b = amp * (2 * slow(px / 25, py / 25) - 1) + .18 * (2 * fine(px / 5, py / 5) - 1);
    out[k] = Math.max(0, Math.min(1, .5 + (b - sd) * res * .5)); }
  return { M: out, w, h, x0, y0, res };
}

// ---- small geometry -------------------------------------------------------------------------------------------------------
export const arclen = p => p.reduce((a, q, i) => i ? a + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0);
const tangentAt = (p, i) => { const a = p[Math.max(0, i - 2)], b = p[Math.min(p.length - 1, i + 2)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
// a hand does not hold a line exactly: drift it sideways a little, slowly
const wander = (p, amp, seed, scale = 26) => { const n = noise1(seed), q = resample(p, 1);
  return q.map((pt, i) => { const t = tangentAt(q, i), o = (n(i / scale) - .5) * 2 * amp; return [pt[0] - t[1] * o, pt[1] + t[0] * o]; }); };
// a ring as a pen goes round it: a little oval, closing just past where it began
const ring = (c, R, r, ov = .08, a0 = 0, turn = 1.04) => { const tilt = r() * Math.PI, out = [];
  for (let k = 0; k <= 40 * turn; k++) { const a = a0 + k / 40 * 2 * Math.PI, rr = R * (1 + ov * Math.cos(2 * (a - tilt)) + (r() - .5) * .03); out.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]); }
  return out; };

// ---- clearance --------------------------------------------------------------------------------------------------------------
// Distance from each cell (1 px) to the nearest thing already on the page: the letter, the words, the edge of the field,
// and every mark accepted so far (stamped in as it is accepted, so spacing is even by construction).
function clearance(x0, y0, w, h, blocked, cap) {
  const C = edt(blocked, w, h); for (let i = 0; i < C.length; i++) C[i] = Math.min(cap, C[i]);
  const get = (x, y) => { const i = Math.round(x - x0), j = Math.round(y - y0); return i < 0 || j < 0 || i >= w || j >= h ? 0 : C[j * w + i]; };
  const stamp = (pts, R = cap) => { for (const [px, py] of resample(pts, .8)) {
    const cx = px - x0, cy = py - y0, i0 = Math.max(0, Math.floor(cx - R)), i1 = Math.min(w - 1, Math.ceil(cx + R)), j0 = Math.max(0, Math.floor(cy - R)), j1 = Math.min(h - 1, Math.ceil(cy + R));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.hypot(i - cx, j - cy), k = j * w + i; if (d < C[k]) C[k] = d; } } };
  return { get, stamp, C };
}

// ---- the flourish -------------------------------------------------------------------------------------------------------------
// glyph: { M, w, h, x0, y0, res } coverage of the painted letter. field: [x0, y0, x1, y1], the square the penwork fills
// (its top and left edges are the frame line). keep: rects of words, padded. staff: null or { y1 } how far the frame
// runs on down the margin. g: the gap between ruled hairlines (px). eyes: how many outside the counters.
// Returns the marks in the order the pen made them: strokes { pts, kind, w, start, end } and dots { kind: 'dot', p, r }.
export function flourish({ glyph, field, keep = [], staff = null, g = 2.6, eyes = 3, seed = 1 }) {
  const r = stream(seed, 'penwork'), out = [];
  const [fx0, fy0, fx1, fy1] = field, sy1 = staff ? staff.y1 : fy1;
  const X0 = Math.floor(fx0 - g * 6), Y0 = Math.floor(fy0 - g * 6), X1 = Math.ceil(fx1 + g * 2), Y1 = Math.ceil(sy1 + g * 12), W = X1 - X0, H = Y1 - Y0;
  const { M, w: gw, h: gh, x0: gx, y0: gy, res } = glyph, ink = new Uint8Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) ink[i] = M[i] > .5;
  const onLetter = (x, y) => { const i = Math.round((x - gx) * res), j = Math.round((y - gy) * res); return i >= 0 && j >= 0 && i < gw && j < gh && ink[j * gw + i]; };
  const inWords = (x, y, pad = 0) => keep.some(k => x >= k[0] - pad && x <= k[2] + pad && y >= k[1] - pad && y <= k[3] + pad);
  let bx1 = -1e9; for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) if (ink[j * gw + i]) bx1 = Math.max(bx1, i);
  const right = gx + (bx1 + 1) / res;
  // the field's inside is what the hairlines may fill; outside it, only the frame's own marks
  const inside = (x, y) => x > fx0 && x < fx1 && y > fy0 && y < fy1;
  const fieldIn = (x, y) => inside(x, y) && !onLetter(x, y) && !inWords(x, y);
  const blocked = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = X0 + i + .5, y = Y0 + j + .5; blocked[j * W + i] = onLetter(x, y) || inWords(x, y) || x > fx1; }
  const CL = clearance(X0, Y0, W, H, blocked, 16);
  const accept = (pts, kind, o = {}) => { out.push({ pts, kind, ...o }); CL.stamp(pts); };
  const room = (pts, d) => pts.every(p => CL.get(p[0], p[1]) >= d);

  // 1. the frame: along the top from above the letter's shoulder, round the corner, down the field's left edge and on
  // down the margin as the staff; a hook at its head, a curl at its foot. It comes first: everything keeps to it.
  const corner = g * 2.2;
  const topRun = [[Math.min(fx1, right) - g * 2, fy0 + (r() - .5)], [fx0 + corner, fy0]];
  const arc = []; for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 - k / 10 * Math.PI / 2; arc.push([fx0 + corner + Math.cos(a) * corner, fy0 + corner + Math.sin(a) * corner]); }
  let frame = wander([...resample(topRun, 2), ...arc.slice(1), ...resample([[fx0, fy0 + corner], [fx0, sy1]], 2).slice(1)], .3, seed + 3, 40);
  const headHook = tendril(frame[0], .1, g * 5, 0, .66 / g, 1.4).reverse();
  const foot = tendril(frame.at(-1), Math.PI / 2, g * 9 + r() * g * 3, 0, .45 / g, 1.5);
  frame = [...headHook.slice(0, -1), ...frame, ...foot.slice(1)];
  accept(frame, 'frame', { w: .6, start: 'pool', end: 'ball' });
  const lines = [frame];
  // a second hairline outside it down the staff, so the staff is a pair as in 466179
  if (staff) { const x2 = fx0 - g * 1.15, ya = fy0 + corner + g * 3, yb = sy1 - g * 2;
    const s2 = wander([[x2, ya], [x2, yb]], .35, seed + 5, 50), sh = tendril(s2[0], -Math.PI / 2, g * 3.5, 0, -.5 / g, 1.3).reverse(), sf = tendril(s2.at(-1), Math.PI / 2, g * 4, 0, .5 / g, 1.3);
    const pair = [...sh.slice(0, -1), ...s2, ...sf.slice(1)]; accept(pair, 'staff', { w: .5, start: 'pool', end: 'ball' }); lines.push(pair); }

  // 2. eyes: set first in the widest places, one in each counter that has room and a few in the field; a ring, a dot
  // in it, and small lobes pressed round it wherever they fit
  const counter = (() => { const outside = new Uint8Array(gw * gh), st = [];
    for (let x = 0; x < gw; x++) st.push(x, (gh - 1) * gw + x); for (let y = 0; y < gh; y++) st.push(y * gw, y * gw + gw - 1);
    while (st.length) { const i = st.pop(); if (outside[i] || ink[i]) continue; outside[i] = 1; const x = i % gw;
      if (x > 0) st.push(i - 1); if (x < gw - 1) st.push(i + 1); if (i >= gw) st.push(i - gw); if (i < gw * (gh - 1)) st.push(i + gw); }
    return (x, y) => { const i = Math.round((x - gx) * res), j = Math.round((y - gy) * res); return i >= 0 && j >= 0 && i < gw && j < gh && !ink[j * gw + i] && !outside[j * gw + i]; }; })();
  const widest = (want) => { let best = null;
    for (let y = Math.ceil(fy0); y < fy1; y++) for (let x = Math.ceil(fx0); x < fx1; x++) {
      if (!fieldIn(x, y) || counter(x, y) !== want) continue;
      const c = CL.get(x, y) + r() * .3; if (!best || c > best.c) best = { c, p: [x, y] }; }
    return best; };
  const placeEye = (c, R) => {
    accept(ring(c, R, r, .07, r() * 6.28), 'eye', { w: .5, start: 'cut', end: 'cut' });
    out.push({ kind: 'dot', p: c, r: Math.max(.7, R * .27) });
    const nl = 3 + ((r() * 3) | 0), a0 = r() * 6.28;
    for (let k = 0; k < nl; k++) { const a = a0 + k / nl * 2 * Math.PI + (r() - .5) * .3, lr = R * (.38 + r() * .1), d = R + lr * .62;
      const lc = [c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d], pts = [];
      for (let i = 0; i <= 14; i++) { const b = a - 1.9 + i / 14 * 3.8; pts.push([lc[0] + Math.cos(b) * lr, lc[1] + Math.sin(b) * lr]); }
      if (!room(pts.slice(3, -3), g * .6)) continue;
      accept(pts, 'lobe', { w: .45, start: 'cut', end: 'cut' }); }
  };
  for (const inCounter of [true, false]) for (let k = 0; k < (inCounter ? 2 : eyes); k++) {
    const b = widest(inCounter); if (!b) break;
    const R = Math.min(g * 1.5, (b.c - g * .9) / 1.75); if (R < g * .75) break;
    placeEye([b.p[0] + (r() - .5) * .4, b.p[1] + (r() - .5) * .4], R);
  }

  // 3. the ruled hairlines: straight down, close and even, wherever the field is open (in the counters, beside the
  // letter, above it); each stops a little short of whatever it meets, never quite where its neighbour did
  const C1 = Float32Array.from(CL.C), c1 = (x, y) => { const i = Math.round(x - X0), j = Math.round(y - Y0); return i < 0 || j < 0 || i >= W || j >= H ? 0 : C1[j * W + i]; };
  const spacing = noise1(seed ^ 0x71);
  let k = 0;
  for (let x0 = fx0 + g * .95; x0 < fx1 - g * .3; x0 += g * (.86 + .28 * spacing(x0 / 9)), k++) {
    const x = x0 + (r() - .5) * g * .12; let y0 = -1;
    for (let y = fy0; y <= fy1 + .5; y += .5) {
      const ok = y < fy1 && fieldIn(x, y) && c1(x, y) >= g * .6;
      if (ok && y0 < 0) y0 = y;
      if (!ok && y0 >= 0) { const a = y0 + r() * g * .3, b = y - .5 - r() * g * .3;
        if (b - a > g * 1.6) accept(wander([[x, a], [x + (r() - .5) * .5, b]], .2, seed + 100 + k * 7 + (y | 0), 14), 'rule', { w: .42 + r() * .08, start: 'cut', end: 'taper' });
        y0 = -1; }
    }
  }

  // 4. scallops strung along the frame's outer side and down the staff, and now and then an eye hung from the staff.
  // The rhythm is regular; the hand is not: each a little larger or smaller, a little nearer or further.
  for (const line of lines) { const P = resample(line, 1);
  for (let i = Math.round(g * 5), next = i; i < P.length - g * 10; i++) {
    if (i < next) continue;
    const p = P[i], t = tangentAt(P, i), n = [t[1], -t[0]];   // the frame's left-hand side is the outside
    const sr = g * (.6 + r() * .18), c = [p[0] + n[0] * sr * .5, p[1] + n[1] * sr * .5], a = Math.atan2(n[1], n[0]), pts = [];
    for (let q = 0; q <= 14; q++) { const b = a - 2.05 + q / 14 * 4.1; pts.push([c[0] + Math.cos(b) * sr, c[1] + Math.sin(b) * sr]); }
    next = i + g * (2.5 + r() * .5);
    if (staff && p[1] > fy1 + g * 4 && r() < .18) {
      const R = g * 1.1, L = g * 1.3, st = [p, [p[0] + n[0] * L, p[1] + n[1] * L]], ec = [p[0] + n[0] * (L + R), p[1] + n[1] * (L + R)];
      if (room(ring(ec, R * 1.7, r), g * .6)) { accept(st, 'stalk', { w: .45, start: 'cut', end: 'cut' }); placeEye(ec, R); next = i + g * 6; continue; }
    }
    if (room(pts.slice(3, -3), g * .55)) accept(pts, 'scallop', { w: .45, start: 'cut', end: 'cut' });
  }
  }
  return out;
}
