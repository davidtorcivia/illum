// Draft: THE DRAWING OFFICE (research/15-draft.md; the user's Cyber). The engineering drawing of the electronic age as
// the drafting room made it, 1950s–80s: india ink from a technical pen (Rapidograph, Leroy scriber) on vellum or drafting
// film, one round nib per weight, the line hierarchy of the drafting standard (ANSI Y14.2: thick ≈ 2× thin); single-stroke
// template lettering (Leroy), vertical capitals; construction in non-repro blue pencil, which the print never shows.
//   drop initial: the capital as a part: in section with its call-outs, in two views, or laid out as Leroy lettering (set)
//   line initial: the part in section alone, at the line's height
//   paraph: an item balloon (a numbered circle: the drawing's call-out)
//   fillers: a dimension line stating the gap's own length in inches; a centreline ending in its symbol; a long break line
//   breaks: a cutting-plane line A–A (a chapter); the revision block (the book's end)
//   frames: quote, the sheet (zoned border, title block); figure, an enlarged detail (phantom boundary, DETAIL / SCALE);
//     code, a parts list; pull, the general notes; aside, a flagged note box; contents, the drawing list
//   ?draw: the blue construction (guidelines, grid) first, then the inking, case by case
// Letters: the Hershey Roman Simplex (A. V. Hershey, U.S. National Bureau of Standards, 1967; tools/hershey.py), the single-
// stroke roman made for plotters and vector displays, closest of the open forms to Leroy template lettering; each stroke
// written by the ink engine's pen as the scriber's pen would draw it. Everything is { marks, letters } as kit/styles/occult.js
// (printOf from there lays it); col 'k' the ink, 'g' the non-repro blue.
import { noise2 } from '../marks.js';
import { resample, occlude, printOf as occultPrint } from './occult.js';

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
    if (ch === ':') { const px = cx + (0 - g.l) * k; for (const py of [base - W * .6, base - cap * .55]) marks.push({ dot: [px, py], r: W * .62, col, pts: [] }); cx += (g.r - g.l) * SP * k + track(cap); continue; }
    if (ch === '.' || ch === ',') {   // (Hershey's point is a tiny loop; the template's is the pen set down)
      const px = cx + (0 - g.l) * k, py = base - W * .6; marks.push({ dot: [px, py], r: W * .62, col, pts: [] });
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
// The capital treated as the drawing office treats a part. Three treatments (set):
//   'part'   the letter as a machined plate in section: the Leroy capital swept by a heavy pen (as a slot is swept by an end
//            mill: the template's path, a constant width, round ends) taken as the part's outline, inked heavy; its body
//            section-lined at 45° (thin, evenly spaced, broken where a figure or leader passes over); centre marks and
//            centrelines through its counters; a radius called out on a bowl (R and the radius as the screen shows it, in
//            inches) and the stroke's width dimensioned
//   'views'  the letter as a detail in two views: the front view's outline, the right side view (the plate's thickness, its
//            counters' edges as hidden lines, dashed), "DETAIL A" underlined and "SCALE 4:1" beneath
//   'leroy'  the capital as Leroy lettering is laid on the sheet: guidelines and vertical guides in non-repro blue, the
//            letter inked over them in the template's heavy pen, the template's size (its letter height in thousandths of
//            an inch, the Leroy series) in a balloon on a leader
// The Apollo sheets' weights (research/15): outline (thick) : thin ≈ 2 : 1; section lines and centrelines thin.
const SETS = { part: 1.34, views: 1.42, leroy: 1.08 };

// the letter as a plate: the Leroy path swept by a pen of width sw, as coverage on a grid at `res` cells a px
function plate(ch, x, base, cap, sw, res = 2) {
  const gl = HERSHEY[ch] ?? HERSHEY.B, k = cap / 21, xs = gl.s.flat().map(p => p[0]);
  const strokes = gl.s.map(s => smooth(s.map(([gx, gy]) => [x + (gx - Math.min(...xs)) * k + sw / 2, base + (gy - 9) * k]), 3));
  let bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const s of strokes) for (const [px, py] of s) bb = [Math.min(bb[0], px), Math.min(bb[1], py), Math.max(bb[2], px), Math.max(bb[3], py)];
  const gx = Math.floor(bb[0] - sw), gy = Math.floor(bb[1] - sw), w = Math.ceil((bb[2] - gx + sw) * res) + 2, h = Math.ceil((bb[3] - gy + sw) * res) + 2;
  const c = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
  c.setTransform(res, 0, 0, res, -gx * res, -gy * res); c.lineWidth = sw; c.lineCap = c.lineJoin = 'round'; c.strokeStyle = '#000';
  for (const s of strokes) { c.beginPath(); s.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke(); }
  const d = c.getImageData(0, 0, w, h).data, M = new Float32Array(w * h); for (let i = 0; i < w * h; i++) M[i] = d[i * 4 + 3] / 255;
  const at = (px, py) => { const i = Math.round((px - gx) * res), j = Math.round((py - gy) * res); return i < 0 || j < 0 || i >= w || j >= h ? 0 : M[j * w + i]; };
  return { M, w, h, gx, gy, res, at, inside: (px, py) => at(px, py) > .5, box: [bb[0] - sw / 2, base - cap - sw / 2, bb[2] + sw / 2, base + sw / 2], strokes };
}
// the outline of a coverage grid at 0.5 (marching squares), as closed polylines in page px, lightly smoothed
function outline(P) {
  const { M, w, h, gx, gy, res } = P, v = (i, j) => i < 0 || j < 0 || i >= w || j >= h ? 0 : M[j * w + i], t = .5, pt = {}, adj = {};
  const key = (e, i, j) => e + i + ',' + j, lerp = (a, b) => (t - a) / (b - a || 1e-6);
  const at = (e, i, j) => { const k = key(e, i, j); if (pt[k]) return k;
    pt[k] = e === 'h' ? [i + lerp(v(i, j), v(i + 1, j)), j] : [i, j + lerp(v(i, j), v(i, j + 1))]; return k; };
  const link = (a, b) => { (adj[a] ??= []).push(b); (adj[b] ??= []).push(a); };
  for (let j = -1; j < h; j++) for (let i = -1; i < w; i++) {
    const a = v(i, j) > t, b = v(i + 1, j) > t, c = v(i + 1, j + 1) > t, d = v(i, j + 1) > t, n = a | b << 1 | c << 2 | d << 3; if (!n || n === 15) continue;
    const T = () => at('h', i, j), B = () => at('h', i, j + 1), L = () => at('v', i, j), R = () => at('v', i + 1, j);
    ({ 1: [[L, T]], 2: [[T, R]], 3: [[L, R]], 4: [[R, B]], 5: [[L, T], [R, B]], 6: [[T, B]], 7: [[L, B]], 8: [[B, L]], 9: [[T, B]], 10: [[T, R], [B, L]], 11: [[R, B]], 12: [[R, L]], 13: [[T, R]], 14: [[L, T]] })[n]
      .forEach(([p, q]) => link(p(), q())); }
  const seen = new Set(), loops = [];
  for (const s in adj) { if (seen.has(s)) continue; const loop = [s]; seen.add(s); let prev = null, cur = s;
    for (;;) { const nx = adj[cur].find(n => n !== prev && !seen.has(n)); if (!nx) break; seen.add(nx); loop.push(nx); prev = cur; cur = nx; }
    if (loop.length > 6) loops.push(loop.map(k => [gx + (pt[k][0] + .5) / res, gy + (pt[k][1] + .5) / res])); }
  // (the staircase of the grid smoothed away: a moving average over a few cells, round the closed loop)
  return loops.map(L => { const n = L.length, m = 3, out = L.map((_, i) => { let x = 0, y = 0; for (let d = -m; d <= m; d++) { const q = L[(i + d + n) % n]; x += q[0]; y += q[1]; } return [x / (2 * m + 1), y / (2 * m + 1)]; }); out.push(out[0], out[1]); return out; });
}
// the counters: the holes of the plate (regions of no ink enclosed by it), each { c: centroid, bb, n }
function counters(P) {
  const { M, w, h, gx, gy, res } = P, lab = new Int32Array(w * h).fill(-1), out = [];
  for (let s = 0; s < w * h; s++) { if (M[s] > .5 || lab[s] >= 0) continue; const st = [s], id = out.length; lab[s] = id; let edge = false, sx = 0, sy = 0, n = 0, bb = [1e9, 1e9, -1e9, -1e9];
    while (st.length) { const q = st.pop(), i = q % w, j = (q - i) / w; if (!i || !j || i === w - 1 || j === h - 1) edge = true; sx += i; sy += j; n++; bb = [Math.min(bb[0], i), Math.min(bb[1], j), Math.max(bb[2], i), Math.max(bb[3], j)];
      for (const o of [q - 1, q + 1, q - w, q + w]) if (o >= 0 && o < w * h && Math.abs((o % w) - i) <= 1 && lab[o] < 0 && M[o] <= .5) { lab[o] = id; st.push(o); } }
    out.push(edge ? null : { c: [gx + sx / n / res, gy + sy / n / res], bb: bb.map((b, k) => (k % 2 ? gy : gx) + b / res), n }); }
  return out.filter(Boolean).filter(c => c.n > 20).sort((a, b) => a.c[1] - b.c[1]);
}
// a chain line (centreline: long dash, short dash) from a to b, each dash a stroke of the pen
function chain(a, b, W, seed, o = {}) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], out = [], long = o.long ?? Math.max(7, W * 7), sh = Math.max(1.6, W * 1.4), gap = Math.max(2.2, W * 1.6);
  let s = 0, k = 0; const pat = [long, gap, sh, gap];
  while (s < L) { const len = Math.min(pat[k % 4], L - s); if (k % 2 === 0) out.push(line([a[0] + d[0] * s, a[1] + d[1] * s], [a[0] + d[0] * (s + len), a[1] + d[1] * (s + len)], W, { seed: seed + k, pool: .05 })); s += len; k++; }
  return out; }
// a hidden line (short dashes)
function dashes(a, b, W, seed) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], out = [], on = Math.max(3.5, W * 3.2), off = Math.max(2, W * 1.6);
  for (let s = 0, k = 0; s < L; s += on + off, k++) { const e = Math.min(L, s + on); out.push(line([a[0] + d[0] * s, a[1] + d[1] * s], [a[0] + d[0] * e, a[1] + d[1] * e], W, { seed: seed + k, pool: .05 })); }
  return out; }
// the text box a lettering run occupies (for keeping labels clear of lines and of each other)
const labelBox = (text, x, base, cap, align = 'left') => { const w = textWidth(text, cap), l = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; return [l - cap * .3, base - cap * 1.3, l + w + cap * .3, base + cap * .35]; };
// the box of the words in line boxes (as the browser lays them: top, base), their descenders below the base
const wordsOf = L => L?.length ? [Math.min(...L.map(l => l.left)), Math.min(...L.map(l => l.top)), Math.max(...L.map(l => l.right)), Math.max(...L.map(l => l.base + (l.base - l.top) * .35))] : null;
const hits = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const fmt = px => (px / 96).toFixed(3).replace(/^0/, '');   // inches as decimal-inch drawings write them: .250
// A page given its own seed (draft.seeded, set by kit/illum.js; 0 when the page's seed is its text's) is its own drawing
// set: its title block, its numbers and letters, the way its sections are lined and its planes cut, drawn from that seed.
// pick(name, list, dflt): the page's choice from list, or dflt (as the style was approved) for a page left to its text
const pick = (name, list, dflt) => draft.seeded ? list[(rng(draft.seeded, name)() * list.length) | 0] : dflt;

export function initial({ ch, G, u, seed = 1, rich = .5, set = 'part', big: drop = G.big }) {
  const [x0, y0, x1, y1] = G.box, h = y1 - y0, { thin, thick } = weights(u), marks = [], letters = [];
  const fc = Math.max(6.5, u * .78), tw = Math.max(1.3, thin * .9);   // the call-outs' lettering: the notes' size and pen
  if (set === 'leroy') {
    // guidelines: the cap line and base line run across the cell and a little past the letter; a waist line; vertical
    // guides at the Ames guide's even spacing, all in the blue pencil
    const cap = h * .8, base = y1 - h * .04, sw = cap / 9.5, gl = HERSHEY[ch] ?? HERSHEY.B, k = cap / 21, xs = gl.s.flat().map(p => p[0]), lx = x0 + sw;
    const blue = (a, b, s) => tpen([a, b], 1.3, { col: 'g', seed: s, pool: 0, wob: .06 });
    for (const [y, s] of [[base - cap, 1], [base, 2], [base - cap * .5, 3]]) marks.push(blue([x0, y], [x1, y], seed + s));
    for (let x = x0 + cap * .14, i = 0; x < x1; x += cap * .3, i++) marks.push(blue([x, base - cap - cap * .06], [x, base + cap * .06], seed + 10 + i));
    // (the template pen is round: the letter is its round sweep along the template's path, laid by the ink engine as one
    // deposit, so the joins merge as wet ink does and the ends are round)
    const L = plate(ch, lx - sw / 2, base, cap, sw); letters.push({ M: L.M, w: L.w, h: L.h, x0: L.gx, y0: L.gy, res: L.res, col: 'k' });
    // the balloon: the Leroy template whose letter this is (series 60 … 500, letter height in thousandths of an inch)
    const series = [60, 80, 100, 120, 140, 175, 200, 240, 290, 350, 425, 500, 700, 1000], th = cap / 96 * 1000, tmpl = series.reduce((a, b) => Math.abs(b - th) < Math.abs(a - th) ? b : a);
    const r = Math.max(fc * 1.3, textWidth(String(tmpl), fc) * .5 + fc * 1.05), bc = [x1 - r - thin, y0 + r + thin];
    const ring = Array.from({ length: 65 }, (_, i) => { const a = -Math.PI / 2 + i / 60 * Math.PI * 2; return [bc[0] + r * Math.cos(a), bc[1] + r * Math.sin(a)]; });
    marks.push(tpen(ring, thin, { seed: seed + 200 }), ...letter(String(tmpl), bc[0], bc[1] + fc / 2, fc, tw, { align: 'center', seed: seed + 210 }));
    // the leader from the balloon's edge down and left to the letter's bowl, ending in an arrowhead on its ink
    const tgt = [lx + (Math.max(...xs) - Math.min(...xs)) * k, base - cap * .74], dir = [tgt[0] - bc[0], tgt[1] - bc[1]], dl = Math.hypot(...dir), dn = [dir[0] / dl, dir[1] / dl];
    const st = [bc[0] + dn[0] * r, bc[1] + dn[1] * r], tip = [tgt[0] - dn[0] * sw * .5, tgt[1] - dn[1] * sw * .5];
    marks.push(line(st, [tip[0] - dn[0] * u * .6, tip[1] - dn[1] * u * .6], thin, { seed: seed + 220 })); letters.push(arrow(tip, dn, u * .95));
    return { marks, letters };
  }
  // the plate: the Leroy path swept at a heavy width, its outline inked thick
  // (a line initial: the part alone, at the line's cap height, its outline at the thin weight's 1.5)
  const small = drop === false, views = set === 'views', cap = small ? h : h * (views ? .68 : .8), base = small ? y1 : views ? y0 + cap + h * .04 : y1 - h * .06, sw = cap * .17;
  const P = plate(ch, x0 + (views || small ? (small ? 0 : thick) : textWidth('.000', fc) + u * 2.6), base, cap, sw), loops = outline(P), ow = small ? Math.max(1.6, thin * 1.4) : thick;
  for (const [i, L] of loops.entries()) marks.push(tpen(L, ow, { seed: seed + 300 + i, pool: .05 }));
  const holes = counters(P), taken = [];
  if (views) {
    // the right side view: the plate's thickness to the right, at the front view's height (projected across), its counters'
    // top and bottom edges as hidden lines; then the title of the detail beneath, underlined
    const t = cap * .16, sx = Math.min(x1 - t - thick, P.box[2] + cap * .32), top = P.box[1], bot = P.box[3];
    marks.push(...rect([sx, top, sx + t, bot], thick, { seed: seed + 400 }));
    holes.forEach((c, i) => { for (const y of [c.bb[1], c.bb[3]]) marks.push(...dashes([sx + thin, y], [sx + t - thin, y], thin * .9, seed + 410 + i * 7)); });
    const cy = y1 - fc * .3, tx = (x0 + x1) / 2, t1 = 'DETAIL ' + pick('ini-detail', 'ABCDEFGH', 'A'), t2 = pick('ini-scale', ['SCALE 4:1', 'SCALE 3:1', 'SCALE 5:1'], 'SCALE 4:1'), c1 = fc * 1.12;
    const b1 = cy - fc * 2.1; marks.push(...letter(t1, tx, b1, c1, Math.max(1.3, thin), { align: 'center', seed: seed + 430 }));
    const w1 = textWidth(t1, c1); marks.push(line([tx - w1 / 2, b1 + c1 * .3], [tx + w1 / 2, b1 + c1 * .3], thin, { seed: seed + 440 }));
    marks.push(...letter(t2, tx, cy, fc, tw, { align: 'center', seed: seed + 450 }));
    return { marks, letters };
  }
  // section lining: thin lines at 45°, about a ninth of the cap apart, inside the part; broken where a call-out's lettering
  // or leader passes over (true occlusion: the lettering is written on a clear patch, as a draftsman leaves one)
  const gap = Math.max(3.2, cap / (small ? 7 : 11)), R = P.box, labels = [], callouts = [], big = !small;
  if (big && rich > .15) {
    // A radius on the upper bowl, called out as the standard has it: the arc's true centre (a circle fitted to the outline
    // where the leader meets it), the leader radial, its arrowhead on the arc from outside, then a shoulder level to "R"
    // and the radius (decimal inches, as the screen draws it). The first of a few angles whose figure and leader clear the
    // ink and stay in the cell is taken.
    const bowl = holes[0];
    if (bowl) for (const deg of pick('ini-radius', [[-42, -30, -55, -18, -68], [-30, -18, -42, -55], [-55, -68, -42, -30]], [-42, -30, -55, -18, -68])) {
      const a = deg * Math.PI / 180, d = [Math.cos(a), Math.sin(a)]; let s = 0, inInk = false, p = null;
      for (; s < cap; s += .25) { const q = [bowl.c[0] + d[0] * s, bowl.c[1] + d[1] * s], ink = P.inside(...q); if (ink) inInk = true; else if (inInk) { p = q; break; } }
      if (!p) continue;
      const fit = arcAt(loops, p, cap * .16); if (!fit) continue;
      const rd = [p[0] - fit.c[0], p[1] - fit.c[1]], rl = Math.hypot(...rd), dn = [rd[0] / rl, rd[1] / rl], tip = [fit.c[0] + dn[0] * fit.r, fit.c[1] + dn[1] * fit.r];
      const txt = 'R' + fmt(fit.r), elb = [tip[0] + dn[0] * u * 1.5, tip[1] + dn[1] * u * 1.5], right = dn[0] >= 0;
      const end = [elb[0] + (right ? u * .7 : -u * .7), elb[1]], tx = end[0] + (right ? u * .3 : -u * .3), base = elb[1] + fc / 2, tb = labelBox(txt, tx, base, fc, right ? 'left' : 'right');
      const clear = tb[0] >= x0 && tb[2] <= x1 + u * .2 && tb[1] >= y0 - u * .2 && !inkIn(P, tb) && Array.from({ length: 12 }, (_, k) => [tip[0] + dn[0] * (thick * 1.4 + (u * 1.5 - thick * 1.4) * k / 11), tip[1] + dn[1] * (thick * 1.4 + (u * 1.5 - thick * 1.4) * k / 11)]).every(q => P.at(...q) < .3);
      if (!clear) continue;
      callouts.push({ tip, dn, path: [[tip[0] + dn[0] * u * .6, tip[1] + dn[1] * u * .6], elb, end], txt, tx, base, align: right ? 'left' : 'right' }); labels.push(tb); break; }
    // centre marks and centrelines through each counter: the lines run a little past the hole
    holes.forEach((c, i) => { const ex = (c.bb[2] - c.bb[0]) / 2 + u * .55, ey = (c.bb[3] - c.bb[1]) / 2 + u * .55;
      marks.push(...chain([c.c[0] - ex, c.c[1]], [c.c[0] + ex, c.c[1]], thin * .8, seed + 500 + i * 20, { long: ex * .7 }), ...chain([c.c[0], c.c[1] - ey], [c.c[0], c.c[1] + ey], thin * .8, seed + 510 + i * 20, { long: ey * .7 })); });
    // the stroke's width across the stem, from the left: two arrows pointing in to the stem's edges, the figure left of them
    const sy = P.box[3] - cap * .3, sxs = []; for (let x = P.box[0]; x < P.box[0] + cap * .5; x += .25) { const ink = P.inside(x, sy); if (ink !== (sxs.length % 2 === 1)) sxs.push(x); if (sxs.length === 2) break; }
    if (sxs.length === 2) { const [a, b] = sxs, al = u * .8, fig = fmt(b - a);
      marks.push(line([a - al * 2.2, sy], [a - al * .4, sy], thin, { seed: seed + 600 }), line([b + al * .4, sy], [b + al * 1.4, sy], thin, { seed: seed + 601 }));
      letters.push(arrow([a, sy], [1, 0], al), arrow([b, sy], [-1, 0], al));
      labels.push(labelBox(fig, a - al * 2.4, sy + fc / 2, fc, 'right'));
      marks.push(...lettered(fig, a - al * 2.4, sy + fc / 2, fc, tw, { align: 'right', seed: seed + 610 })); }
    for (const c of callouts) { marks.push(tpen(c.path, thin, { seed: seed + 620 })); letters.push(arrow(c.tip, [-c.dn[0], -c.dn[1]], u * .8));
      marks.push(...lettered(c.txt, c.tx, c.base, fc, tw, { align: c.align, seed: seed + 630 })); }
  }
  // the lining: every line clipped to the ink, less a margin from the outline (the lines stop at the outline's ink, not
  // on it) and less the label patches
  const mg = ow * .6, hideL = p => !(P.at(p[0], p[1]) > .5 && P.at(p[0] + mg, p[1]) > .3 && P.at(p[0] - mg, p[1]) > .3 && P.at(p[0], p[1] + mg) > .3 && P.at(p[0], p[1] - mg) > .3) || labels.some(b => p[0] > b[0] && p[0] < b[2] && p[1] > b[1] && p[1] < b[3]);
  // (a page of its own seed may line its sections the other way, at 135°, and a little closer or wider, as another
  // draftsman's sheet; the same way on every part of the page)
  const back = pick('lining', [false, true], false), gp = gap * pick('lining-gap', [1, .85, 1.2], 1);
  for (let c = R[0] - (R[3] - R[1]), i = 0; c < R[2] + (back ? R[3] - R[1] : 0); c += gp, i++) {
    const seg = back ? [[c, R[3]], [c - (R[3] - R[1]), R[1]]] : [[c, R[3]], [c + (R[3] - R[1]), R[1]]];
    for (const q of occlude(seg, hideL, 1.5)) marks.push(tpen(q, thin * .8, { seed: seed + 700 + i, pool: .04 })); }
  return { marks, letters };
}
// is there ink of the plate inside box b
const inkIn = (P, b) => { for (let y = b[1]; y <= b[3]; y += 1) for (let x = b[0]; x <= b[2]; x += 1) if (P.at(x, y) > .3) return true; return false; };
// the circle through the outline near p: the loop nearest p, its points within `span` of the nearest along the loop, fitted
// by least squares (Kåsa: x² + y² + Dx + Ey + F = 0)
function arcAt(loops, p, span) {
  let best = null; for (const L of loops) L.forEach((q, i) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (!best || d < best.d) best = { d, L, i }; });
  if (!best) return null; const { L, i } = best, n = L.length - 2, pts = [L[i]];
  for (const dir of [1, -1]) { let s = 0; for (let k = 1; k < n / 2; k++) { const a = L[((i + dir * (k - 1)) % n + n) % n], b = L[((i + dir * k) % n + n) % n]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); if (s > span) break; pts.push(b); } }
  if (pts.length < 6) return null;
  let Sxx = 0, Sxy = 0, Syy = 0, Sx = 0, Sy = 0, Sxz = 0, Syz = 0, Sz = 0; const N = pts.length;
  for (const [x, y] of pts) { const z = x * x + y * y; Sxx += x * x; Sxy += x * y; Syy += y * y; Sx += x; Sy += y; Sxz += x * z; Syz += y * z; Sz += z; }
  // [Sxx Sxy Sx; Sxy Syy Sy; Sx Sy N] [D E F] = -[Sxz Syz Sz]
  const A = [[Sxx, Sxy, Sx, -Sxz], [Sxy, Syy, Sy, -Syz], [Sx, Sy, N, -Sz]];
  for (let c = 0; c < 3; c++) { let m = c; for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r; [A[c], A[m]] = [A[m], A[c]];
    if (Math.abs(A[c][c]) < 1e-9) return null; for (let r = 0; r < 3; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 4; k++) A[r][k] -= f * A[c][k]; } }
  const D = A[0][3] / A[0][0], E = A[1][3] / A[1][1], F = A[2][3] / A[2][2], c = [-D / 2, -E / 2], r = Math.sqrt(Math.max(0, c[0] * c[0] + c[1] * c[1] - F));
  return r > 1 && r < span * 8 ? { c, r } : null;
}
initial.width = (ch, o = {}) => SETS[o.set ?? 'part'] ?? 1.1;   // (o: the initial's options, { set })
initial.line = () => .86;
initial.lines = 5;
initial.phone = 3;     // on a narrow measure three: the drawing keeps its views, the words beside it more than a word or two
initial.margin = .5;
initial.fills = true;   // (its box is the float as the page laid it)


// ---- the paraph: an item balloon ------------------------------------------------------------------------------------------------
// The circle a drawing calls out an item or a pin with, its number inside (the MIT sheets: ring ~0.09 of the balloon's
// diameter, the figure 0.36 of it): this paragraph is item n. Drawn with the circle template: one stroke round, over its start.
export function paraph(x, base, u, seed, rich = .5, n = 1) {
  // (a page of its own seed numbers its items from its own place in the list, and may call them out as flagged notes)
  n += pick('item-base', [0, 3, 6, 10, 14], 0);
  if (pick('item-form', ['balloon', 'flag'], 'balloon') === 'flag') { const s = u * 2.4, h = s * Math.sqrt(3) / 2, c = [x + u * .85, base - u * .3], fc = s * .3;
    const A = [c[0], c[1] - h * .62], B = [c[0] + s / 2, c[1] + h * .38], C = [c[0] - s / 2, c[1] + h * .38];
    return { marks: [tpen([A, B, C, A, [A[0] + (B[0] - A[0]) * .06, A[1] + (B[1] - A[1]) * .06]], Math.max(1.3, s * .07), { seed }), ...letter(String(n), c[0], B[1] - s * .17, fc, Math.max(1.3, fc * .17), { align: 'center', seed: seed + 3 })], letters: [] }; }
  const d = u * 2.1, { thin } = weights(u), c = [x + u * .85, base - u * .5], r = d / 2, pts = [];
  for (let i = 0; i <= 64; i++) { const a = -Math.PI / 2 + i / 60 * Math.PI * 2; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); }
  const fc = d * .36; return { marks: [tpen(pts, Math.max(1.3, d * .075), { seed }), ...letter(String(n), c[0], c[1] + fc / 2, fc, Math.max(1.3, fc * .16), { align: 'center', seed: seed + 3 })], letters: [] };
}

// ---- the fillers -------------------------------------------------------------------------------------------------------------------
// kinds: 'dim' a dimension line across the gap, stating its own length; 'center' a centreline (chain line: long dash, short
// dash) ending in the centreline symbol (℄: a C and an L laid one over the other, ANSI Y14.2); 'break' a long break line (a
// thin ruled line with freehand zigzags where the view is broken off). A heading's: none.
export const FILLERS = ['dim', 'center', 'break'];
export const kinds = (v, rich = .5) => rich < .25 ? ['dim'] : FILLERS;
export function filler(x0, x1, yTop, yBase, kind = 'dim', seed = 1, rich = .5) {
  const u = yBase - yTop, { thin } = weights(u), y = yBase - u * .5, L = x1 - x0, marks = [], letters = [];
  if (kind === 'rule') return { marks, letters };   // (a heading's: none)
  if (kind === 'center') {
    const s = u * 1.25, xe = x1 - s * 1.1;
    marks.push(...chain([x0, y], [xe - u * .9, y], thin, seed, { long: u * 3.4 }));
    // ℄: the C and the L at the line's end, the L's foot on the line
    const k = s / 21, C = HERSHEY.C, Lg = HERSHEY.L, cx = xe + s * .35;
    // (the L's stem through the C's middle, its foot running out to the right)
    for (const [g, dx] of [[C, 0], [Lg, 6.5]]) g.s.forEach((st, i) => marks.push(tpen(smooth(st.map(([gx, gy]) => [cx + (gx + dx) * k, y + s * .45 + (gy - 9) * k]), 1), thin, { seed: seed + 9 + i + dx })));
    return { marks, letters };
  }
  if (kind === 'break') {
    // zigzags every ~14 x-heights, each a quick Z of the freehand pen: up a, across the gap, down 2a, up to the line
    const n = Math.max(1, Math.round(L / (u * 16))), a = u * .62, z = u * .5, pts = [[x0, y]], r = rng(seed, 'break');
    for (let i = 0; i < n; i++) { const xc = x0 + L * (i + .5) / n + (r() - .5) * u; pts.push([xc - z, y], [xc - z * .35, y - a], [xc + z * .35, y + a], [xc + z, y]); }
    pts.push([x1, y]); marks.push(tpen(pts, thin, { seed, wob: .05 })); return { marks, letters };
  }
  const a = Math.min(u * .95, L * .12), e0 = y - u * .95, e1 = y + u * .55;
  marks.push(line([x0, e0], [x0, e1], thin, { seed }), line([x1, e0], [x1, e1], thin, { seed: seed + 1 }));
  const fig = inches(L), fc = u * 1.02, fw = textWidth(fig, fc), mid = (x0 + x1) / 2, gap = fw / 2 + u * .4;
  letters.push(arrow([x0 + thin * .5, y], [-1, 0], a), arrow([x1 - thin * .5, y], [1, 0], a));
  // (fine: the figure toleranced, ±.01 after it, the ± ruled as the template has it: a plus over a bar)
  const tc = fc * .8, pm = fc * .62, tw = u * .35 + pm + u * .2 + textWidth('.01', tc);
  if (rich >= .75 && L > fw + tw + a * 2 + u * 3) {
    const g0 = mid - (fw + tw) / 2, px = g0 + fw + u * .35 + pm / 2, py = y - fc * .12, tx = px + pm / 2 + u * .2;
    marks.push(line([x0 + a * .7, y], [g0 - u * .4, y], thin, { seed: seed + 2 }), line([g0 + fw + tw + u * .4, y], [x1 - a * .7, y], thin, { seed: seed + 3 }));
    marks.push(...letter(fig, g0, y + fc / 2, fc, thin, { seed: seed + 5 }), ...letter('.01', tx, y + fc / 2, tc, thin, { seed: seed + 8 }));
    marks.push(line([px - pm / 2, py], [px + pm / 2, py], thin, { seed: seed + 9 }), line([px, py - pm / 2], [px, py + pm / 2], thin, { seed: seed + 10 }), line([px - pm / 2, y + fc / 2], [px + pm / 2, y + fc / 2], thin, { seed: seed + 11 }));
  } else if (L > fw + a * 2 + u * 3) {
    marks.push(line([x0 + a * .7, y], [mid - gap, y], thin, { seed: seed + 2 }), line([mid + gap, y], [x1 - a * .7, y], thin, { seed: seed + 3 }));
    marks.push(...letter(fig, mid, y + fc / 2, fc, thin, { align: 'center', seed: seed + 5 }));
  } else marks.push(line([x0 + a * .7, y], [x1 - a * .7, y], thin, { seed: seed + 2 }));
  return { marks, letters };
}

// ---- breaks ------------------------------------------------------------------------------------------------------------------------
// rank 1 (a chapter): a cutting-plane line, as a section view is called out: the thick chain line (a long dash and two
// short) across the measure, its ends turned with arrows pointing the way the section is viewed, the section's letter at
// each arrow (A, B, C … skipping I, O, Q, S, X, Z, as the standard does). rank 2 (the book's end): the revision block, its
// one revision: the drawing released.
const SECT = 'ABCDEFGHJKLMNPRTUVWY';
// the revision block's rows: the approved one first, the others a page of its own seed may carry
const REVS = [[['A', 'RELEASED', '1853', 'J. R.'], ['B', 'REDRAWN', '2026', 'ILLUM']], [['A', 'PRELIM RELEASE', '1851', 'J. R.'], ['B', 'RELEASED', '1853', 'J. R.']],
  [['C', 'ADDED NOTES', '1853', 'E. C. G.'], ['D', 'REDRAWN', '2026', 'ILLUM']], [['A', 'ISSUED FOR USE', '1849', 'J. R.'], ['B', 'NOTES REVISED', '1880', 'J. R.']]];
export function breakMark(cx, y, measure, rank, seed = 1, rich = .5, u = 9, n = 1) {
  const { thin, thick } = weights(u), marks = [], letters = [], fc = Math.max(7, u * 1.15);
  if (rank === 2) {
    // (lavish: a second revision under the first, the drawing redrawn: the block a row deeper)
    const W = Math.min(measure * .92, u * 54), x0 = cx - W / 2, x1 = cx + W / 2, cc = Math.max(5.5, u * .55), ec = Math.max(6.5, u * .75), rh = ec + u * 1.3, nr = rich >= 1 ? 4 : 3, y0 = y - rh * (nr > 3 ? 2 : 1.5);
    const cols = [0, .1, .62, .8, 1].map(f => x0 + W * f), rows = Array.from({ length: nr + 1 }, (_, k) => y0 + rh * k), foot = rows[nr];
    marks.push(...rect([x0, y0, x1, foot], thick, { seed }));
    for (const yy of rows.slice(1, nr)) marks.push(line([x0, yy], [x1, yy], thin, { seed: seed + yy | 0 }));
    for (const xx of cols.slice(1, 4)) marks.push(line([xx, rows[1]], [xx, foot], thin, { seed: seed + xx | 0 }));
    marks.push(...lettered('REVISIONS', cx, rows[1] - (rh - ec) / 2, ec, Math.max(1.3, thin), { align: 'center', seed: seed + 20 }));
    const heads = ['REV', 'DESCRIPTION', 'DATE', 'APPROVED'], vals = pick('revs', REVS, REVS[0]).slice(0, nr - 2);
    heads.forEach((h, i) => { const m = (cols[i] + cols[i + 1]) / 2, w = cols[i + 1] - cols[i] - u * .6;
      marks.push(...lettered(h, m, rows[2] - (rh - cc) / 2, Math.min(cc, cc * w / textWidth(h, cc)), 1.3, { align: 'center', seed: seed + 30 + i }));
      vals.forEach((v, r) => marks.push(...lettered(v[i], m, rows[3 + r] - (rh - ec) / 2, Math.min(ec, ec * w / textWidth(v[i], ec)), Math.max(1.3, thin * .9), { align: 'center', seed: seed + 40 + i + r * 7 }))); });
    return { marks, letters };
  }
  const L = Math.min(measure * .9, u * 70), x0 = cx - L / 2, x1 = cx + L / 2, ch = SECT[(n - 1 + pick('sect', [0, 1, 2, 3, 5, 7], 0)) % SECT.length], tl = u * 1.6, al = u * 1.1;
  // the cutting plane: thick; long dash ~6 x-heights, two short ~1, gaps ~.7; the end segments solid, turned at 90°
  // (a page of its own seed may draw it in the standard's other form: long dashes, one short between)
  const pat = pick('plane', [[u * 6, u * .7, u * 1, u * .7, u * 1, u * .7], [u * 5, u * .8, u * 1.3, u * .8, u * 5, u * .8, u * 1.3, u * .8]], [u * 6, u * .7, u * 1, u * .7, u * 1, u * .7]); let s = x0 + tl * 1.2, k = 0;
  marks.push(line([x0, y], [x0 + tl * 1.2, y], thick, { seed }), line([x1 - tl * 1.2, y], [x1, y], thick, { seed: seed + 1 }));
  while (s < x1 - tl * 1.2 - u) { const len = Math.min(pat[k % pat.length], x1 - tl * 1.2 - s); if (k % 2 === 0) marks.push(line([s, y], [s + len, y], thick, { seed: seed + 3 + k })); s += len; k++; }
  for (const x of [x0, x1]) { marks.push(line([x, y], [x, y + tl], thin, { seed: seed + x | 0 })); letters.push(arrow([x, y + tl + al * .9], [0, 1], al));
    marks.push(...lettered(ch, x + (x === x0 ? -1 : 1) * u * 1.6, y + tl + al * .4, fc, Math.max(1.3, thin * 1.1), { align: 'center', guide: false, seed: seed + 50 + x | 0 })); }
  // (fine: the view the plane cuts named under its middle, as the section is titled on the sheet)
  if (rich >= .75) { const t = `SECTION ${ch}-${ch}`, c = fc * .8, w = textWidth(t, c), b = y + tl + al * .4;
    marks.push(...lettered(t, cx, b, c, Math.max(1.3, thin), { align: 'center', guide: false, seed: seed + 70 }), line([cx - w / 2, b + c * .32], [cx + w / 2, b + c * .32], thin, { seed: seed + 71 })); }
  return { marks, letters };
}

// ---- lettering with its guidelines --------------------------------------------------------------------------------------------------
// Lettering in a block (a title, a table, a note) laid between two guidelines a draftsman ruled first in non-repro blue
// (an Ames guide's), the base line and the cap line, a little longer than the words; then the letters inked over them.
function lettered(text, x, base, cap, W, o = {}) {
  const w = textWidth(text, cap), l = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, m = cap * 1.2;
  const g = o.guide === false || cap < 9 ? [] : [base, base - cap].map((yy, i) => tpen([[l - m, yy], [l + w + m, yy]], 1.3, { col: 'g', seed: (o.seed ?? 0) + 900 + i, pool: 0, wob: .05 }));
  return [...g, ...letter(text, x, base, cap, W, o)];
}

// ---- the frame: the sheet ------------------------------------------------------------------------------------------------------------
// Round a blockquote, the drawing sheet's border as the standard rules it (ANSI Y14.1): a thin trim line, the heavy border
// within it, the margin between marked off into zones (numbers along the top and foot, counted from the right; letters up
// the sides, counted from the foot), each zone's mark lettered in its middle; the title block in the lower right corner,
// its cells captioned small and filled in the larger lettering.
const TITLE = { title: 'THE NATURE OF GOTHIC', dwg: 'SV-II-VI', rev: 'A', drawn: 'J. RUSKIN', date: '1853', sheet: '1 OF 1' };
// (the sheets a page of its own seed may be drawn on: the same book's other chapters, its other drawings)
const TITLES = [TITLE, { title: 'THE LAMP OF TRUTH', dwg: 'SL-II-IV', rev: 'B', drawn: 'J. RUSKIN', date: '1849', sheet: '2 OF 7' },
  { title: 'THE LAMP OF MEMORY', dwg: 'SL-VI-XX', rev: 'A', drawn: 'J. RUSKIN', date: '1849', sheet: '6 OF 7' },
  { title: 'THE WALL VEIL', dwg: 'SV-I-V', rev: 'C', drawn: 'J. RUSKIN', date: '1851', sheet: '3 OF 30' },
  { title: 'GOTHIC PALACES', dwg: 'SV-II-VII', rev: 'A', drawn: 'J. RUSKIN', date: '1853', sheet: '7 OF 8' }];
// Where the page leaves the words too little room inside the border (lines: the quotation's line boxes), the border is
// drawn round them a little clear and the sheet's margin stands outside the box, narrower where the page's edge (limit)
// comes near (its zones then unlettered); the title block only where it stands clear of the words.
function quote({ box, u, seed = 1, rich = .5, tb = 0, lines = null, limit = null }) {
  const { thin, thick } = weights(u), [X0, Y0, X1, Y1] = box, marks = [], letters = [], d = u * 1.2, W = wordsOf(lines);
  let m = u * 2.1, T = [X0, Y0, X1, Y1], B = [X0 + m, Y0 + m, X1 - m, Y1 - m];
  if (W && (W[0] - d < B[0] || W[1] - d < B[1] || W[2] + d > B[2] || W[3] + d > B[3])) {
    B = [Math.min(B[0], W[0] - d), Math.min(B[1], W[1] - d), Math.max(B[2], W[2] + d), Math.max(B[3], W[3] + d)];
    if (limit) m = Math.max(u * .6, Math.min(m, B[0] - limit[0] - 2, limit[1] - B[2] - 2));
    T = [B[0] - m, B[1] - m, B[2] + m, B[3] + m]; }
  const zoned = m >= u * 1.5 && rich >= .25;   // (plain: the zones marked off, not lettered)
  marks.push(...rect(T, thin, { seed }), ...rect(B, thick, { seed: seed + 10 }));
  // zones: about every 9 x-heights, an even count; numbers right to left, letters bottom to top
  const zc = u * .78, zw = Math.max(2, Math.round((B[2] - B[0]) / (u * 9))), zh = Math.max(2, Math.round((B[3] - B[1]) / (u * 9)));
  for (let i = 0; i <= zw; i++) { const x = B[0] + (B[2] - B[0]) * i / zw;
    if (i > 0 && i < zw) for (const [ya, yb] of [[T[1], B[1]], [B[3], T[3]]]) marks.push(line([x, ya], [x, yb], thin, { seed: seed + 20 + i }));
    if (i < zw && zoned) { const xm = B[0] + (B[2] - B[0]) * (i + .5) / zw, num = String(zw - i);
      marks.push(...letter(num, xm, T[1] + m / 2 + zc / 2, zc, thin, { align: 'center', seed: seed + 30 + i }), ...letter(num, xm, B[3] + m / 2 + zc / 2, zc, thin, { align: 'center', seed: seed + 50 + i })); } }
  for (let j = 0; j <= zh; j++) { const y = B[1] + (B[3] - B[1]) * j / zh;
    if (j > 0 && j < zh) for (const [xa, xb] of [[T[0], B[0]], [B[2], T[2]]]) marks.push(line([xa, y], [xb, y], thin, { seed: seed + 70 + j }));
    if (j < zh && zoned) { const ym = B[1] + (B[3] - B[1]) * (j + .5) / zh, l = 'ABCDEFGH'[zh - 1 - j];
      marks.push(...letter(l, T[0] + m / 2, ym + zc / 2, zc, thin, { align: 'center', seed: seed + 80 + j }), ...letter(l, T[2] - m / 2, ym + zc / 2, zc, thin, { align: 'center', seed: seed + 90 + j })); } }
  // the title block, in the lower right corner inside the border: three rows; captions small at each cell's top left, the
  // entries larger below them; the title's row the tallest
  if (tb && rich >= .5) { const TITLE = pick('title', TITLES, TITLES[0]);
    const cc = Math.max(5.2, u * .5), ec = Math.max(7, u * .82), rh = cc + ec + u * 1.5, W = Math.min(B[2] - B[0], Math.max(u * 26, (B[2] - B[0]) * .62));
    const bx0 = B[2] - W, by0 = B[3] - rh * 3, rows = [by0, by0 + rh, by0 + rh * 2, B[3]];
    if (lines?.some(l => l.right > bx0 - u * .3 && wordsOf([l])[3] > by0 - u * .3)) return { marks, letters };   // (no room for it beside the words)
    marks.push(line([bx0, by0], [B[2], by0], thick, { seed: seed + 110 }), line([bx0, by0], [bx0, B[3]], thick, { seed: seed + 111 }));
    for (const y of rows.slice(1, 3)) marks.push(line([bx0, y], [B[2], y], thin, { seed: seed + 112 + y | 0 }));
    const cell = (cx0, cx1, r, cap, entry) => { const y = rows[r], pad = u * .3;
      if (cx0 > bx0 + 1) marks.push(line([cx0, rows[r]], [cx0, rows[r + 1]], thin, { seed: seed + 120 + cx0 | 0 }));
      marks.push(...lettered(cap, cx0 + pad, y + pad + cc, cc, 1.3, { seed: seed + 130 + cx0 | 0 }));
      const fit = Math.min(ec, ec * (cx1 - cx0 - pad * 2) / Math.max(1, textWidth(entry, ec)));
      marks.push(...lettered(entry, (cx0 + cx1) / 2, rows[r + 1] - pad * 1.4, fit, Math.max(1.3, thin * .9), { align: 'center', seed: seed + 140 + cx0 | 0 })); };
    cell(bx0, B[2], 0, 'TITLE', TITLE.title);
    const c1 = bx0 + W * .74; cell(bx0, c1, 1, 'DWG NO.', TITLE.dwg); cell(c1, B[2], 1, 'REV', TITLE.rev);
    const d1 = bx0 + W * .42, d2 = bx0 + W * .7; cell(bx0, d1, 2, 'DRAWN', TITLE.drawn); cell(d1, d2, 2, 'DATE', TITLE.date); cell(d2, B[2], 2, 'SHEET', TITLE.sheet);
  }
  return { marks, letters };
}
// ---- the other frames ------------------------------------------------------------------------------------------------------------------
// a phantom line (thin: a long dash and two short), the line a detail's boundary is drawn in
function phantom(a, b, W, seed) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], out = [], pat = [Math.max(14, W * 12), Math.max(2.2, W * 1.6), Math.max(1.8, W * 1.3), Math.max(2.2, W * 1.6), Math.max(1.8, W * 1.3), Math.max(2.2, W * 1.6)];
  let s = 0, k = 0; while (s < L) { const len = Math.min(pat[k % 6], L - s); if (k % 2 === 0) out.push(line([a[0] + d[0] * s, a[1] + d[1] * s], [a[0] + d[0] * (s + len), a[1] + d[1] * (s + len)], W, { seed: seed + k, pool: .05 })); s += len; k++; }
  return out; }
// figure: the figure as an enlarged detail: its boundary in a phantom line round it, and under it the detail's name
// underlined and its scale ("DETAIL B", "SCALE 2:1"), the letter the chapter's
// (caption: the caption's box; where it comes up under the boundary, the name and scale are lettered below it instead, the
// scale left off where the page's room (room: [top, bottom], two x-heights kept clear of what follows) will not take it,
// and both where it will not take the name)
function figure({ box, u, seed = 1, n = 1, caption = null, room = null, limit = null, rich = .5 }) {
  const { thin } = weights(u), [X0, Y0, X1, Y1] = box, p = u * 1.4, B = [X0 - p, Y0 - p, X1 + p, Y1 + p], marks = [];
  for (const [a, b, i] of [[[B[0], B[1]], [B[2], B[1]], 1], [[B[2], B[1]], [B[2], B[3]], 2], [[B[2], B[3]], [B[0], B[3]], 3], [[B[0], B[3]], [B[0], B[1]], 4]]) marks.push(...phantom(a, b, thin, seed + i * 40));
  // (fine: the detail's width dimensioned over it; lavish: its height too, at its right, the figure read from the foot of
  // the sheet as unidirectional dimensions are; each only where the page leaves it room)
  const dc = Math.max(6.5, u * .8), al = u * .8, ext = (a, b, k) => line(a, b, thin * .8, { seed: seed + 300 + k }), dims = [];
  if (rich >= .75 && (!room || B[1] - u * 1.8 - dc > room[0] + u * .4)) { const yd = B[1] - u * 1.6, t = inches(X1 - X0), w = textWidth(t, dc), mx = (X0 + X1) / 2;
    dims.push(ext([X0, Y0 - u * .4], [X0, yd - u * .5], 1), ext([X1, Y0 - u * .4], [X1, yd - u * .5], 2), line([X0 + al * .7, yd], [mx - w / 2 - u * .4, yd], thin, { seed: seed + 303 }), line([mx + w / 2 + u * .4, yd], [X1 - al * .7, yd], thin, { seed: seed + 304 }),
      ...letter(t, mx, yd + dc / 2, dc, thin, { align: 'center', seed: seed + 305 }), { arrows: [arrow([X0 + thin * .5, yd], [-1, 0], al), arrow([X1 - thin * .5, yd], [1, 0], al)] }); }
  const th = inches(Y1 - Y0), hw = textWidth(th, dc), xd = B[2] + hw / 2 + u * .9;
  if (rich >= 1 && (!limit || xd + hw / 2 + u * .4 < limit[1] - 2)) { const my = (Y0 + Y1) / 2;
    dims.push(ext([X1 + u * .4, Y0], [xd + u * .5, Y0], 3), ext([X1 + u * .4, Y1], [xd + u * .5, Y1], 4), line([xd, Y0 + al * .7], [xd, my - dc * 1.15], thin, { seed: seed + 306 }), line([xd, my + dc * 1.15], [xd, Y1 - al * .7], thin, { seed: seed + 307 }),
      ...letter(th, xd, my + dc / 2, dc, thin, { align: 'center', seed: seed + 308 }), { arrows: [arrow([xd, Y0 + thin * .5], [0, -1], al), arrow([xd, Y1 - thin * .5], [0, 1], al)] }); }
  const letters = dims.flatMap(d => d.arrows ?? []); marks.push(...dims.filter(d => !d.arrows));
  if (rich < .25) return { marks, letters };   // (plain: the boundary alone)
  const c1 = Math.max(7.5, u * 1.05), c2 = Math.max(6.5, u * .8), cx = (X0 + X1) / 2, t1 = 'DETAIL ' + SECT[(n + 1 + pick('detail', [0, 2, 4, 6], 0)) % SECT.length], w1 = textWidth(t1, c1);
  let b1 = B[3] + u * 1.2 + c1; const foot = b => b + c1 * .32 + u * .7 + c2 * 1.35;
  if (caption && caption[1] < foot(b1) + u * .4) { b1 = caption[3] + u * .9 + c1;
    if (room && b1 + c1 * .35 + u * 2 > room[1]) return { marks, letters };
    if (room && foot(b1) + u * 2 > room[1]) { marks.push(...lettered(t1, cx, b1, c1, Math.max(1.3, thin), { align: 'center', seed: seed + 5 }), line([cx - w1 / 2, b1 + c1 * .32], [cx + w1 / 2, b1 + c1 * .32], thin, { seed: seed + 6 })); return { marks, letters }; } }
  marks.push(...lettered(t1, cx, b1, c1, Math.max(1.3, thin), { align: 'center', seed: seed + 5 }), line([cx - w1 / 2, b1 + c1 * .32], [cx + w1 / 2, b1 + c1 * .32], thin, { seed: seed + 6 }));
  if (rich >= .5) marks.push(...lettered(pick('fig-scale', ['SCALE 2:1', 'SCALE 3:1', 'SCALE 4:1', 'SCALE 3:2'], 'SCALE 2:1'), cx, b1 + c1 * .32 + u * .7 + c2, c2, Math.max(1.3, thin * .9), { align: 'center', seed: seed + 7 }));
  return { marks, letters };
}
// code: a parts list: the code's lines its rows, ruled thin between; a column of item numbers at the left; the head row
// ("ITEM", "DESCRIPTION") above; the list ruled heavy round
// starts: the tops of the rows that begin a line of the code (a line the box wraps runs on in its item's row, unruled)
function code({ box, rows, starts = null, u, seed = 1 }) {
  const { thin, thick } = weights(u), [X0, Y0, X1, Y1] = box, marks = [], cc = Math.max(5.6, u * .62), ic = Math.max(6.5, u * .78);
  const hr = rows[0].top - Y0, colX = rows[0].left - u * 1.4, tops = rows.map(r => r.top), bot = Y1;
  marks.push(...rect([X0, Y0, X1, bot], thick, { seed }), line([X0, Y0 + hr], [X1, Y0 + hr], thick, { seed: seed + 1 }), line([colX, Y0], [colX, bot], thin, { seed: seed + 2 }));
  const begins = r => !starts || starts.some(t => Math.abs(t - r.top) < 3);
  rows.slice(1).forEach((r, i) => { if (begins(r)) marks.push(line([X0, r.top], [X1, r.top], thin, { seed: seed + 10 + i })); });
  const [hi, hd] = pick('list', [['ITEM', 'DESCRIPTION'], ['FIND NO.', 'NOMENCLATURE'], ['ITEM', 'NOMENCLATURE OR DESCRIPTION']], ['ITEM', 'DESCRIPTION']);
  const hb = Y0 + hr / 2 + cc / 2; marks.push(...lettered(hi, (X0 + colX) / 2, hb, Math.min(cc, cc * (colX - X0 - u * .5) / textWidth(hi, cc)), 1.3, { align: 'center', seed: seed + 3 }), ...lettered(hd, colX + u * .9, hb, cc, 1.3, { seed: seed + 4 }));
  let item = pick('item-base', [0, 3, 6, 10, 14], 0); rows.forEach((r, i) => { if (begins(r)) marks.push(...letter(String(++item), (X0 + colX) / 2, r.base, ic, Math.max(1.3, thin * .9), { align: 'center', seed: seed + 20 + i })); });
  return { marks, letters: [] };
}
// pull: the general notes: "NOTES:" above, and the quotation as note 1, its numeral hung in the margin
function pull({ lines, u, seed = 1, n = 1 }) {
  const { thin } = weights(u), L0 = lines[0], hc = Math.max(7.5, u * 1.05), nc = Math.max(7.5, u * 1.05), marks = [];
  marks.push(...lettered(pick('notes', ['NOTES:', 'GENERAL NOTES:', 'NOTES:'], 'NOTES:'), L0.left, L0.top - u * 1.3, hc, Math.max(1.3, thin), { seed }));
  marks.push(...lettered(n + '.', L0.left - u * .9, L0.base, nc, Math.max(1.3, thin), { align: 'right', seed: seed + 3 }));
  return { marks, letters: [] };
}
// aside: a note in its box, flagged: the thin box round it and, on its upper left corner, the flag (the triangle a drawing
// flags a note with) carrying the note's number
// (lines: the note's line boxes; the box drawn just clear of them where the page sets it closer)
function aside({ box, u, seed = 1, n = 1, lines = null }) {
  const W = wordsOf(lines), d = u * .6, [X0, Y0, X1, Y1] = W ? [Math.min(box[0], W[0] - d), Math.min(box[1], W[1] - d), Math.max(box[2], W[2] + d), Math.max(box[3], W[3] + d)] : box, { thin } = weights(u), marks = [], s = u * 2.4, h = s * Math.sqrt(3) / 2, c = [X0 + s * .9, Y0];
  const A = [c[0], c[1] - h * .62], Bp = [c[0] + s / 2, c[1] + h * .38], C = [c[0] - s / 2, c[1] + h * .38];
  // the box's top is broken where the flag stands on it
  marks.push(line([X0, Y0], [C[0] - thin, Y0], thin, { seed }), line([Bp[0] + thin, Y0], [X1, Y0], thin, { seed: seed + 1 }), line([X1, Y0], [X1, Y1], thin, { seed: seed + 2 }), line([X1, Y1], [X0, Y1], thin, { seed: seed + 3 }), line([X0, Y1], [X0, Y0], thin, { seed: seed + 4 }));
  marks.push(tpen([A, Bp, C, A, [A[0] + (Bp[0] - A[0]) * .06, A[1] + (Bp[1] - A[1]) * .06]], thin, { seed: seed + 5 }));
  const fc = s * .34; marks.push(...letter(String(n), c[0], c[1] + h * .38 - s * .12, fc, Math.max(1.3, fc * .17), { align: 'center', seed: seed + 6 }));
  return { marks, letters: [] };
}
// nav: the drawing list (the sheet index of a set): "SHEET" and "TITLE" over the entries, each entry's sheet number in the
// column to its left, the rows ruled, the list boxed
function nav({ box, entries, u, seed = 1 }) {
  const { thin, thick } = weights(u), cc = Math.max(5.6, u * .62), ic = Math.max(6.5, u * .8), marks = [], rh = entries.length > 1 ? entries[1].top - entries[0].top : u * 3.5;
  const eL = Math.min(...entries.map(e => e.left)), X0 = eL - u * 5, colX = eL - u * 1.1, X1 = Math.max(...entries.map(e => e.right)) + u * 2.2, Y0 = entries[0].top - rh * .9, top = entries[0].top - rh * .1, Y1 = entries.at(-1).top + rh * .9;
  marks.push(...rect([X0, Y0, X1, Y1], thick, { seed }), line([X0, top], [X1, top], thin, { seed: seed + 1 }), line([colX, Y0], [colX, Y1], thin, { seed: seed + 2 }));
  entries.slice(1).forEach((e, i) => marks.push(line([X0, e.top - rh * .1], [X1, e.top - rh * .1], thin, { seed: seed + 10 + i })));
  const hb = (Y0 + top) / 2 + cc / 2;
  const [sh, ti] = pick('index', [['SHEET', 'TITLE'], ['DWG', 'TITLE'], ['SHEET', 'DESCRIPTION']], ['SHEET', 'TITLE']), s0 = pick('sheet-base', [1, 1, 2, 3], 1);
  marks.push(...lettered(sh, (X0 + colX) / 2, hb, Math.min(cc, cc * (colX - X0 - u * .5) / textWidth(sh, cc)), 1.3, { align: 'center', seed: seed + 3 }), ...lettered(ti, colX + u * .9, hb, cc, 1.3, { seed: seed + 4 }));
  entries.forEach((e, i) => marks.push(...letter(String(i + s0), (X0 + colX) / 2, e.base, ic, Math.max(1.3, thin * .9), { align: 'center', seed: seed + 20 + i })));
  return { marks, letters: [] };
}
export const frames = { quote: a => quote({ tb: 1, ...a }), figure, code, pull, aside, nav };


// ---- laying it ---------------------------------------------------------------------------------------------------------------------
// The pencil's construction first, then the ink, as the drawing was made (printOf lays black before green; here the blue
// construction, col 'g', is drawn first)
// (a lettering point, { dot }, is laid as ink, as the pen set down: a round blot, not a stroke)
export function printOf(el, o) {
  const all = (el.marks ?? []).flat(3), dots = all.filter(m => m.dot).map(m => ({ dot: m.dot, r: m.r, col: m.col }));
  el = { ...el, marks: all.filter(m => !m.dot), letters: [...(el.letters ?? []), ...dots] };
  const ready = (el.letters ?? []).filter(L => L.M), p = occultPrint({ ...el, letters: (el.letters ?? []).filter(L => !L.M) }, o), ord = { g: 0, k: 1, r: 2 };
  p.runs.sort((a, b) => ord[a.col] - ord[b.col]); p.letters.push(...ready.map(L => ({ ...L, wet: .06, dry: .28 }))); return p; }

// Light: india ink on vellum, and the non-repro blue of the pencil (a light cyan blue). Dark: the drawing as its reverse
// print (a blueprint's white line), the pencil a dim blue.
export const palette = {
  light: { k: [26, 26, 30], g: [168, 204, 228], r: [184, 58, 38] },
  dark: { k: [226, 233, 240], g: [52, 76, 100], r: [232, 112, 84] },
};
export const loadFace = async () => {};   // (Hershey's letters are data: nothing to load)
initial.load = loadFace;

// ---- in the one library (kit/illum.js) ---------------------------------------------------------------------------------------
// rubricate(root, { style: 'draft' }) lays tests/draft.html. The registry gives a paraph its number among the paragraphs
// (7th argument: the balloon calls out item k), a break its number among its rank (A–A, B–B …), the code frame its rows
// and the tops of its own lines (starts); a pull quote is a block of general notes, its quotation note 1.
const itemParaph = (x, base, u, seed, rich, _n, k = 1) => paraph(x, base, u, seed, rich, k);
// (the cutting plane stands a little above the break's middle: its arrows and letters hang below it)
const placedBreak = (cx, y, measure, rank, seed, rich, u, n = 1) => breakMark(cx, rank < 2 ? y - u * 1.2 : y, measure, rank, seed, rich, u, n);
const lib = { ...frames, pull: a => frames.pull({ ...a, n: 1 }) };
// A case made ready to lay: its lettering, arrowheads and points as coverage, its lines in runs (the blue first)
const print = (made, { dpr = 1, animate = false }) => ({ ...printOf(made, { res: dpr >= 1.5 ? 2 : 1, merge: !animate }), marks: (made.marks ?? []).flat(3).filter(m => !m.dot) });
// A case on a hand's clock (seconds): the construction, then the inking, run by run; then the lettering and arrowheads,
// laid over the lines (a large letter at a hand's pace, the small quickly, each begun before the last is done). At most
// `cap`: a drop initial 4.2 s, a break 4, the contents 1.2, a paraph, filler, line initial or pull quote 1.4, the rest 2.6
function timeline(pr, kind) {
  const own = []; let u = 0;
  for (const r of pr.runs) { const L = r.strokes.reduce((a, s) => a + s.L, 0), d = Math.max(.05, L / 320 + r.strokes.length * .03); own.push({ t0: u, t1: u + d, run: r }); u += d; }
  for (const L of pr.letters) { const sz = Math.max(L.w, L.h) / L.res, d = sz > 60 ? 1.6 : sz > 30 ? .6 : .3; own.push({ t0: u, t1: u + d, letter: L, over: true }); u += d * .7 + .03; }
  return { own, u, cap: kind === 'drop' ? 4.2 : kind === 'chapter' || kind === 'book' ? 4 : kind === 'nav' ? 1.2 : ['paraph', 'filler', 'initial', 'pull'].includes(kind) ? 1.4 : 2.6 };
}
export const draft = { label: 'Draft', setup: () => ({}), kinds,
  fillAt: { gap: .9, head: 4, rise: 1 },   // a filler starts .9 x-heights after the words (a heading's: none)
  hurry: [4, 1, 1.5, 1.6], steady: ['drop'],   // as you read, a hand behind quickens (a second at the least), never on the drop
  inks: ['g', 'k', 'r'],   // a still lays all the blue construction, then the ink, then the lettering over it
  paraph: itemParaph, filler, breakMark: placedBreak, initial, frames: lib, palette, print, timeline,
  printOf, FILLERS, loadFace };
export default draft;
