// Kelmscott ?caps=garden: a white-vine initial drawn directly as vector geometry. Paint the square, apply the letter, grow a
// garden in the gaps. The letter is GL-Morris (Morris's Troy capitals; research/kelmscott/gl-morris, licence there), placed
// and cut with his hairline exactly as research/kelmscott/gen/kgap.py does (kgarden_letters.py: fonts/kelmscott/garden-X.json,
// polygon rings in block units, ~2.5 KB a letter). The garden is the ivy border's method (kit/spray.js) turned to the block:
// the marks are set first (a flower or two in the biggest rooms, then leaves by Poisson disc), stems are grown to reach
// every one by space colonization from roots at the letter's edge and the block's foot, steering round the marks' rooms;
// each stem is then one smooth tapering curve (the node chain splined, its width from how much it carries), a few curls
// spring off into the open black; the black left over stays black (no strewn dots). Every shape is a designed outline (pointed leaf,
// trefoil, rosette, tulip), white on the black, a narrow black gap kept round each. Nothing is rasterised and traced:
// the only raster is the clearance field the growth steers by.
//   loadLetter(ch) -> Promise   garden(ch, seed) -> geo (block units: height 1, width A, y down; cached)
//   drawGarden(c, geo, x, y, h, res): the block's black, top left at x, y, h tall, onto a 2D context whose device px are
//     `res` a unit of its coordinates; the white is cut out (destination-out), so the context's alpha is the block's ink.
import { stream, noise1, noise2, spline, tendril } from '../marks.js';
import { poisson, strokes } from '../spray.js';
import { dist } from '../inkletter.js';

export const A = .95;           // the block's width / height (as kgap.py)
const R = 150;                  // the clearance field's cells per block height
const MARG = .03;               // the black frame round everything
const CHL = .022;               // the black channel round the letter
const GAP = .011;               // the black between two shapes
// By the block's size on the device: a block under ~280 device px is grown coarser (bigger, broader leaves, stouter stems,
// fewer of them), so that its finest white stays a px and a half and a leaf never thins to a thorn.
const BANDS = [{ HW0: .0058, HW1: .0168, LK: .036, LW: .23 }, { HW0: .007, HW1: .019, LK: .041, LW: .27 }, { HW0: .011, HW1: .026, LK: .058, LW: .3 }];
export const bandOf = dev => dev < 150 ? 2 : dev < 280 ? 1 : 0;   // (2: a line initial, a block a couple of lines deep)
let HW0, HW1, LW;
let AW = A, HB = 1, STOUT = .44, HEROES = null, OPT = {};   // (OPT: a band's growth: { edge: false, no shoot from the block's edge; fills: the most gap shoots; leaf: the leaves' spacing, x LK })   // the field's width and height (block units) and how much of the white a root must stand against: a letter's block, or a band's (gardenField)                 // a stem's half-width at its tip and where it carries most; a leaf's half-width (of its length)
const T = .009;                 // the least clearance a stem's room is reckoned by
const D = .007;                 // growth step
const BEND = .055;              // a stem's own turning, per step (each fork turns the other way): stems sweep in arcs

// ---- the letters ------------------------------------------------------------------------------------------------------------
const dir = new URL('../../fonts/kelmscott/', import.meta.url), rings = new Map(), loads = new Map();
export function loadLetter(ch) {
  if (!loads.has(ch)) loads.set(ch, fetch(new URL(`garden-${ch}.json`, dir)).then(r => r.json()).then(j => { rings.set(ch, j.map(r => { const o = []; for (let i = 0; i < r.length; i += 2) o.push([r[i] / 1e4, r[i + 1] / 1e4]); return o; })); }).catch(e => console.warn('kelmscott-garden:', e)));
  return loads.get(ch);
}
export const loaded = ch => rings.has(ch);

// ---- geometry helpers -------------------------------------------------------------------------------------------------------
const ringPath = (P, pts, close = true) => { pts.forEach((q, i) => i ? P.lineTo(q[0], q[1]) : P.moveTo(q[0], q[1])); if (close) P.closePath(); };
const rot = ([x, y], c, s) => [x * c - y * s, x * s + y * c];
// a shape in its own units (base 0,0, tip toward +x) laid at b, heading a, length L, mirrored across its axis if m
const lay = (pts, b, a, L, m = 1) => { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => { const [u, v] = rot([x * L, y * L * m], c, s); return [b[0] + u, b[1] + v]; }); };

// A pointed leaf, curving: its axis bends one way (bend), its sides swell to their widest a third of the way out and are
// drawn in to a long point; the two sides never quite match. Units: base (0,0), tip (1, ~bend/3).
function leafShape(r, bend) {
  // (no two alike: its width, where it is widest, how long its point is drawn out, how its tip turns, each half its own)
  const W = LW * (.85 + r() * .4), wl = 1 + (r() - .5) * .3, wr = 1 + (r() - .5) * .3, n = 22, ea = .4 + r() * .35, eb = 1 + r() * .55, tip = (r() - .5) * .5,
    sl = (r() - .5) * .25, mx = Math.pow(ea / (ea + eb), ea) * Math.pow(eb / (ea + eb), eb);
  const ax = t => [t, bend * (t * t * .9 + t * .1) - bend * .35 * t + tip * Math.pow(t, 4) * .25], w = t => Math.pow(t, ea) * Math.pow(1 - t, eb) / mx * (1 + sl * (t - .5));
  const R1 = [], L1 = [], axis = [];
  for (let i = 0; i <= n; i++) { const t = i / n, p = ax(t), q = ax(Math.min(1, t + .01)), p0 = ax(Math.max(0, t - .01)), dx = q[0] - p0[0], dy = q[1] - p0[1], l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l, hw = W * w(t); R1.push([p[0] - nx * hw * wr, p[1] - ny * hw * wr]); L1.push([p[0] + nx * hw * wl, p[1] + ny * hw * wl]); axis.push(p); }
  return { outline: [...R1, ...L1.reverse().slice(1, -1)], axis, W };
}
// A five-petalled rosette about (0,0), radius 1: broad petals, each its rounded end a little notched at the middle, drawn in
// to a narrow foot round a white eye; petal and eye are parted by fine black lines (drawn over them).
function rosette(r, n = 5) {
  const out = [], th0 = r() * 6.283, half = Math.PI / n, r0 = .3;
  for (let k = 0; k < n; k++) { const th = th0 + k * 2 * half + (r() - .5) * .06, P = [];
    P.push(rot([r0, 0], Math.cos(-half * .5), Math.sin(-half * .5)));
    for (let i = 0; i <= 16; i++) { const f = i / 16 * 2 - 1, ph = f * half * .98, rr = .7 + .3 * Math.pow(Math.cos(f * Math.PI / 2), .5) - .09 * Math.exp(-((f / .16) ** 2));
      P.push([Math.cos(ph) * rr, Math.sin(ph) * rr]); }
    P.push(rot([r0, 0], Math.cos(half * .5), Math.sin(half * .5)));
    out.push(spline(P, 3).map(q => rot(q, Math.cos(th), Math.sin(th)))); }
  const eye = []; for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283; eye.push([Math.cos(a) * .24, Math.sin(a) * .24]); }
  return { petals: out, eye };
}
// A tulip in its own units: base (0,0), cup opening toward +x, 1 long: two side petals turned out at their points and a
// middle one standing between them, the parting between each a fine black cut.
function tulip(r) {
  const j = (a = .08) => 1 + (r() - .5) * a, s = .34 * j();
  const cp = [[0, 0], [.18, .14 * j()], [.42, s * .98], [.72, s * 1.02], [.98 * j(.04), s * 1.12], [.8, s * .62], [.66, .16], [.84, .1], [1.04, 0], [.84, -.1], [.66, -.16], [.8, -s * .62], [.98 * j(.04), -s * 1.12], [.72, -s * 1.02], [.42, -s * .98], [.18, -.14 * j()], [0, 0]];
  return { outline: spline(cp, 6), cuts: [[[.64, .15], [.5, .1], [.34, .06]], [[.64, -.15], [.5, -.1], [.34, -.06]]] };
}

// A stroke as a hand draws it: the line wanders a hair either side of its course (slowly, never at its ends), and its
// width breathes with the pressure, swelling where it turns.
function hand(pts, ws, k) {
  const n = pts.length; if (n < 4) return [pts, ws];
  const wob = noise1(k * 7 + 3), pr = noise1(k * 13 + 5), S = [0]; for (let i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = S[n - 1], P = [], W2 = [];
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const a2 = pts[Math.max(0, i - 3)], b2 = pts[Math.min(n - 1, i + 3)], t1 = Math.atan2(pts[i][1] - a2[1], pts[i][0] - a2[0]), t2 = Math.atan2(b2[1] - pts[i][1], b2[0] - pts[i][0]);
    let dt = Math.abs(((t2 - t1 + 9.42) % 6.283) - 3.14); const ds = S[Math.min(n - 1, i + 3)] - S[Math.max(0, i - 3)] || 1, curv = dt / ds;
    const env = Math.min(1, S[i] / .03, (L - S[i]) / .03), off = (wob(S[i] / .07) - .5) * 2 * .0016 * env;
    P.push([pts[i][0] - dy / l * off, pts[i][1] + dx / l * off]); W2.push(ws[i] * (1 + .08 * (pr(S[i] / .12) - .5))); }
  return [P, W2];
}
// ---- the garden -------------------------------------------------------------------------------------------------------------
const gcache = new Map();
export function garden(ch, seed = 1, band = 0) {
  const key = ch + '|' + seed + '|' + band; if (gcache.has(key)) return gcache.get(key);
  AW = A; HB = 1; STOUT = .44; const geo = grow1(ch, seed, band, rings.get(ch)); if (!geo) return null;
  gcache.set(key, geo); if (gcache.size > 64) gcache.delete(gcache.keys().next().value);
  return geo;
}
// A garden grown in any field: L, the white shapes standing in the black that the garden springs from and grows round (a
// letter's rings, or a band's stem), aw x hb block units. key names L (its clearance field is kept by it).
export function gardenField(key, L, aw, hb, seed = 1, band = 0, stout = .44, heroes = null, opt = {}) {
  const k = key + '|' + seed + '|' + band; if (gcache.has(k)) return gcache.get(k);
  AW = aw; HB = hb; STOUT = stout; HEROES = heroes; OPT = opt; const geo = grow1(key, seed, band, L); if (geo && opt.wind) geo.wind = opt.wind; AW = A; HB = 1; STOUT = .44; HEROES = null; OPT = {}; if (!geo) return null;
  gcache.set(k, geo); if (gcache.size > 64) gcache.delete(gcache.keys().next().value);
  return geo;
}
// The letter's clearance field and its rooms: the same for every seed and size, so worked out once a letter (a regrowth,
// another seed or another size of the same letter starts from it).
const fields = new Map();
function fieldOf(ch, L, W, H) {
  if (fields.has(ch)) return fields.get(ch); if (fields.size > 48) fields.delete(fields.keys().next().value);
  // the clearance field: how far a point stands from the letter's channel and from the frame (block units, + is open)
  const cv = new OffscreenCanvas(W, H), c = cv.getContext('2d', { willReadFrequently: true }), P = new Path2D();
  L.forEach(q => ringPath(P, q)); c.scale(R, R); c.fill(P, OPT.wind ?? 'evenodd');
  const img = c.getImageData(0, 0, W, H).data, feat = new Uint8Array(W * H); for (let q = 0; q < W * H; q++) feat[q] = img[q * 4 + 3] > 100;
  const DL = dist(feat, W, H), F = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = (i + .5) / R, y = (j + .5) / R; F[j * W + i] = Math.min(DL[j * W + i] / R - CHL, Math.min(x, AW - x, y, HB - y) - MARG); }
  // the rooms a stem can run in: the open black in pieces (a counter, the ground round the letter), each labelled
  const comp = new Int32Array(W * H).fill(-1), area = [];
  const st = new Int32Array(W * H), visit = (o, id) => { if (comp[o] < 0 && F[o] >= T) { comp[o] = id; st[top++] = o; } }; let top = 0;
  for (let q0 = 0; q0 < W * H; q0++) { if (comp[q0] >= 0 || F[q0] < T) continue; const id = area.length; let n = 0; top = 0; visit(q0, id);
    while (top) { const q = st[--top], i = q % W; n++; if (i > 0) visit(q - 1, id); if (i < W - 1) visit(q + 1, id); if (q >= W) visit(q - W, id); if (q < W * H - W) visit(q + W, id); }
    area.push(n / R / R); }
  const f = { feat, DL, F, comp, area }; fields.set(ch, f); return f;
}
function grow1(ch, seed, band, L) {
  const B = BANDS[band]; ({ HW0, HW1, LW } = B);
  if (!L) return null;
  const r = stream(seed, 'garden-' + ch), wander = noise2(seed ^ 0x51), W = Math.ceil(AW * R), H = Math.ceil(HB * R);
  const Fxy = (x, y) => F[Math.max(0, Math.min(H - 1, y * R | 0)) * W + Math.max(0, Math.min(W - 1, x * R | 0))];
  const C = ([x, y]) => { const fx = Math.max(0, Math.min(W - 1.001, x * R - .5)), fy = Math.max(0, Math.min(H - 1.001, y * R - .5)), i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, q = j * W + i;
    return F[q] * (1 - u) * (1 - v) + F[q + 1] * u * (1 - v) + F[q + W] * (1 - u) * v + F[q + W + 1] * u * v; };
  const sees = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(l / .011); for (let i = 1; i < n; i++) { const t = i / n; if (Fxy(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) < .002) return false; } return true; };
  const byLetter = ([x, y]) => { const i = Math.min(W - 1, x * R | 0), j = Math.min(H - 1, y * R | 0); return DL[j * W + i] / R - CHL <= Math.min(x, AW - x, y, HB - y) - MARG; };
  const grad = p => { const e = .004, gx = C([p[0] + e, p[1]]) - C([p[0] - e, p[1]]), gy = C([p[0], p[1] + e]) - C([p[0], p[1] - e]), l = Math.hypot(gx, gy) || 1; return [gx / l, gy / l]; };
  const { feat, DL, F, comp, area } = fieldOf(ch, L, W, H);
  const compOf = ([x, y]) => comp[Math.min(H - 1, y * R | 0) * W + Math.min(W - 1, x * R | 0)];

  // (a root springs from a main stroke, a foot or an inside corner: not from a serif or a terminal's tip, where little
  // of the letter stands round the point it would leave from)
  const stout = p => { const g = grad(p), e = C(p) + CHL + .004, x = (p[0] - g[0] * e) * R, y = (p[1] - g[1] * e) * R, rr = .04 * R; let n = 0, t = 0;
    for (let j = Math.max(0, y - rr | 0); j <= Math.min(H - 1, y + rr | 0); j++) for (let i = Math.max(0, x - rr | 0); i <= Math.min(W - 1, x + rr | 0); i++) if ((i - x) ** 2 + (j - y) ** 2 <= rr * rr) { t++; n += feat[j * W + i]; }
    return n / t > STOUT; };
  // 0. the main gesture: two or three great scrolls, each springing from a main stroke of the letter and sweeping out
  // through the widest black, its curvature rising as it goes until it winds in on itself. They are the block's design;
  // everything else hangs from them or fills round them.
  const scrolls = [], spts = [], HS = HW1 * 1.45;
  const sgrid = new Map(), SC = .03, scell = (i, j) => i * 977 + j;
  const nearScroll = (p, d, skip) => { const n = Math.ceil(d / SC), i0 = p[0] / SC | 0, j0 = p[1] / SC | 0;
    for (let i = i0 - n; i <= i0 + n; i++) for (let j = j0 - n; j <= j0 + n; j++) { const c = sgrid.get(scell(i, j)); if (c) for (const q of c) if (q[2] !== skip && (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 < d * d) return true; }
    return false; };
  { const starts = []; for (let j = 0; j < H; j += 3) for (let i = 0; i < W; i += 3) { const q = j * W + i, p = [(i + .5) / R, (j + .5) / R]; if (F[q] >= T && F[q] < T + .006 && byLetter(p) && stout(p)) starts.push(p); }
    for (let k = starts.length - 1; k > 0; k--) { const j = (r() * (k + 1)) | 0; [starts[k], starts[j]] = [starts[j], starts[k]]; }
    const want = 2 + (r() < .45 ? 1 : 0), ds = .006;
    for (let at = 0; at < Math.min(36, starts.length) && scrolls.length < want; at++) {
      const S = starts[at]; if (nearScroll(S, .16)) continue;
      const g = grad(S), sg = r() < .5 ? 1 : -1, L = .5 + r() * .35, id = scrolls.length; let h = Math.atan2(g[1], g[0]) - sg * (.3 + r() * .5), p = S; const pts = [S];
      for (let sd = 0; sd < L; sd += ds) { const u = sd / L, k = sg * (1.2 + 26 * Math.pow(u, 2.4)) * (1 + .25 * (wander(p[0] * 4, p[1] * 4) - .5)); let ok = false;
        // (of the turns open to it, the one that keeps to the middle of the black, unless it is already well clear)
        let best = null, bs = -1e9;
        for (const dk of [0, .05, -.05, .1, -.1, .17, -.17, .26, -.26]) { const hh = h + k * ds + dk, q = [p[0] + Math.cos(hh) * ds, p[1] + Math.sin(hh) * ds], cq = C(q);
          if (cq > Math.min(HS * (1 - u * .6) + .003, .004 + sd * .5) && !nearScroll(q, .055)) { const sc = Math.min(cq, .05) * 3 - Math.abs(dk) * .08; if (sc > bs) { bs = sc; best = [hh, q]; } } }
        if (best) { [h, p] = best; ok = true; }
        if (!ok) break; pts.push(p); }
      let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (len < .26) continue;
      scrolls.push({ pts, sg, len }); pts.forEach(q => { const e = [q[0], q[1], id], k = scell(q[0] / SC | 0, q[1] / SC | 0); spts.push(e); (sgrid.get(k) ?? sgrid.set(k, []).get(k)).push(e); }); } }
  // (how far each place stands from the scrolls, on a coarse grid: the garden is fuller where they gather)
  const SG = 24, dsg = new Float32Array(SG * SG).fill(1);
  for (let j = 0; j < SG; j++) for (let i = 0; i < SG; i++) { const x = (i + .5) / SG * AW, y = (j + .5) / SG * HB; let m = 1; for (let k = 0; k < spts.length; k += 3) { const d = (spts[k][0] - x) ** 2 + (spts[k][1] - y) ** 2; if (d < m) m = d; } dsg[j * SG + i] = Math.sqrt(m); }
  const dScroll = p => dsg[Math.min(SG - 1, p[1] / HB * SG | 0) * SG + Math.min(SG - 1, p[0] / AW * SG | 0)];
  // 1. the focal flowers, in the biggest rooms left: the field's greatest maxima, clear of the scrolls, kept apart
  const marks = [], heroes = [];
  if (HEROES) for (const h of HEROES) heroes.push({ len: h.rad * 1.7, ...h, room: h.rad + GAP * .4, kill: h.kind === 'rosette' ? h.rad + .004 : h.rad * .8 });   // (a band's flowers, set by its design)
  else for (let pass = 0; pass < 2; pass++) { let q = -1; for (let k = 0; k < W * H; k++) if (F[k] > .05 && (q < 0 || F[k] > F[q]) && !nearScroll([(k % W + .5) / R, ((k / W | 0) + .5) / R], F[k] * .9 + .01) && !heroes.some(h => Math.hypot(h.p[0] - (k % W + .5) / R, h.p[1] - ((k / W | 0) + .5) / R) < .34)) q = k;
    if (q < 0) break; const p = [(q % W + .5) / R, ((q / W | 0) + .5) / R]; {
      const rad = Math.min(F[q] - GAP * .5, .06) * (.92 + r() * .08); if (rad < .04) break;
      const kind = heroes.length === 0 ? 'rosette' : 'tulip';
      heroes.push({ p, kind, rad, room: rad + GAP * .4, kill: kind === 'rosette' ? rad + .004 : rad * .8, len: rad * 1.7 }); } }
  marks.push(...heroes);
  // 2. the leaves: the great ones first, alternating along each scroll in a measured rhythm; then the middle ones, by Poisson
  // disc, fewer the further they stand from the scrolls
  let nCurl = 0; const LK = B.LK;
  scrolls.forEach((sc, id) => { let acc = 0, side = r() < .5 ? 1 : -1, next = .07 + r() * .03;
    for (let i = 1; i < sc.pts.length - 8; i++) { const a = sc.pts[i - 1], b = sc.pts[i]; acc += Math.hypot(b[0] - a[0], b[1] - a[1]); if (acc < next) continue;
      const t = [b[0] - a[0], b[1] - a[1]], tl = Math.hypot(t[0], t[1]) || 1, k = LK * (1.55 + r() * .15), off = HS + k * .9, p = [b[0] - t[1] / tl * side * off, b[1] + t[0] / tl * side * off];
      next = acc + .1 + r() * .03;
      if (C(p) > k * .62 && !nearScroll(p, k * .85) && heroes.every(h => Math.hypot(p[0] - h.p[0], p[1] - h.p[1]) > h.rad + k * 2 + GAP)) { marks.push({ p, kind: 'sprig', kill: k + .002, room: k * .55, len: k * 2, big: 1 }); side = -side; } } });
  const leafOK0 = p => marks.every(m => !m.big || Math.hypot(p[0] - m.p[0], p[1] - m.p[1]) > m.room + LK * 1.4 + GAP) && !nearScroll(p, LK + HS) && r() < .4 + .6 * Math.exp(-dScroll(p) / .14);
  const leafOK = p => C(p) > LK * .62 && leafOK0(p) && heroes.every(h => Math.hypot(p[0] - h.p[0], p[1] - h.p[1]) > h.rad + LK * 2 + GAP);
  poisson(AW, HB, LK * (OPT.leaf ?? 2.5) + GAP * .7, r, leafOK).forEach(p => { const curl = r() < .2 && nCurl++ < 5, k = LK * (curl ? 1 : 1.4 + r() * .2); marks.push({ p, kind: curl ? 'curl' : 'sprig', kill: k + .002, room: k * (curl ? .75 : .55), len: k * 2 }); });

  // 3. the roots: a few in each room that holds a mark, at the letter's edge (a stem coming out from behind it), lowest first
  const N = [], need = new Map();
  marks.forEach(m => { m.comp = m.comp0 = m.fixed ? -1 : compOf(m.p); if (m.comp >= 0) need.set(m.comp, (need.get(m.comp) ?? 0) + 1); });
  for (const [id, n] of need) {
    const cand = [], crowd = [];
    for (let j = 0; j < H; j += 3) for (let i = 0; i < W; i += 3) { const q = j * W + i; if (comp[q] !== id || F[q] > T + .006) continue;
      const p = [(i + .5) / R, (j + .5) / R]; if (!byLetter(p) || !stout(p)) continue; (marks.some(a => Math.hypot(a.p[0] - p[0], a.p[1] - p[1]) < a.room + HW0 + GAP) ? crowd : cand).push(p); }
    // (a small counter whose whole edge is in leaves' rooms: root anyway, and give up the leaves the root stands in)
    if (!cand.length) { if (!crowd.length) continue; cand.push(...crowd); }
    // the fewest roots from which every mark in the room can be seen (greedy cover), the lowest first: so every mark has a
    // stem in sight, and the stems are few and long
    const ms = marks.filter(m => m.comp === id), vis = cand.map(p => new Set(ms.filter(m => Math.hypot(m.p[0] - p[0], m.p[1] - p[1]) < .6 && sees(p, m.p))));
    const unseen = new Set(ms.filter(m => !spts.some((q, i) => i % 4 === 0 && (q[0] - m.p[0]) ** 2 + (q[1] - m.p[1]) ** 2 < .09 && sees(q, m.p)))), picked = [];
    while (unseen.size && picked.length < 6) { let bi = -1, bs = 0;
      cand.forEach((p, i) => { if (picked.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < .1)) return; let n = 0; for (const m of vis[i]) if (unseen.has(m)) n++; const sc = n + p[1] * 1.5 + r() * .5; if (n && sc > bs) { bs = sc; bi = i; } });
      if (bi < 0) break; picked.push(cand[bi]); for (const m of vis[bi]) unseen.delete(m); }
    picked.forEach(p => ms.forEach(a => { if (Math.hypot(a.p[0] - p[0], a.p[1] - p[1]) < a.room + HW0 + GAP) a.comp = -1; }));
    picked.forEach(p => N.push({ p, parent: -1, dir: grad(p), t: 0, root: true, bend: (r() < .5 ? 1 : -1) * BEND }));
  }
  // 4. the growth (Runions et al. 2005, as spray.js grow): every mark pulls its nearest node; a node steps toward the pull,
  // bent a little by a slow wander, and steers round anything that is not its target (the letter's channel, another
  // mark's room)
  const G = .03, gw = Math.ceil(AW / G) + 1, gh = Math.ceil(HB / G) + 1, cells = Array.from({ length: gw * gh }, () => []);
  const cellOf = p => Math.max(0, Math.min(gh - 1, p[1] / G | 0)) * gw + Math.max(0, Math.min(gw - 1, p[0] / G | 0));
  scrolls.forEach(sc => { const base = N.length; sc.pts.forEach((p, i) => { const nx = sc.pts[Math.min(i + 1, sc.pts.length - 1)], pr = sc.pts[Math.max(0, i - 1)], l = Math.hypot(nx[0] - pr[0], nx[1] - pr[1]) || 1;
    N.push({ p, parent: i ? base + i - 1 : -1, dir: [(nx[0] - pr[0]) / l, (nx[1] - pr[1]) / l], t: 0, root: !i, scroll: 1, bend: -sc.sg * BEND, nk: i < sc.pts.length - 1 ? 1 : 0, kid: i < sc.pts.length - 1 ? [(nx[0] - p[0]) / (Math.hypot(nx[0] - p[0], nx[1] - p[1]) || 1), (nx[1] - p[1]) / (Math.hypot(nx[0] - p[0], nx[1] - p[1]) || 1)] : null }); }); sc.tip = N.length - 1; });
  const roots = N.splice(0), addNode = n => { N.push(n); cells[cellOf(n.p)].push(N.length - 1); }; roots.forEach(addNode);
  const nearest = (p, max) => { const ci = p[0] / G | 0, cj = p[1] / G | 0, rr = Math.ceil(max / G); let best = -1, bd = max;
    for (let j = Math.max(0, cj - rr); j <= Math.min(gh - 1, cj + rr); j++) for (let i = Math.max(0, ci - rr); i <= Math.min(gw - 1, ci + rr); i++)
      for (const k of cells[j * gw + i]) { const d = Math.hypot(p[0] - N[k].p[0], p[1] - N[k].p[1]); if (d < bd) { bd = d; best = k; } }
    return [best, bd]; };
  const mcell = Array.from({ length: gw * gh }, () => []), RM = HW0 + GAP * .6;
  marks.forEach(a => { const e = a.room + RM; for (let j = Math.max(0, (a.p[1] - e) / G | 0); j <= Math.min(gh - 1, (a.p[1] + e) / G | 0); j++) for (let i = Math.max(0, (a.p[0] - e) / G | 0); i <= Math.min(gw - 1, (a.p[0] + e) / G | 0); i++) mcell[j * gw + i].push(a); });
  const inRoom = (q, t, m = RM) => mcell[cellOf(q)].some(a => a !== t && Math.hypot(a.p[0] - q[0], a.p[1] - q[1]) < a.room + m);
  const blocked = (q, t) => C(q) < HW1 * .9 || inRoom(q, t);
  const kin = k => { const s = new Set(); for (let j = k, i = 0; j >= 0 && i < 8; j = N[j].parent, i++) s.add(j); return s; };
  const crowded = (q, k) => { const ci = q[0] / G | 0, cj = q[1] / G | 0; let A = null;
    for (let j = Math.max(0, cj - 1); j <= Math.min(gh - 1, cj + 1); j++) for (let i = Math.max(0, ci - 1); i <= Math.min(gw - 1, ci + 1); i++)
      for (const o of cells[j * gw + i]) { if (o === k || Math.hypot(q[0] - N[o].p[0], q[1] - N[o].p[1]) > HW1 + HW0 + GAP * 1.1) continue;
        A ??= kin(k); let u = o, ok = false; for (let t = 0; t < 8 && u >= 0; t++, u = N[u].parent) if (A.has(u)) { ok = true; break; } if (!ok) return true; }
    return false; };
  const alive = new Set(marks.filter(m => m.comp >= 0 && need.has(m.comp))), dead = new Set();
  // (each mark keeps the nearest node it can see, updated from the nodes each step adds; a node that cannot step is
  // given up, and the marks it held look again)
  const look = (a, from) => { const c = []; for (let k = from; k < N.length; k++) { if (dead.has(k)) continue; const d = Math.hypot(a.p[0] - N[k].p[0], a.p[1] - N[k].p[1]); if (d < (a.best?.[1] ?? .6)) c.push([d, k]); }
    c.sort((x, y) => x[0] - y[0]); for (const [d, k] of c.slice(0, 24)) if (a.best && N[k].parent === a.best[0] || sees(a.p, N[k].p)) { a.best = [k, d]; return; } };
  alive.forEach(a => look(a, 0));
  // (a mark whose node has died looks again among the nodes near it, nearest first)
  const relook = (a, rr = 7) => { const ci = a.p[0] / G | 0, cj = a.p[1] / G | 0, c = [];
    for (let j = Math.max(0, cj - rr); j <= Math.min(gh - 1, cj + rr); j++) for (let i = Math.max(0, ci - rr); i <= Math.min(gw - 1, ci + rr); i++)
      for (const k of cells[j * gw + i]) if (!dead.has(k)) c.push([Math.hypot(a.p[0] - N[k].p[0], a.p[1] - N[k].p[1]), k]);
    c.sort((x, y) => x[0] - y[0]); for (const [d, k] of c.slice(0, 12)) if (sees(a.p, N[k].p)) { a.best = [k, d]; return; } if (rr < 20) relook(a, 20); };
  const fails = new Map();
  for (let it = 0, seen = N.length, idle = 0; it < 400 && alive.size && idle < 4; it++) {
    const pull = new Map();
    for (const a of alive) { if (!a.best) continue; const [best, bd] = a.best;
      if (bd < a.kill) { alive.delete(a); a.node = best; continue; }
      const pl = pull.get(best) ?? { v: [0, 0], t: a, by: [] }; pl.v[0] += (a.p[0] - N[best].p[0]) / bd ** 1.5; pl.v[1] += (a.p[1] - N[best].p[1]) / bd ** 1.5; pl.by.push(a); pull.set(best, pl); }
    if (!pull.size) break;
    const before = N.length;
    for (const [k, { v, t, by }] of pull) {
      const n = N[k], l = Math.hypot(v[0], v[1]) || 1, wa = (wander(n.p[0] * 6, n.p[1] * 6) - .5) * 1.1;
      const od = rot(n.dir, Math.cos(n.bend), Math.sin(n.bend)); const cw = Fxy(n.p[0], n.p[1]), gp = cw < .05 ? grad(n.p) : null, pw = gp ? (.05 - cw) / .05 * .6 : 0; let d = [v[0] / l + od[0] * .9 - od[1] * wa + (gp ? gp[0] * pw : 0), v[1] / l + od[1] * .9 + od[0] * wa + (gp ? gp[1] * pw : 0)]; const m = Math.hypot(d[0], d[1]) || 1; d = [d[0] / m, d[1] / m];
      // (the turn a step may take is held: a stem runs on within a gentle bend; a new branch leaves its stem at 25-45
      // degrees, on the side away from the stem's own way on. No step turns a corner.)
      let q = null; const b0 = Math.atan2(n.dir[1], n.dir[0]), nrm = x => ((x + 9.4248) % 6.2832) - 3.1416; let ph = nrm(Math.atan2(d[1], d[0]) - b0), lo, hi;
      if (n.nk >= 1 && n.kid) { const ka = nrm(Math.atan2(n.kid[1], n.kid[0]) - b0); lo = -1.3; hi = 1.3; ph = Math.max(lo, Math.min(hi, ph)); if (Math.abs(ph - ka) < .3) ph = ka + (ph >= ka ? .3 : -.3); }
      else { lo = n.parent < 0 ? -1.4 : -.7; hi = -lo; ph = Math.max(lo, Math.min(hi, ph)); }
      for (const dt of [0, .12, -.12, .24, -.24]) { const a2 = b0 + Math.max(lo, Math.min(hi, ph + dt)), dd = [Math.cos(a2), Math.sin(a2)], p2 = [n.p[0] + dd[0] * D, n.p[1] + dd[1] * D];
        if (!blocked(p2, t)) { q = p2; d = dd; break; } }
      const [nb, nd] = q ? nearest(q, D) : [-1, 0];
      // (two stems never run into one another: nothing near the step but this stem's own last few nodes and their shoots)
      if (q && !(nb >= 0 && nb !== k && nd < D * .7) && crowded(q, k)) q = null;
      if (q && nb >= 0 && nb !== k && nd < D * .7) {
        // (a node already stands where this one would step: the marks that pulled take it, if it is nearer them)
        let moved = false; for (const a of by) { const d = Math.hypot(a.p[0] - N[nb].p[0], a.p[1] - N[nb].p[1]); if (!dead.has(nb) && d < a.best[1]) { a.best = [nb, d]; moved = true; } }
        if (moved) continue; }
      if (!q || nb >= 0 && nb !== k && nd < D * .7) { const f = (fails.get(k) ?? 0) + 1; fails.set(k, f);
        if (f > 2) { dead.add(k); by.forEach(a => { a.best = null; relook(a); }); } continue; }
      if (!n.nk) n.kid = d; n.nk = (n.nk ?? 0) + 1; addNode({ p: q, parent: k, dir: d, t: it + 1, bend: n.nk > 1 ? -n.bend : n.bend });
    }
    for (const a of alive) look(a, seen); seen = N.length;
    idle = N.length === before ? idle + 1 : 0;
  }
  scrolls.forEach(sc => marks.push({ p: N[sc.tip].p, kind: 'tip', node: sc.tip, comp: -1 }));
  let reached = marks.filter(m => m.node !== undefined);
  // occupancy: every white shape as discs, so a leaf, a curl or a dot can keep its distance
  const OG = .03, okey = (i, j) => i * 997 + j, discs = [];
  // (small discs in a grid of .03 cells, looked up three by three; the few large ones, flowers, in a list of their own)
  const occOf = list => { const o = new Map(); o.big = []; list.forEach(e => { if (e[2] > .012) { o.big.push(e); return; } const k = okey(e[0] / OG | 0, e[1] / OG | 0); (o.get(k) ?? o.set(k, []).get(k)).push(e); }); return o; };
  let occ = occOf([]);
  const occAdd = (p, rr, who = 0) => { const e = [p[0], p[1], rr, who]; discs.push(e); if (rr > .012) { occ.big.push(e); return; } const k = okey(p[0] / OG | 0, p[1] / OG | 0); (occ.get(k) ?? occ.set(k, []).get(k)).push(e); };
  const hit = (e, p, rr, skip) => { if (e[3] === skip) return false; const dx = e[0] - p[0], dy = e[1] - p[1], m = rr + e[2]; return dx * dx + dy * dy < m * m; };
  const occFree = (p, rr, skip = -1) => { const i0 = p[0] / OG | 0, j0 = p[1] / OG | 0, n = rr > .018 ? 2 : 1;
    for (let i = i0 - n; i <= i0 + n; i++) for (let j = j0 - n; j <= j0 + n; j++) { const c = occ.get(okey(i, j)); if (c) for (const e of c) if (hit(e, p, rr, skip)) return false; }
    for (const e of occ.big) if (hit(e, p, rr, skip)) return false; return true; };
  // the tree as it stands (each node a disc as wide as the stem it will be), for laying the leaves against
  const hwOf = s => HW0 + (HW1 - HW0) * (1 - Math.exp(-(s - 1) / 70));
  { const used = new Uint8Array(N.length), sz = new Float32Array(N.length).fill(1); reached.forEach(m => { for (let k = m.node; k >= 0 && !used[k]; k = N[k].parent) used[k] = 1; });
    for (let i = N.length - 1; i >= 0; i--) if (used[i] && N[i].parent >= 0) sz[N[i].parent] += sz[i];
    occ = occOf(N.flatMap((n, i) => used[i] ? [[n.p[0], n.p[1], hwOf(sz[i]), -2]] : [])); }
  // 5. the marks, each where its stem reached it: the leaf from the stem's end toward the mark and through it
  const leaves = [], flowers = [], curls = [];
  const bez = (P0, P1, P2, u) => { const v = 1 - u; return [v * v * P0[0] + 2 * v * u * P1[0] + u * u * P2[0], v * v * P0[1] + 2 * v * u * P1[1] + u * u * P2[1]]; };
  const curve = (P0, a0, a1, L, w0, w1) => { const P2 = [P0[0] + Math.cos(a1) * L, P0[1] + Math.sin(a1) * L], P1 = [P0[0] + Math.cos(a0) * L * .5, P0[1] + Math.sin(a0) * L * .5], n = Math.max(3, Math.ceil(L / .004)), pts = [], w = [];
    for (let i = 0; i <= n; i++) { pts.push(bez(P0, P1, P2, i / n)); w.push(w0 + (w1 - w0) * i / n); } return { pts, w }; };
  const strokeOK = (st, from, own) => st.pts.every((p, i) => i % 2 === 1 || Math.hypot(p[0] - from[0], p[1] - from[1]) < own + st.w[i] + GAP * .7 || C(p) > st.w[i] + .002 && occFree(p, st.w[i] + GAP * .6));
  const leafAt = (b, a, L, sd) => { const sh = leafShape(r, sd * (.15 + r() * .15)), o = lay(sh.outline, b, a, L);
    return o.every((p, j) => j % 2 || Math.hypot(p[0] - b[0], p[1] - b[1]) < L * .2 || C(p) > -.002 && occFree(p, GAP * .55)) ? { outline: o, rib: lay(sh.axis.slice(2, 15), b, a, L), W: sh.W * L, a, L, b } : null; };
  let put = (p, rr) => occAdd(p, rr), SPR = 0, FIL = 0, FAI = 0;
  function sprig(b, a, L, sd) {
    const twig = curve(b, a, a + sd * .35, L * .7, HW0 * 1.2, HW0 * .75); if (!strokeOK(twig, b, HW1)) return null;
    const tl = (u) => { const i = Math.min(twig.pts.length - 2, Math.round(u * (twig.pts.length - 1))), p = twig.pts[i], q = twig.pts[i + 1]; return [p, Math.atan2(q[1] - p[1], q[0] - p[0])]; };
    const parts = [], lv = [];
    const [pe, ae] = tl(1), end = leafAt(twig.pts.at(-1), ae, L * .55 * (.9 + r() * .2), sd); if (!end) return null; lv.push(end);
    for (const [u, s2] of [[.34, -sd], [.62, sd]]) { const [q, at] = tl(u), pet = curve(q, at + s2 * .8, at + s2 * .5, L * .14, HW0 * .7, HW0 * .55);
      if (!strokeOK(pet, q, twig.w[0])) continue; const pe2 = pet.pts.at(-1), lf = leafAt(pe2, at + s2 * .55, L * .46 * (.85 + r() * .25), s2);
      if (!lf || lv.some(o => o.outline.some((p, j) => j % 3 === 0 && lf.outline.some((q2, k2) => k2 % 3 === 0 && Math.hypot(p[0] - q2[0], p[1] - q2[1]) < GAP * .6)))) continue; parts.push(pet); lv.push(lf); }
    // laid: the twig and its petioles as strokes, the leaves (all moved with the twig onto its stem as drawn)
    const tw = { b, pts: twig.pts, w: twig.w }; curls.push(tw); twig.pts.forEach((p, i) => i % 2 || put(p, twig.w[i]));
    parts.forEach(pt => { curls.push({ follow: tw, pts: pt.pts, w: pt.w }); pt.pts.forEach((p, i) => i % 2 || put(p, pt.w[i])); });
    lv.forEach(l => { leaves.push({ follow: tw, outline: l.outline, rib: l.rib, W: l.W }); for (let t = .25; t <= .95; t += .14) put([l.b[0] + Math.cos(l.a) * l.L * t, l.b[1] + Math.sin(l.a) * l.L * t], l.L * .17); });
    SPR++; return true;
  }
  // (a band's flowers stand on the ends of its branches as its design set them: laid, not grown to)
  for (const m of marks) if (m.fixed) { m.ok = 1; if (m.kind === 'rosette') flowers.push({ ...rosette(r), c: m.p, rad: m.rad, a: m.a });
    else { const t = tulip(r); flowers.push({ outline: lay(t.outline, m.b, m.a, m.len), cuts: t.cuts.map(q => lay(q, m.b, m.a, m.len)) }); } occAdd(m.p, m.rad); }
  for (const m of reached) {
    if (m.kind === 'tip') { m.ok = 1; const sp = N[m.node].p; curls.push({ pts: [sp, sp], w: [HW0, HW0], ball: HW0 * 2.2 }); continue; }
    const b = N[m.node].p, a = Math.atan2(m.p[1] - b[1], m.p[0] - b[0]);
    if (m.kind === 'rosette') { const f = rosette(r); flowers.push({ ...f, c: m.p, rad: m.rad, a }); occAdd(m.p, m.rad); m.ok = 1; continue; }
    if (m.kind === 'tulip') { const t = tulip(r); flowers.push({ b, outline: lay(t.outline, b, a, m.len), cuts: t.cuts.map(q => lay(q, b, a, m.len)) }); occAdd(m.p, m.rad); m.ok = 1; continue; }
    // (a leaf bends the way its stem was turning, or by chance against it)
    const nd = N[m.node], pd = nd.parent >= 0 ? N[nd.parent].p : b, turn = Math.sign(((a - Math.atan2(b[1] - pd[1], b[0] - pd[0]) + 9.42) % 6.283) - 3.14) || 1;
    // a curl: the stem runs on past its last twig and winds in, its curvature rising smoothly (one ramp, so no join)
    if (m.kind === 'curl') { let done = false;
      for (const [sg, sc] of [[turn, 1], [-turn, 1], [turn, .75], [-turn, .75]]) { const L = (.1 + r() * .045) * sc, k1 = sg * (42 + r() * 18) / sc, hd = N[m.node].dir, pts = tendril(b, Math.atan2(hd[1] + Math.sin(a), hd[0] + Math.cos(a)) - sg * .2, L, sg * 5, k1, 1.2, .0025);
        let ok = true; for (let k = 6; k < pts.length && ok; k++) if (C(pts[k]) < .002 || !occFree(pts[k], HW0 + GAP * .5)) ok = false;
        if (!ok) continue; curls.push({ b, pts, w: pts.map((_, k) => HW0 * (1 - .3 * k / pts.length)), ball: HW0 * 2 }); pts.forEach((q, k) => k % 3 || occAdd(q, HW0)); done = m.ok = 1; break; }
      if (done) continue; }
    // a sprig: the branch divides once more, a twig curving off it carries a leaf at its end and two along it, alternating,
    // each on a short curved petiole (tried bending either way, then smaller; else a single leaf)
    if (m.kind === 'sprig') { let sp = null;
      for (const [sd, f] of [[turn, 1], [-turn, 1], [turn, .82], [-turn, .82], [turn, .66], [-turn, .66], [turn, .52], [-turn, .52]]) { sp = sprig(b, a, m.len * f, sd); if (sp) break; }
      if (sp) { m.ok = 1; continue; } m.len = LK * 2; }
    // (laid toward its mark; if it would touch the letter's channel or another shape, turned a little, or made smaller)
    const sh = leafShape(r, (r() < .75 ? turn : -turn) * (.18 + r() * .14));
    let best = null;
    for (const [da, f] of [[0, 1], [.25, 1], [-.25, 1], [.5, 1], [-.5, 1], [0, .8], [.3, .8], [-.3, .8], [.7, .8], [-.7, .8], [0, .65]]) {
      const o = lay(sh.outline, b, a + da, m.len * f); let ok = true;
      for (let k = 0; k < o.length && ok; k += 2) { const p = o[k]; if (Math.hypot(p[0] - b[0], p[1] - b[1]) < m.len * .22) continue; if (C(p) < -.002 || !occFree(p, GAP * .55)) ok = false; }
      if (ok) { best = [o, a + da, f]; break; } }
    if (!best) continue;
    const [o, aa, f] = best; m.ok = 1;
    leaves.push({ b, outline: o, rib: sh.axis && lay(sh.axis.slice(2, 15), b, aa, m.len * f), W: sh.W * m.len * f });
    for (let t = .25; t <= .95; t += .14) occAdd([b[0] + Math.cos(aa) * m.len * f * t, b[1] + Math.sin(aa) * m.len * f * t], m.len * f * .17);
  }
  reached = reached.filter(m => m.ok);
  // the tree trimmed to what reaches a mark that stands (a root that won nothing, a twig whose leaf found no room, are pruned)
  const used = new Uint8Array(N.length); reached.forEach(m => { for (let k = m.node; k >= 0 && !used[k]; k = N[k].parent) used[k] = 1; });
  // a root springs from the letter: its foot drawn back across the channel until it meets the white (as nodes, so the
  // smoothing below runs it into the stem)
  const feet = [], footOf = new Map();
  N.forEach((n, i) => { if (!used[i] || n.parent >= 0) return; const g = grad(n.p); let e = 0; while (e < .06 && Fxy(n.p[0] - g[0] * e, n.p[1] - g[1] * e) > -CHL + 1e-4) e += .003; e += .003;
    const k = Math.ceil(e / D); for (let j = k; j >= 1; j--) feet.push({ p: [n.p[0] - g[0] * e * j / k, n.p[1] - g[1] * e * j / k], parent: j === k ? -1 : feet.length - 1, t: 0 }); if (k) footOf.set(i, feet.length - 1); });
  const idx = new Int32Array(N.length).fill(-1), M = [...feet]; N.forEach((n, i) => { if (used[i]) { idx[i] = M.length; M.push({ ...n, parent: n.parent >= 0 ? idx[n.parent] : footOf.get(i) ?? -1 }); } });
  // 6. the stems: the tree as strokes (heaviest child first), each a smooth curve through its chain, its width from what it carries
  const size = new Float32Array(M.length).fill(1); for (let i = M.length - 1; i >= 0; i--) if (M[i].parent >= 0) size[M[i].parent] += size[i];
  // the node chain smoothed in place (each node drawn toward the mean of its parent and its heaviest child, the roots and
  // the tips held), so a fork is a fork and the stem through it one sweep, not a kink
  { const heavy = new Int32Array(M.length).fill(-1); M.forEach((n, i) => { if (n.parent >= 0 && (heavy[n.parent] < 0 || size[i] > size[heavy[n.parent]])) heavy[n.parent] = i; });
    const n = M.length; let P = new Float64Array(n * 2), Q = new Float64Array(n * 2); M.forEach((m, i) => { P[2 * i] = m.p[0]; P[2 * i + 1] = m.p[1]; });
    for (let it = 0; it < 40; it++) { Q.set(P);
      for (let i = 0; i < n; i++) { const pa = M[i].parent, hc = heavy[i]; if (pa < 0 || hc < 0) continue;
        Q[2 * i] = P[2 * i] * .5 + (P[2 * pa] + P[2 * hc]) * .25; Q[2 * i + 1] = P[2 * i + 1] * .5 + (P[2 * pa + 1] + P[2 * hc + 1]) * .25; }
      [P, Q] = [Q, P]; }
    M.forEach((m, i) => { const dx = P[2 * i] - m.p[0], dy = P[2 * i + 1] - m.p[1], l = Math.hypot(dx, dy), f = l > .005 ? .005 / l : 1; m.p = [m.p[0] + dx * f, m.p[1] + dy * f]; }); }
  const stems = [];
  for (const s of strokes(M)) {
    if (s.pts.length < 2 && !s.root) continue;
    const chain = s.pts.slice(), ws = s.ids.map(i => hwOf(size[i]) * (M[i].scroll ? 1.45 : 1)); if (!s.root) ws.unshift(ws[0]);
    if (!s.root && chain.length > 3) { const fk = M[s.ids[0]].parent, pa = M[fk].parent, F0 = chain[0], k = Math.min(7, chain.length - 1), Q = chain[k];
      const ti = pa >= 0 ? [F0[0] - M[pa].p[0], F0[1] - M[pa].p[1]] : null, tl = ti ? Math.hypot(ti[0], ti[1]) : 0, dq = [Q[0] - F0[0], Q[1] - F0[1]], d = Math.hypot(dq[0], dq[1]);
      if (tl > 0 && (ti[0] * dq[0] + ti[1] * dq[1]) > 0) { const P1 = [F0[0] + ti[0] / tl * d * .45, F0[1] + ti[1] / tl * d * .45];
        for (let i = 1; i < k; i++) { const t = i / k, u = 1 - t; chain[i] = [u * u * F0[0] + 2 * u * t * P1[0] + t * t * Q[0], u * u * F0[1] + 2 * u * t * P1[1] + t * t * Q[1]]; } } }
    // corners cut (Chaikin, on every third node): a stem that turns sharply where a fork pulled it turns on a curve
    for (let i = 1; i < ws.length; i++) ws[i] = Math.min(ws[i], ws[i - 1]);   // (a stem only ever thins toward its tip)
    if (!s.root) { const fk = M[s.ids[0]].parent, pw = hwOf(size[fk]) * (M[fk].scroll ? 1.45 : 1), top = Math.min(pw * .85, ws[0] * 1.7); let sd = 0;
      for (let i = 0; i < chain.length; i++) { if (i) sd += Math.hypot(chain[i][0] - chain[i - 1][0], chain[i][1] - chain[i - 1][1]); if (sd > .025) break; ws[i] += (top - ws[i]) * (1 - sd / .025) ** 2; } }
    let pts = chain.map((p, i) => [p[0], p[1], ws[i]]).filter((_, i, a) => i % 4 === 0 || i === a.length - 1);
    for (let it = 0; it < 4 && pts.length > 2; it++) { const o = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; o.push(a.map((v, k) => v * .75 + b[k] * .25), a.map((v, k) => v * .25 + b[k] * .75)); }
      o.push(pts.at(-1)); pts = o; }
    let wsm = pts.map(p => p[2]); pts = pts.map(p => [p[0], p[1]]); [pts, wsm] = hand(pts, wsm, stems.length + 1);
    stems.push({ pts, w: wsm, root: s.root });
  }
  // each leaf, curl and tulip moved onto its stem as drawn (the splined curve runs a hair off the node chain it smooths)
  { const sp = occOf(stems.flatMap(s => s.pts)), sh = (q, d) => q.forEach(p => { p[0] += d[0]; p[1] += d[1]; });
    for (const f of [...leaves, ...curls, ...flowers]) { if (!f.b) continue; let bd = .025, bp = null; const i0 = f.b[0] / OG | 0, j0 = f.b[1] / OG | 0;
      for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) for (const p of sp.get(okey(i, j)) ?? []) { const d = Math.hypot(p[0] - f.b[0], p[1] - f.b[1]); if (d < bd) { bd = d; bp = p; } }
      if (!bp) continue; const d = [bp[0] - f.b[0], bp[1] - f.b[1]]; f.d = d; for (const q of [f.outline, f.rib, f.pts, ...(f.cuts ?? [])]) if (q) sh(q, d); }
    for (const f of [...leaves, ...curls]) if (f.follow?.d) for (const q of [f.outline, f.rib, f.pts]) if (q) sh(q, f.follow.d); }
  occ = occOf(discs); stems.forEach((s, k) => s.pts.forEach((p, i) => i % 2 || occAdd(p, s.w[i], 1 + k)));
  // 7. curls: off the stems into the open black, a tendril whose curvature rises smoothly to a tight turn
  const cands = []; stems.forEach(s => { for (let i = 6; i < s.pts.length - 6; i += 5) cands.push([s, i]); });
  for (let k = cands.length - 1; k > 0; k--) { const j = (r() * (k + 1)) | 0; [cands[k], cands[j]] = [cands[j], cands[k]]; }
  for (const [s, i] of cands) { if (curls.length >= 7) break;
    const p = s.pts[i], q = s.pts[i + 1], h = Math.atan2(q[1] - p[1], q[0] - p[0]), side = r() < .5 ? 1 : -1, len = .05 + r() * .05;
    const pts = tendril(p, h + side * .75, len, side * -2, side * -2 + -side * 95 * (.8 + r() * .4) / (len * 10), 2.2, .0025);
    const hw = s.w[i] * .7, wsx = pts.map((_, k) => Math.max(HW0 * .55, hw * (1 - k / pts.length * .55)));
    let ok = true; for (let k = 4; k < pts.length && ok; k++) if (C(pts[k]) < wsx[k] + .003 || !occFree(pts[k], wsx[k] + GAP * .9, k > 8 ? -1 : 1 + stems.indexOf(s))) ok = false;
    if (!ok) continue; curls.push({ pts, w: wsx }); pts.forEach((p, k) => k > 8 && k % 2 === 0 && occAdd(p, wsx[k])); }
  // 8. the gaps filled: wherever the black still opens wider than a little more than the letter's channel, a shoot is grown
  // into it from the nearest stem it can see (or from the letter, if no stem is near), carrying a leaf, a curl or a small
  // flower; then again into the next widest, until none is left. Dw: how far each cell stands from the nearest white.
  const Dw = new Float32Array(W * H).fill(.028), tried = new Uint8Array(W * H);
  const stamp = (x, y, rr) => { const ext = rr + .028, i0 = Math.max(0, (x - ext) * R | 0), i1 = Math.min(W - 1, (x + ext) * R | 0), j0 = Math.max(0, (y - ext) * R | 0), j1 = Math.min(H - 1, (y + ext) * R | 0);
    for (let j = j0; j <= j1; j++) { const dy = (j + .5) / R - y; for (let i = i0; i <= i1; i++) { const dx = (i + .5) / R - x, d = Math.sqrt(dx * dx + dy * dy) - rr, q = j * W + i; if (d < Dw[q]) Dw[q] = d; } } };
  const add = (p, rr, who) => { occAdd(p, rr, who); stamp(p[0], p[1], rr); };
  discs.forEach(e => stamp(e[0], e[1], e[2]));
  const GT = CHL * .95;
  const rootCands = []; for (let j = 0; j < H; j += 2) for (let i = 0; i < W; i += 2) { const q = j * W + i, p = [(i + .5) / R, (j + .5) / R]; if (F[q] >= T && F[q] < T + .006 && (OPT.edge !== false || byLetter(p))) rootCands.push([p, !byLetter(p) ? 7 : stout(p) ? 2.4 : 3.2, byLetter(p)]); }   // (and, last of all, from the frame: a stem coming in from behind the block's edge)
  const tangentAt = (st, i) => { const a = st.pts[Math.max(0, i - 2)], b = st.pts[Math.min(st.pts.length - 1, i + 2)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  // (the stems' points, in a grid of .05 cells, for finding a shoot's source near a gap)
  const pgrid = new Map(), PG = .05, pgAdd = k => { const st = stems[k]; for (let i = 1; i < st.pts.length - 1; i += 3) { const p = st.pts[i], key = (p[0] / PG | 0) * 977 + (p[1] / PG | 0); (pgrid.get(key) ?? pgrid.set(key, []).get(key)).push([k, i]); } };
  stems.forEach((_, k) => pgAdd(k));
  const open = new Int32Array(W * H); let nOpen = 0; for (let j = 0; j < H; j += 2) for (let i = 0; i < W; i += 2) { const q = j * W + i; if (F[q] >= .004) open[nOpen++] = q; }
  for (let pass = 0; pass < (OPT.fills ?? 260); pass++) {
    // (the cells still open, kept in a list that only shrinks as the gaps fill)
    let qb = -1, eb = 0; for (let m = 0; m < nOpen;) { const q = open[m], e = Math.min(Dw[q], F[q] + CHL), gl = GT; if (tried[q] || e <= gl) { open[m] = open[--nOpen]; continue; } if (e - gl > eb) { eb = e - gl; qb = q; } m++; }
    if (qb >= 0) eb = Math.min(Dw[qb], F[qb] + CHL);
    if (qb < 0) break;
    const P0 = [(qb % W + .5) / R, ((qb / W | 0) + .5) / R], rad = eb;
    const giveUp = () => { const rr = Math.max(2, rad * .9 * R); for (let j = Math.max(0, (qb / W | 0) - rr | 0); j <= Math.min(H - 1, (qb / W | 0) + rr); j++) for (let i = Math.max(0, qb % W - rr | 0); i <= Math.min(W - 1, qb % W + rr); i++) if ((i - qb % W) ** 2 + (j - (qb / W | 0)) ** 2 <= rr * rr) tried[j * W + i] = 1; };
    // the sources it could spring from, nearest first: a point of a stem, or the letter's edge (a little further reckoned)
    const src = [];
    for (const RS of [.2, .32]) { if (src.length > 4) break; src.length = 0;
    for (let i = (P0[0] - RS) / PG | 0; i <= (P0[0] + RS) / PG; i++) for (let j = (P0[1] - RS) / PG | 0; j <= (P0[1] + RS) / PG; j++) for (const [k, ii] of pgrid.get(i * 977 + j) ?? []) { const p = stems[k].pts[ii], d = Math.hypot(p[0] - P0[0], p[1] - P0[1]); if (d < RS) src.push([d, k, ii]); } }
    rootCands.forEach(([p, w, onL]) => { const d = Math.hypot(p[0] - P0[0], p[1] - P0[1]); if (d < .26) src.push([d * w + (onL ? 0 : 1), onL ? -1 : -2, p]); });
    src.sort((x, y) => x[0] - y[0]);
    const kind = rad > .05 && flowers.length < 2 ? 'rose' : rad > .03 && r() < .25 ? 'curl' : 'leaf';
    let done = false;
    for (const [, k, i] of src.slice(0, 40)) { if (done) break;
      const S = k >= 0 ? stems[k].pts[i] : i; if (!sees(S, P0)) continue;
      const len = kind === 'rose' ? 0 : Math.min(2.1 * LK, Math.max(.024, rad * 1.7)), fr = kind === 'rose' ? Math.min(rad - GAP * .6, .042) : 0;
      const a = Math.atan2(P0[1] - S[1], P0[0] - S[0]), Bt = kind === 'rose' ? [P0[0] - Math.cos(a) * (fr + .003), P0[1] - Math.sin(a) * (fr + .003)] : kind === 'curl' ? [P0[0] - Math.cos(a) * rad * .45, P0[1] - Math.sin(a) * rad * .45] : [P0[0] - Math.cos(a) * len * .5, P0[1] - Math.sin(a) * len * .5];
      const d = Math.hypot(Bt[0] - S[0], Bt[1] - S[1]); if (d < (k < 0 ? .035 : .008)) continue;
      let t = k >= 0 ? tangentAt(stems[k], i) : grad(S);
      // (from the letter, a shoot leaves along the stroke, at a shallow angle to it, and curves out: never a rung straight off it)
      if (k < 0) { const g = t, u = [-g[1], g[0]], sg = u[0] * (Bt[0] - S[0]) + u[1] * (Bt[1] - S[1]) >= 0 ? 1 : -1, c1 = Math.cos(1.05), s1 = Math.sin(1.05); t = [g[0] * c1 + u[0] * sg * s1, g[1] * c1 + u[1] * sg * s1]; }
      if (t[0] * (Bt[0] - S[0]) + t[1] * (Bt[1] - S[1]) < 0) { if (k < 0) continue; t = [-t[0], -t[1]]; }
      if (k >= 0 && (t[0] * (Bt[0] - S[0]) + t[1] * (Bt[1] - S[1])) / d < .15) continue;   // (a shoot leaves its stem at a shallow angle, or not from there)
      const bow = (r() - .5) * .5 * d, C1 = [S[0] + t[0] * d * .45 - t[1] * bow, S[1] + t[1] * d * .45 + t[0] * bow], n = Math.max(3, Math.ceil(d / .004)), w0 = k >= 0 ? Math.min(stems[k].w[i] * .8, HW1 * .65) : HW1 * .45, pts = [], ws = [];
      for (let j = 0; j <= n; j++) { const u = j / n, v = 1 - u; pts.push([v * v * S[0] + 2 * v * u * C1[0] + u * u * Bt[0], v * v * S[1] + 2 * v * u * C1[1] + u * u * Bt[1]]); ws.push(w0 + (HW0 - w0) * u); }
      const own = k >= 0 ? stems[k].w[i] : 0; let ok = true;
      for (let j = 1; j <= n && ok; j++) { const p = pts[j], far = Math.hypot(p[0] - S[0], p[1] - S[1]) > own + ws[j] + GAP * .7; if (C(p) < ws[j] + .002 || far && !occFree(p, ws[j] + GAP * .6)) ok = false; }
      if (!ok) continue;
      // what it carries
      const end = pts[n], ea = Math.atan2(end[1] - pts[n - 1][1], end[0] - pts[n - 1][0]); let mark = null;
      if (kind === 'rose') { const c = [end[0] + Math.cos(ea) * (fr + .002), end[1] + Math.sin(ea) * (fr + .002)]; if (C(c) > fr - .004 && occFree(c, fr + GAP * .6)) mark = () => { flowers.push({ ...rosette(r), c, rad: fr, a: ea }); add(c, fr); }; }
      else if (kind === 'curl') { const sg = r() < .5 ? 1 : -1, L = rad * 2.4, cp = tendril(end, ea, L, sg * 5, sg * Math.min(90, 2.6 / rad), 1.2, .0025);
        if (cp.slice(4).every(p => C(p) > .002 && occFree(p, HW0 + GAP * .5))) mark = () => { curls.push({ pts: cp, w: cp.map((_, j) => HW0 * (1 - .3 * j / cp.length)), ball: HW0 * 1.8 }); cp.forEach((q, j) => j % 3 || add(q, HW0)); }; }
      else if (rad > .042 && (put = add, sprig(end, ea, Math.min(LK * 2.6, rad * 2.2), r() < .5 ? 1 : -1))) mark = () => {};
      else { const sh = leafShape(r, (r() < .5 ? 1 : -1) * (.18 + r() * .14));
        for (const [da, f] of [[0, 1], [.3, 1], [-.3, 1], [.6, .85], [-.6, .85], [0, .7], [.9, .7], [-.9, .7], [1.3, .65], [-1.3, .65], [1.6, .55], [-1.6, .55], [0, .45], [.8, .45], [-.8, .45], [1.4, .4], [-1.4, .4]]) { const o = lay(sh.outline, end, ea + da, Math.max(.018, len * f));
          if (o.every((p, j) => j % 2 || Math.hypot(p[0] - end[0], p[1] - end[1]) < len * f * .22 || C(p) > -.002 && occFree(p, GAP * .55))) { const aa = ea + da, L2 = Math.max(.018, len * f);
            mark = () => { leaves.push({ outline: o, rib: lay(sh.axis.slice(2, 15), end, aa, L2), W: sh.W * L2 }); for (let tt = .25; tt <= .95; tt += .14) add([end[0] + Math.cos(aa) * L2 * tt, end[1] + Math.sin(aa) * L2 * tt], L2 * .17); }; break; } } }
      if (!mark) { const sg = r() < .5 ? 1 : -1, cp = tendril(end, ea, .05, sg * 6, sg * 70, 1.2, .0025);
        if (cp.slice(4).every(p => C(p) > .002 && occFree(p, HW0 * .8 + GAP * .5))) mark = () => { curls.push({ pts: cp, w: cp.map((_, j) => HW0 * .8 * (1 - .3 * j / cp.length)), ball: HW0 * 1.6 }); cp.forEach((q, j) => j % 3 || add(q, HW0 * .8)); }; }
      if (!mark) continue;
      // a shoot from the letter: its foot drawn back across the channel to the white
      if (k === -1) { const g = grad(S); let e = 0; while (e < .06 && Fxy(S[0] - g[0] * e, S[1] - g[1] * e) > -CHL + 1e-4) e += .003; e += .003;
        for (let j = 1, m = Math.ceil(e / .004); j <= m; j++) { pts.unshift([S[0] - g[0] * e * j / m, S[1] - g[1] * e * j / m]); ws.unshift(w0); } }
      { const [hp, hw] = hand(pts, ws, stems.length + 1); pts.splice(0, pts.length, ...hp); ws.splice(0, ws.length, ...hw); }
      stems.push({ pts, w: ws, root: k < 0 }); pgAdd(stems.length - 1); pts.forEach((p, j) => j % 2 || add(p, ws[j], stems.length)); mark(); done = true; FIL++; }
    if (!done) { giveUp(); FAI++; }
  }
  // dots, only in the small black left over
  const dots = [];   // (no scattered dots: the black left over stays black; every white thing is placed by the design)
  // 9. the square: its cut edge wanders a hair
  const sq = [], ew = noise1(seed ^ 0x2f), per = 2 * (AW + HB);
  for (let s = 0; s < per; s += .01) { let x, y, nx, ny; if (s < AW) { x = s; y = 0; nx = 0; ny = -1; } else if (s < AW + HB) { x = AW; y = s - AW; nx = 1; ny = 0; } else if (s < 2 * AW + HB) { x = AW - (s - AW - HB); y = HB; nx = 0; ny = 1; } else { x = 0; y = HB - (s - 2 * AW - HB); nx = -1; ny = 0; }
    const e = (ew(s * 14) - .5) * .0026; sq.push([x + nx * e, y + ny * e]); }
  const bare = [...need.keys()].some(id => marks.filter(m => m.comp0 === id).length >= 3 && !reached.some(m => m.comp0 === id));
  return { stats: { grown: marks.filter(m => m.node !== undefined).length, marks: marks.length, reached: reached.length, sprigs: SPR, fills: FIL, fails: FAI, kinds: marks.reduce((o, m) => (o[m.kind] = (o[m.kind] ?? 0) + 1, o), {}), full: !bare && reached.length >= marks.length * .5 }, ch, seed, letter: L, square: sq, stems, curls, leaves, flowers, dots, heroes };
}

// ---- drawing ----------------------------------------------------------------------------------------------------------------
// a stroke's outline: its two edges at its half-widths, a round end at its free tip; widths held to a device px or so
function strokeOutline(P, pts, ws, minHW, roundEnd = true) {
  const n = pts.length; if (n < 2) return;
  const Lf = [], Rt = [];
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, hw = Math.max(minHW, ws[i]);
    Lf.push([pts[i][0] - dy / l * hw, pts[i][1] + dx / l * hw]); Rt.push([pts[i][0] + dy / l * hw, pts[i][1] - dx / l * hw]); }
  ringPath(P, Lf, false);
  if (roundEnd) { const e = pts[n - 1], a0 = Math.atan2(Lf[n - 1][1] - e[1], Lf[n - 1][0] - e[0]), hw = Math.max(minHW, ws[n - 1]); P.arc(e[0], e[1], hw, a0, a0 - Math.PI, true); }
  for (let i = n - 1; i >= 0; i--) P.lineTo(Rt[i][0], Rt[i][1]); P.closePath();
}
export function drawGarden(c, geo, x, y, h, res = 1, sil = false) {   // (sil: the white drawn in ink on the paper, and no block)
  const px = 1 / (h * res);   // one device px, in block units
  c.save(); c.translate(x, y); c.scale(h, h);
  c.fillStyle = '#000';
  if (!sil) { const sq = new Path2D(); ringPath(sq, geo.square); c.globalCompositeOperation = 'source-over'; c.fill(sq); geo.ground?.forEach(g => { const P = new Path2D(); ringPath(P, g); c.fill(P); }); }   // (ground: more of the block's black, a cartouche's arms)
  c.globalCompositeOperation = sil ? 'source-over' : 'destination-out';
  const Lp = new Path2D(); geo.letter.forEach(q => ringPath(Lp, q)); c.fill(Lp, geo.wind ?? 'evenodd');
  // (each shape filled on its own: two outlines that overlap with opposite windings would cancel in one nonzero path)
  const minHW = .6 * px, fill = f => { const P = new Path2D(); f(P); c.fill(P); };
  geo.stems.forEach(s => fill(P => strokeOutline(P, s.pts, s.w, minHW, false)));
  // (a hollow stem: the paper left inside its outline, cut before its leaves and stalks are laid over the joins)
  if (geo.hollow) { const op = c.globalCompositeOperation; c.globalCompositeOperation = sil ? 'destination-out' : 'source-over'; geo.hollow.forEach(s => fill(P => strokeOutline(P, s.pts, s.w, minHW * .5, false))); c.globalCompositeOperation = op; }
  geo.curls.forEach(s => { fill(P => strokeOutline(P, s.pts, s.w, minHW * .9, true)); if (s.ball) fill(P => { const e = s.pts.at(-1); P.arc(e[0], e[1], Math.max(s.ball, minHW * 1.6), 0, 6.2832); }); });
  geo.leaves.forEach(l => fill(P => ringPath(P, l.outline)));
  for (const f of geo.flowers) { if (f.petals) { f.petals.forEach(p => fill(P => ringPath(P, p.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad])))); fill(P => ringPath(P, f.eye.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad]))); }
    else fill(P => ringPath(P, f.outline)); }
  geo.dots.forEach(d => fill(P => P.arc(d.p[0], d.p[1], Math.max(d.rad, 1.2 * px), 0, 6.2832)));
  // the fine black cuts: a leaf's midrib, a tulip's partings (only where the leaf is wide enough to hold one)
  c.globalCompositeOperation = sil ? 'destination-out' : 'source-over'; c.strokeStyle = '#000'; c.lineCap = 'round'; c.lineWidth = Math.max(.75 * px, .0028);
  const K = new Path2D();
  geo.leaves.forEach(l => { if (l.rib && l.W > 5 * px) ringPath(K, l.rib, false); });
  geo.flowers.forEach(f => f.cuts?.forEach(q => ringPath(K, spline(q, 6), false)));
  c.stroke(K);
  const KR = new Path2D(); let rw = 0;
  geo.flowers.forEach(f => { if (!f.petals) return; rw = Math.max(.9 * px, f.rad * .06); f.petals.forEach(p => ringPath(KR, p.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad]))); ringPath(KR, f.eye.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad])); });
  if (rw) { c.lineWidth = rw; c.lineJoin = 'round'; c.stroke(KR); }
  c.restore();
}

// ---- the page's other ornaments, grown in the same hand --------------------------------------------------------------------
// Line ornament in ink on the paper (the initial's leaves, stems, curls, rosette and tulip, now solid in the ink, their
// midribs and partings cut fine in the paper): a line-filler, a break band, the vine down a quotation, a frame's corner,
// a paraph leaf. Geometry in page px about the ornament's own box (0..w, 0..h); made once a size and seed.
//   ornament(kind, w, h, seed, opt) -> { w, h, draw(c, x, y) }   kinds: 'filler' 'band' 'vine' 'corner' 'leaf'
const orns = new Map();
const quad = (P0, P1, P2, n) => { const o = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; o.push([v * v * P0[0] + 2 * v * u * P1[0] + u * u * P2[0], v * v * P0[1] + 2 * v * u * P1[1] + u * u * P2[1]]); } return o; };
export function ornament(kind, w, h, seed, opt = {}) {
  const key = [kind, w.toFixed(1), h.toFixed(1), seed, JSON.stringify(opt)].join('|'); if (orns.has(key)) return orns.get(key);
  if (kind !== 'leaf') { const o = morris(kind, w, h, seed, opt); orns.set(key, o); return o; }
  const r = stream(seed, 'orn-' + kind), S = [], Lv = [], Fl = [], Bl = [], Cut = [], u = opt.u ?? h;
  LW = .27;
  const stem = (pts, w0, w1) => S.push({ pts, w: pts.map((_, i) => (w0 + (w1 - w0) * Math.pow(i / Math.max(1, pts.length - 1), .9)) / 2) });   // (w0, w1: widths; the outline takes half-widths)
  const leaf = (b, a, L, sd) => { const sh = leafShape(r, sd * (.12 + r() * .14)); Lv.push({ o: lay(sh.outline, b, a, L), rib: lay(sh.axis.slice(2, 15), b, a, L), L }); };
  // a leaf on a short petiole curving off a stem at p (heading a), to side sd
  const sprig = (p, a, sd, L, wp) => { const a0 = a + sd * .95, a1 = a + sd * .55, pl = L * .32, P2 = [p[0] + Math.cos(a1) * pl, p[1] + Math.sin(a1) * pl], P1 = [p[0] + Math.cos(a0) * pl * .55, p[1] + Math.sin(a0) * pl * .55];
    stem(quad(p, P1, P2, 8), wp, wp * .75); leaf(P2, a1 + sd * .05, L, -sd); };
  const curl = (p, a, L, sg, rEnd, w0) => { const pts = tendril(p, a, L, sg * .4 / L, sg / rEnd, 1.3, Math.max(.25, L / 60)); stem(pts, w0, w0 * .55); Bl.push([pts.at(-1), w0 * 1.15]); return pts; };
  const tangent = (pts, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  if (kind === 'filler') {
    // a slim stem along the line, leaves alternating above and below it, ending in a curl or (richer) a bud
    const mid = h * .5, endRoom = opt.bud ? h * .9 : h * 1.1, x1 = w - endRoom, ph = r() * 6.28, sw = h * .06, pts = [];
    for (let x = h * .1; x <= x1; x += .5) pts.push([x, mid + Math.sin(x / (h * 2.4) * Math.PI + ph) * h * .09]);
    if (pts.length < 4) return null;
    stem(pts, sw, sw * .6); Bl.push([pts[0], sw * 1.1]);
    let sd = r() < .5 ? 1 : -1;
    for (let x = h * 1.1 + r() * h * .5; x < x1 - h * .6; x += h * (2.1 + r() * .6)) { const i = Math.round((x - h * .1) / .5), p = pts[Math.min(pts.length - 1, i)], a = tangent(pts, i);
      sprig(p, a, sd, h * (1.05 + r() * .2), sw * .75); sd = -sd; }
    const e = pts.at(-1), ae = tangent(pts, pts.length - 1);
    if (opt.bud) { const t = tulip(r), L = h * .95, aa = ae - .5; Fl.push({ o: lay(t.outline, e, aa, L), cuts: t.cuts.map(q => lay(q, e, aa, L)) }); }
    else curl(e, ae, h * 1.25, -1, h * .2, sw * .6);
  } else if (kind === 'band') {
    // a break: a rosette (or a bud cluster) at the centre; from it, each way, a scroll that sweeps out in a wave and winds in
    // to a fine curl, leaves alternating along it, larger near the centre; the two sides grown apart (balanced, not mirrored)
    const cx = w / 2, cy = h / 2, rank = opt.rank ?? 1, rad = h * (rank > 1 ? .26 : .22), sw = h * (rank > 1 ? .055 : .05);
    if (opt.centre === 'bud') { for (const [aa, L] of [[-Math.PI / 2, h * .62], [-Math.PI / 2 - .6, h * .42], [-Math.PI / 2 + .6, h * .42]]) { const t = tulip(r), b = [cx, cy + h * .12]; Fl.push({ o: lay(t.outline, b, aa, L), cuts: t.cuts.map(q => lay(q, b, aa, L)) }); } }
    else Fl.push({ c: [cx, cy], rad, ...rosette(r) });
    for (const side of [1, -1]) {
      const half = w / 2 - rad - h * .55, x0 = cx + side * (rad + h * .05), pts = [], ph = r() * .4;
      for (let s = 0; s <= half; s += .5) { const f = s / half; pts.push([x0 + side * s, cy + Math.sin(f * Math.PI * (rank > 1 ? 1.6 : 1.3) + ph) * h * .2 * (1 - f * .35)]); }
      stem(pts, sw, sw * .45);
      const e = pts.at(-1), ae = tangent(pts, pts.length - 1), sg = (Math.sin(Math.PI * (rank > 1 ? 1.6 : 1.3) + ph) > 0 ? -1 : 1) * side;
      curl(e, ae, h * (rank > 1 ? 1.15 : .95), sg, h * .11, sw * .45);
      let sd = side > 0 ? -1 : 1;
      for (let s = h * .3, n = 0; s < half - h * .25; s += h * (rank > 1 ? .4 : .46), n++) { const i = Math.round(s / .5), f = s / half, p = pts[i], a = tangent(pts, i);
        if (n % 4 === 3) { const sg2 = sd, cp = tendril(p, a + sd * .9, h * .55 * (1 - f * .4), sg2 * .5 / h, sg2 * 9 / h, 1.3, .3); stem(cp, sw * .6, sw * .35); Bl.push([cp.at(-1), sw * .55]); }
        else sprig(p, a, sd, h * (.5 - .22 * f) * (rank > 1 ? 1.08 : 1), sw * (.8 - .35 * f));
        sd = -sd; }
      if (rank > 1) { const i = Math.round(half * .55 / .5), p = pts[i], a = tangent(pts, i), sd2 = -sd, L = h * .45, P2 = [p[0] + Math.cos(a + sd2 * .9) * h * .32, p[1] + Math.sin(a + sd2 * .9) * h * .32];
        stem(quad(p, [p[0] + Math.cos(a + sd2 * .4) * h * .15, p[1] + Math.sin(a + sd2 * .4) * h * .15], P2, 8), sw * .55, sw * .45); const t = tulip(r), aa = a + sd2 * 1.1; Fl.push({ o: lay(t.outline, P2, aa, L), cuts: t.cuts.map(q => lay(q, P2, aa, L)) }); }
    }
  } else if (kind === 'vine') {
    // down a quotation's margin: a stem the whole height, wandering a little, leaves alternating (the outer ones larger),
    // its head curling out into a leaf and its foot into a curl. w: the margin's width; x of the stem at .62 w
    const wob = noise1(seed * 3 + 1), sx = w * .62, sw = u * .12, pts = [];
    for (let y = u * .9; y <= h - u * .9; y += .5) pts.push([sx + (wob(y / (u * 4)) - .5) * u * .45, y]);
    if (pts.length < 4) return null;
    stem(pts, sw, sw * .8);
    curl(pts[0], -Math.PI / 2, u * 1.6, -1, u * .28, sw * .9); leaf([pts[0][0] - u * .1, pts[0][1] - u * .2], -Math.PI / 2 - .9, u * 1.1, 1);
    curl(pts.at(-1), Math.PI / 2, u * 1.4, 1, u * .25, sw * .8);
    let sd = -1;
    for (let y = u * 2.2; y < h - u * 2.4; y += u * (1.9 + r() * .6)) { const i = Math.round((y - u * .9) / .5), p = pts[Math.min(pts.length - 1, i)], a = tangent(pts, i);
      const outer = (sd > 0) === (a > 0);   // (the side away from the text)
      sprig(p, a, sd, u * (outer ? 1.15 : .75) * (.9 + r() * .2), sw * .8); sd = -sd; }
  } else if (kind === 'corner') {
    // a frame's corner: from the corner a short curl along each edge with a leaf or two, a bud on the diagonal (drawn for
    // the top left; the frame turns it for the others). w = h = the spray's reach
    const s = w, sw = s * .05;
    for (const [a, sg] of [[0, 1], [Math.PI / 2, -1]]) { const pts = tendril([s * .1, s * .1], a, s * .9, 0, sg * 9 / s, 4, .4); stem(pts, sw * 1.6, sw * .7); Bl.push([pts.at(-1), sw * .7]);
      const i = Math.round(pts.length * .45); sprig(pts[i], tangent(pts, i), sg, s * .3, sw); }
    const t = tulip(r), b = [s * .1, s * .1], aa = Math.PI / 4; Fl.push({ o: lay(t.outline, b, aa, s * .34), cuts: t.cuts.map(q => lay(q, b, aa, s * .34)) });
  } else if (kind === 'leaf') {
    // a paraph: one leaf on a curled stalk, rising to the right
    const b = [w * .28, h * .82], sw = h * .07, pts = tendril([w * .05, h * .95], -.3, w * .28, -2 / w, -10 / w, 1.3, .3);
    stem(pts, sw * .8, sw); leaf(pts.at(-1), -.85, h * .95, 1); Bl.push([pts[0], sw * .9]);
  }
  const o = { w, h, draw(c, x, y) {
    c.save(); c.translate(x, y); c.fillStyle = '#000'; c.globalCompositeOperation = 'source-over';
    for (const s of S) { const P = new Path2D(); strokeOutline(P, s.pts, s.w, .45, true); c.fill(P); }
    for (const l of Lv) { const P = new Path2D(); ringPath(P, l.o); c.fill(P); }
    for (const [p, rr] of Bl) { c.beginPath(); c.arc(p[0], p[1], rr, 0, 6.2832); c.fill(); }
    for (const f of Fl) { if (f.petals) { for (const pt of f.petals) { const P = new Path2D(); ringPath(P, pt.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad])); c.fill(P); } const E = new Path2D(); ringPath(E, f.eye.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad])); c.fill(E); }
      else { const P = new Path2D(); ringPath(P, f.o); c.fill(P); } }
    // the cuts, in the paper: midribs, the rosette's partings, the tulip's
    c.globalCompositeOperation = 'destination-out'; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#000';
    for (const l of Lv) if (l.L > 7) { c.lineWidth = Math.max(.6, l.L * .045); const P = new Path2D(); ringPath(P, l.rib, false); c.stroke(P); }
    for (const f of Fl) { if (f.petals) { c.lineWidth = Math.max(.6, f.rad * .07); for (const pt of f.petals) { const P = new Path2D(); ringPath(P, pt.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad])); c.stroke(P); }
        const E = new Path2D(); ringPath(E, f.eye.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad])); c.stroke(E); }
      else if (f.cuts) { c.lineWidth = .7; for (const q of f.cuts) { const P = new Path2D(); ringPath(P, spline(q, 6), false); c.stroke(P); } } }
    c.restore(); } };
  orns.set(key, o); if (orns.size > 200) orns.delete(orns.keys().next().value);
  return o;
}

// ---- the line ornaments in Morris's manner -----------------------------------------------------------------------------------
// One family with the initials (the same pointed leaf, rosette and tulip, the same impression), drawn as his breaks are: the
// main stems in outline (a fine double contour, the paper inside), crossing over and under (each later stretch breaks those
// beneath it with a narrow paper halo), many fine solid tendrils curling to points, buds, lobed vine leaves, grapes, and the
// weight at the middle tapering out to fine curls at the ends. Ops are laid in order: a halo (paper), an ink fill, a cut.
const trochoid = (a, b, t0, t1, ds, c = b) => { const o = []; for (let t = t0; t <= t1 + 1e-9; t += ds) o.push([a * t - b * Math.sin(t), -c * Math.cos(t)]); return o; };
function vineLeaf(r, n = 5) {
  // a lobed vine leaf, base at (0,0), its middle lobe toward +x: lobes at 0, ±.85, ±1.65 rad, each drawn out to a point
  const lobes = [[0, 1], [.85, .78 + r() * .08], [-.85, .78 + r() * .08], [1.65, .5 + r() * .08], [-1.65, .5 + r() * .08]].slice(0, n), P = [];
  for (let i = 0; i <= 90; i++) { const ph = -2.3 + 4.6 * i / 90;
    let m = .38 * Math.cos(Math.min(1.5, Math.abs(ph) * .55));
    for (const [c, L] of lobes) { const d = Math.abs(ph - c); m = Math.max(m, L * (d < .5 ? 1 - Math.pow(d / .5, 1.4) * .62 : .38 * Math.max(0, 1 - (d - .5) * 2))); }
    P.push([Math.cos(ph) * m * .62, Math.sin(ph) * m * .62]); }
  return { outline: P.map(([x, y]) => [x + .32, y]), veins: lobes.map(([c, L]) => [[.06, 0], [.32 + Math.cos(c) * L * .45, Math.sin(c) * L * .45]]) };
}
function morris(kind, w, h, seed, opt) {
  const r = stream(seed, 'morris-' + kind), ops = [], u = opt.u ?? h; LW = .26;
  const tang = (pts, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  const at = (pts, f) => { const i = Math.max(0, Math.min(pts.length - 1, Math.round(f * (pts.length - 1)))); return [pts[i], tang(pts, i), i]; };
  // an outlined stem: laid in stretches, each overlapping the last, so where it crosses itself the later stretch goes over
  const ostem = (pts, w0, w1, wall, gap, from = 0) => { const n = pts.length, W = pts.map((_, i) => (w0 + (w1 - w0) * i / Math.max(1, n - 1)) / 2), step = 60;
    for (let i0 = 0; i0 < n - 1; i0 += step) { const i1 = Math.min(n - 1, i0 + step + 4), a = Math.max(0, i0 - 3), seg = pts.slice(a, i1 + 1), sw = W.slice(a, i1 + 1);
      if (i0 >= from) ops.push({ halo: seg, w: sw.map(x => x + gap) }); ops.push({ fill: seg, w: sw }); ops.push({ cut: seg, w: sw.map(x => Math.max(0, x - wall)) }); }
    return pts; };
  const tstem = (pts, w0, w1, ball = 0) => { ops.push({ fill: pts, w: pts.map((_, i) => (w0 + (w1 - w0) * i / Math.max(1, pts.length - 1)) / 2), round: 1 }); if (ball) ops.push({ disc: pts.at(-1), r: ball }); return pts; };
  const tend = (p, a, L, sg, rEnd, w0) => tstem(tendril(p, a, L, sg * .3 / L, sg / rEnd, 1.4, Math.max(.25, L / 70)), w0, w0 * .4, w0 * .45);
  const OL = v => v > 7;   // (outlined when it is big enough to hold a contour and the paper inside it)
  const leaf = (b, a, L, sd) => { const sh = leafShape(r, sd * (.12 + r() * .16)), P = lay(sh.outline, b, a, L), rib = lay(sh.axis.slice(1, 17), b, a, L);
    if (OL(L)) ops.push({ opoly: P, lw: Math.max(.6, L * .06), inner: [rib] }); else { ops.push({ poly: P }); if (L > 6) ops.push({ line: rib, lw: Math.max(.55, L * .045) }); } };
  const stalkLeaf = (p, a, sd, L, wst) => { const a1 = a + sd * .7, q = [p[0] + Math.cos(a1) * L * .28, p[1] + Math.sin(a1) * L * .28]; tstem(quad(p, [p[0] + Math.cos(a + sd * .3) * L * .15, p[1] + Math.sin(a + sd * .3) * L * .15], q, 8), wst, wst * .7); leaf(q, a1 + sd * .1, L, -sd); };
  const vleaf = (b, a, L) => { const v = vineLeaf(r); ops.push({ opoly: lay(v.outline, b, a, L), lw: Math.max(.6, L * .05), inner: v.veins.map(q => lay(q, b, a, L)) }); };
  const grapes = (p, a, g) => { // a hanging bunch: rows of berries narrowing to a point, each a ring with its light cut
    const ca = Math.cos(a), sa = Math.sin(a); let k = 0;
    for (const [row, n] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]]) for (let j = 0; j < n; j++) { const x = row * g * 1.6 + g, y = (j - (n - 1) / 2) * g * 1.9 + (row % 2 ? g * .2 : 0), c = [p[0] + x * ca - y * sa, p[1] + x * sa + y * ca];
      ops.push({ cutdisc: c, r: g * 1.15 }); ops.push({ disc: c, r: g }); ops.push({ cutdisc: c, r: Math.max(0, g - Math.max(.6, g * .28)) }); ops.push({ disc: [c[0] - g * .2, c[1] - g * .25], r: g * .2 }); k++; } };
  const bud = (b, a, L) => { const t = tulip(r), P = lay(t.outline, b, a, L), cuts = t.cuts.map(q => spline(lay(q, b, a, L), 6));
    if (OL(L)) ops.push({ opoly: P, lw: Math.max(.6, L * .055), inner: cuts }); else { ops.push({ poly: P }); for (const q of cuts) ops.push({ line: q, lw: .6 }); } };
  const rose = (c, rad) => { const f = rosette(r); for (const pt of f.petals) { const P = pt.map(q => [c[0] + q[0] * rad, c[1] + q[1] * rad]); if (OL(rad * 1.4)) ops.push({ opoly: P, lw: Math.max(.6, rad * .09), inner: [] }); else { ops.push({ poly: P }); ops.push({ ring: P, lw: Math.max(.6, rad * .1) }); } }
    ops.push({ disc: c, r: rad * .26 }); ops.push({ cutdisc: c, r: rad * .13 }); };
  if (kind === 'band') {
    // a break: the centre (a rosette, or a cluster of buds), and from it each way a main stem in outline that loops once (or,
    // for a book, twice) through itself and runs on to a fine curl; tendrils, leaves and buds off its loops; for a book,
    // vine leaves and a bunch of grapes hanging from it
    const cx = w / 2, cy = h * .48, rank = opt.rank ?? 1, big = rank > 1, rad = h * (big ? .2 : .19), loops = big ? 2 : 1;
    for (const side of [1, -1]) {
      const span = w / 2 - rad - h * .55, a = span * .62 / (2 * Math.PI * loops) * (1 + (r() - .5) * .06), bx = a * 3.4, cy2 = h * (big ? .17 : .19);
      let P = trochoid(a, bx, Math.PI, Math.PI * (1 + 2 * loops), .01, cy2);   // (wide, flat loops: his figure-of-eight knot)
      const x0 = P[0][0], y0 = P[0][1]; P = P.map(([x, y]) => [cx + side * (x - x0 + rad * .8), cy + (y - y0) * .95 + rad * .45]);
      // runs on from the last loop's foot, rising, to a spiral curl
      const e = P.at(-1), ae = tang(P, P.length - 1), run = tendril(e, ae, span * .5, side * -.3 / span, side * -1 / (h * .075), 2.2, .4);
      const main = [...P, ...run.slice(1)];
      ostem(main, h * (big ? .085 : .075), h * .035, Math.max(.6, h * .016), Math.max(.8, h * .022), 2);
      ops.push({ disc: main.at(-1), r: h * .025 });
      // off the loops: a tendril curling out from each loop's top, a leaf on each side of its waist, a bud at the outer end
      for (let k = 0; k < loops; k++) { const f = (k + .5) / loops * P.length / main.length; const [pt, ta] = at(main, f);
        tend(pt, ta + side * 1.1, h * .3, side, h * .05, h * .028);
        const [q1, t1] = at(main, ((k + .15) / loops) * P.length / main.length), [q2, t2] = at(main, ((k + .85) / loops) * P.length / main.length);
        stalkLeaf(q1, t1, side, h * .3 * (1 + (r() - .5) * .2), h * .022); stalkLeaf(q2, t2, -side, h * .28 * (1 + (r() - .5) * .2), h * .022); }
      const [qb, tb] = at(main, .8); bud(qb, tb + side * .9 * (r() < .5 ? 1 : -1) - (side < 0 ? 0 : 0), h * .32);
      const [qt, tt] = at(main, .9); tend(qt, tt + side * .8, h * .25, side, h * .04, h * .022);
      if (big) { const [qv, tv] = at(main, .38); vleaf(qv, Math.PI / 2 - side * .35, h * .46); const [qg] = at(main, .62); grapes([qg[0], qg[1] + h * .02], Math.PI / 2 + side * .15, h * .042);
        const [qv2, tv2] = at(main, .15); vleaf(qv2, -Math.PI / 2 + side * .5, h * .38); }
    }
    if (opt.centre === 'bud') { for (const [aa, L] of [[-Math.PI / 2, h * .5], [-Math.PI / 2 - .7, h * .34], [-Math.PI / 2 + .7, h * .34]]) bud([cx, cy + h * .08], aa, L); ops.push({ disc: [cx, cy + h * .1], r: h * .05 }); }
    else rose([cx, cy], rad);
  } else if (kind === 'filler') {
    // a fine stem along the line (in outline where it is wide enough to hold one), leaves and curls off it at uneven
    // intervals, never a pattern; it ends in a curl or a bud
    const mid = h * .5, x1 = w - h * (opt.bud ? 1 : 1.2), ph = r() * 6.28, pts = [];
    for (let x = h * .1; x <= x1; x += .5) pts.push([x, mid + Math.sin(x / (h * 2.6) * Math.PI + ph) * h * .1 + Math.sin(x / (h * 7.1) + ph * 2) * h * .06]);
    if (pts.length < 6) return null;
    const ow = h * .2; if (ow > 2.6) ostem(pts, ow, ow * .7, .65, .7, 1e9); else tstem(pts, h * .1, h * .07);
    let x = h * (1 + r() * .6), sd = r() < .5 ? 1 : -1;
    while (x < x1 - h * .7) { const i = Math.round((x - h * .1) / .5), p = pts[Math.min(pts.length - 1, i)], a = tang(pts, i), pick = r();
      if (pick < .62) stalkLeaf(p, a, sd, h * (.9 + r() * .3), h * .07);
      else if (pick < .88) tend(p, a + sd * .8, h * (.9 + r() * .4), -sd, h * .14, h * .07);
      else { stalkLeaf(p, a, sd, h * .85, h * .07); stalkLeaf(p, a, -sd, h * .7, h * .07); }
      sd = r() < .7 ? -sd : sd; x += h * (1.4 + r() * 1.4); }
    const e = pts.at(-1), ae = tang(pts, pts.length - 1);
    if (opt.bud) bud(e, ae - .4, h * .95); else tend(e, ae, h * 1.3, -1, h * .18, h * .08);
  } else if (kind === 'vine') {
    // down a quotation's margin: a stem in outline the whole height, wandering, with tendrils, leaves and here and there a
    // bud; its head curls out over the first line and its foot curls under the last
    const wob = noise1(seed * 3 + 1), sx = w * .62, pts = [];
    for (let y = u * .9; y <= h - u * .9; y += .5) pts.push([sx + (wob(y / (u * 4)) - .5) * u * .5, y]);
    if (pts.length < 6) return null;
    const ow = u * .3; ostem(pts, ow, ow * .85, Math.max(.6, u * .055), Math.max(.7, u * .07), 1e9);
    tend(pts[0], -Math.PI / 2, u * 1.9, -1, u * .25, u * .12); leaf([pts[0][0] - u * .05, pts[0][1] - u * .25], -Math.PI / 2 - .8, u * 1.2, 1);
    tend(pts.at(-1), Math.PI / 2, u * 1.7, 1, u * .25, u * .12);
    let y = u * 2.2, sd = -1;
    while (y < h - u * 2.4) { const i = Math.round((y - u * .9) / .5), p = pts[Math.min(pts.length - 1, i)], a = tang(pts, i), pick = r(), outer = sd > 0 === (a > 0);
      if (pick < .55) stalkLeaf(p, a, sd, u * (outer ? 1.15 : .8) * (.9 + r() * .2), u * .09);
      else if (pick < .85 || !outer) tend(p, a + sd * .7, u * (outer ? 1.3 : .9), -sd, u * .18, u * .08);
      else { const q = [p[0] + Math.cos(a + sd * .9) * u * .5, p[1] + Math.sin(a + sd * .9) * u * .5]; tstem([p, q], u * .08, u * .07); bud(q, a + sd * 1.1, u * .9); }
      sd = -sd; y += u * (1.4 + r() * .7); }
  } else if (kind === 'corner') {
    // a frame's corner, made with its rules: a small rosette on the corner where the rules meet, and from it two stems in
    // outline running a little inside the rules and curling inward, a leaf and a tendril off each (the top left; the frame
    // turns it). w: its reach along each rule
    const s = w, rad = s * .17, off = s * .11;
    for (const [dx, dy] of [[1, 0], [0, 1]]) { const P = [], n = 60; for (let i = 0; i <= n; i++) { const t = i / n, x = rad * 1.1 + t * s * .8, y = off * (1 - Math.pow(1 - t, 3)) * .9 + off * .1; P.push(dx ? [x, y] : [y, x]); }
      const a0 = dx ? 0 : Math.PI / 2, sg = dx ? 1 : -1, cl = tendril(P.at(-1), a0, s * .35, sg * .4 / s, sg / (s * .06), 1.6, .3), all = [...P, ...cl.slice(1)];
      ostem(all, s * .07, s * .028, .6, .7, 1e9); ops.push({ disc: all.at(-1), r: s * .02 });
      const [q, ta] = at(all, .45); stalkLeaf(q, ta, sg, s * .17, s * .02); const [q2, t2] = at(all, .7); tend(q2, t2 + sg * .7, s * .18, -sg, s * .03, s * .018); }
    rose([0, 0], rad);
  }
  const o = { w, h, draw(c, x, y) {
    c.save(); c.translate(x, y); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const op of ops) {
      if (op.halo || op.fill || op.cut) { const pts = op.halo ?? op.fill ?? op.cut, P = new Path2D(); if (op.w.every(v => v < .02)) continue; strokeOutline(P, pts, op.w, .01, !!op.round);
        c.globalCompositeOperation = op.fill ? 'source-over' : 'destination-out'; c.fillStyle = '#000'; c.fill(P); }
      else if (op.poly) { c.globalCompositeOperation = 'source-over'; const P = new Path2D(); ringPath(P, op.poly); c.fill(P); }
      else if (op.opoly) { const P = new Path2D(); ringPath(P, op.opoly); c.globalCompositeOperation = 'destination-out'; c.lineWidth = op.lw * 2.4; c.stroke(P); c.fill(P);   // (a paper halo, then the contour and its ribs in ink)
        c.globalCompositeOperation = 'source-over'; c.lineWidth = op.lw; c.stroke(P); for (const q of op.inner) { const Q = new Path2D(); ringPath(Q, q, false); c.lineWidth = op.lw * .8; c.stroke(Q); } }
      else if (op.disc) { c.globalCompositeOperation = 'source-over'; c.beginPath(); c.arc(op.disc[0], op.disc[1], op.r, 0, 6.2832); c.fill(); }
      else if (op.cutdisc) { c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(op.cutdisc[0], op.cutdisc[1], op.r, 0, 6.2832); c.fill(); }
      else if (op.line) { c.globalCompositeOperation = 'destination-out'; c.lineWidth = op.lw; const P = new Path2D(); ringPath(P, op.line, false); c.stroke(P); }
      else if (op.ring) { c.globalCompositeOperation = 'destination-out'; c.lineWidth = op.lw; const P = new Path2D(); ringPath(P, op.ring); c.stroke(P); } }
    c.restore(); } };
  return o;
}

// ---- bands: the garden grown along a stem, white in a black band ------------------------------------------------------------
// A break, a frame's side, a pull quote's head: a band of the block's black with a rinceau standing white in it (the band's
// "letter"): a stem waving the length of it, and in each bay it leaves a branch sweeping off it toward a flower (rosette and
// tulip in turn); then the garden grown round it by the initials' own hand (grow1, at their scale: U px a block unit),
// sparer than in a block. w x h page px. sil: drawn in ink on the paper, no block.
//   band(w, h, seed, { U, sil }) -> { w, h, geo, draw(c, x, y) }
const ribbon = (pts, ws) => { const t = (i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; return Math.atan2(b[1] - a[1], b[0] - a[0]); }, Lf = [], Rt = [];
  pts.forEach((p, i) => { const a = t(i), s = Math.sin(a), c = Math.cos(a); Lf.push([p[0] - s * ws[i], p[1] + c * ws[i]]); Rt.push([p[0] + s * ws[i], p[1] - c * ws[i]]); });
  const e = pts.at(-1), a = t(pts.length - 1), cap = []; for (let k = 1; k < 8; k++) { const th = a + Math.PI / 2 - Math.PI * k / 8; cap.push([e[0] + Math.cos(th) * ws.at(-1), e[1] + Math.sin(th) * ws.at(-1)]); }
  return [...Lf, ...cap, ...Rt.reverse()]; };
export function band(w, h, seed = 1, o = {}) {
  if (o.knot) return knotBand(w, h, seed, o);
  const U = o.U ?? 105, hb = h / U, aw = w / U, c0 = hb / 2, per = hb * (o.per ?? 3), amp = hb * (o.amp ?? .18), sw0 = o.sw ?? .02, n = Math.max(60, Math.ceil(aw / .003));
  const r = stream(seed, 'band'), nf = noise1(seed * 7 + 11), na = noise1(seed * 5 + 3), e0 = MARG + CHL + .02, x0 = e0, x1 = aw - e0;
  // the stem: a wave whose pace and swing wander a little along it (never a ruled sine), thickest at the middle
  const swAt = x => sw0 * (1 - .3 * Math.abs(2 * x / aw - 1) ** 2), ctr = []; let phs = r() * 6.283;
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; if (i) phs += 2 * Math.PI / per * (1 + .3 * (nf(x / per * 1.3) - .5) * 2) * (x1 - x0) / n;
    ctr.push([x, c0 + amp * (1 + .35 * (na(x / per * 1.1) - .5) * 2) * Math.sin(phs)]); }
  const yAt = x => ctr[Math.max(0, Math.min(n, Math.round((x - x0) / (x1 - x0) * n)))][1], slope = x => (yAt(x + .004) - yAt(x - .004)) / .008;
  const L = [ribbon(ctr, ctr.map(p => swAt(p[0])))];
  // the bays: one at each crest and trough; most carry a branch sweeping into the room to a flower, a few are left to the garden
  const heroes = []; let k = (o.odd ?? 0) + (r() < .5 ? 1 : 0);
  for (let i = 2; i < n - 2; i++) { const y = ctr[i][1]; if (!(y < ctr[i - 1][1] && y <= ctr[i + 1][1] || y > ctr[i - 1][1] && y >= ctr[i + 1][1])) continue;
    const xk = ctr[i][0], up = y < c0, sg = up ? 1 : -1, edge = up ? hb - MARG : MARG, st = y + sg * swAt(xk), room = Math.abs(edge - st), rad = Math.min(o.rmax ?? .07, room / 2 - CHL * .8) * (.9 + r() * .15);
    if (xk - per * .3 < e0 + .02 || xk + per * .25 > aw - e0 || rad < .02 || r() < (o.skip ?? .15)) continue;
    const kind = k++ % 2 ? 'tulip' : 'rosette', hc = [xk + per * (.04 + r() * .08), st + sg * room / 2];
    // the branch: off the stem before the crest, along it, then bowing into the bay to the flower's foot
    const xs = xk - per * (.19 + r() * .07), ta = Math.atan(slope(xs)), P0 = [xs, yAt(xs) + sg * swAt(xs) * .3];
    const len = kind === 'tulip' ? rad * 2.1 : 0, ua = Math.atan2(hc[1] - P0[1], hc[0] - P0[0]) + sg * (.35 + r() * .3);   // (the flower faces on along the branch, turned a little into the bay)
    const P2 = kind === 'tulip' ? [hc[0] - Math.cos(ua) * len * .5, hc[1] - Math.sin(ua) * len * .5] : [hc[0] - Math.cos(ua) * rad * .8, hc[1] - Math.sin(ua) * rad * .8];
    const d = Math.hypot(P2[0] - P0[0], P2[1] - P0[1]), P1 = [P0[0] + Math.cos(ta) * d * (.45 + r() * .2), P0[1] + Math.sin(ta) * d * (.45 + r() * .2)], bp = [], bw = [];
    for (let j = 0; j <= 40; j++) { const t = j / 40, v = 1 - t; bp.push([v * v * P0[0] + 2 * v * t * P1[0] + t * t * P2[0], v * v * P0[1] + 2 * v * t * P1[1] + t * t * P2[1]]); bw.push(swAt(xs) * (.8 - .4 * t)); }
    L.push(ribbon(bp, bw));
    const ea = Math.atan2(P2[1] - bp[38][1], P2[0] - bp[38][0]);
    heroes.push(kind === 'tulip' ? { p: [P2[0] + Math.cos(ea) * len * .5, P2[1] + Math.sin(ea) * len * .5], kind, rad: len * .5, b: P2, a: ea, len, fixed: 1 } : { p: [P2[0] + Math.cos(ea) * rad * .8, P2[1] + Math.sin(ea) * rad * .8], kind, rad, a: ea, fixed: 1 }); }
  const key = 'rinceau' + seed + ':' + aw.toFixed(3) + 'x' + hb.toFixed(3) + [o.per, o.amp, o.sw, o.odd, o.rmax, o.skip].join(','), grow = { edge: false, fills: o.fills ?? 20, leaf: o.leaf ?? 3, wind: 'nonzero' }, gk = key + '/' + grow.fills + '/' + grow.leaf;
  const geo = gardenField(gk, L, aw, hb, seed, bandOf(U * (o.res ?? 2)), o.stout ?? .3, heroes, grow);
  return { w, h, geo, draw(c, x = 0, y = 0) { if (!geo) return; const T = c.getTransform(), res = Math.hypot(T.a, T.b) || 1; drawGarden(c, geo, x, y, U, res, !!o.sil); },
    grow(c, x, y, f, mode) { growDraw(c, geo, x, y, U, f, mode, { x: 0 }); } };
}

// ?break=knot: two stems plaited the length of the band, over and under in turn at every crossing (the stem beneath broken
// by a narrow black either side of the one above), each swelling between its crossings and drawn in at them; a flower in
// each eye of the plait; in each pocket the plait leaves at the band's edge, a leaf or a spray of three standing from the
// crossing; at each end the two stems join and wind out in a curl; then the garden grown in what is left.
function knotBand(w, h, seed, o) {
  const U = o.U ?? 105, hb = h / U, aw = w / U, c0 = hb / 2, amp = hb * (o.amp ?? .25), sw = o.sw ?? .017, e0 = MARG + CHL + .03, ends = o.ends ?? true, x0 = ends ? e0 + amp * .9 : o.sil ? -sw * .5 : MARG * .5, x1 = ends ? aw - e0 - amp * .9 : o.sil ? aw + sw * .5 : aw - MARG * .5;   // (in ink, a frame's side runs right into its corner)
  const r = stream(seed, 'knot'), nEye = Math.max(2, Math.round((x1 - x0) / (hb * (o.per ?? 1.3)))), per = (x1 - x0) / nEye * 2, n = Math.ceil((x1 - x0) / .005);
  const th = x => Math.PI * (x - x0) / (per / 2), yA = (x, s) => c0 + s * amp * Math.sin(th(x)), wA = x => sw * (.78 + .34 * Math.abs(Math.sin(th(x)))), cut = sw + CHL * .55;
  const L = [], strands = [];
  for (const s of [1, -1]) { let run = [];
    const flush = () => { if (run.length > 2) { const [P, W2] = hand(run, run.map(p => wA(p[0])), s + 5 + seed); L.push(ribbon(P, W2)); strands.push({ pts: P, w: W2 }); } run = []; };
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, k = Math.round((x - x0) / (per / 2));
      // (at crossing k the stem s goes under when k + s is even; the ends, where the two meet, are never cut)
      if (k > 0 && k < nEye && Math.abs((x - x0) - k * per / 2) < cut * 1.5 && (k + (s > 0 ? 0 : 1)) % 2 === 0) { flush(); continue; }
      run.push([x, yA(x, s)]); }
    flush(); }
  if (ends) for (const [xe, dir] of [[x0, -1], [x1, 1]]) { const t = tendril([xe, c0], dir > 0 ? 0 : Math.PI, amp * 2.4, 0, (dir > 0 ? -1 : 1) * 3 / amp, 1.6, .002), tw = t.map((_, i) => sw * .85 * (1 - .5 * i / t.length)); L.push(ribbon(t, tw)); strands.push({ pts: t, w: tw }); }
  // the pockets: a leaf, or a spray of three, from each crossing toward the band's edge (up and down by turns)
  LW = BANDS[bandOf(U * (o.res ?? 2))].LW; const lv = [], room = hb / 2 - MARG - CHL * .6;
  for (let k = 1; k < nEye; k++) for (const s of [-1, 1]) { const xc = x0 + k * per / 2, base = [xc, c0 + s * (sw * 1.4)], up = s * Math.PI / 2, three = !o.single && (k + (s > 0 ? 1 : 0) + (o.odd ? 1 : 0)) % 2 === 0;
    const put = (a, len, bend) => { const sh = leafShape(r, bend), ol = lay(sh.outline, base, a, len); lv.push({ outline: ol, rib: lay(sh.axis.slice(2, 15), base, a, len), W: sh.W * len }); L.push(ol); };
    if (o.single && (k + (s > 0 ? 1 : 0)) % 2) continue;   // (single: a leaf at each crossing, up and down by turns)
    if (three) { put(up, room * .95, (r() - .5) * .2); put(up - .62, room * .7, .2); put(up + .62, room * .7, -.2); }
    else put(up + (r() - .5) * .3, room * 1.02, (r() < .5 ? 1 : -1) * .25); }
  // (no growth: the plait is laid as designed, its eyes' flowers and its pockets' leaves with it; the open black
  // left bare; the same shapes and the same hand as the initials, at a fraction of the cost)
  const key = 'knot' + seed + ':' + aw.toFixed(3) + 'x' + hb.toFixed(3) + [o.amp, o.sw, o.per, o.rmax, ends, o.eye, o.single, o.bare, !!o.sil, o.odd].join(',');
  let geo = gcache.get(key);
  if (!geo) { const flowers = [], dots = [], eyes = [];
    for (let k = 0; k < nEye; k++) { const x = x0 + (k + .5) * per / 2, rad = Math.min(o.rmax ?? .1, amp - sw - CHL * .8) * (.92 + r() * .1); eyes.push([x, rad]);
      if (o.eye === 'dot') dots.push({ p: [x, c0], rad: (amp - sw) * .42 }); else flowers.push({ ...rosette(r, o.odd && k % 2 ? 4 : 5), c: [x, c0], rad: o.odd && k % 2 ? rad * .9 : rad, a: r() * 6 }); }   // (odd: a four-petalled flower in every other eye)
    const lb = lv.map(l => { const c = l.outline.reduce((a, q) => [a[0] + q[0] / l.outline.length, a[1] + q[1] / l.outline.length], [0, 0]); return [c[0], c[1], Math.max(...l.outline.map(q => Math.hypot(q[0] - c[0], q[1] - c[1]))), l]; });
    // (no dots strewn in the black: the eyes' flowers and the pockets' leaves are all it holds)
    const sq = edgeOf(aw, hb, seed);
    geo = { letter: L, wind: 'nonzero', square: sq, grow: strands, stems: [], curls: [], leaves: lv, flowers, dots, heroes: [], stats: { kinds: { eyes: nEye, leaves: lv.length, dots: dots.length } } };
    gcache.set(key, geo); if (gcache.size > 64) gcache.delete(gcache.keys().next().value); }
  return { w, h, geo, draw(c, x = 0, y = 0) { if (!geo) return; const T = c.getTransform(), res = Math.hypot(T.a, T.b) || 1; drawGarden(c, geo, x, y, U, res, !!o.sil); },
    grow(c, x, y, f, mode) { growDraw(c, geo, x, y, U, f, mode, { x: 0 }); } };
}

// a block's edge, a rectangle aw x hb whose cut wanders a hair (as grow1's square)
function edgeOf(aw, hb, seed) { const sq = [], ew = noise1(seed ^ 0x2f), per2 = 2 * (aw + hb);
  for (let t = 0; t < per2; t += .01) { let x, y, nx, ny; if (t < aw) { x = t; y = 0; nx = 0; ny = -1; } else if (t < aw + hb) { x = aw; y = t - aw; nx = 1; ny = 0; } else if (t < 2 * aw + hb) { x = aw - (t - aw - hb); y = hb; nx = 0; ny = 1; } else { x = 0; y = hb - (t - 2 * aw - hb); nx = -1; ny = 0; }
    const e = (ew(t * 14) - .5) * .0026; sq.push([x + nx * e, y + ny * e]); }
  return sq; }
// A frame's corner: a square of the block with a rosette at its middle and a leaf toward each corner from it, the four
// sides' bands butting into it (as a binder's corner piece). s page px a side.
export function cornerBlock(s, seed = 1, o = {}) {
  const U = o.U ?? 105, a = s / U, c = [a / 2, a / 2], r = stream(seed, 'corner'); LW = BANDS[bandOf(U * (o.res ?? 2))].LW;
  const rad = a / 2 - MARG - CHL - a * .12, L = [], lv = [];
  for (let k = 0; k < 4; k++) { const ang = Math.PI / 4 + k * Math.PI / 2, b = [c[0] + Math.cos(ang) * rad * .85, c[1] + Math.sin(ang) * rad * .85], len = (a / 2 - MARG) * Math.SQRT2 - rad * .85 - CHL * 1.6;
    const sh = leafShape(r, (r() - .5) * .15), ol = lay(sh.outline, b, ang, len); L.push(ol); lv.push({ outline: ol, rib: lay(sh.axis.slice(2, 15), b, ang, len), W: sh.W * len }); }
  const key = 'corner' + seed + ':' + a.toFixed(3); let geo = gcache.get(key);
  if (!geo) { geo = { letter: L, wind: 'nonzero', square: edgeOf(a, a, seed), stems: [], curls: [], leaves: lv, flowers: [{ ...rosette(r), c, rad, a: r() * 6 }], dots: [], heroes: [] }; gcache.set(key, geo); }
  return { w: s, h: s, geo, draw(cx, x = 0, y = 0) { if (!geo) return; const T = cx.getTransform(), res = Math.hypot(T.a, T.b) || 1; drawGarden(cx, geo, x, y, U, res, !!o.sil); },
    grow(cx, x, y, f, mode) { growDraw(cx, geo, x, y, U, f, mode, { x: a / 2, y: a / 2 }); } };
}

// ---- ?orn=vine2: the garden's running vine ------------------------------------------------------------------------------------
// The second family of bands, more lyrical than the plait: a single stem running the length of the band with a swing that
// wanders, and in each bay it leaves a different thing — a lobed vine leaf, a tulip on a curling stalk, a rosette, a bunch
// of grapes, a tendril winding in on itself — so it never repeats; small leaves at its nodes; the black left bare; a white
// fillet inside the block's edge. A break is a cartouche: a black body swelling to the middle, a rosette with its four
// leaves at the heart, the vine running out each way and lighter as the body narrows, and from each point black tendrils
// that leave the block and curl out onto the paper. A frame's corner a square with a flower and its leaves; a filler the
// vine in ink alone, tapering, ending in a curl. All laid as designed from the garden's shapes and hand (no growth).
//   vine2(kind, w, h, seed, o) -> { w, h, geo, draw(c, x, y) }   kinds: 'band' 'break' 'corner' 'filler'
const v2tang = (q, i) => { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
function v2kit(r) {
  const g = { letter: [], wind: 'nonzero', stems: [], curls: [], leaves: [], flowers: [], dots: [], heroes: [], ground: [] };
  // (what is laid, as discs in a grid of .04 cells, the few large ones in a list)
  const cells = new Map(), big = [], C4 = .04, occ = { push: e => { if (e[2] > .04) big.push(e); else { const k = (e[0] / C4 | 0) * 4099 + (e[1] / C4 | 0); (cells.get(k) ?? cells.set(k, []).get(k)).push(e); } } };
  const K = {
    g, occ,
    free: (p, rr) => { const hit = ([x, y, R]) => Math.hypot(p[0] - x, p[1] - y) <= R + rr; if (big.some(hit)) return false; const i0 = p[0] / C4 | 0, j0 = p[1] / C4 | 0, n = Math.ceil((rr + .04) / C4);
      for (let i = i0 - n; i <= i0 + n; i++) for (let j = j0 - n; j <= j0 + n; j++) if (cells.get(i * 4099 + j)?.some(hit)) return false; return true; },
    mark: (p, rr) => occ.push([p[0], p[1], rr]),
    stem(pts, w0, w1, k = 1) { const ws = pts.map((_, i) => w0 + (w1 - w0) * i / Math.max(1, pts.length - 1)); const [P, W] = hand(pts, ws, k); g.stems.push({ pts: P, w: W }); P.forEach((p, i) => i % 6 || occ.push([p[0], p[1], W[i]])); return P; },
    stalk(P0, P1, P2, w0, w1) { const q = quad(P0, P1, P2, 24); g.curls.push({ pts: q, w: q.map((_, i) => w0 + (w1 - w0) * i / 24) }); q.forEach((p, i) => i % 4 || occ.push([p[0], p[1], w0])); return q; },
    curl(p, a, L, sg, w0, ball = 1.3) { const pts = tendril(p, a, L, sg * 1.5 / L, sg * 11 / L, 1.7, L / 70); g.curls.push({ pts, w: pts.map((_, i) => w0 * (1 - .55 * i / pts.length)), ball: ball ? w0 * ball : 0 }); pts.forEach((q, i) => i % 5 || occ.push([q[0], q[1], w0])); return pts; },
    leaf(b, a, L, bend = 0) { const sh = leafShape(r, bend), o = lay(sh.outline, b, a, L); g.leaves.push({ outline: o, rib: lay(sh.axis.slice(2, 15), b, a, L), W: sh.W * L }); for (let t = .3; t < 1; t += .2) occ.push([b[0] + Math.cos(a) * L * t, b[1] + Math.sin(a) * L * t, L * .18]); return o; },
    vleaf(b, a, L) { const v = vineLeaf(r), o = lay(v.outline, b, a, L); v.veins.forEach(q => g.leaves.push({ outline: o, rib: lay(q, b, a, L), W: L * .3 })); occ.push([b[0] + Math.cos(a) * L * .4, b[1] + Math.sin(a) * L * .4, L * .5]); },
    tulip(b, a, L) { const t = tulip(r); g.flowers.push({ outline: lay(t.outline, b, a, L), cuts: t.cuts.map(q => lay(q, b, a, L)) }); occ.push([b[0] + Math.cos(a) * L * .55, b[1] + Math.sin(a) * L * .55, L * .45]); },
    rose(c, rad, n = 5) { g.flowers.push({ ...rosette(r, n), c, rad, a: r() * 6 }); occ.push([c[0], c[1], rad]); },
    grapes(p, a, gr) { const ca = Math.cos(a), sa = Math.sin(a);
      for (const [row, n] of [[0, 3], [1, 3], [2, 2], [3, 2], [4, 1]]) for (let j = 0; j < n; j++) { const x = row * gr * 1.75 + gr, y = (j - (n - 1) / 2) * gr * 2.1 + (row % 2 ? gr * .25 : 0); g.dots.push({ p: [p[0] + x * ca - y * sa, p[1] + x * sa + y * ca], rad: gr * (.95 + r() * .1) }); }
      occ.push([p[0] + ca * gr * 4, p[1] + sa * gr * 4, gr * 4.5]); },
    fillet(pts, w) { g.stems.push({ pts, w: pts.map(() => w), still: 1 }); },
    dots(x0, y0, x1, y1, inside, sp, rr) { for (const p of poisson(x1 - x0, y1 - y0, sp, r, q => { const p = [q[0] + x0, q[1] + y0]; return inside(p) && K.free(p, sp * .45); }, 10)) if (r() < .8) g.dots.push({ p: [p[0] + x0, p[1] + y0], rad: rr * (.85 + r() * .3) }); },
  };
  return K;
}
// the running vine between x0 and x1 about the line c0, its room `half` either side: the stem, a thing in each bay, leaves
// at the nodes. sg0: which way the stem first swings. Returns the stem.
function v2run(K, r, x0, x1, c0, half, o = {}) {
  const per = half * (o.per ?? 2.7), n = Math.max(1, Math.round((x1 - x0) / (per / 2))), amp = half * (o.amp ?? .36), sw = o.sw ?? half * .075, N = Math.max(40, Math.ceil((x1 - x0) / .004)), sg0 = o.sg ?? 1;
  const k3 = 2 + (r() * 3 | 0), wob = (r() - .5) * .05, ph0 = r() * 6.28, ampAt = o.ampAt ?? (() => 1);
  const pts = []; for (let i = 0; i <= N; i++) { const t = i / N, tt = t + wob * Math.sin(2 * Math.PI * k3 * t + ph0) * Math.sin(Math.PI * t), x = x0 + (x1 - x0) * t; pts.push([x, c0 + sg0 * amp * ampAt(x) * Math.sin(Math.PI * n * tt)]); }
  const swAt = o.swAt ?? (() => 1), P = K.stem(pts, sw * swAt(x0), sw * swAt(x1), o.k ?? 1);
  const kinds = o.kinds ?? ['vleaf', 'tulip', 'curl', 'rose', 'vleaf', 'grapes', 'tulip', 'curl'], picks = []; let last = '';
  for (let k = 0; k < n; k++) { let kd; do kd = kinds[r() * kinds.length | 0]; while (kd === last && kinds.length > 1); picks.push(last = kd); }
  for (let k = 0; k < n; k++) {
    const i = Math.round((k + .5) / n * N), p = P[Math.min(N, i)], up = p[1] < c0, sg = up ? 1 : -1, edge = c0 + sg * half * (o.halfAt ?? (() => 1))(p[0] + per * .04), R0 = Math.abs(edge - (p[1] + sg * sw)) / 2, R = R0 * (o.big ?? 1);
    if (R0 < half * .16) continue;
    const bc = [p[0] + per * .04, p[1] + sg * (sw + R0 * (o.big ?? 1) ** .5)], is = Math.max(1, Math.round((k + .5 - .32) / n * N)), q0 = P[is], ta = v2tang(P, is), kd = picks[k];
    const toward = (len) => { const a = Math.atan2(bc[1] - q0[1], bc[0] - q0[0]); return [q0[0] + Math.cos(a) * len, q0[1] + Math.sin(a) * len, a]; };
    if (kd === 'rose') { const rad = R * .78, d = Math.hypot(bc[0] - q0[0], bc[1] - q0[1]), e = [bc[0] - (bc[0] - q0[0]) / d * rad * .85, bc[1] - (bc[1] - q0[1]) / d * rad * .85];
      K.stalk(q0, [q0[0] + Math.cos(ta) * d * .5, q0[1] + Math.sin(ta) * d * .5], e, sw * .75, sw * .45); K.rose(bc, rad, r() < .3 ? 4 : 5);
      K.leaf(e, Math.atan2(e[1] - q0[1], e[0] - q0[0]) + sg * 2.2, R * .7, -sg * .2); }
    else if (kd === 'tulip') { const L = R * 1.75, ba = -sg * Math.PI / 2 * -1 + (r() - .5) * .3, b = [bc[0] - Math.cos(ba) * L * .45, bc[1] - Math.sin(ba) * L * .45];
      K.stalk(q0, [q0[0] + Math.cos(ta) * R * 1.2, q0[1] + Math.sin(ta) * R * 1.2], b, sw * .75, sw * .45); K.tulip(b, ba, L); K.leaf(b, ba + Math.PI * .62 * (r() < .5 ? 1 : -1), R * .7, .2); }
    else if (kd === 'vleaf') { const L = R * 2.05, a = Math.atan2(bc[1] - q0[1], bc[0] - q0[0]) + sg * .25, b = [bc[0] - Math.cos(a) * L * .42, bc[1] - Math.sin(a) * L * .42];
      K.stalk(q0, [q0[0] + Math.cos(ta) * R * .8, q0[1] + Math.sin(ta) * R * .8], b, sw * .7, sw * .45); K.vleaf(b, a, L); }
    else if (kd === 'grapes') { const gr = R * .2, a = sg * Math.PI / 2 + (r() - .5) * .3, top = [bc[0] - Math.cos(a) * gr * 4, bc[1] - Math.sin(a) * gr * 4];
      K.stalk(q0, [q0[0] + Math.cos(ta) * R, q0[1] + Math.sin(ta) * R], top, sw * .7, sw * .45); K.grapes(top, a, gr); K.curl(top, a + Math.PI * .75, R * 1.3, -1, sw * .4); }
    else { const L = R * 3.1, [, , a] = toward(1); K.curl(q0, a - sg * .2, L, sg, sw * .65); K.leaf(q0, ta + sg * .5, R * .75, sg * .2); }
  }
  // the nodes: where the stem crosses its line, a small leaf each side, leaning on along it
  for (let k = 1; k < n; k++) { const i = Math.round(k / n * N), p = P[i], ta = v2tang(P, i), L = half * .42 * ampAt(p[0]) ** .5;
    for (const sd of [1, -1]) { const a = ta + sd * .75, tip = [p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L]; if (K.free(tip, L * .1)) K.leaf(p, a, L, -sd * .2); } }
  return P;
}
export function vine2(kind, w, h, seed = 1, o = {}) {
  const key = 'v2' + kind + seed + ':' + w.toFixed(1) + 'x' + h.toFixed(1) + JSON.stringify(o); let rec = gcache.get(key);
  if (!rec) { const r = stream(seed, 'vine2' + kind), K = v2kit(r), g = K.g; LW = BANDS[0].LW;
    let U = o.U ?? h / .42, aw = w / U, hb = h / U;
    if (kind === 'band') { const c0 = hb / 2, fi = MARG + .012, half = hb / 2 - fi - .008;
      g.square = edgeOf(aw, hb, seed); K.fillet([[0, fi * .62], [aw, fi * .62]], .0045); K.fillet([[0, hb - fi * .62], [aw, hb - fi * .62]], .0045);
      const ends = o.ends ?? true, x0 = ends ? fi + .03 : 0, x1 = ends ? aw - fi - .03 : aw;
      const P = v2run(K, r, x0, x1, c0, half, { sg: r() < .5 ? 1 : -1, k: seed, per: o.per ?? 4.4, amp: .22, sw: half * .1, big: 1.25 });
      if (ends) { K.curl(P[0], Math.PI, half * 1.1, 1, half * .06); K.curl(P.at(-1), 0, half * 1.1, -1, half * .06); }
      }
    else if (kind === 'break') {
      // the cartouche: a body of the black swelling to its middle, its points running on as arms out onto the paper
      const c0 = hb / 2, bw = aw * (o.body ?? .58), bx0 = (aw - bw) / 2, bx1 = aw - bx0, H = hb / 2, hh = x => { const t = Math.min(1, Math.abs(x - aw / 2) / (bw / 2)); return H * Math.pow(1 - Math.pow(t, 2.1), .7); };
      const top = [], bot = []; for (let i = 0; i <= 160; i++) { const x = bx0 + bw * i / 160; top.push([x, c0 - hh(x)]); bot.push([x, c0 + hh(x)]); }
      g.square = [...top, ...bot.reverse()];
      // the white fillet inside its edge
      const fi = .022, ins = x => Math.max(0, hh(x) - fi), ft = [], fb = []; for (let i = 0; i <= 160; i++) { const x = bx0 + fi * 2.2 + (bw - fi * 4.4) * i / 160; ft.push([x, c0 - ins(x)]); fb.push([x, c0 + ins(x)]); }
      K.fillet([...ft, ...fb.reverse(), ft[0]], .004);
      // the arms: from each point two tendrils of the black, the greater curling up and over, the lesser down, a leaf on the greater
      for (const sd of [-1, 1]) { const tip = [sd < 0 ? bx0 + bw * .06 : bx1 - bw * .06, c0], L = (bx0 + bw * .06) * (1.2 + r() * .12), a0 = sd < 0 ? Math.PI : 0, L2 = L * .5;
        const arm = tendril(tip, a0 - sd * .1, L, sd * .5 / L, sd * 13 / L, 1.9, L / 90), aw0 = H * .15;
        const ws = arm.map((_, i) => aw0 * Math.pow(1 - i / arm.length, .9) + .004), arm2 = tendril(arm[Math.round(arm.length * .12)], a0 - sd * .35, L2, -sd * 1.2 / L2, -sd * 14 / L2, 1.9, L / 90), ws2 = arm2.map((_, i) => aw0 * .55 * Math.pow(1 - i / arm2.length, .9) + .003);
        for (const [A, W2] of [[arm, ws], [arm2, ws2]]) { g.ground.push(ribbon(A, W2)); const e = A.at(-1), rr = W2.at(-1) * 2.2; g.ground.push(Array.from({ length: 16 }, (_, k) => [e[0] + Math.cos(k / 16 * 6.283) * rr, e[1] + Math.sin(k / 16 * 6.283) * rr])); }
        const j = Math.round(arm.length * .3), sh = leafShape(r, -sd * .25); g.ground.push(lay(sh.outline, arm[j], v2tang(arm, j) - sd * .55, H * .72)); }
      // the heart: a rosette, four leaves about it
      const rad = H * .4, cx = aw / 2; K.rose([cx, c0], rad, 5);
      for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, b = [cx + Math.cos(a) * rad * .92, c0 + Math.sin(a) * rad * .92]; K.leaf(b, a, H * .42, (k % 2 ? 1 : -1) * .15); }
      // the vine out each way, its swing and weight following the body
      for (const sd of [-1, 1]) { const xa = cx + sd * rad * 1.05, xb = sd < 0 ? bx0 + bw * .07 : bx1 - bw * .07, lo = Math.min(xa, xb), hi = Math.max(xa, xb);
        const f = x => Math.max(.25, hh(x) / H);
        const P = v2run(K, r, lo, hi, c0, H - fi - .02, { sg: sd, per: 2.3, amp: .34, ampAt: f, swAt: f, sw: H * .07, k: seed + sd, kinds: o.kinds, halfAt: x => Math.max(0, hh(x) - fi - .02) / (H - fi - .02) });
        const e = sd < 0 ? P[0] : P.at(-1); K.curl(e, sd < 0 ? Math.PI : 0, H * .5, sd, H * .03); }
      }
    else if (kind === 'corner') {   // a square: a rosette (or, o.tulip, a tulip) at the middle, leaves to the corners
      const a = aw, c = [a / 2, a / 2], fi = MARG + .01; g.square = edgeOf(a, a, seed); K.fillet([[fi * .6, fi * .6], [a - fi * .6, fi * .6], [a - fi * .6, a - fi * .6], [fi * .6, a - fi * .6], [fi * .6, fi * .6]], .0045);
      const rr = a / 2 - fi - .03;
      if (o.tulip) { K.tulip([c[0] + rr * .62, c[1] + rr * .62], -Math.PI * .75, rr * 1.55); K.leaf([c[0] + rr * .3, c[1] + rr * .3], -Math.PI * .25, rr * .85, .2); K.leaf([c[0] + rr * .3, c[1] + rr * .3], Math.PI * .75 + Math.PI, rr * .85, -.2); }
      else { K.rose(c, rr * .62, 5); for (let k = 0; k < 4; k++) { const an = Math.PI / 4 + k * Math.PI / 2; K.leaf([c[0] + Math.cos(an) * rr * .55, c[1] + Math.sin(an) * rr * .55], an, rr * .78, .1); } }
      }
    else if (kind === 'qvine') {
      // down a quotation's margin, in ink: one stem drawn in outline with the paper inside, a single long S the full height,
      // swelling through its middle and drawn fine at its ends; at its foot it winds into a small curl, at its head it rises,
      // bows over toward the words and winds into a confident curl, a big lobed leaf on the bow reaching over the first line;
      // along it leaves alternate in a steady rhythm, larger toward the head, with small curls of varied size between them on
      // the inner side and one bud. All one piece; laid from the foot up, so it grows upward. Units: U px.
      U = o.U ?? 34; aw = w / U; hb = h / U; const cx = o.cx ?? aw * .6, top = 1.05, foot = hb - .55, A = Math.min(.3, cx - .28), ph = .15 + r() * .25;
      const xAt = t => cx + A * Math.sin(2 * Math.PI * .92 * t + ph) - A * Math.sin(ph) * (1 - t);   // (the S, its foot on the column)
      const N = Math.max(40, Math.ceil((foot - top) / .02)), main = [];
      for (let i = 0; i <= N; i++) { const t = i / N; main.push([xAt(t), foot - (foot - top) * t]); }
      // the foot's curl, wound back from the foot (laid reversed, so the stem starts at its centre)
      const fa = Math.atan2(main[0][1] - main[1][1], main[0][0] - main[1][0]), fc = tendril(main[0], fa, .62, -1.6, -13, 1.6, .012).slice(1).reverse();
      // the head: up from the S's top, bowing over toward the words and winding in
      const ta = Math.atan2(main[N][1] - main[N - 1][1], main[N][0] - main[N - 1][0]), hc = tendril(main[N], ta, 2.5, 1.25, 8.5, 2.6, .012).slice(1);
      const P0 = [...fc, ...main, ...hc], n = P0.length, iF = fc.length, iH = fc.length + main.length;
      const wAt = i => { const u = i / (n - 1), sw = o.sw ?? .1; return i < iF ? sw * (.35 + .5 * i / iF) : i < iH ? sw * (.85 + .2 * Math.sin(Math.PI * (i - iF) / main.length)) : sw * Math.max(.18, .95 * (1 - (i - iH) / hc.length) ** .8); };
      const [P, W] = hand(P0, P0.map((_, i) => wAt(i)), seed), wall = .032;
      g.stems.push({ pts: P, w: W }); g.hollow = [{ pts: P, w: W.map(v => v - wall > .012 ? v - wall : .0001) }];
      const tAt = i => v2tang(P, i);
      // the head's leaf: on the bow, on its outer side, reaching over the first line, on a stalk of its own
      { const k = iH + Math.round(hc.length * .42), p = P[k], a = -.3, L = 1.3, b = [p[0] + Math.cos(a) * .22, p[1] + Math.sin(a) * .22];
        K.stalk(p, [p[0] + Math.cos(a + .5) * .12, p[1] + Math.sin(a + .5) * .12], b, .04, .03); K.vleaf([b[0] - Math.cos(a) * L * .26, b[1] - Math.sin(a) * L * .26], a, L);
        const k2 = iH + Math.round(hc.length * .08), p2 = P[k2]; K.leaf(p2, tAt(k2) + 1.05, .62, -.25); }
      // along the S: leaves by turns, steady, growing toward the head; small curls between them on the inner side; a bud once
      const step = .95, budAt = 2 + (r() * 2 | 0); let sd = r() < .5 ? 1 : -1, nIdx = 0;
      for (let y = foot - .55; y > top + .4; y -= step * (.92 + r() * .16), nIdx++) { const t = (foot - y) / (foot - top), i = iF + Math.round(t * N), p = P[i], a0 = tAt(i), gw = .72 + .55 * t;
        if (nIdx === budAt) { const a = a0 + sd * .6, e = [p[0] + Math.cos(a) * .32, p[1] + Math.sin(a) * .32]; K.stalk(p, [p[0] + Math.cos(a0) * .16, p[1] + Math.sin(a0) * .16], e, .032, .025); K.tulip(e, a - sd * .12, .55 * gw); }
        else { const a = a0 + sd * (.85 + r() * .15), e = [p[0] + Math.cos(a) * .2 * gw, p[1] + Math.sin(a) * .2 * gw];
          K.stalk(p, [p[0] + Math.cos(a0 + sd * .35) * .13 * gw, p[1] + Math.sin(a0 + sd * .35) * .13 * gw], e, .032, .022); K.leaf(e, a - sd * .32, .5 * gw, -sd * .3); }
        // a small curl a half step on, on the other side, of its own size
        for (const fr of [.5]) { const yc = y - step * fr; if (yc <= top + .5) continue; { const tc = (foot - yc) / (foot - top), ic = iF + Math.round(tc * N), q = P[ic]; const s2 = -sd, ca = tAt(ic) + s2 * (.95 + r() * .2), wq = W[ic] * .9, q0 = [q[0] + Math.cos(tAt(ic) + s2 * Math.PI / 2) * wq, q[1] + Math.sin(tAt(ic) + s2 * Math.PI / 2) * wq];
          K.curl(q0, ca, (.42 + r() * .3) * (.8 + .4 * tc), -s2, .021, 1.5); } }
        sd = -sd; } }
    else if (kind === 'filler') {   // in ink: the vine along the line, thinning as it goes, leaves by turns, a bud or two, a curl at its end
      U = h; aw = w / U; hb = 1; const c0 = .58, N = Math.ceil(aw / .02), pts = [], ph = r() * 6.28, x1 = aw - .9;
      for (let i = 0; i <= N; i++) { const x = .15 + (x1 - .15) * i / N; pts.push([x, c0 + Math.sin(x / 2.1 * Math.PI + ph) * .07]); }
      const P = K.stem(pts, .075, .038, seed); let x = .7 + r() * .4, sd = r() < .5 ? 1 : -1;
      while (x < x1 - .6) { const i = Math.round((x - .15) / (x1 - .15) * N), p = P[i], ta = v2tang(P, i), t = x / aw;
        if (r() < .14) { const a = ta + sd * .8, b = [p[0] + Math.cos(a) * .22, p[1] + Math.sin(a) * .22]; K.stalk(p, [p[0] + Math.cos(ta) * .12, p[1] + Math.sin(ta) * .12], b, .04, .03); K.tulip(b, a + sd * .2, .62 * (1 - t * .3)); }
        else K.leaf(p, ta + sd * (.5 + r() * .15), (1.05 - .3 * t) * (.9 + r() * .2), -sd * .3);
        sd = -sd; x += 1.5 + r() * .7; }
      K.curl(P.at(-1), v2tang(P, P.length - 1), 1.25, -1, .045, 1.5); K.leaf(P[0], Math.PI + .5, .5, .2); }
    rec = { geo: g, U, aw, hb }; gcache.set(key, rec); if (gcache.size > 64) gcache.delete(gcache.keys().next().value); }
  const { geo, U } = rec;
  return { w, h, geo, draw(c, x = 0, y = 0) { const T = c.getTransform(), res = Math.hypot(T.a, T.b) || 1; drawGarden(c, geo, x, y, U, res, kind === 'filler' || kind === 'qvine' || !!o.sil); },
    grow(c, x, y, f, mode) { growDraw(c, geo, x, y, U, f, mode, kind === 'qvine' ? { x: rec.aw * .64, y: rec.hb } : kind === 'break' || kind === 'corner' ? { x: rec.aw / 2, y: kind === 'corner' ? rec.aw / 2 : undefined } : { x: 0 }); } };
}

// ---- growth (?draw): the garden grows through the printed black --------------------------------------------------------------
// A piece's white things in the order they grew: every stroke (a stem, a curl, a stalk, a plait's strand) runs along its
// length behind a rounded tip, starting when the stroke it springs from reaches it (else, from the piece's origin: the
// letter for an initial, the middle of a cartouche or a corner, one end of a band or a filler, as a wave); leaves, berries
// and flowers open from where they are attached (scaled from their foot, turning a little, overshooting and settling, as
// the ivy border's do) when their stem arrives. Times in 0..1 over the piece.
//   growDraw(c, geo, x, y, U, f, mode, origin): on c (page px), the piece at x, y, U px a unit, at time f; mode 'cover'
//   draws, in black, what has not grown yet (laid over the printed block, so the white appears as it grows); 'reveal'
//   draws what has (the printed ink-on-paper piece is masked by it). Shapes are drawn a device px wider than they are, so
//   the printed edges are covered or shown whole. origin: 'letter' | { x, y? } (block units).
const GG = .02, gkey = (x, y) => Math.floor(x / GG) * 100003 + Math.floor(y / GG);
const gEase = g => { const c = 1.6; return 1 + (c + 1) * (g - 1) ** 3 + c * (g - 1) ** 2; };
function growPlan(geo, origin) {
  const ok = JSON.stringify(origin); if (geo.plan?.ok === ok) return geo.plan.E;
  const E = [], hash = new Map(), oDist = p => origin === 'letter' ? 0 : origin.y == null ? Math.abs(p[0] - origin.x) : Math.hypot(p[0] - origin.x, p[1] - origin.y);
  const addPt = (x, y, t) => { const k = gkey(x, y); (hash.get(k) ?? hash.set(k, []).get(k)).push([x, y, t]); };
  const near = (p, R) => { let best = null, bd = R; const i0 = Math.floor(p[0] / GG), j0 = Math.floor(p[1] / GG), n = Math.ceil(R / GG);
    for (let i = i0 - n; i <= i0 + n; i++) for (let j = j0 - n; j <= j0 + n; j++) for (const q of hash.get(i * 100003 + j) ?? []) { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } }
    return best; };
  const strokes = [...(geo.grow ?? []), ...geo.stems.filter(s => !s.still), ...geo.curls];
  for (const s of strokes) { if (!s.pts || s.pts.length < 2) continue;
    let P = s.pts, W = s.w, rev = false, q = near(P[0], .025 + (W[0] ?? 0) * 2);
    if (!q && origin !== 'letter') { const qe = near(P.at(-1), .025 + (W.at(-1) ?? 0) * 2); if (qe) { q = qe; rev = true; } }
    let t0 = q ? q[2] : null;
    if (t0 == null) { const d0 = oDist(P[0]), d1 = oDist(P.at(-1)); if (origin !== 'letter' && d1 < d0) rev = true; t0 = Math.min(d0, d1); }
    if (rev) { P = [...P].reverse(); W = [...W].reverse(); }
    const S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const L = S.at(-1) || 1e-6; E.push({ k: 'stroke', P, W, S, L, ball: s.ball, tipBall: rev ? 0 : s.ball, t0, t1: t0 + L });
    for (let i = 0; i < P.length; i += 2) addPt(P[i][0], P[i][1], t0 + S[i]); }
  // the things that open: a leaf (its outline once, however many veins it has), a flower, a berry
  const opened = (anchor, shape, size, extra = 0) => { const q = near(anchor, .2); const t0 = (q ? q[2] : oDist(anchor)) + extra; return { t0, t1: t0 + size * 2.4 + .02 }; };
  const seen = new Set();
  for (const l of geo.leaves) { if (seen.has(l.outline)) continue; seen.add(l.outline);
    const O = l.outline, c = O.reduce((a, p) => [a[0] + p[0] / O.length, a[1] + p[1] / O.length], [0, 0]), q = near(c, .2);
    const anchor = q ? O.reduce((a, p) => Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.hypot(a[0] - q[0], a[1] - q[1]) ? p : a, O[0]) : O[0];
    const size = Math.max(...O.map(p => Math.hypot(p[0] - anchor[0], p[1] - anchor[1])));
    E.push({ k: 'shape', ring: O, anchor, turn: (O.length % 2 ? 1 : -1) * .35, ...opened(anchor, O, size, .01) }); }
  for (const f of geo.flowers) { if (f.petals) { const R = f.rad; E.push({ k: 'disc', c: f.c, r: R * 1.04, rings: f.petals.map(p => p.map(q => [f.c[0] + q[0] * R, f.c[1] + q[1] * R])), anchor: f.c, turn: .5, ...opened(f.c, null, R * 1.6, .03) }); }
    else { const a = f.outline[0], size = Math.max(...f.outline.map(p => Math.hypot(p[0] - a[0], p[1] - a[1]))); E.push({ k: 'shape', ring: f.outline, anchor: a, turn: .25, ...opened(a, null, size, .03) }); } }
  for (const d of geo.dots) E.push({ k: 'disc', c: d.p, r: d.rad, anchor: d.p, turn: 0, ...opened(d.p, null, d.rad * 3, .02) });
  const T = Math.max(1e-6, ...E.map(e => e.t1)); for (const e of E) { e.t0 /= T; e.t1 /= T; }
  geo.plan = { ok, E }; return E;
}
const prefix = (e, s) => { const { P, W, S } = e; let i = 1; while (i < S.length - 1 && S[i] < s) i++; const u = (s - S[i - 1]) / ((S[i] - S[i - 1]) || 1);
  const pts = P.slice(0, i), ws = W.slice(0, i); pts.push([P[i - 1][0] + (P[i][0] - P[i - 1][0]) * u, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * u]); ws.push(W[i - 1] + (W[i] - W[i - 1]) * u); return [pts, ws]; };
export function growDraw(c, geo, x, y, U, f, mode, origin = 'letter') {
  if (!geo) return; const T = c.getTransform(), res = Math.hypot(T.a, T.b) || 1, px = 1 / (U * res), dil = px * (mode === "cover" ? 3.5 : 1.2), E = growPlan(geo, origin);
  c.save(); c.translate(x, y); c.scale(U, U); c.fillStyle = c.strokeStyle = '#000'; c.lineJoin = 'round'; c.lineWidth = dil * 2;
  const paint = (P, op) => { c.globalCompositeOperation = op; c.fill(P); c.stroke(P); };
  const full = e => { const P = new Path2D();
    if (e.k === 'stroke') strokeOutline(P, e.P, e.W, .6 * px, true);
    else if (e.k === 'shape') ringPath(P, e.ring); else P.arc(e.c[0], e.c[1], e.r, 0, 6.2832);
    if (e.k === 'stroke' && e.ball) { const q = e.tipBall ? e.P.at(-1) : e.P[0]; P.moveTo(q[0] + e.ball * 1.3, q[1]); P.arc(q[0], q[1], Math.max(e.ball, px) * 1.3, 0, 6.2832); }
    return P; };
  const part = (e, g) => { const P = new Path2D();
    if (e.k === 'stroke') { const s = (1 - (1 - g) ** 1.5) * e.L; if (s < 1e-5) return null; const [pts, ws] = prefix(e, s); strokeOutline(P, pts, ws, .6 * px, true);
      if (e.ball && e.tipBall && g > .97) { const q = e.P.at(-1); P.moveTo(q[0] + e.ball * 1.3, q[1]); P.arc(q[0], q[1], Math.max(e.ball, px) * 1.3, 0, 6.2832); }
      if (e.ball && !e.tipBall) { const q = e.P[0]; P.moveTo(q[0] + e.ball * 1.3, q[1]); P.arc(q[0], q[1], Math.max(e.ball, px) * 1.3, 0, 6.2832); }
      return P; }
    const k = Math.max(.02, gEase(g)), rt = e.turn * (1 - Math.min(1, k)) ** 2, [ax, ay] = e.anchor, co = Math.cos(rt) * k, si = Math.sin(rt) * k;
    const tf = ([px0, py0]) => { const dx = px0 - ax, dy = py0 - ay; return [ax + dx * co - dy * si, ay + dx * si + dy * co]; };
    if (e.k === 'shape') ringPath(P, e.ring.map(tf)); else if (e.rings) e.rings.forEach(r => ringPath(P, r.map(tf))); else P.arc(e.c[0], e.c[1], e.r * k, 0, 6.2832);
    if (e.rings) P.arc(e.c[0], e.c[1], e.r * .3 * k, 0, 6.2832);
    return P; };
  for (const e of E) { const g = Math.max(0, Math.min(1, (f - e.t0) / Math.max(1e-6, e.t1 - e.t0)));
    if (mode === 'cover') { if (g >= 1) continue; paint(full(e), 'source-over'); if (g > 0) { const P = part(e, g); if (P) paint(P, 'destination-out'); } }
    else { if (g <= 0) continue; const P = g >= 1 ? full(e) : part(e, g); if (P) paint(P, 'source-over'); } }
  // (an initial's letter is never covered: the cover's margin stops at its edge)
  if (mode === 'cover' && origin === 'letter' && geo.letter?.length) { const Lp = new Path2D(); geo.letter.forEach(q => ringPath(Lp, q)); c.globalCompositeOperation = 'destination-out'; c.fill(Lp, geo.wind ?? 'evenodd'); }
  c.restore();
}
