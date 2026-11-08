// Insular, direction studies (research/20-insular.md). Each direction makes the same pieces: the drop initial (a panel letter:
// the face's stroke region outlined, its body filled with a knot fitted to its cells, its counters worked, red dots round it),
// the paraph, the line-filler, the break and the frame. Every piece is a Sheet (kit/styles/insular-knot.js) of per-ink
// coverage, poured ink by ink through the ink engine. Nothing here is drawn from a raster of the master: the letter's shape is
// Uncial Antiqua's (OFL), everything else is generated.
import { plait, cords, knot, measure, dotsAlong, Sheet, pathOf, stream } from '../kit/styles/insular-knot.js';
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
  for (let q = 0; q < M.length; q++) { Din[q] /= res; Dout[q] /= res; }
  // counters: paper not reached from the border
  const hole = new Uint8Array(w * h), st = []; for (let i = 0; i < w; i++) st.push(i, (h - 1) * w + i); for (let j = 0; j < h; j++) st.push(j * w, j * w + w - 1);
  const reach = new Uint8Array(w * h); while (st.length) { const q = st.pop(); if (reach[q] || inn[q]) continue; reach[q] = 1; const i = q % w, j = q / w | 0; if (i) st.push(q - 1); if (i < w - 1) st.push(q + 1); if (j) st.push(q - w); if (j < h - 1) st.push(q + w); }
  for (let q = 0; q < M.length; q++) hole[q] = !inn[q] && !reach[q];
  return { ch, H, res, W, Ht, P, w, h, M, Din, Dout, hole, at: (x, y, F) => { const i = Math.round(x * res), j = Math.round(y * res); return i < 0 || j < 0 || i >= w || j >= h ? 0 : F[j * w + i]; } };
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

// ---- A · Lindisfarne ------------------------------------------------------------------------------------------------------
// The panel letter: a heavy ink contour, a band of orpiment, a hairline, then the body as a black panel worked with a fine
// plait in orpiment (and its smaller cords in verdigris and blue); counters with the lozenge diaper of red dots; two rows of
// red dots round the letter at the measured pitch (research/20: pitch ≈ 1.8 dot diameters, the first row a third of a dot off
// the ink).
export function lindInitial(ch, H, seed = 1, { theme = 'light', res = 2 } = {}) {
  const L = letterField(ch, H, { res, bold: H * .03 }), S = new Sheet([0, 0, L.W, L.Ht], res);
  const lc = Math.max(1.2, H * .016), band1 = Math.max(1.4, H * .019), hair = Math.max(.6, H * .006);
  const a1 = lc, a2 = a1 + band1, a3 = a2 + hair;
  const dk = theme === 'dark';
  // the body: the panel's ground (the page's own dark in dark mode)
  S.image('k', band(L, L.Din, a3 - .2, 1e9));
  // the knot
  const u = Math.max(2.3, Math.min(6, H / 42)), W = u * .82;
  // the body: each stroke a panel of plait along it (as f. 139r's bands), the cords' colours turning by panel
  const PN = panels(L, u, a3 + u * .3, { seed }), cols = [['y', 'g'], ['y', 'b'], ['g', 'y'], ['b', 'y']];
  // (orpiment cords, one cord in each panel picked out in verdigris or blue, as f. 138v's panels)
  PN.forEach((pn, i) => { const by = pn.C.map((c, t) => [c.L, t]).sort((x, y) => y[0] - x[0]), accent = by.length > 1 ? by[1][1] : -1, ac = i % 2 ? 'b' : 'g';
    knot(S, pn.C, pn.K.crossings, { layers: [{ w: W, ink: 'k' }, { w: W - Math.max(.6, u * .16) * 2, ink: 'y' }], gap: Math.max(.4, u * .12), ground: 'k', colour: t => t === accent ? ac : 'y' }); });
  const K = { across: { panels: PN.map(p => p.rows + 'x' + Math.round((p.s1 - p.s0) / (2 * u))) }, threads: PN.flatMap(p => p.K.threads), crossings: new Map(PN.flatMap(p => [...p.K.crossings])) };
  // the frame of the letter: ink, orpiment, hairline (in dark mode the ink line is the vellum's pale line)
  S.image(dk ? 'l' : 'k', band(L, L.Din, 0, a1));
  S.image('y', band(L, L.Din, a1, a2));
  S.image('k', band(L, L.Din, a2, a3));
  // counters: the diaper of dots on a lozenge lattice, clear of the letter by a dot
  const dr = Math.max(.75, H * .0105), pitch = dr * 2 * 1.85;
  // (f. 27r: lines of dots crossing on the diagonals, lozenges ~5 dots a side, three dots set in each)
  const side = pitch * 5, diaper = [], ok = (x, y) => L.at(x, y, L.hole) && L.at(x, y, L.Dout) > dr * 2.2, R2 = Math.SQRT1_2;
  const cx0 = L.W / 2, cy0 = L.Ht / 2, n = Math.ceil(Math.hypot(L.W, L.Ht) / side), at = (a, b) => [cx0 + (a + b) * R2, cy0 + (a - b) * R2];
  const put = (a, b, r) => { const [x, y] = at(a, b); if (ok(x, y)) diaper.push([x, y, r]); };
  for (let k = -n; k <= n; k++) for (let m = -5 * n; m <= 5 * n; m++) { put(k * side, m * pitch, dr * .9); if (m % 5) put(m * pitch, k * side, dr * .9); }
  for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) { const a = (i + .5) * side, b = (j + .5) * side;
    for (const [da, db] of [[-.42, -.42], [.42, -.42], [0, .5]]) put(a + da * pitch, b + db * pitch, dr * .8); }
  S.dots(diaper, 'd');
  // rows of dots round the letter: the first a third of a dot off the ink, the next a pitch beyond
  const rows = H > 90 ? 2 : 1, hand = noise1(seed * 7 + 3);
  for (let k = 0; k < rows; k++) {
    const off = dr * (1 + .33 * 2) + k * pitch * .9;
    for (const lp of ring(L, off)) {
      // (only the outer rows: a level line inside a counter would crowd it; the counters carry the diaper)
      S.dots(dotsAlong(lp, pitch, (i, n) => dr * (.92 + .16 * hand(i * .37))), 'd');
    }
  }
  return { S, W: L.W, H: L.Ht, P: L.P, L, K };
}

// a small closed knot (2×2 cells: two cords) in a ring of dots: the paraph
export function lindParaph(size, seed = 1, { res = 2 } = {}) {
  const u = size / 4.6, pad = size * .5, S = new Sheet([0, 0, size + 2 * pad, size + 2 * pad], res), ox = pad + (size - 4 * u) / 2;
  const K = plait(2, 2), C = measure(cords(K, { ox, oy: ox, u, inset: .3, round: 1.1, edgeInset: .2 }), u), W = u * .95;
  knot(S, C, K.crossings, { layers: [{ w: W, ink: 'k' }, { w: W - u * .34, ink: 'r' }], gap: u * .14, ground: null });
  const dr = Math.max(.8, size * .055), cx = pad + size / 2, R = size * .62, ring = [];
  for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; ring.push([cx + Math.cos(a) * R, cx + Math.sin(a) * R]); }
  S.dots(dotsAlong(ring, dr * 2 * 1.8, dr), 'd');
  return { S, W: size + 2 * pad, H: size + 2 * pad };
}
// a band of plait between ruled edges: the break (rows: cells high), its ends closed by the plait's own turns
export function lindBand(len, ht, seed = 1, { rows = 2, theme = 'light', dots = true, res = 2 } = {}) {
  const pad = ht * .45, S = new Sheet([0, 0, len + 2 * pad, ht + 2 * pad], res), lc = Math.max(1.1, ht * .05), yb = Math.max(1.2, ht * .07);
  const inner = ht - 2 * (lc + yb + lc * .6), u = inner / (2 * rows), A = Math.max(2, Math.round((len - 2 * (lc + yb + lc * .6)) / (2 * u)));
  const L0 = A * 2 * u + 2 * (lc + yb + lc * .6), x0 = pad + (len - L0) / 2, y0 = pad;
  const rect = (x, y, w, h, r) => { const P = new Path2D(); P.roundRect(x, y, w, h, r); return P; };
  S.fill(rect(x0, y0, L0, ht, lc * 1.6), theme === 'dark' ? 'l' : 'k');
  S.fill(rect(x0 + lc, y0 + lc, L0 - 2 * lc, ht - 2 * lc, lc), 'y');
  S.fill(rect(x0 + lc + yb, y0 + lc + yb, L0 - 2 * (lc + yb), ht - 2 * (lc + yb), lc * .6), 'k');
  const ox = x0 + lc + yb + lc * .6, oy = y0 + lc + yb + lc * .6;
  const rnd = stream(seed, 'band'), per = 2 + Math.floor(rnd() * 2);
  const K = plait(A, rows, () => true, (x, y) => rows === 2 && y === 2 && (x & 1) === 0 && (x / 2) % per === 0);
  const C = measure(cords(K, { ox, oy, u, inset: .3, round: 1.08, edgeInset: .2 }), u), W = u * .82;
  knot(S, C, K.crossings, { layers: [{ w: W, ink: 'k' }, { w: W - u * .3, ink: 'y' }], gap: u * .12, ground: 'k', colour: t => ['y', 'g', 'b'][t % 3] });
  if (dots) { const dr = Math.max(.75, ht * .035), o = dr * 1.7, ring = [[x0 - o, y0 - o], [x0 + L0 + o, y0 - o], [x0 + L0 + o, y0 + ht + o], [x0 - o, y0 + ht + o]];
    const P = []; for (let i = 0; i < 4; i++) { const a = ring[i], b = ring[(i + 1) % 4]; for (let t = 0; t < 1; t += .02) P.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    S.dots(dotsAlong(P, dr * 2 * 1.85, dr), 'd'); }
  return { S, W: len + 2 * pad, H: ht + 2 * pad };
}

// the line-filler: a twist (a one-cell plait: two cords) run to the margin, closed by its own turns, three dots after it
export function lindFiller(len, ht, seed = 1, { theme = 'light', res = 2 } = {}) {
  const pad = ht * .4, u = ht / 2.1, A = Math.max(1, Math.floor((len - ht * 1.2) / (2 * u))), S = new Sheet([0, 0, len + 2 * pad, ht + 2 * pad], res);
  const K = plait(A, 1), C = measure(cords(K, { ox: pad, oy: pad + (ht - 2 * u) / 2, u, inset: .26, round: 1.1, edgeInset: .2 }), u), W = u * .78;
  knot(S, C, K.crossings, { layers: [{ w: W, ink: theme === 'dark' ? 'l' : 'k' }, { w: W - u * .3, ink: 'r' }], gap: u * .13, ground: null });
  const dr = Math.max(.8, ht * .07), x = pad + A * 2 * u + ht * .55, cy = pad + ht / 2;
  S.dots([[x, cy - dr * 1.9, dr], [x, cy + dr * 1.9, dr], [x + dr * 3.2, cy, dr]], 'd');
  return { S, W: len + 2 * pad, H: ht + 2 * pad, pad };
}
// the frame: a plait fitted to a ring of cells round the quotation, so it turns its own corners (no corner pieces), on black
// between an orpiment rule outside and an ink hairline inside, with a row of red dots beyond
export function lindFrame(w, h, seed = 1, { theme = 'light', res = 2, rows = 2, ground = 'k', strand = ['y', 'g'], pal = null } = {}) {
  const u = Math.max(2.2, Math.min(3.2, h * .03)), lc = Math.max(.9, u * .4), yb = Math.max(1.1, u * .5), band = rows * 2 * u;
  const A = Math.max(2 * rows + 1, Math.round((w + band) / (2 * u))), B = Math.max(2 * rows + 1, Math.round((h + band) / (2 * u)));
  const pad = band / 2 + lc + yb + 6, W0 = A * 2 * u, H0 = B * 2 * u, S = new Sheet([0, 0, w + 2 * pad, h + 2 * pad], res);
  const ox = pad + (w - W0) / 2, oy = pad + (h - H0) / 2, kk = theme === 'dark' ? 'l' : 'k';
  const ringP = (o, i) => { const P = new Path2D(); P.roundRect(ox - o, oy - o, W0 + 2 * o, H0 + 2 * o, Math.max(0, o) + 1); P.roundRect(ox + band + i, oy + band + i, W0 - 2 * band - 2 * i, H0 - 2 * band - 2 * i, 1); return P; };
  S.fill(ringP(lc + yb + lc, -(lc + yb + lc)), kk, { rule: 'evenodd' });
  S.fill(ringP(lc + yb, -(lc + yb)), 'y', { rule: 'evenodd' });
  S.fill(ringP(lc * .5, -lc * .5), ground, { rule: 'evenodd' });
  const K = plait(A, B, (a, b) => a < rows || b < rows || a >= A - rows || b >= B - rows, (x, y) => rows === 2 && ((x & 1) === 0) && ((y === 2 && x > 4 && x < 2 * A - 4) || (y === 2 * B - 2 && x > 4 && x < 2 * A - 4)) && (x / 2) % 3 === 0);
  const C = measure(cords(K, { ox, oy, u, inset: .3, round: 1.08, edgeInset: .2 }), u), Wd = u * .82;
  knot(S, C, K.crossings, { layers: [{ w: Wd, ink: ground }, { w: Wd - u * .3, ink: strand[0] }], gap: u * .12, ground, colour: t => strand[t % strand.length] });
  const dr = Math.max(.75, u * .34), o = lc * 2 + yb + dr * 2.2, P = [];
  const pts = [[ox - o, oy - o], [ox + W0 + o, oy - o], [ox + W0 + o, oy + H0 + o], [ox - o, oy + H0 + o]];
  for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4]; for (let s = 0; s < 1; s += .005) P.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]); }
  if (pal !== 'nodots') S.dots(dotsAlong(P, dr * 2 * 1.85, dr), 'd');
  return { S, W: w + 2 * pad, H: h + 2 * pad, pad };
}

// ---- C · Durrow ---------------------------------------------------------------------------------------------------------
// The broad ribbon of the Book of Durrow (TCD MS 57, fol. 125v, 192v): each ribbon a fill of pigment inside a reserved margin
// of bare vellum, a fine pen line at its edge, on a brown-black ground; a ribbon changes colour (red lead, orpiment,
// verdigris) where it passes under another. Three pigments and black; in dark mode the page's dark is the ground already.
const DUR = ['r', 'y', 'g'];
function ribbon(S, C, crossings, u, seed, { ground = 'gr', w = 1.12 } = {}) {
  const W = u * w, pen = Math.max(.5, u * .07), margin = Math.max(.6, u * .13), rnd = stream(seed, 'ribbon'), o = Math.floor(rnd() * 3);
  knot(S, C, crossings, { layers: [{ w: W, ink: 'k' }, { w: W - 2 * pen, ink: 'v' }, { w: W - 2 * pen - 2 * margin, ink: 'r' }], gap: Math.max(.5, u * .1), ground,
    colour: (t, k) => DUR[(o + t + k) % 3] });
}
export function durInitial(ch, H, seed = 1, { theme = 'light', res = 2 } = {}) {
  const L = letterField(ch, H, { res, bold: H * .035 }), S = new Sheet([0, 0, L.W, L.Ht], res);
  const pen = Math.max(.7, H * .007), vb = Math.max(1.6, H * .02), a1 = pen, a2 = a1 + vb, a3 = a2 + pen;
  S.image('gr', band(L, L.Din, a3 - .2, 1e9));
  const u = Math.max(3.4, Math.min(9, H / 17));
  for (const pn of panels(L, u, a3 + u * .12, { seed, maxRows: 2 })) ribbon(S, pn.C, pn.K.crossings, u, seed + pn.s0 | 0);
  S.image('k', band(L, L.Din, 0, a1)); S.image('v', band(L, L.Din, a1, a2)); S.image('k', band(L, L.Din, a2, a3));
  // one row of red dots, close, as Durrow's frames carry them
  const dr = Math.max(.8, H * .011), pitch = dr * 2 * 1.9, hand = noise1(seed * 5 + 1);
  for (const lp of ring(L, dr * 1.7)) S.dots(dotsAlong(lp, pitch, (i) => dr * (.85 + .3 * hand(i * .41))), 'd');
  return { S, W: L.W, H: L.Ht, P: L.P, L };
}
export function durParaph(size, seed = 1, { res = 2 } = {}) {
  const u = size / 4.2, pad = size * .3, S = new Sheet([0, 0, size + 2 * pad, size + 2 * pad], res), ox = pad + (size - 4 * u) / 2;
  const K = plait(2, 2), C = measure(cords(K, { ox, oy: ox, u, inset: .28, round: 1.1, edgeInset: .2 }), u);
  ribbon(S, C, K.crossings, u, seed, { ground: null, w: 1.02 });
  return { S, W: size + 2 * pad, H: size + 2 * pad };
}
export function durFiller(len, ht, seed = 1, { res = 2 } = {}) {
  const pad = ht * .3, u = ht / 2.2, A = Math.max(1, Math.floor((len - ht * .6) / (2 * u))), S = new Sheet([0, 0, len + 2 * pad, ht + 2 * pad], res);
  const K = plait(A, 1), C = measure(cords(K, { ox: pad, oy: pad + (ht - 2 * u) / 2, u, inset: .26, round: 1.1, edgeInset: .2 }), u);
  ribbon(S, C, K.crossings, u, seed, { ground: null, w: 1.0 });
  return { S, W: len + 2 * pad, H: ht + 2 * pad, pad };
}
export function durBand(len, ht, seed = 1, { res = 2, theme = 'light' } = {}) {
  const pad = ht * .35, S = new Sheet([0, 0, len + 2 * pad, ht + 2 * pad], res), pen = Math.max(.7, ht * .03), vb = Math.max(1.2, ht * .07);
  const inner = ht - 2 * (pen * 2 + vb), u = inner / 2, A = Math.max(2, Math.round((len - 2 * (pen * 2 + vb)) / (2 * u))), L0 = A * 2 * u + 2 * (pen * 2 + vb), x0 = pad + (len - L0) / 2, y0 = pad;
  const rect = (o, r) => { const P = new Path2D(); P.roundRect(x0 + o, y0 + o, L0 - 2 * o, ht - 2 * o, r); return P; };
  S.fill(rect(0, pen * 3), 'k'); S.fill(rect(pen, pen * 2.5), 'v'); S.fill(rect(pen + vb, pen * 1.5), 'k'); S.fill(rect(pen * 2 + vb - .3, pen), 'gr');
  const o = pen * 2 + vb, K = plait(A, 1), C = measure(cords(K, { ox: x0 + o, oy: y0 + o, u, inset: .26, round: 1.1, edgeInset: .18 }), u);
  ribbon(S, C, K.crossings, u, seed, { w: 1.08 });
  const dr = Math.max(.8, ht * .04), P = [], q = dr * 1.8, pts = [[x0 - q, y0 - q], [x0 + L0 + q, y0 - q], [x0 + L0 + q, y0 + ht + q], [x0 - q, y0 + ht + q]];
  for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4]; for (let s = 0; s < 1; s += .01) P.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]); }
  S.dots(dotsAlong(P, dr * 2 * 1.9, dr), 'd');
  return { S, W: len + 2 * pad, H: ht + 2 * pad };
}
export function durFrame(w, h, seed = 1, { theme = 'light', res = 2 } = {}) {
  const u = Math.max(3.4, Math.min(5, h * .05)), pen = Math.max(.7, u * .14), vb = Math.max(1.2, u * .3), band = 2 * u;
  const A = Math.max(3, Math.round((w + band) / (2 * u))), B = Math.max(3, Math.round((h + band) / (2 * u))), pad = band / 2 + pen * 2 + vb + 6;
  const W0 = A * 2 * u, H0 = B * 2 * u, S = new Sheet([0, 0, w + 2 * pad, h + 2 * pad], res), ox = pad + (w - W0) / 2, oy = pad + (h - H0) / 2;
  const ringP = (o, i) => { const P = new Path2D(); P.roundRect(ox - o, oy - o, W0 + 2 * o, H0 + 2 * o, Math.max(0, o) + 2); P.roundRect(ox + band + i, oy + band + i, W0 - 2 * band - 2 * i, H0 - 2 * band - 2 * i, 2); return P; };
  S.fill(ringP(pen * 2 + vb, -(pen * 2 + vb)), 'k', { rule: 'evenodd' }); S.fill(ringP(pen + vb, -(pen + vb)), 'v', { rule: 'evenodd' }); S.fill(ringP(pen, -pen), 'k', { rule: 'evenodd' }); S.fill(ringP(.3, -.3), 'gr', { rule: 'evenodd' });
  const K = plait(A, B, (a, b) => a < 1 || b < 1 || a >= A - 1 || b >= B - 1), C = measure(cords(K, { ox, oy, u, inset: .26, round: 1.1, edgeInset: .18 }), u);
  ribbon(S, C, K.crossings, u, seed, { w: 1.08 });
  return { S, W: w + 2 * pad, H: h + 2 * pad, pad };
}

// ---- B · Kells ----------------------------------------------------------------------------------------------------------
// Dense and saturated (TCD MS 58, c. 800): orpiment, red lead and folium purple, the letter's body purple worked with a fine
// orpiment plait, and spirals: the triple spiral in a roundel (Durrow fol. 3v, Lindisfarne f. 139r: each spiral two lines
// winding in together and out again, its outer arm running on into the next). One closed line, so it reads as one drawing.
// A double spiral about q: in from angle a0 at radius r0, `turns` turns, to an eye, and out again interleaved (the same path
// turned half round q). Its radius falls faster near the eye than at the rim (not an Archimedean coil).
function dspiral(q, r0, a0, turns, cw = 1, n = 120) {
  const IN = [], T = turns * Math.PI * 2;
  for (let i = 0; i <= n; i++) { const f = i / n, r = r0 * (1 - .82 * Math.pow(f, .78)), a = a0 + cw * f * T; IN.push([q[0] + Math.cos(a) * r, q[1] + Math.sin(a) * r]); }
  const OUT = IN.map(([x, y]) => [2 * q[0] - x, 2 * q[1] - y]).reverse();
  return { IN, OUT };
}
// a smooth link between two points with the given headings (Hermite), for the arms between spirals
function link(p, tp, q, tq, k = 1, n = 40) { const c = Math.hypot(q[0] - p[0], q[1] - p[1]) * k, o = [];
  for (let i = 1; i < n; i++) { const s = i / n, s2 = s * s, s3 = s2 * s, h1 = 2 * s3 - 3 * s2 + 1, h2 = -2 * s3 + 3 * s2, h3 = s3 - 2 * s2 + s, h4 = s3 - s2;
    o.push([h1 * p[0] + h2 * q[0] + (h3 * tp[0] + h4 * tq[0]) * c, h1 * p[1] + h2 * q[1] + (h3 * tp[1] + h4 * tq[1]) * c]); } return o; }
const head = (P, end) => { const a = end ? P.at(-2) : P[1], b = end ? P.at(-1) : P[0], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return end ? [(b[0] - a[0]) / l, (b[1] - a[1]) / l] : [(a[0] - b[0]) / l, (a[1] - b[1]) / l]; };
// the triple spiral in a roundel of radius R at c: three arms leave the middle a third of a turn apart and each winds into a
// spiral, its curvature rising smoothly from the middle to the eye (so it tightens as it goes in: not an Archimedean coil)
export function triskele(c, R, rot = 0, turns = 1.6) {
  return [0, 1, 2].map(k => { const a = rot + k * Math.PI * 2 / 3, p = [c[0] + Math.cos(a) * R * .06, c[1] + Math.sin(a) * R * .06];
    return tendril(p, a, R * (.55 + turns * .62), .9 / R, 1 / (R * .075), 2.4, Math.max(.25, R / 120)); });
}
// a roundel: ink ring, orpiment ring, red ground, the triple spiral as a band (ink edge, orpiment fill)
function roundel(S, c, R, rot, { ground = 'r', line = 'y', edge = 'k', ring = 'y', w = null } = {}) {
  const lw = w ?? Math.max(.9, R * .06), circle = r => { const P = new Path2D(); P.arc(c[0], c[1], r, 0, Math.PI * 2); return P; };
  S.fill(circle(R), edge); S.fill(circle(R - Math.max(.6, R * .04)), ring); S.fill(circle(R - Math.max(1.2, R * .12)), edge); S.fill(circle(R - Math.max(1.6, R * .15)), ground);
  // (the coils as open as the line allows: about three line widths between turns)
  const turns = Math.max(.8, Math.min(2, R * .3 / (lw * 3.4)));
  for (const L of triskele(c, R * .84, rot, turns)) { S.stroke(L, lw * 1.25, edge, { close: false }); S.stroke(L, Math.max(.4, lw * 1.25 - Math.max(.5, lw * .5)), line, { close: false }); }
  const hub = new Path2D(); hub.arc(c[0], c[1], lw * 1.1, 0, Math.PI * 2); S.fill(hub, line);
}
export function kellsInitial(ch, H, seed = 1, { theme = 'light', res = 2 } = {}) {
  const L = letterField(ch, H, { res, bold: H * .032 }), S = new Sheet([0, 0, L.W, L.Ht], res), dk = theme === 'dark';
  const lc = Math.max(1, H * .011), rb = Math.max(1.6, H * .022), hair = Math.max(.6, H * .006), a1 = lc, a2 = a1 + rb, a3 = a2 + hair;
  S.image('p', band(L, L.Din, a3 - .2, 1e9));
  // the largest roundel the body holds, and one in each counter
  let best = [0, 0, 0]; for (let j = 0; j < L.h; j++) for (let i = 0; i < L.w; i++) { const v = L.Din[j * L.w + i]; if (v > best[2]) best = [i / res, j / res, v]; }
  const rnd = stream(seed, 'kells'), rounds = [];
  if (best[2] - a3 > H * .085) rounds.push([best[0], best[1], best[2] - a3 * .55]);
  const holes = new Float32Array(L.w * L.h); { const feat = new Uint8Array(L.w * L.h); for (let q = 0; q < feat.length; q++) feat[q] = L.hole[q] ? 0 : 1; const D = dist(feat, L.w, L.h); for (let q = 0; q < D.length; q++) holes[q] = D[q] / res; }
  const seen = []; for (let k = 0; k < 3; k++) { let m = [0, 0, 0]; for (let j = 0; j < L.h; j++) for (let i = 0; i < L.w; i++) { const v = holes[j * L.w + i], x = i / res, y = j / res; if (v > m[2] && seen.every(([sx, sy, sr]) => Math.hypot(x - sx, y - sy) > sr + v)) m = [x, y, v]; }
    if (m[2] > H * .09) { seen.push(m); rounds.push([m[0], m[1], m[2] - Math.max(1.5, H * .015)]); } }
  // the body's plait, kept off the body's roundel
  const u = Math.max(2.2, Math.min(5, H / 46)), W = u * .82, keep = rounds.filter(r => L.at(r[0], r[1], L.Din) > 0);
  // the body's roundel is a hole in the field the plait is fitted to (the strokes run round it, or stop at it)
  const Din2 = L.Din.slice(); for (let j = 0; j < L.h; j++) for (let i = 0; i < L.w; i++) for (const [rx, ry, rr] of keep) { const d = Math.hypot(i / res - rx, j / res - ry) - rr - u * .5; if (d < Din2[j * L.w + i]) Din2[j * L.w + i] = Math.max(0, d); }
  for (const pn of panels({ ...L, Din: Din2 }, u, a3 + u * .3, { seed })) {
    knot(S, pn.C, pn.K.crossings, { layers: [{ w: W, ink: 'p' }, { w: W - Math.max(.55, u * .16) * 2, ink: 'y' }], gap: Math.max(.4, u * .12), ground: 'p', colour: t => t % 3 === 1 ? 'r' : 'y' }); }
  for (const [x, y, r] of rounds) roundel(S, [x, y], r, rnd() * 6.28, { ground: L.at(x, y, L.Din) > 0 ? 'r' : 'r' });
  S.image(dk ? 'l' : 'k', band(L, L.Din, 0, a1)); S.image('r', band(L, L.Din, a1, a2)); S.image('k', band(L, L.Din, a2, a3));
  return { S, W: L.W, H: L.Ht, P: L.P, L };
}
export function kellsParaph(size, seed = 1, { res = 2 } = {}) {
  const pad = size * .25, R = size * .62, S = new Sheet([0, 0, 2 * R + 2 * pad, 2 * R + 2 * pad], res);
  roundel(S, [pad + R, pad + R], R, stream(seed, 'par')() * 6.28, { w: Math.max(.9, R * .1) });
  return { S, W: 2 * R + 2 * pad, H: 2 * R + 2 * pad };
}
// the running spiral (Allen 1903, p. 363 ff.): spirals in turn above and below the line, each one's arm running into the next
function running(x0, y0, len, ht, n) {
  const step = len / n, R = Math.min(ht * .42, step * .55), line = [];
  for (let k = 0; k < n; k++) { const up = k % 2 === 0, c = [x0 + step * (k + .5), y0 + ht / 2 + (up ? -1 : 1) * ht * .06];
    const sp = dspiral(c, R, up ? Math.PI : 0, 1.6, up ? 1 : -1, 80);
    if (line.length) line.push(...link(line.at(-1), head(line, true), sp.IN[0], head(sp.IN, false), 1.1, 24));
    line.push(...sp.IN, ...link(sp.IN.at(-1), head(sp.IN, true), sp.OUT[0], head(sp.OUT, false), 1.6, 12), ...sp.OUT); }
  return line;
}
export function kellsFiller(len, ht, seed = 1, { res = 2 } = {}) {
  const pad = ht * .3, S = new Sheet([0, 0, len + 2 * pad, ht + 2 * pad], res), n = Math.max(2, Math.round(len / (ht * 1.25)));
  const L = running(pad, pad, len - ht * .2, ht, n), w = Math.max(1, ht * .11);
  S.stroke(L, w, 'k', { close: false }); S.stroke(L, Math.max(.45, w - Math.max(.5, w * .38)), 'r', { close: false });
  return { S, W: len + 2 * pad, H: ht + 2 * pad, pad };
}
export function kellsBand(len, ht, seed = 1, { res = 2, theme = 'light' } = {}) {
  const pad = ht * .3, S = new Sheet([0, 0, len + 2 * pad, ht + 2 * pad], res), lc = Math.max(.9, ht * .04), rb = Math.max(1.2, ht * .07);
  const rect = (o, r) => { const P = new Path2D(); P.roundRect(pad + o, pad + o, len - 2 * o, ht - 2 * o, r); return P; };
  S.fill(rect(0, lc * 2), theme === 'dark' ? 'l' : 'k'); S.fill(rect(lc, lc * 1.6), 'r'); S.fill(rect(lc + rb, lc), 'k'); S.fill(rect(lc * 2 + rb - .3, lc * .6), 'p');
  const R = (ht - 2 * (lc * 2 + rb)) / 2, cy = pad + ht / 2, inner = len - 2 * (lc * 2 + rb), n = Math.max(1, Math.round(inner / (R * 2.2 * 2.4))), rnd = stream(seed, 'kband');
  // roundels at intervals, a running spiral between them
  const xs = []; for (let k = 0; k < n; k++) xs.push(pad + lc * 2 + rb + inner * (k + .5) / n);
  for (let k = 0; k + 1 < n; k++) { const a = xs[k] + R * 1.05, b = xs[k + 1] - R * 1.05, L = running(a, cy - R * .8, b - a, R * 1.6, Math.max(2, Math.round((b - a) / (R * 1.5)))), w = Math.max(.9, R * .16);
    S.stroke(L, w, 'p', { close: false }); S.stroke(L, Math.max(.45, w * .6), 'y', { close: false }); }
  for (const x of xs) roundel(S, [x, cy], R * 1.02, rnd() * 6.28);
  return { S, W: len + 2 * pad, H: ht + 2 * pad };
}
export function kellsFrame(w, h, seed = 1, { theme = 'light', res = 2 } = {}) {
  const f = lindFrame(w, h, seed, { theme, res, rows: 2, ground: 'p', strand: ['y', 'r'], pal: 'nodots' });
  // a roundel at each corner, each turning its own way
  const rnd = stream(seed, 'kframe'), R = Math.max(7, Math.min(13, h * .13));
  for (const [x, y] of [[f.pad, f.pad], [f.pad + w, f.pad], [f.pad, f.pad + h], [f.pad + w, f.pad + h]]) roundel(f.S, [x, y], R, rnd() * 6.28);
  return f;
}

export const DIRS = {
  lind: { name: 'A · Lindisfarne', pal: 'lind', order: ['k', 'l', 'y', 'g', 'b', 'r', 'd'], tex: ink => ({ y: 1, g: 1, b: 1, r: .6 })[ink] ?? 0,
    note: 'The clear, measured book (BL Cotton MS Nero D IV, c. 715). The panel letter: Uncial Antiqua’s E outlined in ink, a band of orpiment and a hairline, its body a black panel worked with a fine plait fitted to the letter’s own cells (over and under right at every crossing by construction); its counter carries the lozenge diaper of red dots, two rows of dots run round it at the measured pitch. Paraph: a closed two-cord knot in a ring of dots. Filler: a twist run to the margin. Break: a ruled panel of plait. Frame: a ruled band with knotted corner panels.',
    initial: lindInitial, paraph: lindParaph, filler: lindFiller, brk: (w, h, s, o) => lindBand(w, h, s, o), frame: lindFrame },
  durrow: { name: 'C · Durrow', pal: 'durrow', order: ['gr', 'k', 'v', 'r', 'y', 'g', 'd'], tex: ink => ({ r: 1, y: 1, g: 1, v: .5 })[ink] ?? 0,
    note: 'The broad ribbon of the Book of Durrow (TCD MS 57, c. 680), and the dark mode’s historical model: three pigments and black. Each ribbon a fill inside a reserved margin of bare vellum, a fine pen line at its edge; it changes colour (red lead, orpiment, verdigris) where it passes under another, as on fol. 125v. The letter outlined in vellum between pen lines, its body black, a broad plait along each stroke; one close row of red dots. In dark mode the page is the ground already, and the vellum margin becomes the pale line that carries the drawing.',
    initial: durInitial, paraph: durParaph, filler: durFiller, brk: durBand, frame: durFrame },
  kells: { name: 'B · Kells', pal: 'kells', order: ['p', 'k', 'l', 'r', 'y', 'g', 'b', 'd'], tex: ink => ({ r: 1, y: 1, p: .8, g: 1, b: 1 })[ink] ?? 0,
    note: 'Dense and saturated, after the Book of Kells (TCD MS 58, c. 800): orpiment, red lead and folium purple. The letter’s body purple, worked with a fine orpiment plait along its strokes; its broadest place and each counter hold a roundel with the triple spiral (each spiral two lines winding in together and out again, its outer arm running on into the next, one closed line), ringed in orpiment on red. Paraph: a roundel. Filler: the running spiral, in turn above and below the line. Break: roundels joined by running spirals on purple. Frame: the plait on purple, a roundel at each corner turning its own way.',
    initial: kellsInitial, paraph: kellsParaph, filler: kellsFiller, brk: kellsBand, frame: kellsFrame },
};
