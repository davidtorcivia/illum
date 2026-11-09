// The page-size paint as a Sheet printer (in place of Sheet.print → the ink engine), for tests/insular-directions.html:
// each ink's coverage from the Sheet becomes paint by the bench's rules (research/21-paint.md):
//   pen and black inks: absorbing layers in the palette's colour (thin lines read brown by their own weight);
//   pigments: brush loads over each pocket of the ink (fillLoads: depletion, seams, drags, the hairs' streaks), each load a
//     little more of one of two neighbouring mixes of the pot (per-load hue and value), composed by Kubelka–Munk;
//   dots: each a touch of the brush, a small dome, fuller after the brush was charged (a reload every 11 dots);
//   vellum inks (the reserve, dark mode's pale line): the skin itself.
// Over a flat vellum (the palette's own), with the coverage as alpha so the pieces sit on the page in light and dark.
import { Grid, PIG, fromColour, absorbing, lin, fillLoads, insideDist, compose, smooth, blur } from './insular-paint.js';
import { hash2 } from '../marks.js';

const MM = .15;   // mm per css px at the page's size
const shade = (c, k, warm = 0) => [c[0] * k * (1 + warm), c[1] * k, c[2] * k * (1 - warm)].map(v => Math.max(0, Math.min(255, v)));
const cache = new Map();
function pigs(pal, ink) {
  const key = ink + pal[ink].join(','); if (cache.has(key)) return cache.get(key);
  const c = pal[ink], r = [fromColour(c, .6), fromColour(shade(c, .93, .03), .6)]; cache.set(key, r); return r;
}
export const ROLE = { k: 'ink', gr: 'ink', v: 'vellum', l: 'vellum', d: 'dots' };   // everything else is a pigment

export function paintPrint(ctx, S, pal, opts = {}) { ctx.drawImage(paintSheet(S, pal, opts).canvas, 0, 0); }
// the piece painted onto a canvas of the Sheet's own size; grow: also each cell's moment in the making (T, 0..1): the pen
// first, along each line from where it set down (a walk through the line's own cells), then each pigment pocket by pocket in
// the order laid, spreading from where the brush touched down, then the dots touch by touch
export function paintSheet(S, pal, { order = S.order, seed = 1, grow = false, gold = 1 } = {}) {
  const { w, h, res } = S, [x0, y0, x1, y1] = S.box, G = new Grid([x0 * MM, y0 * MM, x1 * MM, y1 * MM], res / MM), n = w * h;
  if (G.w !== w || G.h !== h) { G.w = w; G.h = h; G.n = n; }
  const sub = pal.v ?? pal.l ?? [241, 232, 213], layers = [], alpha = new Float32Array(n);
  // each ink's coverage, less what the inks laid over it cover (the Sheet's inks are laid in order and hide what they cover;
  // its trap leaves a hair of the lower ink under every edge, which must stay hidden)
  const inks = order.filter(ink => S.c.get(ink) && pal[ink]), masks = inks.map(ink => { const d = S.c.get(ink).getImageData(0, 0, w, h).data, M = new Float32Array(n); for (let q = 0; q < n; q++) M[q] = d[q * 4 + 3] / 255; return M; });
  const above = new Float32Array(n);
  for (let i = inks.length - 1; i >= 0; i--) { const M = masks[i]; for (let q = 0; q < n; q++) { const v = M[q], a = above[q]; M[q] = v * (1 - a); above[q] = 1 - (1 - a) * (1 - v); } }
  for (let q = 0; q < n; q++) alpha[q] = above[q];
  for (let i = 0; i < inks.length; i++) {
    const ink = inks[i], M = masks[i]; let any = false; for (let q = 0; q < n && !any; q++) if (M[q] > .01) any = true;
    if (!any) continue;
    const role = ROLE[ink] ?? 'pigment';
    if (role === 'vellum') { if (pal[ink].join() !== sub.join()) { const tau = new Float32Array(n); for (let q = 0; q < n; q++) tau[q] = M[q] / Math.max(.5, M[q]); layers.push({ pig: fromColour(pal[ink], 4), tau }); } continue; }
    if (role === 'ink') { const tau = new Float32Array(n); for (let q = 0; q < n; q++) tau[q] = M[q] / Math.max(.5, M[q]);
 layers.push({ pig: absorbing(pal[ink]), tau }); continue; }
    if (role === 'dots') { layers.push({ pig: pigs(pal, ink)[0], tau: touches(G, M, seed) }); continue; }
    // a pigment: brush loads over its pockets, the colour by load between two mixes of the pot
    const F = fillLoads(G, M, { seed: seed + ink.charCodeAt(0) * 7, swath: 1.3, dragP: .3, thr: .3 }), [A, B] = pigs(pal, ink), ta = new Float32Array(n), tb = new Float32Array(n);
    for (let q = 0; q < n; q++) { if (!(M[q] > 0)) continue; const t = F.tau[q] / Math.max(.5, M[q]), m = .7 * F.mix[q]; ta[q] = t * (1 - m); tb[q] = t * m; }
    layers.push({ pig: A, tau: ta }, { pig: B, tau: tb });
  }
  const P = { Rp: new Float32Array(n * 3) }, s = lin(sub); for (let q = 0; q < n; q++) { P.Rp[q * 3] = s[0]; P.Rp[q * 3 + 1] = s[1]; P.Rp[q * 3 + 2] = s[2]; }
  const out = compose(G, P, layers), im = new ImageData(w, h), D = im.data;
  for (let q = 0; q < n; q++) { if (alpha[q] <= 0) continue; for (let k = 0; k < 3; k++) D[q * 4 + k] = Math.round(255 * Math.max(0, Math.min(1, out[q * 3 + k])) ** (1 / 2.2)); D[q * 4 + 3] = Math.round(alpha[q] * 255); }
  const c = new OffscreenCanvas(w, h); c.getContext('2d').putImageData(im, 0, 0);
  return { canvas: c, T: grow ? times(G, inks.map((ink, i) => ({ ink, M: masks[i], role: ROLE[ink] ?? 'pigment' }))) : null };
}
// the making's clock per cell: walks through each ink's coverage (breadth-first, 4-neighbour) from each part's first cell
function times(G, L) {
  const { w, h, n } = G, T = new Float32Array(n).fill(2), seen = new Uint8Array(n), Q = new Int32Array(n), Dd = new Int32Array(n), px = 1 / G.pxmm;
  // An ink is the pen where it is thin and a ground where it is broad (Lindisfarne's and Durrow's black is both: the line
  // round the letter and the panels' black between the strands): the thin part is drawn with the pen, first, along its
  // path; the broad part painted as a ground, after the colours, from where its brush touched down.
  const jobs = [];
  for (const l of L) {
    if (l.role === 'ink' || l.role === 'vellum') { const D = insideDist(G, l.M), K = new Float32Array(n); for (let q = 0; q < n; q++) K[q] = D[q] >= 1.8 * px ? 1 : 0;
      const B = blur(K, w, h, 1.6), pen = new Float32Array(n), gr = new Float32Array(n); for (let q = 0; q < n; q++) { if (B[q] > .12) gr[q] = l.M[q]; else pen[q] = l.M[q]; }
      jobs.push({ M: pen, ph: [0, .3], span: 1.2 }, { M: gr, ph: [.6, .84], span: 1.6 }); }
    else if (l.role === 'dots') jobs.push({ M: l.M, ph: [.84, 1], span: 0 });
    else jobs.push({ M: l.M, pig: true, span: 2.2 }); }
  const pig = jobs.filter(j => j.pig); pig.forEach((j, i) => { const k = .32 / Math.max(1, pig.length); j.ph = [.28 + i * k, .28 + (i + 1) * k + .06]; });
  for (const { M, ph: [a, b], span: sp } of jobs) {
    seen.fill(0); const parts = [];
    for (let q0 = 0; q0 < n; q0++) { if (M[q0] < .08 || seen[q0]) continue; let hd = 0, tl = 0, far = 0; Q[tl++] = q0; seen[q0] = 1; Dd[q0] = 0;
      while (hd < tl) { const q = Q[hd++], d = Dd[q]; if (d > far) far = d; const i = q % w, j = (q - i) / w;
        if (i + 1 < w && !seen[q + 1] && M[q + 1] >= .08) { seen[q + 1] = 1; Dd[q + 1] = d + 1; Q[tl++] = q + 1; }
        if (i > 0 && !seen[q - 1] && M[q - 1] >= .08) { seen[q - 1] = 1; Dd[q - 1] = d + 1; Q[tl++] = q - 1; }
        if (j + 1 < h && !seen[q + w] && M[q + w] >= .08) { seen[q + w] = 1; Dd[q + w] = d + 1; Q[tl++] = q + w; }
        if (j > 0 && !seen[q - w] && M[q - w] >= .08) { seen[q - w] = 1; Dd[q - w] = d + 1; Q[tl++] = q - w; } }
      parts.push({ cells: Q.slice(0, tl), far }); }
    // (in the dots' ink, a part far longer than a touch is a line the pen wrote in red — Durrow's wave scroll: it is
    // written along its length from where it began, over the piece's whole time, not laid at once as a dot is)
    const long = p => sp === 0 && p.far * px > 3, lines = parts.filter(long), touches = parts.filter(p => !long(p));
    for (const p of lines) for (const q of p.cells) T[q] = Math.min(T[q], .04 + .9 * Dd[q] / p.far);
    const N = touches.length; touches.forEach((p, k) => { const t0 = a + (b - a) * k / Math.max(1, N), span = (b - a) / Math.max(1, N) * sp;
      for (const q of p.cells) T[q] = Math.min(T[q], t0 + (p.far ? span * Dd[q] / p.far : 0)); }); }
  // (a cell under-covered by every ink takes its neighbours' moment, a few passes: no rim lingers to the end)
  // (each pass reads the last one's moments, not its own: in place, an edge's earliest moment ran along a whole row of rim
  // in one pass, and a line's faint outline showed the moment it began)
  for (let it = 0; it < 4; it++) { const P = T.slice(); for (let q = 0; q < n; q++) if (P[q] > 1.5) { const i = q % w; let m = 2; if (i > 0) m = Math.min(m, P[q - 1]); if (i + 1 < w) m = Math.min(m, P[q + 1]); if (q >= w) m = Math.min(m, P[q - w]); if (q + w < n) m = Math.min(m, P[q + w]); if (m <= 1.5) T[q] = m; } }
  for (let q = 0; q < n; q++) if (T[q] > 1) T[q] = 1;
  return T;
}
// dots from their coverage: each connected dot a dome by its depth, charged by its place in the brush's reload cycle
function touches(G, M, seed) {
  const { w, h, n } = G, D = insideDist(G, M), lab = new Int32Array(n).fill(-1), tau = new Float32Array(n), st = []; let k = 0;
  for (let q0 = 0; q0 < n; q0++) { if (M[q0] < .3 || lab[q0] >= 0) continue; const px = []; st.push(q0); lab[q0] = k; let dm = 0;
    while (st.length) { const q = st.pop(); px.push(q); dm = Math.max(dm, D[q]); const i = q % w, j = (q - i) / w;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= w || jj >= h) continue; const r = jj * w + ii; if (lab[r] < 0 && M[r] >= .3) { lab[r] = k; st.push(r); } } }
    const ld = 1 - ((k % 11) / 11), t0 = 1.5 * (.75 + .35 * ld) * (.9 + .2 * hash2(k, seed, 3));
    for (const q of px) tau[q] = t0 * Math.max(.35, smooth(0, Math.max(1e-3, dm), D[q])) ** .4;
    k++; }
  for (let q = 0; q < n; q++) if (M[q] > 0 && lab[q] < 0) tau[q] = .4;   // the anti-aliased rim of a dot too small to label
  return tau;
}
