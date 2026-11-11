// Sumi (research/28-sumi.md) as a written style of the one library (kit/illum.js: rubricate(root, { style: 'sumi' })): East
// Asian ink-brush work as ornament, one round brush through the ink engine (kit/styles/sumi-brush.js: pressure, the hand's
// speed, each hair's charge spent and its track ending once, the wet ink's bleed, the halo where it dwelt), the cinnabar
// seal the rubric. Zero CJK characters: the letters are Latin, the seal's a Latin capital cut in Cinzel (OFL).
// The marks (kit/styles/sumi-pieces.js): the drop a large seal, the capital cut white into its red field (a cut stone's
// straight, leaning sides, a knocked corner, two or three chips, the press uneven and starved at one side); the line's
// initial the same stone, small; the paraph a point in vermilion; fillers and run-outs an orchid leaf laid low in the
// line's band; breaks a point, a long sweep, and the page's end mark (the ensō, an orchid clump or a broad dry circle, each
// with a seal from the drop's carver, once a page); a vertical beside a quotation, an aside and code, a horizontal over a
// pull quote and under a figure, a point before each entry of the contents.
// One hand a page (setup's seed): the brush, its pace, wetness and tone, the slope of its horizontals, the leaves' belly and
// lean, the end mark; every piece its own seed within it.
// The budget, from a quiet page to a full one, never crowded:
//   plain   the drop's seal, the paraph, the run-outs, the breaks; no fillers, no frames; the end leans to the plain circle
//   modest  paragraphs' fillers, the vertical beside a quotation, points at the contents
//   usual   the frames: an aside's and code's vertical, a pull quote's horizontal above, a figure's under its caption
//   fine    a second, paler leaf in a heading's run-out; a figure's horizontal above it as well
//   lavish  the drop's seal a size larger, hung up and out into the margin; a second leaf in a paragraph's filler; a seal at
//           the foot of the chapter's sweep; the pull quote's horizontal below it too; the end leans to the ensō and clump
// Drawn (?draw), each piece is written as the brush writes it (each stroke along its path at its pace, in stroke order),
// the seals pressed on from their fullest corner: never a fade, never a piece whole.
//   initial(o) -> { letters, width }   paraph(x, base, u, seed, rich)   filler(x0, x1, yTop, yBase, kind, seed, rich)
//   breakMark(cx, y, measure, rank, seed, rich, u, index, room)   frames.{ quote, aside, pull, figure, code, nav }
//   palette.{ light, dark }   print(made, { dpr, animate, wait, kind }) -> { pours, letters, seq, runs, y0, ready }   timeline(printed, kind, animate)
import { print as press, printMany, plan } from './sumi-brush.js';
import * as P from './sumi-pieces.js';

let PAGE = 7;
const isDark = () => { try { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } };
const lvOf = rich => Math.max(0, Math.min(4, Math.round(+rich * 4)));
// (every piece's seed moved by the page's: each page its own chips, press, leaves and strokes, the same every time)
const sd = seed => (Math.imul((seed | 0) ^ Math.imul(PAGE, 40503), 2654435761) >>> 0) % 100000 + 1;
const HAND = rich => P.hand(sd(1), rich), none = { marks: [], letters: [] };
const FS = u => u * 2.4;   // (the text's size from its x-height: EB Garamond's x is ~.42 em)
// a piece set on the page: its anchor at ax, ay; its box the ink's, as rubricate's checks and moves read it
const put = (pc, ax, ay, what, key) => ({ shape: 'sumi', x: ax + pc.at[0], y: ay + pc.at[1], w: pc.W, h: pc.H, pc, what, bkey: [what, key, PAGE].join('|') });
// set by its box's top left
const at = (pc, x, y, what, key) => put(pc, x - pc.at[0], y - pc.at[1], what, key);
const k = (...a) => a.map(v => typeof v === 'number' ? v.toFixed(1) : v).join(',');
const hits = (b, keep, pad = 2) => keep?.some(r => b[0] - pad < r[2] && b[2] + pad > r[0] && b[1] - pad < r[3] && b[3] + pad > r[1]);

// ---- the face ----------------------------------------------------------------------------------------------------------------------
// the capitals cut into the seals: Cinzel (Natanael Gama, OFL), subset and renamed (fonts/sumi/, its note and licence)
let FACEP = null;
export const loadFace = () => FACEP ??= typeof FontFace === 'undefined' ? Promise.resolve() :
  new FontFace('illum-sumi-cinzel', `url(${new URL('../../fonts/sumi/illum-sumi-cinzel-caps.woff2', import.meta.url)})`, { weight: '700' }).load().then(f => document.fonts.add(f)).catch(() => {});

// ---- the initials ------------------------------------------------------------------------------------------------------------------
const letterOf = ch => { const c = String(ch).normalize('NFD')[0].toUpperCase(); return /[A-Z]/.test(c) ? c : 'O'; };
// The drop: the seal from the first line's cap height to the last line's baseline, at the float's left edge; lavish, a size
// larger, hung up and out into the margin where the page leaves room. The line's initial: the same stone, small, on its
// own baseline, kept below the line above.
function initial({ ch = 'B', G, big = true, seed = 1, rich = .5, keep = [], u = 8 }) {
  const c = letterOf(ch), [x0, y0, , y1] = G.box, lv = lvOf(rich), hd = HAND(rich);
  if (big) { const H = y1 - y0; let hang = lv >= 4 ? .3 : 0;
    if (hang && (x0 - hang * H < 4 || hits([x0 - hang * H, y0 - hang * H, x0 + H, y0], keep))) hang = 0;
    const pc = P.initial(c, H, sd(seed), FS(u), hd, { hang });
    return { marks: [], letters: [put(pc, x0, y0, 'drop', k(c, H, seed, lv))], width: initial.width(c) * H }; }
  const x1 = G.box[2], near = keep.filter(r => r[0] < x1 + u && r[2] > x0 - u && r[3] <= y1 - (y1 - y0) * .5 && r[3] > y0 - (y1 - y0) * 2.5).sort((a, b) => b[3] - a[3]);
  const top = near[0] ? Math.max(y0, near[0][3] + 2) : y0, H = Math.max(u * 1.6, y1 - top);
  return { marks: [], letters: [put(P.lineSeal(c, H, sd(seed)), x0, y1 - H, 'line', k(c, H, seed))], width: initial.line(c) * (y1 - y0) };
}
initial.width = () => 1.1;   // (the seal is square: its side the drop's height, and a little room)
initial.line = () => 1.15;
initial.lines = 4; initial.phone = 3; initial.margin = .38;
initial.load = () => loadFace();

// ---- the paraph, fillers, breaks -----------------------------------------------------------------------------------------------------
// the paraph: a point in vermilion, centred in the indent's gap, its foot on the baseline
function paraph(x, base, u, seed, rich = .5) {
  const hd = HAND(rich), pc = P.paraph(FS(u), sd(seed), hd), cx = x + u * .825;
  return { marks: [], letters: [put(pc, cx - pc.W / 2 - pc.at[0], base, 'paraph', k(x, base, u, seed))] };
}
// a paragraph's free end (from modest) and a heading's run-out (from plain): an orchid leaf from x0 toward x1, laid on the
// x-height's middle
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  if (kind === 'none') return none;
  const u = yBase - yTop, lv = lvOf(rich), hd = HAND(rich), mid = yBase - u * .5, a = x0 + u * .45, w = x1 - a - u * .3;
  if (w < u * 4) return none;
  if (kind === 'rule') return { marks: [], letters: [put(P.runout(w, FS(u), sd(seed), hd, { two: lv >= 3 }), a, mid, 'runout', k(a, w, u, seed, lv))] };
  if (lv < 1) return none;
  return { marks: [], letters: [put(P.filler(w, FS(u) * 1.55, sd(seed), hd, { two: lv >= 4 }), a, mid, 'filler', k(a, w, u, seed, lv))] };
}
// three ranks: a part's (1) a point; a chapter's (3) the long sweep (lavish: a seal at its foot); the end (2) the page's end
// mark. Each kept in the room the page leaves it (the next rank down if it does not fit).
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8, index = 1, room = null) {
  const lv = lvOf(rich), hd = HAND(rich), s = sd(seed + (index | 0) * 7), fs = FS(u), deep = room && room[1] - room[0] > 0 ? room[1] - room[0] : u * 14;
  let pc = rank === 2 ? P.brk(3, measure, deep, s, fs, hd) : rank >= 3 ? P.brk(2, measure, deep, s, fs, hd, { seal: lv >= 4 }) : P.brk(1, measure, deep, s, fs, hd);
  if (pc.H > deep * .95 && rank !== 1) pc = P.brk(2, measure, deep, s, fs, hd);
  if (pc.H > deep * .95) return none;
  return { marks: [], letters: [put(pc, cx, y, 'break' + rank, k(cx, y, measure, rank, seed, lv, hd.end))] };
}

// ---- frames --------------------------------------------------------------------------------------------------------------------------
const linesBox = (box, lines) => !lines?.length ? box : [Math.min(...lines.map(L => L.left)), lines[0].top, Math.max(...lines.map(L => L.right)), lines.at(-1).base];
// a vertical down a block's margin, from a little above its first line to a little below its last, its right side at x
const vert = (x, y0, y1, u, seed, rich, what) => { const pc = P.vertical(y1 - y0, FS(u), sd(seed), HAND(rich)); return at(pc, x - pc.W, y0, what, k(x, y0, y1, seed)); };
const horiz = (cx, y, w, u, seed, rich, what) => { const pc = P.horizontal(w, FS(u), sd(seed), HAND(rich)); return at(pc, cx - pc.W / 2, y - pc.H / 2, what, k(cx, y, w, seed)); };
const frames = {
  // a quotation (from modest): one vertical down its margin, a hanging needle at its foot
  quote: ({ box, lines, u, seed = 1, rich = .5, limit = [0, 1e5] }) => { if (lvOf(rich) < 1) return none; const L = linesBox(box, lines), p = vert(L[0] - u * 1.5, L[1] - u * .4, L[3] + u * 1.1, u, seed, rich, 'quote');
    return p.x < limit[0] + 2 ? none : { marks: [], letters: [p] }; },
  // an aside (from usual): the same, inside its margin
  aside: ({ box, lines, u, seed = 1, rich = .5 }) => { if (lvOf(rich) < 2) return none; const L = linesBox([box[0] + u, box[1] + u, box[2] - u, box[3] - u], lines), p = vert(L[0] - u * 1.2, L[1] - u * .3, L[3] + u * .8, u, seed, rich, 'aside');
    return p.x < box[0] + 1 ? none : { marks: [], letters: [p] }; },
  // a pull quote (from usual): a horizontal over it; lavish, under it too
  pull: ({ cx, yTop, yBot, measure, u, seed = 1, rich = .5 }) => { const lv = lvOf(rich); if (lv < 2) return none; const w = Math.min(measure * .3, u * 20);
    return { marks: [], letters: [horiz(cx, yTop + u * .5, w, u, seed, rich, 'pull'), ...(lv >= 4 && yBot ? [horiz(cx, yBot - u * .6, w, u, seed + 1, rich, 'pull')] : [])] }; },
  // a figure (from usual): a horizontal under its caption; fine, over the figure as well
  figure: ({ box, cap, u, seed = 1, rich = .5, room = null }) => { const lv = lvOf(rich); if (lv < 2) return none; const w = Math.min((box[2] - box[0]) * .4, u * 22), cx = box[0] + w / 2 + u, out = [];
    const yb = (cap ?? box[3]) + u * 1.3; if (!room || yb + u < room[1]) out.push(horiz(cx, yb, w, u, seed, rich, 'figure'));
    const ya = box[1] - u * 1.3; if (lv >= 3 && (!room || ya - u > room[0])) out.push(horiz(cx, ya, w, u, seed + 1, rich, 'figure'));
    return { marks: [], letters: out }; },
  // code (from usual): a vertical down its margin
  code: ({ box, rows, u, seed = 1, rich = .5 }) => { if (lvOf(rich) < 2) return none; const R = rows?.length ? rows : null, t0 = R ? R[0].top : box[1] + u * 3, t1 = R ? R.at(-1).base : box[3] - u * 3, left = R ? Math.min(...R.map(r => r.left)) : box[0] + u * 3;
    const p = vert(left - u * 1.4, t0, t1 + u * .4, u, seed, rich, 'code'); return p.x < box[0] + 1 ? none : { marks: [], letters: [p] }; },
  // the contents (from modest): a point before each entry
  nav: ({ box, entries, u, seed = 1, rich = .5 }) => { if (lvOf(rich) < 1) return none; const E = entries.filter(Boolean); if (!E.length) return none; const x = Math.max(4, Math.min(...E.map(e => e.left)) - u * 2.2), hd = HAND(rich);
    return { marks: [], letters: E.map((e, i) => { const pc = P.point(FS(u), sd(seed + i * 13), hd); return at(pc, x - pc.W / 2, e.base - u * .5 - pc.H / 2, 'nav', k(x, e.base, seed, i)); }) }; },
};

// ---- printing ------------------------------------------------------------------------------------------------------------------------
// Each piece printed once through the ink engine at the device's resolution and kept by what it is (kind, place, seed,
// budget, the page's hand). Drawn, the piece's still is shown through the path the brush has run so far, each stroke at
// its own moment and width (kit/inkletter.js sweepIn 'reveal'), and a seal through a front moving from its fullest corner.
export const TIME = { build: 0, pieces: 0 };
const MADE = new Map();
function still(b, d, theme) { const key = [theme, d, b.bkey].join('|'); let m = MADE.get(key);
  if (!m || m.ready) { const t0 = performance.now(), cv = press(b.pc, theme, { dpr: d }); m = { canvas: cv, w: cv.width, h: cv.height }; if (MADE.size > 400) MADE.clear(); MADE.set(key, m); TIME.build += performance.now() - t0; TIME.pieces++; }
  return m; }
// a page's still pieces gathered while the host makes its cases, then printed together (sumi-brush.js printMany: one pour,
// one render and one copy out of the GPU per ink for the lot), the host awaiting each case's `ready`
let BATCH = null;
function later(b, d, theme) { const key = [theme, d, b.bkey].join('|'), m = MADE.get(key); if (m) return m.ready ?? m;
  if (!BATCH) { const B = BATCH = { jobs: [] }; B.done = new Promise(ok => setTimeout(() => { BATCH = null;
    const t0 = performance.now(), groups = new Map(); for (const j of B.jobs) { const g = j.theme + '|' + j.d; (groups.get(g) ?? groups.set(g, []).get(g)).push(j); }
    for (const js of groups.values()) printMany(js.map(j => j.b.pc), js[0].theme, { dpr: js[0].d }).forEach((cv, i) => Object.assign(js[i].m, { canvas: cv, w: cv.width, h: cv.height, ready: null }));
    TIME.build += performance.now() - t0; TIME.pieces += B.jobs.length; ok(); })); }
  const e = { ready: null }; e.ready = BATCH.done.then(() => e); BATCH.jobs.push({ b, d, theme, m: e }); if (MADE.size > 400) MADE.clear(); MADE.set(key, e); return e.ready; }
function print(made, { dpr = 1, animate = false, wait = false } = {}) {
  const d = Math.min(3, Math.max(1, dpr)), theme = isDark() ? 'dark' : 'light', all = [], seq = [], waits = [];
  for (const b of made.letters ?? []) { if (b.shape !== 'sumi') continue;
    const pad = b.pc.pad ?? 8, X = b.x - pad, Y = b.y - pad, pour = { res: d, col: 'k', x0: X, y0: Y };
    const fin = g => { const m = still(b, d, theme); g.drawImage(m.canvas, X, Y, m.w / d, m.h / d); };
    if (animate) {
      const prog = plan(b.pc, d, pad), marks = [];
      for (const L of prog.layers) for (const S of L.strokes) {
        if (S.ops) { const o = S.ops, pts = []; let w = 0;
          for (let i = 0; i < o.length; i += 16) { w = Math.max(w, Math.hypot(o[i + 2] - o[i], o[i + 3] - o[i + 1])); pts.push([X + o[i + 8] / d, Y + o[i + 9] / d, o[i + 15]], [X + o[i + 10] / d, Y + o[i + 11] / d, o[i + 15]]); }
          marks.push({ pts, w: w / d + 6, t0: S.t0, t1: S.t1 }); }
        else if (S.seal) { const [x, y, w, h] = S.rect, [ax, ay] = S.seal.ang; marks.push({ seal: [X + x / d, Y + y / d, w / d, h / d], ax, ay, t0: S.t0, t1: S.t1 }); } }
      const total = Math.max(1, prog.dur), dur = Math.min(b.what === 'drop' ? 1.2 : b.what.startsWith('break') ? 3.5 : 2.5, Math.max(.4, total / 1000));
      Object.assign(pour, { w: (b.w + 2 * pad) * d, h: (b.h + 2 * pad) * d, paint: fin,
        grow: { mode: 'reveal', fn: (g, f) => { if (f >= 1) return fin(g); const T = f * total;
          g.save(); g.lineCap = g.lineJoin = 'round'; g.strokeStyle = g.fillStyle = '#000';
          for (const m of marks) { if (m.t0 > T) continue;
            if (m.seal) { // the stone pressed: a front from its fullest corner, a little soft
              const [x, y, w, h] = m.seal, u = Math.min(1, (T - m.t0) / Math.max(1, m.t1 - m.t0)), cx = x + w / 2, cy = y + h / 2, R = Math.hypot(w, h) / 2;
              const sx = cx + m.ax * R, sy = cy + m.ay * R, ex = cx - m.ax * R, ey = cy - m.ay * R, gr = g.createLinearGradient(sx, sy, ex, ey), c = u * 1.15;
              gr.addColorStop(0, '#000'); gr.addColorStop(Math.max(0, Math.min(1, c - .15)), '#000'); gr.addColorStop(Math.max(.001, Math.min(1, c)), 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
              g.fillStyle = gr; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = '#000'; continue; }
            g.lineWidth = m.w; g.beginPath(); let n = 0;
            for (const [x, y, t] of m.pts) { if (t > T) break; n++ ? g.lineTo(x, y) : g.moveTo(x, y); }
            if (n === 1) g.lineTo(m.pts[0][0] + .01, m.pts[0][1]);
            if (n) g.stroke(); }
          g.restore(); } } });
      seq.push({ pour, d: dur });
    } else { const m = wait ? later(b, d, theme) : still(b, d, theme), place = m => Object.assign(pour, { w: m.w, h: m.h, paint: g => g.drawImage(m.canvas, X, Y, m.w / d, m.h / d) });
      if (m.then) { pour.ready = m.then(place); waits.push(pour.ready); } else place(m); seq.push({ pour, d: 0 }); }
    all.push(pour); }
  const ys = (made.letters ?? []).map(b => b.y);
  return { pours: all, letters: [], seq, runs: [], y0: ys.length ? Math.min(...ys) : 0, ready: waits.length ? Promise.all(waits) : undefined };
}
// a case on the brush's clock: its pieces one after another, each over the time the hand takes (held to a cap)
function timeline(pr, kind, animate) {
  const own = []; let t = 0;
  for (const e of pr.seq) { const d = animate ? e.d : 0; own.push({ t0: t, t1: t + d, pour: e.pour }); t += d; }
  return { own, u: Math.max(t, .01), cap: kind === 'drop' ? 3 : 4 };
}

export const palette = { light: { k: [192, 54, 36] }, dark: { k: [222, 92, 68] } };
export const sumi = { label: 'Sumi', minGap: 2, theme: { rubric: 'rgb(190 52 36)', rubricDark: 'rgb(226 104 82)' },
  setup: SEED => { PAGE = SEED >>> 0 || 7; return {}; }, kinds: (v, rich) => rich < .25 ? ['none'] : ['row'],
  fillAt: { gap: .6, head: 3, rise: 1 }, steady: ['drop'],
  paraph, filler, breakMark, initial, frames, palette, print, timeline };
export default sumi;
