// PIE · C, the smith (research/24-pie.md): sheet bronze beaten up from behind and punched from the front, after the
// Trundholm sun disc (Nationalmuseet), the Hallstatt cuirass (Met 248133) and the Irish gold disc (Met 468176).
// Measured on the Trundholm disc's central motif (scratchpad pie/py/rings.py), in units of the ridge pitch q:
//   concentric rings (not spirals) round a boss of radius ~1.3 q; ridges q apart, each ~.5 q wide; a ring of punched
//   beads one pitch outside them, the beads ~.8 q apart and long radially; each ring's radius stays within ~±.1 q round
//   the motif (8 sectors), so the rings were laid with a guide, but not a lathe.
// The cuirass: bosses in rows ~2 diameters apart, lines and rings traced in fine punched dots (pointillé).
// Gold only small: the disc's gold is a foil; here it is on the bosses' crowns alone.
import { rng, gauss, letterMask, blurMask, at, fitGlyph } from '../styles/rock-relief.js';
import { glyph } from '../styles/copperplate-print.js';

export const FACE = '"Illum PIE Cinzel"';
const TAU = Math.PI * 2;

// a ring chased up round c: radius R, the tool's start and finish overlapping a little where the hand closed it
export function ring(c, R, w, h, q, r, t = 0) { const n = Math.max(24, Math.round(R * 1.4)), a0 = r() * TAU, dx = .1 * q * gauss(r), dy = .1 * q * gauss(r), e = .04 * gauss(r);
  const p = Array.from({ length: n + 2 }, (_, i) => { const a = a0 + TAU * i / n * 1.02, rr = R * (1 + e * Math.cos(2 * (a - a0))) + .05 * q * Math.sin(3 * a + a0);
    return [c[0] + dx + rr * Math.cos(a), c[1] + dy + rr * Math.sin(a)]; });
  return { k: 'ridge', p, w, h, t }; }
// the Trundholm motif: a boss and k rings, a ring of punched beads outside them when there is room
export function motif(c, q, k, r, t0 = 0, t1 = 1, beads = false) { const out = [{ k: 'boss', x: c[0], y: c[1], r: 1.15 * q, h: .45 * q, t: t0 }, { k: 'paint', x: c[0], y: c[1], r: .75 * q, t: t0 }];
  for (let j = 1; j <= k; j++) out.push(ring(c, (1.15 + .95 * j) * q, .45 * q, .17 * q, q, r, t0 + (t1 - t0) * j / (k + 1)));
  if (beads) { const R = (1.15 + .95 * (k + 1)) * q, n = Math.round(TAU * R / (.8 * q));
    for (let i = 0; i < n; i++) { const a = TAU * i / n + .02 * gauss(r); out.push({ k: 'punch', x: c[0] + R * Math.cos(a), y: c[1] + R * Math.sin(a), r: .28 * q, d: .25 * q, t: t0 + (t1 - t0) * (k + i / n) / (k + 1) }); } }
  return out; }
// a row of punched dots along pts, pitch s (the tracer's punch, walked)
export function dots(pts, s, rr, r, t0 = 0, t1 = 1) { const out = []; let tot = 0, acc = 0; const L = [0]; for (let i = 1; i < pts.length; i++) L.push(tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  for (let u = s * .5, i = 0; u < tot; u += s * (1 + .06 * gauss(r))) { while (i < pts.length - 2 && L[i + 1] < u) i++; const f = (u - L[i]) / Math.max(1e-6, L[i + 1] - L[i]);
    out.push({ k: 'punch', x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f + .05 * s * gauss(r), y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f + .05 * s * gauss(r), r: rr, d: .9 * rr, t: t0 + (t1 - t0) * u / tot }); acc++; }
  return out; }
// the sheet: cut from a hammered plate with shears, so each side a near-straight line that wanders a little; its face
// planished, so faint broad dents from the planishing hammer's face (a few rows of them)
export function plate(W, H, r, rad = .06, t = 0, ox = 0, oy = 0, round = false) { const amp = .005 * Math.min(W, H), ph = Array.from({ length: 8 }, () => r() * TAU), R = rad * Math.min(W, H);
  const mask = (x, y) => { x -= ox; y -= oy; const wx = amp * Math.sin(ph[0] + y / H * 3) + amp * .5 * Math.sin(ph[1] + y / H * 7), wy = amp * Math.sin(ph[2] + x / W * 3) + amp * .5 * Math.sin(ph[3] + x / W * 6);
    if (round) { const d = Math.hypot((x - W / 2) / (W / 2 - 1), (y - H / 2) / (H / 2 - 1)) - 1 + (wx + wy) / W; return Math.min(1, Math.max(0, .5 - d * W)); }
    const qx = Math.abs(x - W / 2) - (W / 2 - R - 1) + wx, qy = Math.abs(y - H / 2) - (H / 2 - R - 1) + wy, d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R;
    return Math.min(1, Math.max(0, .5 - d * 2)); };
  const out = [{ k: 'sheet', mask, bbox: [ox, oy, ox + W, oy + H], t }], hs = .22 * Math.min(W, H);
  for (let y = hs * .4; y < H; y += hs * .8) for (let x = hs * .4 + (Math.round(y / hs) % 2) * hs * .4; x < W; x += hs * .8)
    out.push({ k: 'punch', x: ox + x + .15 * hs * gauss(r), y: oy + y + .15 * hs * gauss(r), r: hs * .7, d: .006 * hs, t });   // (shallow: below the depth that holds verdigris)
  return out; }
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];

// ---- the drop: a square plate, its border punched, the capital raised in a line round its edge and its body pointillé,
// Trundholm rings in the corners the letter leaves free ---------------------------------------------------------------
export function initial(ch, H, seed, fs = 20, face = FACE) {
  const r = rng(seed * 31 + ch.charCodeAt(0)), W = H, cap = H * .6, q = Math.max(2.2, H * .028);
  const draw = fitGlyph(glyph, ch, face, cap * .85, W * .5, W / 2, H / 2 + H * .015);
  return { W, H, u: q, sheet: true, marks(F) {
    const M = letterMask(F, draw), Mb = blurMask(F, M, .35 * q), Mc = blurMask(F, M, 2 * q), out = plate(W, H, r);
    const i1 = .075 * H, s = .9 * q;
    out.push(...dots(rect(i1, i1, W - i1, H - i1), s, .26 * q, r, .02, .2));
    out.push(...[1, 2, 3, 4].map(k => ({ k: 'ridge', p: k === 1 ? [[i1 + 1.1 * q, i1 + 1.1 * q], [W - i1 - 1.1 * q, i1 + 1.1 * q]] : k === 2 ? [[W - i1 - 1.1 * q, i1 + 1.1 * q], [W - i1 - 1.1 * q, H - i1 - 1.1 * q]] : k === 3 ? [[W - i1 - 1.1 * q, H - i1 - 1.1 * q], [i1 + 1.1 * q, H - i1 - 1.1 * q]] : [[i1 + 1.1 * q, H - i1 - 1.1 * q], [i1 + 1.1 * q, i1 + 1.1 * q]], w: .42 * q, h: .14 * q, t: .2 + .02 * k })));
    for (let s6 = 0; s6 < 6; s6++) out.push({ k: 'edge', Mb, d: .2 * q, sign: 1, band: .22, y0: s6 * H / 6, y1: (s6 + 1) * H / 6, t: .3 + s6 * .04 });
    // the letter's body traced in punched dots, row by row (the cuirass's pointillé)
    const [bx0, by0, bx1, by1] = draw.box, pts = [];
    for (let y = by0, j = 0; y < by1; y += .9 * q, j++) for (let x = bx0 + (j % 2) * .45 * q; x < bx1; x += .9 * q) if (at(F, M, x, y) > .5 && at(F, Mb, x, y) > .93) pts.push([x, y]);
    pts.forEach((p, k) => out.push({ k: 'punch', x: p[0] + .06 * q * gauss(r), y: p[1] + .06 * q * gauss(r), r: .2 * q, d: .16 * q, t: .55 + .2 * k / pts.length }));
    // rings in the free corners (three rings each, as small as the room allows)
    const R3 = (1.15 + .95 * 2.4) * q, ci = i1 + 1.6 * q + R3;
    for (const [cx, cy] of [[ci, ci], [W - ci, ci], [ci, H - ci], [W - ci, H - ci]]) {
      let free = true; for (let a = 0; a < TAU; a += .4) if (at(F, Mc, cx + R3 * Math.cos(a), cy + R3 * Math.sin(a)) > .02) free = false;
      if (at(F, Mc, cx, cy) > .02) free = false;
      if (free) out.push(...motif([cx, cy], q, 2, r, .78, .98)); }
    return out; } };
}

// ---- the other pieces: each a piece of sheet cut to its place ------------------------------------------------------------
const piece = (W, H, u, f, dur) => ({ W, H, u, dur, sheet: true, marks: f });
const ell = (c, a, b, n = 48) => Array.from({ length: n + 1 }, (_, i) => [c[0] + a * Math.cos(TAU * i / n), c[1] + b * Math.sin(TAU * i / n)]);
// a strip (a belt-plate, a diadem): its edges punched, bosses down its middle (the cuirass's rows, ~2 diameters apart)
function strip(x, y, w, h, q, r, t0, t1, { bosses = true, rings = 0 } = {}) {
  const out = plate(w, h, r, .3, t0, x, y), e = .55 * q;
  out.push(...dots([[x + e * 1.4, y + e], [x + w - e * 1.4, y + e]], .85 * q, .22 * q, r, t0, t0 + (t1 - t0) * .3), ...dots([[x + e * 1.4, y + h - e], [x + w - e * 1.4, y + h - e]], .85 * q, .22 * q, r, t0 + (t1 - t0) * .3, t0 + (t1 - t0) * .6));
  if (rings) { const n = Math.max(1, Math.floor(w / (rings * 2.1))); for (let i = 0; i < n; i++) out.push(...motif([x + w * (i + .5) / n, y + h / 2], rings / 3.3, 2, r, t0 + (t1 - t0) * (.6 + .4 * i / n), t0 + (t1 - t0) * (.6 + .4 * (i + 1) / n))); }
  else if (bosses) { const br = Math.min(h * .2, 1.2 * q), n = Math.max(1, Math.floor((w - 2 * br) / (4 * br))); for (let i = 0; i < n; i++) { const t = t0 + (t1 - t0) * (.6 + .4 * i / n);
    out.push({ k: 'boss', x: x + w * (i + .5) / n, y: y + h / 2, r: br, h: .5 * br, t }); } }
  return out; }
export function lineInitial(ch, fs, seed) { const r = rng(seed * 3 + ch.charCodeAt(0)), H = Math.round(fs * 2), q = Math.max(1.6, fs * .08), W = H;
  const draw = fitGlyph(glyph, ch, FACE, H * .5, W * .55, W / 2, H / 2 + H * .02);
  return piece(W, H, q, F => { const Mb = blurMask(F, letterMask(F, draw), .35 * q), out = plate(W, H, r, .5, 0, 0, 0, true);
    out.push(...dots(ell([W / 2, H / 2], W / 2 - 1.3 * q, H / 2 - 1.3 * q), .85 * q, .24 * q, r, .05, .45));
    for (let s = 0; s < 4; s++) out.push({ k: 'edge', Mb, d: .2 * q, sign: 1, band: .22, y0: s * H / 4, y1: (s + 1) * H / 4, t: .5 + s * .1 });
    return out; }, 1200); }
// the paraph: a little disc with the Trundholm motif
export function paraph(fs, seed) { const r = rng(seed), q = Math.max(1.4, fs * .065), W = Math.round(fs * .95);
  return piece(W, W, q, () => [...plate(W, W, r, .5, 0, 0, 0, true), ...motif([W / 2, W / 2], q, 2, r, .1, 1)], 900); }
export function filler(w, lh, seed) { const r = rng(seed * 11 + Math.round(w)), H = Math.round(lh * .5), q = Math.max(1.4, lh * .05);
  return piece(w, H, q, () => strip(0, 0, w, H, q, r, 0, 1), 1200); }
// breaks. 1: three bosses on a short strip; 2: a diadem band of ring motifs; 3: the sun disc
export function brk(rank, w, h, seed) { const r = rng(seed * 17 + rank), q = Math.max(1.4, h * .045);
  if (rank === 1) { const W = h * 1.6, H = Math.round(h * .38); return piece(W, H, q, () => strip(0, 0, W, H, q, r, 0, 1), 1000); }
  if (rank === 2) { const W = Math.min(w, h * 5), H = Math.round(h * .62); return piece(W, H, q, () => strip(0, 0, W, H, q, r, 0, 1, { rings: H * .62 }), 1800); }
  const D = Math.round(h * .95), W = D, c = [D / 2, D / 2];
  return piece(W, D, q, () => { const out = plate(D, D, r, .5, 0, 0, 0, true);
    out.push(...dots(ell(c, D / 2 - 1.2 * q, D / 2 - 1.2 * q, 96), .85 * q, .24 * q, r, .02, .2));
    out.push(ring(c, D / 2 - 2.4 * q, .45 * q, .17 * q, q, r, .22), ring(c, D * .3, .45 * q, .17 * q, q, r, .5));
    // the zone between: hanging triangles of punched lines, then the centre motif with its bead ring (the gold on the bosses only)
    const n = 14, R1 = D * .3 + .6 * q, R2 = D / 2 - 3 * q;
    for (let i = 0; i < n; i++) { const a = TAU * i / n, b = TAU * (i + 1) / n, m = (a + b) / 2;
      out.push(...dots([[c[0] + R2 * Math.cos(a), c[1] + R2 * Math.sin(a)], [c[0] + R1 * Math.cos(m), c[1] + R1 * Math.sin(m)], [c[0] + R2 * Math.cos(b), c[1] + R2 * Math.sin(b)]], .8 * q, .2 * q, r, .25 + .25 * i / n, .25 + .25 * (i + 1) / n)); }
    out.push(...motif(c, q * 1.15, 4, r, .55, 1, true));
    for (let k = 0; k < 6; k++) { const a = TAU * k / 6 + .3, rr = D * .21; out.push(...motif([c[0] + rr * Math.cos(a), c[1] + rr * Math.sin(a)], q * .55, 1, r, .8 + k * .03, .83 + k * .03)); }
    return out; }, 2600); }
export function runout(w, h, seed) { const r = rng(seed * 19), H = Math.round(h * .32), q = Math.max(1.3, h * .04);
  return piece(w, H, q, () => { const out = plate(w, H, r, .5, 0), n = Math.max(2, Math.floor(w / (H * 1.5)));
    for (let i = 0; i < n; i++) { const br = H * .32 * (1 - .6 * i / n); out.push({ k: 'boss', x: H * .7 + (w - H * 1.4) * i / Math.max(1, n - 1), y: H / 2, r: br, h: .5 * br, t: .2 + .8 * i / n }); }
    return out; }, 1200); }
export function frame(kind, w, h, seed, fs = 20) { const r = rng(seed * 23 + kind.length), q = Math.max(1.4, fs * .065), sw = Math.round(fs * .62);
  if (kind === 'quote') return piece(sw, h, q, () => { const out = plate(sw, h, r, .3, 0), br = sw * .26, n = Math.max(2, Math.floor(h / (br * 4)));
    for (let i = 0; i < n; i++) out.push({ k: 'boss', x: sw / 2, y: h * (i + .5) / n, r: br, h: .5 * br, t: .2 + .8 * i / n }); return out; }, 1400);
  if (kind === 'contents') return piece(sw * 1.5, h, q, () => { const W = sw * 1.5, out = plate(W, h, r, .3, 0), n = Math.max(2, Math.floor(h / (W * 1.3)));
    for (let i = 0; i < n; i++) out.push(...motif([W / 2, h * (i + .5) / n], W / 8, 2, r, .2 + .8 * i / n, .2 + .8 * (i + 1) / n)); return out; }, 1600);
  if (kind === 'pull') return piece(w, h, q, () => [...strip(0, 0, w, sw, q, r, 0, .5, { rings: sw * .62 }), ...strip(0, h - sw, w, sw, q, r, .5, 1, { rings: sw * .62 })], 2000);
  if (kind === 'figure') return piece(w, h, q, () => [...strip(0, 0, w, sw * .7, q, r, 0, .5), ...strip(0, h - sw * .7, w, sw * .7, q, r, .5, 1)], 1600);
  if (kind === 'code') return piece(w, h, q, () => [...strip(0, 0, w, sw * .55, q, r, 0, .5, { bosses: false }), ...strip(0, h - sw * .55, w, sw * .55, q, r, .5, 1, { bosses: false })], 1200);
  // aside: four corner plates, each a small disc with the motif
  return piece(w, h, q, () => [[0, 0], [w - sw * 1.3, 0], [0, h - sw * 1.3], [w - sw * 1.3, h - sw * 1.3]].flatMap(([x, y], i) => { const D = sw * 1.3;
    return [...plate(D, D, r, .5, i / 4, x, y, true), ...motif([x + D / 2, y + D / 2], D / 9, 2, r, i / 4, (i + 1) / 4)]; }), 1200);
}
