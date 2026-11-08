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
const BANDS = [{ HW0: .0034, HW1: .0095, LK: .025, LW: .23 }, { HW0: .0046, HW1: .011, LK: .031, LW: .28 }];
export const bandOf = dev => dev < 280 ? 1 : 0;
let HW0, HW1, LW;                 // a stem's half-width at its tip and where it carries most; a leaf's half-width (of its length)
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
  const W = LW * (1 + (r() - .5) * .16), wl = 1 + (r() - .5) * .18, wr = 1 + (r() - .5) * .18, n = 22;
  const ax = t => [t, bend * (t * t * .9 + t * .1) - bend * .35 * t], w = t => Math.pow(t, .55) * Math.pow(1 - t, 1.25) / .358;   // (max of t^.55 (1-t)^1.25 is .358)
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

// ---- the garden -------------------------------------------------------------------------------------------------------------
const gcache = new Map();
// (a growth that leaves a room bare, a counter with marks none of which a stem reached, is grown again from another
// stream, at most twice: deterministic still, as the retries are)
export function garden(ch, seed = 1, band = 0) {
  const key = ch + '|' + seed + '|' + band; if (gcache.has(key)) return gcache.get(key);
  let geo = null; for (let t = 0; t < 3 && (!geo || !geo.stats.full); t++) { const g = grow1(ch, t ? seed + ':' + t : seed, band); if (!g) return null; if (!geo || g.stats.full) geo = g; }
  gcache.set(key, geo); if (gcache.size > 64) gcache.delete(gcache.keys().next().value);
  return geo;
}
function grow1(ch, seed, band) {
  const B = BANDS[band]; ({ HW0, HW1, LW } = B);
  const L = rings.get(ch); if (!L) return null;
  const r = stream(seed, 'garden-' + ch), wander = noise2(seed ^ 0x51), W = Math.ceil(A * R), H = R;
  // the clearance field: how far a point stands from the letter's channel and from the frame (block units, + is open)
  const cv = new OffscreenCanvas(W, H), c = cv.getContext('2d', { willReadFrequently: true }), P = new Path2D();
  L.forEach(q => ringPath(P, q)); c.scale(R, R); c.fill(P, 'evenodd');
  const img = c.getImageData(0, 0, W, H).data, feat = new Uint8Array(W * H); for (let q = 0; q < W * H; q++) feat[q] = img[q * 4 + 3] > 100;
  const DL = dist(feat, W, H), F = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = (i + .5) / R, y = (j + .5) / R; F[j * W + i] = Math.min(DL[j * W + i] / R - CHL, Math.min(x, A - x, y, 1 - y) - MARG); }
  const Fxy = (x, y) => F[Math.max(0, Math.min(H - 1, y * R | 0)) * W + Math.max(0, Math.min(W - 1, x * R | 0))];
  const C = ([x, y]) => { const fx = Math.max(0, Math.min(W - 1.001, x * R - .5)), fy = Math.max(0, Math.min(H - 1.001, y * R - .5)), i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, q = j * W + i;
    return F[q] * (1 - u) * (1 - v) + F[q + 1] * u * (1 - v) + F[q + W] * (1 - u) * v + F[q + W + 1] * u * v; };
  const sees = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(l / .011); for (let i = 1; i < n; i++) { const t = i / n; if (Fxy(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) < .002) return false; } return true; };
  const byLetter = ([x, y]) => { const i = Math.min(W - 1, x * R | 0), j = Math.min(H - 1, y * R | 0); return DL[j * W + i] / R - CHL <= Math.min(x, A - x, y, 1 - y) - MARG; };
  const grad = p => { const e = .004, gx = C([p[0] + e, p[1]]) - C([p[0] - e, p[1]]), gy = C([p[0], p[1] + e]) - C([p[0], p[1] - e]), l = Math.hypot(gx, gy) || 1; return [gx / l, gy / l]; };
  // the rooms a stem can run in: the open black in pieces (a counter, the ground round the letter), each labelled
  const T = .009, comp = new Int32Array(W * H).fill(-1), area = [];
  const st = new Int32Array(W * H), visit = (o, id) => { if (comp[o] < 0 && F[o] >= T) { comp[o] = id; st[top++] = o; } }; let top = 0;
  for (let q0 = 0; q0 < W * H; q0++) { if (comp[q0] >= 0 || F[q0] < T) continue; const id = area.length; let n = 0; top = 0; visit(q0, id);
    while (top) { const q = st[--top], i = q % W; n++; if (i > 0) visit(q - 1, id); if (i < W - 1) visit(q + 1, id); if (q >= W) visit(q - W, id); if (q < W * H - W) visit(q + W, id); }
    area.push(n / R / R); }
  const compOf = ([x, y]) => comp[Math.min(H - 1, y * R | 0) * W + Math.min(W - 1, x * R | 0)];

  // 1. the focal flowers, in the biggest rooms: the field's greatest maxima, kept apart
  const marks = [], heroes = [];
  for (let pass = 0; pass < 2; pass++) { let q = -1; for (let k = 0; k < W * H; k++) if (F[k] > .045 && (q < 0 || F[k] > F[q]) && !heroes.some(h => Math.hypot(h.p[0] - (k % W + .5) / R, h.p[1] - ((k / W | 0) + .5) / R) < .34)) q = k;
    if (q < 0) break; const p = [(q % W + .5) / R, ((q / W | 0) + .5) / R]; {
      const rad = Math.min(F[q] - GAP * .5, .052) * (.92 + r() * .08); if (rad < .036) break;
      const kind = heroes.length === 0 ? 'rosette' : 'tulip';
      heroes.push({ p, kind, rad, room: rad + GAP * .4, kill: kind === 'rosette' ? rad + .004 : rad * .8, len: rad * 1.7 }); } }
  marks.push(...heroes);
  // 2. the leaves, evenly (Poisson disc), where a leaf's whole room is open and clear of the flowers
  let nCurl = 0; const LK = B.LK, leafOK = p => C(p) > LK * .75 && heroes.every(h => Math.hypot(p[0] - h.p[0], p[1] - h.p[1]) > h.rad + LK * 2 + GAP);
  poisson(A, 1, LK * 2 + GAP + .011, r, leafOK).forEach(p => { const k = LK * (.9 + r() * .2); const curl = r() < .2 && nCurl++ < 5; marks.push({ p, kind: curl ? 'curl' : 'leaf', kill: k + .002, room: k * (curl ? .75 : .6), len: k * 2 }); });

  // 3. the roots: a few in each room that holds a mark, at the letter's edge (a stem coming out from behind it), lowest first
  const N = [], need = new Map();
  marks.forEach(m => { m.comp = m.comp0 = compOf(m.p); if (m.comp >= 0) need.set(m.comp, (need.get(m.comp) ?? 0) + 1); });
  for (const [id, n] of need) {
    const cand = [], crowd = [];
    for (let j = 0; j < H; j += 3) for (let i = 0; i < W; i += 3) { const q = j * W + i; if (comp[q] !== id || F[q] > T + .006) continue;
      const p = [(i + .5) / R, (j + .5) / R]; if (!byLetter(p)) continue; (marks.some(a => Math.hypot(a.p[0] - p[0], a.p[1] - p[1]) < a.room + HW0 + GAP) ? crowd : cand).push(p); }
    // (a small counter whose whole edge is in leaves' rooms: root anyway, and give up the leaves the root stands in)
    if (!cand.length) { if (!crowd.length) continue; cand.push(...crowd); }
    // the fewest roots from which every mark in the room can be seen (greedy cover), the lowest first: so every mark has a
    // stem in sight, and the stems are few and long
    const ms = marks.filter(m => m.comp === id), vis = cand.map(p => new Set(ms.filter(m => Math.hypot(m.p[0] - p[0], m.p[1] - p[1]) < .6 && sees(p, m.p))));
    const unseen = new Set(ms), picked = [];
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
      for (const o of cells[j * gw + i]) { if (o === k || Math.hypot(q[0] - N[o].p[0], q[1] - N[o].p[1]) > HW1 + HW0 + GAP * .8) continue;
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
      let q = null;
      for (const turn of [0, .35, -.35, .7, -.7, 1.1, -1.1]) { const dd = rot(d, Math.cos(turn), Math.sin(turn)), p2 = [n.p[0] + dd[0] * D, n.p[1] + dd[1] * D];
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
      n.nk = (n.nk ?? 0) + 1; addNode({ p: q, parent: k, dir: d, t: it + 1, bend: n.nk > 1 ? -n.bend : n.bend });
    }
    for (const a of alive) look(a, seen); seen = N.length;
    idle = N.length === before ? idle + 1 : 0;
  }
  let reached = marks.filter(m => m.node !== undefined);
  // occupancy: every white shape as discs, so a leaf, a curl or a dot can keep its distance
  const OG = .03, okey = (i, j) => i * 997 + j, discs = [];
  const occOf = list => { const o = new Map(); list.forEach(e => { const k = okey(e[0] / OG | 0, e[1] / OG | 0); (o.get(k) ?? o.set(k, []).get(k)).push(e); }); return o; };
  let occ = new Map();
  const occAdd = (p, rr, who = 0) => { const e = [p[0], p[1], rr, who], k = okey(p[0] / OG | 0, p[1] / OG | 0); discs.push(e); (occ.get(k) ?? occ.set(k, []).get(k)).push(e); };
  const occFree = (p, rr, skip = -1) => { const i0 = p[0] / OG | 0, j0 = p[1] / OG | 0; for (let i = i0 - 2; i <= i0 + 2; i++) for (let j = j0 - 2; j <= j0 + 2; j++) for (const e of occ.get(okey(i, j)) ?? []) if (e[3] !== skip && Math.hypot(e[0] - p[0], e[1] - p[1]) < rr + e[2]) return false; return true; };
  // the tree as it stands (each node a disc as wide as the stem it will be), for laying the leaves against
  const hwOf = s => HW0 + (HW1 - HW0) * (1 - Math.exp(-(s - 1) / 70));
  { const used = new Uint8Array(N.length), sz = new Float32Array(N.length).fill(1); reached.forEach(m => { for (let k = m.node; k >= 0 && !used[k]; k = N[k].parent) used[k] = 1; });
    for (let i = N.length - 1; i >= 0; i--) if (used[i] && N[i].parent >= 0) sz[N[i].parent] += sz[i];
    occ = occOf(N.flatMap((n, i) => used[i] ? [[n.p[0], n.p[1], hwOf(sz[i]), -2]] : [])); }
  // 5. the marks, each where its stem reached it: the leaf from the stem's end toward the mark and through it
  const leaves = [], flowers = [], curls = [];
  for (const m of reached) {
    const b = N[m.node].p, a = Math.atan2(m.p[1] - b[1], m.p[0] - b[0]);
    if (m.kind === 'rosette') { const f = rosette(r); flowers.push({ ...f, c: m.p, rad: m.rad, a }); occAdd(m.p, m.rad); m.ok = 1; continue; }
    if (m.kind === 'tulip') { const t = tulip(r); flowers.push({ b, outline: lay(t.outline, b, a, m.len), cuts: t.cuts.map(q => lay(q, b, a, m.len)) }); occAdd(m.p, m.rad); m.ok = 1; continue; }
    // (a leaf bends the way its stem was turning, or by chance against it)
    const nd = N[m.node], pd = nd.parent >= 0 ? N[nd.parent].p : b, turn = Math.sign(((a - Math.atan2(b[1] - pd[1], b[0] - pd[0]) + 9.42) % 6.283) - 3.14) || 1;
    // a curl: the stem runs on past its last twig and winds in, its curvature rising smoothly (one ramp, so no join)
    if (m.kind === 'curl') { let done = false;
      for (const sg of [turn, -turn]) { const L = .085 + r() * .045, k1 = sg * (55 + r() * 25), hd = N[m.node].dir, pts = tendril(b, Math.atan2(hd[1] + Math.sin(a), hd[0] + Math.cos(a)) - sg * .2, L, sg * 5, k1, 1.2, .0025);
        let ok = true; for (let k = 6; k < pts.length && ok; k++) if (C(pts[k]) < .004 || !occFree(pts[k], HW0 + GAP * .6)) ok = false;
        if (!ok) continue; curls.push({ b, pts, w: pts.map((_, k) => HW0 * (1 - .3 * k / pts.length)), ball: HW0 * 2 }); pts.forEach((q, k) => k % 3 || occAdd(q, HW0)); done = m.ok = 1; break; }
      if (done) continue; }
    // (laid toward its mark; if it would touch the letter's channel or another shape, turned a little, or made smaller)
    const sh = leafShape(r, (r() < .75 ? turn : -turn) * (.18 + r() * .14));
    let best = null;
    for (const [da, f] of [[0, 1], [.25, 1], [-.25, 1], [.5, 1], [-.5, 1], [0, .8], [.3, .8], [-.3, .8], [.7, .8], [-.7, .8], [0, .65]]) {
      const o = lay(sh.outline, b, a + da, m.len * f); let ok = true;
      for (let k = 0; k < o.length && ok; k += 2) { const p = o[k]; if (Math.hypot(p[0] - b[0], p[1] - b[1]) < m.len * .22) continue; if (C(p) < -.002 || !occFree(p, GAP * .55)) ok = false; }
      if (ok) { best = [o, a + da, f]; break; } }
    if (!best) continue;
    const [o, aa, f] = best; m.ok = 1;
    leaves.push({ b, outline: o, rib: lay(sh.axis.slice(2, 15), b, aa, m.len * f), W: sh.W * m.len * f });
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
    for (let it = 0; it < 30; it++) { Q.set(P);
      for (let i = 0; i < n; i++) { const pa = M[i].parent, hc = heavy[i]; if (pa < 0 || hc < 0) continue;
        Q[2 * i] = P[2 * i] * .5 + (P[2 * pa] + P[2 * hc]) * .25; Q[2 * i + 1] = P[2 * i + 1] * .5 + (P[2 * pa + 1] + P[2 * hc + 1]) * .25; }
      [P, Q] = [Q, P]; }
    M.forEach((m, i) => { const dx = P[2 * i] - m.p[0], dy = P[2 * i + 1] - m.p[1], l = Math.hypot(dx, dy), f = l > .008 ? .008 / l : 1; m.p = [m.p[0] + dx * f, m.p[1] + dy * f]; }); }
  const stems = [];
  for (const s of strokes(M)) {
    if (s.pts.length < 2 && !s.root) continue;
    const chain = s.pts.slice(), ws = s.ids.map(i => hwOf(size[i])); if (!s.root) ws.unshift(ws[0]);
    const pts = chain, wsm = ws;
    stems.push({ pts, w: wsm, root: s.root });
  }
  // each leaf, curl and tulip moved onto its stem as drawn (the splined curve runs a hair off the node chain it smooths)
  { const sp = occOf(stems.flatMap(s => s.pts)), sh = (q, d) => q.forEach(p => { p[0] += d[0]; p[1] += d[1]; });
    for (const f of [...leaves, ...curls, ...flowers]) { if (!f.b) continue; let bd = .025, bp = null; const i0 = f.b[0] / OG | 0, j0 = f.b[1] / OG | 0;
      for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) for (const p of sp.get(okey(i, j)) ?? []) { const d = Math.hypot(p[0] - f.b[0], p[1] - f.b[1]); if (d < bd) { bd = d; bp = p; } }
      if (!bp) continue; const d = [bp[0] - f.b[0], bp[1] - f.b[1]]; for (const q of [f.outline, f.rib, f.pts, ...(f.cuts ?? [])]) if (q) sh(q, d); } }
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
  // 8. dots, sparingly, in the largest black left over
  const dots = poisson(A, 1, .05, r, p => C(p) > .02 && occFree(p, .045)).filter(() => r() < .3).map(p => ({ p, rad: .0062 * (.9 + r() * .2) }));
  // 9. the square: its cut edge wanders a hair
  const sq = [], ew = noise1(seed ^ 0x2f), per = 2 * (A + 1);
  for (let s = 0; s < per; s += .01) { let x, y, nx, ny; if (s < A) { x = s; y = 0; nx = 0; ny = -1; } else if (s < A + 1) { x = A; y = s - A; nx = 1; ny = 0; } else if (s < 2 * A + 1) { x = A - (s - A - 1); y = 1; nx = 0; ny = 1; } else { x = 0; y = 1 - (s - 2 * A - 1); nx = -1; ny = 0; }
    const e = (ew(s * 14) - .5) * .0026; sq.push([x + nx * e, y + ny * e]); }
  const bare = [...need.keys()].some(id => marks.filter(m => m.comp0 === id).length >= 3 && !reached.some(m => m.comp0 === id));
  return { stats: { marks: marks.length, reached: reached.length, full: !bare && reached.length >= marks.length * .6 }, ch, seed, letter: L, square: sq, stems, curls, leaves, flowers, dots, heroes };
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
