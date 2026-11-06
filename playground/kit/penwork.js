// Penwork: the hairline flourishing round a painted initial, grown from the letter's own shape.
// Pure geometry on grids (no canvas), so it can move to a worker. Page px throughout; grids carry their own resolution.
//
// After the pen-flourished initials of French and Italian books, c. 1230–1400 (Met 466179, 467422, 469041, 466790):
// the penwork is laid outward from the letter in the order a flourisher worked: first hairlines that echo the
// letter's contour at an even gap, then the staff down the margin, then small scrolls sprouting from those lines into
// whatever room is left, each ending in a bead. Everything hangs from a line already drawn; nothing floats.
import { tendril, resample, stream, noise1, PIGMENTS } from './marks.js';

// a flat, dense blue for letters (azurite laid thick and smooth; lapis in marks.js granulates too much for a letter)
PIGMENTS.azurite ??= { rgb: [34, 58, 146], gran: .03, rim: .28 };
PIGMENTS.minium ??= { rgb: [206, 66, 40], gran: .03, rim: .3 };

// ---- distance -----------------------------------------------------------------------------------------------------------
// Exact Euclidean distance transform (Felzenszwalb & Huttenlocher 2012): distance in cells from every cell to the
// nearest cell where feat is set.
export function edt(feat, w, h) {
  const INF = 1e20, n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  const D = new Float64Array(w * h); for (let i = 0; i < w * h; i++) D[i] = feat[i] ? 0 : INF;
  const pass = (len) => { let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < len; q++) { let s; while ((s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])) <= z[k]) k--; k++; v[k] = q; z[k] = s; z[k + 1] = INF; }
    k = 0; for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) ** 2 + f[v[k]]; } };
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = D[y * w + x]; pass(h); for (let y = 0; y < h; y++) D[y * w + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = D[y * w + x]; pass(w); for (let x = 0; x < w; x++) D[y * w + x] = d[x]; }
  const out = new Float32Array(w * h); for (let i = 0; i < w * h; i++) out[i] = Math.sqrt(D[i]); return out;
}

// ---- contours -----------------------------------------------------------------------------------------------------------
// Marching squares: the level set F = L as chained polylines (closed ones repeat their first point), in cell units.
const SEG = [[], [[3, 0]], [[0, 1]], [[3, 1]], [[1, 2]], null, [[0, 2]], [[3, 2]], [[2, 3]], [[0, 2]], null, [[1, 2]], [[1, 3]], [[0, 1]], [[3, 0]], []];
export function isolines(F, w, h, L) {
  const adj = new Map(), link = (a, b) => { (adj.get(a) ?? adj.set(a, []).get(a)).push(b); (adj.get(b) ?? adj.set(b, []).get(b)).push(a); };
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const a = F[y * w + x], b = F[y * w + x + 1], c = F[(y + 1) * w + x + 1], d = F[(y + 1) * w + x];
    const code = (a > L) | (b > L) << 1 | (c > L) << 2 | (d > L) << 3; if (!code || code === 15) continue;
    const E = [(y * w + x) * 2, (y * w + x + 1) * 2 + 1, ((y + 1) * w + x) * 2, (y * w + x) * 2 + 1];
    let segs = SEG[code];
    // saddles: when the centre is inside, the two inside corners join and the cut goes round the outside ones
    if (!segs) { const mid = (a + b + c + d) / 4 > L; segs = (code === 5) === mid ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]]; }
    for (const [p, q] of segs) link(E[p], E[q]);
  }
  const at = e => { const c = e >> 1, x = c % w, y = (c / w) | 0, a = F[c];
    if (e & 1) { const b = F[c + w]; return [x, y + (L - a) / (b - a)]; } const b = F[c + 1]; return [x + (L - a) / (b - a), y]; };
  const seen = new Set(), out = [];
  const walk = s => { const line = [s]; seen.add(s); let prev = -1, cur = s;
    for (;;) { const nx = adj.get(cur).find(e => e !== prev && !seen.has(e)); if (nx === undefined) { if (adj.get(cur).includes(s) && line.length > 2) line.push(s); break; }
      seen.add(nx); line.push(nx); prev = cur; cur = nx; }
    return line.map(at); };
  for (const [e, l] of adj) if (l.length === 1 && !seen.has(e)) out.push(walk(e));
  for (const [e] of adj) if (!seen.has(e)) out.push(walk(e));
  return out;
}

// ---- small geometry -------------------------------------------------------------------------------------------------------
export const chaikin = (p, it = 2, closed = false) => { for (let k = 0; k < it; k++) { const o = closed ? [] : [p[0]];
  for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; o.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); }
  if (closed) o.push(o[0]); else o.push(p[p.length - 1]); p = o; } return p; };
export const arclen = p => p.reduce((a, q, i) => i ? a + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0);
const tangentAt = (p, i) => { const a = p[Math.max(0, i - 2)], b = p[Math.min(p.length - 1, i + 2)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
// a hand does not hold a gap exactly: drift a line sideways a little, slowly
const wander = (p, amp, seed, scale = 26) => { const n = noise1(seed), q = resample(p, 1);
  return q.map((pt, i) => { const t = tangentAt(q, i), o = (n(i / scale) - .5) * 2 * amp; return [pt[0] - t[1] * o, pt[1] + t[0] * o]; }); };

// ---- clearance --------------------------------------------------------------------------------------------------------------
// Distance from each cell (1 px) to the nearest thing already on the page: the letter, the words, the edge of the field,
// and every line drawn so far. New lines are stamped in as they are accepted, so spacing is even by construction.
function clearance(x0, y0, w, h, blocked, cap) {
  const C = edt(blocked, w, h); for (let i = 0; i < C.length; i++) C[i] = Math.min(cap, C[i]);
  const get = (x, y) => { const i = Math.round(x - x0), j = Math.round(y - y0); return i < 0 || j < 0 || i >= w || j >= h ? 0 : C[j * w + i]; };
  const stamp = (pts, R = cap) => { for (const [px, py] of resample(pts, .8)) {
    const cx = px - x0, cy = py - y0, i0 = Math.max(0, Math.floor(cx - R)), i1 = Math.min(w - 1, Math.ceil(cx + R)), j0 = Math.max(0, Math.floor(cy - R)), j1 = Math.min(h - 1, Math.ceil(cy + R));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.hypot(i - cx, j - cy), k = j * w + i; if (d < C[k]) C[k] = d; } } };
  return { get, stamp, C };
}

// ---- the letter --------------------------------------------------------------------------------------------------------------
// The reserved hairline: down the thickest strokes the paint is kept off a fine line of bare parchment, as the
// limner did on the blue letters of 466179. Returns a copy of the mask with the slot cut out (frac: how much of the
// thickest stroke qualifies; width in px).
export function reserve({ M, w, h, res }, frac = .8, width = .7) {
  const ink = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) ink[i] = M[i] <= .5;
  const Din = edt(ink, w, h); let mx = 0; for (const v of Din) mx = Math.max(mx, v);
  const out = Float32Array.from(M), t = mx * frac;
  for (let i = 0; i < w * h; i++) { const v = Din[i]; if (v < t) continue;
    // the slot is the ridge of the distance field: cells whose distance hardly rises in any direction
    const x = i % w, y = (i / w) | 0; if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) continue;
    const gx = (Din[i + 1] - Din[i - 1]) / 2, gy = (Din[i + w] - Din[i - w]) / 2, gm = Math.hypot(gx, gy);
    const k = Math.max(0, Math.min(1, (.62 - gm) / .3)) * Math.min(1, (v - t) / (res * .6));
    out[i] = M[i] * (1 - k); }
  return out;
}

// ---- the flourish -------------------------------------------------------------------------------------------------------------
// glyph: { M, w, h, x0, y0, res } coverage mask of the painted letter (res cells per px), its top-left at page x0, y0.
// field: [x0, y0, x1, y1] the cloud the penwork may fill. keep: rects [x0, y0, x1, y1] of words (already padded).
// staff: null or { x, y0, y1, side } a pair of hairlines down the margin. g: the gap between hairlines (px).
// echoes: how many contour echoes outside; inner: how many inside the counters. Returns strokes in drawing order:
// { pts, kind, w, end } (kind: echo | staff | scroll | knot), each to be drawn with the pen.
export function flourish({ glyph, field, keep = [], staff = null, g = 3, echoes = 2, inner = 2, seed = 1, density = 1, reach = 1 }) {
  const r = stream(seed, 'penwork'), out = [];
  // the working grid: the field and the staff's run, at 1 px
  const X0 = Math.floor(Math.min(field[0], staff ? staff.x - 40 : 1e9)) - 2, Y0 = Math.floor(Math.min(field[1], staff ? staff.y0 - 30 : 1e9)) - 2;
  const X1 = Math.ceil(Math.max(field[2], staff ? staff.x + 10 : -1e9)) + 2, Y1 = Math.ceil(Math.max(field[3], staff ? staff.y1 + 30 : -1e9)) + 2;
  const W = X1 - X0, H = Y1 - Y0;
  // the letter at its own resolution: its distance field gives the echoes
  const { M, w: gw, h: gh, x0: gx, y0: gy, res } = glyph, ink = new Uint8Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) ink[i] = M[i] > .5;
  const Dl = edt(ink, gw, gh);
  // what may be drawn on: inside the field (or the staff's lane) and away from the words
  const inField = (x, y) => x >= field[0] && x <= field[2] && y >= field[1] && y <= field[3];
  const lane = staff ? (x, y) => y >= staff.y0 - 30 && y <= staff.y1 + 30 && (staff.side < 0 ? x >= staff.x - 34 * reach && x <= staff.x + 2 : x <= staff.x + 34 * reach && x >= staff.x - 2) : () => false;
  const inWords = (x, y, pad = 0) => keep.some(k => x >= k[0] - pad && x <= k[2] + pad && y >= k[1] - pad && y <= k[3] + pad);
  const blocked = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = X0 + i + .5, y = Y0 + j + .5;
    const gi = Math.round((x - gx) * res), gj = Math.round((y - gy) * res), onL = gi >= 0 && gj >= 0 && gi < gw && gj < gh && ink[gj * gw + gi];
    blocked[j * W + i] = onL || inWords(x, y) || !(inField(x, y) || lane(x, y)); }
  const CL = clearance(X0, Y0, W, H, blocked, 14);
  // the static clearance (before any line): an echo stops where it would come near a word or the field's edge
  const C0 = Float32Array.from(CL.C), c0 = (x, y) => { const i = Math.round(x - X0), j = Math.round(y - Y0); return i < 0 || j < 0 || i >= W || j >= H ? 0 : C0[j * W + i]; };
  const toPage = ([x, y]) => [gx + (x + .5) / res, gy + (y + .5) / res];
  const accept = (pts, kind, o = {}) => { out.push({ pts, kind, ...o }); CL.stamp(pts); };

  // counters: the paper enclosed by the letter (not reachable from the mask's border)
  const outside = new Uint8Array(gw * gh), st = [];
  for (let x = 0; x < gw; x++) st.push(x, (gh - 1) * gw + x); for (let y = 0; y < gh; y++) st.push(y * gw, y * gw + gw - 1);
  while (st.length) { const i = st.pop(); if (outside[i] || ink[i]) continue; outside[i] = 1; const x = i % gw;
    if (x > 0) st.push(i - 1); if (x < gw - 1) st.push(i + 1); if (i >= gw) st.push(i - gw); if (i < gw * (gh - 1)) st.push(i + gw); }
  const isCounter = (p) => { const i = Math.round((p[0] - gx) * res), j = Math.round((p[1] - gy) * res); return i >= 0 && j >= 0 && i < gw && j < gh && !ink[j * gw + i] && !outside[j * gw + i]; };

  // the letter's box and the outward normal of its distance field (pointing away from the ink)
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) if (ink[j * gw + i]) { bx0 = Math.min(bx0, i); bx1 = Math.max(bx1, i); by0 = Math.min(by0, j); by1 = Math.max(by1, j); }
  const box = [gx + bx0 / res, gy + by0 / res, gx + (bx1 + 1) / res, gy + (by1 + 1) / res];
  const dl = (x, y) => { const i = Math.max(0, Math.min(gw - 1, Math.round((x - gx) * res))), j = Math.max(0, Math.min(gh - 1, Math.round((y - gy) * res))); return Dl[j * gw + i] / res; };
  const outward = p => { const e = .75, nx = dl(p[0] + e, p[1]) - dl(p[0] - e, p[1]), ny = dl(p[0], p[1] + e) - dl(p[0], p[1] - e), l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l]; };
  const fits = (pts, skip, split = 0) => { let s = 0;
    for (let i = 1; i < pts.length; i++) { s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (s < skip) continue;
      if (CL.get(pts[i][0], pts[i][1]) < g * .85) return false; }
    // a scroll's turns keep the gap by construction; its stem must keep it from the turns (split: where the stem ends)
    if (split) { const sp = pts.slice(split + Math.ceil(g * 3)); for (let i = 0; i < split; i++) for (const q of sp) if (Math.hypot(pts[i][0] - q[0], pts[i][1] - q[1]) < g * .85) return false; }
    return true; };
  const hosts = [];
  // a line that stops in open paper turns over into a curl, away from the letter, if there is room for one
  const curlOff = (run, atEnd, size) => {
    const P = atEnd ? run : [...run].reverse(), n = P.length, t = tangentAt(P, n - 1), h = Math.atan2(t[1], t[0]);
    let best = null;
    for (const sg of [1, -1]) { const c = tendril(P[n - 1], h, size * 2 * Math.PI * 1.5 * 2.3, sg * .02, sg / size, 1.3, .5);
      if (!fits(c, g * .8)) continue; const m = c[(c.length * .6) | 0], away = dl(m[0], m[1]); if (!best || away > best.away) best = { c, away }; }
    return best && best.c;
  };

  // 1. echoes: hairlines at an even gap round the inside of every counter, and outside only along the letter's top,
  // where the margin and the paper above are open (the sides that face the words are left plain)
  for (let k = 1; k <= Math.max(echoes, inner); k++) {
    const d = g * k * (1 + (r() - .5) * .08);
    for (const line of isolines(Dl, gw, gh, d * res)) {
      const pts = line.map(toPage), closed = pts.length > 3 && Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) < .01;
      const inCounter = isCounter(pts[(pts.length / 2) | 0]); if (k > (inCounter ? inner : echoes)) continue;
      const ok = inCounter ? () => true : p => { const n = outward(p); return n[1] < -.55 && n[0] < .5 && c0(p[0], p[1]) >= g * .7; };
      let runs = [], cur = [];
      for (const p of pts) { if (ok(p)) cur.push(p); else { if (cur.length) runs.push(cur); cur = []; } }
      if (cur.length) runs.push(cur);
      if (closed && runs.length > 1 && ok(pts[0])) { const last = runs.pop(); runs[0] = [...last, ...runs[0]]; }
      const whole = closed && runs.length === 1 && runs[0].length === pts.length;
      for (const run of runs) {
        if (arclen(run) < g * 4) continue;
        let p = chaikin(resample(run, 1.2), 2, whole); p = wander(p, g * .07, seed + k * 31 + out.length, 22);
        if (!whole) { const a = curlOff(p, false, g * (.45 + .1 * k)), b = curlOff(p, true, g * (.5 + .1 * k));
          if (a) p = [...a.reverse(), ...p]; if (b) p = [...p, ...b.slice(1)];
          accept(p, 'echo', { w: .6, start: a ? 'pool' : 'taper', end: b ? 'ball' : 'taper', level: k }); }
        else accept(p, 'echo', { w: .6 - k * .03, start: 'cut', end: 'cut', closed: true, level: k });
        hosts.push({ pts: p, depth: 0, level: k, counter: inCounter });
      }
    }
  }
  // 2. the staff: a pair of hairlines close beside the letter and on down the margin, slow, never quite parallel;
  // at the head the inner one turns over the letter and the outer one out into the margin; the outer foot curls
  if (staff) {
    const sx = staff.x, s = staff.side;
    for (let k = 0; k < 2; k++) {
      const x = sx + s * k * g * 1.05, y0 = staff.y0 - k * g * .5, y1 = staff.y1 + (k ? g * 2 : -g * 1.5);
      const body = wander([[x, y0], [x, (y0 + y1) / 2], [x, y1]], g * .12, seed + 900 + k, 60);
      const head = tendril(body[0], -Math.PI / 2, (k ? 16 : 22) + r() * 6, 0, (k ? s : -s) * (.3 + r() * .08), 1.6).reverse();
      const foot = k ? tendril(body.at(-1), Math.PI / 2, 24 + r() * 8, 0, -s * (.3 + r() * .06), 1.6) : tendril(body.at(-1), Math.PI / 2, 7, 0, s * .03, 1);
      const pts = [...head.slice(0, -1), ...body, ...foot.slice(1)];
      accept(pts, 'staff', { w: .66, start: 'pool', end: k ? 'ball' : 'taper' });
      hosts.push({ pts: body, depth: 0, staff: k }); if (!k) hosts.push({ pts: head, depth: 0, maxR: g * 1.6 });
    }
    // knots: here and there a short bar ties the pair, as the pen crossed back (never beside the letter itself)
    const n = Math.floor((staff.y1 - staff.y0) / (g * 13));
    for (let i = 1; i < n; i++) { const y = staff.y0 + (staff.y1 - staff.y0) * i / n + (r() - .5) * g * 2; if (y > box[1] - g * 2 && y < box[3] + g * 2) continue;
      const a = [sx - s * g * .3, y], b = [sx + s * g * 1.75, y + g * .35]; accept([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - .3], b], 'knot', { w: .5, start: 'taper', end: 'taper' }); }
  }
  // 3. scrolls: from points along the lines already drawn, small fiddleheads sprout into the open paper, the largest
  // that fits first, each ending in a bead; a scroll's own stem can carry a smaller one. They come thicker near the
  // letter and thin out down the staff.
  // a scroll: a short stem leaving the line at a slant, then a spiral whose turns keep the gap, finished in a bead.
  // R is its outer radius; sense chooses which way it winds (toward the line it hangs from, or away)
  const scroll = (p, t, side, dir, R, sense) => {
    const d = [t[0] * dir, t[1] * dir], n = [-t[1] * side, t[0] * side], rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
    const turnN = Math.sign(d[0] * n[1] - d[1] * n[0]);   // rotating d by +turnN·angle swings it toward n
    const a0 = (.3 + r() * .35) * turnN, a1 = (.75 + r() * .6) * turnN, e0 = rot(d, a0), e = rot(d, a1), Ls = g * (1.2 + r() * 2.2) + R * .4;
    const q = [p[0] + (e0[0] + e[0]) / 2 * Ls, p[1] + (e0[1] + e[1]) / 2 * Ls];
    const stem = []; for (let i = 0; i <= 12; i++) { const u = i / 12, v = 1 - u, c1 = [p[0] + e0[0] * Ls / 3, p[1] + e0[1] * Ls / 3], c2 = [q[0] - e[0] * Ls / 3, q[1] - e[1] * Ls / 3];
      stem.push([0, 1].map(k => v * v * v * p[k] + 3 * v * v * u * c1[k] + 3 * v * u * u * c2[k] + u * u * u * q[k])); }
    const sg = sense * turnN, rin = g * (.42 + r() * .1), T = Math.max(.75, Math.min(2.1, (R - rin) / (g * (1 + r() * .15))));
    const cdir = rot(e, sg * Math.PI / 2), c = [q[0] + cdir[0] * R, q[1] + cdir[1] * R], phi0 = Math.atan2(-cdir[1], -cdir[0]), Th = 2 * Math.PI * T;
    // a hand's spiral is never round: a little oval, tilted its own way
    const ov = .1 + r() * .12, tilt = r() * Math.PI, sp = [];
    for (let th = 0; th <= Th; th += .81 / Math.max(R, 1)) { const a = phi0 + sg * th, rr = (R - (R - rin) * Math.pow(th / Th, .92)) * (1 + ov * Math.cos(2 * (a - tilt)) - ov * Math.cos(2 * (phi0 - tilt)) * Math.max(0, 1 - th / 1.2));
      sp.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]); }
    return [...stem, ...sp.slice(1)];
  };
  const SIZES = [2.3, 1.9, 1.55, 1.25, 1].map(v => v * g);
  const far = p => Math.max(0, p[1] - box[3], box[1] - p[1]) / Math.max(10, box[3] - box[1]);
  for (let pass = 0; pass < 3; pass++) {
    const list = hosts.filter(h => h.depth === pass && h.staff !== 0);
    for (const host of list) {
      const P = resample(host.pts, 1), n = P.length, base = g * (3.6 + r() * 1.2) / density, maxR = host.maxR ?? SIZES[0];
      for (let s0 = g * 2 + r() * base; s0 < n - g * 2;) {
        const i = Math.round(s0), p = P[i], t = tangentAt(P, i), step = base * (1 + 2.2 * far(p));
        s0 += step * (.8 + r() * .5);
        for (const side of r() < .5 ? [1, -1] : [-1, 1]) {
          const nrm = [-t[1] * side, t[0] * side], probe = [p[0] + nrm[0] * g * 1.6, p[1] + nrm[1] * g * 1.6];
          if (CL.get(probe[0], probe[1]) < g * 1.1) continue;
          const dirs = r() < .5 ? [1, -1] : [-1, 1];
          let done = false;
          const big = SIZES.filter(v => v <= maxR * (1 - .25 * pass));
          for (const R of big) { for (const dir of dirs) for (const sense of r() < .6 ? [1, -1] : [-1, 1]) {
            if (done) break;
            const pts = scroll(p, t, side, dir, R * (.92 + r() * .16), sense); if (!fits(pts, g * 1.3, 13)) continue;
            accept(pts, 'scroll', { w: .52, start: 'cut', end: 'ball', depth: pass });
            if (pass < 2) hosts.push({ pts: pts.slice(0, 13 + Math.floor((pts.length - 13) * .3)), depth: pass + 1 });
            done = true; } if (done) break; }
          if (done) { s0 += step * .5; break; }
        }
      }
    }
  }
  return out;
}
