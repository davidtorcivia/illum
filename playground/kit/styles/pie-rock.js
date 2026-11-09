// PIE · B, the rock (research/24-pie.md, stage 2): figures pecked into granite with a hammer-stone and painted red with a
// brush, after the Bronze Age carvings of Tanum (Vitlycke, Fossum, Aspeberget, Tanumshede). Each piece returns its pits
// ({k:'pit'}, the carver's blows, in his passes) and its brush strokes ({k:'brush'}, along the figure's form, in the
// painter's order); kit/styles/pie-paint.js lays them on a granite field. The red is the modern custom of painting the
// furrows (Tanum, since the 1930s; the carvings themselves are grey): the page says so.
// Measured (scratchpad pie/py/peck.py, grain.py, paint.py), in units of a figure's stroke width W:
//   a figure's stroke swells 3-7x along it (thin limb to heavy keel); ends blunt and round
//   granite grain ~.1-.13 W (autocorrelation, Vitlycke and Tanumshede); the painted edge goes rock to red over ~.1 W
//   inside a painted figure 12-15 % of the surface still shows rock (the brush skipped it); the red varies at the grain's
//   scale and at a stroke's (Tanumshede ~.3 W); its colour p10/p50/p90 #6d3632 / #884a46 / #a06560 (weathered), wet and
//   fresh brighter (Vitlycke rider)
//   the pit (by eye and from the literature [unverified]): ~5 across a line, overlapping ~half
// Drawn from the panels' proportions (by eye from the photographs in tests/pie-refs): the ship (Tanumshede 7: keel and
// gunwale, struts between them, a comb of crew, the keel running on into a prow), the horse, the sun-wheel, the
// footsoles (Vitlycke's "divine footsteps"), the cup mark. Liberties, named as such: the Twins as two horses facing, the
// world-tree, dawn (a sun-wheel rising from a ship), the sky-father (an adorant, arms raised under a wheel), the
// serpent-slayer (an axe-bearer facing a serpent); and the capital itself, carved and painted.
import { rng, gauss, letterMask, blurMask, at, fitGlyph } from './pie-relief.js';
import { glyph } from './copperplate-print.js';

export const FACE = '"Illum PIE Archivo"';
const TAU = Math.PI * 2;
const pts = (f, n = 24) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
const swell = (n, a, b, c = a) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return t < .5 ? a + (b - a) * t * 2 : b + (c - b) * (t - .5) * 2; });
export const arc = (c, R, a0, a1, n = 40) => pts(t => { const a = a0 + (a1 - a0) * t; return [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]; }, n);

// ---- the carver ----------------------------------------------------------------------------------------------------------------
// a filled region pecked in passes at angle a (the carver's arm), pit radius rp
export function fill(inside, bb, rp, r, { t0 = 0, t1 = 1, d = .55, a = -.45 } = {}) {
  const c = Math.cos(a), s = Math.sin(a), [x0, y0, x1, y1] = bb, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + rp, out = [];
  for (let v = -R; v <= R; v += .95 * rp) for (let u = -R; u <= R; u += 1.05 * rp) { const x = cx + c * u - s * v + .22 * rp * gauss(r), y = cy + s * u + c * v + .22 * rp * gauss(r);
    if (inside(x, y)) out.push({ k: 'pit', x, y, r: rp * (1 + .1 * gauss(r)), d: d * rp * (.8 + .4 * r()), ax: -c * .4, ay: -s * .4 }); }
  out.forEach((m, k) => m.t = t0 + (t1 - t0) * k / out.length); return out;
}
// a pecked line along p, width w (number or per point): pits across it at every step
function pecks(p, w, rp, r, d = .55) {
  const out = [], L = [0]; let tot = 0; for (let i = 1; i < p.length; i++) L.push(tot += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const ww = i => Array.isArray(w) ? w[i] : w;
  for (let s = 0, i = 0; s <= tot; s += .6 * rp) { while (i < p.length - 2 && L[i + 1] < s) i++;
    const f = Math.min(1, (s - L[i]) / Math.max(1e-6, L[i + 1] - L[i])), x = p[i][0] + (p[i + 1][0] - p[i][0]) * f, y = p[i][1] + (p[i + 1][1] - p[i][1]) * f;
    const dx = p[i + 1][0] - p[i][0], dy = p[i + 1][1] - p[i][1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, wi = ww(i) + (ww(i + 1) - ww(i)) * f, k = Math.max(1, Math.round(wi / (1.15 * rp)));
    for (let j = 0; j < k; j++) { const o = k === 1 ? 0 : (j / (k - 1) - .5) * (wi - 1.6 * rp);
      out.push({ k: 'pit', x: x + nx * o + .2 * rp * gauss(r), y: y + ny * o + .2 * rp * gauss(r), r: rp * (1 + .1 * gauss(r)), d: d * rp * (.8 + .4 * r()) }); } }
  return out; }
// a figure's line: pecked, then painted along the same path with a brush as wide as the furrow (a wide furrow takes
// two passes). Returns its pits then its strokes; the brush's load and the order come from the figure's builder
export function stroke(p, w, rp, r, { brush = true, load = 1 } = {}) {
  const out = pecks(p, w, rp, r); if (!brush) return out;
  const W = Math.max(...(Array.isArray(w) ? w : [w])), bw = Math.min(W * 1.08, rp * 7);
  if (W <= bw * 1.25) out.push({ k: 'brush', p, w: Array.isArray(w) ? w.map(v => v * 1.08) : w * 1.08, load });
  else { const n = Math.ceil(W / (bw * .85)); for (let j = 0; j < n; j++) { const o = (j / (n - 1) - .5);
    const q = p.map((pt, i) => { const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, wi = Array.isArray(w) ? w[i] : w;
      return [pt[0] - dy / l * o * (wi - bw * .7), pt[1] + dx / l * o * (wi - bw * .7)]; });
    out.push({ k: 'brush', p: j % 2 ? q.slice().reverse() : q, w: bw, load }); } }
  return out; }
// a region painted with the brush along its own form: at each point the direction in which the region runs longest
// (of four) is the stroke's; strokes are those runs, bw apart, longest first
export function brushFill(inside, bb, bw, { load = 1 } = {}) {
  const [x0, y0, x1, y1] = bb, step = Math.max(.75, bw / 6), D = [[1, 0], [0, 1], [.7071, .7071], [.7071, -.7071]];
  const run = (x, y, d) => { let n = 0; for (const sg of [1, -1]) for (let k = 1; k < 400; k++) { if (!inside(x + sg * d[0] * k * step, y + sg * d[1] * k * step)) break; n++; } return n; };
  const memo = new Map(), dirAt = (x, y) => { const key = Math.round(x / step) * 65536 + Math.round(y / step); let b = memo.get(key); if (b !== undefined) return b;
    const v = D.map(d => run(x, y, d)), hv = Math.max(v[0], v[1]), dg = Math.max(v[2], v[3]); b = v.map((q, k) => k < 2 && q >= hv * .8); memo.set(key, b); return b; };   // (a letter's strokes are painted along and across it; diagonals crossed into X's)   // (every direction the region runs nearly as long in)
  const out = [], cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
  D.forEach((d, k) => { const nx = -d[1], ny = d[0];
    for (let v = -R; v <= R; v += bw * .8) { let seg = null;
      for (let u = -R; u <= R + step; u += step) { const x = cx + d[0] * u + nx * v, y = cy + d[1] * u + ny * v, ok = u <= R && inside(x, y) && dirAt(x, y)[k];
        if (ok) { if (!seg) seg = [[x, y]]; else seg[1] = [x, y]; }
        else if (seg) { if (seg[1] && Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]) > bw * .5) out.push({ k: 'brush', p: seg, w: bw, load, len: Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]) }); seg = null; } } } });
  return out.sort((a, b) => b.len - a.len);
}
// order a figure: all pits (in the passes they were laid) before any paint, then the strokes as listed
const ordered = parts => { const pits = parts.filter(m => m.k === 'pit'), br = parts.filter(m => m.k === 'brush'); pits.forEach((m, k) => m.t = k / pits.length); return [...pits, ...br]; };

// ---- the figures -------------------------------------------------------------------------------------------------------------
// a cup mark: a round hollow ground deep; painted, the paint pools in it
export const cup = (x, y, R, r) => [{ k: 'pit', x, y, r: R, d: .9 * R, rim: .05 }, { k: 'brush', p: [[x - R * .3, y], [x + R * .3, y]], w: R * 2.1, load: 1.2 }];
// the sun-wheel: a ring and a cross (four spokes)
export function wheel(c, R, lw, rp, r) { return [...stroke(arc(c, R, -1.4, 4.95, 48), lw, rp, r), ...stroke([[c[0] - R, c[1]], [c[0] + R, c[1]]], lw * .9, rp, r), ...stroke([[c[0], c[1] - R], [c[0], c[1] + R]], lw * .9, rp, r)]; }
// a ship (Tanumshede 7): the keel, heavy in the middle, running on past the bow into an up-curled prow; the gunwale over
// it, joined to the keel at the stern; struts between them; the crew a comb of short strokes on the gunwale
export function ship(x, y, L, h, lw, rp, r, { crew = 1, sun = false } = {}) {
  const ky = t => y + h * .1 * Math.sin(Math.PI * t), gy = t => y - h * .32 + h * .06 * Math.sin(Math.PI * t);
  const keel = pts(t => [x + L * t, ky(t) - (t > .9 ? ((t - .9) / .1) ** 2 * h * .25 : 0)], 40);
  // the prow: the keel runs on and rises, then hooks back (a swan's neck); the stern rises shorter
  const kx = x + L, ke = ky(1) - h * .25, prow = [keel[40], [kx + h * .12, ke - h * .3], [kx + h * .16, ke - h * .62], [kx + h * .08, ke - h * .82], [kx - h * .06, ke - h * .78], [kx - h * .08, ke - h * .66]];
  const stern = [[x, ky(0)], [x - h * .14, ky(0) - h * .3], [x - h * .2, ky(0) - h * .62]];
  const gun = pts(t => [x + L * (.02 + .9 * t), gy(.02 + .9 * t)], 30);
  const out = [...stroke(keel, swell(41, lw * .8, lw * 1.8, lw * .9), rp, r), ...stroke(prow, swell(6, lw * .95, lw * .8, lw * .95), rp, r), ...stroke(stern, swell(3, lw * .85, lw * .7, lw * .55), rp, r), ...stroke(gun, lw * .7, rp, r)];
  const ns = Math.max(3, Math.round(L / (h * .55)));
  for (let i = 1; i < ns; i++) { const u = .02 + .9 * i / ns; out.push(...stroke([[x + L * u, gy(u)], [x + L * u, ky(u)]], lw * .65, rp, r)); }
  if (crew) { const nc = Math.max(4, Math.round(L / (h * .22)));
    for (let i = 1; i < nc; i++) { const u = .05 + .85 * i / nc, cx = x + L * u + .03 * h * gauss(r); out.push(...stroke([[cx, gy(u)], [cx + .02 * h, gy(u) - h * (.26 + .06 * r())]], [lw * .6, lw * .72], rp, r)); } }
  return out; }
// a horse, as Tanum's carvers drew one: a long body thick at chest and rump, a neck rising at ~50 degrees to a small
// head, four legs (front and back pairs apart), a hanging tail. s: body length; facing dir
export function horse(x, y, s, dir, lw, rp, r) { const X = u => x + dir * u * s;
  const body = pts(t => [X(-.5 + t), y - .05 * s * Math.sin(Math.PI * t)], 14);
  return [...stroke(body, swell(15, lw * 1.5, lw * 1.25, lw * 1.7), rp, r),
    ...stroke([[X(.46), y - .02 * s], [X(.62), y - .26 * s], [X(.7), y - .36 * s]], [lw * 1.3, lw * 1, lw * .9], rp, r),
    ...stroke([[X(.66), y - .38 * s], [X(.86), y - .3 * s]], [lw * 1, lw * .7], rp, r),
    ...[[.42, .04], [.3, -.03], [-.38, .04], [-.48, -.04]].flatMap(([u, k]) => stroke([[X(u), y + .03 * s], [X(u + k), y + .22 * s], [X(u + k * .5), y + .42 * s]], [lw * .85, lw * .7, lw * .6], rp, r)),
    ...stroke([[X(-.5), y - .02 * s], [X(-.62), y + .12 * s], [X(-.64), y + .3 * s]], [lw * .8, lw * .65, lw * .45], rp, r)]; }
// a footsole: the outline of a foot with a bar across the instep (Vitlycke)
export function foot(x, y, s, a, lw, rp, r) { const c = Math.cos(a), sn = Math.sin(a), T = ([u, v]) => [x + c * u - sn * v, y + sn * u + c * v];
  return [...stroke(pts(t => { const q = t * TAU; return T([s * .22 * Math.sin(q) * (1 + .25 * Math.cos(q)), -s * .5 * Math.cos(q)]); }, 36), lw * .75, rp, r), ...stroke([T([-s * .2, s * .05]), T([s * .2, s * .05])], lw * .7, rp, r)]; }
// a man (the Vitlycke warrior's build: heavy calves, a long trunk); arms: 'up' (the adorant), 'axe' (raised, an axe in hand)
export function man(x, y, s, lw, rp, r, arms = 'up', dir = 1) { const X = u => x + dir * u * s;
  const out = [...stroke([[X(0), y - s * .55], [X(0), y]], [lw * 1.1, lw * 1.3], rp, r), ...stroke(arc([X(0), y - s * .64], s * .07, 0, TAU, 16), lw * .8, rp, r),
    ...stroke([[X(0), y], [X(-.12), y + s * .22], [X(-.1), y + s * .44]], [lw * 1.2, lw * 1.6, lw * .9], rp, r), ...stroke([[X(0), y], [X(.13), y + s * .22], [X(.16), y + s * .44]], [lw * 1.2, lw * 1.6, lw * .9], rp, r)];
  if (arms === 'up') out.push(...stroke([[X(-.3), y - s * .82], [X(-.22), y - s * .5], [X(0), y - s * .42], [X(.22), y - s * .5], [X(.3), y - s * .82]], lw * .9, rp, r));
  else { out.push(...stroke([[X(-.2), y - s * .2], [X(0), y - s * .42], [X(.18), y - s * .62], [X(.24), y - s * .82]], lw * .9, rp, r), ...stroke([[X(.16), y - s * .9], [X(.34), y - s * .78], [X(.3), y - s * .68]], lw * 1.1, rp, r)); }
  return out; }
// a serpent: a long line in slow waves, its head a little heavier
export function serpent(x, y, L, amp, dir, lw, rp, r) { const p = pts(t => [x + dir * L * t, y + amp * Math.sin(t * 3.2 * Math.PI) * (.4 + .6 * t)], 48);
  return [...stroke(p, swell(49, lw * .5, lw * .95, lw * 1.25), rp, r)]; }
// a tree: a trunk with branches lifting off it in pairs (the world-tree; a liberty)
export function tree(x, y, h, lw, rp, r, n = 4) { const out = stroke([[x, y], [x, y - h]], swell(3, lw * 1.3, lw * 1, lw * .6), rp, r);
  for (let i = 0; i < n; i++) { const yy = y - h * (.3 + .6 * i / n), L = h * .32 * (1 - .4 * i / n); out.push(...stroke([[x, yy], [x + L, yy - L * .7]], [lw * .8, lw * .55], rp, r), ...stroke([[x, yy], [x - L, yy - L * .7]], [lw * .8, lw * .55], rp, r)); }
  return out; }

const piece = (W, H, lw, f, o = {}) => ({ W, H, u: lw / 4.5, g: Math.max(1.1, lw * .12), stri: lw * 1.1, dur: o.dur ?? 2200, slab: o.slab, seed: o.seed ?? 1, marks: F => ordered(f(F)) });

// ---- the drop: a rock panel; the capital pecked and painted; a ship under it, the sun-wheel in its counter or at its
// shoulder, a row of cup marks where there is room ----------------------------------------------------------------------
export function initial(ch, H, seed, fs = 20, face = FACE) {
  const r = rng(seed * 13 + ch.charCodeAt(0)), W = Math.round(H * 1.08), lw = H * .055, rp = lw / 4.5, m = H * .07;
  let draw = fitGlyph(glyph, ch, face, H * .56, W * .62, W * .44, H * .4); draw = fitGlyph(glyph, ch, face, H * .56, W * .62, W * .44, H * .4 - (draw.box[1] - m * 1.3));
  return piece(W, H, lw, F => { const M = letterMask(F, draw), Md = blurMask(F, M, rp * .8), inside = (x, y) => at(F, M, x, y) > .5, wide = (x, y) => at(F, Md, x, y) > .3, [bx0, by0, bx1, by1] = draw.box, out = [];
    const stem = Math.max(lw, (by1 - by0) * .2);
    out.push(...fill(inside, draw.box, rp, r), ...brushFill(wide, [bx0 - rp, by0 - rp, bx1 + rp, by1 + rp], Math.min(stem * .62, rp * 8)));
    // the sun-wheel: in the letter's counter if one is big enough, else at its shoulder
    const R = H * .1; let wc = null;
    for (let y = by0 + R; y < by1 - R && !wc; y += 1) for (let x = bx0 + R; x < bx1 - R && !wc; x += 1) {
      let ok = true; for (let a = 0; a < TAU && ok; a += .4) if (at(F, M, x + (R + lw) * Math.cos(a), y + (R + lw) * Math.sin(a)) > .05) ok = false;
      if (ok && at(F, M, x - R * 2, y) > .5 && at(F, M, x + R * 2, y) > .5) wc = [x, y]; }
    if (!wc && W - bx1 > 2 * R + 2.2 * m) wc = [W - m - R, by0 + R];
    if (wc) out.push(...wheel(wc, wc[1] === by0 + R ? R : R * .8, lw * .8, rp, r));
    out.push(...ship(m + H * .06, H - m * 1.3, W - 2 * m - H * .2, H * .2, lw * .7, rp, r, { crew: 0 }));
    return out; }, { slab: [0, 0, W, H], seed, dur: 3200 });
}
export function lineInitial(ch, fs, seed) { const r = rng(seed * 3 + ch.charCodeAt(0)), H = Math.round(fs * 1.9), lw = fs * .3, rp = lw / 4.5;
  const draw = glyph(ch, FACE, H * .9, H * .6, H / 2), W = Math.ceil(draw.box[2] + 2 * rp);
  return piece(W, H, lw, F => { const M = letterMask(F, draw), Md = blurMask(F, M, rp * .8), inside = (x, y) => at(F, M, x, y) > .5; return [...fill(inside, draw.box, rp, r), ...brushFill((x, y) => at(F, Md, x, y) > .3, draw.box.map((v, k) => v + (k < 2 ? -rp : rp)), rp * 6)]; }, { seed, dur: 1600 }); }
export function paraph(fs, seed) { const r = rng(seed), R = fs * .27, lw = fs * .3; return piece(fs * .8, fs * .8, lw, () => cup(fs * .4, fs * .42, R, r), { seed, dur: 600 }); }
export function filler(w, lh, seed) { const r = rng(seed * 11 + Math.round(w)), h = lh * .62, lw = lh * .1, H = Math.round(lh * 1.05);
  return piece(w, H, lw, () => ship(h * .45, H * .8, w - h * 1.1, h, lw, lw / 4.5, r, { crew: w > 5 * h }), { seed, dur: 1800 }); }
// breaks. 1: a row of cup marks; 2: the sun-wheel between two footsoles; 3: a panel: a fleet under the sun (seed 0), dawn
// (1), the serpent-slayer (2), the sky-father (3)
export function brk(rank, w, h, seed, variant = null) { const r = rng(seed * 17 + rank);
  if (rank === 1) { const W = h * 2, H = h * .55, lw = h * .12; return piece(W, H, lw, () => [.16, .38, .62, .84].flatMap((u, k) => cup(W * u, H / 2 + (k % 2 ? -1 : 1) * H * .06, H * (k % 3 ? .18 : .22), r)), { seed, dur: 1100 }); }
  if (rank === 2) { const W = h * 2.9, H = h * .95, lw = H * .075, rp = lw / 4.5;
    return piece(W, H, lw, () => [...foot(W * .14, H * .5, H * .62, -.12, lw, rp, r), ...wheel([W / 2, H / 2], H * .34, lw * 1.05, rp, r), ...foot(W * .86, H * .5, H * .62, .12, lw, rp, r)], { seed, dur: 2000 }); }
  const v = variant ?? seed % 4, W = Math.min(w, h * 4.4), H = h, lw = H * .042, rp = lw / 4.5, P = { slab: [0, 0, W, H], seed, dur: 4200 };
  if (v === 1) return piece(W, H, lw, () => [...ship(W * .2, H * .78, W * .55, H * .26, lw, rp, r), ...stroke(arc([W * .47, H * .48], H * .2, Math.PI * 1.02, Math.PI * 1.98, 30), lw, rp, r),
    ...[0, 1, 2, 3, 4].flatMap(k => { const a = Math.PI * (1.12 + .19 * k); return stroke([[W * .47 + H * .25 * Math.cos(a), H * .48 + H * .25 * Math.sin(a)], [W * .47 + H * .36 * Math.cos(a), H * .48 + H * .36 * Math.sin(a)]], [lw * .8, lw * .5], rp, r); }),
    ...cup(W * .1, H * .3, H * .045, r), ...cup(W * .88, H * .34, H * .045, r)], P);
  if (v === 2) return piece(W, H, lw, () => [...man(W * .3, H * .6, H * .6, lw * 1.1, rp, r, 'axe'), ...serpent(W * .45, H * .8, W * .48, H * .07, 1, lw * 1.1, rp, r), ...cup(W * .9, H * .25, H * .05, r)], P);
  if (v === 3) return piece(W, H, lw, () => [...wheel([W / 2, H * .17], H * .12, lw, rp, r), ...man(W / 2, H * .7, H * .48, lw * 1.1, rp, r, 'up'), ...horse(W * .2, H * .6, H * .42, 1, lw, rp, r), ...horse(W * .8, H * .6, H * .42, -1, lw, rp, r)], P);
  return piece(W, H, lw, () => [...ship(W * .06, H * .86, W * .4, H * .22, lw, rp, r), ...ship(W * .52, H * .62, W * .4, H * .22, lw, rp, r),
    ...wheel([W * .72, H * .2], H * .13, lw, rp, r), ...stroke([[W * .72, H * .33], [W * .72, H * .44]], lw * .8, rp, r), ...horse(W * .25, H * .42, H * .34, 1, lw, rp, r), ...cup(W * .45, H * .18, H * .04, r), ...cup(W * .9, H * .9, H * .05, r)], P);
}
// the heading's run-out: a row of cup marks running out smaller, as cups do on the panels
export function runout(w, h, seed) { const r = rng(seed * 19), H = Math.round(h * .6), lw = H * .3, n = Math.max(3, Math.floor(w / (H * 1.3)));
  return piece(w, H, lw, () => Array.from({ length: n }, (_, k) => cup(H * .5 + (w - H) * k / (n - 1), H / 2, H * .3 * (1 - .55 * k / n), r)).flat(), { seed, dur: 1400 }); }
export function frame(kind, w, h, seed, fs = 20) { const r = rng(seed * 23 + kind.length), lw = fs * .22, rp = lw / 4.5;
  if (kind === 'quote') { const W = fs * 1.6; return piece(W, h, lw, () => tree(W * .5, h - fs * .2, h - fs * .4, lw, rp, r, Math.max(2, Math.floor(h / (fs * 1.2)))), { seed, dur: 1800 }); }
  if (kind === 'pull') { const s = fs * 2.3; return piece(w, s * .95, lw, () => [...horse(w / 2 - s * 1.1, s * .42, s, 1, lw * 1.1, rp, r), ...horse(w / 2 + s * 1.1, s * .42, s, -1, lw * 1.1, rp, r), ...wheel([w / 2, s * .32], s * .22, lw, rp, r)], { seed, dur: 2600 }); }
  if (kind === 'aside') return piece(w, h, lw, () => [[1, 1], [w - 1, 1], [1, h - 1], [w - 1, h - 1]].flatMap(([x, y]) => cup(x + Math.sign(w / 2 - x) * fs * .35, y + Math.sign(h / 2 - y) * fs * .35, fs * .17, r)), { seed, dur: 1000 });
  if (kind === 'figure') return piece(w, h, lw, () => [...stroke([[fs * .3, fs * .3], [w - fs * .3, fs * .3]], lw * .8, rp, r), ...stroke([[fs * .3, h - fs * .3], [w - fs * .3, h - fs * .3]], lw * .8, rp, r)], { seed, dur: 1600 });
  if (kind === 'code') return piece(w, h, lw, () => [...stroke([[0, lw], [w, lw]], lw * .6, rp, r), ...stroke([[0, lw * 2.6], [w, lw * 2.6]], lw * .6, rp, r)], { seed, dur: 1400 });
  const W = fs * 1.2; return piece(W, h, lw, () => { const n = Math.max(2, Math.floor(h / (fs * 1.6))), gap = (h - fs * 1.2) / Math.max(1, n - 1), out = [];
    for (let i = 0; i < n; i++) { const y = fs * .6 + i * gap; out.push(...cup(W / 2, y, fs * .2, r)); if (i) out.push(...stroke([[W / 2, y - gap + fs * .25], [W / 2, y - fs * .25]], lw * .7, rp, r)); } return out; }, { seed, dur: 1600 });
}
