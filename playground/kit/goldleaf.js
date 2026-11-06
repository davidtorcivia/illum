// Gold that reads as gold, from two things the eye needs: the light, and the hand.
// The light: broad soft sweeps of reflection across a gently undulating ground, dark olive where the leaf turns away
// from the light at the edges of its ground, bright and saturated in the field; colour from a ramp taken from a real
// burnished ground. The hand: the fine detail of a real one (cracks, specks, burnishing strokes), lifted as a high-pass
// layer from a sheet quilted (tools/quilt.py) out of a photograph of Met 477838 (Niccolò di Giacomo da Bologna,
// c. 1394–1402, public domain), laid upright or half-turned at a seeded offset so no two initials share it.
// A simulated cushion alone read as "1999 WordArt"; the photograph alone read as ochre paper.
import { mulberry, noise2 } from './marks.js';
import { RAMP, BOLE } from './gold.js';

const SHEET = new URL('../materials/gold/sheet-477838-1024.webp', import.meta.url).href;   // large enough that one initial never repeats it
let detail = null;
// the sheet's fine structure: luminance minus its own blur, in sRGB units
export async function loadGold() {
  if (detail) return detail;
  const bm = await createImageBitmap(await (await fetch(SHEET)).blob()), S = bm.width, c = new OffscreenCanvas(S, S).getContext('2d');
  c.drawImage(bm, 0, 0); const d = c.getImageData(0, 0, S, S).data, L = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) L[i] = .3 * d[i * 4] + .59 * d[i * 4 + 1] + .11 * d[i * 4 + 2];
  const B = box(box(L, S, S, 5), S, S, 5), H = new Float32Array(S * S); for (let i = 0; i < S * S; i++) H[i] = L[i] - B[i];
  detail = { H, S }; return detail;
}
// the edge as a soft field: a blur of the mask (shared by the shader)
export const softEdge = (M, cw, ch, W, dpr) => { const k = Math.round(W * .05 * dpr); return boxc(boxc(boxc(M, cw, ch, k), cw, ch, k), cw, ch, k); };
const ramp = e => { e = Math.min(1, Math.max(0, e)) * 6; const i = Math.min(5, e | 0), f = e - i; return RAMP[i].map((v, j) => v + (RAMP[i + 1][j] - v) * f); };
const srgb = c => 255 * (c <= .0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - .055);

// M: coverage mask (device px, cw × ch) at page x0, y0; W: the gold's size in CSS px.
export function goldLeaf(g, M, x0, y0, cw, ch, { dpr = 2, seed = 1, W = 100, light = [-.6, -.8], hand = 1, sweep = 1, bole = .4, detailScale = 1 } = {}) {
  if (!detail) throw new Error('loadGold() first');
  const r = mulberry(seed), px = 1 / dpr, n = cw * ch, D = edgeDistance(M, cw, ch);
  // the edge as a soft field (a blur of the mask, not a distance: a distance mitres at every corner)
  const Bw = softEdge(M, cw, ch, W, dpr);
  const w1 = noise2(seed ^ 0x11), w2 = noise2(seed ^ 0x22), w3 = noise2(seed ^ 0x33), bn = noise2(seed ^ 0x44);
  // a gently undulating ground: two broad octaves of height, as a burnished gesso surface is never flat
  const h = (x, y) => .9 * w1(x / (W * .7), y / (W * .7)) + .45 * w2(x / (W * .33) + 9, y / (W * .33));
  const out = new ImageData(cw, ch), o = out.data, { H, S } = detail, flip = r() < .5, ox = r() * S, oy = r() * S;
  // gradient of the edge distance, for which way each edge faces
  for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) {
    const i = y * cw + x, m = M[i]; if (m <= 0) continue;
    const X = x * px, Y = y * px, e = .7;
    // the light: tilt of the ground → where it reflects the brighter or darker side of the room
    const gx = (h(X + e, Y) - h(X - e, Y)) / (2 * e) * W * .06, gy = (h(X, Y + e) - h(X, Y - e)) / (2 * e) * W * .06;
    let E = .72 + sweep * (-(light[0] * gx + light[1] * gy) * 2.2);
    // the edge of the ground: the leaf turns down over the gesso; on the side away from the light it goes olive-dark,
    // on the side toward it it catches a brighter margin; the band's width wanders
    const d = D[i] * px, bgx = Bw[i + 1] - Bw[i - 1], bgy = Bw[i + cw] - Bw[i - cw], bl = Math.hypot(bgx, bgy) || 1;
    const facing = (-bgx / bl) * light[0] + (-bgy / bl) * light[1];   // outward normal · toward the light
    // the sweep along the edge: broad, soft, and patchy, present along some stretches and gone along others
    const near = Math.min(1, Math.max(0, (1 - Bw[i]) * 1.8)), patch = Math.max(0, w3(X / (W * .3), Y / (W * .3)) * 1.6 - .45);
    E += near * near * (facing > 0 ? .08 * facing : .62 * facing * patch);
    E -= .35 * Math.exp(-d / .7);                                      // the dark lip at the very edge
    let c = ramp(E).map(srgb);
    // the hand: real detail from the sheet, darker features stronger than light ones, as in the photograph
    const sx = ((flip ? -1 : 1) * x * detailScale + ox) % S, sy = ((flip ? -1 : 1) * y * detailScale + oy) % S;
    const hv = H[(((sy | 0) + S) % S) * S + (((sx | 0) + S) % S)] * hand, dv = hv < 0 ? hv * 1.25 : hv * .7;
    c = c.map(v => v + dv);
    // bole showing where the leaf has worn at its edge, here and there
    const worn = bole * Math.max(0, 1 - d / 1.8) * Math.max(0, bn(X / 2.5, Y / 2.5) - .58) * 3.5;
    if (worn > 0) c = c.map((v, j) => v * (1 - worn) + srgb(BOLE[j]) * worn);
    o[i * 4] = c[0] * m; o[i * 4 + 1] = c[1] * m; o[i * 4 + 2] = c[2] * m; o[i * 4 + 3] = 255 * m;
  }
  const cv = new OffscreenCanvas(cw, ch); cv.getContext('2d').putImageData(out, 0, 0);
  g.drawImage(cv, x0, y0, cw / dpr, ch / dpr);
}
function box(A, w, h, r) {
  const T = new Float32Array(w * h), O = new Float32Array(w * h), k = 2 * r + 1, X = (x) => (x + w) % w, Y = (y) => (y + h) % h;
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += A[y * w + X(x)];
    for (let x = 0; x < w; x++) { T[y * w + x] = s / k; s += A[y * w + X(x + r + 1)] - A[y * w + X(x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += T[Y(y) * w + x];
    for (let y = 0; y < h; y++) { O[y * w + x] = s / k; s += T[Y(y + r + 1) * w + x] - T[Y(y - r) * w + x]; } }
  return O;
}
function boxc(A, w, h, r) {
  const T = new Float32Array(w * h), O = new Float32Array(w * h), k = 2 * r + 1, X = x => Math.min(w - 1, Math.max(0, x)), Y = y => Math.min(h - 1, Math.max(0, y));
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += A[y * w + X(x)];
    for (let x = 0; x < w; x++) { T[y * w + x] = s / k; s += A[y * w + X(x + r + 1)] - A[y * w + X(x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += T[Y(y) * w + x];
    for (let y = 0; y < h; y++) { O[y * w + x] = s / k; s += T[Y(y + r + 1) * w + x] - T[Y(y - r) * w + x]; } }
  return O;
}
function edgeDistance(M, w, h) {
  const D = new Float32Array(w * h); for (let i = 0; i < w * h; i++) D[i] = M[i] > .5 ? 1e6 : 0;
  const p = (i, j, c) => { if (D[j] + c < D[i]) D[i] = D[j] + c; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!D[i]) continue;
    if (x) p(i, i - 1, 3); if (y) { p(i, i - w, 3); if (x) p(i, i - w - 1, 4); if (x < w - 1) p(i, i - w + 1, 4); } }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!D[i]) continue;
    if (x < w - 1) p(i, i + 1, 3); if (y < h - 1) { p(i, i + w, 3); if (x < w - 1) p(i, i + w + 1, 4); if (x) p(i, i + w - 1, 4); } }
  for (let i = 0; i < w * h; i++) D[i] = Math.min(D[i], 1e5) / 3;
  return D;
}
