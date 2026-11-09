// The page-size paint ("cheap"): what the bench's smoke-and-mirrors control taught, kept with the two physical wins (the
// touch-dots and the vellum hairline beside every pen line, both in the geometry). No skin fields, no levelling, no
// weathering simulation: the subject's loads and pen composed by Kubelka–Munk over a flat vellum (7–13 ms at page size),
// then the cheap tricks, each with a cause: a few losses placed by hand where a stroke ended or an edge was handled, a faint
// warm falloff across the piece (light, handling), one soft optic (how the eye and a camera take a page).
import { hash2 } from '../kit/marks.js';
import { compose, flatParchment, toImage, blur } from './km-paint.js';

export function cheap(G, layers, { losses = [], soft = .04, warm = .04, seed = 1 } = {}) {
  const { w, h, n } = G, hole = new Float32Array(n);
  losses.forEach(([cx, cy, r], k) => { const ph = hash2(k, seed, 1) * 6.28;
    for (let j = Math.max(0, Math.floor((cy - 2 * r - G.y0) * G.pxmm)); j < Math.min(h, (cy + 2 * r - G.y0) * G.pxmm); j++) for (let i = Math.max(0, Math.floor((cx - 2 * r - G.x0) * G.pxmm)); i < Math.min(w, (cx + 2 * r - G.x0) * G.pxmm); i++) {
      const dx = G.x(i) - cx, dy = G.y(j) - cy, a = Math.atan2(dy, dx), rr = r * (1 + .25 * Math.cos(3 * a + ph) + .12 * Math.cos(5 * a - ph)), d = Math.hypot(dx, dy);
      hole[j * w + i] = Math.max(hole[j * w + i], Math.max(0, Math.min(1, (rr - d) * G.pxmm + .5))); } });
  const L = layers.map(l => l.kind === 'ink' || !losses.length ? l : { ...l, tau: l.tau.map((t, q) => t * (1 - .9 * hole[q])) });
  const out = compose(G, flatParchment(G), L), cx = w / 2, cy = h / 2, rr = cx * cx + cy * cy;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, f = ((i - cx) ** 2 + (j - cy) ** 2) / rr * warm; out[q * 3] *= 1 - f * .6; out[q * 3 + 1] *= 1 - f; out[q * 3 + 2] *= 1 - f * 1.6; }
  const s = soft * G.pxmm; if (s >= .5) for (let k = 0; k < 3; k++) { const c = new Float32Array(n); for (let q = 0; q < n; q++) c[q] = out[q * 3 + k]; const b = blur(c, w, h, s); for (let q = 0; q < n; q++) out[q * 3 + k] = b[q]; }
  return toImage(G, out);
}
