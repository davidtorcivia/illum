// Choir book: the red-and-blue penwork (filigree, Italian "filigrana") of the Italian Gothic choir books, antiphonaries
// and graduals of the 13th–15th centuries (research/17-choirbook.md). The deep pass over 03's penwork initial (the
// 'gothic' entries of kit/initials.js, kit/wayfinding.js and kit/frames.js), which the user loved and keeps: the letter
// painted (EB Garamond made to read drawn, laid in azurite or minium with kit/marks.js paintField), every hairline round
// it written by the ink engine's quill (kit/writer.js), the opposite colour (a blue letter takes red penwork, a red one
// blue). It is a registry style, as 03 was, so it is drawn by the same path that was approved (kit/illum.js score()).
// Importing this module registers it: STYLES.choirbook (kit/wayfinding.js); rubricate(root, { style: 'choirbook' }).
//
// What the deep pass took from the sources, at full size (research/17):
// - the columns and their capitals (Met 466773, North Italian, early 15th c.): the hairlines stand in bundles, one each
//   side of the letter and one in each counter, and each bundle beside the letter is capped by a dome with an eye inside
//   it, its ends curling out into small loops with a bead (03 had a low arch with the eye standing on it, the margin side
//   only). Here the margin panel and, from the usual budget up, a panel on the text side, each crowned.
// - pendants (466773): small closed loops hung on the outer hairline of a bundle, each with a point in it, among the
//   open scallops.
// - the pearled contour (Met 467763, gradual, c. 1310–15; 469041): where no panel stands against the letter, a string
//   of fine points follows its outline a gap away (lavish).
// - the filigree (467763's K and X, 466790's L): a channel of the other colour down the stem, pointed at both ends, a
//   hair of parchment reserved round it; in the curved members a white vine with curls and points (the parchment left
//   bare, so the page's own colour in light and dark). Drop initials, usual budget up; ?filigree=0|1 overrides.
// - a small cross of points in the margin (467763), on the finer budgets.
// - the stave (every leaf): four red rules, the square notes in black, the finalis, as the chapter break.
// The letter is the choir book's own Lombard: an alphabet traced from Met 467763 and leaves of its time, completed from its
// own strokes, one small webfont per letter (research/17 §4c; see "the letter" below); EB Garamond if a face is missing.
//
// Marks are the registry's: strokes { pts, col, w, start, end, load, dry, broad, swell, nib, ink? } and points
// { dot, p, r, col, ink? }; col 'a' | 'b' (red and blue in turn), 'k' the notes' black.
import { tendril, resample, stream, noise1, noise2, PIGMENTS } from '../marks.js';
import { edt, drawn } from '../penwork.js';
import { STYLES, wander, arc, hook, hair, bead, paraph as wParaph, filler as wFiller, breakMark as wBreak, FILLERS as wFillers } from '../wayfinding.js';
import { quoteFrame, figureFrame, codeFrame, asideFrame, navFrame } from '../frames.js';

const arclen = p => p.reduce((a, q, i) => i ? a + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0);
const tangentAt = (p, i) => { const a = p[Math.max(0, i - 2)], b = p[Math.min(p.length - 1, i + 2)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
const drift = (p, amp, seed, scale = 26) => { const n = noise1(seed), q = resample(p, 1);
  return q.map((pt, i) => { const t = tangentAt(q, i), o = (n(i / scale) - .5) * 2 * amp; return [pt[0] - t[1] * o, pt[1] + t[0] * o]; }); };
// a ring as a pen goes round it: a little oval, closing just past where it began
const ring = (c, R, r, ov = .08, a0 = 0, turn = 1.04) => { const tilt = r() * Math.PI, out = [];
  for (let k = 0; k <= 40 * turn; k++) { const a = a0 + k / 40 * 2 * Math.PI, rr = R * (1 + ov * Math.cos(2 * (a - tilt)) + (r() - .5) * .03); out.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]); }
  return out; };
const isDark = () => { try { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } };

// ---- budgets -------------------------------------------------------------------------------------------------------------------
// What the flourisher was paid (03's five, deepened). crown: 0 the bare panel, 1 03's low arch, 2 the dome with its eye
// and curled ends (466773); text: a crowned panel on the text side too; pend: the share of pendants among the scallops
// on a bundle's outer edge; column: a wide counter's hairlines as one column with an eye either side; pearls, filigree, cross: see above.
export const BUDGETS = [
  { name: 'plain', counterEyes: 1, counterRules: false, bay: false, crown: 0, text: false, top: false, base: false, panelScallops: false, pend: 0, staffLines: 1, runs: null, staffEyes: 0, hooks: 0, contourEyes: 0, spray: false, accent: 0, pearls: false, cross: false },
  { name: 'modest', counterEyes: 9, counterRules: true, bay: false, crown: 1, text: false, top: false, base: false, panelScallops: true, pend: 0, staffLines: 1, runs: .6, staffEyes: 0, hooks: 0, contourEyes: 0, spray: false, accent: 0, pearls: false, cross: false },
  { name: 'usual', column: true, filigree: true, counterEyes: 9, counterRules: true, bay: true, crown: 2, text: true, top: true, base: true, panelScallops: true, pend: .34, staffLines: 2, runs: .42, staffEyes: .2, hooks: 0, contourEyes: 0, spray: false, accent: 0, pearls: false, cross: false },
  { name: 'fine', column: true, filigree: true, counterEyes: 9, counterRules: true, bay: true, crown: 2, text: true, top: true, base: true, panelScallops: true, pend: .4, staffLines: 2, runs: .3, staffEyes: .24, hooks: .2, contourEyes: .16, spray: false, accent: 0, pearls: false, cross: true, bud: true },
  { name: 'lavish', column: true, filigree: true, counterEyes: 9, counterRules: true, bay: true, crown: 2, text: true, top: true, base: true, panelScallops: true, pend: .45, staffLines: 3, runs: -1, staffEyes: .28, hooks: .3, contourEyes: .3, spray: true, accent: .4, pearls: true, cross: true, bud: true },
];

// ---- the clearance (03's): distance from each cell to the nearest thing on the page, stamped as marks are accepted ---------
function clearance(x0, y0, w, h, blocked, cap) {
  const C = edt(blocked, w, h); for (let i = 0; i < C.length; i++) C[i] = Math.min(cap, C[i]);
  const get = (x, y) => { const i = Math.round(x - x0), j = Math.round(y - y0); return i < 0 || j < 0 || i >= w || j >= h ? 0 : C[j * w + i]; };
  const stamp = (pts, R = cap) => { for (const [px, py] of resample(pts, .8)) {
    const cx = px - x0, cy = py - y0, i0 = Math.max(0, Math.floor(cx - R)), i1 = Math.min(w - 1, Math.ceil(cx + R)), j0 = Math.max(0, Math.floor(cy - R)), j1 = Math.min(h - 1, Math.ceil(cy + R));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.hypot(i - cx, j - cy), k = j * w + i; if (d < C[k]) C[k] = d; } } };
  return { get, stamp, C };
}

// ---- the ridges of the letter's heavy strokes (the filigree's members), as polylines (page px) -------------------------------------
// Ridge cells: deep in the ink (more than .62 of the heaviest stroke's half-width) and the deepest across the stroke
// (a maximum of the depth along x or along y); walked into lines, nearest first, the short ones dropped.
function ridges(L, minLen, frac = .5) {
  const { M, w, h, x0, y0, res } = L, paper = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) paper[i] = M[i] <= .5;
  const D = edt(paper, w, h); let hw = 0; for (let i = 0; i < w * h; i++) if (D[i] > hw) hw = D[i];
  const pts = [];
  for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) { const k = j * w + i, d = D[k]; if (d < hw * frac) continue;
    if ((d >= D[k - 1] && d >= D[k + 1]) || (d >= D[k - w] && d >= D[k + w])) pts.push([i, j]); }
  const used = new Uint8Array(pts.length), grid = new Map(), key = (i, j) => (i >> 2) + ',' + (j >> 2);
  pts.forEach((p, n) => { const k = key(...p); grid.has(k) || grid.set(k, []); grid.get(k).push(n); });
  const near = (p, R) => { const out = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const n of grid.get(((p[0] >> 2) + a) + ',' + ((p[1] >> 2) + b)) ?? []) if (!used[n] && Math.hypot(pts[n][0] - p[0], pts[n][1] - p[1]) <= R) out.push(n); return out; };
  const lines = [];
  for (let s = 0; s < pts.length; s++) { if (used[s]) continue;
    // walk one way from s, then the other, each step to the nearest unused ridge cell within 2.5 cells
    // (keeping its way: of the cells ahead, the one most nearly straight on, so twin ridge cells do not zigzag it)
    const walk = (st, dir) => { const out = []; let p = pts[st];
      for (;;) { const c = near(p, 3.6); c.forEach(n => used[n] = 1); const nx = c.filter(n => Math.hypot(pts[n][0] - p[0], pts[n][1] - p[1]) > 1.2);
        if (!nx.length) break; const sc = n => { const v = [pts[n][0] - p[0], pts[n][1] - p[1]], l = Math.hypot(...v); return dir ? (v[0] * dir[0] + v[1] * dir[1]) / l * 2 - Math.abs(v[0] * dir[1] - v[1] * dir[0]) / l * 1.5 + l * .2 : l; };
        const n = nx.reduce((a, b) => sc(b) > sc(a) ? b : a), v = [pts[n][0] - p[0], pts[n][1] - p[1]], l = Math.hypot(...v);
        if (dir && (v[0] * dir[0] + v[1] * dir[1]) / l < .3) break; dir = dir ? [dir[0] * .6 + v[0] / l * .4, dir[1] * .6 + v[1] / l * .4] : [v[0] / l, v[1] / l]; p = pts[n]; out.push(p); }
      return out; };
    used[s] = 1; const a = walk(s, null), b = a.length ? walk(s, (() => { const v = [pts[s][0] - a[0][0], pts[s][1] - a[0][1]], l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l]; })()) : [], line = [...a.reverse(), pts[s], ...b];
    if (line.length > 3) lines.push(line.map(([i, j]) => [x0 + (i + .5) / res, y0 + (j + .5) / res])); }
  return lines.map(l => resample(l, 1)).filter(l => arclen(l) >= minLen).map(l => {   // smoothed: a pen's line, not the grid's
    const q = l.map((_, i) => { let sx = 0, sy = 0, n = 0; for (let k = Math.max(0, i - 7); k <= Math.min(l.length - 1, i + 7); k++) { sx += l[k][0]; sy += l[k][1]; n++; } return [sx / n, sy / n]; });
    return q.slice(3, -3); });
}

// ---- the filigree (467763's K, X and P, at 4×) ---------------------------------------------------------------------------------
// How it is made in the sources: the Lombard's body is not one flat blue. Its stem is split: a channel of the other colour
// down it, pointed at both ends, a hair of bare parchment reserved between it and the blue. Its broad members are worked
// panels: a double white line just inside the member's edge, following it all round, and inside that a field of roundels,
// each a ring (two where there is room) holding a trefoil of white points, a red point in each where they are big enough,
// small white points scattered between (the P, g07; the K, g00). The white is the parchment left bare by the painter (it
// carries the parchment's grain), so here it is cut from the paint: the page's own colour, in light and in dark. Measured
// (467763, at 4×): white lines ~1/130 of the letter's height, the double line's gap about one line, roundels ~1/9 of the
// height across. It thins itself: a member under ~0.15 of the height across is left solid; a roundel too small for its
// trefoil keeps one point; so on a phone the panels have fewer, larger-looking parts, never mush.
// Returns the paint's mask with the reserve cut, the channel's strokes (a broad nib, laid after the paint) and the red
// points (laid last).
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const taperOf = L => f => .08 + .92 * Math.pow(1 - sm(1 - Math.min(.35, 34 / L), 1, f), 1.2);   // the broad nib's lift (kit/illum.js swell)
export function filigree(L0, seed) {
  // the counters the letter closes are its panels (467763's bowls are worked, not bare): painted, and worked below
  const { w, h, x0, y0, res } = L0, out0 = new Uint8Array(w * h), st = [];
  for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x); for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
  while (st.length) { const i = st.pop(); if (out0[i] || L0.M[i] > .5) continue; out0[i] = 1; const x = i % w; if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (i >= w) st.push(i - w); if (i < w * (h - 1)) st.push(i + w); }
  const pan = new Uint8Array(w * h), M = Float32Array.from(L0.M); for (let k = 0; k < w * h; k++) if (!out0[k] && L0.M[k] <= .5) { pan[k] = 1; M[k] = 1; }
  const L = { ...L0, M }, paper = new Uint8Array(w * h); let r0 = h, r1 = 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = j * w + i; paper[k] = M[k] <= .5; if (!paper[k]) { r0 = Math.min(r0, j); r1 = Math.max(r1, j); } }
  const D = edt(paper, w, h), H = (r1 - r0) / res, r = stream(seed, 'filigree'), cut = new Float32Array(w * h), marks = [], reds = [];
  const at = (x, y) => { const i = Math.floor((x - x0) * res), j = Math.floor((y - y0) * res); return i < 0 || j < 0 || i >= w || j >= h ? -1 : j * w + i; };
  const depth = p => { const k = at(...p); return k < 0 ? 0 : D[k] / res; };
  const lay = (pts, wd) => { const R = wd / 2 + 1 / res; for (const [px, py] of resample(pts, .2)) { const ci = (px - x0) * res, cj = (py - y0) * res, Rr = R * res;
    for (let j = Math.max(0, Math.floor(cj - Rr)); j <= Math.min(h - 1, Math.ceil(cj + Rr)); j++) for (let i = Math.max(0, Math.floor(ci - Rr)); i <= Math.min(w - 1, Math.ceil(ci + Rr)); i++) {
      const d = Math.hypot(i + .5 - ci, j + .5 - cj) / res, v = Math.min(1, Math.max(0, (wd / 2 - d) * 3.2 + .5)), k = j * w + i; if (v > cut[k]) cut[k] = v; } } };
  const point = (c, rad) => lay([c, [c[0] + .01, c[1]]], rad * 2);
  const ring = (c, R, wd) => lay(Array.from({ length: Math.max(16, Math.ceil(R * 6)) + 1 }, (_, k) => { const a = k / Math.max(16, Math.ceil(R * 6)) * 2 * Math.PI; return [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R]; }), wd);
  const lw = Math.max(.6, H * .0078), gp = Math.max(.65, H * .008);
  // 1. the stem's channel: the longest member that runs straight and upright, if it is broad enough
  const chans = [], segD = (p, { a, b }) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t); };
  const upright = P => Math.abs(P.at(-1)[1] - P[0][1]);
  const stem = ridges(L0, H * .45, .45).filter(P => { const Lp = arclen(P); return Math.hypot(P.at(-1)[0] - P[0][0], P.at(-1)[1] - P[0][1]) / Lp > .96 && upright(P) > Lp * .85; }).sort((a, b) => upright(b) - upright(a))[0];
  const B0 = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) B0[k] = L0.M[k] <= .5; const D0 = edt(B0, w, h), depth0 = p => { const k = at(...p); return k < 0 ? 0 : D0[k] / res; };
  if (stem) { const dep = resample(stem, 1).map(depth0), md = dep.reduce((a, b) => a + b, 0) / dep.length;
    if (md >= H * .05) { const chw = Math.min(md * .6, H * .075), gap = Math.max(.7, lw * 1.15), a = stem[0], b = stem.at(-1), Lp = arclen(stem), t = [(b[0] - a[0]) / Lp, (b[1] - a[1]) / Lp];
      const st = resample([a, b], .5), Ls = arclen(st), wf = f => (.4 + .6 * sm(0, Math.min(.15, 9 / Ls), f)) * taperOf(Ls)(f);
      st.forEach((q, i) => point(q, chw * wf(i / (st.length - 1)) / 2 + gap));
      marks.push({ pts: st, kind: 'channel', w: chw, nib: -Math.atan2(t[0], t[1]) }); chans.push({ a, b, half: md }); } }
  // 2. the panels: a double white line just inside each panel's edge (the first parts it from the body), then the field
  const nopan = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) nopan[k] = !pan[k];
  const P = edt(nopan, w, h), e1 = lw * .55, e2 = e1 + lw + gp;
  for (let k = 0; k < w * h; k++) { if (!pan[k]) continue; const d = P[k] / res, v = Math.max(1 - Math.abs(d - e1) / (lw / 2 + .12), 1 - Math.abs(d - e2) / (lw / 2 + .12)); if (v > 0) cut[k] = Math.max(cut[k], Math.min(1, v * 1.6)); }
  // 3. the field inside the double line: roundels, packed from the deepest outward, each a ring (two if it is large) round a
  // trefoil of points with a red point in each; then small points between
  const inner = k => P[k] / res - e2 - lw / 2 - gp, cells = [], got = [];
  for (let k = 0; k < w * h; k += 2) if (pan[k] && inner(k) > 1.3) cells.push(k);
  cells.sort((a, b) => inner(b) - inner(a) + (r() - .5) * 1.2);
  const rMax = H * .062;
  for (const k of cells) { const c = [x0 + (k % w + .5) / res, y0 + ((k / w | 0) + .5) / res], R = Math.min(rMax, inner(k) - .1); if (R < 1.3) continue;
    if (got.some(g => Math.hypot(g.c[0] - c[0], g.c[1] - c[1]) < g.R + R + gp + lw * .5)) continue; got.push({ c, R }); }
  for (const { c, R } of got) {
    ring(c, R - lw / 2, lw); let ri = R - lw / 2;
    if (R >= 3.6) { ri = R - lw * 1.5 - gp; ring(c, ri, lw * .9); }
    const dr = Math.max(.55, ri * .28), a0 = r() * 2 * Math.PI;
    if (ri - lw >= dr * 2.2) for (let q = 0; q < 3; q++) { const a = a0 + q * 2 * Math.PI / 3, p = [c[0] + Math.cos(a) * dr * 1.2, c[1] + Math.sin(a) * dr * 1.2]; point(p, dr); if (dr >= .95) reds.push({ p, r: dr * .45 }); }
    else point(c, Math.max(.55, Math.min(dr * 1.3, ri - lw))); }
  // small points between the roundels
  const n0 = got.length;
  for (const k of cells) { if (r() > .4) continue; const c = [x0 + (k % w + .5) / res, y0 + ((k / w | 0) + .5) / res], pr = Math.max(.5, lw * .72);
    if (inner(k) < pr + .3 || got.some(g => Math.hypot(g.c[0] - c[0], g.c[1] - c[1]) < g.R + pr + gp)) continue; point(c, pr); got.push({ c, R: pr }); }
  const out = new Float32Array(w * h); for (let k = 0; k < w * h; k++) out[k] = M[k] * (1 - cut[k]);
  return { M: { ...L, M: out }, full: L, marks, reds };
}

// ---- the flourish ----------------------------------------------------------------------------------------------------------------
// 03's (kit/penwork.js flourish), deepened: the same order of work and the same clearance, with the columns' capitals,
// the text-side panel, pendants, the pearled contour, the cross. The filigree is laid by filigree() above. Arguments as 03's, and tp: the
// text-side panel [x0, y0, x1, y1] or null.
export function flourish({ glyph, panel, keep = [], staff = null, g = 2.6, cap = true, seed = 1, level = 2, right = g, tp = null }) {
  const r = stream(seed, 'penwork'), out = [], B = BUDGETS[level];
  const { M, w: gw, h: gh, x0: gx, y0: gy, res } = glyph, ink = new Uint8Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) ink[i] = M[i] > .5;
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) if (ink[j * gw + i]) { bx0 = Math.min(bx0, i); bx1 = Math.max(bx1, i); by0 = Math.min(by0, j); by1 = Math.max(by1, j); }
  const box = [gx + bx0 / res, gy + by0 / res, gx + (bx1 + 1) / res, gy + (by1 + 1) / res];
  const [px0, py0, px1, py1] = panel, sy1 = staff ? staff.y1 : py1;
  const X0 = Math.floor(Math.min(px0, box[0]) - g * 10), Y0 = Math.floor(Math.min(py0, box[1]) - g * 12), X1 = Math.ceil(Math.max(box[2] + g * 3, tp ? tp[2] + g * 4 : 0)), Y1 = Math.ceil(Math.max(sy1, box[3]) + g * 12), W = X1 - X0, H = Y1 - Y0;
  keep = keep.filter(k => k[2] > X0 - 20 && k[0] < X1 + 20 && k[3] > Y0 - 20 && k[1] < Y1 + 20);   // (only the words near: the grid asks of every cell)
  const onLetter = (x, y) => { const i = Math.round((x - gx) * res), j = Math.round((y - gy) * res); return i >= 0 && j >= 0 && i < gw && j < gh && ink[j * gw + i]; };
  const inWords = (x, y, pad = 0) => keep.some(k => x >= k[0] - pad && x <= k[2] + pad && y >= k[1] - pad && y <= k[3] + pad);
  const blocked = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = X0 + i + .5, y = Y0 + j + .5; blocked[j * W + i] = onLetter(x, y) || inWords(x, y); }
  const CL = clearance(X0, Y0, W, H, blocked, 16);
  const accept = (pts, kind, o = {}) => { out.push({ pts, kind, ...o }); CL.stamp(pts); };
  const room = (pts, d) => pts.every(p => CL.get(p[0], p[1]) >= d);
  const C0 = Float32Array.from(CL.C), c0 = (x, y) => { const i = Math.round(x - X0), j = Math.round(y - Y0); return i < 0 || j < 0 || i >= W || j >= H ? 0 : C0[j * W + i]; };
  const encl = (() => { const outside = new Uint8Array(gw * gh), st = [];
    for (let x = 0; x < gw; x++) st.push(x, (gh - 1) * gw + x); for (let y = 0; y < gh; y++) st.push(y * gw, y * gw + gw - 1);
    while (st.length) { const i = st.pop(); if (outside[i] || ink[i]) continue; outside[i] = 1; const x = i % gw;
      if (x > 0) st.push(i - 1); if (x < gw - 1) st.push(i + 1); if (i >= gw) st.push(i - gw); if (i < gw * (gh - 1)) st.push(i + gw); }
    return (x, y) => { const i = Math.round((x - gx) * res), j = Math.round((y - gy) * res); return i >= 0 && j >= 0 && i < gw && j < gh && !ink[j * gw + i] && !outside[j * gw + i]; }; })();

  // shapes the pen makes
  const hk = (p, h, size, sense) => tendril(p, h, size * 2 * Math.PI * .8, 0, sense / size, 1.6, .4);
  const eye = (c, R, lobes = true) => {
    accept(ring(c, R, r, .07, r() * 6.28), 'eye', { w: .5, start: 'cut', end: 'cut' });
    out.push({ kind: 'dot', p: c, r: Math.max(.7, R * .27), accent: !!B.accent && r() < B.accent });
    if (!lobes) return;
    const nl = 4 + ((r() * 2) | 0), a0 = r() * 6.28;
    for (let k = 0; k < nl; k++) { const a = a0 + k / nl * 2 * Math.PI + (r() - .5) * .25, lr = R * (.36 + r() * .1), d = R + lr * .62;
      const lc = [c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d], pts = [];
      for (let i = 0; i <= 14; i++) { const b = a - 1.9 + i / 14 * 3.8; pts.push([lc[0] + Math.cos(b) * lr, lc[1] + Math.sin(b) * lr]); }
      if (room(pts.slice(3, -3), g * .55)) accept(pts, 'lobe', { w: .45, start: 'cut', end: 'cut' }); }
  };

  // 1. eyes in the counters, and the bay
  const comps = [], cid = new Map();
  { const seen = new Set(); for (let y = Math.ceil(box[1]); y < box[3]; y++) for (let x = Math.ceil(box[0]); x < box[2]; x++) { if (!encl(x, y)) continue;
      const key = Math.round((x - gx) * res) + ',' + Math.round((y - gy) * res); if (seen.has(key)) continue;
      let best = null; const st = [[x, y]], mark = new Set([x + ',' + y]); let ex0 = x, ex1 = x;
      while (st.length) { const [u, v] = st.pop(); const c = c0(u, v); if (!best || c > best.c) best = { c, p: [u, v] }; ex0 = Math.min(ex0, u); ex1 = Math.max(ex1, u);
        for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = u + du, b = v + dv, k2 = a + ',' + b; if (!mark.has(k2) && encl(a, b)) { mark.add(k2); st.push([a, b]); } } }
      for (const k2 of mark) { const [a, b] = k2.split(',').map(Number); seen.add(Math.round((a - gx) * res) + ',' + Math.round((b - gy) * res)); }
      for (const k2 of mark) cid.set(k2, comps.length); best.x0 = ex0; best.x1 = ex1; comps.push(best); } }
  // (466773: where a counter is wide enough, its hairlines stand as one column down its middle, an eye either side of
  // it; a narrower counter is ruled across with an eye at its widest, as 03)
  for (const b of B.counterEyes >= comps.length ? comps : [...comps].sort((u, v) => v.c - u.c).slice(0, B.counterEyes)) {
    const wd = b.x1 - b.x0, cxm = (b.x0 + b.x1) / 2;
    if (B.column && wd >= g * 6.5) { const half = g * (wd >= g * 9 ? 1.7 : 1.25); b.band = [cxm - half, cxm + half];
      const Rs = Math.min(g * 1.6, ((wd / 2 - half) - g * 1.1) / 2.1);
      if (Rs >= g * .55) for (const sd of [-1, 1]) { const ec = [cxm + sd * (half + g * .75 + Rs * 1.05), b.p[1] + (r() - .5) * g * .6];
        if (encl(ec[0], ec[1]) && c0(...ec) >= Rs + g * .45) eye(ec, Rs, Rs >= g * 1.1); }
      continue; }
    const R = Math.min(g * 2.2, (b.c - g * .8) / 1.7); if (R >= g * .8) eye([b.p[0] + (r() - .5) * .4, b.p[1] + (r() - .5) * .4], R); }
  let bay = null;
  { const R = Math.min(g * 2.2, (px1 - px0) * .14), bw = 2 * R * 1.45 + g * .8;
    if (B.bay && px1 - px0 > bw + g * 5 && R >= g * 1.1) { bay = [px1 - bw, px1]; const ec = [(bay[0] + bay[1]) / 2 + (r() - .5) * .5, (py0 + py1) / 2 + (r() - .5) * g];
      eye(ec, R); bay.eye = ec; } }

  // 2. the staff (03's): the panel's outer hairline down the margin, a curl at its foot; its fellows beside it
  const sx = px0, lines = [];
  const outer = drift([[sx, py0 + g * .5], [sx, sy1]], .32, seed + 3, 46), foot = hk(outer.at(-1), Math.PI / 2, g * (1.6 + r() * .4), 1);
  const head = cap && B.crown ? [outer[0]] : hk(outer[0], -Math.PI / 2, g * (1 + r() * .3), -1).reverse();
  const staff1 = [...head.slice(0, -1), ...outer, ...foot.slice(1)]; accept(staff1, 'staff', { w: .58, start: head.length > 1 ? 'pool' : 'cut', end: 'ball' }); lines.push(staff1);
  out.push({ kind: 'dot', p: foot.at(-1), r: 1.15 });
  if (staff) for (let k = 1; k < B.staffLines; k++) { const x2 = sx - g * 1.1 * k, ya = py1 + g * (2 + 5 * (k - 1)), yb = sy1 - g * (3 + 7 * (k - 1));
    if (yb - ya < g * 8) break;
    const s2 = drift([[x2, ya], [x2, yb]], .35, seed + 5 * k, 50), sf = hk(s2.at(-1), Math.PI / 2, g * (1.1 + .3 * (k - 1)), 1);
    const pair = [...s2, ...sf.slice(1)]; accept(pair, 'staff', { w: .48, start: 'pool', end: 'ball' }); lines.push(pair); }
  if (staff && B.spray && lines.length > 1) { const L = resample(lines.at(-1), 1), i = Math.max(0, L.length - Math.round(g * 9));
    for (const [h, s] of [[Math.PI / 2 + .75, 1], [Math.PI / 2 + 1.35, -1]]) { const k = hk(L[i - Math.round(g * 2.5 * (s < 0))] ?? L[i], h, g * (1 + r() * .3), s);
      if (room(k.slice(5), g * .55)) { accept(k, 'hook', { w: .48, start: 'cut', end: 'ball' }); out.push({ kind: 'dot', p: k.at(-1), r: 1.15 + r() * .3, accent: !!B.accent && r() < B.accent }); } } }

  // 3. the capitals. A crown 1 is 03's arch with the eye standing on it; a crown 2 the column's capital of 466773: a dome
  // over the panel's head with a ring and its point inside, the dome's feet curling out into small loops with a bead, a
  // hairline across under it (the abacus) where the hairlines stop, and on the finer budgets a bud on its top
  const crown = (cx0, cx1, base, kind) => {
    const span = cx1 - cx0, mid = (cx0 + cx1) / 2; if (span < g * 3) return false;
    const rise = kind === 2 ? Math.min(span * (.4 + r() * .06), g * 6.5) : span * (.22 + r() * .06), P = [];
    // (466773's capitals are drawn freehand: the dome a little lopsided and lumpy, never a compass's arc)
    const lump = noise1(seed ^ (cx0 * 7 | 0)), lean = (r() - .5) * .16;
    for (let k = 0; k <= 28; k++) { const u = k / 28, su = Math.pow(Math.sin(Math.PI * u), kind === 2 ? .8 : 1), uu = Math.min(1, Math.max(0, u + lean * su));
      P.push([cx0 + span * uu, base - rise * su * (kind === 2 ? 1 + .14 * (lump(u * 3.2) - .5) * 2 : 1) - (r() - .5) * .15]); }
    if (!room(P.slice(3, -3), g * .5)) return false;
    accept(P, 'cap', { w: .5, start: 'cut', end: 'cut' });
    if (kind === 2) {
      const R = Math.min(rise * .3, span * .2); if (R >= g * .65) eye([mid + (r() - .5) * .4, base - rise * .44], R, false);
      const ab = drift([[cx0 + g * .25, base + g * .05], [cx1 - g * .25, base + (r() - .5) * .3]], .12, seed + 31 + (cx0 | 0), 30);
      if (room(ab.slice(2, -2), g * .4)) accept(ab, 'abacus', { w: .46, start: 'cut', end: 'cut' });
      // studs: small loops set round the dome's back, each with its point (two or three, as the room allows)
      for (const u of [.2, .8, ...(B.bud ? [] : [.5])]) { const i = Math.round(u * 28), q = P[i], t = tangentAt(P, i), n = [t[1], -t[0]], sr = g * (.5 + r() * .12), sc = [q[0] + n[0] * sr * 1.02, q[1] + n[1] * sr * 1.02], sp = ring(sc, sr, r, .12, Math.atan2(-n[1], -n[0]), 1.05);
        if (room(sp.slice(8, -8), g * .12)) { accept(sp, 'stud', { w: .45, start: 'cut', end: 'cut' }); out.push({ kind: 'dot', p: sc, r: .55 }); } }
      if (B.bud) { const bc = [mid + (r() - .5) * .3, base - rise - g * .95], br = g * .55, bp = ring(bc, br, r, .1, Math.PI / 2, 1.02);
        if (room(bp, g * .3)) { accept(bp, 'bud', { w: .45, start: 'cut', end: 'cut' }); out.push({ kind: 'dot', p: bc, r: .6 }); } }
    } else {
      const er = Math.min(g * 1.8, span * .18), ec = [mid + (r() - .5), base - rise - er - g * .7];
      if (B.crown > 1 && room(ring(ec, er + g * .25, r), g * .35)) eye(ec, er);
    }
    for (const [p, h, s] of [[P[0], Math.PI * 1.15, 1], [P.at(-1), -.1, -1]]) { const k = hk(p, h, g * (kind === 2 ? .85 : 1) * (1 + r() * .3), s);
      if (room(k.slice(4), g * .6)) { accept(k, 'hook', { w: .48, start: 'cut', end: 'ball' }); out.push({ kind: 'dot', p: k.at(-1), r: 1.05 + r() * .25 }); } }
    return true;
  };
  const topLines = [], cx1 = Math.min(px1, box[0] - g * .6);
  if (cap && B.crown) {
    crown(sx, cx1, py0 + g * .5, B.crown);
    // the text side's capital, its feet a little above the letter's head
    if (tp && B.text) crown(tp[0] - g * .4, tp[2], tp[1] + g * .5, B.crown);
    // a hairline along the letter's top from the margin's capital toward the other, a gap above the letter
    const ty = box[1] - g * 1.05, top = [], stop = tp && B.text ? tp[0] - g * 2.5 : box[2] - g * 2;
    if (B.top) for (let x = cx1 + g * 1.5; x < stop; x += 1) { if (c0(x, ty) >= g * .8 && !onLetter(x, ty + g * .6)) top.push([x, ty + (r() - .5) * .1]); else if (top.length > 4) break; }
    if (top.length > g * 4) { const tl = drift(top, .2, seed + 9, 30), k = hk(tl.at(-1), 0, g * 1.1, -1), tline = [...tl, ...k.slice(1)];
      if (room(tline, g * .5)) { accept(tline, 'top', { w: .48, start: 'cut', end: 'ball' }); topLines.push(tl); } }
  }

  // 4. the ruled hairlines, straight down and close, in the panels and the counters, stopping short of what they meet
  const C1 = Float32Array.from(CL.C), c1 = (x, y) => { const i = Math.round(x - X0), j = Math.round(y - Y0); return i < 0 || j < 0 || i >= W || j >= H ? 0 : C1[j * W + i]; };
  const inPanel = (x, y) => x > sx && x < px1 && y > py0 && y < py1;
  const inTP = (x, y) => tp && B.text && x > tp[0] && x < tp[2] && y > tp[1] && y < tp[3];
  const inBox = (x, y) => B.counterRules && x > box[0] && x < box[2] + right && y > box[1] - g * .3 && y < box[3];
  const inBay = (x, y) => bay && x > bay[0] && x < bay[1] + g && y > py0 - g && y < py1 + g;
  const inBand = (x, y) => { if (!encl(x, y)) return true; const b = comps[cid.get(Math.round(x) + ',' + Math.round(y))]; return !b?.band || (x > b.band[0] && x < b.band[1]); };
  const open = (x, y) => (inPanel(x, y) || inBox(x, y) || inTP(x, y)) && !inBay(x, y) && !onLetter(x, y) && !inWords(x, y) && inBand(x, y) && c1(x, y) >= g * .62;
  const spacing = noise1(seed ^ 0x71), lineRows = [], xEnd = Math.max(box[2] + right, tp && B.text ? tp[2] : 0), yA = Math.min(py0, box[1], tp?.[1] ?? 1e9) - g;
  for (let x0 = sx + g * .95, k = 0; x0 < xEnd; x0 += g * (.82 + .38 * spacing(x0 / 7)), k++) {
    const x = x0 + (r() - .5) * g * .12; let y0 = -1;
    for (let y = yA; y <= Math.max(py1, box[3]) + .5; y += .5) {
      const ok = y < Math.max(py1, box[3]) && open(x, y);
      if (ok && y0 < 0) y0 = y;
      if (!ok && y0 >= 0) { const a = y0 + r() * g * .6, b = y - .5 - r() * g * .6;
        if (b - a > g * 1.6) { const pts = drift([[x, a], [x + (r() - .5) * .6, b]], .32, seed + 100 + k * 7 + (y | 0), 9); accept(pts, 'rule', { w: .5 + r() * .14, start: 'cut', end: 'taper', rho: .8 + r() * .25 }); lineRows.push({ x, pts }); }
        y0 = -1; }
    }
  }

  // 5. scallops (and pendants, and hooks) strung down the outer side of the bundles and the staff
  const chain = (line, keepY, side, { eyes = 0, runs = null, hooks = B.hooks, onStaff = false, pend = 0 } = {}) => { const P = resample(line, 1), gate = noise1(seed ^ (line.length * 31));
    for (let i = 0, next = Math.round(g * 1.5); i < P.length - g * 4; i++) {
      if (i < next || !keepY(P[i])) continue; next = i + g * (2.25 + r() * .35);
      if (runs != null && gate(i / (g * 9)) < runs) continue;
      const p = P[i], t = tangentAt(P, i), n = [-t[1] * side, t[0] * side], sr = g * (.82 + r() * .2), c = [p[0] + n[0] * sr * .45, p[1] + n[1] * sr * .45], a0 = Math.atan2(n[1], n[0]), pts = [];
      for (let q = 0; q <= 14; q++) { const b = a0 - 2.1 + q / 14 * 4.2; pts.push([c[0] + Math.cos(b) * sr, c[1] + Math.sin(b) * sr]); }
      if (eyes && (!onStaff || p[1] > py1 + g * 6) && r() < eyes) { const R = g * (onStaff ? 1.3 : 1), L = g * 1.3, ec = [p[0] + n[0] * (L + R), p[1] + n[1] * (L + R)];
        if (room(ring(ec, R * 1.7, r), g * .6)) { accept([p, [p[0] + n[0] * L, p[1] + n[1] * L]], 'stalk', { w: .45, start: 'cut', end: 'cut' }); eye(ec, R); next = i + g * 6; continue; } }
      // a pendant: a small closed loop hung on the line from the point where the pen leaves it, a point inside (466773)
      if (pend && r() < pend) { const pr = g * (.68 + r() * .12), pc = [p[0] + n[0] * pr * 1.02, p[1] + n[1] * pr * 1.02], pp = ring(pc, pr, r, .12, a0 + Math.PI, 1.06);
        if (room(pp.slice(5, -5), g * .45)) { accept(pp, 'pendant', { w: .46, start: 'cut', end: 'cut' }); out.push({ kind: 'dot', p: [pc[0] + n[0] * pr * .12, pc[1] + n[1] * pr * .12], r: .62 + r() * .12, accent: !!B.accent && r() < B.accent * .5 }); next = i + g * (3.3 + r() * .4); continue; } }
      if (hooks && r() < hooks) { const k = hk(p, Math.atan2(n[1], n[0]) + (r() < .5 ? .5 : -.5), g * (.85 + r() * .25), r() < .5 ? 1 : -1);
        if (room(k.slice(4), g * .55)) { accept(k, 'hook', { w: .46, start: 'cut', end: 'ball' }); out.push({ kind: 'dot', p: k.at(-1), r: 1.1 + r() * .35, accent: !!B.accent && r() < B.accent }); next = i + g * 3; continue; } }
      if (room(pts.slice(3, -3), g * .5)) { accept(pts, 'scallop', { w: .5, start: 'cut', end: 'cut' }); if (B.accent && r() < B.accent * .35) out.push({ kind: 'dot', p: [c[0] + n[0] * sr * .2, c[1] + n[1] * sr * .2], r: .75, accent: true }); }
    } };
  if (B.panelScallops) chain(staff1, p => p[1] < py1 + g * 2.5, 1, { eyes: B.contourEyes * .5, pend: B.pend });
  for (const line of lines.slice(1)) chain(line, () => true, 1, { eyes: staff ? B.staffEyes : 0, runs: B.runs, onStaff: true });
  // the text-side bundle: its outermost hairline strung on its outer side
  if (B.text && tp) { const edge = lineRows.filter(l => l.x > box[2] && arclen(l.pts) > g * 6).sort((u, v) => v.x - u.x)[0]; if (edge) chain(edge.pts, () => true, -1, { hooks: 0, pend: B.pend }); }
  if (bay) for (const [pick, side] of [[l => l.x < bay[0], -1], [l => l.x > bay[1], 1]]) {
    const cand = lineRows.filter(l => pick(l) && l.pts[0][1] < bay.eye[1] && l.pts.at(-1)[1] > bay.eye[1]);
    const edge = cand.sort((u, v) => side < 0 ? v.x - u.x : u.x - v.x)[0]; if (edge) chain(edge.pts, () => true, side, { pend: B.pend * .5 }); }
  for (const tl of topLines) chain(tl, () => true, -1, { eyes: B.contourEyes });
  if (cap && B.base) { const by = py1 + g * .9, x1 = Math.min(px1, box[0] - g * .5), base = drift([[sx + g * .4, by], [x1, by + (r() - .5) * .6]], .2, seed + 13, 30);
    if (room(base.slice(2), g * .45)) { accept(base, 'base', { w: .48, start: 'cut', end: 'ball' }); chain(base, () => true, 1); } }

  // 6. the cross of points in the margin, beside the staff's head (467763)
  if (B.cross && staff) { const c = [sx - g * 4.2, py0 + (py1 - py0) * .62 + (r() - .5) * g], s = g * 1.15, arms = [[[c[0] - s, c[1]], [c[0] + s, c[1]]], [[c[0], c[1] - s * 1.3], [c[0], c[1] + s * 1.15]]];
    const pts4 = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([a, b]) => [c[0] + (a - b) * s * .62, c[1] + (a + b) * s * .62]);
    if (arms.every(a => room(a, g * .7)) && pts4.every(p => CL.get(...p) >= g * .7) && !inWords(c[0], c[1], g * 3)) { for (const a of arms) accept(drift(a, .1, seed + 41, 20), 'cross', { w: .46, start: 'taper', end: 'taper' }); for (const p of pts4) out.push({ kind: 'dot', p, r: .62 }); } }

  // 7. the pearled contour: where nothing stands against the letter, fine points a gap off its outline (lavish)
  if (B.pearls) { const step = g * 2.1, got = [];
    for (let y = Math.floor(box[1] - g * 2); y < box[3] + g * 2; y += .5) for (let x = Math.floor(box[0] - g * 2); x < box[2] + g * 2; x += .5) {
      const d = CL.get(x, y), dl = c0(x, y); if (Math.abs(dl - g * 1.05) > .3 || encl(x, y) || inWords(x, y, g * 1.5)) continue;
      if (d < g * .95) continue; if (got.some(q => Math.hypot(q[0] - x, q[1] - y) < step)) continue; got.push([x, y]); }
    for (const p of got) out.push({ kind: 'dot', p, r: .55 + r() * .08 }); }

  return out;
}

// ---- the initial ---------------------------------------------------------------------------------------------------------------
// 03's geometry and inks exactly (kit/initials.js gothic), the text-side panel from the usual budget up
const GEOM = { panelW: [.3, .4, .52, .6, .68], rise: [0, .03, .06, .14, .22], staff: [1.4, 3.2, 5.5, 7, 9], wider: [0, 0, 4, 6, 9],
  small: { panelW: [5, 7, 8.5, 10, 12], staff: [.7, 1.2, 1.6, 2.2, 3] } };
const INKS = { azurite: [212, 108, 82], minium: [60, 86, 164] };
// the dark page's paints: the pigment laid flat (kit/illum.js lifts it), its body thick where the brush pooled at the
// edge and thinner over the middle, so it reads laid, not printed
PIGMENTS.cbAzureDark ??= { rgb: [52, 88, 206], gran: .03, rim: .42 };
PIGMENTS.cbMiniumDark ??= { rgb: [214, 84, 52], gran: .03, rim: .36 };
function pooled(L, seed) {
  const { M, w, h, res } = L, paper = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) paper[i] = M[i] <= .5;
  const D = edt(paper, w, h), n = noise2(seed ^ 0x2b), out = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = j * w + i; if (!M[k]) continue; const d = D[k] / res;
    out[k] = M[k] * Math.min(1, .8 + .2 * Math.exp(-d / 1.3) + .07 * (n(i / res / 6, j / res / 6) - .5)); }
  return { ...L, M: out };
}
// ---- the letter: the choir book's own Lombards ------------------------------------------------------------------------------------
// Traced from the Lombards of one gradual (Met 467763, Italian, c. 1310-15) and two leaves of its time (tools/tracelomb.py),
// the alphabet completed from the set's own strokes (tools/lombcompose.py, research/choirbook/lombards.json), each letter its
// own small webfont (tools/lombfont.py; playground/fonts/choirbook) made with EB Garamond's vertical metrics and cap height,
// so kit/illum.js, which sizes and places a drop by Garamond's metrics, sets a Lombard exactly where a Garamond capital
// would stand, and floats it as wide as itself. The host sets its initials in the face (CSS: .ini { font-family: "Choir
// Lombard", "EB Garamond" }); initial.load() fetches the letters the page uses before anything is measured.
export const FAMILY = 'Choir Lombard';
const fontDir = new URL('../../fonts/choirbook/', import.meta.url), loaded = new Set();
export async function loadLetters(chars) {
  await Promise.all([...new Set(chars)].filter(c => /^[A-Z]$/.test(c) && !loaded.has(c)).map(async c => {
    const f = new FontFace(FAMILY, `url(${new URL(`choir-lombard-${c}.woff2`, fontDir)})`, { unicodeRange: 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'), weight: '100 900' });
    document.fonts.add(f); await f.load(); loaded.add(c); }));
}
// which letter a drop is: kit/illum.js hands a registry style the letter's Garamond coverage (G) and not the letter, so it is
// read back from that coverage: the capital of EB Garamond 600 at that size whose ink box and cells match it best
function identify(G) {
  if (G.ch) return G.ch; const c = new OffscreenCanvas(8, 8).getContext('2d'); c.font = `600 ${G.F}px "EB Garamond"`;
  const gw = G.box[2] - G.box[0], gh = G.box[3] - G.box[1]; let best = null;
  for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') { const m = c.measureText(ch), e = Math.abs(m.actualBoundingBoxLeft + m.actualBoundingBoxRight - gw) + Math.abs(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent - gh);
    if (e > 1.5) continue;
    // the cells: Garamond's letter drawn on G's grid, the share of cells that agree
    const k = new OffscreenCanvas(G.w, G.h).getContext('2d', { willReadFrequently: true }); k.setTransform(G.res, 0, 0, G.res, -G.x0 * G.res, -G.y0 * G.res); k.font = c.font;
    k.fillText(ch, G.box[0] + m.actualBoundingBoxLeft, G.box[1] + m.actualBoundingBoxAscent); const d = k.getImageData(0, 0, G.w, G.h).data; let agree = 0;
    for (let i = 0; i < G.w * G.h; i += 3) agree += (d[i * 4 + 3] > 127) === (G.M[i] > .5);
    if (!best || agree > best.a) best = { a: agree, ch }; }
  return best?.ch ?? '';
}
const letterOf = s => String(s ?? '').trim().normalize('NFD')[0]?.toUpperCase() ?? '';
// the Lombard as a coverage mask at res cells per px, from the measure kit/illum.js made of the drop (G: Garamond's ink
// box of the same letter at the same size, G.F): the pen's place and the baseline recovered from it, the Lombard drawn there
function lombard(G, ch, res = 4) {
  if (!loaded.has(ch) || !G.F) return null;
  const c = new OffscreenCanvas(8, 8).getContext('2d'); c.font = `600 ${G.F}px "EB Garamond"`; const mg = c.measureText(ch);
  const x = G.box[0] + mg.actualBoundingBoxLeft, base = G.box[1] + mg.actualBoundingBoxAscent;
  const font = `400 ${G.F}px "${FAMILY}"`; c.font = font; const m = c.measureText(ch), pad = 4;
  const gx = Math.floor(x - m.actualBoundingBoxLeft - pad), gy = Math.floor(base - m.actualBoundingBoxAscent - pad);
  const w = Math.ceil((x + m.actualBoundingBoxRight + pad - gx) * res), h = Math.ceil((base + m.actualBoundingBoxDescent + pad - gy) * res);
  const k = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true }); k.setTransform(res, 0, 0, res, -gx * res, -gy * res); k.font = font; k.fillStyle = '#000'; k.fillText(ch, x, base);
  const d = k.getImageData(0, 0, w, h).data, M = new Float32Array(w * h); for (let i = 0; i < w * h; i++) M[i] = d[i * 4 + 3] / 255;
  return { M, w, h, x0: gx, y0: gy, res, box: [x - m.actualBoundingBoxLeft, base - m.actualBoundingBoxAscent, x + m.actualBoundingBoxRight, base + m.actualBoundingBoxDescent], F: G.F };
}

export function initial({ G: G0, keep, lh, big, level: li, seed, room: margin, bottom, filigree: filig = null, ch }) {
  const G = lombard(G0, ch ? letterOf(ch) : identify(G0)) ?? G0;
  const pig = big ? 'azurite' : 'minium', ink = INKS[pig], [lx0, ly0, lx1, ly1] = G.box, Hl = ly1 - ly0, dark = isDark();
  const gap = big ? 2.6 : 2.1, roomL = Math.max(0, margin - gap * 3);
  const panel = big ? [lx0 - Math.min(GEOM.panelW[li] * Hl, roomL), ly0 - GEOM.rise[li] * Hl, lx0 - gap * .7, ly1]
    : [lx0 - Math.min(GEOM.small.panelW[li], roomL), ly0 - 1, lx0 - gap * .6, ly1 + 1];
  const staff = { y1: Math.min(bottom, ly1 + Math.round((big ? GEOM.staff[li] : GEOM.small.staff[li]) * lh)) };
  const right = big && li >= 2 ? lh * .42 + GEOM.wider[li] : gap;
  const tp = big && li >= 2 ? [lx1 + gap * .4, ly0 - GEOM.rise[li] * Hl * .6, lx1 + right - gap * .6, ly1] : null;
  const L = drawn(G, seed, big ? .5 : .3);   // (the traced edge already wavers: a lighter hand than 03's on a type glyph)
  const q = new URLSearchParams(globalThis.location?.search ?? ''), fq = filig ?? (q.has('filigree') ? q.get('filigree') !== '0' : null);
  // the filigree, in a drop initial (the line initial is too small to be worked): its reserve cut from the paint, its
  // channel laid in the other colour (minium in azurite) after the paint and before the penwork; the penwork keeps to the
  // letter as painted, its worked counters included
  const F = big && (fq ?? BUDGETS[li].filigree) ? filigree(L, seed) : { M: L, full: L, marks: [] };
  const marks = flourish({ glyph: F.full, panel, keep, staff, g: gap, seed, level: li, right, tp });
  const chInk = PIGMENTS[big ? 'minium' : 'azurite'].rgb;
  const channel = F.marks.map((s, i) => ({ pts: s.pts, col: 'b', ink: chInk, seed: seed + 7 * i, w: s.w, broad: .9, nib: s.nib, load: 1, dry: .12, swell: 0, start: 'taper', end: 'taper' }));
  const reds = (F.reds ?? []).map(d => ({ dot: true, p: d.p, r: d.r, col: 'b', ink: chInk }));
  // dark: the letter laid flat in the style's own designed dark paint (its inkDark: 'b' is the drop's blue, 'a' the line
  // initial's red), its opacity pooled at the rim. (kit/illum.js lays a pigment letter on a dark page as the pigment
  // lifted to a pastel; a designed dark pigment needs a hook there: letter.pigmentDark, or flat() not lifting it.)
  return { letter: dark ? { M: pooled(F.M, seed), col: big ? 'b' : 'a' } : { M: F.M, pigment: pig },
    marks: [...channel, ...reds, ...marks.map((s, i) => s.kind === 'dot'
      ? { dot: true, p: s.p, r: s.r, col: s.accent ? 'a' : 'b', ink: s.accent ? PIGMENTS[pig].rgb : ink }
      : { pts: s.pts, col: 'b', ink, seed: seed + i * 13, w: s.w * 1.15, rho: s.rho, start: s.start, end: s.end, load: .78 * (s.rho ?? 1), dry: .3, broad: .42, swell: .25, nib: .5 })] };
}
initial.wider = GEOM.wider;
// before the page is measured: the Lombards of every initial on it
initial.load = () => typeof document === 'undefined' ? null : loadLetters([...document.querySelectorAll('.ini')].map(e => letterOf(e.textContent)));

// ---- the wayfinding ------------------------------------------------------------------------------------------------------------
// The paraph is the Decretals' (kit/wayfinding.js, approved in 06). The fillers are 06's, and the pendant chain: a
// hairline with small closed loops hung under it, a point in each, as a bundle's edge is strung in 466773.
const FILLERS = [...wFillers, 'pendants'];
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5, v) {
  if (kind !== 'pendants') return wFiller(x0, x1, yTop, yBase, kind, seed, rich, v);
  const r = stream(seed, 'pend'), h = yBase - yTop, y = yTop + h * .3, n = Math.max(1, Math.round((x1 - x0) / (h * 1.05))), p = (x1 - x0) / n, out = [];
  out.push(hair(wander([[x0, y], [x1, y + (r() - .5) * .3]], .15, seed + 3, 30), 'a', { end: 'cut' }));
  for (let k = 0; k < n; k++) { const R = h * .27 * (.92 + r() * .14), c = [x0 + (k + .5) * p + (r() - .5) * .3, y + R * 1.02], a0 = -Math.PI / 2;
    out.push(hair(arc(c, R, a0, a0 + Math.PI * 2.08, 22), rich >= .75 && k % 2 ? 'b' : 'a', { w: .46, start: 'cut', end: 'cut' }));
    if (rich >= .25) out.push(bead([c[0], c[1] + R * .12], .62, rich >= .5 ? 'b' : 'a')); }
  return out;
}
const pickKinds = (r, all, min) => { const k = [...all].sort(() => r() - .5); return k.slice(0, Math.max(min, Math.round(min + r() * (all.length - min)))); };

// ---- the breaks ------------------------------------------------------------------------------------------------------------------
// A chapter: the end of a chant on its stave. Four red rules, a C clef and the last notes in black square notation, the
// finalis (the double bar) across the rules; on a richer page the rules' ends turned over in blue with a bead. The rank
// is the size of the division: a book takes 06's great device (an eye with scalloped arms).
const RED = [200, 66, 40], RED_HAIR = [212, 100, 74];
const note = (x, y, s) => ({ col: 'k', broad: .9, nib: 0, w: s, load: 1.15, dry: .08, swell: .05, start: 'cut', end: 'cut', pts: [[x, y - s * .42], [x, y + s * .42]] });
function stave(cx, y, measure, seed, rich, u) {
  const r = stream(seed, 'stave'), sp = u * .74, W = Math.min(measure * .4, u * 19), x0 = cx - W / 2, x1 = cx + W / 2, out = [], ly = k => y + (k - 1.5) * sp;
  for (let k = 0; k < 4; k++) out.push({ ...hair(wander([[x0, ly(k)], [x1, ly(k) + (r() - .5) * .3]], .1, seed + k, 40), 'a', { w: .5, start: 'cut', end: 'cut' }), ink: RED_HAIR });
  const s = sp * .86, at = (x, step) => [x, ly(3) - step * sp / 2];   // step: half-spaces up from the bottom rule
  // the C clef on the second rule from the top: two squares on a short stem
  const cy = ly(1), cxL = x0 + u * .55;
  out.push({ col: 'k', broad: .9, nib: 0, w: u * .1, load: 1.1, dry: .08, swell: 0, start: 'cut', end: 'cut', pts: [[cxL - s * .42, cy - sp * .9], [cxL - s * .42, cy + sp * .9]] });
  out.push(note(cxL, cy - sp * .5, s * .62), note(cxL, cy + sp * .5, s * .62));
  // the last notes: a short cadence falling to the final, set out along the rules
  const steps = [5, 4, 5, 3, 2, 2], xs = steps.map((_, k) => x0 + u * 2.2 + k * (W - u * 4.6) / (steps.length + .5));
  steps.forEach((st, k) => { const [x, yy] = at(xs[k], st + (r() < .15 ? 1 : 0) * 0); out.push(note(x, yy, s)); });
  // the finalis: a double bar across the rules, the second heavier
  for (const [dx, w] of [[-u * .5, u * .1], [-u * .22, u * .16]]) out.push({ col: 'k', broad: .9, nib: 0, w, load: 1.1, dry: .08, swell: 0, start: 'cut', end: 'cut', pts: [[x1 + dx, ly(0) - .4], [x1 + dx, ly(3) + .4]] });
  // the rubricator's points beyond its ends; on a richer page a blue eye at each
  for (const s0 of [-1, 1]) { const px = (s0 < 0 ? x0 : x1) + s0 * u * .9;
    if (rich >= .5) out.push(hair(arc([px, y], u * .3, 0, 2 * Math.PI + .15, 18), 'b', { w: .46, start: 'cut', end: 'cut' }), bead([px, y], .9, 'b'));
    else out.push(bead([px, y], 1.2, 'b')); }
  return out;
}
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8) {
  return rank < 2 ? stave(cx, y, measure, seed, rich, u) : wBreak(cx, y, measure, rank, seed, rich, u, true);
}

// ---- frames ----------------------------------------------------------------------------------------------------------------------
// 07's (approved), and for a quotation the column of 466773: a bundle of hairlines down its gutter, capped by a dome with
// an eye in it whose feet curl out, its foot turned over, pendants and scallops down its outer side.
function columnFrame({ x, lines, u, g = 2.4, seed, rich = .5 }) {
  const r = stream(seed, 'column'), out = [], y0 = lines[0].top + u * .2, y1 = lines.at(-1).base + u * .35, n = rich >= .5 ? 3 : 2, xs = Array.from({ length: n }, (_, k) => x - k * g * 1.05);
  xs.forEach((xk, k) => out.push(hair(wander([[xk, y0 + g * .6], [xk + (r() - .5) * .4, y1 - (k ? g * (1 + r()) : 0)]], .22, seed + k, 40), 'a', { w: k ? .48 : .56, start: 'cut', end: k ? 'taper' : 'cut' })));
  out.push(hair(hook([x, y1], Math.PI / 2, u * .42, 1), 'a', { end: 'ball' }));
  // the capital
  const cx0 = xs.at(-1) - g * 1.1, cx1 = x + g * 1.1, span = cx1 - cx0, mid = (cx0 + cx1) / 2, rise = span * .48, base = y0;
  out.push(hair(Array.from({ length: 25 }, (_, k) => [cx0 + span * k / 24, base - rise * Math.pow(Math.sin(Math.PI * k / 24), .8)]), 'a', { w: .5, start: 'cut', end: 'cut' }));
  out.push(hair([[cx0 + g * .2, base], [cx1 - g * .2, base]], 'a', { w: .45, start: 'cut', end: 'cut' }));
  const R = Math.min(rise * .3, span * .2); out.push(hair(arc([mid, base - rise * .44], R, 0, 2 * Math.PI + .2, 24), 'b', { w: .46, start: 'cut', end: 'cut' }), bead([mid, base - rise * .44], Math.max(.7, R * .3), 'b'));
  out.push(hair(hook([cx0, base], Math.PI * 1.15, g * .9, 1), 'a', { end: 'ball' }), hair(hook([cx1, base], -.1, g * .9, -1), 'a', { end: 'ball' }));
  // pendants and scallops down the outer side
  if (rich >= .25) { const xo = xs.at(-1), step = g * 3.2;
    for (let yy = y0 + g * 3, k = 0; yy < y1 - g * 3; yy += step, k++) { const pr = g * .7;
      if (k % 2 === 0 || rich < .5) out.push(hair(arc([xo - pr * 1.02, yy], pr, 0, Math.PI * 2.08, 20), k % 4 === 0 && rich >= .75 ? 'b' : 'a', { w: .44, start: 'cut', end: 'cut' }), bead([xo - pr * 1.1, yy], .6, 'b'));
      else out.push(hair(arc([xo - g * .38, yy], g * .85, Math.PI - 2.05, Math.PI + 2.05, 12), 'a', { w: .46, end: 'cut' })); } }
  return out;
}
const pullFrame = ({ cx, yTop, yBot, measure, u, seed, rich = .5 }) => [...breakMark(cx, yTop, measure, 1, seed, rich, u), ...breakMark(cx, yBot, measure, 1, seed + 7, rich, u)];
const frames = { quote: columnFrame, figure: figureFrame, code: codeFrame, pull: pullFrame, aside: asideFrame, nav: navFrame };

// ---- the style -------------------------------------------------------------------------------------------------------------------
export const choirbook = { label: 'Choir book', pair: ['red', 'blue'], alternate: true, minGap: 1.4,
  // vermilion and azurite as 03 had them; the notes in the book's brown-black
  ink: { red: { solid: [200, 66, 40], hair: RED_HAIR }, blue: { solid: [40, 70, 160], hair: [56, 84, 166] }, black: { solid: [44, 34, 27], hair: [58, 46, 36] } },
  inkDark: { red: { solid: [214, 88, 60], hair: [226, 118, 94] }, blue: { solid: [70, 108, 206], hair: [120, 150, 228] }, black: { solid: [222, 212, 196], hair: [214, 204, 188] } },
  setup: seed => { const r = stream(seed, 'choirbook'); return { kinds: pickKinds(r, FILLERS, 3) }; },
  kinds: (v, rich) => rich < .25 ? ['beads'] : rich < .5 ? ['beads', 'pendants'] : v.kinds,
  paraph: (x, base, u, seed, rich) => wParaph(x, base, u, seed, rich),
  filler, breakMark, initial, frames };
STYLES.choirbook = choirbook;
export default choirbook;
