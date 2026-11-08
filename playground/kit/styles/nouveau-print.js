// Nouveau's colour, printed as the plates were: Grasset's La plante (1896) and the Combinaisons ornementales (1901) are
// chromolithographs, one stone a colour, each colour a flat coat with the stone's grain in it, laid a little off
// register, the key (the dark line) printed last over the seams. A Plate collects shapes in their painting order, each in
// one ink; render() turns every ink into a stone: what that ink covers, knocked out where a later shape lies over it (so a
// leaf behind a petal is not printed under it), each shape trapped (grown a little) so the slip never opens a gap, the
// stone's grain and a ragged edge laid in, and the whole stone slipped by a fraction of a px; then each stone is poured into
// the ink engine (kit/inkletter.js inkLetter: the ink creeps into the paper's fibre at its edge and dries), the key last
// and crisp. Without WebGL2 the engine lays each stone flat.
//   const P = new Plate(); P.fill('leaf', path, { cut, rule }); P.line(path)   render(P, bake, { dpr, pal, seed, box, slip, res })
import { inkLetter } from '../inkletter.js';
import { inkWrite, washPour, lineInto } from './nouveau-ink.js';
import { noise2, stream } from '../marks.js';

export class Plate {
  constructor() { this.items = []; }
  // a shape in an ink; cut: { path, w } knocks a channel (the path filled and stroked w wide) out of what is already laid in
  // this ink (and of this shape); rule: 'evenodd' for a ribbon
  fill(col, path, o = {}) { this.items.push({ col, path, rule: o.rule ?? 'nonzero', cut: o.cut, knock: o.knock ?? col !== 'k', trap: o.trap, S: o.S, at: o.at, reach: o.reach }); return this; }
  line(path, o = {}) { return this.fill(o.col ?? 'k', path, { rule: 'evenodd', ...o, knock: false }); }
  get inks() { const s = []; for (const it of this.items) if (!s.includes(it.col)) s.push(it.col); return s; }
}
const rgbOf = s => Array.isArray(s) ? s : s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);

// one ink's stone: coverage on a grid (res cells a px) over box, with its slip
export function stone(P, col, box, res, slip, trap) {
  const [x0, y0, x1, y1] = box, w = Math.ceil((x1 - x0) * res), h = Math.ceil((y1 - y0) * res);
  const g = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
  g.setTransform(res, 0, 0, res, (slip[0] - x0) * res, (slip[1] - y0) * res); g.lineJoin = 'round';
  let any = false;
  for (const it of P.items) {
    if (it.col === col) { any = true; g.globalCompositeOperation = 'source-over'; g.fillStyle = g.strokeStyle = '#000'; g.fill(it.path, it.rule);
      const t = it.trap ?? trap; if (t > 0 && it.rule !== 'evenodd') { g.lineWidth = t * 2; g.stroke(it.path); } }
    else if (it.knock && col !== 'k' && any) { g.globalCompositeOperation = 'destination-out'; g.fill(it.path, it.rule); }
    if (it.cut && it.col === col) {   // (the channel is the shape's own: it takes back this ink only, the shapes laid before it in it too)
      g.globalCompositeOperation = 'destination-out'; g.fill(it.cut.path); g.lineWidth = it.cut.w; g.stroke(it.cut.path); }
  }
  if (!any) return null;
  const d = g.getImageData(0, 0, w, h).data, M = new Float32Array(w * h); for (let i = 0; i < w * h; i++) M[i] = d[i * 4 + 3] / 255;
  return { M, w, h, x0, y0, res };
}
// the stone's grain: the colour a flat coat, a slow swell in its density and the crayon's fine tooth, its edge a little
// ragged; the engine pools ink at a pour's rim, which a lithographed colour has not, so that is taken back out
export function grain(L, seed, amt = 1) {
  const { M, w, h, x0, y0, res } = L, B = blur(M, w, h, Math.max(1, Math.round(.5 * res))), rag = noise2(seed ^ 0x2a), slow = noise2(seed ^ 0x51), tooth = noise2(seed ^ 0x77);
  const O = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, b = B[q]; if (b <= 0) continue;
    const x = x0 + i / res, y = y0 + j / res, e = b - .5 + .22 * amt * (rag(x / 1.7, y / 1.7) - .5); O[q] = Math.max(0, Math.min(1, e * 3 + .5)); }
  const R = Math.round(1.6 * res), Bl = blur(blur(O, w, h, R), w, h, R);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i; if (O[q] <= 0) continue;
    const x = x0 + i / res, y = y0 + j / res, rim = Math.max(0, 1 - Bl[q]) * 1.6;
    // (the medium shows a full coat above ~.55 of coverage: the grain is kept below that, where it reads)
    const v = .74 + amt * (.05 * (slow(x / 13, y / 13) - .5) * 2 + .035 * (tooth(x / .6, y / .6) - .5) * 2);
    O[q] *= v / (1 + .38 * rim * rim); }
  return { ...L, M: O };
}
// pochoir: the stencil brush dabbed straight down through the cut, so the colour is a mottle of round dabs, a little
// heavier at the stencil's edge where the brush worked it in; the edge a little ragged where the stencil lifted and
// colour crept under it
function pochoirTex(L, seed) {
  const { M, w, h, x0, y0, res } = L, B = blur(M, w, h, Math.max(1, Math.round(.6 * res))), rag = noise2(seed ^ 0x19), dab = noise2(seed ^ 0x33), dab2 = noise2(seed ^ 0x4f), O = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, b = B[q]; if (b <= 0) continue; const x = x0 + i / res, y = y0 + j / res;
    O[q] = Math.max(0, Math.min(1, (b - .5 + .2 * (rag(x / 1.5, y / 1.5) - .5) + .1 * (rag(x / 5, y / 5 + 40) - .5)) * 2.6 + .5)); }
  const R = Math.round(1.4 * res), Bl = blur(blur(O, w, h, R), w, h, R);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i; if (O[q] <= 0) continue; const x = x0 + i / res, y = y0 + j / res, rim = Math.max(0, 1 - Bl[q]) * 1.6;
    O[q] *= (.54 + .15 * (dab(x / 1.1, y / 1.1) - .5) * 2 + .1 * (dab2(x / 3.2, y / 3.2) - .5) * 2 + .1 * rim) / (1 + .2 * rim * rim); }
  return { ...L, M: O };
}
export function blur(A, w, h, r) {
  if (r < 1) return A; const T = new Float32Array(w * h), O = new Float32Array(w * h), k = 2 * r + 1;
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += A[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) { T[y * w + x] = s / k; s += A[y * w + Math.min(w - 1, x + r + 1)] - A[y * w + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += T[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) { O[y * w + x] = s / k; s += T[Math.min(h - 1, y + r + 1) * w + x] - T[Math.max(0, y - r) * w + x]; } }
  return O;
}
// bake: a 2D context whose device px are page px × dpr, with no transform of its own (as rubricate's bake)
export function render(P, bake, { dpr = 2, pal, seed = 1, box, slip = .6, trap = .45, res = Math.max(2, dpr), order, keys = ['k'], grainAmt = 1, pens = null, wash = null, brush = 0, texture = 'litho' } = {}) {
  const r = stream(seed, 'register'), inks = order ? order.filter(c => P.inks.includes(c)) : P.inks.filter(c => c !== 'k').concat(P.inks.includes('k') ? ['k'] : []);
  for (const col of inks) {
    const key = keys.includes(col), a = r() * Math.PI * 2, sl = key ? [0, 0] : [Math.cos(a) * slip, Math.sin(a) * slip];
    // written: an ink whose lines are pen strokes (S) is written by the pen; whatever else is in it (a seed) is poured
    if (pens?.includes(col)) { const S = P.items.filter(it => it.col === col && it.S).map(it => it.S);
      if (S.length && inkWrite(bake, S, rgbOf(pal[col]), { dpr, box, seed, brush })) { const rest = new Plate(); rest.items = P.items.filter(it => !(it.col === col && it.S)); const L = stone(rest, col, box, res, [0, 0], 0); if (L) inkLetter(bake, { ...L, wet: .1, dry: .1 }, rgbOf(pal[col]), { dpr }); continue; } }
    const L = stone(P, col, box, res, sl, key ? 0 : trap); if (!L) continue;
    // watercolour: the line laid while some washes still stand wet (wash.damp: those inks; a slow noise decides which
    // stretches of them the painter had not let dry), so there it bleeds
    if (wash && col === 'k' && wash.damp) { const dm = new Float32Array(L.w * L.h), nz = noise2(seed ^ 0x3d);
      for (const c of wash.damp) { const W = stone(P, c, box, res, [0, 0], 0); if (W) for (let q = 0; q < dm.length; q++) dm[q] = Math.max(dm[q], W.M[q]); }
      for (let j = 0; j < L.h; j++) for (let i = 0; i < L.w; i++) { const q = j * L.w + i, v = nz((L.x0 + i / res) / 22, (L.y0 + j / res) / 22); dm[q] *= Math.max(0, Math.min(1, (v - .42) * 5)); }
      if (lineInto(bake, L, dm, rgbOf(pal[col]), { dpr })) continue; }
    if (wash && !key) { const o = wash[col] ?? {}; washPour(bake, L, rgbOf(pal[col]), { dpr, seed: seed + col.charCodeAt(0) * 7 + col.length, ...wash.all, ...o }); continue; }
    const M = key ? L : texture === 'pochoir' ? pochoirTex(L, seed + col.charCodeAt(0) * 13) : grain(L, seed + col.length * 131 + col.charCodeAt(0), grainAmt);
    inkLetter(bake, { ...M, wet: key ? .05 : .08, dry: key ? .18 : .1 }, rgbOf(pal[col]), { dpr });
  }
}
