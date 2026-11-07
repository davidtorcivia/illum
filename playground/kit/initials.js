// Initials: each style's drop initial, the first element of the registry (kit/wayfinding.js STYLES) that is not a
// line's ornament. A style's `initial(o)` takes the letter as the walk measured it and returns how the letter is laid
// and the marks round it:
//   o: { G (the letter's coverage: M, w, h, x0, y0, res, box [x0, y0, x1, y1]), keep (word rects, padded), lh (the
//        line height), u (the x-height), big (a drop initial, or one in the line), level (0..4, kit/penwork.js budgets),
//        rich, seed, room (px of margin to the letter's left, the sheet's edge kept), bottom (the lowest y allowed) }
//   → { letter: { M, pigment } (laid with the brush) | { M, col, outline?, ghost? } (flat), ground?: marks laid under the
//       letter, marks: marks over it }
// Marks are the registry's: strokes { pts, col, w, start, end, load?, dry?, broad?, swell?, nib?, press?, ink?, seed? }
// and points { dot, p, r, col, ink? }; col 'a' | 'b' (the style's pair: 'a' the first), 'g' gold, 'k' black, 'f' flesh.
// A style without an initial lays its letter flat in its first colour, with nothing round it.
import { stream, PIGMENTS } from './marks.js';
import { flourish, drawn } from './penwork.js';
import { STYLES, arc, hair, bead, line, glyph, SIGNS, pip, fill, cpStroke, cpOval, beauty, cubic } from './wayfinding.js';

const bbox = G => G.box, center = ([x0, y0, x1, y1]) => [(x0 + x1) / 2, (y0 + y1) / 2];

// ---- Gothic: 03's penwork (kit/penwork.js flourish), with 03's geometry and inks exactly, so 03 can move onto it
// per level: the panel's width (of the letter's height), how far its hairlines rise above the letter, the staff's
// length (lines), and how much wider the gap to the words is (px, for a text-side panel)
const GEOM = { panelW: [.3, .4, .52, .6, .68], rise: [0, .03, .06, .14, .22], staff: [1.4, 3.2, 5.5, 7, 9], wider: [0, 0, 0, 5, 9],
  small: { panelW: [5, 7, 8.5, 10, 12], staff: [.7, 1.2, 1.6, 2.2, 3] } };
// the opposite-colour rule (01-canon §2.2): a blue letter takes red penwork, a red letter blue
const INKS = { azurite: [212, 108, 82], minium: [60, 86, 164] };
function gothic({ G, keep, lh, big, level: li, seed, room: margin, bottom }) {
  const pig = big ? 'azurite' : 'minium', ink = INKS[pig], [lx0, ly0, lx1, ly1] = bbox(G), Hl = ly1 - ly0;
  const gap = big ? 2.6 : 2.1, room = Math.max(0, margin - gap * 3);
  const panel = big ? [lx0 - Math.min(GEOM.panelW[li] * Hl, room), ly0 - GEOM.rise[li] * Hl, lx0 - gap * .7, ly1]
    : [lx0 - Math.min(GEOM.small.panelW[li], room), ly0 - 1, lx0 - gap * .6, ly1 + 1];
  const staff = { y1: Math.min(bottom, ly1 + Math.round((big ? GEOM.staff[li] : GEOM.small.staff[li]) * lh)) };
  const L = drawn(G, seed, big ? .8 : .45);
  const marks = flourish({ glyph: L, panel, keep, staff, g: gap, seed, level: li, right: big && li > 2 ? lh * .42 + GEOM.wider[li] : gap });
  return { letter: { M: L, pigment: pig }, marks: marks.map((s, i) => s.kind === 'dot'
    ? { dot: true, p: s.p, r: s.r, col: s.accent ? 'a' : 'b', ink: s.accent ? PIGMENTS[pig].rgb : ink }
    : { pts: s.pts, col: 'b', ink, seed: seed + i * 13, w: s.w * 1.15, start: s.start, end: s.end, load: .78 * (s.rho ?? 1), dry: .3, broad: .42, swell: .25, nib: .5 }) };
}
gothic.wider = GEOM.wider;

// ---- Cyber: the letter in cyan with its glitch, a magenta copy a pixel or two off behind it; the heads-up display's
// corner brackets round it; down the margin a ruled scale with its ticks, a long one every fourth, to a chevron
function cyber({ G, lh, big, rich, room, bottom }) {
  const [x0, y0, x1, y1] = bbox(G), out = [], p = big ? Math.min(5, lh * .16) : 2.5, B = [x0 - p, y0 - p, x1 + p * .6, y1 + p], arm = Math.min(B[2] - B[0], B[3] - B[1]) * (big ? .24 : .32);
  // in the line there is no room on the text side: the left pair only
  for (const [cx, cy, sx, sy] of [[B[0], B[1], 1, 1], [B[2], B[1], -1, 1], [B[0], B[3], 1, -1], [B[2], B[3], -1, -1]].filter(([, , sx]) => big || sx > 0))
    out.push(line([[cx + sx * arm, cy], [cx, cy], [cx, cy + sy * arm]], 'a', big ? .8 : .6));
  if (big && room > 10) { const x = B[0] - Math.min(room - 4, lh * .45), yb = Math.min(bottom, y1 + lh * (rich >= .5 ? 2.2 : 1.2)), step = lh * .25;
    out.push(line([[x, B[1]], [x, yb]], 'a', .55));
    for (let k = 0, y = B[1]; y <= yb + .01; y += step, k++) out.push(line([[x, y], [x - (k % 4 === 0 ? lh * .32 : lh * .14), y]], k % 4 === 0 && rich >= .5 ? 'b' : 'a', .5));
    out.push(line([[x - lh * .2, yb + lh * .1], [x, yb + lh * .3], [x + lh * .2, yb + lh * .1]], 'b', .7)); }
  if (rich >= .75) out.push(bead([B[2] - arm * .5, B[1] - p * .1], .9, 'b'));
  return { letter: { M: G, col: 'a', ghost: { col: 'b', off: big ? [1.6, -1.1] : [1, -.7] } }, marks: out };
}

// ---- Occult: the letter in red, the seal behind it: a magic circle's left half (its rings, a band of planetary signs
// between them) drawn as if it ran on behind the letter; for the small one, a sign over it
function occult({ G, lh, big, rich, seed, room }) {
  const r = stream(seed, 'oini'), [x0, y0, x1, y1] = bbox(G), out = [], H = y1 - y0, c = [x0 + (x1 - x0) * .35, (y0 + y1) / 2];
  if (!big) { out.push(...glyph(SIGNS[(r() * SIGNS.length) | 0], [x0 - Math.min(room * .5, lh * .4), y0 + H * .3], lh * .18, 'b', .5)); return { letter: { M: G, col: 'a' }, marks: out }; }
  const R = Math.min(H * .66, c[0] - x0 + Math.max(0, room - 4)), a0 = Math.PI * .58, a1 = Math.PI * 1.42;   // the rings' arc, from the letter's foot round the margin side to its head
  out.push(hair(arc(c, R, a0, a1, 48), 'b', { w: 1, start: 'cut', end: 'cut' }), hair(arc(c, R * .78, a0 + .1, a1 - .1, 40), 'b', { w: .6, start: 'cut', end: 'cut' }));
  const n = rich >= .5 ? 5 : 3; for (let k = 0; k < n; k++) { const a = a0 + (a1 - a0) * (k + .5) / n, q = [c[0] + Math.cos(a) * R * .9, c[1] + Math.sin(a) * R * .9];
    out.push(...glyph(SIGNS[(r() * SIGNS.length) | 0], q, R * .085, k % 2 ? 'a' : 'b', .55)); }
  if (rich >= .75) for (const a of [a0, a1]) out.push(bead([c[0] + Math.cos(a) * R * .9, c[1] + Math.sin(a) * R * .9], .9, 'a'));
  return { letter: { M: G, col: 'a' }, marks: out };
}

// ---- Tarot: the letter as a card: a double black line with round corners, flesh under the letter, the letter red under
// a black line of its own; the suit at its foot in the margin
function tarot({ G, lh, big, rich, seed, room }) {
  const r = stream(seed, 'tini'), [x0, y0, x1, y1] = bbox(G), p = big ? Math.min(6, lh * .2) : 3, B = [x0 - p, y0 - p, x1 + p * .7, y1 + p], rr = p * .9, ground = [], out = [];
  const rect = d => { const [a, b, c, e] = [B[0] + d, B[1] + d, B[2] - d, B[3] - d], k = rr - d * .5;
    return [[a + k, b], [c - k, b], ...arc([c - k, b + k], k, -Math.PI / 2, 0, 6).slice(1), [c, e - k], ...arc([c - k, e - k], k, 0, Math.PI / 2, 6).slice(1), [a + k, e], ...arc([a + k, e - k], k, Math.PI / 2, Math.PI, 6).slice(1), [a, b + k], ...arc([a + k, b + k], k, Math.PI, Math.PI * 1.5, 6).slice(1)]; };
  if (!big) return { letter: { M: G, col: 'a', outline: { col: 'k', w: .6 } }, marks: [] };   // in the line, no room for the card: the letter alone, outlined
  const iw = B[3] - B[1] - p * 2; ground.push(fill([[B[0] + p * 1.2, (B[1] + B[3]) / 2], [B[2] - p * 1.2, (B[1] + B[3]) / 2]], iw, 'f'));
  out.push(line(rect(0), 'k', big ? .7 : .55), ...(big ? [line(rect(p * .35), 'k', .4)] : []));
  if (big && room > lh * .7 && rich >= .25) out.push(...pip(['coin', 'cup', 'sword', 'baton'][(r() * 4) | 0], [B[0] - lh * .45, B[3] - lh * .4], lh * .5));
  return { letter: { M: G, col: 'a', outline: { col: 'k', w: big ? .9 : .6 } }, ground, marks: out };
}

// ---- Copperplate: the letter in ink, and the writing master's capital flourish on the margin side: a compound curve
// out of the letter's foot, up into an oval on the slant, and a line of beauty down the margin closing in a small oval
function copperplate({ G, lh, big, rich, seed, room }) {
  const [x0, y0, x1, y1] = bbox(G), H = y1 - y0, S = STYLES.copperplate;
  // the style's own paraph (a capital stem: a hairline up into an oval at its head, the shaded line of beauty down, an
  // oval at its foot) drawn at the letter's height in the margin beside it, standing on the same baseline
  const u = Math.min(H / 1.75, (room - 2) / 2.3), m = u > lh * .12 ? S.paraph(0, 0, u, seed, rich, S.setup(seed)) : [];
  const xs = m.flatMap(s => s.pts.map(p => p[0])), dx = x0 - (big ? lh * .12 : lh * .06) - Math.max(...xs, 0);
  const sc = big ? 1 : .8, marks = m.map(s => ({ ...s, w: s.w * Math.min(1, 14 / u), pts: s.pts.map(([x, y]) => [x0 + (x + dx - x0) * sc, y1 + y * sc]) }));   // a capital's pen is not a paraph's pen enlarged
  return { letter: { M: G, col: 'a' }, marks };
}

// ---- Swiss: the letter in red, a heavy black bar beside it on the grid's line, a hairline at its foot; nothing else
function swiss({ G, lh, big, rich, room }) {
  const [x0, y0, x1, y1] = bbox(G), out = [], d = Math.min(room - 2, big ? lh * .3 : lh * .18), bw = big ? lh * .12 : lh * .07;
  if (d > bw) out.push({ col: 'b', broad: 1, nib: 0, w: bw, load: 1.1, dry: 0, swell: 0, start: 'cut', end: 'cut', pts: [[x0 - d, y0], [x0 - d, y1]] });
  if (big && rich >= .5) out.push(line([[x0 - d, y1 + lh * .25], [x1, y1 + lh * .25]], 'b', .5));
  return { letter: { M: G, col: 'a' }, marks: out };
}

Object.assign(STYLES.gothic, { initial: gothic });
Object.assign(STYLES.cyber, { initial: cyber });
Object.assign(STYLES.occult, { initial: occult });
Object.assign(STYLES.tarot, { initial: tarot });
Object.assign(STYLES.copperplate, { initial: copperplate });
Object.assign(STYLES.swiss, { initial: swiss });
