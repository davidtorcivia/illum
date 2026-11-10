// The plotter's geometry (research/25-plotter.md §3): what is sent to the machine, as paths in CSS px. Exact, as a
// program makes it; every departure from exact is the machine's or the pen's (kit/styles/plotter-pen.js), or a stated
// variable of the drawing (Molnár's and Nees's displacements, seeded per piece, on a gradient).
import { SIMPLEX, DUPLEX, TRIPLEX, JOST } from './plotter-letters.js';
export { rng } from './plotter-pen.js';

const FACES = { simplex: SIMPLEX, duplex: DUPLEX, triplex: TRIPLEX };
// Hershey lettering: cap height `cap`, baseline at y, from x. Returns { paths, w }. (Hershey caps run from y -12 to the
// baseline at 9: 21 units.) track: extra space between letters, in units.
export function hershey(text, x, y, cap, face = 'simplex', { track = 0 } = {}) {
  const F = FACES[face], k = cap / 21, paths = []; let cx = x;
  for (const ch of text) { const g = F[ch] ?? SIMPLEX[ch] ?? SIMPLEX[' '];
    for (const s of g.s) paths.push(s.map(([u, v]) => [cx + (u - g.l) * k, y + (v - 9) * k]));
    cx += (g.r - g.l + track) * k; }
  return { paths, w: cx - x - track * k };
}
export const hersheyBox = (ch, cap, face = 'simplex') => { const g = FACES[face][ch] ?? SIMPLEX[ch], k = cap / 21, xs = g.s.flat().map(p => p[0]);
  return { l: (Math.min(...xs) - g.l) * k, r: (Math.max(...xs) - g.l) * k, adv: (g.r - g.l) * k }; };

// Jost's capital as closed contours, cap height `cap`, baseline at y, its ink's left edge at x. Returns { contours, w }.
export function outline(ch, x, y, cap) {
  const g = JOST[ch] ?? JOST.O, k = cap / 1000, xs = g.c.flat().map(p => p[0]), l = Math.min(...xs);
  return { contours: g.c.map(c => c.map(([u, v]) => [x + (u - l) * k, y + v * k])), w: (Math.max(...xs) - l) * k };
}

// ---- passes --------------------------------------------------------------------------------------------------------------
// a polyline offset sideways by o (its corners mitred, the mitre limited)
export function offset(P, o) {
  return P.map((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let n0 = i ? norm(P[i - 1], p) : norm(p, b), n1 = i < P.length - 1 ? norm(p, P[i + 1]) : n0;
    let nx = n0[0] + n1[0], ny = n0[1] + n1[1]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const m = Math.min(2, 1 / Math.max(.5, nx * n0[0] + ny * n0[1])); return [p[0] + nx * o * m, p[1] + ny * o * m]; });
}
const norm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
// bold as a plotter makes it: the same stroke drawn n times side by side, `gap` apart, the pen kept down and turning back
// at each end (Hershey's Duplex and Triplex are the same idea in the data)
export function bold(P, n, gap) {
  const out = []; for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2) * gap, q = offset(P, o); out.push(...(k % 2 ? q.reverse() : q)); }
  return out;
}
// one corner-cutting pass (Chaikin): a Hershey bowl's facets softened, its ends kept
export function chaikin(P) { if (P.length < 3) return P; const o = [P[0]];
  for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; o.push([.75 * a[0] + .25 * b[0], .75 * a[1] + .25 * b[1]], [.25 * a[0] + .75 * b[0], .25 * a[1] + .75 * b[1]]); }
  o.push(P.at(-1)); return o; }

// ---- hatching --------------------------------------------------------------------------------------------------------------
// Parallel lines at angle `ang` (radians) across the closed contours (even-odd: counters stay empty), `gap` apart (or
// gap(t), t 0..1 across the field: tone by spacing). inset: the hatch stops short of the contour by this much, for the
// contour pen to cover. boustro: drawn back and forth with the pen down, each row joined to the next along the contour
// (one pen-down for a run of rows; the carriage stops and turns at each end). Returns paths.
export function hatch(contours, ang, gap, { inset = 0, boustro = true, phase = .5, min = 1 } = {}) {
  const c = Math.cos(ang), s = Math.sin(ang), R = ([x, y]) => [x * c + y * s, -x * s + y * c], U = ([x, y]) => [x * c - y * s, x * s + y * c];
  const C = contours.map(k => k.map(R)); let y0 = Infinity, y1 = -Infinity; for (const k of C) for (const p of k) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const G = typeof gap === 'function' ? gap : () => gap, rows = [];
  for (let y = y0 + G(0) * phase; y < y1; y += G((y - y0) / (y1 - y0 || 1))) {
    const xs = []; for (const k of C) for (let i = 0; i < k.length; i++) { const p = k[i], q = k[(i + 1) % k.length];
      if ((p[1] <= y) !== (q[1] <= y)) xs.push(p[0] + (y - p[1]) * (q[0] - p[0]) / (q[1] - p[1])); }
    xs.sort((a, b) => a - b); const segs = [];
    for (let i = 0; i + 1 < xs.length; i += 2) { const a = xs[i] + inset, b = xs[i + 1] - inset; if (b - a > min) segs.push([a, b]); }
    rows.push({ y, segs });
  }
  const out = []; let live = [];   // live: chains open on the last row: { path, seg, dir }
  for (const { y, segs } of rows) {
    const next = [];
    for (const sg of segs) {
      const over = live.filter(ch => ch.seg[0] < sg[1] && sg[0] < ch.seg[1]), ch = over.length === 1 ? over[0] : null;
      const back = ch && segs.filter(o => ch.seg[0] < o[1] && o[0] < ch.seg[1]).length === 1;
      if (boustro && ch && back && !ch.used) { const dir = -ch.dir, a = dir > 0 ? sg[0] : sg[1], e = ch.path.at(-1);
        if (Math.hypot(a - e[0], y - e[1]) < 3 * G(.5) + 2 * inset) { ch.used = true; ch.path.push([a, y], [dir > 0 ? sg[1] : sg[0], y]); next.push({ path: ch.path, seg: sg, dir }); continue; } }
      const dir = 1, path = [[sg[0], y], [sg[1], y]]; out.push(path); next.push({ path, seg: sg, dir });
    }
    live = next;
  }
  return out.map(p => p.map(U));
}

// ---- lines ---------------------------------------------------------------------------------------------------------------
// a path cut into dashes by a pattern of on/off lengths (px), as HP-GL's line types do: every dash its own pen-down
export function dashes(P, pattern, start = 0) {
  const out = []; let k = 0, left = pattern[0] - start, on = true, cur = [P[0]];
  for (let i = 1; i < P.length; i++) { let a = P[i - 1]; const b = P[i]; let l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (l > left) { const f = left / l, m = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      if (on) { cur.push(m); out.push(cur); } else cur = [m];
      on = !on; k = (k + 1) % pattern.length; l -= left; a = m; left = pattern[k]; }
    left -= l; if (on) cur.push(b); }
  if (on && cur.length > 1) out.push(cur);
  return out.filter(p => p.length > 1);
}
export const line = (x0, y0, x1, y1) => [[x0, y0], [x1, y1]];
// a rectangle as one closed stroke, from its top-left, or with one side left out (the side's index 0 top, 1 right, ...)
export function rect(x, y, w, h, skip = -1) {
  const c = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  if (skip < 0) return [[...c, c[0]]];
  const o = []; for (let i = 1; i <= 4; i++) o.push(c[(skip + i) % 4]); return [o];
}
// a square of side a about (cx, cy), turned by th
export function square(cx, cy, a, th = 0, skip = -1) {
  const r = a / 2, c = [[-r, -r], [r, -r], [r, r], [-r, r]].map(([x, y]) => [cx + x * Math.cos(th) - y * Math.sin(th), cy + x * Math.sin(th) + y * Math.cos(th)]);
  if (skip < 0) return [...c, c[0]]; const o = []; for (let i = 1; i <= 4; i++) o.push(c[(skip + i) % 4]); return o;
}
export const bbox = paths => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of paths) for (const [x, y] of p) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };
export const move = (paths, dx, dy) => paths.map(p => p.map(([x, y]) => [x + dx, y + dy]));

// ---- pieces --------------------------------------------------------------------------------------------------------------
// a piece from its layers (paths in the piece's own px, its anchor at 0, 0): its extent, and where that lies from the
// anchor (at), so the page sets the anchor where it belongs and the canvas covers the ink
export function make(layers, machine, seed) {
  layers = layers.filter(L => L.paths.length); const [x0, y0, x1, y1] = bbox(layers.flatMap(L => L.paths));
  return { W: Math.max(1, x1 - x0), H: Math.max(1, y1 - y0), ox: -x0, oy: -y0, at: [x0, y0], machine, seed, layers };
}
// paths cut where they pass within r of the segments `avoid` (each [[x, y], [x, y]]): the pen lifts across them
export function cut(paths, avoid, r, step = .6) {
  const near = (x, y) => { for (const [a, b] of avoid) { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2));
    if ((x - a[0] - t * dx) ** 2 + (y - a[1] - t * dy) ** 2 < r * r) return true; } return false; };
  const out = [];
  for (const P of paths) { let cur = null;
    const take = (x, y) => { if (near(x, y)) { if (cur?.length > 1) out.push(cur); cur = null; } else (cur ??= []).push([x, y]); };
    take(P[0][0], P[0][1]);
    for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 1; k <= n; k++) take(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n); }
    if (cur?.length > 1) out.push(cur); }
  return out.map(simplify);
}
// collinear points dropped (a cut path keeps only its corners)
const simplify = P => P.filter((p, i) => { if (!i || i === P.length - 1) return true; const a = P[i - 1], b = P[i + 1]; return Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) > 1e-3; });
export const segsOf = paths => paths.flatMap(P => P.slice(1).map((p, i) => [P[i], p]));

// ---- shapes (closed contours, unclosed: hatch takes them as they are, a contour pen closes them) -------------------------
export function shape(kind, cx, cy, r, th = 0) {
  const n = { square: 4, lozenge: 4, triangle: 3, disc: 40, hexagon: 6 }[kind] ?? 4, a0 = kind === 'square' ? Math.PI / 4 : kind === 'triangle' ? -Math.PI / 2 : kind === 'hexagon' ? 0 : -Math.PI / 2;
  const k = kind === 'square' ? Math.SQRT2 : kind === 'triangle' ? 1.25 : 1;
  return Array.from({ length: n }, (_, i) => { const a = a0 + th + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]; });
}
export const closed = c => [...c, c[0]];
// a stream's choice from a list
export const pick = (r, list) => list[Math.floor(r() * list.length) % list.length];
