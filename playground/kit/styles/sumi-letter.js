// Sumi: the capital (research/28-sumi.md §4.1, Stage 1). The letter's shape is a credited OFL face's (Cinzel, an
// inscriptional Roman capital; EB Garamond); the brush is ours. Two ways to lay it:
//   strokes(ch, cap, face): the glyph read as the strokes a brush would write it in: its skeleton (Zhang & Suen's thinning),
//     the serifs' and corners' short spurs pruned (the brush's own entry makes the serif: Catich's argument), branches
//     joined through their forks along the straightest way, a closed bowl opened into two strokes from its top, each
//     stroke's half-width read from the glyph's distance field, its ends carried out to the glyph's ends, oriented (left to
//     right, top to bottom) and ordered as a hand writes (top first, then left; the stem before the bowl).
//   mask(ch, cap, face, d): the glyph's coverage at device px (for a letter laid whole, as one deposit, in the order of
//     its skeleton: kit/inkletter.js letterOrder).
// Both in CSS px with the letter's ink box at the origin.
import { dist } from '../inkletter.js';

export const FACES = { cinzel: '700 {s}px "illum-cinzel"', garamond: '500 {s}px "EB Garamond"' };

export function mask(ch, cap, face = 'cinzel', d = 2, padPx = 6) {
  const fs = cap * 1.42 * d, f = FACES[face].replace('{s}', fs.toFixed(2)), g0 = new OffscreenCanvas(8, 8).getContext('2d'); g0.font = f;
  const m = g0.measureText(ch), asc = m.actualBoundingBoxAscent, dsc = m.actualBoundingBoxDescent, l = m.actualBoundingBoxLeft, r = m.actualBoundingBoxRight, pad = Math.ceil(padPx * d);
  const w = Math.ceil(l + r) + 2 * pad, h = Math.ceil(asc + dsc) + 2 * pad, c = new OffscreenCanvas(w, h), g = c.getContext('2d');
  g.font = f; g.fillStyle = '#000'; g.fillText(ch, pad + l, pad + asc);
  const px = g.getImageData(0, 0, w, h).data, M = new Float32Array(w * h); for (let i = 0; i < w * h; i++) M[i] = px[i * 4 + 3] / 255;
  return { M, w, h, res: d, capPx: asc / d, W: w / d, H: h / d, base: (pad + asc) / d };
}

// ---- the skeleton -------------------------------------------------------------------------------------------------------
function thin(B, w, h) {
  for (let changed = true; changed;) { changed = false;
    for (const pass of [0, 1]) { const del = [];
      for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) { const q = j * w + i; if (!B[q]) continue;
        const P = [B[q - w], B[q - w + 1], B[q + 1], B[q + w + 1], B[q + w], B[q + w - 1], B[q - 1], B[q - w - 1]], n = P.reduce((a, v) => a + v, 0);
        if (n < 2 || n > 6) continue; let a = 0; for (let t = 0; t < 8; t++) a += !P[t] && P[(t + 1) % 8]; if (a !== 1) continue;
        if (pass ? P[0] * P[2] * P[6] || P[0] * P[4] * P[6] : P[0] * P[2] * P[4] || P[2] * P[4] * P[6]) continue; del.push(q); }
      for (const q of del) B[q] = 0; if (del.length) changed = true; } }
  return B;
}
const N8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

// the strokes of a glyph: [{ pts: [[x, y]...] (CSS px, ink box at 0,0), r: [half-width px...], len }]
export function strokes(ch, cap, face = 'cinzel') {
  const k = Math.max(1, 120 / cap), G = mask(ch, cap, face, k, 2 / k), { M, w, h } = G;   // (read at a cap of ~120 cells)
  const B = new Uint8Array(w * h); for (let q = 0; q < w * h; q++) B[q] = M[q] > .5 ? 1 : 0;
  const R = dist(Uint8Array.from(B, v => 1 - v), w, h);   // (distance to the paper: the half-width where a skeleton runs)
  thin(B, w, h);
  const nb = q => N8.map(([dx, dy]) => q + dy * w + dx).filter(o => B[o]);
  // trace the skeleton's branches between nodes (ends and forks)
  const isNode = q => nb(q).length !== 2, seen = new Set(), key = (a, b) => a < b ? a + ',' + b : b + ',' + a;
  let branches = [];
  for (let q = 0; q < w * h; q++) if (B[q] && isNode(q)) for (const o of nb(q)) { if (seen.has(key(q, o))) continue;
    const path = [q, o]; seen.add(key(q, o)); let prev = q, cur = o;
    while (!isNode(cur)) { const nx = nb(cur).filter(x => x !== prev); if (!nx.length) break; const n2 = nx[0]; if (seen.has(key(cur, n2))) break; seen.add(key(cur, n2)); prev = cur; cur = n2; path.push(cur); }
    branches.push(path); }
  // closed loops with no node (an O): open at the top into two strokes, left and right, both downward
  const onB = new Set(branches.flat());
  for (let q = 0; q < w * h; q++) if (B[q] && !onB.has(q)) { const loop = [q]; onB.add(q); let prev = -1, cur = q;
    for (;;) { const nx = nb(cur).filter(x => x !== prev && !onB.has(x)); if (!nx.length) break; prev = cur; cur = nx[0]; onB.add(cur); loop.push(cur); }
    if (loop.length < 8) continue; let top = 0, bot = 0; loop.forEach((c, i) => { if ((c / w | 0) < (loop[top] / w | 0)) top = i; if ((c / w | 0) > (loop[bot] / w | 0)) bot = i; });
    const rot = [...loop.slice(top), ...loop.slice(0, top)], b2 = (bot - top + loop.length) % loop.length;
    branches.push(rot.slice(0, b2 + 1), [...rot.slice(b2), rot[0]].reverse()); }
  const xy = q => [q % w, q / w | 0], blen = b => { let s = 0; for (let i = 1; i < b.length; i++) { const [a1, b1] = xy(b[i - 1]), [a2, b2] = xy(b[i]); s += Math.hypot(a2 - a1, b2 - b1); } return s; };
  // prune spurs: a branch with a free end, shorter than ~1.5 of the half-width where it leaves the body (a serif, a corner)
  const deg = () => { const D = new Map(); for (const b of branches) for (const e of [b[0], b.at(-1)]) D.set(e, (D.get(e) ?? 0) + 1); return D; };
  for (let it = 0; it < 4; it++) { const D = deg(), keep = branches.filter(b => { const e0 = D.get(b[0]) === 1, e1 = D.get(b.at(-1)) === 1; if (!(e0 || e1) || e0 && e1) return true;
      const root = e0 ? b.at(-1) : b[0]; return blen(b) > 1.6 * R[root] + 2; });
    if (keep.length === branches.length) break; branches = keep;
    // join branches that now meet two at a node
    for (let merged = true; merged;) { merged = false; const D2 = deg();
      for (const [node, c] of D2) if (c === 2) { const two = branches.filter(b => b[0] === node || b.at(-1) === node); if (two.length !== 2 || two[0] === two[1]) continue;
        const [a, b] = two, A = a.at(-1) === node ? a : [...a].reverse(), Bn = b[0] === node ? b : [...b].reverse();
        branches = branches.filter(x => x !== a && x !== b); branches.push([...A, ...Bn.slice(1)]); merged = true; break; } } }
  // through a fork, two branches that run on straight are one stroke (the straightest pair first)
  const dirAt = (b, end) => { const p = end ? b.slice(-6) : b.slice(0, 6).reverse(), [x0, y0] = xy(p[0]), [x1, y1] = xy(p.at(-1)), l = Math.hypot(x1 - x0, y1 - y0) || 1; return [(x1 - x0) / l, (y1 - y0) / l]; };
  for (let merged = true; merged;) { merged = false; const D = deg();
    for (const [node, c] of D) if (c >= 3) { const at = branches.filter(b => b[0] === node || b.at(-1) === node); let best = null;
      for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) { const a = at[i], b = at[j]; if (a === b) continue;
        const da = dirAt(a, a.at(-1) === node), db = dirAt(b, b.at(-1) === node), dot = da[0] * db[0] + da[1] * db[1];   // (both point into the node: straight on is −1)
        if (dot < -.6 && (!best || dot < best.dot)) best = { a, b, dot }; }
      if (best) { const { a, b } = best, A = a.at(-1) === node ? a : [...a].reverse(), Bn = b[0] === node ? b : [...b].reverse(); branches = branches.filter(x => x !== a && x !== b); branches.push([...A, ...Bn.slice(1)]); merged = true; break; } } }
  // to CSS px, smoothed, with the half-width; ends carried out to the glyph's ends; oriented and ordered
  const out = [];
  const D = deg();
  for (const b of branches) { if (blen(b) < 3) continue;
    let pts = b.map(xy).map(([x, y]) => [x + .5, y + .5]);
    for (let it = 0; it < 3; it++) pts = pts.map((p, i) => i === 0 || i === pts.length - 1 ? p : [(pts[i - 1][0] + 2 * p[0] + pts[i + 1][0]) / 4, (pts[i - 1][1] + 2 * p[1] + pts[i + 1][1]) / 4]);
    let rr = b.map(q => R[q]); const med = [...rr].sort((x, y) => x - y)[rr.length >> 1]; rr = rr.map(v => Math.min(v, med * 1.15));   // (a fork's wide place is not the stroke's width)
    for (let it = 0; it < 6; it++) rr = rr.map((v, i) => (rr[Math.max(0, i - 1)] + 2 * v + rr[Math.min(rr.length - 1, i + 1)]) / 4);
    // a free end: the skeleton stops short of the stroke's end by about its half-width; the brush goes on to it
    const ext = (atEnd) => { const i = atEnd ? pts.length - 1 : 0, j = atEnd ? Math.max(0, pts.length - 6) : Math.min(pts.length - 1, 5), [x0, y0] = pts[j], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0) || 1, e = rr[i] * .55;
      const p = [x1 + (x1 - x0) / l * e, y1 + (y1 - y0) / l * e]; if (atEnd) { pts.push(p); rr.push(rr[i] * .9); } else { pts.unshift(p); rr.unshift(rr[i] * .9); } };
    if (D.get(b[0]) === 1) ext(false); if (D.get(b.at(-1)) === 1) ext(true);
    // left to right, top to bottom (a closed bowl's halves already run down from its top)
    const [sx, sy] = pts[0], [ex, ey] = pts.at(-1), horiz = Math.abs(ex - sx) > 1.2 * Math.abs(ey - sy);
    if (horiz ? ex < sx : ey < sy) { pts.reverse(); rr.reverse(); }
    out.push({ pts: pts.map(([x, y]) => [x / k, y / k]), r: rr.map(v => v / k), horiz, free0: D.get(b[0]) === 1, free1: D.get(b.at(-1)) === 1, len: blen(b) / k });
  }
  // what is left of a serif or a corner, shorter than the body is wide, is the brush's entry, not a stroke
  const rG = Math.max(...out.map(s => Math.max(...s.r)));
  for (let i = out.length - 1; i >= 0; i--) if (out[i].len < 2.4 * rG) out.splice(i, 1);
  // the order a hand writes them: the topmost start first; a stroke whose start sits on the left goes before one beside it
  out.sort((a, b) => { const ay = Math.min(...a.pts.map(p => p[1])), by = Math.min(...b.pts.map(p => p[1])); if (Math.abs(ay - by) > cap * .12) return ay - by; return a.pts[0][0] - b.pts[0][0]; });
  // the stem before a bowl that leans on it
  return { strokes: out, W: G.W, H: G.H, base: G.base, cap: G.capPx };
}
