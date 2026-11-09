// The smoke-and-mirrors control for the paint bench: the same geometry, no simulation. Flat colours pulled to the master's
// dull palette, laid one over another (alpha, sRGB), and a few cheap perceptual tricks, each with a stated cause:
//   one gentle slow swell of tone per region (the painter's load), the tint a hair off register (laid in a second pass),
//   paint stopping short of the line (geometry, given by the caller), a few hand-placed losses at causal spots (edges, stroke
//   ends), a faint warm falloff across the piece (light and the page's handling), and one soft optic over all (a camera's
//   softness, which is also how the reader's eye takes a page).
import { noise1, hash2 } from '../kit/marks.js';
import { blur } from './km-paint.js';

// the master's colours, as seen (white-balanced on our vellum): medians of the fitted regions (scratchpad paintv2/fit.json)
export const FLAT = { vellum: [241, 232, 213], ink: [52, 32, 26], dark: [26, 16, 14], knot: [113, 115, 129], redlead: [172, 102, 67],
  orpiment: [189, 151, 96], blue: [76, 93, 129], reserve: [226, 214, 190] };

// regions bottom first: { cov: Float32Array 0..1, col: [r, g, b], swell?: (x, y) -> -1..1, shift?: [dx, dy] mm }
// losses: [[x, y, r]] mm, each a small irregular hole to the vellum in what lies above it
export function flat(G, regions, { losses = [], soft = .05, warm = .05, seed = 1 } = {}) {
  const { w, h, n } = G, R = new Float32Array(n), Gc = new Float32Array(n), B = new Float32Array(n), V = FLAT.vellum;
  for (let q = 0; q < n; q++) { R[q] = V[0]; Gc[q] = V[1]; B[q] = V[2]; }
  const hole = new Float32Array(n);
  losses.forEach(([cx, cy, r], k) => { const ph = hash2(k, seed, 1) * 6.28;
    for (let j = Math.max(0, Math.floor((cy - 2 * r - G.y0) * G.pxmm)); j < Math.min(h, (cy + 2 * r - G.y0) * G.pxmm); j++) for (let i = Math.max(0, Math.floor((cx - 2 * r - G.x0) * G.pxmm)); i < Math.min(w, (cx + 2 * r - G.x0) * G.pxmm); i++) {
      const dx = G.x(i) - cx, dy = G.y(j) - cy, a = Math.atan2(dy, dx), rr = r * (1 + .25 * Math.cos(3 * a + ph) + .12 * Math.cos(5 * a - ph)), d = Math.hypot(dx, dy);
      hole[j * w + i] = Math.max(hole[j * w + i], Math.max(0, Math.min(1, (rr - d) * G.pxmm + .5))); } });
  for (const g of regions) { const sx = g.shift ? g.shift[0] * G.pxmm : 0, sy = g.shift ? g.shift[1] * G.pxmm : 0;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i;
      let c = g.cov[q]; if (sx || sy) { const fi = Math.min(w - 1.001, Math.max(0, i - sx)), fj = Math.min(h - 1.001, Math.max(0, j - sy)), i0 = Math.floor(fi), j0 = Math.floor(fj), u = fi - i0, v = fj - j0, b = j0 * w + i0; c = (g.cov[b] * (1 - u) + g.cov[b + 1] * u) * (1 - v) + (g.cov[b + w] * (1 - u) + g.cov[b + w + 1] * u) * v; }
      if (c <= 0) continue; if (g.hole !== false) c *= 1 - hole[q];
      const k = g.swell ? 1 + .045 * g.swell(G.x(i), G.y(j)) : 1;
      R[q] += (g.col[0] * k - R[q]) * c; Gc[q] += (g.col[1] * k - Gc[q]) * c; B[q] += (g.col[2] * k - B[q]) * c; } }
  // the warm falloff: a little darker and warmer away from the centre
  const cx = w / 2, cy = h / 2, rr = cx * cx + cy * cy;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, f = ((i - cx) ** 2 + (j - cy) ** 2) / rr * warm; R[q] *= 1 - f * .6; Gc[q] *= 1 - f; B[q] *= 1 - f * 1.6; }
  const s = soft * G.pxmm, [Rb, Gb, Bb] = s >= .5 ? [blur(R, w, h, s), blur(Gc, w, h, s), blur(B, w, h, s)] : [R, Gc, B];
  const im = new ImageData(w, h); for (let q = 0; q < n; q++) { im.data[q * 4] = Rb[q]; im.data[q * 4 + 1] = Gb[q]; im.data[q * 4 + 2] = Bb[q]; im.data[q * 4 + 3] = 255; }
  return im;
}
// a slow swell along a cord (one per strand): the load the painter carried
export const swell1 = (seed, scale = 6) => { const f = noise1(seed); return s => (f(s / scale) - .5) * 2; };
