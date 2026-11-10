// Plotter (research/25-plotter.md) as a written style of the one library (kit/illum.js: rubricate(root, { style: 'plotter' })):
// a pen on a carriage, its paths exact, its ink laid through the ink engine with the machine's speed, dwell and pen
// changes (kit/styles/plotter-pen.js), measured against real plots (tests/plotter-medium.html, the masters).
// Two kinds (STYLES.plotter.kind):
//   'section' (B, the default)  an AxiDraw on Bristol, two liners: the engineer's section, a contour and lines inside it at
//                               the page's angle, back and forth; the drop a capital of Jost (OFL) outlined and sectioned
//   'office'  (A)               an HP 7475A on plotter bond, its fibre tips: what HP-GL draws (Hershey's Roman Triplex in
//                               the rubric pen, line types, area fills, crop marks, the plot's legend)
// One hand a page: setup(SEED) sets the page's choices once (kit/styles/plotter-section.js, plotter-office.js hand()), each
// piece varies within them by its own seed. Five budgets: plain is a proof (outlines, single rules, open hatch); modest and
// usual the page's grammar; fine adds the second family and the frames' second rules; lavish the datum lines, title blocks
// and the fuller swatch, nothing busier. Every mark is placed clear of the words it stands beside.
// Printed as rock is (kit/styles/rock.js): each piece its own canvas, kept by what it is; drawn (?draw), plotted as the
// machine would, pen by pen, the nearest stroke next.
import { printMany, writer, MM } from './plotter-pen.js';
import * as SEC from './plotter-section.js';
import * as OFF from './plotter-office.js';
import { make, hatch, hershey, hersheyBox, outline, line, shape, closed, rng, dashes } from './plotter-draw.js';
import { JOST, TRIPLEX, DUPLEX } from './plotter-letters.js';

let KIND = 'section', PAGE = 1;
const isDark = () => { try { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } };
const lvOf = rich => Math.max(0, Math.min(4, Math.round(+rich * 4)));
// (a page given its own seed: every piece's seed moved by it, so the page's choices differ, not only its registration)
const sd = seed => { const v = plotter.seeded | 0; return v ? (Math.imul(seed ^ v * 40503, 2654435761) >>> 0) % 100000 + 1 : seed; };
const K = () => KIND === 'office' ? OFF : SEC, HAND = () => K().hand(sd(PAGE)), none = { marks: [], letters: [] };
const P = () => K().PENS, mk = (layers, seed) => make(layers, K().MACHINE, seed);
const clear = (b, keep, pad) => !keep?.some(r => b[0] - pad < r[2] && b[2] + pad > r[0] && b[1] - pad < r[3] && b[3] + pad > r[1]);

// a piece set on the page: its anchor at ax, ay; its box the ink's (x, y, w, h), as rubricate's checks and moves read it
const put = (pc, ax, ay, what, key) => ({ shape: 'plotter', x: ax + pc.at[0], y: ay + pc.at[1], w: pc.W, h: pc.H, pc, what, bkey: [KIND, what, key].join('|') });
const one = l => ({ marks: [], letters: [l] });

// ---- the letters ---------------------------------------------------------------------------------------------------------------
const letterOf = ch => { const c = String(ch).normalize('NFD')[0].toUpperCase(); return /[A-Z]/.test(c) ? c : 'O'; };
// a capital's ink, unit cap height: Jost's from its contours, Hershey's from its strokes (Q's tail and J's foot included)
const jExt = c => { const p = JOST[c].c.flat(); return [Math.min(...p.map(q => q[0])) / 1000, Math.min(...p.map(q => q[1])) / 1000, Math.max(...p.map(q => q[0])) / 1000, Math.max(...p.map(q => q[1])) / 1000]; };
const hExt = (c, F) => { const p = F[c].s.flat(); return [(Math.min(...p.map(q => q[0])) - F[c].l) / 21, (Math.min(...p.map(q => q[1])) - 9) / 21, (Math.max(...p.map(q => q[0])) - F[c].l) / 21, (Math.max(...p.map(q => q[1])) - 9) / 21]; };
const ext = (c, small) => KIND === 'office' ? hExt(c, small ? DUPLEX : TRIPLEX) : jExt(c);
const inkW = (c, small) => { const e = ext(c, small); return (e[2] - e[0]) / (e[3] - e[1]); };
// (the office's drop may stand in a ruled box or on a panel: its float leaves that room at every budget)
const BOX = .11;
function dropPiece(c, capH, seed, lv, hd, keep, at) {
  const e = ext(c), k = capH / (e[3] - e[1]);
  if (KIND === 'section') { const H = k, s = sd(seed), r = rng(s * 3 + 9), gap = hd.gap * (.95 + .15 * r()) * (lv === 0 ? 1.6 : 1), cross = lv >= 3 || (lv === 2 && hd.cross);
    const cs = outline(c, 0, -e[1] * H, H).contours, L = [{ pen: P().black, paths: cs.map(closed) },
      { pen: P().red, paths: [...hatch(cs, hd.ang, gap, { inset: .18 * MM }), ...(cross ? hatch(cs, hd.ang + Math.PI / 2, gap * 1.15, { inset: .18 * MM }) : [])] }];
    // (lavish: datum lines at the cap height and the baseline, ticked at their ends, as a section is dimensioned)
    if (lv >= 4) { const w = (e[2] - e[0]) * H, x0 = -Math.min(1.6 * MM, at.room), t = 1.2 * MM; L[0].paths.push(line(x0, 0, w, 0), line(x0, capH, w, capH), line(x0, -t, x0, t), line(x0, capH - t, x0, capH + t)); }
    return mk(L, s); }
  const s = sd(seed), m = capH * BOX, drop = lv <= 1 ? 'plain' : lv === 2 ? hd.drop : lv === 3 ? (hd.drop === 'plain' ? 'box' : hd.drop) : 'both';
  const mm = drop === 'plain' ? 0 : m, ki = (capH - 2 * mm) / (e[3] - e[1]);
  // (Hershey's capital: its ink from e[1] to e[3] cap heights about the baseline hershey() is given; set with its ink's top-left at the margin)
  const Lp = hershey(c, 0, 0, ki, 'triplex').paths.map(p => p.map(([x, y]) => [x - e[0] * ki + mm, y - e[1] * ki + mm]));
  if (drop === 'plain') return mk([{ pen: P().red, paths: Lp }], s);
  const w = (e[2] - e[0]) * ki + 2 * m, box = [[0, 0], [w, 0], [w, capH], [0, capH]], r = rng(s * 13 + 5), layers = [];
  if (drop === 'panel' || drop === 'both') layers.push({ pen: P().shade, paths: hatch([box], hd.fa === 0 ? Math.PI / 4 : hd.fa, (1.5 + r() * .6) * MM, { inset: .2 * MM }) });   // (open: the panel a ground for the rubric letter, not a rival)
  if (drop === 'box' || drop === 'both') { const t = 1.4 * MM, ticks = box.flatMap(([x, y], i) => { const sx = i === 1 || i === 2 ? 1 : -1, sy = i > 1 ? 1 : -1; return [line(x, y, x + sx * t * (sx < 0 && x - t < -at.room ? 0 : 1), y), line(x, y, x, y + sy * t * (sy < 0 ? 0 : 1))]; });
    layers.push({ pen: P().black, paths: [closed(box), ...ticks] }); }
  layers.push({ pen: P().red, paths: Lp }); return mk(layers, s);
}
// The drop: the capital's ink from the first line's cap height to the last line's baseline, at the float's left edge.
// The line's initial: Jost sectioned more finely (B), Hershey's Duplex in the rubric pen (A), on its own baseline.
function initial({ ch = 'B', G, big = true, seed = 1, rich = .5, keep = [], u = 8, room = 0 }) {
  const c = letterOf(ch), [x0, y0, , y1] = G.box, capH = y1 - y0, lv = lvOf(rich), hd = HAND();
  if (big) { const pc = dropPiece(c, capH, seed, lv, hd, keep, { room }); return { ...one(put(pc, x0, y0, 'drop', [c, capH.toFixed(1), seed, lv, sd(PAGE)].join(','))), width: initial.width(c) * capH }; }
  // (a capital set larger than its line rises toward the line above: kept below that line's words, its foot on its own baseline)
  // (the words' rects are padded by 3 px; the line above's box reaches half its leading below its words, the leading read
  // from the pitch of the rows above)
  const x1 = G.box[2], near = keep.filter(r => r[0] < x1 + u && r[2] > x0 - u && r[3] <= y1 - capH * .5 && r[3] > y0 - capH * 2.5).sort((a, b) => b[3] - a[3]), r = near[0];
  let top = y0; if (r) { const r2 = near.find(q => q[1] < r[1] - 4), lh = r2 ? r[1] - r2[1] : (r[3] - r[1]) * 1.3; top = Math.max(y0, r[3] - 3 + (lh - (r[3] - r[1] - 6)) / 2 + 2.5); }
  const H = y1 - top;
  const e = ext(c, true), k = H / (e[3] - e[1]), s = sd(seed);
  let pc;
  if (KIND === 'section') { const o = outline(c, 0, -e[1] * k, k); pc = mk([{ pen: P().black, paths: o.contours.map(closed) }, ...(lv ? [{ pen: P().red, paths: hatch(o.contours, hd.ang, Math.max(.45 * MM, hd.gap * .7), { inset: .15 * MM }) }] : [])], s); }
  else pc = mk([{ pen: P().red, paths: hershey(c, 0, 0, k, 'duplex').paths.map(p => p.map(([x, y]) => [x - e[0] * k, y - e[1] * k])) }], s);
  return { ...one(put(pc, x0, top, 'line', [c, H.toFixed(1), seed, lv, sd(PAGE)].join(','))), width: initial.line(c) * capH };
}
initial.width = ch => KIND === 'office' ? Math.max(inkW(letterOf(ch)), inkW(letterOf(ch)) * (1 - 2 * BOX) + 2 * BOX) + .06 : inkW(letterOf(ch)) + .06;
initial.line = ch => inkW(letterOf(ch), true) + .06;
initial.lines = 4; initial.phone = 3; initial.margin = .38;
initial.load = () => Promise.resolve();   // (no face to load: the letters are path data)

// ---- the paraph, fillers, breaks -----------------------------------------------------------------------------------------------
// the paraph, centred in the indent's gap on the first line's baseline: the page's mark; plain, its outline only
function paraph(x, base, u, seed, rich = .5) {
  const lv = lvOf(rich), hd = HAND(), s = sd(seed), r = rng(s * 5 + 1), fs = u * 2.2, sz = u * (.5 + .06 * r()) * (lv >= 4 ? 1.15 : 1);
  let pc;
  if (KIND === 'section') { const c = shape(hd.mark, 0, 0, sz, r() * .3 - .15), a = hd.ang + Math.PI / 2 * (r() < .5 ? 1 : 0);
    pc = mk([{ pen: P().black, paths: [closed(c)] }, ...(lv ? [{ pen: P().red, paths: [...hatch([c], a, .5 * MM, { inset: .15 * MM }), ...(lv >= 3 ? hatch([c], a + Math.PI / 2, .6 * MM, { inset: .15 * MM }) : [])] }] : [])], s); }
  else { const c = shape(hd.mark, 0, 0, sz * .9, hd.mark === 'hexagon' ? r() * .5 : 0);
    pc = mk([{ pen: P().red, paths: lv ? [...hatch([c], 0, .3 * MM * .95, { phase: .5 }), closed(c), ...(lv >= 4 ? [closed(shape(hd.mark, 0, 0, sz * 1.35))] : [])] : [closed(c)] }], s); }
  return one(put(pc, x + u * .825, base - pc.H / 2 - pc.at[1] - pc.H / 2 - u * .02, 'paraph', [x.toFixed(1), u.toFixed(2), seed, lv, sd(PAGE)].join(',')));
}
// a paragraph's free end (from modest) and a heading's run-out (from plain), between x0 and x1 on the x-height's middle
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  if (kind === 'none') return none;
  const u = yBase - yTop, lv = lvOf(rich), hd = HAND(), s = sd(seed), mid = yBase - u * .5, a = x0 + u * .3, w = x1 - a - u * .2, fs = u * 2.2;
  if (w < u * 3) return none;
  let pc;
  if (kind === 'rule') {
    if (lv === 0) pc = mk([{ pen: KIND === 'office' ? P().heavy : P().black, paths: [line(0, 0, w, 0)] }], s);
    else if (KIND === 'section') { if (lv === 1) pc = mk([{ pen: P().black, paths: [closed([[0, -u * .3], [w, 0], [0, u * .3]])] }], s);
      else { pc = SEC.runout(w, u * 2.2 * 1.25, s, hd); if (lv >= 4) pc = mk([...pc.layers, { pen: P().black, paths: [Object.assign(line(w + 1.4 * MM, 0, w + 1.45 * MM, 0), { fixed: true })] }], s); } }
    else pc = lv === 1 ? mk([{ pen: P().heavy, paths: [line(0, 0, w, 0)] }, { pen: P().red, paths: [line(0, 1.4 * MM, w * .5, 1.4 * MM)] }], s) : OFF.runout(w, u, s, hd);
    return one(put(pc, a, mid, 'runout', [a.toFixed(1), w.toFixed(1), u.toFixed(2), seed, lv, sd(PAGE)].join(',')));
  }
  if (lv === 0) return none;
  if (KIND === 'section') { const h = u * .62;
    if (lv === 1) pc = mk([{ pen: P().black, paths: [line(0, -h / 2, w, -h / 2), line(w, h / 2, 0, h / 2)] }], s);
    else { pc = SEC.filler(w * (lv >= 4 ? .9 : 1), u * 2.2, s, { ...hd, gap: hd.gap * (lv >= 3 ? .85 : 1) }); if (lv >= 4) { const c = shape(hd.mark, w - u * .45, 0, u * .4); pc = mk([{ pen: P().black, paths: [...pc.layers[0].paths, closed(c)] }, { pen: P().red, paths: [...(pc.layers[1]?.paths ?? []), ...hatch([c], hd.ang, .5 * MM, { inset: .15 * MM })] }], s); } } }
  else { const f = OFF.filler(w, u * 2.2, s, hd);
    pc = lv === 1 ? mk([{ pen: P().black, paths: f.layers[0].paths }], s) : lv >= 3 ? mk([f.layers[0], { pen: P().red, paths: [Object.assign(line(w + 1.6 * MM, 0, w + 1.65 * MM, 0), { fixed: true }), ...(lv >= 4 ? [closed(shape(hd.mark, w + 3.6 * MM, 0, u * .32))] : [])] }], s) : f; }
  return one(put(pc, a, mid, 'filler', [a.toFixed(1), w.toFixed(1), u.toFixed(2), seed, lv, sd(PAGE)].join(',')));
}
// three ranks: a part's (1), a chapter's (3), the end (2), each lifted a step by the budget (plain lowers it)
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8, index = 1, room = null) {
  const lv = lvOf(rich), hd = HAND(), s = sd(seed), fs = u * 2.2, r0 = rank === 2 ? 3 : rank >= 3 ? 2 : 1, rr = lv === 0 ? Math.max(1, r0 - 1) : lv >= 3 && r0 === 1 ? 2 : r0;
  const deep = room && room[1] - room[0] > 0 ? room[1] - room[0] : u * 14;
  let pc;
  if (KIND === 'section') {
    if (rr === 1) pc = SEC.brk(1, measure, deep, s, fs, lv === 0 ? { ...hd, small: 'dwell' } : hd);
    else if (rr === 2) pc = SEC.brk(2, measure, deep, s, fs, hd);
    else { pc = SEC.brk(3, measure * (lv >= 4 ? 1 : .8), deep, s, fs, hd); if (pc.H > deep * .92) pc = SEC.brk(2, measure, deep, s, fs, hd); } }
  else {
    if (rr === 1) pc = OFF.brk(1, measure, deep, s, fs, hd);
    else if (rr === 2) pc = OFF.brk(2, measure, deep, s, fs, hd);
    else { pc = OFF.brk(3, measure, deep, s, fs, hd);
      // (lavish: a scale ruled under the legend, a tick every millimetre, every fifth longer)
      if (lv >= 4) { const w = pc.W * .8, tk = [line(-w / 2, pc.H * .9, w / 2, pc.H * .9)]; for (let x = -w / 2, i = 0; x <= w / 2; x += MM, i++) tk.push(line(x, pc.H * .9, x, pc.H * .9 - (i % 5 ? .8 : 1.6) * MM));
        pc = mk([pc.layers[0], { pen: P().red, paths: tk }], s); } } }
  if (pc.H > deep * .95) return none;
  return one(put(pc, cx, y, 'break' + rr, [cx.toFixed(1), y.toFixed(1), measure.toFixed(0), rr, seed, lv, sd(PAGE)].join(',')));
}

// ---- frames ----------------------------------------------------------------------------------------------------------------------
const linesBox = (box, lines) => !lines?.length ? box : [Math.min(...lines.map(L => L.left)), lines[0].top, Math.max(...lines.map(L => L.right)), lines.at(-1).base];
const key = (...a) => a.map(v => typeof v === 'number' ? v.toFixed(1) : v).join(',');
const frames = {
  // a quotation (from modest): B, a bar in section down its margin; A, crop marks at its corners
  quote: ({ box, lines, u, seed = 1, rich = .5, limit = [0, 1e5] }) => { const lv = lvOf(rich); if (lv < 1) return none; const L = linesBox(box, lines), hd = HAND(), s = sd(seed);
    if (KIND === 'section') { const bw = Math.min((1.6 + .4 * lv) * MM, (L[0] - box[0]) * .6), x1 = L[0] - u * .9, x0 = x1 - bw; if (x0 < limit[0] + 2 || bw < MM) return none;
      const h = L[3] - L[1] + u * .6, bar = [[0, 0], [bw, 0], [bw, h], [0, h]], pc = mk([{ pen: P().black, paths: [closed(bar), ...(lv >= 3 ? [line(-.8 * MM, 0, bw + .8 * MM, 0), line(-.8 * MM, h, bw + .8 * MM, h)] : [])] }, { pen: P().red, paths: hatch([bar], hd.ang, .7 * MM, { inset: .18 * MM }) }], s);
      return one(put(pc, x0, L[1] - u * .5, 'quote', key(x0, L[1], h, bw, seed, lv, sd(PAGE)))); }
    const x0 = Math.max(limit[0] + 2, L[0] - u * 2.2), x1 = L[2] + u * 1.4, y0 = L[1] - u * 1.2, y1 = L[3] + u * 1.4, a = Math.min((2.4 + .3 * lv) * MM, (L[0] - x0) * .85), Ls = [];
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]]) { const ax = sx > 0 ? Math.min(a, L[0] - x - u * .4) : Math.min(a, x - L[2] - u * .4);
      Ls.push([[x + sx * ax, y], [x, y], [x, y + sy * a]]); if (lv >= 4) Ls.push(line(x + sx * ax * .5, y - sy * .8 * MM, x + sx * ax * .5, y + sy * .8 * MM)); }
    return one(put(mk([{ pen: P().black, paths: Ls }], s), 0, 0, 'quote', key(x0, y0, x1, y1, seed, lv, sd(PAGE)))); },
  // an aside (from usual): B, its corners in section (two, all four at lavish); A, crop marks, a line type along its head from fine
  aside: ({ box, lines, u, seed = 1, rich = .5 }) => { const lv = lvOf(rich); if (lv < 2) return none; const hd = HAND(), s = sd(seed), [x0, y0, x1, y1] = box, L = linesBox([x0 + u, y0 + u, x1 - u, y1 - u], lines);
    const d = Math.min(u * 2, (L[0] - x0) * .8, (L[1] - y0) * .8);
    if (KIND === 'section') { const cs = [[x0, y0, 1, 1], [x1, y1, -1, -1], ...(lv >= 4 ? [[x1, y0, -1, 1], [x0, y1, 1, -1]] : [])].map(([x, y, sx, sy]) => [[x, y], [x + sx * d, y], [x, y + sy * d]]);
      return one(put(mk([{ pen: P().black, paths: cs.map(closed) }, { pen: P().red, paths: hatch(cs, hd.ang, .55 * MM, { inset: .15 * MM }) }], s), 0, 0, 'aside', key(...box, seed, lv, sd(PAGE)))); }
    const Ls = []; for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]]) Ls.push([[x + sx * d, y], [x, y], [x, y + sy * d]]);
    const layers = [{ pen: P().black, paths: Ls }]; if (lv >= 3) { const yy = (y0 + L[1]) / 2; layers.push({ pen: P().red, paths: dashes([[x0 + d * 1.6, yy], [x1 - d * 1.6, yy]], [3 * MM, 1 * MM, .05, 1 * MM]) }); }
    return one(put(mk(layers, s), 0, 0, 'aside', key(...box, seed, lv, sd(PAGE)))); },
  // a pull quote (from modest): B, a wedge in section above and below, meeting at the middle; A, a rule above and below,
  // split at fine by the page's filled mark
  pull: ({ cx, yTop, yBot, measure, u, seed = 1, rich = .5 }) => { const lv = lvOf(rich); if (lv < 1) return none; const hd = HAND(), s = sd(seed), w = Math.min(measure * .42, u * 26), h = u * .55;
    if (KIND === 'section') { const sh = y => [[[-w / 2, y], [0, y - h], [w / 2, y], [0, y + h]]].map(c => c), cs = [sh(yTop + u * .6)[0], sh(yBot - u * .6)[0]];
      return one(put(mk([{ pen: P().black, paths: cs.map(closed) }, { pen: P().red, paths: [...hatch(cs, hd.ang, (lv >= 3 ? .55 : .75) * MM, { inset: .15 * MM }), ...(lv >= 4 ? hatch(cs, hd.ang + Math.PI / 2, .7 * MM, { inset: .15 * MM }) : [])] }], s), cx, 0, 'pull', key(cx, yTop, yBot, w, seed, lv, sd(PAGE)))); }
    const g = lv >= 3 ? u * 1.4 : 0, rule = y => g ? [line(-w / 2, y, -g, y), line(g, y, w / 2, y)] : [line(-w / 2, y, w / 2, y)], ya = yTop + u * .6, yb = yBot - u * .6;
    const layers = [{ pen: P().heavy, paths: [...rule(ya), ...rule(yb)] }, ...(lv >= 2 ? [{ pen: P().black, paths: [line(-w * .3, ya + 1.2 * MM, w * .3, ya + 1.2 * MM), line(-w * .3, yb - 1.2 * MM, w * .3, yb - 1.2 * MM)] }] : [])];
    if (g) { const c1 = shape(hd.mark, 0, ya, u * .35), c2 = shape(hd.mark, 0, yb, u * .35); layers.push({ pen: P().red, paths: [...hatch([c1], 0, .28 * MM), ...hatch([c2], 0, .28 * MM), closed(c1), closed(c2)] }); }
    return one(put(mk(layers, s), cx, 0, 'pull', key(cx, yTop, yBot, w, seed, lv, sd(PAGE)))); },
  // a figure (from usual): A, a drawing sheet's border round figure and caption (an inner border from fine, its title block
  // lettered at lavish); B, a strip in section over the figure and under its caption
  figure: ({ box, cap, u, seed = 1, rich = .5, room = null, n = 1, limit = [0, 1e5] }) => { const lv = lvOf(rich); if (lv < 2) return none; const hd = HAND(), s = sd(seed);
    const X0 = Math.max(limit[0] + u * .5, box[0] - u * 1.4), X1 = Math.min(limit[1] - u * .5, box[2] + u * 1.4), Y0 = Math.max(room?.[0] ?? -1e9, box[1] - u * 2), Y1 = Math.min(room?.[1] ?? 1e9, (cap ?? box[3]) + u * 2);
    if (KIND === 'section') { const h = u * .55, st = y => [[X0, y - h / 2], [X1, y - h / 2], [X1, y + h / 2], [X0, y + h / 2]], cs = [st(Math.max(Y0 + h, box[1] - u * 1.2)), st(Math.min(Y1 - h, (cap ?? box[3]) + u * 1.2))];
      const tk = lv >= 4 ? cs.flatMap(c => [line(X0, c[0][1] - .8 * MM, X0, c[2][1] + .8 * MM), line(X1, c[0][1] - .8 * MM, X1, c[2][1] + .8 * MM)]) : [];
      return one(put(mk([{ pen: P().black, paths: [...cs.map(closed), ...tk] }, { pen: P().red, paths: hatch(cs, hd.ang, (lv >= 3 ? .55 : .7) * MM, { inset: .15 * MM }) }], s), 0, 0, 'figure', key(X0, Y0, X1, Y1, seed, lv, sd(PAGE)))); }
    const o = 1.2 * MM, paths = [closed([[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]])]; if (lv >= 3) paths.push(closed([[X0 + o, Y0 + o], [X1 - o, Y0 + o], [X1 - o, Y1 - o], [X0 + o, Y1 - o]]));
    const layers = [{ pen: P().black, paths }];
    if (lv >= 4 && Y0 + o * 2 < box[1] - u * .3) { const t = hershey(`FIG. ${n}`, 0, 0, Math.max(1.8 * MM, u * .55), 'simplex'), tx = X1 - o * 2 - t.w, ty = Y0 + o + (box[1] - Y0 - o) / 2 + t.w * 0 + u * .25;
      layers.push({ pen: P().red, paths: t.paths.map(p => p.map(([x, y]) => [x + tx, y + ty])) }); }
    return one(put(mk(layers, s), 0, 0, 'figure', key(X0, Y0, X1, Y1, seed, lv, sd(PAGE)))); },
  // code (from usual): A, a ruler down its margin, a tick at every row and a longer one every fifth; B, a strip in
  // section across its head
  code: ({ box, rows, u, seed = 1, rich = .5 }) => { const lv = lvOf(rich); if (lv < 2) return none; const hd = HAND(), s = sd(seed), R = rows?.length ? rows : [];
    if (KIND === 'office') { const left = R.length ? Math.min(...R.map(r => r.left)) : box[0] + u * 3, x = Math.max(box[0] + u * .6, left - u * 2.4), tk = [];
      if (!R.length) return none; const t0 = R[0].top, t1 = R.at(-1).base + u * .4;
      R.forEach((r, i) => tk.push(line(x, r.base - u * .5, x + (i % 5 ? .8 : 1.6) * MM * (lv >= 3 ? 1.2 : 1), r.base - u * .5)));
      return one(put(mk([{ pen: P().black, paths: [line(x, t0, x, t1)] }, { pen: P().red, paths: tk }], s), 0, 0, 'code', key(...box, R.length, seed, lv, sd(PAGE)))); }
    const top = R.length ? R[0].top : box[1] + u * 3, h = u * .55, y = Math.max(box[1] + h, top - u * 1.6), x0 = box[0] + u * 1.6, x1 = box[2] - u * 1.6, c = [[x0, y - h / 2], [x1, y - h / 2], [x1, y + h / 2], [x0, y + h / 2]];
    return one(put(mk([{ pen: P().black, paths: [closed(c)] }, { pen: P().red, paths: hatch([c], hd.ang, (lv >= 3 ? .55 : .7) * MM, { inset: .15 * MM }) }], s), 0, 0, 'code', key(...box, seed, lv, sd(PAGE)))); },
  // the contents: B, the page's mark before each entry (sectioned from usual); A, a scale beside the entries, a tick at each
  nav: ({ box, entries, u, seed = 1, rich = .5 }) => { const E = entries.filter(Boolean); if (!E.length) return none; const lv = lvOf(rich), hd = HAND(), s = sd(seed);
    const x = Math.max(4, Math.min(...E.map(e => e.left)) - u * 2.4);
    if (KIND === 'section') { const cs = E.map(e => shape(hd.mark, x, e.base - u * .5, u * .32));
      return one(put(mk([{ pen: P().black, paths: cs.map(closed) }, ...(lv >= 2 ? [{ pen: P().red, paths: hatch(cs, hd.ang, .45 * MM, { inset: .12 * MM }) }] : [])], s), 0, 0, 'nav', key(x, E.length, E[0].base, seed, lv, sd(PAGE)))); }
    const y0 = E[0].base - u * 1.2, y1 = E.at(-1).base, tk = E.map(e => line(x - (lv >= 2 ? 1.6 : 1) * MM, e.base - u * .5, x, e.base - u * .5));
    return one(put(mk([{ pen: P().black, paths: [line(x, y0, x, y1)] }, { pen: P().red, paths: tk }], s), 0, 0, 'nav', key(x, E.length, E[0].base, seed, lv, sd(PAGE)))); },
};

// ---- printing --------------------------------------------------------------------------------------------------------------------
// Each piece printed once through the ink engine at the device's resolution and kept by what it is (kind, place, seed,
// budget, the page's hand), wherever it stands, a page's together; drawn, plotted on its own canvas as the machine would,
// then the still's.
export const TIME = { build: 0, pieces: 0 };
const MADE = new Map(), LIVE = new Set();
const PAD = 3;   // (the canvas's margin round the ink: plotter-pen.js print's pad)
function keep(k, cv) { const m = { canvas: cv, w: cv.width, h: cv.height }; if (MADE.size > 400) MADE.clear(); MADE.set(k, m); return m; }
function still(b, d, theme) { const k = [theme, d, b.bkey].join('|'); let m = MADE.get(k);
  if (!m) { const t0 = performance.now(); m = keep(k, printMany([b.pc], theme, { dpr: d })[0]); TIME.build += performance.now() - t0; TIME.pieces++; }
  return m; }
// a page's still pieces gathered while the host makes its cases, then printed together (kit/styles/plotter-pen.js
// printMany: one copy out of the GPU per pen for the lot), the host awaiting each case's `ready`
let BATCH = null;
function later(b, d, theme) { const k = [theme, d, b.bkey].join('|'), m = MADE.get(k); if (m) return m.ready ?? m;
  if (!BATCH) { const B = BATCH = { jobs: [] }; B.done = new Promise(ok => setTimeout(() => { BATCH = null;
    const t0 = performance.now(), groups = new Map(); for (const j of B.jobs) { const g = j.theme + '|' + j.d; (groups.get(g) ?? groups.set(g, []).get(g)).push(j); }
    for (const js of groups.values()) printMany(js.map(j => j.b.pc), js[0].theme, { dpr: js[0].d }).forEach((cv, i) => Object.assign(js[i].m, { canvas: cv, w: cv.width, h: cv.height, ready: null }));
    TIME.build += performance.now() - t0; TIME.pieces += B.jobs.length; ok(); })); }
  const e = { ready: null }; e.ready = BATCH.done.then(() => e); BATCH.jobs.push({ b, d, theme, m: e }); if (MADE.size > 400) MADE.clear(); MADE.set(k, e); return e.ready; }
function print(made, { dpr = 1, animate = false, wait = false } = {}) {
  const d = Math.min(3, Math.max(1, dpr)), theme = isDark() ? 'dark' : 'light', all = [], seq = [], waits = [];
  for (const b of made.letters ?? []) { if (b.shape !== 'plotter') continue;
    const X = b.x - PAD, Y = b.y - PAD, pour = { res: d, col: 'k', x0: X, y0: Y };
    if (animate) {
      // (one of three plotters' sheets, taken while it draws: a page read quickly may have two pieces moving at once)
      let w = null, slot = null; const fin = g => { const m = still(b, d, theme); g.drawImage(m.canvas, X, Y, m.w / d, m.h / d); };
      const dur = Math.min(b.what === 'drop' ? 6 : 3, Math.max(.6, (writer(b.pc, theme, { dpr: d, max: 6 }).dur) / 1000));
      Object.assign(pour, { w: (b.w + 2 * PAD) * d, h: (b.h + 2 * PAD) * d, paint: fin,
        grow: { mode: 'reveal', fn: (g, f) => {
          if (f >= 1) { if (slot) { LIVE.delete(slot); slot = null; } return fin(g); }
          if (!w) { slot = ['live-0', 'live-1', 'live-2'].find(k => !LIVE.has(k)); if (!slot) return; LIVE.add(slot); w = writer(b.pc, theme, { dpr: d, max: 6, slot }); }
          w.at(f); g.drawImage(w.cv, X, Y, w.cv.width / d, w.cv.height / d); } } });
      seq.push({ pour, d: dur });
    } else {
      const m = wait ? later(b, d, theme) : still(b, d, theme), place = m => Object.assign(pour, { w: m.w, h: m.h, paint: g => g.drawImage(m.canvas, X, Y, m.w / d, m.h / d) });
      if (m.then) { pour.ready = m.then(place); waits.push(pour.ready); } else place(m);
      seq.push({ pour, d: 0 }); }
    all.push(pour); }
  const ys = (made.letters ?? []).map(b => b.y);
  return { pours: all, letters: [], seq, runs: [], y0: ys.length ? Math.min(...ys) : 0, ready: waits.length ? Promise.all(waits) : undefined };
}
// a case on the plotter's clock: its pieces one after another, each over the time the machine takes (held to a cap)
function timeline(pr, kind, animate) {
  const own = []; let t = 0;
  for (const e of pr.seq) { const d = animate ? e.d : 0; own.push({ t0: t, t1: t + d, pour: e.pour }); t += d; }
  return { own, u: Math.max(t, .01), cap: kind === 'drop' ? 7 : 4 };
}

export const palette = { light: { k: [187, 49, 41] }, dark: { k: [232, 106, 92] } };
export const plotter = { label: 'Plotter', minGap: 2, theme: { rubric: 'rgb(187 49 41)', rubricDark: 'rgb(232 106 92)' },
  setup: SEED => { PAGE = SEED >>> 0 || 1; return {}; }, kinds: (v, rich) => rich < .25 ? ['none'] : ['row'],
  fillAt: { gap: .6, head: 3, rise: 1 }, steady: ['drop'],
  paraph, filler, breakMark, initial, frames, palette, print, timeline,
  // kind: 'section' (B, the default) | 'office' (A). No `variant` getter: rubricate's cache key would gain the kind only
  // once the module is in the registry, so a page's first render (a baked page) and its next (a redraw) would ask for
  // two keys, and the second, finding nothing, would clear the baked ornament and draw it again (a pop). A host that
  // switches kinds names the kind in its `variant` option, as the site does ('kind=section').
  set kind(v) { KIND = v === 'office' ? 'office' : 'section'; }, get kind() { return KIND; } };
export default plotter;
