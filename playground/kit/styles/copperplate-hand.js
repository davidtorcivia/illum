// The command of hand as a movement (research/23-copperplate.md, stage 2): a flourish is one continuous movement of the
// hand, planned as a sequence of intentions (go toward a point, turn a loop, run on, close in a curl), and executed by a
// pen with momentum: its heading turns at a curvature that follows the intention only through a lag, so direction carries
// from one loop into the next, the curvature changes smoothly, and every loop is entered and left by the way the hand was
// already moving. Nothing is copied round a ring; loops differ because the movement into each differs.
//   move(p0, heading, plan, { ds, lag })  ->  { p: points ~ds apart, part: the plan step each point belongs to }
// plan steps (page px, radians; heading 0 = rightward, a positive turn is clockwise on the page):
//   { go: [x, y], look, near }          steer toward a point (pure pursuit with a look-ahead) until within `near`
//   { loop: r, sense, turn, oval, lean } turn through `turn` (default one turn) at radius r, an oval: the radius r(1 + oval)
//                                        while the heading runs along `lean`, r(1 - oval) across it (a long axis at lean);
//                                        or aspect: a true ellipse a/b = aspect along lean, of the area of radius r
//   { follow: points, look }            follow a planned path with the pen's momentum (it rounds what the plan draws sharp)
//   { path: points }                    lay a planned path already rounded (smooth()), then carry on from its end
//   { run: length, bend }               run on at a set curvature
//   { curl: r0, sense, turns, per }     the terminal curl: the radius closing by `per` a turn (measured .38)
// Measured (Bickham, Universal Penman 0220, 0414, 0040; stage 2 notes in research/23):
//   chains ride a sweep: loop pitch .85-.95 of the loop's length (neighbours overlap), loops 2.3-2.5 times as long as
//   wide, lying within ~10 deg of the sweep, sizes in a spindle (rising over the first third, the largest past the middle,
//   the last ~.55 of the largest); rosettes are 6-8 overlapping ovals of .4-.8 of the rosette, the largest at the foot.
const TAU = Math.PI * 2;
const wrap = a => a - Math.round(a / TAU) * TAU;

export function move(p0, h0, plan, { ds = .5, lag = 8 } = {}) {
  let [x, y] = p0, th = h0, k = 0; const p = [[x, y]], part = [0];
  const step = (kt, lg, i) => { k += (kt - k) * Math.min(1, ds / lg); th += k * ds; x += Math.cos(th) * ds; y += Math.sin(th) * ds; p.push([x, y]); part.push(i); };
  plan.forEach((m, i) => {
    const lg = m.lag ?? lag;
    if (m.go) { const look = m.look ?? 30, near = m.near ?? 2;
      for (let n = 0; n < 40000; n++) { const dx = m.go[0] - x, dy = m.go[1] - y, d = Math.hypot(dx, dy); if (d < near) break;
        const a = wrap(Math.atan2(dy, dx) - th); step(2 * Math.sin(a) / Math.min(look, Math.max(d, near)), lg, i); } }
    else if (m.loop) { const s = m.sense ?? 1, turn = m.turn ?? TAU, e = m.oval ?? 0, lean = m.lean ?? th, lgl = m.lag ?? m.loop * .2; let turned = 0;
      // (the hand leaves the loop the way it is going next: past three quarters of the turn it lets go as soon as it is
      // heading within ~20 deg of the next point it steers for)
      const nx = plan.slice(i + 1).find(q => q.go)?.go;
      // (m.aspect: a true ellipse's turning, its radius of curvature a^2 b^2 / (a^2 sin^2 psi + b^2 cos^2 psi)^1.5 at the
      // heading psi off its long axis, a/b = aspect, its area that of the circle of radius m.loop)
      const q = m.aspect, ea = q ? m.loop * Math.sqrt(q) : 0, eb = q ? m.loop / Math.sqrt(q) : 0;
      const rad = () => { if (!q) return m.loop * (1 + e * Math.cos(2 * (th - lean))); const ps = th - lean, sn = Math.sin(ps), cs = Math.cos(ps); return ea * ea * eb * eb / Math.pow(ea * ea * sn * sn + eb * eb * cs * cs, 1.5); };
      for (let n = 0; n < 40000 && turned < turn * 1.3; n++) { const r = Math.max(.4, rad()); const t0 = th; step(s / r, lgl, i); turned += Math.abs(th - t0);
        if (turned >= turn * (nx ? .75 : 1)) { if (!nx) break; if (Math.abs(wrap(Math.atan2(nx[1] - y, nx[0] - x) - th)) < .35) break; } } }
    else if (m.follow) {
      // follow a planned path (the movement's intention, drawn exactly) with the pen's momentum: steer for the point a
      // look-ahead along it, so the hand rounds what the plan draws sharp and carries its speed through
      const P = m.follow, look = m.look ?? 6; let j = 0;
      for (let n = 0; n < 200000 && j < P.length - 1; n++) { while (j < P.length - 1 && Math.hypot(P[j][0] - x, P[j][1] - y) < look) j++;
        const a = wrap(Math.atan2(P[j][1] - y, P[j][0] - x) - th); step(2 * Math.sin(a) / look, lg, i); } }
    else if (m.path) {
      // a planned path already rounded (smooth()): laid as it is; the pen carries on from its end with its heading and bend
      const P = m.path; for (let j = 1; j < P.length; j++) { x = P[j][0]; y = P[j][1]; p.push([x, y]); part.push(i); }
      if (P.length > 2) { const a = P.at(-3), b = P.at(-2), c = P.at(-1), h1 = Math.atan2(b[1] - a[1], b[0] - a[0]); th = Math.atan2(c[1] - b[1], c[0] - b[0]); k = wrap(th - h1) / Math.max(.1, Math.hypot(c[0] - b[0], c[1] - b[1])); } }
    else if (m.run) { for (let s = 0; s < m.run; s += ds) step(m.bend ?? 0, lg, i); }
    else if (m.curl) { const s = m.sense ?? 1, per = m.per ?? .38, turns = m.turns ?? 1.3, b = Math.log(per) / TAU; let turned = 0;
      for (let n = 0; n < 40000 && turned < turns * TAU; n++) { const r = m.curl * Math.exp(b * turned); if (r < .5) break; const t0 = th; step(s / r, Math.min(lg, r * .5), i); turned += Math.abs(th - t0); } }
  });
  return { p, part };
}
// the movement scaled about its own middle and moved so that its extent fits box [x0, y0, x1, y1] (centred on `at`, if given)
export function fit(mv, box, { at = null, pad = 0, grow = false } = {}) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of mv.p) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  const k0 = Math.min((box[2] - box[0] - 2 * pad) / (c - a), (box[3] - box[1] - 2 * pad) / (d - b)), k = grow ? k0 : Math.min(1, k0), mx = (a + c) / 2, my = (b + d) / 2;
  const tx = at ? at[0] : (box[0] + box[2]) / 2, ty = at ? at[1] : (box[1] + box[3]) / 2;
  return { ...mv, p: mv.p.map(([x, y]) => [tx + (x - mx) * k, ty + (y - my) * k]), k };
}

// A chain of loops riding a sweep from a to b (the dove's wings, Universal Penman 0220): n loops of the hand's turning sense,
// their size a spindle along the chain (largest at `peak` of the way), pitch .9 of a loop's length, long along the sweep.
export function chain(a, b, n, size, { sense = -1, peak = .62, first = .55, last = .5, aspect = 2.2 } = {}) {
  const plan = [], L = Math.hypot(b[0] - a[0], b[1] - a[1]), dir = Math.atan2(b[1] - a[1], b[0] - a[0]);
  for (let i = 0; i < n; i++) { const u = n === 1 ? .5 : i / (n - 1), env = u < peak ? first + (1 - first) * Math.sin(Math.PI / 2 * u / peak) : last + (1 - last) * Math.cos(Math.PI / 2 * (u - peak) / (1 - peak));
    const f = (i + .5) / n, q = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    plan.push({ go: q, look: L / n * .9, near: size * .2 }, { loop: size * env * .5, sense, aspect, lean: dir, turn: TAU * .98 }); }
  return plan;
}

// The rosette's plan (Bickham's ABC headpiece, 0414: a capital inside six or seven overlapping ovals): ovals walked round
// the centre c, each lying along the way round (long axis A, short axis B, its middle rho out), begun and ended at its
// inner side so the inner arc passes behind the letter, each overlapping its neighbours by ~40 % of its length. `size(a)`
// scales the oval at angle a (the arm's reach: larger at the foot and outer right). Returns the lobes' points in order and
// the index range of each lobe.
export function rosettePlan(c, stations, { A, B, rho, size = () => 1, lean = 0, n = 90 }) {
  const pts = [], lobes = [];
  for (const a of stations) { const s = size(a), T = [-Math.sin(a), Math.cos(a)], N = [Math.cos(a), Math.sin(a)];
    // (the oval tilted a little off the way round, toward the writing slant: lean radians)
    const cl = Math.cos(lean), sl = Math.sin(lean), Tl = [T[0] * cl - T[1] * sl, T[0] * sl + T[1] * cl], Nl = [N[0] * cl - N[1] * sl, N[0] * sl + N[1] * cl];
    const C = [c[0] + N[0] * rho * s, c[1] + N[1] * rho * s], i0 = pts.length;
    for (let k = 0; k <= n; k++) { const f = -Math.PI / 2 + TAU * k / n; pts.push([C[0] + A * s * Math.cos(f) * Tl[0] + B * s * Math.sin(f) * Nl[0], C[1] + A * s * Math.cos(f) * Tl[1] + B * s * Math.sin(f) * Nl[1]]); }
    lobes.push([i0, pts.length - 1, a]); }
  return { pts, lobes };
}

// a planned path's joins rounded as a hand rounds them: resampled at ds and averaged over a window of `sigma` px (three
// box passes, near a Gaussian), its ends held
export function smooth(pts, sigma, ds = .5) {
  let p = []; for (let i = 0; i < pts.length; i++) { if (!i) { p.push(pts[0]); continue; } const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(l / ds)); for (let k = 1; k <= n; k++) p.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
  const r = Math.max(1, Math.round(sigma / ds / 1.7));
  for (let pass = 0; pass < 3; pass++) { const q = p.map(v => v.slice());
    for (let i = 0; i < p.length; i++) { const lo = Math.max(0, i - r), hi = Math.min(p.length - 1, i + r), m = Math.min(i - lo, hi - i); let sx = 0, sy = 0, c = 0;
      for (let k = i - m; k <= i + m; k++) { sx += p[k][0]; sy += p[k][1]; c++; } q[i] = [sx / c, sy / c]; }
    p = q; }
  return p;
}
