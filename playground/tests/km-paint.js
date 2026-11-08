// Paint as a physical film, for the paint bench (tests/insular-paint.html): research in the session's paintres/physics.md.
//   1. the parchment: its colour Rp and height zp (µm) as fields in millimetres — cockle, the scraper's streaks, the hair
//      follicles in their small groups (pits, a little browner);
//   2. the deposit: each paint ink's coverage from the Sheet, laid as a film H µm thick with the brush's marks in it
//      (anisotropic: long along the stroke, short across it), then LEVELLED as a film levels before it sets (Orchard: a ripple
//      of wavelength λ decays with (λ)^-4 and with the film's thickness cubed), within the paint's own extent; its thickness
//      measured from the rough skin, so it lies thicker in the pits and thinner on the high points;
//   3. the optics: two-constant Kubelka–Munk, bottom up over the parchment (a layer's R and T from K, S and its thickness),
//      the ink an absorbing layer (S ≈ 0), the surface by Saunderson, a faint veil off a lean paint's surface.
// Every variation has a cause. CPU, per pixel; for the bench only (a WebGL2 pass when the look is settled).
import { noise2, hash2 } from '../kit/marks.js';

const lin = c => c.map(v => (v / 255) ** 2.2), srgb = v => Math.round(255 * Math.max(0, Math.min(1, v)) ** (1 / 2.2));
const K1 = .04, K2 = .5;
// the colour seen (after the surface) back to the reflectance inside it (Saunderson inverted), so a full coat shows the
// colour asked for
const inside = (Rs, veil) => { const r = Math.max(1e-4, Rs - veil); return r / ((1 - K1) * (1 - K2) + K2 * r); };
const surface = (R, veil) => (1 - K1) * (1 - K2) * R / (1 - K2 * R) + veil;

function box(A, w, h, r) {   // one box pass, both axes (three make a Gaussian)
  if (r < 1) return A.slice(); const T = new Float32Array(w * h), O = new Float32Array(w * h), k = 2 * r + 1;
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += A[y * w + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { T[y * w + x] = s / k; s += A[y * w + Math.min(w - 1, x + r + 1)] - A[y * w + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += T[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { O[y * w + x] = s / k; s += T[Math.min(h - 1, y + r + 1) * w + x] - T[Math.max(0, y - r) * w + x]; } }
  return O; }
const gauss = (A, w, h, sigmaPx) => { const r = Math.max(0, Math.round(sigmaPx * .9)); return r < 1 ? A.slice() : box(box(box(A, w, h, r), w, h, r), w, h, r); };

// ---- the parchment ------------------------------------------------------------------------------------------------------------
export function parchment(w, h, mmPx, { seed = 3, colour = [241, 232, 213] } = {}) {
  const zp = new Float32Array(w * h), Rp = new Float32Array(w * h * 3), base = lin(colour);
  const ck = noise2(seed), ck2 = noise2(seed + 1), sc = noise2(seed + 2), mt = noise2(seed + 3), cell = 1.4;   // mm
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, x = i * mmPx, y = j * mmPx;
    // cockle (broad waves) and the scraper's streaks (long, shallow, one way across the sheet)
    let z = 18 * (ck(x / 30, y / 30) - .5) + 8 * (ck2(x / 9, y / 9) - .5) + 3.5 * (sc(x / 26 + y / 90, y / 2.6 - x / 40) - .5);
    // follicles: in each 1.4 mm cell, by its hash, a small group of 0–4 pits ~.12 mm across, 10–16 µm deep
    let pit = 0; const ci = Math.floor(x / cell), cj = Math.floor(y / cell);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = ci + di, b = cj + dj, n = Math.floor(hash2(a, b, seed) * 5) - 1;
      for (let k = 0; k < n; k++) { const px = (a + .2 + .6 * hash2(a, b, seed + 10 + k)) * cell, py = (b + .2 + .6 * hash2(a, b, seed + 20 + k)) * cell, r = .05 + .035 * hash2(a, b, seed + 30 + k), d = Math.hypot(x - px, y - py);
        if (d < r * 1.6) pit = Math.max(pit, Math.exp(-((d / r) ** 2))); } }
    z -= 13 * pit; zp[q] = z;
    // its colour: a slow translucency mottle; the pits a little browner
    const m = 1 + .035 * (mt(x / 7, y / 7) - .5) * 2;
    Rp[q * 3] = base[0] * m * (1 - .07 * pit); Rp[q * 3 + 1] = base[1] * m * (1 - .09 * pit); Rp[q * 3 + 2] = base[2] * m * (1 - .14 * pit); }
  return { zp, Rp };
}

// ---- deposit and levelling ------------------------------------------------------------------------------------------------------
// M: coverage 0..1; dir(x, y) -> the stroke's heading there (radians) or a constant; H: a full coat (µm); marks: the brush
// marks' strength before levelling; lam: the levelling cut-off (mm; ripples shorter than it level out).
export function film(M, zp, w, h, mmPx, { H = 35, marks = .55, along = 3, across = .3, dir = 0, lam = 1.4, seed = 1, load = null } = {}) {
  const n1 = noise2(seed), n2 = noise2(seed + 7), h0 = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i; if (M[q] <= 0) continue; const x = i * mmPx, y = j * mmPx, a = typeof dir === 'function' ? dir(x, y) : dir;
    const u = x * Math.cos(a) + y * Math.sin(a), v = -x * Math.sin(a) + y * Math.cos(a);
    const nb = .65 * (n1(u / along, v / across) - .5) * 2 + .35 * (n2(u / (along * .4), v / (across * .6)) - .5) * 2;
    h0[q] = H * (load ? load(x, y) : 1) * (1 + marks * nb); }
  // levelling within the paint's own extent: the free surface s = zp + h0, split into octaves (normalised blurs inside the
  // mask), each scaled by Orchard's g(λ) = exp(-(λc/λ)^4 (h/H)^3), summed again; the thickness is the levelled surface over
  // the skin
  const s = new Float32Array(w * h); for (let q = 0; q < s.length; q++) s[q] = (zp[q] + h0[q]) * M[q];
  const sig = [.04, .08, .16, .32, .64, 1.28, 2.56];
  const Mb = sig.map(sg => gauss(M, w, h, sg / mmPx)), Sb = sig.map(sg => gauss(s, w, h, sg / mmPx));
  const at = k => q => Mb[k][q] > 1e-4 ? Sb[k][q] / Mb[k][q] : 0;
  const out = new Float32Array(w * h);
  for (let q = 0; q < out.length; q++) { if (M[q] <= 0) continue; const hr = Math.max(.2, h0[q] / H) ** 3;
    let v = at(sig.length - 1)(q), prev = s[q] / Math.max(1e-4, M[q]);
    for (let k = 0; k < sig.length; k++) { const B = at(k)(q), band = prev - B, l = sig[k] * 4, g = Math.exp(-((lam / l) ** 4) * hr); v += band * g; prev = B; }
    // (v: the levelled free surface; the film reaches from the skin up to it)
    out[q] = Math.max(0, v - zp[q]) * Math.min(1, M[q] * 1.4); }
  return out;
}

// ---- optics ---------------------------------------------------------------------------------------------------------------------
// a pigment: { colour (its masstone, as seen), S (scattering per µm, per band or one), veil (the lean surface's whiteness) };
// an ink: { colour (as seen over the parchment at full strength), ink: true }
export function pigment(p, Rp0) {
  if (p.ink) { const c = lin(p.colour); return { ink: true, kd: c.map((v, k) => -.5 * Math.log(Math.max(1e-4, v) / Rp0[k])) }; }
  const veil = Math.min(p.veil ?? .02, Math.min(...lin(p.colour)) * .4), Rinf = lin(p.colour).map(v => inside(v, veil)), S = Array.isArray(p.S) ? p.S : [p.S, p.S, p.S];
  return { K: Rinf.map((r, k) => S[k] * (1 - r) ** 2 / (2 * r)), S, veil };
}
// layers: [{ pig (from pigment()), d (Float32Array: thickness µm, or ink strength 0..1) }], bottom first
export function compose(Rp, layers, w, h) {
  const out = new Float32Array(w * h * 3);
  for (let q = 0; q < w * h; q++) for (let k = 0; k < 3; k++) {
    let R = inside(Rp[q * 3 + k], 0), veil = 0;
    for (const { pig, d } of layers) { const t = d[q]; if (!(t > 0)) continue;
      if (pig.ink) { const T = Math.exp(-pig.kd[k] * t); R *= T * T; veil *= T; continue; }
      const K = pig.K[k], S = pig.S[k], a = 1 + K / S, b = Math.sqrt(a * a - 1), x = b * S * t, sh = Math.sinh(x), ch = Math.cosh(x), c = a * sh + b * ch, Rl = sh / c, Tl = b / c;
      R = Rl + Tl * Tl * R / (1 - Rl * R); veil = pig.veil * (1 - Math.exp(-t * S * .8)); }
    out[q * 3 + k] = surface(R, veil); }
  return out;
}
export function toImage(out, w, h) { const im = new ImageData(w, h); for (let q = 0; q < w * h; q++) { im.data[q * 4] = srgb(out[q * 3]); im.data[q * 4 + 1] = srgb(out[q * 3 + 1]); im.data[q * 4 + 2] = srgb(out[q * 3 + 2]); im.data[q * 4 + 3] = 255; } return im; }
export { lin };
