// The plotter: a pen on a carriage (research/25-plotter.md §2). Not a hand: the path is exact, its corners are sharp,
// its line is one width. What varies is what the machine and the pen do to the ink, and each has its cause:
//   - the speed profile: the carriage accelerates at a fixed rate to its top speed and slows into every stop and every
//     sharp corner (junction speed by the turn's angle), and a fibre tip lays ink per unit of time, so the line runs a
//     little finer and lighter where the carriage is quick and heavier where it is slow; a stroke shorter than twice the
//     ramp never reaches full speed (a short hatch row is heavier than a long one);
//   - dwell beads: at pen-down the tip touches before the carriage moves, at pen-up it stays down while the lift
//     happens; the ink that flows meanwhile spreads into a dot a little wider than the line;
//   - overdraw: crossing a stroke whose ink has settled lays ink on ink, darker; crossing one still wet merges with it;
//   - registration: the same pen returns within 0.1 mm (one rigid offset per stroke), another pen within 0.2 mm (one per
//     pen layer, at the pen change);
//   - wear: a felt or fibre tip broadens and runs drier with the distance it has drawn (a ledger kept across a page);
//   - gel on dark stock: plotted twice, the second pass reversed; the first is thin and skips the paper's low points;
//   - the stepper (the 1960s drum plotters): the path is a staircase of 0.1 mm steps, and a diagonal step moves both
//     motors at once, so a diagonal runs faster (lighter) than an axis line. Drawn only where a device pixel is finer than
//     a step, the only place it can be seen.
// The ink is laid through the ink engine (kit/medium.js) by its public sweep: one quad per step of the tip, a disc where
// the tip rests. The engine's Pen (a damped spring in a hand) is not used.
//
// HP 7475A figures from its service manual 07475-90000 (Aug 1987), Table 1-1 (read): pen-down to 38.1 cm/s, pen-up
// 50.8 cm/s, acceleration about 2 g, step 0.025 mm, repeatability 0.1 mm same pen / 0.2 mm another pen; fibre tips
// 0.3 and 0.7 mm (parts list). Calcomp 565: 0.1 mm a step, 250 steps/s (UvA Computer Museum). Everything else here
// (the dwell times, the ink's response to speed, bead size, wear) is set by eye and marked [inferred].
//
//   print(piece, theme, { dpr, zoom, ledger }) -> canvas      piece: { W, H, ox?, oy?, machine, layers: [{ pen, paths, order }] }
//   writer(piece, theme, { dpr, zoom, ledger, max, slot }) -> { cv, dur, at(f), done() }   (the plot drawn as it is made;
//     slot: its own sheet, for plots watched at the same time)
//   plan(piece, theme, d, ledger) -> the program (layers of strokes of sweeps, timed)
import { createMedium } from '../medium.js';
import { supported } from '../writer.js';

export const MM = 96 / 25.4;   // CSS px per mm: the ornament is drawn at the size a plotter would draw it

// the machines (mm, s). dev: junction deviation (how sharply it may turn without stopping) [inferred for the HP: its
// planner is not documented; a vector plotter of its class slows into each sharp corner]
export const MACHINES = {
  hp7475a: { name: 'HP 7475A', vmax: 381, acc: 19600, vup: 508, down: .03, up: .035, dev: .02, step: 0, rep: .1, reg: .2, beadW: .9, beadV: 2.2, beadL: 1.3 },
  axidraw: { name: 'AxiDraw', vmax: 160, acc: 4000, vup: 300, down: .14, up: .11, dev: .03, step: 0, rep: .1, reg: .2, beadW: 1.3, beadV: 3.5, beadL: 1.15 },
  // a hobby plotter with a slow servo (fitted to the dot in fo.ol's plot: a pen-down dwell of a quarter second)
  hobby: { name: 'a hobby servo plotter', vmax: 150, acc: 1500, vup: 100, down: .25, up: .2, dev: .03, step: 0, rep: .15, reg: .3, beadW: 1.3, beadV: 6, beadL: 1.17 },
  calcomp: { name: 'Calcomp 565', vmax: 25, acc: 0, vup: 25, down: .06, up: .06, dev: 0, step: .1, rep: .1, reg: .2, beadW: .8, beadV: 2.2, beadL: 1.4 },
};
// the tips. load = v0 / (v + v0): 1 at rest, small when quick. ink = k0 + k1 * load (the engine's volume: ~.55 covers);
// width = w * (1 + spread * load); wear: width gained (and flow lost) per metre; wet: the engine's wetness (how far wet
// ink levels and creeps); base: the darkness of the thinnest full coat (the engine's floor: lower lets speed and
// overdraw show as tone).
// The line's cross-section, measured on the masters (research/25-plotter.md, Stage 2; tests/plotter-refs/):
//   rim: the outer part of each half where the tip drags the ink to its edge, darker; core: the middle, where the paper
//   drinks it, at coreK of the rim's ink (Digital Effects 1977, a Calcomp scan: core density .77 of the rim's, the rims
//   a quarter of the width each); fringe: a thin ink beyond the nominal edge, broken by the paper's tooth (the same scan:
//   half of the paper between rows shows through it). Gel lies flat and opaque with a soft edge (Levin's AxiDraw class,
//   white on black: core flat to the edge's last tenth). Drawn only where a line is 5 device px or wider: below that the
//   zones are inside one pixel and the engine's antialiasing is the edge.
//   striae: the tip's fibres, a fixed share per band across it, within this (the masters' rows are streaked along their
//   length); tooth: a little dryness everywhere, so the paper's high points take the ink and its low points show
//   through in flecks (the same scan: flecks across the rows as well as at their edges)
//   dry: how fast a felt tip runs drier along one pen-down (per mm; restored at rest)  [inferred]
// The bead is the machine's (MACHINES beadW, beadV, beadL: its width, its ink and its length along the stroke against the
// line's), scaled by the tip's pool
// (gel hardly spreads). Measured: a Calcomp's row ends (Rosebush 1978), a darker spot .78 of the line's width at 1.5x
// its density; a hobby servo's pen-down (fo.ol), a dot 2.6x the width at 2.2x. The HP (a solenoid, like the Calcomp) and
// the AxiDraw (a servo, quicker than a hobby's) are set between them [inferred]. beadV is the engine's volume, set on the
// bench (tests/plotter-medium.html, the masters) so the printed density ratio comes out as measured. v0, spread and the
// wear are still [inferred, by eye].
export const TIPS = {
  fibre: { pool: 1, v0: 70, k0: .42, k1: .62, spread: .06, base: .22, wear: .03, wet: .28, rim: .3, coreK: .93, fringe: .2, fringeK: 1, dry: .0015, tooth: .3, striae: .12 },
  tech: { pool: .8, v0: 12, k0: .5, k1: .3, spread: .06, base: .3, wear: 0, wet: .42, rim: .2, coreK: .9, fringe: .12, fringeK: .9, dry: 0, tooth: .04, striae: .04 },   // a technical pen: steady flow
  micron: { pool: .9, v0: 45, k0: .45, k1: .45, spread: .08, base: .25, wear: .015, wet: .2, rim: .22, coreK: .94, fringe: .14, fringeK: 1, dry: .001, tooth: .2, striae: .08 },
  gel: { pool: .15, v0: 90, k0: 1.2, k1: .4, spread: .08, base: .6, wear: 0, wet: .1, rim: 0, coreK: 1, fringe: .1, fringeK: .6, dry: 0, passes: 2, skip: .3 },
  liquid: { pool: 1, v0: 10, k0: .42, k1: .3, spread: .05, base: .25, wear: 0, wet: .45, rim: .3, coreK: .93, fringe: .18, fringeK: 1, dry: 0, tooth: .55, striae: .15 },   // a Calcomp liquid-ink pen (the bench's masters)
};

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
// a seeded stream (mulberry32): a stroke's registration and nothing else is drawn from it
export const rng = s => { let a = (s >>> 0) || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

// ---- order ---------------------------------------------------------------------------------------------------------------
// within a pen, the plotter goes to the nearest unfinished stroke (either end), as path optimisers do (vpype linesort)
export function nearest(paths, from = [0, 0]) {
  const left = paths.filter(p => p.length > 1), out = []; let at = from;
  while (left.length) { let bi = 0, br = false, bd = Infinity;
    for (let i = 0; i < left.length; i++) { const p = left[i], d0 = (p[0][0] - at[0]) ** 2 + (p[0][1] - at[1]) ** 2, d1 = (p.at(-1)[0] - at[0]) ** 2 + (p.at(-1)[1] - at[1]) ** 2;
      if (d0 < bd) { bd = d0; bi = i; br = false; } if (!p.fixed && d1 < bd) { bd = d1; bi = i; br = true; } }
    const p = left.splice(bi, 1)[0], q = br ? [...p].reverse() : p; out.push(q); at = q.at(-1); }
  return out;
}

// ---- the stepper ---------------------------------------------------------------------------------------------------------
// a path as the drum plotter draws it: grid point to grid point in its eight directions (Bresenham), runs merged
function stairs(P, g) {
  const out = []; let px = Math.round(P[0][0] / g), py = Math.round(P[0][1] / g); out.push([px * g, py * g, 1]);
  for (let i = 1; i < P.length; i++) { const tx = Math.round(P[i][0] / g), ty = Math.round(P[i][1] / g);
    const dx = Math.abs(tx - px), dy = Math.abs(ty - py), sx = Math.sign(tx - px), sy = Math.sign(ty - py); let e = dx - dy;
    while (px !== tx || py !== ty) { const e2 = 2 * e; let mx = 0, my = 0; if (e2 > -dy) { e -= dy; px += sx; mx = 1; } if (e2 < dx) { e += dx; py += sy; my = 1; }
      const diag = mx && my, last = out.at(-1), prev = out.at(-2);
      if (prev && last[2] === (diag ? 1.4142 : 1) && Math.sign(last[0] - prev[0]) === Math.sign(px * g - last[0]) && Math.sign(last[1] - prev[1]) === Math.sign(py * g - last[1]) && (last[0] - prev[0]) * (py * g - last[1]) === (last[1] - prev[1]) * (px * g - last[0])) { last[0] = px * g; last[1] = py * g; }
      else out.push([px * g, py * g, diag ? 1.4142 : 1]); } }
  return out;
}

// ---- motion --------------------------------------------------------------------------------------------------------------
// the velocity at each vertex (mm/s): 0 at the ends, the junction speed at each corner, then limited by what the carriage
// can reach accelerating forward and braking backward. P in mm, each point [x, y, vk] (vk: a per-segment speed factor).
function profile(P, M) {
  const n = P.length, L = [], V = new Float64Array(n), cap = i => M.vmax * (P[i + 1]?.[2] ?? 1);
  for (let i = 0; i < n - 1; i++) L.push(Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]));
  if (!M.acc) { V.fill(M.vmax); return { L, V, cap }; }   // (a stepper at constant rate)
  for (let i = 1; i < n - 1; i++) { const ax = (P[i][0] - P[i - 1][0]) / (L[i - 1] || 1), ay = (P[i][1] - P[i - 1][1]) / (L[i - 1] || 1), bx = (P[i + 1][0] - P[i][0]) / (L[i] || 1), by = (P[i + 1][1] - P[i][1]) / (L[i] || 1);
    const c = -(ax * bx + ay * by), s = Math.sqrt(Math.max(0, .5 * (1 - c)));
    V[i] = s > .9999 ? Infinity : Math.sqrt(M.acc * M.dev * s / (1 - s)); V[i] = Math.min(V[i], cap(i - 1), cap(i)); }
  V[0] = V[n - 1] = 0;
  for (let i = 0; i < n - 1; i++) V[i + 1] = Math.min(V[i + 1], Math.sqrt(V[i] ** 2 + 2 * M.acc * L[i]));
  for (let i = n - 2; i >= 0; i--) V[i] = Math.min(V[i], Math.sqrt(V[i + 1] ** 2 + 2 * M.acc * L[i]));
  return { L, V, cap };
}

// ---- the program -----------------------------------------------------------------------------------------------------------
// one stroke's sweeps, timed: Float32Array records of 16 (quad 8, a 2, b 2, ink0, ink1, dry, t ms)
const REC = 16;
function strokeOps(P, M, T, pen, d, t0, live, wearK) {
  const { L, V, cap } = profile(P, M), ops = [], px = MM * d;   // mm -> device px
  const load = v => T.v0 / (v + T.v0), ink = v => (T.k0 + T.k1 * load(v)) * pen.flow * (1 - .5 * wearK), rad = v => pen.w / 2 * MM * (1 + T.spread * load(v)) * (1 + wearK) * d;
  const dry0 = Math.max(pen.dry ?? 0, T.tooth ?? 0), stria = pen.stria;
  const rec = (q, a, b, i0, i1, t, dry = dry0) => ops.push(q[0][0], q[0][1], q[1][0], q[1][1], q[2][0], q[2][1], q[3][0], q[3][1], a[0], a[1], b[0], b[1], i0, i1, dry, t);
  // a band of the line between offsets o0 and o1 (device px, signed, across) from A to B
  const band = (A, B, n, o0a, o1a, o0b, o1b, i0, i1, t, dry) => rec([[A[0] + n[0] * o0a, A[1] + n[1] * o0a], [A[0] + n[0] * o1a, A[1] + n[1] * o1a], [B[0] + n[0] * o1b, B[1] + n[1] * o1b], [B[0] + n[0] * o0b, B[1] + n[1] * o0b]], A, B, i0, i1, t, dry);
  // one step of the tip, across its width in bands: the rims darker than the core, and across them the tip's own fibres
  // (striae: each band's share fixed for this pen, the same in every stroke it draws, as a felt tip drags its fibres);
  // beyond, the fringe; below 5 device px, one band (the zones are inside a pixel)
  const step = (A, B, n, ra, rb, ia, ib, t, dry) => {
    if (2 * Math.max(ra, rb) < 5 || !T.rim && !T.fringe) return band(A, B, n, -ra, ra, -rb, rb, ia, ib, t, dry);
    const K = Math.max(3, Math.min(9, Math.floor(2 * ra / 2.5))) | 1;
    for (let j = 0; j < K; j++) { const u0 = -1 + 2 * j / K, u1 = -1 + 2 * (j + 1) / K, um = Math.abs((u0 + u1) / 2), k = (um > 1 - T.rim - 1 / K ? 1 : T.coreK) * (K > 3 ? stria[j % stria.length] : 1);
      const e0 = j ? .7 : 0, e1 = j < K - 1 ? .7 : 0;   // (neighbouring bands overlap by a pixel: their antialiased sides would leave a seam)
      band(A, B, n, u0 * ra - e0, u1 * ra + e1, u0 * rb - e0, u1 * rb + e1, ia * k, ib * k, t, dry); }
    if (T.fringe) for (const sg of [-1, 1]) band(A, B, n, sg * (ra - .7), sg * ra * (1 + T.fringe), sg * (rb - .7), sg * rb * (1 + T.fringe), ia * T.fringeK, ib * T.fringeK, t, Math.max(dry, .8));
  };
  // a disc of radius r (device px) at c (device px), as a stack of chords across dir (the engine sweeps quads)
  const disc = (c, r, V, t, dir = [1, 0], dry = dry0, el = 1) => { const K = Math.max(4, Math.min(12, Math.ceil(r * 1.2))), nx = -dir[1], ny = dir[0];
    for (let j = 0; j < K; j++) { const a0 = -Math.PI / 2 + .3 + (Math.PI - .6) * j / K, a1 = -Math.PI / 2 + .3 + (Math.PI - .6) * (j + 1) / K;
      const y0 = r * el * Math.sin(a0), h0 = r * Math.cos(a0), y1 = r * el * Math.sin(a1), h1 = r * Math.cos(a1);
      const A = [c[0] + dir[0] * y0, c[1] + dir[1] * y0], B = [c[0] + dir[0] * y1, c[1] + dir[1] * y1];
      rec([[A[0] - nx * h0, A[1] - ny * h0], [A[0] + nx * h0, A[1] + ny * h0], [B[0] + nx * h1, B[1] + ny * h1], [B[0] - nx * h1, B[1] - ny * h1]], A, B, V, V, t, dry); } };
  const D = p => [p[0] * px, p[1] * px];
  let t = t0, run = 0;   // run: mm drawn since the tip last rested (it runs drier along a long pen-down)
  const dryAt = () => Math.min(.4, dry0 + T.dry * run), fade = () => 1 - .12 * Math.min(1, T.dry * run / .3);
  // the bead (measured, above): the ink that flowed while the tip rested, spread into a dot
  // the tip is round: its end is a disc of its own width; the bead, the ink that flowed while it rested, lies in or over it
  const bead = (p, dir) => { disc(D(p), rad(M.vmax), ink(M.vmax) * (2 * rad(0) >= 5 ? T.coreK : 1), t, dir, pen.dry ?? 0); const r = rad(M.vmax) * (1 + (M.beadW - 1) * T.pool), v = ink(M.vmax) * (1 + (M.beadV - 1) * T.pool); disc(D(p), r, v, t, dir, pen.dry ?? 0, 1 + (M.beadL - 1) * T.pool); };   // (a pool is wet through: the tooth does not break it)
  const dir0 = [P[1][0] - P[0][0], P[1][1] - P[0][1]], l0 = Math.hypot(...dir0) || 1;
  bead(P[0], [dir0[0] / l0, dir0[1] / l0]); t += M.down * 1000;
  const fine = .7 / px, coarse = live ? 3 / px : Math.max(fine * 4, 2);   // (mm: the sample spacing where the speed changes; the cruise in pieces of 2 mm, so the tip can run dry along it)
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1], l = L[i]; if (l <= 1e-6) continue;
    const ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, vc = cap(i), n = [-uy, ux];
    const vAt = s => M.acc ? Math.min(vc, Math.sqrt(V[i] ** 2 + 2 * M.acc * Math.max(0, s)), Math.sqrt(V[i + 1] ** 2 + 2 * M.acc * Math.max(0, l - s))) : vc;
    // where the speed changes, sample finely; along the cruise, coarser
    const ramp = M.acc ? Math.max(0, (vc * vc - V[i] ** 2) / (2 * M.acc)) : 0, brake = M.acc ? Math.max(0, (vc * vc - V[i + 1] ** 2) / (2 * M.acc)) : 0;
    const marks = [0]; const addRun = (s0, s1, st) => { const k = Math.max(1, Math.ceil((s1 - s0) / st)); for (let j = 1; j <= k; j++) marks.push(s0 + (s1 - s0) * j / k); };
    const r0 = Math.min(ramp, l), b0 = Math.max(r0, l - brake);
    if (r0 > 0) addRun(0, r0, fine * 1.5); if (b0 > r0) addRun(r0, b0, coarse); if (l > b0) addRun(b0, l, fine * 1.5);
    for (let k = 1; k < marks.length; k++) { const s0 = marks[k - 1], s1 = marks[k], va = vAt(s0), vb = vAt(s1), vm = vAt((s0 + s1) / 2);
      const A = D([a[0] + ux * s0, a[1] + uy * s0]), B = D([a[0] + ux * s1, a[1] + uy * s1]), f = fade();
      step(A, B, n, rad(va), rad(vb), ink(va) * f, ink(vb) * f, t, dryAt());
      run += s1 - s0; t += (s1 - s0) / Math.max(vm, 1) * 1000; }
    // the round tip at a corner: the disc it sweeps while turning
    if (i < P.length - 2) { const c = P[i + 1], nx2 = P[i + 2][0] - c[0], ny2 = P[i + 2][1] - c[1], l2 = Math.hypot(nx2, ny2) || 1;
      if (ux * nx2 / l2 + uy * ny2 / l2 < .97) disc(D(c), rad(V[i + 1]), ink(V[i + 1]) * fade() * (rad(V[i + 1]) * 2 >= 5 ? T.coreK : 1), t, [ux, uy], dryAt()); }
  }
  // pen-up: the carriage has stopped; the tip stays down until the lift
  const e = P.at(-1), pe = P.at(-2), le = Math.hypot(e[0] - pe[0], e[1] - pe[1]) || 1;
  bead(e, [(e[0] - pe[0]) / le, (e[1] - pe[1]) / le]); t += M.up * 1000;
  return { ops: Float32Array.from(ops), t1: t };
}

// the pens as a theme inks them: { tip, w (mm), rgb, flow }, and on dark stock the gel's two passes
export function inkOf(pen, theme) { const P = typeof pen === 'string' ? { tip: 'fibre', w: .3, rgb: pen } : pen, s = P[theme] ?? P;
  const key = s.key ?? `${s.tip ?? P.tip}-${s.w ?? P.w}-${s.rgb ?? P.rgb}`, r = rng([...key].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)), T = TIPS[s.tip ?? P.tip ?? 'fibre'];
  // (the tip's fibres: a fixed share for each band across it, within ±striae)
  const stria = Array.from({ length: 9 }, () => 1 + (T.striae ?? 0) * (2 * r() - 1));
  return { tip: s.tip ?? P.tip ?? 'fibre', w: s.w ?? P.w ?? .3, rgb: hex(s.rgb ?? P.rgb), flow: s.flow ?? P.flow ?? 1, key, stria }; }

// the whole plot: layers in pen order, strokes in plot order, sweeps timed. d: device px per CSS px.
// ledger: { [pen key]: mm drawn } across the pieces of one page (the pen's wear). Mutated.
export function plan(piece, theme, d, ledger = {}, live = false) {
  const M = MACHINES[piece.machine ?? 'hp7475a'], seed = piece.seed ?? 1, R = rng(seed * 7919 + 13), layers = []; let t = 0, at = [0, 0];
  const ox = piece.ox ?? 0, oy = piece.oy ?? 0;
  for (const [li, L] of piece.layers.entries()) {
    const pen = inkOf(L.pen, theme), T = TIPS[pen.tip], passes = T.passes ?? 1;
    // the pen change: this pen sits a little off where the last one did (0.2 mm), the same offset for its whole layer
    const ang = R() * 2 * Math.PI, mag = li ? M.reg * (.35 + .65 * R()) : 0, reg = [Math.cos(ang) * mag, Math.sin(ang) * mag];
    const paths = (L.order === 'given' ? L.paths.filter(p => p.length > 1) : nearest(L.paths, [at[0] * MM - ox, at[1] * MM - oy])), strokes = [];   // (at: mm, on the sheet; the paths: px, the piece's own)
    if (li) t += 1500;   // (the carousel puts one pen back and takes the next)
    for (let pass = 0; pass < passes; pass++) for (const p0 of (pass ? [...paths].reverse() : paths)) {
      // the same pen returns within 0.1 mm: one rigid offset for the stroke
      const a = R() * 2 * Math.PI, m = M.rep * .5 * R(), sx = reg[0] + Math.cos(a) * m, sy = reg[1] + Math.sin(a) * m;
      const pts = (pass ? [...p0].reverse() : p0).map(([x, y]) => [(x + ox) / MM + sx, (y + oy) / MM + sy, 1]);
      let P = M.step && d * MM * M.step >= 1 ? stairs(pts, M.step) : pts; if (P.length < 2) continue;
      const travel = Math.hypot(P[0][0] - at[0], P[0][1] - at[1]); t += travel / M.vup * 1000;
      const used = ledger[pen.key] ?? 0, wearK = T.wear * used / 1000;
      const ps = pass < passes - 1 ? { ...pen, dry: T.skip, flow: pen.flow * .75 } : pen;
      const { ops, t1 } = strokeOps(P, M, T, ps, d, t, live, wearK);
      let len = 0; for (let i = 1; i < P.length; i++) len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); ledger[pen.key] = used + len;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (let k = 0; k < ops.length; k += REC) for (let j = 0; j < 8; j += 2) { x0 = Math.min(x0, ops[k + j]); x1 = Math.max(x1, ops[k + j]); y0 = Math.min(y0, ops[k + j + 1]); y1 = Math.max(y1, ops[k + j + 1]); }
      strokes.push({ ops, t0: t, t1, bb: [x0, y0, x1, y1] }); t = t1; at = P.at(-1);
    }
    layers.push({ pen, wet: T.wet, base: T.base, strokes, t0: strokes[0]?.t0 ?? t, t1: t });
  }
  return { layers, dur: t };
}

// ---- the ink engine, shared ------------------------------------------------------------------------------------------------
// two sheets in one page: one for still prints, one for a plot being watched (a context and its shaders cost tens of ms;
// browsers allow a handful)
const sheets = {};
function sheet(slot, w, h, dpr) {
  slot += '@' + dpr; let s = sheets[slot];   // (the paper's grain is laid at the device scale: one sheet per scale)
  if (s && !s.Md.gl.isContextLost() && s.dpr === dpr) { if (s.cv.width < w || s.cv.height < h) { s.Md.resize(Math.max(w, s.cv.width), Math.max(h, s.cv.height)); s.Md.settings.over = true; } return s; }
  s?.Md.gl.getExtension('WEBGL_lose_context')?.loseContext();
  const cv = document.createElement('canvas'); cv.width = Math.max(w, 512); cv.height = Math.max(h, 512);
  const Md = createMedium(cv, { dpr: dpr / 2.5, paper: [255, 255, 255] }); Md.settings.over = true;   // (its grain laid finer: cells ~.2 mm, as the masters' tooth breaks; the engine's own floor of 2.5 device px holds at 1x)
  return sheets[slot] = { cv, Md, dpr };
}
const meets = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const quad = new Array(4).fill(0).map(() => [0, 0]), A = [0, 0], B = [0, 0];
function lay(Md, ops) { for (let k = 0; k < ops.length; k += REC) {
  for (let j = 0; j < 4; j++) { quad[j][0] = ops[k + 2 * j]; quad[j][1] = ops[k + 2 * j + 1]; }
  A[0] = ops[k + 8]; A[1] = ops[k + 9]; B[0] = ops[k + 10]; B[1] = ops[k + 11]; Md.sweep(quad, A, B, ops[k + 12], ops[k + 13], ops[k + 14]); } }
// compositing a pen's layer onto the piece: on light stock the inks are dyes (a red over a black darkens, never covers);
// on dark stock gel is opaque and lies over what is there
const blend = theme => theme === 'dark' ? 'source-over' : 'multiply';

function prepare(piece, theme, { dpr, zoom = 1 }) {
  const d = dpr * zoom, pad = 3, cw = Math.ceil((piece.W + 2 * pad) * d), ch = Math.ceil((piece.H + 2 * pad) * d);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; cv.style.width = (piece.W + 2 * pad) * zoom + 'px'; cv.style.height = (piece.H + 2 * pad) * zoom + 'px';
  cv.style.margin = `${-pad * zoom}px`;   // (the canvas's own origin stays where the page put the piece; the pad holds the beads)
  return { cv, d, pad, cw, ch };
}
const shifted = (piece, pad) => ({ ...piece, ox: (piece.ox ?? 0) + pad, oy: (piece.oy ?? 0) + pad });

export function print(piece, theme, { dpr = Math.min(2, devicePixelRatio || 1), zoom = 1, ledger = {} } = {}) {
  const { cv, d, pad, cw, ch } = prepare(piece, theme, { dpr, zoom });
  if (!supported()) return cv;
  const prog = plan(shifted(piece, pad), theme, d, ledger), { cv: mc, Md } = sheet('still', cw, ch, d), g = cv.getContext('2d');
  for (const L of prog.layers) {
    Md.clear(); Md.wetness(L.wet); Md.settings.ink = L.pen.rgb; Md.settings.base = L.base; Md.makePaper([0, 0], [0, 0, cw, ch]);
    // ink waits in the stroke layer until a stroke would cross ink not yet poured; then the time since is let pass
    let pend = [], last = L.t0;
    for (const S of L.strokes) { if (pend.some(b => meets(b, S.bb))) { Md.step(Math.min(3000, S.t0 - last)); last = S.t0; pend = []; } lay(Md, S.ops); pend.push(S.bb); }
    Md.finish(); Md.render([0, 0, cw, ch]);
    g.globalCompositeOperation = blend(theme); g.drawImage(mc, 0, 0, cw, ch, 0, 0, cw, ch);
  }
  return cv;
}

// The plot as it is made: pen by pen, stroke by stroke in plot order, each sweep at its own moment. The machine's time
// is shown as it is, or quickened so the whole plot takes at most `max` seconds (a drum plotter draws at 25 mm/s).
export function writer(piece, theme, { dpr = Math.min(2, devicePixelRatio || 1), zoom = 1, ledger = {}, max = 7, slot = 'live' } = {}) {
  const { cv, d, pad, cw, ch } = prepare(piece, theme, { dpr, zoom }), g = cv.getContext('2d');
  if (!supported()) return { cv, dur: 0, at() {}, done() {} };
  const prog = plan(shifted(piece, pad), theme, d, ledger, true), dur = Math.min(max * 1000, prog.dur), k = prog.dur / Math.max(1, dur);
  const base = new OffscreenCanvas(cw, ch), bg = base.getContext('2d');
  let li = -1, si = 0, oi = 0, pend = [], last = 0, prevT = 0, Md = null, mc = null;
  const begin = i => { li = i; si = oi = 0; pend = []; const L = prog.layers[i]; last = L.t0;
    ({ cv: mc, Md } = sheet(slot, cw, ch, d)); Md.clear(); Md.wetness(L.wet); Md.settings.ink = L.pen.rgb; Md.settings.base = L.base; Md.makePaper([0, 0], [0, 0, cw, ch]); };
  const show = () => { Md.render([0, 0, cw, ch]); g.clearRect(0, 0, cw, ch); g.globalCompositeOperation = 'source-over'; g.drawImage(base, 0, 0);
    g.globalCompositeOperation = blend(theme); g.drawImage(mc, 0, 0, cw, ch, 0, 0, cw, ch); };
  const close = () => { Md.finish(); show(); bg.clearRect(0, 0, cw, ch); bg.drawImage(cv, 0, 0); };
  function at(f) {
    const T = Math.max(0, f) * dur * k; if (li < 0) begin(0);
    for (;;) { const L = prog.layers[li];
      while (si < L.strokes.length && L.strokes[si].t0 <= T) { const S = L.strokes[si];
        if (oi === 0 && pend.some(b => meets(b, S.bb))) { Md.step(Math.min(3000, S.t0 - last)); last = S.t0; pend = []; }
        while (oi < S.ops.length && S.ops[oi + 15] <= T) { lay(Md, S.ops.subarray(oi, oi + REC)); oi += REC; }
        if (oi < S.ops.length) break; pend.push(S.bb); si++; oi = 0; }
      if (si >= L.strokes.length && li < prog.layers.length - 1 && prog.layers[li + 1].t0 - 1500 <= T) { close(); begin(li + 1); continue; }
      break; }
    Md.step(Math.max(1, Math.min(50, (T - prevT) / k))); prevT = T; show();
  }
  return { cv, dur, at, done() { at(1 + 1e-9); close(); } };
}
