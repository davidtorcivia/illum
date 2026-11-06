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

  // 1. echoes: the contour at an even gap, outside the letter and round inside each counter
  const hosts = [];
  for (let k = 1; k <= Math.max(echoes, inner); k++) {
    const d = g * k * (1 + (r() - .5) * .08);
    for (const line of isolines(Dl, gw, gh, d * res)) {
      const pts = line.map(toPage), closed = pts.length > 3 && Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) < .01;
      const inCounter = isCounter(pts[(pts.length / 2) | 0]); if (k > (inCounter ? inner : echoes)) continue;
      // cut the line where it would come too near words or leave the field; keep runs long enough to read as drawn
      const ok = p => c0(p[0], p[1]) >= g * .7 || isCounter(p);
      let runs = [], cur = [];
      for (const p of pts) { if (ok(p)) cur.push(p); else { if (cur.length) runs.push(cur); cur = []; } }
      if (cur.length) runs.push(cur);
      if (closed && runs.length > 1 && ok(pts[0])) { const last = runs.pop(); runs[0] = [...last, ...runs[0]]; }
      const whole = closed && runs.length === 1 && runs[0].length === pts.length;
      for (const run of runs) {
        if (arclen(run) < g * 4) continue;
        let p = chaikin(resample(run, 1.2), 2, whole); p = wander(p, g * .07, seed + k * 31 + out.length, 22);
        accept(p, 'echo', { w: .62 - k * .03, start: whole ? 'cut' : 'taper', end: whole ? 'cut' : 'taper', closed: whole, level: k });
        hosts.push({ pts: p, depth: 0, level: k, counter: inCounter });
      }
    }
  }
  // 2. the staff: a pair of hairlines down the margin, slow, never quite parallel, a curl at each end
  if (staff) {
    const sx = staff.x, s = staff.side;
    for (let k = 0; k < 2; k++) {
      const x = sx + s * k * g * 1.05, y0 = staff.y0 - k * g * .6, y1 = staff.y1 - k * g * 1.4;
      const body = wander([[x, y0], [x, (y0 + y1) / 2], [x, y1]], g * .14, seed + 900 + k, 60);
      // the foot turns out into the margin and curls; the head turns the other way
      const foot = tendril(body.at(-1), Math.PI / 2, 26 + 10 * k + r() * 8, 0, s * -(.28 + r() * .08), 1.8);
      const head = tendril(body[0], -Math.PI / 2, 18 + 8 * k + r() * 6, 0, s * (.32 + r() * .08), 1.8).reverse();
      const pts = [...head.slice(0, -1), ...body, ...foot.slice(1)];
      accept(pts, 'staff', { w: .7, start: 'ball', end: 'ball' });
      hosts.push({ pts: body, depth: 0, staff: true });
    }
    // knots: every two lines or so a short bar ties the pair, as the scribe's pen crossed back
    const n = Math.floor((staff.y1 - staff.y0) / (g * 11));
    for (let i = 1; i < n; i++) { const y = staff.y0 + (staff.y1 - staff.y0) * i / n + (r() - .5) * g * 2;
      const a = [sx + s * -g * .7, y], b = [sx + s * g * 1.8, y + g * .5]; accept([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - .4], b], 'knot', { w: .55, start: 'taper', end: 'taper', soft: true }); }
  }
  // 3. scrolls: from points along the lines already drawn, small fiddleheads sprout into the open paper, the largest
  // that fits first, each ending in a bead. A scroll's own stem can carry a smaller one.
  const fits = (pts, skip) => { let s = 0;
    for (let i = 1; i < pts.length; i++) { s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (s < skip) continue;
      if (CL.get(pts[i][0], pts[i][1]) < g * .85) return false; }
    // the scroll's turns must keep the gap from one another
    const q = resample(pts, 1); for (let i = 0; i < q.length; i += 2) for (let j = i + Math.ceil(g * 4.2); j < q.length; j += 2)
      if (Math.hypot(q[i][0] - q[j][0], q[i][1] - q[j][1]) < g * .8) return false;
    return true; };
  const scroll = (p, t, side, dir, size) => {
    const d = [t[0] * dir, t[1] * dir], lean = side * dir, h = Math.atan2(d[1], d[0]) + lean * (.45 + r() * .3);
    const rEnd = size * (.9 + r() * .3), turns = 1.15 + r() * .5, pw = 2.1, L = 2 * Math.PI * turns * (pw + 1) * rEnd / 1.0;
    return tendril(p, h, L, lean * .01, lean / rEnd, pw, .5);
  };
  const SIZES = [2.4, 2, 1.65, 1.35, 1.1].map(v => v * g / 3);
  for (let pass = 0; pass < 3; pass++) {
    const list = hosts.filter(h => h.depth === pass);
    for (const host of list) {
      const P = resample(host.pts, 1), n = P.length, step = g * (3.4 + r() * 1.2) / density;
      for (let s0 = g * 2 + r() * step; s0 < n - g * 2; s0 += step * (.8 + r() * .5)) {
        const i = Math.round(s0), p = P[i], t = tangentAt(P, i);
        for (const side of r() < .5 ? [1, -1] : [-1, 1]) {
          const nrm = [-t[1] * side, t[0] * side], probe = [p[0] + nrm[0] * g * 1.6, p[1] + nrm[1] * g * 1.6];
          if (CL.get(probe[0], probe[1]) < g * 1.1) continue;
          const dirs = r() < .5 ? [1, -1] : [-1, 1];
          let done = false;
          for (const size of SIZES) { for (const dir of dirs) {
            const pts = scroll(p, t, side, dir, size); if (!fits(pts, g * 1.3)) continue;
            accept(pts, 'scroll', { w: .55, start: 'cut', end: 'ball', depth: pass });
            const stemPart = pts.slice(0, Math.floor(pts.length * .45)); if (pass < 2) hosts.push({ pts: stemPart, depth: pass + 1 });
            done = true; break; } if (done) break; }
          if (done) { s0 += step * .6; break; }
        }
      }
    }
  }
  return out;
}
