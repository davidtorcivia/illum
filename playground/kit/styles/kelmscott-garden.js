// Kelmscott ?caps=garden: a white-vine initial drawn directly as vector geometry. Paint the square, apply the letter, grow a
// garden in the gaps. The letter is GL-Morris (Morris's Troy capitals; research/kelmscott/gl-morris, licence there), placed
// and cut with his hairline exactly as research/kelmscott/gen/kgap.py does (kgarden_letters.py: fonts/kelmscott/garden-X.json,
// polygon rings in block units, ~2.5 KB a letter). The garden is the ivy border's method (kit/spray.js) turned to the block:
// the marks are set first (a flower or two in the biggest rooms, then leaves by Poisson disc), stems are grown to reach
// every one by space colonization from roots at the letter's edge and the block's foot, steering round the marks' rooms;
// each stem is then one smooth tapering curve (the node chain splined, its width from how much it carries), a few curls
// spring off into the open black, and dots go sparingly in what is left. Every shape is a designed outline (pointed leaf,
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
const BANDS = [{ HW0: .0058, HW1: .0168, LK: .036, LW: .23 }, { HW0: .007, HW1: .019, LK: .041, LW: .27 }];
export const bandOf = dev => dev < 280 ? 1 : 0;
let HW0, HW1, LW;                 // a stem's half-width at its tip and where it carries most; a leaf's half-width (of its length)
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
  const geo = grow1(ch, seed, band); if (!geo) return null;
  gcache.set(key, geo); if (gcache.size > 64) gcache.delete(gcache.keys().next().value);
  return geo;
}
// The letter's clearance field and its rooms: the same for every seed and size, so worked out once a letter (a regrowth,
// another seed or another size of the same letter starts from it).
const fields = new Map();
function fieldOf(ch, L, W, H) {
  if (fields.has(ch)) return fields.get(ch);
  // the clearance field: how far a point stands from the letter's channel and from the frame (block units, + is open)
  const cv = new OffscreenCanvas(W, H), c = cv.getContext('2d', { willReadFrequently: true }), P = new Path2D();
  L.forEach(q => ringPath(P, q)); c.scale(R, R); c.fill(P, 'evenodd');
  const img = c.getImageData(0, 0, W, H).data, feat = new Uint8Array(W * H); for (let q = 0; q < W * H; q++) feat[q] = img[q * 4 + 3] > 100;
  const DL = dist(feat, W, H), F = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = (i + .5) / R, y = (j + .5) / R; F[j * W + i] = Math.min(DL[j * W + i] / R - CHL, Math.min(x, A - x, y, 1 - y) - MARG); }
  // the rooms a stem can run in: the open black in pieces (a counter, the ground round the letter), each labelled
  const comp = new Int32Array(W * H).fill(-1), area = [];
  const st = new Int32Array(W * H), visit = (o, id) => { if (comp[o] < 0 && F[o] >= T) { comp[o] = id; st[top++] = o; } }; let top = 0;
  for (let q0 = 0; q0 < W * H; q0++) { if (comp[q0] >= 0 || F[q0] < T) continue; const id = area.length; let n = 0; top = 0; visit(q0, id);
    while (top) { const q = st[--top], i = q % W; n++; if (i > 0) visit(q - 1, id); if (i < W - 1) visit(q + 1, id); if (q >= W) visit(q - W, id); if (q < W * H - W) visit(q + W, id); }
    area.push(n / R / R); }
  const f = { feat, DL, F, comp, area }; fields.set(ch, f); return f;
}
function grow1(ch, seed, band) {
  const B = BANDS[band]; ({ HW0, HW1, LW } = B);
  const L = rings.get(ch); if (!L) return null;
  const r = stream(seed, 'garden-' + ch), wander = noise2(seed ^ 0x51), W = Math.ceil(A * R), H = R;
  const Fxy = (x, y) => F[Math.max(0, Math.min(H - 1, y * R | 0)) * W + Math.max(0, Math.min(W - 1, x * R | 0))];
  const C = ([x, y]) => { const fx = Math.max(0, Math.min(W - 1.001, x * R - .5)), fy = Math.max(0, Math.min(H - 1.001, y * R - .5)), i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, q = j * W + i;
    return F[q] * (1 - u) * (1 - v) + F[q + 1] * u * (1 - v) + F[q + W] * (1 - u) * v + F[q + W + 1] * u * v; };
  const sees = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(l / .011); for (let i = 1; i < n; i++) { const t = i / n; if (Fxy(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) < .002) return false; } return true; };
  const byLetter = ([x, y]) => { const i = Math.min(W - 1, x * R | 0), j = Math.min(H - 1, y * R | 0); return DL[j * W + i] / R - CHL <= Math.min(x, A - x, y, 1 - y) - MARG; };
  const grad = p => { const e = .004, gx = C([p[0] + e, p[1]]) - C([p[0] - e, p[1]]), gy = C([p[0], p[1] + e]) - C([p[0], p[1] - e]), l = Math.hypot(gx, gy) || 1; return [gx / l, gy / l]; };
  const { feat, DL, F, comp, area } = fieldOf(ch, L, W, H);
  const compOf = ([x, y]) => comp[Math.min(H - 1, y * R | 0) * W + Math.min(W - 1, x * R | 0)];

  // (a root springs from a main stroke, a foot or an inside corner: not from a serif or a terminal's tip, where little
  // of the letter stands round the point it would leave from)
  const stout = p => { const g = grad(p), e = C(p) + CHL + .004, x = (p[0] - g[0] * e) * R, y = (p[1] - g[1] * e) * R, rr = .04 * R; let n = 0, t = 0;
    for (let j = Math.max(0, y - rr | 0); j <= Math.min(H - 1, y + rr | 0); j++) for (let i = Math.max(0, x - rr | 0); i <= Math.min(W - 1, x + rr | 0); i++) if ((i - x) ** 2 + (j - y) ** 2 <= rr * rr) { t++; n += feat[j * W + i]; }
    return n / t > .44; };
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
  for (let j = 0; j < SG; j++) for (let i = 0; i < SG; i++) { const x = (i + .5) / SG * A, y = (j + .5) / SG; let m = 1; for (let k = 0; k < spts.length; k += 3) { const d = (spts[k][0] - x) ** 2 + (spts[k][1] - y) ** 2; if (d < m) m = d; } dsg[j * SG + i] = Math.sqrt(m); }
  const dScroll = p => dsg[Math.min(SG - 1, p[1] * SG | 0) * SG + Math.min(SG - 1, p[0] / A * SG | 0)];
  // 1. the focal flowers, in the biggest rooms left: the field's greatest maxima, clear of the scrolls, kept apart
  const marks = [], heroes = [];
  for (let pass = 0; pass < 2; pass++) { let q = -1; for (let k = 0; k < W * H; k++) if (F[k] > .05 && (q < 0 || F[k] > F[q]) && !nearScroll([(k % W + .5) / R, ((k / W | 0) + .5) / R], F[k] * .9 + .01) && !heroes.some(h => Math.hypot(h.p[0] - (k % W + .5) / R, h.p[1] - ((k / W | 0) + .5) / R) < .34)) q = k;
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
  poisson(A, 1, LK * 2.5 + GAP * .7, r, leafOK).forEach(p => { const curl = r() < .2 && nCurl++ < 5, k = LK * (curl ? 1 : 1.4 + r() * .2); marks.push({ p, kind: curl ? 'curl' : 'sprig', kill: k + .002, room: k * (curl ? .75 : .55), len: k * 2 }); });

  // 3. the roots: a few in each room that holds a mark, at the letter's edge (a stem coming out from behind it), lowest first
  const N = [], need = new Map();
  marks.forEach(m => { m.comp = m.comp0 = compOf(m.p); if (m.comp >= 0) need.set(m.comp, (need.get(m.comp) ?? 0) + 1); });
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
  const G = .03, gw = Math.ceil(A / G) + 1, gh = Math.ceil(1 / G) + 1, cells = Array.from({ length: gw * gh }, () => []);
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
  const rootCands = []; for (let j = 0; j < H; j += 2) for (let i = 0; i < W; i += 2) { const q = j * W + i, p = [(i + .5) / R, (j + .5) / R]; if (F[q] >= T && F[q] < T + .006) rootCands.push([p, !byLetter(p) ? 7 : stout(p) ? 2.4 : 3.2, byLetter(p)]); }   // (and, last of all, from the frame: a stem coming in from behind the block's edge)
  const tangentAt = (st, i) => { const a = st.pts[Math.max(0, i - 2)], b = st.pts[Math.min(st.pts.length - 1, i + 2)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  // (the stems' points, in a grid of .05 cells, for finding a shoot's source near a gap)
  const pgrid = new Map(), PG = .05, pgAdd = k => { const st = stems[k]; for (let i = 1; i < st.pts.length - 1; i += 3) { const p = st.pts[i], key = (p[0] / PG | 0) * 977 + (p[1] / PG | 0); (pgrid.get(key) ?? pgrid.set(key, []).get(key)).push([k, i]); } };
  stems.forEach((_, k) => pgAdd(k));
  const open = new Int32Array(W * H); let nOpen = 0; for (let j = 0; j < H; j += 2) for (let i = 0; i < W; i += 2) { const q = j * W + i; if (F[q] >= .004) open[nOpen++] = q; }
  for (let pass = 0; pass < 260; pass++) {
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
  const dots = poisson(A, 1, .045, r, p => C(p) > .006 && occFree(p, .017)).filter(() => r() < .25).map(p => ({ p, rad: .0055 * (.9 + r() * .2) }));
  // 9. the square: its cut edge wanders a hair
  const sq = [], ew = noise1(seed ^ 0x2f), per = 2 * (A + 1);
  for (let s = 0; s < per; s += .01) { let x, y, nx, ny; if (s < A) { x = s; y = 0; nx = 0; ny = -1; } else if (s < A + 1) { x = A; y = s - A; nx = 1; ny = 0; } else if (s < 2 * A + 1) { x = A - (s - A - 1); y = 1; nx = 0; ny = 1; } else { x = 0; y = 1 - (s - 2 * A - 1); nx = -1; ny = 0; }
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
export function drawGarden(c, geo, x, y, h, res = 1) {
  const px = 1 / (h * res);   // one device px, in block units
  c.save(); c.translate(x, y); c.scale(h, h);
  const sq = new Path2D(); ringPath(sq, geo.square); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000'; c.fill(sq);
  c.globalCompositeOperation = 'destination-out';
  const Lp = new Path2D(); geo.letter.forEach(q => ringPath(Lp, q)); c.fill(Lp, 'evenodd');
  // (each shape filled on its own: two outlines that overlap with opposite windings would cancel in one nonzero path)
  const minHW = .6 * px, fill = f => { const P = new Path2D(); f(P); c.fill(P); };
  geo.stems.forEach(s => fill(P => strokeOutline(P, s.pts, s.w, minHW, false)));
  geo.curls.forEach(s => { fill(P => strokeOutline(P, s.pts, s.w, minHW * .9, true)); if (s.ball) fill(P => { const e = s.pts.at(-1); P.arc(e[0], e[1], Math.max(s.ball, minHW * 1.6), 0, 6.2832); }); });
  geo.leaves.forEach(l => fill(P => ringPath(P, l.outline)));
  for (const f of geo.flowers) { if (f.petals) { f.petals.forEach(p => fill(P => ringPath(P, p.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad])))); fill(P => ringPath(P, f.eye.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad]))); }
    else fill(P => ringPath(P, f.outline)); }
  geo.dots.forEach(d => fill(P => P.arc(d.p[0], d.p[1], Math.max(d.rad, 1.2 * px), 0, 6.2832)));
  // the fine black cuts: a leaf's midrib, a tulip's partings (only where the leaf is wide enough to hold one)
  c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#000'; c.lineCap = 'round'; c.lineWidth = Math.max(.75 * px, .0028);
  const K = new Path2D();
  geo.leaves.forEach(l => { if (l.rib && l.W > 5 * px) ringPath(K, l.rib, false); });
  geo.flowers.forEach(f => f.cuts?.forEach(q => ringPath(K, spline(q, 6), false)));
  c.stroke(K);
  const KR = new Path2D(); let rw = 0;
  geo.flowers.forEach(f => { if (!f.petals) return; rw = Math.max(.9 * px, f.rad * .06); f.petals.forEach(p => ringPath(KR, p.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad]))); ringPath(KR, f.eye.map(q => [f.c[0] + q[0] * f.rad, f.c[1] + q[1] * f.rad])); });
  if (rw) { c.lineWidth = rw; c.lineJoin = 'round'; c.stroke(KR); }
  c.restore();
}
