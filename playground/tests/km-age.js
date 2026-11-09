// Weathering by cause, for the paint bench (research/21-paint.md; the session's paintres/weathering.md). A fixed function of
// the paint's own fields — its thickness, its pigment, the skin's cockle, the reader's hand — never a noise layer:
//   cracks: Paquette, Poulin & Drettakis 2002, cut down: a film shrinks, its stress ∝ brittleness × thickness^1.2 (more on a
//     cockle's crest, less strength at the paint's edge); a crack starts at the worst flaw and runs to extinction (stops
//     where the stress falls under the propagation strength, or joins an earlier crack: T-junctions), relaxing the stress
//     within D_r ∝ thickness on each side — so thick paint breaks into few big islands and a thin wash not at all;
//   losses: islands fall in order of their detachment (stress over the pigment's adhesion, more at edges, crests and under
//     the hand) until the pigment's budget × age is spent; a loss shows what lies beneath: the vellum, a trace of tint, the
//     pen line if it ran under; orpiment crumbles a little round its losses;
//   handling: one smooth field from the lower outer corner thins the exposed paint and soils the vellum;
//   grime: soil in the skin's hollows and at the step of every loss.
// age 0 changes nothing. Cracks are drawn as coverage (a 20 µm gap is a quarter of a pixel at page size, a line at 400%).
import { hash2 } from '../kit/marks.js';
import { Grid, blur, smooth } from '../kit/styles/insular-paint.js';

// brittleness (stress per thickness), adhesion, loss budget at age 1 (% of its area), crumbly rim, the thickness under which
// a film does not crack. Starting values from weathering.md §5 (vermilion 1.4 % is the one measured anchor; age 1 is about
// twice Lindisfarne's own state, so the default .35 is a well-kept book).
export const AGE = {
  orpiment: { b: 1.6, Sa: .55, budget: 5, crumb: true, tc: .55 },
  redlead:  { b: 1.0, Sa: 1.0, budget: 1.6, tc: .7 },
  knot:     { b: .55, Sa: 1.0, budget: .4, tc: 1.15 },
  blue:     { b: .8, Sa: 1.0, budget: .3, tc: .8 },
  indigo:   { b: .8, Sa: 1.0, budget: .3, tc: .8 },
  vergaut:  { b: 1.2, Sa: .7, budget: 2, tc: .7 },
  dark:     { b: 1.1, Sa: .8, budget: 1.2, tc: .9 },
};

export function weather(G, P, layers, { age = .35, seed = 1, corner = null, cell = .05, flex = Math.PI / 2 } = {}) {
  if (!(age > 0)) return { layers, cracks: [] };
  const out = layers.map(l => ({ ...l, tau: l.tau.slice() })), { n } = G, cracks = [];
  // the reader's hand: lower outer corner (mm, in the piece's frame), a thumb-and-finger zone 25 × 40 mm
  const cx = corner ? corner[0] : G.x0 + G.w / G.pxmm + 25, cy = corner ? corner[1] : G.y0 + G.h / G.pxmm + 15;
  const H = new Float32Array(n); for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) { const dx = (G.x(i) - cx) / 25, dy = (G.y(j) - cy) / 40; H[j * G.w + i] = Math.exp(-(dx * dx + dy * dy)); }
  // the cockle's crests (where the leaf bulged, the film stretched)
  const zb = blur(P.zp, G.w, G.h, 2.5 * G.pxmm), zbb = blur(P.zp, G.w, G.h, 8 * G.pxmm), crest = new Float32Array(n), hollow = new Float32Array(n); for (let q = 0; q < n; q++) { crest[q] = Math.max(0, Math.min(1, (zb[q] - zbb[q]) / 6)); hollow[q] = Math.max(0, Math.min(1, (zbb[q] - zb[q]) / 6)); }
  const lossAll = new Float32Array(n);
  for (const L of out) {
    const A = AGE[L.kind]; if (!A) continue;
    const r = crackAndFlake(G, L.tau, A, { age, seed: seed * 7 + L.kind.length * 131, crest, H, cell, flex });
    cracks.push(...r.cracks.map(c => ({ ...c, kind: L.kind })));
    for (let q = 0; q < n; q++) { const lo = r.loss[q]; if (lo > 0) { L.tau[q] *= 1 - lo * .88; lossAll[q] = Math.max(lossAll[q], lo); } if (r.crumb[q] > 0) L.tau[q] *= 1 - .4 * r.crumb[q]; if (r.crack[q] > 0) L.tau[q] *= 1 - r.crack[q]; }
    L.crack = r.crack;
  }
  // handling: the exposed paint thinned where it stood highest (its own thick spots) and toward the hand
  for (const L of out) { if (L.kind === 'grime') continue; const T = L.tau, Tb = blur(T, G.w, G.h, .5 * G.pxmm);
    for (let q = 0; q < n; q++) if (T[q] > 0) T[q] *= 1 - .5 * age * H[q] * (.4 + .6 * smooth(0, .3, T[q] - Tb[q])); }
  // grime: on the bare skin toward the hand and in its hollows; at the step round a loss; in the cracks
  const g = new Float32Array(n), paint = new Float32Array(n); for (const L of out) for (let q = 0; q < n; q++) paint[q] = Math.max(paint[q], Math.min(1, L.tau[q]));
  const lb = blur(lossAll, G.w, G.h, Math.max(.6, .04 * G.pxmm));
  for (let q = 0; q < n; q++) { let crk = 0; for (const L of out) if (L.crack) crk = Math.max(crk, L.crack[q]);
    g[q] = age * ((.22 * H[q] + .1 * hollow[q]) * (1 - .7 * paint[q]) * (1 - lossAll[q]) + .9 * Math.max(0, lb[q] - lossAll[q]) * 2 + .7 * crk); }
  out.push({ pig: { OD: [.6, .75, 1] }, tau: g, kind: 'grime' });
  return { layers: out, cracks, loss: lossAll };
}

// One film's cracks and flakes on a cell grid (mm) — the same for any render resolution.
function crackAndFlake(G, T, A, { age, seed, crest, H, cell, flex }) {
  const C = new Grid([G.x0, G.y0, G.x0 + G.w / G.pxmm, G.y0 + G.h / G.pxmm], 1 / cell), { w, h } = C, N = w * h;
  const at = (F, x, y) => { const i = Math.min(G.w - 1, Math.max(0, Math.floor((x - G.x0) * G.pxmm))), j = Math.min(G.h - 1, Math.max(0, Math.floor((y - G.y0) * G.pxmm))); return F[j * G.w + i]; };
  const tau = new Float32Array(N), cr = new Float32Array(N), hh = new Float32Array(N);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, x = C.x(i), y = C.y(j); tau[q] = at(T, x, y); cr[q] = at(crest, x, y); hh[q] = at(H, x, y); }
  // edge: how near the paint's own boundary (strength falls there: the film is thinner and less held)
  const inP = new Float32Array(N); for (let q = 0; q < N; q++) inP[q] = tau[q] > .05 ? 1 : 0;
  const pb = blur(inP, w, h, .12 / cell), edge = new Float32Array(N); for (let q = 0; q < N; q++) edge[q] = inP[q] ? Math.max(0, Math.min(1, (1 - pb[q]) * 2.2)) : 0;
  const sig = new Float32Array(N), Sb = new Float32Array(N), flaw = q => .97 + .06 * hash2(q % w, Math.floor(q / w), seed);
  const S0 = 1.75 - 1.25 * age;
  for (let q = 0; q < N; q++) { if (tau[q] < A.tc) continue; sig[q] = A.b * tau[q] ** 1.2 * (1 + .8 * cr[q]) * flaw(q); Sb[q] = S0 * (1 - .35 * edge[q]); }
  // cracks, sequentially, each to extinction
  const own = new Int32Array(N).fill(-1), cracks = [], Dr = q => .28 * Math.max(.6, tau[q]);
  const cellOf = (x, y) => { const i = Math.floor((x - C.x0) / cell), j = Math.floor((y - C.y0) / cell); return i < 0 || j < 0 || i >= w || j >= h ? -1 : j * w + i; };
  // the worst flaws first (stress only falls as cracks relax it, so a flaw passed over stays passed)
  const cand = []; for (let q = 0; q < N; q++) if (sig[q] > Sb[q]) cand.push(q); cand.sort((a, b) => sig[b] / Sb[b] - sig[a] / Sb[a]);
  for (let k = 0, ci = 0; k < 400 && ci < cand.length; k++) {
    let best = -1; while (ci < cand.length) { const q = cand[ci++]; if (own[q] < 0 && sig[q] > Sb[q]) { best = q; break; } }
    if (best < 0) break;
    const x0 = C.x(best % w), y0 = C.y(Math.floor(best / w)), th0 = flex + (hash2(k, seed, 1) - .5) * 1.4, line = [[x0, y0]];
    const ends = [];
    for (const dir of [0, Math.PI]) {
      let x = x0, y = y0, th = th0 + dir, joined = false; const pts = [];
      for (let st = 0; st < 400; st++) {
        th += (hash2(k * 977 + st, seed, dir ? 5 : 3) - .5) * .35;   // the material's grain, a little at each step
        // attraction: an earlier crack within reach is met square on (T-junction)
        let ax = 0, ay = 0, found = false; const ci = Math.floor((x - C.x0) / cell), cj = Math.floor((y - C.y0) / cell);
        for (let dj = -3; dj <= 3 && !found; dj++) for (let di = -3; di <= 3; di++) { const ii = ci + di, jj = cj + dj; if (ii < 0 || jj < 0 || ii >= w || jj >= h) continue; const o = own[jj * w + ii]; if (o >= 0 && o !== k) { ax = di; ay = dj; found = true; break; } }
        if (found) { const ta = Math.atan2(ay, ax); let d = ta - th; d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI; if (Math.abs(d) < 1.6) th += d * .5; }
        const step = cell * (.5 + .5 * hash2(st, k, seed + 9)); x += Math.cos(th) * step; y += Math.sin(th) * step;
        const q = cellOf(x, y); if (q < 0 || tau[q] < A.tc * .8) break;
        if (own[q] >= 0 && own[q] !== k) { pts.push([x, y]); joined = true; break; }
        if (sig[q] < Sb[q] / 1.5) break;
        own[q] = k; pts.push([x, y]);
      }
      ends.push(joined); if (dir === 0) line.push(...pts); else line.unshift(...pts.reverse());
    }
    own[best] = k;
    if (line.length < 3) { sig[best] = 0; continue; }
    // relax the stress within D_r of the crack (perpendicular release), so the next starts elsewhere
    for (const [x, y] of line) { const q0 = cellOf(x, y); if (q0 < 0) continue; const R = Dr(q0), rc = Math.ceil(R / cell), ci = q0 % w, cj = Math.floor(q0 / w);
      for (let dj = -rc; dj <= rc; dj++) for (let di = -rc; di <= rc; di++) { const ii = ci + di, jj = cj + dj; if (ii < 0 || jj < 0 || ii >= w || jj >= h) continue; const d = Math.hypot(di, dj) * cell; if (d < R) { const q = jj * w + ii; sig[q] *= d / R; } } }
    cracks.push({ pts: line, w: .006 + .01 * Math.min(2, tau[best]), joined: ends });
  }
  // islands: the film's cells parted by the cracks
  const lab = new Int32Array(N).fill(-1), isl = [];
  for (let q0 = 0; q0 < N; q0++) { if (tau[q0] < A.tc * .8 || own[q0] >= 0 || lab[q0] >= 0) continue; const st = [q0], px = []; lab[q0] = isl.length;
    while (st.length) { const q = st.pop(); px.push(q); const i = q % w, j = (q - i) / w; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= w || jj >= h) continue; const r = jj * w + ii; if (lab[r] < 0 && own[r] < 0 && tau[r] >= A.tc * .8) { lab[r] = isl.length; st.push(r); } } }
    let t = 0, e = 0, c = 0, hd = 0; for (const q of px) { t += tau[q]; e += edge[q]; c += cr[q]; hd += hh[q]; } const m = px.length;
    isl.push({ px, area: m * cell * cell, score: (A.b * (t / m) ** 1.2 / A.Sa) * (1 + 1.5 * e / m + .8 * c / m + 1.2 * hd / m) * (.97 + .06 * hash2(isl.length, seed, 2)) }); }
  let paintArea = 0; for (let q = 0; q < N; q++) if (tau[q] > .05) paintArea += cell * cell;
  const budget = A.budget / 100 * Math.min(1, age) * paintArea, lostC = new Float32Array(N); let lost = 0;
  for (const I of isl.filter(I => I.area < 1.2 && I.px.length < N / 4).sort((a, b) => b.score - a.score)) { if (lost >= budget) break; if (lost + I.area > budget * 1.5) continue; for (const q of I.px) lostC[q] = 1; lost += I.area; }
  if (globalThis.AGE_DEBUG) console.log('age', A.b, 'cracks', cracks.length, 'islands', isl.length, 'paint mm2', paintArea.toFixed(1), 'budget', budget.toFixed(2), 'lost', lost.toFixed(2));
  // a crack between two fallen cells fell with them; orpiment crumbles one cell round its losses
  const crumbC = new Float32Array(N);
  for (let q = 0; q < N; q++) { if (lostC[q]) continue; const i = q % w, j = (q - i) / w; let nl = 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < w && jj < h && lostC[jj * w + ii]) nl++; }
    if (own[q] >= 0 && nl >= 2) lostC[q] = 1; else if (A.crumb && nl && tau[q] > .05 && hash2(i, j, seed + 3) < .5) crumbC[q] = 1; }
  // to the render grid: losses crisp (bilinear cells thresholded at the pixel), cracks as coverage
  const loss = new Float32Array(G.n), crumb = new Float32Array(G.n), crack = new Float32Array(G.n), e = 1 / (cell * G.pxmm);
  for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) { const fx = (G.x(i) - C.x0) / cell - .5, fy = (G.y(j) - C.y0) / cell - .5, i0 = Math.max(0, Math.min(w - 2, Math.floor(fx))), j0 = Math.max(0, Math.min(h - 2, Math.floor(fy))), u = Math.min(1, Math.max(0, fx - i0)), v = Math.min(1, Math.max(0, fy - j0)), b = j0 * w + i0;
    const L = (lostC[b] * (1 - u) + lostC[b + 1] * u) * (1 - v) + (lostC[b + w] * (1 - u) + lostC[b + w + 1] * u) * v, Cm = (crumbC[b] * (1 - u) + crumbC[b + 1] * u) * (1 - v) + (crumbC[b + w] * (1 - u) + crumbC[b + w + 1] * u) * v;
    const q = j * G.w + i; loss[q] = Math.max(0, Math.min(1, (L - .5) / Math.max(e, .02) * .5 + .5)) * (T[q] > 0 ? 1 : 0); crumb[q] = Cm > .5 ? 1 : 0; }
  for (const c of cracks) { const n = c.pts.length;
    for (let k = 0; k + 1 < n; k++) { const [ax, ay] = c.pts[k], [bx, by] = c.pts[k + 1], tap = Math.min(1, Math.min(k, n - 1 - k) / 4 + (k < n / 2 ? +c.joined[1] : +c.joined[0])), wd = c.w * Math.max(.3, tap);
      const ex = bx - ax, ey = by - ay, L2 = ex * ex + ey * ey || 1e-9, i0 = Math.max(0, Math.floor((Math.min(ax, bx) - G.x0) * G.pxmm) - 2), i1 = Math.min(G.w - 1, Math.ceil((Math.max(ax, bx) - G.x0) * G.pxmm) + 2), j0 = Math.max(0, Math.floor((Math.min(ay, by) - G.y0) * G.pxmm) - 2), j1 = Math.min(G.h - 1, Math.ceil((Math.max(ay, by) - G.y0) * G.pxmm) + 2);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = G.x(i) - ax, dy = G.y(j) - ay; let t = (dx * ex + dy * ey) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; const d = Math.hypot(dx - t * ex, dy - t * ey) * G.pxmm, wp = wd * G.pxmm;
        // area coverage of a line wp px wide seen through a 1 px pixel
        const cov = wp >= 1 ? Math.max(0, Math.min(1, wp / 2 + .5 - d)) : wp * Math.max(0, 1 - d); const q = j * G.w + i; if (cov > crack[q]) crack[q] = Math.min(.95, cov); } } }
  return { loss, crumb, crack, cracks };
}
