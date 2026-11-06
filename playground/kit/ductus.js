// Ductus: a Lombardic capital alphabet as a scribe draws it. Each letter is its strokes, in the order and direction
// the pen makes them (top to bottom, left to right, the stem before the bowl, hairlines last), each with its swell:
// { pts (control points in the unit square, Catmull–Rom), w (nominal width, unit), press (u → width multiplier),
//   body (a heavy stroke that takes modelling and white), end ('ball' for a hairline finished with a dot) }.
// The forms are read from painted Lombards on Met leaves (public domain): 466773 (A C M O P, North Italian psalter,
// early 15th c.), 466790 (round h, D; Italian antiphonary, 14th c.), 466179 (tall French A B D M N P Q R S, c. 1290),
// 466375/466376 (round E, N, Q; English royal psalter, 13th c.), 471898 (painted E G S, Italian, c. 1467–70),
// 466732 (round T) and 466729 (V; German antiphonary/gradual, 15th c.), 466792 (A). The D is the one from 02-gold.
//
// letterMask(letter, size, dpr, seed) draws the strokes with the pen into a coverage mask: { cw, L, C, strokes }.
import { pen, spline, mulberry, fnv } from './marks.js';

const cl = u => Math.min(1, Math.max(0, u));
const SIN = u => Math.sin(Math.PI * cl(u));
const sm = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// a swell: fine at both ends (a), full (a + b) at u = c; p sharpens the belly
const swell = (c = .5, a = .16, b = .96, p = 1.15) => u => a + b * SIN(u < c ? u / c * .5 : .5 + (u - c) / (1 - c) * .5) ** p;
const BOWL = swell(), STEM = u => .78 + .32 * SIN(u), HAIR = u => 1 - .5 * u, TAPER = u => 1 - .6 * u;
// a stroke that lands fine and stays full to its end (an arch coming down to its foot)
const land = (a = .18, k = .4) => u => a + (1.02 - a) * sm(0, k, u);
// a stroke that starts full and is lifted fine (a leg flicked out)
const lift = (a = .2, k = .6) => u => 1.02 - (1.02 - a) * sm(k, 1, u);

// the small things every letter wears: a flick at the head of a stem, a foot, a ball on the end of a hairline
const flickL = (x, y, s = 1) => ({ pts: [[x, y], [x - .08 * s, y - .014], [x - .14 * s, y + .02], [x - .14 * s, y + .07]], w: .026, press: HAIR, end: 'ball' });
const foot = (x, y, l = .1, r = .1) => ({ pts: [[x - l, y + .012], [x - l * .4, y - .004], [x, y], [x + r * .5, y + .004], [x + r, y + .016]], w: .032, press: u => .55 + .5 * SIN(u) });
const ball = (pts, w = .026) => ({ pts, w, press: HAIR, end: 'ball' });

export const DUCTUS = {
  A: [ // 466773: a roof from a ball on the left, the heavy limb bowed out below it, a fine right stem, a full bar
    { pts: [[.2, .205], [.3, .16], [.52, .15], [.74, .175]], w: .07, press: u => .95 - .5 * u },
    { pts: [[.44, .165], [.3, .26], [.23, .45], [.225, .66], [.25, .86]], w: .19, press: swell(.5, .35, .75), body: true },
    { pts: [[.74, .175], [.745, .5], [.75, .85]], w: .055, press: u => .8 + .3 * SIN(u) },
    { pts: [[.25, .55], [.48, .54], [.74, .535]], w: .085, press: swell(.45, .45, .6, 1) },
    ball([[.21, .2], [.16, .22], [.15, .275]]), ball([[.75, .85], [.8, .875], [.85, .845]], .03),
    foot(.25, .865, .1, .04),
  ],
  B: [
    { pts: [[.32, .17], [.31, .5], [.32, .85]], w: .12, press: STEM, body: true },
    { pts: [[.31, .18], [.5, .13], [.66, .2], [.67, .34], [.53, .46], [.36, .48]], w: .15, press: swell(.55), body: true },
    { pts: [[.38, .47], [.62, .5], [.77, .63], [.74, .79], [.56, .865], [.31, .85]], w: .19, press: swell(.45), body: true },
    flickL(.32, .17), foot(.32, .855, .1, 0),
  ],
  C: [ // 466773: the bowl, heavy at the left flank; closed by a hairline that does not touch it but at its ends
    { pts: [[.67, .22], [.52, .15], [.32, .2], [.2, .42], [.21, .64], [.32, .8], [.5, .865], [.68, .8]], w: .18, press: swell(.45), body: true },
    ball([[.67, .215], [.7, .27], [.69, .32]], .03),
    { pts: [[.68, .2], [.77, .26], [.81, .42], [.8, .6], [.76, .7]], w: .018, press: u => .7 + .5 * SIN(u), end: 'ball' },
  ],
  D: [ // 466790: the round D; its back is one stroke, a heavy slant from beyond the left shoulder down into the right
    // flank, then the bowl is closed with the left half
    { pts: [[.17, .08], [.36, .145], [.56, .21], [.72, .31], [.8, .49], [.78, .67], [.67, .815], [.5, .865]], w: .175,
      press: u => { if (u < .25) return .9 - 1.8 * u; const t = (u - .25) / .75; return .45 * (1 - t) + .12 * t + .8 * SIN(t) ** 1.1; }, body: true },
    { pts: [[.55, .21], [.36, .25], [.22, .46], [.225, .68], [.35, .835], [.52, .865]], w: .175, press: swell(.5, .12, .98), body: true },
    ball([[.175, .085], [.13, .11], [.12, .16]], .026),
  ],
  E: [ // 466375, 466367: the round E, its upper bowl closed by a hairline that the bar runs into; the foot finished with a ball
    { pts: [[.64, .175], [.47, .15], [.3, .22], [.2, .43], [.21, .64], [.32, .8], [.5, .865], [.68, .81]], w: .18, press: swell(.45, .14, .98), body: true },
    { pts: [[.64, .175], [.73, .24], [.765, .36], [.745, .49]], w: .022, press: u => .75 + .45 * SIN(u) },
    { pts: [[.22, .49], [.48, .48], [.745, .49]], w: .07, press: u => .95 - .3 * u },
    ball([[.68, .81], [.725, .77], [.735, .72]], .03),
  ],
  F: [
    { pts: [[.33, .17], [.32, .5], [.33, .86]], w: .12, press: STEM, body: true },
    { pts: [[.33, .185], [.5, .15], [.68, .16], [.78, .2]], w: .1, press: u => .3 + .8 * sm(0, .5, u) * (1 - .4 * sm(.75, 1, u)), body: true },
    ball([[.78, .2], [.8, .25], [.79, .31]], .03),
    { pts: [[.33, .5], [.48, .49], [.64, .5]], w: .075, press: TAPER },
    ball([[.64, .5], [.67, .46]], .024),
    flickL(.33, .17), foot(.33, .865, .11, .1),
  ],
  G: [ // 471898: the round body rises again on the right and turns in, a beard curling into the counter
    { pts: [[.68, .22], [.52, .15], [.32, .2], [.2, .42], [.21, .64], [.32, .8], [.5, .865], [.68, .8], [.745, .6]], w: .18, press: swell(.42, .18, .92), body: true },
    ball([[.68, .215], [.72, .25], [.725, .3]], .03),
    { pts: [[.75, .58], [.66, .52], [.55, .53], [.5, .6]], w: .045, press: HAIR, end: 'ball' },
  ],
  H: [ // 466790: the uncial h, its arch heavy at the flank and its leg turned out to a ball
    { pts: [[.3, .13], [.29, .5], [.3, .86]], w: .12, press: STEM, body: true },
    { pts: [[.3, .5], [.44, .38], [.62, .39], [.74, .54], [.73, .74], [.67, .86]], w: .18, press: swell(.5, .12, 1), body: true },
    ball([[.66, .86], [.75, .885], [.81, .84]], .035),
    flickL(.3, .13), foot(.3, .865, .1, .08),
  ],
  I: [
    { pts: [[.5, .16], [.49, .5], [.5, .85]], w: .14, press: u => .82 + .3 * SIN(u), body: true },
    flickL(.5, .16, 1.1), ball([[.5, .16], [.58, .148], [.63, .17]], .022), foot(.5, .855, .12, .12),
  ],
  J: [
    { pts: [[.55, .16], [.55, .5], [.52, .74], [.42, .86], [.27, .83]], w: .14, press: u => (.82 + .3 * SIN(u * 1.4)) * (1 - .8 * sm(.6, 1, u)), body: true },
    ball([[.27, .83], [.23, .77], [.25, .71]], .03),
    flickL(.55, .16, 1.1), ball([[.55, .16], [.63, .148], [.68, .17]], .022),
  ],
  K: [
    { pts: [[.31, .16], [.3, .5], [.31, .86]], w: .12, press: STEM, body: true },
    ball([[.74, .17], [.68, .18]], .03),
    { pts: [[.68, .18], [.56, .3], [.43, .44], [.34, .49]], w: .075, press: u => .4 + .6 * u },
    { pts: [[.37, .48], [.54, .55], [.64, .7], [.68, .83], [.8, .875]], w: .16, press: u => (.25 + .85 * SIN(u * .85 + .05)) * (1 - .55 * sm(.8, 1, u)), body: true },
    ball([[.8, .875], [.86, .84]], .028),
    flickL(.31, .16), foot(.31, .865, .1, .07),
  ],
  L: [
    { pts: [[.33, .15], [.32, .5], [.34, .82]], w: .13, press: STEM, body: true },
    { pts: [[.3, .845], [.5, .87], [.68, .85], [.78, .78]], w: .1, press: u => .6 + .5 * SIN(u * .9) - .4 * sm(.7, 1, u), body: true },
    ball([[.78, .78], [.8, .72], [.78, .67]], .03),
    flickL(.33, .15),
  ],
  M: [ // 466773: the round M, an O with a stem through it; the arcs come in again at the foot, which is one swash
    { pts: [[.5, .2], [.31, .19], [.18, .35], [.165, .56], [.22, .74], [.33, .835]], w: .17, press: swell(.5, .12, .95), body: true },
    { pts: [[.5, .19], [.495, .5], [.5, .835]], w: .1, press: u => .62 + .45 * u, body: true },
    { pts: [[.5, .2], [.69, .19], [.82, .35], [.835, .56], [.78, .74], [.67, .835]], w: .17, press: swell(.5, .12, .95), body: true },
    ball([[.16, .845], [.115, .83], [.11, .79]], .024),
    { pts: [[.16, .845], [.32, .86], [.5, .85], [.68, .86], [.84, .845], [.89, .8]], w: .026, press: u => .7 + .5 * SIN(u), end: 'ball' },
  ],
  N: [ // 466179, 466375: the uncial n, the arch landing fine on the stem and coming down full to its foot
    { pts: [[.3, .17], [.29, .5], [.3, .86]], w: .12, press: STEM, body: true },
    { pts: [[.3, .3], [.42, .18], [.6, .165], [.72, .3], [.74, .55], [.73, .855]], w: .17, press: land(.14, .45), body: true },
    ball([[.73, .855], [.8, .875], [.84, .835]], .03),
    flickL(.3, .17), foot(.3, .865, .1, .08),
  ],
  O: [ // 466773: two strokes, both down from the top; heavy at the flanks, hairline at the top and foot
    { pts: [[.53, .15], [.33, .2], [.2, .42], [.215, .66], [.34, .82], [.52, .865]], w: .175, press: swell(.52), body: true },
    { pts: [[.47, .15], [.665, .19], [.8, .37], [.795, .61], [.67, .8], [.48, .865]], w: .175, press: swell(.46), body: true },
  ],
  P: [ // 466773: a big bowl coming down past the middle; the stem runs on below it and flares, no foot; a long flick
    { pts: [[.34, .17], [.33, .55], [.335, .885]], w: .115, press: u => .72 + .28 * u + .12 * SIN(u) + .3 * sm(.88, 1, u), body: true },
    { pts: [[.33, .19], [.52, .13], [.72, .2], [.8, .38], [.74, .56], [.55, .64], [.34, .62]], w: .18, press: BOWL, body: true },
    { pts: [[.34, .175], [.24, .165], [.15, .18]], w: .03, press: u => .7 + .3 * u, end: 'ball' },
  ],
  Q: [ // the O, and a tail drawn out from under it to the right
    { pts: [[.53, .15], [.33, .2], [.2, .42], [.215, .66], [.34, .82], [.52, .865]], w: .175, press: swell(.52), body: true },
    { pts: [[.47, .15], [.665, .19], [.8, .37], [.795, .61], [.67, .8], [.48, .865]], w: .175, press: swell(.46), body: true },
    { pts: [[.44, .84], [.58, .9], [.74, .91], [.87, .87]], w: .065, press: u => .5 + .6 * SIN(u * .8) - .5 * u },
    ball([[.87, .87], [.9, .83], [.89, .79]], .026),
  ],
  R: [
    { pts: [[.32, .17], [.31, .5], [.32, .86]], w: .12, press: STEM, body: true },
    { pts: [[.31, .19], [.5, .13], [.68, .2], [.73, .33], [.62, .46], [.38, .5]], w: .16, press: BOWL, body: true },
    { pts: [[.42, .49], [.56, .55], [.64, .69], [.68, .82], [.8, .875]], w: .16, press: u => (.3 + .8 * SIN(u * .85 + .05)) * (1 - .55 * sm(.8, 1, u)), body: true },
    ball([[.8, .875], [.86, .84]], .028),
    flickL(.32, .17), foot(.32, .865, .1, .07),
  ],
  S: [ // 466179, 471898: one stroke whose belly is the spine; both ends finished as hairlines with a ball
    { pts: [[.7, .24], [.56, .155], [.37, .17], [.27, .3], [.33, .44], [.52, .52], [.69, .62], [.73, .75], [.6, .855], [.4, .865], [.26, .79]], w: .18, press: swell(.5, .14, .98, .8), body: true },
    ball([[.7, .24], [.73, .29], [.72, .34]], .03), ball([[.26, .79], [.24, .73], [.26, .68]], .03),
  ],
  T: [ // 466732: the round T, a long top bar over a C-shaped body that turns up again at the foot
    { pts: [[.13, .28], [.16, .21], [.3, .17], [.5, .16], [.7, .162], [.84, .19]], w: .075, press: u => .25 + .85 * sm(0, .3, u) - .25 * sm(.8, 1, u) },
    ball([[.84, .19], [.865, .24], [.85, .29]], .03),
    { pts: [[.5, .2], [.34, .26], [.23, .46], [.25, .68], [.38, .83], [.56, .865], [.72, .79]], w: .18, press: swell(.42, .2, .92), body: true },
    ball([[.72, .79], [.75, .73], [.735, .68]], .03),
  ],
  U: [ // the uncial u: a heavy left bowl, a straight right stem with its foot
    { pts: [[.27, .17], [.22, .44], [.27, .7], [.42, .855], [.6, .84], [.72, .72]], w: .19, press: swell(.42, .2, .9), body: true },
    { pts: [[.73, .17], [.725, .5], [.735, .86]], w: .1, press: STEM, body: true },
    flickL(.27, .17), flickL(.73, .17, .8), foot(.735, .865, 0, .09),
  ],
  V: [ // 466729: the heavy bowl on the left, a fine stroke coming down from the right to meet it
    { pts: [[.25, .15], [.2, .42], [.27, .7], [.42, .85], [.6, .865]], w: .185, press: swell(.45, .2, .9), body: true },
    { pts: [[.77, .15], [.76, .4], [.7, .68], [.58, .865]], w: .045, press: u => .7 + .5 * SIN(u) },
    flickL(.25, .15), ball([[.77, .15], [.83, .14], [.86, .18]], .026),
  ],
  W: [ // two bowls round a central stem, the M turned over
    { pts: [[.17, .15], [.16, .42], [.22, .7], [.35, .855], [.5, .83]], w: .16, press: swell(.45, .2, .9), body: true },
    { pts: [[.5, .2], [.5, .5], [.5, .83]], w: .08, press: STEM, body: true },
    { pts: [[.83, .15], [.84, .42], [.78, .7], [.65, .855], [.5, .83]], w: .16, press: swell(.45, .2, .9), body: true },
    flickL(.17, .15), ball([[.83, .15], [.89, .14], [.92, .18]], .026), ball([[.5, .2], [.56, .18], [.6, .2]], .024),
  ],
  X: [
    { pts: [[.22, .17], [.38, .38], [.6, .64], [.8, .855]], w: .16, press: swell(.5, .2, .9), body: true },
    { pts: [[.78, .17], [.6, .38], [.4, .62], [.22, .855]], w: .035, press: u => .8 + .3 * SIN(u) },
    flickL(.22, .17), ball([[.78, .17], [.84, .155], [.87, .19]], .026),
    ball([[.22, .855], [.15, .87], [.12, .83]], .03), foot(.8, .86, .06, .08),
  ],
  Y: [
    { pts: [[.21, .17], [.3, .36], [.45, .52], [.56, .56]], w: .16, press: u => .3 + .8 * SIN(u * .9), body: true },
    { pts: [[.79, .16], [.7, .4], [.58, .62], [.44, .82], [.28, .87]], w: .1, press: u => (.5 + .6 * SIN(u * .9)) * (1 - .6 * sm(.7, 1, u)), body: true },
    ball([[.28, .87], [.21, .84], [.2, .78]], .03),
    flickL(.21, .17), ball([[.79, .16], [.85, .15], [.88, .19]], .026),
  ],
  Z: [
    { pts: [[.25, .2], [.5, .165], [.77, .18]], w: .06, press: u => .5 + .6 * u },
    ball([[.25, .2], [.22, .25], [.24, .3]], .03),
    { pts: [[.77, .19], [.6, .42], [.42, .63], [.25, .84]], w: .17, press: swell(.5, .25, .85), body: true },
    { pts: [[.25, .84], [.5, .865], [.76, .82]], w: .075, press: u => 1 - .5 * u },
    ball([[.76, .82], [.79, .76], [.77, .71]], .03),
    { pts: [[.36, .52], [.5, .51], [.66, .5]], w: .03, press: HAIR },
  ],
};

// The letter drawn by the pen into a mask at size × size page px (dpr device px each); a seed moves the hand a little
// (each control point by up to ~.4% of the size), so no two initials are the same. L: coverage of the letter; C: its
// counters (paper enclosed by it); strokes: the ductus in page px, as the pen drew them.
export function letterMask(letter, size, dpr = 2, seed = 0) {
  const W = size, cw = Math.ceil(W * dpr), c = new OffscreenCanvas(cw, cw).getContext('2d'), r = mulberry(fnv(letter + ':' + seed));
  c.scale(dpr, dpr);
  const strokes = (DUCTUS[letter.toUpperCase()] ?? DUCTUS.O).map((s, k) => {
    const j = seed ? .008 : 0, pts = s.pts.map(([x, y]) => [(x + (r() - .5) * j) * W, (y + (r() - .5) * j) * W]);
    return { ...s, P: spline(pts, 18), wp: s.w * W, seed: 3 + (s.w * 700 | 0) + k * 31 + seed };
  });
  for (const s of strokes) pen(c, s.P, { w: s.wp, press: s.press, ink: [255, 255, 255], broad: .2, start: 'cut', end: s.end ?? 'cut', seed: s.seed, load: 1, swell: 0 });
  const A = c.getImageData(0, 0, cw, cw).data, L = new Float32Array(cw * cw); for (let i = 0; i < cw * cw; i++) L[i] = A[i * 4 + 3] / 255;
  // counters: not letter and not reachable from the edge
  const out = new Uint8Array(cw * cw), st = []; for (let i = 0; i < cw; i++) st.push(i, (cw - 1) * cw + i, i * cw, i * cw + cw - 1);
  while (st.length) { const i = st.pop(); if (out[i] || L[i] > .5) continue; out[i] = 1; const x = i % cw, y = i / cw | 0;
    if (x > 0) st.push(i - 1); if (x < cw - 1) st.push(i + 1); if (y > 0) st.push(i - cw); if (y < cw - 1) st.push(i + cw); }
  const C = new Float32Array(cw * cw); for (let i = 0; i < cw * cw; i++) C[i] = !out[i] && L[i] <= .5 ? 1 : 0;
  return { cw, L, C, strokes };
}
