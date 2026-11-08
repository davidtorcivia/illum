// Nouveau, stage 1: three directions, each an initial, a break and a filler (research/19-nouveau.md). Each is one master's
// grammar, not a colourway of another:
//   fouet   the line itself (Verneuil, Auriol, Mucha's Combinaisons ornementales, 1901; Obrist's Peitschenhieb, 1895): a
//           hairline that swells to a club where it ends, spirals and hairpins, two inks, no ground; the Böcklin letter.
//   plante  the plant in a panel (Grasset's La plante, 1896; Mucha's Documents décoratifs, 1902): a painted arch-topped
//           panel, the letter applied in rose with its contour, iris and blades grown in the gaps, outlined flat colour.
//   vienne  the Vienna page (Ver Sacrum, 1898–1903: Auchentaller's and König's Randzeichnungen): a squared letter in a
//           double rule, its rule turning into bundled stems that bloom into ring-berries; ◎◎◎ at a paragraph's end.
// Every function draws in css px onto a context already scaled to the device; geometry comes from kit/styles/nouveau-line.js.
import { stream } from '../kit/marks.js';
import { bspline, closed, curl, curlStart, stroke, path, shape, lay, circle, rotp, lerp } from '../kit/styles/nouveau-line.js';
import { dist } from '../kit/inkletter.js';

export const FACES = { bocklin: 'NouveauBocklin', lux: 'NouveauLux' };
export const PAL = {
  fouet: { light: { ink: 'rgb(56 52 34)', whip: 'rgb(186 116 56)', olive: 'rgb(104 112 60)', seed: 'rgb(150 104 54)' },
           dark: { ink: 'rgb(222 206 164)', whip: 'rgb(214 152 86)', olive: 'rgb(160 170 104)', seed: 'rgb(222 182 112)' } },
  plante: { light: { ground: 'rgb(222 222 196)', line: 'rgb(62 58 40)', letter: 'rgb(182 98 78)', leaf: 'rgb(132 142 84)', leaf2: 'rgb(166 172 112)', iris: 'rgb(132 112 156)', iris2: 'rgb(176 160 192)', beard: 'rgb(214 162 70)', poppy: 'rgb(196 92 68)', poppy2: 'rgb(214 128 96)', crown: 'rgb(70 66 44)' },
            dark: { ground: 'rgb(48 52 38)', line: 'rgb(212 190 132)', letter: 'rgb(210 128 104)', leaf: 'rgb(110 124 70)', leaf2: 'rgb(140 152 92)', iris: 'rgb(140 118 168)', iris2: 'rgb(178 160 200)', beard: 'rgb(226 176 84)', poppy: 'rgb(204 96 72)', poppy2: 'rgb(226 138 104)', crown: 'rgb(38 40 28)' } },
  vienne: { light: { ink: 'rgb(50 40 34)', red: 'rgb(166 76 54)', fill: 'rgb(166 76 54)' },
            dark: { ink: 'rgb(226 214 194)', red: 'rgb(214 122 92)', fill: 'rgb(214 122 92)' } },
};

// ---- shared -----------------------------------------------------------------------------------------------------------------
const fillS = (c, S, col, f = 1) => { c.fillStyle = col; c.fill(path(S, f)); };
function solid(c, pts, fill, line, lw) {
  const P = shape(pts); if (fill) { c.fillStyle = fill; c.fill(P); }
  if (line) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(P); }
}
// the letter: its box in the face (measured, so every face sits the same)
function glyph(ch, face, cap) {
  const m = document.createElement('canvas').getContext('2d'); m.font = `100px ${face}`;
  const H = m.measureText('H'), k = cap / H.actualBoundingBoxAscent, size = 100 * k; m.font = `${size}px ${face}`;
  const t = m.measureText(ch);
  return { size, font: `${size}px ${face}`, l: t.actualBoundingBoxLeft, r: t.actualBoundingBoxRight, a: t.actualBoundingBoxAscent, d: t.actualBoundingBoxDescent, w: t.actualBoundingBoxRight + t.actualBoundingBoxLeft };
}
function letter(c, ch, G, x, y, fill, line, lw) {   // x: the ink's left edge, y: the baseline
  c.font = G.font; c.textBaseline = 'alphabetic';
  if (fill) { c.fillStyle = fill; c.fillText(ch, x + G.l, y); }
  if (line) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.strokeText(ch, x + G.l, y); }
}
// the ornament layer with the letter's room cut out of it (a channel round the letter, as the leading round a glass)
function layer(c, W, H, draw, cut) {
  const s = c.getTransform().a, cv = new OffscreenCanvas(Math.ceil(W * s), Math.ceil(H * s)), g = cv.getContext('2d');
  g.scale(s, s); draw(g); if (cut) { g.globalCompositeOperation = 'destination-out'; cut(g); g.globalCompositeOperation = 'source-over'; }
  c.save(); c.setTransform(1, 0, 0, 1, c.getTransform().e, c.getTransform().f); c.drawImage(cv, 0, 0); c.restore();
}
// clearance: distance (css px) from any point to the nearest of what feat() paints, sampled at sc px a cell
function clearance(W, H, feat, sc = 2) {
  const w = Math.ceil(W / sc), h = Math.ceil(H / sc), cv = new OffscreenCanvas(w, h), g = cv.getContext('2d');
  g.scale(1 / sc, 1 / sc); feat(g); const im = g.getImageData(0, 0, w, h).data, f = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) f[i] = im[i * 4 + 3] > 40;
  const D = dist(f, w, h);
  return (x, y) => { const i = Math.max(0, Math.min(w - 1, x / sc | 0)), j = Math.max(0, Math.min(h - 1, y / sc | 0)); return D[j * w + i] * sc; };
}
// a pointed blade along a curved axis: widest a third of the way up, drawn to a long point
function blade(axisCp, wid, ea = .55, eb = 1.1) {
  const ax = bspline(axisCp, 20), n = ax.length, Lf = [], Rt = [];
  let tot = 0; const s = [0]; for (let i = 1; i < n; i++) s.push(tot += Math.hypot(ax[i][0] - ax[i - 1][0], ax[i][1] - ax[i - 1][1]));
  const mx = Math.pow(ea / (ea + eb), ea) * Math.pow(eb / (ea + eb), eb);
  for (let i = 0; i < n; i++) {
    const t = s[i] / tot, a = ax[Math.max(0, i - 1)], b = ax[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const hw = wid * Math.pow(Math.max(t, .02), ea) * Math.pow(1 - t, eb) / mx; Lf.push([ax[i][0] - dy / l * hw, ax[i][1] + dx / l * hw]); Rt.push([ax[i][0] + dy / l * hw, ax[i][1] - dx / l * hw]);
  }
  return { pts: [...Lf, ...Rt.reverse()], axis: ax };
}
const hairOf = H => Math.max(.42, H * .0042);   // a hairline's half-width (≥ ~1.25 device px wide at dpr 1.5+)

// ==== A · fouet ================================================================================================================
// A seed head (Verneuil's umbels, Combinaisons pl. 30): rays fanning from a node, each ending in a seed
function umbel(c, node, dir, len, n, hair, col, r) {
  const fan = 1.25;
  for (let i = 0; i < n; i++) {
    const a = dir + (i / (n - 1) - .5) * fan, bend = (i / (n - 1) - .5) * .5, L = len * (.82 + .18 * Math.cos((i / (n - 1) - .5) * 2.4));
    const e = [node[0] + Math.cos(a) * L, node[1] + Math.sin(a) * L], m = lerp(node, e, .5), [ox, oy] = rotp([0, bend * L * .25], a);
    fillS(c, stroke(bspline([node, [m[0] + ox, m[1] + oy], e], 16), { hair: hair * .8, a: { kind: 'taper', len: 3 } }), col);
    c.fillStyle = col; c.beginPath(); c.arc(e[0], e[1], hair * 2.6 + r() * hair * .4, 0, 7); c.fill();
  }
}
function fouetInitial(c, ch, H, seed, p) {
  const r = stream(seed, 'fouet-i'), hair = hairOf(H), G = glyph(ch, FACES.bocklin, H * .6);
  const lx = H * .2, base = H * .97, W = lx + G.w + H * .34, rx = lx + G.w + H * .1;
  const run = (pts, prof, col) => ({ S: stroke(pts, { hair, ...prof }), col });
  const strokes = [];
  // the main whip (ochre): a seed-shaped swell at its root by the letter's foot, a taut rise past its right side, over the top
  // in one long hairpin, and a spiral wound to a blob above the letter's left shoulder
  const top = H * .11, sp = [H * .08, H * .17];
  const main = curl(bspline([[rx + H * .02, base], [rx + H * .07, H * .62], [rx + H * .1, H * .25], [rx + H * .02, top * .55], [rx - H * .25, top * .5], [lx + H * .1, top * .5], [H * .1, top * .9], [H * .06, top * 2.2]], 30), -1.15, H * .03);
  strokes.push(run(main, { a: { kind: 'point', len: H * .2, fat: hair * 6.5 }, b: { kind: 'club', len: H * .12, fat: H * .016 }, eye: 1, swell: .8 }, p.whip));
  // the counter-whip (olive): out of the same root, crossing the main once, up into a seed head in the corner
  const node = [W - H * .07, H * .2];
  const second = bspline([[rx + H * .05, base], [rx + H * .14, H * .74], [rx + H * .02, H * .52], [rx + H * .12, H * .36], node], 30);
  strokes.push(run(second, { a: { kind: 'taper', len: H * .1 }, b: { kind: 'hair' } }, p.olive));
  // a thorn-like shoot off the main stem (Obrist), ending in a pointed bud
  const shoot = bspline([[rx + H * .085, H * .56], [rx + H * .12, H * .49], [rx + H * .19, H * .47], [rx + H * .23, H * .42]], 16);
  strokes.push(run(shoot, { hair: hair * .85, a: { kind: 'taper', len: H * .04 }, b: { kind: 'point', len: H * .1, fat: hair * 3.2 } }, p.whip));
  const cut = g => { g.font = G.font; g.lineWidth = H * .045; g.lineJoin = 'round'; g.strokeStyle = '#000'; g.fillStyle = '#000'; g.fillText(ch, lx + G.l, base); g.strokeText(ch, lx + G.l, base); };
  layer(c, W, H, g => { for (const s of strokes) fillS(g, s.S, s.col); umbel(g, node, -Math.PI / 2 - .2, H * .13, 6, hair, p.olive, r); }, cut);
  letter(c, ch, G, lx, base, p.ink);
  return W;
}
// the break: two whips in counterpoint, turned half about the centre (not mirrored: Nouveau's balance is rotational), a
// spiral at one end of each and a seed-shaped club at the other, crossing twice
function fouetBreak(c, W, h, seed, p, rank = 1) {
  const hair = hairOf(h * 1.6), cy = h / 2, r = stream(seed, 'fouet-b');
  const one = (s, col) => {   // s = +1 / -1: the second is the first turned half round the centre
    const P = q => s > 0 ? q : [W - q[0], h - q[1]];
    const cp = [[W * .14, cy - h * .02], [W * .26, cy + h * .26], [W * .45, cy + h * .14], [W * .6, cy - h * .2], [W * .78, cy - h * .3], [W * .92, cy - h * .38]].map(P);
    const pts = curlStart(bspline(cp, 26), 1.3, h * .05).reverse();
    return { S: stroke(pts, { hair, b: { kind: 'club', len: h * .3, fat: h * .022 }, eye: 1, a: { kind: 'point', len: h * .5, fat: hair * 5.5 }, swell: .6 }), col };
  };
  const A = one(1, p.whip), B = one(-1, p.olive);
  fillS(c, B.S, B.col); fillS(c, A.S, A.col);
  if (rank > 1) umbel(c, [W / 2, cy - h * .05], -Math.PI / 2, h * .32, 7, hair, p.olive, r);
}
// the filler: a short whip from the line's end, curling at its far end
function fouetFiller(c, w, h, seed, p) {
  const hair = hairOf(h * 4), y = h * .62;
  const L = Math.min(w, h * 9), pts = curl(bspline([[0, y], [L * .3, y + h * .12], [L * .62, y - h * .12], [L - h * .9, y - h * .05]], 20), -1.2, h * .07);
  fillS(c, stroke(pts, { hair, a: { kind: 'taper', len: h * .8 }, b: { kind: 'club', len: h * .6, fat: h * .03 }, eye: 1 }), p.whip);
}

// ==== B · plante ===============================================================================================================
// the iris (Grasset pl. 1): three standards upright, two falls turned down and out, a beard on each; flat colour, a contour
function iris(c, at, s, a, p, lw) {
  const L = (pts, m = 1, ang = a) => lay(pts, at, ang, s, m);   // frame: +x up the flower's axis
  const fall = [[0, 0], [.18, .2], [.12, .52], [-.1, .8], [-.36, .78], [-.36, .52], [-.12, .28]];
  const std = [[0, 0], [.32, -.16], [.66, -.14], [.86, 0], [.66, .14], [.32, .16]];
  const beard = [[.04, .2], [.08, .36], [-.06, .54], [-.06, .36]];
  for (const m of [-1, 1]) solid(c, closed(L(std, m, a + m * .55).map((q, i, A) => q), 14), p.iris2, p.line, lw);
  solid(c, closed(L(std.map(([x, y]) => [x * 1.08, y * .9])), 14), p.iris2, p.line, lw);
  for (const m of [-1, 1]) { solid(c, closed(L(fall, m), 14), p.iris, p.line, lw); solid(c, closed(L(beard, m), 10), p.beard, null); }
  solid(c, closed(L([[0, -.1], [-.3, -.06], [-.42, 0], [-.3, .06], [0, .1]]), 10), p.leaf, p.line, lw);   // the spathe
}
function planteInitial(c, ch, H, seed, p) {
  const r = stream(seed, 'plante-i'), lw = Math.max(.9, H * .0085), G = glyph(ch, FACES.bocklin, H * .56), hair = Math.max(.45, lw * .5);
  const lx = H * .1, base = H * .9, W = lx + G.w + H * .36, x0 = lw, y0 = lw, x1 = W - lw, y1 = H - lw, rad = (x1 - x0) / 2;
  // the panel: an arch on a square foot (Mucha's frames), the ground painted, then a double contour
  const arch = [];
  for (let i = 0; i <= 32; i++) { const a = Math.PI + Math.PI * i / 32; arch.push([(x0 + x1) / 2 + Math.cos(a) * rad, y0 + rad * .55 + Math.sin(a) * rad * .55]); }
  const panel = [[x0, y1], ...arch, [x1, y1]];
  solid(c, panel, p.ground, null);
  // the plant grows up the column the letter leaves at its right, and blooms where the panel's gap is widest
  const D = clearance(W, H, g => { g.font = G.font; g.fillStyle = '#000'; g.fillText(ch, lx + G.l, base); g.lineWidth = 2; g.strokeStyle = '#000'; g.stroke(shape(panel)); });
  let best = null; for (let y = H * .14; y < H * .45; y += 1.5) for (let x = lx + G.w * .55; x < W - H * .06; x += 1.5) { const d = D(x, y) - Math.abs(y - H * .28) * .15; if (!best || d > best[2]) best = [x, y, d]; }
  const fs = Math.min(D(best[0], best[1]) * 1.5, H * .25), fx = best[0], fy = best[1] + fs * .35, foot = [W - H * .17, y1 + 1];
  const cut = g => { g.font = G.font; g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineJoin = 'round'; g.lineWidth = H * .05; g.fillText(ch, lx + G.l, base); g.strokeText(ch, lx + G.l, base); };
  layer(c, W, H, g => {
    g.save(); g.clip(shape(panel));
    // blades: from the foot, the tallest sweeping up the right edge and turning over, one leaning across behind the letter
    const bl = [[H * .1, H * .38, H * .045, .7], [-H * .1, H * .44, H * .04, -.2], [H * .02, H * .62, H * .05, .3]];
    for (const [dx, hh, ww, lean] of bl) { const tip = [foot[0] + dx, y1 - hh * (1.4 + r() * .1)];
      const b = blade([[foot[0] + dx * .15, y1 + 2], [foot[0] + dx * .5, y1 - hh * .6], [tip[0] - lean * H * .05, tip[1] + hh * .3], tip], ww); solid(g, b.pts, lean > .5 ? p.leaf : p.leaf2, p.line, lw * .8); }
    // the stem: one long whip to the flower; a branch off it carries a bud over the letter's shoulder
    const stemPts = bspline([foot, [foot[0] - H * .02, H * .7], [fx + H * .04, H * .5], [fx, fy + fs * .3], [fx, fy]], 30);
    fillS(g, stroke(stemPts, { hair: hair * 1.3, a: { kind: 'point', len: H * .12, fat: hair * 2.6 } }), p.line);
    const j = stemPts[Math.round(stemPts.length * .62)], tipB = [lx + G.w * .62, H * .14 + r() * H * .02];
    const br = bspline([j, [j[0] - H * .05, j[1] - H * .12], [tipB[0] + H * .1, tipB[1] - H * .02], tipB], 24), S = stroke(br, { hair });
    fillS(g, S, p.line); const e = S.p.at(-1), q = S.p.at(-8);
    irisBud(g, e, H * .13, Math.atan2(e[1] - q[1], e[0] - q[0]), p, lw * .8);
    iris(g, [fx, fy], fs, -Math.PI / 2 - .12, p, lw * .8);
    g.restore();
  }, cut);
  letter(c, ch, G, lx, base, p.letter, p.line, lw * 1.1);
  const P = shape(panel); c.strokeStyle = p.line; c.lineJoin = 'round'; c.lineWidth = lw * 1.6; c.stroke(P);
  c.save(); c.clip(P); c.lineWidth = lw * .55; c.translate(W / 2, H); c.scale(1 - H * .05 / W, 1 - H * .03 / H); c.translate(-W / 2, -H); c.stroke(P); c.restore();
  return W;
}
function irisBud(c, at, s, a, p, lw) {   // furled: a long violet point in a green spathe
  solid(c, closed(lay([[0, 0], [.3, -.2], [.7, -.14], [1.05, 0], [.7, .14], [.3, .2]], at, a, s), 14), p.iris, p.line, lw);
  solid(c, closed(lay([[-.05, 0], [.2, -.24], [.55, -.16], [.45, 0], [.55, .16], [.2, .24]], at, a, s), 14), p.leaf, p.line, lw);
}
function poppy(c, at, s, a, p, lw) {
  const L = (pts, m = 1) => lay(pts, at, a, s, m);
  solid(c, closed(L([[0, 0], [.3, -.5], [.78, -.52], [.95, 0], [.78, .52], [.3, .5]]), 14), p.poppy2, p.line, lw);   // the back petal
  solid(c, closed(L([[.32, -.08], [.46, -.12], [.5, 0], [.46, .12], [.32, .08]]), 10), p.crown, p.line, lw);   // the crown
  for (const m of [-1, 1]) solid(c, closed(L([[0, 0], [.12, .1], [.42, .56], [.7, .6], [.62, .28], [.42, .1]], m), 14), p.poppy, p.line, lw);
}
function bud(c, at, s, a, p, lw) {   // nodding, a teardrop with its sepals
  solid(c, closed(lay([[0, 0], [.3, -.32], [.8, -.28], [1, 0], [.8, .28], [.3, .32]], at, a, s), 14), p.poppy, p.line, lw);
  solid(c, closed(lay([[0, 0], [.25, -.36], [.7, -.3], [.6, 0], [.7, .3], [.25, .36]], at, a, s * .95), 14), p.leaf, p.line, lw);
}
function planteBreak(c, W, h, seed, p) {
  const lw = Math.max(.9, h * .015), hair = Math.max(.45, lw * .55), cx = W / 2, by = h * .8, r = stream(seed, 'plante-b');
  for (const m of [-1, 1]) {   // a whip out of the poppy's foot each way, a blade off it, curling over into a nodding bud
    const X = x => cx + m * x;
    const pts = curl(bspline([[X(0), by], [X(W * .1), by + h * .04], [X(W * .22), by + h * .02], [X(W * .31), by - h * .1], [X(W * .35), by - h * .3]], 28), m * .45, h * .09);
    const S = stroke(pts, { hair: hair * 1.2, a: { kind: 'hair' }, b: { kind: 'hair' } }); fillS(c, S, p.line);
    const e = S.p.at(-1), q = S.p.at(-8); bud(c, e, h * .26, Math.atan2(e[1] - q[1], e[0] - q[0]), p, lw);
    const b = blade([[X(W * .06), by + h * .02], [X(W * .16), by - h * .1], [X(W * .3), by - h * .26], [X(W * .33 + r() * W * .01), by - h * .5]], h * .07); solid(c, b.pts, m > 0 ? p.leaf : p.leaf2, p.line, lw);
  }
  fillS(c, stroke(bspline([[cx, by + h * .02], [cx, by - h * .14], [cx, by - h * .3]], 10), { hair: hair * 1.3, a: { kind: 'point', len: h * .12, fat: hair * 3 } }), p.line);
  poppy(c, [cx, by - h * .3], h * .52, -Math.PI / 2, p, lw);
}
function planteFiller(c, w, h, seed, p) {
  const lw = Math.max(.9, h * .04), hair = Math.max(.45, lw * .55), y = h * .66, L = Math.min(w, h * 6);
  const pts = curl(bspline([[0, y], [L * .35, y + h * .06], [L * .55, y - h * .02], [L * .72, y - h * .3]], 20), .3, h * .2);
  const S = stroke(pts, { hair: hair * 1.2, a: { kind: 'taper', len: h * .6 } }); fillS(c, S, p.line);
  const j = S.p[Math.round(S.p.length * .4)], b = blade([j, [j[0] + h * .2, j[1] - h * .18], [j[0] + h * .6, j[1] - h * .3], [j[0] + h * 1.1, j[1] - h * .26]], h * .1); solid(c, b.pts, p.leaf2, p.line, lw);
  const e = S.p.at(-1), q = S.p.at(-8); bud(c, e, h * .42, Math.atan2(e[1] - q[1], e[0] - q[0]), p, lw);
}

// ==== C · vienne ===============================================================================================================
function ring(c, at, R, p, lw, fill) {   // ◎: a ring round a seed
  c.beginPath(); c.arc(at[0], at[1], R, 0, 7); if (fill) { c.fillStyle = fill; c.fill(); }
  c.strokeStyle = p.ink; c.lineWidth = lw; c.stroke();
  c.fillStyle = p.ink; c.beginPath(); c.arc(at[0], at[1], R * .38, 0, 7); c.fill();
}
function grapes(c, at, R, rows, p, lw, hair, seedFill) {   // a hanging cluster: a stalk, then rows of ring-berries, each on its own short stalk
  let y = at[1] + R * 1.6; fillS(c, stroke([at, [at[0], y - R * .6]], { hair }), p.ink);
  rows.forEach((n, k) => { for (let i = 0; i < n; i++) { const bx = at[0] + (i - (n - 1) / 2) * R * 2.25, b = [bx, y + R];
    fillS(c, stroke(bspline([[at[0], y - R * .6], [bx, y - R * .1], [bx, b[1] - R]], 8), { hair: hair * .8 }), p.ink);
    ring(c, b, R, p, lw, (i + k) % 2 === seedFill ? p.fill : null); } y += R * 2.1; });
}
function vienneInitial(c, ch, H, seed, p) {
  const r = stream(seed, 'vienne-i'), lw = Math.max(1, H * .011), sq = H * .72, x0 = H * .17, y0 = H - sq, W = x0 + sq + lw;
  const G = glyph(ch, FACES.lux, sq * .66), hair = Math.max(.45, lw * .45), gap = H * .03;
  c.strokeStyle = p.ink; c.lineWidth = lw * 1.8; c.strokeRect(x0, y0, sq, sq);
  c.lineWidth = lw * .6; c.beginPath(); c.roundRect(x0 + lw * 3.2, y0 + lw * 3.2, sq - lw * 6.4, sq - lw * 6.4, lw * 4); c.stroke();
  letter(c, ch, G, x0 + (sq - G.w) / 2, y0 + sq * .83, p.red, p.ink, lw * .9);
  // three stems bundled up the square's left side, over its top, parting into a spiral, a ring, and a hanging cluster
  const yT = k => H * .07 + k * gap;
  for (let k = 0; k < 3; k++) {
    const x = x0 - gap * (k + 1.2), xe = x0 + sq * [.66, .5, .28][k];
    let pts = bspline([[x, H], [x, y0 + sq * .3], [x, yT(k) + gap * 2.5], [x + gap * .5, yT(k)], [x + gap * 3, yT(k) - gap * .2], [xe - sq * .1, yT(k)], [xe, yT(k) + gap * [0, .4, .8][k]]], 26);
    if (k === 0) pts = curl(pts, 1.1, H * .024);
    fillS(c, stroke(pts, { hair, b: k === 0 ? { kind: 'club', len: H * .06, fat: H * .012 } : { kind: 'hair' }, eye: k === 0 ? 1 : 0 }), p.ink);
    const e = pts.at(-1);
    if (k === 1) ring(c, [e[0] + H * .03, e[1]], H * .03, p, lw * .8, p.fill);
    if (k === 2) grapes(c, e, H * .02, [2, 1], p, lw * .7, hair, 0);
  }
  return W;
}
function vienneBreak(c, W, h, seed, p) {
  const lw = Math.max(1, h * .02), hair = Math.max(.42, lw * .45), cx = W / 2, y = h * .74, g = h * .07, R = h * .07;
  for (const m of [-1, 1]) for (let k = 0; k < 2; k++) {   // two parallel stems from each side, rising round the pod
    const yy = y + k * g, X = x => cx + m * x;
    const pts = bspline([[X(W * .42), yy], [X(W * .25), yy], [X(W * .12), yy], [X(h * .28 + k * g), yy - h * .02], [X(h * .2 + k * g), yy - h * .3], [X(h * .02), yy - h * .52 - k * g]], 22);
    fillS(c, stroke(pts, { hair }), p.ink);
    if (!k) ring(c, [X(W * .42 + R * 1.3), yy + g / 2], R * .7, p, lw * .7, null);
  }
  // the pod: a heart-shaped seed case between the stems, red, a ring-berry over it
  const pod = closed([[cx, y - h * .02], [cx - h * .16, y - h * .18], [cx - h * .12, y - h * .36], [cx, y - h * .3], [cx + h * .12, y - h * .36], [cx + h * .16, y - h * .18]], 16);
  solid(c, pod, p.fill, p.ink, lw * .8);
  for (const i of [-1, 0, 1]) ring(c, [cx + i * R * 2.3, y - h * .56 + Math.abs(i) * R * 1.1], R * (i ? .8 : 1), p, lw * .7, i ? null : p.fill);
}
function vienneFiller(c, w, h, seed, p) {   // ◎◎◎ as Ver Sacrum closes a paragraph
  const lw = Math.max(.9, h * .045), y = h * .62, R = h * .17;
  for (let i = 0; i < 3; i++) ring(c, [h * .3 + R + i * R * 2.6, y], R, p, lw, null);
}

export const DIRS = {
  fouet: { name: 'A · Le fouet', initial: fouetInitial, brk: fouetBreak, filler: fouetFiller },
  plante: { name: 'B · La plante', initial: planteInitial, brk: planteBreak, filler: planteFiller },
  vienne: { name: 'C · Vienne', initial: vienneInitial, brk: vienneBreak, filler: vienneFiller },
};
