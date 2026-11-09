// Copperplate, direction studies, stage 3 (research/23-copperplate.md). B (the writing master's pen) and C (command of hand),
// kept apart: B is one great shaded oval round the capital and the copybook's single gestures, written with the ink
// engine's pen in iron-gall ink; C is Bickham's rosette (ovals within and through each other, dot-curls and thorns, a heavy
// text capital) and its loop chains, cut as engraved strokes. They share the plumbing: the movement
// (kit/styles/copperplate-hand.js) and the flexible pen's weight (copperplate-print.js press(), fitted to Bickham's oval).
// Every piece: { W, H, strokes, letter?, medium, base? } in its own px; d = device px a css px (the engraved hairline never
// drawn under the engine's floor, 1.2 device px).
//   each stroke: { p, w, balls, t } — t: the hand's time at each point (ms), for ?draw
import { SLANT, burin, press, stroke, cubic, beauty, curl, join, lensShape, coverage, glyph, glyphStrokes } from './copperplate-print.js';
import { move, chain, fit, rosettePlan, smooth } from './copperplate-hand.js';
import { stream, resample } from '../marks.js';

const PI = Math.PI, TAU = 2 * PI;
// the shade axes. The pen: pulled down the slant toward the writer, and only that way (a pointed pen cannot shade an
// up-stroke). The engraver of the command of hand: down the plate, both sides of an oval, the far one ~.7 as hard (0040).
const PEN = { axis: [-Math.cos(SLANT), Math.sin(SLANT)], reverse: 0 }, BURIN = { axis: [0, 1], reverse: .7 }, LACE = { axis: [0, 1], reverse: 0, falloff: 55, tight: .07 };
const hairOf = (peak, d) => Math.max(peak / 10, 1.2 / d) / 2;
// C's hairline (stage 4): laid flat, not through the engine, so it can be finer than a device px: the master's tenth of a
// shade, never under .55 of a device px (a fine grey thread at that, as an engraved hairline seen small)
const fineOf = (peak, d) => Math.max(peak / 10, .75 / d) / 2;
const deg = a => a * PI / 180;
const slantPt = (c, a, b, t) => { const sd = [Math.cos(SLANT), -Math.sin(SLANT)], sn = [Math.sin(SLANT), Math.cos(SLANT)]; return [c[0] + sd[0] * a * Math.cos(t) + sn[0] * b * Math.sin(t), c[1] + sd[1] * a * Math.cos(t) + sn[1] * b * Math.sin(t)]; };

// The hand's pace along a path (px/ms): quick on the long runs, slower into a turn (as the cube root of its radius, the
// two-thirds power law of drawing movements), easing in at the start and out at the end. Returns cumulative ms.
export function pace(p, vmax = .9) {
  const n = p.length, t = [0];
  for (let i = 1; i < n; i++) { const a = p[Math.max(0, i - 4)], b = p[i], c = p[Math.min(n - 1, i + 4)];
    const h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0]); let dh = h2 - h1; dh -= Math.round(dh / TAU) * TAU;
    const R = Math.hypot(c[0] - a[0], c[1] - a[1]) / 2 / (Math.abs(dh) + 1e-4), f = i / (n - 1);
    const v = vmax * Math.min(1, Math.cbrt(R / 80)) * (.3 + .7 * Math.sin(Math.min(1, f * 8, (1 - f) * 6) * PI / 2));
    t.push(t[i - 1] + Math.hypot(b[0] - p[i - 1][0], b[1] - p[i - 1][1]) / Math.max(.03, v)); }
  return t;
}
// one stroke of the hand: the path cut by the burin's steadiness (or the pen's), its weight from the flexible pen's pressure
// along it (press: nothing is drawn at a constant width), its ends
// (ease: [u0, u1, k] the pressure eased to k over that share of the stroke's length, easing in and out: a passage the hand
// carries lightly, as the sweep out of a letter that must not drown the oval's own swell)
function written(path, seed, { hair, peak, how, start = 'point', end = 'ball', amp = .12, ball = 1.9, ease = null }) {
  const p = burin(path.p ?? path, seed, amp, 70, .5), t = pace(p), w = press(p, t, { hair, peak: peak / 2, ...how });
  if (ease) { const [u0, u1, k] = ease, n = p.length; for (let i = 0; i < n; i++) { const u = i / (n - 1), f = u < u0 || u > u1 ? 0 : Math.min(1, (u - u0) / .03, (u1 - u) / .03); w[i] = hair + (w[i] - hair) * (1 - f * (1 - k)); } }
  const S = stroke(p, w, { start, end, hair, ball }); S.t = t; return S;
}
// a dot-curl: a hairline that turns into a small tightening curl and closes on a dot (Bickham's accents among his ovals)
function dotCurl(p, h, r, sense, seed, o) { return written(join([p, [p[0] + Math.cos(h) * r * .8, p[1] + Math.sin(h) * r * .8]], curl([p[0] + Math.cos(h) * r * .8, p[1] + Math.sin(h) * r * .8], h, r, sense, 1.15)), seed, { ...o, peak: o.hair * 2.4, start: 'point', end: 'ball', amp: .03 }); }
// a thorn: the engraver's small shaded comma, a swelling crescent that ends in a fine hooked point
function thorn(p, h, L, sense, seed, { hair, peak }) {
  const q = resample(join(beauty(p, [p[0] + Math.cos(h) * L, p[1] + Math.sin(h) * L], .18 * sense, 24), curl([p[0] + Math.cos(h) * L, p[1] + Math.sin(h) * L], h + sense * 1.2, L * .22, sense, .6)), .4);
  let s = 0; const S = [0]; for (let i = 1; i < q.length; i++) S.push(s += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]));
  const w = Float32Array.from(S, u => hair * .6 + (peak / 2) * lensShape(Math.min(.999, u / s * 1.25), .3));
  const st = stroke(q, w, { start: 'point', end: 'point', hair }); st.t = pace(q, .4); return st;
}

// ==== B · the writing master's pen ================================================================================================
// B's making, term by term (stage 4; the page sets these from ?geo= ?wet= ?rough= ?rim= ?letter=, for the before/after):
//   geo     the hand's oval: it does not close on itself (it turns in, ~x.9 a turn, as Champion's O does), its slant drifts a few
//           degrees through the turn and its middle moves on with the arm, and it is a little fuller on one side; 0: a true ellipse
//   wet, rough, rim   the ink engine: how wet the iron gall, how much tooth the paper has, how much ink the flexed tines draw
//           to the swell's two edges (the rails)
//   letter  'pen': the capital written by the same pen along its skeleton (glyphStrokes); 'face': poured from the face
export const B_OPTS = { geo: 1, wet: .45, rough: .6, rim: .7, letter: 'face', line: 'crisp' };   // (kept after the before/after: geo, wet, rim; rough showed nothing, the pen-written letter broke the face's swells and joins)
// (the quill's hairline: never under the engine's floor, 1.1 device px, or the paper's tooth breaks it into beads)
// (crisp: a twelfth of the piece's shade, as Champion's hairline is about a tenth, never under .6 of a device px)
// (stage 8: at text size a crisp line under ~1.1 device px breaks into steps and beads, so the hairline is a tenth of the piece's
// shade (a twelfth for a drop, whose shade is large) and never under 1.1 device px)
const penHair = (d, pk = 0, ratio = 10) => B_OPTS.line === 'crisp' ? Math.max(pk / ratio, 1.1 / (d || 2)) / 2 : Math.max(.3, .55 / (d || 2));
// stage 5: B's line laid crisp (line 'crisp'): the shade's edge sharp and its ends drawn to points, the hairline a fine steady
// thread (the speed term on it eased), the ink black-brown and deeper where the hand slowed (poolMap); 'engine': stage 4's pour
const PEN_HOW = () => B_OPTS.line === 'crisp' ? { ...PEN, slow: .12 } : PEN;
// One great oval on the slant round the capital: entered as a hairline from below left, run once round and a little more,
// the pen opening on its left side where it is pulled down the slant; a curl or two inside (stage 1's composition, which
// the user liked, now with the pen's weight). The rest are the copybook's single gestures.
// The capital's free ends, where the pen can join it: the ends of its skeleton (glyphStrokes, at 3 cells a px), each with
// the way into the letter from there. A stroke's start is a true end of the skeleton; its last point may be a fork, so only
// starts, and lasts that no other stroke passes near, count.
function letterEnds(ch, face, cap, cx, cy, W, H) {
  const L = coverage([], [0, 0, W, H], 3, glyph(ch, face, cap, cx, cy)), S = glyphStrokes(L, { min: 6 }), ends = [];
  const near = (q, self) => S.some(o => o !== self && o.p.some(v => Math.hypot(v[0] - q[0], v[1] - q[1]) < 1.2));
  for (const st of S) { const p = st.p, n = p.length; if (n < 6) continue;
    const a = p[0], b = p[Math.min(n - 1, 6)], la = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; ends.push({ pt: a, inward: [(b[0] - a[0]) / la, (b[1] - a[1]) / la], w: st.w[0] });
    const z = p[n - 1], y = p[Math.max(0, n - 7)], lz = Math.hypot(y[0] - z[0], y[1] - z[1]) || 1; if (!near(z, st)) ends.push({ pt: z, inward: [(y[0] - z[0]) / lz, (y[1] - z[1]) / lz], w: st.w[n - 1] }); }
  return ends;
}
// One great oval on the slant round the capital, and the whole of it one written gesture (stage 6): the pen sets down in a
// small curl at the far foot, runs in as a hairline along the foot, turns the great oval (opening down its left side), and
// the oval's end runs on, without a lift, into the capital at its nearest free end, arriving the way the letter's stroke goes;
// the capital (the face's body) is the pen's next stroke; and the capital's exit, where it points, flies out into a tightening
// curl closing on a ball. Every curl is the end of a stroke; where the pen lifts (into and out of the face) the next stroke
// sets off where the last one points. The rest are the copybook's single gestures.
const pen = {
  initial(ch, H, seed, d, op = {}) {
    const { vary = 0 } = op, pv = vary ? stream(vary, 'pen:page') : null, W = Math.round(H * 1.06), pk = H * .085, hair = penHair(d, pk, 12), c = [W * .52, H * .5], o = [], g = B_OPTS.geo, r = stream(seed, 'pen-oval:' + ch);
    // (a page given its own seed: the great oval rounder or longer, leaning a little more or less)
    const ob = pv ? .33 + pv() * .07 : .37, oa = pv ? .58 + pv() * .06 : .61;
    // (the hand's oval: turning in by ~10 % over the turn, its slant drifting ~3 deg, its middle carried on by the arm, a
    // little fuller on the side it pulls down; all from the turn's own progress u, none of it noise)
    const t0 = PI * 1.12, ph = r() * TAU, tilt0 = (r() - .5) * deg(3);   // (begun at the oval's foot, moving right, so the hairline runs straight in)
    for (let t = t0; t <= t0 + TAU * 1.04; t += .02) { const u = (t - t0) / TAU, sc = 1 - g * .1 * u, eg = 1 + g * .05 * Math.sin(t + ph), tl = g * (tilt0 + deg(3) * u);
      const q = slantPt([c[0] + g * H * .03 * u, c[1] - g * H * .015 * u], H * oa * sc * eg, H * ob * sc, -t), ct = Math.cos(tl), st = Math.sin(tl);
      o.push([c[0] + (q[0] - c[0]) * ct - (q[1] - c[1]) * st, c[1] + (q[0] - c[0]) * st + (q[1] - c[1]) * ct]); }
    const how = PEN_HOW(), letter = { ch, face: '"CopperB"', cap: H * .78, cx: W * .53, cy: H * .49, pen: B_OPTS.letter === 'pen', thin: B_OPTS.line === 'crisp' ? .4 : .3 };
    // the capital's free ends: the pen comes into the one farthest up and right out of a small curl (its touch-down), and
    // leaves by the one farthest down and left
    const ends = letterEnds(ch, letter.face, letter.cap, letter.cx, letter.cy, W, H), strokes = [];
    const into = ends.slice().sort((a, b) => (b.pt[0] - b.pt[1]) - (a.pt[0] - a.pt[1]))[0], from = ends.filter(e => e !== into).sort((a, b) => (a.pt[0] - a.pt[1] * 1.2) - (b.pt[0] - b.pt[1] * 1.2))[0];
    if (into) { const p0 = [into.pt[0] - into.inward[0] * H * .1, into.pt[1] - into.inward[1] * H * .1], h = Math.atan2(-into.inward[1], -into.inward[0]);
      const set = curl(p0, h, H * .05, -1, 1.15).reverse();
      strokes.push(written(join(set, [[into.pt[0] + into.inward[0] * H * .015, into.pt[1] + into.inward[1] * H * .015]]), seed + 2, { hair, peak: pk * .5, how, start: 'ball', end: 'point', amp: .04 })); }
    // the capital is written next (letterAfter); then the pen leaves it by its last end, runs out to the far foot, turns
    // there in a small loop, and comes back along the foot into the great oval, whose turn closes inside itself and ends in
    // a tightening curl: one movement from the capital to the last curl
    const tg = [o[1][0] - o[0][0], o[1][1] - o[0][1]], tl = Math.hypot(...tg) || 1, u0 = [tg[0] / tl, tg[1] / tl];
    if (from) { const out = [-from.inward[0], -from.inward[1]], st = [from.pt[0] + from.inward[0] * H * .015, from.pt[1] + from.inward[1] * H * .015];
      // (one smooth sweep out of the letter's last end and round into the oval's start along the way it sets off: the turn
      // at the foot is the hand's, not a corner)
      const lead = cubic(st, [st[0] + out[0] * H * .3, st[1] + out[1] * H * .3], [o[0][0] - u0[0] * H * .38, o[0][1] - u0[1] * H * .38], o[0], 60);
      const tail = move(o.at(-1), Math.atan2(o.at(-1)[1] - o.at(-3)[1], o.at(-1)[0] - o.at(-3)[0]), [{ run: H * .03 }, { curl: H * .05, sense: -1, turns: 1.15 }], { lag: H * .02 });
      const all = join(lead, o, tail.p), uLead = lead.length / all.length;
      strokes.push(written(all, seed + 1, { hair, peak: pk, how, start: 'point', end: 'ball', amp: .25, ease: [0, uLead, .3] })); }
    else strokes.push(written(o, seed + 1, { hair, peak: pk, how, start: 'point', end: 'ball', amp: .25 }));
    const crisp = B_OPTS.line === 'crisp';
    // (letterAfter: the capital is written after the first stroke, before the exit; ?draw follows the pen)
    return { W, H, strokes, letterAfter: 1, letter, medium: crisp ? 'ink' : 'quill', ink: { wet: B_OPTS.wet, rough: B_OPTS.rough, rim: B_OPTS.rim } };
  },
  // the paraph, three forms down the page (k: its number among the paragraphs): the copybook's oval, entered from below and
  // turned once on the slant out to a dot; the oval turned on into itself (a ring and a half, closing, out to a dot); the knot of
  // two loops rising across the slant, out to a dot
  paraph(fs, seed, d, form = 0) {
    const W = fs * 1.1, H = fs * .95, pk = fs * .2, how = PEN_HOW(), hair = penHair(d, pk), medium = B_OPTS.line === 'crisp' ? 'ink' : 'quill';
    if (form === 1) { const c = [W * .5, H * .5], o = [], T = TAU * 1.45;
      for (let t = 0; t <= T; t += .05) { const k = 1 - .3 * t / T; o.push(slantPt(c, H * .5 * k, H * .3 * k, -(PI * .2 + t))); }
      return { W, H, base: .9, strokes: [written(join(cubic([W * .02, H * .95], [W * .2, H * .9], o[0], o[0], 12), o), seed + 3, { hair, peak: pk * .7, how, end: 'ball', amp: .1 })], medium }; }
    if (form === 2) { const p = [], A = W * .5, ca = Math.cos(-.35), sa = Math.sin(-.35); for (let t = .5; t <= TAU + .35; t += .04) { const q = 1 + Math.sin(t) ** 2, x = A * Math.cos(t) / q, y = A * .9 * Math.sin(t) * Math.cos(t) / q; p.push([W * .5 + x * ca - y * sa, H * .5 + x * sa + y * ca]); }
      return { W, H, base: .9, strokes: [written(p, seed + 3, { hair, peak: pk * .8, how, start: 'point', end: 'ball', amp: .05 })], medium }; }
    const c = [W * .5, H * .5], o = [];
    for (let t = PI * .2; t <= PI * .2 + TAU * 1.02; t += .05) o.push(slantPt(c, H * .5, H * .26, -t));
    return { W, H, base: .9, strokes: [written(join(cubic([W * .02, H * .95], [W * .2, H * .9], o[0], o[0], 12), o), seed + 3, { hair, peak: pk, how, end: 'ball', amp: .1 })], medium };
  },
  // the filler, three forms down the page (by the line's own seed): a compound curve closing in a small oval on the slant;
  // the compound curve rising at its end into a curl and a dot; the compound curve with one oval turned in its run, out to a point
  filler(gw, lh, seed, d, form = 0) {
    const H = lh * .62, pk = lh * .16, R = Math.min(H * .5, gw * .2), how = PEN_HOW(), hair = penHair(d, pk), medium = B_OPTS.line === 'crisp' ? 'ink' : 'quill';
    if (form === 1) { const end = [gw - lh * .45, H * .4], p = join(beauty([1, H * .55], end, .03, 60), curl(end, -.5, lh * .16, -1, 1.2));
      return { W: gw, H, strokes: [written(p, seed + 4, { hair, peak: pk * .7, how, end: 'ball', amp: .15 })], medium }; }
    if (form === 2 && gw > R * 6) { const c = [gw * .62, H * .5], o = []; for (let t = PI * 1.25; t <= PI * 1.25 + TAU * .98; t += .05) o.push(slantPt(c, R, R * .5, -t));
      const p = join(beauty([1, H * .55], o[0], .03, 50), o, beauty(o.at(-1), [gw - 1, H * .45], .03, 40));
      return { W: gw, H, strokes: [written(p, seed + 4, { hair, peak: pk, how, amp: .15 })], medium }; }
    const c = [gw - R * .9, H * .5], o = [];
    for (let t = PI * 1.25; t <= PI * 1.25 + TAU * .95; t += .05) o.push(slantPt(c, R, R * .5, -t));
    const lead = gw > R * 4 ? beauty([1, H * .45], o[0], .03, 60) : [o[0]];
    return { W: gw, H, strokes: [written(join(lead, o), seed + 4, { hair, peak: pk, how, amp: .15 })], medium };
  },
  // one oval on the slant in the middle, a compound curve into it and out of it to a dot
  brk(bw, hb, seed, d) {
    const pk = hb * .13, a = hb * .46, b = hb * .27, p = [];
    for (let t = 0; t <= 1.08 * TAU; t += .03) p.push(slantPt([bw * .5, hb * .5], a, b, -t - PI * .5));
    const lead = beauty([bw * .04, hb * .55], p[0], -.06, 40), tail = beauty(p.at(-1), [bw * .96, hb * .45], .06, 40);
    return { W: bw, H: hb, strokes: [written(join(lead, p, tail), seed + 5, { hair: penHair(d, pk), peak: pk, how: PEN_HOW(), end: 'ball', amp: .2 })], medium: B_OPTS.line === 'crisp' ? 'ink' : 'quill' };
  },
  // a rule along the head into an oval at the corner
  corner(cs, seed, d) {
    const W = cs * 5.5, H = cs * 2.1, pk = cs * .17, c = [cs * .75, H * .45], o = [];
    for (let t = -PI * .1; t <= -PI * .1 + TAU * 1.05; t += .03) o.push(slantPt(c, cs * .78, cs * .4, t));
    const run = beauty([W - 1, H * .08], o[0], .015, 80);
    return { W, H, strokes: [written(join(run, o), seed + 7, { hair: penHair(d, pk), peak: pk, how: PEN_HOW(), end: 'ball', amp: .2 })], medium: B_OPTS.line === 'crisp' ? 'ink' : 'quill' };
  },
};

// ==== C · command of hand ===========================================================================================================
// The drop: the capital, and round it one movement: a long entry from below left, six or seven overlapping ovals walked
// round the letter clockwise (the hand turning each outward and on), the largest at the foot and the outer right where the
// arm swings freest, then the exit tail out to the right, closing in a curl and a ball (Bickham's ABC headpiece, 0414).
function dropPiece(ch, H, seed, d, o = {}) {
  const { rich = .5, vary = 0, letter: withLetter = true } = o, r = stream(seed, 'drop:' + ch), W = Math.round(H * 1.12), c = [W * .52, H * .5], pk = H * .024, hair = fineOf(H * .03, d);
  // six ovals round the letter, after Bickham's B (0414): each lying along the way round, the largest at the foot and outer
  // right where the arm swings freest; at the foot and the sides the hand turns a second, smaller oval inside the first
  // before it moves on (ovals within and through each other); the stations where the hand puts them (+-7 deg). One
  // movement: a short sweep in, the ovals one after another (their joins rounded), and a tail out under the letter into a
  // curl and a ball. Every oval swells on its down-sweeps (the engraver's two sides, the far one lighter).
  // (the page's budget and its seed: a lavish page seven ovals, nested all round the lower half; a page given its own seed
  // takes five, six or seven, and turns the ring to start where it chose)
  // (richness: plain five ovals, no nesting, no accents; modest six; usual six nested at the foot with accents (the approved
  // drop); fine nested round the lower half; lavish seven nested round the lower half, a third thorn. A seeded page chooses its ring:
  // five to seven ovals, where it begins, the nesting (at the foot, none, all round), the side the hand comes in from)
  const pv = vary ? stream(vary, 'hand:page') : null, nL = rich >= 1 ? 7 : rich < .25 ? 5 : pv ? 5 + (pv() * 3 | 0) : 6, rot = pv ? (pv() - .5) * 40 : 0, nestMode = pv ? pv() * 3 | 0 : 0, mirror = pv ? pv() < .5 : false;
  const stations = Array.from({ length: nL }, (_, i) => 168 + rot + i * 360 / nL).map(a => deg(a + (r() - .5) * 14));
  const size = a => (1 + .2 * Math.max(0, Math.sin(a)) + .1 * Math.max(0, Math.cos(a)) - .1 * Math.max(0, -Math.sin(a))) * (.95 + .1 * r());
  const ro = rosettePlan(c, stations, { A: H * .21 * 6 / Math.max(6, nL), B: H * .16, rho: H * .3, size, lean: -.2, nest: a => rich < .5 ? 0 : (nestMode === 1 && rich < .75) ? 0 : Math.sin(a) > (nestMode === 2 ? -1.1 : rich >= .75 ? -.1 : .4) ? .58 : 0 });
  // (mirror: the hand comes in from the right and leaves under the letter to the left)
  const mx = q => mirror ? [2 * c[0] - q[0], q[1]] : q;
  const entry = [[c[0] - H * .5, c[1] + H * .12], [c[0] - H * .38, c[1] + H * .05]].map(mx), tail = [[c[0] + H * .1, c[1] + H * .56], [c[0] + H * .42, c[1] + H * .54], [c[0] + H * .58, c[1] + H * .38]].map(mx);
  const lobes = ro.lobes.map(([i0, i1], k) => ({ path: smooth(ro.pts.slice(i0, i1 + 1).concat(k < ro.lobes.length - 1 ? [ro.pts[ro.lobes[k + 1][0]]] : []), H * .03) }));
  const plan = [{ go: ro.pts[0], look: H * .25 }, ...lobes, { go: tail[0], look: H * .2 }, { go: tail[1], look: H * .2 }, { go: tail[2], look: H * .15 }, { curl: H * .075, sense: mirror ? 1 : -1, turns: 1.25 }];
  let mv = move(entry[0], mirror ? -PI * .9 : -PI * .1, [{ go: entry[1], look: H * .2 }, ...plan], { lag: H * .03 });
  mv = fit(mv, [1, 1, W - 1, H - 1], { at: c, pad: H * .01 }); const k = mv.k ?? 1, at = q => [c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k];
  const strokes = [written(mv, seed + 1, { hair, peak: pk, how: LACE, start: 'point', end: 'ball' })];
  // the accents in the gaps: dot-curls between the letter and the ring, thorns beside the letter
  const g = r() * .4;
  if (rich >= .5) for (const [a, h, sn] of [[deg(255) + g, -PI * .1, 1], [deg(20) + g, PI * .5, 1], [deg(140) + g, PI * 1.1, -1]]) strokes.push(dotCurl(at([c[0] + H * .36 * Math.cos(a), c[1] + H * .34 * Math.sin(a)]), h, H * .04 * k, sn, seed + 9, { hair: Math.max(hair, .45 / d), how: LACE }));
  if (rich >= .5) strokes.push(thorn(at([c[0] - H * .33, c[1] - H * .2]), -PI * .12, H * .14 * k, 1, seed + 11, { hair, peak: H * .026 }), thorn(at([c[0] + H * .3, c[1] + H * .28]), PI * .92, H * .12 * k, 1, seed + 12, { hair, peak: H * .022 }));
  if (rich >= 1) strokes.push(thorn(at([c[0] + H * .34, c[1] - H * .26]), PI * .15, H * .11 * k, -1, seed + 13, { hair, peak: H * .022 }));
  // the capital: Bickham's rosettes hold a heavy text letter that anchors the ovals; UnifrakturMaguntia, at its own weight
  return { W, H, strokes, letter: withLetter ? { ch, face: '"CopperC"', cap: H * .5, cx: c[0] + H * .01, cy: c[1], thin: .42, fine: true } : null, medium: 'engrave', flat: true };
}
// The paraph: the filler's motif in small, rising: a hairline in from below left, two loops riding it (the second the
// larger), a curl and a ball
function paraphPiece(fs, seed, d, form = 0) {
  // (forms: 0 two loops riding a rising hairline; 1 the trefoil knot, three loops and three crossings, out to a dot; 2 one loop
  // turned on a hairline and a long curl closing on a dot)
  if (form === 1) { const s = fs * 1.3, pk = fs * .085, c = [s * .5, s * .5], k = [];
    for (let t = .25; t <= TAU - .05; t += .01) k.push([c[0] + s * .15 * (Math.sin(t) + 2 * Math.sin(2 * t)), c[1] + s * .15 * (Math.cos(t) - 2 * Math.cos(2 * t)) + s * .05]);
    return { W: s, H: s, base: .85, strokes: [written(k, seed + 3, { hair: fineOf(pk, d), peak: pk, how: BURIN, start: 'point', end: 'ball', amp: .03 })], medium: 'engrave', flat: true }; }
  if (form === 2) { const W = fs * 1.4, H = fs * .95, pk = fs * .13, mv = move([0, H * .8], -.4, [{ go: [W * .35, H * .45], look: fs * .3 }, { loop: fs * .2, sense: -1, aspect: 1.6, lean: -.4, turn: TAU }, { go: [W * .8, H * .55], look: fs * .3 }, { curl: fs * .15, sense: -1, turns: 1.3 }], { lag: fs * .04 });
    return { W, H, base: .92, strokes: [written(fit(mv, [1, 1, W - 1, H - 1], { grow: true }), seed + 3, { hair: fineOf(pk, d), peak: pk, how: BURIN, start: 'point', end: 'ball', amp: .04 })], medium: 'engrave', flat: true }; }
  const W = fs * 1.35, H = fs * .95, pk = fs * .13, a = [W * .22, H * .62], b = [W * .78, H * .42];
  const plan = [{ go: a, look: fs * .3 }, ...chain(a, b, 2, fs * .5, { sense: -1, first: .75, peak: .9, last: 1, aspect: 1.8 }), { go: [W * .95, H * .55], look: fs * .25 }, { curl: fs * .09, sense: -1, turns: 1.1 }];
  const mv = move([0, H * .85], -PI * .2, plan, { lag: fs * .05 });
  return { W, H, base: .92, strokes: [written(fit(mv, [1, 1, W - 1, H - 1], { grow: true }), seed + 3, { hair: fineOf(pk, d), peak: pk, how: BURIN, start: 'point', end: 'ball', amp: .04 })], medium: 'engrave', flat: true };
}
// The filler: one gesture. A fine sweep out along the line, and near its end a short chain of loops (one to three, by the
// room), the spindle's largest second, closing in a curl and a ball. The rest of the room is left quiet.
// (forms: 0 a fine run, loops riding its end; 1 the dove's wing: the loops ride a shaded sweep of their own beneath them (two
// strokes, the sweep first); 2 one loop and a long tightening curl out to a dot)
function fillerPiece(gw, lh, seed, d, o = {}) {
  if (o.form === 1 && gw > lh * 4) { const H = lh * .8, pk = lh * .1, n = Math.max(2, Math.min(4, Math.floor(gw / (lh * 2.6)))), size = lh * .7, span = Math.min(gw * .6, n * size * .9), a = [gw - span - lh * .4, H * .55], b = [gw - lh * .4, H * .45];
    const sweep = beauty([Math.max(1, gw - span - lh * (o.light ? 3 : 5)), H * .66], [gw - lh * .1, H * .4], .04, 90), sw = resample(sweep, .5); let L = 0; const Sx = [0]; for (let i = 1; i < sw.length; i++) Sx.push(L += Math.hypot(sw[i][0] - sw[i - 1][0], sw[i][1] - sw[i - 1][1]));
    const hair = fineOf(pk, d), w = Float32Array.from(Sx, u => hair + (pk * (o.light ? .14 : .2) - hair) * lensShape(u / L, .6)), S1 = stroke(sw, w, { start: 'point', end: 'point', hair }); S1.t = pace(sw);
    const plan = [{ go: a, look: lh }, ...chain(a, b, n, size, { sense: -1, first: .7, last: .6 }), { go: [gw - lh * .1, H * .5], look: lh * .4 }, { curl: lh * .1, sense: -1, turns: 1.1 }];
    const mv = move([a[0] - lh * .8, H * .5], -.05, plan, { lag: lh * .1 });
    return { W: gw, H, strokes: [S1, written(mv, seed + 4, { hair, peak: pk, how: BURIN, start: 'point', end: 'ball', amp: .06 })], medium: 'engrave', flat: true }; }
  if (o.form === 2 && gw > lh * 3) { const H = lh * .8, pk = lh * .1, mv = move([lh * .1, H * .6], -.02, [{ go: [gw - lh * 2.2, H * .62], look: lh * 2 }, { loop: lh * .3, sense: -1, aspect: 1.8, lean: 0, turn: TAU }, { go: [gw - lh * .9, H * .5], look: lh * .5 }, { curl: lh * .26, sense: -1, turns: 1.35 }], { lag: lh * .1 });
    return { W: gw, H, strokes: [written(fit(mv, [1, 1, gw - 1, H - 1]), seed + 4, { hair: fineOf(pk, d), peak: pk, how: BURIN, start: 'point', end: 'ball', amp: .08 })], medium: 'engrave', flat: true }; }
  const H = lh * .8, pk = lh * .1, n = o.n ?? Math.max(1, Math.min(3, Math.floor(gw / (lh * 3)))), size = lh * .7, span = Math.min(gw * .55, n * size * .95);
  const a = [gw - span - lh * .5, H * .62], b = [gw - lh * .5, H * .5];
  const plan = [{ go: a, look: lh * 2 }, ...chain(a, b, n, size, { sense: -1, first: .7, last: .62 }), { go: [gw - lh * .12, H * .62], look: lh * .5 }, { curl: lh * .14, sense: -1, turns: 1.2 }];
  const mv = move([lh * .1, H * .66], -.02, plan, { lag: lh * .12 });
  return { W: gw, H, strokes: [written(fit(mv, [1, 1, gw - 1, H - 1]), seed + 4, { hair: fineOf(pk, d), peak: pk, how: BURIN, start: 'point', end: 'ball', amp: .08 })], medium: 'engrave', flat: true };
}
// The break: one gesture across the measure: an entry sweep from a curl at the left, a cluster of loops a little right of
// the middle (the largest second), the exit sweep out to a curl at the right; the two sweeps shaded on their long runs
// (forms: 0 the band: an entry from a curl, a cluster of loops, the exit to a curl; 1 the wing: the cluster riding a shaded sweep
// across the measure; 2 the twin: two short clusters facing about a dot-curl)
function breakPiece(bw, hb, seed, d, o = {}) {
  if (o.form === 1) { const f = fillerPiece(bw * .9, hb * 1.2, seed, d, { form: 1, light: true }); return { ...f, W: bw, strokes: f.strokes.map(S => ({ ...S, p: S.p.map(([x, y]) => [x + bw * .05, y]), balls: (S.balls ?? []).map(([c, r]) => [[c[0] + bw * .05, c[1]], r]) })) }; }
  if (o.form === 2) { const half = fillerPiece(bw * .44, hb * 1.1, seed, d, { n: 2 }), mid = dotCurl([bw * .5, hb * .55], -PI * .5, hb * .14, 1, seed + 9, { hair: fineOf(hb * .085, d), how: LACE });
    const L = half.strokes.map(S => ({ ...S, p: S.p.map(([x, y]) => [bw * .5 - hb * .25 - x, y]), balls: (S.balls ?? []).map(([c, r]) => [[bw * .5 - hb * .25 - c[0], c[1]], r]) }));
    const R = half.strokes.map(S => ({ ...S, p: S.p.map(([x, y]) => [bw * .5 + hb * .25 + x, y]), balls: (S.balls ?? []).map(([c, r]) => [[bw * .5 + hb * .25 + c[0], c[1]], r]) }));
    return { W: bw, H: Math.max(hb, half.H), strokes: [...L, mid, ...R], medium: 'engrave', flat: true }; }
  const pk = hb * .085, n = o.n ?? 4, size = hb * .62, sp = o.span ?? .26, a = [bw * (.53 - sp / 2), hb * .55], b = [bw * (.53 + sp / 2), hb * .45];
  const plan = [{ go: [bw * .2, hb * .62], look: hb }, { go: a, look: hb * .8 }, ...chain(a, b, n, size, { sense: -1, first: .62, last: .55, peak: .4 }), { go: [bw * .8, hb * .58], look: hb * .7 }, { go: [bw * .93, hb * .45], look: hb * .5 }, { curl: hb * .12, sense: -1, turns: 1.25 }];
  // (the movement starts in the left curl's eye and runs out of it into the entry sweep: the curl written backwards)
  const lead = move([bw * .1, hb * .62], PI * 1.05, [{ curl: hb * .12, sense: 1, turns: 1.2 }], { lag: hb * .05 });
  const joined = { p: lead.p.slice().reverse(), part: lead.part.map(() => -1) };
  const rest = move(joined.p.at(-1), 0, plan, { lag: hb * .07 }); joined.p = joined.p.concat(rest.p.slice(1)); joined.part = joined.part.concat(rest.part.slice(1));
  return { W: bw, H: hb, strokes: [written(joined, seed + 5, { hair: fineOf(pk, d), peak: pk, how: BURIN, start: 'ball', end: 'ball' })], medium: 'engrave', flat: true };
}
// The quotation's head: one gesture from the far end of the head, in along it, a single knot at the corner, then down
// the margin into a curl and a ball
function cornerPiece(cs, seed, d) {
  const W = cs * 6, H = cs * 2.4, pk = cs * .12;
  const plan = [{ go: [cs * 1.9, H * .13], look: cs * 2 }, { loop: cs * .42, sense: -1, oval: .3, lean: PI * .2, turn: TAU * .95 }, { go: [cs * .3, H * .62], look: cs * .9 }, { go: [cs * .55, H * .9], look: cs * .5 }, { curl: cs * .2, sense: -1, turns: 1.2 }];
  const mv = move([W - 2, H * .1], PI + .02, plan, { lag: cs * .2 });
  return { W, H, strokes: [written(fit(mv, [1, 1, W - 1, H - 1]), seed + 7, { hair: fineOf(pk, d), peak: pk, how: BURIN, start: 'point', end: 'ball', amp: .08 })], medium: 'engrave', flat: true };
}

const hand = { initial: dropPiece, paraph: paraphPiece, filler: fillerPiece, brk: breakPiece, corner: cornerPiece };
export const DIRS = {
  pen: { name: 'B · The writing master’s pen', ...pen },
  hand: { name: 'C · Command of hand', ...hand },
};
// inks: light, and a designed dark (not an inversion)
export const PAL = {
  pen: { light: [46, 32, 24], dark: [226, 214, 192], pool: { light: [22, 14, 10], dark: [248, 240, 224] } },   // iron gall, black-brown (deeper where it pooled); dark: white ink on a dark card
  hand: { light: [30, 25, 24], dark: [222, 210, 186] },     // intaglio black; dark: an ivory ink
};

// ==== the whole page's pieces (stage 7: Copperplate in rubricate) ===================================================================
// Each in its direction's own grammar: B's single connected pen gestures, C's lace of loops with shaded down-sweeps. Sizes
// by the text's x-height u (fs ~ 2.45 u). Every piece: { W, H, strokes, letter?, medium, flat? } in its own px.
// a piece turned half round (a frame's far corner from its near one): its strokes, curls and balls carried with it
export function turned(P) {
  const T = ([x, y]) => [P.W - x, P.H - y];
  return { ...P, strokes: P.strokes.map(S => ({ ...S, p: S.p.map(T), balls: (S.balls ?? []).map(([c, r]) => [T(c), r]) })) };
}
// ---- B · the pen ----
// a capital in the line: Imperial's, the pen running in to it as a short hairline from below left along the letter's own
// nearest stroke
export function penLine(ch, Hl, seed, d) {
  const cap = Hl * .82, lead = Hl * .42, W = Math.round(lead + cap * 1.1), H = Hl, cx = lead + cap * .55, cy = H * .5, pk = Hl * .07, hair = penHair(d, pk);
  const letter = { ch, face: '"CopperB"', cap, cx, cy, thin: .4 }, ends = letterEnds(ch, letter.face, cap, cx, cy, W, H);
  const into = ends.slice().sort((a, b) => (a.pt[0] + (H - a.pt[1]) * .6) - (b.pt[0] + (H - b.pt[1]) * .6))[0], strokes = [];
  if (into) { const s0 = [1, H * .94], k = Math.hypot(into.pt[0] - s0[0], into.pt[1] - s0[1]) * .45;
    strokes.push(written(cubic(s0, [s0[0] + k, s0[1] - k * .15], [into.pt[0] - into.inward[0] * k, into.pt[1] - into.inward[1] * k], [into.pt[0] + into.inward[0] * Hl * .02, into.pt[1] + into.inward[1] * Hl * .02], 40), seed, { hair, peak: pk * .4, how: PEN_HOW(), start: 'point', end: 'point', amp: .05 })); }
  return { W, H, strokes, letterAfter: 1, letter, medium: B_OPTS.line === 'crisp' ? 'ink' : 'quill' };
}
// a heading's run-out: one long compound curve, a hairline, lifting at its end into a dot
export function penRule(gw, lh, seed, d) {
  const H = lh * .5, pk = lh * .1;
  return { W: gw, H, strokes: [written(beauty([1, H * .55], [gw - lh * .25, H * .45], .012, Math.max(30, gw / 3 | 0)), seed, { hair: penHair(d, pk), peak: pk, how: PEN_HOW(), start: 'point', end: 'ball', amp: .1 })], medium: 'ink' };
}
// the breaks by rank: a part's (one oval between compound curves), a chapter's (two ovals linked, the copybook's running
// oval, written on without lifting), the book's end (the great oval at the measure's middle, entered from far left and left
// to the far right, turned a second time inside itself)
export function penBreak(bw, hb, rank, seed, d, rich = .5) {
  if (rank === 0) return pen.brk(bw, hb, seed, d);
  // (the book's end at lavish: the oval turned on into a third ring)
  const pk = hb * (rank === 2 ? .12 : .13), n = rank === 2 ? (rich >= 1 ? 2.6 : 1.75) : 2.08, a = hb * (rank === 2 ? .5 : .44), b = hb * (rank === 2 ? .3 : .26), x0 = bw * (rank === 2 ? .5 : .44), x1 = bw * (rank === 2 ? .5 : .56), p = [];
  for (let t = 0; t <= n * TAU; t += .03) { const u = t / (n * TAU), sc = rank === 2 ? 1 - (n > 2 ? .45 : .32) * u : 1; p.push(slantPt([x0 + (x1 - x0) * u, hb * .5], a * sc, b * sc, -t - PI * .5)); }
  const lead = beauty([bw * .03, hb * .58], p[0], -.07, 50), tail = beauty(p.at(-1), [bw * .97, hb * .42], .07, 50);
  return { W: bw, H: hb, strokes: [written(join(lead, p, tail), seed, { hair: penHair(d, pk), peak: pk, how: PEN_HOW(), start: 'point', end: 'ball', amp: .2 })], medium: 'ink' };
}
// an aside's bracket: one stroke, a curl at its head turning down the margin in a long compound curve, out at its foot into a
// curl and a ball
// the aside's margin: not a bracket but a hairline let fall down the margin from a dot, turned once through a small oval on the
// slant a third of the way down (the only shade), and run on to a point at the foot
// the aside's margin: not a bracket but a hairline let fall down the margin from a dot, turned once through an oval on the slant
// at its middle (the only shade; the long fall stays a hairline, the pen lifted to its lightest), run on to a point at the foot
export function penBracket(H, u, seed, d, light = false) {
  const W = u * 3.2, pk = u * (light ? .3 : .38), hair = penHair(d, pk), c = [W * .5, H * .45], o = [];
  for (let t = PI * .5; t <= PI * .5 + TAU * 1.02; t += .05) o.push(slantPt(c, u * (light ? 1.5 : 2), u * (light ? .7 : .9), -t));
  const lead = beauty([W * .56, u * .4], o[0], .03, Math.max(30, H / 8 | 0)), fall = beauty(o.at(-1), [W * .44, H - u * .4], -.03, Math.max(30, H / 8 | 0)), how = PEN_HOW(), thin = { hair, peak: hair * 2, how, amp: .05 };
  return { W, H, strokes: [written(lead, seed + 2, { ...thin, start: 'ball', end: 'point' }), written(o, seed, { hair, peak: pk, how, start: 'point', end: 'point', amp: .1 }), written(fall, seed + 1, { ...thin, start: 'point', end: 'point' })], medium: 'ink' };
}
// ---- C · command of hand ----
// a capital in the line: the cut Fraktur alone, the text's own weight beside it
export function handLine(ch, Hl) { const cap = Hl * .82, W = Math.round(cap * 1.05), H = Hl; return { W, H, strokes: [], letter: { ch, face: '"CopperC"', cap, cx: W / 2, cy: H * .5, thin: .42, fine: true }, medium: 'engrave', flat: true }; }
// a heading's run-out: a fine run and one loop riding its end, a curl and a ball
export function handRule(gw, lh, seed, d) { return fillerPiece(gw, lh * .75, seed, d, { n: 1 }); }
// the breaks: a part's (the band of loops), a chapter's (a longer band, more loops, its middle swelling), the end (a small
// rosette of ovals with its accents, no letter, at the measure's middle)
export function handBreak(bw, hb, rank, seed, d, rich = .5, form = 0, vary = 0) {
  if (rank === 0) return breakPiece(bw, hb, seed, d, { form });
  if (rank === 1) return breakPiece(bw, hb * 1.1, seed, d, { n: 6, span: .38, form });
  const R = dropPiece('B', hb, seed, d, { rich: Math.max(.5, rich), letter: false, vary: vary ? vary * 7 + 3 : 0 }); return R;
}
// an aside's margin: a chain of loops riding down a fine sweep, a curl at its head and a ball at its foot
export function handChain(H, u, seed, d, n = 0) {
  const W = u * 3.4, pk = u * .35, N = n || Math.max(2, Math.min(6, Math.round(H / (u * 7)))), a = [W * .5, u * 2.2], b = [W * .45, H - u * 2.2];
  const plan = [{ go: a, look: u * 2 }, ...chain(a, b, N, u * 2.6, { sense: 1, first: .6, last: .55, aspect: 2 }), { go: [W * .6, H - u * .9], look: u * 1.5 }, { curl: u * .5, sense: 1, turns: 1.15 }];
  const mv = move([W * .55, 0], PI / 2, plan, { lag: u * .3 });
  return { W, H, strokes: [written(fit(mv, [1, 1, W - 1, H - 1]), seed, { hair: fineOf(pk, d), peak: pk, how: LACE, start: 'point', end: 'ball', amp: .08 })], medium: 'engrave', flat: true };
}
// a small mark (a contents entry's): a dot-curl
export function handDot(s, seed, d) { const st = dotCurl([s * .2, s * .7], -PI * .25, s * .28, 1, seed, { hair: Math.max(fineOf(s * .1, d), .55 / d / 2), how: LACE }); return { W: s, H: s, strokes: [st], medium: 'engrave', flat: true }; }
export const PIECES = { pen, hand: { initial: dropPiece, paraph: paraphPiece, filler: fillerPiece, brk: breakPiece, corner: cornerPiece } };
