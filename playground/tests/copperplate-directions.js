// Copperplate, direction studies, stage 3 (research/23-copperplate.md). B (the writing master's pen) and C (command of hand),
// kept apart: B is one great shaded oval round the capital and the copybook's single gestures, written with the ink
// engine's pen in iron-gall ink; C is Bickham's rosette (ovals within and through each other, dot-curls and thorns, a heavy
// text capital) and its loop chains, cut as engraved strokes. They share the plumbing: the movement
// (kit/styles/copperplate-hand.js) and the flexible pen's weight (copperplate-print.js press(), fitted to Bickham's oval).
// Every piece: { W, H, strokes, letter?, medium, base? } in its own px; d = device px a css px (the engraved hairline never
// drawn under the engine's floor, 1.2 device px).
//   each stroke: { p, w, balls, t } — t: the hand's time at each point (ms), for ?draw
import { SLANT, burin, press, stroke, cubic, beauty, curl, join, lensShape, coverage, glyph, glyphStrokes } from '../kit/styles/copperplate-print.js';
import { move, chain, fit, rosettePlan, smooth } from '../kit/styles/copperplate-hand.js';
import { stream, resample } from '../kit/marks.js';

const PI = Math.PI, TAU = 2 * PI;
// the shade axes. The pen: pulled down the slant toward the writer, and only that way (a pointed pen cannot shade an
// up-stroke). The engraver of the command of hand: down the plate, both sides of an oval, the far one ~.7 as hard (0040).
const PEN = { axis: [-Math.cos(SLANT), Math.sin(SLANT)], reverse: 0 }, BURIN = { axis: [0, 1], reverse: .7 }, LACE = { axis: [0, 1], reverse: 0, falloff: 55, tight: .07 };
const hairOf = (peak, d) => Math.max(peak / 10, 1.2 / d) / 2;
// C's hairline (stage 4): laid flat, not through the engine, so it can be finer than a device px: the master's tenth of a
// shade, never under .55 of a device px (a fine grey thread at that, as an engraved hairline seen small)
const fineOf = (peak, d) => Math.max(peak / 10, .55 / d) / 2;
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
const penHair = (d, pk = 0) => B_OPTS.line === 'crisp' ? Math.max(pk / 12, .6 / (d || 2)) / 2 : Math.max(.3, .55 / (d || 2));
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
  initial(ch, H, seed, d) {
    const W = Math.round(H * 1.06), pk = H * .085, hair = penHair(d, pk), c = [W * .52, H * .5], o = [], g = B_OPTS.geo, r = stream(seed, 'pen-oval:' + ch);
    // (the hand's oval: turning in by ~10 % over the turn, its slant drifting ~3 deg, its middle carried on by the arm, a
    // little fuller on the side it pulls down; all from the turn's own progress u, none of it noise)
    const t0 = PI * 1.12, ph = r() * TAU, tilt0 = (r() - .5) * deg(3);   // (begun at the oval's foot, moving right, so the hairline runs straight in)
    for (let t = t0; t <= t0 + TAU * 1.04; t += .02) { const u = (t - t0) / TAU, sc = 1 - g * .1 * u, eg = 1 + g * .05 * Math.sin(t + ph), tl = g * (tilt0 + deg(3) * u);
      const q = slantPt([c[0] + g * H * .03 * u, c[1] - g * H * .015 * u], H * .58 * sc * eg, H * .34 * sc, -t), ct = Math.cos(tl), st = Math.sin(tl);
      o.push([c[0] + (q[0] - c[0]) * ct - (q[1] - c[1]) * st, c[1] + (q[0] - c[0]) * st + (q[1] - c[1]) * ct]); }
    const how = PEN_HOW(), letter = { ch, face: '"CopperB"', cap: H * .66, cx: W * .55, cy: H * .48, pen: B_OPTS.letter === 'pen', thin: B_OPTS.line === 'crisp' ? .4 : .3 };
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
  // the copybook's oval: entered from below, once round on the slant, the pen opening down its left side, out to a dot
  paraph(fs, seed, d) {
    const W = fs * 1.1, H = fs * .95, pk = fs * .2, c = [W * .5, H * .5], o = [];
    for (let t = PI * .2; t <= PI * .2 + TAU * 1.02; t += .05) o.push(slantPt(c, H * .5, H * .26, -t));
    return { W, H, base: .9, strokes: [written(join(cubic([W * .02, H * .95], [W * .2, H * .9], o[0], o[0], 12), o), seed + 3, { hair: penHair(d, pk), peak: pk, how: PEN_HOW(), end: 'ball', amp: .1 })], medium: B_OPTS.line === 'crisp' ? 'ink' : 'quill' };
  },
  // a compound curve out to the measure, closing in a small oval on the slant
  filler(gw, lh, seed, d) {
    const H = lh * .62, pk = lh * .16, R = Math.min(H * .5, gw * .2), c = [gw - R * .9, H * .5], o = [];
    for (let t = PI * 1.25; t <= PI * 1.25 + TAU * .95; t += .05) o.push(slantPt(c, R, R * .5, -t));
    const lead = gw > R * 4 ? beauty([1, H * .45], o[0], .03, 60) : [o[0]];
    return { W: gw, H, strokes: [written(join(lead, o), seed + 4, { hair: penHair(d, pk), peak: pk, how: PEN_HOW(), amp: .15 })], medium: B_OPTS.line === 'crisp' ? 'ink' : 'quill' };
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
function dropPiece(ch, H, seed, d) {
  const r = stream(seed, 'drop:' + ch), W = Math.round(H * 1.12), c = [W * .52, H * .5], pk = H * .024, hair = fineOf(H * .03, d);
  // six ovals round the letter, after Bickham's B (0414): each lying along the way round, the largest at the foot and outer
  // right where the arm swings freest; at the foot and the sides the hand turns a second, smaller oval inside the first
  // before it moves on (ovals within and through each other); the stations where the hand puts them (+-7 deg). One
  // movement: a short sweep in, the ovals one after another (their joins rounded), and a tail out under the letter into a
  // curl and a ball. Every oval swells on its down-sweeps (the engraver's two sides, the far one lighter).
  const stations = [168, 228, 288, 348, 48, 108].map(a => deg(a + (r() - .5) * 14));
  const size = a => (1 + .2 * Math.max(0, Math.sin(a)) + .1 * Math.max(0, Math.cos(a)) - .1 * Math.max(0, -Math.sin(a))) * (.95 + .1 * r());
  const ro = rosettePlan(c, stations, { A: H * .21, B: H * .16, rho: H * .3, size, lean: -.2, nest: a => Math.sin(a) > .4 ? .58 : 0 });
  const entry = [[c[0] - H * .5, c[1] + H * .12], [c[0] - H * .38, c[1] + H * .05]], tail = [[c[0] + H * .1, c[1] + H * .56], [c[0] + H * .42, c[1] + H * .54], [c[0] + H * .58, c[1] + H * .38]];
  const lobes = ro.lobes.map(([i0, i1], k) => ({ path: smooth(ro.pts.slice(i0, i1 + 1).concat(k < ro.lobes.length - 1 ? [ro.pts[ro.lobes[k + 1][0]]] : []), H * .03) }));
  const plan = [{ go: ro.pts[0], look: H * .25 }, ...lobes, { go: tail[0], look: H * .2 }, { go: tail[1], look: H * .2 }, { go: tail[2], look: H * .15 }, { curl: H * .075, sense: -1, turns: 1.25 }];
  let mv = move(entry[0], -PI * .1, [{ go: entry[1], look: H * .2 }, ...plan], { lag: H * .03 });
  mv = fit(mv, [1, 1, W - 1, H - 1], { at: c, pad: H * .01 }); const k = mv.k ?? 1, at = q => [c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k];
  const strokes = [written(mv, seed + 1, { hair, peak: pk, how: LACE, start: 'point', end: 'ball' })];
  // the accents in the gaps: dot-curls between the letter and the ring, thorns beside the letter
  const g = r() * .4;
  for (const [a, h, sn] of [[deg(255) + g, -PI * .1, 1], [deg(20) + g, PI * .5, 1], [deg(140) + g, PI * 1.1, -1]]) strokes.push(dotCurl(at([c[0] + H * .36 * Math.cos(a), c[1] + H * .34 * Math.sin(a)]), h, H * .04 * k, sn, seed + 9, { hair: Math.max(hair, .45 / d), how: LACE }));
  strokes.push(thorn(at([c[0] - H * .33, c[1] - H * .2]), -PI * .12, H * .14 * k, 1, seed + 11, { hair, peak: H * .026 }), thorn(at([c[0] + H * .3, c[1] + H * .28]), PI * .92, H * .12 * k, 1, seed + 12, { hair, peak: H * .022 }));
  // the capital: Bickham's rosettes hold a heavy text letter that anchors the ovals; UnifrakturMaguntia, at its own weight
  return { W, H, strokes, letter: { ch, face: '"CopperC"', cap: H * .5, cx: c[0] + H * .01, cy: c[1], thin: .42, fine: true }, medium: 'engrave', flat: true };
}
// The paraph: the filler's motif in small, rising: a hairline in from below left, two loops riding it (the second the
// larger), a curl and a ball
function paraphPiece(fs, seed, d) {
  const W = fs * 1.35, H = fs * .95, pk = fs * .13, a = [W * .22, H * .62], b = [W * .78, H * .42];
  const plan = [{ go: a, look: fs * .3 }, ...chain(a, b, 2, fs * .5, { sense: -1, first: .75, peak: .9, last: 1, aspect: 1.8 }), { go: [W * .95, H * .55], look: fs * .25 }, { curl: fs * .09, sense: -1, turns: 1.1 }];
  const mv = move([0, H * .85], -PI * .2, plan, { lag: fs * .05 });
  return { W, H, base: .92, strokes: [written(fit(mv, [1, 1, W - 1, H - 1], { grow: true }), seed + 3, { hair: fineOf(pk, d), peak: pk, how: BURIN, start: 'point', end: 'ball', amp: .04 })], medium: 'engrave', flat: true };
}
// The filler: one gesture. A fine sweep out along the line, and near its end a short chain of loops (one to three, by the
// room), the spindle's largest second, closing in a curl and a ball. The rest of the room is left quiet.
function fillerPiece(gw, lh, seed, d) {
  const H = lh * .8, pk = lh * .1, n = Math.max(1, Math.min(3, Math.floor(gw / (lh * 3)))), size = lh * .7, span = Math.min(gw * .55, n * size * .95);
  const a = [gw - span - lh * .5, H * .62], b = [gw - lh * .5, H * .5];
  const plan = [{ go: a, look: lh * 2 }, ...chain(a, b, n, size, { sense: -1, first: .7, last: .62 }), { go: [gw - lh * .12, H * .62], look: lh * .5 }, { curl: lh * .14, sense: -1, turns: 1.2 }];
  const mv = move([lh * .1, H * .66], -.02, plan, { lag: lh * .12 });
  return { W: gw, H, strokes: [written(fit(mv, [1, 1, gw - 1, H - 1]), seed + 4, { hair: fineOf(pk, d), peak: pk, how: BURIN, start: 'point', end: 'ball', amp: .08 })], medium: 'engrave', flat: true };
}
// The break: one gesture across the measure: an entry sweep from a curl at the left, a cluster of loops a little right of
// the middle (the largest second), the exit sweep out to a curl at the right; the two sweeps shaded on their long runs
function breakPiece(bw, hb, seed, d) {
  const pk = hb * .085, n = 4, size = hb * .62, a = [bw * .4, hb * .55], b = [bw * .66, hb * .45];
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
