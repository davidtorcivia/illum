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

// ==== the registry's frames ======================================================================================================
// Every style frames the same six boxes, with the same arguments as the functions above; Gothic's are those functions.
// The others are built from each style's own vocabulary: rule(a, b, n) a run along a straight side (n its outward
// normal), end(p, h) how a run ends (h its heading out of the run), mark(p, k) the sign set at a line or an entry, and
// the style's own chapter break for a pull quote. Runs meet at corners exactly; ends grow from a run's own end.
import { STYLES, line, glyph, SIGNS, pip, fill, cpStroke, cpOval, beauty } from './wayfinding.js';
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
function vocabFrames(key, V) {
  const brk = (cx, y, measure, seed, rich, u) => { const S = STYLES[key]; return S.breakMark(cx, y, measure, 1, seed, rich, u, { ...S.setup(seed), index: 1 }); };
  const run = (pts, ns, u, seed, rich) => pts.slice(1).flatMap((b, i) => V.rule(pts[i], b, ns[i], u, seed + i, rich));
  return {
    quote({ x, lines, u, seed, rich = .5 }) { const y0 = lines[0].top + u * .2, y1 = lines.at(-1).base + u * .35, out = [...V.rule([x, y0], [x, y1], [-1, 0], u, seed, rich), ...V.end([x, y0], -Math.PI / 2, u, rich), ...V.end([x, y1], Math.PI / 2, u, rich)];
      if (rich >= .25) lines.forEach((ln, k) => out.push(...V.mark([x + u * .75, ln.base - u * .48], u, k, rich))); return out; },
    figure({ box: [x0, y0, x1, y1], u, seed, rich = .5 }) { const out = [];
      for (const [y, ny] of [[y0 - u * .9, -1], [y1 + u * .9, 1]]) out.push(...V.rule([x0, y], [x1, y], [0, ny], u, seed + ny, rich), ...V.end([x0, y], Math.PI, u, rich), ...V.end([x1, y], 0, u, rich));
      return out; },
    code({ box: [x0, y0, x1, y1], u, seed, rich = .5 }) { const out = [], aw = Math.min((x1 - x0) * .28, u * 14), ah = Math.min((y1 - y0) * .45, u * 9);
      for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y1, -1, -1]]) out.push(...run([[cx + sx * aw, cy], [cx, cy], [cx, cy + sy * ah]], [[0, -sy], [-sx, 0]], u, seed + sx, rich),
        ...V.end([cx + sx * aw, cy], sx > 0 ? 0 : Math.PI, u, rich), ...V.end([cx, cy + sy * ah], sy > 0 ? Math.PI / 2 : -Math.PI / 2, u, rich));
      return out; },
    // a pull quote: the style's chapter break above and below, each moved clear of the words by its own height
    pull({ cx, yTop, yBot, measure, u, seed, rich = .5 }) { const ys = m => m.flatMap(s => s.dot ? [s.p[1] - s.r, s.p[1] + s.r] : s.pts.map(p => p[1])), shift = (m, d) => m.map(s => s.dot ? { ...s, p: [s.p[0], s.p[1] + d] } : { ...s, pts: s.pts.map(([x, y]) => [x, y + d]) });
      const a = brk(cx, yTop, measure, seed, rich, u), b = brk(cx, yBot, measure, seed + 7, rich, u);
      return [...shift(a, Math.min(0, yTop + u * 1.6 - Math.max(...ys(a)))), ...shift(b, Math.max(0, yBot - u * 1.7 - Math.min(...ys(b))))]; },
    aside({ box: [x0, y0, x1, y1], u, seed, rich = .5 }) { const a = [x0 + (x1 - x0) * .72, y0], b = [x0, y0 + Math.min((y1 - y0) * .7, y1 - y0 - u)];
      return [...run([a, [x0, y0], b], [[0, -1], [-1, 0]], u, seed, rich), ...V.end(a, 0, u, rich), ...V.end(b, Math.PI / 2, u, rich)]; },
    nav({ box: [x0, y0, x1, y1], entries, x, u, seed, rich = .5, side = true }) { const out = [];
      if (side) { const top = y0 - u * 1.2, bot = y1 + u * 2.4; out.push(...V.rule([x, top], [x, bot], [-1, 0], u, seed, rich), ...V.end([x, top], -Math.PI / 2, u, rich), ...V.end([x, bot], Math.PI / 2, u, rich));
        entries.forEach((e, k) => out.push(...V.mark([x + u * .75, e.base - u * .45], u, k, rich))); return out; }
      for (const [y, ny] of [[y0 - u * 1.1, -1], [y1 + u * 1.1, 1]]) out.push(...V.rule([x0, y], [x1, y], [0, ny], u, seed + ny, rich), ...V.end([x0, y], Math.PI, u, rich), ...V.end([x1, y], 0, u, rich));
      out.push(...V.mark([(x0 + x1) / 2, y0 - u * 1.9], u, 0, rich)); return out; },
  };
}
const ticks = (a, b, n, step, long, col, w, out, every = 4) => { const L = len(a, b), m = Math.floor(L / step);
  for (let k = 0; k <= m; k++) { const p = lerp(a, b, k * step / L), l = k % every === 0 ? long : long * .45; out.push(line([p, [p[0] + n[0] * l, p[1] + n[1] * l]], col, w)); } };
const VOCAB = {
  // Cyber: a ruled scale, its ticks outward, a long one every fourth; a run ends in a via (a small ring); a chevron at each line
  cyber: { rule: (a, b, n, u, seed, rich) => { const out = [line([a, b], 'a', .6)]; if (rich >= .25) ticks(a, b, n, u * .6, u * .5, 'a', .45, out); return out; },
    end: (p, h, u) => { const R = u * .2, c = [p[0] + Math.cos(h) * R, p[1] + Math.sin(h) * R]; return [line(arc(c, R, h + Math.PI, h + 3 * Math.PI, 14), 'b', .55)]; },
    mark: (p, u, k) => [line([[p[0] - u * .18, p[1] - u * .25], [p[0] + u * .08, p[1]], [p[0] - u * .18, p[1] + u * .25]], k % 2 ? 'b' : 'a', .6)] },
  // Occult: a ruled line with the planetary signs set off it now and then; a run ends in a small ring; a sign at a line
  occult: { rule: (a, b, n, u, seed, rich) => { const r = stream(seed, 'ofr'), out = [line([a, b], 'b', .55)];
      if (rich >= .5) { const L = len(a, b), m = Math.floor(L / (u * 4)); for (let k = 1; k < m; k++) { const p = lerp(a, b, k / m); out.push(...glyph(SIGNS[(r() * SIGNS.length) | 0], [p[0] + n[0] * u * .85, p[1] + n[1] * u * .85], u * .42, 'a', .5)); } }
      return out; },
    end: (p, h, u) => { const R = u * .22, c = [p[0] + Math.cos(h) * R, p[1] + Math.sin(h) * R]; return [hair(arc(c, R, h + Math.PI, h + 3 * Math.PI, 16), 'b', { w: .5, start: 'cut', end: 'cut' })]; },
    mark: (p, u, k) => glyph(SIGNS[k % SIGNS.length], p, u * .4, k % 2 ? 'b' : 'a', .5) },
  // Tarot: the card's border: two black lines with the yellow stencil between; a run ends square; a red point at a line
  tarot: { rule: (a, b, n, u) => { const o = d => [[a[0] + n[0] * d, a[1] + n[1] * d], [b[0] + n[0] * d, b[1] + n[1] * d]];
      return [fill(o(0), u * .3, 'g'), line(o(-u * .2), 'k', .5), line(o(u * .2), 'k', .5)]; },
    end: (p, h, u) => { const n = [-Math.sin(h), Math.cos(h)]; return [line([[p[0] - n[0] * u * .2, p[1] - n[1] * u * .2], [p[0] + n[0] * u * .2, p[1] + n[1] * u * .2]], 'k', .5)]; },
    mark: (p, u, k) => [bead(p, u * .13, k % 2 ? 'b' : 'a')] },
  // Copperplate: a line of beauty, shaded as the pen runs down the slant; a run ends in a small oval closed on itself
  copperplate: { rule: (a, b, n, u) => [cpStroke(beauty(a, b, .02, Math.max(20, Math.round(len(a, b) / 2))), u * .07, 'a', 3)],
    end: (p, h, u) => { const R = u * .4, c = [p[0] + Math.cos(h) * R * .55, p[1] + Math.sin(h) * R * .55], ring = cpOval(c, R, R * .55, 0, 2 * Math.PI, 60, 0);
      let k0 = 0; ring.forEach((q, k) => { if (len(q, p) < len(ring[k0], p)) k0 = k; });   // written on from the run's own end
      return [cpStroke([p, ...[...ring.slice(k0), ...ring.slice(1, k0 + 1)].slice(1, -5)], u * .06, 'a', 3)]; },
    mark: (p, u) => [cpStroke([[p[0] - u * .1, p[1] - u * .3], [p[0] + u * .05, p[1]], [p[0] - u * .08, p[1] + u * .25]], u * .06, 'a', 3)] },
  // Swiss: a hairline, square at its ends; a red square at a line or an entry
  swiss: { rule: (a, b) => [line([a, b], 'b', .55)], end: () => [],
    mark: (p, u) => [{ col: 'a', broad: 1, nib: Math.PI / 2, w: u * .32, load: 1.1, dry: 0, swell: 0, start: 'cut', end: 'cut', pts: [[p[0] - u * .16, p[1]], [p[0] + u * .16, p[1]]] }] },
};
STYLES.gothic.frames = { quote: quoteFrame, figure: figureFrame, code: codeFrame, pull: pullFrame, aside: asideFrame, nav: navFrame };
for (const [k, V] of Object.entries(VOCAB)) STYLES[k].frames = vocabFrames(k, V);
