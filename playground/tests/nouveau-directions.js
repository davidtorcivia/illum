// Nouveau, stage 2 of the direction studies (research/19-nouveau.md): A (le fouet) and B (la plante), each an initial, a
// break and a filler, built as plates (kit/styles/nouveau-print.js) and printed through the ink engine. C (Vienne) is
// dropped at the user's word.
//   A  the line (Combinaisons ornementales, 1901; Obrist, 1895): the whip rises from the letter's foot following its
//      bowls at a fixed distance (an echo of the letter, then a hairline doubling it), lifts off over the letter's top and
//      winds into a spiral with a solid eye; a stem from the same root crosses it and opens into a seed head.
//   B  the plant in a panel (Grasset, La plante, 1896): the ground laid, the letter applied in rose with a contour that has
//      a hand, then iris blades and a stem grown up the letter's side (the stem following its bowls), the iris where the
//      panel's gap is widest, a furled bud on a branch over the letter's shoulder.
// Each builder returns { P, W, H } (a Plate in piece px); the page prints it with render().
import { stream } from '../kit/marks.js';
import { bspline, curl, curlStart, even, stroke, path, shape, contour, placeLetter } from '../kit/styles/nouveau-line.js';
import { Plate } from '../kit/styles/nouveau-print.js';
import { iris, poppy, bud, blade, stem, umbel } from '../kit/styles/nouveau-flora.js';
import { dist } from '../kit/inkletter.js';

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

const hairOf = H => Math.max(.62, H * .0048);   // a hairline's half-width: ≥ 1.25 device px wide at dpr 1
// An echo of the letter's right side: for each height from y0 to y1, its rightmost ink, d further out, smoothed (as a
// draughtsman runs a line beside a form at a constant distance), going up
function echo(Lt, d, y0, y1, solid) {
  const x0 = Math.floor(Lt.loops.flat().reduce((m, p) => Math.min(m, p[0]), 1e9)) - 2, w = Math.ceil(Lt.w) + 6, h = Math.ceil(y1 - y0) + 1, sc = 2;
  const g = new OffscreenCanvas(w * sc, h * sc).getContext('2d', { willReadFrequently: true }); g.setTransform(sc, 0, 0, sc, -x0 * sc, -y0 * sc); g.fill(solid);
  const im = g.getImageData(0, 0, w * sc, h * sc).data, xs = [];
  for (let j = 0; j < h * sc; j++) { let xr = -1; for (let i = w * sc - 1; i >= 0; i--) if (im[(j * w * sc + i) * 4 + 3] > 100) { xr = i; break; } xs.push(xr < 0 ? null : x0 + xr / sc + d); }
  let pts = xs.map((x, j) => x == null ? null : [x, y0 + j / sc]).filter(Boolean);
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
  P.fill('whip', path(stroke(main, { hair, a: { kind: 'point', len: H * .2, fat: hair * 6 }, b: { kind: 'club', len: H * .14, fat: hair * 2.4 }, eye: 1, swell: .6, press: .55 })), { cut, knock: false });
  // the doubling: a hairline beside the whip along the bowls, taken up and put down again
  const run2 = echo(Lt, H * .13, Lt.top + cap * .35, base - cap * .3, solid);
  if (run2.length > 8) P.fill('whip', path(stroke(sample(run2, 5), { hair: hair * .7, a: { kind: 'taper', len: H * .08 }, b: { kind: 'point', len: H * .07, fat: hair * 2.2 } })), { cut, knock: false });
  // the counter-stem: from the root, across the whip, up into the seed head in the corner
  const node = [W - H * .08, H * .22 + r() * H * .02], mid = ec[Math.floor(ec.length / 2)];
  const second = bspline([[root[0] + H * .03, H * .995], [mid[0] + H * .13, base - cap * .25], [mid[0] + H * .02, mid[1] - H * .02], [rx + H * .1, Lt.top + cap * .2], node], 30);
  P.fill('olive', path(stroke(second, { hair: hair * .9, a: { kind: 'taper', len: H * .1 }, press: .35 })), { cut, knock: false });
  umbel(P, node, -Math.PI / 2 - .3, H * .15, r, { n: 9, fan: 1.7, ink: 'olive', kw: hair * 1.3 });
  // a shoot off the whip, as Obrist's thorns: a short curve out into a seed-shaped bud
  const j = main[Math.round(main.length * .42)], sh = bspline([j, [j[0] + H * .05, j[1] + H * .01], [j[0] + H * .12, j[1] - H * .02], [j[0] + H * .16, j[1] - H * .08]], 16);
  P.fill('whip', path(stroke(sh, { hair: hair * .8, a: { kind: 'taper', len: H * .04 }, b: { kind: 'point', len: H * .09, fat: hair * 3.6 } })), { cut, knock: false });
  P.fill('letter', Lt.path);
  return { P, W, H };
}
// two whips in counterpoint, the second turned half round the centre; a spiral with its eye at one end of each, a seed-
// shaped swell at the other; a hairline doubling each for a stretch
function fouetBreak(W, h, seed) {
  const hair = hairOf(h * 1.7), cy = h / 2, P = new Plate();
  for (const [s, ink] of [[-1, 'olive'], [1, 'whip']]) {
    const T = q => s > 0 ? q : [W - q[0], h - q[1]];
    const cp = [[W * .14, cy - h * .02], [W * .26, cy + h * .26], [W * .45, cy + h * .14], [W * .6, cy - h * .2], [W * .78, cy - h * .3], [W * .93, cy - h * .36]].map(T);
    const pts = curlStart(bspline(cp, 26), 1.3, h * .055).reverse();
    P.fill(ink, path(stroke(pts, { hair, a: { kind: 'point', len: h * .5, fat: hair * 5.5 }, b: { kind: 'club', len: h * .3, fat: hair * 2.2 }, eye: 1, swell: .5, press: .5 })), { knock: false });
    const dbl = bspline([[W * .3, cy + h * .33], [W * .45, cy + h * .23], [W * .58, cy - h * .06]].map(T), 16);
    P.fill(ink, path(stroke(dbl, { hair: hair * .65, a: { kind: 'taper', len: h * .3 }, b: { kind: 'point', len: h * .25, fat: hair * 2 } })), { knock: false });
  }
  return { P, W, H: h };
}
function fouetFiller(w, h, seed) {
  const hair = hairOf(h * 4), y = h * .62, L = Math.min(w, h * 9), P = new Plate();
  const pts = curl(bspline([[0, y], [L * .3, y + h * .12], [L * .62, y - h * .1], [L - h * 1.1, y - h * .04]], 20), -1.2, h * .075);
  P.fill('whip', path(stroke(pts, { hair, a: { kind: 'taper', len: h * .8 }, b: { kind: 'club', len: h * .5, fat: hair * 2 }, eye: 1, press: .5 })), { knock: false });
  P.fill('whip', path(stroke(bspline([[L * .28, y + h * .26], [L * .45, y + h * .2], [L * .6, y + h * .02]], 12), { hair: hair * .65, a: { kind: 'taper', len: h * .5 }, b: { kind: 'point', len: h * .4, fat: hair * 1.8 } })), { knock: false });
  return { P, W: L, H: h };
}

// ==== B · la plante ==============================================================================================================
function planteInitial(J, H, seed) {
  const r = stream(seed, 'plante-i'), lw = Math.max(.8, H * .0075), cap = H * .56, lx = H * .1, base = H * .9, Lt = placeLetter(J, lx, base, cap), W = lx + Lt.w + H * .38, P = new Plate();
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
function planteBreak(W, h, seed) {
  const r = stream(seed, 'plante-b'), lw = Math.max(.8, h * .014), cx = W / 2, by = h * .86, P = new Plate();
  for (const m of [-1, 1]) {
    const X = x => cx + m * x;
    blade(P, [[X(W * .04), by + h * .02], [X(W * .14), by - h * .1], [X(W * .28), by - h * .24], [X(W * .32 + r() * W * .01), by - h * .5]], h * .07, r, { twist: m > 0 ? .7 : null, kw: lw * .85 });
    const pts = curl(bspline([[X(0), by], [X(W * .1), by + h * .05], [X(W * .22), by + h * .03], [X(W * .31), by - h * .1], [X(W * .35), by - h * .3]], 28), m * .45, h * .09);
    const S = stem(P, pts, { w: lw * .8, foot: 'hair' }), e = S.p.at(-1), q = S.p.at(-10);
    bud(P, e, h * .26, Math.atan2(e[1] - q[1], e[0] - q[0]), r, { kw: lw * .8 });
  }
  stem(P, bspline([[cx, by + h * .03], [cx, by - h * .14], [cx, by - h * .3]], 10), { w: lw * .9, foot: 'point', footLen: h * .12 });
  poppy(P, [cx, by - h * .3], h * .5, -Math.PI / 2, r, { kw: lw * .85 });
  return { P, W, H: h };
}
function planteFiller(w, h, seed) {
  const r = stream(seed, 'plante-f'), lw = Math.max(.8, h * .035), y = h * .66, L = Math.min(w, h * 6), P = new Plate();
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
