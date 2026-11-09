// The page-size paint as a Sheet printer (in place of Sheet.print → the ink engine), for tests/insular-directions.html:
// each ink's coverage from the Sheet becomes paint by the bench's rules (research/21-paint.md):
//   pen and black inks: absorbing layers in the palette's colour (thin lines read brown by their own weight);
//   pigments: brush loads over each pocket of the ink (fillLoads: depletion, seams, drags, the hairs' streaks), each load a
//     little more of one of two neighbouring mixes of the pot (per-load hue and value), composed by Kubelka–Munk;
//   dots: each a touch of the brush, a small dome, fuller after the brush was charged (a reload every 11 dots);
//   vellum inks (the reserve, dark mode's pale line): the skin itself.
// Over a flat vellum (the palette's own), with the coverage as alpha so the pieces sit on the page in light and dark.
import { Grid, PIG, fromColour, absorbing, lin, fillLoads, insideDist, compose, smooth } from './km-paint.js';
import { hash2 } from '../kit/marks.js';

const MM = .15;   // mm per css px at the page's size
const shade = (c, k, warm = 0) => [c[0] * k * (1 + warm), c[1] * k, c[2] * k * (1 - warm)].map(v => Math.max(0, Math.min(255, v)));
const cache = new Map();
function pigs(pal, ink) {
  const key = ink + pal[ink].join(','); if (cache.has(key)) return cache.get(key);
  const c = pal[ink], r = [fromColour(c, .6), fromColour(shade(c, .93, .03), .6)]; cache.set(key, r); return r;
}
export const ROLE = { k: 'ink', gr: 'ink', v: 'vellum', l: 'vellum', d: 'dots' };   // everything else is a pigment

export function paintPrint(ctx, S, pal, { order = S.order, seed = 1 } = {}) {
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
  const c = new OffscreenCanvas(w, h); c.getContext('2d').putImageData(im, 0, 0); ctx.drawImage(c, 0, 0);
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
