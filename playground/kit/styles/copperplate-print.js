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
// The flexible pointed pen's weight (stage 3; measured on Bickham's oval, Universal Penman 0040, and the pen refs): the nib
// opens as the hand pulls along the shade axis and closes off it. Pressure's target at each point: how nearly the stroke
// heads along the axis, (cos d - cos f) / (1 - cos f) for d inside the falloff f (70 deg: the master's width is ~.8 of its
// peak 30 deg off the axis, ~.55 at 45, ~.25 at 60, hairline past 70); pulled the other way it presses `reverse` as hard
// (0 for the pen, which cannot shade an up-stroke; the engraver shades both sides of an oval, the far one ~.75 as hard).
// The hand's pressure follows its target with a lag (a quarter of the local radius), so it builds and releases smoothly and
// is fullest a little past the middle of the down-sweep. A tight turn cannot carry a full shade: the peak is held to ~.09
// of the local radius (the master: 8 px on a 95 px loop). The hairline is never constant: it swells a little where the
// hand slows (t: the hand's time at each point, ms) and thins where it is quick.
//   press(p, t, { hair, peak, axis, reverse, falloff, lag }) -> half-widths
export function press(p, t, { hair, peak, axis, reverse = 0, falloff = 62, lag = .25, tight = .09, slow = .3 }) {
  const n = p.length, c0 = Math.cos(falloff * Math.PI / 180), w = new Float32Array(n), R = new Float32Array(n), v = new Float32Array(n);
  const al = Math.hypot(axis[0], axis[1]), ax = [axis[0] / al, axis[1] / al];
  for (let i = 0; i < n; i++) { const a = p[Math.max(0, i - 4)], b = p[i], c = p[Math.min(n - 1, i + 4)];
    const h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0]); let dh = h2 - h1; dh -= Math.round(dh / TAU) * TAU;
    R[i] = Math.min(1e4, Math.hypot(c[0] - a[0], c[1] - a[1]) / 2 / (Math.abs(dh) + 1e-6));
    const j0 = Math.max(0, i - 2), j1 = Math.min(n - 1, i + 2); v[i] = t ? Math.hypot(p[j1][0] - p[j0][0], p[j1][1] - p[j0][1]) / Math.max(1e-3, t[j1] - t[j0]) : 1; }
  let vmax = 0; for (let i = 0; i < n; i++) vmax = Math.max(vmax, v[i]);
  let P = 0;
  for (let i = 0; i < n; i++) { const tg = tangent(p, i), a = tg[0] * ax[0] + tg[1] * ax[1];
    const target = Math.max(Math.max(0, (a - c0) / (1 - c0)), reverse * Math.max(0, (-a - c0) / (1 - c0)));
    const ds = i ? Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]) : 0, tau = Math.max(1.5, Math.min(14, lag * R[i]));
    P += (target - P) * Math.min(1, ds / tau);
    const pk = Math.max(hair * 1.5, Math.min(peak, tight * R[i] * 2)), hr = hair * (1 + slow * (1 - v[i] / (vmax || 1)) - slow * .35);
    w[i] = hr + Math.max(0, pk - hr) * P * P * (3 - 2 * P); }
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
// every stroke as one ribbon union (filled once, nonzero: an overlap is never darker), plus `extra(g)` (a letter), on a
// grid of res cells a px over box [x0, y0, x1, y1]
export function coverage(strokes, box, res, extra = null) {
  const [x0, y0, x1, y1] = box, W = Math.ceil((x1 - x0) * res), H = Math.ceil((y1 - y0) * res);
  const g = new OffscreenCanvas(W, H).getContext('2d', { willReadFrequently: true }); g.setTransform(res, 0, 0, res, -x0 * res, -y0 * res); g.fillStyle = '#000';
  const P = new Path2D();
  // each stroke as a ribbon of quads, one a step, each edge at a point shared exactly with the next quad's (the normal at that
  // point), all wound the same way, so the one fill is their seamless union; a disc at each end and where the ribbon turns
  // sharper than its width can follow (a cusp). (Was a union of discs a fraction of a px apart: the same shape, ten times
  // the work at a fine hairline.)
  for (const S of strokes) { const { p, w } = S, n = p.length; if (!n) continue;
    const L = [], R = [];
    for (let i = 0; i < n; i++) { const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, r = Math.max(.05, w[i]);
      L.push([p[i][0] - dy / l * r, p[i][1] + dx / l * r]); R.push([p[i][0] + dy / l * r, p[i][1] - dx / l * r]); }
    // (one outline a stroke: its left edge out and its right edge back; every stretch of the ribbon is wound the same way, so
    // where the stroke crosses itself the winding adds and nonzero fills it)
    if (n > 1) { P.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) P.lineTo(L[i][0], L[i][1]); for (let i = n - 1; i >= 0; i--) P.lineTo(R[i][0], R[i][1]); P.closePath(); }
    const disc = i => { const r = Math.max(.05, w[i]); P.moveTo(p[i][0] + r, p[i][1]); P.arc(p[i][0], p[i][1], r, 0, TAU); };
    disc(0); disc(n - 1);
    for (let i = 1; i < n - 1; i++) { if (w[i] < .6) continue; const a = p[i - 1], b = p[i], c = p[i + 1], h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0]); let dh = Math.abs(h2 - h1); if (dh > Math.PI) dh = TAU - dh;
      if (dh * w[i] > Math.hypot(c[0] - b[0], c[1] - b[1]) * .5) disc(i); }
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
  draw.stroke = g => { g.font = `${size}px ${face}`; g.textBaseline = 'alphabetic'; g.strokeText(ch, x, y); };
  draw.box = [x - m.actualBoundingBoxLeft * k, y - a, x - m.actualBoundingBoxLeft * k + w, y + d]; return draw;
}
// The engraver's weight: the faces' shades are ~1.4x the master's (Pinyon 8.5-10 % of the cap height against
// Champion's 6-7 %), so the shades are cut back by k of their thickness over tau0 (cells); hairlines are left alone.
// Thickness is carried from each stroke's ridge out across it (uphill only where the distance rises steeply, i.e.
// across a stroke, never along a hairline into the shade it grows from).
// cutShades: the same cut, but each edge is the face's own outline offset inward along its normal (the glyph drawn and its
// outline stroked away at a ladder of widths, so every edge stays a true, smooth, symmetric vector curve with sharp
// corners), each cell taking the offset its stroke's thickness asks (k of it over tau0, the thickness carried as
// thinShades carries it), between the two nearest rungs. draw: the glyph's draw(g) (from glyph()).
export function cutShades(L, draw, { k = .4, tau0 = 2, step = .7 } = {}) {
  const { M, w, h, x0, y0, res } = L, n = w * h, paper = new Uint8Array(n); for (let q = 0; q < n; q++) paper[q] = M[q] < .5;
  const D = dist(paper, w, h), T = Float32Array.from(D), idx = []; for (let q = 0; q < n; q++) if (!paper[q]) idx.push(q);
  idx.sort((a, b) => D[b] - D[a]);
  const nb = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  for (const q of idx) { const i = q % w, j = q / w | 0;
    for (const [dx, dy, l] of nb) { const x = i + dx, y = j + dy; if (x < 0 || y < 0 || x >= w || y >= h) continue; const o = y * w + x; if ((D[o] - D[q]) / l > .7 && T[o] > T[q]) T[q] = T[o]; } }
  // the offset each cell asks (cells), its fringe taking its stroke's; the ladder of eroded glyphs
  const E = new Float32Array(n); let emax = 0;
  for (let q = 0; q < n; q++) { if (!M[q]) continue; let t = T[q];
    if (paper[q]) { const i = q % w, j = q / w | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = i + dx, y = j + dy; if (x >= 0 && y >= 0 && x < w && y < h && !paper[y * w + x]) t = Math.max(t, T[y * w + x]); } }
    E[q] = k * Math.max(0, t - tau0); if (E[q] > emax) emax = E[q]; }
  const rungs = Math.max(1, Math.ceil(emax / step)), lad = [M], g = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
  for (let r = 1; r <= rungs; r++) { const e = r * step;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.setTransform(res, 0, 0, res, -x0 * res, -y0 * res); g.globalCompositeOperation = 'source-over'; g.fillStyle = g.strokeStyle = '#000'; draw(g);
    g.globalCompositeOperation = 'destination-out'; g.lineWidth = 2 * e / res; g.lineJoin = 'miter'; g.miterLimit = 8;
    strokeGlyph(g, draw); g.globalCompositeOperation = 'source-over';
    const d = g.getImageData(0, 0, w, h).data, R = new Float32Array(n); for (let q = 0; q < n; q++) R[q] = d[q * 4 + 3] / 255; lad.push(R); }
  const O = new Float32Array(n);
  for (let q = 0; q < n; q++) { if (!M[q]) continue; const f = E[q] / step, a = Math.min(rungs, Math.floor(f)), b = Math.min(rungs, a + 1), u = Math.min(1, f - a);
    O[q] = Math.min(M[q], lad[a][q] * (1 - u) + lad[b][q] * u); }
  return { ...L, M: O };
}
// the glyph's outline stroked (draw.stroke, from glyph(); a fill-only draw falls back to the fill)
const strokeGlyph = (g, draw) => draw.stroke ? draw.stroke(g) : draw(g);
// thinShadesFine: thinShades worked at `ss` times the grid and box-filtered back down, so the cut's cell steps fall below a
// cell and its edge comes back smooth and anti-aliased (the plain cut, at the grid's own size, steps and waves at 4x)
// The cut rounds a letter's inner corners (eroding an outline rounds its reflex corners: the joins pinch and bite), so the
// cut letter is closed again over its own body (dilated and eroded back by r, about the cut's depth): a notch narrower than
// r fills, a stroke keeps its new weight, and nothing grows past the face's own outline.
export function thinShadesFine(draw, box, res, k = .4, tau0 = 2, ss = 3, close = 1) {
  const L0 = coverage([], box, res * ss, draw), F = thinShades(L0, k, tau0 * ss);
  if (close) { const n = F.w * F.h, inkB = new Uint8Array(n), out = new Uint8Array(n); let emax = 0;
    for (let q = 0; q < n; q++) { inkB[q] = F.M[q] > .5; if (L0.M[q] > .5 && F.M[q] <= .5) emax++; }
    // (r: the cut's depth, k of the heaviest stroke's half-width over tau0, in fine cells)
    const Din = dist(Uint8Array.from(L0.M, v => v < .5), F.w, F.h); let tmax = 0; for (let q = 0; q < n; q++) if (Din[q] > tmax) tmax = Din[q];
    const r = Math.max(1, close * k * Math.max(0, tmax - tau0 * ss));
    const Dout = dist(inkB, F.w, F.h); for (let q = 0; q < n; q++) out[q] = Dout[q] > r;   // outside the dilation
    const Dback = dist(out, F.w, F.h);
    for (let q = 0; q < n; q++) if (Dback[q] > r + .5 && L0.M[q] > F.M[q]) F.M[q] = Math.min(L0.M[q], Math.max(F.M[q], Math.min(1, Dback[q] - r)));
    void emax; }
  const w = Math.ceil((box[2] - box[0]) * res), h = Math.ceil((box[3] - box[1]) * res), M = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let a = 0; for (let y = 0; y < ss; y++) { const r = (j * ss + y) * F.w; if (j * ss + y >= F.h) break; for (let x = 0; x < ss; x++) if (i * ss + x < F.w) a += F.M[r + i * ss + x]; } M[j * w + i] = a / (ss * ss); }
  return { M, w, h, x0: box[0], y0: box[1], res };
}
// the ink cells deepest first (a bucket sort by the distance to paper, in quarter cells: the order the thickness is carried in)
function byDepth(D, paper, n) {
  let mx = 0; for (let q = 0; q < n; q++) if (!paper[q] && D[q] > mx) mx = D[q];
  const B = Math.ceil(mx * 4) + 1, cnt = new Int32Array(B + 1); for (let q = 0; q < n; q++) if (!paper[q]) cnt[B - 1 - Math.floor(D[q] * 4)]++;
  for (let b = 1; b <= B; b++) cnt[b] += cnt[b - 1]; const out = new Int32Array(cnt[B]), at = new Int32Array(B + 1); at.set(cnt.subarray(0, B), 1);
  for (let q = 0; q < n; q++) if (!paper[q]) out[at[B - 1 - Math.floor(D[q] * 4)]++] = q;
  return out;
}
export function thinShades(L, k = .3, tau0 = 2) {
  const { M, w, h } = L, n = w * h, paper = new Uint8Array(n); for (let q = 0; q < n; q++) paper[q] = M[q] < .5;
  const D = dist(paper, w, h), T = Float32Array.from(D), idx = byDepth(D, paper, n);
  const nb = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  for (let z = 0; z < idx.length; z++) { const q = idx[z], i = q % w, j = q / w | 0;
    for (const [dx, dy, l] of nb) { const x = i + dx, y = j + dy; if (x < 0 || y < 0 || x >= w || y >= h) continue; const o = y * w + x; if ((D[o] - D[q]) / l > .7 && T[o] > T[q]) T[q] = T[o]; } }
  const O = new Float32Array(n);
  for (let q = 0; q < n; q++) { if (!M[q]) continue; let t = T[q];
    // (the face's own anti-aliased fringe, outside its threshold, goes with the edge it belonged to: else a cut-back shade
    // leaves a ghost of its old outline, a ring of faint cells)
    if (paper[q]) { const i = q % w, j = q / w | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = i + dx, y = j + dy; if (x >= 0 && y >= 0 && x < w && y < h && !paper[y * w + x]) t = Math.max(t, T[y * w + x]); } }
    const e = k * Math.max(0, t - tau0); O[q] = e > 0 ? (paper[q] ? (e > .3 ? 0 : M[q]) : Math.min(M[q], Math.max(0, Math.min(1, D[q] - e)))) : M[q]; }
  return { ...L, M: O };
}

// ---- the media ----------------------------------------------------------------------------------------------------------------
// Intaglio: the ink lies in the cut and is pressed out onto the paper whole: the engine's coat with almost no creep and
// no drying at the rim (a pen's pooling is wrong here); the crispness is the engraving's.
// flat: the coverage laid as it is (its own anti-aliasing the only softness): an engraver's line can be finer than the ink
// engine can hold (the engine breaks a line under ~1.2 device px into beads), and a fine engraved line is black, only
// narrow, so a hairline narrower than a pixel is laid as the share of the pixel it covers
// tint (0..1 a cell) and rgb2: where the ink lies deeper (a pen's pool, poolMap()), its colour toward rgb2
export function engrave(bake, L, rgb, { dpr = 2, wet = .03, dry = .04, flat = false, tint = null, rgb2 = null } = {}) {
  if (!flat) { inkLetter(bake, { ...L, wet, dry }, rgb, { dpr }); return; }
  const { M, w, h, x0, y0, res } = L, c = new OffscreenCanvas(w, h), g = c.getContext('2d'), im = g.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { if (!M[i]) continue; const k = tint ? tint[i] : 0;
    for (let j = 0; j < 3; j++) im.data[i * 4 + j] = Math.round(rgb[j] + (k ? (rgb2[j] - rgb[j]) * k : 0)); im.data[i * 4 + 3] = Math.round(Math.min(1, M[i]) * 255); }
  g.putImageData(im, 0, 0); bake.save(); bake.setTransform(dpr, 0, 0, dpr, 0, 0); bake.imageSmoothingQuality = 'high'; bake.drawImage(c, x0, y0, w / res, h / res); bake.restore();
}

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
// quillWriter: the strokes written one after another at the hand's pace (each stroke's t, ms; a lift of 120 ms between),
// the medium's window shown live over the page at `pos` in `host` while it writes, then pressed into bake. .at(f) f 0..1,
// .done(), .dur (ms). quill(): the same, written at once.
export function quillWriter(bake, strokes, rgb, { dpr = 2, box, seed = 1, wet = .3, speed = .8, host = null, pos = [0, 0], rough = null, rim = null } = {}) {
  if (!supported()) return { dur: 0, at() {}, done() {} };
  const plan = []; let T0 = 0;
  for (const S of strokes) { const T = S.t ?? pace(S.p, speed); plan.push({ S, T, start: T0 }); T0 += T.at(-1) + 60 + 120; }
  const ox = Math.floor(box[0]), oy = Math.floor(box[1]), cw = Math.ceil((box[2] - ox) * dpr), ch = Math.ceil((box[3] - oy) * dpr), wob = noise1(seed ^ 0x3c);
  let cv = null, Md = null, pen = null, now = 0, k = -1, fin = false;
  const open = () => { ({ cv, Md } = mediumFor(cw, ch, dpr)); Md.clear(); Md.wetness(wet); Md.settings.ink = rgb; if (rough != null) Md.settings.rough = rough; if (rim != null) Md.settings.rim = rim; Md.makePaper([ox * dpr, oy * dpr], [0, 0, cw, ch]);
    pen = new Pen(Md, { exact: true, flex: 0, use: 1.2, angle: .62 });
    if (host) { Object.assign(cv.style, { position: 'absolute', left: pos[0] + ox + 'px', top: pos[1] + oy + 'px', width: cv.width / dpr + 'px', height: cv.height / dpr + 'px', pointerEvents: 'none' }); cv.setAttribute('aria-hidden', 'true'); host.append(cv); } };
  // a dot: the pen set down and lifted, the ink a little pool
  const balls = S => { for (const [c, r] of S.balls ?? []) { const R = Math.ceil((r + 1) * dpr), nn = 2 * R + 1, D = new Uint8Array(nn * nn * 4);
    for (let j = 0; j < nn; j++) for (let i = 0; i < nn; i++) { const d = Math.hypot(i - R, j - R) / dpr, cc = Math.max(0, Math.min(1, r - d + .5)); if (!cc) continue; const q = (j * nn + i) * 4; D[q] = cc * 255; D[q + 1] = 170; }
    Md.pour(D, nn, nn, [(c[0] - ox) * dpr - R, (c[1] - oy) * dpr - R, nn, nn]); } };
  const begin = j => { const { S, T, start } = plan[j], hair = Math.max(.28, Math.min(...S.w)), ph = (seed % 31) * 1.7 + j;
    pen.reset(); pen.dip(); pen.width = .12; pen.hairline = hair * 2;
    for (let i = 0; i < S.p.length; i++) pen.hand(S.p[i][0] - ox, S.p[i][1] - oy, .5, start + T[i], S.w[i] / hair * (1 + .08 * (wob(i * .01 + ph) - .5))); pen.tt = start; };
  const advance = until => { if (!Md) open();
    for (; now < until; now += 8) {
      const j = plan.findIndex((P, q) => now >= P.start && (q === plan.length - 1 || now < plan[q + 1].start));
      if (j !== k) { if (k >= 0) { pen.lift(); balls(plan[k].S); } k = j; if (k >= 0) begin(k); }
      // (a quill's slit holds ink and feeds it down as the hand goes: along a long hairline the pen stays charged and the
      // line stays whole rather than running dry into the paper's tooth)
      if (k >= 0 && now <= plan[k].start + plan[k].T.at(-1) + 60) { pen.update(now); if (pen.charge < .7) pen.charge += (.7 - pen.charge) * .02; }
      Md.step(8); } };
  const self = { dur: T0,
    at(f) { if (fin) return; advance(Math.min(1, f) * T0); Md.render(); },
    done() { if (fin) return; advance(T0); if (k >= 0) { pen.lift(); balls(plan[k].S); k = plan.length; }
      for (let q = 0; q < 18; q++) Md.step(16); Md.finish(); Md.render([0, 0, cw, ch]);
      bake.save(); bake.setTransform(1, 0, 0, 1, 0, 0); bake.drawImage(cv, 0, 0, cw, ch, Math.round(ox * dpr), Math.round(oy * dpr), cw, ch); bake.restore();
      if (cv.parentNode) cv.remove(); fin = true; } };
  return self;
}
export function quill(bake, strokes, rgb, o = {}) { if (!supported()) return false; quillWriter(bake, strokes, rgb, { ...o, host: null }).done(); return true; }

// engraveWriter: the engraved strokes cut as you watch, along each stroke in the order and at the pace the hand made it
// (each stroke's t, ms; a lift of 120 ms between): the finished print is made at once, and each device pixel takes the
// time of the nearest point of the stroke that laid it; .at(f) lays the pixels whose time has come (each once, onto bake,
// over what is there), so the cut runs along the line with a crisp front and nothing fades. L: the strokes' coverage.
// cellT (0..1 a cell of L, e.g. a letter's skeleton order from letterWriter) and dur: cut in that order instead of along strokes
export function engraveWriter(bake, L, strokes, rgb, { dpr = 2, flat = false, cellT = null, dur = 1300, tint = null, rgb2 = null } = {}) {
  const W = bake.canvas.width, H = bake.canvas.height, off = new OffscreenCanvas(W, H), og = off.getContext('2d', { willReadFrequently: true });
  engrave(og, L, rgb, { dpr, flat, tint, rgb2 }); const fin = og.getImageData(0, 0, W, H);
  // the time of each coverage cell: the earliest point of any stroke whose disc (its width and a px of creep) covers it
  const { w, h, res } = L, Tc = new Float32Array(w * h).fill(Infinity); let T0 = 0;
  if (cellT) { for (let q = 0; q < w * h; q++) if (L.M[q] > .01) Tc[q] = cellT[q] * dur; T0 = dur; }
  for (const S of strokes) { const T = S.t ?? pace(S.p);
    for (let i = 0; i < S.p.length; i++) { const [x, y] = S.p[i], rr = (S.w[i] + 1.4) * res, cx = (x - L.x0) * res, cy = (y - L.y0) * res, t = T0 + T[i];
      for (let j = Math.max(0, Math.floor(cy - rr)); j <= Math.min(h - 1, Math.ceil(cy + rr)); j++) for (let q = Math.max(0, Math.floor(cx - rr)); q <= Math.min(w - 1, Math.ceil(cx + rr)); q++) {
        const o = j * w + q; if (t < Tc[o] && (q - cx) ** 2 + (j - cy) ** 2 <= rr * rr) Tc[o] = t; } }
    for (const [c, r] of S.balls ?? []) { const rr = (r + 1.4) * res, cx = (c[0] - L.x0) * res, cy = (c[1] - L.y0) * res, t = T0 + T.at(-1) + 40;
      for (let j = Math.max(0, Math.floor(cy - rr)); j <= Math.min(h - 1, Math.ceil(cy + rr)); j++) for (let q = Math.max(0, Math.floor(cx - rr)); q <= Math.min(w - 1, Math.ceil(cx + rr)); q++) { const o = j * w + q; if (t < Tc[o]) Tc[o] = t; } }
    T0 += T.at(-1) + 60 + 120; }
  const ids = [], tt = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const q = y * W + x; if (!fin.data[q * 4 + 3]) continue;
    const cx = Math.min(w - 1, Math.max(0, Math.floor((x / dpr - L.x0) * res))), cy = Math.min(h - 1, Math.max(0, Math.floor((y / dpr - L.y0) * res))), t = Tc[cy * w + cx];
    ids.push(q); tt.push(Number.isFinite(t) ? t : T0); }
  const order = Int32Array.from(ids.map((_, k) => k).sort((a, b) => tt[a] - tt[b]).map(k => ids[k])), times = Float32Array.from(tt).sort();
  const buf = new ImageData(W, H), scratch = new OffscreenCanvas(W, H), sg = scratch.getContext('2d'); let at = 0, done = false;
  const lay = upto => { if (upto <= at) return; let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let k = at; k < upto; k++) { const q = order[k], p = q * 4; buf.data[p] = fin.data[p]; buf.data[p + 1] = fin.data[p + 1]; buf.data[p + 2] = fin.data[p + 2]; buf.data[p + 3] = fin.data[p + 3];
      const x = q % W, y = q / W | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    sg.clearRect(0, 0, W, H); sg.putImageData(buf, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    bake.save(); bake.setTransform(1, 0, 0, 1, 0, 0); bake.drawImage(scratch, 0, 0); bake.restore();
    for (let k = at; k < upto; k++) { const p = order[k] * 4; buf.data[p] = buf.data[p + 1] = buf.data[p + 2] = buf.data[p + 3] = 0; }
    at = upto; };
  return { dur: T0,
    at(f) { if (done) return; const now = Math.min(1, f) * T0; let lo = at, hi = times.length; while (lo < hi) { const m = (lo + hi) >> 1; if (times[m] <= now) lo = m + 1; else hi = m; } lay(lo); },
    done() { if (done) return; lay(order.length); done = true; } };
}

// ---- a capital written by the pen ---------------------------------------------------------------------------------------------
// The face's letter as the strokes of a pen: its skeleton (Zhang & Suen's thinning at a cell a px) walked into strokes, each
// from an end (the topmost first), on along the straightest way at a fork, the skeleton's half-width (the distance to paper)
// carried as the stroke's width, so the pen lays the face's own thicks and thins and pools and runs as the flourish does.
// L: the letter's coverage { M, w, h, x0, y0, res }. Returns strokes { p, w } in page px.
export function glyphStrokes(L, { min = 3 } = {}) {
  const { M, w, h, x0, y0, res } = L, k = Math.max(1, Math.round(res)), sw = Math.ceil(w / k) + 2, sh = Math.ceil(h / k) + 2, B = new Uint8Array(sw * sh), I = new Uint8Array(sw * sh);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (M[j * w + i] > .5) B[(Math.floor(j / k) + 1) * sw + Math.floor(i / k) + 1]++;
  for (let q = 0; q < B.length; q++) { B[q] = B[q] * 2 >= k * k ? 1 : 0; I[q] = B[q]; }
  const paper = new Uint8Array(sw * sh); for (let q = 0; q < B.length; q++) paper[q] = !I[q]; const D = dist(paper, sw, sh);
  for (let changed = true; changed;) { changed = false;
    for (const pass of [0, 1]) { const del = [];
      for (let j = 1; j < sh - 1; j++) for (let i = 1; i < sw - 1; i++) { const q = j * sw + i; if (!B[q]) continue;
        const P = [B[q - sw], B[q - sw + 1], B[q + 1], B[q + sw + 1], B[q + sw], B[q + sw - 1], B[q - 1], B[q - sw - 1]], n = P.reduce((a, v) => a + v, 0);
        if (n < 2 || n > 6) continue; let a = 0; for (let t = 0; t < 8; t++) a += !P[t] && P[(t + 1) % 8]; if (a !== 1) continue;
        if (pass ? P[0] * P[2] * P[6] || P[0] * P[4] * P[6] : P[0] * P[2] * P[4] || P[2] * P[4] * P[6]) continue; del.push(q); }
      for (const q of del) B[q] = 0; if (del.length) changed = true; } }
  const N8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]], seen = new Uint8Array(sw * sh);
  const nbs = q => N8.map(([dx, dy]) => q + dy * sw + dx).filter(o => B[o]), out = [];
  const px = q => [x0 + ((q % sw) - 1 + .5) * k / res, y0 + (((q / sw) | 0) - 1 + .5) * k / res];
  for (;;) { let st = -1, best = Infinity;
    for (let q = 0; q < B.length; q++) if (B[q] && !seen[q]) { const end = nbs(q).filter(o => !seen[o]).length <= 1, v = (q / sw | 0) * 2 + (q % sw) * .5 - (end ? 1e5 : 0); if (v < best) { best = v; st = q; } }
    if (st < 0) break;
    const path = [st]; seen[st] = 1; let cur = st, dir = null;
    for (;;) { const c = nbs(cur).filter(o => !seen[o]); if (!c.length) break;
      const pick = dir ? c.reduce((a, o) => { const v = [(o % sw) - (cur % sw), (o / sw | 0) - (cur / sw | 0)], l = Math.hypot(...v), sc = (v[0] * dir[0] + v[1] * dir[1]) / l; return !a || sc > a.sc ? { o, sc } : a; }, null).o : c[0];
      for (const o of c) if (o !== pick && Math.abs((o % sw) - (pick % sw)) <= 1 && Math.abs((o / sw | 0) - (pick / sw | 0)) <= 1) seen[o] = 1;   // (the stair beside it)
      const v = [(pick % sw) - (cur % sw), (pick / sw | 0) - (cur / sw | 0)], l = Math.hypot(...v), nd = [v[0] / l, v[1] / l]; dir = dir ? [dir[0] * .6 + nd[0] * .4, dir[1] * .6 + nd[1] * .4] : nd;
      seen[pick] = 1; path.push(pick); cur = pick; }
    if (path.length < min) continue;
    const p = path.map(px), ww = Float32Array.from(path, q => Math.max(.3, (D[q] - .5) * k / res));
    // (the width smoothed along the stroke: the skeleton's distance steps by whole cells)
    const sm = Float32Array.from(ww, (_, i) => { let a = 0, n = 0; for (let j = Math.max(0, i - 2); j <= Math.min(ww.length - 1, i + 2); j++) { a += ww[j]; n++; } return a / n; });
    // (the skeleton's cell stair smoothed out of the path: a running mean over ~3 px, its ends held)
    const r = Math.max(1, Math.round(3 * res / k)), ps = p.map((_, i) => { const m = Math.min(r, i, p.length - 1 - i); let x = 0, y = 0; for (let j = i - m; j <= i + m; j++) { x += p[j][0]; y += p[j][1]; } return [x / (2 * m + 1), y / (2 * m + 1)]; });
    out.push({ p: resample(ps, .5), w: null, _w: sm, _n: p.length });
  }
  // (widths onto the resampled points)
  for (const S of out) { const n = S.p.length; S.w = Float32Array.from({ length: n }, (_, i) => S._w[Math.min(S._n - 1, Math.round(i * (S._n - 1) / Math.max(1, n - 1)))]); delete S._w; delete S._n; S.balls = []; }
  return out;
}

// Where a pen's ink lies deeper, on L's grid (0..1): where the hand was slow (its time per px well over the stroke's own
// median: into a turn, at the swell's end where the pressure is let go, the touch-down and the lift) and at the stroke's ends;
// a stroke's own causes, never a texture. strokes: { p, w, t }.
export function poolMap(strokes, L) {
  const { w, h, x0, y0, res } = L, P = new Float32Array(w * h);
  for (const S of strokes) { if (!S.t) continue; const n = S.p.length, sl = [];
    for (let i = 0; i < n; i++) { const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2), d = Math.hypot(S.p[b][0] - S.p[a][0], S.p[b][1] - S.p[a][1]); sl.push((S.t[b] - S.t[a]) / Math.max(.05, d)); }
    const med = sl.slice().sort((a, b) => a - b)[n >> 1] || 1;
    for (let i = 0; i < n; i++) { const end = Math.max(0, 1 - Math.min(i, n - 1 - i) / 10), k = Math.min(1, Math.max(end * .8, (sl[i] / med - 1.3) / 2.5)); if (k <= 0) continue;
      const rr = (S.w[i] + .6) * res, cx = (S.p[i][0] - x0) * res, cy = (S.p[i][1] - y0) * res;
      for (let j = Math.max(0, Math.floor(cy - rr)); j <= Math.min(h - 1, Math.ceil(cy + rr)); j++) for (let q = Math.max(0, Math.floor(cx - rr)); q <= Math.min(w - 1, Math.ceil(cx + rr)); q++) {
        if ((q - cx) ** 2 + (j - cy) ** 2 > rr * rr) continue; const o = j * w + q; if (k > P[o]) P[o] = k; } } }
  return P;
}
