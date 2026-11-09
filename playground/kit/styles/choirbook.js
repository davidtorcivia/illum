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
// The letter is George Williams' Lombardic painted by the hand of one rubricator (Free Library of Philadelphia, Lewis E 73, a
// Gradual, Bologna?, c. 1425; tools/lombhand.py), one small webfont per letter; the box round it is the filigree grown in its
// gaps (filigrana: contained, then filled by each bay's shape; research/17 §4i); EB Garamond if a face is missing.
//
// Marks are the registry's: strokes { pts, col, w, start, end, load, dry, broad, swell, nib, ink? } and points
// { dot, p, r, col, ink? }; col 'a' | 'b' (red and blue in turn), 'k' the notes' black.
import { tendril, resample, stream, noise1, noise2, PIGMENTS } from '../marks.js';
import { edt } from '../penwork.js';
import { poisson } from '../spray.js';
import { STYLES, wander, hair } from '../wayfinding.js';

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
// (reach: how far a stamp need write; every query of the field compares it with less than that, so the decisions are the
// same as a stamp to the cap, at a twentieth of the cost)
function clearance(x0, y0, w, h, blocked, cap, reach = cap) {
  const C = edt(blocked, w, h); for (let i = 0; i < C.length; i++) C[i] = Math.min(cap, C[i]);
  const get = (x, y) => { const i = Math.round(x - x0), j = Math.round(y - y0); return i < 0 || j < 0 || i >= w || j >= h ? 0 : C[j * w + i]; };
  const stamp = (pts, R = reach) => { for (const [px, py] of resample(pts, .8)) {
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
  // (the hand leaves a joint thin, sometimes a hair open: a counter is closed for this by the letter grown a few percent of
  // its height, and the joint is painted with it)
  const { w, h, x0, y0, res } = L0, out0 = new Uint8Array(w * h), st = [];
  const ink0 = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) ink0[k] = L0.M[k] > .5; const Dg = edt(ink0, w, h); let rows = [h, 0];
  for (let k = 0; k < w * h; k++) if (L0.M[k] > .5) { const j = k / w | 0; rows = [Math.min(rows[0], j), Math.max(rows[1], j)]; }
  const grow = (rows[1] - rows[0]) * .06, grown = k => Dg[k] <= grow;
  for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x); for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
  while (st.length) { const i = st.pop(); if (out0[i] || grown(i)) continue; out0[i] = 1; const x = i % w; if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (i >= w) st.push(i - w); if (i < w * (h - 1)) st.push(i + w); }
  const Dout = edt(out0, w, h), pan = new Uint8Array(w * h), M = Float32Array.from(L0.M);   // (the outside grown back by as much)
  for (let k = 0; k < w * h; k++) if (L0.M[k] <= .5 && Dout[k] > grow + 1) pan[k] = 1;
  // a panel is a counter, not a crevice the growing closed (a notch between two feet): under ~1/9 of the height square, dropped
  { const seen = new Uint8Array(w * h), min = ((rows[1] - rows[0]) * .11) ** 2;
    for (let s = 0; s < w * h; s++) { if (!pan[s] || seen[s]) continue; const comp = [], st2 = [s]; seen[s] = 1;
      while (st2.length) { const i = st2.pop(); comp.push(i); const x = i % w; for (const q of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) if (q >= 0 && q < w * h && pan[q] && !seen[q]) { seen[q] = 1; st2.push(q); } }
      if (comp.length < min) for (const i of comp) pan[i] = 0; else for (const i of comp) M[i] = 1; } }
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
  const rMax = H * .1;   // (467763's P: roundels ~1/9 of the height; calm, not a froth of small rings)
  for (const k of cells) { const c = [x0 + (k % w + .5) / res, y0 + ((k / w | 0) + .5) / res], R = Math.min(rMax, inner(k) - .1); if (R < Math.max(1.6, H * .035)) continue;
    if (got.some(g => Math.hypot(g.c[0] - c[0], g.c[1] - c[1]) < g.R + R + gp * 1.6 + lw)) continue; got.push({ c, R }); }
  for (const { c, R } of got) {
    ring(c, R - lw / 2, lw); let ri = R - lw / 2;
    if (R >= 3.6) { ri = R - lw * 1.5 - gp; ring(c, ri, lw * .9); }
    const dr = Math.max(.55, ri * .28), a0 = r() * 2 * Math.PI;
    if (ri - lw >= dr * 2.2) for (let q = 0; q < 3; q++) { const a = a0 + q * 2 * Math.PI / 3, p = [c[0] + Math.cos(a) * dr * 1.2, c[1] + Math.sin(a) * dr * 1.2]; point(p, dr); if (dr >= .8) reds.push({ p, r: Math.max(.6, dr * .55) }); }
    else point(c, Math.max(.55, Math.min(dr * 1.3, ri - lw))); }
  // small points between the roundels
  const n0 = got.length;
  for (const k of cells) { if (r() > .12) continue; const c = [x0 + (k % w + .5) / res, y0 + ((k / w | 0) + .5) / res], pr = Math.max(.5, lw * .72);
    if (inner(k) < pr + .6 || got.some(g => Math.hypot(g.c[0] - c[0], g.c[1] - c[1]) < g.R + pr + gp * 2.2)) continue; point(c, pr); got.push({ c, R: pr }); }
  const out = new Float32Array(w * h); for (let k = 0; k < w * h; k++) out[k] = M[k] * (1 - cut[k]);
  return { M: { ...L, M: out }, full: L, marks, reds };
}

// ---- the work in the letter's box (Lewis E 73's rubricator, research/17 §4e–f) ---------------------------------------------------
// Measured on his letters at full size (tools/penmeasure.py): inside the letter's box, about 14 % of the free parchment is
// hairline (B .137, D .153, O .160), the paper between neighbouring hairlines a fairly even ~.044 of the letter's height
// (median; quartiles .02–.07: the box is worked edge to edge, nothing left bare), the hairline itself ~.01 of the height.
// His primitive is a FIELD, not motifs on bare ground: every bay is filled with hairlines run parallel to its edges, close
// and even (the echo of the letter's own edge, and of the box's), tied across by short rungs (his ladders) and fringed
// against the paint; then motifs are carved out of that field where a bay is deep enough: a rosette (an eye ringed by
// teardrop petals) or a scroll. Round the box, his frame: a hairline with spikes radiating from it, each spike ending in a
// small hook (as every free end of his ends), a curl at each corner. Seeded, so no two drops are worked alike.
// The field's lines are the level sets of each bay's distance to its own edge (marching squares on the cell grid), chained
// into polylines. Returns hairline strokes in page px.
export function counterWork(L, seed, g = 2.6, keep = []) {
  const { M, w, h, x0, y0, res } = L, ink = new Uint8Array(w * h); let bx0 = w, by0 = h, bx1 = 0, by1 = 0;
  for (let k = 0; k < w * h; k++) if (M[k] > .5) { ink[k] = 1; const i = k % w, j = k / w | 0; bx0 = Math.min(bx0, i); bx1 = Math.max(bx1, i); by0 = Math.min(by0, j); by1 = Math.max(by1, j); }
  const H = (by1 - by0) / res, r = stream(seed, 'counters'), out = [], Din = edt(ink, w, h);
  const sp = Math.max(1.9, H * .044), LW = .3;   // his spacing (px) and hairline (the writer makes ~.5 px of a .3 width)
  const P = k => [x0 + (k % w + .5) / res, y0 + ((k / w | 0) + .5) / res];
  const inWords = (x, y) => keep.some(k => x >= k[0] - 1 && x <= k[2] + 1 && y >= k[1] - 1 && y <= k[3] + 1);
  const wob = pts => { const n = noise1((seed * 13 + out.length) | 0); return pts.map((p, i) => [p[0] + (n(i * .17) - .5) * .22, p[1] + (n(i * .17 + 40) - .5) * .22]); };
  const hair = (pts, o = {}) => { if (pts.length > 1) out.push({ pts: wob(pts), kind: 'cw', w: LW, start: 'cut', end: 'cut', ...o }); };
  // a free end drawn on into a small hook (his pearls and balls are the pen turning back, not a stamped point)
  const hookEnd = (p, a, R, sg) => { const pts = []; for (let k = 0; k <= 14; k++) { const t = k / 14 * Math.PI * 1.7; pts.push([p[0] + R * (Math.cos(a + sg * Math.PI / 2) * -1 + Math.cos(a + sg * Math.PI / 2 - sg * t)) , p[1] + R * (Math.sin(a + sg * Math.PI / 2) * -1 + Math.sin(a + sg * Math.PI / 2 - sg * t))]); } return pts; };
  const fb = [x0 + bx0 / res - sp * .9, y0 + by0 / res - sp * .9, x0 + (bx1 + 1) / res + sp * .9, y0 + (by1 + 1) / res + sp * .9];
  // the bays: the box less the letter (kept a hair off the paint) and less the words
  const off = sp * .45 * res, bay = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = j * w + i, [x, y] = P(k); if (!ink[k] && Din[k] > off && x > fb[0] && x < fb[2] && y > fb[1] && y < fb[3] && !inWords(x, y)) bay[k] = 1; }
  const notBay = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) notBay[k] = !bay[k];
  const Db = edt(notBay, w, h);   // cells; each bay cell's distance to its bay's edge
  const lab = new Int32Array(w * h), comps = [];
  for (let s0 = 0; s0 < w * h; s0++) { if (!bay[s0] || lab[s0]) continue; const id = comps.length + 1, st = [s0]; let n = 0, best = s0; lab[s0] = id;
    while (st.length) { const k = st.pop(); n++; if (Db[k] > Db[best]) best = k; const i = k % w; for (const q of [i > 0 ? k - 1 : -1, i < w - 1 ? k + 1 : -1, k - w, k + w]) if (q >= 0 && q < w * h && bay[q] && !lab[q]) { lab[q] = id; st.push(q); } }
    comps.push({ id, n, best, rad: Db[best] / res }); }
  // 1. motifs first (the field is carved round them): a rosette in a deep bay, a scroll in a long one
  const holes = [];
  for (const c of comps) { if (c.rad < sp * 2.6) continue; const ctr = P(c.best), Rm = Math.min(c.rad - sp * .6, sp * 3.6);
    if (r() < .75 || c.rad > sp * 4) { holes.push({ c: ctr, R: Rm + sp * .45 });
      const re = sp * .55, a0 = r() * 6.28; const ring = []; for (let k = 0; k <= 22; k++) { const a = a0 + k / 22 * 2.05 * Math.PI; ring.push([ctr[0] + Math.cos(a) * re, ctr[1] + Math.sin(a) * re]); } hair(ring);
      const ring2 = []; for (let k = 0; k <= 30; k++) { const a = a0 + k / 30 * 2.05 * Math.PI; ring2.push([ctr[0] + Math.cos(a) * (re + sp * .55), ctr[1] + Math.sin(a) * (re + sp * .55)]); } hair(ring2);
      const np = 6 + ((r() * 3) | 0);
      for (let k = 0; k < np; k++) { const a = a0 + (k + (r() - .5) * .2) / np * 2 * Math.PI, d = [Math.cos(a), Math.sin(a)], nn = [-d[1], d[0]], base = re + sp * .7, len = (Rm - base) * (.8 + r() * .2), wd = len * (.32 + r() * .08), pts = [];
        for (let q = 0; q <= 26; q++) { const t = q / 26 * 2 * Math.PI, s2 = (1 - Math.cos(t)) / 2, side = Math.sin(t); pts.push([ctr[0] + d[0] * (base + len * s2) + nn[0] * wd * side * Math.sin(Math.PI * s2) ** .75, ctr[1] + d[1] * (base + len * s2) + nn[1] * wd * side * Math.sin(Math.PI * s2) ** .75]); }
        hair(pts); if (len > sp * 1.6) { const mid = []; for (let q = 0; q <= 8; q++) { const t = q / 8; mid.push([ctr[0] + d[0] * (base + len * .15 + len * .6 * t), ctr[1] + d[1] * (base + len * .15 + len * .6 * t)]); } hair(mid, { end: 'taper' }); } } }
    else { holes.push({ c: ctr, R: Rm * .9 + sp * .4 });   // a scroll: a spiral rolled in from the hole's edge, its end hooked
      const pts = [], turns = 2.2, a0 = r() * 6.28, sg = r() < .5 ? -1 : 1; for (let k = 0; k <= 160; k++) { const t = k / 160, a = a0 + sg * t * turns * 2 * Math.PI, rr = Rm * .9 * (1 - t * .82); pts.push([ctr[0] + Math.cos(a) * rr, ctr[1] + Math.sin(a) * rr]); } hair(pts, { end: 'taper' }); } }
  const carved = (x, y) => holes.some(o => Math.hypot(x - o.c[0], y - o.c[1]) < o.R);
  // 2. the field: lines parallel to every bay's edges at his spacing (level sets of Db), cut where a motif is carved
  const F = (i, j) => (i < 0 || j < 0 || i >= w || j >= h || !bay[j * w + i]) ? -1 : Db[j * w + i] / res;
  const levels = []; for (let v = sp * .5; v < H * .4; v += sp * (.92 + r() * .16)) levels.push(v);
  const key = (x, y) => Math.round(x * 64) + ',' + Math.round(y * 64);
  for (const v of levels) {
    const segs = [];
    for (let j = by0 - 8 * res; j < by1 + 8 * res; j++) for (let i = bx0 - 8 * res; i < bx1 + 8 * res; i++) {
      const a = F(i, j), b = F(i + 1, j), c = F(i + 1, j + 1), d = F(i, j + 1); if (a < 0 && b < 0 && c < 0 && d < 0) continue;
      const cs = [[i, j, a], [i + 1, j, b], [i + 1, j + 1, c], [i, j + 1, d]], pts = [];
      for (let e = 0; e < 4; e++) { const [ix, iy, va] = cs[e], [jx, jy, vb] = cs[(e + 1) % 4]; if ((va >= v) !== (vb >= v)) { const t = (v - va) / (vb - va); pts.push([ix + (jx - ix) * t, iy + (jy - iy) * t]); } }
      if (pts.length === 2) segs.push(pts); else if (pts.length === 4) segs.push([pts[0], pts[1]], [pts[2], pts[3]]); }
    // chain the segments into lines
    const ends = new Map(); segs.forEach((sg, n) => { for (const e of [0, 1]) { const k2 = key(...sg[e]); ends.has(k2) || ends.set(k2, []); ends.get(k2).push(n); } });
    const done = new Uint8Array(segs.length);
    for (let n = 0; n < segs.length; n++) { if (done[n]) continue; done[n] = 1; let line = [segs[n][0], segs[n][1]];
      for (const dir of [1, 0]) { for (;;) { const tip = dir ? line.at(-1) : line[0], nx = (ends.get(key(...tip)) ?? []).find(m => !done[m]); if (nx === undefined) break; done[nx] = 1;
          const sg = segs[nx], other = key(...sg[0]) === key(...tip) ? sg[1] : sg[0]; dir ? line.push(other) : line.unshift(other); } }
      // to page px, cut where carved, resampled
      let run = []; const flush = () => { if (run.length > 3 && arclen(run) > sp * 1.2) hair(resample(run, .6)); run = []; };
      for (const [i, j] of line) { const x = x0 + (i + .5) / res, y = y0 + (j + .5) / res; if (carved(x, y)) flush(); else run.push([x, y]); } flush(); } }
  // 3. the ladders: short rungs across between neighbouring field lines, and a fringe of ticks against the paint
  for (const c of comps) { if (c.rad < sp * .9) continue; }
  for (let j = by0; j < by1; j += Math.max(2, Math.round(sp * 1.25 * res))) for (let i = bx0 - 6 * res; i < bx1 + 6 * res; i += Math.max(2, Math.round(sp * 1.25 * res))) {
    const k = j * w + i; if (i < 0 || i >= w || !bay[k]) continue; const v = Db[k] / res; if (v < sp * .55 || v > sp * 1.45) continue; const [x, y] = P(k); if (carved(x, y)) continue;
    // the fringe: a tick from the first field line toward the paint (the gradient of Db points inward; toward the paint is
    // toward the nearest ink, read from Din)
    const gx = (Din[k + 1] ?? 0) - (Din[k - 1] ?? 0), gy = (Din[k + w] ?? 0) - (Din[k - w] ?? 0), gl = Math.hypot(gx, gy) || 1; if (r() < .25) continue;
    hair([[x, y], [x - gx / gl * sp * .55, y - gy / gl * sp * .55]], { end: 'taper' }); }
  // 4. the frame: a hairline round the box, spikes radiating from it each ending in a little hook, a curl at each corner
  { const side = (a, b, nrm) => { const pts = []; for (let t = 0; t <= 1.0001; t += .02) { const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; if (!inWords(p[0], p[1])) pts.push(p); else { if (pts.length > 3) hair(pts.splice(0)); else pts.length = 0; } }
        if (pts.length > 3) hair(pts);
        const L2 = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L2 / (sp * 1.15));
        for (let k = 1; k < n; k++) { const t = k / n, p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], ln = sp * (k % 2 ? .8 : 1.3) * (.85 + r() * .3), e = [p[0] + nrm[0] * ln, p[1] + nrm[1] * ln];
          if (inWords(e[0], e[1]) || inWords(p[0], p[1])) continue; const an = Math.atan2(nrm[1], nrm[0]); hair([p, e, ...hookEnd(e, an, sp * .22, k % 2 ? 1 : -1).slice(1)]); } };
    const [X0, Y0, X1, Y1] = fb; side([X0, Y0], [X1, Y0], [0, -1]); side([X0, Y1], [X1, Y1], [0, 1]); side([X1, Y0], [X1, Y1], [1, 0]);
    for (const [cx, cy, sx, sy] of [[X0, Y0, -1, -1], [X1, Y0, 1, -1], [X0, Y1, -1, 1], [X1, Y1, 1, 1]]) { if (inWords(cx + sx * sp, cy + sy * sp)) continue;
      const pts = []; for (let k = 0; k <= 28; k++) { const t = k / 28, R = sp * 1.1 * (1 - t * .6), a = Math.atan2(sy, sx) - sx * sy * t * Math.PI * 1.6; pts.push([cx + sx * sp * .5 * t + Math.cos(a) * R * t, cy + sy * sp * .5 * t + Math.sin(a) * R * t]); }
      hair(pts, { end: 'taper' }); } }
  return out;
}

// ---- the hand's vocabulary (lifted from the grown filigree below, so the page's marks are made by the same code) ----------------
const bez = (A, B, C, D, u) => { const v = 1 - u; return [v * v * v * A[0] + 3 * v * v * u * B[0] + 3 * v * u * u * C[0] + u * u * u * D[0], v * v * v * A[1] + 3 * v * v * u * B[1] + 3 * v * u * u * C[1] + u * u * u * D[1]]; };
// one scroll from anchor a to curl round c: leave the parent at an easy angle toward c, bend steadily, enter a circle
// round c along its own direction and wind in a turn, the radius closing as a pen's spiral does
// (want: the way its curl turns, +1 or -1, when the work asks for it; else the way it bends already)
// (a: { p, t } the place it leaves its parent and the parent's way there; c the centre it curls round; rho the curl's radius; r
// the hand's stream; sp his spacing)
export function scrollPts(a, c, rho, want, r, sp) {
  const v = [c[0] - a.p[0], c[1] - a.p[1]], dl = Math.hypot(...v), u = [v[0] / dl, v[1] / dl];
  let t = a.t[0] * u[0] + a.t[1] * u[1] >= 0 ? a.t : [-a.t[0], -a.t[1]];
  const side = Math.sign(t[0] * u[1] - t[1] * u[0]) || 1, off = .45 + r() * .25;   // (leaves its parent 25-40 degrees out, toward c)
  const d0 = [t[0] * Math.cos(off * side) - t[1] * Math.sin(off * side), t[0] * Math.sin(off * side) + t[1] * Math.cos(off * side)];
  const bend = Math.sign(d0[0] * u[1] - d0[1] * u[0]) || side, turn = want || bend, n = [-u[1], u[0]], E = [c[0] - turn * rho * n[0], c[1] - turn * rho * n[1]];
  const L = Math.hypot(E[0] - a.p[0], E[1] - a.p[1]); if (L < sp * .4) return null;
  const B = [a.p[0] + d0[0] * L * .4, a.p[1] + d0[1] * L * .4], C = [E[0] - u[0] * L * .35, E[1] - u[1] * L * .35], pts = [];
  const nb = Math.max(4, Math.ceil(L / .5)); for (let k = 0; k <= nb; k++) pts.push(bez(a.p, B, C, E, k / nb));
  const th0 = Math.atan2(E[1] - c[1], E[0] - c[0]), sweep = (1.05 + r() * .35) * 2 * Math.PI, ns = Math.ceil(sweep * rho / .45);
  for (let k = 1; k <= ns; k++) { const f = k / ns, th = th0 + turn * sweep * f, rr = rho * (1 - .62 * f ** 1.2); pts.push([c[0] + Math.cos(th) * rr, c[1] + Math.sin(th) * rr]); }
  return pts;
}
// a fleuron: a spike with a pair of small scrolls springing from its foot and turning back toward where it stands (his finials,
// and at the corners his diagonal sprays): the spike, then the two scrolls
export function fleuronPts(p, d, ln, sp) { const tg = [-d[1], d[0]], tip = [p[0] + d[0] * ln, p[1] + d[1] * ln], rr = Math.min(sp * .55, ln * .26), out = [[p, [p[0] + d[0] * ln * .55 + tg[0] * .12, p[1] + d[1] * ln * .55 + tg[1] * .12], tip]];
  for (const sg of [-1, 1]) { const c2 = [p[0] + d[0] * ln * .3 + tg[0] * sg * rr * 1.05, p[1] + d[1] * ln * .3 + tg[1] * sg * rr * 1.05], a0 = Math.atan2(-tg[1] * sg, -tg[0] * sg), tw = Math.sign(d[0] * tg[1] * sg - d[1] * tg[0] * sg) || 1, pts = [];
    for (let q = 0; q <= 30; q++) { const f = q / 30, th = a0 + tw * f * Math.PI * 1.55, R = rr * (1 - .5 * f); pts.push([c2[0] + Math.cos(th) * R, c2[1] + Math.sin(th) * R]); }
    out.push(pts); }
  return out;
}

// ---- the filigree, grown (third pass: "paint the ground, apply the letter, grow in the gaps") --------------------------------------
// Read at 4x in his B and P (Lewis E 73): every bay of the letter's box is first CONTAINED (a double hairline a gap off
// the paint, running on round the inside of the box, so the frame and the letter's echo are one line), then FILLED by
// its shape: a round counter gets an eye (a ring, its point) with spokes radiating from it to the contour, and small
// scrolls branching off the spokes into the sectors; a broad bay gets scrolls branching off its contour; a channel too
// narrow for scrolls a string of pearls (small rings) down its middle. Round the box, the frame's outer side: pearls set
// on it and spikes radiating between them, a taller finial at the middle of the top and the foot. Everything is a pen
// line: no stamped dot but the eye's point. Each scroll is one stroke leaving its parent at an easy angle, bending
// steadily and winding in at its end, its curvature continuous (a Bezier run into a spiral of the same sense); it may
// branch off a scroll laid before it (the growth's hierarchy: contour, spokes, scrolls, scrollets). Spacing is his
// (research/17 §4f: the gap between neighbouring hairlines a median ~.044 H): sp = .05 H, a pen a hairline of ~.01 H.
// The only raster is the clearance field (the bay's distance to its edge), which the growth steers by.
// Returns strokes in page px in the order a hand would write them, and the eyes' points ({ kind: 'dot' }).
// the middle lines of a mask (a bay's core), as polylines in page px: the mask at one cell a px, thinned (Zhang and Suen
// 1984), its pixel graph cut at forks and ends into runs, the spurs (a run ending free, shorter than `spur`) pruned twice
function middles({ M, w, h, x0, y0, res }, spur) {
  const s = Math.max(1, Math.round(res)), W = Math.ceil(w / s) + 2, H = Math.ceil(h / s) + 2, B = new Uint8Array(W * H);
  for (let J = 1; J < H - 1; J++) for (let I = 1; I < W - 1; I++) { const i = Math.min(w - 1, (I - 1) * s + (s >> 1)), j = Math.min(h - 1, (J - 1) * s + (s >> 1)); B[J * W + I] = M[j * w + i] > .5 ? 1 : 0; }
  const nb = k => [B[k - W], B[k - W + 1], B[k + 1], B[k + W + 1], B[k + W], B[k + W - 1], B[k - 1], B[k - W - 1]];
  for (let changed = true; changed;) { changed = false;
    for (const step of [0, 1]) { const del = [];
      for (let J = 1; J < H - 1; J++) for (let I = 1; I < W - 1; I++) { const k = J * W + I; if (!B[k]) continue; const n = nb(k), b = n.reduce((a, v) => a + v, 0); if (b < 2 || b > 6) continue;
        let a = 0; for (let q = 0; q < 8; q++) if (!n[q] && n[(q + 1) % 8]) a++; if (a !== 1) continue;
        if (step === 0 ? (n[0] * n[2] * n[4] || n[2] * n[4] * n[6]) : (n[0] * n[2] * n[6] || n[0] * n[4] * n[6])) continue; del.push(k); }
      for (const k of del) B[k] = 0; if (del.length) changed = true; } }
  const N8 = [-W, -W + 1, 1, W + 1, W, W - 1, -1, -W - 1], deg = k => N8.reduce((a, d) => a + B[k + d], 0);
  const trace = () => { const runs = [], seen = new Set(), ek = (a, b) => a < b ? a + ',' + b : b + ',' + a;
    const nodes = []; for (let k = 0; k < W * H; k++) if (B[k] && deg(k) !== 2) nodes.push(k);
    for (const k0 of nodes) for (const d of N8) { const k1 = k0 + d; if (!B[k1] || seen.has(ek(k0, k1))) continue; const run = [k0, k1]; seen.add(ek(k0, k1)); let prev = k0, cur = k1;
      while (deg(cur) === 2) { const nx = N8.map(e => cur + e).find(q => B[q] && q !== prev && !seen.has(ek(cur, q))); if (nx === undefined) break; seen.add(ek(cur, nx)); run.push(nx); prev = cur; cur = nx; }
      runs.push(run); }
    return runs; };
  for (let pass = 0; pass < 2; pass++) for (const run of trace()) { const a = run[0], b = run.at(-1), free = deg(a) === 1 || deg(b) === 1;
    if (free && run.length < spur) for (const k of run) if (deg(k) <= 2) B[k] = 0; }
  return trace().filter(r => r.length > 2).map(r => r.map(k => [x0 + (((k % W) - 1) * s + s / 2) / res, y0 + ((((k / W) | 0) - 1) * s + s / 2) / res]));
}
// the box's margins round the letter's ink, [left, top, right, bottom] in px (his B: the frame stands off the letter most on
// the left, where the drops of its serifs reach, least on the right and the top)
export const boxMargins = H => { const sp = Math.max(1.7, H * .05); return [sp * 1.1, sp * .7, sp * .75, sp * .9]; };
// (the work is laid out on a grid of 2 cells a px: the letter's mask, made at 4, averaged down; its lines are smoothed after)
const halve = L => { if (L.res <= 2.5) return L; const w = L.w >> 1, h = L.h >> 1, M = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = 2 * j * L.w + 2 * i; M[j * w + i] = (L.M[k] + L.M[k + 1] + L.M[k + L.w] + L.M[k + L.w + 1]) / 4; }
  return { ...L, M, w, h, res: L.res / 2 }; };
const FCACHE = new Map();
export function filigrana(L0, seed, keep = [], level = 2, o = {}) {
  // (only the words near the letter: nothing it lays reaches 40 px past its grid)
  { const X0 = L0.x0 - 40, Y0 = L0.y0 - 40, X1 = L0.x0 + L0.w / L0.res + 40, Y1 = L0.y0 + L0.h / L0.res + 40; keep = keep.filter(k => k[2] > X0 && k[0] < X1 && k[3] > Y0 && k[1] < Y1); }
  // (cached per letter, seed, size and the words' places round it: a resize that leaves the drop as it was re-lays nothing)
  const key = [L0.w, L0.h, L0.x0.toFixed(1), L0.y0.toFixed(1), seed, level, !!o.open, keep.map(k => k.map(v => v.toFixed(0)).join(',')).join(';')].join('|');
  if (FCACHE.has(key)) return FCACHE.get(key);
  const res0 = filigrana1(halve(L0), seed, keep, level, o); if (FCACHE.size > 64) FCACHE.clear(); FCACHE.set(key, res0); return res0;
}
function filigrana1(L, seed, keep = [], level = 2, o = {}) {
  const { M, w, h, x0, y0, res } = L, ink = new Uint8Array(w * h); let bx0 = w, by0 = h, bx1 = 0, by1 = 0;
  for (let k = 0; k < w * h; k++) if (M[k] > .5) { ink[k] = 1; const i = k % w, j = k / w | 0; if (i < bx0) bx0 = i; if (i > bx1) bx1 = i; if (j < by0) by0 = j; if (j > by1) by1 = j; }
  const H = (by1 - by0) / res, r = stream(seed, 'filigrana'), sp = Math.max(1.7, H * .05), LW = .24;   // (his hairline is finer and paler than 03's)
  const small = H < 60;   // (a phone's drop: his thinning rule, fewer and plainer parts)
  const out = { frame: [], spokes: [], scrolls: [], pearls: [], spikes: [], dots: [] };
  const Px = (i, j) => [x0 + (i + .5) / res, y0 + (j + .5) / res];
  const inWords = (x, y, m = 1) => keep.some(k => x >= k[0] - m && x <= k[2] + m && y >= k[1] - m && y <= k[3] + m);
  const wob = (pts, a = .18) => { const n = noise1((seed * 31 + pts.length * 7) | 0); return pts.map((p, i) => [p[0] + (n(i * .09) - .5) * a, p[1] + (n(i * .09 + 50) - .5) * a]); };
  const smooth = (p, closed, n = 4) => { let q = p; const m = q.length; for (let it = 0; it < n; it++) q = q.map((pt, i) => {
    if (!closed && (i === 0 || i === m - 1)) return pt; const a = q[closed ? (i - 1 + m) % m : i - 1], b = q[closed ? (i + 1) % m : i + 1]; return [(a[0] + 2 * pt[0] + b[0]) / 4, (a[1] + 2 * pt[1] + b[1]) / 4]; }); return q; };
  const stroke = (list, pts, extra = {}) => { if (pts.length > 1) list.push({ pts: wob(pts), kind: 'cw', w: LW, start: 'cut', end: 'cut', ...extra }); };
  // the frame: the letter's ink box, a little out (his frame is close: the serifs' drops reach it)
  const fm = boxMargins(H), fb = [x0 + bx0 / res - fm[0], y0 + by0 / res - fm[1], x0 + (bx1 + 1) / res + fm[2], y0 + (by1 + 1) / res + fm[3]];
  // the bays: the box less the letter (a gap off the paint) and less the words
  const Din = edt(ink, w, h), off = sp * .22 * res, bay = new Uint8Array(w * h);
  const words = new Uint8Array(w * h); for (const k of keep) { const i0 = Math.max(0, Math.floor((k[0] - 1 - x0) * res)), i1 = Math.min(w - 1, Math.ceil((k[2] + 1 - x0) * res)), j0 = Math.max(0, Math.floor((k[1] - 1 - y0) * res)), j1 = Math.min(h - 1, Math.ceil((k[3] + 1 - y0) * res));
    for (let j = j0; j <= j1; j++) words.fill(1, j * w + i0, j * w + i1 + 1); }
  const fi0 = Math.max(0, Math.ceil((fb[0] - x0) * res - .5)), fi1 = Math.min(w - 1, Math.floor((fb[2] - x0) * res - .5)), fj0 = Math.max(0, Math.ceil((fb[1] - y0) * res - .5)), fj1 = Math.min(h - 1, Math.floor((fb[3] - y0) * res - .5));
  for (let j = fj0; j <= fj1; j++) for (let i = fi0; i <= fi1; i++) { const k = j * w + i; if (!ink[k] && Din[k] > off && !words[k]) bay[k] = 1; }
  const notBay = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) notBay[k] = !bay[k];
  const Db = edt(notBay, w, h); for (let k = 0; k < w * h; k++) Db[k] /= res;   // (px from the bay's edge)
  const at = (x, y) => { const i = Math.round((x - x0) * res - .5), j = Math.round((y - y0) * res - .5); return i < 0 || j < 0 || i >= w || j >= h ? 0 : Db[j * w + i]; };
  const grad = (x, y) => { const e = .5, gx = at(x + e, y) - at(x - e, y), gy = at(x, y + e) - at(x, y - e), l = Math.hypot(gx, gy) || 1; return [gx / l, gy / l]; };
  // components (bays), each with its deepest cell and whether it is a closed counter (it never meets the frame)
  const lab = new Int32Array(w * h), comps = [];
  for (let s0 = 0; s0 < w * h; s0++) { if (!bay[s0] || lab[s0]) continue; const id = comps.length + 1, st = [s0]; let n = 0, best = s0, open = false; lab[s0] = id;
    while (st.length) { const k = st.pop(); n++; if (Db[k] > Db[best]) best = k; const i = k % w, j = k / w | 0, [x, y] = Px(i, j);
      if (x - fb[0] < 1.5 || fb[2] - x < 1.5 || y - fb[1] < 1.5 || fb[3] - y < 1.5) open = true;
      for (const q of [i > 0 ? k - 1 : -1, i < w - 1 ? k + 1 : -1, j > 0 ? k - w : -1, j < h - 1 ? k + w : -1]) if (q >= 0 && bay[q] && !lab[q]) { lab[q] = id; st.push(q); } }
    comps.push({ id, n, best, rad: Db[best], open, area: n / res / res }); }
  const compAt = (x, y) => { const i = Math.round((x - x0) * res - .5), j = Math.round((y - y0) * res - .5); return i < 0 || j < 0 || i >= w || j >= h ? 0 : lab[j * w + i]; };

  // occupancy: every laid line's points, in cells of sp, so a new line keeps its distance
  const occ = new Map(), OK = (i, j) => i * 7919 + j, occAdd = (pts, id) => { for (const p of resample(pts, .7)) { const k = OK(Math.floor(p[0] / sp), Math.floor(p[1] / sp)); (occ.get(k) ?? occ.set(k, []).get(k)).push([p[0], p[1], id]); } };
  const clear = (p, d, skip) => { const i0 = Math.floor(p[0] / sp), j0 = Math.floor(p[1] / sp), n = Math.ceil(d / sp);
    for (let i = i0 - n; i <= i0 + n; i++) for (let j = j0 - n; j <= j0 + n; j++) for (const q of occ.get(OK(i, j)) ?? []) if (!skip?.has(q[2]) && (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 < d * d) return false;
    return true; };
  // attach points: places a scroll may branch from (with the line's tangent), by bay
  const anchors = []; let nid = 0;
  const addAnchors = (pts, id, kind, depth) => { const q = resample(pts, sp * .5); q.forEach((p, i) => { if (i < 2 || i > q.length - 3) return; const a = q[i - 1], b = q[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    anchors.push({ p, t: [(b[0] - a[0]) / l, (b[1] - a[1]) / l], id, kind, depth, comp: compAt(p[0], p[1]) }); }); };

  // 1. CONTAINED: the double line round every bay (the level sets of the bay's depth), the frame's inner side with it
  const edges = [], v1 = sp * .15, v2 = sp * .62;   // (two lines a hair apart hug the letter a reserve off its paint, and run on as the frame's inner lines)
  const iso = v => { const segs = [], F = (i, j) => (i < 0 || j < 0 || i >= w || j >= h || !bay[j * w + i]) ? -1 : Db[j * w + i];
    for (let j = fj0 - 1; j <= fj1; j++) for (let i = fi0 - 1; i <= fi1; i++) { const a = F(i, j), b = F(i + 1, j), c = F(i + 1, j + 1), d = F(i, j + 1); if (a < v && b < v && c < v && d < v) continue; if (a >= v && b >= v && c >= v && d >= v) continue;   // (the bays lie in the frame's box)
      const cs = [[i, j, a], [i + 1, j, b], [i + 1, j + 1, c], [i, j + 1, d]], pts = [];
      for (let e = 0; e < 4; e++) { const [ix, iy, va] = cs[e], [jx, jy, vb] = cs[(e + 1) % 4]; if ((va >= v) !== (vb >= v)) { const t = (v - va) / (vb - va); pts.push([ix + (jx - ix) * t, iy + (jy - iy) * t]); } }
      if (pts.length === 2) segs.push(pts); else if (pts.length === 4) segs.push([pts[0], pts[1]], [pts[2], pts[3]]); }
    const key = p => Math.round(p[0] * 64) + ',' + Math.round(p[1] * 64), ends = new Map(), done = new Uint8Array(segs.length), lines = [];
    segs.forEach((sg, n) => { for (const e of [0, 1]) { const k2 = key(sg[e]); (ends.get(k2) ?? ends.set(k2, []).get(k2)).push(n); } });
    for (let n = 0; n < segs.length; n++) { if (done[n]) continue; done[n] = 1; const line = [segs[n][0], segs[n][1]];
      for (const dir of [1, 0]) for (;;) { const tip = dir ? line.at(-1) : line[0], nx = (ends.get(key(tip)) ?? []).find(m => !done[m]); if (nx === undefined) break; done[nx] = 1;
        const sg = segs[nx], other = key(sg[0]) === key(tip) ? sg[1] : sg[0]; dir ? line.push(other) : line.unshift(other); }
      const closed = Math.hypot(line[0][0] - line.at(-1)[0], line[0][1] - line.at(-1)[1]) < 1.5;
      const pg = line.map(([i, j]) => [x0 + (i + .5) / res, y0 + (j + .5) / res]);
      if (arclen(pg) > sp * 1.5) lines.push({ pts: smooth(resample(pg, .6), closed, 5), closed }); }
    return lines; };
  for (const [v, inner] of [[v1, false], [v2, true]]) for (const ln of iso(v)) {
    // (a closed line is begun where a hand would set the pen down: its top-left, and written round once)
    let pts = ln.pts; if (ln.closed) { let s = 0; pts.forEach((p, i) => { if (p[0] + p[1] < pts[s][0] + pts[s][1]) s = i; }); pts = [...pts.slice(s), ...pts.slice(0, s + 1)]; }
    const id = ++nid; stroke(out.frame, pts); occAdd(pts, id); if (inner) { addAnchors(pts, id, 'edge', 0); edges.push([pts, id]); } }
  // the frame's outer line, a little outside the inner (his frame is a double hairline), begun at its top left
  { const g = sp * .62, [X0, Y0, X1, Y1] = [fb[0] - g, fb[1] - g, fb[2] + g, fb[3] + g], pts = [];
    for (const [a, b] of [[[X0, Y0], [X1, Y0]], [[X1, Y0], [X1, Y1]], [[X1, Y1], [X0, Y1]], ...(o.panel ? [] : [[[X0, Y1], [X0, Y0]]])]) for (let t = 0; t < 1; t += .02) { const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      if (inWords(p[0], p[1], 1)) { if (pts.length > 3) { const id = ++nid; stroke(out.frame, pts.splice(0)); } else pts.length = 0; } else pts.push(p); }
    if (pts.length > 3) stroke(out.frame, pts); fb.outer = [X0, Y0, X1, Y1]; }
  const deep = v2 + sp * .38;   // (the core: where the fill may run, a gap inside the inner line)

  // 2. FILLED, bay by bay, by its shape
  const coreOK = (p, d = deep) => at(p[0], p[1]) >= d;
  const eyes = [], sector = [], eyeComp = new Set();
  for (const c of comps) {
    const room = c.rad - deep; if (room < sp * .15) continue;
    const [cx, cy] = Px(c.best % w, c.best / w | 0), round = c.area / (Math.PI * c.rad * c.rad);
    if (!c.open && room > sp * 1.4 && round < 2.6 && !small) {
      // an eye: a ring and its point at the counter's deepest place, spokes radiating from it to the contour (each run
      // up the bay's depth from the ring, so they fan to its shape), every other one the longer
      const re = sp * .55, id = ++nid, ring = []; const a0 = r() * 6.283;
      for (let k = 0; k <= 30; k++) { const a = a0 + k / 30 * 2.08 * Math.PI; ring.push([cx + Math.cos(a) * re, cy + Math.sin(a) * re]); }
      stroke(out.spokes, ring); occAdd(ring, id); out.dots.push({ kind: 'dot', p: [cx, cy], r: Math.max(.55, sp * .17) }); eyes.push([cx, cy, re]);
      const ns = Math.max(6, Math.min(12, Math.round(2 * Math.PI * Math.min(c.rad, sp * 6) / (sp * 2.9)) & ~1));
      for (let k = 0; k < ns; k++) { const a = a0 + (k + .5) / ns * 2 * Math.PI; let p = [cx + Math.cos(a) * (re + sp * .35), cy + Math.sin(a) * (re + sp * .35)], d = [Math.cos(a), Math.sin(a)]; const pts = [p];
        for (let s = 0; s < c.rad * 3; s += .5) { const g = grad(p[0], p[1]), mix = Math.min(1, s / (c.rad * 1.2)) * .55; d = [d[0] * (1 - mix * .2) - g[0] * mix * .2, d[1] * (1 - mix * .2) - g[1] * mix * .2]; const l = Math.hypot(...d); d = [d[0] / l, d[1] / l];
          const q = [p[0] + d[0] * .5, p[1] + d[1] * .5]; if (at(q[0], q[1]) < v2 + sp * .12) break; p = q; pts.push(p); }
        if (arclen(pts) < sp * .8) continue; const sid = ++nid; stroke(out.spokes, pts, { end: 'cut' }); occAdd(pts, sid); addAnchors(pts, sid, 'spoke', 1);
        // (in the sector after it, a scroll hung from this spoke, curling out at three fifths of the way to the contour)
        const b2 = a + Math.PI / ns, db = [Math.cos(b2), Math.sin(b2)]; let rim = re; while (rim < c.rad * 3 && at(cx + db[0] * rim, cy + db[1] * rim) > v2 + sp * .2) rim += .5;
        const span = rim - re - sp * .4, frs = span > sp * 3.4 ? [.22 + r() * .06, .52 + r() * .06, .82 + r() * .05] : span > sp * 2.2 ? [.3 + r() * .08, .72 + r() * .08] : span > sp * 1.1 ? [.55 + r() * .1] : [];
        for (const fr of frs) sector.push([cx + db[0] * (re + span * fr), cy + db[1] * (re + span * fr)]); }
      eyeComp.add(c.id);
    }
  }
  const RHO = sp * (small ? .38 : .3), SPAN = sp * (small ? 1.3 : 1.0);
  // the spines: down the middle of every bay that has no eye (the ridge of its depth), a long line where the bay is broad,
  // with scrolls hung from it on alternate sides at his spacing; where it narrows, pearls strung down the middle instead
  { const coreM = new Float32Array(w * h); for (let k = 0; k < w * h; k++) coreM[k] = bay[k] && !eyeComp.has(lab[k]) && Db[k] >= v2 + sp * .5 ? 1 : 0;
    const lines = middles({ M: coreM, w, h, x0, y0, res }, sp * 2).filter(l => arclen(l) > sp * .8);
    for (const ln of lines) {
      const q = resample(ln, .5), cls = q.map(p => { const d = at(p[0], p[1]) - v2 - sp * .3; return d >= sp * 1.15 ? 2 : d >= sp * .55 ? 1 : 0; });
      // (runs of one kind, a short run of another inside a long one taken into it)
      const runs = []; q.forEach((p, i) => { const last = runs.at(-1); if (last && last.k === cls[i]) last.pts.push(p); else runs.push({ k: cls[i], pts: [p] }); });
      for (let i = 1; i < runs.length - 1; i++) if (arclen(runs[i].pts) < sp * .8 && runs[i - 1].k === runs[i + 1].k) { runs[i - 1].pts.push(...runs[i].pts, ...runs[i + 1].pts); runs.splice(i, 2); i--; }
      for (const run of runs) { const L2 = arclen(run.pts);
        if (run.k === 2 && L2 >= sp * 2) {
          const pts = smooth(run.pts, false, 6), id = ++nid; stroke(out.frame, pts, { end: 'taper' }); occAdd(pts, id); addAnchors(pts, id, 'spine', 1);
          // its scrolls, alternately either side, each leaving it forward at an easy angle and winding in
          const qq = resample(pts, .5); let side = r() < .5 ? 1 : -1;
          for (let sA = sp * .6; sA < L2 - sp * .4; sA += sp * (.95 + r() * .2)) { const i = Math.min(qq.length - 2, Math.round(sA / .5)), a = qq[i - 1] ?? qq[i], b = qq[i + 1], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = [(b[0] - a[0]) / tl, (b[1] - a[1]) / tl], nn = [-t[1] * side, t[0] * side];
            const avail = at(qq[i][0], qq[i][1]) - v2 - sp * .3, rho = Math.max(sp * .24, Math.min(sp * .5, (avail - sp * .42) / 2.1) * (.8 + r() * .35)), dd = sp * .42 + rho;
            const c = [qq[i][0] + nn[0] * dd + t[0] * sp * .55, qq[i][1] + nn[1] * dd + t[1] * sp * .55]; side = -side;
            if (avail < sp * .42 + rho * 2) continue; sector.push([c, { p: qq[i], t, id, depth: 1 }, rho]); }
        } else if (run.k >= 1 && L2 >= sp * .6) {
          const pp = resample(run.pts, .5); let last = null;
          for (const p of pp) { const d = at(p[0], p[1]) - v2 - sp * .3, R = Math.max(sp * .26, Math.min(sp * .46, d - sp * .12)); if (d < sp * .5) continue;
            if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < R + last[2] + sp * .5 || !clear(p, R + sp * .45)) continue; last = [p[0], p[1], R];
            const id = ++nid, rg = [], a0 = r() * 6.283; for (let k = 0; k <= 18; k++) { const a = a0 + k / 18 * 2.1 * Math.PI; rg.push([p[0] + Math.cos(a) * R, p[1] + Math.sin(a) * R]); } stroke(out.pearls, rg); occAdd(rg, id); } } } } }
  // the scrolls: attractors set evenly in the cores (Poisson disc at his spacing), each reached by one stroke branching
  // off the nearest line laid so far (contour, spoke, or an earlier scroll), nearest first, so the work grows outward
  // from the structure and later scrolls hang from earlier ones
  const W0 = fb[2] - fb[0], H0 = fb[3] - fb[1];
  const att = poisson(W0, H0, SPAN, r, q => { const p = [q[0] + fb[0], q[1] + fb[1]]; return coreOK(p, deep + RHO * .3) && clear(p, RHO + sp * .34) && !eyes.some(e => Math.hypot(p[0] - e[0], p[1] - e[1]) < e[2] + RHO + sp * .7); })
    .map(q => [q[0] + fb[0], q[1] + fb[1]]);
  const nearAnchor = (p, comp) => { let best = null, bd = 1e9; for (const a of anchors) { if (a.comp !== comp && a.comp) continue; const d = Math.hypot(a.p[0] - p[0], a.p[1] - p[1]); if (d < bd && d > RHO * 1.2) { bd = d; best = a; } } return [best, bd]; };
  const scroll = (a, c, rho, want = 0) => scrollPts(a, c, rho, want, r, sp);
  // (a stroke is accepted only if it keeps his gap from everything else laid, outside its first stretch off its parent,
  // and stays in the core once it has left the contour; its own curl may come close to itself, as a pen's does)
  const fits = (pts, a) => { const skip = new Set([a.id]); let s = 0;
    for (let i = 1; i < pts.length; i++) { s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (i % 2) continue; const p = pts[i];
      if (s > sp * .8 && !coreOK(p, v2 + sp * .32)) return false;
      if (inWords(p[0], p[1], 1.5)) return false;
      if (s > sp * .55 && !clear(p, sp * .33, skip)) return false; }
    return true; };
  const MAXS = small ? 50 : 110; let ns = 0;
  // (first the set scrolls: a spine's, from their own place on it; an eye's sectors'; then the attractors that are still
  // clear, nearest the work first, each from the nearest line it can reach)
  const lay = (pts, a) => { const id = ++nid, sm2 = smooth(resample(pts, .45), false, 3); stroke(out.scrolls, sm2, { end: 'taper', depth: a.depth + 1 }); occAdd(sm2, id);
    const stemLen = Math.max(2, Math.round(sm2.length * .55)); if (a.depth < 2) addAnchors(sm2.slice(0, stemLen), id, 'scroll', a.depth + 1); ns++; };
  for (const e of sector) if (typeof e[0] !== 'number') { const [c, a, rho] = e; const pts = scroll(a, c, rho); if (pts && fits(pts, a)) lay(pts, a); }
  // (an eye's sectors: each scroll hung from the nearer spoke, a little smaller than the rest)
  for (const c of sector) if (typeof c[0] === 'number') { const comp = compAt(c[0], c[1]);
    const cand = anchors.filter(a => a.kind === 'spoke' && a.comp === comp).map(a => [Math.hypot(a.p[0] - c[0], a.p[1] - c[1]), a]).filter(([d]) => d > sp * .5).sort((x, y) => x[0] - y[0]).slice(0, 6);
    for (const [, a] of cand) { const pts = scroll(a, c, sp * (.26 + r() * .05)); if (pts && fits(pts, a)) { lay(pts, a); break; } } }
  // the fringe: along the inner contour, small scrolls hung into the bay one after another at his spacing, wherever there is
  // room for one (in a narrow bay they are all its work; in a broad one they line its edge)
  // (never a stamped row: each scroll its own size, the spacing uneven, the turn mostly alternating but not by rule)
  let fwPrev = 1;
  for (const [pts, id] of edges) { const qq = resample(pts, .5), L2 = arclen(qq); let last = -1e9, gapNext = sp * 1.2;
    for (let sA = sp * .5; sA < L2 - sp * .3; sA += .5) { if (sA - last < gapNext) continue; const i = Math.min(qq.length - 2, Math.max(1, Math.round(sA / .5))), a = qq[i - 1], b = qq[i + 1], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = [(b[0] - a[0]) / tl, (b[1] - a[1]) / tl];
      let nn = [-t[1], t[0]]; if (at(qq[i][0] + nn[0] * sp * .5, qq[i][1] + nn[1] * sp * .5) < at(qq[i][0] - nn[0] * sp * .5, qq[i][1] - nn[1] * sp * .5)) nn = [-nn[0], -nn[1]];
      // (the room ahead into the bay: as far as the depth keeps rising, less a gap)
      let room = 0; while (room < sp * 3 && at(qq[i][0] + nn[0] * (room + .5), qq[i][1] + nn[1] * (room + .5)) > at(qq[i][0] + nn[0] * room, qq[i][1] + nn[1] * room) - .05) room += .5;
      const rho = Math.min(sp * .38, (room - sp * .3) / 2.4) * (.72 + r() * .4); if (rho < sp * .19) continue;
      const fw = r() < .72 ? -fwPrev : fwPrev, c = [qq[i][0] + nn[0] * (sp * .25 + rho * 1.4) + t[0] * fw * sp * .35, qq[i][1] + nn[1] * (sp * .25 + rho * 1.4) + t[1] * fw * sp * .35];
      const anc = { p: qq[i], t, id, depth: 0 }, sc = scroll(anc, c, rho, fw * (r() < .8 ? 1 : -1)); if (sc && fits(sc, anc)) { lay(sc, anc); last = sA; fwPrev = fw; gapNext = sp * (1.05 + r() * .6); } } }
  const rest = att.filter(p => clear(p, RHO + sp * .45)); rest.sort((p, q) => nearAnchor(p, compAt(...p))[1] - nearAnchor(q, compAt(...q))[1]);
  att.splice(0, att.length, ...rest);
  for (const c of att) { if (ns >= MAXS) break; const comp = compAt(c[0], c[1]);
    // (the nearest few anchors are tried, nearest first; a scroll that cannot be laid without crowding is not laid)
    const cand = anchors.filter(a => !a.comp || a.comp === comp).map(a => [Math.hypot(a.p[0] - c[0], a.p[1] - c[1]), a]).filter(([d]) => d > RHO * 1.3 && d < SPAN * 2.4).sort((x, y) => x[0] - y[0]).slice(0, 8);
    for (const [, a] of cand) { const rho = RHO * (.85 + r() * .3), pts = scroll(a, c, rho); if (!pts || !fits(pts, a)) continue;
      lay(pts, a); break; } }

  // 3. the frame's outer side: pearls set on it and spikes radiating between them; a finial at the middle of top and foot;
  // the left side (the margin's panel stands there) and wherever words stand left bare
  const [X0, Y0, X1, Y1] = fb.outer, e = 0;   // (from the frame's outer line)
  // (an ornament standing out from the frame is shrunk to the room it has before it is left out: a line of text under the
  // box shortens the foot's spikes, it does not strip them)
  const fitLen = (p, d, want, min) => { for (let f = 1; f >= min / want - 1e-9; f -= .12) { const L3 = want * f; let ok = true;
      for (let u = .3; u <= 1.001; u += .35) if (inWords(p[0] + d[0] * L3 * u, p[1] + d[1] * L3 * u, 1.2)) { ok = false; break; }
      if (ok) return L3; } return 0; };
  // a fleuron: a spike with a pair of small scrolls springing from its foot and turning back toward the frame (his finials, and
  // at the corners, his diagonal sprays)
  const fleuron = (p, d, ln) => { for (const pts of fleuronPts(p, d, ln, sp)) stroke(out.spikes, pts, { end: 'taper' }); };
  const side = (a, b, nrm, finial) => { const L2 = Math.hypot(b[0] - a[0], b[1] - a[1]), step = sp * 1.3, n = Math.max(2, Math.round(L2 / step)), mid = Math.round(n / 2);
    for (let k = 1; k < n; k++) { const t = k / n, p = [a[0] + (b[0] - a[0]) * t + nrm[0] * e, a[1] + (b[1] - a[1]) * t + nrm[1] * e];
      if (inWords(p[0], p[1], 1.2)) continue;
      if (finial && k === mid) { const ln = fitLen(p, nrm, sp * 2.3, sp * .9); if (ln) { fleuron(p, nrm, ln); continue; } }
      if ((k + (finial ? 0 : 1)) % 2) {   // a pearl, sitting on the line
        const R = sp * .26; if (!fitLen(p, nrm, R * 2, R * 2)) continue; const c2 = [p[0] + nrm[0] * R, p[1] + nrm[1] * R], rg = [], a0 = Math.atan2(-nrm[1], -nrm[0]); for (let q = 0; q <= 16; q++) { const an = a0 + q / 16 * 2.05 * Math.PI; rg.push([c2[0] + Math.cos(an) * R, c2[1] + Math.sin(an) * R]); } stroke(out.spikes, rg); }
      else { const ln = fitLen(p, nrm, sp * (1.0 + (k % 4 === 0 ? .35 : 0)) * (.92 + r() * .16), sp * .45); if (ln) stroke(out.spikes, [p, [p[0] + nrm[0] * ln, p[1] + nrm[1] * ln]], { end: 'taper' }); } } };
  side([X0, Y0], [X1, Y0], [0, -1], true); side([X0, Y1], [X1, Y1], [0, 1], true); side([X1, Y0], [X1, Y1], [1, 0], false);
  if (o.open) side([X0, Y0], [X0, Y1], [-1, 0], false);   // (no margin panel: the box stands alone, worked all round)
  // the corners: his spray, a fleuron out along the diagonal (not on the margin's side)
  for (const [cx, cy, sx, sy] of [[X1, Y0, 1, -1], [X1, Y1, 1, 1], ...(o.open ? [[X0, Y0, -1, -1], [X0, Y1, -1, 1]] : [])]) { const d = [sx * .7071, sy * .7071], ln = fitLen([cx, cy], d, sp * 1.9, sp * .8); if (ln) fleuron([cx, cy], d, ln); }
  // the order a hand writes them: the contour and frame, the eyes' spokes, the scrolls as they grew, the pearls, the spikes
  return [...out.frame, ...out.spokes, ...out.scrolls, ...out.pearls, ...out.spikes, ...out.dots];
}

// ---- the split body (his parted letters: a stem in the other colour) -------------------------------------------------------------
// kit/illum.js paints a registry letter in one pigment (letter: { M, pigment }); a letter in two needs a hook there, e.g.
// letter.parts: [{ M, pigment }...] painted in turn in score()'s paint(). Until then the style prototypes it: the stem (the
// letter's longest upright member) is cut from the paint with a hair of parchment round it, and laid in the other colour by
// the ink engine's broad nib, square across it, as wide as the stem. Returns { M, marks }.
export function splitBody(L, seed) {
  const { M, w, h, x0, y0, res } = L, paper = new Uint8Array(w * h); let r0 = h, r1 = 0;
  for (let k = 0; k < w * h; k++) { paper[k] = M[k] <= .5; if (!paper[k]) { const j = k / w | 0; r0 = Math.min(r0, j); r1 = Math.max(r1, j); } }
  const H = (r1 - r0) / res, D = edt(paper, w, h);
  const st = ridges(L, H * .5, .5).filter(P => { const Lp = arclen(P); return Math.abs(P.at(-1)[1] - P[0][1]) > Lp * .9; }).sort((a, b) => arclen(b) - arclen(a))[0];
  if (!st) return { M: L, marks: [] };
  const a = st[0], b = st.at(-1), at = p => { const i = Math.floor((p[0] - x0) * res), j = Math.floor((p[1] - y0) * res); return i < 0 || j < 0 || i >= w || j >= h ? 0 : D[j * w + i] / res; };
  const half = resample(st, 1).map(at).sort((u, v) => u - v)[Math.floor(st.length * .5)] ?? H * .08, Lp = arclen(st), t = [(b[0] - a[0]) / Lp, (b[1] - a[1]) / Lp];
  // (his channel, 467763's K: not the whole stem but a lens down its middle, about two fifths of its width, pointed at both
  // ends, with a hair of parchment round it, so the letter still reads as one colour with a jewel set in it)
  const out = Float32Array.from(M), gap = .6, ch = half * .42, s1 = Lp * .1, s2 = Lp * .9, lens = s0 => s0 <= s1 || s0 >= s2 ? 0 : ch * Math.pow(Math.sin(Math.PI * (s0 - s1) / (s2 - s1)), .6);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = j * w + i; if (!M[k]) continue; const x = x0 + (i + .5) / res, y = y0 + (j + .5) / res;
    const s0 = (x - a[0]) * t[0] + (y - a[1]) * t[1], d = Math.abs(-(x - a[0]) * t[1] + (y - a[1]) * t[0]), hw = lens(s0); if (hw <= 0) continue;
    out[k] *= Math.min(1, Math.max(0, (d - hw - gap) * 2)); }
  const A = [a[0] + t[0] * s1, a[1] + t[1] * s1], Bp = [a[0] + t[0] * s2, a[1] + t[1] * s2];
  return { M: { ...L, M: out }, marks: [{ pts: resample([A, Bp], .5), kind: 'split', w: ch * 2, nib: -Math.atan2(t[0], t[1]), press: f => Math.max(.05, Math.pow(Math.sin(Math.PI * f), .6)) }] };
}

// ---- the flourish ----------------------------------------------------------------------------------------------------------------
// 03's (kit/penwork.js flourish), deepened: the same order of work and the same clearance, with the columns' capitals,
// the text-side panel, pendants, the pearled contour, the cross. The filigree is laid by filigree() above. Arguments as 03's, and tp: the
// text-side panel [x0, y0, x1, y1] or null.
export function flourish({ glyph, panel, keep = [], staff = null, g = 2.6, cap = true, seed = 1, level = 2, right = g, tp = null, own = false }) {
  // own: the letter's box is worked by counterWork (Lewis E 73's rules), so the penwork here leaves it alone
  const r = stream(seed, 'penwork'), out = [], B = own ? { ...BUDGETS[level], counterEyes: 0, counterRules: false, top: false } : BUDGETS[level];
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
  for (const k of keep) { const i0 = Math.max(0, Math.ceil(k[0] - X0 - .5)), i1 = Math.min(W - 1, Math.floor(k[2] - X0 - .5)), j0 = Math.max(0, Math.ceil(k[1] - Y0 - .5)), j1 = Math.min(H - 1, Math.floor(k[3] - Y0 - .5));
    for (let j = j0; j <= j1; j++) if (i1 >= i0) blocked.fill(1, j * W + i0, j * W + i1 + 1); }   // (the words, laid once)
  { const i0 = Math.max(0, Math.floor(gx - X0)), i1 = Math.min(W - 1, Math.ceil(gx + gw / res - X0)), j0 = Math.max(0, Math.floor(gy - Y0)), j1 = Math.min(H - 1, Math.ceil(gy + gh / res - Y0));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (onLetter(X0 + i + .5, Y0 + j + .5)) blocked[j * W + i] = 1; }
  const CL = clearance(X0, Y0, W, H, blocked, 16, g * 1.2);   // (no query asks more than .95 g)
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
const INKS = { azurite: [222, 136, 112], minium: [102, 130, 200] }, INKS_DARK = { azurite: [240, 126, 94], minium: [112, 148, 242] };   // (dark: lightness over .64, so kit/illum.js's lift leaves them as designed)   // (the penwork's: a fine pen's line reads lighter than the paint)
// the dark page's paints: the pigment laid flat (kit/illum.js lifts it), its body thick where the brush pooled at the
// edge and thinner over the middle, so it reads laid, not printed
PIGMENTS.cbAzureDark ??= { rgb: [52, 88, 206], gran: .03, rim: .42 };
PIGMENTS.cbMiniumDark ??= { rgb: [214, 84, 52], gran: .03, rim: .36 };
function pooled(L, seed) {
  // the dark page's letter: a flat paint whose body is not even: thick where the brush pooled at the edge, mottled where it
  // dried unevenly (two scales, ~7 px and ~2 px), a fine tooth over it, as paintField makes the light page's
  const { M, w, h, res } = L, paper = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) paper[i] = M[i] <= .5;
  const D = edt(paper, w, h), n = noise2(seed ^ 0x2b), n2 = noise2(seed ^ 0x6c), n3 = noise2(seed ^ 0x13), out = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = j * w + i; if (!M[k]) continue; const d = D[k] / res, x = i / res, y = j / res;
    const a = .78 + .22 * Math.exp(-d / 1.2) + .07 * (n(x / 7, y / 7) - .5) * 2 + .05 * (n2(x / 2.2, y / 2.2) - .5) * 2 + .03 * (n3(x / .7, y / .7) - .5) * 2;
    out[k] = M[k] * Math.max(.72, Math.min(1, a)); }   // (over the deep ground coat, never the page: see initial())
  return { ...L, M: out };
}
// ---- the letter: the choir book's own Lombards ------------------------------------------------------------------------------------
// Traced from the Lombards of one gradual (Free Library of Philadelphia, Lewis E 73, Bologna?, c. 1425; tools/tracelomb.py),
// the alphabet completed from the set's own strokes (tools/lombcompose.py, research/choirbook/lombards.json), each letter its
// own small webfont (tools/lombfont.py; playground/fonts/choirbook) made with EB Garamond's vertical metrics and cap height,
// so kit/illum.js, which sizes and places a drop by Garamond's metrics, sets a Lombard exactly where a Garamond capital
// would stand, and floats it as wide as itself. The host sets its initials in the face (CSS: .ini { font-family: "Choir
// Lombard", "EB Garamond" }); initial.load() fetches the letters the page uses before anything is measured.
export const FAMILY = 'Choir Lombard';
// (the letters: George Williams' Lombardic painted by his hand as one brush field, tools/lombbrush.py, research/17 §4j; ?lombard=gen: the letters
// generated from the hand's stroke model alone, tools/lombgen.py; ?lombard=hand2: the third pass (tools/lombhand.py, ends drawn as drops on capsule strokes); ?lombard=hand: the second pass; ?lombard=hand1: the first face+hand pass; ?lombard=traced: the letters traced from his book, for study)
const LOMB = new URLSearchParams(globalThis.location?.search ?? '').get('lombard');
const fontDir = new URL({ traced: '../../fonts/choirbook/traced/', gen: '../../fonts/choirbook/', hand1: '../../fonts/choirbook/hand1/', hand: '../../fonts/choirbook/hand/', hand2: '../../fonts/choirbook/hand2/' }[LOMB] ?? '../../fonts/choirbook/hand3/', import.meta.url), loaded = new Set();
export async function loadLetters(chars) {
  await Promise.all([...new Set(chars)].filter(c => /^[A-Z]$/.test(c) && !loaded.has(c)).map(async c => {
    const f = new FontFace(FAMILY, `url(${new URL(`choir-lombard-${c}.woff2`, fontDir)})`, { unicodeRange: 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'), weight: '100 900' });
    document.fonts.add(f); await f.load(); loaded.add(c); }));
}
// which letter a drop is: kit/illum.js hands a registry style the letter's Garamond coverage (G) and not the letter, so it is
// read back from that coverage: the capital of EB Garamond 600 at that size whose ink box and cells match it best
const IDS = new Map();   // (a letter once read back is known again by its size and its coverage's sum)
function identify(G) {
  if (G.ch) return G.ch; let sum = 0; for (let i = 0; i < G.M.length; i += 5) sum += G.M[i];
  const key = [G.F, G.w, G.h, (G.box[2] - G.box[0]).toFixed(1), (G.box[3] - G.box[1]).toFixed(1), sum.toFixed(2)].join('|');
  if (!IDS.has(key)) { if (IDS.size > 200) IDS.clear(); IDS.set(key, identify1(G)); } return IDS.get(key);
}
// (the candidates: the page's own initials' letters whose box fits, else any capital's; one alone is the letter)
const pageLetters = () => { try { return [...new Set([...document.querySelectorAll('.ini')].map(e => letterOf(e.textContent)))].filter(ch => /^[A-Z]$/.test(ch)).join(''); } catch { return ''; } };
function identify1(G) {
  const c = new OffscreenCanvas(8, 8).getContext('2d'); c.font = `600 ${G.F}px "EB Garamond"`;
  const gw = G.box[2] - G.box[0], gh = G.box[3] - G.box[1]; let best = null;
  const fit = set => [...set].map(ch => [ch, c.measureText(ch)]).filter(([, m]) => Math.abs(m.actualBoundingBoxLeft + m.actualBoundingBoxRight - gw) + Math.abs(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent - gh) <= 1.5);
  let cand = fit(pageLetters()); if (!cand.length) cand = fit('ABCDEFGHIJKLMNOPQRSTUVWXYZ'); if (cand.length === 1) return cand[0][0];
  for (const [ch, m] of cand) {
    // the cells: Garamond's letter drawn on G's grid, the share of cells that agree
    const k = new OffscreenCanvas(G.w, G.h).getContext('2d', { willReadFrequently: true }); k.setTransform(G.res, 0, 0, G.res, -G.x0 * G.res, -G.y0 * G.res); k.font = c.font;
    k.fillText(ch, G.box[0] + m.actualBoundingBoxLeft, G.box[1] + m.actualBoundingBoxAscent); const d = k.getImageData(0, 0, G.w, G.h).data; let agree = 0;
    for (let i = 0; i < G.w * G.h; i += 3) agree += (d[i * 4 + 3] > 127) === (G.M[i] > .5);
    if (!best || agree > best.a) best = { a: agree, ch }; }
  return best?.ch ?? '';
}
// kit/penwork.js drawn(), the same coverage cell for cell, its distances found only where the edge can move: a cell further
// than the waver's reach (amp + .18 px, and a cell's width) from the letter's edge is wholly ink or wholly paper whatever the
// noise says, so only the band round the edge is measured (each cell's nearest cell of the other kind, within the band's
// reach) and has its noise read; the rest is 1 or 0 at once
function drawnNear({ M, w, h, x0, y0, res }, seed = 1, amp = .8) {
  const ink = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) ink[i] = M[i] > .5;
  const T = amp + .18 + 1 / res, R = Math.ceil(T * res) + 1, near = new Uint8Array(w * h), out = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = j * w + i; out[k] = ink[k];
    if ((i < w - 1 && ink[k + 1] !== ink[k]) || (j < h - 1 && ink[k + w] !== ink[k])) for (let b = Math.max(0, j - R); b <= Math.min(h - 1, j + R + 1); b++) near.fill(1, b * w + Math.max(0, i - R), b * w + Math.min(w - 1, i + R + 1) + 1); }
  const slow = noise2(seed ^ 0x5d), fine = noise2(seed ^ 0x19), R2 = (R + 1) * (R + 1);
  // (each near cell's nearest cell of the other kind, ring by ring outward: once a ring is searched and what was found is no
  // further than the next ring could be, nothing further out can be nearer)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = j * w + i; if (!near[k]) continue; const me = ink[k]; let d2 = R2;
    for (let rr = 1; rr <= R && d2 > rr * rr; rr++) { const r2 = rr * rr, al = Math.max(0, i - rr), ah = Math.min(w - 1, i + rr), bl = Math.max(0, j - rr + 1), bh = Math.min(h - 1, j + rr - 1);
      if (j - rr >= 0) for (let a = al, o = (j - rr) * w; a <= ah; a++) if (ink[o + a] !== me) { const q = (a - i) * (a - i) + r2; if (q < d2) d2 = q; }
      if (j + rr < h) for (let a = al, o = (j + rr) * w; a <= ah; a++) if (ink[o + a] !== me) { const q = (a - i) * (a - i) + r2; if (q < d2) d2 = q; }
      if (i - rr >= 0) for (let b = bl; b <= bh; b++) if (ink[b * w + i - rr] !== me) { const q = r2 + (b - j) * (b - j); if (q < d2) d2 = q; }
      if (i + rr < w) for (let b = bl; b <= bh; b++) if (ink[b * w + i + rr] !== me) { const q = r2 + (b - j) * (b - j); if (q < d2) d2 = q; } }
    if (d2 >= R2) continue; const sd = (me ? -1 : 1) * Math.sqrt(d2) / res, px = x0 + i / res, py = y0 + j / res;
    const bb = amp * (2 * slow(px / 25, py / 25) - 1) + .18 * (2 * fine(px / 5, py / 5) - 1); out[k] = Math.max(0, Math.min(1, .5 + (bb - sd) * res * .5)); }
  return { M: out, w, h, x0, y0, res };
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
  const q0 = new URLSearchParams(globalThis.location?.search ?? '');
  const G = lombard(G0, ch ? letterOf(ch) : identify(G0)) ?? G0;
  // his colours: the body red (minium) or blue (azurite), the work in the other; read from his book, about three of every five
  // large letters are red, and a page alternates them, so a drop is red or blue by its seed and a line initial the other
  const redDrop = stream(seed >>> 0, 'colour')() < .6 || q0.get('colour') === 'red', blueForce = q0.get('colour') === 'blue';
  const pig = (big ? redDrop && !blueForce : !(redDrop && !blueForce)) ? 'minium' : 'azurite', ink = (isDark() ? INKS_DARK : INKS)[pig], [lx0, ly0, lx1, ly1] = G.box, Hl = ly1 - ly0, dark = isDark();
  const gap = big ? 2.6 : 2.1, roomL = Math.max(0, margin - gap * 3);
  // the staff (the margin's column, its dome and the staff run down beside the text): the style's setting `staff` ('on', the
  // default, or 'off'; the site's Adjust sets it on the module), ?staff=on|off over it. Off, a drop's box stands alone as his
  // do, and a line initial keeps its small panel without the staff.
  const staffOn = (q0.get('staff') ?? choirbook.staff ?? 'on') !== 'off';
  const grownBox = big && li >= 1 && (q0.get('work') ?? 'grown') === 'grown', bm = boxMargins(Hl), pr = grownBox ? bm[0] + Math.max(1.7, Hl * .05) * .62 + gap * .45 : gap * .7;   // (the grown box's frame stands off the letter: the panel stands off the frame)
  const panel = big ? [lx0 - Math.max(pr + gap * 4, Math.min(GEOM.panelW[li] * Hl + pr, roomL)), ly0 - GEOM.rise[li] * Hl, lx0 - pr, ly1]
    : [lx0 - Math.min(GEOM.small.panelW[li], roomL), ly0 - 1, lx0 - gap * .6, ly1 + 1];
  const staff = { y1: Math.min(bottom, ly1 + Math.round((big ? GEOM.staff[li] : GEOM.small.staff[li]) * lh)) };
  const right = big && li >= 2 ? lh * .42 + GEOM.wider[li] : gap;
  const tp = big && li >= 2 ? [lx1 + gap * .4, ly0 - GEOM.rise[li] * Hl * .6, lx1 + right - gap * .6, ly1] : null;
  const L = drawnNear(G, seed, big ? .5 : .3);   // (the traced edge already wavers: a lighter hand than 03's on a type glyph)
  const q = new URLSearchParams(globalThis.location?.search ?? ''), fq = filig ?? (q.has('filigree') ? q.get('filigree') !== '0' : null);
  // the filigree, in a drop initial (the line initial is too small to be worked): its reserve cut from the paint, its
  // channel laid in the other colour (minium in azurite) after the paint and before the penwork; the penwork keeps to the
  // letter as painted, its worked counters included
  // (?work=grown, the default: the filigree grown in the box, filigrana; ?work=le73: the field-first pass, counterWork;
  // ?work=roundels: 467763's worked panels)
  const work = q.get('work') ?? 'grown', le = big && (work === 'le73' || work === 'grown') && li >= 1;
  const F = big && !le && (fq ?? BUDGETS[li].filigree) ? filigree(L, seed) : { M: L, full: L, marks: [] };
  const marks = big && !staffOn && le ? [] : flourish({ glyph: F.full, panel, keep, staff: staffOn ? staff : null, g: gap, seed, level: li, right, tp: le && work === 'grown' ? null : tp, own: le });   // (the grown box has its own frame on the text side)
  if (le) marks.push(...(work === 'grown' ? filigrana(L, seed, keep, li, { open: !staffOn }) : counterWork(L, seed, gap, keep)));
  // his parted letters: about one in four of his large letters is split (?split=1|0 to force)
  // (a split is his occasional choice, about one large letter in six, and only on a letter with a long upright stem to carry it)
  const LTR = ch ? letterOf(ch) : identify(G0), sq = q0.get('split'), sp = big && (sq ? sq !== '0' : 'BDEFHKLMNPR'.includes(LTR) && stream(seed >>> 0, 'split')() < .17) ? splitBody(F.M, seed) : null;
  if (sp) { F.M = sp.M; F.marks = [...F.marks, ...sp.marks]; }
  const chInk = PIGMENTS[big ? 'minium' : 'azurite'].rgb;
  const otherInk = PIGMENTS[pig === 'minium' ? 'azurite' : 'minium'].rgb;
  // (dark: a channel carries no ink of its own, so kit/illum.js lays it in the palette's designed dark solid ('a' the red, 'b'
  // the blue, as the letter's own col) rather than lifting a pigment to a pastel)
  const chCol = s => s.kind === 'split' ? (pig === 'minium' ? 'b' : 'a') : (big ? 'a' : 'b');
  const channel = F.marks.map((s, i) => ({ pts: s.pts, col: dark ? chCol(s) : 'b', ink: dark ? undefined : s.kind === 'split' ? otherInk : chInk, seed: seed + 7 * i, w: s.w, broad: .9, nib: s.nib, load: 1.1, dry: .08, swell: 0, press: s.press, start: s.kind === 'split' ? 'cut' : 'taper', end: s.kind === 'split' ? 'cut' : 'taper' }));
  const reds = (F.reds ?? []).map(d => ({ dot: true, p: d.p, r: d.r, col: 'b', ink: chInk }));
  // dark: the letter laid flat in the style's own designed dark paint (its inkDark: 'b' is the drop's blue, 'a' the line
  // initial's red), its opacity pooled at the rim. (kit/illum.js lays a pigment letter on a dark page as the pigment
  // lifted to a pastel; a designed dark pigment needs a hook there: letter.pigmentDark, or flat() not lifting it.)
  // dark: the letter painted in two coats, as on a stained leaf: a deep murrey ground coat (the palette's 'f'), the bright
  // pigment over it, thickest where it pooled at the edge, thinner and mottled over the middle, so its body varies between the
  // two and never shows the page through it
  return { letter: dark ? { M: pooled(F.M, seed), col: pig === 'minium' ? 'a' : 'b', ghost: { col: 'f', off: [0, 0] } } : { M: F.M, pigment: pig },
    marks: [...channel, ...reds, ...marks.map((s, i) => s.kind === 'dot'
      ? { dot: true, p: s.p, r: s.r, col: s.accent ? 'a' : 'b', ink: s.accent ? PIGMENTS[pig].rgb : ink }
      : { pts: s.pts, col: 'b', ink, seed: seed + i * 13, w: s.w * (dark ? 1 : 1.15), rho: s.rho, start: s.start, end: s.end, load: .78 * (s.rho ?? 1), dry: .3, broad: .42, swell: .25, nib: .5 })] };
}
initial.wider = GEOM.wider;
// before the page is measured: the Lombards of every initial on it
initial.load = () => typeof document === 'undefined' ? null : loadLetters([...document.querySelectorAll('.ini')].map(e => letterOf(e.textContent)));

// ---- the page in his hand ------------------------------------------------------------------------------------------------------
// Everything round the text is written by the drop's rubricator, with the drop's pens and inks, from the two vocabularies of
// its margin: the staff (flourish's chain, 03's approved hand: scallops strung on a hairline in runs, pendants hung on it with
// a point in each, hooks turned over with a ball, eyes on stalks, the dome of 466773's capitals) and the box's grown work
// (scrollPts: his crest, two volutes springing from a short stem and rolling outward and down, a spiral rising between them,
// a point at its eye, as on 467763's small letters). His gap g is the drop's (2.6 px), so a filler, a frame and the drop's staff
// are written at one size; each piece its own size within his range, the spacing uneven, the scallops in runs, nothing
// stamped. Colours by role ('a' the mark's own, red and blue in turn down the page; 'b' the other), so a red paraph's penwork
// is blue, as a red letter's is. The budget is the drop's five (BUDGETS: plain, modest, usual, fine, lavish).
const HS = .5 * 1.15, HL = .276, G = 2.6, lv = rich => Math.max(0, Math.min(4, Math.round(rich * 4)));   // (the staff's pen and the box's, as the drop writes them)
const jit = (pts, seed, a = .16) => { const n = noise1((seed * 31 + pts.length * 7) | 0); return pts.map((p, i) => [p[0] + (n(i * .09) - .5) * a, p[1] + (n(i * .09 + 50) - .5) * a]); };
const ph = (pts, col, seed, o = {}) => ({ pts: jit(resample(pts, .75), seed), col, w: HS, start: 'taper', end: 'taper', load: .78, ...o });
const pt = (p, r, col) => ({ dot: true, p, r, col });
const unit = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
const add = (p, d, k, n = [0, 0], m = 0) => [p[0] + d[0] * k + n[0] * m, p[1] + d[1] * k + n[1] * m];
const hk = (p, h, size, sense) => tendril(p, h, size * 2 * Math.PI * .8, 0, sense / size, 1.6, .4);
// his crest at p, standing out along d, s tall (the box's pen)
function crest(p, d, s, col, r, seed, eye = 'b') {
  const n = [-d[1], d[0]], top = add(p, d, s * .34), out = [ph([p, add(p, d, s * .2, n, (r() - .5) * .04 * s), top], col, seed, { w: HS * .8 })];
  for (const sg of [-1, 1]) { const c = add(p, d, s * .34, n, sg * s * .3), turn = Math.sign(d[0] * n[1] * sg - d[1] * n[0] * sg) || 1;
    const v = scrollPts({ p: add(p, d, s * .1), t: d }, c, s * .15 * (.92 + r() * .16), -turn, r, s * .3); if (v) out.push(ph(v, col, seed + 1 + sg, { w: HS * .8 })); }
  const sg = r() < .5 ? -1 : 1, c = add(top, d, s * .3, n, sg * s * .05), f = scrollPts({ p: top, t: d }, c, s * .13, sg * (Math.sign(d[0] * n[1] - d[1] * n[0]) || 1), r, s * .3);
  if (f) out.push(ph(f, col, seed + 5, { w: HS * .8 })); if (eye) out.push(pt(c, Math.max(.6, s * .05), eye));
  return out;
}
// an eye: a ring, its point, its lobes (flourish's eye)
function eyeAt(c, R, col, r, seed, lobes = true, ptCol = col) {
  const out = [ph(ring(c, R, r, .07, r() * 6.28), col, seed, { w: .5 * 1.15 }), pt(c, Math.max(.7, R * .27), ptCol)];
  if (lobes) { const nl = 4 + ((r() * 2) | 0), a0 = r() * 6.28;
    for (let k = 0; k < nl; k++) { const a = a0 + k / nl * 2 * Math.PI + (r() - .5) * .25, lr = R * (.36 + r() * .1), d = R + lr * .62, lc = [c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d], pts = [];
      for (let i = 0; i <= 14; i++) { const b = a - 1.9 + i / 14 * 3.8; pts.push([lc[0] + Math.cos(b) * lr, lc[1] + Math.sin(b) * lr]); } out.push(ph(pts, col, seed + 1 + k, { w: .45 * 1.15 })); } }
  return out;
}
// the staff's chain (flourish's) along any line, on its side `side` (+1 left of its way): scallops in runs, pendants, hooks, eyes
// on stalks; pitch 2.25 g
function strung(line, side, r, seed, { col = 'a', colB = 'b', runs = null, pend = 0, hooks = 0, eyes = 0, lead = 1.5, tail = 4, g = G, skip = null } = {}) {
  const P = resample(line, 1), gate = noise1(seed ^ 0x3c1), out = [];
  for (let i = Math.round(g * lead), next = 0; i < P.length - g * tail; i++) {
    if (i < next) continue; next = i + g * (2.25 + r() * .35);
    if (runs != null && gate(i / (g * 9)) < runs) continue;
    const p = P[i]; if (skip?.(p)) continue; const t = tangentAt(P, i), n = [-t[1] * side, t[0] * side], a0 = Math.atan2(n[1], n[0]);
    if (eyes && r() < eyes) { const R = g, Ls = g * 1.3, ec = add(p, n, Ls + R); out.push(ph([p, add(p, n, Ls)], col, seed + i, { w: .45 * 1.15 }), ...eyeAt(ec, R, col, r, seed + i * 3, true, colB)); next = i + g * 6; continue; }
    if (pend && r() < pend) { const pr = g * (.68 + r() * .12), pc = add(p, n, pr * 1.02);
      out.push(ph(ring(pc, pr, r, .12, a0 + Math.PI, 1.06), col, seed + i, { w: .46 * 1.15 }), pt(add(pc, n, pr * .12), .62 + r() * .12, colB)); next = i + g * (3.3 + r() * .4); continue; }
    if (hooks && r() < hooks) { out.push(ph(hk(p, a0 + (r() < .5 ? .5 : -.5), g * (.85 + r() * .25), r() < .5 ? 1 : -1), col, seed + i, { end: 'ball', w: .46 * 1.15 })); next = i + g * 3; continue; }
    const sr = g * (.82 + r() * .2), c = add(p, n, sr * .45), pts = [];
    for (let q = 0; q <= 14; q++) { const b = a0 - 2.1 + q / 14 * 4.2; pts.push([c[0] + Math.cos(b) * sr, c[1] + Math.sin(b) * sr]); }
    out.push(ph(pts, col, seed + i, { w: .5 * 1.15 })); }
  return out;
}
// 466773's capital: a dome over [x0, x1] standing on base (up: -1; a dome hung under a line, +1), freehand (lopsided, a little
// lumpy), an eye in it, its feet curling out, the abacus under it
function dome(x0, x1, base, col, colIn, r, seed, up = -1, g = G) {
  const span = x1 - x0, mid = (x0 + x1) / 2, rise = Math.min(span * (.4 + r() * .06), g * 6.5), lump = noise1(seed ^ 0x5d), lean = (r() - .5) * .16, P = [];
  for (let k = 0; k <= 28; k++) { const v = k / 28, su = Math.pow(Math.sin(Math.PI * v), .8), vv = Math.min(1, Math.max(0, v + lean * su)); P.push([x0 + span * vv, base + up * rise * su * (1 + .14 * (lump(v * 3.2) - .5) * 2) - (r() - .5) * .15]); }
  const out = [ph(P, col, seed, {}), ph(drift([[x0 + g * .25, base - up * .05], [x1 - g * .25, base + (r() - .5) * .3]], .12, seed + 31, 30), col, seed + 1, { w: .46 * 1.15 })];
  const R = Math.min(rise * .3, span * .2); if (R >= g * .65) out.push(...eyeAt([mid + (r() - .5) * .4, base + up * rise * .44], R, colIn, r, seed + 2, false));
  for (const [p, h, s] of [[P[0], Math.PI * 1.15, 1], [P.at(-1), -.1, -1]]) out.push(ph(hk(p, up < 0 ? h : -h, g * .85 * (1 + r() * .3), up < 0 ? s : -s), col, seed + 3 + s, { end: 'ball', w: .48 * 1.15 }));
  return { marks: out, top: P[14] };
}

// ---- the paraph --------------------------------------------------------------------------------------------------------------------
// His paraph (c1950.391's blue paraphs at the rubrics; Lewis E 73's cues): a Lombardic C a little taller than the text's
// capitals, from a little under the line, its back swelled (the broad nib held near level, so the back is laid full and the
// head and foot thin, and a second stroke down the back), its head ending in a drop. Red and blue in turn. The penwork in the
// other colour, as round his line initials: modest, a hairline round the bowl a gap off it, scallops strung on it in runs;
// usual, the scallops full, a pendant, his crest out into the margin from its back; fine, the crest's eye in the paraph's
// colour; lavish, the crest larger, an eye on a stalk among the scallops.
function paraph(x, base, u, seed, rich = .5) {
  const r = stream(seed, 'cbparaph'), L = lv(rich), out = [], D = Math.PI / 180, g = G * .9;
  const Rx = u * .8, Ry = u * 1.14, c = [x + Rx + u * .05, base - u * .78], at = (th, k = 1, dx = 0) => [c[0] + Math.cos(th) * Rx * k + dx, c[1] + Math.sin(th) * Ry * k];
  const nib = { col: 'a', broad: .9, nib: .18, load: 1.15, dry: .08, swell: .1, start: 'cut', end: 'cut' };
  const arcPts = (a0, a1, k, n = 22, dx = 0) => Array.from({ length: n + 1 }, (_, i) => at(a0 + (a1 - a0) * i / n, k, dx));
  out.push({ ...nib, w: u * .42, pts: arcPts(-42 * D, -310 * D, .9), end: 'taper' });   // the bowl, from its head round to its foot
  out.push({ ...nib, broad: .7, w: u * .5, pts: arcPts(-136 * D, -224 * D, .72, 12, u * .03) });   // the swell of its back
  out.push(pt(at(-40 * D, .93, -u * .02), u * .17, 'a'));   // the drop at its head
  if (L < 1) return out;
  // the other colour: a hairline round the bowl, a gap off it, from over its head to under its foot, its end hooked
  const gp = u * .4, cont = Array.from({ length: 33 }, (_, i) => { const th = (-70 - 220 * i / 32) * D; return [c[0] + Math.cos(th) * (Rx * .9 + u * .21 + gp), c[1] + Math.sin(th) * (Ry * .9 + u * .21 + gp)]; });
  const foot = hk(cont.at(-1), Math.PI / 2 + .6, g, 1);
  out.push(ph([...cont, ...foot.slice(1)], 'b', seed + 1, { start: 'taper', end: 'ball' }));
  // scallops down its back (in runs, modest), a pendant here and there (usual), eyes (lavish); (nothing runs down past its
  // foot: the next line's words stand there)
  const back = cont.filter(p => p[0] < c[0] - Rx * .35 && (L < 2 || Math.abs(p[1] - c[1]) > u * .55));
  out.push(...strung(back, 1, r, seed + 2, { col: 'b', colB: 'a', g, runs: L >= 2 ? null : .4, pend: L >= 2 ? .28 : 0, eyes: L >= 4 ? .2 : 0, lead: .5, tail: 1.5 }));
  // his crest out into the margin from the middle of its back (over its head there is only the line above)
  if (L >= 2) { const m = cont.reduce((a2, p) => p[0] < a2[0] ? p : a2); out.push(...crest(add(m, [-1, 0], u * .05), [-.995, .1], u * (L >= 4 ? 1.9 : 1.6), 'b', r, seed + 3, L >= 3 ? 'a' : 'b')); }
  return out;
}

// ---- the fillers --------------------------------------------------------------------------------------------------------------------
// A line's free end closed with his staff laid along it (research/17 §3: rare in the choir books, where the chant fills the
// line; in the rubrics' short lines a hairline run out with scallops or points): one hairline from the last word to the
// measure, its end hooked over with a ball. The kinds: scallops over it in runs; pendants hung under it here and there;
// eyes on stalks among the scallops (and, fine up, under it). Plain: the hairline alone; modest: scallops in sparse runs;
// usual: the copy's kinds; fine: the points in the other colour; lavish: his crest at the end. tight (the guard's second
// try): the scallops alone, over the line.
const FILLERS = ['scallops', 'pendants', 'eyes'];
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5, v = {}) {
  const r = stream(seed, 'cbfill'), h = yBase - yTop, L = lv(rich), tight = !!v?.tight, out = [], y = yBase - h * .3;
  // (the end hooked over inside the measure: the hook's reach past where it leaves the line, measured)
  const crestEnd = L >= 4 && !tight && x1 - x0 > h * 5, hs = G * 1.1, hook = hk([0, 0], 0, hs, -1), reach = Math.max(...hook.map(p => p[0])) + .6, xe = x1 - (crestEnd ? h * 1.9 : reach);
  if (xe - x0 < h) return out;
  const line = drift([[x0, y], [xe, y + (r() - .5) * .4]], .14, seed + 3, 30), e = line.at(-1);
  out.push(ph(crestEnd ? line : [...line, ...hook.slice(1).map(p => [e[0] + p[0], e[1] + p[1]])], 'a', seed, { end: crestEnd ? 'taper' : 'ball' }));
  if (crestEnd) out.push(...crest(line.at(-1), [1, 0], h * 2, 'a', r, seed + 1, 'b'));
  if (L < 1 || kind === 'bare') return out;
  // (the scallops over the line, in runs but on the plainest; pendants or eyes under it, here and there)
  const B = L >= 3 ? 'b' : 'a';
  out.push(...strung(line, -1, r, seed + 5, { colB: B, runs: L < 2 ? .5 : L < 3 ? .3 : .2, eyes: !tight && kind === 'eyes' ? .1 : 0, lead: 1, tail: 2.5 }));
  if (!tight && kind === 'pendants' && L >= 2) out.push(...strung(line, 1, r, seed + 6, { colB: L >= 2 ? 'b' : 'a', pend: 1, runs: .5, lead: 2.5, tail: 3 }));
  if (!tight && kind === 'eyes' && L >= 3) out.push(...strung(line, 1, r, seed + 7, { colB: 'b', eyes: 1, runs: .62, lead: 3, tail: 4 }));
  return out;
}
const pickKinds = (r, all, min) => { const k = [...all].sort(() => r() - .5); return k.slice(0, Math.max(min, Math.round(min + r() * (all.length - min)))); };

// ---- the breaks ------------------------------------------------------------------------------------------------------------------
// Three ranks, the size of the division. A part (rank 1), with the staff (the default): it closes on its stave, four red rules,
// a C clef, a cadence of square notes falling to the final, the finalis, his crest out from each end; without the staff, his
// staff laid level: a hairline each side of an eye, scallops strung over and pendants under, its ends hooked. A book (rank 2):
// his column laid level, two hairlines strung outside with scallops and pendants, the dome of 466773 over the middle with an
// eye in it, his crests out at the ends. The end (rank 3): the band wider, a dome over and under, eyes on stalks along it.
const RED_HAIR = [212, 100, 74];
const note = (x, y, s) => ({ col: 'k', broad: .9, nib: 0, w: s, load: 1.15, dry: .08, swell: .05, start: 'cut', end: 'cut', pts: [[x, y - s * .42], [x, y + s * .42]] });
function stave(cx, y, measure, seed, rich, u) {
  const r = stream(seed, 'stave'), L = lv(rich), sp = u * .74, W = Math.min(measure * .4, u * 19), x0 = cx - W / 2, x1 = cx + W / 2, out = [], ly = k => y + (k - 1.5) * sp;
  for (let k = 0; k < 4; k++) out.push({ ...hair(wander([[x0, ly(k)], [x1, ly(k) + (r() - .5) * .3]], .1, seed + k, 40), 'a', { w: .5, start: 'cut', end: 'cut' }), ink: RED_HAIR });
  const s = sp * .86, at = (x, step) => [x, ly(3) - step * sp / 2];   // step: half-spaces up from the bottom rule
  // the C clef on the second rule from the top: two squares on a short stem
  const cy = ly(1), cxL = x0 + u * .55;
  out.push({ col: 'k', broad: .9, nib: 0, w: u * .1, load: 1.1, dry: .08, swell: 0, start: 'cut', end: 'cut', pts: [[cxL - s * .42, cy - sp * .9], [cxL - s * .42, cy + sp * .9]] });
  out.push(note(cxL, cy - sp * .5, s * .62), note(cxL, cy + sp * .5, s * .62));
  // the last notes: a short cadence falling to the final, set out along the rules
  const steps = [5, 4, 5, 3, 2, 2], xs = steps.map((_, k) => x0 + u * 2.2 + k * (W - u * 4.6) / (steps.length + .5));
  steps.forEach((st, k) => { const [x, yy] = at(xs[k], st); out.push(note(x, yy, s)); });
  // the finalis: a double bar across the rules, the second heavier
  for (const [dx, w] of [[-u * .5, u * .1], [-u * .22, u * .16]]) out.push({ col: 'k', broad: .9, nib: 0, w, load: 1.1, dry: .08, swell: 0, start: 'cut', end: 'cut', pts: [[x1 + dx, ly(0) - .4], [x1 + dx, ly(3) + .4]] });
  // beyond its ends his work in the other colour: an eye (modest), his crest out along the stave (usual up)
  for (const s0 of [-1, 1]) { const p = [(s0 < 0 ? x0 : x1) + s0 * u * .5, y];
    if (L >= 2) out.push(...crest(p, [s0, 0], u * (L >= 4 ? 2.4 : 2), 'a', r, seed + 9 + s0, 'b'));
    else if (L >= 1) out.push(...eyeAt(add(p, [s0, 0], u * .4), u * .32, 'a', r, seed + 9 + s0, false, 'b')); }
  return out;
}
function level(cx, y, W, u, seed, L) {
  const r = stream(seed, 'level'), out = [], R = G * (L >= 3 ? 1.25 : 1.05);
  out.push(...eyeAt([cx, y], R, 'b', r, seed, L >= 2, 'a'));
  for (const s of [-1, 1]) { const xa = cx + s * (R * 1.9 + G * .4), xb = cx + s * W / 2, cr = L >= 4, arm = drift([[xa, y], [cr ? xb - s * u * 2.2 : xb, y + (r() - .5) * .5]], .15, seed + (s > 0 ? 3 : 5), 30);
    out.push(ph(cr ? arm : [...arm, ...hk(arm.at(-1), s > 0 ? 0 : Math.PI, G * 1.15, -s).slice(1)], 'a', seed + 1 + s, { end: cr ? 'taper' : 'ball' }));
    if (cr) out.push(...crest(arm.at(-1), [s, 0], u * 2.2, 'a', r, seed + 7 + s, 'b'));
    const ln = s > 0 ? arm : [...arm].reverse();
    if (L >= 1) out.push(...strung(ln, -1, r, seed + 11 + s, { runs: L >= 2 ? null : .45, lead: 1, tail: 2.5 }));   // (written left to right: over it, then under)
    if (L >= 2) out.push(...strung(ln, 1, r, seed + 13 + s, { colB: L >= 3 ? 'b' : 'a', pend: .45, runs: L >= 3 ? null : .3, lead: 1.5, tail: 3 })); }
  return out;
}
function band(cx, y, W, u, seed, L, rank) {
  // (drawn larger than the text's staff by its rank: his gap a quarter or a half again, the dome as the drop's capital)
  const r = stream(seed, 'band'), out = [], big = rank > 2, g = G * (big ? 1.5 : 1.25), gp = g * 1.5, x0 = cx - W / 2, x1 = cx + W / 2, half = u * (big ? 3 : 2.5), cl = half * .9;
  const dw = g * (big ? 11 : 10);
  for (const s of [-1, 1]) for (const [dy, side, k] of [[-gp / 2, -1, 1], [gp / 2, 1, 2]]) {   // (each rule written left to right: the work over the upper, under the lower)
    const a = [cx + s * dw * .5, y + dy], b = [s < 0 ? x0 + cl : x1 - cl, y + dy + (r() - .5) * .3], ln = drift(s > 0 ? [a, b] : [b, a], .14, seed + k + s * 3, 40);
    out.push(ph(ln, 'a', seed + k + s * 3, { w: k === 1 ? .58 * 1.15 : .5 * 1.15 }));
    if (L >= 1) out.push(...strung(ln, side, r, seed + 20 + k + s * 3, { g, colB: L >= 3 ? 'b' : 'a', runs: L >= 2 ? null : .45, pend: k === 2 && L >= 2 ? .3 : 0, eyes: k === 1 && (big || L >= 4) ? .08 : 0, lead: 1.5, tail: 2 })); }
  for (const s of [-1, 1]) out.push(...crest([s < 0 ? x0 + cl : x1 - cl, y], [s, 0], half * (L >= 2 ? 1 : .8), 'a', r, seed + 5 + s, 'b'));
  // the middle: his capital over the band (and, at the end of the work or on a fine page, hung under it too), an eye in each,
  // its abacus closing the band's rule; else the lower rule run on under it
  { const d = dome(cx - dw / 2, cx + dw / 2, y - gp / 2, 'a', 'b', r, seed + 30, -1, g); out.push(...d.marks); if (big || L >= 3) out.push(...crest(d.top, [0, -1], u * (big ? 2.4 : 1.9), 'a', r, seed + 32, 'b')); }
  if (big || L >= 3) { const d = dome(cx - dw / 2 + g, cx + dw / 2 - g, y + gp / 2, 'a', 'b', r, seed + 40, 1, g); out.push(...d.marks);
    if (big) out.push(...crest(d.top, [0, 1], u * 2, 'a', r, seed + 42, 'b')); }
  else out.push(ph(drift([[cx - dw * .5, y + gp / 2], [cx + dw * .5, y + gp / 2]], .12, seed + 10, 30), 'a', seed + 10, { w: .5 * 1.15 }));
  return out;
}
const staffOn = () => (new URLSearchParams(globalThis.location?.search ?? '').get('staff') ?? choirbook.staff ?? 'on') !== 'off';   // (the stave goes with the staff)
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8) {
  const L = lv(rich);
  if (rank < 2) return staffOn() ? stave(cx, y, measure, seed, rich, u) : level(cx, y, Math.min(measure * .4, u * 19) * (L < 1 ? .8 : 1), u, seed, L);
  return band(cx, y, rank > 2 ? Math.min(measure * .84, u * 48) : Math.min(measure * .6, u * 32), u, seed, L, rank);
}

// ---- frames ----------------------------------------------------------------------------------------------------------------------
// The quotation and the aside: the column of 466773 (a bundle of hairlines down the gutter, crowned with the dome, its foot
// hooked, the staff's chain down its outer side). The figure: his box's frame, a double hairline round it, the chain strung
// outside (usual), his crest out at its corners (usual), the dome over the middle of its head (fine), crests on that and larger
// at the corners (lavish). The code: two of its corners. The pull quote: the part's break above and below. The contents: the
// staff down its side, a stalk and an eye at each entry, the chain between.
function column(x, y0, y1, n, u, seed, L, { cap = L >= 2, col = 'a', colB = 'b' } = {}) {
  const r = stream(seed, 'column'), out = [], xs = Array.from({ length: n }, (_, k) => x - k * G * 1.05);
  xs.forEach((xk, k) => { const ln = drift([[xk, y0 + (cap ? G * .5 : 0)], [xk + (r() - .5) * .4, y1 - (k ? G * (1 + 5 * (k - 1)) : 0)]], .3, seed + k, 46), ft = k === 0 || k === n - 1 ? hk(ln.at(-1), Math.PI / 2, G * (1.3 + .3 * k), 1) : null;
    out.push(ph([...ln, ...(ft?.slice(1) ?? [])], col, seed + k, { end: ft ? 'ball' : 'taper', w: k ? .48 * 1.15 : .58 * 1.15 })); });
  if (cap) { const d = dome(xs.at(-1) - G * 1.1, x + G * 1.1, y0 + G * .5, col, colB, r, seed + 11); out.push(...d.marks); if (L >= 4) out.push(...crest(d.top, [0, -1], u * 1.7, col, r, seed + 12, colB)); }
  else out.push(ph(hk([x, y0], -Math.PI / 2, G * 1.1, -1), col, seed + 10, { end: 'ball' }));
  if (L >= 1) out.push(...strung([[xs.at(-1), y0 + G * 3], [xs.at(-1), y1 - (n > 1 ? G * (1 + 5 * (n - 2)) : 0)]], 1, r, seed + 20, { col, colB, runs: L >= 2 ? (L >= 3 ? null : .3) : .55, pend: L >= 2 ? .34 : 0, eyes: L >= 3 ? .12 : 0, hooks: L >= 4 ? .15 : 0, tail: 3 }));
  return out;
}
function quoteFrame({ x, lines, u, seed, rich = .5 }) { const L = lv(rich); return column(x, lines[0].top + u * .2, lines.at(-1).base + u * .35, [1, 2, 3, 3, 4][L], u, seed, L); }
function asideFrame({ box: [x0, y0, x1, y1], u, seed, rich = .5 }) {
  const L = lv(rich), r = stream(seed, 'aside'), x = x0 + u * .25, yt = y0 + u * .45, out = column(x, yt, y1 - u * .2, L >= 3 ? 2 : 1, u, seed, L, { cap: false });
  if (L >= 1) { const xe = x0 + (x1 - x0) * (L >= 3 ? .5 : .32), top = drift([[x, yt], [xe, yt + (r() - .5) * .4]], .14, seed + 2, 30), cr = L >= 3;
    out.push(ph(cr ? top : [...top, ...hk(top.at(-1), 0, G * 1.15, -1).slice(1)], 'a', seed + 3, { end: cr ? 'taper' : 'ball' }));
    out.push(...strung(top, -1, r, seed + 4, { runs: L >= 2 ? null : .5, pend: 0, eyes: L >= 4 ? .1 : 0, lead: 2, tail: 2 }));
    if (cr) out.push(...crest(top.at(-1), [1, 0], u * 2, 'a', r, seed + 5, 'b')); }
  return out;
}
function boxFrame([X0, Y0, X1, Y1], u, seed, L, { corners = null, foot = true } = {}) {
  const r = stream(seed, 'boxframe'), out = [], gp = G * 1.05;
  const sides = [[[X0, Y0], [X1, Y0], [0, -1]], [[X1, Y0], [X1, Y1], [1, 0]], [[X1, Y1], [X0, Y1], [0, 1]], [[X0, Y1], [X0, Y0], [-1, 0]]];
  // (corners: the two of four a code frame keeps, each side then run a third of the way from its corner)
  const seg = (a, b, k) => { if (!corners) return [[a, b]]; const Ls = Math.hypot(b[0] - a[0], b[1] - a[1]), t = Math.min(.34, u * 8 / Ls), o = [];
    if (corners.includes(k)) o.push([a, add(a, unit(a, b), Ls * t)]); if (corners.includes((k + 1) % 4)) o.push([add(b, unit(b, a), Ls * t), b]); return o; };
  const midTop = [(X0 + X1) / 2, Y0 - gp], capW = G * 8, hasCap = !corners && L >= 3;
  sides.forEach(([a, b, n], k) => { for (const [p, q] of seg(a, b, k)) {
    for (const d of L >= 1 ? [0, gp] : [0]) out.push(ph(drift([add(p, n, d), add(q, n, d)], .14, seed + k * 7 + d, 40), 'a', seed + k * 3 + d, { w: d ? .48 * 1.15 : .56 * 1.15 }));
    const sideFree = k !== 2 || foot;
    if (L >= 2 && sideFree) { const P0 = add(p, n, gp), Q0 = add(q, n, gp), side = Math.sign(-(Q0[1] - P0[1]) * n[0] + (Q0[0] - P0[0]) * n[1]) || 1;
      out.push(...strung([P0, Q0], side, r, seed + 40 + k, { runs: L >= 3 ? null : .35, pend: L >= 3 ? .25 : 0, lead: 2.5, tail: 2.5, skip: hasCap && k === 0 ? pp => Math.abs(pp[0] - midTop[0]) < capW * .7 : null })); } } });
  if (hasCap) { const d = dome(midTop[0] - capW / 2, midTop[0] + capW / 2, midTop[1], 'a', 'b', r, seed + 60); out.push(...d.marks); if (L >= 4) out.push(...crest(d.top, [0, -1], u * 1.8, 'a', r, seed + 61, 'b')); }
  if (L >= 2) for (const [cx, cy, sx, sy, k] of [[X0, Y0, -1, -1, 0], [X1, Y0, 1, -1, 1], [X1, Y1, 1, 1, 2], [X0, Y1, -1, 1, 3]]) { if (corners ? !corners.includes(k) || L < 3 : !foot && sy > 0) continue;
    const p = [cx + sx * gp, cy + sy * gp], d = [sx * .7071, sy * .7071];
    out.push(...crest(p, d, u * (L >= 4 ? 2.2 : 1.9), 'a', r, seed + 70 + k, 'b')); }
  return out;
}
function figureFrame({ box: [x0, y0, x1, y1], u, seed, rich = .5 }) { const L = lv(rich), d = u * .9; return boxFrame([x0 - d, y0 - d, x1 + d, y1 + d], u, seed, L, { foot: false }); }
function codeFrame({ box: [x0, y0, x1, y1], u, seed, rich = .5 }) { const L = lv(rich), d = u * .35; return boxFrame([x0 + d, y0 + d, x1 - d, y1 - d], u, seed, Math.min(L, 3), { corners: [0, 2] }); }
const pullFrame = ({ cx, yTop, yBot, measure, u, seed, rich = .5 }) => lv(rich) < 1 ? [] : [...breakMark(cx, yTop, measure, 1, seed, rich, u), ...breakMark(cx, yBot, measure, 1, seed + 7, rich, u)];
function navFrame({ box: [x0, y0, x1, y1], entries, x, u, seed, rich = .5 }) {
  const L = lv(rich), r = stream(seed, 'nav'), out = [], ya = y0 - u * .6, yb = y1 + u * .5, st = drift([[x, ya], [x + (r() - .5) * .4, yb]], .3, seed + 1, 46), ft = hk(st.at(-1), Math.PI / 2, G * 1.4, 1);
  const head = L >= 2 ? [] : hk(st[0], -Math.PI / 2, G * 1.1, -1).reverse();
  out.push(ph([...head.slice(0, -1), ...st, ...ft.slice(1)], 'a', seed, { start: head.length ? 'ball' : 'taper', end: 'ball', w: .58 * 1.15 }));
  if (L >= 2) out.push(...crest(st[0], [0, -1], u * 1.7, 'a', r, seed + 2, 'b'));
  const ys = entries.filter(Boolean).map(e => e.base - u * .45);
  ys.forEach((yy, k) => { const R = G * .95, xe = x + G * 1.5 + R, col = k % 2 ? 'b' : 'a';
    out.push(ph([[x, yy], [xe - R, yy + (r() - .5) * .2]], 'a', seed + 10 + k, { w: .45 * 1.15 }), ...eyeAt([xe, yy], R, col, r, seed + 20 + k, L >= 3, col)); });
  if (L >= 1) out.push(...strung(st, 1, r, seed + 30, { runs: L >= 2 ? null : .4, pend: L >= 2 ? .3 : 0, lead: 2, tail: 3, skip: p => ys.some(yy => Math.abs(p[1] - yy) < G * 1.6) }));
  return out;
}
const frames = { quote: quoteFrame, figure: figureFrame, code: codeFrame, pull: pullFrame, aside: asideFrame, nav: navFrame };

// ---- the style -------------------------------------------------------------------------------------------------------------------
export const choirbook = { staff: 'on', label: 'Choir book', pair: ['red', 'blue'], alternate: true, minGap: 1.4, terms: [1, 0, 0, 0, 0],
  // the paint as the drop's (minium, azurite), the hairline the drop's penwork ink (a fine pen's line reads lighter than the
  // paint); the notes in the book's brown-black
  ink: { red: { solid: PIGMENTS.minium.rgb, hair: INKS.azurite }, blue: { solid: PIGMENTS.azurite.rgb, hair: INKS.minium }, black: { solid: [44, 34, 27], hair: [58, 46, 36] }, flesh: { solid: [120, 52, 40], hair: [120, 52, 40] } },
  // dark (designed, not lifted): the pigments as they read on a stained or black leaf, brighter and more saturated than on
  // parchment, vermilion toward the page's own rubric, azurite lifted to a clear ultramarine; the hairlines the drop's dark
  // penwork; 'f' the letters' deep ground coat
  inkDark: { red: { solid: [232, 98, 62], hair: INKS_DARK.azurite }, blue: { solid: [78, 118, 238], hair: INKS_DARK.minium }, black: { solid: [222, 212, 196], hair: [214, 204, 188] }, flesh: { solid: [74, 40, 74], hair: [74, 40, 74] } },
  setup: seed => { const r = stream(seed, 'choirbook'); return { kinds: pickKinds(r, FILLERS, 2) }; },
  kinds: (v, rich) => rich < .125 ? ['bare'] : rich < .375 ? ['pearls', 'pendants'] : v.kinds,
  paraph, filler, breakMark, initial, frames,
  // (the site's Adjust sets `staff` on the module, { mod: true }; the store keeps a drawing a setting)
  get variant() { return 'staff=' + (choirbook.staff ?? 'on'); } };
STYLES.choirbook = choirbook;
export default choirbook;
