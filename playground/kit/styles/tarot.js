// Tarot: the Tarot de Marseille as the cartiers of Paris, Lyon and Marseille made it (Noblet c. 1650, Dodal c. 1701,
// Conver 1760; research/12-tarot.md). A card is a print and a painting laid one over the other: an even black line cut
// in a woodblock and printed first, then the colours laid over it through stencils by a brush, flat, a little off the
// line. So every element here is two things:
//   marks: the woodcut line, written by the ink engine's pen (kit/writer.js) with a near-square nib (hair ≈ the width), so
//     the line is even in every direction as a knife leaves it, swelling and thinning slowly, its ends blunt or tapered
//     to a point where a petal or a leaf curls out. The print's solids (a baton's flared cap, a pommel) are fills of 'k',
//     printed in register (never slipped).
//   fills: the stencils, one colour each (keys of palette: r red, y yellow, b deep blue, p pale blue, f flesh, g green),
//     as shapes in page px. The page lays them with stencil(): each colour's shapes cut as one mask, grown a little so
//     they run under the line, slipped as a whole a little off the print in one direction (the register: under the
//     line on one side, past it on the other; never a paper gap all round), mottled along the brush, and poured into the
//     ink medium (kit/inkletter.js inkLetter) before the line is written over them.
//   letters: lettering and numerals, glyphs of IM FELL French Canon (the Fell types, 1670s–80s, digitised by Igino Marini,
//     OFL), laid or written by the ink engine (inkLetter / letterWriter) as the drop initial is.
//
// The style object follows tests/blackletter.html's signatures, each returning { marks, fills, letters? }:
//   paraph(x, base, u, seed, rich, k?)   a suit pip (k: 0 cups, 1 batons, 2 swords, 3 coins; default from the seed)
//   filler(x0, x1, yTop, yBase, kind, seed, rich)   kind: 'baton' | 'sword' | 'vine' | 'rule' (a heading's)
//   breakMark(cx, y, measure, rank, seed, rich, u, n?)   rank 1: the numeral band (n: the chapter's number); rank 2: the
//     batons crossed in a saltire into the woven lozenge, over the title band (n: the book's number)
//   initial(o) -> { marks, fills, letters, width }   (o: ch, G: { box }, big, rich, seed, set: 'solid' | 'contour', u, n)
//   frames.{ quote, figure, code, pull, aside, nav }(args), palette.{ light, dark }
// Marks: { pts (page px), w (the nib, px), hair, col: 'k', press?, rho: 0 }. Nothing here touches the DOM except
// stencil(), glyph(), printOf() and loadFace(), which the page calls (printOf(element) -> { pours, letters, runs }: what
// the page lays with inkLetter / letterWriter and writes with the writer; tests/tarot.html shows how, still and ?draw).
import { noise2 } from '../marks.js';

const fnv = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rng = (seed, name) => mulberry(fnv(name + ':' + seed));
const TAU = 2 * Math.PI;
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const arclen = p => p.reduce((a, q, i) => i ? a + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0);
export function resample(p, ds = .6) {
  const out = [p[0]]; let carry = 0;
  for (let i = 1; i < p.length; i++) { const [x0, y0] = p[i - 1], [x1, y1] = p[i], l = Math.hypot(x1 - x0, y1 - y0); let t = ds - carry;
    while (t <= l) { out.push([x0 + (x1 - x0) * t / l, y0 + (y1 - y0) * t / l]); t += ds; } carry = l - (t - ds); }
  if (Math.hypot(out.at(-1)[0] - p.at(-1)[0], out.at(-1)[1] - p.at(-1)[1]) > 1e-3) out.push(p.at(-1)); return out;
}
// a cubic Bézier, n pieces
const bez = (p0, p1, p2, p3, n = 24) => Array.from({ length: n + 1 }, (_, k) => { const t = k / n, s = 1 - t; return [0, 1].map(c => s * s * s * p0[c] + 3 * s * s * t * p1[c] + 3 * s * t * t * p2[c] + t * t * t * p3[c]); });
// an ellipse from angle a0 round to a1 (radians, y down: positive turns clockwise on screen)
const arc = (c, rx, ry, a0, a1, n = 0) => { n ||= Math.max(8, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 1.5)); return Array.from({ length: n + 1 }, (_, k) => { const a = a0 + (a1 - a0) * k / n; return [c[0] + rx * Math.cos(a), c[1] + ry * Math.sin(a)]; }); };
const ring = (c, rx, ry = rx, a0 = -Math.PI / 2) => arc(c, rx, ry, a0, a0 + TAU * 1.03);   // closed, the cut runs a little past its start
const rot = (p, c, a) => { const s = Math.sin(a), k = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * k - y * s, c[1] + x * s + y * k]; };
const rotAll = (P, c, a) => P.map(p => rot(p, c, a));
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

// ---- the woodcut line -------------------------------------------------------------------------------------------------------
// Even (the nib near square, so no thick and thin by direction), swelling and thinning slowly as a cutter's knife
// wanders (±wob over ~8 px), tapering to a point over taper[0] / taper[1] px at its start / end where it is a petal's or
// a leaf's curl. rho 0: the hand's pressure flat, the ends blunt.
export const LW = u => Math.max(1.35, Math.min(2.3, u * .17));   // the card's line: ~0.3 % of a card's height, 1.3–1.6 px at life size
function cut(pts, W, o0 = {}) {
  W = Math.max(1.2, W);   // nothing finer than this: a line under a pixel only aliases
  const P0 = resample(pts, .6), L0 = arclen(P0);
  // a long cut is printed whole, but the pen that writes it would run dry: it is written in lengths a dip carries, broken
  // where the cut turns a corner (where a cutter's knife stops anyway) and otherwise only every ~480 px
  if (!o0.part && L0 > 120) { const cuts = [0];
    for (let i = 3; i < P0.length - 3; i++) { const a = unit([P0[i][0] - P0[i - 3][0], P0[i][1] - P0[i - 3][1]]), b = unit([P0[i + 3][0] - P0[i][0], P0[i + 3][1] - P0[i][1]]);
      if (a[0] * b[0] + a[1] * b[1] < .5 && i - cuts.at(-1) > 6) cuts.push(i); }
    cuts.push(P0.length - 1); const pieces = [];
    for (let k = 0; k + 1 < cuts.length; k++) { const seg = P0.slice(cuts[k], cuts[k + 1] + 1), n = Math.ceil(arclen(seg) / 480), per = Math.ceil((seg.length - 1) / n);
      for (let i = 0; i < n; i++) pieces.push(seg.slice(i * per, Math.min(seg.length, (i + 1) * per + 1))); }
    if (pieces.length > 1) return pieces.filter(q => q.length > 1).map((q, i, A) => cut(q, W, { ...o0, part: true, seed: (o0.seed ?? 0) + i * 31, taper: [i === 0 ? o0.taper?.[0] ?? 0 : 0, i === A.length - 1 ? o0.taper?.[1] ?? 0 : 0] })); }
  const { taper = [0, 0], wob = .1, seed = 0 } = o0, P = P0, L = L0, n = noise2(seed * 7 + 11 | 0), o = (seed * .37) % 50;
  const press = f => { const s = f * L; let k = 1 + wob * 2 * (n(s / 8 + o, o) - .5);
    if (taper[0]) k *= .3 + .7 * Math.min(1, s / taper[0]) ** .7; if (taper[1]) k *= .3 + .7 * Math.min(1, (L - s) / taper[1]) ** .7; return k; };
  return { pts: P, w: W, hair: W * .9, col: 'k', press, rho: 0 };
}
// ---- the stencils (fills) ---------------------------------------------------------------------------------------------------
// fill(col, polys, lines?): polys closed shapes (page px); lines [{ pts, w }] bands laid by the brush through a slot
const fill = (col, polys, lines = []) => ({ col, polys, lines });

// ---- the suits -----------------------------------------------------------------------------------------------------------
// coin (denier): concentric rings, the scalloped band between them, the four-petalled rose in the middle with a red heart
// (c043, c047); yellow. At a small size only the rings and the heart (what can be cut at that size).
function coin(c, R, W, seed = 0) {
  const marks = [cut(ring(c, R), W, { seed })], fills = [fill('y', [ring(c, R)])];
  if (R >= 7) marks.push(cut(ring(c, R * .6, R * .6, -Math.PI / 4), W * .85, { seed: seed + 1 }));
  if (R >= 13) {   // the scalloped band and the rose
    const sc = Array.from({ length: 241 }, (_, k) => { const a = -Math.PI / 2 + k / 240 * TAU * 1.02, r = R * (.8 + .065 * Math.cos(a * 11)); return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; });
    marks.push(cut(sc, W * .8, { seed: seed + 2 }));
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, tip = add(c, [Math.cos(a), Math.sin(a)], R * .42), sd = [-Math.sin(a), Math.cos(a)];
      marks.push(cut(bez(add(c, [Math.cos(a), Math.sin(a)], R * .1), add(add(c, [Math.cos(a), Math.sin(a)], R * .25), sd, R * .2), add(tip, sd, R * .12), tip, 12)
        .concat(bez(tip, add(tip, sd, -R * .12), add(add(c, [Math.cos(a), Math.sin(a)], R * .25), sd, -R * .2), add(c, [Math.cos(a), Math.sin(a)], R * .1), 12)), W * .75, { seed: seed + 3 + k })); }
    fills.push(fill('r', [ring(c, R * .12)]));
  } else fills.push(fill('r', [ring(c, R * (R >= 7 ? .26 : .3))]));
  return { marks, fills };
}
// cup (coupe): a footed cup seen from the side (c059, c065): the lip a wide ellipse, red inside; a deep round bowl,
// gadrooned (ribbed) where it is large enough to cut; a knop and a short stem; a faceted foot spreading to a broad base.
// Yellow. s: its height; c: the middle of its base
function cup(c, s, W, seed = 0) {
  const [x, b] = c, top = b - s, lr = s * .31, ly = top + s * .08, bowlB = top + s * .5, kn = top + s * .57, fr = s * .27, ft = b - s * .2;
  const mirror = P => P.slice().reverse().map(p => [2 * x - p[0], p[1]]);
  const bowl = bez([x - lr, ly], [x - lr * 1.12, top + s * .32], [x - s * .2, bowlB], [x - s * .045, bowlB], 16), bowlP = [...bowl, ...mirror(bowl)];
  // the stem with its knop, then the foot: a short bell, then the faceted skirt to the base
  const stem = [[x - s * .045, bowlB], [x - s * .07, kn - s * .02], [x - s * .07, kn + s * .03], [x - s * .04, kn + s * .05], [x - s * .05, ft - s * .04]];
  const skirt = [[x - fr * .5, ft], [x - fr, b]], foot = [...stem, ...skirt], footP = [...foot, ...mirror(foot)];
  const lip = ring([x, ly], lr, s * .085, Math.PI);
  const marks = [cut(lip, W * .9, { seed }), cut(bowlP, W, { seed: seed + 1 }), cut([...foot, [x, b], ...mirror(foot)], W, { seed: seed + 2 }),
    cut([[x - fr * .5, ft], [x + fr * .5, ft]], W * .8, { seed: seed + 3 })];
  if (s >= 22) { for (const f of [-.5, 0, .5]) marks.push(cut(bez([x + f * lr * .8, ly + s * .09], [x + f * lr * .95, top + s * .3], [x + f * s * .12, bowlB - s * .06], [x + f * s * .05, bowlB - s * .01], 8), W * .7, { seed: seed + 5 + f * 4, taper: [0, s * .06] }));
    for (const f of [-.35, .35]) marks.push(cut([[x + f * fr * .5 * 2 * .5, ft], [x + f * fr * 1.3, b]], W * .7, { seed: seed + 9 + f * 4 })); }
  return { marks, fills: [fill('y', [bowlP, footP]), fill('r', [ring([x, ly + s * .006], lr * .9, s * .065)])] };
}
// the bell: the flared end of a baton and the pommel of a sword pip, printed solid (c013, c087): from a neck, its sides
// curving out slowly then fast to a broad mouth hollowed in a shallow arc; a sword's swept to one side like a fish's tail
// (sweep: the mouth's tilt, in mouth-widths). On a large one the grain of the wood is cut through the black in two or
// three light streaks. at: the neck's middle; t: the way out; returns { marks, fills }
function bell(at, t, len, neck, mouth, W, seed = 0, { sweep = 0 } = {}) {
  const n = [-t[1], t[0]], P = (s, v) => add(add(at, t, s), n, v), hw = f => neck / 2 + (mouth - neck) / 2 * f ** 2.6, k = 16;
  const side = sd => Array.from({ length: k + 1 }, (_, i) => { const f = i / k; return P(len * f + sd * sweep * mouth * f ** 3, sd * hw(f)); });
  const mouthArc = Array.from({ length: 9 }, (_, i) => { const v = 1 - i / 4, f = 1 - Math.min(.07, mouth * .05 / len) * (1 - v * v); return P(len * f - v * sweep * mouth, v * mouth / 2); });
  const poly = [...side(1), ...mouthArc.slice(1, -1), ...side(-1).reverse()];
  const fills = [fill('k', [poly])];
  if (len > 9) fills[0].holes = [.3, -.15].map((v, i) => ({ pts: [P(len * .35, v * mouth * .6 * .4), P(len * .85, v * mouth * .9)], w: Math.max(.7, len * .035) }));
  return { marks: [cut([...poly, poly[0]], W * .8, { seed })], fills };
}
// sword (épée): a straight blade from the point to the cross-guard, its ridge cut down the middle, the guard's arms
// curling at their ends, the grip, the pommel (the ace's sword, c085). Laid from its grip c toward angle `ang` (0: the
// point up). L: point to pommel; b: the blade's half-breadth; g: the guard's half-span
function sword(c, L, W, seed = 0, ang = 0, { b = L * .07, g = L * .22 } = {}) {
  // from the point down: the blade to an oval guard, the grip, a bar across, the bell (the pip cards' hilt, c087)
  const [x, y] = c, gy = y - L * .12, tip = [x, y - L * .82], P = pts => ang ? rotAll(pts, c, ang) : pts, Pt = p => P([p])[0];
  const blade = [[x - b, gy], [x - b, tip[1] + b * 2.2], tip, [x + b, tip[1] + b * 2.2], [x + b, gy]];
  const ov = ring([x, gy + b * .2], g * .62, Math.max(b * .75, W * 1.2), Math.PI);
  const by = y + L * .05, bar = [[x - g * .5, by], [x + g * .5, by], [x + g * .5, by + b * .9], [x - g * .5, by + b * .9], [x - g * .5, by]];
  const grip = [[x - b * .7, gy + b * .9], [x - b * .7, by], [x + b * .7, by], [x + b * .7, gy + b * .9]];
  // (a small one cut as a woodcutter cuts small: the blade, the bar and the bell; the ridge and the oval guard left out)
  const small = L < 32, marks = [cut(P(blade), W, { seed }), cut(P(grip), W * .85, { seed: seed + 3 }), cut(P(bar), W * .85, { seed: seed + 5 })];
  if (!small) marks.push(cut(P([[x, gy - b * .6], [x, tip[1] + b * 3]]), W * .7, { seed: seed + 1, taper: [0, b * 2.5] }), cut(P(ov), W * .9, { seed: seed + 2 }));
  const dn = unit([Pt([x, y + 1])[0] - Pt([x, y])[0], Pt([x, y + 1])[1] - Pt([x, y])[1]]);
  const bl = bell(Pt([x, by + b * .9]), dn, g * 1.5, b * 1.1, g * 1.3, W, seed + 4, { sweep: .22 });
  return { marks: [...marks, ...bl.marks], fills: [...bl.fills, fill('p', [P(blade), P(grip)]), fill('y', small ? [P(bar)] : [P(ov), P(bar)])] };
}
// baton (bâton) from a to b: a turned staff, red, bound with a yellow collar near each end, its ends flared caps of solid
// black (c009, c013: the cap ~1.7 shafts long, flaring to ~2.4 shafts). w: the shaft's breadth. mid: a collar at its
// middle too (where two batons are bound)
function baton(a, b, w, W, seed = 0, { mid = false, end = true } = {}) {
  const t = unit([b[0] - a[0], b[1] - a[1]]), n = [-t[1], t[0]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), cap0 = Math.min(L * .22, w * 3), cap = end ? cap0 : 0, col = w * .62;
  const at = (s, v) => add(add(a, t, s), n, v);
  const s0 = cap0 + col, s1 = L - cap - col, marks = [], fills = [];
  for (const v of [-w / 2, w / 2]) marks.push(cut([at(s0, v), at(s1, v)], W, { seed: seed + (v > 0) }));
  const collar = s => [at(s, -w * .78), at(s + col, -w * .78), at(s + col, w * .78), at(s, w * .78), at(s, -w * .78)];
  const cols = [cap0, L - cap - col]; if (mid) cols.push(L / 2 - col / 2);
  for (const s of cols) { marks.push(cut(collar(s), W * .85, { seed: seed + 3 + s })); fills.push(fill('y', [collar(s)])); }
  // the caps: the bell, flaring from the collar to the staff's end
  for (const [s0c, dir] of end ? [[cap0, -1], [L - cap, 1]] : [[cap0, -1]]) { const bl = bell(at(s0c, 0), [t[0] * dir, t[1] * dir], cap0, w * .7, w * 2.3, W, seed + 5 + dir);
    marks.push(...bl.marks); fills.push(...bl.fills); }
  fills.unshift(fill('r', [[at(s0, -w / 2), at(s1, -w / 2), at(s1, w / 2), at(s0, w / 2)]]));
  return { marks, fills };
}
// the flower between the pips (c023): a red stem, two yellow leaves, a corolla of curling pale-blue petals round a red bud.
// base: where the stem starts; dir: the way it grows (radians, 0 = right); s: its length
function flower(base, dir, s, W, seed = 0, { leaves = true } = {}) {
  const r = rng(seed, 'flower'), d = [Math.cos(dir), Math.sin(dir)], n = [-d[1], d[0]], at = (u, v) => add(add(base, d, u * s), n, v * s);
  const marks = [], fills = [];
  const stem = [at(0, 0), at(.25, .02), at(.52, 0)];
  marks.push(cut(stem, W, { seed }));
  fills.push(fill('r', [], [{ pts: [at(.02, -.035), at(.5, -.035)], w: s * .06 }]));
  if (leaves) for (const sd of [-1, 1]) {   // a leaf from the stem's middle, out and forward, its tip curled
    const p0 = at(.2, 0), tip = at(.44, sd * .3), lf = [...bez(p0, at(.18, sd * .22), at(.3, sd * .32), tip, 14), ...bez(tip, at(.36, sd * .14), at(.34, sd * .05), at(.3, 0), 12)];
    marks.push(cut(lf, W * .9, { seed: seed + 2 + sd, taper: [0, 0] }), cut(bez(at(.24, sd * .04), at(.3, sd * .12), at(.36, sd * .2), at(.4, sd * .24), 8), W * .7, { seed: seed + 4 + sd, taper: [0, s * .06] }));
    fills.push(fill('y', [lf]));
  }
  // the corolla: a petal curling out to each side and a pair standing up, round the bud
  const cx = at(.6, 0), petals = [];
  for (const sd of [-1, 1]) {
    petals.push([...bez(at(.54, 0), at(.56, sd * .2), at(.72, sd * .26), at(.7, sd * .14), 12), ...arc(at(.68, sd * .155), s * .03, s * .03, sd > 0 ? 0 : Math.PI, sd > 0 ? Math.PI * 1.3 : -Math.PI * .3, 8)]);
    petals.push(bez(at(.58, sd * .04), at(.62, sd * .14), at(.74, sd * .16), at(.76, sd * .07), 10));
  }
  petals.forEach((p, k) => marks.push(cut(p, W * .85, { seed: seed + 8 + k, taper: [0, s * .05] })));
  fills.push(fill('p', [[at(.55, 0), at(.6, -.24), at(.74, -.2), at(.78, 0), at(.74, .2), at(.6, .24)]]));
  // the bud: a teardrop, its point out
  const bud = [...bez(at(.7, 0), at(.68, -.13), at(.86, -.12), at(1, 0), 14), ...bez(at(1, 0), at(.86, .12), at(.68, .13), at(.7, 0), 14)];
  marks.push(cut(bud, W * .9, { seed: seed + 20 })); fills.push(fill('r', [bud]));
  void cx; void r;
  return { marks, fills };
}
// the woven lozenge that binds the batons where they cross (c023, c025): strips of a basket weave, each bounded by two
// cut lines, passing over and under in turn, a lozenge outline round them, pale blue under the strips and a red point
// in every other hole. c: its centre; a, b: its half-width and half-height
function weave(c, a, b, W, seed = 0) {
  const marks = [], fills = [], k = Math.max(3, Math.min(5, Math.round(2 * b / Math.max(7, W * 5)) | 1)), sw = .7;   // strips; sw: a strip's share of its pitch
  const P = (u, v) => [c[0] + (u - v) * a, c[1] + (u + v - 1) * b];   // u, v in 0..1 along the lozenge's two edges
  const out = [P(0, 0), P(1, 0), P(1, 1), P(0, 1), P(0, 0)];
  marks.push(cut(out, W * 1.1, { seed }));
  fills.push(fill('p', [out]));
  const pitch = 1 / k, edges = i => [i * pitch + pitch * (1 - sw) / 2, i * pitch + pitch * (1 + sw) / 2];
  // strip i of one family over strip j of the other where (i + j) is even
  for (const fam of [0, 1]) for (let i = 0; i < k; i++) for (const e of edges(i)) {
    let run = [];
    const flush = () => { if (run.length > 1) marks.push(cut(run, W * .72, { seed: seed + i * 7 + fam })); run = []; };
    for (let j = 0; j < k; j++) { const [v0, v1] = edges(j), over = (i + j + fam) % 2 === 0;
      const pt = v => fam ? P(v, e) : P(e, v);
      // the gap before strip j (always seen), then across strip j if this strip is over it
      if (!run.length) run.push(pt(j ? edges(j - 1)[1] : 0));
      run.push(pt(v0)); if (over) run.push(pt(v1)); else { flush(); run.push(pt(v1)); } }
    run.push(fam ? P(1, e) : P(e, 1)); flush(); }
  // the strips' ends at the outline are closed by it; a red point in alternate holes
  for (let i = 0; i < k - 1; i++) for (let j = 0; j < k - 1; j++) if ((i + j) % 2 === 0) { const h = P((i + 1) * pitch, (j + 1) * pitch);
    fills.push(fill('r', [ring(h, pitch * a * (1 - sw) * .62, pitch * b * (1 - sw) * .62)])); }
  return { marks, fills };
}
const join = (...els) => ({ marks: els.flatMap(e => e.marks).flat(), fills: els.flatMap(e => e.fills), letters: els.flatMap(e => e.letters ?? []) });
const SUITS = ['cup', 'baton', 'sword', 'coin'];

// ---- lettering -------------------------------------------------------------------------------------------------------------
// Lettering is a glyph request the page turns into coverage with glyph(): { text, x, base (page px), size (cap height,
// px), align: 'center' | 'left', rot (radians, about the text's centre) }. Numerals are additive, as on the cards.
export const roman = n => { let s = ''; for (const [v, r] of [[1000, 'M'], [500, 'D'], [100, 'C'], [50, 'L'], [10, 'X'], [5, 'V'], [1, 'I']]) while (n >= v) { s += r; n -= v; } return s; };
export const FACE = { family: 'IM FELL French Canon', file: 'IMFellFrenchCanon.woff2', weight: 400 };
const fontDir = new URL('../../fonts/', import.meta.url);
export async function loadFace() {
  if (FACE.ready) return FACE; const ff = new FontFace(FACE.family, `url(${new URL(FACE.file, fontDir)})`); await ff.load(); document.fonts.add(ff); FACE.ready = true; return FACE;
}
// the face's cap height and a letter's ink box, per 100 px of font size
const metrics = {};
function metricOf(text) { if (metrics[text]) return metrics[text];
  // (outside a browser, as in the node check: an estimate in cap heights, I narrow, the rest about square)
  if (typeof OffscreenCanvas === 'undefined') { const w = [...text].reduce((a, c) => a + (c === 'I' ? .38 : c === ' ' ? .3 : .78), 0) * 66; return { l: 0, r: w, a: 66, d: 0, cap: 66, adv: w }; }
  const c = new OffscreenCanvas(8, 8).getContext('2d'); c.font = `${FACE.weight} 100px "${FACE.family}"`; const m = c.measureText(text), H = c.measureText('H');
  const r = { l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent, cap: H.actualBoundingBoxAscent, adv: m.width };
  if (FACE.ready) metrics[text] = r; return r; }
// coverage of a lettering request at res cells per px: { M, w, h, x0, y0, res }. outline: a contour of that width (px)
// along the glyph's edge instead of its body; grow: the body grown by that much (px), for a stencil under it
export function glyph({ text, x, base, size, align = 'center', rot = 0, outline = 0, grow = 0, shift = [0, 0] }, res = 2) {
  const m = metricOf(text), fs = size / m.cap * 100, k = fs / 100, w0 = (m.l + m.r) * k, left = align === 'center' ? x - w0 / 2 : x;
  const pad = 4 + outline + grow, cx = left + w0 / 2, cy = base - size / 2, R = Math.hypot(w0, size + m.d * k) / 2 + pad;
  const box = rot ? [cx - R, cy - R, cx + R, cy + R] : [left - pad, base - m.a * k - pad, left + w0 + pad, base + m.d * k + pad];
  const gx = Math.floor(box[0] + shift[0]), gy = Math.floor(box[1] + shift[1]), w = Math.ceil((box[2] - box[0] + 2) * res), h = Math.ceil((box[3] - box[1] + 2) * res);
  const c = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
  c.setTransform(res, 0, 0, res, -gx * res, -gy * res); c.translate(shift[0], shift[1]);
  if (rot) { c.translate(cx, cy); c.rotate(rot); c.translate(-cx, -cy); }
  c.font = `${FACE.weight} ${fs}px "${FACE.family}"`; c.lineJoin = 'round';
  if (outline) { c.lineWidth = outline; c.strokeStyle = '#000'; c.strokeText(text, left + m.l * k, base); }
  else { c.fillStyle = '#000'; c.fillText(text, left + m.l * k, base); if (grow) { c.lineWidth = grow * 2; c.strokeStyle = '#000'; c.strokeText(text, left + m.l * k, base); } }
  const d = c.getImageData(0, 0, w, h).data, M = new Float32Array(w * h); for (let i = 0; i < w * h; i++) M[i] = d[i * 4 + 3] / 255;
  return { M, w, h, x0: gx, y0: gy, res, ink: [left, base - size, left + w0, base] };
}
// the width a lettering request will take (px), before layout
export const textWidth = (text, size) => { const m = metricOf(text); return (m.l + m.r) * size / m.cap; };

// ---- the stencils laid -------------------------------------------------------------------------------------------------------
// The fills of one element as masks, one per colour (the page pours each with inkLetter, the colours before the line).
// Each colour's shapes are cut as one stencil, grown by `grow` px so they run under the line, and slipped as a whole by
// `slip` (px) in one direction, as a stencil laid by hand sits a little off the print: under the line on one side, past
// it on the other (c043: ~1–1.5 % of the card's width). Its edge is the stencil's cut edge, ragged a little; inside, the
// brush's dabs and drags (a mottle drawn out along the stroke). The ink engine pools a stroke's ink at its rim; a stencil
// colour has no rim, so that pooling is taken back out of the coverage before it is poured.
export const ORDER = ['f', 'p', 'g', 'b', 'y', 'r'];   // the order the stencils are laid (the red last: a coin's heart, a bud, over the yellow)
export function stencil(fills, { res = 2, seed = 1, slip = 1.2, grow: grow0 = .8, pad = 4 } = {}) {
  const r = rng(seed, 'slip'), out = [], byCol = {};
  for (const f of fills) (byCol[f.col] ??= []).push(f);
  for (const col of [...ORDER, 'k']) { const F = byCol[col]; if (!F) continue;
    const a = r() * TAU, k = col === 'k', sl = k ? [0, 0] : [Math.cos(a) * slip, Math.sin(a) * slip], grow = k ? .2 : grow0;
    let b = [Infinity, Infinity, -Infinity, -Infinity]; const grow2 = l => l.w / 2 + grow;
    for (const f of F) { for (const P of f.polys) for (const [x, y] of P) b = [Math.min(b[0], x - grow), Math.min(b[1], y - grow), Math.max(b[2], x + grow), Math.max(b[3], y + grow)];
      for (const l of f.lines) for (const [x, y] of l.pts) b = [Math.min(b[0], x - grow2(l)), Math.min(b[1], y - grow2(l)), Math.max(b[2], x + grow2(l)), Math.max(b[3], y + grow2(l))]; }
    if (!(b[2] > b[0])) continue;
    const x0 = Math.floor(b[0] + Math.min(0, sl[0]) - pad), y0 = Math.floor(b[1] + Math.min(0, sl[1]) - pad), w = Math.ceil((b[2] + Math.max(0, sl[0]) + pad - x0) * res), h = Math.ceil((b[3] + Math.max(0, sl[1]) + pad - y0) * res);
    const c = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
    c.setTransform(res, 0, 0, res, (sl[0] - x0) * res, (sl[1] - y0) * res); c.fillStyle = c.strokeStyle = '#000'; c.lineJoin = c.lineCap = 'round';
    for (const f of F) { for (const P of f.polys) { c.beginPath(); P.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); if (grow > 0) { c.lineWidth = grow * 2; c.stroke(); } }
      if (f.holes) { c.globalCompositeOperation = 'destination-out'; for (const l of f.holes) { c.beginPath(); l.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.lineWidth = l.w; c.stroke(); } c.globalCompositeOperation = 'source-over'; }
      for (const l of f.lines) { c.beginPath(); l.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.lineWidth = l.w + grow * 2; c.stroke(); } }
    const d = c.getImageData(0, 0, w, h).data, A = new Float32Array(w * h); for (let i = 0; i < w * h; i++) A[i] = d[i * 4 + 3] / 255;
    out.push({ col, ...(k ? { M: A, w, h, x0, y0, res } : texture(A, w, h, x0, y0, res, seed + ORDER.indexOf(col) * 101)) });
  }
  return out;
}
// the cut edge ragged, the brush's mottle inside, the engine's rim pooling compensated
function texture(A, w, h, x0, y0, res, seed, opacity = 1.25) {
  const B = boxBlur(A, w, h, Math.max(1, Math.round(.5 * res))), rag = noise2(seed ^ 0x2a), dab = noise2(seed ^ 0x51), drag = noise2(seed ^ 0x77);
  const M = new Float32Array(w * h), ang = (seed % 7) * .45, ca = Math.cos(ang), sa = Math.sin(ang);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, b = B[q]; if (b <= 0) continue;
    const x = x0 + i / res, y = y0 + j / res, e = b - .5 + .32 * (rag(x / 2.3, y / 2.3) - .5);
    M[q] = Math.max(0, Math.min(1, e * 3 + .5)); }
  const R = Math.round(1.6 * res), Bl = boxBlur(boxBlur(M, w, h, R), w, h, R);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i; if (M[q] <= 0) continue;
    const x = x0 + i / res, y = y0 + j / res, rim = Math.max(0, 1 - Bl[q]) * 1.6, along = x * ca + y * sa, across = -x * sa + y * ca;
    // the medium shows a full coat above ~.55 of coverage: the brush's mottle is kept below that, where it can be seen
    // Conver's lemon and vermilion: dragged on with a stiff brush, so streaked along the stroke, a few streaks almost dry
    const st = drag(along / 16, across / .8), dry = Math.max(0, st - .72) * 2.4;
    const mot = .52 + .12 * (dab(x / 2.6, y / 2.6) - .5) * 2 + .2 * (st - .5) * 2 + .06 * (dab(x / .9 + 50, y / .9) - .5) * 2 - dry * .45;
    M[q] *= Math.max(.25, mot) * opacity / (1 + .38 * rim * rim); }
  return { M, w, h, x0, y0, res };
}
function boxBlur(A, w, h, r) {
  if (r < 1) return A; const T = new Float32Array(w * h), O = new Float32Array(w * h), k = 2 * r + 1;
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += A[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) { T[y * w + x] = s / k; s += A[y * w + Math.min(w - 1, x + r + 1)] - A[y * w + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += T[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) { O[y * w + x] = s / k; s += T[Math.min(h - 1, y + r + 1) * w + x] - T[Math.max(0, y - r) * w + x]; } }
  return O;
}

// ---- an element made ready to lay ---------------------------------------------------------------------------------------------
// { marks, fills, letters } -> { pours (the stencils, then the print's solids: masks with col), letters (coverage, with
// red: the body under a contour, redCol its colour), runs (the line in runs of one nib, for the writer) }. slip: the
// register's slip (px); the stencils are grown so the far side still runs under the line.
export function printOf(el, { res = 2, seed = 1, slip = 1.2 } = {}) {
  const pours = stencil(el.fills, { res, seed, slip, grow: Math.max(.35, slip - .55) });
  const letters = (el.letters ?? []).map(t => { const L = glyph(t, res); L.wet = .06; L.dry = .3;
    if (t.body) { const B = glyph({ ...t, outline: 0, grow: t.outline * .2, shift: [Math.cos(seed) * slip * 1.2, Math.sin(seed) * slip * 1.2] }, res); L.red = regrid(B, L); L.redCol = t.body; }
    return L; });
  const runs = []; let run = null;
  const marks = el.marks.flat(3);
  for (const mk of marks) { if (!run || Math.abs(run.w - mk.w) > .01 || Math.abs(run.hair - mk.hair) > .01) runs.push(run = { w: mk.w, hair: mk.hair, strokes: [] });
    run.strokes.push({ pts: mk.pts, press: mk.press, rho: mk.rho, L: arclen(mk.pts) }); }
  const ys = [...marks.flatMap(m => m.pts.map(p => p[1])), ...pours.map(p => p.y0), ...letters.map(l => l.y0)];
  return { pours, letters, runs, y0: ys.length ? Math.min(...ys) : 0 };
}
// a mask moved onto another's grid (the same res)
function regrid(B, L) { const R = new Float32Array(L.w * L.h), dx = Math.round((B.x0 - L.x0) * L.res), dy = Math.round((B.y0 - L.y0) * L.res);
  for (let j = 0; j < B.h; j++) { const y = j + dy; if (y < 0 || y >= L.h) continue; for (let i = 0; i < B.w; i++) { const x = i + dx; if (x >= 0 && x < L.w) R[y * L.w + x] = B.M[j * B.w + i]; } }
  return R; }

// ---- the paraph: a suit pip ------------------------------------------------------------------------------------------------
// About two and a half x-heights high, in the gap the scribe left; the page gives each chapter its suit, in the cards'
// order: cups, batons, swords, coins (k), so a chapter's paragraphs are marked by the suit its entry in the contents bears
function paraph(x, base, u, seed, rich = .5, k = null) {
  const W = LW(u), cx = x + u * .85, cy = base - u * .62, suit = SUITS[k ?? (rng(seed, 'suit')() * 4 | 0)];
  if (suit === 'coin') return coin([cx, cy - u * .05], u * 1.16, W, seed);
  if (suit === 'cup') return cup([cx, base + u * .4], u * 2.45, W, seed);
  if (suit === 'sword') return sword([cx + u * .1, cy + u * .55], u * 2.7, W, seed, .5, { b: u * .2, g: u * .62 });
  return baton(rot([cx, base + u * .95], [cx, cy], .55), rot([cx, base - u * 2.2], [cx, cy], .55), u * .4, W, seed);
}

// ---- line-fillers ------------------------------------------------------------------------------------------------------------
// The things on the cards that are long: a baton laid along the line (bound at its middle when it is long); a sword, its
// point toward the words; the scrolling stem of the coin cards, its leaves to either side, ending in the flower.
const FILLERS = ['baton', 'sword', 'vine'];   // and 'rule' (a heading's): the band's rule, a small coin where it ends
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  const h = yBase - yTop, u = h, W = LW(u), mid = yBase - h * .48, L = x1 - x0;
  if (kind === 'sword') { const s = Math.min(L, h * 40);
    return sword([x1 - s * .18, mid], s, W, seed, -Math.PI / 2, { b: h * .24, g: h * .78 }); }
  if (kind === 'vine') {   // the coin cards' vine (c043, c047): a red stem, long leaves curling off it to either side in
    // turn, yellow and pale blue, and the flower at its end
    const fl = h * 3.2, run = L - fl, n = Math.max(1, Math.round(run / (h * 4.4))), p = run / n, marks = [], fills = [];
    const yAt = x => mid + Math.sin((x - x0) / p * Math.PI) * h * .14, stem = Array.from({ length: 161 }, (_, k) => { const x = x0 + k / 160 * run; return [x, yAt(x)]; });
    marks.push(cut(stem, W, { seed })); fills.push(fill('r', [], [{ pts: stem, w: h * .2 }]));
    for (let k = 0; k < n; k++) { const sd = k % 2 ? 1 : -1, bx = x0 + k * p + p * .12, by = yAt(bx), tip = [bx + p * .82, mid + sd * h * .78], ex = bx + p * .5;
      // a leaf from the stem, swelling out and running forward to a tip that turns back in a small curl
      const outer = bez([bx, by], [bx + p * .1, by + sd * h * .7], [bx + p * .5, mid + sd * h * .95], tip, 18);
      const inner = bez(tip, [bx + p * .62, mid + sd * h * .42], [ex, yAt(ex) + sd * h * .14], [ex, yAt(ex)], 16);
      const curl = arc([tip[0] - h * .16, tip[1] - sd * h * .04], h * .16, h * .16, sd > 0 ? Math.PI * .1 : -Math.PI * .1, sd > 0 ? -Math.PI * .9 : Math.PI * .9, 8);
      marks.push(cut([...outer, ...curl.slice(1)], W * .9, { seed: seed + k, taper: [0, h * .25] }), cut(inner, W * .8, { seed: seed + 20 + k }),
        cut(bez([bx + p * .12, by + sd * h * .16], [bx + p * .3, by + sd * h * .45], [bx + p * .5, mid + sd * h * .6], [bx + p * .66, mid + sd * h * .66], 10), W * .6, { seed: seed + 40 + k, taper: [h * .2, h * .3] }));
      fills.push(fill(k % 2 ? 'p' : 'y', [[...outer, ...inner]])); }
    return join({ marks, fills }, flower([x0 + run - W, mid], 0, fl, W * .9, seed + 99, { leaves: false })); }
  if (kind === 'rule') { const R = h * .62; return join({ marks: [cut([[x0, mid], [x1 - R * 2.1, mid]], W * 1.05, { seed })], fills: [] }, coin([x1 - R, mid], R, W, seed + 1)); }
  return baton([x0 + h * .05, mid], [x1 - h * .05, mid], h * .5, W, seed, { mid: L > h * 14 });
}

// ---- breaks ----------------------------------------------------------------------------------------------------------------
// A band: two cut rules across and a short one closing each end, as the numeral band at a card's head and the title band
// at its foot (c095, c089)
function band(x0, x1, y0, y1, W, seed = 0) {
  return [cut([[x0 - W * .4, y0], [x1 + W * .4, y0]], W, { seed }), cut([[x0 - W * .4, y1], [x1 + W * .4, y1]], W, { seed: seed + 1 }), cut([[x0, y0], [x0, y1]], W, { seed: seed + 2 }), cut([[x1, y0], [x1, y1]], W, { seed: seed + 3 })];
}
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8, n = 1) {
  const W = LW(u) * 1.15;
  if (rank < 2) {   // the numeral band with the chapter's number, the chapter's suit standing either side of it
    const txt = roman(n), size = u * 1.45, hb = u * 1.25, half = Math.max(textWidth(txt, size) / 2 + u * 1.6, u * 3.2), k = (n - 1) % 4, P = LW(u);
    const els = [{ marks: band(cx - half, cx + half, y - hb, y + hb, W, seed), fills: [], letters: [{ text: txt, x: cx, base: y + size / 2, size }] }];
    if (rich >= .25) for (const sd of [-1, 1]) { const px = cx + sd * (half + u * 2.2);
      els.push(SUITS[k] === 'coin' ? coin([px, y], u * 1.3, P, seed + sd) : SUITS[k] === 'cup' ? cup([px, y + u * 1.45], u * 2.9, P, seed + sd)
        : SUITS[k] === 'sword' ? sword([px, y + u * .7], u * 3.1, P, seed + sd, sd * .35, { b: u * .22, g: u * .7 }) : baton(rot([px, y + u * 1.5], [px, y], sd * .45), rot([px, y - u * 1.5], [px, y], sd * .45), u * .5, P, seed + sd)); }
    return join(...els);
  }
  // a book: two batons crossed in a flat saltire, bound where they cross by the woven lozenge, which lies over them: each
  // baton runs from its cap into the lozenge's edge, a yellow collar binding it there (c023, c025)
  const L = Math.min(measure * .66, u * 32), A = .21, a = L / 2 * Math.cos(A), b = L / 2 * Math.sin(A), w = u * .72, la = u * 4.2, lb = u * 2.7, els = [];
  for (const [sx, sy] of [[-1, -1], [1, 1], [-1, 1], [1, -1]]) { const e = [cx + sx * a, y + sy * b], d = unit([cx - e[0], y - e[1]]);
    // where the baton's axis meets the lozenge's edge (|dx|/la + |dy|/lb = 1), less a collar's breadth
    const k = 1 / (Math.abs(d[0]) / la + Math.abs(d[1]) / lb), Lk = Math.hypot(cx - e[0], y - e[1]) - k + w * .9;
    els.push(baton(e, add(e, d, Lk), w, LW(u), seed + sx * 3 + sy, { end: false })); }
  els.push(weave([cx, y], la, lb, LW(u), seed + 2));
  if (rich >= .25) { const txt = roman(n), size = u * 1.4, half = Math.max(textWidth(txt, size) / 2 + u * 1.6, u * 3), yb = y + b + u * 3.2;
    els.push({ marks: band(cx - half, cx + half, yb - u * 1.2, yb + u * 1.2, W, seed + 3), fills: [], letters: [{ text: txt, x: cx, base: yb + size / 2, size }] }); }
  return join(...els);
}

// ---- traced from the cards ------------------------------------------------------------------------------------------------
// Elements of the deck itself, traced from the BnF's Conver (1760) scans (research/12, tools: the session's trace.py:
// the line's skeleton walked into polylines, the stencils' hue classes into polygons; coordinates in units of the crop's
// height, a: its width over its height). plant: the tuft with its yellow bud at Le Bateleur's feet (I, c089); ground: the
// curved hatching of the ground there; tear: one of the drops falling round Le Soleil (XVIIII, c125).
const TRACE = {"plant":{"src":"c089.jpg [600,1770,780,1975] (its left half, mirrored: the yellow bud hides the right)","a":0.878,"lines":[{"w":0.0098,"f":[1,0],"p":[[0.273,0.546],[0.278,0.532],[0.263,0.522]]},{"w":0.0098,"f":[1,0],"p":[[0.647,0.546],[0.642,0.532],[0.657,0.522]]},{"w":0.0352,"f":[1,1],"p":[[0.283,0.859],[0.176,0.785]]},{"w":0.0352,"f":[1,1],"p":[[0.637,0.859],[0.744,0.785]]},{"w":0.0276,"f":[1,0],"p":[[0.22,0.317],[0.234,0.351],[0.278,0.405],[0.332,0.449]]},{"w":0.0276,"f":[1,0],"p":[[0.7,0.317],[0.686,0.351],[0.642,0.405],[0.588,0.449]]},{"w":0.0284,"f":[1,1],"p":[[0.259,0.742],[0.21,0.705],[0.156,0.683]]},{"w":0.0284,"f":[1,1],"p":[[0.661,0.742],[0.71,0.705],[0.764,0.683]]},{"w":0.0195,"f":[1,0],"p":[[0.381,0.137],[0.39,0.054]]},{"w":0.0195,"f":[1,0],"p":[[0.539,0.137],[0.53,0.054]]},{"w":0.0218,"f":[1,0],"p":[[0.288,0.229],[0.289,0.241],[0.318,0.298],[0.33,0.319],[0.342,0.327]]},{"w":0.0218,"f":[1,0],"p":[[0.632,0.229],[0.631,0.241],[0.602,0.298],[0.59,0.319],[0.578,0.327]]},{"w":0.0138,"f":[1,0],"p":[[0.342,0.112],[0.342,0.137],[0.337,0.141]]},{"w":0.0138,"f":[1,0],"p":[[0.578,0.112],[0.578,0.137],[0.583,0.141]]},{"w":0.0309,"f":[1,0],"p":[[0.449,0.098],[0.44,0.137],[0.422,0.18],[0.419,0.215]]},{"w":0.0309,"f":[1,0],"p":[[0.471,0.098],[0.48,0.137],[0.498,0.18],[0.501,0.215]]},{"w":0.0292,"f":[1,0],"p":[[0.19,0.454],[0.259,0.517]]},{"w":0.0292,"f":[1,0],"p":[[0.73,0.454],[0.661,0.517]]},{"w":0.0098,"f":[1,0],"p":[[0.405,0.019],[0.395,0.049]]},{"w":0.0098,"f":[1,0],"p":[[0.515,0.019],[0.525,0.049]]},{"w":0.0098,"f":[1,0],"p":[[0.381,0.019],[0.381,0.044],[0.385,0.049]]},{"w":0.0098,"f":[1,0],"p":[[0.539,0.019],[0.539,0.044],[0.535,0.049]]},{"w":0.0276,"f":[1,0],"p":[[0.332,0.722],[0.302,0.668]]},{"w":0.0276,"f":[1,0],"p":[[0.588,0.722],[0.618,0.668]]},{"w":0.0138,"f":[1,0],"p":[[0.317,0.61],[0.307,0.585],[0.312,0.576]]},{"w":0.0138,"f":[1,0],"p":[[0.603,0.61],[0.613,0.585],[0.608,0.576]]},{"w":0.0276,"f":[1,0],"p":[[0.293,0.756],[0.32,0.773],[0.36,0.815],[0.374,0.844],[0.376,0.873]]},{"w":0.0276,"f":[1,0],"p":[[0.627,0.756],[0.6,0.773],[0.56,0.815],[0.546,0.844],[0.544,0.873]]},{"w":0.0402,"f":[0,0],"p":[[0.337,0.449],[0.346,0.437],[0.351,0.415],[0.346,0.332]]},{"w":0.0402,"f":[0,0],"p":[[0.583,0.449],[0.574,0.437],[0.569,0.415],[0.574,0.332]]},{"w":0.0511,"f":[0,0],"p":[[0.337,0.454],[0.338,0.532],[0.329,0.554],[0.317,0.566]]},{"w":0.0511,"f":[0,0],"p":[[0.583,0.454],[0.582,0.532],[0.591,0.554],[0.603,0.566]]},{"w":0.0419,"f":[0,0],"p":[[0.381,0.224],[0.415,0.22]]},{"w":0.0419,"f":[0,0],"p":[[0.539,0.224],[0.505,0.22]]},{"w":0.0371,"f":[0,0],"p":[[0.376,0.224],[0.337,0.141]]},{"w":0.0371,"f":[0,0],"p":[[0.544,0.224],[0.583,0.141]]},{"w":0.0276,"f":[0,0],"p":[[0.444,0.288],[0.434,0.283],[0.431,0.249],[0.419,0.224]]},{"w":0.0276,"f":[0,0],"p":[[0.476,0.288],[0.486,0.283],[0.489,0.249],[0.501,0.224]]},{"w":0.0218,"f":[0,0],"p":[[0.351,0.327],[0.37,0.293],[0.376,0.229]]},{"w":0.0218,"f":[0,0],"p":[[0.569,0.327],[0.55,0.293],[0.544,0.229]]},{"w":0.0284,"f":[0,0],"p":[[0.229,0.605],[0.298,0.663]]},{"w":0.0284,"f":[0,0],"p":[[0.691,0.605],[0.622,0.663]]},{"w":0.0138,"f":[0,0],"p":[[0.195,0.585],[0.21,0.605],[0.224,0.605]]},{"w":0.0138,"f":[0,0],"p":[[0.725,0.585],[0.71,0.605],[0.696,0.605]]}],"fills":{"y":[[[0.517,0.963],[0.5,0.942],[0.505,0.932],[0.488,0.915],[0.463,0.929],[0.429,0.885],[0.402,0.868],[0.398,0.81],[0.358,0.771],[0.363,0.766],[0.344,0.722],[0.349,0.595],[0.373,0.566],[0.378,0.517],[0.388,0.502],[0.388,0.454],[0.398,0.444],[0.407,0.385],[0.429,0.358],[0.461,0.39],[0.476,0.439],[0.515,0.478],[0.519,0.512],[0.539,0.537],[0.539,0.571],[0.583,0.595],[0.588,0.624],[0.612,0.668],[0.612,0.727],[0.588,0.771],[0.583,0.82],[0.568,0.839],[0.583,0.883],[0.517,0.963]]]}},"ground":{"src":"c089.jpg [545,1890,840,2090]","a":1.475,"lines":[{"w":0.0253,"f":[1,1],"p":[[0.63,0.505],[0.55,0.523],[0.505,0.54]]},{"w":0.01,"f":[1,1],"p":[[0.31,0.99],[0.295,0.905]]},{"w":0.03,"f":[1,1],"p":[[0.085,0.33],[0.115,0.319],[0.175,0.319],[0.24,0.326],[0.31,0.347],[0.37,0.347],[0.42,0.364],[0.46,0.355]]},{"w":0.0283,"f":[1,0],"p":[[0.455,0.38],[0.5,0.372],[0.517,0.382],[0.535,0.405]]},{"w":0.0447,"f":[1,0],"p":[[0.56,0.865],[0.542,0.864],[0.521,0.853],[0.485,0.815],[0.36,0.71],[0.295,0.684],[0.245,0.656],[0.131,0.624],[0.12,0.615]]},{"w":0.04,"f":[1,0],"p":[[1.425,0.815],[1.419,0.801],[1.404,0.793],[1.37,0.793],[1.275,0.772],[1.23,0.775]]},{"w":0.02,"f":[1,1],"p":[[0.675,0.28],[0.651,0.24],[0.614,0.199],[0.594,0.184],[0.57,0.18]]},{"w":0.03,"f":[1,0],"p":[[0.96,0.8],[1.125,0.773],[1.2,0.771],[1.22,0.775]]},{"w":0.0338,"f":[1,1],"p":[[0.565,0.285],[0.5,0.22]]},{"w":0.0418,"f":[1,1],"p":[[0.015,0.605],[0.015,0.545],[0.02,0.52]]},{"w":0.0316,"f":[1,1],"p":[[0.755,0.995],[0.685,0.981],[0.575,0.895]]},{"w":0.04,"f":[1,0],"p":[[0.46,0.445],[0.526,0.415],[0.535,0.405]]},{"w":0.03,"f":[1,0],"p":[[0.105,0.51],[0.265,0.489],[0.31,0.473],[0.385,0.46]]},{"w":0.0316,"f":[1,0],"p":[[0.7,0.72],[0.76,0.703],[0.88,0.685]]},{"w":0.0308,"f":[1,1],"p":[[0.96,0.37],[0.92,0.356],[0.855,0.35]]},{"w":0.0224,"f":[1,1],"p":[[1.44,0.0],[1.45,0.013],[1.463,0.06],[1.46,0.13],[1.47,0.19]]},{"w":0.0224,"f":[1,0],"p":[[1.055,0.9],[1.085,0.891],[1.155,0.885],[1.25,0.89],[1.34,0.88],[1.4,0.885]]},{"w":0.04,"f":[0,0],"p":[[1.42,0.695],[1.335,0.687],[1.255,0.67],[1.13,0.666],[1.03,0.678],[0.925,0.676],[0.885,0.68]]},{"w":0.0412,"f":[0,0],"p":[[0.97,0.565],[1.025,0.557],[1.085,0.57],[1.185,0.558],[1.25,0.569],[1.285,0.565]]},{"w":0.0424,"f":[0,0],"p":[[1.425,0.59],[1.355,0.572],[1.285,0.565]]},{"w":0.04,"f":[0,0],"p":[[0.53,0.64],[0.77,0.581],[0.87,0.57]]}],"fills":{}},"tear":{"src":"c125.jpg [295,1090,415,1300]","a":0.5714,"lines":[],"fills":{"r":[[[0.181,0.893],[0.136,0.852],[0.126,0.829],[0.126,0.809],[0.141,0.786],[0.117,0.748],[0.117,0.7],[0.107,0.681],[0.117,0.633],[0.102,0.61],[0.117,0.595],[0.098,0.567],[0.112,0.533],[0.098,0.509],[0.107,0.5],[0.102,0.476],[0.112,0.452],[0.107,0.409],[0.117,0.343],[0.155,0.229],[0.231,0.124],[0.3,0.064],[0.367,0.064],[0.438,0.102],[0.474,0.157],[0.483,0.209],[0.479,0.29],[0.469,0.3],[0.46,0.357],[0.407,0.452],[0.398,0.514],[0.35,0.586],[0.321,0.662],[0.298,0.686],[0.302,0.695],[0.288,0.733],[0.217,0.814],[0.212,0.857],[0.181,0.893]]]}}};
// a traced element laid in box [x, y, h] (its top left, its height; mirror: flipped left to right about its own middle),
// its lines cut at width W (free ends tapered, as the knife left them), its stencils as fills; clip: a box no point leaves
function place(name, [bx, by, bh], W, { mirror = false, clip = null, col = null, seed = 0 } = {}) {
  const T = TRACE[name], X = ([x, y]) => [bx + (mirror ? T.a - x : x) * bh, by + y * bh], inside = p => !clip || (p[0] >= clip[0] && p[0] <= clip[2] && p[1] >= clip[1] && p[1] <= clip[3]);
  const marks = [], fills = [];
  T.lines.forEach((l, k) => { let run = [];
    const flush = () => { if (run.length > 1 && arclen(run) > W * 1.5) marks.push(cut(run, W, { seed: seed + k, wob: .14, taper: [l.f[0] ? W * 2.5 : 0, l.f[1] ? W * 2.5 : 0] })); run = []; };
    for (const p of l.p.map(X)) { if (inside(p)) run.push(p); else flush(); } flush(); });
  for (const [c, polys] of Object.entries(T.fills)) for (const P of polys) { const Q = P.map(X); fills.push(fill(col ?? c, [Q])); if (name === 'tear') marks.push(cut([...Q, Q[0]], W, { seed: seed + 50 })); }
  return { marks, fills };
}

// ---- the drop initial -----------------------------------------------------------------------------------------------------------
// A trump in miniature, as tall as the drop: the card's frame, the numeral band at its head with the book's number, the
// title band at its foot left empty as the thirteenth trump's is; in the field the capital of IM FELL standing on the
// card's ground among the deck's own things, traced from it: the hatched ground and the two tufts of Le Bateleur's feet,
// the falling drops of Le Soleil, red, yellow and pale blue. Symmetrical, as the cards are. ?set=: 'solid' (default):
// the letter printed black, as the cards letter their titles; 'contour': cut as an outline, its body stencilled red.
// G.box: [x0, capTop, x1, baseline] of the space the host floated; initial.width(ch) gives that width in cap heights.
const CARD = { ratio: .66, band: .125, letter: .42, ground: .16 };
// line: the initial in the line, 'contour' (default) or 'solid'; title: lettering for the foot band (empty by default)
function initial({ ch = 'B', G, big = true, rich = .5, seed = 1, set = 'solid', line = 'contour', title = '', u = 8, n = 1 }) {
  ch = String(ch).normalize('NFD')[0].toUpperCase(); const [x0, y0, x1, y1] = G.box, H = y1 - y0, W = Math.max(LW(u), H * .014), r = rng(seed, 'card');
  if (!/[A-Z]/.test(ch)) return { letter: ch, marks: [], fills: [], letters: [], width: x1 - x0 };
  if (!big) {   // in the line: the capital cut as a contour, its body stencilled red
    const m = textWidth(ch, H);
    return { marks: [], fills: [], letters: [line === 'solid' ? { text: ch, x: x0 + m / 2, base: y1, size: H } : { text: ch, x: x0 + m / 2, base: y1, size: H, outline: Math.max(1.3, H * .06), body: 'r' }], width: m };
  }
  const hb = H * CARD.band, fy0 = y0 + hb, fy1 = y1 - hb, cx = (x0 + x1) / 2, cw = x1 - x0, Wl = Math.max(1.2, W * .8);
  const els = [{ marks: [cut([[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0 - W * .3]], W * 1.2, { seed, wob: .14 }), cut([[x0, fy0], [x1, fy0]], W * 1.1, { seed: seed + 1 }), cut([[x0, fy1], [x1, fy1]], W * 1.1, { seed: seed + 2 })],
    fills: [], letters: [{ text: roman(n), x: cx, base: y0 + hb / 2 + hb * .31, size: hb * .62 }] }];
  // the ground: its top a low wavering line, yellow under it, hatched with the curves of Le Bateleur's ground, mirrored
  const gt = fy1 - H * CARD.ground, wave = Array.from({ length: 33 }, (_, k) => { const t = k / 32; return [x0 + t * cw, gt + Math.sin(t * Math.PI * 2) * H * .01 + (r() - .5) * H * .004]; });
  els.push({ marks: [cut(wave, W * .9, { seed: seed + 3 })], fills: [fill('y', [[...wave.map(([x, y]) => [Math.min(x1 - W, Math.max(x0 + W, x)), y]), [x1 - W, fy1 - W * .5], [x0 + W, fy1 - W * .5]]])] });
  const gh = fy1 - gt, clip = [x0 + W, gt + W * 1.2, x1 - W, fy1 - W];
  els.push(place('ground', [x0 + cw / 2 - TRACE.ground.a * gh * 1.1, gt, gh * 1.1], Wl, { clip, seed: seed + 5 }), place('ground', [x0 + cw / 2, gt, gh * 1.1], Wl, { clip, mirror: true, seed: seed + 6 }));
  // a tuft either side, standing on the ground
  const ph = H * .3, pw = TRACE.plant.a * ph;
  for (const sd of [-1, 1]) els.push(place('plant', [sd < 0 ? x0 - pw * .12 : x1 + pw * .12 - pw, gt - ph * .8, ph], Wl, { mirror: sd > 0, seed: seed + 8 + sd, clip: [x0 + W, fy0, x1 - W, gt + H * .02] }));
  // the drops of Le Soleil: one over the letter, one either side, in the three stencils
  const th = H * .11, tw = TRACE.tear.a * th;
  [[cx - tw / 2, fy0 + H * .025, 'r'], [x0 + cw * .1, fy0 + H * .14, 'y'], [x1 - cw * .1 - tw, fy0 + H * .2, 'p']].forEach(([tx, ty, c], k) => els.push(place('tear', [tx, ty, th], Wl, { col: c, seed: seed + 20 + k })));
  // the letter on the ground, at its middle
  const size = Math.min(H * CARD.letter, cw * .62 / textWidth(ch, 1)), base = gt + H * .008;
  // the title band lettered, if asked: Roman capitals with middle dots between words, as LE·BATELEUR, fitted to the band
  if (title) { const t = String(title).toUpperCase().trim().split(/\s+/).join('·'), ts = Math.min(hb * .62, cw * .84 / textWidth(t, 1));
    els.push({ marks: [], fills: [], letters: [{ text: t, x: cx, base: fy1 + hb / 2 + ts * .5, size: ts }] }); }
  const el = join(...els); el.letters.push(set === 'contour' ? { text: ch, x: cx, base, size, outline: W, body: 'r' } : { text: ch, x: cx, base, size });
  return { ...el, width: cw };
}
initial.width = () => CARD.ratio;   // in cap heights of the drop: the card is as tall as the drop
initial.line = ch => textWidth(String(ch).normalize('NFD')[0].toUpperCase(), 1);

// ---- frames -------------------------------------------------------------------------------------------------------------------
// The card's own furniture: the frame rule round the box, square at the corners; the numeral band across its head; the
// title band across its foot; on a pip card the numeral in each side margin, turned. No corner pips (those are the
// French playing card's, not the tarot's).
const rect = (B, W, seed) => cut([[B[0], B[1]], [B[2], B[1]], [B[2], B[3]], [B[0], B[3]], [B[0], B[1] - W * .3]], W, { seed, wob: .14 });
const frames = {
  // a quotation: a card round it, its footer (the attribution) in the title band at its foot
  quote: ({ box, foot, u, seed, rich = .5 }) => { const W = LW(u) * 1.25, B = [box[0], box[1] - u * 1.6, box[2], box[3] + u * 1.1];
    const marks = [rect(B, W, seed)]; if (foot) marks.push(cut([[B[0], foot - u * .9], [B[2], foot - u * .9]], W, { seed: seed + 1 }));
    return { marks, fills: [] }; },
  // a figure: the trump: the frame, the numeral band at its head, the title band (its caption) at its foot
  figure: ({ box, cap, u, seed, rich = .5, n = 1 }) => { const W = LW(u) * 1.3, hb = u * 3, B = [box[0] - u * 1.6, box[1] - u * 1.4 - hb, box[2] + u * 1.6, (cap ?? box[3]) + u * 1.3];
    const marks = [rect(B, W, seed), cut([[B[0], B[1] + hb], [B[2], B[1] + hb]], W, { seed: seed + 1 })];
    if (cap) marks.push(cut([[B[0], box[3] + u * 1.35], [B[2], box[3] + u * 1.35]], W, { seed: seed + 2 }));
    const size = u * 1.5; return { marks, fills: [], letters: [{ text: roman(n), x: (B[0] + B[2]) / 2, base: B[1] + hb / 2 + size / 2, size }] }; },
  // code: the pip card: the frame, its number turned in each side margin, reading up the left and down the right (c023)
  code: ({ box, u, seed, rich = .5, n = 1 }) => { const W = LW(u) * 1.2, B = box, size = u * 1.4, txt = roman(n), cy = (B[1] + B[3]) / 2, cx = (B[0] + B[2]) / 2;
    // the composition of a pip card (VIII batons, c023): the number turned in each side margin, a flower at the head of
    // the field and one at its foot, each growing out from the middle toward the frame, its bud to the frame
    const els = [{ marks: [rect(B, W, seed)], fills: [], letters: rich >= .25 ? [{ text: txt, x: B[0] + u * 1.15, base: cy + size / 2, size, rot: -Math.PI / 2 }, { text: txt, x: B[2] - u * 1.15, base: cy + size / 2, size, rot: Math.PI / 2 }] : [] }];
    if (rich >= .25) { const fl = Math.min(u * 4.3, (B[3] - B[1]) * .32); els.push(flower([cx, B[1] + fl * 1.08], -Math.PI / 2, fl, LW(u), seed + 3), flower([cx, B[3] - fl * 1.08], Math.PI / 2, fl, LW(u), seed + 4)); }
    return join(...els); },
  // a pull quote: the bands' rules above and below, a coin on each
  pull: ({ cx, yTop, yBot, measure, u, seed, rich = .5 }) => { const W = LW(u) * 1.15, half = Math.min(measure * .4, u * 18), R = u * 1.7, els = [];
    for (const [y, k] of [[yTop, 0], [yBot, 1]]) {
      els.push({ marks: [cut([[cx - half, y], [cx - R - u * .5, y]], W, { seed: seed + k * 3 }), cut([[cx + R + u * .5, y], [cx + half, y]], W, { seed: seed + k * 3 + 1 })], fills: [] });
      els.push(coin([cx, y], R, LW(u), seed + 10 + k)); }
    return join(...els); },
  // an aside: the card's left edge and its head band, a cup standing in the band
  aside: ({ box, u, seed, rich = .5, n = 1, title = 'NOTA' }) => { const W = LW(u) * 1.2, B = box, hb = u * 2.7, fb = u * 2.7, cx = (B[0] + B[2]) / 2;
    // a trump: the frame, the numeral band at its head with the chapter's number, the title band at its foot lettered as
    // the cards are, in Roman capitals (NOTA: the old books' mark for a note), a point either side of the word
    // and, as on the drop initial, the field's ground above the title band: yellow under a low wavering line, hatched
    // with Le Bateleur's curves, a tuft of his in each corner
    const size = u * 1.4, t = rich >= .25 ? `·${title}·` : title, r = rng(seed, 'aside'), els = [{ marks: [rect(B, W, seed), cut([[B[0], B[1] + hb], [B[2], B[1] + hb]], W, { seed: seed + 1 }), cut([[B[0], B[3] - fb], [B[2], B[3] - fb]], W, { seed: seed + 2 })], fills: [],
      letters: [{ text: roman(n), x: cx, base: B[1] + hb / 2 + size / 2, size }, { text: t, x: cx, base: B[3] - fb / 2 + size * .5, size: size * .92 }] }];
    if (rich >= .5) { const fy1 = B[3] - fb, gh = u * 1.9, gt = fy1 - gh, cw = B[2] - B[0], wave = Array.from({ length: 49 }, (_, k) => { const f = k / 48; return [B[0] + f * cw, gt + Math.sin(f * Math.PI * 5) * u * .1 + (r() - .5) * u * .05]; });
      els.push({ marks: [cut(wave, LW(u) * .9, { seed: seed + 3 })], fills: [fill('y', [[...wave.map(([x, y]) => [Math.min(B[2] - W, Math.max(B[0] + W, x)), y]), [B[2] - W, fy1 - W * .5], [B[0] + W, fy1 - W * .5]]])] });
      // the hatching in three clusters (under each tuft and at the middle), not a repeat
      const clip = [B[0] + W, gt + W, B[2] - W, fy1 - W], th = gh * 1.25, tw = TRACE.ground.a * th;
      [[B[0] + W, false], [cx - tw / 2, r() < .5], [B[2] - W - tw, true]].forEach(([x, m], k) => els.push(place('ground', [x, gt - th * .08, th], Math.max(1.2, LW(u) * .8), { clip, mirror: m, seed: seed + 10 + k })));
      const ph = u * 2.6, pw = TRACE.plant.a * ph;
      for (const sd of [-1, 1]) els.push(place('plant', [sd < 0 ? B[0] + W + u * .3 : B[2] - W - u * .3 - pw, gt - ph * .82, ph], Math.max(1.2, LW(u) * .8), { mirror: sd > 0, seed: seed + 30 + sd })); }
    return join(...els); },
  // the contents: a baton down the margin; the four suits, one at each entry (its chapter's paraph is that suit)
  nav: ({ box, entries, x, u, seed, rich = .5, side = true }) => { const W = LW(u), els = [];
    if (side) els.push(baton([x, box[1] - u * 1.8], [x, box[3] + u * 1.6], u * .55, W, seed));
    else els.push(baton([box[0] - u * .2, box[1] - u * 1.6], [Math.min(box[2], box[0] + u * 26), box[1] - u * 1.6], u * .5, W, seed));
    entries.forEach((e, k) => { const px = side ? x + u * 2.5 : box[0] - u * 1.5, s = SUITS[k % 4];
      els.push(s === 'coin' ? coin([px, e.base - u * .5], u * .78, W, seed + k) : s === 'cup' ? cup([px, e.base + u * .3], u * 1.8, W, seed + k)
        : s === 'sword' ? sword([px + u * .1, e.base - u * .1], u * 2, W, seed + k, .5, { b: u * .16, g: u * .48 }) : baton(rot([px, e.base + u * .4], [px, e.base - u * .5], .55), rot([px, e.base - u * 1.4], [px, e.base - u * .5], .55), u * .36, W, seed + k)); });
    return join(...els); },
};

// ---- palette -----------------------------------------------------------------------------------------------------------------
// Light: Conver's colours (research/12, the medians of each hue class on aged paper), brought back toward the colours
// they were before the paper yellowed, and the line a grey-black (the ink is thin, a little dry). Dark: the card seen by
// lamplight: the line a warm pale ink, the stencil colours deepened toward their mass tones so they sit under the
// pale line rather than glowing round it.
export const palette = {
  light: { k: [64, 61, 57], r: [190, 84, 56], y: [218, 182, 64], b: [58, 76, 128], p: [146, 168, 190], f: [232, 196, 160], g: [80, 112, 80] },
  dark: { k: [228, 218, 200], r: [196, 92, 66], y: [206, 170, 66], b: [86, 112, 170], p: [112, 138, 166], f: [196, 160, 128], g: [96, 136, 96] },
};

export const tarot = { label: 'Tarot', minGap: 2,
  setup: () => ({ kinds: FILLERS }), kinds: (v, rich) => rich < .25 ? ['baton'] : rich < .5 ? ['baton', 'sword'] : FILLERS,
  paraph, filler, breakMark, initial, frames, palette, FILLERS, SUITS, stencil, glyph, loadFace, printOf,
  pips: { coin, cup, sword, baton, flower, weave } };
export default tarot;
