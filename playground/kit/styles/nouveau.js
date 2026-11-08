// Nouveau: Art Nouveau's book ornament, 1895–1905 (research/19-nouveau.md), as a written style of the one library
// (kit/illum.js: rubricate(root, { style: 'nouveau' }); tests/nouveau.html puts it in the registry). Two directions, one hand:
//   kind 'plante' (default)  the plant in a panel, after Grasset's La plante (1896): a painted arch-topped panel, the Böcklin
//       letter applied in rose with a contour that has a hand, iris blades and a stem grown up the letter's side, the iris
//       where the panel's gap is widest; poppies, buds and blades through the page. paint 'watercolour' (default: each
//       colour a transparent wash, pooled at its edge and toward one side, lifted where the brush ran dry, a back-run here
//       and there; a fine sepia line over it, feathering into the washes laid wet) | 'printed' (a chromolithograph: a
//       stone an ink, trapped, slipped, its grain, the key last).
//   kind 'fouet'  the line itself, after the Combinaisons ornementales (1901) and Obrist (1895): a whiplash walked by a hand
//       (its curvature loosened and tightened, its loops unequal), echoing the letter's bowls, winding into a spiral with a
//       pooled eye, a seed head on the counter-stem. fpaint 'wash' (default: the whip a laid wash of colour, a fine ink line
//       down it bleeding where the wash was damp) | 'gouache' (opaque body colour, an even coat, a faint brush grain, the
//       colours a touch off register).
// Every piece is built as a plate (nouveau-pieces.js, nouveau-flora.js, nouveau-line.js; nouveau-print.js's Plate) in its
// own px, placed on the page here, and printed through the ink engine: each ink a mask (its tone, grain or wash encoded
// in its coverage) poured with inkLetter, as rubricate pours a printed style's colours. Drawn (?draw), each pour is
// revealed in growth order (stems and lines along their length, leaves and petals out from their base, so the flowers
// open), never faded; the finished state is the still.
//   initial(o) -> { letters, width }   paraph(x, base, u, seed, rich, n)   filler(x0, x1, yTop, yBase, kind, seed, rich)
//   breakMark(cx, y, measure, rank, seed, rich, u, n)   frames.{ quote, aside, pull, figure, code, nav }   palette.{ light, dark }
//   print(made, { dpr, kind, animate, seed }) -> { pours, letters, seq, runs, y0 }   timeline(printed, kind, animate)
import { stream, noise2 } from '../marks.js';
import { stroke, path, loadLetter, setHand } from './nouveau-line.js';
import { stone, grain, blur } from './nouveau-print.js';
import * as PC from './nouveau-pieces.js';

let KIND = 'plante', PAINT = 'watercolour', FPAINT = 'wash';
const LET = {};   // the Böcklin capitals loaded (fonts/nouveau/bocklin-X.json)
const letterOf = ch => { const c = String(ch).normalize('NFD')[0].toUpperCase(); return /[A-Z]/.test(c) ? c : 'O'; };

// ---- palettes --------------------------------------------------------------------------------------------------------------------
// Light: Grasset's plates' inks on the page's paper (sage, iris violet, poppy vermilion, the rose letter, a warm sepia
// line). Dark: designed, not inverted: the panel a deep olive, the colours lifted, the line a pale gold, as gold-outlined
// enamel; the whip's ochre as Obrist's gold silk on grey.
const FOUET = { light: { letter: [52, 48, 32], whip: [184, 112, 52], olive: [96, 106, 56], k: [112, 66, 34] },
                dark: { letter: [224, 208, 168], whip: [218, 154, 86], olive: [158, 170, 104], k: [240, 196, 132] } };
export const palette = {
  get light() { return KIND === 'fouet' ? FOUET.light : PAINT === 'printed' ? PC.PAL.plante.light : PC.PALW.light; },
  get dark() { return KIND === 'fouet' ? FOUET.dark : PAINT === 'printed' ? PC.PAL.plante.dark : PC.PALW.dark; },
};
const ORDER = { fouet: ['olive', 'whip', 'letter', 'k'], plante: PC.ORDER.plante };

// ---- placing pieces ---------------------------------------------------------------------------------------------------------------
// a piece: built when it is printed (its plate in its own px), set at x, y on the page (y may be moved by rubricate's fitIn)
const piece = (x, y, w, h, build, seed) => ({ shape: 'nv', x, y, w, h, build, seed });
const hand = (f, seed) => { if (KIND === 'fouet') setHand(.55, seed); try { return f(); } finally { setHand(0); } };

// ---- the initials ---------------------------------------------------------------------------------------------------------------
// The drop: B's panel or A's whip round the letter, as tall as the drop (its top on the first line's cap height, its foot on
// the last baseline). In the line: the letter painted with one small growth off it.
const BIG = { plante: b => .1 + .56 * b + .38, fouet: b => .2 + .6 * b + .34 }, SMALL = { plante: b => .04 + b + .55, fouet: b => .04 + b + .5 };
function initial({ ch = 'B', G, big = true, seed = 1, u = 8 }) {
  const c = letterOf(ch), J = LET[c], [x0, y0, , y1] = G.box, H = y1 - y0;
  if (!J) return { marks: [], letters: [], width: H };
  if (!big) { const W = SMALL[KIND](J.b[2]) * H; return { marks: [], letters: [piece(x0, y0, W, H, () => hand(() => PC.smallInitial(KIND, J, H, seed), seed), seed)], width: W }; }
  const W = BIG[KIND](J.b[2]) * H;
  return { marks: [], letters: [piece(x0, y0, W, H, () => hand(() => KIND === 'fouet' ? PC.fouetInitial(J, H, seed) : PC.planteInitial(J, H, seed), seed), seed)], width: W };
}
initial.width = ch => { const J = LET[letterOf(ch)]; return J ? BIG[KIND](J.b[2]) : 1.2; };
initial.line = ch => { const J = LET[letterOf(ch)]; return J ? SMALL[KIND](J.b[2]) : 1.2; };
initial.lines = 4;    // the composition is drawn for four lines (the host's data-lines rules)
initial.phone = 3;
initial.margin = .32;
initial.fills = true;
initial.load = () => { const need = new Set(['B', 'O']); try { document.querySelectorAll('.ini').forEach(s => need.add(letterOf(s.textContent))); } catch {}
  return Promise.all([...need].map(c => loadLetter(c).then(j => { LET[c] = j; }))); };

// ---- the paraph, fillers, breaks -------------------------------------------------------------------------------------------------
function paraph(x, base, u, seed, rich = .5) {
  const h = u * 2.1, w = u * 1.65;
  return { marks: [], letters: [piece(x, base - h * .96, w, h, () => hand(() => PC.paraphPiece(KIND, w, h, seed), seed), seed)] };
}
// a paragraph's free end: the filler drawn for a line (lh: a line's height); a heading's run-out, a short one
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  if (kind === 'none') return { marks: [], letters: [] };
  const u = yBase - yTop, lh = u * 3.3, room = x1 - x0 - u * .4, L = kind === 'rule' ? Math.min(room, u * 16) : Math.min(room, u * 44);
  if (L < u * (kind === 'rule' ? 5 : 9)) return { marks: [], letters: [] };
  const y = yBase - lh * .64, f = KIND === 'fouet' ? PC.fouetFiller : PC.planteFiller;
  return { marks: [], letters: [piece(x0 + u * .2, y, L, lh, () => hand(() => f(L, lh, seed), seed), seed)] };
}
// three ranks: a part (rank 1, half the measure), a chapter or book (rank 2, wider and taller, the seed head or the two
// irises), the end (rank 3, across the measure)
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8) {
  const W = rank > 2 ? measure * .92 : rank > 1 ? Math.min(measure * .72, u * 62) : Math.min(measure * .52, u * 42), h = u * (rank > 1 ? 7 : 5.6);
  const f = KIND === 'fouet' ? PC.fouetBreak : PC.planteBreak;
  return { marks: [], letters: [piece(cx - W / 2, y - h / 2, W, h, () => hand(() => f(W, h, seed, rank), seed), seed)] };
}

// ---- frames ----------------------------------------------------------------------------------------------------------------------
const linesBox = (box, lines) => !lines?.length ? box : [Math.min(...lines.map(L => L.left)), lines[0].top, Math.max(...lines.map(L => L.right)), lines.at(-1).base];
const margin = (xl, top, bot, u, seed) => { const w = u * 3, h = bot - top + u * 2.4; if (h < u * 6) return [];
  return [piece(xl - u * 1.1 - w, top - u * 1.6, w, h, () => hand(() => PC.marginPiece(KIND, w, h, seed), seed), seed)]; };
const frameAround = ([X0, Y0, X1, Y1], t, seed, light) => { const bw = X1 - X0, bh = Y1 - Y0;
  return [piece(X0 - t, Y0 - t, bw + 2 * t, bh + 2 * t, () => hand(() => PC.framePiece(KIND, bw, bh, t, seed, light), seed), seed)]; };
const frames = {
  quote: ({ box, lines, u, seed = 1, rich = .5 }) => { const L = linesBox(box, lines); return { marks: [], letters: rich < .25 ? [] : margin(L[0], L[1], box?.[3] ?? L[3], u, seed) }; },
  aside: ({ box, lines, u, seed = 1, rich = .5 }) => { const L = linesBox(box, lines); return { marks: [], letters: rich < .25 ? [] : margin(L[0], L[1], L[3] + u * .3, u, seed + 4) }; },
  pull: ({ cx, yTop, yBot, measure, u, seed = 1, rich = .5 }) => { if (rich < .25) return { marks: [], letters: [] };
    const W = Math.min(measure * .42, u * 30), h = u * 4.4, f = KIND === 'fouet' ? PC.fouetBreak : PC.planteBreak;
    return { marks: [], letters: [piece(cx - W / 2, yTop - h * .8, W, h, () => hand(() => f(W, h, seed + 2, 1), seed + 2), seed), piece(cx - W / 2, yBot - h * .25, W, h, () => hand(() => f(W, h, seed + 7, 1), seed + 7), seed)] }; },
  figure: ({ box, cap, u, seed = 1, limit = [-1e9, 1e9], rich = .5 }) => { const room = Math.min(box[0] - limit[0], limit[1] - box[2]) - 2, t = Math.max(u * 1.2, Math.min(room, u * 2.8));
    return { marks: [], letters: frameAround([box[0], box[1], box[2], cap ?? box[3]], t, seed, rich < .25) }; },
  code: ({ box, u, seed = 1, rich = .5 }) => ({ marks: [], letters: frameAround([box[0] + u * 2.2, box[1] + u * 2.2, box[2] - u * 2.2, box[3] - u * 2.2], u * 2, seed + 2, true) }),
  nav: ({ box, entries, u, seed = 1 }) => { const h = u * 1.7, w = u * 1.4;
    return { marks: [], letters: entries.filter(Boolean).map((e, i) => piece(Math.max(4, box[0] - u * 1.2 - w), e.base - h * .96, w, h, () => hand(() => PC.paraphPiece(KIND, w, h, seed + i), seed + i), seed + i)) }; },
};

// ---- printing ------------------------------------------------------------------------------------------------------------------
// The plate's inks as masks. Each look encodes its paint in the coverage the ink engine is given (it lays a full coat above
// ~.55 of coverage; below, the paper's tooth shows through: a wash's transparency, a granulation):
//   litho (printed): the stone's grain (nouveau-print.js grain); a slip of register per ink.
//   wash: a transparent coat pooled toward the lower right and at its edge, lifted in streaks, a rare back-run; its shade
//     glazed into the same ink, denser (a darker tone of the same pigment).
//   gouache: an even opaque coat, a faint grain along one stroke direction, the edge a little irregular.
//   key (the line, A's letter): crisp; in wash, the line feathers into the inks laid damp (WASHDAMP), along the fibres.
const SHADE = { leaf: 'leafD', iris: 'irisD', irisL: 'irisLD', poppy: 'poppyD' }, SHADED = new Set(Object.values(SHADE));
const WASHDAMP = { plante: ['leaf', 'leafB', 'iris', 'irisL', 'poppy'], fouet: ['whip', 'olive'] };
const WASHM = { ground: .3, leafB: .36, beard: .44, crown: .42, letter: .46, poppyB: .4, whip: .5, olive: .5 };
function washTex(L, seed, Sh, m0) {
  const { M, w, h, x0, y0, res } = L, slow = noise2(seed ^ 0x2b), bl = noise2(seed ^ 0x47), lift = noise2(seed ^ 0x6d);
  const R = Math.round(2.2 * res), Bl = blur(blur(M, w, h, R), w, h, R), O = new Float32Array(w * h), Sb = Sh ? blur(Sh, w, h, Math.round(res * 1.2)) : null;
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (M[j * w + i] > .3) { bx0 = Math.min(bx0, i); bx1 = Math.max(bx1, i); by0 = Math.min(by0, j); by1 = Math.max(by1, j); }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, m = M[q]; if (m <= .01) continue; const x = x0 + i / res, y = y0 + j / res;
    const rim = Math.max(0, 1 - Bl[q]) * 1.7, gx = (i - bx0) / Math.max(1, bx1 - bx0), gy = (j - by0) / Math.max(1, by1 - by0);
    const pool = 1 + .3 * ((gx * .45 + gy * .9) / 1.35 - .5) * 2, lifted = 1 - .5 * Math.max(0, lift(x / 30 + y / 90, y / 14 - x / 60) - .62) * 2.2;
    const b = bl(x / 26, y / 26), back = b > .72 ? .82 : 1, lip = .35 * Math.exp(-Math.pow((b - .72) / .02, 2));
    const tone = pool * lifted * (back + lip) * (1 + .12 * (slow(x / 16, y / 16) - .5) * 2) * (1 + .55 * rim * rim);
    O[q] = Math.min(1, m * (m0 * tone + (Sb ? .3 * Sb[q] * M[q] : 0))); }
  return { ...L, M: O };
}
function gouacheTex(L, seed) {
  const { M, w, h, x0, y0, res } = L, B = blur(M, w, h, Math.max(1, Math.round(.5 * res))), rag = noise2(seed ^ 0x19), st = noise2(seed ^ 0x33), O = new Float32Array(w * h), a = (seed % 7) * .4, ca = Math.cos(a), sa = Math.sin(a);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, b = B[q]; if (b <= 0) continue; const x = x0 + i / res, y = y0 + j / res;
    const e = Math.max(0, Math.min(1, (b - .5 + .1 * (rag(x / 2.4, y / 2.4) - .5)) * 3 + .5)), along = x * ca + y * sa, across = -x * sa + y * ca;
    O[q] = e * (.66 + .06 * (st(along / 9, across / .7) - .5) * 2); }
  return { ...L, M: O };
}
function bleed(L, damp, seed) {
  const { M, w, h, x0, y0, res } = L, B1 = blur(blur(M, w, h, Math.round(1.2 * res)), w, h, Math.round(1.2 * res)), B2 = blur(blur(M, w, h, Math.round(2.8 * res)), w, h, Math.round(2.8 * res)), fib = noise2(seed ^ 0x5a), gate = noise2(seed ^ 0x3d), O = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const q = j * w + i, x = x0 + i / res, y = y0 + j / res, d = damp ? damp[q] * Math.max(0, Math.min(1, (gate(x / 22, y / 22) - .42) * 5)) : 0;
    const f = .7 + .6 * fib(x / 1.1 + y / 4, y / 1.1 - x / 4);
    O[q] = Math.max(M[q], d * Math.min(.62, (B1[q] * 1.1 + B2[q] * .5) * f)); }
  return { ...L, M: O };
}
// the plate's inks as pours, in the order they are laid
function pours(P, box, res, seed, dark) {
  const out = [], kind = KIND, wash = kind === 'plante' ? PAINT === 'watercolour' : FPAINT === 'wash', gou = kind === 'fouet' && FPAINT === 'gouache';
  const r = stream(seed, 'register'), slip = kind === 'plante' && !wash ? .6 : gou ? .55 : .25, keys = kind === 'fouet' ? ['letter', 'k'] : ['k'];
  const inks = ORDER[kind].filter(c => P.items.some(it => it.col === c)), damp = wash ? WASHDAMP[kind].filter(c => inks.includes(c)) : [];
  for (const col of inks) {
    if (wash && SHADED.has(col) && kind === 'plante') continue;   // (in watercolour a shade is glazed into its own colour's wash)
    const key = keys.includes(col), a = r() * Math.PI * 2, sl = key ? [0, 0] : [Math.cos(a) * slip, Math.sin(a) * slip];
    let L = stone(P, col, box, res, sl, key ? 0 : .45); if (!L) continue; const sd = seed + col.charCodeAt(0) * 13 + col.length;
    if (key && wash && damp.length) { const D = new Float32Array(L.w * L.h); for (const c of damp) { const W = stone(P, c, box, res, [0, 0], 0); if (W) for (let q = 0; q < D.length; q++) D[q] = Math.max(D[q], W.M[q]); } L = bleed(L, D, sd); }
    else if (!key && wash) { const S = SHADE[col] && kind === 'plante' ? stone(P, SHADE[col], box, res, sl, 0) : null; L = washTex(L, sd, S?.M, WASHM[col] ?? .4); }
    else if (!key && gou) L = gouacheTex(L, sd);
    else if (!key) L = grain(L, sd);
    out.push({ ...L, col, wet: key ? (wash ? .2 : .05) : wash ? .3 : .08, dry: key ? .16 : wash ? .3 : .1, items: P.items.filter(it => it.col === col || (wash && SHADE[col] === it.col)) });
  }
  return out;
}
// the fouet in wash: the whip laid as a wash wider than its line, and a fine ink line drawn down the middle of it; its eye
// a pooled drop of both
function asWash(P) {
  const add = [];
  for (const it of P.items) { if (!it.S || !['whip', 'olive'].includes(it.col)) continue; const S = it.S;
    it.path = path({ ...S, w: S.w.map(v => v * 1.6 + .35), eye: S.eye && [S.eye[0], S.eye[1], S.eye[2] * 1.2] });
    const T = { ...S, w: S.w.map(v => Math.max(.34, Math.min(v * .32, 1.1))), eye: S.eye && [S.eye[0], S.eye[1], S.eye[2] * .5] };
    add.push({ col: 'k', path: path(T), rule: 'nonzero', knock: false, S: T, cut: it.cut }); }
  P.items.push(...add);
}
// growth: each item's moment in the piece's growth (in the order it was drawn: stems before leaves, leaves before flowers),
// and how it comes: along its line (a stroke), out from its base (a leaf, a petal: the flower opens), else up from the foot
function growth(P, h) { const n = P.items.length; P.items.forEach((it, i) => { const t0 = n > 1 ? .78 * i / (n - 1) : 0; it.g = { t0, t1: Math.min(1, t0 + (it.S ? .32 : .26)), h }; }); }
function reveal(items, box) {
  const R = Math.hypot(box[2] - box[0], box[3] - box[1]);
  return (c, f) => { c.fillStyle = c.strokeStyle = '#000'; c.lineJoin = c.lineCap = 'round';
    for (const it of items) { const g = it.g; if (!g || f <= g.t0) continue; const e = Math.min(1, (f - g.t0) / (g.t1 - g.t0)), s = e * e * (3 - 2 * e);
      if (s >= 1) { c.fill(it.path, it.rule); c.lineWidth = 3; c.stroke(it.path); continue; }
      if (it.S) { const p = path(it.S, s); c.fill(p); c.lineWidth = 3; c.stroke(p); continue; }
      c.save(); c.beginPath(); if (it.at) c.arc(it.at[0], it.at[1], R * .5 * s, 0, Math.PI * 2); else c.rect(box[0], box[3] - (box[3] - box[1]) * s, box[2] - box[0], box[3] - box[1]); c.clip();
      c.fill(it.path, it.rule); c.lineWidth = 3; c.stroke(it.path); c.restore(); } };
}
const isDark = () => { try { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } };
function shift(P, dx, dy) { const M = new DOMMatrix().translate(dx, dy), mv = p => { const q = new Path2D(); q.addPath(p, M); return q; };
  for (const it of P.items) { it.path = mv(it.path); if (it.cut && !it.cut.mv) it.cut = { ...it.cut, path: mv(it.cut.path), mv: 1 }; if (it.at) it.at = [it.at[0] + dx, it.at[1] + dy];
    if (it.S && !it.S.mv) { it.S = { ...it.S, p: it.S.p.map(([x, y]) => [x + dx, y + dy]), eye: it.S.eye && [it.S.eye[0] + dx, it.S.eye[1] + dy, it.S.eye[2]], mv: 1 }; } } }
const CACHE = new Map();
function print(made, { dpr = 1, animate = false, kind } = {}) {
  const res = dpr >= 1.5 ? 2 : 1, all = [], seq = [], dark = isDark();
  for (const b of made.letters ?? []) { if (b.shape !== 'nv') continue;
    const key = [KIND, PAINT, FPAINT, dark, res, b.x.toFixed(1), b.y.toFixed(1), b.w.toFixed(1), b.h.toFixed(1), b.seed, animate].join('|');
    let list = CACHE.get(key);
    if (!list) { const { P } = b.build(); if (KIND === 'fouet' && FPAINT === 'wash') asWash(P); growth(P); shift(P, b.x, b.y);
      const box = [b.x - 8, b.y - 8, b.x + b.w + 8, b.y + b.h + 8]; list = pours(P, box, res, b.seed ?? 1, dark);
      if (animate) for (const p of list) p.grow = { mode: 'reveal', fn: reveal(p.items, box) };
      for (const p of list) delete p.items; if (CACHE.size > 400) CACHE.clear(); CACHE.set(key, list); }
    const d = kind === 'drop' ? 5 : kind === 'initial' ? 2 : Math.min(2.4, .9 + (b.w + b.h) / 600);
    for (const p of list) { all.push(p); seq.push({ pour: p, d }); }
  }
  const ys = (made.letters ?? []).map(b => b.y);
  return { pours: all, letters: [], seq, runs: [], y0: ys.length ? Math.min(...ys) : 0 };
}
// a case on the painter's clock: every ink of a piece over the same span (the growth order is in each pour's reveal), the
// pieces of a case one after another
function timeline(pr, kind, animate) {
  const own = []; let u = 0, cur = null, t = 0;
  for (const e of pr.seq) { if (e.d !== cur) { t = u; cur = e.d; u += animate ? e.d : 0; } own.push({ t0: animate ? t : 0, t1: animate ? t + e.d : 0, pour: e.pour }); }
  return { own, u: Math.max(u, .01), cap: kind === 'drop' ? 6 : 2.4 };
}

export const nouveau = { label: 'Nouveau', minGap: 2, theme: { rubric: 'rgb(176 92 70)', rubricDark: 'rgb(214 140 112)' },
  setup: () => ({}), kinds: (v, rich) => rich < .3 ? ['none'] : ['vine'],
  fillAt: { gap: .6, head: 3, rise: 1 },
  steady: ['drop'],
  paraph, filler, breakMark, initial, frames, palette, print, timeline,
  // (the site's Adjust sets these as the style's own module settings, { mod: true } in site/js/catalogue.js)
  set kind(v) { KIND = v === 'fouet' ? 'fouet' : 'plante'; }, get kind() { return KIND; },
  set paint(v) { PAINT = v === 'printed' ? 'printed' : 'watercolour'; }, get paint() { return PAINT; },
  set fpaint(v) { FPAINT = v === 'gouache' ? 'gouache' : 'wash'; }, get fpaint() { return FPAINT; } };
export default nouveau;
