// Nouveau's plants, drawn from Grasset's La plante et ses applications ornementales (1896: the iris, pl. 1–2; the poppy,
// pl. 4) and the seed heads of the Combinaisons ornementales (1901, pl. 30) — research/19-nouveau.md. Every organ is
// built round its own axis (a curve from base to tip) with each half its own width, so a petal is never symmetric, its
// shaded half can be laid as a second tint (as Grasset's printer laid a darker stone on the side turned from the light),
// and its veins and folds are lines that follow the axis. Edges frill where Grasset frills them (the iris falls'
// turnover, the poppy's crumpled rim). Iris blades twist to show their back. Each is varied by the seed, so no two match.
// Shapes go into a Plate (nouveau-print.js) as inks: the fill, its shade, the veins, and the key line with a hand
// (nouveau-line.js contour: heavier on the shadow side, fine at tips, lifting off in the light).
//   organ(o) -> { loop, halves: [L, R], axis, at(t, f) }   iris(P, at, s, a, r, o)   poppy(P, at, s, a, r, o)
//   bud(P, at, s, a, r, o)   blade(P, axisCp, W, r, o)   umbel(P, node, dir, len, r, o)   stem(P, pts, o)
import { bspline, closed, even, stroke, path, shape, contour, lay, rotp } from './nouveau-line.js';

// ---- an organ round its axis -------------------------------------------------------------------------------------------
// axisCp: control points base -> tip; W: half-width at its widest; ea, eb: how it swells from the base and closes to the
// tip (eb < .5: a round end, a spoon; > 1: drawn to a point); asym: the right half's width over the left's; frill: { amp,
// n, from } a crinkle along the outer part of the edge (amp px, n waves along the whole edge, from t)
export function organ({ axisCp, W, ea = .6, eb = 1, asym = 1, frill = null, r = Math.random, n = 40 }) {
  const sp = bspline(axisCp, 24); let len = 0; for (let i = 1; i < sp.length; i++) len += Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]);
  const ax = even(sp, Math.max(.05, Math.min(1, len / 8))); const m = ax.length; if (m < 3) return null;
  const mx = Math.pow(ea / (ea + eb), ea) * Math.pow(eb / (ea + eb), eb), N = [], wl = [], wr = [];
  for (let i = 0; i < m; i++) { const a = ax[Math.max(0, i - 1)], b = ax[Math.min(m - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; N.push([-dy / l, dx / l]);
    const t = i / (m - 1), base = W * Math.pow(Math.max(t, .015), ea) * Math.pow(Math.max(1 - t, 0), eb) / mx; wl.push(base); wr.push(base * asym); }
  const ph = r() * 6.3, side = (wv, sgn) => ax.map((p, i) => { const t = i / (m - 1); let w = wv[i];
    if (frill && t > frill.from) w += frill.amp * Math.sin(t * frill.n * Math.PI + ph + sgn) * Math.min(1, (t - frill.from) / .12) * (1 - t * t * .3);
    return [p[0] + sgn * N[i][0] * w, p[1] + sgn * N[i][1] * w]; });
  const L = side(wl, 1), R = side(wr, -1);
  const loop = [...L, ...R.slice().reverse().slice(1, -1)];
  // a point at fraction f of the half-width (f > 0 left, < 0 right) at t along the axis
  const at = (t, f) => { const i = Math.max(0, Math.min(m - 1, Math.round(t * (m - 1)))), w = f > 0 ? wl[i] : wr[i]; return [ax[i][0] + N[i][0] * f * w, ax[i][1] + N[i][1] * f * w]; };
  return { loop, halves: [[...L, ...ax.slice().reverse()], [...R, ...ax.slice().reverse()]], axis: ax, at, W };
}
// the key line round a shape, with its hand
const KEY = (P, loop, w, o = {}) => P.line(contour(loop, { w, lo: o.lo ?? .3, lift: o.lift ?? .35, inset: .35, tip: 1.8 }), { ...(o.cut ? { cut: o.cut } : {}), at: o.at ?? loop[0], reach: o.reach });
// a vein: a fine line along the organ from t0 to t1 at fraction f of its half-width, fading at both ends
function vein(P, O, t0, t1, f, w, col, cut) {
  const pts = []; for (let k = 0; k <= 16; k++) pts.push(O.at(t0 + (t1 - t0) * k / 16, f * (1 - .25 * k / 16)));
  const S = stroke(pts, { hair: w, a: { kind: 'taper', len: (t1 - t0) * O.axis.length * .25 }, b: { kind: 'taper', len: (t1 - t0) * O.axis.length * .45 } }); P.fill(col, path(S), { knock: false, cut, S });
}
// a filled organ: its colour, its shaded half in the darker tint, its veins, its key
function lay3(P, O, ink, shade, kw, o = {}) {
  if (!O) return;   // (an organ too small to have a shape at this size is left out)
  const at = O.axis[0], reach = O.loop.reduce((m, p) => Math.max(m, Math.hypot(p[0] - at[0], p[1] - at[1])), 0) + 2;
  P.fill(ink, shape(O.loop), { cut: o.cut, at, reach });
  if (shade) P.fill(shade, shape(O.halves[o.shadeSide ?? 1]), { knock: false, cut: o.cut, trap: 0, at, reach });
  for (const v of o.veins ?? []) vein(P, O, v[0], v[1], v[2], kw * (v[3] ?? .32), o.veinInk ?? shade ?? 'k', o.cut);
  KEY(P, O.loop, kw, { ...o, at, reach });
}
const J = (r, a) => (r() - .5) * 2 * a;

// ---- the iris (Grasset pl. 1: Spanish and English irises) ---------------------------------------------------------------
// Three standards upright and narrow, cupped, palest; three falls thrown out and down, each with its haft, its blade
// drooping and its frilled turnover, a gold signal down its middle and dark veins along it; a green spathe at the foot.
// Frame: base at `at`, axis heading a (radians; -PI/2 is up), s the flower's height.
export function iris(P, at, s, a, r, o = {}) {
  const k = o.kw ?? Math.max(.6, s * .012), cut = o.cut, T = (x, y) => { const [u, v] = rotp([y * s, x * s], a); return [at[0] + u, at[1] + v]; };   // x across, y along the axis (up)
  // the standards: the two at the sides behind, then the one in front
  for (const m of [-1, 1]) { const lean = m * (.42 + J(r, .08));
    const O = organ({ axisCp: [T(0, .08), T(m * .08, .4), T(m * (.16 + J(r, .03)), .72 + J(r, .05)), T(m * (.2 + lean * .1), .95 + J(r, .06))], W: s * (.075 + J(r, .01)), ea: .9, eb: .55, asym: .8 + r() * .3, frill: { amp: s * .008, n: 9, from: .55 }, r });
    lay3(P, O, 'irisL', 'irisLD', k, { cut, veins: [[.15, .8, 0, .4]], shadeSide: m > 0 ? 1 : 0 }); }
  const S = organ({ axisCp: [T(0, .08), T(J(r, .03), .45), T(J(r, .05), .8), T(J(r, .06), 1)], W: s * (.085 + J(r, .01)), ea: .9, eb: .5, asym: .85 + r() * .3, frill: { amp: s * .008, n: 10, from: .5 }, r });
  lay3(P, S, 'irisL', 'irisLD', k, { cut, veins: [[.12, .85, 0, .45], [.2, .7, .5], [.2, .7, -.5]] });
  // the falls: out along the haft, then down; the far one first
  for (const m of [1, -1]) { const d = .5 + J(r, .08), reach = .46 + J(r, .05);
    const O = organ({ axisCp: [T(0, .12), T(m * .1, .17), T(m * reach * .55, .12), T(m * reach * .8, -.06), T(m * reach * .88, -.26 - d * .12), T(m * reach * .8, -.42 - d * .2)], W: s * (.16 + J(r, .015)), ea: 1.7, eb: .5, asym: .75 + r() * .4, frill: { amp: s * .016, n: 16, from: .55 }, r });
    lay3(P, O, 'iris', 'irisD', k, { cut, veins: [[.3, .92, .45], [.3, .95, 0, .4], [.3, .9, -.45], [.45, .85, .8, .25], [.45, .85, -.8, .25]], shadeSide: m > 0 ? 0 : 1 });
    // the signal: a gold streak down the haft
    const sig = []; for (let i = 0; i <= 12; i++) sig.push(O.at(.08 + .5 * i / 12, .05));
    P.fill('beard', path(stroke(sig, { hair: s * .012, a: { kind: 'point', len: s * .12, fat: s * .022 }, b: { kind: 'taper', len: s * .15 } })), { cut });
  }
  // the front fall, hanging toward us, foreshortened, in front of the haft
  { const F = organ({ axisCp: [T(0, .12), T(J(r, .03), .04), T(J(r, .05), -.14), T(J(r, .06), -.3)], W: s * (.1 + J(r, .01)), ea: 1, eb: .45, asym: .8 + r() * .4, frill: { amp: s * .01, n: 12, from: .55 }, r });
    lay3(P, F, 'iris', 'irisD', k, { cut, veins: [[.25, .9, .4], [.25, .92, 0, .4], [.25, .9, -.4]], shadeSide: 1 });
    const sig = []; for (let i = 0; i <= 10; i++) sig.push(F.at(.05 + .45 * i / 10, 0));
    P.fill('beard', path(stroke(sig, { hair: s * .011, a: { kind: 'point', len: s * .08, fat: s * .02 }, b: { kind: 'taper', len: s * .1 } })), { cut }); }
  // the spathe: two green bracts wrapping the foot, one fold line each
  for (const m of [-1, 1]) { const O = organ({ axisCp: [T(m * .02, -.28), T(m * .05, -.12), T(m * (.02 + J(r, .02)), .12)], W: s * .045, ea: .8, eb: 1.3, asym: .7 + r() * .3, r });
    lay3(P, O, 'leaf', 'leafD', k * .9, { cut, veins: [[.2, .85, 0, .35]] }); }
}

// ---- the poppy (Grasset pl. 4; Mucha's friezes) ---------------------------------------------------------------------------
// A cup seen from the side: two broad petals behind, two in front overlapping, crumpled at the rim; a dark blotch at each
// petal's base, fine folds running up from it; the seed capsule's crown above the cup.
export function poppy(P, at, s, a, r, o = {}) {
  // seen three-quarters from above, so it reads as a poppy at any size: four broad petals round the cup, crumpled at the
  // rim, each with its dark blotch at the base; the seed capsule in the middle with its rayed crown. The flower's plane is
  // tilted toward us (its depth foreshortened by .62), the far petals laid first.
  const k = o.kw ?? Math.max(.6, s * .014), cut = o.cut, fs = .62, tilt = a + Math.PI / 2;
  const T = (u, v) => { const [x, y] = rotp([u * s, v * s * fs], tilt); return [at[0] + x, at[1] + y]; };
  const th0 = r() * .5 - .25 + Math.PI / 4, pet = [0, 1, 2, 3].map(i => th0 + i * Math.PI / 2 + J(r, .12)).sort((p, q) => Math.sin(p) - Math.sin(q));
  for (const th of pet) { const L = .5 + J(r, .05), dd = J(r, .25);
    const cp = [[0, 0], [Math.cos(th + dd * .3) * L * .35, Math.sin(th + dd * .3) * L * .35], [Math.cos(th + dd * .2) * L * .75, Math.sin(th + dd * .2) * L * .75], [Math.cos(th) * L, Math.sin(th) * L]].map(([u, v]) => T(u, v));
    const O = organ({ axisCp: cp, W: s * (.3 + J(r, .02)), ea: .5, eb: .34, asym: .9 + r() * .2, frill: { amp: s * .008, n: 11, from: .55 }, r });
    lay3(P, O, 'poppy', 'poppyD', k, { cut, shadeSide: Math.cos(th) > 0 ? 1 : 0, veins: [[.32, .9, .45, .26], [.3, .92, 0, .26], [.32, .9, -.45, .26]] });
    const bl = organ({ axisCp: [cp[0], cp[1], [cp[0][0] + (cp[2][0] - cp[0][0]) * .55, cp[0][1] + (cp[2][1] - cp[0][1]) * .55]], W: s * .12, ea: .5, eb: .8, r });
    if (bl) P.fill('poppyB', shape(bl.loop), { knock: false, cut, trap: 0 }); }
  // the capsule: a green dome, its crown a flat disc with dark rays
  const cap = []; for (let i = 0; i < 36; i++) { const t = i / 36 * Math.PI * 2; cap.push(T(Math.cos(t) * .11, Math.sin(t) * .11 - .02)); }
  P.fill('crown', shape(cap), { cut }); KEY(P, cap, k * .8, { lift: .2, cut });
  for (let i = 0; i < 9; i++) { const t = i / 9 * Math.PI * 2 + th0; P.fill('k', path(stroke([T(Math.cos(t) * .02, Math.sin(t) * .02 - .02), T(Math.cos(t) * .095, Math.sin(t) * .095 - .02)], { hair: k * .22, a: { kind: 'taper', len: s * .02 } })), { knock: false, cut }); }
}
// a nodding bud: an egg in two hairy sepals, the seam between them; or (kind 'iris') a furled iris in its spathe
export function bud(P, at, s, a, r, o = {}) {
  const k = o.kw ?? Math.max(.6, s * .03), cut = o.cut, T = (x, y) => { const [u, v] = rotp([y * s, x * s], a); return [at[0] + u, at[1] + v]; };
  if (o.kind === 'iris') {
    const pet = organ({ axisCp: [T(0, 0), T(J(r, .04), .5), T(J(r, .06), 1.05)], W: s * .11, ea: .7, eb: 1.4, asym: .8 + r() * .3, r });
    lay3(P, pet, 'iris', 'irisD', k, { cut, veins: [[.3, .9, .3], [.3, .9, -.3]] });
    const sp = organ({ axisCp: [T(-.02, -.08), T(.03, .3), T(.02 + J(r, .03), .62)], W: s * .1, ea: .8, eb: 1.2, asym: .7, r });
    lay3(P, sp, 'leaf', 'leafD', k, { cut, veins: [[.2, .9, 0, .3]] }); return; }
  const pk = organ({ axisCp: [T(0, .2), T(J(r, .02), .6), T(0, 1.02)], W: s * .08, ea: .6, eb: .8, r }); if (pk) P.fill('poppy', shape(pk.loop), { cut });   // the petals showing at the seam
  for (const m of [-1, 1]) { const O = organ({ axisCp: [T(m * .02, 0), T(m * .22, .3), T(m * .16, .78), T(m * .015, 1)], W: s * .15, ea: .7, eb: .7, asym: .7 + r() * .2, r });
    lay3(P, O, 'leaf', 'leafD', k, { cut, shadeSide: m > 0 ? 0 : 1 }); }
  P.fill('k', path(stroke([T(0, .06), T(J(r, .03), .5), T(0, .97)], { hair: k * .3, a: { kind: 'taper', len: s * .15 }, b: { kind: 'taper', len: s * .2 } })), { knock: false, cut });
}

// ---- leaves ------------------------------------------------------------------------------------------------------------------
// An iris blade: a long sword with parallel veins; if twist (0..1, where along it) it turns over there, narrowing to its
// edge and opening again with its back to us (the back a paler tint), and the tip may bow over.
export function blade(P, axisCp, W, r, o = {}) {
  const k = o.kw ?? Math.max(.6, W * .18), cut = o.cut, ax = even(bspline(axisCp, 24), 1), m = ax.length, tw = o.twist;
  const N = ax.map((_, i) => { const a = ax[Math.max(0, i - 1)], b = ax[Math.min(m - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
  const env = t => Math.pow(Math.max(t, .01), .45) * Math.pow(1 - t, .9) / .55;
  // signed width: through the twist the blade's two edges cross, so its outline is two pieces
  const sw = ax.map((_, i) => { const t = i / (m - 1); let w = W * env(t); if (tw != null) w *= Math.cos(Math.max(0, Math.min(1, (t - tw + .08) / .16)) * Math.PI); return w; });
  const cross = tw != null ? Math.round(tw * (m - 1)) : m;
  const piece = (i0, i1, ink, sh) => { if (i1 - i0 < 3) return; const L = [], R = [];
    for (let i = i0; i <= i1; i++) { const w = Math.abs(sw[i]) * (i === i0 && i0 > 0 ? 0 : 1); L.push([ax[i][0] + N[i][0] * w, ax[i][1] + N[i][1] * w]); R.push([ax[i][0] - N[i][0] * w * .85, ax[i][1] - N[i][1] * w * .85]); }
    const loop = [...L, ...R.reverse().slice(1, -1)];
    const reach = loop.reduce((m, p) => Math.max(m, Math.hypot(p[0] - ax[i0][0], p[1] - ax[i0][1])), 0) + 2;
    P.fill(ink, shape(loop), { cut, at: ax[i0], reach });
    if (sh) P.fill(sh, shape([...R.slice().reverse(), ...ax.slice(i0, i1 + 1).reverse()]), { knock: false, cut, trap: 0, at: ax[i0], reach });
    for (const f of [.45, -.45, 0]) { const pts = []; for (let i = i0 + 2; i <= i1 - 2; i++) { const w = Math.abs(sw[i]) * f * (f < 0 ? .85 : 1); pts.push([ax[i][0] + N[i][0] * w, ax[i][1] + N[i][1] * w]); }
      if (pts.length > 4) { const S = stroke(pts, { hair: k * (f ? .22 : .3), a: { kind: 'taper', len: 6 }, b: { kind: 'taper', len: pts.length * .4 } }); P.fill(sh ?? 'leafD', path(S), { knock: false, cut, S }); } }
    KEY(P, loop, k, { cut, lift: .3, at: ax[i0], reach }); };
  piece(0, Math.min(cross, m - 1), o.ink ?? 'leaf', 'leafD');
  if (cross < m - 1) piece(cross, m - 1, 'leafB', null);
}
// a stem: a tapering line in the leaf's dark, with nodes (a sheathing scale) where given
export function stem(P, pts, o = {}) {
  const S = stroke(pts, { hair: o.w ?? 1, a: { kind: o.foot ?? 'point', len: o.footLen ?? 12, fat: (o.w ?? 1) * 1.8 }, b: { kind: 'hair' }, press: o.press ?? .25 });
  P.fill(o.ink ?? 'k', path(S), { cut: o.cut, knock: false, S });
  return S;
}

// ---- the seed head (Combinaisons pl. 30; Obrist's thistles) -------------------------------------------------------------------
// rays from a node, each bowed a little away from the middle, ending in a seed (a small drop pointing out), a ring of bracts
// at the node
export function umbel(P, node, dir, len, r, o = {}) {
  const n = o.n ?? 7, fan = o.fan ?? 1.3, k = o.kw ?? Math.max(.5, len * .025), ink = o.ink ?? 'k', seed = o.seedInk ?? ink;
  for (let i = 0; i < n; i++) { const u = i / (n - 1) - .5, a = dir + u * fan + J(r, .05), L = len * (.78 + .22 * Math.cos(u * 2.6)) * (1 + J(r, .06));
    const e = [node[0] + Math.cos(a) * L, node[1] + Math.sin(a) * L], mid = [node[0] + Math.cos(a - u * .35) * L * .55, node[1] + Math.sin(a - u * .35) * L * .55];
    { const S = stroke(bspline([node, mid, e], 12), { hair: k * .55, a: { kind: 'taper', len: L * .2 } }); P.fill(ink, path(S), { knock: false, S }); }
    const dr = organ({ axisCp: [e, [e[0] + Math.cos(a) * len * .06, e[1] + Math.sin(a) * len * .06], [e[0] + Math.cos(a) * len * .12, e[1] + Math.sin(a) * len * .12]], W: len * .028, ea: .5, eb: .55, asym: .9, r });
    if (dr) P.fill(seed, shape(dr.loop)); }
  for (const m of [-1, 1]) { const a = dir + Math.PI + m * .55; const S = stroke([node, [node[0] + Math.cos(a) * len * .14, node[1] + Math.sin(a) * len * .14]], { hair: k * .5, a: { kind: 'point', len: len * .1, fat: k * 1.1 } }); P.fill(ink, path(S), { knock: false, S }); }
}
