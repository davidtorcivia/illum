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

// ==== styles ==================================================================================================================
// Rubrication traditions, each a coherent set: its paraph, its filler kinds, its break devices, its colours and its
// density. The page calls `style.setup(seed)` once for the variation within the style (which filler kinds this copy
// uses, its rhythm, small motifs), then the style's paraph, filler and breakMark with that `v`. Colours are named by
// role: 'a' (the mark's own colour), 'b' (the other), 'g' (gold, where the style has it); `ink` gives each name's
// solid and hairline colour, `pair` the two that alternate.
const spindle = (a, b, w, col, o = {}) => ({ col, broad: .05, w, start: 'taper', end: 'taper', load: 1.1, dry: .05, swell: .1, pts: [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b], ...o });
const leaf = (c, size, dir, col, r) => { const out = []; for (const [da, k] of [[0, 1], [-.95, .7], [.95, .7]]) { const a = dir + da + (r() - .5) * .2;
  out.push(spindle(c, [c[0] + Math.cos(a) * size * k, c[1] + Math.sin(a) * size * k], size * .42 * k, col)); } return out; };
const asterisk = (c, R, col, r) => { const out = [], a0 = r() * Math.PI;
  for (let k = 0; k < 3; k++) { const a = a0 + k * Math.PI / 3 + (r() - .5) * .12, R1 = R * (.9 + r() * .2);
    out.push(hair([[c[0] - Math.cos(a) * R1, c[1] - Math.sin(a) * R1], [c[0] + Math.cos(a) * R1, c[1] + Math.sin(a) * R1]], col, { w: .6, start: 'pool', end: 'ball' })); }
  return out; };
// a horizontal figure-eight, as the cadel scribes knotted their hairlines
const eight = (c, w, h, n = 48) => Array.from({ length: n + 1 }, (_, k) => { const t = k / n * 2 * Math.PI; return [c[0] + w * Math.sin(t), c[1] + h * Math.sin(t) * Math.cos(t) * 2]; });
// two strands twisted, the under strand broken at each crossing (over and under alternate)
function twist(x0, x1, y, amp, n, cols, w = .55) {
  const out = [], L = x1 - x0, at = (s, x) => y + s * amp * Math.sin((x - x0) / L * n * Math.PI);
  for (const [s, col] of [[1, cols[0]], [-1, cols[1]]]) { let run = [];
    for (let x = x0; x <= x1 + .01; x += .6) { const k = Math.round((x - x0) / L * n), near = Math.abs((x - x0) / L * n - k) < .13 && k > 0 && k < n;
      const under = near && ((k + (s > 0 ? 0 : 1)) % 2 === 0);
      if (under) { if (run.length > 1) out.push(hair(run, col, { w, end: 'cut' })); run = []; } else run.push([x, at(s, x)]); }
    if (run.length > 1) out.push(hair(run, col, { w, end: 'cut' })); }
  return out;
}
// dots set round a curve, outside it (the Insular red-dot outline)
const dotOutline = (pts, c, gap, step, col, r) => { const out = [], q = resample(pts, step);
  for (const p of q) { const dx = p[0] - c[0], dy = p[1] - c[1], l = Math.hypot(dx, dy) || 1; out.push(bead([p[0] + dx / l * gap + (r() - .5) * .3, p[1] + dy / l * gap + (r() - .5) * .3], .85 + r() * .2, col)); }
  return out; };
const fitN = (L, p) => { const n = Math.max(1, Math.round(L / p)); return { n, p: L / n }; };
const pickKinds = (r, all, min = 2) => { const k = [...all].sort(() => r() - .5); return k.slice(0, Math.max(min, Math.round(min + r() * (all.length - min)))); };

export const STYLES = {
  // ---- Italian Gothic choir book: the set first made (466179, 466376, 466773)
  gothic: { label: 'Gothic', pair: ['red', 'blue'], alternate: true, minGap: 1.4,
    ink: { red: { solid: [200, 66, 40], hair: [212, 100, 74] }, blue: { solid: [40, 70, 160], hair: [56, 84, 166] } },
    setup: seed => { const r = stream(seed, 'gothic'); return { kinds: pickKinds(r, FILLERS, 3) }; },
    kinds: (v, rich) => rich < .25 ? ['beads'] : rich < .5 ? ['beads', 'zigzag'] : v.kinds,
    paraph: (x, base, u, seed, rich) => paraph(x, base, u, seed, rich),
    filler: (x0, x1, yTop, yBase, kind, seed, rich) => filler(x0, x1, yTop, yBase, kind, seed, rich),
    breakMark: (cx, y, measure, rank, seed, rich, u) => breakMark(cx, y, measure, rank, seed, rich, u) },

  // ---- French Book of Hours, c. 1400–1500: pale salmon and blue, gold points, ivy, finer and airier (Met 468976,
  // 2003.493: the hairline ivy with gold leaves and points of the borders, brought down into the text as fillers)
  hours: { label: 'Hours', pair: ['salmon', 'blue'], alternate: true, minGap: 1.6,
    ink: { salmon: { solid: [206, 104, 82], hair: [214, 126, 104] }, blue: { solid: [56, 86, 168], hair: [76, 102, 174] }, gold: { solid: [184, 146, 66], hair: [184, 146, 66] } },
    setup: seed => { const r = stream(seed, 'hours'); return { kinds: pickKinds(r, ['ivy', 'golddots', 'bar'], 2), p: .9 + r() * .3, berry: r() < .4 }; },
    kinds: (v, rich) => rich < .25 ? ['golddots'] : v.kinds,
    paraph: (x, base, u, seed, rich) => { const r = stream(seed, 'hp'), out = paraph(x + u * .1, base, u * .8, seed, rich >= .75 ? .5 : rich >= .25 ? .25 : 0);
      if (rich >= .25) out.push(bead([x - u * .18, base - u * .2], 1.05, 'g'), bead([x - u * .05, base + u * .25], .8, 'g'));
      if (rich >= .5) out.push(...leaf([x - u * .35, base - u * 1.2], u * .42, -2.4 + (r() - .5) * .3, 'g', r));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'hf'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
      if (kind === 'ivy') {   // a hairline stem waving gently, gold ivy leaves off it above and below, points between
        const { n, p } = fitN(x1 - x0, h * 2.3 * v.p), st = [];
        for (let x = x0; x <= x1 + .01; x += .7) st.push([x, mid + h * .16 * Math.sin((x - x0) / p * 2 * Math.PI)]);
        out.push(hair(st, 'b', { w: .45, end: 'cut' }));
        for (let k = 0; k < n * 2; k++) { const px = x0 + (k + .5) * p / 2, s = k % 2 ? 1 : -1, py = mid + h * .16 * Math.sin((px - x0) / p * 2 * Math.PI);
          if (v.berry && k % 4 === 3) { out.push(bead([px, py + s * h * .38], 1.1, rich >= .5 ? 'a' : 'g')); continue; }
          out.push(...leaf([px, py], h * .5, s * Math.PI / 2 + (s > 0 ? -.35 : .35), k % 3 === 2 && rich >= .5 ? 'b' : 'g', r)); }
        if (rich >= .75) for (let k = 0; k < n; k++) out.push(bead([x0 + k * p + p * .02, mid], .7, 'g'));
      } else if (kind === 'golddots') {   // a hairline with a small loop at each step, a gold point in each loop
        const { n, p } = fitN(x1 - x0, h * 1.4 * v.p), pts = [];
        for (let k = 0; k <= n * 24; k++) { const t = k / 24 * 2 * Math.PI, R = h * .2; pts.push([x0 + k / 24 * p - R * .9 * Math.sin(t), mid + R * Math.cos(t) - R]); }
        out.push(hair(pts.filter(q => q[0] >= x0 && q[0] <= x1), 'a', { w: .45, end: 'cut' }));
        for (let k = 0; k < n; k++) out.push(bead([x0 + (k + .02) * p, mid - h * .2], 1.05 + r() * .15, 'g'));
      } else {   // the bar, in pen: two hairlines, a gold zigzag between, points at its turns on a richer page
        const { n, p } = fitN(x1 - x0, h * .9 * v.p), ya = yTop + h * .12, yb = yBase - h * .12;
        out.push(hair(wander([[x0, ya], [x1, ya]], .12, seed, 30), 'a', { w: .45, end: 'cut' }), hair(wander([[x0, yb], [x1, yb]], .12, seed + 1, 30), 'b', { w: .45, end: 'cut' }));
        const z = []; for (let k = 0; k <= n; k++) z.push([x0 + k * p, k % 2 ? ya + h * .14 : yb - h * .14]); out.push(hair(z, 'g', { w: .5, end: 'cut' }));
        if (rich >= .5) for (let k = 1; k < n; k += 2) out.push(bead([x0 + k * p, mid], .75, 'a'));
      }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u, v) {   // an ivy spray; for a book a rinceau from a rose
      const r = stream(seed, 'hb'), out = [], W = rank < 2 ? Math.min(measure * .32, u * 13) : Math.min(measure * .62, u * 30), amp = u * (rank < 2 ? .5 : .75), per = u * (rank < 2 ? 4 : 4.6) * v.p;
      for (const s of [-1, 1]) { const st = [];
        for (let d = rank < 2 ? u * .4 : u * 1.2; d <= W / 2; d += .7) st.push([cx + s * d, y + amp * Math.sin(d / per * 2 * Math.PI) * (rank < 2 ? 1 : 1)]);
        out.push(hair(st, 'b', { w: .48, end: 'cut' }));
        const e = st.at(-1); out.push(hair(hook(e, s > 0 ? 0 : Math.PI, u * .38, s), 'b', { end: 'ball' }));
        for (let d = per / 4, k = 0; d < W / 2 - u; d += per / 2, k++) { const px = cx + s * d, py = y + amp * Math.sin(d / per * 2 * Math.PI), up = Math.sin(d / per * 2 * Math.PI) > 0 ? 1 : -1;
          out.push(...leaf([px, py], u * (rank < 2 ? .6 : .72), up * Math.PI / 2 + s * .35, k % 3 === 1 && rich >= .5 ? 'a' : 'g', r));
          if (rich >= .5 && rank >= 2) out.push(hair(hook([px + s * u * .4, py], up * Math.PI / 2 * -1, u * .32, s * up), 'b', { w: .42, end: 'ball' })); } }
      if (rank >= 2) out.push(...eye([cx, y], u * .55, 'a', r, 5), bead([cx, y], 1.4, 'g'));
      else out.push(bead([cx, y], 1.5, 'g'), ...(rich >= .5 ? [bead([cx - u * .55, y - u * .2], .9, 'a'), bead([cx + u * .55, y + u * .2], .9, 'a')] : []));
      return out; } },

  // ---- Netherlandish and English cadels, c. 1450–1520: blue and gold, hairlines knotted and looped (Met 467520: the
  // interlaced loop knot in its border; the cadel strokes of the Flemish hands)
  cadel: { label: 'Cadel', pair: ['blue', 'gold'], alternate: true, minGap: 1.4,
    ink: { blue: { solid: [40, 68, 150], hair: [58, 84, 160] }, gold: { solid: [168, 126, 46], hair: [176, 138, 60] } },
    setup: seed => { const r = stream(seed, 'cadel'); return { kinds: pickKinds(r, ['loops', 'cable', 'knots'], 2), p: .9 + r() * .3, slant: (r() - .5) * .5 }; },
    kinds: (v, rich) => rich < .25 ? ['loops'] : v.kinds,
    paraph(x, base, u, seed, rich, v) { const out = paraph(x, base, u, seed, rich >= .75 ? .5 : 0);
      if (rich >= .25) out.push(hair(eight([x + u * .75, base - u * .7], u * .95, u * .32).map(([a, b]) => [a, b + (a - x - u * .75) * v.slant * .3]), 'b', { w: .5, start: 'cut', end: 'ball' }));
      if (rich >= .5) out.push(hair(eight([x + u * .9, base + u * .45], u * .5, u * .2), 'b', { w: .45, end: 'cut' }));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'cf'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
      if (kind === 'loops') {   // a running hand's loops: the pen comes back on itself at each step
        const { n, p } = fitN(x1 - x0, h * .9 * v.p), pts = [];
        for (let k = 0; k <= n * 20; k++) { const t = k / 20 * 2 * Math.PI; pts.push([x0 + k / 20 * p - h * .32 * Math.sin(t), mid - h * .36 * Math.cos(t) + h * .1]); }
        out.push(hair(pts.filter(q => q[0] >= x0 - .5 && q[0] <= x1 + .5), 'a', { w: .5, end: 'cut' }));
        if (rich >= .5) for (let k = 0; k < n; k += 2) out.push(bead([x0 + k * p + p * .5, yBase + h * .1], .7, 'b'));
      } else if (kind === 'cable') {
        const { n } = fitN(x1 - x0, h * .8 * v.p); out.push(...twist(x0, x1, mid, h * .3, n, rich >= .25 ? ['a', 'b'] : ['a', 'a'], .5));
      } else {   // a hairline knotted in figure-eights at intervals
        const { n, p } = fitN(x1 - x0, h * 3 * v.p);
        out.push(hair(wander([[x0, mid], [x1, mid]], .12, seed, 30), 'a', { w: .45, end: 'cut' }));
        for (let k = 0; k < n; k++) out.push(hair(eight([x0 + (k + .5) * p, mid], h * .55, h * .28), 'b', { w: .48, end: 'cut' }));
      }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u, v) {
      const r = stream(seed, 'cb'), out = [], W = rank < 2 ? Math.min(measure * .3, u * 12) : Math.min(measure * .6, u * 28);
      if (rank < 2) out.push(hair(eight([cx, y], u * 1.3, u * .5), 'a', { w: .55, end: 'cut' }));
      else for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + v.slant * .3, pts = eight([0, 0], u * 1.8, u * .62).map(([px, py]) => [cx + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)]);
        out.push(hair(pts, k % 2 ? 'b' : 'a', { w: .55, end: 'cut' })); }
      const inner = rank < 2 ? u * 1.4 : u * 2.1;
      for (const s of [-1, 1]) { const pts = [];   // tails of running loops out to each side, ending turned over with a bead
        const n = Math.max(2, Math.round((W / 2 - inner) / (u * 1.1)));
        for (let k = 0; k <= n * 20; k++) { const t = k / 20 * 2 * Math.PI; pts.push([cx + s * (inner + k / 20 * (W / 2 - inner) / n - u * .3 * Math.sin(t)), y - u * .32 * Math.cos(t) + u * .32]); }
        out.push(hair(pts, 'b', { w: .45, end: 'cut' }), hair(hook(pts.at(-1), s > 0 ? 0 : Math.PI, u * .35, -s), 'b', { end: 'ball' }));
        if (rich >= .5) out.push(bead([cx + s * (inner * .75), y + u * .9], .95, 'a')); }
      return out; } },

  // ---- Romanesque, 12th c.: spare; red only; a capitulum, points, a rubric line ending in a curl, a twisted knot
  // between parts (Met 472539, 472538: the Bible of c. 1175–95)
  romanesque: { label: 'Romanesque', pair: ['red', 'red'], alternate: false, minGap: 3,
    ink: { red: { solid: [186, 58, 34], hair: [196, 84, 58] }, brown: { solid: [88, 60, 40], hair: [96, 70, 50] } },
    setup: seed => { const r = stream(seed, 'rom'); return { kinds: pickKinds(r, ['points', 'dash', 'curl'], 2), p: .9 + r() * .3 }; },
    kinds: (v, rich) => rich < .25 ? ['curl'] : v.kinds,
    paraph(x, base, u, seed, rich) {   // the capitulum: a C laid with the broad pen and a stroke through its back
      const r = stream(seed, 'rp'), c = [x + u * .62, base - u * .62], R = u * .55, out = [];
      out.push({ col: 'a', broad: .85, nib: .62, w: u * .36, load: 1.12, dry: .08, swell: .1, start: 'cut', end: 'cut', pts: arc(c, R, -Math.PI * .3, -Math.PI * 1.7 - (r() - .5) * .1, 14) });
      out.push({ col: 'a', broad: .85, nib: .62, w: u * .26, load: 1.12, dry: .08, swell: .1, start: 'cut', end: 'cut', pts: [[c[0] + u * .02, base - u * 1.42], [c[0] + u * .04, base + u * .28]] });
      if (rich >= .5) out.push(bead([c[0] + u * .62, c[1] - u * .55], .9, 'a'), bead([c[0] + u * .62, c[1] + u * .4], .9, 'a'));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'rf'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
      if (kind === 'points') {   // ·:· in groups, spaced
        const { n, p } = fitN(x1 - x0, h * 2.4 * v.p);
        for (let k = 0; k < n; k++) { const gx = x0 + (k + .5) * p; out.push(bead([gx - h * .42, mid], 1, 'a'), bead([gx, yTop + h * .25], 1, 'a'), bead([gx, yBase - h * .2], 1, 'a'), bead([gx + h * .42, mid], 1, 'a')); }
      } else if (kind === 'dash') {   // a hairline broken by points
        const { n, p } = fitN(x1 - x0, h * 2.2 * v.p);
        for (let k = 0; k < n; k++) { const a = x0 + k * p + h * .35, b = x0 + (k + 1) * p - h * .35; out.push(hair([[a, mid], [b, mid + (r() - .5) * .4]], 'a', { w: .5, end: 'cut' }), bead([x0 + (k + 1) * p, mid], .95, 'a')); }
        out.pop();
      } else {   // the rubric line run out to the measure and turned up in a curl (472539)
        out.push(hair(wander([[x0, mid + h * .2], [x1 - h * .6, mid + h * .2]], .2, seed, 40), 'a', { w: .55, end: 'cut' }));
        out.push(hair(hook([x1 - h * .6, mid + h * .2], 0, h * .5, -1), 'a', { end: 'ball' }));
        if (rich >= .5) out.push(bead([x0 + h * .3, mid - h * .3], .85, 'a'));
      }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u) {
      const out = [];
      if (rank < 2) { for (const [dx, dy] of [[-u * .6, u * .3], [u * .6, u * .3], [0, -u * .45]]) out.push(bead([cx + dx, y + dy], 1.3, 'a'));
        if (rich >= .5) out.push(hair([[cx - u * 4, y + u * .3], [cx - u * 1.6, y + u * .3]], 'a', { w: .45, start: 'taper' }), hair([[cx + u * 1.6, y + u * .3], [cx + u * 4, y + u * .3]], 'a', { w: .45 }));
        return out; }
      const W = Math.min(measure * .4, u * 18), n = rich >= .5 ? 10 : 6;
      out.push(...twist(cx - W / 2, cx + W / 2, y, u * .55, n, ['a', rich >= .75 ? 'b' : 'a'], .6));
      for (const s of [-1, 1]) out.push(bead([cx + s * (W / 2 + u * .6), y], 1.3, 'a'), bead([cx + s * (W / 2 + u * 1.3), y], 1, 'a'));
      return out; } },

  // ---- Insular, 7th–9th c.: red dots outlining, triple points, knots with dotted terminals (after the red-dot
  // outlining of the Lindisfarne Gospels and the Book of Kells; not studied from a scan here)
  insular: { label: 'Insular', pair: ['red', 'ink'], alternate: false, minGap: 1.6,
    ink: { red: { solid: [196, 62, 34], hair: [196, 62, 34] }, ink: { solid: [64, 44, 30], hair: [72, 50, 34] } },
    setup: seed => { const r = stream(seed, 'ins'); return { kinds: pickKinds(r, ['dots', 'dotrows', 'spiral'], 2), p: .9 + r() * .25 }; },
    kinds: (v, rich) => rich < .25 ? ['dots'] : v.kinds,
    paraph(x, base, u, seed, rich) {   // a small spiral in ink, ringed with red dots; on a plain page the three points alone
      const r = stream(seed, 'ip'), c = [x + u * .7, base - u * .55], out = [];
      if (rich < .25) { for (const [dx, dy] of [[-u * .4, u * .3], [u * .4, u * .3], [0, -u * .4]]) out.push(bead([c[0] + dx, c[1] + dy], 1.25, 'a')); return out; }
      const sp = tendril([c[0] + u * .55, c[1]], Math.PI / 2, u * 2.6, .25 / u, 3.2 / u, 1.3, .3); out.push(hair(sp, 'b', { w: .55, start: 'cut', end: 'ball' }));
      out.push(...dotOutline(arc(c, u * .62, 0, 2 * Math.PI, 30), c, u * .38, u * .55, 'a', r));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'if'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
      const { n, p } = fitN(x1 - x0, h * .55 * v.p);
      if (kind === 'dots' || kind === 'spiral') {
        const end = kind === 'spiral' ? n - 3 : n;
        for (let k = 0; k <= end; k++) out.push(bead([x0 + k * p, mid + h * .1 * Math.sin(k * .9) * (rich >= .5 ? 1 : 0)], .95 + r() * .15, 'a'));
        if (kind === 'spiral') { const c = [x1 - h * .45, mid]; out.push(hair(tendril([x1 - h * 1.3, mid], 0, h * 2.4, .4 / h, 3.4 / h, 1.4, .3), 'b', { w: .5, start: 'cut', end: 'ball' })); if (rich >= .5) out.push(...dotOutline(arc(c, h * .45, -Math.PI * .9, Math.PI * .9, 12), c, h * .32, h * .5, 'a', r)); }
      } else for (let k = 0; k <= n; k++) for (const s of [-1, 1]) if ((k + (s > 0 ? 1 : 0)) % 2) out.push(bead([x0 + k * p, mid + s * h * .22], .9 + r() * .15, 'a'));
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u) {   // a triquetra (or for a book, a larger interlace) in ink, outlined in red dots
      const r = stream(seed, 'ib'), out = [], S = u * (rank < 2 ? .42 : .7);
      const tri = Array.from({ length: 97 }, (_, k) => { const t = k / 96 * 2 * Math.PI; return [cx + S * (Math.sin(t) + 2 * Math.sin(2 * t)), y + S * (Math.cos(t) - 2 * Math.cos(2 * t)) * .9]; });
      out.push(hair(tri, 'b', { w: .55, end: 'cut' }));
      if (rich >= .25) out.push(...dotOutline(tri, [cx, y], u * .45, u * .62, 'a', r));
      if (rank >= 2) for (const s of [-1, 1]) { const x0 = cx + s * S * 4.2; for (let k = 0; k < (rich >= .5 ? 9 : 5); k++) out.push(bead([x0 + s * k * u * .62, y + Math.sin(k * .8) * u * .2], 1, 'a'));
        for (const [dx, dy] of [[0, -u * .4], [-u * .35, u * .25], [u * .35, u * .25]]) out.push(bead([x0 + s * (rich >= .5 ? 9 : 5) * u * .62 + s * u * .5 + dx, y + dy], 1.15, 'a')); }
      return out; } },

  // ---- Hypertext: of the web, in the same hand. Ink and one link blue; the paraph as an open hairline ¶; a line
  // closed by a dotted leader and the newline itself (↵), the web's paragraph; parts divided by the asterism (⁂),
  // prose's own section break and the <hr> drawn. Our invention; it answers to no manuscript.
  hypertext: { label: 'Hypertext', pair: ['blue', 'ink'], alternate: false, minGap: 1.6,
    ink: { blue: { solid: [44, 86, 176], hair: [52, 92, 180] }, ink: { solid: [58, 44, 34], hair: [66, 52, 40] } },
    setup: seed => { const r = stream(seed, 'web'); return { kinds: pickKinds(r, ['return', 'leader'], 1), p: .9 + r() * .3 }; },
    kinds: (v, rich) => rich < .25 ? ['leader'] : v.kinds.includes('return') || rich >= .5 ? ['return', ...v.kinds.filter(k => k !== 'return')] : v.kinds,
    paraph(x, base, u, seed, rich) {   // the pilcrow as a pointed pen draws it: an open bowl and two stems, in hairline
      const c = [x + u * .55, base - u * 1.02], R = u * .45, out = [];
      out.push(hair(arc(c, R, -Math.PI / 2, -Math.PI * 1.5, 16), 'a', { w: .7, start: 'cut', end: 'cut' }));
      out.push(hair([[c[0], base - u * 1.47], [c[0], base + u * .3]], 'a', { w: .7, start: 'cut', end: rich >= .5 ? 'ball' : 'taper' }), hair([[c[0] + u * .36, base - u * 1.47], [c[0] + u * .36, base + u * .3]], 'a', { w: .6, start: 'cut' }));
      out.push(hair([[c[0], base - u * 1.47], [c[0] + u * .5, base - u * 1.47]], 'a', { w: .55, start: 'cut', end: 'cut' }));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'wf'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [], end = kind === 'return' ? x1 - h * 1.6 : x1;
      const { n, p } = fitN(end - x0, h * .75 * v.p);
      for (let k = 0; k <= n; k++) out.push(bead([x0 + k * p, yBase - h * .1], .75 + (rich >= .75 && k % 4 === 0 ? .25 : 0), 'b'));
      if (kind === 'return') {   // ↵: down from the x-height, then back along the line with an arrowhead
        const a = [x1, yTop - h * .2], b = [x1, mid + h * .15], c = [x1 - h * 1.2, mid + h * .15];
        out.push(hair([a, b, c], 'a', { w: .62, start: 'cut', end: 'cut' }), hair([[c[0] + h * .35, c[1] - h * .3], c, [c[0] + h * .35, c[1] + h * .3]], 'a', { w: .58, start: 'cut', end: 'cut' }));
      }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u) {
      const r = stream(seed, 'wb'), out = [], R = u * (rank < 2 ? .5 : .55), W = rank < 2 ? u * 5 : Math.min(measure * .42, u * 18);
      if (rank < 2) out.push(...asterisk([cx, y], R, 'a', r));
      else for (const [dx, dy] of [[0, -u * .6], [-u * .75, u * .55], [u * .75, u * .55]]) out.push(...asterisk([cx + dx, y + dy], R, 'a', r));
      if (rich >= .25) for (const s of [-1, 1]) { const a = cx + s * u * (rank < 2 ? 1.3 : 2), b = cx + s * W / 2;
        out.push(hair([[a, y], [b, y]], 'b', { w: .45, start: 'cut', end: rank >= 2 && rich >= .5 ? 'cut' : 'taper' }));
        if (rank >= 2 && rich >= .5) out.push(hair(hook([b, y], s > 0 ? 0 : Math.PI, u * .35, s), 'b', { end: 'ball' })); }
      return out; } },
};
