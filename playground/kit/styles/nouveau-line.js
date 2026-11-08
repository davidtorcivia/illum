// Nouveau's line: the whiplash of the Combinaisons ornementales (Verneuil, Auriol, Mucha, 1901), Obrist's Peitschenhieb
// (1895) and Grasset's La plante (1896), as geometry — research/19-nouveau.md. A line here is one smooth curve, curvature
// continuous end to end (a clamped cubic B-spline, C2, with spirals grown on by integrating curvature from where the spline
// leaves off, so there is no join to see), resampled by arc length, and given a width that is a function of arc length:
// a hairline through the run swelling into a club where it ends (a round blob, or a swell drawn out to a point), and a
// little where it turns hardest. Measured on the plates (research/19): hairline : club ≈ 1 : 6–8; the swell lives at the
// ends and the tightest turns, never mid-run. Half-width is held under ~0.9 of the radius of curvature, so a spiral's inner
// edge never folds. Closed shapes (petals, leaves, berries) are periodic cubic B-splines, so they have no corners either.
// Everything is pure geometry (arrays of points), emitted in growth order; Path2D only when drawn, and a stroke drawn to
// any fraction of its length is the same outline cut short (?draw later is a truncation, not another drawing).
//   bspline(cp, n)  closed(cp, n)  even(pts, ds)  curl(pts, L, k1, pw)  stroke(pts, prof) -> S  path(S, f)  shape(pts) -> Path2D
import { tendril } from '../marks.js';

// ---- curves ---------------------------------------------------------------------------------------------------------------
// clamped uniform cubic B-spline through the end points: C2 everywhere (its curvature has no jump at a knot, unlike
// Catmull–Rom), hugging its control polygon
export function bspline(cp, n = 24) {
  const P = [cp[0], cp[0], ...cp, cp.at(-1), cp.at(-1)], out = [];
  for (let i = 0; i < P.length - 3; i++) for (let k = 0; k < n; k++) out.push(seg(P[i], P[i + 1], P[i + 2], P[i + 3], k / n));
  out.push(cp.at(-1).slice()); return out;
}
// periodic: a closed curve with no corner anywhere
export function closed(cp, n = 16) {
  const m = cp.length, out = [];
  for (let i = 0; i < m; i++) for (let k = 0; k < n; k++) out.push(seg(cp[i], cp[(i + 1) % m], cp[(i + 2) % m], cp[(i + 3) % m], k / n));
  return out;
}
function seg(a, b, c, d, t) {
  const t2 = t * t, t3 = t2 * t, b0 = (1 - t) ** 3 / 6, b1 = (3 * t3 - 6 * t2 + 4) / 6, b2 = (-3 * t3 + 3 * t2 + 3 * t + 1) / 6, b3 = t3 / 6;
  return [b0 * a[0] + b1 * b[0] + b2 * c[0] + b3 * d[0], b0 * a[1] + b1 * b[1] + b2 * c[1] + b3 * d[1]];
}
// even spacing by arc length
export function even(pts, ds = .5) {
  const out = [pts[0].slice()]; let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0); let t = ds - carry;
    while (t <= l) { out.push([x0 + (x1 - x0) * t / l, y0 + (y1 - y0) * t / l]); t += ds; }
    carry = l - (t - ds);
  }
  const e = pts.at(-1), q = out.at(-1); if (Math.hypot(e[0] - q[0], e[1] - q[1]) > ds * .25) out.push(e.slice()); return out;
}
// heading and signed curvature at the end of an evenly spaced polyline (over a few steps, so jitter does not read as bend)
function endState(p, k = 6) {
  const n = p.length - 1, a = p[n - 2 * k], b = p[n - k], c = p[n];
  const h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
  let dh = h2 - h1; dh -= Math.round(dh / (2 * Math.PI)) * 2 * Math.PI;
  return { h: h2, k: dh / Math.hypot(c[0] - a[0], c[1] - a[1]) * 2 };
}
// grow a spiral on from the end of pts, winding `turns` times (signed: + turns clockwise on screen, y down) and closing to
// radius r1 at its eye: curvature starts where the curve left off (so the join is G2) and rises to 1/r1 as s^pw; its
// length is what that many turns takes
const HOLD = .3;
export function curl(pts, turns, r1, pw = 1.6, ds = .5) {
  const p = even(pts, ds), { h, k } = endState(p), k1 = Math.sign(turns) / r1, T = Math.abs(turns) * 2 * Math.PI * Math.sign(turns);
  const L = Math.min(Math.abs(T) * 12 * r1, Math.max(ds * 4, T / (k + (k1 - k) / (pw + 1))));
  const t = tendril(p.at(-1), h, L, k, k1, pw, ds);
  // then a little way round at the eye's own radius, so the eye is a true circle the line wraps (hold: turns)
  const q = t.at(-1), o = t.at(-2), hh = Math.atan2(q[1] - o[1], q[0] - o[0]), hold = tendril(q, hh, HOLD * 2 * Math.PI * r1, k1, k1, 1, ds);
  return p.concat(t.slice(1), hold.slice(1));
}
// the same at the start (the curl grows backwards out of the first point; turns as seen walking backwards)
export const curlStart = (pts, turns, r1, pw = 1.6, ds = .5) => curl(pts.slice().reverse(), turns, r1, pw, ds).reverse();

// ---- width ---------------------------------------------------------------------------------------------------------------
// prof: { hair (half-width of the run), a, b: the ends, each { kind: 'club' (a swell to a round end) | 'point' (a swell
// drawn out to a point) | 'taper' (thins to nothing) | 'hair' (stays a hairline, round), fat (half-width at its fullest), len
// (px over which it swells) }, swell (0..: extra width on the hardest turns, x hair), ds }
const sstep = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
function endW(d, e, hair) {   // d: px from the end
  if (!e || e.kind === 'hair') return hair;
  const L = e.len, u = d / L;
  if (e.kind === 'taper') return hair * sstep(Math.min(1, u * 1.2));
  if (e.kind === 'club') { if (u >= 1) return hair; const s = sstep(1 - u); return hair + (e.fat - hair) * Math.pow(s, 1.3); }
  if (e.kind === 'point') {   // a long seed: widest at ~35% in from the end, drawn to a fine point at the end
    if (u >= 1) return hair; const m = .35, v = u < m ? Math.sin(u / m * Math.PI / 2) ** .8 : sstep((1 - u) / (1 - m));
    return u < m ? e.fat * v + .15 * hair * (1 - v) : hair + (e.fat - hair) * v; }
  return hair;
}
export function stroke(pts, prof = {}, ds = .5) {
  const p = even(pts, ds), n = p.length, hair = prof.hair ?? .6, w = new Float32Array(n), k = new Float32Array(n), L = (n - 1) * ds;
  for (let i = 1; i < n - 1; i++) {   // curvature by the turn of the chord over ±3 steps
    const a = p[Math.max(0, i - 3)], b = p[i], c = p[Math.min(n - 1, i + 3)];
    const h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let dh = h2 - h1; dh -= Math.round(dh / (2 * Math.PI)) * 2 * Math.PI; k[i] = dh / (Math.hypot(c[0] - a[0], c[1] - a[1]) / 2 || 1);
  }
  k[0] = k[1]; k[n - 1] = k[n - 2];
  for (let i = 0; i < n; i++) {
    const s = i * ds, wa = endW(s, prof.a, hair), wb = endW(L - s, prof.b, hair);
    let v = Math.max(wa, wb); if (wa < hair || wb < hair) v = Math.min(wa, wb, v);
    if (prof.swell) v += hair * prof.swell * sstep(Math.abs(k[i]) * (prof.swellR ?? 20) - .4);
    if (prof.press) {   // a pen's pressure: heavier pulled toward the hand (down and to the right), lighter pushed away
      const a = p[Math.max(0, i - 2)], b = p[Math.min(n - 1, i + 2)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, d = (dx * .45 + dy * .89) / l;
      v *= 1 + prof.press * (d > 0 ? d * d : -.45 * d * d); }
    w[i] = v;
  }
  smooth(w, Math.round(2 / ds));
  // never wider than its own turn (or the inner edge folds back on itself), and never changing faster than the line runs
  // (or the edge's normal flips); a min over a short window keeps the clamp itself smooth
  const cap = new Float32Array(n); for (let i = 0; i < n; i++) cap[i] = .85 / (Math.abs(k[i]) + 1e-6);
  const R = Math.round(1.5 / ds); for (let i = 0; i < n; i++) { let m = Infinity; for (let j = Math.max(0, i - R); j <= Math.min(n - 1, i + R); j++) m = Math.min(m, cap[j]); w[i] = Math.min(w[i], m); }
  for (let i = 1; i < n; i++) w[i] = Math.min(w[i], w[i - 1] + ds * .6); for (let i = n - 2; i >= 0; i--) w[i] = Math.min(w[i], w[i + 1] + ds * .6);
  // an eye: a spiral's end wound into a solid seed at its centre of curvature (the comma of the Combinaisons' spirals)
  let eye = null; if (prof.eye) { const q = p[n - 1], o = p[n - 3], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, kk = k[n - 2] || 1e-6;
    eye = [q[0] - dy / l / kk, q[1] + dx / l / kk, Math.max(0, Math.abs(1 / kk) - w[n - 1] * .25) * prof.eye]; }
  return { p, w, ds, L, eye, hair, col: prof.col, ends: [prof.a?.kind ?? 'hair', prof.b?.kind ?? 'hair'] };
}
function smooth(w, r) { if (r < 1) return; const n = w.length, c = Float32Array.from(w);
  for (let i = 0; i < n; i++) { let s = 0, m = 0; for (let j = -r; j <= r; j++) { const q = i + j; if (q < 0 || q >= n) continue; const g = 1 - Math.abs(j) / (r + 1); s += c[q] * g; m += g; } w[i] = s / m; } }

// ---- outline ---------------------------------------------------------------------------------------------------------------
// the stroke's outline (to the fraction f of its length): both sides offset by the half-width, round at the ends
export function outline(S, f = 1) {
  const { p, w } = S, n = Math.max(2, Math.min(p.length, Math.round((p.length - 1) * f) + 1)), Lf = [], Rt = [];
  for (let i = 0; i < n; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    Lf.push([p[i][0] + nx * w[i], p[i][1] + ny * w[i]]); Rt.push([p[i][0] - nx * w[i], p[i][1] - ny * w[i]]);
  }
  const cap = (c, r, a0) => { const o = []; for (let j = 1; j < 10; j++) { const a = a0 + Math.PI * j / 10; o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); } return o; };
  const h = (i, j) => Math.atan2(p[j][1] - p[i][1], p[j][0] - p[i][0]);
  const endCap = cap(p[n - 1], w[n - 1], h(n - 2, n - 1) + Math.PI / 2), startCap = cap(p[0], w[0], h(0, 1) - Math.PI / 2);
  // (an end cut short by f gets the round cap of its width there: the line as drawn so far, a pen's)
  return [...Lf, ...endCap, ...Rt.reverse(), ...startCap];
}
export function path(S, f = 1, P = new Path2D()) { poly(P, outline(S, f)); if (S.eye && f >= 1) { P.moveTo(S.eye[0] + S.eye[2], S.eye[1]); P.arc(S.eye[0], S.eye[1], S.eye[2], 0, Math.PI * 2); } return P; }
export function shape(pts, P = new Path2D()) { poly(P, pts); return P; }
function poly(P, q) { P.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) P.lineTo(q[i][0], q[i][1]); P.closePath(); }

// ---- small helpers --------------------------------------------------------------------------------------------------------
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const rotp = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
// a shape given in its own frame (base at 0,0, pointing +x, length 1) laid at b, heading a, scale L (mirrored if m < 0)
export const lay = (pts, b, a, L, m = 1) => pts.map(([x, y]) => { const [u, v] = rotp([x * L, y * L * m], a); return [b[0] + u, b[1] + v]; });
export function circle(c, r, n = 40) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); } return o; }

// ---- a contour with a hand ------------------------------------------------------------------------------------------------
// The line round a shape, drawn as Grasset's draughtsman drew it: heavier on the side turned from the light (the light
// from the top left), swelling a little on the outside of a turn, drawn fine into a sharp tip, and (lift > 0) lifting off
// where the light falls fullest, the line stopped and taken up again. pts: a closed loop, either way round (holes too:
// `away` is the side the ink is not). Returns a Path2D to fill evenodd. o: { w (its full weight), lo (the lit side's share
// of it), lift (0..1: how much of the lit side goes open), inset (how much of the weight lies inside the shape), tip }
const LIGHT = [.55, .83];
const HIT = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1).getContext('2d') : null;   // the direction the shadow side faces (light from the top left)
export function contour(pts, o = {}, P = new Path2D()) {
  const q = even([...pts, pts[0]], o.ds ?? .5); q.pop(); const n = q.length; if (n < 6) return P;
  let A = 0; for (let i = 0; i < n; i++) { const a = q[i], b = q[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; }
  const sgn = (o.away ?? (A > 0 ? 'left' : 'right')) === 'left' ? 1 : -1, W = o.w ?? 1, lo = o.lo ?? .35, inset = o.inset ?? .3;
  const N = [], w = new Float32Array(n), at = i => q[(i + n) % n];
  for (let i = 0; i < n; i++) {
    const a = at(i - 2), b = at(i + 2), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = sgn * dy / l, ny = -sgn * dx / l; N.push([nx, ny]);
    const a3 = at(i - 4), b3 = at(i + 4), h1 = Math.atan2(q[i][1] - a3[1], q[i][0] - a3[0]), h2 = Math.atan2(b3[1] - q[i][1], b3[0] - q[i][0]);
    let dh = h2 - h1; dh -= Math.round(dh / (2 * Math.PI)) * 2 * Math.PI; const k = Math.abs(dh) / (Math.hypot(b3[0] - a3[0], b3[1] - a3[1]) / 2 || 1);
    const shade = (nx * LIGHT[0] + ny * LIGHT[1] + 1) / 2;
    let v = W * (lo + (1 - lo) * Math.pow(shade, 1.3));
    v /= 1 + Math.pow(k * W * (o.tip ?? 1.6), 2);   // a sharp tip drawn fine
    if (o.lift) v *= sstep((shade - o.lift * .5) / .22);
    // solid: the whole shape this loop is one outline of; where both sides of the line are inside it (an overlap of the
    // face's own contours) there is no edge to draw
    if (o.solid) { const e = Math.max(.6, W); if (HIT.isPointInPath(o.solid, q[i][0] + nx * e, q[i][1] + ny * e, 'nonzero') === HIT.isPointInPath(o.solid, q[i][0] - nx * e, q[i][1] - ny * e, 'nonzero')) v = 0; }
    w[i] = v;
  }
  for (let pass = 0; pass < 2; pass++) { const c = Float32Array.from(w), r = Math.round(2.5 / (o.ds ?? .5)); for (let i = 0; i < n; i++) { let s = 0, m = 0; for (let j = -r; j <= r; j++) { const g = 1 - Math.abs(j) / (r + 1); s += c[(i + j + n) % n] * g; m += g; } w[i] = s / m; } }
  const out = [], inn = [];
  for (let i = 0; i < n; i++) { const [nx, ny] = N[i], p = q[i]; out.push([p[0] + nx * w[i] * (1 - inset), p[1] + ny * w[i] * (1 - inset)]); inn.push([p[0] - nx * w[i] * inset, p[1] - ny * w[i] * inset]); }
  poly(P, out); poly(P, inn); return P;
}
// ---- the letter (Böcklin's capitals, outlines exported by research tools: fonts/nouveau/bocklin-X.json) -------------------
const LDIR = new URL('../../fonts/nouveau/', import.meta.url), letters = new Map();
export const loadLetter = ch => { if (!letters.has(ch)) letters.set(ch, fetch(new URL(`bocklin-${ch}.json`, LDIR)).then(r => r.json()).then(j => ({ ...j, loops: j.c.map(r => { const o = []; for (let i = 0; i < r.length; i += 2) o.push([r[i], r[i + 1]]); return o; }) }))); return letters.get(ch); };
// the letter at cap height `cap`, its ink's left edge at x and its baseline at y: { loops (page px), path, w (ink width), top, bottom }
export function placeLetter(J, x, y, cap) {
  const loops = J.loops.map(L => L.map(([u, v]) => [x + u * cap, y + v * cap])), path = new Path2D(); for (const L of loops) poly(path, L);
  return { loops, path, w: J.b[2] * cap, top: y + J.b[1] * cap, bottom: y + J.b[3] * cap };
}
