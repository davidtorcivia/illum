// Insular interlace, spiral and dot work as geometry, and a small printer for it — research/20-insular.md.
//
// The knot is Allen's plait with breaks (Early Christian Monuments of Scotland, 1903, II 143–146) in Mercat's form: a grid of
// setting-out points two units apart; a crossing at the middle of every edge between two points; a break is a wall on an
// edge, and a cord meeting a wall (or the region's edge) turns back. Each included cell holds a diamond of four cord pieces
// joining its edges' midpoints. On that graph over/under alternates by construction: at a horizontal edge the cord running
// along (1,1) is over, at a vertical edge the cord along (1,-1). So a knot fitted to any set of cells (a band, a corner, the
// inside of a letter) is right at every crossing and always closes.
//   plait(A, B, inc, wall) -> { threads: [{ ev: [...] }], crossings }       (topology, in grid units)
//   cords(K, { ox, oy, u, inset, round }) -> threads with smooth centrelines (page px) and crossing positions
//   Sheet: paint/knock ops on per-ink coverage, then poured one ink at a time through the ink engine (kit/inkletter.js)
import { inkLetter } from '../inkletter.js';
import { noise2, stream } from '../marks.js';

// ---- topology -------------------------------------------------------------------------------------------------------------
// A × B cells; inc(a, b): the cell is part of the knot; wall(x, y): a break on the interior edge whose midpoint is (x, y)
// (grid units: points at even coordinates, midpoints with x + y odd).
export function plait(A, B, inc = () => true, wall = () => false) {
  const IN = (a, b) => a >= 0 && b >= 0 && a < A && b < B && inc(a, b);
  const open = (x, y) => (x & 1)   // a horizontal edge: the cells above and below
    ? IN((x - 1) / 2, y / 2 - 1) && IN((x - 1) / 2, y / 2) && !wall(x, y)
    : IN(x / 2 - 1, (y - 1) / 2) && IN(x / 2, (y - 1) / 2) && !wall(x, y);
  const seen = new Set(), sk = (x, y, dx, dy) => { const x2 = x + dx, y2 = y + dy; return x < x2 || (x === x2 && y < y2) ? `${x},${y},${x2},${y2}` : `${x2},${y2},${x},${y}`; };
  const threads = [], crossings = new Map();
  for (let b = 0; b < B; b++) for (let a = 0; a < A; a++) {
    if (!IN(a, b)) continue;
    // the cell's four pieces: S→E, E→N, N→W, W→S (each a start for an untraced cord)
    for (const [x, y, dx, dy] of [[2 * a + 1, 2 * b, 1, 1], [2 * a + 2, 2 * b + 1, -1, 1], [2 * a + 1, 2 * b + 2, -1, -1], [2 * a, 2 * b + 1, 1, -1]]) {
      if (seen.has(sk(x, y, dx, dy))) continue;
      const ev = []; let cx = x, cy = y, ex = dx, ey = dy, n = 0;
      do {
        seen.add(sk(cx, cy, ex, ey)); const nx = cx + ex, ny = cy + ey, din = [ex, ey];
        if (open(nx, ny)) {   // a crossing: on through; over by the parity rule
          const over = (nx & 1) ? ex * ey > 0 : ex * ey < 0, k = `${nx},${ny}`;
          ev.push({ x: nx, y: ny, cross: true, din, dout: din, over });
          (crossings.get(k) ?? crossings.set(k, []).get(k)).push({ t: threads.length, i: ev.length - 1, over });
        } else {              // a wall: turned back across it
          if (nx & 1) ey = -ey; else ex = -ex;
          ev.push({ x: nx, y: ny, cross: false, din, dout: [ex, ey] });
        }
        cx = nx; cy = ny;
        if (++n > 4 * A * B * 4 + 8) throw new Error('plait: runaway cord');
      } while (!(cx === x && cy === y && ex === dx && ey === dy));
      // (the loop ends where it began; its first event is the start's successor)
      threads.push({ ev });
    }
  }
  return { A, B, threads, crossings };
}

// ---- geometry ---------------------------------------------------------------------------------------------------------------
// Each event becomes a point and a tangent: a crossing sits on its midpoint, heading along the diagonal; a turn sits a little
// inside the cell (inset, units) heading along the wall. Between events a cubic Hermite; a straight run between two crossings
// comes out straight, a turn a round loop (round: the tangents' length × the chord; lower is tighter). Then even arc length.
export function cords(K, { ox = 0, oy = 0, u = 10, inset = .3, round = 1.05, ds = .5, edgeInset = null, edgeRound = null } = {}) {
  const { A, B } = K, rim = (x, y) => (x & 1) ? (y === 0 || y === 2 * B) : (x === 0 || x === 2 * A);
  return K.threads.map(th => {
    const P = th.ev.map(e => {
      const px = ox + e.x * u, py = oy + e.y * u;
      if (e.cross) { const l = Math.SQRT2; return { p: [px, py], t: [e.din[0] / l, e.din[1] / l], e }; }
      const edge = rim(e.x, e.y), k = (edge && edgeInset != null ? edgeInset : inset) * u;
      // turned at a horizontal edge: it leaves along dout.y; tangent along the edge (x)
      return (e.x & 1) ? { p: [px, py + e.dout[1] * k], t: [e.din[0], 0], e, r: edge ? edgeRound : null }
                       : { p: [px + e.dout[0] * k, py], t: [0, e.din[1]], e, r: edge ? edgeRound : null };
    });
    const pts = [], at = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], c = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1]);
      const ra = (a.r ?? round) * c, rb = (b.r ?? round) * c, n = Math.max(2, Math.ceil(c * 1.6 / ds));
      at.push(pts.length);
      for (let k = 0; k < n; k++) { const s = k / n, s2 = s * s, s3 = s2 * s, h1 = 2 * s3 - 3 * s2 + 1, h2 = -2 * s3 + 3 * s2, h3 = s3 - 2 * s2 + s, h4 = s3 - s2;
        pts.push([h1 * a.p[0] + h2 * b.p[0] + h3 * a.t[0] * ra + h4 * b.t[0] * rb, h1 * a.p[1] + h2 * b.p[1] + h3 * a.t[1] * ra + h4 * b.t[1] * rb]); }
    }
    // even spacing, carrying each event's index across
    const S = [0]; for (let i = 1; i <= pts.length; i++) { const p = pts[i % pts.length], q = pts[i - 1]; S.push(S[i - 1] + Math.hypot(p[0] - q[0], p[1] - q[1])); }
    const L = S[pts.length], n = Math.max(8, Math.round(L / ds)), out = []; let j = 0;
    for (let k = 0; k < n; k++) { const s = k / n * L; while (S[j + 1] < s) j++; const f = (s - S[j]) / ((S[j + 1] - S[j]) || 1), p = pts[j], q = pts[(j + 1) % pts.length]; out.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]); }
    return { pts: out, L, ev: th.ev, s: at.map(i => S[i]) };   // s[i]: arc length of event i
  });
}

// a stretch of a closed polyline by arc length (s0 < s1, either may wrap)
export function stretch(c, s0, s1) {
  const n = c.pts.length, ds = c.L / n, o = []; o.idx = [];
  for (let s = s0; s <= s1 + 1e-6; s += ds) { const i = ((Math.round(s / ds) % n) + n) % n; o.push(c.pts[i]); o.idx.push(i); }
  return o;
}
// The hand on a cord, per point: breath (the band a little fuller where the pen ran straight and slow, leaner through a tight
// turn) and the pen line's weight (a quill cut at the nib angle: heavy where the edge runs across the nib, a hair along it).
// These are causes, not noise: heading and curvature of the cord itself.
export const NIB = .62;
function hand(c, W) {
  if (c.f) return c; const P = c.pts, n = P.length; c.f = new Float32Array(n); c.g = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = P[(i - 2 + n) % n], b = P[i], d = P[(i + 2) % n], h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(d[1] - b[1], d[0] - b[0]);
    let dh = h2 - h1; dh -= Math.round(dh / (2 * Math.PI)) * 2 * Math.PI; const k = Math.abs(dh) / (Math.hypot(d[0] - a[0], d[1] - a[1]) || 1), h = (h1 + h2) / 2;
    c.f[i] = 1 + .05 * Math.cos(2 * (h - NIB - .8)) - .09 * Math.min(1, k * W * 1.2); c.g[i] = .5 + .95 * Math.abs(Math.sin(h - NIB)); }
  // (smoothed along the cord: a pen's pressure changes over a stroke, not from point to point)
  for (const A of [c.f, c.g]) for (let it = 0; it < 3; it++) { const B = A.slice(); for (let i = 0; i < n; i++) A[i] = (B[(i - 3 + n) % n] + B[(i - 1 + n) % n] + 2 * B[i] + B[(i + 1) % n] + B[(i + 3) % n]) / 6; }
  return c;
}
export const pathOf = (pts, close = true, P = new Path2D()) => { P.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) P.lineTo(pts[i][0], pts[i][1]); if (close) P.closePath(); return P; };

// ---- the knot drawn as bands ------------------------------------------------------------------------------------------------
// layers: outermost first, [{ w, ink }] (w: full width px; ink: a key of the palette). gap: the dark (or paper) left round the
// over cord where it crosses (px each side); ground: the ink of the panel under the knot (null: the paper). colour(t, k):
// the ink of thread t's k-th stretch between crossings (Durrow changes colour under a crossing); defaults to the layer's.
export function knot(sheet, C, crossings, { layers, gap = 1, ground = null, colour = null, trap = .35, breath = 1 } = {}) {
  const W = layers[0].w, Lg = W / 2 + gap + .6, line = layers.length > 1 ? (W - layers[1].w) / 2 : 0;
  // each layer's width at each point: the band breathes (f), the pen line (outermost ring) swells and thins with the nib (g)
  const widths = (c, idx, i) => idx.map(j => { const f = 1 + (c.f[j] - 1) * breath, w0 = W * f; return i === 0 ? w0 : i === 1 ? w0 - 2 * line * c.g[j] : w0 - 2 * line * c.g[j] - (layers[1].w - layers[i].w); });
  const lay = (t, pts, close, k) => { const c = C[t]; for (let i = 0; i < layers.length; i++) { const ly = layers[i], ink = (i === layers.length - 1 && colour) ? colour(t, k) : ly.ink;
    sheet.strokeW(pts, widths(c, pts.idx, i), ink, { close, trap }); } };
  for (const c of C) hand(c, W);
  // a cord's stretches run between the crossings where it goes under (a colour changes out of sight, as in Durrow)
  const unders = C.map(c => c.ev.map((e, i) => e.cross && !e.over ? c.s[i] : null).filter(v => v != null));
  C.forEach((c, t) => {
    const xs = unders[t];
    if (!xs.length || !colour) { const all = c.pts.slice(); all.idx = c.pts.map((_, i) => i); lay(t, all, true, 0); return; }
    for (let k = 0; k < xs.length; k++) { const a = xs[k], b = k + 1 < xs.length ? xs[k + 1] : xs[0] + c.L; lay(t, stretch(c, a - .5, b + .5), false, k); }
  });
  // each crossing: the gap cut round the over cord, then the over cord laid again across it
  for (const [, vs] of crossings) {
    const ov = vs.find(v => v.over); if (!ov) continue;
    const c = C[ov.t], s = c.s[ov.i], xs = unders[ov.t];
    const Lp = Math.max(Lg + .4, Math.min(Lg + W * .35, (c.step ?? 1e9) - Lg - .3)), gp = stretch(c, s - Lg, s + Lg);
    sheet.strokeW(gp, widths(c, gp.idx, 0).map(w => w + 2 * gap), ground, { close: false, trap: 0 });
    let k = xs.findIndex(v => v > s) - 1; if (k < 0) k = xs.length - 1;   // (the stretch this crossing lies in)
    lay(ov.t, stretch(c, s - Lp, s + Lp), false, Math.max(0, k));
  }
}
// each cord's distance between crossings (so a laid-again stretch never reaches the next crossing)
export function measure(C, u) { for (const c of C) { c.unit = u; c.step = Math.SQRT2 * u; } return C; }

// ---- dots -------------------------------------------------------------------------------------------------------------------
// Dots along a closed polyline, each a touch of the brush: the pitch opens a little on the outside of a bend and closes on
// the inside (the hand follows the curve, research/20), the dot is fuller just after the brush is loaded and leaner as it
// empties (a reload every `load` touches), and each is a little long in the direction the hand was moving. r: px, or r(k, n).
export function dotsAlong(pts, pitch, r, close = true, { load = 0, bend = .25 } = {}) {
  const n0 = pts.length, S = [0]; for (let i = 1; i < n0 + (close ? 1 : 0); i++) { const p = pts[i % n0], q = pts[i - 1]; S.push(S.at(-1) + Math.hypot(p[0] - q[0], p[1] - q[1])); }
  // signed turn per unit length at each point (smoothed), to open or close the pitch
  const K = pts.map((b, i) => { const a = pts[((i - 3) % n0 + n0) % n0], d = pts[(i + 3) % n0], h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(d[1] - b[1], d[0] - b[0]); let dh = h2 - h1; dh -= Math.round(dh / (2 * Math.PI)) * 2 * Math.PI; return dh / (Math.hypot(d[0] - a[0], d[1] - a[1]) || 1); });
  const L = S.at(-1), at = s => { let j = 0; while (j < S.length - 2 && S[j + 1] < s) j++; return j; };
  // walk with a pitch scaled by the bend, then even out the last gap over the whole row
  const ss = []; for (let s = 0; s < L - pitch * .5;) { ss.push(s); const k = K[at(s)] ?? 0; s += pitch * (1 + Math.max(-.12, Math.min(.12, bend * k * pitch * 3))); }
  const sc = L / (ss.length ? ss.at(-1) + pitch : L); const o = [];
  ss.forEach((s0, k) => { const s = s0 * (close ? sc : 1), j = at(s), f = (s - S[j]) / ((S[j + 1] - S[j]) || 1), p = pts[j], q = pts[(j + 1) % n0], ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
    const rr = typeof r === 'function' ? r(k, ss.length) : r, ld = load ? 1.1 - .2 * ((k % load) / load) : 1;
    o.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, rr * ld, ang, 1.06]); });
  return o;
}

// ---- the printer ------------------------------------------------------------------------------------------------------------
// Ops in painting order on one coverage grid per ink (res cells a px over box). A paint lays its ink and takes the same shape
// (less a trap, so the slip never opens a seam) out of every other ink: the pigments are opaque. A knock (ink null) takes it
// out of all; a knock with an ink lays that ink and takes it out of the others (the ground showing through a gap).
export class Sheet {
  constructor(box, res = 2) { const [x0, y0, x1, y1] = box; this.box = box; this.res = res; this.w = Math.ceil((x1 - x0) * res); this.h = Math.ceil((y1 - y0) * res); this.c = new Map(); this.order = []; }
  ctx(ink) {
    if (!this.c.has(ink)) { const g = new OffscreenCanvas(this.w, this.h).getContext('2d', { willReadFrequently: true });
      g.setTransform(this.res, 0, 0, this.res, -this.box[0] * this.res, -this.box[1] * this.res); g.lineJoin = 'round'; g.fillStyle = g.strokeStyle = '#000'; this.c.set(ink, g); this.order.push(ink); }
    return this.c.get(ink);
  }
  // draw(g) is called with each context and the width to use (w - 2 trap for the knock of the others)
  op(ink, draw, { trap = .35, knock = false } = {}) {
    for (const [k, g] of this.c) if (k !== ink) { g.globalCompositeOperation = 'destination-out'; draw(g, -trap); }
    if (ink != null) { const g = this.ctx(ink); g.globalCompositeOperation = 'source-over'; draw(g, 0); }
  }
  stroke(pts, w, ink, { close = true, cap = 'round', trap = .35, knock = false } = {}) {
    const P = pathOf(pts, close); this.op(ink, (g, d) => { g.lineCap = cap; g.lineWidth = Math.max(.01, w + 2 * d); g.stroke(P); }, { trap, knock });
  }
  fill(P, ink, { rule = 'nonzero' } = {}) { this.op(ink, g => g.fill(P, rule)); }
  // a coverage grid on the sheet's own grid (w × h, 0..1)
  image(ink, M) {
    const c = new OffscreenCanvas(this.w, this.h), x = c.getContext('2d'), im = x.createImageData(this.w, this.h);
    for (let q = 0; q < M.length && q < this.w * this.h; q++) im.data[q * 4 + 3] = Math.round(Math.min(1, M[q]) * 255);
    x.putImageData(im, 0, 0); this.op(ink, g => { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c, 0, 0); g.restore(); });
  }
  dots(D, ink) { const P = new Path2D(); for (const [x, y, r, a = 0, e = 1] of D) { P.moveTo(x + Math.cos(a) * r * e, y + Math.sin(a) * r * e); P.ellipse(x, y, r * e, r / e, a, 0, Math.PI * 2); } this.fill(P, ink); }
  // a band of varying width along a polyline, as quads that share their edges (one path, nonzero: no seams, crossings fill)
  strokeW(pts, ws, ink, { close = false, trap = .35 } = {}) {
    const n = pts.length; if (n < 2) return; const N = pts.map((p, i) => { const a = pts[close ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[close ? (i + 1) % n : Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]; });
    const path = d => { const P = new Path2D(), m = close ? n : n - 1;
      for (let i = 0; i < m; i++) { const j = (i + 1) % n, wi = Math.max(.05, ws[i] / 2 + d), wj = Math.max(.05, ws[j] / 2 + d), a = pts[i], b = pts[j];
        P.moveTo(a[0] + N[i][0] * wi, a[1] + N[i][1] * wi); P.lineTo(b[0] + N[j][0] * wj, b[1] + N[j][1] * wj); P.lineTo(b[0] - N[j][0] * wj, b[1] - N[j][1] * wj); P.lineTo(a[0] - N[i][0] * wi, a[1] - N[i][1] * wi); P.closePath(); }
      return P; };
    const own = path(0), less = trap ? path(-trap) : own; this.op(ink, (g, d) => g.fill(d < 0 ? less : own, 'nonzero'));
  }
  // pour every ink (order: bottom first) through the ink engine; tex(ink) -> grain amount (0: a flat coat, as the key)
  print(bake, pal, { dpr = 2, order = this.order, seed = 1, tex = () => 0 } = {}) {
    for (const ink of order) {
      const g = this.c.get(ink); if (!g || !pal[ink]) continue;
      const d = g.getImageData(0, 0, this.w, this.h).data, M = new Float32Array(this.w * this.h);
      let any = false; for (let q = 0, p = 3; q < M.length; q++, p += 4) { const v = d[p] / 255; M[q] = v; if (v) any = true; }
      if (!any) continue;
      const L = { M, w: this.w, h: this.h, x0: this.box[0], y0: this.box[1], res: this.res }, amt = tex(ink);
      if (amt) grain(L, seed + ink.charCodeAt(0) * 31, amt);
      inkLetter(bake, { ...L, wet: amt ? (amt.wet ?? .08) : .05, dry: amt ? (amt.dry ?? .1) : .16 }, pal[ink], { dpr });
    }
  }
}
// a pigment's coat: a slow swell in density and the tooth of the vellum, held below the engine's full-coat level so it reads
// (amt: a number, or a pigment's own coat { base, slow, tooth, grainPx }: orpiment a dense coat with a coarse crystal tooth,
// verdigris thinner and granulating in slow pools, red lead dense and even)
function grain(L, seed, amt) {
  const o = typeof amt === 'number' ? { base: .76, slow: .06 * amt, tooth: .04 * amt, grainPx: .7 } : amt;
  const { M, w, h, x0, y0, res } = L, slow = noise2(seed), tooth = noise2(seed ^ 0x55);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i; if (M[q] <= 0) continue; const x = x0 + i / res, y = y0 + j / res;
    M[q] *= o.base + o.slow * (slow(x / 9, y / 9) - .5) * 2 + o.tooth * (tooth(x / o.grainPx, y / o.grainPx) - .5) * 2; }
}
export { stream };
