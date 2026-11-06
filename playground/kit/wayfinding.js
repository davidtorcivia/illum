// Wayfinding: the small pen marks a rubricator put through the text so a reader could find the way. Paraphs at
// paragraph starts, line-fillers closing short lines to the measure, and breaks between parts ranked by the size of
// the division. Pure geometry: each function returns marks (pen strokes and dots) for the page to draw in its own
// time; colour is named by role, 'a' (the mark's own colour) or 'b' (the other), so red and blue can alternate.
//
// After the Decretals of Gratian, French c. 1290 (Met 466179: paraphs alternating red and blue down the page, each a
// bowl and two stems laid with a broad pen) and the Royal Psalter, English 13th c. (Met 466376, 466367: line-fillers
// in the x-height band from the last word exactly to the measure, zigzags, sprigs, rows of points, alternating
// colour). The fillers there are painted bars with pen detail; here they are pen only, the same hand as kit/penwork.js.
// Every function takes `rich` 0..1: what the rubricator was paid to do.
import { tendril, resample, stream, noise1 } from './marks.js';

export const wander = (p, amp, seed, scale = 20) => { const n = noise1(seed), q = resample(p, 1);
  return q.map((pt, i) => { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, o = (n(i / scale) - .5) * 2 * amp;
    return [pt[0] - (b[1] - a[1]) / l * o, pt[1] + (b[0] - a[0]) / l * o]; }); };
export const arc = (c, R, a0, a1, n = 16) => Array.from({ length: n + 1 }, (_, k) => { const a = a0 + (a1 - a0) * k / n; return [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R]; });
export const hook = (p, h, size, sense) => tendril(p, h, size * 2 * Math.PI * .8, 0, sense / size, 1.6, .4);
export const hair = (pts, col, o = {}) => ({ pts, col, w: .5, start: 'cut', end: 'taper', ...o });
export const bead = (p, r, col) => ({ dot: true, p, r, col });
// an eye as in the penwork: a ring, a dot, small lobes round it
export function eye(c, R, col, r, lobes = 4) {
  const s0 = r() * 6.28, out = [hair(arc(c, R, s0, s0 + 6.5, 32), col, { end: 'cut' }), bead(c, Math.max(.7, R * .3), col)];
  const a0 = r() * 6.28; for (let k = 0; k < lobes; k++) { const a = a0 + k / lobes * 6.283, lr = R * .42, lc = [c[0] + Math.cos(a) * (R + lr * .6), c[1] + Math.sin(a) * (R + lr * .6)];
    out.push(hair(arc(lc, lr, a - 1.9, a + 1.9, 12), col, { w: .45, end: 'cut' })); }
  return out;
}

// ---- the paraph ------------------------------------------------------------------------------------------------------------
// ¶ as a rubricator made it with a broad pen held at a fixed angle: the bowl in one curved stroke and a filling stroke
// inside it, two stems down, a hairline across the head. Then, on a richer page, a hairline in the other colour round
// the bowl and a tail off the foot ending in a bead. x: where it stands; base: the line's baseline; u: the x-height.
export function paraph(x, base, u, seed, rich = .5) {
  const r = stream(seed, 'paraph'), j = () => (r() - .5) * u * .05, out = [];
  const nib = { broad: .9, nib: .62, load: 1.15, dry: .08, swell: .1, start: 'cut', end: 'cut', col: 'a' };
  // the bowl: a round of solid colour on the left, laid as two broad strokes round its centre and one down its middle
  const R = u * .6, c = [x + R, base - u * .95], top = c[1] - R - u * .02, s1 = c[0] + u * .04, s2 = c[0] + u * .44;
  out.push({ ...nib, broad: .45, w: u * .74, pts: arc(c, R * .5, -Math.PI / 2 + .15, -Math.PI * 1.5 - .15, 16).map(([a, b]) => [a + j(), b + j()]) });
  out.push({ ...nib, broad: .45, w: u * .5, pts: [[c[0] - R * .05 + j(), c[1] - R * .5], [c[0] - R * .08 + j(), c[1] + R * .5]] });
  // two stems from the head of the bowl to below the line, the first a little longer; each goes in and comes off on
  // the pen's angle, as a textura stem does, so its ends are lozenges and not cut square
  const stem = (sx, y0, y1, w) => ({ ...nib, w, pts: [[sx - u * .16, y0 + u * .1], [sx + j() * .5, y0], [sx + j() * .5, (y0 + y1) / 2], [sx, y1], [sx + u * .16, y1 + u * .08]] });
  out.push(stem(s1, top, base + u * .3, u * .34));
  out.push(stem(s2, top + u * .02, base + u * .12, u * .28));
  // a hairline across the head
  out.push({ ...nib, broad: 0, w: .6, load: 1, pts: [[c[0] - R * .3, top - u * .03], [s2 + u * .1, top - u * .05 + j()]], end: 'taper' });
  if (rich >= .25) {   // the other colour's hairline round the bowl, a gap away
    out.push(hair(wander(arc(c, R + u * .22, -Math.PI / 2 - .15, -Math.PI * 1.5 + .25, 18), .12, seed + 1), 'b', { start: 'cut', end: 'ball' }));
  }
  if (rich >= .5) {    // a short tail off the first stem's foot, turning back with a bead
    out.push(hair(hook([s1, base + u * .32], Math.PI / 2 + .2, u * .26, 1), 'b', { end: 'ball' }));
  }
  if (rich >= .9) {    // and small rounds pressed along the hairline
    for (const a of [-Math.PI * .8, -Math.PI, -Math.PI * 1.2]) { const rr = R + u * .22, lc = [c[0] + Math.cos(a) * (rr + u * .16), c[1] + Math.sin(a) * (rr + u * .16)];
      out.push(hair(arc(lc, u * .17, a - 1.9, a + 1.9, 10), 'b', { w: .42, end: 'cut' })); }
  }
  return out;
}

// ---- the line-filler -----------------------------------------------------------------------------------------------------
// From just after the last word to exactly the measure, in the x-height band [yTop, yBase]. The kinds of 466376 and
// 466367, drawn with the pen: a hairline strung with points; a zigzag (two, in both colours, as a cable on a richer
// page); a row of scallops; a sprig, barbs leaning back along a hairline. The pattern's period is stretched to fit the
// gap a whole number of times, so it ends exactly at the measure, as a filler does.
export const FILLERS = ['beads', 'zigzag', 'scallops', 'sprig'];
export function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  const r = stream(seed, 'filler'), h = yBase - yTop, L = x1 - x0, mid = (yTop + yBase) / 2, out = [];
  const fit = p => { const n = Math.max(1, Math.round(L / p)); return { n, p: L / n }; };
  const line = y => wander([[x0, y], [x1, y + (r() - .5) * .3]], .15, seed + 3, 30);
  if (kind === 'beads') {
    const { n, p } = fit(h * 1.25);
    out.push(hair(line(mid), 'a', { end: 'cut' }));
    for (let k = 0; k <= n; k++) { const two = rich >= .25 && k % 2; out.push(bead([x0 + k * p + (r() - .5) * .3, mid + (r() - .5) * .3], (two ? .95 : 1.15) + r() * .2, two ? 'b' : 'a')); }
  } else if (kind === 'zigzag') {
    const { n, p } = fit(h * 1.15), zig = (phase, col) => { const pts = [];
      for (let k = 0; k <= n * 2; k++) pts.push([x0 + k * p / 2 + (r() - .5) * .25, ((k + phase) % 2 ? yTop + h * .12 : yBase - h * .12) + (r() - .5) * .25]);
      out.push(hair(pts, col, { w: .55, end: 'cut' })); };
    zig(0, 'a'); if (rich >= .5) zig(1, 'b');
    if (rich >= .9) for (let k = 0; k < n; k++) out.push(bead([x0 + (k + .5) * p, mid], .75, k % 2 ? 'a' : 'b'));
  } else if (kind === 'scallops') {
    const { n, p } = fit(h * .95), y = yBase - h * .06;
    out.push(hair(line(y), 'a', { end: 'cut' }));
    for (let k = 0; k < n; k++) { const c = [x0 + (k + .5) * p, y - h * .02], R = p * .44 * (.94 + r() * .1);
      out.push(hair(arc(c, R, Math.PI + .25, 2 * Math.PI - .25, 12), rich >= .75 && k % 2 ? 'b' : 'a', { w: .48, end: 'cut' }));
      if (rich >= .5 && k % 2 === 0) out.push(bead([c[0], c[1] - R * .45], .7, 'b')); }
  } else {   // sprig
    const { n, p } = fit(h * .62);
    out.push(hair(line(mid), 'a', { end: 'cut' }));
    for (let k = 0; k < n; k++) { const s = k % 2 ? -1 : 1, px = x0 + (k + .5) * p, len = h * .44 * (.9 + r() * .2);
      out.push(hair([[px, mid], [px - len * .45, mid - s * len * .5], [px - len * .75, mid - s * len * .88]], rich >= .5 && s < 0 ? 'b' : 'a', { w: .46 })); }
  }
  return out;
}

// ---- the break -------------------------------------------------------------------------------------------------------------
// Between parts, centred on the measure at y, a mark whose size is the rank of the division. Minor (a chapter): a
// short beaded hairline, its ends turned over. Major (a book): an eye with lobes and from it two arms, each a pair of
// hairlines strung with scallops, ending in hooks with beads; on a richer page a smaller eye on each arm.
export function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8) {
  const r = stream(seed, 'break'), out = [];
  if (rank < 2) {
    const W = Math.min(measure * .3, u * 13) * (.8 + rich * .4), x0 = cx - W / 2, x1 = cx + W / 2;
    out.push(hair(wander([[x0, y], [x1, y]], .2, seed + 1, 30), 'a', { end: 'cut', w: .55 }));
    for (const [p, h, s] of [[[x0, y], Math.PI, -1], [[x1, y], 0, 1]]) out.push(hair(hook(p, h, u * .32, s), 'a', { end: 'ball' }));
    if (rich >= .5) out.push(...eye([cx, y], u * .34, 'b', r, rich >= .75 ? 4 : 0));
    else out.push(bead([cx, y], 1.5, 'b'));
    const nb = rich >= .25 ? 2 : 0;
    for (let k = 1; k <= nb; k++) for (const s of [-1, 1]) out.push(bead([cx + s * W * k / (2 * nb + 2) * 2 * .5 + s * u * .6, y], .95, k % 2 ? 'a' : 'b'));
    return out;
  }
  u *= 1.3;   // the major device is drawn larger throughout: its size is its rank
  const W = Math.min(measure * .66, u * 30), R = u * .62, g = u * .32;
  out.push(...eye([cx, y], R, 'b', r, 5));
  for (const s of [-1, 1]) {
    const xa = cx + s * (R * 1.75), xb = cx + s * W / 2;   // the arm runs from the eye's lobes to its end
    for (const dy of [-g / 2, g / 2]) out.push(hair(wander([[xa, y + dy], [xb, y + dy]], .2, seed + (s + 2) * 7 + (dy > 0), 30), 'a', { end: 'cut', w: .55 }));
    // scallops above the upper hairline and below the lower, nearly touching
    const step = u * .78, n = Math.floor(Math.abs(xb - xa) / step) - 1;
    for (let k = 1; k <= n; k++) { const px = xa + s * k * step, sr = u * .3 * (.92 + r() * .14);
      if (rich >= .25) out.push(hair(arc([px, y - g / 2 - sr * .4], sr, Math.PI + .3, 2 * Math.PI - .3, 10), k % 2 && rich >= .75 ? 'b' : 'a', { w: .45, end: 'cut' }));
      if (rich >= .5) out.push(hair(arc([px + s * step / 2, y + g / 2 + sr * .4], sr, .3, Math.PI - .3, 10), 'a', { w: .45, end: 'cut' })); }
    // weight for the rank: solid spindles, the pen pressed and lifted, where each arm leaves the eye and before its end
    const loz = (px, L) => ({ col: 'a', broad: .05, nib: .78, w: u * .62, load: 1.15, dry: .08, swell: .1, start: 'taper', end: 'taper', pts: [[px, y], [px + s * L * .5, y + (r() - .5) * .3], [px + s * L, y]] });
    out.push(loz(xa - s * u * .15, u * 1.1), loz(xb - s * u * 1.5, u * .9));
    // the arm's end: both hairlines turn over, one up and one down, each with a bead
    out.push(hair(hook([xb, y - g / 2], s > 0 ? 0 : Math.PI, u * .42, -s), 'a', { end: 'ball' }));
    out.push(hair(hook([xb, y + g / 2], s > 0 ? 0 : Math.PI, u * .42, s), 'a', { end: 'ball' }));
    if (rich >= .75) out.push(...eye([cx + s * W * .3, y - g / 2 - u * 1.05], u * .3, 'b', r, 0), hair([[cx + s * W * .3, y - g / 2], [cx + s * W * .3, y - g / 2 - u * .72]], 'b', { w: .45, end: 'cut' }));
  }
  return out;
}
