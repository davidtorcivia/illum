// Copperplate's media and its hand (research/23-copperplate.md). Stage 1: shared by the direction studies
// (tests/copperplate-directions.js); nothing here is a rubricate style yet.
//
// The hand, measured on the masters (Bickham's Universal Penman, Getty scan; Champion's trade card, Met 779212; van de
// Velde's Spieghel, Met 358328):
//   slant      round-hand capitals and text 54-57 deg from the horizontal, each stroke its own +-4 deg
//   shade      a flourish's shade is a lens laid on a sweep that runs near the composition's shade axis (0040: .55 of
//              the strokes within 15 deg of it shaded, .2 at 45, none past 60); one lens a sweep, 15-22 times as long as
//              it is wide, its peak .39 of the way from its nearer end, full-bodied (mean width .77 of the peak)
//   hairline   the engraver's hairline is even along its length and about a tenth of the shade (Champion: .08-.15 mm
//              against ~1 mm); it tapers to a point at its end, or closes in a ball 3-4 hairlines across
//   curl       a terminal curl closes ~x.38 a turn (quarters .75 .78 .56 .69), 1.4 turns, ending in a hairline point
// Strokes are { p: points (piece px, ~.5 px apart), w: half-widths }. Every mark is laid as one coverage (a union of
// discs along each stroke, filled once, so overlaps never darken) and printed through the ink engine.
//   engrave(bake, L, rgb, { dpr })         intaglio: the engine's ink, crisp, almost no creep (the ink sits in a cut groove)
//   quill(bake, strokes, rgb, { dpr, box, seed })  the writing master's own pen: a pointed quill along each stroke at a
//                                          hand's pace, its swell given as pressure, pooling where the hand slows
import { inkLetter, dist } from '../inkletter.js';
import { createMedium, Pen } from '../medium.js';
import { supported } from '../writer.js';
import { noise1, resample } from '../marks.js';

export const SLANT = 55 * Math.PI / 180;
const TAU = Math.PI * 2;

// ---- paths --------------------------------------------------------------------------------------------------------------
export const cubic = (a, b, c, d, n = 48) => Array.from({ length: n + 1 }, (_, k) => { const t = k / n, u = 1 - t; return [0, 1].map(j => u * u * u * a[j] + 3 * u * u * t * b[j] + 3 * u * t * t * c[j] + t * t * t * d[j]); });
// Hogarth's line of beauty from p to q: one bow then the other
export function beauty(p, q, bow, n = 60) {
  const d = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(...d), nn = [-d[1] / L, d[0] / L];
  return cubic(p, [p[0] + d[0] / 3 + nn[0] * bow * L, p[1] + d[1] / 3 + nn[1] * bow * L], [p[0] + d[0] * 2 / 3 - nn[0] * bow * L, p[1] + d[1] * 2 / 3 - nn[1] * bow * L], q, n);
}
// an oval with its long axis at `tilt` (radians above the horizontal), from angle t0 through `turn` (radians; + runs
// clockwise on the page)
export function oval(c, a, b, tilt, t0, turn, n = 0) {
  n ||= Math.max(24, Math.ceil(Math.abs(turn) * (a + b) / 3)); const ct = Math.cos(tilt), st = Math.sin(tilt), out = [];
  for (let k = 0; k <= n; k++) { const t = t0 + turn * k / n, x = a * Math.cos(t), y = b * Math.sin(t); out.push([c[0] + x * ct + y * st, c[1] - x * st + y * ct]); }
  return out;
}
// a terminal curl from p heading h (radians): the radius closes by `per` a turn (measured .38), `turns` turns,
// sense +1 clockwise on the page
export function curl(p, h, r0, sense = 1, turns = 1.4, per = .38) {
  const out = [[p[0], p[1]]], k = Math.log(per) / TAU, ds = Math.max(.2, r0 / 40); let [x, y] = p, a = h, th = 0;
  while (th < turns * TAU) { const r = r0 * Math.exp(k * th); const da = ds / r; a += sense * da; th += da; x += Math.cos(a) * ds; y += Math.sin(a) * ds; out.push([x, y]); if (r < .6) break; }
  return out;
}
export const join = (...ps) => ps.reduce((a, p) => a.concat(a.length ? p.slice(1) : p), []);
export const shear = (pts, c, ang = SLANT) => { const k = Math.cos(ang) / Math.sin(ang); return pts.map(([x, y]) => [x - (y - c[1]) * k, y]); };
const tangent = (p, i) => { const a = p[Math.max(0, i - 2)], b = p[Math.min(p.length - 1, i + 2)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };

// The burin is steadier than any pen, but not a machine: a long curve drifts sideways a little and comes back
// (amp px, over ~lambda px), and the cut is laid at the hand's own scale. Resamples to ds.
export function burin(pts, seed, amp = .18, lambda = 70, ds = .5) {
  const p = resample(pts, ds), n = noise1(seed), ph = (seed % 97) * .37;
  return p.map((q, i) => { const t = tangent(p, i), f = Math.min(1, i / 20, (p.length - 1 - i) / 20), o = amp * f * (n(i * ds / lambda + ph) - .5) * 2; return [q[0] - t[1] * o, q[1] + t[0] * o]; });
}

// ---- the shade ----------------------------------------------------------------------------------------------------------------
// a lens: 0 at both ends, its peak `at` of the way along, full-bodied (sin^.7: the part over a third of the peak, which
// is what the master's measure saw, has a mean of ~.78 of the peak, the master's .77) and still drawn out to a point
export const lensShape = (u, at = .4) => { if (u <= 0 || u >= 1) return 0; const v = u < at ? .5 * u / at : .5 + .5 * (u - at) / (1 - at); return Math.sin(Math.PI * v) ** .7; };
// half-widths along p: hairline `hair` everywhere, and a lens on every run that heads within `tol` of the shade axis
// (a unit vector; the hand presses only when pulling that way), its peak set by the run's length (aspect ~20) up to `peak`
// (the burin goes in as a hairline and comes out as one: no lens within `margin` of the stroke's ends)
export function shade(p, { hair, peak, axis = [-1, 0], tol = 32, aspect = 20, at = .4, minRun = 6, margin = .1 }) {
  const n = p.length, w = new Float32Array(n).fill(hair), c = Math.cos(tol * Math.PI / 180), on = []; let s = 0; const S = [0];
  for (let i = 1; i < n; i++) S.push(s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  for (let i = 0; i < n; i++) { const t = tangent(p, i); on.push(t[0] * axis[0] + t[1] * axis[1] > c); }
  const m0 = Math.max(s * margin, hair * 16), m1 = s - m0; for (let i = 0; i < n; i++) if (S[i] < m0 || S[i] > m1) on[i] = false;
  for (let i = 0; i < n;) { if (!on[i]) { i++; continue; } let j = i; while (j < n - 1 && on[j + 1]) j++;
    const L = S[j] - S[i]; if (L > minRun * hair) { const pk = Math.min(peak, L / aspect); for (let k = i; k <= j; k++) w[k] = Math.max(w[k], hair + (pk - hair) * lensShape((S[k] - S[i]) / L, at)); }
    i = j + 1; }
  return w;
}
// a lens laid by hand on [u0, u1] of the stroke's length
export function lens(p, w, u0, u1, pk, at = .4) {
  let s = 0; const S = [0]; for (let i = 1; i < p.length; i++) S.push(s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  for (let i = 0; i < p.length; i++) { const u = (S[i] / s - u0) / (u1 - u0); if (u > 0 && u < 1) w[i] = Math.max(w[i], w[i] + (pk - w[i]) * lensShape(u, at)); }
  return w;
}
// the stroke's ends: 'point' (the burin lifts: the hairline runs to nothing over a few hairlines), 'ball', or 'blunt'
export function stroke(p, w, { start = 'point', end = 'point', hair = Math.min(...w), ball = 1.75 } = {}) {
  const n = p.length, taper = Math.max(3, Math.round(hair * 8 / .5)), balls = [];
  const tip = (i, f) => { w[i] = Math.min(w[i], hair * Math.max(.15, f)); };
  if (start === 'point') for (let i = 0; i < Math.min(taper, n); i++) tip(i, i / taper);
  if (end === 'point') for (let i = 0; i < Math.min(taper, n); i++) tip(n - 1 - i, i / taper);
  if (start === 'ball') balls.push([p[0], hair * ball]); if (end === 'ball') balls.push([p[n - 1], hair * ball]);
  return { p, w, balls };
}

// ---- coverage -------------------------------------------------------------------------------------------------------------
// every stroke as one union of discs (filled once, nonzero: an overlap is never darker), plus `extra(g)` (a letter), on a
// grid of res cells a px over box [x0, y0, x1, y1]
export function coverage(strokes, box, res, extra = null) {
  const [x0, y0, x1, y1] = box, W = Math.ceil((x1 - x0) * res), H = Math.ceil((y1 - y0) * res);
  const g = new OffscreenCanvas(W, H).getContext('2d', { willReadFrequently: true }); g.setTransform(res, 0, 0, res, -x0 * res, -y0 * res); g.fillStyle = '#000';
  const P = new Path2D();
  // (discs close enough that their union has no beads: a step of half the radius, never over .3 px)
  for (const S of strokes) { const { p, w } = S;
    for (let i = 0; i < p.length; i++) { const r = Math.max(.05, w[i]); P.moveTo(p[i][0] + r, p[i][1]); P.arc(p[i][0], p[i][1], r, 0, TAU);
      if (i === p.length - 1) break; const q = p[i + 1], r2 = Math.max(.05, w[i + 1]), l = Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), n = Math.ceil(l / Math.min(.3, Math.min(r, r2) * .5));
      for (let k = 1; k < n; k++) { const f = k / n, x = p[i][0] + (q[0] - p[i][0]) * f, y = p[i][1] + (q[1] - p[i][1]) * f, rr = r + (r2 - r) * f; P.moveTo(x + rr, y); P.arc(x, y, rr, 0, TAU); } }
    for (const [c, r] of S.balls ?? []) { P.moveTo(c[0] + r, c[1]); P.arc(c[0], c[1], r, 0, TAU); } }
  g.fill(P, 'nonzero'); if (extra) extra(g);
  const d = g.getImageData(0, 0, W, H).data, M = new Float32Array(W * H); for (let q = 0; q < W * H; q++) M[q] = d[q * 4 + 3] / 255;
  return { M, w: W, h: H, x0, y0, res };
}
// A capital of `face` whose cap height is `cap`, its ink box centred on (cx, cy): draw(g) fills it.
export function glyph(ch, face, cap, cx, cy) {
  const c = new OffscreenCanvas(8, 8).getContext('2d'); c.font = `200px ${face}`; const m = c.measureText(ch);
  const ref = c.measureText('H'), capH = ref.actualBoundingBoxAscent || m.actualBoundingBoxAscent, k = cap / capH;
  const w = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * k, a = m.actualBoundingBoxAscent * k, d = m.actualBoundingBoxDescent * k;
  const x = cx - w / 2 + m.actualBoundingBoxLeft * k, y = cy + (a - d) / 2, size = 200 * k;
  const draw = g => { g.font = `${size}px ${face}`; g.textBaseline = 'alphabetic'; g.fillText(ch, x, y); };
  draw.box = [x - m.actualBoundingBoxLeft * k, y - a, x - m.actualBoundingBoxLeft * k + w, y + d]; return draw;
}
// The engraver's weight: the faces' shades are ~1.4x the master's (Pinyon 8.5-10 % of the cap height against
// Champion's 6-7 %), so the shades are cut back by k of their thickness over tau0 (cells); hairlines are left alone.
// Thickness is carried from each stroke's ridge out across it (uphill only where the distance rises steeply, i.e.
// across a stroke, never along a hairline into the shade it grows from).
export function thinShades(L, k = .3, tau0 = 2) {
  const { M, w, h } = L, n = w * h, paper = new Uint8Array(n); for (let q = 0; q < n; q++) paper[q] = M[q] < .5;
  const D = dist(paper, w, h), T = Float32Array.from(D), idx = []; for (let q = 0; q < n; q++) if (!paper[q]) idx.push(q);
  idx.sort((a, b) => D[b] - D[a]);
  const nb = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  for (const q of idx) { const i = q % w, j = q / w | 0;
    for (const [dx, dy, l] of nb) { const x = i + dx, y = j + dy; if (x < 0 || y < 0 || x >= w || y >= h) continue; const o = y * w + x; if ((D[o] - D[q]) / l > .7 && T[o] > T[q]) T[q] = T[o]; } }
  const O = new Float32Array(n);
  for (let q = 0; q < n; q++) { if (!M[q]) continue; const e = k * Math.max(0, T[q] - tau0); O[q] = e > 0 ? Math.min(M[q], Math.max(0, Math.min(1, D[q] - e))) : M[q]; }
  return { ...L, M: O };
}

// ---- the media ----------------------------------------------------------------------------------------------------------------
// Intaglio: the ink lies in the cut and is pressed out onto the paper whole: the engine's coat with almost no creep and
// no drying at the rim (a pen's pooling is wrong here); the crispness is the engraving's.
export function engrave(bake, L, rgb, { dpr = 2, wet = .03, dry = .04 } = {}) { inkLetter(bake, { ...L, wet, dry }, rgb, { dpr }); }

// The writing master's pen (after kit/styles/nouveau-ink.js inkWrite, the approved pointed pen): each stroke written at
// a hand's pace, quick on the long runs and slower into turns and at its ends, its designed swell given as pressure, so the
// ink pools where the hand slows; iron-gall ink, a little wet.
let shared = null;
function mediumFor(w, h, dpr) {
  if (shared && shared.cv.width >= w && shared.cv.height >= h && shared.dpr === dpr && !shared.Md.gl.isContextLost()) return shared;
  if (shared && shared.dpr === dpr && !shared.Md.gl.isContextLost()) { shared.Md.resize(Math.max(w, 640), Math.max(h, 640)); shared.Md.settings.over = true; return shared; }
  shared?.Md.gl.getExtension('WEBGL_lose_context')?.loseContext();
  const cv = document.createElement('canvas'); cv.width = Math.max(w, 640); cv.height = Math.max(h, 640);
  const Md = createMedium(cv, { dpr, paper: [255, 255, 255] }); Md.settings.over = true;
  return shared = { cv, Md, dpr };
}
function pace(p, vmax) {
  const n = p.length, t = [0];
  for (let i = 1; i < n; i++) { const a = p[Math.max(0, i - 4)], b = p[i], c = p[Math.min(n - 1, i + 4)];
    const h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0]); let dh = h2 - h1; dh -= Math.round(dh / TAU) * TAU;
    const R = Math.hypot(c[0] - a[0], c[1] - a[1]) / 2 / (Math.abs(dh) + 1e-4), f = i / (n - 1);
    const v = vmax * Math.min(1, Math.sqrt(R / 60)) * (.25 + .75 * Math.sin(Math.min(1, f * 6, (1 - f) * 5) * Math.PI / 2));
    t.push(t[i - 1] + Math.hypot(b[0] - p[i - 1][0], b[1] - p[i - 1][1]) / Math.max(.02, v)); }
  return t;
}
export function quill(bake, strokes, rgb, { dpr = 2, box, seed = 1, wet = .3, speed = .8 } = {}) {
  if (!supported()) return false;
  const ox = Math.floor(box[0]), oy = Math.floor(box[1]), cw = Math.ceil((box[2] - ox) * dpr), ch = Math.ceil((box[3] - oy) * dpr), { cv, Md } = mediumFor(cw, ch, dpr);
  Md.clear(); Md.wetness(wet); Md.settings.ink = rgb; Md.makePaper([ox * dpr, oy * dpr], [0, 0, cw, ch]);
  const pen = new Pen(Md, { exact: true, flex: 0, use: 3, angle: .62 }), wob = noise1(seed ^ 0x3c);
  for (const S of strokes) {
    const hair = Math.max(.28, Math.min(...S.w)), T = pace(S.p, speed), ph = (seed % 31) * 1.7;
    pen.dip(); pen.width = .12; pen.hairline = hair * 2;
    for (let i = 0; i < S.p.length; i++) pen.hand(S.p[i][0] - ox, S.p[i][1] - oy, .5, T[i], S.w[i] / hair * (1 + .08 * (wob(i * .01 + ph) - .5)));
    for (let t = 0, end = T.at(-1) + 60; t <= end; t += 8) { pen.update(t); Md.step(8); }
    pen.lift(); Md.step(16);
    for (const [c, r] of S.balls ?? []) {   // a dot: the pen set down and lifted, the ink a little pool
      const R = Math.ceil((r + 1) * dpr), nn = 2 * R + 1, D = new Uint8Array(nn * nn * 4);
      for (let j = 0; j < nn; j++) for (let i = 0; i < nn; i++) { const d = Math.hypot(i - R, j - R) / dpr, cc = Math.max(0, Math.min(1, r - d + .5)); if (!cc) continue; const q = (j * nn + i) * 4; D[q] = cc * 255; D[q + 1] = 170; }
      Md.pour(D, nn, nn, [(c[0] - ox) * dpr - R, (c[1] - oy) * dpr - R, nn, nn]); }
  }
  for (let k = 0; k < 18; k++) Md.step(16);
  Md.finish(); Md.render([0, 0, cw, ch]);
  bake.save(); bake.setTransform(1, 0, 0, 1, 0, 0); bake.drawImage(cv, 0, 0, cw, ch, Math.round(ox * dpr), Math.round(oy * dpr), cw, ch); bake.restore();
  return true;
}
