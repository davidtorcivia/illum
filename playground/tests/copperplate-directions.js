// Copperplate, direction studies, stage 2 (research/23-copperplate.md). The user's pick: B (the writing master's pen) and
// C (command of hand); A (the plate) is dropped. Both share one flourish generator, a movement with momentum
// (kit/styles/copperplate-hand.js): B writes it with the ink engine's pen in iron-gall ink, C cuts it as engraved, shaded
// strokes. Every piece: { W, H, strokes, letter?, medium, base? } in its own px; d = device px a css px (the engraved
// hairline never drawn under the engine's floor, 1.2 device px).
//   each stroke: { p, w, balls, t } — t: the hand's time at each point (ms), for ?draw
import { SLANT, burin, shade, lens, stroke } from '../kit/styles/copperplate-print.js';
import { move, chain, fit, rosettePlan, smooth } from '../kit/styles/copperplate-hand.js';
import { stream } from '../kit/marks.js';

const PI = Math.PI, TAU = 2 * PI;
const DOWN = [-Math.cos(SLANT), Math.sin(SLANT)];   // the shade: where the hand pulls down the slant
const hairOf = (peak, d) => Math.max(peak / 10, 1.2 / d) / 2;
const deg = a => a * PI / 180;

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
// one flourish: the movement, cut or written; its shade on the down-sweeps, lenses laid by hand on named parts
function flourish(mv, seed, { hair, peak, start = 'point', end = 'ball', tol = 36, aspect = 14, amp = .12, extra = [], shadeOn = null }) {
  const p = burin(mv.p, seed, amp, 70, .5), n = p.length, m = mv.p.length, part = Array.from({ length: n }, (_, i) => mv.part[Math.min(m - 1, Math.round(i * (m - 1) / Math.max(1, n - 1)))]);
  const w = shade(p, { hair, peak: peak / 2, axis: DOWN, tol, aspect, margin: .04 });
  if (shadeOn) for (let i = 0; i < n; i++) if (!shadeOn(part[i])) w[i] = hair;   // (only the loops' down-sweeps press, not the travel between)
  for (const [idx, u0, u1, pk, at] of extra) { const ix = part.map((q, i) => q === idx ? i : -1).filter(i => i >= 0); if (!ix.length) continue;
    const a = ix[0], b = ix.at(-1), L = b - a; for (let i = a; i <= b; i++) { const u = ((i - a) / L - u0) / (u1 - u0); if (u > 0 && u < 1) w[i] = Math.max(w[i], hair + (pk / 2 - hair) * Math.sin(PI * (u < at ? .5 * u / at : .5 + .5 * (u - at) / (1 - at))) ** .7); } }
  const S = stroke(p, w, { start, end, hair, ball: 1.9 }); S.t = pace(p); return S;
}

// ---- the pieces (the same movements for both directions) ------------------------------------------------------------------
// The drop: the capital, and round it one movement: a long entry from below left, six or seven overlapping ovals walked
// round the letter clockwise (the hand turning each outward and on), the largest at the foot and the outer right where the
// arm swings freest, then the exit tail out to the right, closing in a curl and a ball (Bickham's ABC headpiece, 0414).
function dropPiece(ch, H, seed, d, face, medium) {
  const r = stream(seed, 'drop:' + ch), W = Math.round(H * 1.12), c = [W * .52, H * .5];
  // five overlapping ovals round the letter, after Bickham's B (0414; his has six, five keep the letter legible at a
  // drop's size): each about .55 of the rosette long and .3 wide, its middle .32 out, lying along the way round and tipped toward the slant; the largest at the foot and outer right where
  // the arm swings freest, the smallest at the head; the stations where the hand puts them (+-7 deg). One movement: a sweep
  // in from below left, the ovals one after another (the pen following the plan with its momentum, rounding every join),
  // and a tail out under the letter to the right, closing in a curl and a ball.
  const stations = [168, 228, 288, 348, 48, 108].map(a => deg(a + (r() - .5) * 14));
  const size = a => (1 + .2 * Math.max(0, Math.sin(a)) + .1 * Math.max(0, Math.cos(a)) - .1 * Math.max(0, -Math.sin(a))) * (.95 + .1 * r());
  const ro = rosettePlan(c, stations, { A: H * .2, B: H * .155, rho: H * .3, size, lean: -.2 });
  const entry = [[c[0] - H * .5, c[1] + H * .12], [c[0] - H * .38, c[1] + H * .05]], tail = [[c[0] + H * .1, c[1] + H * .56], [c[0] + H * .42, c[1] + H * .54], [c[0] + H * .58, c[1] + H * .38]];
  // (one follow a lobe, so the shade can be given to the lower ovals' down-sweeps only, where the arm pulls toward the writer)
  // (the ovals' joins rounded as the hand rounds them; a lobe at a time, so each keeps its own part for the shade)
  const lobes = ro.lobes.map(([i0, i1], k) => ({ path: smooth(ro.pts.slice(i0, i1 + 1).concat(k < ro.lobes.length - 1 ? [ro.pts[ro.lobes[k + 1][0]]] : []), H * .03) })), first = 2;
  const plan = [{ go: ro.pts[0], look: H * .25 }, ...lobes, { go: tail[0], look: H * .2 }, { go: tail[1], look: H * .2 }, { go: tail[2], look: H * .15 }, { curl: H * .075, sense: -1, turns: 1.25 }];
  let mv = move(entry[0], -PI * .1, [{ go: entry[1], look: H * .2 }, ...plan], { lag: H * .03 });
  const lower = new Set(ro.lobes.map(([, , a], k) => Math.sin(a) > .5 ? first + k : -1)), t0 = first + lobes.length;
  mv = fit(mv, [1, 1, W - 1, H - 1], { at: c, pad: H * .01 });
  const pk = H * .045;
  return { W, H, strokes: [flourish(mv, seed + 1, { hair: medium === 'quill' ? .3 : hairOf(pk, d), peak: pk, start: 'point', end: 'ball', shadeOn: q => lower.has(q), extra: [[t0 + 1, .1, .9, pk * .7, .45]] })],
    letter: { ch, face, cap: H * .56, cx: c[0] + H * .02, cy: c[1] }, medium };
}
// The paraph: the filler's motif in small, rising: a hairline in from below left, two loops riding it (the second the
// larger), a curl and a ball
function paraphPiece(fs, seed, d, medium) {
  const W = fs * 1.35, H = fs * .95, pk = fs * .13, a = [W * .22, H * .62], b = [W * .78, H * .42];
  const plan = [{ go: a, look: fs * .3 }, ...chain(a, b, 2, fs * .5, { sense: -1, first: .75, peak: .9, last: 1, oval: .35 }), { go: [W * .95, H * .55], look: fs * .25 }, { curl: fs * .09, sense: -1, turns: 1.1 }];
  const mv = move([0, H * .85], -PI * .2, plan, { lag: fs * .05 });
  return { W, H, base: .92, strokes: [flourish(fit(mv, [1, 1, W - 1, H - 1], { grow: true }), seed + 3, { hair: medium === 'quill' ? .3 : hairOf(pk, d), peak: pk, start: 'point', end: 'ball', amp: .04, shadeOn: q => plan[q]?.loop })], medium };
}
// The filler: one gesture. A fine sweep out along the line, and near its end a short chain of loops (one to three, by the
// room), the spindle's largest second, closing in a curl and a ball. The rest of the room is left quiet.
function fillerPiece(gw, lh, seed, d, medium) {
  const H = lh * .8, pk = lh * .1, n = Math.max(1, Math.min(3, Math.floor(gw / (lh * 3)))), size = lh * .7, span = Math.min(gw * .55, n * size * .95);
  const a = [gw - span - lh * .5, H * .62], b = [gw - lh * .5, H * .5];
  const plan = [{ go: a, look: lh * 2 }, ...chain(a, b, n, size, { sense: -1, first: .7, last: .62, oval: .4 }), { go: [gw - lh * .12, H * .62], look: lh * .5 }, { curl: lh * .14, sense: -1, turns: 1.2 }];
  const mv = move([lh * .1, H * .66], -.02, plan, { lag: lh * .12 });
  const loops = new Set(plan.map((m, i) => m.loop ? i : -1).filter(i => i >= 0));
  return { W: gw, H, strokes: [flourish(fit(mv, [1, 1, gw - 1, H - 1]), seed + 4, { hair: medium === 'quill' ? .3 : hairOf(pk, d), peak: pk, start: 'point', end: 'ball', amp: .08, shadeOn: q => loops.has(q), extra: [[0, .55, 1, pk * .8, .7]] })], medium };
}
// The break: one gesture across the measure: an entry sweep from a curl at the left, a cluster of loops a little right of
// the middle (the largest second), the exit sweep out to a curl at the right; the two sweeps shaded on their long runs
function breakPiece(bw, hb, seed, d, medium) {
  const pk = hb * .085, n = 4, size = hb * .62, a = [bw * .4, hb * .55], b = [bw * .66, hb * .45];
  const plan = [{ go: [bw * .2, hb * .62], look: hb }, { go: a, look: hb * .8 }, ...chain(a, b, n, size, { sense: -1, first: .62, last: .55, peak: .4, oval: .38 }), { go: [bw * .8, hb * .6], look: hb }, { go: [bw * .93, hb * .45], look: hb * .5 }, { curl: hb * .12, sense: -1, turns: 1.25 }];
  // (the movement starts in the left curl's eye and runs out of it into the entry sweep: the curl written backwards)
  const lead = move([bw * .1, hb * .62], PI * 1.05, [{ curl: hb * .12, sense: 1, turns: 1.2 }], { lag: hb * .05 });
  const joined = { p: lead.p.slice().reverse(), part: lead.part.map(() => -1) };
  const rest = move(joined.p.at(-1), 0, plan, { lag: hb * .15 }); joined.p = joined.p.concat(rest.p.slice(1)); joined.part = joined.part.concat(rest.part.slice(1));
  return { W: bw, H: hb, strokes: [flourish(joined, seed + 5, { hair: medium === 'quill' ? .3 : hairOf(pk, d), peak: pk, start: 'ball', end: 'ball', shadeOn: q => plan[q]?.loop, extra: [[1, .15, .9, pk * .75, .55], [plan.length - 3, .1, .9, pk * .7, .5]] })], medium };
}
// The quotation's head: one gesture from the far end of the head, in along it, a single knot at the corner, then down
// the margin into a curl and a ball
function cornerPiece(cs, seed, d, medium) {
  const W = cs * 6, H = cs * 2.4, pk = cs * .12;
  const plan = [{ go: [cs * 1.9, H * .13], look: cs * 2 }, { loop: cs * .42, sense: -1, oval: .3, lean: PI * .2, turn: TAU * .95 }, { go: [cs * .3, H * .62], look: cs * .9 }, { go: [cs * .55, H * .9], look: cs * .5 }, { curl: cs * .2, sense: -1, turns: 1.2 }];
  const mv = move([W - 2, H * .1], PI + .02, plan, { lag: cs * .2 });
  return { W, H, strokes: [flourish(fit(mv, [1, 1, W - 1, H - 1]), seed + 7, { hair: medium === 'quill' ? .3 : hairOf(pk, d), peak: pk, start: 'point', end: 'ball', amp: .08, shadeOn: q => q === 1 || q === 2, extra: [[0, .5, .95, pk * .6, .6]] })], medium };
}

const make = (name, face, medium) => ({
  name, face, medium,
  initial(ch, H, seed, d = 2) { return dropPiece(ch, H, seed, d, this.face, this.medium); },
  paraph(fs, seed, d = 2) { return paraphPiece(fs, seed, d, this.medium); },
  filler(gw, lh, seed, d = 2) { return fillerPiece(gw, lh, seed, d, this.medium); },
  brk(bw, hb, seed, d = 2) { return breakPiece(bw, hb, seed, d, this.medium); },
  corner(cs, seed, d = 2) { return cornerPiece(cs, seed, d, this.medium); },
});
export const DIRS = {
  pen: make('B · The writing master’s pen', '"CopperB"', 'quill'),
  hand: make('C · Command of hand', '"CopperA"', 'engrave'),
};
// inks: light, and a designed dark (not an inversion)
export const PAL = {
  pen: { light: [64, 41, 28], dark: [228, 216, 194] },      // iron gall; dark: white ink on a dark card
  hand: { light: [30, 25, 24], dark: [222, 210, 186] },     // intaglio black; dark: an ivory ink
};
