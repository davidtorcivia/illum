// Sumi: the brush (research/28-sumi.md §2, Stage 1). One object explains the marks: a round bundle of hairs (a fude)
// holding ink in its belly, meeting absorbent paper at some speed, pressure and load. Each variation has its cause:
//   - pressure: the belly is pressed down and the footprint widens (press(u), capped by the brush's size);
//   - speed: a minimum-jerk hand (slow to set down, quick in the middle, slowing or lifting at the end; slower in tight
//     turns, v ∝ R^1/3), and ink is given per unit of time, so the stroke is heavier where the hand is slow (a loaded
//     start, a pooled turn) and finer where it is quick;
//   - load: every hair (here a track, a few device px wide) holds its own charge, the outer hairs less, and spends it
//     with the ink it lays; a track whose charge is spent narrows and ends, once (the dry brush, flying white). The
//     tracks are continuous streaks along the stroke: nothing here skips on the paper's tooth (the engine's dryness is
//     always 0), so no speck or island is ever made;
//   - bleed: the engine's own wet ink levels a little and creeps along the paper's fibre at every edge (wetness);
//   - the halo (nijimi): water and glue run ahead of the carbon into the fibre; the faint fringe is wider where the
//     brush dwelt (width ∝ √dwell, Lucas–Washburn), narrower where it was quick, and gone where the brush ran dry.
//     Drawn in its dried state, growing with the stroke (never a fade).
//   - entry and exit: hidden tip (the brush pressed in against the stroke's way: a round, full head), exposed tip (from
//     a point), and at the end a lift (to a point, the tracks parting), a return (round, tucked) or a stop (pressed).
// The seal: cinnabar paste pressed by a carved stone, whose face is never quite flat: a smooth pressure plane (one
// corner fuller), a slow streak from the paste's fibre, a carved edge; it rolls on from its first corner. Never a disc.
// Everything is laid through the ink engine (kit/medium.js) by its public sweep and pour.
//
//   brush(stroke, d, t0) -> { ops, t1, bb }     one stroke's sweeps, timed (records of 16: quad 8, a 2, b 2, ink0, ink1, dry, t)
//   print(piece, theme, { dpr, zoom }) -> canvas      writer(piece, theme, { dpr, zoom, slot }) -> { cv, dur, at(f), done() }
//   piece: { W, H, at: [x, y], layers: [{ ink: 'sumi'|'seal'|..., strokes: [stroke] } | { ink, seal } | { ink, pour }] }
//   stroke: { pts, w, press?, entry: 'hidden'|'exposed', exit: 'lift'|'return'|'stop', dryAt, wet, tone, pace, flat?, seed }
import { createMedium } from '../medium.js';
import { supported } from '../writer.js';
import { resample, noise1, noise2, mulberry } from '../marks.js';
import { letterOrder, boxBlur, dist } from '../inkletter.js';
import { mask as glyphMask, strokes as glyphStrokes } from './sumi-letter.js';

export const REC = 16;
export const rng = s => mulberry((s >>> 0) || 1);
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// The inks a theme lays (sRGB). Light: sumi on xuan; the seal in cinnabar. Dark: the inkstone's ground under a silver-white
// ink (the tones a ladder of light, not of dark); the seal lifted so it holds on the dark; gold only at a seal's size.
export const INKS = {
  sumi: { light: [27, 26, 29], dark: [233, 231, 224] },
  pale: { light: [27, 26, 29], dark: [233, 231, 224] },
  seal: { light: [192, 54, 36], dark: [222, 92, 68] },
  gold: { light: [196, 58, 40], dark: [214, 184, 112] },
  shu: { light: [190, 52, 36], dark: [226, 104, 82] },   // vermilion ink (shuboku), brushed: the teacher's red
};

// ---- the stroke ----------------------------------------------------------------------------------------------------------
// a disc of radius r (device px) at c, as chords across dir (the engine sweeps quads)
function disc(rec, c, r, V, t, dir = [1, 0]) {
  const K = Math.max(4, Math.min(14, Math.ceil(r * 1.1))), nx = -dir[1], ny = dir[0];
  for (let j = 0; j < K; j++) { const a0 = -Math.PI / 2 + Math.PI * j / K, a1 = -Math.PI / 2 + Math.PI * (j + 1) / K;
    const y0 = r * Math.sin(a0), h0 = r * Math.cos(a0) + .3, y1 = r * Math.sin(a1), h1 = r * Math.cos(a1) + .3;
    const A = [c[0] + dir[0] * y0, c[1] + dir[1] * y0], B = [c[0] + dir[0] * y1, c[1] + dir[1] * y1];
    rec([[A[0] - nx * h0, A[1] - ny * h0], [A[0] + nx * h0, A[1] + ny * h0], [B[0] + nx * h1, B[1] + ny * h1], [B[0] - nx * h1, B[1] - ny * h1]], A, B, V, V, t); }
}

// S.pts: the path (CSS px); S.w: the brush's full width at full pressure (px); S.press(u): pressure along it (0..1, the
// width's share); S.dryAt: where (a share of the length) the middle hair's charge is spent (>1: it never runs dry);
// S.wet: how much water (the halo); S.tone: the ink's strength (scorched 1.15 … clear .2); S.pace: the hand's top speed in widths per
// ms; S.flat: a flat brush (hake, as flying white was written) held at this angle, else round; S.split: how far the
// tracks part as they dry (1 usual); S.v0: the speed at the start, a share of the top (a stroke already moving).
export function brush(S, d, t0 = 0, opts = {}) {
  const r = rng(S.seed ?? 1), W = S.w, ds = Math.max(.3, Math.min(1.6, W * .1, 2.4 / d));
  // a hidden tip, written: the brush set down a little back and to one side of the stroke's way and turned into it, so
  // the head is the brush's own sweep (blunt, slanted, a little fuller), never a stamped disc
  let pts0 = S.pts;
  if (S.head === 'step' && pts0.length > 1) {
    const a = pts0[0], b = pts0[Math.min(pts0.length - 1, 3)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l, sd = ((S.seed ?? 1) % 2) ? 1 : -1, hw = W * .5;
    pts0 = [[a[0] - tx * hw * .3 - ty * sd * hw * .3, a[1] - ty * hw * .3 + tx * sd * hw * .3], [a[0] - tx * hw * .08, a[1] - ty * hw * .08], ...pts0]; }
  const P = resample(pts0, ds), n = P.length, ops = [];
  const rec = (q, a, b, i0, i1, t) => ops.push(q[0][0], q[0][1], q[1][0], q[1][1], q[2][0], q[2][1], q[3][0], q[3][1], a[0], a[1], b[0], b[1], i0, i1, 0, t);
  if (n < 2) return { ops: new Float32Array(0), t1: t0, bb: [0, 0, 0, 0] };
  const Sx = [0]; for (let i = 1; i < n; i++) Sx.push(Sx[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = Sx[n - 1] || 1, T = [], N = [], K = [];
  for (let i = 0; i < n; i++) { const a = P[Math.max(0, i - 2)], b = P[Math.min(n - 1, i + 2)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; T.push([dx / l, dy / l]); N.push([-dy / l, dx / l]); }
  for (let i = 0; i < n; i++) { const a = T[Math.max(0, i - 3)], b = T[Math.min(n - 1, i + 3)], span = Sx[Math.min(n - 1, i + 3)] - Sx[Math.max(0, i - 3)] || 1;
    K.push(Math.abs(Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1])) / span); }
  // C: the causes in play (the bench turns them on one at a time; a page has them all)
  const C = { press: 1, speed: 1, load: 1, dry: 1, halo: 1, ...S.causes };
  const entry = C.press ? S.entry ?? 'hidden' : 'hidden', exit = C.press ? S.exit ?? 'lift' : 'return', tone = S.tone ?? 1, wet = C.halo ? S.wet ?? .4 : 0, split = S.split ?? 1;
  // the hand: a slow wander of the pressure (its own 1/f), and of the line's place across (a few hundredths of the width)
  const wv = noise1((S.seed ?? 1) * 31 + 7), wv2 = noise1((S.seed ?? 1) * 17 + 3), hv = noise1((S.seed ?? 1) * 13 + 11), haloN = noise1((S.seed ?? 1) * 7 + 5);
  const eLen0 = W * (.8 + .7 * r()), xLen0 = W * (1.6 + 1.6 * r()) * (S.tail ?? 1);
  // (a short broad stroke cannot taper over more than its own length: its point and its lift take a share of it)
  const eLen = S.capTaper ? Math.min(eLen0, L * .3) : eLen0, xLen = S.capTaper ? Math.min(xLen0, L * .45) : xLen0;
  // speed: a minimum-jerk bell between where the hand sets down and where it lifts; a lift leaves at speed
  const vmax = (S.pace ?? .03) * W, u0 = S.v0 ?? (entry === 'exposed' ? .22 : .06), u1 = exit === 'lift' ? .8 : .97;
  const V = new Float64Array(n), Wd = new Float64Array(n), F = new Float64Array(n), tt = new Float64Array(n), Tx = new Float64Array(n).fill(1);
  for (let i = 0; i < n; i++) {
    const s = Sx[i], u = s / L, uu = u0 + (u1 - u0) * u, bell = 16 * uu * uu * (1 - uu) * (1 - uu);
    let v = vmax * (.1 + .9 * bell); const R = 1 / Math.max(K[i], 1e-4); v = Math.min(v, vmax * .6 * Math.cbrt(R / W)); V[i] = C.speed ? Math.max(v, vmax * .06) : vmax * .55;
    if (!C.press) { Wd[i] = W * .8; continue; }
    let w = W * (S.press ? S.press(u) : 1) * (1 + .07 * (wv(s / (W * 2.2)) - .5) + .04 * (wv2(s / (W * .7)) - .5));
    if (entry === 'exposed') w *= .05 + .95 * sm(0, eLen, s) ** .8; else if (entry === 'square') w *= .75 + .25 * sm(0, W * .8, s);
    if (exit === 'lift') Tx[i] = (1 - sm(L - xLen, L + W * .1, s)) ** .8;
    Wd[i] = Math.max(.25, w);
  }
  for (let i = 1; i < n; i++) tt[i] = tt[i - 1] + (Sx[i] - Sx[i - 1]) / ((V[i] + V[i - 1]) / 2);
  // ink given per unit of time: heavier where slow
  const flow = v => C.speed ? .72 + .62 * Math.exp(-v / (.3 * vmax)) : 1;
  for (let i = 1; i < n; i++) F[i] = F[i - 1] + flow(V[i]) * Wd[i] * Tx[i] / W * (Sx[i] - Sx[i - 1]);
  // the hairs: tracks across the width, a few device px each, their widths unequal (many fine, a few broad clumps); the
  // outer ones hold less, and so do the fine ones
  const maxW = Math.max(...Wd) * d, Kt = maxW < 7 ? 1 : Math.max(3, Math.min(17, Math.round(maxW / (S.trackPx ?? 2.6))));
  const wts = Array.from({ length: Kt }, () => .2 + 1.6 * r() ** 1.7), sw = wts.reduce((a, b) => a + b, 0), E = [-1]; for (const x of wts) E.push(E.at(-1) + 2 * x / sw);
  const q = [], st = [], closeK = [], closeL = [];
  for (let k = 0; k < Kt; k++) { const c = (E[k] + E[k + 1]) / 2, sl = (E[k + 1] - E[k]) / (2 / Kt);
    q.push((1 - .25 * Math.abs(c) ** 1.6) * (.9 + .2 * r()) * (.42 + .58 * Math.min(1.4, sl) / 1.4)); st.push(1 + .06 * (2 * r() - 1));
    closeK.push(r() < .7 ? 1 : 0); closeL.push(W * (.8 + 3 * r())); }
  const qs = [...q].sort((a, b) => a - b), qmed = qs[Kt >> 1], dryAt = S.dryAt ?? 2, spend = dryAt < 1.5 ? qmed / Math.max(1e-6, F[Math.min(n - 1, Math.round(dryAt * (n - 1)))] || F[n - 1]) : 0;
  const thr = .2;
  // where each hair's charge is spent (its track ends there, once)
  const dI = q.map(qk => { if (!spend || !C.dry) return n; for (let i = 0; i < n; i++) if (qk - spend * F[i] <= 0) return i; return n; });
  // a lift tapers the stroke to its point, but a dry brush lifting keeps its splayed hairs: the taper is weaker as they part
  const frame = i => { const h = Wd[i] * (1 - (1 - Tx[i]) * (.3 + .7 * gm[i])) / 2 * d, sh = (hv(Sx[i] / (W * 3)) - .5) * .05 * W * d, p = [P[i][0] * d + N[i][0] * sh, P[i][1] * d + N[i][1] * sh];
    if (S.flat == null) return { p, e: [N[i][0] * h, N[i][1] * h], h, eL: h };
    // (a flat brush's edge keeps its angle; where the stroke runs along it the hairs' own thickness is all that marks: a
    // core laid along the normal, below. Never flip the edge to fake a width: that saws the stroke where it turns.)
    const nb = [Math.cos(S.flat), -Math.sin(S.flat)], e = [nb[0] * h, nb[1] * h];
    return { p, e, h: Math.max(.14 * h, Math.abs(e[0] * N[i][0] + e[1] * N[i][1])), eL: h, core: [N[i][0] * .14 * h, N[i][1] * .14 * h] }; };
  // the load: as the belly empties the whole stroke runs a little paler (lm), the hairs part (g)
  const lm = i => C.load && spend ? .7 + .3 * cl((qmed - spend * F[i]) / qmed) : 1;
  const g0 = (k, i) => { if (!spend || !C.dry) return 1; const Q = q[k] - spend * F[i], th = thr * q[k]; return Q >= th ? 1 : Q <= 0 ? 0 : (Q / th) ** (.75 * split); };
  const gm = new Float64Array(n); for (let i = 0; i < n; i++) { let a = 0; for (let k = 0; k < Kt; k++) a += g0(k, i); gm[i] = a / Kt; }
  // when most hairs are spent the last few give out together (a lone hair does not run on round the circle)
  const g = (k, i) => g0(k, i) * (Kt < 3 ? 1 : sm(.02, .16, gm[i]));
  const band = (fa, fb, lo0, hi0, lo1, hi1, i0, i1, t) => { const { p: a, e: ea } = fa, { p: b, e: eb } = fb;
    rec([[a[0] + ea[0] * lo0, a[1] + ea[1] * lo0], [a[0] + ea[0] * hi0, a[1] + ea[1] * hi0], [b[0] + eb[0] * hi1, b[1] + eb[1] * hi1], [b[0] + eb[0] * lo1, b[1] + eb[1] * lo1]], a, b, i0, i1, t); };
  // the outermost hairs wander a little (the edge is a brush's, never ruled)
  const eg0 = noise1((S.seed ?? 1) * 5 + 1), eg1 = noise1((S.seed ?? 1) * 5 + 2), fan = S.fan ?? .14;
  // a track's extent across, at step i (normalised along e): wet, its slot and a pixel's overlap into its neighbours;
  // drying, narrowing (and paling) until it ends; a gap left by a spent hair may close again as its neighbours spread
  const gapW = (j, i) => i < dI[j] || !closeK[j] ? 0 : (E[j + 1] - E[j]) * .5 * Math.min(1, (Sx[i] - Sx[dI[j]]) / closeL[j]);
  const ext = (k, i, h) => { const gk = g(k, i); if (gk <= 0) return null; const ov = Math.min(.2, 1.1 / Math.max(1, h)), sp = 1 + (S.flat == null ? fan : 0) * (1 - gm[i]), c = (E[k] + E[k + 1]) / 2 * sp, hw = (E[k + 1] - E[k]) / 2;
    // (a drying clump keeps its width and then gives out over a short way: the white opens as a slit between clumps in a
    // black body, as in Bankei's, rather than the body parting into thin lines)
    const wf = gk >= 1 ? 1 : gk < .12 ? gk / .12 * .88 : .88 + .12 * Math.sqrt(gk);
    let lo = c - hw * wf - ov * gk ** 3, hi = c + hw * wf + ov * gk ** 3;
    if (k > 0) lo -= gapW(k - 1, i); if (k < Kt - 1) hi += gapW(k + 1, i);
    if (S.flat == null) { if (k === 0) lo -= .07 * (eg0(Sx[i] / (W * .45)) - .5) * 2; if (k === Kt - 1) hi += .07 * (eg1(Sx[i] / (W * .45)) - .5) * 2; }
    return [lo, hi, gk, .6 + .4 * gk]; };
  // the wet ink settles a little unevenly along the stroke (Hakuin's raw paper: sd ~5 L in the body, slow)
  const mN = noise1((S.seed ?? 1) * 3 + 29), mo = i => 1 + .12 * (mN(Sx[i] / (W * 1.3)) - .5);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  let fa = frame(0);
  // the head: a hidden tip is a round, full head where the brush pressed in against the stroke's way (and pooled)
  // (a little to one side: the tip came in on a slant)
  // the hidden tip's head: round, the brush's own width and the ink it lays there (a disc would stamp a ball if fuller)
  if (entry === 'hidden' && S.head !== 'disc') { const f1 = frame(Math.min(1, n - 1)); disc(rec, [fa.p[0] - T[0][0] * fa.h * .15, fa.p[1] - T[0][1] * fa.h * .15], Math.min(fa.h, f1.h) * .98, tone * flow(V[1] ?? V[0]) * lm(0) * mo(0) * .92, t0, T[0]); }
  if (entry === 'hidden' && S.head === 'disc') { const sd = r() < .5 ? -1 : 1, c = [fa.p[0] - T[0][0] * fa.h * .1 + N[0][0] * sd * fa.h * .1, fa.p[1] - T[0][1] * fa.h * .1 + N[0][1] * sd * fa.h * .1], v0 = tone * flow(V[0]) * lm(0);
    disc(rec, c, fa.h * .9, v0, t0, T[0]); disc(rec, [c[0] + T[0][0] * fa.h * .45 - N[0][0] * sd * fa.h * .22, c[1] + T[0][1] * fa.h * .45 - N[0][1] * sd * fa.h * .22], fa.h * .86, v0, t0, T[0]); }
  for (let i = 1; i < n; i++) {
    const sq = j => entry === 'square' ? .6 + .4 * sm(0, W * 1.1, Sx[j]) : 1;
    const fb = frame(i), t = t0 + tt[i - 1], va = flow(V[i - 1]) * tone * lm(i - 1) * mo(i - 1) * sq(i - 1), vb = flow(V[i]) * tone * lm(i) * mo(i) * sq(i);
    let top = -Infinity, bot = Infinity, gs = 0, live = 0;
    for (let k = 0; k < Kt; k++) {
      const A = Kt === 1 ? [-1, 1, g(0, i - 1), 1] : ext(k, i - 1, fa.eL), B = Kt === 1 ? [-1, 1, g(0, i), 1] : ext(k, i, fb.eL); if (!A || !B) continue;
      band(fa, fb, A[0], A[1], B[0], B[1], va * st[k] * A[3], vb * st[k] * B[3], t);
      top = Math.max(top, B[1]); bot = Math.min(bot, B[0]); gs += B[2]; live++;
    }
    if (fa.core && live) { const A = fa.p, B = fb.p, ca = fa.core, cb = fb.core;
      rec([[A[0] - ca[0], A[1] - ca[1]], [A[0] + ca[0], A[1] + ca[1]], [B[0] + cb[0], B[1] + cb[1]], [B[0] - cb[0], B[1] - cb[1]]], A, B, va * gm[i], vb * gm[i], t); }
    // the halo: wider where the brush dwelt, gone where it is dry
    if (live && wet > 0 && !opts.noHalo) {
      const dwell = Wd[i] / V[i], wetK = (gs / Kt) ** 1.5, hw = wet * .011 * W * Math.sqrt(dwell) * wetK * (.7 + .6 * haloN(Sx[i] / (W * 1.7))) * d, hn = hw / Math.max(1, fb.eL) * (fb.h / fb.eL);
      if (hw >= 1) for (const [edge, sg] of [[top, 1], [bot, -1]]) {
        band(fa, fb, edge - sg * .3 / fb.eL, edge + sg * hn * .5, edge - sg * .3 / fb.eL, edge + sg * hn * .5, .17 * tone * wetK, .17 * tone * wetK, t);
        band(fa, fb, edge + sg * hn * .45, edge + sg * hn, edge + sg * hn * .45, edge + sg * hn, .07 * tone * wetK, .07 * tone * wetK, t); }
    }
    for (const p of [fb.p]) { const e = fb.e, m = Math.hypot(e[0], e[1]) * 1.4 + 6; x0 = Math.min(x0, p[0] - m); x1 = Math.max(x1, p[0] + m); y0 = Math.min(y0, p[1] - m); y1 = Math.max(y1, p[1] + m); }
    fa = fb;
  }
  // the end: a return tucks the tip (round), a stop presses it (round, fuller); a lift has already tapered to its point
  const t1 = t0 + tt[n - 1];
  if (exit !== 'lift' && g(0, n - 1) > 0) { const fe = frame(n - 1), c = [fe.p[0] - T[n - 1][0] * fe.h * .2, fe.p[1] - T[n - 1][1] * fe.h * .2];
    disc(rec, c, fe.h * (exit === 'stop' ? 1.06 : .98), tone * flow(V[n - 1]) * (exit === 'stop' ? 1.2 : 1.1), t1, T[n - 1]); }
  return { ops: Float32Array.from(ops), t1, bb: [x0, y0, x1, y1], L, len: tt[n - 1] };
}

// ---- the ensō ------------------------------------------------------------------------------------------------------------
// One stroke round a circle that is not one: the arm pivots, so the radius drifts (a few per cent, flatter on one side);
// it starts loaded (a hidden tip, the pool) where the hand sets down (seeded; most often near eight o'clock) and goes
// round (most often clockwise), quick in the middle, and runs dry toward its end, which stops short of the start or laps
// it. Width about a tenth of the diameter (Bankei's, measured: .10–.12).
export function ensoStroke(cx, cy, R, seed, { w = .12, sweep = null, start = null, cw = null, dryAt = .86, wet = .35, tone = 1.05, pace = .03 } = {}) {
  const r = rng(seed * 7 + 3), a0 = start ?? (Math.PI * (.62 + .3 * (r() - .5))), dir = cw ?? (r() < .8 ? 1 : -1), sw = sweep ?? (2 * Math.PI * (.93 + .14 * r()));
  const ph1 = r() * 6.28, ph2 = r() * 6.28, ax = .94 + .1 * r(), tilt = r() * Math.PI, pts = [], n = 160;
  // the side the hand pulls toward the body runs fuller (Bankei: .13 of the diameter low left, .08 across the top)
  const thick = Math.PI * (.75 + .25 * (r() - .5));
  for (let k = 0; k <= n; k++) { const u = k / n, a = a0 + dir * sw * u, rr = R * (1 + .035 * Math.sin(a + ph1) + .02 * Math.sin(2 * a + ph2) - .03 * u);
    const x = Math.cos(a - tilt) * rr, y = Math.sin(a - tilt) * rr * ax, c = Math.cos(tilt), s = Math.sin(tilt);
    pts.push([cx + x * c - y * s, cy + x * s + y * c]); }
  const press = u => .86 + .2 * Math.cos(a0 + dir * sw * u - thick);
  return { pts, w: 2 * R * w, press, entry: 'hidden', exit: 'lift', dryAt, wet, tone, pace, seed: seed * 13 + 1, tail: .7, fan: .2 };
}

// ---- the strokes a page writes (each one stroke, one clear thing) --------------------------------------------------------
// hd: the page's hand: { k (brush scale), pace, wet, tone, lean (a slope the hand gives its horizontals) }
const H0 = { k: 1, pace: 1, wet: .4, tone: 1, lean: .035 };
const bow = (a, b, amt, n = 24, skew = .5) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n, nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1, s = Math.sin(Math.PI * (u < skew ? u / skew * .5 : .5 + (u - skew) / (1 - skew) * .5)) * amt;
  return [a[0] + (b[0] - a[0]) * u + nx / l * s, a[1] + (b[1] - a[1]) * u + ny / l * s]; });
// a point (dian): the brush set down on a slant, pressed, drawn a little and lifted or turned back (a mark with a direction and
// a tail, never a round dot). size: its length (px).
export function dian(x, y, size, seed, hd = H0, o = {}) {
  const r = rng(seed * 3 + 1), a = (o.angle ?? .75) + (r() - .5) * .35, len = size * (.8 + .3 * r()), b = [x + Math.cos(a) * len, y + Math.sin(a) * len];
  return { pts: bow([x, y], b, len * (.06 + .08 * r()) * (r() < .5 ? -1 : 1)), w: size * (.62 + .14 * r()) * hd.k, press: u => .35 + .65 * Math.sin(Math.PI * Math.min(1, .25 + u * .95)) ** .7,
    entry: 'exposed', v0: .3, exit: r() < .6 ? 'return' : 'lift', tail: .6, dryAt: 2, wet: hd.wet, tone: (o.tone ?? 1) * hd.tone, pace: .05 * hd.pace, seed: seed * 7 + 2, ...o.s };
}
// a horizontal (heng): a hidden-tip start, rising a little, a slight bow; dryAt: where its charge is spent
export function heng(x, y, len, w, seed, hd = H0, o = {}) {
  const r = rng(seed * 5 + 3), rise = len * hd.lean * (.6 + .8 * r()), b = [x + len, y - rise];
  return { pts: bow([x, y], b, -len * (.008 + .012 * r()), 30, .35 + .3 * r()), w: w * hd.k, press: o.press ?? (u => .8 + .2 * Math.sin(Math.PI * Math.min(1, u * 1.2)) - .1 * u),
    entry: o.entry ?? 'hidden', exit: o.exit ?? 'lift', dryAt: o.dryAt ?? .75, wet: hd.wet, tone: (o.tone ?? 1) * hd.tone, pace: (o.pace ?? .03) * hd.pace, seed: seed * 7 + 3, tail: o.tail ?? 1, fan: o.fan, flat: o.flat, split: o.split };
}
// a vertical (shu): hidden head, a slight bow, ending in a hanging needle (a lift) or a dewdrop (a return)
export function shu(x, y, len, w, seed, hd = H0, o = {}) {
  const r = rng(seed * 11 + 5), b = [x + len * (r() - .5) * .03, y + len];
  return { pts: bow([x, y], b, len * (.006 + .01 * r()) * (r() < .5 ? -1 : 1)), w: w * hd.k, press: o.press ?? (u => .85 + .15 * Math.sin(Math.PI * u) - .15 * u),
    entry: 'hidden', exit: o.exit ?? (r() < .7 ? 'lift' : 'return'), dryAt: o.dryAt ?? .8, wet: hd.wet, tone: (o.tone ?? 1) * hd.tone, pace: (o.pace ?? .028) * hd.pace, seed: seed * 7 + 5, tail: o.tail ?? 1.4, flat: o.flat, split: o.split };
}
// a sweep (na, the right-falling stroke, laid on its side): from a fine start it presses wider to its foot, then lifts flat
export function sweep(a, b, w, seed, hd = H0, o = {}) {
  const r = rng(seed * 13 + 7), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return { pts: bow(a, b, len * (o.bow ?? (.05 + .04 * r())), 32, .6), w: w * hd.k, press: o.press ?? (u => .18 + .82 * Math.min(1, (u / .8) ** 1.4)),
    entry: 'exposed', v0: .15, exit: 'lift', tail: o.tail ?? .55, dryAt: o.dryAt ?? .82, wet: hd.wet, tone: (o.tone ?? 1) * hd.tone, pace: (o.pace ?? .04) * hd.pace, seed: seed * 7 + 7, fan: o.fan ?? .2, flat: o.flat, split: o.split };
}
// an orchid leaf (after Zheng Xie): from a fine start it swells (the 'mantis belly'), pinches where it turns to show its
// back, swells a little again, and is lifted to a long fine point. From base at heading a (rad), its curvature growing
// (it arches over); len, w px. Quick: a leaf is written in one quick pull.
export function leaf(base, a, len, w, seed, hd = H0, o = {}) {
  const r = rng(seed * 17 + 9), k0 = (o.k0 ?? .0), k1 = (o.k1 ?? (1.6 + 1.2 * r())) * (o.turn ?? 1), pinch = o.pinch ?? (.5 + .2 * r()), pts = []; let x = base[0], y = base[1], h = a;
  const n = 48; for (let i = 0; i <= n; i++) { pts.push([x, y]); const u = i / n, ds = len / n; h += (k0 + k1 * u * u) / len * ds; x += Math.cos(h) * ds; y += Math.sin(h) * ds; }
  // flatY: the leaf laid low (a filler sits in its line's band): its rise and fall above and below the root held to flatY px
  if (o.flatY != null) { let up = 0, dn = 0; for (const p of pts) { up = Math.max(up, base[1] - p[1]); dn = Math.max(dn, p[1] - base[1]); } const ku = up > o.flatY ? o.flatY / up : 1, kd = dn > o.flatY * .6 ? o.flatY * .6 / dn : 1;
    for (const p of pts) p[1] = base[1] + (p[1] < base[1] ? (p[1] - base[1]) * ku : (p[1] - base[1]) * kd); }
  const bump = (u, c, s) => Math.exp(-(((u - c) / s) ** 2));
  const sw = o.swell ?? 1;   // (the belly: 1 Zheng Xie's; lower, a flatter leaf)
  return { pts, w: w * hd.k, press: u => (.12 + .88 * Math.max(bump(u, .28, .2), .55 * bump(u, pinch + .14, .1)) * (1 - .6 * bump(u, pinch, .05)) * (u < .08 ? u / .08 : 1)) ** sw,
    entry: 'exposed', v0: .3, exit: 'lift', tail: o.tail ?? 3, dryAt: o.dryAt ?? 1.3, wet: hd.wet * .6, tone: (o.tone ?? 1) * hd.tone, pace: (o.pace ?? .09) * hd.pace, seed: seed * 7 + 9, wait: o.wait, ...o.s };
}

// ---- the seal ------------------------------------------------------------------------------------------------------------
// A carved stone pressed once: the face (a square or a tall oblong) cut either as white letters in a red block (baiwen) or
// red letters and a red border (zhuwen), the letters Latin (an OFL face, never faux seal script), or an abstract cut.
// size: CSS px (its width); kind: 'baiwen' | 'zhuwen' | 'bar'; text: the letters; aspect: height / width.
// fill: the letters' share of the face; ring: the zhuwen border's width; worn (0..1): a cut stone's print: its sides
// straight but leaning a little (each corner a hair off square), a corner or two knocked off, two or three small sharp
// chips bitten from its edge (seeded), the paste starved toward one side or corner where the stone met the paper less
// firmly, a faint lighter patch in the field; the letter's thin cuts opened a little so a serif survives a small print.
// Everything in the press is continuous (no grain, no pinhole).
export function sealMask(size, d, { kind = 'baiwen', text = 'DT', aspect = 1, font = '700 {s}px "illum-sumi-cinzel"', seed = 1, fill = .78, ring = .075, worn = .8 } = {}) {
  const r = rng(seed * 5 + 9), pad = 3, w = Math.ceil(size * d) + 2 * pad, h = Math.ceil(size * aspect * d) + 2 * pad, c = new OffscreenCanvas(w, h), g = c.getContext('2d');
  const s = size * d, x0 = pad, y0 = pad, H = s * aspect;
  g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineJoin = 'miter';
  // the stone's face: four corners, each a little off square (a lean), one or two knocked off
  const j = () => (r() - .5) * 2 * .012 * s * worn, C = [[x0 + j(), y0 + j()], [x0 + s + j(), y0 + j()], [x0 + s + j(), y0 + H + j()], [x0 + j(), y0 + H + j()]];
  const face = () => { g.beginPath(); C.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
  const letters = () => { const chars = [...text], n = chars.length, cols = n > 2 || aspect > 1.15 ? Math.min(n, n > 2 ? 2 : 1) : n, rows = Math.ceil(n / cols), cw = (s * fill) / cols, ch = (H * fill) / rows, fs = Math.min(cw * 1.25, ch * 1.02);
    g.font = font.replace('{s}', fs.toFixed(2)); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    // (a carver opens a hairline a little: at a small size the serifs stay cut)
    g.lineWidth = Math.max(.9, Math.min(2.2, 1.6 - fs * .002)) * (kind === 'zhuwen' ? 0 : 1);
    chars.forEach((t, i) => { const col = i % cols, row = i / cols | 0, m = g.measureText(t), cy = y0 + H * (1 - fill) / 2 + ch * (row + .5), ascent = m.actualBoundingBoxAscent, X = x0 + s * (1 - fill) / 2 + cw * (col + .5), Y = cy + ascent / 2;
      g.fillText(t, X, Y); if (g.lineWidth) g.strokeText(t, X, Y); }); };
  if (kind === 'zhuwen') { g.lineWidth = s * ring; g.strokeRect(x0 + s * ring * .55, y0 + s * ring * .55, s * (1 - ring * 1.1), H - s * ring * 1.1); letters(); }
  else { face(); g.fill(); g.globalCompositeOperation = 'destination-out'; letters(); }
  if (worn) { g.globalCompositeOperation = 'destination-out';
    // a corner knocked off (most stones have one), sometimes two
    for (let k = 0, n = r() < .35 ? 2 : 1; k < n; k++) { const i = (r() * 4) | 0, p = C[i], a = C[(i + 1) % 4], b = C[(i + 3) % 4], e1 = s * (.025 + .045 * r()) * worn, e2 = e1 * (.6 + .8 * r()), ux = (a[0] - p[0]) / s, uy = (a[1] - p[1]) / s, vx = (b[0] - p[0]) / H, vy = (b[1] - p[1]) / H;
      g.beginPath(); g.moveTo(p[0] - ux * 2 - vx * 2, p[1] - uy * 2 - vy * 2); g.lineTo(p[0] + ux * e1, p[1] + uy * e1); g.lineTo(p[0] + vx * e2, p[1] + vy * e2); g.closePath(); g.fill(); }
    // two or three chips bitten from the edge: small, sharp-edged
    for (let k = 0, n = 2 + (r() < .5 ? 1 : 0); k < n; k++) { const i = (r() * 4) | 0, A = C[i], B = C[(i + 1) % 4], t = .12 + .76 * r(), px = A[0] + (B[0] - A[0]) * t, py = A[1] + (B[1] - A[1]) * t, L = Math.hypot(B[0] - A[0], B[1] - A[1]);
      const tx = (B[0] - A[0]) / L, ty = (B[1] - A[1]) / L, nx = ty, ny = -tx, wd = s * (.025 + .04 * r()) * worn, dp = s * (.012 + .022 * r()) * worn, sk = (r() - .5) * wd * .8;
      g.beginPath(); g.moveTo(px - tx * wd / 2 + nx * 2, py - ty * wd / 2 + ny * 2); g.lineTo(px + tx * sk - nx * dp, py + ty * sk - ny * dp); g.lineTo(px + tx * (sk + wd * .25) - nx * dp * .55, py + ty * (sk + wd * .25) - ny * dp * .55); g.lineTo(px + tx * wd / 2 + nx * 2, py + ty * wd / 2 + ny * 2); g.closePath(); g.fill(); } }
  g.globalCompositeOperation = 'source-over';
  const src = g.getImageData(0, 0, w, h).data, out = new Uint8Array(w * h * 4);
  // the knife: the cut edges a little off true, slowly; the stone's face: a tilt and a slow curvature in the press, a side
  // or a corner starved, a faint lighter patch; the paste's slow unevenness
  const wx = noise2(seed * 3 + 1), wy = noise2(seed * 3 + 2), fib = noise2(seed * 3 + 5), amp = Math.max(.5, s * .006), sc = s / 6;
  const ang = r() * 6.283, ax = Math.cos(ang), ay = Math.sin(ang), curv = .4 + .8 * r(), at = (x, y) => { x = cl(Math.round(x), 0, w - 1); y = cl(Math.round(y), 0, h - 1); return src[(y * w + x) * 4 + 3] / 255; };
  const st = r() < .5 ? { corner: (r() * 4) | 0 } : { side: (r() * 4) | 0 }, stK = worn * (.35 + .25 * r()), pc = [x0 + s * (.25 + .5 * r()), y0 + H * (.25 + .5 * r())], pr0 = s * (.14 + .1 * r()), pk = worn * (.1 + .1 * r());
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (wx(x / sc, y / sc) - .5) * 2 * amp, dy = (wy(x / sc, y / sc) - .5) * 2 * amp;
    const fx = x + dx, fy = y + dy, xi = Math.floor(fx), yi = Math.floor(fy), tx = fx - xi, ty = fy - yi;
    const m = at(xi, yi) * (1 - tx) * (1 - ty) + at(xi + 1, yi) * tx * (1 - ty) + at(xi, yi + 1) * (1 - tx) * ty + at(xi + 1, yi + 1) * tx * ty; if (m <= .01) continue;
    const u = (x - w / 2) / s, v = (y - h / 2) / H;
    let pr = .74 + .4 * (u * ax + v * ay) - .22 * curv * (u * u + v * v) + .16 * (fib(x / (s * .5), y / (s * .35)) - .5);
    if (worn) { const dS = st.corner != null ? Math.hypot(x - C[st.corner][0], y - C[st.corner][1]) / s : [y - y0, x0 + s - x, y0 + H - y, x - x0][st.side] / s;
      pr *= 1 - stK * (1 - sm(0, st.corner != null ? .45 : .3, dS));
      pr *= 1 - pk * Math.exp(-((x - pc[0]) ** 2 + (y - pc[1]) ** 2) / (pr0 * pr0)); }
    const cov = m * sm(.04, .28, pr), ink = cl(.25 + 1.0 * pr, .15, 1.5);
    const q = (y * w + x) * 4; out[q] = Math.round(cl(cov) * 255); out[q + 1] = Math.round(cl(ink / 2) * 255); out[q + 3] = 255;
  }
  return { data: out, w, h, ang: [ax, ay], pad };
}

// ---- the sheet -----------------------------------------------------------------------------------------------------------
const sheets = {};
function sheet(slot, w, h, d) {
  slot += '@' + d; let s = sheets[slot];
  if (s && !s.Md.gl.isContextLost()) { if (s.cv.width < w || s.cv.height < h) { s.Md.resize(Math.max(w, s.cv.width), Math.max(h, s.cv.height)); s.Md.settings.over = true; } return s; }
  const cv = document.createElement('canvas'); cv.width = Math.max(w, 512); cv.height = Math.max(h, 512);
  const Md = createMedium(cv, { dpr: d, paper: [255, 255, 255], rough: .5 }); Md.settings.over = true;
  return sheets[slot] = { cv, Md };
}
const meets = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const quad = [[0, 0], [0, 0], [0, 0], [0, 0]], qa = [0, 0], qb = [0, 0];
function lay(Md, ops, from = 0, to = ops.length) { for (let k = from; k < to; k += REC) {
  for (let j = 0; j < 4; j++) { quad[j][0] = ops[k + 2 * j]; quad[j][1] = ops[k + 2 * j + 1]; }
  qa[0] = ops[k + 8]; qa[1] = ops[k + 9]; qb[0] = ops[k + 10]; qb[1] = ops[k + 11]; Md.sweep(quad, qa, qb, ops[k + 12], ops[k + 13], 0); } }
// a seal's or a letter's deposit in the engine's pour format (R coverage, G ink/2, B dryness 0), only the cells in `keep`
function pourOf(src, keep = null) { const o = new Uint8Array(src.length); for (let q = 0; q < src.length; q += 4) { if (keep && !keep(q >> 2)) continue; o[q] = src[q]; o[q + 1] = src[q + 1]; } return o; }

// the layer's medium settings: sumi levels and creeps a little (bleed); paste hardly moves and covers
const MEDIUM = { sumi: { wet: .3, base: .5 }, pale: { wet: .3, base: .5 }, seal: { wet: .05, base: .3 }, gold: { wet: .05, base: .3 }, shu: { wet: .3, base: .55 } };
const blend = (theme, ink) => theme === 'dark' || ink === 'seal' || ink === 'gold' ? 'source-over' : 'multiply';

// a glyph poured as one deposit of sumi: its coverage; a little more ink toward its rim, where a broad stroke's ink is drawn
// as it dries; a slow unevenness where the wet ink settled (Hakuin's raw paper: sd ~5 L on L 45, measured)
function deposit(m, d, { tone = 1, seed = 1, halo = .8 } = {}) {
  const { M, w, h } = m, r = Math.round(1.4 * d), Bl = boxBlur(boxBlur(M, w, h, r), w, h, r), mot = noise2(seed * 7 + 97), o = new Uint8Array(w * h * 4);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, c = M[q]; if (c <= .01) continue;
    const rim = Math.max(0, 1 - Bl[q]) * 1.6, ink = tone * (1 + .38 * rim * rim + .2 * (mot(i / d / 7, j / d / 7) - .5));
    o[q * 4] = Math.round(Math.min(1, c) * 255); o[q * 4 + 1] = Math.round(Math.min(1, ink / 2) * 255); }
  // the halo: the water and glue run out past the ink into the paper's fibre, unevenly (never a ring of one width)
  const H2 = boxBlur(boxBlur(M, w, h, Math.round(2.2 * d)), w, h, Math.round(2.2 * d)), hn = noise2(seed * 7 + 31);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i; if (M[q] > .5 || H2[q] < .02) continue;
    const a = Math.min(1, H2[q] * 2.2) * (.4 + .9 * hn(i / d / 5, j / d / 5)) * halo; if (a < .02) continue;
    const c0 = o[q * 4] / 255, cov = Math.max(c0, a * .55); o[q * 4] = Math.round(cov * 255); o[q * 4 + 1] = Math.max(o[q * 4 + 1], Math.round(Math.min(1, .16 * tone / 2) * 255)); }
  return o;
}

// The capital as ink rather than type: the glyph's own shape, read as the strokes a brush would write it in
// (sumi-letter.js strokes: only to know, for each part of the letter, which stroke it belongs to and how far along it),
// so the ink is densest where each stroke set down (a fresh load), spends along it, and near its end opens in a few
// white slits along its way (flying white, each a lens that opens and closes once); the outline a little off true (the
// brush's edge, slow), the halo uneven. T: the writing order, stroke by stroke along each stroke.
function warp(M, w, h, d, amp, scale, seed) {
  const wx = noise2(seed * 3 + 41), wy = noise2(seed * 3 + 43), o = new Float32Array(w * h), at = (x, y) => M[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const fx = i + (wx(i / scale, j / scale) - .5) * 2 * amp, fy = j + (wy(i / scale, j / scale) - .5) * 2 * amp, x = Math.floor(fx), y = Math.floor(fy), tx = fx - x, ty = fy - y;
    o[j * w + i] = at(x, y) * (1 - tx) * (1 - ty) + at(x + 1, y) * tx * (1 - ty) + at(x, y + 1) * (1 - tx) * ty + at(x + 1, y + 1) * tx * ty; }
  return o;
}
function inkGlyph(m0, d, G) {
  const { w, h } = m0, seed = G.seed ?? 1, tone = G.tone ?? 1, r = rng(seed * 11 + 5), M = warp(m0.M, w, h, d, Math.max(.6, .5 * d), G.cap * d / 5, seed);
  const L = glyphStrokes(G.ch, G.cap, G.face);   // (both masks put the ink box at their own pad)
  const offX = (6 - 2 / Math.max(1, 120 / G.cap)) * d, offY = (m0.base - L.base) * d;
  // each skeleton point: its stroke, how far along, its direction, its half-width
  const n = w * h, feat = new Uint8Array(n), fs = new Int16Array(n).fill(-1), fu = new Float32Array(n), ftx = new Float32Array(n), fty = new Float32Array(n), fr = new Float32Array(n);
  L.strokes.forEach((S, k) => { const P = resample(S.pts, .4 / d), N = P.length; let len = 0; const cum = [0]; for (let i = 1; i < N; i++) cum.push(len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    for (let i = 0; i < N; i++) { const x = Math.round(P[i][0] * d + offX), y = Math.round(P[i][1] * d + offY); if (x < 0 || y < 0 || x >= w || y >= h) continue; const q = y * w + x;
      const a = P[Math.max(0, i - 2)], b = P[Math.min(N - 1, i + 2)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; feat[q] = 1; fs[q] = k; fu[q] = cum[i] / (len || 1); ftx[q] = (b[0] - a[0]) / l; fty[q] = (b[1] - a[1]) / l;
      fr[q] = S.r[Math.min(S.r.length - 1, Math.round(i / Math.max(1, N - 1) * (S.r.length - 1)))] * d; } });
  const near = new Int32Array(n); dist(feat, w, h, near);
  // the slits: a few lanes across each long stroke, opening past ~60 % of its way
  // (narrow, and kept off the stroke's middle: at page size a slit must never read as the letter split in two)
  const slits = L.strokes.map(S => { const lanes = [], m = S.horiz && S.pts.length > 4 && Math.max(...S.r) * d > 6 ? 1 + (r() * 2 | 0) : 0;
    for (let j = 0; j < m; j++) lanes.push({ a: (r() < .5 ? -1 : 1) * (.45 + .3 * r()), u0: .6 + .25 * r(), len: .2 + .3 * r(), hw: .025 + .035 * r() }); return lanes; });
  const ns = L.strokes.length || 1, Bl = boxBlur(boxBlur(M, w, h, Math.round(1.4 * d)), w, h, Math.round(1.4 * d)), mot = noise2(seed * 7 + 97), o = new Uint8Array(n * 4), T = new Float32Array(n).fill(1);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i; let c = M[q]; if (c <= .01) continue;
    const f = near[q], k = fs[f], u = fu[f]; T[q] = k < 0 ? 1 : (k + u) / ns;
    if (k >= 0 && fr[f] > 0) { const across = ((i - f % w) * fty[f] - (j - (f / w | 0)) * ftx[f]) / fr[f];
      for (const s of slits[k]) { if (u < s.u0) continue; const v = (u - s.u0) / s.len, op = v >= 1 ? (s.u0 + s.len > 1 ? 1 : 0) : Math.sin(Math.PI * Math.min(.5, v / 2) * 2) ** .7;
        if (op <= 0) continue; const hw = s.hw * op, dd = Math.abs(across - s.a); if (dd < hw + .08) c *= sm(hw * .55, hw + .08, dd); } }
    const rim = Math.max(0, 1 - Bl[q]) * 1.6, ink = tone * ((k < 0 ? 1 : 1.16 - .34 * u ** 1.3) + .3 * rim * rim + .16 * (mot(i / d / 7, j / d / 7) - .5));
    o[q * 4] = Math.round(cl(c) * 255); o[q * 4 + 1] = Math.round(cl(ink / 2) * 255); }
  // the halo: water and glue past the ink, wider where the stroke set down, uneven
  const H2 = boxBlur(boxBlur(M, w, h, Math.round(2.4 * d)), w, h, Math.round(2.4 * d)), hn = noise2(seed * 7 + 31);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i; if (M[q] > .5 || H2[q] < .02) continue; const f = near[q], u = fs[f] >= 0 ? fu[f] : .5;
    const a = Math.min(1, H2[q] * 2.2) * (.35 + .9 * hn(i / d / 5, j / d / 5)) * (1.15 - .7 * u) * (G.halo ?? .9); if (a < .02) continue;
    o[q * 4] = Math.max(o[q * 4], Math.round(Math.min(1, a * .55) * 255)); o[q * 4 + 1] = Math.max(o[q * 4 + 1], Math.round(.08 * tone * 255)); T[q] = Math.min(1, T[f] + .01); }
  return { data: o, T };
}

// a piece from layers drawn in anchor coordinates: its extent found, everything moved so its box starts at 0, and `at`
// where that box sits from the anchor
export function make(layers, pad = 8) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; const grow = (x, y, m = 0) => { x0 = Math.min(x0, x - m); y0 = Math.min(y0, y - m); x1 = Math.max(x1, x + m); y1 = Math.max(y1, y + m); };
  for (const L of layers) { if (L.strokes) for (const S of L.strokes) for (const p of S.pts) grow(p[0], p[1], S.w * .7);
    for (const B of [L.seal && { x: L.seal.x, y: L.seal.y, w: L.seal.size, h: L.seal.size * (L.seal.aspect ?? 1) }, L.glyph && L.glyph.box, L.reserve && L.reserve.box].filter(Boolean)) { grow(B.x, B.y); grow(B.x + B.w, B.y + B.h); } }
  const mv = o => o && { ...o, x: o.x - x0, y: o.y - y0 };
  const out = layers.map(L => ({ ...L, strokes: L.strokes?.map(S => ({ ...S, pts: S.pts.map(([x, y]) => [x - x0, y - y0]) })), seal: mv(L.seal), glyph: mv(L.glyph), reserve: mv(L.reserve) }));
  return { W: Math.max(1, x1 - x0), H: Math.max(1, y1 - y0), at: [x0, y0], layers: out, pad };
}

// the program: each layer's strokes timed one after another (the brush lifts and travels between them), then the seal
export function plan(piece, d, pad) {
  let t = 0; const layers = [], sh = p => p.map(([x, y]) => [x + pad, y + pad]);
  for (const L of piece.layers) {
    const strokes = [];
    if (L.seal) { const { x, y, size } = L.seal, m = sealMask(size, d, L.seal), dur = L.seal.dur ?? 240; t += L.seal.wait ?? 260;
      strokes.push({ seal: m, rect: [Math.round((x + pad) * d), Math.round((y + pad) * d), m.w, m.h], t0: t, t1: t + dur }); t += dur; }
    else if (L.glyph?.ink) { const G = L.glyph, m = glyphMask(G.ch, G.cap, G.face, d), { data, T } = inkGlyph(m, d, G); t += G.wait ?? 0;
      strokes.push({ pourL: { data, w: m.w, h: m.h, T }, rect: [(G.x + pad) * d, (G.y + pad) * d, m.w, m.h], t0: t, t1: t + (G.dur ?? 1400) }); t += G.dur ?? 1400; }
    else if (L.glyph) { const G = L.glyph, m = glyphMask(G.ch, G.cap, G.face, d), Lm = { M: m.M, w: m.w, h: m.h, res: d }, { T } = letterOrder(Lm); t += G.wait ?? 0;
      { const n = T.length, feat = new Uint8Array(n), near = new Int32Array(n); for (let q = 0; q < n; q++) feat[q] = m.M[q] > .5 ? 1 : 0; dist(feat, m.w, m.h, near);
        for (let q = 0; q < n; q++) if (!(m.M[q] > .5)) T[q] = Math.min(1, T[near[q]] + .015); }   // (the halo spreads from the ink beside it, just after it)
      strokes.push({ pourL: { data: deposit(m, d, G), w: m.w, h: m.h, T }, rect: [(G.x + pad) * d, (G.y + pad) * d, m.w, m.h], t0: t, t1: t + (G.dur ?? 1400) }); t += G.dur ?? 1400; }
    else for (const S of L.strokes) { t += S.wait ?? 110; const b = brush({ ...S, pts: sh(S.pts) }, d, t, { noHalo: L.noHalo }); strokes.push({ ops: b.ops, t0: t, t1: b.t1, bb: b.bb }); t = b.t1; }
    const res = L.reserve && (() => { const R = L.reserve, m = glyphMask(R.ch, R.cap, R.face, d), c = new OffscreenCanvas(m.w, m.h), g = c.getContext('2d'), im = g.createImageData(m.w, m.h);
      // (the paper kept where the brush went round the letter: its edge a little off true, as a brush leaves it)
      const M = R.warp ? warp(m.M, m.w, m.h, d, Math.max(.6, .55 * d), R.cap * d / 5, R.seed ?? 1) : m.M;
      for (let i = 0; i < m.w * m.h; i++) im.data[i * 4 + 3] = Math.round(Math.min(1, M[i]) * 255); g.putImageData(im, 0, 0); return { c, x: Math.round((R.x + pad) * d), y: Math.round((R.y + pad) * d) }; })();
    layers.push({ ink: L.ink ?? 'sumi', strokes, t0: strokes[0]?.t0 ?? t, t1: t, wet: L.wet, base: L.base, reserve: res, merge: L.merge });
  }
  return { layers, dur: t };
}

function prepare(piece, { dpr, zoom = 1 }) {
  const d = dpr * zoom, pad = piece.pad ?? 8, cw = Math.ceil((piece.W + 2 * pad) * d), ch = Math.ceil((piece.H + 2 * pad) * d);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; cv.style.width = (piece.W + 2 * pad) * zoom + 'px'; cv.style.height = (piece.H + 2 * pad) * zoom + 'px';
  cv.style.margin = `${-pad * zoom}px`; cv.setAttribute('aria-hidden', 'true');
  return { cv, d, pad, cw, ch };
}
const begin = (Md, L, theme, cw, ch) => { const m = MEDIUM[L.ink] ?? MEDIUM.sumi; Md.clear(); Md.wetness(L.wet ?? m.wet); Md.settings.ink = (INKS[L.ink] ?? INKS.sumi)[theme]; Md.settings.base = L.base ?? m.base; Md.makePaper([0, 0], [0, 0, cw, ch]); };

// a layer onto the piece: a reserve (a letter kept as paper) cut out of it first
let tmp = null;
function put(g, mc, L, theme, cw, ch) {
  let src = mc;
  if (L.reserve) { if (!tmp || tmp.width < cw || tmp.height < ch) tmp = new OffscreenCanvas(Math.max(cw, tmp?.width ?? 0), Math.max(ch, tmp?.height ?? 0)); const t = tmp.getContext('2d');
    t.globalCompositeOperation = 'copy'; t.drawImage(mc, 0, 0, cw, ch, 0, 0, cw, ch); t.globalCompositeOperation = 'destination-out'; t.drawImage(L.reserve.c, L.reserve.x, L.reserve.y); src = tmp; }
  g.globalCompositeOperation = blend(theme, L.ink); g.drawImage(src, 0, 0, cw, ch, 0, 0, cw, ch);
}
// a still: every layer laid, settled and pressed onto the piece's canvas
export const STAT = { ops: 0, steps: 0 };
export function print(piece, theme, { dpr = Math.min(2, devicePixelRatio || 1), zoom = 1 } = {}) {
  const { cv, d, pad, cw, ch } = prepare(piece, { dpr, zoom }); if (!supported()) return cv;
  const prog = plan(piece, d, pad), g = cv.getContext('2d'), { cv: mc, Md } = sheet('still', cw, ch, d);
  for (const L of prog.layers) {
    begin(Md, L, theme, cw, ch); let pend = [], last = L.t0;
    for (const S of L.strokes) {
      if (S.seal) { Md.pour(pourOf(S.seal.data), S.seal.w, S.seal.h, S.rect); continue; }
      if (S.pourL) { Md.pour(pourOf(S.pourL.data), S.pourL.w, S.pourL.h, S.rect); continue; }
      if (!L.merge && pend.some(b => meets(b, S.bb))) { Md.step(Math.min(3000, S.t0 - last)); STAT.steps++; last = S.t0; pend = []; }
      lay(Md, S.ops); STAT.ops += S.ops.length / REC; pend.push(S.bb); }
    Md.step(16); Md.finish(true); Md.render([0, 0, cw, ch]); put(g, mc, L, theme, cw, ch);
  }
  return cv;
}

// The piece written as you watch, at the brush's own pace: each stroke's sweeps laid at their moment, so the ink grows
// along the path in stroke order (with its halo, dried); a seal rolls on from its fullest corner; a letter poured along its
// skeleton's order. at(f), f 0..1 of dur (ms, the hand's own time: never quickened beyond `max` seconds).
export function writer(piece, theme, { dpr = Math.min(2, devicePixelRatio || 1), zoom = 1, slot = 'live', max = 9 } = {}) {
  const { cv, d, pad, cw, ch } = prepare(piece, { dpr, zoom }), g = cv.getContext('2d');
  if (!supported()) return { cv, dur: 0, at() {}, done() {} };
  const prog = plan(piece, d, pad), dur = Math.min(max * 1000, prog.dur), k = prog.dur / Math.max(1, dur);
  const base = new OffscreenCanvas(cw, ch), bg = base.getContext('2d');
  let li = -1, si = 0, oi = 0, pend = [], last = 0, prevT = 0, Md = null, mc = null, part = null;
  const open = i => { li = i; si = oi = 0; pend = []; part = null; const L = prog.layers[i]; last = L.t0; ({ cv: mc, Md } = sheet(slot, cw, ch, d)); begin(Md, L, theme, cw, ch); };
  const show = () => { Md.render([0, 0, cw, ch]); g.clearRect(0, 0, cw, ch); g.globalCompositeOperation = 'source-over'; g.drawImage(base, 0, 0);
    put(g, mc, prog.layers[li], theme, cw, ch); };
  const close = () => { Md.step(16); Md.finish(); show(); bg.clearRect(0, 0, cw, ch); bg.drawImage(cv, 0, 0); };
  // a seal's or letter's pour up to u (0..1) of its order
  const pourTo = (S, u) => { const src = S.seal ? S.seal.data : S.pourL.data, w = S.seal ? S.seal.w : S.pourL.w, h = S.seal ? S.seal.h : S.pourL.h;
    if (!part) { const n = w * h, key = new Float32Array(n);
      if (S.seal) { const [ax, ay] = S.seal.ang; for (let q = 0; q < n; q++) key[q] = -((q % w) / w * ax + (q / w | 0) / h * ay); }   // (from the fullest corner across the face)
      else for (let q = 0; q < n; q++) key[q] = S.pourL.T[q];
      let lo = Infinity, hi = -Infinity; for (let q = 0; q < n; q++) if (src[q * 4]) { lo = Math.min(lo, key[q]); hi = Math.max(hi, key[q]); }
      part = { key, lo, hi, at: -Infinity }; }
    const span = part.hi - part.lo + 1e-6, band = S.seal ? .18 * span : 0, cut = part.lo - band + (span + band) * u; if (cut <= part.at) return; part.at = cut;
    // (a seal's front is soft: the stone meets the paper over a band as it rocks, not along a knife's line)
    const o = pourOf(src, q => part.key[q] <= cut); if (band) for (let q = 0; q < w * h; q++) if (o[q * 4]) o[q * 4] = Math.round(o[q * 4] * Math.min(1, (cut - part.key[q]) / band));
    Md.pour(o, w, h, S.rect); };
  function at(f) {
    const T = Math.max(0, f) * dur * k; if (li < 0) open(0);
    for (;;) { const L = prog.layers[li];
      while (si < L.strokes.length && L.strokes[si].t0 <= T) { const S = L.strokes[si];
        if (S.seal || S.pourL) { const u = cl((T - S.t0) / (S.t1 - S.t0)); pourTo(S, u); if (u < 1) break; si++; part = null; continue; }
        if (oi === 0 && !L.merge && pend.some(b => meets(b, S.bb))) { Md.step(Math.min(3000, S.t0 - last)); last = S.t0; pend = []; }
        let o2 = oi; while (o2 < S.ops.length && S.ops[o2 + 15] <= T) o2 += REC; lay(Md, S.ops, oi, o2); oi = o2;
        if (oi < S.ops.length) break; pend.push(S.bb); si++; oi = 0; }
      if (si >= L.strokes.length && li < prog.layers.length - 1 && prog.layers[li + 1].t0 <= T) { close(); open(li + 1); continue; }
      break; }
    Md.step(Math.max(1, Math.min(50, (T - prevT) / k))); prevT = T; show();
  }
  return { cv, dur, at, done() { at(1 + 1e-9); close(); } };
}
