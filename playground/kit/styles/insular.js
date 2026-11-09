// Insular: the Lindisfarne and Durrow books' ornament (research/20-insular.md, research/21-paint.md) as a written style of
// the one library (kit/illum.js: rubricate(root, { style: 'insular' }); tests/insular.html puts it in the registry).
//   kind 'lind' (default)  Lindisfarne (BL Cotton MS Nero D IV, f. 139r): the panel letter outlined in ink and orpiment,
//       its body in compartments of fine red plait with square knots of blue and verdigris, roundels with a triskele, the
//       free ends a field of plait, two rows of red dots round it; a small knot and three dots for the paraph, a row of dots
//       closed by the positura, knot panels on ruled lines, frames of fine rules with corner knots.
//   kind 'durrow'  Durrow (TCD MS 57, fol. 86r): the letter in orpiment over red lead, long panels of two-strand twist, its
//       ends swollen into coils; two coils for the paraph, the red wave scroll, ribbon knots on double rules, coils at the
//       frame's corners. Dark: Durrow's own pigments on black; Lindisfarne's ink line becomes pale vellum.
//   paint 'hand' (default)  the page-size paint (kit/styles/insular-print.js): each Sheet's inks as brush loads with a hue by load,
//       composed by Kubelka–Munk over the vellum, the pen and black as absorbing ink, dots as touches of the brush
//       | 'engine'  the ink engine's pour (Sheet.print).
// Every piece is a Sheet built in its own px by kit/styles/insular-pieces.js (on kit/styles/insular-knot.js, the measured
// hand in every cord), set on the page here and painted when it is printed. Drawn (?draw), each piece is made in the order
// it was made: the pen along each line from where it set down, each pigment pocket by pocket from where the brush touched
// down, the dots touch by touch; never faded.
//   initial(o) -> { letters, width }   paraph(x, base, u, seed, rich, n)   filler(x0, x1, yTop, yBase, kind, seed, rich)
//   breakMark(cx, y, measure, rank, seed, rich, u, n)   frames.{ quote, aside, pull, figure, code, nav }   palette.{ light, dark }
//   print(made, { dpr, kind, animate }) -> { pours, letters, seq, runs, y0 }   timeline(printed, kind, animate)
import * as D from './insular-pieces.js';
import { paintSheet, PT } from './insular-print.js';
import { Sheet, dotsAlong } from './insular-knot.js';

let KIND = 'lind', PAINT = 'hand';
const DIR = () => D.DIRS[KIND], PAL = () => D.PAL[DIR().pal];
export const palette = { get light() { return PAL().light; }, get dark() { return PAL().dark; } };
const isDark = () => { try { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } };

// ---- placing pieces ---------------------------------------------------------------------------------------------------------------
// a piece: build(res, theme) -> { S (its Sheet), ox, oy (where the Sheet's origin lies from the piece's x, y) }; rot: a
// band stood upright (a margin), the Sheet built lying down and turned
// (a piece drawn for a page given its own seed is told so in its key: its choices are that seed's)
const V = vary => vary ? ':v' + vary : '';
const piece = (x, y, w, h, build, seed, rot = 0, what = 'piece') => ({ shape: 'ins', x, y, w, h, build, seed, rot, what, bkey: [what, w.toFixed(1), h.toFixed(1), seed, rot].join('|') });

// ---- the initials ---------------------------------------------------------------------------------------------------------------
// The drop: the panel letter, its cap on the first line's cap height and its foot on the last baseline (the face's
// letter, Uncial Antiqua (OFL), grown, its body worked). In the line: the same letter at a line's height, worked as far as
// a line allows (the builder holds its finest marks to what a cell can show).
const FACE = 'InsularUncial', WID = {};
const letterOf = ch => { const c = String(ch).normalize('NFD')[0].toUpperCase(); return /[A-Z]/.test(c) ? c : 'O'; };
function widthOf(ch) {   // the built letter's width less its margins, in its height (as letterField measures it; dur's swell a little more)
  const c = letterOf(ch); if (WID[c]) return WID[c];
  try { const g = new OffscreenCanvas(8, 8).getContext('2d'); g.font = `145px ${FACE}`; const m = g.measureText(c), s = 100 / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
    return WID[c] = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * s / 100 + .11; } catch { return 1; } }
// the line's initial: the letter in ink (pale vellum in the dark, Lindisfarne), an orpiment band inside the pen line and its
// body red lead (Durrow: orpiment over red, as its big letter), one row of red dots round it
function smallInitial(c, H, seed, res, theme) {
  const L = D.letterField(c, H, { res, bold: H * .08 }), S = new Sheet([0, 0, L.W, L.Ht], res), px = 1 / res, dk = theme === 'dark';
  const pen = Math.max(.7 * px, H * .045), band = Math.max(.8 * px, H * .07), lay = (ink, d0) => { const M = new Float32Array(L.w * L.h); for (let q = 0; q < M.length; q++) M[q] = Math.max(0, Math.min(1, (L.Din[q] - d0) * res + .5)) * (L.M[q] > .02 ? 1 : 0); S.image(ink, M); };
  lay(KIND === 'lind' && dk ? 'l' : 'k', 0); lay('y', pen); lay('r', pen + band);
  const dr = Math.max(.7 * px, H * .035); for (const lp of D.ring(L, dr * 1.45)) S.dots(dotsAlong(lp, dr * 2 * 1.85, dr, true, { load: 11 }), 'd');
  // its counters: the diaper of red dots f. 27r sets in a closed counter, in a lozenge lattice clear of the letter's edge
  const pit = dr * 2 * 1.9, hd = []; for (let y = L.P, row = 0; y < L.Ht - L.P; y += pit * .87, row++) for (let x = L.P + (row % 2) * pit / 2; x < L.W - L.P; x += pit) if (L.at(x, y, L.hole) && L.at(x, y, L.Dout) > dr * 1.6) hd.push([x, y, dr * .9, 0, 1]);
  if (hd.length) S.dots(hd, 'd');
  S.drift({ amp: H * .01, lam: H * .4, amp2: H * .002, lam2: H * .1, mis: H * .003, seed });
  return { S, ox: L.P, oy: L.P };
}
function initial({ ch = 'E', G, big = true, seed = 1, rich = .5 }) {
  const c = letterOf(ch), [x0, y0, , y1] = G.box, H = y1 - y0, W = widthOf(c) * H, rk = rich >= 1 ? 1 : rich >= .75 ? .75 : .5;
  const vary = insular.seeded | 0, build = (res, theme) => { if (!big) return smallInitial(c, H, seed, res, theme); const r = DIR().initial(c, H, seed, { theme, res, rich: rk, vary }); return { S: r.S, ox: r.P, oy: r.P }; };
  return { marks: [], letters: [piece(x0, y0, W, H, build, seed, 0, (big ? 'drop:' : 'line:') + c + ':' + rk + V(vary))], width: W };
}
initial.width = ch => widthOf(ch) + .04;
initial.line = ch => widthOf(ch) + .04;
initial.lines = 4; initial.phone = 3; initial.margin = .3;
// the face: Illum Uncial Caps, Uncial Antiqua (OFL; its licence beside it) subset to the capitals and renamed (the OFL's
// Reserved Font Name is not used for a modified version), loaded once (a page that declares it itself
// in CSS has it already)
const fontDir = new URL('../../fonts/insular/', import.meta.url); let faceP = null;
initial.load = () => faceP ??= (document.fonts.check(`40px ${FACE}`) && [...document.fonts].some(f => f.family.replace(/"/g, '') === FACE) ? Promise.resolve()
  : new FontFace(FACE, `url(${new URL('illum-uncial-caps.woff2', fontDir)})`).load().then(f => { document.fonts.add(f); }).catch(e => console.warn('insular:', e)));

// ---- the paraph, fillers, breaks ---------------------------------------------------------------------------------------------------
// the paraph: in the gap the indent keeps (u: the x-height): Lindisfarne's small knot and three dots, Durrow's two coils
function paraph(x, base, u, seed) {
  const size = u * (KIND === 'durrow' ? 1.25 : 1.55), vary = insular.seeded | 0, build = (res, theme) => { const r = DIR().paraph(size, seed, { theme, res, vary }); return { S: r.S, ox: size * .3, oy: size * .3 }; };
  return { marks: [], letters: [piece(x, base - u * .5 - size / 2, size * 1.9, size, build, seed, 0, 'paraph' + V(vary))] };
}
// a paragraph's free end: Lindisfarne's row of dots closed by the positura, Durrow's red wave scroll; a heading's run-out,
// a short one
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  if (kind === 'none' || (kind === 'rule' && rich < .25)) return { marks: [], letters: [] };
  const u = yBase - yTop, room = x1 - x0 - u * .4, L = kind === 'rule' ? Math.min(room, u * 14) : Math.min(room, u * 44);
  if (L < u * (kind === 'rule' ? 5 : rich >= 1 ? 6 : 8)) return { marks: [], letters: [] };
  // (Durrow's red scroll is a large mark: it closes a short last line only — a third of the line free, less as the page is
  // richer — not every paragraph's end)
  if (KIND === 'durrow' && kind !== 'rule' && room < u * (rich >= 1 ? 18 : rich >= .75 ? 24 : 30)) return { marks: [], letters: [] };
  const ht = u * 1.45, build = (res, theme) => { const r = (KIND === 'durrow' ? D.durFiller : D.lindFiller)(L, ht, seed, { theme, res }); return { S: r.S, ox: r.pad, oy: r.pad }; };
  return { marks: [], letters: [piece(x0 + u * .2, (yTop + yBase) / 2 - ht / 2, L, ht, build, seed, 0, 'filler')] };
}
// three ranks: a part (half the measure, one knot panel on its rules), a chapter (wider and taller), the end (across the
// measure). The budget: plain, a part's smaller; fine, a part's in a chapter's form; lavish, a chapter's wider still
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8) {
  const rk = rank === 1 && rich >= .75 ? 2 : rank, wide = rich >= 1 ? 1.12 : 1;
  const W = rk > 2 ? measure * .92 : rk > 1 ? Math.min(measure * .72 * wide, u * 62 * wide) : u * 14 * (rich < .25 ? .8 : 1), ht = u * (rk > 2 ? 3 : rk > 1 ? 3.2 : 2.6);
  const vary = insular.seeded | 0, build = (res, theme) => { const r = (KIND === 'durrow' ? D.durBand : D.lindBand)(W, ht, seed + rk, { theme, res, rank: rk, vary }); return { S: r.S, ox: (r.W - W) / 2, oy: (r.H - ht) / 2 }; };
  return { marks: [], letters: [piece(cx - W / 2, y - ht / 2, W, ht, build, seed, 0, 'break' + rk + V(vary))] };
}

// ---- frames ----------------------------------------------------------------------------------------------------------------------
const linesBox = (box, lines) => !lines?.length ? box : [Math.min(...lines.map(L => L.left)), lines[0].top, Math.max(...lines.map(L => L.right)), lines.at(-1).base];
// a quotation's or an aside's margin: a knot panel on its rules (Lindisfarne) or a ribbon knot on double rules (Durrow),
// stood upright beside the lines
const margin = (xl, top, bot, u, seed) => { const ht = Math.min(u * 2.6, Math.max(u * 1.6, xl - u * .9 - 4)), len = bot - top + u * 2.4; if (len < u * 6) return [];
  const vary = insular.seeded | 0, build = (res, theme) => { const r = (KIND === 'durrow' ? D.durBand : D.lindBand)(len, ht, seed, { theme, res, vary }); return { S: r.S, ox: (r.W - len) / 2, oy: (r.H - ht) / 2 }; };
  return [piece(Math.max(4, xl - u * .9 - ht), top - u * 1.2, ht, len, build, seed, 1, 'margin' + V(vary))]; };
// a frame: built as its four sides' strips (the corners with the top and bottom), so its empty middle is never rastered
const frameAround = ([X0, Y0, X1, Y1], seed, level = 1) => { const bw = X1 - X0, bh = Y1 - Y0, st = D.frameStrip(bw, bh), vary = insular.seeded | 0;
  return ['t', 'b', 'l', 'r'].map(part => { const [sx0, sy0, sx1, sy1] = st[part];
    const build = (res, theme) => { const r = (KIND === 'durrow' ? D.durFrame : D.lindFrame)(bw, bh, seed, { theme, res, level, part, vary }); return { S: r.S, ox: 0, oy: 0, trim: st.trim[part] }; };   // (the strip's sheet starts where the piece does)
    return piece(X0 - st.pad + sx0, Y0 - st.pad + sy0, sx1 - sx0, sy1 - sy0, build, seed, 0, 'frame' + level + part + ':' + bw.toFixed(1) + 'x' + bh.toFixed(1) + V(vary)); }); };
const levelOf = rich => rich < .25 ? 0 : rich < .75 ? 1 : rich < 1 ? 2 : 3;
const frames = {
  quote: ({ box, lines, u, seed = 1, rich = .5 }) => { const L = linesBox(box, lines); return { marks: [], letters: rich < .5 ? [] : margin(L[0], L[1], box?.[3] ?? L[3], u, seed) }; },
  // (an aside: from fine its margin band; lavish, a ruled frame round it as well)
  aside: ({ box, lines, u, seed = 1, rich = .5 }) => { const L = linesBox(box, lines); return { marks: [], letters: rich < .5 ? [] : [...margin(L[0], L[1], L[3] + u * .3, u, seed + 4), ...(rich >= 1 && box ? frameAround([box[0] + u, box[1] + u, box[2] - u * .4, box[3] - u], seed + 9, 1) : [])] }; },
  pull: ({ cx, yTop, yBot, measure, u, seed = 1, rich = .5 }) => { if (rich < .25) return { marks: [], letters: [] };
    // (modest and usual: a knot panel on its rules; fine, longer; lavish, a band of knotwork)
    const rk = rich >= 1 ? 3 : 2, W = Math.min(measure * (rich >= 1 ? .6 : .42), u * (rich >= .75 ? 36 : 30)), ht = u * 2.4, f = KIND === 'durrow' ? D.durBand : D.lindBand, vary = insular.seeded | 0;
    const one = (yc, s) => piece(cx - W / 2, yc - ht / 2, W, ht, (res, theme) => { const r = f(W, ht, s, { theme, res, rank: rk, vary }); return { S: r.S, ox: (r.W - W) / 2, oy: (r.H - ht) / 2 }; }, s, 0, 'pull' + rk + V(vary));
    return { marks: [], letters: [one(yTop - ht * .2, seed + 2), one(yBot + ht * .35, seed + 7)] }; },
  // (plain: the rules and corners alone; usual: dots and the long sides' panels; fine: the short sides' knots too; lavish:
  // a second row of dots, and the figure's margin band beside it)
  figure: ({ box, cap, u, seed = 1, rich = .5 }) => { const B = [box[0] - u * 1.2, box[1] - u * 1.2, box[2] + u * 1.2, (cap ?? box[3]) + u * 1.2];
    return { marks: [], letters: [...frameAround(B, seed, levelOf(rich)), ...(rich >= 1 ? margin(B[0] - u * .6, B[1] + u * 1.2, B[3] - u * 1.2, u, seed + 5) : [])] }; },
  code: ({ box, u, seed = 1, rich = .5 }) => ({ marks: [], letters: frameAround([box[0] + u * 1.6, box[1] + u * 1.6, box[2] - u * 1.6, box[3] - u * 1.6], seed + 2, levelOf(rich)) }),
  nav: ({ box, entries, u, seed = 1 }) => ({ marks: [], letters: entries.filter(Boolean).map((e, i) => paraph(Math.max(4, box[0] - u * 3.6), e.base, u * .8, seed + i).letters[0]) }),
};

// ---- printing ----------------------------------------------------------------------------------------------------------------------
// Each piece built at print (its Sheet at the device's resolution) and painted once; the pour lays the painted piece. Drawn,
// the piece is revealed by its own clock (paintSheet's T): what has been made by now is shown, the rest not yet there.
const CACHE = new Map(), MADE = new Map();
export const TIME = { build: 0, paint: 0, pieces: 0, PT };   // (where the time goes: the Sheets' geometry, and their painting)
function turn(c) { const o = new OffscreenCanvas(c.height, c.width), g = o.getContext('2d'); g.translate(c.height, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); return o; }
function turnT(T, w, h) { if (!T) return T; const O = new Float32Array(T.length); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) O[i * h + (h - 1 - j)] = T[j * w + i]; return O; }
// (a still page's pieces are built without the making's clock: nothing reads it)
const built = (b, res, theme, animate) => { Sheet.clocked = animate; try { return b.build(res, theme); } finally { Sheet.clocked = true; } };
function print(made, { dpr = 1, animate = false, kind } = {}) {
  const res = Math.min(4, Math.max(1, Math.round(dpr))), theme = isDark() ? 'dark' : 'light', all = [], seq = [];
  for (const b of made.letters ?? []) { if (b.shape !== 'ins') continue;
    const key = [KIND, PAINT, theme, res, b.x.toFixed(1), b.y.toFixed(1), b.bkey, animate].join('|');
    let p = CACHE.get(key);
    if (!p) {
      // (the piece itself — its geometry and its paint — does not depend on where it stands: kept by what it is, its size
      // and seed, so a page laid out again, or a mode come back to, reuses it)
      const pk = [KIND, PAINT, theme, res, b.bkey, animate].join('|'); let made = MADE.get(pk);
      if (!made) { const tb = performance.now(), { S, ox, oy, trim = null } = built(b, res, theme, animate), pal = PAL()[theme], tp = performance.now(); TIME.build += tp - tb; TIME[b.what.split(':')[0]] = (TIME[b.what.split(':')[0]] ?? 0) + tp - tb;
        let canvas, T = null;
        if (PAINT === 'engine') { canvas = new OffscreenCanvas(S.w, S.h); const g = canvas.getContext('2d'); g.scale(res, res); S.print(g, pal, { dpr: res, order: DIR().order, seed: b.seed, tex: DIR().tex, alias: DIR().alias }); }
        else ({ canvas, T } = paintSheet(S, pal, { order: DIR().order, seed: b.seed, grow: animate }));
        let w = S.w, h = S.h, dx = ox, dy = oy;
        if (trim) { const tr = Math.round(trim[0] * res), h2 = h - tr - Math.round(trim[1] * res), c2 = new OffscreenCanvas(w, h2); c2.getContext('2d').drawImage(canvas, 0, -tr);   // (a strip trimmed back to its own rows)
          if (T) T = T.slice(tr * w, (tr + h2) * w); canvas = c2; h = h2; dy -= tr / res; }
        if (b.rot) { T = turnT(T, w, h); canvas = turn(canvas); [w, h] = [h, w]; dx = oy; dy = ox; }
        TIME.paint += performance.now() - tp; TIME.pieces++;
        made = { canvas, T, w, h, dx, dy }; if (MADE.size > 200) MADE.clear(); MADE.set(pk, made); }
      let { canvas, T, w, h, dx, dy } = made; const x0 = b.x - dx, y0 = b.y - dy;
      const pour = { x0, y0, w, h, res, col: 'k', paint: bake => bake.drawImage(canvas, x0, y0, w / res, h / res) };
      if (animate && T) { const mk = new OffscreenCanvas(w, h), mg = mk.getContext('2d'), im = new ImageData(w, h); let last = -1;
        pour.grow = { mode: 'reveal', fn: (ctx, f) => { if (f !== last) { last = f; for (let q = 0; q < T.length; q++) im.data[q * 4 + 3] = T[q] <= f ? 255 : 0; mg.putImageData(im, 0, 0); } ctx.drawImage(mk, x0, y0, w / res, h / res); } }; }
      p = [pour]; if (CACHE.size > 300) CACHE.clear(); CACHE.set(key, p); }
    const d = kind === 'drop' ? 3 : kind === 'initial' ? 1.4 : Math.min(2, .8 + (b.w + b.h) / 600);
    for (const q of p) { all.push(q); seq.push({ pour: q, d, piece: b }); } }
  const ys = (made.letters ?? []).map(b => b.y);
  return { pours: all, letters: [], seq, runs: [], y0: ys.length ? Math.min(...ys) : 0 };
}
// a case on the painter's clock: its pieces one after another, each over its own span (its making is in its reveal)
function timeline(pr, kind, animate) {
  const own = []; let u = 0;
  for (const e of pr.seq) { const t = u; if (animate) u += e.d; own.push({ t0: animate ? t : 0, t1: animate ? t + e.d : 0, pour: e.pour }); }
  return { own, u: Math.max(u, .01), cap: kind === 'drop' ? 6 : 2.6 };
}

export const insular = { label: 'Insular', minGap: 2, theme: { rubric: 'rgb(178 74 48)', rubricDark: 'rgb(214 120 86)' },
  setup: () => ({}), kinds: (v, rich) => rich < .3 ? ['none'] : ['row'],
  fillAt: { gap: .6, head: 3, rise: 1 },
  steady: ['drop'],
  paraph, filler, breakMark, initial, frames, palette, print, timeline,
  set kind(v) { KIND = v === 'durrow' ? 'durrow' : 'lind'; }, get kind() { return KIND; },
  set paint(v) { PAINT = v === 'engine' ? 'engine' : 'hand'; }, get paint() { return PAINT; },
  get variant() { return [KIND, PAINT].join(','); } };
export default insular;
