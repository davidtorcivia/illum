// Nouveau's pieces (research/19-nouveau.md): A (le fouet) and B (la plante), each piece built as a plate (nouveau-print.js)
// in its own px, its origin at its top left; kit/styles/nouveau.js places them on the page and prints them.
//   A  the line (Combinaisons ornementales, 1901; Obrist, 1895): the whip rises from the letter's foot following its
//      bowls at a fixed distance (an echo of the letter, then a hairline doubling it), lifts off over the letter's top and
//      winds into a spiral with a solid eye; a stem from the same root crosses it and opens into a seed head.
//   B  the plant in a panel (Grasset, La plante, 1896): the ground laid, the letter applied in rose with a contour that has
//      a hand, then iris blades and a stem grown up the letter's side (the stem following its bowls), the iris where the
//      panel's gap is widest, a furled bud on a branch over the letter's shoulder.
// Each builder returns { P, W, H } (a Plate in piece px); the page prints it with render().
import { stream } from '../marks.js';
import { bspline, curl, curlStart, even, stroke, path, shape, contour, placeLetter } from './nouveau-line.js';
import { Plate } from './nouveau-print.js';
import { iris, poppy, bud, blade, stem, umbel, organ } from './nouveau-flora.js';
import { dist } from '../inkletter.js';

export const PAL = {
  fouet: { light: { letter: [52, 48, 32], whip: [184, 112, 52], olive: [96, 106, 56], k: [52, 48, 32] },
           dark: { letter: [224, 208, 168], whip: [218, 154, 86], olive: [158, 170, 104], k: [224, 208, 168] } },
  plante: { light: { ground: [226, 224, 198], leaf: [126, 140, 80], leafD: [90, 104, 56], leafB: [172, 180, 128], iris: [122, 98, 150], irisD: [84, 62, 110], irisL: [200, 194, 210], irisLD: [158, 146, 178],
                     beard: [216, 160, 56], poppy: [206, 106, 78], poppyD: [170, 74, 58], poppyB: [104, 44, 52], crown: [118, 128, 92], letter: [186, 98, 76], k: [54, 48, 34] },
            dark: { ground: [46, 50, 36], leaf: [104, 122, 68], leafD: [76, 92, 50], leafB: [140, 154, 100], iris: [126, 102, 160], irisD: [94, 72, 126], irisL: [178, 170, 194], irisLD: [140, 130, 160],
                    beard: [224, 172, 72], poppy: [208, 106, 80], poppyD: [168, 76, 60], poppyB: [88, 38, 44], crown: [118, 130, 90], letter: [212, 128, 102], k: [214, 192, 138] } },
};
export const ORDER = { fouet: ['olive', 'whip', 'letter', 'k'], plante: ['ground', 'leafB', 'leaf', 'leafD', 'irisL', 'irisLD', 'iris', 'irisD', 'beard', 'poppy', 'poppyD', 'poppyB', 'crown', 'letter', 'k'] };
export const KEYS = { fouet: ['letter', 'whip', 'olive', 'k'], plante: ['k'] };
export const PENS = { fouet: ['whip', 'olive'] };
// B in watercolour: the same drawing, its colours laid as washes (nouveau-ink.js washPour), the key a finer sepia line
export const PALW = { light: { ...PAL.plante.light, k: [98, 76, 54] }, dark: { ...PAL.plante.dark, k: [200, 178, 128] } };
export const WASH = { damp: ['leaf', 'leafB', 'iris', 'poppy', 'irisL'], all: { ink: .32, edge: 1, bloom: .5, gran: .28 }, ground: { ink: .2, bloom: 1, edge: .8, gran: .12 }, leafD: { soft: 1.2, ink: .34, bloom: 0 }, irisD: { soft: 1, ink: .36, bloom: 0 },
  irisLD: { soft: 1.2, ink: .3, bloom: 0 }, poppyD: { soft: 1, ink: .34, bloom: 0 }, poppyB: { soft: .8, ink: .4, bloom: 0 }, beard: { bloom: 0, ink: .42 }, letter: { ink: .4, bloom: .35 } };
let LINE = 1; export const setLine = v => { LINE = v; };

const hairOf = H => Math.max(.62, H * .0048);   // a hairline's half-width: ≥ 1.25 device px wide at dpr 1
// An echo of the letter's right side: for each height from y0 to y1, its rightmost ink, d further out, smoothed (as a
// draughtsman runs a line beside a form at a constant distance), going up
function echo(Lt, d, y0, y1, solid) {
  const x0 = Math.floor(Lt.loops.flat().reduce((m, p) => Math.min(m, p[0]), 1e9)) - 2, w = Math.ceil(Lt.w) + 6, h = Math.ceil(y1 - y0) + 1, sc = 2;
  const g = new OffscreenCanvas(w * sc, h * sc).getContext('2d', { willReadFrequently: true }); g.setTransform(sc, 0, 0, sc, -x0 * sc, -y0 * sc); g.fill(solid);
  const im = g.getImageData(0, 0, w * sc, h * sc).data, xs = [];
  for (let j = 0; j < h * sc; j++) { let xr = -1; for (let i = w * sc - 1; i >= 0; i--) if (im[(j * w * sc + i) * 4 + 3] > 100) { xr = i; break; } xs.push(xr < 0 ? null : x0 + xr / sc + d); }
  // (closed over a quarter of the cap: a notch narrower than that, a C's mouth, an E's arms, an M's shoulder, is bridged, so
  // the echo runs past it, not into it where the channel round the letter would cut it to pieces)
  const R = Math.round((Lt.bottom - Lt.top) * .25 * sc), win = (A, f) => A.map((_, j) => { let m = null; for (let k = Math.max(0, j - R); k <= Math.min(A.length - 1, j + R); k++) if (A[k] != null) m = m == null ? A[k] : f(m, A[k]); return A[j] == null ? null : m; });
  const cl = win(win(xs, Math.max), Math.min);
  let pts = cl.map((x, j) => x == null ? null : [x, y0 + j / sc]).filter(Boolean);
  for (let pass = 0; pass < 4; pass++) pts = pts.map((p, i) => { let x = 0, m = 0; for (let k = -6; k <= 6; k++) { const o = pts[i + k]; if (o) { x += o[0]; m++; } } return [x / m, p[1]]; });
  return pts.reverse();
}
// the letter as a solid (its outer outlines only, its counters filled): what a channel is cut round
function solidOf(Lt) { const ar = L => { let A = 0; for (let i = 0; i < L.length; i++) { const a = L[i], b = L[(i + 1) % L.length]; A += a[0] * b[1] - b[0] * a[1]; } return A; };
  const big = Lt.loops.reduce((m, L) => Math.abs(ar(L)) > Math.abs(ar(m)) ? L : m), sg = Math.sign(ar(big)), P = new Path2D();
  for (const L of Lt.loops) if (Math.sign(ar(L)) === sg) { P.moveTo(...L[0]); for (const p of L) P.lineTo(...p); P.closePath(); } return P; }
const sample = (run, k) => { const o = []; for (let i = 0; i < k; i++) o.push(run[Math.round(i / (k - 1) * (run.length - 1))]); return o; };
// clearance: distance (px) from any point to what feat() paints
function clearance(W, H, feat, sc = 2) {
  const w = Math.ceil(W / sc), h = Math.ceil(H / sc), g = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
  g.scale(1 / sc, 1 / sc); feat(g); const im = g.getImageData(0, 0, w, h).data, f = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) f[i] = im[i * 4 + 3] > 40;
  const D = dist(f, w, h); return (x, y) => D[Math.max(0, Math.min(h - 1, y / sc | 0)) * w + Math.max(0, Math.min(w - 1, x / sc | 0))] * sc;
}

const pen = (P, ink, S, o = {}) => P.fill(ink, path(S), { knock: false, ...o, S });   // a line the pen will write
// ==== A · le fouet ==============================================================================================================
function fouetInitial(J, H, seed) {
  const r = stream(seed, 'fouet-i'), hair = hairOf(H), cap = H * .6, lx = H * .2, base = H * .97, Lt = placeLetter(J, lx, base, cap), W = lx + Lt.w + H * .34, P = new Plate();
  const cut = { path: solidOf(Lt), w: H * .05 }, right = lx + Lt.w;
  // the echo: the letter's right side at a fixed distance, from its foot up to its shoulder
  const solid = solidOf(Lt), run = echo(Lt, H * .07, Lt.top + cap * .12, base - cap * .06, solid);
  const ec = run.length > 8 ? sample(run, 6) : [[right + H * .07, base - cap * .3], [right + H * .07, Lt.top + cap * .3]];
  const top = Math.max(H * .045, Lt.top - H * .26), rx = Math.max(...ec.map(p => p[0]));
  const root = [ec[0][0] + H * .02, H * .995];
  const mainCp = [root, ...ec, [rx + H * .03, Lt.top - H * .02], [rx - H * .02, top + H * .02], [lx + Lt.w * .45, top - H * .005], [H * .1, top + H * .02], [H * .055, top + H * .1]];
  const main = curl(bspline(mainCp, 30), -1.15, H * .03);
  const Sm = stroke(main, { hair, a: { kind: 'point', len: H * .2, fat: hair * 6 }, b: { kind: 'club', len: H * .14, fat: hair * 2.4 }, eye: 1, swell: .6, press: .55 });
  pen(P, 'whip', Sm, { cut });
  // the doubling: a hairline beside the whip along the bowls, taken up and put down again
  const run2 = echo(Lt, H * .13, Lt.top + cap * .35, base - cap * .3, solid);
  if (run2.length > 8) pen(P, 'whip', stroke(sample(run2, 5), { hair: hair * .7, a: { kind: 'taper', len: H * .08 }, b: { kind: 'point', len: H * .07, fat: hair * 2.2 } }), { cut });
  // the counter-stem: from the root, across the whip, up into the seed head in the corner
  const node = [W - H * .08, H * .22 + r() * H * .02], mid = ec[Math.floor(ec.length / 2)];
  const second = bspline([[root[0] + H * .03, H * .995], [mid[0] + H * .13, base - cap * .25], [mid[0] + H * .02, mid[1] - H * .02], [rx + H * .1, Lt.top + cap * .2], node], 30);
  pen(P, 'olive', stroke(second, { hair: hair * .9, a: { kind: 'taper', len: H * .1 }, press: .35 }), { cut });
  umbel(P, node, -Math.PI / 2 - .3, H * .15, r, { n: 9, fan: 1.7, ink: 'olive', kw: hair * 1.3 });
  // a shoot off the whip, as Obrist's thorns: a short curve out into a seed-shaped bud (from the whip as the hand drew it,
  // which wanders off the planned line)
  const j0 = main[Math.round(main.length * .42)], j = Sm.p.reduce((b, q) => Math.hypot(q[0] - j0[0], q[1] - j0[1]) < Math.hypot(b[0] - j0[0], b[1] - j0[1]) ? q : b), sh = bspline([j, [j[0] + H * .05, j[1] + H * .01], [j[0] + H * .12, j[1] - H * .02], [j[0] + H * .16, j[1] - H * .08]], 16);
  pen(P, 'whip', stroke(sh, { hair: hair * .8, a: { kind: 'hair' }, b: { kind: 'point', len: H * .09, fat: hair * 3.6 } }), { cut });
  P.fill('letter', Lt.path);
  return { P, W, H };
}
// two whips in counterpoint, the second turned half round the centre; a spiral with its eye at one end of each, a seed-
// shaped swell at the other; a hairline doubling each for a stretch
function counterBreak(W, h, seed, rank = 1) {
  const hair = hairOf(h * 1.7), cy = h / 2, P = new Plate();
  for (const [s, ink] of [[-1, 'olive'], [1, 'whip']]) {
    const T = q => s > 0 ? q : [W - q[0], h - q[1]];
    const cp = [[W * .14, cy - h * .02], [W * .26, cy + h * .26], [W * .45, cy + h * .14], [W * .6, cy - h * .2], [W * .78, cy - h * .3], [W * .93, cy - h * .36]].map(T);
    const pts = curlStart(bspline(cp, 26), 1.3, h * .055).reverse();
    pen(P, ink, stroke(pts, { hair, a: { kind: 'point', len: h * .5, fat: hair * 5.5 }, b: { kind: 'club', len: h * .3, fat: hair * 2.2 }, eye: 1, swell: .5, press: .5 }));
    const dbl = bspline([[W * .3, cy + h * .33], [W * .45, cy + h * .23], [W * .58, cy - h * .06]].map(T), 16);
    pen(P, ink, stroke(dbl, { hair: hair * .65, a: { kind: 'taper', len: h * .3 }, b: { kind: 'point', len: h * .25, fat: hair * 2 } }));
  }
  // (a higher rank: a seed head rising from where they cross)
  if (rank > 1) { const r = stream(seed, 'fouet-u'), nd = [W / 2, cy - h * .06]; pen(P, 'olive', stroke(bspline([[W / 2 + h * .05, cy + h * .14], [W / 2, cy + h * .04], nd], 10), { hair: hair * .8, a: { kind: 'taper', len: h * .1 } })); umbel(P, nd, -Math.PI / 2 - .1, h * .3, r, { n: 9, fan: 1.6, ink: 'olive', kw: hair * 1.2 }); }
  return { P, W, H: h };
}
function spiralFiller(w, h, seed) {
  const hair = hairOf(h * 4), y = h * .62, L = Math.min(w, h * 9), P = new Plate();
  const pts = curl(bspline([[0, y], [L * .3, y + h * .12], [L * .62, y - h * .1], [L - h * 1.1, y - h * .04]], 20), -1.2, h * .075);
  pen(P, 'whip', stroke(pts, { hair, a: { kind: 'taper', len: h * .8 }, b: { kind: 'club', len: h * .5, fat: hair * 2 }, eye: 1, press: .5 }));
  pen(P, 'whip', stroke(bspline([[L * .28, y + h * .26], [L * .45, y + h * .2], [L * .6, y + h * .02]], 12), { hair: hair * .65, a: { kind: 'taper', len: h * .5 }, b: { kind: 'point', len: h * .4, fat: hair * 1.8 } }));
  return { P, W: L, H: h };
}

// ==== B · la plante ==============================================================================================================
function planteInitial(J, H, seed) {
  const r = stream(seed, 'plante-i'), lw = LINE * Math.max(.8, H * .0075), cap = H * .56, lx = H * .1, base = H * .9, Lt = placeLetter(J, lx, base, cap), W = lx + Lt.w + H * .38, P = new Plate();
  const x0 = lw, y0 = lw, x1 = W - lw, y1 = H - lw, rad = (x1 - x0) / 2, arch = [];
  for (let i = 0; i <= 40; i++) { const a = Math.PI + Math.PI * i / 40; arch.push([(x0 + x1) / 2 + Math.cos(a) * rad, y0 + rad * .55 + Math.sin(a) * rad * .55]); }
  const panel = [[x0, y1], ...arch, [x1, y1]], panelPath = shape(panel), cut = { path: solidOf(Lt), w: H * .045 };
  P.fill('ground', panelPath);
  // where the panel's gap is widest, up beside the letter: the flower
  const D = clearance(W, H, g => { g.fillStyle = g.strokeStyle = '#000'; g.fill(Lt.path); g.lineWidth = 3; g.stroke(panelPath); });
  let best = null; for (let y = H * .12; y < H * .5; y += 1.5) for (let x = lx + Lt.w * .5; x < W - H * .05; x += 1.5) { const d = D(x, y) - Math.abs(y - H * .27) * .2; if (!best || d > best[2]) best = [x, y, d]; }
  const fs = Math.min(D(best[0], best[1]) * 1.9, H * .36), fx = best[0], fy = best[1] + fs * .3, foot = [W - H * .15, H + 2];
  // blades out of the foot: one rising along the panel's edge and turning over, one leaning in behind the letter's foot
  blade(P, [[foot[0] + H * .02, H + 2], [W - H * .07, H * .62], [W - H * .06, H * .32], [W - H * .1 - r() * H * .02, H * .14]], H * .038, r, { twist: .62, kw: lw * .8, cut });
  blade(P, [[foot[0] - H * .03, H + 2], [foot[0] - H * .1, H * .78], [lx + Lt.w * .78, H * .6]], H * .034, r, { kw: lw * .8, cut });
  // the stem: up the letter's side following its bowls, then free to the flower; a branch carries a bud over its shoulder
  const run = echo(Lt, H * .085, Lt.top + cap * .3, base - cap * .12, cut.path), ec = run.length > 8 ? sample(run, 4) : [];
  const stemPts = bspline([foot, [foot[0] - H * .03, H * .86], ...ec, [fx + H * .02, fy + fs * .45], [fx, fy + fs * .05]], 30);
  stem(P, stemPts, { w: lw * .75, cut, footLen: H * .1 });
  const j = stemPts[Math.round(stemPts.length * .72)], tipB = [lx + Lt.w * .5, Lt.top - H * .07];
  const br = stem(P, bspline([j, [j[0] - H * .02, j[1] - H * .1], [tipB[0] + H * .12, tipB[1] - H * .03], tipB], 24), { w: lw * .55, cut, foot: 'taper', footLen: H * .03 });
  const e = br.p.at(-1), q = br.p.at(-10); bud(P, e, H * .16, Math.atan2(e[1] - q[1], e[0] - q[0]), r, { kind: 'iris', kw: lw * .75, cut });
  blade(P, [[foot[0] + H * .01, H + 2], [foot[0] + H * .02, H * .76], [W - H * .12, H * .56]], H * .03, r, { kw: lw * .8, cut, ink: 'leaf' });
  iris(P, [fx, fy], fs, -Math.PI / 2 - .1 + (r() - .5) * .1, r, { kw: lw * .8, cut });
  // the letter: its rose, then its contour with the hand
  P.fill('letter', Lt.path);
  const L2 = new Path2D(); for (const L of Lt.loops) contour(L, { w: lw * 1.5, lo: .3, lift: .3, inset: .25, tip: 1.2, solid: Lt.path }, L2); P.line(L2);
  // the panel's contour, heavy, and a hairline inside it
  P.line(contour(panel, { w: lw * 2.2, lo: .45, inset: .5, tip: .4 }));
  const s2 = 1 - H * .05 / W, inner = panel.map(([x, y]) => [W / 2 + (x - W / 2) * s2, H + (y - H) * (1 - .03)]);
  P.line(contour(inner, { w: lw * .6, lo: .5, inset: .5, tip: .4, lift: .2 }));
  return { P, W, H };
}
function planteBreak(W, h, seed, rank = 1) {
  const r = stream(seed, 'plante-b'), lw = LINE * Math.max(.8, h * .014), cx = W / 2, by = h * .86, P = new Plate();
  for (const m of [-1, 1]) {
    const X = x => cx + m * x;
    blade(P, [[X(W * .04), by + h * .02], [X(W * .14), by - h * .1], [X(W * .28), by - h * .24], [X(W * .32 + r() * W * .01), by - h * .5]], h * .07, r, { twist: m > 0 ? .7 : null, kw: lw * .85 });
    const pts = curl(bspline([[X(0), by], [X(W * .1), by + h * .05], [X(W * .22), by + h * .03], [X(W * .31), by - h * .1], [X(W * .35), by - h * .3]], 28), m * .45, h * .09);
    const S = stem(P, pts, { w: lw * .8, foot: 'hair' }), e = S.p.at(-1), q = S.p.at(-10);
    if (rank > 1) iris(P, e, h * .44, Math.atan2(e[1] - q[1], e[0] - q[0]) + m * .25, r, { kw: lw * .7 }); else bud(P, e, h * .26, Math.atan2(e[1] - q[1], e[0] - q[0]), r, { kw: lw * .8 });
  }
  stem(P, bspline([[cx, by + h * .03], [cx, by - h * .2], [cx, by - h * .335]], 10), { w: lw * .9, foot: 'point', footLen: h * .12 });
  poppy(P, [cx, by - h * .52], h * .62, -Math.PI / 2, r, { kw: lw * .85 });
  return { P, W, H: h };
}
function planteFiller(w, h, seed) {
  const r = stream(seed, 'plante-f'), lw = LINE * Math.max(.8, h * .035), y = h * .66, L = Math.min(w, h * 6), P = new Plate();
  const pts = curl(bspline([[0, y], [L * .35, y + h * .06], [L * .55, y - h * .02], [L * .72, y - h * .3]], 20), .3, h * .2);
  const S = stem(P, pts, { w: lw * .7, foot: 'taper', footLen: h * .6 });
  const j = S.p[Math.round(S.p.length * .35)];
  blade(P, [j, [j[0] + h * .2, j[1] - h * .14], [j[0] + h * .6, j[1] - h * .28], [j[0] + h * 1.15, j[1] - h * .24]], h * .1, r, { kw: lw * .8, twist: .66 });
  const e = S.p.at(-1), q = S.p.at(-10); bud(P, e, h * .44, Math.atan2(e[1] - q[1], e[0] - q[0]), r, { kw: lw * .8 });
  return { P, W: L, H: h };
}

export const DIRS = {
  fouet: { name: 'A · Le fouet', initial: fouetInitial, brk: fouetBreak, filler: fouetFiller, refs: [['comb11-whip.jpg', 'Combinaisons ornementales, pl. 11'], ['comb58-spiral.jpg', 'pl. 58'], ['comb30-umbel.jpg', 'pl. 30']] },
  plante: { name: 'B · La plante', initial: planteInitial, brk: planteBreak, filler: planteFiller, refs: [['grasset1-iris.jpg', 'Grasset, La plante, pl. 1'], ['grasset4-poppy.jpg', 'pl. 4'], ['grasset2-iris-applied.jpg', 'pl. 2']] },
};

// ==== the smaller pieces (the full style) ========================================================================================
// A letter in the line: the letter alone painted, with one small growth off it (B: a leaf and a bud curling from its foot;
// A: a whip from its shoulder winding into a spiral). H: the cap height; returns { P, W, H } with the letter's baseline at H.
function smallInitial(kind, J, H, seed) {
  const r = stream(seed, 'small'), P = new Plate(), cap = H, Lt = placeLetter(J, H * .04, H, cap), W = Lt.w + H * (kind === 'fouet' ? .5 : .55), cut = { path: solidOf(Lt), w: H * .05 };
  if (kind === 'fouet') { const hair = Math.max(.55, H * .012), x = Lt.w + H * .06;
    pen(P, 'whip', stroke(curl(bspline([[x - H * .02, H * .98], [x + H * .1, H * .6], [x + H * .02, H * .25], [x + H * .2, H * .08], [x + H * .36, H * .16]], 20), 1.1, H * .05), { hair, a: { kind: 'point', len: H * .3, fat: hair * 4 }, b: { kind: 'club', len: H * .2, fat: hair * 2 }, eye: 1, press: .5 }), { cut });
    P.fill('letter', Lt.path); return { P, W, H }; }
  const lw = Math.max(.7, H * .016), x = Lt.w + H * .02;
  const S = stem(P, curl(bspline([[x - H * .1, H * .98], [x + H * .12, H * .9], [x + H * .22, H * .55], [x + H * .2, H * .3]], 20), .3, H * .12), { w: lw * .7, foot: 'taper', footLen: H * .2, cut });
  blade(P, [[x, H * .95], [x + H * .2, H * .78], [x + H * .42, H * .7]], H * .07, r, { kw: lw * .8, cut });
  const e = S.p.at(-1), q = S.p.at(-8); bud(P, e, H * .3, Math.atan2(e[1] - q[1], e[0] - q[0]), r, { kw: lw * .8, cut });
  P.fill('letter', Lt.path);
  const L2 = new Path2D(); for (const L of Lt.loops) contour(L, { w: lw * 1.3, lo: .3, lift: .3, inset: .25, tip: 1.2, solid: Lt.path }, L2); P.line(L2);
  return { P, W, H };
}
// The paraph: a sign in the indent, its foot on the baseline (h tall, w wide). B: a nodding poppy bud on its hooked stem
// with one leaf; A: a little whip, a seed-shaped swell at its foot, winding into an eye.
function paraphPiece(kind, w, h, seed) {
  if (kind === 'fouet') return fouetParaph(w, h, seed);
  const r = stream(seed, 'paraph'), P = new Plate();
  if (kind === 'fouet') { const hair = Math.max(.55, h * .03);
    pen(P, 'whip', stroke(curl(bspline([[w * .12, h * .96], [w * .3, h * .62], [w * .62, h * .5], [w * .78, h * .28]], 16), -1, h * .09), { hair, a: { kind: 'point', len: h * .4, fat: hair * 3.6 }, b: { kind: 'club', len: h * .2, fat: hair * 2 }, eye: 1, press: .5 }));
    return { P, W: w, H: h }; }
  const lw = Math.max(.7, h * .035);
  const S = stem(P, curl(bspline([[w * .2, h * .98], [w * .3, h * .55], [w * .62, h * .22], [w * .82, h * .2]], 16), .45, h * .13), { w: lw * .7, foot: 'taper', footLen: h * .3 });
  blade(P, [[w * .24, h * .9], [w * .5, h * .78], [w * .8, h * .84]], h * .07, r, { kw: lw * .8 });
  const e = S.p.at(-1), q = S.p.at(-8); bud(P, e, h * .38, Math.atan2(e[1] - q[1], e[0] - q[0]), r, { kw: lw * .8 });
  return { P, W: w, H: h };
}
// Down the margin of a quotation or an aside (w wide, h tall; the text to its right). B: an iris blade and a stem rising
// beside the lines, a furled bud at the head; A: a whip coming down from a spiral at the head, doubled for a stretch,
// ending in a seed-shaped swell at the foot.
function marginPiece(kind, w, h, seed) {
  if (kind === 'fouet') return fouetMargin(w, h, seed);
  const r = stream(seed, 'margin'), P = new Plate(), x = w * .55;
  if (kind === 'fouet') { const hair = Math.max(.6, w * .028);
    const pts = curlStart(bspline([[x + w * .1, w * .5], [x - w * .12, h * .25], [x + w * .1, h * .55], [x - w * .1, h * .8], [x + w * .05, h - w * .2]], 30), -1.2, w * .09).reverse();
    pen(P, 'whip', stroke(pts, { hair, a: { kind: 'point', len: w * 1.4, fat: hair * 4.5 }, b: { kind: 'club', len: w * .5, fat: hair * 2 }, eye: 1, press: .45, swell: .4 }));
    pen(P, 'olive', stroke(bspline([[x + w * .3, h * .3], [x + w * .1, h * .5], [x + w * .28, h * .7]], 20), { hair: hair * .7, a: { kind: 'taper', len: h * .08 }, b: { kind: 'point', len: h * .08, fat: hair * 2.2 } }));
    return { P, W: w, H: h }; }
  const lw = Math.max(.7, w * .03);
  blade(P, [[x, h + 1], [x - w * .15, h * .66], [x + w * .1, h * .36], [x - w * .05, h * .14 + r() * w * .2]], w * .13, r, { kw: lw * .8, twist: .7 });
  const S = stem(P, curl(bspline([[x + w * .06, h + 1], [x + w * .2, h * .7], [x - w * .1, h * .4], [x + w * .05, w * .9]], 26), .25, w * .4), { w: lw * .7, footLen: w });
  const e = S.p.at(-1), q = S.p.at(-8); bud(P, e, w * .75, Math.atan2(e[1] - q[1], e[0] - q[0]), r, { kind: 'iris', kw: lw * .8 });
  return { P, W: w, H: h };
}
// A frame round a box (inner edge on box, origin at the frame's own top left): a ruled line with a hand drawn round it, its
// corners curling into small spirals, as the Combinaisons frame their plates; B adds a leafy sprig with a bud at the foot
// corner. t: the room each side.
function framePiece(kind, bw, bh, t, seed, light = false) {
  if (kind === 'fouet') return fouetFrame(bw, bh, t, seed, light);
  const r = stream(seed, 'frame'), P = new Plate(), W = bw + 2 * t, H = bh + 2 * t, g = t * .55, ink = kind === 'fouet' ? 'whip' : 'k', hair = Math.max(.5, t * (light ? .035 : .05));
  const X0 = g, Y0 = g, X1 = W - g, Y1 = H - g, c = t * .42;
  const side = (a, b, e) => { const S = stroke(curl(bspline([a, [(a[0] * 2 + b[0]) / 3, (a[1] * 2 + b[1]) / 3], [(a[0] + 2 * b[0]) / 3, (a[1] + 2 * b[1]) / 3], b], 20), e, c * .32), { hair, a: { kind: 'taper', len: c }, b: { kind: 'club', len: c * .8, fat: hair * 2 }, eye: 1 }); pen(P, ink, S); };
  side([X0 + c, Y0], [X1, Y0], 1); side([X1, Y0 + c], [X1, Y1], 1); side([X1 - c, Y1], [X0, Y1], 1); side([X0, Y1 - c], [X0, Y0], 1);
  return { P, W, H };
}
export { fouetInitial, fouetBreak, fouetFiller, planteInitial, planteBreak, planteFiller, smallInitial, paraphPiece, marginPiece, framePiece, solidOf, hairOf };

// ==== le fouet's vocabulary ======================================================================================================
// After the Combinaisons ornementales (pl. 11, 17, 30, 58), Obrist's Peitschenhieb and Guimard's cast iron: every piece a
// small composition, chosen by the seed among several, the rank deciding which are open to it. A whip: a hairline that
// swells where it ends (a seed-shaped point, a club, a spiral with its eye); an olive counter-strand; buds and seed pods
// hung from them, never strewn.
const W_ = (P, ink, pts, o = {}) => { const S = stroke(pts, o); pen(P, ink, S); return S; };
// a pointed bud (or a seed pod) at the end of a line, along its last heading: an olive body with a whip-coloured sheath
function podAt(P, S, len, r, ink = 'olive') {
  const e = S.p.at(-1), q = S.p.at(-Math.min(S.p.length, 10)), a = Math.atan2(e[1] - q[1], e[0] - q[0]), T = (u, v) => [e[0] + Math.cos(a) * u * len - Math.sin(a) * v * len, e[1] + Math.sin(a) * u * len + Math.cos(a) * v * len];
  const O = organ({ axisCp: [T(-.05, 0), T(.4, (r() - .5) * .08), T(1, 0)], W: len * .2, ea: .7, eb: 1.3, asym: .8 + r() * .3, r }); if (O) P.fill(ink, shape(O.loop), { knock: false, at: e });
  const C = organ({ axisCp: [T(-.12, 0), T(.15, 0), T(.42, 0)], W: len * .16, ea: .8, eb: 1.1, r }); if (C) P.fill('whip', shape(C.loop), { knock: false, at: e });
}
const ptAlong = (S, f) => S.p[Math.min(S.p.length - 1, Math.round(f * (S.p.length - 1)))];
// a thorn: a short shoot off a line at f, out to one side, ending in a pod
function thorn(P, S, f, side, len, r, hair) {
  const i = Math.round(f * (S.p.length - 1)), a = S.p[Math.max(0, i - 3)], b = S.p[Math.min(S.p.length - 1, i + 3)], j = S.p[i], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, t = [dx / l, dy / l], n = [-t[1] * side, t[0] * side];
  const T = W_(P, 'olive', bspline([j, [j[0] + (t[0] * .5 + n[0] * .5) * len, j[1] + (t[1] * .5 + n[1] * .5) * len], [j[0] + (t[0] * .9 + n[0] * .9) * len, j[1] + (t[1] * .9 + n[1] * .9) * len]], 12), { hair: hair * .7, a: { kind: 'taper', len: len * .3 } });
  podAt(P, T, len * .55, r);
}
// ---- breaks ----
// vesica: two strands interlaced, crossing twice round a lens; in the lens a bud on its stalk (rank 2: a seed head)
function vesicaBreak(W, h, seed, rank) {
  const r = stream(seed, 'vesica'), P = new Plate(), hair = hairOf(h * 1.7), cy = h * .52, lens = h * (.26 + r() * .06), sk = (r() - .5) * .06;
  const A = [[.06, .45], [.17, .32], [.29, 0], [.4, -1.25], [.6, -1.25], [.71, 0], [.83, .38], [.94, -.1]].map(([x, y], i) => [W * x, cy + y * lens + (i === 3 ? sk * h : 0)]);
  const SA = W_(P, 'whip', curlStart(bspline(A, 26), -1.2, h * .05), { hair, b: { kind: 'point', len: h * .4, fat: hair * 5 }, swell: .5, press: .5 });
  const B = A.map(([x, y]) => [x, 2 * cy - y]).map(([x, y], i) => i === 7 ? [x - W * .02, y - h * .06] : [x, y]);
  W_(P, 'olive', curl(bspline(B.slice().reverse(), 26), 1.1, h * .05).reverse(), { hair: hair * .85, a: { kind: 'club', len: h * .2, fat: hair * 2 }, b: { kind: 'point', len: h * .35, fat: hair * 4 }, eye: 0 });
  const st = W_(P, 'whip', bspline([[W * .5, cy + lens * .85], [W * .5 + h * .02, cy + lens * .1], [W * .5, cy - lens * .45]], 12), { hair: hair * .7, a: { kind: 'taper', len: h * .1 } });
  if (rank > 1) umbel(P, st.p.at(-1), -Math.PI / 2, lens * .85, r, { n: 9, fan: 1.7, ink: 'olive', kw: hair * 1.1 }); else podAt(P, st, lens * .7, r, 'whip');
  return { P, W, H: h };
}
// Obrist's loop: one whip from a seed-shaped swell, thrown into a long oblong loop that crosses itself, on in an S to a
// spiral; two thorns with their pods off it
function loopBreak(W, h, seed) {
  const r = stream(seed, 'loop'), P = new Plate(), hair = hairOf(h * 1.7), cy = h * .55, m = r() < .5 ? 1 : -1, X = x => m > 0 ? x : W - x;
  const cp = [[.04, .3], [.2, .26], [.34, .02], [.44, -.34], [.4, -.5], [.3, -.44], [.27, -.22], [.35, .1], [.5, .3], [.66, .24], [.8, .02], [.88, -.16]].map(([x, y]) => [X(W * x), cy + h * y]);
  const S = W_(P, 'whip', curl(bspline(cp, 30), m * 1.2, h * .055), { hair, a: { kind: 'point', len: h * .45, fat: hair * 5.5 }, b: { kind: 'club', len: h * .25, fat: hair * 2 }, eye: 1, swell: .5, press: .5 });
  thorn(P, S, .52, -m, h * .3, r, hair); thorn(P, S, .76, m, h * .26, r, hair);
  return { P, W, H: h };
}
// the bundle (pl. 30): strands sweeping out both ways from one root, bundled and parting, each ending its own way (a
// spiral, a pod, a seed-shaped swell); from the root a stalk rising to a seed head
function bundleBreak(W, h, seed, rank) {
  const r = stream(seed, 'bundle'), P = new Plate(), hair = hairOf(h * 1.7), root = [W / 2, h * .84];
  for (const m of [-1, 1]) for (let k = 0; k < 3; k++) {
    const X = x => W / 2 + m * x, reach = W * (.46 - k * .1 - r() * .02), y = h * (.8 - k * .06), ink = k === 1 ? 'olive' : 'whip';
    const cp = [root, [X(W * .06), h * .9 - k * h * .02], [X(reach * .5), y + h * .04], [X(reach * .85), y - h * .1], [X(reach), y - h * .32 - k * h * .04]];
    let pts = bspline(cp, 24); if (k === 0) pts = curl(pts, m * 1.1, h * .05);
    const S = W_(P, ink, pts, { hair: hair * (1 - k * .15), a: { kind: 'taper', len: h * .1 }, b: k === 0 ? { kind: 'club', len: h * .2, fat: hair * 2 } : { kind: 'point', len: h * .25, fat: hair * 3.5 }, eye: k === 0 ? 1 : 0, press: .4 });
    if (k === 2) podAt(P, S, h * .16, r);
  }
  const st = W_(P, 'olive', bspline([root, [W / 2 + h * .03, h * .55], [W / 2, h * (rank > 1 ? .26 : .34)]], 14), { hair: hair * .8, a: { kind: 'taper', len: h * .1 } });
  umbel(P, st.p.at(-1), -Math.PI / 2, h * (rank > 1 ? .28 : .2), r, { n: rank > 1 ? 11 : 7, fan: 1.8, ink: 'olive', kw: hair * 1.1 });
  return { P, W, H: h };
}
// the end (rank 3): a frieze across the measure, a whip in long waves with a counter-strand crossing it, pods hung
// alternately above and below at its crests, a spiral at each end
function friezeBreak(W, h, seed) {
  const r = stream(seed, 'frieze'), P = new Plate(), hair = hairOf(h * 1.7), cy = h * .5, n = Math.max(3, Math.round(W / (h * 3.4))), amp = h * .24;
  const A = [], B = []; for (let i = 0; i <= n * 2; i++) { const x = W * (.06 + .88 * i / (n * 2)), s = i % 2 ? 1 : -1; A.push([x, cy + s * amp]); B.push([x, cy - s * amp * .7]); }
  const SA = W_(P, 'whip', curlStart(curl(bspline(A, 16), 1.2, h * .05), -1.2, h * .05), { hair, eye: 1, b: { kind: 'club', len: h * .2, fat: hair * 2 }, press: .4 });
  W_(P, 'olive', bspline(B, 16), { hair: hair * .75, a: { kind: 'point', len: h * .3, fat: hair * 3 }, b: { kind: 'point', len: h * .3, fat: hair * 3 } });
  for (let i = 1; i < n * 2; i += 2) { const x0 = W * (.06 + .88 * i / (n * 2)), base = SA.p.reduce((m, p) => Math.abs(p[0] - x0) < Math.abs(m[0] - x0) ? p : m), x = base[0], s = base[1] > cy ? 1 : -1;   // (hung from the strand where it is, so never apart from it)
    const st = W_(P, 'whip', bspline([base, [x + h * .05 * s, base[1] + s * h * .1], [x + h * .03, base[1] + s * h * .2]], 10), { hair: hair * .7, a: { kind: 'taper', len: h * .05 } }); podAt(P, st, h * .2, r); }
  return { P, W, H: h };
}
function fouetBreak(W, h, seed, rank = 1) {
  if (rank > 2) return friezeBreak(W, h, seed);
  const forms = rank > 1 ? [bundleBreak, vesicaBreak, loopBreak] : [counterBreak, vesicaBreak, loopBreak, bundleBreak];
  return forms[seed % forms.length](W, h, seed, rank);
}
// ---- fillers ----
function podFiller(w, h, seed) {   // a whip ending in a pointed bud, a thorn off it
  const r = stream(seed, 'podf'), P = new Plate(), hair = hairOf(h * 4), y = h * .62, L = Math.min(w, h * 9);
  const S = W_(P, 'whip', bspline([[0, y], [L * .35, y + h * .1], [L * .7, y - h * .08], [L - h * .9, y - h * .3]], 20), { hair, a: { kind: 'taper', len: h * .8 }, press: .5 });
  podAt(P, S, h * .5, r); thorn(P, S, .55, -1, h * .4, r, hair);
  return { P, W: L, H: h };
}
function cordFiller(w, h, seed) {   // two strands twisted round each other, ending one in a spiral and one in a swell
  const r = stream(seed, 'cord'), P = new Plate(), hair = hairOf(h * 4), y = h * .6, L = Math.min(w, h * 9), a = h * .12, A = [], B = [];
  for (let i = 0; i <= 6; i++) { const x = L * .9 * i / 6, s = i % 2 ? 1 : -1; A.push([x, y + s * a * (i ? 1 : 0)]); B.push([x, y - s * a * (i ? 1 : 0)]); }
  W_(P, 'whip', curl(bspline(A, 14), -1.1, h * .07), { hair, a: { kind: 'taper', len: h * .6 }, b: { kind: 'club', len: h * .3, fat: hair * 2 }, eye: 1 });
  W_(P, 'olive', bspline([...B, [L * .97, y - h * .2]], 14), { hair: hair * .8, a: { kind: 'taper', len: h * .6 }, b: { kind: 'point', len: h * .5, fat: hair * 3 } });
  return { P, W: L, H: h };
}
function seedFiller(w, h, seed) {   // a whip rising to a small seed head
  const r = stream(seed, 'seedf'), P = new Plate(), hair = hairOf(h * 4), y = h * .66, L = Math.min(w, h * 8);
  const S = W_(P, 'whip', bspline([[0, y], [L * .4, y + h * .08], [L * .75, y - h * .02], [L - h * .5, y - h * .25]], 20), { hair, a: { kind: 'taper', len: h * .8 }, press: .5 });
  umbel(P, S.p.at(-1), -Math.PI / 2 + .35, h * .45, r, { n: 7, fan: 1.6, ink: 'olive', kw: hair * 1.1 });
  return { P, W: L, H: h };
}
function fouetFiller(w, h, seed) { return [spiralFiller, podFiller, cordFiller, seedFiller][seed % 4](w, h, seed); }
// ---- the paraph ----
function fouetParaph(w, h, seed) {
  const r = stream(seed, 'fpar'), P = new Plate(), hair = Math.max(.55, h * .03), k = seed % 3;
  if (k === 0) W_(P, 'whip', curl(bspline([[w * .12, h * .96], [w * .3, h * .62], [w * .62, h * .5], [w * .78, h * .28]], 16), -1, h * .09), { hair, a: { kind: 'point', len: h * .4, fat: hair * 3.6 }, b: { kind: 'club', len: h * .2, fat: hair * 2 }, eye: 1, press: .5 });
  else if (k === 1) W_(P, 'whip', curlStart(curl(bspline([[w * .25, h * .75], [w * .45, h * .5], [w * .6, h * .35]], 12), -1.1, h * .08), -1.1, h * .08), { hair, eye: 1, b: { kind: 'club', len: h * .2, fat: hair * 2 }, press: .5 });
  else { const S = W_(P, 'whip', bspline([[w * .15, h * .98], [w * .2, h * .5], [w * .55, h * .2], [w * .8, h * .3]], 14), { hair, a: { kind: 'point', len: h * .35, fat: hair * 3 } }); podAt(P, S, h * .4, r); }
  return { P, W: w, H: h };
}
// ---- the margin ----
function fouetMargin(w, h, seed) {
  const r = stream(seed, 'fmar'), P = new Plate(), x = w * .55, hair = Math.max(.6, w * .028), m = seed % 2 ? 1 : -1;
  const S = W_(P, 'whip', curlStart(bspline([[x + w * .1, w * .5], [x - w * .12 * m, h * .25], [x + w * .1 * m, h * .55], [x - w * .1 * m, h * .8], [x + w * .05, h - w * .6]], 30), -1.2, w * .09).reverse().reverse(), { hair, a: { kind: 'club', len: w * .5, fat: hair * 2 }, eye: 0, press: .45, swell: .4 });
  thorn(P, S, .35, m, w * .7, r, hair); thorn(P, S, .62, -m, w * .6, r, hair);
  umbel(P, S.p.at(-1), Math.PI / 2, w * .45, r, { n: 7, fan: 1.6, ink: 'olive', kw: hair });
  return { P, W: w, H: h };
}
// ---- the frame: Guimard's ----
// the sides bowed a little in, each drawn on past its corner into a curl that turns outward (as the Métro's posts turn
// over at their heads), the two diagonal corners knotted: a tight loop with a pod on a short shoot
function fouetFrame(bw, bh, t, seed, light) {
  const r = stream(seed, 'gframe'), P = new Plate(), W = bw + 2 * t, H = bh + 2 * t, g = t * .55, hair = Math.max(.5, t * (light ? .03 : .04)), X0 = g, Y0 = g, X1 = W - g, Y1 = H - g, c = t * .42;
  // one feature at each corner: the top and bottom sides run on into a curl at their far corner; the sides end tapering
  // into a knot at the near one (a tight loop with its eye and a pod on a shoot), the knots at opposite corners
  const bow = Math.min(t * .3, Math.min(bw, bh) * .02);
  const side = (pts, ink, o) => W_(P, ink, pts, { hair, a: { kind: 'taper', len: c * 1.4 }, ...o });
  const run = (a, b, bv) => { const m = [(a[0] + b[0]) / 2 + bv[0], (a[1] + b[1]) / 2 + bv[1]]; return bspline([a, [(a[0] * 3 + m[0]) / 4, (a[1] * 3 + m[1]) / 4], m, [(b[0] * 3 + m[0]) / 4, (b[1] * 3 + m[1]) / 4], b], 24); };
  side(curl(run([X0 + c * 1.6, Y0], [X1 - c * .2, Y0], [0, bow]), 1.1, c * .3), 'whip', { b: { kind: 'club', len: c * .8, fat: hair * 2 }, eye: 1 });
  side(curl(run([X1 - c * 1.6, Y1], [X0 + c * .2, Y1], [0, -bow]), 1.1, c * .3), 'whip', { b: { kind: 'club', len: c * .8, fat: hair * 2 }, eye: 1 });
  side(run([X1, Y0 + c * 1.4], [X1, Y1 - c * 1.6], [-bow, 0]), 'olive', { b: { kind: 'taper', len: c * 1.4 } });
  side(run([X0, Y1 - c * 1.4], [X0, Y0 + c * 1.6], [bow, 0]), 'olive', { b: { kind: 'taper', len: c * 1.4 } });
  for (const [cx, cy, s] of [[X0, Y0, 1], [X1, Y1, -1]]) {
    W_(P, 'whip', curl(bspline([[cx + s * c * .2, cy + s * c * 1.7], [cx - s * c * .1, cy + s * c * .5], [cx + s * c * .4, cy - s * c * .25], [cx + s * c * 1.2, cy + s * c * .1]], 14), s * -1.1, c * .22), { hair: hair * .9, a: { kind: 'taper', len: c * .6 }, b: { kind: 'club', len: c * .5, fat: hair * 1.8 }, eye: 1 });
    if (!light) { const T = W_(P, 'olive', bspline([[cx - s * c * .05, cy - s * c * .05], [cx - s * c * .55, cy - s * c * .45], [cx - s * c * 1.1, cy - s * c * .5]], 10), { hair: hair * .7, a: { kind: 'taper', len: c * .3 } }); podAt(P, T, c * .9, r); }
  }
  return { P, W, H };
}
export { fouetParaph, fouetMargin, fouetFrame };
