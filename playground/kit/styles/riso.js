// Duplicator (research/26-riso.md) as a written style of the one library (kit/illum.js: rubricate(root, { style: 'riso' })):
// a page printed on a stencil duplicator, two drums in one pass. Federal Blue (drum 1, the key) carries the letter, the
// strips and the printer's pointing hand; Fluorescent Pink (drum 2) prints its cut masses and bands over them; where they
// cross the inks make violet. Every shape is cut (kit/styles/riso-overprint.js), every piece printed by
// kit/styles/riso-press.js: each drum's stencil through the sheet's one miss, its film poured through the ink engine
// (large pieces) or given the same drum streaks and tooth on the CPU (small ones), composited by the film law. In the
// dark: the opaque pair on black stock (Bubblegum, then Cornflower).
// The budget, as a small press goes from a one-colour flyer to a deluxe edition:
//   plain   one drum (blue): the letter alone, the hand for a paraph, a run-out's strip, the breaks in blue; no frames
//   modest  both drums: the drop's cut mass, the hand at a filler's and a run-out's end (only on a well-open line), the
//           quotation's rule, the contents' ticks
//   usual   the run-out's pink band, the quotation's two strips, crossing bands over a pull quote, a banded rule at the head
//           of an aside and of code, registration marks at a figure's corners (two)
//   fine    variety in the breaks (two hands facing; blocks overlapping; a numbered part's numeral on a cut block), all
//           four of a figure's marks
//   lavish  the pull quote's bands below it too, the aside's and code's rules at their foot, the hand on its strip
// Breaks: a part's (rank 1) the hand; a chapter's (rank 3) bands crossing in violet; the end (rank 2) a long overprinted
// bar between registration marks printed by both drums.
// Drawn (?draw), each piece is laid drum by drum: drum 1's ink comes down the piece behind a straight front, then drum 2's.
//   initial(o) -> { letters, width }   paraph(x, base, u, seed, rich)   filler(x0, x1, yTop, yBase, kind, seed, rich)
//   breakMark(cx, y, measure, rank, seed, rich, u, index, room)   frames.{ quote, aside, pull, figure, code, nav }
//   palette.{ light, dark }   print(made, { dpr, kind, animate }) -> { pours, letters, seq, runs, y0 }   timeline(printed, kind, animate)
import { press, pressSplit, drumSet } from './riso-press.js';
import * as O from './riso-overprint.js';

export const palette = { light: { k: [61, 85, 136] }, dark: { k: [98, 168, 229] } };
const isDark = () => { try { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } };
const lvOf = rich => Math.max(0, Math.min(4, Math.round(+rich * 4)));
// the page's seed (the host's, when it gave one: S.seeded), for its hand: strip ends, weights, the drums' miss
const PS = () => (riso.seeded | 0) || 7;
const none = { marks: [], letters: [] };
const FS = u => u * 2.4;   // (the text's size from its x-height: EB Garamond's x is ~0.42 em)

// ---- placing pieces -------------------------------------------------------------------------------------------------------------
// a piece (riso-overprint's: { W, H, draw }) at x, y on the page; its job (how to make it again) is its key; plain: drum 2 left
// out (the one-colour flyer)
const piece = (x, y, job, what, plain = false) => { const p = make(job, plain); return { shape: 'riso', x, y, w: p.W, h: p.H, job, plain, what, bkey: JSON.stringify([job, plain]) }; };
const BUILD = { drop: O.initial, paraph: O.paraph, filler: O.filler, runout: O.runout, brk: O.brk, quote: (h, s, fs, both) => O.quoteStrips(h, s, fs, both), reg: O.regMark, tick: O.tick, band: O.band };
const MAKE = new Map();
function make(job, plain) { const k = JSON.stringify([job, plain]); let p = MAKE.get(k); if (p) return p;
  p = BUILD[job[0]](...job.slice(1)); if (plain) p = { ...p, draw: { a: p.draw.a } }; if (MAKE.size > 400) MAKE.clear(); MAKE.set(k, p); return p; }
const clear = (box, keep, pad) => !keep?.some(r => box[0] - pad < r[2] && box[2] + pad > r[0] && box[1] - pad < r[3] && box[3] + pad > r[1]);

// ---- the initials ---------------------------------------------------------------------------------------------------------------
const letterOf = ch => { const c = String(ch).normalize('NFD')[0].toUpperCase(); return /[A-Z0-9]/.test(c) ? c : 'O'; };
const ROOM = .95;   // (the drop's box: never narrower than .95 of its height, so a narrow letter's mass has room beside it)
const inkW = ch => { const g = O.glyphW(letterOf(ch)); return g; };
// the drop: the letter's cap on the first line's cap height, its foot on the last baseline; its cut mass in its own box
function initial({ ch = 'B', G, big = true, seed = 1, rich = .5, u = 8 }) {
  const c = letterOf(ch), [x0, y0, , y1] = G.box, capH = +(y1 - y0).toFixed(2), lv = lvOf(rich), fs = +FS(u).toFixed(2);
  if (!big) { const job = ['drop', c, capH, seed, fs, { line: lv >= 1, plain: lv < 1 }]; return { marks: [], letters: [piece(x0, y0, job, 'line:' + c)], width: inkW(c) + .06 }; }
  const wb = +(Math.max(inkW(c), ROOM) * capH).toFixed(2), job = ['drop', c, capH, seed, fs, { wb, plain: lv < 1 }];
  return { marks: [], letters: [piece(x0, y0, job, 'drop:' + c)], width: Math.max(inkW(c), ROOM) + .06 };
}
initial.width = ch => Math.max(inkW(ch), ROOM) + .06;
initial.line = ch => inkW(ch) + .06;
initial.lines = 4; initial.phone = 3; initial.margin = .38;
initial.load = () => O.loadFace();

// ---- the paraph, fillers, breaks ---------------------------------------------------------------------------------------------------
// the paraph: the hand, in the indent's gap, on the x-height's middle
function paraph(x, base, u, seed, rich = .5) {
  // (x: the left of the 1.65 u the host centres in the indent; the hand is wider than that, so it is set .35 u to the left of
  // centre, into the indent's spare room, its finger kept clear of the first word)
  const fs = +(FS(u) * .9).toFixed(2), p = make(['paraph', fs, PS()]);
  return { marks: [], letters: [piece(x + u * .825 - u * .35 - p.W / 2, base - u * .5 - p.H / 2, ['paraph', fs, PS()], 'paraph', lvOf(rich) < 1)] };
}
// a paragraph's free end: a blue strip and the hand after it (from modest, and only on a line left well open); a heading's
// run-out: a blue strip (plain), the hand after it (modest), a pink band under it (usual)
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  if (kind === 'none') return none;
  const u = yBase - yTop, lv = lvOf(rich), room = x1 - x0 - u * .4, fs = +FS(u).toFixed(2);
  if (kind === 'rule') { if (room < u * 4) return none;
    // (a short run-out: the hand alone, just after the heading)
    if (room < u * 14) { const job = ['paraph', fs, PS()], p = make(job); return p.W > room ? none : { marks: [], letters: [piece(x0 + u * .4, yBase - u * .5 - p.H / 2, job, 'runout', lv < 1)] }; }
    const w = +Math.min(room, u * 28).toFixed(1), h = +(fs * 1.3).toFixed(2);
    const job = lv === 0 ? ['filler', w, h / 1.3 * 1.58, PS(), fs] : ['runout', w, h, PS(), fs], plain = lv < 2, p = make(job, plain);
    return { marks: [], letters: [piece(x0 + u * .4, yBase - u * .5 - p.H / 2, job, 'runout', plain)] }; }
  if (lv === 0 || room < u * [0, 30, 22, 17, 13][lv]) return none;
  const w = +Math.min(room, u * 34).toFixed(1), job = ['filler', w, +(fs * 1.58).toFixed(2), PS(), fs], p = make(job);
  return { marks: [], letters: [piece(x0 + u * .4, yBase - u * .5 - p.H / 2, job, 'filler')] };
}
// three ranks, as Rock maps them: a part's (rank 1) the hand; a chapter's (rank 3) bands crossing; the end (rank 2) the bar
// between registration marks. Fine brings variety (two hands facing, blocks overlapping, a numbered part's numeral); plain
// prints them in blue alone. Each kept in the room the page leaves it.
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8, index = 1, room = null) {
  const lv = lvOf(rich), fs = +FS(u).toFixed(2), deep = room && room[1] - room[0] > 0 ? room[1] - room[0] : u * 14, r = rank === 2 ? 3 : rank >= 3 ? 2 : 1, n = index | 0;
  const v = r === 1 ? (lv >= 4 ? ['a', 'b', 'c'][n % 3] : lv >= 3 && n % 2 ? 'b' : 'a') : r === 2 ? (lv >= 3 && n % 2 ? 'b' : 'a') : (lv >= 3 && n >= 1 ? 'b' : 'c');
  const h = +Math.min(deep * .92, u * (r === 1 ? 4 : r === 2 ? 5.6 : 14)).toFixed(1); if (!(h > u * 1.6)) return none;
  const job = ['brk', r, +Math.min(measure, u * 70).toFixed(1), h, PS(), fs, v, Math.max(1, n)], p = make(job);
  return { marks: [], letters: [piece(cx - p.W / 2, y - p.H / 2, job, 'break' + r + v, lv < 1)] };
}

// ---- frames ----------------------------------------------------------------------------------------------------------------------
const linesBox = (box, lines) => !lines?.length ? box : [Math.min(...lines.map(L => L.left)), lines[0].top, Math.max(...lines.map(L => L.right)), lines.at(-1).base];
const pageW = () => globalThis.document?.documentElement.clientWidth ?? Infinity;
const frames = {
  // a quotation: a blue strip down its margin (modest), the pink beside it (usual)
  quote: ({ box, lines, u, rich = .5 }) => { const lv = lvOf(rich); if (lv < 1) return none; const L = linesBox(box, lines), fs = +FS(u).toFixed(2), h = +(L[3] - L[1] + u * 1.2).toFixed(1), job = ['quote', h, PS(), fs, lv >= 2], p = make(job), x = L[0] - p.W - u * .9;
    return x < 2 ? none : { marks: [], letters: [piece(x, L[1] - u * .5, job, 'quote')] }; },
  // an aside: a banded rule at its head (usual), at its foot as well (lavish)
  aside: ({ box, u, rich = .5 }) => { const lv = lvOf(rich); if (lv < 2) return none; const fs = +FS(u).toFixed(2), w = +Math.min((box[2] - box[0]) * .45, fs * 8).toFixed(1), job = ['band', w, fs, PS()], p = make(job);
    const out = [piece(box[0] + u * 1.2, box[1] + u * 1.8 - p.H / 2, job, 'aside')]; if (lv >= 4) out.push(piece(box[2] - u * 1.2 - p.W, box[3] - u * 2.2 - p.H / 2, job, 'aside'));
    return { marks: [], letters: out }; },
  // a pull quote: two bands crossing in violet over it (usual), under it as well (lavish)
  pull: ({ cx, yTop, yBot, u, rich = .5 }) => { const lv = lvOf(rich); if (lv < 2) return none; const fs = +FS(u).toFixed(2), job = ['brk', 2, 0, +(u * 4.6).toFixed(1), PS(), fs, 'a', 1], p = make(job);
    // (the bands' ink reaches ext above and below the piece's middle: their tilt and half the wider band; yTop is 2.2 u above
    // the first line's top, yBot 2.6 u below the last baseline; the ink kept 1.5 u clear of them: the line boxes' leading and the miss)
    const ext = O.hand(PS()).tilt * 4 * fs + .24 * fs, ct = yTop + 2.2 * u - 1.5 * u - ext, cb = yBot - 2.6 * u + 1.1 * u + 1.5 * u + ext;
    const out = [piece(cx - p.W / 2, ct - p.H / 2, job, 'pull')]; if (lv >= 4 && yBot) out.push(piece(cx - p.W / 2, cb - p.H / 2, job, 'pull'));
    return { marks: [], letters: out }; },
  // a figure: registration marks at two of its corners (usual), all four (fine), printed by both drums
  figure: ({ box, u, rich = .5 }) => { const lv = lvOf(rich); if (lv < 2) return none; const R = +(u * .85).toFixed(2), job = ['reg', R, PS()], p = make(job), W = pageW();
    const at = [[box[0] - p.W * .75, box[1] - p.W * .75], [box[2] - p.W * .25, box[3] - p.W * .25], [box[2] - p.W * .25, box[1] - p.W * .75], [box[0] - p.W * .75, box[3] - p.W * .25]].slice(0, lv >= 3 ? 4 : 2);
    return { marks: [], letters: at.filter(([x]) => x >= 2 && x + p.W <= W - 2).map(([x, y]) => piece(x, y, job, 'figure')) }; },
  // code: a banded rule at its head (usual), at its foot as well (lavish)
  code: ({ box, u, rich = .5 }) => { const lv = lvOf(rich); if (lv < 2) return none; const fs = +FS(u).toFixed(2), w = +Math.min((box[2] - box[0]) - u * 4, fs * 9).toFixed(1), job = ['band', w, fs, PS()], p = make(job);
    const out = [piece(box[0] + u * 2, box[1] + u * 1.6 - p.H / 2, job, 'code')]; if (lv >= 4) out.push(piece(box[2] - u * 2 - p.W, box[3] - u * 1.8 - p.H / 2, job, 'code'));
    return { marks: [], letters: out }; },
  // the contents: a blue tick before each entry (modest)
  nav: ({ box, entries, u, rich = .5 }) => { if (lvOf(rich) < 1) return none; const E = entries.filter(Boolean); if (!E.length) return none; const fs = +FS(u).toFixed(2);
    return { marks: [], letters: E.map((e, i) => { const job = ['tick', fs, PS(), i], p = make(job); return piece(Math.max(2, box[0] - u * 1.6 - p.W), e.base - u * .5 - p.H / 2, job, 'nav'); }) }; },
};

// ---- printing ----------------------------------------------------------------------------------------------------------------------
// Each piece printed at its place (the drums' miss and the drum's streaks are the sheet's, so a piece is kept by what it is
// and where it stands), on the host's own paper. Drawn, it is laid as two pours, drum 1's and then what drum 2 adds, each
// revealed behind a straight front moving down the piece (the nip): nothing fades.
export const TIME = { build: 0, pieces: 0 };
const CACHE = new Map();
const hexOf = s => { const m = String(s).match(/\d+(\.\d+)?/g); if (!m || m.length < 3) return null; return '#' + m.slice(0, 3).map(v => Math.round(+v).toString(16).padStart(2, '0')).join(''); };
const paper = theme => { try { const v = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(); if (v.startsWith('#') && v.length === 7) return v; const h = hexOf(v); if (h) return h; } catch {} return O.LOOK[theme].stock; };
const toCanvas = img => { const c = new OffscreenCanvas(img.width, img.height); c.getContext('2d').putImageData(img, 0, 0); return c; };
function print(made, { dpr = 1, animate = false, kind } = {}) {
  const d = Math.min(4, Math.max(1, dpr)), theme = isDark() ? 'dark' : 'light', look = { ...O.LOOK[theme], stock: paper(theme) }, all = [], seq = [];
  const o = at => ({ d, at, pageW: pageW(), drums: drumSet(PS()), ink: riso.pour ? 'auto' : 'textured', seed: PS() });
  for (const b of made.letters ?? []) { if (b.shape !== 'riso') continue;
    const key = [theme, look.stock, d, b.x.toFixed(1), b.y.toFixed(1), b.bkey, animate].join('|');
    let e = CACHE.get(key);
    if (!e) { const t0 = performance.now(), p = make(b.job, b.plain);
      if (animate) { const r = pressSplit(p, look, o([b.x, b.y])), x0 = b.x - r.pad, y0 = b.y - r.pad;
        const lay = (img, col) => { const cv = toCanvas(img), w = r.cw, h = r.ch, paint = g => g.drawImage(cv, x0, y0, w / d, h / d);
          return { x0, y0, w, h, res: d, col, paint, grow: { mode: 'reveal', fn: (g, f) => { g.fillStyle = '#000'; g.fillRect(x0, y0, w / d, h / d * Math.min(1, f)); } } }; };
        e = { pours: p.draw.b ? [lay(r.a, 'k'), lay(r.b, 'k')] : [lay(r.a, 'k')] }; }
      else { const r = press(p, look, o([b.x, b.y])), cv = toCanvas(r.img), x0 = b.x - r.pad, y0 = b.y - r.pad;
        e = { pours: [{ x0, y0, w: r.cw, h: r.ch, res: d, col: 'k', paint: g => g.drawImage(cv, x0, y0, r.cw / d, r.ch / d) }] }; }
      TIME.build += performance.now() - t0; TIME.pieces++;
      if (CACHE.size > 400) CACHE.clear(); CACHE.set(key, e); }
    const dur = kind === 'drop' ? 2.2 : kind === 'initial' ? 1 : Math.min(1.8, .6 + (b.w + b.h) / 600);
    all.push(...e.pours); seq.push({ pours: e.pours, d: dur }); }
  const ys = (made.letters ?? []).map(b => b.y);
  return { pours: all, letters: [], seq, runs: [], y0: ys.length ? Math.min(...ys) : 0 };
}
// a case on the press's clock: each piece's drum 1, then its drum 2 a beat behind (the drums' spacing)
function timeline(pr, kind, animate) {
  const own = []; let t = 0;
  for (const e of pr.seq) { const d = animate ? e.d : 0; e.pours.forEach((pour, k) => own.push({ t0: t + k * d * .45, t1: t + k * d * .45 + d, pour })); t += animate ? d * (e.pours.length > 1 ? 1.45 : 1) : 0; }
  return { own, u: Math.max(t, .01), cap: kind === 'drop' ? 5 : 3 };
}

export const riso = { label: 'Duplicator', pour: false, minGap: 2, theme: { rubric: 'rgb(61 85 136)', rubricDark: 'rgb(98 168 229)' },
  setup: () => ({}), kinds: (v, rich) => rich < .25 ? ['none'] : ['row'],
  fillAt: { gap: .6, head: 3, rise: 1 }, steady: ['drop'],
  paraph, filler, breakMark, initial, frames, palette, print, timeline };
export default riso;
