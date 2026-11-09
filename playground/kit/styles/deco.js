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
import { mask, press } from './deco-print.js';

export const palette = {
  light: { k: [27, 25, 23], r: [192, 54, 32], b: [214, 204, 184] },
  // the dark page: aluminium ink and a vermilion lifted to sit on black at the same weight as the light's (no bite: the
  // impression in a dark stock does not catch the light)
  dark: { k: [218, 214, 204], r: [230, 104, 72] },
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


// ---- placing pieces -------------------------------------------------------------------------------------------------------------
// a piece: build() -> { S, box } in its own px, (0, 0) at the piece's x, y
const piece = (x, y, w, h, build, seed, what) => ({ shape: 'deco', x, y, w, h, build, seed, what, bkey: [what, w.toFixed(1), h.toFixed(1), seed, D.FACES.drop, D.FACES.line, D.BURST.kind, D.BURST.lotus].join('|') });
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
  if (big) return { marks: [], letters: [piece(x0, y0, H, H, () => D.dropInitial(c, H, seed, +rich), seed, `drop:${c}:${rich}`)], width: H };
  // in the line: the capital fills the room the span keeps for it (its font's cap, wider than the text's), its foot on the baseline
  const Hl = Math.min((x1 - x0) / (D.ratio(c, D.FACES.line) + .1), H * 1.8), r = D.lineInitial(c, Hl, seed);
  return { marks: [], letters: [piece(x0, y1 - Hl, r.W, Hl, () => D.lineInitial(c, Hl, seed), seed, 'line:' + c + ':' + Hl.toFixed(1))], width: r.W };
}
initial.width = () => 1.02;
initial.line = ch => D.ratio(letterOf(ch), D.FACES.line) + .08;
initial.lines = 4; initial.phone = 3; initial.margin = .32;
initial.load = () => Promise.all([...new Set([SEL.drop, SEL.line])].map(loadFace)).then(() => {});   // (only the faces in use)

// ---- the paraph, fillers, breaks ---------------------------------------------------------------------------------------------------
function paraph(x, base, u, seed, rich = .5) {
  const s = u * 1.9; return { marks: [], letters: [piece(x - s * .1, base - s * .92, s, s, () => D.paraph(s, seed, +rich), seed, 'paraph:' + rich)] };
}
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  if (kind === 'none' || (kind === 'rule' && rich < .25)) return none;
  // (restraint: the usual page fills only a line left well open; a short end stays open until the page is richer)
  const u = yBase - yTop, room = x1 - x0 - u * .3, L = Math.min(room, kind === 'rule' ? u * 16 : u * (rich >= 1 ? 34 : 26));
  if (L < u * (kind === 'rule' ? 5 : rich >= 1 ? 4.5 : rich >= .75 ? 8 : rich >= .5 ? 22 : 30)) return none;
  const ht = u * 1.4; return { marks: [], letters: [piece(x0 + u * .3, (yTop + yBase) / 2 - ht / 2, L, ht, () => D.filler(L, u, seed, kind, +rich), seed, `filler:${kind}:${rich}`)] };
}
// three ranks: a part's (a short lozenge and speed lines), a chapter's (the plinth and its sun), the end's (the lotus over
// the Scotch rule, across the measure). The budget: plain, a part's narrower; lavish, a part's in a chapter's form
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8) {
  const rk = rank === 1 && rich >= 1 ? 2 : rank, W = rk >= 3 ? measure * .96 : rk === 2 ? Math.min(measure * .8, u * 64) : u * (rich < .25 ? 14 : 20), ht = u * (rk >= 3 ? 6.4 : rk === 2 ? 6 : 2.2);
  return { marks: [], letters: [piece(cx - W / 2, y - ht / 2, W, ht, () => D.brk(W, ht, rk, seed, u, +rich), seed, `break${rk}:${rich}:${u.toFixed(2)}`)] };
}

// ---- frames ----------------------------------------------------------------------------------------------------------------------
const linesBox = (box, lines) => !lines?.length ? box : [Math.min(...lines.map(L => L.left)), lines[0].top, Math.max(...lines.map(L => L.right)), lines.at(-1).base];
const frames = {
  // a quotation: its margin an Oxford rule stood upright, turned in at head and foot
  quote: ({ box, lines, u, seed = 1, rich = .5 }) => { if (rich < .25) return none; const L = linesBox(box, lines), top = L[1] - u * .6, len = (box?.[3] ?? L[3]) - top + u * .4, x = L[0] - u * 2.4;
    return { marks: [], letters: [piece(x, top, u * 2.4, len, () => D.marginRule(len, u, seed, +rich), seed, `margin:${rich}:${u.toFixed(2)}`)] }; },
  // an aside: two stepped brackets of Oxford rule, its head left and its foot right
  aside: ({ box, u, seed = 1, rich = .5 }) => { if (rich < .5) return none; const [X0, Y0, X1, Y1] = box, W = X1 - X0, H = Y1 - Y0;
    const m = u * 4.6; return { marks: [], letters: [{ ...piece(X0, Y0, W, H, () => D.brackets(W, H, u, seed), seed, 'aside:0'), box: [-u, -u, m, m] }, { ...piece(X0, Y0, W, H, () => D.brackets(W, H, u, seed), seed, 'aside:1'), box: [W - m, H - m, W + u, H + u] }] }; },
  // a pull quote: the sun between speed lines at its head, turned over at its foot
  pull: ({ cx, yTop, yBot, measure, u, seed = 1, rich = .5 }) => { if (rich < .25) return none; const W = Math.min(measure * .62, u * 44), ht = u * 3;
    return { marks: [], letters: [piece(cx - W / 2, yTop - ht * .55, W, ht, () => D.pullBand(W, ht, u, seed, false, +rich), seed, 'pullH:' + rich), piece(cx - W / 2, yBot - ht * .3, W, ht, () => D.pullBand(W, ht, u, seed + 3, true, +rich), seed + 3, 'pullF:' + rich)] }; },
  // a figure: a box of Oxford rule round the drawing and its caption, its corners stepped
  figure: ({ box, cap, u, seed = 1, rich = .5 }) => { if (rich < .25) return none; const X0 = box[0] - u * 1.4, Y0 = box[1] - u * 1.4, W = box[2] - box[0] + u * 2.8, H = (cap ?? box[3]) + u * 1.4 - Y0;
    return { marks: [], letters: sides(X0, Y0, W, H, () => D.boxFrame(W, H, u, seed, { oxfordRule: true, steps: rich >= .5 ? 1 : 0, rich: +rich }), seed, `figure:${rich}`, u * (rich >= 1 ? 3 : 2)) }; },
  // code: a fine single rule round it, every corner stepped
  code: ({ box, u, seed = 1, rich = .5 }) => { if (rich < .5) return none; const X0 = box[0] + u * 1.2, Y0 = box[1] + u * 1.2, W = box[2] - box[0] - u * 2.4, H = box[3] - box[1] - u * 2.4;
    return { marks: [], letters: sides(X0, Y0, W, H, () => D.boxFrame(W, H, u, seed, { oxfordRule: false, steps: 1, rich: +rich }), seed, `code:${rich}`, u * (rich >= 1 ? 3 : 2)) }; },
  // (the contents' marks are one piece, a column of them, printed at once: the same marks, a quarter of the pours)
  nav: ({ box, entries, u, seed = 1 }) => { const E = entries.filter(Boolean); if (!E.length) return none; const s = u * 1.6, x = Math.max(4, box[0] - s * 1.6), ys = E.map(e => e.base - u * .5 - s / 2), y0 = Math.min(...ys), H = Math.max(...ys) - y0 + s;
    return { marks: [], letters: [piece(x, y0, s, H, () => D.navMarks(s, ys.map(y => y - y0), seed), seed, 'nav:' + ys.map(y => (y - y0).toFixed(1)).join(','))] }; },
};

// ---- printing ----------------------------------------------------------------------------------------------------------------------
// Each piece's formes made into coverage at the device's resolution (kept by what the piece is, wherever it stands), then poured
// as the ink engine's pours: the bite (light page), the vermilion, the black. Drawn, each pour is printed (sweepIn's press: the
// impression comes up as the platen rolls along the piece's length).
const MADE = new Map(); export const TIME = { masks: 0, pieces: 0 };
const SLIP = [.32, .22];   // the vermilion forme's register against the black, in px (one forme: the same over the page)
const merge = (A, B) => { for (let q = 0; q < A.length; q++) if (B[q] > A[q]) A[q] = B[q]; return A; };
function formes(b, res, dark) {
  const key = [b.bkey, res, dark].join('|'); let f = MADE.get(key); if (f) return f;
  const t0 = performance.now(), built = b.build(), S = built.S, box = b.box ?? built.box, byCol = {}, angs = {};
  for (const L of S.layers) { const sl = L.col === 'r' ? SLIP : [0, 0], m = mask(L, box, res, sl, 0), p = press(m, b.seed + L.col.charCodeAt(0));
    // the coat: a press lays its ink a little short of a full coat (the engine shows its squeeze to the rim and its slow
    // unevenness below ~.8), each piece of rule at its own inking (lay's alpha)
    for (let q = 0; q < p.M.length; q++) p.M[q] *= .84;
    byCol[L.col] = byCol[L.col] ? { ...byCol[L.col], M: merge(byCol[L.col].M, p.M) } : p; angs[L.col] ??= L.ang ?? 0; }
  // the bite: the impression's shoulder, a shade on the paper's side away from the light, a fraction of a px wide
  let bite = null;
  if (BITE && !dark) { const all = Object.values(byCol), { w, h } = all[0], U = new Float32Array(w * h); for (const c of all) merge(U, c.M);
    const sh = Math.max(1, Math.round(.7 * res)), B = new Float32Array(w * h);
    for (let j = sh; j < h; j++) for (let i = sh; i < w; i++) { const q = j * w + i, v = U[q - sh * w - sh] - U[q]; if (v > 0) B[q] = v * .42; }
    // (laid as a plain shade, not through the engine: a shoulder of paper has no ink to creep)
    const cv = new OffscreenCanvas(w, h), g = cv.getContext('2d'), im = g.createImageData(w, h), [R, G, Bl] = palette.light.b;
    for (let q = 0; q < B.length; q++) if (B[q] > 0) { im.data[q * 4] = R; im.data[q * 4 + 1] = G; im.data[q * 4 + 2] = Bl; im.data[q * 4 + 3] = Math.round(B[q] * 255); }
    g.putImageData(im, 0, 0); bite = { ...all[0], M: B, cv }; }
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
    for (const col of ['r', 'k']) if (byCol[col]) add({ ...at(byCol[col]), col, wet: .05, dry: .16, ...(animate && { press: { ang } }) }, animate ? pace : 0);
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
  // the capitals' faces (face: the drop's, lineFace: the line's; any key of FACE_FILES: limelight, kalnia, federo, italiana;
  // defaults Limelight and Kalnia); the drop's field (?burst=
  // grille, the default, or rays) and the paraph's and end mark's crown (?lotus=on: the Chrysler lotus)
  set face(v) { setFace('drop', v); }, get face() { return SEL.drop; },
  set lineFace(v) { setFace('line', v); }, get lineFace() { return SEL.line; }, set lface(v) { setFace('line', v); },
  set burst(v) { D.BURST.kind = v === 'rays' ? 'rays' : 'grille'; }, set lotus(v) { D.BURST.lotus = v === 'on'; },
  get variant() { return [BITE ? 'bite' : 'flat', SEL.drop, SEL.line, D.BURST.kind, D.BURST.lotus].join(','); } };
export default deco;
