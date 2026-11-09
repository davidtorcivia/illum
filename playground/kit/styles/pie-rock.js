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
import { rng, gauss } from './pie-relief.js';
import { letterStrokes, letterWidth } from './pie-letters.js';

const TAU = Math.PI * 2;
const pts = (f, n = 24) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
const swell = (n, a, b, c = a) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return t < .5 ? a + (b - a) * t * 2 : b + (c - b) * (t - .5) * 2; });
export const arc = (c, R, a0, a1, n = 40) => pts(t => { const a = a0 + (a1 - a0) * t; return [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]; }, n);
// a pecked ring: never a circle. Its radius swells and dips (two and three lobes, ~6 % and ~3.5 %: by eye from the panels'
// wheels and cup rings), its centre is off a little, and the groove's two ends overlap where the carver closed it
export const loop = (c, R, r, n = 44) => { const p1 = r() * 6.28, p2 = r() * 6.28, a0 = r() * 6.28, cx = c[0] + R * .04 * gauss(r), cy = c[1] + R * .04 * gauss(r), e = 1 + .05 * gauss(r);
  return pts(t => { const a = a0 + t * 6.28 * 1.05, rr = R * (1 + .06 * Math.sin(2 * a + p1) + .035 * Math.sin(3 * a + p2)); return [cx + rr * Math.cos(a) * e, cy + rr * Math.sin(a) / e]; }, n); };

// ---- the carver ----------------------------------------------------------------------------------------------------------------
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
// the hand in a groove (figures, not letters, which carry their own): resampled along its length, its course wandering off
// the drawn line by ~.07 of its width (measured: a Tanumshede keel departs from a smooth curve by .066 of the hull band,
// rms) over a slow and a quick wavelength (the arm's reach, the stone's angle), its width breathing ±12 %
function handed(p, w, r) { const W0 = (Array.isArray(w) ? w.reduce((a, v) => a + v, 0) / w.length : w), L = [0]; let tot = 0;
  for (let i = 1; i < p.length; i++) L.push(tot += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const n = Math.max(2, Math.ceil(tot / Math.max(.6, W0 * .5))), ww = i => Array.isArray(w) ? w[i] : w, P = [], Wd = [], ph = [r() * 6.28, r() * 6.28, r() * 6.28], l1 = W0 * (2 + 1.5 * r()), l2 = W0 * (.8 + .4 * r());
  for (let k = 0, i = 0; k <= n; k++) { const sv = tot * k / n; while (i < p.length - 2 && L[i + 1] < sv) i++; const f = Math.min(1, (sv - L[i]) / Math.max(1e-6, L[i + 1] - L[i]));
    const x = p[i][0] + (p[i + 1][0] - p[i][0]) * f, y = p[i][1] + (p[i + 1][1] - p[i][1]) * f, dx = p[i + 1][0] - p[i][0], dy = p[i + 1][1] - p[i][1], l = Math.hypot(dx, dy) || 1, wi = ww(i) + (ww(i + 1) - ww(i)) * f;
    const o = W0 * .07 * (.7 * Math.sin(ph[0] + sv / l1) + .3 * Math.sin(ph[1] + sv / l2)) * Math.min(1, sv / W0, (tot - sv) / W0 + .3);
    P.push([x - dy / l * o, y + dx / l * o]); Wd.push(wi * (1 + .12 * Math.sin(ph[2] + sv / (W0 * 1.6)))); }
  return [P, Wd]; }
export function stroke(p, w, rp, r, { brush = true, load = 1, hand: hd = 1 } = {}) {
  if (hd && p.length > 1) [p, w] = handed(p, w, r);
  const out = pecks(p, w, rp, r); if (!brush) return out;
  const W = Math.max(...(Array.isArray(w) ? w : [w])), bw = Math.min(W * 1.08, rp * 7);
  if (W <= bw * 1.25) { // the brush is dipped again every ~9 widths along a long groove, so a loop or a keel never runs dry halfway
    const L = [0]; for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    const step = W * 9, n = Math.max(1, Math.round(L.at(-1) / step)), wv = Array.isArray(w) ? w.map(v => v * 1.08) : null;
    for (let k = 0; k < n; k++) { const a = L.at(-1) * k / n - W * .4, b = L.at(-1) * (k + 1) / n; const idx = p.map((_, i) => i).filter(i => L[i] >= a && L[i] <= b + 1e-6);
      if (idx.length < 2) { if (n === 1) out.push({ k: 'brush', p, w: wv ?? w * 1.08, load }); continue; }
      out.push({ k: 'brush', p: idx.map(i => p[i]), w: wv ? idx.map(i => wv[i]) : w * 1.08, load }); } }
  else { const n = Math.ceil(W / (bw * .85)); for (let j = 0; j < n; j++) { const o = (j / (n - 1) - .5);
    const q = p.map((pt, i) => { const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, wi = Array.isArray(w) ? w[i] : w;
      return [pt[0] - dy / l * o * (wi - bw * .7), pt[1] + dx / l * o * (wi - bw * .7)]; });
    out.push({ k: 'brush', p: j % 2 ? q.slice().reverse() : q, w: bw, load }); } }
  return out; }
// order a figure: all pits (in the passes they were laid) before any paint, then the strokes as listed
const ordered = parts => { const pits = parts.filter(m => m.k === 'pit'), br = parts.filter(m => m.k === 'brush'); pits.forEach((m, k) => m.t = k / pits.length); return [...pits, ...br]; };

// ---- the figures -------------------------------------------------------------------------------------------------------------
// a cup mark: a round hollow ground deep; painted, the paint pools in it
export const cup = (x, y, R, r, deep = 1) => [{ k: 'pit', x, y, r: R, d: .9 * R * deep, rim: .05 }, { k: 'brush', p: [[x - R * .3, y], [x + R * .3, y]], w: R * 2.1, load: 1.2 }];
// the sun-wheel: a ring and a cross (four spokes)
// the sun-wheel: a broad rim (never round, its width breathing), two spokes crossing neither at a right angle nor at the
// centre, each overrunning or falling short of the rim a little
export function wheel(c, R, lw, rp, r) { const rim = loop(c, R, r), mx = c[0] + R * .07 * gauss(r), my = c[1] + R * .07 * gauss(r), out = stroke(rim, rim.map((_, i) => lw * 1.35 * (1 + .18 * Math.sin(i * .4 + r()))), rp, r);
  for (const a of [.0, Math.PI / 2]) { const t = a + .07 * gauss(r), k1 = R * (1 + .05 * gauss(r)), k2 = R * (1 + .05 * gauss(r)); out.push(...stroke([[mx - Math.cos(t) * k1, my - Math.sin(t) * k1], [mx + Math.cos(t) * k2, my + Math.sin(t) * k2]], [lw * 1.05, lw * .85, lw * 1.1], rp, r)); }
  return out; }
// a ship (Tanumshede 7): the keel, heavy in the middle, running on past the bow into an up-curled prow; the gunwale over
// it, joined to the keel at the stern; struts between them; the crew a comb of short strokes on the gunwale
export function ship(x, y, L, h, lw, rp, r, { crew = 1, reach = null, high = 1, double = false } = {}) {
  const ky = t => y + h * .1 * Math.sin(Math.PI * t), gy = t => y - h * .32 + h * .06 * Math.sin(Math.PI * t);
  const keel = pts(t => [x + L * t, ky(t) - (t > .9 ? ((t - .9) / .1) ** 2 * h * .25 : 0)], 40);
  // the prow: the keel runs on and rises, then hooks back (a swan's neck); the stern rises shorter
  const kx = x + L, ke = ky(1) - h * .25, hh = h * high, prow = [keel[40], [kx + h * .12, ke - hh * .3], [kx + h * .16, ke - hh * .62], [kx + h * .08, ke - hh * .82], [kx - h * .06, ke - hh * .78], [kx - h * .08, ke - hh * .66]];
  const stern = [[x, ky(0)], [x - h * .14, ky(0) - hh * .3], [x - h * .2, ky(0) - hh * .62], ...(high > 1.2 ? [[x - h * .1, ky(0) - hh * .8], [x + h * .02, ky(0) - hh * .74]] : [])];
  const gun = pts(t => [x + L * (.02 + .9 * t), gy(.02 + .9 * t)], 30);
  const out = [...stroke(keel, keel.map((_, i) => lw * (1.3 + 1.3 * Math.sin(Math.PI * i / 40) ** .7 + .9 * (i / 40) ** 3)), rp, r), ...stroke(prow, swell(prow.length, lw * 2.1, lw * 1.4, lw * 1.2), rp, r), ...stroke(stern, swell(stern.length, lw * 1.3, lw * .95, lw * .75), rp, r), ...stroke(gun, lw * 1.05, rp, r)];
  if (double) out.push(...stroke(pts(t => [x + L * (.04 + .9 * t), ky(.04 + .9 * t) + h * .26 * Math.sin(Math.PI * (.04 + .9 * t)) ** .5], 30), swell(31, lw * .55, lw * 1.1, lw * .55), rp, r));   // a second keel line under the first (Tanum's double-lined hulls)
  const ns = Math.max(3, Math.round(L / (h * .55)));
  for (let i = 1; i < ns; i++) { const u = .02 + .9 * (i + .25 * gauss(r)) / ns; out.push(...stroke([[x + L * u, gy(u)], [x + L * u + .04 * h * gauss(r), ky(u)]], lw * .85, rp, r)); }
  if (crew) { const nc = Math.max(4, Math.round(L / (h * .22)));
    // (crew strokes: their spacing, height and lean uneven, their tops heavier; under a letter, one in three reaches up into it
    // and shares its line, the others stop clear of it)
    for (let i = 1; i < nc; i++) { const u = .05 + .85 * (i + .3 * gauss(r)) / nc, cx = x + L * u, top = reach ? reach(cx) : null, y0 = gy(u), yn = y0 - h * (.22 + .12 * r());
      const y1 = top === null ? yn : i % 3 === 1 && top > y0 - h * 1.6 ? top + lw * .3 : Math.max(yn, top + lw * 2.2);
      if (y0 - y1 > lw) out.push(...stroke([[cx, y0], [cx + .06 * h * gauss(r), y1]], [lw * .75, lw * 1.05], rp, r)); } }
  return out; }
// a horse, as Tanum's carvers drew one: a long body thick at chest and rump, a neck rising at ~50 degrees to a small
// head, four legs (front and back pairs apart), a hanging tail. s: body length; facing dir
export function horse(x, y, s, dir, lw, rp, r) { const X = u => x + dir * u * s, j = () => .04 * gauss(r);   // each leg its own length and lean
  const body = pts(t => [X(-.48 + .96 * t), y - .05 * s * Math.sin(Math.PI * t) + .03 * s * Math.sin(t * 9)], 16);
  return [...stroke(body, swell(17, lw * 2.3, lw * 1.9, lw * 2.6), rp, r),
    ...stroke([[X(.4), y - .02 * s], [X(.52), y - .18 * s], [X(.6), y - .28 * s]], [lw * 2.2, lw * 1.6, lw * 1.3], rp, r),
    ...stroke([[X(.58), y - .3 * s], [X(.7), y - .25 * s], [X(.79), y - .17 * s]], [lw * 1.45, lw * 1.2, lw * 1], rp, r),   // the head, long and dropped to the muzzle
    ...stroke([[X(.57), y - .3 * s], [X(.56), y - .38 * s]], [lw * .7, lw * .45], rp, r),
    ...[[.4, .05], [.29, -.03], [-.33, .05], [-.44, -.05]].flatMap(([u, k]) => { const L = .4 + j(); return stroke([[X(u + j() * .3), y + .03 * s], [X(u + k), y + L * .55 * s], [X(u + k * .4 + j() * .5), y + L * s]], [lw * 1.35, lw * .85, lw * .62], rp, r); }),
    ...stroke([[X(-.48), y - .02 * s], [X(-.6), y + .12 * s], [X(-.62), y + .3 * s]], [lw * 1.1, lw * .8, lw * .5], rp, r)]; }
// a footsole: the outline of a foot with a bar across the instep (Vitlycke)
export function foot(x, y, s, a, lw, rp, r) { const c = Math.cos(a), sn = Math.sin(a), T = ([u, v]) => [x + c * u - sn * v, y + sn * u + c * v];
  return [...stroke(pts(t => { const q = t * TAU; return T([s * .22 * Math.sin(q) * (1 + .25 * Math.cos(q)), -s * .5 * Math.cos(q)]); }, 36), lw * .75, rp, r), ...stroke([T([-s * .2, s * .05]), T([s * .2, s * .05])], lw * .7, rp, r)]; }
// a man (the Vitlycke warrior's build: heavy calves, a long trunk); arms: 'up' (the adorant), 'axe' (raised, an axe in hand)
export function man(x, y, s, lw, rp, r, arms = 'up', dir = 1) { const X = u => x + dir * u * s, j = () => .03 * gauss(r);
  const leg = (sg) => { const kx = sg * (.13 + j()), fx = sg * (.15 + j()), L = .44 + j(); return [...stroke([[X(sg * .02), y], [X(kx), y + s * L * .45], [X(fx), y + s * L]], [lw * 1.6, lw * 2.3, lw * .95], rp, r), ...stroke([[X(fx), y + s * L], [X(fx + .12 + j()), y + s * (L + .01)]], [lw * 1.1, lw * .9], rp, r)]; };
  const out = [...stroke([[X(0), y - s * .52], [X(.01), y - s * .25], [X(0), y]], [lw * 1.5, lw * 2.3, lw * 2], rp, r), ...stroke(loop([X(0), y - s * .63], s * .075, r, 18), lw * 1.1, rp, r), ...leg(-1), ...leg(1)];
  const handAt = (hx, hy) => out.push(...stroke([[hx - s * .03, hy], [hx + s * .03, hy - s * .02]], lw * 1.6, rp, r));
  if (arms === 'up') { out.push(...stroke([[X(-.3), y - s * .84], [X(-.22), y - s * .52], [X(0), y - s * .44], [X(.22), y - s * .5], [X(.31), y - s * .82]], [lw * .9, lw * 1.1, lw * 1.3, lw * 1.1, lw * .9], rp, r)); handAt(X(-.3), y - s * .86); handAt(X(.31), y - s * .84); }
  else { out.push(...stroke([[X(-.2), y - s * .22], [X(0), y - s * .42], [X(.18), y - s * .62], [X(.24), y - s * .82]], [lw * .9, lw * 1.3, lw * 1.1, lw * .9], rp, r), ...stroke([[X(.16), y - s * .92], [X(.36), y - s * .8], [X(.31), y - s * .68]], lw * 1.5, rp, r)); handAt(X(-.21), y - s * .2); }
  return out; }
// a serpent: a long line in slow waves, its head a little heavier
export function serpent(x, y, L, amp, dir, lw, rp, r) { const p = pts(t => [x + dir * L * t, y + amp * Math.sin(t * 3.2 * Math.PI) * (.4 + .6 * t)], 48);
  return [...stroke(p, swell(49, lw * .5, lw * .95, lw * 1.25), rp, r)]; }
// a tree: a trunk with branches lifting off it in pairs (the world-tree; a liberty)
export function tree(x, y, h, lw, rp, r, n = 4) { const out = stroke([[x, y], [x, y - h]], swell(3, lw * 1.3, lw * 1, lw * .6), rp, r);
  for (let i = 0; i < n; i++) { const yy = y - h * (.3 + .6 * i / n), L = h * .32 * (1 - .4 * i / n); out.push(...stroke([[x, yy], [x + L, yy - L * .7]], [lw * .8, lw * .55], rp, r), ...stroke([[x, yy], [x - L, yy - L * .7]], [lw * .8, lw * .55], rp, r)); }
  return out; }

// ---- more of the panels' vocabulary (by eye from the Tanum and Bohuslan photographs; proportions, not traces) ----------
// any figure turned or mirrored: its pits and strokes mapped through f
export const xform = (ms, f) => ms.map(m => m.k === 'pit' ? { ...m, ...((([x, y]) => ({ x, y }))(f([m.x, m.y]))) } : { ...m, p: m.p.map(f) });
// a disc pecked solid (a cart's solid wheel; a cup's big sister): pits filling it, a brush going round it
export function disc(c, R, rp, r) { const out = []; for (let rr = R - rp * .8; rr > 0; rr -= rp * 1.1) { const n = Math.max(1, Math.round(TAU * rr / (rp * 1.05))); for (let k = 0; k < n; k++) { const a = TAU * k / n + r(); out.push({ k: 'pit', x: c[0] + rr * Math.cos(a), y: c[1] + rr * Math.sin(a), r: rp * (1 + .1 * gauss(r)), d: .55 * rp * (.8 + .4 * r()) }); } }
  out.push({ k: 'pit', x: c[0], y: c[1], r: rp, d: .55 * rp }); out.push({ k: 'brush', p: arc(c, R * .5, 0, TAU, 24), w: R * 1.1, load: 1 }); return out; }
// a rayed sun: a ring, a cup at its heart, short rays round it
export function sun(c, R, lw, rp, r, n = 10) { const out = [...stroke(loop(c, R, r), lw * 1.3, rp, r), ...cup(c[0], c[1], R * .28, r)];
  for (let k = 0; k < n; k++) { const a = TAU * (k + .15 * gauss(r)) / n + .2, l = 1.6 + .2 * gauss(r); out.push(...stroke([[c[0] + R * 1.25 * Math.cos(a), c[1] + R * 1.25 * Math.sin(a)], [c[0] + R * l * Math.cos(a), c[1] + R * l * Math.sin(a)]], [lw * 1.1, lw * .7], rp, r)); }
  return out; }
// concentric circles round a cup; a spiral
export const rings = (c, R, lw, rp, r, k = 3) => [...cup(c[0], c[1], R * .2, r), ...Array.from({ length: k }, (_, i) => stroke(loop(c, R * (.45 + .55 * (i + 1) / k), r), lw * (1 + .2 * i), rp, r)).flat()];
export const spiral = (c, R, lw, rp, r, turns = 2.4) => { const p1 = r() * 6.28, e = 1 + .08 * gauss(r); return stroke(pts(t => { const a = t * turns * TAU, rr = R * (.12 + .88 * t ** (.85 + .2 * r() * 0)) * (1 + .09 * Math.sin(2 * a + p1)); return [c[0] + rr * Math.cos(a) * e, c[1] + rr * Math.sin(a) / e]; }, 70), swell(71, lw * .8, lw * 1.3, lw * 1.5), rp, r); };   // (opening unevenly, a little oval)
// a hand: a palm and five fingers, spread
export function hand(x, y, s, a, lw, rp, r) { const c = Math.cos(a), sn = Math.sin(a), T = ([u, v]) => [x + c * u - sn * v, y + sn * u + c * v], out = stroke(loop([0, 0], s * .2, r, 20).map(T), lw * 1.2, rp, r);
  [[-.2, -.1, -.42, -.32], [-.1, -.2, -.16, -.55], [0, -.22, 0, -.6], [.1, -.2, .16, -.55], [.2, -.06, .4, -.22]].forEach(([u0, v0, u1, v1]) => out.push(...stroke([T([u0 * s, v0 * s]), T([u1 * s, v1 * s])], [lw * .75, lw * .55], rp, r)));
  return out; }
// a deer: the horse's long body, a short tail up, branching antlers
export function deer(x, y, s, dir, lw, rp, r) { const X = u => x + dir * u * s;
  return [...stroke(pts(t => [X(-.45 + .9 * t), y - .04 * s * Math.sin(Math.PI * t)], 12), swell(13, lw * 2, lw * 1.7, lw * 2.2), rp, r),
    ...stroke([[X(.42), y - .02 * s], [X(.55), y - .3 * s], [X(.68), y - .3 * s]], [lw * 1.8, lw * 1.2, lw * .9], rp, r),
    ...stroke([[X(.54), y - .32 * s], [X(.46), y - .62 * s], [X(.32), y - .74 * s]], [lw * .6, lw * .5, lw * .4], rp, r), ...stroke([[X(.5), y - .5 * s], [X(.62), y - .66 * s]], [lw * .5, lw * .4], rp, r), ...stroke([[X(.47), y - .62 * s], [X(.5), y - .82 * s]], [lw * .45, lw * .35], rp, r),
    ...[[.38, .03], [.28, -.02], [-.36, .03], [-.44, -.03]].flatMap(([u, k]) => stroke([[X(u), y + .02 * s], [X(u + k), y + (.4 + .04 * gauss(r)) * s]], [lw * 1.2, lw * .55], rp, r)),
    ...stroke([[X(-.45), y - .02 * s], [X(-.55), y - .14 * s]], [lw * .7, lw * .45], rp, r)]; }
// a bird (a crane): a body, a long neck up and forward, a small head, long legs
export function bird(x, y, s, dir, lw, rp, r) { const X = u => x + dir * u * s;
  return [...stroke(pts(t => [X(-.3 + .55 * t), y - .08 * s * Math.sin(Math.PI * t)], 10), swell(11, lw * 1.3, lw * 2.4, lw * 1.1), rp, r),
    ...stroke(pts(t => [X(.25 + .12 * t + .05 * Math.sin(t * 3)), y - .05 * s - .55 * s * t], 10), swell(11, lw * .9, lw * .6, lw * .6), rp, r), ...stroke([[X(.4), y - .6 * s], [X(.56), y - .54 * s]], [lw * .8, lw * .4], rp, r),
    ...stroke([[X(0), y + .02 * s], [X(-.04), y + .45 * s]], [lw * .6, lw * .45], rp, r), ...stroke([[X(.08), y + .02 * s], [X(.1), y + .45 * s]], [lw * .6, lw * .45], rp, r)]; }
// a rider: a man astride a horse, arms out
export function rider(x, y, s, dir, lw, rp, r) { const X = u => x + dir * u * s;
  return [...horse(x, y, s, dir, lw, rp, r), ...stroke([[X(.05), y - .05 * s], [X(.05), y - .45 * s]], [lw * 1.2, lw * 1], rp, r), ...stroke(loop([X(.05), y - .52 * s], s * .065, r, 16), lw * 1, rp, r),
    ...stroke([[X(-.12), y - .3 * s], [X(.05), y - .36 * s], [X(.26), y - .3 * s]], lw * .75, rp, r), ...stroke([[X(.05), y - .05 * s], [X(.14), y + .12 * s]], [lw * .9, lw * .7], rp, r)]; }
// a lur-blower: a man, legs apart, a long curved horn rising from his mouth and curling forward
export function lur(x, y, s, dir, lw, rp, r) { const X = u => x + dir * u * s;
  return [...stroke([[X(0), y - s * .55], [X(0), y]], [lw * 1.1, lw * 1.3], rp, r), ...stroke(loop([X(0), y - s * .64], s * .075, r, 16), lw * 1.1, rp, r),
    ...stroke([[X(0), y], [X(-.12), y + s * .22], [X(-.1), y + s * .44]], [lw * 1.2, lw * 1.6, lw * .9], rp, r), ...stroke([[X(0), y], [X(.13), y + s * .22], [X(.16), y + s * .44]], [lw * 1.2, lw * 1.6, lw * .9], rp, r),
    ...stroke([[X(0), y - s * .4], [X(.12), y - s * .52]], lw * .8, rp, r),
    ...stroke(pts(t => [X(.06 + .46 * t), y - s * .6 - s * .3 * Math.sin(t * 2.6) + s * .08 * t], 24), swell(25, lw * .55, lw * .7, lw * .9), rp, r), ...stroke(loop([X(.54), y - s * .66], s * .07, r, 16), lw * .9, rp, r)]; }   // the lur: an S-curved bronze horn, its bell a small disc
// the Tanum chariot, seen from above as the carvers drew it: the pole forward, the axle across with a four-spoked wheel
// at each end laid flat, the two horses in profile on either side of the pole, their backs to it (Bronze Age, Scandinavia)
export function chariot(x, y, L, lw, rp, r) { const R = L * .17, a = L * .3, out = [...stroke([[x, y], [x + L, y]], [lw * 1.1, lw * .8], rp, r), ...stroke([[x, y - a], [x, y + a]], lw, rp, r), ...wheel([x, y - a - R * .2], R, lw * .8, rp, r), ...wheel([x, y + a + R * .2], R, lw * .8, rp, r)];
  const hs = L * .46; out.push(...horse(x + L * .76, y + hs * .2 + lw, hs, 1, lw, rp, r), ...xform(horse(x + L * .76, y + hs * .2 + lw, hs, 1, lw, rp, r), ([px, py]) => [px, 2 * y - py]));
  return out; }
// the ox cart, the older layer (the Yamnaya wagons, PIE-era): a box body, two solid wheels, a pole, two oxen yoked
export function cart(x, y, L, lw, rp, r) { const R = L * .075, bx = x, bw = L * .28, bh = L * .1, out = [...stroke([[bx, y - bh], [bx + bw, y - bh], [bx + bw, y], [bx, y], [bx, y - bh]], lw, rp, r), ...disc([bx + bw * .22, y + R * .7], R, rp, r), ...disc([bx + bw * .78, y + R * .7], R, rp, r), ...stroke([[bx + bw, y - bh * .5], [x + L * .52, y - bh * .5]], [lw, lw * .8], rp, r)];
  for (const k of [0, 1]) { const s = L * .22, ox = x + L * (.62 + k * .26), X = u => ox + u * s, yy = y - bh * .3 - k * bh * .25;   // two oxen, heavy bodies, horns up, heads low to the yoke
    out.push(...stroke(pts(t => [X(-.42 + .8 * t), yy - .04 * s * Math.sin(Math.PI * t)], 10), swell(11, lw * 1.8, lw * 1.5, lw * 1.9), rp, r), ...stroke([[X(.38), yy], [X(.5), yy + .12 * s]], [lw * 1.4, lw], rp, r),
      ...stroke([[X(.44), yy - .03 * s], [X(.5), yy - .22 * s], [X(.6), yy - .3 * s]], [lw * .65, lw * .5, lw * .38], rp, r), ...stroke([[X(.44), yy - .03 * s], [X(.36), yy - .22 * s], [X(.26), yy - .28 * s]], [lw * .65, lw * .5, lw * .38], rp, r),
      ...[-.34, -.24, .22, .32].flatMap(u => stroke([[X(u), yy + .03 * s], [X(u), yy + .36 * s]], [lw * .9, lw * .7], rp, r))); }
  return out; }
const piece = (W, H, lw, f, o = {}) => ({ W, H, u: lw / 4.5, g: Math.max(1.1, lw * .12), stri: lw * 1.1, dur: o.dur ?? 2200, slab: null, ground: 'none', seed: o.seed ?? 1, marks: F => ordered(f(F)) });
const pick = (seed, k, n) => { const r = rng(seed * 7919 + k * 104729); r(); return Math.floor(r() * n); };

// ---- the drop: the carved capital (kit/styles/pie-letters.js) and a figure composed with it, chosen by the letter and
// the seed: a ship under it whose crew reach up into the letter; a deer, horse or crane walking along its foot; the sun
// (wheel or rayed) at its shoulder over a row of cups; a rider or a spiral beside it. O and Q are themselves sun-wheels.
export function initial(ch, H, seed, fs = 20) {
  const r = rng(seed * 13 + ch.charCodeAt(0)), W = Math.round(H * 1.12), lw = H * .045, rp = lw / 4.5, m = H * .05;
  const lay = pick(seed, ch.charCodeAt(0), 4), lw0 = letterWidth(ch), cap = Math.min(H * (lay === 0 ? .64 : lay === 2 ? .74 : .8), (W * .58) / lw0), x0 = m, y0 = m * 1.1;
  const L = letterStrokes(ch, x0, y0, cap, r);
  const carveLetter = out => { for (const s of L.strokes) { out.push(...stroke(s.p, s.w, rp, r, { hand: 0 })); if (s.cupA) out.push(...cup(s.p[0][0], s.p[0][1], s.w[0] * .62, r)); if (s.cupB) out.push(...cup(s.p.at(-1)[0], s.p.at(-1)[1], s.w.at(-1) * .62, r)); }
    if (L.wheel) { const [cx, cy, R] = L.wheel; out.push(...stroke([[cx - R, cy], [cx + R, cy]], [lw * .8, lw * .8], rp, r), ...stroke([[cx, cy - R], [cx, cy + R]], [lw * .8, lw * .8], rp, r)); } };
  const fx = x0 + L.W + m * .6, fw = W - fx - m * .4, band = H - (y0 + cap) - m;
  // a figure never meets the letter by accident: its pits are kept a groove's width clear of every letter stroke, or it is
  // made smaller and tried again (the ship's reaching crew are the one deliberate meeting)
  const clear = ms => ms.every(q => q.k !== 'pit' || L.strokes.every(st => st.p.every((pt, i) => Math.hypot(pt[0] - q.x, pt[1] - q.y) > st.w[i] / 2 + q.r + lw * 1.2)));
  const fit = make => { for (let k = 1; k > .55; k *= .86) { const ms = make(k); if (clear(ms)) return ms; } return []; };
  return piece(W, H, lw, F => { const out = []; carveLetter(out);
    if (lay === 0) { const sy = H - m * 1.1, sh = Math.min(band * 1.15, H * .26), low = x => { let best = null; for (const s of L.strokes) for (let i = 0; i < s.p.length; i++) if (Math.abs(s.p[i][0] - x) < s.w[i] * .4) best = Math.max(best ?? -1e9, s.p[i][1] + s.w[i] * .3); return best; };
      out.push(...ship(m + H * .04, sy, W - 2 * m - H * .16, sh, lw, rp, r, { crew: 1, reach: low, high: 1 + .5 * (seed % 2) })); }
    else if (lay === 1) { const kind = pick(seed, ch.charCodeAt(0) + 7, 3);   // an animal walking away from the letter, as large as the room allows
      out.push(...fit(k => { const s = Math.min(fw / 1.3, H * .42) * k, y = H - m - s * .45, x = W - m * .4 - s * .82;
        return kind === 0 ? deer(x, y, s, 1, lw, rp, r) : kind === 1 ? horse(x, y, s, 1, lw, rp, r) : bird(x, y - s * .1, s * 1.1, 1, lw, rp, r); }));
      out.push(...cup(m + H * .06, H - m * 1.5, lw * .9, r), ...cup(m + H * .17, H - m * 1.2, lw * .7, r, .8)); }
    else if (lay === 2) { out.push(...fit(k => { const R = Math.min(fw * .36, H * .16) * k, c = [W - m * .5 - R * 1.75, m + R * 1.85]; return seed % 2 ? sun(c, R, lw, rp, r) : wheel(c, R * 1.25, lw, rp, r); }));
      const n = 5; for (let k = 0; k < n; k++) out.push(...cup(m + H * .1 + (W - 2 * m - H * .2) * (k + .25 * gauss(r)) / (n - 1), H - m * 1.5 + lw * .4 * gauss(r), lw * (.6 + .3 * r()), r, .7 + .4 * r())); }
    else { out.push(...fit(k => { const R = Math.min(fw * .36, H * .13) * k, c = [W - m * .5 - R * 1.2, m + R * 1.5]; return seed % 2 ? spiral(c, R, lw * .8, rp, r) : rings(c, R, lw * .8, rp, r); }));
      out.push(...fit(k => { const s = Math.min(fw / 1.1, H * .42) * k; return rider(W - m * .4 - s * .72, H - m - s * .45, s, -1, lw, rp, r); })); }
    return out; }, { seed, dur: 3400 });
}
export const DROP_GROUND = { v: 'none' };
export function lineInitial(ch, fs, seed) { const r = rng(seed * 3 + ch.charCodeAt(0)), H = Math.round(fs * 1.9), cap = H * .86, lw = fs * .3, rp = lw / 4.5, L = letterStrokes(ch, lw * .4, H * .07, cap, r), W = Math.ceil(L.W + lw);
  return piece(W, H, lw, () => { const out = []; for (const s of L.strokes) { out.push(...stroke(s.p, s.w, rp, r, { hand: 0 })); if (s.cupA) out.push(...cup(s.p[0][0], s.p[0][1], s.w[0] * .6, r)); if (s.cupB) out.push(...cup(s.p.at(-1)[0], s.p.at(-1)[1], s.w.at(-1) * .6, r)); }
    if (L.wheel) { const [cx, cy, R] = L.wheel; out.push(...stroke([[cx - R, cy], [cx + R, cy]], lw * .5, rp, r), ...stroke([[cx, cy - R], [cx, cy + R]], lw * .5, rp, r)); } return out; }, { seed, dur: 1600 }); }
// the paraph: a cup mark, or a little cup with a ring round it, or a footsole (by seed)
export function paraph(fs, seed) { const r = rng(seed), R = fs * .27, lw = fs * .22, rp = lw / 4.5, k = pick(seed, 3, 3);
  return piece(fs * .9, fs * .9, lw, () => k === 0 ? cup(fs * .45, fs * .45, R, r) : k === 1 ? rings([fs * .45, fs * .45], R * 1.3, lw * .5, rp, r, 1) : foot(fs * .45, fs * .45, fs * .8, .2, lw * .8, rp, r), { seed, dur: 700 }); }
// the filler: a ship as long as the gap (plain, high-prowed or double-hulled), or a serpent, or a rider and a deer
export function filler(w, lh, seed) { const r = rng(seed * 11 + Math.round(w)), h = lh * .62, lw = lh * .1, rp = lw / 4.5, H = Math.round(lh * 1.05), k = pick(seed, Math.round(w), 4);
  return piece(w, H, lw, () => k === 1 ? serpent(h * .2, H * .6, w - h * .4, H * .14, 1, lw * 1.2, rp, r) : k === 2 && w > lh * 5 ? [...rider(lh * .8, H * .55, lh * .9, 1, lw * .8, rp, r), ...deer(w - lh * .8, H * .55, lh * .9, -1, lw * .8, rp, r)]
    : ship(h * .45, H * .8, w - h * 1.1, h, lw, rp, r, { crew: w > 5 * h, high: k === 3 ? 1.6 : 1, double: k === 0 && w > 4 * h }), { seed, dur: 1800 }); }
// breaks. rank 1: cups (a row, a row joined by a channel, two footsoles); rank 2: a sign between a pair (the sun-wheel
// between footsoles, the rayed sun between cups, a spiral between hands, rings between cranes); rank 3: a panel
export function brk(rank, w, h, seed, variant = null) { const r = rng(seed * 17 + rank);
  if (rank === 1) { const W = h * 2, H = h * .6, lw = h * .12, rp = lw / 4.5, k = variant ?? pick(seed, 1, 3);
    return piece(W, H, lw, () => k === 0 ? [.16, .38, .62, .84].flatMap((u, i) => cup(W * u, H / 2 + (i % 2 ? -1 : 1) * H * .06, H * (i % 3 ? .17 : .22), r))
      : k === 1 ? [...[.15, .5, .85].flatMap(u => cup(W * u, H / 2, H * .18, r)), ...stroke([[W * .2, H / 2], [W * .45, H / 2]], lw * .4, rp, r), ...stroke([[W * .55, H / 2], [W * .8, H / 2]], lw * .4, rp, r)]
      : [...foot(W * .38, H * .5, H * .9, -.15, lw * .6, rp, r), ...foot(W * .62, H * .5, H * .9, .15, lw * .6, rp, r)], { seed, dur: 1100 }); }
  if (rank === 2) { const W = h * 2.9, H = h * .95, lw = H * .075, rp = lw / 4.5, k = variant ?? pick(seed, 2, 4), c = [W / 2, H * .5];
    const mid = k === 0 ? wheel(c, H * .32, lw * 1.05, rp, r) : k === 1 ? sun(c, H * .24, lw * .9, rp, r) : k === 2 ? spiral(c, H * .34, lw * .9, rp, r) : rings(c, H * .36, lw * .8, rp, r);
    const side = k === 0 ? [foot(W * .14, H * .5, H * .62, -.12, lw, rp, r), foot(W * .86, H * .5, H * .62, .12, lw, rp, r)] : k === 1 ? [cup(W * .18, H * .5, H * .08, r), cup(W * .82, H * .5, H * .08, r)]
      : k === 2 ? [hand(W * .14, H * .62, H * .7, -.2, lw * .8, rp, r), hand(W * .86, H * .62, H * .7, .2, lw * .8, rp, r)] : [bird(W * .14, H * .62, H * .6, 1, lw * .8, rp, r), bird(W * .86, H * .62, H * .6, -1, lw * .8, rp, r)];
    return piece(W, H, lw, () => [...side[0], ...mid, ...side[1]], { seed, dur: 2000 }); }
  const v = variant ?? pick(seed, 3, 7), W = Math.min(w, h * 4.4), H = h, lw = H * .042, rp = lw / 4.5, P = { seed, dur: 4200 };
  if (v === 1) return piece(W, H, lw, () => [...ship(W * .2, H * .78, W * .55, H * .26, lw, rp, r), ...stroke(arc([W * .47, H * .48], H * .2, Math.PI * 1.02, Math.PI * 1.98, 30), lw, rp, r),
    ...[0, 1, 2, 3, 4].flatMap(k => { const a = Math.PI * (1.12 + .19 * k); return stroke([[W * .47 + H * .25 * Math.cos(a), H * .48 + H * .25 * Math.sin(a)], [W * .47 + H * .36 * Math.cos(a), H * .48 + H * .36 * Math.sin(a)]], [lw * .8, lw * .5], rp, r); }),
    ...cup(W * .1, H * .3, H * .045, r), ...cup(W * .88, H * .34, H * .045, r)], P);
  if (v === 2) return piece(W, H, lw, () => [...man(W * .3, H * .6, H * .6, lw * 1.1, rp, r, 'axe'), ...serpent(W * .45, H * .8, W * .48, H * .07, 1, lw * 1.1, rp, r), ...cup(W * .9, H * .25, H * .05, r)], P);
  if (v === 3) return piece(W, H, lw, () => [...wheel([W / 2, H * .17], H * .12, lw, rp, r), ...man(W / 2, H * .7, H * .48, lw * 1.1, rp, r, 'up'), ...horse(W * .2, H * .6, H * .42, 1, lw, rp, r), ...horse(W * .8, H * .6, H * .42, -1, lw, rp, r)], P);
  if (v === 4) return piece(W, H, lw, () => [...chariot(W * .12, H * .5, H * .95, lw, rp, r), ...rider(W * .72, H * .55, H * .38, -1, lw, rp, r), ...cup(W * .92, H * .2, H * .04, r)], P);
  if (v === 5) return piece(W, H, lw, () => [...cart(W * .1, H * .6, W * .7, lw, rp, r), ...sun([W * .86, H * .3], H * .1, lw * .8, rp, r)], P);
  if (v === 6) return piece(W, H, lw, () => [...lur(W * .3, H * .58, H * .55, 1, lw * 1.05, rp, r), ...lur(W * .7, H * .58, H * .55, -1, lw * 1.05, rp, r), ...sun([W / 2, H * .22], H * .09, lw * .8, rp, r)], P);
  return piece(W, H, lw, () => [...ship(W * .06, H * .86, W * .4, H * .22, lw, rp, r, { double: true }), ...ship(W * .52, H * .62, W * .4, H * .22, lw, rp, r, { high: 1.6 }),
    ...wheel([W * .72, H * .2], H * .13, lw, rp, r), ...stroke([[W * .72, H * .33], [W * .72, H * .44]], lw * .8, rp, r), ...horse(W * .25, H * .42, H * .34, 1, lw, rp, r), ...cup(W * .45, H * .18, H * .04, r), ...cup(W * .9, H * .9, H * .05, r)], P);
}
export const BRK3 = ['a fleet under the sun', 'dawn (*h₂éwsōs): a rayed sun rising from a ship; a liberty', 'the serpent-slayer: an axe-bearer facing a serpent; a liberty', 'the sky-father (*dyēus ph₂tēr): an adorant under the wheel, the Twins as horses; a liberty', 'a Tanum chariot and a rider (Bronze Age Scandinavia)', 'an ox cart with solid wheels (the PIE-era layer: the Yamnaya wagons)', 'two lur-blowers under the sun'];
// the heading's run-out: a row of cup marks as they sit on the panels: spacing, size and depth uneven, running out smaller
export function runout(w, h, seed) { const r = rng(seed * 19), H = Math.round(h * .62), lw = H * .3, out = []; let x = H * .5;
  while (x < w - H * .4) { const f = x / w, R = H * .3 * (1 - .5 * f) * (.8 + .4 * r()); out.push(...cup(x, H / 2 + H * .07 * gauss(r), R, r, .75 + .35 * r())); x += H * (.9 + .9 * r()) * (1 - .25 * f); }
  return piece(w, H, lw, () => out, { seed, dur: 1400 }); }
export function frame(kind, w, h, seed, fs = 20) { const r = rng(seed * 23 + kind.length), lw = fs * .22, rp = lw / 4.5, k = pick(seed, kind.length, 2);
  const rule = (x0, x1, y, wd) => { const ph = r() * 6.28; return stroke(pts(t => [x0 + (x1 - x0) * t, y + wd * .25 * Math.sin(ph + t * 7)], 40), Array.from({ length: 41 }, (_, i) => wd * (.7 + .3 * Math.sin(ph * 2 + i / 40 * 9) + .25 * Math.sin(Math.PI * i / 40))), rp, r); };
  if (kind === 'quote') { const W = fs * 1.6; return piece(W, h, lw, () => k ? xform(serpent(0, W * .5, h - fs * .4, W * .22, 1, lw * 1.1, rp, r), ([x, y]) => [y, x + fs * .2]) : tree(W * .5, h - fs * .2, h - fs * .4, lw, rp, r, Math.max(2, Math.floor(h / (fs * 1.2)))), { seed, dur: 1800 }); }
  if (kind === 'pull') { const s = fs * 2.3; return piece(w, s * 1.3, lw, () => k ? [...lur(w / 2 - s * 1.1, s * .78, s * .9, 1, lw, rp, r), ...lur(w / 2 + s * 1.1, s * .78, s * .9, -1, lw, rp, r)] : [...horse(w / 2 - s * 1.1, s * .42, s, 1, lw * 1.1, rp, r), ...horse(w / 2 + s * 1.1, s * .42, s, -1, lw * 1.1, rp, r), ...wheel([w / 2, s * .32], s * .22, lw, rp, r)], { seed, dur: 2600 }); }
  if (kind === 'aside') return piece(w, h, lw, () => [[1, 1], [w - 1, 1], [1, h - 1], [w - 1, h - 1]].flatMap(([x, y]) => { const c = [x + Math.sign(w / 2 - x) * fs * .45, y + Math.sign(h / 2 - y) * fs * .45]; return k ? spiral(c, fs * .32, lw * .5, rp, r) : cup(c[0], c[1], fs * .17, r); }), { seed, dur: 1000 });
  if (kind === 'figure') return piece(w, h, lw, () => [...rule(fs * .3, w - fs * .3, fs * .3, lw * .85), ...rule(fs * .3, w - fs * .3, h - fs * .3, lw * .85)], { seed, dur: 1600 });
  if (kind === 'code') return piece(w, h, lw, () => [...rule(lw, w - lw, lw, lw * .5), ...rule(lw, w - lw, lw * 2.4, lw * .5)], { seed, dur: 1400 });
  const W = fs * 1.2; return piece(W, h, lw, () => { const n = Math.max(2, Math.floor(h / (fs * 1.6))), gap = (h - fs * 1.2) / Math.max(1, n - 1), out = [];
    for (let i = 0; i < n; i++) { const y = fs * .6 + i * gap; out.push(...cup(W / 2, y, fs * .2, r)); if (i) out.push(...stroke([[W / 2, y - gap + fs * .25], [W / 2, y - fs * .25]], lw * .7, rp, r)); } return out; }, { seed, dur: 1600 });
}
// the vocabulary as a sheet: each figure in its own cell, named
export const SHEET = [
  ['ship', (c, s, lw, rp, r) => ship(c[0] - s * .55, c[1] + s * .2, s * 1.1, s * .4, lw, rp, r)], ['ship, high prow and stern', (c, s, lw, rp, r) => ship(c[0] - s * .55, c[1] + s * .2, s * 1.1, s * .4, lw, rp, r, { high: 1.7 })],
  ['ship, double hull', (c, s, lw, rp, r) => ship(c[0] - s * .55, c[1] + s * .1, s * 1.1, s * .4, lw, rp, r, { double: true })], ['sun-ship', (c, s, lw, rp, r) => [...ship(c[0] - s * .55, c[1] + s * .3, s * 1.1, s * .35, lw, rp, r, { crew: 0 }), ...stroke([[c[0], c[1] + s * .18], [c[0], c[1] - s * .1]], lw * .8, rp, r), ...wheel([c[0], c[1] - s * .3], s * .2, lw * .8, rp, r)]],
  ['horse', (c, s, lw, rp, r) => horse(c[0], c[1], s * .9, 1, lw, rp, r)], ['rider', (c, s, lw, rp, r) => rider(c[0], c[1] + s * .1, s * .9, 1, lw, rp, r)],
  ['chariot (Tanum)', (c, s, lw, rp, r) => chariot(c[0] - s * .45, c[1], s * .9, lw, rp, r)], ['ox cart (PIE-era)', (c, s, lw, rp, r) => cart(c[0] - s * .6, c[1], s * 1.2, lw * .8, rp, r)],
  ['sun-wheel', (c, s, lw, rp, r) => wheel(c, s * .35, lw, rp, r)], ['rayed sun', (c, s, lw, rp, r) => sun(c, s * .22, lw, rp, r)],
  ['cup marks', (c, s, lw, rp, r) => [-.4, -.13, .13, .4].flatMap((u, i) => cup(c[0] + u * s, c[1] + (i % 2 ? -.06 : .06) * s, s * (i % 3 ? .07 : .09), r))], ['footsoles', (c, s, lw, rp, r) => [...foot(c[0] - s * .15, c[1], s * .5, -.15, lw, rp, r), ...foot(c[0] + s * .15, c[1], s * .5, .15, lw, rp, r)]],
  ['hands', (c, s, lw, rp, r) => [...hand(c[0] - s * .2, c[1] + s * .1, s * .55, -.2, lw, rp, r), ...hand(c[0] + s * .2, c[1] + s * .1, s * .55, .2, lw, rp, r)]], ['spiral', (c, s, lw, rp, r) => spiral(c, s * .36, lw, rp, r)],
  ['concentric rings', (c, s, lw, rp, r) => rings(c, s * .38, lw, rp, r)], ['axe-bearer', (c, s, lw, rp, r) => man(c[0], c[1] + s * .05, s * .75, lw, rp, r, 'axe')],
  ['lur-blower', (c, s, lw, rp, r) => lur(c[0] - s * .15, c[1] + s * .1, s * .7, 1, lw, rp, r)], ['adorant', (c, s, lw, rp, r) => man(c[0], c[1] + s * .12, s * .7, lw, rp, r, 'up')],
  ['serpent', (c, s, lw, rp, r) => serpent(c[0] - s * .5, c[1], s, s * .12, 1, lw, rp, r)], ['world-tree', (c, s, lw, rp, r) => tree(c[0], c[1] + s * .4, s * .8, lw, rp, r)],
  ['deer', (c, s, lw, rp, r) => deer(c[0], c[1] + s * .1, s * .8, 1, lw, rp, r)], ['crane', (c, s, lw, rp, r) => bird(c[0], c[1] + s * .1, s * .8, 1, lw, rp, r)],
];
export function sheetPiece(k, size, seed) { const r = rng(seed * 31 + k), lw = size * .04, rp = lw / 4.5; return piece(size * 1.4, size, lw, () => SHEET[k][1]([size * .7, size * .5], size, lw, rp, r), { seed, dur: 2000 }); }
