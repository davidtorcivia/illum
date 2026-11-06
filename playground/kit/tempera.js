// Tempera on parchment, by its measured statistics (research/08-paint.md §1.2, §3.3), the film-grain route:
// synthesize the medium's real artifacts from measurements of real ones, invent nothing.
// Measured on Met 466773 (lapis) and 463605 (vermilion): the edge is as sharp as the photograph, with no pooled rim;
// the variation is one-sided (thin paint lets the parchment through, so it only ever goes lighter); a slow mottle of
// sd ~2 L* stretched ~1.3:1 along the stroke, a fine residual of ~2-3 L*, one to three broad pale drags where the
// brush ran short, and in vermilion discrete flake losses over ~1.4% of the area. No lighting: diffuse copy photographs
// show none, and gum tempera has no relief to light.
import { noise2, mulberry } from './marks.js';

const lin = c => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
const srgb = c => 255 * (c <= .0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - .055);
const hash = (x, y, s) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2246822519) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; };
export const TEMPERA = {
  lapis: { mass: [40, 64, 142], slow: .11, fine: .045, drags: [1, 2], losses: 0, drag: [.12, .22] },
  vermilion: { mass: [204, 66, 40], slow: .07, fine: .025, drags: [0, 1], losses: .0025, drag: [.08, .14] },
};
// mk: { cw, L (coverage, device px), strokes (with P in page px, wp, press) }; mm: page px per millimetre of the
// letter's physical size (a 24 mm capital drawn 64 px tall: ~2.7). paper: sRGB of the ground.
export function temperaLetter(g, mk, { pigment = 'lapis', dpr = 2, seed = 1, mm = 2.7, paper = [244, 238, 226] } = {}) {
  const T = TEMPERA[pigment], { cw, L, strokes } = mk, px = 1 / dpr, r = mulberry(seed);
  const slowA = noise2(seed ^ 0x101), slowB = noise2(seed ^ 0x202), fineL = noise2(seed ^ 0x303), lossN = noise2(seed ^ 0x404), dragN = noise2(seed ^ 0x505);
  // stroke coordinates: each pixel's nearest point on the nearest body stroke gives (u along, v across, half-width)
  const body = strokes.filter(s => s.wp > 2.5).map(s => { const P = s.P, S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const tracks = Array.from({ length: T.drags[0] + Math.round(r() * (T.drags[1] - T.drags[0])) }, () => ({ v: (r() - .5) * 1.1, w: (.35 + r() * .45) * mm, depth: T.drag[0] + r() * (T.drag[1] - T.drag[0]), on: [r() * .3, .5 + r() * .5], ph: r() * 50 }));
    return { P, S, L: S[S.length - 1], hw: s.wp / 2, press: s.press, tracks }; });
  const out = new ImageData(cw, cw), d = out.data, mass = T.mass.map(lin), pap = paper.map(lin);
  for (let y = 0; y < cw; y++) for (let x = 0; x < cw; x++) {
    const i = y * cw + x, cov = L[i]; if (cov <= .002) continue;
    const X = x * px, Y = y * px;
    // the nearest point on the nearest body stroke, projected onto its segment so u and v run smoothly
    let best = null, bd = 1e9;
    for (const s of body) for (let k = 0; k < s.P.length - 1; k++) { const a = s.P[k], b = s.P[k + 1], ex = b[0] - a[0], ey = b[1] - a[1], el = ex * ex + ey * ey || 1;
      const t = Math.max(0, Math.min(1, ((X - a[0]) * ex + (Y - a[1]) * ey) / el)), qx = a[0] + ex * t - X, qy = a[1] + ey * t - Y, dd = qx * qx + qy * qy;
      if (dd < bd) { bd = dd; best = [s, k, t]; } }
    let tau = 1.2;
    if (best) {
      const [s, k, t] = best, a = s.P[k], b = s.P[k + 1], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
      const u = s.S[k] + t * tl, v = ((X - a[0]) * -ty + (Y - a[1]) * tx) / tl, hw = s.hw * (s.press ? s.press(u / s.L) : 1) || 1;
      // the slow mottle, stretched along the stroke
      tau += T.slow * 2.2 * ((slowA(u / (2 * mm), v / (1 * mm)) - .5) * 1.4 + (slowB(u / (5 * mm) + 9, v / (2.5 * mm)) - .5) * .8);
      // pale drags: a few broad tracks where the brush laid less, wandering, coming and going along the stroke
      for (const t of s.tracks) { const f = u / s.L; if (f < t.on[0] || f > t.on[1]) continue;
        const vc = t.v * hw + (dragN(u / (6 * mm) + t.ph, 0) - .5) * hw * .5, w = t.w * (.7 + .6 * dragN(u / (3 * mm) + t.ph, 3));
        const fade = Math.min(1, (f - t.on[0]) / .08, (t.on[1] - f) / .08); tau -= t.depth * fade * Math.exp(-(((v - vc) / w) ** 2)); }
    }
    // losses: flakes of bare parchment, biased toward the letter's edges
    if (T.losses) { const ln = lossN(X / (1.3 * mm) + 7, Y / (1.3 * mm)), edge = cov < .98 || L[Math.min(cw * cw - 1, i + 3)] < .5 || L[Math.max(0, i - 3)] < .5 ? .05 : 0;
      if (ln > 1 - T.losses * 9 - edge * .5) tau = Math.min(tau, .05 + (1 - ln) * 2); }
    // a layer of this thickness over the parchment: coverage rises with thickness, never past full hiding
    const c = 1 - Math.exp(-2.6 * Math.max(0, tau));
    const fine = (fineL(X / (.25 * mm), Y / (.25 * mm)) - .5 + (hash(x, y, seed) - .5) * .7) * T.fine * (1.6 - c);
    for (let j = 0; j < 3; j++) { const v = pap[j] + (mass[j] - pap[j]) * c; d[i * 4 + j] = Math.max(0, Math.min(255, srgb(Math.max(0, v * (1 + fine))))); }
    d[i * 4 + 3] = 255 * cov;
  }
  const cv = new OffscreenCanvas(cw, cw); cv.getContext('2d').putImageData(out, 0, 0);
  g.save(); g.filter = 'blur(0.35px)'; g.drawImage(cv, 0, 0, cw * px, cw * px); g.restore();
}
