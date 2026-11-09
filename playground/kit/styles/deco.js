// Deco: le filet, Art Deco's letterpress ornament (research/22-deco.md), as a written style of the one library (kit/illum.js:
// rubricate(root, { style: 'deco' }); tests/deco.html puts it in the registry). Brass rule set in a chase and a two-colour cut,
// printed in black and vermilion: the drop initial a Limelight capital (OFL) with an inline and a vermilion shadow in an
// Oxford-rule frame stepped at its head, the Chrysler doors' lotus behind it; the paraph a small lotus; the filler speed
// lines to the measure (a heading's an Oxford rule); three ranks of break (a lozenge between speed lines; a stepped plinth
// holding a sun; the lotus on its plinth over a Scotch rule); frames of Oxford rule (a quotation's margin, an aside's
// brackets, a figure's box) or a fine rule (code), a pull quote's sun between speed lines, a contents entry's square.
// Printed as letterpress through the ink engine (kit/inkletter.js, the press Kelmscott prints with): each forme poured whole
// (the ink squeezed to the rim, the edge pushed by the paper's grain), the vermilion a hair off register from the black, every
// piece of rule its own fraction of a degree and its own inking, a mitre's hairline seam; on the light page the impression's
// faint bite in the paper. Drawn (?draw), each piece is printed: its impression comes up as the platen rolls along it,
// vermilion forme first, then the black; never faded.
//   initial(o) -> { letters, width }   paraph(x, base, u, seed, rich)   filler(x0, x1, yTop, yBase, kind, seed, rich)
//   breakMark(cx, y, measure, rank, seed, rich, u)   frames.{ quote, aside, pull, figure, code, nav }   palette.{ light, dark }
//   print(made, { dpr, kind, animate }) -> { pours, letters, seq, runs, y0 }   timeline(printed, kind, animate)
import * as D from './deco-pieces.js';
import { mask } from './deco-print.js';
import { noise2, stream } from '../marks.js';

export const palette = {
  // g: the third forme, a metallic ink at fine and lavish only: a warm gold on the light page
  light: { k: [27, 25, 23], r: [192, 54, 32], b: [214, 204, 184], g: [178, 136, 66] },
  // the dark page: aluminium ink and a vermilion lifted to sit on black at the same weight as the light's (no bite: the
  // impression in a dark stock does not catch the light)
  dark: { k: [218, 214, 204], r: [230, 104, 72], g: [182, 188, 194] },   // (the dark page's metallic: aluminium, a cooler silver than the key's pale ink)
};
const isDark = () => { try { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } };
let BITE = true;
// The capitals' faces: one option, one family, one file (fonts/deco/: each an OFL face cut to A-Z with pyftsubset into woff2;
// a face with a Reserved Font Name renamed, its licence and a README beside it). A face is loaded only when a page selects it.
// To drop one from a build, remove its row here and its file (and its README); a setting naming it falls back to the default.
export const FACE_FILES = {
  limelight: { family: 'IllumDecoBroadway', file: 'illum-deco-broadway-caps.woff2' },   // Limelight (Sorkin Type; RFN), Broadway-like
  kalnia: { family: 'IllumDecoFatface', file: 'illum-deco-fatface-caps.woff2' },         // Kalnia Bold (Frida Medrano), Ultra Bodoni-like
  federo: { family: 'IllumDecoFeder', file: 'illum-deco-feder-caps.woff2' },             // Federo (Cyreal; RFN), Peignot-like
  italiana: { family: 'IllumDecoHairline', file: 'illum-deco-hairline-caps.woff2' },     // Italiana (Santiago Orozco; RFN), hairline
};
const DEFAULT = { drop: 'limelight', line: 'kalnia' };
const SEL = { drop: DEFAULT.drop, line: DEFAULT.line }, fontDir = new URL('../../fonts/deco/', import.meta.url), LOADING = new Map();
const pick = (v, d) => FACE_FILES[v] ? v : FACE_FILES[d] ? d : Object.keys(FACE_FILES)[0];
const setFace = (which, v) => { SEL[which] = pick(v, DEFAULT[which]); D.FACES[which] = FACE_FILES[SEL[which]].family; };
setFace('drop', DEFAULT.drop); setFace('line', DEFAULT.line);
const loadFace = key => { const { family, file } = FACE_FILES[key];
  if (!LOADING.has(key)) LOADING.set(key, new FontFace(family, `url(${new URL(file, fontDir)})`).load().then(f => { document.fonts.add(f); }).catch(e => console.warn('deco:', e)));
  return LOADING.get(key); };


// ---- a page asked for by seed ------------------------------------------------------------------------------------------------------
// A page given its own seed (deco.seeded, set by kit/illum.js; 0 when the page is left to its text's, and then null here: the page
// exactly as approved) is the same comp's job in another arrangement, its choices drawn once from the seed and kept through the
// page so its system holds: one outline for every frame (the drop's head stepped, all four corners stepped, the corners canted,
// or the portal's setbacks; the steps one to three), one rule (Oxford, Scotch, heavy-and-hair, double), one fillers' system
// (the cadence, the taper, the Oxford pair, the tower), one mark (paraphs and the middles of breaks and pull quotes: the setback,
// the lozenge, the square, the crown), one crown for the end and the colophon (the grille, the sun, the tower). Within the page
// each filler is closed by its own room (a line left wide open, a set length and the grand close; one nearly full, quadded to
// the measure with the small close). Every choice is one of the period's own (deco-pieces.js); none is noise.
const FRAMES = ['head', 'four', 'cant', 'portal'], RULES = ['oxford', 'scotch', 'heavy', 'twin'], FILLS = ['cadence', 'taper', 'oxford', 'tower'], MARKS = ['setback', 'lozenge', 'square', 'crown'], CROWNS = ['grille', 'sun', 'tower'];
let PAGE = null;
const page = () => { const sd = deco.seeded | 0; if (!sd) return null; if (PAGE?.sd === sd) return PAGE;
  const r = stream(sd, 'deco:page'), of = a => a[r() * a.length | 0];
  return PAGE = { sd, frame: of(FRAMES), rule: of(RULES), steps: 1 + (r() * 3 | 0), fill: of(FILLS), mark: of(MARKS), crown: of(CROWNS) }; };

// ---- placing pieces -------------------------------------------------------------------------------------------------------------
// a piece: build() -> { S, box } in its own px, (0, 0) at the piece's x, y
const piece = (x, y, w, h, build, seed, what) => ({ shape: 'deco', x, y, w, h, build, seed, what, bkey: [what, w.toFixed(1), h.toFixed(1), seed, D.FACES.drop, D.FACES.line, D.BURST.kind, D.BURST.lotus, ...(page() ? [page().sd] : [])].join('|') });
const none = { marks: [], letters: [] };
// a frame round a box is printed as its sides, each a piece of its own (the box's middle has no ink: it is never made or poured);
// m: how far the rule and its steps reach in from the box's edge
const once = f => { let v; return () => v ??= f(); };   // (the four sides share one build)
const sides = (x, y, W, H, build, seed, what, m) => { const b = once(build); return [[-m, -m, W + m, m], [-m, H - m, W + m, H + m], [-m, m, m, H - m], [W - m, m, W + m, H - m]]
  .map((box, i) => ({ ...piece(x, y, W, H, b, seed, what + ':' + i), box })); };

// ---- the initials -----------------------------------------------------------------------------------------------------------------
const letterOf = ch => { const c = String(ch).normalize('NFD')[0].toUpperCase(); return /[A-Z]/.test(c) ? c : 'O'; };
function initial({ ch = 'B', G, big = true, seed = 1, rich = .5 }) {
  const c = letterOf(ch), [x0, y0, x1, y1] = G.box, H = y1 - y0;
  if (big) { const W = x1 - x0 > 1 ? x1 - x0 : H, P = page(); return { marks: [], letters: [piece(x0, y0, W, H, () => D.dropInitial(c, H, seed, +rich, W, P), seed, `drop:${c}:${rich}`)], width: W }; }
  // in the line: the capital fills the room the span keeps for it (its font's cap, wider than the text's), its foot on the baseline
  const Hl = Math.min((x1 - x0) / (D.ratio(c, D.FACES.line) + .1), H * 1.8), r = D.lineInitial(c, Hl, seed);
  return { marks: [], letters: [piece(x0, y1 - Hl, r.W, Hl, () => D.lineInitial(c, Hl, seed), seed, 'line:' + c + ':' + Hl.toFixed(1))], width: r.W };
}
initial.line = ch => D.ratio(letterOf(ch), D.FACES.line) + .08;
initial.margin = .32;
// (at lavish the drop is a portal two lines deeper and a little narrower: its depth is set before the style is asked for it,
// so the style keeps the page's budget as a module setting, deco.rich, which the page sets with rubricate's own)
let BUDGET = .5;
Object.defineProperties(initial, { lines: { get: () => BUDGET >= 1 ? 6 : 4 }, phone: { get: () => BUDGET >= 1 ? 4 : 3 } });
initial.width = () => BUDGET >= 1 ? .82 : 1.02;
initial.load = () => Promise.all([...new Set([SEL.drop, SEL.line])].map(loadFace)).then(() => {});   // (only the faces in use)

// ---- the paraph, fillers, breaks ---------------------------------------------------------------------------------------------------
function paraph(x, base, u, seed, rich = .5) {
  const s = u * 1.9, P = page(); return { marks: [], letters: [piece(x - s * .1, base - s * .92, s, s, () => D.paraph(s, seed, +rich, P), seed, 'paraph:' + rich)] };
}
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  if (kind === 'none' || (kind === 'rule' && rich < .25)) return none;
  // (restraint: the usual page fills only a line left well open; a short end stays open until the page is richer)
  const u = yBase - yTop, room = x1 - x0 - u * .3, L = Math.min(room, kind === 'rule' ? u * 16 : u * (rich >= 1 ? 34 : 26));
  if (L < u * (kind === 'rule' ? 5 : rich >= 1 ? 6 : rich >= .75 ? 8 : rich >= .5 ? 22 : 30)) return none;
  // (a page with a seed: a line left wide open takes the set length and the grand close; one less open is quadded out to the
  // measure with the small close)
  const ht = u * 1.4, P = page(), grand = !!P && kind !== 'rule' && room >= u * 40, Lp = P && kind !== 'rule' && !grand ? room : L;
  return { marks: [], letters: [piece(x0 + u * .3, (yTop + yBase) / 2 - ht / 2, Lp, ht, () => D.filler(Lp, u, seed, kind, +rich, P, grand), seed, `filler:${kind}:${rich}` + (grand ? ':grand' : ''))] };
}
// three ranks: a part's (a short lozenge and speed lines), a chapter's (the plinth and its sun), the end's (the lotus over
// the Scotch rule, across the measure). The budget: plain, a part's narrower; lavish, a part's in a chapter's form
// The forms: a part (a lozenge between cadences), a chapter (the stepped portal holding a rising sun, cadences out), the end (the
// crown on its plinth over the Scotch rule, across the measure), and the colophon. A rank-1 break takes the chapter's form from
// fine up; the book's end (rank 2: the page's last and deepest break) is the colophon from modest up
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8, index, room) {
  const form = rank === 1 ? (rich >= .75 ? 'chapter' : 'part') : rank === 2 ? (rich >= .25 ? 'colophon' : 'part') : 'end';
  const deep = room ? room[1] - room[0] : u * 12, W = form === 'end' ? measure * .96 : form === 'chapter' ? Math.min(measure * .8, u * 64) : form === 'colophon' ? (rich >= 1 ? measure * .9 : u * 16) : u * (rich < .25 ? 14 : 20);
  const P = page(), ht = form === 'end' ? u * 6.4 : form === 'chapter' ? u * 6 : form === 'colophon' ? Math.min(u * 12, deep * .92) : P ? u * 2.8 : u * 2.2;
  const p = piece(cx - W / 2, y - ht / 2, W, ht, () => D.brk(W, ht, form, seed, u, +rich, P), seed, `break:${form}:${rich}:${u.toFixed(2)}`);
  // (the lavish colophon's wings are long and low: the cartouche and each wing printed as a piece of its own, one build)
  // (so are the chapter's and the end's: the engine's work is the box's, and a long low wing in a tall box is mostly paper)
  const split = form === 'colophon' && rich >= 1 ? [Math.min(W, ht * .78) + u, ht - u * 2.6, ht] : form === 'chapter' ? [ht * 1.7 + u * 1.2, ht * .92 - u * 1.6, ht] : form === 'end' ? [ht * 1.1 + u * .5, ht * .93 - u * 2, ht] : null;
  if (split) { const b = once(p.build), [cw, ya, yb] = split, x0 = W / 2 - cw / 2, x1 = W / 2 + cw / 2;
    return { marks: [], letters: [[x0, 0, x1, ht], [0, ya, x0, yb], [x1, ya, W, yb]].map((box, i) => ({ ...p, build: b, box, bkey: p.bkey + ':' + i, what: p.what + ':' + i })) }; }
  return { marks: [], letters: [p] };
}

// ---- frames ----------------------------------------------------------------------------------------------------------------------
const linesBox = (box, lines) => !lines?.length ? box : [Math.min(...lines.map(L => L.left)), lines[0].top, Math.max(...lines.map(L => L.right)), lines.at(-1).base];
const frames = {
  // a quotation: its margin an Oxford rule stood upright, turned in at head and foot
  quote: ({ box, lines, u, seed = 1, rich = .5 }) => { if (rich < .25) return none; const P = page(), L = linesBox(box, lines), top = L[1] - u * .6, len = (box?.[3] ?? L[3]) - top + u * .4, x = L[0] - u * 2.4;
    return { marks: [], letters: [piece(x, top, u * 2.4, len, () => D.marginRule(len, u, seed, +rich, P), seed, `margin:${rich}:${u.toFixed(2)}`)] }; },
  // an aside: two stepped brackets of Oxford rule, its head left and its foot right
  aside: ({ box, u, seed = 1, rich = .5 }) => { if (rich < .5) return none; const P = page(), [X0, Y0, X1, Y1] = box, W = X1 - X0, H = Y1 - Y0;
    const m = u * 4.6, o = P ? u * 2 : u; return { marks: [], letters: [{ ...piece(X0, Y0, W, H, () => D.brackets(W, H, u, seed, +rich, P), seed, 'aside:0:' + rich), box: [-o, -o, m, m] }, { ...piece(X0, Y0, W, H, () => D.brackets(W, H, u, seed, +rich, P), seed, 'aside:1:' + rich), box: [W - m, H - m, W + o, H + o] }] }; },
  // a pull quote: the sun between speed lines at its head, turned over at its foot
  pull: ({ cx, yTop, yBot, measure, u, seed = 1, rich = .5 }) => { if (rich < .25) return none; const W = Math.min(measure * .62, u * 44), ht = u * 3, P = page();
    return { marks: [], letters: [piece(cx - W / 2, yTop - ht * .55, W, ht, () => D.pullBand(W, ht, u, seed, false, +rich, P), seed, 'pullH:' + rich), piece(cx - W / 2, yBot - ht * .3, W, ht, () => D.pullBand(W, ht, u, seed + 3, true, +rich, P), seed + 3, 'pullF:' + rich)] }; },
  // a figure: a box of Oxford rule round the drawing and its caption (plain: square; from usual its corners stepped)
  figure: ({ box, cap, u, seed = 1, rich = .5 }) => { const P = page(), X0 = box[0] - u * 1.4, Y0 = box[1] - u * 1.4, W = box[2] - box[0] + u * 2.8, H = (cap ?? box[3]) + u * 1.4 - Y0;
    return { marks: [], letters: sides(X0, Y0, W, H, () => D.boxFrame(W, H, u, seed, { oxfordRule: true, steps: rich >= .5 ? 1 : 0, rich: +rich, P }), seed, `figure:${rich}`, u * (rich >= 1 ? 3.6 : 2.2)) }; },
  // code: a fine single rule round it, every corner stepped
  code: ({ box, u, seed = 1, rich = .5 }) => { if (rich < .5) return none; const P = page(), X0 = box[0] + u * 1.2, Y0 = box[1] + u * 1.2, W = box[2] - box[0] - u * 2.4, H = box[3] - box[1] - u * 2.4;
    return { marks: [], letters: sides(X0, Y0, W, H, () => D.boxFrame(W, H, u, seed, { oxfordRule: false, steps: 1, rich: +rich, P }), seed, `code:${rich}`, u * (rich >= 1 ? 3.6 : 2.2)) }; },
  // (the contents' marks are one piece, a column of them, printed at once: the same marks, a quarter of the pours)
  nav: ({ box, entries, u, seed = 1, rich = .5 }) => { const E = entries.filter(Boolean); if (!E.length) return none; const s = u * 1.6, x = Math.max(4, box[0] - s * 1.6), ys = E.map(e => e.base - u * .5 - s / 2), y0 = Math.min(...ys), H = Math.max(...ys) - y0 + s;
    // (lavish: a stepped index, the marks stepping in from the margin with dotted leaders out to the entries)
    if (rich >= 1) { const xi = Math.max(4, box[0] - u * 8.5), Wi = box[0] - u * .3 - xi; if (Wi > u * 4) return { marks: [], letters: [piece(xi, y0, Wi, H, () => D.navIndex(Wi, ys.map(y => y - y0), u, seed, s), seed, 'navIndex:' + ys.map(y => (y - y0).toFixed(1)).join(','))] }; }
    return { marks: [], letters: [piece(x, y0, s, H, () => D.navMarks(s, ys.map(y => y - y0), seed), seed, 'nav:' + ys.map(y => (y - y0).toFixed(1)).join(','))] }; },
};

// ---- printing ----------------------------------------------------------------------------------------------------------------------
// Each piece's formes made into coverage at the device's resolution (kept by what the piece is, wherever it stands), then poured
// as the ink engine's pours: the bite (light page), the vermilion, the black. Drawn, each pour is printed (sweepIn's press: the
// impression comes up as the platen rolls along the piece's length).
const MADE = new Map(); export const TIME = { masks: 0, pieces: 0 };
const SLIP = [.32, .22], SLIP_G = [-.24, .3];   // the vermilion's and the gold's register against the black, in px (each one forme for the page)
// the gold forme's coat: a flat coat with a slow, faint mottle (Schmied's gold measured ~11-13 %; here ±12 % over ~12 px), no
// gradient, no sheen, no fine grain
const METAL = noise2(0x6e7), GRAIN = noise2(0x45);
// a forme's coat, in place and in one pass: the press's edge (the antialiased rim pushed in or out a fraction of a px by the
// paper's grain, as deco-print.js press) and the coat (.84 of full; the gold's .8 with its mottle)
function coat(p, b, res, col) {
  const { M, w, h, x0, y0 } = p, amt = .35 * Math.min(1, 2 / res), gold = col === 'g', [a0, b0, a1, b1] = p.bb ?? [0, 0, w - 1, h - 1];
  for (let j = b0; j <= b1; j++) for (let i = a0, q = j * w + a0; i <= a1; i++, q++) { let m = M[q]; if (m <= 0) continue; const x = x0 + i / res, y = y0 + j / res;
    if (m > .02 && m < .98 && i && j && i < w - 1 && j < h - 1) { m += (GRAIN(x / 1.6, y / 1.6) - .5) * amt; m = m < 0 ? 0 : m > 1 ? 1 : m; }
    M[q] = gold ? m * .8 * (1 + .24 * (METAL((b.x + x) / 12, (b.y + y) / 12) - .5)) : m * .84; }
}
const merge = (A, B) => { for (let q = 0; q < A.length; q++) if (B[q] > A[q]) A[q] = B[q]; return A; };
// a coverage cut to where its ink is (a margin of 3 px kept for the engine's creep): a filler's close is a dot at the end of a
// long box, and the engine's work is the box's; null when there is no ink
function crop(p) {
  const { M, w, h, res } = p; let i0 = w, j0 = h, i1 = -1, j1 = -1; const [a0, b0, a1, b1] = p.bb ?? [0, 0, w - 1, h - 1];
  for (let j = b0; j <= b1; j++) for (let i = a0, q = j * w + a0; i <= a1; i++, q++) if (M[q] > .004) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; j1 = j; }
  if (i1 < 0) return null; const m = Math.ceil(3 * res); i0 = Math.max(0, i0 - m); j0 = Math.max(0, j0 - m); i1 = Math.min(w - 1, i1 + m); j1 = Math.min(h - 1, j1 + m);
  const cw = i1 - i0 + 1, ch = j1 - j0 + 1; if (cw === w && ch === h) return p; const O = new Float32Array(cw * ch);
  for (let j = 0; j < ch; j++) O.set(M.subarray((j + j0) * w + i0, (j + j0) * w + i0 + cw), j * cw);
  return { ...p, M: O, w: cw, h: ch, x0: p.x0 + i0 / res, y0: p.y0 + j0 / res };
}
// a pour too small for the engine to show anything (a close's dot, a paraph, a contents mark: under ~24 px across) is laid as it
// would come out of the engine at that size, a flat coat in its colour; its press impression in ?draw is unchanged
function flatPaint(p, rgb) {
  const cv = new OffscreenCanvas(p.w, p.h), g = cv.getContext('2d'), im = g.createImageData(p.w, p.h);
  for (let q = 0; q < p.M.length; q++) if (p.M[q] > 0) { im.data[q * 4] = rgb[0]; im.data[q * 4 + 1] = rgb[1]; im.data[q * 4 + 2] = rgb[2]; im.data[q * 4 + 3] = Math.round(Math.min(1, p.M[q] / .84) * 255); }
  g.putImageData(im, 0, 0); return cv;
}
function formes(b, res, dark) {
  const key = [b.bkey, res, dark].join('|'); let f = MADE.get(key); if (f) return f;
  const t0 = performance.now(), built = b.build(), S = built.S, box = b.box ?? built.box, byCol = {}, angs = {};
  for (const L of S.layers) { const sl = L.col === 'r' ? SLIP : L.col === 'g' ? SLIP_G : [0, 0], p = mask(L, box, res, sl, 0); coat(p, b, res, L.col);
    // the coat: a press lays its ink a little short of a full coat (the engine shows its squeeze to the rim and its slow
    // unevenness below ~.8), each piece of rule at its own inking (lay's alpha)
    if (byCol[L.col]) { const o = byCol[L.col], A = o.bb, B = p.bb; byCol[L.col] = { ...o, M: merge(o.M, p.M), bb: A && B ? [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])] : null }; } else byCol[L.col] = p; angs[L.col] ??= L.ang ?? 0; }
  // the bite: the impression's shoulder, a shade on the paper's side away from the light, a fraction of a px wide
  let bite = null;
  if (BITE && !dark) { const all = Object.values(byCol), { w, h, res: rs } = all[0], sh = Math.max(1, Math.round(.7 * res));
    // (over the inks' own box, grown by the shoulder's offset: the rest of the canvas has no ink to cast one)
    let [i0, j0, i1, j1] = [w, h, -1, -1]; for (const c of all) { const B = c.bb ?? [0, 0, w - 1, h - 1]; i0 = Math.min(i0, B[0]); j0 = Math.min(j0, B[1]); i1 = Math.max(i1, B[2]); j1 = Math.max(j1, B[3]); }
    if (i1 >= 0) { i1 = Math.min(w - 1, i1 + sh); j1 = Math.min(h - 1, j1 + sh); const cw = i1 - i0 + 1, ch = j1 - j0 + 1, U = new Float32Array(cw * ch);
      for (const c of all) { const M = c.M; for (let j = j0; j <= j1; j++) { const o = j * w, u0 = (j - j0) * cw - i0; for (let i = i0; i <= i1; i++) { const m = M[o + i]; if (m > U[u0 + i]) U[u0 + i] = m; } } }
      const cv = new OffscreenCanvas(cw, ch), g = cv.getContext('2d'), im = g.createImageData(cw, ch), [R, G, Bl] = palette.light.b, D = im.data;
      for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const q = j * cw + i, v = (i >= sh && j >= sh ? U[q - sh * cw - sh] : 0) - U[q]; if (v <= 0) continue; D[q * 4] = R; D[q * 4 + 1] = G; D[q * 4 + 2] = Bl; D[q * 4 + 3] = Math.round(v * .42 * 255); }
      g.putImageData(im, 0, 0); bite = { ...all[0], x0: all[0].x0 + i0 / rs, y0: all[0].y0 + j0 / rs, w: cw, h: ch, cv }; } }
  for (const c of Object.keys(byCol)) { byCol[c] = crop(byCol[c]); if (!byCol[c]) delete byCol[c]; }
  f = { byCol, angs, bite }; const dt = performance.now() - t0, wk = b.what.split(':')[0]; TIME.masks += dt; TIME[wk] = (TIME[wk] ?? 0) + dt; TIME.pieces++; if (MADE.size > 300) MADE.clear(); MADE.set(key, f); return f;
}
function print(made, { dpr = 1, animate = false, kind } = {}) {
  const res = Math.min(4, Math.max(1, Math.round(dpr * 2) / 2)), dark = isDark(), pours = [], seq = [];
  for (const b of made.letters ?? []) { if (b.shape !== 'deco') continue;
    const { byCol, angs, bite } = formes(b, res, dark), at = c => ({ ...c, x0: b.x + c.x0, y0: b.y + c.y0 });
    const bw = b.box ? b.box[2] - b.box[0] : b.w, bh = b.box ? b.box[3] - b.box[1] : b.h, ang = (bh > bw * 1.6 ? Math.PI / 2 - .06 : bw > bh * 1.6 ? .04 : .7);
    const pace = kind === 'drop' ? 1.1 : Math.min(1, .1 + (bw + bh) / 700);   // (a small mark, a beat; a long rule or a frame's side, about a second)
    const add = (p, d) => { pours.push(p); seq.push({ pour: p, d }); };
    if (bite) { const p = at(bite); add({ ...p, col: 'b', paint: g => g.drawImage(bite.cv, p.x0, p.y0, p.w / p.res, p.h / p.res), ...(animate && { press: { ang } }) }, animate ? pace * .5 : 0); }
    for (const col of ['r', 'k', 'g']) { const c = byCol[col]; if (!c) continue; const p = { ...at(c), col, wet: .05, dry: .16, ...(animate && { press: { ang } }) };
      // (and the gold always: a metallic ink sits on the paper's surface, it does not creep into the fibre or pool at the rim as
      // the engine's inks do; its coat's slow mottle is in its coverage)
      if (col === 'g' || (c.w / res < 24 && c.h / res < 24)) { const cv = c.flat ??= flatPaint(c, palette[dark ? 'dark' : 'light'][col]); p.paint = g => g.drawImage(cv, p.x0, p.y0, p.w / res, p.h / res); }
      add(p, animate ? pace : 0); }
  }
  const ys = (made.letters ?? []).map(b => b.y);
  return { pours, letters: [], seq, runs: [], y0: ys.length ? Math.min(...ys) : 0 };
}
// a case on the press's clock: the bite and the vermilion overlap, the black follows as the second pass
function timeline(pr, kind, animate) {
  const own = []; let u = 0;
  for (const e of pr.seq) { const d = animate ? e.d : 0; own.push({ t0: u, t1: u + d, pour: e.pour }); u += animate ? d * .7 : 0; }
  return { own, u: Math.max(u, .01), cap: kind === 'drop' ? 4 : 2.2 };
}

export const deco = { label: 'Deco', minGap: 2, theme: { rubric: 'rgb(192 54 32)', rubricDark: 'rgb(230 104 72)' },
  setup: () => ({}), kinds: (v, rich) => rich < .25 ? ['none'] : ['row'],
  fillAt: { gap: .6, head: 3, rise: 1 },
  hurry: [4, 1, 1.5, 1.6], steady: ['drop'],
  paraph, filler, breakMark, initial, frames, palette, print, timeline,
  set bite(v) { BITE = v !== 'off' && v !== false; }, get bite() { return BITE; },
  set rich(v) { BUDGET = +v; }, get rich() { return BUDGET; },   // (the page's budget, for the drop's depth: see initial)
  // the capitals' faces (face: the drop's, lineFace: the line's; any key of FACE_FILES: limelight, kalnia, federo, italiana;
  // defaults Limelight and Kalnia); the drop's field (?burst=
  // grille, the default, or rays) and the paraph's and end mark's crown (?lotus=on: the Chrysler lotus)
  set face(v) { setFace('drop', v); }, get face() { return SEL.drop; },
  set lineFace(v) { setFace('line', v); }, get lineFace() { return SEL.line; }, set lface(v) { setFace('line', v); },
  set burst(v) { D.BURST.kind = v === 'rays' ? 'rays' : 'grille'; }, set lotus(v) { D.BURST.lotus = v === 'on'; },
  get variant() { return [BITE ? 'bite' : 'flat', SEL.drop, SEL.line, D.BURST.kind, D.BURST.lotus].join(','); } };
export default deco;
