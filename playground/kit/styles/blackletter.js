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
// Marks: strokes { pts (page px), w (nib width, px), col 'k' | 'r', hair (the nib's own thickness, px), angle? (the nib's,
// radians above the line, where it is not the writer's) }, in the order
// the pen writes them. The page writes runs of marks with one colour and one nib as one writer part
// (createWriter(...).part(t0, t1, [{ pts, angle }], ink, { width: w, hair })).
//
// The style object follows the registry's signatures (kit/wayfinding.js STYLES, kit/initials.js, kit/frames.js):
// paraph(x, base, u, seed, rich), filler(x0, x1, yTop, yBase, kind, seed, rich), breakMark(cx, y, measure, rank, seed,
// rich, u), initial(o), frames.{quote, figure, code, pull, aside, nav}(args), palette.{light, dark}. initial(o) also
// takes o.ch (the letter) and returns { letter: null, marks, width } — the letter itself is written as marks.

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
    const visits = []; X.forEach(x => x.pass.forEach((v, k) => v.s === s && visits.push({ x, k, i: v.i })));
    visits.sort((m, n) => m.i - n.i); let over = true;
    for (const v of visits) { if (v.x.over < 0) v.x.over = over ? v.k : 1 - v.k; else over = v.x.over === v.k; over = !over; } });
  for (const x of X) if (x.over < 0) x.over = strands[x.pass[0].s].z >= strands[x.pass[1].s].z ? 0 : 1;
  // cut the under passes
  const kill = strands.map(S => S.parts.map(p => new Uint8Array(p.pts.length)));
  for (const x of X) {
    const O = x.pass[x.over], U = x.pass[1 - x.over], So = strands[O.s], Su = strands[U.s];
    const to = tangent(So.c, O.i), tu = tangent(Su.c, U.i), sin = Math.max(.5, Math.abs(to[0] * tu[1] - to[1] * tu[0]));
    const hO = across(So.B, to, So.hair) / 2 + gap, reach = hO / sin + across(Su.B, tu, Su.hair) + 4, win = Math.ceil(reach * 3);
    const segs = []; for (let j = Math.max(0, O.i - win); j < Math.min(So.c.length - 1, O.i + win); j++) segs.push([So.c[j], So.c[j + 1]]);
    Su.parts.forEach((p, k) => p.pts.forEach((q, n) => {   // a strand's strokes share its centreline's indexing
      if (Math.abs(n + (p.i0 ?? 0) - U.i) > win || Math.abs(q[0] - x.p[0]) > reach || Math.abs(q[1] - x.p[1]) > reach) return;
      for (const [a, b] of segs) if (segDist(q, a, b) < hO) { kill[U.s][k][n] = 1; break; } }));
  }
  // and rebuild each stroke as its unbroken runs
  return strands.flatMap((S, s) => S.parts.flatMap((p, k) => { const runs = []; let run = [];
    p.pts.forEach((q, n) => { if (kill[s][k][n]) { if (run.length > 1) runs.push(run); run = []; } else run.push(q); });
    if (run.length > 1) runs.push(run);
    return runs.filter(r => len(r) > Math.max(.8, p.w * .25)).map(r => { const { i0, ...q } = p; return { ...q, pts: r }; }); }));
}

// ---- the capitals ------------------------------------------------------------------------------------------------------------
// Each in a unit box: y 0 at the cap line, 1 on the baseline, x from the letter's left; w its advance. straps: the
// letter's body, each a control polygon (cut twice: Gothic curves) and its z; spur: hairlines of the letter itself;
// loops: the cadel hairlines thrown into the margin, the first the most needed (the budget takes them in order);
// dots: where the red points go (inside the counters); girdle: where a band crosses the stem.
// points on an oval (unit box): centre, radii, tilt (rad, its top leaning right), from a0 to a1 degrees, clockwise on the page
const O = (c, rx, ry, tilt, a0, a1, n = 7) => Array.from({ length: n + 1 }, (_, k) => { const a = (a0 + (a1 - a0) * k / n) * Math.PI / 180, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
  return [c[0] + x * Math.cos(tilt) - y * Math.sin(tilt), c[1] + x * Math.sin(tilt) + y * Math.cos(tilt)]; });
const CAPS = {
  // B: the stem enters from the left on a hook, as a Fraktur capital's does, and its foot sweeps out left to a point; the
  // bowls are broken curves, the upper small, the lower full, each run back behind the stem
  B: { w: .86,   // (the loops end in the margin or come in along a stroke: a hairline across the letter reads as a strike-through)
    straps: [
      { cp: [[.13, .17], [.19, .07], [.30, .03], [.31, .14], [.29, .42], [.29, .72], [.27, .88], [.18, .98], [.03, .98]], z: 2, taper: [.12, .2] },
      { cp: [[.24, .11], [.46, .02], [.63, .06], [.70, .17], [.66, .31], [.52, .42], [.33, .47]], z: 1, taper: [.2, .2] },
      { cp: [[.27, .47], [.57, .46], [.76, .55], [.84, .70], [.81, .86], [.67, .97], [.45, 1.0], [.26, .96]], z: 1, taper: [.15, .2] },
    ],
    spur: [[[.30, .03], [.36, -.03], [.43, -.05]]],
    loops: [
      [[.03, .98], [-.20, .97], [-.42, .90], [-.58, .74], [-.62, .55], [-.52, .38], [-.36, .32], [-.20, .36], [-.12, .46]],   // out of the foot, round the margin, curling in under itself
      [[.13, .17], [.02, .08], [-.06, -.04], [-.04, -.17], [.08, -.25], [.25, -.26], [.40, -.18], [.48, -.04], [.49, .10], [.46, .24]],           // off the hook, up over the head, down into the upper bowl
      [[.43, -.05], [.55, -.10], [.68, -.10], [.76, -.04], [.74, .03], [.66, .04], [.62, -.02]],                                                  // a curl off the spur
    ],
    dots: [[.48, .24], [.58, .75]], girdle: [{ s: 0, at: .74 }] },
  L: { w: .74,
    straps: [
      { cp: [[.13, .17], [.19, .07], [.30, .03], [.31, .14], [.29, .50], [.28, .86], [.24, .97]], z: 2, taper: [.05, .06] },
      { cp: [[.10, .96], [.30, .92], [.50, .98], [.66, .96], [.75, .86]], z: 1, taper: [.1, .15] },
    ],
    spur: [[[.30, .03], [.36, -.03], [.43, -.05]]],
    loops: [
      [[.10, .96], [-.08, .90], [-.18, .74], [-.12, .58], [.04, .52], [.22, .56], [.40, .66], [.52, .78]],
      [[.13, .17], [.03, .08], [-.02, -.05], [.10, -.13], [.30, -.12], [.45, -.04], [.50, .10], [.46, .25]],
    ],
    dots: [[.55, .62]], girdle: [{ s: 0, at: .6 }] },
};
export const LETTERS = Object.keys(CAPS);

// per level (0..4): how many copies make a strap, how many cadel loops, red points, the girdle, red doubling
const BUDGET = [{ n: 2, loops: 0, sprigs: 0, dots: 0, girdle: false }, { n: 2, loops: 1, sprigs: 1, dots: 1, girdle: false }, { n: 2, loops: 3, sprigs: 2, dots: 2, girdle: true },
  { n: 2, loops: 3, sprigs: 2, dots: 2, girdle: true, double: true }, { n: 3, loops: 4, sprigs: 3, dots: 2, girdle: true, double: true }];

// a hairline that curls up as it goes: heading h, length L, its turning growing to k1 (1/px) toward the end
export function tendril(p, h, L, k1, ds = .5) {
  const out = [p]; let [x, y] = p;
  for (let d = ds; d <= L; d += ds) { const f = d / L; h += k1 * f * f * ds * 2; x += Math.cos(h) * ds; y += Math.sin(h) * ds; out.push([x, y]); }
  return out;
}
// the small hairlines a cadel throws off its loops: where a loop runs outside the letter, now and then a tendril springs
// from it on the outside of its bend and curls up, ending in a point
function sprigs(loop, box, H, hw, count, r, keep, edge, bottom) {
  const c = loop.c, out = [];
  for (let k = 0; k < count; k++) {
    const i = Math.floor(c.length * (.22 + .56 * (k + .5) / count + (r() - .5) * .1)), q = c[i]; if (!q) continue;
    if (q[0] > box[0] && q[0] < box[2] && q[1] > box[1] && q[1] < box[3]) continue;
    const t = tangent(c, i), side = r() < .5 ? -1 : 1, h = Math.atan2(t[1], t[0]) + side * (.5 + r() * .3);
    const tw = tendril(q, h, H * (.16 + r() * .1), side * (9 + r() * 5) / H);
    if (!hits(tw, keep, edge, bottom)) out.push({ c: tw, sense: side });
  }
  return out;
}

// the letter's strokes, placed: X maps the unit box onto the page
function capital(ch, X, H, level, big, seed) {
  const D = CAPS[ch] ?? CAPS.B, b = BUDGET[level], r = rng(seed, 'cap');
  const W = big ? H * .085 : H * .16, g = big ? W * .5 : 0, n = big ? b.n : 1, hw = big ? Math.max(1.2, H * .02) : Math.max(.9, H * .05);
  const strands = D.straps.map(s => strap(curve(s.cp.map(X), 1, Math.max(.5, W * .1)), { n, W, g, z: s.z, hair: .6, taper: big ? s.taper : [0, 0] }));
  const spurs = level >= 3 ? D.spur.map(s => hairline(curve(s.map(X), 2, .5), hw)) : [];
  // the loops: one long stroke of a fine nib each, swelling where it runs square to the edge, ending in a curl
  const loops = (big ? D.loops.slice(0, b.loops) : []).map(l => { const c = through(l.map(X), .5), t = tangent(c, c.length - 3);
    return hairline([...c, ...tendril(c.at(-1), Math.atan2(t[1], t[0]), H * .2, 16 / H).slice(1)], hw * 1.7); });
  return { D, b, W, g, hw, strands, spurs, loops, r };
}

// ---- keeping clear of the words -------------------------------------------------------------------------------------------
const hits = (pts, keep, edge, bottom, pad = 2) => pts.some(([x, y]) => x < edge || y > bottom || keep.some(k => x > k[0] - pad && x < k[2] + pad && y > k[1] - pad && y < k[3] + pad));
// a loop that would touch a word is drawn in toward where it leaves the letter, a little at a time, or left out
function fit(loop, keep, edge, bottom) {
  const a = loop.c[0];
  for (let k = 0; k < 6; k++) { const s = .86 ** k, c = loop.c.map(([x, y]) => [a[0] + (x - a[0]) * s, a[1] + (y - a[1]) * s]);
    if (!hits(c, keep, edge, bottom)) return { ...loop, c, parts: loop.parts.map(p => ({ ...p, pts: p.pts.map(([x, y]) => [a[0] + (x - a[0]) * s, a[1] + (y - a[1]) * s]) })) }; }
  return null;
}

// ---- the initial ---------------------------------------------------------------------------------------------------------------
// The capital written in black straps, the red laid between their copies; the cadel hairlines thrown out of it into the
// margin and back through it, over and under; red points in the counters; at a richer price a band across the stem and
// a red hairline doubling the bowls outside. In the line: one copy, a red stroke beside the stem, one loop.
function initial({ ch = 'B', G, keep = [], big = true, level = 2, seed = 1, room = 100, bottom = 1e9 }) {
  const [x0, y0, , y1] = G.box, H = y1 - y0, X = ([x, y]) => [x0 + x * H, y0 + y * H], edge = x0 - room;
  const { D, b, W, g, hw, strands, spurs, loops } = capital(ch in CAPS ? ch : 'B', X, H, level, big, seed);
  const ok = loops.map(l => fit(l, keep, edge, bottom)).filter(Boolean), r = rng(seed, 'sprig');
  const box = [x0, y0, x0 + D.w * H, y1], tw = big ? ok.flatMap(l => sprigs(l, box, H, hw, b.sprigs, r, keep, edge, bottom)) : [];
  const all = [...strands, ...spurs, ...ok, ...tw.map(t => hairline(t.c, hw * .85))], marks = interlace(all, big ? Math.max(1.3, W * .32) : 1);
  // write the black first, then the red, as the scribe and then the rubricator did
  const black = marks.filter(m => m.col === 'k'), red = marks.filter(m => m.col === 'r'), over = [];
  if (big && b.girdle) for (const gd of D.girdle) {   // a band of three short bars bound across a strap over its red (Neudörffer's title cadel); the
    // bars run square to the strap, so the nib is turned for them to come out heavy (the one place the pen leaves 35°)
    const s = strands[gd.s], i = Math.floor(s.c.length * gd.at), t = tangent(s.c, i), nrm = [-t[1], t[0]], half = across(s.B, t, 0) * .5 + .4, ang = Math.atan2(t[1], -t[0]) % Math.PI;
    for (let k = -1; k <= 1; k++) { const m = add(s.c[i], t, k * W * .6); over.push({ ...stroke([add(m, nrm, -half), add(m, nrm, half)], W * .42, 'k', .45), angle: ang }); } }
  if (big && b.double) { const s = strands[2] ?? strands[1], off = s.B / 2 + g * 2.2;   // a red hairline outside the last bowl
    red.push(stroke(shiftE(s.c, off).slice(Math.floor(s.c.length * .2), Math.floor(s.c.length * .85)), hw * .9, 'r', .45)); }
  if (big) D.dots.slice(0, b.dots).map(X).filter(d => ok.every(l => Math.hypot(l.c.at(-1)[0] - d[0], l.c.at(-1)[1] - d[1]) > H * .2)).forEach(d => red.push(lozenge(d, W * .95, 'r')));   // red points in the counters, where no loop ends
  else red.push(stroke([X([.40, .30]), X([.38, .78])], W * .7, 'r', .4));   // in the line: the capital touched with red
  // the loops' free ends take a lozenge
  if (big) ok.forEach((l, k) => { if (k < 2) red.push(lozenge(l.c.at(-1), hw * 2.2, k % 2 ? 'k' : 'r')); });
  if (big) tw.forEach((t, k) => { if (k % 2 === 0) over.push(lozenge(add(t.c.at(-1), [Math.cos(k), Math.sin(k)], hw * 2.4), hw * 1.6, 'k')); });   // a point beside a curl
  return { letter: null, marks: [...black, ...red, ...over], width: D.w * H };
}
initial.wider = [0, 0, 0, 2, 4];
initial.width = ch => (CAPS[ch] ?? CAPS.B).w;

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
