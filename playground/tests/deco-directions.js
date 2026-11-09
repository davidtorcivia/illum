// Art Deco, direction studies (research/22-deco.md): three directions, each in its own medium, drawn live as vector and
// printed by kit/styles/deco-print.js through the ink engine. Every piece: { S: Sheet, W, H } in its own px (0,0)-(W,H).
//   A · pochoir   Séguy (Prismes 1930), Gladky (Fleurs 1929), Iribe's rose: flat gouache through stencils, a tampon stipple,
//                 a gold-powder band; concentric bands, stepped clouds
//   B · l'or      Schmied (Les Climats 1924): gold ink flats and the black of the press; the gold square, the gold bar, the
//                 inverted triangle with its rays
//   C · le filet  the rule (Deberny & Peignot's specimens, Cassandre, the Chrysler doors 1930): letterpress rules in black and
//                 vermilion; the stepped frame, speed lines, the lotus fan
import { Sheet, cut, arc, poly, band, gauss } from '../kit/styles/deco-print.js';
import { stream } from '../kit/marks.js';

const PI = Math.PI;
const rect = (x0, y0, x1, y1, rnd, deg = .8) => poly(new Path2D(), cut([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], rnd, deg));
// a capital of `face` whose cap height is `cap`, its ink box centred on (cx, cy)
export function glyph(ch, face, cap, cx, cy) {
  const c = new OffscreenCanvas(8, 8).getContext('2d'); c.font = `200px ${face}`; const m = c.measureText(ch), mH = c.measureText('H');
  const k = cap / mH.actualBoundingBoxAscent, w = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * k, a = m.actualBoundingBoxAscent * k, d = m.actualBoundingBoxDescent * k;
  const x = cx - w / 2 + m.actualBoundingBoxLeft * k, y = cy + (a - d) / 2, size = 200 * k;
  const draw = (g, dx = 0, dy = 0) => { g.font = `${size}px ${face}`; g.textBaseline = 'alphabetic'; g.fillText(ch, x + dx, y + dy); };
  // the letter grown by w (its channel: what a colour beneath keeps clear of it)
  draw.grown = (g, wd, dx = 0, dy = 0) => { g.font = `${size}px ${face}`; g.textBaseline = 'alphabetic'; g.lineWidth = wd; g.lineJoin = 'round'; g.strokeText(ch, x + dx, y + dy); g.fillText(ch, x + dx, y + dy); };
  draw.box = [x - m.actualBoundingBoxLeft * k, y - a, x - m.actualBoundingBoxLeft * k + w, y + d]; return draw;
}
const wedge = (c, r0, r1, a0, a1, rnd) => band(c, r0, r1, a0, a1, rnd);

// ---- A · pochoir ------------------------------------------------------------------------------------------------------------
const A = {
  name: 'A · Pochoir', face: '"DecoA"',
  initial(ch, H, seed) {
    // the letter stands in an arch: the sky worked in with the tampon from its top and lifted toward the foot, three bands
    // over it (red, ochre, a thin gold powder), stepped clouds crossing the bands at the corners (Prismes 27)
    const r = stream(seed, 'A-ini:' + ch), W = H * .94, S = new Sheet(), c = [W * .5, H * 1.02];
    const panel = rect(0, 0, W, H, r, .5), inPanel = (g, f) => { g.save(); g.clip(panel); f(); g.restore(); };
    S.ink('ground', g => g.fill(panel));
    const sky = poly(new Path2D(), arc(c, H * .71, PI, 2 * PI, r));
    S.ink('cream', g => inPanel(g, () => g.fill(sky)), { medium: 'stipple', fade: { from: [0, c[1] - H * .71], to: [0, c[1] - H * .02], solid: .42, fleck: H * .0075 } });
    for (const [col, a, b] of [['red', .84, .99], ['ochre', .74, .84], ['gold', .70, .74]]) { const p = band(c, H * a, H * b, PI * .9, PI * 2.1, r); S.ink(col, g => inPanel(g, () => g.fill(p)), { medium: col === 'gold' ? 'metal' : 'gouache' }); }
    const cl = [[0, .05, .21, .1], [.05, .1, .29, .15], [0, .15, .14, .19], [.79, .04, 1, .09], [.7, .09, .95, .135], [.85, .135, 1, .175], [0, .885, .19, .93], [.78, .86, 1, .905], [.86, .905, 1, .945]];
    const cp = cl.map(([x0, y0, x1, y1]) => rect(x0 * W, y0 * H, x1 * W, y1 * H, r));
    S.ink('blue', g => inPanel(g, () => { for (const p of cp) g.fill(p); }));
    const L = glyph(ch, this.face, H * .55, W * .5, H * .635);
    S.ink('ink', g => L(g), { trap: .2 });
    return { S, W, H };
  },
  // Iribe's rose: a red disc whose petals are the stencil's ties (paper left between the cuts), two leaves with a tie for a vein
  paraph(fs, seed) {
    const r = stream(seed, 'A-par'), s = fs * 1.05, S = new Sheet(), c = [s * .5, s * .44], R = s * .34;
    // the bloom: a disc with five shallow lobes; the petals' folds are three C-shaped ties, each round its own centre
    const ph = r() * 6.28, lobes = []; for (let i = 0; i < 60; i++) { const a = i / 60 * 2 * PI; lobes.push([c[0] + Math.cos(a) * R * (.93 + .07 * Math.cos(5 * a + ph)), c[1] + Math.sin(a) * R * (.93 + .07 * Math.cos(5 * a + ph))]); }
    const disc = poly(new Path2D(), lobes), ties = new Path2D();
    [[.3, -.6, [.04, -.02]], [.56, 1.5, [-.05, .03]], [.8, 3.7, [.04, .05]]].forEach(([k, a0, o]) => { const p = arc([c[0] + o[0] * R, c[1] + o[1] * R], R * k, a0, a0 + 4.1, r, .01); ties.moveTo(...p[0]); for (const q of p) ties.lineTo(...q); });
    S.ink('red', g => { g.fill(disc); g.globalCompositeOperation = 'destination-out'; g.lineWidth = s * .055; g.lineCap = 'round'; g.stroke(ties); g.globalCompositeOperation = 'source-over'; });
    const leaf = (b, ang, L, Wd) => { const o = [], n = 14; for (let i = 0; i <= n; i++) { const t = i / n, y = Math.sin(PI * t) ** .85 * Wd / 2; o.push([t * L, -y]); }
      for (let i = n; i >= 0; i--) { const t = i / n, y = Math.sin(PI * t) ** 1.1 * Wd / 2; o.push([t * L, y]); }
      return o.map(([x, y]) => [b[0] + x * Math.cos(ang) - y * Math.sin(ang), b[1] + x * Math.sin(ang) + y * Math.cos(ang)]); };
    const l1 = leaf([c[0] - R * .2, c[1] + R * .85], PI * .82, s * .42, s * .2), l2 = leaf([c[0] + R * .25, c[1] + R * .9], PI * .2, s * .36, s * .17);
    S.ink('green', g => { for (const l of [l1, l2]) g.fill(poly(new Path2D(), l));
      g.globalCompositeOperation = 'destination-out'; g.lineWidth = s * .03; for (const l of [l1, l2]) { const n = l.length / 2 | 0; g.beginPath(); g.moveTo(...l[0]); g.lineTo(...l[n - 3]); g.stroke(); } g.globalCompositeOperation = 'source-over'; });
    return { S, W: s, H: s };
  },
  // stepped cloud to the measure
  filler(gw, lh, seed) {
    const r = stream(seed, 'A-fill'), H = lh * .62, u = lh * .38, S = new Sheet(), y = k => H * k;
    S.ink('ochre', g => g.fill(rect(u * 1.4, y(.52), gw - u * .8, y(.74), r)));
    S.ink('blue', g => { g.fill(rect(0, y(.28), gw - u * 2.4, y(.52), r)); g.fill(rect(u * 3.2, y(.74), gw, y(.95), r)); });
    return { S, W: gw, H };
  },
  brk(bw, hb, seed) {
    const r = stream(seed, 'A-brk'), S = new Sheet(), R = hb * .8, c = [bw / 2, hb * .92], W = bw, H = hb;
    const sky = arc(c, R * .56, PI, 2 * PI, r);
    S.ink('cream', g => g.fill(poly(new Path2D(), sky)), { medium: 'stipple', fade: { from: [0, c[1] - R * .56], to: [0, c[1]], solid: .3, fleck: hb * .008 } });
    for (const [col, a, b] of [['red', .82, 1], ['ochre', .64, .82], ['gold', .56, .64]]) { const p = band(c, R * a, R * b, PI, 2 * PI, r); S.ink(col, g => g.fill(p), { medium: col === 'gold' ? 'metal' : 'gouache' }); }
    const u = hb * .1, L = [[c[0] - R * 1.1, c[1] - u * 2.2, c[0] - R * 3.0, c[1] - u * 1.1], [c[0] - R * .6, c[1] - u * 1.1, c[0] - R * 2.4, c[1]], [c[0] - R * 1.5, c[1] - u * 3.1, c[0] - R * 2.1, c[1] - u * 2.2]];
    const Rr = [[c[0] + R * .7, c[1] - u * 1.1, c[0] + R * 2.7, c[1]], [c[0] + R * 1.15, c[1] - u * 2.2, c[0] + R * 2.2, c[1] - u * 1.1], [c[0] + R * 1.9, c[1] - u * 3.1, c[0] + R * 2.9, c[1] - u * 2.2]];
    const cp = L.concat(Rr).map(([x0, y0, x1, y1]) => rect(Math.min(x0, x1), y0, Math.max(x0, x1), y1, r));
    S.ink('blue', g => { for (const p of cp) g.fill(p); });
    return { S, W, H };
  },
  // a frame's corner (a quotation's top left): two bands meeting in a stepped corner, a quarter fan in the angle
  corner(cs, seed) {
    const r = stream(seed, 'A-cor'), S = new Sheet(), b = cs * .1, g2 = cs * .2;
    const outer = poly(new Path2D(), cut([[0, 0], [cs, 0], [cs, b * .55], [b * 1.6, b * .55], [b * 1.6, b], [b, b], [b, b * 1.6], [b * .55, b * 1.6], [b * .55, cs], [0, cs]], r, .5));
    S.ink('blue', g => g.fill(outer));
    const c = [g2, g2]; for (const [col, a, k] of [['red', .5, .62], ['ochre', .38, .5], ['gold', .32, .38]]) { const p = band(c, cs * a, cs * k, 0, PI / 2, r); S.ink(col, g => g.fill(p), { medium: col === 'gold' ? 'metal' : 'gouache' }); }
    S.ink('ochre', g => { g.fill(rect(g2 + cs * .64, g2 - b * .2, cs, g2 + b * .15, r)); g.fill(rect(g2 - b * .2, g2 + cs * .64, g2 + b * .15, cs, r)); });
    return { S, W: cs, H: cs };
  },
};

// ---- B · l'or (Schmied) -------------------------------------------------------------------------------------------------------
const rays = (c, R, a0, a1, n, rnd, every = 2) => { const p = new Path2D(), da = (a1 - a0) / n; for (let i = 0; i < n; i += every) { const w = wedge(c, 0, R, a0 + i * da, a0 + (i + 1) * da, rnd); p.addPath(w); } return p; };
const B = {
  name: 'B · L’or et le noir', face: '"DecoB"',
  initial(ch, H, seed) {
    const r = stream(seed, 'B-ini:' + ch), W = H * .9, S = new Sheet(), pts = cut([[0, 0], [W, 0], [W, H], [0, H]], r, .4), sq = poly(new Path2D(), pts), c = [W * .5, H * 1.0];
    const sqIn = poly(new Path2D(), pts.map(([x, y]) => [x + (x < W / 2 ? 1 : -1), y + (y < H / 2 ? 1 : -1)]));   // (the second gold kept inside the first, slip and all)
    S.ink('gold', g => g.fill(sq), { medium: 'metal' });
    const ry = rays(c, H * 1.2, PI, 2 * PI, 15, r);
    S.ink('gold2', g => { g.save(); g.clip(sqIn); g.fill(ry); g.restore(); }, { medium: 'metal', seam: false });
    const L = glyph(ch, this.face, H * .7, W * .5, H * .5);
    S.ink('ink', g => L(g), { medium: 'press' });
    return { S, W, H };
  },
  paraph(fs, seed) { const r = stream(seed, 'B-par'), W = fs * .62, H = fs * .4, S = new Sheet(); S.ink('gold', g => g.fill(rect(0, 0, W, H, r, .6)), { medium: 'metal' }); return { S, W, H, y: 'x' }; },
  filler(gw, lh, seed) { const r = stream(seed, 'B-fill'), H = lh * .62, S = new Sheet(); S.ink('gold', g => g.fill(rect(0, H * .34, gw, H * .7, r, .25)), { medium: 'metal' }); return { S, W: gw, H }; },
  brk(bw, hb, seed) {
    const r = stream(seed, 'B-brk'), S = new Sheet(), th = hb * .88, tw = th / 1.04, x0 = (bw - tw) / 2, y0 = hb * .06, apex = [bw / 2, y0 + th];
    const tri = cut([[x0, y0], [x0 + tw, y0], apex], r, .4), T = poly(new Path2D(), tri), lw = Math.max(1.1, tw * .018);   // (the master's outline: 1.7 % of the triangle's width)
    const inner = poly(new Path2D(), [[x0 + lw * 1.7, y0 + lw], [x0 + tw - lw * 1.7, y0 + lw], [apex[0], apex[1] - lw * 1.9]]);
    S.ink('gold', g => { g.fill(inner); g.fill(rect(bw * .1, y0, x0 - tw * .1, y0 + hb * .1, r, .3)); g.fill(rect(x0 + tw * 1.1, y0, bw * .9, y0 + hb * .1, r, .3)); }, { medium: 'metal' });
    const ry = rays(apex, th * 1.1, PI * 1.18, PI * 1.82, 11, r);
    S.ink('gold2', g => { g.save(); g.clip(inner); g.fill(ry); g.restore(); }, { medium: 'metal', seam: false });
    S.ink('line', g => { g.fill(T); g.globalCompositeOperation = 'destination-out'; g.fill(inner); g.globalCompositeOperation = 'source-over'; }, { medium: 'press' });
    return { S, W: bw, H: hb };
  },
  corner(cs, seed) {
    const r = stream(seed, 'B-cor'), S = new Sheet(), b = cs * .085, h = Math.max(1.2, cs * .016);
    S.ink('gold', g => { g.fill(rect(0, 0, cs, b, r, .25)); g.fill(rect(0, 0, b, cs, r, .25)); }, { medium: 'metal' });
    const o = b * 1.6, st = b * .9;   // a hairline pair stepped twice round the corner, as an inlaid ivory line
    const line = k => [[cs, o + k], [o + st * 2 + k, o + k], [o + st * 2 + k, o + st + k], [o + st + k, o + st + k], [o + st + k, o + st * 2 + k], [o + k, o + st * 2 + k], [o + k, cs]];
    S.ink('line', g => { g.lineWidth = h; g.lineJoin = 'miter'; for (const k of [0, h * 3.2]) { g.beginPath(); line(k).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); } }, { medium: 'press' });
    return { S, W: cs, H: cs };
  },
};

// ---- C · le filet -------------------------------------------------------------------------------------------------------------
// the stepped (ziggurat) outline: a rectangle whose top corners step in n times
const zig = (x0, y0, x1, y1, st, n) => { const o = [[x0, y1]]; for (let i = 0; i < n; i++) { o.push([x0 + st * i, y0 + st * (n - i)]); o.push([x0 + st * (i + 1), y0 + st * (n - i)]); }
  o.push([x0 + st * n, y0]); o.push([x1 - st * n, y0]); for (let i = n - 1; i >= 0; i--) { o.push([x1 - st * (i + 1), y0 + st * (n - i)]); o.push([x1 - st * i, y0 + st * (n - i)]); } o.push([x1, y1]); return o; };
const strokeZig = (g, pts, w) => { g.lineWidth = w; g.lineJoin = 'miter'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.stroke(); };
// the lotus fan (Chrysler doors): n petals between angles a0..a1 from radius r0 to r1, each flaring to a scalloped tip
function lotus(c, r0, r1, a0, a1, n, rnd, fill = .82) {
  const da = (a1 - a0) / n, out = [];
  for (let i = 0; i < n; i++) { const a = a0 + i * da + da * (1 - fill) / 2, b = a + da * fill, pts = arc(c, r0, b - da * .25 * (1 - fill), a + da * .25 * (1 - fill), rnd, 0, 6);
    const p1 = [c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1], p2 = [c[0] + Math.cos(b) * r1, c[1] + Math.sin(b) * r1], m = (a + b) / 2, q = [c[0] + Math.cos(m) * r1 * .9, c[1] + Math.sin(m) * r1 * .9];
    const sc = []; for (let k = 0; k <= 8; k++) { const t = k / 8; sc.push([(1 - t) ** 2 * p1[0] + 2 * t * (1 - t) * q[0] + t * t * p2[0], (1 - t) ** 2 * p1[1] + 2 * t * (1 - t) * q[1] + t * t * p2[1]]); }
    out.push(poly(new Path2D(), pts.concat(sc))); }
  return out;
}
const C = {
  name: 'C · Le filet', face: '"DecoC"',
  initial(ch, H, seed) {
    const r = stream(seed, 'C-ini:' + ch), W = H, S = new Sheet(), st = H * .07;
    S.ink('red', g => { strokeZig(g, zig(W * .02, H * .02, W * .98, H * .98, st, 2), H * .03); strokeZig(g, zig(W * .085, H * .085, W * .915, H * .915, st * .9, 2), H * .012); }, { medium: 'press' });
    const L = glyph(ch, this.face, H * .6, W * .47, H * .54), off = [H * .045, H * .03], per = H * .03;
    // the lotus behind the letter, in the red forme, kept clear of the letter and its shadow by a channel
    const fan = lotus([W * .5, H * .93], H * .1, H * .78, PI * 1.08, PI * 1.92, 9, r, .7);
    S.ink('red', g => { g.save(); g.beginPath(); g.rect(W * .1, H * .1, W * .8, H * .8); g.clip(); for (const p of fan) g.fill(p); g.restore();
      g.globalCompositeOperation = 'destination-out'; L.grown(g, H * .06); L.grown(g, H * .06, off[0], off[1]); g.globalCompositeOperation = 'source-over'; }, { medium: 'press', despeck: 2.5 });
    S.ink('ink', g => { g.save(); L(g, off[0], off[1]); g.globalCompositeOperation = 'destination-in'; g.beginPath(); for (let y = 0; y < H; y += per) g.rect(0, y, W, per * .42); g.fill(); g.restore();
      g.globalCompositeOperation = 'destination-out'; L(g, 0, 0); g.globalCompositeOperation = 'source-over'; L(g, -H * .006, -H * .004); }, { medium: 'press', despeck: 2.5 });
    return { S, W, H };
  },
  // the lotus fan of the Chrysler doors, small: five petals alternating black and vermilion, scalloped between, on a collar
  paraph(fs, seed) {
    const r = stream(seed, 'C-par'), s = fs * 1.05, S = new Sheet(), c = [s * .5, s * .86], n = 5, a0 = PI * 1.16, a1 = PI * 1.84, da = (a1 - a0) / n;
    const P = lotus(c, s * .14, s * .74, a0, a1, n, r), petal = i => P[i];
    S.ink('red', g => { for (let i = 1; i < n; i += 2) g.fill(petal(i)); }, { medium: 'press' });
    S.ink('ink', g => { for (let i = 0; i < n; i += 2) g.fill(petal(i)); g.fill(rect(c[0] - s * .12, c[1] - s * .02, c[0] + s * .12, c[1] + s * .1, r, .3)); }, { medium: 'press' });
    return { S, W: s, H: s };
  },
  filler(gw, lh, seed) {
    const r = stream(seed, 'C-fill'), H = lh * .62, S = new Sheet(), u = lh * .5;
    S.ink('red', g => g.fill(rect(0, H * .36, H * .28, H * .64, r, .4)), { medium: 'press' });
    S.ink('ink', g => { let y = H * .26; [[.1, u * .9], [.065, u * .4], [.045, 0]].forEach(([w, x]) => { const t = Math.max(1.2, H * w); g.fill(rect(H * .5 + x, y, gw, y + t, r, .15)); y += t + Math.max(1.3, H * .08); }); }, { medium: 'press' });   // (no rule under 1.2 px: a hairline below that breaks up on the screen)
    return { S, W: gw, H };
  },
  brk(bw, hb, seed) {
    const r = stream(seed, 'C-brk'), S = new Sheet(), zw = hb * 1.25, x0 = (bw - zw) / 2, y1 = hb * .9, st = hb * .12, c = [bw / 2, y1];
    S.ink('red', g => { strokeZig(g, zig(x0, hb * .1, x0 + zw, y1, st, 3), hb * .035); }, { medium: 'press' });
    S.ink('ink', g => { const n = 9; for (let i = 0; i < n; i++) { const a = PI * 1.2 + PI * .6 * (i + .5) / n; g.fill(wedge(c, hb * .16, hb * .62, a - .035, a + .035, r)); }
      g.fill(poly(new Path2D(), arc(c, hb * .12, PI, 2 * PI, r)));
      for (const sd of [-1, 1]) { let y = y1; [[.04, .02], [.024, .12], [.016, .22]].forEach(([w, ins]) => { const t = Math.max(1.2, hb * w), xa = sd < 0 ? bw * (.02 + ins * .3) : x0 + zw + hb * .1, xb = sd < 0 ? x0 - hb * .1 : bw * (.98 - ins * .3); g.fill(rect(xa, y - t, xb, y, r, .15)); y -= t + Math.max(1.3, hb * .035); }); } }, { medium: 'press' });
    return { S, W: bw, H: hb };
  },
  corner(cs, seed) {
    const r = stream(seed, 'C-cor'), S = new Sheet(), st = cs * .12;
    const L = k => { const o = k, s = st; return [[cs, o], [o + s * 2, o], [o + s * 2, o + s], [o + s, o + s], [o + s, o + s * 2], [o, o + s * 2], [o, cs]]; };
    const line = (g, pts, w) => { g.lineWidth = w; g.lineJoin = 'miter'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); };
    S.ink('ink', g => { line(g, L(cs * .02), cs * .04); line(g, L(cs * .1), cs * .012); }, { medium: 'press' });
    S.ink('red', g => line(g, L(cs * .16), cs * .012), { medium: 'press' });
    return { S, W: cs, H: cs };
  },
};

export const DIRS = { pochoir: A, or: B, filet: C };
export const PAL = {
  pochoir: { light: { ground: [206, 214, 160], cream: [240, 236, 212], red: [158, 44, 16], ochre: [198, 128, 34], gold: [238, 192, 86], blue: [58, 96, 160], ink: [30, 30, 38], green: [52, 118, 96] },
             dark: { ground: [26, 52, 64], cream: [84, 122, 140], red: [184, 66, 34], ochre: [210, 144, 52], gold: [226, 190, 112], blue: [104, 140, 196], ink: [236, 228, 206], green: [88, 156, 124] } },
  or: { light: { gold: [180, 132, 62], gold2: [204, 164, 96], ink: [30, 26, 24], line: [30, 26, 24] },
        dark: { gold: [196, 156, 84], gold2: [222, 188, 118], ink: [20, 17, 15], line: [210, 176, 108] } },
  filet: { light: { ink: [28, 26, 24], red: [194, 56, 34] }, dark: { ink: [214, 214, 208], red: [226, 96, 66] } },
};
export { gauss };
