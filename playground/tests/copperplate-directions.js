// Copperplate, direction studies (research/23-copperplate.md): three directions, drawn live as vector (pen paths with
// designed half-widths) and printed through the ink engine by kit/styles/copperplate-print.js. Every piece:
// { W, H, strokes, letter?, medium: 'engrave' | 'quill', base? } in its own px (0,0)-(W,H); d = device px a css px (the
// hairline is never drawn under the engine's floor, 1.2 device px, and opens toward the master's tenth of a shade above it).
//   A · the plate   Bickham and Champion engraved (Universal Penman, 1733-41): the capital, and a few long sweeps with
//                   one lens each on the near-horizontal run; hairlines that end in a point or a ball; intaglio black
//                   (dark: the copper plate itself, its cut lines bright)
//   B · the pen     the writing master's own hand: the same grammar written with a pointed quill in iron-gall ink, its
//                   shade the pen's (on the down-strokes of the slant), pooling where the hand slows (dark: white ink)
//   C · command of hand   the capital in a rosette of loops written as one continuous stroke (Bickham's ABC headpiece,
//                   0414; the WIT bands, 0124), engraved
import { SLANT, beauty, oval, curl, join, burin, shade, lens, stroke, cubic } from '../kit/styles/copperplate-print.js';
import { stream } from '../kit/marks.js';

const PI = Math.PI, TAU = 2 * PI;
const hairOf = (peak, d) => Math.max(peak / 10, 1.2 / d) / 2;   // a half-width
const DOWN = [-Math.cos(SLANT), Math.sin(SLANT)];                 // the pen's shade: pulled down the slant
// a stroke: the path cut by the burin's hand, its widths by the shade rule (or lenses given by hand), its ends
function S(path, seed, { hair, peak, axis = [1, 0], tol = 32, start = 'point', end = 'point', lenses = null, amp = .16, ball = 1.9, aspect = 20, margin = .1 }) {
  const p = burin(path, seed, amp), w = lenses ? new Float32Array(p.length).fill(hair) : shade(p, { hair, peak: peak / 2, axis, tol, aspect, margin });
  if (lenses) for (const [u0, u1, pk, at] of lenses) lens(p, w, u0, u1, pk / 2, at ?? .4);
  return stroke(p, w, { start, end, hair, ball });
}
const rev = p => p.slice().reverse();
const slantPt = (c, a, b, t) => { const sd = [Math.cos(SLANT), -Math.sin(SLANT)], sn = [Math.sin(SLANT), Math.cos(SLANT)]; return [c[0] + sd[0] * a * Math.cos(t) + sn[0] * b * Math.sin(t), c[1] + sd[1] * a * Math.cos(t) + sn[1] * b * Math.sin(t)]; };

// ---- A · the plate ---------------------------------------------------------------------------------------------------------
const A = {
  name: 'A · The plate', face: '"CopperA"', medium: 'engrave',
  initial(ch, H, seed, d = 2) {
    const r = stream(seed, 'A-ini:' + ch), W = Math.round(H * 1.06), pk = H * .046, hair = hairOf(H * .062, d), out = [];
    const letter = { ch, face: this.face, cap: H * .7, cx: W * .56, cy: H * .45 };
    // the underscore: a line of beauty from under the letter's foot out to the right, its lens on the long run, curling up
    const a = [W * .04, H * (.83 + .02 * r())], b = [W * .9, H * .9], u = beauty(a, b, .085 + .02 * r(), 90);
    out.push(S(join(u, curl(b, -.35, H * .075, -1)), seed + 1, { hair, peak: pk, axis: [1, 0], start: 'ball', margin: .16 }));
    // the head: a hairline from the top right over the letter's head, a lighter lens leftward, into a curl and a ball
    const h0 = [W * .97, H * .2], h1 = [W * .2, H * .1], top = cubic(h0, [W * .8, H * -.02], [W * .45, H * .0], h1, 80);
    out.push(S(join(top, curl(h1, PI * .82, H * .065, -1, 1.25)), seed + 2, { hair, peak: pk * .62, axis: [-1, 0], start: 'point', end: 'ball', margin: .22 }));
    return { W, H, strokes: out, letter, medium: this.medium };
  },
  // Bickham's line opener: a tilde laid in front of the line, a ball where the burin went in, one lens on the fall
  paraph(fs, seed, d = 2) {
    const W = fs * 1.45, H = fs * .9, pk = fs * .12, hair = hairOf(pk, d);
    const p = join(cubic([W * .03, H * .7], [W * .3, H * -.35], [W * .6, H * 1.25], [W * .9, H * .25], 60), curl([W * .9, H * .25], -PI * .45, fs * .08, -1, 1.1));
    return { W, H, base: .95, strokes: [S(p, seed + 3, { hair, peak: pk, lenses: [[.34, .7, pk, .45]], start: 'ball', amp: .04 })], medium: this.medium };
  },
  // the line's end: a fine rule out to the measure, ending in the shaded tilde (Bickham's "Language~")
  filler(gw, lh, seed, d = 2) {
    const H = lh * .5, T = Math.min(gw, lh * 1.9), pk = lh * .1, hair = hairOf(pk, d), y = H * .6, x1 = gw - T;
    const til = cubic([x1, y], [x1 + T * .38, y - H * .9], [x1 + T * .6, y + H * .85], [gw - 1, y - H * .25], 50);
    const path = x1 > lh * .4 ? join(beauty([1, y], [x1, y], .004, Math.max(8, Math.round(x1 / 3))), til) : til;
    let L = 0; for (let i = 1; i < path.length; i++) L += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    const u0 = 1 - T / L;
    return { W: gw, H, strokes: [S(path, seed + 4, { hair, peak: pk, lenses: [[u0 + (1 - u0) * .32, u0 + (1 - u0) * .8, pk, .45]], start: 'point', end: 'point', amp: .1 })], medium: this.medium };
  },
  // two lines of beauty crossing, each shaded away from the crossing (a shade is crossed only by a hairline), the four
  // ends curled, two into balls
  brk(bw, hb, seed, d = 2) {
    const pk = hb * .075, hair = hairOf(pk, d), out = [];
    for (const s of [1, -1]) {
      const a = [bw * .16, hb * (.5 + .2 * s)], b = [bw * .84, hb * (.5 - .2 * s)], l = beauty(a, b, .15 * s, 100);
      const path = join(rev(curl(a, s > 0 ? PI * .55 : -PI * .55, hb * .17, s > 0 ? -1 : 1, 1.35)), l, curl(b, s > 0 ? -PI * .45 : PI * .45, hb * .17, s > 0 ? -1 : 1, 1.35));
      out.push(S(path, seed + 5 + s, { hair, peak: pk, lenses: [s > 0 ? [.18, .46, pk, .45] : [.54, .82, pk, .55]], start: s > 0 ? 'ball' : 'point', end: s > 0 ? 'point' : 'ball' }));
    }
    return { W: bw, H: hb, strokes: out, medium: this.medium };
  },
  // a quotation's head: a hairline along the head, turning down into the margin in a quarter oval whose turn is shaded,
  // ending in a curl (Bickham frames with flourished rules and ovals, not mitred corners)
  corner(cs, seed, d = 2) {
    const W = cs * 5.5, H = cs * 1.9, pk = cs * .1, hair = hairOf(pk, d);
    const run = beauty([W - 1, H * .06], [cs * .85, H * .1], -.01, 80), turn = cubic([cs * .85, H * .1], [cs * .2, H * .12], [cs * .1, H * .35], [cs * .22, H * .7], 50);
    const p = join(run, turn, curl([cs * .22, H * .7], PI * .42, cs * .17, -1, 1.2));
    let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); const u = (W - cs * 2.4) / L;
    return { W, H, strokes: [S(p, seed + 7, { hair, peak: pk, lenses: [[u, u + cs * 2.6 / L, pk, .55]], start: 'point', end: 'ball' })], medium: this.medium };
  },
};

// ---- B · the pen ------------------------------------------------------------------------------------------------------------
const B = {
  name: 'B · The writing master’s pen', face: '"CopperB"', medium: 'quill',
  initial(ch, H, seed, d = 2) {
    const W = Math.round(H * 1.06), pk = H * .075, hair = Math.max(.3, pk / 9 / 2), out = [];
    const letter = { ch, face: this.face, cap: H * .7, cx: W * .55, cy: H * .47 };
    // one slant oval round the letter, entered from below left as a hairline and run 1.1 times round, shaded where the pen
    // pulls down the slant; then out to the right
    const c = [W * .52, H * .5], o = [];
    for (let t = PI * .85; t <= PI * .85 + TAU * 1.08; t += .02) o.push(slantPt(c, H * .58, H * .34, -t));
    const entry = cubic([W * .02, H * .98], [W * .08, H * .9], o[0], o[0], 20);
    out.push(S(join(entry, o), seed + 1, { hair, peak: pk, axis: DOWN, tol: 38, start: 'point', end: 'point', amp: .25 }));
    return { W, H, strokes: out, letter, medium: this.medium };
  },
  // the copybook's oval: entered from below, once round on the slant, shaded down its left side, out to a dot
  paraph(fs, seed, d = 2) {
    const W = fs * 1.1, H = fs * .95, pk = fs * .16, hair = Math.max(.3, pk / 9 / 2), c = [W * .5, H * .5], o = [];
    for (let t = PI * .2; t <= PI * .2 + TAU * 1.02; t += .05) o.push(slantPt(c, H * .5, H * .26, -t));
    return { W, H, base: .9, strokes: [S(join(cubic([W * .02, H * .95], [W * .2, H * .9], o[0], o[0], 12), o), seed + 3, { hair, peak: pk, axis: DOWN, tol: 38, end: 'ball', amp: .1 })], medium: this.medium };
  },
  // a compound curve out to the measure, closing in a small oval on the slant
  filler(gw, lh, seed, d = 2) {
    const H = lh * .62, pk = lh * .12, hair = Math.max(.3, pk / 9 / 2), R = Math.min(H * .5, gw * .2), c = [gw - R * .9, H * .5], o = [];
    for (let t = PI * 1.25; t <= PI * 1.25 + TAU * .95; t += .05) o.push(slantPt(c, R, R * .5, -t));
    const lead = gw > R * 4 ? beauty([1, H * .45], o[0], .03, 60) : [o[0]];
    return { W: gw, H, strokes: [S(join(lead, o), seed + 4, { hair, peak: pk, axis: DOWN, tol: 38, amp: .15 })], medium: this.medium };
  },
  // the running oval: three ovals written on without lifting, as the copybooks drill it
  brk(bw, hb, seed, d = 2) {
    const pk = hb * .1, hair = Math.max(.3, pk / 9 / 2), n = 1.08, a = hb * .46, b = hb * .27, x0 = bw * .5, x1 = bw * .5, p = [];
    for (let t = 0; t <= n * TAU; t += .03) { const c = [x0 + (x1 - x0) * t / (n * TAU), hb * .5]; p.push(slantPt(c, a, b, -t - PI * .5)); }
    const lead = beauty([bw * .04, hb * .55], p[0], -.06, 40), tail = beauty(p.at(-1), [bw * .96, hb * .45], .06, 40);
    return { W: bw, H: hb, strokes: [S(join(lead, p, tail), seed + 5, { hair, peak: pk, axis: DOWN, tol: 38, end: 'ball', amp: .2 })], medium: this.medium };
  },
  corner(cs, seed, d = 2) {
    const W = cs * 5.5, H = cs * 2.1, pk = cs * .14, hair = Math.max(.3, pk / 9 / 2), c = [cs * .75, H * .45], o = [];
    for (let t = -PI * .1; t <= -PI * .1 + TAU * 1.05; t += .03) o.push(slantPt(c, cs * .78, cs * .4, t));
    const run = beauty([W - 1, H * .08], o[0], .015, 80);
    return { W, H, strokes: [S(join(run, o), seed + 7, { hair, peak: pk, axis: DOWN, tol: 38, end: 'ball', amp: .2 })], medium: this.medium };
  },
};

// ---- C · command of hand -------------------------------------------------------------------------------------------------------
// a ring of n loops round an ellipse (radii ax, ay), one continuous stroke: the centre runs round the ellipse while the
// pen circles k times as fast (an epitrochoid; loops where rho*k exceeds the ring's speed)
// (the hand: each loop its own size, +-9 %, larger toward the head and foot as Bickham's are, the ring breathing)
function rosette(c, ax, ay, n, rho, ph = 0, turns = 1, step = .004, r = null) {
  const out = [], k = n + 1, var_ = Array.from({ length: n + 3 }, () => r ? 1 + (r() - .5) * .18 : 1), breathe = r ? r() * TAU : 0;
  for (let t = 0; t <= TAU * turns; t += step) { const f = t / TAU * (n + 1), i = Math.floor(f), u = f - i, v = var_[i % var_.length] * (1 - u) + var_[(i + 1) % var_.length] * u;
    const rr = rho * v * (1 + .12 * Math.abs(Math.sin(t + ph))), R = 1 + .02 * Math.sin(2 * t + breathe);
    out.push([c[0] + ax * R * Math.cos(t + ph) - rr * Math.cos(k * t + ph), c[1] + ay * R * Math.sin(t + ph) - rr * Math.sin(k * t + ph)]); }
  return out;
}
const C = {
  name: 'C · Command of hand', face: '"CopperA"', medium: 'engrave',
  initial(ch, H, seed, d = 2) {
    const W = Math.round(H * 1.06), pk = H * .05, hair = hairOf(pk, d), c = [W * .5, H * .5];
    const letter = { ch, face: this.face, cap: H * .5, cx: c[0] + H * .01, cy: c[1] };
    const ring = rosette(c, W * .36, H * .36, 9, H * .1, -PI * .5, 1.0, .004, stream(seed, 'C-ring:' + ch));
    // (the press here is the garland's: each loop swells on its outer arc, the hand easing in and out as the arc turns)
    const st = S(ring, seed + 1, { hair, peak: pk, lenses: [], start: 'point', end: 'point', amp: .12 }), rmax = Math.max(...st.p.map(([x, y]) => Math.hypot((x - c[0]) / (W * .36), (y - c[1]) / (H * .36))));
    st.p.forEach(([x, y], i) => { const r = Math.hypot((x - c[0]) / (W * .36), (y - c[1]) / (H * .36)) / rmax, f = Math.max(0, Math.min(1, (r - .86) / .14));
      if (f > 0) st.w[i] = Math.max(st.w[i], hair + (pk * .3 - hair) * f * f * (3 - 2 * f)); });
    return { W, H, strokes: [st], letter, medium: this.medium };
  },
  // a knot of three loops, one stroke, closing on itself
  paraph(fs, seed, d = 2) {
    const s = fs * 1.05, pk = fs * .13, hair = hairOf(pk, d), c = [s * .5, s * .5];
    // (the trefoil: three loops and three crossings, x = sin t + 2 sin 2t, y = cos t - 2 cos 2t; begun and left a little open)
    const k = []; for (let t = .25; t <= TAU - .05; t += .01) k.push([c[0] + s * .15 * (Math.sin(t) + 2 * Math.sin(2 * t)), c[1] + s * .15 * (Math.cos(t) - 2 * Math.cos(2 * t)) + s * .05]);
    return { W: s, H: s, base: .85, strokes: [S(k, seed + 3, { hair, peak: pk, axis: [1, 0], tol: 30, aspect: 7, margin: .04, end: 'ball', amp: .04 })], medium: this.medium };
  },
  // running loops along the baseline, each a little smaller, closing in a curl and a ball
  filler(gw, lh, seed, d = 2) {
    const H = lh * .62, pk = lh * .1, hair = hairOf(pk, d), n = Math.max(1, Math.min(9, Math.floor(gw / (lh * 1.25)))), p = [];
    const span = gw - lh * .7;
    for (let t = 0; t <= n * TAU; t += .03) { const u = t / (n * TAU), rho = H * .44 * (1 - .4 * u); p.push([lh * .1 + span * u - rho * Math.sin(t) * 1.5, H * .75 - rho * (1 - Math.cos(t)) * .85]); }
    const end = p.at(-1);
    return { W: gw, H, strokes: [S(join(p, curl(end, 0, lh * .14, -1, 1.2)), seed + 4, { hair, peak: pk, axis: [-1, 0], tol: 30, aspect: 8, margin: .03, end: 'ball', amp: .08 })], medium: this.medium };
  },
  // a band of loops in a lens-shaped envelope, one stroke from a curl at one end to a curl at the other (0124's bands)
  brk(bw, hb, seed, d = 2) {
    const pk = hb * .07, hair = hairOf(pk, d), n = 7, p = [], L = bw * .76, x0 = bw * .12;
    for (let t = 0; t <= n * TAU; t += .02) { const u = t / (n * TAU), env = Math.sin(PI * u) ** .8, rho = hb * .3 * (.25 + .75 * env);
      p.push([x0 + L * u - rho * Math.sin(t) * 1.25, hb * .5 + rho * Math.cos(t) * (.6 + .4 * env) - rho * .0]); }
    const a = p[0], b = p.at(-1);
    return { W: bw, H: hb, strokes: [S(join(rev(curl(a, PI, hb * .09, 1, 1.2)), p, curl(b, 0, hb * .09, -1, 1.2)), seed + 5, { hair, peak: pk, axis: [-1, 0], tol: 30, aspect: 9, margin: .04, start: 'ball', end: 'ball', amp: .1 })], medium: this.medium };
  },
  // a curl down into the margin at the corner, then loops along the head, smaller away from the corner
  corner(cs, seed, d = 2) {
    const W = cs * 5.5, H = cs * 1.9, pk = cs * .09, hair = hairOf(pk, d), p = [], x0 = cs * .7, y0 = cs * .55, span = W - x0 - cs * .4, n = 5;
    for (let t = 0; t <= n * TAU; t += .025) { const u = t / (n * TAU), rho = cs * .36 * (1 - .55 * u); p.push([x0 + span * u - rho * Math.sin(t) * 1.6, y0 - rho * (1 - Math.cos(t)) * .8]); }
    const down = join(rev(curl([cs * .32, H * .78], PI * .6, cs * .16, -1, 1.2)), cubic([cs * .32, H * .78], [cs * .22, H * .45], [cs * .35, y0], [x0, y0], 30), p);
    return { W, H, strokes: [S(down, seed + 7, { hair, peak: pk, axis: [-1, 0], tol: 30, aspect: 8, margin: .03, start: 'ball', end: 'point', amp: .08 })], medium: this.medium };
  },
};

export const DIRS = { plate: A, pen: B, hand: C };
// inks: light, and a designed dark (not an inversion)
export const PAL = {
  plate: { light: [30, 25, 24], dark: [206, 142, 100] },    // intaglio black; dark: the plate's copper, its cuts bright
  pen: { light: [64, 41, 28], dark: [228, 216, 194] },      // iron gall; dark: white ink on a dark card
  hand: { light: [30, 25, 24], dark: [222, 210, 186] },     // intaglio black; dark: an ivory ink
};
