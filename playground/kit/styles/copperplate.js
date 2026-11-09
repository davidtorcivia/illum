// Copperplate (research/23-copperplate.md) as a written style of the one library (kit/illum.js: rubricate(root, { style:
// 'copperplate' })), two kinds:
//   kind 'pen' (default)  B, the writing master's pen: one great slanted oval round an Imperial Script capital, the whole
//                         written as one gesture (a touch-down curl into the capital, the capital's last end sweeping round the
//                         foot into the oval, the oval closing in a curl); the copybook's single connected gestures for every
//                         other piece. Black-brown iron gall, crisp, deeper where the hand slowed; the dark page white ink.
//   kind 'hand'           C, command of hand after Bickham: a rosette of ovals within and through each other round a cut
//                         Fraktur capital (UnifrakturMaguntia), dot-curls and thorns; loop chains riding fine sweeps for the
//                         rest. Engraved lace: intaglio black, hairlines finer than a pixel laid as coverage; the dark page ivory.
// Every stroke's weight is the flexible pen's pressure (copperplate-print.js press(), fitted to Bickham's own oval); every
// piece is a flat coverage laid as it is (no ink engine: its spread read as digital). Drawn (?draw), each piece is written along
// its paths in the hand's order at the hand's pace (the capital along its skeleton), revealed as the pen reaches each point:
// nothing fades; a ball arrives with its stroke's end.
//   initial(o) -> { letters, width }   paraph(x, base, u, seed, rich)   filler(x0, x1, yTop, yBase, kind, seed, rich)
//   breakMark(cx, y, measure, rank, seed, rich, u)   frames.{ quote, aside, pull, figure, code, nav }   palette.{ light, dark }
//   print(made, { dpr, kind, animate }) -> { pours, letters, seq, runs, y0 }   timeline(printed, kind, animate)
import * as P from './copperplate-pieces.js';
import { coverage, glyph, thinShades, thinShadesFine, poolMap } from './copperplate-print.js';
import { letterWriter } from '../inkletter.js';
import { stream } from '../marks.js';

let KIND = 'pen';
const INKS = {
  pen: { light: { k: [46, 32, 24] }, dark: { k: [226, 214, 192] }, pool: { light: [22, 14, 10], dark: [248, 240, 224] } },
  hand: { light: { k: [30, 25, 24] }, dark: { k: [222, 210, 186] } },
};
export const palette = { get light() { return INKS[KIND].light; }, get dark() { return INKS[KIND].dark; } };
const isDark = () => { try { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } };

// the capitals' faces (fonts/: Imperial Script cut to A-Z and renamed, OFL; UnifrakturMaguntia, OFL, unmodified), each fetched
// only when its kind is used
const FACES = { pen: ['CopperB', 'copperplate/illum-copper-imperial-caps.woff2'], hand: ['CopperC', 'UnifrakturMaguntia-Book.woff2'] }, fontDir = new URL('../../fonts/', import.meta.url), LOADING = new Map();
const loadFace = k => { const [family, file] = FACES[k]; if (!LOADING.has(k)) LOADING.set(k, new FontFace(family, `url(${new URL(file, fontDir)})`).load().then(f => document.fonts.add(f)).catch(e => console.warn('copperplate:', e))); return LOADING.get(k); };

// ---- placing pieces -----------------------------------------------------------------------------------------------------------------
// a piece: build(d) -> { W, H, strokes, letter?, letterAfter?, medium } in its own px, placed with its (0, 0) at x, y; turn: half round
const vary = () => copperplate.seeded | 0;
const piece = (x, y, build, what, seed) => ({ shape: 'copper', x, y, build, what, seed, kind: KIND, bkey: [KIND, what, seed, vary()].join('|') });
const none = { marks: [], letters: [] };
const fsOf = u => u * 2.45, lhOf = u => u * 2.45 * 1.6;
const letterOf = ch => { const c = String(ch).normalize('NFD')[0].toUpperCase(); return /[A-Z]/.test(c) ? c : 'O'; };
// a piece's size before it is built (its box: placing it needs it): built once at the page's dpr, kept
const SIZE = new Map(); const sizeOf = (key, f) => { if (!SIZE.has(key)) { const p = f(2); SIZE.set(key, [p.W, p.H]); } return SIZE.get(key); };

// ---- the initials -----------------------------------------------------------------------------------------------------------------
function initial({ ch = 'B', G, big = true, seed = 1, rich = .5 }) {
  const c = letterOf(ch), [x0, y0, x1, y1] = G.box, H = y1 - y0, v = vary();
  if (big) { const f = d => KIND === 'pen' ? P.PIECES.pen.initial(c, H, seed, d, { vary: v, rich }) : P.PIECES.hand.initial(c, H, seed, d, { rich, vary: v });
    const [W] = sizeOf(['drop', KIND, c, H.toFixed(1), seed, rich, v].join('|'), f);
    return { marks: [], letters: [piece(x0, y0, f, `drop:${c}:${H.toFixed(1)}:${rich}`, seed)], width: W }; }
  const Hl = Math.min((x1 - x0) / (initial.line(c) + .05), H * 1.8), f = d => KIND === 'pen' ? P.penLine(c, Hl, seed, d) : P.handLine(c, Hl);
  const [W] = sizeOf(['line', KIND, c, Hl.toFixed(1), seed].join('|'), f);
  return { marks: [], letters: [piece(x0 - (KIND === 'pen' ? Hl * .42 : 0), y1 - Hl * .91, f, `line:${c}:${Hl.toFixed(1)}`, seed)], width: W };
}
// (the float's width in the capital's heights: the drop's piece is H x 1.06 (pen) or 1.12 (hand); in the line, the capital alone,
// a pen lead-in reaching back into the word space before it)
initial.width = () => KIND === 'pen' ? 1.06 : 1.12;
initial.line = () => KIND === 'pen' ? .95 : .9;
initial.margin = .34; initial.lines = 4; initial.phone = 3;
initial.load = () => loadFace(KIND);

// ---- paraph, fillers, breaks --------------------------------------------------------------------------------------------------------
// (the forms down the page: B's by the paragraph (its number k and its seed) (oval, looped stem, swash); C's only on a page given its own
// seed (the two loops, the trefoil, the loop and curl), and at lavish; the unseeded C page keeps its approved paraph)
function paraph(x, base, u, seed, rich = .5, chapter = 1, k = 0) {
  const v = vary(), h = (Math.imul(seed ^ v * 40503, 2654435761) >>> 0) % 3, form = KIND === 'pen' ? h : v || rich >= 1 ? h : 0;
  const fs = u * 1.6, f = d => KIND === 'pen' ? P.PIECES.pen.paraph(fs, seed, d, form) : P.PIECES.hand.paraph(fs, seed, d, form), [W, H] = sizeOf(['paraph', KIND, fs.toFixed(2), seed, form].join('|'), f);
  return { marks: [], letters: [piece(x + u * .82 - W / 2, base - H * (KIND === 'pen' ? .9 : form === 1 ? .85 : .92), f, `paraph:${fs.toFixed(2)}:${form}`, seed)] };
}
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  if (kind === 'none' || rich < .25) return none;
  const u = yBase - yTop, lh = lhOf(u), room = x1 - x0 - u * .4;
  // (restraint: a heading runs out when there is room; a paragraph's free end is closed only when it is left well open)
  if (room < u * (kind === 'rule' ? 6 : rich >= 1 ? 8 : rich >= .75 ? 12 : rich >= .5 ? 18 : 26)) return none;
  // (the form by the line's own seed: B's always varies; C's on a seeded page, or from fine up where the room is long (the wing on some lines; lavish all three forms))
  const v = vary(), h = (Math.imul(seed ^ v * 40503, 2654435761) >>> 0) % 3, form = KIND === 'pen' ? h : v ? h : rich >= .75 && room > u * 28 && h !== 1 ? (rich >= 1 ? h : 1) : 0;
  const gw = Math.min(room, kind === 'rule' ? u * 22 : u * 40), f = d => kind === 'rule' ? (KIND === 'pen' ? P.penRule(gw, lh, seed, d) : P.handRule(gw, lh, seed, d)) : KIND === 'pen' ? P.PIECES.pen.filler(gw, lh, seed, d, form) : P.PIECES.hand.filler(gw, lh, seed, d, { form });
  const [, H] = sizeOf(['filler', KIND, kind, gw.toFixed(1), u.toFixed(2), seed, form].join('|'), f);
  return { marks: [], letters: [piece(x0 + u * .4, yBase - u * .5 - H * .5, f, `filler:${kind}:${gw.toFixed(1)}:${u.toFixed(2)}:${form}`, seed)] };
}
// three ranks: a part's (rank 1: the page's plain breaks), the chapter's (rank 3 here: data-rank 3), the book's end (rank 2)
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8, index, room) {
  const deep = room ? room[1] - room[0] : u * 10, r = rank === 2 ? 2 : rank >= 3 ? 1 : 0, rr = rich < .25 ? 0 : rich >= (KIND === 'pen' ? .75 : 1) && r < 2 ? r + 1 : r;   // (B's breaks rise a rank from fine, C's at lavish)
  const W = rr === 2 ? Math.min(measure * .9, u * 70) : rr === 1 ? Math.min(measure * .78, u * 56) : Math.min(measure * .6, u * 40), hb = Math.min(deep * .9, rr === 2 ? u * (KIND === 'pen' ? (rich >= 1 ? 9 : 7) : 8) : u * (rr === 1 ? 5 : 4.4));
  // (C: the band's form by the seed (the band, the wing, the twin), the chapter's the wing from fine up; the end's rosette larger
  // from fine up)
  const v = vary(), form = KIND === 'hand' && rr < 2 ? (v ? (Math.imul(seed ^ v * 40503 ^ rr, 2654435761) >>> 0) % 3 : rr === 1 && rich >= .75 ? 1 : 0) : 0;
  const hb2 = KIND === 'hand' && rr === 2 ? (rich >= .75 ? Math.min(deep * .95, u * (rich >= 1 ? 12 : 10)) : hb) : hb;
  const f = d => KIND === 'pen' ? P.penBreak(W, hb, rr, seed, d, rich) : P.handBreak(W, hb2, rr, seed, d, rich, form, v), [Wb, Hb] = sizeOf(['break', KIND, rr, W.toFixed(1), hb2.toFixed(1), seed, rich, form, v].join('|'), f);
  const out = [piece(cx - Wb / 2, y - Hb / 2, f, `break:${rr}:${W.toFixed(1)}:${hb2.toFixed(1)}:${rich}:${form}`, seed)];
  return { marks: [], letters: out };
}

// ---- frames ----------------------------------------------------------------------------------------------------------------------
const linesBox = (box, lines) => !lines?.length ? box : [Math.min(...lines.map(L => L.left)), lines[0].top, Math.max(...lines.map(L => L.right)), lines.at(-1).base];
const corner = (cs, seed, turn) => d => { const p = P.PIECES[KIND].corner(cs, seed, d); return turn ? P.turned(p) : p; };
const frames = {
  // a quotation: in along its head from the far end, a knot or an oval at the corner, down the margin into a curl
  quote: ({ box, lines, u, seed = 1, rich = .5 }) => { if (rich < .25) return none; const L = linesBox(box, lines), cs = u * 2.45, f = corner(cs, seed, false), [W] = sizeOf(['quote', KIND, cs.toFixed(2), seed].join('|'), f);
    return { marks: [], letters: [piece(L[0] - cs * .9, L[1] - cs * 1.6, f, 'quote:' + cs.toFixed(2), seed)], width: W }; },
  // an aside: the pen's bracket down its margin (B), a chain of loops down a fine sweep (C)
  aside: ({ box, u, seed = 1, rich = .5 }) => { if (rich < .5) return none; const [X0, Y0, , Y1] = box, H = Y1 - Y0, f = d => KIND === 'pen' ? P.penBracket(H, u, seed, d) : P.handChain(H, u, seed, d);
    const [W] = sizeOf(['aside', KIND, H.toFixed(1), u.toFixed(2), seed].join('|'), f); return { marks: [], letters: [piece(X0 - W - u * .4, Y0, f, `aside:${H.toFixed(1)}`, seed)] }; },
  // a pull quote: its head a break's gesture, its foot the same turned round
  pull: ({ cx, yTop, yBot, measure, u, seed = 1, rich = .5 }) => { if (rich < .25) return none; const W = Math.min(measure * .55, u * 36), hb = u * 3.6;
    const f = turn => d => { const p = KIND === 'pen' ? P.penBreak(W, hb, 0, seed, d) : P.handBreak(W, hb, 0, seed, d); return turn ? P.turned(p) : p; };
    return { marks: [], letters: [piece(cx - W / 2, yTop - hb * .55, f(false), 'pullH:' + W.toFixed(1), seed), piece(cx - W / 2, yBot - hb * .45, f(true), 'pullF:' + W.toFixed(1), seed)] }; },
  // a figure: the quotation's corner at its head left, the same turned round at its foot right
  figure: ({ box, cap, u, seed = 1 }) => { const cs = u * 2.45, X0 = box[0] - u * 1.6, Y0 = box[1] - u * 1.6, X1 = box[2] + u * 1.6, Y1 = (cap ?? box[3]) + u * 1.6;
    const a = corner(cs, seed, false), b = corner(cs, seed + 1, true), [W, H] = sizeOf(['quote', KIND, cs.toFixed(2), seed].join('|'), a), [W2, H2] = sizeOf(['quoteT', KIND, cs.toFixed(2), seed + 1].join('|'), b);
    // (held inside the page on a phone, where the box runs to the gutter)
    const R = (globalThis.document?.documentElement.clientWidth ?? Infinity) - u * .5;
    return { marks: [], letters: [piece(Math.max(u * .5, X0 - cs * .9), Y0 - cs * .4, a, 'figA:' + cs.toFixed(2), seed), piece(Math.min(R - W2, X1 - W2 + cs * .9), Y1 - H2 + cs * .4, b, 'figB:' + cs.toFixed(2), seed + 1)] }; },
  // code: a lighter bracket (B), a short chain (C), down its left
  code: ({ box, u, seed = 1, rich = .5 }) => { if (rich < .5) return none; const [X0, Y0, , Y1] = box, H = Y1 - Y0 - u * 2, f = d => KIND === 'pen' ? P.penBracket(H, u * .8, seed, d, true) : P.handChain(H, u * .8, seed, d, 2);
    const [W] = sizeOf(['code', KIND, H.toFixed(1), u.toFixed(2), seed].join('|'), f); return { marks: [], letters: [piece(X0 + u * .6 - W * .3, Y0 + u, f, `code:${H.toFixed(1)}`, seed)] }; },
  // the contents: a small mark before each entry (the copybook's oval, a dot-curl)
  nav: ({ box, entries, u, seed = 1 }) => { const E = entries.filter(Boolean); if (!E.length) return none; const s = u * 1.5;
    return { marks: [], letters: E.map((e, i) => { const f = d => KIND === 'pen' ? P.PIECES.pen.paraph(s, seed + i, d) : P.handDot(s * 1.2, seed + i, d), [W, H] = sizeOf(['nav', KIND, s.toFixed(2), seed + i].join('|'), f);
      return piece(box[0] - W - u * .9, e.base - H * .9, f, 'nav:' + s.toFixed(2), seed + i); }) }; },
};

// ---- printing --------------------------------------------------------------------------------------------------------------------
// A piece built at the device's resolution and laid as coverage, in its ink (and, for the pen, deeper where the hand slowed);
// kept by what it is, wherever it stands. Written (?draw), its reveal runs on the hand's clock: the strokes before the capital,
// the capital along its skeleton, the strokes after.
const MADE = new Map(); export const TIME = { build: 0, pieces: 0 };
const PAD = 6;
function made(b, dpr, dark) {
  const res = Math.max(2, dpr * 1.25), key = [b.bkey, b.what, res, dark].join('|'); let m = MADE.get(key); if (m) return m;
  const t0 = performance.now(), p = b.build(dpr), box = [-PAD, -PAD, p.W + PAD, p.H + PAD], strokes = p.strokes, tg = performance.now();
  const M = coverage(strokes, box, res); let Lm = null; const tc = performance.now(); TIME.geom = (TIME.geom ?? 0) + tg - t0; TIME.cover = (TIME.cover ?? 0) + tc - tg;
  if (p.letter) { const { ch, face, cap, cx, cy, thin = .3, fine = false } = p.letter, draw = glyph(ch, face, cap, cx, cy);
    // (worked on the capital's own box, cell-aligned to the piece's grid, then set into it: the cut's cost is the letter's, not
    // the flourish's)
    const gb = draw.box, i0 = Math.max(0, Math.floor((gb[0] - 3 - box[0]) * res)), j0 = Math.max(0, Math.floor((gb[1] - 3 - box[1]) * res)), i1 = Math.min(M.w, Math.ceil((gb[2] + 3 - box[0]) * res)), j1 = Math.min(M.h, Math.ceil((gb[3] + 3 - box[1]) * res));
    const sb = [box[0] + i0 / res, box[1] + j0 / res, box[0] + i1 / res, box[1] + j1 / res];
    const Ls = fine ? thinShadesFine(draw, sb, res, thin, res * .9, 2) : thin ? thinShades(coverage([], sb, res, draw), thin, res * .9) : coverage([], sb, res, draw);
    Lm = { M: new Float32Array(M.w * M.h), w: M.w, h: M.h, x0: box[0], y0: box[1], res };
    for (let j = 0; j < Ls.h && j0 + j < M.h; j++) for (let i = 0; i < Ls.w && i0 + i < M.w; i++) Lm.M[(j0 + j) * M.w + i0 + i] = Ls.M[j * Ls.w + i];
    for (let i = 0; i < M.M.length; i++) if (Lm.M[i] > M.M[i]) M.M[i] = Lm.M[i]; TIME.cut = (TIME.cut ?? 0) + performance.now() - tc; }
  const tint = p.medium === 'ink' ? poolMap(strokes, M) : null, ink = INKS[b.kind], rgb = (dark ? ink.dark : ink.light).k, rgb2 = ink.pool?.[dark ? 'dark' : 'light'];
  const cv = new OffscreenCanvas(M.w, M.h), g = cv.getContext('2d'), im = g.createImageData(M.w, M.h);
  for (let i = 0; i < M.M.length; i++) { const a = M.M[i]; if (!a) continue; const k = tint ? tint[i] : 0;
    for (let j = 0; j < 3; j++) im.data[i * 4 + j] = Math.round(rgb[j] + (k && rgb2 ? (rgb2[j] - rgb[j]) * k : 0)); im.data[i * 4 + 3] = Math.round(Math.min(1, a) * 255); }
  g.putImageData(im, 0, 0);
  m = { p, cv, M, Lm, res, box }; const dt = performance.now() - t0, wk = b.what.split(':')[0]; TIME.build += dt; TIME[wk] = (TIME[wk] ?? 0) + dt; TIME.pieces++; if (MADE.size > 400) MADE.clear(); MADE.set(key, m); return m;
}
// the hand's clock for a piece: [{ kind: 'stroke', S, t0, t1 } | { kind: 'letter', t0, t1 }] in ms
function clock(p, big) {
  const out = []; let t = 0, n = p.letterAfter ?? 0;
  const strokes = p.strokes.map(S => ({ S, d: (S.t?.at(-1) ?? 300) }));
  const add = S => { out.push({ kind: 'stroke', S: S.S, t0: t, t1: t + S.d }); t += S.d + 120; };
  strokes.slice(0, n).forEach(add);
  if (p.letter) { const d = big ? 1300 : 520; out.push({ kind: 'letter', t0: t, t1: t + d }); t += d + 120; }
  strokes.slice(n).forEach(add);
  return { out, T: Math.max(1, t - 120) };
}
function grower(b, m, big) {
  const { p, res, box, Lm } = m, { out, T } = clock(p, big), w = m.M.w, h = m.M.h, x0 = b.x + box[0], y0 = b.y + box[1];
  const acc = new OffscreenCanvas(w, h), ag = acc.getContext('2d'); ag.setTransform(res, 0, 0, res, -box[0] * res, -box[1] * res); ag.fillStyle = '#000';
  const done = out.map(() => 0); let lorder = null, lat = 0, limg = null;
  if (Lm) { const L = { ...Lm }; letterWriter(null, L, { k: [0, 0, 0] }, { dpr: 1 }); const T2 = L.order.T, idx = []; for (let q = 0; q < Lm.M.length; q++) if (Lm.M[q] > .01) idx.push(q); idx.sort((a, c) => T2[a] - T2[c]); lorder = { idx, T: T2 }; limg = new ImageData(w, h); }
  const fn = (k, f) => { const now = Math.min(1, f) * T;
    out.forEach((e, i) => { if (now < e.t0) return;
      if (e.kind === 'stroke') { const S = e.S, tt = S.t ?? S.p.map((_, j) => j), te = now - e.t0; let j = done[i];
        while (j < S.p.length && tt[j] <= te) { const r = (S.w[j] ?? .5) + 1.2; ag.beginPath(); ag.arc(S.p[j][0], S.p[j][1], r, 0, 7); ag.fill(); j++; }
        if (j >= S.p.length && done[i] < S.p.length) for (const [c, r] of S.balls ?? []) { ag.beginPath(); ag.arc(c[0], c[1], r + 1.2, 0, 7); ag.fill(); }
        done[i] = j; }
      else if (lorder) { const u = Math.min(1, (now - e.t0) / (e.t1 - e.t0)), n = lorder.idx.length; let a = lat;
        while (a < n && lorder.T[lorder.idx[a]] <= u) { limg.data[lorder.idx[a] * 4 + 3] = 255; a++; }
        if (a > lat) { lat = a; const tmp = new OffscreenCanvas(w, h); tmp.getContext('2d').putImageData(limg, 0, 0); ag.save(); ag.setTransform(1, 0, 0, 1, 0, 0); ag.drawImage(tmp, 0, 0); ag.restore(); } } });
    k.drawImage(acc, x0, y0, w / res, h / res); };
  return { fn, T };
}
function print(made_, { dpr = 1, animate = false, kind } = {}) {
  const dark = isDark(), pours = [], seq = [];
  for (const b of made_.letters ?? []) { if (b.shape !== 'copper') continue;
    const m = made(b, dpr, dark), x0 = b.x + m.box[0], y0 = b.y + m.box[1], big = kind === 'drop';
    const pour = { M: m.M.M, w: m.M.w, h: m.M.h, x0, y0, res: m.res, col: 'k', paint: g => g.drawImage(m.cv, x0, y0, m.M.w / m.res, m.M.h / m.res) };
    if (animate) { const gr = grower(b, m, big); pour.grow = { fn: gr.fn, mode: 'reveal' }; seq.push({ pour, d: gr.T / 1000 }); } else seq.push({ pour, d: 0 });
    pours.push(pour); }
  const ys = (made_.letters ?? []).map(b => b.y);
  return { pours, letters: [], seq, runs: [], y0: ys.length ? Math.min(...ys) : 0 };
}
// a case on the hand's clock: its pieces one after another, each at the hand's pace (a frame's two corners, a pull quote's head
// and foot, a contents' marks)
function timeline(pr, kind, animate) {
  const own = []; let u = 0;
  for (const e of pr.seq) { const d = animate ? e.d : 0; own.push({ t0: u, t1: u + d, pour: e.pour }); u += d; }
  return { own, u: Math.max(u, .01), cap: kind === 'drop' ? 7 : 3 };
}

export const copperplate = { label: 'Copperplate', minGap: 2, theme: { rubric: 'rgb(46 32 24)', rubricDark: 'rgb(226 214 192)' },
  setup: () => ({}), kinds: (v, rich) => rich < .25 ? ['none'] : ['row'],
  fillAt: { gap: .6, head: 3, rise: 1 }, hurry: [4, 1, 1.5, 1.6], steady: ['drop'],
  paraph, filler, breakMark, initial, frames, palette, print, timeline,
  // kind: 'pen' (B, the default) | 'hand' (C)
  set kind(v) { KIND = v === 'hand' ? 'hand' : 'pen'; }, get kind() { return KIND; },
  get variant() { return KIND; } };
export default copperplate;
