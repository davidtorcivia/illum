// Plotter, direction B: section lines (research/25-plotter.md §3.1, §4). A contemporary plotter (an AxiDraw: a servo
// lifts the pen, slower than a solenoid, so its dwell dots are fuller) on smooth Bristol, a 0.35 mm pigment liner for
// the contours and a red liner for the hatch, after the engineer's section: a contour, and inside it parallel lines
// drawn back and forth with the pen down, the turns on the contour. The hatch is regular because the program is; it
// departs from regular only where the machine does (a short row never reaches speed and runs heavier, each row returns
// within 0.1 mm, the red pen's layer sits up to 0.2 mm off the black's). Tone is spacing and nothing else.
// The drop's letter: the capitals of Jost (OFL), a Futura of our time, as outlines (kit/styles/plotter-letters.js).
// From A, the drawing office: Hershey's Simplex for the swatch's labels, and the points of dwell as the smallest break.
// One hand a page: hand(seed) sets the section's angle and spacing, whether the drop is crossed, the shape the small
// marks take, how the filler and the run-out are drawn; each piece varies within it by its own seed.
import { MM } from './plotter-pen.js';
import { outline, hatch, hershey, line, make, rng, shape, closed, pick } from './plotter-draw.js';

export const NAME = 'B · section lines';
export const MACHINE = 'axidraw';
export const STOCK = { light: '#f3f1ea', dark: '#141417' };   // Bristol; black card
export const PENS = {
  black: { tip: 'micron', w: .35, rgb: '#1d1d20', dark: { tip: 'gel', w: .4, rgb: '#f1f0ea' } },
  red: { tip: 'micron', w: .3, rgb: '#bb3129', dark: { tip: 'gel', w: .3, rgb: '#e86a5c' } },
};
const P = PENS, mk = (layers, seed) => make(layers, MACHINE, seed), D2R = Math.PI / 180;

export function hand(seed) {
  const r = rng(seed * 7 + 202);
  return { ang: pick(r, [45, -45, 30, -30, 60, -60]) * D2R, gap: (.62 + r() * .3) * MM, cross: r() < .35, mark: pick(r, ['lozenge', 'square', 'disc', 'triangle', 'hexagon']),
    fill: pick(r, ['ramp', 'steps']), run: pick(r, ['wedge', 'steps', 'taper']), small: pick(r, ['mark', 'dwell']) };
}
const sect = (cs, gap, ang, { cross = false, inset = .18 * MM } = {}) => [{ pen: P.black, paths: cs.map(closed) },
  { pen: P.red, paths: [...hatch(cs, ang, gap, { inset }), ...(cross ? hatch(cs, ang + Math.PI / 2, gap * 1.15, { inset }) : [])] }];
const merge = parts => [{ pen: P.black, paths: parts.flatMap(p => p[0].paths) }, { pen: P.red, paths: parts.flatMap(p => p[1].paths) }];

// the drop: the capital's contour, then its section at the page's angle and spacing (crossed, if the page is)
export function initial(ch, H, seed, fs, hd = hand(seed), { cross = hd.cross } = {}) {
  const o = outline(ch, 0, H, H), r = rng(seed * 3 + 9); return mk(sect(o.contours, hd.gap * (.95 + .15 * r()), hd.ang, { cross }), seed);
}
// the paraph: the page's mark in section (its hatch across the page's angle, so it reads as a cut, not a second outline)
export function paraph(fs, seed, hd = hand(seed)) { const r = rng(seed * 5 + 1), s = fs * (.26 + .06 * r()), c = shape(hd.mark, s, s, s, r() * .3 - .15);
  return mk(sect([c], .5 * MM, hd.ang + Math.PI / 2 * (r() < .5 ? 1 : 0)), seed); }
// the filler: a strip in section between two ruled edges, its lines opening toward the margin (the tone runs out with
// the line), or as steps: blocks of the same strip, each more open than the last
export function filler(w, lh, seed, hd = hand(seed)) {
  const r = rng(seed * 17 + 3), h = lh * (.22 + .08 * r()), a = hd.ang, k = 3.5 + r() * 3;
  if (hd.fill === 'ramp') { const band = [[0, -h / 2], [w, -h / 2], [w, h / 2], [0, h / 2]], x = t => .62 * MM * (1 + k * t * t);
    return mk([{ pen: P.black, paths: [[[0, -h / 2], [w, -h / 2]], [[w, h / 2], [0, h / 2]]] }, { pen: P.red, paths: hatch([band], a, x, { phase: .3, inset: .15 * MM }) }], seed); }
  const n = Math.max(2, Math.min(7, Math.round(w / (h * (5 + r() * 3))))), g = h * .6, bw = (w - (n - 1) * g) / n, parts = [];
  for (let i = 0; i < n; i++) { const x = i * (bw + g); parts.push(sect([[[x, -h / 2], [x + bw, -h / 2], [x + bw, h / 2], [x, h / 2]]], .55 * MM * (1 + i * k / n), a)); }
  return mk(merge(parts), seed);
}
// the heading's run-out: a wedge in section from the heading's x-height to a point at the margin; or steps that fall
// away; or a strip that narrows, its end ticked
export function runout(w, h, seed, hd = hand(seed)) {
  const r = rng(seed * 13 + 1), a = h * (.24 + .1 * r());
  if (hd.run === 'wedge') return mk(sect([[[0, -a], [w, 0], [0, a]]], .7 * MM, hd.ang), seed);
  if (hd.run === 'steps') { const n = 3 + Math.floor(r() * 3), parts = []; let x = 0;
    for (let i = 0; i < n; i++) { const bw = w * (.5 ** (i + 1)) * (i === n - 1 ? 2 : 1), hh = a * (1 - i / n); parts.push(sect([[[x, -hh], [x + bw - .8 * MM, -hh], [x + bw - .8 * MM, hh], [x, hh]]], .7 * MM, hd.ang)); x += bw; }
    return mk(merge(parts), seed); }
  const b = a * .3, s = sect([[[0, -a], [w, -b], [w, b], [0, a]]], .7 * MM, hd.ang); s[0].paths.push(line(w, -b - 1.6 * MM, w, b + 1.6 * MM)); return mk(s, seed);
}
// the breaks. 1: the page's mark, or three points of dwell (the drawing office's); 2: three marks, the middle one larger
// and crossed; 3: the pen test, a scale of swatches hatched from open to closed, the last crossed, each labelled under in
// Hershey with its spacing (mm): the swatch a plotter's owner draws to know a pen
export function brk(rank, w, h, seed, fs = 19, hd = hand(seed)) {
  const r = rng(seed * 7 + rank), s = fs * (.28 + .06 * r());
  if (rank === 1) { if (hd.small === 'dwell') { const g = (2.4 + r() * 1.2) * MM; return mk([{ pen: P.black, paths: [-1, 0, 1].map(i => Object.assign(line(i * g, 0, i * g + .05, 0), { fixed: true })), order: 'given' }], seed); }
    return mk(sect([shape(hd.mark, 0, 0, s)], .5 * MM, hd.ang), seed); }
  if (rank === 2) { const g = s * (3.2 + r() * 1.2); return mk(merge([[-g, .75, false], [0, 1.2, true], [g, .75, false]].map(([cx, k, cr]) => sect([shape(hd.mark, cx, 0, s * k)], .5 * MM, hd.ang, { cross: cr }))), seed); }
  const n = 5 + Math.floor(r() * 4), q = Math.min(fs * 1.2, w / (n * 1.6)), g = q * .55, x0 = -(n * q + (n - 1) * g) / 2, black = [], red = [];
  for (let i = 0; i < n; i++) { const x = x0 + i * (q + g), c = shape(hd.mark === 'triangle' ? 'square' : hd.mark, x + q / 2, 0, q / 2), gap = .3 * MM * (9 - 7.4 * i / (n - 1));
    black.push(closed(c)); red.push(...hatch([c], hd.ang, gap, { inset: .18 * MM })); if (i === n - 1) red.push(...hatch([c], hd.ang + Math.PI / 2, gap * 1.15, { inset: .18 * MM }));
    const lab = hershey((gap / MM).toFixed(1), 0, 0, Math.max(1.8 * MM, fs * .3), 'simplex'); black.push(...lab.paths.map(p => p.map(([u, v]) => [u + x + q / 2 - lab.w / 2, v + q / 2 + 2.6 * MM]))); }
  return mk([{ pen: P.black, paths: black }, { pen: P.red, paths: red }], seed);
}
// the quotation: a bar down its margin in section, as a cut edge is drawn; its width the seed's, its ends ticked or not
export function frame(kind, w, h, seed, fs = 19, hd = hand(seed)) {
  const r = rng(seed * 19 + 4), bw = (1.8 + r() * 1.4) * MM, x = fs * .55, bar = [[x, 4], [x + bw, 4], [x + bw, h - 4], [x, h - 4]], s = sect([bar], .7 * MM, hd.ang);
  if (r() < .5) s[0].paths.push(line(x - 1.2 * MM, 4, x + bw + 1.2 * MM, 4), line(x - 1.2 * MM, h - 4, x + bw + 1.2 * MM, h - 4));
  return mk(s, seed);
}
