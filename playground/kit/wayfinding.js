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
    const { n, p } = fit(h * 1.15), two = rich >= .5, zig = (phase, col) => { const pts = [];
      for (let k = 0; k <= n * 2; k++) pts.push([x0 + k * p / 2 + (r() - .5) * .25, ((k + phase) % 2 ? yTop + h * .12 : yBase - h * .12) + (r() - .5) * .25]);
      if (!two) { out.push(hair(pts, col, { w: .55, end: 'cut' })); return; }
      // a cable: where the strands cross (mid-segment), the one passing under is broken, alternately
      const fine = resample(pts, .5), gap = p * .09; let run = [];
      for (const q of fine) { const j = Math.round((q[0] - x0 - p / 4) / (p / 2)), xc = x0 + p / 4 + j * p / 2, under = Math.abs(q[0] - xc) < gap && j >= 0 && j < n * 2 && (j + phase) % 2 === 0;
        if (under) { if (run.length > 1) out.push(hair(run, col, { w: .55, start: 'taper', end: 'taper' })); run = []; } else run.push(q); }
      if (run.length > 1) out.push(hair(run, col, { w: .55, start: 'taper', end: 'cut' })); };
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
    const loz = (px, L) => { const m = [px + s * L * .5, y + (r() - .5) * .3], o = { col: 'a', broad: .05, nib: .78, w: u * .62, load: 1.15, dry: .08, swell: .1, start: 'cut', end: 'taper' };
      const a = [px + s * L * .62, y], b = [px + s * L * .38, y];   // each half starts past the middle so the two merge without a seam
      return [{ ...o, pts: [a, m, [px + s * L * .25, y], [px, y]] }, { ...o, pts: [b, m, [px + s * L * .75, y], [px + s * L, y]] }]; };   // pressed in the middle, lifted to a point each way
    out.push(...loz(xa - s * u * .15, u * 1.1), ...loz(xb - s * u * 1.5, u * .9));
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
    inkDark: { red: { solid: [232, 104, 78], hair: [226, 118, 94] }, blue: { solid: [112, 146, 232], hair: [120, 150, 228] } },
    setup: seed => { const r = stream(seed, 'gothic'); return { kinds: pickKinds(r, FILLERS, 3) }; },
    kinds: (v, rich) => rich < .25 ? ['beads'] : rich < .5 ? ['beads', 'zigzag'] : v.kinds,
    paraph: (x, base, u, seed, rich) => paraph(x, base, u, seed, rich),
    filler: (x0, x1, yTop, yBase, kind, seed, rich) => filler(x0, x1, yTop, yBase, kind, seed, rich),
    breakMark: (cx, y, measure, rank, seed, rich, u) => breakMark(cx, y, measure, rank, seed, rich, u) },

  // ---- French Book of Hours, c. 1400–1500: pale salmon and blue, gold points, ivy, finer and airier (Met 468976,
  // 2003.493: the hairline ivy with gold leaves and points of the borders, brought down into the text as fillers)
  hours: { label: 'Hours', pair: ['salmon', 'blue'], alternate: true, minGap: 1.6,
    ink: { salmon: { solid: [206, 104, 82], hair: [214, 126, 104] }, blue: { solid: [56, 86, 168], hair: [76, 102, 174] }, gold: { solid: [184, 146, 66], hair: [184, 146, 66] } },
    inkDark: { salmon: { solid: [234, 140, 116], hair: [228, 150, 128] }, blue: { solid: [128, 156, 230], hair: [132, 160, 226] }, gold: { solid: [206, 168, 86], hair: [200, 162, 82] } },
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
  cadel: { label: 'Cadel', pair: ['blue', 'gold'], alternate: false, minGap: 1.4,   // the paraphs blue; the gold is the hairline's
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
      const sp = tendril([c[0] + u * .55, c[1]], Math.PI / 2, u * 5.2, 1.7 / u, 4.6 / u, 1.15, .25); out.push(hair(sp, 'b', { w: .55, start: 'cut', end: 'ball' }));   // starts on the ring, winds in
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

// ==== contemporary styles =======================================================================================================
// Not pastiche of a book: each a movement or a hand with its own point of view, drawn with the same pen. A style may
// carry a `theme` for the page (rubric colour; a dark ground for cyber) and a `blend` ('multiply' for the riso drums).
// Their sources are named; most are in copyright, so they were studied from memory of the works, not from open scans.
const line = (pts, col, w = .6, o = {}) => hair(pts, col, { w, start: 'cut', end: 'cut', ...o });
const wob = (pts, amp, seed) => wander(pts, amp, seed, 9);
const poly = (c, R, n, a0) => Array.from({ length: n + 1 }, (_, k) => { const a = a0 + k / n * 2 * Math.PI; return [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R]; });
const pentagram = (c, R, a0, r) => Array.from({ length: 6 }, (_, k) => { const a = a0 + k * 4 * Math.PI / 5, rr = R * (.9 + r() * .2); return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]; });
const spiralOut = (c, R, turns, a0 = 0) => Array.from({ length: Math.round(turns * 28) + 1 }, (_, k) => { const t = k / 28 * 2 * Math.PI, rr = R * k / (turns * 28); return [c[0] + Math.cos(a0 + t) * rr, c[1] + Math.sin(a0 + t) * rr]; });
const arrowHead = (p, a, s, col, w) => line([[p[0] - Math.cos(a - .5) * s, p[1] - Math.sin(a - .5) * s], p, [p[0] - Math.cos(a + .5) * s, p[1] - Math.sin(a + .5) * s]], col, w);

Object.assign(STYLES, {
  // ---- Doodle: the margin of a sketchbook, one blue ballpoint; loose, wobbling, quick
  doodle: { label: 'Doodle', pair: ['bic', 'bic'], alternate: false, minGap: 1.3, theme: { rubric: 'rgb(34 54 140)' },
    ink: { bic: { solid: [30, 50, 140], hair: [40, 62, 152] } }, inkDark: { bic: { solid: [124, 152, 244], hair: [128, 156, 240] } },
    setup: seed => { const r = stream(seed, 'doodle'); return { kinds: pickKinds(r, ['loops', 'arrow', 'hatch', 'spirals'], 2), par: ['star', 'spiral', 'arrow'][(r() * 3) | 0], p: .85 + r() * .35 }; },
    kinds: (v, rich) => rich < .25 ? ['arrow'] : v.kinds,
    paraph(x, base, u, seed, rich, v) { const r = stream(seed, 'dp'), c = [x + u * .75, base - u * .55], out = [], o = { w: .62, load: .72, start: 'pool', end: 'taper' };
      if (v.par === 'star') out.push(hair(wob(pentagram(c, u * .72, -Math.PI / 2 + (r() - .5) * .4, r), .25, seed), 'a', o));
      else if (v.par === 'spiral') out.push(hair(wob(spiralOut(c, u * .7, 2.3, r() * 6), .15, seed), 'a', o));
      else { const a = [x, c[1] + u * .2], b = [x + u * 1.5, c[1] - u * .1]; out.push(hair(wob([a, b], .3, seed), 'a', o), arrowHead(b, -.2, u * .5, 'a', .6)); }
      if (rich >= .5) out.push(hair(wob([[x - u * .1, base + u * .3], [x + u * 1.5, base + u * .22]], .35, seed + 1), 'a', { w: .5, load: .6 }));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'df'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [], o = { w: .58, load: .72, start: 'pool', end: 'taper' };
      if (kind === 'loops') { const { n, p } = fitN(x1 - x0, h * 1.1 * v.p), pts = [];
        for (let k = 0; k <= n * 20; k++) { const t = k / 20 * 2 * Math.PI; pts.push([x0 + k / 20 * p - h * .42 * Math.sin(t), mid - h * .42 * Math.cos(t) + h * .2]); }
        out.push(hair(wob(pts.filter(q => q[0] >= x0 - .5 && q[0] <= x1 + .5), .3, seed), 'a', o)); }
      else if (kind === 'arrow') { const pts = wob([[x0, mid + (r() - .5) * h * .2], [x1 - .5, mid]], .45, seed); out.push(hair(pts, 'a', { ...o, end: 'cut' }), arrowHead([x1, mid], 0, h * .6, 'a', .6));
        if (rich >= .5) for (const d of [0, h * .35]) out.push(line([[x0 + d, mid], [x0 + d - h * .3, mid - h * .35]], 'a', .5), line([[x0 + d, mid], [x0 + d - h * .3, mid + h * .35]], 'a', .5)); }
      else if (kind === 'hatch') { const { n, p } = fitN(x1 - x0, h * .42 * v.p);
        for (let k = 0; k <= n; k++) { const x = x0 + k * p; out.push(hair(wob([[Math.max(x0, x - h * .35), yBase], [Math.min(x1, x + h * .1), yTop]], .12, seed + k), 'a', { w: .5, load: .68 })); }
        if (rich >= .75) for (let k = 0; k <= n; k += 2) { const x = x0 + k * p; out.push(hair([[x, yBase], [Math.min(x1, x + h * .5), yTop + h * .3]], 'a', { w: .4, load: .55 })); } }
      else { const { n, p } = fitN(x1 - x0, h * 1.25 * v.p);
        for (let k = 0; k < n; k++) out.push(hair(wob(spiralOut([x0 + (k + .5) * p, mid], Math.min(p * .45, h * .5), 2, r() * 6), .12, seed + k), 'a', o)); }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u) {
      const r = stream(seed, 'db'), out = [], o = { w: .62, load: .72, start: 'pool', end: 'taper' }, W = rank < 2 ? u * 9 : Math.min(measure * .5, u * 24);
      out.push(hair(wob(pentagram([cx, y], u * (rank < 2 ? .9 : 1.3), -Math.PI / 2 + (r() - .5) * .5, r), .3, seed), 'a', o));
      for (const s of [-1, 1]) { const pts = []; for (let d = u * (rank < 2 ? 1.5 : 2); d <= W / 2; d += .8) pts.push([cx + s * d, y + Math.sin(d / u * 1.6) * u * .3]);
        out.push(hair(wob(pts, .4, seed + s), 'a', o));
        if (rank >= 2) out.push(hair(wob(spiralOut([cx + s * (W / 2 + u * .8), y], u * .7, 2, r() * 6), .15, seed + 3 * s), 'a', o)); }
      if (rich >= .5) for (const s of [-1, 1]) out.push(line([[cx + s * u * 1.2, y - u * 1.3], [cx + s * u * 1.8, y - u * 1.9]], 'a', .5), line([[cx + s * u * 1.5, y - u * .8], [cx + s * u * 2.3, y - u * 1.1]], 'a', .5));
      if (rich >= .75 && rank >= 2) out.push(hair(wob([[cx - W * .35, y + u * 1.2], [cx + W * .35, y + u * 1.1]], .5, seed + 9), 'a', { w: .5, load: .6 }));
      return out; } },

  // ---- Cyber: the terminal and the heads-up display (the interface type of Akira, 1988, and Ghost in the Shell,
  // 1995): brackets, chevrons, ruled scales with ticks, circuit traces, a glitch's doubled stroke; cyan and magenta on a
  // dark ground
  cyber: { label: 'Cyber', pair: ['cyan', 'magenta'], alternate: true, minGap: 1.2,
    theme: { dark: true, ground: [13, 15, 21], text: 'rgb(198 208 218)', rubric: 'rgb(206 28 118)', rubricDark: 'rgb(255 64 150)' },
    ink: { cyan: { solid: [0, 132, 156], hair: [0, 128, 150] }, magenta: { solid: [206, 28, 118], hair: [206, 40, 124] } },
    inkDark: { cyan: { solid: [0, 214, 240], hair: [0, 200, 228] }, magenta: { solid: [255, 54, 142], hair: [255, 70, 150] } },
    setup: seed => { const r = stream(seed, 'cyber'); return { kinds: pickKinds(r, ['trace', 'ticks', 'glitch'], 2), p: .85 + r() * .35, off: [1 + r(), -(.6 + r() * .6)] }; },
    kinds: (v, rich) => rich < .25 ? ['ticks'] : v.kinds,
    paraph(x, base, u, seed, rich, v) { const out = [], m = base - u * .55, s = u * .5;
      for (const dx of [0, u * .55]) out.push(line([[x + dx, m - s], [x + dx + s, m], [x + dx, m + s]], 'a', .9));
      if (rich >= .5) out.push(line([[x + u * 1.35, base + u * .1], [x + u * 1.95, base + u * .1]], 'b', .9));
      if (rich >= .75) out.push(line([[x + v.off[0], m - s + v.off[1]], [x + s + v.off[0], m + v.off[1]], [x + v.off[0], m + s + v.off[1]]], 'b', .5));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'cf'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
      if (kind === 'trace') {   // a circuit trace: runs at three levels joined by 45° jogs, ending in a via
        const lv = [mid, yTop + h * .15, yBase - h * .15], pts = [[x0, mid]]; let x = x0, cur = 0;
        while (x < x1 - h * 1.6) { const run = h * (1 + r() * 2.2) * v.p, nx = Math.min(x + run, x1 - h * 1.6); pts.push([nx, lv[cur]]); x = nx;
          if (x >= x1 - h * 1.6) break; const nxt = (cur + 1 + ((r() * 2) | 0)) % 3, dy = Math.abs(lv[nxt] - lv[cur]); pts.push([x + dy, lv[nxt]]); x += dy; cur = nxt; }
        pts.push([x1 - h * .5, pts.at(-1)[1]]); out.push(line(pts, 'a', .7), line(arc([x1 - h * .3, pts.at(-1)[1]], h * .22, 0, 2 * Math.PI, 14), 'a', .6));
        if (rich >= .5) out.push(bead([x0 + h * .3, mid], .9, 'b')); }
      else if (kind === 'ticks') {   // a scale: a rule with ticks, every fifth long
        const y = yBase - h * .05, { n, p } = fitN(x1 - x0, h * .45 * v.p); out.push(line([[x0, y], [x1, y]], 'a', .55));
        for (let k = 0; k <= n; k++) out.push(line([[x0 + k * p, y], [x0 + k * p, y - h * (k % 5 === 0 ? .7 : .32)]], k % 5 === 0 && rich >= .5 ? 'b' : 'a', .5)); }
      else {   // a data stream, glitched: dashes of uneven length, and their doubled ghost a pixel off
        let x = x0; while (x < x1 - 1) { const L = Math.min(x1 - x, h * (.4 + r() * 1.6)); out.push(line([[x, mid], [x + L, mid]], 'a', .9));
          if (rich >= .25 && r() < .6) out.push(line([[x + v.off[0], mid + v.off[1] * 2], [x + L + v.off[0] * .5, mid + v.off[1] * 2]], 'b', .5)); x += L + h * (.2 + r() * .4); } }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u, v) {
      const r = stream(seed, 'cb'), out = [], W = rank < 2 ? u * 12 : Math.min(measure * .66, u * 32), H = rank < 2 ? u * .8 : u * 1.5;
      const D = u * (rank < 2 ? .45 : .7); out.push(line([[cx, y - D], [cx + D, y], [cx, y + D], [cx - D, y], [cx, y - D]], 'b', .7));
      for (const s of [-1, 1]) { const xb = cx + s * W / 2;
        out.push(line([[cx + s * D * 1.8, y], [xb - s * u * .6, y]], 'a', .6));
        if (rank < 2) out.push(line([[xb - s * u * .3, y - H], [xb, y - H], [xb, y + H], [xb - s * u * .3, y + H]], 'a', .7));
        else { for (const sy of [-1, 1]) out.push(line([[xb - s * u * 1.6, y + sy * H], [xb, y + sy * H], [xb, y + sy * (H - u * .9)]], 'a', .7));
          const n = Math.floor((W / 2 - D * 2 - u) / (u * .6)); for (let k = 1; k <= n; k++) out.push(line([[cx + s * (D * 1.8 + k * u * .6), y], [cx + s * (D * 1.8 + k * u * .6), y + (k % 4 === 0 ? u * .5 : u * .22)]], 'a', .45));
          if (rich >= .5) for (let k = 0; k < 3; k++) out.push(bead([xb - s * u * (1 + k * .6), y - H + u * .5], .8, k === 0 ? 'b' : 'a')); } }
      if (rich >= .75) out.push(line([[cx - W * .3 + v.off[0], y + v.off[1] * 2], [cx - W * .12 + v.off[0], y + v.off[1] * 2]], 'b', .5), line([[cx + W * .18, y - v.off[1] * 2], [cx + W * .28, y - v.off[1] * 2]], 'b', .5));
      return out; } },

  // ---- Swiss: the International Typographic Style (Müller-Brockmann, Grid Systems in Graphic Design, 1981; Emil
  // Ruder, Typographie, 1967): one red and black, rules and bullets, everything flush left on the grid, nothing extra
  swiss: { label: 'Swiss', pair: ['red', 'black'], alternate: false, minGap: 1.2, flush: true, theme: { rubric: 'rgb(226 30 22)' },
    ink: { red: { solid: [226, 30, 22], hair: [226, 30, 22] }, black: { solid: [22, 22, 22], hair: [26, 26, 26] } },
    setup: seed => { const r = stream(seed, 'swiss'); return { kinds: pickKinds(r, ['rule', 'points'], 1), bar: 2.6 + r() * 1.4 }; },
    kinds: (v, rich) => rich < .5 ? ['rule'] : v.kinds,
    paraph: (x, base, u) => [bead([x + u * .5, base - u * .48], u * .4, 'a')],
    filler(x0, x1, yTop, yBase, kind, seed, rich) {
      const h = yBase - yTop, y = yBase - h * .02, out = [];
      if (kind === 'rule') out.push(line([[x0, y], [x1, y]], 'b', .6));
      else { const { n, p } = fitN(x1 - x0, h * .7); for (let k = 0; k <= n; k++) out.push(bead([x0 + k * p, y - h * .15], .75, 'b')); }
      if (rich >= .5) out.push({ col: 'a', broad: 1, nib: Math.PI / 2, w: h * .55, load: 1.1, dry: 0, swell: 0, start: 'cut', end: 'cut', pts: [[x1 - h * .55, y - h * .28], [x1, y - h * .28]] });
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u, v) {   // flush left: a heavy bar where the column starts; for a book, the measure ruled
      const left = cx - measure / 2, out = [], bw = u * (rank < 2 ? .5 : .75);
      out.push({ col: 'a', broad: 1, nib: Math.PI / 2, w: bw, load: 1.1, dry: 0, swell: 0, start: 'cut', end: 'cut', pts: [[left, y], [left + u * v.bar * (rank < 2 ? 1 : 1.6), y]] });
      if (rank >= 2) out.push(line([[left, y + u * 1.1], [left + measure, y + u * 1.1]], 'b', .7));
      if (rank >= 2 && rich >= .5) out.push(bead([left + measure - u * .4, y], u * .3, 'a'));
      return out; } },

  // ---- Memphis: Ettore Sottsass and the Memphis group, Milan 1981 (the Carlton bookcase, the Bacterio laminate):
  // squiggles, confetti, triangles and circles in pink, teal and yellow with black, cheerfully off the grid
  memphis: { label: 'Memphis', pair: ['pink', 'teal'], alternate: true, minGap: 1.3, theme: { rubric: 'rgb(222 64 138)' },
    ink: { pink: { solid: [238, 86, 152], hair: [238, 86, 152] }, teal: { solid: [0, 164, 164], hair: [0, 164, 164] }, gold: { solid: [248, 196, 30], hair: [240, 186, 20] }, black: { solid: [28, 28, 28], hair: [30, 30, 30] } },
    setup: seed => { const r = stream(seed, 'memphis'); return { kinds: pickKinds(r, ['squiggle', 'confetti', 'zigzag'], 2), par: r() < .5 ? 'tri' : 'sq', p: .85 + r() * .35 }; },
    kinds: (v, rich) => rich < .25 ? ['squiggle'] : v.kinds,
    paraph(x, base, u, seed, rich, v) { const r = stream(seed, 'mp'), c = [x + u * .75, base - u * .5], out = [];
      if (v.par === 'tri') out.push(line(poly(c, u * .7, 3, -Math.PI / 2 + (r() - .5) * .5), 'k', .9), bead([c[0] + u * .55, c[1] + u * .45], u * .22, 'a'));
      else { const pts = []; for (let k = 0; k <= 30; k++) pts.push([x + k / 30 * u * 1.6, c[1] + Math.sin(k / 30 * 3 * Math.PI) * u * .35]); out.push(line(pts, 'k', .9), bead([x + u * .8, c[1] - u * .75], u * .2, 'g')); }
      if (rich >= .5) out.push(line(arc([x + u * .45, base + u * .62], u * .3, Math.PI, 2 * Math.PI, 10), 'b', .8, { start: 'taper', end: 'taper' }));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'mf'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
      if (kind === 'squiggle') { const { n, p } = fitN(x1 - x0, h * .9 * v.p), pts = []; for (let x = x0; x <= x1 + .01; x += .5) pts.push([x, mid + Math.sin((x - x0) / p * 2 * Math.PI) * h * .3]); out.push(line(pts, 'k', .85)); }
      else if (kind === 'zigzag') { const { n, p } = fitN(x1 - x0, h * .7 * v.p), z = []; for (let k = 0; k <= n; k++) z.push([x0 + k * p, k % 2 ? yTop + h * .1 : yBase - h * .1]); out.push(line(z, 'b', .9));
        if (rich >= .5) for (let k = 1; k < n; k += 2) out.push(bead([x0 + k * p, yBase + h * .05], .9, 'g')); }
      else { const { n, p } = fitN(x1 - x0, h * .8 * v.p);   // confetti: a scatter of small shapes, no two alike in a row
        for (let k = 0; k < n; k++) { const c = [x0 + (k + .5) * p + (r() - .5) * p * .3, mid + (r() - .5) * h * .5], kind2 = k % 4, col = ['a', 'b', 'g', 'k'][(k + ((r() * 2) | 0)) % 4], a = r() * Math.PI;
          if (kind2 === 0) out.push(line([[c[0] - Math.cos(a) * h * .3, c[1] - Math.sin(a) * h * .3], [c[0] + Math.cos(a) * h * .3, c[1] + Math.sin(a) * h * .3]], col, 1.1));
          else if (kind2 === 1) out.push(line(arc(c, h * .2, 0, 2 * Math.PI, 12), col, .7));
          else if (kind2 === 2) out.push(line(poly(c, h * .26, 3, a), col, .7));
          else out.push(bead(c, h * .14, col)); } }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u, v) {
      const r = stream(seed, 'mb'), out = [], W = rank < 2 ? u * 10 : Math.min(measure * .55, u * 26), pts = [];
      for (let x = cx - W / 2; x <= cx + W / 2; x += .5) pts.push([x, y + Math.sin((x - cx) / u * 1.3) * u * .45]); out.push(line(pts, 'k', .9));
      out.push(bead([cx - W * .18, y - u * 1], u * .38, 'g'), line(poly([cx + W * .18, y - u * .9], u * .6, 3, -Math.PI / 2 + .3), 'a', .9));
      if (rank >= 2) { out.push(line(arc([cx, y + u * 2.2], u * 1, Math.PI, 2 * Math.PI, 16), 'b', 1, { start: 'taper', end: 'taper' }));
        for (let k = 0; k < 3; k++) out.push(line([[cx + W * .32 + k * u * .5, y + u * .5], [cx + W * .32 + k * u * .5 + u * .6, y - u * .6]], 'a', .8)); }
      if (rich >= .5) for (let k = 0; k < (rank < 2 ? 4 : 9); k++) { const c = [cx + (r() - .5) * W, y + (r() < .5 ? -1 : 1) * u * (1.4 + r() * .6)]; out.push(k % 2 ? bead(c, u * .14, ['a', 'b', 'g'][k % 3]) : line([[c[0] - u * .25, c[1]], [c[0] + u * .25, c[1] + u * .1]], ['b', 'k', 'a'][k % 3], 1)); }
      return out; } },

  // ---- Riso: a two-drum zine: fluorescent pink and blue overprinted, a little out of register, bold and blunt
  riso: { label: 'Riso', pair: ['pink', 'blue'], alternate: false, minGap: 1.3, blend: 'multiply', blendDark: 'screen', inkDark: { pink: { solid: [255, 96, 188], hair: [255, 96, 188] }, blue: { solid: [40, 150, 230], hair: [40, 150, 230] } }, theme: { rubric: 'rgb(240 64 160)' },
    ink: { pink: { solid: [255, 72, 176], hair: [255, 72, 176] }, blue: { solid: [0, 120, 191], hair: [0, 120, 191] } },
    setup: seed => { const r = stream(seed, 'riso'); return { kinds: pickKinds(r, ['halftone', 'stripes', 'bold'], 2), off: [1.8 + r() * 1.4, (r() < .5 ? -1 : 1) * (1.2 + r() * .9)] }; },   // the drums out of register by about half a millimetre
    kinds: (v, rich) => rich < .25 ? ['bold'] : v.kinds,
    paraph(x, base, u, seed, rich, v) {   // the broad paraph printed on both drums, the blue drum a little off
      const a = paraph(x, base, u, seed, 0), out = a.map(m => ({ ...m, col: 'a' }));
      if (rich >= .25) out.push(...a.map(m => ({ ...m, col: 'b', pts: m.pts.map(([px, py]) => [px + v.off[0], py + v.off[1]]) })));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const h = yBase - yTop, mid = (yTop + yBase) / 2, out = [], twice = (m) => rich >= .25 ? [m, { ...m, col: 'b', pts: m.pts?.map(([px, py]) => [px + v.off[0] * .6, py + v.off[1] * .6]), p: m.p && [m.p[0] + v.off[0] * .6, m.p[1] + v.off[1] * .6] }] : [m];
      if (kind === 'halftone') { const { n, p } = fitN(x1 - x0, h * .55); for (let k = 0; k <= n; k++) { const t = k / n; out.push(bead([x0 + k * p, mid], h * (.32 - .24 * t), 'a'), ...(rich >= .25 ? [bead([x0 + k * p + v.off[0] * .6, mid + v.off[1] * .6], h * (.08 + .24 * t), 'b')] : [])); } }
      else if (kind === 'stripes') { const { n, p } = fitN(x1 - x0, h * .55); for (let k = 0; k < n; k++) out.push(...twice(line([[x0 + k * p, yBase], [x0 + k * p + h * .45, yTop]], 'a', 1.3))); }
      else { const { n, p } = fitN(x1 - x0, h * .9), z = []; for (let k = 0; k <= n; k++) z.push([x0 + k * p, k % 2 ? yTop + h * .1 : yBase - h * .1]); out.push(...twice(line(z, 'a', 1.5))); }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u, v) {
      const r = stream(seed, 'rb'), out = [], off = ([px, py]) => [px + v.off[0], py + v.off[1]];
      if (rank < 2) { for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4 + (r() - .5) * .1, R = u * .9; const m = line([[cx - Math.cos(a) * R, y - Math.sin(a) * R], [cx + Math.cos(a) * R, y + Math.sin(a) * R]], 'a', 1.8);
          out.push(m); if (rich >= .25) out.push({ ...m, col: 'b', pts: m.pts.map(off) }); } return out; }
      const R = u * 2.2, st = u * .6;   // a halftone disc: dots on a grid, larger toward the centre, on both drums
      for (let gx = -R; gx <= R; gx += st) for (let gy = -R; gy <= R; gy += st) { const d = Math.hypot(gx, gy) / R; if (d > 1) continue;
        out.push(bead([cx + gx, y + gy], st * .48 * (1 - d * .85), 'a')); if (rich >= .5) out.push(bead(off([cx + gx + st / 2, y + gy + st / 2]), st * .4 * (1 - d) * (d > .3 ? 1 : .3), 'b')); }
      for (const s of [-1, 1]) { const m = line([[cx + s * (R + u * .8), y], [cx + s * Math.min(measure * .3, u * 14), y]], 'b', 1.6); out.push(m, { ...m, col: 'a', pts: m.pts.map(off) }); }
      return out; } },

  // ---- Deco: Art Deco, the posters of A. M. Cassandre (Nord Express, 1927; Normandie, 1935): speed lines,
  // stepped chevrons, sunbursts, black and gold
  deco: { label: 'Deco', pair: ['gold', 'black'], alternate: false, minGap: 1.3, theme: { rubric: 'rgb(146 106 34)' },
    ink: { gold: { solid: [176, 134, 50], hair: [170, 128, 46] }, black: { solid: [24, 22, 20], hair: [28, 26, 24] } },
    setup: seed => { const r = stream(seed, 'deco'); return { kinds: pickKinds(r, ['speed', 'steps', 'fans'], 2), rays: 7 + 2 * ((r() * 3) | 0) }; },
    kinds: (v, rich) => rich < .25 ? ['speed'] : v.kinds,
    paraph(x, base, u, seed, rich) { const out = [], m = base - u * .55;   // three nested chevrons, the outer in gold
      for (let k = 0; k < (rich >= .25 ? 3 : 2); k++) { const s = u * .62, dx = k * u * .46; out.push(line([[x + dx, m - s], [x + dx + s * .9, m], [x + dx, m + s]], k ? 'b' : 'a', k ? .7 : 1, { start: 'taper', end: 'taper' })); }
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
      if (kind === 'speed') { [yTop + h * .2, mid, yBase - h * .2].forEach((y, k) => out.push(line([[x0 + (x1 - x0) * k * .12, y], [x1 - h * .7, y]], k === 1 ? 'a' : 'b', .6)));
        out.push(line([[x1 - h * .7, yTop + h * .05], [x1, mid], [x1 - h * .7, yBase - h * .05]], 'a', .9)); }
      else if (kind === 'steps') { const { n, p } = fitN(x1 - x0, h * 2.4), pts = [];
        for (let k = 0; k < n; k++) { const a = x0 + k * p, s = p / 6; pts.push([a, yBase], [a + s, yBase], [a + s, yBase - h * .3], [a + 2 * s, yBase - h * .3], [a + 2 * s, yTop + h * .1], [a + 4 * s, yTop + h * .1], [a + 4 * s, yBase - h * .3], [a + 5 * s, yBase - h * .3], [a + 5 * s, yBase], [a + p, yBase]); }
        out.push(line(pts, 'a', .65)); }
      else { const { n, p } = fitN(x1 - x0, h * 1.5); for (let k = 0; k < n; k++) { const c = [x0 + (k + .5) * p, yBase];
          for (let j = 0; j < 5; j++) { const a = Math.PI + (j + .5) / 5 * Math.PI; out.push(line([c, [c[0] + Math.cos(a) * h * .85, c[1] + Math.sin(a) * h * .85]], j === 2 ? 'a' : 'b', .5)); } } }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u, v) {
      const out = [], W = rank < 2 ? u * 12 : Math.min(measure * .62, u * 30), R = u * (rank < 2 ? 1.3 : 2);
      const base = y + u * .5;
      if (rank >= 2) { const st = [[cx - R, base], [cx - R, base - u * .5], [cx - R * .66, base - u * .5], [cx - R * .66, base - u], [cx - R * .33, base - u], [cx - R * .33, base - u * 1.5], [cx + R * .33, base - u * 1.5], [cx + R * .33, base - u], [cx + R * .66, base - u], [cx + R * .66, base - u * .5], [cx + R, base - u * .5], [cx + R, base]];
        out.push(line(st, 'b', .8)); }
      const top = rank >= 2 ? base - u * 1.5 : base;
      for (let j = 0; j < v.rays; j++) { const a = Math.PI + (j + .5) / v.rays * Math.PI, R0 = rank >= 2 ? u * .8 : u * .45; out.push(line([[cx + Math.cos(a) * R0, top + Math.sin(a) * R0], [cx + Math.cos(a) * R * (j % 2 ? .75 : 1), top + Math.sin(a) * R * (j % 2 ? .75 : 1)]], j === (v.rays >> 1) ? 'a' : 'b', .55)); }
      for (const s of [-1, 1]) [0, 1, 2].slice(0, rich >= .25 ? 3 : 1).forEach(k => { const yy = base - k * u * .35, a = cx + s * (R + u * .6), b = cx + s * (W / 2 - k * u * 1.2);
        out.push(line([[a, yy], [b, yy]], k === 1 ? 'a' : 'b', .6)); if (rich >= .5 && k === 0) out.push(line([[b - s * u * .5, yy - u * .45], [b, yy], [b - s * u * .5, yy + u * .45]], 'a', .7)); });
      return out; } },
});

// ==== other systems of wayfinding ===============================================================================================
// Ornament borrowed from the notations people already find their way by: the map, the score, the drawing.
const dashed = (a, b, dash, gap, col, w = .6) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), t = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], out = []; let s = 0;
  while (s < L - .5) { const e = Math.min(L, s + dash); out.push(line([[a[0] + t[0] * s, a[1] + t[1] * s], [a[0] + t[0] * e, a[1] + t[1] * e]], col, w, { start: 'taper', end: 'taper' })); s = e + gap; } return out; };
Object.assign(STYLES, {
  // ---- Cartographic: map conventions (the Ordnance Survey and the USGS sheets): a pin for "you are here", routes
  // dashed with a waypoint and a flag, railways tied, rivers doubled, hachures; a scale bar, and the compass rose
  carto: { label: 'Map', pair: ['route', 'water'], alternate: false, minGap: 1.4, theme: { rubric: 'rgb(186 52 40)' },
    ink: { route: { solid: [196, 52, 40], hair: [196, 52, 40] }, water: { solid: [44, 112, 182], hair: [52, 120, 188] }, black: { solid: [60, 48, 38], hair: [70, 56, 44] } },
    setup: seed => { const r = stream(seed, 'carto'); return { kinds: pickKinds(r, ['route', 'rail', 'river', 'hachure'], 2), p: .85 + r() * .35, flag: r() < .5 }; },
    kinds: (v, rich) => rich < .25 ? ['route'] : v.kinds,
    paraph(x, base, u, seed, rich) {   // a map pin: a drop with a ring in its head, its point on the line
      const c = [x + u * .7, base - u * 1.05], R = u * .5, tip = [c[0], base + u * .2], out = [];
      const drop = [tip, ...arc(c, R, Math.PI * .72, Math.PI * 2.28, 24), tip];
      out.push(hair(drop, 'a', { w: .75, start: 'cut', end: 'cut' }), bead(c, R * .38, 'a'));
      if (rich >= .5) out.push(line([[tip[0] - u * .6, tip[1] + u * .12], [tip[0] + u * .6, tip[1] + u * .12]], 'k', .5, { start: 'taper', end: 'taper' }));   // the ground it stands on
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'mapf'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
      if (kind === 'route') { const a = x0 + h * .5, b = x1 - h * (v.flag ? 1 : .6);
        out.push(hair(arc([x0 + h * .25, mid], h * .22, 0, 2 * Math.PI, 16), 'a', { w: .55, end: 'cut' }), ...dashed([a, mid], [b, mid], h * .55 * v.p, h * .32, 'a', .7));
        if (v.flag) out.push(line([[x1 - h * .2, yBase], [x1 - h * .2, yTop - h * .15]], 'k', .55), hair([[x1 - h * .2, yTop - h * .15], [x1 + h * .05, yTop + h * .05], [x1 - h * .2, yTop + h * .25]], 'a', { w: .55, start: 'cut', end: 'cut' }));
        else out.push(arrowHead([x1, mid], 0, h * .45, 'a', .6)); }
      else if (kind === 'rail') { const { n, p } = fitN(x1 - x0, h * .5 * v.p); out.push(line([[x0, mid], [x1, mid]], 'k', .7)); for (let k = 0; k <= n; k++) out.push(line([[x0 + k * p, mid - h * .22], [x0 + k * p, mid + h * .22]], 'k', .45)); }
      else if (kind === 'river') { const pts = [], ph = r() * 6, { p } = fitN(x1 - x0, h * 2.2 * v.p);
        for (let x = x0; x <= x1 + .01; x += .6) pts.push([x, mid + Math.sin((x - x0) / p * 2 * Math.PI + ph) * h * .16 * Math.min(1, (x - x0) / (h * 2))]);
        out.push(hair(pts, 'b', { w: .55, start: 'taper', end: 'cut' }), hair(pts.map(([px, py]) => [px, py + h * .2 * Math.min(1, (px - x0) / (h * 3))]), 'b', { w: .45, start: 'taper', end: 'cut' })); }
      else { const { n, p } = fitN(x1 - x0, h * .32 * v.p); out.push(hair(wander([[x0, yTop + h * .2], [x1, yTop + h * .2]], .2, seed, 30), 'k', { w: .5, end: 'cut' }));
        for (let k = 0; k <= n; k++) { const L = h * (.35 + .45 * Math.abs(Math.sin(k * .5 + r()))); out.push(line([[x0 + k * p, yTop + h * .3], [x0 + k * p + L * .15, yTop + h * .3 + L]], 'k', .42, { start: 'cut', end: 'taper' })); } }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u) {
      const out = [];
      if (rank < 2) { const W = u * 10, n = 4;   // a scale bar: alternate segments filled, ticks, the half split again
        out.push(line([[cx - W / 2, y - u * .22], [cx + W / 2, y - u * .22]], 'k', .5), line([[cx - W / 2, y + u * .22], [cx + W / 2, y + u * .22]], 'k', .5));
        for (let k = 0; k <= n; k++) out.push(line([[cx - W / 2 + k * W / n, y - u * .22], [cx - W / 2 + k * W / n, y + u * .22 + (k % 2 ? 0 : u * .3)]], 'k', .5));
        for (let k = 0; k < n; k += 2) out.push({ col: 'k', broad: 1, nib: Math.PI / 2, w: u * .3, load: 1, dry: 0, swell: 0, start: 'cut', end: 'cut', pts: [[cx - W / 2 + k * W / n, y], [cx - W / 2 + (k + 1) * W / n, y]] });
        return out; }
      // the compass rose: eight points, the cardinal longer, north marked; a ring; graticule lines out to each side
      const R = u * 2.1; out.push(hair(arc([cx, y], R * .62, 0, 2 * Math.PI, 40), 'k', { w: .5, start: 'cut', end: 'cut' }));
      for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + k * Math.PI / 4, L = R * (k % 2 ? .62 : 1), sw = R * .14, tip = [cx + Math.cos(a) * L, y + Math.sin(a) * L];
        const l = [cx + Math.cos(a + Math.PI / 2) * sw, y + Math.sin(a + Math.PI / 2) * sw], rr = [cx + Math.cos(a - Math.PI / 2) * sw, y + Math.sin(a - Math.PI / 2) * sw];
        out.push(line([l, tip, rr], k === 0 ? 'a' : 'k', .55)); }
      out.push(bead([cx, y - R - u * .55], u * .16, 'a'));
      if (rich >= .25) for (const s of [-1, 1]) { const a = cx + s * (R + u * .8), b = cx + s * Math.min(measure * .32, u * 15);
        out.push(...dashed([a, y], [b, y], u * .9, u * .45, 'b', .5)); if (rich >= .5) out.push(line([[b, y - u * .4], [b, y + u * .4]], 'b', .5)); }
      return out; } },

  // ---- Score: musical notation as wayfinding (the segno and coda that send a player back and on): a staff with a
  // tune on it closing the line, a slur, a trill; the fermata between chapters, double bars with repeats between books
  score: { label: 'Score', pair: ['black', 'red'], alternate: false, minGap: 1.6, theme: { rubric: 'rgb(150 30 30)' },
    ink: { black: { solid: [32, 28, 26], hair: [40, 34, 30] }, red: { solid: [168, 36, 30], hair: [176, 48, 40] } },
    setup: seed => { const r = stream(seed, 'score'); return { kinds: pickKinds(r, ['staff', 'slur', 'trill'], 2), p: .85 + r() * .3, key: r() }; },
    kinds: (v, rich) => rich < .25 ? ['slur'] : v.kinds,
    paraph(x, base, u, seed, rich) {   // an eighth note: a head, its stem, one flag; a single axis, read at once as music
      const r = stream(seed, 'sp'), hc = [x + u * .55, base - u * .32], out = [];
      out.push({ col: 'a', broad: .9, nib: -.5, w: u * .5, load: 1.1, dry: .05, swell: .1, start: 'taper', end: 'taper', pts: [[hc[0] - u * .34, hc[1] + u * .1], [hc[0], hc[1] - u * .02], [hc[0] + u * .34, hc[1] - u * .14]] });
      const top = [hc[0] + u * .32, base - u * 1.62]; out.push(line([[hc[0] + u * .32, hc[1] - u * .1], top], 'a', .7, { start: 'cut', end: 'cut' }));
      out.push(hair([top, [top[0] + u * .2, top[1] + u * .35], [top[0] + u * .55, top[1] + u * .62 + (r() - .5) * u * .1], [top[0] + u * .42, top[1] + u * 1]], 'a', { w: .65, start: 'cut', end: 'taper' }));
      if (rich >= .5) out.push(hair([[x + u * 1.55, base - u * 1.3], [x + u * 1.62, base - u * 1.05], [x + u * 1.5, base - u * .82]], 'b', { w: .7, start: 'ball', end: 'taper' }));   // a breath mark after it
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'sf'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
      if (kind === 'staff') {   // three lines of a staff and a short tune on it, a barline at the measure
        const g = h * .38, ys = [mid - g, mid, mid + g];
        ys.forEach(y => out.push(line([[x0, y], [x1, y]], 'a', .38, { start: 'taper' })));
        out.push(line([[x1, mid - g], [x1, mid + g]], 'a', .7));
        const { n, p } = fitN(x1 - x0 - h, h * 1.15 * v.p); let pitch = Math.round(v.key * 4) - 2;
        for (let k = 0; k < n; k++) { pitch = Math.max(-2, Math.min(2, pitch + ((r() * 3) | 0) - 1)); const nx = x0 + (k + .6) * p, ny = mid - pitch * g / 2;
          out.push(bead([nx, ny], g * .42, k === n - 1 && rich >= .5 ? 'b' : 'a'), line([[nx + g * .38, ny], [nx + g * .38, ny - h * .85]], 'a', .45, { start: 'cut', end: 'taper' })); } }
      else if (kind === 'slur') { const a = [x0 + h * .45, yBase - h * .3], b = [x1 - h * .45, yBase - h * .3], c = [(x0 + x1) / 2, yTop - h * .4], sl = [];
        for (let k = 0; k <= 40; k++) { const t = k / 40; sl.push([0, 1].map(j => (1 - t) ** 2 * a[j] + 2 * t * (1 - t) * c[j] + t * t * b[j])); }   // a slur that stays in its band
        out.push(hair(sl, 'a', { w: .7, start: 'taper', end: 'taper' }), bead([x0 + h * .25, yBase - h * .1], h * .16, 'a'), bead([x1 - h * .25, yBase - h * .1], h * .16, 'a')); }
      else { out.push({ col: 'b', broad: .2, w: .9, start: 'cut', end: 'cut', pts: [[x0, yTop + h * .1], [x0, yBase - h * .1]] }, line([[x0 - h * .15, mid - h * .2], [x0 + h * .3, mid - h * .2]], 'b', .6));
        const pts = [], { p } = fitN(x1 - x0 - h * .8, h * .5 * v.p); for (let x = x0 + h * .8; x <= x1; x += .4) pts.push([x, mid + Math.sin((x - x0) / p * 2 * Math.PI) * h * .18 * (x > x1 - h ? (x1 - x) / h : 1)]);
        out.push(hair(pts, 'a', { w: .6, start: 'cut', end: 'taper' })); }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u) {
      const out = [];
      if (rank < 2) { const R = u * .85; out.push(hair(arc([cx, y + u * .2], R, Math.PI, 2 * Math.PI, 28), 'a', { w: 1, start: 'taper', end: 'taper' }), bead([cx, y], u * .16, 'a')); return out; }
      const W = Math.min(measure * .5, u * 22), g = u * .4;   // the coda sign, then double bars with repeat dots and a staff out to each side
      out.push(hair(arc([cx, y], u * .7, 0, 2 * Math.PI, 36), 'b', { w: .9, start: 'cut', end: 'cut' }), line([[cx, y - u * 1.2], [cx, y + u * 1.2]], 'b', .6), line([[cx - u * 1.2, y], [cx + u * 1.2, y]], 'b', .6));
      for (const s of [-1, 1]) { const a = cx + s * u * 2, b = cx + s * W / 2;
        [-g, 0, g].forEach(dy => out.push(line([[a, y + dy * 1.6], [b, y + dy * 1.6]], 'a', .38)));
        out.push(line([[a, y - g * 1.6], [a, y + g * 1.6]], 'a', .5), { col: 'a', broad: 1, nib: 0, w: u * .32, load: 1, dry: 0, swell: 0, start: 'cut', end: 'cut', pts: [[a + s * u * .35, y - g * 1.6], [a + s * u * .35, y + g * 1.6]] });
        if (rich >= .25) out.push(bead([a - s * u * .4, y - g * .8], u * .12, 'a'), bead([a - s * u * .4, y + g * .8], u * .12, 'a')); }
      return out; } },

  // ---- Blueprint: the technical drawing (cyanotype ground, white line): dimension lines with arrows, centre lines,
  // section hatching; section markers between chapters and a title block between books
  blueprint: { label: 'Blueprint', pair: ['white', 'cyan'], alternate: false, minGap: 1.4,
    theme: { dark: true, ground: [22, 62, 128], text: 'rgb(226 236 248)', rubric: 'rgb(30 66 140)', rubricDark: 'rgb(214 228 250)', groundRubric: 'rgb(255 255 255)' },
    ink: { white: { solid: [30, 66, 140], hair: [36, 72, 146] }, cyan: { solid: [80, 128, 196], hair: [80, 128, 196] } },   // on paper: the blue-line print
    inkDark: { white: { solid: [236, 244, 255], hair: [228, 238, 252] }, cyan: { solid: [150, 210, 255], hair: [150, 210, 255] } },
    setup: seed => { const r = stream(seed, 'bp'); return { kinds: pickKinds(r, ['dim', 'centre', 'hatch'], 2), p: .85 + r() * .3 }; },
    kinds: (v, rich) => rich < .25 ? ['centre'] : v.kinds,
    paraph(x, base, u, seed, rich) {   // a section marker: a circle halved, an arrow off it
      const c = [x + u * .55, base - u * .6], R = u * .5, out = [];
      out.push(hair(arc(c, R, 0, 2 * Math.PI, 32), 'a', { w: .6, start: 'cut', end: 'cut' }), line([[c[0] - R, c[1]], [c[0] + R, c[1]]], 'a', .5));
      out.push({ col: 'a', broad: 0, w: u * .32, load: 1, start: 'taper', end: 'cut', pts: [[c[0] + R * 1.05, c[1] + R * .55], [c[0] + R * 1.7, c[1] + R * .55]] });
      if (rich >= .5) out.push(line([[c[0] - R * 1.6, c[1] - R * 1.2], [c[0] - R * 1.6, c[1] + R * 1.2]], 'b', .4));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
      if (kind === 'dim') {   // a dimension: extension lines, the line with an arrow at each end, a break for the figure
        out.push(line([[x0 + h * .1, yTop], [x0 + h * .1, yBase]], 'b', .4), line([[x1 - .3, yTop], [x1 - .3, yBase]], 'b', .4));
        const m = (x0 + x1) / 2, gap = Math.min((x1 - x0) * .2, h * 1.6);
        out.push(line([[x0 + h * .1, mid], [m - gap / 2, mid]], 'a', .5), line([[m + gap / 2, mid], [x1 - .3, mid]], 'a', .5), arrowHead([x0 + h * .1, mid], Math.PI, h * .4, 'a', .5), arrowHead([x1 - .3, mid], 0, h * .4, 'a', .5));
        if (rich >= .25) for (let k = 0; k < 3; k++) out.push(line([[m - gap * .3 + k * gap * .3 - h * .1, mid + h * .25], [m - gap * .3 + k * gap * .3 + h * .1, mid - h * .25]], 'a', .45)); }
      else if (kind === 'centre') { let x = x0; const L = h * 2.4 * v.p; while (x < x1 - .5) { const e = Math.min(x1, x + L); out.push(line([[x, mid], [e, mid]], 'a', .45)); x = e + h * .3; if (x < x1 - h * .5) out.push(line([[x, mid], [x + h * .2, mid]], 'a', .45)); x += h * .5; } }
      else { const { n, p } = fitN(x1 - x0, h * .45 * v.p); out.push(line([[x0, yTop + h * .05], [x1, yTop + h * .05]], 'a', .5), line([[x0, yBase - h * .05], [x1, yBase - h * .05]], 'a', .5));
        for (let k = 0; k < n; k++) out.push(line([[x0 + k * p, yBase - h * .05], [x0 + k * p + p * .9, yTop + h * .05]], 'b', .4)); }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u) {
      const out = [];
      if (rank < 2) { const W = Math.min(measure * .4, u * 16);   // section A–A: a long-dash-dot line between two markers
        for (const s of [-1, 1]) { const c = [cx + s * W / 2, y], R = u * .5; out.push(hair(arc(c, R, 0, 2 * Math.PI, 28), 'a', { w: .55, start: 'cut', end: 'cut' }), line([[c[0] - R, c[1]], [c[0] + R, c[1]]], 'a', .45), { col: 'a', broad: 0, w: u * .3, load: 1, start: 'taper', end: 'cut', pts: [[c[0], c[1] + R * 1.1], [c[0], c[1] + R * 1.9]] }); }
        let x = cx - W / 2 + u * .8; while (x < cx + W / 2 - u * .8) { const e = Math.min(cx + W / 2 - u * .8, x + u * 1.6); out.push(line([[x, y], [e, y]], 'b', .4)); x = e + u * .35; if (x < cx + W / 2 - u) out.push(line([[x, y], [x + u * .2, y]], 'b', .4)); x += u * .55; }
        return out; }
      const W = Math.min(measure * .46, u * 20), H = u * 2.6, x0 = cx - W / 2, y0 = y - H / 2;   // a title block
      out.push(line([[x0, y0], [x0 + W, y0], [x0 + W, y0 + H], [x0, y0 + H], [x0, y0]], 'a', .7));
      out.push(line([[x0, y0 + H * .55], [x0 + W, y0 + H * .55]], 'a', .45), line([[x0 + W * .62, y0], [x0 + W * .62, y0 + H]], 'a', .45), line([[x0 + W * .62, y0 + H * .28], [x0 + W, y0 + H * .28]], 'a', .4));
      if (rich >= .25) for (let k = 0; k < 4; k++) out.push(line([[x0 + u * .6, y0 + H * .75 + (k % 2) * u * .4], [x0 + W * (.25 + k * .09), y0 + H * .75 + (k % 2) * u * .4]], 'b', .4));
      if (rich >= .5) out.push(hair(arc([x0 + W * .81, y0 + H * .68], u * .5, 0, 2 * Math.PI, 24), 'b', { w: .45, start: 'cut', end: 'cut' }), line([[x0 + W * .81 - u * .7, y0 + H * .68], [x0 + W * .81 + u * .7, y0 + H * .68]], 'b', .4));
      return out; } },
});

// ==== the grammar: every instance its own ======================================================================================
// A rubricator never made two fillers alike. This wraps a style so that each mark is composed per instance from
// parameters drawn by its position (the seed it is given): the pattern's period and the band it fills, a lead before
// it, the terminal at each end (none, a point, a hook, a curl, a tick) and its colour; a paraph's size and lean; a
// break's span. And per copy, the hand's habits: which terminals this scribe favours, how much lead it leaves, how
// tall it draws its fillers. The style itself decides what the marks are; the grammar how this hand varies them.
const TERMS = ['none', 'bead', 'hook', 'curl', 'tick'];
const pickW = (r, w) => { let s = r() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) if ((s -= w[i]) <= 0) return i; return w.length - 1; };
const terminal = (kind, p, dir, h, col) => {   // dir: +1 a terminal at the right end facing right, -1 at the left end
  if (kind === 'bead') return [bead([p[0] + dir * h * .25, p[1]], Math.max(.7, h * .13), col)];
  if (kind === 'hook') return [hair(hook([p[0], p[1]], dir > 0 ? 0 : Math.PI, h * .32, -dir), col, { w: .5, end: 'ball' })];
  if (kind === 'curl') return [hair(tendril([p[0], p[1]], dir > 0 ? 0 : Math.PI, h * 1.6, .2 / h, 3 / h, 1.4, .25).map(([x, y]) => [x, y]), col, { w: .5, end: 'ball' })];
  if (kind === 'tick') return [line([[p[0] + dir * h * .2, p[1] - h * .3], [p[0] + dir * h * .2, p[1] + h * .3]], col, .55, { start: 'taper', end: 'taper' })];
  return [];
};
export function grammar(style) {
  return { ...style,
    setup(seed) { const v = style.setup(seed), r = stream(seed, 'habit');
      v.terms = TERMS.map((_, i) => i === 0 ? 2 + r() * 3 : r() * r() * 3 * (style.terms?.[i] ?? 1));   // this hand's taste in terminals
      v.lead = r() * .35; v.band = .9 + r() * .2; v.lean = (r() - .5) * .08; return v; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'gram'), h = yBase - yTop, mid = (yTop + yBase) / 2, k = .82 + r() * .4, band = Math.min(1.15, v.band * (.9 + r() * .2));
      const lead = r() * v.lead * h, t0s = TERMS[pickW(r, v.terms)], t0 = rich >= .25 && (t0s === 'bead' || t0s === 'tick') ? t0s : 'none', t1 = rich >= .5 ? TERMS[pickW(r, v.terms)] : 'none';
      const room = x1 - x0 - lead, s0 = t0 === 'none' ? 0 : h * (t0 === 'curl' ? 1.1 : .6), s1 = t1 === 'none' ? 0 : h * (t1 === 'curl' ? 1.1 : .6);
      if (room - s0 - s1 < h * 1.4) return style.filler(x0, x1, yTop, yBase, kind, seed, rich, { ...v, p: (v.p ?? 1) * k });
      const a = x0 + lead + s0, b = x1 - s1, bh = h * band / 2, colT = r() < .5 ? 'a' : 'b';
      const body = style.filler(a, b, mid - bh, mid + bh, kind, seed, Math.max(0, Math.min(1, rich + (r() - .5) * .3)), { ...v, p: (v.p ?? 1) * k });
      // the terminals sit on the pattern's own line: they join it, they do not float
      return [...terminal(t0, [a, mid], -1, h, colT), ...body, ...terminal(t1, [b, mid], 1, h, colT)];
    },
    // and the effort varies: each instance is made a little richer or plainer than the page's budget
    paraph(x, base, u, seed, rich, v) { const r = stream(seed, 'gp'), s = .9 + r() * .2, lean = v.lean + (r() - .5) * .06, ri = Math.max(0, Math.min(1, rich + (r() - .5) * .5));
      return style.paraph(x, base, u * s, seed, ri, v).map(m => { const f = ([px, py]) => { const dx = px - x, dy = py - base; return [x + dx + dy * -lean, base + dy]; };
        return m.dot ? { ...m, p: f(m.p) } : { ...m, pts: m.pts.map(f) }; }); },
    breakMark(cx, y, measure, rank, seed, rich, u, v) { const r = stream(seed, 'gb'); return style.breakMark(cx, y, measure * (style.flush ? 1 : .86 + r() * .26), rank, seed, rich, u * (.94 + r() * .12), v); },   // a flush-left style keeps the measure exactly
  };
}


// ==== light and dark ==========================================================================================================
// The palette a style draws with on the host's ground. Light: the style's own inks. Dark: its designed dark inks where
// it has them; otherwise each pigment lifted in value with its hue kept (vermilion stays vermilion, lapis lapis), and
// black or brown ink becomes the warm light ink of a dark page. Never an inversion.
const hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; };
const rgbOf = ([h, s, l]) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [r, g, b].map(v => Math.round((v + m) * 255)); };
export const lift = rgb => { const [h, s, l] = hsl(rgb); if (l < .26 || s < .18) return [226, 216, 200]; return rgbOf([h, Math.min(.9, s * .92), Math.max(l, .64)]); };
export function paletteOf(style, mode, ownGround = false) {
  if (ownGround && style.theme?.dark) return style.inkDark ?? style.ink;
  if (mode !== 'dark') return style.ink;
  const out = {}; for (const [k, v] of Object.entries(style.ink)) out[k] = style.inkDark?.[k] ?? { solid: lift(v.solid), hair: lift(v.hair) };
  return out;
}

// ==== occult ====================================================================================================================
// After the grimoires and alchemical books: Agrippa, De occulta philosophia (1533; the planetary kameas and their seals),
// John Dee, Monas Hieroglyphica (1564), Khunrath's Amphitheatrum (1595), the Ripley Scroll (Wellcome MS 692) and the
// Key of Solomon manuscripts: red and black ink, planetary and alchemical signs, sigils drawn on the kamea, magic
// circles, the ouroboros. Named from those works; not studied from scans in this session.
// Safety by construction: a sigil must have at least four points and both a level and an upright move, and may not
// make two diagonals in turn that zig back (the shape that can read as a Sowilo or double-sig rune); no sign here is
// four-armed or hooked in rotation.
const glyph = (kind, c, s, col, w = .65) => {   // the planetary and alchemical signs as a pen makes them; s is about half their height
  const o = { w, start: 'cut', end: 'cut' }, ring = (cc, R) => hair(arc(cc, R, 0, 2 * Math.PI, 28), col, o), cross = (top, L) => [line([[top[0], top[1]], [top[0], top[1] + L]], col, w), line([[top[0] - L * .4, top[1] + L * .45], [top[0] + L * .4, top[1] + L * .45]], col, w)];
  const [x, y] = c;
  if (kind === 'sun') return [ring(c, s * .62), bead(c, Math.max(.6, s * .14), col)];
  if (kind === 'moon') return [hair([...arc([x, y], s * .7, -Math.PI * .62, Math.PI * .62, 18), ...arc([x + s * .32, y], s * .52, Math.PI * .5, -Math.PI * .5, 16)], col, o)];
  if (kind === 'venus') return [ring([x, y - s * .35], s * .45), ...cross([x, y + s * .1], s * .9)];
  if (kind === 'mercury') return [ring([x, y - s * .2], s * .38), hair(arc([x, y - s * .8], s * .36, Math.PI * .15, Math.PI * .85, 10), col, o), ...cross([x, y + s * .18], s * .78)];
  if (kind === 'mars') return [ring([x - s * .12, y + s * .15], s * .45), line([[x + s * .2, y - s * .17], [x + s * .62, y - s * .6]], col, w), line([[x + s * .28, y - s * .62], [x + s * .62, y - s * .6], [x + s * .6, y - s * .28]], col, w)];
  if (kind === 'jupiter') return [hair([[x - s * .5, y - s * .45], ...arc([x - s * .15, y - s * .45], s * .36, Math.PI, Math.PI * 2.1, 10), [x - s * .55, y + s * .25], [x + s * .55, y + s * .25]], col, o), line([[x + s * .25, y - s * .7], [x + s * .25, y + s * .8]], col, w)];
  if (kind === 'saturn') return [line([[x - s * .2, y - s * .85], [x - s * .2, y + s * .35]], col, w), line([[x - s * .5, y - s * .5], [x + s * .1, y - s * .5]], col, w), hair([[x - s * .2, y - s * .05], ...arc([x + s * .12, y + s * .05], s * .32, -Math.PI * .85, Math.PI * .3, 10), [x + s * .1, y + s * .75]], col, { ...o, end: 'taper' })];
  if (kind === 'sulphur') return [line([[x - s * .5, y], [x, y - s * .8], [x + s * .5, y], [x - s * .5, y]], col, w), ...cross([x, y], s * .8)];
  return [ring(c, s * .55), line([[x - s * .55, y], [x + s * .55, y]], col, w)];   // salt
};
const SIGNS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'sulphur', 'salt'];
// a sigil on the 3×3 kamea: a path of cells from a seeded word, a small circle where it starts, a bar where it ends
function sigil(x0, y0, W, H, r, col) {
  for (let tries = 0; tries < 40; tries++) {
    const n = 4 + ((r() * 3) | 0), cells = []; while (cells.length < n) { const c = (r() * 9) | 0; if (c !== cells.at(-1)) cells.push(c); }
    const P = cells.map(c => [x0 + (c % 3) / 2 * W, y0 + ((c / 3) | 0) / 2 * H]), d = P.slice(1).map((p, i) => [Math.sign(Math.round(p[0] - P[i][0])), Math.sign(Math.round(p[1] - P[i][1]))]);
    const level = d.some(v => v[1] === 0), upright = d.some(v => v[0] === 0), diag = v => v[0] && v[1], same = (a, b) => a[0] === b[0] && a[1] === b[1];
    const zig = d.some((v, i) => i && diag(v) && diag(d[i - 1]) && v[0] !== d[i - 1][0]);
    // no Z, N or ϟ in three strokes (two of them side by side can read as the double-sig rune; a Z or N with a bar
    // as the Wolfsangel): a stroke, a turn, and the first stroke again
    const zed = d.some((v, i) => i > 1 && same(v, d[i - 2]) && !same(v, d[i - 1]) && (diag(v) !== !!diag(d[i - 1])));
    if (!level || !upright || zig || zed) continue;
    const a = P[0], b = P.at(-1), e = d.at(-1), nrm = [-e[1], e[0]], L = Math.min(W, H) * .18, l = Math.hypot(...nrm) || 1;
    return [hair(arc(a, Math.min(W, H) * .1, 0, 2 * Math.PI, 14), col, { w: .5, start: 'cut', end: 'cut' }), line(P, col, .55, { start: 'cut', end: 'cut' }),
      line([[b[0] - nrm[0] / l * L, b[1] - nrm[1] / l * L], [b[0] + nrm[0] / l * L, b[1] + nrm[1] / l * L]], col, .55, { start: 'taper', end: 'taper' })];
  }
  return [];
}
STYLES.occult = { label: 'Occult', pair: ['red', 'black'], alternate: true, minGap: 1.5, theme: { rubric: 'rgb(160 26 20)', rubricDark: 'rgb(228 92 76)' },
  ink: { red: { solid: [172, 30, 22], hair: [176, 40, 30] }, black: { solid: [30, 24, 20], hair: [36, 30, 26] } },
  inkDark: { red: { solid: [230, 92, 74], hair: [226, 100, 84] }, black: { solid: [224, 214, 198], hair: [214, 204, 188] } },
  setup: seed => { const r = stream(seed, 'occult'); return { kinds: pickKinds(r, ['signs', 'sigils'], 1), p: .9 + r() * .3, favour: SIGNS.filter(() => r() < .6), book: r() < .5 ? 'ouro' : 'monas' }; },
  kinds: (v, rich) => rich < .25 ? ['signs'] : rich >= .5 ? ['signs', 'sigils'] : v.kinds,
  paraph(x, base, u, seed, rich, v) { const r = stream(seed, 'op'), pool = v.favour.length > 2 ? v.favour : SIGNS, k = pool[(r() * pool.length) | 0], c = [x + u * .7, base - u * .62];
    const out = glyph(k, c, u * .78, 'a', .75);
    if (rich >= .5) out.push(bead([c[0] + u * .95, c[1] - u * .55], .7, 'b'), bead([c[0] + u * .95, c[1] + u * .25], .7, 'b'));
    return out; },
  filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
    const r = stream(seed, 'of'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
    if (kind === 'signs') {   // signs strung on a ruled line, each standing on it
      const { n, p } = fitN(x1 - x0, h * 2.1 * v.p), y = yBase - h * .05; out.push(line([[x0, y], [x1, y]], 'b', .45, { start: 'taper' }));
      for (let k = 0; k < n; k++) out.push(...glyph(SIGNS[(r() * SIGNS.length) | 0], [x0 + (k + .5) * p, mid - h * .1], h * .45, k % 2 && rich >= .5 ? 'b' : 'a', .5));
    } else {   // sigils, each on its own kamea, joined by a ruled hairline
      const { n, p } = fitN(x1 - x0, h * 2.4 * v.p); out.push(line([[x0, mid], [x1, mid]], 'b', .35, { start: 'taper', end: 'taper' }));
      for (let k = 0; k < n; k++) out.push(...sigil(x0 + k * p + p * .18, yTop + h * .05, p * .64, h * .9, r, 'a'));
    }
    return out; },
  breakMark(cx, y, measure, rank, seed, rich, u, v) {
    const r = stream(seed, 'ob'), out = [];
    if (rank < 2) {   // a magic circle: rings (two or three), a band of lettering between them (ticks, points, small signs,
      // or little sigil-letters), and at its heart a seal (a sigil, a sign, or a triangle with a sign in it); each its own
      const R = u * (2.2 + r() * .5), rings = 2 + (r() < .45 ? 1 : 0), band = ['ticks', 'signs', 'letters'][(r() * 3) | 0], heart = ['sigil', 'sign', 'triangle'][(r() * 3) | 0];
      for (let k = 0; k < rings; k++) out.push(hair(arc([cx, y], R * (1 - k * .2), r() * 6, r() * 6 + 2 * Math.PI + .02, 56), k ? 'b' : 'a', { w: k ? .45 : .6, start: 'cut', end: 'cut' }));
      const bR = R * .9 - (rings > 2 ? R * .1 : 0), n = Math.round((rich >= .5 ? 14 : 10) * (band === 'signs' ? .6 : 1));
      for (let k = 0; k < n; k++) { const a = k / n * 2 * Math.PI + r() * .08, c = [cx + Math.cos(a) * bR, y + Math.sin(a) * bR], t = [-Math.sin(a), Math.cos(a)];
        if (band === 'signs') out.push(...glyph(SIGNS[(r() * SIGNS.length) | 0], c, u * .26, k % 2 ? 'a' : 'b', .45));
        else if (band === 'letters') { const L = u * .2, pts = [[c[0] - t[0] * L, c[1] - t[1] * L], [c[0] + Math.cos(a) * L * (r() - .5) * 2, c[1] + Math.sin(a) * L * (r() - .5) * 2], [c[0] + t[0] * L, c[1] + t[1] * L]]; out.push(line(pts, 'a', .45)); }
        else out.push(k % 3 === 0 ? bead(c, .75, 'a') : line([[c[0] - Math.cos(a) * u * .16, c[1] - Math.sin(a) * u * .16], [c[0] + Math.cos(a) * u * .16, c[1] + Math.sin(a) * u * .16]], 'a', .5)); }
      const iR = R * (rings > 2 ? .5 : .62);
      if (heart === 'sigil') out.push(...sigil(cx - iR * .7, y - iR * .7, iR * 1.4, iR * 1.4, r, 'a'));
      else if (heart === 'sign') out.push(...glyph(SIGNS[(r() * SIGNS.length) | 0], [cx, y], iR * .8, 'a', .7));
      else { out.push(line([[cx, y - iR * .85], [cx + iR * .75, y + iR * .45], [cx - iR * .75, y + iR * .45], [cx, y - iR * .85]], 'b', .55)); out.push(...glyph(SIGNS[(r() * SIGNS.length) | 0], [cx, y + iR * .08], iR * .38, 'a', .5)); }
      if (rich >= .25) for (const s of [-1, 1]) out.push(line([[cx + s * (R + u * .5), y], [cx + s * (R + u * (3 + r() * 2)), y]], 'b', .45, { start: s > 0 ? 'cut' : 'taper', end: s > 0 ? 'taper' : 'cut' }));
      return out; }
    const W = Math.min(measure * .5, u * 22);
    if (v.book === 'ouro') {   // the ouroboros: a body swelling and thinning round the circle, its head taking its tail
      const R = u * 1.9, body = arc([cx, y], R, -Math.PI / 2 + .35, Math.PI * 1.5 - .05, 60);
      out.push({ col: 'a', broad: 0, w: u * .42, load: 1.05, dry: .1, swell: .1, start: 'taper', end: 'cut', pts: body });
      const hd = [cx + Math.cos(-Math.PI / 2 + .2) * R, y + Math.sin(-Math.PI / 2 + .2) * R];
      out.push(hair(arc(hd, u * .38, 0, 2 * Math.PI, 18), 'a', { w: .6, start: 'cut', end: 'cut' }), bead([hd[0] + u * .12, hd[1] - u * .1], .55, 'b'));
      out.push(...glyph('sun', [cx, y], u * .7, 'b', .55));
    } else {   // Dee's Monas: the moon's horns over the sun, the cross below, the twin arcs of Aries at the foot
      const c = [cx, y - u * .2]; out.push(...glyph('sun', c, u * .9, 'a', .7), hair(arc([cx, c[1] - u * 1.05], u * .62, Math.PI * .1, Math.PI * .9, 14), 'a', { w: .7, start: 'taper', end: 'taper' }));
      out.push(line([[cx, c[1] + u * .6], [cx, c[1] + u * 2.2]], 'a', .7), line([[cx - u * .55, c[1] + u * 1.2], [cx + u * .55, c[1] + u * 1.2]], 'a', .7));
      for (const s of [-1, 1]) out.push(hair(arc([cx + s * u * .32, c[1] + u * 2.45], u * .32, s > 0 ? Math.PI : 0, s > 0 ? Math.PI * 2 : -Math.PI, 10).filter(q => q[1] >= c[1] + u * 2.2), 'a', { w: .6, start: 'cut', end: 'taper' }));
    }
    if (rich >= .25) for (const s of [-1, 1]) { const a = cx + s * u * 2.8, b = cx + s * W / 2; out.push(line([[a, y], [b, y]], 'b', .45, { start: 'cut', end: 'taper' }));
      if (rich >= .5) for (let k = 1; k <= 2; k++) out.push(...glyph(SIGNS[(r() * SIGNS.length) | 0], [a + s * (b - a) * k / 3, y - u * .45], u * .32, 'a', .45)); }
    return out; } };


// ==== batch two: Kelmscott, copperplate, Art Nouveau, botanical field notes ==================================================
// a whiplash: an S whose curvature runs one way, through nothing, and tightens the other way into a curl (the coup de fouet)
const whip = (p, h, L, k, sense = 1) => tendril(p, h, L, -sense * k * .35, sense * k, 2.2, .4);
// a heart-shaped leaf as Morris drew the hedera: two lobes laid solid with the pen, a curled stalk
const hedera = (c, s, dir, col, r) => { const out = [], t = [Math.cos(dir), Math.sin(dir)], n = [-t[1], t[0]], P = (a, b) => [c[0] + t[0] * a + n[0] * b, c[1] + t[1] * a + n[1] * b];
  // the leaf solid: a broad midrib from the notch to the point, and a lobe swelling each side of it, so no paper shows
  out.push({ col, broad: .05, w: s * .62, load: 1.1, dry: .05, swell: .1, start: 'cut', end: 'taper', pts: [P(-s * .35, 0), P(s * .1, 0), P(s * .7, 0)] });
  for (const sd of [-1, 1]) out.push({ col, broad: .05, w: s * .46, load: 1.1, dry: .05, swell: .1, start: 'taper', end: 'taper', pts: [P(-s * .46, sd * s * .14), P(-s * .28, sd * s * .36), P(s * .2, sd * s * .26), P(s * .62, sd * s * .03)] });
  out.push(hair([P(-s * .5, 0), P(-s * .9, s * .1), ...tendril(P(-s * .9, s * .1), dir + Math.PI + .3, s * 1.1, 0, 2.6 / s, 1.4, .25).slice(1)], col, { w: .5, start: 'cut', end: 'ball' }));
  return out; };
Object.assign(STYLES, {
  // ---- Kelmscott: William Morris's Kelmscott Press (1891–98; the Chaucer, 1896): black and red, the vine borders
  // brought into the line, the hedera leaf for the paragraph
  kelmscott: { label: 'Kelmscott', pair: ['red', 'black'], alternate: false, minGap: 1.4, theme: { rubric: 'rgb(172 36 28)', rubricDark: 'rgb(226 104 86)' },
    ink: { red: { solid: [174, 34, 26], hair: [180, 44, 34] }, black: { solid: [26, 22, 20], hair: [30, 26, 22] } },
    inkDark: { red: { solid: [228, 98, 80], hair: [224, 108, 92] }, black: { solid: [226, 216, 200], hair: [216, 206, 190] } },
    setup: seed => { const r = stream(seed, 'kelm'); return { kinds: pickKinds(r, ['vine', 'berries', 'leaves'], 2), p: .85 + r() * .3 }; },
    kinds: (v, rich) => rich < .25 ? ['leaves'] : v.kinds,
    paraph: (x, base, u, seed, rich) => { const r = stream(seed, 'kp'); return hedera([x + u * .85, base - u * .6], u * .85, .85 + (r() - .5) * .3, 'a', r); },   // the hedera, pointing down and on
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'kf'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [], { n, p } = fitN(x1 - x0, h * 2 * v.p), st = [];
      if (kind === 'leaves') { for (let k = 0; k < n; k++) out.push(...hedera([x0 + (k + .5) * p, mid], h * .5, (k % 2 ? .25 : -.25), k % 2 ? 'a' : 'b', r)); return out; }
      for (let x = x0; x <= x1 + .01; x += .6) st.push([x, mid + Math.sin((x - x0) / p * 2 * Math.PI) * h * .22]);
      out.push(hair(st, 'b', { w: .55, start: 'taper', end: 'cut' }));
      for (let k = 0; k < n * 2; k++) { const px = x0 + (k + .5) * p / 2, py = mid + Math.sin((px - x0) / p * 2 * Math.PI) * h * .22, up = k % 2 ? 1 : -1;
        if (kind === 'berries' && k % 2) { for (const [dx, dy] of [[0, 0], [h * .18, h * .1], [-h * .16, h * .12]]) out.push(bead([px + dx, py + up * h * .28 + dy * up], h * .1, 'a')); }
        else out.push({ col: 'a', broad: .05, w: h * .3, load: 1.1, dry: .05, swell: .1, start: 'taper', end: 'taper', pts: [[px, py], [px + h * .25, py + up * h * .28], [px + h * .5, py + up * h * .3]] }); }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u) {
      const r = stream(seed, 'kb'), out = [];
      if (rank < 2) { out.push(...hedera([cx, y], u * 1.1, (r() - .5) * .2, 'a', r)); if (rich >= .5) out.push(...hedera([cx - u * 2.6, y + u * .2], u * .6, Math.PI + .2, 'b', r), ...hedera([cx + u * 2.6, y + u * .2], u * .6, -.2, 'b', r)); return out; }
      const W = Math.min(measure * .5, u * 24);   // a vine from a rose: scrolls each way, leaves laid solid, the rose at the heart
      for (const s of [-1, 1]) { const st = []; for (let d = u * 1.2; d <= W / 2; d += .7) st.push([cx + s * d, y + Math.sin(d / (u * 2.4)) * u * .55]);
        out.push(hair(st, 'b', { w: .6, start: 'cut', end: 'taper' }));
        for (let d = u * 2.2, k = 0; d < W / 2 - u; d += u * 2.4, k++) { const py = y + Math.sin(d / (u * 2.4)) * u * .55, up = k % 2 ? 1 : -1;
          out.push({ col: 'a', broad: .05, w: u * .55, load: 1.1, dry: .05, swell: .1, start: 'taper', end: 'taper', pts: [[cx + s * d, py], [cx + s * (d + u * .5), py + up * u * .6], [cx + s * (d + u * 1), py + up * u * .7]] }); } }
      for (let k = 0; k < 5; k++) { const a = k / 5 * 2 * Math.PI - Math.PI / 2; out.push({ col: 'a', broad: .05, w: u * .5, load: 1.1, dry: .05, swell: .1, start: 'taper', end: 'taper', pts: [[cx, y], [cx + Math.cos(a) * u * .45, y + Math.sin(a) * u * .45], [cx + Math.cos(a) * u * .8, y + Math.sin(a) * u * .8]] }); }
      out.push(bead([cx, y], u * .2, 'b'));
      return out; } },

  // ---- Copperplate: the nineteenth-century writing master (Platt Rogers Spencer, Spencerian Key to Practical Penmanship,
  // 1866; the "offhand flourishing" of the business colleges): one ink, a flexible nib swelling on the downstroke,
  // running ovals, loops, and for a book the flourished bird
  copperplate: { label: 'Copperplate', pair: ['ink', 'ink'], alternate: false, minGap: 1.4, theme: { rubric: 'rgb(44 36 30)', rubricDark: 'rgb(226 216 200)' },
    ink: { ink: { solid: [32, 26, 22], hair: [40, 32, 26] } }, inkDark: { ink: { solid: [228, 218, 202], hair: [218, 208, 192] } },
    setup: seed => { const r = stream(seed, 'copper'); return { kinds: pickKinds(r, ['ovals', 'loops', 'flourish'], 2), p: .85 + r() * .3, slant: .3 + r() * .15 }; },
    kinds: (v, rich) => rich < .25 ? ['flourish'] : v.kinds,
    paraph(x, base, u, seed, rich, v) {   // a capital stroke: an entry hairline, an oval, the shaded downstroke through it
      const r = stream(seed, 'cp'), c = [x + u * .8, base - u * .7], sl = v.slant, out = [];
      out.push(hair(arc(c, u * .6, Math.PI * .1, Math.PI * 2.05, 30).map(([a, b]) => [a + (c[1] - b) * sl * .5, b]), 'a', { w: .55, start: 'taper', end: 'taper' }));
      out.push({ col: 'a', broad: 0, w: u * .32, load: 1, dry: .1, swell: .3, start: 'taper', end: 'taper', pts: [[c[0] + u * 1.05 + u * .7 * sl, c[1] - u * .95], [c[0] + u * .66, c[1]], [c[0] + u * .3 - u * .2 * sl, base + u * .25]] });   // the shaded stem beside the oval, touching it
      if (rich >= .5) out.push(hair(tendril([c[0] + u * .3 - u * .2 * sl, base + u * .25], Math.PI * .75, u * 2.2, .5 / u, 3 / u, 1.3, .3), 'a', { w: .5, start: 'cut', end: 'ball' }));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'cf2'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [], sl = v.slant;
      if (kind === 'ovals') { const { n, p } = fitN(x1 - x0, h * .55 * v.p), pts = [];   // the running-oval drill: compressed, slanted
        for (let k = 0; k <= n * 24; k++) { const t = k / 24 * 2 * Math.PI, yy = mid - h * .4 * Math.cos(t); pts.push([x0 + k / 24 * p + h * .35 * Math.sin(t) + (mid - yy) * sl, yy]); }
        out.push(hair(pts.filter(q => q[0] >= x0 && q[0] <= x1), 'a', { w: .5, start: 'taper', end: 'taper' })); }
      else if (kind === 'loops') { const { n, p } = fitN(x1 - x0, h * 1.1 * v.p), pts = [];
        for (let k = 0; k <= n * 20; k++) { const t = k / 20 * 2 * Math.PI; pts.push([x0 + k / 20 * p - h * .4 * Math.sin(t) + h * .2 * sl, mid - h * .45 * Math.cos(t) + h * .1]); }
        out.push(hair(pts.filter(q => q[0] >= x0 && q[0] <= x1), 'a', { w: .55, start: 'taper', end: 'taper' })); }
      else { const L = x1 - x0 - h * 1.2, pts = []; for (let k = 0; k <= 60; k++) { const t = k / 60; pts.push([x0 + t * L, mid + Math.sin(t * Math.PI * 2) * h * .35 * (1 - t * .4)]); }   // a swelling S run out to a loop
        out.push({ col: 'a', broad: 0, w: h * .16, load: 1, dry: .1, swell: .3, start: 'taper', end: 'cut', pts }, hair(tendril(pts.at(-1), 0, h * 3.2, .3 / h, 2.6 / h, 1.3, .3), 'a', { w: .5, start: 'cut', end: 'ball' })); }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u, v) {
      const r = stream(seed, 'cb'), out = [], sl = v.slant;
      if (rank < 2) { for (const s of [-1, 1]) { const pts = []; for (let k = 0; k <= 50; k++) { const t = k / 50; pts.push([cx + s * (u * .5 + t * u * 6), y + Math.sin(t * Math.PI * 2) * u * .6 * (1 - t * .5)]); }
          out.push({ col: 'a', broad: 0, w: u * .2, load: 1, dry: .1, swell: .3, start: 'taper', end: 'cut', pts }, hair(tendril(pts.at(-1), s > 0 ? 0 : Math.PI, u * 3, .4 / u, 2.8 / u, 1.3, .3), 'a', { w: .5, start: 'cut', end: 'ball' })); }
        out.push(hair(arc([cx, y], u * .5, 0, 2 * Math.PI, 24), 'a', { w: .5, start: 'cut', end: 'cut' })); return out; }
      // the offhand bird: a shaded body, a head with its eye and beak, a wing of nested loops, a tail of swelling strokes
      const b = [cx, y], out2 = out;
      out2.push({ col: 'a', broad: 0, w: u * .35, load: 1, dry: .1, swell: .3, start: 'taper', end: 'taper', pts: arc([b[0], b[1]], u * 1.6, Math.PI * .95, Math.PI * 2.05, 30).map(([a, c]) => [a, b[1] + (c - b[1]) * .45]) });
      const hd = [b[0] + u * 1.9, b[1] - u * .55]; out2.push(hair(arc(hd, u * .45, 0, 2 * Math.PI, 20), 'a', { w: .55, start: 'cut', end: 'cut' }), bead([hd[0] + u * .12, hd[1] - u * .08], .6, 'a'), line([[hd[0] + u * .42, hd[1]], [hd[0] + u * .95, hd[1] + u * .12], [hd[0] + u * .42, hd[1] + u * .2]], 'a', .5));
      for (let k = 0; k < 3; k++) out2.push(hair(arc([b[0] - u * .2 + k * u * .25, b[1] - u * (1.3 + k * .35)], u * (1.3 - k * .25), Math.PI * .95, Math.PI * 1.9, 20).map(([a, c]) => [a + (b[1] - c) * sl * .4, c]), 'a', { w: .5, start: 'taper', end: 'taper' }));
      for (let k = 0; k < 3; k++) out2.push({ col: 'a', broad: 0, w: u * .22, load: 1, dry: .1, swell: .3, start: 'cut', end: 'taper', pts: [[b[0] - u * 1.5, b[1]], [b[0] - u * 3, b[1] + u * (.3 + k * .35)], [b[0] - u * 4.3 - k * u * .4, b[1] + u * (.2 + k * .6)]] });
      if (rich >= .5) for (const s of [-1, 1]) out2.push(hair(tendril([cx + s * u * 6, y + u * 1.3], s > 0 ? 0 : Math.PI, u * 4, .3 / u, 2.4 / u, 1.4, .3), 'a', { w: .5, start: 'taper', end: 'ball' }));
      return out2; } },

  // ---- Art Nouveau: the whiplash (coup de fouet) of Hector Guimard's Métro entrances (1900) and Mucha's Documents
  // décoratifs (1902): long curves that slacken and snap into a curl, buds, olive and gold
  nouveau: { label: 'Nouveau', pair: ['olive', 'gold'], alternate: false, minGap: 1.5, theme: { rubric: 'rgb(98 108 52)', rubricDark: 'rgb(178 190 118)' },
    ink: { olive: { solid: [86, 100, 48], hair: [92, 106, 54] }, gold: { solid: [176, 128, 46], hair: [170, 124, 44] } },
    inkDark: { olive: { solid: [168, 184, 108], hair: [160, 176, 104] }, gold: { solid: [212, 168, 86], hair: [204, 160, 80] } },
    setup: seed => { const r = stream(seed, 'nouveau'); return { kinds: pickKinds(r, ['whiplash', 'tendrils', 'buds'], 2), p: .85 + r() * .35, sense: r() < .5 ? 1 : -1 }; },
    kinds: (v, rich) => rich < .25 ? ['whiplash'] : v.kinds,
    paraph(x, base, u, seed, rich, v) { const r = stream(seed, 'np'), out = [];
      out.push(hair(whip([x + u * .2, base + u * .3], -Math.PI / 2 + .55, u * 3.8, 1.6 / u, 1), 'a', { w: .75, start: 'taper', end: 'ball' }));
      if (rich >= .5) out.push({ col: 'b', broad: .05, w: u * .45, load: 1.1, dry: .05, swell: .1, start: 'taper', end: 'taper', pts: [[x + u * .2, base - u * .4], [x + u * .7, base - u * .7], [x + u * 1.1, base - u * .55]] });
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'nf'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [];
      if (kind === 'whiplash') { const L = x1 - x0 - h * 1.6, pts = []; for (let k = 0; k <= 90; k++) { const t = k / 90, e = Math.pow(t, 1.6); pts.push([x0 + t * L, mid + v.sense * h * .5 * Math.sin(e * Math.PI * 2.2) * (1 - t * .3)]); }
        const a = Math.atan2(pts.at(-1)[1] - pts.at(-3)[1], pts.at(-1)[0] - pts.at(-3)[0]);
        out.push(hair([...pts, ...tendril(pts.at(-1), a, h * 3, .3 / h, 4.2 / h * (Math.sin(Math.PI * 2.2) > 0 ? -v.sense : v.sense), 1.3, .3).slice(1)], 'a', { w: .7, start: 'taper', end: 'ball' })); }
      else if (kind === 'tendrils') { for (let k = 0; k < 3; k++) { const pts = []; for (let x = x0 + k * h * .6; x <= x1 - h * (1.2 - k * .3); x += .6) { const t = (x - x0) / (x1 - x0); pts.push([x, mid + (k - 1) * h * .28 * (1 - t * .7) + Math.sin(t * Math.PI * 1.5) * h * .1]); }   // they draw together but never touch
          out.push(hair(pts, k === 1 ? 'a' : 'b', { w: .5, start: 'taper', end: k === 1 ? 'ball' : 'taper' })); } }
      else { const { n, p } = fitN(x1 - x0, h * 2.6 * v.p); for (let k = 0; k < n; k++) { const a = [x0 + k * p + h * .2, yBase], c = [x0 + (k + .7) * p, yTop + h * .1];
          out.push(hair([a, [a[0] + p * .25, mid + h * .25], [c[0] - p * .1, c[1] + h * .3], c], 'a', { w: .55, start: 'taper', end: 'cut' }), { col: 'b', broad: .05, w: h * .35, load: 1.1, dry: .05, swell: .1, start: 'taper', end: 'taper', pts: [[c[0] - h * .05, c[1] + h * .05], [c[0] + h * .1, c[1] - h * .1], [c[0] + h * .25, c[1] - h * .15]] }); } }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u, v) {
      const out = [];
      if (rank < 2) { for (const s of [-1, 1]) out.push(hair(whip([cx + s * u * .4, y + u * .2], s > 0 ? -.15 : Math.PI + .15, u * 5, 1 / u, s), 'a', { w: .65, start: 'taper', end: 'ball' }));
        out.push({ col: 'b', broad: .05, w: u * .5, load: 1.1, dry: .05, swell: .1, start: 'taper', end: 'taper', pts: [[cx, y + u * .2], [cx, y - u * .4], [cx, y - u * .9]] }); return out; }
      // Guimard: two whiplash stems rising from a root, leaning out, curling back; a bud at the top; leaves at the root
      for (const s of [-1, 1]) { out.push(hair(whip([cx + s * u * .3, y + u * 1.2], -Math.PI / 2 + s * .5, u * 10, .55 / u, -s), 'a', { w: .8, start: 'taper', end: 'ball' }));
        out.push({ col: 'b', broad: .05, w: u * .6, load: 1.1, dry: .05, swell: .1, start: 'taper', end: 'taper', pts: [[cx, y + u * 1.2], [cx + s * u * 1.2, y + u * .9], [cx + s * u * 2.2, y + u * 1.1]] });
        if (rich >= .5) out.push(hair(whip([cx + s * u * 2.6, y + u * 1.2], s > 0 ? -.1 : Math.PI + .1, u * 8, .6 / u, s), 'b', { w: .55, start: 'taper', end: 'ball' })); }
      out.push(hair(arc([cx, y - u * 1.1], u * .55, 0, 2 * Math.PI, 24).map(([a, b]) => [a, y - u * 1.1 + (b - y + u * 1.1) * 1.5]), 'b', { w: .6, start: 'cut', end: 'cut' }));
      return out; } },

  // ---- Field notes: the botanist's notebook (the herbarium sheet and its tied label; Kew and the Smithsonian field
  // books): graphite and a red pencil, a sketched leaf with its veins, a scale in millimetres, the specimen tag on its string
  botanical: { label: 'Field notes', pair: ['graphite', 'redpencil'], alternate: false, minGap: 1.5,
    ink: { graphite: { solid: [86, 86, 92], hair: [96, 96, 102] }, redpencil: { solid: [178, 64, 52], hair: [182, 74, 62] } },
    inkDark: { graphite: { solid: [196, 196, 202], hair: [184, 184, 190] }, redpencil: { solid: [226, 120, 104], hair: [222, 128, 112] } },
    setup: seed => { const r = stream(seed, 'bot'); return { kinds: pickKinds(r, ['stem', 'scale', 'tag'], 2), p: .85 + r() * .3 }; },
    kinds: (v, rich) => rich < .25 ? ['stem'] : v.kinds,
    paraph(x, base, u, seed, rich) {   // a leaf sketched: its outline, a midrib, a few veins
      const r = stream(seed, 'bp2'), c = [x + u * .75, base - u * .6], a = -.6 + (r() - .5) * .4, t = [Math.cos(a), Math.sin(a)], n = [-t[1], t[0]], L = u * 1.1, W = u * .45, P = (s, q) => [c[0] + t[0] * s + n[0] * q, c[1] + t[1] * s + n[1] * q], o = { w: .5, load: .65, start: 'taper', end: 'taper' };
      const side = sg => Array.from({ length: 13 }, (_, k) => { const s = -L + 2 * L * k / 12; return P(s, sg * W * Math.sin((k / 12) * Math.PI) ** .8); });
      const out = [hair(wob(side(1), .08, seed), 'a', o), hair(wob(side(-1), .08, seed + 1), 'a', o), hair([P(-L * 1.4, 0), P(L * .95, 0)], 'a', { ...o, w: .45 })];
      for (let k = 1; k <= (rich >= .5 ? 3 : 2); k++) for (const sg of [-1, 1]) out.push(hair([P(-L + k * L * .5, 0), P(-L + k * L * .5 + L * .3, sg * W * .7)], 'a', { ...o, w: .38 }));
      return out; },
    filler(x0, x1, yTop, yBase, kind, seed, rich, v) {
      const r = stream(seed, 'bf'), h = yBase - yTop, mid = (yTop + yBase) / 2, out = [], o = { w: .5, load: .65, start: 'taper', end: 'taper' };
      if (kind === 'stem') { out.push(hair(wob([[x0, mid + h * .2], [x1, mid - h * .1]], .25, seed), 'a', o)); const { n, p } = fitN(x1 - x0, h * 1.3 * v.p);
        for (let k = 0; k < n; k++) { const px = x0 + (k + .5) * p, py = mid + h * .2 - (px - x0) / (x1 - x0) * h * .3, up = k % 2 ? 1 : -1;
          out.push(hair([[px, py], [px + h * .35, py + up * h * .2], [px + h * .65, py + up * h * .28]], 'a', o), hair([[px + h * .05, py], [px + h * .4, py + up * h * .4], [px + h * .65, py + up * h * .28]], 'a', o)); } }
      else if (kind === 'scale') { const y = yBase - h * .05, { n, p } = fitN(x1 - x0, h * .35); out.push(hair([[x0, y], [x1, y]], 'a', { ...o, w: .45 }));
        for (let k = 0; k <= n; k++) out.push(hair([[x0 + k * p, y], [x0 + k * p, y - h * (k % 10 === 0 ? .75 : k % 5 === 0 ? .5 : .28)]], k % 10 === 0 && rich >= .5 ? 'b' : 'a', { ...o, w: .38, start: 'cut' })); }
      else { const tg = [x1 - h * 1.6, mid], W = h * 1.6, H = h * .9;   // the string, then the tag tied on it: a card with a cut corner and its eyelet
        out.push(hair(wob([[x0, mid], [tg[0] - h * .15, mid + h * .05]], .3, seed), 'a', o), hair(arc([tg[0] + h * .22, mid], h * .14, 0, 2 * Math.PI, 12), 'a', { ...o, start: 'cut', end: 'cut' }));
        out.push(hair([[tg[0] + h * .4, mid - H / 2], [x1 - .3, mid - H / 2], [x1 - .3, mid + H / 2], [tg[0] + h * .4, mid + H / 2], [tg[0], mid + H * .2], [tg[0], mid - H * .2], [tg[0] + h * .4, mid - H / 2]], 'b', { ...o, w: .5, start: 'cut', end: 'cut' }));
        if (rich >= .5) out.push(hair([[tg[0] + h * .55, mid], [x1 - h * .25, mid]], 'a', { ...o, w: .35 })); }
      return out; },
    breakMark(cx, y, measure, rank, seed, rich, u) {
      const r = stream(seed, 'bb'), out = [], o = { w: .55, load: .65, start: 'taper', end: 'taper' }, leafAt = (c, a, L) => { const t = [Math.cos(a), Math.sin(a)], n = [-t[1], t[0]], P = (s, q) => [c[0] + t[0] * s + n[0] * q, c[1] + t[1] * s + n[1] * q];
        return [hair(Array.from({ length: 11 }, (_, k) => P(L * k / 10, L * .32 * Math.sin(k / 10 * Math.PI))), 'a', o), hair(Array.from({ length: 11 }, (_, k) => P(L * k / 10, -L * .32 * Math.sin(k / 10 * Math.PI))), 'a', o), hair([P(0, 0), P(L * .9, 0)], 'a', { ...o, w: .4 })]; };
      const S = rank < 2 ? 1 : 1.6, stem = [[cx - u * 4 * S, y + u * .8 * S], [cx, y], [cx + u * 3.5 * S, y - u * .9 * S]];
      out.push(hair(wob(stem, .3, seed), 'a', o));
      for (let k = 0; k < (rank < 2 ? 3 : 6); k++) { const t = (k + .5) / (rank < 2 ? 3 : 6), px = cx - u * 4 * S + t * u * 7.5 * S, py = y + u * .8 * S - t * u * 1.7 * S; out.push(...leafAt([px, py], -Math.PI / 2 + (k % 2 ? .9 : -.9) + (r() - .5) * .3, u * (1.2 + r() * .4) * S)); }
      if (rank >= 2) { const tg = [cx + u * 5.5, y + u * 1.4]; out.push(hair([[cx + u * 3.4, y - u * .8], [tg[0] - u * .2, tg[1] - u * .5]], 'a', o), hair([[tg[0], tg[1] - u * .55], [tg[0] + u * 2.6, tg[1] - u * .55], [tg[0] + u * 2.6, tg[1] + u * .7], [tg[0], tg[1] + u * .7], [tg[0] - u * .4, tg[1] + u * .1], [tg[0], tg[1] - u * .55]], 'b', { ...o, start: 'cut', end: 'cut' }));
        if (rich >= .25) for (let k = 0; k < 2; k++) out.push(hair(wob([[tg[0] + u * .3, tg[1] - u * .1 + k * u * .45], [tg[0] + u * (1.6 + k * .5), tg[1] - u * .1 + k * u * .45]], .15, seed + k), 'a', { ...o, w: .4 })); }
      return out; } },
});
