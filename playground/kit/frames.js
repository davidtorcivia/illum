// Frames: penwork round the boxes a web page has (a quotation, a figure, code, a pull quote, an aside, the contents),
// in the hand of kit/penwork.js and kit/wayfinding.js. Each frame is grown from its box's measured geometry and rank,
// and is open: a rule down one side that turns over at its ends, or a head and a foot, never a ruled rectangle.
//
// After the bar borders of Paris Bibles, c. 1280–1300 (Met 469985, 466281): a bar down the gutter beside the text, a
// knop or sprig off it now and then, branching at its foot into arms that turn out along the bottom margin and end in
// a spray. And the diple (>) that medieval scribes set in the margin beside each line of a quotation. Native to the
// web where the source could not be: each frame knows its box's real lines and room, and changes form when the
// measure does (a side staff on a desk becomes a head and foot on a phone).
// All functions return marks: strokes { pts, col, w, start, end } and dots { dot, p, r, col }; col 'a' or 'b'.
import { stream } from './marks.js';
import { wander, arc, hook, hair, bead, eye, breakMark } from './wayfinding.js';

// a turned-over end: the rule's last stretch curls the given way and ends in a bead
const turn = (p, h, size, sense, col) => hair(hook(p, h, size, sense), col, { end: 'ball' });
// beads strung along a straight run, alternating colour on a richer page
const beads = (a, b, step, r, rich, out, rnd) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
  for (let k = 1; k < n; k++) { const t = k / n; out.push(bead([a[0] + (b[0] - a[0]) * t + (rnd() - .5) * .3, a[1] + (b[1] - a[1]) * t + (rnd() - .5) * .3], (k % 2 && rich >= .5 ? .9 : 1.05) + rnd() * .15, k % 2 && rich >= .5 ? 'b' : 'a')); } };
// scallops on one side of a straight run (n: the unit normal toward the outside)
const scallops = (a, b, n, g, out, rnd, colAlt = false, k = 2.85) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), step = g * k, m = Math.floor(L / step), t = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
  const off = (L - (m - 1) * step) / 2, a0 = Math.atan2(n[1], n[0]);
  for (let k = 0; k < m; k++) { const s = off + k * step, sr = g * (.98 + rnd() * .2), c = [a[0] + t[0] * s + n[0] * sr * .45, a[1] + t[1] * s + n[1] * sr * .45];
    out.push(hair(arc(c, sr, a0 - 2.05, a0 + 2.05, 12), colAlt && k % 2 ? 'b' : 'a', { w: .46, end: 'cut' })); } };

// ---- a quotation: a rule down its gutter from the first line to the last, turning out at both ends; a diple at
// each line (the lines are measured); scallops on the outer side; an eye at its head on a lavish page
export function quoteFrame({ x, lines, u, g = 2.4, seed, rich = .5 }) {
  const r = stream(seed, 'quote'), out = [], y0 = lines[0].top + u * .2, y1 = lines.at(-1).base + u * .35;
  out.push(hair(wander([[x, y0], [x, y1]], .25, seed, 40), 'a', { w: .58, end: 'cut' }));
  out.push(turn([x, y0], -Math.PI / 2, u * .42, -1, 'a'), turn([x, y1], Math.PI / 2, u * .42, 1, 'a'));
  if (rich >= .25) lines.forEach((ln, k) => { const dx = x + u * .55, dy = ln.base - u * .48, s = u * .3 * (.9 + r() * .2);
    out.push(hair([[dx, dy - s], [dx + s * 1.1, dy + (r() - .5) * .3], [dx, dy + s]], k % 2 && rich >= .5 ? 'b' : 'a', { w: .5, start: 'cut', end: 'ball' })); });
  if (rich >= .5) scallops([x, y0 + u * 1.2], [x, y1 - u * 1.2], [-1, 0], g, out, r, rich >= .75, rich >= .75 ? 3.4 : 4.6);
  if (rich >= .75) out.push(...eye([x - u * .9, y0 - u * 1.1], u * .38, 'b', r, 4));
  return out;
}

// ---- a figure: a head rule over the picture and a foot rule under it, each turning in at both ends; beads on the head,
// scallops over it, an eye at the head's outer corner on a lavish page
export function figureFrame({ box: [x0, y0, x1, y1], u, g = 2.4, seed, rich = .5 }) {
  const r = stream(seed, 'figure'), out = [], hy = y0 - u * .9, fy = y1 + u * .9, ix0 = x0 + u * .4, ix1 = x1 - u * .4;
  out.push(hair(wander([[ix0, hy], [ix1, hy]], .2, seed + 1, 40), 'a', { w: .58, end: 'cut' }), turn([ix0, hy], Math.PI, u * .45, -1, 'a'), turn([ix1, hy], 0, u * .45, 1, 'a'));
  out.push(hair(wander([[ix0, fy], [ix1, fy]], .2, seed + 2, 40), 'a', { w: .58, end: 'cut' }), turn([ix0, fy], Math.PI, u * .45, 1, 'a'), turn([ix1, fy], 0, u * .45, -1, 'a'));
  if (rich >= .25) beads([ix0 + u, hy], [ix1 - u, hy], u * 1.6, 1, rich, out, r);
  if (rich >= .5) { const q = (ix1 - ix0) * (rich >= .75 ? .12 : .26); scallops([ix0 + q, hy], [ix1 - q, hy], [0, -1], g, out, r, rich >= .75); }
  if (rich >= .75) out.push(...eye([ix0 - u * .55, hy - u * 1.15], u * .4, 'b', r, 4), hair([[ix0 - u * .2, hy - u * .45], [ix0 - u * .4, hy - u * .75]], 'b', { w: .45, end: 'cut' }));
  return out;
}

// ---- code: two corner pieces, at the head on the left and at the foot on the right, each an arm along the edge and an
// arm down the side meeting in a rounded corner, both turned over at their ends; beads along them, an eye in the corner
export function codeFrame({ box: [x0, y0, x1, y1], u, g = 2.4, seed, rich = .5 }) {
  const r = stream(seed, 'code'), out = [], W = x1 - x0, H = y1 - y0, R = u * .7, aw = Math.min(W * .28, u * 14), ah = Math.min(H * .45, u * 9);
  for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y1, -1, -1]]) {
    const pts = [[cx + sx * aw, cy], [cx + sx * R, cy], ...arc([cx + sx * R, cy + sy * R], R, sx > 0 ? -Math.PI / 2 : Math.PI / 2, sx > 0 ? -Math.PI : 0, 8).slice(1), [cx, cy + sy * ah]];
    out.push(hair(wander(pts, .18, seed + sx, 30), 'a', { w: .56, end: 'cut' }));
    out.push(turn([cx + sx * aw, cy], sx > 0 ? 0 : Math.PI, u * .38, -sx * sy, 'a'), turn([cx, cy + sy * ah], sy > 0 ? Math.PI / 2 : -Math.PI / 2, u * .38, sx * sy, 'a'));
    if (rich >= .25) { beads([cx + sx * R * 1.6, cy], [cx + sx * aw, cy], u * 1.5, 1, rich, out, r); beads([cx, cy + sy * R * 1.6], [cx, cy + sy * ah], u * 1.5, 1, rich, out, r); }
    if (rich >= .75) out.push(...eye([cx + sx * R * .95, cy + sy * R * .95], u * .3, 'b', r, 0));
    if (rich >= .5) scallops([cx + sx * R * 1.5, cy], [cx + sx * (aw - u), cy], [0, -sy], g, out, r, rich >= .75);
  }
  return out;
}

// ---- a pull quote: the chapter break of kit/wayfinding.js above and below, rank 1
export function pullFrame({ cx, yTop, yBot, measure, u, seed, rich = .5 }) {
  return [...breakMark(cx, yTop, measure, 1, seed, rich, u), ...breakMark(cx, yBot, measure, 1, seed + 7, rich, u)];
}

// ---- an aside: a rule along its head turning down into its left side, meeting in a round corner; scallops above the
// head; an eye in the corner
export function asideFrame({ box: [x0, y0, x1, y1], u, g = 2.4, seed, rich = .5 }) {
  const r = stream(seed, 'aside'), out = [], R = u * .8, H = y1 - y0;
  const pts = [[x0 + (x1 - x0) * .72, y0], [x0 + R, y0], ...arc([x0 + R, y0 + R], R, -Math.PI / 2, -Math.PI, 8).slice(1), [x0, y0 + Math.min(H * .7, H - u)]];
  out.push(hair(wander(pts, .18, seed, 30), 'a', { w: .56, end: 'cut' }), turn(pts[0], 0, u * .4, 1, 'a'), turn(pts.at(-1), Math.PI / 2, u * .4, 1, 'a'));
  if (rich >= .25) scallops([x0 + R * 1.6, y0], [x0 + (x1 - x0) * (rich >= .75 ? .5 : .34), y0], [0, -1], g, out, r, rich >= .5);   // a run from the corner, not the whole head
  if (rich >= .5) out.push(...eye([x0 - u * .25, y0 - u * .25], u * .36, 'b', r, rich >= .75 ? 4 : 0));
  if (rich >= .75) beads([x0, y0 + R * 1.7], pts.at(-1), u * 1.5, 1, rich, out, r);
  return out;
}

// ---- the contents: the most important box gets the staff. On a desk it runs down the margin beside the list from
// above it to below, forked at the head, curling at the foot, a bead or an eye at each entry's line, scallops between;
// on a phone, where there is no margin, it lies down: a head rule with an eye at its middle, and a foot rule.
export function navFrame({ box: [x0, y0, x1, y1], entries, x, u, g = 2.4, seed, rich = .5, side = true }) {
  const r = stream(seed, 'nav'), out = [];
  if (side) {
    const top = y0 - u * 1.2, bot = y1 + u * 2.4;
    out.push(hair(wander([[x, top], [x, bot]], .3, seed, 50), 'a', { w: .62, end: 'cut' }));
    out.push(turn([x, top], -Math.PI / 2, u * .5, -1, 'a'), turn([x, top], -Math.PI / 2, u * .42, 1, 'a'), turn([x, bot], Math.PI / 2, u * .6, 1, 'a'));
    if (rich >= .5) { const x2 = x - g * 1.1; out.push(hair(wander([[x2, top + u * 2], [x2, bot - u * 1.5]], .3, seed + 3, 50), 'a', { w: .5, start: 'pool', end: 'ball' })); }
    entries.forEach((e, k) => { const y = e.base - u * .45, col = k % 2 ? 'b' : 'a';
      if (rich >= .5) { out.push(hair([[x, y], [x + u * .7, y]], col, { w: .45, end: 'cut' })); out.push(...eye([x + u * .7 + u * .32, y], u * .3, col, r, rich >= .75 ? 4 : 0)); }
      else out.push(bead([x + u * .5, y], 1.2, col)); });
    if (rich >= .25) { const xo = rich >= .5 ? x - g * 1.1 : x;
      for (let k = 0; k <= entries.length; k++) { const ya = k ? entries[k - 1].base : top + u * 1.5, yb = k < entries.length ? entries[k].base - u : bot - u;
        if (yb - ya > g * 4) scallops([xo, ya + u * .2], [xo, yb], [-1, 0], g, out, r, rich >= .75); } }
    return out;
  }
  const hy = y0 - u * 1.1, fy = y1 + u * 1.1, cx = (x0 + x1) / 2;
  for (const [y, sgn] of [[hy, -1], [fy, 1]]) {
    out.push(hair(wander([[x0, y], [x1, y]], .2, seed + sgn, 40), 'a', { w: .58, end: 'cut' }), turn([x0, y], Math.PI, u * .45, -sgn, 'a'), turn([x1, y], 0, u * .45, sgn, 'a'));
    if (rich >= .25) beads([x0 + u * 1.2, y], [x1 - u * 1.2, y], u * 1.6, 1, rich, out, r);
  }
  out.push(...eye([cx, hy - u * .55], u * .38, 'b', r, rich >= .5 ? 4 : 0));
  if (rich >= .5) scallops([x0 + u * 2, fy], [x1 - u * 2, fy], [0, 1], g, out, r, rich >= .75);
  return out;
}
