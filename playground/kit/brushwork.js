// Brushwork: a shape painted as a painter fills it, after the author's pie-site js/painter.js. The strokes follow the
// shape's own axis (the structure tensor of its distance field: along a letter's limb, round its bowl), laid over a
// flat underpainting in two passes, mids then lights, each stroke a few bristle hairs that thin and skip as the brush
// runs dry; modelled the medieval way, dark where the form turns away from the light, light where it faces it, then
// lifted with fine white strokes on the lit side. Colours are mixed subtractively over the paper.
import { mulberry, noise2, PAPER, paintField } from './marks.js';

const K = (rgb, paper) => rgb.map((c, i) => -Math.log(Math.max(.02, c / paper[i])));
function blur(A, w, h, r) {
  if (r < 1) return A; const T = new Float32Array(w * h), O = new Float32Array(w * h), k = 2 * r + 1, X = x => Math.min(w - 1, Math.max(0, x)), Y = y => Math.min(h - 1, Math.max(0, y));
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += A[y * w + X(x)]; for (let x = 0; x < w; x++) { T[y * w + x] = s / k; s += A[y * w + X(x + r + 1)] - A[y * w + X(x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += T[Y(y) * w + x]; for (let y = 0; y < h; y++) { O[y * w + x] = s / k; s += T[Y(y + r + 1) * w + x] - T[Y(y - r) * w + x]; } }
  return O;
}
function distance(M, w, h) {
  const D = new Float32Array(w * h); for (let i = 0; i < w * h; i++) D[i] = M[i] > .5 ? 1e6 : 0;
  const p = (i, j, c) => { if (D[j] + c < D[i]) D[i] = D[j] + c; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!D[i]) continue; if (x) p(i, i - 1, 3); if (y) { p(i, i - w, 3); if (x) p(i, i - w - 1, 4); if (x < w - 1) p(i, i - w + 1, 4); } }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!D[i]) continue; if (x < w - 1) p(i, i + 1, 3); if (y < h - 1) { p(i, i + w, 3); if (x < w - 1) p(i, i + w + 1, 4); if (x) p(i, i + w - 1, 4); } }
  for (let i = 0; i < w * h; i++) D[i] = Math.min(D[i], 1e5) / 3; return D;
}

// M: coverage (device px, cw × ch) at page x0, y0. tones: [dark, mid, light] sRGB; light: unit vector toward the light.
export function paintShape(g, M, x0, y0, cw, ch, { tones, white = [252, 249, 240], light = [-.6, -.8], dpr = 2, seed = 1, brush = 2.2, density = 1, hatch = 1, paper = PAPER, under = null, strokes = true, whiteOnly = false } = {}) {
  const r = mulberry(seed), wob = noise2(seed ^ 0x5a), tooth = noise2(seed ^ 0x77), px = 1 / dpr;
  const D = distance(M, cw, ch), Db = blur(blur(D, cw, ch, Math.max(1, Math.round(1.5 * dpr))), cw, ch, Math.max(1, Math.round(1.5 * dpr)));
  let Dmax = 0; for (let i = 0; i < cw * ch; i++) if (D[i] > Dmax) Dmax = D[i];
  // the shape's axis: the structure tensor of its distance field, smoothed wide; strokes run across the gradient
  const Jxx = new Float32Array(cw * ch), Jxy = new Float32Array(cw * ch), Jyy = new Float32Array(cw * ch);
  for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) { const i = y * cw + x, gx = Db[i + 1] - Db[i - 1], gy = Db[i + cw] - Db[i - cw]; Jxx[i] = gx * gx; Jxy[i] = gx * gy; Jyy[i] = gy * gy; }
  const R2 = Math.max(2, Math.round(Dmax * .35));
  const Sxx = blur(blur(Jxx, cw, ch, R2), cw, ch, R2), Sxy = blur(blur(Jxy, cw, ch, R2), cw, ch, R2), Syy = blur(blur(Jyy, cw, ch, R2), cw, ch, R2);
  const at = (X, Y) => { const x = Math.round((X - x0) * dpr), y = Math.round((Y - y0) * dpr); return x < 1 || y < 1 || x >= cw - 1 || y >= ch - 1 ? -1 : y * cw + x; };
  const angle = i => .5 * Math.atan2(2 * Sxy[i], Sxx[i] - Syy[i]) + Math.PI / 2;
  // modelling: how much each point faces the light (the inward normal of the distance field against the light),
  // falling off into the body; shadow where the form turns away
  const tone = i => { const x = i % cw, y = i / cw | 0, gx = Db[i + 1] - Db[i - 1], gy = Db[i + cw] - Db[i - cw], gl = Math.hypot(gx, gy) || 1;
    const facing = (-gx / gl) * light[0] + (-gy / gl) * light[1], depth = Math.min(1, D[i] / (Dmax * .7 + 1e-6));
    return Math.min(1, Math.max(0, .5 + .42 * facing * (1 - depth) + .12 * (depth - .5) + .12 * (wob(x * px / 6, y * px / 6) - .5))); };
  const mix = t => { const [a, b, c] = tones, f = t < .5 ? t * 2 : (t - .5) * 2, A = t < .5 ? a : b, B = t < .5 ? b : c; return A.map((v, j) => v + (B[j] - v) * f); };
  // paint everything on its own layer, then keep only what lies in the shape (a hair's breadth over its edge)
  const L = new OffscreenCanvas(cw, ch), c = L.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr); c.lineCap = 'round';
  // underpainting: the flat mid tone, washed, so no paper shows between strokes
  if (!whiteOnly) paintField(c, M, x0, y0, cw, ch, under ?? 'rose', { dpr, seed });
  if (!whiteOnly) { const id = new ImageData(cw, ch); for (let i = 0; i < cw * ch; i++) if (M[i] > 0) { const t = tone(Math.min(cw * ch - cw - 2, Math.max(cw + 1, i))), col = mix(t * .8 + .1);
      id.data[i * 4] = col[0]; id.data[i * 4 + 1] = col[1]; id.data[i * 4 + 2] = col[2]; id.data[i * 4 + 3] = 255 * M[i] * .9; }
    const t2 = new OffscreenCanvas(cw, ch); t2.getContext('2d').putImageData(id, 0, 0); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(t2, 0, 0); c.restore(); }
  // a stroke: walk the axis field, then lay a few hairs side by side that thin and skip as the brush dries
  const stroke = (sx, sy, len, w, col, alpha) => {
    const pts = [[sx, sy]]; let X = sx, Y = sy, prev = null; const st = .6;
    for (let d = 0; d < len; d += st) { const i = at(X, Y); if (i < 0 || M[i] < .5) break; let a = angle(i); if (prev !== null && Math.cos(a - prev) < 0) a += Math.PI; prev = a;
      X += Math.cos(a) * st; Y += Math.sin(a) * st; pts.push([X, Y]); }
    if (pts.length < 4) return;
    const hairs = 4 + (r() * 3 | 0);
    for (let k = 0; k < hairs; k++) {
      const off = (k / (hairs - 1 || 1) - .5) * w * .85, hw = w * (.3 + r() * .2), hk = (r() - .5) * 9;
      c.strokeStyle = `rgb(${col.map(v => Math.max(0, Math.min(255, v + hk)) | 0)})`;
      for (let j = 1; j < pts.length; j++) {
        const u = j / pts.length, [ax, ay] = pts[j - 1], [bx, by] = pts[j], nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny) || 1;
        if (u > .55 && tooth(bx * 1.3 + k * 7, by * 1.3) < (u - .55) * 1.6) continue;   // dry brush toward the end
        c.globalAlpha = alpha * (1 - .5 * u); c.lineWidth = hw * Math.sin(Math.PI * Math.min(1, u * 1.2 + .08)) + .15;
        c.beginPath(); c.moveTo(ax + nx / nl * off, ay + ny / nl * off); c.lineTo(bx + nx / nl * off, by + ny / nl * off); c.stroke();
      }
    }
  };
  const area = []; for (let i = 0; i < cw * ch; i++) if (M[i] > .5) area.push(i);
  const passes = [[.55, brush, 2.4, .38, 'mid'], [.3, brush * .8, 1.8, .5, 'light']];
  for (const [dens, bw, lenK, alpha, kind] of strokes ? passes : []) {
    const n = Math.round(area.length * px * px / (bw * bw * 3.2) * dens * density);
    for (let k = 0; k < n; k++) {
      const i = area[(r() * area.length) | 0], t = tone(i);
      if (kind === 'light' && t < .5) continue;
      const X = x0 + (i % cw) * px, Y = y0 + (i / cw | 0) * px, col = mix(kind === 'light' ? Math.min(1, t + .15) : t);
      stroke(X, Y, bw * (3 + r() * 4) * lenK, bw * (.8 + r() * .5), col, alpha * (.7 + r() * .3));
    }
  }
  // white: short fine strokes along the lit edge, laid the way the form runs
  if (hatch) for (let k = 0, n = Math.round(area.length * px * px / 90 * hatch); k < n; k++) {
    const i = area[(r() * area.length) | 0], x = i % cw, y = i / cw | 0, gx = Db[i + 1] - Db[i - 1], gy = Db[i + cw] - Db[i - cw], gl = Math.hypot(gx, gy) || 1;
    const facing = (-gx / gl) * light[0] + (-gy / gl) * light[1], d = D[i] * px;
    if (facing < .35 || d > 3.2 || d < 1) continue;
    const X = x0 + x * px, Y = y0 + y * px, a = angle(i), L2 = 2.5 + r() * 4;
    c.globalAlpha = .55 + r() * .35; c.strokeStyle = `rgb(${white})`; c.lineWidth = .45 + r() * .3;
    c.beginPath(); c.moveTo(X - Math.cos(a) * L2 / 2, Y - Math.sin(a) * L2 / 2); c.quadraticCurveTo(X + Math.sin(a) * .4, Y - Math.cos(a) * .4, X + Math.cos(a) * L2 / 2, Y + Math.sin(a) * L2 / 2); c.stroke();
  }
  c.globalAlpha = 1;
  // keep the paint in its shape
  const mk = new ImageData(cw, ch); for (let i = 0; i < cw * ch; i++) mk.data[i * 4 + 3] = 255 * Math.min(1, M[i] * 1.15);
  const mc = new OffscreenCanvas(cw, ch); mc.getContext('2d').putImageData(mk, 0, 0);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-in'; c.drawImage(mc, 0, 0);
  g.drawImage(L, x0, y0, cw * px, ch * px);
}

// The outlines of a mask as closed polylines in page px (marching squares at the 0.5 level, segments linked into
// loops, lightly smoothed), so the pen can draw a shape's real edge rather than a uniform stroked font outline.
export function contours(M, cw, ch, { dpr = 2, x0 = 0, y0 = 0, min = 12 } = {}) {
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
