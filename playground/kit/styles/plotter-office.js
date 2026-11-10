// Plotter, direction A: the drawing office (research/25-plotter.md §4). An HP 7475A on plotter bond with its own
// fibre-tip pens, 0.3 mm black and red and 0.7 mm black, drawing what HP-GL draws: Hershey lettering, ruled lines, line
// types (every dash a pen cycle), area fills (FT 1 solid, FT 3 hatched, FT 4 crossed), crop marks, a plot legend. The
// rubric pen draws the initial as Hershey's Roman Triplex, at a size where its three strokes stand apart, as titling.
// One hand a page: hand(seed) chooses what an operator sets once for a sheet (the line type and its pattern length, the
// fill type and its angle, the mark the fills take, the rule, the corner marks); each piece then draws with it, varied
// by its own seed (an HP-GL program's parameters, never a wobble).
//   hand(seed)  initial(ch, H, seed, fs, hd)  paraph(fs, seed, hd)  filler(w, lh, seed, hd)  runout(w, h, seed, hd)
//   brk(rank, w, h, seed, fs, hd)  frame(kind, w, h, seed, fs, hd)
// Each returns a piece (kit/styles/plotter-draw.js make): its layers in pen order, its extent and its anchor.
import { MM } from './plotter-pen.js';
import { hershey, hersheyBox, hatch, dashes, line, make, rng, shape, closed, pick } from './plotter-draw.js';

export const NAME = 'A · the drawing office';
export const MACHINE = 'hp7475a';
export const STOCK = { light: '#f5f5f1', dark: '#141417' };   // plotter bond; black card
// HP's supplied fibre tips (7475A manual, parts list: 0.3 mm in colours, 0.7 mm black); on black card, gel
export const PENS = {
  black: { tip: 'fibre', w: .3, rgb: '#1c1c1f', dark: { tip: 'gel', w: .4, rgb: '#f1f0ea' } },
  red: { tip: 'fibre', w: .3, rgb: '#c4302b', dark: { tip: 'gel', w: .4, rgb: '#e86a5c' } },
  heavy: { tip: 'fibre', w: .7, rgb: '#1c1c1f', dark: { tip: 'gel', w: .7, rgb: '#f1f0ea' } },
  // the panel behind a drop: on black card a silver gel, so the coral letter keeps the light
  shade: { tip: 'fibre', w: .3, rgb: '#1c1c1f', dark: { tip: 'gel', w: .3, rgb: '#8a8d94' } },
};
const P = PENS, mk = (layers, seed) => make(layers, MACHINE, seed);
// HP-GL's line types 2-6 as fractions of the pattern length (dash, gap, dot ...)
const LT = { 2: [.5, .5], 3: [.7, .3], 4: [.8, .1, .001, .1], 5: [.7, .1, .1, .1], 6: [.5, .1, .1, .1, .1, .1] };

export function hand(seed) {
  const r = rng(seed * 7 + 101);
  return { lt: pick(r, [2, 3, 4, 5, 6]), len: (6 + r() * 6) * MM,   // (HP-GL's default pattern is 4 % of the plot's diagonal: on A4 about 13 mm)
     ft: pick(r, [1, 3, 4]), fa: pick(r, [0, 45, 90, 135]) * Math.PI / 180,
    fs: (.6 + r() * .5) * MM, mark: pick(r, ['square', 'disc', 'triangle', 'hexagon']), rule: pick(r, ['double', 'triple', 'ticked']),
    corner: pick(r, ['crop', 'bracket', 'register']), drop: pick(r, ['plain', 'panel', 'box']), reg: pick(r, ['circle', 'square']) };
}
// a line type along a path, fitted to end on a dash
const typed = (P0, P1, hd, scale = 1) => { const L = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), pl = hd.len * scale, pat = LT[hd.lt].map(f => Math.max(.05, f * pl));
  const n = Math.max(1, Math.round((L + pat.at(-1)) / pl)), k = (L + pat.at(-1)) / (n * pl); return dashes([P0, P1], pat.map(v => v * k)); };
// an area fill as HP-GL fills it: FT 1 at the pen's width, back and forth; FT 3 lines at the page's angle and spacing;
// FT 4 the same crossed
const fill = (c, hd, solid = false) => { const ft = solid ? 1 : hd.ft;
  if (ft === 1) return hatch([c], 0, .3 * MM * .95, { phase: .5 });
  return [...hatch([c], hd.fa, hd.fs), ...(ft === 4 ? hatch([c], hd.fa + Math.PI / 2, hd.fs) : [])]; };

// the drop: Roman Triplex in the rubric pen, its cap on y = 0, its foot on the baseline at H; with the page's setting a
// panel filled behind it in black (the letter plotted over it), or a ruled box with corner ticks
export function initial(ch, H, seed, fs = 19, hd = hand(seed)) {
  const b = hersheyBox(ch, H, 'triplex'), L = hershey(ch, -b.l, H, H, 'triplex').paths, w = b.r - b.l, r = rng(seed * 13 + 5);
  if (hd.drop === 'plain') return mk([{ pen: P.red, paths: L }], seed);
  const m = H * (.07 + .05 * r()), box = [[-m, -m], [w + m, -m], [w + m, H + m * .6], [-m, H + m * .6]];
  if (hd.drop === 'panel') return mk([{ pen: P.shade, paths: hatch([box], hd.fa === 0 ? Math.PI / 4 : hd.fa, (.9 + r() * .5) * MM, { inset: .2 * MM }) }, { pen: P.red, paths: L }], seed);
  const t = 1.6 * MM, ticks = box.flatMap(([x, y], i) => { const sx = i === 1 || i === 2 ? 1 : -1, sy = i > 1 ? 1 : -1; return [line(x, y, x + sx * t, y), line(x, y, x, y + sy * t)]; });
  return mk([{ pen: P.black, paths: [closed(box), ...ticks] }, { pen: P.red, paths: L }], seed);
}
// the paraph: the page's mark, filled solid (FT 1), sitting on the baseline
export function paraph(fs, seed, hd = hand(seed)) {
  const r = rng(seed * 3 + 1), s = fs * (.2 + .05 * r()), c = shape(hd.mark, s, s, s, hd.mark === 'hexagon' ? r() * .5 : 0);
  return mk([{ pen: P.red, paths: [...fill(c, hd, true), closed(c)] }], seed);
}
// the filler: the page's line type, every dash a pen-down and a pen-up, fitted to end on a dash
export function filler(w, lh, seed, hd = hand(seed)) { return mk([{ pen: P.red, paths: typed([0, 0], [w, 0], hd, .7 + rng(seed)() * .3) }], seed); }
// the heading's run-out: a drafting rule as the page sets it: a double (0.7 mm to the margin, 0.3 mm lifted sooner), a
// triple, or one rule with ticks at a fixed pitch from its start (a scale)
export function runout(w, h, seed, hd = hand(seed)) {
  const r = rng(seed * 31 + 7), s = w * (.38 + .3 * r()), g = 1.4 * MM;
  if (hd.rule === 'double') return mk([{ pen: P.heavy, paths: [line(0, 0, w, 0)] }, { pen: P.red, paths: [line(0, g, s, g)] }], seed);
  if (hd.rule === 'triple') return mk([{ pen: P.black, paths: [line(0, -g, w * (.8 + .2 * r()), -g), line(0, g, s, g)] }, { pen: P.heavy, paths: [line(0, 0, w, 0)] }], seed);
  const pitch = (2 + Math.floor(r() * 3)) * MM, ticks = []; for (let x = 0, i = 0; x <= s; x += pitch, i++) ticks.push(line(x, 0, x, i % 5 ? -1.2 * MM : -2.4 * MM));
  return mk([{ pen: P.heavy, paths: [line(0, 0, w, 0)] }, { pen: P.red, paths: ticks }], seed);
}
const regMark = (cx, cap, kind) => { const r = cap * .75, c = kind === 'circle' ? closed(shape('disc', cx, 0, r)) : closed(shape('square', cx, 0, r * .8));
  return [c, line(cx - r * 1.6, 0, cx + r * 1.6, 0), line(cx, -r * 1.6, cx, r * 1.6)]; };
// the breaks. 1: points of dwell, each the pen set down and lifted (3 or 5, at a pitch the seed sets); 2: the page's line
// type, shorter, round the page's mark filled as the page fills; 3: the plot's legend (date and sheet: Nake's "13/9/65
// Nr. 2"), with what the seed adds (the scale, the pens), between registration marks
export function brk(rank, w, h, seed, fs = 19, hd = hand(seed), date = '10.11.26') {
  const r = rng(seed * 11 + rank);
  if (rank === 1) { const n = r() < .5 ? 3 : 5, g = (2.4 + r() * 1.6) * MM; return mk([{ pen: P.heavy, paths: Array.from({ length: n }, (_, i) => Object.assign(line((i - (n - 1) / 2) * g, 0, (i - (n - 1) / 2) * g + .05, 0), { fixed: true })), order: 'given' }], seed); }
  if (rank === 2) { const L = Math.min(w * (.3 + .2 * r()), 70 * MM), s = fs * .32, gap = 2.2 * MM, c = shape(hd.mark, 0, 0, s);
    return mk([{ pen: P.black, paths: [...typed([-L / 2, 0], [-s - gap, 0], hd, .6), ...typed([s + gap, 0], [L / 2, 0], hd, .6)] }, { pen: P.red, paths: [...fill(c, hd), closed(c)] }], seed); }
  const cap = Math.max(2.2 * MM, fs * .42), extra = pick(r, ['', '  1:1', '  PEN 1 0.3', '  SHEET 1/1']), text = `${date}  NR. ${seed % 1000}${extra}`, t = hershey(text, 0, cap / 2, cap, 'simplex');
  const m = cap * 2.4, x0 = -t.w / 2;
  return mk([{ pen: P.black, paths: [...t.paths.map(p => p.map(([x, y]) => [x + x0, y])), ...regMark(x0 - m, cap, hd.reg), ...regMark(-x0 + m, cap, hd.reg)] }], seed);
}
// the quotation: its corners marked as the page marks a sheet: crop marks, brackets, or registration corners
export function frame(kind, w, h, seed, fs = 19, hd = hand(seed)) {
  const r = rng(seed * 5 + 3), a = (2.6 + r() * 1.6) * MM, L = [];
  for (const [x, y, sx, sy] of [[0, 0, 1, 1], [w, 0, -1, 1], [w, h, -1, -1], [0, h, 1, -1]]) {
    if (hd.corner === 'crop') L.push([[x + sx * a, y], [x, y], [x, y + sy * a]]);
    else if (hd.corner === 'bracket') L.push([[x + sx * a * .5, y - sy * .8 * MM], [x - sx * .8 * MM, y - sy * .8 * MM], [x - sx * .8 * MM, y + sy * a]]);
    else L.push([[x + sx * a, y], [x, y], [x, y + sy * a]], line(x + sx * a * .5, y - sy * .9 * MM, x + sx * a * .5, y + sy * .9 * MM));
  }
  return mk([{ pen: P.black, paths: L }], seed);
}
