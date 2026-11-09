// PIE · B, the rock (research/24-pie.md): figures pecked into granite with a hammer-stone, after the Bronze Age carvings of
// Tanum (Vitlycke, Fossum, Aspeberget) and the cup marks beside them. Every mark is a blow: a pit; a line is a furrow of
// overlapping pits laid by the carver's passes; a figure is filled by passes across it. The red is the modern custom of
// painting the furrows (Tanum, since the 1930s; the carvings themselves are grey), so it is honest only as that.
// Measured on the painted figures (tanumshede-7, scratchpad pie/py/peck.py): a figure's stroke swells 3-7x (p10 to p90
// of its medial width) from a thin limb to its body; ends are blunt and round; the painted edge is smooth (.02 of the
// stroke width rms). The pit: by eye and from the literature [unverified], 4-8 mm across in lines 1.5-3 cm wide, so ~5
// pits across a line; pits overlap ~half; the outermost pits scallop the edge at the pit's own size.
import { rng, gauss, letterMask, at, fitGlyph } from './pie-relief.js';
import { glyph } from './copperplate-print.js';

export const FACE = '"Illum PIE Archivo"';

// a filled region pecked in passes at angle a (the carver's arm), pit radius rp; inside(x, y) is the figure
export function fill(inside, bb, rp, r, { t0 = 0, t1 = 1, d = .55, a = -.45 } = {}) {
  const out = [], c = Math.cos(a), s = Math.sin(a), [x0, y0, x1, y1] = bb, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + rp;
  const passes = [];
  for (let v = -R; v <= R; v += .95 * rp) { const pass = [];
    for (let u = -R; u <= R; u += 1.05 * rp) { const x = cx + c * u - s * v + .22 * rp * gauss(r), y = cy + s * u + c * v + .22 * rp * gauss(r);
      if (inside(x, y)) pass.push({ k: 'pit', x, y, r: rp * (1 + .1 * gauss(r)), d: d * rp * (.8 + .4 * r()), ax: -c * .4, ay: -s * .4 }); }
    if (pass.length) passes.push(pass); }
  const n = passes.reduce((a, q) => a + q.length, 0); let k = 0;
  for (const pass of passes) for (const m of pass) { m.t = t0 + (t1 - t0) * k++ / n; out.push(m); }
  return out;
}
// a pecked line along pts, width w at each point (array or number), pits laid across it at every step
export function line(pts, w, rp, r, { t0 = 0, t1 = 1, d = .55 } = {}) {
  const out = [], L = []; let tot = 0; for (let i = 0; i < pts.length; i++) { if (i) tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(tot); }
  const ww = i => Array.isArray(w) ? w[i] : w;
  for (let s = 0, i = 0; s <= tot; s += .6 * rp) {
    while (i < pts.length - 2 && L[i + 1] < s) i++;
    const f = Math.min(1, (s - L[i]) / Math.max(1e-6, L[i + 1] - L[i])), x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
    const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, wi = ww(i) + (ww(i + 1) - ww(i)) * f;
    const k = Math.max(1, Math.round(wi / (1.15 * rp)));
    for (let j = 0; j < k; j++) { const o = k === 1 ? 0 : (j / (k - 1) - .5) * (wi - 2 * rp * .8);
      out.push({ k: 'pit', x: x + nx * o + .2 * rp * gauss(r), y: y + ny * o + .2 * rp * gauss(r), r: rp * (1 + .1 * gauss(r)), d: d * rp * (.8 + .4 * r()), t: t0 + (t1 - t0) * s / tot }); }
  }
  return out;
}
// a cup mark: a deep round hollow ground and pecked, one of the commonest marks on the rock
export const cup = (x, y, R, r, t = 0) => [{ k: 'pit', x, y, r: R, d: .9 * R, rim: .05, t }];
export const arc = (c, R, a0, a1, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]; });

// the sun-wheel: a ring with a cross in it (the four-spoked wheel), *séh₂ul's wheel
export function wheel(c, R, w, rp, r, t0 = 0, t1 = 1) {
  return [...line(arc(c, R, -1.4, 4.9, 48), w, rp, r, { t0, t1: t0 + (t1 - t0) * .6 }),
    ...line([[c[0] - R, c[1]], [c[0] + R, c[1]]], w * .9, rp, r, { t0: t0 + (t1 - t0) * .6, t1: t0 + (t1 - t0) * .8 }),
    ...line([[c[0], c[1] - R], [c[0], c[1] + R]], w * .9, rp, r, { t0: t0 + (t1 - t0) * .8, t1 })];
}

// ---- the drop: the capital pecked full, a sun-wheel above its shoulder, cup marks at its foot ----------------------------
export function initial(ch, H, seed, fs = 20, face = FACE) {
  const r = rng(seed * 13 + ch.charCodeAt(0)), W = Math.round(H * 1.0), cap = H * .74, rp = Math.max(1, H * .012);
  let draw = fitGlyph(glyph, ch, face, cap * .9, W * .7, W * .4, H * .57); draw = fitGlyph(glyph, ch, face, cap * .9, W * .7, W * .4, H * .57 - (draw.box[1] - rp * 1.5));   // its top on the first line's capitals
  return { W, H, u: rp, marks(F) {
    const M = letterMask(F, draw), [bx0, by0, bx1, by1] = draw.box;
    const out = fill((x, y) => at(F, M, x, y) > .5, [bx0, by0, bx1, by1], rp, r, { t0: 0, t1: .7 });
    const R = H * .13, c = [W - R - rp * 2, R + rp * 2];
    if (!Array.from({ length: 24 }, (_, k) => [Math.cos(k * .2618) * (R + rp * 3) * (k % 2 ? 1 : .5), Math.sin(k * .2618) * (R + rp * 3) * (k % 2 ? 1 : .5)]).some(([dx, dy]) => at(F, M, c[0] + dx, c[1] + dy) > 0)) out.push(...wheel(c, R, rp * 2.2, rp, r, .72, .92));
    out.push(...cup(W - rp * 4, H - rp * 4, rp * 1.8, r, .95), ...cup(W - rp * 9.5, H - rp * 3.2, rp * 1.4, r, .97));
    return out; } };
}

// ---- the figures: each a few pecked lines whose width swells and thins, as the carvings' do --------------------------------
const swell = (n, a, b, c = a) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return t < .5 ? a + (b - a) * t * 2 : b + (c - b) * (t - .5) * 2; });
const pts = (f, n = 24) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
// a ship (the commonest figure at Tanum): a keel line, the hull's gunwale over it, prow and stern rising and curling in,
// the crew as short strokes standing up from the gunwale. Length L, its keel at y, crew every ~.9 h
export function ship(x, y, L, h, rp, r, t0 = 0, t1 = 1, crew = true) {
  const keel = pts(t => [x + L * t, y + h * .18 * Math.sin(Math.PI * t) - (t < .08 ? (1 - t / .08) ** 2 * h * .5 : 0) - (t > .92 ? ((t - .92) / .08) ** 2 * h * .7 : 0)], 40);
  const prow = pts(t => { const a = Math.PI * (1.0 + 1.1 * t); return [x + L + h * .2 + h * .38 * Math.cos(a), y - h * .95 + h * .38 * Math.sin(a)]; }, 14);
  const stern = pts(t => { const a = Math.PI * (2 - 1.1 * t); return [x - h * .15 + h * .3 * Math.cos(a), y - h * .7 + h * .3 * Math.sin(a)]; }, 12);
  const gun = pts(t => [x + L * (.06 + .86 * t), y - h * .32 + h * .1 * Math.sin(Math.PI * t)], 30);
  const out = [...line(keel, swell(41, rp * 1.8, rp * 5.2, rp * 1.6), rp, r, { t0, t1: t0 + (t1 - t0) * .4 }),
    ...line([keel[40], ...prow], swell(15, rp * 2.2, rp * 2, rp * 1.8), rp, r, { t0: t0 + (t1 - t0) * .4, t1: t0 + (t1 - t0) * .5 }),
    ...line([keel[0], ...stern], swell(13, rp * 2.2, rp * 2, rp * 1.8), rp, r, { t0: t0 + (t1 - t0) * .5, t1: t0 + (t1 - t0) * .58 }),
    ...line(gun, swell(31, rp * 1.4, rp * 2.2, rp * 1.3), rp, r, { t0: t0 + (t1 - t0) * .58, t1: t0 + (t1 - t0) * .72 })];
  // the struts between gunwale and keel, and the crew above
  const ns = Math.max(2, Math.round(L / (h * .9)));
  for (let i = 0; i <= ns; i++) { const u = .08 + .84 * i / ns, xx = x + L * u, yk = y + h * .18 * Math.sin(Math.PI * u), yg = y - h * .32 + h * .1 * Math.sin(Math.PI * u), tt = t0 + (t1 - t0) * (.72 + .28 * i / (ns + 1));
    out.push(...line([[xx, yg], [xx + .04 * h * gauss(r), yk]], rp * 1.7, rp, r, { t0: tt, t1: tt + .01 }));
    if (crew && i % 2 === 0 && i > 0 && i < ns) out.push(...line([[xx, yg], [xx + .05 * h, yg - h * (.55 + .12 * r())]], swell(3, rp * 1.8, rp * 1.9, rp * 2.4), rp, r, { t0: tt, t1: tt + .02 })); }
  return out; }
// a horse, as the carvers drew one: a long body, a neck and a small head, four straight legs, a tail. Facing dir
export function horse(x, y, s, dir, rp, r, t0 = 0, t1 = 1) { const X = u => x + dir * u * s, T = k => t0 + (t1 - t0) * k;
  const body = pts(t => [X(-.5 + t), y - .06 * s * Math.sin(Math.PI * t)], 12);
  return [...line(body, swell(13, rp * 3.2, rp * 4.4, rp * 3.6), rp, r, { t0: T(0), t1: T(.35) }),
    ...line([[X(.5), y], [X(.66), y - .32 * s], [X(.86), y - .28 * s]], [rp * 3, rp * 2.4, rp * 2.2], rp, r, { t0: T(.35), t1: T(.5) }),
    ...[-.46, -.26, .26, .46].flatMap((u, k) => line([[X(u), y + .05 * s], [X(u + .02 * (k < 2 ? -1 : 1)), y + .42 * s]], [rp * 2.2, rp * 1.7], rp, r, { t0: T(.5 + k * .1), t1: T(.58 + k * .1) })),
    ...line([[X(-.5), y], [X(-.66), y + .26 * s]], [rp * 2, rp * 1.6], rp, r, { t0: T(.92), t1: T(1) })]; }

const piece = (W, H, u, f, dur) => ({ W, H, u, dur, marks: f });
export function lineInitial(ch, fs, seed) { const r = rng(seed * 3 + ch.charCodeAt(0)), H = Math.round(fs * 1.9), rp = Math.max(1, fs * .06);
  const draw = glyph(ch, FACE, H * .9, H * .6, H / 2), W = Math.ceil(draw.box[2] + 2 * rp);
  return piece(W, H, rp, F => { const M = letterMask(F, draw); return fill((x, y) => at(F, M, x, y) > .5, draw.box, rp, r); }, 1100); }
// the paraph: a cup mark, ground deep (the one mark on the rock with no picture in it)
export function paraph(fs, seed) { const r = rng(seed), R = fs * .27, rp = Math.max(1, fs * .06);
  return piece(fs * .8, fs * .8, rp, () => cup(fs * .4, fs * .42, R, r), 400); }
// the filler: a ship as long as the gap
export function filler(w, lh, seed) { const r = rng(seed * 11 + Math.round(w)), h = lh * .55, rp = Math.max(1, lh * .035), H = Math.round(lh * .95);
  return piece(w, H, rp, () => ship(h * .35, H * .72, w - h * 1.15, h, rp, r, 0, 1, w > 6 * h), 1400); }
// breaks. 1: three cup marks; 2: the sun-wheel between two cups; 3: the sun-ship: the wheel carried over a ship (the
// Bronze Age sun's day journey), a horse ahead of it
export function brk(rank, w, h, seed) { const r = rng(seed * 17 + rank), rp = Math.max(1, h * .028);
  if (rank === 1) { const W = h * 1.6, H = h * .5; return piece(W, H, rp, () => [...cup(W * .2, H / 2, H * .2, r, 0), ...cup(W * .5, H / 2, H * .24, r, .35), ...cup(W * .8, H / 2, H * .2, r, .7)], 900); }
  if (rank === 2) { const W = h * 2.6, H = h * .9, R = H * .36; return piece(W, H, rp, () => [...cup(W * .14, H / 2, H * .11, r, 0), ...wheel([W / 2, H / 2], R, rp * 2.6, rp, r, .12, .88), ...cup(W * .86, H / 2, H * .11, r, .9)], 1600); }
  const W = Math.min(w, h * 4), H = h * .95, R = H * .2;
  return piece(W, H, rp, () => [...ship(W * .08, H * .82, W * .55, H * .32, rp, r, 0, .55, true), ...wheel([W * .36, H * .3], R, rp * 2.4, rp, r, .55, .8), ...horse(W * .85, H * .55, H * .4, -1, rp, r, .8, 1)], 2400); }
// the heading's run-out: a pecked groove thinning away, a cup at its end
export function runout(w, h, seed) { const r = rng(seed * 19), rp = Math.max(1, h * .05), H = Math.round(h * .6);
  return piece(w, H, rp, () => [...line(pts(t => [rp * 2 + (w - 8 * rp) * t, H / 2 + .06 * H * Math.sin(t * 5)], 30), swell(31, rp * 2.6, rp * 1.8, rp * 1.2), rp, r, { t1: .85 }), ...cup(w - 2.6 * rp, H / 2, rp * 1.8, r, .95)], 1200); }
// frames
export function frame(kind, w, h, seed, fs = 20) { const r = rng(seed * 23 + kind.length), rp = Math.max(1, fs * .06);
  if (kind === 'quote') { // the world-tree: a trunk down the margin, its branches lifting off it in pairs
    const W = fs * 1.6; return piece(W, h, rp, () => { const out = line(pts(t => [W * .3 + .03 * W * Math.sin(t * 7), rp * 2 + (h - 4 * rp) * t], 30), swell(31, rp * 1.4, rp * 2.6, rp * 3.2), rp, r, { t1: .5 });
      const n = Math.max(2, Math.floor(h / (fs * 1.4))); for (let i = 0; i < n; i++) { const y = fs * .6 + i * (h - fs * 1.2) / n, tt = .5 + .5 * i / n;
        out.push(...line([[W * .3, y + fs * .5], [W * .85, y]], [rp * 2, rp * 1.3], rp, r, { t0: tt, t1: tt + .03 }), ...line([[W * .3, y + fs * .5], [W * .05, y + fs * .1]], [rp * 1.8, rp * 1.2], rp, r, { t0: tt + .03, t1: tt + .05 })); }
      return out; }, 1800); }
  if (kind === 'pull') return piece(w, h, rp, () => { const s = fs * 2.2; // the Twins: two horses facing over the quotation
    return [...horse(w / 2 - s * 1.05, s * .5, s, 1, rp, r, 0, .5), ...horse(w / 2 + s * 1.05, s * .5, s, -1, rp, r, .5, 1)]; }, 2200);
  if (kind === 'aside') return piece(w, h, rp, () => [[1, 1], [w - 1, 1], [1, h - 1], [w - 1, h - 1]].flatMap(([x, y], i) => cup(x + Math.sign(w / 2 - x) * fs * .35, y + Math.sign(h / 2 - y) * fs * .35, fs * .17, r, i / 4)), 900);
  if (kind === 'figure') return piece(w, h, rp, () => [...line([[fs * .3, fs * .3], [w - fs * .3, fs * .3]], rp * 1.8, rp, r, { t1: .5 }), ...line([[fs * .3, h - fs * .3], [w - fs * .3, h - fs * .3]], rp * 1.8, rp, r, { t0: .5 })], 1400);
  if (kind === 'code') return piece(w, h, rp, () => [...line([[0, rp * 2], [w, rp * 2]], rp * 1.5, rp, r, { t1: .5 }), ...line([[0, rp * 5], [w, rp * 5]], rp * 1.5, rp, r, { t0: .5 })], 1200);
  // contents: cups joined by a channel, down the margin (cup-and-channel)
  const W = fs * 1.2; return piece(W, h, rp, () => { const n = Math.max(2, Math.floor(h / (fs * 1.6))), out = [];
    for (let i = 0; i < n; i++) { const y = fs * .6 + i * (h - fs * 1.2) / Math.max(1, n - 1); out.push(...cup(W / 2, y, fs * .2, r, i / n)); if (i) out.push(...line([[W / 2, y - (h - fs * 1.2) / Math.max(1, n - 1) + fs * .25], [W / 2, y - fs * .25]], rp * 1.4, rp, r, { t0: i / n - .05, t1: i / n })); }
    return out; }, 1400);
}
