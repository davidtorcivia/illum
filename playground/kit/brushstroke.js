// A brush stroke, laid as a brush lays it: a few dozen bristles travelling the scribe's path side by side, after
// Strassmann's hairy brushes (1986) and the author's pie-site js/brush.js. Each bristle carries its own load and runs
// out as it goes; they touch down and lift a little apart, so the stroke's ends are loaded or ragged, never cut; the
// outermost hairs carry less and wander, so the edge is soft and alive, never ruled; toward the end the brush goes
// dry and skips on the tooth of the paper; along the stroke the paint streaks the way the hairs dragged it. Where
// strokes meet, their paint overlaps and the letter joins up. Deterministic from the seed.
import { mulberry, noise1, noise2, resample } from './marks.js';

const tooth = noise2(2711);
// P: polyline in page px. w: nominal width. press(u): width along the stroke. color: sRGB. nib: broad-nib angle and how
// broad (0 round, 1 flat). load: how full the brush is. dry: how soon it runs dry (0 never).
export function brushStroke(g, P, { w = 8, press = null, color = [40, 56, 124], nib = .7, broad = .25, load = 1, dry = .35, seed = 1, start = 'loaded', end = 'lift', from = 0, to = 1 } = {}) {
  const Q = resample(P, .5), n = Q.length; if (n < 3) return;
  const S = [0]; for (let i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]));
  const L = S[n - 1], r = mulberry(seed), wave = noise1(seed ^ 0x1f), wave2 = noise1(seed ^ 0x2f);
  // the stroke's frame and half-width at each point
  const T = [], N = [], HW = [];
  for (let i = 0; i < n; i++) {
    const a = Q[Math.max(0, i - 2)], b = Q[Math.min(n - 1, i + 2)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
    T.push([dx / l, dy / l]); N.push([-dy / l, dx / l]);
    const u = S[i] / L, across = 1 - broad + broad * Math.abs(Math.sin(ang - nib));
    HW.push(Math.max(.35, w / 2 * (press ? press(u) : 1) * across));
  }
  const maxHW = Math.max(...HW), B = Math.max(8, Math.min(72, Math.round(maxHW * 4.5))), bw = Math.max(.42, maxHW * 2 / B * 2.5);
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (let k = 0; k < B; k++) {
    const o = (k + .5) / B * 2 - 1 + (r() - .5) / B, edge = Math.abs(o);
    // a bristle's own load: the outer hairs hold less; each starts and stops a little apart from its neighbours
    const own = (.78 + .22 * r()) * (1 - .4 * Math.max(0, edge - .75) / .25) * load;
    const s0 = (start === 'loaded' ? r() * .5 : r() * 1.4) * HW[0] * (.4 + edge), s1 = L - (end === 'lift' ? (.3 + r() * 1.2) * HW[n - 1] * (.4 + edge) : r() * .6);
    const dryAt = dry ? L * (1 - dry * (.4 + .6 * r())) : Infinity, ph = r() * 100;
    let px = null, py = null, alpha = 0;
    for (let i = 0; i < n; i++) {
      const s = S[i]; if (s < s0 || s > s1 || s < from * L || s > to * L) { px = null; continue; }
      // the hair's place across the stroke wanders slowly; the outermost wander most, so the edge is never ruled
      const wob = (wave(s / 9 + ph) - .5) * .12 + (wave2(s / 3.5 + ph) - .5) * .05 * (.3 + edge);
      const oo = o * (1 + wob) , x = Q[i][0] + N[i][0] * oo * HW[i], y = Q[i][1] + N[i][1] * oo * HW[i];
      // the paint it lays: thinning as the hair empties, streaking where it dragged, skipping on the tooth when dry
      const u = (s - s0) / Math.max(1, s1 - s0), streak = .86 + .14 * wave(s / 18 + ph * 3);
      let a = own * streak * (1 - .22 * u);
      if (s > dryAt && edge > .35 && tooth(x * .9, y * .9) < (s - dryAt) / Math.max(1, s1 - dryAt) * .55) { px = null; continue; }   // only the outer hairs run dry
      if (px !== null) {
        g.globalAlpha = Math.min(1, (a + alpha) / 2); g.strokeStyle = `rgb(${color})`; g.lineWidth = bw * (.75 + .5 * (1 - edge));
        g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke();
      }
      px = x; py = y; alpha = a;
    }
  }
  g.restore();
}
// a ball terminal: the brush pressed down and lifted: a round dab of solid paint, its edge a little uneven, the pigment
// pooled a shade darker at its rim as a drop of paint dries
export function brushDab(g, c, rad, { color = [40, 56, 124], seed = 1 } = {}) {
  const r = mulberry(seed), ph = r() * 6.28, pts = [];
  for (let k = 0; k < 28; k++) { const a = k / 28 * 6.283, rr = rad * (1 + .06 * Math.sin(a * 3 + ph) + .04 * Math.sin(a * 5 + ph * 2)); pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]); }
  g.save(); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
  g.globalAlpha = .92; g.fillStyle = `rgb(${color})`; g.fill();
  g.globalAlpha = .35; g.lineWidth = Math.max(.5, rad * .22); g.strokeStyle = `rgb(${color.map(v => v * .78 | 0)})`; g.stroke(); g.restore();
}
