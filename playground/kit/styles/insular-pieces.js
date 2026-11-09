// Insular, direction studies (research/20-insular.md). Each direction makes the same pieces: the drop initial (a panel letter:
// the face's stroke region outlined by a quill, each stroke carrying a plait laid along it, the ends wound into spirals,
// the counters worked, red dots set round it by a brush),
// the paraph, the line-filler, the break and the frame. Every piece is a Sheet (kit/styles/insular-knot.js) of per-ink
// coverage, poured ink by ink through the ink engine. Nothing here is drawn from a raster of the master: the letter's shape is
// Uncial Antiqua's (OFL), everything else is generated.
import { plait, cords, knot, measure, dotsAlong, Sheet, pathOf, stream, NIB, handOn, strand } from './insular-knot.js';
import { dist } from '../inkletter.js';
import { noise1, tendril } from '../marks.js';

// A bar across a stroke, ruled by hand: its two long edges each bowing a little and leaning off square (the hand's aim,
// ~4° as measured on f. 139r's keys), its width breathing along it — the same bar every time for a seed
function handBar({ x, y, nx, ny, tx, ty, half }, w, seed = 1) {
  const k = Math.round(x * 7.3 + y * 3.1) + seed * 101, r = i => ((Math.sin((k + i) * 12.9898) * 43758.5453) % 1 + 1) % 1, lean = (r(1) - .5) * .14, bow = (r(2) - .5) * w * .5, n = 6, o = [];
  for (const side of [1, -1]) for (let i = 0; i <= n; i++) { const f = side > 0 ? i / n : 1 - i / n, a = (f * 2 - 1) * half, b = side * (w / 2) * (1 + .18 * Math.sin(f * 3.1 + r(3) * 6)) + bow * Math.sin(f * Math.PI) + lean * a;
    o.push([x + nx * a + tx * b, y + ny * a + ty * b]); }
  return o;
}
// (from kit/brushwork.js, which the site does not ship)
// The outlines of a mask as closed polylines in page px (marching squares at the 0.5 level, segments linked into
// loops, lightly smoothed), so the pen can draw a shape's real edge rather than a uniform stroked font outline.
function contours(M, cw, ch, { dpr = 2, x0 = 0, y0 = 0, min = 12 } = {}) {
  const v = (x, y) => (x < 0 || y < 0 || x >= cw || y >= ch) ? 0 : M[y * cw + x], segs = new Map(), key = p => `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
  const lerp = (x0_, y0_, a, x1_, y1_, b) => { const t = (.5 - a) / ((b - a) || 1e-6); return [x0_ + (x1_ - x0_) * t, y0_ + (y1_ - y0_) * t]; };
  const add = (a, b) => { (segs.get(key(a)) ?? segs.set(key(a), []).get(key(a))).push(b); };
  for (let y = -1; y < ch; y++) for (let x = -1; x < cw; x++) {
    const a = v(x, y), b = v(x + 1, y), c = v(x + 1, y + 1), d = v(x, y + 1);
    const idx = (a > .5) | (b > .5) << 1 | (c > .5) << 2 | (d > .5) << 3; if (!idx || idx === 15) continue;
    const T = lerp(x, y, a, x + 1, y, b), R = lerp(x + 1, y, b, x + 1, y + 1, c), B = lerp(x, y + 1, d, x + 1, y + 1, c), L = lerp(x, y, a, x, y + 1, d);
    const E = { 1: [[L, T]], 2: [[T, R]], 3: [[L, R]], 4: [[R, B]], 5: [[L, T], [R, B]], 6: [[T, B]], 7: [[L, B]], 8: [[B, L]], 9: [[B, T]], 10: [[T, R], [B, L]], 11: [[B, R]], 12: [[R, L]], 13: [[R, T]], 14: [[T, L]] }[idx];
    for (const [p, q] of E) add(p, q);
  }
  const loops = [];
  for (const [k0] of segs) {
    let k = k0; const loop = [];
    while (segs.has(k) && segs.get(k).length) { const nx = segs.get(k).pop(); loop.push(k.split(',').map(Number)); k = key(nx); if (k === k0) break; }
    if (loop.length >= min) loops.push(loop);
  }
  return loops.map(l => { let p = l; for (let it = 0; it < 2; it++) p = p.map((q, i) => { const a = p[(i - 1 + p.length) % p.length], b = p[(i + 1) % p.length]; return [(a[0] + 2 * q[0] + b[0]) / 4, (a[1] + 2 * q[1] + b[1]) / 4]; });
    return p.filter((_, i) => i % 2 === 0).map(([x, y]) => [x0 + (x + .5) / dpr, y0 + (y + .5) / dpr]); });
}

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
// (kept by letter, size and grid: a page drawn again — another seed, the other theme, a richer level — sets it once;
// whoever changes one (swell) works on its own copy)
const LETTERS = new Map();
export function letterField(ch, H, o = {}) { const k = [ch, H, o.res ?? 2, o.pad ?? .22, o.bold ?? 0, document.fonts?.check?.(`12px ${FAMILY}`)].join('|'); let L = LETTERS.get(k);
  if (!L) { if (LETTERS.size > 24) LETTERS.clear(); LETTERS.set(k, L = letterField0(ch, H, o)); }
  return L; }
function letterField0(ch, H, { res = 2, pad = .22, bold = 0 } = {}) {
  const c = document.createElement('canvas').getContext('2d'); c.font = `${H * 1.45}px ${FAMILY}`;
  const m = c.measureText(ch), asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent, l = m.actualBoundingBoxLeft, r = m.actualBoundingBoxRight;
  const s = H / (asc + desc), P = Math.ceil(H * pad), W = Math.ceil((l + r) * s) + 2 * P, Ht = Math.ceil(H) + 2 * P;
  const w = W * res, h = Ht * res, cv = new OffscreenCanvas(w, h), g = cv.getContext('2d', { willReadFrequently: true });
  g.font = `${H * 1.45 * s * res}px ${FAMILY}`; g.fillStyle = '#000'; g.fillText(ch, (P + l * s) * res, (P + asc * s) * res);
  const d = g.getImageData(0, 0, w, h).data, M = new Float32Array(w * h), inn = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let q = 0; q < M.length; q++) { M[q] = d[q * 4 + 3] / 255; inn[q] = M[q] >= .5; out[q] = !inn[q]; }
  let Din = bold > 0 ? null : dist(out, w, h), Dout = dist(inn, w, h);   // (grown, the inside depth is measured again after)
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
function swell(L0, u, k = 1.4) { const L = { ...L0, M: L0.M.slice() };
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
    for (let k = 0; k < spec.length; k++) { const pn = spec[k].pen, b = a + spec[k].w * (pn === true ? G[q] : pn ? 1 + pn * (G[q] - 1) : 1); out[k][q] = (a <= 0 ? L.M[q] : clamp((v - a) / (2 * e) + .5)) * clamp((b - v) / (2 * e) + .5); a = b; }
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
function dotRows(L, S, dr, rows, seed, ink = 'd', { off = 1.66, pitch = dr * 2 * 1.8 } = {}) {
  for (let k = 0; k < rows; k++) for (const lp of ring(L, dr * off + k * pitch * .9)) S.dots(dotsAlong(lp, pitch, dr * (1 - .05 * k), true, { load: 11 + 2 * k + (seed % 3), bend: .15 }), ink);
}

// ---- the compartment letter (f. 139r) ----------------------------------------------------------------------------------
// A stroke's centreline as a frame: position, normal and the stroke's half-width at arc length s.
export function along(line, hw) {
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
function compartments(L, S, Bd, { u0, clear, seed, vary, look }) {
  // (a page given its own seed (vary) draws from it where the schemes' alternation starts — which panel takes the blue knot,
  // which compartment the roundel — and the panels' lengths, look.cells(rows, r): another layout of the same grammar.
  // Left to its text's seed, the measured rhythm, r null)
  const grounds = new Map(), jobs = [], bars = [], rnd = stream(seed, 'comp'), r0 = vary ? stream(seed, 'rhythm') : null; let nl = r0 ? Math.floor(r0() * 7) : 0, ns = r0 ? Math.floor(r0() * 5) : 0;
  const put = (ink, poly) => (grounds.get(ink) ?? grounds.set(ink, []).get(ink)).push(poly);
  // (a closed stroke's compartments start where the page's own seed says, round the loop: its bars fall elsewhere; only
  // where the field fills any shape (look.turn) — Durrow's columns want their panels on the straighter runs)
  const turn = (st, f) => { const n = st.pts.length - 1, j = Math.floor(f * n), r = a => [...a.slice(j, n), ...a.slice(0, j), a[j]]; return { ...st, pts: r(st.pts), hw: r(st.hw) }; };
  for (const st0 of strokes(L, Math.max(1, u0 * .5))) { const st = r0 && look.turn && st0.closed ? turn(st0, r0()) : st0;
    const A = along(st.pts, st.hw), len = A.len; if (len < u0 * 3) continue;
    const T = terminals(st, A, u0, clear);
    const hwc = st.hw.map(h => h - clear).filter(h => h > 0).sort((a, b) => a - b), hm = hwc[Math.floor(hwc.length * .6)] ?? 0; if (hm < u0 * .8) continue;
    const rows = hm / 2 >= u0 ? 2 : 1, u = hm / rows, bw = 2 * hm, barW = Math.max(1.1, bw * .12);
    // the run: from a fork, the other stroke's edge; from a roundel, its rim; from a bare end, the tip (a solid block there)
    let a = 0, b = len;
    for (const end of [0, 1]) { const t = T.find(x => x.end === end), ed = end ? b : a, hwE = end ? st.hw.at(-1) : st.hw[0];
      let cut; if (st.closed) cut = 0; else if (st.forks[end]) cut = hwE * .98; else if (t) cut = t.s + t.R + clear * .3;   // (t.s: from its own end)
      else { const blk = Math.min(len * .3, hwE * 1.6 + u); if (!look.terminal) put(look.solid, slab(A, end ? len - blk - 1 : 0, end ? len : blk + 1, 3)); cut = blk; }
      if (end) b = len - cut; else a = cut; }
    // a free end beyond its bar (the swell, the curl past the skeleton's end): its own ground, a field round the roundel
    if (look.terminal && !st.closed) for (const end of [0, 1]) { if (st.forks[end]) continue;
      const sb = end ? b : a, [px, py, nx, ny] = A.at(sb), o = end ? [ny, -nx] : [-ny, nx], E = A.at(end ? len : 0), t = T.find(x => x.end === end);
      let hx = 0; for (let k = 0; k <= 10; k++) hx = Math.max(hx, A.at(end ? sb + (len - sb) * k / 10 : sb * k / 10)[4]);
      const Rend = Math.hypot(E[0] - px, E[1] - py) + hx * 1.4;
      const inT = (x, y) => (x - px) * o[0] + (y - py) * o[1] > barW * .5 && Math.hypot(x - E[0], y - E[1]) < Rend;
      jobs.push(() => look.terminal(S, inT, [E[0] - Rend, E[1] - Rend, E[0] + Rend, E[1] + Rend], t ? [t.c[0], t.c[1], t.R] : null)); }
    for (const t of T) jobs.push(() => look.roundel(S, t));
    const run = b - a; if (run < u * 3) continue;
    // long, short, long ... in whole cells (cell 2u): long ≈ 2 bands (4 cells at 2 rows), short ≈ 1 band
    const [cl, cs] = look.cells ? look.cells(rows, r0 && r0()) : [rows === 2 ? 4 : 3, 2], cell = 2 * u;
    let k = Math.max(1, Math.round((run + cs * cell) / ((cl + cs) * cell + 2 * barW))); if (st.closed) k = Math.max(2, Math.round(run / ((cl + cs) * cell + 2 * barW)));
    const parts = []; for (let i = 0; i < k; i++) { parts.push('L'); if (i < k - 1 || st.closed) parts.push('S'); }
    // (a page's own seed may turn an open stroke's rhythm about: short compartments at its ends, the long panels between)
    if (r0 && !st.closed && r0() < .45) { parts.unshift('S'); parts.push('S'); if (k > 1) { parts.splice(parts.lastIndexOf('L'), 2); } }
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
      if (look.fill) jobs.push(() => look.fill(S, A, s0, s1, p, sch));
      else if (p === 'S' && look.block) jobs.push(() => look.block(S, A, s0, s1, sch));
      else if (p === 'S' && (rc === 1 || nA < 2) && look.jewel) { const m = A.at((s0 + s1) / 2); jobs.push(() => look.jewel(S, m, Math.min(L0 / 2, wm) * 1.1, sch)); }
      else if (wl / (rc * uc) >= .32 && uc >= u0 * .55 && nA * cc <= L0 + cc * .2) {
        const sA = s0 + (L0 - nA * cc) / 2, per = 2 + Math.floor(rnd() * 2);
        const wall = p === 'S' ? (rc >= 2 && nA >= 3 ? (x, y) => y === 2 && (x === 1 || x === 2 * nA - 1) : null)
          : rc >= 2 ? (x, y) => (y === 2 || y === 4) && (x & 1) === 0 && x > 0 && x < 2 * nA && (x / 2 + y / 2) % per === 0 : null;
        if (rc === 1 && p === 'L' && look.scroll) { const n = Math.max(2, Math.round(L0 / (Math.min(wm, wl * 1.3) * 1.5))); jobs.push(() => look.scroll(S, scrollLine(A, s0 + wm * .3, s1 - wm * .3, Math.min(wm, wl * 1.3) * .62, n), Math.min(wm, wl * 1.3), sch)); }
        else jobs.push(() => { const pn = bandAlong(st.pts, sA, nA, rc, uc, { wall, squeeze: x => Math.max(.32, Math.min(1.5, fit(x))) }); look.knot(S, pn.C, pn.K, uc, sch); });
      } else if (look.jewel && wl > u0 * .5 && !look.empty) { const m = A.at((s0 + s1) / 2); jobs.push(() => look.jewel(S, m, Math.min(L0 / 2, wm) * 1.1, sch)); }
      // (a compartment left without a fill is a plain block of colour where the direction has one)
      put(jobs.length === g0 && look.empty ? look.empty(nl + ns) : sch.ground, slab(A, s0 - barW / 2, s1 + barW / 2));
      s = s1 + barW; if (s < b - 1 || st.closed) bars.push([A, s1 + barW / 2]);
    }
    if (!st.closed) bars.push([A, b]);
    for (const bb of bars.filter(x => x[0] === A)) bb.push(barW, Math.min(Math.max(...st.hw), (hm + clear) * 1.25) + 2);   // (not the fork's depth: the bar stays in its own stroke)
  }
  for (const [ink, polys] of grounds) S.image(ink, masked(L, Bd, polys));
  for (const j of jobs) j();
  look.bars(S, bars.map(([A, s, w, half]) => { const [x, y, nx, ny] = A.at(s), tx = ny, ty = -nx; return { x, y, nx, ny, tx, ty, w, half }; }), Bd, L);
}

// ---- knots fitted to a panel ----
// Breaks (walls on edge midpoints, grid units; nB the rows ×2): long horizontal loops every four cells on alternate row
// lines, vertical turns between them (the field reads as interlace, not a mesh); or vertical breaks staggered every third.
export const BREAKS = [
  (x, y, nA, nB) => y > 0 && y < nB && x > 0 && x < 2 * nA && (((x & 1) && !(y & 1) && (y / 2) % 2 === 1 && ((x - 1) / 2) % 4 === 1) || (!(x & 1) && (y & 1) && (x / 2) % 4 === 3 && ((y - 1) / 2) % 2 === 0)),
  (x, y, nA, nB) => !(x & 1) && (y & 1) && x > 0 && x < 2 * nA && (x / 2 + (y - 1) / 2) % 3 === 0,
];
// ------------------------------------------------------------------------------------------
// A point of a stroke's band: arc length x along the stroke, offset y across it.
const onBand = (A, x, y) => { const [px, py, nx, ny] = A.at(x); return [px + nx * y, py + ny * y]; };
// A plait fitted to the piece of a stroke's panel between s0 and s1: cells of side 2u in the band's own frame, each kept
// where it lies wholly inside the panel (depth >= clear) and outside every hole ([x, y, half]: a square in band coordinates,
// where another knot sits); the cords turn back at the edge of what is kept, so the field closes round the holes and along
// the panel's edge whatever its shape (Allen's plait fitted to any set of cells). wall(x, y, nA, nB): breaks.
function fitted(L, A, s0, s1, u, clear, { holes = [], wall = null } = {}) {
  let hmax = 0; for (let k = 0; k <= 16; k++) hmax = Math.max(hmax, A.at(s0 + (s1 - s0) * k / 16)[4]);
  const nA = Math.floor((s1 - s0) / (2 * u)), nB = Math.ceil(hmax / u), x0 = s0 + ((s1 - s0) - nA * 2 * u) / 2, y0 = -nB * u;
  if (nA < 1) return null;
  const inside = (x, y) => { const [px, py] = onBand(A, x, y); return L.at(px, py, L.Din) >= clear; }, e = u * .75;   // (a cord turns .2 u inside its cell: its edge ~.7 u out)
  const inc = (a, b) => { const cx = x0 + (2 * a + 1) * u, cy = y0 + (2 * b + 1) * u;
    if (holes.some(([hx, hy, hh]) => Math.abs(cx - hx) < hh + u * .35 && Math.abs(cy - hy) < hh + u * .35)) return false;
    return inside(cx, cy) && inside(cx - e, cy) && inside(cx + e, cy) && inside(cx, cy - e) && inside(cx, cy + e); };
  const K = plait(nA, 2 * nB, sizable(inc, nA, 2 * nB), wall ? (x, y) => wall(x, y, nA, 2 * nB) : undefined);
  if (!K.threads.length) return null;
  const C = measure(cords(K, { ox: x0, oy: y0, u, inset: .3, round: 1.08, edgeInset: .2, ds: Math.min(.5, u * .3) }), u);
  for (const c of C) c.pts = c.pts.map(([x, y]) => onBand(A, x, y));
  return { K, C };
}
// A knot fitted to an area of the page (cells on the page's own diagonals): inside(x, y) says what belongs to it; the cells
// kept lie wholly inside it and deeper than clear in the letter.
function areaKnot(L, inside, box, u, clear, { wall = null, avoid = null } = {}) {
  const [x0, y0, x1, y1] = box, nA = Math.floor((x1 - x0) / (2 * u)), nB = Math.floor((y1 - y0) / (2 * u)), e = u * .75;
  const ok = (x, y) => inside(x, y) && L.at(x, y, L.Din) >= clear && !(avoid && avoid(x, y));
  const K = plait(nA, nB, sizable((a, b) => { const cx = x0 + (2 * a + 1) * u, cy = y0 + (2 * b + 1) * u; return ok(cx, cy) && ok(cx - e, cy) && ok(cx + e, cy) && ok(cx, cy - e) && ok(cx, cy + e); }, nA, nB), wall ? (x, y) => wall(x, y, nA, nB) : undefined);
  if (!K.threads.length) return null;
  return { K, C: measure(cords(K, { ox: x0, oy: y0, u, inset: .3, round: 1.08, edgeInset: .2, ds: Math.min(.5, u * .3) }), u) };
}
// the cells kept, less every group (4-connected) of fewer than min cells
function sizable(inc, nA, nB, min = 4) {
  const lab = new Int32Array(nA * nB).fill(-1), size = []; 
  for (let b = 0; b < nB; b++) for (let a = 0; a < nA; a++) { if (lab[b * nA + a] >= 0 || !inc(a, b)) continue; const id = size.length, st = [[a, b]]; lab[b * nA + a] = id; let n = 0;
    while (st.length) { const [x, y] = st.pop(); n++; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= nA || Y >= nB || lab[Y * nA + X] >= 0 || !inc(X, Y)) continue; lab[Y * nA + X] = id; st.push([X, Y]); } }
    size.push(n); }
  return (a, b) => { const l = lab[b * nA + a]; return l >= 0 && size[l] >= min; };
}
// A closed knot whose cords run along and across the band, not on its diagonals (f. 139r's blue knots set in the red plait):
// a diamond of cells (radius r) turned through 45°, so it stands as a square of half-side (2r + 1) u / √2, at sc on the band.
export function squareKnot(A, sc, yc, r, u, wall = null, { edgeInset = .22, edgeRound = null, centre = true } = {}) {
  const n = 2 * r + 1, K = plait(n, n, (a, b) => Math.abs(a - r) + Math.abs(b - r) <= r, wall ?? (r >= 2 && centre ? (x, y) => ((x === 2 * r || x === 2 * r + 2) && (y & 1) && Math.abs((y - 1) / 2 - r) >= 1 && Math.abs((y - 1) / 2 - r) < r) || ((y === 2 * r || y === 2 * r + 2) && (x & 1) && Math.abs((x - 1) / 2 - r) >= 1 && Math.abs((x - 1) / 2 - r) < r) : undefined));
  const C = measure(cords(K, { ox: -n * u, oy: -n * u, u, inset: .3, round: 1.1, edgeInset, edgeRound, ds: Math.min(.5, u * .3) }), u);
  for (const c of C) c.pts = c.pts.map(([x, y]) => onBand(A, sc + (x - y) * Math.SQRT1_2, yc + (x + y) * Math.SQRT1_2));
  return { K, C, half: n * u * Math.SQRT1_2 };
}

// ---- A · Lindisfarne ------------------------------------------------------------------------------------------------------
const LIND = {
  ground: 'k', rule: 'k', edge: 'y', key: true, keyGround: 'y', keyLine: 'k',
  knot: (S, C, K, u, i) => knot(S, C, K.crossings, { layers: [{ w: u * .82, ink: 'k' }, { w: u * .82 - Math.max(.5, u * .3), ink: 'y' }], gap: Math.max(.35, u * .12), ground: 'k',
    colour: t => t === 1 ? (i % 4 === 0 ? 'b' : 'g') : 'y' }),
};
// Measured on f. 139r against the letter's outer height Ho (research/20 §Stage 4): the pen line .016 Ho, the orpiment band
// .015, the inner hairline .003; the red plait's cords ~.0075 Ho (outlined; pitch ~.011, the gaps ~.4 W), compared at matched scale;
// the blue knots' cords .0097 at a pitch of .014, set in the plait every ~1.8 panel widths; dots .0056 Ho across at a pitch
// of .010, two rows, the first a dot and a half off the ink. The finest marks are held to what a cell can show (1/res).
// rich: the page's budget (0..1): fine (.75) sets knots closer and a roundel in every short compartment that holds one;
// lavish (1) rings the letter in a field of dots, as f. 139r's letters stand in theirs
export function lindInitial(ch, H, seed = 1, { theme = 'light', res = 2, rich = .5, vary = 0 } = {}) {
  const L = letterField(ch, H, { res, bold: H * .055 }), S = new Sheet([0, 0, L.W, L.Ht], res), dk = theme === 'dark', Ho = H * 1.11, px = 1 / res;
  const hair = Math.max(.5 * px, Ho * .003), { frame, Bd } = rings(L, S, [{ w: Ho * .0155, ink: dk ? 'l' : 'k', pen: .3 }, { w: Ho * .0145, ink: 'y' }, { w: hair, ink: 'k', pen: .3 }], 'y');
  const u0 = Math.max(2.4, H / 40), clear = frame + .4;
  // (the knot's unit held to the display, not only to the master's absolute size: at a page's drop (~100 px) the master's
  // .0078 Ho is a px and the plait reads as texture; a cord at least ~1/48 of the letter keeps it a plait you can follow)
  const uf = Math.max(1.25 * px, Ho * .0078, H * .021), ub = Math.max(2 * px, Ho * .0098, H * .034), rnd = stream(seed, 'lind'), kd = vary ? .8 + .45 * stream(seed, 'density')() : 1;   // (kd: how close the knots are set, the seed's)
  // the fine field: cords of red lead or orpiment outlined in ink on black, a break every few cells along a row (staggered)
  // (its pen line .1 W, heavier than the knots' .06: at this size it is all that tells over from under)
  const field = (A, s0, s1, sch, holes) => { const wf = uf, ln = Math.max(.4 * px, wf * .1);
    const f = fitted(L, A, s0, s1, uf, clear + uf * .15, { holes, wall: BREAKS[Math.floor(rnd() * 2)] });
    if (f) knot(S, handOn(f.C, uf, wf, seed), f.K.crossings, { layers: [{ w: wf, ink: 'k' }, { w: wf - 2 * ln, ink: sch.cord }], gap: 0, ground: 'k' }); };
  // a coarser knot: its cords pigment in a pale rim and the ink line
  // (a knot drawn freely, not on its grid: eased out from its centre so the outer loops are fuller than the inner, and a
  // little more on one side than the other — each loop its own)
  const loosen = C => { let cx = 0, cy = 0, m = 0; for (const c of C) for (const p of c.pts) { cx += p[0]; cy += p[1]; m++; } cx /= m; cy /= m; let R = 0; for (const c of C) for (const p of c.pts) R = Math.max(R, Math.hypot(p[0] - cx, p[1] - cy));
    const ph = rnd() * 6.28; for (const c of C) c.pts = c.pts.map(([x, y]) => { const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) / (R || 1), a = Math.atan2(dy, dx), k = 1 + .07 * r * r - .035 + .045 * r * Math.sin(2 * a + ph); return [cx + dx * k, cy + dy * k]; }); return C; };
  const big = (C, K, u, ink) => { const W = u * 1.0; knot(S, handOn(loosen(C), u, W, seed + 3), K.crossings, { layers: strand(W, ink, { min: .35 * px }), gap: 0, ground: 'k' }); };
  compartments(L, S, Bd, { u0, clear, seed, vary, look: {
    // (one letter, one rhythm: long panels of red plait on black running with the stroke, a blue or a green knot set in each;
    // between them a short compartment of plain red lead holding an orpiment cross, or a blue roundel with its triple spiral)
    cells: (rows, r) => r == null ? [rows >= 2 ? 7 : 5, 2] : [rows >= 2 ? 6 + Math.floor(r * 3) : 4 + Math.floor(r * 2.5), 1.6 + r * .8],
    turn: true, long: [{ ground: 'k', cord: 'r', knot: 'b' }, { ground: 'k', cord: 'r', knot: 'g' }], short: [{ ground: 'r', cord: 'y', spiral: true }, { ground: 'r', cord: 'y' }], solid: 'r',
    fill: (S, A, s0, s1, p, sch) => {
      const hp = s => A.at(s)[4] - clear, mid = hp((s0 + s1) / 2);
      if (p === 'S') { const m = A.at((s0 + s1) / 2), r = Math.min((s1 - s0) / 2, mid);
        if ((sch.spiral || (rich >= .75 && (!vary || rnd() < .6))) && r > ub * 2.2) LOOK.roundel(S, { c: [m[0], m[1]], R: r * .92, a0: rnd() * 6.28 }, hair); else LOOK.jewel(S, m, r * 1.1, sch);
        return; }
      // knots set in the field ~1.8 panel widths apart, each as large as the panel there allows (its cords at one scale)
      const n = Math.max(1, Math.round((s1 - s0) / ((rich >= .75 ? 2.6 : 3.6) * kd * Math.max(mid, ub * 3)))), holes = [];
      const place = (sc, hs = 1, fit = false) => { const h = Math.min(hp(sc - ub * 3), hp(sc), hp(sc + ub * 3)) * .94 * hs, r = Math.max(2, Math.min(3, Math.floor((h * Math.SQRT2 / ub - 1) / 2))), u = Math.min(ub * 1.25, h * Math.SQRT2 / (2 * r + 1));
        if (u < ub * .55 || (s1 - s0) < 2 * h + 4 * uf || (fit && (sc - h < s0 + uf || sc + h > s1 - uf))) return false; const q = squareKnot(A, sc, 0, r, u, null, { centre: false, edgeInset: .05, edgeRound: 1.7 }); big(q.C, q.K, u, sch.knot); holes.push([sc, 0, q.half]); return true; };
      for (let k = 0; k < n; k++) place(s0 + (s1 - s0) * (k + .5) / n);
      // (every long panel holds a knot, as on f. 139r: where none stood at its even places, the first place along the panel,
      // in the seed's order, where one fits — a little smaller if it must)
      if (!holes.length) { const fl = stream(seed + Math.round(s0), 'floor'), at = [.5, .38, .62, .27, .73, .18, .82].map(f => [f, fl()]).sort((x, y) => x[1] - y[1]).map(x => x[0]);
        outer: for (const hs of [1, .82, .68]) for (const f of at) if (place(s0 + (s1 - s0) * f, hs, true)) break outer; }
      field(A, s0, s1, sch, holes); },
    bars: (S, B, Bd, L) => { const q = (b, w) => handBar(b, w, seed);
      S.image('k', masked(L, Bd, B.map(b => q(b, b.w + 2 * hair)))); S.image('y', masked(L, Bd, B.map(b => q(b, b.w)))); },
    roundel: (S, t) => LOOK.roundel(S, t, hair),
    terminal: (S, inT, box, disc) => { const M = new Float32Array(L.w * L.h);
      for (let j = 0; j < L.h; j++) for (let i = 0; i < L.w; i++) { const q = j * L.w + i; if (Bd[q] > 0 && inT((i + .5) / res, (j + .5) / res)) M[q] = Bd[q]; }
      S.image('k', M);
      const f = areaKnot(L, inT, box, uf, clear + uf * .15, { wall: BREAKS[0], avoid: disc && ((x, y) => Math.hypot(x - disc[0], y - disc[1]) < disc[2] + hair + uf * .5) });
      if (f) knot(S, handOn(f.C, uf, uf, seed + 5), f.K.crossings, { layers: [{ w: uf, ink: 'k' }, { w: uf - 2 * Math.max(.4 * px, uf * .1), ink: 'r' }], gap: 0, ground: 'k' }); },
  } });
  const dr = Math.max(.7 * px, Ho * .0028); diaper(L, S, dr, dr * 2 * 1.85);
  dotRows(L, S, dr, rich >= 1 ? 5 : 2, seed, 'd', { off: 3, pitch: dr * 2 * 1.85 });
  // the hand's drift: the arm's slow waver (.008 Ho over .16 Ho), the fingers' finer one, each ink a hair off register
  S.drift({ amp: Ho * .008, lam: Ho * .16, amp2: Ho * .0015, lam2: Ho * .035, mis: Ho * .0025, seed });
  return { S, W: L.W, H: L.Ht, P: L.P, L };
}
// the Lindisfarne jewel and roundel (also drawn by the small pieces' looks)
const LOOK = {
  // a cross of four lentoids (f. 139r sets them in black between its spirals)
  jewel: (S, m, r, sch) => { const [x, y, nx, ny] = m, P = new Path2D(), a = r * .5, b = r * .17;
    for (const [dx, dy] of [[nx, ny], [-nx, -ny], [ny, -nx], [-ny, nx]]) { const cx = x + dx * (a + r * .06), cy = y + dy * (a + r * .06); P.moveTo(cx - dx * a, cy - dy * a);
      for (const sg of [1, -1]) for (let k = sg > 0 ? 1 : 19; sg > 0 ? k <= 20 : k >= 0; k += sg) { const f = k / 10 - 1, h = sg * b * (1 - f * f); P.lineTo(cx + dx * a * f - dy * h, cy + dy * a * f + dx * h); } P.closePath(); }
    S.fill(P, sch.cord); const e = new Path2D(); e.arc(x, y, r * .1, 0, Math.PI * 2); S.fill(e, sch.cord); },
  roundel: (S, t, hair) => { const { c, R } = t, disc = r => { const P = new Path2D(); P.arc(c[0], c[1], r, 0, Math.PI * 2); return P; };
    S.fill(disc(R + hair), 'k'); S.fill(disc(R), 'y'); S.fill(disc(R - Math.max(1, R * .16)), 'k'); S.fill(disc(R - Math.max(1, R * .16) - hair), 'b');
    const ri = R - Math.max(1, R * .16) - hair, W = Math.max(.9, ri * .19); triskele(S, c, ri * .8, t.a0, () => [{ w: W, ink: 'k' }, { w: W - Math.max(.45, W * .34), ink: 'y' }], { len: 1.75, eye: .07 });
    const hub = new Path2D(); hub.arc(c[0], c[1], W * .5, 0, Math.PI * 2); S.fill(hub, 'k'); },
};
// the paraph: a small knot of two cords broken once at its heart (not the plain 2×2), three dots beside it as a positura
// (vary, the page's own seed: the knot's cord red lead or orpiment, its middle closed or open)
export function lindParaph(size, seed = 1, { res = 2, theme = 'light', vary = 0 } = {}) {
  const u = size / 4.4, pad = size * .3, Wd = size * 1.75, S = new Sheet([0, 0, Wd + 2 * pad, size + 2 * pad], res), ox = pad, oy = pad + (size - 4 * u) / 2;
  const K = plait(2, 2, () => true, vary && (vary >> 2) & 1 ? (x, y) => (x === 1 || x === 3) && y === 2 : (x, y) => x === 2 && y === 2), C = measure(cords(K, { ox, oy, u, inset: .3, round: 1.12, edgeInset: .18 }), u);
  knot(S, C, K.crossings, { layers: [{ w: u * .95, ink: theme === 'dark' ? 'l' : 'k' }, { w: u * .95 - u * .34, ink: vary & 1 ? 'y' : 'r' }], gap: u * .14, ground: null });
  const dr = Math.max(.8, size * .07), x = ox + 4 * u + size * .32, cy = pad + size / 2;
  S.dots([[x, cy - dr * 1.9, dr * 1.05, -.5, 1.1], [x, cy + dr * 1.9, dr * .95, -.5, 1.1], [x + dr * 3.1, cy, dr, -.5, 1.1]], 'd');
  hand(S, size, seed);
  return { S, W: Wd + 2 * pad, H: size + 2 * pad };
}
// ---- C · Durrow ---------------------------------------------------------------------------------------------------------
// The broad ribbon (TCD MS 57, fol. 125v): pigment inside a reserved margin of vellum, a fine pen line at its edge, on a
// brown-black ground; a ribbon changes colour (red lead, orpiment, verdigris) where it passes under another.
const DUR = ['r', 'y', 'g'];
function ribbon(S, C, crossings, u, seed, { ground = 'gr', w = 1.1 } = {}) {
  const W = u * w, pen = Math.max(.45, u * .08), margin = Math.max(.5, u * .13), o = Math.floor(stream(seed, 'ribbon')() * 3);
  knot(S, C, crossings, { layers: [{ w: W, ink: 'k' }, { w: W - 2 * pen, ink: 'v' }, { w: W - 2 * pen - 2 * margin, ink: 'r' }], gap: Math.max(.4, u * .1), ground, colour: (t, k) => DUR[(o + t + k) % 3], breath: 1.4 });
}
// The Durrow coil (fol. 86r): a disc of vellum wound with two pen lines (two arms half a turn apart, an Archimedean spiral at
// a pitch the pen can hold), a pigment eye at its heart, a band of pigment round it and the pen line outside.
function coil(S, c, R, a0, cw, { eye = 'y', band = 'r', pen = 'k', lw = Math.max(.42, R * .05), pitch = Math.max(1.25, lw * 2.6), bw = Math.max(.8, R * .13) } = {}) {
  const Ri = R - bw - lw, re = Math.max(lw * 2.2, Ri * (lw < R * .03 ? .36 : .24));   // (a fine-lined coil has a broad eye)
  const disc = (r, ink) => { const P = new Path2D(); P.arc(c[0], c[1], r, 0, Math.PI * 2); S.fill(P, ink); };
  disc(R + lw, pen); disc(R, band); disc(Ri + lw * .5, pen); disc(Ri, 'v'); disc(re, eye);
  const turns = Math.max(1.25, Math.min(12, (Ri - re) / (2 * pitch)));
  for (const off of [0, Math.PI]) { const o = [], n = Math.ceil(turns * 90);
    for (let i = 0; i <= n; i++) { const f = i / n, r = re + (Ri - re) * f, a = a0 + off + cw * f * turns * Math.PI * 2; o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
    cordLine(S, o, [{ w: lw, ink: pen }], { taper: true }); }
  // the eye's comma: a pen stroke curling into its heart
  const o = []; for (let i = 0; i <= 40; i++) { const f = i / 40, r = re * (1 - .8 * f), a = a0 + cw * f * Math.PI * 1.6; o.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
  cordLine(S, o, [{ w: lw * 1.2, ink: pen }]);
}
// Measured on fol. 86r against the stroke's width sw (its I is drawn long, so the letter's height does not carry over):
// the outline .018 sw, the orpiment band .09; the stem's columns of a two-strand twist, each ~.3 sw, the strands pale,
// ~.10 sw, a hairline round them and a file of red dots down each (~.02 sw at ~.06); orpiment between the columns; the coils'
// pen lines .014 sw at a pitch of .045 (six to eight turns); one row of red dashes .023 × .04 sw at a pitch of .10.
export function durInitial(ch, H, seed = 1, { theme = 'light', res = 2, rich = .5, vary = 0 } = {}) {
  const L = swell(letterField(ch, H, { res, bold: H * .05, pad: .3 }), Math.max(2.4, H / 40)), S = new Sheet([0, 0, L.W, L.Ht], res);
  const px = 1 / res, sw = H * .165, hair = Math.max(.45 * px, sw * .011);
  const { frame, Bd } = rings(L, S, [{ w: Math.max(.6 * px, sw * .018), ink: 'k', pen: .3 }, { w: sw * .09, ink: 'y' }, { w: hair, ink: 'k', pen: .3 }], 'r');
  const u0 = Math.max(2.4, H / 40), clear = frame + .3; let nc = vary ? seed % 2 : 0;
  const uc0 = Math.max(1.5 * px, sw * .15), ax = .8, sep = Math.max(1.2 * px, sw * .07), dr = Math.max(.35 * px, sw * .009);
  // one column: a two-strand twist (a plait one cell high) along the band at offset yc, pale strands on black, red dots down them
  const column = (A, s0, s1, yc, uc) => { const W = uc * .74;
    const nA = Math.floor((s1 - s0) / (2 * uc * ax)), x0 = s0 + ((s1 - s0) - nA * 2 * uc * ax) / 2; if (nA < 2) return false;   // (the twist drawn long: a cell .8 as long as it is wide)
    const ok = (x, y) => { const [qx, qy] = onBand(A, x, y); return L.at(qx, qy, L.Din) >= clear + uc * .1; };
    const inc = sizable(a => { const cx = x0 + (2 * a + 1) * uc * ax; return ok(cx, yc - uc * .8) && ok(cx, yc + uc * .8) && ok(cx - uc * .8, yc) && ok(cx + uc * .8, yc); }, nA, 1, 3);
    const K = plait(nA, 1, inc); if (!K.threads.length) return false;
    const C = measure(cords(K, { ox: x0, oy: yc - uc, u: uc, inset: .3, round: 1.08, edgeInset: .25, ds: Math.min(.5, uc * .3) }), uc);
    for (const c of C) c.pts = c.pts.map(([x, y]) => onBand(A, x0 + (x - x0) * ax, y)); handOn(C, uc, W, seed + 7);
    knot(S, C, K.crossings, { layers: [{ w: W, ink: 'k' }, { w: W - 2 * hair, ink: 'v' }], gap: 0, ground: 'k', breath: 1 });
    // the dots: a file down each strand's middle, not where it runs under
    const D = []; for (const c of C) { const un = c.ev.map((e, i) => e.cross && !e.over ? c.s[i] : null).filter(v => v != null), n = c.pts.length, step = sw * .06;
      for (let s = step / 2; s < c.L; s += step) { if (un.some(v => Math.abs(((s - v + c.L * 1.5) % c.L) - c.L / 2) < W * .9)) continue; const p = c.pts[Math.floor(s / c.L * n) % n]; D.push([p[0], p[1], dr, 0, 1]); } }
    S.dots(D, 'd'); return true; };
  compartments(L, S, Bd, { u0, clear, seed, vary, look: {
    cells: (rows, r) => r == null ? [rows === 1 ? 5 : 6, 1.5] : [rows === 1 ? 4 + Math.floor(r * 3) : 5 + Math.floor(r * 3), 1.2 + r * .7],
    long: [{ ground: 'k', cord: 'v' }], short: [{ ground: 'y' }, { ground: 'r' }], solid: 'y',
    empty: i => (i + (vary ? seed : 0)) % 2 ? 'y' : 'r',
    // the long panels: as many columns as the panel holds, orpiment between them (the stem of fol. 86r)
    fill: (S, A, s0, s1, p) => { if (p === 'S') return;
      // (the columns as many as fit at about the measured width, then widened or narrowed a little to fill the panel)
      const hp = Math.min(...[.25, .5, .75].map(f => A.at(s0 + (s1 - s0) * f)[4])) - clear, n = Math.max(1, Math.round((2 * hp + sep) / (2 * uc0 + sep)));
      const uc = Math.max(uc0 * .75, Math.min(uc0 * 1.3, ((2 * hp - uc0 * .25 + sep) / n - sep) / 2)), lane = 2 * uc;
      const tot = n * lane + (n - 1) * sep, ys = Array.from({ length: n }, (_, k) => -tot / 2 + lane / 2 + k * (lane + sep));
      ys.forEach(y => column(A, s0, s1, y, uc));
      for (let k = 0; k + 1 < n; k++) { const yb = ys[k] + lane / 2 + sep / 2, strip = (w, ink) => { const l = [], r = [];
          for (let i = 0; i <= 40; i++) { const x = s0 + (s1 - s0) * i / 40; l.push(onBand(A, x, yb - w / 2)); r.push(onBand(A, x, yb + w / 2)); }
          S.image(ink, masked(L, Bd, [l.concat(r.reverse())])); };
        strip(sep, 'k'); strip(sep - 2 * hair, 'y'); } },
    jewel: (S, m, r) => { const [x, y, nx, ny] = m, P = new Path2D(), a = r * .5, b = r * .17;
      for (const [dx, dy] of [[nx, ny], [-nx, -ny], [ny, -nx], [-ny, nx]]) { const cx = x + dx * (a + r * .06), cy = y + dy * (a + r * .06); P.moveTo(cx - dx * a, cy - dy * a);
        for (const sg of [1, -1]) for (let k = sg > 0 ? 1 : 19; sg > 0 ? k <= 20 : k >= 0; k += sg) { const f = k / 10 - 1, h = sg * b * (1 - f * f); P.lineTo(cx + dx * a * f - dy * h, cy + dy * a * f + dx * h); } P.closePath(); }
      S.fill(P, 'v'); },
    bars: (S, B, Bd, L) => { const q = (b, w) => handBar(b, w, seed);
      S.image('k', masked(L, Bd, B.map(b => q(b, b.w * .6 + 2 * hair)))); S.image('y', masked(L, Bd, B.map(b => q(b, b.w * .6)))); },
    roundel: (S, t) => coil(S, t.c, t.R + frame * .7, t.a0, t.cw, { eye: nc % 2 ? 'r' : 'y', band: nc++ % 2 ? 'y' : 'r', lw: Math.max(.4 * px, sw * .014), pitch: Math.max(1.2 * px, sw * .045), bw: sw * .07 }),
  } });
  // one row of red dashes, each drawn along the row
  const dd = Math.max(.5 * px, sw * .018); for (const [k, off] of (rich >= 1 ? [sw * .06, sw * .14, sw * .22] : [sw * .06]).entries()) for (const lp of ring(L, off)) S.dots(dotsAlong(lp, sw * .1, dd, true, { load: 11, bend: .15 }).map(d => { d[4] = 1.4; return d; }), 'd');
  S.drift({ amp: H * .009, lam: H * .18, amp2: H * .0015, lam2: H * .04, mis: H * .0025, seed });
  return { S, W: L.W, H: L.Ht, P: L.P, L };
}
// ---- the small pieces: few, larger, well-made panels on fine rules --------------------------------------------------------
// A broad pen's line (cut at NIB): heavy where it runs across the nib, a hair along it, lighter as it is set down and lifted.
function nibLine(S, pts, w, ink, { min = .3 } = {}) {
  // (one outline, left side out and right side back: a single path fills far faster than a quad per point)
  const n = pts.length, l = [], r = [];
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 2)], b = pts[Math.min(n - 1, i + 2)], h = Math.atan2(b[1] - a[1], b[0] - a[0]), end = Math.min(1, .5 + .5 * Math.min(i, n - 1 - i) / 12);
    const hw = w * end * (min + (1 - min) * Math.abs(Math.sin(h - NIB))) / 2, nx = -Math.sin(h), ny = Math.cos(h), [x, y] = pts[i]; l.push([x + nx * hw, y + ny * hw]); r.push([x - nx * hw, y - ny * hw]); }
  S.fill(pathOf(l.concat(r.reverse())), ink);
}
const rect = (x, y, w, h) => { const P = new Path2D(); P.rect(x, y, w, h); return P; };
// a ruled line (horizontal or vertical) of parallel rules, outermost first, centred on the line; ink null: a gap of paper
function rule(S, a, b, rules) {
  const tot = rules.reduce((t, r) => t + r.w, 0), hz = Math.abs(a[1] - b[1]) < 1e-6; let o = -tot / 2;
  for (const r of rules) { S.fill(hz ? rect(Math.min(a[0], b[0]), a[1] + o, Math.abs(b[0] - a[0]), r.w) : rect(a[0] + o, Math.min(a[1], b[1]), r.w, Math.abs(b[1] - a[1])), r.ink); o += r.w; }
}
// a closed knot of A × B cells (side 2u) at (x, y), set in its panel
function knotPanel(S, x, y, A, B, u, wall, look, i = 0) {
  look.panel(S, x - u * .45, y - u * .45, A * 2 * u + u * .9, B * 2 * u + u * .9);
  const K = plait(A, B, () => true, wall ?? undefined), C = measure(cords(K, { ox: x, oy: y, u, inset: .3, round: 1.1, edgeInset: .2 }), u);
  look.knot(S, C, K, u, i);
}
// the knot with a break at each end of its middle row (it closes as a lozenge-ended knot, not a plain plait)
const endBreaks = A => (x, y) => y === 2 && (x === 1 || x === 2 * A - 1);
// a long band: closed at its ends, and broken every few cells so it reads as a run of knots, not a plain plait
const bandBreaks = (A, p = 4) => (x, y) => y === 2 && (x === 1 || x === 2 * A - 1 || ((x & 1) && ((x - 1) / 2) % p === 2 && x < 2 * A - 3));
// three dots, the positura ·:· turned on its side
const triad = (S, x, cy, dr, ink = 'd') => S.dots([[x, cy - dr * 1.9, dr * 1.05, -.5, 1.1], [x, cy + dr * 1.9, dr * .95, -.5, 1.1], [x + dr * 3.1, cy, dr, -.5, 1.1]], ink);

// The break: one panel at the centre, the rules running out from it to a positura at each end.
// rank 1: the panel alone, a positura close at each side; rank 2: the panel, the rules running out to the positurae;
// rank 3: a band of knotwork the length of the break between its rules, closed at each end
function ruledBreak(len, ht, res, look, { seed = 1, rank = 2 } = {}) {
  const th = Math.max(10, ht * .78), pad = th * .6, S = new Sheet([0, 0, len + 2 * pad, th + 2 * pad], res), cy = pad + th / 2, cx = pad + len / 2, dr = Math.max(.8, th * .07);
  if (rank >= 3 && look.band) { const bl = look.band(S, cx, cy, th, len - dr * 12, seed); for (const sg of [-1, 1]) triad(S, sg < 0 ? cx - bl / 2 - dr * 5 : cx + bl / 2 + dr * 1.6, cy, dr); hand(S, th * 2, seed); return { S, W: len + 2 * pad, H: th + 2 * pad }; }
  const pw = look.centre(S, cx, cy, th, seed);
  for (const sg of [-1, 1]) { const x0 = cx + sg * (pw / 2 + th * .18), x1 = rank <= 1 ? x0 + sg * dr * 3 : sg < 0 ? pad + dr * 4 : pad + len - dr * 4; if (rank > 1) rule(S, [x0, cy], [x1, cy], look.rules);
    triad(S, sg < 0 ? x1 - dr * 4.2 : x1 + dr * 1.1, cy, dr); }
  hand(S, th * 2, seed);
  return { S, W: len + 2 * pad, H: th + 2 * pad };
}
// The frame: fine rules round the text, a knot or a coil at each corner, a panel at the middle of each long side, a row of dots
// outside.
// level: 0 the rules and their corners alone (a plain page); 1 the usual (a row of dots outside, a panel on each long side);
// 2 fuller (a knot at the middle of the short sides too); 3 the fullest (a second row of dots)
// part: one side's strip of it ('t', 'b', 'l', 'r'; the corners with the top and bottom), built on its own small sheet —
// the same drawing, the hand's drift in the page's own coordinates, so the four meet exactly; a large frame's empty middle
// is never rastered (strip(w, h) gives each part's box)
export const frameStrip = (w, h) => { const c = Math.max(10, Math.min(15, h * .13)), pad = c * .9, T = 2 * pad + c * .9, W = w + 2 * pad, H = h + 2 * pad;
  // (the sides' strips reach m into the top's and the bottom's: the hand's drift empties a sheet's last rows, so each is built
  // with that overlap and trimmed back to its own rows when laid — no gap and no doubled ink at the joins)
  const m = 6; return { pad, m, t: [0, 0, W, T + m], b: [0, H - T - m, W, H], l: [0, T - m, T, H - T + m], r: [W - T, T - m, W, H - T + m], trim: { t: [0, m], b: [m, 0], l: [m, m], r: [m, m] } }; };
function ruledFrame(w, h, res, look, { seed = 1, level = 1, part = null } = {}) {
  const c = Math.max(10, Math.min(15, h * .13)), pad = c * .9, S = new Sheet(part ? frameStrip(w, h)[part] : [0, 0, w + 2 * pad, h + 2 * pad], res), x0 = pad, y0 = pad, x1 = pad + w, y1 = pad + h;
  for (const [a, b] of [[[x0, y0], [x1, y0]], [[x0, y1], [x1, y1]], [[x0, y0], [x0, y1]], [[x1, y0], [x1, y1]]]) rule(S, a, b, look.rules);
  const dr = Math.max(.75, c * .065), o = c * .5 + dr * 2.6, P = [], pts = [[x0 - o, y0 - o], [x1 + o, y0 - o], [x1 + o, y1 + o], [x0 - o, y1 + o]];
  for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4]; for (let t = 0; t < 1; t += .004) P.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  if (level >= 1) S.dots(dotsAlong(P, dr * 2 * 1.9, dr, true, { load: 13 }), 'd');
  if (level >= 3) { const o2 = o + dr * 3.4, P2 = [], q2 = [[x0 - o2, y0 - o2], [x1 + o2, y0 - o2], [x1 + o2, y1 + o2], [x0 - o2, y1 + o2]]; for (let i = 0; i < 4; i++) { const a = q2[i], b = q2[(i + 1) % 4]; for (let t = 0; t < 1; t += .004) P2.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } S.dots(dotsAlong(P2, dr * 2 * 1.9, dr * .9, true, { load: 13 }), 'd'); }
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) look.corner(S, x, y, c, seed);
  if (level >= 1 && w > c * 9) for (const y of [y0, y1]) look.centre(S, pad + w / 2, y, c, seed);
  if (level >= 2 && h > c * 6) for (const x of [x0, x1]) look.corner(S, x, pad + h / 2, c, seed + 3);
  hand(S, Math.min(w, h), seed);
  return { S, W: w + 2 * pad, H: h + 2 * pad, pad };
}

// ---- A · Lindisfarne: knots in black panels ruled in ink and orpiment, red dots ----------------------------------------------
// (v: the page's own seed, when it was given one: which of the two knots is blue, how long the centre panel, the corners'
// knot closed or open — the same grammar laid another way; 0, the measured page)
const lindLook = (dark, v = 0) => { const rk = dark ? 'l' : 'k', sw = v & 1, A0 = v ? 3 + ((v >> 1) % 3) : 4, cw = v && (v >> 3) & 1 ? (x, y) => x === 2 && y === 2 : null;
  return { rules: [{ ink: rk, w: .7 }, { ink: 'y', w: 1.1 }, { ink: rk, w: .7 }],
    panel: (S, x, y, w, h) => { S.fill(rect(x - 2.5, y - 2.5, w + 5, h + 5), rk); S.fill(rect(x - 1.8, y - 1.8, w + 3.6, h + 3.6), 'y'); S.fill(rect(x - .6, y - .6, w + 1.2, h + 1.2), 'k'); },
    knot: (S, C, K, u, i) => LIND.knot(S, C, K, u, i ^ sw),
    corner: (S, x, y, c) => { const u = (c - 2) / 4; knotPanel(S, x - 2 * u, y - 2 * u, 2, 2, u, cw, lindLook(dark, v), 0); },
    centre: (S, x, y, th) => { const u = (th - 2) / 4, A = A0; knotPanel(S, x - A * u, y - 2 * u, A, 2, u, endBreaks(A), lindLook(dark, v), 1); return A * 2 * u + 5; },
    band: (S, x, y, th, len) => { const u = (th - 2) / 4, A = Math.max(4, Math.floor(len / (2 * u))); knotPanel(S, x - A * u, y - 2 * u, A, 2, u, bandBreaks(A, v ? 3 + (v >> 1) % 3 : 4), lindLook(dark, v), 1); return A * 2 * u + 5; } }; };
export const lindBand = (len, ht, seed = 1, { theme = 'light', res = 2, rank = 2, vary = 0 } = {}) => ruledBreak(len, ht, res, lindLook(theme === 'dark', vary), { seed, rank });
export const lindFrame = (w, h, seed = 1, { theme = 'light', res = 2, level = 1, part = null, vary = 0 } = {}) => ruledFrame(w, h, res, lindLook(theme === 'dark', vary), { seed, level, part });
// the filler: a row of red dots at the pitch of f. 27r's field, closed by the positura
export function lindFiller(len, ht, seed = 1, { res = 2 } = {}) {
  const pad = ht * .4, S = new Sheet([0, 0, len + 2 * pad, ht + 2 * pad], res), cy = pad + ht / 2, dr = Math.max(.8, ht * .085), x1 = pad + len - dr * 5;
  S.dots(dotsAlong([[pad, cy], [x1 - dr * 2.5, cy]], dr * 2 * 1.9, dr, false, { load: 12 }), 'd'); triad(S, x1, cy, dr * 1.1);
  hand(S, ht * 2, seed);
  return { S, W: len + 2 * pad, H: ht + 2 * pad, pad };
}

// ---- C · Durrow: ribbon knots and coils on fine pen rules, red dots ----------------------------------------------------------
const durLook = (dark, v = 0) => { const rk = dark ? 'v' : 'k', A0 = v ? 2 + (v >> 1) % 3 : 3;   // (v: the page's own seed — the centre knot's length)
  return { rules: [{ ink: rk, w: .65 }, { ink: null, w: 1.5 }, { ink: rk, w: .65 }],
    panel: (S, x, y, w, h) => { S.fill(rect(x - 1.2, y - 1.2, w + 2.4, h + 2.4), rk); S.fill(rect(x - .5, y - .5, w + 1, h + 1), 'gr'); },
    knot: (S, C, K, u, i) => ribbon(S, C, K.crossings, u, i * 13 + 1, { w: 1.06 }),
    corner: (S, x, y, c, seed) => coil(S, [x, y], c * .5, seed + x * .1, 1, { eye: 'y', band: 'r', pen: rk }),
    centre: (S, x, y, th, seed) => { const u = th / 4.6, A = A0; knotPanel(S, x - A * u, y - 2 * u, A, 2, u, endBreaks(A), durLook(dark, v), seed); return A * 2 * u + 2.4; },
    band: (S, x, y, th, len, seed) => { const u = th / 4.6, A = Math.max(3, Math.floor(len / (2 * u))); knotPanel(S, x - A * u, y - 2 * u, A, 2, u, bandBreaks(A, v ? 3 + (v >> 1) % 3 : 4), durLook(dark, v), seed); return A * 2 * u + 2.4; } }; };
export const durBand = (len, ht, seed = 1, { theme = 'light', res = 2, rank = 2, vary = 0 } = {}) => ruledBreak(len, ht, res, durLook(theme === 'dark', vary), { seed, rank });
export const durFrame = (w, h, seed = 1, { theme = 'light', res = 2, level = 1, part = null, vary = 0 } = {}) => ruledFrame(w, h, res, durLook(theme === 'dark', vary), { seed, level, part });
// the filler (fol. 86r, beside the text): a red pen line wound into a spiral, then rolling forward in loops to the margin
export function durFiller(len, ht, seed = 1, { res = 2 } = {}) {
  const pad = ht * .45, S = new Sheet([0, 0, len + 2 * pad, ht + 2 * pad], res), cy = pad + ht / 2, a = ht * .32, R = ht * .5, w = Math.max(1.1, ht * .15);
  const loops = Math.max(1, Math.round((len - 2.4 * R) / (ht * .9))), run = scrollLine(null, pad + 2.1 * R, pad + len - w, a, loops, { d: 2.1 }).map(([x, y]) => [x, cy + y]);
  // the spiral: wound from its eye out to the scroll's first point, leaving it along the scroll's heading
  const p0 = run[0], h0 = Math.atan2(run[3][1] - p0[1], run[3][0] - p0[0]), a0 = h0 + Math.PI / 2, c = [p0[0] - Math.cos(a0) * R, p0[1] - Math.sin(a0) * R];
  const sp = spiralLine(c, R, a0, 1.6, 1).reverse();
  nibLine(S, sp.concat(run.slice(1)), w, 'd');
  hand(S, ht * 2, seed);
  return { S, W: len + 2 * pad, H: ht + 2 * pad, pad };
}
// the paraph: two coils side by side, as fol. 86r's stem ends, ringed in red dots
// (vary, the page's own seed: which coil is red-eyed, and which way they wind)
export function durParaph(size, seed = 1, { res = 2, theme = 'light', vary = 0 } = {}) {
  const R = size * .44, pad = size * .3, W = 4 * R + 2 * pad, H = 2 * R + 2 * pad, S = new Sheet([0, 0, W, H], res), rk = theme === 'dark' ? 'v' : 'k', [a, b] = vary & 1 ? ['r', 'y'] : ['y', 'r'], cw = vary & 2 ? -1 : 1;
  coil(S, [pad + R, pad + R], R, 0, -cw, { eye: a, band: b, pen: rk }); coil(S, [pad + 3 * R, pad + R], R, Math.PI, cw, { eye: b, band: a, pen: rk });
  const dr = Math.max(.6, size * .045), o = R + dr * 2.4, P = [];
  for (let t = 0; t <= 1; t += .005) { const a = Math.PI / 2 + t * Math.PI; P.push([pad + R + Math.cos(a) * o, pad + R + Math.sin(a) * o]); }
  for (let t = 0; t <= 1; t += .005) { const a = -Math.PI / 2 + t * Math.PI; P.push([pad + 3 * R + Math.cos(a) * o, pad + R + Math.sin(a) * o]); }
  S.dots(dotsAlong(P, dr * 2 * 1.9, dr, true, { load: 11 }), 'd');
  hand(S, size, seed);
  return { S, W, H };
}

// the hand's drift on a small piece (as on the initials, research/21-paint.md): the arm's slow wander, the fingers' finer
// one, the inks a hair off one another — the piece drawn, not constructed
function hand(S, X, seed) { S.drift({ amp: X * .008, lam: X * .5, amp2: X * .0016, lam2: X * .12, mis: X * .0025, seed: seed + 17 }); }

// ---- the directions -------------------------------------------------------------------------------------------------------
// pigment coats (Sheet.print): orpiment dense with a coarse crystal tooth, verdigris thinner and granulating, red lead dense
const COATS = { y: { base: .78, slow: .05, tooth: .06, grainPx: 1.1 }, g: { base: .7, slow: .1, tooth: .03, grainPx: .7, wet: .14 }, b: { base: .72, slow: .08, tooth: .03, grainPx: .8, wet: .12 },
  r: { base: .8, slow: .04, tooth: .03, grainPx: .6 }, v: { base: .74, slow: .05, tooth: .04, grainPx: .7 }, d: { base: .84, slow: .03, tooth: .02, grainPx: .5, wet: .12 }, gr: { base: .88, slow: .04, tooth: .03, grainPx: .9 } };
export const DIRS = {
  lind: { name: 'A · Lindisfarne', pal: 'lind', alias: { d: 'r' }, order: ['k', 'l', 'v', 'p', 'y', 'g', 'b', 'r', 'd'], tex: ink => COATS[ink] ?? 0,
    note: 'The clear, measured book (BL Cotton MS Nero D IV, c. 715), after f. 139r. The panel letter: Uncial Antiqua’s capital, grown, outlined in ink, an orpiment band and a hairline (weights measured on f. 139r); its body divided by orpiment bars into compartments packed at the master’s scale: a fine red plait fitted to each panel’s own shape with square knots of blue or verdigris set in it, a closed knot in the short ones, the free ends a roundel with a triple spiral in a field of plait. Every cord carries the measured hand; the whole drawing wavers with the hand’s drift. The diaper of dots in closed counters (f. 27r), two rows of red dots round it. Small pieces: a knot beside the positura, a row of dots, one knot panel on ruled lines, a frame of fine rules with corner knots. Dark: the ink line becomes pale vellum.',
    initial: lindInitial, paraph: lindParaph, filler: lindFiller, brk: lindBand, frame: lindFrame },
  durrow: { name: 'C · Durrow', pal: 'durrow', alias: { d: 'r' }, order: ['gr', 'k', 'v', 'r', 'y', 'g', 'd'], tex: ink => COATS[ink] ?? 0,
    note: 'The Book of Durrow (TCD MS 57, c. 680), after fol. 86r, and the dark mode’s own model: three pigments and black. The letter outlined by a fine pen and orpiment over red lead (weights measured on fol. 86r against the stem), divided into long panels of columns of two-strand twist, pale strands with a file of red dots down each, orpiment between the columns (the stem), and plain blocks of orpiment and red (the stem’s heads); its free ends swell into coils of fine pen lines round a broad pigment eye; one row of red dashes. Small pieces: two coils in a ring of dots, the red pen filler (a spiral, then loops rolling to the margin), a ribbon knot on fine double rules, coils at the frame’s corners.',
    initial: durInitial, paraph: durParaph, filler: durFiller, brk: durBand, frame: durFrame },
};
