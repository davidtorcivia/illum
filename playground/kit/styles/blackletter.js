// Blackletter: the German and Netherlandish book of the 15th and 16th centuries, textura and Fraktur, black and red
// (research/11-blackletter.md). Every mark is a ductus for the broad nib of kit/writer.js: an ordered path the pen
// travels, its thick and thin made by the nib's fixed angle (0.62 rad, the writer's Pen; textura's 35–40°), never drawn.
//
// The grammar, after the sources:
// - strap: a stroke written n times side by side, each copy shifted along the nib's edge by a nib and a gap, so the
//   copies stand a constant hair of paper apart in every direction (a scribe doubling a stroke sets the nib down beside
//   the last one); the red is a nib exactly the gap's width laid in the gap (Neudörffer's title cadel, Met 354468;
//   Rossi's cadels, 1598).
// - interlace: where two strands cross, one goes under and is broken a gap's width either side of the other; along a
//   hairline cadel the crossings alternate over and under.
// - lozenge: the nib set down and pushed a nib's width square to its edge: the textura point, black or red.
//
// - bundle (the cadels): a member of a capital written n times beside itself, each stroke offset square to the way
//   (not along the nib's edge, as a strap is), so the hair of paper between them holds round a curve; see "the cadel".
//
// Marks: strokes { pts (page px), w (nib width, px), col 'k' | 'r', hair (the nib's own thickness, px), angle? (the nib's,
// radians above the line, where it is not the writer's), press? (f in 0..1 along the stroke -> width multiplier: the
// cadels' pointed and flame ends) }, in the order the pen writes them. The page writes runs of marks with one colour
// and one nib as one writer part (createWriter(...).part(t0, t1, [{ pts, angle, press }], ink, { width: w, hair })).
//
// The style object follows the registry's signatures (kit/wayfinding.js STYLES, kit/initials.js, kit/frames.js):
// paraph(x, base, u, seed, rich), filler(x0, x1, yTop, yBase, kind, seed, rich), breakMark(cx, y, measure, rank, seed,
// rich, u), initial(o), frames.{quote, figure, code, pull, aside, nav}(args), palette.{light, dark}, touch(x, top,
// base, u, seed).
//
// The initial's contract (it differs from the registry's other styles, which set the host's glyph):
//   initial({ ch, G: { box: [x0, capTop, x1, baseline] }, keep, big, level, seed, room, bottom, face?, form? })
//     -> { letter, marks, width }
//   ch: the letter (required; A–Z, accents stripped; any other character returns { letter: ch, marks: [], width } so the
//   host shows its own glyph). The host sets its own glyph transparent either way. box: the cap height of the drop, from
//   its left edge (the drop's top on the first line's cap height, its foot on the n-th line's baseline); width: what to
//   float, known before layout as initial.width(ch, face, form) * cap height (initial.wider[level] px more on the text
//   side for the richer levels). keep: rects of the host's words, which no mark may touch; room: px of margin to the
//   left of the box the ornament may use; bottom: the page's foot. big: the drop (false: the capital in the line,
//   touched with red). level 0..4: how rich.
//   form 'face' (the default): the letter is a blackletter typeface's capital (face: a key of FACES, default FACE). The
//     host must `await loadFace(face)` before it measures or makes an initial. letter = { M, w, h, x0, y0, res, red? }:
//     the black coverage (w × h cells at res per px, its top-left at x0, y0 page px) and, where the heavy strokes are
//     split, the red laid between their halves (same grid; it runs a little under the black). The host lays it first,
//     with the ink engine: inkLetter(bake, { ...letter, M: letter.red }, palette.r), then inkLetter(bake, letter,
//     palette.k) over it, and then writes the marks (the bars, the staff, the cloud, the points) over both. (inkLetter and
//     letterWriter live in kit/inkletter.js, re-exported here; kit/illum.js does all this for a page: initial.load()
//     awaits the face, initial.width(ch, { face, form }) sizes the float.)
//   form 'cadel': the procedural cadel (the letter itself built as strapwork bundles; letter: null, all marks). Kept
//     for study; five procedurally built letters were rejected, the typeface letter replaced it as the default.
// touch(): the rubricator's red stroke through a capital of the host's text. The host's text is never marked unasked:
// the page calls it only when the reader asks for it (the specimen's ?capitals).

import { dist, warmInk, inkLetter, letterWriter } from '../inkletter.js';
export { warmInk, inkLetter, letterWriter };
import { noise2 } from '../marks.js';

const fnv = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rng = (seed, name) => mulberry(fnv(name + ':' + seed));

export const ANGLE = .62;                                                   // the writer's nib
const E = [Math.cos(ANGLE), -Math.sin(ANGLE)], Q = [Math.sin(ANGLE), Math.cos(ANGLE)];   // along the edge (up-right); square to it (down-right)
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const len = p => p.reduce((a, q, i) => i ? a + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0);
export function resample(p, ds = .8) {
  const out = [p[0]]; let carry = 0;
  for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = ds - carry;
    for (; t <= L; t += ds) out.push([a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L]); carry = L - (t - ds); }
  if (Math.hypot(out.at(-1)[0] - p.at(-1)[0], out.at(-1)[1] - p.at(-1)[1]) > ds * .3) out.push(p.at(-1));
  return out;
}
// a Gothic curve is a polygon whose corners are cut a little: n = 1 broken, 3 nearly round
const chaikin = (p, n) => { for (let k = 0; k < n; k++) { const q = [p[0]];
  for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); }
  q.push(p.at(-1)); p = q; } return p; };
export const curve = (cp, n = 2, ds = .8) => resample(chaikin(cp, n), ds);
// a smooth curve through the points (centripetal Catmull-Rom): the cadel's loops, which are round where the letter is broken
export function through(P, ds = .5) {
  const out = [], p = [P[0], ...P, P.at(-1)];
  for (let i = 1; i < p.length - 2; i++) { const [a, b, c, d] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const t = (u, v) => Math.max(1e-4, Math.hypot(v[0] - u[0], v[1] - u[1]) ** .5), t1 = t(a, b), t2 = t1 + t(b, c), t3 = t2 + t(c, d);
    for (let k = 0; k < 24; k++) { const T = t1 + (t2 - t1) * k / 24, L = (x, y, tx, ty) => [(x[0] * (ty - T) + y[0] * (T - tx)) / (ty - tx), (x[1] * (ty - T) + y[1] * (T - tx)) / (ty - tx)];
      const A1 = L(a, b, 0, t1), A2 = L(b, c, t1, t2), A3 = L(c, d, t2, t3), B1 = L(A1, A2, 0, t2), B2 = L(A2, A3, t1, t3); out.push(L(B1, B2, t1, t2)); } }
  out.push(P.at(-1)); return resample(out, ds);
}
const shiftE = (p, d) => p.map(q => add(q, E, d));
const stroke = (pts, w, col, hair = .6) => ({ pts, w, col, hair });
// the textura point: the nib set down and pushed square to its edge
export const lozenge = (p, s, col = 'k') => stroke([add(p, Q, -s * .4), add(p, Q, s * .4)], s, col, s * .3);
// the width a nib of edge length B lays across a path going in direction t (unit)
const across = (B, t, hair) => B * Math.abs(E[0] * t[1] - E[1] * t[0]) + hair;

// ---- strands ---------------------------------------------------------------------------------------------------------
// A strand is a centreline c, how wide it lies (B: the edge length of the whole bundle), and the strokes it is made of.
// strap: n copies along the edge, red in the gaps when asked. taper [a, b]: over the first a and last b of its length the
// copies close in to one, so the strap ends in a point as a doubled pen stroke does (the red stops where its gap does)
export function strap(c, { n = 2, W, g, red = true, col = 'k', hair = .6, z = 0, alt = false, taper = [0, 0] }) {
  const B = n * W + (n - 1) * g, parts = [], L = len(c), S = [0];
  for (let i = 1; i < c.length; i++) S.push(S[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]));
  const k = S.map(s => { const a = taper[0] ? s / (taper[0] * L) : 1, b = taper[1] ? (L - s) / (taper[1] * L) : 1, f = Math.min(1, a, b); return f * f * (3 - 2 * f); });
  const off = d => c.map((q, i) => add(q, E, d * k[i]));
  for (let j = 0; j < n; j++) parts.push(stroke(off((j - (n - 1) / 2) * (W + g)), W, col, hair));
  if (red && n > 1) for (let j = 0; j < n - 1; j++) { const p = off((j + .5 - (n - 1) / 2) * (W + g));
    let a = k.findIndex(f => f > .82), b = k.length - 1 - [...k].reverse().findIndex(f => f > .82);
    if (a >= 0 && b > a) parts.push({ ...stroke(p.slice(a, b + 1), g * .96, 'r', g * .3), i0: a }); }
  return { c, B, hair, parts, z, alt };
}
// a hairline cadel: one stroke of a fine nib; its crossings alternate
export const hairline = (c, W, col = 'k', z = 0) => ({ c, B: W, hair: .5, parts: [stroke(c, W, col, .5)], z, alt: true });

const tangent = (c, i) => { const a = c[Math.max(0, i - 2)], b = c[Math.min(c.length - 1, i + 2)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
function segX(p, q, r, s) {   // where segments pq and rs cross: [t on pq, u on rs] or null
  const d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]); if (Math.abs(d) < 1e-9) return null;
  const t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d, u = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d;
  return t >= 0 && t < 1 && u >= 0 && u < 1 ? [t, u] : null;
}
const bbox = c => c.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);
const near = (a, b, m) => a[0] - m < b[2] && b[0] - m < a[2] && a[1] - m < b[3] && b[1] - m < a[3];
const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };

// Over and under. Every crossing of two centrelines (a strand with itself too) is found; along an `alt` strand the
// crossings alternate, starting over; between two plain strands the higher z goes over. The strand going under has
// every stroke broken where it comes within the other's half-width and a gap of the other's centreline.
export function interlace(strands, gap) {
  // every segment in a grid of 6 px cells, so only segments that share a cell are tested against each other
  const X = [], C = 6, grid = new Map(), seen = new Set();
  strands.forEach((S, a) => { for (let i = 0; i < S.c.length - 1; i++) { const p = S.c[i], q = S.c[i + 1];
    for (let gx = Math.floor(Math.min(p[0], q[0]) / C); gx <= Math.floor(Math.max(p[0], q[0]) / C); gx++) for (let gy = Math.floor(Math.min(p[1], q[1]) / C); gy <= Math.floor(Math.max(p[1], q[1]) / C); gy++) {
      const k = gx * 73856093 ^ gy * 19349663; let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(a, i); } } });
  for (const l of grid.values()) for (let m = 0; m < l.length; m += 2) for (let n = m + 2; n < l.length; n += 2) {
    let a = l[m], i = l[m + 1], b = l[n], j = l[n + 1]; if (b < a || (a === b && j < i)) [a, i, b, j] = [b, j, a, i];
    if (a === b && j < i + 4) continue; const key = ((a * 65536 + i) * 64 + b) * 65536 + j; if (seen.has(key)) continue; seen.add(key);
    const A = strands[a], B = strands[b], r = segX(A.c[i], A.c[i + 1], B.c[j], B.c[j + 1]); if (!r) continue;
    X.push({ pass: [{ s: a, i }, { s: b, i: j }], p: add(A.c[i], [A.c[i + 1][0] - A.c[i][0], A.c[i + 1][1] - A.c[i][1]], r[0]), over: -1 }); }
  // in the order the old scan found them (strand, then index along it): the alternation reads them in that order
  X.sort((x, y) => x.pass[0].s - y.pass[0].s || x.pass[1].s - y.pass[1].s || x.pass[0].i - y.pass[0].i || x.pass[1].i - y.pass[1].i);
  // the alternating strands first, in order; a crossing already decided sets the rhythm from there
  strands.forEach((S, s) => { if (!S.alt) return;
    // (alt 'own': it alternates only where it crosses another alternating strand; elsewhere z decides)
    const visits = []; X.forEach(x => x.pass.forEach((v, k) => v.s === s && (S.alt !== 'own' || strands[x.pass[1 - k].s].alt) && visits.push({ x, k, i: v.i })));
    visits.sort((m, n) => m.i - n.i); let over = true;
    for (const v of visits) { if (v.x.over < 0) v.x.over = over ? v.k : 1 - v.k; else over = v.x.over === v.k; over = !over; } });
  for (const x of X) if (x.over < 0) x.over = strands[x.pass[0].s].z >= strands[x.pass[1].s].z ? 0 : 1;
  // cut the under passes
  const kill = strands.map(S => S.parts.map(p => new Uint8Array(p.pts.length)));
  for (const x of X) {
    const O = x.pass[x.over], U = x.pass[1 - x.over], So = strands[O.s], Su = strands[U.s];
    const to = tangent(So.c, O.i), tu = tangent(Su.c, U.i), sin = Math.max(.5, Math.abs(to[0] * tu[1] - to[1] * tu[0]));
    const hO = (So.hw ? So.hw[O.i] : across(So.B, to, So.hair) / 2) + gap, reach = hO / sin + (Su.hw ? 2 * Su.hw[U.i] : across(Su.B, tu, Su.hair)) + 4, win = Math.ceil(reach * 3);
    const segs = []; for (let j = Math.max(0, O.i - win); j < Math.min(So.c.length - 1, O.i + win); j++) segs.push([So.c[j], So.c[j + 1]]);
    Su.parts.forEach((p, k) => p.pts.forEach((q, n) => {   // a strand's strokes share its centreline's indexing
      if (Math.abs(n + (p.i0 ?? 0) - U.i) > win || Math.abs(q[0] - x.p[0]) > reach || Math.abs(q[1] - x.p[1]) > reach) return;
      for (const [a, b] of segs) if (segDist(q, a, b) < hO) { kill[U.s][k][n] = 1; break; } }));
  }
  // and rebuild each stroke as its unbroken runs
  // (a stroke's per-point width multipliers, wm, are cut with it)
  return strands.flatMap((S, s) => S.parts.flatMap((p, k) => { const runs = []; let a = 0;
    const cut = b => { if (b - a > 1) runs.push(p.wm ? { pts: p.pts.slice(a, b), wm: p.wm.slice(a, b) } : { pts: p.pts.slice(a, b) }); };
    p.pts.forEach((q, n) => { if (kill[s][k][n]) { cut(n); a = n + 1; } }); cut(p.pts.length);
    return runs.filter(r => len(r.pts) > Math.max(.8, p.w * .25)).map(r => { const { i0, ...q } = p; return { ...q, ...r }; }); }));
}

// a hairline that curls up as it goes: heading h, length L, its turning growing to k1 (1/px) toward the end
export function tendril(p, h, L, k1, ds = .5) {
  const out = [p]; let [x, y] = p;
  for (let d = ds; d <= L; d += ds) { const f = d / L; h += k1 * f * f * ds * 2; x += Math.cos(h) * ds; y += Math.sin(h) * ds; out.push([x, y]); }
  return out;
}

// ---- the cadel ---------------------------------------------------------------------------------------------------------------
// A cadel is built, not drawn: a letter's skeleton (the members of a Fraktur/textura capital, each an ordered path the
// pen travels) is written as bundles, and the hairline cloud is grown from it.
// - bundle: a member written n times beside itself, each stroke set down a hair of paper from the last (Rossi 1598:
//   bundles of 3-5, components ~1/12 of the letter, gaps ~1/3 of a component). The nib keeps its angle, so every stroke
//   swells and thins with the direction it runs and the bundle swells with it; the gap stays a hair everywhere.
//   Where the member curls up at an end, the strokes on the inside of the curl stop where they could not follow it
//   (a pen cannot run tighter than its own width) and end in a point: the staggered, flame-like ends of Rossi's cadels.
// - red, as the rubricator added it: in the channel down the middle of a stem, filled (Neudörffer's colour between his
//   doubled strokes) or strung with lozenges (Rossi's chain, in red); three black bars bound across it; small crosses
//   of points hung from the base ribbon.
// - flames, fringes: short strokes pulled from a bundle's edge to a point (Rossi's feathering), and combs of hairs.
// - the hairline cloud (Neudörffer's title cadel): long loops of the nib's thin edge sprung from the members' ends,
//   a loop as large as the margin allows, coming back through itself and the letter, over and under, ending in a small
//   curl of the other sense and a point.

const wAt = (W, t, hair) => W * Math.abs(E[0] * t[1] - E[1] * t[0]) + hair;
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const arc = c => { const S = [0]; for (let i = 1; i < c.length; i++) S.push(S[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1])); return S; };
// per-point width multipliers as the writer's press(f), f the fraction of the stroke's length
export function pressOf(pts, wm) {
  if (!wm) return undefined; const S = arc(pts), L = S.at(-1) || 1;
  return f => { const s = f * L; let lo = 0, hi = S.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    const u = (s - S[lo]) / ((S[hi] - S[lo]) || 1); return wm[lo] + (wm[hi] - wm[lo]) * Math.max(0, Math.min(1, u)); };
}
// a path whose turning is given piece by piece: [length px, curvature at its start, at its end] (1/px, + clockwise on the page)
export function flourish(p, h, pieces, ds = .6) {
  let [x, y] = p; const out = [[x, y]];
  for (const [L, k0, k1] of pieces) for (let d = ds; d <= L + 1e-9; d += ds) { h += (k0 + (k1 - k0) * d / L) * ds; x += Math.cos(h) * ds; y += Math.sin(h) * ds; out.push([x, y]); }
  return out;
}
// tangents over a window, and the signed curvature (+: the centre of the turn on the +N side, N = t turned clockwise)
function frameOf(c, win) {
  const m = c.length, T = c.map((_, i) => unit([c[Math.min(m - 1, i + win)][0] - c[Math.max(0, i - win)][0], c[Math.min(m - 1, i + win)][1] - c[Math.max(0, i - win)][1]]));
  const S = arc(c), K = T.map((_, i) => { const a = Math.max(0, i - win), b = Math.min(m - 1, i + win), ds = S[b] - S[a] || 1;
    return (T[a][0] * T[b][1] - T[a][1] * T[b][0]) / ds; });
  return { T, N: T.map(t => [-t[1], t[0]]), K, S };
}

// A member as a bundle: n strokes of a nib W, a gap g; chan: a wider channel down the middle (n even), as a fraction
// of a stroke's width, for the red; taper [a, b]: the strokes close to one over the first a and last b of the length
// (Neudörffer's crescent); point [a, b]: the ends pulled to a point; flame [a, b]: the ends staggered, the outer stroke
// longest, each hooked over the way the member turns (Rossi); shear: the strokes start and end on the nib's diagonal,
// as a textura stem's head and foot do; the outer strokes of a curve a little heavier than the inner.
export function bundle(c, { n = 3, W, g, hair = .6, chan = 0, red = 'fill', z = 0, taper = [0, 0], point = [true, true], flame = [false, false], shear = false, col = 'k' }) {
  const m = c.length, { T, N, K, S } = frameOf(c, 3), L = S.at(-1), w = T.map(t => wAt(W, t, hair));
  const k = S.map(s => { const a = taper[0] ? s / (taper[0] * L) : 1, b = taper[1] ? (L - s) / (taper[1] * L) : 1, f = Math.min(1, a, b); return f * f * (3 - 2 * f); });
  const ch = chan && n % 2 === 0 ? chan : 0, Km = K.reduce((a, v) => a + v, 0) / m;
  // weights: the stroke on the outside of the member's turn the heaviest (+N side is inside when Km > 0)
  const f = Array.from({ length: n }, (_, j) => n < 2 ? 1 : shear ? (j === 0 || j === n - 1 ? .85 : 1.2) : 1 + .22 * (Km > 0 ? -1 : 1) * ((j - (n - 1) / 2) / ((n - 1) / 2)));
  const before = j => { let a = 0; for (let l = 0; l < j; l++) a += f[l]; return a; }, F = before(n);
  const tot = i => F * w[i] + (n - 1) * g + ch * w[i];
  const centre = (j, i) => k[i] * (-tot(i) / 2 + before(j) * w[i] + f[j] * w[i] / 2 + j * g + (ch && j >= n / 2 ? ch * w[i] : 0));
  const parts = [], hw = S.map((_, i) => k[i] * tot(i) / 2 + hair * .5);
  const R = W * 2.2, tip = d => Math.max(.05, Math.min(1, d / R)) ** .8;
  // rank of each stroke from the outside of the turn at each end (0 the outermost)
  const Ke = [K.slice(0, Math.ceil(m * .2)), K.slice(-Math.ceil(m * .2))].map(a => a.reduce((x, v) => x + v, 0) / a.length);
  const rank = (j, e) => Ke[e] > 0 ? j : n - 1 - j;
  for (let j = 0; j < n; j++) {
    const o = c.map((_, i) => centre(j, i)), bad = o.map((v, i) => v * K[i] > .5 || (i > 0 && i < m - 1 && Math.abs(o[i + 1] - o[i - 1]) > 2.5 * (S[i + 1] - S[i - 1])));
    // shear: how far along the way this stroke's head and foot sit on the nib's diagonal
    if (shear) { const sh = (i, l) => { const d = E[0] * N[i][0] + E[1] * N[i][1], e = E[0] * T[i][0] + E[1] * T[i][1]; return Math.abs(d) > .2 ? centre(l, i) * e / d : 0; };
      const ends = [0, m - 1].map(i => { const all = Array.from({ length: n }, (_, l) => sh(i, l)); return [sh(i, j), Math.min(...all), Math.max(...all)]; });
      const s0 = flame[0] ? 0 : W * (.3 + 1.6 * Math.abs(j - (n - 1) / 2)), s1 = ends[1][2] - ends[1][0];   // the head in points (or flames), the foot cut on the diagonal
      S.forEach((v, i) => { if (v < s0 || v > L - s1) bad[i] = true; }); }
    // flames: the inner strokes stop short of the outer
    flame.forEach((fl, e) => { if (!fl) return; const cut = W * (.4 + 1.5 * rank(j, e)); S.forEach((v, i) => { if (e ? v > L - cut : v < cut) bad[i] = true; }); });
    let best = [0, 0], a = 0;   // the longest run the stroke can follow
    for (let i = 0; i <= m; i++) if (i === m || bad[i]) { if (i - a > best[1] - best[0]) best = [a, i]; a = i + 1; }
    if (best[1] - best[0] < 3) continue;
    const [i0, i1] = best; let pts = [];
    for (let i = i0; i < i1; i++) pts.push(add(c[i], N[i], o[i]));
    // a flame's tip: the stroke hooks over, the way the member turns, and comes to a point
    const hook = (P, e) => { const q = P.at(-1), d = unit([q[0] - P.at(-4)[0], q[1] - P.at(-4)[1]]), Lh = W * (2 + .4 * (n - rank(j, e))), sg = (Ke[e] >= 0 ? 1 : -1) * (e ? 1 : -1);
      return tendril(q, Math.atan2(d[1], d[0]), Lh, sg * 2.6 / Lh, .6).slice(1); };
    let h0 = 0;
    if (flame[1] && i1 < m) pts = [...pts, ...hook(pts, 1)];
    if (flame[0] && i0 > 0) { const t = hook([...pts].reverse(), 0).reverse(); h0 = t.length; pts = [...t, ...pts]; }
    const Sx = arc(pts), Lx = Sx.at(-1), p0 = point[0] || flame[0] || i0 > 0, p1 = point[1] || flame[1] || (i1 < m && !shear);
    parts.push({ pts, wm: Sx.map(v => Math.min(p0 ? tip(v) : 1, p1 ? tip(Lx - v) : 1)), w: W * f[j], col, hair, i0: i0 - h0 });
  }
  if (ch) {   // the red in the channel: filled with a nib a little narrower than it, so a hair of paper shows each side,
    // or strung with lozenges on a red hair (Rossi's chain, in the rubricator's colour)
    const i0 = k.findIndex(f => f > .7) + (shear ? Math.ceil(m * .1) : 0), i1 = m - [...k].reverse().findIndex(f => f > .7) - (shear ? Math.ceil(m * .05) : 0);
    const pts = [], mid = i => (centre(n / 2 - 1, i) + centre(n / 2, i)) / 2;
    for (let i = i0; i < i1; i++) pts.push(add(c[i], N[i], mid(i)));
    const S2 = arc(pts), L2 = S2.at(-1);
    if (pts.length > 2 && red === 'fill') parts.push({ pts, wm: S2.map(s => Math.min(1, s / (W * 2), (L2 - s) / (W * 2)) ** .6), w: W * ch * .8, col: 'r', hair: hair * .6, i0, red: true });
    if (pts.length > 2 && red === 'chain') {
      parts.push({ pts, w: Math.max(.6, W * .12), col: 'r', hair: .4, i0, red: true });
      const sz = ch * w[i0] * .78, step = sz * 1.55, cnt = Math.floor((L2 - sz) / step), s0 = (L2 - cnt * step) / 2;
      for (let q = 0; q <= cnt; q++) { const i = S2.findIndex(v => v >= s0 + q * step); if (i < 0) continue; const lz = lozenge(pts[i], sz, 'r'); parts.push({ ...lz, i0: i0 + i, red: true }); }
    }
  }
  return { c, hw, parts, z, alt: false, T, N, S, w, W, g, n, centre };
}

// a member's end, carried on: c a curl (+ clockwise / - / auto), h a short hook, with a length (in letter heights)
function extend(c, spec, H, atStart) {
  const m = /^([ch])([+-]?)([\d.]*)$/.exec(spec ?? ''); if (!m) return c;
  const P = atStart ? [...c].reverse() : c, { T, K } = frameOf(P, 3), q = P.at(-1), t = T.at(-1);
  const sense = m[2] ? (m[2] === '+' ? 1 : -1) : (K.at(-4) >= 0 ? 1 : -1), L = (+m[3] || (m[1] === 'c' ? .3 : .12)) * H;
  const turn = m[1] === 'c' ? 1.45 * Math.PI : .7 * Math.PI, k1 = sense * turn * 1.5 / L;
  const tail = tendril(q, Math.atan2(t[1], t[0]), L, k1, .6).slice(1), out = [...P, ...tail];
  return atStart ? out.reverse() : out;
}

// Neudörffer's hairline (Met 354468, title): the pen runs on from a stroke's point on its thin edge, sweeps out in a
// wide arc (sense s, radius ~R) that may come round far enough to cross itself, turns the other way, and ends in a
// small hook; a point of the pen is set in the hook's eye. v: three variations (sweep, turn, hook)
function loopOf(p, h, R, s, v = [1, 1, 1], r = Math.random) {
  // the sweep through points on a spiral that draws in as it goes, each a little off it (a hand's arc, not a compass's)
  const turn = Math.PI * (.9 + .9 * v[1]) * v[0], c = add(p, [Math.cos(h + s * Math.PI / 2), Math.sin(h + s * Math.PI / 2)], R), a0 = Math.atan2(p[1] - c[1], p[0] - c[0]);
  const n = Math.max(3, Math.round(turn / 1.05)), cp = [p];
  for (let k = 1; k <= n; k++) { const f = k / n, a = a0 + s * turn * f, rho = R * (1 - .45 * f) * (1 + (r() - .5) * .3); cp.push([c[0] + Math.cos(a) * rho, c[1] + Math.sin(a) * rho]); }
  const sweep = through(cp, .6), q = sweep.at(-1), d = unit([q[0] - sweep.at(-4)[0], q[1] - sweep.at(-4)[1]]), rh = R * (.18 + .1 * v[2]);
  const hook = flourish(q, Math.atan2(d[1], d[0]), [[R * .3, s * .5 / R, -s / (rh * 1.4)], [rh * Math.PI * 1.1, -s / rh, -s / (rh * .6)]], .6);
  const pts = [...sweep, ...hook.slice(1)], e = pts.at(-1), d2 = unit([e[0] - pts.at(-4)[0], e[1] - pts.at(-4)[1]]);
  pts.eye = add(add(e, [-d2[1] * -s, d2[0] * -s], rh * .7), d2, -rh * .2);
  return pts;
}
const curlOf = (p, h, r, s) => flourish(p, h, [[r * .7, 0, s / r], [r * Math.PI * 1.6, s / r, s / (r * .45)]], .5);
// ---- the capitals ------------------------------------------------------------------------------------------------------------
// Each in a unit box: y 0 at the cap line, 1 on the baseline, x from the letter's left; w the advance. m: the members in
// the order written, each { p: points the pen passes through, z (over and under: higher goes over), n (strokes; default
// by role), r: 'stem' (the channel and its red) | 'band' (a ribbon, red down its middle) | 'hair' (a single hairline),
// a, b: what the start and end do ('c±len' curl, 'h±len' hook; otherwise a point), girdle: where the bars bind a stem
// (0..1 of its length), fl: [from, to, side] flames, fr: [from, to, side] a fringe of hairs, x: [from, to, side] red
// crosses, sp: ±1 a spur beside a stem (- left), o: an ornament, left out of the small capital in the line } (side:
// +1 the right of the pen's way, -1 the left).
const CAPS = {
  A: { w: .96, m: [
    { p: [[.04, .98], [.14, .72], [.3, .34], [.54, .06]], z: 1 },
    { r: 'stem', p: [[.66, .03], [.67, .5], [.68, .98]], z: 3, red: 'chain', girdle: .75 },
    { p: [[.2, .6], [.44, .56], [.84, .55]], n: 2, z: 4 },
    { p: [[.54, .05], [.36, -.08], [.16, -.06]], n: 2, b: 'c-.14', z: 5 },
  ] },
  B: { w: 1.08, m: [
    { r: 'stem', p: [[.40, .04], [.40, .45], [.39, .75], [.38, .98]], z: 3, red: 'chain', girdle: .7, sp: -1 },
    { p: [[.52, -.02], [.64, .02], [.78, .14], [.79, .31], [.69, .43], [.57, .50]], z: 2 },
    { p: [[.57, .54], [.82, .52], [.98, .66], [.99, .85], [.85, .98], [.6, 1.0]], z: 2, fr: [.15, .45, -1], fb: 0 },
    { r: 'band', p: [[.06, .95], [.3, 1.0], [.6, 1.05], [.92, 1.02], [1.06, .92]], b: 'c-.12', z: 4, x: [.18, .55, 1] },
    { p: [[.50, .03], [.42, -.08], [.48, -.18], [.66, -.21], [.84, -.15], [.9, -.06]], n: 3, z: 5, o: 1 },
  ] },
  C: { w: .92, m: [
    { p: [[.74, .1], [.5, .0], [.24, .1], [.1, .45], [.16, .8], [.38, .99], [.7, .95]], z: 2, fr: [.08, .3, -1] },
    { r: 'stem', p: [[.52, .16], [.52, .5], [.52, .82]], z: 1, red: 'chain' },
    { p: [[.52, .1], [.7, .0], [.88, .1]], n: 2, b: 'c+.12', z: 4 },
  ] },
  D: { w: 1.02, m: [
    { r: 'stem', p: [[.24, .06], [.24, .5], [.24, .96]], z: 3, red: 'chain', sp: -1, girdle: .6 },
    { p: [[.34, .03], [.62, .02], [.86, .2], [.92, .55], [.8, .86], [.52, 1.0], [.26, .99]], z: 2, fr: [.3, .55, -1] },
    { p: [[.24, .06], [.12, -.06], [-.02, -.02]], n: 2, b: 'c-.12', z: 5 },
  ] },
  E: { w: .9, m: [
    { p: [[.7, .1], [.44, .02], [.2, .14], [.1, .5], [.16, .82], [.38, .99], [.7, .94]], z: 2 },
    { r: 'stem', p: [[.48, .2], [.48, .52], [.48, .82]], z: 1, red: 'fill' },
    { p: [[.48, .48], [.66, .44], [.84, .5]], n: 2, z: 4, b: 'h+.1' },
    { p: [[.48, .08], [.68, .0], [.86, .08]], n: 2, b: 'c+.12', z: 4 },
  ] },
  F: { w: .9, m: [
    { r: 'stem', p: [[.34, .06], [.34, .5], [.34, .98]], z: 3, red: 'chain', sp: -1, girdle: .75 },
    { p: [[.16, .06], [.42, -.02], [.66, .02], [.86, -.06]], n: 3, b: 'c-.12', z: 4 },
    { p: [[.18, .5], [.46, .46], [.72, .5]], n: 2, z: 4 },
  ] },
  G: { w: .96, m: [
    { p: [[.72, .1], [.48, .0], [.22, .12], [.1, .5], [.18, .84], [.42, .99], [.66, .96]], z: 2, fr: [.08, .3, -1] },
    { r: 'stem', p: [[.72, .46], [.72, .72], [.72, .98]], z: 3, red: 'fill' },
    { p: [[.44, .48], [.64, .42], [.9, .46]], n: 2, z: 4 },
    { p: [[.72, .1], [.84, .02], [.94, .1]], n: 2, b: 'c+.1', z: 4 },
  ] },
  H: { w: 1.02, m: [
    { r: 'stem', p: [[.30, .04], [.30, .5], [.30, .98]], z: 3, red: 'chain', sp: -1, girdle: .72 },
    { p: [[.46, .36], [.7, .28], [.88, .45], [.86, .78], [.74, 1.0], [.6, 1.12]], z: 2, fr: [.1, .4, -1] },
    { r: 'band', p: [[.06, .02], [.3, -.05], [.58, .0], [.8, -.06]], b: 'c-.1', z: 4 },
  ] },
  I: { w: .74, m: [
    { r: 'stem', p: [[.40, .06], [.40, .5], [.40, .96]], z: 3, red: 'chain', sp: -1, girdle: .7 },
    { r: 'band', p: [[.1, .05], [.4, -.03], [.7, .04]], a: 'c-.1', b: 'c+.1', z: 4 },
    { p: [[.12, .9], [.4, 1.02], [.68, .94]], n: 2, z: 4 },
  ] },
  J: { w: .8, m: [
    { p: [[.5, .04], [.52, .5], [.48, .86], [.32, 1.06], [.1, 1.04]], z: 2 },
    { r: 'band', p: [[.18, .05], [.48, -.03], [.76, .04]], a: 'c-.1', b: 'c+.1', z: 4 },
    { p: [[.3, .3], [.2, .4], [.22, .55], [.3, .6]], n: 2, z: 1, o: 1 },
  ] },
  K: { w: 1.0, m: [
    { r: 'stem', p: [[.28, .04], [.28, .5], [.28, .98]], z: 3, red: 'chain', sp: -1, girdle: .75 },
    { p: [[.86, .04], [.66, .28], [.46, .5]], z: 2 },
    { p: [[.46, .5], [.64, .68], [.78, .9], [.96, 1.0]], z: 2 },
    { r: 'band', p: [[.04, .03], [.28, -.04], [.5, .02]], b: 'c+.1', z: 4 },
  ] },
  L: { w: .92, m: [
    { r: 'stem', p: [[.32, .04], [.32, .5], [.32, .92]], z: 3, red: 'chain', sp: -1, girdle: .65 },
    { r: 'band', p: [[.06, .93], [.36, 1.0], [.66, .98], [.88, .88]], b: 'c-.1', z: 4, x: [.2, .6, 1] },
    { p: [[.44, .05], [.3, -.08], [.12, -.05]], n: 2, b: 'c-.12', z: 5 },
    { p: [[.5, .2], [.62, .12], [.74, .22], [.7, .36]], n: 2, z: 1, o: 1 },
  ] },
  M: { w: 1.12, m: [
    { p: [[.04, .98], [.1, .6], [.14, .2], [.3, .04]], n: 3, z: 1 },
    { r: 'stem', p: [[.48, .06], [.48, .5], [.48, .98]], z: 3, red: 'chain', girdle: .75 },
    { p: [[.52, .1], [.7, .0], [.86, .14]], n: 2, z: 2 },
    { p: [[.86, .12], [.88, .55], [.86, .98]], n: 3, z: 2 },
  ] },
  N: { w: .94, m: [
    { p: [[.04, .98], [.1, .56], [.16, .16], [.32, .04]], n: 3, z: 1 },
    { r: 'stem', p: [[.70, .04], [.70, .5], [.70, .98]], z: 3, red: 'chain', sp: 1, girdle: .75 },
    { p: [[.32, .08], [.46, .36], [.56, .62]], n: 2, z: 2 },
  ] },
  O: { w: 1.02, m: [
    { p: [[.48, .02], [.2, .12], [.08, .5], [.2, .88], [.48, .99]], z: 2 },
    { p: [[.52, .02], [.8, .12], [.92, .5], [.8, .88], [.52, .99]], z: 1, fr: [.15, .4, 1] },
    { r: 'stem', p: [[.50, .18], [.50, .5], [.50, .82]], z: 3, red: 'chain' },
  ] },
  P: { w: .98, m: [
    { r: 'stem', p: [[.30, .04], [.30, .5], [.30, .98]], z: 3, red: 'chain', sp: -1, girdle: .8 },
    { p: [[.44, .03], [.7, .04], [.88, .22], [.86, .46], [.66, .58], [.44, .58]], z: 2, fr: [.2, .5, -1] },
    { p: [[.3, .04], [.16, -.07], [.02, -.01]], n: 2, b: 'c-.1', z: 5 },
    { p: [[.08, .96], [.3, 1.02], [.52, .96]], n: 2, z: 4 },
  ] },
  Q: { w: 1.04, m: [
    { p: [[.48, .02], [.2, .12], [.08, .5], [.2, .86], [.48, .97]], z: 2 },
    { p: [[.52, .02], [.8, .12], [.92, .5], [.8, .86], [.52, .97]], z: 1 },
    { r: 'stem', p: [[.50, .18], [.50, .5], [.50, .8]], z: 3, red: 'chain' },
    { r: 'band', p: [[.3, .86], [.6, 1.0], [.84, 1.04], [1.04, .98]], b: 'c-.1', z: 4 },
  ] },
  R: { w: 1.0, m: [
    { r: 'stem', p: [[.30, .04], [.30, .5], [.30, .98]], z: 3, red: 'chain', sp: -1, girdle: .8 },
    { p: [[.44, .03], [.7, .04], [.86, .2], [.82, .42], [.62, .52], [.44, .52]], z: 2 },
    { p: [[.5, .55], [.66, .7], [.78, .92], [.96, 1.0]], z: 2 },
    { p: [[.3, .04], [.16, -.07], [.02, -.01]], n: 2, b: 'c-.1', z: 5 },
  ] },
  S: { w: .92, m: [
    { p: [[.8, .1], [.56, .0], [.28, .06], [.18, .26], [.34, .44], [.6, .56], [.78, .76], [.7, .94], [.42, 1.0], [.12, .92]], z: 2 },
    { r: 'stem', p: [[.30, .52], [.30, .72], [.30, .9]], n: 2, z: 1, red: 'fill' },
    { p: [[.62, .1], [.66, .22], [.6, .34]], n: 2, z: 1, o: 1 },
  ] },
  T: { w: .98, m: [
    { r: 'band', p: [[.02, .06], [.3, -.02], [.62, .03], [.94, -.04]], a: 'c-.1', b: 'c+.1', z: 4 },
    { r: 'stem', p: [[.48, .1], [.48, .5], [.48, .96]], z: 3, red: 'chain', girdle: .75 },
    { p: [[.32, .3], [.22, .4], [.24, .55], [.32, .6]], n: 2, z: 1, o: 1 },
    { p: [[.64, .3], [.74, .4], [.72, .55], [.64, .6]], n: 2, z: 1, o: 1 },
  ] },
  U: { w: .96, m: [
    { p: [[.2, .04], [.14, .5], [.2, .86], [.42, 1.0], [.62, .94]], z: 2 },
    { r: 'stem', p: [[.72, .04], [.72, .5], [.72, .98]], z: 3, red: 'chain', sp: 1, girdle: .7 },
    { p: [[.2, .05], [.08, -.05], [-.04, .02]], n: 2, b: 'c-.1', z: 5 },
  ] },
  V: { w: .92, m: [
    { r: 'stem', p: [[.06, .04], [.22, .5], [.42, .98]], z: 2, red: 'chain' },
    { p: [[.42, .98], [.66, .62], [.84, .26], [.84, .04]], z: 1, fr: [.4, .8, 1] },
    { p: [[.06, .05], [-.04, -.06], [-.14, .0]], n: 2, b: 'c-.1', z: 5 },
  ] },
  W: { w: 1.24, m: [
    { r: 'stem', p: [[.04, .04], [.18, .5], [.34, .98]], z: 2, red: 'chain' },
    { p: [[.34, .98], [.5, .6], [.6, .1]], n: 3, z: 1 },
    { r: 'stem', p: [[.6, .1], [.72, .55], [.82, .98]], z: 2, red: 'fill' },
    { p: [[.82, .98], [1.02, .62], [1.14, .26], [1.12, .04]], z: 1 },
  ] },
  X: { w: .98, m: [
    { r: 'stem', p: [[.1, .04], [.34, .3], [.62, .7], [.9, .98]], z: 1, red: 'chain' },
    { p: [[.88, .04], [.62, .3], [.36, .7], [.1, .98]], z: 2 },
    { r: 'band', p: [[.0, .02], [.3, -.04], [.6, .0]], b: 'c+.1', z: 4 },
  ] },
  Y: { w: .92, m: [
    { r: 'stem', p: [[.06, .04], [.24, .48], [.46, .9]], z: 2, red: 'chain' },
    { p: [[.86, .04], [.72, .48], [.52, .92], [.32, 1.12], [.08, 1.08]], z: 1 },
    { p: [[.06, .05], [-.04, -.06], [-.14, .0]], n: 2, b: 'c-.1', z: 5 },
  ] },
  Z: { w: .96, m: [
    { r: 'band', p: [[.08, .08], [.46, .0], [.88, .06]], a: 'c-.1', z: 4 },
    { p: [[.84, .1], [.56, .46], [.18, .9]], z: 2 },
    { r: 'band', p: [[.1, .94], [.5, 1.02], [.92, .94]], b: 'c-.1', z: 4, x: [.2, .7, 1] },
    { p: [[.3, .5], [.5, .46], [.74, .5]], n: 2, z: 5 },
  ] },
};
export const LETTERS = Object.keys(CAPS);

// per level (0..4): strokes in a member and in a stem, red, cloud loops, flames/fringes/crosses, the girdle
const BUDGET = [{ n: 2, ns: 2, loops: 0, curls: 0, orn: false, girdle: false }, { n: 2, ns: 2, loops: 2, curls: 1, orn: false, girdle: false }, { n: 3, ns: 2, loops: 3, curls: 3, orn: true, girdle: true },
  { n: 3, ns: 4, loops: 6, curls: 6, orn: true, girdle: true }, { n: 4, ns: 4, loops: 9, curls: 10, orn: true, girdle: true }];

// the letter's members placed and written as bundles; X maps the unit box onto the page
function capital(ch, X, H, level, big) {
  const D = CAPS[ch] ?? CAPS.B, b = BUDGET[level], W = big ? H * .052 : H * .14, g = big ? Math.max(1, W * .25) : 0, hair = Math.max(.5, W * .12);
  // a stem's spur: a hook of a bundle beside it, open at its head and curled in at its foot toward the stem (Rossi's B),
  // on the side sp says
  const spurs = big && b.orn ? D.m.filter(mb => mb.sp).map(mb => { const x = mb.p[0][0], d = mb.sp;
    return { n: 2, z: 1, p: [[x + d * .3, .22], [x + d * .33, .4], [x + d * .3, .58], [x + d * .2, .7]], b: 'h' + (d < 0 ? '-' : '+') + '.1' }; }) : [];
  const members = [...D.m.filter(mb => big || !mb.o), ...spurs].map(mb => {
    const c0 = through(mb.p.map(X), .6), c = big ? extend(extend(c0, mb.a, H, true), mb.b, H, false) : c0;
    if (mb.r === 'hair') return { mb, ...hairline(c, Math.max(1, W * .5)), alt: true, z: mb.z ?? 0 };
    const n = !big ? 1 : mb.n ?? (mb.r === 'stem' ? b.ns : mb.r === 'band' ? 2 : b.n);
    const chan = big && n % 2 === 0 && (mb.r === 'stem' || mb.r === 'band') ? (mb.r === 'stem' ? 1 : .7) : 0;
    const free = e => !/^[ch]/.test(e ?? '');
    return { mb, ...bundle(c, { n, W: mb.r === 'band' ? W * .8 : W, g, hair, chan, red: mb.red ?? 'fill', z: mb.z ?? 0, shear: mb.r === 'stem',
      point: mb.r === 'stem' ? [false, false] : [free(mb.a), free(mb.b)], flame: big && !mb.r && n > 1 ? [free(mb.a) && mb.fa !== 0, free(mb.b) && mb.fb !== 0] : big && mb.r === 'stem' && n > 1 ? [true, false] : [false, false] }) };
  });
  return { D, b, W, g, hair, members };
}

// flames: short strokes pulled from a member's edge, curving back along it, to a point
function flames(M, [t0, t1, side], H, r) {
  const out = [], { c, S, T, N, hw, W } = M, L = S.at(-1), n = Math.max(2, Math.round((t1 - t0) * L / (W * 1.9)));
  for (let k = 0; k < n; k++) {
    const s = L * (t0 + (t1 - t0) * (k + .5) / n), i = S.findIndex(v => v >= s); if (i < 0) continue;
    const base = add(c[i], N[i], side * (hw[i] - W * .4)), h0 = Math.atan2(N[i][1] * side, N[i][0] * side) - side * .5;
    const len = H * (.075 + .03 * Math.sin(Math.PI * (k + .5) / n)) * (.9 + r() * .2), pts = tendril(base, h0, len, -side * 3.2 / len, .5);
    const Sx = arc(pts); out.push({ pts, wm: Sx.map(v => Math.max(.05, 1 - v / Sx.at(-1)) ** .9), w: W * .85, col: 'k', hair: M.parts[0]?.hair ?? .6 });
  }
  return out;
}
// a fringe: a comb of hairs off a member's edge, longest in the middle
function fringe(M, [t0, t1, side], H, hw) {
  const out = [], { c, S, N } = M, L = S.at(-1), step = Math.max(2.2, H * .016), n = Math.floor((t1 - t0) * L / step);
  for (let k = 0; k < n; k++) { const s = L * t0 + k * step, i = S.findIndex(v => v >= s); if (i < 0) continue;
    const a = add(c[i], N[i], side * (M.hw[i] + M.g * .6)), len = H * .05 * (.35 + .65 * Math.sin(Math.PI * (k + .5) / n));
    out.push(stroke([a, add(a, N[i], side * len)], hw, 'k', .4)); }
  return out;
}
// small crosses of four points hung off a member's edge, red
function crosses(M, [t0, t1, side], H) {
  const out = [], { c, S, N } = M, L = S.at(-1), step = H * .11, n = Math.max(1, Math.floor((t1 - t0) * L / step)), s0 = Math.max(1.1, H * .011);
  for (let k = 0; k < n; k++) { const s = L * (t0 + (t1 - t0) * (k + .5) / n), i = S.findIndex(v => v >= s); if (i < 0) continue;
    const p = add(c[i], N[i], side * (M.hw[i] + H * .045)), d = s0 * 1.25;
    out.push(lozenge(add(p, N[i], -side * d), s0, 'r'), lozenge(add(p, N[i], side * d), s0, 'r'), lozenge(add(p, M.T[i], -d), s0, 'r'), lozenge(add(p, M.T[i], d), s0, 'r')); }
  return out;
}

// ---- keeping clear of the words -------------------------------------------------------------------------------------------
const hits = (pts, keep, edge, bottom, pad = 2) => pts.some(([x, y]) => x < edge || y > bottom || keep.some(k => x > k[0] - pad && x < k[2] + pad && y > k[1] - pad && y < k[3] + pad));

// ---- the initial ---------------------------------------------------------------------------------------------------------------
// initial({ ch, G: { box: [x0, top, x1, base] }, keep: word rects to stay clear of, big, level 0..4, seed, room: margin
// px to the left of the box, bottom }) -> { letter: null, marks, width }: the letter written as marks (black, then red,
// then what binds over the red), and the width to float.
function cadel({ ch = 'B', G, keep = [], big = true, level = 2, seed = 1, room = 100, bottom = 1e9, loops: nLoops }) {
  ch = String(ch).normalize('NFD')[0].toUpperCase(); const [x0, y0, , y1] = G.box, H = y1 - y0, near = H * 3; keep = keep.filter(k => k[2] > x0 - room - near && k[0] < x0 + near && k[3] > y0 - near && k[1] < y1 + near);
  const X = ([x, y]) => [x0 + x * H, y0 + y * H], edge = x0 - room;
  if (!(ch in CAPS)) return { letter: ch, marks: [], width: .8 * H };   // not a Latin letter: the host's own glyph stands
  const { D, b, W, g, members } = capital(ch, X, H, level, big), r = rng(seed, 'cadel');
  const hw = Math.max(.8, H * .0065), over = [], extra = [];
  // the cloud: the pen runs on from the points of the strokes on its thin edge. From the points farthest out, a few
  // great loops bulging away from the letter, as large as there is room for; from others, small curls
  const loops = [], centre = X([D.w / 2, .5]);
  if (big) {
    const tips = members.flatMap(M => M.parts.filter(p => p.col === 'k' && p.wm && p.pts.length > 6).flatMap(p => {
      const P = p.pts, a = unit([P[0][0] - P[4][0], P[0][1] - P[4][1]]), z = unit([P.at(-1)[0] - P.at(-5)[0], P.at(-1)[1] - P.at(-5)[1]]);
      return [p.wm[0] < .3 && { p: P[0], t: a }, p.wm.at(-1) < .3 && { p: P.at(-1), t: z }].filter(Boolean); }))
      .map(e => ({ ...e, d: Math.hypot(e.p[0] - centre[0], e.p[1] - centre[1]) })).sort((a, b) => b.d - a.d);
    const used = [], free = (p, d) => used.every(u => Math.hypot(u[0] - p[0], u[1] - p[1]) > d);
    const nBig = nLoops ?? b.loops, nCurl = nLoops === 0 ? 0 : b.curls;
    // each loop the largest that fits, turned a little either way to find room, bulging out (into the margin first)
    // where the margin is wide, the first sweeps from the left of the letter go out into it, as large as it allows
    // (Neudörffer's run to two or three times the letter); the rest stay close and come back toward it
    const wide = x0 - edge > H * .7; let k0 = 0, nWide = 0;
    for (const e of tips) { if (loops.length >= nBig) break; if (!free(e.p, H * .16)) continue; k0++;
      const out = wide && nWide < 2 && e.p[0] < x0 + H * .35, v = [.8 + r() * .4, out ? r() * .3 : r(), r()];
      const R0 = out ? Math.min((x0 - edge) * .32, H * .4) * (.85 + r() * .15) : H * (.15 + r() * .12) * (loops.length < 2 ? 1.5 : 1);
      let best = null;
      const heads = out ? [Math.PI, Math.PI * .8, -Math.PI * .8, Math.PI * .6, -Math.PI * .6].map(a => a - Math.atan2(e.t[1], e.t[0])) : [0, .45, -.45, .9, -.9];
      for (const dh of heads) for (const s of [1, -1]) {
        const h = Math.atan2(e.t[1], e.t[0]) + dh;
        for (let f = 1; f > .45; f *= .85) { const c = loopOf(e.p, h, R0 * f, s, v, rng(seed + k0, 'sweep')); if (hits(c, keep, edge, bottom)) continue;
          const m = c[Math.floor(c.length * .3)], inside = c.filter(([x, y]) => x > x0 + H * .05 && x < x0 + D.w * H - H * .05 && y > y0 + H * .05 && y < y1 - H * .05).length / c.length;
          const z = c.at(-1), score = out ? f * 2 + (x0 - Math.min(...c.map(q => q[0]))) / H - inside * 4
            : f * 2 + Math.min(.8, Math.hypot(m[0] - centre[0], m[1] - centre[1]) / H) - Math.abs(Math.hypot(z[0] - centre[0], z[1] - centre[1]) / H - .6) - Math.abs(dh) * .4 - inside * 4;
          if (!best || score > best.score) best = { c, score }; break; } }
      if (best) { if (loops.length >= 4) delete best.c.eye; loops.push(best.c); used.push(e.p); if (out) nWide++; }
    }
    // a hairline written along the outside of the longest curves, a little off them, which leaves at the end and sweeps out
    const nSh = level >= 3 ? 2 : level >= 2 ? 1 : 0;
    members.filter(M => !M.mb.r && M.n > 1).sort((a, b) => b.S.at(-1) - a.S.at(-1)).slice(0, nSh).forEach(M => {
      const { K } = frameOf(M.c, 3), side = K.reduce((a, v) => a + v, 0) > 0 ? -1 : 1, i0 = Math.floor(M.c.length * .25), i1 = Math.floor(M.c.length * .97), sh = [];
      for (let i = i0; i < i1; i++) sh.push(add(M.c[i], M.N[i], side * (M.hw[i] + M.g * 2.2 + hw)));
      const q = sh.at(-1), d = unit([q[0] - sh.at(-4)[0], q[1] - sh.at(-4)[1]]), tail = loopOf(q, Math.atan2(d[1], d[0]), H * .18, -side, [1, r() * .5, r()], r);
      const c = [...sh, ...tail.slice(1)]; c.eye = tail.eye;
      if (!hits(c, keep, edge, bottom)) loops.push(c); });
    let nc = 0;
    for (const e of tips) { if (nc >= nCurl) break; if (!free(e.p, H * .12)) continue;
      const h = Math.atan2(e.t[1], e.t[0]), rr = H * (.04 + r() * .02), s = r() < .5 ? 1 : -1, c = curlOf(e.p, h, rr, s);
      if (!hits(c, keep, edge, bottom)) { loops.push(c); used.push(e.p); nc++; } }
  }
  const strands = [...members, ...loops.map(c => ({ ...hairline(c, hw * 1.6), alt: 'own', z: -1 }))];
  if (big && b.orn) for (const M of members) {
    if (M.mb.fl) extra.push(...flames(M, M.mb.fl, H, r));
    if (M.mb.fr && level >= 3) extra.push(...fringe(M, M.mb.fr, H, hw * .9));
    if (M.mb.x) { const cr = crosses(M, M.mb.x, H); for (let k = 0; k < cr.length; k += 4) if (!cr.slice(k, k + 4).some(m => hits(m.pts, keep, edge, bottom))) over.push(...cr.slice(k, k + 4)); }
  }
  const marks = interlace(strands, big ? Math.max(1.2, g * 1.1) : 1).map(m => m.wm ? { ...m, press: pressOf(m.pts, m.wm) } : m);
  const black = [...extra.map(m => ({ ...m, press: pressOf(m.pts, m.wm) })), ...marks.filter(m => m.col === 'k')], red = marks.filter(m => m.col === 'r');
  if (big && b.girdle) for (const M of members) if (M.mb.girdle) {   // three bars bound across the stem over its red; the nib turned for them (the one place it leaves 35°)
    const i = M.S.findIndex(s => s >= M.S.at(-1) * M.mb.girdle), t = M.T[i], nrm = M.N[i], half = M.hw[i] - W * .1, ang = Math.atan2(t[1], -t[0]) % Math.PI;
    // each bar a little bowed, as a band wound round a rod is, and drawn thin at its ends
    for (let k = -1; k <= 1; k++) { const p = add(M.c[i], t, k * W * .8), pts = [], wm = [];
      for (let u = -1; u <= 1.001; u += .1) { pts.push(add(add(p, nrm, u * half), t, W * .35 * (1 - u * u))); wm.push(Math.max(.15, 1 - u ** 6)); }
      over.push({ ...stroke(pts, W * .42, 'k', .45), angle: ang, press: pressOf(pts, wm) }); } }
  if (big) loops.forEach((c, k) => { if (c.eye) over.push(lozenge(c.eye, hw * 2.8, k % 3 === 1 ? 'r' : 'k')); });   // a point in each hook's eye
  if (!big) red.push(stroke([X([.40, .30]), X([.38, .78])], W * .7, 'r', .4));   // in the line: the capital touched with red
  return { letter: null, marks: [...black, ...red, ...over], width: D.w * H };
}
cadel.width = ch => CAPS[String(ch).normalize('NFD')[0].toUpperCase()]?.w ?? .8;

// ---- the initial from a typeface (the default) ---------------------------------------------------------------------------
// The letter is a real blackletter capital, set from a well-drawn face; procedure does only what a rubricator did to a
// letter already written: its heavy strokes split, each into two pen strokes with red laid between (as thick as the
// nib lays across the edge they follow), three bars bound across its heaviest straight stroke, a red point in its
// counters, the staff (a hairline out into the margin and down it, ending in a curl with a red point), and on a richer
// page loops thrown from the points of its strokes and a cross of red points. The glyph's coverage is made to read as
// written (its edge moved in and out slowly, kit/penwork.js drawn()) and is laid by the ink engine (inkLetter: the
// medium's own deposit, flow and paper), so its edge carries the ink's feathering and its rim the ink's pooling, as
// the strokes round it do.
//
// The faces (playground/fonts, SIL OFL 1.1, from google/fonts). Maguntia is the default (the user's choice over Cook);
// Cook and Grenze Gotisch stay as candidates in tests/faces.html (fonts/cand). Maguntia's A is the historic Fraktur A,
// which a modern reader can take for a U; the font has no alternate for it (its only features are liga, rlig, hlig).
// Rejected: Texturina (roman capitals), Pirata One, New Rocker, Fruktur, Germania One (display letters, not written
// ones); Offenbacher Schwabacher CAT (its OpenType code is not under a free licence, per its author) and Strassburg
// Fraktur (no correct licence file; its flourished capitals are too small in the body at drop size).
export const FACES = {
  maguntia: { family: 'UnifrakturMaguntia', file: 'UnifrakturMaguntia-Book.woff2', weight: 400, name: 'UnifrakturMaguntia (after Mainzer Fraktur)' },
  cook: { family: 'UnifrakturCook', file: 'cand/UnifrakturCook-Bold.woff2', weight: 700, name: 'UnifrakturCook (after Koch Fette Deutsche Schrift)' },
  grenze: { family: 'Grenze Gotisch', file: 'cand/GrenzeGotisch.woff2', weight: 800, name: 'Grenze Gotisch 800' },
};
export const FACE = 'maguntia', FORM = 'face';
const fontDir = new URL('../../fonts/', import.meta.url);
// the face must be loaded before an initial is measured or made (nothing in the host's DOM need use it)
export async function loadFace(name = FACE) {
  const F = FACES[name] ?? FACES[FACE]; if (F.ready) return F;
  const ff = new FontFace(F.family, `url(${new URL(F.file, fontDir)})`, { weight: String(F.weight) }), loading = ff.load();
  warmInk();   // the letter's ink medium is made (its shaders compiled) while the font is on its way
  await loading; document.fonts.add(ff); F.ready = true; return F;
}
const faceOf = name => FACES[name] ?? FACES[FACE];
// the glyph's ink box at 100 px: left and right of the pen position, above and below the baseline
const inkOf = (ch, F) => { const m0 = F.m ??= {}; if (m0[ch]) return m0[ch];
  const c = new OffscreenCanvas(8, 8).getContext('2d'); c.font = `${F.weight} 100px "${F.family}"`; const m = c.measureText(ch);
  const r = { l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent };
  if (F.ready) m0[ch] = r; return r; };
// what the host floats, in cap heights: the glyph's ink, ink top on the cap line and the baseline on the baseline
const faceWidth = (ch, face) => { const m = inkOf(ch, faceOf(face)); return m.a > 0 ? (m.l + m.r) / m.a : .8; };

// the glyph as coverage at res cells per px; its ink top on y = base - H, its ink's left edge on x0
function glyphMask(ch, F, H, x0, base, res = 2) {
  const m = inkOf(ch, F), s = H / m.a, pad = 3, gx = Math.floor(x0 - pad), gy = Math.floor(base - H - pad);
  const w = Math.ceil(x0 + (m.l + m.r) * s + pad - gx) * res, h = Math.ceil(base + m.d * s + pad - gy) * res;
  const c = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
  c.setTransform(res, 0, 0, res, -gx * res, -gy * res); c.font = `${F.weight} ${100 * s}px "${F.family}"`; c.fillStyle = '#000'; c.fillText(ch, x0 + m.l * s, base);
  const d = c.getImageData(0, 0, w, h).data, M = new Float32Array(w * h); for (let i = 0; i < w * h; i++) M[i] = d[i * 4 + 3] / 255;
  return { M, w, h, x0: gx, y0: gy, res, ink: [x0, base - H, x0 + (m.l + m.r) * s, base + m.d * s] };
}
const sm = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

// The glyph made to read as written, and read, in one pass (kit/penwork.js drawn() and its reading, fused). Its edge is
// moved in and out slowly (amp px at a 25 px wavelength, .18 px at 5 px), so the strokes swell and thin as a pen's
// would; only the cells within reach of the moved edge are recomputed, the rest are ink or paper as they were. Read off
// the same distances: Di, how deep each cell lies inside the ink (px), Do, how far each cell of paper lies from it (px),
// both measured to the moved edge; hw, the half-width of the heaviest strokes (the 97th percentile of the depth, so a
// junction's swelling does not count).
function written(raw, seed, amp) {
  const { M, w, h, x0, y0, res } = raw, n = w * h, ink = new Uint8Array(n), paper = new Uint8Array(n);
  for (let i = 0; i < n; i++) { const k = M[i] > .5; ink[i] = k; paper[i] = !k; }
  const Do = dist(ink, w, h), Di = dist(paper, w, h), slow = noise2(seed ^ 0x5d), fine = noise2(seed ^ 0x19), out = new Float32Array(n);
  // the slow swell on a coarse lattice (it changes over 25 px), read between its points
  const G = 4, gw = Math.ceil(w / G) + 2, gh = Math.ceil(h / G) + 2, S = new Float32Array(gw * gh);
  for (let b = 0; b < gh; b++) for (let a = 0; a < gw; a++) S[b * gw + a] = amp * (2 * slow((x0 + a * G / res) / 25, (y0 + b * G / res) / 25) - 1);
  const band = amp + .18 + 1.5 / res, hist = new Uint32Array(1024); let nh = 0;
  for (let j = 0; j < h; j++) { const b = j / G | 0, fb = j / G - b;
    for (let i = 0; i < w; i++) { const q = j * w + i, sd = (Do[q] - Di[q]) / res, a = i / G | 0, fa = i / G - a, g = b * gw + a;
      let e = (S[g] * (1 - fa) + S[g + 1] * fa) * (1 - fb) + (S[g + gw] * (1 - fa) + S[g + gw + 1] * fa) * fb;
      if (sd > -band && sd < band) { e += .18 * (2 * fine((x0 + i / res) / 5, (y0 + j / res) / 5) - 1); out[q] = Math.max(0, Math.min(1, .5 + (e - sd) * res * .5)); }
      else out[q] = sd < 0 ? 1 : 0;
      const s2 = sd - e; Di[q] = s2 < 0 ? -s2 : 0; Do[q] = s2 > 0 ? s2 : 0;
      if (s2 < -1 && q % 3 === 0) { hist[Math.min(1023, -s2 * 20 | 0)]++; nh++; } } }
  let hw = 1; for (let k = 0, c = 0; k < 1024; k++) { c += hist[k]; if (c >= nh * .97) { hw = (k + .5) / 20; break; } }
  return { L: { M: out, w, h, x0, y0, res, ink: raw.ink }, A: { Di, Do, hw } };
}
// The heaviest straight stroke (where the bars bind): of the cells near the deepest, the one whose neighbourhood of deep
// cells is most nearly a line (its principal axis), a little below the middle of the letter preferred. { p, t, d }
function spine(L, A, H, ink) {
  const { w, h, res } = L, { Di, hw } = A, R = Math.round(hw * 2.6 * res), st = Math.max(1, Math.round(R / 10)); let best = null;   // ~300 samples a neighbourhood
  for (let j = 0; j < h; j += Math.max(2, st)) for (let i = 0; i < w; i += Math.max(2, st)) { const d = Di[j * w + i]; if (d < hw * .82) continue;
    let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    for (let y = Math.max(0, j - R); y < Math.min(h, j + R); y += st) for (let x = Math.max(0, i - R); x < Math.min(w, i + R); x += st)
      if (Di[y * w + x] > hw * .55 && (x - i) ** 2 + (y - j) ** 2 < R * R) { n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; }
    if (n < 4) continue; const mx = sx / n, my = sy / n, a = sxx / n - mx * mx, c = syy / n - my * my, b = sxy / n - mx * my, tr = (a + c) / 2, q = Math.sqrt(((a - c) / 2) ** 2 + b * b);
    const l1 = tr + q, l2 = Math.max(1e-6, tr - q), th = .5 * Math.atan2(2 * b, a - c), py = L.y0 + j / res, f = (py - ink[1]) / H;
    const score = Math.min(8, l1 / l2) + 5 * Math.abs(Math.sin(th)) - 6 * Math.abs(f - .62);
    if (!best || score > best.score) best = { score, p: [L.x0 + (i + .5) / res, py], t: [Math.cos(th), Math.sin(th)], d }; }
  if (best && best.t[1] < 0) best.t = [-best.t[0], -best.t[1]];
  return best;
}
// cells of a mask changed by f(x, y, i) -> the new value (page px), inside box
function each(L, box, f) { const { w, h, res } = L, [i0, j0, i1, j1] = [(box[0] - L.x0) * res, (box[1] - L.y0) * res, (box[2] - L.x0) * res, (box[3] - L.y0) * res].map(Math.round);
  for (let j = Math.max(0, j0); j < Math.min(h, j1); j++) for (let i = Math.max(0, i0); i < Math.min(w, i1); i++) f(L.x0 + (i + .5) / res, L.y0 + (j + .5) / res, j * w + i); }

// the counters: paper the letter closes round on all four sides, the widest first, each its centre and its room (px)
function countersOf(L, A, ink, H, n) {
  const { M, w, h, res } = L, out = [], st = Math.max(1, Math.round(res * H * .012));
  const [ix0, iy0, ix1, iy1] = [(ink[0] - L.x0) * res, (ink[1] - L.y0) * res, (ink[2] - L.x0) * res, (ink[3] - L.y0) * res].map(Math.round);
  // ink seen on each side of a cell, along its row and its column (bits: left, right, above, below)
  const seen = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) { let a = 0, b = 0; for (let i = 0, e = w - 1; i < w; i++, e--) { const q = j * w + i, p = j * w + e;
    seen[q] |= a; seen[p] |= b; if (M[q] > .4) a = 1; if (M[p] > .4) b = 2; } }
  for (let i = 0; i < w; i++) { let a = 0, b = 0; for (let j = 0, e = h - 1; j < h; j++, e--) { const q = j * w + i, p = e * w + i;
    seen[q] |= a; seen[p] |= b; if (M[q] > .4) a = 4; if (M[p] > .4) b = 8; } }
  for (let j = iy0 + st; j < iy1 - st; j += st) for (let i = ix0 + st; i < ix1 - st; i += st) { const q = j * w + i, d = A.Do[q];
    if (d >= H * .045 && seen[q] === 15) out.push({ p: [L.x0 + (i + .5) / res, L.y0 + (j + .5) / res], d }); }
  out.sort((a, b) => b.d - a.d); const pick = [];
  for (const c of out) { if (pick.length >= n) break; if (pick.every(q => Math.hypot(q.p[0] - c.p[0], q.p[1] - c.p[1]) > H * .25)) pick.push(c); }
  return pick;
}
const cross4 = (p, s) => { const d = s * 1.25; return [[0, -d], [0, d], [-d, 0], [d, 0]].map(([dx, dy]) => lozenge([p[0] + dx, p[1] + dy], s, 'r')); };

// the points of the strokes: places on the letter's edge with little ink round them (a stroke ending in a point or a
// hairline), the most pointed first, each with the way it points (from the ink's centre there through it)
function tipsOf(L, A, H) {
  const { M, w, h, res } = L, R = Math.max(2, Math.round(A.hw * 1.6 * res)), st = Math.max(1, Math.round(res * .75)), out = [];
  for (let j = R; j < h - R; j += st) for (let i = R; i < w - R; i += st) { const q = j * w + i; if (M[q] <= .5 || A.Di[q] > .6) continue;
    let n = 0, sx = 0, sy = 0, all = 0; for (let y = -R; y <= R; y += st) for (let x = -R; x <= R; x += st) { if (x * x + y * y > R * R) continue; all++; if (M[q + y * w + x] > .5) { n++; sx += x; sy += y; } }
    const f = n / all; if (f > .26) continue; const t = unit([-sx / n, -sy / n]); out.push({ p: [L.x0 + (i + .5) / res, L.y0 + (j + .5) / res], t, f }); }
  out.sort((a, b) => a.f - b.f); const pick = [];
  for (const c of out) if (pick.every(q => Math.hypot(q.p[0] - c.p[0], q.p[1] - c.p[1]) > H * .12)) pick.push(c);
  return pick;
}
// per level: the heavy strokes split with red between their halves, the three bars, red points in the counters, loops
// into the margin, crosses
const FBUDGET = [{ touch: true }, { split: true }, { split: true, bars: true, pts: 1, staff: true }, { split: true, bars: true, pts: 2, staff: true }, { split: true, bars: true, pts: 3, staff: true, cloud: 3, crosses: true }];

function typeInitial({ ch = 'B', G, keep = [], big = true, level = 2, seed = 1, room = 100, bottom = 1e9, face = FACE, res = 2 }) {
  ch = String(ch).normalize('NFD')[0].toUpperCase(); const [x0, y0, , y1] = G.box, H = y1 - y0, edge = x0 - room, F = faceOf(face);
  if (!/[A-Z]/.test(ch)) return { letter: ch, marks: [], width: .8 * H };
  const raw = glyphMask(ch, F, H, x0, y1, Math.max(1, Math.min(2, Math.round(res)))); const { L, A } = written(raw, seed, big ? .45 : .2), width = raw.ink[2] - raw.ink[0];
  const b = big ? FBUDGET[level] : { touch: true }, r = rng(seed, 'face'); const sp = spine(L, A, H, raw.ink), over = [], strands = [];
  keep = keep.filter(k => k[2] > x0 - room - H && k[0] < x0 + width + H && k[3] > y0 - H && k[1] < y1 + H * 2);
  // the rubricator's touch: one red stroke down the heaviest stroke
  if (sp) {   // the spine's point moved onto the stroke's middle (the deepest cell across it)
    const n = [-sp.t[1], sp.t[0]], depth = ([x, y]) => { const i = Math.round((x - L.x0) * L.res), j = Math.round((y - L.y0) * L.res); return i >= 0 && j >= 0 && i < L.w && j < L.h ? A.Di[j * L.w + i] : 0; };
    let bp = sp.p, bd = depth(bp); for (let v = -A.hw * 1.6; v <= A.hw * 1.6; v += .25) { const q = [sp.p[0] + n[0] * v, sp.p[1] + n[1] * v], d = depth(q); if (d > bd) { bd = d; bp = q; } }
    sp.p = bp; }
  if (b.touch && sp) { const s = H * (big ? .28 : .3); over.push(stroke([[sp.p[0] - sp.t[0] * s, sp.p[1] - sp.t[1] * s], [sp.p[0] + sp.t[0] * s, sp.p[1] + sp.t[1] * s]], Math.max(1, sp.d * .45), 'r', .45)); }
  if (!big) {   // in the line: the touch down the column with the most ink through the letter's middle
    const { M, w, h, res } = L, j0 = Math.round((y0 + H * .25 - L.y0) * res), j1 = Math.round((y1 - H * .2 - L.y0) * res); let bi = 0, bn = -1;
    for (let i = 0; i < w; i++) { let n = 0; for (let j = Math.max(0, j0); j < Math.min(h, j1); j++) n += M[j * w + i] > .5; if (n > bn) { bn = n; bi = i; } }
    const x = L.x0 + (bi + .5) / res;
    return { letter: { ...L, wet: .03, dry: 0 }, marks: [stroke([[x + H * .02, y0 + H * .22], [x - H * .02, y1 - H * .14]], Math.max(1, H * .08), 'r', .45)], width };   // small: a quicker, drier ink, or it closes the counters
  }
  // the heavy strokes split: every stroke as heavy as the heaviest written as two black strokes with red laid between
  // them (Neudörffer's doubled strokes with colour between, Met 354468; Rossi's channels, 1598). The red is laid first and
  // runs a little under the black (`under` px), which is written over it, so no paper shows between them; the split
  // follows the letter and closes to a point where a stroke thins, the red tapering with it.
 
  if (b.split) {
    // each half is a pen stroke along the letter's edge, so it is as thick as the nib lays across that edge's direction:
    // broad where the edge runs square to the nib, a hair where it runs along it
    // (the direction read from the depth's slope a little in from the edge, and smoothed, so the split runs clean)
    // (on a lattice of half the resolution: the field is smooth over the stroke's width)
    const { w, h, res } = L, Di = A.Di, under = .7, R = new Float32Array(L.M.length), hw2 = Math.ceil(w / 2), hh2 = Math.ceil(h / 2), X = new Float32Array(hw2 * hh2), Wt = new Float32Array(hw2 * hh2);
    for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) { const q = j * w + i, d = Di[q]; if (d <= .5 || d > A.hw * .6) continue;
      const gx = Di[q + 1] - Di[q - 1], gy = Di[q + w] - Di[q - w], gl = Math.hypot(gx, gy); if (gl < .1) continue;
      const c = (j >> 1) * hw2 + (i >> 1); X[c] += Math.abs(E[0] * gx + E[1] * gy) / gl; Wt[c]++; }
    const rb = Math.max(1, Math.round(A.hw * .45 * res)); boxBlur2(X, Wt, hw2, hh2, rb); boxBlur2(X, Wt, hw2, hh2, rb);
    const lo = A.hw * .45;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, d = Di[q]; if (d <= lo) continue;
      const c = (j >> 1) * hw2 + (i >> 1), k = A.hw * (.5 + .34 * (Wt[c] > .01 ? X[c] / Wt[c] : .5));
      L.M[q] *= 1 - sm(k - .4, k + .4, d); R[q] = sm(k - under - .4, k - under + .4, d); }
    L.red = R;
  }
  // three bars bound across the heaviest straight stroke, below its middle; the stroke cut through where they bind it
 
  if (b.bars && sp) {
    const [t, n] = [sp.t, [-sp.t[1], sp.t[0]]], tb = Math.max(1.6, A.hw * .34), p = tb * 2.15, gap = Math.max(1, tb * .6), span = A.hw * 1.35, ov = A.hw * .45, c = sp.p;
    each(L, [c[0] - span * 2, c[1] - span * 2, c[0] + span * 2, c[1] + span * 2], (x, y, i) => { const u = (x - c[0]) * t[0] + (y - c[1]) * t[1], v = (x - c[0]) * n[0] + (y - c[1]) * n[1];
      if (Math.abs(v) > span * 1.4) return; const f = sm(-.4, .4, Math.abs(u) - (p + tb / 2 + gap)); L.M[i] *= f; if (L.red) L.red[i] *= f; });
    const ang = Math.atan2(-t[1], t[0]);
    const hd = hand(), qs = hd?.bars === 2 ? [-.5, .5] : [-1, 0, 1];
    for (const q of qs) { const pts = [], wm = [];
      for (let u = -1; u <= 1.001; u += .1) { const v = u * (A.hw + ov), bow = tb * .7 * (1 - u * u); pts.push([c[0] + n[0] * v + t[0] * (q * p + bow), c[1] + n[1] * v + t[1] * (q * p + bow)]); wm.push(Math.max(.35, 1 - u ** 10)); }
      over.push({ ...stroke(pts, tb, 'k', Math.max(.8, tb * .3)), angle: ang, press: pressOf(pts, wm) }); }
  }
  // the staff: one stroke of the broad nib, out of the letter's side and down the margin past its foot, ending in a
  // single curl toward the words with a red point in its eye (03's staff; the scribe's run of the pen down the margin).
  // It leaves the letter on the nib's thin edge and swells as it turns to run down; a cubic, then a gentle straight
  // fall, then the curl, so it reads as one gesture. On the richest page loops thrown from the points of the strokes.
 
  let staff = null;
  if (b.staff) {
    const { M, w, h, res } = L, Wn = Math.max(2.2, H * .034); let lp = null;
    for (let j = 0; j < h; j += 2) for (let i = 0; i < w; i += 2) if (M[j * w + i] > .5) { const x = L.x0 + i / res, y = L.y0 + j / res, sc = -x - Math.max(0, y - y0 - H * .5) * 3; if (!lp || sc > lp.sc) lp = { sc, p: [x, y] }; }
    const bez = (p0, p1, p2, p3) => Array.from({ length: 81 }, (_, k) => { const t = k / 80, u = 1 - t; return [0, 1].map(c => u * u * u * p0[c] + 3 * u * u * t * p1[c] + 3 * u * t * t * p2[c] + t * t * t * p3[c]); });
    for (let a = Math.min(x0 - edge - 8, H * .26); lp && a > H * .09; a *= .85) {
      const hd = hand(), p0 = [lp.p[0] + Wn * .3, lp.p[1]], xs = x0 - a, cr = H * (.068 + .014 * r()), fall = H * (hd ? hd.fall + .08 * r() : .55 + .15 * r());
      const top = bez(p0, [p0[0] - a * .35, p0[1] + H * .05], [xs, p0[1] + H * .2], [xs, Math.max(p0[1] + H * .45, y1 - H * .1)]), q = top.at(-1);
      const end = [xs + a * .04, y1 + fall], down = resample([q, end], .6), dir = Math.atan2(end[1] - q[1], end[0] - q[0]);
      const curl = flourish(end, dir, [[cr * .5, 0, -1 / cr], [cr * Math.PI * 1.35, -1 / cr, -1 / (cr * .62)]], .5);
      const c = resample([...top, ...down.slice(1), ...curl.slice(1)], .6);
      if (hits(c, keep, edge, bottom)) continue;
      const S2 = arc(c), Lc = S2.at(-1), lc = arc(curl).at(-1);
      const wm = S2.map(v => Math.max(.3, Math.min(1, .35 + .65 * v / (H * .12), .3 + .7 * Math.max(0, Lc - v) / (lc * .9))));
      over.push({ ...stroke(c, Wn, 'k', Math.max(.9, Wn * .28)), press: pressOf(c, wm) });
      const tail = curl.slice(Math.round(curl.length * .4)), eye = tail.reduce((m, v) => [m[0] + v[0] / tail.length, m[1] + v[1] / tail.length], [0, 0]);
      // (the hand may bind the staff where it falls, a red knop on it, as the Constance breviary's staves are bound)
      if (hd?.knop) { const m = [(q[0] + end[0]) / 2, (q[1] + end[1]) / 2]; over.push(lozenge(m, Math.max(2, Wn * 1.25), 'r')); }
      over.push(...(hd?.eye === 'cross' ? cross4(eye, Math.max(1.1, cr * .2)) : [lozenge(eye, Math.max(1.6, cr * .34), 'r')]));
      staff = { a, dn: fall };
      break;
    }
  }
 
  if (b.cloud) { const used = [], cx = (raw.ink[0] + raw.ink[2]) / 2, cy = (raw.ink[1] + raw.ink[3]) / 2;
    for (const e of tipsOf(L, A, H)) { if (used.length >= b.cloud) break; if (e.p[0] > cx + width * .15 && e.p[1] > y0 + H * .2) continue;   // not out over the words
      if (used.some(u => Math.hypot(u[0] - e.p[0], u[1] - e.p[1]) < H * .3)) continue; let got = null;
      for (const dh of [0, -.4, .4, -.8, .8]) { for (const s of [1, -1]) { for (let f = 1; f > .65 && !got; f *= .88) {
        const lp = loopOf(e.p, Math.atan2(e.t[1], e.t[0]) + dh, H * (.15 + .06 * r()) * f, s, [.85 + r() * .3, r() * .5, r()], rng(seed + used.length, 'cloud'));
        const m = lp[Math.floor(lp.length * .35)]; if ((m[0] - cx) * e.t[0] + (m[1] - cy) * e.t[1] < 0) continue;   // it bulges outward
        const onInk = lp.filter(([x, y]) => { const i = Math.round((x - L.x0) * L.res), j = Math.round((y - L.y0) * L.res); return i >= 0 && j >= 0 && i < L.w && j < L.h && L.M[j * L.w + i] > .3; }).length / lp.length;
        if (onInk < .2 && !hits(lp, keep, edge, bottom)) got = lp; } if (got) break; } if (got) break; }
      if (got) { used.push(e.p); { const hl = hairline(got, Math.max(1.6, H * .018)); hl.parts.forEach(p => p.hair = .9); strands.push({ ...hl, alt: 'own', z: -2 }); } if (got.eye) over.push(lozenge(got.eye, Math.max(1.4, H * .014), used.length % 2 ? 'r' : 'k')); } } }
  // a cross of four red points hung between the staff and the words, below the letter
  if (b.crosses && staff) { const p = [x0 - staff.a * .42, y1 + staff.dn * .38], s = Math.max(1.3, H * .017), cr = cross4(p, s); if (!cr.some(m => hits(m.pts, keep, edge, bottom))) over.push(...cr); }
  // a red point in each counter the letter closes (a cross of four in the widest, on the richest page)
 
  for (const [k, c] of countersOf(L, A, raw.ink, H, b.pts ?? 0).entries()) over.push(...(b.crosses && k === 0 ? cross4(c.p, Math.min(c.d * .3, H * .016)) : [lozenge(c.p, Math.min(c.d * .7, H * .042), hand()?.counters === 'k' ? 'k' : 'r')]));
 
  const marks = strands.length ? interlace(strands, Math.max(1, H * .008)).map(m => m.wm ? { ...m, press: pressOf(m.pts, m.wm) } : m) : [];
  return { letter: L, marks: [...marks, ...over], width };
}

function boxBlur2(A, B, w, h, r) {
  const k = 2 * r + 1, ta = new Float32Array(Math.max(w, h)), tb = new Float32Array(Math.max(w, h));
  for (let y = 0; y < h; y++) { const o = y * w; let sa = 0, sb = 0; for (let x = -r; x <= r; x++) { const c = o + Math.min(w - 1, Math.max(0, x)); sa += A[c]; sb += B[c]; }
    for (let x = 0; x < w; x++) { ta[x] = sa / k; tb[x] = sb / k; const p = o + Math.min(w - 1, x + r + 1), m = o + Math.max(0, x - r); sa += A[p] - A[m]; sb += B[p] - B[m]; }
    for (let x = 0; x < w; x++) { A[o + x] = ta[x]; B[o + x] = tb[x]; } }
  for (let x = 0; x < w; x++) { let sa = 0, sb = 0; for (let y = -r; y <= r; y++) { const c = Math.min(h - 1, Math.max(0, y)) * w + x; sa += A[c]; sb += B[c]; }
    for (let y = 0; y < h; y++) { ta[y] = sa / k; tb[y] = sb / k; const p = Math.min(h - 1, y + r + 1) * w + x, m = Math.max(0, y - r) * w + x; sa += A[p] - A[m]; sb += B[p] - B[m]; }
    for (let y = 0; y < h; y++) { A[y * w + x] = ta[y]; B[y * w + x] = tb[y]; } }
}

// the initial: the typeface's capital with the rubricator's ornament (form 'face', the default), or the procedural cadel
// of strapwork bundles (form 'cadel'). Its depth is the host's; the ornament scale (kit/illum.js) weights its pen: the
// rubricator's strokes heavier or lighter round a letter of the same size
function initial(o) { const m = (o.form ?? FORM) === 'cadel' ? cadel(o) : typeInitial(o), k = o.scale ?? 1;
  return k === 1 || !m.marks ? m : { ...m, marks: m.marks.flat(3).map(s => ({ ...s, w: s.w * k })) }; }
initial.wider = [0, 0, 0, 2, 4];
initial.width = (ch, face = FACE, form = FORM) => { if (face && typeof face === 'object') ({ face = FACE, form = FORM } = face);   // (ch, { face, form }) as kit/illum.js asks
  return form === 'cadel' ? cadel.width(ch) : faceWidth(String(ch).normalize('NFD')[0].toUpperCase(), face); };
// what the host awaits before it measures or makes an initial (kit/illum.js: the style's `initial` options)
initial.load = ({ face, form = FORM } = {}) => form === 'cadel' ? null : loadFace(face);


// ---- the rubricator's hand --------------------------------------------------------------------------------------------------
// A page given its own seed (kit/illum.js sets blackletter.seeded) is one rubricator's hand, chosen from it once for the
// whole page: how many stems his paraph has and whether he crowns it with a point; the point he ends a ruled line with
// (three points, one, or a red and a black); the order of his strung lozenges; how tight he runs a cord; what he sets in
// the middle of a chapter's rules (the knot, a cross of four points, a short plait) and at their ends; how many crossings
// his book band takes; two or three bars on the initial, and the colour of the points in its counters. Without one (0)
// the page is drawn as it always was.
const hands = new Map();
function hand() { const V = blackletter.seeded; if (!V) return null; if (hands.has(V)) return hands.get(V);
  const r = rng(V, 'hand'), pick = a => a[(r() * a.length) | 0];
  const h = { stems: pick([2, 2, 3]), crown: r() < .4, end: pick(['lozenge', 'triad', 'pair']), loz: pick([['k', 'r'], ['r', 'k'], ['k', 'k', 'r']]),
    pitch: pick([.85, 1.05, 1.3]), centre: pick(['knot', 'cross', 'plait']), flank: pick(['triad', 'lozenge', 'cross']), crossings: pick([4, 6, 8]),
    bars: pick([2, 3, 3]), eye: pick(['r', 'cross']), counters: pick(['r', 'k']), quote: pick(['knot', 'cross']),
    fall: pick([.42, .6, .78]), knop: r() < .5 };
  hands.set(V, h); return h; }
// the ornament set at the end of a rule, as the hand makes it (p: where; s: the size of a point; d: which way the rule runs)
const point = (p, s, d, kind) => kind === 'lozenge' ? [lozenge(p, s * 1.35, 'r')] : kind === 'cross' ? cross4(p, s * .62)
  : kind === 'pair' ? [lozenge([p[0] - d * s * .9, p[1]], s * 1.1, 'k'), lozenge([p[0] + d * s * .5, p[1]], s * 1.35, 'r')] : triad(p, s, 'r');

// ---- the rubricator's small marks ----------------------------------------------------------------------------------------------
// A stem as textura writes it: in on the nib's diagonal, straight down, out on the diagonal (the lozenge head and foot)
const stem = (x, y0, y1, W) => [add([x, y0], Q, -W * .35), [x, y0], [x, y1], add([x, y1], Q, W * .45)];
// a ruled line: straight, its weight set for the direction it runs (the nib lays .57 of itself across a horizontal, .82
// across a vertical), the ink pooling a little where the pen sets down and lifts
const rule = (a, b, t, col = 'r') => { const h = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]); return stroke([a, b], t / (h ? Math.sin(ANGLE) : Math.cos(ANGLE)), col, Math.min(.6, t * .5)); };

// the paraph: the red capitulum of the German books, a C broken into three strokes of the broad nib and filled, and two
// stems through its back, the first longer, with a hairline across their heads; at a richer price a hairline tail
function paraph(x, base, u, seed, rich = .5) {
  const r = rng(seed, 'paraph'), j = () => (r() - .5) * u * .06, W = u * .42, top = base - u * 1.5, out = [];
  out.push(stroke(curve([[x + u * 1.05 + j(), top + u * .12], [x + u * .35, top + u * .2], [x + u * .08 + j(), top + u * .62], [x + u * .2, top + u * 1.05], [x + u * .9 + j(), top + u * 1.12]], 1, .4), W, 'r', .5));
  out.push(stroke([[x + u * .62, top + u * .32], [x + u * .42, top + u * .62], [x + u * .6, top + u * .9]], W * .9, 'r', .5));
  out.push(stroke(stem(x + u * 1.02 + j(), top, base + u * .3, W * .82), W * .82, 'r', .5));
  out.push(stroke(stem(x + u * 1.42 + j(), top + u * .02, base + u * .12, W * .7), W * .7, 'r', .5));
  const hd = hand();
  if (hd?.stems === 3) out.push(stroke(stem(x + u * 1.78 + j(), top + u * .22, base - u * .1, W * .6), W * .6, 'r', .5));
  out.push(stroke([[x + u * .5, top - u * .04], [x + u * (hd?.stems === 3 ? 1.95 : 1.62), top - u * .08 + j()]], .9, 'r', .5));
  if (hd?.crown) out.push(lozenge([x + u * 1.02, top - u * .62], u * .3, 'k'));
  if (rich >= .75) out.push(stroke(tendril([x + u * 1.3, base + u * .4], Math.PI * .85, u * 1.8, 3.2 / u), u * .14, 'r', .4));
  return out;
}

// the capital touched with red: the rubricator's stroke down through a capital in the text (Fust–Schöffer Bible, 1462)
function touch(x, top, base, u, seed) { const r = rng(seed, 'touch'), j = (r() - .5) * u * .08;
  return [stroke([[x + j, top + u * .1], [x - j, base - u * .05]], Math.max(1.1, u * .2), 'r', .5)]; }

// the cord: a running loop, the pen coming back over itself at every step, so it reads as a chain of rings (the bands
// of the Constance breviary, Met 910582-003); on a richer page a second, black, half a step behind and woven through
function cord(x0, x1, y, amp, n, w, cols = ['r', 'k'], gap = 1) {
  const L = x1 - x0, p = L / n, run = (ph, col) => { const pts = [];
    for (let k = 0; k <= n * 32; k++) { const t = k / 32 * 2 * Math.PI + ph, x = x0 + (k / 32) * p - amp * 1.65 * Math.sin(t); if (x >= x0 - .5 && x <= x1 + .5) pts.push([x, y - amp * Math.cos(t)]); }
    return { ...hairline(resample(pts, .5), w, col), alt: false, z: 1 }; };
  return cols.length > 1 ? interlace([run(0, cols[0]), { ...run(Math.PI, cols[1]), alt: false, z: -1 }], gap) : run(0, cols[0]).parts;   // one strand: painted in one pass, no breaks
}
// a row of lozenges strung on a red hairline, black and red in turn
// (seq: the hand's order of colours, the first the larger; default black and red in turn)
function lozenges(x0, x1, y, h, r, seq = null) {
  const n = Math.max(1, Math.round((x1 - x0) / (h * 1.5))), p = (x1 - x0) / n, out = [rule([x0, y], [x1, y + (r() - .5) * .4], .55)];
  for (let k = 0; k <= n; k++) out.push(seq ? lozenge([x0 + k * p + (r() - .5) * .3, y], h * (seq[k % seq.length] === 'k' ? .5 : .4), seq[k % seq.length])
    : lozenge([x0 + k * p + (r() - .5) * .3, y], h * (k % 2 ? .38 : .5), k % 2 ? 'r' : 'k'));
  return out;
}
const FILLERS = ['rule', 'cord', 'lozenges'];
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  const r = rng(seed, 'filler'), h = yBase - yTop, mid = yTop + h * .55;
  const hd = hand();
  if (kind === 'cord') return cord(x0, x1, mid, h * .36, Math.max(2, Math.round((x1 - x0) / (h * (hd?.pitch ?? 1.05)))), Math.max(1.4, h * .3), rich >= .75 ? ['r', 'k'] : ['r'], .8);
  if (kind === 'lozenges') return lozenges(x0, x1, mid, h, r, hd?.loz);
  if (hd && hd.end !== 'lozenge') { const out = [rule([x0, mid], [x1 - h * 1.1, mid + (r() - .5) * .5], .6), ...point([x1 - h * .55, mid], h * .3, 1, hd.end)];
    if (rich >= .5) out.push(lozenge([x0 + h * .1, mid], h * .32, 'k')); return out; }
  // the rubricator's line run out to the measure, a lozenge where it stops, a black one where it starts on a richer page
  const out = [rule([x0, mid], [x1 - h * .4, mid + (r() - .5) * .5], .6), lozenge([x1 - h * .25, mid], h * .48, 'r')];
  if (rich >= .5) out.push(lozenge([x0 + h * .1, mid], h * .32, 'k'));
  return out;
}

// the knot: a strap (two copies, red between) run once round the three lobes of a trefoil, crossing itself three times,
// over and under in turn (the Dreipass knot of Romanesque and Gothic strapwork); small, a ribbon without red. One lobe
// stands up, two sit down, so it reads as a knot set on the line
function knot(cx, y, R, W, red = true) {
  const c = resample(Array.from({ length: 361 }, (_, k) => { const t = k / 360 * 2 * Math.PI;
    return [cx + (Math.sin(t) + 2 * Math.sin(2 * t)) * R / 3, y + .4 * R / 3 + (Math.cos(t) - 2 * Math.cos(2 * t)) * R / 3 * .92]; }), .5);
  return interlace([strap(c, { n: 2, W, g: W * (red ? .75 : 1.1), red, alt: true })], W * .8);
}
// three lozenges in a triangle: the incunabula's point of ornament
const triad = (p, s, col = 'r') => [lozenge([p[0], p[1] - s * .8], s, col), lozenge([p[0] - s * .85, p[1] + s * .5], s, col), lozenge([p[0] + s * .85, p[1] + s * .5], s, col)];
// the strapwork band: two straps of two copies, red between, braided; each end turns in on itself to a point
function plait(x0, x1, y, amp, n, W) {
  const L = x1 - x0, wave = s => resample(Array.from({ length: 200 }, (_, k) => { const t = k / 199; return [x0 + L * t, y + s * amp * Math.sin(t * n * Math.PI) * Math.min(1, Math.sin(t * Math.PI) * 3)]; }), .6);
  return interlace([strap(wave(1), { n: 2, W, g: W * .55, alt: true, taper: [.06, .06] }), strap(wave(-1), { n: 2, W, g: W * .55, taper: [.06, .06] })], W * .5);
}
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8) {
  const r = rng(seed, 'break'), out = [], hd = hand();
  if (rank < 2) {   // a chapter: the knot, red rules out to each side ending in three points
    const R = u * 1.55, w = Math.min(measure * .14, u * 4.5);
    if (hd?.centre === 'cross') out.push(...cross4([cx, y], u * .42), lozenge([cx, y], u * .34, 'k'));
    else if (hd?.centre === 'plait') out.push(...plait(cx - R * 1.1, cx + R * 1.1, y, u * .55, 2, Math.max(1.4, u * .24)));
    else out.push(...knot(cx, y, R, Math.max(1.3, u * .2), rich >= .25));
    for (const s of [-1, 1]) { const a = cx + s * R * 1.25, b = cx + s * (R * 1.25 + w); out.push(rule([a, y], [b, y + (r() - .5) * .4], .55), ...(hd ? point([b + s * u * .7, y], u * .34, s, hd.flank) : triad([b + s * u * .7, y], u * .34, 'r'))); }
    return out;
  }
  // a book: the strapwork band across a third of the measure, a knot at each end, lozenges beyond
  const half = Math.min(measure * .26, u * 13), W = Math.max(1.6, u * .3);
  out.push(...plait(cx - half, cx + half, y, u * .7, hd?.crossings ?? 6, W));
  for (const s of [-1, 1]) { const e = cx + s * (half + u * 1.9); out.push(...knot(e, y, u * 1.05, Math.max(1.2, u * .17), true), ...(hd ? point([e + s * u * 2.2, y], u * .34, s, hd.flank) : triad([e + s * u * 2.2, y], u * .34, 'r'))); }
  return out;
}

// ---- frames ---------------------------------------------------------------------------------------------------------------------
// After the ruled page: red rules, thick and thin, that cross at the corners and run on past them as the scribe's ruling
// did (CMA 2001.79.b); a cord at the head; a strapwork knot or three red points where a rule ends.
// a box ruled; sides: which of top, right, bottom, left; over: how far the ruling runs on past the corners.
// double: a painted bar, red edged with black hairlines, and inside it a thin red ruling line (CMA 2001.79.b), else one rule
function ruled(B, u, { sides = [1, 1, 1, 1], over = u * 1.1, thick = u * .34, thin = .55, d = u * .55, double = true } = {}) {
  const [x0, y0, x1, y1] = B, out = [], edges = [];
  const H = (y, t, o, col = 'r', a = x0, b = x1) => rule([a - o, y], [b + o, y], t, col), V = (x, t, o, col = 'r', a = y0, b = y1) => rule([x, a - o], [x, b + o], t, col);
  const e = thick / 2 + .35;
  if (!double) { if (sides[0]) out.push(H(y0, thin, over)); if (sides[2]) out.push(H(y1, thin, over)); if (sides[3]) out.push(V(x0, thin, over)); if (sides[1]) out.push(V(x1, thin, over)); return out; }
  if (sides[0]) out.push(H(y0, thick, e)), edges.push(H(y0 - e, .5, e * 2, 'k'), H(y0 + e, .5, -e, 'k')), out.push(H(y0 + d, thin, over));
  if (sides[2]) out.push(H(y1, thick, e)), edges.push(H(y1 + e, .5, e * 2, 'k'), H(y1 - e, .5, -e, 'k')), out.push(H(y1 - d, thin, over));
  if (sides[3]) out.push(V(x0, thick, e)), edges.push(V(x0 - e, .5, e * 2, 'k'), V(x0 + e, .5, -e, 'k')), out.push(V(x0 + d, thin, over));
  if (sides[1]) out.push(V(x1, thick, e)), edges.push(V(x1 + e, .5, e * 2, 'k'), V(x1 - e, .5, -e, 'k')), out.push(V(x1 - d, thin, over));
  return [...out, ...edges];
}
const frames = {
  // a quotation: the double red rule down its gutter, crossed at head and foot by short rules; a knot over it, three points under
  quote: ({ x, lines, u, seed, rich = .5 }) => { const y0 = lines[0].top + u * .2, y1 = lines.at(-1).base + u * .5, out = [];
    out.push(rule([x, y0 - u * 1.2], [x, y1 + u * 1.2], u * .2), rule([x + u * .34, y0 - u * .7], [x + u * .34, y1 + u * .7], .55));
    for (const y of [y0, y1]) out.push(rule([x - u * .9, y], [x + u * 1.3, y], .55));
    const hd = hand();
    if (rich >= .25) out.push(...(hd?.quote === 'cross' ? [...cross4([x + u * .17, y0 - u * 2.1], u * .36), lozenge([x + u * .17, y0 - u * 2.1], u * .3, 'k')] : knot(x + u * .17, y0 - u * 2.1, u * .95, Math.max(1.1, u * .15), rich >= .5)),
      ...(hd ? point([x + u * .17, y1 + u * 2], u * .3, 1, hd.flank) : triad([x + u * .17, y1 + u * 2], u * .3, 'r')));
    return out; },
  // a figure: ruled double on four sides, crossing at the corners; the cord along its head between the rules
  figure: ({ box, u, seed, rich = .5 }) => { const B = [box[0] - u * 1.2, box[1] - u * 2.2, box[2] + u * 1.2, box[3] + u * 1.2], out = ruled(B, u);
    if (rich >= .25) out.push(...cord(B[0] + u * 1.2, B[2] - u * 1.2, B[1] - u * 1.15, u * .38, Math.round((B[2] - B[0]) / (u * 1.1)), Math.max(1.4, u * .3), ['r'], .8));
    return out; },
  // code: the ruled block, single rules crossing at the corners, a black lozenge where they cross
  code: ({ box, u, seed, rich = .5 }) => { const out = ruled(box, u, { double: false, thin: .7, over: u * 1.4 });
    if (rich >= .25) [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]].forEach(([x, y], k) => out.push(lozenge([x, y], u * .5, hand()?.counters === 'r' && k % 2 ? 'r' : 'k')));
    return out; },
  // a pull quote: the chapter knot above and below
  pull: ({ cx, yTop, yBot, measure, u, seed, rich = .5 }) => [...breakMark(cx, yTop + u * .6, measure, 1, seed, rich, u), ...breakMark(cx, yBot + u * .1, measure, 1, seed + 7, rich, u)],
  // an aside: a thin red rule down its side crossed at its head; three red points over it, a black one under
  aside: ({ box, u, seed, rich = .5 }) => { const [x0, y0, , y1] = box, out = [rule([x0, y0 - u * .6], [x0, y1 + u * .2], .7), rule([x0 - u * .8, y0], [x0 + u * 4, y0], .55)];
    if (rich >= .25) out.push(...(hand() ? point([x0, y0 - u * 1.3], u * .3, 1, hand().flank) : triad([x0, y0 - u * 1.3], u * .3, 'r')), lozenge([x0, y1 + u * .7], u * .4, 'k'));
    return out; },
  // the contents: a strap down the margin, red between its copies, a hairline ribbon wound round it over and under; a red
  // lozenge on a short rule at each entry. On a phone, no margin: a cord over the list and under it
  nav: ({ box, entries, x, u, seed, rich = .5, side = true }) => {
    if (!side) { const out = []; for (const y of [box[1] - u * 1.1, box[3] + u * 1.1]) out.push(...cord(box[0], Math.min(box[2], box[0] + u * 22), y, u * .38, Math.round(Math.min(box[2] - box[0], u * 22) / (u * 1.1)), Math.max(1.4, u * .3), ['r'], .8)); return out; }
    const y0 = box[1] - u * 1.2, y1 = box[3] + u * 1.4, W = Math.max(1.6, u * .26), c = resample([[x, y0], [x, y1]], .6);
    const st = strap(c, { n: 2, W, g: W * .6, taper: [.05, .05], z: 0 }), L = y1 - y0, nT = Math.max(3, Math.round(L / (u * 2.6)));
    const wind = resample(Array.from({ length: 200 }, (_, k) => { const t = k / 199; return [x + u * .75 * Math.sin(t * nT * Math.PI), y0 + L * t]; }), .5);
    const out = interlace([st, ...(rich >= .5 ? [{ ...hairline(wind, Math.max(.9, u * .14)), alt: true }] : [])], W * .45);
    entries.forEach((e, k) => { const y = e.base - u * .45; out.push(rule([x + u * 1.1, y], [x + u * 1.9, y], .55), lozenge([x + u * 2.25, y], u * .42, k % 2 ? 'k' : 'r')); });
    out.push(lozenge([x, y0 - u * .6], u * .5, 'r'), lozenge([x, y1 + u * .6], u * .5, 'r'));
    return out; },
};

export const palette = {
  light: { k: [30, 23, 18], r: [178, 46, 30] },      // iron-gall black gone a little brown; minium red
  dark: { k: [226, 216, 200], r: [234, 110, 86] },   // on a dark ground the black is a warm pale ink, the red lifted
};

export const blackletter = { label: 'Blackletter', pair: ['r', 'k'], alternate: false, minGap: 2,
  setup: seed => ({ kinds: FILLERS }), kinds: (v, rich) => rich < .25 ? ['rule'] : rich < .5 ? ['rule', 'lozenges'] : FILLERS,
  paraph, filler, breakMark, touch, initial, frames, palette, FILLERS,
  get fillers() { return this.filler; }, get breaks() { return this.breakMark; } };   // the names the task gave them
export default blackletter;
