// Insular, direction studies (research/20-insular.md). Each direction makes the same pieces: the drop initial (a panel letter:
// the face's stroke region outlined by a quill, each stroke carrying a plait laid along it, the ends wound into spirals,
// the counters worked, red dots set round it by a brush),
// the paraph, the line-filler, the break and the frame. Every piece is a Sheet (kit/styles/insular-knot.js) of per-ink
// coverage, poured ink by ink through the ink engine. Nothing here is drawn from a raster of the master: the letter's shape is
// Uncial Antiqua's (OFL), everything else is generated.
import { plait, cords, knot, measure, dotsAlong, Sheet, pathOf, stream, NIB } from '../kit/styles/insular-knot.js';
import { dist } from '../kit/inkletter.js';
import { contours } from '../kit/brushwork.js';
import { noise1, tendril } from '../kit/marks.js';

// ---- palettes (sampled, research/20 §palette; lifted for a screen's light) --------------------------------------------------
export const PAL = {
  kells: {
    light: { k: [44, 24, 20], r: [192, 82, 50], y: [222, 172, 72], p: [92, 46, 70], g: [96, 132, 88], b: [70, 102, 140], l: [214, 198, 166], d: [192, 90, 60] },
    dark:  { k: [26, 20, 18], r: [206, 96, 60], y: [228, 182, 86], p: [104, 56, 82], g: [110, 146, 100], b: [86, 120, 160], l: [214, 198, 166], d: [204, 100, 66] },
  },
  lind: {
    light: { k: [42, 26, 20], r: [190, 78, 52], d: [196, 98, 66], y: [212, 166, 84], g: [112, 148, 104], b: [62, 96, 140], p: [110, 52, 78], v: [236, 226, 204] },
    dark:  { k: [24, 20, 17], r: [214, 102, 70], d: [206, 104, 72], y: [222, 178, 94], g: [124, 164, 116], b: [92, 128, 172], p: [150, 84, 112], v: [214, 198, 166], l: [214, 198, 166] },
  },
  durrow: {
    light: { k: [52, 40, 32], gr: [44, 36, 30], r: [184, 96, 56], y: [210, 170, 92], g: [110, 140, 98], v: [226, 214, 188], d: [184, 92, 60] },
    dark:  { k: [20, 17, 15], gr: [28, 24, 21], r: [196, 104, 62], y: [218, 178, 98], g: [118, 150, 104], v: [200, 186, 156], d: [196, 98, 64] },
  },
};

// ---- the letter as a field ------------------------------------------------------------------------------------------------
// The capital set in the face at cap height H (px), rasterised at res cells a px with a margin; its inside depth and its
// outside distance (px); its counters (the paper it encloses).
const FAMILY = 'InsularUncial';
export function letterField(ch, H, { res = 2, pad = .22, bold = 0 } = {}) {
  const c = document.createElement('canvas').getContext('2d'); c.font = `${H * 1.45}px ${FAMILY}`;
  const m = c.measureText(ch), asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent, l = m.actualBoundingBoxLeft, r = m.actualBoundingBoxRight;
  const s = H / (asc + desc), P = Math.ceil(H * pad), W = Math.ceil((l + r) * s) + 2 * P, Ht = Math.ceil(H) + 2 * P;
  const w = W * res, h = Ht * res, cv = new OffscreenCanvas(w, h), g = cv.getContext('2d', { willReadFrequently: true });
  g.font = `${H * 1.45 * s * res}px ${FAMILY}`; g.fillStyle = '#000'; g.fillText(ch, (P + l * s) * res, (P + asc * s) * res);
  const d = g.getImageData(0, 0, w, h).data, M = new Float32Array(w * h), inn = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let q = 0; q < M.length; q++) { M[q] = d[q * 4 + 3] / 255; inn[q] = M[q] >= .5; out[q] = !inn[q]; }
  let Din = dist(out, w, h), Dout = dist(inn, w, h);
  // the panel letter is broader than the type (f. 139r's band is ~0.12–0.14 of the letter's height): the face's form grown
  // evenly by `bold` px before anything is built on it
  if (bold > 0) { for (let q = 0; q < M.length; q++) { if (!inn[q]) M[q] = Math.max(M[q], Math.min(1, Math.max(0, bold * res - Dout[q] + .5))); inn[q] = M[q] >= .5; out[q] = !inn[q]; }
    Din = dist(out, w, h); Dout = dist(inn, w, h); }
  return refield({ ch, H, res, W, Ht, P, w, h, M }, Din, Dout);
}
// the fields of a letter from its coverage M (inside depth, outside distance, counters), after M is set or changed
function refield(L, Din, Dout) {
  const { w, h, M, res } = L, inn = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let q = 0; q < M.length; q++) { inn[q] = M[q] >= .5; out[q] = !inn[q]; }
  if (!Din) { Din = dist(out, w, h); Dout = dist(inn, w, h); }
  for (let q = 0; q < M.length; q++) { Din[q] /= res; Dout[q] /= res; }
  // counters: paper not reached from the border
  const hole = new Uint8Array(w * h), st = []; for (let i = 0; i < w; i++) st.push(i, (h - 1) * w + i); for (let j = 0; j < h; j++) st.push(j * w, j * w + w - 1);
  const reach = new Uint8Array(w * h); while (st.length) { const q = st.pop(); if (reach[q] || inn[q]) continue; reach[q] = 1; const i = q % w, j = q / w | 0; if (i) st.push(q - 1); if (i < w - 1) st.push(q + 1); if (j) st.push(q - w); if (j < h - 1) st.push(q + w); }
  for (let q = 0; q < M.length; q++) hole[q] = !inn[q] && !reach[q];
  return Object.assign(L, { Din, Dout, hole, at: (x, y, F) => { const i = Math.round(x * res), j = Math.round(y * res); return i < 0 || j < 0 || i >= w || j >= h ? 0 : F[j * w + i]; } });
}
// The letter's free ends swollen into roundels (Durrow's terminals burst into coils): a disc at each end whose swell can
// hold one, a little larger than the stroke and set forward along it, joined to the letter's coverage.
function swell(L, u, k = 1.4) {
  const discs = [];
  for (const st of strokes(L, Math.max(1, u * .5))) { const A = along(st.pts, st.hw);
    for (const t of terminals(st, A, u, 0)) { const R = t.R * k, back = [Math.cos(t.a0), Math.sin(t.a0)], c = [t.c[0] - back[0] * t.R * (k - 1) * .8, t.c[1] - back[1] * t.R * (k - 1) * .8]; discs.push([c[0], c[1], R]); } }
  const { w, h, res, M } = L;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const x = (i + .5) / res, y = (j + .5) / res; for (const [cx, cy, R] of discs) { const v = Math.max(0, Math.min(1, (R - Math.hypot(x - cx, y - cy)) * res + .5)); if (v > M[j * w + i]) M[j * w + i] = v; } }
  return refield(L);
}
// the letter grown by `off` px (its counters filled), as closed polylines (px): where a row of dots runs round it
export function ring(L, off) {
  const B = new Float32Array(L.w * L.h); for (let q = 0; q < B.length; q++) B[q] = L.hole[q] || L.Dout[q] < off ? 1 : 0;
  return contours(B, L.w, L.h, { dpr: L.res, min: 10 });
}
// a field's band [a, b) as a coverage image on the sheet's grid (the band between two depths, edges anti-aliased by a cell)
function band(L, F, a, b, sel = null) {
  const o = new Float32Array(L.w * L.h), e = .5 / L.res;
  for (let q = 0; q < o.length; q++) { if (sel && !sel[q]) continue; const v = F[q]; o[q] = (a <= 0 ? L.M[q] : Math.max(0, Math.min(1, (v - a) / (2 * e) + .5))) * Math.max(0, Math.min(1, (b - v) / (2 * e) + .5)); }
  return o;
}

// ---- the letter's strokes, each a panel --------------------------------------------------------------------------------
// The letter's skeleton (Zhang & Suen's thinning, 1984, on a grid of `g` px), cut at its forks into strokes, each a smooth
// centreline with the stroke's half-width along it. A panel letter's body is these strokes, each worked as its own panel.
export function strokes(L, g = 1) {
  const sw = Math.ceil(L.W / g) + 2, sh = Math.ceil(L.Ht / g) + 2, B = new Uint8Array(sw * sh);
  for (let j = 1; j < sh - 1; j++) for (let i = 1; i < sw - 1; i++) B[j * sw + i] = L.at((i - .5) * g, (j - .5) * g, L.Din) > g * .5 ? 1 : 0;
  for (let ch = true; ch;) { ch = false;
    for (const pass of [0, 1]) { const del = [];
      for (let j = 1; j < sh - 1; j++) for (let i = 1; i < sw - 1; i++) { const q = j * sw + i; if (!B[q]) continue;
        const P = [B[q - sw], B[q - sw + 1], B[q + 1], B[q + sw + 1], B[q + sw], B[q + sw - 1], B[q - 1], B[q - sw - 1]], n = P.reduce((a, v) => a + v, 0);
        if (n < 2 || n > 6) continue; let a = 0; for (let k = 0; k < 8; k++) a += !P[k] && P[(k + 1) % 8]; if (a !== 1) continue;
        if (pass ? P[0] * P[2] * P[6] || P[0] * P[4] * P[6] : P[0] * P[2] * P[4] || P[2] * P[4] * P[6]) continue; del.push(q); }
      for (const q of del) B[q] = 0; if (del.length) ch = true; } }
  const N8 = [-sw, 1, sw, -1, -sw + 1, sw + 1, sw - 1, -sw - 1], RING = [-sw, -sw + 1, 1, sw + 1, sw, sw - 1, -1, -sw - 1];
  const nb = q => N8.map(d => q + d).filter(o => B[o]);   // (orthogonal first)
  const trans = q => { let a = 0; for (let k = 0; k < 8; k++) a += !B[q + RING[k]] && B[q + RING[(k + 1) % 8]]; return a; };
  const kind = q => { const n = nb(q).length; return n <= 1 ? 'end' : trans(q) >= 3 ? 'fork' : ''; };
  const trace = () => { const seen = new Set(), out = [];
    const walk = (a, b) => { const path = [a, b]; let prev = a, cur = b;
      while (!kind(cur)) { seen.add(cur); const c = nb(cur).filter(o => o !== prev && !path.includes(o)), f = c.find(o => kind(o)); const nx = f ?? c.find(o => !seen.has(o)); if (nx == null) break; path.push(nx); prev = cur; cur = nx; }
      seen.add(cur); return path; };
    for (let q = 0; q < B.length; q++) if (B[q] && kind(q)) for (const o of nb(q)) if (!seen.has(o) || kind(o)) { const w = walk(q, o); if (w.length > 2 || kind(o)) out.push(w); }
    for (let q = 0; q < B.length; q++) if (B[q] && !seen.has(q) && !kind(q)) { const o = nb(q)[0]; seen.add(q); out.push([q, ...walk(q, o).slice(1)]); }   // (a closed loop)
    return out; };
  // spurs (a serif's twig: an end within its fork's width) are pruned, then the strokes traced again whole
  for (const path of trace()) { const e0 = kind(path[0]) === 'end', e1 = kind(path.at(-1)) === 'end';
    if (e0 !== e1) { const fk = e0 ? path.at(-1) : path[0], hwF = L.at(((fk % sw) - .5) * g, (((fk / sw) | 0) - .5) * g, L.Din); if (path.length * g < hwF * 2.2) for (const q of path) if (q !== fk) B[q] = 0; } }
  let out = trace().filter(p => p.length > 3);
  // at a fork, the two strokes that run on most nearly straight through it are one stroke (an E's bowl past its bar)
  const xy = q => [q % sw, (q / sw) | 0], dirFrom = (path, atStart) => { const f = xy(atStart ? path[0] : path.at(-1)), o = xy(atStart ? path[Math.min(6, path.length - 1)] : path.at(-1 - Math.min(6, path.length - 1))), l = Math.hypot(o[0] - f[0], o[1] - f[1]) || 1; return [(o[0] - f[0]) / l, (o[1] - f[1]) / l]; };
  for (let changed = true; changed;) { changed = false;
    const forks = new Map(); out.forEach((p, i) => { for (const st of [true, false]) { const q = st ? p[0] : p.at(-1); if (kind(q) === 'fork') (forks.get(q) ?? forks.set(q, []).get(q)).push([i, st]); } });
    for (const [, inc] of forks) { if (inc.length < 2) continue; let best = null;
      for (let x = 0; x < inc.length; x++) for (let y = x + 1; y < inc.length; y++) { if (inc[x][0] === inc[y][0]) continue; const d1 = dirFrom(out[inc[x][0]], inc[x][1]), d2 = dirFrom(out[inc[y][0]], inc[y][1]), dot = d1[0] * d2[0] + d1[1] * d2[1]; if (dot < -.55 && (!best || dot < best[0])) best = [dot, inc[x], inc[y]]; }
      if (!best) continue; const [, [i, si], [j, sj]] = best, P = si ? out[i].slice().reverse() : out[i], Q = sj ? out[j] : out[j].slice().reverse();
      out[i] = P.concat(Q.slice(1)); out[i].through = true; out.splice(j, 1); changed = true; break; } }
  return out.map(path => { let pts = path.map(q => [((q % sw) - .5) * g, (((q / sw) | 0) - .5) * g]);
    for (let it = 0; it < 6; it++) pts = pts.map((p, i) => i === 0 || i === pts.length - 1 ? p : [(pts[i - 1][0] + 2 * p[0] + pts[i + 1][0]) / 4, (pts[i - 1][1] + 2 * p[1] + pts[i + 1][1]) / 4]);
    const ends = [kind(path[0]) === 'fork', kind(path.at(-1)) === 'fork'];   // (true: the end is a fork)
    return { pts, hw: pts.map(([x, y]) => L.at(x, y, L.Din)), forks: ends, closed: path[0] === path.at(-1) }; });
}
// a plait band rows cells high laid along a stroke's centreline from arc length s0 (cords in the band's own frame, mapped)
function bandAlong(line, s0, A, rows, u, opt = {}) {   // opt.squeeze(s): the band's height factor there (a stroke narrowing)
  const K = plait(A, rows, () => true, opt.wall ?? undefined), C = measure(cords(K, { ox: 0, oy: 0, u, inset: .3, round: 1.08, edgeInset: .2 }), u);
  const S = [0]; for (let i = 1; i < line.length; i++) S.push(S[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const frame = s => { let j = 0; while (j < S.length - 2 && S[j + 1] < s) j++; const f = (s - S[j]) / ((S[j + 1] - S[j]) || 1), a = line[j], b = line[j + 1];
    const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1; return [a[0] + tx * f, a[1] + ty * f, -ty / l, tx / l]; };
  const H = rows * u;
  const sq = opt.squeeze ?? (() => 1);
  for (const c of C) c.pts = c.pts.map(([x, y]) => { const [px, py, nx, ny] = frame(s0 + x), f = sq(s0 + x); return [px + nx * (y - H) * f, py + ny * (y - H) * f]; });
  return { K, C };
}
// panels along every stroke of the letter: rows as many as the stroke's width holds (a cell side 2u), stopped short of the
// forks and the stroke's ends; returns the panels (each a knot) and where each ends (for the cross-bars)
function panels(L, u, clear, { maxRows = 3, seed = 1 } = {}) {
  const out = [], rnd = stream(seed, 'panels');
  for (const st of strokes(L, Math.max(1, u * .5))) {
    const { pts, hw } = st, S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = S.at(-1); if (len < u * 4) continue;
    // stop short of a fork by the width there; of a free end by the end's width (the serif's curl is left as ground)
    const cut0 = (st.forks[0] ? 1.15 : .9) * Math.max(hw[0], u), cut1 = (st.forks[1] ? 1.15 : .9) * Math.max(hw.at(-1), u);
    let a = cut0, b = len - cut1; if (b - a < u * 4) continue;
    // one band the stroke's length, as many rows as its middling width holds; where the pen thins, the band is pressed
    // narrower (down to .6 of itself), and it stops where even that will not fit
    const hwAt = s => { let j = 0; while (j < S.length - 2 && S[j + 1] < s) j++; const f = (s - S[j]) / ((S[j + 1] - S[j]) || 1); return hw[j] + (hw[j + 1] - hw[j]) * f; };
    // the runs where a band of `rows` fits (pressed to no less than .6 of itself); rows chosen for the most cords laid
    const runs = rows => { const fit = s => (hwAt(s) - clear) / (rows * u), R = []; let st = null;
      for (let s = a; s <= b + 1e-6; s += u * .5) { const ok = fit(s) >= .6 && s <= b; if (ok && st == null) st = s; if ((!ok || s + u * .5 > b) && st != null) { const en = ok ? s : s - u * .5; if (en - st >= u * 4) R.push([st, en]); st = null; } }
      return { R, fit, tot: R.reduce((x, [p, q]) => x + (q - p), 0) * rows }; };
    let best = null; for (let rows = 1; rows <= maxRows; rows++) { const r = runs(rows); if (r.tot > 0 && (!best || r.tot > best.tot * 1.25)) best = { ...r, rows }; }
    if (!best) continue;
    for (const [p0, p1] of best.R) { const A = Math.floor((p1 - p0) / (2 * u)); if (A < 2) continue;
      const rows = best.rows, s0 = p0 + ((p1 - p0) - A * 2 * u) / 2, per = 2 + Math.floor(rnd() * 3);
      const wall = rows >= 2 ? (x, y) => (y === rows || (rows === 3 && y === 2)) && (x & 1) === 0 && (x / 2) % per === 0 && x > 0 && x < 2 * A : null;
      out.push({ ...bandAlong(pts, s0, A, rows, u, { wall, squeeze: s => Math.max(.6, Math.min(1, best.fit(s))) }), line: pts, s0, s1: s0 + A * 2 * u, rows }); }
  }
  return out;
}

// ---- the hand on the letter ----------------------------------------------------------------------------------------------
// The letter's rings (pen line, colour band, hairline...) laid by a quill: a ring's width at a point follows the angle of the
// letter's edge there against the nib (heavy where the edge runs across the nib, a hair along it), only for rings marked pen.
// spec: [{ w, ink, pen }], outermost first. The body (beyond the last ring) is `body`.
function rings(L, S, spec, body) {
  const n = L.w * L.h, gw = L.w, G = new Float32Array(n);
  for (let j = 1; j < L.h - 1; j++) for (let i = 1; i < gw - 1; i++) { const q = j * gw + i, dx = L.Din[q + 1] - L.Din[q - 1] + L.Dout[q - 1] - L.Dout[q + 1], dy = L.Din[q + gw] - L.Din[q - gw] + L.Dout[q - gw] - L.Dout[q + gw];
    G[q] = .5 + .95 * Math.abs(Math.sin(Math.atan2(dy, dx) + Math.PI / 2 - NIB)); }
  // (smoothed, so the pen's swell turns as the edge turns)
  for (let it = 0; it < 4; it++) { const B = G.slice(); for (let q = gw + 1; q < n - gw - 1; q++) G[q] = (B[q - 1] + B[q + 1] + B[q - gw] + B[q + gw] + 4 * B[q]) / 8; }
  const e = .5 / L.res, clamp = v => Math.max(0, Math.min(1, v)), out = spec.map(() => new Float32Array(n)), Bd = new Float32Array(n);
  for (let q = 0; q < n; q++) { if (L.M[q] <= 0) continue; const v = L.Din[q]; let a = 0;
    for (let k = 0; k < spec.length; k++) { const b = a + spec[k].w * (spec[k].pen ? G[q] : 1); out[k][q] = (a <= 0 ? L.M[q] : clamp((v - a) / (2 * e) + .5)) * clamp((b - v) / (2 * e) + .5); a = b; }
    Bd[q] = clamp((v - a + .2) / (2 * e) + .5); }
  S.image(body, Bd); spec.forEach((s, k) => S.image(s.ink, out[k]));
  return { frame: spec.reduce((s, x) => s + x.w, 0), Bd };
}
// a single spiral cord (a stroke's end wound in): from radius R at angle a0, `turns` turns, tightening to an eye
function spiralLine(c, R, a0, turns, cw) { const o = [], n = Math.max(40, Math.round(turns * 60));
  for (let i = 0; i <= n; i++) { const f = i / n, r = R * (1 - .86 * Math.pow(f, .72)), a = a0 + cw * f * turns * Math.PI * 2; o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
  return o; }
// a band of nested widths along an open line, the pen line swelling with the nib, a little thinner at the line's two ends
function cordLine(S, pts, layers, { taper = true } = {}) {
  const n = pts.length, line = layers.length > 1 ? (layers[0].w - layers[1].w) / 2 : 0;
  const g = pts.map((p, i) => { const a = pts[Math.max(0, i - 2)], b = pts[Math.min(n - 1, i + 2)]; return .5 + .95 * Math.abs(Math.sin(Math.atan2(b[1] - a[1], b[0] - a[0]) - NIB)); });
  layers.forEach((ly, k) => S.strokeW(pts, pts.map((_, i) => { const end = taper ? Math.min(1, .55 + .45 * Math.min(i, n - 1 - i) / 12) : 1, w0 = layers[0].w * end;
    return k === 0 ? w0 : k === 1 ? Math.max(.1, w0 - 2 * line * g[i]) : Math.max(.1, w0 - 2 * line * g[i] - (layers[1].w - ly.w) * end); }), ly.ink, { close: false }));
}
// the triple spiral: three arms from the hub, each winding tighter to an eye (Durrow fol. 3v, f. 139r's roundels); layers(k)
function triskele(S, c, R, rot, layers, { len = 1.45, eye = .12 } = {}) {
  [0, 1, 2].forEach(k => { const a = rot + k * Math.PI * 2 / 3, p = [c[0] + Math.cos(a) * R * .05, c[1] + Math.sin(a) * R * .05];
    cordLine(S, tendril(p, a, R * len, .9 / R, 1 / (R * eye), 2.4, Math.max(.15, R / 140)), layers(k)); });
}
// The letter's body, full: (1) a spiral where a stroke ends freely (the plait cannot turn in a terminal's swell); (2) a plait
// along each stroke, broad cells; (3) a finer plait in what is left, as f. 139r sets a dense interlace beside its knots.
// draw(pn, u, pass) lays a panel's knot; spiral(pts, R) lays a spiral.
function body(L, { u, clear, maxRows = 4, seed = 1, draw, spiral, fine = .6, fineRows = 3 }) {
  const res = L.res, holes = [];
  for (const st of strokes(L, Math.max(1, u * .5))) for (const end of [0, 1]) {
    if (st.forks[end] || st.closed) continue; const P = end ? st.pts.slice().reverse() : st.pts, H = end ? st.hw.slice().reverse() : st.hw;
    // the terminal's swell: the deepest point within the first stretch of the stroke
    let bi = 0; for (let i = 0; i < Math.min(P.length * .3, 14); i++) if (H[i] - i * u * .08 > H[bi] - bi * u * .08) bi = i;
    const R = H[bi] - clear; if (R < u * .95) continue;
    const c = P[bi], q = P[Math.min(P.length - 1, bi + 6)], a0 = Math.atan2(q[1] - c[1], q[0] - c[0]);
    if (holes.some(h => Math.hypot(h[0] - c[0], h[1] - c[1]) < h[2] + R)) continue;
    spiral(spiralLine(c, R * .92, a0, Math.max(1, Math.min(2.6, R / (u * 1.15))), (bi + end) % 2 ? 1 : -1), R); holes.push([c[0], c[1], R + u * .35]);
  }
  const without = (F, keep) => { const D = F.slice(); for (let j = 0; j < L.h; j++) for (let i = 0; i < L.w; i++) { const x = i / res, y = j / res, q = j * L.w + i; for (const [hx, hy, hr] of keep) { const d = Math.hypot(x - hx, y - hy) - hr; if (d < D[q]) D[q] = Math.max(0, d); } } return D; };
  let Din = without(L.Din, holes);
  const P1 = panels({ ...L, Din }, u, clear, { seed, maxRows }); P1.forEach(pn => draw(pn, u, 1));
  // what the broad plait covers, taken out of the field for the fine one
  const cov = new OffscreenCanvas(L.w, L.h).getContext('2d', { willReadFrequently: true }); cov.setTransform(res, 0, 0, res, 0, 0); cov.lineCap = 'round';
  for (const pn of P1) { const seg = []; let s = 0; for (let i = 0; i < pn.line.length; i++) { if (i) s += Math.hypot(pn.line[i][0] - pn.line[i - 1][0], pn.line[i][1] - pn.line[i - 1][1]); if (s >= pn.s0 - u * .3 && s <= pn.s1 + u * .3) seg.push(pn.line[i]); }
    if (seg.length > 1) { cov.lineWidth = 2 * pn.rows * u + u * .9; cov.stroke(pathOf(seg, false)); } }
  const cd = cov.getImageData(0, 0, L.w, L.h).data; Din = Din.slice(); for (let q = 0; q < Din.length; q++) if (cd[q * 4 + 3] > 40) Din[q] = 0;
  if (!fine) return; const u2 = Math.max(1.4, u * fine); panels({ ...L, Din }, u2, clear * .9 + u2 * .1, { seed: seed + 9, maxRows: fineRows }).forEach(pn => draw(pn, u2, 2));
}
// the diaper of dots in a closed counter (f. 27r): lines of dots on the diagonals, three set in each lozenge
function diaper(L, S, dr, pitch, ink = 'd') {
  const side = pitch * 5, D = [], ok = (x, y) => L.at(x, y, L.hole) && L.at(x, y, L.Dout) > dr * 2.4, R2 = Math.SQRT1_2;
  const cx0 = L.W / 2, cy0 = L.Ht / 2, n = Math.ceil(Math.hypot(L.W, L.Ht) / side), at = (a, b) => [cx0 + (a + b) * R2, cy0 + (a - b) * R2];
  const put = (a, b, r) => { const [x, y] = at(a, b); if (ok(x, y)) D.push([x, y, r * (1.06 - .12 * ((Math.abs(Math.round(a / pitch)) % 7) / 7)), Math.PI / 4, 1.1]); };
  for (let k = -n; k <= n; k++) for (let m = -5 * n; m <= 5 * n; m++) { put(k * side, m * pitch, dr * .9); if (m % 5) put(m * pitch, k * side, dr * .9); }
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) { const a = (i + .5) * side, b = (j + .5) * side; for (const [da, db] of [[-.42, -.42], [.42, -.42], [0, .5]]) put(a + da * pitch, b + db * pitch, dr * .8); }
  S.dots(D, ink);
}
// rows of dots round the letter: a brush reloaded every dozen touches, the pitch following the bend
function dotRows(L, S, dr, rows, seed, ink = 'd') {
  const pitch = dr * 2 * 1.8;
  for (let k = 0; k < rows; k++) for (const lp of ring(L, dr * 1.66 + k * pitch * .9)) S.dots(dotsAlong(lp, pitch, dr * (1 - .05 * k), true, { load: 11 + 2 * k + (seed % 3), bend: .15 }), ink);
}

// ---- the compartment letter (f. 139r) ----------------------------------------------------------------------------------
// A stroke's centreline as a frame: position, normal and the stroke's half-width at arc length s.
function along(line, hw) {
  const S = [0]; for (let i = 1; i < line.length; i++) S.push(S[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const len = S.at(-1), at = s => { s = Math.max(0, Math.min(len, s)); let lo = 0, hi = S.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (S[m] <= s) lo = m; else hi = m - 1; }
    const j = lo, f = (s - S[j]) / ((S[j + 1] - S[j]) || 1), a = line[j], b = line[j + 1], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
    return [a[0] + tx * f, a[1] + ty * f, -ty / l, tx / l, hw[j] + (hw[j + 1] - hw[j]) * f]; };
  return { S, len, at };
}
// the piece of a stroke between arc lengths s0 and s1 as a polygon a little wider than the stroke (clipped to the body later)
function slab(A, s0, s1, out = 1.5) {
  const l = [], r = [], n = Math.max(2, Math.ceil((s1 - s0) / .5));
  for (let k = 0; k <= n; k++) { const [x, y, nx, ny, h] = A.at(s0 + (s1 - s0) * k / n), w = h + out; l.push([x + nx * w, y + ny * w]); r.push([x - nx * w, y - ny * w]); }
  return l.concat(r.reverse());
}
// paths filled into one canvas and multiplied by a mask (the body inside the letter's rings): coverage on the sheet's grid
function masked(L, mask, polys) {
  const g = new OffscreenCanvas(L.w, L.h).getContext('2d', { willReadFrequently: true }); g.setTransform(L.res, 0, 0, L.res, 0, 0); g.fillStyle = '#000';
  for (const p of polys) g.fill(p instanceof Path2D ? p : pathOf(p));
  const d = g.getImageData(0, 0, L.w, L.h).data, M = new Float32Array(L.w * L.h); for (let q = 0; q < M.length; q++) M[q] = d[q * 4 + 3] / 255 * mask[q];
  return M;
}
// A free end of a stroke whose swell can hold a roundel: its centre, radius and place along the stroke.
function terminals(st, A, u, clear) {
  const o = []; if (st.closed) return o;
  for (const end of [0, 1]) { if (st.forks[end]) continue;
    const P = end ? st.pts.slice().reverse() : st.pts, H = end ? st.hw.slice().reverse() : st.hw;
    let bi = 0; for (let i = 0; i < Math.min(P.length * .3, 14); i++) if (H[i] - i * u * .08 > H[bi] - bi * u * .08) bi = i;
    const R = H[bi] - clear; if (R < u * 1.6) continue;
    const s = end ? A.len - A.S[A.S.length - 1 - bi] : A.S[bi], c = P[bi], q = P[Math.min(P.length - 1, bi + 6)];
    o.push({ end, c, R, s, a0: Math.atan2(q[1] - c[1], q[0] - c[0]), cw: (bi + end) % 2 ? 1 : -1 });
  }
  return o;
}
// The running scroll (Durrow fol. 86r's line-fillers; a thin panel's fill here): a line rolling forward that turns a loop at
// every crest, a prolate trochoid x = t − d·sin t, y = −cos t (d > 1: the line runs back over itself at the crest). n loops
// between s0 and s1, half-height a, mapped onto a stroke (A) or left straight (y about 0).
function scrollLine(A, s0, s1, a, n, { d = 2.2, ds = .4, side = 1 } = {}) {
  const T = n * Math.PI * 2, X = t => t - d * Math.sin(t), t0 = -Math.PI * .5, t1 = T + Math.PI * .5, sx = (s1 - s0) / (X(t1) - X(t0)), o = [], m = Math.max(60, Math.ceil((s1 - s0) * 4 / ds));
  for (let i = 0; i <= m; i++) { const t = t0 + (t1 - t0) * i / m, x = s0 + (X(t) - X(t0)) * sx, y = -side * a * Math.cos(t); if (A) { const [px, py, nx, ny] = A.at(x); o.push([px + nx * y, py + ny * y]); } else o.push([x, y]); }
  return o;
}
// The body divided by bars into compartments along each stroke, each filled: long panels of plait and short panels holding a
// closed knot in turn (f. 139r's bowl: dense interlace with blue knots set in it; its stem: panel, square, panel). Measured on
// f. 139r: a long panel ~2 band-widths, a knot panel ~1, the bar ~0.12 of the band. A free end swelling enough holds a roundel;
// a free end too thin for a plait is a solid block of colour (the head of a Durrow stem). look: { long: [schemes], short:
// [schemes], solid: ink, bar(S, A, s, half), knot(S, C, K, u, scheme), roundel(S, t) } — the direction's own drawing.
function compartments(L, S, Bd, { u0, clear, seed, look }) {
  const grounds = new Map(), jobs = [], bars = [], rnd = stream(seed, 'comp'); let nl = 0, ns = 0;
  const put = (ink, poly) => (grounds.get(ink) ?? grounds.set(ink, []).get(ink)).push(poly);
  for (const st of strokes(L, Math.max(1, u0 * .5))) {
    const A = along(st.pts, st.hw), len = A.len; if (len < u0 * 3) continue;
    const T = terminals(st, A, u0, clear);
    const hwc = st.hw.map(h => h - clear).filter(h => h > 0).sort((a, b) => a - b), hm = hwc[Math.floor(hwc.length * .6)] ?? 0; if (hm < u0 * .8) continue;
    const rows = hm / 2 >= u0 ? 2 : 1, u = hm / rows, bw = 2 * hm, barW = Math.max(1.1, bw * .12);
    // the run: from a fork, the other stroke's edge; from a roundel, its rim; from a bare end, the tip (a solid block there)
    let a = 0, b = len;
    for (const end of [0, 1]) { const t = T.find(x => x.end === end), ed = end ? b : a, hwE = end ? st.hw.at(-1) : st.hw[0];
      let cut; if (st.closed) cut = 0; else if (st.forks[end]) cut = hwE * .98; else if (t) cut = t.s + t.R + clear * .3;   // (t.s: from its own end)
      else { const blk = Math.min(len * .3, hwE * 1.6 + u); put(look.solid, slab(A, end ? len - blk - 1 : 0, end ? len : blk + 1, 3)); cut = blk; }
      if (end) b = len - cut; else a = cut; }
    for (const t of T) jobs.push(() => look.roundel(S, t));
    const run = b - a; if (run < u * 3) continue;
    // long, short, long ... in whole cells (cell 2u): long ≈ 2 bands (4 cells at 2 rows), short ≈ 1 band
    const [cl, cs] = look.cells ? look.cells(rows) : [rows === 2 ? 4 : 3, 2], cell = 2 * u;
    let k = Math.max(1, Math.round((run + cs * cell) / ((cl + cs) * cell + 2 * barW))); if (st.closed) k = Math.max(2, Math.round(run / ((cl + cs) * cell + 2 * barW)));
    const parts = []; for (let i = 0; i < k; i++) { parts.push('L'); if (i < k - 1 || st.closed) parts.push('S'); }
    const want = parts.reduce((x, p) => x + (p === 'L' ? cl : cs) * cell + barW, 0) - (st.closed ? 0 : barW), sc = run / want;
    let s = a;
    if (!st.closed) bars.push([A, a]);
    for (const p of parts) {
      const L0 = (p === 'L' ? cl : cs) * cell * sc, s0 = s, s1 = s + L0, sch = p === 'L' ? look.long[nl++ % look.long.length] : look.short[ns++ % look.short.length];
      const g0 = jobs.length;
      // each compartment its own rows and cell, from the stroke's width there; the band stretched or pressed to follow it
      const ws = [0, .2, .4, .6, .8, 1].map(f => A.at(s0 + (s1 - s0) * f)[4] - clear), wl = Math.min(...ws), wm = ws.slice().sort((x, y) => x - y)[3];
      const wq = ws.slice().sort((x, y) => x - y)[1], rc = Math.max(1, Math.min(3, Math.floor(wq / (u0 * 1.0)))), uc = Math.min(wq / rc, L0 / (p === 'L' ? 2 : 1.6)), cc = 2 * uc;
      const fit0 = x => (A.at(x)[4] - clear) / (rc * uc), fit = x => Math.min(1.5, fit0(x - uc), fit0(x), fit0(x + uc));
      const nA = p === 'L' ? Math.max(1, Math.floor(L0 / cc + .15)) : Math.max(1, Math.min(rc === 1 ? 1 : 2, Math.floor(L0 / cc + .3)));
      if (p === 'S' && look.block) jobs.push(() => look.block(S, A, s0, s1, sch));
      else if (p === 'S' && (rc === 1 || nA < 2) && look.jewel) { const m = A.at((s0 + s1) / 2); jobs.push(() => look.jewel(S, m, Math.min(L0 / 2, wl) * .92, sch)); }
      else if (wl / (rc * uc) >= .45 && uc >= u0 * .55 && nA * cc <= L0 + cc * .2) {
        const sA = s0 + (L0 - nA * cc) / 2, per = 2 + Math.floor(rnd() * 2);
        const wall = p === 'S' ? (rc >= 2 && nA >= 3 ? (x, y) => y === 2 && (x === 1 || x === 2 * nA - 1) : null)
          : rc >= 2 ? (x, y) => (y === 2 || y === 4) && (x & 1) === 0 && x > 0 && x < 2 * nA && (x / 2 + y / 2) % per === 0 : null;
        if (rc === 1 && p === 'L' && look.scroll) { const n = Math.max(2, Math.round(L0 / (Math.min(wm, wl * 1.3) * 1.5))); jobs.push(() => look.scroll(S, scrollLine(A, s0 + wm * .3, s1 - wm * .3, Math.min(wm, wl * 1.3) * .62, n), Math.min(wm, wl * 1.3), sch)); }
        else jobs.push(() => { const pn = bandAlong(st.pts, sA, nA, rc, uc, { wall, squeeze: x => Math.max(.45, Math.min(1.5, fit(x))) }); look.knot(S, pn.C, pn.K, uc, sch); });
      } else if (look.jewel && wl > u0 * .5 && !look.empty) { const m = A.at((s0 + s1) / 2); jobs.push(() => look.jewel(S, m, Math.min(L0 / 2, wl) * .92, sch)); }
      // (a compartment left without a fill is a plain block of colour where the direction has one)
      put(jobs.length === g0 && look.empty ? look.empty(nl + ns) : sch.ground, slab(A, s0 - barW / 2, s1 + barW / 2));
      s = s1 + barW; if (s < b - 1 || st.closed) bars.push([A, s1 + barW / 2]);
    }
    if (!st.closed) bars.push([A, b]);
    for (const bb of bars.filter(x => x[0] === A)) bb.push(barW, Math.max(...st.hw) + 2);
  }
  for (const [ink, polys] of grounds) S.image(ink, masked(L, Bd, polys));
  for (const j of jobs) j();
  look.bars(S, bars.map(([A, s, w, half]) => { const [x, y, nx, ny] = A.at(s), tx = ny, ty = -nx; return { x, y, nx, ny, tx, ty, w, half }; }), Bd, L);
}

// ---- panels of a frame or a break: knot, key and knot in turn, between rules ------------------------------------------
// A strip (along x, from x0, length len, thickness th, centred on y) laid as a row of panels joined by bars: the panels alternate
// a plait with breaks and a key (step) pattern, as Lindisfarne's frames do. map() turns the strip's own frame onto the page
// (so the same code lays the four sides of a frame). look: the inks and the cord drawing of the direction.
function strip(S, map, len, th, seed, look, { ends = true } = {}) {
  const u = th / 4, rnd = stream(seed, 'strip'), bar = Math.max(1, u * .55), poly = pts => pathOf(pts.map(map));
  const rect = (x, y, w, h) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
  S.fill(rect(0, -th / 2, len, th), look.ground);
  // panels: as many as fit, a key every other, each a whole number of cells
  const cell = 2 * u, n = Math.max(1, Math.round((len - bar) / (cell * 4.5 + bar))), pw = (len - bar * (n + 1)) / n;
  for (let i = 0; i < n; i++) {
    const x = bar + i * (pw + bar), key = look.key && i % 2 === 1;
    if (key) { keyPanel(S, map, x, -th / 2, pw, th, look); continue; }
    const A = Math.max(1, Math.floor(pw / cell)), ox = x + (pw - A * cell) / 2, per = 2 + Math.floor(rnd() * 2), kind = Math.floor(rnd() * 3);
    const wall = (wx, wy) => kind === 0 ? wy === 2 && (wx & 1) === 0 && (wx / 2) % per === 0 && wx > 0 && wx < 2 * A
      : kind === 1 ? (wx & 1) === 1 && wy === 2 && ((wx - 1) / 2) % per === 1 : wy === 2 && (wx & 1) === 0 && wx > 0 && wx < 2 * A && (wx / 2) % 2 === 1;
    const K = plait(A, 2, () => true, wall), C = measure(cords(K, { ox, oy: -th / 2, u, inset: .3, round: 1.08, edgeInset: .2 }), u);
    for (const c of C) c.pts = c.pts.map(map);
    look.knot(S, C, K, u, i);
  }
  // the bars between panels and the rules along the strip
  for (let i = 0; i <= n; i++) S.fill(rect(i * (pw + bar), -th / 2, bar, th), look.rule);
  const rl = Math.max(.8, u * .32); S.fill(rect(0, -th / 2 - rl, len, rl), look.rule); S.fill(rect(0, th / 2, len, rl), look.rule);
  if (look.edge) { const e = Math.max(.9, u * .4); S.fill(rect(0, -th / 2 - rl - e, len, e), look.edge); S.fill(rect(0, th / 2 + rl, len, e), look.edge); }
}
// a key pattern: square keys, each a line wound in one and a half turns, turned a quarter at each cell (a step-and-key frieze)
function keyPanel(S, map, x, y, w, h, look) {
  const m = Math.max(1, Math.round(w / h)), s = w / m, lw = Math.max(.7, h * .085);
  S.fill(pathOf([[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(map)), look.keyGround);
  for (let i = 0; i < m; i++) { const cx = x + s * (i + .5), cy = y + h / 2, hs = Math.min(s, h) * .42, flip = i % 2 ? -1 : 1;
    const K = [[-1, -1], [1, -1], [1, 1], [-.5, 1], [-.5, -.4], [.45, -.4], [.45, .45], [0, .45]].map(([a, b]) => [cx + a * hs * flip, cy + b * hs * flip]).map(map);
    cordLine(S, K, [{ w: lw, ink: look.keyLine }], { taper: false });
  }
}

// ---- A · Lindisfarne ------------------------------------------------------------------------------------------------------
const LIND = {
  ground: 'k', rule: 'k', edge: 'y', key: true, keyGround: 'y', keyLine: 'k',
  knot: (S, C, K, u, i) => knot(S, C, K.crossings, { layers: [{ w: u * .82, ink: 'k' }, { w: u * .82 - Math.max(.5, u * .3), ink: 'y' }], gap: Math.max(.35, u * .12), ground: 'k',
    colour: t => t === 1 ? (i % 4 === 0 ? 'b' : 'g') : 'y' }),
};
export function lindInitial(ch, H, seed = 1, { theme = 'light', res = 2 } = {}) {
  const L = letterField(ch, H, { res, bold: H * .055 }), S = new Sheet([0, 0, L.W, L.Ht], res), dk = theme === 'dark';
  const pen = Math.max(1.1, H * .014), { frame, Bd } = rings(L, S, [{ w: pen, ink: dk ? 'l' : 'k', pen: true }, { w: Math.max(1.3, H * .017), ink: 'y' }, { w: Math.max(.55, H * .0055), ink: 'k', pen: true }], 'y');
  const u0 = Math.max(2.4, H / 40), hair = Math.max(.45, H * .0045);
  compartments(L, S, Bd, { u0, clear: frame + .4, seed, look: {
    long: [{ ground: 'r', cord: 'y' }, { ground: 'k', cord: 'g' }], short: [{ ground: 'k', cord: 'b' }, { ground: 'p', cord: 'y' }], solid: 'r',
    knot: (S, C, K, u, sch) => { const w = u * .86; knot(S, C, K.crossings, { layers: [{ w, ink: 'k' }, { w: w - Math.max(.5, u * .3), ink: sch.cord }], gap: Math.max(.3, u * .12), ground: sch.ground }); },
    bars: (S, B, Bd, L) => { const q = (b, w) => { const { x, y, nx, ny, tx, ty, half } = b; return [[x + tx * w / 2 + nx * half, y + ty * w / 2 + ny * half], [x - tx * w / 2 + nx * half, y - ty * w / 2 + ny * half], [x - tx * w / 2 - nx * half, y - ty * w / 2 - ny * half], [x + tx * w / 2 - nx * half, y + ty * w / 2 - ny * half]]; };
      S.image('k', masked(L, Bd, B.map(b => q(b, b.w + 2 * hair)))); S.image('y', masked(L, Bd, B.map(b => q(b, b.w)))); },
    scroll: (S, pts, w, sch) => { const W = Math.max(1, w * .42); cordLine(S, pts, [{ w: W, ink: 'k' }, { w: W - Math.max(.5, W * .36), ink: sch.cord }]); },
    // a cross of four lentoids (f. 139r sets them in black between its spirals)
    jewel: (S, m, r, sch) => { const [x, y, nx, ny] = m, P = new Path2D(), a = r * .5, b = r * .17;
      for (const [dx, dy] of [[nx, ny], [-nx, -ny], [ny, -nx], [-ny, nx]]) { const cx = x + dx * (a + r * .06), cy = y + dy * (a + r * .06); P.moveTo(cx - dx * a, cy - dy * a);
        for (const sg of [1, -1]) for (let k = sg > 0 ? 1 : 19; sg > 0 ? k <= 20 : k >= 0; k += sg) { const f = k / 10 - 1, h = sg * b * (1 - f * f); P.lineTo(cx + dx * a * f - dy * h, cy + dy * a * f + dx * h); } P.closePath(); }
      S.fill(P, sch.cord); const e = new Path2D(); e.arc(x, y, r * .1, 0, Math.PI * 2); S.fill(e, sch.cord); },
    roundel: (S, t) => { const { c, R } = t, disc = r => { const P = new Path2D(); P.arc(c[0], c[1], r, 0, Math.PI * 2); return P; };
      S.fill(disc(R + hair), 'k'); S.fill(disc(R), 'y'); S.fill(disc(R - Math.max(1, R * .16)), 'k'); S.fill(disc(R - Math.max(1, R * .16) - hair), 'b');
      const ri = R - Math.max(1, R * .16) - hair, W = Math.max(.9, ri * .19); triskele(S, c, ri * .8, t.a0, () => [{ w: W, ink: 'k' }, { w: W - Math.max(.45, W * .34), ink: 'y' }], { len: 1.75, eye: .07 });
      const hub = new Path2D(); hub.arc(c[0], c[1], W * .5, 0, Math.PI * 2); S.fill(hub, 'k'); },
  } });
  const dr = Math.max(.75, H * .0105); diaper(L, S, dr, dr * 2 * 1.85);
  dotRows(L, S, dr, H > 90 ? 2 : 1, seed);
  return { S, W: L.W, H: L.Ht, P: L.P, L };
}
// the paraph: a small knot of two cords broken once at its heart (not the plain 2×2), three dots beside it as a positura
export function lindParaph(size, seed = 1, { res = 2, theme = 'light' } = {}) {
  const u = size / 4.4, pad = size * .3, Wd = size * 1.75, S = new Sheet([0, 0, Wd + 2 * pad, size + 2 * pad], res), ox = pad, oy = pad + (size - 4 * u) / 2;
  const K = plait(2, 2, () => true, (x, y) => x === 2 && y === 2), C = measure(cords(K, { ox, oy, u, inset: .3, round: 1.12, edgeInset: .18 }), u);
  knot(S, C, K.crossings, { layers: [{ w: u * .95, ink: theme === 'dark' ? 'l' : 'k' }, { w: u * .95 - u * .34, ink: 'r' }], gap: u * .14, ground: null });
  const dr = Math.max(.8, size * .07), x = ox + 4 * u + size * .32, cy = pad + size / 2;
  S.dots([[x, cy - dr * 1.9, dr * 1.05, -.5, 1.1], [x, cy + dr * 1.9, dr * .95, -.5, 1.1], [x + dr * 3.1, cy, dr, -.5, 1.1]], 'd');
  return { S, W: Wd + 2 * pad, H: size + 2 * pad };
}
// the filler: a short panel of plait that closes on itself, then the three-dot positura (not a chain run to the margin)
function shortPanel(len, ht, seed, look, res, { dots = 'd' } = {}) {
  const pad = ht * .45, S = new Sheet([0, 0, len + 2 * pad, ht + 2 * pad], res), u = ht / 4.4, A = Math.max(2, Math.min(7, Math.floor((len - ht * 1.6) / (2 * u))));
  const w = A * 2 * u + u * 1.2, x0 = pad + u * .6, y0 = pad + ht / 2 - 2 * u;
  const P = new Path2D(); P.roundRect(x0 - u * .6, y0 - u * .6, w, 4 * u + u * 1.2, u * .7); S.fill(P, look.rule);
  const P2 = new Path2D(); P2.roundRect(x0 - u * .3, y0 - u * .3, w - u * .6, 4 * u + u * .6, u * .5); S.fill(P2, look.ground);
  const rnd = stream(seed, 'fill'), per = 2 + Math.floor(rnd() * 2);
  const K = plait(A, 2, () => true, (x, y) => y === 2 && (x & 1) === 0 && x > 0 && x < 2 * A && (x / 2) % per === 0), C = measure(cords(K, { ox: x0, oy: y0, u, inset: .3, round: 1.08, edgeInset: .2 }), u);
  look.knot(S, C, K, u, 1);
  const dr = Math.max(.8, ht * .085), x = x0 + w + ht * .45, cy = pad + ht / 2;
  S.dots([[x, cy - dr * 1.9, dr * 1.05, -.5, 1.1], [x, cy + dr * 1.9, dr * .95, -.5, 1.1], [x + dr * 3.1, cy, dr, -.5, 1.1]], dots);
  return { S, W: len + 2 * pad, H: ht + 2 * pad, pad };
}
export const lindFiller = (len, ht, seed = 1, { theme = 'light', res = 2 } = {}) => shortPanel(len, ht * .95, seed, { ...LIND, rule: theme === 'dark' ? 'l' : 'k' }, res);
// the break: a light strip of knot, key and knot panels, a row of dots above and below
export function lindBand(len, ht, seed = 1, { theme = 'light', res = 2 } = {}) {
  const th = Math.max(8, ht * .55), pad = th, S = new Sheet([0, 0, len + 2 * pad, th + 2 * pad], res), look = { ...LIND, rule: theme === 'dark' ? 'l' : 'k' };
  strip(S, ([x, y]) => [pad + x, pad + th / 2 + y], len, th, seed, look);
  const dr = Math.max(.75, th * .07), o = th / 2 + th * .3;
  for (const sg of [-1, 1]) S.dots(dotsAlong([[pad, pad + th / 2 + sg * o], [pad + len, pad + th / 2 + sg * o]], dr * 2 * 1.85, dr, false, { load: 12 }), 'd');
  return { S, W: len + 2 * pad, H: th + 2 * pad };
}
// the frame: four strips of panels, a square knot at each corner where they meet
function framed(w, h, seed, look, res, { th, dots = 'd' }) {
  const pad = th * 1.2, S = new Sheet([0, 0, w + 2 * pad, h + 2 * pad], res), x0 = pad, y0 = pad;
  const sides = [[([x, y]) => [x0 + th / 2 + x, y0 + y], w - th], [([x, y]) => [x0 + th / 2 + x, y0 + h + y], w - th], [([x, y]) => [x0 + y, y0 + th / 2 + x], h - th], [([x, y]) => [x0 + w + y, y0 + th / 2 + x], h - th]];
  sides.forEach(([m, l], i) => strip(S, m, l, th, seed + i * 7, look));
  const u = th / 4;
  for (const [cx, cy] of [[x0, y0], [x0 + w, y0], [x0, y0 + h], [x0 + w, y0 + h]]) {
    const P = new Path2D(); P.rect(cx - th / 2 - u * .35, cy - th / 2 - u * .35, th + u * .7, th + u * .7); S.fill(P, look.rule); const P2 = new Path2D(); P2.rect(cx - th / 2, cy - th / 2, th, th); S.fill(P2, look.ground);
    const K = plait(2, 2, () => true, (x, y) => (x === 2 && (y === 1 || y === 3)) || (y === 2 && (x === 1 || x === 3))), C = measure(cords(K, { ox: cx - th / 2, oy: cy - th / 2, u, inset: .3, round: 1.1, edgeInset: .2 }), u);
    look.knot(S, C, K, u, 2);
  }
  if (dots) { const dr = Math.max(.75, th * .06), o = th / 2 + th * .35, P = [], pts = [[x0 - o, y0 - o], [x0 + w + o, y0 - o], [x0 + w + o, y0 + h + o], [x0 - o, y0 + h + o]];
    for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4]; for (let s = 0; s < 1; s += .004) P.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]); }
    S.dots(dotsAlong(P, dr * 2 * 1.85, dr, true, { load: 13 }), dots); }
  return { S, W: w + 2 * pad, H: h + 2 * pad, pad };
}
export const lindFrame = (w, h, seed = 1, { theme = 'light', res = 2 } = {}) => framed(w, h, seed, { ...LIND, rule: theme === 'dark' ? 'l' : 'k' }, res, { th: Math.max(7, Math.min(10, h * .085)) });

// ---- C · Durrow ---------------------------------------------------------------------------------------------------------
// The broad ribbon (TCD MS 57, fol. 125v): pigment inside a reserved margin of vellum, a fine pen line at its edge, on a
// brown-black ground; a ribbon changes colour (red lead, orpiment, verdigris) where it passes under another.
const DUR = ['r', 'y', 'g'];
function ribbon(S, C, crossings, u, seed, { ground = 'gr', w = 1.1 } = {}) {
  const W = u * w, pen = Math.max(.45, u * .08), margin = Math.max(.5, u * .13), o = Math.floor(stream(seed, 'ribbon')() * 3);
  knot(S, C, crossings, { layers: [{ w: W, ink: 'k' }, { w: W - 2 * pen, ink: 'v' }, { w: W - 2 * pen - 2 * margin, ink: 'r' }], gap: Math.max(.4, u * .1), ground, colour: (t, k) => DUR[(o + t + k) % 3], breath: 1.4 });
}
const DURL = { ground: 'gr', rule: 'v', edge: 'k', key: true, keyGround: 'gr', keyLine: 'v', knot: (S, C, K, u, i) => ribbon(S, C, K.crossings, u, i * 13 + 1, { w: 1.06 }) };
// The Durrow coil (fol. 86r): a disc of vellum wound with two pen lines (two arms half a turn apart, an Archimedean spiral at
// a pitch the pen can hold), a pigment eye at its heart, a band of pigment round it and the pen line outside.
function coil(S, c, R, a0, cw, { eye = 'y', band = 'r', pen = 'k' } = {}) {
  const lw = Math.max(.42, R * .05), bw = Math.max(.8, R * .13), Ri = R - bw - lw, re = Math.max(lw * 2.2, Ri * .24);
  const disc = (r, ink) => { const P = new Path2D(); P.arc(c[0], c[1], r, 0, Math.PI * 2); S.fill(P, ink); };
  disc(R + lw, pen); disc(R, band); disc(Ri + lw * .5, pen); disc(Ri, 'v'); disc(re, eye);
  const turns = Math.max(1.25, Math.min(5, (Ri - re) / (2 * Math.max(1.25, lw * 2.6))));
  for (const off of [0, Math.PI]) { const o = [], n = Math.ceil(turns * 90);
    for (let i = 0; i <= n; i++) { const f = i / n, r = re + (Ri - re) * f, a = a0 + off + cw * f * turns * Math.PI * 2; o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
    cordLine(S, o, [{ w: lw, ink: pen }], { taper: true }); }
  // the eye's comma: a pen stroke curling into its heart
  const o = []; for (let i = 0; i <= 40; i++) { const f = i / 40, r = re * (1 - .8 * f), a = a0 + cw * f * Math.PI * 1.6; o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
  cordLine(S, o, [{ w: lw * 1.2, ink: pen }]);
}
export function durInitial(ch, H, seed = 1, { theme = 'light', res = 2 } = {}) {
  const L = swell(letterField(ch, H, { res, bold: H * .05, pad: .3 }), Math.max(2.4, H / 40)), S = new Sheet([0, 0, L.W, L.Ht], res);
  const hair = Math.max(.45, H * .005), { frame, Bd } = rings(L, S, [{ w: Math.max(.8, H * .01), ink: 'k', pen: true }, { w: Math.max(1.4, H * .018), ink: 'y' }, { w: hair, ink: 'k', pen: true }], 'r');
  const u0 = Math.max(2.4, H / 40); let nc = 0;
  compartments(L, S, Bd, { u0, clear: frame + .3, seed, look: {
    cells: rows => [rows === 1 ? 5 : 6, 1.5],
    long: [{ ground: 'k', cord: 'v' }], short: [{ ground: 'y' }, { ground: 'r' }], solid: 'y',
    block: () => {}, empty: i => i % 2 ? 'y' : 'r',
    knot: (S, C, K, u, sch) => { const w = u * 1.02; knot(S, C, K.crossings, { layers: [{ w, ink: 'k' }, { w: w - Math.max(.4, u * .2), ink: 'v' }], gap: Math.max(.28, u * .09), ground: 'k', breath: 1.4 }); },
    scroll: (S, pts, w) => { const W = Math.max(1, w * .4); cordLine(S, pts, [{ w: W, ink: 'k' }, { w: W - Math.max(.5, W * .36), ink: 'v' }]); },
    jewel: (S, m, r) => { const [x, y, nx, ny] = m, P = new Path2D(), a = r * .5, b = r * .17;
      for (const [dx, dy] of [[nx, ny], [-nx, -ny], [ny, -nx], [-ny, nx]]) { const cx = x + dx * (a + r * .06), cy = y + dy * (a + r * .06); P.moveTo(cx - dx * a, cy - dy * a);
        for (const sg of [1, -1]) for (let k = sg > 0 ? 1 : 19; sg > 0 ? k <= 20 : k >= 0; k += sg) { const f = k / 10 - 1, h = sg * b * (1 - f * f); P.lineTo(cx + dx * a * f - dy * h, cy + dy * a * f + dx * h); } P.closePath(); }
      S.fill(P, 'v'); },
    bars: (S, B, Bd, L) => { const q = (b, w) => { const { x, y, nx, ny, tx, ty, half } = b; return [[x + tx * w / 2 + nx * half, y + ty * w / 2 + ny * half], [x - tx * w / 2 + nx * half, y - ty * w / 2 + ny * half], [x - tx * w / 2 - nx * half, y - ty * w / 2 - ny * half], [x + tx * w / 2 - nx * half, y + ty * w / 2 - ny * half]]; };
      S.image('k', masked(L, Bd, B.map(b => q(b, b.w * .6 + 2 * hair)))); S.image('y', masked(L, Bd, B.map(b => q(b, b.w * .6)))); },
    roundel: (S, t) => coil(S, t.c, t.R + frame * .7, t.a0, t.cw, { eye: nc % 2 ? 'r' : 'y', band: nc++ % 2 ? 'y' : 'r' }),
  } });
  const dr = Math.max(.8, H * .0095); dotRows(L, S, dr, 1, seed);
  return { S, W: L.W, H: L.Ht, P: L.P, L };
}
// the paraph: the triple spiral as a ribbon, each arm its own pigment
export function durParaph(size, seed = 1, { res = 2 } = {}) {
  const pad = size * .2, R = size * .62, S = new Sheet([0, 0, 2 * R + 2 * pad, 2 * R + 2 * pad], res), c = [pad + R, pad + R], u = R / 3.2;
  const W = u * 1.05, pen = Math.max(.4, u * .09), margin = Math.max(.45, u * .14), rot = stream(seed, 'tri')() * 6.28;
  [0, 1, 2].forEach(k => { const a = rot + k * Math.PI * 2 / 3, p = [c[0] + Math.cos(a) * R * .05, c[1] + Math.sin(a) * R * .05];
    cordLine(S, tendril(p, a, R * 1.45, .9 / R, 1 / (R * .12), 2.4, R / 140), [{ w: W, ink: 'k' }, { w: W - 2 * pen, ink: 'v' }, { w: W - 2 * pen - 2 * margin, ink: DUR[k] }]); });
  const hub = new Path2D(); hub.arc(c[0], c[1], W * .55, 0, Math.PI * 2); S.fill(hub, 'k');
  return { S, W: 2 * R + 2 * pad, H: 2 * R + 2 * pad };
}
export const durFiller = (len, ht, seed = 1, { res = 2 } = {}) => shortPanel(len, ht, seed, { ...DURL, rule: 'k' }, res);
export function durBand(len, ht, seed = 1, { res = 2 } = {}) {
  const th = Math.max(9, ht * .62), pad = th, S = new Sheet([0, 0, len + 2 * pad, th + 2 * pad], res);
  strip(S, ([x, y]) => [pad + x, pad + th / 2 + y], len, th, seed, DURL);
  const dr = Math.max(.8, th * .065), o = th / 2 + th * .32;
  for (const sg of [-1, 1]) S.dots(dotsAlong([[pad, pad + th / 2 + sg * o], [pad + len, pad + th / 2 + sg * o]], dr * 2 * 1.9, dr, false, { load: 10 }), 'd');
  return { S, W: len + 2 * pad, H: th + 2 * pad };
}
export const durFrame = (w, h, seed = 1, { res = 2 } = {}) => framed(w, h, seed, DURL, res, { th: Math.max(8, Math.min(11, h * .095)) });

// ---- the directions -------------------------------------------------------------------------------------------------------
// pigment coats (Sheet.print): orpiment dense with a coarse crystal tooth, verdigris thinner and granulating, red lead dense
const COATS = { y: { base: .78, slow: .05, tooth: .06, grainPx: 1.1 }, g: { base: .7, slow: .1, tooth: .03, grainPx: .7, wet: .14 }, b: { base: .72, slow: .08, tooth: .03, grainPx: .8, wet: .12 },
  r: { base: .8, slow: .04, tooth: .03, grainPx: .6 }, v: { base: .74, slow: .05, tooth: .04, grainPx: .7 }, d: { base: .84, slow: .03, tooth: .02, grainPx: .5, wet: .12 }, gr: { base: .88, slow: .04, tooth: .03, grainPx: .9 } };
export const DIRS = {
  lind: { name: 'A · Lindisfarne', pal: 'lind', order: ['k', 'l', 'v', 'p', 'y', 'g', 'b', 'r', 'd'], tex: ink => COATS[ink] ?? 0,
    note: 'The clear, measured book (BL Cotton MS Nero D IV, c. 715). The panel letter: Uncial Antiqua’s capital, grown a little, its outline laid by a quill (heavy where the edge runs across the nib, a hair along it), a band of orpiment, a hairline; each stroke carries a plait laid along its own curve, orpiment with a cord picked out in verdigris or blue, a finer red-lead interlace filling what is left (f. 139r), and each free stroke-end wound into a spiral. Closed counters carry the lozenge diaper of dots (f. 27r); two rows of dots run round the letter, each dot a touch of a brush reloaded every dozen, the pitch following the bend. Paraph: a knot broken at its heart and the three-dot positura. Filler: a short panel that closes on itself. Break and frame: panels of knot and key in turn between rules, a knot at each corner.',
    initial: lindInitial, paraph: lindParaph, filler: lindFiller, brk: lindBand, frame: lindFrame },
  durrow: { name: 'C · Durrow', pal: 'durrow', order: ['gr', 'k', 'v', 'r', 'y', 'g', 'd'], tex: ink => COATS[ink] ?? 0,
    note: 'The broad ribbon of the Book of Durrow (TCD MS 57, c. 680), and the dark mode’s own model: three pigments and black. Each ribbon a fill inside a reserved margin of bare vellum with a pen line at its edge, breathing along its length; it changes colour where it passes under another (fol. 125v). The letter outlined in vellum between quill lines, its body black, a broad ribbon plait along each stroke, a narrower one where the stroke thins, the ends wound into spirals; one close row of dots. Paraph: the triple spiral as a ribbon. Filler: a short ribbon panel. Break and frame: ribbon panels and vellum keys in turn. In dark mode the page is the ground already.',
    initial: durInitial, paraph: durParaph, filler: durFiller, brk: durBand, frame: durFrame },
};
