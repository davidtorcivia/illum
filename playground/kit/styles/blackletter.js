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
//   initial({ ch, G: { box: [x0, capTop, x1, baseline] }, keep, big, level, seed, room, bottom })
//     -> { letter: null, marks, width }
//   ch: the letter (required; A–Z, accents stripped; any other character returns { letter: ch, marks: [], width }
//   so the host shows its own glyph). The letter itself is written as marks: the host sets its glyph transparent.
//   box: the cap height of the drop, from its left edge; width: what to float (initial.width(ch) * cap height, the same
//   before layout; initial.wider[level] px more for the richer levels). keep: rects of the host's words, which no mark
//   may touch; room: px of margin to the left of the box the cloud may use; bottom: the page's foot. big: the drop
//   (false: the small capital in the line, one stroke, touched with red). level 0..4: how rich. loops: (a test hook)
//   the number of great loops, overriding the level's.
// touch(): the rubricator's red stroke through a capital of the host's text. The host's text is never marked unasked:
// the page calls it only when the reader asks for it (the specimen's ?capitals).

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
  const X = [], bb = strands.map(s => bbox(s.c));
  strands.forEach((A, a) => strands.forEach((B, b) => {
    if (b < a || !near(bb[a], bb[b], 1)) return;
    for (let i = 0; i < A.c.length - 1; i++) for (let j = a === b ? i + 4 : 0; j < B.c.length - 1; j++) {
      const r = segX(A.c[i], A.c[i + 1], B.c[j], B.c[j + 1]); if (!r) continue;
      const p = add(A.c[i], [A.c[i + 1][0] - A.c[i][0], A.c[i + 1][1] - A.c[i][1]], r[0]);
      X.push({ pass: [{ s: a, i }, { s: b, i: j }], p, over: -1 });
    } }));
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
function initial({ ch = 'B', G, keep = [], big = true, level = 2, seed = 1, room = 100, bottom = 1e9, loops: nLoops }) {
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
initial.wider = [0, 0, 0, 2, 4];
initial.width = ch => CAPS[String(ch).normalize('NFD')[0].toUpperCase()]?.w ?? .8;


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
  out.push(stroke([[x + u * .5, top - u * .04], [x + u * 1.62, top - u * .08 + j()]], .9, 'r', .5));
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
function lozenges(x0, x1, y, h, r) {
  const n = Math.max(1, Math.round((x1 - x0) / (h * 1.5))), p = (x1 - x0) / n, out = [rule([x0, y], [x1, y + (r() - .5) * .4], .55)];
  for (let k = 0; k <= n; k++) out.push(lozenge([x0 + k * p + (r() - .5) * .3, y], h * (k % 2 ? .38 : .5), k % 2 ? 'r' : 'k'));
  return out;
}
const FILLERS = ['rule', 'cord', 'lozenges'];
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  const r = rng(seed, 'filler'), h = yBase - yTop, mid = yTop + h * .55;
  if (kind === 'cord') return cord(x0, x1, mid, h * .36, Math.max(2, Math.round((x1 - x0) / (h * 1.05))), Math.max(1.4, h * .3), rich >= .75 ? ['r', 'k'] : ['r'], .8);
  if (kind === 'lozenges') return lozenges(x0, x1, mid, h, r);
  // the rubricator's line run out to the measure, a lozenge where it stops, a black one where it starts on a richer page
  const out = [rule([x0, mid], [x1 - h * .4, mid + (r() - .5) * .5], .6), lozenge([x1 - h * .25, mid], h * .48, 'r')];
  if (rich >= .5) out.push(lozenge([x0 + h * .1, mid], h * .32, 'k'));
  return out;
}

// Solomon's knot: two oval rings of strap, red between their copies, linked so each passes over and under the other in
// turn; small, a hairline ribbon without red
function knot(cx, y, R, W, red = true) {
  const ring = t => resample(Array.from({ length: 145 }, (_, k) => { const a = k / 144 * 2 * Math.PI + .2, x = R * 1.5 * Math.cos(a), yy = R * .52 * Math.sin(a);
    return [cx + x * Math.cos(t) - yy * Math.sin(t), y + x * Math.sin(t) + yy * Math.cos(t)]; }), .5);
  return interlace([strap(ring(.42), { n: 2, W, g: W * (red ? .7 : 1.1), red, alt: true }), strap(ring(-.42), { n: 2, W, g: W * (red ? .7 : 1.1), red })], W * .7);
}
// three lozenges in a triangle: the incunabula's point of ornament
const triad = (p, s, col = 'r') => [lozenge([p[0], p[1] - s * .8], s, col), lozenge([p[0] - s * .85, p[1] + s * .5], s, col), lozenge([p[0] + s * .85, p[1] + s * .5], s, col)];
// the strapwork band: two straps of two copies, red between, braided; each end turns in on itself to a point
function plait(x0, x1, y, amp, n, W) {
  const L = x1 - x0, wave = s => resample(Array.from({ length: 200 }, (_, k) => { const t = k / 199; return [x0 + L * t, y + s * amp * Math.sin(t * n * Math.PI) * Math.min(1, Math.sin(t * Math.PI) * 3)]; }), .6);
  return interlace([strap(wave(1), { n: 2, W, g: W * .55, alt: true, taper: [.06, .06] }), strap(wave(-1), { n: 2, W, g: W * .55, taper: [.06, .06] })], W * .5);
}
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8) {
  const r = rng(seed, 'break'), out = [];
  if (rank < 2) {   // a chapter: the knot, a red point in it, red rules out to each side ending in three points
    const R = u * 1.15, w = Math.min(measure * .14, u * 4.5);
    out.push(...knot(cx, y, R, Math.max(.9, u * .14), rich >= .25), lozenge([cx, y], u * .4, 'k'));
    for (const s of [-1, 1]) { const a = cx + s * R * 1.75, b = cx + s * (R * 1.75 + w); out.push(rule([a, y], [b, y + (r() - .5) * .4], .55), ...triad([b + s * u * .7, y], u * .34, 'r')); }
    return out;
  }
  // a book: the strapwork band across a third of the measure, a knot at each end, lozenges beyond
  const half = Math.min(measure * .26, u * 13), W = Math.max(1.6, u * .3);
  out.push(...plait(cx - half, cx + half, y, u * .7, 6, W));
  for (const s of [-1, 1]) { const e = cx + s * (half + u * 1.9); out.push(...knot(e, y, u * .8, Math.max(.9, u * .13), true), ...triad([e + s * u * 2.2, y], u * .34, 'r')); }
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
    if (rich >= .25) out.push(...knot(x + u * .17, y0 - u * 2, u * .62, Math.max(.9, u * .12), rich >= .5), ...triad([x + u * .17, y1 + u * 2], u * .3, 'r'));
    return out; },
  // a figure: ruled double on four sides, crossing at the corners; the cord along its head between the rules
  figure: ({ box, u, seed, rich = .5 }) => { const B = [box[0] - u * 1.2, box[1] - u * 2.2, box[2] + u * 1.2, box[3] + u * 1.2], out = ruled(B, u);
    if (rich >= .25) out.push(...cord(B[0] + u * 1.2, B[2] - u * 1.2, B[1] - u * 1.15, u * .38, Math.round((B[2] - B[0]) / (u * 1.1)), Math.max(1.4, u * .3), ['r'], .8));
    return out; },
  // code: the ruled block, single rules crossing at the corners, a black lozenge where they cross
  code: ({ box, u, seed, rich = .5 }) => { const out = ruled(box, u, { double: false, thin: .7, over: u * 1.4 });
    if (rich >= .25) for (const [x, y] of [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]]) out.push(lozenge([x, y], u * .5, 'k'));
    return out; },
  // a pull quote: the chapter knot above and below
  pull: ({ cx, yTop, yBot, measure, u, seed, rich = .5 }) => [...breakMark(cx, yTop + u * .6, measure, 1, seed, rich, u), ...breakMark(cx, yBot + u * .1, measure, 1, seed + 7, rich, u)],
  // an aside: a thin red rule down its side crossed at its head; three red points over it, a black one under
  aside: ({ box, u, seed, rich = .5 }) => { const [x0, y0, , y1] = box, out = [rule([x0, y0 - u * .6], [x0, y1 + u * .2], .7), rule([x0 - u * .8, y0], [x0 + u * 4, y0], .55)];
    if (rich >= .25) out.push(...triad([x0, y0 - u * 1.3], u * .3, 'r'), lozenge([x0, y1 + u * .7], u * .4, 'k'));
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
