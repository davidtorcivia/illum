// Le filet: Art Deco's letterpress ornament built from a compositor's material (research/22-deco.md). Brass rule set in a
// chase, a two-colour cut for the fan and the sun, a display capital with its shadow, printed in black and vermilion.
//   rule()       a run of brass rule along corner points: one piece of rule a side, mitred at the joints with the hairline
//                seam a mitre leaves, each piece its own fraction of a degree off true and its own inking
//   oxford()     the Oxford rule (measured on ATF's Book of American Types 1934, p. 186: thick : gap : thin = 3.2 : 1.6 : 1)
//   lotus()      the Chrysler doors' fan: petals that flare from a bound waist to scalloped tips with spurs
//   sun()        a half sun and its rays
// Every piece is a Sheet (kit/styles/deco-print.js) in its own px; its box [x0, y0, x1, y1] may run past (0, 0, W, H).
import { Sheet, poly, arc } from './deco-print.js';
import { dist } from '../inkletter.js';
import { stream } from '../marks.js';

// the capitals' faces (set by the style: the drop's and the line's), each an OFL face shipped in fonts/deco
export const BURST = { kind: 'grille', lotus: false };   // (the drop's field and the end mark's crown: the style sets them)
export const FACES = { drop: 'IllumDecoBroadway', line: 'IllumDecoFatface' };
const PI = Math.PI, clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
export const gauss = rnd => { let s = 0; for (let i = 0; i < 4; i++) s += rnd(); return (s - 2) * 1.732; };

// ---- the compositor's material -----------------------------------------------------------------------------------------------
// the points offset by d to the left of the way they run (inside, for a run that goes round clockwise on the screen), mitred
function offset(pts, d, closed) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], first = !closed && i === 0, last = !closed && i === n - 1;
    const nr = (u, v) => { const L = Math.hypot(v[0] - u[0], v[1] - u[1]) || 1; return [-(v[1] - u[1]) / L, (v[0] - u[0]) / L]; };
    if (first) { const m = nr(p, b); out.push([p[0] + m[0] * d, p[1] + m[1] * d]); continue; }
    if (last) { const m = nr(a, p); out.push([p[0] + m[0] * d, p[1] + m[1] * d]); continue; }
    const n0 = nr(a, p), n1 = nr(p, b), m = [n0[0] + n1[0], n0[1] + n1[1]], L = Math.hypot(...m) || 1, mm = [m[0] / L, m[1] / L], k = d / Math.max(.2, mm[0] * n1[0] + mm[1] * n1[1]);
    out.push([p[0] + mm[0] * k, p[1] + mm[1] * k]);
  }
  return out;
}
// brass rule t wide centred on the corner points: one piece a side, mitred where two meet. Each piece is cut a hair short
// at a mitre (the seam a comp's mitred corner shows), lies its own fraction of a degree off true (tilt, deg sd) and takes its
// own ink (ink: the share of a full coat, a little uneven piece to piece, as a forme inks)
export function rule(pts, t, rnd, { closed = false, seam = .1, tilt = .04 } = {}) {
  const L = offset(pts, t / 2, closed), R = offset(pts, -t / 2, closed), n = pts.length, out = [];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const j = (i + 1) % n, q = [L[i], L[j], R[j], R[i]].map(p => p.slice()), dx = pts[j][0] - pts[i][0], dy = pts[j][1] - pts[i][1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const s0 = closed || i > 0 ? seam / 2 : 0, s1 = closed || j < n - 1 ? seam / 2 : 0;
    q[0][0] += ux * s0; q[0][1] += uy * s0; q[3][0] += ux * s0; q[3][1] += uy * s0; q[1][0] -= ux * s1; q[1][1] -= uy * s1; q[2][0] -= ux * s1; q[2][1] -= uy * s1;
    const a = gauss(rnd) * tilt * PI / 180, cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2, c = Math.cos(a), s = Math.sin(a);
    const piece = q.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); piece.ink = .94 + .06 * rnd(); out.push(piece);
  }
  return out;
}
// lay pieces of rule into a layer's canvas, each at its own inking
export const lay = (g, pieces) => { for (const p of pieces) { g.globalAlpha = p.ink ?? 1; g.fill(poly(new Path2D(), p)); } g.globalAlpha = 1; };
// the Oxford rule along the points: the thick rule on them, the thin inside it (thick : gap : thin as ATF's, 3.2 : 1.6 : 1)
export function oxford(pts, thin, rnd, o = {}) {
  const thick = thin * 3.2, gap = thin * 1.6;
  return { thick: rule(pts, thick, rnd, o), thin: rule(offset(pts, thick / 2 + gap + thin / 2, o.closed), thin, rnd, o) };
}
// a stepped (ziggurat) outline from the bottom left, clockwise: its two top corners stepped in n times by st
export function zig(x0, y0, x1, y1, st, n, foot = true) {
  const o = foot ? [[x0, y1]] : []; for (let i = 0; i < n; i++) { o.push([x0 + st * i, y0 + st * (n - i)]); o.push([x0 + st * (i + 1), y0 + st * (n - i)]); }
  o.push([x0 + st * n, y0], [x1 - st * n, y0]); for (let i = n - 1; i >= 0; i--) { o.push([x1 - st * (i + 1), y0 + st * (n - i)]); o.push([x1 - st * i, y0 + st * (n - i)]); }
  if (foot) o.push([x1, y1]); return o;
}

// ---- the cut: fan and sun ----------------------------------------------------------------------------------------------------
// the lotus (the Chrysler lift doors, 1930): n petals between angles a0..a1 from r0 to r1, each flaring from the waist, its
// sides bowed a little outward, its tip a scallop between two spurs; returns the petals in order
export function lotus(c, r0, r1, a0, a1, n, rnd, fill = .8) {
  const da = (a1 - a0) / n, out = [], P = (a, r) => [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
  for (let i = 0; i < n; i++) {
    const m = a0 + (i + .5) * da, h0 = da * fill * .18, h1 = da * fill / 2, pts = [];
    // a side: from the waist out to the spur, bowed outward at two thirds (a quadratic through a point a little wider)
    const side = (s) => { const o = []; for (let k = 0; k <= 10; k++) { const t = k / 10, r = r0 + (r1 - r0) * t, hw = h0 + (h1 - h0) * (t * (2 - t)) * 1.0; o.push(P(m + s * hw, r)); } return o; };
    const left = side(-1), right = side(1).reverse(), spurL = P(m - h1 * 1.04, r1 * 1.035), spurR = P(m + h1 * 1.04, r1 * 1.035);
    const tip = []; for (let k = 1; k < 10; k++) { const t = k / 10, a = m - h1 + 2 * h1 * t, r = r1 * (1 - .07 * Math.sin(PI * t)); tip.push(P(a, r)); }   // (the scallop)
    pts.push(...left, spurL, ...tip, spurR, ...right); out.push(poly(new Path2D(), pts));
  }
  return out;
}
// a half sun on its horizon with n rays round it (from rIn to rOut), the rays tapering to a point, each its own width
export function sun(c, rs, rIn, rOut, n, rnd, a0 = PI, a1 = 2 * PI) {
  const disc = poly(new Path2D(), arc(c, rs, a0, a1, rnd, .002)), rays = new Path2D(), da = (a1 - a0) / n;
  for (let i = 0; i < n; i++) { const m = a0 + (i + .5) * da, h = da * .17, P = (a, r) => [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
    poly(rays, [P(m - h, rIn), P(m - h * .08, rOut), P(m + h * .08, rOut), P(m + h, rIn)]); }
  return { disc, rays };
}

// ---- the capital ---------------------------------------------------------------------------------------------------------------
// the face's capital, cap height `cap`, its ink box centred on (cx, cy); .grown(g, w): it grown by w (its channel)
export function glyph(ch, cap, cx, cy, face = FACES.drop) {
  const c = new OffscreenCanvas(8, 8).getContext('2d'); c.font = `200px ${face}`; const m = c.measureText(ch), mH = c.measureText('H');
  const k = cap / mH.actualBoundingBoxAscent, w = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * k, a = m.actualBoundingBoxAscent * k, d = m.actualBoundingBoxDescent * k;
  const x = cx - w / 2 + m.actualBoundingBoxLeft * k, y = cy + (a - d) / 2, size = 200 * k;
  const draw = (g, dx = 0, dy = 0) => { g.font = `${size}px ${face}`; g.textBaseline = 'alphabetic'; g.fillText(ch, x + dx, y + dy); };
  draw.grown = (g, wd, dx = 0, dy = 0) => { g.font = `${size}px ${face}`; g.textBaseline = 'alphabetic'; g.lineWidth = wd; g.lineJoin = 'round'; g.strokeText(ch, x + dx, y + dy); g.fillText(ch, x + dx, y + dy); };
  draw.w = w; draw.h = a + d; return draw;
}
export const ratio = (ch, face = FACES.drop) => { try { const c = new OffscreenCanvas(8, 8).getContext('2d'); c.font = `200px ${face}`; const m = c.measureText(ch), mH = c.measureText('H'); return (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / mH.actualBoundingBoxAscent; } catch { return .8; } };
// the inline: a line of paper cut down the middle of the letter's heaviest strokes (where it lies deepest in the ink), as
// an engraver cuts an inline into a display capital; nothing where the strokes are too thin to carry it
export const inline = (share = .8, minPx = 1.3) => (M, w, h, res) => {
  const feat = new Uint8Array(w * h); for (let q = 0; q < M.length; q++) feat[q] = M[q] < .5; const D = dist(feat, w, h);
  let mx = 0; for (let q = 0; q < D.length; q++) if (M[q] > .5 && D[q] > mx) mx = D[q];
  const cut = mx * share; if ((mx - cut) * 2 < minPx * res) return;
  for (let q = 0; q < M.length; q++) if (D[q] > cut - 1) M[q] *= clamp(cut - D[q] + .5);
};
// the shadow: the letter swept down and to the right by (dx, dy), solid, kept a hairline of paper (gap) off the letter
export function shadowOf(L, dx, dy, gap) {
  return g => { const n = Math.max(2, Math.ceil(Math.hypot(dx, dy) * 2)); for (let i = 1; i <= n; i++) L(g, dx * i / n, dy * i / n);
    g.globalCompositeOperation = 'destination-out'; L.grown(g, gap * 2); g.globalCompositeOperation = 'source-over'; };
}

// ---- the pieces ---------------------------------------------------------------------------------------------------------------
// pt: a typographic point at the text's size (u: the x-height, ~4.8 pt of 12 in the page's face); no rule under 1.2 px
const weights = u => { const pt = u / 4.8; return { pt, hair: Math.max(1.2, pt * .75), fine: Math.max(1.3, pt * 1.1) }; };

// the drop initial: H the cap-to-baseline height. Its frame an Oxford rule stepped at the head (black, the thin vermilion),
// the lotus rising behind the letter in vermilion, the letter in black with an inline and a vermilion shadow
export function dropInitial(ch, H, seed, rich = .5) {
  const r = stream(seed, 'drop:' + ch), W = H, S = new Sheet(), thin = Math.max(1.2, H * .011), th = thin * 3.2, gap = thin * 1.6, st = H * .072;
  const steps = rich >= 1 ? 3 : rich >= .5 ? 2 : 0, inset = th / 2;
  const frame = steps ? zig(inset, inset, W - inset, H - inset, st, steps) : [[inset, H - inset], [inset, inset], [W - inset, inset], [W - inset, H - inset]];
  const ox = oxford(frame, thin, r, { closed: true });
  // the letter stands in the frame a little left of centre (room for its shadow); behind it a sunburst set in rule, as a
  // jobbing comp built one: lengths of fine rule radiating from a half sun at the frame's foot, long and short in turn, each
  // run out to a hair inside the frame; a channel of paper keeps them off the letter and its shadow
  const ib = th + gap + thin, capH = H * .5, L = glyph(ch, capH, W * .47, H * .555), sd = [H * .046, H * .036], gp = Math.max(1, H * .01);
  const c = [W / 2, H - ib - H * .018], rs = H * .09, pad = H * .045, top = ib + (steps ? st * steps : 0) + pad, lft = ib + pad;
  const rw = Math.max(1.25, H * .011), rays = [];
  if (BURST.kind === 'rays') { const n = rich >= 1 ? 25 : 19;
    for (let i = 0; i < n; i++) { const a = PI * 1.07 + PI * .86 * (i + .5) / n, dx = Math.cos(a), dy = Math.sin(a);
      // (out to the frame's inside, along the ray: the nearer of its side and its head, the head lower where the steps are)
      const tx = dx < 0 ? (lft - c[0]) / dx : dx > 0 ? (W - lft - c[0]) / dx : Infinity, ty = (top - c[1]) / dy, R = Math.min(tx, ty);
      const r1 = i % 2 ? R * .72 : R; rays.push(...rule([[c[0] + dx * rs * 1.5, c[1] + dy * rs * 1.5], [c[0] + dx * r1, c[1] + dy * r1]], rw, r)); } }
  else {
    // the grille: two banks of upright fine rule flanking the letter on an even pitch, each rule a set-back lower than the one
    // outside it, so the banks step down toward the letter as a tower's setbacks do (the Chanin Building's grilles carry their
    // sunburst in straight bars: proportion and rhythm, not the motif); the outermost runs up to the head
    const pitch = H * (rich >= 1 ? .04 : .05), inner = L.w / 2 + H * .07, cx0 = W * .47 + H * .02, outer = W / 2 - lft, n = Math.max(2, Math.floor((outer - inner) / pitch) + 1), tall = c[1] - top, fall = tall * .62 / Math.max(1, n - 1);
    for (const side of [-1, 1]) for (let i = 0; i < n; i++) { const x = (side < 0 ? cx0 : W / 2) + side * (outer - i * pitch), hgt = tall - i * fall; if (Math.abs(x - cx0) < inner) continue;
      rays.push(...rule([[x, c[1]], [x, c[1] - hgt]], rw, r)); } }
  const sil = silhouette(L, W, H, H * .05), channel = g => { g.globalCompositeOperation = 'destination-out'; g.drawImage(sil, 0, 0, W, H); g.drawImage(sil, sd[0], sd[1], W, H); g.globalCompositeOperation = 'source-over'; };
  S.ink('r', g => { if (rich >= .25) lay(g, ox.thin); if (rich >= .5) { lay(g, rays); channel(g); } shadowOf(L, sd[0], sd[1], gp)(g); }, { medium: 'press', despeck: 2.5, ang: .7 });
  S.ink('k', g => { lay(g, rich >= .25 ? ox.thick : rule(frame, thin * 1.4, r, { closed: true }));
    L(g); }, { medium: 'press', despeck: 2.5, ang: .7, post: rich >= .75 ? inlineInLetter(L, H) : null });
  return { S, W, H, box: [-2, -2, W + 2, H + 2] };
}
// the letter's silhouette (its counters filled) grown by w, on a canvas of the piece's size at 3 cells a px: the channel the
// rays keep from it (a ray seen through a counter would read as shading in the letter)
function silhouette(L, W, H, w, k = 3) {
  const cw = Math.ceil(W * k), ch = Math.ceil(H * k), cv = new OffscreenCanvas(cw, ch), g = cv.getContext('2d', { willReadFrequently: true });
  g.scale(k, k); L.grown(g, w * 2);
  const im = g.getImageData(0, 0, cw, ch), d = im.data, out = new Uint8Array(cw * ch), st = [];
  const seed = q => { if (!out[q] && d[q * 4 + 3] < 128) { out[q] = 1; st.push(q); } };
  for (let i = 0; i < cw; i++) { seed(i); seed((ch - 1) * cw + i); } for (let j = 0; j < ch; j++) { seed(j * cw); seed(j * cw + cw - 1); }
  while (st.length) { const q = st.pop(), i = q % cw; if (i > 0) seed(q - 1); if (i < cw - 1) seed(q + 1); if (q >= cw) seed(q - cw); if (q < cw * (ch - 1)) seed(q + cw); }
  for (let q = 0; q < cw * ch; q++) if (!out[q]) d[q * 4 + 3] = 255;
  g.putImageData(im, 0, 0); return cv;
}
// the inline is cut in the letter only (not in the frame or the fan that share its forme): the letter's own mask is cut and
// laid back over the rest
function inlineInLetter(L, H) {
  const cut = inline(.8);
  return (M, w, h, res) => {
    const g = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true }); g.setTransform(res, 0, 0, res, 2 * res, 2 * res); L(g);
    const d = g.getImageData(0, 0, w, h).data, A = new Float32Array(w * h); for (let q = 0; q < A.length; q++) A[q] = d[q * 4 + 3] / 255;
    const B = Float32Array.from(A); cut(B, w, h, res);
    for (let q = 0; q < M.length; q++) if (A[q] > 0) M[q] = Math.max(0, M[q] - (A[q] - B[q])); };
}
// the capital in the line: the letter with its vermilion shadow, a line's height
export function lineInitial(ch, H, seed) {
  const r = ratio(ch, FACES.line), W = H * r + H * .1, S = new Sheet(), L = glyph(ch, H, H * r / 2, H / 2, FACES.line), sd = [H * .09, H * .07], gp = Math.max(1, H * .02);
  S.ink('r', g => shadowOf(L, sd[0], sd[1], gp)(g), { medium: 'press', despeck: 2, ang: .7 });
  S.ink('k', g => L(g), { medium: 'press', ang: .7 });
  return { S, W, H, box: [-2, -2, W + 2, H + H * .1 + 2] };
}
// the paraph: a set-back, three bars of rule each narrower, stacked as a tower steps in (the Chanin and Chrysler setbacks), on
// a vermilion foot; with the lotus asked for (BURST.lotus), the small lotus; at the plainest a vermilion square
export function paraph(s, seed, rich = .5) {
  const r = stream(seed, 'par'), S = new Sheet();
  if (rich < .25) { S.ink('r', g => g.fill(poly(new Path2D(), [[s * .3, s * .45], [s * .7, s * .45], [s * .7, s * .85], [s * .3, s * .85]])), { medium: 'press', ang: 0 }); return { S, W: s, H: s, box: [0, 0, s, s] }; }
  if (BURST.lotus) { const c = [s * .5, s * .9], n = rich >= .75 ? 7 : 5, P = lotus(c, s * .17, s * .8, PI * 1.12, PI * 1.88, n, r, .78);
    S.ink('r', g => { for (let i = 1; i < n; i += 2) g.fill(P[i]); }, { medium: 'press', ang: 1.57 });
    S.ink('k', g => { for (let i = 0; i < n; i += 2) g.fill(P[i]); g.fill(poly(new Path2D(), arc(c, s * .15, PI, 2 * PI, r, 0, 16))); }, { medium: 'press', ang: 1.57 });
    return { S, W: s, H: s, box: [0, 0, s, s] }; }
  const n = rich >= .75 ? 4 : 3, bh = s * .62 / (n + .6), w0 = s * .62, cx = s * .5, foot = s * .9, gap = Math.max(1, bh * .28), bars = [];
  for (let i = 0; i < n; i++) { const w = w0 * (1 - i / (n + .4)), y1 = foot - bh * .6 - gap - i * (bh + gap); bars.push(...rule([[cx - w / 2, y1 - bh / 2], [cx + w / 2, y1 - bh / 2]], bh - gap * .2, r)); }
  S.ink('r', g => lay(g, rule([[cx - w0 * .62, foot - bh * .3], [cx + w0 * .62, foot - bh * .3]], Math.max(1.2, bh * .45), r)), { medium: 'press', ang: 1.57 });
  S.ink('k', g => lay(g, bars), { medium: 'press', ang: 1.57 });
  return { S, W: s, H: s, box: [0, 0, s, s] };
}
// a cadence of graded rule (the fillers' and the breaks' family): rules falling in weight as they rise from a baseline yb,
// each lighter one shorter by a measured fall (.7 of the one below, its left end stepped back), set right to x1 (dir 1) or left
// to x0 (dir -1); then its close at the free end, chosen by the room: a stop (a short upright of rule as tall as the stack)
// and a vermilion lozenge for a long run, a diminuendo of dashes and a vermilion dot for a middling one, a period dash for a
// short. Returns { k: black pieces, r: vermilion paths, h: the stack's height }
export function cadence(x0, x1, yb, u, rnd, { dir = 1, n = 3, close = 'auto' } = {}) {
  const { pt } = weights(u), W = [1.6, 1, .6].slice(0, n).map(w => Math.max(1.2, pt * w)), G = [.9, .7].map(g => Math.max(1.1, pt * g));
  const room = x1 - x0, kind = close === 'auto' ? (room > u * 22 ? 'stop' : room > u * 9 ? 'dim' : 'dash') : close, k = [], red = new Path2D();
  const h = W.reduce((a, w) => a + w, 0) + G.slice(0, n - 1).reduce((a, g) => a + g, 0), mid = yb - h / 2;
  // the close takes its room at the free end (x1 for dir 1); the rules run up to it
  const loz = u * .42, dot = Math.max(1.3, pt * .9), at = x => dir > 0 ? x1 - x : x0 + x;   // (at(d): d in from the free end)
  let end = 0;
  if (kind === 'stop') { const sw = Math.max(1.3, pt * 1.1); poly(red, [[at(loz), mid - loz], [at(0), mid], [at(loz), mid + loz], [at(loz * 2), mid]]);
    k.push(...rule([[at(loz * 2 + u * .45), yb - h], [at(loz * 2 + u * .45), yb]], sw, rnd)); end = loz * 2 + u * .45 + sw * 1.6; }
  else if (kind === 'dim') { poly(red, arc([at(dot), mid], dot, 0, 2 * PI, rnd, 0, 12)); let d = dot * 2 + u * .38;
    for (const f of [.28, .5, .8]) { const len = u * f; k.push(...rule([[at(d + len), mid], [at(d), mid]], Math.max(1.2, pt * .9), rnd)); d += len + u * .32; } end = d; }
  else { poly(red, arc([at(dot), mid], dot, 0, 2 * PI, rnd, 0, 12)); const len = Math.min(room - dot * 2 - u * .4, u * 1.6); k.push(...rule([[at(dot * 2 + u * .3 + len), mid], [at(dot * 2 + u * .3), mid]], Math.max(1.3, pt * 1.3), rnd));
    return { k, r: red, h, kind }; }
  // the stack: the heaviest on the baseline, each above it lighter and shorter
  const L = room - end; let y = yb;
  for (let i = 0; i < n; i++) { const li = L * .7 ** i, w = W[i], a = dir > 0 ? x1 - end - li : x0 + end, b = dir > 0 ? x1 - end : x0 + end + li;
    k.push(...rule([[a, y - w / 2], [b, y - w / 2]], w, rnd)); y -= w + (G[i] ?? 0); }
  return { k, r: red, h, kind };
}
// a paragraph's free end: the cadence to the measure, on the baseline (its stack reaching the x-height), its close by the room;
// a heading's: an Oxford rule after a vermilion square
export function filler(L, u, seed, kind, rich = .5) {
  const r = stream(seed, 'fill'), S = new Sheet(), { hair } = weights(u), H = u * 1.4;
  if (kind === 'rule') { const thin = hair, ox = oxford([[u * .9, H * .42], [L, H * .42]], thin, r);
    S.ink('r', g => g.fill(poly(new Path2D(), [[0, H * .42 - thin * 2], [thin * 4, H * .42 - thin * 2], [thin * 4, H * .42 + thin * 2], [0, H * .42 + thin * 2]])), { medium: 'press', ang: 0 });
    S.ink('k', g => { lay(g, ox.thick); lay(g, ox.thin); }, { medium: 'press', ang: 0 }); return { S, W: L, H, box: [0, 0, L, H] }; }
  const yb = H / 2 + u / 2, c = cadence(0, L, yb, u, r, { n: rich >= .75 ? 3 : rich >= .5 ? 2 : 1 });
  S.ink('r', g => g.fill(c.r), { medium: 'press', ang: 0 });
  S.ink('k', g => lay(g, c.k), { medium: 'press', ang: 0 });
  return { S, W: L, H, box: [0, 0, L, H] };
}
// three ranks of break. 1, a part: a vermilion lozenge between speed lines; 2, a chapter: a stepped plinth in Oxford rule
// holding a sun and its rays, speed lines out to both sides; 3, the end: the lotus on its stepped plinth over a full Scotch
// rule (thin, thick, thin) across the measure
export function brk(W, H, rank, seed, u, rich = .5) {
  const r = stream(seed, 'brk' + rank), S = new Sheet(), { pt, hair, fine } = weights(u), cx = W / 2;
  if (rank === 1) { const y = H / 2, d = u * .55, n = rich >= .5 ? 2 : 1, cs = [cadence(W * .02, cx - d * 2.2, y + u * .3, u, r, { dir: -1, n, close: 'dim' }), cadence(cx + d * 2.2, W * .98, y + u * .3, u, r, { n, close: 'dim' })];
    S.ink('r', g => { g.fill(poly(new Path2D(), [[cx, y - d], [cx + d, y], [cx, y + d], [cx - d, y]])); for (const c of cs) g.fill(c.r); }, { medium: 'press', ang: 0 });
    S.ink('k', g => { for (const c of cs) lay(g, c.k); }, { medium: 'press', ang: 0 });
    return { S, W, H, box: [0, 0, W, H] }; }
  if (rank === 2) { const pw = H * 1.7, y1 = H * .92, st = H * .1, steps = rich >= 1 ? 3 : 2, thin = Math.max(1.2, pt * .9), x0 = cx - pw / 2;
    const plinth = zig(x0, H * .1, x0 + pw, y1, st, steps), ox = oxford(plinth.slice().reverse().map(p => p), thin, r);   // (run anticlockwise: its thin rule outside)
    const c = [cx, y1 - thin * 3], s = sun(c, H * .16, H * .24, H * .66 - st * (steps - 2) * .5, rich >= .75 ? 15 : 11, r);
    const cs = [cadence(x0 + pw + u * .9, W * .98, y1, u, r, { n: 3, close: 'dim' }), cadence(W * .02, x0 - u * .9, y1, u, r, { dir: -1, n: 3, close: 'dim' })];
    S.ink('r', g => { lay(g, ox.thin); g.fill(s.disc); for (const c of cs) g.fill(c.r); }, { medium: 'press', ang: 0 });
    S.ink('k', g => { lay(g, ox.thick); g.fill(s.rays);
      for (const c of cs) lay(g, c.k); }, { medium: 'press', ang: 0 });
    return { S, W, H, box: [0, 0, W, H] }; }
  // rank 3
  const y1 = H * .93, pw = H * (BURST.lotus ? .95 : 1.1), st = H * .085, x0 = cx - pw / 2, thin = Math.max(1.2, pt * .9);
  const plinth = zig(x0, y1 - H * .2, x0 + pw, y1, st, 2), lc = [cx, y1 - H * .2 - thin * 3.5], P = lotus(lc, H * .05, H * .46, PI * 1.2, PI * 1.8, rich >= .75 ? 9 : 7, r, .7), tall = g => { g.translate(lc[0], lc[1]); g.scale(1, 1.45); g.translate(-lc[0], -lc[1]); };
  const sc = [[pt * .9, 0], [pt * 2.6, pt * 1.6], [pt * .9, pt * 1.6]];   // Scotch rule: thin, thick, thin with gaps
  // the vermilion: the alternate petals, and a hairline of rule following the plinth's steps a gap above them
  // (without the lotus: a crown of upright rule on the plinth, the same grille as the drop's, its middle a black spire)
  const pt0 = y1 - H * .2, grille = [], spire = [], gp = H * .085, R = H * .6, gw = Math.max(1.2, pt * .9);
  for (let k = -4; k <= 4; k++) { const x = cx + k * gp, dx = Math.abs(k * gp) / R, ht = k ? R * Math.sqrt(Math.max(0, 1 - dx * dx)) * .9 * (k % 2 ? .82 : 1) : H * .74;
    (k ? grille : spire).push(...rule([[x, pt0 - thin * 3.5], [x, pt0 - thin * 3.5 - ht]], k ? gw : gw * 1.8, r)); }
  S.ink('r', g => { if (BURST.lotus) { g.save(); tall(g); for (let i = 1; i < P.length; i += 2) g.fill(P[i]); g.restore(); } else lay(g, grille); lay(g, rule(zig(x0 - thin * 3, y1 - H * .2 - thin * 3, x0 + pw + thin * 3, y1, st, 2, false), thin, r)); }, { medium: 'press', ang: 0 });
  // the black: the petals between, the stepped plinth solid, and the Scotch rule from its foot out to the measure each side
  S.ink('k', g => { g.fill(poly(new Path2D(), plinth));
    if (BURST.lotus) { g.save(); tall(g); for (let i = 0; i < P.length; i += 2) g.fill(P[i]); g.restore();
      g.fill(poly(new Path2D(), [[cx - H * .05, lc[1] - H * .085], [cx + H * .05, lc[1] - H * .085], [cx + H * .035, y1 - H * .2], [cx - H * .035, y1 - H * .2]])); }   // (the collar binding the lotus's waist to its plinth)
    else lay(g, spire);
    let y = y1 - sc.reduce((a, [w, gp]) => a + Math.max(1.2, w) + gp, 0);
    for (const [w, gp] of sc) { const ww = Math.max(1.2, w); y += gp; lay(g, rule([[W * .01, y + ww / 2], [x0 - u * .3, y + ww / 2]], ww, r)); lay(g, rule([[x0 + pw + u * .3, y + ww / 2], [W * .99, y + ww / 2]], ww, r)); y += ww; } }, { medium: 'press', ang: 0 });
  return { S, W, H, box: [0, 0, W, H] };
}
// a quotation's margin: an Oxford rule stood upright, its head and foot turned in by a step
export function marginRule(len, u, seed, rich = .5) {
  const r = stream(seed, 'margin'), S = new Sheet(), { pt } = weights(u), thin = Math.max(1.3, pt * 1.15), th = thin * 3.2, st = u * 1.1, x = th / 2;
  const pts = rich >= .75 ? [[x + st * 1.6, 0], [x + st, 0], [x + st, st * .7], [x, st * .7], [x, len - st * .7], [x + st, len - st * .7], [x + st, len], [x + st * 1.6, len]] : [[x + st, 0], [x, 0], [x, len], [x + st, len]];
  const ox = oxford(pts.slice().reverse(), thin, r);
  S.ink('r', g => lay(g, ox.thin), { medium: 'press', ang: PI / 2 });
  S.ink('k', g => lay(g, ox.thick), { medium: 'press', ang: PI / 2 });
  return { S, W: st * 2.2, H: len, box: [-2, -2, st * 2.4, len + 2] };
}
// a box of rule round [0, 0, W, H]: Oxford (figure) or a fine single rule (code), its corners stepped in (rich)
export function boxFrame(W, H, u, seed, { oxfordRule = true, steps = 1, rich = .5 } = {}) {
  const r = stream(seed, 'box'), S = new Sheet(), { pt, hair } = weights(u), st = u * 1.2, n = rich >= 1 ? steps + 1 : steps;
  const ring = [];   // clockwise from the top left, each corner stepped in n times
  if (!n) ring.push([0, 0], [W, 0], [W, H], [0, H]);
  else { const s = st; ring.push([0, s * n]); for (let i = 0; i < n; i++) ring.push([s * i, s * (n - i)], [s * (i + 1), s * (n - i)]); ring.push([s * n, 0], [W - s * n, 0]);
    for (let i = n - 1; i >= 0; i--) ring.push([W - s * (i + 1), s * (n - i)], [W - s * i, s * (n - i)]); ring.push([W, H - s * n]);
    for (let i = 0; i < n; i++) ring.push([W - s * i, H - s * (n - i)], [W - s * (i + 1), H - s * (n - i)]); ring.push([W - s * n, H], [s * n, H]);
    for (let i = n - 1; i >= 0; i--) ring.push([s * (i + 1), H - s * (n - i)], [s * i, H - s * (n - i)]); }
  // (the zig walk above repeats a corner where a step turns; drop exact repeats)
  const pts = ring.filter((p, i) => { const q = ring[(i + ring.length - 1) % ring.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6; });
  if (oxfordRule) { const ox = oxford(pts, Math.max(1.3, pt * 1.1), r, { closed: true });   // (clockwise: the thin inside, as the initial's)
    S.ink('r', g => lay(g, ox.thin), { medium: 'press', ang: .7 }); S.ink('k', g => lay(g, ox.thick), { medium: 'press', ang: .7 }); }
  else S.ink('k', g => lay(g, rule(pts, hair, r, { closed: true })), { medium: 'press', ang: .7 });
  return { S, W, H, box: [-u, -u, W + u, H + u] };
}
// an aside's two corners: brackets of Oxford rule stepped once, at its head on the left and its foot on the right
export function brackets(W, H, u, seed) {
  const r = stream(seed, 'brk2'), S = new Sheet(), { pt } = weights(u), thin = Math.max(1.3, pt * 1.15), a = u * 4.6, s = u * 1.2;
  const tl = [[a, 0], [s, 0], [s, s], [0, s], [0, a]], br = [[W - a, H], [W - s, H], [W - s, H - s], [W, H - s], [W, H - a]];
  const o1 = oxford(tl, thin, r), o2 = oxford(br, thin, r);
  S.ink('r', g => { lay(g, o1.thin); lay(g, o2.thin); }, { medium: 'press', ang: .7 });
  S.ink('k', g => { lay(g, o1.thick); lay(g, o2.thick); }, { medium: 'press', ang: .7 });
  return { S, W, H, box: [-u, -u, W + u, H + u] };
}
// a pull quote's head and foot: a vermilion lozenge between two cadences closing outward (the foot's stacks hang from its line)
export function pullBand(W, H, u, seed, foot = false, rich = .5) {
  const r = stream(seed, 'pull' + foot), S = new Sheet(), cx = W / 2, y = H / 2, d = u * .5, n = rich >= .75 ? 3 : 2;
  const yb = foot ? y - u * .3 + u : y + u * .3, cs = [cadence(0, cx - d * 2.4, yb, u, r, { dir: -1, n, close: 'dim' }), cadence(cx + d * 2.4, W, yb, u, r, { n, close: 'dim' })];
  if (foot) for (const c of cs) for (const p of c.k) for (const q of p) q[1] = 2 * (yb - c.h / 2) - q[1];   // (turned over about its middle)
  S.ink('r', g => { g.fill(poly(new Path2D(), [[cx, yb - u * .35 - d], [cx + d, yb - u * .35], [cx, yb - u * .35 + d], [cx - d, yb - u * .35]])); for (const c of cs) g.fill(c.r); }, { medium: 'press', ang: 0 });
  S.ink('k', g => { for (const c of cs) lay(g, c.k); }, { medium: 'press', ang: 0 });
  return { S, W, H, box: [0, 0, W, H] };
}
// a contents entry's mark: a vermilion square on a hairline
export function navMark(s, seed) {
  const r = stream(seed, 'nav'), S = new Sheet(), q = s * .32;
  S.ink('r', g => g.fill(poly(new Path2D(), [[s * .55, s / 2 - q / 2], [s * .55 + q, s / 2 - q / 2], [s * .55 + q, s / 2 + q / 2], [s * .55, s / 2 + q / 2]])), { medium: 'press', ang: 0 });
  S.ink('k', g => lay(g, rule([[0, s / 2], [s * .42, s / 2]], 1.2, r)), { medium: 'press', ang: 0 });
  return { S, W: s, H: s, box: [0, 0, s, s] };
}
