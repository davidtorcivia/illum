// Cyber, direction A: THE DRAWING OFFICE (a study; research/15-cyber.md). The engineering drawing of the electronic age as
// the drafting room made it, 1950s–80s: india ink from a technical pen (Rapidograph, Leroy scriber) on vellum or drafting
// film, one round nib per weight, the line hierarchy of the drafting standard (ANSI Y14.2: thick ≈ 2× thin); single-stroke
// template lettering (Leroy), vertical capitals; construction in non-repro blue pencil, which the print never shows.
//   drop initial: the capital lettered large on its non-repro blue lettering grid, in a heavy-ruled cell, its height dimensioned
//   paraph: an item balloon (a numbered circle: the drawing's call-out)
//   filler: a dimension line across the gap, its extension lines and arrowheads, and the figure: the gap's own length, in inches
//   frame (blockquote): the sheet's border: the trim line, the heavy border, zone marks lettered in the margin, a title block
// Letters: the Hershey Roman Simplex (A. V. Hershey, U.S. National Bureau of Standards, 1967; tools/hershey.py), the single-
// stroke roman made for plotters and vector displays, closest of the open forms to Leroy template lettering; each stroke
// written by the ink engine's pen as the scriber's pen would draw it. Everything is { marks, letters } as kit/styles/occult.js
// (printOf from there lays it); col 'k' the ink, 'g' the non-repro blue.
import { noise2 } from '../marks.js';
import { resample, printOf as occultPrint } from './occult.js';

// Hershey Roman Simplex (futural.jhf), the glyphs this style letters: { l, r, s: strokes [[x, y]...] } in Hershey units
// (cap height 21: caps from y -12 to the baseline at 9). Credit, as the distribution asks: Dr. A. V. Hershey, U.S. NBS.
export const HERSHEY = {" ":{"l":-8,"r":8,"s":[]},"#":{"l":-10,"r":11,"s":[[[1,-16],[-6,16]],[[7,-16],[0,16]],[[-6,-3],[8,-3]],[[-7,3],[7,3]]]},"&":{"l":-13,"r":13,"s":[[[10,-3],[10,-4],[9,-5],[8,-5],[7,-4],[6,-2],[4,3],[2,6],[0,8],[-2,9],[-6,9],[-8,8],[-9,7],[-10,5],[-10,3],[-9,1],[-8,0],[-1,-4],[0,-5],[1,-7],[1,-9],[0,-11],[-2,-12],[-4,-11],[-5,-9],[-5,-7],[-4,-4],[-2,-1],[3,6],[5,8],[7,9],[9,9],[10,8],[10,7]]]},"'":{"l":-5,"r":5,"s":[[[0,-10],[-1,-11],[0,-12],[1,-11],[1,-9],[0,-7],[-1,-6]]]},"(":{"l":-7,"r":7,"s":[[[4,-16],[2,-14],[0,-11],[-2,-7],[-3,-2],[-3,2],[-2,7],[0,11],[2,14],[4,16]]]},")":{"l":-7,"r":7,"s":[[[-4,-16],[-2,-14],[0,-11],[2,-7],[3,-2],[3,2],[2,7],[0,11],[-2,14],[-4,16]]]},"*":{"l":-8,"r":8,"s":[[[0,-6],[0,6]],[[-5,-3],[5,3]],[[5,-3],[-5,3]]]},"+":{"l":-13,"r":13,"s":[[[0,-9],[0,9]],[[-9,0],[9,0]]]},",":{"l":-4,"r":4,"s":[[[1,5],[0,6],[-1,5],[0,4],[1,5],[1,7],[-1,9]]]},"-":{"l":-13,"r":13,"s":[[[-9,0],[9,0]]]},".":{"l":-4,"r":4,"s":[[[0,4],[-1,5],[0,6],[1,5],[0,4]]]},"/":{"l":-11,"r":11,"s":[[[9,-16],[-9,16]]]},"0":{"l":-10,"r":10,"s":[[[-1,-12],[-4,-11],[-6,-8],[-7,-3],[-7,0],[-6,5],[-4,8],[-1,9],[1,9],[4,8],[6,5],[7,0],[7,-3],[6,-8],[4,-11],[1,-12],[-1,-12]]]},"1":{"l":-10,"r":10,"s":[[[-4,-8],[-2,-9],[1,-12],[1,9]]]},"2":{"l":-10,"r":10,"s":[[[-6,-7],[-6,-8],[-5,-10],[-4,-11],[-2,-12],[2,-12],[4,-11],[5,-10],[6,-8],[6,-6],[5,-4],[3,-1],[-7,9],[7,9]]]},"3":{"l":-10,"r":10,"s":[[[-5,-12],[6,-12],[0,-4],[3,-4],[5,-3],[6,-2],[7,1],[7,3],[6,6],[4,8],[1,9],[-2,9],[-5,8],[-6,7],[-7,5]]]},"4":{"l":-10,"r":10,"s":[[[3,-12],[-7,2],[8,2]],[[3,-12],[3,9]]]},"5":{"l":-10,"r":10,"s":[[[5,-12],[-5,-12],[-6,-3],[-5,-4],[-2,-5],[1,-5],[4,-4],[6,-2],[7,1],[7,3],[6,6],[4,8],[1,9],[-2,9],[-5,8],[-6,7],[-7,5]]]},"6":{"l":-10,"r":10,"s":[[[6,-9],[5,-11],[2,-12],[0,-12],[-3,-11],[-5,-8],[-6,-3],[-6,2],[-5,6],[-3,8],[0,9],[1,9],[4,8],[6,6],[7,3],[7,2],[6,-1],[4,-3],[1,-4],[0,-4],[-3,-3],[-5,-1],[-6,2]]]},"7":{"l":-10,"r":10,"s":[[[7,-12],[-3,9]],[[-7,-12],[7,-12]]]},"8":{"l":-10,"r":10,"s":[[[-2,-12],[-5,-11],[-6,-9],[-6,-7],[-5,-5],[-3,-4],[1,-3],[4,-2],[6,0],[7,2],[7,5],[6,7],[5,8],[2,9],[-2,9],[-5,8],[-6,7],[-7,5],[-7,2],[-6,0],[-4,-2],[-1,-3],[3,-4],[5,-5],[6,-7],[6,-9],[5,-11],[2,-12],[-2,-12]]]},"9":{"l":-10,"r":10,"s":[[[6,-5],[5,-2],[3,0],[0,1],[-1,1],[-4,0],[-6,-2],[-7,-5],[-7,-6],[-6,-9],[-4,-11],[-1,-12],[0,-12],[3,-11],[5,-9],[6,-5],[6,0],[5,5],[3,8],[0,9],[-2,9],[-5,8],[-6,6]]]},":":{"l":-4,"r":4,"s":[[[0,-3],[-1,-2],[0,-1],[1,-2],[0,-3]],[[0,4],[-1,5],[0,6],[1,5],[0,4]]]},"=":{"l":-13,"r":13,"s":[[[-9,-3],[9,-3]],[[-9,3],[9,3]]]},"A":{"l":-9,"r":9,"s":[[[0,-12],[-8,9]],[[0,-12],[8,9]],[[-5,2],[5,2]]]},"B":{"l":-11,"r":10,"s":[[[-7,-12],[-7,9]],[[-7,-12],[2,-12],[5,-11],[6,-10],[7,-8],[7,-6],[6,-4],[5,-3],[2,-2]],[[-7,-2],[2,-2],[5,-1],[6,0],[7,2],[7,5],[6,7],[5,8],[2,9],[-7,9]]]},"C":{"l":-10,"r":11,"s":[[[8,-7],[7,-9],[5,-11],[3,-12],[-1,-12],[-3,-11],[-5,-9],[-6,-7],[-7,-4],[-7,1],[-6,4],[-5,6],[-3,8],[-1,9],[3,9],[5,8],[7,6],[8,4]]]},"D":{"l":-11,"r":10,"s":[[[-7,-12],[-7,9]],[[-7,-12],[0,-12],[3,-11],[5,-9],[6,-7],[7,-4],[7,1],[6,4],[5,6],[3,8],[0,9],[-7,9]]]},"E":{"l":-10,"r":9,"s":[[[-6,-12],[-6,9]],[[-6,-12],[7,-12]],[[-6,-2],[2,-2]],[[-6,9],[7,9]]]},"F":{"l":-10,"r":8,"s":[[[-6,-12],[-6,9]],[[-6,-12],[7,-12]],[[-6,-2],[2,-2]]]},"G":{"l":-10,"r":11,"s":[[[8,-7],[7,-9],[5,-11],[3,-12],[-1,-12],[-3,-11],[-5,-9],[-6,-7],[-7,-4],[-7,1],[-6,4],[-5,6],[-3,8],[-1,9],[3,9],[5,8],[7,6],[8,4],[8,1]],[[3,1],[8,1]]]},"H":{"l":-11,"r":11,"s":[[[-7,-12],[-7,9]],[[7,-12],[7,9]],[[-7,-2],[7,-2]]]},"I":{"l":-4,"r":4,"s":[[[0,-12],[0,9]]]},"J":{"l":-8,"r":8,"s":[[[4,-12],[4,4],[3,7],[2,8],[0,9],[-2,9],[-4,8],[-5,7],[-6,4],[-6,2]]]},"K":{"l":-11,"r":10,"s":[[[-7,-12],[-7,9]],[[7,-12],[-7,2]],[[-2,-3],[7,9]]]},"L":{"l":-10,"r":7,"s":[[[-6,-12],[-6,9]],[[-6,9],[6,9]]]},"M":{"l":-12,"r":12,"s":[[[-8,-12],[-8,9]],[[-8,-12],[0,9]],[[8,-12],[0,9]],[[8,-12],[8,9]]]},"N":{"l":-11,"r":11,"s":[[[-7,-12],[-7,9]],[[-7,-12],[7,9]],[[7,-12],[7,9]]]},"O":{"l":-11,"r":11,"s":[[[-2,-12],[-4,-11],[-6,-9],[-7,-7],[-8,-4],[-8,1],[-7,4],[-6,6],[-4,8],[-2,9],[2,9],[4,8],[6,6],[7,4],[8,1],[8,-4],[7,-7],[6,-9],[4,-11],[2,-12],[-2,-12]]]},"P":{"l":-11,"r":10,"s":[[[-7,-12],[-7,9]],[[-7,-12],[2,-12],[5,-11],[6,-10],[7,-8],[7,-5],[6,-3],[5,-2],[2,-1],[-7,-1]]]},"Q":{"l":-11,"r":11,"s":[[[-2,-12],[-4,-11],[-6,-9],[-7,-7],[-8,-4],[-8,1],[-7,4],[-6,6],[-4,8],[-2,9],[2,9],[4,8],[6,6],[7,4],[8,1],[8,-4],[7,-7],[6,-9],[4,-11],[2,-12],[-2,-12]],[[1,5],[7,11]]]},"R":{"l":-11,"r":10,"s":[[[-7,-12],[-7,9]],[[-7,-12],[2,-12],[5,-11],[6,-10],[7,-8],[7,-6],[6,-4],[5,-3],[2,-2],[-7,-2]],[[0,-2],[7,9]]]},"S":{"l":-10,"r":10,"s":[[[7,-9],[5,-11],[2,-12],[-2,-12],[-5,-11],[-7,-9],[-7,-7],[-6,-5],[-5,-4],[-3,-3],[3,-1],[5,0],[6,1],[7,3],[7,6],[5,8],[2,9],[-2,9],[-5,8],[-7,6]]]},"T":{"l":-8,"r":8,"s":[[[0,-12],[0,9]],[[-7,-12],[7,-12]]]},"U":{"l":-11,"r":11,"s":[[[-7,-12],[-7,3],[-6,6],[-4,8],[-1,9],[1,9],[4,8],[6,6],[7,3],[7,-12]]]},"V":{"l":-9,"r":9,"s":[[[-8,-12],[0,9]],[[8,-12],[0,9]]]},"W":{"l":-12,"r":12,"s":[[[-10,-12],[-5,9]],[[0,-12],[-5,9]],[[0,-12],[5,9]],[[10,-12],[5,9]]]},"X":{"l":-10,"r":10,"s":[[[-7,-12],[7,9]],[[7,-12],[-7,9]]]},"Y":{"l":-9,"r":9,"s":[[[-8,-12],[0,-2],[0,9]],[[8,-12],[0,-2]]]},"Z":{"l":-10,"r":10,"s":[[[7,-12],[-7,9]],[[-7,-12],[7,-12]],[[-7,9],[7,9]]]}};

const fnv = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const rng = (seed, name) => mulberry(fnv(name + ':' + seed));
const arclen = p => p.reduce((a, q, i) => i ? a + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0);

// Hershey's points lie on a coarse grid (a bowl is six or eight straight runs); at a drop's size the facets would show, so
// the strokes are rounded by cutting their corners (Chaikin), but not the corners the letter means (turns over ~55°, as
// E's or B's joins to the stem). A closed stroke (O) is cut all round.
export function smooth(P, iters = 3, sharp = .95) {
  for (let it = 0; it < iters; it++) {
    const n = P.length, closed = n > 3 && Math.hypot(P[0][0] - P[n - 1][0], P[0][1] - P[n - 1][1]) < 1e-6, Q = closed ? P.slice(0, -1) : P, m = Q.length, out = [];
    const turn = i => { const a = Q[(i - 1 + m) % m], b = Q[i], c = Q[(i + 1) % m], u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - b[0], c[1] - b[1]];
      return Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1])); };
    for (let i = 0; i < m; i++) { const b = Q[i];
      if (!closed && (i === 0 || i === m - 1)) { out.push(b); continue; }
      if (turn(i) > sharp) { out.push(b); continue; }
      const a = Q[(i - 1 + m) % m], c = Q[(i + 1) % m]; out.push([b[0] + (a[0] - b[0]) * .25, b[1] + (a[1] - b[1]) * .25], [b[0] + (c[0] - b[0]) * .25, b[1] + (c[1] - b[1]) * .25]); }
    if (closed) out.push(out[0]); P = out; }
  return P;
}

// ---- the technical pen ------------------------------------------------------------------------------------------------------
// A tubular nib: the same width in every direction and all along (no swell in the turns, as a quill has), the ink a shade
// heavier where the pen sets down and lifts (it stands a moment on the film: a small pooled end), and a whisper of
// unevenness as the film takes it. Never under 1.3 px on a screen.
export function tpen(pts, W, { col = 'k', seed = 0, pool = .16, wob = .03, rho = 0 } = {}) {
  W = Math.max(1.3, W); const P = resample(pts, .6), L = arclen(P), n = noise2(seed * 7 + 3 | 0), o = (seed * .41) % 40;
  const press = f => { const s = f * L; return 1 + wob * 2 * (n(s / 18 + o, o) - .5) + pool * Math.exp(-s / (W * 1.1)) + pool * .8 * Math.exp(-(L - s) / (W * 1.1)); };
  return { pts: P, w: W, hair: W * .95, col, press, rho };
}
const line = (a, b, W, o) => tpen([a, b], W, o);
const rect = ([x0, y0, x1, y1], W, o = {}) => [line([x0, y0], [x1, y0], W, { ...o, seed: (o.seed ?? 0) + 1 }), line([x1, y0], [x1, y1], W, { ...o, seed: (o.seed ?? 0) + 2 }),
  line([x1, y1], [x0, y1], W, { ...o, seed: (o.seed ?? 0) + 3 }), line([x0, y1], [x0, y0], W, { ...o, seed: (o.seed ?? 0) + 4 })];

// ---- lettering ------------------------------------------------------------------------------------------------------------------
// Template lettering: each glyph's strokes in the Hershey order (the order the template's guide is run), cap height `cap`,
// the letters spaced by their own advance (Leroy spacing is the template's: even, a little open). align: 'left' | 'center' |
// 'right'. The pen's line: cap / 10 for lettering a third of an inch and over (the Leroy pen for its template), no less
// than 1.3 px for the small (a 0.25 mm pen in captions).
const SP = 1;   // (Leroy's spacing on the MIT sheets is ~24 % wider than Simplex's: research/15; the rest is `track`)
// (Leroy is set open: ~0.2 of the cap height more between letters than Simplex, a little more again when small)
const track = cap => cap * (cap < 10 ? .26 : .2);
export const textWidth = (text, cap) => [...text].reduce((a, ch) => { const g = HERSHEY[ch] ?? HERSHEY[' ']; return a + (g.r - g.l) * SP * cap / 21 + track(cap); }, 0) - (text.length ? 2 * cap / 21 + track(cap) : 0);
export function letter(text, x, base, cap, W, { align = 'left', col = 'k', seed = 0, round = cap > 30 ? 3 : cap > 12 ? 1 : 0 } = {}) {
  const k = cap / 21, w = textWidth(text, cap); let cx = (align === 'center' ? x - w / 2 : align === 'right' ? x - w : x) - 1 * k; const marks = [];
  for (const ch of text) { const g = HERSHEY[ch] ?? HERSHEY[' '];
    if (ch === '.' || ch === ',') {   // (Hershey's point is a tiny loop; the template's is the pen set down)
      const px = cx + (0 - g.l) * k, py = base - W * .3; marks.push(tpen([[px - .2, py], [px + .2, py]], W * 1.25, { col, seed: seed + marks.length * 3 }));
      if (ch === ',') marks.push(tpen([[px, py], [px - k * 1.2, py + k * 3.5]], W, { col, seed: seed + marks.length * 3 })); cx += (g.r - g.l) * SP * k + track(cap); continue; }
    g.s.forEach((s, i) => { const P = s.map(([gx, gy]) => [cx + (gx - g.l) * k, base + (gy - 9) * k]);
      if (P.length === 1) P.push([P[0][0] + .01, P[0][1]]);   // (a dot: the pen set down)
      marks.push(tpen(round ? smooth(P, round) : P, W, { col, seed: seed + marks.length * 3 + i })); });
    cx += (g.r - g.l) * SP * k + track(cap); }
  return marks;
}

// ---- marks of the drawing ------------------------------------------------------------------------------------------------------
// An arrowhead as the MIT Instrumentation Lab sheets draw it (filled, 1.4 times as long as wide), tip at `tip`, pointing along unit d, laid as ink
const arrow = (tip, d, len, col = 'k') => { const n = [-d[1], d[0]], w = len / 2.8 * .8, at = (f, o) => [tip[0] - d[0] * len * f + n[0] * o, tip[1] - d[1] * len * f + n[1] * o];
  // concave sides, the base swelling into a rounded blob where the pen stood (the MIT sheets: 1.4 : 1)
  const side = s => Array.from({ length: 7 }, (_, i) => { const f = i / 6; return at(f, s * w * (f ** 1.25)); });
  return { polys: [[...side(1), at(1.05, w * .55), at(1.1, 0), at(1.05, -w * .55), ...side(-1).reverse()]], col }; };
// line weights: the thin line (dimension, extension, lettering of notes, the grid) and the thick (borders, the object's
// outline), 1 : 2 as the standard sets them (0.35 / 0.7 mm), from the text's x-height
export const weights = u => ({ thin: Math.max(1.3, u * .12), thick: Math.max(2.4, u * .25) });
// the length a gap would have been dimensioned at on the drawing: inches (96 CSS px), two places, as decimal-inch drawings
const inches = px => (px / 96).toFixed(2);

// ---- the drop initial ----------------------------------------------------------------------------------------------------------
// The capital lettered large, as on a drawing's lettering plate: the cell ruled heavy, the non-repro blue grid it was laid
// out on (the guide lines a draftsman pencils before he inks, which the reproduction drops out), the letter in one weight
// of ink (the template pen's: cap / 12), the cap height dimensioned on the left, its figure in the small lettering.
export function initial({ ch, G, u, seed = 1, rich = .5 }) {
  const [x0, y0, x1, y1] = G.box, h = y1 - y0, w = x1 - x0, { thin, thick } = weights(u), marks = [], letters = [];
  marks.push(...rect([x0, y0, x1, y1], thick, { seed }));
  // the grid: fade-out grid vellum (Clearprint's, ten to the inch, printed in a blue the camera does not see), the
  // inch lines a shade stronger; as many squares as fit the cell, the lettering on them
  const g = h / 7, fine = h / Math.max(8, Math.round(h / 9.6)), gx0 = x0 + ((w - Math.floor(w / fine) * fine) / 2);
  for (let k = 1, y = y0 + fine; y < y1 - fine * .3; k++, y += fine) marks.push(tpen([[x0 + thick, y], [x1 - thick, y]], 1.3, { col: 'g', seed: seed + 40 + k, pool: 0, wob: .05 }));
  for (let x = gx0 + fine; x < x1 - fine * .3; x += fine) marks.push(tpen([[x, y0 + thick], [x, y1 - thick]], 1.3, { col: 'g', seed: seed + 60 + x | 0, pool: 0, wob: .05 }));
  // the letter: five units of the seven high, standing on the grid's second line from the foot, centred on the cell
  const cap = g * 5, base = y1 - g, gl = HERSHEY[ch] ?? HERSHEY.B, lw = cap / 12;   // (the MIT drawings' large numerals: ~1/12 of their height)
  const xs = gl.s.flat().map(p => p[0]), cx = (x0 + x1) / 2 + g * .35 - (Math.min(...xs) + Math.max(...xs)) / 2 * cap / 21;
  gl.s.forEach((s, i) => marks.push(tpen(smooth(s.map(([gx, gy]) => [cx + gx * cap / 21, base + (gy - 9) * cap / 21]), 4), lw, { seed: seed + 100 + i, pool: .1 })));
  // its height dimensioned in the cell's left column: extension from cap line and base line, the dimension line between
  // with its arrowheads, the figure written across it (aligned system: reading from the right)
  const dx = x0 + g * .62, a = Math.min(g * .5, u * .9), fig = inches(cap), fc = Math.max(5.5, Math.min(g * .48, u * .62));
  if (rich > .2 && g > 9) {
    const yc = base - cap / 2, fw = textWidth(fig, fc), gap = fw / 2 + fc * .5;
    marks.push(line([dx, base - cap + a], [dx, yc - gap], thin * .8, { seed: seed + 7 }), line([dx, yc + gap], [dx, base - a], thin * .8, { seed: seed + 8 }));
    letters.push(arrow([dx, base - cap], [0, -1], a), arrow([dx, base], [0, 1], a));
    // the figure turned to read from the right (as aligned dimensions on a vertical line are)
    marks.push(...letter(fig, 0, 0, fc, thin * .8, { align: 'center', seed: seed + 9 }).map(m => ({ ...m, pts: m.pts.map(([px, py]) => [dx + py + fc / 2, yc - px]) })));
  }
  return { marks, letters };
}
initial.width = () => 1.02;   // the cell a shade wider than high
initial.lines = 4;

// ---- the paraph: an item balloon ------------------------------------------------------------------------------------------------
// The circle a drawing calls out an item or a pin with, its number inside (the MIT sheets: ring ~0.09 of the balloon's
// diameter, the figure 0.36 of it): this paragraph is item n. Drawn with the circle template: one stroke round, over its start.
export function paraph(x, base, u, seed, rich = .5, n = 1) {
  const d = u * 2.1, { thin } = weights(u), c = [x + u * .85, base - u * .5], r = d / 2, pts = [];
  for (let i = 0; i <= 64; i++) { const a = -Math.PI / 2 + i / 60 * Math.PI * 2; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); }
  const fc = d * .36; return { marks: [tpen(pts, Math.max(1.3, d * .075), { seed }), ...letter(String(n), c[0], c[1] + fc / 2, fc, Math.max(1.3, fc * .16), { align: 'center', seed: seed + 3 })], letters: [] };
}

// ---- the filler: a dimension line --------------------------------------------------------------------------------------------------
// Across the gap a short line leaves: extension lines at its ends (a gap from the words, past the dimension line by a little),
// the dimension line with its arrowheads to them, broken for the figure: the gap's own length, as the drawing would state it.
export function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  const u = yBase - yTop, { thin } = weights(u), y = yBase - u * .5, L = x1 - x0, a = Math.min(u * .95, L * .12), marks = [], letters = [];
  const e0 = y - u * .95, e1 = y + u * .55;
  marks.push(line([x0, e0], [x0, e1], thin, { seed }), line([x1, e0], [x1, e1], thin, { seed: seed + 1 }));
  const fig = inches(L), fc = u * 1.02, fw = textWidth(fig, fc), mid = (x0 + x1) / 2, gap = fw / 2 + u * .4;
  letters.push(arrow([x0 + thin * .5, y], [-1, 0], a), arrow([x1 - thin * .5, y], [1, 0], a));
  if (L > fw + a * 2 + u * 3) {
    marks.push(line([x0 + a * .7, y], [mid - gap, y], thin, { seed: seed + 2 }), line([mid + gap, y], [x1 - a * .7, y], thin, { seed: seed + 3 }));
    marks.push(...letter(fig, mid, y + fc / 2, fc, thin, { align: 'center', seed: seed + 5 }));
  } else marks.push(line([x0 + a * .7, y], [x1 - a * .7, y], thin, { seed: seed + 2 }));
  return { marks, letters };
}

// ---- the frame: the sheet ------------------------------------------------------------------------------------------------------------
// Round a blockquote, the drawing sheet's border as the standard rules it (ANSI Y14.1): a thin trim line, the heavy border
// within it, the margin between marked off into zones (numbers along the top and foot, counted from the right; letters up
// the sides, counted from the foot), each zone's mark lettered in its middle; the title block in the lower right corner,
// its cells captioned small and filled in the larger lettering.
const TITLE = { title: 'THE NATURE OF GOTHIC', dwg: 'SV-II-VI', rev: 'A', drawn: 'J. RUSKIN', date: '1853', sheet: '1 OF 1' };
function quote({ box, u, seed = 1, rich = .5, tb = 0 }) {
  const { thin, thick } = weights(u), m = u * 2.1, [X0, Y0, X1, Y1] = box, marks = [], letters = [];
  const T = [X0, Y0, X1, Y1], B = [X0 + m, Y0 + m, X1 - m, Y1 - m];
  marks.push(...rect(T, thin, { seed }), ...rect(B, thick, { seed: seed + 10 }));
  // zones: about every 9 x-heights, an even count; numbers right to left, letters bottom to top
  const zc = u * .78, zw = Math.max(2, Math.round((B[2] - B[0]) / (u * 9))), zh = Math.max(2, Math.round((B[3] - B[1]) / (u * 9)));
  for (let i = 0; i <= zw; i++) { const x = B[0] + (B[2] - B[0]) * i / zw;
    if (i > 0 && i < zw) for (const [ya, yb] of [[T[1], B[1]], [B[3], T[3]]]) marks.push(line([x, ya], [x, yb], thin, { seed: seed + 20 + i }));
    if (i < zw) { const xm = B[0] + (B[2] - B[0]) * (i + .5) / zw, num = String(zw - i);
      marks.push(...letter(num, xm, T[1] + m / 2 + zc / 2, zc, thin, { align: 'center', seed: seed + 30 + i }), ...letter(num, xm, B[3] + m / 2 + zc / 2, zc, thin, { align: 'center', seed: seed + 50 + i })); } }
  for (let j = 0; j <= zh; j++) { const y = B[1] + (B[3] - B[1]) * j / zh;
    if (j > 0 && j < zh) for (const [xa, xb] of [[T[0], B[0]], [B[2], T[2]]]) marks.push(line([xa, y], [xb, y], thin, { seed: seed + 70 + j }));
    if (j < zh) { const ym = B[1] + (B[3] - B[1]) * (j + .5) / zh, l = 'ABCDEFGH'[zh - 1 - j];
      marks.push(...letter(l, T[0] + m / 2, ym + zc / 2, zc, thin, { align: 'center', seed: seed + 80 + j }), ...letter(l, T[2] - m / 2, ym + zc / 2, zc, thin, { align: 'center', seed: seed + 90 + j })); } }
  // the title block, in the lower right corner inside the border: three rows; captions small at each cell's top left, the
  // entries larger below them; the title's row the tallest
  if (tb) {
    const cc = Math.max(5.2, u * .5), ec = Math.max(7, u * .82), rh = cc + ec + u * 1.05, W = Math.min(B[2] - B[0], Math.max(u * 26, (B[2] - B[0]) * .62));
    const bx0 = B[2] - W, by0 = B[3] - rh * 3, rows = [by0, by0 + rh, by0 + rh * 2, B[3]];
    marks.push(line([bx0, by0], [B[2], by0], thick, { seed: seed + 110 }), line([bx0, by0], [bx0, B[3]], thick, { seed: seed + 111 }));
    for (const y of rows.slice(1, 3)) marks.push(line([bx0, y], [B[2], y], thin, { seed: seed + 112 + y | 0 }));
    const cell = (cx0, cx1, r, cap, entry) => { const y = rows[r], pad = u * .3;
      if (cx0 > bx0 + 1) marks.push(line([cx0, rows[r]], [cx0, rows[r + 1]], thin, { seed: seed + 120 + cx0 | 0 }));
      marks.push(...letter(cap, cx0 + pad, y + pad + cc, cc, 1.3, { seed: seed + 130 + cx0 | 0 }));
      const fit = Math.min(ec, ec * (cx1 - cx0 - pad * 2) / Math.max(1, textWidth(entry, ec)));
      marks.push(...letter(entry, (cx0 + cx1) / 2, rows[r + 1] - pad * 1.4, fit, Math.max(1.3, thin * .9), { align: 'center', seed: seed + 140 + cx0 | 0 })); };
    cell(bx0, B[2], 0, 'TITLE', TITLE.title);
    const c1 = bx0 + W * .74; cell(bx0, c1, 1, 'DWG NO.', TITLE.dwg); cell(c1, B[2], 1, 'REV', TITLE.rev);
    const d1 = bx0 + W * .42, d2 = bx0 + W * .7; cell(bx0, d1, 2, 'DRAWN', TITLE.drawn); cell(d1, d2, 2, 'DATE', TITLE.date); cell(d2, B[2], 2, 'SHEET', TITLE.sheet);
  }
  return { marks, letters };
}
export const frames = { quote };

// ---- laying it ---------------------------------------------------------------------------------------------------------------------
// The pencil's construction first, then the ink, as the drawing was made (printOf lays black before green; here the blue
// construction, col 'g', is drawn first)
export function printOf(el, o) { const p = occultPrint(el, o), ord = { g: 0, k: 1, r: 2 }; p.runs.sort((a, b) => ord[a.col] - ord[b.col]); return p; }

// Light: india ink on vellum, and the non-repro blue of the pencil (a light cyan blue). Dark: the drawing as its reverse
// print (a blueprint's white line), the pencil a dim blue.
export const palette = {
  light: { k: [26, 26, 30], g: [168, 204, 228], r: [184, 58, 38] },
  dark: { k: [226, 233, 240], g: [52, 76, 100], r: [232, 112, 84] },
};
export default { label: 'Cyber · the drawing office', initial, paraph, filler, frames, palette, printOf };
