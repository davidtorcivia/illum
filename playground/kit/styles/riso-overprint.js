// Duplicator, the overprint (research/26-riso.md, stage 4). Two translucent inks make three colours. Federal Blue carries
// the letter, the strips and the hand (drum 1, the key); Fluorescent Pink prints its masses and bands over them (drum 2,
// last, as fluorescents go); where they cross, violet. The letter is Gloock (Duarte Pinto, OFL). In the dark: the opaque
// pair on black stock, Bubblegum first and Cornflower over it, so the letter stays on top.
// Every shape is cut, as a riso maker cuts a separation: a closed run of cuts, each either a knife's straight run or a
// scissor's long arc whose bend is not quite even along it, meeting the next cut at a corner; no compass anywhere.
// The small mark is the printer's pointing hand (the manicule), one shape in one ink: the paraph, and the close of a filler
// and a run-out. The breaks are print furniture, not pictures: rank 1 the hand (alone, a pair facing, or on its strip);
// rank 2 bands or blocks crossing in violet; rank 3 a bold overprinted composition (crossing bars, the part's numeral in
// Gloock on a cut block, or a long overprinted bar between registration marks printed by both drums, so the sheet's miss
// shows in them). Each rank's form is the page's (from the seed) or given (brk's v: 'a' | 'b' | 'c').
// The seed sets the page's hand, followed by every piece: the drop's mass (a cut sun, a sunrise, a leaf, a hill), how
// strips end, the breaks' forms, a lean, a weight, a side.
// Pieces are in CSS px with their origin where the page puts them; roles: a (the blue), b (the pink).
import { rng, capFit } from './riso-press.js';

// the face: the shipped subset of Gloock (fonts/riso/), loaded by loadFace (a page may load it itself)
export const FACE = { css: '"Illum Riso Gloock"', credit: 'Gloock, Duarte Pinto (OFL)' };
let FACEP = null;
export const loadFace = () => FACEP ??= (typeof FontFace === 'undefined' ? Promise.resolve() : new FontFace('Illum Riso Gloock', `url(${new URL('../../fonts/riso/illum-riso-gloock-caps.woff2', import.meta.url)})`).load().then(f => document.fonts.add(f)).catch(e => console.warn('riso:', e)));
export const LOOK = {
  light: { stock: '#F3EEE3', order: ['a', 'b'], ink: { a: 'federal', b: 'pink' }, density: { a: .95, b: .92 } },
  dark:  { stock: '#18171B', order: ['b', 'a'], key: 'a', ink: { a: 'cornflower', b: 'bubblegum' }, density: { a: .95, b: .9 } },   // (the blue stays the key: registered to the text)
};
export const BREAKS = { 1: { a: 'the hand', b: 'two hands facing', c: 'the hand on its strip' }, 2: { a: 'crossed bands', b: 'blocks overlapping', c: 'banded rule' },
  3: { a: 'crossing bars', b: 'the numeral on a cut block', c: 'registration furniture' } };
const TAU = 2 * Math.PI, pick = (r, xs) => xs[Math.floor(r() * xs.length)];

export function hand(seed) {
  const r = rng((seed | 0) * 131 + 7);
  return { mass: pick(r, ['sun', 'sunrise', 'leaf', 'hill']), ends: pick(r, ['oblique', 'swallow', 'square']), cuts: 7 + Math.floor(r() * 5),
    brk: { 1: pick(r, ['a', 'b', 'c']), 2: pick(r, ['a', 'b', 'c']), 3: pick(r, ['a', 'b', 'c']) }, lean: (r() - .5) * .5, weight: .9 + .3 * r(), flip: r() < .5 ? 1 : -1, tilt: .05 + .1 * r() };
}

// ---- the cuts -----------------------------------------------------------------------------------------------------------
// each cut's stream from the piece's seed and the cut's own place, so a shape is the same every time it is laid
const own = (base, ...v) => rng(v.reduce((a, x) => Math.imul(a ^ Math.round(x * 16), 0x9E3779B1), base | 0));
// a closed cut: vertices P, and per cut its sagitta as a fraction of its chord (0: a knife's straight run; the sign: away
// from the shape's middle or into it). A scissor's arc bends a little more at one end than the other.
function cutShape(g, P, sag, rnd) {
  const n = P.length, cx = P.reduce((a, p) => a + p[0], 0) / n, cy = P.reduce((a, p) => a + p[1], 0) / n;
  g.beginPath(); g.moveTo(P[0][0], P[0][1]);
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    let nx = -dy / L, ny = dx / L; if (((a[0] + b[0]) / 2 - cx) * nx + ((a[1] + b[1]) / 2 - cy) * ny < 0) { nx = -nx; ny = -ny; }
    const s = (sag[i] ?? 0) * L; if (!s) { g.lineTo(b[0], b[1]); continue; }
    const k = (rnd() - .5) * .6, o1 = 4 / 3 * s * (1 + k), o2 = 4 / 3 * s * (1 - k);
    g.bezierCurveTo(a[0] + dx / 3 + nx * o1, a[1] + dy / 3 + ny * o1, a[0] + 2 * dx / 3 + nx * o2, a[1] + 2 * dy / 3 + ny * o2, b[0], b[1]); }
  g.closePath(); g.fill();
}
// a circle's cut chord: the sagitta (as a fraction of the chord) of an arc of angle t
const arcSag = t => (1 - Math.cos(t / 2)) / (2 * Math.sin(t / 2));
// a sun cut round in n scissor cuts (from angle a0 to a1: a sunrise, its base a knife's cut), with rays: knife-cut wedges
function sun(g, base, cx, cy, R, n, rays = 0, a0 = 0, a1 = TAU, reach = 1) {
  const rnd = own(base, cx, cy, R), whole = a1 - a0 >= TAU - 1e-6, m = whole ? n : Math.max(3, Math.round(n * (a1 - a0) / TAU)), step = (a1 - a0) / m, P = [], S = [];
  const ph = whole ? rnd() * step : 0;
  for (let i = 0; i < (whole ? m : m + 1); i++) { const j = whole || (i > 0 && i < m) ? (rnd() - .5) * .3 * step : 0, a = a0 + ph + i * step + j, r = R * (1 + (rnd() - .5) * .05);
    P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); S.push(arcSag(step) * (.8 + .4 * rnd())); }
  if (!whole) S[S.length - 1] = 0;   // (the base: one straight cut back to the start)
  cutShape(g, P, S, rnd);
  for (let i = 0; i < rays; i++) { const a = a0 + (i + .5) / rays * (a1 - a0) + (rnd() - .5) * .15, w = R * (.1 + .05 * rnd()), r0 = R * (1 + .14 * reach), r1 = R * (1 + (.45 + .25 * rnd()) * reach), u = [Math.cos(a), Math.sin(a)], v = [-u[1], u[0]];
    if (!whole && Math.sin(a) > -.05) continue;
    cutShape(g, [[cx + u[0] * r0 + v[0] * w, cy + u[1] * r0 + v[1] * w], [cx + u[0] * r1, cy + u[1] * r1], [cx + u[0] * r0 - v[0] * w, cy + u[1] * r0 - v[1] * w]], [0, 0, 0], rnd); }
}
// a leaf: two long cuts from its stalk to its point, a short straight one across the stalk; vein: a knife's slit cut back out
function leaf(g, base, B, T, w, vein = false) {
  const rnd = own(base, B[0], B[1], T[0], T[1]), dx = T[0] - B[0], dy = T[1] - B[1], L = Math.hypot(dx, dy), v = [-dy / L, dx / L], s = w * .1;
  const P = [[B[0] + v[0] * s, B[1] + v[1] * s], T, [B[0] - v[0] * s, B[1] - v[1] * s]], half = w / 2 / L;
  cutShape(g, P, [half * (.85 + .3 * rnd()) * 1.15, half * (.85 + .3 * rnd()) * 1.15, 0], rnd);
  if (vein) { g.globalCompositeOperation = 'destination-out'; const a = [B[0] + dx * .14, B[1] + dy * .14], b = [B[0] + dx * .72, B[1] + dy * .72], t = Math.max(.6, w * .045);
    cutShape(g, [[a[0] + v[0] * t, a[1] + v[1] * t], b, [a[0] - v[0] * t, a[1] - v[1] * t]], [0, 0, 0], rnd); g.globalCompositeOperation = 'source-over'; }
}
// a strip from S to E, t thick: two long knife runs and its own two end cuts (oblique, a swallow's notch, or near square)
function strip(g, base, S, E, t, ends = 'oblique') {
  const rnd = own(base, S[0], S[1], E[0], E[1]), dx = E[0] - S[0], dy = E[1] - S[1], L = Math.hypot(dx, dy) || 1, u = [dx / L, dy / L], v = [-u[1], u[0]], h = t / 2;
  const cutAt = (p, sgn) => { const a = ends === 'square' ? (rnd() - .5) * .12 : (.35 + .3 * rnd()) * (rnd() < .5 ? 1 : -1), o = Math.tan(a) * h, wob = (rnd() - .5) * t * .12;
    return [[p[0] + v[0] * (h + wob) + u[0] * o, p[1] + v[1] * (h + wob) + u[1] * o], [p[0] - v[0] * (h - wob) - u[0] * o, p[1] - v[1] * (h - wob) - u[1] * o]]; };
  const [s0, s1] = cutAt(S), [e0, e1] = cutAt(E), P = [s0, e0];
  if (ends === 'swallow') P.push([E[0] - u[0] * t * .9, E[1] - u[1] * t * .9]);
  P.push(e1, s1);
  const lr = () => (rnd() - .5) * .004;   // (a long knife run: straight, its lean in the ends)
  cutShape(g, P, P.map((_, i) => i === 0 || i === P.length - 2 ? lr() : 0), rnd);
}
// a hill: a knife's base, its top two or three long scissor cuts
function hill(g, base, x0, x1, y, h) {
  const rnd = own(base, x0, x1, y, h), w = x1 - x0, P = [[x0, y], [x0 + w * (.18 + .08 * rnd()), y - h * (.55 + .15 * rnd())], [x0 + w * (.48 + .1 * rnd()), y - h], [x0 + w * (.8 + .06 * rnd()), y - h * (.5 + .15 * rnd())], [x1, y]];
  cutShape(g, P, [.16, .1, .1, .16, 0].map(s => s * (.8 + .4 * rnd())), rnd);
}
// a pointing hand (the printer's manicule), cut from one sheet: cuff, back of the hand, thumb, the index finger out along
// the line, the folded fingers as three scissor bumps under it. w: its length; dir: 1 points right, -1 left
function manicule(g, base, x, y, w, dir = 1) {
  const rnd = own(base, x, y, w, dir), h = w * .56, M = ([u, v]) => [x + dir * (u - .5) * w, y + (v - .5) * h];
  const U = [[.2, .2], [.33, .08], [.45, .02], [.55, .14], [.95, .22], [1, .32], [.95, .42], [.58, .42], [.62, .58], [.57, .7], [.6, .8], [.52, .93], [.38, .98], [.2, .9]];
  cutShape(g, U.map(M), [.08, .12, .06, 0, .3, .3, 0, .22, .25, .25, .25, .12, .04, 0], rnd);
  cutShape(g, [[0, .24], [.15, .2], [.15, .9], [0, .86]].map(M), [0, .03, 0, .03], rnd);
}

// ---- the pieces ---------------------------------------------------------------------------------------------------------
// the drop: the letter in blue, a cut pink mass behind it (by the page's hand: a sun, a sunrise, a leaf, a hill), the mass
// held to the letter's own room (o.wb: its box's width; never less than the letter's) so it never reaches the words.
// o.plain: the letter alone (a one-colour flyer). o.line: an initial in the line, the mass a small cut block under its foot.
export function initial(ch, H, seed, fs, o = {}) {
  const f = capFit(FACE.css, ch, H), h = hand(seed), base = seed * 31 + ch.charCodeAt(0), lw = f.w, x0 = -f.l, wb = Math.max(lw, o.wb ?? lw);
  const letter = g => { g.font = `${f.px}px ${FACE.css}`; g.fillText(ch, x0, H); };
  if (o.plain) return { W: lw, H, draw: { a: letter } };
  if (o.line) return { W: lw, H, draw: { a: letter, b: g => strip(g, base, [-.04 * H, H * .93], [lw + .06 * H, H * .93], H * .16, 'oblique') } };   // (a short cut pink strip along its foot, crossing it)
  let mass;
  if (h.mass === 'sun') { const R = Math.min(.42 * H, wb * .42), cx = wb - R * 1.02, cy = H * .54; mass = g => sun(g, base, cx, cy, R, h.cuts + 2); }
  else if (h.mass === 'sunrise') { const R = Math.min(.58 * H, wb * .5), cx = wb / 2; mass = g => sun(g, base, cx, H, R, h.cuts + 4, 0, Math.PI, TAU); }
  else if (h.mass === 'leaf') { const B = [wb * (h.flip > 0 ? .06 : .94), H * .9], T = [wb * (h.flip > 0 ? .96 : .04), H * .05]; mass = g => leaf(g, base, B, T, Math.min(H * .5, wb * .5), true); }
  else mass = g => hill(g, base, 0, wb, H, H * .7);
  return { W: wb, H, draw: { a: letter, b: mass } };
}

// a paraph: the hand, pointing into the paragraph
// ---- the printer's marks: the hand's company, one cut shape each, one ink, clear at 19 px ----------------------------------------
// asterisk (six knife-cut points), lozenge (four knife cuts), a square on its corner with a square cut out, an arrowhead (barbed),
// the aldus leaf (a heart of four scissor cuts on a short cut stem), a double bar. Centred on (cx, cy), about s across.
export const MARKS = ['asterisk', 'lozenge', 'square', 'arrowhead', 'leaf', 'bars'];
function cutMark(g, base, kind, cx, cy, s) {
  const rnd = own(base, cx, cy, s, MARKS.indexOf(kind)), P = (pts, sag) => cutShape(g, pts.map(([x, y]) => [cx + x * s, cy + y * s]), sag, rnd);
  if (kind === 'hand') return manicule(g, base, cx, cy, s * 1.15, 1);
  if (kind === 'asterisk') { const pts = []; for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i * Math.PI / 6 + (rnd() - .5) * .05, r = i % 2 ? .1 : .4 * (1 + (rnd() - .5) * .1); pts.push([Math.cos(a) * r, Math.sin(a) * r]); } return P(pts, pts.map(() => 0)); }
  if (kind === 'lozenge') return P([[0, -.34], [.3, 0], [0, .34], [-.3, 0]], [0, 0, 0, 0]);
  if (kind === 'square') { P([[0, -.3], [.3, 0], [0, .3], [-.3, 0]], [0, 0, 0, 0]); g.globalCompositeOperation = 'destination-out'; P([[0, -.09], [.09, 0], [0, .09], [-.09, 0]], [0, 0, 0, 0]); g.globalCompositeOperation = 'source-over'; return; }
  if (kind === 'arrowhead') return P([[.32, 0], [-.22, -.26], [-.1, 0], [-.22, .26]], [.02, 0, 0, .02]);
  if (kind === 'leaf') { P([[.38, 0], [.02, -.26], [-.26, -.17], [-.13, 0], [-.26, .17], [.02, .26]], [.1, .24, .14, .14, .24, .1]);   // (a heart: two lobes, the notch at its stalk)
    // (its stem: a short strip cut along a curve from the notch, back and up, curling)
    const st = []; for (let i = 0; i <= 6; i++) { const t = i / 6, x = -.13 - .3 * t, y = -.26 * t * t; st.push([x, y]); }
    const w = .035, up = st.map(([x, y], i) => { const q = st[Math.min(i + 1, 6)], p = st[Math.max(i - 1, 0)], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1; return [x - dy / L * w, y + dx / L * w]; });
    const dn = st.map(([x, y], i) => { const q = st[Math.min(i + 1, 6)], p = st[Math.max(i - 1, 0)], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1; return [x + dy / L * w, y - dx / L * w]; });
    const poly = up.concat(dn.reverse()); return P(poly, poly.map(() => 0)); }
  P([[-.3, -.15], [.3, -.15], [.3, -.04], [-.3, -.04]], [0, 0, 0, 0]); P([[-.3, .04], [.3, .04], [.3, .15], [-.3, .15]], [0, 0, 0, 0]);   // (bars)
}
export function paraph(fs, seed, mark = 'hand') { const W = 1.45 * fs, H = 1.1 * fs; return { W, H, draw: { a: g => mark === 'hand' ? manicule(g, seed * 7 + 1, W / 2, H / 2, 1.15 * fs, 1) : cutMark(g, seed * 7 + 1, mark, W / 2, H / 2, 1.3 * fs) } }; }

// a filler: a blue strip run out to the margin, the hand after it pointing on
export function filler(w, lh, seed, fs = lh / 1.58, mark = 'hand') {
  const h = hand(seed), base = seed * 7 + 2, H = .9 * fs, c = H / 2 + .03 * fs, mw = (mark === 'hand' ? 1.3 : 1) * fs, e = w - mw - .25 * fs;
  return { W: w, H, draw: { a: g => { strip(g, base, [0, c], [e, c], .18 * fs * h.weight, h.ends); mark === 'hand' ? manicule(g, base + 5, w - mw / 2, c, 1.05 * fs, 1) : cutMark(g, base + 5, mark, w - mw / 2, c, 1.15 * fs); } } };
}

// a heading's run-out: a wide pink strip with a blue one laid over its upper edge (their long overlap violet), the hand after
export function runout(w, h0, seed, fs = h0 / 1.3, mark = 'hand') {
  const h = hand(seed), base = seed * 7 + 3, H = h0, c = H / 2, mw = (mark === 'hand' ? 1.45 : 1.1) * fs, e = w - mw - .3 * fs;
  return { W: w, H, draw: { a: g => { strip(g, base, [0, c - .1 * fs], [e, c - .1 * fs], .16 * fs * h.weight, h.ends); mark === 'hand' ? manicule(g, base + 9, w - mw / 2, c, 1.1 * fs, 1) : cutMark(g, base + 9, mark, w - mw / 2, c, 1.25 * fs); },
    b: g => { if (e - .4 * fs > 1.6 * fs) strip(g, base + 4, [.8 * fs, c + .06 * fs], [e - .4 * fs, c + .06 * fs], .3 * fs, h.ends); } } };
}

// a registration mark, cut: a ring (two scissor-cut circles, the inner taken back out) and a cross of two knife strips
function register(g, base, cx, cy, R) {
  sun(g, base, cx, cy, R, 9); g.globalCompositeOperation = 'destination-out'; sun(g, base + 1, cx, cy, R * .74, 9); g.globalCompositeOperation = 'source-over';
  strip(g, base + 2, [cx - R * 1.7, cy], [cx + R * 1.7, cy], R * .16, 'square'); strip(g, base + 3, [cx, cy - R * 1.7], [cx, cy + R * 1.7], R * .16, 'square');
}

// breaks, by rank and form (v; default the page's): see BREAKS. n: the part's number (rank 3's numeral)
export function brk(k, measure, h0, seed, fs = 19, v = null, n = 2, mark = 'asterisk') {
  const h = hand(seed), base = seed * 7 + 10 + k, H = h0, c = H / 2; v ??= h.brk[k];
  if (k === 1) {
    // (m: a printer's mark, larger, a short strip each side)
    if (v === 'm') { const W = 5 * fs; return { W, H, draw: { a: g => { cutMark(g, base, mark, W / 2, c, 1.35 * fs); strip(g, base + 1, [0, c], [W / 2 - 1.1 * fs, c], .12 * fs * h.weight, h.ends); strip(g, base + 2, [W, c], [W / 2 + 1.1 * fs, c], .12 * fs * h.weight, h.ends); } } }; }
    if (v === 'a') { const W = 2.4 * fs; return { W, H, draw: { a: g => manicule(g, base, W / 2, c, 1.35 * fs, 1) } }; }
    if (v === 'b') { const W = 4.4 * fs; return { W, H, draw: { a: g => { manicule(g, base, 1.05 * fs, c, 1.25 * fs, 1); manicule(g, base + 1, W - 1.05 * fs, c, 1.25 * fs, -1); } } }; }
    const W = 5.4 * fs; return { W, H, draw: { a: g => { strip(g, base, [0, c], [W - 1.75 * fs, c], .16 * fs * h.weight, h.ends); manicule(g, base + 1, W - .7 * fs, c, 1.2 * fs, 1); } } };
  }
  if (k === 2) {
    if (v === 'a') { const W = 11 * fs, d = h.tilt * fs * 4 * h.flip, ta = .3 * fs * h.weight, tb = .44 * fs;
      return { W, H, draw: { a: g => strip(g, base, [0, c - d], [W, c + d], ta, h.ends), b: g => strip(g, base + 1, [.06 * W, c + d], [W * .94, c - d], tb, h.ends) } }; }
    if (v === 'b') { const W = 10 * fs, bh = .72 * fs, pw = W * .38, ov = .7 * fs;
      return { W, H, draw: { a: g => { strip(g, base, [0, c], [W / 2 - pw / 2 + ov, c], bh * .8, 'square'); strip(g, base + 1, [W / 2 + pw / 2 - ov, c], [W, c], bh * .8, 'square'); },
        b: g => strip(g, base + 2, [W / 2 - pw / 2, c + h.flip * .08 * fs], [W / 2 + pw / 2, c + h.flip * .08 * fs], bh, 'square') } }; }
    const W = 9 * fs; return { W, H, draw: { a: g => { strip(g, base, [0, c - .14 * fs], [W, c - .14 * fs], .16 * fs * h.weight, h.ends); strip(g, base + 3, [W * .46, c + .16 * fs], [W * .54, c + .16 * fs], .5 * fs, 'square'); },
      b: g => strip(g, base + 1, [.6 * fs, c + .06 * fs], [W - .6 * fs, c + .06 * fs], .42 * fs, h.ends) } };
  }
  const W = Math.min(measure * .74, 26 * fs);
  if (v === 'a') { const cx = W / 2, L = Math.min(W * .36, 8.5 * fs), d = Math.min(H * .2, L * (.1 + h.tilt * .6)), tA = .78 * fs, tB = 1.05 * fs, t = .16 * fs;
    // (each bar runs on in a thin strip of its own ink from its own end, out to the measure)
    return { W, H, draw: {
      a: g => { strip(g, base, [cx - L, c + d * h.flip], [cx + L, c - d * h.flip], tA, h.ends); strip(g, base + 2, [0, c + d * h.flip], [cx - L + .3 * fs, c + d * h.flip], t, h.ends); },
      b: g => { strip(g, base + 1, [cx - L, c - d * h.flip], [cx + L, c + d * h.flip], tB, h.ends); strip(g, base + 3, [W, c + d * h.flip], [cx + L - .3 * fs, c + d * h.flip], t, h.ends); } } }; }
  if (v === 'b') { const cx = W / 2, f = capFit(FACE.css, String(n), H * .82), bw = Math.max(f.w * 2.1, 4.5 * fs), bh = H * .5, t = .14 * fs, nx = cx - f.w * (.15 + .25 * h.flip) - f.l;
    return { W, H, draw: {
      a: g => { g.font = `${f.px}px ${FACE.css}`; g.fillText(String(n), nx, c + H * .41); strip(g, base + 2, [0, c + H * .41 - t / 2], [cx - bw / 2 - .4 * fs, c + H * .41 - t / 2], t, h.ends); },
      b: g => { strip(g, base, [cx - bw / 2, c + H * .41 - bh / 2], [cx + bw / 2, c + H * .41 - bh / 2 - h.lean * fs], bh, 'square'); strip(g, base + 3, [W, c + H * .41 - t / 2], [cx + bw / 2 + .4 * fs, c + H * .41 - t / 2], t, h.ends); } } }; }
  const R = .55 * fs, mx = 1.3 * fs, L0 = mx + 1.6 * R, L1 = W - mx - 1.6 * R;
  return { W, H, draw: {
    a: g => { register(g, base, mx, c, R); register(g, base + 5, W - mx, c, R); strip(g, base + 1, [L0, c - .12 * fs], [L1, c - .12 * fs], .2 * fs * h.weight, h.ends); },
    b: g => { register(g, base, mx, c, R); register(g, base + 5, W - mx, c, R); strip(g, base + 2, [L0 + .6 * fs, c + .1 * fs], [L1 - .6 * fs, c + .1 * fs], .55 * fs, h.ends); } } };
}

// the quotation: a blue strip down the margin and a wider pink one beside it, overlapping, each cut at its own ends
export function frame(kind, w, h0, seed, fs = 19) {
  const h = hand(seed), base = seed * 7 + 20, x = .2 * fs;
  return { W: .9 * fs, H: h0, draw: {
    a: g => strip(g, base, [x + .12 * fs, 0], [x + .12 * fs, h0], .26 * fs * h.weight, h.ends),
    b: g => strip(g, base + 1, [x + .42 * fs, .45 * fs], [x + .42 * fs, h0 - .3 * fs], .38 * fs, h.ends) } };
}

// ---- furniture for the frames ---------------------------------------------------------------------------------------------
// a pair of registration marks' worth: one mark, printed by both drums (their miss shows in it)
export function regMark(R, seed) { const W = R * 3.6; return { W, H: W, draw: { a: g => register(g, seed * 7 + 30, W / 2, W / 2, R), b: g => register(g, seed * 7 + 30, W / 2, W / 2, R) } }; }
// a short blue strip, the contents' tick
export function tick(fs, seed, i = 0) { const h = hand(seed), W = .95 * fs, H = .5 * fs; return { W, H, draw: { a: g => strip(g, seed * 7 + 40 + i, [0, H / 2], [W, H / 2], .16 * fs * h.weight, h.ends) } }; }
// a banded rule of a given length: a pink band under a blue rule (an aside's or code's head)
export function band(w, fs, seed) { const h = hand(seed), H = fs, c = H / 2, base = seed * 7 + 50;
  return { W: w, H, draw: { a: g => strip(g, base, [0, c - .12 * fs], [w, c - .12 * fs], .15 * fs * h.weight, h.ends), b: g => strip(g, base + 1, [.5 * fs, c + .06 * fs], [w - .5 * fs, c + .06 * fs], .34 * fs, h.ends) } }; }
// the quotation's strips at a given rich: one (blue) or both
export function quoteStrips(h0, seed, fs, both = true) { const p = frame('quote', 0, h0, seed, fs); if (!both) delete p.draw.b; return p; }
// a capital's ink width over its cap height (the face must be loaded: loadFace)
const GW = new Map();
export const glyphW = ch => { let v = GW.get(ch); if (v == null) { const f = capFit(FACE.css, ch, 100); v = f.w / 100; if (document.fonts?.check?.(`20px ${FACE.css}`)) GW.set(ch, v); } return v; };
