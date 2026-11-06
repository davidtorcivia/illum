// Paint a drawn letter the way a Lombardic initial was painted: in a dozen decisions, not a texture (after 02-gold).
//   wash     one flat wash of the body colour over the letter (paintField: it pools a little at the rim)
//   shade    a second, darker wash in a band along every edge that faces away from the light: where the letter,
//            stepped toward the light, no longer covers it
//   tint     three or four fine strokes of a paler tint laid along the scribe's own strokes on their lit side
//            (offset curves of the ductus), each a little shorter, broken where the stroke turns from the light
//   white    a white hairline set inside the lit edge, and a shorter one beside it, landing with a bead
//   outline  the pen round the real contour, heavier on the side away from the light, a hair off the paint
// g: a context already scaled to page px (the mask's origin at 0,0). mask: from letterMask (kit/ductus.js).
// steps: which of the above to lay (all by default), so the making can be played one decision at a time.
import { pen, paintField, resample, mulberry, noise2 } from './marks.js';
import { contours } from './brushwork.js';

function blur(A, w, h, r) {
  if (r < 1) return A; const T = new Float32Array(w * h), O = new Float32Array(w * h), k = 2 * r + 1, X = x => Math.min(w - 1, Math.max(0, x)), Y = y => Math.min(h - 1, Math.max(0, y));
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += A[y * w + X(x)]; for (let x = 0; x < w; x++) { T[y * w + x] = s / k; s += A[y * w + X(x + r + 1)] - A[y * w + X(x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += T[Y(y) * w + x]; for (let y = 0; y < h; y++) { O[y * w + x] = s / k; s += T[Y(y + r + 1) * w + x] - T[Y(y - r) * w + x]; } }
  return O;
}

export const STEPS = ['wash', 'shade', 'tint', 'white', 'outline'];
export function paintLetter(g, mask, { pigment = 'lapis', shade = 'lapisShade', shadeStrength = .55, tint = [150, 176, 228], white = [252, 248, 238], ink = [36, 25, 18],
  dpr = 2, seed = 1, light = [-.6, -.8], steps = STEPS } = {}) {
  const { cw, L } = mask, W = cw / dpr, k = Math.max(.8, W / 100), on = new Set(steps), rh = mulberry(seed * 7 + 8);
  const ll = Math.hypot(...light) || 1, TL = [light[0] / ll, light[1] / ll];
  if (on.has('wash')) paintField(g, L, 0, 0, cw, cw, pigment, { dpr, seed: seed + 4 });
  if (on.has('shade')) {
    // the band is about 4% of the size wide, its inner edge drifting slowly as a brush's does
    const Sh = new Float32Array(cw * cw), sn = noise2(seed + 53), px = 1 / dpr;
    for (let y = 0; y < cw; y++) for (let x = 0; x < cw; x++) { const i = y * cw + x; if (L[i] < .5) continue;
      const s = (W * .035 + (sn(x * px / 9, y * px / 9) - .5) * W * .025) * dpr, sx = Math.round(x - TL[0] * s), sy = Math.round(y - TL[1] * s);
      Sh[i] = sx < 0 || sy < 0 || sx >= cw || sy >= cw || L[sy * cw + sx] < .5 ? 1 : 0; }
    paintField(g, blur(Sh, cw, cw, Math.round(.6 * dpr)), 0, 0, cw, cw, shade, { dpr, seed: seed + 5, strength: shadeStrength });
  }
  // runs of a curve offset from a stroke's spine toward its lit side, by a fraction of its half-width
  // only on the belly of the stroke (where it is at least `belly` of its fullest), as the brush follows the swell
  const offsetRuns = (s, frac, minLit, belly = .5) => { const P = resample(s.P, .6 * k), runs = []; let cur = [], top = 0;
    for (let i = 0; i < 41; i++) top = Math.max(top, s.press(i / 40));
    for (let i = 1; i < P.length - 1; i++) { const u = i / (P.length - 1), t = [P[i + 1][0] - P[i - 1][0], P[i + 1][1] - P[i - 1][1]], tl = Math.hypot(...t) || 1, n = [-t[1] / tl, t[0] / tl];
      const side = n[0] * TL[0] + n[1] * TL[1], hw = s.wp * .5 * s.press(u), off = Math.sign(side) * hw * frac;
      if (Math.abs(side) > minLit && hw > 1.6 * k && s.press(u) > belly * top) cur.push([P[i][0] + n[0] * off, P[i][1] + n[1] * off]); else { if (cur.length > 6) runs.push(cur); cur = []; } }
    if (cur.length > 6) runs.push(cur); return runs; };
  const body = mask.strokes.filter(s => s.body);
  if (on.has('tint')) for (const st of body) [.16, .32, .48].forEach((f, j) => { for (const run of offsetRuns(st, f, .2 + j * .08, .45 + j * .1)) {
    const a0 = run.length * (.04 + rh() * .14 + j * .06) | 0, a1 = run.length * (.66 + rh() * .3 - j * .1) | 0;
    if (a1 - a0 > 6) pen(g, run.slice(a0, a1), { w: (.55 + rh() * .25) * k, ink: tint.map((v, q) => Math.min(255, v + j * [6, 6, 4][q])), load: .8, dry: .4, start: 'taper', end: 'taper', seed: seed + 60 + a0 + j, broad: .05 }); } });
  // white: one stroke set in from the lit edge at the stroke's belly, landing with a bead; now and then a second, shorter
  if (on.has('white')) for (const st of body) [[.64, .8, .42], [.8, .5, .22]].forEach(([f, w, len], j) => { for (const run of offsetRuns(st, f, .45, .6)) {
    if (j && rh() < .55) continue;
    const n = Math.max(7, run.length * len * (.8 + rh() * .4) | 0), mid = run.length * (.42 + rh() * .16) | 0, a0 = Math.max(0, mid - n / 2 | 0), a1 = Math.min(run.length, a0 + n);
    if (a1 - a0 > 5) pen(g, run.slice(a0, a1), { w: w * k, ink: white, load: .95, dry: .25, start: 'pool', end: 'taper', seed: seed + 90 + a0 + j, broad: .05 }); } });
  if (on.has('outline')) contours(L, cw, cw, { dpr, x0: -TL[0] * .15, y0: -TL[1] * .15 }).forEach((loop, j) =>
    pen(g, [...loop, loop[0], loop[1]], { w: .6 * k, ink, seed: seed + 40 + j, start: 'cut', end: 'cut', shade: [TL[0], -TL[1]], broad: .25, load: 1 }));
}
