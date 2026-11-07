// Occult: the grimoire as the copyists of the Clavicules de Salomon wrote it in the 18th century, after the printed
// books they copied from (Agrippa, De occulta philosophia, 1533/1567; Dee, Monas hieroglyphica, 1564) — research/13-occult.md.
// A pentacle is a construction and a writing laid one over the other: circles struck with a compass and rules drawn with
// a ruler (even, closed in one sweep, no thick and thin), then written into: the names round the band in capitals or
// italic, upright to the centre and carried on round the bottom; the planetary signs in red, heavy, in the forms the
// period wrote them (♄ an h, ♃ a 2, ☾ a C, ♀ and ☿ on flared crosses). Two inks, a third for the ruling at most: a
// brown-black, a red (vermilion, red lead), a verdigris green.
//   marks: the compass and the ruler, written by the ink engine's pen (kit/writer.js) with a round nib (hair ≈ width, so
//     the line is even in every direction), a circle as one stroke from its top round to a little past it, a rule as one
//     stroke. col: 'k' | 'r' | 'g'.
//   letters: lettering (IM FELL Double Pica, roman and italic: the Fell types, Oxford 1670s–80s, digitised by Igino Marini,
//     OFL) and the signs (their own ink traced from Wellcome MS 4670, by tools/tracesign.py), as coverage laid or written
//     by the ink engine (inkLetter / letterWriter), as the drop initials of the approved styles are. col as marks.
//
// The style object follows tests/tarot.html's signatures, each returning { marks, letters }:
//   paraph(x, base, u, seed, rich, k?)   the chapter's planet (k: 0..6 in the week's order, Sun first)
//   filler(x0, x1, yTop, yBase, kind, seed, rich, k?)   kind: 'signs' | 'band' | 'sigil' | 'rule' (a heading's)
//   breakMark(cx, y, measure, rank, seed, rich, u, n?, room?)   rank 1: the chapter's seal on its lettered band; rank 2: the Monas
//     (room: [top, bottom], the page's room for it: a Monas that would not fit is drawn smaller, then without its motto)
//   initial(o) -> { marks, letters, width }   (o: ch, G: { box }, big, rich, seed, set: 'band' | 'ring', u, n, title)
//   frames.{ quote, figure, code, pull, aside, nav }(args), palette.{ light, dark }
// Marks: { pts (page px), w (the nib, px), hair, col, press?, rho: 0 }. Nothing here touches the DOM except glyph(),
// printOf() and loadFace(), which the page calls (printOf(element) -> { letters, runs }: what the page lays with
// inkLetter / letterWriter and writes with the writer, ink by ink; tests/occult.html shows how, still and ?draw).
// Safety: no form here reads as a hate symbol (research/13, checklist 7). The sigils are drawn on the kamea of Saturn and
// every one is passed through sigilSafe() (no Z, N, S-rune or lightning zigzag, no zig-back); nothing is repeated in a
// four-fold rotation with a hook; tests/occult.check.mjs sweeps the seeds.
import { noise2 } from '../marks.js';

const fnv = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rng = (seed, name) => mulberry(fnv(name + ':' + seed));
const TAU = 2 * Math.PI;
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const arclen = p => p.reduce((a, q, i) => i ? a + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0);
export function resample(p, ds = .6) {
  const out = [p[0]]; let carry = 0;
  for (let i = 1; i < p.length; i++) { const [x0, y0] = p[i - 1], [x1, y1] = p[i], l = Math.hypot(x1 - x0, y1 - y0); let t = ds - carry;
    while (t <= l) { out.push([x0 + (x1 - x0) * t / l, y0 + (y1 - y0) * t / l]); t += ds; } carry = l - (t - ds); }
  if (Math.hypot(out.at(-1)[0] - p.at(-1)[0], out.at(-1)[1] - p.at(-1)[1]) > 1e-3) out.push(p.at(-1)); return out;
}
// an arc of a circle from angle a0 to a1 (radians, y down: increasing turns clockwise on screen)
const arc = (c, r, a0, a1, n = 0) => { n ||= Math.max(10, Math.ceil(Math.abs(a1 - a0) * r / 1.2)); return Array.from({ length: n + 1 }, (_, k) => { const a = a0 + (a1 - a0) * k / n; return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; }); };
const polar = (c, r, a) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];

// ---- the compass and the ruler ----------------------------------------------------------------------------------------
// A compass's pen and a ruling pen: an even line, its weight the same in every direction, hardly wavering (a compass
// does not wander as a hand does; the ink does, a little: ±4 %). The line ~0.7 % of a pentacle's diameter in the
// manuscripts; on a screen never under 1.3 px (a line under a pixel only aliases).
export const LW = u => Math.max(1.3, Math.min(2.1, u * .15));
function pen(pts, W, { col = 'k', seed = 0, taper = [0, 0], wob = .04 } = {}) {
  W = Math.max(1.2, W); const P = resample(pts, .6), L = arclen(P), n = noise2(seed * 7 + 11 | 0), o = (seed * .37) % 50;
  const press = f => { const s = f * L; let k = 1 + wob * 2 * (n(s / 14 + o, o) - .5);
    if (taper[0]) k *= .35 + .65 * Math.min(1, s / taper[0]) ** .7; if (taper[1]) k *= .35 + .65 * Math.min(1, (L - s) / taper[1]) ** .7; return k; };
  return { pts: P, w: W, hair: W * .92, col, press, rho: 0 };
}
// a circle struck with the compass: one sweep from the top round to a little past it, so the closing is a slight
// thickening where the pen ran over its own start, as on the manuscripts
const circle = (c, r, W, o = {}) => pen(arc(c, r, -Math.PI / 2 - .05, -Math.PI / 2 + TAU + .06), W, o);
const rule = (a, b, W, o = {}) => pen([a, b], W, o);
// A pen in a sure hand, not a compass: the path drawn freehand (bent a little off true by a slow wander square to it,
// amp px at most, over a third of its length), the nib swelling where the pen slows (in the turns, and as it sets down)
// and lifting off at the end. One continuous stroke, however many turns it makes; where it runs over itself or over
// another stroke the ink merges, wet into wet (the medium does that).
function sketch(pts, W, { col = 'k', seed = 0, amp = 0, swell = .22, enter = .8, leave = .7, press = null } = {}) {
  W = Math.max(1.2, W); const P0 = resample(pts, .6), n = P0.length, L = arclen(P0), nz = noise2(seed * 13 + 5 | 0), nz2 = noise2(seed * 29 + 3 | 0), lam = Math.max(18, L * .33);
  let s = 0; const P = P0.map((p, i) => { if (i) s += Math.hypot(p[0] - P0[i - 1][0], p[1] - P0[i - 1][1]);
    const a = P0[Math.max(0, i - 1)], b = P0[Math.min(n - 1, i + 1)], t = unit([b[0] - a[0], b[1] - a[1]]), d = amp * 2 * (nz(s / lam + seed % 37, 3.7) - .5) * Math.min(1, s / 6, (L - s) / 6);
    return [p[0] - t[1] * d, p[1] + t[0] * d]; });
  // the turn at each point (over ~3 px either side): where the pen turns it slows, and the ink lands heavier
  const k = new Float32Array(n); s = 0;
  for (let i = 0; i < n; i++) { if (i) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); const j0 = Math.max(0, i - 5), j1 = Math.min(n - 1, i + 5);
    const u = unit([P[i][0] - P[j0][0], P[i][1] - P[j0][1]]), v = unit([P[j1][0] - P[i][0], P[j1][1] - P[i][1]]), turn = i > 0 && i < n - 1 ? 1 - (u[0] * v[0] + u[1] * v[1]) : 0;
    const f = L ? s / L : 0;
    k[i] = (1 + swell * Math.min(1, turn * 3) + .1 * 2 * (nz2(s / 22, 1.3) - .5)) * (enter + (1 - enter) * Math.min(1, s / Math.max(4, W * 3))) * (leave + (1 - leave) * Math.min(1, (L - s) / Math.max(5, W * 4))) * (press ? press(f) : 1); }
  return { pts: P, w: W, hair: W * .92, col, press: f => k[Math.min(n - 1, Math.round(f * (n - 1)))], rho: .6 };
}
// a circle drawn by hand in one stroke: from its top round and a little over its start, a shade off round (the hand's
// circle is a little egged and flattened somewhere); turns: 2 runs on round again inside itself to rG, as a pen doubles
// a ring without lifting (Dee's double circle)
// a path less the parts hidden under something drawn over it (hidden(p) -> true): the pieces left, in order, each a stroke
// of its own (the pen lifts at the crossing and sets down beyond it), pieces shorter than minL dropped
export function occlude(pts, hidden, minL = 1.5) {
  const P = resample(pts, .5), out = []; let run = [];
  for (const p of P) { if (hidden(p)) { if (run.length > 1) out.push(run); run = []; } else run.push(p); }
  if (run.length > 1) out.push(run);
  return out.filter(q => arclen(q) >= minL);
}
// hide: a path drawn whole, or (with hide) in the pieces left showing where something passes over it
function handCircle(c, r, W, { col = 'k', seed = 0, turns = 1, r2 = r, amp = .012, hide = null } = {}) {
  const rr = rng(seed, 'circle'), ph = rr() * TAU, ph2 = rr() * TAU, a0 = -Math.PI / 2 - .25 + rr() * .3, end = TAU * turns + (turns > 1 ? .5 : .12), N = Math.ceil(end * Math.max(r, 4) / 1.1);
  const pts = Array.from({ length: N + 1 }, (_, i) => { const t = i / N * end, a = a0 + t, f = Math.max(0, Math.min(1, (t - (TAU + .08)) / 1.0)),   // (the outer turn closes over its start before the pen moves in)
      R0 = r + (r2 - r) * (turns > 1 ? f * f * (3 - 2 * f) : 0);
    const R = R0 * (1 + amp * Math.sin(2 * a + ph) + amp * .6 * Math.sin(3 * a + ph2)); return polar(c, R, a); });
  if (!hide) return sketch(pts, W, { col, seed, swell: .1, enter: .85, leave: .75 });
  return occlude(pts, hide).map((q, k) => sketch(q, W, { col, seed: seed + k * 7, swell: .1, enter: .85, leave: .75 }));
}
// a rule pulled freehand: a shade of bow, running a little past its ends, heavier where it starts
const handRule = (a, b, W, o = {}) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), t = unit([b[0] - a[0], b[1] - a[1]]), nr = [-t[1], t[0]], bow = (o.bow ?? .004) * L * (rng(o.seed ?? 0, 'bow')() - .5) * 2;
  const pts = Array.from({ length: 13 }, (_, i) => { const f = i / 12; return add(add(a, t, f * L), nr, bow * 4 * f * (1 - f)); });
  return sketch(pts, W, { amp: Math.min(.6, L * .002), swell: 0, enter: .85, leave: .8, ...o }); };
// a double rule round a box whose lines run on past each other at the corners (MS 4666 f. 55, 56): two rectangles,
// each side its own ruler stroke, over-running by `run`
// holes: what the ruler stops short of ({ c, r } a seal's circle, { box } a cartouche): the rule is drawn up to it and on
// from its far side, as a copyist rules round a figure already drawn
function doubleRule(B, gap, W, run, o = {}, holes = []) {
  const out = [];
  for (const [k, d] of [[0, 0], [1, gap]]) { const [x0, y0, x1, y1] = [B[0] + d, B[1] + d, B[2] - d, B[3] - d];
    [[[x0 - run, y0], [x1 + run, y0]], [[x1, y0 - run], [x1, y1 + run]], [[x1 + run, y1], [x0 - run, y1]], [[x0, y1 + run], [x0, y0 - run]]].forEach(([a, b], i) =>
      clip(a, b, holes).forEach(([p, q], j) => out.push(rule(p, q, W, { ...o, seed: (o.seed ?? 0) + k * 4 + i + j * 17 })))); }
  return out;
}
// a straight rule a -> b less the parts inside the holes: the pieces left, each at least a few px long
function clip(a, b, holes) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), at = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], cut = [];
  for (const h of holes) {
    if (h.c) { const dx = b[0] - a[0], dy = b[1] - a[1], fx = a[0] - h.c[0], fy = a[1] - h.c[1], A = dx * dx + dy * dy, Bq = 2 * (fx * dx + fy * dy), C = fx * fx + fy * fy - h.r * h.r, D = Bq * Bq - 4 * A * C;
      if (D > 0) { const s = Math.sqrt(D); cut.push([(-Bq - s) / (2 * A), (-Bq + s) / (2 * A)]); } }
    else { const [X0, Y0, X1, Y1] = h.box; let t0 = 0, t1 = 1, ok = true;   // (Liang–Barsky)
      for (const [p, q] of [[-(b[0] - a[0]), a[0] - X0], [b[0] - a[0], X1 - a[0]], [-(b[1] - a[1]), a[1] - Y0], [b[1] - a[1], Y1 - a[1]]]) {
        if (!p) { if (q < 0) ok = false; continue; } const r = q / p; if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r); }
      if (ok && t0 < t1) cut.push([t0, t1]); } }
  cut.sort((x, y) => x[0] - y[0]); const out = []; let t = 0;
  for (const [c0, c1] of cut) { if (c0 > t) out.push([t, Math.min(1, c0)]); t = Math.max(t, c1); }
  if (t < 1) out.push([t, 1]);
  return out.filter(([p, q]) => (q - p) * L > 3).map(([p, q]) => [at(p), at(q)]);
}
// the crosslet that parts the names in a band (MS 4670 f. 54): a cross, each arm ending in a short bar, written in red
function crosslet(c, s, W, col = 'r', seed = 0) {
  // two strokes, each without lifting: the upright (its head bar, down the stem, its foot bar), then the cross-stroke (its
  // left bar, across, its right bar); the pen runs back over half of each bar, so the ink is one at the joins
  const a = s / 2, b = s * .24, [x, y] = c, o = { col, swell: .2, enter: .9, leave: .8 };
  return [sketch([[x - b, y - a], [x + b, y - a], [x, y - a], [x, y + a], [x - b, y + a], [x + b, y + a]], W, { ...o, seed }),
    sketch([[x - a, y - b], [x - a, y + b], [x - a, y], [x + a, y], [x + a, y - b], [x + a, y + b]], W, { ...o, seed: seed + 1 })];
}

// ---- the planetary signs -------------------------------------------------------------------------------------------------
// Each the scribe's own ink, traced from Wellcome MS 4670 (Clavicules de Salomon, [1725?]), image 66, the tables of the
// planetary hours for Tuesday to Thursday, by tools/tracesign.py (red mode; the outline of the ink, smoothed 1.5 px):
// polygons in units of the sign's height, its left edge at 0. The Sun is the ring and its point, written with the pen:
// the manuscript's Sun is a face in a ring of rays that does not survive at a paraph's size.
const SIGNS = {"mars":{"src":"b1930237x-066.jpg [2434,1988,2623,2219] red","a":1.02,"polys":[[[0.231,0.997],[0.189,1.0],[0.134,0.966],[0.092,0.954],[0.025,0.886],[0.0,0.838],[0.0,0.808],[0.036,0.687],[0.083,0.608],[0.152,0.542],[0.249,0.509],[0.316,0.529],[0.365,0.569],[0.383,0.572],[0.425,0.52],[0.577,0.385],[0.619,0.332],[0.658,0.311],[0.678,0.269],[0.718,0.232],[0.706,0.22],[0.585,0.166],[0.575,0.123],[0.613,0.078],[0.801,0.046],[0.862,0.025],[0.91,0.022],[0.983,0.0],[1.007,0.007],[1.02,0.026],[1.02,0.05],[1.001,0.087],[0.965,0.117],[0.94,0.178],[0.935,0.214],[0.952,0.269],[0.916,0.323],[0.912,0.378],[0.9,0.408],[0.868,0.436],[0.837,0.436],[0.819,0.39],[0.795,0.359],[0.777,0.302],[0.765,0.298],[0.734,0.315],[0.692,0.38],[0.648,0.408],[0.605,0.475],[0.599,0.493],[0.607,0.517],[0.583,0.507],[0.565,0.515],[0.498,0.586],[0.462,0.6],[0.437,0.638],[0.44,0.802],[0.416,0.863],[0.372,0.917],[0.328,0.948],[0.231,0.997]],[[0.216,0.899],[0.263,0.887],[0.288,0.869],[0.323,0.814],[0.343,0.735],[0.343,0.693],[0.328,0.666],[0.268,0.608],[0.219,0.599],[0.195,0.606],[0.127,0.675],[0.089,0.79],[0.104,0.844],[0.122,0.865],[0.171,0.894],[0.216,0.899]]]},"venus":{"src":"b1930237x-066.jpg [1342,1988,1499,2219] red","a":0.778,"polys":[[[0.486,0.999],[0.298,1.0],[0.241,0.97],[0.229,0.952],[0.228,0.935],[0.256,0.901],[0.287,0.893],[0.315,0.905],[0.328,0.895],[0.332,0.765],[0.316,0.725],[0.287,0.706],[0.184,0.7],[0.139,0.709],[0.105,0.75],[0.076,0.754],[0.03,0.737],[0.014,0.719],[0.0,0.628],[0.0,0.577],[0.013,0.537],[0.082,0.506],[0.099,0.509],[0.11,0.52],[0.125,0.582],[0.144,0.6],[0.23,0.619],[0.292,0.622],[0.316,0.605],[0.323,0.582],[0.315,0.51],[0.274,0.497],[0.254,0.463],[0.258,0.456],[0.304,0.454],[0.311,0.446],[0.323,0.4],[0.321,0.372],[0.309,0.361],[0.281,0.351],[0.27,0.332],[0.311,0.275],[0.235,0.214],[0.221,0.15],[0.235,0.103],[0.264,0.056],[0.309,0.018],[0.361,0.0],[0.406,0.001],[0.452,0.019],[0.508,0.052],[0.55,0.105],[0.557,0.121],[0.556,0.173],[0.543,0.224],[0.493,0.292],[0.505,0.326],[0.503,0.361],[0.474,0.378],[0.429,0.378],[0.416,0.395],[0.42,0.452],[0.415,0.491],[0.429,0.6],[0.452,0.608],[0.503,0.602],[0.657,0.607],[0.672,0.594],[0.679,0.554],[0.691,0.536],[0.708,0.52],[0.725,0.518],[0.763,0.554],[0.778,0.634],[0.777,0.702],[0.758,0.736],[0.748,0.782],[0.725,0.801],[0.696,0.801],[0.677,0.787],[0.666,0.765],[0.664,0.719],[0.651,0.706],[0.6,0.707],[0.554,0.731],[0.514,0.734],[0.491,0.746],[0.457,0.734],[0.429,0.742],[0.42,0.821],[0.428,0.861],[0.452,0.896],[0.503,0.909],[0.527,0.935],[0.514,0.983],[0.486,0.999]],[[0.425,0.224],[0.452,0.213],[0.47,0.195],[0.474,0.184],[0.464,0.144],[0.452,0.125],[0.395,0.085],[0.355,0.082],[0.309,0.119],[0.306,0.139],[0.341,0.178],[0.394,0.218],[0.425,0.224]],[[0.668,0.253],[0.644,0.252],[0.637,0.247],[0.637,0.235],[0.651,0.229],[0.668,0.234],[0.674,0.241],[0.668,0.253]]]},"mercury":{"src":"b1930237x-066.jpg [1557,1988,1704,2219] red","a":0.729,"polys":[[[0.463,1.0],[0.284,0.996],[0.236,0.976],[0.219,0.961],[0.219,0.934],[0.24,0.907],[0.268,0.899],[0.304,0.907],[0.319,0.886],[0.313,0.788],[0.29,0.755],[0.289,0.701],[0.279,0.69],[0.236,0.677],[0.198,0.691],[0.16,0.689],[0.127,0.7],[0.111,0.712],[0.1,0.761],[0.084,0.777],[0.04,0.763],[0.018,0.718],[0.015,0.647],[0.0,0.593],[0.006,0.577],[0.035,0.551],[0.051,0.547],[0.067,0.553],[0.093,0.598],[0.105,0.605],[0.16,0.612],[0.279,0.607],[0.29,0.604],[0.297,0.593],[0.295,0.437],[0.207,0.392],[0.221,0.376],[0.226,0.322],[0.211,0.251],[0.218,0.148],[0.164,0.078],[0.152,0.045],[0.162,0.024],[0.192,0.001],[0.214,0.0],[0.236,0.008],[0.277,0.062],[0.317,0.079],[0.36,0.065],[0.419,0.062],[0.479,0.007],[0.512,0.011],[0.544,0.005],[0.555,0.011],[0.557,0.04],[0.54,0.083],[0.492,0.132],[0.52,0.251],[0.495,0.306],[0.485,0.36],[0.453,0.392],[0.403,0.419],[0.392,0.441],[0.385,0.495],[0.405,0.587],[0.404,0.615],[0.42,0.627],[0.534,0.623],[0.62,0.638],[0.637,0.62],[0.636,0.587],[0.645,0.566],[0.664,0.547],[0.685,0.542],[0.696,0.544],[0.708,0.56],[0.729,0.631],[0.729,0.69],[0.701,0.745],[0.696,0.789],[0.68,0.806],[0.637,0.801],[0.615,0.777],[0.606,0.728],[0.566,0.711],[0.528,0.706],[0.485,0.71],[0.451,0.718],[0.431,0.733],[0.423,0.75],[0.417,0.821],[0.418,0.891],[0.425,0.9],[0.469,0.916],[0.49,0.934],[0.497,0.951],[0.486,0.983],[0.463,1.0]],[[0.37,0.262],[0.405,0.241],[0.415,0.224],[0.414,0.21],[0.382,0.165],[0.349,0.159],[0.322,0.165],[0.31,0.181],[0.312,0.213],[0.349,0.259],[0.37,0.262]]]},"moon":{"src":"b1930237x-066.jpg [1809,1988,1914,2219] red","a":0.744,"polys":[[[0.365,1.0],[0.343,0.999],[0.327,0.984],[0.306,0.911],[0.232,0.869],[0.147,0.785],[0.063,0.718],[0.035,0.682],[0.0,0.512],[0.006,0.475],[0.001,0.416],[0.032,0.276],[0.1,0.128],[0.188,0.062],[0.254,0.054],[0.291,0.022],[0.446,0.0],[0.549,0.019],[0.601,0.008],[0.741,0.028],[0.743,0.121],[0.712,0.135],[0.705,0.15],[0.719,0.171],[0.741,0.172],[0.744,0.18],[0.741,0.388],[0.712,0.374],[0.69,0.337],[0.645,0.345],[0.621,0.335],[0.615,0.298],[0.52,0.114],[0.38,0.123],[0.318,0.172],[0.29,0.216],[0.298,0.268],[0.27,0.283],[0.259,0.32],[0.251,0.527],[0.312,0.637],[0.357,0.684],[0.394,0.696],[0.431,0.726],[0.483,0.742],[0.557,0.727],[0.586,0.714],[0.615,0.682],[0.667,0.646],[0.727,0.557],[0.741,0.549],[0.744,0.563],[0.741,0.739],[0.7,0.785],[0.645,0.827],[0.527,0.865],[0.476,0.895],[0.38,0.924],[0.366,0.94],[0.374,0.984],[0.365,1.0]],[[0.13,0.527],[0.146,0.49],[0.129,0.445],[0.113,0.46],[0.11,0.49],[0.114,0.513],[0.13,0.527]]]},"saturn":{"src":"b1930237x-066.jpg [2008,1988,2134,2219] red","a":0.821,"polys":[[[0.069,1.0],[0.047,0.998],[0.025,0.983],[0.024,0.931],[0.056,0.849],[0.104,0.774],[0.158,0.618],[0.225,0.469],[0.255,0.426],[0.292,0.305],[0.353,0.164],[0.356,0.134],[0.345,0.129],[0.277,0.156],[0.076,0.283],[0.009,0.278],[0.0,0.261],[0.076,0.176],[0.121,0.157],[0.173,0.119],[0.359,0.03],[0.39,0.0],[0.449,0.006],[0.474,0.037],[0.466,0.119],[0.432,0.208],[0.396,0.268],[0.344,0.41],[0.333,0.469],[0.302,0.514],[0.297,0.536],[0.315,0.544],[0.426,0.498],[0.493,0.489],[0.598,0.504],[0.62,0.529],[0.622,0.558],[0.595,0.603],[0.575,0.707],[0.508,0.789],[0.501,0.856],[0.516,0.874],[0.538,0.881],[0.612,0.854],[0.702,0.857],[0.821,0.82],[0.821,0.913],[0.717,0.956],[0.56,0.965],[0.501,0.983],[0.433,0.96],[0.403,0.908],[0.401,0.841],[0.479,0.7],[0.497,0.61],[0.486,0.578],[0.441,0.563],[0.252,0.655],[0.136,0.864],[0.096,0.975],[0.069,1.0]],[[0.672,0.373],[0.632,0.357],[0.625,0.32],[0.682,0.186],[0.707,0.149],[0.724,0.089],[0.761,0.054],[0.821,0.041],[0.821,0.219],[0.735,0.335],[0.709,0.358],[0.672,0.373]]]},"jupiter":{"src":"b1930237x-066.jpg [2234,1988,2371,2219] red","a":0.796,"polys":[[[0.134,0.997],[0.109,1.0],[0.105,0.984],[0.132,0.939],[0.192,0.876],[0.198,0.854],[0.179,0.848],[0.109,0.854],[0.058,0.876],[0.026,0.879],[0.0,0.863],[0.0,0.831],[0.02,0.797],[0.065,0.762],[0.103,0.698],[0.143,0.679],[0.295,0.527],[0.375,0.364],[0.408,0.279],[0.409,0.254],[0.394,0.215],[0.351,0.197],[0.327,0.152],[0.286,0.119],[0.204,0.12],[0.159,0.145],[0.144,0.165],[0.141,0.184],[0.172,0.217],[0.217,0.235],[0.228,0.248],[0.217,0.27],[0.159,0.318],[0.115,0.312],[0.071,0.282],[0.045,0.248],[0.044,0.203],[0.066,0.152],[0.1,0.102],[0.179,0.037],[0.236,0.019],[0.261,0.0],[0.293,0.014],[0.369,0.011],[0.394,0.029],[0.471,0.127],[0.497,0.178],[0.51,0.254],[0.451,0.427],[0.398,0.501],[0.364,0.578],[0.331,0.625],[0.264,0.692],[0.226,0.717],[0.217,0.738],[0.255,0.746],[0.331,0.738],[0.363,0.72],[0.503,0.571],[0.517,0.546],[0.513,0.489],[0.553,0.455],[0.597,0.468],[0.68,0.521],[0.737,0.511],[0.794,0.528],[0.796,0.622],[0.712,0.669],[0.655,0.657],[0.572,0.669],[0.502,0.661],[0.461,0.704],[0.457,0.73],[0.477,0.747],[0.502,0.755],[0.553,0.734],[0.592,0.755],[0.616,0.779],[0.625,0.8],[0.623,0.819],[0.605,0.844],[0.547,0.876],[0.509,0.861],[0.458,0.865],[0.375,0.842],[0.312,0.85],[0.26,0.876],[0.232,0.92],[0.198,0.955],[0.134,0.997]]]}};
export const PLANETS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];   // the week's order, Sunday first
const LATIN = { sun: 'SOL', moon: 'LVNA', mars: 'MARS', mercury: 'MERCVRIVS', jupiter: 'IVPITER', venus: 'VENVS', saturn: 'SATVRNVS' };
const CHALDEAN = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];   // the order of the planetary hours
// (a fleck of the scan's ink lying apart from the sign, under 0.2 % of its square, is dropped)
for (const S of Object.values(SIGNS)) S.polys = S.polys.filter(P => Math.abs(P.reduce((a, p, i) => { const q = P[(i + 1) % P.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2 > .002);
const signWidth = name => name === 'sun' || name === 'mars' ? 1 : name === 'venus' || name === 'mercury' ? .78 : name === 'moon' ? .9 : SIGNS[name].a;
// a sign standing on `base`, its left edge at x, h high: a letter request (the traced ink), or written with the pen:
// Mars, its ring, its shaft to the upper right and a solid barbed head (MS 4670's ♂: the traced head came out a horn at a
// paraph's size, so it is drawn, in the proportions measured off the table: ring ~0.46 of the height, the shaft at 45°, the
// head ~0.3 long and as broad, its back cut in a shallow notch); the Sun, a ring, its point, and twelve short rays (the
// manuscript's Sun is a face in a ring of rays; at a paraph's size the face cannot be written, the rays can)
function sign(name, x, base, h, col = 'r', seed = 0) {
  const W = Math.max(1.3, h * .085), P = (u, v) => [x + u * h, base - h + v * h];
  if (name === 'sun') { const c = P(.5, .5), r = h * .24, n = h < 24 ? 8 : 12;
    const rays = Array.from({ length: n }, (_, k) => { const a = k * TAU / n + .2; return pen([polar(c, r + W * 1.3, a), polar(c, h * .52, a)], Math.max(1.2, W * .75), { col, seed: seed + k, wob: 0 }); });
    return { marks: [circle(c, r, W, { col, seed }), ...rays], letters: [{ dot: c, r: Math.max(1.1, h * .07), col }] }; }
  if (name === 'mars') { const c = P(.29, .71), r = h * .225, d = [Math.SQRT1_2, -Math.SQRT1_2], nn = [Math.SQRT1_2, Math.SQRT1_2];
    const tip = P(.98, .02), L = h * .34, B = h * .16, base0 = add(tip, d, -L), notch = add(base0, d, L * .22);
    // the ring from the shaft's root round and on up the shaft in one stroke, then the head
    const ring = arc(c, r, -Math.PI / 4, -Math.PI / 4 - TAU - .05, 0);
    return { marks: [sketch([...ring, add(base0, d, L * .3)], W, { col, seed, swell: .25 })],
      letters: [{ polys: [[tip, add(base0, nn, B), notch, add(base0, nn, -B)]], col }] }; }
  // Venus and Mercury: the ring on a cross whose arms end in short flared bars (MS 4670's ♀ ☿), Mercury's horns a small
  // crescent standing on the ring; the Moon a crescent like a heavy C. Written with the pen: traced, their flared ends and
  // horns filled in to blots at a contents line's size
  if (name === 'venus' || name === 'mercury') { const cx = x + h * .39, top = name === 'mercury' ? .2 : 0, rr = h * (name === 'mercury' ? .13 : .15), rc = P(.39, top + .02 + rr / h + .02);
    const sy = rc[1] + rr, arm = h * .3, by = base - h * .36, bar = h * .085, o = { col, wob: 0 };
    // the ring from its foot round and on down the stem without lifting, ending in the foot's bar; then the arm, its end
    // bars drawn into it in the same stroke
    const fy = base - W * .4, ring = arc(rc, rr, Math.PI / 2, Math.PI / 2 + TAU, 0);
    const marks = [sketch([...ring, [cx, sy], [cx, fy], [cx - bar * 1.1, fy], [cx + bar * 1.1, fy]], W, { ...o, seed, swell: .25 }),
      sketch([[cx - arm, by - bar], [cx - arm, by + bar], [cx - arm, by], [cx + arm, by], [cx + arm, by - bar], [cx + arm, by + bar]], W, { ...o, seed: seed + 2, swell: .25 })];
    if (name === 'mercury') marks.push(sketch(arc([cx, rc[1] - rr - h * .12], h * .15, Math.PI * .95, Math.PI * .05), W, { col, seed: seed + 6, enter: .55, leave: .5 }));
    return { marks, letters: [] }; }
  if (name === 'moon') { const oc = P(.42, .5), ic = P(.6, .47), ro = h * .48, ri = h * .38;
    // the outer edge from the upper tip round the left to the lower; back up the inner edge (a smaller circle set to the
    // right), so the back swells and the tips are blunt, as the scribe's C
    const outer = arc(oc, ro, -Math.PI * .28, -Math.PI * 1.72, 40), inner = arc(ic, ri, Math.PI * .62, Math.PI * 1.38, 40);
    return { marks: [], letters: [{ polys: [[...outer, ...inner]], col }] }; }
  return { marks: [], letters: [{ shape: name, x, y: base - h, h, col }] };
}

// ---- lettering -------------------------------------------------------------------------------------------------------------
export const roman = n => { let s = ''; for (const [v, r] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += r; n -= v; } return s; };
const ORD = ['', 'PRIMVM', 'SECVNDVM', 'TERTIVM', 'QVARTVM', 'QVINTVM', 'SEXTVM', 'SEPTIMVM', 'OCTAVVM', 'NONVM', 'DECIMVM'];
export const FACES = { roman: { family: 'IM FELL Double Pica', file: 'IMFellDoublePica.woff2' }, italic: { family: 'IM FELL Double Pica Italic', file: 'IMFellDoublePica-Italic.woff2' },
  // the table's numerals: the Fell italic's 4 is an old-style cross that reads as + in a cell; EB Garamond's italic
  // figures (OFL, playground/fonts) are the same family of hand with a 4 that reads as 4
  figures: { family: 'illum occult figures', file: 'EBGaramond-italic.woff2' } };
const fontDir = new URL('../../fonts/', import.meta.url);
let loaded = false;
export async function loadFace() {
  if (loaded) return FACES;
  await Promise.all(Object.values(FACES).map(async F => { const ff = new FontFace(F.family, `url(${new URL(F.file, fontDir)})`); await ff.load(); document.fonts.add(ff); }));
  loaded = true; return FACES;
}
// a run of text's ink box and advance per 100 px of font size, and the face's cap height
const metrics = {};
function metricOf(text, face = 'roman') { const key = face + '\u0000' + text; if (metrics[key]) return metrics[key];
  if (typeof OffscreenCanvas === 'undefined') { const w = [...text].reduce((a, c) => a + (c === 'I' ? .3 : c === ' ' ? .25 : c === '·' ? .2 : .66), 0) * 100; return { l: 0, r: w, a: 66, d: 0, cap: 66, adv: w }; }
  const c = new OffscreenCanvas(8, 8).getContext('2d'); c.font = `400 100px "${FACES[face].family}"`; const m = c.measureText(text), H = c.measureText('H');
  const r = { l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent, cap: H.actualBoundingBoxAscent, adv: m.width };
  if (loaded) metrics[key] = r; return r; }
export const textWidth = (text, size, face = 'roman') => { const m = metricOf(text, face); return (m.l + m.r) * size / m.cap; };
// small lettering is thickened a little so its hairlines do not fall under a pixel (the scribe's pen never made one)
// (negative: thinned, the ink engine's creep at the edge giving back what is taken; small lettering laid by the engine
// otherwise reads a weight too bold)
const thicken = (size, res = 2) => size < 7 ? .15 : size < 16 ? (res >= 2 ? -.09 : .06) : 0;   // (at one cell a px the hairlines are already at the edge of a pixel: not thinned)

// Coverage of a lettering or sign request at res cells per px: { M, w, h, x0, y0, res, col, order? }.
//   { text, x, base, size, align: 'center' | 'left', face, col }       a line of text
//   { text, arc: { c, r, a0, a1 }, size, face, col }                   round a band: each letter upright to the centre,
//     its middle on radius r, spread evenly from angle a0 to a1 (clockwise); past the bottom it is upside down, as written
//   { shape: name, x, y, h, col }                                       a traced sign, its top left at x, y, h high
//   { dot: [x, y], r, col }                                             a pen's point
// order: the cells in the order a hand writes them (along the line, round the band); a sign is written along its skeleton
// by letterWriter's own walk.
export function glyph(t, res = 2) {
  let box, draw, orderBy = null;
  if (t.polys) { const xs = t.polys.flat().map(p => p[0]), ys = t.polys.flat().map(p => p[1]); box = [Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) + 2, Math.max(...ys) + 2];
    draw = c => { c.beginPath(); for (const P of t.polys) P.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); c.lineWidth = .5; c.lineJoin = 'round'; c.stroke(); }; }
  else if (t.dot) { box = [t.dot[0] - t.r - 2, t.dot[1] - t.r - 2, t.dot[0] + t.r + 2, t.dot[1] + t.r + 2];
    draw = c => { c.beginPath(); c.arc(t.dot[0], t.dot[1], t.r, 0, TAU); c.fill(); }; }
  else if (t.shape) { const S = SIGNS[t.shape], k = t.h, grow = Math.max(0, 1.25 - k * .1) / 2;
    box = [t.x - 3, t.y - 3, t.x + S.a * k + 3, t.y + k + 3];
    draw = c => { c.beginPath(); for (const P of S.polys) P.forEach(([x, y], i) => i ? c.lineTo(t.x + x * k, t.y + y * k) : c.moveTo(t.x + x * k, t.y + y * k)); c.closePath(); c.fill('evenodd');
      if (grow > 0) { c.lineWidth = grow * 2; c.lineJoin = 'round'; c.stroke(); } }; }
  else { const face = t.face ?? 'roman', F = FACES[face], m0 = metricOf('H', face), fs = t.size / m0.cap * 100, g = thicken(t.size, res);
    if (t.arc) { const { c: C, r, a0, a1 } = t.arc, chars = [...t.text], hr = rng(t.seed ?? 1, 'hand');
      // a scribe's letters, not type: each a little larger or smaller, leaning a little, off the line a little, the spacing
      // uneven (hand: how much; MS 4670's band varies its capitals by ~±8 % and its slant by a few degrees)
      const hand = t.hand ?? .6, vary = chars.map(() => ({ k: 1 + hand * .14 * (hr() - .5), rot: hand * .1 * (hr() - .5), dr: hand * .12 * (hr() - .5) * t.size, sp: 1 + hand * .5 * (hr() - .5) }));
      const L = r * (a1 - a0), adv0 = chars.map((ch, i) => metricOf(ch, face).adv * fs / 100 * vary[i].k), fit = Math.min(1, L * .93 / adv0.reduce((a, b) => a + b, 0));
      // (words that do not go round at this size are written smaller, as a scribe crowds the end of a band)
      vary.forEach(v => { v.k *= fit; v.dr *= fit; }); const adv = adv0.map(a => a * fit), tot = adv.reduce((a, b) => a + b, 0);
      const gaps = vary.map(v => v.sp), gsum = gaps.reduce((a, b) => a + b, 0), gap = Math.max(0, L - tot) / gsum; let s = gap * gaps[0] / 2; const place = [];
      chars.forEach((ch, i) => { const th = a0 + (s + adv[i] / 2) / r; place.push({ ch, th, w: adv[i], ...vary[i] }); s += adv[i] + gap * gaps[i]; });
      const R = r + t.size * 1.2 + (t.ring?.w ?? 0) / 2; box = [C[0] - R, C[1] - R, C[0] + R, C[1] + R];
      const letters = c => { c.textAlign = 'center'; c.lineJoin = 'round'; c.lineWidth = Math.abs(g) * 2;
        for (const p of place) { if (p.ch === ' ') continue; c.save(); c.font = `400 ${fs * p.k}px "${F.family}"`; c.translate(...polar(C, r + p.dr, p.th)); c.rotate(p.th + Math.PI / 2 + p.rot);
          c.fillText(p.ch, 0, t.size * p.k / 2 * .98); if (t.ring && res < 2) { c.lineWidth = .45; c.strokeText(p.ch, 0, t.size * p.k / 2 * .98); }   // (a hole at one cell a px closes up in the ink's creep: cut it a little wider)
          if (g && !t.ring) { c.globalCompositeOperation = g < 0 ? 'destination-out' : 'source-over'; c.strokeText(p.ch, 0, t.size * p.k / 2); c.globalCompositeOperation = 'source-over'; } c.restore(); } };
      // ring: the band laid solid (the Grand Pentacle's, MS 4666 f. 56) and the letters cut out of it: holes in the ink, so
      // the page's own ground shows through them, whatever it is
      draw = t.ring ? c => { c.beginPath(); c.arc(C[0], C[1], r, 0, TAU); c.lineWidth = t.ring.w; c.stroke(); c.globalCompositeOperation = 'destination-out'; letters(c); c.globalCompositeOperation = 'source-over'; } : letters;
      orderBy = (x, y) => (((Math.atan2(y - C[1], x - C[0]) - a0) % TAU + TAU) % TAU) / Math.max(1e-6, a1 - a0); }
    else { const m = metricOf(t.text, face), k = fs / 100, w0 = (m.l + m.r) * k, left = t.align === 'left' ? t.x : t.x - w0 / 2;
      box = [left - 3, t.base - m.a * k - 3, left + w0 + 3, t.base + m.d * k + 3];
      draw = c => { c.font = `400 ${fs}px "${F.family}"`; c.lineJoin = 'round'; c.lineWidth = Math.abs(g) * 2; c.fillText(t.text, left + m.l * k, t.base); if (g) { c.globalCompositeOperation = g < 0 ? 'destination-out' : 'source-over'; c.strokeText(t.text, left + m.l * k, t.base); c.globalCompositeOperation = 'source-over'; } };
      orderBy = x => (x - left) / Math.max(1, w0); } }
  const gx = Math.floor(box[0]), gy = Math.floor(box[1]), w = Math.ceil((box[2] - gx + 1) * res), h = Math.ceil((box[3] - gy + 1) * res);
  const c = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
  c.setTransform(res, 0, 0, res, -gx * res, -gy * res); c.fillStyle = c.strokeStyle = '#000'; draw(c);
  const d = c.getImageData(0, 0, w, h).data, M = new Float32Array(w * h); for (let i = 0; i < w * h; i++) M[i] = d[i * 4 + 3] / 255;
  const L = { M, w, h, x0: gx, y0: gy, res, col: t.col ?? 'k' };
  if (orderBy) { const T = new Float32Array(w * h), ink = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i; if (M[q] <= .01) continue; T[q] = Math.max(0, Math.min(1, orderBy(gx + i / res, gy + j / res))); ink.push(q); }
    ink.sort((a, b) => T[a] - T[b]); L.order = { T, order: Int32Array.from(ink) }; }
  return L;
}

// ---- an element made ready to lay --------------------------------------------------------------------------------------------
// { marks, letters } -> { letters (coverage, each with its col), runs (the lines in runs of one ink and one nib, for the
// writer: the black construction first, then the red, then the green, as a copyist struck the figure and then wrote in it) }
export function printOf(el, { res = 2 } = {}) {
  const letters = (el.letters ?? []).map(t => { const L = glyph(t, res); L.wet = .06; L.dry = .28; return L; });
  const runs = [], marks = el.marks.flat(3), byCol = { k: [], g: [], r: [] };
  for (const mk of marks) (byCol[mk.col] ??= []).push(mk);
  for (const col of ['k', 'g', 'r']) { let run = null;
    for (const mk of byCol[col]) { if (!run || Math.abs(run.w - mk.w) > .01 || Math.abs(run.hair - mk.hair) > .01) runs.push(run = { col, w: mk.w, hair: mk.hair, strokes: [] });
      run.strokes.push({ pts: mk.pts, press: mk.press, rho: mk.rho, L: arclen(mk.pts) }); } }
  const ys = [...marks.flatMap(m => m.pts.map(p => p[1])), ...letters.map(l => l.y0)];
  return { letters, runs, y0: ys.length ? Math.min(...ys) : 0 };
}
const join = (...els) => ({ marks: els.flatMap(e => e.marks ?? []).flat(), letters: els.flatMap(e => e.letters ?? []) });

// ---- the kamea of Saturn and its sigils ---------------------------------------------------------------------------------------
// The square of Saturn (Agrippa II.22: 4 9 2 / 3 5 7 / 8 1 6): a word's letters taken as numbers (A–I 1–9, K–S 1–9,
// T–Z 1–7, the Latin alphabet of the period without J, U, W), each number's cell visited in turn; a small circle where the
// sigil begins and a bar across where it ends (Agrippa's signacula, p. 257). Any path that could read as a rune of the
// hate symbols' set is refused by sigilSafe (the word is then lengthened or another taken).
const KAMEA = { 4: [0, 0], 9: [1, 0], 2: [2, 0], 3: [0, 1], 5: [1, 1], 7: [2, 1], 8: [0, 2], 1: [1, 2], 6: [2, 2] };
const LAT = 'ABCDEFGHIKLMNOPQRSTVXYZ';
export function sigilCells(word) {
  const ns = [...word.toUpperCase().replace(/J/g, 'I').replace(/[UW]/g, 'V')].filter(ch => LAT.includes(ch)).map(ch => LAT.indexOf(ch) % 9 + 1), cells = [];
  for (const n of ns) { const c = KAMEA[n]; if (!cells.length || cells.at(-1)[0] !== c[0] || cells.at(-1)[1] !== c[1]) cells.push(c); }
  return cells;
}
// safe: at least three strokes, and no zigzag. A zigzag is two turns in a row the opposite way, each sharper than 100°
// (the shape of the S-rune and of the lightning and wolf's-hook forms); a Z / N: a stroke, a turn, and the same stroke
// again; a zig-back: any two turns sharper than 130°. A path that crosses back over its own last stroke is refused too.
export function sigilSafe(cells) {
  if (cells.length < 4) return false;
  const d = cells.slice(1).map((p, i) => [p[0] - cells[i][0], p[1] - cells[i][1]]), turn = (a, b) => Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
  const T = d.slice(1).map((v, i) => turn(d[i], v)), deg = 180 / Math.PI;
  if (d.some(v => !v[0] && !v[1])) return false;
  for (let i = 1; i < T.length; i++) if (Math.abs(T[i]) * deg > 100 && Math.abs(T[i - 1]) * deg > 100 && Math.sign(T[i]) !== Math.sign(T[i - 1])) return false;
  const same = (a, b) => Math.sign(a[0]) === Math.sign(b[0]) && Math.sign(a[1]) === Math.sign(b[1]);
  const diag = v => !!(v[0] && v[1]);   // (a stroke, a slant, the stroke again: Z, N; a slant, a stroke, the slant again: ϟ)
  for (let i = 2; i < d.length; i++) if (same(d[i], d[i - 2]) && !same(d[i], d[i - 1]) && diag(d[i]) !== diag(d[i - 1])) return false;
  if (T.filter(t => Math.abs(t) * deg > 130).length >= 2) return false;
  for (let i = 0; i < T.length; i++) if (Math.abs(T[i]) * deg > 170) return false;   // straight back along itself
  return true;
}
// words of the arts, the book and the work (each checked again at run time; these pass)
const WORDS = ['ANIMA', 'PAGINA', 'TEMPVS', 'AQVA', 'VIRTVS', 'FORTVNA', 'OPVS', 'LAPIS', 'SPES', 'DEVS', 'AGLA', 'SCRIBA'];
export function sigilFor(seed) { const r = rng(seed, 'sigil');
  for (let k = 0; k < 60; k++) { const w = WORDS[(r() * WORDS.length) | 0] + (k > 30 ? WORDS[(r() * WORDS.length) | 0] : ''), cells = sigilCells(w), span = k => Math.max(...cells.map(c => c[k])) - Math.min(...cells.map(c => c[k]));
    if (sigilSafe(cells) && span(0) === 2 && span(1) === 2) return { word: w, cells }; }   // (and it spans the square: a sliver reads as a slip of the pen)
  return { word: 'LIBER', cells: [[0, 0], [2, 0], [2, 2], [0, 2]] };   // (a square: safe by construction)
}
// the sigil drawn in box [x0, y0, s] (the kamea's cell pitch s/2): the path, its circle at the start, its bar at the end
function sigil(cells, x0, y0, s, W, col = 'k', seed = 0) {
  const P = cells.map(([i, j]) => [x0 + i * s / 2, y0 + j * s / 2]), a = P[0], rr = s * .08, d0 = [P[1][0] - a[0], P[1][1] - a[1]], l0 = Math.hypot(...d0);
  const b = P.at(-1), e = [b[0] - P.at(-2)[0], b[1] - P.at(-2)[1]], le = Math.hypot(...e), nr = [-e[1] / le, e[0] / le], L = s * .13;
  return [circle(a, rr, W, { col, seed }), pen([[a[0] + d0[0] / l0 * rr, a[1] + d0[1] / l0 * rr], ...P.slice(1)], W, { col, seed: seed + 1 }),
    rule(add(b, nr, -L), add(b, nr, L), W, { col, seed: seed + 2 })];
}

// ---- the paraph: the chapter's planet ------------------------------------------------------------------------------------------
// About two x-heights high, red, in the gap the scribe left; the chapter's planet (the week's order: the contents give
// each entry its planet, so the paraphs are wayfinding)
function paraph(x, base, u, seed, rich = .5, k = null) {
  const name = PLANETS[k ?? (rng(seed, 'planet')() * 7 | 0)], h = u * 1.9, w = signWidth(name) * h;
  return sign(name, x + u * .85 - w / 2, base + u * .12, h, 'r', seed);
}

// ---- line-fillers ------------------------------------------------------------------------------------------------------------
// signs: the planets of the hours standing on a ruled line (the tables of MS 4670), red on a black rule; band: a lettering
// band, two rules with the planets' names between them, a point between each; sigil: the kamea's sigils drawn in black on
// a rule, a red point between; rule (a heading's): a red rule ending in a crosslet.
const FILLERS = ['signs', 'band', 'sigil'];
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5, k = 0) {
  const h = yBase - yTop, u = h, W = LW(u * .9), L = x1 - x0, r = rng(seed, 'filler');
  if (kind === 'rule') { const s = h * .7; return { marks: [rule([x0, yBase - h * .45], [x1 - s * 1.1, yBase - h * .45], W, { col: 'r', seed }), ...crosslet([x1 - s * .5, yBase - h * .45], s, W, 'r', seed + 3)] }; }
  if (kind === 'band') {   // two rules and the names written between them
    const size = h * .82, y0 = yBase - size - h * .42, y1 = yBase + h * .42, start = (k + (r() * 7 | 0)) % 7, names = [];
    let t = ''; for (let i = 0; i < 14; i++) { const n = LATIN[CHALDEAN[(start + i) % 7]], next = t ? t + ' · ' + n : n; if (textWidth(next, size, 'roman') > L - size * 2) break; t = next; }
    return { marks: [rule([x0, y0], [x1, y0], W, { seed }), rule([x0, y1], [x1, y1], W, { seed: seed + 1 })],
      letters: t ? [{ text: t, x: (x0 + x1) / 2, base: yBase, size, col: 'r' }] : [] };
  }
  if (kind === 'sigil') {   // sigils on the kamea, standing between two points on the line
    const s = h * 2.15, pitch = s * 3.6, n = Math.max(1, Math.min(3, Math.floor((L - s * .4) / pitch))), off = x0 + (L - n * pitch) / 2, els = [], yb = yBase - h * .5;
    els.push({ marks: [rule([x0, yb], [off + s * .1, yb], W, { seed }), rule([off + n * pitch - s * .1, yb], [x1, yb], W, { seed: seed + 1 })] });
    for (let i = 0, used = new Set(); i < n; i++) { let g = sigilFor(seed + i * 13); for (let t = 1; used.has(g.word) && t < 9; t++) g = sigilFor(seed + i * 13 + t * 101); used.add(g.word); const sx = off + i * pitch + (pitch - s) / 2;
      els.push({ marks: sigil(g.cells, sx, yb - s / 2, s, W, 'k', seed + i) });
      els.push({ marks: [rule([off + i * pitch + s * .1, yb], [sx - s * .15, yb], W, { seed: seed + 9 + i }), rule([sx + s * 1.15, yb], [off + (i + 1) * pitch - s * .1, yb], W, { seed: seed + 19 + i })],
        letters: i < n - 1 ? [{ dot: [off + (i + 1) * pitch, yb], r: Math.max(1.2, h * .1), col: 'r' }] : [] }); }
    return join(...els);
  }
  // signs: the planets of the hours, from the chapter's day, on a black rule
  const sh = h * 1.3, step = sh * 2.4, n = Math.max(1, Math.min(7, Math.floor((L - sh) / step))), y = yBase, els = [{ marks: [rule([x0, y + h * .14], [x1, y + h * .14], W, { seed })] }];
  const day = PLANETS[k % 7], first = CHALDEAN.indexOf(day);
  for (let i = 0; i < n; i++) { const name = CHALDEAN[(first + i) % 7], w = signWidth(name) * sh; els.push(sign(name, x1 - (n - i) * step + (step - w) / 2, y, sh, 'r', seed + i)); }
  return join(...els);
}

// ---- breaks ----------------------------------------------------------------------------------------------------------------------
// The seal: the compass's double circle, the planet in red at its centre (a pentacle of the Clavicules, small)
function seal(c, R, name, W, seed = 0, { band = false } = {}) {
  // the ring drawn by hand, round twice without lifting, the second turn inside the first
  const els = [{ marks: [handCircle(c, R, W, { seed, turns: 2, r2: R * (band ? .78 : .86) })] }], h = R * (band ? .9 : 1.02), w = signWidth(name) * h;
  els.push(sign(name, c[0] - w / 2, c[1] + h / 2, h, 'r', seed + 2));
  return join(...els);
}
// Dee's Monas (1564, p. 25), drawn as a hand with a pen draws it (after the woodcut's proportions, research/13, in units
// of its height): few strokes, each continuous, joined where a pen joins. The Moon's horns in one sweep, down the lower
// edge from tip to tip and back along the upper, closing over the first tip; the circle in one stroke that goes round
// twice, the second turn inside the first (the woodcut's double ring, drawn without lifting); the stem pulled down from
// the circle to the foot and swung on out into the right arc of Aries without lifting; the left arc swung out from the
// foot; the bar drawn across the stem, heavier; the point last, in red. The ink merges where the strokes cross and join.
function monas(cx, top, h, W, seed = 0) {
  const P = (x, y) => [cx + x * h, top + y * h], Wm = W * 1.1, amp = h * .004, marks = [];
  // the horns: the lower edge from the left tip to the right, then back along the upper, over the left tip a little
  // (remeasured at full size: the crescent is a narrow band, its two edges meeting at the tips: the lower edge through
  // .22 at the middle, radius .2334 about y -.0134; the upper through .19, radius .2379 about y -.0479)
  const lo = Math.atan2(.0134, .233), up = Math.atan2(.0479, .233), cLo = P(0, -.0134), cUp = P(0, -.0479), rLo = .2334 * h, rUp = .2379 * h;
  const horns = [...arc(cLo, rLo, Math.PI - lo, lo, 0), ...arc(cUp, rUp, up, Math.PI - up + .03, 0)];
  // the weave (p. 25 at full size): the horns pass UNDER the double ring on the left and OVER it on the right. Each is a
  // solid band, the crescent between its two edges, the ring between its two circles: what passes under is hidden
  // across the whole of the band over it, and a hair of paper either side of the band's edges (g: half the line and the
  // hair of paper; the two cross at a shallow angle, so a little more would open a long gap, as the woodcut does not)
  const C = P(0, .31), rO = .228 * h, rI = .211 * h, g = Wm * .5 + 1.5 + amp * .5, d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const underRing = p => p[0] < cx && d(p, C) > rI - g && d(p, C) < rO + g;                       // the left: the horn under the ring
  const underHorn = p => p[0] > cx && d(p, cLo) < rLo + g && d(p, cUp) > rUp - g;                 // the right: the ring under the horn
  occlude(horns, underRing).forEach((q, k) => marks.push(sketch(q, Wm, { seed: seed + k * 5, amp, swell: .35 })));
  marks.push(...handCircle(C, rO, Wm, { seed: seed + 1, turns: 2, r2: rI, amp: .01, hide: underHorn }));
  // Aries: each arc a half-ellipse rising straight up out of the stem's foot (1.0) to a peak at ±.115, .81 and falling to
  // ±.224, .946 (measured again on p. 25: the woodcut's arcs are taller than they are wide, not circles)
  const aries = sd => Array.from({ length: 41 }, (_, i) => { const t = Math.PI + (Math.PI - .25) * i / 40; return P(sd * (.115 + .113 * Math.cos(t)), .99 + .18 * Math.sin(t)); });
  // the stem from the circle down to the foot, and on without lifting into the right arc
  const stem = resample([P(0, .538), P(0, .99)], 1), right = aries(1), fs = arclen(stem) / (arclen(stem) + arclen(right));
  marks.push(sketch([...stem, ...right], Wm, { seed: seed + 2, amp: amp * .6, swell: .3, press: f => f < fs ? 1.45 : 1.05 }));
  marks.push(sketch(aries(-1), Wm, { seed: seed + 3, amp: amp * .6, swell: .3, press: () => 1.05 }));
  // the bar, drawn across the stem, heavy
  marks.push(handRule(P(-.236, .66), P(.236, .66), Wm, { seed: seed + 4, press: () => 1.5, bow: .006 }));
  return { marks, letters: [{ dot: P(0, .31), r: Math.max(1.4, h * .016), col: 'r' }] };
}
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8, n = 1, room = null) {
  const W = LW(u);
  if (rank < 2) {   // the chapter's seal on its band: two rules each side, lettered CAPVT and the chapter's number
    const R = u * 2.3, name = PLANETS[n % 7], half = Math.min(measure * .46, u * 24), bh = u * 2.3, size = u * 1.1, els = [seal([cx, y], R, name, W, seed)];
    for (const s of [-1, 1]) { const a = cx + s * (R + u * .7), b = cx + s * half;
      els.push({ marks: [handRule([a, y - bh / 2], [b, y - bh / 2], W, { seed: seed + 3 + s }), handRule([a, y + bh / 2], [b, y + bh / 2], W, { seed: seed + 5 + s })] }); }
    if (rich >= .25) { const left = 'CAPVT', right = ORD[n] ?? roman(n);
      els.push({ marks: [], letters: [{ text: left, x: cx - (R + u * .7 + half) / 2, base: y + size / 2, size, col: 'r' }, { text: right, x: cx + (R + u * .7 + half) / 2, base: y + size / 2, size, col: 'r' }] }); }
    return join(...els);
  }
  // a book: the Monas, Dee's motto lettered under it on a band
  // (in a room too low for it, smaller, kept a little clear of what is above and below; under seven x-heights, the motto left
  // out and the figure alone in the room)
  const free = room ? room[1] - room[0] - u * 1.2 : Infinity, band = u * 3.4, motto = rich >= .25 && free - band >= u * 7;
  const h = Math.min(u * 13.5, motto ? free - band : free), top = y - (h + (motto ? u * 3.2 : 0)) / 2, els = [monas(cx, top, h, W, seed)];
  if (motto) { const txt = 'QVI NON INTELLIGIT AVT TACEAT AVT DISCAT', size = Math.min(u * 1, measure * .9 / textWidth(txt, 1)), w = textWidth(txt, size) / 2 + u * 1.2, yb = top + h + u * 2.6;
    els.push({ marks: [handRule([cx - w, yb - size - u * .65], [cx + w, yb - size - u * .65], W, { seed: seed + 30 }), handRule([cx + w, yb + u * .65], [cx - w, yb + u * .65], W, { seed: seed + 31 })],
      letters: [{ text: txt, x: cx, base: yb, size, col: 'r' }] }); }
  return join(...els);
}

// ---- the drop initial ---------------------------------------------------------------------------------------------------------
// A pentacle as the Clavicules draw one: a red double rule round a square, its rules running on past the corners (MS 4666
// f. 55–56); a thin compass circle; the band, after the Grand Pentacle (MS 4666 f. 56), laid solid in the ink with its
// capitals cut out of it, so the page shows through them (light: a dark ring, the letters paper; dark: a pale ring, the
// letters the dark ground); within it, struck in verdigris as MS 4670's seal (f. 54), a circle and the cross of its
// diameters, broken round the capital; at the end of each arm a pair of red crosslets (f. 54's + +); at the centre the
// capital of IM FELL Double Pica in red. The band reads ALPHA · ET · OMEGA · PRINCIPIVM · ET · FINIS (Rev. 22:13;
// f. 54 has ALPHA ET OMEGA), each capital a little different, as a scribe's are. set 'ring' (default) | 'band' (the
// capitals written in red between black circles, after f. 54). title: the band's words.
// G.box: [x0, capTop, x1, baseline] of the space the host floated; initial.width() gives that width in cap heights.
function initial({ ch = 'B', G, big = true, rich = .5, seed = 1, set = 'ring', title = 'ALPHA ET OMEGA PRINCIPIVM ET FINIS', u = 8 }) {
  ch = String(ch).normalize('NFD')[0].toUpperCase(); const [x0, y0, x1, y1] = G.box, H = y1 - y0;
  if (!/[A-Z]/.test(ch)) return { letter: ch, marks: [], letters: [], width: x1 - x0 };
  if (!big) { const m = textWidth(ch, H); return { marks: [], letters: [{ text: ch, x: x0 + m / 2, base: y1, size: H, col: 'r' }], width: m }; }
  const S = Math.min(x1 - x0, H), c = [x0 + S / 2, y0 + S / 2], W = Math.max(1.3, S * .011), gap = S * .028, run = S * .045, els = [];
  els.push({ marks: doubleRule([x0, y0, x0 + S, y0 + S], gap, W, run, { col: 'r', seed }) });
  const R = S / 2 - gap * 2, band = R * .23, rm = R - W * 1.5 - band / 2, Ri = rm - band / 2, size = band * .64;
  const text = String(title).toUpperCase().trim().split(/\s+/).join(' · ') + ' ·', a0 = -Math.PI / 2 + .02, a1 = -Math.PI / 2 + TAU - .02;
  if (set === 'band') els.push({ marks: [circle(c, R, W, { seed: seed + 1 }), circle(c, rm + band / 2, W, { seed: seed + 2 }), circle(c, Ri, W, { seed: seed + 3 })],
    letters: [{ text, arc: { c, r: rm, a0, a1 }, size, col: 'r', seed }] });
  else els.push({ marks: [circle(c, R, W, { seed: seed + 1 })], letters: [{ text, arc: { c, r: rm, a0, a1 }, ring: { w: band }, size: size * 1.04, col: 'k', seed }] });
  // the capital at the centre, as large as the field allows with the cross still showing round it
  const Rg = Ri - Math.max(W * 1.6, S * .02), cap = Math.min(Rg * .98, Rg * 1.3 / Math.max(.5, textWidth(ch, 1))), cw = textWidth(ch, cap);
  const capBox = { box: [c[0] - cw / 2 - W * 1.6, c[1] - cap / 2 - W * 1.6, c[0] + cw / 2 + W * 1.6, c[1] + cap / 2 + W * 1.6] }, Wg = Math.max(1.2, W * .85);
  // the field, in verdigris: its circle and the cross of its diameters, the cross stopped short of the capital
  const field = [circle(c, Rg, Wg, { col: 'g', seed: seed + 4 })];
  if (rich >= .25) for (const [a, b] of [[[c[0], c[1] - Rg], [c[0], c[1] + Rg]], [[c[0] - Rg, c[1]], [c[0] + Rg, c[1]]]]) clip(a, b, [capBox]).forEach(([p, q], k) => field.push(rule(p, q, Wg, { col: 'g', seed: seed + 5 + k })));
  els.push({ marks: field });
  // the crosslets: a pair at the end of each arm, either side of it (f. 54); one between the arms on a plainer page
  const cs = Rg * .17;
  for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2 - Math.PI / 2, n = [-Math.sin(a), Math.cos(a)];
    if (rich >= .5) for (const sd of [-1, 1]) els.push({ marks: crosslet(add(polar(c, Rg * .72, a), n, sd * cs * .95), cs, Math.max(1.2, W * .85), 'r', seed + 10 + q * 2 + sd) });
    else els.push({ marks: crosslet(polar(c, Rg * .72, a + Math.PI / 4), cs, Math.max(1.2, W * .85), 'r', seed + 10 + q) }); }
  els.push({ marks: [], letters: [{ text: ch, x: c[0], base: c[1] + cap / 2, size: cap, col: 'r' }] });
  return { ...join(...els), width: S };
}
initial.width = () => 1;   // the square is as wide as the drop is tall
initial.line = ch => textWidth(String(ch).normalize('NFD')[0].toUpperCase(), 1);

// ---- frames -------------------------------------------------------------------------------------------------------------------
// The figure's furniture in the Clavicules: the red double rule round the leaf with its rules running past the corners
// (MS 4666); the seal; the ruled table of the planetary hours (MS 4670); the lettering band.
// a box grown just clear of its words (lines: the browser's line boxes) where they run closer than d to its sides
const clear = (B, lines, d) => !lines?.length ? B : [Math.min(B[0], Math.min(...lines.map(l => l.left)) - d), B[1], Math.max(B[2], Math.max(...lines.map(l => l.right)) + d), B[3]];
const frames = {
  // a quotation: the red double rule round it
  quote: ({ box, u, seed, rich = .5, lines }) => { const W = LW(u), B = clear([box[0], box[1] - u * 1.4, box[2], box[3] + u * 1.2], lines, u * 1.05 + W);
    return { marks: doubleRule(B, u * .45, W, u * .9, { col: 'r', seed }) }; },
  // a figure: the double rule round it, and in its corners the four seals of the planets that rule the chapter's first hours
  figure: ({ box, cap, u, seed, rich = .5, n = 1, limit = null }) => { const W = LW(u), R = u * 1.6, g = u * .45, B = [box[0] - u * 2, box[1] - u * 2, box[2] + u * 2, (cap ?? box[3]) + u * 1.6];
    if (limit) { B[0] = Math.max(B[0], limit[0] + R + 2); B[2] = Math.min(B[2], limit[1] - R - 2); }   // (limit: the page's edges, which a corner seal may not cross)
    const corners = [[B[0] + g / 2, B[1] + g / 2], [B[2] - g / 2, B[1] + g / 2], [B[2] - g / 2, B[3] - g / 2], [B[0] + g / 2, B[3] - g / 2]];
    const els = [{ marks: doubleRule(B, g, W, u * 1, { col: 'r', seed }, rich >= .25 ? corners.map(c => ({ c, r: R + u * .45 })) : []) }];
    if (rich >= .25) { const day = CHALDEAN.indexOf(PLANETS[n % 7]);
      corners.forEach((p, k) => { const s = seal(p, R, CHALDEAN[(day + k) % 7], W, seed + 10 + k * 5);
        els.push(s); }); }
    return join(...els); },
  // code: the table of the planetary hours across its head (MS 4670 f. 63): twelve cells, numbered, the hour's planet in each,
  // the whole ruled in green; a green rule round the code beneath
  code: ({ box, u, seed, rich = .5, n = 1, lines }) => { const W = LW(u), B = box, els = [{ marks: [pen([[B[0], B[1]], [B[2], B[1]], [B[2], B[3]], [B[0], B[3]], [B[0], B[1] - W * .4]], W, { col: 'g', seed })] }];
    const cols = (B[2] - B[0]) / (u * 3.2) >= 12 ? 12 : 6,   // (a day's twelve hours, or the first six of them)
      cw = (B[2] - B[0] - u * 1.2) / cols, rh = Math.min(u * 4, cw * .72);
    // (only where the box leaves room for it above the code)
    if (rich >= .25 && !(lines?.length && lines[0].top < B[1] + u * 1.2 + rh * 2)) { const top = B[1] + u * .6, day = CHALDEAN.indexOf(PLANETS[n % 7]);
      const ys = [top, top + rh, top + rh * 2], g = [];
      for (const y of ys) g.push(rule([B[0] + u * .6, y], [B[2] - u * .6, y], W, { col: 'g', seed: seed + y }));
      for (let i = 0; i <= cols; i++) { const x = B[0] + u * .6 + i * (B[2] - B[0] - u * 1.2) / cols; g.push(rule([x, top], [x, top + rh * 2], W, { col: 'g', seed: seed + 50 + i })); }
      els.push({ marks: g });
      const cw2 = cw, sh = rh * .66;
      for (let i = 0; i < cols; i++) { const cx = B[0] + u * .6 + (i + .5) * cw2, name = CHALDEAN[(day + i) % 7], w = signWidth(name) * sh;
        els.push({ marks: [], letters: [{ text: String(i + 1), x: cx, base: top + rh * .5 + rh * .22, size: rh * .44, face: 'figures', col: 'r' }] }, sign(name, cx - w / 2, top + rh * 1.83, sh, 'r', seed + i)); }
      void cw; }
    return join(...els); },
  // a pull quote: lettering bands above and below, each broken at the middle by a seal
  pull: ({ cx, yTop, yBot, measure, u, seed, rich = .5, n = 1 }) => { const W = LW(u), half = Math.min(measure * .42, u * 20), R = u * 1.8, bh = u * 1.1, els = [];
    [[yTop, PLANETS[n % 7]], [yBot, PLANETS[(n + 1) % 7]]].forEach(([y, name], k) => {
      for (const s of [-1, 1]) els.push({ marks: [rule([cx + s * (R + u * .6), y - bh / 2], [cx + s * half, y - bh / 2], W, { seed: seed + k * 9 + s }), rule([cx + s * (R + u * .6), y + bh / 2], [cx + s * half, y + bh / 2], W, { seed: seed + k * 9 + s + 3 })] });
      els.push(seal([cx, y], R, name, W, seed + 20 + k)); });
    return join(...els); },
  // an aside: the red double rule round the note, NOTA lettered in a cartouche that breaks its head, a seal at its foot
  aside: ({ box, u, seed, rich = .5, n = 1, title = 'NOTA', lines }) => { const W = LW(u), B = clear(box, lines, u * 1.05 + W), cx = (B[0] + B[2]) / 2, size = u * 1.25, tw = textWidth(title, size) / 2 + u * 1.2;
    const sealC = [cx, B[3] - u * .22], sR = u * 1.7;
    const els = [{ marks: doubleRule(B, u * .45, W, u * .9, { col: 'r', seed }, [{ box: [cx - tw - u * .45, B[1] - u * 1.65, cx + tw + u * .45, B[1] + u * 2.05] }, ...(rich >= .5 ? [{ c: sealC, r: sR + u * .45 }] : [])]) }];
    // the cartouche: the head's rules broken and a small box round the word
    els.push({ marks: [rule([cx - tw, B[1] - u * 1.2], [cx + tw, B[1] - u * 1.2], W, { seed: seed + 5 }), rule([cx + tw, B[1] - u * 1.2], [cx + tw, B[1] + u * 1.6], W, { seed: seed + 6 }),
      rule([cx + tw, B[1] + u * 1.6], [cx - tw, B[1] + u * 1.6], W, { seed: seed + 7 }), rule([cx - tw, B[1] + u * 1.6], [cx - tw, B[1] - u * 1.2], W, { seed: seed + 8 })],
      letters: [{ text: title, x: cx, base: B[1] + u * .2 + size / 2, size, col: 'r' }] });
    if (rich >= .5) els.push(seal(sealC, sR, PLANETS[n % 7], W, seed + 12));
    return join(...els); },
  // the contents: a red double rule down the margin, each entry's planet beside it (its chapter's paraph is that sign)
  nav: ({ box, entries, x, u, seed, rich = .5, side = true }) => { const W = LW(u), els = [];
    if (side) els.push({ marks: [rule([x + u * .8, box[1] - u * 1.6], [x + u * .8, box[3] + u * 1.4], W, { col: 'r', seed }), rule([x + u * 1.3, box[1] - u * 1.6], [x + u * 1.3, box[3] + u * 1.4], W, { col: 'r', seed: seed + 1 })] });
    else els.push({ marks: [rule([box[0] - u * .2, box[1] - u * 1.6], [Math.min(box[2], box[0] + u * 26), box[1] - u * 1.6], W, { col: 'r', seed }), rule([box[0] - u * .2, box[1] - u * 2.1], [Math.min(box[2], box[0] + u * 26), box[1] - u * 2.1], W, { col: 'r', seed: seed + 1 })] });
    entries.forEach((e, k) => { const name = PLANETS[(k + 1) % 7], h = u * 1.7, w = signWidth(name) * h, px = side ? x + u * 2.5 : box[0] - u * 2.2;
      els.push(sign(name, px - w / 2, e.base + u * .1, h, 'r', seed + k)); });
    return join(...els); },
};

// ---- palette -------------------------------------------------------------------------------------------------------------------
// Light: the manuscripts' inks (research/13: red [199 124 94] / [211 123 119], black-brown [79 69 65], verdigris
// [127 180 156], each on aged paper) brought back toward what they were before the paper yellowed: a vermilion, an iron
// gall black-brown, a verdigris. Dark: the page by lamplight: the black a warm pale ink, the red and green lifted so they
// hold beside it.
export const palette = {
  light: { k: [52, 42, 36], r: [184, 58, 38], g: [70, 138, 112] },
  dark: { k: [226, 214, 196], r: [232, 112, 84], g: [116, 182, 152] },
};

// ---- in the one library (kit/illum.js) ---------------------------------------------------------------------------------------
// The registry's paraph is given the chapter's number n (0 before the first): the chapter's planet, the week's order.
const chapterParaph = (x, base, u, seed, rich, n) => paraph(x, base, u, seed, rich, typeof n === 'number' ? n % 7 : null);
// A case made ready to lay: its lettering and signs as coverage, its lines in runs of one ink and one nib
const print = (made, { dpr = 1 }) => printOf(made, { res: dpr >= 1.5 ? 2 : 1 });
// A case on a hand's clock (seconds), still or written alike: the construction first (compass and ruler, black, then green,
// then red), then the writing into it, laid over the lines (a big letter or a band at a hand's pace, a sign or a word
// quickly). The case takes at most `cap` (a drop initial 3.6 s; the contents .9 s; a paraph, filler, line initial or pull
// quote 1.2 s; the rest 2.2 s).
function timeline(pr, kind) {
  const own = []; let u = 0;
  for (const r of pr.runs) { const L = r.strokes.reduce((a, s) => a + s.L, 0), d = Math.max(.05, L / 320 + r.strokes.length * .03); own.push({ t0: u, t1: u + d, run: r }); u += d; }
  for (const L of pr.letters) { const sz = Math.max(L.w, L.h) / L.res, d = sz > 60 ? (L.order ? 2.2 : 2.4) : sz > 30 ? .9 : .45; own.push({ t0: u, t1: u + d, letter: L, over: true }); u += d + .06; }
  return { own, u, cap: kind === 'drop' ? 3.6 : kind === 'nav' ? .9 : ['paraph', 'filler', 'initial', 'pull'].includes(kind) ? 1.2 : 2.2 };
}
initial.load = () => loadFace();
initial.margin = .42;   // the gap to the words, in line heights
initial.fills = true;   // the pentacle's square is the float: its box is the float as the page laid it
// the contents' rule stands a little further out in the margin than the library's default, and only where there is room
const nav = a => frames.nav({ ...a, x: a.box[0] - a.u * 4.2, side: a.box[0] > 60 });

export const occult = { label: 'Occult', minGap: 2, theme: { rubric: 'rgb(160 64 40)', rubricDark: 'rgb(222 120 92)' },
  setup: () => ({ kinds: FILLERS }), kinds: (v, rich) => rich < .25 ? ['signs'] : rich < .5 ? ['signs', 'band'] : FILLERS,
  fillAt: { gap: .9, head: 4, rise: 1.05 },   // a filler starts .9 x-heights after the words, a heading's only if 4 are left
  hurry: [4, 1, 1.5, 1.6], steady: ['drop'],   // as you read, a hand behind quickens (a second at the least), never on the drop initial
  inks: ['k', 'g', 'r'],   // a still strikes every figure's lines in black, then the green, then the red, as a copyist did
  paraph: chapterParaph, filler, breakMark, initial, frames: { ...frames, nav }, palette, print, timeline,
  FILLERS, PLANETS, glyph, loadFace, printOf, sigilFor, sigilSafe, sigilCells, monas, signs: { paraph } };
export default occult;
