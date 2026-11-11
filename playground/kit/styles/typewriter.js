// Typewriter (research/27-typewriter.md) as a written style of the one library (kit/illum.js: rubricate(root, { style:
// 'typewriter' })): variegated typewriting, the office typist's two-colour ribbon as rubrication. Black for the text's
// furniture, red for what it raises (Pitman, 1897); the typist's own display (the rank ladder's underscore, the leader,
// the dash rule, a legal caption's colon column, 1886) and, at the top of the budget, typestract forms typed from the
// page's own letters (Houédard's Sonic Water). One machine types the page (setup's seed): its every key has its own
// faults, the same on every strike; the ribbon is drawn down by a run and wicks back; every piece is typed by
// kit/styles/typewriter-machine.js and poured through the ink engine, a page's still pieces as one sheet.
// The drop: the capital (Courier Prime Bold) reserved as paper in a typed field under a card, the field one of three
// (kit/styles/typewriter-variegated.js: words, graded, tone), the page's machine choosing, a rich page favouring words.
// The budget, as a typist goes from a memo to a typestract:
//   plain   (a memo) one black ribbon: the drop's field in black, a black pilcrow, the breaks in black; no fillers, no frames
//   modest  (a letter) the two-colour ribbon: the drop in red, the red pilcrow, the heading's underscore run out in red,
//           red at the breaks' hearts, the quotation's caption column, a dash before each entry of the contents
//   usual   (a report) the leader in a paragraph's open end, typed rules at the head of an aside and of code, an = rule
//           over a pull quote, corner marks at two of a figure's corners
//   fine    (a manuscript) the end typed as nested squares of the heading's letters, all four of a figure's corners, the
//           breaks varied by their number
//   lavish  (a typestract) the drop's field typed from the paragraph's own words, rules at the foot of an aside, of code
//           and of a pull quote too, the pilcrow struck twice
// Drawn (?draw), each piece is typed as you watch: strike by strike in the typist's rhythm, the carriage returning.
//   (the line's initial: the capital typed at the text's size, struck twice and underscored, in red)
//   initial(o) -> { letters, width }   paraph(x, base, u, seed, rich)   filler(x0, x1, yTop, yBase, kind, seed, rich)
//   breakMark(cx, y, measure, rank, seed, rich, u, index, room)   frames.{ quote, aside, pull, figure, code, nav }
//   palette.{ light, dark }   print(made, { dpr, kind, animate, wait }) -> { pours, letters, seq, runs, y0, ready }   timeline(printed, kind, animate)
import { machine, pressMany, writer, loadFace, FACE } from './typewriter-machine.js';
import * as A from './typewriter-variegated.js';

export const palette = { light: { k: [172, 52, 36] }, dark: { k: [226, 100, 70] } };
const isDark = () => { try { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } };
const lvOf = rich => Math.max(0, Math.min(4, Math.round(+rich * 4)));
let PAGE = 7;   // (the page's seed: setup's, or the host's when it gave one)
const PS = () => (typewriter.seeded | 0) || PAGE;
const none = { marks: [], letters: [] };
const FS = u => u * 2.4;   // (the text's size from its x-height: EB Garamond's x is ~0.42 em; the typed face is set at it)
const LH = em => em * 1.5;  // (the machine's own line: one and a half spacing; its half and quarter lines are the platen's feeds)
const cellW = em => .6 * em, snap = (x, em) => Math.ceil(x / cellW(em) - 1e-6) * cellW(em);   // (the machine's columns)
const at = (ch, x, y, col = 'k', o = {}) => ({ ch, x, y, col, ...o });
const ctx = (fs, rich) => ({ em: fs, lh: LH(fs), seed: PS(), family: FACE.family, rich, lv: lvOf(rich), words: { text: words(), head: head() } });
// the page's own words (the drop's field, the end's squares), read from the page
const words = () => { try { return document.querySelector('.ini.drop')?.closest('p')?.textContent.slice(0, 160) ?? 'type'; } catch { return 'type'; } };
const head = () => { try { return (document.querySelector('h1')?.textContent ?? 'type').split(/\s+/).sort((a, b) => b.length - a.length)[0]; } catch { return 'type'; } };

// ---- pieces -----------------------------------------------------------------------------------------------------------------
// a typed piece ({ W, H, em, strikes, mask? }) at x, y on the page (its box's top left), kept by what it is
const piece = (x, y, pc, what) => ({ shape: 'typewriter', x, y, w: pc.W, h: pc.H, pc, what, bkey: JSON.stringify([what, pc.W, pc.H, pc.strikes.map(s => s.ch + s.col + s.x.toFixed(1) + ',' + s.y.toFixed(1)).join(';')]) });
const ink = lv => lv < 1 ? 'k' : 'r';
const recolour = (pc, lv) => lv < 1 ? { ...pc, strikes: pc.strikes.map(s => ({ ...s, col: 'k' })) } : pc;

// ---- the initials -----------------------------------------------------------------------------------------------------------
const letterOf = ch => { const c = String(ch).normalize('NFD')[0].toUpperCase(); return /[A-Z0-9]/.test(c) ? c : 'O'; };
const CW = {};
const capW = c => CW[c] ??= (() => { const g = new OffscreenCanvas(4, 4).getContext('2d'); g.font = `700 100px "${FACE.family}"`; const H = g.measureText('H').actualBoundingBoxAscent, m = g.measureText(c);
  return (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / H; })();
// the drop's box, in cap heights: the capital at .8 of the box and a cell and a half of field about it
const dropW = ch => .84 * capW(letterOf(ch)) + .26;
function initial({ ch = 'B', G, big = true, rich = .5, u = 8, keep = [] }) {
  const c = letterOf(ch), [x0, , x1, y1] = G.box, lv = lvOf(rich), fs = +FS(u).toFixed(2); let y0 = G.box[1];
  if (!big) {
    // the line's initial: the capital typed at the text's own size in red, struck twice, a typed underscore beneath it
    // (as the ladder raises a word); at a line's height a field could not hold its letter
    const pc = { W: cellW(fs), H: fs * 1.1, em: fs, lh: LH(fs), strikes: [at(c, 0, fs * .8, ink(lv)), at(c, 0, fs * .8, ink(lv)), at('_', 0, fs * .8, ink(lv))] };
    return { marks: [], letters: [piece(x0, y1 - fs * .8, pc, 'line:' + c)], width: .53 };
  }
  const H = y1 - y0, W = x1 - x0, pc = A.initial(c, H, { ...ctx(fs, rich), W, H, ink: ink(lv), drop: lv >= 4 ? 'words' : lv < 1 ? 'tone' : undefined });
  return { marks: [], letters: [piece(x0 + (W - pc.W) / 2, y0, pc, 'drop:' + c)], width: dropW(c) };
}
initial.width = ch => dropW(ch);
initial.line = () => .53;   // (a typed cell and a little room, in the span's cap heights at its 1.8 em)
initial.lines = 5; initial.phone = 4; initial.margin = .38;
initial.load = () => loadFace();

// ---- the paraph, fillers, breaks --------------------------------------------------------------------------------------------
// the pilcrow in the indent's gap, on the baseline: red (black on a memo), struck once or twice
function paraph(x, base, u, seed, rich = .5) {
  const fs = +FS(u).toFixed(2), lv = lvOf(rich), pc = recolour(A.paraph({ ...ctx(fs, rich) }), lv);
  if (lv >= 4 && pc.strikes.filter(s => s.ch === '¶').length < 2) pc.strikes.unshift({ ...pc.strikes[0] });
  return { marks: [], letters: [piece(x + u * .825 - pc.W / 2, base - pc.base, pc, 'paraph')] };
}
// a heading's run-out: the underscore carried to the margin (modest); a paragraph's open end: the leader (usual), only
// where the line is left well open. On the machine's columns, as the typist's tab stops are.
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  if (kind === 'none') return none;
  const u = yBase - yTop, lv = lvOf(rich), fs = +FS(u).toFixed(2), cw = cellW(fs), xs = snap(x0 + u * .5, fs), room = x1 - xs;
  if (kind === 'rule') { if (lv < 1 || room < cw * 4) return none; const pc = A.runout(Math.min(room, cw * 48), ctx(fs, rich)); return { marks: [], letters: [piece(xs, yBase - pc.base, pc, 'runout')] }; }
  if (lv < 2 || room < u * [0, 0, 16, 11, 8][lv]) return none;
  const pc = A.filler(Math.min(room, cw * 56), ctx(fs, rich));
  return pc.strikes.length ? { marks: [], letters: [piece(xs, yBase - pc.base, pc, 'filler')] } : none;
}
// three ranks: a part's (rank 1) the stars; a chapter's (rank 3) the dash rule with its red star; the end (rank 2) the
// band, or (fine) nested squares of the heading's letters. Each kept in the room the page leaves it; plain all in black.
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8, index = 1, room = null) {
  const lv = lvOf(rich), fs = +FS(u).toFixed(2), deep = room && room[1] - room[0] > 0 ? room[1] - room[0] : u * 14, n = index | 0, c = { ...ctx(fs, rich), seed: PS() + (lv >= 3 ? n * 7 : 0) };
  let pc = rank === 2 ? A.brk(3, measure, c) : rank >= 3 ? A.brk(2, measure, c) : A.brk(1, measure, c);
  if (rank === 2 && lv < 3) { const cw = cellW(fs), n2 = Math.floor(Math.min(measure * .4, 30 * cw) / cw), hr = LH(fs) / 2, s = [];
    for (let i = 0; i < n2; i++) s.push(at('=', i * cw, fs * .8), at('x', i * cw, fs * .8 + hr, 'r'), at('=', i * cw, fs * .8 + 2 * hr));
    pc = { W: n2 * cw, H: fs * .8 + 2 * hr + fs * .4, em: fs, lh: LH(fs), strikes: s }; }
  if (pc.H > deep * .92) return none;
  pc = recolour(pc, lv);
  return { marks: [], letters: [piece(snap(cx - pc.W / 2, fs), y - pc.H / 2, pc, 'break' + rank)] };
}

// ---- frames -------------------------------------------------------------------------------------------------------------------
const linesBox = (box, lines) => !lines?.length ? box : [Math.min(...lines.map(L => L.left)), lines[0].top, Math.max(...lines.map(L => L.right)), lines.at(-1).base];
const pageW = () => globalThis.document?.documentElement.clientWidth ?? Infinity;
// a typed rule: '+' at its ends and the key between, w wide
const rule = (w, fs, key = '-', col = 'k') => { const cw = cellW(fs), n = Math.max(3, Math.floor(w / cw)), s = []; for (let i = 0; i < n; i++) s.push(at(i === 0 || i === n - 1 ? '+' : key, i * cw, fs * .7, col)); return { W: n * cw, H: fs * .9, em: fs, lh: LH(fs), strikes: s }; };
const frames = {
  // a quotation: the caption's column (a red colon a line, a black star at the middle) a cell and a half out
  quote: ({ box, lines, u, rich = .5 }) => { const lv = lvOf(rich); if (lv < 1 || !lines?.length) return none; const fs = +FS(u).toFixed(2), cw = cellW(fs), h = A.hand(PS()), L = [...lines].sort((p, q) => p.base - q.base).reduce((a, l) => { if (a.length && l.base - a.at(-1).base < fs * .8) a[a.length - 1] = l; else a.push(l); return a; }, []), mid = Math.floor((L.length - 1) / 2), y0 = L[0].base - fs;
    const pc = { W: cw, H: L.at(-1).base - y0 + fs * .3, em: fs, lh: LH(fs), strikes: L.map((l, k) => at(k === mid ? h.mark : h.col, 0, l.base - y0, k === mid ? 'k' : 'r')) }, x = linesBox(box, L)[0] - cw * 1.6;
    return x < 2 ? none : { marks: [], letters: [piece(x, y0, pc, 'quote')] }; },   // (lines: one a line box; a block's own rect, a little above its first line's, gives way to it)
  // an aside: a typed rule at its head (usual), at its foot as well (lavish)
  aside: ({ box, u, rich = .5 }) => { const lv = lvOf(rich); if (lv < 2) return none; const fs = +FS(u).toFixed(2), pc = rule(Math.min((box[2] - box[0]) * .5, fs * 9), fs);
    const out = [piece(box[0] + u * 1.2, box[1] + u * 1.6 - pc.H / 2, pc, 'aside')]; if (lv >= 4) out.push(piece(box[2] - u * 1.2 - pc.W, box[3] - u * 2.2 - pc.H / 2, pc, 'aside'));
    return { marks: [], letters: out }; },
  // a pull quote: a short = rule in red over it (usual), under it as well (lavish)
  pull: ({ cx, yTop, yBot, u, rich = .5 }) => { const lv = lvOf(rich); if (lv < 2) return none; const fs = +FS(u).toFixed(2), pc = rule(fs * 7, fs, '=', 'r');
    const out = [piece(snap(cx - pc.W / 2, fs), yTop + u * .4 - pc.H / 2, pc, 'pull')]; if (lv >= 4 && yBot) out.push(piece(snap(cx - pc.W / 2, fs), yBot - u * .6 - pc.H / 2, pc, 'pull'));
    return { marks: [], letters: out }; },
  // a figure: a typed corner mark (a + with its arms, as a paste-up's) at two of its corners (usual), all four (fine)
  figure: ({ box, u, rich = .5 }) => { const lv = lvOf(rich); if (lv < 2) return none; const fs = +FS(u).toFixed(2), cw = cellW(fs), W = pageW();
    const pc = { W: cw, H: fs, em: fs, lh: LH(fs), strikes: [at('+', 0, fs * .75, 'r')] };
    const pts = [[box[0] - cw * 1.2, box[1] - fs * 1.1], [box[2] + cw * .2, box[3] + fs * .1], [box[2] + cw * .2, box[1] - fs * 1.1], [box[0] - cw * 1.2, box[3] + fs * .1]].slice(0, lv >= 3 ? 4 : 2);
    return { marks: [], letters: pts.filter(([x]) => x >= 2 && x + cw <= W - 2).map(([x, y]) => piece(x, y, pc, 'figure')) }; },
  // code: a typed rule at its head (usual), at its foot as well (lavish)
  code: ({ box, u, rich = .5 }) => { const lv = lvOf(rich); if (lv < 2) return none; const fs = +FS(u).toFixed(2), pc = rule(Math.min((box[2] - box[0]) - u * 4, fs * 10), fs);
    const out = [piece(box[0] + u * 2, box[1] + u * 1.5 - pc.H / 2, pc, 'code')]; if (lv >= 4) out.push(piece(box[2] - u * 2 - pc.W, box[3] - u * 1.7 - pc.H / 2, pc, 'code'));
    return { marks: [], letters: out }; },
  // the contents: a red dash before each entry, as a typed list (modest)
  nav: ({ box, entries, u, rich = .5 }) => { if (lvOf(rich) < 1) return none; const E = entries.filter(Boolean); if (!E.length) return none; const fs = +FS(u).toFixed(2), cw = cellW(fs);
    const pc = { W: cw, H: fs, em: fs, lh: LH(fs), strikes: [at('-', 0, fs * .75, 'r')] };
    return { marks: [], letters: E.map(e => piece(Math.max(2, box[0] - u * 1.4 - cw), e.base - fs * .75, pc, 'nav')) }; },
};

// ---- printing ------------------------------------------------------------------------------------------------------------------
// Each piece typed once by the page's machine at the device's resolution, kept by what it is and where it stands (the
// paper's fibre is the page's); a page's still pieces are gathered while the host makes its cases and poured together
// (pressMany: one pour and one read back per ribbon colour for the lot), the host awaiting each case's `ready`. Drawn, a
// piece is typed on a canvas of its own as you watch, then laid as the still.
export const TIME = { build: 0, pieces: 0 };
const MADE = new Map(), MACH = new Map();
const mach = () => { const s = PS(); let M = MACH.get(s); if (!M) { if (MACH.size > 8) MACH.clear(); M = machine(s, { family: FACE.family }); MACH.set(s, M); } return M; };
const hexOf = s => { const m = String(s).match(/\d+(\.\d+)?/g); if (!m || m.length < 3) return null; return '#' + m.slice(0, 3).map(v => Math.round(+v).toString(16).padStart(2, '0')).join(''); };
const paper = theme => { try { const v = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(); if (/^#[0-9a-f]{6}$/i.test(v)) return v; const h = hexOf(v); if (h) return h; } catch {} return theme === 'dark' ? '#17161A' : '#F2EEE4'; };
const toCanvas = r => { const c = new OffscreenCanvas(r.cw, r.ch); c.getContext('2d').putImageData(r.img, 0, 0); return { canvas: c, w: r.cw, h: r.ch, pad: r.pad }; };
const keyOf = (b, d, look) => [look.theme, look.stock, d, PS(), b.x.toFixed(1), b.y.toFixed(1), b.bkey].join('|');
const keep = (k, m) => { if (MADE.size > 600) MADE.clear(); MADE.set(k, m); return m; };
// pieces typed together: one sheet a theme and resolution
function typeAll(jobs) { const t0 = performance.now(), groups = new Map();
  for (const j of jobs) { const g = j.look.theme + '|' + j.look.stock + '|' + j.d; (groups.get(g) ?? groups.set(g, []).get(g)).push(j); }
  for (const js of groups.values()) pressMany(mach(), js.map(j => ({ piece: j.b.pc, at: [j.b.x, j.b.y] })), js[0].look, { d: js[0].d }).forEach((r, i) => Object.assign(js[i].m, toCanvas(r), { ready: null }));
  TIME.build += performance.now() - t0; TIME.pieces += jobs.length; }
function still(b, d, look) { const k = keyOf(b, d, look); let m = MADE.get(k); if (m && !m.ready) return m; m = keep(k, {}); typeAll([{ b, d, look, m }]); return m; }
let BATCH = null;
function later(b, d, look) { const k = keyOf(b, d, look), m = MADE.get(k); if (m) return m.ready ?? m;
  if (!BATCH) { const B = BATCH = { jobs: [] }; B.done = new Promise(ok => setTimeout(() => { BATCH = null; typeAll(B.jobs); ok(); })); }
  const e = { ready: null }; e.ready = BATCH.done.then(() => e); BATCH.jobs.push({ b, d, look, m: e }); keep(k, e); return e.ready; }
function print(made, { dpr = 1, animate = false, wait = false, kind } = {}) {
  const d = Math.min(3, Math.max(1, dpr)), theme = isDark() ? 'dark' : 'light', look = { theme, stock: paper(theme) }, all = [], seq = [], waits = [];
  for (const b of made.letters ?? []) { if (b.shape !== 'typewriter') continue;
    const pad = Math.ceil(b.pc.em * .6), X = b.x - pad, Y = b.y - pad, pour = { res: d, col: 'k', x0: X, y0: Y };
    const lay = m => Object.assign(pour, { w: m.w, h: m.h, paint: g => g.drawImage(m.canvas, X, Y, m.w / d, m.h / d) });
    if (animate) {
      // typed on a canvas of its own as you watch (the machine's writer), the still laid when it is done
      let w = null, cv = null; const cap = kind === 'drop' ? 4 : 2.2;
      const fin = g => { const m = still(b, d, look); g.drawImage(m.canvas, X, Y, m.w / d, m.h / d); };
      Object.assign(pour, { w: Math.ceil((b.w + 2 * pad) * d), h: Math.ceil((b.h + 2 * pad) * d), paint: fin,
        grow: { mode: 'reveal', fn: (g, f) => { if (f >= 1) return fin(g);
          if (!w) { cv = document.createElement('canvas'); w = writer(mach(), b.pc, look, { d, at: [b.x, b.y], cap, mask: true }, cv); }   // (the share of each pixel's ink landed: the still seen through it)
          w.at(f * w.dur); g.drawImage(cv, X, Y, cv.width / d, cv.height / d); } } });
      seq.push({ pour, d: cap });
    } else {
      const m = wait ? later(b, d, look) : still(b, d, look);
      if (m.then) { pour.ready = m.then(lay); waits.push(pour.ready); } else lay(m);
      seq.push({ pour, d: 0 }); }
    all.push(pour); }
  const ys = (made.letters ?? []).map(b => b.y);
  return { pours: all, letters: [], seq, runs: [], y0: ys.length ? Math.min(...ys) : 0, ready: waits.length ? Promise.all(waits) : undefined };
}
// a case on the typist's clock: its pieces one after another, each in the time its typing takes (held to a cap)
function timeline(pr, kind, animate) {
  const own = []; let t = 0;
  for (const e of pr.seq) { const d = animate ? e.d : 0; own.push({ t0: t, t1: t + d, pour: e.pour }); t += d; }
  return { own, u: Math.max(t, .01), cap: kind === 'drop' ? 5 : 3 };
}

export const typewriter = { label: 'Typewriter', minGap: 2, theme: { rubric: 'rgb(172 52 36)', rubricDark: 'rgb(226 100 70)' },
  setup: SEED => { PAGE = SEED >>> 0 || 7; return {}; }, kinds: (v, rich) => rich < .25 ? ['none'] : ['row'],
  fillAt: { gap: .6, head: 3, rise: 1 }, steady: ['drop'],
  paraph, filler, breakMark, initial, frames, palette, print, timeline };
export default typewriter;
